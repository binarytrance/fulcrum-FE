"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"

import { useAuthStore } from "@/store/auth-store"
import { useAnalyticsStore } from "@/store/analytics-store"
import { useHabitsStore } from "@/store/habits-store"
import { useTasksStore } from "@/store/tasks-store"
import { useGoalsStore } from "@/store/goals-store"
import { createManualSession } from "@/lib/sessions-api"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { toast } from "@/components/ui/toast"
import { cn } from "@/lib/utils"

import {
  Zap,
  Flame,
  CheckCircle,
  Circle,
  SkipForward,
  Plus,
  Clock,
  BarChart3,
  Target,
  Timer,
  Play,
  ArrowRight,
  Calendar,
  TrendingUp,
  Activity,
  AlertTriangle,
  Leaf,
} from "lucide-react"

import type { Task } from "@/types"

// ─── Date / Format Helpers ────────────────────────────────────────────────────

function getGreeting(): string {
  const h = new Date().getHours()
  if (h < 12) return "Good morning"
  if (h < 17) return "Good afternoon"
  return "Good evening"
}

function formatToday(): string {
  return new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  })
}

function toDateStr(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  return `${y}-${m}-${day}`
}

function formatMinutes(mins: number): string {
  if (mins === 0) return "0 min"
  if (mins < 60) return `${mins} min`
  const h = Math.floor(mins / 60)
  const m = mins % 60
  return m === 0 ? `${h}h` : `${h}h ${m}m`
}

// ─── Schemas ──────────────────────────────────────────────────────────────────

const completeHabitSchema = z.object({
  durationMinutes: z.number().min(1, "At least 1 minute"),
  note: z.string().optional(),
})

const manualSessionSchema = z.object({
  taskId: z.string().min(1, "Please select a task"),
  durationMinutes: z.number().min(1, "At least 1 minute"),
  note: z.string().optional(),
})

type CompleteHabitForm = z.infer<typeof completeHabitSchema>
type ManualSessionForm = z.infer<typeof manualSessionSchema>

// ─── Habit item type (subset of DueTodayEntry from habits-store) ──────────────

type HabitItem = {
  id: string
  title: string
  targetDuration: number
  occurrenceId?: string
  occurrenceStatus?: "PENDING" | "COMPLETED" | "SKIPPED"
}

// ─── Stat Card ────────────────────────────────────────────────────────────────

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  iconBg,
  loading,
}: {
  icon: React.ElementType
  label: string
  value: string
  sub?: string
  iconBg: string
  loading?: boolean
}) {
  return (
    <Card className="hover:shadow-md transition-all duration-200 hover:-translate-y-0.5">
      <CardContent className="p-5">
        {loading ? (
          <div className="space-y-2">
            <Skeleton className="h-3.5 w-28" />
            <Skeleton className="h-9 w-20" />
            <Skeleton className="h-3 w-24" />
          </div>
        ) : (
          <div className="flex items-start justify-between">
            <div className="min-w-0">
              <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-widest mb-2">
                {label}
              </p>
              <p className="text-3xl font-bold text-foreground leading-none mb-1.5 truncate">
                {value}
              </p>
              {sub && (
                <p className="text-xs text-muted-foreground truncate">{sub}</p>
              )}
            </div>
            <div className={cn("p-2.5 rounded-xl shrink-0 ml-3", iconBg)}>
              <Icon className="h-5 w-5" />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// ─── Complete Habit Dialog ────────────────────────────────────────────────────

function CompleteHabitDialog({
  open,
  habitTitle,
  habitId,
  occurrenceId,
  targetDuration,
  onClose,
}: {
  open: boolean
  habitTitle: string
  habitId: string
  occurrenceId: string
  targetDuration: number
  onClose: () => void
}) {
  const completeOccurrence = useHabitsStore((s) => s.completeOccurrence)

  const form = useForm<CompleteHabitForm>({
    resolver: zodResolver(completeHabitSchema),
    defaultValues: { durationMinutes: targetDuration, note: "" },
  })

  useEffect(() => {
    if (open) form.reset({ durationMinutes: targetDuration, note: "" })
  }, [open, targetDuration, form])

  const onSubmit = async (data: CompleteHabitForm) => {
    try {
      await completeOccurrence(habitId, occurrenceId, {
        durationMinutes: data.durationMinutes,
        note: data.note || undefined,
      })
      toast.success("Habit completed! 🌱", `Great work on "${habitTitle}"`)
      onClose()
    } catch {
      toast.error("Failed to complete habit", "Please try again.")
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-500" />
            Mark Habit Done
          </DialogTitle>
        </DialogHeader>

        <p className="text-sm text-muted-foreground -mt-1">
          How long did you work on{" "}
          <strong className="text-foreground">{habitTitle}</strong>?
        </p>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="dur">Duration (minutes)</Label>
            <Input
              id="dur"
              type="number"
              min={1}
              {...form.register("durationMinutes", { valueAsNumber: true })}
            />
            {form.formState.errors.durationMinutes && (
              <p className="text-xs text-destructive">
                {form.formState.errors.durationMinutes.message}
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="habit-note">Note (optional)</Label>
            <Textarea
              id="habit-note"
              placeholder="How did it go?"
              rows={2}
              {...form.register("note")}
            />
          </div>

          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline" type="button">
                Cancel
              </Button>
            </DialogClose>
            <Button type="submit" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? "Saving…" : "Complete"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// ─── Manual Session Dialog ────────────────────────────────────────────────────

function ManualSessionDialog({
  open,
  onClose,
  tasks,
}: {
  open: boolean
  onClose: () => void
  tasks: Task[]
}) {
  const form = useForm<ManualSessionForm>({
    resolver: zodResolver(manualSessionSchema),
    defaultValues: { taskId: "", durationMinutes: 25, note: "" },
  })

  useEffect(() => {
    if (open) form.reset({ taskId: "", durationMinutes: 25, note: "" })
  }, [open, form])

  const onSubmit = async (data: ManualSessionForm) => {
    try {
      await createManualSession({
        taskId: data.taskId,
        durationMinutes: data.durationMinutes,
        note: data.note || undefined,
      })
      toast.success("Session logged!", "Your focus time has been recorded.")
      onClose()
    } catch {
      toast.error("Failed to log session", "Please try again.")
    }
  }

  const activeTasks = tasks.filter(
    (t) => t.status !== "COMPLETED" && t.status !== "CANCELLED"
  )

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary" />
            Log a Focus Session
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1.5">
            <Label>Task</Label>
            <Select
              value={form.watch("taskId")}
              onValueChange={(v) =>
                form.setValue("taskId", v, { shouldValidate: true })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a task…" />
              </SelectTrigger>
              <SelectContent>
                {activeTasks.length === 0 ? (
                  <div className="px-2 py-4 text-sm text-muted-foreground text-center">
                    No active tasks
                  </div>
                ) : (
                  activeTasks.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.title}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
            {form.formState.errors.taskId && (
              <p className="text-xs text-destructive">
                {form.formState.errors.taskId.message}
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="session-dur">Duration (minutes)</Label>
            <Input
              id="session-dur"
              type="number"
              min={1}
              {...form.register("durationMinutes", { valueAsNumber: true })}
            />
            {form.formState.errors.durationMinutes && (
              <p className="text-xs text-destructive">
                {form.formState.errors.durationMinutes.message}
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="session-note">Note (optional)</Label>
            <Textarea
              id="session-note"
              placeholder="What did you accomplish?"
              rows={2}
              {...form.register("note")}
            />
          </div>

          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline" type="button">
                Cancel
              </Button>
            </DialogClose>
            <Button type="submit" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? "Saving…" : "Log Session"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// ─── Today Habit Card ─────────────────────────────────────────────────────────

function TodayHabitCard({
  habit,
  onComplete,
  onSkip,
}: {
  habit: HabitItem
  onComplete: (h: HabitItem) => void
  onSkip: (h: HabitItem) => void
}) {
  const status = habit.occurrenceStatus ?? "PENDING"

  return (
    <Card
      className={cn(
        "min-w-[175px] w-[175px] shrink-0 transition-all duration-200",
        status === "COMPLETED" &&
          "border-green-500/40 bg-green-500/[0.04] dark:bg-green-500/[0.06]",
        status === "SKIPPED" && "opacity-55"
      )}
    >
      <CardContent className="p-4 flex flex-col gap-3 h-full">
        {/* Status icon + badge */}
        <div className="flex items-center justify-between">
          {status === "COMPLETED" ? (
            <CheckCircle className="h-4 w-4 text-green-500" />
          ) : status === "SKIPPED" ? (
            <SkipForward className="h-4 w-4 text-muted-foreground" />
          ) : (
            <Circle className="h-4 w-4 text-muted-foreground" />
          )}
          <Badge
            variant={
              status === "COMPLETED"
                ? "success"
                : status === "SKIPPED"
                ? "outline"
                : "secondary"
            }
            className="text-[10px] px-1.5 py-0"
          >
            {status === "COMPLETED"
              ? "Done"
              : status === "SKIPPED"
              ? "Skipped"
              : "Pending"}
          </Badge>
        </div>

        {/* Title */}
        <div className="flex-1">
          <p
            className={cn(
              "text-sm font-semibold leading-snug",
              status === "SKIPPED" && "line-through text-muted-foreground"
            )}
          >
            {habit.title}
          </p>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            {habit.targetDuration} min target
          </p>
        </div>

        {/* Actions */}
        {status === "PENDING" && habit.occurrenceId && (
          <div className="flex gap-1.5">
            <Button
              size="sm"
              className="h-7 text-xs flex-1"
              onClick={() => onComplete(habit)}
            >
              Done
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="h-7 text-xs px-2 text-muted-foreground hover:text-foreground"
              onClick={() => onSkip(habit)}
            >
              Skip
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// ─── Task List Item ───────────────────────────────────────────────────────────

const PRIORITY_VARIANT = {
  HIGH: "destructive",
  MEDIUM: "warning",
  LOW: "secondary",
} as const

function TaskListItem({ task }: { task: Task }) {
  const done = task.status === "COMPLETED"

  return (
    <div className="flex items-center gap-3 py-2.5 group min-w-0">
      <div
        className={cn(
          "h-4 w-4 rounded-full border-2 shrink-0 transition-colors duration-200",
          done
            ? "bg-green-500 border-green-500"
            : "border-muted-foreground/35 group-hover:border-primary"
        )}
      />

      <div className="flex-1 min-w-0">
        <p
          className={cn(
            "text-sm font-medium leading-snug truncate",
            done && "line-through text-muted-foreground"
          )}
        >
          {task.title}
        </p>
        {task.estimatedDuration != null && (
          <p className="text-[11px] text-muted-foreground">
            ~{task.estimatedDuration} min
          </p>
        )}
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <Badge
          variant={PRIORITY_VARIANT[task.priority]}
          className="text-[10px] px-1.5 hidden sm:inline-flex"
        >
          {task.priority}
        </Badge>
        {!done && (
          <Button
            size="icon"
            variant="ghost"
            className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
            asChild
          >
            <Link href={`/timer/${task.id}`}>
              <Play className="h-3.5 w-3.5" />
            </Link>
          </Button>
        )}
      </div>
    </div>
  )
}

// ─── Section Header ───────────────────────────────────────────────────────────

function SectionHeader({
  icon: Icon,
  iconColor,
  title,
  href,
  linkLabel = "View all",
}: {
  icon: React.ElementType
  iconColor: string
  title: string
  href?: string
  linkLabel?: string
}) {
  return (
    <div className="flex items-center justify-between mb-4">
      <h2 className="text-base font-semibold flex items-center gap-2">
        <Icon className={cn("h-4 w-4", iconColor)} />
        {title}
      </h2>
      {href && (
        <Button variant="ghost" size="sm" className="h-8 text-xs gap-1" asChild>
          <Link href={href}>
            {linkLabel}
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </Button>
      )}
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  // Stores
  const user = useAuthStore((s) => s.user)

  const {
    dashboard,
    dailyRange,
    loading: analyticsLoading,
    fetchDashboard,
    fetchDailyRange,
  } = useAnalyticsStore()

  const {
    todaysHabits,
    loading: habitsLoading,
    fetchDueToday,
    skipOccurrence,
  } = useHabitsStore()

  const { tasks, loading: tasksLoading, fetchTasks } = useTasksStore()
  const { goals, loading: goalsLoading, fetchGoals } = useGoalsStore()

  // Local state
  const [completeDialog, setCompleteDialog] = useState<{
    open: boolean
    habit: HabitItem | null
  }>({ open: false, habit: null })
  const [manualSessionOpen, setManualSessionOpen] = useState(false)

  // Data fetch on mount
  useEffect(() => {
    const today = new Date()
    const todayStr = toDateStr(today)
    const start = new Date(today)
    start.setDate(today.getDate() - 30)

    fetchDashboard()
    fetchDueToday()
    fetchTasks({ date: todayStr })
    fetchGoals({ status: "ACTIVE" })
    fetchDailyRange(toDateStr(start), todayStr)
  }, [fetchDashboard, fetchDueToday, fetchTasks, fetchGoals, fetchDailyRange])

  // Computed: consecutive focus streak from daily range
  const focusStreak = useMemo(() => {
    if (!dailyRange.length) return 0
    const sorted = [...dailyRange].sort((a, b) => b.date.localeCompare(a.date))
    let streak = 0
    for (const day of sorted) {
      if (day.totalFocusMinutes > 0 || day.completedHabits > 0) streak++
      else break
    }
    return streak
  }, [dailyRange])

  // Dashboard stats
  const totalFocusMins = dashboard?.daily?.totalFocusMinutes ?? 0
  const completedTasks = dashboard?.daily?.completedTasks ?? 0
  const completedHabits = dashboard?.daily?.completedHabits ?? 0
  const totalTasks = tasks.length
  const totalHabits = todaysHabits.length
  const timeLeaks = dashboard?.daily?.timeLeaks ?? []
  const goalsAnalytics = dashboard?.goals ?? []
  const top3Goals = goals.slice(0, 3)

  // Handlers
  const handleSkip = async (habit: HabitItem) => {
    if (!habit.occurrenceId) return
    try {
      await skipOccurrence(habit.id, habit.occurrenceId)
      toast.success("Skipped for today", `"${habit.title}" marked as skipped.`)
    } catch {
      toast.error("Failed to skip", "Please try again.")
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="relative min-h-full overflow-x-clip bg-background">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-24 left-1/2 h-72 w-[42rem] -translate-x-1/2 rounded-full opacity-25 blur-3xl"
        style={{
          background:
            "radial-gradient(circle, oklch(0.6 0.25 280) 0%, transparent 65%)",
        }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute right-[-10rem] top-[20rem] h-80 w-80 rounded-full opacity-20 blur-3xl"
        style={{
          background:
            "radial-gradient(circle, oklch(0.65 0.22 320) 0%, transparent 65%)",
        }}
      />

      <div className="relative mx-auto max-w-7xl space-y-6 px-4 py-6 sm:space-y-8 sm:px-6 sm:py-8 lg:px-8">

        {/* ── Header ──────────────────────────────────────────────────────── */}
        <div className="relative overflow-hidden rounded-3xl border border-border/70 bg-card/70 p-5 backdrop-blur-sm sm:p-7">
          <div
            aria-hidden="true"
            className="absolute inset-0 opacity-60"
            style={{
              background:
                "linear-gradient(130deg, rgba(129,140,248,0.18) 0%, rgba(192,132,252,0.12) 48%, rgba(244,114,182,0.18) 100%)",
            }}
          />

          <div className="relative flex flex-col gap-4 sm:gap-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h1 className="text-2xl font-bold tracking-tight sm:text-3xl lg:text-4xl">
                  {getGreeting()}
                  {user?.firstname ? `, ${user.firstname}` : ""}! 👋
                </h1>
                <p className="mt-2 flex items-center gap-1.5 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  {formatToday()}
                </p>
              </div>

              <Badge
                variant="secondary"
                className="w-fit border border-border/60 bg-background/70 px-2.5 py-1 text-[11px]"
              >
                <TrendingUp className="mr-1 h-3.5 w-3.5" />
                Build momentum daily
              </Badge>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button size="sm" className="h-8 gap-1.5" asChild>
                <Link href="/tasks">
                  <Timer className="h-3.5 w-3.5" />
                  Start focus block
                </Link>
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="h-8 gap-1.5 bg-background/70"
                onClick={() => setManualSessionOpen(true)}
              >
                <Clock className="h-3.5 w-3.5" />
                Log session
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="h-8 gap-1.5"
                asChild
              >
                <Link href="/goals">
                  <Target className="h-3.5 w-3.5" />
                  Review goals
                </Link>
              </Button>
            </div>
          </div>
        </div>

        {/* ── Stat Cards ──────────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 lg:gap-4">
          <StatCard
            icon={Clock}
            label="Focus Time Today"
            value={formatMinutes(totalFocusMins)}
            sub={
              totalFocusMins > 0
                ? `${Math.round(totalFocusMins / 60 * 10) / 10}h logged`
                : "No sessions yet"
            }
            iconBg="bg-blue-500/10 text-blue-500 dark:text-blue-400"
            loading={analyticsLoading}
          />
          <StatCard
            icon={CheckCircle}
            label="Tasks Completed"
            value={`${completedTasks} / ${totalTasks}`}
            sub={
              totalTasks > 0 && completedTasks === totalTasks
                ? "All done! 🎉"
                : totalTasks > 0
                ? `${totalTasks - completedTasks} remaining`
                : "No tasks today"
            }
            iconBg="bg-violet-500/10 text-violet-500 dark:text-violet-400"
            loading={analyticsLoading || tasksLoading}
          />
          <StatCard
            icon={Zap}
            label="Habits Done"
            value={`${completedHabits} / ${totalHabits}`}
            sub={
              totalHabits > 0 && completedHabits === totalHabits
                ? "Perfect day! ✨"
                : totalHabits > 0
                ? `${totalHabits - completedHabits} remaining`
                : "No habits due"
            }
            iconBg="bg-amber-500/10 text-amber-500 dark:text-amber-400"
            loading={analyticsLoading || habitsLoading}
          />
          <StatCard
            icon={Flame}
            label="Focus Streak"
            value={
              focusStreak > 0
                ? `🔥 ${focusStreak} day${focusStreak !== 1 ? "s" : ""}`
                : "— days"
            }
            sub={
              focusStreak > 0
                ? "Consecutive active days"
                : "Start your streak today!"
            }
            iconBg="bg-orange-500/10 text-orange-500 dark:text-orange-400"
            loading={analyticsLoading}
          />
        </div>

        {/* ── Main + Sidebar Grid ──────────────────────────────────────────── */}
        <div className="grid grid-cols-1 items-start gap-6 xl:grid-cols-12">

          {/* ── Left / Main (2 cols) ───────────────────────────────────── */}
          <div className="space-y-6 xl:col-span-8">

            {/* Today's Habits */}
            <section>
              <SectionHeader
                icon={Zap}
                iconColor="text-amber-500"
                title="Today's Habits"
                href="/habits"
              />

              {habitsLoading ? (
                <div className="flex gap-3 pb-2">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-40 w-44 shrink-0 rounded-xl" />
                  ))}
                </div>
              ) : todaysHabits.length === 0 ? (
                <Card className="border-dashed">
                  <CardContent className="py-10 text-center">
                    <Leaf className="h-8 w-8 mx-auto mb-3 text-muted-foreground/30" />
                    <p className="text-sm text-muted-foreground">
                      No habits scheduled for today
                    </p>
                    <Button size="sm" variant="outline" className="mt-3" asChild>
                      <Link href="/habits">
                        <Plus className="h-3.5 w-3.5 mr-1.5" />
                        Add a habit
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="scrollbar-none -mx-1 flex snap-x snap-mandatory gap-3 overflow-x-auto px-1 pb-2">
                  {todaysHabits.map((h) => (
                    <div key={h.id} className="snap-start">
                      <TodayHabitCard
                        habit={h}
                        onComplete={(habit) =>
                          setCompleteDialog({ open: true, habit })
                        }
                        onSkip={handleSkip}
                      />
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* Today's Tasks */}
            <section>
              <SectionHeader
                icon={CheckCircle}
                iconColor="text-violet-500"
                title="Today's Tasks"
                href="/tasks"
              />

              <Card>
                {tasksLoading ? (
                  <CardContent className="p-4 space-y-3">
                    {[1, 2, 3, 4].map((i) => (
                      <Skeleton key={i} className="h-10 w-full rounded-lg" />
                    ))}
                  </CardContent>
                ) : tasks.length === 0 ? (
                  <CardContent className="py-10 text-center">
                    <Circle className="h-8 w-8 mx-auto mb-3 text-muted-foreground/30" />
                    <p className="text-sm text-muted-foreground mb-3">
                      Nothing scheduled for today
                    </p>
                    <Button size="sm" variant="outline" asChild>
                      <Link href="/tasks">
                        <Plus className="h-3.5 w-3.5 mr-1.5" />
                        Add a task
                      </Link>
                    </Button>
                  </CardContent>
                ) : (
                  <CardContent className="p-0">
                    <div className="divide-y divide-border/60 px-4">
                      {tasks.slice(0, 7).map((task) => (
                        <TaskListItem key={task.id} task={task} />
                      ))}
                    </div>
                    {tasks.length > 7 && (
                      <>
                        <Separator />
                        <div className="p-3 text-center">
                          <Button variant="ghost" size="sm" asChild>
                            <Link href="/tasks">
                              View {tasks.length - 7} more tasks
                              <ArrowRight className="h-3.5 w-3.5 ml-1" />
                            </Link>
                          </Button>
                        </div>
                      </>
                    )}
                  </CardContent>
                )}
              </Card>
            </section>
          </div>

          {/* ── Right Sidebar (1 col) ──────────────────────────────────── */}
          <div className="space-y-5 xl:col-span-4 xl:sticky xl:top-6">

            {/* Quick Actions */}
            <Card>
              <CardHeader className="pb-3 pt-5">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Activity className="h-4 w-4 text-primary" />
                  Quick Actions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 pb-5">
                <Button className="w-full justify-start gap-2.5 h-9" asChild>
                  <Link href="/tasks">
                    <Timer className="h-4 w-4" />
                    Start Focus Timer
                  </Link>
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start gap-2.5 h-9"
                  onClick={() => setManualSessionOpen(true)}
                >
                  <Clock className="h-4 w-4" />
                  Log Manual Session
                </Button>
                <Button
                  variant="secondary"
                  className="w-full justify-start gap-2.5 h-9"
                  asChild
                >
                  <Link href="/tasks">
                    <Plus className="h-4 w-4" />
                    Add New Task
                  </Link>
                </Button>
                <Button
                  variant="ghost"
                  className="w-full justify-start gap-2.5 h-9 text-muted-foreground"
                  asChild
                >
                  <Link href="/habits">
                    <Zap className="h-4 w-4" />
                    Manage Habits
                  </Link>
                </Button>
              </CardContent>
            </Card>

            {/* Active Goals */}
            <section>
              <SectionHeader
                icon={Target}
                iconColor="text-primary"
                title="Active Goals"
                href="/goals"
              />

              {goalsLoading ? (
                <div className="space-y-3">
                  {[1, 2].map((i) => (
                    <Skeleton key={i} className="h-24 rounded-xl" />
                  ))}
                </div>
              ) : top3Goals.length === 0 ? (
                <Card className="border-dashed">
                  <CardContent className="py-8 text-center">
                    <Target className="h-7 w-7 mx-auto mb-2 text-muted-foreground/30" />
                    <p className="text-sm text-muted-foreground">
                      No active goals
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-3">
                  {top3Goals.map((goal) => {
                    const analytics = goalsAnalytics.find(
                      (a) => a.goalId === goal.id
                    )
                    const progress =
                      analytics?.completionPercent ??
                      goal.progress?.score ??
                      0
                    const isOnTrack = analytics?.isOnTrack ?? true

                    return (
                      <Card
                        key={goal.id}
                        className="hover:shadow-sm transition-shadow duration-200"
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between gap-2 mb-2.5">
                            <p className="text-sm font-medium leading-snug flex-1">
                              {goal.title}
                            </p>
                            <Badge
                              variant={isOnTrack ? "success" : "warning"}
                              className="text-[10px] shrink-0"
                            >
                              {isOnTrack ? "On Track" : "Behind"}
                            </Badge>
                          </div>
                          <Progress
                            value={Math.round(progress)}
                            className="h-1.5 mb-2"
                          />
                          <div className="flex justify-between text-[11px] text-muted-foreground">
                            <span>{Math.round(progress)}% complete</span>
                            <span className="capitalize">
                              {goal.category.toLowerCase()}
                            </span>
                          </div>
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              )}
            </section>

            {/* This Week summary */}
            {dashboard?.weekly && (
              <Card>
                <CardHeader className="pb-3 pt-5">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <BarChart3 className="h-4 w-4 text-primary" />
                    This Week
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2.5 pb-4">
                  {[
                    {
                      label: "Total focus",
                      value: formatMinutes(dashboard.weekly.totalFocusMinutes),
                    },
                    {
                      label: "Tasks completed",
                      value: String(dashboard.weekly.completedTasks),
                    },
                    {
                      label: "Daily average",
                      value: formatMinutes(
                        Math.round(dashboard.weekly.avgDailyFocus)
                      ),
                    },
                    ...(dashboard.weekly.bestDay
                      ? [
                          {
                            label: "Best day",
                            value:
                              dashboard.weekly.bestDay.charAt(0).toUpperCase() +
                              dashboard.weekly.bestDay.slice(1).toLowerCase(),
                          },
                        ]
                      : []),
                  ].map(({ label, value }) => (
                    <div
                      key={label}
                      className="flex justify-between items-center text-sm"
                    >
                      <span className="text-muted-foreground">{label}</span>
                      <span className="font-semibold">{value}</span>
                    </div>
                  ))}

                  <Separator className="my-1" />

                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full gap-1 h-8 text-xs"
                    asChild
                  >
                    <Link href="/analytics">
                      Full analytics
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Estimation accuracy */}
            {dashboard?.estimation && (
              <Card>
                <CardHeader className="pb-2 pt-5">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-primary" />
                    Estimation Accuracy
                  </CardTitle>
                </CardHeader>
                <CardContent className="pb-5">
                  <div className="flex items-end gap-2.5 mb-1.5">
                    <span className="text-4xl font-bold tabular-nums">
                      {Math.round(dashboard.estimation.rollingAverage)}%
                    </span>
                    <Badge
                      variant={
                        dashboard.estimation.trend === "IMPROVING"
                          ? "success"
                          : dashboard.estimation.trend === "DECLINING"
                          ? "destructive"
                          : "secondary"
                      }
                      className="mb-1"
                    >
                      {dashboard.estimation.trend}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Based on {dashboard.estimation.sampleCount} session
                    {dashboard.estimation.sampleCount !== 1 ? "s" : ""}
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Time leaks alert */}
            {timeLeaks.length > 0 && (
              <Card className="border-amber-500/40 bg-amber-500/5">
                <CardContent className="p-4 flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-amber-700 dark:text-amber-400">
                      {timeLeaks.length} time leak
                      {timeLeaks.length > 1 ? "s" : ""} detected today
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Large unaccounted gaps between sessions.
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* ── Dialogs ───────────────────────────────────────────────────────── */}
      <CompleteHabitDialog
        open={completeDialog.open}
        habitTitle={completeDialog.habit?.title ?? ""}
        habitId={completeDialog.habit?.id ?? ""}
        occurrenceId={completeDialog.habit?.occurrenceId ?? ""}
        targetDuration={completeDialog.habit?.targetDuration ?? 30}
        onClose={() => setCompleteDialog({ open: false, habit: null })}
      />

      <ManualSessionDialog
        open={manualSessionOpen}
        onClose={() => setManualSessionOpen(false)}
        tasks={tasks}
      />
    </div>
  )
}