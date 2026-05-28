"use client";

import { useEffect, useState } from "react";
import { CalendarDays, Target, Flame } from "lucide-react";
import { useTranslations } from "next-intl";

import { useAuthStore } from "@/store/auth-store";
import { formatLongDate, formatShortDate } from "@/lib/date";
import { Button } from "@/components/ui/button";
import { CreateGoalModal } from "@/modules/goals/components/CreateGoalModal";
import type { AppStreak } from "@/modules/insights/types";
// import { getDailySnippet } from "@/modules/motivation/knowledge";

function getGreetingKey(
  hour: number
): "greetingMorning" | "greetingAfternoon" | "greetingEvening" | "greetingNight" {
  if (hour >= 5 && hour < 12) return "greetingMorning";
  if (hour >= 12 && hour < 17) return "greetingAfternoon";
  if (hour >= 17 && hour < 21) return "greetingEvening";
  return "greetingNight";
}

type Props = {
  streak: AppStreak | null;
  loading: boolean;
};

export function TodayBanner({ streak, loading }: Props) {
  const t = useTranslations("Today");
  const user = useAuthStore((s) => s.user);
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
  }, []);

  const [goalModalOpen, setGoalModalOpen] = useState(false);
  const greeting = now ? t(getGreetingKey(now.getHours())) : null;
  const firstName = user?.firstname ?? "";
  // const snippet = now ? getDailySnippet(now) : null;

  const dateShort = now ? formatShortDate(now) : null;
  const dateLong = now ? formatLongDate(now) : null;

  return (
    <div className="px-6 py-5">
      <div className="flex flex-col gap-3.5">
        {/* Row 1 — greeting + date */}
        <div className="flex items-start justify-between gap-4">
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            {greeting ?? "Welcome"}
            {firstName ? `, ${firstName}` : ""}! 👋
          </h1>
          <p
            className="flex shrink-0 items-center gap-1.5 text-sm text-muted-foreground"
            suppressHydrationWarning
          >
            <CalendarDays className="h-3.5 w-3.5 shrink-0" />
            <span className="sm:hidden">{dateShort ?? ""}</span>
            <span className="hidden sm:inline">{dateLong ?? ""}</span>
          </p>
        </div>

        {/* Row 2 — buttons + streak */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" size="sm" className="gap-2" onClick={() => setGoalModalOpen(true)}>
              <Target className="h-3.5 w-3.5" />
              Create goal
            </Button>
          </div>

          {!loading && (
            <p className="flex shrink-0 items-center gap-1.5 text-base sm:hidden">
              <Flame className={`h-4 w-4 shrink-0 ${(streak?.current ?? 0) > 0 ? "text-orange-400" : "text-muted-foreground"}`} />
              <span className="font-semibold text-foreground">{streak?.current ?? 0}</span>
            </p>
          )}
        </div>
      </div>

      <CreateGoalModal open={goalModalOpen} onOpenChange={setGoalModalOpen} />

      {/* {snippet && (
        <div className="relative mt-4 border-t border-border/40 pt-4">
          <p className="text-sm leading-relaxed text-muted-foreground">
            <span className="mr-1.5 font-medium text-foreground">{snippet.body}</span>
            {snippet.source && (
              <span className="text-xs text-muted-foreground/70">— {snippet.source}</span>
            )}
          </p>
        </div>
      )} */}
    </div>
  );
}
