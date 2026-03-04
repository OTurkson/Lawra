export type AuthData = {
  token: string;
  userId: number;
  tenantId: number;
  role: string;
};

const AUTH_STORAGE_KEY = "lawra_auth";

export function saveAuth(data: AuthData) {
  try {
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    // Ignore storage errors to avoid breaking the UI
    console.error("Failed to save auth data", error);
  }
}

export function getAuth(): AuthData | null {
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as AuthData;
  } catch (error) {
    console.error("Failed to read auth data", error);
    return null;
  }
}

export function clearAuth() {
  try {
    localStorage.removeItem(AUTH_STORAGE_KEY);
  } catch (error) {
    console.error("Failed to clear auth data", error);
  }
}
