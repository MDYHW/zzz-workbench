import { useReducer } from 'react'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import type { MainSlot, MainStatId } from '../workbench/content'
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
