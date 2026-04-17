"use client"

import { useEffect, useState, useCallback, useMemo } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import Link from "next/link"
import {
  Trophy,
  Plus,
  ChevronDown,
  ChevronRight,
  MoreHorizontal,
  Calendar,
  Clock,
  Edit2,
  Trash2,
  CheckCircle2,
  Target,
  Pause,
  Play,
  AlertTriangle,
  FolderTree,
  Filter,
  X,
  Sparkles,
} from "lucide-react"
import type {
  Goal,
  GoalStatus,
  GoalCategory,
  GoalPriority,
  CreateGoalDto,
} from "@/types"
import { useGoalsStore } from "@/store/goals-store"
import { toast } from "@/components/ui/toast"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SelectSeparator,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"
import { GoalProgressRing } from "@/components/goals/GoalProgressRing"

// ─── Constants ────────────────────────────────────────────────────────────────

const GOAL_CATEGORIES: GoalCategory[] = [
  "CAREER",
  "LEARNING",
  "HEALTH",
  "PERSONAL",
  "FINANCIAL",
  "OTHER",
]
const GOAL_PRIORITIES: GoalPriority[] = ["HIGH", "MEDIUM", "LOW"]
const STATUS_TABS = ["ALL", "ACTIVE", "PAUSED", "COMPLETED", "ABANDONED"] as const
const MAX_DEPTH = 2

// ─── Zod Schema ───────────────────────────────────────────────────────────────

const goalFormSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  category: z.enum(["CAREER", "LEARNING", "HEALTH", "PERSONAL", "FINANCIAL", "OTHER"]),
  priority: z.enum(["HIGH", "MEDIUM", "LOW"]),
  deadline: z.string().optional(),
  estimatedHours: z.number().min(0).optional(),
  parentGoalId: z.string().optional(),
})

type GoalFormValues = z.infer<typeof goalFormSchema>

// ─── Helpers ─────────────────────────────────────────────────────────────────

const categoryConfig: Record<
  GoalCategory,
  { label: string; className: string }
> = {
  CAREER: {
    label: "Career",
    className: "bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border border-indigo-500/20",
  },
  LEARNING: {
    label: "Learning",
    className: "bg-violet-500/10 text-violet-700 dark:text-violet-300 border border-violet-500/20",
  },
  HEALTH: {
    label: "Health",
    className: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20",
  },
  PERSONAL: {
    label: "Personal",
    className: "bg-pink-500/10 text-pink-700 dark:text-pink-300 border border-pink-500/20",
  },
  FINANCIAL: {
    label: "Financial",
    className: "bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20",
  },
  OTHER: {
    label: "Other",
    className: "bg-muted text-muted-foreground border border-border/60",
  },
}

const priorityConfig: Record<
  GoalPriority,
  { label: string; dot: string }
> = {
  HIGH: { label: "High", dot: "bg-red-500" },
  MEDIUM: { label: "Medium", dot: "bg-amber-500" },
  LOW: { label: "Low", dot: "bg-slate-400" },
}

const statusConfig: Record<
  GoalStatus,
  { label: string; variant: "success" | "warning" | "secondary" | "destructive" }
> = {
  ACTIVE: { label: "Active", variant: "success" },
  PAUSED: { label: "Paused", variant: "warning" },
  COMPLETED: { label: "Completed", variant: "secondary" },
  ABANDONED: { label: "Abandoned", variant: "destructive" },
}

function formatDeadline(deadline: string): { text: string; overdue: boolean } {
  const date = new Date(deadline + "T00:00:00")
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  const days = Math.ceil((date.getTime() - now.getTime()) / 86400000)
  const formatted = date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })
  if (days < 0) return { text: `${formatted} · overdue`, overdue: true }
  if (days === 0) return { text: `${formatted} · today`, overdue: false }
  if (days <= 7) return { text: `${formatted} · ${days}d left`, overdue: false }
  return { text: formatted, overdue: false }
}

function buildGoalTree(goal: Goal, allGoals: Goal[]): Goal {
  if (goal.children && goal.children.length > 0) {
    return { ...goal, children: goal.children.map((c) => buildGoalTree(c, allGoals)) }
  }
  const flatChildren = allGoals.filter((g) => g.parentGoalId === goal.id)
  return { ...goal, children: flatChildren.map((c) => buildGoalTree(c, allGoals)) }
}

// ─── Goal Form Modal ──────────────────────────────────────────────────────────

interface GoalFormModalProps {
  open: boolean
  onClose: () => void
  editingGoal?: Goal | null
  defaultParentId?: string | null
  allGoals: Goal[]
}

function GoalFormModal({
  open,
  onClose,
  editingGoal,
  defaultParentId,
  allGoals,
}: GoalFormModalProps) {
  const { createGoal, updateGoal } = useGoalsStore()
  const [submitting, setSubmitting] = useState(false)

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
  })

  useEffect(() => {
    if (!open) return
    const parentId = defaultParentId ?? editingGoal?.parentGoalId ?? ""
    form.reset({
      title: editingGoal?.title ?? "",
      description: editingGoal?.description ?? "",
      category: editingGoal?.category ?? "CAREER",
      priority: editingGoal?.priority ?? "MEDIUM",
      deadline: editingGoal?.deadline ? editingGoal.deadline.split("T")[0] : "",
      estimatedHours: editingGoal?.estimatedHours ?? undefined,
      parentGoalId: parentId,
    })
  }, [open, editingGoal, defaultParentId]) // eslint-disable-line react-hooks/exhaustive-deps

  const potentialParents = useMemo(
    () => allGoals.filter((g) => !g.parentGoalId && g.id !== editingGoal?.id),
    [allGoals, editingGoal]
  )

  const onSubmit = async (data: GoalFormValues) => {
    setSubmitting(true)
    try {
      const cleaned: Partial<CreateGoalDto> = {
        title: data.title,
        description: data.description || undefined,
        category: data.category,
        priority: data.priority,
        deadline: data.deadline || undefined,
        estimatedHours: data.estimatedHours ?? undefined,
      }
      if (editingGoal) {
        await updateGoal(editingGoal.id, cleaned)
        toast.success("Goal updated")
      } else {
        await createGoal({
          ...(cleaned as CreateGoalDto),
          parentGoalId:
            data.parentGoalId && data.parentGoalId !== "none"
              ? data.parentGoalId
              : undefined,
        })
        toast.success("Goal created!")
      }
      onClose()
    } catch (err) {
      toast.error(
        editingGoal ? "Failed to update goal" : "Failed to create goal",
        err instanceof Error ? err.message : "Please try again."
      )
    } finally {
      setSubmitting(false)
    }
  }

  const lockedParent = defaultParentId
    ? allGoals.find((g) => g.id === defaultParentId)
    : null

  return (
    <Dialog open={open} onOpenChange={(v) => !v && !submitting && onClose()}>
      <DialogContent className="max-w-lg max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="flex size-7 items-center justify-center rounded-full bg-violet-500/15">
              <Target className="size-4 text-violet-600 dark:text-violet-400" />
            </div>
            {editingGoal
              ? "Edit Goal"
              : lockedParent
              ? `Sub-goal under "${lockedParent.title}"`
              : "New Goal"}
          </DialogTitle>
          <DialogDescription>
            {editingGoal
              ? "Update the details of this goal."
              : "Define your goal clearly to stay on track."}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-1">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Title <span className="text-destructive">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Get promoted this year" {...field} />
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
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Why does this goal matter to you?"
                      rows={3}
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Category <span className="text-destructive">*</span>
                    </FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
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
                    <FormLabel>
                      Priority <span className="text-destructive">*</span>
                    </FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
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

            <div className="grid grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="deadline"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Deadline</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
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
                    <FormLabel>Est. Hours</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={0}
                        step={0.5}
                        placeholder="e.g. 40"
                        value={field.value ?? ""}
                        onChange={(e) =>
                          field.onChange(
                            e.target.value === "" ? undefined : parseFloat(e.target.value)
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
                  <FormItem>
                    <FormLabel>Parent Goal</FormLabel>
                    {lockedParent ? (
                      <div className="flex items-center gap-2 rounded-lg border bg-muted/50 px-3 py-2 text-sm">
                        <FolderTree className="size-3.5 text-muted-foreground" />
                        <span className="font-medium">{lockedParent.title}</span>
                        <span className="text-muted-foreground">(locked)</span>
                      </div>
                    ) : (
                      <Select
                        onValueChange={field.onChange}
                        value={field.value || "none"}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="None (top-level)" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="none">None — top-level</SelectItem>
                          {potentialParents.map((g) => (
                            <SelectItem key={g.id} value={g.id}>
                              {g.title}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <DialogFooter className="pt-2 gap-2 sm:gap-0">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={submitting}>
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
  )
}

// ─── Confirm Dialog ───────────────────────────────────────────────────────────

interface ConfirmDialogProps {
  open: boolean
  title: string
  description: string
  confirmLabel?: string
  destructive?: boolean
  loading?: boolean
  onConfirm: () => void
  onClose: () => void
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
                destructive ? "text-destructive" : "text-amber-500"
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
  )
}

// ─── Goal Card ────────────────────────────────────────────────────────────────

interface GoalCardProps {
  goal: Goal
  depth: number
  allGoals: Goal[]
  onEdit: (goal: Goal) => void
  onAddChild: (parent: Goal) => void
}

function GoalCard({ goal, depth, allGoals, onEdit, onAddChild }: GoalCardProps) {
  const { updateGoal, deleteGoal } = useGoalsStore()
  const [collapsed, setCollapsed] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)
  const [confirm, setConfirm] = useState<{
    type: "delete" | "abandon" | "complete"
    label: string
    description: string
  } | null>(null)

  const hasChildren = Boolean(goal.children?.length)
  const childCount = goal.children?.length ?? 0
  const canAddChild = depth < MAX_DEPTH
  const isTerminal = goal.status === "COMPLETED" || goal.status === "ABANDONED"
  const deadline = goal.deadline ? formatDeadline(goal.deadline) : null
  const cat = categoryConfig[goal.category]
  const pri = priorityConfig[goal.priority]
  const sts = statusConfig[goal.status]
  const score = goal.progress?.score ?? 0

  const handleStatusChange = async (status: GoalStatus) => {
    setActionLoading(true)
    try {
      await updateGoal(goal.id, { status })
      toast.success(
        status === "ACTIVE" ? "Goal resumed" :
        status === "PAUSED" ? "Goal paused" :
        status === "COMPLETED" ? "🎉 Goal completed!" :
        "Goal abandoned"
      )
    } catch (err) {
      toast.error("Failed to update status", err instanceof Error ? err.message : undefined)
    } finally {
      setActionLoading(false)
      setConfirm(null)
    }
  }

  const handleDelete = async () => {
    setActionLoading(true)
    try {
      await deleteGoal(goal.id)
      toast.success("Goal deleted")
      setConfirm(null)
    } catch (err) {
      toast.error("Failed to delete goal", err instanceof Error ? err.message : undefined)
    } finally {
      setActionLoading(false)
    }
  }

  const handleConfirm = async () => {
    if (!confirm) return
    if (confirm.type === "delete") await handleDelete()
    else if (confirm.type === "abandon") await handleStatusChange("ABANDONED")
    else if (confirm.type === "complete") await handleStatusChange("COMPLETED")
  }

  return (
    <div className={cn("relative", depth > 0 && "ml-6")}>
      {/* Vertical connector */}
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
          "rounded-2xl border border-border/70 bg-card/80 backdrop-blur-sm transition-all duration-200 hover:shadow-md hover:border-border",
          isTerminal && "opacity-55 saturate-50"
        )}
      >
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            {/* Progress ring */}
            {goal.progress !== undefined && (
              <GoalProgressRing
                percent={score}
                size={54}
                strokeWidth={5}
                className="mt-0.5 shrink-0"
              />
            )}

            <div className="flex-1 min-w-0">
              {/* Title row */}
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    {hasChildren && (
                      <button
                        onClick={() => setCollapsed((c) => !c)}
                        className="shrink-0 rounded p-0.5 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                      >
                        {collapsed ? (
                          <ChevronRight className="size-3.5" />
                        ) : (
                          <ChevronDown className="size-3.5" />
                        )}
                      </button>
                    )}
                    <Link
                      href={`/goals/${goal.id}`}
                      className="font-semibold text-sm leading-snug hover:text-violet-600 dark:hover:text-violet-400 hover:underline underline-offset-2 transition-colors truncate"
                    >
                      {goal.title}
                    </Link>
                  </div>

                  {/* Badges */}
                  <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                    <Badge variant={sts.variant} className="text-[10px] px-1.5 py-0">
                      {sts.label}
                    </Badge>

                    {/* Priority dot + label */}
                    <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground">
                      <span className={cn("size-1.5 rounded-full", pri.dot)} />
                      {pri.label}
                    </span>

                    {/* Category */}
                    <span
                      className={cn(
                        "inline-flex items-center rounded-full px-1.5 py-0 text-[10px] font-medium",
                        cat.className
                      )}
                    >
                      {cat.label}
                    </span>

                    {hasChildren && (
                      <span className="text-[10px] text-muted-foreground">
                        {childCount} sub-goal{childCount !== 1 ? "s" : ""}
                      </span>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-7 shrink-0 opacity-50 hover:opacity-100 transition-opacity"
                      disabled={actionLoading}
                    >
                      <MoreHorizontal className="size-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuLabel className="text-xs">Actions</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => onEdit(goal)}>
                      <Edit2 className="size-3.5" />
                      Edit Goal
                    </DropdownMenuItem>
                    {canAddChild && !isTerminal && (
                      <DropdownMenuItem onClick={() => onAddChild(goal)}>
                        <FolderTree className="size-3.5" />
                        Add Sub-goal
                      </DropdownMenuItem>
                    )}
                    {!isTerminal && (
                      <>
                        <DropdownMenuSeparator />
                        {goal.status === "ACTIVE" && (
                          <DropdownMenuItem onClick={() => handleStatusChange("PAUSED")}>
                            <Pause className="size-3.5" />
                            Pause
                          </DropdownMenuItem>
                        )}
                        {goal.status === "PAUSED" && (
                          <DropdownMenuItem onClick={() => handleStatusChange("ACTIVE")}>
                            <Play className="size-3.5" />
                            Resume
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
                            <CheckCircle2 className="size-3.5" />
                            Complete
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem
                          destructive
                          onClick={() =>
                            setConfirm({
                              type: "abandon",
                              label: "Abandon",
                              description: `Abandon "${goal.title}"? This marks it as abandoned.`,
                            })
                          }
                        >
                          <X className="size-3.5" />
                          Abandon
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
                          description: `Permanently delete "${goal.title}"? This cannot be undone.`,
                        })
                      }
                    >
                      <Trash2 className="size-3.5" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {/* Progress bar */}
              {goal.progress !== undefined && (
                <div className="mt-2">
                  <Progress
                    value={score}
                    className={cn(
                      "h-1.5",
                      score >= 100 && "[&>div]:bg-emerald-500",
                      score >= 50 && score < 100 && "[&>div]:bg-violet-500",
                      score < 50 && "[&>div]:bg-indigo-400"
                    )}
                  />
                </div>
              )}

              {/* Meta */}
              {(deadline || goal.estimatedHours) && (
                <div className="mt-2 flex flex-wrap gap-3 text-xs text-muted-foreground">
                  {deadline && (
                    <span
                      className={cn(
                        "flex items-center gap-1",
                        deadline.overdue && "text-destructive font-medium"
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
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Children */}
      {hasChildren && !collapsed && (
        <div className="mt-2 space-y-2 relative">
          {goal.children!.map((child) => (
            <GoalCard
              key={child.id}
              goal={child}
              depth={depth + 1}
              allGoals={allGoals}
              onEdit={onEdit}
              onAddChild={onAddChild}
            />
          ))}
        </div>
      )}

      {confirm && (
        <ConfirmDialog
          open
          title={
            confirm.type === "delete" ? "Delete Goal" :
            confirm.type === "abandon" ? "Abandon Goal" : "Complete Goal"
          }
          description={confirm.description}
          confirmLabel={confirm.label}
          destructive={confirm.type === "delete" || confirm.type === "abandon"}
          loading={actionLoading}
          onConfirm={handleConfirm}
          onClose={() => !actionLoading && setConfirm(null)}
        />
      )}
    </div>
  )
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function GoalsSkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3].map((i) => (
        <div key={i} className="rounded-2xl border border-border/70 p-4 space-y-3">
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
  )
}

// ─── Goals Page ───────────────────────────────────────────────────────────────

export default function GoalsPage() {
  const { goals, loading, error, fetchGoals } = useGoalsStore()
  const [statusFilter, setStatusFilter] = useState<string>("ALL")
  const [categoryFilter, setCategoryFilter] = useState<string>("ALL")
  const [formOpen, setFormOpen] = useState(false)
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null)
  const [defaultParentId, setDefaultParentId] = useState<string | null>(null)

  useEffect(() => {
    fetchGoals()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const topLevelGoals = useMemo(() => {
    const top = goals.filter((g) => !g.parentGoalId)
    return top.map((g) => buildGoalTree(g, goals))
  }, [goals])

  const filteredGoals = useMemo(() => {
    return topLevelGoals.filter((g) => {
      if (statusFilter !== "ALL" && g.status !== statusFilter) return false
      if (categoryFilter !== "ALL" && g.category !== categoryFilter) return false
      return true
    })
  }, [topLevelGoals, statusFilter, categoryFilter])

  const counts = useMemo(() => {
    const base = goals.filter((g) => !g.parentGoalId)
    return {
      ALL: base.length,
      ACTIVE: base.filter((g) => g.status === "ACTIVE").length,
      PAUSED: base.filter((g) => g.status === "PAUSED").length,
      COMPLETED: base.filter((g) => g.status === "COMPLETED").length,
      ABANDONED: base.filter((g) => g.status === "ABANDONED").length,
    }
  }, [goals])

  const openCreate = useCallback(() => {
    setEditingGoal(null)
    setDefaultParentId(null)
    setFormOpen(true)
  }, [])

  const openEdit = useCallback((goal: Goal) => {
    setEditingGoal(goal)
    setDefaultParentId(null)
    setFormOpen(true)
  }, [])

  const openAddChild = useCallback((parent: Goal) => {
    setEditingGoal(null)
    setDefaultParentId(parent.id)
    setFormOpen(true)
  }, [])

  const closeForm = useCallback(() => {
    setFormOpen(false)
    setEditingGoal(null)
    setDefaultParentId(null)
  }, [])

  return (
    <div className="relative min-h-screen overflow-x-hidden">
      {/* Ambient blobs */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
      >
        <div
          className="absolute -top-32 left-1/4 h-[500px] w-[500px] rounded-full opacity-[0.06] blur-3xl dark:opacity-[0.10]"
          style={{ background: "radial-gradient(circle, oklch(0.6 0.25 280) 0%, transparent 65%)" }}
        />
        <div
          className="absolute bottom-0 right-0 h-[400px] w-[400px] rounded-full opacity-[0.05] blur-3xl dark:opacity-[0.08]"
          style={{ background: "radial-gradient(circle, oklch(0.65 0.22 320) 0%, transparent 65%)" }}
        />
      </div>

      {/* Hero */}
      <div className="relative border-b border-border/50 bg-background/80 backdrop-blur-sm">
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "linear-gradient(130deg, rgba(129,140,248,0.08) 0%, rgba(192,132,252,0.05) 50%, rgba(244,114,182,0.08) 100%)",
          }}
        />
        <div className="relative mx-auto max-w-4xl px-4 py-8 sm:px-6">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="flex size-12 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 via-violet-500 to-pink-500 shadow-md shadow-violet-500/20">
                <Trophy className="size-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-indigo-400 via-violet-400 to-pink-400 bg-clip-text text-transparent">
                  Goals
                </h1>
                <p className="text-sm text-muted-foreground">
                  Track everything that matters — nested, prioritized, and clear.
                </p>
              </div>
            </div>

            <Button
              onClick={openCreate}
              className="gap-1.5 bg-gradient-to-r from-indigo-500 via-violet-500 to-pink-500 text-white border-0 shadow-md shadow-violet-500/25 hover:shadow-lg hover:shadow-violet-500/30 transition-all"
            >
              <Plus className="size-4" />
              <span className="hidden sm:inline">New Goal</span>
              <span className="sm:hidden">New</span>
            </Button>
          </div>

          {/* Stats strip */}
          {!loading && goals.length > 0 && (
            <div className="mt-5 flex flex-wrap gap-3">
              {[
                { label: "Total", value: counts.ALL, color: "text-foreground" },
                { label: "Active", value: counts.ACTIVE, color: "text-violet-600 dark:text-violet-400" },
                { label: "Completed", value: counts.COMPLETED, color: "text-emerald-600 dark:text-emerald-400" },
                { label: "Paused", value: counts.PAUSED, color: "text-amber-600 dark:text-amber-400" },
              ].map((s) => (
                <div
                  key={s.label}
                  className="flex items-center gap-2 rounded-xl border border-border/60 bg-card/60 px-3 py-2"
                >
                  <span className={cn("text-lg font-bold tabular-nums", s.color)}>
                    {s.value}
                  </span>
                  <span className="text-xs text-muted-foreground">{s.label}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6 space-y-5">
        {/* Filter bar */}
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
          {/* Status tabs */}
          <Tabs value={statusFilter} onValueChange={setStatusFilter} className="flex-1">
            <TabsList className="h-8 p-0.5 gap-0.5 flex-wrap">
              {STATUS_TABS.map((s) => (
                <TabsTrigger
                  key={s}
                  value={s}
                  className="h-7 px-2.5 text-xs gap-1"
                >
                  {s === "ALL" ? "All" : s.charAt(0) + s.slice(1).toLowerCase()}
                  <span className="text-[10px] opacity-60 font-normal">
                    ({counts[s]})
                  </span>
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>

          {/* Category filter */}
          <div className="flex items-center gap-2 shrink-0">
            <Filter className="size-3.5 text-muted-foreground" />
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="h-8 w-[140px] text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All categories</SelectItem>
                <SelectSeparator />
                {GOAL_CATEGORIES.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {categoryConfig[cat].label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {categoryFilter !== "ALL" && (
              <Button
                variant="ghost"
                size="icon"
                className="size-7"
                onClick={() => setCategoryFilter("ALL")}
              >
                <X className="size-3.5" />
              </Button>
            )}
          </div>
        </div>

        {/* Goal list */}
        {loading ? (
          <GoalsSkeleton />
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
            <AlertTriangle className="size-8 text-destructive/60" />
            <p className="font-semibold text-sm">Failed to load goals</p>
            <p className="text-xs text-muted-foreground">{error}</p>
            <Button variant="outline" size="sm" onClick={() => fetchGoals()}>
              Try Again
            </Button>
          </div>
        ) : filteredGoals.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
            <div className="flex size-16 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500/10 via-violet-500/10 to-pink-500/10 border border-violet-500/20">
              <Sparkles className="size-7 text-violet-500" />
            </div>
            <div>
              <p className="font-semibold text-base">
                {goals.length === 0 ? "No goals yet" : "No goals match your filters"}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                {goals.length === 0
                  ? "Set your first goal and start building momentum."
                  : "Try adjusting your filters to see more goals."}
              </p>
            </div>
            {goals.length === 0 && (
              <Button
                onClick={openCreate}
                className="gap-1.5 bg-gradient-to-r from-indigo-500 via-violet-500 to-pink-500 text-white border-0"
              >
                <Plus className="size-4" />
                Create First Goal
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {filteredGoals.map((goal) => (
              <GoalCard
                key={goal.id}
                goal={goal}
                depth={0}
                allGoals={goals}
                onEdit={openEdit}
                onAddChild={openAddChild}
              />
            ))}
          </div>
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
  )
}
