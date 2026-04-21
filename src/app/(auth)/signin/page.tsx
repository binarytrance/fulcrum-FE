"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import * as zod from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Zap, Mail, Lock, AlertCircle } from "lucide-react";

import { useAuthStore } from "@/store/auth-store";
import { authApiFetch } from "@/utils/auth-api";
import { completeAuthWithTokens } from "@/utils/complete-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { GoogleSigninButton } from "./components/GoogleSigninButton";
import { GitHubSigninButton } from "./components/GitHubSigninButton";

// ─── Schema ───────────────────────────────────────────────────────────────────

const schema = zod.object({
  email: zod.string().email("Please enter a valid email"),
  password: zod.string().min(6, "Password must be at least 6 characters"),
});

type FormValues = zod.infer<typeof schema>;

// ─── Types ────────────────────────────────────────────────────────────────────

type SigninApiResponse = {
  success: boolean;
  message: string;
  data?: {
    accessToken: string;
  };
};

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function SignInPage() {
  const router = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [requestError, setRequestError] = useState<string | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: "", password: "" },
  });

  const isSubmitting = form.formState.isSubmitting;

  const onSubmit = form.handleSubmit(async (values) => {
    setRequestError(null);

    try {
      const response = await authApiFetch("/signin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: values.email, password: values.password }),
      });

      const payload = (await response.json()) as SigninApiResponse;

      if (!response.ok || !payload.success) {
        setRequestError(payload.message ?? "Sign in failed. Please try again.");
        return;
      }

      if (!payload.data?.accessToken) {
        setRequestError("Unexpected response from server. Please try again.");
        return;
      }

      const { accessToken } = payload.data;
      const user = await completeAuthWithTokens(accessToken);
      setAuth(user, accessToken);
      router.replace("/dashboard");
    } catch {
      setRequestError("Could not connect to the server. Please try again.");
    }
  });

  return (
    <>
      {/* ── Brand mark ──────────────────────────────────────────────────── */}
      <div className="mb-7 flex flex-col items-center text-center">
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-lg ring-1 ring-primary/20">
          <Zap className="h-6 w-6" />
        </div>

        <h1 className="text-2xl font-bold tracking-tight">
          Welcome back
        </h1>

        <p className="mt-1.5 text-sm text-muted-foreground">
          Sign in to your Fulcrum account
        </p>
      </div>

      {/* ── Card ────────────────────────────────────────────────────────── */}
      <div className="rounded-2xl border border-border bg-card p-7 shadow-sm">

        {/* OAuth buttons */}
        <div className="space-y-2.5">
          <GoogleSigninButton />
          <GitHubSigninButton />
        </div>

        {/* Divider */}
        <div className="my-5 flex items-center gap-3">
          <div className="h-px flex-1 bg-border" />
          <span className="text-xs font-medium text-muted-foreground">
            or continue with email
          </span>
          <div className="h-px flex-1 bg-border" />
        </div>

        {/* Email / password form */}
        <Form {...form}>
          <form onSubmit={onSubmit} className="space-y-4" noValidate>

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        type="email"
                        placeholder="you@example.com"
                        autoComplete="email"
                        className="pl-9"
                        {...field}
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <div className="flex items-center justify-between">
                    <FormLabel>Password</FormLabel>
                    <span className="cursor-default select-none text-xs text-muted-foreground">
                      Forgot password?
                    </span>
                  </div>
                  <FormControl>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        type="password"
                        placeholder="••••••••"
                        autoComplete="current-password"
                        className="pl-9"
                        {...field}
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Request-level error */}
            {requestError && (
              <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2.5">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
                <p className="text-sm text-destructive">{requestError}</p>
              </div>
            )}

            <Button
              type="submit"
              className="w-full rounded-xl"
              size="lg"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing in…
                </>
              ) : (
                "Sign In"
              )}
            </Button>
          </form>
        </Form>
      </div>

      {/* ── Footer link ─────────────────────────────────────────────────── */}
      <p className="mt-5 text-center text-sm text-muted-foreground">
        Don&apos;t have an account?{" "}
        <Link
          href="/signup"
          className="font-medium text-foreground underline underline-offset-4 transition-opacity hover:opacity-80"
        >
          Sign up free
        </Link>
      </p>
    </>
  );
}