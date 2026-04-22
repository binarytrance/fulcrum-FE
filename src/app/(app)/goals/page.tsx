"use client";

import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Link from "next/link";
import {
  Trophy,
  Plus,
  ChevronDown,
  Search,
  MoreHorizontal,
  Calendar,
  Clock,
  Edit2,
  Eye,
  Trash2,
  CheckCircle2,
  Target,
  Pause,
  Play,
  AlertTriangle,
  FolderTree,
  X,
  Sparkles,
  Timer,
  RefreshCw,
} from "lucide-react";
import type {
  Goal,
  GoalStatus,
  GoalCategory,
  GoalPriority,
  CreateGoalDto,
} from "@/types";
import { useGoalsStore } from "@/store/goals-store";
import { toast } from "@/components/ui/toast";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
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
  SelectSeparator,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { getTasks, updateTask, deleteTask, completeTask } from "@/lib/tasks-api";
import { EditTaskDialog } from "@/components/tasks/EditTaskDialog";
import { TaskDetailDialog } from "@/components/tasks/TaskDetailDialog";
import { getGoals as getGoalsApi, getSubgoals, searchGoals as searchGoalsApi } from "@/lib/goals-api";
import { GoalProgressRing } from "@/components/goals/GoalProgressRing";
import type { Task } from "@/types";

// ─── Constants ────────────────────────────────────────────────────────────────

const GOAL_CATEGORIES: GoalCategory[] = [
  "CAREER",
  "LEARNING",
  "HEALTH",
  "PERSONAL",
  "FINANCIAL",
  "OTHER",
];
const GOAL_PRIORITIES: GoalPriority[] = ["HIGH", "MEDIUM", "LOW"];
const MAX_DEPTH = 2;
const PAGE_SIZE = 10;
const SUBGOALS_PREVIEW_PAGE_SIZE = 5;

// ─── Zod Schema ───────────────────────────────────────────────────────────────

const goalFormSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  category: z.enum([
    "CAREER",
    "LEARNING",
    "HEALTH",
    "PERSONAL",
    "FINANCIAL",
    "OTHER",
  ]),
  priority: z.enum(["HIGH", "MEDIUM", "LOW"]),
  deadline: z.string().optional(),
  estimatedHours: z.number().min(0).optional(),
  parentGoalId: z.string().optional(),
});

type GoalFormValues = z.infer<typeof goalFormSchema>;

interface ParentGoalOption {
  id: string;
  title: string;
  category: GoalCategory;
  priority: GoalPriority;
  parentGoalId?: string | null;
}

function ParentGoalCombobox({
  value,
  onChange,
  allGoals,
  excludedGoalId,
}: {
  value: string;
  onChange: (id: string) => void;
  allGoals: Goal[];
  excludedGoalId?: string;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [options, setOptions] = useState<ParentGoalOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<ParentGoalOption | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const mapOption = useCallback(
    (g: Goal): ParentGoalOption => ({
      id: g.id,
      title: g.title,
      category: g.category,
      priority: g.priority,
      parentGoalId: g.parentGoalId,
    }),
    [],
  );

  const isValidParent = useCallback(
    (g: Pick<Goal, "id">) => g.id !== excludedGoalId,
    [excludedGoalId],
  );

  const localFallbackOptions = useMemo(
    () => allGoals.filter((g) => isValidParent(g)).map(mapOption),
    [allGoals, isValidParent, mapOption],
  );

  const loadInitial = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getGoalsApi({ limit: 12, page: 1 });
      const normalized = res.items.filter((g) => isValidParent(g)).map(mapOption);
      setOptions(normalized);
    } catch {
      setOptions(localFallbackOptions.slice(0, 12));
    } finally {
      setLoading(false);
    }
  }, [isValidParent, mapOption, localFallbackOptions]);

  const handleSearch = (q: string) => {
    setQuery(q);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!q.trim()) {
      loadInitial();
      return;
    }
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await searchGoalsApi(q.trim(), { limit: 12 });
        const normalized = res.items.filter((g) => isValidParent(g)).map(mapOption);
        setOptions(normalized);
      } catch {
        const ql = q.trim().toLowerCase();
        setOptions(localFallbackOptions.filter((g) => g.title.toLowerCase().includes(ql)).slice(0, 12));
      } finally {
        setLoading(false);
      }
    }, 300);
  };

  const handleOpen = () => {
    setOpen(true);
    setQuery("");
    loadInitial();
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  const handleSelect = (goal: ParentGoalOption | null) => {
    setSelected(goal);
    onChange(goal?.id ?? "none");
    setOpen(false);
    setQuery("");
  };

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  useEffect(() => {
    if (!value || value === "none") {
      setSelected(null);
      return;
    }
    if (selected?.id === value) return;
    const fromOptions = options.find((o) => o.id === value);
    if (fromOptions) {
      setSelected(fromOptions);
      return;
    }
    const fromLocal = localFallbackOptions.find((o) => o.id === value);
    if (fromLocal) setSelected(fromLocal);
  }, [value, options, selected, localFallbackOptions]);

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
        <div className={cn(
          "flex size-6 shrink-0 items-center justify-center rounded-lg transition-colors",
          selected ? "bg-violet-500/15 text-violet-600 dark:text-violet-400" : "bg-muted text-muted-foreground",
        )}>
          <FolderTree className="size-3.5" />
        </div>
        <span className={cn("flex-1 truncate text-left", !selected && "text-muted-foreground")}>
          {selected ? selected.title : "None - top-level goal"}
        </span>
        {selected && (
          <span
            role="button"
            tabIndex={0}
            onClick={(e) => {
              e.stopPropagation();
              handleSelect(null);
            }}
            onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.stopPropagation(); handleSelect(null); } }}
            className="shrink-0 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
          >
            <X className="size-3.5" />
          </span>
        )}
        {!selected && (
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
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="Search parent goals..."
              className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
            {loading && (
              <span className="size-3.5 shrink-0 rounded-full border-2 border-violet-500/30 border-t-violet-500 animate-spin" />
            )}
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
              <span>None - top-level</span>
            </button>

            {options.length === 0 && !loading && (
              <p className="px-3.5 py-3 text-xs text-muted-foreground">
                {query ? "No parent goals found for that search." : "No available parent goals found."}
              </p>
            )}

            {options.map((g) => {
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
                  <div className={cn(
                    "flex size-6 shrink-0 items-center justify-center rounded-lg transition-colors",
                    isSelected ? "bg-violet-500/20 text-violet-600 dark:text-violet-400" : "bg-muted text-muted-foreground",
                  )}>
                    <FolderTree className="size-3.5" />
                  </div>
                  <div className="min-w-0 flex-1 text-left">
                    <p className={cn("truncate", isSelected && "font-medium text-violet-700 dark:text-violet-300")}>{g.title}</p>
                    <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{categoryConfig[g.category]?.label ?? g.category}</p>
                  </div>
                  {isSelected && <CheckCircle2 className="size-3.5 shrink-0 text-violet-500" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const categoryConfig: Record<
  GoalCategory,
  { label: string; className: string }
> = {
  CAREER: {
    label: "Career",
    className:
      "bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border border-indigo-500/20",
  },
  LEARNING: {
    label: "Learning",
    className:
      "bg-violet-500/10 text-violet-700 dark:text-violet-300 border border-violet-500/20",
  },
  HEALTH: {
    label: "Health",
    className:
      "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20",
  },
  PERSONAL: {
    label: "Personal",
    className:
      "bg-pink-500/10 text-pink-700 dark:text-pink-300 border border-pink-500/20",
  },
  FINANCIAL: {
    label: "Financial",
    className:
      "bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20",
  },
  OTHER: {
    label: "Other",
    className: "bg-muted text-muted-foreground border border-border/60",
  },
};

const priorityConfig: Record<GoalPriority, { label: string; dot: string }> = {
  HIGH: { label: "High", dot: "bg-red-500" },
  MEDIUM: { label: "Medium", dot: "bg-amber-500" },
  LOW: { label: "Low", dot: "bg-slate-400" },
};

const statusConfig: Record<
  GoalStatus,
  {
    label: string;
    variant: "success" | "warning" | "secondary" | "destructive";
  }
> = {
  ACTIVE: { label: "Active", variant: "success" },
  PAUSED: { label: "Paused", variant: "warning" },
  COMPLETED: { label: "Completed", variant: "secondary" },
  ABANDONED: { label: "Abandoned", variant: "destructive" },
  MISSED: { label: "Missed", variant: "destructive" },
};

function formatDeadline(deadline: string): { text: string; overdue: boolean } {
  const rawDate = deadline.includes("T") ? deadline.split("T")[0] : deadline;
  const date = new Date(rawDate + "T00:00:00");
  if (Number.isNaN(date.getTime())) return { text: "Invalid date", overdue: false };
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const days = Math.ceil((date.getTime() - now.getTime()) / 86400000);
  const formatted = date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  if (days < 0) return { text: `${formatted} · overdue`, overdue: true };
  if (days === 0) return { text: `${formatted} · today`, overdue: false };
  if (days <= 7)
    return { text: `${formatted} · ${days}d left`, overdue: false };
  return { text: formatted, overdue: false };
}

// ─── Goal Form Modal ──────────────────────────────────────────────────────────

interface GoalFormModalProps {
  open: boolean;
  onClose: () => void;
  editingGoal?: Goal | null;
  defaultParentId?: string | null;
  allGoals: Goal[];
}

function GoalFormModal({
  open,
  onClose,
  editingGoal,
  defaultParentId,
  allGoals,
}: GoalFormModalProps) {
  const { createGoal, updateGoal } = useGoalsStore();
  const [submitting, setSubmitting] = useState(false);

  const form = useForm<GoalFormValues>({
    resolver: zodResolver(goalFormSchema),
    defaultValues: {
      title: "",
      description: "",
      category: "CAREER",
      priority: "MEDIUM",
      deadline: "",
      estimatedHours: undefined,
      parentGoalId: "",
    },
  });

  useEffect(() => {
    if (!open) return;
    const parentId = defaultParentId ?? editingGoal?.parentGoalId ?? "";
    form.reset({
      title: editingGoal?.title ?? "",
      description: editingGoal?.description ?? "",
      category: editingGoal?.category ?? "CAREER",
      priority: editingGoal?.priority ?? "MEDIUM",
      deadline: (editingGoal?.estimatedEndDate ?? editingGoal?.deadline)
        ? (editingGoal?.estimatedEndDate ?? editingGoal?.deadline)!.split("T")[0]
        : "",
      estimatedHours: editingGoal?.estimatedHours ?? undefined,
      parentGoalId: parentId,
    });
  }, [open, editingGoal, defaultParentId]); // eslint-disable-line react-hooks/exhaustive-deps

  const onSubmit = async (data: GoalFormValues) => {
    setSubmitting(true);
    try {
      const cleaned: Partial<CreateGoalDto> = {
        title: data.title,
        description: data.description || undefined,
        category: data.category,
        priority: data.priority,
        deadline: data.deadline || undefined,
        estimatedEndDate: data.deadline || undefined,
        estimatedHours: data.estimatedHours ?? undefined,
      };
      if (editingGoal) {
        await updateGoal(editingGoal.id, cleaned);
        toast.success("Goal updated");
      } else {
        await createGoal({
          ...(cleaned as CreateGoalDto),
          parentGoalId:
            data.parentGoalId && data.parentGoalId !== "none"
              ? data.parentGoalId
              : undefined,
        });
        toast.success("Goal created!");
      }
      onClose();
    } catch (err) {
      toast.error(
        editingGoal ? "Failed to update goal" : "Failed to create goal",
        err instanceof Error ? err.message : "Please try again.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const lockedParent = defaultParentId
    ? allGoals.find((g) => g.id === defaultParentId)
    : null;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && !submitting && onClose()}>
      <DialogContent className="max-w-xl max-h-[94vh] overflow-y-auto">
        <DialogHeader className="pb-1">
          <DialogTitle className="flex items-center gap-3 text-lg">
            <div className="flex size-9 items-center justify-center rounded-xl bg-violet-500/15 border border-violet-500/20">
              <Target className="size-5 text-violet-600 dark:text-violet-400" />
            </div>
            <div>
              {editingGoal
                ? "Edit Goal"
                : lockedParent
                  ? `Sub-goal under \"${lockedParent.title}\"`
                  : "New Goal"}
              <p className="text-sm font-normal text-muted-foreground mt-0.5">
                {editingGoal
                  ? "Update details and keep progress aligned."
                  : "Define your goal clearly to stay on track."}
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
                      placeholder="e.g. Get promoted this year"
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
                  <FormLabel className="text-sm font-medium">Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Why does this goal matter to you?"
                      rows={3}
                      className="resize-none leading-relaxed"
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
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium">
                      Category <span className="text-destructive">*</span>
                    </FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="h-10">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {GOAL_CATEGORIES.map((cat) => (
                          <SelectItem key={cat} value={cat}>
                            {categoryConfig[cat].label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="priority"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium">
                      Priority <span className="text-destructive">*</span>
                    </FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="h-10">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {GOAL_PRIORITIES.map((p) => (
                          <SelectItem key={p} value={p}>
                            {priorityConfig[p].label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="deadline"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium">Deadline</FormLabel>
                    <FormControl>
                      <Input type="date" className="h-10" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="estimatedHours"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium">Est. Hours</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={0}
                        step={0.5}
                        placeholder="e.g. 40"
                        className="h-10"
                        value={field.value ?? ""}
                        onChange={(e) =>
                          field.onChange(
                            e.target.value === ""
                              ? undefined
                              : parseFloat(e.target.value),
                          )
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {!editingGoal && (
              <FormField
                control={form.control}
                name="parentGoalId"
                render={({ field }) => (
                  <FormItem className="rounded-xl border border-border/60 bg-muted/20 p-4 space-y-2">
                    <div className="flex items-center gap-2">
                      <FolderTree className="size-3.5 text-muted-foreground" />
                      <FormLabel className="text-sm font-medium">Parent Goal</FormLabel>
                      <span className="text-[10px] text-muted-foreground bg-muted rounded-full px-1.5 py-0.5">optional</span>
                    </div>
                    {lockedParent ? (
                      <div className="flex items-center gap-2 rounded-lg border bg-background/70 px-3 py-2 text-sm">
                        <FolderTree className="size-3.5 text-muted-foreground" />
                        <span className="font-medium">
                          {lockedParent.title}
                        </span>
                        <span className="text-muted-foreground">(locked)</span>
                      </div>
                    ) : (
                      <FormControl>
                        <ParentGoalCombobox
                          value={field.value || "none"}
                          onChange={field.onChange}
                          allGoals={allGoals}
                        />
                      </FormControl>
                    )}
                    <p className="text-[11px] text-muted-foreground">
                      Link this as a sub-goal under an existing top-level goal.
                    </p>
                    <FormMessage />
                  </FormItem>
                )}
              />
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
              <Button type="submit" disabled={submitting} className="flex-1 sm:flex-none">
                {submitting ? (
                  <span className="flex items-center gap-2">
                    <span className="size-3.5 rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground animate-spin" />
                    {editingGoal ? "Saving…" : "Creating…"}
                  </span>
                ) : editingGoal ? (
                  "Save Changes"
                ) : (
                  "Create Goal"
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

// ─── Confirm Dialog ───────────────────────────────────────────────────────────

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  destructive?: boolean;
  loading?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Confirm",
  destructive = false,
  loading = false,
  onConfirm,
  onClose,
}: ConfirmDialogProps) {
  return (
    <Dialog open={open} onOpenChange={(v) => !v && !loading && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle
              className={cn(
                "size-5",
                destructive ? "text-destructive" : "text-amber-500",
              )}
            />
            {title}
          </DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            variant={destructive ? "destructive" : "default"}
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="size-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                Processing…
              </span>
            ) : (
              confirmLabel
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Goal Card ────────────────────────────────────────────────────────────────

interface GoalCardProps {
  goal: Goal;
  depth: number;
  onEdit: (goal: Goal) => void;
  onAddChild: (parent: Goal) => void;
}

function GoalCard({
  goal,
  depth,
  onEdit,
  onAddChild,
}: GoalCardProps) {
  const { updateGoal, deleteGoal } = useGoalsStore();
  const [expanded, setExpanded] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [tasksLoading, setTasksLoading] = useState(false);
  const [tasksFetched, setTasksFetched] = useState(false);
  const [taskActionLoading, setTaskActionLoading] = useState<string | null>(null);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [viewingTask, setViewingTask] = useState<Task | null>(null);
  const [subgoals, setSubgoals] = useState<Goal[]>([]);
  const [subgoalsLoading, setSubgoalsLoading] = useState(false);
  const [subgoalsFetched, setSubgoalsFetched] = useState(false);
  const [subgoalsTotal, setSubgoalsTotal] = useState(0);
  const [confirm, setConfirm] = useState<{
    type: "delete" | "abandon" | "complete";
    label: string;
    description: string;
  } | null>(null);

  const visibleChildren = subgoals.slice(0, SUBGOALS_PREVIEW_PAGE_SIZE);
  const hasMoreSubgoals = subgoalsTotal > SUBGOALS_PREVIEW_PAGE_SIZE;
  const canAddChild = depth < MAX_DEPTH;
  const isTerminal = goal.status === "COMPLETED" || goal.status === "ABANDONED" || goal.status === "MISSED";
  const deadlineDate = goal.estimatedEndDate ?? goal.deadline;
  const deadline = deadlineDate ? formatDeadline(deadlineDate) : null;
  const cat = categoryConfig[goal.category] ?? categoryConfig["OTHER"];
  const pri = priorityConfig[goal.priority] ?? priorityConfig["MEDIUM"];
  const sts = statusConfig[goal.status] ?? statusConfig["ACTIVE"];
  const score = goal.progress?.score ?? 0;
  const isOverdue = Boolean(goal.isOverdue || deadline?.overdue);

  // Lazy-fetch subgoals on first expand
  useEffect(() => {
    if (!expanded || subgoalsFetched) return;
    setSubgoalsLoading(true);
    getSubgoals(goal.id, { limit: SUBGOALS_PREVIEW_PAGE_SIZE })
      .then((res) => {
        setSubgoals(res.items);
        setSubgoalsTotal(res.total);
        setSubgoalsFetched(true);
      })
      .catch(() => setSubgoalsFetched(true))
      .finally(() => setSubgoalsLoading(false));
  }, [expanded, subgoalsFetched, goal.id]);

  // Lazy-fetch tasks on first expand
  useEffect(() => {
    if (!expanded || tasksFetched) return;
    setTasksLoading(true);
    getTasks({ goalId: goal.id })
      .then((data) => {
        setTasks(data);
        setTasksFetched(true);
      })
      .catch(() => setTasksFetched(true))
      .finally(() => setTasksLoading(false));
  }, [expanded, tasksFetched, goal.id]);

  const handleTaskAction = async (taskId: string, action: "start" | "pause" | "complete" | "delete") => {
    setTaskActionLoading(taskId);
    try {
      if (action === "start") {
        const updated = await updateTask(taskId, { status: "IN_PROGRESS" });
        setTasks(prev => prev.map(t => t.id === taskId ? updated : t));
        toast.success("Task started!");
      } else if (action === "pause") {
        const updated = await updateTask(taskId, { status: "PENDING" });
        setTasks(prev => prev.map(t => t.id === taskId ? updated : t));
        toast.success("Task paused");
      } else if (action === "complete") {
        const updated = await completeTask(taskId);
        setTasks(prev => prev.map(t => t.id === taskId ? updated : t));
        toast.success("Task completed!");
      } else {
        await deleteTask(taskId);
        setTasks(prev => prev.filter(t => t.id !== taskId));
        toast.success("Task deleted");
      }
    } catch {
      toast.error("Action failed");
    } finally {
      setTaskActionLoading(null);
    }
  };
  
  const handleStatusChange = async (status: GoalStatus) => {
    setActionLoading(true);
    try {
      await updateGoal(goal.id, { status });
      toast.success(
        status === "ACTIVE"
          ? "Goal resumed"
          : status === "PAUSED"
            ? "Goal paused"
            : status === "COMPLETED"
              ? "🎉 Goal completed!"
              : status === "MISSED"
                ? "Goal marked as missed"
                : "Goal abandoned",
      );
    } catch (err) {
      toast.error(
        "Failed to update status",
        err instanceof Error ? err.message : undefined,
      );
    } finally {
      setActionLoading(false);
      setConfirm(null);
    }
  };

  const handleDelete = async () => {
    setActionLoading(true);
    try {
      await deleteGoal(goal.id);
      toast.success("Goal deleted");
      setConfirm(null);
    } catch (err) {
      toast.error(
        "Failed to delete goal",
        err instanceof Error ? err.message : undefined,
      );
    } finally {
      setActionLoading(false);
    }
  };

  const handleConfirm = async () => {
    if (!confirm) return;
    if (confirm.type === "delete") await handleDelete();
    else if (confirm.type === "abandon") await handleStatusChange("ABANDONED");
    else if (confirm.type === "complete") await handleStatusChange("COMPLETED");
  };

  const activeTasks = tasks.filter(
    (t) => t.status !== "COMPLETED" && t.status !== "CANCELLED",
  );
  const completedTasks = tasks.filter((t) => t.status === "COMPLETED");

  return (
    <div className={cn("relative", depth > 0 && "ml-6")}>
      {/* Sub-goal connectors */}
      {depth > 0 && (
        <div className="absolute -left-6 top-0 bottom-0 w-px bg-gradient-to-b from-violet-500/30 to-transparent" />
      )}
      {depth > 0 && (
        <div className="absolute -left-6 top-6 h-px w-5 bg-violet-500/20" />
      )}

      {/* Ready-to-complete banner */}
      {goal.isReadyToComplete && goal.status === "ACTIVE" && (
        <div className="mb-2 flex items-center justify-between gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/5 px-3 py-2">
          <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400">
            <CheckCircle2 className="size-4 shrink-0" />
            <span className="text-xs font-semibold">
              All sub-goals done — ready to complete!
            </span>
          </div>
          <Button
            size="sm"
            variant="ghost"
            className="h-6 px-2 text-xs text-emerald-700 hover:bg-emerald-100 hover:text-emerald-800 dark:text-emerald-400"
            onClick={() =>
              setConfirm({
                type: "complete",
                label: "Mark Complete",
                description: `Mark "${goal.title}" as completed?`,
              })
            }
          >
            Complete
          </Button>
        </div>
      )}

      <Card
        className={cn(
          "overflow-hidden border border-border/70 bg-card/85 backdrop-blur-sm transition-all duration-200",
          "border-l-[3px]",
          !expanded && "hover:shadow-md hover:border-border",
          expanded && "shadow-md border-border",
          goal.status === "ACTIVE" && "border-l-violet-500",
          goal.status === "PAUSED" && "border-l-amber-400",
          goal.status === "COMPLETED" && "border-l-emerald-500",
          goal.status === "ABANDONED" && "border-l-rose-400",
          isTerminal && "opacity-55 saturate-50",
        )}
      >
        {/* ── Summary row (always visible) ── */}
        <CardContent className="px-4 py-3">
          <div
            className="flex items-center gap-3 cursor-pointer"
            onClick={() => setExpanded((v) => !v)}
          >
            {/* Progress ring */}
            {goal.progress !== undefined && (
              <div className="shrink-0">
                <GoalProgressRing percent={score} size={40} strokeWidth={4.5} />
              </div>
            )}

            {/* Title + desc */}
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm leading-snug truncate group-hover:text-violet-600 dark:group-hover:text-violet-400">
                {goal.title}
              </p>
              {goal.description && !expanded && (
                <p className="mt-0.5 text-[11px] text-muted-foreground truncate leading-snug">
                  {goal.description}
                </p>
              )}
            </div>

            {/* Accordion chevron */}
            <ChevronDown
              className={cn(
                "size-4 shrink-0 text-muted-foreground transition-transform duration-200",
                expanded && "rotate-180",
              )}
            />

            {/* Right chips + actions — stop propagation so clicks don't toggle accordion */}
            <div
              className="flex items-center gap-1.5 shrink-0"
              onClick={(e) => e.stopPropagation()}
            >
              <Badge variant={sts.variant} className="text-[10px] px-1.5 py-0">
                {sts.label}
              </Badge>
              <span className="hidden sm:inline-flex items-center gap-1 text-[10px] text-muted-foreground">
                <span className={cn("size-1.5 rounded-full", pri.dot)} />
                {pri.label}
              </span>
              <span
                className={cn(
                  "hidden md:inline-flex items-center rounded-full px-1.5 py-0 text-[10px] font-medium",
                  cat.className,
                )}
              >
                {cat.label}
              </span>
              {deadline && (
                <span
                  className={cn(
                    "hidden lg:flex items-center gap-1 text-[10px]",
                    isOverdue
                      ? "text-destructive font-medium"
                      : "text-muted-foreground",
                  )}
                >
                  <Calendar className="size-3" />
                  {deadline.text}
                </span>
              )}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-7 opacity-40 hover:opacity-100 transition-opacity"
                    disabled={actionLoading}
                  >
                    <MoreHorizontal className="size-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuLabel className="text-xs">
                    Actions
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => onEdit(goal)}>
                    <Edit2 className="size-3.5" /> Edit Goal
                  </DropdownMenuItem>
                  {canAddChild && !isTerminal && (
                    <DropdownMenuItem onClick={() => onAddChild(goal)}>
                      <FolderTree className="size-3.5" /> Add Sub-goal
                    </DropdownMenuItem>
                  )}
                  {!isTerminal && (
                    <>
                      <DropdownMenuSeparator />
                      {goal.status === "ACTIVE" && (
                        <DropdownMenuItem
                          onClick={() => handleStatusChange("PAUSED")}
                        >
                          <Pause className="size-3.5" /> Pause
                        </DropdownMenuItem>
                      )}
                      {goal.status === "PAUSED" && (
                        <DropdownMenuItem
                          onClick={() => handleStatusChange("ACTIVE")}
                        >
                          <Play className="size-3.5" /> Resume
                        </DropdownMenuItem>
                      )}
                      {goal.isReadyToComplete && (
                        <DropdownMenuItem
                          onClick={() =>
                            setConfirm({
                              type: "complete",
                              label: "Mark Complete",
                              description: `Mark "${goal.title}" as completed?`,
                            })
                          }
                        >
                          <CheckCircle2 className="size-3.5" /> Complete
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem
                        destructive
                        onClick={() =>
                          setConfirm({
                            type: "abandon",
                            label: "Abandon",
                            description: `Abandon "${goal.title}"?`,
                          })
                        }
                      >
                        <X className="size-3.5" /> Abandon
                      </DropdownMenuItem>
                    </>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    destructive
                    onClick={() =>
                      setConfirm({
                        type: "delete",
                        label: "Delete",
                        description: `Permanently delete "${goal.title}"?`,
                      })
                    }
                  >
                    <Trash2 className="size-3.5" /> Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </CardContent>

        {/* ── Accordion panel ── */}
        <div
          className={cn(
            "grid transition-all duration-300 ease-in-out",
            expanded ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
          )}
        >
          <div className="overflow-hidden">
            <Separator className="opacity-50" />
            <div className="px-5 py-4 space-y-4">
              {/* Full description */}
              {goal.description && (
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {goal.description}
                </p>
              )}

              {/* Meta */}
              {(deadline || goal.estimatedHours) && (
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  {deadline && (
                    <span
                      className={cn(
                        "flex items-center gap-1",
                        isOverdue && "text-destructive font-semibold",
                      )}
                    >
                      <Calendar className="size-3" />
                      {deadline.text}
                    </span>
                  )}
                  {goal.estimatedHours && (
                    <span className="flex items-center gap-1">
                      <Clock className="size-3" />
                      {goal.estimatedHours}h estimated
                    </span>
                  )}
                </div>
              )}

              {/* Sub-goals (inline preview) */}
              <div className="space-y-1.5">
                <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
                  <FolderTree className="size-3" /> Sub-goals
                  {!subgoalsLoading && subgoalsFetched && subgoalsTotal > 0 && (
                    <span className="font-normal normal-case tracking-normal">({subgoalsTotal})</span>
                  )}
                </p>
                {subgoalsLoading ? (
                  <div className="space-y-1">
                    {[1, 2].map((i) => (
                      <Skeleton key={i} className="h-8 w-full rounded-lg" />
                    ))}
                  </div>
                ) : subgoalsFetched && subgoals.length === 0 ? (
                  <p className="text-xs text-muted-foreground py-1">No sub-goals yet.</p>
                ) : (
                  <div className="space-y-1">
                    {visibleChildren.map((child) => {
                      const childSts = statusConfig[child.status];
                      const childScore = child.progress?.score ?? 0;
                      const childDeadlineDate = child.estimatedEndDate ?? child.deadline;
                      const childDeadline = childDeadlineDate
                        ? formatDeadline(childDeadlineDate)
                        : null;
                      return (
                        <Link
                          key={child.id}
                          href={`/goals/${child.id}`}
                          className="flex items-center gap-2.5 rounded-lg border border-border/50 bg-muted/30 px-3 py-2 hover:bg-muted/50 transition-colors"
                        >
                          <GoalProgressRing
                            percent={childScore}
                            size={28}
                            strokeWidth={3.5}
                            className="shrink-0"
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium truncate">
                              {child.title}
                            </p>
                            {childDeadline && (
                              <p
                                className={cn(
                                  "text-[10px]",
                                  (child.isOverdue || childDeadline.overdue)
                                    ? "text-destructive"
                                    : "text-muted-foreground",
                                )}
                              >
                                {childDeadline.text}
                              </p>
                            )}
                          </div>
                          <Badge
                            variant={childSts.variant}
                            className="text-[10px] px-1.5 py-0 shrink-0"
                          >
                            {childSts.label}
                          </Badge>
                        </Link>
                      );
                    })}
                    {hasMoreSubgoals && (
                      <Link
                        href={`/goals/${goal.id}`}
                        className="flex w-full items-center justify-center gap-1 rounded-lg border border-dashed border-border/60 px-3 py-1.5 text-[11px] text-muted-foreground hover:text-foreground hover:border-border transition-colors"
                      >
                        +{subgoalsTotal - SUBGOALS_PREVIEW_PAGE_SIZE} more sub-goals
                      </Link>
                    )}
                  </div>
                )}
              </div>

              {/* Tasks */}
              <div className="space-y-1.5">
                <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
                  <CheckCircle2 className="size-3" /> Tasks
                  {!tasksLoading && tasksFetched && tasks.length > 0 && (
                    <span className="font-normal normal-case tracking-normal">
                      ({completedTasks.length}/{tasks.length} done)
                    </span>
                  )}
                </p>
                {tasksLoading ? (
                  <div className="space-y-1.5">
                    {[1, 2].map((i) => (
                      <Skeleton key={i} className="h-8 w-full rounded-lg" />
                    ))}
                  </div>
                ) : tasks.length === 0 ? (
                  <p className="text-xs text-muted-foreground py-1">
                    No tasks linked to this goal yet.
                  </p>
                ) : (
                  <div className="space-y-1">
                    {activeTasks.slice(0, 4).map((task) => {
                      const isActive = task.status === "IN_PROGRESS";
                      const isLoading = taskActionLoading === task.id;
                      return (
                        <div
                          key={task.id}
                          className={cn(
                            "group flex items-center gap-2 rounded-lg border px-3 py-2 transition-all",
                            isActive
                              ? "border-violet-500/30 bg-violet-500/[0.04]"
                              : "border-border/40 bg-card hover:border-border/70",
                          )}
                        >
                          <div
                            className={cn(
                              "size-2 rounded-full shrink-0",
                              isActive ? "bg-amber-400" : "bg-muted-foreground/30",
                            )}
                          />
                          <span className="text-xs flex-1 truncate">{task.title}</span>
                          {task.estimatedDuration && (
                            <span className="text-[10px] text-muted-foreground shrink-0 flex items-center gap-0.5">
                              <Clock className="size-2.5" />
                              {Math.round(task.estimatedDuration / 60000)}m
                            </span>
                          )}
                          {/* Inline actions — hover only on md+ */}
                          <div className="hidden md:flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                            <Button
                              variant="ghost" size="icon"
                              className="size-6 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/30"
                              disabled={isLoading}
                              onClick={() => handleTaskAction(task.id, "complete")}
                              title="Complete task"
                            >
                              <CheckCircle2 className="size-3" />
                            </Button>
                            {isActive ? (
                              <Button variant="ghost" size="icon" className="size-6" disabled={isLoading} onClick={() => handleTaskAction(task.id, "pause")}>
                                <Pause className="size-3" />
                              </Button>
                            ) : (
                              <Button variant="ghost" size="icon" className="size-6 text-violet-600 hover:text-violet-700 hover:bg-violet-50 dark:hover:bg-violet-950/30" disabled={isLoading} onClick={() => handleTaskAction(task.id, "start")}>
                                <Play className="size-3" />
                              </Button>
                            )}
                            {isActive && (
                              <Button variant="ghost" size="icon" className="size-6" asChild>
                                <Link href={`/timer/${task.id}`}><Timer className="size-3 text-violet-500" /></Link>
                              </Button>
                            )}
                          </div>
                          {/* Dropdown — always visible */}
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="size-6 opacity-60 hover:opacity-100 md:opacity-0 md:group-hover:opacity-100" disabled={isLoading}>
                                <MoreHorizontal className="size-3" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-44">
                              <DropdownMenuLabel className="text-xs">Actions</DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => handleTaskAction(task.id, "complete")}>
                                <CheckCircle2 className="size-3.5" /> Complete
                              </DropdownMenuItem>
                              {isActive ? (
                                <DropdownMenuItem onClick={() => handleTaskAction(task.id, "pause")}>
                                  <Pause className="size-3.5" /> Pause
                                </DropdownMenuItem>
                              ) : (
                                <DropdownMenuItem onClick={() => handleTaskAction(task.id, "start")}>
                                  <Play className="size-3.5" /> Start
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuItem asChild>
                                <Link href={`/timer/${task.id}`}><Timer className="size-3.5" /> Open Timer</Link>
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => setViewingTask(task)}>
                                <Eye className="size-3.5" /> View Details
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => setEditingTask(task)}>
                                <Edit2 className="size-3.5" /> Edit
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem destructive onClick={() => handleTaskAction(task.id, "delete")}>
                                <Trash2 className="size-3.5" /> Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      );
                    })}
                    {activeTasks.length > 4 && (
                      <Link
                        href={`/goals/${goal.id}`}
                        className="flex items-center justify-center gap-1 rounded-lg border border-dashed border-border/60 px-3 py-1.5 text-[11px] text-muted-foreground hover:text-foreground hover:border-border transition-colors"
                      >
                        +{activeTasks.length - 4} more tasks — view full page
                      </Link>
                    )}
                    {completedTasks.slice(0, 3).map((task) => (
                      <div
                        key={task.id}
                        className="flex items-center gap-2 rounded-lg px-3 py-1.5 bg-muted/30"
                      >
                        <CheckCircle2 className="size-3.5 text-emerald-500 shrink-0" />
                        <span className="text-xs line-through text-muted-foreground flex-1 truncate">
                          {task.title}
                        </span>
                        {task.efficiencyScore !== undefined && (() => {
                          const acc = (task.estimatedDuration && task.estimatedDuration > 0 && task.actualDuration && task.actualDuration > 0)
                            ? Math.min(100, Math.round((Math.min(task.estimatedDuration, task.actualDuration) / Math.max(task.estimatedDuration, task.actualDuration)) * 100))
                            : null
                          return acc != null ? (
                            <span
                              className={cn(
                                "text-[10px] font-medium shrink-0",
                                acc >= 90
                                  ? "text-emerald-600"
                                  : acc >= 70
                                    ? "text-amber-600"
                                    : "text-rose-500",
                              )}
                            >
                              {acc}%
                            </span>
                          ) : null
                        })()}
                      </div>
                    ))}
                    {completedTasks.length > 3 && (
                      <Link
                        href={`/goals/${goal.id}`}
                        className="flex items-center justify-center gap-1 rounded-lg border border-dashed border-border/60 px-3 py-1.5 text-[11px] text-muted-foreground hover:text-foreground hover:border-border transition-colors"
                      >
                        +{completedTasks.length - 3} more completed - view full page
                      </Link>
                    )}
                  </div>
                )}
              </div>

              {/* Action row */}
              <div className="flex items-center justify-between gap-2 pt-1 border-t border-border/40">
                <div className="flex items-center gap-1.5 flex-wrap">
                  {!isTerminal && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-xs gap-1.5"
                      onClick={() => onEdit(goal)}
                    >
                      <Edit2 className="size-3" /> Edit
                    </Button>
                  )}
                  {canAddChild && !isTerminal && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-xs gap-1.5"
                      onClick={() => onAddChild(goal)}
                    >
                      <Plus className="size-3" /> Sub-goal
                    </Button>
                  )}
                  {goal.status === "ACTIVE" && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-xs gap-1.5"
                      onClick={() => handleStatusChange("PAUSED")}
                      disabled={actionLoading}
                    >
                      <Pause className="size-3" /> Pause
                    </Button>
                  )}
                  {goal.status === "PAUSED" && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-xs gap-1.5 border-violet-500/40 text-violet-600 dark:text-violet-400"
                      onClick={() => handleStatusChange("ACTIVE")}
                      disabled={actionLoading}
                    >
                      <Play className="size-3" /> Resume
                    </Button>
                  )}
                  {goal.isReadyToComplete && !isTerminal && (
                    <Button
                      size="sm"
                      className="h-7 text-xs gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white"
                      onClick={() =>
                        setConfirm({
                          type: "complete",
                          label: "Mark Complete",
                          description: `Mark "${goal.title}" as completed?`,
                        })
                      }
                      disabled={actionLoading}
                    >
                      <CheckCircle2 className="size-3" /> Complete
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {confirm && (
        <ConfirmDialog
          open
          title={
            confirm.type === "delete"
              ? "Delete Goal"
              : confirm.type === "abandon"
                ? "Abandon Goal"
                : "Complete Goal"
          }
          description={confirm.description}
          confirmLabel={confirm.label}
          destructive={confirm.type === "delete" || confirm.type === "abandon"}
          loading={actionLoading}
          onConfirm={handleConfirm}
          onClose={() => !actionLoading && setConfirm(null)}
        />
      )}
      <EditTaskDialog
        open={!!editingTask}
        task={editingTask}
        onClose={() => setEditingTask(null)}
        onUpdated={(updated: Task) => {
          setTasks((prev: Task[]) => prev.map(t => t.id === updated.id ? updated : t));
          setEditingTask(null);
        }}
      />
      <TaskDetailDialog
        open={!!viewingTask}
        task={viewingTask}
        onClose={() => setViewingTask(null)}
      />
    </div>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function GoalsSkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="rounded-2xl border border-border/70 p-4 space-y-3"
        >
          <div className="flex items-start gap-3">
            <Skeleton className="size-[54px] rounded-full shrink-0" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-3/5" />
              <div className="flex gap-2">
                <Skeleton className="h-4 w-14 rounded-full" />
                <Skeleton className="h-4 w-12 rounded-full" />
                <Skeleton className="h-4 w-16 rounded-full" />
              </div>
              <Skeleton className="h-1.5 w-full rounded-full" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Goals Page ───────────────────────────────────────────────────────────────

export default function GoalsPage() {
  const {
    goals, loading, error, pagination,
    counts, countsLoading,
    searchResults, searchPagination, searchLoading, searchError,
    fetchGoals, loadMoreGoals, fetchGoalCounts,
    searchGoals, loadMoreSearch, clearSearch,
  } = useGoalsStore();
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [categoryFilter, setCategoryFilter] = useState<string>("ALL");
  const [loadingMore, setLoadingMore] = useState(false);
  const [searchInput, setSearchInput] = useState("");
  const isSearchMode = searchInput.trim().length > 0;
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [defaultParentId, setDefaultParentId] = useState<string | null>(null);

  // Fetch counts once on mount (for stat tiles + filter tab badges)
  useEffect(() => {
    fetchGoalCounts();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Server-side fetch whenever filters change — reset to page 1
  useEffect(() => {
    if (isSearchMode) return; // search mode handles its own fetches
    fetchGoals({
      ...(statusFilter !== "ALL" ? { status: statusFilter as GoalStatus } : {}),
      ...(categoryFilter !== "ALL" ? { category: categoryFilter as GoalCategory } : {}),
      page: 1,
      limit: PAGE_SIZE,
    });
  }, [statusFilter, categoryFilter]); // eslint-disable-line react-hooks/exhaustive-deps

  // Debounced search
  const handleSearchChange = (value: string) => {
    setSearchInput(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!value.trim()) {
      clearSearch();
      return;
    }
    debounceRef.current = setTimeout(() => {
      searchGoals(value.trim(), { page: 1, limit: PAGE_SIZE });
    }, 350);
  };

  const handleClearSearch = () => {
    setSearchInput("");
    clearSearch();
  };

  const handleLoadMore = async () => {
    if (isSearchMode) {
      if (!searchPagination || searchPagination.page >= searchPagination.totalPages) return;
      setLoadingMore(true);
      await loadMoreSearch(searchInput.trim(), { page: searchPagination.page + 1, limit: PAGE_SIZE });
      setLoadingMore(false);
    } else {
      if (!pagination || pagination.page >= pagination.totalPages) return;
      setLoadingMore(true);
      await loadMoreGoals({
        ...(statusFilter !== "ALL" ? { status: statusFilter as GoalStatus } : {}),
        ...(categoryFilter !== "ALL" ? { category: categoryFilter as GoalCategory } : {}),
        page: pagination.page + 1,
        limit: PAGE_SIZE,
      });
      setLoadingMore(false);
    }
  };

  const sourceGoals = isSearchMode ? searchResults : goals;
  const pagedGoals = sourceGoals;
  const activePagination = isSearchMode ? searchPagination : pagination;
  const hasMore = activePagination ? activePagination.page < activePagination.totalPages : false;
  const totalGoals = activePagination?.total ?? pagedGoals.length;
  const loadedCount = pagedGoals.length;

  // Use store counts (from fetchGoalCounts) for stat tiles and filter badges
  const displayCounts = counts ?? { ALL: 0, ACTIVE: 0, PAUSED: 0, COMPLETED: 0, ABANDONED: 0, MISSED: 0 };

  const openCreate = useCallback(() => {
    setEditingGoal(null);
    setDefaultParentId(null);
    setFormOpen(true);
  }, []);

  const openEdit = useCallback((goal: Goal) => {
    setEditingGoal(goal);
    setDefaultParentId(null);
    setFormOpen(true);
  }, []);

  const openAddChild = useCallback((parent: Goal) => {
    setEditingGoal(null);
    setDefaultParentId(parent.id);
    setFormOpen(true);
  }, []);

  const closeForm = useCallback(() => {
    setFormOpen(false);
    setEditingGoal(null);
    setDefaultParentId(null);
  }, []);

  return (
    <div className="relative min-h-screen overflow-x-clip bg-background">
      {/* Background blobs */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-24 left-1/2 h-[480px] w-[600px] -translate-x-1/2 rounded-full opacity-25 blur-3xl"
        style={{ background: "radial-gradient(circle, oklch(0.6 0.25 280) 0%, transparent 65%)" }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute right-[-8rem] top-[30%] h-80 w-80 rounded-full opacity-20 blur-3xl"
        style={{ background: "radial-gradient(circle, oklch(0.65 0.22 320) 0%, transparent 65%)" }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute bottom-0 left-[-4rem] h-[350px] w-[350px] rounded-full opacity-15 blur-3xl"
        style={{ background: "radial-gradient(circle, oklch(0.7 0.18 240) 0%, transparent 65%)" }}
      />

      {/* Content */}
      <div className="relative mx-auto max-w-7xl space-y-6 px-4 py-6 sm:space-y-8 sm:px-6 sm:py-8 lg:px-8">
        {/* Hero card — floating, matches dashboard style */}
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
                <Trophy className="size-5 text-violet-600 dark:text-violet-400" />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-foreground leading-none">
                  Goals
                </h1>
                <p className="mt-1.5 text-sm text-muted-foreground">
                  Track everything that matters — nested, prioritized, and
                  clear.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Button
                variant="ghost"
                size="icon"
                className="size-9 text-muted-foreground hover:text-foreground"
                onClick={() => { fetchGoalCounts(); fetchGoals({ ...(statusFilter !== "ALL" ? { status: statusFilter as GoalStatus } : {}), ...(categoryFilter !== "ALL" ? { category: categoryFilter as GoalCategory } : {}), page: 1, limit: PAGE_SIZE }); }}
                title="Refresh"
              >
                <RefreshCw className="size-4" />
              </Button>
              <Button
                onClick={openCreate}
                className="gap-1.5 bg-zinc-800 text-zinc-100 hover:bg-zinc-700 border border-zinc-700/50 shrink-0"
              >
                <Plus className="size-4" /> New Goal
              </Button>
            </div>
          </div>
        </div>

        {/* Stat cards — same pattern as dashboard */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5 lg:gap-4">
          {[
            {
              label: "Total Goals",
              value: displayCounts.ALL,
              sub:
                displayCounts.ALL === 0 ? "No goals yet" : `${displayCounts.ACTIVE} active`,
              iconBg: "bg-slate-500/10 text-slate-600 dark:text-slate-400",
              Icon: Target,
            },
            {
              label: "Active",
              value: displayCounts.ACTIVE,
              sub: displayCounts.ACTIVE > 0 ? "In progress" : "Nothing active",
              iconBg: "bg-violet-500/10 text-violet-600 dark:text-violet-400",
              Icon: Play,
            },
            {
              label: "Completed",
              value: displayCounts.COMPLETED,
              sub: displayCounts.COMPLETED > 0 ? "Goals achieved" : "None yet",
              iconBg:
                "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
              Icon: CheckCircle2,
            },
            {
              label: "Paused",
              value: displayCounts.PAUSED,
              sub: displayCounts.PAUSED > 0 ? "On hold" : "None paused",
              iconBg: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
              Icon: Pause,
            },
            {
              label: "Missed",
              value: displayCounts.MISSED,
              sub: displayCounts.MISSED > 0 ? "Need recovery" : "No missed goals",
              iconBg: "bg-rose-500/10 text-rose-600 dark:text-rose-400",
              Icon: AlertTriangle,
            },
          ].map((s) => (
            <Card
              key={s.label}
              className="hover:shadow-md transition-all duration-200 hover:-translate-y-0.5"
            >
              <CardContent className="p-5">
                {countsLoading ? (
                  <div className="space-y-2">
                    <Skeleton className="h-3.5 w-28" />
                    <Skeleton className="h-9 w-16" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                ) : (
                  <div className="flex items-start justify-between">
                    <div className="min-w-0">
                      <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-widest mb-2">
                        {s.label}
                      </p>
                      <p className="text-3xl font-bold text-foreground leading-none mb-1.5 tabular-nums">
                        {s.value}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {s.sub}
                      </p>
                    </div>
                    <div
                      className={cn("p-2.5 rounded-xl shrink-0 ml-3", s.iconBg)}
                    >
                      <s.Icon className="h-5 w-5" />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
        {/* Filter bar */}
        <div className="flex flex-col gap-2 rounded-2xl border border-border/60 bg-card/70 px-3 py-2.5 backdrop-blur-sm sm:flex-row sm:items-center sm:py-2">

          {/* Search + Category — top row on mobile, right side on desktop */}
          <div className="flex items-center gap-2 sm:order-last sm:shrink-0">
            {/* Search */}
            <div className="relative flex items-center flex-1 sm:flex-none">
              <Search className="absolute left-2.5 size-3.5 text-muted-foreground pointer-events-none shrink-0" />
              <input
                type="text"
                value={searchInput}
                onChange={(e) => handleSearchChange(e.target.value)}
                placeholder="Search…"
                className={cn(
                  "h-8 w-full rounded-lg border bg-transparent pl-8 pr-7 text-xs outline-none transition-all sm:w-[140px] sm:focus:w-[200px]",
                  isSearchMode
                    ? "border-violet-500/50 text-foreground"
                    : "border-border/60 text-muted-foreground focus:border-violet-500/40 focus:text-foreground",
                  "placeholder:text-muted-foreground/60",
                )}
              />
              {searchInput && (
                <button
                  onClick={handleClearSearch}
                  className="absolute right-2 flex size-4 items-center justify-center rounded-full bg-muted/70 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                  aria-label="Clear search"
                >
                  <X className="size-2.5" />
                </button>
              )}
            </div>

            {/* Divider */}
            <div className="h-5 w-px bg-border/60 shrink-0" />

            {/* Category dropdown */}
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger
                className={cn(
                  "h-8 gap-1.5 border text-xs font-medium transition-all shrink-0 focus:ring-0 w-[120px] sm:w-[130px]",
                  categoryFilter === "ALL"
                    ? "border-border/60 bg-transparent text-muted-foreground"
                    : "border-violet-500/50 bg-violet-500/10 text-violet-700 dark:text-violet-300",
                )}
              >
                {categoryFilter !== "ALL" && (
                  <span className="size-1.5 rounded-full bg-violet-500 shrink-0" />
                )}
                <SelectValue />
              </SelectTrigger>
              <SelectContent align="end">
                <SelectItem value="ALL">All categories</SelectItem>
                <SelectSeparator />
                {GOAL_CATEGORIES.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {categoryConfig[cat].label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Divider — desktop only, between status pills and right controls */}
          <div className="hidden sm:block h-5 w-px bg-border/60 shrink-0 sm:order-2" />

          {/* Status pills — bottom row on mobile, left side on desktop */}
          <div className="scrollbar-none flex items-center gap-1 flex-1 overflow-x-auto min-w-0 sm:order-first">
            {(
              [
                {
                  key: "ALL",
                  label: "All",
                  dot: "bg-slate-400",
                  activeBg: "bg-slate-100 dark:bg-slate-800",
                  activeText: "text-slate-800 dark:text-slate-100",
                  activeBorder: "border-slate-400/60",
                },
                {
                  key: "ACTIVE",
                  label: "Active",
                  dot: "bg-violet-500",
                  activeBg: "bg-violet-500/12",
                  activeText: "text-violet-700 dark:text-violet-300",
                  activeBorder: "border-violet-500/50",
                },
                {
                  key: "PAUSED",
                  label: "Paused",
                  dot: "bg-amber-400",
                  activeBg: "bg-amber-400/12",
                  activeText: "text-amber-700 dark:text-amber-300",
                  activeBorder: "border-amber-400/50",
                },
                {
                  key: "COMPLETED",
                  label: "Completed",
                  dot: "bg-emerald-500",
                  activeBg: "bg-emerald-500/12",
                  activeText: "text-emerald-700 dark:text-emerald-300",
                  activeBorder: "border-emerald-500/50",
                },
                {
                  key: "ABANDONED",
                  label: "Abandoned",
                  dot: "bg-rose-400",
                  activeBg: "bg-rose-400/12",
                  activeText: "text-rose-700 dark:text-rose-300",
                  activeBorder: "border-rose-400/50",
                },
                {
                  key: "MISSED",
                  label: "Missed",
                  dot: "bg-red-500",
                  activeBg: "bg-red-500/12",
                  activeText: "text-red-700 dark:text-red-300",
                  activeBorder: "border-red-500/50",
                },
              ] as const
            ).map((s) => {
              const isActive = statusFilter === s.key;
              return (
                <button
                  key={s.key}
                  onClick={() => setStatusFilter(s.key)}
                  className={cn(
                    "flex items-center gap-1.5 h-7 pl-2.5 pr-3 rounded-lg border text-xs font-medium transition-all shrink-0",
                    isActive
                      ? cn(s.activeBg, s.activeText, s.activeBorder)
                      : "border-transparent bg-transparent text-muted-foreground hover:bg-muted/60 hover:text-foreground",
                  )}
                >
                  <span
                    className={cn(
                      "size-1.5 rounded-full shrink-0",
                      s.dot,
                      !isActive && "opacity-50",
                    )}
                  />
                  {s.label}
                  <span
                    className={cn(
                      "ml-0.5 rounded-full px-1.5 py-px text-[10px] leading-none font-normal tabular-nums",
                      isActive
                        ? "bg-black/10 dark:bg-white/15"
                        : "bg-muted text-muted-foreground",
                    )}
                  >
                    {displayCounts[s.key]}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Goal list */}
        {(isSearchMode ? searchLoading : loading) ? (
          <GoalsSkeleton />
        ) : (isSearchMode ? searchError : error) ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3 text-center rounded-2xl border border-border/60 bg-card/60">
            <AlertTriangle className="size-8 text-destructive/60" />
            <p className="font-semibold text-sm">
              {isSearchMode ? "Search failed" : "Failed to load goals"}
            </p>
            <p className="text-xs text-muted-foreground">
              {(isSearchMode ? searchError : error) ?? ""}
            </p>
            {!isSearchMode && (
              <Button variant="outline" size="sm" onClick={() => fetchGoals({ page: 1, limit: PAGE_SIZE })}>
                Try Again
              </Button>
            )}
          </div>
        ) : isSearchMode && searchResults.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3 text-center rounded-2xl border border-border/60 bg-card/60">
            <div className="flex size-14 items-center justify-center rounded-2xl border border-border/60 bg-muted/40">
              <Search className="size-6 text-muted-foreground" />
            </div>
            <div>
              <p className="font-semibold text-base">No results for &ldquo;{searchInput.trim()}&rdquo;</p>
              <p className="text-sm text-muted-foreground mt-1">Try a different keyword or clear the search.</p>
            </div>
          </div>
        ) : pagedGoals.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4 text-center rounded-2xl border border-border/60 bg-card/60">
            <div className="flex size-16 items-center justify-center rounded-2xl border border-border/60 bg-muted/40">
              <Sparkles className="size-7 text-muted-foreground" />
            </div>
            <div>
              <p className="font-semibold text-base">
                {displayCounts.ALL === 0
                  ? "No goals yet"
                  : "No goals match your filters"}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                {displayCounts.ALL === 0
                  ? "Set your first goal and start building momentum."
                  : "Try adjusting your filters to see more goals."}
              </p>
            </div>
            {displayCounts.ALL === 0 && (
              <Button
                variant="outline"
                onClick={openCreate}
                className="gap-1.5"
              >
                <Plus className="size-4" />
                Create First Goal
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {isSearchMode && (
              <p className="text-xs text-muted-foreground px-0.5">
                {totalGoals} result{totalGoals !== 1 ? "s" : ""} for &ldquo;{searchInput.trim()}&rdquo;
              </p>
            )}
            {pagedGoals.map((goal) => (
              <GoalCard
                key={goal.id}
                goal={goal}
                depth={0}
                onEdit={openEdit}
                onAddChild={openAddChild}
              />
            ))}
          </div>
        )}

        {/* ── Load More ── */}
        {!(isSearchMode ? searchLoading : loading) && !(isSearchMode ? searchError : error) && hasMore && (
          <div className="flex flex-col items-center gap-2 pt-1">
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
                  <span className="size-4 rounded-full border-2 border-violet-500/30 border-t-violet-500 animate-spin" />
                  Loading…
                </>
              ) : (
                <>
                  <span className="text-muted-foreground group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors">
                    Load {Math.min(PAGE_SIZE, totalGoals - loadedCount)} more
                  </span>
                  <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] text-muted-foreground tabular-nums">
                    {totalGoals - loadedCount} remaining
                  </span>
                </>
              )}
            </button>
          </div>
        )}

        {/* All loaded indicator */}
        {!(isSearchMode ? searchLoading : loading) && !(isSearchMode ? searchError : error) && !hasMore && totalGoals > PAGE_SIZE && (
          <p className="text-center text-[11px] text-muted-foreground tabular-nums pt-1">
            All {totalGoals} {isSearchMode ? "results" : "goals"} shown
          </p>
        )}
      </div>

      {/* Modal */}
      <GoalFormModal
        open={formOpen}
        onClose={closeForm}
        editingGoal={editingGoal}
        defaultParentId={defaultParentId}
        allGoals={goals}
      />
    </div>
  );
}
