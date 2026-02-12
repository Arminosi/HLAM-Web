import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// Base path resolution:
//   - VITE_BASE_PATH env → GitHub Pages CI sets this to /<repo-name>/
//   - Fallback to '/' for local dev, Vercel, Netlify, Cloudflare Pages, etc.
const base = process.env.VITE_BASE_PATH || '/';

export default defineConfig({
  base,
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 3000,
  },
  build: {
    target: 'es2022',
  },
});
