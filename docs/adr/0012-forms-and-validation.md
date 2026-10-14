# ADR 0012: Forms and validation

- **Status:** Accepted (recorded retroactively, 2026-10-14)

## Decision

- **react-hook-form** for form state, **zod** schemas for validation, wired by
  `@hookform/resolvers`.
- The shared `components/ui/form.tsx` (shadcn) provides field/label/message
  wiring.
- Every form in the app follows this pattern: sign in, sign up, verify email,
  create/edit task, complete task, create goal, create habit, session actions.
- **Schemas are defined next to the form** that uses them.

## Consequences

- One consistent way to build forms; validation errors render uniformly.
- Schemas are not shared across forms or with the API layer, so a field's
  rules can drift from the backend's.

## Known gaps

- `CreateGoalForm.tsx` is ~370 lines; large forms may warrant splitting into
  field groups.
