import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { MapPin, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/_core/hooks/useAuth";
import { useGoogleAuth } from "@/_core/hooks/useGoogleAuth";
import { getLoginUrl } from "@/const";
import EmailOtpDialog from "@/components/EmailOtpDialog";

export default function LoginPage() {
  const { isAuthenticated } = useAuth();
  const { startGoogleLogin } = useGoogleAuth();
  const [, navigate] = useLocation();
  const [otpDialogOpen, setOtpDialogOpen] = useState(false);

  // Read ?error= param from URL (set by Google OAuth callback on failure)
  const urlParams = new URLSearchParams(window.location.search);
  const authError = urlParams.get("error");

  // Redirect if already signed in
  useEffect(() => {
    if (isAuthenticated) {
      navigate("/");
    }
  }, [isAuthenticated, navigate]);

  const handleManusLogin = () => {
    window.location.href = getLoginUrl();
  };

  const handleOtpSuccess = () => {
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex flex-col">
      {/* Header */}
      <nav className="border-b border-gray-200 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center gap-2">
          <MapPin className="w-6 h-6 text-blue-600" />
          <h1 className="text-xl font-bold text-gray-900">The Civic Authority</h1>
        </div>
      </nav>

      {/* Login Card */}
      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center space-y-2">
            <div className="mx-auto w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <MapPin className="w-6 h-6 text-blue-600" />
            </div>
            <CardTitle className="text-2xl">Sign in to continue</CardTitle>
            <CardDescription>
              Choose how you'd like to sign in to The Civic Authority.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            {authError && (
              <div className="bg-red-50 border border-red-200 rounded-md px-4 py-3 text-sm text-red-700">
                {authError === "google_auth_failed"
                  ? "Google sign-in failed. Please try again or use another method."
                  : "Sign-in failed. Please try again."}
              </div>
            )}

            {/* Google OAuth */}
            <Button
              className="w-full flex items-center gap-3"
              variant="outline"
              onClick={startGoogleLogin}
            >
              <GoogleIcon className="w-5 h-5" />
              Continue with Google
            </Button>

            {/* Email OTP */}
            <Button
              className="w-full flex items-center gap-3"
              variant="outline"
              onClick={() => setOtpDialogOpen(true)}
            >
              <Mail className="w-5 h-5 text-gray-600" />
              Continue with Email OTP
            </Button>

            <div className="flex items-center gap-3">
              <Separator className="flex-1" />
              <span className="text-xs text-gray-400 whitespace-nowrap">or</span>
              <Separator className="flex-1" />
            </div>

            {/* Manus OAuth */}
            <Button className="w-full" onClick={handleManusLogin}>
              Sign in with Manus
            </Button>

            <p className="text-center text-xs text-gray-500 pt-2">
              By signing in you agree to report civic issues responsibly and abide by our community guidelines.
            </p>
          </CardContent>
        </Card>
      </div>

      <EmailOtpDialog
        open={otpDialogOpen}
        onOpenChange={setOtpDialogOpen}
        onSuccess={handleOtpSuccess}
      />
    </div>
  );
}

// Simple inline Google "G" icon (no external dependency)
function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </svg>
  );
}
