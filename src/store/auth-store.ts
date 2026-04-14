import { create } from 'zustand'
import { setAccessToken, clearAccessToken } from '../lib/api'
import type { AuthUser } from '../types'

export type { AuthUser }

const API_BASE = 'http://localhost:6969/api/v1'

type AuthState = {
  user: AuthUser | null
  isAuthenticated: boolean
  setAuth: (user: AuthUser, accessToken: string) => void
  setUser: (user: AuthUser) => void
  clearAuth: () => Promise<void>
  hydrate: () => Promise<void>
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,

  setAuth: (user, accessToken) => {
    setAccessToken(accessToken)
    set({ user, isAuthenticated: true })
  },

  setUser: (user) => set({ user, isAuthenticated: true }),

  clearAuth: async () => {
    clearAccessToken()
    set({ user: null, isAuthenticated: false })
    try {
      await fetch(`${API_BASE}/auth/signout`, {
        method: 'POST',
        credentials: 'include',
      })
    } catch {
      // Ignore network errors — local state is already cleared
    }
  },

  hydrate: async () => {
    try {
      const refreshResponse = await fetch(`${API_BASE}/auth/refresh`, {
        method: 'POST',
        credentials: 'include',
      })

      if (!refreshResponse.ok) return

      const refreshEnvelope = (await refreshResponse.json()) as {
        success: boolean
        data?: { accessToken: string }
      }

      if (!refreshEnvelope.success || !refreshEnvelope.data?.accessToken) return

      const { accessToken } = refreshEnvelope.data
      setAccessToken(accessToken)

      const meResponse = await fetch(`${API_BASE}/auth/me`, {
        method: 'GET',
        headers: {
          Accept: 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
      })

      if (!meResponse.ok) return

      const meEnvelope = (await meResponse.json()) as {
        success: boolean
        data?: AuthUser
      }

      if (!meEnvelope.success || !meEnvelope.data) return

      set({ user: meEnvelope.data, isAuthenticated: true })
    } catch {
      // Stay logged out on any failure — no-op
    }
  },
}))