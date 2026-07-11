# @scalargis/ui

The Mantine foundation lib for the PrimeReact→Mantine migration
(`references/projects/client/migration2/mantine/`).

What lives here — and the only things allowed to (plan §1c anti-goal:
**no universal widget abstraction layer**):

- **`adsBaseTheme`** — the ADS-anchored base theme (living copy; the spec is
  the adherence kit at `references/projects/client/migration2/ads-adherence-restrictions/`).
  Client themes may override `colors.primary`/`colors.secondary` (and, with
  written justification, `primaryShade`) via `mergeThemeOverrides` — nothing else.
- **`AdsProviders`** — the single provider mount (MantineProvider + Dates +
  Modals + Notifications), used by both app shells. Shells must import their
  Prime global CSS *before* importing from this lib (CSS order rule).
- **Recipes** (Phase 1c): `DataGrid`, `confirm()`, `notify`, `FileUpload`,
  `exportCSV` — thin, pattern-level wrappers with the accessibility bar baked
  in, each with Vitest coverage of its behavioral contract.

Coexistence-window note: two kit rules (html/body base document, global `<a>`
underline) ship deferred inside `src/theme/ads-globals.css` — see the comment
there before "fixing" it.
