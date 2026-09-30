# @scalargis/ui

The Mantine foundation lib for the PrimeReact→Mantine migration.

What lives here — and the only things allowed to (anti-goal:
**no universal widget abstraction layer**):

- **`adsBaseTheme`** — the ADS-anchored base theme (see `docs/aderencia-ads.md` at the repo root).
  Client themes may override `colors.primary`/`colors.secondary`, with
  written justification `primaryShade`, and — client-BRANDED themes only,
  the B2 font clause — the font family. Nothing else. **`createClientTheme()`**
  is the only sanctioned way to build one: it merges over the base and throws
  on any key outside that contract, so the ADS-immutable boundary is enforced
  by construction, not by review.
  The shipped six-preset palette (`src/theme/presets.ts`, AA-gated by its
  test) is the data behind the viewer's theme folders — the how-to for theme
  authors is `apps/viewer/src/app/themes/README.md`.
- **`AdsProviders`** — the single provider mount (MantineProvider + Dates +
  Modals + Notifications), used by both app shells. Shells must import their
  Prime global CSS *before* importing from this lib (CSS order rule).
- **Motion** (`src/theme/motion.ts`) — the central animation control. All
  durations/easings originate there: the theme states every overlay's
  `transitionProps` off the tokens, and the resolver emits them as
  `--sg-motion-*` CSS variables for hand-written CSS (both shells'
  `$transitionDuration` reads them). `FORCE_REDUCED_MOTION` is the one-line
  project switch (stamped as `data-sg-motion` on `<html>`, killed in
  `ads-globals.css`); the OS `prefers-reduced-motion` path stays independent
  and always wins. Durations must never be zeroed in JS — the Combobox
  positioning gate needs its window; the module header has the full story.
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
  do use **primeicons** (`pi pi-*`) — kept permanently
  (a standalone MIT icon font) — but only
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
2. Coexistence-window note: two ADS rules (html/body base document, global `<a>`
   underline) ship deferred inside `src/theme/ads-globals.css` — see the comment
   there before "fixing" it: activation is one atomic app-global commit at the
   end of Phase 3 (root to 16px + theme `scale` removal + those blocks),
   because the file and the theme are shared by both apps. Note that Mantine's
   own `styles.css` already restyles `body`; that bleed onto Prime screens is
   sanctioned.

`eslint.config.js` bans `primereact` imports in this lib — the recipes must
survive the Phase 5 primereact removal untouched, so a violation fails
`nx lint ui` instead of surfacing in review.

Run the suite with `npx vitest run --config libs/ui/vite.config.ts` (or
`npx nx test ui`).
