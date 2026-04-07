import { getGoogleLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { useCallback } from "react";

export function useGoogleAuth() {
  const utils = trpc.useUtils();

  const startGoogleLogin = useCallback(() => {
    window.location.href = getGoogleLoginUrl();
  }, []);

  // After the Google OAuth callback redirects back with a session cookie,
  // invalidate the auth cache so the app picks up the new user.
  const refreshAfterLogin = useCallback(async () => {
    await utils.auth.me.invalidate();
  }, [utils]);

  return {
    startGoogleLogin,
    refreshAfterLogin,
  };
}
