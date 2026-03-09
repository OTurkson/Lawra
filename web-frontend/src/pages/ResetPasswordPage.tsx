import { FormEvent, useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import signupHero from "@/assets/signup-hero.jpg";
import { useToast } from "@/hooks/use-toast";
import { resetPassword } from "@/lib/api";

const ResetPasswordPage = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") ?? "";

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    setNewPassword("");
    setConfirmPassword("");
  }, [token]);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();

    if (!token) {
      toast({
        title: "Invalid link",
        description: "Your password reset link is missing or invalid.",
      });
      return;
    }

    if (!newPassword || !confirmPassword) {
      toast({
        title: "Missing details",
        description: "Please enter and confirm your new password.",
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      toast({
        title: "Passwords do not match",
        description: "Both password fields must match.",
      });
      return;
    }

    try {
      setIsSubmitting(true);
      await resetPassword({ token, newPassword });

      toast({
        title: "Password updated",
        description: "You can now sign in with your new password.",
      });

      navigate("/");
    } catch (error: any) {
      toast({
        title: "Reset failed",
        description: error?.message || "Your reset link may have expired. Please request a new one.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen">
      <div className="hidden lg:flex lg:w-1/2 relative">
        <img src={signupHero} alt="Lawra reset password" className="w-full h-full object-cover" />
        <div className="absolute top-8 left-8">
          <div className="flex items-center gap-2">
            <div className="w-8 h-10 bg-primary-foreground rounded-full flex items-center justify-center">
              <div className="w-3 h-3 bg-primary-foreground rounded-full" />
            </div>
            <span className="text-primary-foreground text-3xl font-display">lawra</span>
          </div>
          <p className="text-primary-foreground text-sm mt-1 opacity-80">Now, you can lend a hand</p>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center bg-card px-8 lg:px-16">
        <div className="w-full max-w-md">
          <h1 className="text-3xl font-light text-foreground mb-1">Reset password</h1>
          <p className="text-muted-foreground text-sm mb-10">
            Choose a new password for your Lawra account
          </p>

          <form className="space-y-6" onSubmit={handleSubmit} autoComplete="off">
            <div>
              <label className="block text-primary font-semibold text-sm mb-2">New password</label>
              <input
                type="password"
                placeholder="New password"
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
                autoComplete="off"
                className="w-full px-5 py-3 rounded-full border border-primary/40 bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
              />
            </div>

            <div>
              <label className="block text-primary font-semibold text-sm mb-2">Confirm new password</label>
              <input
                type="password"
                placeholder="Repeat new password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                autoComplete="off"
                className="w-full px-5 py-3 rounded-full border border-primary/40 bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="block w-full text-center py-4 rounded-full signup-btn-gradient text-primary-foreground text-lg font-semibold shadow-lg hover:opacity-90 transition-opacity mt-8 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isSubmitting ? "Updating password..." : "Update password"}
            </button>

            <p className="text-center text-muted-foreground text-sm">
              Remembered your password?{" "}
              <Link to="/" className="text-primary font-semibold hover:underline">
                Go back to sign in
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ResetPasswordPage;
