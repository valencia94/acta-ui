// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { ValidateEnv } from '@julr/vite-plugin-validate-env';
import svgr from 'vite-plugin-svgr';
import path from 'path';
import tailwindcss from 'tailwindcss';
import autoprefixer from 'autoprefixer';

import { envSchema } from './src/env.schema';

export default defineConfig({
  plugins: [
    react(),
    svgr(),
    ValidateEnv({
      validator: 'standard',      // use our Zod-based schema
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
        tailwindcss('./tailwind.config.js'),
        autoprefixer(),
      ],
    },
  },
  server: {
    host: true,
    port: 3000,
    open: true,
  },
  preview: {
    port: 5000,
  },
});
