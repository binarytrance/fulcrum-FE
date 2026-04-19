"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { io, Socket } from "socket.io-client"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"

import { getAccessToken } from "@/lib/api"
import { createManualSession } from "@/lib/sessions-api"
import { useTasksStore } from "@/store/tasks-store"
import { useSessionStore } from "@/store/session-store"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog"
import { Separator } from "@/components/ui/separator"
import { toast } from "@/components/ui/toast"
import { cn } from "@/lib/utils"
import PlantGrowth from "@/components/timer/PlantGrowth"

import {
  ArrowLeft,
  Square,
  AlertTriangle,
  Clock,
  CheckCircle,
  Leaf,
  WifiOff,
  Zap,
  Timer,
  Target,
  Activity,
} from "lucide-react"

// ─── Types ────────────────────────────────────────────────────────────────────

type TimerStatus =
  | "connecting"   // socket opened, waiting for sessionStarted
  | "running"      // session active
  | "stopping"     // stop emitted, waiting for sessionStopped
  | "completed"    // sessionStopped received → show summary
  | "fallback"     // socket failed → local timer mode
  | "error"        // unrecoverable

interface CompletionData {
  sessionId: string
  durationMinutes: number
  netFocusMinutes: number
  distractionCount: number
  plantStatus: string
  plantGrowthPercent: number
  completedAt: string
}

// ─── Zod Schemas ─────────────────────────────────────────────────────────────

const distractionSchema = z.object({
  reason: z.string().min(1, "Please describe the distraction"),
  estimatedMinutes: z.number().min(1, "At least 1 minute"),
})

const manualSessionSchema = z.object({
  durationMinutes: z.number().min(1, "At least 1 minute"),
  note: z.string().optional(),
})

type DistractionForm  = z.infer<typeof distractionSchema>
type ManualForm       = z.infer<typeof manualSessionSchema>

// ─── Utilities ────────────────────────────────────────────────────────────────

function formatClock(totalSeconds: number): string {
  const h = Math.floor(totalSeconds / 3600)
  const m = Math.floor((totalSeconds % 3600) / 60)
  const s = totalSeconds % 60
  if (h > 0) {
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`
  }
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`
}

function msToSeconds(ms: number): number {
  return Math.floor(ms / 1000)
}

// ─── Distraction Log Dialog ───────────────────────────────────────────────────

function DistractionDialog({
  open,
  onClose,
  onSubmit,
}: {
  open: boolean
  onClose: () => void
  onSubmit: (reason: string, estimatedMinutes: number) => void
}) {
  const form = useForm<DistractionForm>({
    resolver: zodResolver(distractionSchema),
    defaultValues: { reason: "", estimatedMinutes: 5 },
  })

  useEffect(() => {
    if (open) form.reset({ reason: "", estimatedMinutes: 5 })
  }, [open, form])

  const handleSubmit = (data: DistractionForm) => {
    onSubmit(data.reason, data.estimatedMinutes)
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-sm bg-zinc-900 border-zinc-700 text-zinc-100">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-zinc-100">
            <AlertTriangle className="h-5 w-5 text-amber-400" />
            Log a Distraction
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="distraction-reason" className="text-zinc-300">
              What interrupted you?
            </Label>
            <Input
              id="distraction-reason"
              placeholder="e.g. Phone notification, colleague question…"
              className="bg-zinc-800 border-zinc-600 text-zinc-100 placeholder:text-zinc-500"
              {...form.register("reason")}
            />
            {form.formState.errors.reason && (
              <p className="text-xs text-red-400">{form.formState.errors.reason.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="distraction-mins" className="text-zinc-300">
              Estimated time lost (minutes)
            </Label>
            <Input
              id="distraction-mins"
              type="number"
              min={1}
              className="bg-zinc-800 border-zinc-600 text-zinc-100"
              {...form.register("estimatedMinutes", { valueAsNumber: true })}
            />
            {form.formState.errors.estimatedMinutes && (
              <p className="text-xs text-red-400">
                {form.formState.errors.estimatedMinutes.message}
              </p>
            )}
          </div>

          <DialogFooter>
            <DialogClose asChild>
              <Button
                type="button"
                variant="ghost"
                className="text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800"
              >
                Cancel
              </Button>
            </DialogClose>
            <Button
              type="submit"
              className="bg-amber-500 hover:bg-amber-400 text-zinc-950 font-semibold"
            >
              Log it
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// ─── Stop Confirm Dialog ──────────────────────────────────────────────────────

function StopConfirmDialog({
  open,
  onClose,
  onConfirm,
  elapsedSeconds,
}: {
  open: boolean
  onClose: () => void
  onConfirm: () => void
  elapsedSeconds: number
}) {
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-sm bg-zinc-900 border-zinc-700 text-zinc-100">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-zinc-100">
            <Square className="h-5 w-5 text-red-400" />
            End Session?
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-2">
          <p className="text-zinc-400 text-sm">
            You&apos;ve been focused for{" "}
            <span className="font-semibold text-zinc-200">
              {formatClock(elapsedSeconds)}
            </span>
            . Are you sure you want to stop?
          </p>
          <p className="text-xs text-zinc-500">
            Your session will be saved and your plant will keep its current growth.
          </p>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="ghost"
            className="text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800"
            onClick={onClose}
          >
            Keep Going
          </Button>
          <Button
            variant="destructive"
            onClick={() => { onConfirm(); onClose() }}
            className="bg-red-500 hover:bg-red-400 font-semibold"
          >
            End Session
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ─── Fallback Manual Session Form ─────────────────────────────────────────────

function FallbackManualForm({
  taskId,
  taskTitle,
  localSeconds,
  onSaved,
}: {
  taskId: string
  taskTitle: string
  localSeconds: number
  onSaved: () => void
}) {
  const form = useForm<ManualForm>({
    resolver: zodResolver(manualSessionSchema),
    defaultValues: {
      durationMinutes: Math.max(1, Math.round(localSeconds / 60)),
      note: "",
    },
  })
  const [saved, setSaved] = useState(false)

  const onSubmit = async (data: ManualForm) => {
    try {
      await createManualSession({
        taskId,
        durationMinutes: data.durationMinutes,
        note: data.note || undefined,
      })
      toast.success("Session logged!", `${data.durationMinutes} min recorded for "${taskTitle}".`)
      setSaved(true)
      onSaved()
    } catch {
      toast.error("Failed to save session", "Please try again.")
    }
  }

  if (saved) {
    return (
      <div className="text-center space-y-2">
        <CheckCircle className="h-10 w-10 text-green-400 mx-auto" />
        <p className="text-green-400 font-semibold">Session saved!</p>
      </div>
    )
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-1.5">
        <Label className="text-zinc-300">Duration (minutes)</Label>
        <Input
          type="number"
          min={1}
          className="bg-zinc-800 border-zinc-600 text-zinc-100"
          {...form.register("durationMinutes", { valueAsNumber: true })}
        />
      </div>
      <div className="space-y-1.5">
        <Label className="text-zinc-300">Note (optional)</Label>
        <Textarea
          placeholder="What did you work on?"
          rows={2}
          className="bg-zinc-800 border-zinc-600 text-zinc-100 placeholder:text-zinc-500 resize-none"
          {...form.register("note")}
        />
      </div>
      <Button
        type="submit"
        disabled={form.formState.isSubmitting}
        className="w-full bg-green-600 hover:bg-green-500 font-semibold"
      >
        {form.formState.isSubmitting ? "Saving…" : "Save Manual Session"}
      </Button>
    </form>
  )
}

// ─── Growth Ring ──────────────────────────────────────────────────────────────

function GrowthRing({
  percent,
  size = 240,
}: {
  percent: number
  size?: number
}) {
  const r       = size / 2 - 10
  const circ    = 2 * Math.PI * r
  const offset  = circ * (1 - percent / 100)

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className="absolute inset-0 m-auto"
      aria-hidden
    >
      {/* Track ring */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke="rgba(255,255,255,0.06)"
        strokeWidth={6}
      />
      {/* Progress ring */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke={percent > 85 ? "#f9a8d4" : "#4ade80"}
        strokeWidth={6}
        strokeLinecap="round"
        strokeDasharray={circ}
        strokeDashoffset={offset}
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
        style={{ transition: "stroke-dashoffset 1s ease-in-out, stroke 1.5s ease-in-out" }}
      />
    </svg>
  )
}

// ─── Completion Screen ────────────────────────────────────────────────────────

function CompletionScreen({
  data,
  taskTitle,
  onBack,
}: {
  data: CompletionData
  taskTitle: string
  onBack: () => void
}) {
  const [showDetails, setShowDetails] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setShowDetails(true), 400)
    return () => clearTimeout(t)
  }, [])

  const efficiencyPct = data.netFocusMinutes > 0
    ? Math.round((data.netFocusMinutes / data.durationMinutes) * 100)
    : 100

  return (
    <div className="fixed inset-0 bg-zinc-950 flex flex-col items-center justify-center px-6 py-10 z-50">
      {/* Plant */}
      <div
        className={cn(
          "transition-all duration-1000",
          showDetails ? "scale-100 opacity-100" : "scale-50 opacity-0"
        )}
      >
        <PlantGrowth growthPercent={data.plantGrowthPercent} size={200} />
      </div>

      {/* Headline */}
      <div
        className={cn(
          "text-center mt-4 transition-all duration-700 delay-300",
          showDetails ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0"
        )}
      >
        <h1 className="text-4xl font-extrabold text-white mb-1">
          Session Complete!
        </h1>
        <p className="text-zinc-400 text-lg">{taskTitle}</p>
      </div>

      {/* Stats grid */}
      <div
        className={cn(
          "grid grid-cols-2 sm:grid-cols-4 gap-3 mt-8 w-full max-w-lg transition-all duration-700 delay-500",
          showDetails ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0"
        )}
      >
        {[
          {
            icon: Clock,
            label: "Duration",
            value: `${data.durationMinutes}m`,
            color: "text-blue-400",
          },
          {
            icon: Zap,
            label: "Net Focus",
            value: `${data.netFocusMinutes}m`,
            color: "text-green-400",
          },
          {
            icon: AlertTriangle,
            label: "Distractions",
            value: data.distractionCount,
            color: data.distractionCount > 0 ? "text-amber-400" : "text-green-400",
          },
          {
            icon: Activity,
            label: "Efficiency",
            value: `${efficiencyPct}%`,
            color: efficiencyPct >= 90 ? "text-green-400" : efficiencyPct >= 70 ? "text-amber-400" : "text-red-400",
          },
        ].map(({ icon: Icon, label, value, color }) => (
          <div
            key={label}
            className="rounded-2xl bg-zinc-900 border border-zinc-800 p-4 text-center"
          >
            <Icon className={cn("h-5 w-5 mx-auto mb-2", color)} />
            <p className={cn("text-2xl font-bold tabular-nums", color)}>{value}</p>
            <p className="text-xs text-zinc-500 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Plant status */}
      {data.plantStatus && (
        <div
          className={cn(
            "mt-6 flex items-center gap-2 px-4 py-2 rounded-full border border-green-500/30 bg-green-500/10 transition-all duration-700 delay-700",
            showDetails ? "opacity-100" : "opacity-0"
          )}
        >
          <Leaf className="h-4 w-4 text-green-400" />
          <span className="text-sm text-green-400 font-medium capitalize">
            Plant: {data.plantStatus.toLowerCase()}
          </span>
          <span className="text-xs text-zinc-500">
            ({Math.round(data.plantGrowthPercent)}% growth)
          </span>
        </div>
      )}

      {/* Actions */}
      <div
        className={cn(
          "flex gap-3 mt-8 transition-all duration-700 delay-700",
          showDetails ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0"
        )}
      >
        <Button
          variant="outline"
          className="border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:text-white"
          onClick={onBack}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Tasks
        </Button>
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function TimerPage() {
  const params  = useParams()
  const router  = useRouter()
  const taskId  = Array.isArray(params.taskId) ? params.taskId[0] : (params.taskId ?? "")

  // Stores
  const { tasks, fetchTasks }                          = useTasksStore()
  const { startSession, updateElapsed, endSession }    = useSessionStore()

  // Task data
  const task = tasks.find((t) => t.id === taskId)

  // Timer state
  const [status, setStatus]                     = useState<TimerStatus>("connecting")
  const [elapsedSeconds, setElapsedSeconds]     = useState(0)
  const [plantGrowth, setPlantGrowth]           = useState(0)
  const [estimatedMinutes, setEstimatedMinutes] = useState<number | null>(null)
  const [distractions, setDistractions]         = useState<number>(0)
  const [completion, setCompletion]             = useState<CompletionData | null>(null)
  const [socketError, setSocketError]           = useState<string | null>(null)

  // Dialog state
  const [distractionOpen, setDistractionOpen]   = useState(false)
  const [stopConfirmOpen, setStopConfirmOpen]   = useState(false)
  const [backWarningOpen, setBackWarningOpen]   = useState(false)

  // Refs
  const socketRef       = useRef<Socket | null>(null)
  const sessionIdRef    = useRef<string | null>(null)
  const tickRef         = useRef<ReturnType<typeof setInterval> | null>(null)
  const heartbeatRef    = useRef<ReturnType<typeof setInterval> | null>(null)
  const startTimeRef    = useRef<number>(0)

  // ── Local tick (runs every second for display) ─────────────────────────────

  const startLocalTick = useCallback((initialMs = 0) => {
    if (tickRef.current) clearInterval(tickRef.current)
    startTimeRef.current = Date.now() - initialMs
    tickRef.current = setInterval(() => {
      const elapsed = Date.now() - startTimeRef.current
      setElapsedSeconds(msToSeconds(elapsed))
    }, 1000)
  }, [])

  const stopLocalTick = useCallback(() => {
    if (tickRef.current) { clearInterval(tickRef.current); tickRef.current = null }
  }, [])

  // ── Heartbeat interval ────────────────────────────────────────────────────

  const startHeartbeat = useCallback(() => {
    if (heartbeatRef.current) clearInterval(heartbeatRef.current)
    heartbeatRef.current = setInterval(() => {
      if (socketRef.current?.connected && sessionIdRef.current) {
        socketRef.current.emit("heartbeat", { sessionId: sessionIdRef.current })
      }
    }, 30_000)
  }, [])

  const stopHeartbeat = useCallback(() => {
    if (heartbeatRef.current) { clearInterval(heartbeatRef.current); heartbeatRef.current = null }
  }, [])

  // ── Socket lifecycle ──────────────────────────────────────────────────────

  useEffect(() => {
    const token = getAccessToken()
    if (!taskId) return

    // Make sure we have the task in the store
    if (!task) fetchTasks()

    const socket = io("http://localhost:6969/sessions", {
      auth: { token },
      transports: ["websocket"],
      timeout: 8000,
      reconnection: false,
    })
    socketRef.current = socket

    // ── connect ──────────────────────────────────────────────────────────────
    socket.on("connect", () => {
      setStatus("connecting")
      socket.emit("startSession", { taskId })
    })

    // ── sessionStarted ───────────────────────────────────────────────────────
    socket.on(
      "sessionStarted",
      (data: {
        sessionId: string
        serverStartedAt: string
        taskEstimatedDurationMinutes?: number
      }) => {
        sessionIdRef.current = data.sessionId
        setEstimatedMinutes(data.taskEstimatedDurationMinutes ?? null)
        setStatus("running")
        startLocalTick(0)
        startHeartbeat()
        startSession({
          sessionId: data.sessionId,
          taskId,
          taskTitle: task?.title ?? "Focus Session",
          startedAt: data.serverStartedAt,
          elapsedMs: 0,
          plantGrowthPercent: 0,
          taskEstimatedDurationMs: (data.taskEstimatedDurationMinutes ?? 0) * 60_000,
        })
      }
    )

    // ── sessionResume (already active session) ───────────────────────────────
    socket.on(
      "sessionResume",
      (data: {
        sessionId: string
        elapsedMs: number
        taskId: string
        taskEstimatedDurationMinutes?: number
        plantGrowthPercent?: number
      }) => {
        sessionIdRef.current = data.sessionId
        setEstimatedMinutes(data.taskEstimatedDurationMinutes ?? null)
        setPlantGrowth(data.plantGrowthPercent ?? 0)
        setStatus("running")
        startLocalTick(data.elapsedMs)
        startHeartbeat()
      }
    )

    // ── heartbeatAck ─────────────────────────────────────────────────────────
    socket.on(
      "heartbeatAck",
      (data: { elapsedMs: number; plantGrowthPercent?: number }) => {
        setPlantGrowth(data.plantGrowthPercent ?? 0)
        updateElapsed(data.elapsedMs, data.plantGrowthPercent ?? 0)
      }
    )

    // ── distractionLogged ────────────────────────────────────────────────────
    socket.on(
      "distractionLogged",
      (data: { distractions: unknown[]; plantStatus?: string }) => {
        setDistractions(Array.isArray(data.distractions) ? data.distractions.length : 0)
        toast.info("Distraction logged")
      }
    )

    // ── sessionStopped ───────────────────────────────────────────────────────
    socket.on(
      "sessionStopped",
      (data: {
        sessionId: string
        durationMinutes: number
        netFocusMinutes: number
        distractionCount: number
        plantStatus: string
        plantGrowthPercent: number
        completedAt: string
      }) => {
        stopLocalTick()
        stopHeartbeat()
        setStatus("completed")
        setCompletion(data)
        endSession()
      }
    )

    // ── error ────────────────────────────────────────────────────────────────
    socket.on("error", (data: { message: string }) => {
      setSocketError(data.message)
      toast.error("Session error", data.message)
    })

    // ── connect_error → fallback ─────────────────────────────────────────────
    socket.on("connect_error", () => {
      setStatus("fallback")
      setSocketError("Could not connect to the session server.")
      startLocalTick(0)
    })

    return () => {
      stopLocalTick()
      stopHeartbeat()
      socket.disconnect()
      socketRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [taskId])

  // ── Stop session ──────────────────────────────────────────────────────────

  const handleStop = useCallback(() => {
    if (!sessionIdRef.current || !socketRef.current) return
    setStatus("stopping")
    socketRef.current.emit("stopSession", { sessionId: sessionIdRef.current })
  }, [])

  // ── Log distraction ───────────────────────────────────────────────────────

  const handleLogDistraction = useCallback(
    (reason: string, estimatedMinutes: number) => {
      if (!sessionIdRef.current || !socketRef.current) return
      socketRef.current.emit("logDistraction", {
        sessionId: sessionIdRef.current,
        reason,
        estimatedMinutes,
      })
      setDistractions((prev) => prev + 1)
    },
    []
  )

  // ── Navigate away ─────────────────────────────────────────────────────────

  const handleBack = useCallback(() => {
    if (status === "running" || status === "fallback") {
      setBackWarningOpen(true)
    } else {
      router.push("/tasks")
    }
  }, [status, router])

  const handleForceBack = useCallback(() => {
    stopLocalTick()
    stopHeartbeat()
    socketRef.current?.disconnect()
    endSession()
    router.push("/tasks")
  }, [stopLocalTick, stopHeartbeat, endSession, router])

  // ─── Computed ──────────────────────────────────────────────────────────────

  const taskTitle     = task?.title ?? "Focus Session"
  const taskEstimated = estimatedMinutes ?? (task?.estimatedDuration != null ? Math.round(task.estimatedDuration / 60000) : null)
  const isConnected   = status === "running" || status === "stopping"
  const isFallback    = status === "fallback"
  const isStopping    = status === "stopping"

  // Progress towards estimated duration
  const estimatedSeconds      = (taskEstimated ?? 0) * 60
  const durationProgressPct   = estimatedSeconds > 0
    ? Math.min(100, (elapsedSeconds / estimatedSeconds) * 100)
    : 0

  // ─── Completion screen ────────────────────────────────────────────────────

  if (status === "completed" && completion) {
    return (
      <CompletionScreen
        data={completion}
        taskTitle={taskTitle}
        onBack={() => router.push("/tasks")}
      />
    )
  }

  // ─── Main timer UI ────────────────────────────────────────────────────────

  return (
    <div className="fixed inset-0 bg-zinc-950 flex flex-col overflow-hidden z-40 select-none">

      {/* ── Top bar ─────────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-5 py-4 shrink-0">
        <Button
          variant="ghost"
          size="sm"
          className="text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 gap-2"
          onClick={handleBack}
        >
          <ArrowLeft className="h-4 w-4" />
          <span className="hidden sm:inline">Tasks</span>
        </Button>

        {/* Connection badge */}
        <div className="flex items-center gap-2">
          {isFallback ? (
            <Badge
              variant="outline"
              className="border-amber-500/50 text-amber-400 gap-1.5 text-xs"
            >
              <WifiOff className="h-3 w-3" />
              Offline mode
            </Badge>
          ) : isConnected ? (
            <Badge
              variant="outline"
              className="border-green-500/50 text-green-400 gap-1.5 text-xs"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
              Live session
            </Badge>
          ) : (
            <Badge
              variant="outline"
              className="border-zinc-600 text-zinc-500 gap-1.5 text-xs"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-zinc-500 animate-pulse" />
              {status === "connecting" ? "Connecting…" : "Stopping…"}
            </Badge>
          )}

          {/* Distraction counter */}
          {distractions > 0 && (
            <Badge
              variant="outline"
              className="border-amber-500/50 text-amber-400 gap-1.5 text-xs"
            >
              <AlertTriangle className="h-3 w-3" />
              {distractions}
            </Badge>
          )}
        </div>
      </div>

      {/* ── Center content ──────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-4 min-h-0">

        {/* Task title */}
        <div className="text-center mb-8 max-w-sm">
          <p className="text-xs font-semibold uppercase tracking-widest text-zinc-500 mb-2 flex items-center justify-center gap-1.5">
            <Target className="h-3.5 w-3.5" />
            Focusing on
          </p>
          <h1 className="text-xl sm:text-2xl font-bold text-white leading-snug line-clamp-2">
            {taskTitle}
          </h1>
          {taskEstimated && (
            <p className="text-sm text-zinc-500 mt-1.5">
              Estimated: {taskEstimated} min
            </p>
          )}
        </div>

        {/* Plant + timer ring stack */}
        <div className="relative flex items-center justify-center mb-8">
          {/* Outer glow effect */}
          <div
            className="absolute rounded-full blur-3xl opacity-20 transition-all duration-2000"
            style={{
              width: 280,
              height: 280,
              background: plantGrowth > 85
                ? "radial-gradient(circle, #f9a8d4, transparent)"
                : "radial-gradient(circle, #4ade80, transparent)",
            }}
          />

          {/* Growth ring */}
          <div className="relative" style={{ width: 260, height: 260 }}>
            <GrowthRing percent={plantGrowth} size={260} />

            {/* Plant SVG */}
            <div className="absolute inset-0 flex items-center justify-center">
              <PlantGrowth growthPercent={plantGrowth} size={180} />
            </div>
          </div>
        </div>

        {/* Clock display */}
        <div className="text-center mb-2">
          <div
            className={cn(
              "font-mono font-extrabold tabular-nums tracking-tight leading-none",
              "transition-all duration-300",
              elapsedSeconds > 0 && (status === "running" || isFallback)
                ? "text-white"
                : "text-zinc-400",
              elapsedSeconds >= 3600
                ? "text-5xl sm:text-7xl"
                : "text-6xl sm:text-8xl",
            )}
          >
            {formatClock(elapsedSeconds)}
          </div>

          {/* Estimated duration progress */}
          {taskEstimated && taskEstimated > 0 && (
            <div className="mt-4 space-y-1.5 max-w-xs mx-auto">
              <div className="flex justify-between text-[11px] text-zinc-600">
                <span>0</span>
                <span
                  className={cn(
                    "font-medium",
                    durationProgressPct >= 100 ? "text-green-400" : "text-zinc-500"
                  )}
                >
                  {Math.round(durationProgressPct)}% of {taskEstimated}m
                </span>
                <span>{taskEstimated}m</span>
              </div>
              <div className="h-1 w-full bg-zinc-800 rounded-full overflow-hidden">
                <div
                  className={cn(
                    "h-full rounded-full transition-all duration-1000",
                    durationProgressPct >= 100 ? "bg-green-400" : "bg-zinc-400"
                  )}
                  style={{ width: `${Math.min(100, durationProgressPct)}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Status text */}
        <p className="text-sm text-zinc-500 mt-4 mb-6 min-h-5">
          {status === "connecting" && "Starting your session…"}
          {status === "running" && elapsedSeconds < 10 && "Session started. Stay focused! 🌱"}
          {status === "stopping" && "Wrapping up your session…"}
          {isFallback && (
            <span className="text-amber-500/80">
              Running in offline mode — session will be logged manually.
            </span>
          )}
          {socketError && !isFallback && (
            <span className="text-red-400">{socketError}</span>
          )}
        </p>

        {/* ── Controls ──────────────────────────────────────────────────────── */}
        <div className="flex items-center gap-3">

          {/* Log distraction — only when running */}
          {(isConnected || isFallback) && (
            <Button
              variant="outline"
              className={cn(
                "border-zinc-700 text-zinc-400 hover:border-amber-500/60 hover:text-amber-400 hover:bg-amber-500/[0.07]",
                "gap-2 transition-all"
              )}
              onClick={() => setDistractionOpen(true)}
              disabled={isFallback}
              title={isFallback ? "Distraction logging unavailable offline" : undefined}
            >
              <AlertTriangle className="h-4 w-4" />
              <span className="hidden sm:inline">Log Distraction</span>
            </Button>
          )}

          {/* Stop */}
          {isConnected && (
            <Button
              size="lg"
              className={cn(
                "gap-2.5 font-bold px-8 py-6 text-base rounded-2xl",
                "bg-red-500 hover:bg-red-400 text-white",
                "shadow-lg shadow-red-500/30",
                "transition-all hover:scale-105 active:scale-95",
                isStopping && "opacity-70 pointer-events-none"
              )}
              onClick={() => setStopConfirmOpen(true)}
              disabled={isStopping}
            >
              <Square className="h-5 w-5" />
              {isStopping ? "Stopping…" : "Stop Session"}
            </Button>
          )}

          {/* Fallback stop */}
          {isFallback && (
            <Button
              size="lg"
              className={cn(
                "gap-2.5 font-bold px-8 py-6 text-base rounded-2xl",
                "bg-zinc-700 hover:bg-zinc-600 text-white",
                "transition-all hover:scale-105 active:scale-95"
              )}
              onClick={() => { stopLocalTick(); setStatus("error") }}
            >
              <Square className="h-5 w-5" />
              Stop Local Timer
            </Button>
          )}
        </div>
      </div>

      {/* ── Fallback manual log form ─────────────────────────────────────────── */}
      {(status === "error" || (isFallback && !isConnected)) && (
        <div className="shrink-0 px-6 pb-8">
          <Separator className="bg-zinc-800 mb-6" />
          <div className="max-w-sm mx-auto space-y-4">
            <div className="flex items-center gap-2">
              <Timer className="h-4 w-4 text-zinc-500" />
              <p className="text-sm font-semibold text-zinc-300">
                {status === "error"
                  ? "Log your session manually"
                  : "Stopped — save your time"}
              </p>
            </div>
            <FallbackManualForm
              taskId={taskId}
              taskTitle={taskTitle}
              localSeconds={elapsedSeconds}
              onSaved={() => setTimeout(() => router.push("/tasks"), 1500)}
            />
          </div>
        </div>
      )}

      {/* ── Dialogs ──────────────────────────────────────────────────────────── */}

      <DistractionDialog
        open={distractionOpen}
        onClose={() => setDistractionOpen(false)}
        onSubmit={handleLogDistraction}
      />

      <StopConfirmDialog
        open={stopConfirmOpen}
        onClose={() => setStopConfirmOpen(false)}
        onConfirm={handleStop}
        elapsedSeconds={elapsedSeconds}
      />

      {/* Back-navigation warning */}
      <Dialog open={backWarningOpen} onOpenChange={setBackWarningOpen}>
        <DialogContent className="sm:max-w-sm bg-zinc-900 border-zinc-700 text-zinc-100">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-zinc-100">
              <AlertTriangle className="h-5 w-5 text-amber-400" />
              Leave session?
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-zinc-400">
            Your timer will be stopped and this session will{" "}
            <strong className="text-zinc-200">not</strong> be saved. Are you sure?
          </p>
          <DialogFooter>
            <Button
              variant="ghost"
              className="text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800"
              onClick={() => setBackWarningOpen(false)}
            >
              Stay
            </Button>
            <Button
              variant="destructive"
              className="bg-red-600 hover:bg-red-500"
              onClick={() => { setBackWarningOpen(false); handleForceBack() }}
            >
              Leave anyway
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
