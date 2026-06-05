import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// GitHub Pages serves a project site under /<repo>/, so the prod build needs a
// matching base path for assets to resolve. Local dev/preview (and any root-host
// deploy) keep '/'. The deploy workflow sets GHPAGES=1.
const base = process.env.GHPAGES ? '/StarCadets/' : '/'

export default defineConfig({
  base,
  plugins: [react(), ],
  // node_modules is a symlink into /opt/baku-templates — keep Vite's dep
  // cache (default: node_modules/.vite) co-located with the project instead
  // of writing through the symlink into the template tree.
  cacheDir: './.vite',
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    host: '0.0.0.0',
    port: 3000,
  },
})
