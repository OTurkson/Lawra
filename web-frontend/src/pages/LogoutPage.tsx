import { Link, useNavigate } from "react-router-dom";
import avatarDog from "@/assets/avatar-dog.jpg";
import { clearAuth } from "@/lib/auth";

const LogoutPage = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    clearAuth();
    navigate("/", { replace: true });
  };

  return (
    <div className="flex-1 flex items-center justify-center">
      <div className="bg-card rounded-lg shadow-sm p-10 flex flex-col items-center text-center max-w-sm w-full">
        {/* Avatar */}
        <div className="w-28 h-28 rounded-full overflow-hidden border-4 border-primary/30 mb-4">
          <img src={avatarDog} alt="Profile" className="w-full h-full object-cover" />
        </div>
        <h2 className="text-lg font-semibold text-foreground mb-1">Mama One</h2>
        <p className="text-sm text-muted-foreground mb-1">Unilever Ghana</p>
        <p className="text-xs text-muted-foreground mb-8">Staff ID</p>

        {/* Buttons */}
        <div className="flex gap-6 w-full">
          <button
            type="button"
            onClick={handleLogout}
            className="flex-1 py-3 rounded-full bg-destructive text-destructive-foreground font-semibold text-sm text-center hover:opacity-90 transition-opacity"
          >
            Logout
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
