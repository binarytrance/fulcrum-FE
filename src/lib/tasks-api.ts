import { apiFetch, parseApiError, unwrapApiResponse } from './api'
import type { Task, CreateTaskDto, UpdateTaskDto, TaskType, TaskStatus } from '../types'

// ---------------------------------------------------------------------------
// Internal helper — parse a successful JSON response
// ---------------------------------------------------------------------------



// ---------------------------------------------------------------------------
// Tasks API
// ---------------------------------------------------------------------------

/**
 * Retrieve all tasks, with optional filters.
 *
 * @param filters.date     ISO date string (YYYY-MM-DD) — return tasks scheduled for that day
 * @param filters.type     PLANNED | UNPLANNED
 * @param filters.status   PENDING | IN_PROGRESS | COMPLETED | CANCELLED
 * @param filters.goalId   Only tasks linked to this goal
 */
export async function getTasks(filters?: {
  date?: string
  type?: TaskType
  status?: TaskStatus
  goalId?: string
}): Promise<Task[]> {
  const params = new URLSearchParams()

  if (filters) {
    if (filters.date)   params.set('date',   filters.date)
    if (filters.type)   params.set('type',   filters.type)
    if (filters.status) params.set('status', filters.status)
    if (filters.goalId) params.set('goalId', filters.goalId)
  }

  const query = params.toString()
  const path = query ? `/tasks?${query}` : '/tasks'

  const response = await apiFetch(path)
  return unwrapApiResponse<Task[]>(response)
}

/**
 * Retrieve a single task by its ID.
 */
export async function getTask(id: string): Promise<Task> {
  const response = await apiFetch(`/tasks/${id}`)
  return unwrapApiResponse<Task>(response)
}

/**
 * Create a new task.
 */
export async function createTask(data: CreateTaskDto): Promise<Task> {
  const response = await apiFetch('/tasks', {
    method: 'POST',
    body: JSON.stringify(data),
  })
  return unwrapApiResponse<Task>(response)
}

/**
 * Update an existing task (partial update).
 */
export async function updateTask(id: string, data: UpdateTaskDto): Promise<Task> {
  const response = await apiFetch(`/tasks/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  })
  return unwrapApiResponse<Task>(response)
}

/**
 * Mark a task as completed.
 *
 * @param id              The task ID to complete
 * @param actualDuration  Actual time spent in minutes (optional)
 */
export async function completeTask(id: string, actualDuration?: number): Promise<Task> {
  const body = actualDuration !== undefined ? { actualDuration } : {}

  const response = await apiFetch(`/tasks/${id}/complete`, {
    method: 'PATCH',
    body: JSON.stringify(body),
  })
  return unwrapApiResponse<Task>(response)
}

/**
 * Permanently delete a task.
 */
export async function deleteTask(id: string): Promise<void> {
  const response = await apiFetch(`/tasks/${id}`, {
    method: 'DELETE',
  })

  if (!response.ok) {
    await parseApiError(response)
  }
}