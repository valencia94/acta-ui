import react from '@vitejs/plugin-react';
import { resolve } from 'path';
import { defineConfig } from 'vite';
export default defineConfig({
  root: './src', // 🧭 Tells Vite where the real app starts
  plugins: [react()],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'), // Allows import like "@/components/..."
    },
  },
});
