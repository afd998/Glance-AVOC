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
  server: {
    port: 3000, // match CRA's default if you want
    historyApiFallback: true, // Enable client-side routing in development
  },
  build: {
    sourcemap: true,   // ⬅️ add this
  },
  preview: {
    port: 3000,
    historyApiFallback: true, // Enable client-side routing in preview mode
  },
})
