import { useState, useEffect } from "react";
import avatarDog from "@/assets/avatar-dog.jpg";
import { useCurrentUser } from "@/hooks/use-current-user";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createTenant,
  deleteTenant,
  deleteUser,
  fetchTenantById,
  fetchTenants,
  fetchUsers,
  formatApiError,
  provisionUser,
  updateTenant,
  updateUser,
} from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { Spinner } from "@/components/Spinner";

const SettingsPage = () => {
  const { user } = useCurrentUser();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const isTenantAdmin = user?.role === "PAYMASTER" || user?.role === "ADMIN";

  const [name, setName] = useState("Mama One");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [tenantId, setTenantId] = useState("");
  const [tenantName, setTenantName] = useState("");

  const [provisionEmail, setProvisionEmail] = useState("");
  const [provisionFullName, setProvisionFullName] = useState("");
  const [provisionPhoneNumber, setProvisionPhoneNumber] = useState("");

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
        fullName: isTenantAdmin ? name.trim() : undefined,
        phoneNumber: phoneNumber.trim(),
        password: newPassword || undefined,
      });
    },
    onSuccess: () => {
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

  const provisionUserMutation = useMutation({
    mutationFn: () => {
      const email = provisionEmail.trim();
      const fullName = provisionFullName.trim();
      const phoneNumber = provisionPhoneNumber.trim();

      if (!email || !fullName || !phoneNumber) {
        throw new Error("Fill out the provisioning fields before continuing.");
      }

      return provisionUser({
        email,
        fullName,
        phoneNumber,
      });
    },
    onSuccess: () => {
      setProvisionEmail("");
      setProvisionFullName("");
      setProvisionPhoneNumber("");
      queryClient.invalidateQueries({ queryKey: ["users"] });
      toast({
        title: "User provisioned",
        description: "The user was created in the current tenant and a reset link was sent.",
      });
    },
    onError: (error: any) => toast({ title: "Provision failed", description: formatApiError(error, "Unable to provision user.") }),
  });

  const updateUserMutation = useMutation({
    mutationFn: () => {
      const selectedUser = (users ?? []).find((managedUser) => String(managedUser.id) === userId);

      if (!selectedUser) {
        throw new Error("Select a user before updating.");
      }

      const hasEmailChange = userEmail.trim() !== (selectedUser.email ?? "").trim();
      const hasNameChange = userFullName.trim() !== (selectedUser.fullName ?? "").trim();
      const hasPhoneChange = userPhone.trim() !== (selectedUser.phoneNumber ?? "").trim();

      if (!hasEmailChange && !hasNameChange && !hasPhoneChange && !userPassword.trim()) {
        throw new Error("No changes detected.");
      }

      return updateUser(userId, {
        email: userEmail.trim(),
        fullName: userFullName.trim(),
        phoneNumber: userPhone.trim(),
        password: userPassword || undefined,
      });
    },
    onSuccess: () => {
      setUserPassword("");
      queryClient.invalidateQueries({ queryKey: ["users"] });
      toast({ title: "User updated" });
    },
    onError: (error: any) => toast({ title: "User update failed", description: formatApiError(error, "Unable to update user.") }),
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

  const hasPasswordChange = !!newPassword || !!confirmPassword;
  const selectedUser = (users ?? []).find((managedUser) => String(managedUser.id) === userId);
  const hasNamePhoneChanges = isTenantAdmin && (
    name.trim() !== (user?.fullName ?? "").trim() ||
    phoneNumber.trim() !== (user?.phoneNumber ?? "").trim()
  );
  const hasUserChanges = !!selectedUser && (
    userEmail.trim() !== (selectedUser.email ?? "").trim() ||
    userFullName.trim() !== (selectedUser.fullName ?? "").trim() ||
    userPhone.trim() !== (selectedUser.phoneNumber ?? "").trim() ||
    !!userPassword.trim()
  );
  const canProvisionUser = !!provisionEmail.trim() && !!provisionFullName.trim() && !!provisionPhoneNumber.trim();
  const canSaveProfile = hasNamePhoneChanges || !!newPassword || !!confirmPassword;

  const handleSaveProfile = () => {
    if (!canSaveProfile) {
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
      setPhoneNumber(user.phoneNumber);
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
    if (!selectedUser) {
      setUserEmail("");
      setUserFullName("");
      setUserPhone("");
      setUserPassword("");
      return;
    }
    setUserEmail(selectedUser.email ?? "");
    setUserFullName(selectedUser.fullName ?? "");
    setUserPhone(selectedUser.phoneNumber ?? "");
    setUserPassword("");
  }, [selectedUser, userId, users]);

  return (
    <div className="space-y-5">
      <h2 className="text-lg font-light text-foreground">Edit Profile</h2>

      {isTenantAdmin && (
        <div className="bg-card rounded-2xl shadow-sm border border-border/60 p-6 space-y-6">
          <div className="flex flex-col gap-2">
            <h3 className="text-primary font-semibold text-sm uppercase tracking-[0.2em]">Profile Settings</h3>
            <p className="text-sm text-muted-foreground">
              Update the account details and password.
            </p>
          </div>

          <div className="gap-6">
            <div className="rounded-2xl border border-primary/10 bg-muted/10 p-5 space-y-5">
              <div>
                <h4 className="text-primary font-semibold text-sm mb-4">Picture & Contact</h4>
                <div className="flex items-center gap-5">
                  <div className="w-20 h-20 rounded-full overflow-hidden border-4 border-primary/20 shrink-0">
                    <img src={avatarDog} alt="Profile" className="w-full h-full object-cover" />
                  </div>
                  <button className="px-5 py-2 rounded-full bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-opacity">
                    Change Picture
                  </button>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-primary font-semibold text-sm mb-2">Change Name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-1/3 px-5 py-3 rounded-full border border-primary/40 bg-card text-foreground focus:outline-none focus:border-primary transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-primary font-semibold text-sm mb-2">Phone Number</label>
                  <input
                    type="text"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    className="w-1/3 px-5 py-3 rounded-full border border-primary/40 bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
                  />
                </div>
                <div>
                  <h4 className="text-primary font-semibold text-sm mt-5">Change Password</h4>
                </div>

                <div className="my-5">
                  <label className="block text-muted-foreground text-sm mb-2">New Password</label>
                  <input
                    type="password"
                    placeholder="New Password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-1/3 px-5 py-3 rounded-full border border-primary/40 bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
                  />
                </div>

                <div className="my-5">
                  <label className="block text-muted-foreground text-sm mb-2">Confirm New Password</label>
                  <input
                    type="password"
                    placeholder="Confirm New Password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-1/3 px-5 py-3 rounded-full border border-primary/40 bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
                  />
                </div>
              </div>

              <button
                onClick={handleSaveProfile}
                disabled={profileMutation.isPending || !canSaveProfile}
                className="px-6 py-2 rounded-full bg-primary text-primary-foreground text-sm font-semibold disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {profileMutation.isPending ? (
                  <>
                    <Spinner size="sm" />
                    Saving...
                  </>
                ) : (
                  "Save Changes"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {!isTenantAdmin && (
        <div className="bg-card rounded-lg shadow-sm p-6 space-y-6 max-w-2xl">
          {/* Avatar & Change Picture */}
          <div>
            <h3 className="text-primary font-semibold text-sm mb-4">Change Picture</h3>
            <div className="flex items-center gap-6">
              <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-primary/30 shrink-0">
                <img src={avatarDog} alt="Profile" className="w-full h-full object-cover" />
              </div>
              <button className="px-6 py-2 rounded-full bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-opacity">
                Change Picture
              </button>
            </div>
          </div>

          {/* Change Password */}
          <div>
            <h3 className="text-primary font-semibold text-sm mb-4">Change Password</h3>

            <div className="space-y-4">
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

              <div className="flex justify-center">
                <button
                  onClick={handleSaveProfile}
                  disabled={profileMutation.isPending || !canSaveProfile}
                  className="px-6 py-2 rounded-full bg-primary text-primary-foreground text-sm font-semibold disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {profileMutation.isPending ? (
                    <>
                      <Spinner size="sm" />
                      Saving...
                    </>
                  ) : (
                    "Save Changes"
                  )}
                </button>
              </div>
            </div>
          </div>

          <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 rounded-lg p-4">
            <p className="text-sm text-amber-900 dark:text-amber-200">Name updates are managed by paymaster.</p>
          </div>
        </div>
      )}

      {isTenantAdmin && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-card rounded-lg shadow-sm p-6 space-y-4">
            <h3 className="text-primary font-semibold text-sm">User Provisioning</h3>
            <div className="space-y-4 rounded-2xl border border-primary/10 bg-muted/20 p-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Provision new user</p>
                <p className="text-sm text-muted-foreground">Creates a user inside the current tenant and sends a reset link.</p>
              </div>

              <input
                value={provisionEmail}
                onChange={(e) => setProvisionEmail(e.target.value)}
                placeholder="User email"
                className="w-full px-5 py-3 rounded-full border border-primary/40 bg-card text-foreground"
              />

              <input
                value={provisionFullName}
                onChange={(e) => setProvisionFullName(e.target.value)}
                placeholder="Full name"
                className="w-full px-5 py-3 rounded-full border border-primary/40 bg-card text-foreground"
              />

              <input
                value={provisionPhoneNumber}
                onChange={(e) => setProvisionPhoneNumber(e.target.value)}
                placeholder="Phone number"
                className="w-full px-5 py-3 rounded-full border border-primary/40 bg-card text-foreground"
              />

              <button
                onClick={() => {
                  if (!canProvisionUser) {
                    toast({
                      title: "Missing details",
                      description: "Fill out the provisioning fields before continuing.",
                    });
                    return;
                  }
                  provisionUserMutation.mutate();
                }}
                disabled={provisionUserMutation.isPending || !canProvisionUser}
                className="px-6 py-2 rounded-full bg-primary text-primary-foreground text-sm font-semibold disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {provisionUserMutation.isPending ? (
                  <>
                    <Spinner size="sm" />
                    Provisioning...
                  </>
                ) : (
                  "Provision"
                )}
              </button>
            </div>
          </div>

          <div className="bg-card rounded-lg shadow-sm p-6 space-y-4">
            <h3 className="text-primary font-semibold text-sm">User Management</h3>



            <div className="space-y-4 rounded-2xl border border-primary/10 bg-muted/10 p-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Update existing user</p>
                <p className="text-sm text-muted-foreground">Select a user, change only what is needed, and save.</p>
              </div>

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

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    if (!hasUserChanges) {
                      toast({
                        title: "No changes detected",
                        description: "Update at least one field before saving.",
                      });
                      return;
                    }
                    updateUserMutation.mutate();
                  }}
                  disabled={!userId || updateUserMutation.isPending || !hasUserChanges}
                  className="px-6 py-2 rounded-full bg-approve text-approve-foreground text-sm font-semibold disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {updateUserMutation.isPending ? (
                    <>
                      <Spinner size="sm" />
                      Updating...
                    </>
                  ) : (
                    "Update"
                  )}
                </button>
                <button
                  onClick={() => deleteUserMutation.mutate()}
                  disabled={!userId || deleteUserMutation.isPending}
                  className="px-6 py-2 rounded-full bg-destructive text-destructive-foreground text-sm font-semibold disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {deleteUserMutation.isPending ? (
                    <>
                      <Spinner size="sm" />
                      Deleting...
                    </>
                  ) : (
                    "Delete"
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SettingsPage;
