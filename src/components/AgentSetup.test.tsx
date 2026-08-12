import { useReducer } from 'react'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { DISC_IDS_BY_AGENT_AND_PIECE, MAIN_STAT_IDS_BY_AGENT_AND_SLOT, type AgentId, type MainSlot, type MainStatId } from '../workbench/content'
import { createPreparedState, isCompleteWorkbench, workbenchReducer } from '../workbench/state'
import { AgentSetup } from './AgentSetup'
import { effectiveFourPieceIds, effectiveMainStatIds, effectiveTwoPieceIds } from '../workbench/candidates'

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

    expect(screen.getByRole('button', {
      name: 'Change 4-piece Drive Disc from Bunny in Wonderland',
    })).toHaveAccessibleDescription('Squad DMG +18%. HP +10%')
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
  it('marks Steel Cushion passive clauses inactive for a Rupture holder', () => {
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

    expect(screen.getByText('Attack Specialty passive inactive')).toBeInTheDocument()
    expect(screen.getByText('Inactive · Physical DMG +20%')).toBeInTheDocument()
    expect(screen.getByText('Inactive · Back Attack DMG +25%')).toBeInTheDocument()
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

describe('AgentSetup compressed Disc effects', () => {
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
  it('lists same-effect Disc identities separately', async () => {
    const user = userEvent.setup()
    render(<DialynDiscHarness />)

    const selected = screen.getByRole('button', {
      name: 'Change 2-piece Drive Disc from Woodpecker Electro',
    })
    expect(selected).toHaveAccessibleDescription('CRIT Rate +8%')
    await user.click(selected)
    const candidates = screen.getByLabelText('twoPiece Drive Disc candidates')
    expect(within(candidates).getAllByRole('button')).toHaveLength(2)
    const swingJazz = within(candidates).getByRole('button', {
      name: 'Select Swing Jazz as twoPiece',
    })
    expect(swingJazz).toHaveAccessibleDescription('Energy Regen +20%')
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
})
