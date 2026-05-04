import type { TaskResponse, TaskPriority, TaskStatus } from "../types";
import { cn } from "@/lib/utils";
import { formatShortDate } from "@/lib/date";

const PRIORITY_STYLES: Record<TaskPriority, string> = {
  HIGH: "bg-rose-500/10 text-rose-500",
  MEDIUM: "bg-amber-500/10 text-amber-500",
  LOW: "bg-muted text-muted-foreground",
};

const STATUS_STYLES: Record<TaskStatus, string> = {
  PENDING: "bg-muted text-muted-foreground",
  IN_PROGRESS: "bg-blue-500/10 text-blue-500",
  COMPLETED: "bg-emerald-500/10 text-emerald-500",
  CANCELLED: "bg-muted text-muted-foreground line-through",
};

const STATUS_LABELS: Record<TaskStatus, string> = {
  PENDING: "Pending",
  IN_PROGRESS: "In progress",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
};

type TaskRowProps = {
  task: TaskResponse;
};

export function TaskRow({ task }: TaskRowProps) {
  const isCompleted = task.status === "COMPLETED";
  const isCancelled = task.status === "CANCELLED";

  return (
    <div className="flex items-start gap-3 rounded-lg border border-border/50 bg-card px-4 py-3 transition-colors hover:bg-accent/40">
      {/* Priority indicator */}
      <div
        className={cn(
          "mt-0.5 h-2 w-2 shrink-0 rounded-full",
          task.priority === "HIGH" ? "bg-rose-500" :
          task.priority === "MEDIUM" ? "bg-amber-500" : "bg-muted-foreground/40"
        )}
      />

      {/* Main content */}
      <div className="min-w-0 flex-1">
        <p
          className={cn(
            "text-sm font-medium text-foreground",
            (isCompleted || isCancelled) && "text-muted-foreground line-through"
          )}
        >
          {task.title}
        </p>

        <div className="mt-1 flex flex-wrap items-center gap-2">
          {/* Status badge */}
          <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-medium", STATUS_STYLES[task.status])}>
            {STATUS_LABELS[task.status]}
          </span>

          {/* Priority badge */}
          <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-medium", PRIORITY_STYLES[task.priority])}>
            {task.priority}
          </span>

          {/* Goal link */}
          {task.goalTitle && (
            <span className="text-[10px] text-muted-foreground">
              ↳ {task.goalTitle}
            </span>
          )}

          {/* Scheduled date */}
          {task.scheduledFor && (
            <span className="text-[10px] text-muted-foreground">
              {formatShortDate(task.scheduledFor)}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
