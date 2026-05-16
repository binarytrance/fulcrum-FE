"use client";

import { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
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
import { createHabit } from "@/modules/habits/api/habits-api";
import type { HabitWithHistory } from "@/modules/habits/types";
import { analytics } from "@/lib/analytics";

const DAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"] as const;

const schema = z
  .object({
    title: z.string().min(1, "Title is required"),
    frequency: z.enum(["daily", "specific_days"]),
    daysOfWeek: z.array(z.number()).optional(),
    targetMinutes: z.string().optional(),
  })
  .refine(
    (v) => v.frequency !== "specific_days" || (v.daysOfWeek && v.daysOfWeek.length > 0),
    { message: "Pick at least one day", path: ["daysOfWeek"] },
  );

type FormValues = z.infer<typeof schema>;

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: (habit: HabitWithHistory) => void;
};

export function CreateHabitModal({ open, onOpenChange, onCreated }: Props) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    control,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { frequency: "daily", daysOfWeek: [] },
  });

  const frequency = watch("frequency");
  const daysOfWeek = watch("daysOfWeek") ?? [];

  useEffect(() => {
    if (!open) {
      reset({ frequency: "daily", daysOfWeek: [] });
      setError(null);
    }
  }, [open, reset]);

  function toggleDay(day: number) {
    const next = daysOfWeek.includes(day)
      ? daysOfWeek.filter((d) => d !== day)
      : [...daysOfWeek, day];
    setValue("daysOfWeek", next);
  }

  async function onSubmit(values: FormValues) {
    setSubmitting(true);
    setError(null);
    const targetDuration = values.targetMinutes
      ? Number(values.targetMinutes) * 60_000
      : undefined;
    const { response, payload } = await createHabit({
      title: values.title,
      frequency: values.frequency,
      daysOfWeek: values.frequency === "specific_days" ? (values.daysOfWeek ?? []) : undefined,
      targetDuration,
    });
    if (response.ok && payload && "success" in payload && payload.success) {
      analytics.capture("habit_created", {
        frequency: values.frequency,
        has_target_duration: Boolean(values.targetMinutes),
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
        className="sm:max-w-[400px]"
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>Add habit</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4 pt-1">
          {/* Title */}
          <div className="flex flex-col gap-1.5">
            <input
              {...register("title")}
              autoFocus
              placeholder="e.g. Morning run"
              className="w-full rounded-md border border-border bg-transparent px-3 py-2 text-sm outline-none placeholder:text-muted-foreground focus:border-ring"
            />
            {errors.title && (
              <p className="text-xs text-destructive">{errors.title.message}</p>
            )}
          </div>

          {/* Frequency */}
          <div className="flex flex-col gap-1.5">
            <span className="text-xs text-muted-foreground">Frequency</span>
            <div className="flex gap-2">
              {(["daily", "specific_days"] as const).map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => setValue("frequency", f)}
                  className={cn(
                    "flex-1 rounded-md border py-1.5 text-xs font-medium transition-colors",
                    frequency === f
                      ? "border-border bg-accent text-foreground"
                      : "border-border text-muted-foreground hover:text-foreground",
                  )}
                >
                  {f === "daily" ? "Every day" : "Specific days"}
                </button>
              ))}
            </div>
          </div>

          {/* Day picker */}
          {frequency === "specific_days" && (
            <div className="flex flex-col gap-1.5">
              <Controller
                control={control}
                name="daysOfWeek"
                render={() => (
                  <div className="flex gap-1.5">
                    {DAYS.map((label, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => toggleDay(i)}
                        className={cn(
                          "flex h-8 flex-1 items-center justify-center rounded-md border text-xs font-medium transition-colors",
                          daysOfWeek.includes(i)
                            ? "border-border bg-accent text-foreground"
                            : "border-border text-muted-foreground hover:text-foreground",
                        )}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                )}
              />
              {errors.daysOfWeek && (
                <p className="text-xs text-destructive">{errors.daysOfWeek.message}</p>
              )}
            </div>
          )}

          {/* Target duration */}
          <div className="flex flex-col gap-1.5">
            <span className="text-xs text-muted-foreground">
              Target duration <span className="text-muted-foreground/60">(optional)</span>
            </span>
            <div className="relative">
              <input
                {...register("targetMinutes")}
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

          {error && <p className="text-xs text-destructive">{error}</p>}

          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="ghost" size="sm" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" size="sm" disabled={submitting}>
              {submitting ? "Adding…" : "Add habit"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
