"use client";

import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { Spinner } from "@/components/ui/spinner";
import type { GoalResponse } from "@/modules/goals/api/goals-api";

type Props = {
  goal: GoalResponse | null;
  loading: boolean;
};

export function ActiveGoalTodayCard({ goal, loading }: Props) {
  const completionPercent = goal?.progress.score ?? 0;

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-border/60 bg-card p-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground">Active goal</span>
        {goal && (
          <Link href="/goals" className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
            View all <ArrowRight className="h-3 w-3" />
          </Link>
        )}
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex flex-1 items-center justify-center">
          <Spinner />
        </div>
      )}

      {/* No active goal */}
      {!loading && !goal && (
        <div className="flex flex-1 flex-col gap-1">
          <p className="text-sm font-medium text-foreground">No active goals</p>
          <Link href="/goals" className="text-xs text-muted-foreground hover:text-foreground underline">
            Create a goal →
          </Link>
        </div>
      )}

      {/* Goal content */}
      {!loading && goal && (
        <>
          <p className="line-clamp-2 text-sm font-semibold text-foreground leading-snug">
            {goal.title}
          </p>

          {/* Progress bar */}
          <div className="flex flex-col gap-1">
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-primary transition-all duration-500"
                style={{ width: `${completionPercent}%` }}
              />
            </div>
            <div className="flex justify-between text-[10px] text-muted-foreground">
              <span>{goal.progress.completedTasks}/{goal.progress.totalTasks} tasks</span>
              <span>{Math.round(completionPercent)}%</span>
            </div>
          </div>


        </>
      )}
    </div>
  );
}
