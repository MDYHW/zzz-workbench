import { openInitialWorkbench, openWorkbench } from './support/workbench-page'
import { expect, test } from './support/visual-test'

const viewports = [
  { width: 1440, height: 900 },
  { width: 536, height: 900 },
] as const

const partyEditViewports = [
  ...viewports,
  { width: 414, height: 900 },
  { width: 375, height: 900 },
  { width: 320, height: 900 },
] as const

test('keeps clipped masthead actions visibly keyboard-focused', async ({ page }) => {
  for (const viewport of [viewports[0], partyEditViewports[partyEditViewports.length - 1]]) {
    await openWorkbench(page, viewport)

    await expect(page.getByRole('button', { name: 'Edit party' })).toBeFocused()
    for (let step = 0; step < 4; step += 1) await page.keyboard.press('Shift+Tab')
    const copy = page.getByRole('button', { name: 'Copy Setup shortcut' })
    await expect(copy).toBeFocused()
    await expect(copy).toHaveCSS('outline-style', 'none')
    expect(await copy.evaluate((button) => getComputedStyle(button).boxShadow))
      .toContain('rgb(240, 213, 46) 0px 0px 0px 2px inset')

    await page.keyboard.press('Enter')
    await expect(copy).toHaveText('Copied')
    await expect(copy).toBeFocused()
    expect(await copy.evaluate((button) => getComputedStyle(button).boxShadow))
      .toContain('rgb(13, 15, 14) 0px 0px 0px 2px inset')

    await page.emulateMedia({ forcedColors: 'active' })
    const forcedColorFocus = await copy.evaluate((button) => {
      const style = getComputedStyle(button)
      return {
        boxShadow: style.boxShadow,
        outlineOffset: style.outlineOffset,
        outlineStyle: style.outlineStyle,
        outlineWidth: style.outlineWidth,
      }
    })
    expect(forcedColorFocus).toEqual({
      boxShadow: 'none',
      outlineOffset: '-4px',
      outlineStyle: 'solid',
      outlineWidth: '2px',
    })
    await page.emulateMedia({ forcedColors: 'none' })
  }
})

test('starts with three empty Party Edit destinations and no applied workspace', async ({ page }) => {
  for (const viewport of [
    { width: 1440, height: 900 },
    { width: 375, height: 900 },
  ]) {
    await openInitialWorkbench(page, viewport)

    await expect(page.getByRole('heading', { name: 'Editing party' })).toBeVisible()
    const emptySlots = page.getByRole('button', { name: /Select Agent for slot/ })
    await expect(emptySlots).toHaveCount(3)
    await expect(page.getByRole('button', { name: 'Cancel' })).toBeDisabled()
    await expect(page.getByRole('button', { name: 'Apply party' })).toBeDisabled()
    await expect(page.getByRole('heading', { name: 'Current party' })).toHaveCount(0)
    await expect(page.getByRole('tablist', { name: 'Applied party slots' })).toHaveCount(0)
    await expect(page.locator('.party-workspace')).toHaveCount(0)

    const boxes = await emptySlots.evaluateAll((slots) => slots.map((slot) => {
      const rect = slot.getBoundingClientRect()
      return { height: rect.height, top: rect.top, width: rect.width }
    }))
    expect(new Set(boxes.map(({ height }) => height)).size).toBe(1)
    expect(new Set(boxes.map(({ top }) => top)).size).toBe(1)
    expect(boxes.every(({ width }) => width > 0)).toBe(true)
  }
})

test('keeps W-Engine refinement beside the selected equipment at every viewport', async ({ page }) => {
  for (const viewport of viewports) {
    await openWorkbench(page, viewport)

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
    await openWorkbench(page, viewport)

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
  await openWorkbench(page, { width: 1440, height: 900 })

  const workspace = page.locator('.party-workspace')
  const reference = workspace.locator('.workspace-reference')
  const identity = workspace.locator('.workspace-identity')
  const setup = workspace.locator('.setup-panel')
  const result = workspace.locator('.result-panel')
  const setupContent = setup.locator('.setup-chassis')
  const firstSetupGroup = setupContent.locator(':scope > .setup-group').first()
  const portraitFrame = identity.locator('.workspace-identity__portrait')
  const portrait = portraitFrame.locator('.agent-art')
  const name = identity.locator('.slot-name-line')
  const identityBand = identity.locator('.identity-band')

  const workspaceBox = await workspace.boundingBox()
  const referenceBox = await reference.boundingBox()
  const identityBox = await identity.boundingBox()
  const setupBox = await setup.boundingBox()
  const resultBox = await result.boundingBox()
  const setupContentBox = await setupContent.boundingBox()
  const firstSetupGroupBox = await firstSetupGroup.boundingBox()
  const portraitFrameBox = await portraitFrame.boundingBox()
  const nameBox = await name.boundingBox()
  const identityBandBox = await identityBand.boundingBox()

  expect(workspaceBox).not.toBeNull()
  expect(referenceBox).not.toBeNull()
  expect(identityBox).not.toBeNull()
  expect(setupBox).not.toBeNull()
  expect(resultBox).not.toBeNull()
  expect(setupContentBox).not.toBeNull()
  expect(firstSetupGroupBox).not.toBeNull()
  expect(portraitFrameBox).not.toBeNull()
  expect(nameBox).not.toBeNull()
  expect(identityBandBox).not.toBeNull()

  expect(identityBox!.width / workspaceBox!.width).toBeCloseTo(0.15, 2)
  expect(referenceBox!.width / workspaceBox!.width).toBeCloseTo(0.62, 2)
  expect(resultBox!.width / workspaceBox!.width).toBeCloseTo(0.38, 2)
  expect(portraitFrameBox!.x).toBeCloseTo(identityBox!.x, 0)
  expect(portraitFrameBox!.x + portraitFrameBox!.width).toBeCloseTo(setupContentBox!.x, 0)
  expect(nameBox!.x + nameBox!.width).toBeLessThanOrEqual(setupContentBox!.x)
  expect(setupBox!.x + setupBox!.width).toBeLessThanOrEqual(referenceBox!.x + referenceBox!.width)
  expect(identityBandBox!.y - (nameBox!.y + nameBox!.height)).toBeCloseTo(8, 0)

  const nameLineHeight = await identity.locator('.identity-name').evaluate(
    (element) => Number.parseFloat(getComputedStyle(element).lineHeight),
  )
  expect(firstSetupGroupBox!.y).toBeCloseTo(nameBox!.y + nameLineHeight / 2, 0)

  const anchor = await portrait.evaluate((image) => ({
    left: image.offsetLeft,
    frameWidth: (image.offsetParent as HTMLElement).clientWidth,
  }))
  expect(anchor.left).toBeCloseTo(anchor.frameWidth / 2, 0)
})

test('keeps zoomed Identity metadata on the left side of the portrait', async ({ page }) => {
  await openWorkbench(page, { width: 536, height: 900 })

  const identity = page.locator('.workspace-identity')
  const name = identity.locator('.slot-name-line')
  const band = identity.locator('.identity-band')
  const identityBox = await identity.boundingBox()
  const nameBox = await name.boundingBox()
  const bandBox = await band.boundingBox()
  const alignment = await identity.evaluate((element) => ({
    lineLeft: Number.parseFloat(getComputedStyle(element, '::after').left),
    copyLeft: Number.parseFloat(getComputedStyle(element.querySelector('.identity-copy')!).paddingLeft),
  }))

  expect(identityBox).not.toBeNull()
  expect(nameBox).not.toBeNull()
  expect(bandBox).not.toBeNull()

  const portraitCenter = identityBox!.x + identityBox!.width / 2
  expect(nameBox!.x + nameBox!.width).toBeLessThanOrEqual(portraitCenter)
  expect(bandBox!.x + bandBox!.width).toBeLessThanOrEqual(portraitCenter)
  expect(alignment.lineLeft).toBe(alignment.copyLeft)
})

test('scrolls the desktop reference plane and Result independently', async ({ page }) => {
  await openWorkbench(page, { width: 1440, height: 800 })

  await page.locator('.metric-toggle').evaluateAll((toggles) => {
    for (const toggle of toggles) (toggle as HTMLButtonElement).click()
  })

  const reference = page.locator('.workspace-reference')
  const result = page.locator('.result-panel')

  await reference.hover()
  await page.mouse.wheel(0, 420)
  await expect.poll(() => reference.evaluate((element) => element.scrollTop)).toBeGreaterThan(0)
  expect(await result.evaluate((element) => element.scrollTop)).toBe(0)

  const referenceScrollTop = await reference.evaluate((element) => element.scrollTop)
  await result.hover()
  await page.mouse.wheel(0, 420)
  await expect.poll(() => result.evaluate((element) => element.scrollTop)).toBeGreaterThan(0)
  expect(await reference.evaluate((element) => element.scrollTop)).toBe(referenceScrollTop)
})

test('keeps primary stat copy readable while per-count detail stays one step quieter', async ({ page }) => {
  for (const viewport of viewports) {
    await openWorkbench(page, viewport)

    const fontSize = async (selector: string) => page.locator(selector).first().evaluate(
      (element) => Number.parseFloat(getComputedStyle(element).fontSize),
    )
    const discEffectSize = await fontSize('.disc-effect-rows b')

    const mainStatSize = await fontSize('.main-stat-block__details > span')
    const substatSize = await fontSize('.substat-copy strong')
    expect(mainStatSize).toBeGreaterThanOrEqual(discEffectSize)
    expect(substatSize).toBeGreaterThanOrEqual(discEffectSize)
    expect(mainStatSize - substatSize).toBeCloseTo(1, 5)
    const perCountSize = await fontSize('.substat-copy span')
    expect(perCountSize).toBeLessThan(discEffectSize)
    expect(perCountSize).toBeGreaterThanOrEqual(discEffectSize - 2)

    const elementHeight = async (selector: string) => page.locator(selector).first().evaluate(
      (element) => element.getBoundingClientRect().height,
    )
    const discHeight = await elementHeight('.disc-selection .selection-surface')
    const expectedStatHeight = discHeight * 2 / 3

    expect(await elementHeight('.main-stat-block')).toBeCloseTo(expectedStatHeight, -1)
    expect(await elementHeight('.substat-control')).toBeCloseTo(expectedStatHeight, -1)
  }
})

test('keeps the shared Identity background free of a portrait shade layer', async ({ page }) => {
  await openWorkbench(page)

  await expect(page.locator('.workspace-identity .identity-shade')).toHaveCount(0)
})

test('keeps Party Edit formation, filters, and candidate cards on their shared geometry', async ({ page }) => {
  for (const viewport of partyEditViewports) {
    await openWorkbench(page, viewport)
    await page.getByRole('button', { name: 'Edit party' }).click()

    const rail = page.locator('.party-editor__draft-rail')
    const slots = rail.locator('.draft-slot')
    await expect(slots).toHaveCount(3)
    const formationZ = Number(await page.locator('.party-editor__formation').evaluate((element) => (
      getComputedStyle(element).zIndex
    )))
    const appliedRailZ = Number(await page.locator('.party-rail').evaluate((element) => (
      getComputedStyle(element).zIndex
    )))
    expect(formationZ).toBeGreaterThan(appliedRailZ)
    const slotBoxes = await slots.evaluateAll((elements) => elements.map((element) => {
      const rect = element.getBoundingClientRect()
      return { height: rect.height, top: rect.top, width: rect.width }
    }))
    expect(new Set(slotBoxes.map(({ height }) => height)).size).toBe(1)
    expect(new Set(slotBoxes.map(({ top }) => top)).size).toBe(1)
    expect(slotBoxes[0].height).toBeCloseTo(viewport.width <= 760 ? 82 : 88, 0)
    expect(slotBoxes.every(({ width }) => width > 0)).toBe(true)

    const identityBoxes = await slots.locator('.draft-slot__identity').evaluateAll((elements) => elements.map((element) => {
      const name = element.querySelector<HTMLElement>('strong')!.getBoundingClientRect()
      const marks = element.querySelector<HTMLElement>('.draft-slot__marks')!.getBoundingClientRect()
      return {
        name: { left: name.left, right: name.right, top: name.top, bottom: name.bottom },
        marks: { left: marks.left, right: marks.right, top: marks.top, bottom: marks.bottom },
      }
    }))
    for (const [index, slot] of slotBoxes.entries()) {
      const slotElementBox = await slots.nth(index).boundingBox()
      expect(slotElementBox).not.toBeNull()
      for (const bank of [identityBoxes[index].name, identityBoxes[index].marks]) {
        expect(bank.left).toBeGreaterThanOrEqual(slotElementBox!.x)
        expect(bank.right).toBeLessThanOrEqual(slotElementBox!.x + slotElementBox!.width)
        expect(bank.top).toBeGreaterThanOrEqual(slotElementBox!.y)
        expect(bank.bottom).toBeLessThanOrEqual(slotElementBox!.y + slotElementBox!.height)
      }
    }

    const focusControl = page.locator('.party-editor__focus-change')
    const focusBox = await focusControl.boundingBox()
    expect(focusBox).not.toBeNull()
    expect(focusBox!.height).toBeLessThan(slotBoxes[0].height)
    expect(focusBox!.width).toBeLessThan(slotBoxes[0].width)

    await page.locator('.draft-slot').first().click()

    const filterRows = page.locator('.party-editor__filter-row')
    await expect(filterRows).toHaveCount(2)

    for (const filterRow of await filterRows.all()) {
      const rowBox = await filterRow.boundingBox()
      const firstButtons = filterRow.getByRole('button')
      const firstBox = await firstButtons.nth(0).boundingBox()
      const secondBox = await firstButtons.nth(1).boundingBox()
      expect(rowBox).not.toBeNull()
      expect(firstBox).not.toBeNull()
      expect(secondBox).not.toBeNull()
      expect(firstBox!.x - rowBox!.x).toBeGreaterThanOrEqual(0)
      expect(firstBox!.x - rowBox!.x).toBeLessThanOrEqual(24)
      expect(secondBox!.y).toBeCloseTo(firstBox!.y, 0)
    }

    const cards = page.locator('.agent-pool-card')
    expect(await cards.count()).toBeGreaterThan(0)

    for (const card of await cards.all()) {
      const cardBox = await card.boundingBox()
      const nameBox = await card.locator('.agent-pool-card__name').boundingBox()
      const identityBox = await card.locator('.agent-pool-card__identity').boundingBox()
      expect(cardBox).not.toBeNull()
      expect(nameBox).not.toBeNull()
      expect(identityBox).not.toBeNull()
      expect(cardBox!.height).toBeCloseTo(82, 0)
      expect(cardBox!.width).toBeGreaterThanOrEqual(184)
      expect(nameBox!.y + nameBox!.height).toBeLessThanOrEqual(identityBox!.y)
    }
  }
})

test('keeps the Focus chooser opened from Apply above the inactive current-party rail', async ({ page }) => {
  for (const viewport of [{ width: 552, height: 900 }, { width: 320, height: 900 }]) {
    await openWorkbench(page, viewport)
    await page.getByRole('button', { name: 'Edit party' }).click()
    await page.getByRole('button', { name: /Replace slot 2,/ }).click()
    await page.getByRole('button', { name: /Anby: Soldier 0, Electric, Attack/ }).click()
    await page.getByRole('button', { name: 'Apply party' }).click()

    const popup = page.locator('.party-editor__focus-popup')
    const currentRail = page.locator('.party-rail')
    const popupBox = await popup.boundingBox()
    const currentRailBox = await currentRail.boundingBox()
    expect(popupBox).not.toBeNull()
    expect(currentRailBox).not.toBeNull()
    const editorZ = Number(await page.locator('.party-editor').evaluate((element) => (
      getComputedStyle(element).zIndex
    )))
    const currentRailZ = Number(await currentRail.evaluate((element) => (
      getComputedStyle(element).zIndex
    )))
    expect(editorZ).toBeGreaterThan(currentRailZ)

    const overlapTop = Math.max(popupBox!.y, currentRailBox!.y)
    const overlapBottom = Math.min(
      popupBox!.y + popupBox!.height,
      currentRailBox!.y + currentRailBox!.height,
    )
    if (overlapBottom > overlapTop) {
      const popupOwnsOverlap = await page.evaluate(({ x, y }) => {
        const popupElement = document.querySelector('.party-editor__focus-popup')
        const topElement = document.elementFromPoint(x, y)
        return popupElement !== null && topElement !== null && popupElement.contains(topElement)
      }, {
        x: popupBox!.x + popupBox!.width / 2,
        y: overlapTop + (overlapBottom - overlapTop) / 2,
      })
      expect(popupOwnsOverlap).toBe(true)
    }
  }
})
