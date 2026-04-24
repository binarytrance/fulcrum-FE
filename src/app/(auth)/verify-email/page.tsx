"use client";

import { Suspense, useState, useMemo } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as zod from "zod";
import Link from "next/link";
import { useTranslations } from "next-intl";

import { useAuthStore } from "@/store/auth-store";
import { authApiFetch } from "@/utils/auth-api";
import { completeAuthWithTokens } from "@/utils/complete-auth";
import { toast } from "@/components/ui/toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from "@/components/ui/form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

// ─── Types ────────────────────────────────────────────────────────────────────

type VerifyEmailApiResponse = {
  success: boolean;
  message: string;
  data?: {
    accessToken: string;
  };
};

// ─── Inner content (uses useSearchParams) ─────────────────────────────────────

function VerifyEmailContent() {
  const router = useRouter();
  const params = useSearchParams();
  const email = params.get("email") ?? "";
  const setAuth = useAuthStore((s) => s.setAuth);
  const t = useTranslations("Auth.verifyEmail");

  const [resendSent, setResendSent] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [requestError, setRequestError] = useState<string | null>(null);

  const schema = useMemo(
    () =>
      zod.object({
        token: zod.string().min(1, t("codeRequired")).max(32, t("codeMaxLength"))
      }),
    [t]
  );

  type FormValues = zod.infer<typeof schema>;

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { token: "" }
  });

  // ── Submit ─────────────────────────────────────────────────────────────────
  const onSubmit = form.handleSubmit(async ({ token }) => {
    setRequestError(null);

    try {
      const response = await authApiFetch("/verify-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, token })
      });

      const payload = (await response.json()) as VerifyEmailApiResponse;

      if (!response.ok || !payload.success) {
        setRequestError(payload.message ?? t("errorVerificationFailed"));
        return;
      }

      if (!payload.data?.accessToken) {
        setRequestError(t("errorUnexpected"));
        return;
      }

      const { accessToken } = payload.data;
      const user = await completeAuthWithTokens(accessToken);
      setAuth(user, accessToken);
      toast.success(t("toastVerifiedTitle"), t("toastVerifiedDesc"));
      router.replace("/dashboard");
    } catch {
      setRequestError(t("errorConnection"));
    }
  });

  // ── Resend ─────────────────────────────────────────────────────────────────
  const handleResend = async () => {
    if (!email) {
      toast.error(t("toastMissingEmailTitle"), t("toastMissingEmailDesc"));
      return;
    }

    setResendLoading(true);
    setResendSent(false);

    try {
      await authApiFetch("/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email })
      });
      setResendSent(true);
      toast.success(t("toastResentTitle"), t("toastResentDesc", { email }));
    } catch {
      toast.info(t("toastCheckInboxTitle"), t("toastCheckInboxDesc"));
      setResendSent(true);
    } finally {
      setResendLoading(false);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-md space-y-6">
        {/* Brand */}
        <div className="text-center">
          <Link
            href="/"
            className="inline-flex items-center gap-2 font-bold text-foreground hover:opacity-80 transition-opacity"
          >
            <span className="text-2xl leading-none">⚡</span>
            <span className="text-xl tracking-tight">Fulcrum</span>
          </Link>
        </div>

        <Card className="border-border shadow-sm">
          <CardHeader className="text-center pb-2">
            {/* Mail icon */}
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-muted">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="26"
                height="26"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.75"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-foreground"
                aria-hidden="true"
              >
                <rect width="20" height="16" x="2" y="4" rx="2" />
                <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
              </svg>
            </div>

            <CardTitle className="text-2xl font-bold">{t("title")}</CardTitle>
            <CardDescription className="mt-1 text-sm leading-relaxed">
              {email
                ? t.rich("descriptionWithEmail", {
                    email,
                    bold: (chunks) => (
                      <span className="font-medium text-foreground break-all">{chunks}</span>
                    )
                  })
                : t("descriptionNoEmail")}
            </CardDescription>
          </CardHeader>

          <CardContent className="pt-4">
            <Form {...form}>
              <form onSubmit={onSubmit} className="space-y-5">
                <FormField
                  control={form.control}
                  name="token"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("codeLabel")}</FormLabel>
                      <FormControl>
                        <Input
                          placeholder={t("codePlaceholder")}
                          autoComplete="one-time-code"
                          autoFocus
                          className="text-center tracking-widest text-base font-mono"
                          {...field}
                          onChange={(e) => {
                            field.onChange(e.target.value.replace(/\s/g, ""));
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {requestError && (
                  <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
                    {requestError}
                  </p>
                )}

                <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
                  {form.formState.isSubmitting ? t("submittingButton") : t("submitButton")}
                </Button>
              </form>
            </Form>

            {/* Divider */}
            <div className="my-5 flex items-center gap-3">
              <div className="h-px flex-1 bg-border" />
              <span className="text-xs text-muted-foreground">{t("didntReceive")}</span>
              <div className="h-px flex-1 bg-border" />
            </div>

            {/* Resend */}
            <div className="space-y-2 text-center">
              {resendSent ? (
                <p className="text-sm text-muted-foreground">{t("resendSentMessage")}</p>
              ) : (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleResend}
                  disabled={resendLoading || !email}
                  className="w-full text-sm"
                >
                  {resendLoading ? t("resendingButton") : t("resendButton")}
                </Button>
              )}
            </div>

            {/* Back to sign in */}
            <p className="mt-6 text-center text-sm text-muted-foreground">
              {t("wrongAddress")}{" "}
              <Link
                href="/signup"
                className="font-medium text-foreground underline underline-offset-4 hover:opacity-80 transition-opacity"
              >
                {t("startOver")}
              </Link>
              {" · "}
              <Link
                href="/signin"
                className="font-medium text-foreground underline underline-offset-4 hover:opacity-80 transition-opacity"
              >
                {t("signIn")}
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// ─── Page (with Suspense for useSearchParams) ─────────────────────────────────

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-background">
          <div className="text-center space-y-3">
            <div className="mx-auto h-10 w-10 animate-spin rounded-full border-2 border-border border-t-foreground" />
          </div>
        </div>
      }
    >
      <VerifyEmailContent />
    </Suspense>
  );
}
