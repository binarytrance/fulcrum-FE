"use client";

import { Flame } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
import type { AppStreak } from "@/modules/insights/types";

type Props = {
  data: AppStreak | null;
  loading: boolean;
};

export function StreakSnapshot({ data, loading }: Props) {
  const current = data?.current ?? 0;
  const longest = data?.longest ?? 0;
  const isBroken = current === 0;

  return (
    <div className="relative flex h-full flex-col gap-3 rounded-2xl border border-border/60 bg-card p-4">
      <div className="flex items-center gap-1.5">
        <Flame className={`h-3.5 w-3.5 ${isBroken || loading ? "text-muted-foreground" : "text-orange-400"}`} />
        <span className="text-xs font-medium text-muted-foreground">Streak</span>
      </div>

      {loading ? (
        <div className="flex flex-1 items-center justify-center">
          <Spinner />
        </div>
      ) : isBroken ? (
        <div>
          <p className="text-2xl font-bold tracking-tight text-foreground">Start today</p>
          {longest > 0 && (
            <p className="mt-0.5 text-xs text-muted-foreground">best: {longest} days</p>
          )}
        </div>
      ) : (
        <div>
          <p className="text-2xl font-bold tracking-tight text-foreground">
            {current}
            <span className="ml-1 text-base font-normal text-muted-foreground">days</span>
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {current >= longest ? "personal best 🎉" : `best: ${longest} days`}
          </p>
        </div>
      )}
    </div>
  );
}
