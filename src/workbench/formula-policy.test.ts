import { describe, expect, it } from 'vitest'
import { FORMULA_PARTICIPATION_BY_AGENT } from './content'
import {
  directionUsesDefRegion,
  formulaUsesCrit,
  formulaUsesDefRegion,
  primaryFormulaUsesCrit,
} from './formula-policy'

describe('formula policy', () => {
  it('distinguishes crit-capable damage from anomaly and buildup directions', () => {
    expect(formulaUsesCrit('general_damage')).toBe(true)
    expect(formulaUsesCrit('sheer_damage')).toBe(true)
    expect(formulaUsesCrit('anomaly_damage')).toBe(false)
    expect(formulaUsesCrit('daze_buildup')).toBe(false)
    expect(formulaUsesCrit('anomaly_buildup')).toBe(false)
  })

  it('distinguishes DEF-region damage from sheer and buildup directions', () => {
    expect(formulaUsesDefRegion('general_damage')).toBe(true)
    expect(formulaUsesDefRegion('anomaly_damage')).toBe(true)
    expect(formulaUsesDefRegion('sheer_damage')).toBe(false)
    expect(formulaUsesDefRegion('daze_buildup')).toBe(false)
    expect(formulaUsesDefRegion('anomaly_buildup')).toBe(false)
  })

  it('keeps Setup and Result participation independently authored', () => {
    expect(FORMULA_PARTICIPATION_BY_AGENT.cissia).toEqual({
      setup: { primary: ['general_damage'], residual: [] },
      result: ['general_damage', 'daze_buildup'],
    })
    expect(directionUsesDefRegion('cissia')).toBe(true)
    expect(primaryFormulaUsesCrit('qingyi')).toBe(false)
    expect(FORMULA_PARTICIPATION_BY_AGENT.qingyi.setup).toEqual({
      primary: ['daze_buildup'], residual: ['general_damage'],
    })
    expect(FORMULA_PARTICIPATION_BY_AGENT.qingyi.result).toEqual([
      'daze_buildup', 'general_damage',
    ])
    expect(FORMULA_PARTICIPATION_BY_AGENT.grace.result).toEqual(
      [...FORMULA_PARTICIPATION_BY_AGENT.grace.setup.primary],
    )
  })

  it('does not infer Result families from Setup residual participation', () => {
    expect(FORMULA_PARTICIPATION_BY_AGENT.panYinhu.setup.residual)
      .toEqual(['daze_buildup'])
    expect(FORMULA_PARTICIPATION_BY_AGENT.panYinhu.result).toEqual([])
  })
})
