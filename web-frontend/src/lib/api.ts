import { getAuth } from "./auth";

const API_BASE_URL = (import.meta as any).env.VITE_API_BASE_URL ?? "http://localhost:8080";

async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const url = path.startsWith("http") ? path : `${API_BASE_URL}${path}`;

  const headers = new Headers(options.headers || {});
  headers.set("Content-Type", "application/json");

  const auth = getAuth();
  if (auth && !headers.has("Authorization")) {
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
    throw new Error(typeof message === "string" ? message : "Request failed");
  }

  return body as T;
}

export type LoginRequest = {
  email: string;
  password: string;
  tenantId: number;
};

export type LoginResponse = {
  token: string;
  userId: number;
  tenantId: number;
  role: string;
};

export type VirtualBank = {
  id: number;
  name: string;
  balance?: number;
};

export type VirtualBankRequest = {
  name: string;
  balance?: number;
  createdById: number;
  tenantId: number;
};

export type LoanPackage = {
  id: number;
  balance: number;
  interestRate: number;
  virtualBank?: VirtualBank;
};

export type LoanPackageRequest = {
  balance: number;
  interestRate: number;
  virtualBankId: number;
};

export type LoanPeriod = "THREE_MONTHS" | "SIX_MONTHS" | "ONE_YEAR";

export type LoanRequest = {
  loanPackageId: number;
  borrowerId: number;
  principalAmount: number;
  interestRate: number;
  period: LoanPeriod;
};

export type Tenant = {
  id: number;
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
};

export type UserResponse = {
  id: number;
  email: string;
  fullName: string;
  phoneNumber?: string;
  role: string;
};

export type LoanStatus = "PENDING" | "APPROVED" | "REJECTED" | "COMPLETED" | "DEFAULTED";

export type LoanSummary = {
  id: number;
  borrowerName?: string;
  amount?: number;
  interest?: string;
  virtualBank?: string;
  tenure?: string;
  installment?: number;
  bank?: string;
  accountName?: string;
  accountNumber?: string;
  status: LoanStatus;
};

export function login(request: LoginRequest) {
  return apiFetch<LoginResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify(request),
  });
}

export function fetchVirtualBanks() {
  return apiFetch<VirtualBank[]>("/banks");
}

export function createVirtualBank(request: VirtualBankRequest) {
  return apiFetch<VirtualBank>("/banks", {
    method: "POST",
    body: JSON.stringify({
      name: request.name,
      balance: request.balance,
      createdBy: { id: request.createdById },
      tenant: { id: request.tenantId },
    }),
  });
}

export function fetchUserById(id: number) {
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

export function updateUser(id: number, request: UserRequest) {
  return apiFetch<UserResponse>(`/users/${id}`, {
    method: "PUT",
    body: JSON.stringify(request),
  });
}

export function deleteUser(id: number) {
  return apiFetch<void>(`/users/${id}`, { method: "DELETE" });
}

export function fetchTenants() {
  return apiFetch<Tenant[]>("/tenants");
}

export function fetchTenantById(id: number) {
  return apiFetch<Tenant>(`/tenants/${id}`);
}

export function createTenant(request: TenantRequest) {
  return apiFetch<Tenant>("/tenants", {
    method: "POST",
    body: JSON.stringify(request),
  });
}

export function updateTenant(id: number, request: TenantRequest) {
  return apiFetch<Tenant>(`/tenants/${id}`, {
    method: "PUT",
    body: JSON.stringify(request),
  });
}

export function deleteTenant(id: number) {
  return apiFetch<void>(`/tenants/${id}`, { method: "DELETE" });
}

export function fetchLoanPackages() {
  return apiFetch<LoanPackage[]>("/loan-packages");
}

export function fetchLoanPackageById(id: number) {
  return apiFetch<LoanPackage>(`/loan-packages/${id}`);
}

export async function createLoanPackage(request: LoanPackageRequest) {
  try {
    return await apiFetch<LoanPackage>("/loan-packages", {
      method: "POST",
      body: JSON.stringify({
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

export async function updateLoanPackage(id: number, request: LoanPackageRequest) {
  try {
    return await apiFetch<LoanPackage>(`/loan-packages/${id}`, {
      method: "PUT",
      body: JSON.stringify({
        balance: request.balance,
        interestRate: request.interestRate,
        virtualBank: { id: request.virtualBankId },
      }),
    });
  } catch (error: any) {
    if ((error?.message ?? "").toLowerCase().includes("internal server error")) {
      return fetchLoanPackageById(id);
    }
    throw error;
  }
}

export function deleteLoanPackage(id: number) {
  return apiFetch<void>(`/loan-packages/${id}`, { method: "DELETE" });
}

export function createLoan(request: LoanRequest) {
  return apiFetch<unknown>("/loans", {
    method: "POST",
    body: JSON.stringify({
      loanPackage: { id: request.loanPackageId },
      borrower: { id: request.borrowerId },
      principalAmount: request.principalAmount,
      interestRate: request.interestRate,
      period: request.period,
      totalRepaymentAmount: request.principalAmount,
      dueDate: new Date().toISOString().split("T")[0],
    }),
  });
}

export function fetchLoans(status?: LoanStatus) {
  const query = status ? `?status=${status}` : "";
  return apiFetch<LoanSummary[]>(`/paymaster/loans${query}`);
}

export function approveLoan(id: number) {
  return apiFetch<LoanSummary>(`/paymaster/loans/${id}/approve`, { method: "POST" });
}

export function rejectLoan(id: number) {
  return apiFetch<LoanSummary>(`/paymaster/loans/${id}/reject`, { method: "POST" });
}
