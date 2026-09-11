import { expect, test } from './support/visual-test'

test('gear download help remains reachable and contained at narrow and desktop widths', async ({ page }) => {
  await page.goto('/')
  for (const width of [320, 390, 1101, 1280, 1440]) {
    await page.setViewportSize({ width, height: 800 })
    const trigger = page.getByLabel('장비 가져오기 안내', { exact: true })
    await trigger.click()
    const panel = page.getByRole('region', { name: 'HoYoLAB 장비 가져오기' })
    await expect(panel).toBeVisible()
    const bounds = await panel.boundingBox()
    expect(bounds!.x).toBeGreaterThanOrEqual(0)
    expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(width)
    expect(bounds!.y + bounds!.height).toBeLessThanOrEqual(800)
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
    const header = await page.locator('.masthead').evaluate(element => {
      const title = element.querySelector('h1')!.getBoundingClientRect()
      const actions = element.querySelector('.masthead-actions')!.getBoundingClientRect()
      return { titleRight: title.right, actionsLeft: actions.left }
    })
    expect(header.titleRight).toBeLessThanOrEqual(header.actionsLeft)
    const download = panel.getByRole('link', { name: '확장 기능 ZIP 다운로드' })
    await expect(download).toHaveAttribute('download', '')
    await download.focus()
    await page.keyboard.press('Escape')
    await expect(panel).not.toBeVisible()
    await expect(trigger).toBeFocused()
  }
})
