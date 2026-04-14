"use client";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { authApiFetch } from "@/utils/auth-api";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, AlertCircle, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import * as zod from "zod";

// ─── Schema ───────────────────────────────────────────────────────────────────

const schema = zod.object({
  firstname: zod.string().min(2, "First name is required"),
  lastname: zod.string().min(2, "Last name is required"),
  email: zod.string().email("Enter a valid email"),
  password: zod.string().min(6, "Password should be at least 6 characters"),
});

type FormValues = zod.infer<typeof schema>;

// ─── Types ────────────────────────────────────────────────────────────────────

type SignupResponse = {
  success: boolean;
  message: string;
};

type EmailSignupFormProps = {
  onBack: () => void;
};

// ─── Component ────────────────────────────────────────────────────────────────

export function EmailSignupForm({ onBack }: EmailSignupFormProps) {
  const router = useRouter();

  const [requestError, setRequestError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      firstname: "",
      lastname: "",
      email: "",
      password: "",
    },
  });

  const isSubmitting = form.formState.isSubmitting;

  // ── Submit ─────────────────────────────────────────────────────────────────
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

      // Show brief success message then redirect to verify-email
      setSuccessMessage(
        payload.message ||
          "Account created! Check your inbox for a verification code.",
      );

      // Small delay so the user sees the success message
      setTimeout(() => {
        router.push(`/verify-email?email=${encodeURIComponent(values.email)}`);
      }, 1200);
    } catch {
      setRequestError(
        "Could not complete signup. Please check your connection and try again.",
      );
    }
  });

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="w-full max-w-xl rounded-2xl border border-border bg-card p-8 shadow-sm">
      {/* Header */}
      <h1 className="text-2xl font-bold tracking-tight text-card-foreground">
        Create your account
      </h1>
      <p className="mt-1.5 text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link
          href="/signin"
          className="font-medium text-foreground underline underline-offset-4 hover:opacity-80 transition-opacity"
        >
          Sign in
        </Link>
      </p>

      {/* Form */}
      <Form {...form}>
        <form onSubmit={onSubmit} className="mt-6 space-y-5" noValidate>
          {/* Name row */}
          <div className="grid gap-4 sm:grid-cols-2">
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
                  <Input
                    type="email"
                    placeholder="you@example.com"
                    autoComplete="email"
                    {...field}
                  />
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
                  <Input
                    type="password"
                    placeholder="At least 6 characters"
                    autoComplete="new-password"
                    {...field}
                  />
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

          {/* Actions */}
          <div className="flex flex-col-reverse gap-2 pt-1 sm:flex-row sm:items-center">
            <Button
              type="button"
              variant="secondary"
              onClick={onBack}
              disabled={isSubmitting}
              className="sm:w-auto"
            >
              Back
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || !!successMessage}
              className="flex-1 sm:flex-none"
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
          </div>
        </form>
      </Form>
    </div>
  );
}
