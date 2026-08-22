import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import type { AgentResult } from '../workbench/calculation/result'
import { surfaces } from '../workbench/calculation/composition'
import { canonicalAction, sourceLocalAction } from '../workbench/actions'
import { ResultPanel } from './ResultPanel'

const syntheticSource = {
  label: 'Synthetic source',
  ownerAgentId: 'seed' as const,
  locus: 'core' as const,
}

function syntheticResult(
  overrides: Partial<Pick<AgentResult, 'metrics' | 'operations'>> = {},
): AgentResult {
  return {
    agentId: 'seed',
    metrics: [],
    actionModifiers: [],
    operations: [],
    ...overrides,
  }
}

function renderResult(
  agentResult: AgentResult,
  onSourceToneChange = () => {},
) {
  return render(
    <ResultPanel
      activeSourceTone={null}
      agentResult={agentResult}
      onSourceToneChange={onSourceToneChange}
      partyAgentIds={['seed', 'cissia', 'astraYao']}
    />,
  )
}

describe('ResultPanel action hierarchy', () => {
  it('derives an external Agent source tone from the provider current party slot', async () => {
    const user = userEvent.setup()
    const result = syntheticResult({
      metrics: [{
        id: 'dmgBonus',
        label: 'DMG Bonus',
        unit: '%',
        decimals: 1,
        values: surfaces(0, 0, 10),
        breakdown: surfaces([], [], [{
          ...syntheticSource,
          ownerAgentId: 'cissia',
          amount: 10,
        }]),
      }],
    })
    const { rerender } = render(
      <ResultPanel
        activeSourceTone={null}
        agentResult={result}
        onSourceToneChange={() => {}}
        partyAgentIds={['seed', 'cissia', 'astraYao']}
      />,
    )

    await user.click(screen.getByRole('button', { name: 'DMG Bonus' }))
    expect(screen.getByRole('row', { name: /Cissia.*Synthetic source/ }))
      .toHaveAttribute('data-source-tone', 'agent-slot-2')

    rerender(
      <ResultPanel
        activeSourceTone={null}
        agentResult={result}
        onSourceToneChange={() => {}}
        partyAgentIds={['cissia', 'seed', 'astraYao']}
      />,
    )
    expect(screen.getByRole('row', { name: /Cissia.*Synthetic source/ }))
      .toHaveAttribute('data-source-tone', 'agent-slot-1')
  })

  it('renders shared and nested scopes from the projected Result structure', async () => {
    const user = userEvent.setup()
    const emptyBreakdown = surfaces([], [], [])
    const result: AgentResult = {
      agentId: 'seed',
      metrics: [{
        id: 'dmgBonus',
        label: 'DMG Bonus',
        unit: '%',
        decimals: 1,
        values: surfaces(0, 10, 20),
        breakdown: emptyBreakdown,
      }],
      actionModifiers: [
        {
          id: 'shared',
          outcomes: [
            canonicalAction('Basic Attack'),
            sourceLocalAction('Source-local outcome'),
          ],
          tags: [],
          metricId: 'dmgBonus',
          values: surfaces(0, 20, 30),
          breakdown: emptyBreakdown,
        },
        {
          id: 'nested',
          baseActionId: 'shared',
          outcomes: [canonicalAction('Basic Attack')],
          tags: [],
          metricId: 'dmgBonus',
          values: surfaces(0, 20, 40),
          breakdown: emptyBreakdown,
        },
      ],
      operations: [],
    }

    render(
      <ResultPanel
        activeSourceTone={null}
        agentResult={result}
        onSourceToneChange={() => {}}
        partyAgentIds={['seed', 'cissia', 'astraYao']}
      />,
    )
    const region = screen.getByRole('region', { name: 'Seed Result' })
    await user.click(within(region).getByRole('button', { name: 'DMG Bonus' }))
    const actions = within(region).getByRole('table', {
      name: 'DMG Bonus action outcome values',
    })

    expect(within(actions).getByRole('rowheader', {
      name: 'Basic AttackSource-local outcome',
    })).toBeInTheDocument()
    expect(within(actions).getByRole('rowheader', {
      name: /^Basic Attack$/,
    })).toBeInTheDocument()
  })
})

describe('ResultPanel operation presentation', () => {
  it('preserves additive operations and gauge output', async () => {
    const user = userEvent.setup()
    const onSourceToneChange = vi.fn()
    renderResult(syntheticResult({
      metrics: [{
        id: 'critRate',
        label: 'CRIT Rate',
        unit: '%',
        decimals: 1,
        values: surfaces(50, 50, 50),
        breakdown: surfaces([], [], []),
        gauge: {
          source: syntheticSource,
          basisLabel: 'Fully Enabled CRIT Rate',
          current: 50,
          threshold: 40,
          cap: 90,
          outputLabel: 'Aftershock Daze bonus',
          outputValue: 15,
          outputCap: 75,
          outputUnit: '%',
        },
      }],
      operations: [
        {
          id: 'duration',
          label: 'Enemy Stun duration',
          source: syntheticSource,
          surface: 'fully',
          value: 2,
          unit: 's',
        },
        {
          id: 'amount',
          label: 'Next Quick Assist Daze',
          source: syntheticSource,
          surface: 'fully',
          value: 50,
          unit: '%',
        },
      ],
    }), onSourceToneChange)

    const operations = screen.getByRole('region', { name: 'Agent operations' })
    const items = within(operations).getAllByRole('listitem')
    expect(items[0]).toHaveTextContent(
      'Fully enabledEnemy Stun duration · Synthetic source+2.0s',
    )
    expect(items[1]).toHaveTextContent(
      'Fully enabledNext Quick Assist Daze · Synthetic source+50.0%',
    )

    await user.hover(items[0])
    expect(onSourceToneChange).toHaveBeenLastCalledWith('pointer', 'core')
    await user.unhover(items[0])
    expect(onSourceToneChange).toHaveBeenLastCalledWith('pointer', null)
    items[0].focus()
    expect(onSourceToneChange).toHaveBeenLastCalledWith('focus', 'core')
    items[0].blur()
    expect(onSourceToneChange).toHaveBeenLastCalledWith('focus', null)

    await user.click(screen.getByRole('button', { name: 'CRIT Rate' }))
    const gauge = screen.getByRole('group', {
      name: 'Fully Enabled CRIT Rate: current 50.0, cap 90, threshold 40.0; Aftershock Daze bonus: +15.0%, cap 75%',
    })
    expect(within(gauge).getByText('+15.0% / 75%')).toBeInTheDocument()
    expect(within(gauge).getByText('Threshold 40.0')).toBeInTheDocument()
  })

  it('keeps every quantity changed by one gauge relationship on its own output line', async () => {
    const user = userEvent.setup()
    renderResult(syntheticResult({
      metrics: [{
        id: 'anomalyMastery',
        label: 'Anomaly Mastery',
        unit: '',
        decimals: 2,
        values: surfaces(171.12, 201.12, 201.12),
        breakdown: surfaces([], [], []),
        gauge: {
          source: syntheticSource,
          basisLabel: 'Fully Enabled Anomaly Mastery',
          current: 201.12,
          threshold: 100,
          cap: 200,
          outputLabel: 'Anomaly Buildup Rate',
          outputValue: 20,
          outputCap: 20,
          outputUnit: '%',
          additionalOutputs: [
            { label: 'Attribute Anomaly DMG', value: 26, cap: 26, unit: '%' },
            { label: 'Disorder DMG', value: 26, cap: 26, unit: '%' },
          ],
          decimals: { current: 2, threshold: 0, cap: 0, output: 2, outputCap: 0 },
        },
      }],
    }))

    await user.click(screen.getByRole('button', { name: 'Anomaly Mastery' }))
    const gauge = screen.getByRole('group', {
      name: 'Fully Enabled Anomaly Mastery: current 201.12, cap 200, threshold 100; Anomaly Buildup Rate: +20.00%, cap 20%; Attribute Anomaly DMG: +26.00%, cap 26%; Disorder DMG: +26.00%, cap 26%',
    })
    expect(within(gauge).getAllByText(/^(?:Anomaly Buildup Rate|Attribute Anomaly DMG|Disorder DMG)$/))
      .toHaveLength(3)
  })

  it('presents action-local scale operations at Combat and Fully Enabled', () => {
    renderResult(syntheticResult({
      operations: [
        {
          id: 'combat-scale',
          label: 'Basic Attack DMG Multiplier',
          source: syntheticSource,
          surface: 'combat',
          value: 1.25,
          unit: '',
          presentation: 'scale',
        },
        {
          id: 'fully-scale',
          label: 'Ultimate DMG Multiplier',
          source: syntheticSource,
          surface: 'fully',
          value: 1.25,
          unit: '',
          presentation: 'scale',
        },
      ],
    }))

    const operations = screen.getByRole('region', { name: 'Agent operations' })
    const items = within(operations).getAllByRole('listitem')
    expect(items[0]).toHaveAccessibleName(
      'Combat Basic Attack DMG Multiplier · Synthetic source ×1.25',
    )
    expect(items[1]).toHaveAccessibleName(
      'Fully enabled Ultimate DMG Multiplier · Synthetic source ×1.25',
    )
    for (const item of items) {
      expect(item).toHaveTextContent('×1.25')
      expect(item).not.toHaveTextContent(/[+%]/)
    }
  })

  it('presents active and inactive threshold-scale gauges', async () => {
    const user = userEvent.setup()
    const scaleMetric = (current: number, outputValue: number): AgentResult['metrics'][number] => ({
      id: 'critRate',
      label: 'CRIT Rate',
      unit: '%',
      decimals: 1,
      values: surfaces(0, 0, 0),
      breakdown: surfaces([], [], []),
      gauge: {
        source: syntheticSource,
        basisLabel: 'Initial CRIT Rate',
        current,
        threshold: 80,
        cap: 80,
        outputLabel: 'Basic Attack DMG Multiplier',
        outputValue,
        outputUnit: '',
        presentation: 'scale' as const,
        decimals: { current: 1, threshold: 1 },
      },
    })
    const { rerender } = renderResult(syntheticResult({
      metrics: [scaleMetric(80, 1.25)],
    }))

    await user.click(screen.getByRole('button', { name: 'CRIT Rate' }))
    const activeGauge = screen.getByRole('group', {
      name: 'Initial CRIT Rate: current 80.0, cap 80, threshold 80.0, Active; Basic Attack DMG Multiplier: ×1.25',
    })
    expect(within(activeGauge).getByText('Active')).toBeInTheDocument()
    expect(within(activeGauge).getByText('×1.25')).toBeInTheDocument()
    expect(within(activeGauge).queryByText(/^Threshold/)).not.toBeInTheDocument()

    rerender(
      <ResultPanel
        activeSourceTone={null}
        agentResult={syntheticResult({ metrics: [scaleMetric(79, 1)] })}
        onSourceToneChange={() => {}}
        partyAgentIds={['seed', 'cissia', 'astraYao']}
      />,
    )
    const inactiveGauge = screen.getByRole('group', {
      name: 'Initial CRIT Rate: current 79.0, cap 80, threshold 80.0; Basic Attack DMG Multiplier: ×1.00',
    })
    expect(within(inactiveGauge).getByText('Threshold 80.0')).toBeInTheDocument()
    expect(within(inactiveGauge).getByText('×1.00')).toBeInTheDocument()
    expect(within(inactiveGauge).queryByText('Active')).not.toBeInTheDocument()
    expect(screen.queryByRole('region', { name: 'Agent operations' }))
      .not.toBeInTheDocument()
  })
})
