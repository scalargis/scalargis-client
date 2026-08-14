# Viewer themes

Every theme the viewer can load lives in this folder as a **module folder**:
the folder name is the name a deploy configures, and the module inside is
what `core/components/ThemeSelector.jsx` dynamic-imports when that name is
active. Two kinds of folder coexist here:

- **The shipped palette** — `lime`, `cyan`, `red`, `dark-green`, `brown`:
  real folders, part of the product, selectable on any deploy out of the box.
  (`default` is the sixth theme; it *is* the base ADS look and lives in
  `../core/themes/default`.)
- **Client themes** — client-specific repos mounted here by the deployment
  (this workspace does it with symlinks: `coscid`, `cosvgi`, `mapaspt`,
  `snic3`). They follow the same module contract; a broken mount just falls
  back to the default theme.

This file explains how theming used to work in the PrimeReact era, how it
works now, how to apply a theme, and how to build a new one.

---

## How it used to work (PrimeReact theme injection)

Until the Mantine migration, the viewer's look was a stack of stylesheets
and "theming" meant injecting CSS into that stack in the right order:

1. The base look came from a **PrimeReact theme sheet** (saga-blue) plus the
   shell's own `layout.scss`, both imported by `core/themes/default/main.jsx`.
   There was no theme *object* — the look **was** the CSS.
2. A client theme was a folder here whose `src/main.jsx|tsx` imported three
   things: a brand font (`@fontsource/...`), the default theme's `main`
   (pulling the base chrome CSS in), and its own `style.css`.
3. That `style.css` was a large override sheet written against PrimeReact's
   class names — `.p-component`, `.p-inputtext`, `.p-link`, … — plus the
   shell chrome (`.layout-topbar { background: <brand hex> }`). It loaded
   after the base sheets, so the cascade did the theming.
4. `ThemeSelector` dynamic-imported `themes/<name>/src/main.jsx` (with
   `core/themes/<name>/main.jsx` and `.tsx` fallbacks); an unknown name fell
   back to the default theme. The module's default export rendered nothing —
   the CSS side effects were the theme.

There was **no contract**: anything a selector could reach could be
restyled. The migration removed the PrimeReact stylesheets from the base
client (Phase 4, Batch 1), so those `.p-*` selectors now target nothing —
which is exactly why the mechanism below replaced this one.

## How it works now (Mantine client themes)

The whole app renders from **one** `MantineProvider` at the root
(`AdsProviders` in `@scalargis/ui`), themed with `adsBaseTheme` — the ADS
look. A theme is no longer a pile of CSS overrides; it is a **Mantine theme
override plus, optionally, a small amount of scoped brand CSS**.

A theme module exports two things:

- **`mantineTheme`** — the override, built with `createClientTheme()` from
  `@scalargis/ui`. That helper is the *only* sanctioned path: it merges over
  the ADS base and **throws at load** on any key outside the override
  contract — `primary` / `secondary` (full 10-shade tuples, ADS 50→900 =
  index 0→9), a justified `primaryShade`, and (client-branded themes only)
  `fontFamily` / `headingsFontFamily`. Foundation palettes, sizing, spacing,
  radius, breakpoints and the focus ring are immutable.
- **`default`** — a React component rendered while the theme is active. It
  exists to carry chrome CSS imports; the shipped palette themes simply
  re-export the default shell (`../core/themes/default/main`).

When a theme is active, `ThemeSelector` hands `mantineTheme` to the
client-theme registry (`useApplyClientTheme`), which:

- applies it on the **root** provider — so body-portaled overlays (modals,
  select dropdowns, toasts) are branded too, which a nested provider would
  miss; and
- stamps **`data-sg-theme="<name>"`** on `<html>` for as long as the theme
  is active. All brand CSS scopes under that attribute.

The default chrome already consumes it
(`core/themes/default/client-brands.css`): while any theme is active, the
topbar, footer and splash paint with `var(--mantine-color-primary-5)`. Index
5 of a preset tuple is always the **true brand hex**, so a colour-only theme
needs **zero CSS of its own**.

The one subtlety worth understanding is the **chrome / interactive split**:
brand chrome (topbar, footer, splash, the map-control strip) always paints
with the bright 500, while filled controls, links and text accents follow
`primaryShade`. For dark-enough brands the two coincide (shade 5). Bright
brand hues fail the 4.5:1 AA check with white text, so their `primaryShade`
is bumped to the first shade that passes — the chrome stays on-brand, the
controls become legible. The shipped palette's ratios are locked by a test
(`libs/ui/src/theme/presets.test.ts`).

Prime-era modules (no `mantineTheme` export) still load without error: they
get the base Mantine theme plus their own CSS — which after Batch 1 mostly
styles nothing. Porting one = adding the `mantineTheme` export and rewriting
whatever chrome CSS is still wanted to `data-sg-theme` scoping.

## How to apply a theme

The active name is resolved per viewer in `core/containers/Layout.jsx`
(later entries override earlier ones):

1. `SITE_CONFIG.theme` — site-wide (also themes the splash/auth/RGPD pages,
   through the site-level `ThemeSelector` in `RGPD.jsx`), falling back to
   `VITE_APP_DEFAULT_THEME`, falling back to `default`;
2. the viewer record's `theme` / `config_json.theme` — per-viewer override
   (wins while that viewer is mounted, hands back on unmount);
3. `?theme=<name>` on the URL — previews any theme on any viewer with no
   config change and no persistence (e.g. `/mapa/mantine?theme=red`).

Valid names are the folder names here. `default` — or any unknown name,
which also logs a console error — lands on the ADS default.

## The shipped palette

| name (folder) | label | brand 500 | white↔500 | `primaryShade` | white↔shade | font |
|---|---|---|---|---|---|---|
| `default` | ADS (default) | `#1A65FA` | 4.90 AA | 5 | 4.90 AA | Noto Sans |
| `lime` | Lime green | `#9EC222` | 2.06 — chrome only* | 7 | 5.33 AA | Saira |
| `cyan` | Cyan blue | `#37B2DF` | 2.44 — chrome only* | 7 | 5.74 AA | Saira |
| `red` | Red | `#C62828` | 5.62 AA | 5 | 5.62 AA | Noto Sans |
| `dark-green` | Dark green | `#0E7A46` | 5.40 AA | 5 | 5.40 AA | Noto Sans |
| `brown` | Light brown | `#B08968` | 3.17 — UI/large text | 7 | 7.28 AA | Noto Sans |

\* white text on the bright chrome is a documented deviation of the
bright-brand looks; a theme that ships it does not claim ADS adherence.
Interactive/text surfaces sit at the AA shade.

The tuples themselves live in `@scalargis/ui`
(`libs/ui/src/theme/presets.ts`) under the mechanized AA gate; the folders
here are their loadable form. A live, side-by-side preview of all six —
swatches, contrast ratios, shade/font badges — is on the demo pages
(`/demo-ext/theme`, Demo_ext component).

## How to create a theme (the new contract)

Worked example — a bright brand green like the lime preset, i.e. the *hard*
case (bright hue + brand font). A colour-only theme is steps 1–3 with a
darker hue and no font.

1. **Make the folder.** `themes/<slug>/src/main.jsx`; the slug is what
   deploys configure and what `data-sg-theme` carries. For a theme that
   should ship with the product, a plain folder here; for a client theme,
   its own repo mounted here by the deployment.

2. **Build the override with `createClientTheme`.** Full 10-shade tuple,
   true brand hex at index 5 (generate tints toward white above it, darker
   shades below — the preset tuples in `presets.ts` show the curve):

   ```jsx
   // themes/acme/src/main.jsx
   import { createClientTheme } from '@scalargis/ui';

   import ThemeDefault from '../../../core/themes/default/main';
   import './style.css'; // only if you need brand CSS / fonts

   const ACME_PRIMARY = [
     '#FBFCF5', '#F7FAED', '#F2F7E2', '#E3EDC0', '#BCD567',
     '#9EC222', '#7E9B1B', '#5E7314', '#4C5E10', '#2F3A0A',
   ];

   export const mantineTheme = createClientTheme({
     primary: ACME_PRIMARY,
     primaryShade: 7, // step 3 — only with a failing 500, justified
     fontFamily: 'Saira, "Noto Sans", sans-serif', // branded themes only
   });

   export default ThemeDefault;
   ```

3. **Run the AA pairing checks** (white on `tuple[5]`, `tuple[5]` on white,
   both ≥ 4.5:1). This is the trap with bright hues: `#9EC222` manages only
   2.06:1, and shade 6 still fails — so `primaryShade: 7` (5.33:1). Don't
   darken the 500 itself to pass; the chrome is supposed to keep the real
   brand colour. If the 500 passes both ways, omit `primaryShade` entirely.

4. **Fonts (client-branded themes only).** Name the family in the override
   *and* load the files yourself — `@fontsource` imports in the module or
   CSS — then cover the non-Mantine shell in your `style.css`:

   ```css
   :root[data-sg-theme='acme'] body {
     font-family: Saira, 'Noto Sans', sans-serif;
   }
   ```

   The default/ADS theme keeps ADS type; a theme that claims ADS adherence
   must not set a font.

5. **Brand CSS (optional).** Everything scoped under
   `:root[data-sg-theme='<slug>']` — never bare selectors — so switching
   away un-brands cleanly with no stylesheet unloading. The topbar/footer/
   splash brand paint comes free from `client-brands.css`.

6. **Try it, then wire it.** `?theme=<slug>` on any viewer URL first; then
   `SITE_CONFIG.theme` or the viewer's `config_json.theme` for real.

Everything outside the contract — foundation palettes, sizing, radius, the
magenta focus ring — is off-limits and enforced: `createClientTheme` throws
on unknown keys at module load. The full spec (AA gates, per-preset
rationale, the ADS-adherence boundary) is the adherence kit's
`06-theme-support.md` in the platform docs
(`references/projects/client/migration2/ads-adherence-restrictions/`).
