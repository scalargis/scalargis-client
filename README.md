# ScalarGIS Client

React frontend (Nx monorepo) — public **Viewer** (map viewer, port 4200) and admin **Backoffice** (port 4201).

> **Setup order:** the server must be running before the client dev server can work. → [scalargis-server README](../scalargis-server/README.md)

---

## Prerequisites

| | Version | Notes |
|---|---|---|
| Node.js | 20.19+ or 22.12+ | Use [NVM for Windows](https://github.com/coreybutler/nvm-windows): `nvm install 24` then `nvm use 24` |
| scalargis-server | running | Default: `http://localhost:5000` |

---

## Windows Development

```powershell
git clone <scalargis-client-repo-url> scalargis-client
cd scalargis-client
npm install

npx nx serve viewer       # http://localhost:4200
npx nx serve backoffice   # http://localhost:4201
```

The dev server proxies `/api`, `/proxy`, and `/spatial_toolbox` to `http://localhost:5000` automatically.

**Custom backend URL:**
```powershell
$env:VITE_APP_HOST_DEV = "http://192.168.1.100:5000"
npx nx serve viewer
```

---

## Build & Deploy to Server

Builds the frontend and copies output directly into the server's static folder (no separate frontend server needed in production):

```powershell
npx nx run viewer:build-deploy-server
npx nx run backoffice:build-deploy-server
```

Output lands at `../scalargis-server/scalargis/app/static/viewer/` and `.../backoffice/`.  
Access via the server: `http://localhost:5000/mapa/demo` and `http://localhost:5000/backoffice`.

---

## Components (Frontend Plugins)

Components extend the viewer and backoffice with custom UI, routes, and state. Clone directly into the app's `components/` folder — **folder names are case-sensitive**.

**Viewer** (`apps/viewer/src/app/components`):
```powershell
git clone <component-url> ComponentName
git clone <component-url> AnotherComponent
```

**Backoffice** (`apps/backoffice/src/app/components`, only components with a `Manager` export):
```powershell
git clone <component-url> ComponentName
```

After adding components, rebuild and redeploy to the server. Component repos are on GitLab — contact maintainers for access.

> **Windows symlinks:** if using `link_module.ps1` instead of direct cloning, enable **Developer Mode** (Settings → For developers) for symlinks without admin privileges.

---

## Custom Proxy Routes

For extension-specific API paths (e.g. `/snic_cart`, `/mapaspt`), create `apps/viewer/user.proxy.config.json` (not committed):

```json
{
  "/snic_cart": { "target": "{{proxyUrl}}/snic_cart", "changeOrigin": true, "rewriteFrom": "^/snic_cart" },
  "/mapaspt":   { "target": "{{proxyUrl}}/mapaspt",   "changeOrigin": true, "rewriteFrom": "^/mapaspt" }
}
```

`{{proxyUrl}}` resolves to the backend URL (`http://localhost:5000` by default).

---

## Environment Variables

| Variable | Default | Description |
|---|---|---|
| `VITE_APP_HOST_DEV` | `http://localhost:5000` | Backend URL for dev proxy |
| `VITE_APP_BASE_URL` | `""` | Base URL prefix for backend proxy |
| `BASE` | *(none)* | Vite base path for production builds |
| `SOURCEMAP` | `false` | Set `"true"` to enable source maps |
