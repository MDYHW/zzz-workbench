import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { App } from './App'

describe('workbench UI integration', () => {
  it('starts from one complete prepared Setup and one visible Result', () => {
    render(<App />)

    expect(screen.getByRole('region', { name: 'Yixuan setup' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Yixuan Result' })).toBeInTheDocument()
    expect(screen.getAllByRole('heading', { name: /Result$/i })).toHaveLength(1)
    expect(screen.getByRole('tab', { name: 'Close Yixuan setup and Result' }))
      .toHaveAttribute('aria-selected', 'true')
  })

  it('recalculates a direct Setup edit and keeps its source connected to Result', async () => {
    const user = userEvent.setup()
    render(<App />)

    const before = screen.getByRole('row', { name: /CRIT Rate/ }).textContent
    await user.click(screen.getByRole('button', { name: 'Increase CRIT Rate hits' }))
    const after = screen.getByRole('row', { name: /CRIT Rate/ }).textContent
    expect(after).not.toBe(before)

    await user.click(screen.getByRole('button', {
      name: 'Change 2-piece Drive Disc from Branch & Blade Song',
    }))
    await user.click(screen.getByRole('button', {
      name: 'Select Woodpecker Electro as twoPiece',
    }))
    await user.click(screen.getByRole('button', { name: 'CRIT Rate' }))

    const source = within(screen.getByRole('table', {
      name: 'CRIT Rate source contributions',
    })).getByRole('row', { name: /Woodpecker Electro/ })
    const setupTarget = document.querySelector<HTMLElement>(
      '.disc-selection[data-source-tone="disc-2pc"]',
    )!

    await user.hover(source)
    expect(setupTarget).toHaveClass('is-source-active')
    await user.unhover(source)
  })

  it('applies a party draft atomically and prepares every new holder', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.click(screen.getByRole('button', { name: 'Edit party' }))
    const replace = async (slot: number, agent: RegExp) => {
      await user.click(screen.getByRole('button', { name: new RegExp(`Replace slot ${slot},`) }))
      await user.click(screen.getByRole('button', { name: agent }))
    }
    await replace(1, /Anby: Soldier 0, Electric, Attack/)
    await replace(2, /Trigger, Electric, Stun/)
    await replace(3, /Astra Yao, Ether, Support/)
    await user.click(screen.getByRole('button', { name: 'Apply party' }))

    expect(screen.getByRole('region', { name: 'Anby: Soldier 0 setup' }))
      .toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Anby: Soldier 0 Result' }))
      .toBeInTheDocument()
    expect(screen.getByRole('tab', { name: 'View Trigger setup and Result' }))
      .toBeInTheDocument()
    expect(screen.getByRole('tab', { name: 'View Astra Yao setup and Result' }))
      .toBeInTheDocument()
  })

  it('uses the same compressed equipment package for selected and candidate controls', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.click(screen.getByRole('button', { name: 'Edit party' }))
    await user.click(screen.getByRole('button', { name: /Replace slot 2,/ }))
    await user.click(screen.getByRole('button', { name: /Seth, Electric, Defense/ }))
    await user.click(screen.getByRole('button', { name: 'Apply party' }))
    await user.click(screen.getByRole('tab', { name: 'View Seth setup and Result' }))

    const selectedPeacekeeper = screen.getByRole('button', {
      name: 'Change W-Engine from Peacekeeper - Specialized',
    })
    const descriptionId = selectedPeacekeeper.getAttribute('aria-describedby')!
    const compressedPackage = document.getElementById(descriptionId)!.textContent!
    expect(compressedPackage).not.toBe('')

    await user.click(selectedPeacekeeper)
    await user.click(screen.getByRole('button', { name: 'Select Spring Embrace W5' }))
    await user.click(screen.getByRole('button', {
      name: 'Change W-Engine from Spring Embrace',
    }))

    expect(screen.getByRole('button', {
      name: 'Select Peacekeeper - Specialized W5',
    })).toHaveAccessibleDescription(compressedPackage)

    const selectedAstral = screen.getByRole('button', {
      name: 'Change 4-piece Drive Disc from Astral Voice',
    })
    const astralDescriptionId = selectedAstral.getAttribute('aria-describedby')!
    const compressedDiscPackage = document.getElementById(astralDescriptionId)!.textContent!

    await user.click(selectedAstral)
    await user.click(screen.getByRole('button', {
      name: 'Select Freedom Blues as fourPiece',
    }))
    await user.click(screen.getByRole('button', {
      name: 'Change 4-piece Drive Disc from Freedom Blues',
    }))

    expect(screen.getByRole('button', {
      name: 'Select Astral Voice as fourPiece',
    })).toHaveAccessibleDescription(compressedDiscPackage)
  })

  it('clears a stale source link when direct selection replaces its source identity', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.click(screen.getByRole('button', {
      name: 'Change 2-piece Drive Disc from Branch & Blade Song',
    }))
    await user.click(screen.getByRole('button', {
      name: 'Select Woodpecker Electro as twoPiece',
    }))
    await user.click(screen.getByRole('button', { name: 'CRIT Rate' }))

    const source = within(screen.getByRole('table', {
      name: 'CRIT Rate source contributions',
    })).getByRole('row', { name: /Woodpecker Electro/ })
    fireEvent.mouseEnter(source)
    expect(document.querySelector('.disc-selection[data-source-tone="disc-2pc"]'))
      .toHaveClass('is-source-active')

    fireEvent.click(screen.getByRole('button', {
      name: 'Change 2-piece Drive Disc from Woodpecker Electro',
    }))
    fireEvent.click(screen.getByRole('button', {
      name: 'Select Branch & Blade Song as twoPiece',
    }))

    await waitFor(() => expect(document.querySelector(
      '.disc-selection[data-source-tone="disc-2pc"]',
    )).not.toHaveClass('is-source-active'))
  })
})
