"use client";

import type { GoalTreeNode } from "@/modules/goals/api/goals-api";

export type GoalsListVariant = "default" | "pinned";

export type GoalsListProps = {
  loading: boolean;
  error: string | null;
  goals: GoalTreeNode[] | null;
  completingIds?: Set<string>;
  onComplete?: (goalId: string) => void;
  onEdit?: (goal: GoalTreeNode) => void;
  /**
   * Presentation switch. Prefer `variant` (component-level) over app-shell layout.
   */
  variant?: GoalsListVariant;
  /**
   * Only used by `variant="pinned"`.
   * Defaults to 3.
   */
  limit?: number;
};

function GoalsListDefault(_props: GoalsListProps) {
  return <p>GoalsListDefault</p>;
}

function GoalsListPinned(_props: GoalsListProps) {
  return <p>GoalsListPinned</p>;
}

export function GoalsList(props: GoalsListProps) {
  if (props.variant === "pinned") {
    return <GoalsListPinned {...props} />;
  }

  return <GoalsListDefault {...props} />;
}
