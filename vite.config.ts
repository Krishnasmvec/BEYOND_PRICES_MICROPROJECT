import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// No `define`-injected API keys here on purpose: the Gemini key now lives
// only in server/.env, read by the Express backend, and is never bundled
// into client JS. The dev server proxies /api to that backend so client
// code can call relative fetch('/api/...') URLs in both dev and prod.
export default defineConfig({
  server: {
    port: 3000,
    host: '0.0.0.0',
    proxy: {
      '/api': {
        target: 'http://localhost:8787',
        changeOrigin: true,
      },
    },
  },
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    }
  }
});
