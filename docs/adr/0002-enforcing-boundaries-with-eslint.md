# ADR 0002: Enforce boundaries with ESLint

- **Status:** Accepted
- **Date:** 2026-10-14
- **Related:** [ADR 0001](./0001-module-boundaries.md)

## Context

The rules in ADR 0001 only hold if they fail CI, not if they live in a wiki.
ESLint's built-in `no-restricted-imports` can ban paths but cannot say "allowed
inside the same module, banned from others", cannot express direction, and
cannot detect cycles.

## Decision

Use three tools, each with one job. Config lives in `eslint.config.mjs`.

| Tool | Enforces | Example it blocks |
|---|---|---|
| `eslint-plugin-boundaries` (`boundaries/dependencies`) | Direction between modules and barrel-only entry | `goals` importing `@/modules/tasks`; any import of `@/modules/habits/components/X` |
| `eslint-plugin-import` (`import/no-cycle`) | No circular imports, including via barrels | `tasks → goals → tasks` |
| `no-restricted-imports` | (a) `app/` and other code outside modules may not deep-import; (b) `src/shared/` may not import `modules/` at all. String-based, independent of path resolution | (a) `app/` importing `@/modules/tasks/components/TaskRow`; (b) `shared/lib` importing `@/modules/tasks` |

`eslint-import-resolver-typescript` lets both plugins resolve the `@/*` alias.

## Alternatives considered

| Option | Why not |
|---|---|
| Only `no-restricted-imports` with generated per-module blocks | No direction, no cycle detection, misses relative paths |
| Convention and code review only | Does not scale; violations surface late |

## Consequences

- Violations fail `npm run lint` with a message naming the rule and the fix.
- Extra dev dependencies, and `eslint-plugin-boundaries` has changed its
  config API between major versions (7.x deprecates `entry-point` in favour of
  `dependencies`), so upgrades may need config changes.
- `import/no-cycle` builds the full import graph; it is the first suspect if
  lint becomes slow.
- If alias resolution breaks, `boundaries` can go quiet rather than fail. The
  `no-restricted-imports` block exists to cover that gap.

## How to change the rules

To allow a new dependency, add the module to its entry in `allowedDependencies`
in `eslint.config.mjs` and justify it in the PR. If it would create a cycle,
the cycle must be broken first; the table alone is not enough.
