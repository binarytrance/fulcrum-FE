"use client";

import { TodayBanner, MetricsRow } from "@/modules/planner";

export default function DashboardPage() {
  return (
    <div className="mx-auto max-w-4xl space-y-4 p-6">
      <TodayBanner />
      <MetricsRow />
    </div>
  );
}
