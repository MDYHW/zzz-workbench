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

const portraitSnapshotStyle = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  'portrait-snapshot.css',
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
  candidateName: `${agentDisplayName(agent)}, ${agent.attribute}, ${agent.specialty}`,
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
    const focusChoice = page.getByRole('radio', { name: party.focus, exact: true })
    if (await focusChoice.count()) {
      await focusChoice.click()
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

async function captureDestinations(page: Page, party: PortraitParty): Promise<void> {
  for (const destination of destinations) {
    await page.setViewportSize(destination.viewport)

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
