"use client"

import Link from "next/link"
import {
  Calendar,
  Clock,
  CheckCircle2,
  Target,
  Inbox,
  Timer,
  Tag,
  FileText,
} from "lucide-react"
import type { Task } from "@/types"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { cn } from "@/lib/utils"

function statusVariant(s: string): "success" | "warning" | "secondary" | "destructive" {
  switch (s) {
    case "IN_PROGRESS": return "warning"
    case "COMPLETED":   return "success"
    case "CANCELLED":   return "destructive"
    default:            return "secondary"
  }
}

function priorityVariant(p: string): "destructive" | "warning" | "secondary" {
  switch (p) {
    case "HIGH":   return "destructive"
    case "MEDIUM": return "warning"
    default:       return "secondary"
  }
}

function formatDuration(ms: number): string {
  const totalSec = Math.round(ms / 1000)
  const h = Math.floor(totalSec / 3600)
  const m = Math.floor((totalSec % 3600) / 60)
  const s = totalSec % 60
  if (h > 0) return s > 0 ? `${h}h ${m}m ${s}s` : m > 0 ? `${h}h ${m}m` : `${h}h`
  return s > 0 ? `${m}m ${s}s` : `${m}m`
}

function computeAccuracy(est?: number, act?: number): number | null {
  if (!est || est <= 0 || !act || act <= 0) return null
  return Math.min(100, Math.round((Math.min(est, act) / Math.max(est, act)) * 100))
}

function formatDate(iso: string): string {
  const raw = iso.includes("T") ? iso.split("T")[0] : iso
  return new Date(raw + "T00:00:00").toLocaleDateString("en-US", {
    weekday: "short",
    month: "long",
    day: "numeric",
    year: "numeric",
  })
}

function formatTimestamp(iso: string): string {
  return new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  })
}

interface TaskDetailDialogProps {
  task: Task | null
  open: boolean
  onClose: () => void
}

export function TaskDetailDialog({ task, open, onClose }: TaskDetailDialogProps) {
  if (!task) return null

  const isDone = task.status === "COMPLETED" || task.status === "CANCELLED"
  const isActive = task.status === "IN_PROGRESS"

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader className="pb-1">
          <DialogTitle className="flex items-center gap-3 text-lg">
            <div className={cn(
              "flex size-9 shrink-0 items-center justify-center rounded-xl border",
              isDone
                ? "bg-emerald-500/10 border-emerald-500/20"
                : isActive
                  ? "bg-violet-500/15 border-violet-500/20"
                  : "bg-muted border-border/60",
            )}>
              {isDone
                ? <CheckCircle2 className="size-5 text-emerald-600 dark:text-emerald-400" />
                : <FileText className="size-5 text-violet-600 dark:text-violet-400" />}
            </div>
            <div className="min-w-0 flex-1">
              <p className={cn("leading-snug break-words", isDone && "line-through text-muted-foreground")}>
                {task.title}
              </p>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="h-px bg-border/60 -mx-6" />

        <div className="space-y-5 pt-1">
          {/* Status badges row */}
          <div className="flex flex-wrap gap-2">
            <Badge variant={statusVariant(task.status)} className="text-xs px-2 py-0.5">
              {task.status.replace("_", " ")}
            </Badge>
            <Badge variant={priorityVariant(task.priority)} className="text-xs px-2 py-0.5">
              {task.priority}
            </Badge>
            {task.type === "UNPLANNED" ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2 py-0.5 text-xs font-medium text-amber-600 dark:text-amber-400">
                <Inbox className="size-3" /> Unplanned
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 rounded-full bg-violet-500/10 px-2 py-0.5 text-xs font-medium text-violet-700 dark:text-violet-300">
                <Calendar className="size-3" /> Planned
              </span>
            )}
          </div>

          {/* Description */}
          {task.description && (
            <div className="space-y-1.5">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-widest">Description</p>
              <p className="text-sm leading-relaxed text-foreground whitespace-pre-wrap">{task.description}</p>
            </div>
          )}

          {/* Info grid */}
          <div className="grid grid-cols-2 gap-3">
            {task.scheduledFor && (
              <div className="rounded-xl border border-border/60 bg-muted/20 p-3 space-y-1">
                <p className="flex items-center gap-1.5 text-[10px] font-medium text-muted-foreground uppercase tracking-widest">
                  <Calendar className="size-3" /> Scheduled For
                </p>
                <p className="text-sm font-medium">{formatDate(task.scheduledFor)}</p>
              </div>
            )}
            {task.estimatedDuration != null && (
              <div className="rounded-xl border border-border/60 bg-muted/20 p-3 space-y-1">
                <p className="flex items-center gap-1.5 text-[10px] font-medium text-muted-foreground uppercase tracking-widest">
                  <Clock className="size-3" /> Estimated
                </p>
                <p className="text-sm font-medium">{formatDuration(task.estimatedDuration)}</p>
              </div>
            )}
            {task.actualDuration != null && (
              <div className="rounded-xl border border-border/60 bg-muted/20 p-3 space-y-1">
                <p className="flex items-center gap-1.5 text-[10px] font-medium text-muted-foreground uppercase tracking-widest">
                  <Timer className="size-3" /> Actual
                </p>
                <p className="text-sm font-medium text-emerald-600 dark:text-emerald-400">{formatDuration(task.actualDuration)}</p>
              </div>
            )}
            {(() => {
              const acc = computeAccuracy(task.estimatedDuration, task.actualDuration)
              return acc != null ? (
                <div className="rounded-xl border border-border/60 bg-muted/20 p-3 space-y-1">
                  <p className="flex items-center gap-1.5 text-[10px] font-medium text-muted-foreground uppercase tracking-widest">
                    <Tag className="size-3" /> Accuracy
                  </p>
                  <p className={cn("text-sm font-bold",
                    acc >= 90 ? "text-emerald-600" :
                    acc >= 70 ? "text-amber-600" : "text-red-500"
                  )}>
                    {acc}%
                  </p>
                </div>
              ) : null
            })()}
          </div>

          {/* Linked goal */}
          {task.goalTitle && task.goalId && (
            <div className="rounded-xl border border-border/60 bg-muted/20 p-3 space-y-1">
              <p className="flex items-center gap-1.5 text-[10px] font-medium text-muted-foreground uppercase tracking-widest">
                <Target className="size-3" /> Linked Goal
              </p>
              <Link
                href={`/goals/${task.goalId}`}
                className="text-sm font-medium text-violet-600 dark:text-violet-400 hover:underline"
              >
                {task.goalTitle}
              </Link>
            </div>
          )}

          {/* Timestamps */}
          <div className="h-px bg-border/60 -mx-6" />
          <div className="flex items-center justify-between text-[11px] text-muted-foreground">
            <span>Created {formatTimestamp(task.createdAt)}</span>
            <span>Updated {formatTimestamp(task.updatedAt)}</span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
