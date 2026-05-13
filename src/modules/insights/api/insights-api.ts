import { apiFetch } from "@/lib/api";
import type { DailyInsightsResponse } from "../types";

type ApiSuccess<T> = { success: true; message: string; data: T };
type ApiFailure = { success: false; message: unknown };

export async function getDailyInsights(date: string): Promise<{
  response: Response;
  payload?: ApiSuccess<DailyInsightsResponse> | ApiFailure;
}> {
  const response = await apiFetch(`/analytics/daily?date=${date}`, { method: "GET" });
  let payload: ApiSuccess<DailyInsightsResponse> | ApiFailure | undefined;
  try {
    payload = (await response.json()) as ApiSuccess<DailyInsightsResponse> | ApiFailure;
  } catch {
    payload = undefined;
  }
  return { response, payload };
}
