import { randomInt } from "crypto";
import { ENV } from "./env";

// ---------------------------------------------------------------------------
// In-memory OTP store (TTL-based)
// ---------------------------------------------------------------------------

interface OtpEntry {
  otp: string;
  expiresAt: number;
  attempts: number;
}

const OTP_STORE = new Map<string, OtpEntry>();
const OTP_TTL_MS = 10 * 60 * 1000; // 10 minutes
const MAX_ATTEMPTS = 5;

function generateOtp(digits = 6): string {
  return String(randomInt(10 ** (digits - 1), 10 ** digits));
}

export function storeOtp(email: string): string {
  const otp = generateOtp();
  OTP_STORE.set(email.toLowerCase(), {
    otp,
    expiresAt: Date.now() + OTP_TTL_MS,
    attempts: 0,
  });
  return otp;
}

export type OtpVerifyResult =
  | { success: true }
  | { success: false; reason: "not_found" | "expired" | "invalid" | "too_many_attempts" };

export function verifyOtp(email: string, otp: string): OtpVerifyResult {
  const key = email.toLowerCase();
  const entry = OTP_STORE.get(key);

  if (!entry) {
    return { success: false, reason: "not_found" };
  }

  if (Date.now() > entry.expiresAt) {
    OTP_STORE.delete(key);
    return { success: false, reason: "expired" };
  }

  entry.attempts += 1;

  if (entry.attempts > MAX_ATTEMPTS) {
    OTP_STORE.delete(key);
    return { success: false, reason: "too_many_attempts" };
  }

  if (entry.otp !== otp.trim()) {
    return { success: false, reason: "invalid" };
  }

  OTP_STORE.delete(key);
  return { success: true };
}

// ---------------------------------------------------------------------------
// Email sending via nodemailer
// ---------------------------------------------------------------------------

async function getTransporter() {
  const nodemailer = await import("nodemailer");

  return nodemailer.createTransport({
    host: ENV.smtpHost,
    port: ENV.smtpPort,
    secure: ENV.smtpPort === 465,
    auth: ENV.smtpUser
      ? { user: ENV.smtpUser, pass: ENV.smtpPassword }
      : undefined,
  });
}

export async function sendOtpEmail(email: string, otp: string): Promise<void> {
  if (!ENV.smtpUser && !ENV.smtpHost) {
    // Dev fallback: just log the OTP
    console.log(`[Email OTP] OTP for ${email}: ${otp}`);
    return;
  }

  try {
    const transporter = await getTransporter();

    await transporter.sendMail({
      from: `"Smart Traffic System" <${ENV.smtpFromEmail || ENV.smtpUser}>`,
      to: email,
      subject: "Your verification code – Smart Traffic System",
      text: `Your one-time verification code is: ${otp}\n\nThis code will expire in 10 minutes.\n\nIf you did not request this, please ignore this email.`,
      html: `
        <div style="font-family:sans-serif;max-width:480px;margin:0 auto">
          <h2 style="color:#2563eb">Smart Traffic System</h2>
          <p>Your one-time verification code is:</p>
          <div style="font-size:2.5rem;font-weight:bold;letter-spacing:0.3em;color:#1e40af;margin:24px 0">
            ${otp}
          </div>
          <p style="color:#6b7280;font-size:0.875rem">
            This code expires in <strong>10 minutes</strong>.<br/>
            If you did not request this code, please ignore this email.
          </p>
        </div>
      `,
    });
  } catch (err) {
    console.error("[Email OTP] Failed to send email:", err);
    // Rethrow so caller can handle it
    throw err;
  }
}
