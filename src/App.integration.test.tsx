import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { App } from './App'

describe('workbench UI integration', () => {
  it('starts from three persistent selectors and one selected workspace', async () => {
    const user = userEvent.setup()
    render(<App />)

    const tabs = screen.getAllByRole('tab')
    const yixuan = screen.getByRole('tab', { name: 'View Yixuan setup and Result' })

    expect(tabs).toHaveLength(3)
    expect(tabs.filter((tab) => tab.getAttribute('aria-selected') === 'true')).toEqual([yixuan])
    expect(screen.getByRole('region', { name: 'Yixuan setup' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Yixuan Result' })).toBeInTheDocument()
    expect(screen.getAllByRole('heading', { name: /Result$/i })).toHaveLength(1)
    expect(screen.getByRole('tabpanel')).toHaveAttribute('aria-labelledby', yixuan.id)

    const selectorPortrait = yixuan.querySelector<HTMLImageElement>('.selector-agent-art')!
    const workspacePortrait = document.querySelector<HTMLImageElement>(
      '.workspace-identity .agent-art',
    )!
    expect(selectorPortrait.src).not.toBe(workspacePortrait.src)
    expect(selectorPortrait.src).toContain('/selector-portraits/')
    expect(workspacePortrait.src).toContain('/portraits/')

    await user.click(yixuan)
    expect(yixuan).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByRole('region', { name: 'Yixuan setup' })).toBeInTheDocument()
  })

  it('changes only the viewed workspace and preserves edited Setup state', async () => {
    const user = userEvent.setup()
    render(<App />)

    const count = screen.getByRole('textbox', { name: 'CRIT Rate hit count' })
    const mastheadIndex = document.querySelector('.masthead__index')!.textContent
    expect(count).toHaveValue('0')
    await user.click(screen.getByRole('button', { name: 'Increase CRIT Rate hits' }))
    expect(count).toHaveValue('1')

    await user.click(screen.getByRole('tab', { name: 'View Dialyn setup and Result' }))
    expect(screen.getByRole('region', { name: 'Dialyn setup' })).toBeInTheDocument()
    expect(document.querySelector('.masthead__index')).toHaveTextContent(mastheadIndex!)
    await user.click(screen.getByRole('tab', { name: 'View Yixuan setup and Result' }))

    expect(screen.getByRole('textbox', { name: 'CRIT Rate hit count' })).toHaveValue('1')
    expect(screen.getByRole('tab', { name: 'View Yixuan setup and Result' }))
      .toHaveAttribute('aria-selected', 'true')
  })

  it('uses the approved short display names for Grace and Norma', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.click(screen.getByRole('button', { name: 'Edit party' }))
    await user.click(screen.getByRole('button', { name: /Replace slot 1,/ }))

    expect(screen.getByRole('button', { name: 'Grace, Electric, Anomaly' }))
      .toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Norma, Fire, Stun' }))
      .toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Grace Howard, Electric, Anomaly' }))
      .not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Norma Hollowell, Fire, Stun' }))
      .not.toBeInTheDocument()
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
    expect(setupTarget).not.toHaveClass('is-source-active')
  })

  it('cancels a changed party draft into the same viewed workspace', async () => {
    const user = userEvent.setup()
    render(<App />)

    const partyTabs = screen.getByRole('tablist', { name: 'Applied party slots' })
    expect(within(partyTabs).getAllByRole('tab')).toHaveLength(3)
    expect(within(partyTabs).queryByRole('button', { name: 'Edit party' })).not.toBeInTheDocument()
    await user.click(screen.getByRole('tab', { name: 'View Dialyn setup and Result' }))
    const fullArtSource = document.querySelector<HTMLImageElement>(
      '.workspace-identity .agent-art',
    )!.src
    const selectorSource = screen.getByRole('tab', { name: 'View Dialyn setup and Result' })
      .querySelector<HTMLImageElement>('.selector-agent-art')!.src

    await user.click(screen.getByRole('button', { name: 'Edit party' }))
    const partyRail = screen.getByRole('list', { name: 'Applied party slots' })
    expect(within(partyRail).queryAllByRole('tab')).toHaveLength(0)
    const inactiveSlots = within(partyRail).getAllByRole('button', { name: /applied slot, inactive/ })
    expect(inactiveSlots).toHaveLength(3)
    expect(inactiveSlots.every((slot) => slot.hasAttribute('disabled')))
      .toBe(true)
    expect(within(partyRail).queryByRole('button', { name: 'Edit party' })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Edit party' })).toBeDisabled()
    expect(within(partyRail).getByRole('button', { name: /Dialyn applied slot/ })
      .querySelector<HTMLImageElement>('.selector-agent-art')!.src).toBe(selectorSource)
    expect(screen.getByRole('button', { name: 'Replace slot 2, Dialyn' })
      .querySelector<HTMLImageElement>('.party-editor__portrait img')!.src).toBe(fullArtSource)
    await user.click(screen.getByRole('button', { name: /Replace slot 1,/ }))
    await user.click(screen.getByRole('button', { name: /Anby: Soldier 0, Electric, Attack/ }))
    await user.click(screen.getByRole('button', { name: 'Cancel' }))

    expect(screen.getByRole('tab', { name: 'View Dialyn setup and Result' }))
      .toHaveAttribute('aria-selected', 'true')
    expect(screen.getByRole('region', { name: 'Dialyn setup' })).toBeInTheDocument()
    expect(screen.queryByRole('region', { name: 'Anby: Soldier 0 setup' })).not.toBeInTheDocument()
    expect(screen.getByRole('tab', { name: 'View Yixuan setup and Result' })).toBeInTheDocument()
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

    await user.click(screen.getByRole('button', { name: 'Edit party' }))
    const replace = async (slot: number, agent: RegExp) => {
      await user.click(screen.getByRole('button', { name: new RegExp(`Replace slot ${slot},`) }))
      await user.click(screen.getByRole('button', { name: agent }))
    }
    await replace(1, /Velina, Wind, Anomaly/)
    await replace(2, /Promeia, Ice, Anomaly/)
    await replace(3, /Lucia, Ether, Support/)
    await user.click(screen.getByRole('radio', { name: 'Velina' }))
    await user.click(screen.getByRole('button', { name: 'Apply party' }))
    await user.click(screen.getByRole('tab', { name: 'View Velina setup and Result' }))

    const selectedJoyau = screen.getByRole('button', { name: 'Change W-Engine from Joyau Dore' })
    const joyauDescription = document.getElementById(selectedJoyau.getAttribute('aria-describedby')!)!
      .textContent!
    expect(joyauDescription).not.toBe('')
    await user.click(selectedJoyau)
    for (const candidateName of [
      'Select Weeping Gemini W5',
      'Select Kaboom the Cannon W5',
    ]) {
      expect(screen.getByRole('button', { name: candidateName }))
        .toHaveAccessibleDescription(expect.any(String))
      expect(screen.getByRole('button', { name: candidateName }))
        .not.toHaveAccessibleDescription('')
    }
    const boisterousCandidate = screen.getByRole('button', { name: 'Select Boisterous Echoes W5' })
    expect(boisterousCandidate).toHaveAccessibleDescription(expect.any(String))
    expect(boisterousCandidate).not.toHaveAccessibleDescription('')
    await user.click(boisterousCandidate)
    await user.click(screen.getByRole('button', { name: 'Change W-Engine from Boisterous Echoes' }))
    expect(screen.getByRole('button', { name: 'Select Joyau Dore W1' }))
      .toHaveAccessibleDescription(joyauDescription)

    const selectedWuthering = screen.getByRole('button', {
      name: 'Change 4-piece Drive Disc from Wuthering Salon',
    })
    expect(selectedWuthering).toHaveAccessibleDescription(expect.any(String))
    expect(selectedWuthering).not.toHaveAccessibleDescription('')
    await user.click(selectedWuthering)
    const astralCandidate = screen.getByRole('button', {
      name: 'Select Astral Voice as fourPiece',
    })
    expect(astralCandidate).toHaveAccessibleDescription(expect.any(String))
    expect(astralCandidate).not.toHaveAccessibleDescription('')
    await user.click(astralCandidate)
    await user.click(screen.getByRole('button', {
      name: 'Change 2-piece Drive Disc from Swing Jazz',
    }))
    expect(screen.getByRole('button', { name: 'Select Freedom Blues as twoPiece' }))
      .toHaveAccessibleDescription(expect.any(String))
    expect(screen.getByRole('button', { name: 'Select Wuthering Salon as twoPiece' }))
      .toHaveAccessibleDescription(expect.any(String))
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

  it('clears a stale source link when the viewed Agent changes', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.click(screen.getByRole('button', { name: 'CRIT Rate' }))
    const source = within(screen.getByRole('table', {
      name: 'CRIT Rate source contributions',
    })).getAllByRole('row')[1]
    fireEvent.mouseEnter(source)
    expect(document.querySelector('.source-target.is-source-active')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('tab', { name: 'View Dialyn setup and Result' }))

    await waitFor(() => expect(document.querySelector('.source-target.is-source-active'))
      .not.toBeInTheDocument())
    expect(screen.queryByRole('table', { name: 'CRIT Rate source contributions' }))
      .not.toBeInTheDocument()

    await user.click(screen.getByRole('tab', { name: 'View Yixuan setup and Result' }))
    expect(screen.queryByRole('table', { name: 'CRIT Rate source contributions' }))
      .not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'CRIT Rate' }))
    expect(screen.getByRole('table', { name: 'CRIT Rate source contributions' }))
      .toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Edit party' }))
    await user.click(screen.getByRole('button', { name: 'Cancel' }))
    expect(screen.queryByRole('table', { name: 'CRIT Rate source contributions' }))
      .not.toBeInTheDocument()
  })
})
