import { act, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { App } from './App'

describe('integrated party workbench', () => {
  it('starts with one expanded prepared setup and one visible Result', () => {
    render(<App />)

    expect(screen.getByRole('heading', { name: 'Yixuan setup' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Yixuan Result' })).toBeInTheDocument()
    expect(screen.getAllByRole('heading', { name: /Result$/i })).toHaveLength(1)
    expect(screen.getByRole('tab', { name: 'View Dialyn setup and Result' })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: 'View Lucia setup and Result' })).toBeInTheDocument()
    expect(screen.queryByLabelText(/party effects/i)).not.toBeInTheDocument()
  })

  it('keeps the accepted portrait calibration and actual identity symbols', async () => {
    const user = userEvent.setup()
    render(<App />)

    const expectExpandedFrame = (expectedWidth: string) => {
      const portrait = document.querySelector<HTMLElement>(
        '.slot-identity--expanded .agent-art',
      )
      expect(portrait).not.toBeNull()
      expect(portrait!.style.getPropertyValue('--portrait-target-x')).toBe('38%')
      expect(portrait!.style.getPropertyValue('--portrait-target-y')).toBe('25.2%')
      expect(portrait!.style.getPropertyValue('--portrait-width')).toBe(expectedWidth)
    }

    expectExpandedFrame('295%')
    await user.click(screen.getByRole('tab', { name: 'View Dialyn setup and Result' }))
    expectExpandedFrame('288%')
    await user.click(screen.getByRole('tab', { name: 'View Lucia setup and Result' }))
    expectExpandedFrame('295%')

    for (const label of ['Auric Ink, Rupture', 'Physical, Stun', 'Ether, Support']) {
      expect(screen.getByLabelText(label).querySelectorAll('img')).toHaveLength(2)
    }
    expect(document.querySelectorAll('.party-slot--compact .agent-art')).toHaveLength(2)
  })

  it('shows image-led prepared equipment without Base ATK or false single-candidate controls', () => {
    render(<App />)

    const engine = screen.getByRole('button', {
      name: 'Change W-Engine from Qingming Birdcage',
    })
    expect(engine.querySelector('img')).not.toBeNull()
    expect(within(engine).getByText('HP')).toBeInTheDocument()
    expect(within(engine).getByText('+30%')).toBeInTheDocument()
    expect(screen.queryByText('Base ATK')).not.toBeInTheDocument()

    const fourPiece = screen.getByLabelText('Yunkui Tales selected as 4-piece')
    expect(fourPiece.querySelector('img')).not.toBeNull()
    expect(within(fourPiece).getByText('CRIT Rate +12%')).toBeInTheDocument()
    expect(within(fourPiece).getByText('Sheer DMG +10%')).toBeInTheDocument()
    expect(within(fourPiece).getByText('HP +10%')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Change 4-piece Drive Disc/ }))
      .not.toBeInTheDocument()

    const slot6 = screen.getByLabelText('Disc 6 HP selected')
    expect(slot6.tagName).toBe('DIV')
  })

  it('presents Dialyn Energy Regen Discs as one accessible either-set choice', async () => {
    const user = userEvent.setup()
    render(<App />)

    expect(screen.queryByText('Yunkui Tales')).not.toBeInTheDocument()
    expect(screen.queryByText('Woodpecker Electro')).not.toBeInTheDocument()
    expect(screen.getByText('Qingming Birdcage')).toBeInTheDocument()

    await user.click(screen.getByRole('tab', { name: 'View Dialyn setup and Result' }))
    await user.click(screen.getByRole('button', {
      name: 'Change 2-piece Drive Disc from Woodpecker Electro',
    }))
    const candidates = screen.getByLabelText('twoPiece Drive Disc candidates')
    const energyRegenChoice = within(candidates).getByRole('button', {
      name: 'Select Swing Jazz or Moonlight Lullaby as twoPiece',
    })
    expect(within(candidates).getAllByRole('button', {
      name: /Swing Jazz or Moonlight Lullaby/,
    })).toHaveLength(1)
    expect(within(candidates).queryByText('Swing Jazz')).not.toBeInTheDocument()
    expect(within(candidates).queryByText('Moonlight Lullaby')).not.toBeInTheDocument()

    await user.click(energyRegenChoice)
    const selected = screen.getByRole('button', {
      name: 'Change 2-piece Drive Disc from Swing Jazz or Moonlight Lullaby',
    })
    expect(selected).toHaveFocus()
    expect(screen.queryByLabelText('twoPiece Drive Disc candidates')).not.toBeInTheDocument()
    const composite = selected.querySelector<HTMLElement>('.disc-composite-art')
    expect(composite).not.toBeNull()
    expect(composite!.querySelectorAll('.disc-composite-art__or')).toHaveLength(1)
    expect(composite!.querySelector('.disc-composite-art__or')).toHaveTextContent('OR')
    expect(within(selected).getAllByText('2PC')).toHaveLength(1)
    expect(within(selected).getAllByText('Energy Regen +20%')).toHaveLength(1)
    expect(screen.getByRole('row', {
      name: /Energy Regen.*2\.16.*3\.66.*3\.66/,
    })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Energy Regen' }))
    expect(within(screen.getByRole('table', {
      name: 'Energy Regen source contributions',
    })).getByRole('row', {
      name: /Swing Jazz or Moonlight Lullaby/,
    })).toBeInTheDocument()
  })

  it('opens only current-pool W-Engine alternatives and applies Rank defaults', async () => {
    const user = userEvent.setup()
    render(<App />)

    expect(screen.queryByLabelText('W-Engine candidates')).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', {
      name: 'Change W-Engine from Qingming Birdcage',
    }))

    const candidates = screen.getByLabelText('W-Engine candidates')
    for (const name of [
      'Select Cauldron of Clarity W5',
      'Select Radiowave Journey W5',
      'Select Puzzle Sphere W5',
    ]) {
      const candidate = within(candidates).getByRole('button', { name })
      expect(candidate.querySelector('img')).not.toBeNull()
    }
    expect(within(candidates).queryByRole('button', { name: /Qingming/ }))
      .not.toBeInTheDocument()

    await user.click(within(candidates).getByRole('button', {
      name: 'Select Cauldron of Clarity W5',
    }))
    const refinement = screen.getByRole('group', {
      name: 'Cauldron of Clarity refinement',
    })
    expect(within(refinement).getByRole('button', { name: 'W5' }))
      .toHaveAttribute('aria-pressed', 'true')
  })

  it('preserves downstream edits on direct engine and refinement changes', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.click(screen.getByRole('button', { name: 'Increase HP hits' }))
    await user.click(screen.getByRole('button', {
      name: 'Change Disc 4 main stat from CRIT Rate',
    }))
    await user.click(screen.getByRole('button', {
      name: 'Select CRIT DMG for Disc 4',
    }))
    await user.click(screen.getByRole('button', {
      name: 'Change W-Engine from Qingming Birdcage',
    }))
    await user.click(screen.getByRole('button', {
      name: 'Select Cauldron of Clarity W5',
    }))

    expect(screen.getByLabelText('HP hit count')).toHaveTextContent('1')
    expect(screen.getByRole('button', {
      name: 'Change Disc 4 main stat from CRIT DMG',
    })).toBeInTheDocument()

    const refinement = screen.getByRole('group', {
      name: 'Cauldron of Clarity refinement',
    })
    await user.click(screen.getByRole('button', { name: 'CRIT Rate' }))
    await user.click(within(refinement).getByRole('button', { name: 'W2' }))
    const sources = screen.getByRole('table', {
      name: 'CRIT Rate source contributions',
    })
    expect(within(sources).getByRole('row', { name: /Cauldron of Clarity \u00B7 W2/ }))
      .toHaveAttribute('data-source-tone', 'w-engine')
    expect(within(sources).getByRole('row', { name: /Cauldron of Clarity/ })).toHaveClass('is-source-active')
  })

  it('re-prepares only the Agent whose pool changes', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.click(screen.getByRole('button', { name: 'Increase HP hits' }))
    await user.click(screen.getByRole('tab', { name: 'View Dialyn setup and Result' }))
    await user.click(screen.getByRole('button', { name: 'Increase CRIT Rate hits' }))
    await user.click(screen.getByRole('button', {
      name: 'Change 2-piece Drive Disc from Woodpecker Electro',
    }))
    await user.click(screen.getByRole('button', {
      name: 'Select Swing Jazz or Moonlight Lullaby as twoPiece',
    }))
    await user.click(screen.getByRole('button', { name: /^Non-limited/ }))

    expect(screen.getByText('Hellfire Gears')).toBeInTheDocument()
    expect(screen.getByLabelText('CRIT Rate hit count')).toHaveTextContent('0')
    expect(screen.getByRole('button', {
      name: 'Change 2-piece Drive Disc from Woodpecker Electro',
    })).toBeInTheDocument()

    await user.click(screen.getByRole('tab', { name: 'View Yixuan setup and Result' }))
    expect(screen.getByLabelText('HP hit count')).toHaveTextContent('1')
    expect(screen.getByText('Qingming Birdcage')).toBeInTheDocument()
  })

  it('recalculates Disc and main-stat selectors and replaces their sources', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.click(screen.getByRole('button', {
      name: 'Change 2-piece Drive Disc from Woodpecker Electro',
    }))
    await user.click(screen.getByRole('button', {
      name: 'Select Branch & Blade Song as twoPiece',
    }))
    expect(screen.getByRole('button', {
      name: 'Change 2-piece Drive Disc from Branch & Blade Song',
    })).toHaveFocus()
    await user.click(screen.getByRole('button', {
      name: 'Change Disc 4 main stat from CRIT Rate',
    }))
    await user.click(screen.getByRole('button', {
      name: 'Select CRIT DMG for Disc 4',
    }))
    expect(screen.getByRole('button', {
      name: 'Change Disc 4 main stat from CRIT DMG',
    })).toHaveFocus()
    await user.click(screen.getByRole('button', {
      name: 'Change Disc 5 main stat from Ether DMG',
    }))
    await user.click(screen.getByRole('button', {
      name: 'Select HP for Disc 5',
    }))
    expect(screen.getByRole('button', {
      name: 'Change Disc 5 main stat from HP',
    })).toHaveFocus()

    expect(screen.getByRole('row', {
      name: /CRIT Rate.*19.4%.*39.4%.*51.4%/,
    })).toBeInTheDocument()
    expect(screen.getByRole('row', {
      name: /CRIT DMG.*114.0%.*114.0%.*244.0%/,
    })).toBeInTheDocument()
    expect(screen.getByRole('row', {
      name: /DMG Bonus.*0.0%.*16.0%.*119.0%/,
    })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'CRIT DMG' }))
    const sources = screen.getByRole('table', {
      name: 'CRIT DMG source contributions',
    })
    expect(within(sources).getByRole('row', { name: /Branch & Blade Song/ }))
      .toHaveAttribute('data-source-tone', 'disc-2pc')
    expect(within(sources).getByRole('row', { name: /Drive Disc \u00B7 Slot 4/ }))
      .toHaveAttribute('data-source-tone', 'disc-slot-4')
  })

  it('offers and recalculates partner W-Engine directions', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.click(screen.getByRole('tab', { name: 'View Dialyn setup and Result' }))
    await user.click(screen.getByRole('button', {
      name: 'Change W-Engine from Yesterday Calls',
    }))
    const dialynCandidates = screen.getByLabelText('W-Engine candidates')
    expect(within(dialynCandidates).getByRole('button', {
      name: 'Select Chief Sidekick W1',
    })).toBeInTheDocument()
    expect(within(dialynCandidates).getByRole('button', {
      name: 'Select Hellfire Gears W1',
    })).toBeInTheDocument()
    expect(within(dialynCandidates).getByRole('button', {
      name: 'Select Steam Oven W5',
    })).toBeInTheDocument()
    await user.click(within(dialynCandidates).getByRole('button', {
      name: 'Select Steam Oven W5',
    }))
    expect(screen.getByRole('row', {
      name: /Energy Regen.*2.52.*2.52.*2.52/,
    })).toBeInTheDocument()
    expect(screen.getByRole('row', {
      name: /Impact.*110.0.*112.8.*141.0/,
    })).toBeInTheDocument()

    await user.click(screen.getByRole('tab', { name: 'View Lucia setup and Result' }))
    await user.click(screen.getByRole('button', {
      name: 'Change W-Engine from Dreamlit Hearth',
    }))
    const luciaCandidates = screen.getByLabelText('W-Engine candidates')
    expect(within(luciaCandidates).getByRole('button', {
      name: 'Select Thoughtbop W1',
    })).toBeInTheDocument()
    expect(within(luciaCandidates).getByRole('button', {
      name: 'Select Weeping Cradle W1',
    })).toBeInTheDocument()
    expect(within(luciaCandidates).getByRole('button', {
      name: 'Select Kaboom the Cannon W5',
    })).toBeInTheDocument()
    expect(within(luciaCandidates).getByRole('button', {
      name: 'Select Unfettered Game Ball W5',
    })).toBeInTheDocument()
  })

  it('switches slots while preserving each Agent setup state', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.click(screen.getByRole('button', { name: 'Increase HP hits' }))
    await user.click(screen.getByRole('tab', { name: 'View Dialyn setup and Result' }))
    await user.click(screen.getByRole('button', { name: 'Increase CRIT Rate hits' }))
    await user.click(screen.getByRole('tab', { name: 'View Lucia setup and Result' }))
    await user.click(screen.getByRole('button', { name: 'Increase HP% hits' }))

    await user.click(screen.getByRole('tab', { name: 'View Yixuan setup and Result' }))
    expect(screen.getByLabelText('HP hit count')).toHaveTextContent('1')
    await user.click(screen.getByRole('tab', { name: 'View Dialyn setup and Result' }))
    expect(screen.getByLabelText('CRIT Rate hit count')).toHaveTextContent('1')
    await user.click(screen.getByRole('tab', { name: 'View Lucia setup and Result' }))
    expect(screen.getByLabelText('HP% hit count')).toHaveTextContent('1')
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
  })

  it('activates and clears every remaining visible setup source target', async () => {
    const user = userEvent.setup()
    render(<App />)

    const targets = [
      document.querySelector<HTMLElement>('.equipment-fieldset[data-source-tone="w-engine"]')!,
      document.querySelector<HTMLElement>('.substat-control[data-source-tone="substat-1"]')!,
      document.querySelector<HTMLElement>('.substat-control[data-source-tone="substat-2"]')!,
      document.querySelector<HTMLElement>('.substat-control[data-source-tone="substat-3"]')!,
      screen.getByRole('tab', { name: 'View Yixuan setup and Result' }),
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
    expect(screen.getByRole('button', {
      name: 'Change W-Engine from Cauldron of Clarity',
    })).toHaveFocus()
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
    await user.click(sharedAction)
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

  it('uses one roving slot tab stop before setup controls', async () => {
    const user = userEvent.setup()
    render(<App />)

    const yixuanTab = screen.getByRole('tab', {
      name: 'View Yixuan setup and Result',
    })
    yixuanTab.focus()
    await user.keyboard('{ArrowRight}')

    const dialynTab = screen.getByRole('tab', {
      name: 'View Dialyn setup and Result',
    })
    expect(dialynTab).toHaveAttribute('aria-selected', 'true')
    expect(dialynTab).toHaveFocus()

    await user.keyboard('{ArrowLeft}')
    const returned = screen.getByRole('tab', {
      name: 'View Yixuan setup and Result',
    })
    expect(returned).toHaveFocus()
    await user.tab()
    expect(screen.getByRole('button', { name: /^Full pool/ })).toHaveFocus()
  })
})
