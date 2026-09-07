import { defineConfig } from 'vitest/config'
import { sanitizeRasterMetadata } from './scripts/github-app/public-raster-metadata.js'

export default defineConfig({
  plugins: [{
    name: 'public-root-host-control',
    generateBundle() {
      this.emitFile({ type: 'asset', fileName: '.nojekyll', source: '' })
    },
  }, {
    name: 'strip-public-raster-metadata',
    generateBundle(_options, bundle) {
      for (const output of Object.values(bundle)) {
        if (output.type !== 'asset' || !/\.(?:png|webp)$/.test(output.fileName)) continue
        output.source = sanitizeRasterMetadata(output.fileName, output.source)
      }
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
