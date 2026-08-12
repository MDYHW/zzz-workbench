import { describe, expect, it } from 'vitest'
import { calculateParty } from './calculate'
import { createPreparedState } from './state'
import {
  action,
  agent,
  metric,
  selectDisc,
  sourceLabels,
} from './calculate.test-support'

describe('representative calculation flows', () => {
  it('projects the first prepared party through Initial, Combat, and Fully Enabled', () => {
    const result = calculateParty(createPreparedState())!
    const yixuan = agent(result, 'yixuan')
    const dialyn = agent(result, 'dialyn')
    const lucia = agent(result, 'lucia')

    expect(result.agents.map(({ agentId }) => agentId))
      .toEqual(['yixuan', 'dialyn', 'lucia'])
    expect(metric(yixuan, 'sheerForce').values).toMatchObject({
      initial: expect.closeTo(2222.71),
      fully: expect.closeTo(3366.1847),
    })
    expect(metric(dialyn, 'impact').values)
      .toEqual({ initial: 110, combat: 160.8, fully: 160.8 })
    expect(metric(lucia, 'maxHp').gauge).toMatchObject({
      basisLabel: 'Initial Max HP',
      outputValue: expect.closeTo(814.7927),
    })
    expect(sourceLabels(metric(yixuan, 'critDmg').breakdown.fully)).toEqual([
      'Additional Ability',
      'Yesterday Calls · W1',
      'Additional Ability',
      'King of the Summit · 4-piece',
    ])
  })

  it('projects the second prepared party and its single derived phase', () => {
    const result = calculateParty(
      createPreparedState({}, ['anbySoldier0', 'trigger', 'astraYao'], 0),
    )!
    const anby = agent(result, 'anbySoldier0')
    const trigger = agent(result, 'trigger')
    const astra = agent(result, 'astraYao')

    expect(metric(anby, 'dmgBonus').values.fully).toBe(139)
    expect(action(anby, 'anbyAftershock').values)
      .toEqual({ initial: 45, combat: 45, fully: 204 })
    expect(action(trigger, 'triggerAftershockCritDmg').values.fully).toBeCloseTo(179.55)
    expect(astra.metrics.map(({ id }) => id)).toEqual(['atk', 'energyRegen'])
    expect(astra.operations).toEqual([])
  })

  it('projects Astra non-limited Kaboom while preserving her M0 ATK main', () => {
    const state = createPreparedState(
      { astraYao: 'nonLimited' },
      ['anbySoldier0', 'trigger', 'astraYao'],
      0,
    )
    const result = calculateParty(state)!
    const anby = agent(result, 'anbySoldier0')
    const astra = agent(result, 'astraYao')

    expect(state.slots[2].setup).toMatchObject({
      engineId: 'kaboom',
      refinement: 5,
      mains: { slot6: 'atkPct' },
    })
    expect(metric(astra, 'energyRegen').breakdown.initial)
      .toContainEqual(expect.objectContaining({
        label: 'Kaboom the Cannon',
        display: { value: 50, unit: '%', decimals: 0 },
      }))
    expect(metric(anby, 'atk').breakdown.fully)
      .toContainEqual(expect.objectContaining({
        label: 'Kaboom the Cannon', ownerAgentId: 'astraYao',
        display: { value: 16, unit: '%', decimals: 0 },
      }))
  })

  it('projects the third prepared party through semantic recipients', () => {
    const result = calculateParty(
      createPreparedState({}, ['seed', 'cissia', 'astraYao'], 0),
    )!
    const seed = agent(result, 'seed')
    const cissia = agent(result, 'cissia')
    const astra = agent(result, 'astraYao')

    expect(metric(seed, 'atk').values.fully).toBeCloseTo(4650.6, 10)
    expect(metric(cissia, 'atk').values.fully).toBeCloseTo(4332.1, 10)
    expect(metric(seed, 'dmgBonus').values.fully).toBe(137)
    expect(metric(cissia, 'defIgnore').values.combat).toBe(53)
    expect(action(cissia, 'cissiaCorrodeDaze').values.fully).toBe(60)
    expect(astra.actionModifiers).toEqual([])
  })

  it('reuses existing projectors for a representative cross-vertical party', () => {
    const result = calculateParty(
      createPreparedState({}, ['seed', 'cissia', 'anbySoldier0'], 0),
    )!
    const anby = agent(result, 'anbySoldier0')
    const cissia = agent(result, 'cissia')

    expect(metric(anby, 'critDmg').breakdown.combat)
      .toContainEqual(expect.objectContaining({ ownerAgentId: 'seed', amount: 30 }))
    expect(metric(anby, 'defIgnore').values.combat).toBe(25)
    expect(metric(cissia, 'critDmg').breakdown.combat)
      .not.toContainEqual(expect.objectContaining({ ownerAgentId: 'seed', amount: 30 }))
    expect(action(anby, 'anbyAftershockCritDmg').breakdown.fully
      .filter(({ detail }) => detail === '35% of Fully Enabled CRIT DMG'))
      .toHaveLength(1)
  })

  it('projects Evelyn through established party recipients and contextual equipment', () => {
    const base = createPreparedState({}, ['evelyn', 'cissia', 'dialyn'], 0)
    const evelyn = agent(calculateParty(base)!, 'evelyn')

    expect(metric(evelyn, 'critDmg').breakdown.combat)
      .toContainEqual(expect.objectContaining({ ownerAgentId: 'cissia', amount: 40 }))
    expect(metric(evelyn, 'resIgnore').values)
      .toEqual({ initial: 0, combat: 0, fully: 0 })
    expect(Object.values(metric(evelyn, 'resIgnore').breakdown).flat())
      .not.toContainEqual(expect.objectContaining({ ownerAgentId: 'cissia' }))
    expect(evelyn.metrics.find(({ id }) => id === 'defIgnore')).toBeUndefined()
    expect(evelyn.operations).toContainEqual(expect.objectContaining({
      id: 'evelynChainUltimateDmgMultiplier', surface: 'combat', value: 1.25,
    }))

    let contextual = createPreparedState({}, ['evelyn', 'dialyn', 'astraYao'], 0)
    contextual = selectDisc(contextual, 'evelyn', 'fourPiece', 'pufferElectro')
    const selected = agent(calculateParty(contextual)!, 'evelyn')
    const parent = action(selected, 'evelynChainUltimate')
    const ultimate = action(selected, 'evelynUltimate')
    expect(ultimate.baseActionId).toBe('evelynChainUltimate')
    expect(ultimate.values.fully - parent.values.fully).toBe(20)
    expect(metric(selected, 'dmgBonus').breakdown.fully)
      .not.toContainEqual(expect.objectContaining({ label: 'Puffer Electro' }))
    expect(metric(selected, 'atk').breakdown.fully)
      .toContainEqual(expect.objectContaining({
        label: 'Puffer Electro', display: { value: 15, unit: '%', decimals: 0 },
      }))
  })

  it('projects both Corin and Lycaon pool representatives at zero supplied substats', () => {
    const full = calculateParty(
      createPreparedState({}, ['corin', 'lycaon', 'astraYao'], 0),
    )!
    const corin = agent(full, 'corin')
    const lycaon = agent(full, 'lycaon')

    expect(metric(corin, 'atk').values.initial).toBeCloseTo(2444, 10)
    expect(metric(corin, 'critRate').values).toMatchObject({ initial: 37, combat: 52 })
    expect(metric(corin, 'critDmg').values.initial).toBeCloseTo(126.8, 10)
    expect(metric(lycaon, 'impact').values).toMatchObject({
      initial: expect.closeTo(194.54),
      fully: expect.closeTo(228.79),
    })
    expect(action(lycaon, 'lycaonPotential').values.fully).toBeCloseTo(249.34, 10)
    expect(lycaon.metrics.find(({ id }) => id === 'energyRegen')).toBeUndefined()

    const nonLimited = calculateParty(createPreparedState(
      { corin: 'nonLimited', lycaon: 'nonLimited' },
      ['corin', 'lycaon', 'astraYao'],
      0,
    ))!
    const nonLimitedCorin = agent(nonLimited, 'corin')
    const nonLimitedLycaon = agent(nonLimited, 'lycaon')

    expect(metric(nonLimitedCorin, 'atk').values.initial).toBeCloseTo(2403.4, 10)
    expect(metric(nonLimitedCorin, 'critRate').values.initial).toBe(61)
    expect(metric(nonLimitedLycaon, 'impact').values).toMatchObject({
      initial: expect.closeTo(169.88),
      fully: expect.closeTo(204.952),
    })
    expect(action(nonLimitedLycaon, 'lycaonPotential').values.fully)
      .toBeCloseTo(225.502, 10)
    expect(metric(nonLimitedLycaon, 'energyRegen').values.initial).toBeCloseTo(1.8, 10)
  })

  it('projects default-M6 Manato through the prepared Grill package', () => {
    const state = createPreparedState({}, ['manato', 'lucia', 'astraYao'], 0)
    const manato = agent(calculateParty(state)!, 'manato')

    expect(state.slots[0].setup).toMatchObject({
      mindscape: 6,
      engineId: 'grillOWisp',
      refinement: 5,
      fourPieceId: 'yunkui',
      twoPieceId: 'woodpecker',
      mains: { slot4: 'critDmg', slot5: 'fireDmg', slot6: 'hpPct' },
      substats: { critRate: 0, critDmg: 0, hpPct: 0 },
    })
    expect(metric(manato, 'sheerForce').breakdown.initial)
      .toContainEqual(expect.objectContaining({ label: 'Rupture specialty', notation: 'surface-value' }))
    expect(manato.operations).toEqual([])
  })
})
