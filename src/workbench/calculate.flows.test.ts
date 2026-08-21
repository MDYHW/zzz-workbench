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
  setRefinement,
  setSubstat,
  sourceLabels,
  withMindscape,
  withSetup,
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
    expect(pulchra.metrics.find(({ id }) => id === 'dmgBonus')).toBeUndefined()
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

  it('keeps Pulchra King local while Astral projects only to Focus', () => {
    const kingState = selectEngine(
      createPreparedState({}, ['pulchra', 'lucia', 'corin'], 2),
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

    const astralState = selectMain(
      selectDisc(kingState, 'pulchra', 'fourPiece', 'astralVoice'),
      'pulchra',
      'slot4',
      'atkPct',
    )
    const astralResult = calculateParty(astralState)!
    const astralPulchra = agent(astralResult, 'pulchra')
    expect(astralPulchra.metrics.find(({ id }) => id === 'critRate')).toBeUndefined()
    expect(astralPulchra.metrics.find(({ id }) => id === 'dmgBonus')).toBeUndefined()
    expect(metric(agent(astralResult, 'corin'), 'dmgBonus').breakdown.fully)
      .toContainEqual(expect.objectContaining({
        label: 'Astral Voice', ownerAgentId: 'pulchra',
      }))
  })

  it('projects prepared Harumasa and Qingyi through their authored zero-hit representatives', () => {
    const state = createPreparedState({}, ['harumasa', 'qingyi', 'lucia'], 0)
    expect(state.slots[0].setup).toMatchObject({
      engineId: 'zanshinHerbCase', refinement: 1,
      fourPieceId: 'shadowHarmony', twoPieceId: 'branchAndBlade',
      mains: { slot4: 'atkPct', slot5: 'atkPct', slot6: 'atkPct' },
      substats: { critRate: 0, critDmg: 0, atkPct: 0 },
    })
    expect(state.slots[1].setup).toMatchObject({
      engineId: 'iceJadeTeapot', refinement: 1,
      fourPieceId: 'king', twoPieceId: 'shockstar',
      mains: { slot4: 'critRate', slot5: 'electricDmg', slot6: 'impact' },
      substats: { critRate: 0, critDmg: 0, atkPct: 0 },
    })

    const result = calculateParty(state)!
    const harumasa = agent(result, 'harumasa')
    const qingyi = agent(result, 'qingyi')
    expect(metric(harumasa, 'critRate').values).toEqual({
      initial: 19.4, combat: 29.4, fully: 51.4,
    })
    expect(action(harumasa, 'harumasaCoreCritRate').values.fully).toBe(76.4)
    expect(action(harumasa, 'harumasaCoreCritDmg').values.fully
      - metric(harumasa, 'critDmg').values.fully).toBe(72)
    expect(action(harumasa, 'harumasaDashDmg').values.fully
      - metric(harumasa, 'dmgBonus').values.fully).toBe(55)

    expect(metric(qingyi, 'impact').values).toEqual({
      initial: 193.12, combat: 193.12, fully: 221.68,
    })
    expect(metric(qingyi, 'impact').gauge).toMatchObject({
      threshold: 120, cap: 220, outputValue: 600, outputCap: 600,
    })
    expect(metric(qingyi, 'atk').values.initial).toBeCloseTo(2225.72)
    expect(metric(qingyi, 'atk').values.fully).toBeCloseTo(2387)
    expect(metric(qingyi, 'critRate').gauge).toMatchObject({
      basisLabel: 'Initial CRIT Rate', current: 29, threshold: 50, outputValue: 15,
    })
    expect(metric(qingyi, 'stunDmgMultiplier').values.fully).toBe(80)
    expect(action(qingyi, 'qingyiChainDmg').values.fully
      - metric(qingyi, 'dmgBonus').values.fully).toBe(60)
    expect(action(qingyi, 'qingyiEnchantedBasicDaze').values.fully
      - metric(qingyi, 'dazeBonus').values.fully).toBe(32.5)
  })

  it('projects prepared Ben through Initial DEF, Core ATK, and exact actions without survival rows', () => {
    const state = createPreparedState({}, ['ben', 'koleda', 'panYinhu'], 0)
    const result = calculateParty(state)!
    const ben = agent(result, 'ben')

    expect(metric(ben, 'def').values).toEqual({ initial: 908, combat: 908, fully: 908 })
    expect(metric(ben, 'atk').values).toEqual({
      initial: expect.closeTo(2627.05),
      combat: expect.closeTo(3353.45),
      fully: expect.closeTo(4062.7535),
    })
    expect(metric(ben, 'atk').breakdown.combat).toContainEqual(expect.objectContaining({
      label: 'Core Passive', ownerAgentId: 'ben', amount: expect.closeTo(726.4),
    }))
    expect(metric(ben, 'critRate').values).toEqual({ initial: 37, combat: 37, fully: 53 })
    expect(metric(ben, 'critRate').breakdown.fully).toContainEqual(expect.objectContaining({
      label: 'Additional Ability', ownerAgentId: 'ben', amount: 16,
    }))
    expect(action(ben, 'benExUltimate').values.fully - metric(ben, 'dmgBonus').values.fully)
      .toBe(40)
    expect(action(ben, 'benBlockCounter').values.fully - metric(ben, 'dmgBonus').values.fully)
      .toBe(30)
    expect(action(ben, 'benBasicDashDodge').values.fully - metric(ben, 'dazeBonus').values.fully)
      .toBe(20)
    expect(ben.operations).toContainEqual(expect.objectContaining({
      id: 'benBlockCounterDefDamage', value: 300, unit: '% DEF',
    }))
    expect(ben.metrics.map(({ label }) => label)).not.toContain('Shield Effect')
    expect(ben.operations.map(({ id }) => id)).not.toContain('benCoreShield')

    const unqualified = agent(
      calculateParty(createPreparedState({}, ['ben', 'dialyn', 'lucia'], 0))!,
      'ben',
    )
    expect(metric(unqualified, 'critRate').values.fully).toBe(37)
    expect(unqualified.metrics.map(({ label }) => label)).not.toContain('Shield Effect')
    expect(unqualified.operations.map(({ id }) => id)).not.toContain('benCoreShield')
  })

  it('keeps Ben DEF and non-survival package effects without projecting survival inputs', () => {
    let tusksBunny = createPreparedState({}, ['ben', 'koleda', 'panYinhu'], 0)
    tusksBunny = selectEngine(tusksBunny, 'ben', 'tusksOfFury')
    tusksBunny = selectDisc(tusksBunny, 'ben', 'fourPiece', 'bunnyInWonderland')
    const amplified = agent(calculateParty(tusksBunny)!, 'ben')
    expect(metric(amplified, 'def').values.initial).toBe(908)
    expect(amplified.metrics.map(({ label }) => label)).not.toContain('Shield Effect')
    expect(amplified.operations.map(({ id }) => id)).not.toContain('benCoreShield')
    expect(metric(amplified, 'dmgBonus').breakdown.fully).toEqual(expect.arrayContaining([
      expect.objectContaining({ label: 'Tusks of Fury', ownerAgentId: 'ben', amount: 18 }),
      expect.objectContaining({ label: 'Bunny in Wonderland', ownerAgentId: 'ben', amount: 18 }),
    ]))
    expect(metric(amplified, 'dazeBonus').breakdown.fully).toContainEqual(
      expect.objectContaining({ label: 'Tusks of Fury', ownerAgentId: 'ben', amount: 12 }),
    )

    const big = agent(calculateParty(selectEngine(
      createPreparedState({}, ['ben', 'koleda', 'panYinhu'], 0),
      'ben',
      'bigCylinder',
    ))!, 'ben')
    expect(metric(big, 'def').values.initial).toBeCloseTo(1197.6)
    expect(big.operations.map(({ id }) => id)).toEqual(['benBlockCounterDefDamage'])

    const lycaonM4 = agent(calculateParty(withMindscape(
      createPreparedState({}, ['corin', 'lycaon', 'astraYao'], 0),
      'lycaon',
      4,
    ))!, 'lycaon')
    expect(lycaonM4.metrics.map(({ label }) => label).some((label) => /shield/i.test(label)))
      .toBe(false)
  })

  it('projects Koleda Core, Additional, Hellfire, and Mindscapes on exact consumers', () => {
    const state = createPreparedState({}, ['ben', 'koleda', 'panYinhu'], 0)
    const baselineParty = calculateParty(state)!
    const baseline = agent(baselineParty, 'koleda')
    const ben = agent(baselineParty, 'ben')
    expect(metric(baseline, 'critRate').gauge).toMatchObject({
      basisLabel: 'Initial CRIT Rate', current: 29, threshold: 50,
      outputLabel: 'Squad CRIT DMG', outputValue: 15,
    })
    expect(metric(baseline, 'impact').values).toEqual({
      initial: expect.closeTo(190.28),
      combat: expect.closeTo(190.28),
      fully: expect.closeTo(217.08),
    })
    expect(metric(baseline, 'energyRegen').values).toEqual({
      initial: 1.2, combat: expect.closeTo(1.8), fully: expect.closeTo(1.8),
    })
    expect(action(baseline, 'koledaEnhancedBasic').values.fully
      - metric(baseline, 'dazeBonus').values.fully).toBe(60)
    expect(action(baseline, 'koledaExSpecial').values.fully
      - metric(baseline, 'dazeBonus').values.fully).toBe(60)
    expect(action(ben, 'sharedChainAttackDmg').values.fully
      - metric(ben, 'dmgBonus').values.fully).toBe(70)

    const progressed = agent(calculateParty(withMindscape(state, 'koleda', 6))!, 'koleda')
    expect(action(progressed, 'koledaSpecial').values.fully
      - metric(progressed, 'dazeBonus').values.fully).toBe(15)
    expect(action(progressed, 'koledaExSpecial').values.fully
      - metric(progressed, 'dazeBonus').values.fully).toBe(75)
    expect(progressed.operations).toEqual([])

    const threshold = agent(calculateParty(setSubstat(state, 'koleda', 'critRate', 9))!, 'koleda')
    expect(metric(threshold, 'critRate').gauge).toMatchObject({
      current: expect.closeTo(50.6), outputValue: 30,
    })

    const inactive = agent(
      calculateParty(createPreparedState({}, ['corin', 'koleda', 'astraYao'], 0))!,
      'koleda',
    )
    expect(inactive.actionModifiers.find(({ id }) => id === 'koledaChain')).toBeUndefined()
  })

  it('projects Zhao representatives from Initial HP and keeps later HP out of derived outputs', () => {
    const fullState = createPreparedState({}, ['zhao', 'yeShunguang', 'caesar'], 1)
    const full = agent(calculateParty(fullState)!, 'zhao')
    const fullHp = metric(full, 'maxHp')

    expect(fullState.slots[0].setup).toMatchObject({
      engineId: 'halfSugarBunny', refinement: 1,
      fourPieceId: 'bunnyInWonderland', twoPieceId: 'yunkui',
      mains: { slot4: 'hpPct', slot5: 'hpPct', slot6: 'hpPct' },
      substats: { hpPct: 0, hpFlat: 0 },
    })
    expect(fullHp.values.initial).toBeCloseTo(25721.86)
    expect(fullHp.values.fully).toBeCloseTo(fullHp.values.initial * 1.15)
    expect(fullHp.gauge).toMatchObject({
      basisLabel: 'Initial Max HP', current: expect.closeTo(25721.86),
      threshold: 15000, cap: 27000, outputValue: 36, outputCap: 40,
    })
    expect(metric(full, 'critRate').values).toEqual({ initial: 40, combat: 40, fully: 40 })
    expect(metric(full, 'energyRegen').values.combat).toBeCloseTo(1.66)

    const nonLimitedState = createPreparedState(
      { zhao: 'nonLimited' }, ['zhao', 'yeShunguang', 'caesar'], 1,
    )
    const nonLimited = agent(calculateParty(nonLimitedState)!, 'zhao')
    const nonLimitedHp = metric(nonLimited, 'maxHp')
    expect(nonLimitedState.slots[0].setup).toMatchObject({
      engineId: 'originalTransmorpher', refinement: 5,
      substats: { hpPct: 0, hpFlat: 0 },
    })
    expect(nonLimitedHp.values.combat - nonLimitedHp.values.initial)
      .toBeCloseTo(nonLimitedHp.values.initial * .125)
    expect(nonLimitedHp.gauge?.current).toBe(nonLimitedHp.values.initial)
    expect(metric(nonLimited, 'critRate').values.initial)
      .toBe(metric(nonLimited, 'critRate').values.fully)

    let invested = setSubstat(fullState, 'zhao', 'hpPct', 8)
    invested = setSubstat(invested, 'zhao', 'hpFlat', 8)
    const investedHp = metric(agent(calculateParty(invested)!, 'zhao'), 'maxHp')
    expect(investedHp.gauge).toMatchObject({
      current: expect.any(Number), outputValue: 40, outputCap: 40,
    })
    expect(investedHp.gauge!.current).toBeGreaterThanOrEqual(27000)

    let investedNonLimited = setSubstat(nonLimitedState, 'zhao', 'hpPct', 8)
    investedNonLimited = setSubstat(investedNonLimited, 'zhao', 'hpFlat', 8)
    expect(metric(agent(calculateParty(investedNonLimited)!, 'zhao'), 'maxHp').gauge)
      .toMatchObject({ outputValue: 40, outputCap: 40 })

    const m6 = agent(calculateParty(withMindscape(fullState, 'zhao', 6))!, 'zhao')
    expect(metric(m6, 'critRate').values.initial).toBe(48.75)
    expect(m6.operations).toContainEqual(expect.objectContaining({
      id: 'zhaoFinalVerdictMaxHp', value: 168, unit: '%',
    }))
  })

  it('routes Zhao qualification, Wellspring origins, Half-Sugar, and Mindscapes exactly', () => {
    const qualifiedState = createPreparedState({}, ['zhao', 'yeShunguang', 'caesar'], 1)
    const qualified = calculateParty(qualifiedState)!
    expect(metric(agent(qualified, 'yeShunguang'), 'dmgBonus').breakdown.fully)
      .toContainEqual(expect.objectContaining({
        ownerAgentId: 'zhao', locus: 'additional', amount: 36,
      }))
    expect(metric(agent(qualified, 'yeShunguang'), 'critDmg').breakdown.fully)
      .toContainEqual(expect.objectContaining({
        ownerAgentId: 'zhao', label: 'Half-Sugar Bunny', amount: 30,
      }))

    const inactive = calculateParty(
      createPreparedState({}, ['zhao', 'caesar', 'yixuan'], 2),
    )!
    expect(metric(agent(inactive, 'zhao'), 'maxHp').gauge).toBeUndefined()
    expect(metric(agent(inactive, 'yixuan'), 'dmgBonus').breakdown.fully)
      .not.toContainEqual(expect.objectContaining({
        ownerAgentId: 'zhao', locus: 'additional',
      }))

    const m4 = calculateParty(withMindscape(qualifiedState, 'zhao', 4))!
    const m4Zhao = agent(m4, 'zhao')
    expect(metric(agent(m4, 'yeShunguang'), 'resIgnore').breakdown.fully)
      .toContainEqual(expect.objectContaining({
        ownerAgentId: 'zhao', locus: 'mindscape', amount: 15,
      }))
    expect(m4Zhao.metrics.find(({ id }) => id === 'atk')).toBeUndefined()
    expect(metric(agent(m4, 'yeShunguang'), 'atk').breakdown.fully)
      .toContainEqual(expect.objectContaining({
        ownerAgentId: 'zhao', locus: 'mindscape',
        amount: expect.closeTo(metric(agent(m4, 'yeShunguang'), 'atk').values.initial * .15),
      }))
    expect(action(m4Zhao, 'zhaoM4CritDmg').values.fully
      - metric(m4Zhao, 'critDmg').values.fully).toBe(40)
    expect(m4Zhao.operations).toContainEqual(expect.objectContaining({
      id: 'zhaoFinalVerdictMaxHp', value: 120,
    }))

    const wells = calculateParty(
      createPreparedState({}, ['zhao', 'yidhari', 'lucia'], 1),
    )!
    const wellspringOrigins = metric(agent(wells, 'zhao'), 'maxHp').breakdown.fully
      .filter(({ ownerAgentId, locus }) => (
        locus === 'core' && ['zhao', 'yidhari', 'lucia'].includes(ownerAgentId)
      ))
    expect(wellspringOrigins).toHaveLength(3)
    expect(wellspringOrigins.filter(({ notation }) => notation === 'equal-nonstack-origin'))
      .toHaveLength(2)
  })

  it('projects Grace pool representatives through flat AP and percentage-scaled AM', () => {
    const fullState = createPreparedState({}, ['grace', 'billy', 'nekomata'], 0)
    const full = agent(calculateParty(fullState)!, 'grace')
    expect(fullState.slots[0].setup).toMatchObject({
      engineId: 'timeweaver', refinement: 1,
      fourPieceId: 'thunderMetal', twoPieceId: 'pufferElectro',
      mains: {
        slot4: 'anomalyProficiency', slot5: 'penRatio', slot6: 'anomalyMastery',
      },
      substats: { anomalyProficiency: 0, atkPct: 0 },
    })
    expect(metric(full, 'anomalyProficiency').values)
      .toEqual({ initial: 208, combat: 208, fully: 283 })
    expect(metric(full, 'anomalyMastery').values)
      .toEqual({ initial: 196.3, combat: 196.3, fully: 196.3 })
    expect(metric(full, 'dmgBonus').values)
      .toEqual({ initial: 10, combat: 10, fully: 40 })
    expect(metric(full, 'penRatio').values)
      .toEqual({ initial: 32, combat: 32, fully: 32 })
    expect(action(full, 'graceSpecialExBuildup').values)
      .toEqual({ initial: 0, combat: 30, fully: 160 })
    expect(full.actionModifiers.find(({ id }) => id === 'graceShock')).toBeUndefined()
    expect(metric(full, 'anomalyProficiency').gauge).toMatchObject({
      current: 283, threshold: 375, cap: 375,
      outputLabel: 'Disorder DMG Bonus', outputValue: 0,
    })

    const atkSlotSix = agent(calculateParty(selectMain(
      fullState, 'grace', 'slot6', 'atkPct',
    ))!, 'grace')
    expect(metric(atkSlotSix, 'atk').breakdown.initial)
      .toContainEqual(expect.objectContaining({
        label: 'Drive Disc · Slot 6',
        display: { value: 30, unit: '%', decimals: 0 },
      }))
    expect(metric(atkSlotSix, 'anomalyMastery').values.initial).toBe(151)

    const nonLimitedState = createPreparedState(
      { grace: 'nonLimited' }, ['grace', 'billy', 'nekomata'], 0,
    )
    const nonLimited = agent(calculateParty(nonLimitedState)!, 'grace')
    expect(nonLimitedState.slots[0].setup).toMatchObject({
      engineId: 'fusionCompiler', refinement: 1,
    })
    expect(metric(nonLimited, 'anomalyProficiency').values.fully).toBe(283)
    expect(metric(nonLimited, 'penRatio').values.initial).toBe(56)
    expect(metric(nonLimited, 'atk').breakdown.combat)
      .toContainEqual(expect.objectContaining({
        label: 'Fusion Compiler', detail: 'W1',
        amount: expect.closeTo(metric(nonLimited, 'atk').values.initial * .12),
      }))
    expect(metric(nonLimited, 'anomalyProficiency').gauge).toBeUndefined()
  })

  it('routes Grace qualification, exact Mindscapes, and the Timeweaver threshold boundary', () => {
    const qualifiedState = createPreparedState({}, ['grace', 'ben', 'billy'], 0)
    const qualified = agent(calculateParty(qualifiedState)!, 'grace')
    expect(action(qualified, 'graceShock').values.fully).toBe(36)
    expect(qualified.actionModifiers.find(({ id }) => id === 'graceDisorder'))
      .toBeUndefined()

    const exactThresholdState = withSetup(
      selectDisc(qualifiedState, 'grace', 'twoPiece', 'freedomBlues'),
      'grace',
      (setup) => ({
        ...setup,
        substats: { ...setup.substats, anomalyProficiency: 62 / 9 },
      }),
    )
    const exactThreshold = agent(calculateParty(exactThresholdState)!, 'grace')
    expect(metric(exactThreshold, 'anomalyProficiency').gauge).toMatchObject({
      current: 375, threshold: 375, outputValue: 25,
    })
    expect(action(exactThreshold, 'graceDisorder').values.fully).toBe(25)

    const aboveThreshold = agent(calculateParty(setSubstat(
      selectDisc(qualifiedState, 'grace', 'twoPiece', 'freedomBlues'),
      'grace', 'anomalyProficiency', 7,
    ))!, 'grace')
    expect(metric(aboveThreshold, 'anomalyProficiency').gauge)
      .toMatchObject({ current: 376, outputValue: 25 })

    const allElectric = agent(calculateParty(createPreparedState(
      {}, ['grace', 'anby', 'qingyi'], 0,
    ))!, 'grace')
    expect(action(allElectric, 'graceShock').values.fully).toBe(36)
    expect(metric(allElectric, 'anomalyProficiency').gauge).toBeUndefined()
    expect(allElectric.actionModifiers.find(({ id }) => id === 'graceDisorder'))
      .toBeUndefined()

    const m2 = agent(calculateParty(withMindscape(qualifiedState, 'grace', 2))!, 'grace')
    expect(metric(m2, 'resReduction').values.fully).toBe(8.5)
    expect(metric(m2, 'anomalyBuildupResReduction').values.fully).toBe(8.5)
    const m6 = agent(calculateParty(withMindscape(qualifiedState, 'grace', 6))!, 'grace')
    expect(m6.operations).toContainEqual(expect.objectContaining({
      id: 'graceGrenadeDmgMultiplier', label: 'Special/EX grenade DMG',
      value: 2, unit: '', presentation: 'scale', surface: 'fully',
    }))
    expect(JSON.stringify(m6)).not.toContain('Abloom')
  })

  it('keeps Grace alternative Anomaly W-Engine packages exact and independently useful', () => {
    const base = createPreparedState({}, ['grace', 'billy', 'nekomata'], 0)

    const practiced = agent(calculateParty(selectEngine(
      base, 'grace', 'practicedPerfection',
    ))!, 'grace')
    expect(metric(practiced, 'anomalyMastery').values)
      .toEqual({ initial: 196.3, combat: 256.3, fully: 256.3 })
    expect(metric(practiced, 'dmgBonus').breakdown.fully)
      .not.toContainEqual(expect.objectContaining({ label: 'Practiced Perfection' }))

    const electro = agent(calculateParty(selectEngine(
      base, 'grace', 'electroLipGloss',
    ))!, 'grace')
    expect(metric(electro, 'anomalyProficiency').values.initial).toBe(283)
    expect(metric(electro, 'atk').breakdown.combat)
      .not.toContainEqual(expect.objectContaining({ label: 'Electro-Lip Gloss' }))
    expect(metric(electro, 'atk').breakdown.fully)
      .toContainEqual(expect.objectContaining({
        label: 'Electro-Lip Gloss', detail: 'W5',
        display: { value: 16, unit: '%', decimals: 0 },
      }))
    expect(metric(electro, 'dmgBonus').values.fully).toBe(65)

    const weeping = agent(calculateParty(selectEngine(
      base, 'grace', 'weepingGemini',
    ))!, 'grace')
    expect(metric(weeping, 'anomalyProficiency').values.fully).toBe(392)
    expect(metric(weeping, 'anomalyProficiency').breakdown.fully)
      .toContainEqual(expect.objectContaining({
        label: 'Weeping Gemini', detail: 'W5', amount: 184,
      }))

    const chaos = agent(calculateParty(selectDisc(
      base, 'grace', 'fourPiece', 'chaosJazz',
    ))!, 'grace')
    expect(metric(chaos, 'dmgBonus').values)
      .toEqual({ initial: 0, combat: 15, fully: 45 })
    expect(chaos.actionModifiers.filter(({ metricId }) => metricId === 'dmgBonus'))
      .toEqual([])

    const freedom = agent(calculateParty(selectDisc(
      base, 'grace', 'fourPiece', 'freedomBlues',
    ))!, 'grace')
    expect(metric(freedom, 'anomalyBuildupResReduction').values.fully).toBe(20)

  })

  it('projects exact M0, M1, M2, and M6 Piper Power outcomes', () => {
    const fullState = createPreparedState({}, ['piper', 'billy', 'lycaon'], 0)
    const full = agent(calculateParty(fullState)!, 'piper')
    expect(metric(full, 'power').values).toEqual({ initial: 0, combat: 0, fully: 30 })
    expect(metric(full, 'power').breakdown.fully).toContainEqual(expect.objectContaining({
      ownerAgentId: 'piper', locus: 'core', amount: 30,
    }))
    expect(metric(full, 'power').gauge).toMatchObject({
      source: expect.objectContaining({ ownerAgentId: 'piper', locus: 'additional' }),
      current: 30, threshold: 20, cap: 30,
      outputLabel: 'Squad DMG Bonus', outputValue: 18,
    })
    expect(metric(full, 'anomalyBuildupBonus').values.fully).toBe(120)
    expect(action(full, 'piperDownwardSpecialEx').values.fully
      - metric(full, 'dmgBonus').values.fully).toBe(40)
    expect(action(full, 'piperUltimate').values.fully
      - metric(full, 'dmgBonus').values.fully).toBe(40)

    const m0 = agent(calculateParty(withMindscape(fullState, 'piper', 0))!, 'piper')
    expect(metric(m0, 'power').values.fully).toBe(20)
    expect(metric(m0, 'power').gauge).toMatchObject({ current: 20, cap: 20 })
    expect(metric(m0, 'anomalyBuildupBonus').values.fully).toBe(80)
    expect(m0.actionModifiers).toEqual([])

    const m1 = agent(calculateParty(withMindscape(fullState, 'piper', 1))!, 'piper')
    expect(metric(m1, 'power').values.fully).toBe(30)
    expect(metric(m1, 'anomalyBuildupBonus').values.fully).toBe(120)
    expect(m1.actionModifiers).toEqual([])

    const m2 = agent(calculateParty(withMindscape(fullState, 'piper', 2))!, 'piper')
    expect(action(m2, 'piperDownwardSpecialEx').outcomes).toEqual([
      { kind: 'form', action: 'Special Attack', form: 'Downward smash' },
      { kind: 'form', action: 'EX Special Attack', form: 'Downward smash' },
    ])
    expect(action(m2, 'piperDownwardSpecialEx').values.fully
      - metric(m2, 'dmgBonus').values.fully).toBe(40)
    expect(m2.operations).toEqual([])
  })

  it('keeps Piper qualification as Attribute-or-faction and projects its threshold output for applicable formulas', () => {
    for (const party of [
      ['piper', 'billy', 'soldier11'],
      ['piper', 'lucy', 'soldier11'],
    ] as const) {
      const result = calculateParty(createPreparedState({}, [...party], 0))!
      expect(metric(agent(result, 'piper'), 'power').gauge).toBeDefined()
      for (const agentId of party.filter((id) => id !== 'lucy')) {
        expect(metric(agent(result, agentId), 'dmgBonus').breakdown.fully)
          .toContainEqual(expect.objectContaining({
            ownerAgentId: 'piper', locus: 'additional', amount: 18,
          }))
      }
    }

    const unrelated = calculateParty(
      createPreparedState({}, ['piper', 'anby', 'lycaon'], 0),
    )!
    const piper = agent(unrelated, 'piper')
    expect(metric(piper, 'power').values.fully).toBe(30)
    expect(metric(piper, 'power').gauge).toBeUndefined()
    expect(metric(piper, 'anomalyBuildupBonus').values.fully).toBe(120)
    for (const result of unrelated.agents) {
      expect(result.metrics.flatMap(({ breakdown }) => breakdown.fully))
        .not.toContainEqual(expect.objectContaining({
          ownerAgentId: 'piper', locus: 'additional',
        }))
    }

    const ruptureParty = calculateParty(createPreparedState(
      {}, ['piper', 'starlightBilly', 'panYinhu'], 0,
    ))!
    expect(metric(agent(ruptureParty, 'starlightBilly'), 'dmgBonus').breakdown.fully)
      .toContainEqual(expect.objectContaining({
        ownerAgentId: 'piper', locus: 'additional', amount: 18,
      }))
  })

  it('projects Piper equipment packages and direct finite-input substitutions at their exact regions', () => {
    const base = createPreparedState({}, ['piper', 'billy', 'lycaon'], 0)

    const practiced = agent(calculateParty(selectEngine(
      base, 'piper', 'practicedPerfection',
    ))!, 'piper')
    expect(metric(practiced, 'anomalyMastery').breakdown.combat)
      .toContainEqual(expect.objectContaining({ label: 'Practiced Perfection', amount: 60 }))
    expect(metric(practiced, 'dmgBonus').breakdown.fully)
      .toContainEqual(expect.objectContaining({ label: 'Practiced Perfection', amount: 40 }))

    const sharpened = agent(calculateParty(selectEngine(
      base, 'piper', 'sharpenedStinger',
    ))!, 'piper')
    expect(metric(sharpened, 'anomalyProficiency').values.initial).toBe(300)
    expect(metric(sharpened, 'anomalyBuildupBonus').values.fully).toBe(160)
    expect(metric(sharpened, 'dmgBonus').breakdown.fully)
      .toContainEqual(expect.objectContaining({ label: 'Sharpened Stinger', amount: 36 }))

    const fusion = agent(calculateParty(selectEngine(
      base, 'piper', 'fusionCompiler',
    ))!, 'piper')
    expect(metric(fusion, 'atk').breakdown.combat)
      .toContainEqual(expect.objectContaining({
        label: 'Fusion Compiler', display: { value: 12, unit: '%', decimals: 0 },
      }))
    expect(metric(fusion, 'anomalyProficiency').breakdown.fully)
      .toContainEqual(expect.objectContaining({ label: 'Fusion Compiler', amount: 75 }))

    const electro = agent(calculateParty(setRefinement(selectEngine(
      base, 'piper', 'electroLipGloss',
    ), 'piper', 1))!, 'piper')
    expect(metric(electro, 'atk').breakdown.fully)
      .toContainEqual(expect.objectContaining({
        label: 'Electro-Lip Gloss', display: { value: 10, unit: '%', decimals: 0 },
      }))
    expect(metric(electro, 'dmgBonus').breakdown.fully)
      .toContainEqual(expect.objectContaining({ label: 'Electro-Lip Gloss', amount: 15 }))

    const weeping = agent(calculateParty(setRefinement(selectEngine(
      base, 'piper', 'weepingGemini',
    ), 'piper', 1))!, 'piper')
    expect(metric(weeping, 'anomalyProficiency').breakdown.fully)
      .toContainEqual(expect.objectContaining({ label: 'Weeping Gemini', amount: 120 }))

    const roaringW5 = agent(calculateParty(setRefinement(selectEngine(
      base, 'piper', 'roaringRide',
    ), 'piper', 5))!, 'piper')
    expect(metric(roaringW5, 'atk').breakdown.fully).toContainEqual(expect.objectContaining({
      label: 'Roaring Ride', detail: 'W5', display: { value: 12.8, unit: '%', decimals: 1 },
    }))
    expect(metric(roaringW5, 'anomalyProficiency').breakdown.fully)
      .toContainEqual(expect.objectContaining({ label: 'Roaring Ride', amount: 64 }))
    expect(metric(roaringW5, 'anomalyBuildupBonus').breakdown.fully)
      .toContainEqual(expect.objectContaining({ label: 'Roaring Ride', amount: 40 }))

    const roaringW1 = agent(calculateParty(setRefinement(selectEngine(
      base, 'piper', 'roaringRide',
    ), 'piper', 1))!, 'piper')
    expect(metric(roaringW1, 'anomalyProficiency').breakdown.fully)
      .toContainEqual(expect.objectContaining({ label: 'Roaring Ride', amount: 40 }))
    expect(metric(roaringW1, 'anomalyBuildupBonus').breakdown.fully)
      .toContainEqual(expect.objectContaining({ label: 'Roaring Ride', amount: 25 }))

    const freedom = agent(calculateParty(selectDisc(
      base, 'piper', 'fourPiece', 'freedomBlues',
    ))!, 'piper')
    expect(metric(freedom, 'anomalyProficiency').values.initial).toBe(240)
    expect(metric(freedom, 'anomalyBuildupResReduction').values.fully).toBe(20)
    expect(metric(freedom, 'dmgBonus').breakdown.fully)
      .not.toContainEqual(expect.objectContaining({ label: 'Fanged Metal' }))

    const fanged = agent(calculateParty(base)!, 'piper')
    expect(metric(fanged, 'dmgBonus').breakdown.fully).toContainEqual(expect.objectContaining({
      label: 'Fanged Metal', detail: '4-piece · After Assault · vs target', amount: 35,
    }))

    const slot4Atk = agent(calculateParty(selectMain(
      base, 'piper', 'slot4', 'atkPct',
    ))!, 'piper')
    expect(metric(slot4Atk, 'anomalyProficiency').values.initial).toBe(118)
    expect(metric(slot4Atk, 'atk').values.initial)
      .toBeGreaterThan(metric(agent(calculateParty(base)!, 'piper'), 'atk').values.initial)

    const slot6Atk = agent(calculateParty(selectMain(
      base, 'piper', 'slot6', 'atkPct',
    ))!, 'piper')
    expect(metric(slot6Atk, 'anomalyMastery').values.initial)
      .toBeLessThan(metric(agent(calculateParty(base)!, 'piper'), 'anomalyMastery').values.initial)
    expect(metric(slot6Atk, 'atk').values.initial)
      .toBeGreaterThan(metric(agent(calculateParty(base)!, 'piper'), 'atk').values.initial)

    const slot5Pen = agent(calculateParty(selectMain(
      base, 'piper', 'slot5', 'penRatio',
    ))!, 'piper')
    expect(metric(slot5Pen, 'dmgBonus').values.initial).toBe(10)
    expect(metric(slot5Pen, 'penRatio').values.initial).toBe(24)

    const invested = agent(calculateParty(setSubstat(
      setSubstat(base, 'piper', 'anomalyProficiency', 2),
      'piper', 'atkPct', 2,
    ))!, 'piper')
    expect(metric(invested, 'anomalyProficiency').values.initial).toBe(228)
    expect(metric(invested, 'atk').values.initial)
      .toBeGreaterThan(metric(agent(calculateParty(base)!, 'piper'), 'atk').values.initial)

    const projected = agent(calculateParty(base)!, 'piper')
    expect(projected.actionModifiers.flatMap(({ outcomes }) => outcomes))
      .not.toContainEqual(expect.objectContaining({ label: 'Assault' }))
    expect(projected.actionModifiers.flatMap(({ outcomes }) => outcomes))
      .not.toContainEqual(expect.objectContaining({ label: 'Disorder' }))
    expect(JSON.stringify(projected)).not.toMatch(/DMG Taken|application|uptime/i)
    expect(projected.operations).toEqual([])
  })

  it('projects one qualified AM basis into three distinct Yuzuha and recipient outcomes', () => {
    const state = createPreparedState({}, ['yuzuha', 'grace', 'piper'], 1)
    const result = calculateParty(state)!
    const yuzuha = agent(result, 'yuzuha')

    expect(metric(yuzuha, 'atk').gauge).toMatchObject({
      basisLabel: 'Initial ATK', current: 2669.6, cap: 3000,
      outputLabel: 'Squad flat ATK', outputValue: expect.closeTo(1067.84),
      outputCap: 1200,
    })
    expect(metric(yuzuha, 'anomalyMastery').values).toEqual({
      initial: expect.closeTo(171.12),
      combat: expect.closeTo(171.12),
      fully: expect.closeTo(201.12),
    })
    expect(metric(yuzuha, 'anomalyMastery').gauge).toMatchObject({
      current: expect.closeTo(201.12), threshold: 100, cap: 200,
      outputLabel: 'Anomaly Buildup Rate', outputValue: 20,
      additionalOutputs: [
        { label: 'Attribute Anomaly DMG', value: 20, cap: 20, unit: '%' },
        { label: 'Disorder DMG', value: 20, cap: 20, unit: '%' },
      ],
    })
    expect(action(yuzuha, 'yuzuhaFlavorMatchBuildup').outcomes).toEqual([{
      kind: 'source-local',
      label: 'Electric Anomaly Buildup · Flavor Match',
      canonicalScope: 'Basic Attack',
    }])
    expect(action(yuzuha, 'yuzuhaFlavorMatchBuildup').values.fully
      - metric(yuzuha, 'anomalyBuildupBonus').values.fully).toBe(25)

    const thresholdState = withSetup(state, 'grace', (setup) => ({
      ...setup,
      substats: { ...setup.substats, anomalyProficiency: 4 },
    }))
    const composedGrace = agent(calculateParty(thresholdState)!, 'grace')
    expect(composedGrace.actionModifiers.filter(({ id }) => id === 'graceDisorder'))
      .toHaveLength(1)
    expect(composedGrace.actionModifiers.find(({ id }) => id === 'receivedDisorderDmg'))
      .toBeUndefined()
    expect(action(composedGrace, 'graceDisorder').breakdown.fully).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ label: 'Timeweaver', ownerAgentId: 'grace', amount: 25 }),
        expect.objectContaining({ ownerAgentId: 'yuzuha', locus: 'additional', amount: 20 }),
      ]),
    )

    for (const recipientId of ['grace', 'piper'] as const) {
      const recipient = agent(result, recipientId)
      expect(metric(recipient, 'anomalyProficiency').breakdown.fully)
        .toContainEqual(expect.objectContaining({
          label: 'Metanukimorphosis', ownerAgentId: 'yuzuha', amount: 60,
        }))
      expect(action(recipient, 'receivedAttributeAnomalyDmg').values.fully
        - metric(recipient, 'anomalyDmgBonus').values.fully).toBe(20)
      const disorder = recipientId === 'grace'
        ? action(recipient, 'graceDisorder')
        : action(recipient, 'receivedDisorderDmg')
      expect(disorder.values.fully - metric(recipient, 'anomalyDmgBonus').values.fully).toBe(20)
      expect(metric(recipient, 'anomalyBuildupBonus').breakdown.fully)
        .toContainEqual(expect.objectContaining({
          ownerAgentId: 'yuzuha', locus: 'additional', amount: 20,
        }))
    }

    const unqualified = agent(calculateParty(createPreparedState(
      {}, ['yuzuha', 'billy', 'lycaon'], 1,
    ))!, 'yuzuha')
    expect(metric(unqualified, 'anomalyMastery').gauge).toBeUndefined()
    expect(metric(unqualified, 'anomalyBuildupBonus').values.fully).toBe(0)
    expect(action(unqualified, 'yuzuhaFlavorMatchBuildup').values.fully).toBe(25)
  })

  it('keeps Yuzuha Mindscape scopes and damage-formula contrasts distinct', () => {
    const state = createPreparedState({}, ['yuzuha', 'grace', 'piper'], 1)

    const m1 = calculateParty(withMindscape(state, 'yuzuha', 1))!
    const m1Yuzuha = agent(m1, 'yuzuha')
    expect(metric(m1Yuzuha, 'anomalyMastery').gauge).toMatchObject({
      outputValue: 20,
      additionalOutputs: [
        expect.objectContaining({ value: 26, cap: 26 }),
        expect.objectContaining({ value: 26, cap: 26 }),
      ],
    })
    for (const recipientId of ['grace', 'piper'] as const) {
      const recipient = agent(m1, recipientId)
      expect(metric(recipient, 'resReduction').breakdown.fully)
        .toContainEqual(expect.objectContaining({
          ownerAgentId: 'yuzuha', locus: 'mindscape', amount: 10,
        }))
      const disorder = recipientId === 'grace'
        ? action(recipient, 'graceDisorder')
        : action(recipient, 'receivedDisorderDmg')
      expect(disorder.values.fully - metric(recipient, 'anomalyDmgBonus').values.fully).toBe(26)
    }

    const m2 = calculateParty(withMindscape(state, 'yuzuha', 2))!
    expect(metric(agent(m2, 'grace'), 'dmgBonus').breakdown.fully)
      .toContainEqual(expect.objectContaining({
        ownerAgentId: 'yuzuha', locus: 'mindscape', amount: 15,
      }))
    expect(metric(agent(m2, 'piper'), 'anomalyBuildupBonus').breakdown.fully)
      .toContainEqual(expect.objectContaining({
        ownerAgentId: 'yuzuha', locus: 'mindscape', amount: 15,
      }))

    const m4 = agent(calculateParty(withMindscape(state, 'yuzuha', 4))!, 'yuzuha')
    expect(action(m4, 'yuzuhaAssistFollowUpBuildup').values.fully
      - metric(m4, 'anomalyBuildupBonus').values.fully).toBe(20)
    expect(m4.operations).toContainEqual(expect.objectContaining({
      id: 'yuzuhaQuickAssist', label: 'Quick Assist', value: 1,
    }))

    const m6 = calculateParty(withMindscape(state, 'yuzuha', 6))!
    expect(agent(m6, 'yuzuha').operations)
      .not.toContainEqual(expect.objectContaining({ label: 'Disorder DMG Multiplier' }))
    for (const recipientId of ['grace', 'piper'] as const) {
      expect(agent(m6, recipientId).operations).toContainEqual(expect.objectContaining({
        label: 'Disorder DMG Multiplier', value: 315, surface: 'fully',
        source: expect.objectContaining({ ownerAgentId: 'yuzuha', locus: 'mindscape' }),
      }))
    }

    for (const [party, recipientId] of [
      [['yuzuha', 'yixuan', 'grace'], 'yixuan'],
      [['yuzuha', 'billy', 'grace'], 'billy'],
    ] as const) {
      const contrast = agent(calculateParty(createPreparedState(
        {}, [party[0], party[1], party[2]], 1,
      ))!, recipientId)
      expect(metric(contrast, 'atk').breakdown.fully)
        .toContainEqual(expect.objectContaining({
          ownerAgentId: 'yuzuha', locus: 'core', amount: expect.closeTo(1067.84),
        }))
      expect(metric(contrast, 'dmgBonus').breakdown.fully)
        .toContainEqual(expect.objectContaining({
          ownerAgentId: 'yuzuha', locus: 'core', amount: 15,
        }))
      expect(contrast.metrics.map(({ id }) => id)).not.toContain('anomalyDmgBonus')
      expect(contrast.operations)
        .not.toContainEqual(expect.objectContaining({ label: 'Disorder DMG Multiplier' }))
    }
  })

  it('separates Burnice Initial Energy scaling from fixed Energy and projects scoped outcomes', () => {
    const state = createPreparedState({}, ['burnice', 'lucy', 'lighter'], 0)
    const burnice = agent(calculateParty(state)!, 'burnice')

    expect(metric(burnice, 'atk').values.initial).toBeCloseTo(2364.8)
    expect(metric(burnice, 'anomalyProficiency').values).toEqual({
      initial: 242,
      combat: 242,
      fully: 292,
    })
    expect(metric(burnice, 'anomalyProficiency').gauge).toMatchObject({
      basisLabel: 'Fully Enabled Anomaly Proficiency',
      current: 292,
      cap: 300,
      outputLabel: 'Afterburn DMG Bonus',
      outputValue: 29.2,
      outputCap: 30,
    })
    expect(metric(burnice, 'energyRegen').values).toEqual({
      initial: expect.closeTo(2.808),
      combat: expect.closeTo(3.408),
      fully: expect.closeTo(3.408),
    })
    expect(metric(burnice, 'energyRegen').gauge).toMatchObject({
      basisLabel: 'Initial Energy Regen',
      current: expect.closeTo(2.808),
      threshold: 1.8,
      cap: 2.8,
      outputLabel: 'Anomaly Mastery',
      outputValue: 25,
      outputCap: 25,
      additionalOutputs: [{ label: 'DMG Bonus', value: 20, cap: 20, unit: '%' }],
    })
    expect(metric(burnice, 'anomalyMastery').values).toEqual({
      initial: 118,
      combat: 118,
      fully: 143,
    })
    expect(action(burnice, 'burniceAfterburnDmg').values.fully
      - metric(burnice, 'dmgBonus').values.fully).toBeCloseTo(29.2)
    expect(action(burnice, 'burniceAdditionalBuildup').values.fully).toBe(65)
    expect(burnice.operations).toContainEqual(expect.objectContaining({
      id: 'burniceBurnDuration', value: 3, unit: 's', surface: 'fully',
    }))
    expect(JSON.stringify(burnice)).not.toMatch(/final damage|application history|rotation|cadence|uptime/i)
  })

  it('keeps Burnice Mindscape scopes and Yuzuha anomaly outcomes distinct', () => {
    const base = createPreparedState({}, ['burnice', 'yuzuha', 'yixuan'], 0)
    const m6 = calculateParty(withMindscape(base, 'burnice', 6))!
    const burnice = agent(m6, 'burnice')

    expect(action(burnice, 'burniceAfterburnBuildup').values.fully
      - metric(burnice, 'anomalyBuildupBonus').values.fully).toBe(25)
    expect(action(burnice, 'burniceExAssistCrit').values.fully
      - metric(burnice, 'critRate').values.fully).toBe(30)
    expect(action(burnice, 'burniceM6DoubleShotResIgnore').values.fully).toBe(25)
    expect(action(burnice, 'burniceBurnResIgnore').values.fully).toBe(25)
    expect(burnice.operations).toContainEqual(expect.objectContaining({
      id: 'burniceAfterburnAddedMultiplier', value: 100, unit: '% ATK',
    }))
    expect(action(burnice, 'receivedAttributeAnomalyDmg').values.fully
      - metric(burnice, 'anomalyDmgBonus').values.fully).toBe(20)
    expect(action(burnice, 'receivedDisorderDmg').values.fully
      - metric(burnice, 'anomalyDmgBonus').values.fully).toBe(20)

    expect(agent(m6, 'yixuan').metrics.find(({ id }) => id === 'penRatio'))
      .toBeUndefined()
    expect(metric(burnice, 'penRatio').breakdown.fully)
      .toContainEqual(expect.objectContaining({
        ownerAgentId: 'burnice', locus: 'mindscape', amount: 20,
      }))
  })
})
