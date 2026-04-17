import { create } from 'zustand'
import * as habitsApi from '../lib/habits-api'
import type {
  Habit,
  HabitOccurrence,
  CreateHabitDto,
  UpdateHabitDto,
  OccurrenceStatus,
} from '../types'

type DueTodayEntry = Habit & { occurrenceId?: string; occurrenceStatus?: OccurrenceStatus }

type HabitsState = {
  habits: Habit[]
  todaysHabits: DueTodayEntry[]
  loading: boolean
  error: string | null
  fetchHabits: (filters?: { goalId?: string }) => Promise<void>
  fetchDueToday: () => Promise<void>
  createHabit: (data: CreateHabitDto) => Promise<Habit>
  updateHabit: (id: string, data: UpdateHabitDto) => Promise<Habit>
  pauseHabit: (id: string) => Promise<void>
  resumeHabit: (id: string) => Promise<void>
  deleteHabit: (id: string) => Promise<void>
  completeOccurrence: (
    habitId: string,
    occurrenceId: string,
    data: { durationMinutes: number; note?: string },
  ) => Promise<HabitOccurrence>
  skipOccurrence: (habitId: string, occurrenceId: string) => Promise<HabitOccurrence>
}

export const useHabitsStore = create<HabitsState>((set) => ({
  habits: [],
  todaysHabits: [],
  loading: false,
  error: null,

  fetchHabits: async (filters) => {
    set({ loading: true, error: null })
    try {
      const habits = await habitsApi.getHabits(filters)
      set({ habits, loading: false })
    } catch (e) {
      set({
        loading: false,
        error: e instanceof Error ? e.message : 'Failed to load habits',
      })
    }
  },

  fetchDueToday: async () => {
    try {
      const todaysHabits = await habitsApi.getDueToday()
      set({ todaysHabits })
    } catch (e) {
      console.error('Failed to fetch due today', e)
    }
  },

  createHabit: async (data) => {
    const habit = await habitsApi.createHabit(data)
    set((s) => ({ habits: [...s.habits, habit] }))
    return habit
  },

  updateHabit: async (id, data) => {
    const updated = await habitsApi.updateHabit(id, data)
    set((s) => ({
      habits: s.habits.map((h) => (h.id === id ? updated : h)),
    }))
    return updated
  },

  pauseHabit: async (id) => {
    await habitsApi.pauseHabit(id)
    set((s) => ({
      habits: s.habits.map((h) =>
        h.id === id ? { ...h, status: 'paused' as const } : h,
      ),
    }))
  },

  resumeHabit: async (id) => {
    await habitsApi.resumeHabit(id)
    set((s) => ({
      habits: s.habits.map((h) =>
        h.id === id ? { ...h, status: 'active' as const } : h,
      ),
    }))
  },

  deleteHabit: async (id) => {
    await habitsApi.deleteHabit(id)
    set((s) => ({
      habits: s.habits.filter((h) => h.id !== id),
    }))
  },

  completeOccurrence: async (habitId, occurrenceId, data) => {
    const occ = await habitsApi.completeOccurrence(habitId, occurrenceId, data)
    set((s) => ({
      todaysHabits: s.todaysHabits.map((h) =>
        h.id === habitId
          ? { ...h, occurrenceStatus: 'COMPLETED' as const }
          : h,
      ),
    }))
    return occ
  },

  skipOccurrence: async (habitId, occurrenceId) => {
    const occ = await habitsApi.skipOccurrence(habitId, occurrenceId)
    set((s) => ({
      todaysHabits: s.todaysHabits.map((h) =>
        h.id === habitId
          ? { ...h, occurrenceStatus: 'SKIPPED' as const }
          : h,
      ),
    }))
    return occ
  },
}))