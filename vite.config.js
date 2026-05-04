import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],

  // Exclude the backend engine/ folder from Vite's module graph entirely.
  // The engine runs in Node.js (via `node engine/job.js`) — never in the browser.
  resolve: {
    // Prevents accidental imports of engine/ files from src/
    alias: {}
  },

  // Tell Vite's optimizer to never touch the engine folder
  optimizeDeps: {
    exclude: []
  },

  // Ensure engine/ files are not served as static assets or processed by Vite
  server: {
    watch: {
      // Don't watch engine/ changes as it's a separate Node process
      ignored: ['**/engine/**']
    }
  },

  // Explicitly scope the build to only process src/
  root: '.',
  build: {
    outDir: 'dist',
    // Do not bundle anything outside src/ — engine is server-side only
    rollupOptions: {
      input: path.resolve(__dirname, 'index.html'),
      external: (id) => {
        // Prevent accidental bundling of Node.js built-ins
        const nodeBuiltins = ['crypto', 'fs', 'path', 'os', 'child_process', 'stream', 'http', 'https', 'net', 'tls']
        return nodeBuiltins.includes(id)
      }
    }
  }
})
