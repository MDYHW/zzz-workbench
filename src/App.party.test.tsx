import { render, screen, waitFor, within } from '@testing-library/react'
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
      const portrait = screen.getAllByRole('tab', { name: new RegExp(agent.name) })[0]
        .querySelector<HTMLElement>('.agent-art')
      expect(portrait).not.toBeNull()
      return portrait!.style
    }

    const expectSource = (agentId: string) => {
      const style = portraitStyle(agentId)
      expect(style.getPropertyValue('--portrait-source-scale')).not.toBe('')
      expect(style.getPropertyValue('--portrait-source-face-x')).not.toBe('')
      expect(style.getPropertyValue('--portrait-source-head-top-y')).not.toBe('')
      expect(style.getPropertyValue('--portrait-target-x')).toBe('')
      expect(style.getPropertyValue('--portrait-width')).toBe('')
    }

    const expectExpandedSource = (agentId: string) => {
      const portrait = document.querySelector<HTMLElement>(
        '.slot-identity--expanded .agent-art',
      )
      expect(portrait).not.toBeNull()
      expect(portrait!.closest(`[data-agent="${agentId}"]`)).not.toBeNull()
      expect(portrait!.style.getPropertyValue('--portrait-source-scale')).not.toBe('')
    }

    expectExpandedSource('yixuan')
    await user.click(screen.getByRole('tab', { name: 'View Dialyn setup and Result' }))
    expectExpandedSource('dialyn')

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
      [
        { agentId: 'corin', setup: createPreparedAgentSetup('corin') },
        { agentId: 'lycaon', setup: createPreparedAgentSetup('lycaon') },
        { agentId: 'juFufu', setup: createPreparedAgentSetup('juFufu') },
      ],
      [
        { agentId: 'yidhari', setup: createPreparedAgentSetup('yidhari') },
        { agentId: 'manato', setup: createPreparedAgentSetup('manato') },
        { agentId: 'hugo', setup: createPreparedAgentSetup('hugo') },
      ],
      [
        { agentId: 'panYinhu', setup: createPreparedAgentSetup('panYinhu') },
        { agentId: 'yixuan', setup: createPreparedAgentSetup('yixuan') },
        { agentId: 'dialyn', setup: createPreparedAgentSetup('dialyn') },
      ],
      [
        { agentId: 'starlightBilly', setup: createPreparedAgentSetup('starlightBilly') },
        { agentId: 'yidhari', setup: createPreparedAgentSetup('yidhari') },
        { agentId: 'manato', setup: createPreparedAgentSetup('manato') },
      ],
      [
        { agentId: 'banyue', setup: createPreparedAgentSetup('banyue') },
        { agentId: 'panYinhu', setup: createPreparedAgentSetup('panYinhu') },
        { agentId: 'juFufu', setup: createPreparedAgentSetup('juFufu') },
      ],
      [
        { agentId: 'ellen', setup: createPreparedAgentSetup('ellen') },
        { agentId: 'soukaku', setup: createPreparedAgentSetup('soukaku') },
        { agentId: 'lycaon', setup: createPreparedAgentSetup('lycaon') },
      ],
      [
        { agentId: 'soldier11', setup: createPreparedAgentSetup('soldier11') },
        { agentId: 'lighter', setup: createPreparedAgentSetup('lighter') },
        { agentId: 'lucy', setup: createPreparedAgentSetup('lucy') },
      ],
      [
        { agentId: 'zhuYuan', setup: createPreparedAgentSetup('zhuYuan') },
        { agentId: 'nicole', setup: createPreparedAgentSetup('nicole') },
        { agentId: 'corin', setup: createPreparedAgentSetup('corin') },
      ],
      [
        { agentId: 'harumasa', setup: createPreparedAgentSetup('harumasa') },
        { agentId: 'qingyi', setup: createPreparedAgentSetup('qingyi') },
        { agentId: 'lucia', setup: createPreparedAgentSetup('lucia') },
      ],
      [
        { agentId: 'orphie', setup: createPreparedAgentSetup('orphie') },
        { agentId: 'pulchra', setup: createPreparedAgentSetup('pulchra') },
        { agentId: 'anbySoldier0', setup: createPreparedAgentSetup('anbySoldier0') },
      ],
      [
        { agentId: 'ben', setup: createPreparedAgentSetup('ben') },
        { agentId: 'koleda', setup: createPreparedAgentSetup('koleda') },
        { agentId: 'pulchra', setup: createPreparedAgentSetup('pulchra') },
      ],
      [
        { agentId: 'nekomata', setup: createPreparedAgentSetup('nekomata') },
        { agentId: 'billy', setup: createPreparedAgentSetup('billy') },
        { agentId: 'lycaon', setup: createPreparedAgentSetup('lycaon') },
      ],
      [
        { agentId: 'yeShunguang', setup: createPreparedAgentSetup('yeShunguang') },
        { agentId: 'zhao', setup: createPreparedAgentSetup('zhao') },
        { agentId: 'trigger', setup: createPreparedAgentSetup('trigger') },
      ],
      [
        { agentId: 'grace', setup: createPreparedAgentSetup('grace') },
        { agentId: 'billy', setup: createPreparedAgentSetup('billy') },
        { agentId: 'ben', setup: createPreparedAgentSetup('ben') },
      ],
      [
        { agentId: 'piper', setup: createPreparedAgentSetup('piper') },
        { agentId: 'yuzuha', setup: createPreparedAgentSetup('yuzuha') },
        { agentId: 'burnice', setup: createPreparedAgentSetup('burnice') },
      ],
      [
        { agentId: 'anby', setup: createPreparedAgentSetup('anby') },
        { agentId: 'caesar', setup: createPreparedAgentSetup('caesar') },
        { agentId: 'anbySoldier0', setup: createPreparedAgentSetup('anbySoldier0') },
      ],
    ]
    let latestContainer: HTMLElement | null = null
    for (const slots of additionalGroups) {
      latestContainer = render(
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
      ).container
    }

    expect(document.querySelectorAll('.agent-art')).toHaveLength(3 + additionalGroups.length * 3)
    for (const agent of ADMITTED_AGENTS) {
      expectSource(agent.id)
      const identity = screen.getAllByRole('tab', { name: new RegExp(agent.name) })[0]
      expect(within(identity).getByLabelText(`${agent.rank} Rank`)).toBeInTheDocument()
    }
    expect(within(latestContainer!).getAllByLabelText('A Rank')[0].querySelector('img'))
      .toHaveAttribute('src', expect.stringContaining('a'))
    expect(within(latestContainer!).getAllByLabelText('S Rank')).toHaveLength(2)

    const sourceProperties = [
      '--portrait-source-face-x',
      '--portrait-source-head-top-y',
      '--portrait-source-scale',
    ]
    const appliedSources = new Map(ADMITTED_AGENTS.map((agent) => {
      const style = portraitStyle(agent.id)
      return [agent.id, sourceProperties.map((property) => style.getPropertyValue(property))]
    }))
    await user.click(screen.getAllByRole('button', { name: 'Edit party' })[0])
    await user.click(screen.getByRole('button', { name: 'Replace slot 1, Yixuan' }))
    for (const agent of ADMITTED_AGENTS) {
      const candidate = screen.getByRole('button', {
        name: new RegExp(`${agent.name}, ${agent.attribute}, ${agent.specialty}`),
      })
      const candidateStyle = candidate.querySelector<HTMLElement>('.party-editor__portrait img')!.style
      for (const [index, property] of sourceProperties.entries()) {
        expect(candidateStyle.getPropertyValue(property)).toBe(appliedSources.get(agent.id)![index])
      }
    }
  }, 20_000)

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
    expect(screen.getByText('4 available candidates')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /Anby: Soldier 0, Electric, Attack/ }))
    expect(screen.getByText('Focus · Yixuan')).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Dialyn Result' })).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Cancel' }))
    await waitFor(() => expect(edit).toHaveFocus())
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

  it('keeps an Anby-containing three-Stun draft invalid without a Focus Agent', async () => {
    const user = userEvent.setup()
    render(<App />)
    const replace = async (slot: number, agent: RegExp) => {
      await user.click(screen.getByRole('button', {
        name: new RegExp(`Replace slot ${slot},`),
      }))
      await user.click(screen.getByRole('button', { name: agent }))
    }

    await user.click(screen.getByRole('button', { name: 'Edit party' }))
    await user.click(screen.getByRole('button', { name: 'Replace slot 1, Yixuan' }))
    expect(screen.getByRole('button', {
      name: /Anby Demara, Electric, Stun/,
    })).toBeInTheDocument()
    expect(screen.getByRole('button', {
      name: /Anby: Soldier 0, Electric, Attack/,
    })).toBeInTheDocument()
    await user.click(screen.getByRole('button', {
      name: /Anby Demara, Electric, Stun/,
    }))
    await replace(3, /Lycaon, Ice, Stun/)

    expect(screen.getAllByText(
      'No eligible Focus Agent. Choose a different party.',
    ).length).toBeGreaterThan(0)
    expect(screen.getByRole('button', { name: 'Apply party' })).toBeDisabled()
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

  it('applies Corin and Lycaon with generic Rank defaults and Focus behavior', async () => {
    const user = userEvent.setup()
    render(<App />)
    const replace = async (slot: number, agent: RegExp) => {
      await user.click(screen.getByRole('button', { name: new RegExp(`Replace slot ${slot},`) }))
      await user.click(screen.getByRole('button', { name: agent }))
    }

    await user.click(screen.getByRole('button', { name: 'Edit party' }))
    await replace(1, /Corin, Physical, Attack/)
    await replace(2, /Lycaon, Ice, Stun/)
    await replace(3, /Astra Yao, Ether, Support/)
    expect(screen.getAllByText('Corin is Focus automatically.')).toHaveLength(2)
    await user.click(screen.getByRole('button', { name: 'Apply party' }))

    expect(screen.getByText(/Focus.*Corin/)).toBeInTheDocument()
    expect(screen.getByRole('region', { name: 'Corin setup' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Corin Result' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'M6' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByLabelText('A Rank')).toBeInTheDocument()

    await user.click(screen.getByRole('tab', { name: 'View Lycaon setup and Result' }))
    expect(screen.getByRole('region', { name: 'Lycaon setup' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Lycaon Result' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'M0' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getAllByLabelText('S Rank').length).toBeGreaterThan(0)
    expect(screen.getByText(/Focus.*Corin/)).toBeInTheDocument()
  }, 15_000)

  it('applies Soldier 11, Lighter, and Lucy through the shared prepared setup and repair journey', async () => {
    const user = userEvent.setup()
    render(<App />)
    const replace = async (slot: number, agent: RegExp) => {
      await user.click(screen.getByRole('button', { name: new RegExp(`Replace slot ${slot},`) }))
      await user.click(screen.getByRole('button', { name: agent }))
    }

    await user.click(screen.getByRole('button', { name: 'Edit party' }))
    await replace(1, /Soldier 11, Fire, Attack/)
    await replace(2, /Lighter, Fire, Stun/)
    await replace(3, /Lucy, Fire, Support/)
    expect(screen.getAllByText('Soldier 11 is Focus automatically.')).toHaveLength(2)
    await user.click(screen.getByRole('button', { name: 'Apply party' }))

    const soldier11Tab = screen.getByRole('tab', { name: 'Close Soldier 11 setup and Result' })
    expect(within(soldier11Tab).getByLabelText('S Rank')).toBeInTheDocument()
    expect(within(soldier11Tab).getByLabelText('Fire, Attack').querySelectorAll('img')).toHaveLength(2)
    expect(screen.getByRole('button', { name: 'M0' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: 'Change W-Engine from Heartstring Nocturne' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Soldier 11 Result' })).toBeInTheDocument()

    await user.click(screen.getByRole('tab', { name: 'View Lighter setup and Result' }))
    const lighterTab = screen.getByRole('tab', { name: 'Close Lighter setup and Result' })
    expect(within(lighterTab).getByLabelText('S Rank')).toBeInTheDocument()
    expect(within(lighterTab).getByLabelText('Fire, Stun').querySelectorAll('img')).toHaveLength(2)
    expect(screen.getByRole('button', { name: 'M0' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: 'Change W-Engine from Blazing Laurel' })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Change 4-piece Drive Disc from King of the Summit' }))
    const candidates = screen.getByLabelText('fourPiece Drive Disc candidates')
    expect(within(candidates).getByRole('button', { name: 'Select Astral Voice as fourPiece' }))
      .toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Select Astral Voice as fourPiece' }))
    expect(screen.queryByRole('heading', { name: 'Lighter Result' })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Disc 4 main stat required' })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Disc 4 main stat required' }))
    await user.click(screen.getByRole('button', { name: 'Select ATK% for Disc 4' }))
    expect(screen.getByRole('heading', { name: 'Lighter Result' })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Change 4-piece Drive Disc from Astral Voice' }))
    await user.click(screen.getByRole('button', { name: 'Select King of the Summit as fourPiece' }))
    expect(screen.getByRole('heading', { name: 'Lighter Result' })).toBeInTheDocument()
    expect(screen.getByLabelText('CRIT Rate hit count')).toHaveValue('0')

    await user.click(screen.getByRole('button', { name: 'Non-limited' }))
    expect(screen.getByRole('button', { name: 'Change W-Engine from Hellfire Gears' })).toBeInTheDocument()
    await user.click(screen.getByRole('tab', { name: 'View Soldier 11 setup and Result' }))
    await user.click(screen.getByRole('button', { name: 'Non-limited' }))
    expect(screen.getByRole('button', { name: 'Change W-Engine from The Brimstone' })).toBeInTheDocument()

    await user.click(screen.getByRole('tab', { name: 'View Lucy setup and Result' }))
    const lucyTab = screen.getByRole('tab', { name: 'Close Lucy setup and Result' })
    expect(within(lucyTab).getByLabelText('A Rank')).toBeInTheDocument()
    expect(within(lucyTab).getByLabelText('Fire, Support').querySelectorAll('img')).toHaveLength(2)
    expect(screen.getByRole('button', { name: 'M6' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: 'Change W-Engine from Kaboom the Cannon' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Lucy Result' })).toBeInTheDocument()
  }, 20_000)

  it('admits Yidhari and Manato through the shared Rupture identity and prepared-party flow', async () => {
    const user = userEvent.setup()
    render(<App />)
    const replace = async (slot: number, agent: RegExp) => {
      await user.click(screen.getByRole('button', { name: new RegExp(`Replace slot ${slot},`) }))
      await user.click(screen.getByRole('button', { name: agent }))
    }

    await user.click(screen.getByRole('button', { name: 'Edit party' }))
    await replace(1, /Yidhari, Ice, Rupture/)
    await replace(2, /Manato, Fire, Rupture/)
    await replace(3, /Lycaon, Ice, Stun/)
    await user.click(screen.getByRole('radio', { name: 'Yidhari' }))
    await user.click(screen.getByRole('button', { name: 'Apply party' }))

    const yidhariTab = screen.getByRole('tab', { name: 'Close Yidhari setup and Result' })
    expect(screen.getByRole('region', { name: 'Yidhari setup' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Yidhari Result' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'M0' })).toHaveAttribute('aria-pressed', 'true')
    expect(within(yidhariTab).getByLabelText('S Rank')).toBeInTheDocument()
    expect(within(yidhariTab).getByLabelText('Ice, Rupture').querySelectorAll('img')).toHaveLength(2)
    await user.hover(yidhariTab)
    expect(yidhariTab).toHaveClass('source-tone--agent-yidhari')

    const preparedKraken = screen.getByRole('button', {
      name: "Change W-Engine from Kraken's Cradle",
    })
    expect(preparedKraken).toHaveAccessibleDescription(
      'HP +30%. Ice Sheer DMG +18%. ≤50% Max HP · CRIT Rate +20%',
    )
    await user.click(preparedKraken)
    const grillCandidate = within(screen.getByLabelText('W-Engine candidates'))
      .getByRole('button', { name: "Select Grill O'Wisp W5" })
    expect(grillCandidate).toHaveAccessibleDescription(
      'HP +25%. Fire DMG +24%. CRIT Rate +24%',
    )
    await user.click(grillCandidate)
    await user.click(screen.getByRole('button', { name: 'M2' }))
    expect(screen.getByRole('button', { name: 'M2' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', {
      name: "Change W-Engine from Kraken's Cradle",
    })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Non-limited' }))
    expect(screen.getByRole('button', {
      name: "Change W-Engine from Grill O'Wisp",
    })).toHaveAccessibleDescription(
      'HP +25%. Fire DMG +24%. CRIT Rate +24%',
    )
    expect(screen.getByRole('heading', { name: 'Yidhari Result' })).toBeInTheDocument()

    await user.click(screen.getByRole('tab', { name: 'View Manato setup and Result' }))
    const manatoTab = screen.getByRole('tab', { name: 'Close Manato setup and Result' })
    expect(screen.getByRole('region', { name: 'Manato setup' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Manato Result' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'M6' })).toHaveAttribute('aria-pressed', 'true')
    expect(within(manatoTab).getByLabelText('A Rank')).toBeInTheDocument()
    expect(within(manatoTab).getByLabelText('Fire, Rupture').querySelectorAll('img')).toHaveLength(2)
    await user.hover(manatoTab)
    expect(manatoTab).toHaveClass('source-tone--agent-manato')
  }, 15_000)

  it('admits Hugo through the shared Attack setup and scoped Result flow', async () => {
    const user = userEvent.setup()
    render(<App />)
    const replace = async (slot: number, agent: RegExp) => {
      await user.click(screen.getByRole('button', { name: new RegExp(`Replace slot ${slot},`) }))
      await user.click(screen.getByRole('button', { name: agent }))
    }

    await user.click(screen.getByRole('button', { name: 'Edit party' }))
    await replace(1, /Hugo, Ice, Attack/)
    await replace(2, /Lycaon, Ice, Stun/)
    await replace(3, /Astra Yao, Ether, Support/)
    expect(screen.getAllByText('Hugo is Focus automatically.')).toHaveLength(2)
    await user.click(screen.getByRole('button', { name: 'Apply party' }))

    const hugoTab = screen.getByRole('tab', { name: 'Close Hugo setup and Result' })
    expect(screen.getByRole('region', { name: 'Hugo setup' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Hugo Result' })).toBeInTheDocument()
    expect(within(hugoTab).getByLabelText('S Rank')).toBeInTheDocument()
    expect(within(hugoTab).getByLabelText('Ice, Attack').querySelectorAll('img')).toHaveLength(2)
    await user.hover(hugoTab)
    expect(hugoTab).toHaveClass('source-tone--agent-hugo')
    expect(screen.getByRole('button', { name: 'Change W-Engine from Myriad Eclipse' }))
      .toHaveAccessibleDescription(
        'CRIT Rate +24%. CRIT DMG +45%. DEF Ignore +25%',
      )
    expect(screen.getByRole('button', { name: 'Change 2-piece Drive Disc from Branch & Blade Song' }))
      .toHaveAccessibleDescription('CRIT DMG +16%')
    expect(screen.getByRole('listitem', { name: /Totalize added DMG Multiplier/ }))
      .toBeInTheDocument()
  }, 15_000)

  it('admits Orphie and Pulchra through one prepared party and independent pool rebuilds', async () => {
    const user = userEvent.setup()
    render(<App />)
    const replace = async (slot: number, agent: RegExp) => {
      await user.click(screen.getByRole('button', { name: new RegExp(`Replace slot ${slot},`) }))
      await user.click(screen.getByRole('button', { name: agent }))
    }

    await user.click(screen.getByRole('button', { name: 'Edit party' }))
    await replace(1, /Anby: Soldier 0, Electric, Attack/)
    await replace(2, /Orphie & Magus, Fire, Attack/)
    await replace(3, /Pulchra, Physical, Stun/)
    expect(screen.getAllByText('Anby: Soldier 0 is Focus automatically.')).toHaveLength(2)
    await user.click(screen.getByRole('button', { name: 'Apply party' }))

    await user.click(screen.getByRole('tab', { name: 'View Orphie & Magus setup and Result' }))
    const orphieTab = screen.getByRole('tab', { name: 'Close Orphie & Magus setup and Result' })
    expect(within(orphieTab).getByLabelText('S Rank')).toBeInTheDocument()
    expect(within(orphieTab).getByLabelText('Fire, Attack').querySelectorAll('img')).toHaveLength(2)
    expect(screen.getByRole('button', { name: 'Change W-Engine from Bellicose Blaze' }))
      .toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Orphie & Magus Result' })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Non-limited' }))
    expect(screen.getByRole('button', { name: 'Change W-Engine from Gilded Blossom' }))
      .toHaveAccessibleDescription('ATK +25%. ATK +9.6%. EX Special Attack DMG +24%')

    await user.click(screen.getByRole('tab', { name: 'View Pulchra setup and Result' }))
    const pulchraTab = screen.getByRole('tab', { name: 'Close Pulchra setup and Result' })
    expect(within(pulchraTab).getByLabelText('A Rank')).toBeInTheDocument()
    expect(within(pulchraTab).getByLabelText('Physical, Stun').querySelectorAll('img')).toHaveLength(2)
    expect(screen.getByRole('button', { name: 'Change W-Engine from Blazing Laurel' }))
      .toBeInTheDocument()
    expect(screen.getByRole('button', {
      name: 'Change 4-piece Drive Disc from King of the Summit',
    })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Pulchra Result' })).toBeInTheDocument()
  }, 15_000)

  it('admits Harumasa and Qingyi with complete equipment copy and visible M1 pressure recovery', async () => {
    const user = userEvent.setup()
    render(<App />)
    const replace = async (slot: number, agent: RegExp) => {
      await user.click(screen.getByRole('button', { name: new RegExp(`Replace slot ${slot},`) }))
      await user.click(screen.getByRole('button', { name: agent }))
    }

    await user.click(screen.getByRole('button', { name: 'Edit party' }))
    await replace(1, /Asaba Harumasa, Electric, Attack/)
    await replace(2, /Qingyi, Electric, Stun/)
    await replace(3, /Lucia, Ether, Support/)
    expect(screen.getByText('Asaba Harumasa is Focus automatically.')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Apply party' }))

    const harumasaTab = screen.getByRole('tab', {
      name: 'Close Asaba Harumasa setup and Result',
    })
    expect(within(harumasaTab).getByLabelText('S Rank')).toBeInTheDocument()
    expect(within(harumasaTab).getByLabelText('Electric, Attack').querySelectorAll('img'))
      .toHaveLength(2)
    const zanshin = screen.getByRole('button', { name: 'Change W-Engine from Zanshin Herb Case' })
    expect(zanshin).toHaveAccessibleDescription(
      'CRIT DMG +48%. CRIT Rate +20%. Electric Dash Attack DMG +40%',
    )
    await user.click(zanshin)
    const cordis = within(screen.getByLabelText('W-Engine candidates'))
      .getByRole('button', { name: 'Select Cordis Germina W1' })
    expect(cordis).toHaveAccessibleDescription(
      'CRIT Rate +24%. CRIT Rate +15%. Electric DMG +25%. Basic Attack & Ultimate DEF Ignore +20%',
    )
    await user.click(zanshin)
    expect(screen.getByRole('heading', { name: 'Asaba Harumasa Result' })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Non-limited' }))
    expect(screen.getByRole('button', { name: 'Change W-Engine from The Brimstone' }))
      .toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Asaba Harumasa Result' })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Full pool' }))

    const twoPiece = screen.getByRole('button', {
      name: 'Change 2-piece Drive Disc from Branch & Blade Song',
    })
    twoPiece.focus()
    await user.keyboard('{Enter}')
    const puffer = within(screen.getByLabelText('twoPiece Drive Disc candidates'))
      .getByRole('button', { name: 'Select Puffer Electro as twoPiece' })
    puffer.focus()
    await user.keyboard('{Enter}')
    expect(screen.getByRole('button', {
      name: 'Change 2-piece Drive Disc from Puffer Electro',
    })).toHaveFocus()
    await user.click(screen.getByRole('button', { name: 'Change Disc 5 main stat from ATK%' }))
    await user.click(screen.getByRole('button', { name: 'Select PEN Ratio for Disc 5' }))

    await user.click(screen.getByRole('tab', { name: 'View Qingyi setup and Result' }))
    const qingyiTab = screen.getByRole('tab', { name: 'Close Qingyi setup and Result' })
    expect(within(qingyiTab).getByLabelText('S Rank')).toBeInTheDocument()
    expect(within(qingyiTab).getByLabelText('Electric, Stun').querySelectorAll('img'))
      .toHaveLength(2)
    expect(screen.getByRole('button', { name: 'Change W-Engine from Ice-Jade Teapot' }))
      .toHaveAccessibleDescription('Impact +18%. Impact +21%. Squad DMG +20%')
    expect(screen.getByRole('heading', { name: 'Qingyi Result' })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Impact' }))
    expect(screen.getByText('Fully Enabled Impact')).toBeInTheDocument()
    expect(screen.getByText('Self ATK')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Non-limited' }))
    expect(screen.getByRole('button', { name: 'Change W-Engine from Steam Oven' }))
      .toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Qingyi Result' })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Full pool' }))

    const mindscape = screen.getByRole('group', { name: 'Mindscape' })
    await user.click(within(mindscape).getByRole('button', { name: 'M1' }))
    expect(screen.getByRole('tab', {
      name: 'View Asaba Harumasa setup and Result, setup incomplete',
    })).toHaveClass('is-setup-incomplete')
    expect(screen.getByRole('tab', { name: 'Close Qingyi setup and Result' }))
      .not.toHaveClass('is-setup-incomplete')
    expect(screen.queryByRole('heading', { name: 'Qingyi Result' })).not.toBeInTheDocument()

    await user.click(screen.getByRole('tab', {
      name: 'View Asaba Harumasa setup and Result, setup incomplete',
    }))
    expect(screen.getByRole('tab', {
      name: 'Close Asaba Harumasa setup and Result, setup incomplete',
    })).toHaveClass('is-setup-incomplete')
    const requiredTwoPiece = screen.getByRole('button', { name: '2-piece Drive Disc required' })
    await user.click(requiredTwoPiece)
    await user.click(within(screen.getByLabelText('twoPiece Drive Disc candidates'))
      .getByRole('button', { name: 'Select Branch & Blade Song as twoPiece' }))
    await user.click(screen.getByRole('button', { name: 'Disc 5 main stat required' }))
    await user.click(screen.getByRole('button', { name: 'Select ATK% for Disc 5' }))

    expect(screen.getByRole('heading', { name: 'Asaba Harumasa Result' })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: 'Close Asaba Harumasa setup and Result' }))
      .not.toHaveClass('is-setup-incomplete')
    expect(screen.getByRole('tab', { name: 'View Lucia setup and Result' }))
      .not.toHaveClass('is-setup-incomplete')
  }, 20_000)

  it('admits Nekomata and Billy with complete packages, exact Result, and pressure recovery', async () => {
    const user = userEvent.setup()
    render(<App />)
    const replace = async (slot: number, agent: RegExp) => {
      await user.click(screen.getByRole('button', { name: new RegExp(`Replace slot ${slot},`) }))
      await user.click(screen.getByRole('button', { name: agent }))
    }

    await user.click(screen.getByRole('button', { name: 'Edit party' }))
    await replace(1, /Nekomata, Physical, Attack/)
    await replace(2, /Billy Kid, Physical, Attack/)
    await replace(3, /Qingyi, Electric, Stun/)
    await user.click(screen.getByRole('radio', { name: 'Nekomata' }))
    await user.click(screen.getByRole('button', { name: 'Apply party' }))

    const nekomataTab = screen.getByRole('tab', {
      name: 'Close Nekomata setup and Result',
    })
    expect(within(nekomataTab).getByLabelText('S Rank')).toBeInTheDocument()
    expect(within(nekomataTab).getByLabelText('Physical, Attack').querySelectorAll('img'))
      .toHaveLength(2)
    const steel = screen.getByRole('button', { name: 'Change W-Engine from Steel Cushion' })
    expect(steel).toHaveAccessibleDescription(
      'CRIT Rate +24%. Physical DMG +20%. Back Attack DMG +25%',
    )
    await user.click(steel)
    expect(within(screen.getByLabelText('W-Engine candidates')).getByRole('button', {
      name: 'Select Cloudcleave Radiance W1',
    })).toHaveAccessibleDescription(
      'CRIT DMG +48%. Physical RES Ignore +20%. DMG +25%. CRIT DMG +25%',
    )
    await user.click(steel)
    expect(screen.getByRole('heading', { name: 'Nekomata Result' })).toBeInTheDocument()

    await user.click(screen.getByRole('tab', { name: 'View Billy Kid setup and Result' }))
    const billyTab = screen.getByRole('tab', { name: 'Close Billy Kid setup and Result' })
    expect(within(billyTab).getByLabelText('A Rank')).toBeInTheDocument()
    expect(within(billyTab).getByLabelText('Physical, Attack').querySelectorAll('img'))
      .toHaveLength(2)
    expect(screen.getByRole('button', { name: 'Change W-Engine from Cloudcleave Radiance' }))
      .toHaveAccessibleDescription(
        'CRIT DMG +48%. Physical RES Ignore +20%. DMG +25%. CRIT DMG +25%',
      )
    expect(screen.getByRole('heading', { name: 'Billy Kid Result' })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Non-limited' }))
    const brimstone = screen.getByRole('button', { name: 'Change W-Engine from The Brimstone' })
    expect(brimstone).toHaveAccessibleDescription('ATK +30%. ATK +28%')
    await user.click(brimstone)
    expect(within(screen.getByLabelText('W-Engine candidates')).getByRole('button', {
      name: 'Select Starlight Engine Replica W5',
    })).toHaveAccessibleDescription('ATK +25%. Physical DMG +57.5%')
    await user.click(brimstone)
    expect(screen.getByRole('heading', { name: 'Billy Kid Result' })).toBeInTheDocument()

    await user.click(screen.getByRole('tab', { name: 'View Qingyi setup and Result' }))
    const mindscape = screen.getByRole('group', { name: 'Mindscape' })
    await user.click(within(mindscape).getByRole('button', { name: 'M1' }))
    expect(screen.getByRole('tab', {
      name: 'View Nekomata setup and Result, setup incomplete',
    })).toHaveClass('is-setup-incomplete')
    expect(screen.queryByRole('heading', { name: 'Qingyi Result' })).not.toBeInTheDocument()

    await user.click(screen.getByRole('tab', {
      name: 'View Nekomata setup and Result, setup incomplete',
    }))
    await user.click(screen.getByRole('button', { name: '2-piece Drive Disc required' }))
    await user.click(within(screen.getByLabelText('twoPiece Drive Disc candidates'))
      .getByRole('button', { name: 'Select Branch & Blade Song as twoPiece' }))
    await user.click(screen.getByRole('button', { name: 'Disc 5 main stat required' }))
    await user.click(screen.getByRole('button', { name: 'Select ATK% for Disc 5' }))
    expect(screen.getByRole('tab', { name: 'Close Nekomata setup and Result' }))
      .not.toHaveClass('is-setup-incomplete')
    expect(screen.queryByRole('heading', { name: 'Nekomata Result' })).not.toBeInTheDocument()

    await user.click(screen.getByRole('tab', {
      name: 'View Billy Kid setup and Result, setup incomplete',
    }))
    await user.click(screen.getByRole('button', { name: 'Disc 5 main stat required' }))
    await user.click(screen.getByRole('button', { name: 'Select ATK% for Disc 5' }))
    expect(screen.getByRole('heading', { name: 'Billy Kid Result' })).toBeInTheDocument()
    await user.click(screen.getByRole('tab', { name: 'View Nekomata setup and Result' }))
    expect(screen.getByRole('heading', { name: 'Nekomata Result' })).toBeInTheDocument()
  }, 25_000)

  it('admits Ju Fufu through shared Stun setup, threshold, and pool flows', async () => {
    const user = userEvent.setup()
    render(<App />)
    const replace = async (slot: number, agent: RegExp) => {
      await user.click(screen.getByRole('button', { name: new RegExp(`Replace slot ${slot},`) }))
      await user.click(screen.getByRole('button', { name: agent }))
    }

    await user.click(screen.getByRole('button', { name: 'Edit party' }))
    await replace(1, /Yixuan, Auric Ink, Rupture/)
    await replace(2, /Ju Fufu, Fire, Stun/)
    await replace(3, /Lucia, Ether, Support/)
    await user.click(screen.getByRole('button', { name: 'Apply party' }))
    await user.click(screen.getByRole('tab', { name: 'View Ju Fufu setup and Result' }))

    const tab = screen.getByRole('tab', { name: 'Close Ju Fufu setup and Result' })
    expect(screen.getByRole('region', { name: 'Ju Fufu setup' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Ju Fufu Result' })).toBeInTheDocument()
    expect(within(tab).getByLabelText('S Rank')).toBeInTheDocument()
    expect(within(tab).getByLabelText('Fire, Stun').querySelectorAll('img')).toHaveLength(2)
    expect(screen.getByRole('button', { name: 'Change W-Engine from Roaring Fur-nace' }))
      .toHaveAccessibleDescription(
        'ATK +30%. EX Special, Chain Attack & Ultimate Daze +28%. Squad DMG +20%',
      )
    await user.click(screen.getByRole('button', { name: 'ATK' }))
    expect(screen.getByText('Initial ATK')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'CRIT Rate' }))
    expect(screen.getByText('Combat CRIT Rate')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Non-limited' }))
    expect(screen.getByRole('button', { name: 'Change W-Engine from Hellfire Gears' }))
      .toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Ju Fufu Result' })).toBeInTheDocument()
  }, 15_000)

  it('admits Zhu Yuan and Nicole through prepared ranks and rebuilds a general-damage setup for Nicole pressure', async () => {
    const user = userEvent.setup()
    render(<App />)
    const replace = async (slot: number, agent: RegExp) => {
      await user.click(screen.getByRole('button', { name: new RegExp(`Replace slot ${slot},`) }))
      await user.click(screen.getByRole('button', { name: agent }))
    }

    await user.click(screen.getByRole('button', { name: 'Edit party' }))
    await replace(1, /Zhu Yuan, Ether, Attack/)
    await replace(2, /Corin, Physical, Attack/)
    await replace(3, /Lycaon, Ice, Stun/)
    await user.click(screen.getByRole('radio', { name: 'Zhu Yuan' }))
    await user.click(screen.getByRole('button', { name: 'Apply party' }))

    const zhuYuanTab = screen.getByRole('tab', { name: 'Close Zhu Yuan setup and Result' })
    expect(within(zhuYuanTab).getByLabelText('S Rank')).toBeInTheDocument()
    expect(within(zhuYuanTab).getByLabelText('Ether, Attack').querySelectorAll('img')).toHaveLength(2)
    expect(screen.getByRole('button', { name: 'M0' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: 'Change W-Engine from Cordis Germina' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Zhu Yuan Result' })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Change W-Engine from Cordis Germina' }))
    const riot = within(screen.getByLabelText('W-Engine candidates'))
      .getByRole('button', { name: 'Select Riot Suppressor Mark VI W1' })
    expect(riot).toHaveAccessibleDescription(
      'CRIT DMG +48%. CRIT Rate +15%. Ether Basic & Dash Attack DMG +35%',
    )
    await user.click(riot)
    expect(screen.getByRole('button', { name: 'Change W-Engine from Riot Suppressor Mark VI' }))
      .toHaveAccessibleDescription(
        'CRIT DMG +48%. CRIT Rate +15%. Ether Basic & Dash Attack DMG +35%',
      )

    await user.click(screen.getByRole('button', { name: 'Change 2-piece Drive Disc from Branch & Blade Song' }))
    await user.click(within(screen.getByLabelText('twoPiece Drive Disc candidates'))
      .getByRole('button', { name: 'Select Puffer Electro as twoPiece' }))
    await user.click(screen.getByRole('button', { name: 'Change Disc 5 main stat from ATK%' }))
    await user.click(screen.getByRole('button', { name: 'Select PEN Ratio for Disc 5' }))

    await user.click(screen.getByRole('button', { name: 'Edit party' }))
    await replace(2, /Nicole, Ether, Support/)
    await user.click(screen.getByRole('button', { name: 'Apply party' }))

    expect(screen.getByRole('button', { name: 'Change 2-piece Drive Disc from Branch & Blade Song' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Change Disc 5 main stat from ATK%' })).toBeInTheDocument()
    await user.click(screen.getByRole('tab', { name: 'View Nicole setup and Result' }))
    const nicoleTab = screen.getByRole('tab', { name: 'Close Nicole setup and Result' })
    expect(within(nicoleTab).getByLabelText('A Rank')).toBeInTheDocument()
    expect(within(nicoleTab).getByLabelText('Ether, Support').querySelectorAll('img')).toHaveLength(2)
    expect(screen.getByRole('button', { name: 'M6' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: 'Change W-Engine from The Vault' }))
      .toHaveAccessibleDescription(
        'Energy Regen +50%. Target squad DMG +24%. Holder Energy +0.8/s',
      )
    expect(screen.getByRole('heading', { name: 'Nicole Result' })).toBeInTheDocument()
  }, 15_000)

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
    await waitFor(() => expect(edit).toHaveFocus())
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
    await waitFor(() => expect(screen.getByRole('button', { name: 'Edit party' })).toHaveFocus())

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
