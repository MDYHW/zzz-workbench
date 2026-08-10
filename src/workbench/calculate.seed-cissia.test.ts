import { describe, expect, it } from 'vitest'
import { calculateParty } from './calculate'
import { W_ENGINE_FACTS, W_ENGINES } from './content'
import {
  additive,
  clauseAppliesToAgent,
  source,
  withApplicability,
} from './effects'
import {
  activeCandidatePressures,
  resolveProviderEffects,
  resolveSeedVanguard,
} from './provider-effects'
import { createPreparedState } from './state'
import {
  action,
  agent,
  metric,
  selectDisc,
  selectEngine,
  selectMain,
  setRefinement,
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

describe('shared clause applicability', () => {
  it('routes by recipient Attribute and formula without a named-Agent matrix', () => {
    const electricGeneral = withApplicability(
      additive(
        'dmgBonus',
        'fully',
        source('Synthetic electric general clause', 'astraYao', 'core'),
        1,
        'all-party',
      ),
      { attributes: ['Electric'], formulas: ['general_damage'] },
    )

    expect(clauseAppliesToAgent(electricGeneral, 'seed')).toBe(true)
    expect(clauseAppliesToAgent(electricGeneral, 'cissia')).toBe(true)
    expect(clauseAppliesToAgent(electricGeneral, 'anbySoldier0')).toBe(true)
    expect(clauseAppliesToAgent(electricGeneral, 'trigger')).toBe(true)
    expect(clauseAppliesToAgent(electricGeneral, 'dialyn')).toBe(false)
    expect(clauseAppliesToAgent(electricGeneral, 'yixuan')).toBe(false)
    expect(clauseAppliesToAgent(electricGeneral, 'astraYao')).toBe(false)

    const etherSheer = withApplicability(electricGeneral, {
      attributes: ['Ether'],
      formulas: ['sheer_damage'],
    })
    expect(clauseAppliesToAgent(etherSheer, 'yixuan')).toBe(true)
    expect(clauseAppliesToAgent(etherSheer, 'lucia')).toBe(false)
  })

  it('delivers existing Astra damage clauses to compatible new projectors only', () => {
    const result = calculateParty(createPreparedState({}, ['seed', 'cissia', 'astraYao'], 0))!
    const seed = agent(result, 'seed')
    const cissia = agent(result, 'cissia')
    const astra = agent(result, 'astraYao')

    expect(metric(seed, 'atk').values.fully).toBeCloseTo(4650.6, 10)
    expect(metric(cissia, 'atk').values.fully).toBeCloseTo(3332.1, 10)
    expect(metric(seed, 'critDmg').values.fully).toBeCloseTo(148.8, 10)
    expect(metric(cissia, 'critDmg').values.fully).toBe(160)
    expect(metric(seed, 'dmgBonus').values.fully).toBe(137)
    expect(metric(cissia, 'dmgBonus').values.fully).toBe(137)
    expect(astra.metrics.map(({ id }) => id)).toEqual(['atk', 'energyRegen'])
    expect(astra.actionModifiers).toEqual([])
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
    expect(action(m2, 'seedSlaughterDefIgnore').values.fully).toBe(65)
    expect(action(m2, 'seedSlaughter').values.fully).toBe(367)
    expect(action(m2, 'seedDownfall').values.fully).toBe(247)
    expect(action(m2, 'seedUltimate').values.fully).toBe(192)
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
    expect(action(seed, 'seedSlaughter').values.fully - action(seed, 'seedDownfall').values.fully)
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

  it('keeps exact W1-W5 Serpentine and Drill result vectors', () => {
    const fullBase = createPreparedState({}, ['cissia', 'dialyn', 'yixuan'], 2)
    const serpentine = ([1, 2, 3, 4, 5] as const).map((refinement) => {
      const cissia = agent(calculateParty(setRefinement(fullBase, 'cissia', refinement))!, 'cissia')
      return [metric(cissia, 'critRate').values.combat, metric(cissia, 'defIgnore').values.combat]
    })
    expect(serpentine).toEqual([
      [54, 53], [57.8, 56.5], [61.5, 60], [65.3, 63.5], [69, 67],
    ])

    const drillBase = selectEngine(fullBase, 'cissia', 'drillRigRedAxis')
    expect(([1, 2, 3, 4, 5] as const).map((refinement) => {
      const cissia = agent(calculateParty(setRefinement(drillBase, 'cissia', refinement))!, 'cissia')
      return action(cissia, 'cissiaCorrode').values.fully
    })).toEqual([175, 182.5, 190, 197.5, 205])
  })

  it('keeps Cordis Basic scope on both Cissia actions without inventing an Ultimate row', () => {
    const base = createPreparedState({}, ['cissia', 'yixuan', 'astraYao'], 1)
    const state = selectEngine(
      base,
      'cissia',
      'cordisGermina',
    )
    const cissia = agent(calculateParty(state)!, 'cissia')
    expect(action(cissia, 'cissiaCorrode').breakdown.fully)
      .toContainEqual(expect.objectContaining({ label: 'Cordis Germina', amount: 25 }))
    expect(action(cissia, 'cissiaSerpent').breakdown.fully)
      .toContainEqual(expect.objectContaining({ label: 'Cordis Germina', amount: 25 }))
    expect(action(cissia, 'cissiaCorrodeDefIgnore').values.fully)
      .toBe(metric(cissia, 'defIgnore').values.fully + 20)
    expect(action(cissia, 'cissiaSerpentDefIgnore').values.fully)
      .toBe(metric(cissia, 'defIgnore').values.fully + 20)
    expect(cissia.actionModifiers.map(({ id }) => id).some((id) => /ultimate/i.test(id)))
      .toBe(false)
    for (const slot of [0, 1, 2] as const) {
      expect(activeCandidatePressures(state, slot))
        .toEqual(activeCandidatePressures(base, slot))
    }
  })

  it('keeps Cissia Astral and Astra Moonlight distinct and de-duplicates equal Astral holders', () => {
    const prepared = createPreparedState({}, ['seed', 'cissia', 'astraYao'], 0)
    const normal = metric(agent(calculateParty(prepared)!, 'seed'), 'dmgBonus')
      .breakdown.fully
    expect(normal).toContainEqual(expect.objectContaining({
      label: 'Astral Voice', ownerAgentId: 'cissia', amount: 24,
    }))
    expect(normal).toContainEqual(expect.objectContaining({
      label: 'Moonlight Lullaby', ownerAgentId: 'astraYao', amount: 18,
    }))

    const duplicateState = withSetup(prepared, 'astraYao', (setup) => ({
      ...setup,
      fourPieceId: 'astralVoice',
      twoPieceId: 'hormonePunk',
    }))
    const duplicateRows = metric(agent(calculateParty(duplicateState)!, 'seed'), 'dmgBonus')
      .breakdown.fully.filter(({ label }) => label === 'Astral Voice')
    expect(duplicateRows).toHaveLength(2)
    expect(duplicateRows.reduce((total, row) => total + row.amount, 0)).toBe(24)
    expect(duplicateRows.map(({ ownerAgentId }) => ownerAgentId).sort())
      .toEqual(['astraYao', 'cissia'])
  })

  it('normalizes applied traversal while retaining canonical Seed-then-Cissia source order', () => {
    const forwardState = selectEngine(
      createPreparedState({}, ['seed', 'cissia', 'astraYao'], 0),
      'seed',
      'severedInnocence',
    )
    const permutedState = selectEngine(
      createPreparedState({}, ['astraYao', 'seed', 'cissia'], 1),
      'seed',
      'severedInnocence',
    )
    const forward = calculateParty(forwardState)!
    const permuted = calculateParty(permutedState)!
    const normalized = (result: typeof forward) => [...result.agents]
      .sort((left, right) => left.agentId.localeCompare(right.agentId))
    expect(normalized(permuted)).toEqual(normalized(forward))

    const fullyOwners = metric(agent(forward, 'seed'), 'critDmg').breakdown.fully
      .map(({ ownerAgentId }) => ownerAgentId)
    expect(fullyOwners).toEqual(['astraYao', 'seed', 'cissia'])
  })

  it('projects exact local full-pool Initial values and equipment-scoped actions', () => {
    const result = calculateParty(createPreparedState({}, ['seed', 'cissia', 'astraYao'], 0))!
    const seed = agent(result, 'seed')
    const cissia = agent(result, 'cissia')

    expect(metric(seed, 'atk').values.initial).toBeCloseTo(2450.6, 10)
    expect(metric(seed, 'critRate').values.initial).toBe(61)
    expect(metric(seed, 'critDmg').values.initial).toBe(78.8)
    expect(action(seed, 'seedSlaughter').values).toEqual({ initial: 45, combat: 120, fully: 247 })
    expect(action(seed, 'seedDownfall').values).toEqual({ initial: 45, combat: 120, fully: 247 })
    expect(action(seed, 'seedUltimate').values).toEqual({ initial: 30, combat: 85, fully: 192 })
    expect(action(seed, 'seedSlaughterDefIgnore').values.fully).toBe(45)
    expect(seed.operations).toEqual([])
    expect(seed.metrics.map(({ id }) => id)).not.toContain('energyRegen')

    expect(metric(cissia, 'atk').values.initial).toBeCloseTo(2132.1, 10)
    expect(metric(cissia, 'energyRegen').values.initial).toBeCloseTo(3.744, 10)
    expect(metric(cissia, 'critRate').values).toEqual({ initial: 29, combat: 54, fully: 72 })
    expect(metric(cissia, 'defIgnore').values).toEqual({ initial: 0, combat: 53, fully: 53 })
    expect(cissia.actionModifiers.map(({ id }) => id)).toEqual(['cissiaCorrodeDaze'])
    expect(cissia.operations).toEqual([])
  })

  it('uses exact non-linear W1-W5 vectors and keeps Base ATK internal', () => {
    expect(W_ENGINE_FACTS.brimstone.atkPerStack).toEqual([3.5, 4.4, 5.2, 6, 7])
    expect(W_ENGINE_FACTS.brimstone.atkAtMax).toEqual([28, 35.2, 41.6, 48, 56])
    expect(W_ENGINE_FACTS.serpentineSeeker.critRate).toEqual([25, 28.8, 32.5, 36.3, 40])
    expect(W_ENGINE_FACTS.serpentineSeeker.electricDefIgnore).toEqual([28, 31.5, 35, 38.5, 42])
    expect(W_ENGINE_FACTS.drillRigRedAxis.basicDashElectricDmg).toEqual([50, 57.5, 65, 72.5, 80])

    expect([1, 2, 3, 4, 5].map((refinement) => (
      W_ENGINES.brimstone.passiveLines(refinement as 1 | 2 | 3 | 4 | 5)[0]
    ))).toEqual([
      'ATK +28%',
      'ATK +35.2%',
      'ATK +41.6%',
      'ATK +48%',
      'ATK +56%',
    ])
    expect(([1, 2, 3, 4, 5] as const).map((refinement) => (
      W_ENGINES.serpentineSeeker.passiveLines(refinement)
    ))).toEqual([
      ['CRIT Rate +25%', 'Electric DMG \u00B7 DEF Ignore +28%'],
      ['CRIT Rate +28.8%', 'Electric DMG \u00B7 DEF Ignore +31.5%'],
      ['CRIT Rate +32.5%', 'Electric DMG \u00B7 DEF Ignore +35%'],
      ['CRIT Rate +36.3%', 'Electric DMG \u00B7 DEF Ignore +38.5%'],
      ['CRIT Rate +40%', 'Electric DMG \u00B7 DEF Ignore +42%'],
    ])
    expect(([1, 2, 3, 4, 5] as const).map((refinement) => (
      W_ENGINES.drillRigRedAxis.passiveLines(refinement)
    ))).toEqual([
      ['Basic & Dash Attack Electric DMG +50%'],
      ['Basic & Dash Attack Electric DMG +57.5%'],
      ['Basic & Dash Attack Electric DMG +65%'],
      ['Basic & Dash Attack Electric DMG +72.5%'],
      ['Basic & Dash Attack Electric DMG +80%'],
    ])

    let state = createPreparedState({}, ['seed', 'cissia', 'astraYao'], 0)
    state = selectEngine(state, 'seed', 'brimstone')
    state = setRefinement(state, 'seed', 5)
    state = setRefinement(state, 'cissia', 5)
    const result = calculateParty(state)!
    const seedAtk = metric(agent(result, 'seed'), 'atk')
    expect(seedAtk.values.initial).toBeCloseTo(2896.8, 10)
    expect(seedAtk.values.fully).toBeCloseTo(6719.008, 10)
    expect(seedAtk.breakdown.initial.map(({ label }) => label)).toEqual([
      'The Brimstone',
      'Drive Disc · Slot 6',
    ])
    expect(seedAtk.breakdown.initial.some(({ detail }) => detail?.includes('Base ATK'))).toBe(false)
    expect(metric(agent(result, 'cissia'), 'critRate').values.combat).toBe(69)
    expect(metric(agent(result, 'cissia'), 'defIgnore').values.combat).toBe(67)
  })

  it('projects Drill Rig locally for both canonical Basic actions in the non-limited pool', () => {
    const state = createPreparedState(
      { seed: 'nonLimited', cissia: 'nonLimited' },
      ['seed', 'cissia', 'astraYao'],
      0,
    )
    const result = calculateParty(state)!
    const cissia = agent(result, 'cissia')
    expect(metric(cissia, 'energyRegen').values.initial).toBeCloseTo(3.588, 10)
    expect(action(cissia, 'cissiaCorrode').values).toEqual({ initial: 30, combat: 55, fully: 217 })
    expect(action(cissia, 'cissiaSerpent').values).toEqual({ initial: 30, combat: 55, fully: 217 })
  })

  it('retains only Seed Additional rows when the selected equipment creates no action difference', () => {
    let state = createPreparedState({}, ['seed', 'cissia', 'astraYao'], 0)
    state = selectEngine(state, 'seed', 'brimstone')
    state = selectDisc(state, 'seed', 'twoPiece', 'branchAndBlade')
    state = selectDisc(state, 'seed', 'fourPiece', 'woodpecker')
    const seed = agent(calculateParty(state)!, 'seed')
    expect(metric(seed, 'critRate').values.initial).toBe(37)
    expect(seed.actionModifiers.map(({ id }) => id)).toEqual([
      'seedSlaughter',
      'seedSlaughterResIgnore',
      'seedDownfall',
      'seedDownfallResIgnore',
      'seedUltimate',
      'seedUltimateResIgnore',
    ])
  })

  it('projects no-pressure Seed Woodpecker and Puffer choices through their exact Result rows', () => {
    const base = createPreparedState({}, ['seed', 'yixuan', 'astraYao'], 0)
    const woodpeckerState = selectDisc(
      selectDisc(base, 'seed', 'twoPiece', 'branchAndBlade'),
      'seed',
      'fourPiece',
      'woodpecker',
    )
    const woodpeckerAtk = metric(agent(calculateParty(woodpeckerState)!, 'seed'), 'atk')
    expect(woodpeckerAtk.breakdown.fully).toContainEqual(expect.objectContaining({
      label: 'Woodpecker Electro',
      detail: '4-piece',
      display: { value: 27, unit: '%', decimals: 0 },
    }))

    const pufferState = selectDisc(base, 'seed', 'twoPiece', 'pufferElectro')
    const pufferPen = metric(agent(calculateParty(pufferState)!, 'seed'), 'penRatio')
    expect(pufferPen.values).toEqual({ initial: 8, combat: 8, fully: 8 })
    expect(pufferPen.breakdown.initial).toContainEqual(expect.objectContaining({
      label: 'Puffer Electro',
      detail: '2-piece',
      amount: 8,
    }))
  })
})
