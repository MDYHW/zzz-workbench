import { describe, expect, it } from 'vitest'
import type { EquipmentEffectFact } from '../types'
import { equipmentEffectAppliesInOperatingInterval } from './equipment'

const effect = (overrides: Partial<EquipmentEffectFact>): EquipmentEffectFact => ({
  modifier: 'dmgBonus',
  unit: '%',
  value: 0,
  ...overrides,
})

describe('equipment operating-interval applicability', () => {
  it('distinguishes off-field activation from off-field removal', () => {
    const unconditional = effect({})
    const offFieldOnly = effect({ scope: { condition: 'offField' } })
    const removedOffField = effect({
      activation: { kind: 'trigger', removedOffField: true },
    })

    expect(equipmentEffectAppliesInOperatingInterval(unconditional, 'on-field')).toBe(true)
    expect(equipmentEffectAppliesInOperatingInterval(unconditional, 'off-field')).toBe(true)
    expect(equipmentEffectAppliesInOperatingInterval(offFieldOnly, 'on-field')).toBe(false)
    expect(equipmentEffectAppliesInOperatingInterval(offFieldOnly, 'off-field')).toBe(true)
    expect(equipmentEffectAppliesInOperatingInterval(removedOffField, 'on-field')).toBe(true)
    expect(equipmentEffectAppliesInOperatingInterval(removedOffField, 'off-field')).toBe(false)
  })
})
