import type {
  AuthResponse,
  BookingCheckResult,
  LoadFilters,
  LoadRow,
  Mc,
  Search,
  SearchRequest,
  Source,
  User,
} from "./types";

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

  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

function query(params: Record<string, string | number | undefined>): string {
  const usp = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== "") usp.set(key, String(value));
  }
  const qs = usp.toString();
  return qs ? `?${qs}` : "";
}

// --- health / broker check -------------------------------------------------

export function checkHealth(): Promise<{ status: string }> {
  return request("/health");
}

export function checkBroker(mcNumber: string): Promise<BookingCheckResult> {
  return request(`/broker-check/${encodeURIComponent(mcNumber)}`);
}

// --- auth --------------------------------------------------------------

export function signInWithGoogle(idToken: string): Promise<AuthResponse> {
  return request("/auth/google", {
    method: "POST",
    body: JSON.stringify({ id_token: idToken }),
  });
}

export function signInWithPassword(email: string, password: string): Promise<AuthResponse> {
  return request("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export function getCurrentUser(): Promise<User> {
  return request("/auth/me");
}

// --- users ---------------------------------------------------------------

export function listUsers(): Promise<User[]> {
  return request("/users");
}

export function createUser(body: { email: string; name?: string; password: string; role: string }): Promise<User> {
  return request("/users", { method: "POST", body: JSON.stringify(body) });
}

export function updateUser(
  id: number,
  body: Partial<{ name: string; email: string; role: string; active: boolean }>,
): Promise<User> {
  return request(`/users/${id}`, { method: "PATCH", body: JSON.stringify(body) });
}

export function deleteUser(id: number): Promise<void> {
  return request(`/users/${id}`, { method: "DELETE" });
}

export function resetUserPassword(id: number, newPassword: string): Promise<User> {
  return request(`/users/${id}/reset-password`, {
    method: "POST",
    body: JSON.stringify({ new_password: newPassword }),
  });
}

export function assignUserMcs(id: number, mcIds: number[]): Promise<User> {
  return request(`/users/${id}/mcs`, { method: "POST", body: JSON.stringify({ mc_ids: mcIds }) });
}

// --- mcs ---------------------------------------------------------------

export function listMcs(): Promise<Mc[]> {
  return request("/mcs");
}

export function createMc(body: { mc_number: string; name?: string; dot_number?: string }): Promise<Mc> {
  return request("/mcs", { method: "POST", body: JSON.stringify(body) });
}

export function updateMc(
  id: number,
  body: { mc_number: string; name?: string; dot_number?: string },
): Promise<Mc> {
  return request(`/mcs/${id}`, { method: "PATCH", body: JSON.stringify(body) });
}

export function deleteMc(id: number): Promise<void> {
  return request(`/mcs/${id}`, { method: "DELETE" });
}

// --- sources -------------------------------------------------------------

export function listSources(): Promise<Source[]> {
  return request("/sources");
}

export function createSource(body: { name: string; type: string }): Promise<Source> {
  return request("/sources", { method: "POST", body: JSON.stringify(body) });
}

export function updateSource(id: number, body: Partial<{ name: string; active: boolean }>): Promise<Source> {
  return request(`/sources/${id}`, { method: "PATCH", body: JSON.stringify(body) });
}

// --- searches ------------------------------------------------------------

export function listSearches(): Promise<Search[]> {
  return request("/searches");
}

export function createSearch(body: SearchRequest): Promise<Search> {
  return request("/searches", { method: "POST", body: JSON.stringify(body) });
}

export function updateSearch(id: number, body: Partial<SearchRequest & { active: boolean }>): Promise<Search> {
  return request(`/searches/${id}`, { method: "PATCH", body: JSON.stringify(body) });
}

export function deleteSearch(id: number): Promise<void> {
  return request(`/searches/${id}`, { method: "DELETE" });
}

// --- loads ---------------------------------------------------------------

export function listLoads(filters: LoadFilters = {}): Promise<LoadRow[]> {
  return request(`/loads${query(filters as Record<string, string | number | undefined>)}`);
}
