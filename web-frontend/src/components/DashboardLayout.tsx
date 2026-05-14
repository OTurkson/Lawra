import { useEffect, useRef, useState } from "react";
import { Link, Navigate, Outlet, useLocation, useNavigate } from "react-router-dom";
import { HelpCircle, User, LogOut, Settings, Landmark, HandCoins, Banknote, CircleDollarSign, Eye, EyeOff } from "lucide-react";
import avatarDog from "@/assets/avatar-dog.jpg";
import { clearAuth, getAuth, isAuthTokenExpired } from "@/lib/auth";
import { useCurrentUser } from "@/hooks/use-current-user";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { topUpCurrentUserBalance } from "@/lib/api";
import { Spinner } from "@/components/Spinner";
import { useToast } from "@/hooks/use-toast";
import { NotificationsDropdown } from "@/components/NotificationsDropdown";
import { pushNotification } from "@/lib/notifications";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { jwtDecode } from "jwt-decode";

const navItems = [
  { label: "Borrower", icon: HandCoins, path: "/dashboard" },
  { label: "Lender", icon: CircleDollarSign, path: "/dashboard/lender" },
  { label: "Loans", icon: Banknote, path: "/dashboard/loans" },
  { label: "Virtual Banks", icon: Landmark, path: "/dashboard/virtual-banks" },
  { label: "System Setting", icon: Settings, path: "/dashboard/settings" },
  { label: "Logout", icon: LogOut, path: "/dashboard/logout" },
];

const getRoleDisplayName = (role: string): string => {
  const roleMap: Record<string, string> = {
    "ROLE_ADMIN": "Platform Administrator",
    "ROLE_PAYMASTER": "HR Manager",
    "ROLE_BORROWER": "Employee",
  };
  return roleMap[role] || role;
};

const DashboardLayout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useCurrentUser();
  const queryClient = useQueryClient();
  const previousDashboardPathRef = useRef("/dashboard");
  const [showBalance, setShowBalance] = useState(false);
  const [isDepositDialogOpen, setIsDepositDialogOpen] = useState(false);
  const [depositAmount, setDepositAmount] = useState("");
  const { toast } = useToast();

  const auth = getAuth();
  const isSessionExpired = isAuthTokenExpired(auth?.token);
  
  // Decode JWT to get role and tenant info
  let decodedJwt: any = null;
  if (auth?.token) {
    try {
      decodedJwt = jwtDecode(auth.token);
    } catch (e) {
      console.error("Failed to decode JWT:", e);
    }
  }

  const roleDisplayName = decodedJwt?.role ? getRoleDisplayName(decodedJwt.role) : auth?.role || "User";

  useEffect(() => {
    if (!auth?.token || isSessionExpired) {
      return;
    }

    const decodedToken = jwtDecode<{ exp?: number }>(auth.token);
    if (typeof decodedToken.exp !== "number") {
      clearAuth();
      navigate("/auth/login", { replace: true });
      return;
    }

    const timeoutId = window.setTimeout(() => {
      clearAuth();
      navigate("/auth/login", { replace: true });
    }, Math.max(decodedToken.exp * 1000 - Date.now(), 0));

    return () => window.clearTimeout(timeoutId);
  }, [auth?.token, isSessionExpired, navigate]);

  const redirectToLogin = () => {
    clearAuth();
    navigate("/auth/login", { replace: true });
  };

  const handleProtectedInteraction = () => {
    if (isAuthTokenExpired(auth?.token)) {
      redirectToLogin();
    }
  };

  if (!auth?.token || isSessionExpired) {
    clearAuth();
    return <Navigate to="/auth/login" replace />;
  }

  const depositMutation = useMutation({
    mutationFn: async (amount: number) => {
      if (!Number.isFinite(amount) || amount <= 0) {
        throw new Error("Enter a valid deposit amount greater than zero.");
      }

      return topUpCurrentUserBalance({ amount });
    },
    onSuccess: async (_data, amount) => {
      setDepositAmount("");
      setIsDepositDialogOpen(false);
      toast({
        title: "Balance updated",
        description: "Your account balance has been successfully updated.",
      });
      pushNotification(queryClient, auth?.userId, {
        type: 'deposit',
        message: `You deposited Gh¢ ${Number(amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      });
      await queryClient.invalidateQueries({ queryKey: ["current-user", auth?.userId] });
    },
  });

  useEffect(() => {
    if (location.pathname !== "/dashboard/notifications") {
      previousDashboardPathRef.current = location.pathname;
    }
  }, [location.pathname]);

  const toggleNotifications = () => {
    if (location.pathname === "/dashboard/notifications") {
      navigate(previousDashboardPathRef.current || "/dashboard");
      return;
    }

    previousDashboardPathRef.current = location.pathname;
    navigate("/dashboard/notifications");
  };

  return (
    <div
      className="flex min-h-screen bg-background"
      onClickCapture={handleProtectedInteraction}
      onKeyDownCapture={handleProtectedInteraction}
      onSubmitCapture={handleProtectedInteraction}
      onPointerDownCapture={handleProtectedInteraction}
    >
      {/* Sidebar */}
      <aside className="w-64 sidebar-gradient flex flex-col items-center py-6 text-primary-foreground shrink-0">
        {/* Logo */}
        <div className="flex items-center gap-2 mb-6">
          <span className="text-2xl font-display">lawra</span>
        </div>

        {/* Avatar */}
        <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-primary-foreground/30 mb-3">
          <img src={avatarDog} alt="Profile" className="w-full h-full object-cover" />
        </div>
        <p className="font-semibold text-sm">{user?.fullName ?? auth?.userId ?? "Mama One"}</p>
        <p className="text-xs opacity-80">{user?.email ?? auth?.role ?? "Unilever Ghana"}</p>
        <p className="text-xs opacity-70 font-medium text-primary-foreground/80">{roleDisplayName}</p>
        
        {/* Balance Section */}
        <div
          role="button"
          tabIndex={0}
          onClick={() => setIsDepositDialogOpen(true)}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              setIsDepositDialogOpen(true);
            }
          }}
          className="flex w-[calc(100%-2rem)] items-center gap-2 mt-4 mb-6 px-4 py-2 bg-primary-foreground/10 rounded-lg text-left transition-colors hover:bg-primary-foreground/15 cursor-pointer"
        >
          <div className="flex-1">
            <p className="text-xs opacity-70 mb-1">Balance</p>
            <p className="text-sm font-semibold">
              {showBalance ? `Gh¢ ${(user?.balance ?? 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : "••••••"}
            </p>
          </div>
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              setShowBalance(!showBalance);
            }}
            className="p-1 hover:bg-primary-foreground/20 rounded transition-colors"
            title={showBalance ? "Hide balance" : "Show balance"}
          >
            {showBalance ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>

        {/* Nav */}
        <nav className="w-full px-4 space-y-1">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.label}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-semibold transition-colors ${
                  isActive ? "bg-primary-foreground/20" : "hover:bg-primary-foreground/10"
                }`}
              >
                <item.icon size={20} />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col">
        {/* Top bar */}
        <header className="h-14 bg-card flex items-center justify-between px-6 border-b border-border">
          <span className="paymaster-font text-muted-foreground text-xl tracking-wide">{user?.role}</span>
          <div className="flex items-center gap-4">
            <button className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground">
              <HelpCircle size={16} />
            </button>
            <NotificationsDropdown />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground"
                  aria-label="Open user menu"
                >
                  <User size={16} />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-40">
                <DropdownMenuItem asChild>
                  <Link to="/dashboard/settings" className="flex items-center gap-2">
                    <Settings size={14} />
                    <span>Settings</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/dashboard/logout" className="flex items-center gap-2 text-destructive">
                    <LogOut size={14} />
                    <span>Sign out</span>
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 p-6 overflow-auto">
          <Outlet />
        </main>

        {/* Footer */}
        <footer className="bg-card border-t border-border px-6 py-3 flex items-center justify-between text-xs text-muted-foreground font-semibold uppercase tracking-wide">
          <div className="flex items-center gap-6">
            <Link to="/dashboard/about" className="hover:text-foreground transition-colors">About Us</Link>
            <span>Support</span>
            <span>Privacy</span>
            <span>Terms and Conditions</span>
            <span>Language</span>
            <span>Website</span>
          </div>
          <span>2026 LAWRA</span>
        </footer>
      </div>

      <Dialog open={isDepositDialogOpen} onOpenChange={setIsDepositDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Deposit balance</DialogTitle>
            <DialogDescription>
              Add money to your account balance. The amount must be greater than zero.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground" htmlFor="deposit-amount">
              Amount (Gh¢)
            </label>
            <input
              id="deposit-amount"
              type="number"
              min="0.01"
              step="0.01"
              value={depositAmount}
              onChange={(event) => setDepositAmount(event.target.value)}
              placeholder="0.00"
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <DialogFooter>
            <button
              type="button"
              onClick={() => setIsDepositDialogOpen(false)}
              className="rounded-full border border-border px-4 py-2 text-sm font-semibold text-foreground hover:bg-muted"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => depositMutation.mutate(Number(depositAmount))}
              disabled={depositMutation.isPending}
              className="rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {depositMutation.isPending ? (
                <>
                  <Spinner size="sm" />
                  Depositing...
                </>
              ) : (
                "Deposit"
              )}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
       
    </div>
  );
};

export default DashboardLayout;
