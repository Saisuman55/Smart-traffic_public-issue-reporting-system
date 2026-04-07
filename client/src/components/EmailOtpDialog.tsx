import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useEmailOtp } from "@/_core/hooks/useEmailOtp";
import { trpc } from "@/lib/trpc";

type Step = "email" | "otp" | "success";

interface EmailOtpDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export default function EmailOtpDialog({ open, onOpenChange, onSuccess }: EmailOtpDialogProps) {
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const utils = trpc.useUtils();

  const {
    requestOtp,
    verifyOtp,
    isRequestingOtp,
    isVerifyingOtp,
    requestOtpError,
    verifyOtpError,
    resetErrors,
  } = useEmailOtp();

  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await requestOtp(email);
      setStep("otp");
    } catch {
      // Error is captured in requestOtpError
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await verifyOtp(email, otp);
      await utils.auth.me.invalidate();
      setStep("success");
      setTimeout(() => {
        onOpenChange(false);
        onSuccess?.();
        resetToInitial();
      }, 1500);
    } catch {
      // Error is captured in verifyOtpError
    }
  };

  const resetToInitial = () => {
    setStep("email");
    setEmail("");
    setOtp("");
    resetErrors();
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) resetToInitial();
    onOpenChange(open);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {step === "email" && "Sign in with Email"}
            {step === "otp" && "Enter verification code"}
            {step === "success" && "Signed in!"}
          </DialogTitle>
          <DialogDescription>
            {step === "email" && "We'll send a one-time code to your email address."}
            {step === "otp" && `Enter the 6-digit code we sent to ${email}.`}
            {step === "success" && "You've been signed in successfully."}
          </DialogDescription>
        </DialogHeader>

        {step === "email" && (
          <form onSubmit={handleRequestOtp} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email address</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoFocus
              />
            </div>
            {requestOtpError && (
              <p className="text-sm text-red-600">{requestOtpError.message}</p>
            )}
            <div className="flex gap-2 justify-end">
              <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isRequestingOtp}>
                {isRequestingOtp ? "Sending…" : "Send code"}
              </Button>
            </div>
          </form>
        )}

        {step === "otp" && (
          <form onSubmit={handleVerifyOtp} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="otp">Verification code</Label>
              <Input
                id="otp"
                type="text"
                inputMode="numeric"
                placeholder="123456"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                required
                autoFocus
                maxLength={6}
                className="text-center text-2xl tracking-widest font-mono"
              />
            </div>
            {verifyOtpError && (
              <p className="text-sm text-red-600">{verifyOtpError.message}</p>
            )}
            <div className="flex gap-2 justify-between">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => { setStep("email"); resetErrors(); }}
              >
                Change email
              </Button>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={isRequestingOtp}
                  onClick={async () => {
                    resetErrors();
                    try { await requestOtp(email); } catch { /* ignore */ }
                  }}
                >
                  {isRequestingOtp ? "Resending…" : "Resend code"}
                </Button>
                <Button type="submit" disabled={isVerifyingOtp || otp.length < 6}>
                  {isVerifyingOtp ? "Verifying…" : "Verify"}
                </Button>
              </div>
            </div>
          </form>
        )}

        {step === "success" && (
          <div className="flex items-center justify-center py-6">
            <div className="text-center space-y-2">
              <div className="text-4xl">✅</div>
              <p className="text-green-600 font-medium">You're signed in!</p>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
