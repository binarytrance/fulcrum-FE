"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/auth-store";
import { getAccessToken } from "@/lib/api";
import { AppSidebar } from "@/components/layout/AppSidebar";

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

  return (
    <div className="flex h-dvh overflow-hidden bg-background">
      <AppSidebar />
      <main className="flex-1 overflow-y-auto lg:overflow-y-scroll lg:scrollbar-none pt-16 lg:pt-0">
        {children}
      </main>
    </div>
  );
}
