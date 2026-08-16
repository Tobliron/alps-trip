import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import { VitePWA } from 'vite-plugin-pwa';

// GitHub Pages serves this repo at https://tobliron.github.io/alps-trip/,
// so every asset URL has to be prefixed with that path. Without `base` the
// built page asks for /assets/... at the domain root and renders blank.
const BASE = '/alps-trip/';

export default defineConfig({
  base: BASE,
  plugins: [
    svelte(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'icons.svg'],
      manifest: {
        name: 'Shugon – Trip Planning',
        short_name: 'Shugon',
        description: 'Day-by-day trip planning: activities, bookings, budget, packing and notes.',
        theme_color: '#22443B',
        background_color: '#FBFCFB',
        display: 'standalone',
        orientation: 'portrait',
        start_url: BASE,
        scope: BASE,
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,ico,woff2}'],
        // The legacy copy of the old site is not part of this app and would
        // needlessly bloat the precache.
        globIgnores: ['legacy/**'],
        navigateFallbackDenylist: [/^\/alps-trip\/legacy\//],
        runtimeCaching: [
          {
            // Trip data. Network first so an online visit is always current,
            // falling back to the last response in a hut with no signal.
            urlPattern: /^https:\/\/[a-z0-9]+\.supabase\.co\/rest\/v1\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'trip-data',
              networkTimeoutSeconds: 5,
              expiration: { maxEntries: 60, maxAgeSeconds: 60 * 60 * 24 * 30 },
              cacheableResponse: { statuses: [0, 200] }
            }
          },
          {
            // Photos and GPX never change once uploaded — the path carries a
            // uuid — so serve them from cache immediately when we have them.
            urlPattern: /^https:\/\/[a-z0-9]+\.supabase\.co\/storage\/v1\/object\/public\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'trip-media',
              expiration: { maxEntries: 300, maxAgeSeconds: 60 * 60 * 24 * 90 },
              cacheableResponse: { statuses: [0, 200] }
            }
          },
          {
            urlPattern: /^https:\/\/tile\.openstreetmap\.org\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'osm-tiles',
              expiration: { maxEntries: 500, maxAgeSeconds: 60 * 60 * 24 * 30 },
              cacheableResponse: { statuses: [0, 200] }
            }
          },
          {
            urlPattern: /^https:\/\/fonts\.(googleapis|gstatic)\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'fonts',
              expiration: { maxEntries: 20, maxAgeSeconds: 60 * 60 * 24 * 365 },
              cacheableResponse: { statuses: [0, 200] }
            }
          }
          // Deliberately NOT cached: /auth/v1/ and the private trip-docs
          // bucket. Tokens and booking confirmations should not sit in a
          // cache on a shared or lost phone.
        ]
      }
    })
  ],
  build: {
    outDir: 'dist',
    sourcemap: true
  }
});
