import { act, render, screen, within } from '@testing-library/react'
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
    for (const tab of screen.getAllByRole('tab')) {
      expect(within(tab).queryByText(/^0[1-3]$/)).not.toBeInTheDocument()
    }
  })

  it('uses shared expanded and compact face targets with one bounded optical correction', async () => {
    const user = userEvent.setup()
    render(<App />)

    const expectExpandedFrame = (expectedWidth: string) => {
      const portrait = document.querySelector<HTMLElement>('.slot-identity--expanded .agent-art')

      expect(portrait).not.toBeNull()
      expect(portrait!.style.getPropertyValue('--portrait-target-x')).toBe('38%')
      expect(portrait!.style.getPropertyValue('--portrait-target-y')).toBe('25.2%')
      expect(portrait!.style.getPropertyValue('--portrait-width')).toBe(expectedWidth)
    }

    const expectCompactFrames = () => {
      const portraits = document.querySelectorAll<HTMLElement>('.party-slot--compact .agent-art')

      expect(portraits).toHaveLength(2)
      for (const portrait of portraits) {
        expect(portrait.style.getPropertyValue('--portrait-target-x')).toBe('50%')
        expect(portrait.style.getPropertyValue('--portrait-target-y')).toBe('24%')
        expect(portrait.style.getPropertyValue('--portrait-width')).toBe('400%')
      }
    }

    expectExpandedFrame('295%')
    expectCompactFrames()
    await user.click(screen.getByRole('tab', { name: 'View Dialyn setup and Result' }))
    expectExpandedFrame('288%')
    expectCompactFrames()
    await user.click(screen.getByRole('tab', { name: 'View Lucia setup and Result' }))
    expectExpandedFrame('295%')
    expectCompactFrames()
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

  it('switches slots while preserving Focus and each Agent setup state', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.click(screen.getByRole('button', { name: 'Increase HP hits' }))
    await user.click(screen.getByRole('tab', { name: 'View Dialyn setup and Result' }))
    expect(screen.getByRole('heading', { name: 'Dialyn setup' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Dialyn Result' })).toBeInTheDocument()
    expect(screen.getAllByText('Focus')).not.toHaveLength(0)
    await user.click(screen.getByRole('button', { name: 'Increase CRIT Rate hits' }))
    expect(screen.getByLabelText('CRIT Rate hit count')).toHaveTextContent('1')

    await user.click(screen.getByRole('tab', { name: 'View Lucia setup and Result' }))
    await user.click(screen.getByRole('button', { name: 'Increase HP% hits' }))
    expect(screen.getByLabelText('HP% hit count')).toHaveTextContent('1')

    await user.click(screen.getByRole('tab', { name: 'View Yixuan setup and Result' }))
    expect(screen.getByLabelText('HP hit count')).toHaveTextContent('1')
    await user.click(screen.getByRole('tab', { name: 'View Dialyn setup and Result' }))
    expect(screen.getByLabelText('CRIT Rate hit count')).toHaveTextContent('1')
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

  it('keeps Base ATK internal and discloses source-defined percentages', async () => {
    const user = userEvent.setup()
    render(<App />)

    expect(screen.queryByText('Base ATK')).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /Change W-Engine from Qingming Birdcage/ }))
    expect(screen.getByRole('button', { name: 'Select Cauldron of Clarity W5' })).toBeInTheDocument()
    expect(screen.queryByText('Base ATK')).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Max HP' }))
    const sources = screen.getByRole('table', { name: 'Max HP source contributions' })
    const qingming = within(sources).getByRole('row', {
      name: /Qingming Birdcage.*\+30%/,
    })
    expect(qingming).not.toHaveTextContent('2,511.9')
    expect(screen.queryByRole('button', { name: 'ATK' })).not.toBeInTheDocument()
  })

  it('re-prepares only the pool-owned setup and does not show a false selector in the one-engine pool', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.click(screen.getByRole('button', { name: 'Increase HP hits' }))
    await user.click(screen.getByRole('button', { name: /^Non-limited/ }))
    expect(screen.getByLabelText('HP hit count')).toHaveTextContent('0')
    expect(screen.getByText('Cauldron of Clarity')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Change W-Engine/ })).not.toBeInTheDocument()
  })

  it('shows complete partner setup sequences with editable approved substats and no false equipment selectors', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.click(screen.getByRole('tab', { name: 'View Dialyn setup and Result' }))
    expect(screen.getByText('Yesterday Calls')).toBeInTheDocument()
    expect(screen.getByText('Combat · Off-field Energy recovery +1.5/s')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Increase CRIT Rate hits' })).toBeInTheDocument()
    expect(screen.getByLabelText('Dialyn prepared main stats')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Change W-Engine/ })).not.toBeInTheDocument()

    await user.click(screen.getByRole('tab', { name: 'View Lucia setup and Result' }))
    expect(screen.getByText('Dreamlit Hearth')).toBeInTheDocument()
    expect(screen.getByText('Combat · Energy recovery +0.4/s')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Increase HP% hits' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Increase HP hits' })).toBeInTheDocument()
    expect(screen.getByLabelText('Lucia prepared main stats')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Change W-Engine/ })).not.toBeInTheDocument()
  })

  it('recalculates partner Results from their visible setup controls', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.click(screen.getByRole('tab', { name: 'View Dialyn setup and Result' }))
    await user.click(screen.getByRole('button', { name: 'Increase CRIT Rate hits' }))
    expect(screen.getByRole('row', { name: /CRIT Rate.*77\.8%.*77\.8%.*77\.8%/ })).toBeInTheDocument()
    expect(screen.getByRole('row', { name: /Impact.*110\.0.*165\.6.*165\.6/ })).toBeInTheDocument()
    expect(screen.getByRole('row', { name: /Energy Regen.*1\.92.*3\.42.*3\.42/ })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Energy Regen' }))
    const dialynEnergySources = screen.getByRole('table', {
      name: 'Energy Regen source contributions',
    })
    expect(within(dialynEnergySources).getByRole('row', {
      name: /Drive Disc \u00B7 Slot 6.*\+60%/,
    })).toHaveAttribute('data-source-tone', 'disc-slot-6')
    expect(within(dialynEnergySources).getByRole('row', {
      name: /Yesterday Calls \u00B7 W1.*\+1\.5\/s/,
    })).toHaveAttribute('data-source-tone', 'w-engine')

    await user.click(screen.getByRole('tab', { name: 'View Lucia setup and Result' }))
    await user.click(screen.getByRole('button', { name: 'Increase HP% hits' }))
    expect(screen.getByRole('row', { name: /Max HP.*21,951.*21,951.*26,342/ })).toBeInTheDocument()
    expect(screen.getByRole('row', { name: /Energy Regen.*1\.56.*1\.96.*1\.96/ })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Energy Regen' }))
    const luciaEnergySources = screen.getByRole('table', {
      name: 'Energy Regen source contributions',
    })
    expect(within(luciaEnergySources).getByRole('row', {
      name: /Dreamlit Hearth \u00B7 W1.*\+0\.4\/s/,
    })).toHaveAttribute('data-source-tone', 'w-engine')
  })

  it('discloses incremental source breakdown, calculation-supplied gauges, and owned operations', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.click(screen.getByRole('tab', { name: 'View Dialyn setup and Result' }))
    await user.click(screen.getByRole('button', { name: 'CRIT Rate' }))
    expect(screen.getByRole('group', { name: /Initial CRIT Rate: current 75\.4, cap 100, threshold 50\.0/ })).toBeInTheDocument()
    expect(screen.getByText('Threshold 50.0')).toBeInTheDocument()
    expect(screen.getByLabelText('Agent operations')).toHaveTextContent('Fully enabled')
    expect(screen.getByLabelText('Agent operations')).toHaveTextContent('Enemy Stun duration')
    expect(screen.getByLabelText('Agent operations')).not.toHaveTextContent('Enemy Stun DMG Multiplier')

    await user.click(screen.getByRole('tab', { name: 'View Lucia setup and Result' }))
    expect(screen.queryByRole('button', { name: 'Squad Sheer Force' })).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Max HP' }))
    expect(screen.getByRole('group', { name: /Initial Max HP: current 21,697\.1, cap 24,000/ })).toBeInTheDocument()
    expect(screen.getByRole('table', { name: 'Max HP source contributions' })).toBeInTheDocument()
    expect(screen.queryByText(/subtotal/i)).not.toBeInTheDocument()
  })

  it('groups each source once and links Result provenance to setup loci and provider slots', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.click(screen.getByRole('button', { name: 'DMG Bonus' }))
    const dmgSources = screen.getByRole('table', { name: 'DMG Bonus source contributions' })
    const qingmingSource = within(dmgSources).getByRole('row', { name: /Qingming Birdcage.*\+16\.0%/ })
    expect(qingmingSource).toHaveAttribute('data-source-tone', 'w-engine')
    await user.hover(qingmingSource)
    expect(document.querySelector('fieldset.source-tone--w-engine')).toHaveClass('is-source-active')
    await user.unhover(qingmingSource)

    await user.click(screen.getByRole('button', { name: 'Max HP' }))
    const hpSources = screen.getByRole('table', { name: 'Max HP source contributions' })
    const luciaSource = within(hpSources).getByRole('row', { name: /Lucia \u00B7 Core Passive/ })
    expect(luciaSource).toHaveAttribute('data-source-tone', 'agent-lucia')
    await user.hover(luciaSource)
    expect(screen.getByRole('tab', { name: 'View Lucia setup and Result' })).toHaveClass('is-source-active')

    const dialynSource = within(dmgSources).getByRole('row', { name: /Dialyn \u00B7 Additional Ability/ })
    expect(dialynSource).toHaveAttribute('data-source-tone', 'agent-dialyn')

    await user.click(screen.getByRole('button', { name: 'Sheer Force' }))
    const sheerSources = screen.getByRole('table', { name: 'Sheer Force source contributions' })
    expect(within(sheerSources).queryByRole('row', { name: /Lucia · Core Passive/ }))
      .not.toBeInTheDocument()
    expect(within(sheerSources).queryByRole('row', { name: /Lucia · Dreamlit Hearth/ }))
      .not.toBeInTheDocument()
    const luciaDirectSource = within(sheerSources).getByRole('row', {
      name: /Lucia · EX Special Attack/,
    })
    expect(luciaDirectSource).toHaveAttribute('data-source-tone', 'agent-lucia')
    expect(luciaDirectSource).toHaveTextContent('+814.8')
    expect(within(sheerSources).queryByRole('row', { name: /^Core Passive/ }))
      .not.toBeInTheDocument()
    const ruptureSources = within(sheerSources).getAllByRole('row', { name: /Rupture specialty/ })
    expect(ruptureSources).toHaveLength(1)
    const identitySource = ruptureSources[0]
    expect(identitySource).toHaveTextContent('Current ATK × 0.3 + Current Max HP × 0.1')
    expect(within(identitySource).getAllByRole('cell').map((cell) => cell.textContent))
      .toEqual(['2,222.7', '2,222.7', '2,551.4'])
    expect(identitySource).not.toHaveTextContent('+2,222.7')
    expect(identitySource).not.toHaveTextContent('+2,551.4')
    expect(identitySource).toHaveAttribute('data-source-tone', 'agent-yixuan')
    await user.hover(identitySource)
    expect(screen.getByRole('tab', { name: 'View Yixuan setup and Result' })).toHaveClass('is-source-active')
    await user.unhover(identitySource)
    await user.hover(screen.getByRole('tab', { name: 'View Yixuan setup and Result' }))
    expect(identitySource).toHaveClass('is-source-active')
    await user.unhover(screen.getByRole('tab', { name: 'View Yixuan setup and Result' }))

    await user.click(screen.getByRole('tab', { name: 'View Lucia setup and Result' }))
    await user.click(screen.getByRole('button', { name: 'Max HP' }))
    const luciaHpSources = screen.getByRole('table', { name: 'Max HP source contributions' })
    expect(within(luciaHpSources).getByRole('row', { name: /^Core Passive/ }))
      .toHaveAttribute('data-source-tone', 'core')
    expect(within(luciaHpSources).getByRole('row', { name: /^Dreamlit Hearth \u00B7 W1/ }))
      .toHaveAttribute('data-source-tone', 'w-engine')
    expect(within(luciaHpSources).queryByText(/Lucia \u00B7 Core Passive/)).not.toBeInTheDocument()
  })

  it('orders common sources before action outcomes and reveals actual action sources separately', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.click(screen.getByRole('button', { name: 'DMG Bonus' }))

    const commonSources = screen.getByRole('table', { name: 'DMG Bonus source contributions' })
    expect(within(commonSources).getByRole('columnheader', { name: 'Common source' })).toBeInTheDocument()

    const outcomes = screen.getByRole('table', { name: 'DMG Bonus action outcome values' })
    expect(within(outcomes).getByRole('columnheader', { name: 'Initial' })).toBeInTheDocument()
    expect(within(outcomes).getByRole('columnheader', { name: 'Combat' })).toBeInTheDocument()
    expect(within(outcomes).getByRole('columnheader', { name: 'Fully enabled' })).toBeInTheDocument()
    expect(within(outcomes).getByText('Basic Attack')).toBeInTheDocument()
    expect(within(outcomes).getByText('Assist Follow-Up')).toBeInTheDocument()
    expect(within(outcomes).getByText('Ultimate')).toBeInTheDocument()
    expect(screen.queryByText(/qualifying forms|vs Stunned/i)).not.toBeInTheDocument()

    const sharedAction = within(outcomes).getByRole('button', {
      name: /Show sources for Basic Attack, EX Special Attack, Assist Follow-Up, Chain Attack, Ultimate/,
    })
    expect(within(outcomes).queryByRole('row', { name: /Core Passive.*\+60\.0%/ })).not.toBeInTheDocument()

    await user.click(sharedAction)
    const coreSource = within(outcomes).getByRole('row', { name: /Core Passive.*\+60\.0%/ })
    expect(coreSource).toHaveAttribute('data-source-tone', 'core')
    expect(sharedAction).toHaveAttribute('aria-expanded', 'true')
    await user.hover(coreSource)
    expect(document.querySelector('.slot-identity--expanded')).toHaveClass('is-source-active')
    await user.unhover(coreSource)

    const exAction = within(outcomes).getByRole('button', { name: 'Show sources for EX Special Attack' })
    expect(within(outcomes).queryByRole('row', { name: /Additional Ability.*\+30\.0%/ })).not.toBeInTheDocument()
    await user.click(exAction)
    expect(within(outcomes).getByRole('row', { name: /Additional Ability.*\+30\.0%/ }))
      .toHaveAttribute('data-source-tone', 'additional')
  })
  it('links Setup source hover and keyboard focus to Result sources, then clears on leave and blur', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.click(screen.getByRole('button', { name: 'CRIT Rate' }))
    const sources = screen.getByRole('table', { name: 'CRIT Rate source contributions' })
    const yunkuiSource = within(sources).getByRole('row', { name: /Yunkui Tales/ })
    const disc = document.querySelector<HTMLElement>('.disc-summary[data-source-tone="disc-4pc"]')!

    await user.hover(disc)
    expect(yunkuiSource).toHaveClass('is-source-active')
    await user.unhover(disc)
    expect(yunkuiSource).not.toHaveClass('is-source-active')

    act(() => disc.focus())
    expect(disc).toHaveFocus()
    expect(yunkuiSource).toHaveClass('is-source-active')
    act(() => disc.blur())
    expect(yunkuiSource).not.toHaveClass('is-source-active')
  })

  it('assigns effective-substat colors by displayed input position', async () => {
    const user = userEvent.setup()
    render(<App />)

    const substatControls = document.querySelectorAll<HTMLElement>('.substat-control[data-source-tone]')
    expect([...substatControls].map((control) => control.dataset.sourceTone))
      .toEqual(['substat-1', 'substat-2', 'substat-3'])

    await user.click(screen.getByRole('button', { name: 'Increase CRIT Rate hits' }))
    await user.click(screen.getByRole('button', { name: 'CRIT Rate' }))
    const sources = screen.getByRole('table', { name: 'CRIT Rate source contributions' })
    expect(within(sources).getByRole('row', { name: /Effective substat hits \u00B7 CRIT Rate/ }))
      .toHaveAttribute('data-source-tone', 'substat-1')

    await user.click(screen.getByRole('tab', { name: 'View Dialyn setup and Result' }))
    const dialynControl = document.querySelector<HTMLElement>(
      '.substat-control[data-source-tone="substat-1"]',
    )!
    await user.click(screen.getByRole('button', { name: 'Increase CRIT Rate hits' }))
    await user.click(screen.getByRole('button', { name: 'CRIT Rate' }))
    const dialynSources = screen.getByRole('table', { name: 'CRIT Rate source contributions' })
    const dialynSubstatSource = within(dialynSources).getByRole('row', {
      name: /Effective substat hits \u00B7 CRIT Rate/,
    })
    expect(dialynSubstatSource).toHaveAttribute('data-source-tone', 'substat-1')
    await user.hover(dialynSubstatSource)
    expect(dialynControl).toHaveClass('is-source-active')
    await user.unhover(dialynSubstatSource)
    await user.hover(dialynControl)
    expect(dialynSubstatSource).toHaveClass('is-source-active')
    await user.unhover(dialynControl)

    await user.click(screen.getByRole('tab', { name: 'View Lucia setup and Result' }))
    const luciaControls = document.querySelectorAll<HTMLElement>(
      '.substat-control[data-source-tone]',
    )
    expect([...luciaControls].map((control) => control.dataset.sourceTone))
      .toEqual(['substat-1', 'substat-2'])
  })

  it('keeps a focused Result source active after the pointer leaves it', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.click(screen.getByRole('button', { name: 'DMG Bonus' }))
    const sources = screen.getByRole('table', { name: 'DMG Bonus source contributions' })
    const qingmingSource = within(sources).getByRole('row', { name: /Qingming Birdcage/ })
    const sourceFocusTarget = within(qingmingSource).getByRole('rowheader')

    act(() => sourceFocusTarget.focus())
    await user.hover(qingmingSource)
    await user.unhover(qingmingSource)
    expect(qingmingSource).toHaveClass('is-source-active')
    act(() => sourceFocusTarget.blur())
    expect(qingmingSource).not.toHaveClass('is-source-active')
  })
  it('replaces equipment-linked source rows atomically without stale highlighting', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.click(screen.getByRole('button', { name: 'CRIT Rate' }))
    const initialSources = screen.getByRole('table', { name: 'CRIT Rate source contributions' })
    const qingmingSource = within(initialSources).getByRole('row', { name: /Qingming Birdcage/ })
    await user.hover(qingmingSource)
    expect(qingmingSource).toHaveClass('is-source-active')

    await user.click(screen.getByRole('button', { name: /Change W-Engine from Qingming Birdcage/ }))
    await user.click(screen.getByRole('button', { name: 'Select Cauldron of Clarity W5' }))

    const changedSources = screen.getByRole('table', { name: 'CRIT Rate source contributions' })
    expect(within(changedSources).queryByRole('row', { name: /Qingming Birdcage/ })).not.toBeInTheDocument()
    expect(within(changedSources).getByRole('row', { name: /Cauldron of Clarity/ }))
      .toHaveAttribute('data-source-tone', 'w-engine')
    expect(document.querySelector('.is-source-active')).toBeNull()
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
