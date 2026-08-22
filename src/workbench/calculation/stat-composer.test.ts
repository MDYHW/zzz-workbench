import { describe, expect, it } from 'vitest'
import {
  defineAgentBaseSource,
  defineEditableMainSource,
  defineEffectiveSubstatSource,
  defineFixedMainSource,
  defineWEngineBaseSource,
  defineWEngineSource,
} from '../content/source-definitions'
import { selectSource } from './source-instance'
import {
  composeAutomaticEnergyRecovery,
  composeStat,
  type StatAtom,
} from './stat-composer'

const anbyBase = selectSource(defineAgentBaseSource('anby', 'Anby base stats'), 'anby', 0)
const engineBase = selectSource(
  defineWEngineBaseSource('steamOven', 'Steam Oven Base ATK'),
  'anby',
  0,
  { kind: 'refinement', refinement: 5 },
)
const fixedMain = selectSource(defineFixedMainSource('slot2', 'atkFlat', 'Slot 2 ATK'), 'anby', 0)
const variableMain = selectSource(defineEditableMainSource('slot6', 'atkPct', 'Slot 6 ATK%'), 'anby', 0, {
  kind: 'main-stat', statId: 'atkPct',
})
const atkPercentageHits = selectSource(
  defineEffectiveSubstatSource(1, 'atkPct', 'ATK% effective substats'), 'anby', 0,
  { kind: 'effective-substat', position: 1, statId: 'atkPct', count: 2 },
)
const atkFlatHits = selectSource(
  defineEffectiveSubstatSource(2, 'atkFlat', 'ATK effective substats'), 'anby', 0,
  { kind: 'effective-substat', position: 2, statId: 'atkFlat', count: 3 },
)

describe('shared stat composer', () => {
  it('composes base, main stats, and supplied effective substats while hiding calculation-only inputs', () => {
    const stat = composeStat('atk', [
      { statId: 'atk', region: 'base', earliestSurface: 'initial', value: 800, source: anbyBase },
      { statId: 'atk', region: 'base', earliestSurface: 'initial', value: 475, source: engineBase },
      { statId: 'atk', region: 'flat', earliestSurface: 'initial', value: 316, source: fixedMain },
      { statId: 'atk', region: 'percentage', earliestSurface: 'initial', value: 30, source: variableMain },
      { statId: 'atk', region: 'percentage', earliestSurface: 'initial', value: 6, source: atkPercentageHits },
      { statId: 'atk', region: 'flat', earliestSurface: 'initial', value: 57, source: atkFlatHits },
    ])

    expect(stat.values).toEqual({ initial: 2107, combat: 2107, fully: 2107 })
    expect(stat.contributions.initial).toEqual(expect.arrayContaining([
      expect.objectContaining({
        rawValue: 475, derivedValue: 475, atom: expect.objectContaining({ source: engineBase }),
      }),
      expect.objectContaining({
        rawValue: 6, derivedValue: 76.5, atom: expect.objectContaining({ source: atkPercentageHits }),
      }),
    ]))
    expect(stat.disclosedContributions.initial.map(({ atom }) => atom.source))
      .toEqual([variableMain, atkPercentageHits, atkFlatHits])
  })

  it('uses Initial as the shared basis for later percentage and flat regions', () => {
    const visible = selectSource(defineWEngineSource('steamOven', 'Steam Oven'), 'anby', 0, {
      kind: 'refinement', refinement: 5,
    })
    const stat = composeStat('atk', [
      { statId: 'atk', region: 'base', earliestSurface: 'initial', value: 100, source: anbyBase },
      { statId: 'atk', region: 'percentage', earliestSurface: 'initial', value: 10, source: visible },
      { statId: 'atk', region: 'flat', earliestSurface: 'initial', value: 2, source: visible },
      { statId: 'atk', region: 'percentage', earliestSurface: 'combat', value: 20, source: visible },
      { statId: 'atk', region: 'flat', earliestSurface: 'combat', value: 10, source: visible },
      { statId: 'atk', region: 'percentage', earliestSurface: 'fully', value: 30, source: visible },
      { statId: 'atk', region: 'flat', earliestSurface: 'fully', value: 5, source: visible },
    ])

    expect(stat.values.initial).toBeCloseTo(112)
    expect(stat.values.combat).toBeCloseTo(144.4)
    expect(stat.values.fully).toBeCloseTo(183)
    expect(stat.contributions.combat[0].derivedValue).toBeCloseTo(22.4)
    expect(stat.contributions.combat[1].derivedValue).toBe(10)
    expect(stat.contributions.fully[0].derivedValue).toBeCloseTo(33.6)
    expect(stat.contributions.fully[1].derivedValue).toBe(5)
  })

  it('uses the same composer for percentage-point CRIT and flat Anomaly Proficiency', () => {
    const visible = selectSource(defineWEngineSource('steamOven', 'Steam Oven'), 'anby', 0, {
      kind: 'refinement', refinement: 5,
    })
    expect(composeStat('critRate', [
      { statId: 'critRate', region: 'base', earliestSurface: 'initial', value: 5, source: anbyBase },
      { statId: 'critRate', region: 'flat', earliestSurface: 'initial', value: 24, source: visible },
    ]).values).toEqual({ initial: 29, combat: 29, fully: 29 })
    expect(composeStat('anomalyProficiency', [
      { statId: 'anomalyProficiency', region: 'base', earliestSurface: 'initial', value: 100, source: anbyBase },
      { statId: 'anomalyProficiency', region: 'flat', earliestSurface: 'initial', value: 92, source: visible },
    ]).values).toEqual({ initial: 192, combat: 192, fully: 192 })
  })

  it('adds automatic recovery after Energy Regen composition without multiplying it', () => {
    const visible = selectSource(defineWEngineSource('steamOven', 'Steam Oven'), 'anby', 0, {
      kind: 'refinement', refinement: 5,
    })
    const regen = composeStat('energyRegen', [
      { statId: 'energyRegen', region: 'base', earliestSurface: 'initial', value: 1.2, source: anbyBase },
      { statId: 'energyRegen', region: 'percentage', earliestSurface: 'initial', value: 60, source: visible },
      { statId: 'energyRegen', region: 'percentage', earliestSurface: 'combat', value: 20, source: visible },
    ])
    const recovery = composeAutomaticEnergyRecovery(regen, [{
      earliestSurface: 'combat', value: 0.72, source: visible,
    }])
    expect(recovery.values).toEqual({ initial: 1.92, combat: 3.024, fully: 3.024 })
    expect(recovery.operations.combat).toHaveLength(1)
    expect(recovery.operations.fully).toHaveLength(0)
  })

  it('rejects base atoms that do not begin on Initial', () => {
    const invalid = {
      statId: 'atk', region: 'base', earliestSurface: 'combat', value: 100, source: anbyBase,
    } as unknown as StatAtom
    expect(() => composeStat('atk', [invalid])).toThrow('Base stat atoms must be available on the initial surface')
  })
})
