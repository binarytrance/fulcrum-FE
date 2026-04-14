"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import * as zod from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Zap, Mail, Lock, AlertCircle, CheckCircle2 } from "lucide-react";

import { authApiFetch } from "@/utils/auth-api";
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
import { GoogleSignupButton } from "./components/GoogleSignupButton";

// ─── Schema ───────────────────────────────────────────────────────────────────

const schema = zod.object({
  firstname: zod.string().min(2, "First name is required"),
  lastname: zod.string().min(2, "Last name is required"),
  email: zod.string().email("Enter a valid email address"),
  password: zod.string().min(6, "Password must be at least 6 characters"),
});

type FormValues = zod.infer<typeof schema>;

// ─── Types ────────────────────────────────────────────────────────────────────

type SignupResponse = {
  success: boolean;
  message: string;
};

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function SignUpPage() {
  const router = useRouter();
  const [requestError, setRequestError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { firstname: "", lastname: "", email: "", password: "" },
  });

  const isSubmitting = form.formState.isSubmitting;

  const onSubmit = form.handleSubmit(async (values) => {
    setRequestError(null);
    setSuccessMessage(null);

    try {
      const response = await authApiFetch("/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstname: values.firstname,
          lastname: values.lastname,
          email: values.email,
          password: values.password,
        }),
      });

      const payload = (await response.json()) as SignupResponse;

      if (!response.ok || !payload.success) {
        setRequestError(payload.message || "Signup failed. Please try again.");
        return;
      }

      setSuccessMessage(
        payload.message || "Account created! Check your inbox for a verification code.",
      );

      setTimeout(() => {
        router.push(`/verify-email?email=${encodeURIComponent(values.email)}`);
      }, 1200);
    } catch {
      setRequestError("Could not complete signup. Please check your connection and try again.");
    }
  });

  return (
    <>
      {/* ── Brand mark ──────────────────────────────────────────────────── */}
      <div className="mb-8 flex flex-col items-center text-center">
        <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-lg">
          <Zap className="h-5 w-5" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Create your account
        </h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          Free while we build — no credit card required.
        </p>
      </div>

      {/* ── Card ────────────────────────────────────────────────────────── */}
      <div className="rounded-2xl border border-border bg-card p-7 shadow-sm">
        {/* OAuth */}
        <GoogleSignupButton />

        {/* Divider */}
        <div className="my-5 flex items-center gap-3">
          <div className="h-px flex-1 bg-border" />
          <span className="text-xs font-medium text-muted-foreground">
            or continue with email
          </span>
          <div className="h-px flex-1 bg-border" />
        </div>

        {/* Email form */}
        <Form {...form}>
          <form onSubmit={onSubmit} className="space-y-4" noValidate>
            {/* Name row */}
            <div className="grid grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="firstname"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>First name</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Jane"
                        autoComplete="given-name"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="lastname"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Last name</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Smith"
                        autoComplete="family-name"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Email */}
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

            {/* Password */}
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        type="password"
                        placeholder="At least 6 characters"
                        autoComplete="new-password"
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

            {/* Success message */}
            {successMessage && (
              <div className="flex items-start gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2.5 dark:border-emerald-800/60 dark:bg-emerald-950/40">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                <p className="text-sm text-emerald-700 dark:text-emerald-300">
                  {successMessage}
                </p>
              </div>
            )}

            <Button
              type="submit"
              className="w-full rounded-xl"
              size="lg"
              disabled={isSubmitting || !!successMessage}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating account…
                </>
              ) : (
                "Create account"
              )}
            </Button>
          </form>
        </Form>
      </div>

      {/* ── Footer link ─────────────────────────────────────────────────── */}
      <p className="mt-5 text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link
          href="/signin"
          className="font-medium text-foreground underline underline-offset-4 transition-opacity hover:opacity-80"
        >
          Sign in
        </Link>
      </p>
    </>
  );
}