import { render, screen, within, act, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { App } from './App'

describe('integrated party workbench: result', () => {
  it('projects Evelyn’s active and inactive Chain-and-Ultimate scale through the existing Result hierarchy', async () => {
    const user = userEvent.setup()
    render(<App />)
    const replace = async (slot: number, agent: RegExp) => {
      await user.click(screen.getByRole('button', { name: new RegExp(`Replace slot ${slot},`) }))
      await user.click(screen.getByRole('button', { name: agent }))
    }

    await user.click(screen.getByRole('button', { name: 'Edit party' }))
    await replace(1, /Evelyn, Fire, Attack/)
    await replace(2, /Dialyn, Physical, Stun/)
    await replace(3, /Astra Yao, Ether, Support/)
    await user.click(screen.getByRole('button', { name: 'Apply party' }))

    const evelynResult = screen.getByRole('region', { name: 'Evelyn Result' })
    await user.click(within(evelynResult).getByRole('button', { name: 'CRIT Rate' }))
    expect(within(evelynResult).getByRole('group', {
      name: /Combat CRIT Rate: current 92[.]4, cap 100, threshold 80, Active; Chain Attack & Ultimate DMG Multiplier: ×1[.]25/,
    })).toBeInTheDocument()
    expect(within(evelynResult).getByRole('region', { name: 'Agent operations' }))
      .toHaveTextContent('×1.25')

    await user.click(within(evelynResult).getByRole('button', { name: 'DMG Bonus' }))
    const outcomes = within(evelynResult).getByRole('table', { name: 'DMG Bonus action outcome values' })
    expect(within(outcomes).getByText('Chain Attack')).toBeInTheDocument()
    expect(within(outcomes).getByText('Ultimate')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Non-limited' }))
    expect(within(evelynResult).getByRole('group', {
      name: /Fully Enabled CRIT Rate: current 68[.]4, cap 100, threshold 80; Chain Attack & Ultimate DMG Multiplier: ×1[.]00/,
    })).toBeInTheDocument()
    expect(within(evelynResult).queryByRole('region', { name: 'Agent operations' })).not.toBeInTheDocument()
  }, 10_000)

  it('renders Cissia Core precision without rounding its calculation basis', async () => {
    const user = userEvent.setup()
    render(<App />)
    const replace = async (slot: number, agent: RegExp) => {
      await user.click(screen.getByRole('button', { name: new RegExp(`Replace slot ${slot},`) }))
      await user.click(screen.getByRole('button', { name: agent }))
    }

    await user.click(screen.getByRole('button', { name: 'Edit party' }))
    await replace(1, /Seed, Electric, Attack/)
    await replace(2, /Cissia, Electric, Attack/)
    await replace(3, /Astra Yao, Ether, Support/)
    await user.click(screen.getByRole('button', { name: 'Apply party' }))

    await user.click(screen.getByRole('tab', { name: 'View Cissia setup and Result' }))

    const cissiaResult = screen.getByRole('region', { name: 'Cissia Result' })
    await user.click(within(cissiaResult).getByRole('button', { name: 'Energy Regen' }))
    expect(within(cissiaResult).getByRole('group', {
      name: /Initial Energy Regen: current 3[.]744, cap 3[.]68, threshold 1[.]4; Electric DEF Ignore: [+]25[.]000%, cap 25%/,
    })).toBeInTheDocument()
  })

  it('links received Seed and Cissia sources to their compact provider slots', async () => {
    const user = userEvent.setup()
    render(<App />)
    const replace = async (slot: number, agent: RegExp) => {
      await user.click(screen.getByRole('button', { name: new RegExp(`Replace slot ${slot},`) }))
      await user.click(screen.getByRole('button', { name: agent }))
    }

    await user.click(screen.getByRole('button', { name: 'Edit party' }))
    await replace(1, /Seed, Electric, Attack/)
    await replace(2, /Cissia, Electric, Attack/)
    await replace(3, /Astra Yao, Ether, Support/)
    await user.click(screen.getByRole('button', { name: 'Apply party' }))

    const seedResult = screen.getByRole('region', { name: 'Seed Result' })
    await user.click(within(seedResult).getByRole('button', { name: 'DEF Ignore' }))
    const seedSources = within(seedResult).getByRole('table', {
      name: 'DEF Ignore source contributions',
    })
    const cissiaSource = within(seedSources).getByRole('row', {
      name: /Cissia.*Core Passive/,
    })
    const cissiaSlot = screen.getByRole('tab', { name: 'View Cissia setup and Result' })
    expect(cissiaSource).toHaveAttribute('data-source-tone', 'agent-cissia')

    await user.hover(cissiaSource)
    expect(cissiaSlot).toHaveClass('is-source-active')
    expect(screen.getByRole('region', { name: 'Seed Result' })).toBeInTheDocument()
    await user.unhover(cissiaSource)
    expect(cissiaSlot).not.toHaveClass('is-source-active')

    act(() => within(cissiaSource).getByRole('rowheader').focus())
    expect(cissiaSlot).toHaveClass('is-source-active')
    act(() => within(cissiaSource).getByRole('rowheader').blur())
    expect(cissiaSlot).not.toHaveClass('is-source-active')

    await user.click(cissiaSlot)
    const cissiaResult = screen.getByRole('region', { name: 'Cissia Result' })
    await user.click(within(cissiaResult).getByRole('button', { name: 'CRIT DMG' }))
    const cissiaSources = within(cissiaResult).getByRole('table', {
      name: 'CRIT DMG source contributions',
    })
    const seedSource = within(cissiaSources).getByRole('row', {
      name: /Seed.*Core Passive/,
    })
    expect(seedSource).toHaveAttribute('data-source-tone', 'agent-seed')
    await user.hover(seedSource)
    expect(screen.getByRole('tab', { name: 'View Seed setup and Result' }))
      .toHaveClass('is-source-active')
  })

  it('keeps Seed M2 complete when no eligible Vanguard can establish Besiege pressure', async () => {
    const user = userEvent.setup()
    render(<App />)
    const replace = async (slot: number, agent: RegExp) => {
      await user.click(screen.getByRole('button', { name: new RegExp(`Replace slot ${slot},`) }))
      await user.click(screen.getByRole('button', { name: agent }))
    }

    await user.click(screen.getByRole('button', { name: 'Edit party' }))
    await replace(1, /Seed, Electric, Attack/)
    await replace(2, /Yixuan, Auric Ink, Rupture/)
    await replace(3, /Astra Yao, Ether, Support/)
    await user.click(screen.getByRole('radio', { name: 'Seed' }))
    await user.click(screen.getByRole('button', { name: 'Apply party' }))

    await user.click(screen.getByRole('button', { name: 'M2' }))
    expect(screen.getByRole('heading', { name: 'Seed Result' })).toBeInTheDocument()
    expect(screen.getByText('PREPARED')).toBeInTheDocument()

    await user.click(screen.getByRole('button', {
      name: 'Change 2-piece Drive Disc from Woodpecker Electro',
    }))
    expect(screen.getByRole('button', {
      name: 'Select Puffer Electro as twoPiece',
    })).toBeInTheDocument()
    await user.click(screen.getByRole('button', {
      name: 'Change 2-piece Drive Disc from Woodpecker Electro',
    }))
    await user.click(screen.getByRole('button', {
      name: 'Change Disc 5 main stat from Electric DMG',
    }))
    expect(screen.getByRole('button', {
      name: 'Select PEN Ratio for Disc 5',
    })).toBeInTheDocument()
  })

  it('renders a Result quantity only while it has a current consumer', async () => {
    const user = userEvent.setup()
    render(<App />)

    const result = screen.getByRole('region', { name: 'Yixuan Result' })
    expect(within(result).queryByText('RES Ignore')).not.toBeInTheDocument()

    const yixuanMindscape = screen.getByRole('group', { name: 'Mindscape' })
    await user.click(within(yixuanMindscape).getByRole('button', { name: 'M2' }))
    await user.click(within(result).getByRole('button', { name: 'RES Ignore' }))

    expect(within(result).getByRole('row', {
      name: /EX Special Attack.*Ultimate.*15[.]0%/,
    })).toBeInTheDocument()

    await user.click(within(yixuanMindscape).getByRole('button', { name: 'M1' }))
    expect(within(result).queryByText('RES Ignore')).not.toBeInTheDocument()

    await user.click(screen.getByRole('tab', { name: 'View Dialyn setup and Result' }))
    const dialynMindscape = screen.getByRole('group', { name: 'Mindscape' })
    await user.click(within(dialynMindscape).getByRole('button', { name: 'M1' }))
    await user.click(screen.getByRole('tab', { name: 'View Yixuan setup and Result' }))

    const currentResult = screen.getByRole('region', { name: 'Yixuan Result' })
    const resIgnore = within(currentResult).getByRole('button', {
      name: 'RES Ignore',
    })
    expect(within(currentResult).getByRole('row', {
      name: /RES Ignore.*0[.]0%.*0[.]0%.*15[.]0%/,
    })).toBeInTheDocument()
    expect(resIgnore).toHaveAttribute('aria-expanded', 'false')
  })

  it('links changed equipment sources back to the current setup locus', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.click(screen.getByRole('button', {
      name: 'Change 2-piece Drive Disc from Woodpecker Electro',
    }))
    await user.click(screen.getByRole('button', {
      name: 'Select Branch & Blade Song as twoPiece',
    }))
    await user.click(screen.getByRole('button', { name: 'CRIT DMG' }))

    const sources = screen.getByRole('table', {
      name: 'CRIT DMG source contributions',
    })
    const branchSource = within(sources).getByRole('row', {
      name: /Branch & Blade Song/,
    })
    const setupTarget = document.querySelector<HTMLElement>(
      '.disc-selection[data-source-tone="disc-2pc"]',
    )!

    await user.hover(branchSource)
    expect(setupTarget).toHaveClass('is-source-active')
    await user.unhover(branchSource)
    await user.hover(setupTarget)
    expect(branchSource).toHaveClass('is-source-active')
  })

  it('links selected Puffer to Anby’s Disc and nests only Ultimate under Aftershock', async () => {
    const user = userEvent.setup()
    render(<App />)
    const replace = async (slot: number, agent: RegExp) => {
      await user.click(screen.getByRole('button', { name: new RegExp(`Replace slot ${slot},`) }))
      await user.click(screen.getByRole('button', { name: agent }))
    }

    await user.click(screen.getByRole('button', { name: 'Edit party' }))
    await replace(1, /Anby: Soldier 0, Electric, Attack/)
    await replace(2, /Dialyn, Physical, Stun/)
    await replace(3, /Astra Yao, Ether, Support/)
    await user.click(screen.getByRole('button', { name: 'Apply party' }))

    await user.click(screen.getByRole('button', {
      name: 'Change 4-piece Drive Disc from Shadow Harmony',
    }))
    await user.click(screen.getByRole('button', {
      name: 'Select Puffer Electro as fourPiece',
    }))

    const anbyResult = screen.getByRole('region', { name: 'Anby: Soldier 0 Result' })
    await user.click(within(anbyResult).getByRole('button', { name: 'PEN Ratio' }))
    const penSources = within(anbyResult).getByRole('table', {
      name: 'PEN Ratio source contributions',
    })
    const pufferSource = within(penSources).getByRole('row', {
      name: /Puffer Electro.*2-piece/,
    })
    const discTarget = document.querySelector<HTMLElement>(
      '.disc-selection[data-source-tone="disc-4pc"]',
    )!
    await user.hover(pufferSource)
    expect(discTarget).toHaveClass('is-source-active')
    await user.unhover(pufferSource)

    await user.click(within(anbyResult).getByRole('button', { name: 'DMG Bonus' }))
    const outcomes = within(anbyResult).getByRole('table', {
      name: 'DMG Bonus action outcome values',
    })
    const aftershock = within(outcomes).getByRole('button', { name: 'Show sources for Aftershock' })
    const ultimate = within(outcomes).getByRole('button', { name: 'Show sources for Ultimate' })
    expect(aftershock.closest('tr')).not.toHaveClass('action-outcome--variant')
    expect(ultimate.closest('tr')).toHaveClass('action-outcome--variant')

    await user.click(aftershock)
    expect(within(outcomes).queryByRole('row', { name: /Puffer Electro/ })).not.toBeInTheDocument()
    await user.click(ultimate)
    expect(within(outcomes).getByRole('row', { name: /Puffer Electro.*[+]20[.]0%/ }))
      .toHaveAttribute('data-source-tone', 'disc-4pc')
    expect(within(anbyResult).queryByRole('region', { name: 'Agent operations' }))
      .not.toBeInTheDocument()
    expect(within(anbyResult).queryByText(/Positive Reviews|Ultimate opportunity/i))
      .not.toBeInTheDocument()
  })

  it('links local Mindscape sources and discloses the M4 action outcome', async () => {
    const user = userEvent.setup()
    render(<App />)

    const mindscape = screen.getByRole('group', { name: 'Mindscape' })
    await user.click(within(mindscape).getByRole('button', { name: 'M4' }))
    await user.click(screen.getByRole('button', { name: 'CRIT Rate' }))

    const critSources = screen.getByRole('table', {
      name: 'CRIT Rate source contributions',
    })
    const m1Source = within(critSources).getByRole('row', {
      name: /Mindscape.*M1.*[+]10[.]0%/,
    })
    const mindscapeTarget = document.querySelector<HTMLElement>(
      '.mindscape-control[data-source-tone="mindscape"]',
    )!

    expect(m1Source).toHaveAttribute('data-source-tone', 'mindscape')
    await user.hover(m1Source)
    expect(mindscapeTarget).toHaveClass('is-source-active')
    await user.unhover(m1Source)
    await user.hover(mindscapeTarget)
    expect(m1Source).toHaveClass('is-source-active')
    await user.unhover(mindscapeTarget)

    await user.click(screen.getByRole('button', { name: 'DMG Bonus' }))
    const outcomes = screen.getByRole('table', {
      name: 'DMG Bonus action outcome values',
    })
    const m4Action = within(outcomes).getByRole('button', {
      name: /Show sources for EX Special Attack: Cloud-Shaper, EX Special Attack: Ashen Ink Becomes Shadows/,
    })
    await user.click(m4Action)
    expect(within(outcomes).getByRole('row', {
      name: /Mindscape.*M4.*30% x 2 stacks.*[+]60[.]0%/,
    })).toHaveAttribute('data-source-tone', 'mindscape')
  })

  it('shows Dialyn M2 as a cross-Agent Result source only on Yixuan', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.click(screen.getByRole('tab', { name: 'View Dialyn setup and Result' }))
    const mindscape = screen.getByRole('group', { name: 'Mindscape' })
    await user.click(within(mindscape).getByRole('button', { name: 'M2' }))
    await user.click(screen.getByRole('tab', { name: 'View Yixuan setup and Result' }))

    await user.click(screen.getByRole('button', { name: 'DMG Bonus' }))
    const dmgSources = screen.getByRole('table', {
      name: 'DMG Bonus source contributions',
    })
    expect(within(dmgSources).getByRole('row', {
      name: /Dialyn.*Mindscape.*M2.*against Malicious Complaint.*[+]15[.]0%/,
    })).toHaveAttribute('data-source-tone', 'agent-dialyn')

    await user.click(screen.getByRole('button', { name: 'Stun DMG Multiplier' }))
    const stunSources = screen.getByRole('table', {
      name: 'Stun DMG Multiplier source contributions',
    })
    expect(within(stunSources).getByRole('row', {
      name: /Dialyn.*Mindscape.*M2.*[+]20[.]0%/,
    })).toHaveAttribute('data-source-tone', 'agent-dialyn')

    await user.click(screen.getByRole('tab', { name: 'View Dialyn setup and Result' }))
    expect(screen.queryByRole('table', {
      name: 'DMG Bonus source contributions',
    })).not.toBeInTheDocument()
  })

  it('shows Lucia M3 and M5 skill tiers in the gauge and Yixuan Result', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.click(screen.getByRole('tab', { name: 'View Lucia setup and Result' }))
    const mindscape = screen.getByRole('group', { name: 'Mindscape' })
    await user.click(within(mindscape).getByRole('button', { name: 'M3' }))
    await user.click(screen.getByRole('button', { name: 'Max HP' }))

    const m3Gauge = screen.getByRole('group', {
      name: /Initial Max HP: current 21,697[.]1, cap 24,000; Squad Sheer Force: [+]858[.]2, cap 948/,
    })
    expect(m3Gauge).toHaveAttribute('data-source-tone', 'mindscape')
    expect(within(m3Gauge).getByText('+858.2 / 948')).toBeInTheDocument()
    expect(within(m3Gauge).getByText('M3 tier')).toBeInTheDocument()

    await user.click(within(mindscape).getByRole('button', { name: 'M5' }))
    const m5Gauge = screen.getByRole('group', {
      name: /Initial Max HP: current 21,697[.]1, cap 24,000; Squad Sheer Force: [+]901[.]6, cap 996/,
    })
    expect(m5Gauge).toHaveAttribute('data-source-tone', 'mindscape')
    expect(within(m5Gauge).getByText('+901.6 / 996')).toBeInTheDocument()
    expect(within(m5Gauge).getByText('M5 tier')).toBeInTheDocument()

    await user.click(screen.getByRole('tab', { name: 'View Yixuan setup and Result' }))
    await user.click(screen.getByRole('button', { name: 'Sheer Force' }))
    const sheerSources = screen.getByRole('table', {
      name: 'Sheer Force source contributions',
    })
    expect(within(sheerSources).getByRole('row', {
      name: /Lucia.*EX Special Attack.*M5 tier.*[+]901[.]6/,
    })).toHaveAttribute('data-source-tone', 'agent-lucia')

    await user.click(screen.getByRole('button', { name: 'Sheer DMG Bonus' }))
    const sheerDmgSources = screen.getByRole('table', {
      name: 'Sheer DMG Bonus source contributions',
    })
    expect(within(sheerDmgSources).getByRole('row', {
      name: /Lucia.*Mindscape.*M2.*Darkbreaker.*Wellspring.*[+]15[.]0%/,
    })).toHaveAttribute('data-source-tone', 'agent-lucia')
  })

  it('links every prepared Drive Disc source to its visible setup surface', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.click(screen.getByRole('button', { name: 'Max HP' }))
    await user.click(screen.getByRole('button', { name: /^CRIT Rate$/ }))
    await user.click(screen.getByRole('button', { name: 'DMG Bonus' }))

    const maxHpSources = screen.getByRole('table', {
      name: 'Max HP source contributions',
    })
    const critRateSources = screen.getByRole('table', {
      name: 'CRIT Rate source contributions',
    })
    const dmgBonusSources = screen.getByRole('table', {
      name: 'DMG Bonus source contributions',
    })
    const links = [
      {
        source: within(critRateSources).getByRole('row', { name: /Yunkui Tales.*4-piece/ }),
        target: '.disc-selection[data-source-tone="disc-4pc"]',
      },
      {
        source: within(critRateSources).getByRole('row', { name: /Woodpecker Electro.*2-piece/ }),
        target: '.disc-selection[data-source-tone="disc-2pc"]',
      },
      {
        source: within(critRateSources).getByRole('row', { name: /Drive Disc.*Slot 4/ }),
        target: '.main-stat-selection[data-source-tone="disc-slot-4"]',
      },
      {
        source: within(dmgBonusSources).getByRole('row', { name: /Drive Disc.*Slot 5/ }),
        target: '.main-stat-selection[data-source-tone="disc-slot-5"]',
      },
      {
        source: within(maxHpSources).getByRole('row', { name: /Drive Disc.*Slot 6/ }),
        target: '.main-stat-selection[data-source-tone="disc-slot-6"]',
      },
    ]

    for (const link of links) {
      const target = document.querySelector<HTMLElement>(link.target)!
      await user.hover(link.source)
      expect(target).toHaveClass('is-source-active')
      await user.unhover(link.source)
      await user.hover(target)
      expect(link.source).toHaveClass('is-source-active')
      await user.unhover(target)
    }
  }, 10_000)

  it('activates and clears every remaining visible setup source target', async () => {
    const user = userEvent.setup()
    render(<App />)

    const targets = [
      document.querySelector<HTMLElement>('.equipment-fieldset[data-source-tone="w-engine"]')!,
      document.querySelector<HTMLElement>('.substat-control[data-source-tone="substat-1"]')!,
      document.querySelector<HTMLElement>('.substat-control[data-source-tone="substat-2"]')!,
      document.querySelector<HTMLElement>('.substat-control[data-source-tone="substat-3"]')!,
      screen.getByRole('tab', { name: 'Close Yixuan setup and Result' }),
      screen.getByRole('tab', { name: 'View Dialyn setup and Result' }),
      screen.getByRole('tab', { name: 'View Lucia setup and Result' }),
    ]

    for (const target of targets) {
      await user.hover(target)
      expect(target).toHaveClass('is-source-active')
      await user.unhover(target)
      expect(target).not.toHaveClass('is-source-active')
    }
  })

  it('replaces obsolete source text while keeping the newly selected engine connected', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.click(screen.getByRole('button', { name: 'CRIT Rate' }))
    const initialSources = screen.getByRole('table', {
      name: 'CRIT Rate source contributions',
    })
    const qingming = within(initialSources).getByRole('row', {
      name: /Qingming Birdcage/,
    })
    await user.hover(qingming)
    expect(qingming).toHaveClass('is-source-active')

    await user.click(screen.getByRole('button', {
      name: 'Change W-Engine from Qingming Birdcage',
    }))
    await user.click(screen.getByRole('button', {
      name: 'Select Cauldron of Clarity W5',
    }))

    const changedSources = screen.getByRole('table', {
      name: 'CRIT Rate source contributions',
    })
    expect(within(changedSources).queryByRole('row', { name: /Qingming/ }))
      .not.toBeInTheDocument()
    expect(within(changedSources).getByRole('row', { name: /Cauldron of Clarity/ }))
      .toHaveClass('is-source-active')
    expect(document.querySelector('.equipment-fieldset[data-source-tone="w-engine"]'))
      .toHaveClass('is-source-active')
    expect(screen.getByRole('button', {
      name: 'Change W-Engine from Cauldron of Clarity',
    })).toHaveFocus()
  })

  it('clears an active source link when an authorized preparation context changes', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.click(screen.getByRole('button', { name: 'CRIT Rate' }))
    const sources = screen.getByRole('table', { name: 'CRIT Rate source contributions' })
    const qingming = within(sources).getByRole('row', { name: /Qingming Birdcage/ })
    fireEvent.mouseEnter(qingming)
    expect(qingming).toHaveClass('is-source-active')
    expect(document.querySelector('.equipment-fieldset[data-source-tone="w-engine"]'))
      .toHaveClass('is-source-active')

    const mindscape = screen.getByRole('group', { name: 'Mindscape' })
    fireEvent.click(within(mindscape).getByRole('button', { name: 'M1' }))

    expect(qingming).not.toHaveClass('is-source-active')
    expect(document.querySelector('.equipment-fieldset[data-source-tone="w-engine"]'))
      .not.toHaveClass('is-source-active')
  })

  it('keeps common sources before nested action outcomes', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.click(screen.getByRole('button', { name: 'DMG Bonus' }))
    expect(screen.getByRole('table', {
      name: 'DMG Bonus source contributions',
    })).toBeInTheDocument()
    const outcomes = screen.getByRole('table', {
      name: 'DMG Bonus action outcome values',
    })
    expect(within(outcomes).getByText('Basic Attack')).toBeInTheDocument()
    expect(within(outcomes).getByText('Ultimate')).toBeInTheDocument()

    const sharedAction = within(outcomes).getByRole('button', {
      name: /Show sources for Basic Attack, EX Special Attack, Assist Follow-Up, Chain Attack, Ultimate/,
    })
    const sharedActionIndicator = sharedAction.querySelector('i')
    expect(sharedAction).toHaveAttribute('aria-expanded', 'false')
    expect(sharedActionIndicator).toHaveTextContent('+')
    await user.click(sharedAction)
    expect(sharedAction).toHaveAttribute('aria-expanded', 'true')
    expect(sharedActionIndicator).toHaveTextContent('\u2212')
    expect(within(outcomes).getByRole('row', {
      name: /Core Passive.*\+60\.0%/,
    })).toHaveAttribute('data-source-tone', 'core')

    const exAction = within(outcomes).getByRole('button', {
      name: 'Show sources for EX Special Attack',
    })
    await user.click(exAction)
    expect(within(outcomes).getByRole('row', {
      name: /Additional Ability.*\+30\.0%/,
    })).toHaveAttribute('data-source-tone', 'additional')
  })

  it('keeps a focused Result source active until blur', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.click(screen.getByRole('button', { name: 'DMG Bonus' }))
    const sources = screen.getByRole('table', {
      name: 'DMG Bonus source contributions',
    })
    const qingming = within(sources).getByRole('row', {
      name: /Qingming Birdcage/,
    })
    const focusTarget = within(qingming).getByRole('rowheader')

    act(() => focusTarget.focus())
    await user.hover(qingming)
    await user.unhover(qingming)
    expect(qingming).toHaveClass('is-source-active')
    act(() => focusTarget.blur())
    expect(qingming).not.toHaveClass('is-source-active')
  })

  it('presents the second trio derived source, gauge, cross-Agent link, and M4 operation separately', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.click(screen.getByRole('button', { name: 'Edit party' }))
    const replace = async (slot: number, agent: RegExp) => {
      await user.click(screen.getByRole('button', { name: new RegExp(`Replace slot ${slot},`) }))
      await user.click(screen.getByRole('button', { name: agent }))
    }
    await replace(1, /Anby: Soldier 0, Electric, Attack/)
    await replace(2, /Trigger, Electric, Stun/)
    await replace(3, /Astra Yao, Ether, Support/)
    await user.click(screen.getByRole('button', { name: 'Apply party' }))

    const anbyResult = screen.getByRole('region', { name: 'Anby: Soldier 0 Result' })
    await user.click(within(anbyResult).getByRole('button', { name: 'CRIT DMG' }))
    const critSources = within(anbyResult).getByRole('table', {
      name: 'CRIT DMG source contributions',
    })
    const triggerSource = within(critSources).getByRole('row', {
      name: /Trigger.*King of the Summit.*4-piece.*[+]30[.]0%/,
    })
    expect(triggerSource).toHaveAttribute('data-source-tone', 'agent-trigger')
    await user.hover(triggerSource)
    expect(screen.getByRole('tab', { name: 'View Trigger setup and Result' }))
      .toHaveClass('is-source-active')
    await user.unhover(triggerSource)

    const outcomes = within(anbyResult).getByRole('table', {
      name: 'CRIT DMG action outcome values',
    })
    await user.click(within(outcomes).getByRole('button', {
      name: 'Show sources for Aftershock',
    }))
    expect(within(outcomes).getByText('AFTERSHOCK')).toBeInTheDocument()
    expect(within(outcomes).queryByText('Harmonizing Shot')).not.toBeInTheDocument()
    expect(within(outcomes).queryByText('Tartarus')).not.toBeInTheDocument()
    expect(within(outcomes).getByRole('row', {
      name: /Core Passive.*35% of Fully Enabled CRIT DMG.*[+]74[.]6%/,
    })).toBeInTheDocument()

    await user.click(screen.getByRole('tab', { name: 'View Trigger setup and Result' }))
    const triggerResult = screen.getByRole('region', { name: 'Trigger Result' })
    const critRateToggle = within(triggerResult).getByRole('button', { name: 'CRIT Rate' })
    await user.click(critRateToggle)
    const critRateDetails = critRateToggle.closest('tr')?.nextElementSibling
    expect(critRateDetails).not.toBeNull()
    expect(within(critRateDetails as HTMLElement).getByRole('group', {
      name: /Fully Enabled CRIT Rate: current 53[.]0, cap 90, threshold 40[.]0; Aftershock Daze bonus: [+]19[.]5%, cap 75%/,
    })).toBeInTheDocument()
    await user.click(within(triggerResult).getByRole('button', { name: 'CRIT DMG' }))
    const triggerCritOutcomes = within(triggerResult).getByRole('table', {
      name: 'CRIT DMG action outcome values',
    })
    expect(within(triggerCritOutcomes).getByRole('row', {
      name: /Aftershock.*179[.]6%/,
    })).toBeInTheDocument()
    expect(within(triggerCritOutcomes).getByText('AFTERSHOCK')).toBeInTheDocument()
    expect(within(triggerCritOutcomes).queryByText('Harmonizing Shot')).not.toBeInTheDocument()
    expect(within(triggerCritOutcomes).queryByText('Tartarus')).not.toBeInTheDocument()
    await user.click(within(triggerResult).getByRole('button', { name: 'Daze Bonus' }))
    const triggerDazeOutcomes = within(triggerResult).getByRole('table', {
      name: 'Daze Bonus action outcome values',
    })
    expect(within(triggerDazeOutcomes).getByRole('row', {
      name: /Aftershock.*25[.]5%/,
    })).toBeInTheDocument()
    await user.click(within(triggerDazeOutcomes).getByRole('button', {
      name: 'Show sources for Aftershock',
    }))
    expect(within(triggerDazeOutcomes).getByRole('row', {
      name: /Additional Ability.*[+]19[.]5%/,
    })).toBeInTheDocument()
    const dazeDetails = within(triggerResult).getByRole('button', { name: 'Daze Bonus' }).closest('tr')?.nextElementSibling
    expect(dazeDetails).not.toBeNull()
    expect(within(dazeDetails as HTMLElement).queryByRole('group', {
      name: /Fully Enabled CRIT Rate: current 53[.]0, cap 90, threshold 40[.]0; Aftershock Daze bonus: [+]19[.]5%, cap 75%/,
    })).not.toBeInTheDocument()

    await user.click(screen.getByRole('tab', { name: 'View Astra Yao setup and Result' }))
    await user.click(screen.getByRole('button', { name: 'M4' }))
    const astraResult = screen.getByRole('region', { name: 'Astra Yao Result' })
    expect(within(astraResult).queryByRole('region', { name: 'Agent operations' }))
      .not.toBeInTheDocument()
    await user.click(screen.getByRole('tab', { name: 'View Trigger setup and Result' }))
    const m4TriggerResult = screen.getByRole('region', { name: 'Trigger Result' })
    expect(within(m4TriggerResult).getByRole('row', {
      name: /Daze Bonus.*6[.]0%.*6[.]0%.*6[.]0%/,
    })).toBeInTheDocument()
    const operations = within(m4TriggerResult).getByRole('region', { name: 'Agent operations' })
    const m4Operation = within(operations).getByRole('listitem')
    expect(m4Operation).toHaveTextContent(
      /Fully enabled.*Next Quick Assist Daze.*Astra Yao.*Mindscape.*M4.*Next Quick Assist.*[+]50[.]0%/,
    )
    expect(m4Operation).toHaveAttribute('data-source-tone', 'agent-astraYao')
  })
})
