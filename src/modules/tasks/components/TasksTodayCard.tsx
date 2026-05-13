"use client";

import { useEffect, useRef, useState } from "react";
import { Plus, ArrowRight, Zap } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
import Link from "next/link";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { createTask, updateTask } from "@/modules/tasks/api/tasks-api";
import type { TaskResponse } from "@/modules/tasks/types";

function getTodayDate(): string {
  return new Date().toISOString().split("T")[0];
}

function selectHighlightedTask(pending: TaskResponse[]): TaskResponse | null {
  if (pending.length === 0) return null;
  const priorityOrder: Record<string, number> = { HIGH: 0, MEDIUM: 1, LOW: 2 };
  const withGoal = pending.filter((t) => t.goalId);
  const pool = withGoal.length > 0 ? withGoal : pending;
  return [...pool].sort((a, b) => {
    const p = priorityOrder[a.priority] - priorityOrder[b.priority];
    if (p !== 0) return p;
    return (a.estimatedDuration ?? Infinity) - (b.estimatedDuration ?? Infinity);
  })[0];
}

function TaskCheckbox({
  checked,
  disabled,
  onChange,
}: {
  checked: boolean;
  disabled?: boolean;
  onChange: () => void;
}) {
  return (
    <button
      onClick={onChange}
      disabled={disabled}
      className={cn(
        "flex h-4 w-4 shrink-0 items-center justify-center rounded-full border transition-colors",
        checked
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border hover:border-primary",
        disabled && "opacity-50 cursor-not-allowed",
      )}
      aria-label={checked ? "Mark incomplete" : "Mark complete"}
    >
      {checked && (
        <svg viewBox="0 0 10 8" className="h-2.5 w-2.5" fill="none" stroke="currentColor" strokeWidth={2}>
          <polyline points="1,4 3.5,6.5 9,1" />
        </svg>
      )}
    </button>
  );
}

type Props = {
  tasks: TaskResponse[] | null;
  loading: boolean;
};

export function TasksTodayCard({ tasks: initialTasks, loading }: Props) {
  const [tasks, setTasks] = useState<TaskResponse[]>(initialTasks ?? []);
  const [togglingIds, setTogglingIds] = useState<Set<string>>(() => new Set());
  const [addOpen, setAddOpen] = useState(false);
  const [addValue, setAddValue] = useState("");
  const [adding, setAdding] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const today = getTodayDate();

  useEffect(() => { setTasks(initialTasks ?? []); }, [initialTasks]);

  const completed = tasks.filter((t) => t.status === "COMPLETED" || t.status === "CANCELLED");
  const pending = tasks.filter((t) => t.status === "PENDING" || t.status === "IN_PROGRESS");
  const total = tasks.length;
  const highlighted = selectHighlightedTask(pending);
  const regular = pending.filter((t) => t.id !== highlighted?.id);

  async function handleToggle(task: TaskResponse) {
    const newStatus = task.status === "COMPLETED" ? "PENDING" : "COMPLETED";
    setTogglingIds((prev) => new Set(prev).add(task.id));
    setTasks((prev) => prev.map((t) => (t.id === task.id ? { ...t, status: newStatus } : t)));
    const { response } = await updateTask(task.id, { status: newStatus });
    if (!response.ok) {
      setTasks((prev) => prev.map((t) => (t.id === task.id ? { ...t, status: task.status } : t)));
    }
    setTogglingIds((prev) => { const next = new Set(prev); next.delete(task.id); return next; });
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!addValue.trim()) return;
    setAdding(true);
    const { response, payload } = await createTask({ title: addValue.trim(), scheduledFor: today });
    if (response.ok && payload && "success" in payload && payload.success) {
      setTasks((prev) => [...prev, payload.data]);
    }
    setAddValue("");
    setAdding(false);
    setAddOpen(false);
  }

  return (
    <div className="flex h-full min-h-[280px] flex-col gap-3 rounded-2xl border border-border/60 bg-card p-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-muted-foreground">Tasks</span>
          {!loading && total > 0 && (
            <span className="text-xs text-muted-foreground">
              {completed.length === total ? "all done 🎉" : `${completed.length}/${total}`}
            </span>
          )}
        </div>
        <Popover
          open={addOpen}
          onOpenChange={(v) => {
            setAddOpen(v);
            if (v) setTimeout(() => inputRef.current?.focus(), 50);
          }}
        >
          <PopoverTrigger asChild>
            <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-foreground">
              <Plus className="h-3.5 w-3.5" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-60 p-2">
            <form onSubmit={handleAdd} className="flex flex-col gap-2">
              <input
                ref={inputRef}
                value={addValue}
                onChange={(e) => setAddValue(e.target.value)}
                placeholder="Add a task for today…"
                className="w-full rounded-md border border-border bg-transparent px-2.5 py-1.5 text-sm outline-none placeholder:text-muted-foreground focus:border-ring"
              />
              <div className="flex items-center justify-between">
                <button
                  type="submit"
                  disabled={adding || !addValue.trim()}
                  className="rounded-md bg-primary px-3 py-1 text-xs font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                >
                  {adding ? "Adding…" : "Add"}
                </button>
                <Link
                  href="/tasks"
                  className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
                  onClick={() => setAddOpen(false)}
                >
                  View all <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
            </form>
          </PopoverContent>
        </Popover>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex flex-1 items-center justify-center">
          <Spinner />
        </div>
      )}

      {/* Empty */}
      {!loading && total === 0 && (
        <div className="flex flex-1 flex-col items-center justify-center gap-1 text-center">
          <p className="text-sm font-medium text-foreground">What would make today feel like a win?</p>
          <button
            onClick={() => { setAddOpen(true); setTimeout(() => inputRef.current?.focus(), 50); }}
            className="rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90"
          >
            Add a task
          </button>
        </div>
      )}

      {/* Content */}
      {!loading && total > 0 && (
        <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto">
          {/* Highlighted task */}
          {highlighted && (
            <div className="flex items-center gap-2.5 rounded-lg bg-accent/50 px-2.5 py-2">
              <TaskCheckbox
                checked={highlighted.status === "COMPLETED"}
                disabled={togglingIds.has(highlighted.id)}
                onChange={() => handleToggle(highlighted)}
              />
              <span
                className={cn(
                  "flex-1 text-sm font-medium text-foreground",
                  highlighted.status === "COMPLETED" && "line-through text-muted-foreground",
                )}
              >
                {highlighted.title}
              </span>
              <Zap className="h-3 w-3 shrink-0 text-amber-500" />
            </div>
          )}

          {/* Pending tasks */}
          {regular.length > 0 && (
            <div className="flex flex-col gap-1">
              {regular.map((task) => (
                <div key={task.id} className="flex items-center gap-2.5 px-0.5 py-1">
                  <TaskCheckbox
                    checked={false}
                    disabled={togglingIds.has(task.id)}
                    onChange={() => handleToggle(task)}
                  />
                  <span className="flex-1 text-sm text-foreground">{task.title}</span>
                </div>
              ))}
            </div>
          )}

          {/* Completed tasks */}
          {completed.length > 0 && (
            <>
              {(highlighted || regular.length > 0) && (
                <div className="h-px bg-border/40" />
              )}
              <div className="flex flex-col gap-1">
                {completed.map((task) => (
                  <div key={task.id} className="flex items-center gap-2.5 px-0.5 py-1 opacity-50">
                    <TaskCheckbox
                      checked
                      disabled={togglingIds.has(task.id)}
                      onChange={() => handleToggle(task)}
                    />
                    <span className="flex-1 text-sm line-through text-muted-foreground">
                      {task.title}
                    </span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
