import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { App } from './App'

describe('integrated party workbench', () => {
  it('starts with Yixuan expanded and exactly one visible Result without a global party-effects region', () => {
    render(<App />)

    expect(screen.getByRole('heading', { name: 'Yixuan setup' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Yixuan Result' })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: 'View Dialyn setup and Result' })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: 'View Lucia setup and Result' })).toBeInTheDocument()
    expect(screen.getAllByRole('heading', { name: /Result$/i })).toHaveLength(1)
    expect(screen.queryByLabelText(/party effects/i)).not.toBeInTheDocument()
  })

  it('uses one expanded face target with a bounded Dialyn optical scale correction', async () => {
    const user = userEvent.setup()
    render(<App />)

    const expectExpandedFrame = (expectedWidth: string) => {
      const portrait = document.querySelector<HTMLElement>('.slot-identity--expanded .agent-art')

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
  })

  it('uses actual Attribute and Specialty symbols for every current Agent', () => {
    render(<App />)

    for (const label of ['Auric Ink, Rupture', 'Physical, Stun', 'Ether, Support']) {
      expect(screen.getByLabelText(label).querySelectorAll('img')).toHaveLength(2)
    }

    expect(screen.queryByText('Damage contributor')).not.toBeInTheDocument()
  })

  it('presents distinct prepared Disc effects and stable main-stat values', () => {
    render(<App />)

    const yunkuiEffects = screen.getByRole('list', { name: 'Yunkui Tales effects' })
    expect(within(yunkuiEffects).getAllByRole('listitem')).toHaveLength(3)
    expect(within(yunkuiEffects).getByText('Fully enabled \u00B7 CRIT Rate +12%')).toBeInTheDocument()
    expect(within(yunkuiEffects).getByText('Fully enabled \u00B7 Sheer DMG +10%')).toBeInTheDocument()
    expect(within(yunkuiEffects).getByText('2-piece \u00B7 HP +10%')).toBeInTheDocument()

    const mainStats = screen.getByLabelText('Yixuan prepared main stats')
    expect(within(mainStats).getByText('Disc 4')).toBeInTheDocument()
    expect(within(mainStats).getByText('CRIT Rate')).toBeInTheDocument()
    expect(within(mainStats).getByText('+24%')).toBeInTheDocument()
    expect(within(mainStats).getByText('Ether DMG')).toBeInTheDocument()
    expect(within(mainStats).getByText('HP')).toBeInTheDocument()
    expect(within(mainStats).getAllByText('+30%')).toHaveLength(2)
  })

  it('changes only the viewed slot and preserves Yixuan Focus and input state', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.click(screen.getByRole('button', { name: 'Increase HP hits' }))
    await user.click(screen.getByRole('tab', { name: 'View Dialyn setup and Result' }))
    expect(screen.getByRole('heading', { name: 'Dialyn setup' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Dialyn Result' })).toBeInTheDocument()
    expect(screen.getAllByText('Focus')).not.toHaveLength(0)
    expect(screen.queryByRole('button', { name: /Increase .* hits/ })).not.toBeInTheDocument()

    await user.click(screen.getByRole('tab', { name: 'View Yixuan setup and Result' }))
    expect(screen.getByLabelText('HP hit count')).toHaveTextContent('1')
  })

  it('keeps the selected full-pool engine closed until opened and preserves direct edits', async () => {
    const user = userEvent.setup()
    render(<App />)

    expect(screen.queryByRole('button', { name: 'Select Cauldron of Clarity W5' })).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Increase CRIT Rate hits' }))
    await user.click(screen.getByRole('button', { name: /Change W-Engine from Qingming Birdcage/ }))
    await user.click(screen.getByRole('button', { name: 'Select Cauldron of Clarity W5' }))
    expect(screen.getByLabelText('CRIT Rate hit count')).toHaveTextContent('1')
    expect(screen.queryByRole('button', { name: 'Select Qingming Birdcage W1' })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Change W-Engine from Cauldron/ })).toHaveFocus()
  })

  it('re-prepares only the pool-owned setup and does not show a false selector in the one-engine pool', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.click(screen.getByRole('button', { name: 'Increase ATK hits' }))
    await user.click(screen.getByRole('button', { name: /^Non-limited/ }))
    expect(screen.getByLabelText('ATK hit count')).toHaveTextContent('0')
    expect(screen.getByText('Cauldron of Clarity')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Change W-Engine/ })).not.toBeInTheDocument()
  })

  it('shows complete non-interactive partner summaries with only approved effective substats', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.click(screen.getByRole('tab', { name: 'View Dialyn setup and Result' }))
    expect(screen.getByLabelText('Dialyn prepared effective substats')).toHaveTextContent('CRIT Rate')
    expect(screen.getByLabelText('Dialyn prepared effective substats')).toHaveTextContent('0')
    expect(screen.queryByRole('button', { name: /Change W-Engine/ })).not.toBeInTheDocument()

    await user.click(screen.getByRole('tab', { name: 'View Lucia setup and Result' }))
    const substats = screen.getByLabelText('Lucia prepared effective substats')
    expect(within(substats).getAllByText('HP')).toHaveLength(2)
    expect(within(substats).getAllByText('0')).toHaveLength(2)
  })

  it('discloses incremental source breakdown, calculation-supplied gauges, and owned operations', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.click(screen.getByRole('tab', { name: 'View Dialyn setup and Result' }))
    await user.click(screen.getByRole('button', { name: 'Impact' }))
    expect(screen.getByRole('group', { name: /Initial CRIT Rate: current 75\.4, cap 100, threshold 50\.0/ })).toBeInTheDocument()
    expect(screen.getByText('Threshold 50.0')).toBeInTheDocument()
    expect(screen.getByLabelText('Agent operations')).toHaveTextContent('Fully enabled')
    expect(screen.getByLabelText('Agent operations')).toHaveTextContent('Enemy Stun DMG Multiplier')
    expect(screen.getAllByText('0.0%').length).toBeGreaterThan(0)

    await user.click(screen.getByRole('tab', { name: 'View Lucia setup and Result' }))
    await user.click(screen.getByRole('button', { name: 'Squad Sheer Force' }))
    expect(screen.getByRole('group', { name: /Initial Max HP: current 21,697\.1, cap 24,000/ })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Max HP' }))
    expect(screen.getAllByText('Combat subtotal').length).toBeGreaterThan(0)
  })
  it('uses one roving slot tab stop before setup controls', async () => {
    const user = userEvent.setup()
    render(<App />)

    const yixuanTab = screen.getByRole('tab', { name: 'View Yixuan setup and Result' })
    yixuanTab.focus()
    expect(yixuanTab).toHaveAttribute('aria-selected', 'true')

    await user.keyboard('{ArrowRight}')
    const dialynTab = screen.getByRole('tab', { name: 'View Dialyn setup and Result' })
    expect(dialynTab).toHaveAttribute('aria-selected', 'true')
    expect(dialynTab).toHaveFocus()
    expect(screen.getByText(/Focus.*Yixuan/)).toBeInTheDocument()

    await user.keyboard('{ArrowLeft}')
    const returnedYixuanTab = screen.getByRole('tab', { name: 'View Yixuan setup and Result' })
    expect(returnedYixuanTab).toHaveFocus()
    await user.tab()
    expect(screen.getByRole('button', { name: /^Full pool/ })).toHaveFocus()
  })

  it('closes engine alternatives across pool re-preparation', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.click(screen.getByRole('button', { name: /Change W-Engine from Qingming Birdcage/ }))
    expect(screen.getByRole('button', { name: 'Select Cauldron of Clarity W5' })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /^Non-limited/ }))
    expect(screen.queryByRole('button', { name: /Change W-Engine/ })).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /^Full pool/ }))
    expect(screen.getByText('Qingming Birdcage')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Select Cauldron of Clarity W5' })).not.toBeInTheDocument()
  })
})
