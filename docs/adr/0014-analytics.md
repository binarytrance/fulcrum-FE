# ADR 0014: Analytics and error tracking

- **Status:** Accepted (recorded retroactively, 2026-10-14)

## Decision

- **PostHog** (`posthog-js`), initialised in `instrumentation-client.ts` with
  `capture_exceptions: true`.
- **Reverse-proxied** through the app: `next.config.ts` rewrites `/ingest/*` to
  PostHog, and the client uses `api_host: "/ingest"`. This reduces
  ad-blocker loss and keeps the PostHog host out of client code.
- **All calls go through `lib/analytics.ts`** (`capture`, `captureException`,
  `identify`). The wrapper is a no-op on the server and when PostHog is not
  ready, so call sites never need guards.
- **Event catalog:** `.posthog-events.json` lists each event, its meaning and
  the file that emits it. Add an entry when adding an event.
- Auth-scoped events (e.g. `session_expired`) are emitted from `AppShell`.

## Consequences

- One place to change vendor or add consent handling.
- The catalog is manual, so it can fall out of date.

## Known gaps

- `src/CLAUDE.md` plans a `lib/logger.ts` abstraction with Sentry for error
  logging; not built yet.
