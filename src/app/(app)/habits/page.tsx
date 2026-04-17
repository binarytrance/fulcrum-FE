"use client"

import { useEffect, useState, useCallback, useMemo } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import {
  Repeat,
  Plus,
  MoreHorizontal,
  CheckCircle2,
  SkipForward,
  Circle,
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
} from "lucide-react"
import type {
  Habit,
  HabitFrequency,
  HabitStatus,
  CreateHabitDto,
  UpdateHabitDto,
  OccurrenceStatus,
} from "@/types"
import { useHabitsStore } from "@/store/habits-store"
import { useGoalsStore } from "@/store/goals-store"
import { toast } from "@/components/ui/toast"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
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
  FormDescription,
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

// ─── Types (local extension) ──────────────────────────────────────────────────

type DueTodayEntry = Habit & {
  occurrenceId?: string
  occurrenceStatus?: OccurrenceStatus
}

// ─── Constants ────────────────────────────────────────────────────────────────

const DAYS_OF_WEEK = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

// ─── Zod Schemas ──────────────────────────────────────────────────────────────

const habitFormSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  goalId: z.string().optional(),
  frequency: z.enum(["daily", "specific_days"]),
  daysOfWeek: z.array(z.number()).optional(),
  targetDuration: z.number().min(1, "At least 1 minute"),
})

type HabitFormValues = z.infer<typeof habitFormSchema>

const completeHabitSchema = z.object({
  durationMinutes: z.number().min(1, "At least 1 minute"),
  note: z.string().optional(),
})

type CompleteHabitValues = z.infer<typeof completeHabitSchema>

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDuration(mins: number): string {
  if (mins < 60) return `${mins}m`
  const h = Math.floor(mins / 60)
  const m = mins % 60
  return m > 0 ? `${h}h ${m}m` : `${h}h`
}

function frequencyLabel(h: Habit): string {
  if (h.frequency === "daily") return "Daily"
  if (!h.daysOfWeek?.length) return "Custom"
  const sorted = [...h.daysOfWeek].sort((a, b) => a - b)
  if (sorted.length === 5 && !sorted.includes(0) && !sorted.includes(6)) return "Weekdays"
  if (sorted.length === 2 && sorted.includes(0) && sorted.includes(6)) return "Weekends"
  return sorted.map((d) => DAYS_OF_WEEK[d]).join(", ")
}

function occurrenceStatusIcon(
  status: OccurrenceStatus | undefined,
  size = 16
): JSX.Element {
  if (status === "COMPLETED")
    return <CheckCircle2 size={size} className="text-emerald-500" />
  if (status === "SKIPPED")
    return <SkipForward size={size} className="text-amber-500" />
  return <Circle size={size} className="text-muted-foreground/40" />
}

// ─── Complete Habit Dialog ────────────────────────────────────────────────────

interface CompleteHabitDialogProps {
  open: boolean
  habit: DueTodayEntry | null
  onClose: () => void
  onComplete: (durationMinutes: number, note?: string) => Promise<void>
}

function CompleteHabitDialog({
  open,
  habit,
  onClose,
  onComplete,
}: CompleteHabitDialogProps) {
  const [submitting, setSubmitting] = useState(false)

  const form = useForm<CompleteHabitValues>({
    resolver: zodResolver(completeHabitSchema),
    defaultValues: {
      durationMinutes: habit?.targetDuration ?? 30,
      note: "",
    },
  })

  useEffect(() => {
    if (open && habit) {
      form.reset({ durationMinutes: habit.targetDuration, note: "" })
    }
  }, [open, habit]) // eslint-disable-line react-hooks/exhaustive-deps

  const onSubmit = async (data: CompleteHabitValues) => {
    setSubmitting(true)
    try {
      await onComplete(data.durationMinutes, data.note || undefined)
      onClose()
    } finally {
      setSubmitting(false)
    }
  }

  const efficiency = useMemo(() => {
    const v = form.watch("durationMinutes")
    if (!habit?.targetDuration || !v) return null
    return Math.round((habit.targetDuration / v) * 100)
  }, [form.watch("durationMinutes"), habit]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <Dialog open={open} onOpenChange={(v) => !v && !submitting && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="flex size-7 items-center justify-center rounded-full bg-emerald-500/15">
              <CheckCircle2 className="size-4 text-emerald-600" />
            </div>
            Mark Habit Done
          </DialogTitle>
          {habit && (
            <DialogDescription>Log your session for "{habit.title}".</DialogDescription>
          )}
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-1">
            <FormField
              control={form.control}
              name="durationMinutes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Duration (min) <span className="text-destructive">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={1}
                      step={1}
                      value={field.value ?? ""}
                      onChange={(e) =>
                        field.onChange(
                          e.target.value === "" ? undefined : parseInt(e.target.value, 10)
                        )
                      }
                    />
                  </FormControl>
                  {habit?.targetDuration && (
                    <FormDescription className="text-xs">
                      Target: {habit.targetDuration}m
                      {efficiency !== null && (
                        <span
                          className={cn(
                            "ml-2 font-medium",
                            efficiency >= 100 ? "text-emerald-600" : "text-amber-600"
                          )}
                        >
                          ({efficiency >= 100 ? "✓ " : ""}{efficiency}% efficiency)
                        </span>
                      )}
                    </FormDescription>
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
                  <FormLabel>Note (optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="How did it go?"
                      rows={2}
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="gap-2 sm:gap-0">
              <Button type="button" variant="outline" onClick={onClose} disabled={submitting}>
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={submitting}
                className="bg-emerald-600 hover:bg-emerald-700 text-white border-0"
              >
                {submitting ? (
                  <span className="flex items-center gap-2">
                    <span className="size-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                    Saving…
                  </span>
                ) : (
                  "Mark Done"
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

// ─── Create/Edit Habit Dialog ─────────────────────────────────────────────────

interface CreateEditHabitDialogProps {
  open: boolean
  editingHabit?: Habit | null
  onClose: () => void
  goalOptions: { id: string; title: string }[]
}

function CreateEditHabitDialog({
  open,
  editingHabit,
  onClose,
  goalOptions,
}: CreateEditHabitDialogProps) {
  const { createHabit, updateHabit } = useHabitsStore()
  const [submitting, setSubmitting] = useState(false)

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
  })

  const frequency = form.watch("frequency")
  const selectedDays = form.watch("daysOfWeek") ?? []

  useEffect(() => {
    if (!open) return
    if (editingHabit) {
      form.reset({
        title: editingHabit.title,
        description: editingHabit.description ?? "",
        goalId: editingHabit.goalId ?? "",
        frequency: editingHabit.frequency,
        daysOfWeek: editingHabit.daysOfWeek ?? [],
        targetDuration: editingHabit.targetDuration,
      })
    } else {
      form.reset({
        title: "",
        description: "",
        goalId: "",
        frequency: "daily",
        daysOfWeek: [],
        targetDuration: 30,
      })
    }
  }, [open, editingHabit]) // eslint-disable-line react-hooks/exhaustive-deps

  const toggleDay = (day: number) => {
    const curr = form.getValues("daysOfWeek") ?? []
    form.setValue(
      "daysOfWeek",
      curr.includes(day) ? curr.filter((d) => d !== day) : [...curr, day],
      { shouldDirty: true }
    )
  }

  const onSubmit = async (data: HabitFormValues) => {
    setSubmitting(true)
    try {
      if (editingHabit) {
        const update: UpdateHabitDto = {
          title: data.title,
          description: data.description || undefined,
          daysOfWeek: data.frequency === "specific_days" ? data.daysOfWeek : undefined,
          targetDuration: data.targetDuration,
        }
        await updateHabit(editingHabit.id, update)
        toast.success("Habit updated")
      } else {
        const create: CreateHabitDto = {
          title: data.title,
          description: data.description || undefined,
          goalId: data.goalId && data.goalId !== "none" ? data.goalId : "",
          frequency: data.frequency,
          daysOfWeek: data.frequency === "specific_days" ? data.daysOfWeek : undefined,
          targetDuration: data.targetDuration,
        }
        await createHabit(create)
        toast.success("Habit created!")
      }
      onClose()
    } catch (err) {
      toast.error(
        editingHabit ? "Failed to update habit" : "Failed to create habit",
        err instanceof Error ? err.message : undefined
      )
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
              <Repeat className="size-4 text-violet-600 dark:text-violet-400" />
            </div>
            {editingHabit ? "Edit Habit" : "New Habit"}
          </DialogTitle>
          <DialogDescription>
            {editingHabit
              ? "Update your habit details."
              : "Build a consistent routine that compounds over time."}
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
                    <Input placeholder="e.g. Morning meditation" autoFocus {...field} />
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
                      placeholder="What does this habit involve?"
                      rows={2}
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {!editingHabit && goalOptions.length > 0 && (
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
                        {goalOptions.map((g) => (
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

            <div className="grid grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="frequency"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Frequency <span className="text-destructive">*</span>
                    </FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="daily">📅 Daily</SelectItem>
                        <SelectItem value="specific_days">🗓 Specific Days</SelectItem>
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
                    <FormLabel>
                      Target Duration (min) <span className="text-destructive">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={1}
                        step={1}
                        value={field.value ?? ""}
                        onChange={(e) =>
                          field.onChange(
                            e.target.value === "" ? undefined : parseInt(e.target.value, 10)
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
                    <FormLabel>Days of Week</FormLabel>
                    <div className="flex gap-1.5 flex-wrap">
                      {DAYS_OF_WEEK.map((d, i) => (
                        <button
                          key={d}
                          type="button"
                          onClick={() => toggleDay(i)}
                          className={cn(
                            "w-10 h-8 text-xs font-medium rounded-lg border transition-all",
                            selectedDays.includes(i)
                              ? "bg-violet-500 text-white border-violet-500 shadow-sm shadow-violet-500/25"
                              : "bg-muted/50 text-muted-foreground border-border hover:border-violet-400 hover:text-foreground"
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

            <DialogFooter className="pt-2 gap-2 sm:gap-0">
              <Button type="button" variant="outline" onClick={onClose} disabled={submitting}>
                Cancel
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? (
                  <span className="flex items-center gap-2">
                    <span className="size-3.5 rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground animate-spin" />
                    {editingHabit ? "Saving…" : "Creating…"}
                  </span>
                ) : editingHabit ? (
                  "Save Changes"
                ) : (
                  "Create Habit"
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

// ─── Delete Dialog ────────────────────────────────────────────────────────────

interface DeleteDialogProps {
  open: boolean
  habitTitle: string
  loading: boolean
  onConfirm: () => void
  onClose: () => void
}

function DeleteDialog({ open, habitTitle, loading, onConfirm, onClose }: DeleteDialogProps) {
  return (
    <Dialog open={open} onOpenChange={(v) => !v && !loading && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="size-5 text-destructive" />
            Delete Habit
          </DialogTitle>
          <DialogDescription>
            Permanently delete "{habitTitle}"? All progress and streaks will be lost.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={onConfirm} disabled={loading}>
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="size-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                Deleting…
              </span>
            ) : (
              "Delete"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ─── Today Habit Card ─────────────────────────────────────────────────────────

interface TodayHabitCardProps {
  habit: DueTodayEntry
  onMarkDone: (h: DueTodayEntry) => void
  onSkip: (h: DueTodayEntry) => void
  skipping: boolean
}

function TodayHabitCard({ habit, onMarkDone, onSkip, skipping }: TodayHabitCardProps) {
  const isDone = habit.occurrenceStatus === "COMPLETED"
  const isSkipped = habit.occurrenceStatus === "SKIPPED"
  const isTerminal = isDone || isSkipped

  return (
    <Card
      className={cn(
        "rounded-2xl border border-border/70 bg-card/80 backdrop-blur-sm transition-all",
        isDone && "opacity-60 saturate-50 border-emerald-500/20 bg-emerald-500/[0.02]",
        isSkipped && "opacity-50 saturate-50"
      )}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-2.5">
            <div className="mt-0.5 shrink-0">
              {occurrenceStatusIcon(habit.occurrenceStatus, 18)}
            </div>
            <div className="min-w-0">
              <p className={cn("text-sm font-semibold leading-snug", isTerminal && "line-through text-muted-foreground")}>
                {habit.title}
              </p>
              <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[10px] text-muted-foreground">
                <span className="flex items-center gap-0.5">
                  <Clock className="size-2.5" />
                  {formatDuration(habit.targetDuration)}
                </span>
                <span className="flex items-center gap-0.5">
                  <Repeat className="size-2.5" />
                  {frequencyLabel(habit)}
                </span>
              </div>
            </div>
          </div>

          {!isTerminal && (
            <div className="flex items-center gap-1.5 shrink-0">
              <Button
                size="sm"
                onClick={() => onMarkDone(habit)}
                className="h-7 px-2.5 text-xs bg-emerald-600 hover:bg-emerald-700 text-white border-0"
              >
                <CheckCircle2 className="size-3.5" />
                Done
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => onSkip(habit)}
                disabled={skipping}
                className="h-7 px-2 text-xs text-muted-foreground"
              >
                <SkipForward className="size-3.5" />
                Skip
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

// ─── All Habit Card ───────────────────────────────────────────────────────────

interface AllHabitCardProps {
  habit: Habit
  onEdit: (h: Habit) => void
  onDelete: (h: Habit) => void
  onRefresh: () => void
}

function AllHabitCard({ habit, onEdit, onDelete, onRefresh }: AllHabitCardProps) {
  const { pauseHabit, resumeHabit } = useHabitsStore()
  const [actionLoading, setActionLoading] = useState(false)
  const isActive = habit.status === "active"
  const isPaused = habit.status === "paused"

  const handleTogglePause = async () => {
    setActionLoading(true)
    try {
      if (isActive) {
        await pauseHabit(habit.id)
        toast.success("Habit paused")
      } else {
        await resumeHabit(habit.id)
        toast.success("Habit resumed")
      }
      onRefresh()
    } catch (err) {
      toast.error("Failed to update habit", err instanceof Error ? err.message : undefined)
    } finally {
      setActionLoading(false)
    }
  }

  return (
    <Card
      className={cn(
        "rounded-2xl border border-border/70 bg-card/80 backdrop-blur-sm transition-all hover:border-border hover:shadow-sm",
        isPaused && "opacity-60"
      )}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold leading-snug truncate">{habit.title}</p>
            {habit.description && (
              <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                {habit.description}
              </p>
            )}
            <div className="mt-2 flex flex-wrap items-center gap-1.5">
              <Badge
                variant={isActive ? "success" : isPaused ? "warning" : "secondary"}
                className="text-[10px] px-1.5 py-0 capitalize"
              >
                {habit.status}
              </Badge>
              <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                <Repeat className="size-2.5" />
                {frequencyLabel(habit)}
              </span>
              <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                <Clock className="size-2.5" />
                {formatDuration(habit.targetDuration)}
              </span>
            </div>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="size-7 shrink-0 opacity-50 hover:opacity-100"
                disabled={actionLoading}
              >
                <MoreHorizontal className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40">
              <DropdownMenuLabel className="text-xs">Actions</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => onEdit(habit)}>
                <Edit2 className="size-3.5" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleTogglePause}>
                {isActive ? (
                  <>
                    <Pause className="size-3.5" />
                    Pause
                  </>
                ) : (
                  <>
                    <Play className="size-3.5" />
                    Resume
                  </>
                )}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem destructive onClick={() => onDelete(habit)}>
                <Trash2 className="size-3.5" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardContent>
    </Card>
  )
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function HabitCardSkeleton() {
  return (
    <div className="rounded-2xl border border-border/70 p-4 space-y-2">
      <div className="flex items-start gap-2.5">
        <Skeleton className="size-4.5 rounded-full shrink-0 mt-0.5" />
        <div className="flex-1 space-y-1.5">
          <Skeleton className="h-4 w-2/3" />
          <div className="flex gap-1.5">
            <Skeleton className="h-3 w-12 rounded-full" />
            <Skeleton className="h-3 w-16 rounded-full" />
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Habits Page ──────────────────────────────────────────────────────────────

export default function HabitsPage() {
  const {
    habits,
    todaysHabits,
    loading,
    fetchHabits,
    fetchDueToday,
    completeOccurrence,
    skipOccurrence,
    deleteHabit,
  } = useHabitsStore()
  const { goals, fetchGoals } = useGoalsStore()

  const [tab, setTab] = useState("today")
  const [allFilter, setAllFilter] = useState<HabitStatus | "all">("all")

  const [formOpen, setFormOpen] = useState(false)
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null)

  const [completingHabit, setCompletingHabit] = useState<DueTodayEntry | null>(null)
  const [completeOpen, setCompleteOpen] = useState(false)

  const [deletingHabit, setDeletingHabit] = useState<Habit | null>(null)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)

  const [skippingId, setSkippingId] = useState<string | null>(null)

  useEffect(() => {
    fetchGoals()
    fetchHabits()
    fetchDueToday()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const refresh = useCallback(() => {
    fetchHabits()
    fetchDueToday()
  }, [fetchHabits, fetchDueToday])

  const goalOptions = useMemo(
    () => goals.filter((g) => g.status === "ACTIVE"),
    [goals]
  )

  const filteredAllHabits = useMemo(() => {
    if (allFilter === "all") return habits
    return habits.filter((h) => h.status === allFilter)
  }, [habits, allFilter])

  const todayDone = useMemo(
    () => todaysHabits.filter((h) => h.occurrenceStatus === "COMPLETED").length,
    [todaysHabits]
  )
  const todayPct =
    todaysHabits.length > 0 ? Math.round((todayDone / todaysHabits.length) * 100) : 0

  const openCompleteDialog = useCallback((h: DueTodayEntry) => {
    setCompletingHabit(h)
    setCompleteOpen(true)
  }, [])

  const handleSkip = useCallback(
    async (h: DueTodayEntry) => {
      if (!h.occurrenceId) {
        toast.error("No occurrence to skip")
        return
      }
      setSkippingId(h.id)
      try {
        await skipOccurrence(h.id, h.occurrenceId)
        toast.success("Habit skipped")
        fetchDueToday()
      } catch (err) {
        toast.error("Failed to skip", err instanceof Error ? err.message : undefined)
      } finally {
        setSkippingId(null)
      }
    },
    [skipOccurrence, fetchDueToday]
  )

  const handleComplete = useCallback(
    async (durationMinutes: number, note?: string) => {
      if (!completingHabit?.occurrenceId) {
        toast.error("No occurrence to complete")
        return
      }
      await completeOccurrence(completingHabit.id, completingHabit.occurrenceId, {
        durationMinutes,
        note,
      })
      toast.success("🎉 Habit done!")
      fetchDueToday()
    },
    [completingHabit, completeOccurrence, fetchDueToday]
  )

  const handleDelete = useCallback(async () => {
    if (!deletingHabit) return
    setDeleteLoading(true)
    try {
      await deleteHabit(deletingHabit.id)
      toast.success("Habit deleted")
      setDeleteOpen(false)
      setDeletingHabit(null)
      fetchHabits()
    } catch (err) {
      toast.error("Failed to delete habit", err instanceof Error ? err.message : undefined)
    } finally {
      setDeleteLoading(false)
    }
  }, [deletingHabit, deleteHabit, fetchHabits])

  const openEdit = useCallback((h: Habit) => {
    setEditingHabit(h)
    setFormOpen(true)
  }, [])

  const openDelete = useCallback((h: Habit) => {
    setDeletingHabit(h)
    setDeleteOpen(true)
  }, [])

  const closeForm = useCallback(() => {
    setFormOpen(false)
    setEditingHabit(null)
    refresh()
  }, [refresh])

  return (
    <div className="relative min-h-screen overflow-x-hidden">
      {/* Ambient blobs */}
      <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div
          className="absolute top-0 left-0 h-[450px] w-[450px] rounded-full opacity-[0.05] blur-3xl dark:opacity-[0.09]"
          style={{ background: "radial-gradient(circle, oklch(0.6 0.25 280) 0%, transparent 65%)" }}
        />
        <div
          className="absolute bottom-20 right-0 h-[350px] w-[350px] rounded-full opacity-[0.04] blur-3xl dark:opacity-[0.07]"
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
                <Repeat className="size-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-indigo-400 via-violet-400 to-pink-400 bg-clip-text text-transparent">
                  Habits
                </h1>
                <p className="text-sm text-muted-foreground">
                  Build streaks. Make consistency your superpower.
                </p>
              </div>
            </div>

            <Button
              onClick={() => {
                setEditingHabit(null)
                setFormOpen(true)
              }}
              className="gap-1.5 bg-gradient-to-r from-indigo-500 via-violet-500 to-pink-500 text-white border-0 shadow-md shadow-violet-500/25 hover:shadow-lg hover:shadow-violet-500/30 transition-all"
            >
              <Plus className="size-4" />
              <span className="hidden sm:inline">New Habit</span>
              <span className="sm:hidden">New</span>
            </Button>
          </div>

          {/* Today summary strip */}
          {!loading && todaysHabits.length > 0 && (
            <div className="mt-5 flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-3 rounded-xl border border-border/60 bg-card/60 px-4 py-2 flex-1 min-w-[200px]">
                <div>
                  <p className="text-xs text-muted-foreground mb-0.5">Today's Progress</p>
                  <div className="flex items-center gap-2">
                    <Progress
                      value={todayPct}
                      className={cn(
                        "h-1.5 w-24",
                        todayPct >= 100 && "[&>div]:bg-emerald-500",
                        todayPct >= 50 && todayPct < 100 && "[&>div]:bg-violet-500",
                        todayPct < 50 && "[&>div]:bg-indigo-400"
                      )}
                    />
                    <span className="text-sm font-bold tabular-nums">
                      {todayDone}/{todaysHabits.length}
                    </span>
                  </div>
                </div>
              </div>

              {[
                { label: "Total Habits", value: habits.length, cls: "text-foreground" },
                {
                  label: "Active",
                  value: habits.filter((h) => h.status === "active").length,
                  cls: "text-violet-600 dark:text-violet-400",
                },
              ].map((s) => (
                <div
                  key={s.label}
                  className="flex items-center gap-2 rounded-xl border border-border/60 bg-card/60 px-3 py-2"
                >
                  <span className={cn("text-lg font-bold tabular-nums", s.cls)}>
                    {s.value}
                  </span>
                  <span className="text-xs text-muted-foreground">{s.label}</span>
                </div>
              ))}

              {todayDone === todaysHabits.length && todaysHabits.length > 0 && (
                <div className="flex items-center gap-1.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-2">
                  <Flame className="size-4 text-emerald-500" />
                  <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                    All done today!
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Main content */}
      <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6">
        <Tabs value={tab} onValueChange={setTab}>
          {/* Tab bar */}
          <TabsList className="mb-5">
            <TabsTrigger value="today" className="gap-1.5">
              <Calendar className="size-3.5" />
              Today
              {todaysHabits.length > 0 && (
                <span className="ml-0.5 text-[10px] opacity-60">
                  ({todaysHabits.filter((h) => !h.occurrenceStatus || h.occurrenceStatus === "PENDING").length} left)
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="all" className="gap-1.5">
              <Target className="size-3.5" />
              All Habits
              {habits.length > 0 && (
                <span className="ml-0.5 text-[10px] opacity-60">({habits.length})</span>
              )}
            </TabsTrigger>
          </TabsList>

          {/* Today tab */}
          <TabsContent value="today" className="mt-0">
            {loading ? (
              <div className="grid sm:grid-cols-2 gap-3">
                {[1, 2, 3, 4].map((i) => <HabitCardSkeleton key={i} />)}
              </div>
            ) : todaysHabits.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
                <div className="flex size-16 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500/10 via-violet-500/10 to-pink-500/10 border border-violet-500/20">
                  <Sparkles className="size-7 text-violet-500" />
                </div>
                <div>
                  <p className="font-semibold text-base">No habits due today</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Create a habit to start building your streak.
                  </p>
                </div>
                <Button
                  onClick={() => {
                    setEditingHabit(null)
                    setFormOpen(true)
                  }}
                  className="gap-1.5 bg-gradient-to-r from-indigo-500 via-violet-500 to-pink-500 text-white border-0"
                >
                  <Plus className="size-4" />
                  Create First Habit
                </Button>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 gap-3">
                {todaysHabits.map((h) => (
                  <TodayHabitCard
                    key={h.id}
                    habit={h}
                    onMarkDone={openCompleteDialog}
                    onSkip={handleSkip}
                    skipping={skippingId === h.id}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          {/* All habits tab */}
          <TabsContent value="all" className="mt-0">
            {/* Filter pills */}
            <div className="flex items-center gap-1.5 mb-4 flex-wrap">
              {(["all", "active", "paused"] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setAllFilter(f)}
                  className={cn(
                    "px-3 py-1 text-xs font-medium rounded-full border transition-all",
                    allFilter === f
                      ? "bg-violet-500 text-white border-violet-500 shadow-sm shadow-violet-500/25"
                      : "bg-muted/50 text-muted-foreground border-border hover:border-violet-400 hover:text-foreground"
                  )}
                >
                  {f.charAt(0).toUpperCase() + f.slice(1)}
                </button>
              ))}
            </div>

            {loading ? (
              <div className="grid sm:grid-cols-2 gap-3">
                {[1, 2, 3, 4].map((i) => <HabitCardSkeleton key={i} />)}
              </div>
            ) : filteredAllHabits.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
                <p className="text-sm font-semibold">
                  {habits.length === 0 ? "No habits yet" : "No habits match this filter"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {habits.length === 0
                    ? "Create one to start."
                    : "Try a different filter."}
                </p>
                {habits.length === 0 && (
                  <Button
                    size="sm"
                    onClick={() => {
                      setEditingHabit(null)
                      setFormOpen(true)
                    }}
                    className="gap-1 bg-gradient-to-r from-indigo-500 via-violet-500 to-pink-500 text-white border-0"
                  >
                    <Plus className="size-3.5" />
                    Create Habit
                  </Button>
                )}
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 gap-3">
                {filteredAllHabits.map((h) => (
                  <AllHabitCard
                    key={h.id}
                    habit={h}
                    onEdit={openEdit}
                    onDelete={openDelete}
                    onRefresh={fetchHabits}
                  />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Modals */}
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
          setCompleteOpen(false)
          setCompletingHabit(null)
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
            setDeleteOpen(false)
            setDeletingHabit(null)
          }}
        />
      )}
    </div>
  )
}
