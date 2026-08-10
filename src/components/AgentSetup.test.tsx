import { useReducer } from 'react'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { DISC_IDS_BY_AGENT_AND_PIECE, MAIN_STAT_IDS_BY_AGENT_AND_SLOT, type MainSlot, type MainStatId } from '../workbench/content'
import { createPreparedState, isCompleteWorkbench, workbenchReducer } from '../workbench/state'
import { AgentSetup } from './AgentSetup'

const singleCandidateMains: Record<MainSlot, readonly MainStatId[]> = {
  slot4: ['critRate'],
  slot5: ['hpPct'],
  slot6: ['hpPct'],
}

function IncompleteSetupHarness() {
  const [state, dispatch] = useReducer(workbenchReducer, undefined, () => {
    const prepared = createPreparedState()
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
      agentId="yixuan"
      discCandidates={DISC_IDS_BY_AGENT_AND_PIECE.yixuan}
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
    soleCandidate.focus()
    await user.keyboard('{Enter}')

    await waitFor(() => {
      expect(screen.getByLabelText('Woodpecker Electro selected as 2-piece')).toHaveFocus()
    })
    expect(screen.getByRole('button', { name: 'Disc 5 main stat required' })).toBeInTheDocument()
    expect(screen.getByTestId('workbench-complete')).toHaveTextContent('false')
  })
})

describe('AgentSetup exact two-piece choices', () => {
  it('lists same-effect Disc identities separately', async () => {
    const user = userEvent.setup()
    render(<DialynDiscHarness />)

    await user.click(screen.getByRole('button', {
      name: 'Change 2-piece Drive Disc from Woodpecker Electro',
    }))
    const candidates = screen.getByLabelText('twoPiece Drive Disc candidates')
    expect(within(candidates).getAllByRole('button')).toHaveLength(2)
    await user.click(within(candidates).getByRole('button', {
      name: 'Select Swing Jazz as twoPiece',
    }))

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
