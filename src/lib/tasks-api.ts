import { apiFetch, parseApiError, unwrapApiResponse } from './api'
import type { Task, CreateTaskDto, UpdateTaskDto, TaskType, TaskStatus } from '../types'

export type TasksPaginatedResponse = {
  items: Task[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export type TaskStatsResponse = {
  total: number
  byStatus: { PENDING: number; IN_PROGRESS: number; COMPLETED: number; CANCELLED: number }
  byType: { PLANNED: number; UNPLANNED: number }
}

// ---------------------------------------------------------------------------
// Tasks API
// ---------------------------------------------------------------------------

/**
 * Retrieve tasks with optional filters. Returns flat array (extracts .items).
 * Use getPaginatedTasks() when you need pagination metadata.
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
  const result = await unwrapApiResponse<TasksPaginatedResponse>(response)
  return result.items
}

/**
 * Retrieve tasks with full pagination metadata.
 */
export async function getPaginatedTasks(filters?: {
  status?: TaskStatus
  type?: TaskType
  goalId?: string
  page?: number
  limit?: number
}): Promise<TasksPaginatedResponse> {
  const params = new URLSearchParams()

  if (filters) {
    if (filters.status) params.set('status', filters.status)
    if (filters.type)   params.set('type',   filters.type)
    if (filters.goalId) params.set('goalId', filters.goalId)
    if (filters.page != null)  params.set('page',  String(filters.page))
    if (filters.limit != null) params.set('limit', String(filters.limit))
  }

  const query = params.toString()
  const path = query ? `/tasks?${query}` : '/tasks'

  const response = await apiFetch(path)
  return unwrapApiResponse<TasksPaginatedResponse>(response)
}

/**
 * Retrieve task statistics (total + counts by status and type).
 */
export async function getTaskStats(): Promise<TaskStatsResponse> {
  const response = await apiFetch('/tasks/stats')
  return unwrapApiResponse<TaskStatsResponse>(response)
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
 * Search tasks by query string. Returns paginated results.
 */
export async function searchTasks(q: string, opts?: { page?: number; limit?: number }): Promise<TasksPaginatedResponse> {
  const params = new URLSearchParams({ q })
  if (opts?.page  != null) params.set('page',  String(opts.page))
  if (opts?.limit != null) params.set('limit', String(opts.limit))
  const response = await apiFetch(`/tasks/search?${params.toString()}`)
  return unwrapApiResponse<TasksPaginatedResponse>(response)
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