"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useTranslations } from "next-intl";

import { useAuthStore } from "@/store/auth-store";
import { exchangeOAuthCode } from "@/utils/complete-auth";
import { consumeCodeVerifier } from "@/utils/pkce";
import { Button } from "@/components/ui/button";

// ─── Inner content ────────────────────────────────────────────────────────────

function GoogleSignupCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const setUser = useAuthStore((s) => s.setUser);
  const t = useTranslations("Auth.oauthCallback");

  const provider = "Google";
  const action = "Sign Up";

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const hasStartedRef = useRef(false);

  useEffect(() => {
    if (hasStartedRef.current) return;
    hasStartedRef.current = true;

    const codeVerifier = consumeCodeVerifier();

    (async () => {
      const code = searchParams.get("code");
      const oauthError = searchParams.get("error");

      if (oauthError) {
        setError(t("errorOauthFailed", { provider, action }));
        setLoading(false);
        return;
      }

      if (!code) {
        setError(t("errorMissingCode"));
        setLoading(false);
        return;
      }

      if (!codeVerifier) {
        setError(t("errorMissingVerifier"));
        setLoading(false);
        return;
      }

      try {
        const user = await exchangeOAuthCode(code, codeVerifier);
        setUser(user);
        router.replace("/dashboard");
      } catch (err) {
        setError(err instanceof Error ? err.message : t("errorDefault", { provider, action }));
        setLoading(false);
      }
    })();
  }, [searchParams, router, setUser, t]);

  if (error) {
    return (
      <div className="mx-auto flex min-h-[70vh] w-full max-w-md flex-col items-center justify-center px-4 text-center">
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10">
          <span className="text-2xl">✕</span>
        </div>
        <h1 className="text-2xl font-bold">{t("errorTitle", { provider, action })}</h1>
        <p className="mt-3 text-sm text-destructive">{error}</p>
        <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
          <Button asChild variant="secondary">
            <Link href="/signup">{t("tryAgain")}</Link>
          </Button>
          <Button asChild variant="ghost">
            <Link href="/signin">{t("signInInstead")}</Link>
          </Button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="mx-auto flex min-h-[70vh] w-full max-w-md flex-col items-center justify-center px-4 text-center">
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-muted">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-border border-t-foreground" />
        </div>
        <h1 className="text-2xl font-bold">{t("loadingTitle", { provider, action })}</h1>
        <p className="mt-3 text-sm text-muted-foreground">{t("loadingMessageSetup")}</p>
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
        </div>
      }
    >
      <GoogleSignupCallbackContent />
    </Suspense>
  );
}
