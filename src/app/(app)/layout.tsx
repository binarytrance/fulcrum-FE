"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/auth-store";
import { getAccessToken } from "@/lib/api";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { isAuthenticated, hydrate } = useAuthStore(s => ({
    isAuthenticated: s.isAuthenticated,
    hydrate: s.hydrate,
  }));

  useEffect(() => {
    // If we already have an in-memory access token, we're good.
    if (isAuthenticated || getAccessToken()) return;

    // Otherwise try to rehydrate from the HttpOnly refresh-token cookie.
    // hydrate() calls /auth/refresh — if it fails the user isn't logged in.
    hydrate().then(() => {
      if (!useAuthStore.getState().isAuthenticated) {
        router.replace("/signin");
      }
    });
  }, [isAuthenticated, hydrate, router]);

  return <>{children}</>;
}