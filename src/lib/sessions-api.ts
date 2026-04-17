import { apiFetch, unwrapApiResponse } from './api'
import type { Session, CreateManualSessionDto } from '../types'

/**
 * Create a manual focus session (i.e. the user logs time retrospectively
 * rather than using the live timer).
 *
 * POST /sessions/manual
 */
export async function createManualSession(data: CreateManualSessionDto): Promise<Session> {
  const response = await apiFetch('/sessions/manual', {
    method: 'POST',
    body: JSON.stringify(data),
  })
  return unwrapApiResponse<Session>(response)
}

/**
 * Retrieve every session that was recorded against a particular task.
 *
 * GET /sessions/task/:taskId
 */
export async function getSessionsForTask(taskId: string): Promise<Session[]> {
  const response = await apiFetch(`/sessions/task/${taskId}`)
  return unwrapApiResponse<Session[]>(response)
}

/**
 * Retrieve a single session by its ID.
 *
 * GET /sessions/:id
 */
export async function getSession(id: string): Promise<Session> {
  const response = await apiFetch(`/sessions/${id}`)
  return unwrapApiResponse<Session>(response)
}