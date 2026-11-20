# Timeline

Temporal navigation for WMS and WMTS layers. Adapted from
[Pedro Venancio's enhanced component](https://github.com/PedroVenancio/ScalarGIS.Timeline.Component)
(commit `71ec245`) to the current Mantine client.

```json
{
  "id": "timeline",
  "type": "Timeline",
  "title": "Temporal layers",
  "target": "map_controls_bottom_center",
  "config_json": {
    "datasource": { "layer_ids": ["temperature", "wind"] },
    "selectedIndex": "last",
    "refreshInterval": 600,
    "capabilitiesTimeout": 10,
    "loop": true,
    "speed": 1,
    "displayFormat": "{yyyy}-{mm}-{dd} {h}:{m}:{s}",
    "stepOptions": [
      { "label": "1 hour", "value": "PT1H" },
      { "label": "1 day", "value": "P1D" }
    ]
  }
}
```

The layer IDs must exist in the viewer. WMS uses `layers`, WMTS uses `layer`.
`dimension_name` on the layer overrides `config_json.dimension.name`, otherwise
the component looks for `time`. A layer's `dimensions` array can supply values
directly, e.g. `{ "name": "time", "values": "2024-01-01/2024-01-10/P1D" }`.
Otherwise the component requests GetCapabilities through the existing proxy.

## Navigation

- All controlled layers receive the same selected timestamp. The available dates
  are the union of their ranges and lists. Ranges stay compact in memory.
- WMS 1.1.1 Extent, WMS 1.3.0 Dimension, nested/inherited dimensions, namespaced
  WMTS dimensions, irregular lists and multiple ranges are supported.
- `selectedIndex`: `first`, `last`, `now`, or a one-based integer. Without it,
  `value` selects a reference date; otherwise the most recent date is used.
- `value`: `today`, `tomorrow`, `yesterday`, `now`, a signed ISO duration, or an ISO date.
- Legacy `interval`, `steps` and `delta` constrain the available range. The old
  `datasource.layer_id`, `extra_layer_ids`, and inline `datasource.layer` remain supported.
- `stepOptions` controls playback/manual increments. Calendar months use calendar
  arithmetic; service requests and step alignment remain in UTC. The date/time input
  and formatted label use the browser local timezone, including DST. Nonexistent
  spring clock times are rejected; an unchanged ambiguous autumn time preserves
  its selected occurrence. A newly entered ambiguous time uses the earlier occurrence.
- A selected step advances continuously between the global minimum and maximum,
  even where only daily forecasts are advertised. Capability refresh preserves
  the selected instant. Without a step, navigation follows the advertised dates.
  WMTS preserves the dimension key's case.
- The slider previews while dragging and applies TIME on release. Buttons apply immediately. Date input commits on Enter or blur, allowing
  incomplete native date segments while typing; Escape restores the applied date. Playback includes the last frame, supports looping,
  and stops when no controlled layer is checked.

Layers with different time grids may reject a shared timestamp. Choose compatible
grids or services that support nearest-value selection; this component does not
silently send a different time to each layer. Only layers with explicitly configured `dimensions` are made transparent outside
that coverage; discovered capabilities do not hide layers. TIME is applied even
when explicit coverage hides a layer, and its opacity is restored on return.

## Refresh and visibility

`refreshInterval` is in seconds; zero/omitted disables refresh. `capabilitiesTimeout`
defaults to 10 seconds and covers reading the response body too. Refresh preserves
the current date when possible and retains the last successful extent during a
temporary failure. Outstanding requests are cancelled on configuration changes
and unmount. Predefined dimensions are not fetched from the server.

The widget expands when any controlled layer becomes checked and collapses when
all become unchecked. `hideLayerOnCollapse` additionally toggles their checked
state when the header is clicked. `showLegend` displays legends for checked layers.
Layer references are resolved again after TOC reorder.

## Queries and printing

WMTS GetFeatureInfo copies the current dimensions from the OpenLayers source.
The free-printing request appends WMS TIME after the existing authentication field,
and URL-encodes each layer descriptor. The corresponding server change reads this
optional field and forwards it using the existing `url_params` mechanism.
Older requests without TIME remain valid. WMTS printing and ArcGIS time semantics
are not added by this change.

## Verification

Run the workspace typecheck, lint, test, viewer build and backoffice build targets.
Focused tests cover calendar arithmetic, range gaps, irregular lists, legacy
filters, WMS/WMTS capabilities and actual OpenLayers WMTS source dimensions.
Use a viewer with two temporal layers to check navigation, visibility, playback,
TOC reorder and requests in the browser before publishing.

Additional configurations are in `src/config.example.json`.

The compact widget sizes to its content (minimum 274px within the viewport),
uses theme colours, and keeps capability warnings
in an expandable disclosure. Each refresh shares a single capabilities response
per service URL across its layers. This reduces duplicate requests, but does not
bypass service authentication or guarantee that every layer advertises time.

The active step controls the native picker: daily or longer steps show only the
date; shorter steps show local hours and minutes, without seconds. The optional
formatted label continues to follow displayFormat.

For selectedIndex now, the initial time is bounded by now and the global maximum
before flooring to the selected step. Future-only coverage uses the first aligned
instant in range; if no aligned instant exists, its exact start is used. Manual
datetime input is bounded but is not rounded to the navigation step.

When opened with no controlled layer visible, the widget lists the configured layer titles in a keyboard-focusable scrollable region (96px maximum height).

## Widget visibility

The sidebar clock toggles only the widget presentation. It does not unmount the
Timeline, change checked layers, switch the sidebar panel or stop playback.
Runtime visibility is separate from configuration and resets when the map loads.
Set `defaultVisible` inside each Timeline component’s `config_json`: omitted or
true shows the widget initially; false hides it. The sidebar clock can toggle
each instance independently. This is edited in the normal JSON configuration;
there is no dedicated backoffice switch. The former map-level
`timeline_default_visible` setting is no longer read. No notification or automatic reveal is added.
Collapsing the panel with its header pauses playback. The optional
`hideLayerOnCollapse` also unchecks the controlled layers.

Editing the date pauses playback. Invalid or incomplete input is restored on
blur; valid input is bounded to coverage and converted from local time to UTC.
