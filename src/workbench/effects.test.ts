import { describe, expect, it } from 'vitest'
import {
  additive,
  additiveMetricBundle,
  clauseAppliesToContext,
  resolveDeliveredClauses,
  source,
  withApplicability,
} from './effects'

describe('effect construction and applicability', () => {
  it('keeps every metric in one bundle on the same recipient boundary', () => {
    const recipients = ['seed', 'cissia'] as const
    const clauses = additiveMetricBundle(
      { atk: 10, critDmg: 20 },
      'combat',
      source('Synthetic status', 'seed', 'core'),
      'all-party',
      [...recipients],
    )

    expect(clauses.map(({ metric, recipient, eligibleAgentIds }) => ({
      metric,
      recipient,
      eligibleAgentIds,
    }))).toEqual([
      { metric: 'atk', recipient: 'all-party', eligibleAgentIds: recipients },
      { metric: 'critDmg', recipient: 'all-party', eligibleAgentIds: recipients },
    ])
    expect(resolveDeliveredClauses(clauses, {}).map(({ metric, amount }) => ({
      metric,
      amount,
    }))).toEqual([
      { metric: 'atk', amount: 10 },
      { metric: 'critDmg', amount: 20 },
    ])
  })

  it('evaluates Attribute and formula axes without using identity as policy', () => {
    const clause = withApplicability(
      additive(
        'dmgBonus',
        'fully',
        source('Synthetic scoped effect', 'astraYao', 'core'),
        1,
        'all-party',
      ),
      { attributes: ['Electric'], formulas: ['general_damage'] },
    )

    expect(clauseAppliesToContext(clause, {
      attribute: 'Electric',
      formulas: ['general_damage'],
    })).toBe(true)
    expect(clauseAppliesToContext(clause, {
      attribute: 'Physical',
      formulas: ['general_damage'],
    })).toBe(false)
    expect(clauseAppliesToContext(clause, {
      attribute: 'Electric',
      formulas: ['sheer_damage'],
    })).toBe(false)
  })
})
