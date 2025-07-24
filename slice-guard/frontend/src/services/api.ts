import { useAuthStore } from '../store/auth'

const API_URL = (import.meta as any).env.VITE_API_URL ?? '/api'

export function apiFetch(input: string, init: RequestInit = {}) {
  const auth = useAuthStore()
  const headers = new Headers(init.headers)
  if (auth.apiKey) headers.set('Authorization', `ApiKey ${auth.apiKey}`)
  return fetch(`${API_URL}${input}`, { ...init, headers })
}

export { API_URL }
