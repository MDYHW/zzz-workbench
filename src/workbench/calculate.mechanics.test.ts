import { describe, expect, it } from 'vitest'
import { calculateParty } from './calculate'
import type { AgentId } from './content'
import { createPreparedState, isCompleteWorkbench } from './state'
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
  withSetup,
} from './calculate.test-support'

describe('calculateParty mechanisms', () => {
  it('gates Result on every required setup selection', () => {
    const prepared = createPreparedState()
    const incomplete = [
      withSetup(prepared, 'yixuan', (setup) => ({ ...setup, engineId: null })),
      withSetup(prepared, 'yixuan', (setup) => ({ ...setup, refinement: null })),
      withSetup(prepared, 'dialyn', (setup) => ({ ...setup, fourPieceId: null })),
      withSetup(prepared, 'lucia', (setup) => ({ ...setup, twoPieceId: null })),
      withSetup(prepared, 'dialyn', (setup) => ({
        ...setup,
        mains: { ...setup.mains, slot6: null },
      })),
      withSetup(prepared, 'lucia', (setup) => ({
        ...setup,
        substats: { ...setup.substats, hpFlat: Number.NaN },
      })),
    ]

    for (const state of incomplete) expect(calculateParty(state)).toBeNull()
  })

  it('uses applied slot order only for output and keeps provider composition order-independent', () => {
    const baseline = calculateParty(createPreparedState())!
    const reordered = calculateParty(
      createPreparedState({}, ['lucia', 'dialyn', 'yixuan'], 2),
    )!

    expect(reordered.agents.map(({ agentId }) => agentId))
      .toEqual(['lucia', 'dialyn', 'yixuan'])
    for (const agentId of ['yixuan', 'dialyn', 'lucia'] as AgentId[]) {
      expect(agent(reordered, agentId)).toEqual(agent(baseline, agentId))
    }
  })

  it('places advanced stats in Initial and active passives on their earliest later surface', () => {
    const result = calculateParty(createPreparedState())!
    const yixuan = agent(result, 'yixuan')
    const dialyn = agent(result, 'dialyn')

    expect(sourceLabels(metric(yixuan, 'maxHp').breakdown.initial))
      .toContain('Qingming Birdcage · W1')
    expect(sourceLabels(metric(yixuan, 'critRate').breakdown.initial))
      .not.toContain('Qingming Birdcage · W1')
    expect(metric(yixuan, 'critRate').breakdown.combat).toContainEqual(
      expect.objectContaining({ label: 'Qingming Birdcage', detail: 'W1', amount: 20 }),
    )
    expect(sourceLabels(metric(dialyn, 'critRate').breakdown.initial))
      .toContain('Yesterday Calls · W1')
    expect(sourceLabels(metric(dialyn, 'energyRegen').breakdown.initial))
      .not.toContain('Yesterday Calls · W1')
    expect(metric(dialyn, 'energyRegen').breakdown.combat).toContainEqual(
      expect.objectContaining({ label: 'Yesterday Calls', detail: 'W1', amount: 1.5 }),
    )
  })

  it('replaces source identity after an engine and refinement edit', () => {
    let state = selectEngine(createPreparedState(), 'dialyn', 'hellfireGears')
    state = setRefinement(state, 'dialyn', 3)
    const dialyn = agent(calculateParty(state)!, 'dialyn')
    const serialized = JSON.stringify(dialyn)

    expect(serialized).toContain('Hellfire Gears')
    expect(serialized).toContain('W3')
    expect(serialized).not.toContain('Yesterday Calls')
  })

  it('projects offered substats through the same Initial-input mechanism', () => {
    let state = createPreparedState()
    state = setSubstat(state, 'yixuan', 'hpPct', 1)
    state = setSubstat(state, 'dialyn', 'critRate', 1)
    state = setSubstat(state, 'lucia', 'hpPct', 1)
    state = setSubstat(state, 'lucia', 'hpFlat', 1)
    const result = calculateParty(state)!

    expect(metric(agent(result, 'yixuan'), 'maxHp').values.initial).toBeCloseTo(16685.29)
    expect(metric(agent(result, 'dialyn'), 'critRate').values.initial).toBeCloseTo(77.8)
    expect(metric(agent(result, 'lucia'), 'maxHp').values.initial).toBeCloseTo(22063.41)
  })

  it('projects an applicable main stat but permits complete inputs with no current projector', () => {
    const prepared = createPreparedState()
    const impactState = selectMain(prepared, 'dialyn', 'slot6', 'impact')
    const impact = metric(agent(calculateParty(impactState)!, 'dialyn'), 'impact')
    expect(impact.values.initial).toBeCloseTo(129.8)
    expect(impact.breakdown.initial).toContainEqual(expect.objectContaining({
      label: 'Drive Disc · Slot 6',
      display: { value: 18, unit: '%', decimals: 0 },
    }))

    const penState = selectMain(prepared, 'dialyn', 'slot5', 'penRatio')
    expect(isCompleteWorkbench(penState)).toBe(true)
    expect(calculateParty(penState)).toEqual(calculateParty(prepared))
  })

  it('caps a displayed stat once and reconciles its phase breakdown', () => {
    const state = setSubstat(createPreparedState(), 'yixuan', 'critRate', 10)
    const critRate = metric(agent(calculateParty(state)!, 'yixuan'), 'critRate')

    expect(critRate.values).toEqual({ initial: 75.4, combat: 95.4, fully: 100 })
    expect(critRate.breakdown.fully).not.toContainEqual(
      expect.objectContaining({ label: 'Qingming Birdcage' }),
    )
    const adjustment = critRate.breakdown.fully.find(
      ({ label }) => label === 'Displayed CRIT Rate cap',
    )!
    expect(adjustment).toMatchObject({ locus: 'calculation', amount: expect.closeTo(-7.4) })
    expect(critRate.breakdown.fully.reduce((total, item) => total + item.amount, 0))
      .toBeCloseTo(critRate.values.fully - critRate.values.combat)
  })

  it('keeps percentage Energy Regen and automatic per-second recovery as distinct atoms', () => {
    const dialyn = agent(calculateParty(selectDisc(
      createPreparedState(),
      'dialyn',
      'twoPiece',
      'swingJazz',
    ))!, 'dialyn')
    const energy = metric(dialyn, 'energyRegen')

    expect(energy.values).toEqual({ initial: 2.16, combat: 3.66, fully: 3.66 })
    expect(energy.breakdown.initial).toContainEqual(expect.objectContaining({
      label: 'Swing Jazz',
      display: { value: 20, unit: '%', decimals: 0 },
    }))
    expect(energy.breakdown.combat).toContainEqual(expect.objectContaining({
      label: 'Yesterday Calls',
      display: { value: 1.5, unit: '/s', decimals: 2 },
    }))
  })

  it('resolves Fully percentage clauses from authoritative Initial values', () => {
    const result = calculateParty(
      createPreparedState({}, ['anbySoldier0', 'trigger', 'astraYao'], 0),
    )!
    const anbyAtk = metric(agent(result, 'anbySoldier0'), 'atk')
    const triggerImpact = metric(agent(result, 'trigger'), 'impact')

    expect(anbyAtk.values.initial).toBeCloseTo(2450.6)
    expect(anbyAtk.values.fully - anbyAtk.values.initial).toBeCloseTo(1494.072)
    expect(triggerImpact.values.initial).toBeCloseTo(162.44)
    expect(triggerImpact.values.fully).toBeCloseTo(194.928)
  })

  it('runs one derived phase after delivery without feeding it back into its provider', () => {
    const forward = calculateParty(
      createPreparedState({}, ['anbySoldier0', 'trigger', 'astraYao'], 0),
    )!
    const permuted = calculateParty(
      createPreparedState({}, ['astraYao', 'anbySoldier0', 'trigger'], 1),
    )!
    const normalized = (result: typeof forward) => [...result.agents]
      .sort((left, right) => left.agentId.localeCompare(right.agentId))

    expect(normalized(permuted)).toEqual(normalized(forward))
    const anby = agent(forward, 'anbySoldier0')
    expect(metric(anby, 'critDmg').breakdown.fully).not.toContainEqual(
      expect.objectContaining({ detail: '35% of Fully Enabled CRIT DMG' }),
    )
    expect(action(anby, 'anbyAftershockCritDmg').breakdown.fully
      .filter(({ detail }) => detail === '35% of Fully Enabled CRIT DMG'))
      .toHaveLength(1)
  })

  it('keeps equal non-stacking origins visible while applying one category value', () => {
    let state = createPreparedState({}, ['yixuan', 'trigger', 'astraYao'], 0)
    state = withSetup(state, 'trigger', (setup) => ({ ...setup, fourPieceId: 'astralVoice' }))
    state = withSetup(state, 'astraYao', (setup) => ({ ...setup, fourPieceId: 'astralVoice' }))
    const rows = metric(agent(calculateParty(state)!, 'yixuan'), 'dmgBonus')
      .breakdown.fully.filter(({ label }) => label === 'Astral Voice')

    expect(rows).toHaveLength(2)
    expect(rows.map(({ amount }) => amount)).toEqual([24, 0])
    expect(rows.map(({ notation }) => notation))
      .toEqual([undefined, 'equal-nonstack-origin'])
  })

  it('projects a selected four-piece set own two-piece effect exactly once', () => {
    const baseline = agent(calculateParty(
      createPreparedState({}, ['anbySoldier0', 'trigger', 'astraYao'], 0),
    )!, 'trigger')
    expect(metric(baseline, 'dazeBonus').breakdown.initial
      .filter(({ label, detail }) => label === 'King of the Summit' && detail === '2-piece'))
      .toHaveLength(1)

    const changed = selectDisc(
      createPreparedState({}, ['anbySoldier0', 'trigger', 'astraYao'], 0),
      'trigger',
      'fourPiece',
      'shockstar',
    )
    expect(metric(agent(calculateParty(changed)!, 'trigger'), 'impact').breakdown.initial
      .filter(({ label, detail }) => label === 'Shockstar Disco' && detail === '2-piece'))
      .toHaveLength(1)
  })

  it('omits fixed base values from source disclosure', () => {
    const result = calculateParty(createPreparedState())!
    const serialized = JSON.stringify(result)

    expect(metric(agent(result, 'yixuan'), 'atk').breakdown.initial).toEqual([])
    expect(serialized).not.toMatch(/Agent base|Drive Disc · Slot [123]|Base ATK/i)
  })
})
