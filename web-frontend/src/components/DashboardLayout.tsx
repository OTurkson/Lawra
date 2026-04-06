import { useEffect, useRef } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { HelpCircle, Bell, User, LogOut, Settings, Landmark, HandCoins, Banknote, CircleDollarSign } from "lucide-react";
import avatarDog from "@/assets/avatar-dog.jpg";
import { getAuth } from "@/lib/auth";
import { useCurrentUser } from "@/hooks/use-current-user";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const navItems = [
  { label: "Borrower", icon: HandCoins, path: "/dashboard" },
  { label: "Lender", icon: CircleDollarSign, path: "/dashboard/lender" },
  { label: "Loans", icon: Banknote, path: "/dashboard/loans" },
  { label: "Virtual Banks", icon: Landmark, path: "/dashboard/virtual-banks" },
  { label: "System Setting", icon: Settings, path: "/dashboard/settings" },
  { label: "Logout", icon: LogOut, path: "/dashboard/logout" },
];

const DashboardLayout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useCurrentUser();
  const previousDashboardPathRef = useRef("/dashboard");

  const auth = getAuth();

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
    <div className="flex min-h-screen bg-background">
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
        <p className="text-xs opacity-80 mb-6">Staff ID</p>

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
          <span className="paymaster-font text-muted-foreground text-xl tracking-wide">paymaster</span>
          <div className="flex items-center gap-4">
            <button className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground">
              <HelpCircle size={16} />
            </button>
            <button
              type="button"
              onClick={toggleNotifications}
              className="relative text-muted-foreground hover:text-foreground"
              aria-label="Toggle notifications"
            >
              <Bell size={20} />
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-destructive rounded-full" />
            </button>
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
    </div>
  );
};

export default DashboardLayout;
