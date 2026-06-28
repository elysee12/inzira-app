import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { TanStackRouterVite } from '@tanstack/router-plugin/vite';
import tailwindcss from '@tailwindcss/vite';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    TanStackRouterVite(),
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/react')) return 'react-vendor';
          if (id.includes('node_modules/@tanstack/react-router') || id.includes('node_modules/@tanstack/react-query')) return 'router-vendor';
          if (id.includes('node_modules/lucide-react') || id.includes('node_modules/sonner')) return 'ui-vendor';
        },
      },
    },
  },
  server: {
    port: 8080,
    host: true,
  },
  preview: {
    port: 8080,
  },
});
