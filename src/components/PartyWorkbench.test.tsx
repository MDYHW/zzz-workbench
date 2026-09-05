import { useState } from 'react'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { createPreparedState, type AppliedSlot } from '../workbench/state'
import { PartyWorkbench } from './PartyWorkbench'
import {
  agentToneForParty,
  sourceToneEvents,
  type SourceLink,
  type SourceToneChannel,
} from './sourceInteraction'

const prepared = createPreparedState({}, ['yixuan', 'dialyn', 'lucia'], 0)

function Harness() {
  const [viewedSlot, setViewedSlot] = useState<AppliedSlot>(0)
  const [links, setLinks] = useState<Record<SourceToneChannel, SourceLink | null>>({
    pointer: null,
    focus: null,
  })
  const activeSourceLink = links.pointer ?? links.focus
  const changeSourceTone = (
    channel: SourceToneChannel,
    tone: string | null,
    targetAgentId?: SourceLink['targetAgentId'],
  ) => {
    setLinks((current) => ({
      ...current,
      [channel]: tone === null ? null : { tone, targetAgentId: targetAgentId ?? null },
    }))
  }

  return (
    <PartyWorkbench
      activeSourceTone={activeSourceLink?.tone ?? null}
      activeSourceTargetAgentId={activeSourceLink?.targetAgentId ?? null}
      slots={prepared.slots}
      focusSlot={prepared.focusSlot}
      viewedSlot={viewedSlot}
      onSourceToneChange={changeSourceTone}
      onViewSlot={setViewedSlot}
      setup={<div>Setup fixture</div>}
      result={(
        <>
          <button type="button" {...sourceToneEvents(
            agentToneForParty(
              prepared.slots[1].agentId,
              prepared.slots.map((slot) => slot.agentId),
            ),
            changeSourceTone,
            prepared.slots[1].agentId,
          )}>
            External provider source
          </button>
          <button type="button" {...sourceToneEvents(
            'core',
            changeSourceTone,
            prepared.slots[0].agentId,
          )}>
            Agent-local source
          </button>
        </>
      )}
    />
  )
}

describe('PartyWorkbench persistent selector mechanism', () => {
  it('derives an external provider tone from the current applied slot order', () => {
    const partyAgentIds = prepared.slots.map((slot) => slot.agentId)
    const providerAgentId = partyAgentIds[1]

    expect(agentToneForParty(providerAgentId, partyAgentIds)).toBe('agent-slot-2')
    expect(agentToneForParty(providerAgentId, [
      providerAgentId,
      partyAgentIds[0],
      partyAgentIds[2],
    ])).toBe('agent-slot-1')
  })

  it('navigates directly among three tabs without an empty workspace', () => {
    render(<Harness />)

    const first = screen.getByRole('tab', { name: 'View Yixuan setup and Result' })
    fireEvent.keyDown(first, { key: 'ArrowRight' })
    expect(screen.getByRole('tab', { name: 'View Dialyn setup and Result' }))
      .toHaveAttribute('aria-selected', 'true')
    expect(screen.getByRole('tabpanel')).toHaveAttribute('data-agent', 'dialyn')

    fireEvent.keyDown(document.activeElement!, { key: 'End' })
    expect(screen.getByRole('tab', { name: 'View Lucia setup and Result' }))
      .toHaveAttribute('aria-selected', 'true')
    fireEvent.keyDown(document.activeElement!, { key: 'Home' })
    expect(first).toHaveAttribute('aria-selected', 'true')
    expect(screen.getAllByRole('tabpanel')).toHaveLength(1)
  })

  it('links an external provider to its selector without changing the viewed Agent', async () => {
    const user = userEvent.setup()
    render(<Harness />)

    const selected = screen.getByRole('tab', { name: 'View Yixuan setup and Result' })
    const provider = screen.getByRole('tab', { name: 'View Dialyn setup and Result' })
    const source = screen.getByRole('button', { name: 'External provider source' })

    await user.hover(source)
    expect(provider).toHaveClass('is-source-active')
    expect(provider).toHaveClass('source-tone--agent-slot-2')
    expect(selected).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByRole('tabpanel')).toHaveAttribute('data-agent', 'yixuan')
    await user.unhover(source)
    expect(provider).not.toHaveClass('is-source-active')

    fireEvent.focus(source)
    await waitFor(() => expect(provider).toHaveClass('is-source-active'))
    fireEvent.blur(source)
    await waitFor(() => expect(provider).not.toHaveClass('is-source-active'))
  })

  it('links an Agent-local source to its selector without changing the viewed Agent', async () => {
    const user = userEvent.setup()
    render(<Harness />)

    const source = screen.getByRole('button', { name: 'Agent-local source' })
    const selected = screen.getByRole('tab', { name: 'View Yixuan setup and Result' })
    const identity = document.querySelector('.workspace-identity')!

    await user.hover(source)
    expect(selected).toHaveClass('is-source-active', 'source-tone--core')
    expect(identity).not.toHaveClass('is-source-active')
    expect(selected).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByRole('tabpanel')).toHaveAttribute('data-agent', 'yixuan')
    await user.unhover(source)
    expect(selected).not.toHaveClass('is-source-active')
  })
})
