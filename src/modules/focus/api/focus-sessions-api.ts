import { apiFetch } from "@/lib/api";
import type { FocusSessionResponse, PaginatedFocusSessions, FocusSessionsQueryParams } from "../types";

type ApiSuccess<T> = { success: true; message: string; data: T };
type ApiFailure = { success: false; message: unknown };

export async function getFocusSessions(params: FocusSessionsQueryParams): Promise<{
  response: Response;
  payload?: ApiSuccess<PaginatedFocusSessions> | ApiFailure;
}> {
  const query = new URLSearchParams();
  query.set("startDate", params.startDate);
  if (params.endDate) query.set("endDate", params.endDate);
  if (params.status) query.set("status", params.status);
  if (params.source) query.set("source", params.source);
  if (params.taskId) query.set("taskId", params.taskId);
  if (params.page) query.set("page", String(params.page));
  if (params.limit) query.set("limit", String(params.limit));

  const response = await apiFetch(`/focus-sessions?${query.toString()}`, { method: "GET" });

  let payload: ApiSuccess<PaginatedFocusSessions> | ApiFailure | undefined;
  try {
    payload = (await response.json()) as ApiSuccess<PaginatedFocusSessions> | ApiFailure;
  } catch {
    payload = undefined;
  }

  return { response, payload };
}

export type { FocusSessionResponse, PaginatedFocusSessions, FocusSessionsQueryParams };
