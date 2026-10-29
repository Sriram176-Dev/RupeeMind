import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    hookTimeout: 60000,
    testTimeout: 30000,
    fileParallelism: false,
    isolate: false,
    pool: 'threads',
    setupFiles: ['./test/setup.js'],
  },
});
