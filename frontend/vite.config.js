import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [
    react({
      // Use babel for JSX transformation
      babel: {
        plugins: [],
      },
    }),
  ],
  server: {
    port: 3001,
    open: true,
  },
  build: {
    // Optimize bundle size
    rollupOptions: {
      output: {
        manualChunks: {
          // Vendor chunks for better caching
          'react-vendor': ['react', 'react-dom'],
          'query-vendor': ['@tanstack/react-query'],
          'charts': ['recharts', 'react-calendar-heatmap', 'react-circular-progressbar'],
          'ui-vendor': ['framer-motion', 'lucide-react'],
        },
      },
    },
    // Minification and optimization
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true, // Remove console.logs in production
        drop_debugger: true,
      },
    },
    // CSS code splitting
    cssCodeSplit: true,
    // Source maps for debugging (disable in production for smaller bundles)
    sourcemap: false,
    // Chunk size warning limit
    chunkSizeWarningLimit: 1000,
    // Copy service worker to dist
    copyPublicDir: true,
  },
  // Performance optimizations
  optimizeDeps: {
    include: ['react', 'react-dom', '@tanstack/react-query'],
    exclude: ['react-confetti'], // Lazy load confetti
  },
  // Ensure service worker is served correctly
  publicDir: 'public',
});
