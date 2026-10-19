"use client";

import { useEffect } from "react";

type SnackbarProps = {
  message: string | null;
  onDismiss: () => void;
  durationMs?: number;
};

export function Snackbar({ message, onDismiss, durationMs = 3500 }: SnackbarProps) {
  useEffect(() => {
    if (!message) return;
    const id = window.setTimeout(onDismiss, durationMs);
    return () => window.clearTimeout(id);
  }, [durationMs, message, onDismiss]);

  if (!message) return null;

  return (
    <div className="fixed bottom-4 left-1/2 z-50 w-[calc(100%-2rem)] max-w-md -translate-x-1/2 rounded-md border bg-background px-4 py-3 text-sm shadow">
      <div className="flex items-start justify-between gap-3">
        <p>{message}</p>
        <button
          type="button"
          className="text-muted-foreground hover:text-foreground"
          onClick={onDismiss}
          aria-label="Dismiss"
        >
          ✕
        </button>
      </div>
    </div>
  );
}

