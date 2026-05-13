"use client";

import { useState } from "react";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { Spinner } from "@/components/ui/spinner";
import { CreateGoalModal } from "./CreateGoalModal";
import type { GoalResponse } from "@/modules/goals/api/goals-api";

type Props = {
  goals: GoalResponse[] | null;
  loading: boolean;
};

function GoalRow({ goal }: { goal: GoalResponse }) {
  const pct = Math.round(goal.progress.score);
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between gap-2">
        <span className="flex-1 truncate text-sm font-medium text-foreground">{goal.title}</span>
        <span className="shrink-0 text-xs tabular-nums text-muted-foreground">{pct}%</span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-primary transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-[10px] text-muted-foreground">
        {goal.progress.completedTasks}/{goal.progress.totalTasks} tasks
      </span>
    </div>
  );
}

export function ActiveGoalTodayCard({ goals, loading }: Props) {
  const [list, setList] = useState<GoalResponse[]>(goals ?? []);
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-border/60 bg-card p-4">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground">Goal in focus</span>
        {list.length > 0 && (
          <Link href="/goals" className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
            View all <ArrowRight className="h-3 w-3" />
          </Link>
        )}
      </div>

      {loading && (
        <div className="flex items-center justify-center py-4">
          <Spinner />
        </div>
      )}

      {!loading && list.length === 0 && (
        <div className="flex flex-col items-center justify-center gap-1 py-2 text-center">
          <p className="text-sm font-medium text-foreground">No active goals</p>
          <p className="text-xs text-muted-foreground">Set a goal to give your tasks direction</p>
          <button
            onClick={() => setModalOpen(true)}
            className="mt-1 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90"
          >
            Create a goal
          </button>
        </div>
      )}

      {!loading && list.length > 0 && (
        <div className="flex flex-wrap gap-x-6 gap-y-3">
          {list.map((goal) => (
            <div key={goal.id} className="min-w-[180px] flex-1">
              <GoalRow goal={goal} />
            </div>
          ))}
        </div>
      )}

      <CreateGoalModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        onCreated={(goal) => setList((prev) => [...prev, goal])}
      />
    </div>
  );
}
