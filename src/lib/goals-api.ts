import { apiFetch, parseApiError, unwrapApiResponse } from './api'
import type { Goal, CreateGoalDto, UpdateGoalDto, GoalStatus, GoalCategory } from '../types'

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

export interface GoalsPaginatedResponse {
  items: Goal[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export interface GoalStatsResponse {
  total: number
  byStatus: {
    ACTIVE: number
    COMPLETED: number
    PAUSED: number
    ABANDONED: number
    MISSED: number
  }
}

type SubgoalsPayload = Goal[] | GoalsPaginatedResponse

function isPaginatedGoalsPayload(value: unknown): value is GoalsPaginatedResponse {
  if (!value || typeof value !== 'object') return false
  const maybe = value as Partial<GoalsPaginatedResponse>
  return Array.isArray(maybe.items)
}

// ---------------------------------------------------------------------------
// Goals API
// ---------------------------------------------------------------------------

/**
 * Fetch goals with optional filtering and pagination.
 * Only appends query params that are explicitly provided.
 */
export async function getGoals(
  filters?: { status?: GoalStatus; category?: GoalCategory; page?: number; limit?: number },
): Promise<GoalsPaginatedResponse> {
  const params = new URLSearchParams()

  if (filters?.status) {
    params.set('status', filters.status)
  }
  if (filters?.category) {
    params.set('category', filters.category)
  }
  if (filters?.page != null) {
    params.set('page', String(filters.page))
  }
  if (filters?.limit != null) {
    params.set('limit', String(filters.limit))
  }

  const query = params.toString()
  const path = query ? `/goals?${query}` : '/goals'

  const response = await apiFetch(path)
  return unwrapApiResponse<GoalsPaginatedResponse>(response)
}

/**
 * Fetch goal statistics (total + counts by status).
 */
export async function getGoalStats(): Promise<GoalStatsResponse> {
  const response = await apiFetch('/goals/stats')
  return unwrapApiResponse<GoalStatsResponse>(response)
}

/**
 * Full-text search goals by query string with pagination.
 */
export async function searchGoals(
  q: string,
  options?: { page?: number; limit?: number },
): Promise<GoalsPaginatedResponse> {
  const params = new URLSearchParams({ q })
  if (options?.page != null) params.set('page', String(options.page))
  if (options?.limit != null) params.set('limit', String(options.limit))
  const response = await apiFetch(`/goals/search?${params.toString()}`)
  return unwrapApiResponse<GoalsPaginatedResponse>(response)
}

/**
 * Fetch a single goal by its ID.
 */
export async function getGoal(id: string): Promise<Goal> {
  const response = await apiFetch(`/goals/${id}`)
  return unwrapApiResponse<Goal>(response)
}

/**
 * Fetch direct subgoals of a goal (flat list).
 */
export async function getSubgoals(
  id: string,
  options?: { page?: number; limit?: number },
): Promise<GoalsPaginatedResponse> {
  const params = new URLSearchParams()
  if (options?.page != null) params.set('page', String(options.page))
  if (options?.limit != null) params.set('limit', String(options.limit))
  const query = params.toString()
  const path = query ? `/goals/${id}/subgoals?${query}` : `/goals/${id}/subgoals`
  const response = await apiFetch(path)
  const payload = await unwrapApiResponse<SubgoalsPayload>(response)

  if (Array.isArray(payload)) {
    const page = options?.page ?? 1
    const limit = options?.limit ?? payload.length
    return {
      items: payload,
      total: payload.length,
      page,
      limit,
      totalPages: 1,
    }
  }

  if (isPaginatedGoalsPayload(payload)) {
    return {
      items: payload.items,
      total: payload.total,
      page: payload.page,
      limit: payload.limit,
      totalPages: payload.totalPages,
    }
  }

  return {
    items: [],
    total: 0,
    page: options?.page ?? 1,
    limit: options?.limit ?? 0,
    totalPages: 0,
  }
}

/**
 * Create a new goal.
 */
export async function createGoal(data: CreateGoalDto): Promise<Goal> {
  const response = await apiFetch('/goals', {
    method: 'POST',
    body: JSON.stringify(data),
  })
  return unwrapApiResponse<Goal>(response)
}

/**
 * Partially update an existing goal.
 */
export async function updateGoal(id: string, data: UpdateGoalDto): Promise<Goal> {
  const response = await apiFetch(`/goals/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  })
  return unwrapApiResponse<Goal>(response)
}

/**
 * Delete a goal by its ID.
 */
export async function deleteGoal(id: string): Promise<void> {
  const response = await apiFetch(`/goals/${id}`, {
    method: 'DELETE',
  })

  if (!response.ok) {
    await parseApiError(response)
  }
  // void — no body to unwrap
}