import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import type { AgentResult } from '../workbench/calculation/result'
import { surfaces } from '../workbench/calculation/composition'
import { ResultPanel } from './ResultPanel'

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
