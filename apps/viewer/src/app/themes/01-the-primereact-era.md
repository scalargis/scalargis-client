# 01 — How theming used to work (the PrimeReact era)

*Context doc. If you only want to use or build a theme today, skip to
[02](02-how-theming-works.md). Read this if you maintain one of the
Prime-era client themes or wonder why the new system looks the way it
does.*

## The look was a stack of stylesheets

Before the Mantine migration there was no theme *object* anywhere — the
viewer's appearance was entirely the product of CSS files loading in the
right order:

1. **PrimeReact's own theme sheet** (`saga-blue`) painted every widget —
   buttons, inputs, tables, dialogs.
2. The shell's **`layout.scss`** painted the chrome around them — topbar,
   sidebar, footer, splash.
3. A client theme, when active, loaded **its own `style.css` on top**, and
   the CSS cascade did the re-branding.

"Injecting a theme" therefore meant exactly one thing: getting one more
stylesheet loaded after the base ones.

## What a client theme looked like

A theme was a folder (in practice a git submodule mounted into this
directory) with this anatomy:

```
themes/<client>/
  src/
    main.tsx     ← the entry ThemeSelector imported
    style.css    ← the actual theme: a big override sheet
```

`main.tsx` did three imports and rendered nothing:

```tsx
import '@fontsource/saira';                          // the brand font
import ThemeDefault from '../../../core/themes/default/main'; // base chrome CSS
import './style.css';                                // the overrides
const Theme = () => <></>;
export default Theme;
```

`style.css` was written **against PrimeReact's class names** — hundreds of
rules like:

```css
.p-component { font-family: Saira, ...; }
.p-inputtext { font-family: Saira, ...; }
.layout-topbar, .layout-footer { background: rgb(158 194 34); }
.ol-control button { ... }
```

## How it got loaded

`ThemeSelector` (still the same component today) took the configured name
and dynamic-imported `themes/<name>/src/main.jsx`, falling back to
`core/themes/<name>/main.jsx` and the `.tsx` variants, and finally to the
default theme if nothing matched. Importing the module pulled in its CSS,
and that *was* the theming.

## What was good and bad about it

- **Total freedom.** Anything a CSS selector could reach — colours, fonts,
  font *sizes*, icon sizes, spacing, whole layouts — a theme could restyle.
  There was no contract and no gate.
- **Total fragility.** Every rule depended on Prime's internal class names
  and on winning the cascade. Nothing checked contrast, nothing checked
  accessibility, and a Prime upgrade could silently break any rule.

## Why it changed

Phase 4 / Batch 1 of the Mantine migration removed the PrimeReact
stylesheets from the base client. From that moment the old override sheets
had nothing left to override — `.p-inputtext` matches no element any more —
and colour stopped being a stylesheet concern: in Mantine, colour comes
from a **theme object** on the provider. The system described in
[02](02-how-theming-works.md) replaced this one, keeping the part that was
genuinely useful (a theme can still ship its own scoped CSS and font) and
adding what was missing (a contract, and contrast checks that fail the
build instead of the user).
