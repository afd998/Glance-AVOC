import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { visualizer } from 'rollup-plugin-visualizer'

export default defineConfig({
  plugins: [react({
    babel: {
      plugins: ['babel-plugin-react-compiler'],
    },
  }),
    visualizer({
      filename: 'stats.html',   // output file
      open: true,               // auto-open in browser
      gzipSize: true,           // show gzip sizes
      brotliSize: true          // show brotli sizes
    }),
  ],
  resolve: {
    alias: {
      src: '/src',
      '@': '/src',
    },
  },
  server: {
    port: 3000,
    host: true, // Allow external connections
    hmr: {
      overlay: true, // Show error overlay
      port: 3001, // Use different port for HMR
    },
    watch: {
      usePolling: true, // Enable polling for file changes
      interval: 1000, // Poll every 1 second
      ignored: ['**/node_modules/**', '**/dist/**'], // Ignore these directories
    },
    fs: {
      strict: false, // Allow serving files outside of root
    },
  },
  build: {
    sourcemap: true,
  },
  preview: {
    port: 3000,
  },
  css: {
    devSourcemap: true, // Enable CSS source maps in dev
  },
})
