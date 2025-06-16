import { ValidateEnv } from '@julr/vite-plugin-validate-env';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';
import { defineConfig } from 'vite';

import { envSchema } from './env.schema';

export default defineConfig({
  plugins: [react(), ValidateEnv({ validator: 'standard', schema: envSchema })],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'), // so “@/components/…” works
    },
  },
});
