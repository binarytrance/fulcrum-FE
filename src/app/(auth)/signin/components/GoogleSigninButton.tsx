"use client";

import { buildOAuthStartUrl, GOOGLE_SIGNIN_CALLBACK_PATH } from "@/utils/auth";
import { generateCodeVerifier, generateCodeChallenge, saveCodeVerifier } from "@/utils/pkce";
import { Loader2 } from "lucide-react";
import { useState } from "react";

function GoogleIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 18 18"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908C16.658 14.017 17.64 11.71 17.64 9.2Z"
        fill="#4285F4"
      />
      <path
        d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18Z"
        fill="#34A853"
      />
      <path
        d="M3.964 10.706A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.706V4.962H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.038l3.007-2.332Z"
        fill="#FBBC05"
      />
      <path
        d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.962L3.964 7.294C4.672 5.163 6.656 3.58 9 3.58Z"
        fill="#EA4335"
      />
    </svg>
  );
}

type GoogleSigninButtonProps = {
  className?: string;
};

export function GoogleSigninButton({ className }: GoogleSigninButtonProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleClick = async () => {
    try {
      setLoading(true);
      setError(null);
      const verifier = generateCodeVerifier();
      const challenge = await generateCodeChallenge(verifier);
      saveCodeVerifier(verifier);
      const authStartUrl = buildOAuthStartUrl("/google", GOOGLE_SIGNIN_CALLBACK_PATH, challenge);
      window.location.assign(authStartUrl);
    } catch {
      setLoading(false);
      setError("Could not start Google sign in. Please try again.");
    }
  };

  return (
    <div className={className}>
      <button
        type="button"
        onClick={handleClick}
        disabled={loading}
        className="flex w-full items-center justify-center gap-2.5 rounded-xl border border-border bg-background px-4 py-2.5 text-sm font-medium text-foreground transition-all hover:bg-muted/60 hover:border-border/80 disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        ) : (
          <GoogleIcon />
        )}
        {loading ? "Redirecting…" : "Continue with Google"}
      </button>
      {error && <p className="mt-2 text-xs text-destructive">{error}</p>}
    </div>
  );
}