"use client";

import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Spinner } from "@/components/ui/spinner";
import type { HabitWithHistory, OccurrenceStatus } from "@/modules/habits/types";

const DISPLAY_LIMIT = 5;

type Props = {
  habits: HabitWithHistory[] | null;
  loading: boolean;
};

function OccurrenceDot({ status }: { status: OccurrenceStatus | null }) {
  return (
    <span
      className={cn(
        "h-2 w-2 rounded-full",
        status === "completed" && "bg-primary",
        status === "pending"   && "border border-border bg-transparent",
        status === "missed"    && "bg-destructive/50",
        status === "skipped"   && "bg-muted-foreground/40",
        status === null        && "bg-muted/30",
      )}
    />
  );
}

export function HabitsTodayCard({ habits, loading }: Props) {
  const list = habits ?? [];
  const visible = list.slice(0, DISPLAY_LIMIT);
  const hiddenCount = list.length - DISPLAY_LIMIT;

  return (
    <div className="flex h-full flex-col gap-3 rounded-2xl border border-border/60 bg-card p-4">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground">Habits</span>
        {hiddenCount > 0 && (
          <Link
            href="/habits"
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
          >
            View all <ArrowRight className="h-3 w-3" />
          </Link>
        )}
      </div>

      {loading && (
        <div className="flex flex-1 items-center justify-center">
          <Spinner />
        </div>
      )}

      {!loading && list.length === 0 && (
        <div className="flex flex-1 flex-col items-center justify-center gap-1 text-center">
          <p className="text-sm font-medium text-foreground">No habits yet</p>
          <p className="text-xs text-muted-foreground">Add a habit to start tracking your streak</p>
        </div>
      )}

      {!loading && list.length > 0 && (
        <>
          <div className="flex flex-col gap-2.5">
            {visible.map((habit) => (
              <div key={habit.id} className="flex items-center gap-2">
                <span className="flex-1 truncate text-xs font-medium text-foreground">
                  {habit.title}
                </span>
                <div className="flex items-center gap-1">
                  {habit.history.map((entry, i) => (
                    <OccurrenceDot key={i} status={entry.status} />
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between">
            <p className="text-[10px] text-muted-foreground">Last 7 days</p>
            {hiddenCount > 0 && (
              <Link href="/habits" className="text-[10px] text-muted-foreground hover:text-foreground">
                +{hiddenCount} more
              </Link>
            )}
          </div>
        </>
      )}
    </div>
  );
}
