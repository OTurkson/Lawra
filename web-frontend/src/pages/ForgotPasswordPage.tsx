import { FormEvent, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import signupHero from "@/assets/signup-hero.jpg";
import { useToast } from "@/hooks/use-toast";
import { fetchTenants, requestPasswordReset, type Tenant } from "@/lib/api";

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState("");
  const [tenantId, setTenantId] = useState("");
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [isLoadingTenants, setIsLoadingTenants] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    setEmail("");
    setTenantId("");
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

    if (!email || !tenantId) {
      toast({
        title: "Missing details",
        description: "Email and tenant are required.",
      });
      return;
    }

    const tenantNumeric = Number(tenantId);
    if (!Number.isFinite(tenantNumeric)) {
      toast({
        title: "Invalid tenant",
        description: "Please choose a tenant from the dropdown.",
      });
      return;
    }

    try {
      setIsSubmitting(true);
      await requestPasswordReset({ email, tenantId: tenantNumeric });

      toast({
        title: "Check your email",
        description: "If an account exists for this email and tenant, a reset link has been sent.",
      });

      navigate("/");
    } catch (error: any) {
      toast({
        title: "Request failed",
        description: error?.message || "Unable to start password reset. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen">
      <div className="hidden lg:flex lg:w-1/2 relative">
        <img src={signupHero} alt="Lawra forgot password" className="w-full h-full object-cover" />
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
          <h1 className="text-3xl font-light text-foreground mb-1">Forgot password</h1>
          <p className="text-muted-foreground text-sm mb-10">
            Enter your email and tenant to receive a password reset link.
          </p>

          <form className="space-y-6" onSubmit={handleSubmit} autoComplete="off">
            <div>
              <label className="block text-primary font-semibold text-sm mb-2">Email</label>
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
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
                      : "No tenants available"}
                </option>
                {tenants.map((tenant) => (
                  <option key={tenant.id} value={tenant.id}>
                    {tenant.name}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="block w-full text-center py-4 rounded-full signup-btn-gradient text-primary-foreground text-lg font-semibold shadow-lg hover:opacity-90 transition-opacity mt-8 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isSubmitting ? "Sending link..." : "Send reset link"}
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

export default ForgotPasswordPage;
