"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { createTask } from "@/modules/tasks/api/tasks-api";
import { getGoals } from "@/modules/goals/api/goals-api";
import type { GoalResponse } from "@/modules/goals/api/goals-api";
import type { TaskResponse } from "@/modules/tasks/types";
import { analytics } from "@/lib/analytics";

const schema = z.object({
  title: z.string().min(1, "Title is required"),
  priority: z.enum(["HIGH", "MEDIUM", "LOW"]),
  estimatedMinutes: z.string().optional(),
  goalId: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: (task: TaskResponse) => void;
};

function getTodayDate() {
  return new Date().toISOString().split("T")[0];
}

export function CreateTaskModal({ open, onOpenChange, onCreated }: Props) {
  const [goals, setGoals] = useState<GoalResponse[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { priority: "MEDIUM" },
  });

  const priority = watch("priority");

  useEffect(() => {
    if (!open) return;
    getGoals({ status: "ACTIVE", limit: 50 }).then(({ payload }) => {
      if (payload && "success" in payload && payload.success) {
        setGoals(payload.data.items);
      }
    });
  }, [open]);

  useEffect(() => {
    if (!open) {
      reset({ priority: "MEDIUM" });
      setError(null);
    }
  }, [open, reset]);

  async function onSubmit(values: FormValues) {
    setSubmitting(true);
    setError(null);
    const estimatedDuration = values.estimatedMinutes
      ? Number(values.estimatedMinutes) * 60_000
      : undefined;
    const { response, payload } = await createTask({
      title: values.title,
      priority: values.priority,
      estimatedDuration,
      goalId: values.goalId || undefined,
      scheduledFor: getTodayDate(),
    });
    if (response.ok && payload && "success" in payload && payload.success) {
      analytics.capture("task_created", {
        priority: values.priority,
        has_goal: Boolean(values.goalId),
        has_estimated_duration: Boolean(values.estimatedMinutes),
      });
      onCreated(payload.data);
      onOpenChange(false);
    } else {
      setError("Something went wrong. Please try again.");
    }
    setSubmitting(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
          className="sm:max-w-[420px]"
          onInteractOutside={(e) => e.preventDefault()}
        >
        <DialogHeader>
          <DialogTitle>Add task</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4 pt-1">
          {/* Title */}
          <div className="flex flex-col gap-1.5">
            <input
              {...register("title")}
              autoFocus
              placeholder="What needs to get done?"
              className="w-full rounded-md border border-border bg-transparent px-3 py-2 text-sm outline-none placeholder:text-muted-foreground focus:border-ring"
            />
            {errors.title && (
              <p className="text-xs text-destructive">{errors.title.message}</p>
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
                  onClick={() => setValue("priority", p)}
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

          {/* Estimated duration */}
          <div className="flex flex-col gap-1.5">
            <span className="text-xs text-muted-foreground">
              Estimated duration <span className="text-muted-foreground/60">(optional)</span>
            </span>
            <div className="relative">
              <input
                {...register("estimatedMinutes")}
                type="number"
                min="1"
                placeholder="e.g. 30"
                className="w-full rounded-md border border-border bg-transparent px-3 py-2 pr-12 text-sm outline-none placeholder:text-muted-foreground focus:border-ring"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                min
              </span>
            </div>
          </div>

          {/* Goal */}
          {goals.length > 0 && (
            <div className="flex flex-col gap-1.5">
              <span className="text-xs text-muted-foreground">
                Link to goal <span className="text-muted-foreground/60">(optional)</span>
              </span>
              <select
                {...register("goalId")}
                className="w-full rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground outline-none focus:border-ring"
              >
                <option value="">No goal</option>
                {goals.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.title}
                  </option>
                ))}
              </select>
            </div>
          )}

          {error && <p className="text-xs text-destructive">{error}</p>}

          <div className="flex justify-end gap-2 pt-1">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" size="sm" disabled={submitting}>
              {submitting ? "Adding…" : "Add task"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
