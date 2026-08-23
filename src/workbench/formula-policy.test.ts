import { describe, expect, it } from 'vitest'
import {
  formulaUsesCrit,
  formulaUsesDefRegion,
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
})
