"use client"

import { useEffect, useState, useCallback } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import {
  ArrowLeft,
  Edit2,
  Trash2,
  AlertTriangle,
  Pause,
  Play,
  Repeat,
  Flame,
  Clock,
  Calendar,
  CheckCircle2,
  SkipForward,
  Target,
  TrendingUp,
  MoreHorizontal,
  RefreshCw,
} from "lucide-react"
import type { Habit, HabitOccurrence, HabitAnalytics } from "@/types"
import { getHabit, getOccurrences, getHabitAnalytics, pauseHabit, resumeHabit, deleteHabit, updateHabit } from "@/lib/habits-api"
import { toast } from "@/components/ui/toast"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"

// ─── Types & Constants ───────────────────────────────────────────────────────

const DAYS_FULL = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
const DAYS_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
const OCCURRENCE_PAGE_SIZE = 20

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes}m`
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return m === 0 ? `${h}h` : `${h}h ${m}m`
}

function frequencyLabel(h: Habit): string {
  if (h.frequency === "daily") return "Daily"
  if (h.daysOfWeek && h.daysOfWeek.length > 0) {
    const sorted = [...h.daysOfWeek].sort((a, b) => a - b)
    return sorted.map((d) => DAYS_SHORT[d]).join(", ")
  }
  return "Specific days"
}

function formatOccurrenceDate(dateStr: string): string {
  const d = new Date(dateStr + (dateStr.includes("T") ? "" : "T00:00:00"))
  return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })
}

function formatCreatedAt(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })
}

// ─── Edit Schema ─────────────────────────────────────────────────────────────

const editSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  targetDuration: z.number().min(1, "Must be at least 1 minute"),
  daysOfWeek: z.array(z.number()).optional(),
})
type EditValues = z.infer<typeof editSchema>

// ─── Edit Dialog ─────────────────────────────────────────────────────────────

interface EditDialogProps {
  open: boolean
  habit: Habit
  onClose: () => void
  onUpdated: (h: Habit) => void
}

function EditDialog({ open, habit, onClose, onUpdated }: EditDialogProps) {
  const [submitting, setSubmitting] = useState(false)

  const form = useForm<EditValues>({
    resolver: zodResolver(editSchema),
    defaultValues: {
      title: habit.title,
      description: habit.description ?? "",
      targetDuration: habit.targetDuration,
      daysOfWeek: habit.daysOfWeek ?? [],
    },
  })

  useEffect(() => {
    if (open) {
      form.reset({
        title: habit.title,
        description: habit.description ?? "",
        targetDuration: habit.targetDuration,
        daysOfWeek: habit.daysOfWeek ?? [],
      })
    }
  }, [open, habit]) // eslint-disable-line react-hooks/exhaustive-deps

  const selectedDays = form.watch("daysOfWeek") ?? []
  const toggleDay = (d: number) => {
    const curr = form.getValues("daysOfWeek") ?? []
    form.setValue("daysOfWeek", curr.includes(d) ? curr.filter((x) => x !== d) : [...curr, d], { shouldDirty: true })
  }

  const onSubmit = async (data: EditValues) => {
    setSubmitting(true)
    try {
      const updated = await updateHabit(habit.id, {
        title: data.title,
        description: data.description || undefined,
        targetDuration: data.targetDuration,
        daysOfWeek: habit.frequency === "specific_days" ? data.daysOfWeek : undefined,
      })
      toast.success("Habit updated")
      onUpdated(updated)
      onClose()
    } catch (err) {
      toast.error("Failed to update habit", err instanceof Error ? err.message : undefined)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && !submitting && onClose()}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader className="pb-1">
          <DialogTitle className="flex items-center gap-3 text-lg">
            <div className="flex size-9 items-center justify-center rounded-xl bg-violet-500/15 border border-violet-500/20">
              <Edit2 className="size-4 text-violet-600 dark:text-violet-400" />
            </div>
            <div>
              Edit Habit
              <p className="text-sm font-normal text-muted-foreground mt-0.5">Update details for this habit.</p>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="h-px bg-border/60 -mx-6" />

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-1">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium">Title <span className="text-destructive">*</span></FormLabel>
                  <FormControl><Input autoFocus className="h-10" {...field} /></FormControl>
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
                  <FormControl><Textarea rows={2} className="resize-none text-sm" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="targetDuration"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium">Target Duration (min) <span className="text-destructive">*</span></FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={1}
                      className="h-10"
                      value={field.value ?? ""}
                      onChange={(e) => field.onChange(e.target.value === "" ? undefined : parseInt(e.target.value, 10))}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {habit.frequency === "specific_days" && (
              <FormField
                control={form.control}
                name="daysOfWeek"
                render={() => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium">Days of Week</FormLabel>
                    <div className="flex gap-1.5 flex-wrap">
                      {DAYS_SHORT.map((d, i) => (
                        <button
                          key={d}
                          type="button"
                          onClick={() => toggleDay(i)}
                          className={cn(
                            "w-10 h-9 text-xs font-semibold rounded-lg border transition-all",
                            selectedDays.includes(i)
                              ? "bg-violet-500 text-white border-violet-500"
                              : "bg-muted/50 text-muted-foreground border-border hover:border-violet-400",
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

            <div className="h-px bg-border/60 -mx-6" />
            <DialogFooter className="gap-2 sm:gap-2">
              <Button type="button" variant="outline" onClick={onClose} disabled={submitting} className="flex-1 sm:flex-none">Cancel</Button>
              <Button type="submit" disabled={submitting} className="flex-1 sm:flex-none gap-1.5">
                {submitting ? (
                  <><span className="size-3.5 rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground animate-spin" /> Saving...</>
                ) : (
                  <><Edit2 className="size-4" /> Save Changes</>
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
          <DialogTitle className="flex items-center gap-3 text-lg">
            <div className="flex size-9 items-center justify-center rounded-xl bg-destructive/10 border border-destructive/20">
              <AlertTriangle className="size-5 text-destructive" />
            </div>
            <div>
              Delete Habit
              <p className="text-sm font-normal text-muted-foreground mt-0.5">This action cannot be undone.</p>
            </div>
          </DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground -mt-1">
          Permanently delete <span className="font-semibold text-foreground">"{habitTitle}"</span>? All streaks and history will be lost.
        </p>
        <DialogFooter className="gap-2 sm:gap-2">
          <Button variant="outline" onClick={onClose} disabled={loading} className="flex-1 sm:flex-none">Cancel</Button>
          <Button variant="destructive" onClick={onConfirm} disabled={loading} className="flex-1 sm:flex-none gap-1.5">
            {loading ? <><span className="size-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin" /> Deleting...</> : <><Trash2 className="size-4" /> Delete</>}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ─── Occurrence Row ───────────────────────────────────────────────────────────

function OccurrenceRow({ occ, targetDuration }: { occ: HabitOccurrence; targetDuration: number }) {
  const dateStr = occ.date ?? occ.scheduledDate ?? ""
  const isCompleted = occ.status === "COMPLETED"
  const isSkipped   = occ.status === "SKIPPED"
  const isPending   = occ.status === "PENDING"
  const efficiency  = isCompleted && occ.durationMinutes
    ? Math.round(Math.min(occ.durationMinutes, targetDuration) / Math.max(occ.durationMinutes, targetDuration) * 100)
    : null

  return (
    <div className={cn(
      "flex items-center gap-3 rounded-xl border px-3 py-2.5 transition-all",
      isCompleted && "border-emerald-500/20 bg-emerald-500/5",
      isSkipped   && "border-amber-500/20 bg-amber-500/5",
      isPending   && "border-border/40 bg-muted/20",
    )}>
      <div className={cn(
        "flex size-6 shrink-0 items-center justify-center rounded-full border",
        isCompleted && "border-emerald-400 bg-emerald-400 text-white",
        isSkipped   && "border-amber-400 bg-amber-400/20 text-amber-500",
        isPending   && "border-muted-foreground/30 bg-transparent text-muted-foreground/30",
      )}>
        {isCompleted ? <CheckCircle2 className="size-3.5" /> : isSkipped ? <SkipForward className="size-3" /> : <Clock className="size-3" />}
      </div>

      <div className="flex-1 min-w-0">
        <span className="text-sm font-medium">{dateStr ? formatOccurrenceDate(dateStr) : "—"}</span>
        {occ.note && <p className="text-[11px] text-muted-foreground truncate mt-0.5">{occ.note}</p>}
      </div>

      <div className="flex items-center gap-2 shrink-0 text-[11px]">
        {isCompleted && occ.durationMinutes != null && (
          <span className="text-muted-foreground">{formatDuration(occ.durationMinutes)}</span>
        )}
        {efficiency != null && (
          <span className={cn(
            "font-semibold rounded-full px-1.5 py-0.5",
            efficiency >= 90 ? "text-emerald-600 dark:text-emerald-400 bg-emerald-500/10" :
            efficiency >= 70 ? "text-violet-600 dark:text-violet-400 bg-violet-500/10" :
                               "text-amber-600 dark:text-amber-400 bg-amber-500/10",
          )}>
            {efficiency}%
          </span>
        )}
        {isPending && <span className="text-muted-foreground/50 italic">Upcoming</span>}
        {isSkipped && <span className="text-amber-600 dark:text-amber-400 font-medium">Skipped</span>}
      </div>
    </div>
  )
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function HabitDetailSkeleton() {
  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-border/70 bg-card/70 p-6">
        <div className="space-y-4">
          <div className="flex justify-between">
            <Skeleton className="h-8 w-20" />
            <Skeleton className="h-8 w-24" />
          </div>
          <Skeleton className="h-8 w-2/3" />
          <Skeleton className="h-4 w-full" />
          <div className="flex gap-3">
            <Skeleton className="h-6 w-16 rounded-full" />
            <Skeleton className="h-6 w-20 rounded-full" />
          </div>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
      </div>
      <Skeleton className="h-64 rounded-2xl" />
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function HabitDetailPage() {
  const params = useParams()
  const router = useRouter()
  const habitId = params.id as string

  const [habit, setHabit] = useState<Habit | null>(null)
  const [analytics, setAnalytics] = useState<HabitAnalytics | null>(null)
  const [occurrences, setOccurrences] = useState<HabitOccurrence[]>([])
  const [loading, setLoading] = useState(true)
  const [habitError, setHabitError] = useState<string | null>(null)
  const [editOpen, setEditOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)
  const [showAllOccurrences, setShowAllOccurrences] = useState(false)

  const fetchHabitData = useCallback(async () => {
    setLoading(true)
    setHabitError(null)
    try {
      const [h, occ, anl] = await Promise.all([
        getHabit(habitId),
        getOccurrences(habitId).catch(() => [] as HabitOccurrence[]),
        getHabitAnalytics(habitId).catch(() => null),
      ])
      setHabit(h)
      // Sort occurrences newest first
      const sorted = [...occ].sort((a, b) => {
        const da = new Date(a.date ?? a.scheduledDate ?? "").getTime()
        const db = new Date(b.date ?? b.scheduledDate ?? "").getTime()
        return db - da
      })
      setOccurrences(sorted)
      setAnalytics(anl)
    } catch (err) {
      setHabitError(err instanceof Error ? err.message : "Failed to load habit.")
    } finally {
      setLoading(false)
    }
  }, [habitId])

  useEffect(() => {
    fetchHabitData()
  }, [fetchHabitData])

  const handlePause = async () => {
    if (!habit) return
    setActionLoading(true)
    try {
      const updated = await pauseHabit(habit.id)
      setHabit(updated)
      toast.success("Habit paused")
    } catch (err) {
      toast.error("Failed to pause", err instanceof Error ? err.message : undefined)
    } finally {
      setActionLoading(false)
    }
  }

  const handleResume = async () => {
    if (!habit) return
    setActionLoading(true)
    try {
      const updated = await resumeHabit(habit.id)
      setHabit(updated)
      toast.success("Habit resumed")
    } catch (err) {
      toast.error("Failed to resume", err instanceof Error ? err.message : undefined)
    } finally {
      setActionLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!habit) return
    setDeleteLoading(true)
    try {
      await deleteHabit(habit.id)
      toast.success("Habit deleted")
      router.replace("/habits")
    } catch (err) {
      toast.error("Failed to delete habit", err instanceof Error ? err.message : undefined)
      setDeleteLoading(false)
    }
  }

  // ── Loading ──────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="relative min-h-screen overflow-x-clip bg-background">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <HabitDetailSkeleton />
        </div>
      </div>
    )
  }

  // ── Error ────────────────────────────────────────────────────────────────
  if (habitError || !habit) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="text-center space-y-4 max-w-sm">
          <div className="flex size-16 items-center justify-center rounded-full bg-destructive/10 mx-auto">
            <AlertTriangle className="size-8 text-destructive" />
          </div>
          <div>
            <p className="text-lg font-semibold">Failed to load habit</p>
            <p className="text-sm text-muted-foreground mt-1">{habitError ?? "Habit not found."}</p>
          </div>
          <div className="flex gap-2 justify-center">
            <Button variant="outline" onClick={() => router.back()}><ArrowLeft className="size-4" /> Go back</Button>
            <Button onClick={fetchHabitData}>Try again</Button>
          </div>
        </div>
      </div>
    )
  }

  // ── Derived ──────────────────────────────────────────────────────────────
  const isActive  = habit.status === "active"
  const isPaused  = habit.status === "paused"
  const completedOcc = occurrences.filter((o) => o.status === "COMPLETED")
  const skippedOcc   = occurrences.filter((o) => o.status === "SKIPPED")
  const pendingOcc   = occurrences.filter((o) => o.status === "PENDING")
  const displayedOccurrences = showAllOccurrences ? occurrences : occurrences.slice(0, OCCURRENCE_PAGE_SIZE)

  const statusColor =
    isActive  ? "border-l-violet-500" :
    isPaused  ? "border-l-amber-400"  :
                "border-l-slate-400"

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
            {/* Top row */}
            <div className="flex items-center justify-between gap-4">
              <Button variant="ghost" size="sm" asChild className="gap-1.5 -ml-2 text-muted-foreground hover:text-foreground">
                <Link href="/habits"><ArrowLeft className="size-4" /> Habits</Link>
              </Button>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" className="size-8 text-muted-foreground" onClick={fetchHabitData} title="Refresh">
                  <RefreshCw className="size-4" />
                </Button>
                <Button variant="outline" size="sm" onClick={() => setEditOpen(true)} className="gap-1.5 h-8 text-xs bg-background/50">
                  <Edit2 className="size-3.5" /> Edit
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="icon" className="size-8 bg-background/50" disabled={actionLoading}>
                      <MoreHorizontal className="size-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-44">
                    {isActive && (
                      <DropdownMenuItem onClick={handlePause}>
                        <Pause className="size-3.5" /> Pause Habit
                      </DropdownMenuItem>
                    )}
                    {isPaused && (
                      <DropdownMenuItem onClick={handleResume}>
                        <Play className="size-3.5" /> Resume Habit
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem destructive onClick={() => setDeleteOpen(true)}>
                      <Trash2 className="size-3.5" /> Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            {/* Identity */}
            <div className="flex items-start gap-4">
              <div className={cn(
                "flex size-12 shrink-0 items-center justify-center rounded-2xl border",
                isActive  ? "border-violet-500/25 bg-violet-500/10"   :
                isPaused  ? "border-amber-500/25 bg-amber-500/10"     :
                            "border-slate-500/25 bg-slate-500/10",
              )}>
                <Repeat className={cn(
                  "size-6",
                  isActive  ? "text-violet-600 dark:text-violet-400" :
                  isPaused  ? "text-amber-600 dark:text-amber-400"   :
                              "text-slate-500",
                )} />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-1.5 mb-2">
                  <span className={cn(
                    "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold",
                    isActive ? "bg-violet-500/10 text-violet-700 dark:text-violet-300 border border-violet-500/20" :
                    isPaused ? "bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20"   :
                               "bg-muted text-muted-foreground border border-border",
                  )}>
                    {isActive ? <><div className="size-1.5 rounded-full bg-violet-500" /> Active</> :
                     isPaused ? <><Pause className="size-3" /> Paused</>           :
                                <><div className="size-1.5 rounded-full bg-slate-400" /> Archived</>}
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground border border-border">
                    <Repeat className="size-3" /> {frequencyLabel(habit)}
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground border border-border">
                    <Clock className="size-3" /> {formatDuration(habit.targetDuration)}
                  </span>
                </div>
                <h1 className="text-2xl font-bold tracking-tight leading-tight sm:text-3xl">{habit.title}</h1>
                {habit.description && (
                  <p className="mt-2 text-sm text-muted-foreground leading-relaxed max-w-2xl">{habit.description}</p>
                )}
                <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                  {habit.createdAt && (
                    <span className="flex items-center gap-1.5">
                      <Calendar className="size-3.5" /> Started {formatCreatedAt(habit.createdAt)}
                    </span>
                  )}
                  {habit.goalId && (
                    <span className="flex items-center gap-1.5">
                      <Target className="size-3.5" /> Linked to a goal
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Stat tiles ── */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:gap-4">
          {/* Current streak */}
          <Card className="hover:shadow-md transition-all hover:-translate-y-0.5">
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-widest mb-2">Streak</p>
                  <p className="text-3xl font-bold tabular-nums leading-none">{habit.currentStreak ?? 0}</p>
                  <p className="mt-1.5 text-xs text-muted-foreground">
                    {(habit.currentStreak ?? 0) > 0 ? "days running" : "Start today!"}
                  </p>
                </div>
                <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-orange-500/10 text-orange-600 dark:text-orange-400">
                  <Flame className="size-4" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Longest streak */}
          <Card className="hover:shadow-md transition-all hover:-translate-y-0.5">
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-widest mb-2">Best</p>
                  <p className="text-3xl font-bold tabular-nums leading-none">{habit.longestStreak ?? 0}</p>
                  <p className="mt-1.5 text-xs text-muted-foreground">longest streak</p>
                </div>
                <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-violet-500/10 text-violet-600 dark:text-violet-400">
                  <TrendingUp className="size-4" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Completion rate */}
          <Card className="hover:shadow-md transition-all hover:-translate-y-0.5">
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div className="min-w-0">
                  <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-widest mb-2">Rate</p>
                  <p className="text-3xl font-bold tabular-nums leading-none">
                    {analytics ? `${Math.round(analytics.completionRatePct)}%` : "—"}
                  </p>
                  <p className="mt-1.5 text-xs text-muted-foreground">completion (30d)</p>
                  {analytics && (
                    <Progress
                      value={analytics.completionRatePct}
                      className={cn("h-1 mt-2",
                        analytics.completionRatePct >= 80 ? "[&>div]:bg-emerald-500" :
                        analytics.completionRatePct >= 50 ? "[&>div]:bg-violet-500"  : "[&>div]:bg-amber-400",
                      )}
                    />
                  )}
                </div>
                <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 className="size-4" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Avg duration */}
          <Card className="hover:shadow-md transition-all hover:-translate-y-0.5">
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-widest mb-2">Avg</p>
                  <p className="text-3xl font-bold tabular-nums leading-none">
                    {analytics?.avgDurationMinutes ? formatDuration(Math.round(analytics.avgDurationMinutes)) : "—"}
                  </p>
                  <p className="mt-1.5 text-xs text-muted-foreground">avg per session</p>
                </div>
                <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-sky-500/10 text-sky-600 dark:text-sky-400">
                  <Clock className="size-4" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ── Two-column layout ── */}
        <div className="grid gap-6 lg:grid-cols-12 lg:gap-8">

          {/* Left: Analytics details */}
          <div className="lg:col-span-5">
            <Card className={cn("overflow-hidden border border-border/70 bg-card/85 backdrop-blur-sm border-l-[3px]", statusColor)}>
              <CardContent className="p-0">
                <div className="px-5 py-4 border-b border-border/50">
                  <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                    <TrendingUp className="size-3.5" /> Overview
                  </p>
                </div>

                <div className="px-5 py-4 space-y-4">
                  {/* Progress summary */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Total occurrences</span>
                      <span className="font-semibold">{occurrences.length}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
                        <CheckCircle2 className="size-3" /> Completed
                      </span>
                      <span className="font-semibold">{completedOcc.length}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-amber-600 dark:text-amber-400 font-medium flex items-center gap-1">
                        <SkipForward className="size-3" /> Skipped
                      </span>
                      <span className="font-semibold">{skippedOcc.length}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground/70 flex items-center gap-1">
                        <Clock className="size-3" /> Upcoming
                      </span>
                      <span className="font-semibold text-muted-foreground">{pendingOcc.length}</span>
                    </div>
                  </div>

                  {occurrences.length > 0 && (
                    <>
                      <Separator className="opacity-40" />
                      <div className="space-y-1.5">
                        <p className="text-xs text-muted-foreground">Overall completion</p>
                        <div className="flex items-center gap-2">
                          <Progress
                            value={occurrences.length > 0 ? (completedOcc.length / (occurrences.length - pendingOcc.length || 1)) * 100 : 0}
                            className={cn("h-2 flex-1",
                              completedOcc.length / (occurrences.length - pendingOcc.length || 1) >= 0.8 ? "[&>div]:bg-emerald-500" :
                              completedOcc.length / (occurrences.length - pendingOcc.length || 1) >= 0.5 ? "[&>div]:bg-violet-500"  : "[&>div]:bg-amber-400",
                            )}
                          />
                          <span className="text-xs font-semibold tabular-nums">
                            {occurrences.length - pendingOcc.length > 0
                              ? `${Math.round(completedOcc.length / (occurrences.length - pendingOcc.length) * 100)}%`
                              : "—"}
                          </span>
                        </div>
                      </div>
                    </>
                  )}

                  {analytics?.mostMissedDayOfWeek !== undefined && analytics.mostMissedDayOfWeek !== null && (
                    <>
                      <Separator className="opacity-40" />
                      <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 px-3.5 py-2.5">
                        <p className="text-xs font-medium text-amber-700 dark:text-amber-300">
                          Most missed day
                        </p>
                        <p className="mt-0.5 text-sm font-semibold">{DAYS_FULL[analytics.mostMissedDayOfWeek]}</p>
                      </div>
                    </>
                  )}

                  {/* Frequency detail */}
                  <Separator className="opacity-40" />
                  <div className="space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Frequency</span>
                      <span className="font-medium capitalize">{habit.frequency.replace("_", " ")}</span>
                    </div>
                    {habit.frequency === "specific_days" && habit.daysOfWeek && habit.daysOfWeek.length > 0 && (
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Days</span>
                        <span className="font-medium">
                          {[...habit.daysOfWeek].sort((a, b) => a - b).map((d) => DAYS_SHORT[d]).join(", ")}
                        </span>
                      </div>
                    )}
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Target duration</span>
                      <span className="font-medium">{formatDuration(habit.targetDuration)}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right: Occurrence history */}
          <div className="lg:col-span-7">
            <div className="overflow-hidden rounded-2xl border border-border/70 bg-card/70 backdrop-blur-sm">
              <div className="flex items-center justify-between gap-2 px-5 py-4 border-b border-border/50">
                <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                  <Calendar className="size-3.5" /> History
                  {occurrences.length > 0 && (
                    <span className="font-normal normal-case tracking-normal text-foreground">
                      ({completedOcc.length}/{occurrences.filter((o) => o.status !== "PENDING").length} done)
                    </span>
                  )}
                </p>
              </div>

              <div className="px-3 py-3 space-y-1.5 max-h-[520px] overflow-y-auto">
                {occurrences.length === 0 ? (
                  <div className="flex flex-col items-center gap-3 py-10 text-center">
                    <div className="flex size-12 items-center justify-center rounded-2xl border border-border/60 bg-muted/40">
                      <Calendar className="size-5 text-muted-foreground/50" />
                    </div>
                    <p className="text-sm font-semibold">No history yet</p>
                    <p className="text-xs text-muted-foreground">Complete your first occurrence to see history here.</p>
                  </div>
                ) : (
                  <>
                    {displayedOccurrences.map((occ) => (
                      <OccurrenceRow key={occ.id} occ={occ} targetDuration={habit.targetDuration} />
                    ))}
                    {occurrences.length > OCCURRENCE_PAGE_SIZE && !showAllOccurrences && (
                      <button
                        onClick={() => setShowAllOccurrences(true)}
                        className="group flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-border/60 px-3 py-2.5 text-xs font-medium text-muted-foreground transition-all hover:border-violet-500/40 hover:bg-violet-500/5 hover:text-violet-600 dark:hover:text-violet-400"
                      >
                        Show all {occurrences.length} occurrences
                        <span className="rounded-full bg-muted px-1.5 py-0.5 text-[10px]">{occurrences.length - OCCURRENCE_PAGE_SIZE} more</span>
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Dialogs */}
      {editOpen && (
        <EditDialog
          open={editOpen}
          habit={habit}
          onClose={() => setEditOpen(false)}
          onUpdated={(updated) => setHabit(updated)}
        />
      )}

      <DeleteDialog
        open={deleteOpen}
        habitTitle={habit.title}
        loading={deleteLoading}
        onConfirm={handleDelete}
        onClose={() => setDeleteOpen(false)}
      />
    </div>
  )
}
