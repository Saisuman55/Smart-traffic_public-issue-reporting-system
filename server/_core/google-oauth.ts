import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import type { Express, Request, Response } from "express";
import * as db from "../db";
import { getSessionCookieOptions } from "./cookies";
import { ENV } from "./env";
import { sdk } from "./sdk";

const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GOOGLE_USERINFO_URL = "https://www.googleapis.com/oauth2/v2/userinfo";

interface GoogleTokenResponse {
  access_token: string;
  id_token?: string;
  token_type: string;
  expires_in: number;
  scope: string;
}

interface GoogleUserInfo {
  id: string;
  email: string;
  verified_email: boolean;
  name: string;
  given_name?: string;
  family_name?: string;
  picture?: string;
  locale?: string;
}

async function exchangeGoogleCode(
  code: string,
  redirectUri: string
): Promise<GoogleTokenResponse> {
  const params = new URLSearchParams({
    code,
    client_id: ENV.googleClientId,
    client_secret: ENV.googleClientSecret,
    redirect_uri: redirectUri,
    grant_type: "authorization_code",
  });

  const response = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params.toString(),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Google token exchange failed: ${error}`);
  }

  return response.json() as Promise<GoogleTokenResponse>;
}

async function getGoogleUserInfo(accessToken: string): Promise<GoogleUserInfo> {
  const response = await fetch(GOOGLE_USERINFO_URL, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Google user info fetch failed: ${error}`);
  }

  return response.json() as Promise<GoogleUserInfo>;
}

function getQueryParam(req: Request, key: string): string | undefined {
  const value = req.query[key];
  return typeof value === "string" ? value : undefined;
}

export function registerGoogleOAuthRoutes(app: Express) {
  // Redirect to Google's OAuth consent screen
  app.get("/api/oauth/google", (_req: Request, res: Response) => {
    if (!ENV.googleClientId || !ENV.googleRedirectUri) {
      res.status(503).json({ error: "Google OAuth is not configured" });
      return;
    }

    const params = new URLSearchParams({
      client_id: ENV.googleClientId,
      redirect_uri: ENV.googleRedirectUri,
      response_type: "code",
      scope: "openid email profile",
      access_type: "offline",
      prompt: "select_account",
    });

    res.redirect(302, `https://accounts.google.com/o/oauth2/v2/auth?${params}`);
  });

  // Google OAuth callback – exchange code for user session
  app.get("/api/oauth/google/callback", async (req: Request, res: Response) => {
    const code = getQueryParam(req, "code");
    const error = getQueryParam(req, "error");

    if (error) {
      console.error("[Google OAuth] Consent screen returned error:", error);
      res.redirect(302, "/login?error=google_auth_failed");
      return;
    }

    if (!code) {
      res.status(400).json({ error: "Authorization code is required" });
      return;
    }

    try {
      const redirectUri =
        ENV.googleRedirectUri ||
        `${req.protocol}://${req.get("host")}/api/oauth/google/callback`;

      const tokenResponse = await exchangeGoogleCode(code, redirectUri);
      const googleUser = await getGoogleUserInfo(tokenResponse.access_token);

      if (!googleUser.id) {
        res.status(400).json({ error: "Could not retrieve Google user id" });
        return;
      }

      // Use google: prefix so it is distinct from Manus openIds
      const openId = `google:${googleUser.id}`;

      const isAdmin =
        googleUser.email?.toLowerCase() === ENV.adminEmail?.toLowerCase();

      await db.upsertUser({
        openId,
        name: googleUser.name || null,
        email: googleUser.email ?? null,
        loginMethod: "google",
        lastSignedIn: new Date(),
        ...(isAdmin ? { role: "admin" } : {}),
      });

      const sessionToken = await sdk.createSessionToken(openId, {
        name: googleUser.name || "",
        expiresInMs: ONE_YEAR_MS,
      });

      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, sessionToken, {
        ...cookieOptions,
        maxAge: ONE_YEAR_MS,
      });

      res.redirect(302, "/");
    } catch (err) {
      console.error("[Google OAuth] Callback failed", err);
      res.redirect(302, "/login?error=google_auth_failed");
    }
  });
}
