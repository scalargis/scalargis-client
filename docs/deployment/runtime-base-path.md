# Runtime base path (client)

One build serves any URL prefix. A reverse proxy in front of the app sets the prefix per
request. The same static files serve the root install and a sub-path install. No rebuild.

Example: the same build serves `https://maps.example.org/` and `https://maps.example.org/gis`.

## The three asset surfaces

The client references its assets in three places. All three must follow the runtime prefix.

| Surface | Example | How it follows the prefix |
|---|---|---|
| Entry tags in `index.html` | the entry `<script>`, `modulepreload`, entry CSS `<link>` | the server prefixes them when it serves the page (see the server doc) |
| JS chunks, dynamic imports, workers | `import()` of a lazy chunk, a `new Worker(...)` | `window.__sgAsset(...)`, which reads the runtime prefix |
| CSS `url()` (fonts, sprites) | `url(./saira-400.woff2)` in a bundled CSS file | relative URL, inherits the prefix from the CSS file's own URL |

## What the build does

`apps/{viewer,backoffice}/vite.config.ts` keeps `base` fixed at `/static/<app>/` and adds an
`experimental.renderBuiltUrl` block:

```ts
experimental: {
  renderBuiltUrl(filename, { hostType }) {
    if (hostType === 'js') return { runtime: `window.__sgAsset(${JSON.stringify(filename)})` };
    return { relative: true };
  },
},
```

- `hostType === 'js'` covers chunks, dynamic imports, and workers. Vite emits
  `window.__sgAsset("assets/x.js")` in place of a fixed URL. The helper reads the prefix at
  load time.
- The `else` branch (`{ relative: true }`) covers CSS `url()`. A relative `./y.woff` resolves
  against the CSS file's own URL, which already carries the prefix.

## The runtime helper

`apps/{viewer,backoffice}/index.html` defines the helper in the inline env script, beside the
globals the server injects:

```js
window.__sgAsset = function (f) {
  return (window.SCALARGIS_ROOT_PATH || '') + '/static/<app>/' + f;
};
```

`<app>` is `viewer` or `backoffice`. `window.SCALARGIS_ROOT_PATH` is the prefix. The server
replaces the `__SCALARGIS_ROOT_PATH__` token with the request prefix when it serves the page.
An empty prefix (root install) gives `/static/<app>/...`, the same URLs as before.

## Build inputs

`apps/{viewer,backoffice}/.env.build-deploy-server` (and each deploy machine's
`configs/.env.{viewer,backoffice}`):

```
BASE="/static/<app>/"
VITE_APP_BASE_URL=""
```

- `BASE` is the fixed asset base. Keep the leading and trailing `/`.
- `VITE_APP_BASE_URL=""` lets the server-injected value drive the router basename. A non-empty
  value here would pin the basename and break a sub-path install.

## How the router basename follows the prefix

`getAppBaseUrl()` reads `window.SCALARGIS_ROOT_PATH_BASE_URL`, which the server injects. When the
install leaves `SCALARGIS_BASE_URL` empty, the server writes the request prefix into that global,
so the React Router basename follows the proxy. See the server doc for the server side.

## Verify

Build one app and read the output:

```powershell
$env:BASE="/static/viewer/"; $env:VITE_APP_BASE_URL=""
npx nx build viewer --skip-nx-cache
```

- `dist/apps/viewer/index.html` entry tags point at `/static/viewer/assets/...`.
- The main chunk holds `window.__sgAsset(...)` calls.
- Bundled CSS `url()` entries are relative (`url(./x.woff2)`).

The build shows the mechanism. To confirm a real prefix end to end (chunks, CSS fonts, and a
worker all 200 under the prefix), drive the app behind a proxy that sets the prefix header. See
the server doc for the proxy configuration.
