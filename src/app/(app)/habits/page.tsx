"use client";

import Link from "next/link";
import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Repeat,
  Plus,
  MoreHorizontal,
  CheckCircle2,
  SkipForward,
  Pause,
  Play,
  Trash2,
  Edit2,
  Flame,
  Target,
  Calendar,
  Clock,
  AlertTriangle,
  Sparkles,
  RefreshCw,
  X,
  ChevronDown,
  Search,
  TrendingUp,
} from "lucide-react";
import type {
  Habit,
  HabitStatus,
  CreateHabitDto,
  UpdateHabitDto,
  OccurrenceStatus,
} from "@/types";
import { useHabitsStore } from "@/store/habits-store";
import { useGoalsStore } from "@/store/goals-store";
import { toast } from "@/components/ui/toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

// — Local types ——————————————————————————————————————————————————————————————

type DueTodayEntry = Habit & {
  occurrenceId?: string;
  occurrenceStatus?: OccurrenceStatus;
};
type AllHabitFilter = "all" | HabitStatus;
interface GoalOption {
  id: string;
  title: string;
}

// — Constants ————————————————————————————————————————————————————————————————

const DAYS_OF_WEEK = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

// — Helpers ——————————————————————————————————————————————————————————————————

function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes}m`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
}

function frequencyLabel(h: Pick<Habit, "frequency" | "daysOfWeek">): string {
  if (h.frequency === "daily") return "Daily";
  const days = (h.daysOfWeek ?? []).map((d) => DAYS_OF_WEEK[d]).join(", ");
  return days || "Specific days";
}

// — Schemas ——————————————————————————————————————————————————————————————————

const habitFormSchema = z.object({
  title: z.string().min(1, "Title is required").max(120),
  description: z.string().max(500).optional(),
  goalId: z.string().optional(),
  frequency: z.enum(["daily", "specific_days"]),
  daysOfWeek: z.array(z.number().min(0).max(6)).optional(),
  targetDuration: z.number().int().min(1, "At least 1 minute").max(480),
});

const completeSchema = z.object({
  durationMinutes: z.number().int().min(1, "At least 1 minute"),
  note: z.string().max(500).optional(),
});

type HabitFormValues = z.infer<typeof habitFormSchema>;
type CompleteFormValues = z.infer<typeof completeSchema>;

// — Goal Combobox ————————————————————————————————————————————————————————————

interface GoalComboboxProps {
  value: string;
  onChange: (val: string) => void;
  options: GoalOption[];
}

function GoalCombobox({ value, onChange, options }: GoalComboboxProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const selected = options.find((o) => o.id === value) ?? null;

  const filtered = useMemo(() => {
    if (!query.trim()) return options;
    return options.filter((o) =>
      o.title.toLowerCase().includes(query.toLowerCase()),
    );
  }, [options, query]);

  const handleOpen = () => {
    setOpen(true);
    setQuery("");
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  const handleSelect = (goal: GoalOption | null) => {
    onChange(goal?.id ?? "none");
    setOpen(false);
    setQuery("");
  };

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={handleOpen}
        className={cn(
          "group flex h-10 w-full items-center gap-3 rounded-xl border px-3.5 py-2 text-sm transition-all",
          "border-input bg-background/60 hover:bg-accent/30 hover:border-violet-400/60",
          "focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
          open && "border-violet-500/60 bg-accent/30 ring-2 ring-violet-500/20",
        )}
      >
        <div
          className={cn(
            "flex size-6 shrink-0 items-center justify-center rounded-lg transition-colors",
            selected
              ? "bg-violet-500/15 text-violet-600 dark:text-violet-400"
              : "bg-muted text-muted-foreground",
          )}
        >
          <Target className="size-3.5" />
        </div>
        <span
          className={cn(
            "flex-1 truncate text-left",
            !selected && "text-muted-foreground",
          )}
        >
          {selected ? selected.title : "No goal (standalone)"}
        </span>
        {selected ? (
          <span
            role="button"
            tabIndex={0}
            onClick={(e) => {
              e.stopPropagation();
              handleSelect(null);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.stopPropagation();
                handleSelect(null);
              }
            }}
            className="shrink-0 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
          >
            <X className="size-3.5" />
          </span>
        ) : (
          <ChevronDown className="size-3.5 shrink-0 text-muted-foreground transition-transform group-hover:text-foreground" />
        )}
      </button>

      {open && (
        <div className="absolute z-50 mt-2 w-full overflow-hidden rounded-xl border border-border/80 bg-popover shadow-xl shadow-black/10 ring-1 ring-border/20">
          <div className="flex items-center gap-2.5 border-b border-border/60 px-3.5 py-3">
            <Search className="size-3.5 shrink-0 text-muted-foreground" />
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search goals..."
              className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
          </div>

          <div className="max-h-56 overflow-y-auto py-1.5">
            <button
              type="button"
              onClick={() => handleSelect(null)}
              className={cn(
                "flex w-full items-center gap-3 px-3.5 py-2.5 text-sm transition-colors hover:bg-accent",
                !selected ? "text-foreground" : "text-muted-foreground",
              )}
            >
              <div className="flex size-6 shrink-0 items-center justify-center rounded-lg bg-muted">
                <X className="size-3.5 text-muted-foreground" />
              </div>
              <span>No goal (standalone)</span>
            </button>

            {filtered.length === 0 && (
              <p className="px-3.5 py-3 text-xs text-muted-foreground">
                {query ? "No goals found." : "No active goals."}
              </p>
            )}

            {filtered.map((g) => {
              const isSelected = selected?.id === g.id;
              return (
                <button
                  key={g.id}
                  type="button"
                  onClick={() => handleSelect(g)}
                  className={cn(
                    "flex w-full items-center gap-3 px-3.5 py-2.5 text-sm transition-colors hover:bg-accent",
                    isSelected && "bg-violet-500/8",
                  )}
                >
                  <div
                    className={cn(
                      "flex size-6 shrink-0 items-center justify-center rounded-lg transition-colors",
                      isSelected
                        ? "bg-violet-500/20 text-violet-600 dark:text-violet-400"
                        : "bg-muted text-muted-foreground",
                    )}
                  >
                    <Target className="size-3.5" />
                  </div>
                  <span
                    className={cn(
                      "flex-1 truncate text-left",
                      isSelected &&
                        "font-medium text-violet-700 dark:text-violet-300",
                    )}
                  >
                    {g.title}
                  </span>
                  {isSelected && (
                    <CheckCircle2 className="size-3.5 shrink-0 text-violet-500" />
                  )}
                </button>
              );
            })}
          </div>

          {options.length > 0 && (
            <div className="border-t border-border/60 px-3.5 py-2">
              <p className="text-[10px] text-muted-foreground">
                {query
                  ? `${filtered.length} result${filtered.length !== 1 ? "s" : ""}`
                  : "Active goals"}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// — Complete Habit Dialog ————————————————————————————————————————————————————

interface CompleteHabitDialogProps {
  open: boolean;
  habit: DueTodayEntry | null;
  onClose: () => void;
  onComplete: (durationMinutes: number, note?: string) => Promise<void>;
}

function CompleteHabitDialog({
  open,
  habit,
  onClose,
  onComplete,
}: CompleteHabitDialogProps) {
  const [submitting, setSubmitting] = useState(false);

  const form = useForm<CompleteFormValues>({
    resolver: zodResolver(completeSchema),
    defaultValues: { durationMinutes: habit?.targetDuration ?? 30, note: "" },
  });

  const watched = form.watch("durationMinutes");
  const efficiency =
    habit?.targetDuration && watched
      ? Math.round(
          (Math.min(watched, habit.targetDuration) /
            Math.max(watched, habit.targetDuration)) *
            100,
        )
      : null;

  useEffect(() => {
    if (open && habit)
      form.reset({ durationMinutes: habit.targetDuration, note: "" });
  }, [open, habit]); // eslint-disable-line react-hooks/exhaustive-deps

  const onSubmit = async (data: CompleteFormValues) => {
    setSubmitting(true);
    try {
      await onComplete(data.durationMinutes, data.note || undefined);
      onClose();
    } catch {
      // toast handled upstream
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && !submitting && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader className="pb-1">
          <DialogTitle className="flex items-center gap-3 text-lg">
            <div className="flex size-9 items-center justify-center rounded-xl bg-emerald-500/15 border border-emerald-500/20">
              <CheckCircle2 className="size-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              Mark Done
              <p className="text-sm font-normal text-muted-foreground mt-0.5">
                {habit?.title ?? "Record your progress"}
              </p>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="h-px bg-border/60 -mx-6" />

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-4 pt-1"
          >
            <FormField
              control={form.control}
              name="durationMinutes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium">
                    Duration (min) <span className="text-destructive">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={1}
                      step={1}
                      className="h-10"
                      value={field.value ?? ""}
                      onChange={(e) =>
                        field.onChange(
                          e.target.value === ""
                            ? undefined
                            : parseInt(e.target.value, 10),
                        )
                      }
                    />
                  </FormControl>
                  {habit?.targetDuration && efficiency !== null && (
                    <p className="text-xs text-muted-foreground">
                      Target: {habit.targetDuration}m{" "}
                      <span
                        className={cn(
                          "font-semibold",
                          efficiency >= 90
                            ? "text-emerald-600 dark:text-emerald-400"
                            : "text-amber-600 dark:text-amber-400",
                        )}
                      >
                        {efficiency}% efficiency
                      </span>
                    </p>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="note"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium">
                    Note (optional)
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="How did it go?"
                      rows={2}
                      className="resize-none text-sm"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="h-px bg-border/60 -mx-6" />

            <DialogFooter className="gap-2 sm:gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={submitting}
                className="flex-1 sm:flex-none"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={submitting}
                className="flex-1 sm:flex-none gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white border-0"
              >
                {submitting ? (
                  <>
                    <span className="size-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin" />{" "}
                    Saving...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="size-4" /> Mark Done
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

// — Create / Edit Habit Dialog ——————————————————————————————————————————————

interface CreateEditHabitDialogProps {
  open: boolean;
  editingHabit?: Habit | null;
  onClose: () => void;
  goalOptions: GoalOption[];
}

function CreateEditHabitDialog({
  open,
  editingHabit,
  onClose,
  goalOptions,
}: CreateEditHabitDialogProps) {
  const { createHabit, updateHabit } = useHabitsStore();
  const [submitting, setSubmitting] = useState(false);

  const form = useForm<HabitFormValues>({
    resolver: zodResolver(habitFormSchema),
    defaultValues: {
      title: "",
      description: "",
      goalId: "",
      frequency: "daily",
      daysOfWeek: [],
      targetDuration: 30,
    },
  });

  const frequency = form.watch("frequency");
  const selectedDays = form.watch("daysOfWeek") ?? [];

  useEffect(() => {
    if (!open) return;
    if (editingHabit) {
      form.reset({
        title: editingHabit.title,
        description: editingHabit.description ?? "",
        goalId: editingHabit.goalId ?? "",
        frequency: editingHabit.frequency,
        daysOfWeek: editingHabit.daysOfWeek ?? [],
        targetDuration: editingHabit.targetDuration,
      });
    } else {
      form.reset({
        title: "",
        description: "",
        goalId: "",
        frequency: "daily",
        daysOfWeek: [],
        targetDuration: 30,
      });
    }
  }, [open, editingHabit]); // eslint-disable-line react-hooks/exhaustive-deps

  const toggleDay = (day: number) => {
    const curr = form.getValues("daysOfWeek") ?? [];
    form.setValue(
      "daysOfWeek",
      curr.includes(day) ? curr.filter((d) => d !== day) : [...curr, day],
      { shouldDirty: true },
    );
  };

  const onSubmit = async (data: HabitFormValues) => {
    setSubmitting(true);
    try {
      if (editingHabit) {
        const update: UpdateHabitDto = {
          title: data.title,
          description: data.description || undefined,
          daysOfWeek:
            data.frequency === "specific_days" ? data.daysOfWeek : undefined,
          targetDuration: data.targetDuration,
        };
        await updateHabit(editingHabit.id, update);
        toast.success("Habit updated");
      } else {
        const create: CreateHabitDto = {
          title: data.title,
          description: data.description || undefined,
          goalId: data.goalId && data.goalId !== "none" ? data.goalId : null,
          frequency: data.frequency,
          daysOfWeek:
            data.frequency === "specific_days" ? data.daysOfWeek : undefined,
          targetDuration: data.targetDuration,
        };
        await createHabit(create);
        toast.success("Habit created!");
      }
      onClose();
    } catch (err) {
      toast.error(
        editingHabit ? "Failed to update habit" : "Failed to create habit",
        err instanceof Error ? err.message : undefined,
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && !submitting && onClose()}>
      <DialogContent className="max-w-xl max-h-[94vh] overflow-y-auto">
        <DialogHeader className="pb-1">
          <DialogTitle className="flex items-center gap-3 text-lg">
            <div className="flex size-9 items-center justify-center rounded-xl bg-violet-500/15 border border-violet-500/20">
              <Repeat className="size-5 text-violet-600 dark:text-violet-400" />
            </div>
            <div>
              {editingHabit ? "Edit Habit" : "New Habit"}
              <p className="text-sm font-normal text-muted-foreground mt-0.5">
                {editingHabit
                  ? "Update your habit details."
                  : "Build a routine that compounds over time."}
              </p>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="h-px bg-border/60 -mx-6" />

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-5 pt-1"
          >
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium">
                    Title <span className="text-destructive">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g. Morning meditation"
                      autoFocus
                      className="h-10"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium">
                    Description
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="What does this habit involve?"
                      rows={2}
                      className="resize-none text-sm"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="frequency"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium">
                      Frequency <span className="text-destructive">*</span>
                    </FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                      disabled={!!editingHabit}
                    >
                      <FormControl>
                        <SelectTrigger className="h-10">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="daily">Daily</SelectItem>
                        <SelectItem value="specific_days">
                          Specific Days
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="targetDuration"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium">
                      Duration (min) <span className="text-destructive">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={1}
                        step={1}
                        placeholder="e.g. 30"
                        className="h-10"
                        value={field.value ?? ""}
                        onChange={(e) =>
                          field.onChange(
                            e.target.value === ""
                              ? undefined
                              : parseInt(e.target.value, 10),
                          )
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {frequency === "specific_days" && (
              <FormField
                control={form.control}
                name="daysOfWeek"
                render={() => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium">
                      Days of Week
                    </FormLabel>
                    <div className="flex gap-1.5 flex-wrap">
                      {DAYS_OF_WEEK.map((d, i) => (
                        <button
                          key={d}
                          type="button"
                          onClick={() => toggleDay(i)}
                          className={cn(
                            "w-10 h-9 text-xs font-semibold rounded-lg border transition-all",
                            selectedDays.includes(i)
                              ? "bg-violet-500 text-white border-violet-500 shadow-sm shadow-violet-500/25"
                              : "bg-muted/50 text-muted-foreground border-border hover:border-violet-400 hover:text-foreground",
                          )}
                        >
                          {d}
                        </button>
                      ))}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {!editingHabit && (
              <div className="rounded-xl border border-border/60 bg-muted/20 p-4 space-y-2">
                <FormField
                  control={form.control}
                  name="goalId"
                  render={({ field }) => (
                    <FormItem className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Target className="size-3.5 text-muted-foreground" />
                        <FormLabel className="text-sm font-medium">
                          Link to Goal
                        </FormLabel>
                        <span className="text-[10px] text-muted-foreground bg-muted rounded-full px-1.5 py-0.5">
                          optional
                        </span>
                      </div>
                      <FormControl>
                        <GoalCombobox
                          value={field.value || "none"}
                          onChange={field.onChange}
                          options={goalOptions}
                        />
                      </FormControl>
                      <p className="text-[11px] text-muted-foreground">
                        Associate this habit with an active goal to track
                        aligned progress.
                      </p>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}

            <div className="h-px bg-border/60 -mx-6" />

            <DialogFooter className="gap-2 sm:gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={submitting}
                className="flex-1 sm:flex-none"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={submitting}
                className="flex-1 sm:flex-none gap-1.5"
              >
                {submitting ? (
                  <>
                    <span className="size-3.5 rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground animate-spin" />
                    {editingHabit ? "Saving..." : "Creating..."}
                  </>
                ) : editingHabit ? (
                  <>
                    <Edit2 className="size-4" /> Save Changes
                  </>
                ) : (
                  <>
                    <Plus className="size-4" /> Create Habit
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

// — Delete Dialog ————————————————————————————————————————————————————————————

interface DeleteDialogProps {
  open: boolean;
  habitTitle: string;
  loading: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

function DeleteDialog({
  open,
  habitTitle,
  loading,
  onConfirm,
  onClose,
}: DeleteDialogProps) {
  return (
    <Dialog open={open} onOpenChange={(v) => !v && !loading && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3 text-lg">
            <div className="flex size-9 items-center justify-center rounded-xl bg-destructive/10 border border-destructive/20">
              <AlertTriangle className="size-5 text-destructive" />
            </div>
            <div>
              Delete Habit
              <p className="text-sm font-normal text-muted-foreground mt-0.5">
                This action cannot be undone.
              </p>
            </div>
          </DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground -mt-1">
          Permanently delete{" "}
          <span className="font-semibold text-foreground">"{habitTitle}"</span>?
          All progress and streaks will be lost.
        </p>
        <DialogFooter className="gap-2 sm:gap-2">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={loading}
            className="flex-1 sm:flex-none"
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 sm:flex-none gap-1.5"
          >
            {loading ? (
              <>
                <span className="size-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin" />{" "}
                Deleting...
              </>
            ) : (
              <>
                <Trash2 className="size-4" /> Delete
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// — Today Habit Row ——————————————————————————————————————————————————————————

interface TodayHabitRowProps {
  habit: DueTodayEntry;
  onMarkDone: (h: DueTodayEntry) => void;
  onSkip: (h: DueTodayEntry) => void;
  skipping: boolean;
  goalTitle?: string;
}

function TodayHabitRow({
  habit,
  onMarkDone,
  onSkip,
  skipping,
  goalTitle,
}: TodayHabitRowProps) {
  const isDone = habit.occurrenceStatus === "completed";
  const isSkipped = habit.occurrenceStatus === "skipped";
  const isTerminal = isDone || isSkipped;

  return (
    <div
      className={cn(
        "group flex items-start gap-3 rounded-xl border px-3.5 py-3 transition-all duration-150",
        isDone && "bg-muted/20 border-transparent opacity-55",
        isSkipped && "bg-muted/20 border-transparent opacity-45",
        !isTerminal &&
          "bg-card/60 border-border/50 hover:border-border hover:bg-card",
      )}
    >
      <button
        onClick={() => !isTerminal && onMarkDone(habit)}
        disabled={isTerminal || skipping}
        className={cn(
          "mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full border-2 transition-all group/tick",
          isDone && "border-emerald-400 bg-emerald-400 text-white",
          isSkipped && "border-amber-400 bg-amber-400/20 text-amber-500",
          !isTerminal &&
            "border-muted-foreground/50 hover:border-emerald-500 hover:bg-emerald-500 hover:text-white",
        )}
      >
        {isDone ? (
          <CheckCircle2 className="size-3.5" />
        ) : isSkipped ? (
          <SkipForward className="size-3" />
        ) : (
          <CheckCircle2 className="size-3.5 opacity-0 group-hover/tick:opacity-100 transition-opacity" />
        )}
      </button>

      <div className="flex-1 min-w-0">
        <p
          className={cn(
            "text-sm font-medium leading-snug break-words",
            isTerminal && "line-through text-muted-foreground",
          )}
        >
          {habit.title}
        </p>
        <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
          <span className="inline-flex items-center gap-0.5 text-[10px] text-muted-foreground">
            <Clock className="size-2.5" />
            {formatDuration(habit.targetDuration)}
          </span>
          <span className="inline-flex items-center gap-0.5 text-[10px] text-muted-foreground">
            <Repeat className="size-2.5" />
            {frequencyLabel(habit)}
          </span>
          {goalTitle && (
            <span className="text-[10px] bg-violet-500/10 text-violet-700 dark:text-violet-300 rounded px-1.5 py-px truncate max-w-[120px]">
              {goalTitle}
            </span>
          )}
          {isDone && (
            <span className="text-[10px] font-medium text-emerald-600 dark:text-emerald-400 flex items-center gap-0.5">
              <CheckCircle2 className="size-2.5" /> Done
            </span>
          )}
          {isSkipped && (
            <span className="text-[10px] font-medium text-amber-600 dark:text-amber-400 flex items-center gap-0.5">
              <SkipForward className="size-2.5" /> Skipped
            </span>
          )}
        </div>
      </div>

      {!isTerminal && (
        <div className="flex items-center gap-1 shrink-0">
          <div className="hidden sm:flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              size="sm"
              onClick={() => onMarkDone(habit)}
              className="h-7 px-2.5 text-xs bg-emerald-600 hover:bg-emerald-700 text-white border-0"
            >
              <CheckCircle2 className="size-3.5 mr-1" /> Done
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onSkip(habit)}
              disabled={skipping}
              className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
            >
              <SkipForward className="size-3.5 mr-1" /> Skip
            </Button>
          </div>
          <div className="flex sm:hidden items-center gap-1">
            <Button
              size="sm"
              onClick={() => onMarkDone(habit)}
              className="h-7 px-2.5 text-xs bg-emerald-600 hover:bg-emerald-700 text-white border-0"
            >
              Done
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onSkip(habit)}
              disabled={skipping}
              className="h-7 px-2 text-xs text-muted-foreground"
            >
              Skip
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

// — All Habit Row ————————————————————————————————————————————————————————————

interface AllHabitRowProps {
  habit: Habit;
  goalTitle?: string;
  onEdit: (h: Habit) => void;
  onDelete: (h: Habit) => void;
  onRefresh: () => void;
}

function AllHabitRow({
  habit,
  goalTitle,
  onEdit,
  onDelete,
  onRefresh,
}: AllHabitRowProps) {
  const { pauseHabit, resumeHabit } = useHabitsStore();
  const [actionLoading, setActionLoading] = useState(false);
  const isActive = habit.status === "active";
  const isPaused = habit.status === "paused";

  const handleTogglePause = async () => {
    setActionLoading(true);
    try {
      if (isActive) {
        await pauseHabit(habit.id);
        toast.success("Habit paused");
      } else {
        await resumeHabit(habit.id);
        toast.success("Habit resumed");
      }
      onRefresh();
    } catch (err) {
      toast.error(
        "Failed to update habit",
        err instanceof Error ? err.message : undefined,
      );
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div
      className={cn(
        "group flex items-start gap-3 rounded-xl border px-3.5 py-3 transition-all duration-150",
        isPaused
          ? "bg-muted/20 border-border/30 opacity-65"
          : "bg-card/60 border-border/50 hover:border-border hover:bg-card",
      )}
    >
      <div className="mt-1.5 flex size-4 shrink-0 items-center justify-center">
        {isActive ? (
          <div className="size-2 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500/50" />
        ) : (
          <div className="size-2 rounded-full bg-amber-400/80" />
        )}
      </div>

      <div className="flex-1 min-w-0">
        <Link
          href={`/habits/${habit.id}`}
          className="text-sm font-medium leading-snug truncate hover:text-violet-600 dark:hover:text-violet-400 transition-colors line-clamp-1"
        >
          {habit.title}
        </Link>
        {habit.description && (
          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
            {habit.description}
          </p>
        )}
        <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
          <span
            className={cn(
              "inline-flex items-center rounded-full px-1.5 py-px text-[10px] font-medium",
              isActive
                ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                : "bg-amber-500/10 text-amber-700 dark:text-amber-400",
            )}
          >
            {habit.status}
          </span>
          <span className="inline-flex items-center gap-0.5 text-[10px] text-muted-foreground">
            <Repeat className="size-2.5" />
            {frequencyLabel(habit)}
          </span>
          <span className="inline-flex items-center gap-0.5 text-[10px] text-muted-foreground">
            <Clock className="size-2.5" />
            {formatDuration(habit.targetDuration)}
          </span>
          {goalTitle && (
            <span className="text-[10px] bg-violet-500/10 text-violet-700 dark:text-violet-300 rounded px-1.5 py-px truncate max-w-[110px]">
              {goalTitle}
            </span>
          )}
        </div>
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="size-7 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
            disabled={actionLoading}
          >
            <MoreHorizontal className="size-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-44 rounded-xl">
          <DropdownMenuLabel className="text-xs">Actions</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <Link href={`/habits/${habit.id}`}>
              <Target className="size-3.5" /> View details
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onEdit(habit)}>
            <Edit2 className="size-3.5" /> Edit
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleTogglePause}>
            {isActive ? (
              <>
                <Pause className="size-3.5" /> Pause
              </>
            ) : (
              <>
                <Play className="size-3.5" /> Resume
              </>
            )}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem destructive onClick={() => onDelete(habit)}>
            <Trash2 className="size-3.5" /> Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

// — Skeleton ——————————————————————————————————————————————————————————————————

function HabitRowSkeleton() {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-border/50 px-3.5 py-3">
      <Skeleton className="size-5 rounded-full shrink-0 mt-0.5" />
      <div className="flex-1 space-y-1.5">
        <Skeleton className="h-4 w-3/4" />
        <div className="flex gap-1.5">
          <Skeleton className="h-3.5 w-14 rounded-full" />
          <Skeleton className="h-3.5 w-16 rounded-full" />
        </div>
      </div>
    </div>
  );
}

// — Habits Page ———————————————————————————————————————————————————————————————

export default function HabitsPage() {
  const {
    habits,
    todaysHabits,
    loading,
    loadingMore,
    pagination,
    fetchHabits,
    loadMoreHabits,
    fetchDueToday,
    completeOccurrence,
    skipOccurrence,
    deleteHabit,
  } = useHabitsStore();
  const { goals, fetchGoals } = useGoalsStore();

  const [allFilter, setAllFilter] = useState<AllHabitFilter>("all");
  const [formOpen, setFormOpen] = useState(false);
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);
  const [completingHabit, setCompletingHabit] = useState<DueTodayEntry | null>(
    null,
  );
  const [completeOpen, setCompleteOpen] = useState(false);
  const [deletingHabit, setDeletingHabit] = useState<Habit | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [skippingId, setSkippingId] = useState<string | null>(null);

  // Goals + today load once; habits load via allFilter effect
  useEffect(() => {
    fetchGoals();
    fetchDueToday();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Server-side filter: re-fetch from page 1 whenever the filter changes
  useEffect(() => {
    fetchHabits({
      status: allFilter === "all" ? undefined : allFilter,
      page: 1,
      limit: 10,
    });
  }, [allFilter]); // eslint-disable-line react-hooks/exhaustive-deps

  const refresh = useCallback(() => {
    fetchHabits({
      status: allFilter === "all" ? undefined : allFilter,
      page: 1,
      limit: 10,
    });
    fetchDueToday();
  }, [fetchHabits, fetchDueToday, allFilter]);

  const handleLoadMore = useCallback(() => {
    if (!pagination) return;
    loadMoreHabits({
      status: allFilter === "all" ? undefined : allFilter,
      page: pagination.page + 1,
      limit: pagination.limit,
    });
  }, [loadMoreHabits, pagination, allFilter]);

  const goalOptions = useMemo(
    () =>
      goals
        .filter((g) => g.status === "ACTIVE")
        .map((g) => ({ id: g.id, title: g.title })),
    [goals],
  );

  const goalMap = useMemo(
    () => Object.fromEntries(goals.map((g) => [g.id, g.title])),
    [goals],
  );

  const todayDone = useMemo(
    () => todaysHabits.filter((h) => h.occurrenceStatus === "completed").length,
    [todaysHabits],
  );
  const todaySkipped = useMemo(
    () => todaysHabits.filter((h) => h.occurrenceStatus === "skipped").length,
    [todaysHabits],
  );
  const todayPending = useMemo(
    () =>
      todaysHabits.filter(
        (h) => !h.occurrenceStatus || h.occurrenceStatus === "pending",
      ).length,
    [todaysHabits],
  );
  const todayPct =
    todaysHabits.length > 0
      ? Math.round((todayDone / todaysHabits.length) * 100)
      : 0;

  // Counts: use pagination.total when that filter is active (accurate), else from loaded page
  const activeCount =
    allFilter === "active"
      ? (pagination?.total ??
        habits.filter((h) => h.status === "active").length)
      : habits.filter((h) => h.status === "active").length;
  const pausedCount =
    allFilter === "paused"
      ? (pagination?.total ??
        habits.filter((h) => h.status === "paused").length)
      : habits.filter((h) => h.status === "paused").length;
  const totalCount =
    allFilter === "all" ? (pagination?.total ?? habits.length) : habits.length;

  const allDone =
    todaysHabits.length > 0 && todayPending === 0 && todaySkipped === 0;
  const hasMore = pagination ? pagination.page < pagination.totalPages : false;

  // — Event handlers ——————————————————————————————————————————————————————————

  const openCompleteDialog = useCallback((h: DueTodayEntry) => {
    setCompletingHabit(h);
    setCompleteOpen(true);
  }, []);

  const handleSkip = useCallback(
    async (h: DueTodayEntry) => {
      if (!h.occurrenceId) {
        toast.error("No occurrence to skip");
        return;
      }
      setSkippingId(h.id);
      try {
        await skipOccurrence(h.id, h.occurrenceId);
        toast.success("Habit skipped");
      } catch (err) {
        toast.error(
          "Failed to skip",
          err instanceof Error ? err.message : undefined,
        );
      } finally {
        setSkippingId(null);
      }
    },
    [skipOccurrence],
  );

  const handleComplete = useCallback(
    async (durationMinutes: number, note?: string) => {
      if (!completingHabit?.occurrenceId) {
        toast.error("No occurrence to complete");
        return;
      }
      try {
        await completeOccurrence(
          completingHabit.id,
          completingHabit.occurrenceId,
          { durationMinutes, note },
        );
        toast.success("Habit done!");
      } catch (err) {
        toast.error(
          "Failed to complete habit",
          err instanceof Error ? err.message : undefined,
        );
        throw err;
      }
    },
    [completingHabit, completeOccurrence],
  );

  const handleDelete = useCallback(async () => {
    if (!deletingHabit) return;
    setDeleteLoading(true);
    try {
      await deleteHabit(deletingHabit.id);
      toast.success("Habit deleted");
      setDeleteOpen(false);
      setDeletingHabit(null);
      fetchHabits({
        status: allFilter === "all" ? undefined : allFilter,
        page: 1,
        limit: 10,
      });
    } catch (err) {
      toast.error(
        "Failed to delete habit",
        err instanceof Error ? err.message : undefined,
      );
    } finally {
      setDeleteLoading(false);
    }
  }, [deletingHabit, deleteHabit, fetchHabits, allFilter]);

  const openEdit = useCallback((h: Habit) => {
    setEditingHabit(h);
    setFormOpen(true);
  }, []);
  const openDelete = useCallback((h: Habit) => {
    setDeletingHabit(h);
    setDeleteOpen(true);
  }, []);
  const closeForm = useCallback(() => {
    setFormOpen(false);
    setEditingHabit(null);
    refresh();
  }, [refresh]);

  // — Stat tiles ——————————————————————————————————————————————————————————————

  const [searchInput, setSearchInput] = useState("");

  const filteredHabits = useMemo(() => {
    if (!searchInput.trim()) return habits;
    const q = searchInput.toLowerCase();
    return habits.filter(
      (h) =>
        h.title.toLowerCase().includes(q) ||
        (h.description?.toLowerCase().includes(q) ?? false),
    );
  }, [habits, searchInput]);

  const STATUS_TABS = [
    {
      key: "all" as AllHabitFilter,
      label: "All",
      count: totalCount || null,
      dot: "bg-slate-400",
      activeBg: "bg-slate-100 dark:bg-slate-800",
      activeText: "text-slate-800 dark:text-slate-100",
      activeBorder: "border-slate-400/60",
    },
    {
      key: "active" as AllHabitFilter,
      label: "Active",
      count: activeCount || null,
      dot: "bg-emerald-500",
      activeBg: "bg-emerald-500/12",
      activeText: "text-emerald-700 dark:text-emerald-300",
      activeBorder: "border-emerald-500/50",
    },
    {
      key: "paused" as AllHabitFilter,
      label: "Paused",
      count: pausedCount || null,
      dot: "bg-amber-400",
      activeBg: "bg-amber-400/12",
      activeText: "text-amber-700 dark:text-amber-300",
      activeBorder: "border-amber-400/50",
    },
  ];

  const statTiles = [
    {
      label: "Today",
      value: todaysHabits.length,
      sub:
        todaysHabits.length === 0
          ? "No habits today"
          : allDone
            ? "All done!"
            : 'remaining',
      iconBg: "bg-violet-500/10 text-violet-600 dark:text-violet-400",
      Icon: Calendar,
      extra: null,
    },
    {
      label: "Active",
      value: activeCount,
      sub: activeCount > 0 ? "Running habits" : "No active habits",
      iconBg: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
      Icon: Repeat,
      extra: null,
    },
    {
      label: "Paused",
      value: pausedCount,
      sub: pausedCount > 0 ? "Temporarily off" : "None paused",
      iconBg: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
      Icon: Pause,
      extra: null,
    },
    {
      label: "Total",
      value: totalCount,
      sub: totalCount > 0 ? "Habits tracked" : "Start building!",
      iconBg: "bg-slate-500/10 text-slate-600 dark:text-slate-400",
      Icon: TrendingUp,
      extra: null,
    },
  ];

  return (
    <div className="relative min-h-screen overflow-x-clip bg-background">
      {/* Background blobs */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-24 left-1/2 h-[480px] w-[600px] -translate-x-1/2 rounded-full opacity-25 blur-3xl"
        style={{
          background:
            "radial-gradient(circle, oklch(0.6 0.25 280) 0%, transparent 65%)",
        }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute right-[-8rem] top-[30%] h-80 w-80 rounded-full opacity-20 blur-3xl"
        style={{
          background:
            "radial-gradient(circle, oklch(0.65 0.22 320) 0%, transparent 65%)",
        }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute bottom-0 left-[-4rem] h-[350px] w-[350px] rounded-full opacity-15 blur-3xl"
        style={{
          background:
            "radial-gradient(circle, oklch(0.7 0.18 240) 0%, transparent 65%)",
        }}
      />

      <div className="relative mx-auto max-w-7xl space-y-6 px-4 py-6 sm:space-y-8 sm:px-6 sm:py-8 lg:px-8">
        {/* Hero card */}
        <div className="relative overflow-hidden rounded-3xl border border-border/70 bg-card/70 p-5 backdrop-blur-sm sm:p-7">
          <div
            aria-hidden="true"
            className="absolute inset-0 opacity-60 pointer-events-none"
            style={{
              background:
                "linear-gradient(130deg, rgba(129,140,248,0.18) 0%, rgba(192,132,252,0.12) 48%, rgba(244,114,182,0.18) 100%)",
            }}
          />
          <div className="relative flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-violet-500/25 bg-violet-500/10">
                <Repeat className="size-5 text-violet-600 dark:text-violet-400" />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-foreground leading-none">
                  Habits
                </h1>
                <p className="mt-1.5 text-sm text-muted-foreground">
                  Build streaks. Make consistency your superpower.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Button
                variant="ghost"
                size="icon"
                className="size-9 text-muted-foreground hover:text-foreground"
                onClick={refresh}
                title="Refresh"
              >
                <RefreshCw className="size-4" />
              </Button>
              <Button
                onClick={() => {
                  setEditingHabit(null);
                  setFormOpen(true);
                }}
                className="gap-1.5 bg-zinc-800 text-zinc-100 hover:bg-zinc-700 border border-zinc-700/50"
              >
                <Plus className="size-4" />
                <span className="hidden sm:inline">New Habit</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Stat tiles */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:gap-4">
          {statTiles.map((tile) => (
            <Card
              key={tile.label}
              className="hover:shadow-md transition-all duration-200 hover:-translate-y-0.5"
            >
              <CardContent className="p-5">
                {loading ? (
                  <div className="space-y-2">
                    <Skeleton className="h-3.5 w-20" />
                    <Skeleton className="h-9 w-16" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                ) : (
                  <div className="flex items-start justify-between">
                    <div className="min-w-0">
                      <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-widest mb-2">
                        {tile.label}
                      </p>
                      <p className="text-3xl font-bold tabular-nums leading-none">
                        {tile.value}
                      </p>
                      <p className="mt-1.5 text-xs text-muted-foreground">
                        {tile.sub}
                      </p>
                      {tile.extra}
                    </div>
                    <div
                      className={cn(
                        "flex size-9 shrink-0 items-center justify-center rounded-xl",
                        tile.iconBg,
                      )}
                    >
                      <tile.Icon className="size-4" />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Main grid */}
        <div className="grid gap-4 xl:grid-cols-[1fr_380px]">
          {/* Left: All Habits */}
          <div className="flex flex-col gap-3 min-w-0">
            {/* Filter bar */}
            <div className="flex flex-col gap-2 rounded-2xl border border-border/60 bg-card/70 px-3 py-2.5 backdrop-blur-sm sm:flex-row sm:items-center sm:py-2">
              <div className="scrollbar-none flex items-center gap-1 flex-1 overflow-x-auto min-w-0 sm:order-first">
                {STATUS_TABS.map((tab) => {
                  const isActive = allFilter === tab.key;
                  return (
                    <button
                      key={tab.key}
                      onClick={() => setAllFilter(tab.key)}
                      className={cn(
                        "flex items-center gap-1.5 h-7 pl-2.5 pr-3 rounded-lg border text-xs font-medium transition-all shrink-0",
                        isActive
                          ? cn(tab.activeBg, tab.activeText, tab.activeBorder)
                          : "border-transparent bg-transparent text-muted-foreground hover:bg-muted/60 hover:text-foreground",
                      )}
                    >
                      <span
                        className={cn(
                          "size-1.5 rounded-full shrink-0",
                          tab.dot,
                          !isActive && "opacity-50",
                        )}
                      />
                      {tab.label}
                      <span
                        className={cn(
                          "ml-0.5 rounded-full px-1.5 py-px text-[10px] leading-none font-normal tabular-nums",
                          isActive
                            ? "bg-black/10 dark:bg-white/15"
                            : "bg-muted text-muted-foreground",
                        )}
                      >
                        {tab.count ?? "—"}
                      </span>
                    </button>
                  );
                })}
              </div>
              <div className="hidden sm:block h-5 w-px bg-border/60 shrink-0 sm:order-2" />
              <div className="flex items-center gap-2 sm:order-last sm:shrink-0">
                <div className="relative flex items-center flex-1 sm:flex-none">
                  <Search className="absolute left-2.5 size-3.5 text-muted-foreground pointer-events-none shrink-0" />
                  <input
                    type="text"
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    placeholder="Search…"
                    className={cn(
                      "h-8 w-full rounded-lg border bg-transparent pl-8 pr-7 text-xs outline-none transition-all sm:w-[140px] sm:focus:w-[200px]",
                      searchInput
                        ? "border-violet-500/50 text-foreground"
                        : "border-border/60 text-muted-foreground focus:border-violet-500/40 focus:text-foreground",
                      "placeholder:text-muted-foreground/60",
                    )}
                  />
                  {searchInput && (
                    <button
                      onClick={() => setSearchInput("")}
                      className="absolute right-2 flex size-4 items-center justify-center rounded-full bg-muted/70 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                      aria-label="Clear search"
                    >
                      <X className="size-2.5" />
                    </button>
                  )}
                </div>
              </div>
            </div>

            {searchInput.trim() && (
              <p className="text-xs text-muted-foreground px-1">
                {filteredHabits.length} result
                {filteredHabits.length !== 1 ? "s" : ""} for &ldquo;
                {searchInput.trim()}&rdquo;
              </p>
            )}

            {/* Habits list */}
            <div className="space-y-1.5">
              {loading ? (
                <div className="space-y-1.5">
                  {[1, 2, 3].map((i) => (
                    <HabitRowSkeleton key={i} />
                  ))}
                </div>
              ) : filteredHabits.length === 0 ? (
                <div className="flex flex-col items-center gap-3 py-12 text-center">
                  <Repeat className="size-8 text-muted-foreground/30" />
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      {searchInput
                        ? "No habits match your search"
                        : "No habits found"}
                    </p>
                    {!searchInput && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="mt-3 h-7 text-xs gap-1"
                        onClick={() => {
                          setEditingHabit(null);
                          setFormOpen(true);
                        }}
                      >
                        <Plus className="size-3" /> Create a habit
                      </Button>
                    )}
                  </div>
                </div>
              ) : (
                <>
                  {filteredHabits.map((h) => (
                    <AllHabitRow
                      key={h.id}
                      habit={h}
                      goalTitle={h.goalId ? goalMap[h.goalId] : undefined}
                      onEdit={openEdit}
                      onDelete={openDelete}
                      onRefresh={refresh}
                    />
                  ))}
                  {hasMore && !searchInput && (
                    <div className="flex flex-col items-center gap-2 py-4">
                      <button
                        onClick={handleLoadMore}
                        disabled={loadingMore}
                        className={cn(
                          "group relative flex items-center gap-2.5 rounded-2xl border border-border/60 bg-card/70 px-6 py-3 text-sm font-medium backdrop-blur-sm transition-all duration-200",
                          "hover:border-violet-500/40 hover:bg-violet-500/5 hover:shadow-sm",
                          loadingMore && "cursor-not-allowed opacity-60",
                        )}
                      >
                        {loadingMore ? (
                          <>
                            <span className="size-4 rounded-full border-2 border-violet-500/30 border-t-violet-500 animate-spin" />{" "}
                            Loading…
                          </>
                        ) : (
                          <>
                            <span className="text-muted-foreground group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors">
                              Load{" "}
                              {Math.min(10, pagination!.total - habits.length)}{" "}
                              more
                            </span>
                            <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] text-muted-foreground tabular-nums">
                              {pagination!.total - habits.length} remaining
                            </span>
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Right: Daily Planner sidebar */}
          <div className="space-y-3 min-w-0">
            <div className="overflow-hidden rounded-2xl border border-border/70 bg-card/70 backdrop-blur-sm">
              <div className="flex items-center gap-1.5 px-3 py-3 border-b border-border/40">
                <Calendar className="size-3.5 text-violet-600 dark:text-violet-400 shrink-0" />
                <p className="text-xs font-semibold flex-1 text-foreground">
                  Today
                </p>
                {allDone ? (
                  <span className="flex items-center gap-1 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 rounded-full px-2 py-0.5">
                    <Flame className="size-3" /> All done!
                  </span>
                ) : todayPending > 0 ? (
                  <span className="text-[10px] text-muted-foreground">
                    {todayPending} left
                  </span>
                ) : null}
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-6 shrink-0 text-muted-foreground hover:text-foreground"
                  onClick={() => {
                    setEditingHabit(null);
                    setFormOpen(true);
                  }}
                  title="New habit"
                >
                  <Plus className="size-3.5" />
                </Button>
              </div>
              {todaysHabits.length > 0 && (
                <div className="px-3 py-2 border-b border-border/40 space-y-1.5">
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="text-muted-foreground">Completion</span>
                    <span className="font-semibold">{todayPct}%</span>
                  </div>
                  <Progress
                    value={todayPct}
                    className={cn(
                      "h-1",
                      todayPct >= 100
                        ? "[&>div]:bg-emerald-500"
                        : todayPct >= 50
                          ? "[&>div]:bg-violet-500"
                          : "[&>div]:bg-indigo-400",
                    )}
                  />
                  <div className="flex items-center gap-3 text-[10px]">
                    <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                      {todayDone} done
                    </span>
                    {todayPending > 0 && (
                      <span className="text-muted-foreground">
                        {todayPending} pending
                      </span>
                    )}
                    {todaySkipped > 0 && (
                      <span className="text-amber-600 dark:text-amber-400 font-medium">
                        {todaySkipped} skipped
                      </span>
                    )}
                  </div>
                </div>
              )}
              <div className="px-2 py-2 space-y-1 max-h-[420px] overflow-y-auto">
                {loading ? (
                  [1, 2].map((i) => <HabitRowSkeleton key={i} />)
                ) : todaysHabits.length === 0 ? (
                  <div className="flex flex-col items-center gap-2 py-6 text-center">
                    <Sparkles className="size-5 text-muted-foreground/50" />
                    <p className="text-xs text-muted-foreground">
                      No habits due today
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 text-xs gap-1"
                      onClick={() => {
                        setEditingHabit(null);
                        setFormOpen(true);
                      }}
                    >
                      <Plus className="size-3" /> New Habit
                    </Button>
                  </div>
                ) : (
                  <>
                    {todaysHabits
                      .filter(
                        (h) =>
                          !h.occurrenceStatus ||
                          h.occurrenceStatus === "pending",
                      )
                      .map((h) => (
                        <TodayHabitRow
                          key={h.id}
                          habit={h}
                          onMarkDone={openCompleteDialog}
                          onSkip={handleSkip}
                          skipping={skippingId === h.id}
                          goalTitle={h.goalId ? goalMap[h.goalId] : undefined}
                        />
                      ))}
                    {todayPending > 0 && todayDone + todaySkipped > 0 && (
                      <Separator className="opacity-30 my-1" />
                    )}
                    {todaysHabits
                      .filter(
                        (h) =>
                          h.occurrenceStatus === "completed" ||
                          h.occurrenceStatus === "skipped",
                      )
                      .map((h) => (
                        <TodayHabitRow
                          key={h.id}
                          habit={h}
                          onMarkDone={openCompleteDialog}
                          onSkip={handleSkip}
                          skipping={false}
                          goalTitle={h.goalId ? goalMap[h.goalId] : undefined}
                        />
                      ))}
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Dialogs */}
      <CreateEditHabitDialog
        open={formOpen}
        editingHabit={editingHabit}
        onClose={closeForm}
        goalOptions={goalOptions}
      />

      <CompleteHabitDialog
        open={completeOpen}
        habit={completingHabit}
        onClose={() => {
          setCompleteOpen(false);
          setCompletingHabit(null);
        }}
        onComplete={handleComplete}
      />

      {deletingHabit && (
        <DeleteDialog
          open={deleteOpen}
          habitTitle={deletingHabit.title}
          loading={deleteLoading}
          onConfirm={handleDelete}
          onClose={() => {
            setDeleteOpen(false);
            setDeletingHabit(null);
          }}
        />
      )}
    </div>
  );
}
