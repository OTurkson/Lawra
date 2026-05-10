import { FormEvent, useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import signupHero from "@/assets/signup-hero.jpg";
import { useToast } from "@/hooks/use-toast";
import { ApiError, fetchTenants, login, type Tenant } from "@/lib/api";
import { saveAuth } from "@/lib/auth";
import { queryClient } from "@/lib/query-client";

const LoginPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [tenantId, setTenantId] = useState("");
  const [remember, setRemember] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [isLoadingTenants, setIsLoadingTenants] = useState(false);

  const emailInputRef = useRef<HTMLInputElement | null>(null);
  const passwordInputRef = useRef<HTMLInputElement | null>(null);
  const rememberInputRef = useRef<HTMLInputElement | null>(null);

  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    setEmail("");
    setPassword("");
    setTenantId("");
    setRemember(false);

    const timeoutId = window.setTimeout(() => {
      if (emailInputRef.current) emailInputRef.current.value = "";
      if (passwordInputRef.current) passwordInputRef.current.value = "";
      if (rememberInputRef.current) rememberInputRef.current.checked = false;
    }, 50);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, []);

  useEffect(() => {
    let isActive = true;
    setIsLoadingTenants(true);

    fetchTenants()
      .then((data) => {
        if (!isActive) return;
        setTenants(data);
        setTenantId((prev) => prev || String(data[0]?.id ?? ""));
      })
      .catch((error: any) => {
        if (!isActive) return;
        toast({
          title: "Unable to load tenants",
          description: error?.message || "Please refresh and try again.",
        });
      })
      .finally(() => {
        if (!isActive) return;
        setIsLoadingTenants(false);
      });

    return () => {
      isActive = false;
    };
  }, [toast]);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();

    if (!email || !password || !tenantId) {
      toast({
        title: "Missing details",
        description: "Fill out all fields before continuing.",
      });
      return;
    }

    const tenantUuid = tenantId; // Now it's a string UUID, not a number
    if (!tenantUuid) {
      toast({
        title: "Invalid tenant",
        description: "Please choose a tenant from the dropdown.",
      });
      return;
    }

    try {
      setIsSubmitting(true);
      const authResponse = await login({ email, password, tenantId: tenantUuid });
      
      // Check if user requires password reset
      if (authResponse.requiresPasswordReset) {
        toast({
          title: "Password Reset Required",
          description: "Your account requires a password reset before you can log in. Please check your email for the reset link.",
          variant: "destructive",
        });
        navigate("/forgot-password", {
          state: { email, tenantId: tenantUuid }
        });
        return;
      }

      queryClient.clear();
      saveAuth({
        token: authResponse.token,
        userId: authResponse.userId,
        tenantId: authResponse.tenantId,
        role: authResponse.role,
      });

      toast({
        title: "Welcome back",
        description: "You are now signed in.",
      });

      navigate("/dashboard");
    } catch (error: any) {
      if (error instanceof ApiError && error.status === 403 && (error.data as any)?.requiresPasswordReset) {
        toast({
          title: "Password Reset Required",
          description: "Your account requires a password reset before you can log in.",
          variant: "destructive",
        });
        navigate("/forgot-password", {
          state: { email, tenantId: tenantUuid }
        });
        return;
      }

      toast({
        title: "Login failed",
        description: error?.message || "Please check your details and try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen h-lvh">
      <div className="hidden lg:flex lg:w-1/2 relative">
        <img src={signupHero} alt="Lawra handshake" className="w-full h-full object-cover" />
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
          <h1 className="text-3xl font-light text-foreground mb-1">Sign in</h1>
          <p className="text-muted-foreground text-sm mb-10">Enter your workspace credentials to continue</p>

          <form className="space-y-6" onSubmit={handleSubmit} autoComplete="off">
            <div>
              <label className="block text-primary font-semibold text-sm mb-2">Email</label>
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                ref={emailInputRef}
                autoComplete="off"
                className="w-full px-5 py-3 rounded-full border border-primary/40 bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
              />
            </div>

            <div>
              <label className="block text-primary font-semibold text-sm mb-2">Tenant</label>
              <select
                value={tenantId}
                onChange={(event) => setTenantId(event.target.value)}
                disabled={isLoadingTenants || tenants.length === 0}
                className="w-full px-5 py-3 rounded-full border border-primary/40 bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
              >
                <option value="">
                  {isLoadingTenants
                    ? "Loading tenants..."
                    : tenants.length
                      ? "Select tenant"
                      : "No tenants available"
                  }
                </option>
                {tenants.map((tenant) => (
                  <option key={tenant.id} value={tenant.id}>
                    {tenant.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-primary font-semibold text-sm mb-2">Password</label>
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                ref={passwordInputRef}
                autoComplete="off"
                className="w-full px-5 py-3 rounded-full border border-primary/40 bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
              />
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(event) => setRemember(event.target.checked)}
                  ref={rememberInputRef}
                  className="w-5 h-5 rounded accent-primary"
                />
                <span className="text-muted-foreground text-sm">Remember Me</span>
              </label>
              <Link to="/forgot-password" className="text-primary text-sm font-semibold hover:underline">
                Forgot Password?
              </Link>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="block w-full text-center py-4 rounded-full signup-btn-gradient text-primary-foreground text-lg font-semibold shadow-lg hover:opacity-90 transition-opacity mt-8 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isSubmitting ? "Signing In..." : "Sign In"}
            </button>

            <p className="text-center text-muted-foreground text-sm">
              New to Lawra? {" "}
              <Link to="/signup" className="text-primary font-semibold hover:underline">
                Create an account
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
