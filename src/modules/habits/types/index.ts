export const HABIT_STATUSES = ["ACTIVE", "PAUSED"] as const;
export type HabitStatus = (typeof HABIT_STATUSES)[number];

export const HABIT_FREQUENCIES = ["daily", "specific_days"] as const;
export type HabitFrequency = (typeof HABIT_FREQUENCIES)[number];

export const OCCURRENCE_STATUSES = ["pending", "completed", "missed", "skipped"] as const;
export type OccurrenceStatus = (typeof OCCURRENCE_STATUSES)[number];

export type HistoryEntry = {
  date: string;
  status: OccurrenceStatus | null;
};

export type HabitResponse = {
  id: string;
  userId: string;
  goalId: string | null;
  title: string;
  description: string | null;
  frequency: HabitFrequency;
  daysOfWeek: number[];
  targetDuration: number;
  status: HabitStatus;
  currentStreak: number;
  longestStreak: number;
  createdAt: string;
  updatedAt: string;
  /** Always 7 entries ordered oldest → today. null = not scheduled that day. */
  history: HistoryEntry[];
};

export type OccurrenceResponse = {
  id: string;
  habitId: string;
  userId: string;
  date: string;
  status: OccurrenceStatus;
  completedAt: string | null;
  sessionId: string | null;
  durationMinutes: number | null;
  note: string | null;
  createdAt: string;
};

export type HabitWithHistory = HabitResponse;

export type PaginatedHabits = {
  items: HabitResponse[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

export type HabitsQueryParams = {
  status?: HabitStatus;
  goalId?: string;
  page?: number;
  limit?: number;
};
