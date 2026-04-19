"use client"

import { useEffect, useState, useCallback, useMemo, useRef } from "react"
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
  MoreHorizontal,
  CheckSquare,
  Sparkles,
  RefreshCw,
  X,
  Search,
} from "lucide-react"
import type { Task, GoalPriority, TaskStatus } from "@/types"
import { getTasks, getPaginatedTasks, getTaskStats, searchTasks } from "@/lib/tasks-api"
import type { TaskStatsResponse } from "@/lib/tasks-api"
import { getGoals, searchGoals } from "@/lib/goals-api"
import { useTasksStore } from "@/store/tasks-store"
import { toast } from "@/components/ui/toast"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
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
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"

// --- Constants ---

const PAGE_SIZE = 10
const PRIORITIES: GoalPriority[] = ["HIGH", "MEDIUM", "LOW"]

// --- Zod Schema ---

const taskFormSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  priority: z.enum(["HIGH", "MEDIUM", "LOW"]),
  type: z.enum(["PLANNED", "UNPLANNED"]),
  scheduledFor: z.string().optional(),
  estimatedDuration: z.number().min(1, "At least 1 minute").optional(),
  goalId: z.string().optional(),
})

type TaskFormValues = z.infer<typeof taskFormSchema>

// --- Helpers ---

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
    default:       return "secondary"
  }
}

function todayIso(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
}

function formatDisplayDate(iso: string): string {
  return new Date(iso + "T00:00:00").toLocaleDateString("en-US", {
    weekday: "long", month: "long", day: "numeric",
  })
}

function formatShortDate(iso: string): string {
  return new Date(iso + "T00:00:00").toLocaleDateString("en-US", {
    month: "short", day: "numeric",
  })
}

function isToday(iso: string): boolean {
  return iso === todayIso()
}

function navigateDate(iso: string, dir: "prev" | "next"): string {
  const d = new Date(iso + "T00:00:00")
  d.setDate(d.getDate() + (dir === "next" ? 1 : -1))
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
}

function formatDuration(ms: number): string {
  const minutes = Math.round(ms / 60000)
  if (minutes < 60) return `${minutes}m`
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return m > 0 ? `${h}h ${m}m` : `${h}h`
}

// --- Goal Combobox ---

interface GoalOption { id: string; title: string }

function GoalCombobox({ value, onChange }: { value: string; onChange: (id: string) => void }) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")
  const [options, setOptions] = useState<GoalOption[]>([])
  const [loading, setLoading] = useState(false)
  const [selected, setSelected] = useState<GoalOption | null>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const loadInitial = useCallback(async () => {
    setLoading(true)
    try {
      const res = await getGoals({ status: "ACTIVE", limit: 10, page: 1 })
      setOptions(res.items.map((g) => ({ id: g.id, title: g.title })))
    } catch { /* silent */ } finally { setLoading(false) }
  }, [])

  const handleSearch = (q: string) => {
    setQuery(q)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (!q.trim()) { loadInitial(); return }
    debounceRef.current = setTimeout(async () => {
      setLoading(true)
      try {
        const res = await searchGoals(q.trim(), { limit: 10 })
        setOptions(res.items.map((g) => ({ id: g.id, title: g.title })))
      } catch { /* silent */ } finally { setLoading(false) }
    }, 300)
  }

  const handleOpen = () => {
    setOpen(true)
    setQuery("")
    loadInitial()
  }

  const handleSelect = (goal: GoalOption | null) => {
    setSelected(goal)
    onChange(goal?.id ?? "none")
    setOpen(false)
    setQuery("")
  }

  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [open])

  useEffect(() => {
    if (!value || value === "none") { setSelected(null); return }
    if (selected?.id === value) return
    const found = options.find((o) => o.id === value)
    if (found) setSelected(found)
  }, [value, options, selected])

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={handleOpen}
        className={cn(
          "flex h-9 w-full items-center justify-between rounded-md border bg-transparent px-3 py-2 text-sm ring-offset-background",
          "border-input placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
          "disabled:cursor-not-allowed disabled:opacity-50",
          !selected && "text-muted-foreground",
        )}
      >
        <span className="truncate">{selected ? selected.title : "No goal"}</span>
        <Search className="size-3.5 shrink-0 text-muted-foreground ml-2" />
      </button>

      {open && (
        <div className="absolute z-50 mt-1 w-full rounded-md border border-border bg-popover shadow-md">
          <div className="flex items-center border-b border-border px-3 py-2 gap-2">
            <Search className="size-3.5 shrink-0 text-muted-foreground" />
            <input
              autoFocus
              value={query}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="Search goals…"
              className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
            {loading && (
              <span className="size-3.5 rounded-full border-2 border-muted-foreground/30 border-t-muted-foreground animate-spin shrink-0" />
            )}
          </div>

          <div className="max-h-48 overflow-y-auto py-1">
            <button
              type="button"
              onClick={() => handleSelect(null)}
              className={cn(
                "flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground",
                !selected && "font-medium",
              )}
            >
              No goal
            </button>

            {options.length === 0 && !loading && (
              <p className="px-3 py-2 text-xs text-muted-foreground">
                {query ? "No goals found" : "No active goals"}
              </p>
            )}

            {options.map((g) => (
              <button
                key={g.id}
                type="button"
                onClick={() => handleSelect(g)}
                className={cn(
                  "flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground text-left",
                  selected?.id === g.id && "font-medium text-violet-600 dark:text-violet-400",
                )}
              >
                <span className="truncate">{g.title}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// --- Create Task Dialog ---

interface CreateTaskDialogProps {
  open: boolean
  onClose: () => void
  defaultDate: string
  onCreated: () => void
}

function CreateTaskDialog({ open, onClose, defaultDate, onCreated }: CreateTaskDialogProps) {
  const { createTask } = useTasksStore()
  const [submitting, setSubmitting] = useState(false)

  const form = useForm<TaskFormValues>({
    resolver: zodResolver(taskFormSchema),
    defaultValues: {
      title: "", description: "", priority: "MEDIUM", type: "PLANNED",
      scheduledFor: defaultDate, estimatedDuration: undefined, goalId: "",
    },
  })
  const taskType = form.watch("type")

  useEffect(() => {
    if (open) form.reset({
      title: "", description: "", priority: "MEDIUM", type: "PLANNED",
      scheduledFor: defaultDate, estimatedDuration: undefined, goalId: "",
    })
  }, [open, defaultDate]) // eslint-disable-line react-hooks/exhaustive-deps

  const onSubmit = async (data: TaskFormValues) => {
    setSubmitting(true)
    try {
      await createTask({
        title: data.title,
        description: data.description || undefined,
        priority: data.priority,
        type: data.type,
        scheduledFor: data.type === "PLANNED" && data.scheduledFor
          ? new Date(data.scheduledFor + "T00:00:00.000Z").toISOString()
          : undefined,
        estimatedDuration: data.estimatedDuration != null
          ? Math.round(data.estimatedDuration * 60 * 1000)
          : undefined,
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
            <FormField control={form.control} name="title" render={({ field }) => (
              <FormItem>
                <FormLabel>Title <span className="text-destructive">*</span></FormLabel>
                <FormControl><Input placeholder="e.g. Review pull request" autoFocus {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="description" render={({ field }) => (
              <FormItem>
                <FormLabel>Description</FormLabel>
                <FormControl><Textarea placeholder="Any extra context..." rows={2} className="resize-none" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <div className="grid grid-cols-2 gap-3">
              <FormField control={form.control} name="type" render={({ field }) => (
                <FormItem>
                  <FormLabel>Type <span className="text-destructive">*</span></FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                    <SelectContent>
                      <SelectItem value="PLANNED">Planned</SelectItem>
                      <SelectItem value="UNPLANNED">Unplanned</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="priority" render={({ field }) => (
                <FormItem>
                  <FormLabel>Priority <span className="text-destructive">*</span></FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                    <SelectContent>
                      {PRIORITIES.map((p) => (
                        <SelectItem key={p} value={p}>{p.charAt(0) + p.slice(1).toLowerCase()}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              {taskType === "PLANNED" && (
                <FormField control={form.control} name="scheduledFor" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Scheduled For</FormLabel>
                    <FormControl><Input type="date" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              )}
              <FormField control={form.control} name="estimatedDuration" render={({ field }) => (
                <FormItem className={taskType === "UNPLANNED" ? "col-span-2" : ""}>
                  <FormLabel>Est. Duration (min)</FormLabel>
                  <FormControl>
                    <Input type="number" min={1} step={1} placeholder="e.g. 30"
                      value={field.value ?? ""}
                      onChange={(e) => field.onChange(e.target.value === "" ? undefined : parseInt(e.target.value, 10))} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>
            <FormField control={form.control} name="goalId" render={({ field }) => (
              <FormItem>
                <FormLabel>Link to Goal</FormLabel>
                <FormControl>
                  <GoalCombobox value={field.value || "none"} onChange={field.onChange} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <DialogFooter className="pt-2 gap-2 sm:gap-0">
              <Button type="button" variant="outline" onClick={onClose} disabled={submitting}>Cancel</Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? "Creating..." : "Create Task"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

// --- Task Row ---

interface TaskRowProps {
  task: Task
  onComplete: (task: Task) => void
  onRefresh: () => void
}

function TaskRow({ task, onComplete, onRefresh }: TaskRowProps) {
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
    <div className={cn(
      "group flex items-start gap-3 rounded-xl border px-3.5 py-3 transition-all duration-150 min-w-0",
      isDone && "bg-muted/20 border-transparent opacity-55",
      isActive && !isDone && "border-violet-500/30 bg-violet-500/[0.04] dark:bg-violet-500/[0.06]",
      !isDone && !isActive && "bg-card/60 border-border/50 hover:border-border hover:bg-card"
    )}>
      <button
        onClick={() => !isDone && onComplete(task)}
        disabled={isDone || actionLoading}
        className={cn(
          "mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full border-2 transition-all group/tick",
          isDone && "border-emerald-400 bg-emerald-400 text-white",
          isActive && !isDone && "border-violet-500 hover:bg-violet-500 hover:text-white",
          !isDone && !isActive && "border-muted-foreground/50 hover:border-emerald-500 hover:bg-emerald-500 hover:text-white"
        )}
      >
        {isDone
          ? <CheckCircle2 className="size-3.5" />
          : <CheckCircle2 className="size-3.5 opacity-0 group-hover/tick:opacity-100 transition-opacity" />
        }
      </button>

      <div className="flex-1 min-w-0">
        <p className={cn("text-sm font-medium leading-snug break-words", isDone && "line-through text-muted-foreground")}>
          {task.title}
        </p>
        <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
          <Badge variant={taskStatusVariant(task.status)} className="text-[10px] px-1.5 py-0">
            {task.status.replace("_", " ")}
          </Badge>
          <Badge variant={priorityVariant(task.priority)} className="text-[10px] px-1.5 py-0">
            {task.priority}
          </Badge>
          {task.type === "UNPLANNED" ? (
            <span className="inline-flex items-center gap-0.5 rounded-full bg-amber-500/10 px-1.5 py-px text-[10px] font-medium text-amber-600 dark:text-amber-400">
              <Inbox className="size-2.5" /> Unplanned
            </span>
          ) : (
            <span className="inline-flex items-center gap-0.5 rounded-full bg-violet-500/10 px-1.5 py-px text-[10px] font-medium text-violet-700 dark:text-violet-300">
              <Calendar className="size-2.5" /> Planned
            </span>
          )}
          {task.scheduledFor && (
            <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
              <Calendar className="size-2.5" />
              {formatShortDate(task.scheduledFor.split("T")[0])}
            </span>
          )}
          {task.estimatedDuration != null && (
            <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
              <Clock className="size-2.5" />{formatDuration(task.estimatedDuration)}
            </span>
          )}
          {task.actualDuration != null && (
            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 flex items-center gap-0.5 font-medium">
              <CheckCircle2 className="size-2.5" />{formatDuration(task.actualDuration)} actual
            </span>
          )}
          {task.efficiencyScore != null && (
            <span className={cn("text-[10px] font-semibold",
              task.efficiencyScore >= 100 ? "text-emerald-600" :
              task.efficiencyScore >= 75  ? "text-amber-600" : "text-red-500")}>
              {task.efficiencyScore}%
            </span>
          )}
          {task.goalTitle && task.goalId && (
            <Link
              href={`/goals/${task.goalId}`}
              onClick={(e) => e.stopPropagation()}
              className="text-[10px] text-muted-foreground bg-muted/70 rounded px-1.5 py-px truncate max-w-[120px] hover:text-violet-600 dark:hover:text-violet-400 hover:bg-violet-500/10 transition-colors"
            >
              {task.goalTitle}
            </Link>
          )}
        </div>
      </div>

      {!isDone && (
        <div className="flex items-center gap-1 shrink-0">
          {/* Inline actions — hover only on md+ */}
          <div className="hidden md:flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              variant="ghost"
              size="icon"
              className="size-7 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/30"
              onClick={() => onComplete(task)}
              disabled={actionLoading}
              title="Complete task"
            >
              <CheckCircle2 className="size-3.5" />
            </Button>
            {isActive && (
              <Button variant="ghost" size="icon" className="size-7" asChild>
                <Link href={`/timer/${task.id}`}><Timer className="size-3.5 text-violet-500" /></Link>
              </Button>
            )}
            {!isActive && (
              <Button variant="ghost" size="icon"
                className="size-7 text-violet-600 hover:text-violet-700 hover:bg-violet-50 dark:hover:bg-violet-950/30"
                onClick={() => handleAction("start")} disabled={actionLoading}>
                <Play className="size-3.5" />
              </Button>
            )}
            {isActive && (
              <Button variant="ghost" size="icon" className="size-7"
                onClick={() => handleAction("pause")} disabled={actionLoading}>
                <Pause className="size-3.5" />
              </Button>
            )}
          </div>
          {/* Dropdown — always visible */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="size-7 opacity-60 hover:opacity-100 md:opacity-0 md:group-hover:opacity-100" disabled={actionLoading}>
                <MoreHorizontal className="size-3.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              <DropdownMenuLabel className="text-xs">Actions</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => onComplete(task)}>
                <CheckCircle2 className="size-3.5" /> Complete
              </DropdownMenuItem>
              {!isActive && (
                <DropdownMenuItem onClick={() => handleAction("start")}>
                  <Play className="size-3.5" /> Start
                </DropdownMenuItem>
              )}
              {isActive && (
                <DropdownMenuItem onClick={() => handleAction("pause")}>
                  <Pause className="size-3.5" /> Pause
                </DropdownMenuItem>
              )}
              <DropdownMenuItem asChild>
                <Link href={`/timer/${task.id}`}><Timer className="size-3.5" /> Open Timer</Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem destructive onClick={() => handleAction("delete")}>
                <Trash2 className="size-3.5" /> Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}
    </div>
  )
}

function TaskRowSkeleton() {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-border/50 px-3.5 py-3">
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

// --- Today Card ---

interface TodayCardProps {
  tasks: Task[]
  loading: boolean
  date: string
  onDateNav: (dir: "prev" | "next") => void
  onJumpToday: () => void
  onJumpTo: (date: string) => void
  onComplete: (task: Task) => void
  onRefresh: () => void
  onAdd: () => void
}

function TodayCard({ tasks, loading, date, onDateNav, onJumpToday, onJumpTo, onComplete, onRefresh, onAdd }: TodayCardProps) {
  const dateInputRef = useRef<HTMLInputElement>(null)
  const completed = tasks.filter((t) => t.status === "COMPLETED").length
  const inProg    = tasks.filter((t) => t.status === "IN_PROGRESS").length
  const pending   = tasks.filter((t) => t.status === "PENDING").length
  const pct       = tasks.length > 0 ? Math.round((completed / tasks.length) * 100) : 0
  const isCurrToday = isToday(date)
  const active = tasks.filter((t) => t.status !== "COMPLETED" && t.status !== "CANCELLED")
  const done   = tasks.filter((t) => t.status === "COMPLETED")

  return (
    <div className="overflow-hidden rounded-2xl border border-border/70 bg-card/70 backdrop-blur-sm">
      <div className="flex items-center gap-1.5 px-3 py-3 border-b border-border/40">
        <Button variant="ghost" size="icon" className="size-7 rounded-lg" onClick={() => onDateNav("prev")}>
          <ArrowLeft className="size-3.5" />
        </Button>
        <button
          className="flex-1 text-center group relative cursor-pointer rounded-lg py-0.5 hover:bg-muted/60 transition-colors"
          onClick={() => dateInputRef.current?.showPicker()}
          title="Pick a date"
        >
          <p className="text-xs font-semibold leading-tight group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors">
            {formatDisplayDate(date)}
          </p>
          {isCurrToday && <span className="text-[10px] font-medium text-violet-600 dark:text-violet-400">Today</span>}
          <input
            ref={dateInputRef}
            type="date"
            value={date}
            onChange={(e) => e.target.value && onJumpTo(e.target.value)}
            className="sr-only"
            tabIndex={-1}
          />
        </button>
        <Button variant="ghost" size="icon" className="size-7 rounded-lg" onClick={() => onDateNav("next")}>
          <ArrowRight className="size-3.5" />
        </Button>
        {!isCurrToday && (
          <Button variant="ghost" size="icon" className="size-7 rounded-lg text-violet-600 dark:text-violet-400"
            onClick={onJumpToday} title="Jump to today">
            <Calendar className="size-3.5" />
          </Button>
        )}
      </div>

      {tasks.length > 0 && (
        <div className="px-3 py-2 border-b border-border/40 space-y-1.5">
          <div className="flex items-center justify-between text-[10px]">
            <span className="text-muted-foreground">Completion</span>
            <span className="font-semibold">{pct}%</span>
          </div>
          <Progress value={pct} className={cn("h-1",
            pct >= 100 ? "[&>div]:bg-emerald-500" :
            pct >= 50  ? "[&>div]:bg-violet-500"  : "[&>div]:bg-indigo-400"
          )} />
          <div className="flex items-center gap-3 text-[10px]">
            <span className="text-emerald-600 dark:text-emerald-400 font-medium">{completed} done</span>
            {inProg > 0 && <span className="text-violet-600 dark:text-violet-400 font-medium">{inProg} active</span>}
            <span className="text-muted-foreground">{pending} pending</span>
          </div>
        </div>
      )}

      <div className="px-2 py-2 space-y-1 max-h-[340px] overflow-y-auto">
        {loading ? (
          [1, 2].map((i) => <TaskRowSkeleton key={i} />)
        ) : tasks.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-6 text-center">
            <Calendar className="size-5 text-muted-foreground/50" />
            <p className="text-xs text-muted-foreground">
              {isCurrToday ? "Nothing planned for today" : "No tasks on this day"}
            </p>
            <Button variant="outline" size="sm" className="h-7 text-xs gap-1" onClick={onAdd}>
              <Plus className="size-3" /> Add Task
            </Button>
          </div>
        ) : (
          <>
            {active.map((t) => <TaskRow key={t.id} task={t} onComplete={onComplete} onRefresh={onRefresh} />)}
            {done.length > 0 && active.length > 0 && <Separator className="opacity-30 my-1" />}
            {done.map((t) => <TaskRow key={t.id} task={t} onComplete={onComplete} onRefresh={onRefresh} />)}
          </>
        )}
      </div>
    </div>
  )
}

// --- Inbox Card ---

interface InboxCardProps {
  tasks: Task[]
  loading: boolean
  date: string | null
  onDateChange: (date: string) => void
  onClearDate: () => void
  onComplete: (task: Task) => void
  onRefresh: () => void
  onAdd: () => void
}

function InboxCard({ tasks, loading, date, onDateChange, onClearDate, onComplete, onRefresh, onAdd }: InboxCardProps) {
  const dateInputRef = useRef<HTMLInputElement>(null)
  const active = tasks.filter((t) => t.status !== "COMPLETED" && t.status !== "CANCELLED")
  const done   = tasks.filter((t) => t.status === "COMPLETED")

  return (
    <div className="overflow-hidden rounded-2xl border border-border/70 bg-card/70 backdrop-blur-sm">
      <div className="flex items-center gap-1.5 px-3 py-2.5 border-b border-border/40">
        <button
          className="flex-1 flex items-center gap-1.5 min-w-0 group"
          onClick={() => dateInputRef.current?.showPicker()}
          title="Filter by creation date"
        >
          <Calendar className="size-3.5 shrink-0 text-muted-foreground group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors" />
          <span className={cn(
            "text-xs font-medium truncate transition-colors",
            date ? "text-violet-700 dark:text-violet-300" : "text-muted-foreground group-hover:text-violet-600 dark:group-hover:text-violet-400"
          )}>
            {date ? formatDisplayDate(date) : "All dates"}
          </span>
          <input
            ref={dateInputRef}
            type="date"
            value={date ?? ""}
            onChange={(e) => e.target.value && onDateChange(e.target.value)}
            className="sr-only"
            tabIndex={-1}
          />
        </button>
        {date && (
          <button
            onClick={onClearDate}
            title="Clear date filter"
            className="shrink-0 text-[10px] text-muted-foreground hover:text-foreground bg-muted/60 hover:bg-muted rounded px-1.5 py-0.5 transition-colors"
          >
            Clear
          </button>
        )}
      </div>
      <div className="px-2 py-2 max-h-[360px] overflow-y-auto">
        {loading ? (
          <div className="space-y-1">{[1, 2].map((i) => <TaskRowSkeleton key={i} />)}</div>
        ) : tasks.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-6 text-center">
            <Sparkles className="size-5 text-pink-400" />
            <p className="text-xs text-muted-foreground">No unplanned tasks!</p>
            <Button variant="outline" size="sm" className="h-7 text-xs gap-1" onClick={onAdd}>
              <Plus className="size-3" /> Add Task
            </Button>
          </div>
        ) : (
          <>
            {active.map((t) => <TaskRow key={t.id} task={t} onComplete={onComplete} onRefresh={onRefresh} />)}
            {done.length > 0 && active.length > 0 && <Separator className="opacity-30 my-1" />}
            {done.map((t) => <TaskRow key={t.id} task={t} onComplete={onComplete} onRefresh={onRefresh} />)}
          </>
        )}
      </div>
    </div>
  )
}

// --- Tasks Page ---

type StatusFilter = "ALL" | "PENDING" | "IN_PROGRESS" | "COMPLETED"

export default function TasksPage() {
  const { completeTask, currentDate, setCurrentDate } = useTasksStore()

  const [pagedTasks,    setPagedTasks]    = useState<Task[]>([])
  const [pagination,    setPagination]    = useState<{ total: number; page: number; totalPages: number } | null>(null)
  const [loadingList,   setLoadingList]   = useState(false)
  const [loadingMore,   setLoadingMore]   = useState(false)

  const [stats,         setStats]         = useState<TaskStatsResponse | null>(null)
  const [statsLoading,  setStatsLoading]  = useState(false)

  const [dailyTasks,    setDailyTasks]    = useState<Task[]>([])
  const [inboxTasks,    setInboxTasks]    = useState<Task[]>([])
  const [loadingDaily,  setLoadingDaily]  = useState(false)
  const [loadingInbox,  setLoadingInbox]  = useState(false)
  const [unplannedDate, setUnplannedDate] = useState<string | null>(todayIso())

  const [statusFilter,  setStatusFilter]  = useState<StatusFilter>("ALL")
  const [createOpen,    setCreateOpen]    = useState(false)

  const [searchInput,      setSearchInput]      = useState("")
  const [searchResults,    setSearchResults]    = useState<Task[]>([])
  const [searchPagination, setSearchPagination] = useState<{ total: number; page: number; totalPages: number } | null>(null)
  const [searchLoading,    setSearchLoading]    = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isSearchMode = searchInput.trim().length > 0

  const fetchStats = useCallback(async () => {
    setStatsLoading(true)
    try { const data = await getTaskStats(); setStats(data) }
    catch { /* silent */ } finally { setStatsLoading(false) }
  }, [])

  const fetchTaskList = useCallback(async (page = 1, append = false) => {
    if (append) setLoadingMore(true)
    else setLoadingList(true)
    try {
      const data = await getPaginatedTasks({
        ...(statusFilter !== "ALL" ? { status: statusFilter as TaskStatus } : {}),
        page,
        limit: PAGE_SIZE,
      })
      setPagedTasks(prev => {
        const merged = append ? [...prev, ...data.items] : data.items
        const seen = new Set<string>()
        return merged.filter(t => { if (seen.has(t.id)) return false; seen.add(t.id); return true })
      })
      setPagination({ total: data.total, page: data.page, totalPages: data.totalPages })
    } catch { /* silent */ } finally {
      if (append) setLoadingMore(false)
      else setLoadingList(false)
    }
  }, [statusFilter])

  const fetchDailyTasks = useCallback(async () => {
    setLoadingDaily(true)
    try { const data = await getTasks({ date: currentDate, type: "PLANNED" }); setDailyTasks(data) }
    catch { /* silent */ } finally { setLoadingDaily(false) }
  }, [currentDate])

  const fetchInboxTasks = useCallback(async () => {
    setLoadingInbox(true)
    try {
      const data = await getTasks({ type: "UNPLANNED", ...(unplannedDate ? { date: unplannedDate } : {}) })
      setInboxTasks(data)
    } catch { /* silent */ } finally { setLoadingInbox(false) }
  }, [unplannedDate])

  const refreshAll = useCallback(() => {
    fetchStats(); fetchTaskList(1, false); fetchDailyTasks(); fetchInboxTasks()
  }, [fetchStats, fetchTaskList, fetchDailyTasks, fetchInboxTasks])

  const runSearch = useCallback(async (q: string, page = 1, append = false) => {
    if (append) setLoadingMore(true)
    else setSearchLoading(true)
    try {
      const data = await searchTasks(q, { page, limit: PAGE_SIZE })
      setSearchResults(prev => {
        const merged = append ? [...prev, ...data.items] : data.items
        const seen = new Set<string>()
        return merged.filter(t => { if (seen.has(t.id)) return false; seen.add(t.id); return true })
      })
      setSearchPagination({ total: data.total, page: data.page, totalPages: data.totalPages })
    } catch { /* silent */ } finally {
      if (append) setLoadingMore(false)
      else setSearchLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchStats()
    fetchDailyTasks()
    fetchInboxTasks()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    setPagedTasks([])
    fetchTaskList(1, false)
  }, [fetchTaskList])

  useEffect(() => { fetchDailyTasks() }, [fetchDailyTasks])
  useEffect(() => { fetchInboxTasks() }, [fetchInboxTasks])

  const handleSearchChange = (value: string) => {
    setSearchInput(value)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (!value.trim()) {
      setSearchResults([])
      setSearchPagination(null)
      return
    }
    debounceRef.current = setTimeout(() => runSearch(value.trim(), 1, false), 350)
  }

  const handleClearSearch = () => {
    setSearchInput("")
    setSearchResults([])
    setSearchPagination(null)
  }

  const handleCompleteTask = useCallback(async (task: Task) => {
    await completeTask(task.id)
    toast.success("Task completed!")
    refreshAll()
  }, [completeTask, refreshAll])

  const activePagination = isSearchMode ? searchPagination : pagination
  const displayTasks     = isSearchMode ? searchResults    : pagedTasks
  const hasMore          = activePagination ? activePagination.page < activePagination.totalPages : false
  const totalCount       = activePagination?.total ?? 0
  const loadedCount      = displayTasks.length

  const statTiles = useMemo(() => [
    {
      label: "Total",
      value: stats?.total ?? 0,
      sub: stats ? `${stats.byStatus.IN_PROGRESS} in progress` : "Loading…",
      iconBg: "bg-slate-500/10 text-slate-600 dark:text-slate-400",
      Icon: CheckSquare,
    },
    {
      label: "In Progress",
      value: stats?.byStatus.IN_PROGRESS ?? 0,
      sub: (stats?.byStatus.IN_PROGRESS ?? 0) > 0 ? "Currently active" : "Nothing active",
      iconBg: "bg-violet-500/10 text-violet-600 dark:text-violet-400",
      Icon: Play,
    },
    {
      label: "Completed",
      value: stats?.byStatus.COMPLETED ?? 0,
      sub: (stats?.byStatus.COMPLETED ?? 0) > 0 ? "Tasks finished" : "None completed",
      iconBg: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
      Icon: CheckCircle2,
    },
    {
      label: "Pending",
      value: stats?.byStatus.PENDING ?? 0,
      sub: (stats?.byStatus.PENDING ?? 0) > 0 ? "Awaiting action" : "All clear!",
      iconBg: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
      Icon: Clock,
    },
  ], [stats])

  const STATUS_TABS = [
    { key: "ALL"         as StatusFilter, label: "All",         count: stats?.total ?? null,                     dot: "bg-slate-400",   activeBg: "bg-slate-100 dark:bg-slate-800",     activeText: "text-slate-800 dark:text-slate-100",   activeBorder: "border-slate-400/60" },
    { key: "PENDING"     as StatusFilter, label: "Pending",     count: stats?.byStatus.PENDING ?? null,       dot: "bg-amber-400",   activeBg: "bg-amber-400/12",                   activeText: "text-amber-700 dark:text-amber-300",   activeBorder: "border-amber-400/50" },
    { key: "IN_PROGRESS" as StatusFilter, label: "In Progress", count: stats?.byStatus.IN_PROGRESS ?? null,  dot: "bg-violet-500",  activeBg: "bg-violet-500/12",                  activeText: "text-violet-700 dark:text-violet-300", activeBorder: "border-violet-500/50" },
    { key: "COMPLETED"   as StatusFilter, label: "Completed",   count: stats?.byStatus.COMPLETED ?? null,    dot: "bg-emerald-500", activeBg: "bg-emerald-500/12",                 activeText: "text-emerald-700 dark:text-emerald-300", activeBorder: "border-emerald-500/50" },
  ]

  return (
    <div className="flex h-full flex-col gap-6 p-4 md:p-6 overflow-x-hidden">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h1 className="flex items-center gap-2 text-xl font-bold tracking-tight">
            <CheckSquare className="size-5 text-violet-600 dark:text-violet-400" />
            Tasks
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">Manage your tasks and daily planner</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button variant="ghost" size="icon" className="size-9" onClick={refreshAll} title="Refresh">
            <RefreshCw className="size-4" />
          </Button>
          <Button size="sm" className="gap-1.5 h-9" onClick={() => setCreateOpen(true)}>
            <Plus className="size-4" />
            <span className="hidden sm:inline">New Task</span>
          </Button>
        </div>
      </div>

      {/* Stat tiles */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {statTiles.map((tile) => (
          <Card key={tile.label} className="border-border/50 shadow-none">
            <CardContent className="p-4">
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs text-muted-foreground font-medium">{tile.label}</p>
                <div className={cn("flex size-7 items-center justify-center rounded-lg", tile.iconBg)}>
                  <tile.Icon className="size-3.5" />
                </div>
              </div>
              <div className="mt-2">
                {statsLoading
                  ? <Skeleton className="h-7 w-12" />
                  : <p className="text-2xl font-bold">{tile.value}</p>
                }
                <p className="text-[11px] text-muted-foreground mt-0.5">{tile.sub}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main grid */}
      <div className="grid gap-4 xl:grid-cols-[1fr_288px]">
        {/* Left: task list */}
        <div className="flex flex-col gap-3 min-w-0">
          {/* Filter bar */}
          <div className="flex flex-col gap-2 rounded-2xl border border-border/60 bg-card/70 px-3 py-2.5 backdrop-blur-sm sm:flex-row sm:items-center sm:py-2">
            {/* Status pills — left side */}
            <div className="scrollbar-none flex items-center gap-1 flex-1 overflow-x-auto min-w-0 sm:order-first">
              {STATUS_TABS.map((tab) => {
                const isActive = statusFilter === tab.key
                return (
                  <button
                    key={tab.key}
                    onClick={() => setStatusFilter(tab.key)}
                    className={cn(
                      "flex items-center gap-1.5 h-7 pl-2.5 pr-3 rounded-lg border text-xs font-medium transition-all shrink-0",
                      isActive
                        ? cn(tab.activeBg, tab.activeText, tab.activeBorder)
                        : "border-transparent bg-transparent text-muted-foreground hover:bg-muted/60 hover:text-foreground",
                    )}
                  >
                    <span className={cn("size-1.5 rounded-full shrink-0", tab.dot, !isActive && "opacity-50")} />
                    {tab.label}
                    <span className={cn(
                      "ml-0.5 rounded-full px-1.5 py-px text-[10px] leading-none font-normal tabular-nums",
                      isActive ? "bg-black/10 dark:bg-white/15" : "bg-muted text-muted-foreground",
                    )}>
                      {tab.count ?? "—"}
                    </span>
                  </button>
                )
              })}
            </div>

            {/* Divider — desktop only */}
            <div className="hidden sm:block h-5 w-px bg-border/60 shrink-0 sm:order-2" />

            {/* Search — right side */}
            <div className="flex items-center gap-2 sm:order-last sm:shrink-0">
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
            </div>
          </div>

          {isSearchMode && !searchLoading && (
            <p className="text-xs text-muted-foreground px-1">
              {loadedCount} of {totalCount} result{totalCount !== 1 ? "s" : ""} for &ldquo;{searchInput.trim()}&rdquo;
            </p>
          )}

          {/* Tasks */}
          <div className="space-y-1.5">
            {(loadingList || searchLoading) ? (
              <div className="space-y-1.5">{[1, 2, 3].map((i) => <TaskRowSkeleton key={i} />)}</div>
            ) : displayTasks.length === 0 ? (
              <div className="flex flex-col items-center gap-3 py-12 text-center">
                <CheckSquare className="size-8 text-muted-foreground/30" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    {isSearchMode ? "No tasks match your search" : "No tasks found"}
                  </p>
                  {!isSearchMode && (
                    <Button variant="outline" size="sm" className="mt-3 h-7 text-xs gap-1" onClick={() => setCreateOpen(true)}>
                      <Plus className="size-3" /> Create a task
                    </Button>
                  )}
                </div>
              </div>
            ) : (
              <>
                {displayTasks.map((t) => (
                  <TaskRow key={t.id} task={t} onComplete={handleCompleteTask} onRefresh={refreshAll} />
                ))}
                {hasMore && (
                  <div className="flex flex-col items-center gap-2 py-4">
                    <button
                      onClick={() => isSearchMode
                        ? runSearch(searchInput.trim(), (searchPagination?.page ?? 0) + 1, true)
                        : fetchTaskList((pagination?.page ?? 0) + 1, true)
                      }
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
                            Load {Math.min(PAGE_SIZE, totalCount - loadedCount)} more
                          </span>
                          <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] text-muted-foreground tabular-nums">
                            {totalCount - loadedCount} remaining
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

        {/* Right sidebar */}
        <div className="space-y-3 min-w-0">
          <TodayCard
            tasks={dailyTasks}
            loading={loadingDaily}
            date={currentDate}
            onDateNav={(dir) => setCurrentDate(navigateDate(currentDate, dir))}
            onJumpToday={() => setCurrentDate(todayIso())}
            onJumpTo={(d) => setCurrentDate(d)}
            onComplete={handleCompleteTask}
            onRefresh={refreshAll}
            onAdd={() => setCreateOpen(true)}
          />
          <InboxCard
            tasks={inboxTasks}
            loading={loadingInbox}
            date={unplannedDate}
            onDateChange={(d) => setUnplannedDate(d)}
            onClearDate={() => setUnplannedDate(null)}
            onComplete={handleCompleteTask}
            onRefresh={refreshAll}
            onAdd={() => setCreateOpen(true)}
          />
        </div>
      </div>

      <CreateTaskDialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        defaultDate={currentDate}
        onCreated={refreshAll}
      />
    </div>
  )
}
