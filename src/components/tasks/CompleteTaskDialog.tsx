"use client"

import { useState, useEffect } from "react"
import type { Task } from "@/types"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { CheckCircle2, Clock, AlertCircle, Zap } from "lucide-react"
import { cn } from "@/lib/utils"

type Props = {
  open: boolean
  onClose: () => void
  task: Task
  onComplete: (actualDuration: number) => Promise<void>
}

export function CompleteTaskDialog({ open, onClose, task, onComplete }: Props) {
  const [duration, setDuration] = useState<number | "">(
    task.estimatedDuration ?? ""
  )
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (open) {
      setDuration(task.estimatedDuration ?? "")
      setError(null)
    }
  }, [open, task.estimatedDuration])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    const minutes = Number(duration)
    if (isNaN(minutes) || minutes < 0) {
      setError("Please enter a valid duration (0 or more minutes).")
      return
    }
    setLoading(true)
    try {
      await onComplete(minutes)
      onClose()
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to complete task. Please try again."
      )
    } finally {
      setLoading(false)
    }
  }

  const efficiency =
    task.estimatedDuration && Number(duration) > 0
      ? Math.round((task.estimatedDuration / Number(duration)) * 100)
      : null

  return (
    <Dialog open={open} onOpenChange={(v) => !v && !loading && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <div className="flex size-7 items-center justify-center rounded-full bg-emerald-500/15">
              <CheckCircle2 className="size-4 text-emerald-600 dark:text-emerald-400" />
            </div>
            Complete Task
          </DialogTitle>
          <DialogDescription>
            How long did you actually spend on this task?
          </DialogDescription>
        </DialogHeader>

        {/* Task name chip */}
        <div className="rounded-xl border border-border/60 bg-muted/40 px-3 py-2.5">
          <p className="text-sm font-medium leading-snug line-clamp-2">
            {task.title}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label
              htmlFor="actualDuration"
              className="flex items-center gap-1.5 text-sm font-medium"
            >
              <Clock className="size-3.5 text-muted-foreground" />
              Actual Duration
              <span className="text-muted-foreground font-normal">(minutes)</span>
            </Label>

            <Input
              id="actualDuration"
              type="number"
              min={0}
              step={1}
              placeholder={
                task.estimatedDuration
                  ? `Estimated: ${task.estimatedDuration} min`
                  : "e.g. 30"
              }
              value={duration}
              onChange={(e) => {
                const raw = e.target.value
                setDuration(raw === "" ? "" : Number(raw))
              }}
              className="text-base"
              autoFocus
            />

            {/* Efficiency hint */}
            {efficiency !== null && (
              <div
                className={cn(
                  "flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium",
                  efficiency >= 100
                    ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                    : efficiency >= 75
                    ? "bg-amber-500/10 text-amber-700 dark:text-amber-400"
                    : "bg-red-500/10 text-red-600 dark:text-red-400"
                )}
              >
                <Zap className="size-3 shrink-0" />
                {efficiency >= 100
                  ? `Finished faster than estimated — ${efficiency}% efficiency`
                  : efficiency >= 75
                  ? `Slightly over estimate — ${efficiency}% efficiency`
                  : `Significantly over estimate — ${efficiency}% efficiency`}
              </div>
            )}
          </div>

          {error && (
            <div className="flex items-start gap-2 rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2.5 text-sm text-destructive">
              <AlertCircle className="size-4 mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="bg-emerald-600 hover:bg-emerald-700 text-white dark:bg-emerald-600 dark:hover:bg-emerald-700"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="size-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                  Completing…
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <CheckCircle2 className="size-4" />
                  Mark Complete
                </span>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
