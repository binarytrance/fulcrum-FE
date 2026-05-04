"use client";

import { useCallback, useEffect, useState } from "react";
import { useTranslations } from "next-intl";

import { getTasks } from "@/modules/tasks/api/tasks-api";
import { TasksList } from "@/modules/tasks/components/TasksList";
import type { PaginatedTasks, TaskStatus } from "@/modules/tasks/types";
import { cn } from "@/lib/utils";

const STATUS_FILTERS: { label: string; value: TaskStatus | undefined }[] = [
  { label: "All", value: undefined },
  { label: "Pending", value: "PENDING" },
  { label: "In progress", value: "IN_PROGRESS" },
  { label: "Completed", value: "COMPLETED" },
];

const PAGE_LIMIT = 20;

export function TasksListView() {
  const tCommon = useTranslations("Common");

  const [data, setData] = useState<PaginatedTasks | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<TaskStatus | undefined>(undefined);
  const [page, setPage] = useState(1);

  const fetchTasks = useCallback(async (status: TaskStatus | undefined, page: number) => {
    setLoading(true);
    setError(null);

    try {
      const { response, payload } = await getTasks({ status, page, limit: PAGE_LIMIT });

      if (!response.ok || !payload || !payload.success) {
        setError(tCommon("genericError"));
        return;
      }

      setData(payload.data);
    } catch {
      setError(tCommon("genericError"));
    } finally {
      setLoading(false);
    }
  }, [tCommon]);

  useEffect(() => {
    void fetchTasks(statusFilter, page);
  }, [fetchTasks, statusFilter, page]);

  function handleStatusFilter(status: TaskStatus | undefined) {
    setStatusFilter(status);
    setPage(1);
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Tasks</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {data ? `${data.total} task${data.total === 1 ? "" : "s"}` : ""}
        </p>
      </div>

      {/* Status filter tabs */}
      <div className="flex gap-1 rounded-lg border border-border/60 bg-muted/40 p-1">
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

      {/* List */}
      <TasksList
        loading={loading}
        error={error}
        data={data}
        onPageChange={(p) => setPage(p)}
      />
    </div>
  );
}
