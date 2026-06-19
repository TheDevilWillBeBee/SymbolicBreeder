import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'node:path';

export default defineConfig({
  plugins: [react()],
  worker: {
    format: 'es',
  },
  // Multi-page setup: the main app at /index.html and the test-suite UI at /sandbox.html
  // share the same React tree, hooks, store, and components — only their entry
  // (root component) differs. Both are emitted on `vite build`.
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        sandbox: resolve(__dirname, 'sandbox.html'),
      },
    },
  },
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
    },
  },
});
