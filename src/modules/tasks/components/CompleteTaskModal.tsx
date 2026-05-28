"use client";

import confetti from "canvas-confetti";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { formatDuration } from "@/lib/duration";
import type { TaskResponse } from "../types";

const schema = z.object({
  actualMinutes: z
    .string()
    .optional()
    .refine(
      (v) => !v || (Number(v) > 0 && Number.isFinite(Number(v))),
      "Must be a positive number",
    ),
});

type FormValues = z.infer<typeof schema>;

type Props = {
  task: TaskResponse | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete: (taskId: string, actualDuration?: number) => void;
  isCompleting: boolean;
};

export function CompleteTaskModal({
  task,
  open,
  onOpenChange,
  onComplete,
  isCompleting,
}: Props) {
  const estimatedMinutes =
    task && task.estimatedDuration > 0
      ? Math.round(task.estimatedDuration / 60)
      : undefined;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
  });

  useEffect(() => {
    if (open) {
      reset({
        actualMinutes: estimatedMinutes ? String(estimatedMinutes) : "",
      });
    }
  }, [open, estimatedMinutes, reset]);

  function onSubmit(values: FormValues) {
    if (!task) return;
    const actualDuration = values.actualMinutes
      ? Number(values.actualMinutes) * 60
      : undefined;
    confetti({
      particleCount: 80,
      spread: 60,
      origin: { x: 0.5, y: 0.6 },
      colors: ["#10b981", "#34d399", "#6ee7b7", "#a7f3d0"],
      scalar: 0.9,
    });
    onComplete(task.id, actualDuration);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-[380px]"
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>Complete task</DialogTitle>
        </DialogHeader>

        {task && (
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="flex flex-col gap-4 pt-1"
          >
            <p className="truncate text-sm font-medium text-foreground">
              {task.title}
            </p>

            <div className="flex flex-col gap-1.5">
              <span className="text-xs text-muted-foreground">
                How long did it take?
                {task.estimatedDuration > 0 && (
                  <span className="ml-1 text-muted-foreground/60">
                    (estimated {formatDuration(task.estimatedDuration)})
                  </span>
                )}
                <span className="ml-1 text-muted-foreground/60">(optional)</span>
              </span>
              <div className="relative">
                <input
                  {...register("actualMinutes")}
                  type="number"
                  min="1"
                  placeholder={
                    estimatedMinutes ? String(estimatedMinutes) : "e.g. 30"
                  }
                  autoFocus
                  className="w-full rounded-md border border-border bg-transparent px-3 py-2 pr-12 text-sm outline-none placeholder:text-muted-foreground focus:border-ring"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                  min
                </span>
              </div>
              {errors.actualMinutes && (
                <p className="text-xs text-destructive">
                  {errors.actualMinutes.message}
                </p>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type="submit" size="sm" disabled={isCompleting}>
                {isCompleting ? "Completing…" : "Mark complete"}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
