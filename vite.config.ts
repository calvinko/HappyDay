import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['happyday.png', 'apple-touch-icon.png'],
      manifest: {
        name: 'Happy Day',
        short_name: 'Happy Day',
        description: 'Daily Scripture passage and hymns.',
        start_url: '.',
        scope: '.',
        display: 'standalone',
        background_color: '#f3f2f2',
        theme_color: '#ec3013',
        icons: [
          {
            src: 'happyday.png',
            sizes: '256x256',
            type: 'image/png',
          },
          {
            src: 'maskable-icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
    }),
  ],
})
