import { create } from 'zustand'

type ActiveSession = {
  sessionId: string
  taskId: string
  taskTitle: string
  startedAt: string
  elapsedMs: number
  plantGrowthPercent: number
  taskEstimatedDurationMs: number
}

type SessionState = {
  activeSession: ActiveSession | null
  startSession: (data: ActiveSession) => void
  updateElapsed: (elapsedMs: number, plantGrowthPercent: number) => void
  endSession: () => void
}

export const useSessionStore = create<SessionState>((set) => ({
  activeSession: null,

  startSession: (data) => set({ activeSession: data }),

  updateElapsed: (elapsedMs, plantGrowthPercent) =>
    set((s) =>
      s.activeSession
        ? { activeSession: { ...s.activeSession, elapsedMs, plantGrowthPercent } }
        : s,
    ),

  endSession: () => set({ activeSession: null }),
}))
