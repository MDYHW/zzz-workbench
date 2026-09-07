import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [{
    name: 'public-root-host-control',
    generateBundle() {
      this.emitFile({ type: 'asset', fileName: '.nojekyll', source: '' })
    },
  }],
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
