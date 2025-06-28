import { defineStore } from 'pinia'
import type { User } from '@shared/db/user'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    apiKey: localStorage.getItem('apiKey') as string | null,
    user: null as User | null,
  }),
  actions: {
    setSession(apiKey: string, user: User) {
      this.apiKey = apiKey
      this.user = user
      localStorage.setItem('apiKey', apiKey)
    },
    clearSession() {
      this.apiKey = null
      this.user = null
      localStorage.removeItem('apiKey')
    },
  },
})
