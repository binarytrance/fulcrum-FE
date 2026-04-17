import { apiFetch, unwrapApiResponse } from './api'
import type {
  AnalyticsDashboard,
  DailyAnalytics,
  WeeklyAnalytics,
  GoalAnalytics,
  EstimationProfile,
} from '../types'

// ---------------------------------------------------------------------------
// Dashboard
// ---------------------------------------------------------------------------

/**
 * Fetch the consolidated analytics dashboard (daily + weekly + goals +
 * estimation) in a single request.
 */
export async function getDashboard(): Promise<AnalyticsDashboard> {
  const response = await apiFetch('/analytics/dashboard')
  return unwrapApiResponse<AnalyticsDashboard>(response)
}

// ---------------------------------------------------------------------------
// Daily analytics
// ---------------------------------------------------------------------------

/**
 * Fetch analytics for a single calendar day.
 *
 * @param date  ISO date string, e.g. `'2025-06-25'`
 */
export async function getDailyAnalytics(date: string): Promise<DailyAnalytics> {
  const params = new URLSearchParams({ date })
  const response = await apiFetch(`/analytics/daily?${params.toString()}`)
  return unwrapApiResponse<DailyAnalytics>(response)
}

/**
 * Fetch daily analytics for every day within an inclusive date range.
 *
 * @param startDate  ISO date string for the first day, e.g. `'2025-06-01'`
 * @param endDate    ISO date string for the last day,  e.g. `'2025-06-30'`
 */
export async function getDailyRange(
  startDate: string,
  endDate: string,
): Promise<DailyAnalytics[]> {
  const params = new URLSearchParams({ startDate, endDate })
  const response = await apiFetch(`/analytics/daily/range?${params.toString()}`)
  return unwrapApiResponse<DailyAnalytics[]>(response)
}

// ---------------------------------------------------------------------------
// Weekly analytics
// ---------------------------------------------------------------------------

/**
 * Fetch analytics for the week that begins on `weekStart`.
 *
 * @param weekStart  ISO date string for the Monday of that week, e.g. `'2025-06-23'`
 */
export async function getWeeklyAnalytics(weekStart: string): Promise<WeeklyAnalytics> {
  const params = new URLSearchParams({ weekStart })
  const response = await apiFetch(`/analytics/weekly?${params.toString()}`)
  return unwrapApiResponse<WeeklyAnalytics>(response)
}

/**
 * Fetch the most recent N completed weeks of analytics, ordered newest-first.
 *
 * @param limit  Maximum number of weeks to return (optional — server default applies if omitted)
 */
export async function getRecentWeekly(limit?: number): Promise<WeeklyAnalytics[]> {
  const params = new URLSearchParams()
  if (limit !== undefined) {
    params.set('limit', String(limit))
  }
  const query = params.toString()
  const response = await apiFetch(`/analytics/weekly/recent${query ? `?${query}` : ''}`)
  return unwrapApiResponse<WeeklyAnalytics[]>(response)
}

// ---------------------------------------------------------------------------
// Goal analytics
// ---------------------------------------------------------------------------

/**
 * Fetch aggregated analytics across all of the current user's goals.
 */
export async function getGoalsAnalytics(): Promise<GoalAnalytics[]> {
  const response = await apiFetch('/analytics/goals')
  return unwrapApiResponse<GoalAnalytics[]>(response)
}

/**
 * Fetch analytics for a single goal by its ID.
 *
 * @param goalId  UUID of the goal
 */
export async function getGoalAnalytics(goalId: string): Promise<GoalAnalytics> {
  const response = await apiFetch(`/analytics/goals/${goalId}`)
  return unwrapApiResponse<GoalAnalytics>(response)
}

// ---------------------------------------------------------------------------
// Estimation profile
// ---------------------------------------------------------------------------

/**
 * Fetch the current user's task-duration estimation profile.
 * Includes the rolling accuracy average, improvement trend, and sample count.
 */
export async function getEstimationProfile(): Promise<EstimationProfile> {
  const response = await apiFetch('/analytics/estimation')
  return unwrapApiResponse<EstimationProfile>(response)
}