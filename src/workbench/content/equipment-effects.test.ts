import { describe, expect, expectTypeOf, it } from 'vitest'
import {
  DRIVE_DISC_FACTS,
  DRIVE_DISCS,
  W_ENGINE_FACTS,
  W_ENGINES,
  equipmentEffectBaseValue,
  equipmentEffectMaximumValue,
  equipmentEffectProgressionValue,
  defaultRefinementFor,
  type DriveDiscEffectField,
  type DriveDiscPiece,
  type EquipmentEffectAction,
  type EquipmentEffectCondition,
  type EquipmentEffectTag,
  type WEngineEffectField,
} from '../content'

describe('bounded equipment effect facts', () => {
  it('exposes exact item-local W-Engine and Drive Disc field contracts', () => {
    expectTypeOf<EquipmentEffectAction>().toEqualTypeOf<
      | 'Basic Attack'
      | 'Dash Attack'
      | 'Dodge Counter'
      | 'EX Special Attack'
      | 'Chain Attack'
      | 'Ultimate'
    >()
    expectTypeOf<EquipmentEffectCondition>().toEqualTypeOf<'backAttack'>()
    expectTypeOf<EquipmentEffectTag>().toEqualTypeOf<'aftershock'>()
    expectTypeOf<WEngineEffectField<'cordisGermina'>>()
      .toEqualTypeOf<'critRate' | 'damage' | 'defIgnore'>()
    expectTypeOf<WEngineEffectField<'brimstone'>>().toEqualTypeOf<'atk'>()
    expectTypeOf<WEngineEffectField<'heartstringNocturne'>>()
      .toEqualTypeOf<'critDamage' | 'fireResIgnore'>()

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
    expect(DRIVE_DISC_FACTS.shadowHarmony.twoPiece.damage).toMatchObject({
      scope: {
        actions: ['Dash Attack'],
        tags: ['aftershock'],
      },
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

  it('retains Evelyn equipment facts as scoped effects and concise packages', () => {
    const heartstring = W_ENGINE_FACTS.heartstringNocturne.effects.fireResIgnore
    const refinements = [1, 2, 3, 4, 5] as const
    const heartstringLines = refinements.map((refinement) =>
      W_ENGINES.heartstringNocturne.passiveLines(refinement),
    )
    const steelLines = refinements.map((refinement) =>
      W_ENGINES.steelCushion.passiveLines(refinement),
    )

    expect(heartstring).toMatchObject({
      modifier: 'resIgnore',
      progression: { kind: 'stacks', maxStacks: 2 },
      scope: { recipient: 'enemy', actions: ['Chain Attack', 'Ultimate'], attributes: ['Fire'] },
    })
    expect(refinements.map((refinement) =>
      equipmentEffectMaximumValue(heartstring, refinement),
    )).toEqual([25, 29, 33, 37, 40])
    expect(heartstringLines).toEqual([
      ['CRIT DMG +50%', 'Chain Attack & Ultimate Fire RES Ignore +25%'],
      ['CRIT DMG +57.5%', 'Chain Attack & Ultimate Fire RES Ignore +29%'],
      ['CRIT DMG +65%', 'Chain Attack & Ultimate Fire RES Ignore +33%'],
      ['CRIT DMG +72.5%', 'Chain Attack & Ultimate Fire RES Ignore +37%'],
      ['CRIT DMG +80%', 'Chain Attack & Ultimate Fire RES Ignore +40%'],
    ])
    expect(steelLines).toEqual([
      ['Physical DMG +20%', 'Back Attack DMG +25%'],
      ['Physical DMG +25%', 'Back Attack DMG +31.5%'],
      ['Physical DMG +30%', 'Back Attack DMG +38%'],
      ['Physical DMG +35%', 'Back Attack DMG +44%'],
      ['Physical DMG +40%', 'Back Attack DMG +50%'],
    ])
    expect(W_ENGINES.heartstringNocturne).toMatchObject({
      rank: 'S',
      limited: true,
      baseAtk: 713,
      advancedStat: { id: 'critRate', label: 'CRIT Rate', value: 24, unit: '%' },
    })
    expect(W_ENGINES.heartstringNocturne.image).toContain('heartstring-nocturne.webp')
    expect(W_ENGINES.steelCushion).toMatchObject({
      rank: 'S',
      limited: false,
      baseAtk: 684,
      advancedStat: { id: 'critRate', label: 'CRIT Rate', value: 24, unit: '%' },
    })
    expect(W_ENGINES.steelCushion.image).toContain('steel-cushion.webp')
    expect(defaultRefinementFor(W_ENGINES.heartstringNocturne.rank)).toBe(1)
    expect(defaultRefinementFor(W_ENGINES.steelCushion.rank)).toBe(1)
    expect(W_ENGINE_FACTS.steelCushion.effects.damage.scope).toEqual({ condition: 'backAttack' })
    expect(DRIVE_DISCS.infernoMetal).toMatchObject({ twoPieceEffect: 'Fire DMG +10%' })
    expect(DRIVE_DISCS.infernoMetal).not.toHaveProperty('fourPieceEffects')
    expect(DRIVE_DISCS.infernoMetal.image).toContain('inferno-metal.webp')
    expect(DRIVE_DISCS.hormonePunk.fourPieceEffects).toEqual(['ATK +25%'])
    expect(DRIVE_DISCS.hormonePunk.image).toContain('hormone-punk.webp')

    for (const line of [...heartstringLines, ...steelLines].flat()) {
      expect(line).not.toMatch(/Base ATK|entry|entering|acquir|stack|refresh|duration|seconds?/i)
    }
  })
})
