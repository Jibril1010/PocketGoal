import { supabase } from "./supabase";

// Defaults to whatever host the page itself was loaded from (same hostname,
// backend's fixed dev port) rather than a hardcoded "localhost" — so the
// same build works whether you open it as localhost on this machine or as
// a LAN IP from your phone. VITE_API_BASE_URL still overrides this for a
// real deployment where the backend lives on a different domain.
const API_BASE_URL =
  (import.meta.env.VITE_API_BASE_URL as string | undefined) || `${window.location.protocol}//${window.location.hostname}:4000`;

async function authHeader(): Promise<Record<string, string>> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers = {
    "Content-Type": "application/json",
    ...(await authHeader()),
    ...(options.headers ?? {}),
  };

  const res = await fetch(`${API_BASE_URL}${path}`, { ...options, headers });
  if (!res.ok) {
    let message = res.statusText;
    try {
      const body = await res.json();
      message = body.error ?? message;
    } catch {
      // ignore
    }
    throw new Error(message);
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: "POST", body: body !== undefined ? JSON.stringify(body) : undefined }),
};
