"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Zap,
  CalendarDays,
  Target,
  Activity,
  Monitor,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Menu,
  X
} from "lucide-react";
import { useTranslations } from "next-intl";

import { useAuthStore } from "@/store/auth-store";
import { NavLink } from "./NavLink";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

const COLLAPSED_KEY = "fulcrum:nav:collapsed";

// ─── Nav content (shared between desktop sidebar and mobile drawer) ───────────

type NavContentProps = {
  collapsed: boolean;
  onClose?: () => void;
  onToggleCollapse?: () => void;
};

function NavContent({ collapsed, onClose, onToggleCollapse }: NavContentProps) {
  const router = useRouter();
  const clearAuth = useAuthStore((s) => s.clearAuth);
  const t = useTranslations("Nav");

  const navItems = [
    { href: "/dashboard", icon: <CalendarDays className="h-4 w-4" />, label: t("today") },
    { href: "/goals", icon: <Target className="h-4 w-4" />, label: t("goals") },
    { href: "/habits", icon: <Activity className="h-4 w-4" />, label: t("habits") }
  ];

  const handleSignOut = async () => {
    await clearAuth();
    router.replace("/signin");
  };

  return (
    <div className="flex h-full flex-col">
      {/* Logo */}
      <div
        className={cn(
          "flex h-14 shrink-0 items-center border-b border-border",
          collapsed ? "justify-center px-2" : "justify-between px-4"
        )}
      >
        <Link
          href="/dashboard"
          onClick={onClose}
          className="flex items-center gap-2 font-bold text-foreground hover:opacity-80 transition-opacity"
        >
          <Zap className="h-5 w-5 shrink-0 text-primary" />
          {!collapsed && <span className="text-base tracking-tight">Fulcrum</span>}
        </Link>

        {onClose && (
          <button
            onClick={onClose}
            className="rounded-md p-1 text-muted-foreground hover:bg-accent hover:text-foreground"
            aria-label="Close menu"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Primary nav */}
      <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-0.5">
        {navItems.map((item) => (
          <NavLink
            key={item.href}
            href={item.href}
            icon={item.icon}
            label={item.label}
            collapsed={collapsed}
            onClick={onClose}
          />
        ))}
      </nav>

      {/* Bottom section */}
      <div className="shrink-0 border-t border-border px-2 py-2 space-y-0.5">
        <NavLink
          href="/settings/sessions"
          icon={<Monitor className="h-4 w-4" />}
          label={t("sessions")}
          collapsed={collapsed}
          onClick={onClose}
        />

        {/* Sign out */}
        {collapsed ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={handleSignOut}
                className="flex w-full justify-center rounded-md px-2 py-2 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-destructive"
              >
                <LogOut className="h-4 w-4 shrink-0" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="right">{t("signOut")}</TooltipContent>
          </Tooltip>
        ) : (
          <button
            onClick={handleSignOut}
            className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-destructive"
          >
            <LogOut className="h-4 w-4 shrink-0" />
            <span>{t("signOut")}</span>
          </button>
        )}

        {/* Collapse toggle — only shown on desktop sidebar (no onClose means it's desktop) */}
        {!onClose && onToggleCollapse && (
          <button
            onClick={onToggleCollapse}
            className={cn(
              "flex w-full items-center rounded-md py-2 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground",
              collapsed ? "justify-center px-2" : "gap-3 px-3"
            )}
          >
            {collapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <>
                <ChevronLeft className="h-4 w-4 shrink-0" />
                <span>{t("collapse")}</span>
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
}

// ─── LeftNav ──────────────────────────────────────────────────────────────────

export function LeftNav() {
  const t = useTranslations("Nav");
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  // Rehydrate collapse state from localStorage
  useEffect(() => {
    const stored = localStorage.getItem(COLLAPSED_KEY);
    if (stored !== null) setCollapsed(stored === "true");
  }, []);

  const toggleCollapsed = () => {
    setCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem(COLLAPSED_KEY, String(next));
      return next;
    });
  };

  return (
    <TooltipProvider delayDuration={0}>
      {/* ── Desktop sidebar ──────────────────────────────────────────────── */}
      <aside
        className={cn(
          "hidden lg:flex shrink-0 flex-col border-r border-border bg-card",
          "transition-[width] duration-200 ease-in-out",
          collapsed ? "w-16" : "w-60"
        )}
      >
        <NavContent
          collapsed={collapsed}
          onToggleCollapse={toggleCollapsed}
        />
      </aside>

      {/* ── Mobile ───────────────────────────────────────────────────────── */}
      <div className="lg:hidden">
        {/* Fixed topbar */}
        <div className="fixed inset-x-0 top-0 z-40 flex h-14 items-center gap-3 border-b border-border bg-background px-4">
          <button
            onClick={() => setMobileOpen(true)}
            className="rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground"
            aria-label={t("openMenu")}
          >
            <Menu className="h-5 w-5" />
          </button>
          <Link
            href="/dashboard"
            className="flex items-center gap-2 font-bold text-foreground hover:opacity-80 transition-opacity"
          >
            <Zap className="h-5 w-5 text-primary" />
            <span className="text-base tracking-tight">Fulcrum</span>
          </Link>
        </div>

        {/* Drawer overlay */}
        {mobileOpen && (
          <>
            <div
              className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
              onClick={() => setMobileOpen(false)}
            />
            <aside className="fixed inset-y-0 left-0 z-50 w-60 bg-card shadow-xl">
              <NavContent
                collapsed={false}
                onClose={() => setMobileOpen(false)}
              />
            </aside>
          </>
        )}
      </div>
    </TooltipProvider>
  );
}
