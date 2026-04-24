"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/auth-store";
import { getAccessToken } from "@/lib/api";
import { AppShell } from "@/components/app-shell";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const hydrate = useAuthStore((s) => s.hydrate);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Already confirmed — no work needed
    if (isAuthenticated || getAccessToken()) {
      setReady(true);
      return;
    }

    // Not confirmed yet — attempt hydration before rendering children.
    // This prevents child pages from making API calls before the access
    // token is set, which would result in spurious 401s and logouts.
    hydrate().then(() => {
      if (!useAuthStore.getState().isAuthenticated) {
        router.replace("/signin");
      } else {
        setReady(true);
      }
    });
  }, [isAuthenticated, hydrate, router]);

  if (!ready) {
    return (
      <AppShell>
        <div className="flex h-screen items-center justify-center">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-border border-t-foreground" />
        </div>
      </AppShell>
    );
  }

  return <AppShell>{children}</AppShell>;
}
