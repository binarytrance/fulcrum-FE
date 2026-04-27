"use client";

import { Plus, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ActionMenu } from "@/components/ui/action-menu";

// TODO: wire to habits API
const PLACEHOLDER = { done: 0, total: 0 };

const MENU_ITEMS = [
  { label: "Mark habit done", icon: "✓", onClick: () => {} },
  { label: "Add new habit", icon: <ArrowRight className="h-3.5 w-3.5" />, onClick: () => { window.location.href = "/habits"; } },
];

export function HabitsSnapshot() {
  const { done, total } = PLACEHOLDER;

  return (
    <div className="relative flex flex-col gap-3 rounded-2xl border border-border/60 bg-card p-4">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground">Habits</span>
        <ActionMenu
          trigger={
            <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-foreground">
              <Plus className="h-3.5 w-3.5" />
            </Button>
          }
          items={MENU_ITEMS}
        />
      </div>

      {total === 0 ? (
        <div>
          <p className="text-2xl font-bold tracking-tight text-foreground">—</p>
          <p className="mt-0.5 text-xs text-muted-foreground">no habits tracked</p>
        </div>
      ) : (
        <div>
          <p className="text-2xl font-bold tracking-tight text-foreground">
            {done}<span className="text-base font-normal text-muted-foreground">/{total}</span>
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {done === total ? "all done today" : `${total - done} left today`}
          </p>
        </div>
      )}
    </div>
  );
}
