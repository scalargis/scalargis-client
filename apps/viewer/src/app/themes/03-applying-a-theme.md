# 03 — Applying a theme

A theme is applied by **name** — the folder name in this directory
(`lime`, `cyan`, `red`, `dark-green`, `brown`, a client theme's name, or
`default`). There are four places the name can come from; later ones win:

| # | where | scope | wins over |
|---|---|---|---|
| 1 | `VITE_APP_DEFAULT_THEME` (build env) | whole build | — (it's the fallback) |
| 2 | `SITE_CONFIG.theme` | whole site, incl. splash/login pages | 1 |
| 3 | the viewer's `config_json.theme` | one viewer, while open | 1–2 |
| 4 | `?theme=<name>` on the URL | that browser tab, until removed | everything |

An unknown name falls back to `default` (and logs a console error). While
a viewer with its own theme is open, that theme wins; close it and the
site-level theme takes back over.

## Per viewer — through the backoffice

There is no dedicated theme picker field yet; the theme is one line in the
viewer's configuration JSON:

1. Open the viewer in the backoffice:
   `http://localhost:4201/backoffice/viewers/edit/<viewer_id>`
2. Go to the **Configuração** tab (the JSON editor).
3. Add the key at the **top level** of the JSON:

   ```json
   {
     "theme": "dark-green",
     "components": [ ... ],
     ...
   }
   ```

4. **Gravar**, then reload the viewer.

(Directly in the database, that's the `viewer` table's `config_json`
column — same key, same place.)

## Site-wide — through SITE_CONFIG

The site theme also covers the pages that exist *before* any viewer opens:
splash screen, `/login`, registration/password pages.

1. Open the parameters list:
   `http://localhost:4201/backoffice/settings/parameters`
   and edit the row with code **`SITE_CONFIG`**
   (`.../settings/parameters/edit/<id>`).
2. Add `"theme": "<name>"` at the top level of its JSON value and save.
3. Reload — site config is fetched at startup.

## Build default — `VITE_APP_DEFAULT_THEME`

Set it in the deploy's `.env` / environment at build time:

```
VITE_APP_DEFAULT_THEME=cyan
```

It's only the fallback for when neither SITE_CONFIG nor the viewer says
anything — useful for single-brand deploys where the DB shouldn't need to
carry the choice.

## Preview — `?theme=` on any viewer

```
http://localhost:4200/mapa/mantine?theme=brown
```

Overrides everything, persists nothing, needs no permissions. This is the
intended way to demo the palette to a client and to test a theme before
wiring it into config. The mantine test viewer (`/mapa/mantine`) with each
of the six names is the standard check.

## What about the backoffice app itself?

Themes are a **viewer** feature. The backoffice (`:4201`) always renders
the default ADS look — it has no ThemeSelector, and `SITE_CONFIG.theme`
does not affect it. (The plumbing in `@scalargis/ui` is app-agnostic, so
theming the backoffice would be small work — it just hasn't been a
requirement.)

## Not the same thing: per-viewer custom CSS

The viewer form's **UI tab** has a *Style* editor (`custom_style`) that
injects raw CSS when that one viewer loads. That's a per-viewer tweak
layer, not a theme — it doesn't switch with `?theme=` and applies on top
of whatever theme is active. See the note at the end of
[02](02-how-theming-works.md).
