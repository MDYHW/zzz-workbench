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
  ben: { candidateName: 'Ben Bigger, Fire, Defense', displayName: 'Ben Bigger', slug: 'ben' },
  koleda: { candidateName: 'Koleda Belobog, Fire, Stun', displayName: 'Koleda Belobog', slug: 'koleda' },
  zhao: { candidateName: 'Zhao, Ice, Defense', displayName: 'Zhao', slug: 'zhao' },
  anbySoldier0: {
    candidateName: 'Anby: Soldier 0, Electric, Attack',
    displayName: 'Anby: Soldier 0',
    slug: 'anby-soldier-0',
  },
  grace: { candidateName: 'Grace Howard, Electric, Anomaly', displayName: 'Grace Howard', slug: 'grace' },
  piper: { candidateName: 'Piper Wheel, Physical, Anomaly', displayName: 'Piper Wheel', slug: 'piper' },
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
    captures: [agents.koleda, agents.zhao],
    members: [agents.koleda, agents.zhao, agents.anbySoldier0],
  },
  {
    id: 'portrait-piper-anomaly',
    focus: 'Piper Wheel',
    captures: [agents.piper],
    members: [agents.piper, agents.grace, agents.ben],
  },
]

const destinations = [
  { id: 'desktop', viewport: { width: 1440, height: 1000 } },
  { id: 'narrow', viewport: { width: 750, height: 900 } },
] as const

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function agentTab(page: Page, agent: PortraitAgent) {
  return page.getByRole('tab', {
    name: new RegExp(`^(?:View|Close) ${escapeRegExp(agent.displayName)} setup and Result$`),
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

  if (party.focus) await page.getByRole('radio', { name: party.focus, exact: true }).click()
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
      await expect.soft(page.locator('.slot-identity--expanded')).toHaveScreenshot(
        `${agent.slug}-${destination.id}-expanded.png`,
      )

      await selectAgent(page, contrast)
      await clearTransientSourceHighlight(page)
      await expect.soft(agentTab(page, agent)).toHaveAttribute('aria-label', `View ${agent.displayName} setup and Result`)
      await expect.soft(agentTab(page, agent)).toHaveScreenshot(`${agent.slug}-${destination.id}-compact.png`)
    }

    expect(await page.evaluate(() => (
      document.documentElement.scrollWidth <= document.documentElement.clientWidth
    ))).toBe(true)
  }
}

test.beforeEach(async ({ page }) => {
  await page.goto('/')
  await waitForPortraits(page)
})

for (const party of parties) {
  test(`${party.id} preserves the four shared portrait destinations`, async ({ page }) => {
    await applyParty(page, party)
    await captureDestinations(page, party)
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
})
