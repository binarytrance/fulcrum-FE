"use client";

import { TodayBanner } from "@/modules/planner/components/TodayBanner";

export default function DashboardPage() {
  return (
    <div className="mx-auto max-w-4xl space-y-6 p-6">
      <TodayBanner />
    </div>
  );
}
