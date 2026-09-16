import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  // Base relativa: así el build funciona sin cambios sin importar bajo qué
  // subcarpeta lo sirva GitHub Pages (https://usuario.github.io/nombre-repo/).
  base: './',
  plugins: [react(), tailwindcss()],
})
