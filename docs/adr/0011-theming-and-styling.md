# ADR 0011: Theming and styling

- **Status:** Accepted (recorded retroactively, 2026-10-14)

## Decision

- **Tailwind CSS 4**, CSS-first: tokens are CSS variables in
  `src/app/globals.css`, exposed to Tailwind with `@theme inline`.
- **Dark mode** is a `.dark` class on `<html>`
  (`@custom-variant dark (&:is(.dark *))`).
- **No flash on load:** an inline script in the root layout sets the class
  before React hydrates, from `localStorage` or the OS preference.
- **`ThemeProvider`** (custom context, `components/theme-provider.tsx`) exposes
  `theme`, `toggle`, and `mounted`; the choice persists in `localStorage`.
- **Fonts:** Geist Sans / Geist Mono through `next/font`.
- **Ambient background:** three fixed, low-opacity radial blobs in the root
  layout, purely decorative.

## Consequences

- Colours are changed in one place (the variables), and both themes follow.
- Use semantic tokens (`bg-background`, `text-foreground`, ...) rather than raw
  colours so dark mode works without per-component overrides.
- Theme is two-state (light/dark); there is no explicit "system" option in the
  provider.
