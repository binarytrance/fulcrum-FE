"use client";

import { useCallback, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { CalendarDays } from "lucide-react";

import { getTasks, updateTask } from "@/modules/tasks/api/tasks-api";
import { toast } from "@/components/ui/toast";
import { TasksList } from "@/modules/tasks/components/TasksList";
import { CreateTaskModal } from "@/modules/tasks/components/CreateTaskModal";
import { CompleteTaskModal } from "@/modules/tasks/components/CompleteTaskModal";
import { TaskDetailModal } from "@/modules/tasks/components/TaskDetailModal";
import type { TaskUpdateInput } from "@/modules/tasks/components/TaskDetailModal";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { formatShortDate } from "@/lib/date";
import type { PaginatedTasks, TaskResponse, TaskStatus } from "@/modules/tasks/types";
import { cn } from "@/lib/utils";

const STATUS_FILTERS: { label: string; value: TaskStatus | undefined }[] = [
  { label: "All", value: undefined },
  { label: "Pending", value: "PENDING" },
  { label: "In progress", value: "IN_PROGRESS" },
  { label: "Completed", value: "COMPLETED" },
];

const PAGE_LIMIT = 20;

type DateRange = { start: string; end: string };

function getTodayDate() {
  return new Date().toISOString().split("T")[0];
}

function formatRangeLabel(range: DateRange): string {
  const today = getTodayDate();
  if (range.start === today && range.end === "Infinity") return "Today onwards";
  if (range.end === "Infinity") return `From ${formatShortDate(range.start)}`;
  if (range.start === range.end) return formatShortDate(range.start);
  return `${formatShortDate(range.start)} – ${formatShortDate(range.end)}`;
}

function DateRangePicker({ value, onChange }: { value: DateRange; onChange: (r: DateRange) => void }) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<DateRange>(value);

  function handleOpenChange(o: boolean) {
    if (o) setDraft(value);
    setOpen(o);
  }

  function apply() {
    onChange(draft);
    setOpen(false);
  }

  function reset() {
    const def: DateRange = { start: getTodayDate(), end: "Infinity" };
    setDraft(def);
    onChange(def);
    setOpen(false);
  }

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <button className="flex items-center gap-1.5 rounded-md border border-border/60 bg-background px-2.5 py-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground">
          <CalendarDays className="h-3 w-3 shrink-0" />
          {formatRangeLabel(value)}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-60 p-3" align="end">
        <div className="space-y-3">
          <div className="space-y-1">
            <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">From</p>
            <input
              type="date"
              value={draft.start}
              onChange={(e) => setDraft((d) => ({ ...d, start: e.target.value }))}
              className="w-full rounded-md border border-border bg-background px-2 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>
          <div className="space-y-1">
            <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
              To <span className="normal-case font-normal text-muted-foreground/60">(leave blank for open-ended)</span>
            </p>
            <input
              type="date"
              value={draft.end === "Infinity" ? "" : draft.end}
              min={draft.start}
              onChange={(e) => setDraft((d) => ({ ...d, end: e.target.value || "Infinity" }))}
              className="w-full rounded-md border border-border bg-background px-2 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>
          <div className="flex gap-2 pt-1">
            <button
              onClick={reset}
              className="flex-1 rounded-md border border-border px-2 py-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
            >
              Reset
            </button>
            <button
              onClick={apply}
              className="flex-1 rounded-md bg-primary px-2 py-1.5 text-xs font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              Apply
            </button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

export function TasksListView() {
  const tCommon = useTranslations("Common");

  const [data, setData] = useState<PaginatedTasks | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<TaskStatus | undefined>(undefined);
  const [page, setPage] = useState(1);
  const [dateRange, setDateRange] = useState<DateRange>({ start: getTodayDate(), end: "Infinity" });
  const [modalOpen, setModalOpen] = useState(false);
  const [startingIds, setStartingIds] = useState<Set<string>>(() => new Set());
  const [pausingIds, setPausingIds] = useState<Set<string>>(() => new Set());
  const [completingIds, setCompletingIds] = useState<Set<string>>(() => new Set());
  const [pendingCompleteTask, setPendingCompleteTask] = useState<TaskResponse | null>(null);
  const [selectedTask, setSelectedTask] = useState<TaskResponse | null>(null);
  const [savingIds, setSavingIds] = useState<Set<string>>(() => new Set());

  const fetchTasks = useCallback(async (
    status: TaskStatus | undefined,
    p: number,
    range: DateRange,
  ) => {
    setLoading(true);
    setError(null);

    try {
      const { response, payload } = await getTasks({
        status,
        page: p,
        limit: PAGE_LIMIT,
        startDate: range.start,
        endDate: range.end,
      });

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
    void fetchTasks(statusFilter, page, dateRange);
  }, [fetchTasks, statusFilter, page, dateRange]);

  function handleStatusFilter(status: TaskStatus | undefined) {
    setStatusFilter(status);
    setPage(1);
  }

  function handleDateRange(range: DateRange) {
    setDateRange(range);
    setPage(1);
  }

  function handleSelectTask(taskId: string) {
    const task = data?.items.find((t) => t.id === taskId) ?? null;
    setSelectedTask(task);
  }

  async function handleSaveTask(taskId: string, updates: TaskUpdateInput) {
    setSavingIds((prev) => new Set(prev).add(taskId));
    const prev = data?.items.find((t) => t.id === taskId);
    setData((d) => d ? { ...d, items: d.items.map((t) => t.id === taskId ? { ...t, ...updates, estimatedDuration: updates.estimatedDuration ?? t.estimatedDuration } : t) } : d);
    const { response } = await updateTask(taskId, updates);
    if (!response.ok) {
      if (prev) setData((d) => d ? { ...d, items: d.items.map((t) => t.id === taskId ? prev : t) } : d);
      toast.error(tCommon("genericError"));
    } else {
      setSelectedTask((t) => t ? { ...t, ...updates, estimatedDuration: updates.estimatedDuration ?? t.estimatedDuration } : t);
      setSelectedTask(null);
    }
    setSavingIds((prev) => { const n = new Set(prev); n.delete(taskId); return n; });
  }

  async function handlePause(taskId: string) {
    setPausingIds((prev) => new Set(prev).add(taskId));
    setData((prev) => prev ? { ...prev, items: prev.items.map((t) => t.id === taskId ? { ...t, status: "PAUSED" as const } : t) } : prev);
    const { response } = await updateTask(taskId, { status: "PAUSED" });
    if (!response.ok) {
      setData((prev) => prev ? { ...prev, items: prev.items.map((t) => t.id === taskId ? { ...t, status: "IN_PROGRESS" as const } : t) } : prev);
      toast.error(tCommon("genericError"));
    }
    setPausingIds((prev) => { const n = new Set(prev); n.delete(taskId); return n; });
  }

  async function handleStart(taskId: string) {
    setStartingIds((prev) => new Set(prev).add(taskId));
    setData((prev) => prev ? { ...prev, items: prev.items.map((t) => t.id === taskId ? { ...t, status: "IN_PROGRESS" as const } : t) } : prev);
    const { response } = await updateTask(taskId, { status: "IN_PROGRESS" });
    if (!response.ok) {
      setData((prev) => prev ? { ...prev, items: prev.items.map((t) => t.id === taskId ? { ...t, status: "PENDING" as const } : t) } : prev);
      toast.error(tCommon("genericError"));
    }
    setStartingIds((prev) => { const n = new Set(prev); n.delete(taskId); return n; });
  }

  function handleCompleteRequest(taskId: string) {
    const task = data?.items.find((t) => t.id === taskId) ?? null;
    setPendingCompleteTask(task);
  }

  async function handleConfirmComplete(taskId: string, actualDuration?: number) {
    const completedAt = new Date().toISOString();
    const prevStatus = data?.items.find((t) => t.id === taskId)?.status ?? "IN_PROGRESS";
    setCompletingIds((prev) => new Set(prev).add(taskId));
    setPendingCompleteTask(null);
    setData((prev) => prev ? { ...prev, items: prev.items.map((t) => t.id === taskId ? { ...t, status: "COMPLETED" as const, completedAt } : t) } : prev);
    const { response } = await updateTask(taskId, { status: "COMPLETED", completedAt, ...(actualDuration !== undefined && { actualDuration }) });
    if (!response.ok) {
      setData((prev) => prev ? { ...prev, items: prev.items.map((t) => t.id === taskId ? { ...t, status: prevStatus, completedAt: null } : t) } : prev);
      toast.error(tCommon("genericError"));
    }
    setCompletingIds((prev) => { const n = new Set(prev); n.delete(taskId); return n; });
  }

  return (
    <div className="flex h-full flex-col gap-4 p-6">
      <div className="flex shrink-0 items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Tasks</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {data ? `${data.total} task${data.total === 1 ? "" : "s"}` : ""}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <DateRangePicker value={dateRange} onChange={handleDateRange} />
          <Button size="sm" onClick={() => setModalOpen(true)}>+ Add task</Button>
        </div>
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
        <TasksList
          loading={loading}
          error={error}
          data={data}
          onPageChange={(p) => setPage(p)}
          onSelect={handleSelectTask}
          onStart={handleStart}
          onPause={handlePause}
          onComplete={handleCompleteRequest}
          startingIds={startingIds}
          pausingIds={pausingIds}
          completingIds={completingIds}
        />
      </div>

      <CreateTaskModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        onCreated={() => void fetchTasks(statusFilter, page, dateRange)}
      />

      <CompleteTaskModal
        task={pendingCompleteTask}
        open={pendingCompleteTask !== null}
        onOpenChange={(open) => { if (!open) setPendingCompleteTask(null); }}
        onComplete={handleConfirmComplete}
        isCompleting={completingIds.has(pendingCompleteTask?.id ?? "")}
      />

      <TaskDetailModal
        task={selectedTask}
        open={selectedTask !== null}
        onOpenChange={(open) => { if (!open) setSelectedTask(null); }}
        onSave={handleSaveTask}
        isSaving={savingIds.has(selectedTask?.id ?? "")}
      />
    </div>
  );
}
