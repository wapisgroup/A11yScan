// vite.config.js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'    // optional but recommended
import { webcrypto } from 'crypto'

// Ensure Web Crypto API is available for packages that expect browser crypto
if (typeof globalThis.crypto === 'undefined') {
    globalThis.crypto = webcrypto
}

export default defineConfig({
    plugins: [react({
        // include common JS/TS/JSX/TSX extensions so Fast Refresh / HMR processes changes
        // (the plugin's defaults are more permissive; if you prefer, you can also remove
        // the `include` option entirely and use `react()` with defaults.)
        include: "**/*.{js,jsx,ts,tsx}"
    })],
    server: {
        watch: {
            usePolling: true
        }
    }
})