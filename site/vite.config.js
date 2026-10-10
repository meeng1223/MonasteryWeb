import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// React + the router in their own long-lived "vendor" chunk: every page needs
// them and they change far less often than the site code, so browsers keep them
// cached across deploys. Firebase is only imported by /admin (and on public form
// submit), so Rollup already keeps it out of the public pages.
const VENDOR = /[\\/]node_modules[\\/](react|react-dom|scheduler|react-router|react-router-dom|@remix-run[\\/]router)[\\/]/

export default defineConfig({
  plugins: [react()],
  server: { port: 5173, host: true },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (VENDOR.test(id)) return 'vendor'
        },
      },
    },
  },
})
