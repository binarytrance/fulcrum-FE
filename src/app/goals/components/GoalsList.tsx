"use client";

import { Button } from "@/components/ui/button";
import type { GoalTreeNode } from "@/utils/goals-api";
import { Check } from "lucide-react";

type GoalsListProps = {
  loading: boolean;
  error: string | null;
  goals: GoalTreeNode[] | null;
  completingIds?: Set<string>;
  onComplete?: (goalId: string) => void;
  onEdit?: (goal: GoalTreeNode) => void;
};

function getPriorityClasses(priority: GoalTreeNode["priority"]): string {
  switch (priority) {
    case "HIGH":
      return "border-l-4 border-l-red-500";
    case "LOW":
      return "border-l-4 border-l-emerald-500";
    case "MEDIUM":
    default:
      return "border-l-4 border-l-amber-500";
  }
}

function GoalListItem({
  node,
  depth,
  completingIds,
  onComplete,
  onEdit,
}: {
  node: GoalTreeNode;
  depth: number;
  completingIds?: Set<string>;
  onComplete?: (goalId: string) => void;
  onEdit?: (goal: GoalTreeNode) => void;
}) {
  const canComplete = node.status !== "COMPLETED";
  const completing = completingIds?.has(node.id) ?? false;

  return (
    <li
      className={[
        "cursor-pointer rounded-md border bg-background p-3 transition-colors hover:bg-muted/40",
        getPriorityClasses(node.priority),
        node.status === "COMPLETED" ? "opacity-75" : "",
      ].join(" ")}
      onClick={() => onEdit?.(node)}
      role="button"
      tabIndex={0}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") onEdit?.(node);
      }}
    >
      <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="font-medium">{node.title}</p>
          <p className="text-xs text-muted-foreground">
            {node.category} • {node.priority} • {node.status}
          </p>
        </div>

        <div className="flex items-start justify-between gap-2 sm:justify-end">
          <p className="pt-2 text-xs text-muted-foreground sm:pt-0">
            Level {node.level}
            {node.deadline
              ? ` • Due ${new Date(node.deadline).toLocaleDateString()}`
              : ""}
          </p>

          <Button
            type="button"
            variant="ghost"
            size="icon"
            disabled={!canComplete || completing}
            title={canComplete ? "Mark complete" : "Already completed"}
            onClick={(event) => {
              event.stopPropagation();
              onComplete?.(node.id);
            }}
          >
            <Check />
          </Button>
        </div>
      </div>

      {node.children?.length ? (
        <ul className="mt-3 space-y-2" style={{ marginLeft: depth ? 12 : 0 }}>
          {node.children.map((child) => (
            <GoalListItem
              key={child.id}
              node={child}
              depth={depth + 1}
              completingIds={completingIds}
              onComplete={onComplete}
              onEdit={onEdit}
            />
          ))}
        </ul>
      ) : null}
    </li>
  );
}

export function GoalsList({
  loading,
  error,
  goals,
  completingIds,
  onComplete,
  onEdit,
}: GoalsListProps) {
  if (loading) {
    return <p className="mt-3 text-sm text-muted-foreground">Loading goals...</p>;
  }

  if (error) {
    return <p className="mt-3 text-sm text-destructive">{error}</p>;
  }

  if (!goals || goals.length === 0) {
    return <p className="mt-3 text-sm text-muted-foreground">No goals yet.</p>;
  }

  return (
    <ul className="mt-3 space-y-3">
      {goals.map((node) => (
        <GoalListItem
          key={node.id}
          node={node}
          depth={0}
          completingIds={completingIds}
          onComplete={onComplete}
          onEdit={onEdit}
        />
      ))}
    </ul>
  );
}
