import { apiFetch, parseApiError, unwrapApiResponse } from './api'
import type { Goal, CreateGoalDto, UpdateGoalDto, GoalStatus, GoalCategory } from '../types'

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------



// ---------------------------------------------------------------------------
// Goals API
// ---------------------------------------------------------------------------

/**
 * Fetch all goals, optionally filtered by status and/or category.
 * Only appends query params that are explicitly provided.
 */
export async function getGoals(
  filters?: { status?: GoalStatus; category?: GoalCategory },
): Promise<Goal[]> {
  const params = new URLSearchParams()

  if (filters?.status) {
    params.set('status', filters.status)
  }
  if (filters?.category) {
    params.set('category', filters.category)
  }

  const query = params.toString()
  const path = query ? `/goals?${query}` : '/goals'

  const response = await apiFetch(path)
  return unwrapApiResponse<Goal[]>(response)
}

/**
 * Fetch a single goal by its ID.
 */
export async function getGoal(id: string): Promise<Goal> {
  const response = await apiFetch(`/goals/${id}`)
  return unwrapApiResponse<Goal>(response)
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