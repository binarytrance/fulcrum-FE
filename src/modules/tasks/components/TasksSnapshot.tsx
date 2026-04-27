"use client";

import { useState, useRef } from "react";
import { Plus, ArrowRight } from "lucide-react";
import Link from "next/link";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { ArcRing } from "./ArcRing";

// TODO: wire to tasks API
const PLACEHOLDER = {
  completed: 0,
  total: 0,
};

export function TasksSnapshot() {
  const [open, setOpen] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const { completed, total } = PLACEHOLDER;

  const ratio = total === 0 ? 0 : completed / total;
  const remaining = total - completed;

  function handleAddTask(e: React.FormEvent) {
    e.preventDefault();
    if (!inputValue.trim()) return;
    // TODO: call tasks API to create task
    setInputValue("");
    setOpen(false);
  }

  return (
    <div className="relative flex flex-col gap-3 rounded-2xl border border-border/60 bg-card p-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground">Tasks</span>
        <Popover open={open} onOpenChange={(v) => { setOpen(v); if (v) setTimeout(() => inputRef.current?.focus(), 50); }}>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-foreground">
              <Plus className="h-3.5 w-3.5" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-56 p-2">
            <form onSubmit={handleAddTask} className="flex flex-col gap-2">
              <input
                ref={inputRef}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Add a task for today…"
                className="w-full rounded-md border border-border bg-transparent px-2.5 py-1.5 text-sm outline-none placeholder:text-muted-foreground focus:border-ring"
              />
              <div className="flex items-center justify-between">
                <button
                  type="submit"
                  className="rounded-md bg-primary px-3 py-1 text-xs font-medium text-primary-foreground hover:bg-primary/90"
                >
                  Add
                </button>
                <Link
                  href="/tasks"
                  className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
                  onClick={() => setOpen(false)}
                >
                  View all <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
            </form>
          </PopoverContent>
        </Popover>
      </div>

      {/* Value */}
      {total === 0 ? (
        <div>
          <p className="text-2xl font-bold tracking-tight text-foreground">—</p>
          <p className="mt-0.5 text-xs text-muted-foreground">no tasks for today</p>
        </div>
      ) : (
        <div className="flex flex-col gap-1">
          <div className="relative flex h-14 w-14 items-center justify-center">
            <ArcRing ratio={ratio} size={56} strokeWidth={5} className="absolute inset-0" />
            <span className="text-xs font-semibold tabular-nums text-foreground">
              {completed}/{total}
            </span>
          </div>
          <p className="text-xs text-muted-foreground">
            {remaining === 0 ? "all done" : `${remaining} remaining`}
          </p>
        </div>
      )}
    </div>
  );
}
