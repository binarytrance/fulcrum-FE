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
  completionPercent: number;
  totalLoggedMinutes: number;
  estimatedMinutes: number;
  lastComputedAt: string;
};

export type GoalResponse = {
  id: string;
  userId: string;
  parentGoalId?: string | null;
  title: string;
  description?: string | null;
  category: GoalCategory;
  status: string;
  priority: GoalPriority;
  deadline?: string | null;
  estimatedHours?: number | null;
  level: number;
  progress: GoalProgress;
  createdAt: string;
  updatedAt: string;
};

export type GoalTreeNode = GoalResponse & {
  children: GoalTreeNode[];
};

export type CreateGoalInput = {
  title: string;
  description?: string;
  category: GoalCategory;
  priority?: GoalPriority;
  deadline?: string;
  estimatedHours?: number;
  parentGoalId?: string;
};

export type UpdateGoalInput = Partial<{
  title: string;
  description: string | null;
  category: GoalCategory;
  status: string;
  priority: GoalPriority;
  deadline: string | null;
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
  const { deadline, ...rest } = input;
  const body = {
    ...rest,
    ...(deadline ? { estimatedEndDate: new Date(deadline).toISOString() } : {}),
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
  const { deadline, ...rest } = input;
  const body: Record<string, unknown> = { ...rest };
  if (deadline === null) body.estimatedEndDate = null;
  else if (deadline) body.estimatedEndDate = new Date(deadline).toISOString();

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

export async function getGoals(): Promise<{
  response: Response;
  payload?: ApiSuccess<GoalTreeNode[]> | ApiFailure;
}> {
  const response = await apiFetch("/goals", { method: "GET" });
  let payload: ApiSuccess<GoalTreeNode[]> | ApiFailure | undefined;
  try {
    payload = (await response.json()) as ApiSuccess<GoalTreeNode[]> | ApiFailure;
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
