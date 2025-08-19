// vite.config.js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { webcrypto } from 'crypto'
import { fileURLToPath, URL } from 'url'

// Ensure Web Crypto API is available for packages that expect browser crypto
if (typeof globalThis.crypto === 'undefined') {
  globalThis.crypto = webcrypto
}

export default defineConfig({
  plugins: [
    react({
      // include common JS/TS/JSX/TSX extensions so Fast Refresh / HMR processes changes
      include: '**/*.{js,jsx,ts,tsx}'
    })
  ],
  resolve: {
    alias: {
      // maps @ -> /src
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  server: {
    watch: {
      usePolling: true
    }
  }
})
