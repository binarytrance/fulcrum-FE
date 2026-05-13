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
  goal: GoalResponse | null;
};

export function TodayCardsGrid({ loading, tasks, habits, sessions, goal }: Props) {
  return (
    <div className="today-cards-grid grid gap-3 lg:grid-cols-3">
      <div className="[grid-area:tasks] h-full">
        <TasksTodayCard tasks={tasks} loading={loading} />
      </div>
      <div className="[grid-area:habits] h-full">
        <HabitsTodayCard habits={habits} loading={loading} />
      </div>
      <div className="[grid-area:focus] h-full">
        <FocusTodayCard sessions={sessions} loading={loading} />
      </div>
      <div className="[grid-area:goal]">
        <ActiveGoalTodayCard goal={goal} loading={loading} />
      </div>
    </div>
  );
}
