import { useState, useEffect } from "react";
import avatarDog from "@/assets/avatar-dog.jpg";
import { useCurrentUser } from "@/hooks/use-current-user";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createTenant,
  createUser,
  deleteTenant,
  deleteUser,
  fetchTenantById,
  fetchTenants,
  fetchUsers,
  updateTenant,
  updateUser,
} from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

const SettingsPage = () => {
  const { user } = useCurrentUser();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const isTenantAdmin = user?.role === "PAYMASTER" || user?.role === "ADMIN";

  const [name, setName] = useState("Mama One");
  const [company, setCompany] = useState("Unilever Ghana Limited");
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [tenantId, setTenantId] = useState("");
  const [tenantName, setTenantName] = useState("");

  const [userId, setUserId] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [userFullName, setUserFullName] = useState("");
  const [userPhone, setUserPhone] = useState("");
  const [userPassword, setUserPassword] = useState("");

  const { data: tenants } = useQuery({
    queryKey: ["tenants"],
    queryFn: fetchTenants,
    enabled: isTenantAdmin,
  });

  const { data: selectedTenant } = useQuery({
    queryKey: ["tenant", tenantId],
    queryFn: () => fetchTenantById(tenantId),
    enabled: isTenantAdmin && !!tenantId,
  });

  const { data: users } = useQuery({
    queryKey: ["users"],
    queryFn: fetchUsers,
    enabled: isTenantAdmin,
  });

  const profileMutation = useMutation({
    mutationFn: () => {
      if (!user?.id) {
        throw new Error("Unable to determine current user.");
      }
      if (newPassword && newPassword !== confirmPassword) {
        throw new Error("New password and confirmation do not match.");
      }

      return updateUser(user.id, {
        fullName: isTenantAdmin ? name : undefined,
        phoneNumber: company,
        password: newPassword || undefined,
      });
    },
    onSuccess: () => {
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
      queryClient.invalidateQueries({ queryKey: ["current-user"] });
      queryClient.invalidateQueries({ queryKey: ["users"] });
      toast({ title: "Profile updated" });
    },
    onError: (error: any) => toast({ title: "Profile update failed", description: error?.message }),
  });

  const createTenantMutation = useMutation({
    mutationFn: () => createTenant({ name: tenantName }),
    onSuccess: () => {
      setTenantName("");
      queryClient.invalidateQueries({ queryKey: ["tenants"] });
      toast({ title: "Tenant created" });
    },
    onError: (error: any) => toast({ title: "Tenant create failed", description: error?.message }),
  });

  const updateTenantMutation = useMutation({
    mutationFn: () => updateTenant(tenantId, { name: tenantName }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tenants"] });
      toast({ title: "Tenant updated" });
    },
    onError: (error: any) => toast({ title: "Tenant update failed", description: error?.message }),
  });

  const deleteTenantMutation = useMutation({
    mutationFn: () => deleteTenant(tenantId),
    onSuccess: () => {
      setTenantId("");
      queryClient.invalidateQueries({ queryKey: ["tenants"] });
      toast({ title: "Tenant deleted" });
    },
    onError: (error: any) => toast({ title: "Tenant delete failed", description: error?.message }),
  });

  const createUserMutation = useMutation({
    mutationFn: () => {
      if (!tenantId) {
        throw new Error("Select a tenant before creating a user.");
      }

      return createUser({
        email: userEmail,
        fullName: userFullName,
        phoneNumber: userPhone,
        password: userPassword,
        tenantId,
      });
    },
    onSuccess: () => {
      setUserEmail("");
      setUserFullName("");
      setUserPhone("");
      setUserPassword("");
      queryClient.invalidateQueries({ queryKey: ["users"] });
      toast({ title: "User created" });
    },
    onError: (error: any) => toast({ title: "User create failed", description: error?.message }),
  });

  const updateUserMutation = useMutation({
    mutationFn: () =>
      updateUser(userId, {
        email: userEmail,
        fullName: userFullName,
        phoneNumber: userPhone,
        password: userPassword,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      toast({ title: "User updated" });
    },
    onError: (error: any) => toast({ title: "User update failed", description: error?.message }),
  });

  const deleteUserMutation = useMutation({
    mutationFn: () => deleteUser(userId),
    onSuccess: () => {
      setUserId("");
      queryClient.invalidateQueries({ queryKey: ["users"] });
      toast({ title: "User deleted" });
    },
    onError: (error: any) => toast({ title: "User delete failed", description: error?.message }),
  });

  const hasNameChange = isTenantAdmin && name.trim() !== (user?.fullName ?? "").trim();
  const hasPhoneChange = company.trim() !== (user?.phoneNumber ?? "").trim();
  const hasPasswordChange = !!newPassword || !!confirmPassword;
  const hasProfileChanges = hasNameChange || hasPhoneChange || hasPasswordChange;

  const handleSaveProfile = () => {
    if (!hasProfileChanges) {
      toast({ title: "No changes detected", description: "Update at least one field before saving." });
      return;
    }

    if (hasPasswordChange && newPassword !== confirmPassword) {
      toast({ title: "Password mismatch", description: "New password and confirmation do not match." });
      return;
    }

    profileMutation.mutate();
  };

  useEffect(() => {
    if (user?.fullName) {
      setName(user.fullName);
    }
    if (user?.phoneNumber) {
      setCompany(user.phoneNumber);
    }
  }, [user]);

  useEffect(() => {
    if (!isTenantAdmin && user?.id) {
      setUserId(String(user.id));
    }
  }, [isTenantAdmin, user?.id]);

  useEffect(() => {
    if (selectedTenant?.name) {
      setTenantName(selectedTenant.name);
    }
  }, [selectedTenant]);

  useEffect(() => {
    const selectedUser = (users ?? []).find((managedUser) => String(managedUser.id) === userId);
    if (!selectedUser) {
      return;
    }
    setUserEmail(selectedUser.email ?? "");
    setUserFullName(selectedUser.fullName ?? "");
    setUserPhone(selectedUser.phoneNumber ?? "");
    setUserPassword("");
  }, [userId, users]);

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
              disabled={!isTenantAdmin}
              className="w-full px-5 py-3 rounded-full border border-primary/40 bg-card text-foreground focus:outline-none focus:border-primary transition-colors"
            />
            {!isTenantAdmin && (
              <p className="mt-1 text-xs text-muted-foreground">Name updates are managed by paymaster.</p>
            )}
          </div>

          {/* Company */}
          <div>
            <label className="block text-primary font-semibold text-sm mb-2">Phone Number</label>
            <input
              type="text"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
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

          <button
            onClick={handleSaveProfile}
            disabled={profileMutation.isPending || !hasProfileChanges}
            className="px-6 py-2 rounded-full bg-primary text-primary-foreground text-sm font-semibold disabled:opacity-60"
          >
            {profileMutation.isPending ? "Saving..." : "Save Profile"}
          </button>
        </div>
      </div>

      {isTenantAdmin && (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-card rounded-lg shadow-sm p-6 space-y-4">
          <h3 className="text-primary font-semibold text-sm">Tenant Management</h3>
          <select
            value={tenantId}
            onChange={(e) => setTenantId(e.target.value)}
            className="w-full px-5 py-3 rounded-full border border-primary/40 bg-card text-foreground"
          >
            <option value="">Select Tenant ID</option>
            {(tenants ?? []).map((tenant) => (
              <option key={tenant.id} value={tenant.id}>
                {tenant.id} - {tenant.name}
              </option>
            ))}
          </select>
          <input
            value={tenantName}
            onChange={(e) => setTenantName(e.target.value)}
            placeholder="Tenant name"
            className="w-full px-5 py-3 rounded-full border border-primary/40 bg-card text-foreground"
          />
          <div className="flex gap-3">
            <button
              onClick={() => {
                if (!tenantName.trim()) {
                  toast({
                    title: "Missing details",
                    description: "Fill out all fields before continuing.",
                  });
                  return;
                }
                createTenantMutation.mutate();
              }}
              className="px-6 py-2 rounded-full bg-primary text-primary-foreground text-sm font-semibold"
            >
              Create
            </button>
            <button
              onClick={() => updateTenantMutation.mutate()}
              disabled={!tenantId}
              className="px-6 py-2 rounded-full bg-approve text-approve-foreground text-sm font-semibold disabled:opacity-60"
            >
              Update
            </button>
            <button
              onClick={() => deleteTenantMutation.mutate()}
              disabled={!tenantId}
              className="px-6 py-2 rounded-full bg-destructive text-destructive-foreground text-sm font-semibold disabled:opacity-60"
            >
              Delete
            </button>
          </div>
        </div>

        <div className="bg-card rounded-lg shadow-sm p-6 space-y-4">
          <h3 className="text-primary font-semibold text-sm">User Management</h3>
          <select
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            className="w-full px-5 py-3 rounded-full border border-primary/40 bg-card text-foreground"
          >
            <option value="">Select User ID</option>
            {(users ?? []).map((managedUser) => (
              <option key={managedUser.id} value={managedUser.id}>
                {managedUser.id} - {managedUser.fullName}
              </option>
            ))}
          </select>
          <input
            value={userEmail}
            onChange={(e) => setUserEmail(e.target.value)}
            placeholder="User email"
            className="w-full px-5 py-3 rounded-full border border-primary/40 bg-card text-foreground"
          />
          <input
            value={userFullName}
            onChange={(e) => setUserFullName(e.target.value)}
            placeholder="Full name"
            className="w-full px-5 py-3 rounded-full border border-primary/40 bg-card text-foreground"
          />
          <input
            value={userPhone}
            onChange={(e) => setUserPhone(e.target.value)}
            placeholder="Phone number"
            className="w-full px-5 py-3 rounded-full border border-primary/40 bg-card text-foreground"
          />
          <input
            type="password"
            value={userPassword}
            onChange={(e) => setUserPassword(e.target.value)}
            placeholder="Password"
            className="w-full px-5 py-3 rounded-full border border-primary/40 bg-card text-foreground"
          />
          <div className="flex gap-3">
            <button
              onClick={() => createUserMutation.mutate()}
              className="px-6 py-2 rounded-full bg-primary text-primary-foreground text-sm font-semibold"
            >
              Create
            </button>
            <button
              onClick={() => updateUserMutation.mutate()}
              disabled={!userId}
              className="px-6 py-2 rounded-full bg-approve text-approve-foreground text-sm font-semibold disabled:opacity-60"
            >
              Update
            </button>
            <button
              onClick={() => deleteUserMutation.mutate()}
              disabled={!userId}
              className="px-6 py-2 rounded-full bg-destructive text-destructive-foreground text-sm font-semibold disabled:opacity-60"
            >
              Delete
            </button>
          </div>
        </div>
      </div>
      )}
    </div>
  );
};

export default SettingsPage;
