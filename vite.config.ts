import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'
export default defineConfig({
  base: '/genius-dt/',
  plugins: [
    tailwindcss(),
  ],
    build: {
    chunkSizeWarningLimit: 10000, // Increased from default 500
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, './src')
    }
  }
})