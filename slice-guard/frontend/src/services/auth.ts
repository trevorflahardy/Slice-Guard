import { ws } from "./ws";
import { useAuthStore } from "../store/auth";

const API_URL = (import.meta as any).env.VITE_API_URL ?? "/api";

const auth = useAuthStore();

export async function login(email: string, password: string) {
  const res = await fetch(`${API_URL}/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  if (!res.ok)
    throw new Error("Invalid credentials");

  const data = await res.json();

  auth.setSession(data.apiKey, data.user);
  ws.connect(data.apiKey);
}

export async function register(email: string, password: string, name: string) {
  const res = await fetch(`${API_URL}/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password, name }),
  });

  if (!res.ok)
    throw new Error("Registration failed");

  const data = await res.json();

  auth.setSession(data.apiKey, data.user);
  ws.connect(data.apiKey);
}

export function logout() {
  auth.clearSession();
}

export async function authorizedFetch(input: string, init: RequestInit = {}) {
  if (!auth.apiKey) throw new Error("Not authenticated");
  const headers = new Headers(init.headers);

  headers.set("Authorization", `ApiKey ${auth.apiKey}`);
  return fetch(`${API_URL}${input}`, { ...init, headers });
}
