import { useState } from 'react'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { createPreparedState, type AppliedSlot } from '../workbench/state'
import { PartyWorkbench } from './PartyWorkbench'
import { sourceToneEvents, type SourceToneChannel } from './sourceInteraction'

const prepared = createPreparedState()

function Harness() {
  const [viewedSlot, setViewedSlot] = useState<AppliedSlot>(0)
  const [tones, setTones] = useState<Record<SourceToneChannel, string | null>>({
    pointer: null,
    focus: null,
  })
  const activeSourceTone = tones.pointer ?? tones.focus
  const changeSourceTone = (channel: SourceToneChannel, tone: string | null) => {
    setTones((current) => ({ ...current, [channel]: tone }))
  }

  return (
    <PartyWorkbench
      activeSourceTone={activeSourceTone}
      slots={prepared.slots}
      focusSlot={prepared.focusSlot}
      viewedSlot={viewedSlot}
      onSourceToneChange={changeSourceTone}
      onViewSlot={setViewedSlot}
    >
      <button type="button" {...sourceToneEvents('agent-slot-2', changeSourceTone)}>
        External provider source
      </button>
      <button type="button" {...sourceToneEvents('core', changeSourceTone)}>
        Agent-local source
      </button>
    </PartyWorkbench>
  )
}

describe('PartyWorkbench persistent selector mechanism', () => {
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
    expect(selected).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByRole('tabpanel')).toHaveAttribute('data-agent', 'yixuan')
    await user.unhover(source)
    expect(provider).not.toHaveClass('is-source-active')

    fireEvent.focus(source)
    await waitFor(() => expect(provider).toHaveClass('is-source-active'))
    fireEvent.blur(source)
    await waitFor(() => expect(provider).not.toHaveClass('is-source-active'))
  })

  it('links an Agent-local source only to the workspace Identity', async () => {
    const user = userEvent.setup()
    render(<Harness />)

    const source = screen.getByRole('button', { name: 'Agent-local source' })
    const identity = document.querySelector('.workspace-identity')!

    await user.hover(source)
    expect(identity).toHaveClass('is-source-active')
    expect(screen.getAllByRole('tab').every((tab) => !tab.classList.contains('is-source-active')))
      .toBe(true)
    await user.unhover(source)
    expect(identity).not.toHaveClass('is-source-active')
  })
})
