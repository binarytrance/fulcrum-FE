"use client"

import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Edit2 } from "lucide-react"
import type { Task, GoalPriority } from "@/types"
import { updateTask } from "@/lib/tasks-api"
import { toast } from "@/components/ui/toast"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
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

const PRIORITIES: GoalPriority[] = ["HIGH", "MEDIUM", "LOW"]

const editTaskSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  priority: z.enum(["HIGH", "MEDIUM", "LOW"]),
  scheduledFor: z.string().optional(),
  estimatedDuration: z.number().min(1, "At least 1 minute").optional(),
})

type EditTaskValues = z.infer<typeof editTaskSchema>

interface EditTaskDialogProps {
  task: Task | null
  open: boolean
  onClose: () => void
  onUpdated: (updated: Task) => void
}

export function EditTaskDialog({ task, open, onClose, onUpdated }: EditTaskDialogProps) {
  const [submitting, setSubmitting] = useState(false)

  const form = useForm<EditTaskValues>({
    resolver: zodResolver(editTaskSchema),
    defaultValues: {
      title: "",
      description: "",
      priority: "MEDIUM",
      scheduledFor: "",
      estimatedDuration: undefined,
    },
  })

  useEffect(() => {
    if (open && task) {
      form.reset({
        title: task.title,
        description: task.description ?? "",
        priority: task.priority,
        scheduledFor: task.scheduledFor ? task.scheduledFor.split("T")[0] : "",
        estimatedDuration: task.estimatedDuration != null
          ? Math.round(task.estimatedDuration / 60000)
          : undefined,
      })
    }
  }, [open, task]) // eslint-disable-line react-hooks/exhaustive-deps

  const onSubmit = async (data: EditTaskValues) => {
    if (!task) return
    setSubmitting(true)
    try {
      const updated = await updateTask(task.id, {
        title: data.title,
        description: data.description || undefined,
        priority: data.priority,
        scheduledFor: data.scheduledFor
          ? new Date(data.scheduledFor + "T00:00:00.000Z").toISOString()
          : undefined,
        estimatedDuration: data.estimatedDuration != null
          ? Math.round(data.estimatedDuration * 60 * 1000)
          : undefined,
      })
      toast.success("Task updated!")
      onUpdated(updated)
      onClose()
    } catch (err) {
      toast.error("Failed to update task", err instanceof Error ? err.message : undefined)
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
              <Edit2 className="size-4 text-violet-600 dark:text-violet-400" />
            </div>
            Edit Task
          </DialogTitle>
          <DialogDescription>Update the details of this task.</DialogDescription>
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

              <FormField control={form.control} name="estimatedDuration" render={({ field }) => (
                <FormItem>
                  <FormLabel>Est. Duration (min)</FormLabel>
                  <FormControl>
                    <Input
                      type="number" min={1} step={1} placeholder="e.g. 30"
                      value={field.value ?? ""}
                      onChange={(e) => field.onChange(e.target.value === "" ? undefined : parseInt(e.target.value, 10))}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>

            {task?.type === "PLANNED" && (
              <FormField control={form.control} name="scheduledFor" render={({ field }) => (
                <FormItem>
                  <FormLabel>Scheduled For</FormLabel>
                  <FormControl><Input type="date" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            )}

            <DialogFooter className="pt-2 gap-2 sm:gap-0">
              <Button type="button" variant="outline" onClick={onClose} disabled={submitting}>Cancel</Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? "Saving…" : "Save Changes"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
