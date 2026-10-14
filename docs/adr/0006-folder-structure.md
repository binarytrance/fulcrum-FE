# ADR 0006: Folder structure and module anatomy

- **Status:** Accepted (recorded retroactively, 2026-10-14)
- **See also:** [ADR 0001](./0001-module-boundaries.md) for import rules.

## Decision

Code is organised **by domain**, not by technical type.

```
src/
├── app/            routes and layouts only (ADR 0004)
├── modules/        one folder per domain (ADR 0001)
│   └── <domain>/
│       ├── index.ts      public API (the barrel)
│       ├── api/          HTTP functions and response types
│       ├── components/   presentational / feature UI
│       ├── containers/   stateful views that compose components
│       ├── logic/        pure domain logic
│       ├── hooks/        data hooks (e.g. planner/useTodayData)
│       └── types/
├── components/     shared UI: ui/ (primitives), left-nav/, app shell, providers
├── lib/            api client, analytics, date/duration/cn helpers
├── store/          global client state (auth only, ADR 0009)
├── utils/          auth + PKCE helpers, localStorage helpers
├── actions/        server actions
├── i18n/           next-intl request config (ADR 0013)
└── types/          shared types
```

| Put it in | When |
|---|---|
| `modules/<domain>` | It belongs to one domain's behaviour or UI |
| `components/ui` | A generic primitive with no domain knowledge |
| `lib` / `utils` | A domain-free helper |
| `app/` | Only to wire a URL to a module view |

Shared folders **must not import from `modules/`** (enforced, ADR 0002).

## Consequences

- A feature's code is colocated and removable as a unit.
- `settings/` and `onboarding/` are empty scaffolds; `identity` holds the
  auth-sessions UI.

## Known gaps

- `components.json` declares a `@/hooks` alias but there is no `src/hooks`;
  hooks currently live inside modules.
- Some modules contain empty `insights/` folders reserved for inline analytics
  (see `src/CLAUDE.md`).
