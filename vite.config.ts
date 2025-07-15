import react from '@vitejs/plugin-react';
import autoprefixer from 'autoprefixer';
import tailwindcss from 'tailwindcss';
import { defineConfig } from 'vite';
import svgr from 'vite-plugin-svgr';
import path from 'path';

export default defineConfig({
  root: '.',
  publicDir: 'public',
  plugins: [
    react(),
    svgr(),
    {
      name: 'copy-aws-exports',
      closeBundle: async () => {
        try {
          if (typeof process !== 'undefined' && process.versions?.node) {
            const fs = await import('fs');
            console.log('📋 Copying browser-compatible aws-exports.js to dist folder...');

            if (fs.existsSync('public/aws-exports.js')) {
              if (!fs.existsSync('dist')) {
                fs.mkdirSync('dist', { recursive: true });
              }
              fs.copyFileSync('public/aws-exports.js', 'dist/aws-exports.js');
              console.log('✅ Browser-compatible aws-exports.js copied successfully!');
            } else {
              console.warn('❌ public/aws-exports.js not found!');
            }
          }
        } catch (err) {
          console.warn('⚠️ Skipped aws-exports copy (likely non-Node build):', err.message);
        }
      }
    },
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  define: {
    __BUILD_TIMESTAMP__: JSON.stringify(new Date().toISOString()),
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
            console.log('Sending Request to Target:', req.method, req.url);
          });
          proxy.on('proxyRes', (proxyRes, req, _res) => {
            console.log('Received Response from Target:', proxyRes.statusCode, req.url);
          });
        },
      },
    },
  },
  preview: {
    port: 5000,
  },
  build: {
    rollupOptions: {
      external: ['fsevents'], // ✅ Avoid node-native conflicts
      output: {
        manualChunks: {
          'pdf-viewer': ['react-pdf'],
          vendor: ['react', 'react-dom'],
          ui: ['framer-motion', 'lucide-react'],
        },
        chunkFileNames: (chunkInfo) => {
          const id = chunkInfo.facadeModuleId
            ? path.basename(chunkInfo.facadeModuleId, path.extname(chunkInfo.facadeModuleId))
            : 'chunk';
          return `assets/${id}-[hash].js`;
        },
        entryFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]',
      },
    },
    chunkSizeWarningLimit: 1024,
  },
});
