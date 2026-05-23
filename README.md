# ScalarGIS Client

Frontend for the ScalarGIS platform. Built as an Nx monorepo with two React applications — a public **Viewer** (map viewer) and an admin **Backoffice** — plus shared libraries and a plugin-based component system.

## Tech Stack

| Category | Key Packages |
| --- | --- |
| Framework | React 19, React Router 7, Redux 5 |
| UI | PrimeReact 10, PrimeFlex 4, PrimeIcons 7, Font Awesome 7 |
| Mapping / GIS | OpenLayers 10, proj4, GeoTIFF 3, Google Maps JS API Loader 2 |
| Forms | JSON Forms 3.7, React Hook Form 7, AJV 8 |
| i18n | i18next 26, react-i18next 17 |
| Editors | Ace Editor 14, Chart.js 4, Quill 2 |
| Build | Nx 22, Vite 7, TypeScript 5.9, SWC |
| Test | Vitest 4, Cypress 15, Testing Library |
| Lint / Format | ESLint 9, Prettier 3 |

## Prerequisites

- **Node.js 24** (currently used: v24.11.0). Vite 7 requires `^20.19.0 || >=22.12.0`.
- **npm** (ships with Node).
- [NVM for Windows](https://github.com/coreybutler/nvm-windows) is recommended to manage Node versions.
- A running **scalargis-server** instance for API proxying during development (default: `http://localhost:5000`).

### Setting up Node with NVM (Windows)

```powershell
# Install a Node version
nvm install 24

# Use it
nvm use 24

# Verify
node --version
npm --version
```

## Getting Started

```powershell
# Install dependencies
npm install

# Start the viewer dev server (http://localhost:4200)
npx nx serve viewer

# Start the backoffice dev server (http://localhost:4201)
npx nx serve backoffice
```

The dev server proxies API requests (`/api`, `/proxy`, `/spatial_toolbox`) to the backend at `http://localhost:5000` by default. Override this with the `VITE_APP_HOST_DEV` environment variable:

```powershell
$env:VITE_APP_HOST_DEV = "http://localhost:5000"
npx nx serve viewer
```

### Custom Proxy Routes

Create a `apps/viewer/user.proxy.config.json` file (not committed) to add project-specific proxy routes. This is useful when working with backend extensions that expose their own API paths (e.g., `/snic_cart`).

## Project Structure

```
scalargis-client/
  package.json              Workspace root dependencies
  nx.json                   Nx workspace configuration
  apps/
    viewer/                 Public-facing map viewer (port 4200)
      vite.config.ts        Vite config with API proxy and symlink support
      project.json          Nx project config with build-deploy-server target
      src/app/
        app.jsx             Startup — loads custom components via SITE_CONFIG
        Core.jsx            Viewer shell — mounts per-viewer config_json.components[]
        components/         Symlinks to component sources
    backoffice/             Admin application (port 4201)
      src/app/
        components/         Symlinks to component sources (subset)
    viewer-e2e/             Cypress E2E tests for viewer
    backoffice-e2e/         Cypress E2E tests for backoffice
  libs/
    components/             Shared component library
    jsonforms-primereact-renderers/   Custom JSON Forms renderers for PrimeReact
```

## Build

### Development Build

```powershell
npx nx build viewer
npx nx build backoffice
```

Output goes to `dist/apps/viewer` and `dist/apps/backoffice`.

### Deploy to Server

Builds the apps and copies the output directly into the scalargis-server static folder, ready for production serving:

```powershell
npx nx run viewer:build-deploy-server
npx nx run backoffice:build-deploy-server
```

Output goes to `../scalargis-server/scalargis/app/static/viewer` and `.../backoffice`.

### Environment Variables

| Variable | Default | Description |
| --- | --- |--- |
| `VITE_APP_HOST_DEV` | `http://localhost:5000` | Backend server URL for dev proxy |
| `VITE_APP_BASE_URL` | `""` | Base URL prefix for backend proxy |
| `BASE` | (none) | Vite base path for production builds |
| `SOURCEMAP` | `false` | Set to `"true"` to enable source maps in builds |

## Testing & Quality

```powershell
# Type checking
npx nx run-many -t typecheck

# Linting
npx nx run-many -t lint

# Unit tests
npx nx run-many -t test

# E2E tests
npx nx run-many -t e2e

# Run all checks
npx nx run-many -t typecheck,lint,test
```

## Components (Frontend Plugins)

Components are the plugin system for extending the viewer and backoffice. Each component is a self-contained module that can provide UI elements, routes, Redux state, translations, and more.

### How Components Work

Components live outside this repository as **git submodules** (or separate repos). They are made available to the apps via **symlinks** in each app's `components/` directory. Vite's `resolve.preserveSymlinks: true` setting ensures these resolve correctly during development and builds.

There are two registration paths for a component:

1. **Viewer record** (`config_json.components[]`) — the component's `default` export is mounted at a target slot (topbar, main menu, widget). Handled by `Core.jsx`.
2. **Site config** (`SITE_CONFIG.customComponents[]`) — the component is dynamically imported and its `getPageRoutes()` function registers React Router routes. Handled by `app.jsx`.

A component that uses both paths must appear in both arrays.

### Component Export Contract

All exports are optional. A component's `src/Main.jsx` (or `.tsx`) can export:

| Export | Purpose |
| --- | --- |
| `default` | React component rendered in viewer slots |
| `actions` | Redux action creators |
| `reducers` | Redux reducers to register |
| `translations` | i18next translation resources |
| `widgets` | Widget definitions |
| `MainMenu` | Main menu entry component |
| `Manager` | Backoffice management panel |
| `getPageRoutes` | Function returning React Router route definitions |

### Adding a New Component

1. **Create the component** — write `src/Main.jsx` in a new directory (e.g., `MyComponent/src/Main.jsx`).
2. **Create symlinks** — symlink the component directory into the app's `components/` folder:
   ```powershell
   # For viewer
   New-Item -ItemType SymbolicLink `
     -Path "apps\viewer\src\app\components\MyComponent" `
     -Target "..\..\..\..\..\..\..\components\MyComponent"

   # For backoffice (if the component has a Manager export)
   New-Item -ItemType SymbolicLink `
     -Path "apps\backoffice\src\app\components\MyComponent" `
     -Target "..\..\..\..\..\..\..\components\MyComponent"
   ```
3. **Register in viewer DB record** — add to the viewer's `config_json.components[]` if it renders in-viewer.
4. **Register in site config** — add the folder name to `SITE_CONFIG.customComponents[]` if it exports `getPageRoutes`.
5. **Create backend extension** (if needed) — add a matching extension in the scalargis-server.

### Obtaining Components and Extensions

Components and backend extensions are maintained in separate Git repositories. Contact the project maintainers to obtain access to the relevant GitLab/GitHub repositories for:

- **Frontend components** (e.g., AuthAMA, KeycloakSSO, MapasPT, CatalogoSNIG)
- **Backend extensions** (e.g., authama, keycloaksso, mapaspt)

Component folder names are **case-sensitive** (e.g., `AuthAMA`, `KeycloakSSO`, `MapasPT`).

## Vite Configuration Notes

- `resolve.preserveSymlinks: true` — required for component symlinks to resolve correctly.
- Browser polyfills for `stream`, `timers`, and `util` are aliased in `resolve.alias` (needed by the xml2js transitive dependency chain).
- The `user.proxy.config.json` file allows adding custom proxy routes without modifying `vite.config.ts`.

## Working with the Monorepo

### Useful Nx Commands

```powershell
# Visualize the project graph
npx nx graph

# See all targets for a project
npx nx show project viewer

# List installed Nx plugins
npx nx list

# Run a specific target for a specific project
npx nx run viewer:build
```

### Submodule Notes

The `components/` directories in the apps contain **symlinks** pointing to git submodules in the parent repository. When working with submodules:

- Run `git` commands **inside the submodule directory**, not from the parent repo.
- `git checkout -- components/SomeComponent` from the parent does nothing to the submodule's working tree.
- Untracked files inside a submodule need explicit removal (`Remove-Item` / `git clean`).
