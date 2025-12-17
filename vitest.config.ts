import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['tests/**/*.test.ts'],
    exclude: ['**/node_modules/**', '**/dist/**', 'demo/**', 'example/**'],
    // Performance optimizations
    pool: 'threads',
    poolOptions: {
      threads: {
        singleThread: false,
        minThreads: 1,
        maxThreads: 4
      }
    },
    // Faster test discovery
    cache: {
      dir: './node_modules/.vitest'
    },
    // Optimize for CI/local development
    reporter: process.env.CI ? 'dot' : 'default',
    // Reduce memory usage for property tests
    testTimeout: 10000,
    hookTimeout: 10000
  },
  esbuild: {
    // Faster transpilation
    target: 'es2022'
  }
});
