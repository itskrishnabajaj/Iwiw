import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import path from 'node:path'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      // 'prompt' (not 'autoUpdate'): a new service worker WAITS instead of
      // activating mid-session. The app detects it, tells the user, and only
      // skip-waits + reloads on explicit action — so a redeploy can never swap
      // assets under a running tab (the stale-bundle / ChunkLoadError class of bug).
      registerType: 'prompt',
      // We register + drive the SW ourselves (src/lib/pwa/pwa.ts) so the update
      // prompt and "Check for Updates" share one registration. Disable the
      // plugin's auto-injected registration to avoid a duplicate.
      injectRegister: false,
      includeAssets: ['favicon.svg'],
      manifest: {
        name: 'Personal OS — Command Center',
        short_name: 'Personal OS',
        description: 'The command center for your entire self-improvement journey.',
        theme_color: '#07080d',
        background_color: '#07080d',
        display: 'standalone',
        start_url: '/',
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
        cleanupOutdatedCaches: true,
        // NOTE: deliberately NO skipWaiting / clientsClaim. The new worker waits
        // until the user accepts the update (see usePwaUpdate), so assets are only
        // ever swapped during a clean, full reload.
        // SPA: serve index.html for client-routed deep links (incl. offline).
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [/^\/api\//],
      },
    }),
  ],
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') },
  },
})
