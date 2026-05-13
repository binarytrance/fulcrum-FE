import { TasksTodayCard } from "@/modules/tasks/components/TasksTodayCard";
import { HabitsTodayCard } from "@/modules/habits/components/HabitsTodayCard";
import { FocusTodayCard } from "@/modules/focus/components/FocusTodayCard";
import { ActiveGoalTodayCard } from "@/modules/goals/components/ActiveGoalTodayCard";
import type { TaskResponse } from "@/modules/tasks/types";
import type { HabitWithHistory } from "@/modules/habits/types";
import type { FocusSessionResponse } from "@/modules/focus/types";
import type { GoalResponse } from "@/modules/goals/api/goals-api";

type Props = {
  loading: boolean;
  tasks: TaskResponse[] | null;
  habits: HabitWithHistory[] | null;
  sessions: FocusSessionResponse[] | null;
  goals: GoalResponse[] | null;
};

export function TodayCardsGrid({ loading, tasks, habits, sessions, goals }: Props) {
  return (
    <div className="today-cards-grid flex flex-col gap-3 lg:grid">
      <div className="[grid-area:tasks] lg:h-full">
        <TasksTodayCard tasks={tasks} loading={loading} />
      </div>
      <div className="[grid-area:habits] lg:h-full">
        <HabitsTodayCard habits={habits} loading={loading} />
      </div>
      <div className="[grid-area:focus] lg:h-full">
        <FocusTodayCard sessions={sessions} loading={loading} />
      </div>
      <div className="[grid-area:goal] lg:h-full">
        <ActiveGoalTodayCard goals={goals} loading={loading} />
      </div>
    </div>
  );
}
