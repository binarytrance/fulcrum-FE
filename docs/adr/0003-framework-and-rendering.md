# ADR 0003: Framework and rendering model

- **Status:** Accepted (recorded retroactively, 2026-10-14)

## Context

A product UI with an authenticated, highly interactive workspace (task lists,
timers, modals) plus a public marketing page and auth flows.

## Decision

- **Next.js 15 App Router + React 19**, TypeScript `strict`, Turbopack in dev.
- **Client-first rendering.** Most UI is `"use client"` (55 of 75 `.tsx` files).
  Server code is limited to the root layout (loads translations), one server
  action (`src/actions/generate-username.ts`) and `next.config.ts` rewrites.
- **No `middleware.ts`.** Route protection is a client-side gate (ADR 0005).
- Path alias `@/*` → `src/*`.

## Consequences

- Simple mental model: data is fetched in the browser with the user's token
  (ADR 0007, 0008).
- Authenticated pages get no server-rendered content and show a spinner until
  auth hydrates.
- Secrets cannot live in client code; only `NEXT_PUBLIC_*` env vars are used
  (`NEXT_PUBLIC_API_BASE_URL`, PostHog keys).

## Known gaps

- Rationale for client-first: not recorded, confirm with the owner.
- `generate-username.ts` constructs the OpenAI client with `apiKey: ""`, which
  prevents the SDK falling back to `OPENAI_API_KEY`.
