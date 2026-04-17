import { create } from 'zustand'
import * as goalsApi from '../lib/goals-api'
import type { Goal, CreateGoalDto, UpdateGoalDto, GoalStatus, GoalCategory } from '../types'

type GoalsState = {
  goals: Goal[]
  loading: boolean
  error: string | null
  fetchGoals: (filters?: { status?: GoalStatus; category?: GoalCategory }) => Promise<void>
  createGoal: (data: CreateGoalDto) => Promise<Goal>
  updateGoal: (id: string, data: UpdateGoalDto) => Promise<Goal>
  deleteGoal: (id: string) => Promise<void>
  setGoals: (goals: Goal[]) => void
}

export const useGoalsStore = create<GoalsState>((set) => ({
  goals: [],
  loading: false,
  error: null,

  fetchGoals: async (filters) => {
    set({ loading: true, error: null })
    try {
      const goals = await goalsApi.getGoals(filters)
      set({ goals, loading: false })
    } catch (e) {
      set({ loading: false, error: e instanceof Error ? e.message : 'Failed to load goals' })
    }
  },

  createGoal: async (data) => {
    const goal = await goalsApi.createGoal(data)
    set((s) => ({ goals: [...s.goals, goal] }))
    return goal
  },

  updateGoal: async (id, data) => {
    const updated = await goalsApi.updateGoal(id, data)
    set((s) => ({ goals: s.goals.map((g) => (g.id === id ? updated : g)) }))
    return updated
  },

  deleteGoal: async (id) => {
    await goalsApi.deleteGoal(id)
    set((s) => ({ goals: s.goals.filter((g) => g.id !== id) }))
  },

  setGoals: (goals) => set({ goals }),
}))