import { expect, test, type Page } from '@playwright/test'

type PortraitAgent = {
  candidateName: string
  displayName: string
  slug: string
}

type PortraitParty = {
  id: string
  focus?: string
  captures: readonly PortraitAgent[]
  members: readonly [PortraitAgent, PortraitAgent, PortraitAgent]
}

const agents = {
  pulchra: { candidateName: 'Pulchra, Physical, Stun', displayName: 'Pulchra', slug: 'pulchra' },
  nekomata: { candidateName: 'Nekomata, Physical, Attack', displayName: 'Nekomata', slug: 'nekomata' },
  ben: { candidateName: 'Ben, Fire, Defense', displayName: 'Ben', slug: 'ben' },
  koleda: { candidateName: 'Koleda, Fire, Stun', displayName: 'Koleda', slug: 'koleda' },
  zhao: { candidateName: 'Zhao, Ice, Defense', displayName: 'Zhao', slug: 'zhao' },
  anbySoldier0: {
    candidateName: 'Anby: Soldier 0, Electric, Attack',
    displayName: 'Anby: Soldier 0',
    slug: 'anby-soldier-0',
  },
  grace: { candidateName: 'Grace Howard, Electric, Anomaly', displayName: 'Grace Howard', slug: 'grace' },
  piper: { candidateName: 'Piper, Physical, Anomaly', displayName: 'Piper', slug: 'piper' },
  yanagi: {
    candidateName: 'Yanagi, Electric, Anomaly',
    displayName: 'Yanagi',
    slug: 'yanagi',
  },
  alice: {
    candidateName: 'Alice, Physical, Anomaly',
    displayName: 'Alice',
    slug: 'alice',
  },
  vivian: { candidateName: 'Vivian, Ether, Anomaly', displayName: 'Vivian', slug: 'vivian' },
  aria: { candidateName: 'Aria, Ether, Anomaly', displayName: 'Aria', slug: 'aria' },
  promeia: { candidateName: 'Promeia, Ice, Anomaly', displayName: 'Promeia', slug: 'promeia' },
  sunna: { candidateName: 'Sunna, Physical, Support', displayName: 'Sunna', slug: 'sunna' },
  nangongYu: {
    candidateName: 'Nangong Yu, Ether, Stun',
    displayName: 'Nangong Yu',
    slug: 'nangong-yu',
  },
  miyabi: {
    candidateName: 'Miyabi, Frost, Anomaly',
    displayName: 'Miyabi',
    slug: 'miyabi',
  },
  anton: { candidateName: 'Anton, Electric, Attack', displayName: 'Anton', slug: 'anton' },
  rina: { candidateName: 'Rina, Electric, Support', displayName: 'Rina', slug: 'rina' },
  velina: { candidateName: 'Velina, Wind, Anomaly', displayName: 'Velina', slug: 'velina' },
} satisfies Record<string, PortraitAgent>

const parties: readonly PortraitParty[] = [
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

  for (const [index, agent] of party.members.entries()) {
    await page.getByRole('button', { name: new RegExp(`^Replace slot ${index + 1},`) }).click()
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
  await page.getByRole('button', { name: 'Apply party' }).click()
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
        { maxDiffPixelRatio: 0.001 },
      )
      await expect.soft(agentTab(page, agent)).toHaveAttribute('aria-selected', 'true')
      await expect.soft(agentTab(page, agent)).toHaveScreenshot(
        `${agent.slug}-${destination.id}-selector.png`,
        { maxDiffPixelRatio: 0.001 },
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
  const party = parties[0]
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
  await applyParty(page, parties[1])

  for (const width of [1440, 1280, 1270, 1041, 1040, 761, 760, 520, 320]) {
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
      expect(height, `selector height at ${width}px`).toBeCloseTo(132, 1)
      expect(selectorWidth, `selector width at ${width}px`).toBeGreaterThan(0)
      expect(identityWidth, `identity width at ${width}px`).toBeGreaterThanOrEqual(40)
      expect(nameBottom, `name-to-band order at ${width}px`).toBeLessThanOrEqual(bandBottom)
      expect(bandBottom, `identity content at ${width}px`).toBeLessThanOrEqual(selectorBottom)
    }
    expect(await page.evaluate(() => (
      document.documentElement.scrollWidth <= document.documentElement.clientWidth
    ))).toBe(true)
  }

  expect(runtimeFailures.get(page)).toEqual([])
})
