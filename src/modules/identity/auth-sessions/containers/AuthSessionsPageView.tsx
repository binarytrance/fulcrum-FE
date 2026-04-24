"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Monitor,
  Smartphone,
  Globe,
  Loader2,
  LogOut,
  Trash2,
  ShieldAlert,
} from "lucide-react";

import { useAuthStore } from "@/store/auth-store";
import {
  listSessions,
  revokeSession,
} from "@/modules/identity/auth-sessions/api/auth-sessions-api";
import type { AuthSession } from "@/types";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";

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

export function AuthSessionsPageView() {
  const router = useRouter();
  const { signoutAll } = useAuthStore();

  const [sessions, setSessions] = useState<AuthSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [revoking, setRevoking] = useState<string | null>(null);
  const [revokingAll, setRevokingAll] = useState(false);
  const [confirmRevokeAll, setConfirmRevokeAll] = useState(false);

  const fetchSessions = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await listSessions();
      setSessions(
        [...data].sort((a, b) => {
          if (a.current) return -1;
          if (b.current) return 1;
          return (
            new Date(b.lastRotatedAt).getTime() - new Date(a.lastRotatedAt).getTime()
          );
        }),
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load sessions.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchSessions();
  }, [fetchSessions]);

  const handleRevoke = async (sessionId: string, isCurrent: boolean) => {
    setRevoking(sessionId);
    setError(null);
    try {
      await revokeSession(sessionId);
      if (isCurrent) {
        await signoutAll();
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
    setError(null);
    try {
      await signoutAll();
      router.replace("/signin");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to sign out all sessions.");
      setRevokingAll(false);
      setConfirmRevokeAll(false);
    }
  };

  return (
    <div className="mx-auto min-h-screen max-w-2xl px-4 py-10">
      <div className="mb-8 flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild className="shrink-0">
          <Link href="/dashboard">
            <ArrowLeft className="h-4 w-4" />
            <span className="sr-only">Back to dashboard</span>
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Active sessions</h1>
          <p className="text-sm text-muted-foreground">
            Devices currently signed in to your Fulcrum account.
          </p>
        </div>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-20 text-muted-foreground">
          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
          Loading sessions…
        </div>
      )}

      {!loading && error && (
        <div className="mb-6 flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {!loading && !error && (
        <>
          <div className="space-y-3">
            {sessions.map((session) => (
              <Card
                key={session.sessionId}
                className={session.current ? "border-primary/40 bg-primary/5" : "border-border"}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
                        {guessDeviceIcon(session.userAgent)}
                      </div>
                      <div>
                        <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                          {parseBrowser(session.userAgent)}
                          {session.current && (
                            <span className="rounded-full bg-primary px-2 py-0.5 text-[10px] font-medium text-primary-foreground">
                              This device
                            </span>
                          )}
                        </CardTitle>
                        <CardDescription className="text-xs">
                          {session.ipAddress ?? "Unknown IP"} ·{" "}
                          {session.userAgent
                            ? session.userAgent.slice(0, 60) +
                              (session.userAgent.length > 60 ? "…" : "")
                            : "Unknown user agent"}
                        </CardDescription>
                      </div>
                    </div>

                    <Button
                      variant={session.current ? "destructive" : "ghost"}
                      size="sm"
                      className="shrink-0 text-xs"
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
                  <div className="flex flex-wrap gap-x-4 gap-y-1">
                    <span>Signed in {formatDate(session.createdAt)}</span>
                    <span>Last active {formatDate(session.lastRotatedAt)}</span>
                    <span>Expires {formatDate(session.expiresAt)}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {sessions.length > 1 && (
            <div className="mt-8 rounded-xl border border-destructive/20 bg-destructive/5 p-5">
              <p className="text-sm font-medium text-foreground">Sign out all devices</p>
              <p className="mt-1 text-xs text-muted-foreground">
                This will immediately revoke all active sessions including this one. You will be
                redirected to the sign in page.
              </p>
              <Button
                variant="destructive"
                size="sm"
                className="mt-4"
                disabled={revokingAll}
                onClick={handleRevokeAll}
              >
                {revokingAll ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
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
