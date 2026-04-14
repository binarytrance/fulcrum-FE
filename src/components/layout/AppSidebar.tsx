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
  LogOut,
  Menu,
  X,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <TooltipProvider delayDuration={0}>
      <aside
        className={cn(
          "flex flex-col h-screen shrink-0 transition-[width] duration-300 ease-in-out",
          "bg-sidebar border-r border-sidebar-border",
          collapsed ? "w-16" : "w-64"
        )}
      >
        {/* ── Logo / Header ───────────────────────────────────────────────── */}
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
              <span className="text-base tracking-tight text-sidebar-primary-foreground">
                Fulcrum
              </span>
            </Link>
          )}

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
              <X className="h-4 w-4" />
            )}
          </button>
        </div>

        {/* ── Navigation ──────────────────────────────────────────────────── */}
        <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-0.5">
          {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
            const isActive =
              pathname === href || pathname.startsWith(`${href}/`);

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

        {/* ── User info + Logout ──────────────────────────────────────────── */}
        <div className="border-t border-sidebar-border px-2 py-3 space-y-0.5">
          {/* User info row */}
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
            <div className="flex items-center gap-3 rounded-lg px-3 py-2">
              <Avatar className="h-8 w-8 shrink-0">
                <AvatarFallback className="bg-sidebar-primary text-sidebar-primary-foreground text-xs font-semibold">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-sidebar-foreground truncate">
                  {displayName}
                </p>
                {user?.email && (
                  <p className="text-xs text-muted-foreground truncate">
                    {user.email}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Logout button */}
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
                "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all",
                "text-sidebar-foreground hover:bg-destructive/10 hover:text-destructive",
                "disabled:opacity-50 disabled:cursor-not-allowed"
              )}
            >
              <LogOut className="h-4 w-4 shrink-0" />
              <span>{loggingOut ? "Signing out…" : "Sign out"}</span>
            </button>
          )}
        </div>
      </aside>
    </TooltipProvider>
  );
}