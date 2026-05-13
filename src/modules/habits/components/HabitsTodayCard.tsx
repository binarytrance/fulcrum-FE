"use client";

import { cn } from "@/lib/utils";
import { Spinner } from "@/components/ui/spinner";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import type { HabitWithHistory, OccurrenceStatus } from "@/modules/habits/types";

const DISPLAY_LIMIT = 3;

type Props = {
  habits: HabitWithHistory[] | null;
  loading: boolean;
};

function OccurrenceDot({ status, isToday }: { status: OccurrenceStatus | null; isToday: boolean }) {
  const dot = (
    <span
      className={cn(
        "relative h-2 w-2 rounded-full transition-colors",
        status === "completed" && "bg-primary",
        status === "pending" && "border border-border bg-transparent",
        status === "missed" && "bg-destructive/50",
        status === "skipped" && "bg-muted-foreground/40",
        status === null && "bg-muted/30",
        isToday && "ring-2 ring-offset-1 ring-offset-card ring-white/70"
      )}
    />
  );

  if (!isToday) return dot;

  return (
    <span className="relative inline-flex h-2 w-2">
      <span className="absolute inline-flex h-full w-full animate-ping-soft rounded-full bg-white opacity-60" />
      {dot}
    </span>
  );
}

function HabitRow({ habit }: { habit: HabitWithHistory }) {
  return (
    <div className="flex items-center gap-2">
      <span className="flex-1 truncate text-xs font-medium text-foreground">{habit.title}</span>
      <div className="flex items-center gap-1">
        {habit.history.map((entry, i) => (
          <OccurrenceDot key={i} status={entry.status} isToday={i === habit.history.length - 1} />
        ))}
      </div>
    </div>
  );
}

export function HabitsTodayCard({ habits, loading }: Props) {
  const list = habits ?? [];
  const visible = list.slice(0, DISPLAY_LIMIT);
  const hidden = list.slice(DISPLAY_LIMIT);

  return (
    <div className="flex h-full flex-col gap-3 rounded-2xl border border-border/60 bg-card p-4">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground">Habits</span>
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
              <HabitRow key={habit.id} habit={habit} />
            ))}
          </div>

          <div className="mt-auto flex items-center justify-between">
            {hidden.length > 0 && (
              <Dialog>
                <DialogTrigger asChild>
                  <button className="text-[10px] text-muted-foreground transition-colors hover:text-foreground ml-auto cursor-pointer">
                    +{hidden.length} more
                  </button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>All habits</DialogTitle>
                  </DialogHeader>
                  <div className="flex flex-col gap-3 pt-1">
                    {list.map((habit) => (
                      <HabitRow key={habit.id} habit={habit} />
                    ))}
                  </div>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </>
      )}
    </div>
  );
}
