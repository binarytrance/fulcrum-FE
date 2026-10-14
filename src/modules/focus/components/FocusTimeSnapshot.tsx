"use client";

import { Spinner } from "@/shared/components/ui/spinner";
import type { DailyInsightsFocusSessions } from "@/modules/insights";

type Props = {
  data: DailyInsightsFocusSessions | null;
  loading: boolean;
};

function formatDuration(minutes: number): string {
  if (minutes === 0) return "0m";
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

export function FocusTimeSnapshot({ data, loading }: Props) {
  const minutes = data?.totalLoggedMinutes ?? 0;
  const sessions = data?.sessionCount ?? 0;

  return (
    <div className="relative flex flex-col gap-3 rounded-2xl border border-border/60 bg-card p-4">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground">Focus time</span>
      </div>

      {loading ? (
        <div className="flex flex-1 items-center justify-center">
          <Spinner />
        </div>
      ) : (
        <div>
          <p className="text-2xl font-bold tracking-tight text-foreground">
            {formatDuration(minutes)}
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {sessions === 0
              ? "no sessions yet"
              : `${sessions} session${sessions === 1 ? "" : "s"} today`}
          </p>
        </div>
      )}
    </div>
  );
}
