"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { GoalResponse, GoalPriority } from "@/modules/goals/api/goals-api";

const PRIORITY_DOT: Record<GoalPriority, string> = {
  HIGH: "bg-rose-500",
  MEDIUM: "bg-amber-500",
  LOW: "bg-muted-foreground/40",
};

const PRIORITY_BADGE: Record<GoalPriority, string> = {
  HIGH: "bg-rose-500/10 text-rose-500",
  MEDIUM: "bg-amber-500/10 text-amber-500",
  LOW: "bg-muted text-muted-foreground",
};

function formatCategory(cat: string): string {
  return cat.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
}

function GoalRow({
  goal,
  completing,
  onEdit,
  onComplete,
}: {
  goal: GoalResponse;
  completing: boolean;
  onEdit?: (goal: GoalResponse) => void;
  onComplete?: (id: string) => void;
}) {
  const pct = Math.round(goal.progress.score);
  const isCompleted = goal.status === "COMPLETED";

  return (
    <div className="flex items-start gap-3 rounded-lg border border-border/50 bg-card px-4 py-3 transition-colors hover:bg-accent/40">
      <div className={cn("mt-1 h-2 w-2 shrink-0 rounded-full", goal.priority ? PRIORITY_DOT[goal.priority] : "bg-muted-foreground/40")} />

      <div className="min-w-0 flex-1">
        <p className={cn("text-sm font-medium text-foreground", isCompleted && "line-through text-muted-foreground")}>
          {goal.title}
        </p>

        <div className="mt-1.5 flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
            {formatCategory(goal.category)}
          </span>

          {goal.priority && (
            <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-medium", PRIORITY_BADGE[goal.priority])}>
              {goal.priority}
            </span>
          )}

          {goal.isOverdue && !isCompleted && (
            <span className="rounded-full bg-destructive/10 px-2 py-0.5 text-[10px] font-medium text-destructive">
              Overdue
            </span>
          )}

          <span className="text-[10px] tabular-nums text-muted-foreground">
            {goal.progress.completedTasks}/{goal.progress.totalTasks} tasks · {pct}%
          </span>
        </div>

        <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-muted">
          <div className="h-full rounded-full bg-primary transition-all duration-500" style={{ width: `${pct}%` }} />
        </div>
      </div>

      {!isCompleted && (onEdit || onComplete) && (
        <div className="flex shrink-0 items-center gap-1.5">
          {onEdit && (
            <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={() => onEdit(goal)}>
              Edit
            </Button>
          )}
          {onComplete && goal.isReadyToComplete && (
            <Button
              variant="outline"
              size="sm"
              className="h-7 px-2 text-xs"
              disabled={completing}
              onClick={() => onComplete(goal.id)}
            >
              Complete
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

function SkeletonRow() {
  return (
    <div className="flex items-start gap-3 rounded-lg border border-border/50 px-4 py-3">
      <div className="mt-1 h-2 w-2 shrink-0 rounded-full bg-muted" />
      <div className="flex-1 space-y-2">
        <div className="h-3.5 w-2/3 rounded bg-muted" />
        <div className="h-2.5 w-1/3 rounded bg-muted" />
        <div className="h-1 w-full rounded-full bg-muted" />
      </div>
    </div>
  );
}

export type GoalsListVariant = "default" | "pinned";

export type GoalsListProps = {
  loading: boolean;
  error: string | null;
  goals: GoalResponse[] | null;
  completingIds?: Set<string>;
  onComplete?: (goalId: string) => void;
  onEdit?: (goal: GoalResponse) => void;
  variant?: GoalsListVariant;
  page?: number;
  totalPages?: number;
  total?: number;
  onPageChange?: (page: number) => void;
};

export function GoalsList({
  loading,
  error,
  goals,
  completingIds = new Set(),
  onComplete,
  onEdit,
  variant = "default",
  page = 1,
  totalPages = 1,
  total,
  onPageChange,
}: GoalsListProps) {
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

  if (!goals || goals.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 rounded-lg border border-border/50 bg-card px-4 py-12 text-center">
        <p className="text-sm font-medium text-foreground">No goals yet</p>
        <p className="text-xs text-muted-foreground">Create a goal to start tracking progress</p>
      </div>
    );
  }

  const list = variant === "pinned" ? goals.slice(0, 3) : goals;

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        {list.map((goal) => (
          <GoalRow
            key={goal.id}
            goal={goal}
            completing={completingIds.has(goal.id)}
            onEdit={onEdit}
            onComplete={onComplete}
          />
        ))}
      </div>

      {variant === "default" && totalPages > 1 && onPageChange && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">
            Page {page} of {totalPages}{total !== undefined ? ` · ${total} goals` : ""}
          </span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => onPageChange(page - 1)}>
              Previous
            </Button>
            <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => onPageChange(page + 1)}>
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
