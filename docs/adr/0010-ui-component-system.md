# ADR 0010: UI component system

- **Status:** Accepted (recorded retroactively, 2026-10-14)

## Decision

- **shadcn/ui** (style `new-york`, base colour `neutral`, CSS variables) on top
  of **Radix UI** primitives, with **class-variance-authority** for variants
  and `cn()` (`clsx` + `tailwind-merge`) for class composition.
- **Icons:** `lucide-react` (configured in `components.json`).
- **Layers of components:**

| Layer | Location | Knows about |
|---|---|---|
| Primitives | `components/ui/` (button, card, dialog, input, form, popover, tooltip, toast, ...) | Nothing domain-specific |
| Shared chrome | `components/` (`LeftNav`, `PageContent`, providers, shell) | Layout, navigation |
| Feature UI | `modules/<domain>/components/` | One domain |
| Views | `modules/<domain>/containers/` | State + composition of the above |

- **Notifications:** the custom `Toaster`/`toast` in `components/ui/toast.tsx`.
- **Layout width:** content is capped at `max-w-6xl` via `PageContent` /
  `WorkspaceLayout`.

## Consequences

- Primitives are copied into the repo (shadcn model), so they can be edited
  freely but do not receive upstream fixes automatically.
- Domain-free primitives keep modules visually consistent.

## Known gaps

- `components/ui/snackbar.tsx` has no importers (toast is used instead).
- `react-icons` is also installed alongside `lucide-react`; pick one.
