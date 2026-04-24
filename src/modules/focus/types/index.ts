export type FocusSessionStatus = "ACTIVE" | "COMPLETED" | "CANCELED";

export type FocusSessionSummary = {
  id: string;
  status: FocusSessionStatus;
  startedAt: string;
  completedAt?: string | null;
  durationMinutes?: number | null;
  taskId?: string | null;
};

