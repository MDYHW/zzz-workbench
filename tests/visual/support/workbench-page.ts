import type { Page } from '@playwright/test'

export type Viewport = {
  height: number
  width: number
}

export async function waitForWorkbenchImages(page: Page): Promise<void> {
  await page.locator('img').evaluateAll(async (images) => {
    await Promise.all(images.map(async (image) => {
      if (!(image instanceof HTMLImageElement) || image.complete) return
      await new Promise<void>((resolve) => {
        image.addEventListener('load', () => resolve(), { once: true })
        image.addEventListener('error', () => resolve(), { once: true })
      })
    }))
  })
}

export async function openWorkbench(page: Page, viewport?: Viewport): Promise<void> {
  if (viewport) await page.setViewportSize(viewport)
  await page.goto('/')
  await waitForWorkbenchImages(page)
}

export function trackRuntimeFailures(page: Page): string[] {
  const failures: string[] = []
  page.on('console', (message) => {
    if (message.type() === 'error') failures.push(`console.error: ${message.text()}`)
  })
  page.on('pageerror', (error) => failures.push(`pageerror: ${error.message}`))
  return failures
}
