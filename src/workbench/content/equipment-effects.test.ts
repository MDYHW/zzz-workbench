import { describe, expect, expectTypeOf, it } from 'vitest'
import {
  ADMITTED_AGENTS,
  DISC_IDS_BY_AGENT_AND_PIECE,
  DRIVE_DISC_FACTS,
  DRIVE_DISCS,
  ENGINE_IDS_BY_AGENT_AND_POOL,
  MAIN_STAT_IDS_BY_AGENT_AND_SLOT,
  REPRESENTATIVE_SETUP_BY_AGENT_AND_POOL,
  SAME_EFFECT_TWO_PIECE_RELATIONSHIPS,
  SETUP_FORMULA_PARTICIPATION_BY_AGENT,
  SOURCE_LABELS,
  SUBSTAT_CHOICES_BY_AGENT,
  VERTICAL_VALUES,
  W_ENGINE_FACTS,
  W_ENGINES,
  defaultMindscapeFor,
  equipmentEffectBaseValue,
  equipmentEffectMaximumValue,
  equipmentEffectProgressionIncrementValue,
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
      | 'Special Attack'
      | 'EX Special Attack'
      | 'Assist'
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
    expectTypeOf<WEngineEffectField<'riotSuppressorMarkVI'>>()
      .toEqualTypeOf<'critRate' | 'chargedEtherDamage'>()
    expectTypeOf<WEngineEffectField<'theVault'>>()
      .toEqualTypeOf<'targetDamage' | 'holderEnergy'>()
    expectTypeOf<WEngineEffectField<'demaraBatteryMarkII'>>()
      .toEqualTypeOf<'electricDamage' | 'energyGeneration'>()
    expectTypeOf<WEngineEffectField<'originalTransmorpher'>>()
      .toEqualTypeOf<'maxHp' | 'impact'>()
    expectTypeOf<WEngineEffectField<'streetSuperstar'>>()
      .toEqualTypeOf<'ultimateDamage'>()
    expectTypeOf<WEngineEffectField<'halfSugarBunny'>>()
      .toEqualTypeOf<'automaticEnergy' | 'squadAtk' | 'squadMaxHp' | 'veilCritDamage'>()
    expectTypeOf<WEngineEffectField<'timeweaver'>>()
      .toEqualTypeOf<'electricBuildup' | 'anomalyProficiency' | 'disorderDamage'>()
    expectTypeOf<WEngineEffectField<'practicedPerfection'>>()
      .toEqualTypeOf<'anomalyMastery' | 'physicalDamage'>()
    expectTypeOf<WEngineEffectField<'fusionCompiler'>>()
      .toEqualTypeOf<'atk' | 'anomalyProficiency'>()

    expectTypeOf<DriveDiscPiece<'dawnsBloom'>>()
      .toEqualTypeOf<'twoPiece' | 'fourPiece'>()
    expectTypeOf<DriveDiscEffectField<'dawnsBloom', 'fourPiece'>>()
      .toEqualTypeOf<'damage'>()
    expectTypeOf<DriveDiscPiece<'branchAndBlade'>>().toEqualTypeOf<'twoPiece'>()
    expectTypeOf<DriveDiscEffectField<'polarMetal', 'twoPiece'>>()
      .toEqualTypeOf<'damage'>()
    expectTypeOf<DriveDiscEffectField<'thunderMetal', 'twoPiece'>>()
      .toEqualTypeOf<'damage'>()
    expectTypeOf<DriveDiscEffectField<'thunderMetal', 'fourPiece'>>()
      .toEqualTypeOf<'atk'>()
    expectTypeOf<DriveDiscEffectField<'chaoticMetal', 'twoPiece'>>()
      .toEqualTypeOf<'damage'>()
    expectTypeOf<DriveDiscEffectField<'bunnyInWonderland', 'fourPiece'>>()
      .toEqualTypeOf<'damage'>()
    expectTypeOf<DriveDiscEffectField<'whiteWaterBallad', 'fourPiece'>>()
      .toEqualTypeOf<'veilCritRate' | 'attackVeilCritRate' | 'attackVeilAtk'>()
    expectTypeOf<DriveDiscEffectField<'chaosJazz', 'fourPiece'>>()
      .toEqualTypeOf<'electricFireDamage' | 'offFieldActionDamage'>()
    expectTypeOf<DriveDiscEffectField<'freedomBlues', 'fourPiece'>>()
      .toEqualTypeOf<'buildupResReduction'>()
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

  it('retains Zhu Yuan and Nicole equipment facts without treating triggers as recipient scope', () => {
    expect(W_ENGINES.riotSuppressorMarkVI).toMatchObject({
      rank: 'S', limited: true, baseAtk: 713,
      advancedStat: { id: 'critDmg', value: 48 },
    })
    expect(equipmentEffectBaseValue(W_ENGINE_FACTS.riotSuppressorMarkVI.effects.critRate, 1)).toBe(15)
    expect(equipmentEffectBaseValue(W_ENGINE_FACTS.riotSuppressorMarkVI.effects.critRate, 5)).toBe(30)
    expect(equipmentEffectBaseValue(W_ENGINE_FACTS.riotSuppressorMarkVI.effects.chargedEtherDamage, 5)).toBe(70)
    expect(W_ENGINES.riotSuppressorMarkVI.passiveLines(1)).toEqual([
      'CRIT Rate +15%',
      'Ether Basic & Dash Attack DMG +35%',
    ])
    expect(W_ENGINES.theVault).toMatchObject({
      rank: 'A', limited: false, baseAtk: 624,
      advancedStat: { id: 'energyRegenPct', value: 50 },
    })
    expect(equipmentEffectBaseValue(W_ENGINE_FACTS.theVault.effects.targetDamage, 5)).toBe(24)
    expect(equipmentEffectBaseValue(W_ENGINE_FACTS.theVault.effects.holderEnergy, 5)).toBe(0.8)
    expect(W_ENGINE_FACTS.theVault.effects.targetDamage.scope).toEqual({ recipient: 'squad' })
    expect(W_ENGINES.theVault.passiveLines(5)).toEqual([
      'Target squad DMG +24%',
      'Holder Energy +0.8/s',
    ])
    expect(DRIVE_DISCS.chaoticMetal.fourPieceEffects).toEqual(['CRIT DMG +53%'])
  })

  it('resolves retained stack and threshold maxima without composite value fields', () => {
    expect(equipmentEffectMaximumValue(W_ENGINE_FACTS.brimstone.effects.atk, 1)).toBe(28)
    expect(equipmentEffectMaximumValue(W_ENGINE_FACTS.brimstone.effects.atk, 5)).toBe(56)
    expect(equipmentEffectMaximumValue(W_ENGINE_FACTS.preciousFossilizedCore.effects.daze, 5)).toBe(32)
    expect(equipmentEffectBaseValue(DRIVE_DISC_FACTS.thunderMetal.fourPiece.atk)).toBe(28)
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
    expect(W_ENGINES.zanshinHerbCase.passiveLines(1)).toEqual([
      'CRIT Rate +20%',
      'Electric Dash Attack DMG +40%',
    ])
    expect(([1, 2, 3, 4, 5] as const).map((refinement) => [
      equipmentEffectBaseValue(W_ENGINE_FACTS.zanshinHerbCase.effects.critRate, refinement),
      equipmentEffectBaseValue(W_ENGINE_FACTS.zanshinHerbCase.effects.dashDamage, refinement),
      equipmentEffectBaseValue(W_ENGINE_FACTS.zanshinHerbCase.effects.anomalyStunCritRate, refinement),
    ])).toEqual([
      [10, 40, 10], [11.5, 46, 11.5], [13, 52, 13],
      [14.5, 58, 14.5], [16, 64, 16],
    ])
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
    expect(DRIVE_DISC_FACTS.bunnyInWonderland).toMatchObject({
      twoPiece: { maxHp: { modifier: 'maxHp', value: 10 } },
      fourPiece: {
        damage: {
          modifier: 'dmgBonus',
          progression: { kind: 'stacks', perStack: 6, maxStacks: 3 },
          scope: { recipient: 'squad' },
        },
      },
    })
    expect(equipmentEffectMaximumValue(
      DRIVE_DISC_FACTS.bunnyInWonderland.fourPiece.damage,
    )).toBe(18)
  })

  it('retains matching Electric and Ether Disc facts at their current piece consumers', () => {
    expect(DRIVE_DISC_FACTS.thunderMetal).toEqual({
      twoPiece: {
        damage: {
          modifier: 'dmgBonus', unit: '%', value: 10,
          scope: { attributes: ['Electric'] },
        },
      },
      fourPiece: {
        atk: { modifier: 'atk', unit: '%', value: 28 },
      },
    })
    expect(DRIVE_DISC_FACTS.chaoticMetal).toEqual({
      twoPiece: {
        damage: {
          modifier: 'dmgBonus', unit: '%', value: 10,
          scope: { attributes: ['Ether'] },
        },
      },
      fourPiece: {
        critDamage: {
          modifier: 'critDmg', unit: '%', value: 20,
          progression: { kind: 'stacks', perStack: 5.5, maxStacks: 6 },
        },
      },
    })
    expect(DRIVE_DISCS.thunderMetal.twoPieceEffect).toBe('Electric DMG +10%')
    expect(DRIVE_DISCS.chaoticMetal.twoPieceEffect).toBe('Ether DMG +10%')
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
    expect(DRIVE_DISCS.bunnyInWonderland).toMatchObject({
      twoPieceEffect: 'HP +10%',
      fourPieceEffects: ['Squad DMG +18%'],
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
    expect(W_ENGINES.grillOWisp.passiveLines(5)).toEqual([
      'Fire DMG +24%',
      'CRIT Rate +24%',
    ])
    expect(ENGINE_IDS_BY_AGENT_AND_POOL.manato).toEqual({
      full: ['grillOWisp', 'wrathfulVajra', 'qingming', 'radiowave', 'puzzleSphere'],
      nonLimited: ['grillOWisp', 'radiowave', 'puzzleSphere'],
    })
  })

  it('keeps the sampled U6 pools independently competitive within each availability boundary', () => {
    expect(ENGINE_IDS_BY_AGENT_AND_POOL.panYinhu).toEqual({
      full: ['tusksOfFury', 'tremorTrigramVessel'],
      nonLimited: ['tremorTrigramVessel'],
    })
    expect(ENGINE_IDS_BY_AGENT_AND_POOL.pulchra).toEqual({
      full: ['blazingLaurel', 'boxCutter', 'hellfireGears', 'steamOven', 'preciousFossilizedCore'],
      nonLimited: ['boxCutter', 'hellfireGears', 'steamOven', 'preciousFossilizedCore'],
    })
    expect(ENGINE_IDS_BY_AGENT_AND_POOL.ben).toEqual({
      full: [
        'tremorTrigramVessel', 'tusksOfFury', 'cloudcleaveRadiance',
        'hailstormShrine', 'bigCylinder', 'springEmbrace',
      ],
      nonLimited: ['tremorTrigramVessel', 'bigCylinder', 'springEmbrace'],
    })
    expect(ENGINE_IDS_BY_AGENT_AND_POOL.koleda).toEqual({
      full: [
        'hellfireGears', 'blazingLaurel', 'restrained',
        'steamOven', 'preciousFossilizedCore',
      ],
      nonLimited: ['hellfireGears', 'restrained', 'steamOven', 'preciousFossilizedCore'],
    })
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
      'DEF Ignore +25%',
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

  it('retains the Orphie and Pulchra equipment packages and holder gates', () => {
    expect(W_ENGINES.gildedBlossom).toMatchObject({
      rank: 'A', limited: false, baseAtk: 594,
      advancedStat: { id: 'atkPct', label: 'ATK', value: 25, unit: '%' },
      passiveSpecialty: 'Attack',
    })
    expect(W_ENGINES.boxCutter).toMatchObject({
      rank: 'A', limited: false, baseAtk: 624,
      advancedStat: { id: 'impactPct', label: 'Impact', value: 15, unit: '%' },
      passiveSpecialty: 'Stun',
    })
    expect(W_ENGINES.gildedBlossom.passiveLines(5)).toEqual([
      'ATK +9.6%',
      'EX Special Attack DMG +24%',
    ])
    expect(W_ENGINES.boxCutter.passiveLines(5)).toEqual([
      'Physical DMG +24%',
      'Daze +16%',
    ])
    expect(W_ENGINE_FACTS.boxCutter.effects.physicalDamage.scope)
      .toEqual({ attributes: ['Physical'] })
  })

  it('keeps Proto Punk out after holder-local competitive reinspection', () => {
    expect(DRIVE_DISCS).not.toHaveProperty('protoPunk')
    expect(DRIVE_DISC_FACTS).not.toHaveProperty('protoPunk')

    for (const agentId of ['pulchra', 'qingyi', 'ben', 'koleda', 'anby', 'caesar'] as const) {
      expect(DISC_IDS_BY_AGENT_AND_PIECE[agentId].fourPiece).not.toContain('protoPunk')
      expect(DISC_IDS_BY_AGENT_AND_PIECE[agentId].twoPiece).not.toContain('protoPunk')
    }
  })

  it('retains Cloudcleave and Replica as complete packages without hiding inactive clauses', () => {
    expect(W_ENGINES.cloudcleaveRadiance).toMatchObject({
      rank: 'S', limited: true, baseAtk: 743,
      advancedStat: { id: 'critDmg', value: 48 },
    })
    expect(W_ENGINE_FACTS.cloudcleaveRadiance.effects.physicalResIgnore.scope)
      .toEqual({ attributes: ['Physical'] })
    expect('scope' in W_ENGINE_FACTS.cloudcleaveRadiance.effects.etherVeilDamage)
      .toBe(false)
    expect('scope' in W_ENGINE_FACTS.cloudcleaveRadiance.effects.etherVeilCritDamage)
      .toBe(false)
    expect(W_ENGINES.cloudcleaveRadiance.passiveLines(1)).toEqual([
      'Physical RES Ignore +20%',
      'DMG +25%',
      'CRIT DMG +25%',
    ])

    expect(W_ENGINES.starlightEngineReplica).toMatchObject({
      rank: 'A', limited: false, baseAtk: 624,
      advancedStat: { id: 'atkPct', value: 25 },
    })
    expect(W_ENGINE_FACTS.starlightEngineReplica.effects.physicalDamage.scope)
      .toEqual({ attributes: ['Physical'] })
    expect(W_ENGINES.starlightEngineReplica.passiveLines(5))
      .toEqual(['Physical DMG +57.5%'])
  })

  it('retains Demara Battery Mark II as an Electric and event-resource package', () => {
    const refinements = [1, 2, 3, 4, 5] as const

    expect(W_ENGINES.demaraBatteryMarkII).toMatchObject({
      rank: 'A', limited: false, baseAtk: 624,
      advancedStat: { id: 'impactPct', label: 'Impact', value: 15, unit: '%' },
    })
    expect(W_ENGINE_FACTS.demaraBatteryMarkII.effects.electricDamage.scope)
      .toEqual({ attributes: ['Electric'] })
    expect(refinements.map((refinement) =>
      equipmentEffectBaseValue(
        W_ENGINE_FACTS.demaraBatteryMarkII.effects.electricDamage,
        refinement,
      ),
    )).toEqual([15, 17.5, 20, 22, 24])
    expect(refinements.map((refinement) =>
      equipmentEffectBaseValue(
        W_ENGINE_FACTS.demaraBatteryMarkII.effects.energyGeneration,
        refinement,
      ),
    )).toEqual([18, 20.5, 23, 25, 27.5])
    expect(W_ENGINE_FACTS.demaraBatteryMarkII.effects.energyGeneration).toMatchObject({
      modifier: 'energyGenerationRate', unit: '%',
    })
    expect(W_ENGINES.demaraBatteryMarkII.passiveLines(5)).toEqual([
      'Electric DMG +24%',
      'Energy Generation Rate +27.5%',
    ])
    expect(W_ENGINES.demaraBatteryMarkII.image).toContain('demara-battery-mark-ii.webp')

    for (const line of W_ENGINES.demaraBatteryMarkII.passiveLines(5)) {
      expect(line).not.toMatch(/Base ATK|stack|duration|seconds?/i)
    }
  })

  it('authors Caesar as a complete content path without activating off-Specialty packages', () => {
    expect(ADMITTED_AGENTS.find(({ id }) => id === 'caesar')).toEqual({
      id: 'caesar', name: 'Caesar King', attribute: 'Physical', specialty: 'Defense',
      focusEligible: false, rank: 'S', faction: 'Sons of Calydon',
    })
    expect(defaultMindscapeFor('caesar')).toBe(0)
    expect(VERTICAL_VALUES.caesar).toMatchObject({
      atk: 711, critRate: 5, critDmg: 50, impact: 123,
      additionalDmgBonus: 25,
      coreFocusAtk: 1000, mindscapeFocusAtk: 1500,
      coreImpactByTier: [20, 22, 24], ultimateDazeByTier: [100, 110, 120],
    })
    expect(SOURCE_LABELS).toMatchObject({
      caesarCore: 'Core Passive', caesarAbility: 'Additional Ability',
    })
    expect(SETUP_FORMULA_PARTICIPATION_BY_AGENT.caesar).toEqual({
      primary: [], residual: ['daze_buildup', 'general_damage'],
    })

    expect(ENGINE_IDS_BY_AGENT_AND_POOL.caesar).toEqual({
      full: ['tusksOfFury', 'hellfireGears', 'springEmbrace'],
      nonLimited: ['hellfireGears', 'springEmbrace'],
    })
    expect(W_ENGINES.tusksOfFury.passiveSpecialty).toBe('Defense')
    expect(W_ENGINES.hellfireGears.passiveSpecialty).toBe('Stun')
    expect(W_ENGINES.demaraBatteryMarkII.passiveSpecialty).toBe('Stun')
    expect(W_ENGINES.originalTransmorpher).toMatchObject({
      rank: 'A', limited: false, baseAtk: 594,
      advancedStat: { id: 'hpPct', label: 'HP', value: 25, unit: '%' },
      passiveSpecialty: 'Defense',
    })
    expect(W_ENGINES.originalTransmorpher.passiveLines(5)).toEqual([
      'Max HP +12.5%',
      'Impact +16%',
    ])
    expect(([1, 2, 3, 4, 5] as const).map((refinement) =>
      equipmentEffectBaseValue(W_ENGINE_FACTS.originalTransmorpher.effects.maxHp, refinement),
    )).toEqual([8, 9, 10, 11, 12.5])
    expect(([1, 2, 3, 4, 5] as const).map((refinement) =>
      equipmentEffectBaseValue(W_ENGINE_FACTS.originalTransmorpher.effects.impact, refinement),
    )).toEqual([10, 11.5, 13, 14.5, 16])

    expect(DISC_IDS_BY_AGENT_AND_PIECE.caesar).toEqual({
      fourPiece: ['bunnyInWonderland'],
      twoPiece: ['swingJazz', 'shockstar', 'king'],
    })
    expect(MAIN_STAT_IDS_BY_AGENT_AND_SLOT.caesar).toEqual({
      slot4: ['critRate', 'critDmg', 'atkPct'],
      slot5: ['physicalDmg', 'atkPct', 'penRatio'],
      slot6: ['impact'],
    })
    expect(SUBSTAT_CHOICES_BY_AGENT.caesar).toEqual([])
    expect(REPRESENTATIVE_SETUP_BY_AGENT_AND_POOL.caesar).toEqual({
      full: {
        engineId: 'tusksOfFury', fourPieceId: 'bunnyInWonderland', twoPieceId: 'swingJazz',
        mains: { slot4: 'critRate', slot5: 'physicalDmg', slot6: 'impact' },
      },
      nonLimited: {
        engineId: 'springEmbrace',
        fourPieceId: 'bunnyInWonderland', twoPieceId: 'swingJazz',
        mains: { slot4: 'critRate', slot5: 'physicalDmg', slot6: 'impact' },
      },
    })
  })

  it('authors Ye Shunguang and Zhao as complete typed content paths', () => {
    expect(ADMITTED_AGENTS.find(({ id }) => id === 'yeShunguang')).toEqual({
      id: 'yeShunguang', name: 'Ye Shunguang', attribute: 'Honed Edge', specialty: 'Attack',
      focusEligible: true, rank: 'S', faction: 'Yunkui Summit',
    })
    expect(ADMITTED_AGENTS.find(({ id }) => id === 'zhao')).toEqual({
      id: 'zhao', name: 'Zhao', attribute: 'Ice', specialty: 'Defense',
      focusEligible: false, rank: 'S', faction: 'Krampus Compliance Authority',
    })
    expect(VERTICAL_VALUES.yeShunguang).toMatchObject({
      atk: 938, critRate: 19.4, critDmg: 50,
      unityCritRate: 30, unityDmg: 25, veilVulnerabilityCap: 110,
      mindscapeActionDefIgnore: 40, mindscapeVeilVulnerabilityCap: 200,
    })
    expect(VERTICAL_VALUES.zhao).toMatchObject({
      hp: 9117, atk: 765, critRate: 5, critDmg: 50, baseEnergyRegen: 1.2,
      coreHp: 18, coreCritRatePer1000Hp: 1.4,
      additionalHpThreshold: 15000, additionalHpCap: 27000, additionalDmgCap: 40,
      finalVerdictMaxHp: 120, mindscapeFinalVerdictMaxHp: 168,
    })
    expect(SOURCE_LABELS).toMatchObject({
      yeShunguangCore: 'Core Passive', zhaoCore: 'Core Passive',
      zhaoAbility: 'Additional Ability', zhaoBasic: 'Basic Attack',
    })
    expect(SETUP_FORMULA_PARTICIPATION_BY_AGENT.yeShunguang).toEqual({
      primary: ['general_damage'], residual: [],
    })
    expect(SETUP_FORMULA_PARTICIPATION_BY_AGENT.zhao).toEqual({
      primary: [], residual: ['general_damage'],
    })

    expect(ENGINE_IDS_BY_AGENT_AND_POOL.yeShunguang).toEqual({
      full: [
        'cloudcleaveRadiance', 'brimstone', 'steelCushion', 'gildedBlossom',
        'marcatoDesire', 'starlightEngine', 'streetSuperstar',
      ],
      nonLimited: [
        'brimstone', 'steelCushion', 'gildedBlossom',
        'marcatoDesire', 'starlightEngine', 'streetSuperstar',
      ],
    })
    expect(ENGINE_IDS_BY_AGENT_AND_POOL.zhao).toEqual({
      full: ['halfSugarBunny', 'originalTransmorpher'],
      nonLimited: ['originalTransmorpher'],
    })

    const refinements = [1, 2, 3, 4, 5] as const
    const streetDamage = W_ENGINE_FACTS.streetSuperstar.effects.ultimateDamage
    expect(refinements.map((refinement) =>
      equipmentEffectProgressionIncrementValue(streetDamage, refinement),
    )).toEqual([15, 17.2, 19.5, 21.7, 24])
    expect(refinements.map((refinement) =>
      equipmentEffectMaximumValue(streetDamage, refinement),
    )).toEqual([45, 51.6, 58.5, 65.1, 72])
    expect(W_ENGINES.streetSuperstar).toMatchObject({
      rank: 'A', limited: false, baseAtk: 594,
      advancedStat: { id: 'atkPct', value: 25 }, passiveSpecialty: 'Attack',
    })
    expect(W_ENGINES.streetSuperstar.passiveLines(5)).toEqual([
      'Squad Chain Attack · Charge (max 3) · Ultimate DMG +24% each',
      'Holder Ultimate · Consumes Charges · Maximum DMG +72%',
    ])

    expect(W_ENGINES.halfSugarBunny).toMatchObject({
      rank: 'S', limited: true, baseAtk: 713,
      advancedStat: { id: 'hpPct', value: 30 }, passiveSpecialty: 'Defense',
    })
    expect(refinements.map((refinement) => equipmentEffectBaseValue(
      W_ENGINE_FACTS.halfSugarBunny.effects.automaticEnergy, refinement,
    ))).toEqual([0.46, 0.53, 0.6, 0.67, 0.74])
    expect(W_ENGINES.halfSugarBunny.passiveLines(1)).toEqual([
      'Automatic Energy Regen +0.46/s',
      'Squad ATK & Max HP +10% · Non-stacking',
      'Activate or extend Ether Veil · Squad CRIT DMG +30%',
    ])

    expect(DRIVE_DISCS.whiteWaterBallad).toMatchObject({
      twoPieceEffect: 'Physical DMG +10%',
      fourPieceEffects: [
        'Within Ether Veil · CRIT Rate +10%',
        'Attack holder activates or extends Ether Veil · CRIT Rate +10%',
        'Attack holder activates or extends Ether Veil · ATK +10%',
      ],
    })
    expect(SAME_EFFECT_TWO_PIECE_RELATIONSHIPS).toContainEqual({
      members: ['whiteWaterBallad', 'fangedMetal'], canonical: 'whiteWaterBallad',
    })
    expect(SAME_EFFECT_TWO_PIECE_RELATIONSHIPS).toContainEqual({
      members: ['bunnyInWonderland', 'yunkui'], canonical: 'bunnyInWonderland',
    })

    expect(DISC_IDS_BY_AGENT_AND_PIECE.yeShunguang).toEqual({
      fourPiece: ['whiteWaterBallad', 'woodpecker', 'hormonePunk'],
      twoPiece: [
        'whiteWaterBallad', 'fangedMetal', 'woodpecker', 'branchAndBlade',
        'pufferElectro', 'hormonePunk', 'astralVoice',
      ],
    })
    expect(DISC_IDS_BY_AGENT_AND_PIECE.zhao).toEqual({
      fourPiece: ['bunnyInWonderland', 'astralVoice', 'swingJazz'],
      twoPiece: ['bunnyInWonderland', 'yunkui', 'swingJazz', 'moonlight', 'astralVoice', 'hormonePunk'],
    })
    expect(MAIN_STAT_IDS_BY_AGENT_AND_SLOT.yeShunguang).toEqual({
      slot4: ['critRate', 'critDmg'], slot5: ['physicalDmg', 'atkPct', 'penRatio'],
      slot6: ['atkPct'],
    })
    expect(MAIN_STAT_IDS_BY_AGENT_AND_SLOT.zhao).toEqual({
      slot4: ['hpPct'], slot5: ['hpPct'], slot6: ['hpPct', 'energyRegenPct'],
    })
    expect(SUBSTAT_CHOICES_BY_AGENT.yeShunguang.map(({ id }) => id))
      .toEqual(['critRate', 'critDmg', 'atkPct'])
    expect(SUBSTAT_CHOICES_BY_AGENT.zhao.map(({ id }) => id))
      .toEqual(['hpPct', 'hpFlat'])
    expect(REPRESENTATIVE_SETUP_BY_AGENT_AND_POOL.yeShunguang).toEqual({
      full: {
        engineId: 'cloudcleaveRadiance', fourPieceId: 'whiteWaterBallad',
        twoPieceId: 'branchAndBlade',
        mains: { slot4: 'critDmg', slot5: 'physicalDmg', slot6: 'atkPct' },
      },
      nonLimited: {
        engineId: 'brimstone', fourPieceId: 'whiteWaterBallad',
        twoPieceId: 'branchAndBlade',
        mains: { slot4: 'critDmg', slot5: 'physicalDmg', slot6: 'atkPct' },
      },
    })
    expect(REPRESENTATIVE_SETUP_BY_AGENT_AND_POOL.zhao).toEqual({
      full: {
        engineId: 'halfSugarBunny', fourPieceId: 'bunnyInWonderland',
        twoPieceId: 'yunkui',
        mains: { slot4: 'hpPct', slot5: 'hpPct', slot6: 'hpPct' },
      },
      nonLimited: {
        engineId: 'originalTransmorpher', fourPieceId: 'bunnyInWonderland',
        twoPieceId: 'yunkui',
        mains: { slot4: 'hpPct', slot5: 'hpPct', slot6: 'hpPct' },
      },
    })
  })

  it('authors Grace as a complete Anomaly content path', () => {
    expect(ADMITTED_AGENTS.find(({ id }) => id === 'grace')).toEqual({
      id: 'grace', name: 'Grace Howard', attribute: 'Electric', specialty: 'Anomaly',
      focusEligible: true, rank: 'S', faction: 'Belobog Heavy Industries',
    })
    expect(SETUP_FORMULA_PARTICIPATION_BY_AGENT.grace).toEqual({
      primary: ['anomaly_damage', 'anomaly_buildup'], residual: [],
    })
    expect(VERTICAL_VALUES.grace).toMatchObject({
      atk: 825, anomalyProficiency: 116, anomalyMastery: 151, baseEnergyRegen: 1.2,
      coreAnomalyBuildup: 130, additionalShockDmgPerStack: 18,
      additionalShockDmgStacks: 2, potentialElectricDmg: 30,
      mindscapeElectricResReduction: 8.5,
      mindscapeElectricBuildupResReduction: 8.5,
      mindscapeGrenadeDmgMultiplier: 2,
    })

    expect(ENGINE_IDS_BY_AGENT_AND_POOL.grace).toEqual({
      full: [
        'timeweaver', 'practicedPerfection', 'fusionCompiler',
        'electroLipGloss', 'weepingGemini',
      ],
      nonLimited: ['fusionCompiler', 'electroLipGloss', 'weepingGemini'],
    })
    expect(W_ENGINES.timeweaver).toMatchObject({
      rank: 'S', limited: true, baseAtk: 713,
      advancedStat: { id: 'atkPct', value: 30 }, passiveSpecialty: 'Anomaly',
    })
    expect(([1, 2, 3, 4, 5] as const).map((refinement) =>
      equipmentEffectBaseValue(W_ENGINE_FACTS.timeweaver.effects.anomalyProficiency, refinement),
    )).toEqual([75, 85, 95, 105, 115])
    expect(W_ENGINES.practicedPerfection.passiveLines(1)).toEqual([
      'Anomaly Mastery +60',
      'Inflict Assault · Physical DMG +20% per stack · 2 stacks on entry',
    ])
    expect(equipmentEffectMaximumValue(
      W_ENGINE_FACTS.fusionCompiler.effects.anomalyProficiency, 1,
    )).toBe(75)

    expect(DISC_IDS_BY_AGENT_AND_PIECE.grace).toEqual({
      fourPiece: ['thunderMetal', 'chaosJazz', 'freedomBlues'],
      twoPiece: [
        'pufferElectro', 'phaethonsMelody', 'freedomBlues', 'chaosJazz',
        'hormonePunk', 'astralVoice',
      ],
    })
    expect(SAME_EFFECT_TWO_PIECE_RELATIONSHIPS).toContainEqual({
      members: ['freedomBlues', 'chaosJazz'], canonical: 'freedomBlues',
    })
    expect(DRIVE_DISCS.chaosJazz.fourPieceEffects).toEqual([
      'Fire & Electric DMG +15%',
      'Off-field EX Special & Assist DMG +20% · Continues 5s on-field',
    ])
    expect(MAIN_STAT_IDS_BY_AGENT_AND_SLOT.grace).toEqual({
      slot4: ['anomalyProficiency', 'atkPct'],
      slot5: ['penRatio', 'electricDmg', 'atkPct'],
      slot6: ['anomalyMastery'],
    })
    expect(SUBSTAT_CHOICES_BY_AGENT.grace).toEqual([
      { id: 'anomalyProficiency', label: 'Anomaly Proficiency', perHit: 9, unit: '' },
      { id: 'atkPct', label: 'ATK%', perHit: 3, unit: '%' },
    ])
    expect(REPRESENTATIVE_SETUP_BY_AGENT_AND_POOL.grace).toEqual({
      full: {
        engineId: 'timeweaver', fourPieceId: 'thunderMetal', twoPieceId: 'pufferElectro',
        mains: {
          slot4: 'anomalyProficiency', slot5: 'penRatio', slot6: 'anomalyMastery',
        },
      },
      nonLimited: {
        engineId: 'fusionCompiler', fourPieceId: 'thunderMetal', twoPieceId: 'pufferElectro',
        mains: {
          slot4: 'anomalyProficiency', slot5: 'penRatio', slot6: 'anomalyMastery',
        },
      },
    })
  })
})
