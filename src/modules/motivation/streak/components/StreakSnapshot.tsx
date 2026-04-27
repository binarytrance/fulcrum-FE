"use client";

import { Flame } from "lucide-react";

// TODO: wire to motivation/streak API
const PLACEHOLDER = {
  current: 0,
  longest: 0,
};

export function StreakSnapshot() {
  const { current, longest } = PLACEHOLDER;
  const isBroken = current === 0;

  return (
    <div className="relative flex flex-col gap-3 rounded-2xl border border-border/60 bg-card p-4">
      {/* Header */}
      <div className="flex items-center gap-1.5">
        <Flame
          className={`h-3.5 w-3.5 ${isBroken ? "text-muted-foreground" : "text-orange-400"}`}
        />
        <span className="text-xs font-medium text-muted-foreground">Streak</span>
      </div>

      {/* Value */}
      <div>
        {isBroken ? (
          <>
            <p className="text-2xl font-bold tracking-tight text-foreground">Start today</p>
            {longest > 0 && (
              <p className="mt-0.5 text-xs text-muted-foreground">best: {longest} days</p>
            )}
          </>
        ) : (
          <>
            <p className="text-2xl font-bold tracking-tight text-foreground">
              {current}
              <span className="ml-1 text-base font-normal text-muted-foreground">days</span>
            </p>
            {longest > 0 && (
              <p className="mt-0.5 text-xs text-muted-foreground">
                {current >= longest ? "personal best" : `best: ${longest} days`}
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
}
