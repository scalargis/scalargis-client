/// <reference types='vitest' />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { nxViteTsPaths } from '@nx/vite/plugins/nx-tsconfig-paths.plugin';
import { nxCopyAssetsPlugin } from '@nx/vite/plugins/nx-copy-assets.plugin';

export default defineConfig({
  root: __dirname,
  cacheDir: '../../node_modules/.vite/apps/viewer',
  server: {
    port: 4200,
    host: 'localhost',
    proxy: {
      '/api': {
        target: 'http://localhost:5000/geoportal_dev/api',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
      "/proxy": {
        target: 'http://localhost:5000/geoportal_dev/proxy',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/proxy/, ''),
      },

      '/scalar_event': {
        target: 'http://localhost:5000/geoportal_dev/scalar_event',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/scalar_event/, ''),
      },

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
  },
  resolve: {
    alias: {
      'stream': 'stream-browserify',
      'timers': 'timers-browserify'
    },
    preserveSymlinks: true
  }
});
