"use client";

import { Spinner } from "@/components/ui/spinner";
import type { DailyInsightsHabits } from "@/modules/insights/types";

type Props = {
  data: DailyInsightsHabits | null;
  loading: boolean;
};

export function HabitsSnapshot({ data, loading }: Props) {
  const done = data?.completedHabitCount ?? 0;
  const total = data?.totalHabitCount ?? 0;

  return (
    <div className="relative flex flex-col gap-3 rounded-2xl border border-border/60 bg-card p-4">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground">Habits</span>
      </div>

      {loading ? (
        <div className="flex flex-1 items-center justify-center">
          <Spinner />
        </div>
      ) : total === 0 ? (
        <div>
          <p className="text-2xl font-bold tracking-tight text-foreground">—</p>
          <p className="mt-0.5 text-xs text-muted-foreground">no habits tracked</p>
        </div>
      ) : (
        <div>
          <p className="text-2xl font-bold tracking-tight text-foreground">
            {done}<span className="text-base font-normal text-muted-foreground">/{total}</span>
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {done === total ? "all done today" : `${total - done} left today`}
          </p>
        </div>
      )}
    </div>
  );
}
