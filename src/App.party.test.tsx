import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { App } from './App'
import { PartyWorkbench } from './components/PartyWorkbench'
import { createPreparedState } from './workbench/state'

describe('integrated party workbench: party', () => {
  it('starts with one expanded prepared setup and one visible Result', () => {
    render(<App />)

    expect(screen.getByRole('region', { name: 'Yixuan setup' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Yixuan Result' })).toBeInTheDocument()
    expect(screen.getAllByRole('heading', { name: /Result$/i })).toHaveLength(1)
    expect(screen.getByRole('tab', { name: 'View Dialyn setup and Result' })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: 'View Lucia setup and Result' })).toBeInTheDocument()
    expect(screen.queryByLabelText(/party effects/i)).not.toBeInTheDocument()

    const selected = screen.getByRole('tab', { name: 'Close Yixuan setup and Result' })
    const panel = document.getElementById('party-panel-1')!
    expect(selected).toHaveAttribute('aria-selected', 'true')
    expect(selected).toHaveAttribute('aria-controls', 'party-panel-1')
    expect(panel).toHaveAttribute('aria-labelledby', 'party-tab-1')
    expect(selected).toHaveAttribute('tabindex', '0')
    expect(screen.getByRole('tab', { name: 'View Dialyn setup and Result' }))
      .toHaveAttribute('tabindex', '-1')
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
      expect(portrait!.style.getPropertyValue('--portrait-target-y')).toBe('204.22px')
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

  it('switches slots while preserving each Agent setup state', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.click(screen.getByRole('button', { name: 'Increase HP% hits' }))
    await user.click(screen.getByRole('tab', { name: 'View Dialyn setup and Result' }))
    await user.click(screen.getByRole('button', { name: 'Increase CRIT Rate hits' }))
    await user.click(screen.getByRole('tab', { name: 'View Lucia setup and Result' }))
    await user.click(screen.getByRole('button', { name: 'Increase HP% hits' }))

    await user.click(screen.getByRole('tab', { name: 'View Yixuan setup and Result' }))
    expect(screen.getByLabelText('HP% hit count')).toHaveValue('1')
    await user.click(screen.getByRole('tab', { name: 'View Dialyn setup and Result' }))
    expect(screen.getByLabelText('CRIT Rate hit count')).toHaveValue('1')
    await user.click(screen.getByRole('tab', { name: 'View Lucia setup and Result' }))
    expect(screen.getByLabelText('HP% hit count')).toHaveValue('1')
  })

  it('uses one roving slot tab stop before setup controls', async () => {
    const user = userEvent.setup()
    render(<App />)

    const yixuanTab = screen.getByRole('tab', {
      name: 'Close Yixuan setup and Result',
    })
    yixuanTab.focus()
    await user.keyboard('{ArrowRight}')

    const dialynTab = screen.getByRole('tab', {
      name: 'Close Dialyn setup and Result',
    })
    expect(dialynTab).toHaveAttribute('aria-selected', 'true')
    expect(dialynTab).toHaveFocus()

    await user.keyboard('{ArrowLeft}')
    const returned = screen.getByRole('tab', {
      name: 'Close Yixuan setup and Result',
    })
    expect(returned).toHaveFocus()
    await user.tab()
    expect(screen.getByRole('button', { name: 'M0' })).toHaveFocus()
  })

  it('keeps focus position independent from the viewed slot', () => {
    const state = createPreparedState()
    render(
      <PartyWorkbench
        activeSourceTone={null}
        focusSlot={2}
        onSourceToneChange={() => {}}
        onViewSlot={() => {}}
        slots={state.slots}
        viewedSlot={1}
      >
        <div>Fixture workbench</div>
      </PartyWorkbench>,
    )

    expect(screen.getByText('Focus · Lucia')).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: 'Close Dialyn setup and Result' }))
      .toHaveAttribute('aria-selected', 'true')
    expect(screen.getAllByText('Focus').filter((marker) => (
      marker.getAttribute('aria-hidden') === 'false'
    ))).toHaveLength(1)
  })

  it('returns to equal compact slots and restores focus when the expanded identity closes', async () => {
    const user = userEvent.setup()
    render(<App />)

    const closeYixuan = screen.getByRole('tab', {
      name: 'Close Yixuan setup and Result',
    })
    await user.click(closeYixuan)

    expect(document.querySelector('[data-agent="yixuan"]')).not.toBeInTheDocument()
    expect(screen.queryByRole('region', { name: 'Yixuan setup' })).not.toBeInTheDocument()
    expect(screen.queryByRole('region', { name: 'Yixuan Result' })).not.toBeInTheDocument()

    const compactSlots = screen.getAllByRole('button', {
      name: /View (Yixuan|Dialyn|Lucia) setup and Result/,
    })
    expect(compactSlots).toHaveLength(3)
    expect(compactSlots[0]).toHaveFocus()

    await user.keyboard('{Enter}')
    expect(document.querySelector('[data-agent="yixuan"]')).toBeInTheDocument()
    expect(screen.getByRole('region', { name: 'Yixuan setup' })).toBeInTheDocument()
    expect(screen.getByRole('region', { name: 'Yixuan Result' })).toBeInTheDocument()
  })
})
