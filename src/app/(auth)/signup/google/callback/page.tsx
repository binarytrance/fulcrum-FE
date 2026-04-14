"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

import { useAuthStore } from "@/store/auth-store";
import { completeAuthWithTokens } from "@/utils/complete-auth";
import { Button } from "@/components/ui/button";

// ─── Inner content ────────────────────────────────────────────────────────────

function GoogleSignupCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const setAuth = useAuthStore((s) => s.setAuth);

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function finish() {
      // The backend redirects here with tokens in the query string.
      // e.g. /signup/google/callback?accessToken=X&refreshToken=Y
      // (Google sign-up and sign-in share the same backend OAuth flow —
      //  the backend upserts the user, so both are handled identically.)
      const accessToken = searchParams.get("accessToken");

      // Error path: backend might send ?error=oauth_failed
      const oauthError = searchParams.get("error");
      if (oauthError) {
        setError("Google sign up failed. Please try again.");
        setLoading(false);
        return;
      }

      if (!accessToken) {
        setError("Missing authentication token. Please try signing up again.");
        setLoading(false);
        return;
      }

      try {
        const user = await completeAuthWithTokens(accessToken);
        if (cancelled) return;
        setAuth(user, accessToken);
        router.replace("/dashboard");
      } catch (err) {
        if (cancelled) return;
        setError(
          err instanceof Error
            ? err.message
            : "Could not complete Google sign up. Please try again.",
        );
        setLoading(false);
      }
    }

    finish();
    return () => {
      cancelled = true;
    };
  }, [searchParams, router, setAuth]);

  // ── Error state ───────────────────────────────────────────────────────────────
  if (error) {
    return (
      <div className="mx-auto flex min-h-[70vh] w-full max-w-md flex-col items-center justify-center px-4 text-center">
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10">
          <span className="text-2xl">✕</span>
        </div>
        <h1 className="text-2xl font-bold">Google Sign Up Failed</h1>
        <p className="mt-3 text-sm text-destructive">{error}</p>
        <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
          <Button asChild variant="secondary">
            <Link href="/signup">Try again</Link>
          </Button>
          <Button asChild variant="ghost">
            <Link href="/signin">Sign in instead</Link>
          </Button>
        </div>
      </div>
    );
  }

  // ── Loading state ─────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="mx-auto flex min-h-[70vh] w-full max-w-md flex-col items-center justify-center px-4 text-center">
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-muted">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-border border-t-foreground" />
        </div>
        <h1 className="text-2xl font-bold">Completing Google Sign Up</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          Please wait while we set up your account…
        </p>
      </div>
    );
  }

  return null;
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function GoogleSignupCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto flex min-h-[70vh] w-full max-w-md flex-col items-center justify-center px-4 text-center">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-muted">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-border border-t-foreground" />
          </div>
          <h1 className="text-2xl font-bold">Completing Google Sign Up</h1>
          <p className="mt-3 text-sm text-muted-foreground">Please wait…</p>
        </div>
      }
    >
      <GoogleSignupCallbackContent />
    </Suspense>
  );
}
