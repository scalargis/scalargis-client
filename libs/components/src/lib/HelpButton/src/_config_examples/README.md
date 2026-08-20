# HelpButton config examples

One ready HelpButton record per file. Copy a record into a viewer's
`config_json.components[]` and edit it. Each file keeps a `_description` key; the component
ignores unknown keys, so you can leave it or drop it.

HelpButton shows the Ajuda control. When the viewer turns the tour on, the control becomes a
two-item launcher Menu: the full manual and the guided tour.

## Files

| File | Mode |
|---|---|
| `01-topbar-external-link.json` | Topbar icon, opens a localized help page in a new tab |
| `02-topbar-external-bare-link.json` | Same, rendered as a bare link (no text label) |
| `03-topbar-popup-fetched-html.json` | Topbar icon, opens a Dialog with fetched HTML |
| `04-topbar-popup-iframe.json` | Topbar icon, opens a Dialog with an iframe |
| `05-topbar-popup-inline-html.json` | Topbar icon, opens a Dialog with inline HTML |
| `06-mainmenu-button-popup.json` | Sidebar button, opens a Dialog |
| `07-mainmenu-panel-content.json` | Inline panel content (no button) |
| `08-topbar-with-guided-tour.json` | Topbar launcher plus the viewer-level tour flag |

## Record fields

| Field | Meaning |
|---|---|
| `id` | Record id. For `as` omitted on a mainmenu record, a click opens the menu with this id. |
| `type` | Always `HelpButton`. |
| `title` | Label and tooltip. A string, or an i18n object `{ "default": "...", "en": "...", "fr": "..." }`. Falls back to "Ajuda". |
| `target` | Slot: `topbar_right` (topbar icon), `mainmenu` (sidebar button), or a footer/map-control slot. |
| `as` | Manual behaviour: `popup` (Dialog), `external` (new tab), `panel` (inline content, no button), or omitted on a mainmenu record (plain button that opens its menu). |
| `children` | Reserved. Keep `[]`. |

## `config_json` fields

| Field | Meaning |
|---|---|
| `header` | Dialog or panel title. A string or an i18n object. Falls back to `title`. |
| `url` | Help URL. Supports `{lang}` and `{language}` placeholders, filled from the active locale. Fetched and inlined for `as: popup` (unless `iframe`), opened in a new tab for `as: external`. |
| `default_url` | URL used when the locale resolves to nothing. |
| `closeLabel` | Dialog close-button label. String or i18n object. Falls back to "Fechar". |
| `iframe` | Boolean. `as: popup` shows the URL in an `<iframe>` instead of fetching HTML. |
| `elementType` | `"link"` renders the external topbar control as a bare link. Any other value keeps the icon-plus-text button. |
| `html` | Inline HTML shown when there is no `url`, or when the fetch fails. String or i18n object. |

## Viewer-level context (not HelpButton config)

| Setting | Meaning |
|---|---|
| `config_json.help_url` | Viewer-wide fallback URL, used when a record has no `url` and no `default_url`. |
| `config_json.onboarding.enabled` | Turns the guided tour on for the viewer (strict opt-in). Set `{ "enabled": true }` and the HelpButton Menu adds the "Visita guiada" item, as long as a HelpButton is present and at least one tour step is enabled. Omit it, or set false, and only the manual shows. |

The tour launcher rides the real topbar icon and the sidebar button. It does not attach to
`as: panel` inline content, nor to the folded topbar menu on small screens.
