import { apiFetch } from "@/lib/api";
import type { TaskResponse, PaginatedTasks, TasksQueryParams } from "../types";

type ApiSuccess<T> = { success: true; message: string; data: T };
type ApiFailure = { success: false; message: unknown };

export async function getTasks(params: TasksQueryParams = {}): Promise<{
  response: Response;
  payload?: ApiSuccess<PaginatedTasks> | ApiFailure;
}> {
  const query = new URLSearchParams();
  if (params.status) query.set("status", params.status);
  if (params.type) query.set("type", params.type);
  if (params.goalId) query.set("goalId", params.goalId);
  if (params.date) query.set("date", params.date);
  if (params.page) query.set("page", String(params.page));
  if (params.limit) query.set("limit", String(params.limit));

  const qs = query.toString();
  const response = await apiFetch(`/tasks${qs ? `?${qs}` : ""}`, { method: "GET" });

  let payload: ApiSuccess<PaginatedTasks> | ApiFailure | undefined;
  try {
    payload = (await response.json()) as ApiSuccess<PaginatedTasks> | ApiFailure;
  } catch {
    payload = undefined;
  }

  return { response, payload };
}

export type { TaskResponse, PaginatedTasks, TasksQueryParams };
