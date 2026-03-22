"use client";

import { Button } from "@/components/ui/button";
import { buildOAuthStartUrl, GOOGLE_SIGNIN_CALLBACK_PATH } from "@/utils/auth";
import { useState } from "react";

type GoogleSigninButtonProps = {
  className?: string;
};

export function GoogleSigninButton({ className }: GoogleSigninButtonProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGoogleSignin = () => {
    try {
      setLoading(true);
      setError(null);
      const authStartUrl = buildOAuthStartUrl("/google", GOOGLE_SIGNIN_CALLBACK_PATH);
      window.location.assign(authStartUrl);
    } catch {
      setLoading(false);
      setError("Could not start Google sign in. Please try again.");
    }
  };

  return (
    <div className={className}>
      <Button className="w-full" onClick={handleGoogleSignin} disabled={loading}>
        {loading ? "Redirecting..." : "Continue with Google"}
      </Button>
      {error ? <p className="mt-2 text-sm text-destructive">{error}</p> : null}
    </div>
  );
}

