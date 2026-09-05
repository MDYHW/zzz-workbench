import { expect, test, type Page } from '@playwright/test'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { ADMITTED_AGENTS, agentDisplayName } from '../../src/workbench/content/agents'
import type { AgentId } from '../../src/workbench/content/types'

type PortraitAgent = {
  candidateName: string
  displayName: string
  focusEligible: boolean
  slug: string
}

type PortraitParty = {
  id: string
  focus?: string
  captures: readonly PortraitAgent[]
  members: readonly [PortraitAgent, PortraitAgent, PortraitAgent]
}

type Bounds = {
  bottom: number
  left: number
  right: number
  top: number
}

const portraitSnapshotStyle = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  'portrait-snapshot.css',
)
const candidatePoolSnapshotStyle = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  'candidate-pool-snapshot.css',
)

const selectorSlugs: Record<AgentId, string> = {
  ...Object.fromEntries(ADMITTED_AGENTS.map(({ id }) => [id, id])),
  anbySoldier0: 'anby-soldier-0',
  astraYao: 'astra-yao',
  juFufu: 'ju-fufu',
  nangongYu: 'nangong-yu',
  panYinhu: 'pan-yinhu',
  soldier11: 'soldier-11',
  starlightBilly: 'starlight-billy-kid',
  yeShunguang: 'ye-shunguang',
  zhuYuan: 'zhu-yuan',
} as Record<AgentId, string>

const agents = Object.fromEntries(ADMITTED_AGENTS.map((agent) => [agent.id, {
  candidateName: `${agentDisplayName(agent)}, ${agent.attribute}, ${agent.specialty}, ${agent.rank} Rank`,
  displayName: agentDisplayName(agent),
  focusEligible: agent.focusEligible,
  slug: selectorSlugs[agent.id],
}])) as Record<AgentId, PortraitAgent>

const calibratedParties: readonly PortraitParty[] = [
  {
    id: 'portrait-calibration-extremes',
    focus: 'Pyrois',
    captures: [agents.remielle, agents.pyrois, agents.sigrid],
    members: [agents.remielle, agents.pyrois, agents.sigrid],
  },
  {
    id: 'portrait-calibration-secondary',
    focus: 'Pyrois',
    captures: [agents.norma, agents.trigger],
    members: [agents.norma, agents.trigger, agents.pyrois],
  },
  {
    id: 'portrait-calibration-vertical',
    focus: 'Ben',
    captures: [agents.lucy, agents.qingyi, agents.ben],
    members: [agents.lucy, agents.qingyi, agents.ben],
  },
  {
    id: 'portrait-calibration-long-name',
    focus: 'Ye Shunguang',
    captures: [agents.yeShunguang, agents.astraYao],
    members: [agents.yeShunguang, agents.astraYao, agents.qingyi],
  },
  {
    id: 'portrait-corrections-a',
    focus: 'Nekomata',
    captures: [agents.pulchra, agents.nekomata],
    members: [agents.pulchra, agents.nekomata, agents.ben],
  },
  {
    id: 'portrait-corrections-b',
    captures: [agents.koleda, agents.zhao, agents.anbySoldier0],
    members: [agents.koleda, agents.zhao, agents.anbySoldier0],
  },
  {
    id: 'portrait-piper-anomaly',
    focus: 'Piper',
    captures: [agents.piper],
    members: [agents.piper, agents.grace, agents.ben],
  },
  {
    id: 'portrait-yanagi-alice-anomaly',
    focus: 'Yanagi',
    captures: [agents.yanagi, agents.alice],
    members: [agents.yanagi, agents.alice, agents.piper],
  },
  {
    id: 'portrait-abloom-anomaly',
    focus: 'Aria',
    captures: [agents.vivian, agents.aria, agents.promeia],
    members: [agents.vivian, agents.aria, agents.promeia],
  },
  {
    id: 'portrait-angels-anomaly-support',
    focus: 'Aria',
    captures: [agents.sunna, agents.nangongYu],
    members: [agents.sunna, agents.nangongYu, agents.aria],
  },
  {
    id: 'portrait-miyabi-frost',
    focus: 'Miyabi',
    captures: [agents.miyabi],
    members: [agents.miyabi, agents.yanagi, agents.sunna],
  },
  {
    id: 'portrait-anton-rina-electric',
    focus: 'Anton',
    captures: [agents.anton, agents.rina],
    members: [agents.anton, agents.rina, agents.grace],
  },
  {
    id: 'portrait-velina-wind',
    focus: 'Yanagi',
    captures: [agents.velina],
    members: [agents.velina, agents.yanagi, agents.sunna],
  },
]

const initiallyAppliedParty: PortraitParty = {
  id: 'portrait-initially-applied',
  focus: agents.yixuan.displayName,
  captures: [agents.yixuan, agents.dialyn, agents.lucia],
  members: [agents.yixuan, agents.dialyn, agents.lucia],
}

const coveredSlugs = new Set([
  ...calibratedParties.flatMap(({ captures }) => captures.map(({ slug }) => slug)),
  ...initiallyAppliedParty.captures.map(({ slug }) => slug),
])
const supplementalAgents = Object.values(agents).filter(({ slug }) => !coveredSlugs.has(slug))
const supplementalParties: PortraitParty[] = []

for (let index = 0; index < supplementalAgents.length; index += 2) {
  const captures = supplementalAgents.slice(index, index + 2)
  const fillers = [agents.pyrois, agents.yixuan, agents.sigrid]
    .filter((agent) => !captures.includes(agent))
  const members = [...captures, ...fillers].slice(0, 3) as [PortraitAgent, PortraitAgent, PortraitAgent]
  const focus = members.find(({ focusEligible }) => focusEligible)!.displayName
  supplementalParties.push({
    id: `portrait-roster-${String(index / 2 + 1).padStart(2, '0')}`,
    captures,
    focus,
    members,
  })
}

const parties: readonly PortraitParty[] = [
  ...calibratedParties,
  initiallyAppliedParty,
  ...supplementalParties,
]

const destinations = [
  { id: 'desktop', viewport: { width: 1440, height: 1000 } },
  { id: 'narrow', viewport: { width: 750, height: 900 } },
] as const

const runtimeFailures = new WeakMap<Page, string[]>()

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function agentTab(page: Page, agent: PortraitAgent) {
  return page.getByRole('tab', {
    name: new RegExp(`^View ${escapeRegExp(agent.displayName)} setup and Result$`),
  })
}

async function waitForPortraits(page: Page): Promise<void> {
  await page.locator('img').evaluateAll(async (images) => {
    await Promise.all(images.map(async (image) => {
      if (image.complete) return
      await new Promise<void>((resolve) => {
        image.addEventListener('load', () => resolve(), { once: true })
        image.addEventListener('error', () => resolve(), { once: true })
      })
    }))
  })
}

async function applyParty(page: Page, party: PortraitParty): Promise<void> {
  await page.getByRole('button', { name: 'Edit party' }).click()

  let changed = false

  for (const [index, agent] of party.members.entries()) {
    const slot = page.getByRole('button', { name: new RegExp(`^Replace slot ${index + 1},`) })
    if ((await slot.getAttribute('aria-label'))?.endsWith(`, ${agent.displayName}`)) continue
    changed = true
    await slot.click()
    await page.getByRole('button', { name: agent.candidateName, exact: true }).click()
  }

  if (party.focus) {
    const focusChange = page.getByRole('button', { name: 'Change Focus Agent', exact: true })
    if (await focusChange.count()) {
      await focusChange.click()
      await page.getByRole('button', { name: `Set ${party.focus} as Focus`, exact: true }).click()
    } else {
      await expect(
        page.getByText(`${party.focus} is Focus automatically.`, { exact: true }).first(),
      ).toBeVisible()
    }
  }
  await page.getByRole('button', { name: changed ? 'Apply party' : 'Cancel' }).click()
  await waitForPortraits(page)
}

async function selectAgent(page: Page, agent: PortraitAgent): Promise<void> {
  const tab = agentTab(page, agent)
  if (await tab.getAttribute('aria-selected') !== 'true') await tab.click()
}

async function clearTransientSourceHighlight(page: Page): Promise<void> {
  await page.mouse.move(-1, -1)
  await page.evaluate(() => {
    if (document.activeElement instanceof HTMLElement) document.activeElement.blur()
  })
  await expect(page.locator('.source-target.is-source-active')).toHaveCount(0)
}

function overlaps(left: Bounds, right: Bounds): boolean {
  return left.left < right.right - 0.5
    && left.right > right.left + 0.5
    && left.top < right.bottom - 0.5
    && left.bottom > right.top + 0.5
}

async function expectDraftIdentityClearance(page: Page, partyId: string, destinationId: string): Promise<void> {
  const slots = await page.locator('.draft-slot').evaluateAll((elements) => elements.map((element) => {
    const bounds = (target: Element) => {
      const rect = target.getBoundingClientRect()
      return { bottom: rect.bottom, left: rect.left, right: rect.right, top: rect.top }
    }
    const visibleBounds = (target: Element | null) => {
      if (!target) return null
      const style = getComputedStyle(target)
      return style.display === 'none' || style.visibility === 'hidden' ? null : bounds(target)
    }
    const identity = element.querySelector('.draft-slot__identity')!
    const name = identity.querySelector('strong')!
    const marks = identity.querySelector('.draft-slot__marks')!
    return {
      identity: bounds(identity),
      marks: bounds(marks),
      name: bounds(name),
      nameClientHeight: name.clientHeight,
      nameScrollHeight: name.scrollHeight,
      replace: visibleBounds(element.querySelector('.draft-slot__replace')),
      focus: visibleBounds(element.querySelector('.draft-slot__focus-marker')),
      slot: bounds(element),
    }
  }))

  for (const [index, geometry] of slots.entries()) {
    const label = `${partyId} ${destinationId} draft slot ${index + 1}`
    expect.soft(geometry.identity.left, `${label} identity starts inside slot`).toBeGreaterThanOrEqual(geometry.slot.left - 0.5)
    expect.soft(geometry.identity.right, `${label} identity ends inside slot`).toBeLessThanOrEqual(geometry.slot.right + 0.5)
    expect.soft(geometry.name.left, `${label} name starts inside identity`).toBeGreaterThanOrEqual(geometry.identity.left - 0.5)
    expect.soft(geometry.name.right, `${label} name ends inside identity`).toBeLessThanOrEqual(geometry.identity.right + 0.5)
    expect.soft(geometry.name.top, `${label} name starts inside identity height`).toBeGreaterThanOrEqual(geometry.identity.top - 0.5)
    expect.soft(geometry.marks.bottom, `${label} marks end inside identity height`).toBeLessThanOrEqual(geometry.identity.bottom + 0.5)
    expect.soft(geometry.name.bottom, `${label} name clears identity marks`).toBeLessThanOrEqual(geometry.marks.top + 0.5)
    expect.soft(geometry.nameScrollHeight, `${label} name is not vertically clipped`).toBeLessThanOrEqual(geometry.nameClientHeight + 1)
    for (const [controlName, control] of [['Focus', geometry.focus], ['Replace', geometry.replace]] as const) {
      if (!control) continue
      expect.soft(overlaps(geometry.name, control), `${label} name clears ${controlName}`).toBe(false)
      expect.soft(overlaps(geometry.marks, control), `${label} marks clear ${controlName}`).toBe(false)
    }
  }
}

async function expectCandidateIdentityClearance(page: Page, destinationId: string): Promise<void> {
  const cards = await page.locator('.agent-pool-card').evaluateAll((elements) => elements.map((element) => {
    const bounds = (target: Element) => {
      const rect = target.getBoundingClientRect()
      return { bottom: rect.bottom, left: rect.left, right: rect.right, top: rect.top }
    }
    const info = element.querySelector('.agent-pool-card__info')!
    const name = element.querySelector('.agent-pool-card__name')!
    const identity = element.querySelector('.agent-pool-card__identity')!
    const portrait = element.querySelector('.party-editor__portrait--pool')!
    return {
      agent: (element as HTMLElement).dataset.agent,
      card: bounds(element),
      identity: bounds(identity),
      info: bounds(info),
      name: bounds(name),
      nameClientHeight: name.clientHeight,
      nameScrollHeight: name.scrollHeight,
      portrait: bounds(portrait),
    }
  }))

  expect.soft(cards, `${destinationId} candidate pool covers admitted roster`).toHaveLength(ADMITTED_AGENTS.length)
  for (const geometry of cards) {
    const label = `${destinationId} ${geometry.agent} candidate card`
    expect.soft(geometry.portrait.left, `${label} portrait starts inside card border`).toBeGreaterThanOrEqual(geometry.card.left)
    expect.soft(geometry.portrait.left, `${label} portrait stays against card edge`).toBeLessThanOrEqual(geometry.card.left + 1.5)
    expect.soft(geometry.portrait.top, `${label} portrait starts inside card border`).toBeGreaterThanOrEqual(geometry.card.top)
    expect.soft(geometry.portrait.top, `${label} portrait stays against card top`).toBeLessThanOrEqual(geometry.card.top + 1.5)
    expect.soft(geometry.portrait.bottom, `${label} portrait ends inside card border`).toBeLessThanOrEqual(geometry.card.bottom)
    expect.soft(geometry.portrait.bottom, `${label} portrait stays against card bottom`).toBeGreaterThanOrEqual(geometry.card.bottom - 1.5)
    expect.soft(geometry.info.right, `${label} identity ends inside card`).toBeLessThanOrEqual(geometry.card.right + 0.5)
    expect.soft(geometry.name.left, `${label} name clears portrait anchor`).toBeGreaterThanOrEqual(
      geometry.portrait.left + (geometry.portrait.right - geometry.portrait.left) * 0.6,
    )
    expect.soft(geometry.name.right, `${label} name ends inside card`).toBeLessThanOrEqual(geometry.card.right + 0.5)
    expect.soft(geometry.name.top, `${label} name starts inside card`).toBeGreaterThanOrEqual(geometry.card.top - 0.5)
    expect.soft(geometry.identity.bottom, `${label} marks end inside card`).toBeLessThanOrEqual(geometry.card.bottom + 0.5)
    expect.soft(geometry.name.bottom, `${label} name clears marks`).toBeLessThanOrEqual(geometry.identity.top + 0.5)
    expect.soft(geometry.nameScrollHeight, `${label} name is not vertically clipped`).toBeLessThanOrEqual(geometry.nameClientHeight + 1)
  }
}

async function captureDestinations(page: Page, party: PortraitParty): Promise<void> {
  for (const destination of destinations) {
    await page.setViewportSize(destination.viewport)

    await page.getByRole('button', { name: 'Edit party' }).click()
    const draftRail = page.locator('.party-editor__draft-rail')
    await expect.soft(draftRail.locator('.draft-slot')).toHaveCount(3)
    await expect.soft(draftRail.locator('.party-editor__portrait--draft img')).toHaveCount(3)
    expect(await draftRail.locator('.party-editor__portrait--draft img').evaluateAll((images) => (
      images.every((image) => (image as HTMLImageElement).src.includes('/selector-portraits/'))
    ))).toBe(true)
    await expectDraftIdentityClearance(page, party.id, destination.id)
    for (let slotIndex = 0; slotIndex < 3; slotIndex += 1) {
      const slot = draftRail.locator('.draft-slot').nth(slotIndex)
      await slot.click()
      await expect.soft(slot).toHaveClass(/\bis-target\b/)
      await expectDraftIdentityClearance(
        page,
        party.id,
        `${destination.id} target ${slotIndex + 1}`,
      )
      await slot.click()
      await expect.soft(slot).not.toHaveClass(/\bis-target\b/)
    }
    await expect.soft(draftRail).toHaveScreenshot(
      `${party.id}-${destination.id}-draft-rail.png`,
      { maxDiffPixelRatio: 0.001, stylePath: portraitSnapshotStyle },
    )
    await page.getByRole('button', { name: 'Cancel' }).click()

    for (const [memberIndex, agent] of party.members.entries()) {
      if (!party.captures.includes(agent)) continue
      const contrast = party.members[(memberIndex + 1) % party.members.length]

      await selectAgent(page, agent)
      await clearTransientSourceHighlight(page)
      await expect.soft(page.locator('.workspace-identity')).toHaveScreenshot(
        `${agent.slug}-${destination.id}-workspace-identity.png`,
        { maxDiffPixelRatio: 0.001, stylePath: portraitSnapshotStyle },
      )
      await expect.soft(agentTab(page, agent)).toHaveAttribute('aria-selected', 'true')
      await expect.soft(agentTab(page, agent)).toHaveScreenshot(
        `${agent.slug}-${destination.id}-selector.png`,
        { maxDiffPixelRatio: 0.001, stylePath: portraitSnapshotStyle },
      )

      await selectAgent(page, contrast)
      await expect.soft(agentTab(page, agent)).toHaveAttribute('aria-selected', 'false')
    }

    expect(await page.evaluate(() => (
      document.documentElement.scrollWidth <= document.documentElement.clientWidth
    ))).toBe(true)
  }
}

test('Party Edit candidate pool preserves every admitted upper-body portrait destination', async ({ page }) => {
  await applyParty(page, initiallyAppliedParty)

  for (const destination of destinations) {
    await page.setViewportSize(destination.viewport)
    await page.getByRole('button', { name: 'Edit party' }).click()
    await page.getByRole('button', { name: /^Replace slot 1,/ }).click()
    await waitForPortraits(page)

    const pool = page.getByRole('region', { name: 'Agent candidate pool' })
    const grid = pool.locator('.party-editor__pool-grid')
    await expect.soft(grid.locator('.party-editor__portrait--pool img')).toHaveCount(ADMITTED_AGENTS.length)
    expect(await grid.locator('.party-editor__portrait--pool img').evaluateAll((images) => (
      images.every((image) => (image as HTMLImageElement).src.includes('/selector-portraits/'))
    ))).toBe(true)
    await expectCandidateIdentityClearance(page, destination.id)
    await clearTransientSourceHighlight(page)
    await expect.soft(grid).toHaveScreenshot(
      `party-edit-candidate-pool-${destination.id}.png`,
      { maxDiffPixelRatio: 0.001, stylePath: [portraitSnapshotStyle, candidatePoolSnapshotStyle] },
    )
    await page.getByRole('button', { name: 'Cancel' }).click()
  }

  expect(runtimeFailures.get(page)).toEqual([])
})

test.beforeEach(async ({ page }) => {
  const failures: string[] = []
  runtimeFailures.set(page, failures)
  page.on('console', (message) => {
    if (message.type() === 'error') failures.push(`console.error: ${message.text()}`)
  })
  page.on('pageerror', (error) => failures.push(`pageerror: ${error.message}`))
  await page.goto('/')
  await waitForPortraits(page)
})

for (const party of parties) {
  test(`${party.id} preserves selector and workspace portrait destinations`, async ({ page }) => {
    await applyParty(page, party)
    await captureDestinations(page, party)
    expect(runtimeFailures.get(page)).toEqual([])
  })
}

test('the real party surface keeps pointer and keyboard destination changes accessible', async ({ page }) => {
  const party = parties.find(({ id }) => id === 'portrait-corrections-a')!
  await applyParty(page, party)

  const nekomata = agentTab(page, agents.nekomata)
  await nekomata.press('Enter')
  await expect(nekomata).toHaveAttribute('aria-selected', 'true')

  await page.setViewportSize(destinations[1].viewport)
  const ben = agentTab(page, agents.ben)
  await ben.click()
  await expect(ben).toHaveAttribute('aria-selected', 'true')
  expect(await page.evaluate(() => (
    document.documentElement.scrollWidth <= document.documentElement.clientWidth
  ))).toBe(true)
  expect(runtimeFailures.get(page)).toEqual([])
})

test('the selector rail keeps fixed one-row geometry through responsive boundaries', async ({ page }) => {
  await applyParty(page, parties.find(({ id }) => id === 'portrait-calibration-long-name')!)

  for (const width of [1440, 1340, 1339, 1280, 1271, 1041, 1040, 761, 760, 520, 320]) {
    await page.setViewportSize({ width, height: 900 })

    const geometry = await page.locator('.party-selector').evaluateAll((selectors) => selectors.map((selector) => {
      const rect = selector.getBoundingClientRect()
      const identity = selector.querySelector('.party-selector__identity')!.getBoundingClientRect()
      const name = selector.querySelector('.identity-name')!.getBoundingClientRect()
      const band = selector.querySelector('.identity-band')!.getBoundingClientRect()
      return {
        bandBottom: band.bottom,
        height: rect.height,
        identityWidth: identity.width,
        nameBottom: name.bottom,
        selectorBottom: rect.bottom,
        top: rect.top,
        width: rect.width,
      }
    }))

    expect(geometry).toHaveLength(3)
    expect(new Set(geometry.map(({ height }) => height)).size).toBe(1)
    expect(new Set(geometry.map(({ top }) => top)).size).toBe(1)
    for (const { bandBottom, height, identityWidth, nameBottom, selectorBottom, width: selectorWidth } of geometry) {
      expect(height, `selector height at ${width}px`).toBeCloseTo(width <= 760 ? 82 : 88, 1)
      expect(selectorWidth, `selector width at ${width}px`).toBeGreaterThan(0)
      expect(identityWidth, `identity width at ${width}px`).toBeGreaterThanOrEqual(40)
      expect(nameBottom, `name-to-band order at ${width}px`).toBeLessThanOrEqual(bandBottom)
      expect(bandBottom, `identity content at ${width}px`).toBeLessThanOrEqual(selectorBottom + 0.5)
    }
    expect(await page.evaluate(() => (
      document.documentElement.scrollWidth <= document.documentElement.clientWidth
    ))).toBe(true)

    const workspaceEdges = await page.locator('.party-workspace').evaluate((workspace) => {
      const workspaceRect = workspace.getBoundingClientRect()
      const resultRect = workspace.querySelector('.result-panel')!.getBoundingClientRect()
      return {
        resultLeft: resultRect.left,
        resultRight: resultRect.right,
        workspaceLeft: workspaceRect.left,
        workspaceRight: workspaceRect.right,
      }
    })
    expect(workspaceEdges.resultLeft, `Result left edge at ${width}px`)
      .toBeGreaterThanOrEqual(workspaceEdges.workspaceLeft - 1)
    expect(workspaceEdges.resultRight, `Result right edge at ${width}px`)
      .toBeLessThanOrEqual(workspaceEdges.workspaceRight + 2)
  }

  await page.setViewportSize({ width: 750, height: 500 })
  await page.evaluate(() => window.scrollTo(0, 600))
  const stickyEdges = await page.evaluate(() => {
    const masthead = document.querySelector('.masthead')!.getBoundingClientRect()
    const rail = document.querySelector('.party-rail')!.getBoundingClientRect()
    return {
      mastheadBottom: masthead.bottom,
      mastheadTop: masthead.top,
      railTop: rail.top,
    }
  })
  expect(stickyEdges.mastheadTop).toBeGreaterThanOrEqual(-1)
  expect(stickyEdges.railTop).toBeGreaterThanOrEqual(stickyEdges.mastheadBottom - 1)

  expect(runtimeFailures.get(page)).toEqual([])
})
