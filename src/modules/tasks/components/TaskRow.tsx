import { Play, Pause, Check, Target } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDuration } from "@/lib/duration";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import type { TaskResponse, TaskPriority, TaskStatus } from "../types";

const PRIORITY_STRIPE: Record<TaskPriority, string> = {
  HIGH: "bg-rose-500",
  MEDIUM: "bg-amber-400",
  LOW: "bg-muted-foreground/20",
};

const STATUS_STYLES: Record<TaskStatus, string> = {
  PENDING: "bg-muted text-muted-foreground",
  IN_PROGRESS: "bg-blue-500/10 text-blue-500",
  PAUSED: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  COMPLETED: "bg-emerald-500/10 text-emerald-500",
  CANCELLED: "bg-muted text-muted-foreground line-through",
};

const STATUS_LABELS: Record<TaskStatus, string> = {
  PENDING: "Pending",
  IN_PROGRESS: "In progress",
  PAUSED: "Paused",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
};


type TaskRowProps = {
  task: TaskResponse;
  onSelect: (taskId: string) => void;
  onStart: (taskId: string) => void;
  onPause: (taskId: string) => void;
  onComplete: (taskId: string) => void;
  isStarting: boolean;
  isPausing: boolean;
  isCompleting: boolean;
};

export function TaskRow({ task, onSelect, onStart, onPause, onComplete, isStarting, isPausing, isCompleting }: TaskRowProps) {
  const isCompleted = task.status === "COMPLETED";
  const isCancelled = task.status === "CANCELLED";
  const canStart = task.status === "PENDING" || task.status === "PAUSED";
  const canPause = task.status === "IN_PROGRESS";
  const canComplete = task.status === "PENDING" || task.status === "IN_PROGRESS" || task.status === "PAUSED";

  return (
    <div
      onClick={() => onSelect(task.id)}
      className={cn(
        "relative overflow-hidden flex items-center gap-3 rounded-lg border border-border/50 bg-card px-4 py-3 transition-colors hover:bg-accent/40 cursor-pointer",
        isCompleted && "opacity-50"
      )}
    >
      {/* Priority stripe */}
      {!isCompleted && (
        <span className={cn(
          "pointer-events-none absolute -left-4 -top-2 h-[14px] w-14 -rotate-45",
          PRIORITY_STRIPE[task.priority]
        )} />
      )}

      {/* Content */}
      <div className="min-w-0 flex-1">
        {task.goal.title && (
          <div className="mb-1">
            <span className="inline-flex items-center gap-1 rounded-full bg-primary/15 px-1.5 py-0.5 text-[10px] font-medium text-primary">
              <Target className="h-2.5 w-2.5 shrink-0" />
              {task.goal.title}
            </span>
          </div>
        )}

        <p className={cn(
          "text-sm font-medium text-foreground",
          (isCompleted || isCancelled) && "text-muted-foreground line-through"
        )}>
          {task.title}
        </p>

        <div className="mt-1 flex flex-wrap items-center gap-2">
          <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-medium", STATUS_STYLES[task.status])}>
            {STATUS_LABELS[task.status]}
          </span>
          {task.estimatedDuration > 0 && (
            <span className="text-[10px] text-muted-foreground">
              {formatDuration(task.estimatedDuration)}
            </span>
          )}
        </div>
      </div>

      {/* DONE stamp */}
      {isCompleted && (
        <span
          className="shrink-0 rotate-[-13deg] select-none rounded-[3px] border-[2.5px] border-green-600 px-2 py-0.5 text-[10px] font-black tracking-[0.2em] text-green-600 [filter:contrast(0.9)_blur(0.35px)]"
          style={{
            opacity: 0.68,
            WebkitMaskImage: "radial-gradient(ellipse at 68% 22%, rgba(0,0,0,0.35) 0%, rgba(0,0,0,1) 55%)",
            maskImage: "radial-gradient(ellipse at 68% 22%, rgba(0,0,0,0.35) 0%, rgba(0,0,0,1) 55%)",
          }}
        >
          DONE
        </span>
      )}

      {/* Actions */}
      {(canStart || canPause || canComplete) && (
        <div className="flex shrink-0 items-center gap-3">
          {canStart && (
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={(e) => { e.stopPropagation(); onStart(task.id); }}
                  disabled={isStarting}
                  className="flex h-7 w-7 items-center justify-center rounded-md border border-blue-500/50 text-blue-500 transition-colors hover:bg-blue-500/10 disabled:opacity-40"
                >
                  <Play className="h-3.5 w-3.5" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="top">Start</TooltipContent>
            </Tooltip>
          )}
          {canPause && (
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={(e) => { e.stopPropagation(); onPause(task.id); }}
                  disabled={isPausing}
                  className="flex h-7 w-7 items-center justify-center rounded-md border border-blue-500/50 text-blue-500 transition-colors hover:bg-blue-500/10 disabled:opacity-40"
                >
                  <Pause className="h-3.5 w-3.5" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="top">Pause</TooltipContent>
            </Tooltip>
          )}
          {canComplete && (
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={(e) => { e.stopPropagation(); onComplete(task.id); }}
                  disabled={isCompleting}
                  className="flex h-7 w-7 items-center justify-center rounded-md bg-emerald-500 text-white transition-colors hover:bg-emerald-600 disabled:opacity-40"
                >
                  <Check className="h-3.5 w-3.5" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="top">Complete</TooltipContent>
            </Tooltip>
          )}
        </div>
      )}
    </div>
  );
}
