import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { requestPasswordReset, resetPassword } from "@/lib/api";
import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react";

export function PasswordResetPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const location = useLocation();
  const [step, setStep] = useState<"request" | "reset">("request");
  const [email, setEmail] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Get email from location state
  const locationEmail = location.state?.email;
  const locationTenantId = location.state?.tenantId;

  const requestResetMutation = useMutation({
    mutationFn: async (emailVal: string) => {
      if (!locationTenantId) throw new Error("Tenant is required for password reset");
      await requestPasswordReset({ email: emailVal, tenantId: String(locationTenantId) });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Password reset link sent to your email. Check your inbox for the reset link.",
      });
      setStep("reset");
      setEmail("");
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to request password reset. Please check your email and try again.",
        variant: "destructive",
      });
    },
  });

  const resetPasswordMutation = useMutation({
    mutationFn: async () => {
      await resetPassword({
        token: resetToken,
        newPassword: newPassword,
      });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Password reset successfully. You can now log in with your new password.",
      });
      navigate("/");
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to reset password. The link may have expired. Please request a new one.",
        variant: "destructive",
      });
    },
  });

  const handleRequestReset = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    if (!email) {
      newErrors.email = "Email is required";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    requestResetMutation.mutate(email || locationEmail);
  };

  const handleResetPassword = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    if (!resetToken) {
      newErrors.token = "Reset token is required";
    }
    if (!newPassword) {
      newErrors.password = "New password is required";
    }
    if (newPassword.length < 8) {
      newErrors.password = "Password must be at least 8 characters";
    }
    if (newPassword !== confirmPassword) {
      newErrors.confirm = "Passwords do not match";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    resetPasswordMutation.mutate();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-2">
          <CardTitle className="text-2xl">Reset Your Password</CardTitle>
          {step === "request" ? (
            <CardDescription>
              {locationEmail
                ? "Your account requires a password reset before you can log in."
                : "Enter your email to receive a password reset link"}
            </CardDescription>
          ) : (
            <CardDescription>Enter the reset token from your email and set a new password</CardDescription>
          )}
        </CardHeader>

        <CardContent>
          {step === "request" ? (
            <form onSubmit={handleRequestReset} className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium">
                  Email Address
                </label>
                <Input
                  id="email"
                  type="email"
                  placeholder="your@example.com"
                  value={email || locationEmail || ""}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={!!locationEmail}
                />
                {errors.email && <p className="text-sm text-red-500">{errors.email}</p>}
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={requestResetMutation.isPending}
              >
                {requestResetMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  "Send Reset Link"
                )}
              </Button>

              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={() => navigate("/auth/login")}
              >
                Back to Login
              </Button>
            </form>
          ) : (
            <form onSubmit={handleResetPassword} className="space-y-4">
              <Alert className="bg-blue-50 border-blue-200">
                <AlertCircle className="h-4 w-4 text-blue-600" />
                <AlertDescription className="text-blue-800">
                  Check your email for the reset token. It's typically at the end of the reset link URL.
                </AlertDescription>
              </Alert>

              <div className="space-y-2">
                <label htmlFor="token" className="text-sm font-medium">
                  Reset Token
                </label>
                <Input
                  id="token"
                  type="text"
                  placeholder="Paste the token from your email"
                  value={resetToken}
                  onChange={(e) => setResetToken(e.target.value)}
                />
                {errors.token && <p className="text-sm text-red-500">{errors.token}</p>}
              </div>

              <div className="space-y-2">
                <label htmlFor="password" className="text-sm font-medium">
                  New Password
                </label>
                <Input
                  id="password"
                  type="password"
                  placeholder="At least 8 characters"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
                {errors.password && <p className="text-sm text-red-500">{errors.password}</p>}
              </div>

              <div className="space-y-2">
                <label htmlFor="confirm" className="text-sm font-medium">
                  Confirm Password
                </label>
                <Input
                  id="confirm"
                  type="password"
                  placeholder="Confirm your new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
                {errors.confirm && <p className="text-sm text-red-500">{errors.confirm}</p>}
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={resetPasswordMutation.isPending}
              >
                {resetPasswordMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Resetting...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                    Reset Password
                  </>
                )}
              </Button>

              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={() => {
                  setStep("request");
                  setResetToken("");
                  setNewPassword("");
                  setConfirmPassword("");
                }}
              >
                Back
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
