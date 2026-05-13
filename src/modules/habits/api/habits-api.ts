import { apiFetch } from "@/lib/api";
import type { HabitResponse, OccurrenceResponse, PaginatedHabits, HabitsQueryParams } from "../types";

type ApiSuccess<T> = { success: true; message: string; data: T };
type ApiFailure = { success: false; message: unknown };

export async function getHabits(params: HabitsQueryParams = {}): Promise<{
  response: Response;
  payload?: ApiSuccess<PaginatedHabits> | ApiFailure;
}> {
  const query = new URLSearchParams();
  if (params.status) query.set("status", params.status);
  if (params.goalId) query.set("goalId", params.goalId);
  if (params.page) query.set("page", String(params.page));
  if (params.limit) query.set("limit", String(params.limit));

  const qs = query.toString();
  const response = await apiFetch(`/habits${qs ? `?${qs}` : ""}`, { method: "GET" });

  let payload: ApiSuccess<PaginatedHabits> | ApiFailure | undefined;
  try {
    payload = (await response.json()) as ApiSuccess<PaginatedHabits> | ApiFailure;
  } catch {
    payload = undefined;
  }

  return { response, payload };
}

export async function getHabitOccurrences(id: string): Promise<{
  response: Response;
  payload?: ApiSuccess<OccurrenceResponse[]> | ApiFailure;
}> {
  const response = await apiFetch(`/habits/${id}/occurrences`, { method: "GET" });
  let payload: ApiSuccess<OccurrenceResponse[]> | ApiFailure | undefined;
  try {
    payload = (await response.json()) as ApiSuccess<OccurrenceResponse[]> | ApiFailure;
  } catch {
    payload = undefined;
  }
  return { response, payload };
}

export type { HabitResponse, OccurrenceResponse, PaginatedHabits, HabitsQueryParams };
