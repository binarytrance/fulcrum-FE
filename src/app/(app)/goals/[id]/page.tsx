"use client"

import { useEffect, useState, useCallback } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import {
  ArrowLeft,
  Edit2,
  Eye,
  Trash2,
  CheckCircle2,
  Calendar,
  Clock,
  Target,
  AlertTriangle,
  Play,
  Pause,
  ChevronRight,
  FolderTree,
  MoreHorizontal,
  Timer,
  ExternalLink,
  Plus,
} from "lucide-react"
import type { Goal, Task, GoalStatus, GoalCategory, GoalPriority, TaskStatus } from "@/types"
import { getGoal, getSubgoals } from "@/lib/goals-api"
import { getPaginatedTasks, updateTask, deleteTask, completeTask } from "@/lib/tasks-api"
import { EditTaskDialog } from "@/components/tasks/EditTaskDialog"
import { TaskDetailDialog } from "@/components/tasks/TaskDetailDialog"
import { useGoalsStore } from "@/store/goals-store"
import { toast } from "@/components/ui/toast"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
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
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
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
const TASKS_PAGE_SIZE = 5
const SUBGOALS_PAGE_SIZE = 5
const TASK_STATUS_FILTERS: { key: "ALL" | TaskStatus; label: string }[] = [
  { key: "ALL", label: "All" },
  { key: "PENDING", label: "Pending" },
  { key: "IN_PROGRESS", label: "In Progress" },
  { key: "COMPLETED", label: "Completed" },
  { key: "CANCELLED", label: "Cancelled" },
]

const categoryLabels: Record<GoalCategory, string> = {
  CAREER: "Career",
  LEARNING: "Learning",
  HEALTH: "Health",
  PERSONAL: "Personal",
  FINANCIAL: "Financial",
  OTHER: "Other",
}

const categoryStyles: Record<GoalCategory, string> = {
  CAREER: "bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300",
  LEARNING: "bg-purple-100 text-purple-700 dark:bg-purple-950/50 dark:text-purple-300",
  HEALTH: "bg-green-100 text-green-700 dark:bg-green-950/50 dark:text-green-300",
  PERSONAL: "bg-orange-100 text-orange-700 dark:bg-orange-950/50 dark:text-orange-300",
  FINANCIAL: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300",
  OTHER: "bg-gray-100 text-gray-700 dark:bg-gray-800/60 dark:text-gray-300",
}

// ─── Zod Schema ───────────────────────────────────────────────────────────────

const goalEditSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  category: z.enum(["CAREER", "LEARNING", "HEALTH", "PERSONAL", "FINANCIAL", "OTHER"]),
  priority: z.enum(["HIGH", "MEDIUM", "LOW"]),
  deadline: z.string().optional(),
  estimatedHours: z.number().min(0).optional(),
})

type GoalEditValues = z.infer<typeof goalEditSchema>

// ─── Helpers ──────────────────────────────────────────────────────────────────

function statusBadgeVariant(s: GoalStatus): "success" | "warning" | "secondary" | "destructive" {
  switch (s) {
    case "ACTIVE":    return "success"
    case "PAUSED":    return "warning"
    case "COMPLETED": return "secondary"
    case "ABANDONED": return "destructive"
    case "MISSED":    return "destructive"
  }
}

function priorityBadgeVariant(p: GoalPriority): "destructive" | "warning" | "secondary" {
  switch (p) {
    case "HIGH":   return "destructive"
    case "MEDIUM": return "warning"
    case "LOW":    return "secondary"
  }
}

function taskStatusVariant(s: string): "secondary" | "warning" | "success" | "destructive" {
  switch (s) {
    case "IN_PROGRESS": return "warning"
    case "COMPLETED":   return "success"
    case "CANCELLED":   return "destructive"
    default:            return "secondary"
  }
}

function formatDeadline(deadline: string): { text: string; overdue: boolean } {
  const rawDate = deadline.includes("T") ? deadline.split("T")[0] : deadline
  const date = new Date(rawDate + "T00:00:00")
  if (Number.isNaN(date.getTime())) return { text: "Invalid date", overdue: false }
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  const diffMs = date.getTime() - now.getTime()
  const days = Math.ceil(diffMs / (1000 * 60 * 60 * 24))
  const formatted = date.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  })
  if (days < 0) return { text: `${formatted} · overdue by ${Math.abs(days)} day${Math.abs(days) !== 1 ? "s" : ""}`, overdue: true }
  if (days === 0) return { text: `${formatted} · due today`, overdue: false }
  if (days === 1) return { text: `${formatted} · due tomorrow`, overdue: false }
  if (days <= 7)  return { text: `${formatted} · ${days} days left`, overdue: false }
  return { text: formatted, overdue: false }
}

function formatCreatedAt(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  })
}

// ─── Edit Modal ───────────────────────────────────────────────────────────────

interface EditGoalModalProps {
  open: boolean
  onClose: () => void
  goal: Goal
  onUpdated: (updated: Goal) => void
}

function EditGoalModal({ open, onClose, goal, onUpdated }: EditGoalModalProps) {
  const { updateGoal } = useGoalsStore()
  const [submitting, setSubmitting] = useState(false)

  const form = useForm<GoalEditValues>({
    resolver: zodResolver(goalEditSchema),
    defaultValues: {
      title: goal.title,
      description: goal.description ?? "",
      category: goal.category,
      priority: goal.priority,
      deadline: (goal.estimatedEndDate ?? goal.deadline) ? (goal.estimatedEndDate ?? goal.deadline)!.split("T")[0] : "",
      estimatedHours: goal.estimatedHours,
    },
  })

  useEffect(() => {
    if (open) {
      form.reset({
        title: goal.title,
        description: goal.description ?? "",
        category: goal.category,
        priority: goal.priority,
        deadline: (goal.estimatedEndDate ?? goal.deadline) ? (goal.estimatedEndDate ?? goal.deadline)!.split("T")[0] : "",
        estimatedHours: goal.estimatedHours,
      })
    }
  }, [open, goal]) // eslint-disable-line react-hooks/exhaustive-deps

  const onSubmit = async (data: GoalEditValues) => {
    setSubmitting(true)
    try {
      const updated = await updateGoal(goal.id, {
        title: data.title,
        description: data.description || undefined,
        category: data.category,
        priority: data.priority,
        deadline: data.deadline || undefined,
        estimatedEndDate: data.deadline || undefined,
        estimatedHours: data.estimatedHours ?? undefined,
      })
      toast.success("Goal updated successfully")
      onUpdated(updated)
      onClose()
    } catch (err) {
      toast.error("Failed to update goal", err instanceof Error ? err.message : "Please try again.")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && !submitting && onClose()}>
      <DialogContent className="max-w-lg max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Edit2 className="size-4 text-primary" />
            Edit Goal
          </DialogTitle>
          <DialogDescription>Update the details of this goal.</DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-1">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title <span className="text-destructive">*</span></FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Get a promotion this year" {...field} />
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
                    <Textarea placeholder="Why is this goal important to you?" rows={3} className="resize-none" {...field} />
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
                    <FormLabel>Category <span className="text-destructive">*</span></FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                      <SelectContent>
                        {GOAL_CATEGORIES.map((cat) => (
                          <SelectItem key={cat} value={cat}>{categoryLabels[cat]}</SelectItem>
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
                    <FormLabel>Priority <span className="text-destructive">*</span></FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                      <SelectContent>
                        {GOAL_PRIORITIES.map((p) => (
                          <SelectItem key={p} value={p}>{p.charAt(0) + p.slice(1).toLowerCase()}</SelectItem>
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
                    <FormControl><Input type="date" {...field} /></FormControl>
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
                        onChange={(e) => field.onChange(e.target.value === "" ? undefined : parseFloat(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter className="pt-2 gap-2 sm:gap-0">
              <Button type="button" variant="outline" onClick={onClose} disabled={submitting}>Cancel</Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? (
                  <span className="flex items-center gap-2">
                    <span className="size-3.5 rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground animate-spin" />
                    Saving…
                  </span>
                ) : "Save Changes"}
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
  open, title, description, confirmLabel = "Confirm",
  destructive = false, loading = false, onConfirm, onClose,
}: ConfirmDialogProps) {
  return (
    <Dialog open={open} onOpenChange={(v) => !v && !loading && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className={cn("size-5", destructive ? "text-destructive" : "text-amber-500")} />
            {title}
          </DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={onClose} disabled={loading}>Cancel</Button>
          <Button variant={destructive ? "destructive" : "default"} onClick={onConfirm} disabled={loading}>
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="size-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                Processing…
              </span>
            ) : confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function GoalDetailSkeleton() {
  return (
    <div className="space-y-5">
      <Card>
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <Skeleton className="size-[72px] rounded-full shrink-0" />
            <div className="flex-1 space-y-3">
              <Skeleton className="h-7 w-3/4" />
              <div className="flex gap-2">
                <Skeleton className="h-5 w-16 rounded-full" />
                <Skeleton className="h-5 w-20 rounded-full" />
                <Skeleton className="h-5 w-18 rounded-full" />
              </div>
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-4/5" />
              <Skeleton className="h-px w-full" />
              <div className="grid grid-cols-2 gap-3">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      <Skeleton className="h-32 w-full rounded-xl" />
      <Skeleton className="h-48 w-full rounded-xl" />
      <Skeleton className="h-48 w-full rounded-xl" />
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

type ConfirmAction = {
  type: "delete" | "abandon" | "complete" | "pause" | "resume"
  label: string
  description: string
  destructive: boolean
}

export default function GoalDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { updateGoal, deleteGoal } = useGoalsStore()

  const goalId = params.id as string

  const [goal, setGoal] = useState<Goal | null>(null)
  const [subgoals, setSubgoals] = useState<Goal[]>([])
  const [loadingSubgoals, setLoadingSubgoals] = useState(false)
  const [loadingMoreSubgoals, setLoadingMoreSubgoals] = useState(false)
  const [subgoalsPagination, setSubgoalsPagination] = useState<{ total: number; page: number; totalPages: number } | null>(null)
  const [tasks, setTasks] = useState<Task[]>([])
  const [loadingGoal, setLoadingGoal] = useState(true)
  const [loadingTasks, setLoadingTasks] = useState(false)
  const [loadingMoreTasks, setLoadingMoreTasks] = useState(false)
  const [tasksPagination, setTasksPagination] = useState<{ total: number; page: number; totalPages: number } | null>(null)
  const [taskStatusFilter, setTaskStatusFilter] = useState<"ALL" | TaskStatus>("ALL")
  const [goalError, setGoalError] = useState<string | null>(null)

  const [editOpen, setEditOpen] = useState(false)
  const [confirm, setConfirm] = useState<ConfirmAction | null>(null)
  const [confirmLoading, setConfirmLoading] = useState(false)
  const [recoverOpen, setRecoverOpen] = useState(false)
  const [recoverDate, setRecoverDate] = useState("")
  const [taskActionLoading, setTaskActionLoading] = useState<string | null>(null)
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [viewingTask, setViewingTask] = useState<Task | null>(null)

  const fetchGoalData = useCallback(async () => {
    setLoadingGoal(true)
    setGoalError(null)
    try {
      const data = await getGoal(goalId)
      setGoal(data)
    } catch (err) {
      setGoalError(err instanceof Error ? err.message : "Failed to load goal.")
    } finally {
      setLoadingGoal(false)
    }
  }, [goalId])

  const fetchSubgoals = useCallback(async (page = 1, append = false) => {
    if (append) setLoadingMoreSubgoals(true)
    else setLoadingSubgoals(true)
    try {
      const res = await getSubgoals(goalId, { page, limit: SUBGOALS_PAGE_SIZE })
      setSubgoals((prev) => append ? [...prev, ...res.items] : res.items)
      setSubgoalsPagination({ total: res.total, page: res.page, totalPages: res.totalPages })
    } catch {
      // non-critical
    } finally {
      if (append) setLoadingMoreSubgoals(false)
      else setLoadingSubgoals(false)
    }
  }, [goalId])

  const fetchLinkedTasks = useCallback(async (page = 1, append = false) => {
    if (append) setLoadingMoreTasks(true)
    else setLoadingTasks(true)
    try {
      const data = await getPaginatedTasks({
        goalId,
        ...(taskStatusFilter !== "ALL" ? { status: taskStatusFilter } : {}),
        page,
        limit: TASKS_PAGE_SIZE,
      })
      setTasks((prev) => append ? [...prev, ...data.items] : data.items)
      setTasksPagination({ total: data.total, page: data.page, totalPages: data.totalPages })
    } catch {
      // Non-critical
    } finally {
      if (append) setLoadingMoreTasks(false)
      else setLoadingTasks(false)
    }
  }, [goalId, taskStatusFilter])

  useEffect(() => {
    fetchGoalData()
  }, [fetchGoalData])

  useEffect(() => {
    fetchSubgoals(1, false)
  }, [fetchSubgoals])

  useEffect(() => {
    fetchLinkedTasks(1, false)
  }, [fetchLinkedTasks])

  const handleStatusChange = async (status: GoalStatus) => {
    if (!goal) return
    setConfirmLoading(true)
    try {
      const updated = await updateGoal(goal.id, { status })
      setGoal(updated)
      toast.success(
        status === "COMPLETED" ? "🎉 Goal completed! Great work!"
        : status === "ABANDONED" ? "Goal abandoned."
        : status === "PAUSED" ? "Goal paused."
        : "Goal resumed!"
      )
      setConfirm(null)
    } catch (err) {
      toast.error("Failed to update goal", err instanceof Error ? err.message : undefined)
    } finally {
      setConfirmLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!goal) return
    setConfirmLoading(true)
    try {
      await deleteGoal(goal.id)
      toast.success("Goal deleted.")
      router.replace("/goals")
    } catch (err) {
      toast.error("Failed to delete goal", err instanceof Error ? err.message : undefined)
      setConfirmLoading(false)
    }
  }

  const handleConfirmAction = async () => {
    if (!confirm) return
    switch (confirm.type) {
      case "delete":   await handleDelete(); break
      case "complete": await handleStatusChange("COMPLETED"); break
      case "abandon":  await handleStatusChange("ABANDONED"); break
      case "pause":    await handleStatusChange("PAUSED"); break
      case "resume":   await handleStatusChange("ACTIVE"); break
    }
  }

  const openRecoverDialog = () => {
    const date = (goal?.estimatedEndDate ?? goal?.deadline ?? "").split("T")[0]
    setRecoverDate(date)
    setRecoverOpen(true)
  }

  const handleRecoverGoal = async () => {
    if (!goal || !recoverDate) return
    setConfirmLoading(true)
    try {
      const updated = await updateGoal(goal.id, {
        status: "ACTIVE",
        estimatedEndDate: recoverDate,
        deadline: recoverDate,
      })
      setGoal(updated)
      toast.success("Goal recovered and resumed")
      setRecoverOpen(false)
    } catch (err) {
      toast.error("Failed to recover goal", err instanceof Error ? err.message : undefined)
    } finally {
      setConfirmLoading(false)
    }
  }

  const handleTaskAction = useCallback(async (taskId: string, action: "complete" | "start" | "pause" | "delete") => {
    setTaskActionLoading(taskId)
    try {
      if (action === "complete") {
        await completeTask(taskId)
        toast.success("Task completed!")
      } else if (action === "start") {
        await updateTask(taskId, { status: "IN_PROGRESS" })
        toast.success("Task started!")
      } else if (action === "pause") {
        await updateTask(taskId, { status: "PENDING" })
        toast.success("Task paused")
      } else {
        await deleteTask(taskId)
        toast.success("Task deleted")
      }
      fetchLinkedTasks(1, false)
    } catch (err) {
      toast.error("Action failed", err instanceof Error ? err.message : undefined)
    } finally {
      setTaskActionLoading(null)
    }
  }, [fetchLinkedTasks])

  // ── Loading ────────────────────────────────────────────────────────────────
  if (loadingGoal) {
    return (
      <div className="relative min-h-screen overflow-x-clip bg-background">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <GoalDetailSkeleton />
        </div>
      </div>
    )
  }

  // ── Error ──────────────────────────────────────────────────────────────────
  if (goalError || !goal) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="text-center space-y-4 max-w-sm">
          <div className="flex size-16 items-center justify-center rounded-full bg-destructive/10 mx-auto">
            <AlertTriangle className="size-8 text-destructive" />
          </div>
          <div>
            <p className="text-lg font-semibold">Failed to load goal</p>
            <p className="text-sm text-muted-foreground mt-1">{goalError ?? "Goal not found."}</p>
          </div>
          <div className="flex gap-2 justify-center">
            <Button variant="outline" onClick={() => router.back()}>
              <ArrowLeft className="size-4" /> Go back
            </Button>
            <Button onClick={fetchGoalData}>Try again</Button>
          </div>
        </div>
      </div>
    )
  }

  // ── Derived state ──────────────────────────────────────────────────────────
  const deadlineDate = goal.estimatedEndDate ?? goal.deadline
  const deadline = deadlineDate ? formatDeadline(deadlineDate) : null
  const completedTasks = tasks.filter((t) => t.status === "COMPLETED")
  const hasMoreTasks = tasksPagination ? tasksPagination.page < tasksPagination.totalPages : false
  const isTerminal = goal.status === "COMPLETED" || goal.status === "ABANDONED"
  const score = goal.progress?.score ?? 0
  const isOverdue = Boolean(goal.isOverdue || deadline?.overdue)

  const statusBorderClass =
    goal.status === "ACTIVE"    ? "border-l-violet-500" :
    goal.status === "PAUSED"    ? "border-l-amber-400"  :
    goal.status === "COMPLETED" ? "border-l-emerald-500":
    goal.status === "MISSED"    ? "border-l-red-500"    :
                                  "border-l-rose-400"

  return (
    <div className="relative min-h-screen overflow-x-clip bg-background">
      {/* Background blobs */}
      <div aria-hidden="true" className="pointer-events-none absolute -top-24 left-1/2 h-[480px] w-[600px] -translate-x-1/2 rounded-full opacity-25 blur-3xl"
        style={{ background: "radial-gradient(circle, oklch(0.6 0.25 280) 0%, transparent 65%)" }} />
      <div aria-hidden="true" className="pointer-events-none absolute right-[-8rem] top-[30%] h-80 w-80 rounded-full opacity-20 blur-3xl"
        style={{ background: "radial-gradient(circle, oklch(0.65 0.22 320) 0%, transparent 65%)" }} />
      <div aria-hidden="true" className="pointer-events-none absolute bottom-0 left-[-4rem] h-[350px] w-[350px] rounded-full opacity-15 blur-3xl"
        style={{ background: "radial-gradient(circle, oklch(0.7 0.18 240) 0%, transparent 65%)" }} />

      <div className="relative mx-auto max-w-7xl space-y-6 px-4 py-6 sm:space-y-8 sm:px-6 sm:py-8 lg:px-8">

        {/* ── Hero card ── */}
        <div className="relative overflow-hidden rounded-3xl border border-border/70 bg-card/70 p-5 backdrop-blur-sm sm:p-7">
          <div aria-hidden="true" className="absolute inset-0 opacity-60 pointer-events-none"
            style={{ background: "linear-gradient(130deg, rgba(129,140,248,0.18) 0%, rgba(192,132,252,0.12) 48%, rgba(244,114,182,0.18) 100%)" }} />

          <div className="relative space-y-4">
            {/* Top row: back + actions */}
            <div className="flex items-center justify-between gap-4">
              <Button variant="ghost" size="sm" asChild className="gap-1.5 -ml-2 text-muted-foreground hover:text-foreground">
                <Link href="/goals"><ArrowLeft className="size-4" /> Goals</Link>
              </Button>
              {!isTerminal && (
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={() => setEditOpen(true)} className="gap-1.5 h-8 text-xs bg-background/50">
                    <Edit2 className="size-3.5" /> Edit
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="icon" className="size-8 bg-background/50"><MoreHorizontal className="size-4" /></Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      <DropdownMenuLabel className="text-xs">Actions</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      {goal.status === "ACTIVE" && (
                        <DropdownMenuItem onClick={() => setConfirm({ type: "pause", label: "Pause", description: `Pause "${goal.title}"?`, destructive: false })}>
                          <Pause className="size-3.5" /> Pause Goal
                        </DropdownMenuItem>
                      )}
                      {goal.status === "PAUSED" && (
                        <DropdownMenuItem onClick={() => setConfirm({ type: "resume", label: "Resume", description: `Resume "${goal.title}"?`, destructive: false })}>
                          <Play className="size-3.5" /> Resume Goal
                        </DropdownMenuItem>
                      )}
                      {goal.status === "MISSED" && (
                        <DropdownMenuItem onClick={openRecoverDialog}>
                          <Play className="size-3.5" /> Recover Goal
                        </DropdownMenuItem>
                      )}
                      {goal.isReadyToComplete && (
                        <DropdownMenuItem onClick={() => setConfirm({ type: "complete", label: "Complete", description: `Mark "${goal.title}" as completed?`, destructive: false })}>
                          <CheckCircle2 className="size-3.5" /> Mark Complete
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem destructive onClick={() => setConfirm({ type: "abandon", label: "Abandon", description: `Abandon "${goal.title}"?`, destructive: true })}>
                        <AlertTriangle className="size-3.5" /> Abandon
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem destructive onClick={() => setConfirm({ type: "delete", label: "Delete", description: `Permanently delete "${goal.title}"?`, destructive: true })}>
                        <Trash2 className="size-3.5" /> Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              )}
            </div>

            {/* Goal identity */}
            <div className="flex items-start gap-5">
              {goal.progress !== undefined && (
                <GoalProgressRing percent={score} size={64} strokeWidth={6} className="shrink-0 mt-0.5" />
              )}
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-1.5 mb-2">
                  <Badge variant={statusBadgeVariant(goal.status)} className="text-xs">{goal.status}</Badge>
                  <Badge variant={priorityBadgeVariant(goal.priority)} className="text-xs">{goal.priority} Priority</Badge>
                  <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium", categoryStyles[goal.category])}>
                    {categoryLabels[goal.category]}
                  </span>
                </div>
                <h1 className="text-2xl font-bold tracking-tight leading-tight sm:text-3xl">{goal.title}</h1>
                {goal.description && (
                  <p className="mt-2 text-sm text-muted-foreground leading-relaxed max-w-3xl">{goal.description}</p>
                )}
                <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                  {deadline && (
                    <span className={cn("flex items-center gap-1.5", isOverdue && "text-destructive font-medium")}>
                      <Calendar className="size-3.5" /> {deadline.text}
                    </span>
                  )}
                  {goal.estimatedHours !== undefined && (
                    <span className="flex items-center gap-1.5">
                      <Clock className="size-3.5" /> {goal.estimatedHours}h estimated
                    </span>
                  )}
                  {goal.createdAt && (
                    <span className="flex items-center gap-1.5">
                      <Target className="size-3.5" /> Created {formatCreatedAt(goal.createdAt)}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Ready-to-complete banner ── */}
        {goal.isReadyToComplete && goal.status === "ACTIVE" && (
          <div className="flex items-center justify-between gap-3 rounded-2xl border border-emerald-500/30 bg-emerald-500/5 px-5 py-3.5 backdrop-blur-sm">
            <div className="flex items-center gap-2.5 text-emerald-700 dark:text-emerald-400">
              <CheckCircle2 className="size-4 shrink-0" />
              <p className="text-sm font-semibold">All sub-goals done — ready to complete!</p>
            </div>
            <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white h-7 text-xs shrink-0"
              onClick={() => setConfirm({ type: "complete", label: "Complete", description: `Mark "${goal.title}" as completed?`, destructive: false })}>
              Complete
            </Button>
          </div>
        )}

        {/* ── Two-column layout: sub-goals left, tasks right ── */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 lg:items-start">

          {/* Sub-goals */}
          <Card className={cn("overflow-hidden border border-border/70 bg-card/85 backdrop-blur-sm border-l-[3px]", statusBorderClass)}>
            <CardContent className="p-0">
              <div className="flex items-center justify-between gap-2 px-5 py-4 border-b border-border/50">
                <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                  <FolderTree className="size-3.5" />
                  Sub-goals
                  {!loadingSubgoals && subgoalsPagination && subgoalsPagination.total > 0 && <span className="text-foreground font-normal normal-case tracking-normal">({subgoals.length}/{subgoalsPagination.total})</span>}
                </div>
                {!isTerminal && (
                  <Button variant="ghost" size="sm" asChild className="h-6 text-[11px] gap-1 text-muted-foreground hover:text-foreground -mr-1">
                    <Link href="/goals"><Plus className="size-3" /> Add</Link>
                  </Button>
                )}
              </div>
              <div className="px-4 py-3 space-y-1.5">
                {loadingSubgoals ? (
                  <div className="space-y-1">
                    {[1, 2].map((i) => <Skeleton key={i} className="h-10 w-full rounded-xl" />)}
                  </div>
                ) : subgoals.length === 0 ? (
                  <p className="text-xs text-muted-foreground py-2 px-1">No sub-goals yet. Break this goal into smaller milestones.</p>
                ) : (
                  subgoals.map((child) => {
                    const childDeadlineDate = child.estimatedEndDate ?? child.deadline
                    const childDeadline = childDeadlineDate ? formatDeadline(childDeadlineDate) : null
                    const childScore = child.progress?.score ?? 0
                    return (
                      <Link key={child.id} href={`/goals/${child.id}`}
                        className="flex items-center gap-3 rounded-xl border border-border/40 bg-muted/30 px-3 py-2.5 hover:bg-muted/60 hover:border-border transition-all group">
                        <GoalProgressRing percent={childScore} size={32} strokeWidth={3.5} className="shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors">{child.title}</p>
                          {childDeadline && (
                            <p className={cn("text-[10px] mt-0.5", (child.isOverdue || childDeadline.overdue) ? "text-destructive" : "text-muted-foreground")}>{childDeadline.text}</p>
                          )}
                        </div>
                        <Badge variant={statusBadgeVariant(child.status)} className="text-[10px] px-1.5 py-0 shrink-0">{child.status}</Badge>
                        <ChevronRight className="size-3.5 text-muted-foreground shrink-0" />
                      </Link>
                    )
                  })
                )}
                {subgoalsPagination && subgoalsPagination.page < subgoalsPagination.totalPages && (
                  <button
                    onClick={() => fetchSubgoals(subgoalsPagination.page + 1, true)}
                    disabled={loadingMoreSubgoals}
                    className={cn(
                      "group flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-border/60 px-3 py-2 text-xs font-medium text-muted-foreground transition-all",
                      "hover:border-violet-500/40 hover:bg-violet-500/5 hover:text-violet-600 dark:hover:text-violet-400",
                      loadingMoreSubgoals && "cursor-not-allowed opacity-60",
                    )}
                  >
                    {loadingMoreSubgoals ? (
                      <><span className="size-3.5 rounded-full border-2 border-violet-500/30 border-t-violet-500 animate-spin" /> Loading…</>
                    ) : (
                      <>Load {Math.min(SUBGOALS_PAGE_SIZE, subgoalsPagination.total - subgoals.length)} more <span className="rounded-full bg-muted px-1.5 py-0.5 text-[10px] tabular-nums">{subgoalsPagination.total - subgoals.length} remaining</span></>
                    )}
                  </button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Tasks */}
          <Card className="overflow-hidden border border-border/70 bg-card/85 backdrop-blur-sm">
            <CardContent className="p-0">
              <div className="flex items-center justify-between gap-2 px-5 py-4 border-b border-border/50">
                <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                  <CheckCircle2 className="size-3.5" />
                  Tasks
                  {taskStatusFilter === "ALL" && tasks.length > 0 && (
                    <span className="text-foreground font-normal normal-case tracking-normal">({completedTasks.length}/{tasks.length} done)</span>
                  )}
                </div>
                {tasks.length > 0 && (
                  <Button variant="ghost" size="sm" asChild className="h-6 text-[11px] gap-1 text-muted-foreground hover:text-foreground -mr-1">
                    <Link href="/tasks"><ExternalLink className="size-3" /> Tasks page</Link>
                  </Button>
                )}
              </div>
              <div className="px-4 py-3 space-y-1.5">
                <div className="flex items-center gap-1 overflow-x-auto pb-1">
                  {TASK_STATUS_FILTERS.map((f) => {
                    const active = taskStatusFilter === f.key
                    return (
                      <button
                        key={f.key}
                        onClick={() => setTaskStatusFilter(f.key)}
                        className={cn(
                          "h-6 shrink-0 rounded-lg border px-2.5 text-[10px] font-medium transition-colors",
                          active
                            ? "border-violet-500/50 bg-violet-500/10 text-violet-700 dark:text-violet-300"
                            : "border-border/60 bg-background/40 text-muted-foreground hover:text-foreground",
                        )}
                      >
                        {f.label}
                      </button>
                    )
                  })}
                </div>

                {loadingTasks ? (
                  [1, 2].map((i) => <Skeleton key={i} className="h-10 w-full rounded-xl" />)
                ) : tasks.length === 0 ? (
                  <p className="text-xs text-muted-foreground py-2 px-1">No tasks linked to this goal yet.</p>
                ) : (
                  <>
                    {tasks.map((task) => {
                      const isDone = task.status === "COMPLETED" || task.status === "CANCELLED"
                      const isActive = task.status === "IN_PROGRESS"
                      const isLoading = taskActionLoading === task.id
                      return (
                      <div
                        key={task.id}
                        className={cn(
                          "group flex items-center gap-2.5 rounded-xl border px-3 py-2.5 min-w-0",
                          isDone ? "border-transparent bg-muted/30" : "border-border/40 bg-card",
                        )}
                      >
                        {isDone ? (
                          <CheckCircle2 className="size-3.5 text-emerald-500 shrink-0" />
                        ) : (
                          <div className={cn("size-2 rounded-full shrink-0", isActive ? "bg-amber-400" : "bg-muted-foreground/30")} />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className={cn("text-sm font-medium truncate", isDone && "line-through text-muted-foreground")}>{task.title}</p>
                          {task.estimatedDuration !== undefined && (
                            <p className="text-[10px] text-muted-foreground flex items-center gap-1 mt-0.5">
                              <Clock className="size-2.5" />{(() => { const ts = Math.round(task.estimatedDuration! / 1000); const h = Math.floor(ts / 3600); const m = Math.floor((ts % 3600) / 60); const s = ts % 60; return h > 0 ? (s > 0 ? `${h}h ${m}m ${s}s` : m > 0 ? `${h}h ${m}m` : `${h}h`) : s > 0 ? `${m}m ${s}s` : `${m}m`; })()} est.
                            </p>
                          )}
                        </div>
                        <Badge variant={taskStatusVariant(task.status)} className="text-[10px] px-1.5 py-0 shrink-0">
                          {task.status.replace("_", " ")}
                        </Badge>
                        {task.status === "COMPLETED" && task.estimatedDuration && task.actualDuration && (() => {
                          const acc = Math.min(100, Math.round((Math.min(task.estimatedDuration, task.actualDuration) / Math.max(task.estimatedDuration, task.actualDuration)) * 100))
                          return (
                            <span className={cn("text-[10px] font-medium shrink-0",
                              acc >= 90 ? "text-emerald-600" :
                              acc >= 70 ? "text-amber-600" : "text-rose-500")}>
                              {acc}%
                            </span>
                          )
                        })()}
                        {!isDone && (
                          <div className="flex items-center gap-0.5 shrink-0">
                            {/* Inline — hover only on md+ */}
                            <div className="hidden md:flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Button variant="ghost" size="icon"
                                className="size-6 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/30"
                                disabled={isLoading} onClick={() => handleTaskAction(task.id, "complete")} title="Complete">
                                <CheckCircle2 className="size-3" />
                              </Button>
                              {isActive ? (
                                <Button variant="ghost" size="icon" className="size-6" disabled={isLoading} onClick={() => handleTaskAction(task.id, "pause")}>
                                  <Pause className="size-3" />
                                </Button>
                              ) : (
                                <Button variant="ghost" size="icon" className="size-6 text-violet-600 hover:bg-violet-50 dark:hover:bg-violet-950/30" disabled={isLoading} onClick={() => handleTaskAction(task.id, "start")}>
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
                        )}
                      </div>
                      )
                    })}

                    {hasMoreTasks && (
                      <button
                        disabled={loadingMoreTasks}
                        className="flex w-full items-center justify-center gap-1 rounded-lg border border-dashed border-border/60 px-3 py-1.5 text-[11px] text-muted-foreground hover:text-foreground hover:border-border transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        onClick={() => fetchLinkedTasks((tasksPagination?.page ?? 1) + 1, true)}
                      >
                        {loadingMoreTasks ? "Loading..." : `+${Math.max((tasksPagination?.total ?? 0) - tasks.length, 0)} more tasks`}
                      </button>
                    )}
                  </>
                )}
              </div>
            </CardContent>
          </Card>

        </div>
      </div>

      {editOpen && goal && (
        <EditGoalModal open={editOpen} onClose={() => setEditOpen(false)} goal={goal} onUpdated={(updated) => setGoal(updated)} />
      )}

      {confirm && (
        <ConfirmDialog
          open
          title={
            confirm.type === "delete"   ? "Delete Goal"   :
            confirm.type === "abandon"  ? "Abandon Goal"  :
            confirm.type === "complete" ? "Complete Goal" :
            confirm.type === "pause"    ? "Pause Goal"    : "Resume Goal"
          }
          description={confirm.description}
          confirmLabel={confirm.label}
          destructive={confirm.destructive}
          loading={confirmLoading}
          onConfirm={handleConfirmAction}
          onClose={() => !confirmLoading && setConfirm(null)}
        />
      )}

      <Dialog open={recoverOpen} onOpenChange={(v) => !confirmLoading && setRecoverOpen(v)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Recover Goal</DialogTitle>
            <DialogDescription>
              Set a new target date to resume this missed goal.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="recover-date">New target date</Label>
            <Input
              id="recover-date"
              type="date"
              value={recoverDate}
              onChange={(e) => setRecoverDate(e.target.value)}
            />
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setRecoverOpen(false)} disabled={confirmLoading}>Cancel</Button>
            <Button onClick={handleRecoverGoal} disabled={confirmLoading || !recoverDate}>
              {confirmLoading ? "Saving..." : "Resume Goal"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <EditTaskDialog
        open={!!editingTask}
        task={editingTask}
        onClose={() => setEditingTask(null)}
        onUpdated={(updated) => {
          setTasks(prev => prev.map(t => t.id === updated.id ? updated : t))
          setEditingTask(null)
        }}
      />
      <TaskDetailDialog
        open={!!viewingTask}
        task={viewingTask}
        onClose={() => setViewingTask(null)}
      />
    </div>
  )
}
