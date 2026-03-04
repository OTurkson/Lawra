import { useState } from "react";
import avatarDog from "@/assets/avatar-dog.jpg";

const SettingsPage = () => {
  const [name, setName] = useState("Mama One");
  const [company] = useState("Unilever Ghana Limited");
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-light text-foreground">Edit Profile</h2>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left column - Profile info */}
        <div className="bg-card rounded-lg shadow-sm p-6 space-y-6">
          {/* Avatar & Change Picture */}
          <div className="flex items-center gap-6">
            <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-primary/30 shrink-0">
              <img src={avatarDog} alt="Profile" className="w-full h-full object-cover" />
            </div>
            <button className="px-6 py-2 rounded-full bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-opacity">
              Change Picture
            </button>
          </div>

          {/* Change Name */}
          <div>
            <label className="block text-primary font-semibold text-sm mb-2">Change Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-5 py-3 rounded-full border border-primary/40 bg-card text-foreground focus:outline-none focus:border-primary transition-colors"
            />
          </div>

          {/* Company */}
          <div>
            <label className="block text-muted-foreground text-sm mb-1">{company}</label>
          </div>

          {/* Email and SMS */}
          <div>
            <label className="block text-primary font-semibold text-sm mb-2">Email and SMS</label>
            <input
              type="text"
              placeholder="Email and SMS notifications"
              className="w-full px-5 py-3 rounded-full border border-primary/40 bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
            />
          </div>

          {/* Security */}
          <div>
            <label className="block text-primary font-semibold text-sm mb-2">Security</label>
            <input
              type="text"
              placeholder="Security settings"
              className="w-full px-5 py-3 rounded-full border border-primary/40 bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
            />
          </div>
        </div>

        {/* Right column - Change Password */}
        <div className="bg-card rounded-lg shadow-sm p-6 space-y-6">
          <h3 className="text-primary font-semibold text-sm">Change Password</h3>

          <div>
            <label className="block text-muted-foreground text-sm mb-2">Old Password</label>
            <input
              type="password"
              placeholder="Old Password"
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
              className="w-full px-5 py-3 rounded-full border border-primary/40 bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
            />
          </div>

          <div>
            <label className="block text-muted-foreground text-sm mb-2">New Password</label>
            <input
              type="password"
              placeholder="New Password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full px-5 py-3 rounded-full border border-primary/40 bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
            />
          </div>

          <div>
            <label className="block text-muted-foreground text-sm mb-2">Confirm New Password</label>
            <input
              type="password"
              placeholder="Confirm New Password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-5 py-3 rounded-full border border-primary/40 bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
