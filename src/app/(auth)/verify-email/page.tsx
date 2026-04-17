'use client';

import { Suspense, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as zod from 'zod';
import Link from 'next/link';

import { useAuthStore } from '@/store/auth-store';
import { authApiFetch } from '@/utils/auth-api';
import { completeAuthWithTokens } from '@/utils/complete-auth';
import { toast } from '@/components/ui/toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';


// ─── Schema ───────────────────────────────────────────────────────────────────

const schema = zod.object({
  token: zod
    .string()
    .min(1, 'Verification code is required')
    .max(32, 'Invalid verification code'),
});

type FormValues = zod.infer<typeof schema>;

// Backend wraps all responses as { success, message, data? }
type VerifyEmailApiResponse = {
  success: boolean;
  message: string;
  data?: {
    accessToken: string;
  };
};

// ─── Inner content (uses useSearchParams) ─────────────────────────────────────

function VerifyEmailContent() {
  const router    = useRouter();
  const params    = useSearchParams();
  const email     = params.get('email') ?? '';
  const setAuth   = useAuthStore(s => s.setAuth);

  const [resendSent,    setResendSent]    = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [requestError,  setRequestError]  = useState<string | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { token: '' },
  });

  // ── Submit ─────────────────────────────────────────────────────────────────
  const onSubmit = form.handleSubmit(async ({ token }) => {
    setRequestError(null);

    try {
      const response = await authApiFetch('/verify-email', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ email, token }),
      });

      const payload = (await response.json()) as VerifyEmailApiResponse;

      if (!response.ok || !payload.success) {
        setRequestError(payload.message ?? 'Verification failed. Please try again.');
        return;
      }

      if (!payload.data?.accessToken) {
        setRequestError('Unexpected response from server. Please try again.');
        return;
      }

      const { accessToken } = payload.data;
      const user = await completeAuthWithTokens(accessToken);
      setAuth(user, accessToken);
      toast.success('Email verified!', 'Welcome to Fulcrum.');
      router.replace('/dashboard');
    } catch {
      setRequestError('Could not verify your email. Please check your connection and try again.');
    }
  });

  // ── Resend ─────────────────────────────────────────────────────────────────
  const handleResend = async () => {
    if (!email) {
      toast.error('Missing email', 'Please go back to sign up and try again.');
      return;
    }

    setResendLoading(true);
    setResendSent(false);

    try {
      await authApiFetch('/resend-verification', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ email }),
      });
      setResendSent(true);
      toast.success('Code resent!', `A new code has been sent to ${email}.`);
    } catch {
      toast.info('Check your inbox', 'If the address is registered a new code will arrive shortly.');
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

            <CardTitle className="text-2xl font-bold">Check your inbox</CardTitle>
            <CardDescription className="mt-1 text-sm leading-relaxed">
              We sent a verification code to{' '}
              {email ? (
                <span className="font-medium text-foreground break-all">{email}</span>
              ) : (
                'your email address'
              )}
              . Enter it below to activate your account.
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
                      <FormLabel>Verification code</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter your verification code"
                          autoComplete="one-time-code"
                          autoFocus
                          className="text-center tracking-widest text-base font-mono"
                          {...field}
                          onChange={e => {
                            // strip spaces so users can paste with spaces
                            field.onChange(e.target.value.replace(/\s/g, ''));
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

                <Button
                  type="submit"
                  className="w-full"
                  disabled={form.formState.isSubmitting}
                >
                  {form.formState.isSubmitting ? 'Verifying…' : 'Verify email'}
                </Button>
              </form>
            </Form>

            {/* Divider */}
            <div className="my-5 flex items-center gap-3">
              <div className="h-px flex-1 bg-border" />
              <span className="text-xs text-muted-foreground">Didn&#39;t receive it?</span>
              <div className="h-px flex-1 bg-border" />
            </div>

            {/* Resend */}
            <div className="space-y-2 text-center">
              {resendSent ? (
                <p className="text-sm text-muted-foreground">
                  ✓ A new code is on its way. Check your spam folder if you don&#39;t see it.
                </p>
              ) : (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleResend}
                  disabled={resendLoading || !email}
                  className="w-full text-sm"
                >
                  {resendLoading ? 'Sending…' : 'Resend verification code'}
                </Button>
              )}
            </div>

            {/* Back to sign in */}
            <p className="mt-6 text-center text-sm text-muted-foreground">
              Wrong address?{' '}
              <Link
                href="/signup"
                className="font-medium text-foreground underline underline-offset-4 hover:opacity-80 transition-opacity"
              >
                Start over
              </Link>
              {' · '}
              <Link
                href="/signin"
                className="font-medium text-foreground underline underline-offset-4 hover:opacity-80 transition-opacity"
              >
                Sign in
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
            <p className="text-sm text-muted-foreground">Loading…</p>
          </div>
        </div>
      }
    >
      <VerifyEmailContent />
    </Suspense>
  );
}