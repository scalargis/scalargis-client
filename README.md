# ScalarGIS Client

Frontend for the ScalarGIS platform. Built as an Nx monorepo with two React applications -- a public **Viewer** (map viewer) and an admin **Backoffice** -- plus shared libraries and a plugin-based component system.

## Two-Repo Setup

ScalarGIS is split into two repositories that work together:

| Repo | Role | README |
| --- | --- | --- |
| **scalargis-server** | Python backend -- API, database, serves production builds | [scalargis-server README](../scalargis-server/README.md) |
| **scalargis-client** (this repo) | React frontend -- viewer and backoffice apps | You are here |

**Setup order:** Install and run the server first (see the server README), then come back here to set up the client. The frontend dev server proxies all API calls to the backend, so **the server must be running before the client dev server can work**.

## Prerequisites

| Requirement | Version | Notes |
| --- | --- | --- |
| **Node.js** | 20.11+ or 22.12+ or 24+ | Vite 7 requires `^20.19.0 \|\| >=22.12.0` |
| **npm** | (ships with Node) | |
| **scalargis-server** | running locally | Default: `http://localhost:5000` |

### Installing Node with NVM (recommended)

[NVM for Windows](https://github.com/coreybutler/nvm-windows) lets you switch between Node versions easily:

```powershell
# Install a version
nvm install 24

# Activate it
nvm use 24

# Verify
node --version
npm --version
```

## Setup

### 1. Clone the repository

```powershell
git clone <scalargis-client-repo-url> scalargis-client
cd scalargis-client
```

> The client repository is hosted on GitLab. Contact the project maintainers for access.

### 2. Install dependencies

```powershell
npm install
```

### 3. Start the backend

Make sure the scalargis-server is running on `http://localhost:5000` (see the [server README](../scalargis-server/README.md)).

### 4. Start the dev server

```powershell
# Viewer (http://localhost:4200)
npx nx serve viewer

# Backoffice (http://localhost:4201)
npx nx serve backoffice
```

The dev server proxies `/api`, `/proxy`, and `/spatial_toolbox` requests to the backend automatically.

### Verify it works

| URL | Description |
| --- | --- |
| http://localhost:4200 | Viewer dev server (hot-reload) |
| http://localhost:4201 | Backoffice dev server (hot-reload) |

> The viewer shows the same content as `http://localhost:5000/mapa/demo` but with hot-reload. The backoffice proxies to the same backend as `http://localhost:5000/backoffice`.

## Build & Deploy to Server

Build the frontend and copy the output directly into the scalargis-server's static folder (for production-style serving without a separate frontend server):

```powershell
npx nx run viewer:build-deploy-server
npx nx run backoffice:build-deploy-server
```

Output goes to:
- `../scalargis-server/scalargis/app/static/viewer/`
- `../scalargis-server/scalargis/app/static/backoffice/`

After deploying, access the apps directly from the backend:
- http://localhost:5000/mapa/demo (viewer)
- http://localhost:5000/backoffice (backoffice)

### Development build (local output only)

```powershell
npx nx build viewer       # -> dist/apps/viewer
npx nx build backoffice   # -> dist/apps/backoffice
```

## Components (Frontend Plugins)

Components extend the viewer and backoffice with custom UI, routes, and state. They live in separate Git repositories and are linked into the apps via **symlinks**.

### Installing components

Clone each component repository into the app's `components/` directory. **Folder names are case-sensitive.**

**Viewer components:**

```powershell
cd apps/viewer/src/app/components

git clone <authama-component-url> AuthAMA
git clone <keycloaksso-component-url> KeycloakSSO
git clone <mapaspt-component-url> MapasPT
git clone <catalogosnig-component-url> CatalogoSNIG
```

**Backoffice components** (only components with a `Manager` export):

```powershell
cd apps/backoffice/src/app/components

git clone <mapaspt-component-url> MapasPT
```

> Component repositories are hosted on GitLab. Contact the project maintainers for access.

### Using link_module.ps1 (alternative)

Instead of manually cloning into the apps, you can keep component sources in a central `components/` directory and use the `link_module.ps1` script (at the repo root) to create symlinks:

```powershell
# Run from the repo root
.\link_module.ps1
```

The script will scan for target directories and prompt you to select the link type (Components, Themes, or Extensions) and the source folder to link.

> **Windows Developer Mode** must be enabled for symlinks to work without admin privileges. Enable it in **Settings > For developers > Developer Mode**.

### After adding components

Whenever you add a new component or make code changes, rebuild and deploy to the server:

```powershell
npx nx run viewer:build-deploy-server
npx nx run backoffice:build-deploy-server
```

In dev mode (`npx nx serve viewer`), Vite picks up changes automatically via hot-reload.

## Custom Proxy Routes

For extensions that expose their own API paths (e.g., `/snic_cart`, `/mapaspt`), create a `apps/viewer/user.proxy.config.json` file:

```json
{
  "/snic_cart": {
    "target": "{{proxyUrl}}/snic_cart",
    "changeOrigin": true,
    "rewriteFrom": "^/snic_cart"
  },
  "/mapaspt": {
    "target": "{{proxyUrl}}/mapaspt",
    "changeOrigin": true,
    "rewriteFrom": "^/mapaspt"
  }
}
```

The `{{proxyUrl}}` placeholder resolves to the backend URL (`http://localhost:5000` by default). This file is not committed to Git.

## Environment Variables

| Variable | Default | Description |
| --- | --- | --- |
| `VITE_APP_HOST_DEV` | `http://localhost:5000` | Backend server URL for dev proxy |
| `VITE_APP_BASE_URL` | `""` | Base URL prefix for backend proxy |
| `BASE` | (none) | Vite base path for production builds |
| `SOURCEMAP` | `false` | Set to `"true"` to enable source maps |

Override the backend URL:

```powershell
$env:VITE_APP_HOST_DEV = "http://192.168.1.100:5000"
npx nx serve viewer
```

## Project Structure

```
scalargis-client/
  package.json              Workspace root dependencies
  nx.json                   Nx workspace configuration
  apps/
    viewer/                 Public map viewer (port 4200)
      vite.config.ts        Vite config with proxy and symlink support
      project.json          Nx targets (build-deploy-server, etc.)
      user.proxy.config.json  Custom proxy routes (not committed)
      src/app/
        app.jsx             Startup - loads SITE_CONFIG.customComponents
        Core.jsx            Viewer shell - mounts config_json.components[]
        components/         Symlinks to component sources
    backoffice/             Admin application (port 4201)
      src/app/
        components/         Symlinks to component sources (subset)
  libs/
    components/             Shared component library
    jsonforms-primereact-renderers/   Custom JSON Forms renderers
```

## Testing & Quality

```powershell
# Type checking
npx nx run-many -t typecheck

# Linting
npx nx run-many -t lint

# Unit tests
npx nx run-many -t test

# All checks
npx nx run-many -t typecheck,lint,test
```

## Tech Stack

| Category | Key Packages |
| --- | --- |
| Framework | React 19, React Router 7, Redux 5 |
| UI | PrimeReact 10, PrimeFlex 4, PrimeIcons 7, Font Awesome 7 |
| Mapping | OpenLayers 10, proj4, GeoTIFF 3 |
| Build | Nx 22, Vite 7, TypeScript 5.9, SWC |
| Test | Vitest 4, Cypress 15, Testing Library |

## Useful Nx Commands

```powershell
npx nx graph                      # Visualize the project graph
npx nx show project viewer        # See all targets for a project
npx nx list                       # List installed Nx plugins
```

## Quick Start (TL;DR)

```powershell
# Prerequisites: Node 24+, scalargis-server running on :5000

# Clone & install
git clone <scalargis-client-repo-url> scalargis-client
cd scalargis-client
npm install

# Dev server
npx nx serve viewer       # http://localhost:4200
npx nx serve backoffice   # http://localhost:4201

# Build & deploy to server
npx nx run viewer:build-deploy-server
npx nx run backoffice:build-deploy-server
```
