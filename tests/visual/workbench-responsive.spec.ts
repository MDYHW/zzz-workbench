import { openInitialWorkbench, waitForWorkbenchRender } from './support/workbench-page'
import { expect, test } from './support/visual-test'

for (const width of [320, 390, 769, 800, 1100, 1280]) {
  test(`keeps equipment text and masthead actions separate at ${width}px`, async ({ page }) => {
    await openInitialWorkbench(page, { width, height: 900 })
    for (const [slot, name] of [
      [1, 'Miyabi, Frost, Anomaly, S Rank'],
      [2, 'Evelyn, Fire, Attack, S Rank'],
      [3, 'Astra Yao, Ether, Support, S Rank'],
    ] as const) {
      await page.getByRole('button', { name: `Select Agent for slot ${slot}`, exact: true }).click()
      await page.getByRole('button', { name, exact: true }).click()
    }
    await page.getByRole('button', { name: 'Apply party', exact: true }).click()
    await page.getByRole('button', { name: 'Set Miyabi as Focus', exact: true }).click()
    await page.getByRole('button', { name: 'Apply party', exact: true }).click()

    for (const locale of ['en', 'ko']) {
      if (locale === 'ko') {
        await page.getByRole('button', { name: 'Display language: English', exact: true }).click()
        await page.getByRole('menuitemradio', { name: '한국어로 표시', exact: true }).click()
      }
      await waitForWorkbenchRender(page)
      const title = await page.locator('.masthead h1').boundingBox()
      const actions = await page.locator('.masthead-actions').boundingBox()
      expect(title!.x + title!.width).toBeLessThanOrEqual(actions!.x + 1)

      for (let slot = 0; slot < 3; slot++) {
        await page.getByRole('tab').nth(slot).click()
        await waitForWorkbenchRender(page)
        const selected = page.locator('.equipment-fieldset .selection-surface')
        const name = await selected.locator('.equipment-name-line strong').boundingBox()
        const rank = await selected.locator('.equipment-rank').boundingBox()
        const change = await selected.locator('.selection-surface__change').boundingBox()
        expect(name!.x + name!.width).toBeLessThanOrEqual(rank!.x + 1)
        expect(Math.abs(rank!.x + rank!.width / 2 - change!.x - change!.width / 2)).toBeLessThanOrEqual(2)
        expect(await page.locator('.disc-effect-rows b').evaluateAll((effects) => effects.every((effect) => {
          const text = effect.getBoundingClientRect()
          const row = effect.parentElement!.getBoundingClientRect()
          return text.top >= row.top - 1 && text.bottom <= row.bottom + 1
        }))).toBe(true)
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true)
      }
    }
  })
}

test('keeps mobile action sources inside their disclosure and aligns all three surfaces', async ({ page }) => {
  await openInitialWorkbench(page, { width: 390, height: 844 })
  for (const [slot, name] of [
    [1, 'Evelyn, Fire, Attack, S Rank'],
    [2, 'Lighter, Fire, Stun, S Rank'],
    [3, 'Astra Yao, Ether, Support, S Rank'],
  ] as const) {
    await page.getByRole('button', { name: `Select Agent for slot ${slot}`, exact: true }).click()
    await page.getByRole('button', { name, exact: true }).click()
  }
  await page.getByRole('button', { name: 'Apply party', exact: true }).click()
  await page.getByRole('button', { name: 'RES Ignore', exact: true }).click()
  await page.getByRole('button', { name: 'Show sources for Chain Attack, Ultimate', exact: true }).click()
  await expect(page.locator('.action-source-detail:visible')).toHaveCount(1)
  expect(await page.locator('.action-matrix tbody tr').evaluateAll((rows) => rows.every((row) => {
    const cells = Array.from(row.querySelectorAll(':scope > td[data-surface-label]'))
    const tops = cells.map((cell) => cell.getBoundingClientRect().top)
    return cells.length === 3 && Math.max(...tops) - Math.min(...tops) < 1
  }))).toBe(true)
  const detail = page.locator('.breakdown-row').filter({ has: page.locator('.action-matrix') })
  const detailBox = await detail.boundingBox()
  const contentBox = await detail.locator('.breakdown-grid').boundingBox()
  expect(contentBox!.y + contentBox!.height).toBeLessThanOrEqual(detailBox!.y + detailBox!.height + 1)
  await expect(page.getByRole('button', { name: 'RES Reduction', exact: true })).toBeVisible()
})
