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
      | 'Assist Follow-Up'
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
    expectTypeOf<WEngineEffectField<'myriadEclipse'>>()
      .toEqualTypeOf<'critDamage' | 'defIgnore'>()
    expectTypeOf<WEngineEffectField<'tusksOfFury'>>()
      .toEqualTypeOf<'shield' | 'damage' | 'daze'>()
    expectTypeOf<WEngineEffectField<'tremorTrigramVessel'>>()
      .toEqualTypeOf<'damage' | 'energy'>()

    expectTypeOf<DriveDiscPiece<'dawnsBloom'>>()
      .toEqualTypeOf<'twoPiece' | 'fourPiece'>()
    expectTypeOf<DriveDiscEffectField<'dawnsBloom', 'fourPiece'>>()
      .toEqualTypeOf<'damage'>()
    expectTypeOf<DriveDiscPiece<'branchAndBlade'>>().toEqualTypeOf<'twoPiece'>()
    expectTypeOf<DriveDiscEffectField<'polarMetal', 'twoPiece'>>()
      .toEqualTypeOf<'damage'>()
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
    expect(W_ENGINES.tusksOfFury.passiveLines(1)).toEqual([
      'Shield provided +30%', 'Squad DMG +18%', 'Squad Daze +12%',
    ])
    expect(W_ENGINES.tremorTrigramVessel.passiveLines(5)).toEqual([
      'EX Special & Ultimate DMG +40%',
      'Squad takes DMG or heals · Energy +3.2',
    ])
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

  it('derives the new complete W-Engine packages from their exact refinement facts', () => {
    const refinements = [1, 2, 3, 4, 5] as const

    expect(refinements.map((refinement) =>
      equipmentEffectBaseValue(W_ENGINE_FACTS.housekeeper.effects.energy, refinement),
    )).toEqual([0.45, 0.52, 0.58, 0.65, 0.72])
    expect(refinements.map((refinement) =>
      equipmentEffectMaximumValue(W_ENGINE_FACTS.housekeeper.effects.damage, refinement),
    )).toEqual([45, 52.5, 60, 66, 72])
    expect(refinements.map((refinement) =>
      equipmentEffectMaximumValue(W_ENGINE_FACTS.blazingLaurel.effects.critDamage, refinement),
    )).toEqual([30, 34.4, 39, 43.4, 48])
    expect(refinements.map((refinement) =>
      equipmentEffectBaseValue(W_ENGINE_FACTS.simmeringPot.effects.daze, refinement),
    )).toEqual([7.2, 8.2, 9.2, 10.2, 11.5])

    expect(W_ENGINES.housekeeper.passiveLines(5)).toEqual([
      'Automatic Energy +0.72/s',
      'EX Special Physical DMG +72%',
    ])
    expect(W_ENGINES.blazingLaurel.passiveLines(1)).toEqual([
      'Impact +25%',
      'Fire & Ice CRIT DMG +30%',
    ])
    expect(W_ENGINES.simmeringPot.passiveLines(5)).toEqual([
      'Assist Follow-Up Daze +11.5%',
      'Assist Follow-Up DMG +11.5%',
    ])

    for (const engineId of ['housekeeper', 'blazingLaurel', 'simmeringPot'] as const) {
      for (const line of W_ENGINES[engineId].passiveLines(5)) {
        expect(line).not.toMatch(/Base ATK|acquir|stack|duration|seconds?/i)
      }
    }
  })

  it('retains the exact Yidhari and Manato signature W-Engine packages', () => {
    expect(W_ENGINES.krakensCradle).toMatchObject({
      rank: 'S', limited: true, baseAtk: 713,
      advancedStat: { id: 'hpPct', label: 'HP', value: 30, unit: '%' },
    })
    expect(W_ENGINES.grillOWisp).toMatchObject({
      rank: 'A', limited: false, baseAtk: 624,
      advancedStat: { id: 'hpPct', label: 'HP', value: 25, unit: '%' },
    })
    expect(W_ENGINES.wrathfulVajra).toMatchObject({
      rank: 'S', limited: true, baseAtk: 713,
      advancedStat: { id: 'hpPct', label: 'HP', value: 30, unit: '%' },
    })
    expect(equipmentEffectMaximumValue(W_ENGINE_FACTS.krakensCradle.effects.iceSheerDamage, 1)).toBe(18)
    expect(equipmentEffectBaseValue(W_ENGINE_FACTS.krakensCradle.effects.critRate, 1)).toBe(20)
    expect(equipmentEffectBaseValue(W_ENGINE_FACTS.grillOWisp.effects.fireDamage, 5)).toBe(24)
    expect(equipmentEffectBaseValue(W_ENGINE_FACTS.grillOWisp.effects.critRate, 5)).toBe(24)
    expect(equipmentEffectMaximumValue(W_ENGINE_FACTS.wrathfulVajra.effects.fireSheerDamage, 1)).toBe(18)
    expect(W_ENGINES.krakensCradle.passiveLines(1)).toEqual([
      'Ice Sheer DMG +18%',
      '≤50% Max HP · CRIT Rate +20%',
    ])
  })

  it('retains Myriad Eclipse broad holder DEF Ignore separately from scoped alternatives', () => {
    expect(W_ENGINES.myriadEclipse).toMatchObject({
      rank: 'S', limited: true, baseAtk: 713,
      advancedStat: { id: 'critRate', label: 'CRIT Rate', value: 24, unit: '%' },
    })
    expect(W_ENGINE_FACTS.myriadEclipse.effects.defIgnore).toMatchObject({
      modifier: 'defIgnore',
      scope: { recipient: 'enemy' },
    })
    expect(W_ENGINE_FACTS.myriadEclipse.effects.defIgnore.scope).not.toHaveProperty('actions')
    expect(equipmentEffectBaseValue(W_ENGINE_FACTS.myriadEclipse.effects.critDamage, 1)).toBe(45)
    expect(equipmentEffectBaseValue(W_ENGINE_FACTS.myriadEclipse.effects.defIgnore, 1)).toBe(25)
    expect(W_ENGINES.myriadEclipse.passiveLines(1)).toEqual([
      'CRIT DMG +45%',
      'After Ice DMG from EX Special, Chain Attack, or Ultimate · DEF Ignore +25%',
    ])
    expect(DRIVE_DISCS.polarMetal).toMatchObject({
      twoPieceEffect: 'Ice DMG +10%',
    })
    expect(DRIVE_DISCS.polarMetal).not.toHaveProperty('fourPieceEffects')
  })

  it('retains Starlight Rider Faceplate and the Steel Cushion holder gate separately', () => {
    expect(W_ENGINES.starlightRiderFaceplate).toMatchObject({
      rank: 'S', limited: true, baseAtk: 713,
      advancedStat: { id: 'hpPct', label: 'HP', value: 30, unit: '%' },
    })
    expect(equipmentEffectBaseValue(
      W_ENGINE_FACTS.starlightRiderFaceplate.effects.critRate, 1,
    )).toBe(20)
    expect(equipmentEffectMaximumValue(
      W_ENGINE_FACTS.starlightRiderFaceplate.effects.physicalSheerDamage, 1,
    )).toBe(20)
    expect(W_ENGINES.starlightRiderFaceplate.passiveLines(1)).toEqual([
      'CRIT Rate +20%',
      'Physical Sheer DMG +20%',
    ])
    expect(W_ENGINES.steelCushion.passiveSpecialty).toBe('Attack')
  })
})
