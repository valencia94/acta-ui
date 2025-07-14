// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import svgr from 'vite-plugin-svgr';
import tailwindcss from 'tailwindcss';
import autoprefixer from 'autoprefixer';
import fs from 'fs';
import path from 'path';

export default defineConfig({
  root: '.',
  publicDir: 'public',

  /* ───────────────────────────────────────────────────────── plugins ── */
  plugins: [
    /* Copies the browser-compatible aws-exports.js produced by Amplify
       into the final /dist so the app can fetch it at runtime. */
    {
      name: 'copy-aws-exports',
      closeBundle() {
        console.log('📋 Copying browser-compatible aws-exports.js to dist …');
        if (fs.existsSync('public/aws-exports.js')) {
          fs.mkdirSync('dist', { recursive: true });
          fs.copyFileSync('public/aws-exports.js', 'dist/aws-exports.js');
          console.log('✅ aws-exports.js copied!');
        } else {
          console.warn('⚠️  public/aws-exports.js not found – skipping copy');
        }
      }
    },

    react(),
    svgr()
  ],

  /* ──────────────────────────────────────────────── path resolution ── */
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),

      /* 🔑 Amplify v6 umbrella package alias
         When any code does `import "@aws-amplify/core"` we point Vite to
         the monolithic `aws-amplify` package that actually ships the code.
         Remove this once you migrate fully to the new scoped packages. */
      '@aws-amplify/core': 'aws-amplify'
    }
  },

  /* ─────────────────────────────────────────────────── global defs ── */
  define: {
    __BUILD_TIMESTAMP__: JSON.stringify(new Date().toISOString())
  },

  /* ────────────────────────────────────────────────────── CSS / PostCSS ── */
  css: {
    postcss: {
      plugins: [tailwindcss(), autoprefixer()]
    }
  },

  /* ───────────────────────────────────────────────────────── dev server ── */
  server: {
    host: true,
    port: 3000,
    open: true,
    proxy: {
      '/api': {
        target: 'https://q2b9avfwv5.execute-api.us-east-2.amazonaws.com/prod',
        changeOrigin: true,
        rewrite: p => p.replace(/^\/api/, ''),
        configure: proxy => {
          proxy.on('error', (err, _req, _res) => console.log('proxy error', err));
          proxy.on('proxyReq', (proxyReq, req) =>
            console.log('→', req.method, req.url));
          proxy.on('proxyRes', (proxyRes, req) =>
            console.log('←', proxyRes.statusCode, req.url));
        }
      }
    }
  },

  preview: { port: 5000 },

  /* ────────────────────────────────────────────────────────── build ── */
  build: {
    chunkSizeWarningLimit: 1024,
    rollupOptions: {
      output: {
        manualChunks: {
          'pdf-viewer': ['react-pdf'],
          vendor: ['react', 'react-dom'],
          ui: ['framer-motion', 'lucide-react']
        },
        chunkFileNames: chunk => {
          const name = chunk.facadeModuleId
            ? path.basename(chunk.facadeModuleId, path.extname(chunk.facadeModuleId))
            : 'chunk';
          return `assets/${name}-[hash].js`;
        },
        entryFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]'
      }
    }
  }
});
