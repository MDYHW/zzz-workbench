import { describe, expect, it } from 'vitest'
import { calculateParty } from './calculate'
import { createPreparedState } from './state'
import {
  action,
  agent,
  metric,
  selectDisc,
  selectEngine,
  selectMain,
  setSubstat,
  sourceLabels,
  withMindscape,
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

    expect(metric(seed, 'atk').values.fully).toBeCloseTo(4560.8, 10)
    expect(metric(cissia, 'atk').values.fully).toBeCloseTo(4242.3, 10)
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
    const base = setSubstat(
      createPreparedState({}, ['evelyn', 'cissia', 'dialyn'], 0),
      'evelyn',
      'critRate',
      2,
    )
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
    expect(metric(corin, 'critRate').values).toMatchObject({ initial: 53, combat: 68 })
    expect(metric(corin, 'critDmg').values.initial).toBeCloseTo(94.8, 10)
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

  it('projects Orphie and Pulchra through capped Energy, Aftershock, Daze, and King meanings', () => {
    const state = createPreparedState({}, ['anbySoldier0', 'orphie', 'pulchra'], 0)
    const result = calculateParty(state)!
    const anby = agent(result, 'anbySoldier0')
    const orphie = agent(result, 'orphie')
    const pulchra = agent(result, 'pulchra')

    expect(metric(orphie, 'energyRegen')).toMatchObject({
      values: { initial: expect.closeTo(3.744), combat: expect.closeTo(3.744), fully: expect.closeTo(3.744) },
      gauge: { basisLabel: 'Initial Energy Regen', outputValue: 700, outputCap: 700 },
    })
    expect(metric(orphie, 'critRate').values).toEqual({ initial: 5, combat: 50, fully: 62 })
    expect(metric(orphie, 'critDmg').values.fully).toBe(143)
    expect(metric(orphie, 'dmgBonus').values.fully).toBe(60)
    expect(action(orphie, 'orphieAftershock').values.fully).toBe(160)
    expect(action(orphie, 'orphieAftershockDefIgnore').values.fully).toBe(55)
    expect(action(anby, 'anbyAftershockDefIgnore').values.fully).toBe(25)

    expect(metric(pulchra, 'impact').values).toEqual({
      initial: expect.closeTo(193.12), combat: expect.closeTo(193.12), fully: expect.closeTo(227.12),
    })
    expect(metric(pulchra, 'critRate')).toMatchObject({
      values: { initial: 29, combat: 29, fully: 39 },
      gauge: { basisLabel: 'Local CRIT Rate', current: 39, threshold: 50, outputValue: 15 },
    })
    expect(metric(pulchra, 'dmgBonus').values.fully).toBe(60)
    expect(action(pulchra, 'pulchraAftershockDefIgnore').values.fully).toBe(25)
    expect(action(pulchra, 'pulchraExAssistChainUltimate').values.fully).toBe(36)
  })

  it('projects the non-limited Gilded and Box packages and Pulchra M5 action contrast', () => {
    const prepared = createPreparedState(
      { orphie: 'nonLimited', pulchra: 'nonLimited' },
      ['anbySoldier0', 'orphie', 'pulchra'],
      0,
    )
    const defaultResult = calculateParty(prepared)!
    const orphie = agent(defaultResult, 'orphie')
    const pulchra = agent(defaultResult, 'pulchra')

    expect(metric(orphie, 'energyRegen')).toMatchObject({
      values: { initial: expect.closeTo(2.808) },
      gauge: { outputValue: 520 },
    })
    expect(action(orphie, 'orphieExSpecial').values.fully).toBe(84)
    expect(metric(pulchra, 'impact').values.fully).toBeCloseTo(189.04, 10)
    expect(metric(pulchra, 'dmgBonus').values.fully).toBe(84)
    expect(action(pulchra, 'pulchraExAssistChainUltimate').values.fully).toBe(52)

    const m5Result = calculateParty(withMindscape(prepared, 'pulchra', 5))!
    const m5Orphie = agent(m5Result, 'orphie')
    expect(metric(m5Orphie, 'dmgBonus').values.fully).toBe(30)
    expect(action(m5Orphie, 'orphieAftershock').values.fully).toBe(160)
  })

  it('projects Orphie Aftershock DEF Ignore on Trigger and mindscape deltas on exact consumers', () => {
    const baseline = createPreparedState({}, ['anbySoldier0', 'orphie', 'trigger'], 0)
    const trigger = agent(calculateParty(baseline)!, 'trigger')
    expect(action(trigger, 'triggerAftershockDefIgnore').values.fully).toBe(25)

    const m1 = agent(calculateParty(withMindscape(baseline, 'orphie', 1))!, 'orphie')
    const m1ResIgnore = action(m1, 'orphieSpecialExChainUltimateResIgnore')
    expect(m1ResIgnore.outcomes).toEqual([
      { kind: 'canonical', action: 'Special Attack' },
      { kind: 'canonical', action: 'EX Special Attack' },
      { kind: 'canonical', action: 'Chain Attack' },
      { kind: 'canonical', action: 'Ultimate' },
    ])
    expect(m1ResIgnore.values.fully).toBe(15)
    expect(metric(m1, 'dmgBonus').breakdown.fully)
      .toContainEqual(expect.objectContaining({ ownerAgentId: 'orphie', locus: 'mindscape', amount: 20 }))

    const m2 = agent(calculateParty(withMindscape(baseline, 'orphie', 2))!, 'orphie')
    expect(metric(m2, 'atk').breakdown.fully)
      .toContainEqual(expect.objectContaining({
        ownerAgentId: 'orphie', locus: 'mindscape',
        display: { value: 20, unit: '%', decimals: 0 },
      }))

    const m4 = agent(calculateParty(withMindscape(baseline, 'orphie', 4))!, 'orphie')
    expect(
      action(m4, 'orphieHeatChargeUltimate').values.fully
        - metric(m4, 'dmgBonus').values.fully,
    ).toBe(40)
  })

  it('keeps selected four-piece own two-piece inputs visible on the new agents', () => {
    const pulchraAllocated = createPreparedState({}, ['corin', 'trigger', 'pulchra'], 0)
    const allocatedPulchra = agent(calculateParty(pulchraAllocated)!, 'pulchra')
    expect(metric(allocatedPulchra, 'atk').breakdown.initial
      .filter(({ label, detail }) => label === 'Astral Voice' && detail === '2-piece'))
      .toHaveLength(1)

    const orphieAstral = selectDisc(
      createPreparedState({}, ['anbySoldier0', 'orphie', 'pulchra'], 0),
      'orphie',
      'fourPiece',
      'astralVoice',
    )
    const directOrphie = agent(calculateParty(orphieAstral)!, 'orphie')
    expect(metric(directOrphie, 'atk').breakdown.initial
      .filter(({ label, detail }) => label === 'Astral Voice' && detail === '2-piece'))
      .toHaveLength(1)

    const swing = selectMain(
      selectDisc(
        createPreparedState({}, ['anbySoldier0', 'orphie', 'pulchra'], 0),
        'pulchra',
        'fourPiece',
        'swingJazz',
      ),
      'pulchra',
      'slot4',
      'atkPct',
    )
    const swingPulchra = agent(calculateParty(swing)!, 'pulchra')
    expect(metric(swingPulchra, 'energyRegen').values.initial).toBeCloseTo(1.44, 10)
    expect(metric(swingPulchra, 'energyRegen').breakdown.initial
      .filter(({ label, detail }) => label === 'Swing Jazz' && detail === '2-piece'))
      .toHaveLength(1)
  })

  it('keeps Pulchra King local while Proto projects broad DMG once without a shield row', () => {
    const kingState = selectEngine(
      createPreparedState({}, ['pulchra', 'lucia', 'corin'], 0),
      'lucia',
      'unfetteredGameBall',
    )
    const kingPulchra = agent(calculateParty(kingState)!, 'pulchra')
    expect(metric(kingPulchra, 'critRate').values.fully).toBeGreaterThan(
      metric(kingPulchra, 'critRate').gauge!.current,
    )
    expect(metric(kingPulchra, 'critRate').gauge).toMatchObject({
      basisLabel: 'Local CRIT Rate',
      current: 39,
      outputValue: 15,
    })

    const protoState = selectMain(
      selectDisc(kingState, 'pulchra', 'fourPiece', 'protoPunk'),
      'pulchra',
      'slot4',
      'atkPct',
    )
    const protoResult = calculateParty(protoState)!
    const protoPulchra = agent(protoResult, 'pulchra')
    expect(protoPulchra.metrics.find(({ id }) => id === 'critRate')).toBeUndefined()
    expect(protoPulchra.metrics.map(({ label }) => label)).not.toContain('Shield Effect')
    expect(metric(protoPulchra, 'dmgBonus').breakdown.fully
      .filter(({ label, ownerAgentId }) => label === 'Proto Punk' && ownerAgentId === 'pulchra'))
      .toHaveLength(1)
    expect(metric(agent(protoResult, 'corin'), 'dmgBonus').breakdown.fully)
      .toContainEqual(expect.objectContaining({ label: 'Proto Punk', ownerAgentId: 'pulchra', amount: 15 }))
  })
})
