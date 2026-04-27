export type StreakStatus = "active" | "at-risk" | "broken";

export type Streak = {
  current: number;
  longest: number;
  status: StreakStatus;
  /** ISO date string of the last logged session */
  lastLoggedAt: string | null;
};
