import { jwtDecode } from "jwt-decode";

export type AuthData = {
  token: string;
  userId: string;
  tenantId: string;
  role: string;
};

type DecodedJwt = {
  exp?: number;
};

const AUTH_STORAGE_KEY = "lawra_auth";

export function normalizeRole(role?: string | null) {
  if (!role) {
    return null;
  }

  return role.startsWith("ROLE_") ? role.slice(5) : role;
}

export function saveAuth(data: AuthData) {
  try {
    sessionStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    // Ignore storage errors to avoid breaking the UI
    console.error("Failed to save auth data", error);
  }
}

export function getAuth(): AuthData | null {
  try {
    const raw = sessionStorage.getItem(AUTH_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as AuthData;
  } catch (error) {
    console.error("Failed to read auth data", error);
    return null;
  }
}

export function clearAuth() {
  try {
    sessionStorage.removeItem(AUTH_STORAGE_KEY);
  } catch (error) {
    console.error("Failed to clear auth data", error);
  }
}

export function isAuthTokenExpired(token: string | null | undefined, now = Date.now()) {
  if (!token) {
    return true;
  }

  try {
    const decodedToken = jwtDecode<DecodedJwt>(token);
    if (typeof decodedToken.exp !== "number") {
      return true;
    }

    return decodedToken.exp * 1000 <= now;
  } catch (error) {
    console.error("Failed to inspect auth token", error);
    return true;
  }
}
