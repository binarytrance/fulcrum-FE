export const TASK_STATUSES = ["PENDING", "IN_PROGRESS", "COMPLETED", "CANCELLED"] as const;
export type TaskStatus = (typeof TASK_STATUSES)[number];

export const TASK_PRIORITIES = ["HIGH", "MEDIUM", "LOW"] as const;
export type TaskPriority = (typeof TASK_PRIORITIES)[number];

export const TASK_TYPES = ["PLANNED", "UNPLANNED"] as const;
export type TaskType = (typeof TASK_TYPES)[number];

export type TaskResponse = {
  id: string;
  userId: string;
  goalId: string | null;
  goalTitle: string | null;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  type: TaskType;
  scheduledFor: string | null;
  estimatedEndDate: string | null;
  startDate: string | null;
  actualEndDate: string | null;
  estimatedDuration: number;
  actualDuration: number | null;
  efficiencyScore: number | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
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
  date?: string;
  page?: number;
  limit?: number;
};
