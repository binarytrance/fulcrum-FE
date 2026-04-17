import { apiFetch, parseApiError, unwrapApiResponse } from './api'
import type {
  Habit,
  HabitOccurrence,
  HabitAnalytics,
  CreateHabitDto,
  UpdateHabitDto,
  OccurrenceStatus,
} from '../types'

// ---------------------------------------------------------------------------
// Internal helper — parses the response as JSON or throws a descriptive error
// ---------------------------------------------------------------------------



// ---------------------------------------------------------------------------
// Habits CRUD
// ---------------------------------------------------------------------------

/**
 * Retrieve all habits, optionally filtered by the goal they belong to.
 */
export async function getHabits(filters?: { goalId?: string }): Promise<Habit[]> {
  const params = new URLSearchParams()

  if (filters?.goalId !== undefined) {
    params.set('goalId', filters.goalId)
  }

  const query = params.toString()
  const path = query ? `/habits?${query}` : '/habits'

  const response = await apiFetch(path)
  return unwrapApiResponse<Habit[]>(response)
}

/**
 * Retrieve a single habit by its ID.
 */
export async function getHabit(id: string): Promise<Habit> {
  const response = await apiFetch(`/habits/${id}`)
  return unwrapApiResponse<Habit>(response)
}

/**
 * Retrieve all habits that are due today, including their current occurrence
 * metadata so the UI can show completion / skip controls.
 */
export async function getDueToday(): Promise<
  Array<Habit & { occurrenceId?: string; occurrenceStatus?: OccurrenceStatus }>
> {
  const response = await apiFetch('/habits/due-today')
  return unwrapApiResponse<
    Array<Habit & { occurrenceId?: string; occurrenceStatus?: OccurrenceStatus }>
  >(response)
}

/**
 * Create a new habit.
 */
export async function createHabit(data: CreateHabitDto): Promise<Habit> {
  const response = await apiFetch('/habits', {
    method: 'POST',
    body: JSON.stringify(data),
  })
  return unwrapApiResponse<Habit>(response)
}

/**
 * Update fields on an existing habit.
 */
export async function updateHabit(id: string, data: UpdateHabitDto): Promise<Habit> {
  const response = await apiFetch(`/habits/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  })
  return unwrapApiResponse<Habit>(response)
}

/**
 * Pause an active habit — its occurrences will no longer be generated until
 * the habit is resumed.
 */
export async function pauseHabit(id: string): Promise<Habit> {
  const response = await apiFetch(`/habits/${id}/pause`, {
    method: 'PATCH',
  })
  return unwrapApiResponse<Habit>(response)
}

/**
 * Resume a previously paused habit.
 */
export async function resumeHabit(id: string): Promise<Habit> {
  const response = await apiFetch(`/habits/${id}/resume`, {
    method: 'PATCH',
  })
  return unwrapApiResponse<Habit>(response)
}

/**
 * Permanently delete a habit and all of its occurrences.
 */
export async function deleteHabit(id: string): Promise<void> {
  const response = await apiFetch(`/habits/${id}`, {
    method: 'DELETE',
  })

  if (!response.ok) {
    await parseApiError(response)
  }
}

// ---------------------------------------------------------------------------
// Occurrence management
// ---------------------------------------------------------------------------

/**
 * Retrieve all occurrences for a given habit.
 */
export async function getOccurrences(habitId: string): Promise<HabitOccurrence[]> {
  const response = await apiFetch(`/habits/${habitId}/occurrences`)
  return unwrapApiResponse<HabitOccurrence[]>(response)
}

/**
 * Mark a specific occurrence as completed, recording how long the habit
 * actually took and an optional note.
 */
export async function completeOccurrence(
  habitId: string,
  occurrenceId: string,
  data: { durationMinutes: number; note?: string },
): Promise<HabitOccurrence> {
  const response = await apiFetch(
    `/habits/${habitId}/occurrences/${occurrenceId}/complete`,
    {
      method: 'PATCH',
      body: JSON.stringify(data),
    },
  )
  return unwrapApiResponse<HabitOccurrence>(response)
}

/**
 * Mark a specific occurrence as skipped (intentionally missed).
 */
export async function skipOccurrence(
  habitId: string,
  occurrenceId: string,
): Promise<HabitOccurrence> {
  const response = await apiFetch(
    `/habits/${habitId}/occurrences/${occurrenceId}/skip`,
    {
      method: 'PATCH',
    },
  )
  return unwrapApiResponse<HabitOccurrence>(response)
}

// ---------------------------------------------------------------------------
// Analytics
// ---------------------------------------------------------------------------

/**
 * Retrieve aggregated analytics for a single habit — streaks, completion rate,
 * average duration, and the most commonly missed day of the week.
 */
export async function getHabitAnalytics(habitId: string): Promise<HabitAnalytics> {
  const response = await apiFetch(`/habits/${habitId}/analytics`)
  return unwrapApiResponse<HabitAnalytics>(response)
}