import { describe, expect, it } from 'vitest'
import {
  effectAttributeForAgent,
  effectAttributeForPartySlot,
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

  it.each([
    ['yixuan', 'Ether'],
    ['yeShunguang', 'Physical'],
    ['miyabi', 'Ice'],
  ] as const)('maps special display Attribute %s to calculation Attribute %s', (agentId, attribute) => {
    expect(effectAttributeForAgent(agentId)).toBe(attribute)
  })

  it('resolves Lumiflux from the next applied slot, including slot 3 to slot 1', () => {
    expect(effectAttributeForPartySlot(
      ['remielle', 'velina', 'yuzuha'],
      0,
    )).toBe('Wind')
    expect(effectAttributeForPartySlot(
      ['remielle', 'grace', 'yixuan'],
      0,
    )).toBe('Electric')
    expect(effectAttributeForPartySlot(
      ['grace', 'promeia', 'remielle'],
      2,
    )).toBe('Electric')
    expect(() => effectAttributeForAgent('remielle')).toThrow(
      'Lumiflux calculation Attribute requires the applied party slot',
    )
  })
})
