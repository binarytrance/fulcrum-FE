import { FocusTimeSnapshot } from "@/modules/focus/components/FocusTimeSnapshot";
import { TasksSnapshot } from "@/modules/tasks/components/TasksSnapshot";
import { HabitsSnapshot } from "@/modules/habits/components/HabitsSnapshot";
import { StreakSnapshot } from "@/modules/motivation/streak/components/StreakSnapshot";
import type { DailyInsightsResponse } from "@/modules/insights/types";

type Props = {
  insights: DailyInsightsResponse | null;
  loading: boolean;
};

export function MetricsRow({ insights, loading }: Props) {
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      <FocusTimeSnapshot data={insights?.focusSessions ?? null} loading={loading} />
      <TasksSnapshot data={insights?.tasks ?? null} loading={loading} />
      <HabitsSnapshot data={insights?.habits ?? null} loading={loading} />
      <StreakSnapshot data={insights?.appStreak ?? null} loading={loading} />
    </div>
  );
}
