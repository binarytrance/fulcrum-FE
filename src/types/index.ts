// ─── Auth ────────────────────────────────────────────────────────────────────

export type AuthUser = {
  id: string;
  email: string;
  firstname: string;
  lastname: string;
  [key: string]: unknown;
};

export type AuthTokens = {
  accessToken: string;
  refreshToken: string;
};

export type AuthResponse = {
  user: AuthUser;
  accessToken: string;
  refreshToken: string;
};

export type AuthSession = {
  sessionId: string;
  current: boolean;
  userAgent: string | null;
  ipAddress: string | null;
  createdAt: string;
  lastRotatedAt: string;
  expiresAt: string;
};

// ─── Goals ───────────────────────────────────────────────────────────────────

export type GoalStatus = 'ACTIVE' | 'PAUSED' | 'COMPLETED' | 'ABANDONED' | 'MISSED';

export type GoalCategory =
  | 'CAREER'
  | 'LEARNING'
  | 'HEALTH'
  | 'PERSONAL'
  | 'FINANCIAL'
  | 'OTHER';

export type GoalPriority = 'HIGH' | 'MEDIUM' | 'LOW';

export interface Goal {
  id: string;
  title: string;
  description?: string;
  status: GoalStatus;
  isOverdue?: boolean;
  category: GoalCategory;
  priority: GoalPriority;
  deadline?: string;
  estimatedEndDate?: string;
  estimatedHours?: number;
  parentGoalId?: string | null;
  progress?: { score: number };
  isReadyToComplete?: boolean;
  createdAt: string;
  updatedAt: string;
}

export type CreateGoalDto = {
  title: string;
  description?: string;
  category: GoalCategory;
  priority: GoalPriority;
  deadline?: string;
  estimatedEndDate?: string;
  estimatedHours?: number;
  parentGoalId?: string;
};

export type UpdateGoalDto = Partial<Omit<CreateGoalDto, 'parentGoalId'>> & {
  status?: GoalStatus;
};

// ─── Tasks ───────────────────────────────────────────────────────────────────

export type TaskStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';

export type TaskType = 'PLANNED' | 'UNPLANNED';

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: GoalPriority;
  type: TaskType;
  scheduledFor?: string;
  estimatedDuration?: number;
  actualDuration?: number;
  efficiencyScore?: number;
  goalId?: string;
  goalTitle?: string;
  createdAt: string;
  updatedAt: string;
}

export type CreateTaskDto = {
  title: string;
  description?: string;
  priority: GoalPriority;
  type: TaskType;
  scheduledFor?: string;
  estimatedDuration?: number;
  goalId?: string;
};

export type UpdateTaskDto = Partial<
  Omit<CreateTaskDto, 'type' | 'goalId'>
> & {
  status?: 'PENDING' | 'IN_PROGRESS' | 'CANCELLED';
};

// ─── Habits ──────────────────────────────────────────────────────────────────

export type HabitFrequency = 'daily' | 'specific_days';

export type HabitStatus = 'active' | 'paused' | 'archived';

export type OccurrenceStatus = 'PENDING' | 'COMPLETED' | 'SKIPPED';

export interface Habit {
  id: string;
  goalId: string;
  title: string;
  description?: string;
  frequency: HabitFrequency;
  daysOfWeek?: number[];
  targetDuration: number;
  status: HabitStatus;
  createdAt: string;
  updatedAt: string;
}

export interface HabitOccurrence {
  id: string;
  habitId: string;
  scheduledDate: string;
  status: OccurrenceStatus;
  durationMinutes?: number;
  note?: string;
  sessionId?: string;
  completedAt?: string;
}

export interface HabitAnalytics {
  completionRatePct: number;
  currentStreak: number;
  longestStreak: number;
  avgDurationMinutes: number;
  mostMissedDayOfWeek?: number;
}

export type CreateHabitDto = {
  goalId: string;
  title: string;
  description?: string;
  frequency: HabitFrequency;
  daysOfWeek?: number[];
  targetDuration: number;
};

export type UpdateHabitDto = Partial<
  Omit<CreateHabitDto, 'goalId' | 'frequency'>
>;

// ─── Sessions ────────────────────────────────────────────────────────────────

export type SessionSource = 'AUTO' | 'MANUAL';

export interface Session {
  id: string;
  taskId: string;
  durationMinutes: number;
  netFocusMinutes?: number;
  distractionCount?: number;
  startedAt: string;
  completedAt?: string;
  note?: string;
  source: SessionSource;
  plantGrowthPercent?: number;
  plantStatus?: string;
}

export type CreateManualSessionDto = {
  taskId: string;
  durationMinutes: number;
  startedAt?: string;
  note?: string;
};

// ─── Analytics ───────────────────────────────────────────────────────────────

export interface DailyAnalytics {
  date: string;
  totalFocusMinutes: number;
  completedTasks: number;
  completedHabits: number;
  timeLeaks?: Array<{ gapMinutes: number }>;
}

export interface WeeklyAnalytics {
  weekStart: string;
  totalFocusMinutes: number;
  completedTasks: number;
  avgDailyFocus: number;
  bestDay?: string;
}

export interface GoalAnalytics {
  goalId: string;
  totalLoggedMinutes: number;
  completionPercent: number;
  consistencyScore: number;
  projectedCompletionDate?: string;
  isOnTrack: boolean;
}

export interface EstimationProfile {
  rollingAverage: number;
  trend: 'IMPROVING' | 'DECLINING' | 'STABLE';
  sampleCount: number;
}

export interface AnalyticsDashboard {
  daily?: DailyAnalytics;
  weekly?: WeeklyAnalytics;
  goals?: GoalAnalytics[];
  estimation?: EstimationProfile;
}