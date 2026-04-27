"use client";

import { TodayBanner } from "@/modules/planner/components/TodayBanner";
import { MetricsRow } from "@/modules/planner/components/MetricsRow";

export default function DashboardPage() {
  return (
    <div className="mx-auto max-w-4xl space-y-4 p-6">
      <TodayBanner />
      <MetricsRow />
    </div>
  );
}
