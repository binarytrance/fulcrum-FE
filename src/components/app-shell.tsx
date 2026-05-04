"use client";

// AppShell — wraps all authenticated routes.
//
// Responsibilities (current):
//   – Listens for the "session-expired" event dispatched by apiFetch when
//     the refresh token is gone; clears auth state and redirects to /signin
//
// Responsibilities (planned):
//   – WebSocket / realtime provider (add here, not in individual layouts)
//   – ⌘K command palette provider
//   – Auth-scoped analytics listeners

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/auth-store";

export function AppShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const clearAuth = useAuthStore((s) => s.clearAuth);

  useEffect(() => {
    function handleSessionExpired() {
      void clearAuth();
      router.replace("/signin");
    }

    window.addEventListener("session-expired", handleSessionExpired);
    return () => window.removeEventListener("session-expired", handleSessionExpired);
  }, [clearAuth, router]);

  return <>{children}</>;
}
