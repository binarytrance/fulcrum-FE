"use client";

import { useEffect, useState } from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { Spinner } from "@/components/ui/spinner";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { toast } from "@/components/ui/toast";
import { CreateHabitModal } from "./CreateHabitModal";
import { updateHabitOccurrence } from "@/modules/habits/api/habits-api";
import type { HabitWithHistory } from "@/modules/habits/types";

type Props = {
  habits: HabitWithHistory[] | null;
  loading: boolean;
};

type HabitRowProps = {
  habit: HabitWithHistory;
  onComplete: (habitId: string) => void;
  isCompleting: boolean;
};

function HabitRow({ habit, onComplete, isCompleting }: HabitRowProps) {
  const today = habit.history[habit.history.length - 1];
  const isCompleted = today?.status === "completed";
  const isScheduledToday = today !== undefined;

  return (
    <div className={cn(
      "flex items-center gap-3 rounded-lg border border-border/50 bg-card px-3 py-2.5 transition-colors",
      isCompleted && "opacity-60",
    )}>
      <div className="min-w-0 flex-1">
        <p className={cn(
          "text-xs font-medium text-foreground truncate",
          isCompleted && "line-through text-muted-foreground",
        )}>
          {habit.title}
        </p>
        {habit.currentStreak > 0 && (
          <p className="text-[10px] text-muted-foreground">🔥 {habit.currentStreak} day streak</p>
        )}
      </div>

      {isScheduledToday && (
        isCompleted ? (
          <span className="shrink-0 text-[10px] font-medium text-emerald-500">Done</span>
        ) : (
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={() => onComplete(habit.id)}
                disabled={isCompleting}
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-emerald-500 text-white transition-colors hover:bg-emerald-600 disabled:opacity-40"
              >
                <Check className="h-3.5 w-3.5" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="top">Mark done</TooltipContent>
          </Tooltip>
        )
      )}
    </div>
  );
}

export function HabitsTodayCard({ habits, loading }: Props) {
  const [list, setList] = useState<HabitWithHistory[]>(habits ?? []);
  const [completingIds, setCompletingIds] = useState<Set<string>>(() => new Set());
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    setList(habits ?? []);
  }, [habits]);

  async function handleComplete(habitId: string) {
    const habit = list.find((h) => h.id === habitId);
    if (!habit) return;
    const today = habit.history[habit.history.length - 1];
    if (!today) return;

    setCompletingIds((prev) => new Set(prev).add(habitId));
    setList((prev) => prev.map((h) => h.id !== habitId ? h : {
      ...h,
      history: h.history.map((entry, i) =>
        i === h.history.length - 1 ? { ...entry, status: "completed" as const } : entry
      ),
    }));

    const { response } = await updateHabitOccurrence(habitId, today.date, "completed");
    if (!response.ok) {
      setList((prev) => prev.map((h) => h.id !== habitId ? h : {
        ...h,
        history: h.history.map((entry, i) =>
          i === h.history.length - 1 ? { ...entry, status: today.status } : entry
        ),
      }));
      toast.error("Couldn't update habit. Please try again.");
    }

    setCompletingIds((prev) => { const n = new Set(prev); n.delete(habitId); return n; });
  }

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
        <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto pr-1">
          {list.map((habit) => (
            <HabitRow
              key={habit.id}
              habit={habit}
              onComplete={handleComplete}
              isCompleting={completingIds.has(habit.id)}
            />
          ))}
        </div>
      )}

      <CreateHabitModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        onCreated={(habit) => setList((prev) => [...prev, habit])}
      />
    </div>
  );
}
