import { create } from 'zustand'
import * as goalsApi from '../lib/goals-api'
import type { GoalStatsResponse } from '../lib/goals-api'
import type { Goal, CreateGoalDto, UpdateGoalDto, GoalStatus, GoalCategory } from '../types'

export type GoalCounts = {
  ALL: number
  ACTIVE: number
  PAUSED: number
  COMPLETED: number
  ABANDONED: number
  MISSED: number
}

export type GoalPagination = {
  total: number
  page: number
  totalPages: number
}

type GoalsState = {
  goals: Goal[]
  loading: boolean
  loadingMore: boolean
  error: string | null
  pagination: GoalPagination | null
  counts: GoalCounts | null
  countsLoading: boolean
  // Search
  searchQuery: string
  searchResults: Goal[]
  searchPagination: GoalPagination | null
  searchLoading: boolean
  searchError: string | null
  fetchGoals: (filters?: { status?: GoalStatus; category?: GoalCategory; page?: number; limit?: number }) => Promise<void>
  loadMoreGoals: (filters?: { status?: GoalStatus; category?: GoalCategory; page?: number; limit?: number }) => Promise<void>
  fetchGoalCounts: () => Promise<void>
  searchGoals: (q: string, options?: { page?: number; limit?: number }) => Promise<void>
  loadMoreSearch: (q: string, options?: { page?: number; limit?: number }) => Promise<void>
  clearSearch: () => void
  createGoal: (data: CreateGoalDto) => Promise<Goal>
  updateGoal: (id: string, data: UpdateGoalDto) => Promise<Goal>
  deleteGoal: (id: string) => Promise<void>
  setGoals: (goals: Goal[]) => void
}

export const useGoalsStore = create<GoalsState>((set) => ({
  goals: [],
  loading: false,
  loadingMore: false,
  error: null,
  pagination: null,
  counts: null,
  countsLoading: false,
  searchQuery: '',
  searchResults: [],
  searchPagination: null,
  searchLoading: false,
  searchError: null,

  fetchGoals: async (filters) => {
    set({ loading: true, error: null })
    try {
      const result = await goalsApi.getGoals(filters)
      set({
        goals: result.items,
        loading: false,
        pagination: { total: result.total, page: result.page, totalPages: result.totalPages },
      })
    } catch (e) {
      set({ loading: false, error: e instanceof Error ? e.message : 'Failed to load goals' })
    }
  },

  loadMoreGoals: async (filters) => {
    set({ loadingMore: true })
    try {
      const result = await goalsApi.getGoals(filters)
      set((s) => ({
        goals: [...s.goals, ...result.items],
        loadingMore: false,
        pagination: { total: result.total, page: result.page, totalPages: result.totalPages },
      }))
    } catch (e) {
      set({ loadingMore: false })
    }
  },

  searchGoals: async (q, options) => {
    set({ searchLoading: true, searchError: null, searchQuery: q })
    try {
      const result = await goalsApi.searchGoals(q, options)
      set({
        searchResults: result.items,
        searchPagination: { total: result.total, page: result.page, totalPages: result.totalPages },
        searchLoading: false,
      })
    } catch (e) {
      set({ searchLoading: false, searchError: e instanceof Error ? e.message : 'Search failed' })
    }
  },

  loadMoreSearch: async (q, options) => {
    set({ loadingMore: true })
    try {
      const result = await goalsApi.searchGoals(q, options)
      set((s) => ({
        searchResults: [...s.searchResults, ...result.items],
        searchPagination: { total: result.total, page: result.page, totalPages: result.totalPages },
        loadingMore: false,
      }))
    } catch {
      set({ loadingMore: false })
    }
  },

  clearSearch: () => set({ searchQuery: '', searchResults: [], searchPagination: null, searchError: null }),

  fetchGoalCounts: async () => {
    set({ countsLoading: true })
    try {
      const stats: GoalStatsResponse = await goalsApi.getGoalStats()
      set({
        counts: {
          ALL: stats.total,
          ACTIVE: stats.byStatus.ACTIVE,
          PAUSED: stats.byStatus.PAUSED,
          COMPLETED: stats.byStatus.COMPLETED,
          ABANDONED: stats.byStatus.ABANDONED,
          MISSED: stats.byStatus.MISSED,
        },
        countsLoading: false,
      })
    } catch {
      set({ countsLoading: false })
    }
  },

  createGoal: async (data) => {
    const goal = await goalsApi.createGoal(data)
    set((s) => ({ goals: [goal, ...s.goals] }))
    return goal
  },

  updateGoal: async (id, data) => {
    const updated = await goalsApi.updateGoal(id, data)
    set((s) => ({ goals: s.goals.map((g) => g.id === id ? updated : g) }))
    return updated
  },

  deleteGoal: async (id) => {
    await goalsApi.deleteGoal(id)
    set((s) => ({ goals: s.goals.filter((g) => g.id !== id) }))
  },

  setGoals: (goals) => set({ goals }),
}))