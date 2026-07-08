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
    },
  },
  build: {
    rollupOptions: {
      input: {
        // The app (index.html) and the QA studio (qa.html) are separate entry
        // points sharing one source tree; QA embeds the app in an iframe.
        main: path.resolve(__dirname, 'index.html'),
        qa: path.resolve(__dirname, 'qa.html'),
      },
      output: {
        manualChunks: function (id) {
          if (!id.includes('node_modules')) return
          if (id.includes('lottie')) return 'lottie'
          if (id.includes('lucide-react')) return 'icons'
          if (id.includes('react') || id.includes('scheduler') || id.includes('zustand')) return 'vendor'
        },
      },
    },
  },
})
