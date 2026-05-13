"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { Spinner } from "@/components/ui/spinner";
import { Button } from "@/components/ui/button";
import { CreateHabitModal } from "./CreateHabitModal";
import type { HabitWithHistory, OccurrenceStatus } from "@/modules/habits/types";

type Props = {
  habits: HabitWithHistory[] | null;
  loading: boolean;
};

function OccurrenceDot({ status, isToday }: { status: OccurrenceStatus | null; isToday: boolean }) {
  const dot = (
    <span
      className={cn(
        "relative h-2 w-2 rounded-full transition-colors",
        status === "completed" && "bg-green-500",
        status === "pending" && "border border-border bg-transparent",
        status === "missed" && "bg-red-500",
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
  const [list, setList] = useState<HabitWithHistory[]>(habits ?? []);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    setList(habits ?? []);
  }, [habits]);

  return (
    <div className="flex h-full flex-col gap-3 overflow-hidden rounded-2xl border border-border/60 bg-card p-4">
      <div className="flex shrink-0 items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground">Habits</span>
        {(loading || list.length > 0) && (
          <Button variant="outline" size="sm" className="h-6 px-2 text-xs" onClick={() => setModalOpen(true)}>
            + Add
          </Button>
        )}
      </div>

      {loading && (
        <div className="flex flex-1 items-center justify-center">
          <Spinner />
        </div>
      )}

      {!loading && list.length === 0 && (
        <div className="flex flex-1 flex-col items-center justify-center gap-1 text-center">
          <p className="text-sm font-medium text-foreground">No habits today</p>
          <p className="text-xs text-muted-foreground">
            Build consistency by tracking daily habits
          </p>
          <button
            onClick={() => setModalOpen(true)}
            className="mt-1 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90"
          >
            Add a habit
          </button>
        </div>
      )}

      {!loading && list.length > 0 && (
        <>
          <div className="flex min-h-0 flex-1 flex-col gap-2.5 overflow-y-auto pr-1">
            {list.map((habit) => (
              <HabitRow key={habit.id} habit={habit} />
            ))}
          </div>
        </>
      )}

      <CreateHabitModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        onCreated={(habit) => setList((prev) => [...prev, habit])}
      />
    </div>
  );
}
