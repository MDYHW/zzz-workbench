import { expect, test } from '@playwright/test'

const viewports = [
  { width: 1440, height: 900 },
  { width: 536, height: 900 },
] as const

test('keeps W-Engine refinement beside the selected equipment at every viewport', async ({ page }) => {
  for (const viewport of viewports) {
    await page.setViewportSize(viewport)
    await page.goto('/')

    const equipment = page.locator('.equipment-fieldset').first()
    const selectedEngine = equipment.locator('.selection-stack')
    const refinement = equipment.locator('.refinement-control')
    const refinementButtons = refinement.getByRole('button')

    await expect(refinement).toBeVisible()
    await expect(refinementButtons).toHaveCount(5)

    const engineBox = await selectedEngine.boundingBox()
    const refinementBox = await refinement.boundingBox()
    expect(engineBox).not.toBeNull()
    expect(refinementBox).not.toBeNull()
    expect(refinementBox!.x).toBeGreaterThanOrEqual(engineBox!.x + engineBox!.width)

    await refinementButtons.nth(1).click()
    await expect(refinementButtons.nth(1)).toHaveAttribute('aria-pressed', 'true')
    await expect(refinementButtons.nth(0)).toHaveAttribute('aria-pressed', 'false')

    const selectedBackground = await refinementButtons.nth(1).evaluate(
      (button) => getComputedStyle(button).backgroundColor,
    )
    const unselectedBackground = await refinementButtons.nth(0).evaluate(
      (button) => getComputedStyle(button).backgroundColor,
    )
    expect(selectedBackground).not.toBe(unselectedBackground)
  }
})

test('keeps Drive Disc art clear of piece labels at every viewport', async ({ page }) => {
  for (const viewport of viewports) {
    await page.setViewportSize(viewport)
    await page.goto('/')

    const disc = page.locator('.disc-selection').first()
    const art = disc.locator('.equipment-art--disc img')
    const pieceLabels = disc.locator('.disc-effect-rows small')

    const artBox = await art.boundingBox()
    expect(artBox).not.toBeNull()

    for (const label of await pieceLabels.all()) {
      const labelBox = await label.boundingBox()
      expect(labelBox).not.toBeNull()
      expect(artBox!.x + artBox!.width).toBeLessThanOrEqual(labelBox!.x)
    }
  }
})

test('anchors the desktop portrait and name to the Setup content seam', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto('/')

  const workspace = page.locator('.party-workspace')
  const identity = workspace.locator('.workspace-identity')
  const setup = workspace.locator('.setup-panel')
  const result = workspace.locator('.result-panel')
  const setupContent = setup.locator('.setup-chassis')
  const portraitFrame = identity.locator('.workspace-identity__portrait')
  const portrait = portraitFrame.locator('.agent-art')
  const name = identity.locator('.slot-name-line')

  const workspaceBox = await workspace.boundingBox()
  const identityBox = await identity.boundingBox()
  const setupBox = await setup.boundingBox()
  const resultBox = await result.boundingBox()
  const setupContentBox = await setupContent.boundingBox()
  const portraitFrameBox = await portraitFrame.boundingBox()
  const nameBox = await name.boundingBox()

  expect(workspaceBox).not.toBeNull()
  expect(identityBox).not.toBeNull()
  expect(setupBox).not.toBeNull()
  expect(resultBox).not.toBeNull()
  expect(setupContentBox).not.toBeNull()
  expect(portraitFrameBox).not.toBeNull()
  expect(nameBox).not.toBeNull()

  expect(identityBox!.width / workspaceBox!.width).toBeCloseTo(0.15, 2)
  expect(setupBox!.width / workspaceBox!.width).toBeCloseTo(0.47, 2)
  expect(resultBox!.width / workspaceBox!.width).toBeCloseTo(0.38, 2)
  expect(portraitFrameBox!.x).toBeCloseTo(identityBox!.x, 0)
  expect(portraitFrameBox!.x + portraitFrameBox!.width).toBeCloseTo(setupContentBox!.x, 0)
  expect(nameBox!.x + nameBox!.width).toBeLessThanOrEqual(setupContentBox!.x)

  const anchor = await portrait.evaluate((image) => ({
    left: image.offsetLeft,
    frameWidth: (image.offsetParent as HTMLElement).clientWidth,
  }))
  expect(anchor.left).toBeCloseTo(anchor.frameWidth / 2, 0)
})

test('keeps primary stat copy readable while per-count detail stays one step quieter', async ({ page }) => {
  for (const viewport of viewports) {
    await page.setViewportSize(viewport)
    await page.goto('/')

    const fontSize = async (selector: string) => page.locator(selector).first().evaluate(
      (element) => Number.parseFloat(getComputedStyle(element).fontSize),
    )
    const discEffectSize = await fontSize('.disc-effect-rows b')

    expect(await fontSize('.main-stat-block__details > span')).toBeGreaterThanOrEqual(discEffectSize)
    expect(await fontSize('.substat-copy strong')).toBeGreaterThanOrEqual(discEffectSize)
    const perCountSize = await fontSize('.substat-copy span')
    expect(perCountSize).toBeLessThan(discEffectSize)
    expect(perCountSize).toBeGreaterThanOrEqual(discEffectSize - 2)
  }
})
