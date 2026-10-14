# ADR 0004: Route structure and layouts

- **Status:** Accepted (recorded retroactively, 2026-10-14)

## Decision

Routes are split into **route groups** by audience; each group owns its layout.

| Group | Routes | Layout / chrome |
|---|---|---|
| `(marketing)` | `/` | Marketing layout |
| `(auth)` | `/signin`, `/signup`, `/verify-email`, OAuth callbacks `/{signin,signup}/{google,github}/callback` | Auth layout |
| `(app)` | everything below; auth gate + `AppShell` | See ADR 0005 |
| `(app)/(workspace)` | `/dashboard`, `/tasks`, `/goals`, `/habits`, `/settings/{profile,account,appearance,sessions}` | Left nav sidebar |
| `(app)/focus` | focus session (layout only, no page yet) | Full screen, no nav |

Rules:

- A page that needs the sidebar goes under `(workspace)`.
- A page that must be full-screen goes under `(app)` directly with its own layout.
- Route files stay thin: they render a module's container or view.

## Consequences

- Chrome and auth requirements are decided by *where* a file lives, not by
  per-page code.
- Settings has its own tab layout (`settings/layout.tsx`); a second tabbed area
  would duplicate it.

## Known gaps

- `/dashboard` is the Today view. `src/CLAUDE.md` plans to rename or remove it
  and choose a landing route. Undecided.
- `(app)/focus` has a layout but no page.
