// vite.config.js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      // Włącz automatyczną rejestrację Service Workera
      registerType: 'autoUpdate', 
      
      // Dołącz plik manifest.json
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'robots.txt'],
      manifest: {
        name: 'Highlander Farm',
        short_name: 'Highlander',
        description: 'Aplikacja do zarządzania stadem Highlander',
        theme_color: '#10b981', // Zielony (emerald)
        background_color: '#f0fdfa', // Jasny zielony
        display: 'standalone',
        orientation: 'portrait',
        scope: '/',
        start_url: '/',
        icons: [
          {
            src: 'icons/icon-192x192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: 'icons/icon-512x512.png',
            sizes: '512x512',
            type: 'image/png',
          },
          {
            src: 'icons/icon-512x512-maskable.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable' // Ważne dla ikonek na Androidzie
          }
        ],
      },
      
      // Konfiguracja Service Workera (Workbox)
      workbox: {
        // Cache'uj wszystkie zasoby (JS, CSS, fonty) wygenerowane przez build
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        
        // Strategie cache'owania dla zasobów dynamicznych
        runtimeCaching: [
          {
            // API: Użyj 'NetworkFirst' - zawsze próbuj pobrać z sieci, 
            // jeśli się nie uda (offline), użyj cache'a.
            urlPattern: ({ url }) => url.pathname.startsWith('/api/'),
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24 // 1 dzień
              },
              cacheableResponse: {
                statuses: [0, 200], // Cache'uj odpowiedzi OK i "nieprzezroczyste"
              },
            },
          },
          {
            // Zdjęcia krów: Użyj 'CacheFirst' - jeśli zdjęcie jest w cache'u, 
            // użyj go od razu, w tle pobierz nowe (jeśli się zmieniło).
            urlPattern: ({ url }) => url.pathname.startsWith('/media/cows/'),
            handler: 'StaleWhileRevalidate', // Lepsze niż CacheFirst
            options: {
              cacheName: 'cow-images-cache',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 24 * 7 // 7 dni
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          }
        ]
      }
    })
  ]
})
