import { Button } from "@/components/ui/button";
import type { ReactNode } from "react";

type SignupMethodSelectorProps = {
  onContinueWithEmail: () => void;
  signupButtons: ReactNode[];
};

export function SignupMethodSelector({
  onContinueWithEmail,
  signupButtons,
}: SignupMethodSelectorProps) {
  return (
    <div className="w-full max-w-md rounded-md border p-6">
      <h1 className="text-2xl font-bold">Sign Up</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Choose a signup method to create your account.
      </p>

      <div className="mt-6 flex flex-col gap-3">
        {signupButtons.map((button, index) => (
          <div key={index}>{button}</div>
        ))}
        <Button variant="secondary" onClick={onContinueWithEmail}>
          Continue with Email
        </Button>
      </div>
    </div>
  );
}
