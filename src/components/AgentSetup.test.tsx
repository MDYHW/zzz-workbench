import { useReducer } from 'react'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { MAIN_STAT_IDS_BY_AGENT_AND_SLOT, type MainSlot, type MainStatId } from '../workbench/content'
import { createPreparedState, workbenchReducer } from '../workbench/state'
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

function DialynDiscHarness() {
  const [state, dispatch] = useReducer(workbenchReducer, undefined, createPreparedState)
  return (
    <>
      <AgentSetup
        activeSourceTone={null}
        agentId="dialyn"
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
