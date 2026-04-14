"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Trophy, CalendarDays, Zap, BarChart3, ArrowRight } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";

// ─── Feature data ─────────────────────────────────────────────────────────────

const FEATURES = [
  {
    icon: Trophy,
    id: "goals",
    title: "Goals",
    description:
      "Hierarchical goal trees. Break big dreams into actionable sub-goals and track real progress every step of the way.",
    accent: "oklch(0.65 0.22 260)",
  },
  {
    icon: CalendarDays,
    id: "planner",
    title: "Daily Planner",
    description:
      "Schedule tasks, track time with a live timer. Watch a plant grow as you focus — a gentle reminder that consistency compounds.",
    accent: "oklch(0.65 0.18 160)",
  },
  {
    icon: Zap,
    id: "habits",
    title: "Habits",
    description:
      "Build daily rituals that stick. Track streaks, visualise momentum, and never miss twice.",
    accent: "oklch(0.7 0.22 80)",
  },
  {
    icon: BarChart3,
    id: "analytics",
    title: "Analytics",
    description:
      "See where your time really goes. Weekly trends, focus scores, and efficiency tracking — no guesswork.",
    accent: "oklch(0.65 0.22 320)",
  },
] as const;

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function MarketingPage() {
  return (
    <div className="relative min-h-screen overflow-x-hidden">
      {/* ── Navbar ────────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 w-full border-b border-border/60 backdrop-blur-xl bg-background/80">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          {/* Logo */}
          <Link
            href="/"
            className="flex items-center gap-2 font-bold text-foreground hover:opacity-80 transition-opacity select-none"
          >
            <span className="text-2xl leading-none">⚡</span>
            <span className="text-lg tracking-tight">Fulcrum</span>
          </Link>

          {/* Nav links (desktop) */}
          <nav className="hidden md:flex items-center gap-8">
            {(["Goals", "Planner", "Habits", "Analytics"] as const).map(
              (item) => (
                <a
                  key={item}
                  href={`#${item.toLowerCase()}`}
                  onClick={(e) => {
                    e.preventDefault();
                    const id = item.toLowerCase();
                    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
                    window.history.replaceState(null, "", `#${id}`);
                  }}
                  className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                >
                  {item}
                </a>
              ),
            )}
          </nav>

          {/* CTA */}
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Button
              asChild
              variant="ghost"
              size="sm"
              className="hidden sm:inline-flex"
            >
              <Link href="/signin">Sign In</Link>
            </Button>
            <Button asChild size="lg">
              <Link href="/signup">
                Start Free
                <ArrowRight className="h-3.5 w-3.5 mt-0.5" />
              </Link>
            </Button>
          </div>
        </div>
      </header>

      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <section className="relative mx-auto flex max-w-6xl flex-col items-center px-6 pb-24 pt-28 text-center md:pt-36">
        {/* Badge */}
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-muted/50 px-4 py-1.5 text-xs font-medium text-muted-foreground shadow-sm backdrop-blur-sm">
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500" />
          Now in early access — free while we build
        </div>

        {/* Headline */}
        <h1 className="max-w-4xl text-5xl font-extrabold leading-[1.12] tracking-tight sm:text-6xl md:text-7xl lg:text-[5.5rem]">
          <span
            style={{
              backgroundImage:
                "linear-gradient(135deg, #818cf8 0%, #c084fc 45%, #f472b6 100%)",
              WebkitBackgroundClip: "text",
              backgroundClip: "text",
              WebkitTextFillColor: "transparent",
              color: "transparent",
            }}
          >
            Build the life
          </span>
          <br />
          <span className="text-foreground">you&apos;ve designed.</span>
        </h1>

        {/* Sub-headline */}
        <p className="mt-6 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
          Fulcrum helps you set goals, build habits, track deep work sessions,
          and measure what actually matters — so progress becomes inevitable.
        </p>

        {/* CTAs */}
        <div className="mt-10 flex flex-col items-center gap-3 sm:flex-row">
          <Button asChild size="lg" className="min-w-40 rounded-xl shadow-md">
            <Link href="/signup">
              Start Free
              <ArrowRight className="h-4 w-4 mt-0.5" />
            </Link>
          </Button>
          <Button
            asChild
            variant="outline"
            size="lg"
            className="min-w-40 rounded-xl"
          >
            <Link href="/signin">Sign In</Link>
          </Button>
        </div>

        {/* Social proof micro-copy */}
        <p className="mt-6 text-xs text-muted-foreground/70">
          No credit card required · Cancel anytime
        </p>

        {/* Hero visual separator */}
        <div className="mt-20 h-px w-full max-w-3xl bg-gradient-to-r from-transparent via-border to-transparent" />
      </section>

      {/* ── Features ──────────────────────────────────────────────────────── */}
      <section className="mx-auto max-w-6xl px-6 pb-28">
        {/* Section label */}
        <div className="mb-4 flex items-center justify-center">
          <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Everything you need
          </span>
        </div>
        <h2 className="mb-4 text-center text-3xl font-bold tracking-tight sm:text-4xl">
          One system. Every dimension.
        </h2>
        <p className="mx-auto mb-14 max-w-xl text-center text-sm leading-relaxed text-muted-foreground sm:text-base">
          Most productivity tools solve one slice of the problem. Fulcrum
          connects goals, daily execution, habits, and analytics into a single
          coherent loop.
        </p>

        {/* Grid */}
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map(({ icon: Icon, id, title, description, accent }) => (
            <Card
              key={title}
              id={id}
              className="group relative overflow-hidden border-border/60 bg-card transition-shadow duration-300 hover:shadow-md scroll-mt-72"
            >
              {/* Accent glow on hover */}
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
                style={{
                  background: `radial-gradient(circle at 0% 0%, ${accent}22 0%, transparent 60%)`,
                }}
              />

              <CardContent className="relative p-6">
                {/* Icon */}
                <div
                  className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl"
                  style={{ background: `${accent}22` }}
                >
                  <Icon className="h-5 w-5" style={{ color: accent }} />
                </div>

                <h3 className="mb-2 text-base font-semibold text-card-foreground">
                  {title}
                </h3>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* ── How it works ──────────────────────────────────────────────────── */}
      <section className="mx-auto max-w-6xl px-6 pb-28">
        <div className="rounded-3xl border border-border/60 bg-card px-8 py-16 text-center shadow-sm md:px-16">
          <div className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            The philosophy
          </div>
          <blockquote className="mx-auto max-w-2xl">
            <p
              className="text-2xl font-semibold leading-snug tracking-tight sm:text-3xl md:text-4xl"
              style={{
                backgroundImage:
                  "linear-gradient(135deg, oklch(0.75 0.15 260) 0%, oklch(0.8 0.1 300) 100%)",
                WebkitBackgroundClip: "text",
                backgroundClip: "text",
                WebkitTextFillColor: "transparent",
                color: "transparent",
              }}
            >
              &ldquo;Focus is the art of saying no to good things so you can say
              yes to great ones.&rdquo;
            </p>
            <footer className="mt-6 text-sm text-muted-foreground">
              — The Fulcrum Manifesto
            </footer>
          </blockquote>

          <div className="mt-12 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Button asChild size="lg" className="rounded-xl shadow-md">
              <Link href="/signup">
                Get started for free
                <ArrowRight className="h-4 w-4 mt-0.5" />
              </Link>
            </Button>
            <Button asChild variant="ghost" size="lg" className="rounded-xl">
              <Link href="/signin">Already have an account</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* ── Stats strip ───────────────────────────────────────────────────── */}
      <section className="border-t border-border/60 bg-muted/30">
        <div className="mx-auto grid max-w-6xl grid-cols-2 divide-x divide-border/60 md:grid-cols-4">
          {(
            [
              { value: "∞", label: "Goals, no limit" },
              { value: "21+", label: "Days to a habit" },
              { value: "100%", label: "Your data, private" },
              { value: "0", label: "Fluff, zero noise" },
            ] as const
          ).map(({ value, label }) => (
            <div
              key={label}
              className="flex flex-col items-center justify-center px-6 py-10 text-center"
            >
              <span className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
                {value}
              </span>
              <span className="mt-1.5 text-xs font-medium text-muted-foreground">
                {label}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* ── Footer ────────────────────────────────────────────────────────── */}
      <footer className="border-t border-border/60 bg-background">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 py-8 sm:flex-row">
          <Link
            href="/"
            className="flex items-center gap-2 font-bold text-foreground hover:opacity-80 transition-opacity"
          >
            <span className="text-xl leading-none">⚡</span>
            <span className="text-sm tracking-tight">Fulcrum</span>
          </Link>

          <p className="text-xs text-muted-foreground/60">
            © {new Date().getFullYear()} Fulcrum. Built for deep work.
          </p>

          <nav className="flex items-center gap-5">
            <Link
              href="/signin"
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              Sign In
            </Link>
            <Link
              href="/signup"
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              Sign Up
            </Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}
