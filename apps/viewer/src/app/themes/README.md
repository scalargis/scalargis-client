# Viewer themes

A **theme** changes how a ScalarGIS viewer looks — its colours, its font,
its chrome (topbar, footer, splash screen) — without touching any component
code. Every theme lives in this folder as a small **module folder**, and the
folder name is the name you configure. When a viewer says
`"theme": "dark-green"`, the app loads `themes/dark-green/` and the whole
UI re-paints, dialogs and dropdowns included.

Two kinds of folder sit here:

| kind | folders | where they come from |
|---|---|---|
| **Shipped palette** | `lime`, `cyan`, `red`, `dark-green`, `brown` | part of the product — selectable on any deploy, out of the box |
| **Client themes** | *anything else mounted here* | client-specific theme repos, mounted per deployment (symlinks) |

The sixth theme is `default` — the base ADS look itself. It lives in
`../core/themes/default` and is what you get when no theme is set (or when
a theme name doesn't resolve).

## Try one right now

Open any viewer and add `?theme=` to the URL:

```
http://localhost:4200/mapa/mantine?theme=red
```

Nothing is saved — remove the parameter and the viewer is back to normal.
To set a theme for real, see [03-applying-a-theme.md](03-applying-a-theme.md).

## The shipped palette

| name | label | brand colour | font | notes |
|---|---|---|---|---|
| `default` | ADS (default) | `#1A65FA` blue | Noto Sans | the base — full ADS adherence |
| `lime` | Lime green | `#9EC222` | Saira | bright brand; controls darken for contrast |
| `cyan` | Cyan blue | `#37B2DF` | Saira | bright brand; controls darken for contrast |
| `red` | Red | `#C62828` | Noto Sans | colour-only re-brand |
| `dark-green` | Dark green | `#0E7A46` | Noto Sans | colour-only re-brand |
| `brown` | Light brown | `#B08968` | Noto Sans | warm; controls darken for contrast |

A live side-by-side preview of all six — swatches, contrast ratios, the
works — is on the demo pages: `/demo-ext/theme`.

## The docs

Read in order if you're new; jump straight to 03 or 04 if you just need to
do something.

1. **[01-the-primereact-era.md](01-the-primereact-era.md)** — how theme
   injection used to work before the Mantine migration, and why it changed.
   Context for anyone maintaining an old theme.
2. **[02-how-theming-works.md](02-how-theming-works.md)** — how a theme
   works now, and exactly **what a theme can and cannot change** (colours,
   CSS, fonts, sizes).
3. **[03-applying-a-theme.md](03-applying-a-theme.md)** — switching a
   viewer or a whole site onto a theme, through the backoffice or config.
4. **[04-creating-a-theme.md](04-creating-a-theme.md)** — building a new
   theme step by step, with the contrast pitfalls spelled out.

The deep ADS-adherence spec (AA gates, per-preset rationale, the formal
contract) lives with the platform docs:
`references/projects/client/migration2/ads-adherence-restrictions/06-theme-support.md`.
