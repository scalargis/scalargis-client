# @scalargis/ui

The Mantine foundation lib for the PrimeReact→Mantine migration
(`references/projects/client/migration2/mantine/`).

What lives here — and the only things allowed to (plan §1c anti-goal:
**no universal widget abstraction layer**):

- **`adsBaseTheme`** — the ADS-anchored base theme (living copy; the spec is
  the adherence kit at `references/projects/client/migration2/ads-adherence-restrictions/`).
  Client themes may override `colors.primary`/`colors.secondary` (and, with
  written justification, `primaryShade`) — nothing else. **`createClientTheme()`**
  is the only sanctioned way to build one: it merges over the base and throws
  on any key outside that contract, so the ADS-immutable boundary is enforced
  by construction, not by review (kit 05 §override contract).
- **`AdsProviders`** — the single provider mount (MantineProvider + Dates +
  Modals + Notifications), used by both app shells. Shells must import their
  Prime global CSS *before* importing from this lib (CSS order rule).
- **Recipes** (`src/recipes/`) — thin, pattern-level wrappers with the
  accessibility bar baked in, each covering a PrimeReact widget we actually
  use. Screens import these, not the underlying library:

  | Recipe | Replaces |
  |---|---|
  | `DataGrid`, `exportGridCSV` | `DataTable` + `Column` |
  | `confirm()` | `confirmDialog()` |
  | `ConfirmPopover` | `confirmPopup()` |
  | `notify.success/info/warn/error` | the ref-based `Toast` |
  | `TreeView` | `Tree` (chevrons, tri-state checkboxes, bordered surface, the Enter binding Mantine lacks) |
  | `TreeSelect` | `TreeSelect` (no Mantine core equivalent; keyboard-selectable via TreeView's Enter) |
  | `CollapsiblePanel` | `Panel toggleable` (**not** a one-item Accordion) |
  | `FileUpload` | `FileUpload` (Choose/Upload/Cancel + staged file list) |
  | `TabPanel` | `TabView` panel mount/hide — `eager`/`lazy`/`unmount` (Mantine's only choices are display:none or unmount, both wrong for CodeMirror + datatable tabs) |
  | `exportCSV`, `toCSV` | `DataTable.exportCSV()` |

  Recipes carry no **primereact** dependency (it is removed in Phase 5). They
  do use **primeicons** (`pi pi-*`) — kept permanently by plan decision
  (mantine/README.md §decisions; a standalone MIT icon font) — but only
  through `src/recipes/icons.tsx`, the single mapping point, so a future
  icon-set swap is a one-file change. AdsProviders imports the primeicons
  stylesheet itself. Recipe default strings (button labels, toast titles) are
  i18n-aware: `src/recipes/i18n.ts` registers en/pt bundles on the host
  i18next as the `scalargis_ui` namespace; explicit props always win.

## Two things that will bite you

1. **The shells pin `html { font-size: 14px }.**` Mantine sizes in `rem`, so the
   theme sets `scale: 16/14` to land the ADS 8px grid on real 8px. Every size in
   the theme object must therefore go through Mantine's `rem()` — a literal
   `'1rem'` escapes the scale and silently renders 12.5% small. Hand-written CSS
   uses `calc(<n>rem * var(--mantine-scale))`.
2. Coexistence-window note: two kit rules (html/body base document, global `<a>`
   underline) ship deferred inside `src/theme/ads-globals.css` — see the comment
   there before "fixing" it: activation is one atomic app-global commit at the
   end of Phase 3 (root to 16px + theme `scale` removal + those blocks),
   because the file and the theme are shared by both apps. Note that Mantine's
   own `styles.css` already restyles `body`; that bleed onto Prime screens is
   sanctioned (qa/phase-1 D4).

`eslint.config.js` bans `primereact` imports in this lib — the recipes must
survive the Phase 5 primereact removal untouched, so a violation fails
`nx lint ui` instead of surfacing in review.

Run the suite with `npx vitest run --config libs/ui/vite.config.ts` (or
`npx nx test ui`).
