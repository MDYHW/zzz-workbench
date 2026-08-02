import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { App } from './App'

describe('setup workbench', () => {
  it('renders the complete prepared party and current Result immediately', () => {
    render(<App />)

    expect(screen.getByRole('heading', { name: 'Setup Workbench' })).toBeInTheDocument()
    expect(screen.getByText('Yixuan', { selector: '.slot-name-line h3' })).toBeInTheDocument()
    expect(screen.getByText('Dialyn', { selector: '.slot-name-line h3' })).toBeInTheDocument()
    expect(screen.getByText('Lucia', { selector: '.slot-name-line h3' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Select Qingming Birdcage W1' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: 'Select Cauldron of Clarity W5' })).toBeInTheDocument()
    expect(screen.getAllByText('16,434').length).toBeGreaterThan(0)
    const exUltimateRow = screen.getByText('EX Special & Ultimate').closest('tr') as HTMLElement
    expect(exUltimateRow).toBeInTheDocument()
    const exUltimateSources = within(exUltimateRow).getAllByText(/Qingming Birdcage.*EX\/Ultimate/)
    expect(exUltimateSources).toHaveLength(2)
    expect(exUltimateSources.every((source) => source.closest('li')?.textContent?.includes('+20.0%'))).toBe(true)  })

  it('shows each full-pool engine package and static prepared equipment truthfully', () => {
    render(<App />)

    const qingming = screen.getByRole('button', { name: 'Select Qingming Birdcage W1' })
    const cauldron = screen.getByRole('button', { name: 'Select Cauldron of Clarity W5' })
    expect(within(qingming).getByText(/Base ATK/)).toBeInTheDocument()
    expect(within(qingming).getByText('EX Special & Ultimate Ether Sheer DMG +20%')).toBeInTheDocument()
    expect(within(cauldron).getByText(/3 EX Special stacks.*CRIT Rate \+10\.4%/)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /King of the Summit/ })).not.toBeInTheDocument()
  })

  it('preserves substat counts on a direct W-Engine edit and recalculates Result', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.click(screen.getByRole('button', { name: 'Increase HP hits' }))
    expect(screen.getByLabelText('HP hit count')).toHaveTextContent('1')

    await user.click(screen.getByRole('button', { name: 'Select Cauldron of Clarity W5' }))
    expect(screen.getByLabelText('HP hit count')).toHaveTextContent('1')
    expect(screen.getByRole('button', { name: 'Select Cauldron of Clarity W5' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.queryByText('EX Special & Ultimate')).not.toBeInTheDocument()
  })

  it('re-prepares Yixuan and resets counts when the pool changes', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.click(screen.getByRole('button', { name: 'Increase CRIT Rate hits' }))
    expect(screen.getByLabelText('CRIT Rate hit count')).toHaveTextContent('1')

    await user.click(screen.getByRole('button', { name: /^Non-limited/ }))
    expect(screen.getByLabelText('CRIT Rate hit count')).toHaveTextContent('0')
    expect(screen.queryByRole('button', { name: 'Select Qingming Birdcage W1' })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Select Cauldron of Clarity W5' })).toHaveAttribute('aria-pressed', 'true')
  })

  it('updates only the consumed values for one substat click', async () => {
    const user = userEvent.setup()
    render(<App />)

    const yixuanResult = document.querySelector<HTMLElement>('.agent-result--yixuan')!
    const beforeAtk = within(yixuanResult).getAllByText('1,931')
    expect(beforeAtk.length).toBeGreaterThan(0)

    await user.click(screen.getByRole('button', { name: 'Increase ATK hits' }))
    expect(within(yixuanResult).getAllByText('1,979').length).toBeGreaterThan(0)
    expect(screen.getByLabelText('ATK hit count')).toHaveTextContent('1')
  })

  it('expands a Result row into numeric source contributions', async () => {
    const user = userEvent.setup()
    render(<App />)

    const critButton = screen.getAllByRole('button', { name: /CRIT Rate/ })
      .find((button) => button.classList.contains('metric-toggle'))!
    await user.click(critButton)

    expect(critButton).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getAllByText(/Drive Disc.*Slot 4/).length).toBeGreaterThan(0)
    expect(screen.getByLabelText('Fully Enabled CRIT Rate gauge')).toBeInTheDocument()
  })
})
