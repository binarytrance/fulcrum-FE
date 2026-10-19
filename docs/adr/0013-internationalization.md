# ADR 0013: Internationalization

- **Status:** Accepted (recorded retroactively, 2026-10-14)

## Decision

- **next-intl**, configured in `src/i18n/request.ts`.
- **Messages** live in `messages/<locale>/<name>.json`. Each file is loaded
  and namespaced by filename with a capital first letter:
  `auth.json` → `Auth`, `today.json` → `Today`.
- **Locale is hardcoded to `en`** until multi-locale support is added (stated
  in `request.ts`).
- Components read strings with `useTranslations("<Namespace>.<key>")`.

Current files: `auth`, `common`, `dashboard`, `goals`, `nav`, `sessions`,
`today`.

## Consequences

- Adding a namespace is just adding a JSON file.
- Adding a second locale requires real locale detection and a folder per
  locale; the structure is ready but the plumbing is not.

## Known gaps

- Translations are used in 15 files only. Tasks, habits and focus have no
  message files, so their copy appears to be hardcoded.
- `src/CLAUDE.md` mentions migrating copy to `src/content/`; that conflicts
  with `messages/` and needs a decision.
