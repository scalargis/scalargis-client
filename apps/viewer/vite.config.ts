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

// Load user proxy config
function loadUserProxyConfig() {
  const userConfigPath = path.resolve(__dirname, 'user.proxy.config.json');
  if (fs.existsSync(userConfigPath)) {
    const data = JSON.parse(fs.readFileSync(userConfigPath, 'utf-8'));

    const retVal = {};
    
    for (const key in data) {
      const elem = data[key];
      if (data[key]?.rewritePath) {
        retVal[key] = {
          target: elem.target,
          changeOrigin: elem.changeOrigin,
          rewrite: (path) => {
            let originalPath = elem.rewritePath[0];
            originalPath = originalPath.replace("{{hostDev}}", hostDev).replace("{{baseUrl}}", baseUrl).replace("{{proxyUrl}}", proxyUrl);
            return path.replace(originalPath, elem.rewritePath[1]);
          }
        }
      } else {
        retVal[key] = {
          ...elem
        }
      }
    };
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
    server: {
      port: 4200,
      host: 'localhost',
      proxy: {
        '/api': {
          target: proxyUrl + '/api',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api/, ''),
        },
        "/proxy": {
          target: proxyUrl + '/proxy',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/proxy/, ''),
        },
        '/spatial_toolbox': {
          target: proxyUrl + '/spatial_toolbox',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/spatial_toolbox/, ''),
        },
      
        ...userProxyRoutes

      },
    },
    preview: {
      port: 4300,
      host: 'localhost',
    },
    plugins: [react(), nxViteTsPaths(), nxCopyAssetsPlugin(['*.md'])],
    // Uncomment this if you are using workers.
    // worker: {
    //  plugins: [ nxViteTsPaths() ],
    // },
    build: {
      outDir: '../../dist/apps/viewer',
      emptyOutDir: true,
      reportCompressedSize: true,
      commonjsOptions: {
        transformMixedEsModules: true,
      },
      sourcemap: sourcemap
    },
    resolve: {
      alias: {
        'stream': 'stream-browserify',
        'timers': 'timers-browserify'
      },
      preserveSymlinks: true
    }
  }
});
