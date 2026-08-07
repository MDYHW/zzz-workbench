import { describe, expect, it } from 'vitest'
import { calculateParty } from './calculate'
import { createPreparedState, type Mindscape } from './state'
import {
  agent,
  metric,
  action,
  sourceLabels,
  selectEngine,
  setRefinement,
  selectDisc,
  selectMain,
  setSubstat,
  withMindscape,
} from './calculate.test-support'


describe('calculateParty: yixuan', () => {
  it('keeps a capped Combat CRIT source at its earliest surface without duplicating it', () => {
    const state = setSubstat(createPreparedState(), 'yixuan', 'critRate', 10)
    const yixuan = agent(calculateParty(state)!, 'yixuan')
    const critRate = metric(yixuan, 'critRate')

    expect(critRate.values.initial).toBeCloseTo(75.4)
    expect(critRate.values.combat).toBeCloseTo(95.4)
    expect(critRate.values.fully).toBe(100)
    expect(critRate.breakdown.combat).toContainEqual(expect.objectContaining({
      label: 'Qingming Birdcage',
      detail: 'W1',
      amount: 20,
      ownerAgentId: 'yixuan',
      locus: 'w-engine',
    }))
    const fullyCapAdjustment = critRate.breakdown.fully.find(
      ({ label }) => label === 'Displayed CRIT Rate cap',
    )!
    expect(fullyCapAdjustment).toMatchObject({
      ownerAgentId: 'yixuan',
      locus: 'calculation',
    })
    expect(fullyCapAdjustment.amount).toBeCloseTo(-7.4)
    expect(critRate.breakdown.fully).not.toContainEqual(expect.objectContaining({
      label: 'Qingming Birdcage',
    }))
    expect(critRate.breakdown.fully).toContainEqual(expect.objectContaining({
      label: 'Yunkui Tales',
      amount: 12,
    }))
    expect(critRate.breakdown.fully.reduce((total, item) => total + item.amount, 0))
      .toBeCloseTo(critRate.values.fully - critRate.values.combat)
  })

  it('recalculates every retained Yixuan W-Engine package without changing downstream candidates', () => {
    const prepared = createPreparedState()

    const cauldron = agent(calculateParty(selectEngine(
      prepared,
      'yixuan',
      'cauldron',
    ))!, 'yixuan')
    expect(metric(cauldron, 'maxHp').values.initial).toBeCloseTo(16015.45)
    expect(metric(cauldron, 'critRate').values.fully).toBeCloseTo(73.8)
    expect(metric(cauldron, 'dmgBonus').values.fully).toBeCloseTo(152.2)

    const radiowave = agent(calculateParty(selectEngine(
      prepared,
      'yixuan',
      'radiowave',
    ))!, 'yixuan')
    expect(metric(radiowave, 'sheerForce').values.fully).toBeCloseTo(3655.2467)
    expect(metric(radiowave, 'sheerForce').breakdown.fully).toContainEqual(
      expect.objectContaining({
        label: 'Radiowave Journey',
        detail: 'W5',
        amount: 384,
        locus: 'w-engine',
      }),
    )

    const puzzle = agent(calculateParty(selectEngine(
      prepared,
      'yixuan',
      'puzzleSphere',
    ))!, 'yixuan')
    expect(metric(puzzle, 'atk').values.initial).toBeCloseTo(2148.5)
    expect(metric(puzzle, 'atk').breakdown.initial).toContainEqual(
      expect.objectContaining({
        label: 'Puzzle Sphere',
        detail: 'W5',
        display: { value: 25, unit: '%', decimals: 0 },
      }),
    )
    expect(metric(puzzle, 'critDmg').values.fully).toBeCloseTo(205.6)
    expect(action(puzzle, 'exSpecialStunned').values.fully).toBeCloseTo(255)
  })

  it('uses editable refinement values and current refinement source identity', () => {
    const changed = setRefinement(createPreparedState(), 'yixuan', 2)
    const yixuan = agent(calculateParty(changed)!, 'yixuan')

    expect(metric(yixuan, 'critRate').values.combat).toBeCloseTo(74.4)
    expect(metric(yixuan, 'dmgBonus').values.combat).toBeCloseTo(48.4)
    expect(metric(yixuan, 'critRate').breakdown.combat).toContainEqual(
      expect.objectContaining({ label: 'Qingming Birdcage', detail: 'W2', amount: 23 }),
    )
    expect(action(yixuan, 'engineSheerActions').values.combat).toBeCloseTo(23)
  })

  it('recalculates Yixuan Disc and main-stat alternatives as direct setup edits', () => {
    let state = createPreparedState()
    state = selectDisc(state, 'yixuan', 'twoPiece', 'branchAndBlade')
    state = selectMain(state, 'yixuan', 'slot4', 'critDmg')
    state = selectMain(state, 'yixuan', 'slot5', 'hpPct')
    const yixuan = agent(calculateParty(state)!, 'yixuan')

    expect(metric(yixuan, 'critRate').values.initial).toBeCloseTo(19.4)
    expect(metric(yixuan, 'critDmg').values.initial).toBeCloseTo(114)
    expect(metric(yixuan, 'maxHp').values.initial).toBeCloseTo(18946)
    expect(metric(yixuan, 'dmgBonus').values.initial).toBe(0)
    expect(sourceLabels(metric(yixuan, 'critDmg').breakdown.initial))
      .toContain('Branch & Blade Song \u00B7 2-piece')
    expect(sourceLabels(metric(yixuan, 'dmgBonus').breakdown.initial))
      .not.toContain('Drive Disc \u00B7 Slot 5')
  })

  it('applies Yixuan Mindscapes cumulatively to exact current Result consumers', () => {
    const prepared = createPreparedState()
    const at = (mindscape: Mindscape) => calculateParty(
      withMindscape(prepared, 'yixuan', mindscape),
    )!
    const m0 = agent(at(0), 'yixuan')
    const m1 = agent(at(1), 'yixuan')
    const m2Result = at(2)
    const m3 = agent(at(3), 'yixuan')
    const m4 = agent(at(4), 'yixuan')
    const m5 = agent(at(5), 'yixuan')
    const m6 = agent(at(6), 'yixuan')

    expect(metric(m1, 'critRate').values.initial)
      .toBe(metric(m0, 'critRate').values.initial)
    expect(metric(m1, 'critRate').values.combat
      - metric(m0, 'critRate').values.combat).toBeCloseTo(10)
    expect(metric(m1, 'critRate').values.fully
      - metric(m0, 'critRate').values.fully).toBeCloseTo(10)
    expect(sourceLabels(metric(m1, 'critRate').breakdown.combat))
      .toContain('Mindscape \u00B7 M1')

    const m2Operation = agent(m2Result, 'dialyn').operations[0]
    expect(agent(at(0), 'dialyn').operations).toHaveLength(1)
    expect(agent(m2Result, 'dialyn').operations).toHaveLength(1)
    expect(m2Operation).toMatchObject({
      id: 'stunDuration',
      value: 3,
      source: {
        label: 'Mindscape',
        detail: 'M2',
        ownerAgentId: 'yixuan',
        locus: 'mindscape',
      },
    })
    expect(m3.actionModifiers.find(({ id }) => id === 'mindscapeCloudShaper'))
      .toBeUndefined()
    expect(action(m4, 'mindscapeCloudShaper').values.fully).toBeCloseTo(299)
    expect(action(m4, 'mindscapeCloudShaper').breakdown.fully)
      .toContainEqual(expect.objectContaining({
        label: 'Mindscape',
        detail: 'M4 \u00B7 30% x 2 stacks',
        amount: 60,
      }))
    expect(action(m5, 'mindscapeCloudShaper').values)
      .toEqual(action(m4, 'mindscapeCloudShaper').values)
    expect(action(m4, 'coreActions').values)
      .toEqual(action(m3, 'coreActions').values)
    expect(action(m4, 'exSpecialStunned').values)
      .toEqual(action(m3, 'exSpecialStunned').values)
    expect(metric(m6, 'sheerDmgBonus').values.fully).toBe(30)
    expect(metric(m6, 'sheerDmgBonus').breakdown.fully)
      .toContainEqual(expect.objectContaining({
        label: 'Mindscape',
        detail: 'M6 \u00B7 during Meditation',
        amount: 20,
      }))
  })

  it('adds Yixuan M2 Ether RES Ignore only to EX Special Attack and Ultimate', () => {
    const prepared = withMindscape(withMindscape(createPreparedState(), 'dialyn', 1), 'lucia', 1)
    const m1 = agent(calculateParty(withMindscape(prepared, 'yixuan', 1))!, 'yixuan')
    const m2 = agent(calculateParty(withMindscape(prepared, 'yixuan', 2))!, 'yixuan')

    expect(m1.actionModifiers.find(({ id }) => id === 'mindscapeEtherResIgnore')).toBeUndefined()
    expect(action(m2, 'mindscapeEtherResIgnore')).toMatchObject({
      actions: ['EX Special Attack', 'Ultimate'],
      metricId: 'resIgnore',
      values: { initial: 0, combat: 0, fully: 48 },
    })
    expect(action(m2, 'mindscapeEtherResIgnore').breakdown.fully).toContainEqual(
      expect.objectContaining({
        detail: 'M2 \u00b7 Ether RES Ignore', amount: 15, ownerAgentId: 'yixuan',
      }),
    )
  })
})
