"use client";

import { Play, ClipboardList } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import type { FocusSessionResponse } from "@/modules/focus/types";

type Props = {
  sessions: FocusSessionResponse[] | null;
  loading: boolean;
};

function msToMinutes(ms: number | null): number {
  return Math.round((ms ?? 0) / 60000);
}

function formatDuration(minutes: number): string {
  if (minutes === 0) return "0m";
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

function formatSessionTime(iso: string): string {
  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(new Date(iso));
}

function SessionRow({ session }: { session: FocusSessionResponse }) {
  return (
    <div className="flex items-center justify-between text-xs">
      <div className="flex items-center gap-1.5">
        <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
        <span className="text-muted-foreground">{formatSessionTime(session.startedAt)}</span>
      </div>
      <span className="font-medium tabular-nums text-foreground">
        {formatDuration(msToMinutes(session.durationMs))}
      </span>
    </div>
  );
}

export function FocusTodayCard({ sessions, loading }: Props) {
  const router = useRouter();
  const list = sessions ?? [];
  const totalMinutes = list.reduce((sum, s) => sum + msToMinutes(s.durationMs), 0);

  return (
    <div className="flex h-full flex-col gap-3 overflow-hidden rounded-2xl border border-border/60 bg-card p-4">
      <span className="shrink-0 text-xs font-medium text-muted-foreground">Focus sessions</span>

      {loading && (
        <div className="flex flex-1 items-center justify-center">
          <Spinner />
        </div>
      )}

      {!loading && list.length === 0 && (
        <div className="flex flex-1 flex-col justify-center">
          <p className="text-sm font-medium text-foreground">No sessions yet</p>
          <p className="text-xs text-muted-foreground">Start or log a session to track your focus</p>
        </div>
      )}

      {!loading && list.length > 0 && (
        <>
          <div className="flex min-h-0 flex-1 flex-col gap-1.5 overflow-y-auto">
            {list.map((s) => (
              <SessionRow key={s.id} session={s} />
            ))}
          </div>
          <div className="shrink-0 flex justify-end border-t border-border/40 pt-1.5">
            <span className="text-xs font-semibold tabular-nums text-foreground">
              {formatDuration(totalMinutes)} today
            </span>
          </div>
        </>
      )}

      <div className="mt-auto shrink-0 flex gap-2">
        <Button
          variant="outline"
          size="sm"
          className="flex-1 gap-1.5 text-xs"
          onClick={() => router.push("/focus")}
        >
          <Play className="h-3 w-3" />
          Start session
        </Button>
        <Button variant="outline" size="sm" className="flex-1 gap-1.5 text-xs">
          <ClipboardList className="h-3 w-3" />
          Log past
        </Button>
      </div>
    </div>
  );
}
