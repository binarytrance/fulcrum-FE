import { create } from 'zustand'
import { setAccessToken, clearAccessToken, refreshAccessToken, apiFetch } from '../lib/api'
import type { AuthUser } from '../types'

export type { AuthUser }

const API_BASE = 'http://localhost:6969/api/v1'

type AuthState = {
  user: AuthUser | null
  isAuthenticated: boolean
  setAuth: (user: AuthUser, accessToken: string) => void
  setUser: (user: AuthUser) => void
  /**
   * Sign out the current session: revokes the refresh token cookie on the
   * backend then clears local state.  Always call this instead of calling
   * /auth/signout manually from UI code.
   */
  clearAuth: () => Promise<void>
  /**
   * Sign out ALL sessions for this user (calls POST /auth/signout-all with
   * the access token), then clears local state.
   */
  signoutAll: () => Promise<void>
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
    // Clear local state immediately so the UI responds instantly
    clearAccessToken()
    set({ user: null, isAuthenticated: false })
    // Revoke the refresh token cookie on the backend (uses HttpOnly cookie, not Bearer)
    try {
      await fetch(`${API_BASE}/auth/signout`, {
        method: 'POST',
        credentials: 'include',
      })
    } catch {
      // Ignore network errors — local state is already cleared
    }
  },

  signoutAll: async () => {
    // Revoke all sessions via access token before clearing local state
    try {
      await apiFetch('/auth/signout-all', { method: 'POST' })
    } catch {
      // Proceed with local clear even if network fails
    }
    clearAccessToken()
    set({ user: null, isAuthenticated: false })
  },

  hydrate: async () => {
    try {
      const accessToken = await refreshAccessToken()
      if (!accessToken) return

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
