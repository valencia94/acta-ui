// vite.config.ts
import react from '@vitejs/plugin-react';
import autoprefixer from 'autoprefixer';
import path from 'path';
import tailwindcss from 'tailwindcss';
import { defineConfig } from 'vite';
import svgr from 'vite-plugin-svgr';

export default defineConfig({
  root: '.',
  publicDir: 'public',
  plugins: [react(), svgr()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  css: {
    postcss: {
      plugins: [tailwindcss(), autoprefixer()],
    },
  },
  server: {
    host: true,
    port: 3000,
    open: true,
    proxy: {
      '/api': {
        target: 'https://q2b9avfwv5.execute-api.us-east-2.amazonaws.com/prod',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
        configure: (proxy, _options) => {
          proxy.on('error', (err, _req, _res) => {
            console.log('proxy error', err);
          });
          proxy.on('proxyReq', (proxyReq, req, _res) => {
            console.log('Sending Request to the Target:', req.method, req.url);
          });
          proxy.on('proxyRes', (proxyRes, req, _res) => {
            console.log('Received Response from the Target:', proxyRes.statusCode, req.url);
          });
        },
      }
    }
  },
  preview: {
    port: 5000,
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Separate PDF.js into its own chunk
          'pdf-viewer': ['react-pdf'],
          // Separate other large dependencies
          vendor: ['react', 'react-dom'],
          ui: ['framer-motion', 'lucide-react'],
        },
      },
    },
    // Increase chunk size warning limit for PDF.js
    chunkSizeWarningLimit: 600,
  },
});
