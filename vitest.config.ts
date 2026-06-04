import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  resolve: {
    alias: {
      '@core': path.resolve(__dirname, 'src/core'),
      '@config': path.resolve(__dirname, 'src/config'),
    },
  },
  test: {
    include: ['tests/**/*.test.ts'],
    globals: true,
  },
});
