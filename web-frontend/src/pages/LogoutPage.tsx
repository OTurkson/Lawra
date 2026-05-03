import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import avatarDog from "@/assets/avatar-dog.jpg";
import { clearAuth } from "@/lib/auth";
import { queryClient } from "@/lib/query-client";
import { useCurrentUser } from "@/hooks/use-current-user";
import { Spinner } from "@/components/Spinner";

const LogoutPage = () => {
  const navigate = useNavigate();
  const { user } = useCurrentUser();
  const [isLoading, setIsLoading] = useState(false);

  const handleLogout = () => {
    setIsLoading(true);
    setTimeout(() => {
      queryClient.clear();
      clearAuth();
      navigate("/", { replace: true });
    }, 500);
  };

  return (
    <div className="flex-1 flex items-center justify-center">
      <div className="bg-card rounded-lg shadow-sm p-10 flex flex-col items-center text-center max-w-sm w-full">
        {/* Avatar */}
        <div className="w-28 h-28 rounded-full overflow-hidden border-4 border-primary/30 mb-4">
          <img src={avatarDog} alt="Profile" className="w-full h-full object-cover" />
        </div>
        <h2 className="text-lg font-semibold text-foreground mb-1">{user?.fullName ?? "Current User"}</h2>
        <p className="text-sm text-muted-foreground mb-1">{user?.email ?? ""}</p>
        <p className="text-xs text-muted-foreground mb-8">{user?.role ?? ""}</p>

        {/* Buttons */}
        <div className="flex gap-6 w-full">
          <button
            type="button"
            onClick={handleLogout}
            disabled={isLoading}
            className="flex-1 py-3 rounded-full bg-destructive text-destructive-foreground font-semibold text-sm text-center hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <Spinner size="sm" />
                Logging out...
              </>
            ) : (
              "Logout"
            )}
          </button>
          <Link
            to="/dashboard"
            className="flex-1 py-3 rounded-full bg-primary text-primary-foreground font-semibold text-sm text-center hover:opacity-90 transition-opacity"
          >
            Cancel
          </Link>
        </div>
      </div>
    </div>
  );
};

export default LogoutPage;
