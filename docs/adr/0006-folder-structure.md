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
├── shared/         domain-free code, the lowest layer
│   ├── components/   ui/ (primitives), left-nav/, app shell, providers
│   ├── lib/          api client, analytics, date/duration/cn helpers
│   ├── store/        global client state (auth only, ADR 0009)
│   ├── utils/        auth + PKCE helpers, localStorage helpers
│   ├── actions/      server actions
│   └── types/        shared types
└── i18n/           next-intl request config (ADR 0013)
```

| Put it in | When |
|---|---|
| `modules/<domain>` | It belongs to one domain's behaviour or UI |
| `shared/components/ui` | A generic primitive with no domain knowledge |
| `shared/lib` / `shared/utils` | A domain-free helper |
| `shared/hooks` | A generic hook (no domain knowledge) used by several modules. Created when the first one is needed; the shadcn CLI also generates hooks here (`components.json`) |
| `modules/<domain>/hooks` | A hook that fetches or encodes domain data (e.g. `planner/useTodayData`) |
| `app/` | Only to wire a URL to a module view |

`shared/` **must not import from `modules/`**. This is enforced by a
`no-restricted-imports` block in `eslint.config.mjs` (ADR 0002) and covers
barrel, deep and relative imports. Code that composes modules belongs in a
module (usually `planner`) or in `app/`, not in `shared/`.

Import shared code with the `@/shared/...` alias, e.g.
`@/shared/components/ui/button`, `@/shared/lib/api`.

## Consequences

- A feature's code is colocated and removable as a unit.
- `settings/` and `onboarding/` are empty scaffolds; `identity` holds the
  auth-sessions UI.

## Known gaps

- Some modules contain empty `insights/` folders reserved for inline analytics
  (see `src/CLAUDE.md`).
