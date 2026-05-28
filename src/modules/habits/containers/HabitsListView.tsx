"use client";

import { useCallback, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { getHabits } from "@/modules/habits/api/habits-api";
import { CreateHabitModal } from "@/modules/habits/components/CreateHabitModal";
import { formatDateHeader } from "@/lib/date";
import type { HabitResponse, PaginatedHabits, HabitStatus, OccurrenceStatus } from "@/modules/habits/types";

const STATUS_FILTERS: { label: string; value: HabitStatus | undefined }[] = [
  { label: "All", value: undefined },
  { label: "Active", value: "ACTIVE" },
  { label: "Paused", value: "PAUSED" },
];

const PAGE_LIMIT = 20;

type DateEntry = { habit: HabitResponse; status: OccurrenceStatus | null };
type DateGroup = { date: string; entries: DateEntry[] };

function pivotByDate(habits: HabitResponse[]): DateGroup[] {
  const map = new Map<string, DateEntry[]>();
  for (const habit of habits) {
    for (const entry of habit.history) {
      if (!map.has(entry.date)) map.set(entry.date, []);
      map.get(entry.date)!.push({ habit, status: entry.status });
    }
  }
  return [...map.entries()]
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([date, entries]) => ({ date, entries }));
}

const STATUS_DOT: Record<string, string> = {
  completed: "bg-green-500",
  missed: "bg-red-500",
  skipped: "bg-muted-foreground/40",
  pending: "border border-border bg-transparent",
};

const STATUS_LABEL: Record<string, string> = {
  completed: "Done",
  missed: "Missed",
  skipped: "Skipped",
  pending: "Pending",
};

function HabitEntryRow({ entry }: { entry: DateEntry }) {
  const dotClass = entry.status ? STATUS_DOT[entry.status] : "bg-muted/30";
  const label = entry.status ? STATUS_LABEL[entry.status] : "—";

  return (
    <div className="flex items-center gap-3 rounded-lg border border-border/50 bg-card px-4 py-3 transition-colors hover:bg-accent/40">
      <span className={cn("h-2 w-2 shrink-0 rounded-full", dotClass)} />
      <span className={cn(
        "flex-1 text-sm font-medium text-foreground",
        entry.habit.status === "PAUSED" && "text-muted-foreground",
      )}>
        {entry.habit.title}
      </span>
      {entry.habit.currentStreak > 0 && (
        <span className="text-[10px] text-muted-foreground">
          🔥 {entry.habit.currentStreak}
        </span>
      )}
      <span className={cn(
        "rounded-full px-2 py-0.5 text-[10px] font-medium",
        entry.status === "completed" && "bg-green-500/10 text-green-600 dark:text-green-400",
        entry.status === "missed" && "bg-red-500/10 text-red-500",
        entry.status === "skipped" && "bg-muted text-muted-foreground",
        entry.status === "pending" && "bg-muted text-muted-foreground",
        !entry.status && "bg-muted text-muted-foreground",
      )}>
        {label}
      </span>
    </div>
  );
}

function SkeletonRow() {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-border/50 px-4 py-3">
      <div className="h-2 w-2 rounded-full bg-muted" />
      <div className="flex-1 space-y-2">
        <div className="h-3.5 w-1/2 rounded bg-muted" />
      </div>
      <div className="h-4 w-12 rounded bg-muted" />
    </div>
  );
}

export function HabitsListView() {
  const tCommon = useTranslations("Common");

  const [data, setData] = useState<PaginatedHabits | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<HabitStatus | undefined>(undefined);
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);

  const fetchHabits = useCallback(async (status: HabitStatus | undefined, p: number) => {
    setLoading(true);
    setError(null);
    try {
      const { response, payload } = await getHabits({ status, page: p, limit: PAGE_LIMIT });
      if (!response.ok || !payload || !payload.success) {
        setError(tCommon("genericError"));
        return;
      }
      setData(payload.data);
    } catch {
      setError(tCommon("genericError"));
    } finally {
      setLoading(false);
    }
  }, [tCommon]);

  useEffect(() => {
    void fetchHabits(statusFilter, page);
  }, [fetchHabits, statusFilter, page]);

  function handleStatusFilter(status: HabitStatus | undefined) {
    setStatusFilter(status);
    setPage(1);
  }

  function handleCreated() {
    setPage(1);
    void fetchHabits(statusFilter, 1);
  }

  const groups = data ? pivotByDate(data.items) : [];

  return (
    <div className="flex h-full flex-col gap-4 p-6">
      <div className="flex shrink-0 items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Habits</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {data ? `${data.total} habit${data.total === 1 ? "" : "s"}` : ""}
          </p>
        </div>
        <Button size="sm" onClick={() => setModalOpen(true)}>+ Add habit</Button>
      </div>

      <div className="shrink-0 flex gap-1 rounded-lg border border-border/60 bg-muted/40 p-1">
        {STATUS_FILTERS.map((f) => (
          <button
            key={f.label}
            onClick={() => handleStatusFilter(f.value)}
            className={cn(
              "flex-1 rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
              statusFilter === f.value
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto">
        {loading ? (
          <div className="space-y-6">
            {Array.from({ length: 3 }).map((_, gi) => (
              <div key={gi}>
                <div className="mb-2 h-3 w-24 rounded bg-muted" />
                <div className="space-y-2">
                  {Array.from({ length: 3 }).map((_, i) => <SkeletonRow key={i} />)}
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3">
            <p className="text-sm text-destructive">{error}</p>
          </div>
        ) : !data || data.items.length === 0 ? (
          <div className="flex flex-col items-center gap-2 rounded-lg border border-border/50 bg-card px-4 py-12 text-center">
            <p className="text-sm font-medium text-foreground">No habits yet</p>
            <p className="text-xs text-muted-foreground">Track daily habits to build consistency</p>
            <button
              onClick={() => setModalOpen(true)}
              className="mt-1 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90"
            >
              Add a habit
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {groups.map(({ date, entries }) => (
              <div key={date}>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {formatDateHeader(date)}
                </p>
                <div className="space-y-2">
                  {entries.map(({ habit, status }) => (
                    <HabitEntryRow key={habit.id} entry={{ habit, status }} />
                  ))}
                </div>
              </div>
            ))}

            {data.totalPages > 1 && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">
                  Page {data.page} of {data.totalPages} · {data.total} habits
                </span>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" disabled={data.page <= 1} onClick={() => setPage(data.page - 1)}>
                    Previous
                  </Button>
                  <Button variant="outline" size="sm" disabled={data.page >= data.totalPages} onClick={() => setPage(data.page + 1)}>
                    Next
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <CreateHabitModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        onCreated={handleCreated}
      />
    </div>
  );
}
