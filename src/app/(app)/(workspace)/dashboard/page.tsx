"use client";

import { TodayBanner, MetricsRow, TodayCardsGrid } from "@/modules/planner";
import { useTodayData } from "@/modules/planner/hooks/useTodayData";

export default function DashboardPage() {
  const { dailyInsights, loading, ...bentoData } = useTodayData();

  return (
    <div className="mx-auto flex min-h-full w-full max-w-4xl flex-col gap-4 p-4 lg:h-full lg:p-6">
      <TodayBanner streak={dailyInsights?.appStreak ?? null} loading={loading} />
      <MetricsRow insights={dailyInsights} loading={loading} />
      <div className="flex-1 min-h-[280px] lg:min-h-0">
        <TodayCardsGrid loading={loading} {...bentoData} />
      </div>
    </div>
  );
}
