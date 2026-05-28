export const TASK_STATUSES = ["PENDING", "IN_PROGRESS", "PAUSED", "COMPLETED", "CANCELLED"] as const;
export type TaskStatus = (typeof TASK_STATUSES)[number];

export const TASK_PRIORITIES = ["HIGH", "MEDIUM", "LOW"] as const;
export type TaskPriority = (typeof TASK_PRIORITIES)[number];

export const TASK_TYPES = ["PLANNED", "UNPLANNED"] as const;
export type TaskType = (typeof TASK_TYPES)[number];

export type TaskResponse = {
  id: string;
  userId: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  type: TaskType;
  scheduledFor: string | null;
  estimatedEndDate: string | null;
  startDate: string | null;
  estimatedDuration: number;
  actualDuration: number | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
  goal: { id: string | null; title: string | null };
  analytics: { efficiencyScore: number | null };
};

export type PaginatedTasks = {
  items: TaskResponse[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

export type TasksQueryParams = {
  status?: TaskStatus;
  type?: TaskType;
  goalId?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
};
