import type { KnowledgeSnippet } from "./types";

export const knowledgeSnippets: KnowledgeSnippet[] = [
  // habit-science
  {
    id: "hs-1",
    category: "habit-science",
    body: "On average, it takes 66 days — not 21 — for a new behaviour to become automatic. Early friction is normal, not failure.",
    source: "Phillippa Lally, UCL (2010)",
  },
  {
    id: "hs-2",
    category: "habit-science",
    body: "Habit loops wire together cue, routine, and reward. Changing a habit is easier when you keep the cue and reward but swap only the routine.",
    source: "Charles Duhigg, The Power of Habit",
  },
  {
    id: "hs-3",
    category: "habit-science",
    body: "Implementation intentions — 'I will do X at time Y in place Z' — more than double follow-through compared to vague intentions.",
    source: "Peter Gollwitzer, NYU (1999)",
  },
  {
    id: "hs-4",
    category: "habit-science",
    body: "Habit stacking anchors a new behaviour to an existing one. The stronger the anchor habit, the easier the new one sticks.",
    source: "BJ Fogg, Tiny Habits",
  },
  {
    id: "hs-5",
    category: "habit-science",
    body: "Never miss twice. A single skipped day barely affects long-term habit formation; what matters is how quickly you return.",
    source: "James Clear, Atomic Habits",
  },

  // goal-psychology
  {
    id: "gp-1",
    category: "goal-psychology",
    body: "Specific, challenging goals outperform vague 'do your best' goals in 90 % of studies spanning four decades.",
    source: "Locke & Latham, Goal-Setting Theory",
  },
  {
    id: "gp-2",
    category: "goal-psychology",
    body: "Progress on meaningful work is the single strongest day-to-day motivator — more powerful than recognition or incentives.",
    source: "Teresa Amabile, The Progress Principle",
  },
  {
    id: "gp-3",
    category: "goal-psychology",
    body: "Mental contrasting — imagining the desired outcome then the obstacles between you and it — is far more effective than pure positive visualisation.",
    source: "Gabriele Oettingen, WOOP",
  },
  {
    id: "gp-4",
    category: "goal-psychology",
    body: "Breaking a goal into milestones activates a fresh sense of progress at each checkpoint, sustaining motivation across long timeframes.",
    source: "Koo & Fishbach, Journal of Consumer Research (2012)",
  },
  {
    id: "gp-5",
    category: "goal-psychology",
    body: "Identity-based goals ('I am a runner') are more durable than outcome-based ones ('I want to run 5 km') because every action becomes a vote for who you are.",
    source: "James Clear, Atomic Habits",
  },

  // deep-work
  {
    id: "dw-1",
    category: "deep-work",
    body: "The ability to perform deep work — focused, distraction-free concentration — is becoming rare and increasingly valuable. Cultivate it like a skill.",
    source: "Cal Newport, Deep Work",
  },
  {
    id: "dw-2",
    category: "deep-work",
    body: "A 90-minute focused block aligns with the brain's natural ultradian rhythm. After that, a genuine break restores full capacity.",
    source: "Peretz Lavie, Sleep Research (1982)",
  },
  {
    id: "dw-3",
    category: "deep-work",
    body: "Context-switching doesn't just cost time — residual attention from a prior task lingers for up to 23 minutes after you switch.",
    source: "Gloria Mark, UC Irvine",
  },
  {
    id: "dw-4",
    category: "deep-work",
    body: "Scheduling your deep work time in advance — not deciding in the moment — removes the decision fatigue that erodes willpower before the session starts.",
    source: "Cal Newport, Deep Work",
  },
  {
    id: "dw-5",
    category: "deep-work",
    body: "Flow states emerge when challenge slightly exceeds current skill. Tasks that are too easy or too hard both prevent flow.",
    source: "Mihaly Csikszentmihalyi",
  },

  // our-approach
  {
    id: "oa-1",
    category: "our-approach",
    body: "Fulcrum is built on one idea: small, consistent actions compound into extraordinary results. The lever is daily intention.",
    source: "Fulcrum",
  },
  {
    id: "oa-2",
    category: "our-approach",
    body: "Long-term goals give direction; short-term milestones give momentum. Both matter — neither works without the other.",
    source: "Fulcrum",
  },
  {
    id: "oa-3",
    category: "our-approach",
    body: "We track sessions, not just tasks. Showing up and doing the work — even imperfectly — is what the data actually needs to see.",
    source: "Fulcrum",
  },
  {
    id: "oa-4",
    category: "our-approach",
    body: "Your streak is a signal, not a judge. It tells you about your recent pattern; it doesn't define your capacity or potential.",
    source: "Fulcrum",
  },
  {
    id: "oa-5",
    category: "our-approach",
    body: "The goal of the Today view is clarity: one place to see what matters, what you've committed to, and where you stand.",
    source: "Fulcrum",
  },
];

/**
 * Returns a snippet that rotates daily, consistent for the entire day.
 * Seeded by day-of-year so it's the same for every user on the same day.
 */
export function getDailySnippet(date: Date = new Date()): KnowledgeSnippet {
  const start = new Date(date.getFullYear(), 0, 0);
  const diff = date.getTime() - start.getTime();
  const dayOfYear = Math.floor(diff / (1000 * 60 * 60 * 24));
  return knowledgeSnippets[dayOfYear % knowledgeSnippets.length];
}
