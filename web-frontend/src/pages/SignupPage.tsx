import { FormEvent, useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import signupHero from "@/assets/signup-hero.jpg";
import { useToast } from "@/hooks/use-toast";
import { createUser, fetchTenants, login, type Tenant } from "@/lib/api";
import { saveAuth } from "@/lib/auth";

const SignupPage = () => {
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [tenantId, setTenantId] = useState("");
  const [remember, setRemember] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [isLoadingTenants, setIsLoadingTenants] = useState(false);

  const fullNameInputRef = useRef<HTMLInputElement | null>(null);
  const emailInputRef = useRef<HTMLInputElement | null>(null);
  const phoneInputRef = useRef<HTMLInputElement | null>(null);
  const passwordInputRef = useRef<HTMLInputElement | null>(null);
  const confirmPasswordInputRef = useRef<HTMLInputElement | null>(null);
  const rememberInputRef = useRef<HTMLInputElement | null>(null);

  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    setEmail("");
    setFullName("");
    setPhoneNumber("");
    setPassword("");
    setConfirmPassword("");
    setTenantId("");
    setRemember(false);

    const timeoutId = window.setTimeout(() => {
      if (fullNameInputRef.current) fullNameInputRef.current.value = "";
      if (emailInputRef.current) emailInputRef.current.value = "";
      if (phoneInputRef.current) phoneInputRef.current.value = "";
      if (passwordInputRef.current) passwordInputRef.current.value = "";
      if (confirmPasswordInputRef.current) confirmPasswordInputRef.current.value = "";
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

    if (!email || !fullName || !phoneNumber || !password || !confirmPassword || !tenantId) {
      toast({
        title: "Missing details",
        description: "Fill out all fields before continuing.",
      });
      return;
    }

    if (password !== confirmPassword) {
      toast({
        title: "Passwords do not match",
        description: "Both password fields must match.",
      });
      return;
    }

    const tenantNumeric = Number(tenantId);
    if (!Number.isFinite(tenantNumeric)) {
      toast({
        title: "Invalid tenant",
        description: "Please choose a tenant from the list.",
      });
      return;
    }

    try {
      setIsSubmitting(true);
      await createUser({
        email,
        fullName,
        phoneNumber,
        password,
        tenantId: tenantNumeric,
      });

      const authResponse = await login({ email, password, tenantId: tenantNumeric });
      saveAuth({
        token: authResponse.token,
        userId: authResponse.userId,
        tenantId: authResponse.tenantId,
        role: authResponse.role,
      });

      toast({
        title: "Account created",
        description: "You are now signed in.",
      });

      navigate("/dashboard");
    } catch (error: any) {
      toast({
        title: "Sign up failed",
        description: error?.message || "Please review your details and try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen">
      <div className="hidden lg:flex lg:w-1/2 relative">
        <img src={signupHero} alt="Woman using phone" className="w-full h-full object-cover" />
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
          <h1 className="text-3xl font-light text-foreground mb-1">Signup</h1>
          <p className="text-muted-foreground text-sm mb-10">Create your profile to join the Lawra network</p>

          <form className="space-y-6" onSubmit={handleSubmit} autoComplete="off">
            <div>
              <label className="block text-primary font-semibold text-sm mb-2">Full name</label>
              <input
                type="text"
                placeholder="John Doe"
                value={fullName}
                onChange={(event) => setFullName(event.target.value)}
                ref={fullNameInputRef}
                autoComplete="off"
                className="w-full px-5 py-3 rounded-full border border-primary/40 bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
              />
            </div>

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
              <label className="block text-primary font-semibold text-sm mb-2">Phone number</label>
              <input
                type="tel"
                placeholder="+233 50 000 0000"
                value={phoneNumber}
                onChange={(event) => setPhoneNumber(event.target.value)}
                ref={phoneInputRef}
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
                <option value="" disabled>
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

            <div>
              <label className="block text-primary font-semibold text-sm mb-2">Confirm password</label>
              <input
                type="password"
                placeholder="Repeat password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                ref={confirmPasswordInputRef}
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
              <a href="#" className="text-primary text-sm font-semibold hover:underline">
                Forgot Password?
              </a>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="block w-full text-center py-4 rounded-full signup-btn-gradient text-primary-foreground text-lg font-semibold shadow-lg hover:opacity-90 transition-opacity mt-8 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isSubmitting ? "Signing Up..." : "Sign Up"}
            </button>

            <p className="text-center text-muted-foreground text-sm">
              Already have an account? {" "}
              <Link to="/" className="text-primary font-semibold hover:underline">
                Sign in
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
};

export default SignupPage;
