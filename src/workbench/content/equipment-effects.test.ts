import { describe, expect, expectTypeOf, it } from 'vitest'
import {
  DRIVE_DISC_FACTS,
  DRIVE_DISCS,
  W_ENGINE_FACTS,
  W_ENGINES,
  equipmentEffectBaseValue,
  equipmentEffectMaximumValue,
  equipmentEffectProgressionValue,
  type DriveDiscEffectField,
  type DriveDiscPiece,
  type WEngineEffectField,
} from '../content'

describe('bounded equipment effect facts', () => {
  it('exposes exact item-local W-Engine and Drive Disc field contracts', () => {
    expectTypeOf<WEngineEffectField<'cordisGermina'>>()
      .toEqualTypeOf<'critRate' | 'damage' | 'defIgnore'>()
    expectTypeOf<WEngineEffectField<'brimstone'>>().toEqualTypeOf<'atk'>()

    expectTypeOf<DriveDiscPiece<'dawnsBloom'>>()
      .toEqualTypeOf<'twoPiece' | 'fourPiece'>()
    expectTypeOf<DriveDiscEffectField<'dawnsBloom', 'fourPiece'>>()
      .toEqualTypeOf<'damage'>()
    expectTypeOf<DriveDiscPiece<'branchAndBlade'>>().toEqualTypeOf<'twoPiece'>()
  })

  it('keeps W-Engine qualifiers separate from modifier and refinement magnitude', () => {
    const damage = W_ENGINE_FACTS.cordisGermina.effects.damage
    const defIgnore = W_ENGINE_FACTS.cordisGermina.effects.defIgnore

    expect(damage).toMatchObject({
      modifier: 'dmgBonus',
      scope: { attributes: ['Electric'] },
      progression: { kind: 'stacks', maxStacks: 2 },
    })
    expect(equipmentEffectMaximumValue(damage, 1)).toBe(25)
    expect(equipmentEffectMaximumValue(damage, 5)).toBe(40)

    expect(defIgnore).toMatchObject({
      modifier: 'defIgnore',
      scope: {
        recipient: 'enemy',
        actions: ['Basic Attack', 'Ultimate'],
      },
    })
    expect(equipmentEffectBaseValue(defIgnore, 1)).toBe(20)
    expect(equipmentEffectBaseValue(defIgnore, 5)).toBe(32)
  })

  it('resolves retained stack and threshold maxima without composite value fields', () => {
    expect(equipmentEffectMaximumValue(W_ENGINE_FACTS.brimstone.effects.atk, 1)).toBe(28)
    expect(equipmentEffectMaximumValue(W_ENGINE_FACTS.brimstone.effects.atk, 5)).toBe(56)
    expect(equipmentEffectMaximumValue(W_ENGINE_FACTS.preciousFossilizedCore.effects.daze, 5)).toBe(32)
  })

  it('preserves aggregate refinement rounding instead of summing rounded increments', () => {
    expect(([1, 2, 3, 4, 5] as const).map((refinement) =>
      equipmentEffectMaximumValue(W_ENGINE_FACTS.thoughtbop.effects.damage, refinement),
    )).toEqual([25, 28.75, 32.5, 36.25, 40])
    expect(([1, 2, 3, 4, 5] as const).map((refinement) =>
      equipmentEffectMaximumValue(W_ENGINE_FACTS.cordisGermina.effects.damage, refinement),
    )).toEqual([25, 28.75, 32.5, 36.25, 40])
    expect(([1, 2, 3, 4, 5] as const).map((refinement) =>
      equipmentEffectMaximumValue(W_ENGINE_FACTS.iceJadeTeapot.effects.impact, refinement),
    )).toEqual([21, 24.15, 27.3, 30.45, 33.6])
  })

  it('keeps Drive Disc piece ownership, action scope, and progression distinct', () => {
    const dawnTwoPiece = DRIVE_DISC_FACTS.dawnsBloom.twoPiece.damage
    const dawnFourPiece = DRIVE_DISC_FACTS.dawnsBloom.fourPiece.damage
    const pufferUltimate = DRIVE_DISC_FACTS.pufferElectro.fourPiece.damage

    expect(dawnTwoPiece).toMatchObject({
      modifier: 'dmgBonus',
      value: 15,
      scope: { actions: ['Basic Attack'] },
    })
    expect(dawnFourPiece).toMatchObject({
      modifier: 'dmgBonus',
      value: 20,
      progression: { kind: 'conditions', maxConditions: 1 },
      scope: { actions: ['Basic Attack'] },
    })
    expect(equipmentEffectProgressionValue(dawnFourPiece)).toBe(20)
    expect(equipmentEffectMaximumValue(dawnFourPiece)).toBe(40)

    expect(pufferUltimate).toMatchObject({
      modifier: 'dmgBonus',
      value: 20,
      scope: { actions: ['Ultimate'] },
    })
  })

  it('derives the existing compressed Setup packages from structured facts', () => {
    expect(W_ENGINES.cordisGermina.passiveLines(1)).toEqual([
      'CRIT Rate +15%',
      'Electric DMG +25%',
      'Basic Attack & Ultimate DEF Ignore +20%',
    ])
    expect(W_ENGINES.brimstone.passiveLines(5)).toEqual(['ATK +56%'])
    expect(DRIVE_DISCS.dawnsBloom).toMatchObject({
      twoPieceEffect: 'Basic Attack DMG +15%',
      fourPieceEffects: ['Basic Attack DMG +40%'],
    })
    expect(DRIVE_DISCS.pufferElectro).toMatchObject({
      twoPieceEffect: 'PEN Ratio +8%',
      fourPieceEffects: ['Ultimate DMG +20%', 'ATK +15%'],
    })
  })
})
