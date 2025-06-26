// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { validateEnvPlugin } from '@julr/vite-plugin-validate-env';
import svgr from 'vite-plugin-svgr';
import path from 'path';
import { envSchema } from './src/env.schema';

export default defineConfig(({ mode }) => ({
  plugins: [
    react(),
    svgr(),
    validateEnvPlugin({
      schema: envSchema,
      prefix: 'VITE_',
      env: process.env,
      failOnMissing: true,
      failOnExtra: false,
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  css: {
    postcss: {
      plugins: [
        require('tailwindcss')('./tailwind.config.js'),
        require('autoprefixer'),
      ],
    },
  },
  server: {
    port: 3000,
    open: true,
  },
  preview: {
    port: 5000,
  },
}));
