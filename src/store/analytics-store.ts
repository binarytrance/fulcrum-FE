import { create } from 'zustand'
import * as analyticsApi from '../lib/analytics-api'
import type { AnalyticsDashboard, DailyAnalytics, WeeklyAnalytics, GoalAnalytics } from '../types'

type AnalyticsState = {
  dashboard: AnalyticsDashboard | null
  dailyRange: DailyAnalytics[]
  weeklyHistory: WeeklyAnalytics[]
  goalsAnalytics: GoalAnalytics[]
  loading: boolean
  fetchDashboard: () => Promise<void>
  fetchDailyRange: (startDate: string, endDate: string) => Promise<void>
  fetchWeeklyHistory: (limit?: number) => Promise<void>
  fetchGoalsAnalytics: () => Promise<void>
}

export const useAnalyticsStore = create<AnalyticsState>((set) => ({
  dashboard: null,
  dailyRange: [],
  weeklyHistory: [],
  goalsAnalytics: [],
  loading: false,

  fetchDashboard: async () => {
    set({ loading: true })
    try {
      const dashboard = await analyticsApi.getDashboard()
      set({ dashboard, loading: false })
    } catch {
      set({ loading: false })
    }
  },

  fetchDailyRange: async (startDate, endDate) => {
    try {
      const dailyRange = await analyticsApi.getDailyRange(startDate, endDate)
      set({ dailyRange })
    } catch { /* ignore */ }
  },

  fetchWeeklyHistory: async (limit) => {
    try {
      const weeklyHistory = await analyticsApi.getRecentWeekly(limit)
      set({ weeklyHistory })
    } catch { /* ignore */ }
  },

  fetchGoalsAnalytics: async () => {
    try {
      const goalsAnalytics = await analyticsApi.getGoalsAnalytics()
      set({ goalsAnalytics })
    } catch { /* ignore */ }
  },
}))