export type TimeLeak = {
  startTime: string;
  endTime: string;
  gapMinutes: number;
};

export type DailyInsightsFocusSessions = {
  sessionCount: number;
  totalLoggedMinutes: number;
  netFocusMinutes: number;
  deepWorkMinutes: number;
  shallowWorkMinutes: number;
  totalDistractions: number;
  totalDistractionMinutes: number;
  avgDistractionPerSession: number;
  avgEfficiencyScore: number | null;
  timeLeaks: TimeLeak[];
};

export type DailyInsightsTasks = {
  totalTaskCount: number;
  plannedTaskCount: number;
  unplannedTaskCount: number;
  completedTaskCount: number;
  unplannedPercent: number;
  taskCompletionRate: number;
};

export type DailyInsightsHabits = {
  totalHabitCount: number;
  completedHabitCount: number;
  skippedHabitCount: number;
  missedHabitCount: number;
  habitCompletionRate: number;
};

export type AppStreak = {
  current: number;
  longest: number;
  lastActiveDate: string | null;
};

export type DailyInsightsResponse = {
  id: string;
  userId: string;
  date: string;
  computedAt: string;
  focusSessions: DailyInsightsFocusSessions;
  tasks: DailyInsightsTasks;
  habits: DailyInsightsHabits;
  appStreak: AppStreak;
};
