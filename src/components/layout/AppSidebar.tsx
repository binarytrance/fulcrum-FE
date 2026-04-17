"use client";

import { cn } from "@/lib/utils";
import { apiFetch } from "@/lib/api";
import { useAuthStore } from "@/store/auth-store";
import {
  LayoutDashboard,
  Target,
  CheckSquare,
  Zap,
  BarChart3,
  Shield,
  LogOut,
  Menu,
  X,
  PanelRightClose,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// ─── Nav config ───────────────────────────────────────────────────────────────

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/goals",     label: "Goals",     icon: Target       },
  { href: "/tasks",     label: "Tasks",     icon: CheckSquare  },
  { href: "/habits",    label: "Habits",    icon: Zap          },
  { href: "/analytics", label: "Analytics", icon: BarChart3    },
] as const;

// ─── Component ────────────────────────────────────────────────────────────────

export function AppSidebar() {
  const pathname    = usePathname();
  const router      = useRouter();
  const user        = useAuthStore(s => s.user);
  const clearAuth   = useAuthStore(s => s.clearAuth);

  const [collapsed,  setCollapsed]  = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  // ── Derived display values ─────────────────────────────────────────────────
  const initials = user
    ? `${user.firstname?.[0] ?? ""}${user.lastname?.[0] ?? ""}`.toUpperCase()
    : "?";

  const displayName = user ? `${user.firstname} ${user.lastname}` : "User";

  // ── Logout ─────────────────────────────────────────────────────────────────
  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await apiFetch("/auth/signout", { method: "POST" });
    } catch {
      // Always sign out locally even if the network call fails
    } finally {
      clearAuth();
      router.replace("/signin");
    }
  };

  // ── Shared nav-item class builder ─────────────────────────────────────────
  const navItemCls = (isActive: boolean) =>
    cn(
      "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all",
      "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
      isActive && "bg-sidebar-accent text-sidebar-accent-foreground"
    );

  const iconOnlyCls = (isActive: boolean) =>
    cn(
      "flex items-center justify-center rounded-lg p-2.5 transition-all",
      "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
      isActive && "bg-sidebar-accent text-sidebar-accent-foreground"
    );

  const isActivePath = (href: string) =>
    pathname === href || pathname.startsWith(`${href}/`);

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <TooltipProvider delayDuration={0}>
      <>
        <div className="fixed inset-x-0 top-0 z-40 border-b border-sidebar-border/70 bg-sidebar/95 px-3 py-2.5 backdrop-blur lg:hidden">
          <div className="flex items-center justify-between">
            <Link
              href="/dashboard"
              className="flex items-center gap-2 font-bold text-sidebar-foreground transition-opacity hover:opacity-80"
            >
              <span className="text-xl leading-none">⚡</span>
              <span className="text-base tracking-tight">Fulcrum</span>
            </Link>

            <div className="flex items-center gap-1">
              <ThemeToggle />
              <button
                onClick={() => setMobileOpen(true)}
                aria-label="Open navigation"
                className="rounded-md p-2 text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              >
                <Menu className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        <div
          className={cn(
            "fixed inset-0 z-50 lg:hidden",
            mobileOpen ? "pointer-events-auto" : "pointer-events-none"
          )}
          aria-hidden={!mobileOpen}
        >
          <div
            className={cn(
              "absolute inset-0 bg-black/45 transition-opacity duration-300",
              mobileOpen ? "opacity-100" : "opacity-0"
            )}
            onClick={() => setMobileOpen(false)}
          />

          <aside
            className={cn(
              "relative z-10 flex h-full w-[84%] max-w-xs flex-col bg-sidebar shadow-2xl transition-transform duration-300",
              mobileOpen ? "translate-x-0" : "-translate-x-full"
            )}
          >
            <div className="flex items-center justify-between border-b border-sidebar-border px-4 py-4">
              <Link
                href="/dashboard"
                className="flex items-center gap-2 font-bold text-sidebar-foreground"
                onClick={() => setMobileOpen(false)}
              >
                <span className="text-xl leading-none">⚡</span>
                <span className="text-base tracking-tight">Fulcrum</span>
              </Link>
              <button
                onClick={() => setMobileOpen(false)}
                aria-label="Close navigation"
                className="rounded-md p-1.5 text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <nav className="scrollbar-none flex-1 overflow-y-auto px-2 py-3 space-y-0.5">
              {NAV_ITEMS.map(({ href, label, icon: Icon }) => (
                <Link
                  key={href}
                  href={href}
                  className={navItemCls(isActivePath(href))}
                  onClick={() => setMobileOpen(false)}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span>{label}</span>
                </Link>
              ))}
            </nav>

            <div className="border-t border-sidebar-border px-2 py-3 space-y-2">
              <div className="overflow-hidden rounded-xl border border-sidebar-border bg-gradient-to-br from-sidebar-accent/80 via-sidebar/80 to-sidebar-accent/20 p-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-2.5">
                    <Avatar className="h-9 w-9 shrink-0 ring-2 ring-sidebar-border/80">
                      <AvatarFallback className="bg-sidebar-primary text-sidebar-primary-foreground text-xs font-semibold">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-sidebar-foreground">
                        {displayName}
                      </p>
                      {user?.email && (
                        <p className="truncate text-xs text-muted-foreground">{user.email}</p>
                      )}
                    </div>
                  </div>
                  <ThemeToggle />
                </div>

                <div className="mt-2 inline-flex items-center rounded-full border border-violet-500/30 bg-violet-500/10 px-2 py-0.5 text-[10px] font-medium text-violet-700 dark:text-violet-400">
                  Active session
                </div>
              </div>

              <Link
                href="/sessions"
                onClick={() => setMobileOpen(false)}
                className="flex w-full items-center justify-between rounded-xl border border-primary/25 bg-primary/10 px-3 py-2.5 text-sm font-medium text-sidebar-foreground transition-all hover:border-primary/40 hover:bg-primary/15"
              >
                <span className="flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  Manage sessions
                </span>
                <span className="text-muted-foreground">Open</span>
              </Link>

              <button
                onClick={handleLogout}
                disabled={loggingOut}
                className={cn(
                  "flex w-full items-center justify-between rounded-xl border border-sidebar-border bg-sidebar-accent/35 px-3 py-2.5 text-sm font-medium transition-all",
                  "text-sidebar-foreground hover:border-destructive/30 hover:bg-destructive/10 hover:text-destructive",
                  "disabled:opacity-50 disabled:cursor-not-allowed"
                )}
              >
                <span className="flex items-center gap-2.5">
                  <LogOut className="h-4 w-4 shrink-0" />
                  <span>{loggingOut ? "Signing out…" : "Sign out"}</span>
                </span>
                <span className="text-xs text-muted-foreground">Secure</span>
              </button>
            </div>
          </aside>
        </div>

        <aside
          className={cn(
            "hidden lg:flex lg:flex-col h-dvh shrink-0 transition-[width] duration-300 ease-in-out",
            "bg-sidebar border-r border-sidebar-border",
            collapsed ? "w-16" : "w-64"
          )}
        >
          <div
            className={cn(
              "flex items-center border-b border-sidebar-border",
              collapsed ? "justify-center px-0 py-4" : "justify-between px-4 py-4"
            )}
          >
            {!collapsed && (
              <Link
                href="/dashboard"
                className="flex items-center gap-2 font-bold text-sidebar-foreground hover:opacity-80 transition-opacity"
              >
                <span className="text-xl leading-none">⚡</span>
                <span className="text-base tracking-tight text-sidebar-foreground">
                  Fulcrum
                </span>
              </Link>
            )}

            <div className="flex items-center gap-1">
              {!collapsed && <ThemeToggle />}
              <button
                onClick={() => setCollapsed(prev => !prev)}
                aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
                className={cn(
                  "rounded-md p-1.5 transition-colors",
                  "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                  collapsed && "mx-auto"
                )}
              >
                {collapsed ? (
                  <Menu className="h-4 w-4" />
                ) : (
                  <PanelRightClose className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>

          <nav className="scrollbar-none flex-1 overflow-y-auto px-2 py-3 space-y-0.5">
            {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
              const isActive = isActivePath(href);

              if (collapsed) {
                return (
                  <Tooltip key={href}>
                    <TooltipTrigger asChild>
                      <Link href={href} className={iconOnlyCls(isActive)}>
                        <Icon className="h-4 w-4" />
                      </Link>
                    </TooltipTrigger>
                    <TooltipContent side="right" sideOffset={8}>
                      {label}
                    </TooltipContent>
                  </Tooltip>
                );
              }

              return (
                <Link key={href} href={href} className={navItemCls(isActive)}>
                  <Icon className="h-4 w-4 shrink-0" />
                  <span>{label}</span>
                </Link>
              );
            })}
          </nav>

          <div className="border-t border-sidebar-border px-2 py-3 space-y-2">
            {collapsed ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex justify-center py-1.5 cursor-default">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-sidebar-primary text-sidebar-primary-foreground text-xs font-semibold">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                  </div>
                </TooltipTrigger>
                <TooltipContent side="right" sideOffset={8}>
                  <p className="font-medium">{displayName}</p>
                  {user?.email && (
                    <p className="text-xs opacity-70 mt-0.5">{user.email}</p>
                  )}
                </TooltipContent>
              </Tooltip>
            ) : (
              <div className="overflow-hidden rounded-xl border border-sidebar-border bg-gradient-to-br from-sidebar-accent/80 via-sidebar/80 to-sidebar-accent/20 p-3">
                <div className="flex items-start gap-2.5">
                  <Avatar className="h-9 w-9 shrink-0 ring-2 ring-sidebar-border/80">
                    <AvatarFallback className="bg-sidebar-primary text-sidebar-primary-foreground text-xs font-semibold">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-sidebar-foreground truncate">
                      {displayName}
                    </p>
                    {user?.email && (
                      <p className="text-xs text-muted-foreground truncate">
                        {user.email}
                      </p>
                    )}
                    <span className="mt-1.5 inline-flex items-center rounded-full border border-violet-500/30 bg-violet-500/10 px-2 py-0.5 text-[10px] font-medium text-violet-700 dark:text-violet-400">
                      Active session
                    </span>
                  </div>
                </div>
              </div>
            )}

            {!collapsed && (
              <Link
                href="/sessions"
                className="flex w-full items-center justify-between rounded-xl border border-primary/25 bg-primary/10 px-3 py-2.5 text-sm font-medium text-sidebar-foreground transition-all hover:border-primary/40 hover:bg-primary/15"
              >
                <span className="flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  Manage sessions
                </span>
                <span className="text-muted-foreground">Open</span>
              </Link>
            )}

            {collapsed ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={handleLogout}
                    disabled={loggingOut}
                    aria-label="Sign out"
                    className={cn(
                      "flex w-full items-center justify-center rounded-lg p-2.5 transition-all",
                      "text-sidebar-foreground hover:bg-destructive/10 hover:text-destructive",
                      "disabled:opacity-50 disabled:cursor-not-allowed"
                    )}
                  >
                    <LogOut className="h-4 w-4" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="right" sideOffset={8}>
                  Sign out
                </TooltipContent>
              </Tooltip>
            ) : (
              <button
                onClick={handleLogout}
                disabled={loggingOut}
                className={cn(
                  "flex w-full items-center justify-between rounded-xl border border-sidebar-border bg-sidebar-accent/35 px-3 py-2.5 text-sm font-medium transition-all",
                  "text-sidebar-foreground hover:border-destructive/30 hover:bg-destructive/10 hover:text-destructive",
                  "disabled:opacity-50 disabled:cursor-not-allowed"
                )}
              >
                <span className="flex items-center gap-2.5">
                  <LogOut className="h-4 w-4 shrink-0" />
                  <span>{loggingOut ? "Signing out…" : "Sign out"}</span>
                </span>
                <span className="text-xs text-muted-foreground">Secure</span>
              </button>
            )}
          </div>
        </aside>
      </>
    </TooltipProvider>
  );
}