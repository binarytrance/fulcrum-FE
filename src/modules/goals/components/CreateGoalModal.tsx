"use client";

import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CreateGoalForm } from "./CreateGoalForm";
import type { GoalResponse } from "@/modules/goals/api/goals-api";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode?: "create" | "edit";
  initialGoal?: GoalResponse;
  onSaved?: (goal: GoalResponse, message: string) => void;
};

export function CreateGoalModal({ open, onOpenChange, mode = "create", initialGoal, onSaved }: Props) {
  const router = useRouter();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-[560px]"
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>{mode === "edit" ? "Edit goal" : "Create goal"}</DialogTitle>
        </DialogHeader>
        <div className="[&>div]:border-0 [&>div]:p-0 [&>div>h2]:hidden [&>div>p]:hidden">
          <CreateGoalForm
            mode={mode}
            initialGoal={initialGoal}
            onSaved={(goal, message) => {
              onSaved?.(goal, message);
              onOpenChange(false);
            }}
            onCancel={() => onOpenChange(false)}
            onUnauthorized={() => router.replace("/signin")}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
