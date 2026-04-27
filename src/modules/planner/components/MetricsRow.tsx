import { FocusTimeSnapshot } from "@/modules/focus/components/FocusTimeSnapshot";
import { TasksSnapshot } from "@/modules/tasks/components/TasksSnapshot";
import { HabitsSnapshot } from "@/modules/habits/components/HabitsSnapshot";
import { StreakSnapshot } from "@/modules/motivation/streak/components/StreakSnapshot";

export function MetricsRow() {
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      <FocusTimeSnapshot />
      <TasksSnapshot />
      <HabitsSnapshot />
      <StreakSnapshot />
    </div>
  );
}
