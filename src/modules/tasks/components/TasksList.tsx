import type { PaginatedTasks, TaskResponse } from "../types";
import { TaskRow } from "./TaskRow";
import { Button } from "@/components/ui/button";
import { formatDateHeader } from "@/lib/date";

type TasksListProps = {
  loading: boolean;
  error: string | null;
  data: PaginatedTasks | null;
  onPageChange: (page: number) => void;
  onSelect: (taskId: string) => void;
  onStart: (taskId: string) => void;
  onPause: (taskId: string) => void;
  onComplete: (taskId: string) => void;
  startingIds: Set<string>;
  pausingIds: Set<string>;
  completingIds: Set<string>;
};

const UNSCHEDULED = "__unscheduled__";

function groupByDate(items: TaskResponse[]): { date: string | null; tasks: TaskResponse[] }[] {
  const map = new Map<string, TaskResponse[]>();
  for (const task of items) {
    const key = task.scheduledFor ?? UNSCHEDULED;
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(task);
  }
  return [...map.entries()]
    .sort(([a], [b]) => {
      if (a === UNSCHEDULED) return 1;
      if (b === UNSCHEDULED) return -1;
      return a.localeCompare(b);
    })
    .map(([date, tasks]) => ({ date: date === UNSCHEDULED ? null : date, tasks }));
}

function SkeletonRow() {
  return (
    <div className="flex items-start gap-3 rounded-lg border border-border/50 px-4 py-3">
      <div className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-muted" />
      <div className="flex-1 space-y-2">
        <div className="h-3.5 w-2/3 rounded bg-muted" />
        <div className="h-2.5 w-1/3 rounded bg-muted" />
      </div>
    </div>
  );
}

export function TasksList({ loading, error, data, onPageChange, onSelect, onStart, onPause, onComplete, startingIds, pausingIds, completingIds }: TasksListProps) {
  if (loading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)}
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3">
        <p className="text-sm text-destructive">{error}</p>
      </div>
    );
  }

  if (!data || data.items.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 rounded-lg border border-border/50 bg-card px-4 py-12 text-center">
        <p className="text-sm font-medium text-foreground">No tasks yet</p>
        <p className="text-xs text-muted-foreground">Tasks you create will appear here</p>
      </div>
    );
  }

  const groups = groupByDate(data.items);

  return (
    <div className="space-y-6">
      {groups.map(({ date, tasks }) => (
        <div key={date ?? UNSCHEDULED}>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {date ? formatDateHeader(date) : "Unscheduled"}
          </p>
          <div className="space-y-2">
            {tasks.map((task) => (
              <TaskRow
                key={task.id}
                task={task}
                onSelect={onSelect}
                onStart={onStart}
                onPause={onPause}
                onComplete={onComplete}
                isStarting={startingIds.has(task.id)}
                isPausing={pausingIds.has(task.id)}
                isCompleting={completingIds.has(task.id)}
              />
            ))}
          </div>
        </div>
      ))}

      {data.totalPages > 1 && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">
            Page {data.page} of {data.totalPages} · {data.total} tasks
          </span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={data.page <= 1} onClick={() => onPageChange(data.page - 1)}>
              Previous
            </Button>
            <Button variant="outline" size="sm" disabled={data.page >= data.totalPages} onClick={() => onPageChange(data.page + 1)}>
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
