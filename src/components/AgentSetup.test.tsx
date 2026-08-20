import { useReducer } from 'react'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { DISC_IDS_BY_AGENT_AND_PIECE, MAIN_STAT_IDS_BY_AGENT_AND_SLOT, type AgentId, type EngineId, type MainSlot, type MainStatId } from '../workbench/content'
import { createPreparedState, isCompleteWorkbench, workbenchReducer, type AppliedSlot } from '../workbench/state'
import { AgentSetup } from './AgentSetup'
import { effectiveFourPieceIds, effectiveFourPieceRoleSwapIds, effectiveMainStatIds, effectiveSubstatChoicesForSlot, effectiveTwoPieceIds } from '../workbench/candidates'

const singleCandidateMains: Record<MainSlot, readonly MainStatId[]> = {
  slot4: ['critRate'],
  slot5: ['hpPct'],
  slot6: ['hpPct'],
}

function IncompleteSetupHarness({ agentId = 'yixuan' }: { agentId?: AgentId }) {
  const [state, dispatch] = useReducer(workbenchReducer, undefined, () => {
    const prepared = createPreparedState({}, [agentId, 'lycaon', 'lucia'], 0)
    prepared.slots[0] = {
      ...prepared.slots[0],
      setup: {
        ...prepared.slots[0].setup,
        mains: { ...prepared.slots[0].setup.mains, slot5: null },
      },
    }
    return prepared
  })

  return (
    <AgentSetup
      activeSourceTone={null}
      agentId={agentId}
      discCandidates={DISC_IDS_BY_AGENT_AND_PIECE[agentId]}
      dispatch={dispatch}
      mainStatCandidates={singleCandidateMains}
      onSourceToneChange={vi.fn()}
      setup={state.slots[0].setup}
      slot={0}
    />
  )
}

describe('AgentSetup incomplete main-stat recovery', () => {
  it('keeps the stat bank operable and selects the sole effective candidate', async () => {
    const user = userEvent.setup()
    render(<IncompleteSetupHarness />)

    const required = screen.getByRole('button', { name: 'Disc 5 main stat required' })
    expect(screen.getByLabelText('Disc 4 CRIT Rate selected')).toBeInTheDocument()
    expect(screen.getByLabelText('Disc 6 HP% selected')).toBeInTheDocument()
    expect(screen.getByLabelText('HP% hit count')).toBeInTheDocument()

    required.focus()
    await user.keyboard('{Enter}')
    const candidates = screen.getByLabelText('Disc 5 main-stat candidates')
    expect(within(candidates).getAllByRole('button')).toHaveLength(1)
    const soleCandidate = within(candidates).getByRole('button', {
      name: 'Select HP% for Disc 5',
    })
    soleCandidate.focus()
    await user.keyboard('{Enter}')

    await waitFor(() => {
      expect(screen.getByLabelText('Disc 5 HP% selected')).toHaveFocus()
    })
    expect(screen.queryByRole('button', { name: 'Disc 5 main stat required' }))
      .not.toBeInTheDocument()
  })
})

describe('AgentSetup new Rupture incomplete main-stat recovery', () => {
  it.each(['yidhari', 'manato'] as const)(
    'keeps %s incomplete without a hidden prepared selection',
    (agentId) => {
      render(<IncompleteSetupHarness agentId={agentId} />)

      expect(screen.getByRole('button', { name: 'Disc 5 main stat required' })).toBeInTheDocument()
      expect(screen.getByLabelText('HP% hit count')).toHaveValue('0')
    },
  )
})

describe('AgentSetup Hugo incomplete main-stat recovery', () => {
  it('keeps Hugo incomplete without a hidden prepared selection', () => {
    render(<IncompleteSetupHarness agentId="hugo" />)

    expect(screen.getByRole('button', { name: 'Disc 5 main stat required' })).toBeInTheDocument()
    expect(screen.getByLabelText('ATK% hit count')).toHaveValue('0')
  })
})

describe('AgentSetup Pan Yinhu Drive Disc candidates', () => {
  it('compresses the selected Bunny package on the setup surface', () => {
    const state = createPreparedState({}, ['cissia', 'panYinhu', 'yixuan'], 2)

    render(
      <AgentSetup
        activeSourceTone={null}
        agentId="panYinhu"
        discCandidates={DISC_IDS_BY_AGENT_AND_PIECE.panYinhu}
        dispatch={vi.fn()}
        mainStatCandidates={MAIN_STAT_IDS_BY_AGENT_AND_SLOT.panYinhu}
        onSourceToneChange={vi.fn()}
        setup={state.slots[1].setup}
        slot={1}
      />,
    )

    expect(screen.getByLabelText(
      'Bunny in Wonderland selected as 4-piece',
    )).toHaveAccessibleDescription('Squad DMG +18%. HP +10%')
  })

  it('shows Bunny in Wonderland as a complete candidate package', async () => {
    const user = userEvent.setup()
    const state = createPreparedState({}, ['yixuan', 'panYinhu', 'juFufu'], 0)

    render(
      <AgentSetup
        activeSourceTone={null}
        agentId="panYinhu"
        discCandidates={DISC_IDS_BY_AGENT_AND_PIECE.panYinhu}
        dispatch={vi.fn()}
        mainStatCandidates={MAIN_STAT_IDS_BY_AGENT_AND_SLOT.panYinhu}
        onSourceToneChange={vi.fn()}
        setup={state.slots[1].setup}
        slot={1}
      />,
    )

    await user.click(screen.getByRole('button', {
      name: 'Change 4-piece Drive Disc from Astral Voice',
    }))
    expect(within(screen.getByLabelText('fourPiece Drive Disc candidates')).getByRole('button', {
      name: 'Select Bunny in Wonderland as fourPiece',
    })).toHaveAccessibleDescription('Squad DMG +18%. HP +10%')
  })
})

describe('AgentSetup partial W-Engine package', () => {
  it('shows the source-owned Steel Cushion package without holder compatibility labels', () => {
    const state = createPreparedState({}, ['starlightBilly', 'dialyn', 'lucia'], 0)
    state.slots[0] = {
      ...state.slots[0],
      setup: { ...state.slots[0].setup, engineId: 'steelCushion', refinement: 1 },
    }

    render(
      <AgentSetup
        activeSourceTone={null}
        agentId="starlightBilly"
        discCandidates={DISC_IDS_BY_AGENT_AND_PIECE.starlightBilly}
        dispatch={vi.fn()}
        mainStatCandidates={MAIN_STAT_IDS_BY_AGENT_AND_SLOT.starlightBilly}
        onSourceToneChange={vi.fn()}
        setup={state.slots[0].setup}
        slot={0}
      />,
    )

    expect(screen.getByRole('button', {
      name: 'Change W-Engine from Steel Cushion',
    })).toHaveAccessibleDescription(
      'CRIT Rate +24%. Physical DMG +20%. Back Attack DMG +25%',
    )
    expect(screen.queryByText(/Specialty passive inactive|Inactive ·/)).not.toBeInTheDocument()
  })

  it.each([
    {
      agentId: 'trigger',
      party: ['anbySoldier0', 'trigger', 'astraYao'] as [AgentId, AgentId, AgentId],
      slot: 1 as AppliedSlot,
      selectedName: 'Spectral Gaze',
      candidateId: 'blazingLaurel',
      candidateName: 'Blazing Laurel',
      candidateRefinement: 1,
      description: 'Impact +18%. Impact +25%. Fire & Ice CRIT DMG +30%',
    },
    {
      agentId: 'cissia',
      party: ['seed', 'cissia', 'astraYao'] as [AgentId, AgentId, AgentId],
      slot: 1 as AppliedSlot,
      selectedName: 'Serpentine Seeker',
      candidateId: 'bellicoseBlaze',
      candidateName: 'Bellicose Blaze',
      candidateRefinement: 1,
      description: 'Energy Regen +60%. CRIT Rate +20%. Fire Aftershock DEF Ignore +30%',
    },
    {
      agentId: 'anby',
      party: ['billy', 'anby', 'nekomata'] as [AgentId, AgentId, AgentId],
      slot: 1 as AppliedSlot,
      selectedName: 'Hellfire Gears',
      candidateId: 'demaraBatteryMarkII',
      candidateName: 'Demara Battery Mark II',
      candidateRefinement: 5,
      description: 'Impact +15%. Electric DMG +24%. Energy Generation Rate +27.5%',
    },
  ] as const)(
    'keeps the complete $candidateName package accessible as candidate and selection',
    async ({
      agentId, party, slot, selectedName, candidateId, candidateName,
      candidateRefinement = 1, description,
    }) => {
      const user = userEvent.setup()
      const state = createPreparedState({}, party, 0)
      const setup = state.slots[slot].setup
      const props = {
        activeSourceTone: null,
        agentId,
        discCandidates: DISC_IDS_BY_AGENT_AND_PIECE[agentId],
        dispatch: vi.fn(),
        mainStatCandidates: MAIN_STAT_IDS_BY_AGENT_AND_SLOT[agentId],
        onSourceToneChange: vi.fn(),
        slot,
      } as const
      const { rerender } = render(<AgentSetup {...props} setup={setup} />)

      await user.click(screen.getByRole('button', {
        name: `Change W-Engine from ${selectedName}`,
      }))
      const candidate = within(screen.getByLabelText('W-Engine candidates'))
        .getByRole('button', { name: `Select ${candidateName} W${candidateRefinement}` })
      expect(candidate).toHaveAccessibleDescription(description)

      rerender(<AgentSetup
        {...props}
        setup={{ ...setup, engineId: candidateId as EngineId, refinement: candidateRefinement }}
      />)
      expect(screen.getByRole('button', {
        name: `Change W-Engine from ${candidateName}`,
      })).toHaveAccessibleDescription(description)
    },
  )

  it('shows Caesar source-owned candidates while leaving compatibility to Result', async () => {
    const user = userEvent.setup()
    const state = createPreparedState(
      { caesar: 'nonLimited' },
      ['corin', 'caesar', 'astraYao'],
      0,
    )
    render(
      <AgentSetup
        activeSourceTone={null}
        agentId="caesar"
        discCandidates={DISC_IDS_BY_AGENT_AND_PIECE.caesar}
        dispatch={vi.fn()}
        mainStatCandidates={MAIN_STAT_IDS_BY_AGENT_AND_SLOT.caesar}
        onSourceToneChange={vi.fn()}
        setup={state.slots[1].setup}
        slot={1}
      />,
    )

    expect(screen.getByRole('button', { name: 'Change W-Engine from Spring Embrace' }))
      .toHaveAccessibleDescription(
      'ATK +25%. DMG taken -12%. Energy Generation Rate +16% · Transfers to next on-field Agent',
      )
    await user.click(screen.getByRole('button', { name: 'Change W-Engine from Spring Embrace' }))
    expect(screen.getByRole('button', { name: 'Select Hellfire Gears W1' }))
      .toHaveAccessibleDescription('Impact +18%. Energy +0.6/s. Impact +20%')
    expect(screen.queryByText(/Specialty passive inactive|Inactive ·/)).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Change 2-piece Drive Disc from Swing Jazz' }))
      .toHaveAccessibleDescription('Energy Regen +20%')
    await user.click(screen.getByRole('button', { name: 'Change 2-piece Drive Disc from Swing Jazz' }))
    expect(screen.getByRole('button', { name: 'Select Shockstar Disco as twoPiece' }))
      .toHaveAccessibleDescription('Impact +6%')
    expect(screen.getByRole('button', { name: 'Select King of the Summit as twoPiece' }))
      .toHaveAccessibleDescription('Daze +6%')
  })

  it('preserves Deep Sea Visitor’s complete selected and candidate descriptions', async () => {
    const user = userEvent.setup()
    const state = createPreparedState({}, ['ellen', 'soukaku', 'lycaon'], 0)
    const props = {
      activeSourceTone: null,
      agentId: 'ellen' as const,
      discCandidates: DISC_IDS_BY_AGENT_AND_PIECE.ellen,
      dispatch: vi.fn(),
      mainStatCandidates: MAIN_STAT_IDS_BY_AGENT_AND_SLOT.ellen,
      onSourceToneChange: vi.fn(),
      slot: 0 as const,
    }
    const deepSeaDescription = 'Ice DMG +25%. CRIT Rate +20%'
    const { rerender } = render(<AgentSetup {...props} setup={state.slots[0].setup} />)
    expect(screen.getByRole('button', { name: 'Change W-Engine from Deep Sea Visitor' }))
      .toHaveAccessibleDescription(`CRIT Rate +24%. ${deepSeaDescription}`)

    rerender(<AgentSetup {...props} setup={{
      ...state.slots[0].setup,
      engineId: 'myriadEclipse',
      refinement: 1,
    }} />)
    await user.click(screen.getByRole('button', { name: 'Change W-Engine from Myriad Eclipse' }))
    expect(within(screen.getByLabelText('W-Engine candidates'))
      .getByRole('button', { name: 'Select Deep Sea Visitor W1' }))
      .toHaveAccessibleDescription(`CRIT Rate +24%. ${deepSeaDescription}`)
  })
})

describe('AgentSetup Seed Additional Ability', () => {
  it('keeps Seed\'s event Energy fact as compact Setup content only', () => {
    const state = createPreparedState({}, ['seed', 'cissia', 'astraYao'], 0)

    render(
      <AgentSetup
        activeSourceTone={null}
        agentId="seed"
        discCandidates={DISC_IDS_BY_AGENT_AND_PIECE.seed}
        dispatch={vi.fn()}
        mainStatCandidates={MAIN_STAT_IDS_BY_AGENT_AND_SLOT.seed}
        onSourceToneChange={vi.fn()}
        setup={state.slots[0].setup}
        slot={0}
      />,
    )

    expect(screen.getByLabelText('Seed Additional Ability')).toHaveTextContent(
      'Vanguard +2 Energy when Seed deals damage as the active character, once per 1s',
    )
    expect(screen.queryByText(/\+2\/s|Energy Regen/)).not.toBeInTheDocument()
  })
})

describe('AgentSetup Orphie and Pulchra equipment packages', () => {
  it('keeps Gilded Blossom complete on Orphie candidate and selected surfaces', async () => {
    const user = userEvent.setup()
    const state = createPreparedState({}, ['anbySoldier0', 'orphie', 'pulchra'], 0)
    const setup = state.slots[1].setup
    const props = {
      activeSourceTone: null,
      agentId: 'orphie' as const,
      discCandidates: DISC_IDS_BY_AGENT_AND_PIECE.orphie,
      dispatch: vi.fn(),
      mainStatCandidates: MAIN_STAT_IDS_BY_AGENT_AND_SLOT.orphie,
      onSourceToneChange: vi.fn(),
      slot: 1 as const,
    }
    const description = 'ATK +25%. ATK +9.6%. EX Special Attack DMG +24%'
    const { rerender } = render(<AgentSetup {...props} setup={setup} />)

    await user.click(screen.getByRole('button', {
      name: 'Change W-Engine from Bellicose Blaze',
    }))
    expect(within(screen.getByLabelText('W-Engine candidates')).getByRole('button', {
      name: 'Select Gilded Blossom W5',
    })).toHaveAccessibleDescription(description)

    rerender(<AgentSetup {...props} setup={{
      ...setup,
      engineId: 'gildedBlossom',
      refinement: 5,
    }} />)
    expect(screen.getByRole('button', {
      name: 'Change W-Engine from Gilded Blossom',
    })).toHaveAccessibleDescription(description)
  })

  it('keeps Box Cutter and Astral Voice complete on Pulchra surfaces', async () => {
    const user = userEvent.setup()
    const state = createPreparedState({}, ['anbySoldier0', 'orphie', 'pulchra'], 0)
    const setup = state.slots[2].setup
    const props = {
      activeSourceTone: null,
      agentId: 'pulchra' as const,
      discCandidates: DISC_IDS_BY_AGENT_AND_PIECE.pulchra,
      dispatch: vi.fn(),
      mainStatCandidates: MAIN_STAT_IDS_BY_AGENT_AND_SLOT.pulchra,
      onSourceToneChange: vi.fn(),
      slot: 2 as const,
    }
    const boxDescription = 'Impact +15%. Physical DMG +24%. Daze +16%'
    const { rerender } = render(<AgentSetup {...props} setup={setup} />)

    await user.click(screen.getByRole('button', {
      name: 'Change W-Engine from Blazing Laurel',
    }))
    expect(within(screen.getByLabelText('W-Engine candidates')).getByRole('button', {
      name: 'Select Box Cutter W5',
    })).toHaveAccessibleDescription(boxDescription)

    rerender(<AgentSetup {...props} setup={{
      ...setup,
      engineId: 'boxCutter',
      refinement: 5,
    }} />)
    expect(screen.getByRole('button', {
      name: 'Change W-Engine from Box Cutter',
    })).toHaveAccessibleDescription(boxDescription)

    await user.click(screen.getByRole('button', {
      name: 'Change 4-piece Drive Disc from King of the Summit',
    }))
    expect(within(screen.getByLabelText('fourPiece Drive Disc candidates')).getByRole('button', {
      name: 'Select Astral Voice as fourPiece',
    })).toHaveAccessibleDescription(
      'Entrant DMG +24%. ATK +10%',
    )
  })
})

describe('AgentSetup Ben and Koleda equipment packages', () => {
  it('keeps Ben selected, partial, and event-only W-Engine packages complete', async () => {
    const user = userEvent.setup()
    const state = createPreparedState({}, ['ben', 'koleda', 'panYinhu'], 0)
    const setup = state.slots[0].setup
    const props = {
      activeSourceTone: null,
      agentId: 'ben' as const,
      discCandidates: DISC_IDS_BY_AGENT_AND_PIECE.ben,
      dispatch: vi.fn(),
      mainStatCandidates: MAIN_STAT_IDS_BY_AGENT_AND_SLOT.ben,
      onSourceToneChange: vi.fn(),
      slot: 0 as const,
    }
    const { rerender } = render(<AgentSetup {...props} setup={setup} />)

    expect(screen.getByRole('button', {
      name: 'Change W-Engine from Tremor Trigram Vessel',
    })).toHaveAccessibleDescription(
      'ATK +25%. EX Special & Ultimate DMG +40%. Squad takes DMG or heals · Energy +3.2',
    )

    await user.click(screen.getByRole('button', {
      name: 'Change W-Engine from Tremor Trigram Vessel',
    }))
    const candidates = screen.getByLabelText('W-Engine candidates')
    expect(within(candidates).getByRole('button', {
      name: 'Select Hailstorm Shrine W1',
    })).toHaveAccessibleDescription(
      'CRIT Rate +24%. CRIT DMG +50%. Ice DMG +40%',
    )
    expect(within(candidates).getByRole('button', {
      name: 'Select Big Cylinder W5',
    })).toHaveAccessibleDescription(
      'DEF +40%. DMG taken -12%. Next hit guaranteed CRIT with added 960% DEF DMG',
    )
    expect(within(candidates).getByRole('button', {
      name: 'Select Spring Embrace W5',
    })).toHaveAccessibleDescription(
      'ATK +25%. DMG taken -12%. Energy Generation Rate +16% · Transfers to next on-field Agent',
    )

    rerender(<AgentSetup {...props} setup={{
      ...setup, engineId: 'bigCylinder', refinement: 5,
    }} />)
    expect(screen.getByRole('button', {
      name: 'Change W-Engine from Big Cylinder',
    })).toHaveAccessibleDescription(
      'DEF +40%. DMG taken -12%. Next hit guaranteed CRIT with added 960% DEF DMG',
    )
  })

  it('keeps Koleda Hellfire and Stun Disc package accessible', async () => {
    const user = userEvent.setup()
    const state = createPreparedState({}, ['ben', 'koleda', 'panYinhu'], 0)
    render(
      <AgentSetup
        activeSourceTone={null}
        agentId="koleda"
        discCandidates={DISC_IDS_BY_AGENT_AND_PIECE.koleda}
        dispatch={vi.fn()}
        mainStatCandidates={MAIN_STAT_IDS_BY_AGENT_AND_SLOT.koleda}
        onSourceToneChange={vi.fn()}
        setup={state.slots[1].setup}
        slot={1}
      />,
    )

    expect(screen.getByRole('button', {
      name: 'Change W-Engine from Hellfire Gears',
    })).toHaveAccessibleDescription('Impact +18%. Energy +0.6/s. Impact +20%')
    expect(screen.getByRole('button', {
      name: 'Change 4-piece Drive Disc from King of the Summit',
    })).toHaveAccessibleDescription('Squad CRIT DMG +30%. Daze +6%')
    await user.click(screen.getByRole('button', {
      name: 'Change 4-piece Drive Disc from King of the Summit',
    }))
    expect(within(screen.getByLabelText('fourPiece Drive Disc candidates')).getByRole('button', {
      name: 'Select Astral Voice as fourPiece',
    })).toHaveAccessibleDescription(
      'Entrant DMG +24%. ATK +10%',
    )
  })
})

describe('AgentSetup compressed Disc effects', () => {
  it('reuses the compressed White Water package on selected and candidate surfaces', async () => {
    const user = userEvent.setup()
    const state = createPreparedState({}, ['yeShunguang', 'zhao', 'astraYao'], 0)
    const props = {
      activeSourceTone: null,
      agentId: 'yeShunguang' as const,
      discCandidates: DISC_IDS_BY_AGENT_AND_PIECE.yeShunguang,
      dispatch: vi.fn(),
      mainStatCandidates: MAIN_STAT_IDS_BY_AGENT_AND_SLOT.yeShunguang,
      onSourceToneChange: vi.fn(),
      slot: 0 as const,
    }
    const description = 'CRIT Rate +20%. ATK +10%. Physical DMG +10%'
    const { rerender } = render(<AgentSetup {...props} setup={state.slots[0].setup} />)

    expect(screen.getByRole('button', {
      name: 'Change 4-piece Drive Disc from White Water Ballad',
    })).toHaveAccessibleDescription(description)

    rerender(<AgentSetup {...props} setup={{
      ...state.slots[0].setup,
      fourPieceId: 'woodpecker',
    }} />)
    await user.click(screen.getByRole('button', {
      name: 'Change 4-piece Drive Disc from Woodpecker Electro',
    }))
    expect(within(screen.getByLabelText('fourPiece Drive Disc candidates')).getByRole('button', {
      name: 'Select White Water Ballad as fourPiece',
    })).toHaveAccessibleDescription(description)
  })

  it('shows final Dawn and Woodpecker values without routine trigger or stack steps', async () => {
    const user = userEvent.setup()
    const state = createPreparedState({}, ['seed', 'dialyn', 'lucia'], 0)
    state.slots[0] = {
      ...state.slots[0],
      setup: { ...state.slots[0].setup, twoPieceId: 'branchAndBlade' },
    }

    render(
      <AgentSetup
        activeSourceTone={null}
        agentId="seed"
        discCandidates={DISC_IDS_BY_AGENT_AND_PIECE.seed}
        dispatch={vi.fn()}
        mainStatCandidates={MAIN_STAT_IDS_BY_AGENT_AND_SLOT.seed}
        onSourceToneChange={vi.fn()}
        setup={state.slots[0].setup}
        slot={0}
      />,
    )

    const dawn = screen.getByRole('button', {
      name: "Change 4-piece Drive Disc from Dawn's Bloom",
    })
    expect(dawn).toHaveAccessibleDescription(
      'Basic Attack DMG +40%. Basic Attack DMG +15%',
    )
    const dawnEffects = dawn.querySelector('.disc-effect-rows')
    expect(dawnEffects?.querySelectorAll(':scope > span')).toHaveLength(2)
    expect(within(dawn).getByText('Basic Attack DMG +40%')).toBeInTheDocument()
    expect(within(dawn).getByText('Basic Attack DMG +15%')).toBeInTheDocument()
    expect(within(dawn).queryByText(/EX Special or Ultimate/)).not.toBeInTheDocument()

    await user.click(dawn)
    const woodpecker = within(screen.getByLabelText('fourPiece Drive Disc candidates'))
      .getByRole('button', { name: 'Select Woodpecker Electro as fourPiece' })
    const woodpeckerEffects = woodpecker.querySelector('.disc-effect-rows')
    expect(woodpecker).toHaveAccessibleDescription('ATK +27%. CRIT Rate +8%')
    expect(woodpeckerEffects?.querySelectorAll(':scope > span')).toHaveLength(2)
    expect(within(woodpecker).getByText('ATK +27%')).toBeInTheDocument()
    expect(within(woodpecker).getByText('CRIT Rate +8%')).toBeInTheDocument()
    expect(within(woodpecker).queryByText(/Basic, Dodge Counter|each|max/))
      .not.toBeInTheDocument()
  })

  it('keeps affected-action scope when it changes the Disc effect', async () => {
    const user = userEvent.setup()
    const state = createPreparedState({}, ['anbySoldier0', 'trigger', 'astraYao'], 0)

    render(
      <AgentSetup
        activeSourceTone={null}
        agentId="trigger"
        discCandidates={DISC_IDS_BY_AGENT_AND_PIECE.trigger}
        dispatch={vi.fn()}
        mainStatCandidates={MAIN_STAT_IDS_BY_AGENT_AND_SLOT.trigger}
        onSourceToneChange={vi.fn()}
        setup={state.slots[1].setup}
        slot={1}
      />,
    )

    await user.click(screen.getByRole('button', {
      name: 'Change 4-piece Drive Disc from King of the Summit',
    }))
    const shockstar = within(screen.getByLabelText('fourPiece Drive Disc candidates'))
      .getByRole('button', { name: 'Select Shockstar Disco as fourPiece' })
    expect(shockstar).toHaveAccessibleDescription(
      'Basic Attack, Dash Attack & Dodge Counter Daze +20%. Impact +6%',
    )
    expect(within(shockstar).getByText(
      'Basic Attack, Dash Attack & Dodge Counter Daze +20%',
    )).toBeInTheDocument()
  })

  it('uses the common selected and candidate descriptions for the complete Puffer package', async () => {
    const user = userEvent.setup()
    const state = createPreparedState({}, ['seed', 'dialyn', 'astraYao'], 0)
    const discCandidates = {
      fourPiece: ['dawnsBloom', 'pufferElectro'],
      twoPiece: DISC_IDS_BY_AGENT_AND_PIECE.seed.twoPiece,
    } as const

    const { rerender } = render(
      <AgentSetup
        activeSourceTone={null}
        agentId="seed"
        discCandidates={discCandidates}
        dispatch={vi.fn()}
        mainStatCandidates={MAIN_STAT_IDS_BY_AGENT_AND_SLOT.seed}
        onSourceToneChange={vi.fn()}
        setup={state.slots[0].setup}
        slot={0}
      />,
    )

    await user.click(screen.getByRole('button', {
      name: "Change 4-piece Drive Disc from Dawn's Bloom",
    }))
    const candidate = within(screen.getByLabelText('fourPiece Drive Disc candidates'))
      .getByRole('button', { name: 'Select Puffer Electro as fourPiece' })
    expect(candidate).toHaveAccessibleDescription(
      'Ultimate DMG +20%. ATK +15%. PEN Ratio +8%',
    )
    expect(within(candidate).getByText('Ultimate DMG +20%')).toBeInTheDocument()
    expect(within(candidate).getByText('ATK +15%')).toBeInTheDocument()
    expect(within(candidate).getByText('PEN Ratio +8%')).toBeInTheDocument()
    expect(within(candidate).queryByText(/Ultimate activation|12s/)).not.toBeInTheDocument()

    rerender(
      <AgentSetup
        activeSourceTone={null}
        agentId="seed"
        discCandidates={discCandidates}
        dispatch={vi.fn()}
        mainStatCandidates={MAIN_STAT_IDS_BY_AGENT_AND_SLOT.seed}
        onSourceToneChange={vi.fn()}
        setup={{ ...state.slots[0].setup, fourPieceId: 'pufferElectro', twoPieceId: 'woodpecker' }}
        slot={0}
      />,
    )
    expect(screen.getByRole('button', {
      name: 'Change 4-piece Drive Disc from Puffer Electro',
    })).toHaveAccessibleDescription('Ultimate DMG +20%. ATK +15%. PEN Ratio +8%')
  })
})

function DialynDiscHarness() {
  const [state, dispatch] = useReducer(workbenchReducer, undefined, createPreparedState)
  return (
    <>
      <AgentSetup
        activeSourceTone={null}
        agentId="dialyn"
        discCandidates={DISC_IDS_BY_AGENT_AND_PIECE.dialyn}
        dispatch={dispatch}
        mainStatCandidates={MAIN_STAT_IDS_BY_AGENT_AND_SLOT.dialyn}
        onSourceToneChange={vi.fn()}
        setup={state.slots[1].setup}
        slot={1}
      />
      <output data-testid="actual-two-piece">{state.slots[1].setup.twoPieceId}</output>
    </>
  )
}

function TriggerDiscHarness() {
  const [state, dispatch] = useReducer(workbenchReducer, undefined, () => (
    createPreparedState({}, ['anbySoldier0', 'trigger', 'astraYao'], 0)
  ))
  return (
    <>
      <AgentSetup
        activeSourceTone={null}
        agentId="trigger"
        discCandidates={DISC_IDS_BY_AGENT_AND_PIECE.trigger}
        dispatch={dispatch}
        mainStatCandidates={MAIN_STAT_IDS_BY_AGENT_AND_SLOT.trigger}
        onSourceToneChange={vi.fn()}
        setup={state.slots[1].setup}
        slot={1}
      />
      <output data-testid="actual-four-piece">{state.slots[1].setup.fourPieceId}</output>
      <output data-testid="actual-two-piece">{state.slots[1].setup.twoPieceId}</output>
    </>
  )
}

function PanSameEffectDiscHarness() {
  const [state, dispatch] = useReducer(workbenchReducer, undefined, () => (
    createPreparedState({}, ['yixuan', 'panYinhu', 'juFufu'], 0)
  ))
  const slot = 1 as const
  return (
    <>
      <AgentSetup
        activeSourceTone={null}
        agentId="panYinhu"
        discCandidates={{
          fourPiece: effectiveFourPieceIds(state, slot),
          twoPiece: effectiveTwoPieceIds(state, slot),
        }}
        fourPieceRoleSwapIds={effectiveFourPieceRoleSwapIds(state, slot)}
        dispatch={dispatch}
        mainStatCandidates={MAIN_STAT_IDS_BY_AGENT_AND_SLOT.panYinhu}
        onSourceToneChange={vi.fn()}
        setup={state.slots[slot].setup}
        slot={slot}
      />
      <output data-testid="actual-four-piece">{state.slots[slot].setup.fourPieceId}</output>
      <output data-testid="actual-two-piece">{state.slots[slot].setup.twoPieceId}</output>
      <output data-testid="workbench-complete">{String(isCompleteWorkbench(state))}</output>
    </>
  )
}

function IncompleteDiscHarness() {
  const [state, dispatch] = useReducer(workbenchReducer, undefined, () => {
    const prepared = createPreparedState()
    prepared.slots[0] = {
      ...prepared.slots[0],
      setup: {
        ...prepared.slots[0].setup,
        twoPieceId: null,
        mains: { ...prepared.slots[0].setup.mains, slot5: null },
      },
    }
    return prepared
  })

  return (
    <>
      <AgentSetup
        activeSourceTone={null}
        agentId="yixuan"
        discCandidates={{ fourPiece: ['yunkui'], twoPiece: ['woodpecker'] }}
        dispatch={dispatch}
        mainStatCandidates={singleCandidateMains}
        onSourceToneChange={vi.fn()}
        setup={state.slots[0].setup}
        slot={0}
      />
      <output data-testid="workbench-complete">{String(isCompleteWorkbench(state))}</output>
    </>
  )
}

describe('AgentSetup incomplete Disc recovery', () => {
  it('keeps a sole required Disc candidate actionable and returns focus to the repaired fixed surface', async () => {
    const user = userEvent.setup()
    render(<IncompleteDiscHarness />)

    expect(screen.getByLabelText("Yunkui Tales selected as 4-piece")).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Disc 5 main stat required' })).toBeInTheDocument()
    const required = screen.getByRole('button', { name: '2-piece Drive Disc required' })
    required.focus()
    await user.keyboard('{Enter}')

    const candidates = screen.getByLabelText('twoPiece Drive Disc candidates')
    expect(within(candidates).getAllByRole('button')).toHaveLength(1)
    const soleCandidate = within(candidates).getByRole('button', {
      name: 'Select Woodpecker Electro as twoPiece',
    })
    expect(soleCandidate).toHaveAccessibleDescription('CRIT Rate +8%')
    soleCandidate.focus()
    await user.keyboard('{Enter}')

    await waitFor(() => {
      expect(screen.getByLabelText('Woodpecker Electro selected as 2-piece')).toHaveFocus()
    })
    expect(screen.getByLabelText('Woodpecker Electro selected as 2-piece'))
      .toHaveAccessibleDescription('CRIT Rate +8%')
    expect(screen.getByRole('button', { name: 'Disc 5 main stat required' })).toBeInTheDocument()
    expect(screen.getByTestId('workbench-complete')).toHaveTextContent('false')
  })
})

describe('AgentSetup exact two-piece choices', () => {
  it('shows one canonical identity for an equal-effect Disc relationship', async () => {
    const user = userEvent.setup()
    render(<DialynDiscHarness />)

    const selected = screen.getByRole('button', {
      name: 'Change 2-piece Drive Disc from Woodpecker Electro',
    })
    expect(selected).toHaveAccessibleDescription('CRIT Rate +8%')
    await user.click(selected)
    const candidates = screen.getByLabelText('twoPiece Drive Disc candidates')
    expect(within(candidates).getAllByRole('button')).toHaveLength(1)
    const swingJazz = within(candidates).getByRole('button', {
      name: 'Select Swing Jazz as twoPiece',
    })
    expect(swingJazz).toHaveAccessibleDescription('Energy Regen +20%')
    expect(within(candidates).queryByRole('button', {
      name: 'Select Moonlight Lullaby as twoPiece',
    })).not.toBeInTheDocument()
    await user.click(swingJazz)

    expect(screen.getByRole('button', {
      name: 'Change 2-piece Drive Disc from Swing Jazz',
    })).toBeInTheDocument()
    expect(screen.getByTestId('actual-two-piece')).toHaveTextContent('swingJazz')
  })

  it('omits the selected 4-piece only from visible two-piece alternatives', async () => {
    const user = userEvent.setup()
    render(<TriggerDiscHarness />)

    await user.click(screen.getByRole('button', {
      name: 'Change 2-piece Drive Disc from Shockstar Disco',
    }))
    const candidates = screen.getByLabelText('twoPiece Drive Disc candidates')
    expect(within(candidates).queryByRole('button', {
      name: 'Select King of the Summit as twoPiece',
    })).not.toBeInTheDocument()
    expect(within(candidates).getByRole('button', {
      name: 'Select Woodpecker Electro as twoPiece',
    })).toBeInTheDocument()
  })

  it('swaps exact Disc roles only from the four-piece selector', async () => {
    const user = userEvent.setup()
    render(<TriggerDiscHarness />)

    await user.click(screen.getByRole('button', {
      name: 'Change 4-piece Drive Disc from King of the Summit',
    }))
    await user.click(screen.getByRole('button', {
      name: 'Select Shockstar Disco as fourPiece',
    }))

    expect(screen.getByTestId('actual-four-piece')).toHaveTextContent('shockstar')
    expect(screen.getByTestId('actual-two-piece')).toHaveTextContent('king')

    await user.click(screen.getByRole('button', {
      name: 'Change 4-piece Drive Disc from Shockstar Disco',
    }))
    await user.click(screen.getByRole('button', {
      name: 'Select King of the Summit as fourPiece',
    }))

    expect(screen.getByTestId('actual-four-piece')).toHaveTextContent('king')
    expect(screen.getByTestId('actual-two-piece')).toHaveTextContent('shockstar')
  })

  it('exposes manual repair after a four-piece edit invalidates the same-effect member', async () => {
    const user = userEvent.setup()
    render(<PanSameEffectDiscHarness />)

    await user.click(screen.getByRole('button', {
      name: 'Change 2-piece Drive Disc from Swing Jazz',
    }))
    await user.click(screen.getByRole('button', {
      name: 'Select Hormone Punk as twoPiece',
    }))
    await user.click(screen.getByRole('button', {
      name: 'Change 4-piece Drive Disc from Astral Voice',
    }))
    await user.click(screen.getByRole('button', {
      name: 'Select Bunny in Wonderland as fourPiece',
    }))

    expect(screen.getByRole('button', {
      name: 'Change 4-piece Drive Disc from Bunny in Wonderland',
    })).toHaveFocus()
    expect(screen.getByTestId('actual-two-piece')).toBeEmptyDOMElement()
    expect(screen.getByTestId('workbench-complete')).toHaveTextContent('false')

    await user.click(screen.getByRole('button', { name: '2-piece Drive Disc required' }))
    const candidates = screen.getByLabelText('twoPiece Drive Disc candidates')
    expect(within(candidates).getByRole('button', {
      name: 'Select Swing Jazz as twoPiece',
    })).toBeInTheDocument()
    const astral = within(candidates).getByRole('button', {
      name: 'Select Astral Voice as twoPiece',
    })
    expect(within(candidates).queryByRole('button', {
      name: 'Select Hormone Punk as twoPiece',
    })).not.toBeInTheDocument()
    await user.click(astral)
    expect(screen.getByRole('button', {
      name: 'Change 2-piece Drive Disc from Astral Voice',
    })).toHaveFocus()
    expect(screen.getByTestId('workbench-complete')).toHaveTextContent('true')
  })

  it('omits an impossible four-piece swap and keeps ordinary two-piece changes local', async () => {
    const user = userEvent.setup()
    render(<TriggerDiscHarness />)

    await user.click(screen.getByRole('button', {
      name: 'Change 4-piece Drive Disc from King of the Summit',
    }))
    await user.click(screen.getByRole('button', {
      name: 'Select Astral Voice as fourPiece',
    }))
    await user.click(screen.getByRole('button', {
      name: 'Change 2-piece Drive Disc from Shockstar Disco',
    }))
    await user.click(screen.getByRole('button', {
      name: 'Select King of the Summit as twoPiece',
    }))
    expect(screen.getByTestId('actual-four-piece')).toHaveTextContent('astralVoice')
    expect(screen.getByTestId('actual-two-piece')).toHaveTextContent('king')

    await user.click(screen.getByRole('button', {
      name: 'Change 4-piece Drive Disc from Astral Voice',
    }))
    expect(within(screen.getByLabelText('fourPiece Drive Disc candidates')).queryByRole('button', {
      name: 'Select King of the Summit as fourPiece',
    })).not.toBeInTheDocument()
  })
})

function LycaonSelectedPressureHarness() {
  const [state, dispatch] = useReducer(workbenchReducer, undefined, () => (
    createPreparedState({}, ['corin', 'lycaon', 'astraYao'], 0)
  ))
  const slot = 1 as const
  return (
    <AgentSetup
      activeSourceTone={null}
      agentId="lycaon"
      discCandidates={{
        fourPiece: effectiveFourPieceIds(state, slot),
        twoPiece: effectiveTwoPieceIds(state, slot),
      }}
      dispatch={dispatch}
      mainStatCandidates={{
        slot4: effectiveMainStatIds(state, slot, 'slot4'),
        slot5: effectiveMainStatIds(state, slot, 'slot5'),
        slot6: effectiveMainStatIds(state, slot, 'slot6'),
      }}
      onSourceToneChange={vi.fn()}
      setup={state.slots[slot].setup}
      slot={slot}
    />
  )
}

function UnqualifiedTriggerPressureHarness() {
  const [state, dispatch] = useReducer(workbenchReducer, undefined, () => (
    createPreparedState({}, ['yixuan', 'trigger', 'lucia'], 0)
  ))
  const slot = 1 as const
  return (
    <AgentSetup
      activeSourceTone={null}
      agentId="trigger"
      discCandidates={{
        fourPiece: effectiveFourPieceIds(state, slot),
        twoPiece: effectiveTwoPieceIds(state, slot),
      }}
      dispatch={dispatch}
      mainStatCandidates={{
        slot4: effectiveMainStatIds(state, slot, 'slot4'),
        slot5: effectiveMainStatIds(state, slot, 'slot5'),
        slot6: effectiveMainStatIds(state, slot, 'slot6'),
      }}
      onSourceToneChange={vi.fn()}
      setup={state.slots[slot].setup}
      slot={slot}
      substatChoices={effectiveSubstatChoicesForSlot(state, slot)}
    />
  )
}

describe('AgentSetup selected-pressure hit count', () => {
  it('reinitializes King CRIT Rate at zero while preserving selector focus', async () => {
    const user = userEvent.setup()
    render(<LycaonSelectedPressureHarness />)

    expect(screen.getByLabelText('CRIT Rate hit count')).toHaveValue('0')
    await user.click(screen.getByRole('button', {
      name: 'Change 4-piece Drive Disc from King of the Summit',
    }))
    await user.click(screen.getByRole('button', {
      name: 'Select Astral Voice as fourPiece',
    }))
    const astral = screen.getByRole('button', {
      name: 'Change 4-piece Drive Disc from Astral Voice',
    })
    expect(astral).toHaveFocus()

    await user.click(astral)
    await user.click(screen.getByRole('button', {
      name: 'Select King of the Summit as fourPiece',
    }))
    expect(screen.getByRole('button', {
      name: 'Change 4-piece Drive Disc from King of the Summit',
    })).toHaveFocus()

    const input = screen.getByLabelText('CRIT Rate hit count')
    expect(input).toHaveValue('0')
    expect(input).not.toHaveAttribute('aria-invalid', 'true')
    expect(input).not.toHaveAttribute('aria-describedby')
    expect(screen.queryByText('Hit count required')).not.toBeInTheDocument()
    expect(document.querySelector('[aria-live]')).toBeNull()
  })

  it('removes unqualified Trigger CRIT Rate with King and restores only a zero count', async () => {
    const user = userEvent.setup()
    render(<UnqualifiedTriggerPressureHarness />)

    await user.click(screen.getByRole('button', { name: 'Increase CRIT Rate hits' }))
    expect(screen.getByLabelText('CRIT Rate hit count')).toHaveValue('1')

    await user.click(screen.getByRole('button', {
      name: 'Change 4-piece Drive Disc from King of the Summit',
    }))
    await user.click(screen.getByRole('button', {
      name: 'Select Astral Voice as fourPiece',
    }))
    expect(screen.queryByLabelText('CRIT Rate hit count')).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', {
      name: 'Change 4-piece Drive Disc from Astral Voice',
    }))
    await user.click(screen.getByRole('button', {
      name: 'Select King of the Summit as fourPiece',
    }))
    expect(screen.getByLabelText('CRIT Rate hit count')).toHaveValue('0')
  })
})

describe('AgentSetup Grace Anomaly packages', () => {
  it('keeps flat AP units and complete selected/candidate equipment copy', async () => {
    const user = userEvent.setup()
    const state = createPreparedState({}, ['grace', 'billy', 'nekomata'], 0)
    const setup = state.slots[0].setup
    render(
      <AgentSetup
        activeSourceTone={null}
        agentId="grace"
        discCandidates={DISC_IDS_BY_AGENT_AND_PIECE.grace}
        dispatch={vi.fn()}
        mainStatCandidates={MAIN_STAT_IDS_BY_AGENT_AND_SLOT.grace}
        onSourceToneChange={vi.fn()}
        setup={setup}
        slot={0}
      />,
    )

    expect(screen.getByRole('button', {
      name: 'Change Disc 4 main stat from Anomaly Proficiency',
    })).toHaveTextContent('+92')
    expect(screen.getByRole('button', {
      name: 'Change Disc 4 main stat from Anomaly Proficiency',
    })).not.toHaveTextContent('+92%')
    const slotSix = screen.getByRole('button', {
      name: 'Change Disc 6 main stat from Anomaly Mastery',
    })
    expect(slotSix).toHaveTextContent('+30%')
    await user.click(slotSix)
    expect(screen.getByRole('button', {
      name: 'Select ATK% for Disc 6',
    })).toBeInTheDocument()
    await user.click(screen.getByRole('button', {
      name: 'Change Disc 6 main stat from Anomaly Mastery',
    }))
    expect(screen.getByLabelText('Grace Howard prepared effective substats'))
      .toHaveTextContent('AP')
    expect(screen.getByLabelText('Anomaly Proficiency hit count'))
      .toBeInTheDocument()

    const timeweaverDescription = [
      'ATK +30%',
      'Electric Anomaly Buildup +30%',
      'Anomaly Proficiency +75',
      '≥375 Anomaly Proficiency · Disorder DMG +25%',
    ].join('. ')
    expect(screen.getByRole('button', {
      name: 'Change W-Engine from Timeweaver',
    })).toHaveAccessibleDescription(timeweaverDescription)

    await user.click(screen.getByRole('button', {
      name: 'Change W-Engine from Timeweaver',
    }))
    const engineCandidates = screen.getByLabelText('W-Engine candidates')
    expect(within(engineCandidates).getByRole('button', {
      name: 'Select Practiced Perfection W1',
    })).toHaveAccessibleDescription(
      'ATK +30%. Anomaly Mastery +60. Physical DMG +40%',
    )
    expect(within(engineCandidates).getByRole('button', {
      name: 'Select Fusion Compiler W1',
    })).toHaveAccessibleDescription(
      'PEN Ratio +24%. ATK +12%. Anomaly Proficiency +75',
    )

    await user.click(screen.getByRole('button', {
      name: 'Change 4-piece Drive Disc from Thunder Metal',
    }))
    const discCandidates = screen.getByLabelText('fourPiece Drive Disc candidates')
    expect(within(discCandidates).getByRole('button', {
      name: 'Select Chaos Jazz as fourPiece',
    })).toHaveAccessibleDescription(
      'Fire & Electric DMG +15%. EX Special & Assist DMG +20%. Anomaly Proficiency +30',
    )
    expect(within(discCandidates).getByRole('button', {
      name: 'Select Freedom Blues as fourPiece',
    })).toHaveAccessibleDescription(
      'Electric Anomaly Buildup RES -20%. Anomaly Proficiency +30',
    )
  })
})

describe('AgentSetup Piper Anomaly packages', () => {
  it('reuses complete Roaring Ride and Fanged Metal copy on selected and candidate surfaces', async () => {
    const user = userEvent.setup()
    const state = createPreparedState({}, ['piper', 'billy', 'nekomata'], 0)
    const setup = state.slots[0].setup
    render(
      <AgentSetup
        activeSourceTone={null}
        agentId="piper"
        discCandidates={DISC_IDS_BY_AGENT_AND_PIECE.piper}
        dispatch={vi.fn()}
        mainStatCandidates={MAIN_STAT_IDS_BY_AGENT_AND_SLOT.piper}
        onSourceToneChange={vi.fn()}
        setup={setup}
        slot={0}
      />,
    )

    expect(screen.getByRole('button', {
      name: 'Change 4-piece Drive Disc from Fanged Metal',
    })).toHaveAccessibleDescription(
      'Assaulted target · Holder DMG +35%. Physical DMG +10%',
    )

    const slotSix = screen.getByRole('button', {
      name: 'Change Disc 6 main stat from Anomaly Mastery',
    })
    expect(slotSix).toHaveTextContent('+30%')
    await user.click(slotSix)
    expect(screen.getByRole('button', {
      name: 'Select ATK% for Disc 6',
    })).toBeInTheDocument()

    await user.click(screen.getByRole('button', {
      name: 'Change W-Engine from Practiced Perfection',
    }))
    expect(within(screen.getByLabelText('W-Engine candidates')).getByRole('button', {
      name: 'Select Roaring Ride W5',
    })).toHaveAccessibleDescription(
      'ATK +25%. ATK +12.8%. AP +64. Anomaly Buildup +40%',
    )

    await user.click(screen.getByRole('button', {
      name: 'Change 4-piece Drive Disc from Fanged Metal',
    }))
    expect(within(screen.getByLabelText('fourPiece Drive Disc candidates')).getByRole('button', {
      name: 'Select Freedom Blues as fourPiece',
    })).toHaveAccessibleDescription(
      'Physical Anomaly Buildup RES -20%. Anomaly Proficiency +30',
    )
  })
})
