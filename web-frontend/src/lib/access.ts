import { normalizeRole } from "@/lib/auth";

export type AppRole = "ADMIN" | "PAYMASTER" | "BORROWER" | null;

export type RoleAccess = {
  canBorrow: boolean;
  canManageLending: boolean;
  canManageAllLending: boolean;
  canManageLoans: boolean;
  canViewAuditLogs: boolean;
  canViewVirtualBanks: boolean;
  canManageTenant: boolean;
};

export function getAppRole(role?: string | null): AppRole {
  const normalized = normalizeRole(role);
  return normalized === "ADMIN" || normalized === "PAYMASTER" || normalized === "BORROWER"
    ? normalized
    : null;
}

export function getRoleAccess(role?: string | null): RoleAccess {
  const appRole = getAppRole(role);
  const isManagement = appRole === "ADMIN" || appRole === "PAYMASTER";

  return {
    canBorrow: appRole === "BORROWER" || appRole === "PAYMASTER",
    canManageLending: appRole !== null,
    canManageAllLending: isManagement,
    canManageLoans: isManagement,
    canViewAuditLogs: isManagement,
    canViewVirtualBanks: appRole !== null,
    canManageTenant: appRole === "ADMIN",
  };
}

export function roleLabel(role?: string | null): string {
  switch (getAppRole(role)) {
    case "ADMIN":
      return "Administrator";
    case "PAYMASTER":
      return "Paymaster";
    case "BORROWER":
      return "Employee";
    default:
      return "User";
  }
}
