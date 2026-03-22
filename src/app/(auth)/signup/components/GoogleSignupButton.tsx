"use client";

import { Button } from "@/components/ui/button";
import { buildOAuthStartUrl, GOOGLE_SIGNUP_CALLBACK_PATH } from "@/utils/auth";
import { useState } from "react";

type GoogleSignupButtonProps = {
  className?: string;
};

export function GoogleSignupButton({ className }: GoogleSignupButtonProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGoogleSignup = () => {
    try {
      setLoading(true);
      setError(null);
      const authStartUrl = buildOAuthStartUrl(
        "/google",
        GOOGLE_SIGNUP_CALLBACK_PATH
      );
      window.location.assign(authStartUrl);
    } catch {
      setLoading(false);
      setError("Could not start Google sign up. Please try again.");
    }
  };

  return (
    <div className={className}>
      <Button className="w-full" onClick={handleGoogleSignup} disabled={loading}>
        {loading ? "Redirecting..." : "Continue with Google"}
      </Button>
      {error ? <p className="mt-2 text-sm text-destructive">{error}</p> : null}
    </div>
  );
}
