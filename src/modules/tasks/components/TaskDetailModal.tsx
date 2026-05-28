"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Target, Zap } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { formatDuration } from "@/lib/duration";
import { getGoals } from "@/modules/goals/api/goals-api";
import type { GoalResponse } from "@/modules/goals/api/goals-api";
import type { TaskResponse, TaskPriority, TaskStatus } from "../types";

const schema = z.object({
  title: z.string().min(1, "Title is required"),
  priority: z.enum(["HIGH", "MEDIUM", "LOW"]),
  scheduledFor: z.string().optional(),
  estimatedMinutes: z
    .string()
    .optional()
    .refine(
      (v) => !v || (Number(v) > 0 && Number.isFinite(Number(v))),
      "Must be a positive number",
    ),
});

type FormValues = z.infer<typeof schema>;

export type TaskUpdateInput = Partial<{
  title: string;
  priority: TaskPriority;
  scheduledFor: string | null;
  estimatedDuration: number;
}>;

type Props = {
  task: TaskResponse | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (taskId: string, updates: TaskUpdateInput) => Promise<void>;
  isSaving: boolean;
};

const STATUS_STYLES: Record<TaskStatus, string> = {
  PENDING: "bg-muted text-muted-foreground",
  IN_PROGRESS: "bg-blue-500/10 text-blue-500",
  PAUSED: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  COMPLETED: "bg-emerald-500/10 text-emerald-500",
  CANCELLED: "bg-muted text-muted-foreground line-through",
};

const STATUS_LABELS: Record<TaskStatus, string> = {
  PENDING: "Pending",
  IN_PROGRESS: "In progress",
  PAUSED: "Paused",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function TaskDetailModal({
  task,
  open,
  onOpenChange,
  onSave,
  isSaving,
}: Props) {
  const [goals, setGoals] = useState<GoalResponse[]>([]);

  const estimatedMinutes =
    task && task.estimatedDuration > 0
      ? Math.round(task.estimatedDuration / 60_000)
      : undefined;

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isDirty },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
  });

  const priority = watch("priority");

  useEffect(() => {
    if (!open || !task) return;
    reset({
      title: task.title,
      priority: task.priority,
      scheduledFor: task.scheduledFor ?? "",
      estimatedMinutes: estimatedMinutes ? String(estimatedMinutes) : "",
    });
    getGoals({ status: "ACTIVE", limit: 50 }).then(({ payload }) => {
      if (payload && "success" in payload && payload.success) {
        setGoals(payload.data.items);
      }
    });
  }, [open, task, estimatedMinutes, reset]);

  async function onSubmit(values: FormValues) {
    if (!task) return;
    const updates: TaskUpdateInput = {};
    if (values.title !== task.title) updates.title = values.title;
    if (values.priority !== task.priority) updates.priority = values.priority;

    const newScheduled = values.scheduledFor || null;
    if (newScheduled !== (task.scheduledFor ?? null))
      updates.scheduledFor = newScheduled;

    const newEstimated = values.estimatedMinutes
      ? Number(values.estimatedMinutes) * 60_000
      : 0;
    if (newEstimated !== task.estimatedDuration)
      updates.estimatedDuration = newEstimated;

    if (Object.keys(updates).length === 0) {
      onOpenChange(false);
      return;
    }

    await onSave(task.id, updates);
  }

  const efficiencyScore = task?.analytics.efficiencyScore;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-[500px]"
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>Task details</DialogTitle>
        </DialogHeader>

        {task && (
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="flex flex-col gap-5 pt-1"
          >
            {/* Title */}
            <div className="flex flex-col gap-1.5">
              <input
                {...register("title")}
                autoFocus
                placeholder="Task title"
                className="w-full rounded-md border border-border bg-transparent px-3 py-2 text-sm font-medium outline-none placeholder:text-muted-foreground focus:border-ring"
              />
              {errors.title && (
                <p className="text-xs text-destructive">
                  {errors.title.message}
                </p>
              )}
            </div>

            {/* Priority */}
            <div className="flex flex-col gap-1.5">
              <span className="text-xs text-muted-foreground">Priority</span>
              <div className="flex gap-2">
                {(["LOW", "MEDIUM", "HIGH"] as const).map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setValue("priority", p, { shouldDirty: true })}
                    className={cn(
                      "flex-1 rounded-md border py-1.5 text-xs font-medium transition-colors",
                      priority === p
                        ? p === "HIGH"
                          ? "border-destructive/60 bg-destructive/10 text-destructive"
                          : p === "MEDIUM"
                            ? "border-amber-500/60 bg-amber-500/10 text-amber-600 dark:text-amber-400"
                            : "border-border bg-accent text-foreground"
                        : "border-border text-muted-foreground hover:text-foreground",
                    )}
                  >
                    {p.charAt(0) + p.slice(1).toLowerCase()}
                  </button>
                ))}
              </div>
            </div>

            {/* Scheduled For + Estimated Duration */}
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <span className="text-xs text-muted-foreground">
                  Scheduled for{" "}
                  <span className="text-muted-foreground/60">(optional)</span>
                </span>
                <input
                  {...register("scheduledFor")}
                  type="date"
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-xs text-foreground outline-none focus:border-ring"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <span className="text-xs text-muted-foreground">
                  Estimated time{" "}
                  <span className="text-muted-foreground/60">(optional)</span>
                </span>
                <div className="relative">
                  <input
                    {...register("estimatedMinutes")}
                    type="number"
                    min="1"
                    placeholder="e.g. 30"
                    className="w-full rounded-md border border-border bg-transparent px-3 py-2 pr-12 text-xs outline-none placeholder:text-muted-foreground focus:border-ring"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                    min
                  </span>
                </div>
                {errors.estimatedMinutes && (
                  <p className="text-xs text-destructive">
                    {errors.estimatedMinutes.message}
                  </p>
                )}
              </div>
            </div>

            {/* Divider */}
            <div className="border-t border-border/50" />

            {/* Meta row */}
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={cn(
                  "rounded-full px-2 py-0.5 text-[10px] font-medium",
                  STATUS_STYLES[task.status],
                )}
              >
                {STATUS_LABELS[task.status]}
              </span>

              {task.goal.title && (
                <span className="inline-flex items-center gap-1 rounded-full bg-primary/15 px-1.5 py-0.5 text-[10px] font-medium text-primary">
                  <Target className="h-2.5 w-2.5 shrink-0" />
                  {task.goal.title}
                </span>
              )}

              {efficiencyScore !== null && efficiencyScore !== undefined && (
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-1.5 py-0.5 text-[10px] font-medium text-amber-600 dark:text-amber-400">
                  <Zap className="h-2.5 w-2.5 shrink-0" />
                  {Math.round(efficiencyScore * 100)}% efficiency
                </span>
              )}

              {task.actualDuration !== null && task.actualDuration > 0 && (
                <span className="text-[10px] text-muted-foreground">
                  Took {formatDuration(task.actualDuration)}
                </span>
              )}
            </div>

            <p className="text-[10px] text-muted-foreground/60">
              Created {formatDate(task.createdAt)}
              {task.updatedAt !== task.createdAt &&
                ` · Updated ${formatDate(task.updatedAt)}`}
            </p>

            {/* Footer */}
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type="submit" size="sm" disabled={isSaving || !isDirty}>
                {isSaving ? "Saving…" : "Save changes"}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
