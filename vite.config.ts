import { defineConfig } from 'vitest/config'

export default defineConfig({
  build: {
    modulePreload: { polyfill: false },
  },
  test: {
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
    include: ['src/**/*.test.{ts,tsx}'],
    testTimeout: 10_000,
    css: true,
    restoreMocks: true,
  },
})
