import { defineConfig } from 'vitest/config'
import { sanitizeRasterMetadata } from './scripts/github-app/public-raster-metadata.js'
import { buildCompanion } from './scripts/github-app/companion/build.mjs'

export default defineConfig({
  optimizeDeps: { entries: ['index.html'] },
  plugins: [{
    name: 'bounded-gear-companion',
    async generateBundle() {
      this.emitFile({ type: 'asset', fileName: 'downloads/zzz-setup-companion.zip', source: await buildCompanion() })
    },
    configureServer(server) {
      server.middlewares.use('/downloads/zzz-setup-companion.zip', async (_request, response, next) => {
        try {
          const bytes = await buildCompanion()
          response.setHeader('Content-Type', 'application/zip')
          response.end(bytes)
        } catch (error) { next(error) }
      })
    },
  }, {
    name: 'public-root-host-control',
    generateBundle() {
      this.emitFile({ type: 'asset', fileName: '.nojekyll', source: '' })
    },
  }, {
    name: 'require-public-raster-contract',
    generateBundle(_options, bundle) {
      for (const output of Object.values(bundle)) {
        if (output.type === 'asset' && /\.(?:png|webp)$/.test(output.fileName)) {
          if (typeof output.source === 'string') this.error(`Raster output is not binary: ${output.fileName}`)
          const source = output.source
          const sanitized = sanitizeRasterMetadata(output.fileName, source)
          if (sanitized.length !== source.length || sanitized.some((byte, index) => byte !== source[index])) {
            this.error(`Raster metadata must be removed before asset hashing: ${output.fileName}`)
          }
        }
        const text = output.type === 'chunk'
          ? output.code
          : typeof output.source === 'string' ? output.source : undefined
        if (text && /data:image\/(?:png|webp)(?:;|,)/i.test(text)) {
          this.error(`Raster assets must not be inlined: ${output.fileName}`)
        }
      }
    },
  }],
  build: {
    assetsInlineLimit: 0,
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
