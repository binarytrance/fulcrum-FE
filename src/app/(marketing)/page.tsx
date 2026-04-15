"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  NAV_LINKS,
  HERO,
  FEATURES,
  FEATURES_SECTION,
  QUOTE,
  STATS,
  FOOTER,
} from "./data/content";

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
            {NAV_LINKS.map((item) => (
              <a
                key={item}
                href={`#${item.toLowerCase()}`}
                onClick={(e) => {
                  e.preventDefault();
                  const id = item.toLowerCase();
                  document
                    .getElementById(id)
                    ?.scrollIntoView({ behavior: "smooth" });
                  window.history.replaceState(null, "", `#${id}`);
                }}
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                {item}
              </a>
            ))}
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
          {HERO.badge}
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
            {HERO.headline1}
          </span>
          <br />
          <span className="text-foreground">{HERO.headline2}</span>
        </h1>

        {/* Sub-headline */}
        <p className="mt-6 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
          {HERO.subtext}
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
          {HERO.microcopy}
        </p>

        {/* Hero visual separator */}
        <div className="mt-20 h-px w-full max-w-3xl bg-gradient-to-r from-transparent via-border to-transparent" />
      </section>

      {/* ── Features ──────────────────────────────────────────────────────── */}
      <section className="mx-auto max-w-6xl px-6 pb-28">
        {/* Section label */}
        <div className="mb-4 flex items-center justify-center">
          <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            {FEATURES_SECTION.eyebrow}
          </span>
        </div>
        <h2 className="mb-4 text-center text-3xl font-bold tracking-tight sm:text-4xl">
          {FEATURES_SECTION.headline}
        </h2>
        <p className="mx-auto mb-14 max-w-xl text-center text-sm leading-relaxed text-muted-foreground sm:text-base">
          {FEATURES_SECTION.subtext}
        </p>

        {/* Grid */}
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map(({ icon: Icon, id, title, description, accent }) => (
            <Card
              key={title}
              id={id}
              className="group relative overflow-hidden border-border/60 bg-card transition-all duration-300 hover:-translate-y-1 hover:shadow-md dark:hover:shadow-[0_0_0_1px_rgba(255,255,255,0.06),0_4px_12px_rgba(0,0,0,0.5)] scroll-mt-72"
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

      {/* ── Quote / Philosophy ────────────────────────────────────────────── */}
      <section className="mx-auto max-w-6xl px-6 pb-28">
        <div className="rounded-3xl border border-border/60 bg-card px-8 py-16 text-center shadow-sm md:px-16">
          <div className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            {QUOTE.eyebrow}
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
              {QUOTE.text}
            </p>
            <footer className="mt-6 text-sm text-muted-foreground">
              {QUOTE.attribution}
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
          {STATS.map(({ value, label }) => (
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
        <div className="mx-auto max-w-6xl px-6 py-8">
          {/* ── Single row on desktop ──────────────────────────────────── */}
          <div className="flex items-center justify-between">
            <Link
              href="/"
              className="flex items-center gap-2 font-bold text-foreground hover:opacity-80 transition-opacity"
            >
              <span className="text-xl leading-none">⚡</span>
              <span className="text-sm tracking-tight">Fulcrum</span>
            </Link>

            {/* Copyright — hidden on mobile, shown on desktop */}
            <p className="hidden sm:block text-xs text-muted-foreground/60">
              © {new Date().getFullYear()} {FOOTER.copyright}
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

          {/* Copyright — shown on mobile only */}
          <p className="mt-3 text-xs text-muted-foreground/60 sm:hidden">
            © {new Date().getFullYear()} {FOOTER.copyright}
          </p>
        </div>
      </footer>
    </div>
  );
}
