"use client";

import { TodayBanner, MetricsRow, TodayCardsGrid } from "@/modules/planner";
import { useTodayData } from "@/modules/planner/hooks/useTodayData";

export default function DashboardPage() {
  const { dailyInsights, loading, ...bentoData } = useTodayData();

  return (
    <div className="today-page mx-auto flex min-h-full w-full max-w-5xl flex-col gap-4 p-4 lg:p-6">
      <TodayBanner streak={dailyInsights?.appStreak ?? null} loading={loading} />
      <MetricsRow insights={dailyInsights} loading={loading} />
      <div className="today-grid-wrapper flex-1">
        <TodayCardsGrid loading={loading} {...bentoData} />
      </div>
    </div>
  );
}
