import { FocusTimeSnapshot } from "@/modules/focus";
import { TasksSnapshot } from "@/modules/tasks";
import { HabitsSnapshot } from "@/modules/habits";
import { StreakSnapshot } from "@/modules/motivation";
import type { DailyInsightsResponse } from "@/modules/insights";

type Props = {
  insights: DailyInsightsResponse | null;
  loading: boolean;
};

export function MetricsRow({ insights, loading }: Props) {
  return (
    <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
      <FocusTimeSnapshot data={insights?.focusSessions ?? null} loading={loading} />
      <TasksSnapshot data={insights?.tasks ?? null} loading={loading} />
      <HabitsSnapshot data={insights?.habits ?? null} loading={loading} />
      <div className="hidden h-full sm:block">
        <StreakSnapshot data={insights?.appStreak ?? null} loading={loading} />
      </div>
    </div>
  );
}
