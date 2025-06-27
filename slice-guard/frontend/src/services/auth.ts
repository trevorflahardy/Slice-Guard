import { reactive } from 'vue'
import { ws } from './ws'

const API_URL = (import.meta as any).env.VITE_API_URL ?? 'http://localhost:3000/api'

export const authState = reactive<{ apiKey: string | null }>({
  apiKey: localStorage.getItem('apiKey'),
})

export async function login(email: string, password: string) {
  const res = await fetch(`${API_URL}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  })
  if (!res.ok) throw new Error('Invalid credentials')
  const data = await res.json()
  authState.apiKey = data.apiKey
  localStorage.setItem('apiKey', data.apiKey)
  ws.connect(data.apiKey)
}

export async function register(email: string, password: string, name: string) {
  const res = await fetch(`${API_URL}/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, name })
  })
  if (!res.ok) throw new Error('Registration failed')
  const data = await res.json()
  authState.apiKey = data.apiKey
  localStorage.setItem('apiKey', data.apiKey)
  ws.connect(data.apiKey)
}

export function logout() {
  localStorage.removeItem('apiKey')
  authState.apiKey = null
}

export async function authorizedFetch(input: string, init: RequestInit = {}) {
  if (!authState.apiKey) throw new Error('Not authenticated')
  const headers = new Headers(init.headers)
  headers.set('Authorization', `ApiKey ${authState.apiKey}`)
  return fetch(`${API_URL}${input}`, { ...init, headers })
}
