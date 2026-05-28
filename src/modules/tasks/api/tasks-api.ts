import { apiFetch } from "@/lib/api";
import type { TaskResponse, PaginatedTasks, TasksQueryParams, TaskStatus, TaskPriority, TaskType } from "../types";

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
  if (params.startDate) query.set("startDate", params.startDate);
  if (params.endDate) query.set("endDate", params.endDate);
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

type CreateTaskInput = {
  title: string;
  scheduledFor?: string;
  goalId?: string;
  priority?: TaskPriority;
  estimatedDuration?: number;
  type?: TaskType;
};

type UpdateTaskInput = Partial<{
  title: string;
  status: TaskStatus;
  priority: TaskPriority;
  scheduledFor: string | null;
  estimatedDuration: number;
  completedAt: string;
  actualDuration: number;
}>;

export async function createTask(input: CreateTaskInput): Promise<{
  response: Response;
  payload?: ApiSuccess<TaskResponse> | ApiFailure;
}> {
  const response = await apiFetch("/tasks", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });

  let payload: ApiSuccess<TaskResponse> | ApiFailure | undefined;
  try {
    payload = (await response.json()) as ApiSuccess<TaskResponse> | ApiFailure;
  } catch {
    payload = undefined;
  }

  return { response, payload };
}

export async function updateTask(
  id: string,
  input: UpdateTaskInput,
): Promise<{ response: Response; payload?: ApiSuccess<TaskResponse> | ApiFailure }> {
  const response = await apiFetch(`/tasks/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });

  let payload: ApiSuccess<TaskResponse> | ApiFailure | undefined;
  try {
    payload = (await response.json()) as ApiSuccess<TaskResponse> | ApiFailure;
  } catch {
    payload = undefined;
  }

  return { response, payload };
}

export type { TaskResponse, PaginatedTasks, TasksQueryParams };
