"use client"

import * as React from "react"
import { X } from "lucide-react"

import { cn } from "@/lib/utils"

// ─── Types ─────────────────────────────────────────────────────────────────────

export type ToastVariant = "default" | "success" | "error" | "info"

export interface Toast {
  id: string
  title?: string
  description?: string
  variant?: ToastVariant
  /**
   * Auto-dismiss delay in ms. Pass `Infinity` to disable auto-dismiss.
   * @default 4000
   */
  duration?: number
}

type ToastInput = Omit<Toast, "id">

// ─── Module-level store (enables imperative API without a Provider) ─────────────

type StoreListener = (toasts: Toast[]) => void

const listeners = new Set<StoreListener>()
let toastStore: Toast[] = []

function emitChange(next: Toast[]): void {
  toastStore = next
  listeners.forEach((l) => l(toastStore))
}

function addToast(input: ToastInput): string {
  const id = Math.random().toString(36).slice(2, 11)
  const resolved: Toast = {
    variant: "default",
    duration: 4000,
    ...input,
    id,
  }

  emitChange([...toastStore, resolved])

  const { duration } = resolved
  if (duration !== Infinity && typeof duration === "number" && duration > 0) {
    setTimeout(() => removeToast(id), duration)
  }

  return id
}

function removeToast(id: string): void {
  emitChange(toastStore.filter((t) => t.id !== id))
}

// ─── Imperative toast() function ───────────────────────────────────────────────
//
// Usage:
//   toast("Something happened")
//   toast({ title: "Done", description: "Your changes were saved." })
//   toast.success("Saved!", "All changes have been applied.")
//   toast.error("Failed", "Please try again.")
//   toast.info("Heads up", "A new version is available.")
//   toast.dismiss(id)
//   toast.dismissAll()

function toast(input: ToastInput | string): string {
  const item: ToastInput =
    typeof input === "string" ? { title: input } : input
  return addToast(item)
}

toast.success = (title: string, description?: string): string =>
  addToast({ title, description, variant: "success" })

toast.error = (title: string, description?: string): string =>
  addToast({ title, description, variant: "error" })

toast.info = (title: string, description?: string): string =>
  addToast({ title, description, variant: "info" })

toast.dismiss = (id: string): void => removeToast(id)

toast.dismissAll = (): void => emitChange([])

// ─── useToast hook ─────────────────────────────────────────────────────────────

function useToast() {
  const [toasts, setToasts] = React.useState<Toast[]>(toastStore)

  React.useEffect(() => {
    // Sync immediately — store may have changed between render and effect
    setToasts([...toastStore])

    const listener: StoreListener = (updated) => setToasts([...updated])
    listeners.add(listener)
    return () => {
      listeners.delete(listener)
    }
  }, [])

  return {
    toasts,
    toast,
    dismiss: removeToast,
    dismissAll: toast.dismissAll,
  }
}

// ─── Variant styling maps ──────────────────────────────────────────────────────

const variantRootClasses: Record<ToastVariant, string> = {
  default:
    "bg-background border border-border text-foreground",
  success:
    "bg-emerald-50 border border-emerald-200 text-emerald-900 " +
    "dark:bg-emerald-950/60 dark:border-emerald-800/70 dark:text-emerald-200",
  error:
    "bg-red-50 border border-red-200 text-red-900 " +
    "dark:bg-red-950/60 dark:border-red-800/70 dark:text-red-200",
  info:
    "bg-blue-50 border border-blue-200 text-blue-900 " +
    "dark:bg-blue-950/60 dark:border-blue-800/70 dark:text-blue-200",
}

const variantDescriptionClasses: Record<ToastVariant, string> = {
  default: "text-muted-foreground",
  success: "text-emerald-700 dark:text-emerald-400",
  error:   "text-red-700 dark:text-red-400",
  info:    "text-blue-700 dark:text-blue-400",
}

const variantCloseClasses: Record<ToastVariant, string> = {
  default: "text-foreground/50 hover:text-foreground",
  success: "text-emerald-600 hover:text-emerald-900 dark:text-emerald-500 dark:hover:text-emerald-200",
  error:   "text-red-600 hover:text-red-900 dark:text-red-500 dark:hover:text-red-200",
  info:    "text-blue-600 hover:text-blue-900 dark:text-blue-500 dark:hover:text-blue-200",
}

// ─── Single Toast item ─────────────────────────────────────────────────────────

interface ToastItemProps {
  toast: Toast
  onDismiss: (id: string) => void
}

function ToastItem({ toast: t, onDismiss }: ToastItemProps) {
  const variant: ToastVariant = t.variant ?? "default"

  return (
    <div
      role="status"
      aria-live="polite"
      aria-atomic="true"
      data-slot="toast"
      data-variant={variant}
      className={cn(
        "relative flex w-full items-start gap-3 rounded-lg p-4 shadow-lg",
        "animate-in slide-in-from-bottom-4 fade-in-0 duration-300 ease-out",
        variantRootClasses[variant]
      )}
    >
      {/* Text content */}
      <div className="flex-1 min-w-0 space-y-1">
        {t.title && (
          <p className="text-sm font-semibold leading-snug tracking-tight">
            {t.title}
          </p>
        )}
        {t.description && (
          <p
            className={cn(
              "text-sm leading-snug",
              variantDescriptionClasses[variant]
            )}
          >
            {t.description}
          </p>
        )}
      </div>

      {/* Dismiss button */}
      <button
        data-slot="toast-close"
        type="button"
        aria-label="Dismiss notification"
        onClick={() => onDismiss(t.id)}
        className={cn(
          "shrink-0 mt-0.5 rounded p-0.5 transition-colors",
          "focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1",
          variantCloseClasses[variant]
        )}
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  )
}

// ─── Toaster ───────────────────────────────────────────────────────────────────
//
// Drop this once anywhere in your root layout, e.g.:
//
//   import { Toaster } from "@/components/ui/toast"
//   export default function RootLayout({ children }) {
//     return (
//       <html>
//         <body>
//           {children}
//           <Toaster />
//         </body>
//       </html>
//     )
//   }

function Toaster() {
  const { toasts, dismiss } = useToast()

  if (toasts.length === 0) return null

  return (
    <div
      data-slot="toaster"
      aria-label="Notifications"
      className={cn(
        "fixed bottom-4 right-4 z-[100]",
        "flex flex-col gap-2",
        "w-full max-w-sm",
        "pointer-events-none"
      )}
    >
      {toasts.map((t) => (
        <div key={t.id} className="pointer-events-auto">
          <ToastItem toast={t} onDismiss={dismiss} />
        </div>
      ))}
    </div>
  )
}

export { toast, useToast, Toaster }