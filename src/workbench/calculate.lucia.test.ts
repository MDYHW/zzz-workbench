import { describe, expect, it } from 'vitest'
import { calculateParty } from './calculate'
import { createPreparedState, type Mindscape } from './state'
import {
  agent,
  metric,
  selectDisc,
  selectEngine,
  selectMain,
  setSubstat,
  withMindscape,
} from './calculate.test-support'


describe('calculateParty: lucia', () => {
  it('trades Lucia Yunkui 2-piece HP for Swing Jazz Energy Regen with exact sources', () => {
    const prepared = createPreparedState()
    const preparedLucia = agent(calculateParty(prepared)!, 'lucia')
    const result = calculateParty(selectDisc(
      prepared,
      'lucia',
      'twoPiece',
      'swingJazz',
    ))!
    const lucia = agent(result, 'lucia')
    const energyRegen = metric(lucia, 'energyRegen')

    expect(metric(preparedLucia, 'maxHp').values.initial).toBeCloseTo(21697.1)
    expect(metric(lucia, 'maxHp').values.initial).toBeCloseTo(20849.4)
    expect(metric(lucia, 'maxHp').gauge?.outputValue)
      .toBeLessThan(metric(preparedLucia, 'maxHp').gauge!.outputValue)
    expect(energyRegen.values.initial).toBeCloseTo(1.82)
    expect(energyRegen.values.combat).toBeCloseTo(2.22)
    expect(energyRegen.values.fully).toBeCloseTo(2.22)
    expect(energyRegen.breakdown.initial).toContainEqual(expect.objectContaining({
      label: 'Swing Jazz',
      detail: '2-piece',
      ownerAgentId: 'lucia',
      locus: 'disc-2pc',
      display: { value: 20, unit: '%', decimals: 0 },
    }))
    expect(energyRegen.breakdown.initial).toContainEqual(expect.objectContaining({
      label: 'Moonlight Lullaby',
      detail: '2-piece',
      ownerAgentId: 'lucia',
      locus: 'disc-4pc',
      display: { value: 20, unit: '%', decimals: 0 },
    }))
  })

  it('recalculates Lucia Slot 6 Energy Regen and downstream Sheer Force', () => {
    const result = calculateParty(selectMain(
      createPreparedState(),
      'lucia',
      'slot6',
      'energyRegenPct',
    ))!
    const lucia = agent(result, 'lucia')
    const yixuan = agent(result, 'yixuan')

    expect(metric(lucia, 'maxHp').values.initial).toBeCloseTo(19154)
    const energyRegen = metric(lucia, 'energyRegen')
    expect(energyRegen.values.initial).toBeCloseTo(2.34)
    expect(energyRegen.values.combat).toBeCloseTo(2.74)
    expect(energyRegen.values.fully).toBeCloseTo(2.74)
    expect(metric(lucia, 'energyRegen').breakdown.initial).toContainEqual(
      expect.objectContaining({
        label: 'Drive Disc \u00B7 Slot 6',
        amount: 0.78,
        display: { value: 60, unit: '%', decimals: 0 },
      }),
    )
    expect(metric(lucia, 'maxHp').gauge).toMatchObject({
      current: 19154,
      outputValue: 720.698,
    })
    expect(metric(yixuan, 'sheerForce').values.fully).toBeCloseTo(3272.09)
  })

  it('retains partial and non-limited Lucia packages for distinct visible operations', () => {
    const prepared = createPreparedState()

    const thought = calculateParty(selectEngine(
      prepared,
      'lucia',
      'thoughtbop',
    ))!
    expect(metric(agent(thought, 'lucia'), 'maxHp').values.initial).toBeCloseTo(19154)
    expect(metric(agent(thought, 'lucia'), 'energyRegen').values.initial).toBeCloseTo(2.34)
    expect(metric(agent(thought, 'lucia'), 'energyRegen').values.combat).toBeCloseTo(2.94)
    expect(metric(agent(thought, 'lucia'), 'energyRegen').values.fully).toBeCloseTo(2.94)
    expect(metric(agent(thought, 'yixuan'), 'dmgBonus').values.fully).toBeCloseTo(124)

    const weeping = calculateParty(selectEngine(
      prepared,
      'lucia',
      'weepingCradle',
    ))!
    expect(metric(agent(weeping, 'lucia'), 'energyRegen').values).toEqual({
      initial: 1.56,
      combat: 2.16,
      fully: 2.16,
    })
    expect(metric(agent(weeping, 'yixuan'), 'dmgBonus').values.fully).toBeCloseTo(144.2)
    expect(metric(agent(weeping, 'yixuan'), 'dmgBonus').breakdown.fully)
      .toContainEqual(expect.objectContaining({
        label: 'Weeping Cradle',
        detail: 'W1',
        amount: 20.2,
        ownerAgentId: 'lucia',
      }))

    const kaboom = calculateParty(selectEngine(
      prepared,
      'lucia',
      'kaboom',
    ))!
    expect(metric(agent(kaboom, 'yixuan'), 'atk').values.fully).toBeCloseTo(2239.96)
    expect(metric(agent(kaboom, 'yixuan'), 'atk').breakdown.fully).toContainEqual(
      expect.objectContaining({
        label: 'Kaboom the Cannon',
        detail: 'W5',
        amount: 308.96,
        display: { value: 16, unit: '%', decimals: 0 },
      }),
    )
    expect(metric(agent(kaboom, 'lucia'), 'energyRegen').values.initial).toBeCloseTo(2.21)

    const gameBall = calculateParty(selectEngine(
      prepared,
      'lucia',
      'unfetteredGameBall',
    ))!
    expect(metric(agent(gameBall, 'yixuan'), 'critRate').values.fully).toBe(100)
    expect(metric(agent(gameBall, 'dialyn'), 'critRate').values.fully).toBeCloseTo(95.4)
    expect(agent(gameBall, 'lucia').metrics.some(({ id }) => id === 'critRate')).toBe(false)
  })

  it('keeps later Max HP percentages source-stated and outside Darkbreaker basis', () => {
    const result = calculateParty(createPreparedState())!
    const yixuanHp = metric(agent(result, 'yixuan'), 'maxHp')
    const luciaHp = metric(agent(result, 'lucia'), 'maxHp')

    expect(yixuanHp.breakdown.fully).toEqual([
      expect.objectContaining({
        label: 'Core Passive',
        ownerAgentId: 'lucia',
        locus: 'core',
        amount: 821.705,
        display: { value: 5, unit: '%', decimals: 0 },
      }),
      expect.objectContaining({
        label: 'Dreamlit Hearth',
        detail: 'W1',
        ownerAgentId: 'lucia',
        amount: 2465.115,
        display: { value: 15, unit: '%', decimals: 0 },
      }),
    ])
    expect(luciaHp.breakdown.fully).toEqual([
      expect.objectContaining({
        label: 'Core Passive',
        ownerAgentId: 'lucia',
        locus: 'core',
        amount: 1084.855,
        display: { value: 5, unit: '%', decimals: 0 },
      }),
      expect.objectContaining({
        label: 'Dreamlit Hearth',
        detail: 'W1',
        ownerAgentId: 'lucia',
        amount: 3254.565,
        display: { value: 15, unit: '%', decimals: 0 },
      }),
    ])
    expect(luciaHp.gauge).toMatchObject({
      basisLabel: 'Initial Max HP',
      current: 21697.1,
      outputValue: 814.7927,
    })
  })

  it('uses Lucia level 12, 14, and 16 Darkbreaker tiers cumulatively', () => {
    const prepared = createPreparedState()
    const at = (mindscape: Mindscape) => calculateParty(
      withMindscape(prepared, 'lucia', mindscape),
    )!
    const m0 = at(0)
    const m1 = at(1)
    const m2 = at(2)
    const m3 = at(3)
    const m4 = at(4)
    const m5 = at(5)
    const m6 = at(6)

    const yixuanM0 = agent(m0, 'yixuan')
    expect(metric(yixuanM0, 'sheerForce').values.fully).toBeCloseTo(3366.1847)
    expect(metric(agent(m1, 'yixuan'), 'sheerForce').values)
      .toEqual(metric(yixuanM0, 'sheerForce').values)
    expect(metric(agent(m2, 'yixuan'), 'sheerDmgBonus').values.fully).toBe(25)

    const yixuanM3 = agent(m3, 'yixuan')
    const yixuanM5 = agent(m5, 'yixuan')
    expect(metric(yixuanM3, 'sheerForce').values.initial)
      .toBe(metric(yixuanM0, 'sheerForce').values.initial)
    expect(metric(yixuanM3, 'sheerForce').values.combat)
      .toBe(metric(yixuanM0, 'sheerForce').values.combat)
    expect(metric(yixuanM3, 'sheerForce').values.fully).toBeCloseTo(3409.5789)
    expect(metric(yixuanM5, 'sheerForce').values.fully).toBeCloseTo(3452.9731)
    expect(metric(agent(m4, 'yixuan'), 'sheerForce').values)
      .toEqual(metric(yixuanM3, 'sheerForce').values)
    expect(metric(agent(m6, 'yixuan'), 'sheerForce').values)
      .toEqual(metric(yixuanM5, 'sheerForce').values)

    const gauge0 = metric(agent(m0, 'lucia'), 'maxHp').gauge!
    const gauge3 = metric(agent(m3, 'lucia'), 'maxHp').gauge!
    const gauge5 = metric(agent(m5, 'lucia'), 'maxHp').gauge!
    expect(gauge0).toMatchObject({
      current: 21697.1,
      cap: 24000,
      outputCap: 900,
      source: { label: 'EX Special Attack', locus: 'ex-special' },
    })
    expect(gauge0.outputValue).toBeCloseTo(814.7927)
    expect(gauge3).toMatchObject({
      cap: 24000,
      outputCap: 948,
      source: {
        label: 'EX Special Attack',
        detail: 'M3 tier',
        locus: 'mindscape',
      },
    })
    expect(gauge3.outputValue).toBeCloseTo(858.1869)
    expect(gauge5).toMatchObject({
      cap: 24000,
      outputCap: 996,
      source: {
        label: 'EX Special Attack',
        detail: 'M5 tier',
        locus: 'mindscape',
      },
    })
    expect(gauge5.outputValue).toBeCloseTo(901.5811)
    expect(metric(yixuanM5, 'sheerDmgBonus').breakdown.fully)
      .toContainEqual(expect.objectContaining({
        label: 'Mindscape',
        detail: 'M2 \u00B7 Darkbreaker + Wellspring',
        amount: 15,
        ownerAgentId: 'lucia',
      }))
  })

  it('clamps Lucia Darkbreaker output to completed skill-tier caps', () => {
    const prepared = setSubstat(createPreparedState(), 'lucia', 'hpPct', 12)

    for (const [mindscape, outputCap] of [
      [0, 900],
      [3, 948],
      [5, 996],
    ] as const) {
      const result = calculateParty(withMindscape(prepared, 'lucia', mindscape))!
      const gauge = metric(agent(result, 'lucia'), 'maxHp').gauge!
      expect(gauge.current).toBeGreaterThanOrEqual(24000)
      expect(gauge.outputValue).toBe(outputCap)
      expect(gauge.outputCap).toBe(outputCap)
    }
  })
})
