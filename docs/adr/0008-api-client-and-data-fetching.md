# ADR 0008: API client and data fetching

- **Status:** Accepted (recorded retroactively, 2026-10-14)

## Decision

- **One HTTP client** in `src/shared/lib/api.ts`: `apiFetch` (adds auth, handles
  refresh, ADR 0007) and `unwrapApiResponse`.
- **Backend envelope:** every endpoint returns
  `{ success, message, data }`; `unwrapApiResponse<T>` returns `data` or throws
  with the server message.
- **Base URL** from `NEXT_PUBLIC_API_BASE_URL` (default
  `http://localhost:6969`) plus `/api/v1`.
- **Each module owns its endpoints** in `modules/<domain>/api/*-api.ts`, with
  the response types beside them.
- **Fetching happens in hooks/containers** with `useEffect` + `useState`.
  Example: `useTodayData` runs `Promise.all` across five modules.
- **No query/cache library** (no SWR / React Query).

## Consequences

- Very little machinery; easy to read.
- No request de-duplication, caching, or background refetch; every view
  re-fetches on mount and each hook manages its own loading/error state.
- Cross-module response types are part of a module's public API and must be
  exported from its barrel (ADR 0001).

## Known gaps

- Rationale for not using a query library: not recorded.
- Response types mirror backend shapes 1:1, so backend changes ripple into
  every consumer.
