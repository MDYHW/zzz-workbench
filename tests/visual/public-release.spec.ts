import { openInitialWorkbench, openWorkbench } from './support/workbench-page'
import { expect, test } from './support/visual-test'

const releaseViewports = [
  { width: 1440, height: 800 },
  { width: 375, height: 800 },
] as const

const exactCsp = "default-src 'none'; base-uri 'none'; connect-src 'self'; font-src 'self'; form-action 'none'; frame-src 'none'; img-src 'self' data:; manifest-src 'self'; media-src 'none'; object-src 'none'; script-src 'self'; style-src 'self' 'unsafe-inline'; worker-src 'none'"

test('keeps the shared legal footer readable and outside the workbench at every release surface', async ({ page }) => {
  for (const viewport of releaseViewports) {
    for (const openSurface of [openInitialWorkbench, openWorkbench]) {
      await openSurface(page, viewport)

      const footer = page.getByRole('contentinfo')
      await expect(footer).toHaveCount(1)
      await footer.scrollIntoViewIfNeeded()
      await expect(footer).toBeVisible()
      await expect(footer.locator('p[lang="en"]')).toContainText(
        'unofficial, non-commercial fan-made website',
      )
      await expect(footer.locator('p[lang="ko"]')).toContainText(
        '비공식·비상업적 팬메이드 웹사이트',
      )
      await expect(footer.locator(
        'a[href], button, input, select, textarea, summary, [contenteditable="true"], [tabindex]:not([tabindex="-1"])',
      )).toHaveCount(0)

      const geometry = await page.locator('.app-shell').evaluate((shell) => {
        const main = shell.querySelector('main')!
        const footerElement = shell.querySelector('footer')!
        const mainBox = main.getBoundingClientRect()
        const footerBox = footerElement.getBoundingClientRect()
        return {
          footerAfterMain: footerElement.offsetTop >= main.offsetTop + main.offsetHeight,
          footerInsideShell: footerBox.left >= shell.getBoundingClientRect().left
            && footerBox.right <= shell.getBoundingClientRect().right,
          footerWidth: footerBox.width,
          mainWidth: mainBox.width,
          noDocumentOverflow: document.documentElement.scrollWidth
            <= document.documentElement.clientWidth,
        }
      })
      expect(geometry.footerAfterMain).toBe(true)
      expect(geometry.footerInsideShell).toBe(true)
      expect(geometry.footerWidth).toBeCloseTo(geometry.mainWidth, 0)
      expect(geometry.noDocumentOverflow).toBe(true)
    }
  }
})

test('reaches the desktop footer without changing pane offsets or focused workbench control', async ({ page }) => {
  await openWorkbench(page, { width: 1440, height: 800 })

  await page.locator('.metric-toggle').evaluateAll((toggles) => {
    for (const toggle of toggles) (toggle as HTMLButtonElement).click()
  })

  const reference = page.locator('.workspace-reference')
  const result = page.locator('.result-panel')
  await reference.evaluate((element) => { element.scrollTop = 120 })
  await result.evaluate((element) => { element.scrollTop = 120 })
  const referenceOffset = await reference.evaluate((element) => element.scrollTop)
  const resultOffset = await result.evaluate((element) => element.scrollTop)
  expect(referenceOffset).toBeGreaterThan(0)
  expect(resultOffset).toBeGreaterThan(0)

  const editParty = page.getByRole('button', { name: 'Edit party' })
  await editParty.focus()
  await page.getByRole('contentinfo').scrollIntoViewIfNeeded()

  await expect(page.getByRole('contentinfo')).toBeInViewport()
  await expect(editParty).toBeFocused()
  expect(await reference.evaluate((element) => element.scrollTop)).toBe(referenceOffset)
  expect(await result.evaluate((element) => element.scrollTop)).toBe(resultOffset)

  await page.evaluate(() => window.scrollTo({ top: 0 }))
  await expect(editParty).toBeFocused()
  expect(await reference.evaluate((element) => element.scrollTop)).toBe(referenceOffset)
  expect(await result.evaluate((element) => element.scrollTop)).toBe(resultOffset)
})

test('loads only same-origin resources and leaves browser persistence empty', async ({ page, context, browser }) => {
  const requestUrls: string[] = []
  const socketUrls: string[] = []
  page.on('request', (request) => requestUrls.push(request.url()))
  page.on('websocket', (socket) => socketUrls.push(socket.url()))

  await openWorkbench(page, { width: 1440, height: 800 })

  await expect(page.locator('meta[http-equiv="Content-Security-Policy"]'))
    .toHaveAttribute('content', exactCsp)

  const probeContext = await browser.newContext()
  const probePage = await probeContext.newPage()
  const probeRequests: string[] = []
  probePage.on('request', (request) => probeRequests.push(request.url()))
  await probePage.goto(page.url())
  const blockedCrossOriginRequest = await probePage.evaluate(async () => {
    try {
      await fetch('https://example.invalid/zzz-workbench-csp-probe')
      return false
    } catch {
      return true
    }
  })
  expect(blockedCrossOriginRequest).toBe(true)
  expect(probeRequests.some((url) => url.includes('zzz-workbench-csp-probe'))).toBe(false)
  await probeContext.close()
  expect(requestUrls.length).toBeGreaterThan(0)
  const pageUrl = new URL(page.url())
  expect(requestUrls.every((url) => new URL(url).origin === pageUrl.origin)).toBe(true)
  expect(socketUrls.every((url) => new URL(url).host === pageUrl.host)).toBe(true)

  expect(await context.cookies()).toEqual([])
  expect(await page.evaluate(async () => ({
    cacheKeys: 'caches' in window ? await caches.keys() : [],
    indexedDatabases: 'indexedDB' in window && typeof indexedDB.databases === 'function'
      ? await indexedDB.databases()
      : [],
    localStorageKeys: Object.keys(localStorage),
    serviceWorkers: 'serviceWorker' in navigator
      ? (await navigator.serviceWorker.getRegistrations()).length
      : 0,
    sessionStorageKeys: Object.keys(sessionStorage),
  }))).toEqual({
    cacheKeys: [],
    indexedDatabases: [],
    localStorageKeys: [],
    serviceWorkers: 0,
    sessionStorageKeys: [],
  })

  await page.reload()
  await expect(page.getByRole('heading', { name: 'Editing party' })).toBeVisible()
  await expect(page.getByRole('contentinfo')).toHaveCount(1)
  expect(await context.cookies()).toEqual([])
  expect(await page.evaluate(async () => ({
    cacheKeys: 'caches' in window ? await caches.keys() : [],
    indexedDatabases: 'indexedDB' in window && typeof indexedDB.databases === 'function'
      ? await indexedDB.databases()
      : [],
    localStorageKeys: Object.keys(localStorage),
    serviceWorkers: 'serviceWorker' in navigator
      ? (await navigator.serviceWorker.getRegistrations()).length
      : 0,
    sessionStorageKeys: Object.keys(sessionStorage),
  }))).toEqual({
    cacheKeys: [],
    indexedDatabases: [],
    localStorageKeys: [],
    serviceWorkers: 0,
    sessionStorageKeys: [],
  })
})
