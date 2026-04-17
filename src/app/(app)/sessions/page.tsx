"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Monitor,
  Smartphone,
  Globe,
  Loader2,
  LogOut,
  Trash2,
  ShieldAlert,
  ShieldCheck,
  Clock3,
  Sparkles,
} from "lucide-react";

import { useAuthStore } from "@/store/auth-store";
import { listSessions, revokeSession } from "@/utils/sessions-api";
import type { AuthSession } from "@/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(iso: string): string {
  try {
    return new Intl.DateTimeFormat(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

function guessDeviceIcon(userAgent: string | null) {
  if (!userAgent) return <Globe className="h-5 w-5" />;
  const ua = userAgent.toLowerCase();
  if (/mobile|android|iphone|ipad/.test(ua)) return <Smartphone className="h-5 w-5" />;
  return <Monitor className="h-5 w-5" />;
}

function parseBrowser(userAgent: string | null): string {
  if (!userAgent) return "Unknown browser";
  if (/edg\//i.test(userAgent)) return "Microsoft Edge";
  if (/chrome/i.test(userAgent)) return "Chrome";
  if (/firefox/i.test(userAgent)) return "Firefox";
  if (/safari/i.test(userAgent)) return "Safari";
  if (/opera|opr\//i.test(userAgent)) return "Opera";
  return "Unknown browser";
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function SessionsPage() {
  const router = useRouter();
  const { signoutAll } = useAuthStore();

  const [sessions, setSessions] = useState<AuthSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [revoking, setRevoking] = useState<string | null>(null); // sessionId being revoked
  const [revokingAll, setRevokingAll] = useState(false);
  const [confirmRevokeAll, setConfirmRevokeAll] = useState(false);

  const fetchSessions = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await listSessions();
      // Current session first, then by most recently rotated
      setSessions(
        [...data].sort((a, b) => {
          if (a.current) return -1;
          if (b.current) return 1;
          return new Date(b.lastRotatedAt).getTime() - new Date(a.lastRotatedAt).getTime();
        }),
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load sessions.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  const handleRevoke = async (sessionId: string, isCurrent: boolean) => {
    setRevoking(sessionId);
    try {
      await revokeSession(sessionId);
      if (isCurrent) {
        // Current session revoked — sign out locally and redirect
        await signoutAll(); // clears local state (session already revoked on BE)
        router.replace("/signin");
        return;
      }
      setSessions((prev) => prev.filter((s) => s.sessionId !== sessionId));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to revoke session.");
    } finally {
      setRevoking(null);
    }
  };

  const handleRevokeAll = async () => {
    if (!confirmRevokeAll) {
      setConfirmRevokeAll(true);
      return;
    }
    setRevokingAll(true);
    try {
      await signoutAll();
      router.replace("/signin");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to sign out all sessions.");
      setRevokingAll(false);
      setConfirmRevokeAll(false);
    }
  };

  const currentSession = sessions.find((s) => s.current) ?? null;

  return (
    <div className="relative mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-0 h-64 w-[42rem] -translate-x-1/2 rounded-full opacity-20 blur-3xl"
        style={{
          background:
            "radial-gradient(circle, oklch(0.6 0.25 280) 0%, transparent 68%)",
        }}
      />

      {/* Header */}
      <div className="relative mb-5 overflow-hidden rounded-3xl border border-border/70 bg-card/80 p-5 backdrop-blur-sm sm:p-6">
        <div
          aria-hidden="true"
          className="absolute inset-0 opacity-60"
          style={{
            background:
              "linear-gradient(130deg, rgba(129,140,248,0.18) 0%, rgba(192,132,252,0.12) 48%, rgba(244,114,182,0.18) 100%)",
          }}
        />

        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Active sessions</h1>
              <p className="text-sm text-muted-foreground">
                Devices currently signed in to your Fulcrum account.
              </p>
            </div>
          </div>

          <div className="inline-flex w-fit items-center gap-2 rounded-full border border-violet-500/30 bg-violet-500/10 px-3 py-1 text-xs font-medium text-violet-700 dark:text-violet-400">
            <ShieldCheck className="h-3.5 w-3.5" />
            {sessions.length || 0} active
          </div>
        </div>
      </div>

      {!loading && !error && sessions.length > 0 && (
        <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border border-border/60 bg-card/80 px-4 py-3">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Total devices
            </p>
            <p className="mt-1 text-2xl font-bold">{sessions.length}</p>
          </div>
          <div className="rounded-2xl border border-border/60 bg-card/80 px-4 py-3">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Current device
            </p>
            <p className="mt-1 truncate text-sm font-semibold">
              {parseBrowser(currentSession?.userAgent ?? null)}
            </p>
          </div>
          <div className="rounded-2xl border border-border/60 bg-card/80 px-4 py-3">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Security status
            </p>
            <p className="mt-1 inline-flex items-center gap-1.5 text-sm font-semibold text-violet-700 dark:text-violet-400">
              <Sparkles className="h-3.5 w-3.5" />
              Protected
            </p>
          </div>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-20 text-muted-foreground">
          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
          Loading sessions…
        </div>
      )}

      {/* Error */}
      {!loading && error && (
        <div className="mb-6 flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Session list */}
      {!loading && !error && (
        <>
          <div className="space-y-2.5">
            {sessions.map((session) => (
              <Card
                key={session.sessionId}
                className={
                  session.current
                    ? "overflow-hidden border-primary/40 bg-primary/5 shadow-sm"
                    : "overflow-hidden border-border/70 bg-card/85 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
                }
              >
                {session.current && (
                  <div
                    className="h-1 w-full"
                    style={{
                      background:
                        "linear-gradient(90deg, #818cf8 0%, #c084fc 45%, #f472b6 100%)",
                    }}
                  />
                )}

                <CardHeader className="pb-2">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-muted text-muted-foreground">
                        {guessDeviceIcon(session.userAgent)}
                      </div>
                      <div>
                        <CardTitle className="flex items-center gap-2 text-sm font-semibold sm:text-base">
                          {parseBrowser(session.userAgent)}
                          {session.current && (
                            <span className="rounded-full border border-violet-500/30 bg-violet-500/10 px-2 py-0.5 text-[10px] font-medium text-violet-700 dark:text-violet-400">
                              This device
                            </span>
                          )}
                        </CardTitle>
                        <CardDescription className="text-xs sm:text-[13px]">
                          {session.ipAddress ?? "Unknown IP"} ·{" "}
                          {session.userAgent
                            ? session.userAgent.slice(0, 72) + (session.userAgent.length > 72 ? "…" : "")
                            : "Unknown user agent"}
                        </CardDescription>
                      </div>
                    </div>

                    <Button
                      variant={session.current ? "destructive" : "ghost"}
                      size="sm"
                      className="shrink-0 text-xs sm:min-w-24"
                      disabled={revoking === session.sessionId || revokingAll}
                      onClick={() => handleRevoke(session.sessionId, session.current)}
                    >
                      {revoking === session.sessionId ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : session.current ? (
                        <>
                          <LogOut className="mr-1.5 h-3 w-3" />
                          Sign out
                        </>
                      ) : (
                        <>
                          <Trash2 className="mr-1.5 h-3 w-3" />
                          Revoke
                        </>
                      )}
                    </Button>
                  </div>
                </CardHeader>

                <CardContent className="pb-4 text-xs text-muted-foreground">
                  <div className="grid gap-2 text-[11px] sm:grid-cols-3 sm:text-xs">
                    <div className="inline-flex items-center gap-1.5">
                      <Clock3 className="h-3.5 w-3.5" />
                      Signed in {formatDate(session.createdAt)}
                    </div>
                    <div>Last active {formatDate(session.lastRotatedAt)}</div>
                    <div>Expires {formatDate(session.expiresAt)}</div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Sign out all */}
          {sessions.length > 1 && (
            <div className="mt-5 rounded-2xl border border-destructive/20 bg-destructive/5 p-5">
              <p className="text-sm font-medium text-foreground">
                Sign out all devices
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                This will immediately revoke all active sessions including this one.
                You will be redirected to the sign in page.
              </p>
              <Button
                variant="destructive"
                size="sm"
                className="mt-4"
                disabled={revokingAll}
                onClick={handleRevokeAll}
              >
                {revokingAll ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                {confirmRevokeAll
                  ? revokingAll
                    ? "Signing out…"
                    : "Confirm — sign out all"
                  : "Sign out all devices"}
              </Button>
              {confirmRevokeAll && !revokingAll && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="ml-2 mt-4 text-muted-foreground"
                  onClick={() => setConfirmRevokeAll(false)}
                >
                  Cancel
                </Button>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
