import { describe, expect, it } from 'vitest'
import { W_ENGINE_FACTS, W_ENGINES } from '../engines'
import { equipmentEffectBaseValue, type EquipmentEffectFact } from '../types'
import { equipmentEffectAppliesInOperatingInterval, equipmentEffectCanBeActivatedByHolder } from './equipment'

const effect = (overrides: Partial<EquipmentEffectFact>): EquipmentEffectFact => ({
  modifier: 'dmgBonus',
  unit: '%',
  value: 0,
  ...overrides,
})

describe('shared engine activation and scope facts', () => {
  it('keeps Simmering activation separate from its broad holder effects and compressed Setup copy', () => {
    const { daze, damage } = W_ENGINE_FACTS.simmeringPot.effects
    expect(daze.activation).toMatchObject({ kind: 'trigger', actions: ['Assist Follow-Up'], durationSeconds: 30 })
    expect(damage.activation).toMatchObject({ kind: 'trigger', actions: ['Assist Follow-Up'], durationSeconds: 30 })
    expect((daze as EquipmentEffectFact).scope?.actions).toBeUndefined()
    expect((damage as EquipmentEffectFact).scope?.actions).toBeUndefined()
    expect(W_ENGINES.simmeringPot.passiveLines(5)).toEqual([
      `Daze +${equipmentEffectBaseValue(daze, 5)}%`,
      `DMG +${equipmentEffectBaseValue(damage, 5)}%`,
    ])
  })

  it('keeps an equipper-attack trigger in the shared fact and resolves holder capability separately', () => {
    const damage = W_ENGINE_FACTS.weepingCradle.effects.damage
    expect(damage.activation).toEqual({ kind: 'trigger', performer: 'equipper' })
    expect(equipmentEffectCanBeActivatedByHolder('sunna', damage)).toBe(false)
    expect(equipmentEffectCanBeActivatedByHolder('yuzuha', damage)).toBe(true)

    const roaringDamage = W_ENGINE_FACTS.roaringFurnace.effects.damage
    expect(roaringDamage.activation).toEqual({
      kind: 'trigger', performer: 'equipper',
      actions: ['Chain Attack', 'Ultimate'], attributes: ['Fire'],
    })
    expect(equipmentEffectCanBeActivatedByHolder('juFufu', roaringDamage)).toBe(true)
    expect(equipmentEffectCanBeActivatedByHolder('nangongYu', roaringDamage)).toBe(false)

    const etherHolderEffect = effect({
      activation: { kind: 'trigger', holderAttributes: ['Ether'] },
    })
    expect(equipmentEffectCanBeActivatedByHolder('aria', etherHolderEffect)).toBe(true)
    expect(equipmentEffectCanBeActivatedByHolder('promeia', etherHolderEffect)).toBe(false)
  })
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
