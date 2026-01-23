import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      }
    }
  },
  css: {
    // Use lightningcss for better browser compatibility
    transformer: 'lightningcss',
    lightningcss: {
      // Target browsers for CSS compatibility
      targets: {
        chrome: 95 << 16,
        firefox: 95 << 16,
        safari: 14 << 16 | 1 << 8,
      },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    // Use lightningcss for CSS minification
    cssMinify: 'lightningcss',
  }
})
