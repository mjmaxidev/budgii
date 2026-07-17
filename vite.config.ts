import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  // Relative paths so the built bundle loads correctly from file:// inside Electron.
  base: './',
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      'lottie-web': 'lottie-web/build/player/lottie_light',
    },
  },
  build: {
    rollupOptions: {
      input: {
        // The app, QA studio, and public landing page ship as separate entries.
        main: path.resolve(__dirname, 'index.html'),
        qa: path.resolve(__dirname, 'qa/index.html'),
        landing: path.resolve(__dirname, 'website/index.html'),
        privacy: path.resolve(__dirname, 'website/privacy/index.html'),
        terms: path.resolve(__dirname, 'website/terms/index.html'),
        accountDeletion: path.resolve(__dirname, 'website/delete-account/index.html'),
        support: path.resolve(__dirname, 'website/support/index.html'),
      },
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return
          if (id.includes('lottie')) return 'lottie'
          if (id.includes('lucide-react')) return 'icons'
          if (id.includes('react') || id.includes('scheduler') || id.includes('zustand')) return 'vendor'
        },
      },
    },
  },
})
