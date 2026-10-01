# ScalarGIS Client

React frontend (Nx monorepo) — public **Viewer** (map viewer, port 4200) and admin **Backoffice** (port 4201).

> **Setup order:** the server must be running before the client dev server can work. → [scalargis-server README](../scalargis-server/README.md)

---

## Prerequisites

| | Version | Notes |
|---|---|---|
| Node.js | 24 (Vite 7 needs 20.19+ or 22.12+) | Use [NVM for Windows](https://github.com/coreybutler/nvm-windows): `nvm install 24` then `nvm use 24` |
| scalargis-server | running | Default: `http://localhost:5000` |

Clone this repo next to `scalargis-server`. The build writes into `../scalargis-server`.

---

## Windows Development

```powershell
git clone <scalargis-client-repo-url> scalargis-client
cd scalargis-client
npm install

npx nx serve viewer       # http://localhost:4200/mapa/demo
npx nx serve backoffice   # http://localhost:4201/backoffice
```

Both apps ask for port 4200. The app that starts second gets the next free port, 4201.

npm 11 refuses `npm ci` on the current lock file (two optional `@emnapi` entries are missing). Use `npm install`, then
`git restore package-lock.json`. npm 11 also skips some install scripts. The apps serve without them. The Cypress e2e
tests need `npm approve-scripts cypress`.

The dev server proxies `/api`, `/proxy`, `/spatial_toolbox`, and in the viewer also `/file`, to `http://localhost:5000`.

**Custom backend URL:**
```powershell
$env:VITE_APP_HOST_DEV = "http://192.0.2.10:5000"
npx nx serve viewer
```

---

## Build & Deploy to Server

Builds the frontend and copies the output into the server's static folder (no separate frontend server needed in production):

```powershell
npx nx run viewer:build-deploy-server
npx nx run backoffice:build-deploy-server
```

Output lands at `../scalargis-server/scalargis/app/static/viewer/` and `.../backoffice/`.
Access via the server: `http://localhost:5000/mapa/demo` and `http://localhost:5000/backoffice`.

---

## Components (Frontend Plugins)

Components extend the viewer and backoffice with custom UI, routes, and state. Put each one in the app's `components/` folder.
Folder names are case-sensitive. Git ignores the contents of these folders.

| App | Folder |
|---|---|
| Viewer | `apps/viewer/src/app/components/<Name>` |
| Backoffice | `apps/backoffice/src/app/components/<Name>` (only components with a `Manager` export) |

A plain `git clone` into the folder works. A symbolic link to a checkout elsewhere also works. Windows creates symbolic
links with no administrator rights when Developer Mode is on (Settings > System > For developers). Both Vite configs
set `resolve.preserveSymlinks: true`, so linked components resolve.

After you add a component, restart the dev server. nx does not see changes inside a linked component, so build with
`--skip-nx-cache`.

---

## Custom Proxy Routes

For extension-specific API paths, create `apps/viewer/user.proxy.config.json` or `apps/backoffice/user.proxy.config.json` (not committed):

```json
{
  "/my_extension": { "target": "{{proxyUrl}}/my_extension", "changeOrigin": true, "rewriteFrom": "^/my_extension" }
}
```

`{{proxyUrl}}` resolves to `VITE_APP_HOST_DEV` plus `VITE_APP_BASE_URL` (`http://localhost:5000` by default). `{{hostDev}}`
and `{{baseUrl}}` also work. Restart the dev server after a change.

---

## Environment Variables

| Variable | Default | Description |
|---|---|---|
| `VITE_APP_HOST_DEV` | `http://localhost:5000` | Backend URL for dev proxy |
| `VITE_APP_BASE_URL` | `""` | Path prefix of the backend, added to the proxy target |
| `BASE` | *(none)* | Vite base path for production builds |
| `SOURCEMAP` | `false` | Set `"true"` to enable source maps |

## Verify a change

```powershell
npx nx run-many -t typecheck --all
npx nx run-many -t lint --all
npx nx run-many -t test --all
npx nx run viewer:build
npx nx run backoffice:build
```
