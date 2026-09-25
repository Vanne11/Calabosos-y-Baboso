import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import glob from 'vite-plugin-glob'  // Cambiado de { glob } a glob

// Servidor de IA local para desarrollo (server/): php -S 127.0.0.1:8099 -t server/public
const AI_DEV_TARGET = process.env.CYB_API_TARGET || 'http://127.0.0.1:8099'

// https://vite.dev/config/
export default defineConfig({
  base: '/cyb/',
  plugins: [
    react(),
    glob()
  ],
  server: {
    // En producción el juego (/cyb/) y la API (/cyb-api/) comparten dominio; en desarrollo lo imita este proxy
    proxy: {
      '/cyb-api': {
        target: AI_DEV_TARGET,
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/cyb-api/, ''),
      },
    },
  },
})
