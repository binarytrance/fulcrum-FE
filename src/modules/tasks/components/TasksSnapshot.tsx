"use client";

import { ArcRing } from "@/components/ui/arc-ring";
import { Spinner } from "@/components/ui/spinner";
import type { DailyInsightsTasks } from "@/modules/insights/types";

type Props = {
  data: DailyInsightsTasks | null;
  loading: boolean;
};

export function TasksSnapshot({ data, loading }: Props) {
  const completed = data?.completedTaskCount ?? 0;
  const total = data?.totalTaskCount ?? 0;
  const ratio = total === 0 ? 0 : completed / total;
  const remaining = total - completed;

  return (
    <div className="relative flex flex-col gap-3 rounded-2xl border border-border/60 bg-card p-4">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground">Tasks</span>
      </div>

      {loading ? (
        <div className="flex flex-1 items-center justify-center">
          <Spinner />
        </div>
      ) : total === 0 ? (
        <div>
          <p className="text-2xl font-bold tracking-tight text-foreground">—</p>
          <p className="mt-0.5 text-xs text-muted-foreground">no tasks today</p>
        </div>
      ) : (
        <div className="flex flex-col gap-1">
          <div className="relative flex h-14 w-14 items-center justify-center">
            <ArcRing ratio={ratio} size={56} strokeWidth={5} className="absolute inset-0" />
            <span className="text-xs font-semibold tabular-nums text-foreground">
              {completed}/{total}
            </span>
          </div>
          <p className="text-xs text-muted-foreground">
            {remaining === 0 ? "all done" : `${remaining} remaining`}
          </p>
        </div>
      )}
    </div>
  );
}
