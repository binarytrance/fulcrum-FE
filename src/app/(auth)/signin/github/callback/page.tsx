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

function GitHubSigninCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const setUser = useAuthStore((s) => s.setUser);
  const t = useTranslations("Auth.oauthCallback");

  const provider = "GitHub";
  const action = "Sign In";

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
        <Button asChild className="mt-6" variant="secondary">
          <Link href="/signin">{t("tryAgain")}</Link>
        </Button>
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
        <p className="mt-3 text-sm text-muted-foreground">{t("loadingMessage")}</p>
      </div>
    );
  }

  return null;
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function GitHubSigninCallbackPage() {
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
      <GitHubSigninCallbackContent />
    </Suspense>
  );
}
