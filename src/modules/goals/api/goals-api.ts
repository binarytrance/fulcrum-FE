import { apiFetch } from "@/lib/api";

export const GOAL_CATEGORIES = [
  "HEALTH_FITNESS",
  "LEARNING",
  "CAREER",
  "FINANCE",
  "RELATIONSHIPS",
  "PERSONAL_GROWTH",
  "CREATIVITY",
  "TRAVEL",
  "OTHER",
] as const;

export type GoalCategory = (typeof GOAL_CATEGORIES)[number];

export const GOAL_PRIORITIES = ["HIGH", "MEDIUM", "LOW"] as const;
export type GoalPriority = (typeof GOAL_PRIORITIES)[number];

export type GoalProgress = {
  totalTasks: number;
  completedTasks: number;
  totalLoggedMs: number;
  /** 0–100 */
  score: number;
  lastComputedAt: string;
};

export type GoalResponse = {
  id: string;
  userId: string;
  parentGoalId: string | null;
  title: string;
  description: string | null;
  category: GoalCategory;
  status: string;
  priority: GoalPriority;
  estimatedEndDate: string | null;
  /** milliseconds */
  estimatedDuration: number | null;
  estimatedStartDate: string | null;
  actualStartDate: string | null;
  actualEndDate: string | null;
  isReadyToComplete: boolean;
  isOverdue: boolean;
  level: number;
  progress: GoalProgress;
  createdAt: string;
  updatedAt: string;
};

export type CreateGoalInput = {
  title: string;
  description?: string;
  category: GoalCategory;
  priority?: GoalPriority;
  /** ISO date string — converted to estimatedEndDate on the way out */
  deadline?: string;
  /** hours — converted to ms on the way out */
  estimatedHours?: number;
  parentGoalId?: string;
};

export type UpdateGoalInput = Partial<{
  title: string;
  description: string | null;
  category: GoalCategory;
  status: string;
  priority: GoalPriority;
  /** ISO date string — converted to estimatedEndDate on the way out */
  deadline: string | null;
  /** hours — converted to ms on the way out */
  estimatedHours: number | null;
}>;

type ApiSuccess<T> = {
  success: true;
  message: string;
  data: T;
};

type ApiFailure = {
  success: false;
  message: unknown;
};

export async function createGoal(
  input: CreateGoalInput
): Promise<{ response: Response; payload?: ApiSuccess<GoalResponse> | ApiFailure }> {
  const { deadline, estimatedHours, ...rest } = input;
  const body = {
    ...rest,
    ...(deadline ? { estimatedEndDate: new Date(deadline).toISOString() } : {}),
    ...(estimatedHours != null ? { estimatedDuration: estimatedHours * 3_600_000 } : {}),
  };

  const response = await apiFetch("/goals", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  let payload: ApiSuccess<GoalResponse> | ApiFailure | undefined;
  try {
    payload = (await response.json()) as ApiSuccess<GoalResponse> | ApiFailure;
  } catch {
    payload = undefined;
  }

  return { response, payload };
}

export async function updateGoal(
  id: string,
  input: UpdateGoalInput
): Promise<{ response: Response; payload?: ApiSuccess<GoalResponse> | ApiFailure }> {
  const { deadline, estimatedHours, ...rest } = input;
  const body: Record<string, unknown> = { ...rest };
  if (deadline === null) body.estimatedEndDate = null;
  else if (deadline) body.estimatedEndDate = new Date(deadline).toISOString();
  if (estimatedHours === null) body.estimatedDuration = null;
  else if (estimatedHours != null) body.estimatedDuration = estimatedHours * 3_600_000;

  const response = await apiFetch(`/goals/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  let payload: ApiSuccess<GoalResponse> | ApiFailure | undefined;
  try {
    payload = (await response.json()) as ApiSuccess<GoalResponse> | ApiFailure;
  } catch {
    payload = undefined;
  }

  return { response, payload };
}

export type PaginatedGoals = {
  items: GoalResponse[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

export type GoalsQueryParams = {
  status?: string;
  limit?: number;
  page?: number;
};

export async function getGoals(params: GoalsQueryParams = {}): Promise<{
  response: Response;
  payload?: ApiSuccess<PaginatedGoals> | ApiFailure;
}> {
  const query = new URLSearchParams();
  if (params.status) query.set("status", params.status);
  if (params.limit) query.set("limit", String(params.limit));
  if (params.page) query.set("page", String(params.page));
  const qs = query.toString();
  const response = await apiFetch(`/goals${qs ? `?${qs}` : ""}`, { method: "GET" });
  let payload: ApiSuccess<PaginatedGoals> | ApiFailure | undefined;
  try {
    payload = (await response.json()) as ApiSuccess<PaginatedGoals> | ApiFailure;
  } catch {
    payload = undefined;
  }
  return { response, payload };
}

export function getValidationFieldErrors(message: unknown): Record<string, string[]> {
  if (!message || typeof message !== "object") return {};

  const maybe = message as {
    errors?: { fieldErrors?: Record<string, string[]> };
  };

  if (!maybe.errors?.fieldErrors || typeof maybe.errors.fieldErrors !== "object") {
    return {};
  }

  return maybe.errors.fieldErrors;
}
