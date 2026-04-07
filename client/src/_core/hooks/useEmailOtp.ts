import { trpc } from "@/lib/trpc";

export function useEmailOtp() {
  const requestOtpMutation = trpc.auth.requestOtp.useMutation();
  const verifyOtpMutation = trpc.auth.verifyOtp.useMutation();

  const requestOtp = async (email: string) => {
    await requestOtpMutation.mutateAsync({ email });
  };

  const verifyOtp = async (email: string, otp: string) => {
    await verifyOtpMutation.mutateAsync({ email, otp });
  };

  return {
    requestOtp,
    verifyOtp,
    isRequestingOtp: requestOtpMutation.isPending,
    isVerifyingOtp: verifyOtpMutation.isPending,
    requestOtpError: requestOtpMutation.error,
    verifyOtpError: verifyOtpMutation.error,
    resetErrors: () => {
      requestOtpMutation.reset();
      verifyOtpMutation.reset();
    },
  };
}
