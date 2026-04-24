import Link from "next/link";
import { Trophy, Zap, BarChart3, CalendarDays } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { ThemeToggle } from "@/components/theme-toggle";

export default async function AuthLayout({ children }: { children: React.ReactNode }) {
  const t = await getTranslations("Auth.layout");

  const PANEL_FEATURES = [
    { icon: Trophy, text: t("featureGoals") },
    { icon: CalendarDays, text: t("featurePlanner") },
    { icon: Zap, text: t("featureHabits") },
    { icon: BarChart3, text: t("featureAnalytics") }
  ];

  return (
    <div className="flex min-h-screen">
      {/* ── Left branding panel (desktop only) ──────────────────────────── */}
      <div className="auth-panel-bg relative hidden overflow-hidden border-r border-border/50 lg:flex lg:w-[52%] xl:w-1/2">
        {/* Ambient glow — top-left purple (subtle in light, stronger in dark) */}
        <div
          aria-hidden="true"
          className="absolute -left-40 -top-40 h-[700px] w-[700px] rounded-full opacity-20 dark:opacity-30"
          style={{
            background: "radial-gradient(circle at center, oklch(0.6 0.25 280) 0%, transparent 65%)"
          }}
        />

        {/* Ambient glow — bottom-right pink */}
        <div
          aria-hidden="true"
          className="absolute bottom-0 right-0 h-[500px] w-[500px] translate-x-1/4 translate-y-1/4 rounded-full opacity-10 dark:opacity-20"
          style={{
            background:
              "radial-gradient(circle at center, oklch(0.65 0.22 320) 0%, transparent 65%)"
          }}
        />

        {/* Mid-panel emerald accent */}
        <div
          aria-hidden="true"
          className="absolute left-1/2 top-1/2 h-[300px] w-[300px] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-[0.07] dark:opacity-10"
          style={{
            background: "radial-gradient(circle at center, oklch(0.65 0.2 160) 0%, transparent 70%)"
          }}
        />

        {/* Panel content */}
        <div className="relative z-10 flex h-full w-full flex-col p-12">
          {/* Logo + ThemeToggle row */}
          <div className="flex items-center justify-between">
            <Link
              href="/"
              className="flex items-center gap-2.5 font-bold text-foreground/80 transition-colors hover:text-foreground"
            >
              <span className="text-2xl leading-none">⚡</span>
              <span className="text-lg tracking-tight">Fulcrum</span>
            </Link>
            <ThemeToggle />
          </div>

          {/* Centre copy */}
          <div className="my-auto flex max-w-[22rem] flex-col">
            {/* Early-access badge */}
            <div className="mb-6 inline-flex w-fit items-center gap-2 rounded-full border border-border bg-muted/60 px-3.5 py-1.5 text-xs text-muted-foreground dark:border-white/10 dark:bg-white/5 dark:text-white/50">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 dark:bg-emerald-400" />
              {t("earlyAccess")}
            </div>

            {/* Headline */}
            <h2 className="text-[2.5rem] font-extrabold leading-[1.1] tracking-tight">
              <span className="text-foreground dark:text-white">{t("headline1")}</span>
              <br />
              <span
                style={{
                  backgroundImage: "linear-gradient(135deg, #818cf8 0%, #c084fc 45%, #f472b6 100%)",
                  WebkitBackgroundClip: "text",
                  backgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  color: "transparent"
                }}
              >
                {t("headline2")}
              </span>
            </h2>

            <p className="mt-4 text-sm leading-relaxed text-muted-foreground dark:text-white/40">
              {t("subheadline")}
            </p>

            {/* Feature list */}
            <ul className="mt-10 space-y-4">
              {PANEL_FEATURES.map(({ icon: Icon, text }) => (
                <li key={text} className="flex items-start gap-3">
                  <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-muted ring-1 ring-border dark:bg-white/10 dark:ring-white/10">
                    <Icon className="h-3.5 w-3.5 text-muted-foreground dark:text-white/55" />
                  </div>
                  <span className="text-sm leading-relaxed text-muted-foreground dark:text-white/45">
                    {text}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {/* Panel footer */}
          <p className="text-xs text-muted-foreground/50 dark:text-white/25">{t("footer")}</p>
        </div>
      </div>

      {/* ── Right form panel ─────────────────────────────────────────────── */}
      <div className="flex flex-1 flex-col bg-background">
        {/* Top bar — mobile only. lg:hidden on the container so it's
            completely absent from the DOM on desktop; the left panel
            header already carries the logo + ThemeToggle there.        */}
        <div className="flex items-center justify-between px-4 py-3 sm:px-6 lg:hidden">
          {/* Mobile logo */}
          <Link
            href="/"
            className="flex items-center gap-2 font-bold text-foreground transition-opacity hover:opacity-80"
          >
            <span className="text-xl leading-none">⚡</span>
            <span className="text-base tracking-tight">Fulcrum</span>
          </Link>

          <ThemeToggle />
        </div>

        {/* Centered form area */}
        <div className="flex flex-1 flex-col items-center justify-center px-6 pb-12 pt-4">
          <div className="w-full max-w-sm">{children}</div>
        </div>
      </div>
    </div>
  );
}
