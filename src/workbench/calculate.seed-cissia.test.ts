import { describe, expect, it } from 'vitest'
import { calculateParty } from './calculate'
import {
  resolveProviderEffects,
  resolveSeedVanguard,
} from './provider-effects'
import { createPreparedState } from './state'
import {
  action,
  agent,
  metric,
  selectMain,
  withMindscape,
  withSetup,
} from './calculate.test-support'

describe('Seed Vanguard resolution', () => {
  it('returns none without an eligible teammate and selects the only eligible Attack teammate', () => {
    expect(resolveSeedVanguard([
      { agentId: 'seed', appliedSlot: 0, initialAtk: 3000 },
      { agentId: 'astraYao', appliedSlot: 1, initialAtk: 2500 },
      { agentId: 'trigger', appliedSlot: 2, initialAtk: 2500 },
    ])).toBeNull()

    expect(resolveSeedVanguard([
      { agentId: 'seed', appliedSlot: 0, initialAtk: 3000 },
      { agentId: 'cissia', appliedSlot: 1, initialAtk: 1967 },
      { agentId: 'astraYao', appliedSlot: 2, initialAtk: 2500 },
    ])).toBe('cissia')
  })

  it('uses exact observed Initial ATK and re-resolves after only Cissia Slot 5 changes', () => {
    const original = createPreparedState({}, ['seed', 'cissia', 'anbySoldier0'], 0)
    const originalEffects = resolveProviderEffects(original)
    const originalAnby = originalEffects.contexts.find(({ agentId }) => agentId === 'anbySoldier0')
    const originalCissia = originalEffects.contexts.find(({ agentId }) => agentId === 'cissia')
    if (originalAnby?.agentId !== 'anbySoldier0' || originalCissia?.agentId !== 'cissia') {
      throw new Error('Missing eligible Attack observations')
    }

    expect(originalAnby.initialAtk).toBeCloseTo(2450.6, 10)
    expect(originalCissia.initialAtk).toBe(1967)
    const originalResult = calculateParty(original)!
    expect(metric(agent(originalResult, 'anbySoldier0'), 'atk').values.initial)
      .toBe(originalAnby.initialAtk)
    expect(metric(agent(originalResult, 'anbySoldier0'), 'critDmg').breakdown.combat)
      .toContainEqual(expect.objectContaining({
        ownerAgentId: 'seed', label: 'Core Passive', amount: 30,
      }))
    expect(metric(agent(originalResult, 'cissia'), 'critDmg').breakdown.combat)
      .not.toContainEqual(expect.objectContaining({
        ownerAgentId: 'seed', label: 'Core Passive', amount: 30,
      }))

    const changed = selectMain(original, 'cissia', 'slot5', 'atkPct')
    const changedEffects = resolveProviderEffects(changed)
    const changedCissia = changedEffects.contexts.find(({ agentId }) => agentId === 'cissia')
    if (changedCissia?.agentId !== 'cissia') throw new Error('Missing Cissia observation')
    expect(changedCissia.initialAtk).toBeCloseTo(2462.3, 10)
    const changedResult = calculateParty(changed)!
    expect(metric(agent(changedResult, 'cissia'), 'critDmg').breakdown.combat)
      .toContainEqual(expect.objectContaining({
        ownerAgentId: 'seed', label: 'Core Passive', amount: 30,
      }))
    expect(metric(agent(changedResult, 'anbySoldier0'), 'critDmg').breakdown.combat)
      .not.toContainEqual(expect.objectContaining({
        ownerAgentId: 'seed', label: 'Core Passive', amount: 30,
      }))

    const reversedTraversal = createPreparedState(
      {},
      ['anbySoldier0', 'cissia', 'seed'],
      2,
    )
    const reversedResult = calculateParty(reversedTraversal)!
    expect(metric(agent(reversedResult, 'anbySoldier0'), 'critDmg').breakdown.combat)
      .toContainEqual(expect.objectContaining({
        ownerAgentId: 'seed', label: 'Core Passive', amount: 30,
      }))
    expect(metric(agent(reversedResult, 'cissia'), 'critDmg').breakdown.combat)
      .not.toContainEqual(expect.objectContaining({
        ownerAgentId: 'seed', label: 'Core Passive', amount: 30,
      }))

    const reversedChangedResult = calculateParty(
      selectMain(reversedTraversal, 'cissia', 'slot5', 'atkPct'),
    )!
    expect(metric(agent(reversedChangedResult, 'cissia'), 'critDmg').breakdown.combat)
      .toContainEqual(expect.objectContaining({
        ownerAgentId: 'seed', label: 'Core Passive', amount: 30,
      }))
    expect(metric(agent(reversedChangedResult, 'anbySoldier0'), 'critDmg').breakdown.combat)
      .not.toContainEqual(expect.objectContaining({
        ownerAgentId: 'seed', label: 'Core Passive', amount: 30,
      }))
  })

  it('uses applied slot only for exact ties and ignores observation traversal order', () => {
    const tied = [
      { agentId: 'cissia', appliedSlot: 0, initialAtk: 2500 },
      { agentId: 'seed', appliedSlot: 1, initialAtk: 3000 },
      { agentId: 'anbySoldier0', appliedSlot: 2, initialAtk: 2500 },
    ] as const
    expect(resolveSeedVanguard(tied)).toBe('cissia')
    expect(resolveSeedVanguard([...tied].reverse())).toBe('cissia')

    const swapped = [
      { ...tied[0], appliedSlot: 2 },
      tied[1],
      { ...tied[2], appliedSlot: 0 },
    ] as const
    expect(resolveSeedVanguard(swapped)).toBe('anbySoldier0')
    expect(resolveSeedVanguard([...swapped].reverse())).toBe('anbySoldier0')
  })

  it('compares exact values when both candidates have the same displayed whole ATK', () => {
    const observations = [
      { agentId: 'seed', appliedSlot: 0, initialAtk: 3000 },
      { agentId: 'cissia', appliedSlot: 1, initialAtk: 2450.61 },
      { agentId: 'anbySoldier0', appliedSlot: 2, initialAtk: 2450.64 },
    ] as const
    expect(Math.round(observations[1].initialAtk)).toBe(Math.round(observations[2].initialAtk))
    expect(resolveSeedVanguard(observations)).toBe('anbySoldier0')
  })

  it('keeps incomplete Result gated with no provisional relation', () => {
    const incomplete = withSetup(
      createPreparedState({}, ['seed', 'cissia', 'anbySoldier0'], 0),
      'cissia',
      (setup) => ({ ...setup, mains: { ...setup.mains, slot5: null } }),
    )
    expect(calculateParty(incomplete)).toBeNull()
  })
})

describe('Seed and Cissia local calculation boundary', () => {
  it('projects the authored M0 cores and additional abilities through the resolved Vanguard', () => {
    const result = calculateParty(createPreparedState({}, ['seed', 'cissia', 'astraYao'], 0))!
    const seed = agent(result, 'seed')
    const cissia = agent(result, 'cissia')
    const astra = agent(result, 'astraYao')

    expect(metric(seed, 'atk').values.combat).toBeCloseTo(3450.6, 10)
    expect(metric(cissia, 'critDmg').values.combat).toBe(130)
    expect(metric(seed, 'dmgBonus').values.combat).toBe(55)
    expect(metric(cissia, 'dmgBonus').values.combat).toBe(55)
    expect(metric(seed, 'defIgnore').values.combat).toBe(25)
    expect(metric(cissia, 'defIgnore').values.combat).toBe(53)
    expect(metric(cissia, 'critRate').values.fully).toBe(72)
    expect(action(cissia, 'cissiaCorrodeDaze').values.fully).toBe(60)
    expect(astra.metrics.map(({ id }) => id)).toEqual(['atk', 'energyRegen'])
    expect(astra.actionModifiers).toEqual([])
  })

  it('exposes exact Cissia Core conversion values and approved gauge limits', () => {
    const full = agent(calculateParty(
      createPreparedState({}, ['seed', 'cissia', 'astraYao'], 0),
    )!, 'cissia')
    expect(metric(full, 'energyRegen').gauge).toMatchObject({
      threshold: 1.4,
      cap: 3.68,
      outputValue: 25,
      outputCap: 25,
    })
    expect(metric(full, 'energyRegen').gauge?.current).toBeCloseTo(3.744, 10)

    const nonLimitedState = createPreparedState(
      { seed: 'nonLimited', cissia: 'nonLimited' },
      ['seed', 'cissia', 'astraYao'],
      0,
    )
    const nonLimited = agent(calculateParty(nonLimitedState)!, 'cissia')
    expect(metric(nonLimited, 'defIgnore').values.combat).toBeCloseTo(24.233333333333334, 10)
    expect(metric(nonLimited, 'energyRegen').gauge?.outputValue)
      .toBeCloseTo(24.233333333333334, 10)

    const m1 = agent(calculateParty(withMindscape(nonLimitedState, 'cissia', 1))!, 'cissia')
    expect(metric(m1, 'defIgnore').values.combat).toBeCloseTo(33.92666666666667, 10)
    expect(metric(m1, 'energyRegen').gauge?.outputCap).toBe(35)
    expect(metric(m1, 'energyRegen').gauge?.outputValue)
      .toBeCloseTo(33.92666666666667, 10)
  })

  it('applies cumulative Seed Mindscapes only to their approved parent or action regions', () => {
    const base = createPreparedState({}, ['seed', 'cissia', 'astraYao'], 0)
    const m1 = agent(calculateParty(withMindscape(base, 'seed', 1))!, 'seed')
    expect(action(m1, 'seedDownfallCritDmg').values.fully)
      .toBeCloseTo(metric(m1, 'critDmg').values.fully + 30, 10)
    expect(m1.actionModifiers.map(({ id }) => id)).not.toContain('seedSlaughterCritDmg')

    const m2Result = calculateParty(withMindscape(base, 'seed', 2))!
    const m2 = agent(m2Result, 'seed')
    expect(metric(m2, 'defIgnore').values.combat).toBe(45)
    expect(action(m2, 'seedActionsDefIgnore').values.fully).toBe(65)
    expect(action(m2, 'seedSlaughter').values.fully).toBe(367)
    expect(action(m2, 'seedBasicActions').values.fully).toBe(247)
    expect(action(m2, 'seedActions').values.fully).toBe(192)
    expect(metric(agent(m2Result, 'cissia'), 'defIgnore').values.combat).toBe(73)
    expect(agent(m2Result, 'astraYao').metrics.map(({ id }) => id))
      .toEqual(['atk', 'energyRegen'])

    const m3 = agent(calculateParty(withMindscape(base, 'seed', 3))!, 'seed')
    expect(m3).toEqual(m2)

    const m4 = agent(calculateParty(withMindscape(base, 'seed', 4))!, 'seed')
    expect(action(m4, 'seedUltimate').values.fully).toBe(212)
    expect(action(m4, 'seedSlaughter').values.fully).toBe(367)

    const m5 = agent(calculateParty(withMindscape(base, 'seed', 5))!, 'seed')
    expect(m5).toEqual(m4)

    const m6 = agent(calculateParty(withMindscape(base, 'seed', 6))!, 'seed')
    expect(metric(m6, 'critDmg').values.combat)
      .toBeCloseTo(metric(m5, 'critDmg').values.combat + 50, 10)
    expect(metric(m6, 'critDmg').values.fully)
      .toBeCloseTo(metric(m5, 'critDmg').values.fully + 50, 10)
    expect(action(m6, 'seedDownfallCritDmg').values.fully)
      .toBeCloseTo(metric(m6, 'critDmg').values.fully + 30, 10)
    expect(m6.actionModifiers.map(({ id }) => id))
      .toEqual(m5.actionModifiers.map(({ id }) => id))
    expect(m6.operations).toEqual([])
  })

  it('applies cumulative Cissia Mindscapes after the Core cap and only to Corrode or Serpent', () => {
    const base = createPreparedState({}, ['seed', 'cissia', 'astraYao'], 0)
    const m1 = agent(calculateParty(withMindscape(base, 'cissia', 1))!, 'cissia')
    expect(metric(m1, 'defIgnore').values.combat).toBe(63)
    expect(metric(m1, 'resIgnore').values.combat).toBe(5)
    expect(action(m1, 'cissiaCorrodeResIgnore').values.fully).toBe(15)
    expect(m1.actionModifiers.map(({ id }) => id)).not.toContain('cissiaSerpentResIgnore')

    const m2 = agent(calculateParty(withMindscape(base, 'cissia', 2))!, 'cissia')
    expect(action(m2, 'cissiaSerpent').values.fully).toBe(172)
    expect(m2.actionModifiers.map(({ id }) => id)).not.toContain('cissiaCorrode')

    for (const mindscape of [3, 4, 5, 6] as const) {
      const current = agent(calculateParty(withMindscape(base, 'cissia', mindscape))!, 'cissia')
      expect(current).toEqual(m2)
    }
  })

  it('keeps Seed Vanguard-dependent sources absent when no other Attack Agent is applied', () => {
    const base = createPreparedState({}, ['seed', 'yixuan', 'astraYao'], 0)
    const seed = agent(calculateParty(withMindscape(base, 'seed', 2))!, 'seed')
    expect(metric(seed, 'critDmg').breakdown.combat)
      .not.toContainEqual(expect.objectContaining({
        ownerAgentId: 'seed', label: 'Core Passive', amount: 30,
      }))
    expect(metric(seed, 'atk').values.combat).toBe(metric(seed, 'atk').values.initial)
    expect(metric(seed, 'dmgBonus').breakdown.combat)
      .not.toContainEqual(expect.objectContaining({ ownerAgentId: 'seed', label: 'Core Passive' }))
    expect(metric(seed, 'defIgnore').values).toEqual({ initial: 0, combat: 0, fully: 0 })
    expect(metric(seed, 'defIgnore').breakdown.combat)
      .not.toContainEqual(expect.objectContaining({ detail: expect.stringContaining('M2') }))
    expect(seed.actionModifiers.flatMap(({ breakdown }) => [
      ...breakdown.combat,
      ...breakdown.fully,
    ])).not.toContainEqual(expect.objectContaining({ label: 'Additional Ability' }))
    expect(action(seed, 'seedSlaughter').values.fully - action(seed, 'seedBasicActions').values.fully)
      .toBe(120)
  })

  it('uses semantic Electric and Stun facts for Cissia Daze and Additional activation', () => {
    const inactive = agent(calculateParty(
      createPreparedState({}, ['cissia', 'yixuan', 'astraYao'], 1),
    )!, 'cissia')
    expect(action(inactive, 'cissiaCorrodeDaze').values.fully).toBe(40)
    expect(metric(inactive, 'critDmg').values.combat).toBe(50)

    const electric = agent(calculateParty(
      createPreparedState({}, ['cissia', 'anbySoldier0', 'yixuan'], 2),
    )!, 'cissia')
    expect(action(electric, 'cissiaCorrodeDaze').values.fully).toBe(60)
    expect(metric(electric, 'critDmg').values.combat).toBe(100)

    const stunResult = calculateParty(
      createPreparedState({}, ['cissia', 'dialyn', 'yixuan'], 2),
    )!
    const stun = agent(stunResult, 'cissia')
    expect(action(stun, 'cissiaCorrodeDaze').values.fully).toBe(40)
    expect(metric(stun, 'critDmg').values.combat).toBe(100)
    expect(agent(stunResult, 'dialyn').metrics.map(({ id }) => id)).not.toContain('critDmg')
  })

  it('moves Seed Vanguard CRIT through Anby exactly once after a direct Initial ATK handoff', () => {
    const beforeState = createPreparedState({}, ['seed', 'cissia', 'anbySoldier0'], 0)
    const before = agent(calculateParty(beforeState)!, 'anbySoldier0')
    expect(metric(before, 'critDmg').values.fully).toBe(233)
    expect(metric(before, 'critDmg').breakdown.combat.map(({ ownerAgentId }) => ownerAgentId))
      .toEqual(['anbySoldier0', 'seed', 'cissia'])
    const beforeDerived = action(before, 'anbyAftershockCritDmg').breakdown.fully
      .filter(({ detail }) => detail === '35% of Fully Enabled CRIT DMG')
    expect(beforeDerived).toHaveLength(1)
    expect(beforeDerived[0].amount).toBeCloseTo(81.55, 10)

    const afterState = selectMain(beforeState, 'cissia', 'slot5', 'atkPct')
    const after = agent(calculateParty(afterState)!, 'anbySoldier0')
    expect(metric(after, 'critDmg').values.fully).toBe(203)
    expect(metric(after, 'critDmg').breakdown.combat.map(({ ownerAgentId }) => ownerAgentId))
      .toEqual(['anbySoldier0', 'cissia'])
    const afterDerived = action(after, 'anbyAftershockCritDmg').breakdown.fully
      .filter(({ detail }) => detail === '35% of Fully Enabled CRIT DMG')
    expect(afterDerived).toHaveLength(1)
    expect(afterDerived[0].amount).toBeCloseTo(71.05, 10)
  })

  it('projects Cissia Electric clauses only through compatible existing regions', () => {
    const result = calculateParty(withMindscape(
      createPreparedState({}, ['cissia', 'anbySoldier0', 'yixuan'], 2),
      'cissia',
      1,
    ))!
    expect(metric(agent(result, 'anbySoldier0'), 'defIgnore').values.combat).toBe(35)
    expect(metric(agent(result, 'anbySoldier0'), 'resIgnore').values.combat).toBe(5)
    expect(agent(result, 'yixuan').metrics.map(({ id }) => id)).not.toContain('defIgnore')
    expect(metric(agent(result, 'yixuan'), 'resIgnore').values.combat).toBe(0)
  })

  it('projects exact local full-pool Initial values and equipment-scoped actions', () => {
    const result = calculateParty(createPreparedState({}, ['seed', 'cissia', 'astraYao'], 0))!
    const seed = agent(result, 'seed')
    const cissia = agent(result, 'cissia')

    expect(metric(seed, 'atk').values.initial).toBeCloseTo(2450.6, 10)
    expect(metric(seed, 'critRate').values.initial).toBe(61)
    expect(metric(seed, 'critDmg').values.initial).toBe(78.8)
    expect(action(seed, 'seedActions')).toMatchObject({
      actions: [
        'Basic Attack: Falling Petals - Slaughter',
        'Basic Attack: Falling Petals - Downfall',
        'Ultimate',
      ],
      values: { initial: 30, combat: 85, fully: 192 },
    })
    expect(action(seed, 'seedBasicActions')).toMatchObject({
      actions: [
        'Basic Attack: Falling Petals - Slaughter',
        'Basic Attack: Falling Petals - Downfall',
      ],
      baseActionId: 'seedActions',
      values: { initial: 45, combat: 120, fully: 247 },
    })
    expect(action(seed, 'seedActionsDefIgnore').values.fully).toBe(45)
    expect(seed.operations).toEqual([])
    expect(seed.metrics.map(({ id }) => id)).not.toContain('energyRegen')

    expect(metric(cissia, 'atk').values.initial).toBeCloseTo(2132.1, 10)
    expect(metric(cissia, 'energyRegen').values.initial).toBeCloseTo(3.744, 10)
    expect(metric(cissia, 'critRate').values).toEqual({ initial: 29, combat: 54, fully: 72 })
    expect(metric(cissia, 'defIgnore').values).toEqual({ initial: 0, combat: 53, fully: 53 })
    expect(cissia.actionModifiers.map(({ id }) => id)).toEqual(['cissiaCorrodeDaze'])
    expect(cissia.operations).toEqual([])
  })

})
