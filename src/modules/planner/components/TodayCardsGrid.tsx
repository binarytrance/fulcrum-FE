import { TasksTodayCard } from "@/modules/tasks";
import { HabitsTodayCard } from "@/modules/habits";
import { FocusTodayCard } from "@/modules/focus";
import { ActiveGoalTodayCard } from "@/modules/goals";
import type { TaskResponse } from "@/modules/tasks";
import type { HabitWithHistory } from "@/modules/habits";
import type { FocusSessionResponse } from "@/modules/focus";
import type { GoalResponse } from "@/modules/goals";

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
