import { clearAuth, getAuth } from "./auth";

const API_BASE_URL = (import.meta as any).env.VITE_API_BASE_URL ?? "http://localhost:8080";

export class ApiError extends Error {
  status: number;
  data: unknown;

  constructor(message: string, status: number, data: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.data = data;
  }
}

export function formatApiError(error: unknown, fallbackMessage: string) {
  if (error instanceof ApiError) {
    const responseMessage = (error.data as any)?.message || (error.data as any)?.error || error.message;
    return `HTTP ${error.status}: ${typeof responseMessage === "string" ? responseMessage : fallbackMessage}`;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return fallbackMessage;
}

function isExpiredSessionResponse(status: number, body: unknown) {
  if (status === 401) return true;
  if (status !== 403) return false;
  const message = typeof body === "string"
    ? body
    : String((body as any)?.error ?? (body as any)?.message ?? "");
  return /(?:expired|invalid)\s+(?:jwt\s+)?token|token\s+(?:has\s+)?(?:expired|invalid)|token validation failed/i.test(message);
}

function endExpiredSession() {
  clearAuth();
  window.location.replace("/auth/login");
}

async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const url = path.startsWith("http") ? path : `${API_BASE_URL}${path}`;
  const pathname = path.startsWith("http") ? new URL(path).pathname : path;
  const isPublicAuthRoute =
    pathname === "/auth/login" || pathname === "/auth/request-password-reset" || pathname === "/auth/reset-password";

  const headers = new Headers(options.headers || {});
  headers.set("Content-Type", "application/json");

  const auth = getAuth();
  if (auth && !headers.has("Authorization") && !isPublicAuthRoute) {
    headers.set("Authorization", `Bearer ${auth.token}`);
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  const isJson = response.headers.get("content-type")?.includes("application/json");
  const body = isJson ? await response.json() : await response.text();

  if (!response.ok) {
    const message = (body as any)?.error || (body as any)?.message || response.statusText;

    if (!isPublicAuthRoute && isExpiredSessionResponse(response.status, body)) {
      endExpiredSession();
    }

    throw new ApiError(typeof message === "string" ? message : "Request failed", response.status, body);
  }

  return body as T;
}

export type LoginRequest = {
  email: string;
  password: string;
  tenantId: string; // UUID
};

export type LoginResponse = {
  token: string;
  userId: string; // UUID
  tenantId: string; // UUID
  role: string;
  requiresPasswordReset?: boolean;
};

export type VirtualBank = {
  id: number;
  name: string;
  balance?: number;
  createdById?: string;
  createdBy?: string;
  tenant?: string;
  createdAt?: string;
  updatedAt?: string;
};

export type VirtualBankUpdateRequest = {
  name: string;
};

export type VirtualBankTopUpRequest = {
  amount: number;
};

export type LoanPackage = {
  id: number;
  name?: string;
  balance: number;
  interestRate: number;
  virtualBank?: VirtualBank;
};

export type BorrowerLoanPackage = {
  id: number;
  name?: string;
  balance: number;
  interestRate: number;
};

export type LoanPackageRequest = {
  name: string;
  balance: number;
  interestRate: number;
  virtualBankId: number;
};

export type LoanPeriod = "THREE_MONTHS" | "SIX_MONTHS" | "ONE_YEAR";

export type LoanRequest = {
  loanPackageId: number;
  borrowerId: string;
  principalAmount: number;
  interestRate: number;
  period: LoanPeriod;
};

export type Tenant = {
  id: string;
  name: string;
};

export type TenantRequest = {
  name: string;
};

export type UserRequest = {
  email: string;
  fullName: string;
  phoneNumber: string;
  password: string;
  tenantId: string;
  role?: "BORROWER" | "PAYMASTER";
};

export type UserProvisionRequest = {
  email: string;
  fullName: string;
  phoneNumber: string;
};

export type UserUpdateRequest = {
  email?: string;
  fullName?: string;
  phoneNumber?: string;
  password?: string;
};

export type UserBalanceTopUpRequest = {
  amount: number;
};

export type UserResponse = {
  id: string;
  email: string;
  fullName: string;
  phoneNumber?: string;
  role: string;
  balance?: number;
};

export type LoanStatus = "PENDING" | "APPROVED" | "REJECTED" | "COMPLETED" | "DEFAULTED";
export type RepaymentStatus = "PENDING" | "PARTIAL" | "PAID" | "OVERDUE";

export type LoanSummary = {
  id: number;
  borrowerId?: string;
  borrowerName?: string;
  approvedBy?: string;
  amount?: number;
  interest?: string;
  loanPackage?: string;
  virtualBank?: string;
  tenure?: string;
  repaymentAmount?: number;
  totalPaid?: number;
  outstandingAmount?: number;
  repaymentStatus?: RepaymentStatus;
  // installment?: number;
  // bank?: string;
  dueDate?: string;
  // accountName?: string;
  // accountNumber?: string;
  status: LoanStatus;
};

export type RepaymentSummary = {
  id: number;
  amount: number;
  paidAt?: string;
  paidById?: string;
  paidByName?: string;
  paidByRole?: string;
};

export type LoanStatusUpdateRequest = {
  loanStatus: LoanStatus;
};

export type AuditLogSummary = {
  id: number;
  timestamp: string;
  actorId?: string;
  actorEmail?: string;
  actorRole?: string;
  action: string;
  resourceType: string;
  resourceId?: string;
  httpMethod: string;
  path: string;
  statusCode?: number;
  ipAddress?: string;
  userAgent?: string;
  beforeStatePreview?: string;
  afterStatePreview?: string;
};

export type AuditLogPage = {
  content: AuditLogSummary[];
  totalPages: number;
  totalElements: number;
  number: number;
  size: number;
};

export type PasswordResetStartRequest = {
  email: string;
  tenantId: string;
};

export type PasswordResetRequest = {
  token: string;
  newPassword: string;
};

export function login(request: LoginRequest) {
  return apiFetch<LoginResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify(request),
  });
}

export function requestPasswordReset(request: PasswordResetStartRequest) {
  return apiFetch<void>("/auth/request-password-reset", {
    method: "POST",
    body: JSON.stringify(request),
  });
}

export function resetPassword(request: PasswordResetRequest) {
  return apiFetch<void>("/auth/reset-password", {
    method: "POST",
    body: JSON.stringify(request),
  });
}

export function fetchVirtualBanks() {
  return apiFetch<VirtualBank[]>("/banks");
}

export function updateVirtualBank(id: number, request: VirtualBankUpdateRequest) {
  return apiFetch<VirtualBank>(`/banks/${id}`, {
    method: "PUT",
    body: JSON.stringify(request),
  });
}

export function topUpVirtualBank(id: number, request: VirtualBankTopUpRequest) {
  return apiFetch<VirtualBank>(`/banks/${id}/top-up`, {
    method: "PATCH",
    body: JSON.stringify(request),
  });
}

export function deleteVirtualBank(id: number) {
  return apiFetch<void>(`/banks/${id}`, { method: "DELETE" });
}

export function fetchUserById(id: string) {
  return apiFetch<UserResponse>(`/users/${id}`);
}

export function fetchUsers() {
  return apiFetch<UserResponse[]>("/users");
}

export function createUser(request: UserRequest) {
  return apiFetch<UserResponse>("/users", {
    method: "POST",
    body: JSON.stringify(request),
  });
}

export function provisionUser(request: UserProvisionRequest) {
  return apiFetch<UserResponse>("/users/provision", {
    method: "POST",
    body: JSON.stringify(request),
  });
}

export function updateUser(id: string, request: UserUpdateRequest) {
  return apiFetch<UserResponse>(`/users/${id}`, {
    method: "PUT",
    body: JSON.stringify(request),
  });
}

export function topUpCurrentUserBalance(request: UserBalanceTopUpRequest) {
  return apiFetch<UserResponse>("/users/me/balance/top-up", {
    method: "POST",
    body: JSON.stringify(request),
  });
}

export function deleteUser(id: string) {
  return apiFetch<void>(`/users/${id}`, { method: "DELETE" });
}

export function fetchTenants() {
  return apiFetch<Tenant[]>("/tenants");
}

export function fetchTenantById(id: string) {
  return apiFetch<Tenant>(`/tenants/${id}`);
}

export function createTenant(request: TenantRequest) {
  return apiFetch<Tenant>("/tenants", {
    method: "POST",
    body: JSON.stringify(request),
  });
}

export function updateTenant(id: string, request: TenantRequest) {
  return apiFetch<Tenant>(`/tenants/${id}`, {
    method: "PUT",
    body: JSON.stringify(request),
  });
}

export function fetchLoanPackages() {
  return apiFetch<LoanPackage[]>("/loan-packages");
}

export function fetchBorrowerLoanPackages() {
  return apiFetch<BorrowerLoanPackage[]>('/borrower/loan-packages');
}

export function fetchLoanPackageById(id: number) {
  return apiFetch<LoanPackage>(`/loan-packages/${id}`);
}

export function fetchLoanPackagesByUserId(userId: string) {
  return apiFetch<LoanPackage[]>(`/loan-packages/user/${userId}`);
}

export async function createLoanPackage(request: LoanPackageRequest) {
  try {
    return await apiFetch<LoanPackage>("/loan-packages", {
      method: "POST",
      body: JSON.stringify({
        name: request.name,
        balance: request.balance,
        interestRate: request.interestRate,
        virtualBank: { id: request.virtualBankId },
      }),
    });
  } catch (error: any) {
    if ((error?.message ?? "").toLowerCase().includes("internal server error")) {
      const all = await fetchLoanPackages();
      const latestMatch = [...all].reverse().find((item) =>
        Number(item.virtualBank?.id) === request.virtualBankId &&
        Number(item.balance) === request.balance &&
        Number(item.interestRate) === request.interestRate
      );
      if (latestMatch) return latestMatch;
    }
    throw error;
  }
}

export function updateLoanPackage(id: number, request: LoanPackageRequest) {
  return apiFetch<LoanPackage>(`/loan-packages/${id}`, {
    method: "PUT",
    body: JSON.stringify({
      name: request.name,
      balance: request.balance,
      interestRate: request.interestRate,
      virtualBank: { id: request.virtualBankId },
    }),
  });
}

export function deleteLoanPackage(id: number) {
  return apiFetch<void>(`/loan-packages/${id}`, { method: "DELETE" });
}

export function createLoan(request: LoanRequest) {
  return apiFetch<unknown>("/loans", {
    method: "POST",
    body: JSON.stringify({
      loanPackageId: request.loanPackageId,
      borrowerId: request.borrowerId,
      principalAmount: request.principalAmount,
      interestRate: request.interestRate,
      period: request.period,
    }),
  });
}

export function fetchBorrowerLoans(borrowerId: string) {
  return apiFetch<LoanSummary[]>(`/users/${borrowerId}/loans`);
}

export function fetchLoans(status?: LoanStatus) {
  const query = status ? `?status=${status}` : "";
  return apiFetch<LoanSummary[]>(`/loans${query}`);
}

export function updateLoanStatus(id: number, request: LoanStatusUpdateRequest) {
  return apiFetch<LoanSummary>(`/loans/${id}`, {
    method: "PUT",
    body: JSON.stringify(request),
  });
}

export function repayLoan(id: number, amount: number) {
  return apiFetch<LoanSummary>(`/loans/${id}/repayments`, {
    method: "POST",
    body: JSON.stringify({ amount }),
  });
}

export function fetchRepayments(id: number) {
  return apiFetch<RepaymentSummary[]>(`/loans/${id}/repayments`);
}

function buildQuery(params: Record<string, string | number | undefined | null>) {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null) return;
    const str = String(value).trim();
    if (!str) return;
    searchParams.set(key, str);
  });

  const qs = searchParams.toString();
  return qs ? `?${qs}` : "";
}

async function downloadBlob(path: string, filename: string) {
  const url = path.startsWith("http") ? path : `${API_BASE_URL}${path}`;

  const auth = getAuth();
  const headers = new Headers();
  if (auth?.token) headers.set("Authorization", `Bearer ${auth.token}`);

  const response = await fetch(url, { method: "GET", headers });
  if (!response.ok) {
    const fallback = response.statusText || "Request failed";
    const contentType = response.headers.get("content-type") ?? "";
    const body = contentType.includes("application/json") ? await response.json() : await response.text();
    if (isExpiredSessionResponse(response.status, body)) {
      endExpiredSession();
    }
    throw new ApiError(fallback, response.status, null);
  }

  const blob = await response.blob();
  const downloadUrl = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = downloadUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(downloadUrl);
}

export function fetchAuditLogs(params: {
  page: number;
  size: number;
  from?: string;
  to?: string;
  actorEmail?: string;
  action?: string;
  resourceType?: string;
  resourceId?: string;
}) {
  const query = buildQuery({
    page: params.page,
    size: params.size,
    from: params.from,
    to: params.to,
    actorEmail: params.actorEmail,
    action: params.action,
    resourceType: params.resourceType,
    resourceId: params.resourceId,
  });

  return apiFetch<AuditLogPage>(`/audit-logs${query}`);
}

export async function exportAuditLogsCsv(params: {
  from?: string;
  to?: string;
  actorEmail?: string;
  action?: string;
  resourceType?: string;
  resourceId?: string;
  maxRows?: number;
}) {
  const query = buildQuery({
    from: params.from,
    to: params.to,
    actorEmail: params.actorEmail,
    action: params.action,
    resourceType: params.resourceType,
    resourceId: params.resourceId,
    maxRows: params.maxRows,
  });

  const now = new Date();
  const filename = `audit-logs-${now.toISOString().slice(0, 10)}.csv`;
  await downloadBlob(`/audit-logs/export/csv${query}`, filename);
}

export async function exportAuditLogsPdf(params: {
  from?: string;
  to?: string;
  actorEmail?: string;
  action?: string;
  resourceType?: string;
  resourceId?: string;
  maxRows?: number;
}) {
  const query = buildQuery({
    from: params.from,
    to: params.to,
    actorEmail: params.actorEmail,
    action: params.action,
    resourceType: params.resourceType,
    resourceId: params.resourceId,
    maxRows: params.maxRows,
  });

  const now = new Date();
  const filename = `audit-logs-${now.toISOString().slice(0, 10)}.pdf`;
  await downloadBlob(`/audit-logs/export/pdf${query}`, filename);
}
