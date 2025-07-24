import { ws } from "./ws";
import { useAuthStore } from "../store/auth";
import { apiFetch } from "./api";

const auth = useAuthStore();

export async function login(email: string, password: string) {
  const res = await apiFetch('/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  if (!res.ok)
    throw new Error("Invalid credentials");

  const data = await res.json();

  auth.setSession(data.apiKey, data.user);
  ws.connect(data.apiKey);
}

export async function register(email: string, password: string, name: string) {
  const res = await apiFetch('/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
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
