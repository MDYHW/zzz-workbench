import type { Page } from '@playwright/test'

export type Viewport = {
  height: number
  width: number
}

export async function waitForWorkbenchRender(page: Page): Promise<void> {
  await page.locator('img').evaluateAll(async (images) => {
    await Promise.all(images.map(async (image) => {
      if (!(image instanceof HTMLImageElement) || image.complete) return
      await new Promise<void>((resolve) => {
        image.addEventListener('load', () => resolve(), { once: true })
        image.addEventListener('error', () => resolve(), { once: true })
      })
    }))
  })
  await page.evaluate(async () => {
    await document.fonts.ready
    await new Promise<void>((resolve) => {
      requestAnimationFrame(() => requestAnimationFrame(() => resolve()))
    })
  })
}

export async function openInitialWorkbench(page: Page, viewport?: Viewport): Promise<void> {
  if (viewport) await page.setViewportSize(viewport)
  await page.goto('/')
  await waitForWorkbenchRender(page)
}

export async function openWorkbench(page: Page, viewport?: Viewport): Promise<void> {
  await openInitialWorkbench(page, viewport)
  for (const [slot, agent] of [
    [1, /Yixuan, Auric Ink, Rupture/],
    [2, /Dialyn, Physical, Stun/],
    [3, /Lucia, Ether, Support/],
  ] as const) {
    await page.getByRole('button', { name: `Select Agent for slot ${slot}` }).click()
    await page.getByRole('button', { name: agent }).click()
  }
  await page.getByRole('button', { name: 'Apply party' }).click()
  await waitForWorkbenchRender(page)
}

export function trackRuntimeFailures(page: Page): string[] {
  const failures: string[] = []
  page.on('console', (message) => {
    if (message.type() === 'error') failures.push(`console.error: ${message.text()}`)
  })
  page.on('pageerror', (error) => failures.push(`pageerror: ${error.message}`))
  return failures
}
