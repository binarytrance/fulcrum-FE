"use client"

import { useEffect, useState, useCallback, useMemo } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import Link from "next/link"
import {
  ArrowLeft,
  ArrowRight,
  Calendar,
  Clock,
  Plus,
  Play,
  Pause,
  Trash2,
  Timer,
  Inbox,
  CheckCircle2,
  Target,
  MoreHorizontal,
  CalendarDays,
  CheckSquare,
  AlertCircle,
  Sparkles,
} from "lucide-react"
import type { Task, GoalPriority } from "@/types"
import { getTasks } from "@/lib/tasks-api"
import { useTasksStore } from "@/store/tasks-store"
import { useGoalsStore } from "@/store/goals-store"
import { toast } from "@/components/ui/toast"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Separator } from "@/components/ui/separator"
import { Progress } from "@/components/ui/progress"
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
import { CompleteTaskDialog } from "@/components/tasks/CompleteTaskDialog"

// ─── Constants ────────────────────────────────────────────────────────────────

const PRIORITIES: GoalPriority[] = ["HIGH", "MEDIUM", "LOW"]

// ─── Zod Schema ───────────────────────────────────────────────────────────────

const taskFormSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  priority: z.enum(["HIGH", "MEDIUM", "LOW"]),
  type: z.enum(["PLANNED", "UNPLANNED"]),
  scheduledFor: z.string().optional(),
  estimatedDuration: z
    .number()
    .min(1, "At least 1 minute")
    .optional(),
  goalId: z.string().optional(),
})

type TaskFormValues = z.infer<typeof taskFormSchema>

// ─── Helpers ─────────────────────────────────────────────────────────────────

function taskStatusVariant(s: string): "secondary" | "warning" | "success" | "destructive" {
  switch (s) {
    case "IN_PROGRESS": return "warning"
    case "COMPLETED":   return "success"
    case "CANCELLED":   return "destructive"
    default:            return "secondary"
  }
}

function priorityVariant(p: GoalPriority): "destructive" | "warning" | "secondary" {
  switch (p) {
    case "HIGH":   return "destructive"
    case "MEDIUM": return "warning"
    case "LOW":    return "secondary"
  }
}

function formatDisplayDate(iso: string): string {
  return new Date(iso + "T00:00:00").toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  })
}

function formatShortDate(iso: string): string {
  return new Date(iso + "T00:00:00").toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  })
}

function isToday(iso: string): boolean {
  return iso === todayIso()
}

function navigateDate(iso: string, dir: "prev" | "next"): string {
  const d = new Date(iso + "T00:00:00")
  d.setDate(d.getDate() + (dir === "next" ? 1 : -1))
  return d.toISOString().split("T")[0]
}

function todayIso(): string {
  return new Date().toISOString().split("T")[0]
}

function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes}m`
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return m > 0 ? `${h}h ${m}m` : `${h}h`
}

// ─── Create Task Dialog ───────────────────────────────────────────────────────

interface CreateTaskDialogProps {
  open: boolean
  onClose: () => void
  defaultDate: string
  goals: { id: string; title: string }[]
  onCreated: () => void
}

function CreateTaskDialog({
  open,
  onClose,
  defaultDate,
  goals,
  onCreated,
}: CreateTaskDialogProps) {
  const { createTask } = useTasksStore()
  const [submitting, setSubmitting] = useState(false)

  const form = useForm<TaskFormValues>({
    resolver: zodResolver(taskFormSchema),
    defaultValues: {
      title: "",
      description: "",
      priority: "MEDIUM",
      type: "PLANNED",
      scheduledFor: defaultDate,
      estimatedDuration: undefined,
      goalId: "",
    },
  })

  const taskType = form.watch("type")

  useEffect(() => {
    if (open) {
      form.reset({
        title: "",
        description: "",
        priority: "MEDIUM",
        type: "PLANNED",
        scheduledFor: defaultDate,
        estimatedDuration: undefined,
        goalId: "",
      })
    }
  }, [open, defaultDate]) // eslint-disable-line react-hooks/exhaustive-deps

  const onSubmit = async (data: TaskFormValues) => {
    setSubmitting(true)
    try {
      const scheduledForIso =
        data.type === "PLANNED" && data.scheduledFor
          ? new Date(data.scheduledFor + "T00:00:00.000Z").toISOString()
          : undefined

      const estimatedDurationMs =
        data.estimatedDuration != null
          ? Math.round(data.estimatedDuration * 60 * 1000)
          : undefined

      await createTask({
        title: data.title,
        description: data.description || undefined,
        priority: data.priority,
        type: data.type,
        scheduledFor: scheduledForIso,
        estimatedDuration: estimatedDurationMs,
        goalId: data.goalId && data.goalId !== "none" ? data.goalId : undefined,
      })
      toast.success("Task created!")
      onCreated()
      onClose()
    } catch (err) {
      toast.error("Failed to create task", err instanceof Error ? err.message : undefined)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && !submitting && onClose()}>
      <DialogContent className="max-w-lg max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="flex size-7 items-center justify-center rounded-full bg-violet-500/15">
              <Plus className="size-4 text-violet-600 dark:text-violet-400" />
            </div>
            New Task
          </DialogTitle>
          <DialogDescription>Add a task to your planner or inbox.</DialogDescription>
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
                    <Input placeholder="e.g. Review pull request" autoFocus {...field} />
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
                      placeholder="Any extra context…"
                      rows={2}
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
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Type <span className="text-destructive">*</span>
                    </FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="PLANNED">📅 Planned</SelectItem>
                        <SelectItem value="UNPLANNED">📥 Unplanned</SelectItem>
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
                        {PRIORITIES.map((p) => (
                          <SelectItem key={p} value={p}>
                            {p.charAt(0) + p.slice(1).toLowerCase()}
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
              {taskType === "PLANNED" && (
                <FormField
                  control={form.control}
                  name="scheduledFor"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Scheduled For</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              <FormField
                control={form.control}
                name="estimatedDuration"
                render={({ field }) => (
                  <FormItem className={taskType === "UNPLANNED" ? "col-span-2" : ""}>
                    <FormLabel>
                      Est. Duration (min) <span className="text-destructive">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={1}
                        step={1}
                        placeholder="e.g. 30"
                        value={field.value ?? ""}
                        onChange={(e) =>
                          field.onChange(
                            e.target.value === ""
                              ? undefined
                              : parseInt(e.target.value, 10)
                          )
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {goals.length > 0 && (
              <FormField
                control={form.control}
                name="goalId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Link to Goal</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value || "none"}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="No goal" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="none">No goal</SelectItem>
                        <SelectSeparator />
                        {goals.map((g) => (
                          <SelectItem key={g.id} value={g.id}>
                            {g.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <DialogFooter className="pt-2 gap-2 sm:gap-0">
              <Button type="button" variant="outline" onClick={onClose} disabled={submitting}>
                Cancel
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? (
                  <span className="flex items-center gap-2">
                    <span className="size-3.5 rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground animate-spin" />
                    Creating…
                  </span>
                ) : (
                  "Create Task"
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

// ─── Task Row ─────────────────────────────────────────────────────────────────

interface TaskRowProps {
  task: Task
  onComplete: (task: Task) => void
  onRefresh: () => void
  variant?: "daily" | "inbox"
}

function TaskRow({ task, onComplete, onRefresh, variant = "daily" }: TaskRowProps) {
  const { updateTask, deleteTask } = useTasksStore()
  const [actionLoading, setActionLoading] = useState(false)

  const isDone = task.status === "COMPLETED" || task.status === "CANCELLED"
  const isActive = task.status === "IN_PROGRESS"

  const handleAction = async (action: "start" | "pause" | "delete") => {
    setActionLoading(true)
    try {
      if (action === "start") {
        await updateTask(task.id, { status: "IN_PROGRESS" })
        toast.success("Task started!")
      } else if (action === "pause") {
        await updateTask(task.id, { status: "PENDING" })
        toast.success("Task paused")
      } else {
        await deleteTask(task.id)
        toast.success("Task deleted")
      }
      onRefresh()
    } catch (err) {
      toast.error("Action failed", err instanceof Error ? err.message : undefined)
    } finally {
      setActionLoading(false)
    }
  }

  return (
    <div
      className={cn(
        "group flex items-start gap-3 rounded-xl border px-3.5 py-3 transition-all duration-150",
        isDone && "bg-muted/20 border-transparent opacity-55",
        isActive && !isDone && "border-violet-500/30 bg-violet-500/[0.04] dark:bg-violet-500/[0.06]",
        !isDone && !isActive && "bg-card/80 border-border/60 hover:border-border hover:bg-card"
      )}
    >
      {/* Check button */}
      <button
        onClick={() => !isDone && onComplete(task)}
        disabled={isDone || actionLoading}
        aria-label={isDone ? "Completed" : "Mark complete"}
        className={cn(
          "mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full border-2 transition-all",
          isDone && "border-emerald-400 bg-emerald-400 text-white",
          isActive && !isDone && "border-violet-500 hover:bg-violet-50 dark:hover:bg-violet-950/30",
          !isDone && !isActive && "border-muted-foreground/40 hover:border-violet-500 hover:bg-violet-500/5"
        )}
      >
        {isDone && <CheckCircle2 className="size-3.5" />}
      </button>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p
          className={cn(
            "text-sm font-medium leading-snug",
            isDone && "line-through text-muted-foreground"
          )}
        >
          {task.title}
        </p>

        <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
          <Badge variant={taskStatusVariant(task.status)} className="text-[10px] px-1.5 py-0">
            {task.status.replace("_", " ")}
          </Badge>
          <Badge variant={priorityVariant(task.priority)} className="text-[10px] px-1.5 py-0">
            {task.priority}
          </Badge>
          {task.estimatedDuration !== undefined && (
            <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
              <Clock className="size-2.5" />
              {formatDuration(task.estimatedDuration)}
            </span>
          )}
          {task.actualDuration !== undefined && (
            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 flex items-center gap-0.5 font-medium">
              <CheckCircle2 className="size-2.5" />
              {formatDuration(task.actualDuration)} actual
            </span>
          )}
          {task.efficiencyScore !== undefined && (
            <span
              className={cn(
                "text-[10px] font-semibold",
                task.efficiencyScore >= 100 ? "text-emerald-600 dark:text-emerald-400" :
                task.efficiencyScore >= 75  ? "text-amber-600 dark:text-amber-400" : "text-red-500"
              )}
            >
              {task.efficiencyScore}%
            </span>
          )}
        </div>
      </div>

      {/* Hover actions */}
      {!isDone && (
        <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
          {isActive && (
            <Button variant="ghost" size="icon" className="size-7" asChild title="Open timer">
              <Link href={`/timer/${task.id}`}>
                <Timer className="size-3.5 text-violet-500" />
              </Link>
            </Button>
          )}
          {!isActive && (
            <Button
              variant="ghost"
              size="icon"
              className="size-7 text-violet-600 hover:text-violet-700 hover:bg-violet-50 dark:hover:bg-violet-950/30"
              onClick={() => handleAction("start")}
              disabled={actionLoading}
              title="Start task"
            >
              <Play className="size-3.5" />
            </Button>
          )}
          {isActive && (
            <Button
              variant="ghost"
              size="icon"
              className="size-7"
              onClick={() => handleAction("pause")}
              disabled={actionLoading}
              title="Pause"
            >
              <Pause className="size-3.5" />
            </Button>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="size-7 opacity-60 hover:opacity-100"
                disabled={actionLoading}
              >
                <MoreHorizontal className="size-3.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40">
              <DropdownMenuLabel className="text-xs">Actions</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => onComplete(task)}>
                <CheckCircle2 className="size-3.5" />
                Complete
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href={`/timer/${task.id}`}>
                  <Timer className="size-3.5" />
                  Open Timer
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem destructive onClick={() => handleAction("delete")}>
                <Trash2 className="size-3.5" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}
    </div>
  )
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function TaskRowSkeleton() {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-border/60 px-3.5 py-3">
      <Skeleton className="size-5 rounded-full shrink-0 mt-0.5" />
      <div className="flex-1 space-y-1.5">
        <Skeleton className="h-4 w-3/4" />
        <div className="flex gap-1.5">
          <Skeleton className="h-3.5 w-14 rounded-full" />
          <Skeleton className="h-3.5 w-12 rounded-full" />
        </div>
      </div>
    </div>
  )
}

// ─── Day Stats Card ───────────────────────────────────────────────────────────

function DayStats({ tasks, date }: { tasks: Task[]; date: string }) {
  const total = tasks.length
  const completed = tasks.filter((t) => t.status === "COMPLETED").length
  const inProgress = tasks.filter((t) => t.status === "IN_PROGRESS").length
  const pending = tasks.filter((t) => t.status === "PENDING").length
  const totalMins = tasks
    .filter((t) => t.actualDuration !== undefined)
    .reduce((sum, t) => sum + (t.actualDuration ?? 0), 0)
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0

  return (
    <Card className="rounded-2xl border border-border/70 bg-card/80 backdrop-blur-sm">
      <CardHeader className="pb-2 pt-4 px-4">
        <CardTitle className="text-sm flex items-center gap-2">
          <CalendarDays className="size-3.5 text-violet-500" />
          {isToday(date) ? "Today's Overview" : formatShortDate(date)}
        </CardTitle>
      </CardHeader>
      <CardContent className="px-4 pb-4 pt-0">
        {total === 0 ? (
          <p className="text-xs text-muted-foreground py-2">No tasks for this day.</p>
        ) : (
          <div className="space-y-3">
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Completion</span>
                <span className="font-semibold tabular-nums">{pct}%</span>
              </div>
              <Progress
                value={pct}
                className={cn(
                  "h-1.5",
                  pct >= 100 && "[&>div]:bg-emerald-500",
                  pct >= 50 && pct < 100 && "[&>div]:bg-violet-500",
                  pct < 50 && "[&>div]:bg-indigo-400"
                )}
              />
            </div>

            <div className="grid grid-cols-3 gap-2">
              {[
                { label: "Done", value: completed, cls: "text-emerald-600 dark:text-emerald-400" },
                { label: "Active", value: inProgress, cls: "text-violet-600 dark:text-violet-400" },
                { label: "Pending", value: pending, cls: "text-foreground" },
              ].map((s) => (
                <div key={s.label} className="rounded-xl bg-muted/50 px-2 py-2 text-center">
                  <p className={cn("text-lg font-bold tabular-nums", s.cls)}>{s.value}</p>
                  <p className="text-[10px] text-muted-foreground">{s.label}</p>
                </div>
              ))}
            </div>

            {totalMins > 0 && (
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Clock className="size-3" />
                <span>
                  <span className="font-medium text-foreground">{formatDuration(totalMins)}</span>{" "}
                  logged
                </span>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// ─── Tasks Page ───────────────────────────────────────────────────────────────

export default function TasksPage() {
  const { completeTask, currentDate, setCurrentDate } = useTasksStore()
  const { goals, fetchGoals } = useGoalsStore()

  const [dailyTasks, setDailyTasks] = useState<Task[]>([])
  const [inboxTasks, setInboxTasks] = useState<Task[]>([])
  const [overdueTasks, setOverdueTasks] = useState<Task[]>([])
  const [loadingDaily, setLoadingDaily] = useState(false)
  const [loadingInbox, setLoadingInbox] = useState(false)

  const [createOpen, setCreateOpen] = useState(false)
  const [completingTask, setCompletingTask] = useState<Task | null>(null)
  const [completeDialogOpen, setCompleteDialogOpen] = useState(false)

  const fetchDailyTasks = useCallback(async () => {
    setLoadingDaily(true)
    try {
      const data = await getTasks({ date: currentDate, type: "PLANNED" })
      setDailyTasks(data)
    } catch (err) {
      toast.error("Failed to load tasks", err instanceof Error ? err.message : undefined)
    } finally {
      setLoadingDaily(false)
    }
  }, [currentDate])

  const fetchInboxTasks = useCallback(async () => {
    setLoadingInbox(true)
    try {
      const data = await getTasks({ type: "UNPLANNED" })
      setInboxTasks(data.filter((t) => t.status === "PENDING" || t.status === "IN_PROGRESS"))
    } catch (err) {
      toast.error("Failed to load inbox", err instanceof Error ? err.message : undefined)
    } finally {
      setLoadingInbox(false)
    }
  }, [])

  const fetchOverdueTasks = useCallback(async () => {
    try {
      const today = todayIso()
      const [pending, inProgress] = await Promise.all([
        getTasks({ type: "PLANNED", status: "PENDING" }),
        getTasks({ type: "PLANNED", status: "IN_PROGRESS" }),
      ])
      setOverdueTasks(
        [...pending, ...inProgress].filter((t) => {
          const taskDate = t.scheduledFor?.split("T")[0]
          return taskDate !== undefined && taskDate < today
        })
      )
    } catch {
      // non-critical
    }
  }, [])

  const refreshAll = useCallback(() => {
    fetchDailyTasks()
    fetchInboxTasks()
    fetchOverdueTasks()
  }, [fetchDailyTasks, fetchInboxTasks, fetchOverdueTasks])

  useEffect(() => {
    fetchGoals()
    fetchInboxTasks()
    fetchOverdueTasks()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    fetchDailyTasks()
  }, [fetchDailyTasks])

  const openCompleteDialog = useCallback((task: Task) => {
    setCompletingTask(task)
    setCompleteDialogOpen(true)
  }, [])

  const handleComplete = useCallback(
    async (actualDuration: number) => {
      if (!completingTask) return
      await completeTask(completingTask.id, actualDuration)
      toast.success("🎉 Task completed!")
      refreshAll()
    },
    [completingTask, completeTask, refreshAll]
  )

  const handleDateNav = useCallback(
    (dir: "prev" | "next") => setCurrentDate(navigateDate(currentDate, dir)),
    [currentDate, setCurrentDate]
  )

  const goalsForSelect = useMemo(
    () => goals.filter((g) => g.status === "ACTIVE"),
    [goals]
  )

  const inProgressTasks = useMemo(() => dailyTasks.filter((t) => t.status === "IN_PROGRESS"), [dailyTasks])
  const pendingTasks = useMemo(() => dailyTasks.filter((t) => t.status === "PENDING"), [dailyTasks])
  const completedDailyTasks = useMemo(() => dailyTasks.filter((t) => t.status === "COMPLETED"), [dailyTasks])

  const isCurrToday = isToday(currentDate)

  return (
    <div className="relative min-h-screen overflow-x-hidden">
      {/* Ambient blobs */}
      <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div
          className="absolute -top-20 right-1/4 h-[400px] w-[400px] rounded-full opacity-[0.05] blur-3xl dark:opacity-[0.09]"
          style={{ background: "radial-gradient(circle, oklch(0.6 0.25 280) 0%, transparent 65%)" }}
        />
        <div
          className="absolute bottom-0 left-0 h-[350px] w-[350px] rounded-full opacity-[0.04] blur-3xl dark:opacity-[0.07]"
          style={{ background: "radial-gradient(circle, oklch(0.65 0.22 320) 0%, transparent 65%)" }}
        />
      </div>

      {/* Hero header */}
      <div className="relative border-b border-border/50 bg-background/80 backdrop-blur-sm">
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "linear-gradient(130deg, rgba(129,140,248,0.08) 0%, rgba(192,132,252,0.05) 50%, rgba(244,114,182,0.08) 100%)",
          }}
        />
        <div className="relative mx-auto max-w-6xl px-4 py-5 sm:px-6">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="flex size-11 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 via-violet-500 to-pink-500 shadow-md shadow-violet-500/20">
                <CheckSquare className="size-5 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-indigo-400 via-violet-400 to-pink-400 bg-clip-text text-transparent">
                  Tasks
                </h1>
                <p className="text-sm text-muted-foreground">Daily planner &amp; inbox</p>
              </div>
            </div>

            <Button
              onClick={() => setCreateOpen(true)}
              className="gap-1.5 bg-gradient-to-r from-indigo-500 via-violet-500 to-pink-500 text-white border-0 shadow-md shadow-violet-500/25 hover:shadow-lg hover:shadow-violet-500/30 transition-all"
            >
              <Plus className="size-4" />
              <span className="hidden sm:inline">New Task</span>
              <span className="sm:hidden">New</span>
            </Button>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* ── LEFT: Daily Planner ── */}
          <div className="lg:col-span-2 space-y-4">
            {/* Date navigation */}
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                className="size-8 shrink-0 rounded-xl"
                onClick={() => handleDateNav("prev")}
              >
                <ArrowLeft className="size-4" />
              </Button>

              <div className="flex-1 text-center">
                <p className="text-sm font-semibold leading-tight">
                  {formatDisplayDate(currentDate)}
                </p>
                {isCurrToday && (
                  <span className="text-xs font-medium text-violet-600 dark:text-violet-400">
                    Today
                  </span>
                )}
              </div>

              <Button
                variant="outline"
                size="icon"
                className="size-8 shrink-0 rounded-xl"
                onClick={() => handleDateNav("next")}
              >
                <ArrowRight className="size-4" />
              </Button>

              {!isCurrToday && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setCurrentDate(todayIso())}
                  className="gap-1 text-xs px-2 h-8 shrink-0 text-violet-600 dark:text-violet-400 hover:bg-violet-50 dark:hover:bg-violet-950/30"
                >
                  <Calendar className="size-3" />
                  Today
                </Button>
              )}
            </div>

            {/* Planned tasks */}
            <Card className="rounded-2xl border border-border/70 bg-card/80 backdrop-blur-sm">
              <CardHeader className="pb-2 pt-4 px-4 flex-row items-center justify-between">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Target className="size-3.5 text-violet-500" />
                  Planned Tasks
                  {!loadingDaily && dailyTasks.length > 0 && (
                    <span className="text-muted-foreground font-normal">
                      ({dailyTasks.length})
                    </span>
                  )}
                </CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={fetchDailyTasks}
                  disabled={loadingDaily}
                  className="h-7 text-xs gap-1"
                >
                  Refresh
                </Button>
              </CardHeader>
              <CardContent className="px-4 pb-4 pt-0">
                {loadingDaily ? (
                  <div className="space-y-2">
                    {[1, 2, 3].map((i) => <TaskRowSkeleton key={i} />)}
                  </div>
                ) : dailyTasks.length === 0 && overdueTasks.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 gap-3 text-center">
                    <div className="flex size-12 items-center justify-center rounded-xl bg-muted/60">
                      <Calendar className="size-5 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold">
                        {isCurrToday ? "No tasks planned for today" : "No tasks on this day"}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {isCurrToday ? "Schedule a task to get started." : "Navigate or create a task."}
                      </p>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => setCreateOpen(true)}>
                      <Plus className="size-3.5" />
                      Add a Task
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {overdueTasks.length > 0 && (
                      <div className="space-y-1.5">
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-destructive px-1 flex items-center gap-1">
                          <AlertCircle className="size-3" />
                          Past Due ({overdueTasks.length})
                        </p>
                        {overdueTasks.map((t) => (
                          <TaskRow
                            key={t.id}
                            task={t}
                            onComplete={openCompleteDialog}
                            onRefresh={refreshAll}
                          />
                        ))}
                        {dailyTasks.length > 0 && <Separator className="my-2" />}
                      </div>
                    )}

                    {inProgressTasks.length > 0 && (
                      <div className="space-y-1.5">
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-violet-600 dark:text-violet-400 px-1">
                          In Progress ({inProgressTasks.length})
                        </p>
                        {inProgressTasks.map((t) => (
                          <TaskRow key={t.id} task={t} onComplete={openCompleteDialog} onRefresh={refreshAll} />
                        ))}
                      </div>
                    )}

                    {pendingTasks.length > 0 && (
                      <div className="space-y-1.5">
                        {inProgressTasks.length > 0 && <Separator className="my-2" />}
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground px-1">
                          Pending ({pendingTasks.length})
                        </p>
                        {pendingTasks.map((t) => (
                          <TaskRow key={t.id} task={t} onComplete={openCompleteDialog} onRefresh={refreshAll} />
                        ))}
                      </div>
                    )}

                    {completedDailyTasks.length > 0 && (
                      <div className="space-y-1.5">
                        {(inProgressTasks.length > 0 || pendingTasks.length > 0) && (
                          <Separator className="my-2" />
                        )}
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 px-1 flex items-center gap-1">
                          <CheckCircle2 className="size-3" />
                          Completed ({completedDailyTasks.length})
                        </p>
                        {completedDailyTasks.map((t) => (
                          <TaskRow key={t.id} task={t} onComplete={openCompleteDialog} onRefresh={refreshAll} />
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* ── RIGHT: Sidebar ── */}
          <div className="space-y-4">
            {/* Day stats */}
            <DayStats tasks={dailyTasks} date={currentDate} />

            {/* Inbox */}
            <Card className="rounded-2xl border border-border/70 bg-card/80 backdrop-blur-sm">
              <CardHeader className="pb-2 pt-4 px-4 flex-row items-center justify-between">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Inbox className="size-3.5 text-pink-500" />
                  Inbox
                  {!loadingInbox && inboxTasks.length > 0 && (
                    <span className="text-muted-foreground font-normal">
                      ({inboxTasks.length})
                    </span>
                  )}
                </CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={fetchInboxTasks}
                  disabled={loadingInbox}
                  className="h-7 text-xs"
                >
                  Refresh
                </Button>
              </CardHeader>
              <CardContent className="px-4 pb-4 pt-0">
                {loadingInbox ? (
                  <div className="space-y-2">
                    {[1, 2].map((i) => <TaskRowSkeleton key={i} />)}
                  </div>
                ) : inboxTasks.length === 0 ? (
                  <div className="flex flex-col items-center gap-2 py-8 text-center">
                    <Sparkles className="size-5 text-pink-400" />
                    <p className="text-xs text-muted-foreground">Inbox is clear!</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {inboxTasks.map((t) => (
                      <TaskRow
                        key={t.id}
                        task={t}
                        onComplete={openCompleteDialog}
                        onRefresh={refreshAll}
                        variant="inbox"
                      />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Dialogs */}
      <CreateTaskDialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        defaultDate={currentDate}
        goals={goalsForSelect}
        onCreated={refreshAll}
      />

      {completingTask && (
        <CompleteTaskDialog
          open={completeDialogOpen}
          onClose={() => {
            setCompleteDialogOpen(false)
            setCompletingTask(null)
          }}
          task={completingTask}
          onComplete={handleComplete}
        />
      )}
    </div>
  )
}
