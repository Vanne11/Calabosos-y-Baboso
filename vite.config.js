import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import glob from 'vite-plugin-glob'  // Cambiado de { glob } a glob

// https://vite.dev/config/
export default defineConfig({
  base: '/cyb/',
  plugins: [
    react(),
    glob()
  ]
})