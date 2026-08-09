import { describe, expect, it } from 'vitest'
import { calculateParty } from './calculate'
import { createPreparedState, type WorkbenchState } from './state'
import type { AgentId } from './content'
import {
  agent,
  metric,
  sourceLabels,
  selectEngine,
  setRefinement,
  setSubstat,
  withMindscape,
  withSetup,
} from './calculate.test-support'


describe('calculateParty: party', () => {
  it('preserves the authored full-pool baseline and surface meanings', () => {
    const result = calculateParty(createPreparedState())!
    const yixuan = agent(result, 'yixuan')
    const dialyn = agent(result, 'dialyn')
    const lucia = agent(result, 'lucia')

    expect(metric(yixuan, 'maxHp').values).toEqual({
      initial: 16434.1,
      combat: 16434.1,
      fully: 19720.92,
    })
    expect(metric(yixuan, 'atk').values).toEqual({
      initial: 1931,
      combat: 1931,
      fully: 1931,
    })
    expect(metric(yixuan, 'sheerForce').values.initial).toBeCloseTo(2222.71)
    expect(metric(yixuan, 'sheerForce').values.fully).toBeCloseTo(3366.1847)
    expect(metric(yixuan, 'critRate').values).toEqual({
      initial: 51.4,
      combat: 71.4,
      fully: 83.4,
    })
    expect(metric(yixuan, 'critDmg').values).toEqual({
      initial: 50,
      combat: 50,
      fully: 180,
    })
    expect(metric(yixuan, 'dmgBonus').values).toEqual({
      initial: 30,
      combat: 46,
      fully: 149,
    })
    expect(metric(yixuan, 'sheerDmgBonus').values).toEqual({
      initial: 0,
      combat: 0,
      fully: 10,
    })

    expect(metric(dialyn, 'critRate').values.initial).toBeCloseTo(75.4)
    expect(metric(dialyn, 'impact').values).toEqual({
      initial: 110,
      combat: 160.8,
      fully: 160.8,
    })
    expect(metric(dialyn, 'energyRegen').values).toEqual({
      initial: 1.92,
      combat: 3.42,
      fully: 3.42,
    })
    expect(metric(dialyn, 'dazeBonus').values).toEqual({
      initial: 6,
      combat: 6,
      fully: 33,
    })

    expect(metric(lucia, 'maxHp').values.initial).toBeCloseTo(21697.1)
    expect(metric(lucia, 'energyRegen').values).toEqual({
      initial: 1.56,
      combat: 1.96,
      fully: 1.96,
    })
  })

  it('uses applied slot order for output without changing current per-Agent Results', () => {
    const baseline = calculateParty(createPreparedState())!
    const reordered = calculateParty(createPreparedState({}, ['lucia', 'dialyn', 'yixuan'], 2))!

    expect(reordered.agents.map(({ agentId }) => agentId)).toEqual(['lucia', 'dialyn', 'yixuan'])
    for (const agentId of ['yixuan', 'dialyn', 'lucia'] as AgentId[]) {
      expect(agent(reordered, agentId)).toEqual(agent(baseline, agentId))
    }
    expect(sourceLabels(metric(agent(reordered, 'yixuan'), 'critDmg').breakdown.fully))
      .toEqual(sourceLabels(metric(agent(baseline, 'yixuan'), 'critDmg').breakdown.fully))
  })

  it('preserves the first-vertical Fully CRIT DMG source order', () => {
    const result = calculateParty(createPreparedState())!
    expect(sourceLabels(metric(agent(result, 'yixuan'), 'critDmg').breakdown.fully)).toEqual([
      'Additional Ability',
      'Yesterday Calls · W1',
      'Additional Ability',
      'King of the Summit · 4-piece',
    ])
  })

  it('orders Cauldron Fully DMG sources by the authored cross-provider sequence', () => {
    const sourceOrder = (state: WorkbenchState) => sourceLabels(metric(
      agent(calculateParty(selectEngine(state, 'yixuan', 'cauldron'))!, 'yixuan'),
      'dmgBonus',
    ).breakdown.fully)

    const expected = [
      'Additional Ability',
      'Core Passive',
      'Moonlight Lullaby \u00B7 4-piece',
      'Dreamlit Hearth \u00B7 W1',
      'Cauldron of Clarity \u00B7 W5',
    ]
    expect(sourceOrder(createPreparedState())).toEqual(expected)
    expect(sourceOrder(createPreparedState({}, ['lucia', 'dialyn', 'yixuan'], 2)))
      .toEqual(expected)
  })

  it('delivers Dialyn M2 to the configured focus slot rather than a named Agent position', () => {
    const focusedYixuan = createPreparedState({}, ['dialyn', 'lucia', 'yixuan'], 2)
    const m1 = calculateParty(withMindscape(focusedYixuan, 'dialyn', 1))!
    const m2 = calculateParty(withMindscape(focusedYixuan, 'dialyn', 2))!

    expect(metric(agent(m2, 'yixuan'), 'dmgBonus').values.fully
      - metric(agent(m1, 'yixuan'), 'dmgBonus').values.fully).toBeCloseTo(15)
    expect(metric(agent(m2, 'lucia'), 'maxHp').values)
      .toEqual(metric(agent(m1, 'lucia'), 'maxHp').values)
  })

  it('keeps advanced stats in Initial and W-Engine passives after Initial', () => {
    const result = calculateParty(createPreparedState())!
    const yixuan = agent(result, 'yixuan')
    const dialyn = agent(result, 'dialyn')
    const lucia = agent(result, 'lucia')

    expect(sourceLabels(metric(yixuan, 'maxHp').breakdown.initial))
      .toContain('Qingming Birdcage \u00B7 W1')
    expect(sourceLabels(metric(yixuan, 'critRate').breakdown.initial))
      .not.toContain('Qingming Birdcage \u00B7 W1')
    expect(metric(yixuan, 'critRate').breakdown.combat).toContainEqual(
      expect.objectContaining({ label: 'Qingming Birdcage', detail: 'W1', amount: 20 }),
    )

    expect(sourceLabels(metric(dialyn, 'critRate').breakdown.initial))
      .toContain('Yesterday Calls \u00B7 W1')
    expect(sourceLabels(metric(dialyn, 'energyRegen').breakdown.initial))
      .not.toContain('Yesterday Calls \u00B7 W1')
    expect(metric(dialyn, 'energyRegen').breakdown.combat).toContainEqual(
      expect.objectContaining({ label: 'Yesterday Calls', detail: 'W1', amount: 1.5 }),
    )

    expect(sourceLabels(metric(lucia, 'maxHp').breakdown.initial))
      .toContain('Dreamlit Hearth \u00B7 W1')
    expect(sourceLabels(metric(lucia, 'energyRegen').breakdown.initial))
      .not.toContain('Dreamlit Hearth \u00B7 W1')
  })

  it('keeps fixed Base ATK and fixed Disc values out of displayed source rows', () => {
    const result = calculateParty(createPreparedState())!
    const serialized = JSON.stringify(result)

    expect(metric(agent(result, 'yixuan'), 'atk').breakdown.initial).toEqual([])
    expect(serialized).not.toMatch(/Agent base|Drive Disc \u00B7 Slot [123]|Base ATK/i)
    expect(metric(agent(result, 'lucia'), 'energyRegen').breakdown.initial)
      .toContainEqual(expect.objectContaining({
        label: 'Moonlight Lullaby',
        detail: '4-piece',
        display: { value: 20, unit: '%', decimals: 0 },
      }))
  })

  it('updates current source identity after equipment and refinement edits', () => {
    let state = selectEngine(createPreparedState(), 'dialyn', 'hellfireGears')
    state = setRefinement(state, 'dialyn', 3)
    const dialyn = agent(calculateParty(state)!, 'dialyn')
    const serialized = JSON.stringify(dialyn)

    expect(serialized).toContain('Hellfire Gears')
    expect(serialized).toContain('W3')
    expect(serialized).not.toContain('Yesterday Calls')
    expect(metric(dialyn, 'impact').breakdown.initial).toContainEqual(
      expect.objectContaining({
        label: 'Hellfire Gears',
        detail: 'W3',
        locus: 'w-engine',
      }),
    )
  })

  it("recalculates each Agent's offered substat inputs", () => {
    let state = createPreparedState()
    state = setSubstat(state, 'yixuan', 'hpPct', 1)
    state = setSubstat(state, 'dialyn', 'critRate', 1)
    state = setSubstat(state, 'lucia', 'hpPct', 1)
    state = setSubstat(state, 'lucia', 'hpFlat', 1)
    const result = calculateParty(state)!

    expect(metric(agent(result, 'yixuan'), 'maxHp').values.initial).toBeCloseTo(16685.29)
    expect(metric(agent(result, 'dialyn'), 'critRate').values.initial).toBeCloseTo(77.8)
    expect(metric(agent(result, 'lucia'), 'maxHp').values.initial).toBeCloseTo(22063.41)
    expect(sourceLabels(metric(agent(result, 'lucia'), 'maxHp').breakdown.initial))
      .toEqual(expect.arrayContaining([
        'Effective substat hits \u00B7 HP%',
        'Effective substat hits \u00B7 HP',
      ]))
  })

  it('applies Dialyn and Lucia M1 RES Ignore cumulatively to Yixuan', () => {
    const prepared = createPreparedState()
    const dialynM1 = agent(calculateParty(withMindscape(prepared, 'dialyn', 1))!, 'yixuan')
    const luciaM1 = agent(calculateParty(withMindscape(prepared, 'lucia', 1))!, 'yixuan')
    const bothM1 = agent(calculateParty(
      withMindscape(withMindscape(prepared, 'dialyn', 1), 'lucia', 1),
    )!, 'yixuan')

    expect(metric(agent(calculateParty(prepared)!, 'yixuan'), 'resIgnore').values)
      .toEqual({ initial: 0, combat: 0, fully: 0 })
    expect(metric(dialynM1, 'resIgnore').values.fully).toBe(15)
    expect(metric(luciaM1, 'resIgnore').values.fully).toBe(18)
    expect(metric(bothM1, 'resIgnore').values.fully).toBe(33)
    expect(metric(bothM1, 'resIgnore').breakdown.fully).toEqual(expect.arrayContaining([
      expect.objectContaining({
        detail: 'M1 \u00b7 Overwhelmingly Positive', amount: 15, ownerAgentId: 'dialyn',
      }),
      expect.objectContaining({
        detail: "M1 \u00b7 Dreamer's Nursery Rhyme", amount: 18, ownerAgentId: 'lucia',
      }),
    ]))
    expect(metric(agent(calculateParty(withMindscape(
      withMindscape(prepared, 'dialyn', 1), 'dialyn', 0,
    ))!, 'yixuan'), 'resIgnore').values.fully).toBe(0)
  })

  it('returns no Result when any required setup selection is incomplete', () => {
    const prepared = createPreparedState()
    const missingEngine = withSetup(prepared, 'yixuan', (setup) => ({ ...setup, engineId: null }))
    const missingMain = withSetup(prepared, 'dialyn', (setup) => ({
      ...setup, mains: { ...setup.mains, slot6: null },
    }))
    const missingRefinement = withSetup(prepared, 'yixuan', (setup) => ({ ...setup, refinement: null }))
    const missingFourPiece = withSetup(prepared, 'dialyn', (setup) => ({ ...setup, fourPieceId: null }))
    const missingTwoPiece = withSetup(prepared, 'lucia', (setup) => ({ ...setup, twoPieceId: null }))
    const missingCount = withSetup(prepared, 'lucia', (setup) => ({
      ...setup, substats: { ...setup.substats, hpFlat: Number.NaN },
    }))

    expect(calculateParty(missingEngine)).toBeNull()
    expect(calculateParty(missingRefinement)).toBeNull()
    expect(calculateParty(missingFourPiece)).toBeNull()
    expect(calculateParty(missingTwoPiece)).toBeNull()
    expect(calculateParty(missingMain)).toBeNull()
    expect(calculateParty(missingCount)).toBeNull()
  })
})
