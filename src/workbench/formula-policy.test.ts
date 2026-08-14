import { describe, expect, it } from 'vitest'
import { formulaUsesCrit } from './formula-policy'

describe('formula policy', () => {
  it('distinguishes crit-capable damage from anomaly and buildup directions', () => {
    expect(formulaUsesCrit('general_damage')).toBe(true)
    expect(formulaUsesCrit('sheer_damage')).toBe(true)
    expect(formulaUsesCrit('anomaly_damage')).toBe(false)
    expect(formulaUsesCrit('daze_buildup')).toBe(false)
    expect(formulaUsesCrit('anomaly_buildup')).toBe(false)
  })
})
