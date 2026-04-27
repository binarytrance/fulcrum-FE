"use client";

import { Play, ClipboardList, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ActionMenu } from "@/components/ui/action-menu";

// TODO: wire to focus sessions API
const PLACEHOLDER = {
  todayMinutes: 0,
  yesterdayMinutes: 0,
};

function formatDuration(minutes: number): string {
  if (minutes === 0) return "0m";
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

export function FocusTimeSnapshot() {
  const router = useRouter();
  const { todayMinutes, yesterdayMinutes } = PLACEHOLDER;

  const delta = todayMinutes - yesterdayMinutes;
  const deltaAbs = Math.abs(delta);
  const deltaStr = deltaAbs === 0 ? null : `${delta > 0 ? "↑" : "↓"} ${formatDuration(deltaAbs)} vs yesterday`;

  const menuItems = [
    { label: "Start focus session", icon: <Play className="h-3.5 w-3.5" />, onClick: () => router.push("/focus") },
    { label: "Log past session", icon: <ClipboardList className="h-3.5 w-3.5" />, onClick: () => {} },
  ];

  return (
    <div className="relative flex flex-col gap-3 rounded-2xl border border-border/60 bg-card p-4">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground">Focus time</span>
        <ActionMenu
          trigger={
            <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-foreground">
              <Plus className="h-3.5 w-3.5" />
            </Button>
          }
          items={menuItems}
        />
      </div>

      <div>
        <p className="text-2xl font-bold tracking-tight text-foreground">
          {formatDuration(todayMinutes)}
        </p>
        {deltaStr ? (
          <p className={`mt-0.5 text-xs ${delta > 0 ? "text-emerald-500" : "text-rose-500"}`}>
            {deltaStr}
          </p>
        ) : (
          <p className="mt-0.5 text-xs text-muted-foreground">no sessions yet</p>
        )}
      </div>
    </div>
  );
}
