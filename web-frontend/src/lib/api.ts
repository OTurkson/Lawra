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

export function fetchUserById(id: number) {
  return apiFetch<UserResponse>(`/users/${id}`);
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
