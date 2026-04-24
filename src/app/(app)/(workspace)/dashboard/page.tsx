"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Zap, LogOut, Loader2, Monitor } from "lucide-react";
import { useTranslations } from "next-intl";
import { useAuthStore } from "@/store/auth-store";
import { Button } from "@/components/ui/button";

export default function DashboardPage() {
  const router = useRouter();
  const clearAuth = useAuthStore((s) => s.clearAuth);
  const user = useAuthStore((s) => s.user);
  const [loggingOut, setLoggingOut] = useState(false);
  const t = useTranslations("Dashboard");

  const handleSignOut = async () => {
    setLoggingOut(true);
    try {
      await clearAuth();
    } finally {
      router.replace("/signin");
    }
  };

  const displayName = user ? `${user.firstname ?? ""} ${user.lastname ?? ""}`.trim() : null;

  const features = [
    t("featureGoals"),
    t("featurePlanner"),
    t("featureHabits"),
    t("featureInsights")
  ];

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-background px-4">
      {/* Brand mark */}
      <div className="flex flex-col items-center gap-3 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg">
          <Zap className="h-7 w-7" />
        </div>

        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            {displayName
              ? t("welcomeBack", { name: displayName.split(" ")[0] })
              : t("welcomeGeneric")}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">{t("subtitle")}</p>
        </div>
      </div>

      {/* Placeholder card */}
      <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-6 text-center shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          {t("comingSoon")}
        </p>
        <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
          {features.map((label) => (
            <span
              key={label}
              className="rounded-full border border-border bg-muted/50 px-3 py-1 text-xs text-muted-foreground"
            >
              {label}
            </span>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3">
        <Button variant="outline" size="sm" asChild>
          <Link href="/settings/sessions">
            <Monitor className="mr-2 h-4 w-4" />
            {t("manageSessions")}
          </Link>
        </Button>

        <Button
          variant="ghost"
          size="sm"
          onClick={handleSignOut}
          disabled={loggingOut}
          className="text-muted-foreground hover:text-destructive"
        >
          {loggingOut ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <LogOut className="mr-2 h-4 w-4" />
          )}
          {loggingOut ? t("signingOut") : t("signOut")}
        </Button>
      </div>
    </div>
  );
}
