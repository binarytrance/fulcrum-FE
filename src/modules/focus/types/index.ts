export const FOCUS_SESSION_STATUSES = ["ACTIVE", "COMPLETED", "ABANDONED"] as const;
export type FocusSessionStatus = (typeof FOCUS_SESSION_STATUSES)[number];

export const FOCUS_SESSION_SOURCES = ["AUTO", "MANUAL"] as const;
export type FocusSessionSource = (typeof FOCUS_SESSION_SOURCES)[number];

export const PLANT_STATUSES = ["HEALTHY", "WILTING", "WILTED"] as const;
export type PlantStatus = (typeof PLANT_STATUSES)[number];

export type FocusSessionResponse = {
  id: string;
  userId: string;
  taskId: string;
  status: FocusSessionStatus;
  source: FocusSessionSource;
  startedAt: string;
  endedAt: string | null;
  durationMs: number | null;
  netFocusMs: number | null;
  plantStatus: PlantStatus;
  plantGrowthPercent: number;
  elapsedMs: number | null;
  createdAt: string;
};

export type PaginatedFocusSessions = {
  items: FocusSessionResponse[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

export type FocusSessionsQueryParams = {
  startDate: string;
  endDate?: string;
  status?: FocusSessionStatus;
  source?: FocusSessionSource;
  taskId?: string;
  page?: number;
  limit?: number;
};
