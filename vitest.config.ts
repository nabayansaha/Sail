import { defineConfig } from 'vitest/config';
import path from 'node:path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['tests/**/*.test.ts'],
  },
  resolve: {
    alias: {
      '@sail/shared': path.resolve(__dirname, 'shared/src'),
      '@sail/game-engine': path.resolve(__dirname, 'shared/src/game-engine'),
      '@sail/types': path.resolve(__dirname, 'shared/src/types'),
    },
  },
});
