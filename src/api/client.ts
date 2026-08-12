import type { AuthResponse, BookingCheckResult, User } from "./types";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000";
export const TOKEN_STORAGE_KEY = "da_access_token";

export class ApiError extends Error {
  status?: number;

  constructor(message: string, status?: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const token = localStorage.getItem(TOKEN_STORAGE_KEY);
  const headers = new Headers(init?.headers);
  if (token) headers.set("Authorization", `Bearer ${token}`);
  if (init?.body) headers.set("Content-Type", "application/json");

  let res: Response;
  try {
    res = await fetch(`${API_BASE_URL}${path}`, { ...init, headers });
  } catch {
    throw new ApiError(`Can't reach the API at ${API_BASE_URL}. Is the backend running?`);
  }

  if (!res.ok) {
    const detail = await res.json().catch(() => null);
    throw new ApiError(detail?.detail ?? `Request failed with status ${res.status}`, res.status);
  }

  return res.json() as Promise<T>;
}

export function checkHealth(): Promise<{ status: string }> {
  return request("/health");
}

export function signInWithGoogle(idToken: string): Promise<AuthResponse> {
  return request("/auth/google", {
    method: "POST",
    body: JSON.stringify({ id_token: idToken }),
  });
}

export function getCurrentUser(): Promise<User> {
  return request("/auth/me");
}

export function checkBroker(mcNumber: string): Promise<BookingCheckResult> {
  return request(`/broker-check/${encodeURIComponent(mcNumber)}`);
}
