import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

export default defineConfig({
  plugins: [react()],
  base: './',
  build: {
    rollupOptions: {
      input: {
        // Landing page — served at /landing.html or set as default
        landing: resolve(__dirname, 'landing.html'),
        // The React app — served at /index.html
        app: resolve(__dirname, 'index.html'),
      },
    },
  },
  server: {
    // In dev, landing.html is at http://localhost:5173/landing.html
    // and the app is at http://localhost:5173/
    open: '/landing.html', // open landing page by default in dev
  },
})
