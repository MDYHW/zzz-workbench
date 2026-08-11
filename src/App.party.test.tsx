import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { App } from './App'
import { PartyWorkbench } from './components/PartyWorkbench'
import { ADMITTED_AGENTS } from './workbench/content'
import { createPreparedAgentSetup, createPreparedState, type AppliedAgentSlot } from './workbench/state'

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

  it('uses complete source metadata with one shared portrait frame on every surface', async () => {
    const user = userEvent.setup()
    render(<App />)

    const portraitStyle = (agentId: string) => {
      const agent = ADMITTED_AGENTS.find((item) => item.id === agentId)!
      const portrait = screen.getByRole('tab', { name: new RegExp(agent.name) })
        .querySelector<HTMLElement>('.agent-art')
      expect(portrait).not.toBeNull()
      return portrait!.style
    }

    const expectSource = (agentId: string, scale?: string) => {
      const style = portraitStyle(agentId)
      if (scale) expect(style.getPropertyValue('--portrait-source-scale')).toBe(scale)
      else expect(style.getPropertyValue('--portrait-source-scale')).not.toBe('')
      expect(style.getPropertyValue('--portrait-source-face-x')).not.toBe('')
      expect(style.getPropertyValue('--portrait-source-head-top-y')).not.toBe('')
      expect(style.getPropertyValue('--portrait-target-x')).toBe('')
      expect(style.getPropertyValue('--portrait-width')).toBe('')
    }

    const expectExpandedSource = (agentId: string, scale: string) => {
      const portrait = document.querySelector<HTMLElement>(
        '.slot-identity--expanded .agent-art',
      )
      expect(portrait).not.toBeNull()
      expect(portrait!.closest(`[data-agent="${agentId}"]`)).not.toBeNull()
      expect(portrait!.style.getPropertyValue('--portrait-source-scale')).toBe(scale)
    }

    expectExpandedSource('yixuan', '1')
    await user.click(screen.getByRole('tab', { name: 'View Dialyn setup and Result' }))
    expectExpandedSource('dialyn', String(288 / 295))

    for (const label of ['Auric Ink, Rupture', 'Physical, Stun', 'Ether, Support']) {
      expect(screen.getByLabelText(label).querySelectorAll('img')).toHaveLength(2)
    }
    expect(document.querySelectorAll('.party-slot--compact .agent-art')).toHaveLength(2)

    const additionalGroups: [AppliedAgentSlot, AppliedAgentSlot, AppliedAgentSlot][] = [
      [
        { agentId: 'anbySoldier0', setup: createPreparedAgentSetup('anbySoldier0') },
        { agentId: 'trigger', setup: createPreparedAgentSetup('trigger') },
        { agentId: 'astraYao', setup: createPreparedAgentSetup('astraYao') },
      ],
      [
        { agentId: 'seed', setup: createPreparedAgentSetup('seed') },
        { agentId: 'cissia', setup: createPreparedAgentSetup('cissia') },
        { agentId: 'evelyn', setup: createPreparedAgentSetup('evelyn') },
      ],
    ]
    for (const slots of additionalGroups) {
      render(
        <PartyWorkbench
          activeSourceTone={null}
          focusSlot={0}
          onSourceToneChange={() => {}}
          onViewSlot={() => {}}
          slots={slots}
          viewedSlot={0}
        >
          <div>Fixture workbench</div>
        </PartyWorkbench>,
      )
    }

    expect(document.querySelectorAll('.agent-art')).toHaveLength(9)
    for (const agent of ADMITTED_AGENTS) expectSource(agent.id)
    expectSource('trigger', String(330 / 295))
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

  it('temporarily compacts inactive applied slots during Party Edit and restores the expanded slot on cancel', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.click(screen.getByRole('tab', { name: 'View Dialyn setup and Result' }))
    const edit = screen.getByRole('button', { name: 'Edit party' })
    await user.click(edit)
    for (const name of [
      'Yixuan applied slot, inactive while editing party',
      'Dialyn applied slot, inactive while editing party',
      'Lucia applied slot, inactive while editing party',
    ]) {
      expect(screen.getByRole('button', { name })).toBeDisabled()
    }
    expect(screen.queryByRole('tab')).not.toBeInTheDocument()
    expect(screen.queryByRole('tabpanel')).not.toBeInTheDocument()
    expect(screen.queryByRole('region', { name: 'Dialyn setup' })).not.toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Dialyn Result' })).not.toBeInTheDocument()
    const firstSlot = screen.getByRole('button', { name: 'Replace slot 1, Yixuan' })
    expect(firstSlot).toHaveFocus()
    await user.click(firstSlot)
    expect(screen.getByRole('button', { name: /Unavailable, Yixuan/ })).toBeDisabled()
    expect(screen.getByRole('button', { name: /Unavailable, Dialyn/ })).toBeDisabled()
    expect(screen.getByRole('button', { name: /Anby: Soldier 0, Electric, Attack/ })).toHaveFocus()

    await user.selectOptions(screen.getByLabelText('Attribute'), 'Electric')
    await user.selectOptions(screen.getByLabelText('Specialty'), 'Attack')
    expect(screen.getByText('3 available candidates')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /Anby: Soldier 0, Electric, Attack/ }))
    expect(screen.getByText('Focus · Yixuan')).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Dialyn Result' })).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Cancel' }))
    expect(edit).toHaveFocus()
    expect(screen.getByText('Focus · Yixuan')).toBeInTheDocument()
    expect(screen.queryByText('Edit party', { selector: 'h2' })).not.toBeInTheDocument()
    expect(screen.getByRole('region', { name: 'Dialyn setup' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Dialyn Result' })).toBeInTheDocument()
  })

  it('requires an explicit Focus for multiple eligible draft Agents', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.click(screen.getByRole('button', { name: 'Edit party' }))
    await user.click(screen.getByRole('button', { name: 'Replace slot 2, Dialyn' }))
    await user.click(screen.getByRole('button', { name: /Anby: Soldier 0, Electric, Attack/ }))
    expect(screen.getByText('Choose a Focus Agent before applying.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Apply party' })).toBeDisabled()
    await user.click(screen.getByRole('radio', { name: 'Anby: Soldier 0' }))
    expect(screen.getByRole('button', { name: 'Apply party' })).toBeEnabled()
  })

  it('applies Seed, Cissia, and Astra with Seed as sole Focus and preserves it on Cancel', async () => {
    const user = userEvent.setup()
    render(<App />)
    const replace = async (slot: number, agent: RegExp) => {
      await user.click(screen.getByRole('button', { name: new RegExp(`Replace slot ${slot},`) }))
      await user.click(screen.getByRole('button', { name: agent }))
    }

    await user.click(screen.getByRole('button', { name: 'Edit party' }))
    await user.click(screen.getByRole('button', { name: 'Replace slot 1, Yixuan' }))
    expect(screen.getByRole('button', { name: /Seed, Electric, Attack/ })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Cissia, Electric, Attack/ })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /Seed, Electric, Attack/ }))
    await replace(2, /Cissia, Electric, Attack/)
    await replace(3, /Astra Yao, Ether, Support/)
    expect(screen.getAllByText('Seed is Focus automatically.')).toHaveLength(2)
    await user.click(screen.getByRole('button', { name: 'Apply party' }))

    expect(screen.getByText('Focus · Seed')).toBeInTheDocument()
    expect(screen.getByRole('region', { name: 'Seed setup' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Seed Result' })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: 'View Cissia setup and Result' })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: 'View Astra Yao setup and Result' })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Edit party' }))
    await replace(2, /Dialyn, Physical, Stun/)
    await user.click(screen.getByRole('button', { name: 'Cancel' }))
    expect(screen.getByText('Focus · Seed')).toBeInTheDocument()
    expect(screen.getByRole('region', { name: 'Seed setup' })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: 'View Cissia setup and Result' })).toBeInTheDocument()
  })

  it('admits Evelyn as a Fire Attack Focus with the established party identity controls', async () => {
    const user = userEvent.setup()
    render(<App />)
    const replace = async (slot: number, agent: RegExp) => {
      await user.click(screen.getByRole('button', { name: new RegExp(`Replace slot ${slot},`) }))
      await user.click(screen.getByRole('button', { name: agent }))
    }

    await user.click(screen.getByRole('button', { name: 'Edit party' }))
    await replace(1, /Evelyn, Fire, Attack/)
    await replace(2, /Astra Yao, Ether, Support/)
    await replace(3, /Dialyn, Physical, Stun/)
    expect(screen.getAllByText('Evelyn is Focus automatically.')).toHaveLength(2)
    await user.click(screen.getByRole('button', { name: 'Apply party' }))

    expect(screen.getByText(/Focus.*Evelyn/)).toBeInTheDocument()
    expect(screen.getByRole('region', { name: 'Evelyn setup' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Evelyn Result' })).toBeInTheDocument()
    expect(screen.getByLabelText('Fire, Attack').querySelectorAll('img')).toHaveLength(2)
    const evelynTab = screen.getByRole('tab', { name: 'Close Evelyn setup and Result' })
    await user.hover(evelynTab)
    expect(evelynTab).toHaveClass('source-tone--agent-evelyn')
  })

  it('keeps keyboard focus on a present filter when no replacement is available', async () => {
    const user = userEvent.setup()
    render(<App />)

    const edit = screen.getByRole('button', { name: 'Edit party' })
    edit.focus()
    await user.keyboard('{Enter}')
    expect(screen.getByRole('button', { name: 'Replace slot 1, Yixuan' })).toHaveFocus()
    await user.tab()
    const target = screen.getByRole('button', { name: 'Replace slot 2, Dialyn' })
    expect(target).toHaveFocus()
    await user.keyboard('{Enter}')
    expect(screen.getByRole('button', { name: /Anby: Soldier 0, Electric, Attack/ })).toHaveFocus()

    await user.keyboard('{Shift>}{Tab}{/Shift}')
    const specialty = screen.getByLabelText('Specialty')
    expect(specialty).toHaveFocus()
    await user.selectOptions(specialty, 'Support')
    expect(screen.getByRole('button', { name: /Astra Yao, Ether, Support/ })).toHaveFocus()
    await user.keyboard('{Shift>}{Tab}{/Shift}{Shift>}{Tab}{/Shift}')
    const attribute = screen.getByLabelText('Attribute')
    expect(attribute).toHaveFocus()
    await user.selectOptions(attribute, 'Electric')
    expect(screen.getByText('No available candidates')).toBeInTheDocument()
    expect(attribute).toHaveFocus()

    await user.selectOptions(attribute, 'all')
    expect(screen.getByRole('button', { name: /Astra Yao, Ether, Support/ })).toHaveFocus()
    await user.keyboard('{Enter}')
    expect(screen.getByRole('button', { name: 'Replace slot 2, Astra Yao' })).toHaveFocus()
    await user.tab()
    await user.tab()
    await user.tab()
    const apply = screen.getByRole('button', { name: 'Apply party' })
    expect(apply).toHaveFocus()
    await user.keyboard('{Enter}')
    expect(edit).toHaveFocus()
  })

  it('applies the second trio atomically and can restore the first-vertical preparation', async () => {
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
    expect(screen.getByRole('button', { name: 'Apply party' })).toBeEnabled()
    await user.click(screen.getByRole('button', { name: 'Apply party' }))

    expect(screen.getByText('SETUP // 02')).toBeInTheDocument()
    expect(screen.getByText('ANBY: SOLDIER 0 STRIKE TEAM')).toBeInTheDocument()
    expect(screen.getByText('Focus · Anby: Soldier 0')).toBeInTheDocument()
    expect(screen.getByRole('region', { name: 'Anby: Soldier 0 setup' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Anby: Soldier 0 Result' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Edit party' })).toHaveFocus()

    await user.click(screen.getByRole('button', { name: 'M2' }))
    await user.click(screen.getByRole('button', { name: 'Non-limited' }))
    await user.click(screen.getByRole('button', { name: 'Edit party' }))
    await replace(1, /Yixuan, Auric Ink, Rupture/)
    await replace(2, /Dialyn, Physical, Stun/)
    await replace(3, /Lucia, Ether, Support/)
    await user.click(screen.getByRole('button', { name: 'Apply party' }))

    expect(screen.getByText('SETUP // 01')).toBeInTheDocument()
    expect(screen.getByText('YIXUAN STRIKE TEAM')).toBeInTheDocument()
    expect(screen.getByText('Focus · Yixuan')).toBeInTheDocument()
    expect(screen.getByRole('region', { name: 'Yixuan setup' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Yixuan Result' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'M0' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: 'Full pool' })).toHaveAttribute('aria-pressed', 'true')
  })
})
