/// <reference types='vitest' />
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { nxViteTsPaths } from '@nx/vite/plugins/nx-tsconfig-paths.plugin';
import { nxCopyAssetsPlugin } from '@nx/vite/plugins/nx-copy-assets.plugin';
import fs from 'fs';
import path from 'path';


const hostDev = process.env.VITE_APP_HOST_DEV || 'http://localhost:5000';
const baseUrl = process.env.VITE_APP_BASE_URL || '';
const proxyUrl = hostDev + baseUrl;

const sourcemap = process.env.SOURCEMAP === 'true' ? true : false;

const vendorChunks: [string, RegExp][] = [
  ['vendor-ol', /\/node_modules\/(ol|ol-mapbox-style|rbush|quickselect|earcut|pbf)\//],
  ['vendor-react', /\/node_modules\/(react|react-dom|scheduler|react-router|react-redux|redux|redux-thunk|use-sync-external-store)\//],
  ['vendor-mantine', /\/node_modules\/@mantine\//],
  ['vendor-jsts', /\/node_modules\/jsts\//],
];

/** Puts the big libraries in their own chunks, so an app change keeps them cached. */
function manualChunks(id: string) {
  const hit = vendorChunks.find(([, re]) => re.test(id));
  return hit ? hit[0] : undefined;
}

// Load user proxy config
function loadUserProxyConfig() {
  const userConfigPath = path.resolve(__dirname, 'user.proxy.config.json');
  if (fs.existsSync(userConfigPath)) {
    const proxyData = JSON.parse(fs.readFileSync(userConfigPath, 'utf-8'));
    const retVal = Object.fromEntries(
      Object.entries(proxyData).map(([context, cfg]: [string, any]) => {
        const target = cfg?.target ? cfg.target.replace("{{hostDev}}", hostDev).replace("{{baseUrl}}", baseUrl).replace("{{proxyUrl}}", proxyUrl) : cfg.target;
        return [
          context,
          {
            target: target,
            changeOrigin: cfg.changeOrigin ?? true,
            secure: cfg.secure ?? false,
            headers: cfg.headers,
            rewrite: (pathname: string) => {
              console.log(pathname);
              // Apply rules if any
              if (cfg?.rules?.length > 0) {
                for (const rule of cfg.rules) {
                  const regex = new RegExp(rule.when)
                  if (regex.test(pathname)) {
                    return pathname.replace(regex, rule.rewriteTo ?? "");
                  }
                }
              }
              // Apply rewriteFrom / rewriteTo if specified
              if (cfg.rewriteFrom) {
                return pathname.replace(new RegExp(cfg.rewriteFrom), cfg.rewriteTo ?? "");
              }
              // Default rewrite based on context
              return pathname.replace(new RegExp(`^${context}`), cfg.rewrite ?? "");
            }
          }
        ]
      })
    )
    return retVal;
  }
  return {};
}

export default defineConfig(() => {

  const userProxyRoutes = loadUserProxyConfig();

  return {
    root: __dirname,
    cacheDir: '../../node_modules/.vite/apps/viewer',
    base: process.env.BASE,
    // Asset URLs follow the runtime mount prefix. JS chunks, dynamic imports
    // and workers resolve through window.__sgAsset, which reads the prefix the
    // server injects into window.SCALARGIS_ROOT_PATH per request. CSS url() stays
    // relative, so it inherits the prefix from the .css file's own URL. An empty
    // prefix (root install) gives the same output as today.
    experimental: {
      renderBuiltUrl(filename: string, { hostType }: { hostType: 'js' | 'css' | 'html' }) {
        if (hostType === 'js') return { runtime: `window.__sgAsset(${JSON.stringify(filename)})` };
        return { relative: true };
      },
    },
    server: {
      port: 4200,
      host: 'localhost',
      proxy: {
        '/api': {
          target: proxyUrl + '/api',
          changeOrigin: true,
          rewrite: (pathname) => pathname.replace(/^\/api/, ''),
        },
        "/proxy": {
          target: proxyUrl + '/proxy',
          changeOrigin: true,
          rewrite: (pathname) => pathname.replace(/^\/proxy/, ''),
        },
        '/spatial_toolbox': {
          target: proxyUrl + '/spatial_toolbox',
          changeOrigin: true,
          rewrite: (pathname) => pathname.replace(/^\/spatial_toolbox/, ''),
        },
        // Generated files (print PDFs, exports) are served by the Flask /file
        // blueprint at the app root. In production the app is served from that
        // same origin, so only the dev server needs the hop.
        '/file': {
          target: proxyUrl + '/file',
          changeOrigin: true,
          rewrite: (pathname) => pathname.replace(/^\/file/, ''),
        },
        ...userProxyRoutes
      },
    },
    preview: {
      port: 4300,
      host: 'localhost',
    },
    plugins: [react(), nxViteTsPaths(), nxCopyAssetsPlugin(['*.md'])],
    worker: {
      format: 'es',
    },
    build: {
      outDir: '../../dist/apps/viewer',
      emptyOutDir: true,
      reportCompressedSize: true,
      commonjsOptions: {
        transformMixedEsModules: true,
      },
      rollupOptions: {
        output: { manualChunks },
      },
      sourcemap: sourcemap
    },
    test: {
      watch: false,
      globals: true,
      environment: 'jsdom',
      include: ['src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
      reporters: ['default'],
      coverage: {
        reportsDirectory: '../../coverage/apps/viewer',
        provider: 'v8',
      },
    },
    resolve: {
      alias: {
        'stream': 'stream-browserify',
        'timers': 'timers-browserify',
        'util': 'util/'
      },
      preserveSymlinks: true
    }
  }
});
