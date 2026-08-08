import { describe, expect, it } from 'vitest'
import { calculateParty } from './calculate'
import { createPreparedState, isCompleteWorkbench, type Mindscape } from './state'
import {
  agent,
  metric,
  selectEngine,
  selectDisc,
  selectMain,
  setSubstat,
  withMindscape,
} from './calculate.test-support'


describe('calculateParty: dialyn', () => {
  it('keeps Dialyn Slot 5 complete without creating a Party Result consequence', () => {
    const prepared = createPreparedState()
    const penRatio = selectMain(prepared, 'dialyn', 'slot5', 'penRatio')

    expect(isCompleteWorkbench(penRatio)).toBe(true)
    expect(calculateParty(penRatio)).toEqual(calculateParty(prepared))
  })

  it('recalculates Dialyn Slot 6 Impact as an initial percentage input', () => {
    const result = calculateParty(selectMain(
      createPreparedState(),
      'dialyn',
      'slot6',
      'impact',
    ))!
    const dialyn = agent(result, 'dialyn')

    expect(metric(dialyn, 'impact').values.initial).toBeCloseTo(129.8)
    expect(metric(dialyn, 'impact').values.combat).toBeCloseTo(180.6)
    expect(metric(dialyn, 'impact').values.fully).toBeCloseTo(180.6)
    expect(metric(dialyn, 'impact').breakdown.initial).toContainEqual(
      expect.objectContaining({
        label: 'Drive Disc \u00B7 Slot 6',
        amount: expect.closeTo(19.8),
        display: { value: 18, unit: '%', decimals: 0 },
      }),
    )
  })

  it('distinguishes remaining Dialyn W-Engine operations and the two-piece tradeoff', () => {
    const prepared = createPreparedState()

    const hellfire = agent(calculateParty(selectEngine(
      prepared,
      'dialyn',
      'hellfireGears',
    ))!, 'dialyn')
    expect(metric(hellfire, 'critRate').values.initial).toBeCloseTo(51.4)
    expect(metric(hellfire, 'impact').values.initial).toBeCloseTo(129.8)
    expect(metric(hellfire, 'impact').values.combat).toBeCloseTo(132.6)
    expect(metric(hellfire, 'impact').values.fully).toBeCloseTo(158.56)
    const hellfireImpact = metric(hellfire, 'impact').breakdown.fully.find(
      ({ label }) => label === 'Hellfire Gears',
    )!
    expect(hellfireImpact).toMatchObject({
      detail: 'W1',
      display: { value: 20, unit: '%', decimals: 0 },
    })
    expect(hellfireImpact.amount).toBeCloseTo(25.96)

    const steam = agent(calculateParty(selectEngine(
      prepared,
      'dialyn',
      'steamOven',
    ))!, 'dialyn')
    expect(metric(steam, 'energyRegen').values.initial).toBeCloseTo(2.52)
    expect(metric(steam, 'impact').values.fully).toBeCloseTo(140.96)
    const steamImpactContribution = metric(steam, 'impact').breakdown.fully[0]
    expect(steamImpactContribution).toMatchObject({
      label: 'Steam Oven',
      detail: 'W5',
      display: { value: 25.6, unit: '%', decimals: 1 },
    })
    expect(steamImpactContribution.amount).toBeCloseTo(28.16)

    const swing = agent(calculateParty(selectDisc(
      prepared,
      'dialyn',
      'twoPiece',
      'swingJazz',
    ))!, 'dialyn')
    expect(metric(swing, 'critRate').values.initial).toBeCloseTo(67.4)
    expect(metric(swing, 'impact').values.combat).toBeCloseTo(144.8)
    expect(metric(swing, 'energyRegen').values.combat).toBeCloseTo(3.66)
  })

  it('keeps Energy Regen percentage sources separate from later per-second operations', () => {
    const dialyn = agent(calculateParty(selectDisc(
      createPreparedState(),
      'dialyn',
      'twoPiece',
      'swingJazz',
    ))!, 'dialyn')
    const dialynEnergy = metric(dialyn, 'energyRegen')

    expect(dialynEnergy.values).toEqual({ initial: 2.16, combat: 3.66, fully: 3.66 })
    expect(dialynEnergy.breakdown.initial).toContainEqual(expect.objectContaining({
      label: 'Swing Jazz or Moonlight Lullaby',
      detail: '2-piece',
      display: { value: 20, unit: '%', decimals: 0 },
    }))
    expect(dialynEnergy.breakdown.combat).toContainEqual(expect.objectContaining({
      label: 'Yesterday Calls',
      detail: 'W1',
      display: { value: 1.5, unit: '/s', decimals: 2 },
    }))
    expect(dialynEnergy.breakdown.fully).toEqual([])

    const lucia = agent(calculateParty(selectEngine(
      createPreparedState(),
      'lucia',
      'thoughtbop',
    ))!, 'lucia')
    const luciaEnergy = metric(lucia, 'energyRegen')
    expect(luciaEnergy.values.initial).toBeCloseTo(2.34)
    expect(luciaEnergy.values.combat).toBeCloseTo(2.94)
    expect(luciaEnergy.values.fully).toBeCloseTo(2.94)
    expect(luciaEnergy.breakdown.initial).toContainEqual(expect.objectContaining({
      label: 'Thoughtbop',
      detail: 'W1',
      display: { value: 60, unit: '%', decimals: 0 },
    }))
    expect(luciaEnergy.breakdown.combat).toContainEqual(expect.objectContaining({
      label: 'Thoughtbop',
      detail: 'W1',
      display: { value: 0.6, unit: '/s', decimals: 2 },
    }))
  })

  it('keeps King of the Summit conditional CRIT DMG separate from its Setup total', () => {
    let belowThreshold = selectEngine(createPreparedState(), 'dialyn', 'hellfireGears')
    belowThreshold = selectDisc(belowThreshold, 'dialyn', 'twoPiece', 'swingJazz')
    const below = agent(calculateParty(belowThreshold)!, 'yixuan')

    expect(metric(below, 'critDmg').breakdown.fully).toContainEqual(
      expect.objectContaining({
        label: 'King of the Summit',
        detail: '4-piece',
        amount: 15,
        ownerAgentId: 'dialyn',
      }),
    )

    const atThreshold = setSubstat(belowThreshold, 'dialyn', 'critRate', 3)
    const at = agent(calculateParty(atThreshold)!, 'yixuan')
    expect(metric(at, 'critDmg').breakdown.fully).toContainEqual(
      expect.objectContaining({
        label: 'King of the Summit',
        detail: '4-piece',
        amount: 30,
        ownerAgentId: 'dialyn',
      }),
    )
  })

  it('uses capped Dialyn Initial CRIT for Impact, King, and later party CRIT', () => {
    let state = setSubstat(createPreparedState(), 'dialyn', 'critRate', 36)
    state = selectEngine(state, 'lucia', 'unfetteredGameBall')
    const result = calculateParty(state)!
    const dialynCritRate = metric(agent(result, 'dialyn'), 'critRate')

    expect(dialynCritRate.values).toEqual({ initial: 100, combat: 100, fully: 100 })
    expect(dialynCritRate.gauge).toMatchObject({
      current: 100,
      outputValue: 100,
    })
    const initialCapAdjustment = dialynCritRate.breakdown.initial.find(
      ({ label }) => label === 'Displayed CRIT Rate cap',
    )!
    expect(initialCapAdjustment).toMatchObject({
      ownerAgentId: 'dialyn',
      locus: 'calculation',
    })
    expect(initialCapAdjustment.amount).toBeCloseTo(-61.8)
    expect(dialynCritRate.breakdown.fully).toEqual([
      expect.objectContaining({
        label: 'Unfettered Game Ball',
        detail: 'W5',
        ownerAgentId: 'lucia',
        amount: 20,
      }),
      expect.objectContaining({
        label: 'Displayed CRIT Rate cap',
        ownerAgentId: 'dialyn',
        locus: 'calculation',
        amount: -20,
      }),
    ])
    expect(metric(agent(result, 'yixuan'), 'critDmg').breakdown.fully)
      .toContainEqual(expect.objectContaining({
        label: 'King of the Summit',
        amount: 30,
        ownerAgentId: 'dialyn',
      }))
  })

  it('applies Dialyn M2 only to the current Yixuan recipient', () => {
    const prepared = createPreparedState()
    const m1 = calculateParty(withMindscape(prepared, 'dialyn', 1))!
    const m2 = calculateParty(withMindscape(prepared, 'dialyn', 2))!
    const yixuanM1 = agent(m1, 'yixuan')
    const yixuanM2 = agent(m2, 'yixuan')

    expect(metric(yixuanM2, 'dmgBonus').values.fully
      - metric(yixuanM1, 'dmgBonus').values.fully).toBeCloseTo(15)
    expect(metric(yixuanM2, 'stunDmgMultiplier').values.fully).toBe(50)
    expect(metric(yixuanM2, 'dmgBonus').breakdown.fully)
      .toContainEqual(expect.objectContaining({
        label: 'Mindscape',
        detail: 'M2 \u00B7 against Malicious Complaint',
        amount: 15,
        ownerAgentId: 'dialyn',
      }))
    expect(metric(yixuanM2, 'stunDmgMultiplier').breakdown.fully)
      .toContainEqual(expect.objectContaining({
        label: 'Mindscape',
        detail: 'M2',
        amount: 20,
        ownerAgentId: 'dialyn',
      }))
    expect(agent(m2, 'dialyn').metrics).toEqual(agent(m1, 'dialyn').metrics)

    for (const mindscape of [3, 4, 5, 6] as Mindscape[]) {
      const current = agent(calculateParty(
        withMindscape(prepared, 'dialyn', mindscape),
      )!, 'yixuan')
      expect(metric(current, 'dmgBonus').values.fully)
        .toBe(metric(yixuanM2, 'dmgBonus').values.fully)
    }
  })
})
