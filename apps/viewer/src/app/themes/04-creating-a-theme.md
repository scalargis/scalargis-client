# 04 — Creating a theme

The short version: copy a shipped theme folder, swap in your colours, run
the contrast check, done. This doc is the long version, using a bright
brand green as the worked example because bright hues are the case with a
pitfall. A dark-enough brand is just steps 1–3.

## 1. Make the folder

```
themes/<slug>/src/main.jsx
```

The slug is the name deploys will configure ([03](03-applying-a-theme.md))
and what `data-sg-theme` will carry — lowercase, no spaces (`acme`,
`dark-green`). For a theme that ships with the product, a plain folder
here; for a client theme, its own repo that the deployment mounts here
(the existing client themes are symlinked submodules).

## 2. Build the tuple and the override

Your brand colour goes at **index 5** of a 10-shade tuple (index 0–9 =
ADS 50–900): lighter tints above it, darker shades below. The shipped
tuples in `libs/ui/src/theme/presets.ts` show the curve — tints are mixes
toward white, darks walk the lightness down to about a third.

```jsx
// themes/acme/src/main.jsx
import { createClientTheme } from '@scalargis/ui';

import ThemeDefault from '../../../core/themes/default/main';
import './style.css'; // only if you have brand CSS (step 4)

const ACME_PRIMARY = [
  '#FBFCF5', '#F7FAED', '#F2F7E2', '#E3EDC0', '#BCD567',
  '#9EC222', '#7E9B1B', '#5E7314', '#4C5E10', '#2F3A0A',
];

export const mantineTheme = createClientTheme({
  primary: ACME_PRIMARY,
  primaryShade: 7,          // only if step 3 says so
  fontFamily: 'Saira, "Noto Sans", sans-serif', // only branded themes
});

export default ThemeDefault; // reuse the default shell chrome
```

`createClientTheme` accepts `primary`, `secondary`, `primaryShade`,
`fontFamily`, `headingsFontFamily` — nothing else, it throws otherwise
(see [02](02-how-theming-works.md) for what belongs in CSS instead).

## 3. Run the contrast check — the bright-hue trap

Check two pairings, both must reach **4.5:1**:

- white text on `tuple[5]`
- `tuple[5]` text on white

A dark brand passes both and you're done — omit `primaryShade`.

A bright brand fails: `#9EC222` manages only ~2:1. **Don't darken the
brand colour to pass** — index 5 must stay the true brand, because the
chrome paints with it. Instead set `primaryShade` to the **first index
that passes** (for this green: index 6 is 3.19, still failing; index 7,
`#5E7314`, passes at 5.33 → `primaryShade: 7`). The topbar stays bright
lime; buttons and links use the dark green and stay readable.

Any contrast checker works (browser devtools included). If the theme ships
with the product, add it to the presets so `presets.test.ts` locks the
ratios permanently.

## 4. Fonts and brand CSS (optional)

**Font:** name the family in the override (step 2) *and* load the files —
`@fontsource` imports in the module — then cover the non-Mantine shell in
your `style.css`. Only client-branded themes may do this; `default` keeps
ADS type, and a theme that must claim ADS adherence must not set a font.

**Brand CSS:** everything scoped under your slug, no exceptions:

```css
/* themes/acme/src/style.css */
:root[data-sg-theme='acme'] body {
  font-family: Saira, 'Noto Sans', sans-serif;
}
:root[data-sg-theme='acme'] .splash-screen {
  background-image: url(...);
}
```

You get the basics for free: the topbar, footer and splash already paint
with your `primary-5` whenever your theme is active
(`core/themes/default/client-brands.css`). Only add CSS for what's
genuinely yours — a logo, the font, a chrome detail.

## 5. Try it, then wire it

```
http://localhost:4200/mapa/mantine?theme=acme
```

Walk the chrome (topbar/footer/splash colour), a dialog and a dropdown
(they should carry the brand — they portal to `<body>`), a filled button
and a link (the `primaryShade` colour), and the map-button strip. Then set
the name for real per [03](03-applying-a-theme.md).

## Checklist

- [ ] folder = slug = what deploys will configure
- [ ] full 10-shade tuple, true brand at index 5
- [ ] both 4.5:1 pairings checked; `primaryShade` bumped only if needed,
      with the ratio noted in a comment
- [ ] font: family in the override **and** `@fontsource` imports **and**
      a scoped `body` rule (branded themes only)
- [ ] every CSS rule scoped under `:root[data-sg-theme='<slug>']`
- [ ] `?theme=<slug>` walkthrough: chrome, dialog, dropdown, button, link,
      map strip
- [ ] shipped themes only: preset added to `presets.ts` (the AA test now
      guards it) and a row in the README palette table

Deep spec — the formal contract, AA gates, per-preset rationale:
`references/projects/client/migration2/ads-adherence-restrictions/06-theme-support.md`.
