import { describe, expect, it } from 'vitest'
import {
  additive,
  additiveMetricBundle,
  astralVoiceEntrantClause,
  clauseAppliesToContext,
  clauseAppliesToAgent,
  completeSetup,
  presentSetupInputs,
  resolveDeliveredClauses,
  source,
  withApplicability,
} from './effects'
import { createPreparedState } from './state'

describe('effect construction and applicability', () => {
  it('keeps only resolved setup inputs without changing their order or identity', () => {
    const first = { rawValue: 10, unit: '%' as const, source: source('First', 'seed', 'calculation') }
    const second = { rawValue: 0, unit: '' as const, source: source('Second', 'seed', 'calculation') }

    expect(presentSetupInputs([first, undefined, second])).toEqual([first, second])
  })

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

  it('delivers selected Astral through the Focus boundary and formula eligibility', () => {
    const state = createPreparedState({}, ['yixuan', 'cissia', 'astraYao'], 0)
    const cissiaSetup = { ...completeSetup(state.slots[1]), fourPieceId: 'astralVoice' as const }
    const entrant = astralVoiceEntrantClause('cissia', cissiaSetup)

    expect(entrant).toMatchObject({
      recipient: 'focus',
      nonstackKey: 'astralVoiceEntrant',
    })
    expect(entrant).not.toHaveProperty('eligibleAgentIds')
    expect(entrant && clauseAppliesToAgent(entrant, 'yixuan')).toBe(true)
    expect(entrant && clauseAppliesToAgent(entrant, 'astraYao')).toBe(false)
  })
})
