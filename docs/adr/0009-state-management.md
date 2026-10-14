# ADR 0009: State management

- **Status:** Accepted (recorded retroactively, 2026-10-14)

## Decision

| Kind of state | Where it lives |
|---|---|
| Session / current user | **zustand** store (`store/auth-store.ts`), the only global store |
| Server data (tasks, goals, ...) | Component or hook state (ADR 0008) |
| Theme | React context (`ThemeProvider`) |
| Form state | react-hook-form (ADR 0012) |
| Small per-device preferences (theme, nav state) | `localStorage` via `utils/{read,write}LocalStorage` |
| Access token | In-memory module variable (ADR 0007) |

Rule of thumb: **do not add a global store for server data**; keep it with the
view that owns it.

## Consequences

- Few moving parts and no store boilerplate.
- Sharing data between distant views means lifting it to a common parent or
  refetching.
- `localStorage` reads can fail or be empty (private mode); callers must
  tolerate that.
