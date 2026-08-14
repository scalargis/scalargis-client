# 02 — How theming works now

Two things make up a theme today:

1. a **Mantine theme override** — colours, and optionally a font family —
   that re-themes every Mantine component in the app at once; and
2. optionally, some **brand CSS** — plain stylesheets, scoped to the theme,
   for the shell chrome and anything else the theme object doesn't reach.

The first is contract-checked and contrast-gated. The second is the same
free-form power the old Prime themes had, minus the fragility of depending
on a UI library's internals.

## The moving parts

**A theme is a module folder** here, loaded by name. The module exports:

```jsx
export const mantineTheme = ...;   // the Mantine override (part 1)
export default SomeComponent;      // rendered while active — carries the
                                   // chrome CSS imports (part 2)
```

The shipped palette themes re-export the default chrome and take their
`mantineTheme` from the presets in `@scalargis/ui` — open
[`red/src/main.jsx`](red/src/main.jsx), it's ten lines.

**The override is built with `createClientTheme()`** (from `@scalargis/ui`).
That helper merges your overrides onto the ADS base theme and **throws at
load time on any key outside the contract** — the allowed set is checked by
code, not by review.

**The registry applies it at the root.** The whole app renders from one
`MantineProvider`. When a theme becomes active, `ThemeSelector` hands its
`mantineTheme` to a small registry which swaps it onto that root provider —
this matters because Mantine portals every modal, dropdown and toast to
`document.body`; a theme applied any lower would leave those unbranded.

**`data-sg-theme` is the CSS hook.** While a theme is active, the registry
stamps `data-sg-theme="<name>"` on `<html>`. All brand CSS scopes under it:

```css
:root[data-sg-theme='lime'] body { font-family: Saira, sans-serif; }
```

Switch themes and the attribute changes — the old rules simply stop
matching. Nothing is unloaded, nothing flashes.

## Chrome vs. controls — the one design rule to understand

A brand's true colour is often too light for white text (`#9EC222` lime on
white is ~2:1 — far below the 4.5:1 accessibility floor). The old themes
ignored that; this system splits the problem:

- **Brand chrome** — topbar, footer, splash, the map-button strip — always
  paints with the *true* brand colour (tuple index 5, `primary-5`). This is
  what makes a lime deploy look lime.
- **Interactive surfaces** — filled buttons, links, text accents — follow
  **`primaryShade`**: index 5 when the brand passes the contrast check,
  a darker index (usually 7) when it doesn't.

For dark-enough brands the two are the same colour and you never notice.
For bright brands the topbar stays bright while buttons darken to stay
readable. The shipped ratios are locked by a test
(`libs/ui/src/theme/presets.test.ts`) that fails if a tuple changes.

## What a theme can and cannot change

The honest answer, in three tiers:

### Tier 1 — the theme object (checked, gated)

`createClientTheme` accepts exactly these keys and throws on anything else:

| key | what it changes |
|---|---|
| `primary` | brand colour, as a full 10-shade tuple (index 0–9 = ADS 50–900) |
| `secondary` | second brand colour, same shape |
| `primaryShade` | which shade filled controls/links use (the contrast escalation above) |
| `fontFamily` | the font family, app-wide (client-branded themes only) |
| `headingsFontFamily` | headings-only family, if different |

**Font *sizes*, spacing, radii, breakpoints and the focus ring are not in
the contract — deliberately.** The type scale and the 8px grid are what
keep every deploy usable and ADS-legal; the decision (2026-07-16) was that
a brand may change *which* font, never *how big*. The `default` theme
additionally keeps the ADS font itself — it is the adherence anchor and
never carries overrides at all.

### Tier 2 — brand CSS (free-form, on you)

**Yes, a theme can ship CSS** — that never went away. Anything visual the
theme object doesn't cover, a scoped stylesheet can: chrome backgrounds,
logos, per-widget tweaks. The shipped bright themes use it for the Saira
body font; the default chrome itself uses it to paint the topbar/footer/
splash from `--mantine-color-primary-5` whenever any theme is active
(`core/themes/default/client-brands.css`).

Mechanically this tier is unrestricted — Mantine exposes its whole design
as CSS variables, so a scoped rule *can* even change font or icon sizes
(icons are font-sized):

```css
/* possible, but read the caveat below */
:root[data-sg-theme='acme'] {
  --mantine-font-size-md: 1rem;
}
```

The caveat: nothing checks this tier for you. Off-grid sizes and re-scaled
type can break layouts in ways the contract exists to prevent, no test
gates the contrast of what you paint, and a theme that touches type/sizing
cannot claim ADS adherence. Use it for chrome and fonts; if you find
yourself restyling component internals, stop and ask whether the component
should change instead.

The only hard rule: **scope every selector under
`:root[data-sg-theme='<your-slug>']`** — never write bare selectors, or
your theme will leak into every other theme.

### Tier 3 — immutable if you claim adherence

Foundation palettes (success/warning/danger/info/neutral), the type scale,
the 8px grid, the magenta focus ring. Tier 1 physically can't change them;
tier 2 shouldn't. A deploy that must claim ADS adherence (Selo) uses
`default`, or at most a tier-1 colour-only theme with no font override.

## One more layer that is not a theme

The backoffice viewer form (UI tab) has a **Style** editor — per-viewer
custom CSS stored on the viewer record (`custom_style`) and injected when
that viewer loads. It predates themes, it is not scoped to any theme, and
it applies on top of whatever theme is active. Use it for one-viewer
tweaks; use a theme for a look that several viewers or deploys share.

## Old themes still load

A Prime-era module (no `mantineTheme` export) loads without error: it gets
the base Mantine theme plus its own CSS — which since Batch 1 mostly
matches nothing. Porting one = adding the export and rewriting the CSS it
still needs onto `data-sg-theme` scoping ([04](04-creating-a-theme.md)).
