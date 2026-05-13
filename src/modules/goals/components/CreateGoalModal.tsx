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
  onCreated?: (goal: GoalResponse) => void;
};

export function CreateGoalModal({ open, onOpenChange, onCreated }: Props) {
  const router = useRouter();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-[560px]"
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>Create goal</DialogTitle>
        </DialogHeader>
        <div className="[&>div]:border-0 [&>div]:p-0 [&>div>h2]:hidden [&>div>p]:hidden">
          <CreateGoalForm
            mode="create"
            onSaved={(goal) => {
              onCreated?.(goal);
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
