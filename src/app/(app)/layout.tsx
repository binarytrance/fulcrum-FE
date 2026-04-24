"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/auth-store";
import { getAccessToken } from "@/lib/api";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const isAuthenticated = useAuthStore(s => s.isAuthenticated);
  const hydrate = useAuthStore(s => s.hydrate);

  useEffect(() => {
    if (isAuthenticated || getAccessToken()) return;

    hydrate().then(() => {
      if (!useAuthStore.getState().isAuthenticated) {
        router.replace("/signin");
      }
    });
  }, [isAuthenticated, hydrate, router]);

  return <>{children}</>;
}
