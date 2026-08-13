import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { App } from './App'

describe('integrated party workbench: setup', () => {
  it('keeps Evelyn’s complete representative stable while Astra and Dialyn add local Disc comparisons', async () => {
    const user = userEvent.setup()
    render(<App />)
    const replace = async (slot: number, agent: RegExp) => {
      await user.click(screen.getByRole('button', { name: new RegExp(`Replace slot ${slot},`) }))
      await user.click(screen.getByRole('button', { name: agent }))
    }

    await user.click(screen.getByRole('button', { name: 'Edit party' }))
    await replace(1, /Evelyn, Fire, Attack/)
    await replace(2, /Astra Yao, Ether, Support/)
    await replace(3, /Dialyn, Physical, Stun/)
    await user.click(screen.getByRole('button', { name: 'Apply party' }))

    const engine = screen.getByRole('button', { name: 'Change W-Engine from Heartstring Nocturne' })
    expect(engine).toHaveAccessibleDescription('CRIT Rate +24%. CRIT DMG +50%. Chain Attack & Ultimate Fire RES Ignore +25%')
    expect(screen.getByRole('button', { name: 'Change 4-piece Drive Disc from Hormone Punk' }))
      .toHaveAccessibleDescription('ATK +25%. ATK +10%')
    expect(screen.getByRole('button', { name: 'Change 2-piece Drive Disc from Woodpecker Electro' }))
      .toHaveAccessibleDescription('CRIT Rate +8%')

    await user.click(screen.getByRole('button', { name: 'Change 4-piece Drive Disc from Hormone Punk' }))
    const candidates = screen.getByLabelText('fourPiece Drive Disc candidates')
    const astral = within(candidates).getByRole('button', { name: 'Select Astral Voice as fourPiece' })
    const puffer = within(candidates).getByRole('button', { name: 'Select Puffer Electro as fourPiece' })
    expect(astral).toHaveAccessibleDescription('Entrant DMG +24%. ATK +10%')
    expect(puffer).toHaveAccessibleDescription('Ultimate DMG +20%. ATK +15%. PEN Ratio +8%')
    await user.click(screen.getByRole('button', { name: 'Change 4-piece Drive Disc from Hormone Punk' }))
    expect(screen.getByRole('button', { name: 'Change 4-piece Drive Disc from Hormone Punk' })).toHaveFocus()
  }, 10_000)

  it('presents exact Seed and contextual Cissia equipment packages without Puffer 4-piece', async () => {
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

    expect(screen.getByRole('button', { name: 'Change W-Engine from Cordis Germina' })).toBeInTheDocument()
    expect(screen.getByLabelText("Dawn's Bloom selected as 4-piece"))
      .toHaveAccessibleDescription('Basic Attack DMG +40%. Basic Attack DMG +15%')
    expect(screen.getByRole('button', { name: 'Change 2-piece Drive Disc from Woodpecker Electro' }))
      .toHaveAccessibleDescription('CRIT Rate +8%')
    await user.click(screen.getByRole('button', { name: 'Change W-Engine from Cordis Germina' }))
    const seedEngines = screen.getByLabelText('W-Engine candidates')
    expect(within(seedEngines).getByText('The Brimstone')).toBeInTheDocument()
    const brimstone = within(seedEngines).getByRole('button', { name: 'Select The Brimstone W1' })
    expect(within(brimstone).getByText('ATK +28%')).toBeInTheDocument()
    expect(brimstone).toHaveAccessibleDescription('ATK +30%. ATK +28%')
    expect(within(seedEngines).queryByText('Base ATK')).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Change W-Engine from Cordis Germina' }))
    await user.click(screen.getByRole('button', { name: 'Change 2-piece Drive Disc from Woodpecker Electro' }))
    await user.click(screen.getByRole('button', { name: 'Select Branch & Blade Song as twoPiece' }))
    await user.click(screen.getByRole('button', { name: "Change 4-piece Drive Disc from Dawn's Bloom" }))
    const seedFourPiece = screen.getByLabelText('fourPiece Drive Disc candidates')
    expect(within(seedFourPiece).getByRole('button', { name: 'Select Woodpecker Electro as fourPiece' }))
      .toHaveAccessibleDescription('ATK +27%. CRIT Rate +8%')
    expect(within(seedFourPiece).queryByRole('button', { name: /Puffer Electro as fourPiece/ })).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: "Change 4-piece Drive Disc from Dawn's Bloom" }))

    await user.click(screen.getByRole('tab', { name: 'View Cissia setup and Result' }))
    const serpentine = screen.getByRole('button', { name: 'Change W-Engine from Serpentine Seeker' })
    expect(within(serpentine).getByText('Energy Regen')).toBeInTheDocument()
    expect(within(serpentine).getByText('+60%')).toBeInTheDocument()
    expect(within(serpentine).getByText('CRIT Rate +25%')).toBeInTheDocument()
    expect(within(serpentine).getByText('Electric DMG · DEF Ignore +28%')).toBeInTheDocument()
    expect(serpentine).toHaveAccessibleDescription(
      'Energy Regen +60%. CRIT Rate +25%. Electric DMG · DEF Ignore +28%',
    )
    expect(screen.getByRole('button', {
      name: 'Change 4-piece Drive Disc from Astral Voice',
    })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Change 2-piece Drive Disc from Swing Jazz' })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Non-limited' }))
    const drill = screen.getByLabelText('Drill Rig - Red Axis selected')
    expect(within(drill).getByText('Basic & Dash Attack Electric DMG +80%')).toBeInTheDocument()
    expect(drill).toHaveAccessibleDescription(
      'Energy Regen +50%. Basic & Dash Attack Electric DMG +80%',
    )
    expect(screen.getByRole('button', {
      name: 'Change 4-piece Drive Disc from Astral Voice',
    })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Change 2-piece Drive Disc from Swing Jazz' })).toBeInTheDocument()
  }, 10_000)

  it('lets Seed select Dialyn-contextual Puffer without changing the prepared remainder', async () => {
    const user = userEvent.setup()
    render(<App />)
    const replace = async (slot: number, agent: RegExp) => {
      await user.click(screen.getByRole('button', { name: new RegExp(`Replace slot ${slot},`) }))
      await user.click(screen.getByRole('button', { name: agent }))
    }

    await user.click(screen.getByRole('button', { name: 'Edit party' }))
    await replace(1, /Seed, Electric, Attack/)
    await replace(2, /Dialyn, Physical, Stun/)
    await replace(3, /Astra Yao, Ether, Support/)
    await user.click(screen.getByRole('button', { name: 'Apply party' }))

    expect(screen.getByRole('button', { name: 'Change W-Engine from Cordis Germina' }))
      .toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Change 2-piece Drive Disc from Woodpecker Electro' }))
      .toBeInTheDocument()

    await user.click(screen.getByRole('button', {
      name: "Change 4-piece Drive Disc from Dawn's Bloom",
    }))
    const candidates = screen.getByLabelText('fourPiece Drive Disc candidates')
    const puffer = within(candidates).getByRole('button', {
      name: 'Select Puffer Electro as fourPiece',
    })
    expect(puffer).toHaveAccessibleDescription('Ultimate DMG +20%. ATK +15%. PEN Ratio +8%')

    await user.click(puffer)

    expect(screen.getByRole('button', {
      name: 'Change 4-piece Drive Disc from Puffer Electro',
    })).toHaveAccessibleDescription('Ultimate DMG +20%. ATK +15%. PEN Ratio +8%')
    expect(screen.getByRole('button', { name: 'Change W-Engine from Cordis Germina' }))
      .toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Change 2-piece Drive Disc from Woodpecker Electro' }))
      .toBeInTheDocument()
  })

  it('shows image-led prepared equipment without Base ATK or false single-candidate controls', () => {
    render(<App />)

    const engine = screen.getByRole('button', {
      name: 'Change W-Engine from Qingming Birdcage',
    })
    expect(engine.querySelector('img')).not.toBeNull()
    expect(within(engine).getByText('HP')).toBeInTheDocument()
    expect(within(engine).getByText('+30%')).toBeInTheDocument()
    expect(within(engine).getByText('S')).toHaveClass('equipment-rank')
    expect(engine.querySelector('.selection-surface__change'))
      .toHaveTextContent(String.fromCharCode(9660))
    expect(screen.queryByText('Base ATK')).not.toBeInTheDocument()
    const mindscape = screen.getByRole('group', { name: 'Mindscape' })
    expect(within(mindscape).getAllByRole('button')).toHaveLength(7)
    expect(within(mindscape).getByRole('button', { name: 'M0' }))
      .toHaveAttribute('aria-pressed', 'true')
    expect(within(mindscape).getByRole('button', { name: 'M6' }))
      .toHaveAttribute('aria-pressed', 'false')
    expect(document.querySelector('.workbench-footer')).not.toHaveTextContent('M0')

    const fourPiece = screen.getByLabelText('Yunkui Tales selected as 4-piece')
    expect(fourPiece.querySelector('img')).not.toBeNull()
    expect(within(fourPiece).getByText('CRIT Rate +12%')).toBeInTheDocument()
    expect(within(fourPiece).getByText('Sheer DMG +10%')).toBeInTheDocument()
    expect(within(fourPiece).getByText('HP +10%')).toBeInTheDocument()
    const discRows = fourPiece.querySelectorAll('.disc-effect-rows > span')
    expect(discRows).toHaveLength(3)
    expect(discRows[0]).toHaveTextContent('4PCCRIT Rate +12%')
    expect(discRows[1]).toHaveTextContent('Sheer DMG +10%')
    expect(discRows[1]).not.toHaveTextContent('4PC')
    expect(discRows[2]).toHaveTextContent('2PCHP +10%')
    expect(within(fourPiece).getByRole('img', { name: 'Fixed selection' }))
      .toHaveClass('selection-surface__fixed')
    expect(screen.queryByRole('button', { name: /Change 4-piece Drive Disc/ }))
      .not.toBeInTheDocument()

    const slot6 = screen.getByLabelText('Disc 6 HP% selected')
    expect(slot6.tagName).toBe('DIV')
    expect(within(slot6).getByRole('img', { name: 'Fixed selection' }))
      .toHaveClass('main-stat-block__fixed')
  })

  it('presents Astra’s exact Energy Regen Disc and prepares Trigger holder allocation', async () => {
    const user = userEvent.setup()
    render(<App />)
    expect(screen.getByRole('status')).toBeEmptyDOMElement()
    const replace = async (slot: number, agent: RegExp) => {
      await user.click(screen.getByRole('button', { name: new RegExp(`Replace slot ${slot},`) }))
      await user.click(screen.getByRole('button', { name: agent }))
    }

    await user.click(screen.getByRole('button', { name: 'Edit party' }))
    await replace(1, /Anby: Soldier 0, Electric, Attack/)
    await replace(2, /Trigger, Electric, Stun/)
    await replace(3, /Astra Yao, Ether, Support/)
    await user.click(screen.getByRole('button', { name: 'Apply party' }))

    await user.click(screen.getByRole('tab', { name: 'View Astra Yao setup and Result' }))
    const elegantVanity = screen.getByRole('button', {
      name: 'Change W-Engine from Elegant Vanity',
    })
    expect(within(elegantVanity).getByText('Energy +5')).toBeInTheDocument()
    expect(elegantVanity).toHaveAccessibleDescription(
      'ATK +30%. Energy +5. Squad DMG +20%',
    )
    const energyChoice = screen.getByRole('button', {
      name: 'Change 2-piece Drive Disc from Moonlight Lullaby',
    })
    expect(energyChoice.querySelector('img')).not.toBeNull()

    await user.click(screen.getByRole('tab', { name: 'View Trigger setup and Result' }))
    await user.click(screen.getByRole('button', { name: 'Change 4-piece Drive Disc from King of the Summit' }))
    const secondTrioCandidates = screen.getByLabelText('fourPiece Drive Disc candidates')
    expect(within(secondTrioCandidates).getByRole('button', { name: 'Select Shockstar Disco as fourPiece' })).toBeInTheDocument()
    expect(within(secondTrioCandidates).getByRole('button', { name: 'Select Astral Voice as fourPiece' })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Change 4-piece Drive Disc from King of the Summit' }))

    await user.click(screen.getByRole('button', { name: 'Edit party' }))
    await replace(3, /Dialyn, Physical, Stun/)
    await user.click(screen.getByRole('button', { name: 'Apply party' }))
    expect(screen.getByRole('button', {
      name: 'Change 4-piece Drive Disc from Astral Voice',
    })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Change 4-piece Drive Disc from Astral Voice' }))
    const dialynPartyCandidates = screen.getByLabelText('fourPiece Drive Disc candidates')
    expect(within(dialynPartyCandidates).getByRole('button', { name: 'Select King of the Summit as fourPiece' })).toBeInTheDocument()
    expect(within(dialynPartyCandidates).queryByRole('button', { name: 'Select Shockstar Disco as fourPiece' })).not.toBeInTheDocument()
  })

  it('shows focused formula preparation before downstream selector pressure', async () => {
    const user = userEvent.setup()
    render(<App />)
    const replace = async (slot: number, agent: RegExp) => {
      await user.click(screen.getByRole('button', { name: new RegExp(`Replace slot ${slot},`) }))
      await user.click(screen.getByRole('button', { name: agent }))
    }

    await user.click(screen.getByRole('button', { name: 'Edit party' }))
    await replace(2, /Trigger, Electric, Stun/)
    await user.click(screen.getByRole('button', { name: 'Apply party' }))
    await user.click(screen.getByRole('tab', { name: 'View Trigger setup and Result' }))
    expect(screen.getByRole('button', { name: 'Change W-Engine from Ice-Jade Teapot' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Change 4-piece Drive Disc from King of the Summit' })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Edit party' }))
    await replace(1, /Anby: Soldier 0, Electric, Attack/)
    await user.click(screen.getByRole('button', { name: 'Apply party' }))
    expect(screen.getByRole('button', { name: 'Change W-Engine from Spectral Gaze' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Change 4-piece Drive Disc from King of the Summit' })).toBeInTheDocument()
  })

  it('re-prepares only the visible Agent when Mindscape changes', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.click(screen.getByRole('button', { name: 'Increase HP% hits' }))
    expect(screen.getByLabelText('HP% hit count')).toHaveValue('1')
    await user.click(screen.getByRole('tab', { name: 'View Dialyn setup and Result' }))
    await user.click(screen.getByRole('button', { name: 'Increase CRIT Rate hits' }))
    await user.click(screen.getByRole('tab', { name: 'View Yixuan setup and Result' }))

    const mindscape = screen.getByRole('group', { name: 'Mindscape' })
    await user.click(within(mindscape).getByRole('button', { name: 'M3' }))

    expect(within(mindscape).getByRole('button', { name: 'M3' }))
      .toHaveAttribute('aria-pressed', 'true')
    expect(within(mindscape).getByRole('button', { name: 'M0' }))
      .toHaveAttribute('aria-pressed', 'false')
    expect(screen.getByLabelText('HP% hit count')).toHaveValue('0')
    expect(screen.getByText('Qingming Birdcage')).toBeInTheDocument()
    expect(screen.getByRole('button', {
      name: 'Change 2-piece Drive Disc from Woodpecker Electro',
    })).toBeInTheDocument()
    expect(document.querySelector('.workbench-footer')).not.toHaveTextContent('M0')

    await user.click(screen.getByRole('tab', { name: 'View Dialyn setup and Result' }))
    expect(screen.getByLabelText('CRIT Rate hit count')).toHaveValue('1')
  })

  it('commits direct substat counts on completion and clamps them to the offered range', async () => {
    const user = userEvent.setup()
    render(<App />)

    const count = screen.getByLabelText('CRIT Rate hit count')
    await user.click(count)
    await user.keyboard('12')
    expect(count).toHaveValue('12')

    await user.keyboard('{Enter}')
    expect(count).toHaveValue('12')

    await user.clear(count)
    await user.type(count, '99')
    await user.tab()
    expect(count).toHaveValue('36')
    expect(screen.getByRole('button', { name: 'Increase CRIT Rate hits' })).toBeDisabled()
  })

  it('presents Dialyn one canonical Energy Regen Disc identity', async () => {
    const user = userEvent.setup()
    render(<App />)

    expect(screen.queryByText('Yunkui Tales')).not.toBeInTheDocument()
    expect(screen.queryByText('Woodpecker Electro')).not.toBeInTheDocument()
    expect(screen.getByText('Qingming Birdcage')).toBeInTheDocument()

    await user.click(screen.getByRole('tab', { name: 'View Dialyn setup and Result' }))
    const engine = screen.getByRole('button', {
      name: 'Change W-Engine from Yesterday Calls',
    })
    expect(within(engine).getByText('Squad CRIT DMG +30%')).toBeInTheDocument()
    expect(within(engine).queryByText(/Fully enabled ·/)).not.toBeInTheDocument()
    expect(screen.queryByText(/At 50% CRIT Rate/)).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', {
      name: 'Change 2-piece Drive Disc from Woodpecker Electro',
    }))
    const candidates = screen.getByLabelText('twoPiece Drive Disc candidates')
    const energyRegenChoice = within(candidates).getByRole('button', {
      name: 'Select Swing Jazz as twoPiece',
    })
    expect(within(candidates).queryByRole('button', {
      name: 'Select Moonlight Lullaby as twoPiece',
    })).not.toBeInTheDocument()

    await user.click(energyRegenChoice)
    const selected = screen.getByRole('button', {
      name: 'Change 2-piece Drive Disc from Swing Jazz',
    })
    expect(selected).toHaveFocus()
    expect(screen.queryByLabelText('twoPiece Drive Disc candidates')).not.toBeInTheDocument()
    const visibleEffects = within(selected.querySelector('.disc-effect-rows')!)
    expect(visibleEffects.getAllByText('2PC')).toHaveLength(1)
    expect(visibleEffects.getAllByText('Energy Regen +20%')).toHaveLength(1)
    expect(selected).toHaveAccessibleDescription('Energy Regen +20%')
    expect(screen.getByRole('row', {
      name: /Energy Regen.*2\.16.*3\.66.*3\.66/,
    })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Energy Regen' }))
    expect(within(screen.getByRole('table', {
      name: 'Energy Regen source contributions',
    })).getByRole('row', {
      name: /Swing Jazz/,
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
      expect(candidate.querySelector('.equipment-rank')).toHaveTextContent('/ W5')
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

    await user.click(screen.getByRole('button', { name: 'Increase HP% hits' }))
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

    expect(screen.getByLabelText('HP% hit count')).toHaveValue('1')
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
    expect(within(sources).getByRole('row', { name: /Cauldron of Clarity.*W2/ }))
      .toHaveAttribute('data-source-tone', 'w-engine')
    expect(within(sources).getByRole('row', { name: /Cauldron of Clarity/ })).toHaveClass('is-source-active')
  })

  it('re-prepares only the Agent whose pool changes', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.click(screen.getByRole('button', { name: 'Increase HP% hits' }))
    await user.click(screen.getByRole('tab', { name: 'View Dialyn setup and Result' }))
    await user.click(screen.getByRole('button', { name: 'Increase CRIT Rate hits' }))
    await user.click(screen.getByRole('button', {
      name: 'Change 2-piece Drive Disc from Woodpecker Electro',
    }))
    await user.click(screen.getByRole('button', {
      name: 'Select Swing Jazz as twoPiece',
    }))
    await user.click(screen.getByRole('button', { name: /^Non-limited/ }))

    expect(screen.getByText('Hellfire Gears')).toBeInTheDocument()
    expect(screen.getByLabelText('CRIT Rate hit count')).toHaveValue('0')
    expect(screen.getByRole('button', {
      name: 'Change 2-piece Drive Disc from Woodpecker Electro',
    })).toBeInTheDocument()

    await user.click(screen.getByRole('tab', { name: 'View Yixuan setup and Result' }))
    expect(screen.getByLabelText('HP% hit count')).toHaveValue('1')
    expect(screen.getByText('Qingming Birdcage')).toBeInTheDocument()
  })

  it('recalculates Disc and main-stat selectors and replaces their sources', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.click(screen.getByRole('button', {
      name: 'Change 2-piece Drive Disc from Branch & Blade Song',
    }))
    await user.click(screen.getByRole('button', {
      name: 'Select Woodpecker Electro as twoPiece',
    }))
    expect(screen.getByRole('button', {
      name: 'Change 2-piece Drive Disc from Woodpecker Electro',
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
      name: 'Select HP% for Disc 5',
    }))
    expect(screen.getByRole('button', {
      name: 'Change Disc 5 main stat from HP%',
    })).toHaveFocus()

    expect(screen.getByRole('row', {
      name: /CRIT Rate.*27.4%.*47.4%.*59.4%/,
    })).toBeInTheDocument()
    expect(screen.getByRole('row', {
      name: /CRIT DMG.*98.0%.*98.0%.*228.0%/,
    })).toBeInTheDocument()
    expect(screen.getByRole('row', {
      name: /DMG Bonus.*0.0%.*16.0%.*119.0%/,
    })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'CRIT DMG' }))
    const sources = screen.getByRole('table', {
      name: 'CRIT DMG source contributions',
    })
    expect(within(sources).getByRole('row', { name: /Drive Disc \u00B7 Slot 4/ }))
      .toHaveAttribute('data-source-tone', 'disc-slot-4')
  })

  it('offers Dialyn residual Slot 5 choices without inventing a damage Result', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.click(screen.getByRole('tab', {
      name: 'View Dialyn setup and Result',
    }))
    await user.click(screen.getByRole('button', {
      name: 'Change Disc 5 main stat from ATK%',
    }))
    const candidates = screen.getByLabelText('Disc 5 main-stat candidates')
    expect(within(candidates).getByRole('button', {
      name: 'Select Physical DMG for Disc 5',
    })).toBeInTheDocument()
    expect(within(candidates).getByRole('button', {
      name: 'Select PEN Ratio for Disc 5',
    })).toBeInTheDocument()

    await user.click(within(candidates).getByRole('button', {
      name: 'Select PEN Ratio for Disc 5',
    }))
    expect(screen.getByRole('button', {
      name: 'Change Disc 5 main stat from PEN Ratio',
    })).toHaveFocus()
    expect(screen.queryByRole('button', { name: 'PEN Ratio' })).not.toBeInTheDocument()
  })

  it('cues simultaneous contextual invalidations and restores Result only after every repair', async () => {
    const user = userEvent.setup()
    render(<App />)
    const replace = async (slot: number, agent: RegExp) => {
      await user.click(screen.getByRole('button', { name: new RegExp(`Replace slot ${slot},`) }))
      await user.click(screen.getByRole('button', { name: agent }))
    }

    await user.click(screen.getByRole('button', { name: 'Edit party' }))
    await replace(1, /Anby: Soldier 0, Electric, Attack/)
    await replace(3, /Trigger, Electric, Stun/)
    await user.click(screen.getByRole('button', { name: 'Apply party' }))

    await user.click(screen.getByRole('tab', { name: 'View Trigger setup and Result' }))
    await user.click(screen.getByRole('button', { name: 'Change W-Engine from Spectral Gaze' }))
    await user.click(screen.getByRole('button', { name: 'Select Ice-Jade Teapot W1' }))
    await user.click(screen.getByRole('button', { name: 'Change Disc 5 main stat from Electric DMG' }))
    await user.click(screen.getByRole('button', { name: 'Select PEN Ratio for Disc 5' }))

    await user.click(screen.getByRole('tab', { name: 'View Anby: Soldier 0 setup and Result' }))
    await user.click(screen.getByRole('button', { name: 'Change Disc 5 main stat from Electric DMG' }))
    await user.click(screen.getByRole('button', { name: 'Select PEN Ratio for Disc 5' }))
    await user.click(screen.getByRole('tab', { name: 'View Dialyn setup and Result' }))
    await user.click(screen.getByRole('button', { name: 'Change Disc 5 main stat from ATK%' }))
    await user.click(screen.getByRole('button', { name: 'Select PEN Ratio for Disc 5' }))

    await user.click(screen.getByRole('tab', { name: 'View Trigger setup and Result' }))
    await user.click(screen.getByRole('button', { name: 'Change W-Engine from Ice-Jade Teapot' }))
    await user.click(screen.getByRole('button', { name: 'Select Spectral Gaze W1' }))

    expect(screen.getByRole('status')).toHaveTextContent(
      '3 setup selections now require a choice: Anby: Soldier 0 Disc 5 main stat and Dialyn Disc 5 main stat and Trigger Disc 5 main stat.',
    )
    expect(screen.getByRole('tab', {
      name: 'View Anby: Soldier 0 setup and Result, setup incomplete',
    })).toHaveClass('is-setup-incomplete')
    expect(screen.getByRole('tab', {
      name: 'View Dialyn setup and Result, setup incomplete',
    })).toHaveClass('is-setup-incomplete')
    expect(screen.getByRole('tab', {
      name: 'Close Trigger setup and Result, setup incomplete',
    })).toHaveClass('is-setup-incomplete')
    expect(screen.getByRole('button', {
      name: 'Change W-Engine from Spectral Gaze',
    })).toHaveFocus()
    expect(screen.queryByRole('heading', { name: 'Trigger Result' })).not.toBeInTheDocument()
    expect(screen.getByText('INCOMPLETE')).toBeInTheDocument()

    const liveRegion = screen.getByRole('status')
    const liveRegionMutations: MutationRecord[] = []
    const liveRegionObserver = new MutationObserver((records) => {
      liveRegionMutations.push(...records)
    })
    liveRegionObserver.observe(liveRegion, { childList: true, characterData: true, subtree: true })
    await user.click(screen.getByRole('tab', {
      name: 'View Anby: Soldier 0 setup and Result, setup incomplete',
    }))
    expect(screen.getByRole('button', { name: 'Disc 5 main stat required' })).toBeInTheDocument()
    expect(screen.getByLabelText('CRIT Rate hit count')).toBeInTheDocument()
    expect(liveRegionMutations).toEqual([])
    liveRegionObserver.disconnect()
    await user.click(screen.getByRole('button', { name: 'Disc 5 main stat required' }))
    await user.click(screen.getByRole('button', { name: 'Select Electric DMG for Disc 5' }))

    expect(screen.getByRole('status')).toBeEmptyDOMElement()
    expect(screen.getByRole('tab', {
      name: 'View Dialyn setup and Result, setup incomplete',
    })).toHaveClass('is-setup-incomplete')
    expect(screen.getByRole('tab', {
      name: 'Close Anby: Soldier 0 setup and Result',
    })).not.toHaveClass('is-setup-incomplete')
    expect(screen.queryByRole('heading', { name: 'Anby: Soldier 0 Result' }))
      .not.toBeInTheDocument()

    await user.click(screen.getByRole('tab', {
      name: 'View Dialyn setup and Result, setup incomplete',
    }))
    await user.click(screen.getByRole('button', { name: 'Disc 5 main stat required' }))
    const candidates = screen.getByLabelText('Disc 5 main-stat candidates')
    expect(within(candidates).queryByRole('button', {
      name: 'Select PEN Ratio for Disc 5',
    })).not.toBeInTheDocument()
    await user.click(within(candidates).getByRole('button', {
      name: 'Select ATK% for Disc 5',
    }))

    expect(screen.queryByRole('heading', { name: 'Dialyn Result' })).not.toBeInTheDocument()
    expect(screen.getByText('INCOMPLETE')).toBeInTheDocument()
    expect(document.querySelectorAll('.is-setup-incomplete')).toHaveLength(1)

    await user.click(screen.getByRole('tab', {
      name: 'View Trigger setup and Result, setup incomplete',
    }))
    await user.click(screen.getByRole('button', { name: 'Disc 5 main stat required' }))
    const triggerCandidates = screen.getByLabelText('Disc 5 main-stat candidates')
    expect(within(triggerCandidates).queryByRole('button', {
      name: 'Select PEN Ratio for Disc 5',
    })).not.toBeInTheDocument()
    await user.click(within(triggerCandidates).getByRole('button', {
      name: 'Select Electric DMG for Disc 5',
    }))

    expect(screen.getByRole('heading', { name: 'Trigger Result' })).toBeInTheDocument()
    expect(screen.getByText('PREPARED')).toBeInTheDocument()
    expect(document.querySelectorAll('.is-setup-incomplete')).toHaveLength(0)
  }, 10_000)

  it('repairs Lycaon King selections with a visible neutral substat and no restored history', async () => {
    const user = userEvent.setup()
    render(<App />)
    const replace = async (slot: number, agent: RegExp) => {
      await user.click(screen.getByRole('button', { name: new RegExp(`Replace slot ${slot},`) }))
      await user.click(screen.getByRole('button', { name: agent }))
    }

    await user.click(screen.getByRole('button', { name: 'Edit party' }))
    await replace(1, /Corin, Physical, Attack/)
    await replace(2, /Lycaon, Ice, Stun/)
    await replace(3, /Astra Yao, Ether, Support/)
    await user.click(screen.getByRole('button', { name: 'Apply party' }))
    await user.click(screen.getByRole('tab', { name: 'View Lycaon setup and Result' }))

    await user.click(screen.getByRole('button', {
      name: 'Change 2-piece Drive Disc from Shockstar Disco',
    }))
    await user.click(screen.getByRole('button', {
      name: 'Select Woodpecker Electro as twoPiece',
    }))
    await user.clear(screen.getByLabelText('CRIT Rate hit count'))
    await user.type(screen.getByLabelText('CRIT Rate hit count'), '7')
    await user.tab()

    await user.click(screen.getByRole('button', {
      name: 'Change 4-piece Drive Disc from King of the Summit',
    }))
    await user.click(screen.getByRole('button', {
      name: 'Select Astral Voice as fourPiece',
    }))
    expect(screen.getByRole('button', { name: '2-piece Drive Disc required' }))
      .toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Disc 4 main stat required' }))
      .toBeInTheDocument()
    expect(screen.queryByLabelText('CRIT Rate hit count')).not.toBeInTheDocument()
    expect(screen.getByRole('region', { name: 'Empty Result' })).toBeInTheDocument()

    await user.click(screen.getByRole('button', {
      name: 'Change 4-piece Drive Disc from Astral Voice',
    }))
    await user.click(screen.getByRole('button', {
      name: 'Select King of the Summit as fourPiece',
    }))
    const neutralCount = screen.getByLabelText('CRIT Rate hit count')
    expect(neutralCount).toHaveValue('0')
    expect(neutralCount).not.toHaveAttribute('aria-invalid', 'true')
    expect(screen.getByRole('status')).not.toHaveTextContent('Lycaon CRIT Rate hit count')
    expect(screen.getByRole('region', { name: 'Empty Result' })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: '2-piece Drive Disc required' }))
    await user.click(screen.getByRole('button', {
      name: 'Select Shockstar Disco as twoPiece',
    }))
    await user.click(screen.getByRole('button', { name: 'Disc 4 main stat required' }))
    await user.click(screen.getByRole('button', {
      name: 'Select CRIT Rate for Disc 4',
    }))
    expect(screen.getByRole('heading', { name: 'Lycaon Result' })).toBeInTheDocument()
    expect(screen.getByText('PREPARED')).toBeInTheDocument()
    expect(screen.getByLabelText('CRIT Rate hit count')).toHaveValue('0')
  }, 20_000)

  it('applies semantic Spectral pressure to Evelyn without an Agent-name exception', async () => {
    const user = userEvent.setup()
    render(<App />)
    const replace = async (slot: number, agent: RegExp) => {
      await user.click(screen.getByRole('button', { name: new RegExp(`Replace slot ${slot},`) }))
      await user.click(screen.getByRole('button', { name: agent }))
    }

    await user.click(screen.getByRole('button', { name: 'Edit party' }))
    await replace(1, /Evelyn, Fire, Attack/)
    await replace(2, /Trigger, Electric, Stun/)
    await replace(3, /Astra Yao, Ether, Support/)
    await user.click(screen.getByRole('button', { name: 'Apply party' }))

    expect(screen.getByRole('button', {
      name: 'Change Disc 5 main stat from Fire DMG',
    })).toBeInTheDocument()

    await user.click(screen.getByRole('tab', { name: 'View Trigger setup and Result' }))
    await user.click(screen.getByRole('button', { name: 'Change W-Engine from Spectral Gaze' }))
    await user.click(screen.getByRole('button', { name: 'Select Ice-Jade Teapot W1' }))

    await user.click(screen.getByRole('tab', { name: 'View Evelyn setup and Result' }))
    await user.click(screen.getByRole('button', {
      name: 'Change Disc 5 main stat from Fire DMG',
    }))
    await user.click(screen.getByRole('button', {
      name: 'Select PEN Ratio for Disc 5',
    }))

    await user.click(screen.getByRole('tab', { name: 'View Trigger setup and Result' }))
    await user.click(screen.getByRole('button', { name: 'Change W-Engine from Ice-Jade Teapot' }))
    await user.click(screen.getByRole('button', { name: 'Select Spectral Gaze W1' }))

    expect(screen.getByRole('status')).toHaveTextContent(
      '1 setup selections now require a choice: Evelyn Disc 5 main stat.',
    )
    expect(screen.getByRole('tab', {
      name: 'View Evelyn setup and Result, setup incomplete',
    })).toHaveClass('is-setup-incomplete')

    await user.click(screen.getByRole('tab', {
      name: 'View Evelyn setup and Result, setup incomplete',
    }))
    await user.click(screen.getByRole('button', { name: 'Disc 5 main stat required' }))
    const candidates = screen.getByLabelText('Disc 5 main-stat candidates')
    expect(within(candidates).queryByRole('button', {
      name: 'Select PEN Ratio for Disc 5',
    })).not.toBeInTheDocument()
    await user.click(within(candidates).getByRole('button', {
      name: 'Select Fire DMG for Disc 5',
    }))
    expect(screen.getByRole('heading', { name: 'Evelyn Result' })).toBeInTheDocument()
    expect(screen.getByText('PREPARED')).toBeInTheDocument()
  }, 10_000)

  it('offers Dialyn Slot 6 Impact and recalculates its existing Result row', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.click(screen.getByRole('tab', {
      name: 'View Dialyn setup and Result',
    }))
    await user.click(screen.getByRole('button', {
      name: 'Change Disc 6 main stat from Energy Regen',
    }))
    const candidates = screen.getByLabelText('Disc 6 main-stat candidates')
    const impactChoice = within(candidates).getByRole('button', {
      name: 'Select Impact for Disc 6',
    })
    expect(impactChoice).toBeInTheDocument()

    await user.click(impactChoice)
    const selectedSlot6 = screen.getByRole('button', {
      name: 'Change Disc 6 main stat from Impact',
    })
    expect(selectedSlot6).toHaveFocus()
    expect(screen.getByRole('row', {
      name: /Impact.*129[.]8.*180[.]6.*180[.]6/,
    })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Impact' }))
    const impactSources = screen.getByRole('table', {
      name: 'Impact source contributions',
    })
    expect(within(impactSources).getByRole('row', {
      name: /Drive Disc.*Slot 6.*[+]18%/,
    })).toHaveAttribute('data-source-tone', 'disc-slot-6')
  })

  it('recalculates Lucia Slot 6 support through the existing Result flow', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.click(screen.getByRole('tab', { name: 'View Lucia setup and Result' }))
    await user.click(screen.getByRole('button', {
      name: 'Change Disc 6 main stat from HP%',
    }))
    const candidates = screen.getByLabelText('Disc 6 main-stat candidates')
    const energyRegenChoice = within(candidates).getByRole('button', {
      name: 'Select Energy Regen for Disc 6',
    })
    expect(energyRegenChoice).toBeInTheDocument()
    await user.click(energyRegenChoice)
    const selectedSlot6 = screen.getByRole('button', {
      name: 'Change Disc 6 main stat from Energy Regen',
    })
    expect(selectedSlot6).toHaveFocus()

    expect(screen.getByRole('row', {
      name: /Energy Regen.*2[.]34.*2[.]74.*2[.]74/,
    })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Max HP' }))
    expect(screen.getByRole('group', {
      name: /Initial Max HP: current 19,154.*cap 24,000; Squad Sheer Force: [+]720[.]7, cap 900/,
    })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Energy Regen' }))
    const energySources = screen.getByRole('table', {
      name: 'Energy Regen source contributions',
    })
    const slot6Source = within(energySources).getByRole('row', {
      name: /Drive Disc.*Slot 6.*[+]60%/,
    })
    expect(slot6Source).toHaveAttribute('data-source-tone', 'disc-slot-6')
    await user.hover(slot6Source)
    expect(selectedSlot6.closest('.main-stat-selection')).toHaveClass('is-source-active')

    await user.click(screen.getByRole('tab', { name: 'View Yixuan setup and Result' }))
    expect(screen.getByRole('row', {
      name: /Sheer Force.*2,222[.]7.*2,222[.]7.*3,272[.]1/,
    })).toBeInTheDocument()
  })

  it('offers Lucia Swing Jazz as a local 2-piece Energy Regen tradeoff', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.click(screen.getByRole('tab', { name: 'View Lucia setup and Result' }))
    expect(screen.getByRole('button', {
      name: 'Change 2-piece Drive Disc from Yunkui Tales',
    })).toBeInTheDocument()
    expect(screen.getByRole('row', {
      name: /Max HP.*21,697.*21,697.*26,037/,
    })).toBeInTheDocument()

    await user.click(screen.getByRole('button', {
      name: 'Change 2-piece Drive Disc from Yunkui Tales',
    }))
    const candidates = screen.getByLabelText('twoPiece Drive Disc candidates')
    await user.click(within(candidates).getByRole('button', {
      name: 'Select Swing Jazz as twoPiece',
    }))
    const selected = screen.getByRole('button', {
      name: 'Change 2-piece Drive Disc from Swing Jazz',
    })
    expect(selected).toHaveFocus()
    expect(screen.getByRole('row', {
      name: /Energy Regen.*1[.]82.*2[.]22.*2[.]22/,
    })).toBeInTheDocument()
    expect(screen.getByRole('row', {
      name: /Max HP.*20,849.*20,849.*25,019/,
    })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Energy Regen' }))
    expect(within(screen.getByRole('table', {
      name: 'Energy Regen source contributions',
    })).getByRole('row', { name: /Swing Jazz/ }))
      .toHaveAttribute('data-source-tone', 'disc-2pc')
  })

  it('offers and recalculates partner W-Engine directions', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.click(screen.getByRole('tab', { name: 'View Dialyn setup and Result' }))
    await user.click(screen.getByRole('button', {
      name: 'Change W-Engine from Yesterday Calls',
    }))
    const dialynCandidates = screen.getByLabelText('W-Engine candidates')
    expect(within(dialynCandidates).getAllByRole('button').map(({ ariaLabel }) => ariaLabel))
      .toEqual([
        'Select Hellfire Gears W1',
        'Select Steam Oven W5',
        'Select Precious Fossilized Core W5',
      ])
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
    const thoughtbop = within(luciaCandidates).getByRole('button', {
      name: 'Select Thoughtbop W1',
    })
    expect(within(thoughtbop).getByText('Energy +0.6/s')).toBeInTheDocument()
    expect(within(thoughtbop).getByText('Squad DMG +25%')).toBeInTheDocument()
    expect(within(thoughtbop).getByText('Squad ATK +10%')).toBeInTheDocument()
    expect(thoughtbop).toHaveAccessibleDescription(
      'Energy Regen +60%. Energy +0.6/s. Squad DMG +25%. Squad ATK +10%',
    )
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
})
