import { Trophy, CalendarDays, Zap, BarChart3 } from "lucide-react";

// ─── Navigation ───────────────────────────────────────────────────────────────

export const NAV_LINKS = [
  "Goals",
  "Planner",
  "Habits",
  "Insights",
] as const;

export type NavLink = (typeof NAV_LINKS)[number];

// ─── Hero ─────────────────────────────────────────────────────────────────────

export const HERO = {
  badge: "Now in early access — free while we build",
  headline1: "Build the life",
  headline2: "you\u2019ve designed.",
  subtext:
    "Fulcrum helps you set goals, build habits, track deep work sessions, and measure what actually matters \u2014 so progress becomes inevitable.",
  microcopy: "No credit card required \u00b7 Cancel anytime",
} as const;

// ─── Features ─────────────────────────────────────────────────────────────────

export const FEATURES_SECTION = {
  eyebrow: "Everything you need",
  headline: "One system. Every dimension.",
  subtext:
    "Most productivity tools solve one slice of the problem. Fulcrum connects goals, daily execution, habits, and insights into a single coherent loop.",
} as const;

export const FEATURES = [
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
      "Schedule tasks, track time with a live timer. Watch a plant grow as you focus \u2014 a gentle reminder that consistency compounds.",
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
    id: "insights",
    title: "Insights",
    description:
      "See where your time really goes. Weekly trends, focus scores, and efficiency tracking \u2014 no guesswork.",
    accent: "oklch(0.65 0.22 320)",
  },
] as const;

// ─── Quote / Philosophy ───────────────────────────────────────────────────────

export const QUOTE = {
  eyebrow: "The philosophy",
  text: "\u201cFocus is the art of saying no to good things so you can say yes to great ones.\u201d",
  attribution: "\u2014 The Fulcrum Manifesto",
} as const;

// ─── Stats ────────────────────────────────────────────────────────────────────

export const STATS = [
  { value: "\u221e", label: "Goals, no limit" },
  { value: "21+", label: "Days to a habit" },
  { value: "100%", label: "Your data, private" },
  { value: "0", label: "Fluff, zero noise" },
] as const;

// ─── Footer ───────────────────────────────────────────────────────────────────

export const FOOTER = {
  copyright: "Fulcrum. Built for deep work.",
} as const;