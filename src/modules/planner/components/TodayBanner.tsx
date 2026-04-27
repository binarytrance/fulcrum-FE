"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CalendarDays, Timer, Clock, Target } from "lucide-react";
import { useTranslations } from "next-intl";

import { useAuthStore } from "@/store/auth-store";
import { Button } from "@/components/ui/button";
import { getDailySnippet } from "@/modules/motivation/knowledge";

function getGreetingKey(
  hour: number
): "greetingMorning" | "greetingAfternoon" | "greetingEvening" | "greetingNight" {
  if (hour >= 5 && hour < 12) return "greetingMorning";
  if (hour >= 12 && hour < 17) return "greetingAfternoon";
  if (hour >= 17 && hour < 21) return "greetingEvening";
  return "greetingNight";
}

export function TodayBanner() {
  const t = useTranslations("Today");
  const user = useAuthStore((s) => s.user);
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
  }, []);

  const greeting = now ? t(getGreetingKey(now.getHours())) : null;
  const firstName = user?.firstname ?? "";
  const snippet = now ? getDailySnippet(now) : null;

  const dateStr = now
    ? new Intl.DateTimeFormat("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
        year: "numeric"
      }).format(now)
    : null;

  return (
    <div className="relative overflow-hidden rounded-2xl border border-border/60 bg-card px-6 py-5">
      {/* Subtle purple glow — dark mode only */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-0 dark:opacity-100"
        style={{
          background:
            "radial-gradient(ellipse at 15% 65%, oklch(0.22 0.07 290 / 0.75) 0%, transparent 55%)"
        }}
      />

      <div className="relative flex items-start justify-between gap-4">
        {/* Left — greeting + date + actions */}
        <div className="space-y-3.5">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              {greeting ?? "Welcome"}
              {firstName ? `, ${firstName}` : ""}! 👋
            </h1>

            <p
              className="mt-1.5 flex items-center gap-1.5 text-sm text-muted-foreground"
              suppressHydrationWarning
            >
              <CalendarDays className="h-3.5 w-3.5 shrink-0" />
              {dateStr ?? ""}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" size="sm" className="gap-2">
              <Timer className="h-3.5 w-3.5" />
              {t("startFocusBlock")}
            </Button>
            <Button variant="outline" size="sm" className="gap-2">
              <Clock className="h-3.5 w-3.5" />
              {t("logSession")}
            </Button>
            <Button variant="outline" size="sm" className="gap-2" asChild>
              <Link href="/goals">
                <Target className="h-3.5 w-3.5" />
                {t("reviewGoals")}
              </Link>
            </Button>
          </div>
        </div>
      </div>

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
