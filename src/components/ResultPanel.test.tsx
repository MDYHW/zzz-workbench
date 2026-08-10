import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import type { AgentResult } from '../workbench/calculation/result'
import { surfaces } from '../workbench/calculation/composition'
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

function renderResult(agentResult: AgentResult) {
  return render(
    <ResultPanel
      activeSourceTone={null}
      agentResult={agentResult}
      onSourceToneChange={() => {}}
    />,
  )
}

describe('ResultPanel action hierarchy', () => {
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
          actions: ['Canonical action', 'Source-local outcome'],
          metricId: 'dmgBonus',
          values: surfaces(0, 20, 30),
          breakdown: emptyBreakdown,
        },
        {
          id: 'nested',
          baseActionId: 'shared',
          actions: ['Canonical action'],
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
      />,
    )
    const region = screen.getByRole('region', { name: 'Seed Result' })
    await user.click(within(region).getByRole('button', { name: 'DMG Bonus' }))
    const actions = within(region).getByRole('table', {
      name: 'DMG Bonus action outcome values',
    })

    expect(within(actions).getByRole('rowheader', {
      name: 'Canonical actionSource-local outcome',
    })).toBeInTheDocument()
    expect(within(actions).getByRole('rowheader', {
      name: /^Canonical action$/,
    })).toBeInTheDocument()
  })
})

describe('ResultPanel operation presentation', () => {
  it('preserves additive operations and gauge output', async () => {
    const user = userEvent.setup()
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
    }))

    const operations = screen.getByRole('region', { name: 'Agent operations' })
    const items = within(operations).getAllByRole('listitem')
    expect(items[0]).toHaveTextContent(
      'Fully enabledEnemy Stun duration · Synthetic source+2.0s',
    )
    expect(items[1]).toHaveTextContent(
      'Fully enabledNext Quick Assist Daze · Synthetic source+50.0%',
    )

    await user.click(screen.getByRole('button', { name: 'CRIT Rate' }))
    const gauge = screen.getByRole('group', {
      name: 'Fully Enabled CRIT Rate: current 50.0, cap 90, threshold 40.0; Aftershock Daze bonus: +15.0%, cap 75%',
    })
    expect(within(gauge).getByText('+15.0% / 75%')).toBeInTheDocument()
    expect(within(gauge).getByText('Threshold 40.0')).toBeInTheDocument()
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
    const scaleMetric = (current: number, outputValue: number) => ({
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
        cap: 100,
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
      name: 'Initial CRIT Rate: current 80.0, cap 100, threshold 80.0, Active; Basic Attack DMG Multiplier: ×1.25',
    })
    expect(within(activeGauge).getByText('Active')).toBeInTheDocument()
    expect(within(activeGauge).getByText('×1.25')).toBeInTheDocument()
    expect(within(activeGauge).queryByText(/^Threshold/)).not.toBeInTheDocument()

    rerender(
      <ResultPanel
        activeSourceTone={null}
        agentResult={syntheticResult({ metrics: [scaleMetric(79, 1)] })}
        onSourceToneChange={() => {}}
      />,
    )
    const inactiveGauge = screen.getByRole('group', {
      name: 'Initial CRIT Rate: current 79.0, cap 100, threshold 80.0; Basic Attack DMG Multiplier: ×1.00',
    })
    expect(within(inactiveGauge).getByText('Threshold 80.0')).toBeInTheDocument()
    expect(within(inactiveGauge).getByText('×1.00')).toBeInTheDocument()
    expect(within(inactiveGauge).queryByText('Active')).not.toBeInTheDocument()
    expect(screen.queryByRole('region', { name: 'Agent operations' }))
      .not.toBeInTheDocument()
  })
})
