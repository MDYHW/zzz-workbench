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
})
