"use client";

import { useCallback, useEffect, useState } from "react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";
import {
  getGoals,
  updateGoal,
  type GoalResponse,
  type PaginatedGoals,
} from "@/modules/goals/api/goals-api";
import { CreateGoalModal } from "@/modules/goals/components/CreateGoalModal";
import { GoalsList } from "@/modules/goals/components/GoalsList";
import { analytics } from "@/lib/analytics";
import { cn } from "@/lib/utils";

type GoalEditorState = { mode: "create" } | { mode: "edit"; goal: GoalResponse };

const STATUS_FILTERS = [
  { label: "All", value: undefined },
  { label: "Active", value: "ACTIVE" },
  { label: "Completed", value: "COMPLETED" },
] as const;

const PAGE_LIMIT = 20;

type StatusFilter = (typeof STATUS_FILTERS)[number]["value"];

export function GoalsFullListView() {
  const t = useTranslations("Goals.list");
  const tCommon = useTranslations("Common");

  const [goalEditor, setGoalEditor] = useState<GoalEditorState | null>(null);
  const [goalsLoading, setGoalsLoading] = useState(false);
  const [goalsError, setGoalsError] = useState<string | null>(null);
  const [data, setData] = useState<PaginatedGoals | null>(null);
  const [completingIds, setCompletingIds] = useState<Set<string>>(() => new Set());
  const [statusFilter, setStatusFilter] = useState<StatusFilter>(undefined);
  const [page, setPage] = useState(1);

  const fetchGoals = useCallback(async (status: StatusFilter, p: number) => {
    setGoalsLoading(true);
    setGoalsError(null);

    try {
      const { response, payload } = await getGoals({ status, page: p, limit: PAGE_LIMIT });

      if (!response.ok || !payload || !("success" in payload) || !payload.success) {
        setGoalsError(t("loadError"));
        return;
      }

      setData(payload.data);
    } catch {
      setGoalsError(t("loadError"));
    } finally {
      setGoalsLoading(false);
    }
  }, [t]);

  useEffect(() => {
    void fetchGoals(statusFilter, page);
  }, [fetchGoals, statusFilter, page]);

  function handleStatusFilter(status: StatusFilter) {
    setStatusFilter(status);
    setPage(1);
  }

  const handleComplete = async (goalId: string) => {
    setCompletingIds((prev) => new Set(prev).add(goalId));

    try {
      const { response, payload } = await updateGoal(goalId, {
        status: "COMPLETED"
      });

      if (!response.ok) {
        toast.error(tCommon("genericError"));
        return;
      }

      analytics.capture("goal_completed", { goal_id: goalId });

      if (payload && "success" in payload && payload.success) {
        toast.success(payload.message);
      } else {
        toast.success(t("goalUpdated"));
      }

      await fetchGoals(statusFilter, page);
    } catch {
      toast.error(tCommon("genericError"));
    } finally {
      setCompletingIds((prev) => {
        const next = new Set(prev);
        next.delete(goalId);
        return next;
      });
    }
  };

  return (
    <div className="flex h-full flex-col gap-4 p-6">
      <div className="flex shrink-0 items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">{t("pageTitle")}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {data ? `${data.total} goal${data.total === 1 ? "" : "s"}` : ""}
          </p>
        </div>
        <Button size="sm" onClick={() => setGoalEditor({ mode: "create" })}>{t("createGoal")}</Button>
      </div>

      <div className="shrink-0 flex gap-1 rounded-lg border border-border/60 bg-muted/40 p-1">
        {STATUS_FILTERS.map((f) => (
          <button
            key={f.label}
            onClick={() => handleStatusFilter(f.value)}
            className={cn(
              "flex-1 rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
              statusFilter === f.value
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto">
        <GoalsList
          loading={goalsLoading}
          error={goalsError}
          goals={data?.items ?? null}
          completingIds={completingIds}
          onComplete={handleComplete}
          onEdit={(goal) => setGoalEditor({ mode: "edit", goal })}
          page={page}
          totalPages={data?.totalPages ?? 1}
          total={data?.total}
          onPageChange={setPage}
        />
      </div>

      <CreateGoalModal
        open={goalEditor !== null}
        onOpenChange={(open) => { if (!open) setGoalEditor(null); }}
        mode={goalEditor?.mode ?? "create"}
        initialGoal={goalEditor?.mode === "edit" ? goalEditor.goal : undefined}
        onSaved={(_goal, message) => {
          toast.success(message);
          void fetchGoals(statusFilter, page);
        }}
      />
    </div>
  );
}
