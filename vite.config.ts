import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
  base: './',
  resolve: {
    alias: {
      '@core': path.resolve(__dirname, 'src/core'),
      '@config': path.resolve(__dirname, 'src/config'),
    },
  },
  build: {
    target: 'ES2022',
    outDir: 'dist',
    assetsInlineLimit: 0,
  },
  server: {
    open: true,
  },
});
