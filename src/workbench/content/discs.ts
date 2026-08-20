import astralVoiceImage from '../../assets/equipment/drive-discs/astral-voice.webp'
import branchAndBladeImage from '../../assets/equipment/drive-discs/branch-and-blade-song.webp'
import bunnyInWonderlandImage from '../../assets/equipment/drive-discs/bunny-in-wonderland.webp'
import chaoticMetalImage from '../../assets/equipment/drive-discs/chaotic-metal.webp'
import dawnsBloomImage from '../../assets/equipment/drive-discs/dawns-bloom.webp'
import hormonePunkImage from '../../assets/equipment/drive-discs/hormone-punk.webp'
import infernoMetalImage from '../../assets/equipment/drive-discs/inferno-metal.webp'
import fangedMetalImage from '../../assets/equipment/drive-discs/fanged-metal.webp'
import polarMetalImage from '../../assets/equipment/drive-discs/polar-metal.webp'
import kingImage from '../../assets/equipment/drive-discs/king-of-the-summit.webp'
import moonlightImage from '../../assets/equipment/drive-discs/moonlight-lullaby.webp'
import pufferElectroImage from '../../assets/equipment/drive-discs/puffer-electro.webp'
import shadowHarmonyImage from '../../assets/equipment/drive-discs/shadow-harmony.webp'
import shockstarImage from '../../assets/equipment/drive-discs/shockstar-disco.webp'
import swingJazzImage from '../../assets/equipment/drive-discs/swing-jazz.webp'
import thunderMetalImage from '../../assets/equipment/drive-discs/thunder-metal.webp'
import woodpeckerImage from '../../assets/equipment/drive-discs/woodpecker-electro.webp'
import yunkuiImage from '../../assets/equipment/drive-discs/yunkui-tales.webp'
import whiteWaterBalladImage from '../../assets/equipment/drive-discs/white-water-ballad.webp'
import chaosJazzImage from '../../assets/equipment/drive-discs/chaos-jazz.webp'
import freedomBluesImage from '../../assets/equipment/drive-discs/freedom-blues.webp'
import phaethonsMelodyImage from '../../assets/equipment/drive-discs/phaethons-melody.webp'
import {
  equipmentEffectBaseValue,
  equipmentEffectMaximumValue,
  type AgentId,
  type DiscId,
  type DriveDiscChoice,
  type DriveDiscFacts,
} from './types'

export const DRIVE_DISC_FACTS = {
  yunkui: {
    twoPiece: {
      maxHp: { modifier: 'maxHp', unit: '%', value: 10 },
    },
    fourPiece: {
      critRate: { modifier: 'critRate', unit: '%', value: 12 },
      sheerDamage: { modifier: 'sheerDmgBonus', unit: '%', value: 10 },
    },
  },
  woodpecker: {
    twoPiece: {
      critRate: { modifier: 'critRate', unit: '%', value: 8 },
    },
    fourPiece: {
      atk: { modifier: 'atk', unit: '%', value: 27 },
    },
  },
  branchAndBlade: {
    twoPiece: {
      critDamage: { modifier: 'critDmg', unit: '%', value: 16 },
    },
  },
  king: {
    twoPiece: {
      daze: { modifier: 'dazeBonus', unit: '%', value: 6 },
    },
    fourPiece: {
      critDamage: { modifier: 'critDmg', unit: '%', value: 15, progression: { kind: 'conditions', perCondition: 15, maxConditions: 1 }, scope: { recipient: 'squad' } },
    },
  },
  swingJazz: {
    twoPiece: {
      energyRegen: { modifier: 'energyRegen', unit: '%', value: 20 },
    },
    fourPiece: {
      damage: { modifier: 'dmgBonus', unit: '%', value: 15, scope: { recipient: 'squad' } },
    },
  },
  moonlight: {
    twoPiece: {
      energyRegen: { modifier: 'energyRegen', unit: '%', value: 20 },
    },
    fourPiece: {
      damage: { modifier: 'dmgBonus', unit: '%', value: 18, scope: { recipient: 'squad' } },
    },
  },
  shadowHarmony: {
    twoPiece: {
      damage: { modifier: 'dmgBonus', unit: '%', value: 15, scope: { actions: ['Dash Attack'], tags: ['aftershock'] } },
    },
    fourPiece: {
      atk: { modifier: 'atk', unit: '%', value: 12 },
      critRate: { modifier: 'critRate', unit: '%', value: 12 },
    },
  },
  shockstar: {
    twoPiece: {
      impact: { modifier: 'impact', unit: '%', value: 6 },
    },
    fourPiece: {
      daze: { modifier: 'dazeBonus', unit: '%', value: 20, scope: { actions: ['Basic Attack', 'Dash Attack', 'Dodge Counter'] } },
    },
  },
  astralVoice: {
    twoPiece: {
      atk: { modifier: 'atk', unit: '%', value: 10 },
    },
    fourPiece: {
      damage: { modifier: 'dmgBonus', unit: '%', value: 24, scope: { recipient: 'squad' } },
    },
  },
  hormonePunk: {
    twoPiece: {
      atk: { modifier: 'atk', unit: '%', value: 10 },
    },
    fourPiece: {
      atk: { modifier: 'atk', unit: '%', value: 25 },
    },
  },
  infernoMetal: {
    twoPiece: {
      damage: { modifier: 'dmgBonus', unit: '%', value: 10, scope: { attributes: ['Fire'] } },
    },
  },
  fangedMetal: {
    twoPiece: {
      damage: { modifier: 'dmgBonus', unit: '%', value: 10, scope: { attributes: ['Physical'] } },
    },
    fourPiece: {
      assaultDamage: { modifier: 'dmgBonus', unit: '%', value: 35 },
    },
  },
  polarMetal: {
    twoPiece: {
      damage: { modifier: 'dmgBonus', unit: '%', value: 10, scope: { attributes: ['Ice'] } },
    },
  },
  thunderMetal: {
    twoPiece: {
      damage: { modifier: 'dmgBonus', unit: '%', value: 10, scope: { attributes: ['Electric'] } },
    },
    fourPiece: {
      atk: { modifier: 'atk', unit: '%', value: 28 },
    },
  },
  chaoticMetal: {
    twoPiece: {
      damage: { modifier: 'dmgBonus', unit: '%', value: 10, scope: { attributes: ['Ether'] } },
    },
    fourPiece: {
      critDamage: {
        modifier: 'critDmg', unit: '%', value: 20,
        progression: { kind: 'stacks', perStack: 5.5, maxStacks: 6 },
      },
    },
  },
  dawnsBloom: {
    twoPiece: {
      damage: { modifier: 'dmgBonus', unit: '%', value: 15, scope: { actions: ['Basic Attack'] } },
    },
    fourPiece: {
      damage: { modifier: 'dmgBonus', unit: '%', value: 20, progression: { kind: 'conditions', perCondition: 20, maxConditions: 1 }, scope: { actions: ['Basic Attack'] } },
    },
  },
  pufferElectro: {
    twoPiece: {
      penRatio: { modifier: 'penRatio', unit: '%', value: 8 },
    },
    fourPiece: {
      damage: { modifier: 'dmgBonus', unit: '%', value: 20, scope: { actions: ['Ultimate'] } },
      atk: { modifier: 'atk', unit: '%', value: 15 },
    },
  },
  bunnyInWonderland: {
    twoPiece: {
      maxHp: { modifier: 'maxHp', unit: '%', value: 10 },
    },
    fourPiece: {
      damage: {
        modifier: 'dmgBonus',
        unit: '%',
        progression: { kind: 'stacks', perStack: 6, maxStacks: 3 },
        scope: { recipient: 'squad' },
      },
    },
  },
  whiteWaterBallad: {
    twoPiece: {
      physicalDamage: { modifier: 'dmgBonus', unit: '%', value: 10, scope: { attributes: ['Physical'] } },
    },
    fourPiece: {
      veilCritRate: { modifier: 'critRate', unit: '%', value: 10 },
      attackVeilCritRate: { modifier: 'critRate', unit: '%', value: 10 },
      attackVeilAtk: { modifier: 'atk', unit: '%', value: 10 },
    },
  },
  chaosJazz: {
    twoPiece: {
      anomalyProficiency: { modifier: 'anomalyProficiency', unit: '', value: 30 },
    },
    fourPiece: {
      electricFireDamage: {
        modifier: 'dmgBonus', unit: '%', value: 15,
        scope: { attributes: ['Electric', 'Fire'] },
      },
      offFieldActionDamage: {
        modifier: 'dmgBonus', unit: '%', value: 20,
        scope: { actions: ['EX Special Attack', 'Assist'] },
      },
    },
  },
  freedomBlues: {
    twoPiece: {
      anomalyProficiency: { modifier: 'anomalyProficiency', unit: '', value: 30 },
    },
    fourPiece: {
      buildupResReduction: {
        modifier: 'anomalyBuildupResReduction', unit: '%', value: 20,
      },
    },
  },
  phaethonsMelody: {
    twoPiece: {
      anomalyMastery: { modifier: 'anomalyMastery', unit: '%', value: 8 },
    },
  },
} as const satisfies Record<DiscId, DriveDiscFacts>

/** Exact authored piece and effect fields for one admitted Drive Disc. */
export type DriveDiscFactContract<Id extends DiscId> = (typeof DRIVE_DISC_FACTS)[Id]
export type DriveDiscPiece<Id extends DiscId> = Extract<
  keyof DriveDiscFactContract<Id>,
  'twoPiece' | 'fourPiece'
>
export type DriveDiscEffectField<
  Id extends DiscId,
  Piece extends DriveDiscPiece<Id>,
> = keyof DriveDiscFactContract<Id>[Piece]

export const DRIVE_DISCS: Record<DiscId, DriveDiscChoice> = {
  yunkui: {
    id: 'yunkui', name: 'Yunkui Tales', image: yunkuiImage,
    twoPieceEffect: `HP +${equipmentEffectBaseValue(DRIVE_DISC_FACTS.yunkui.twoPiece.maxHp)}%`,
    fourPieceEffects: [
      `CRIT Rate +${equipmentEffectBaseValue(DRIVE_DISC_FACTS.yunkui.fourPiece.critRate)}%`,
      `Sheer DMG +${equipmentEffectBaseValue(DRIVE_DISC_FACTS.yunkui.fourPiece.sheerDamage)}%`,
    ],
  },
  woodpecker: {
    id: 'woodpecker', name: 'Woodpecker Electro', image: woodpeckerImage,
    twoPieceEffect: `CRIT Rate +${equipmentEffectBaseValue(DRIVE_DISC_FACTS.woodpecker.twoPiece.critRate)}%`,
    fourPieceEffects: [`ATK +${equipmentEffectBaseValue(DRIVE_DISC_FACTS.woodpecker.fourPiece.atk)}%`],
  },
  branchAndBlade: {
    id: 'branchAndBlade', name: 'Branch & Blade Song', image: branchAndBladeImage,
    twoPieceEffect: `CRIT DMG +${equipmentEffectBaseValue(DRIVE_DISC_FACTS.branchAndBlade.twoPiece.critDamage)}%`,
  },
  king: {
    id: 'king', name: 'King of the Summit', image: kingImage,
    twoPieceEffect: `Daze +${equipmentEffectBaseValue(DRIVE_DISC_FACTS.king.twoPiece.daze)}%`,
    fourPieceEffects: [
      `Squad CRIT DMG +${equipmentEffectMaximumValue(DRIVE_DISC_FACTS.king.fourPiece.critDamage)}%`,
    ],
  },
  swingJazz: {
    id: 'swingJazz', name: 'Swing Jazz', image: swingJazzImage,
    twoPieceEffect: `Energy Regen +${equipmentEffectBaseValue(DRIVE_DISC_FACTS.swingJazz.twoPiece.energyRegen)}%`,
    fourPieceEffects: [`Squad DMG +${equipmentEffectBaseValue(DRIVE_DISC_FACTS.swingJazz.fourPiece.damage)}%`],
  },
  moonlight: {
    id: 'moonlight', name: 'Moonlight Lullaby', image: moonlightImage,
    twoPieceEffect: `Energy Regen +${equipmentEffectBaseValue(DRIVE_DISC_FACTS.moonlight.twoPiece.energyRegen)}%`,
    fourPieceEffects: [`Squad DMG +${equipmentEffectBaseValue(DRIVE_DISC_FACTS.moonlight.fourPiece.damage)}%`],
  },
  shadowHarmony: {
    id: 'shadowHarmony', name: 'Shadow Harmony', image: shadowHarmonyImage,
    twoPieceEffect: `Aftershock & Dash Attack DMG +${equipmentEffectBaseValue(DRIVE_DISC_FACTS.shadowHarmony.twoPiece.damage)}%`,
    fourPieceEffects: [
      `ATK +${equipmentEffectBaseValue(DRIVE_DISC_FACTS.shadowHarmony.fourPiece.atk)}%`,
      `CRIT Rate +${equipmentEffectBaseValue(DRIVE_DISC_FACTS.shadowHarmony.fourPiece.critRate)}%`,
    ],
  },
  shockstar: {
    id: 'shockstar', name: 'Shockstar Disco', image: shockstarImage,
    twoPieceEffect: `Impact +${equipmentEffectBaseValue(DRIVE_DISC_FACTS.shockstar.twoPiece.impact)}%`,
    fourPieceEffects: [`Basic Attack, Dash Attack & Dodge Counter Daze +${equipmentEffectBaseValue(DRIVE_DISC_FACTS.shockstar.fourPiece.daze)}%`],
  },
  astralVoice: {
    id: 'astralVoice', name: 'Astral Voice', image: astralVoiceImage,
    twoPieceEffect: `ATK +${equipmentEffectBaseValue(DRIVE_DISC_FACTS.astralVoice.twoPiece.atk)}%`,
    fourPieceEffects: [`Entrant DMG +${equipmentEffectBaseValue(DRIVE_DISC_FACTS.astralVoice.fourPiece.damage)}%`],
  },
  hormonePunk: {
    id: 'hormonePunk', name: 'Hormone Punk', image: hormonePunkImage,
    twoPieceEffect: `ATK +${equipmentEffectBaseValue(DRIVE_DISC_FACTS.hormonePunk.twoPiece.atk)}%`,
    fourPieceEffects: [`ATK +${equipmentEffectBaseValue(DRIVE_DISC_FACTS.hormonePunk.fourPiece.atk)}%`],
  },
  infernoMetal: {
    id: 'infernoMetal', name: 'Inferno Metal', image: infernoMetalImage,
    twoPieceEffect: `Fire DMG +${equipmentEffectBaseValue(DRIVE_DISC_FACTS.infernoMetal.twoPiece.damage)}%`,
  },
  fangedMetal: {
    id: 'fangedMetal', name: 'Fanged Metal', image: fangedMetalImage,
    twoPieceEffect: `Physical DMG +${equipmentEffectBaseValue(DRIVE_DISC_FACTS.fangedMetal.twoPiece.damage)}%`,
    fourPieceEffects: [`Assaulted target · Holder DMG +${equipmentEffectBaseValue(DRIVE_DISC_FACTS.fangedMetal.fourPiece.assaultDamage)}%`],
  },
  polarMetal: {
    id: 'polarMetal', name: 'Polar Metal', image: polarMetalImage,
    twoPieceEffect: `Ice DMG +${equipmentEffectBaseValue(DRIVE_DISC_FACTS.polarMetal.twoPiece.damage)}%`,
  },
  thunderMetal: {
    id: 'thunderMetal', name: 'Thunder Metal', image: thunderMetalImage,
    twoPieceEffect: `Electric DMG +${equipmentEffectBaseValue(DRIVE_DISC_FACTS.thunderMetal.twoPiece.damage)}%`,
    fourPieceEffects: [`ATK +${equipmentEffectBaseValue(DRIVE_DISC_FACTS.thunderMetal.fourPiece.atk)}%`],
  },
  chaoticMetal: {
    id: 'chaoticMetal', name: 'Chaotic Metal', image: chaoticMetalImage,
    twoPieceEffect: `Ether DMG +${equipmentEffectBaseValue(DRIVE_DISC_FACTS.chaoticMetal.twoPiece.damage)}%`,
    fourPieceEffects: [`CRIT DMG +${equipmentEffectMaximumValue(DRIVE_DISC_FACTS.chaoticMetal.fourPiece.critDamage)}%`],
  },
  dawnsBloom: {
    id: 'dawnsBloom', name: "Dawn's Bloom", image: dawnsBloomImage,
    twoPieceEffect: `Basic Attack DMG +${equipmentEffectBaseValue(DRIVE_DISC_FACTS.dawnsBloom.twoPiece.damage)}%`,
    fourPieceEffects: [
      `Basic Attack DMG +${equipmentEffectMaximumValue(DRIVE_DISC_FACTS.dawnsBloom.fourPiece.damage)}%`,
    ],
  },
  pufferElectro: {
    id: 'pufferElectro', name: 'Puffer Electro', image: pufferElectroImage,
    twoPieceEffect: `PEN Ratio +${equipmentEffectBaseValue(DRIVE_DISC_FACTS.pufferElectro.twoPiece.penRatio)}%`,
    fourPieceEffects: [
      `Ultimate DMG +${equipmentEffectBaseValue(DRIVE_DISC_FACTS.pufferElectro.fourPiece.damage)}%`,
      `ATK +${equipmentEffectBaseValue(DRIVE_DISC_FACTS.pufferElectro.fourPiece.atk)}%`,
    ],
  },
  bunnyInWonderland: {
    id: 'bunnyInWonderland', name: 'Bunny in Wonderland', image: bunnyInWonderlandImage,
    twoPieceEffect: `HP +${equipmentEffectBaseValue(DRIVE_DISC_FACTS.bunnyInWonderland.twoPiece.maxHp)}%`,
    fourPieceEffects: [
      `Squad DMG +${equipmentEffectMaximumValue(DRIVE_DISC_FACTS.bunnyInWonderland.fourPiece.damage)}%`,
    ],
  },
  whiteWaterBallad: {
    id: 'whiteWaterBallad', name: 'White Water Ballad', image: whiteWaterBalladImage,
    twoPieceEffect: `Physical DMG +${equipmentEffectBaseValue(DRIVE_DISC_FACTS.whiteWaterBallad.twoPiece.physicalDamage)}%`,
    fourPieceEffects: [
      `CRIT Rate +${equipmentEffectBaseValue(DRIVE_DISC_FACTS.whiteWaterBallad.fourPiece.veilCritRate)
        + equipmentEffectBaseValue(DRIVE_DISC_FACTS.whiteWaterBallad.fourPiece.attackVeilCritRate)}%`,
      `ATK +${equipmentEffectBaseValue(DRIVE_DISC_FACTS.whiteWaterBallad.fourPiece.attackVeilAtk)}%`,
    ],
  },
  chaosJazz: {
    id: 'chaosJazz', name: 'Chaos Jazz', image: chaosJazzImage,
    twoPieceEffect: `Anomaly Proficiency +${equipmentEffectBaseValue(DRIVE_DISC_FACTS.chaosJazz.twoPiece.anomalyProficiency)}`,
    fourPieceEffects: [
      `Fire & Electric DMG +${equipmentEffectBaseValue(DRIVE_DISC_FACTS.chaosJazz.fourPiece.electricFireDamage)}%`,
      `EX Special & Assist DMG +${equipmentEffectBaseValue(DRIVE_DISC_FACTS.chaosJazz.fourPiece.offFieldActionDamage)}%`,
    ],
  },
  freedomBlues: {
    id: 'freedomBlues', name: 'Freedom Blues', image: freedomBluesImage,
    twoPieceEffect: `Anomaly Proficiency +${equipmentEffectBaseValue(DRIVE_DISC_FACTS.freedomBlues.twoPiece.anomalyProficiency)}`,
    fourPieceEffects: [
      `Matching-Attribute Anomaly Buildup RES -${equipmentEffectBaseValue(DRIVE_DISC_FACTS.freedomBlues.fourPiece.buildupResReduction)}% · Non-stacking by Attribute`,
    ],
    fourPieceEffectsForHolder: (holderAttribute) => [
      `${holderAttribute} Anomaly Buildup RES -${equipmentEffectBaseValue(DRIVE_DISC_FACTS.freedomBlues.fourPiece.buildupResReduction)}%`,
    ],
  },
  phaethonsMelody: {
    id: 'phaethonsMelody', name: "Phaethon's Melody", image: phaethonsMelodyImage,
    twoPieceEffect: `Anomaly Mastery +${equipmentEffectBaseValue(DRIVE_DISC_FACTS.phaethonsMelody.twoPiece.anomalyMastery)}%`,
  },
}

export const SAME_EFFECT_TWO_PIECE_RELATIONSHIPS = [
  { members: ['hormonePunk', 'astralVoice'], canonical: 'hormonePunk' },
  { members: ['swingJazz', 'moonlight'], canonical: 'swingJazz' },
  { members: ['whiteWaterBallad', 'fangedMetal'], canonical: 'whiteWaterBallad' },
  { members: ['bunnyInWonderland', 'yunkui'], canonical: 'bunnyInWonderland' },
  { members: ['freedomBlues', 'chaosJazz'], canonical: 'freedomBlues' },
] as const satisfies readonly {
  members: readonly [DiscId, DiscId]
  canonical: DiscId
}[]

export const DISC_IDS_BY_AGENT_AND_PIECE: Record<
  AgentId,
  { fourPiece: DiscId[]; twoPiece: DiscId[] }
> = {
  yixuan: { fourPiece: ['yunkui'], twoPiece: ['woodpecker', 'branchAndBlade', 'chaoticMetal'] },
  yidhari: { fourPiece: ['yunkui'], twoPiece: ['woodpecker', 'branchAndBlade', 'polarMetal'] },
  manato: { fourPiece: ['yunkui'], twoPiece: ['woodpecker', 'branchAndBlade', 'infernoMetal'] },
  hugo: {
    fourPiece: ['hormonePunk'],
    twoPiece: ['polarMetal', 'woodpecker', 'branchAndBlade', 'pufferElectro', 'astralVoice', 'hormonePunk'],
  },
  juFufu: {
    fourPiece: ['king', 'swingJazz'],
    twoPiece: ['shockstar', 'king', 'hormonePunk', 'astralVoice', 'swingJazz', 'moonlight'],
  },
  panYinhu: {
    fourPiece: ['astralVoice', 'bunnyInWonderland'],
    twoPiece: ['swingJazz', 'moonlight', 'astralVoice', 'hormonePunk'],
  },
  banyue: {
    fourPiece: ['yunkui'],
    twoPiece: ['woodpecker', 'branchAndBlade', 'infernoMetal'],
  },
  starlightBilly: {
    fourPiece: ['yunkui'],
    twoPiece: ['woodpecker', 'branchAndBlade', 'fangedMetal'],
  },
  dialyn: { fourPiece: ['king'], twoPiece: ['woodpecker', 'swingJazz'] },
  lucia: { fourPiece: ['moonlight'], twoPiece: ['yunkui', 'swingJazz'] },
  anbySoldier0: { fourPiece: ['shadowHarmony'], twoPiece: ['woodpecker', 'branchAndBlade', 'pufferElectro', 'thunderMetal', 'hormonePunk'] },
  trigger: { fourPiece: ['king', 'astralVoice', 'shockstar'], twoPiece: ['shockstar', 'king', 'woodpecker', 'swingJazz'] },
  astraYao: { fourPiece: ['astralVoice', 'moonlight'], twoPiece: ['moonlight', 'swingJazz', 'hormonePunk', 'astralVoice'] },
  seed: { fourPiece: ['dawnsBloom', 'woodpecker'], twoPiece: ['woodpecker', 'branchAndBlade', 'pufferElectro', 'thunderMetal', 'hormonePunk'] },
  cissia: { fourPiece: ['dawnsBloom'], twoPiece: ['swingJazz', 'woodpecker', 'branchAndBlade', 'thunderMetal', 'hormonePunk', 'astralVoice'] },
  evelyn: { fourPiece: ['hormonePunk', 'woodpecker'], twoPiece: ['branchAndBlade', 'infernoMetal', 'woodpecker', 'pufferElectro', 'hormonePunk', 'astralVoice'] },
  corin: { fourPiece: ['hormonePunk'], twoPiece: ['woodpecker', 'branchAndBlade', 'fangedMetal', 'astralVoice', 'hormonePunk'] },
  lycaon: { fourPiece: ['king', 'astralVoice', 'shockstar'], twoPiece: ['shockstar', 'king', 'swingJazz'] },
  ellen: { fourPiece: ['woodpecker'], twoPiece: ['pufferElectro', 'polarMetal', 'woodpecker', 'branchAndBlade', 'astralVoice', 'hormonePunk'] },
  soukaku: { fourPiece: ['moonlight', 'astralVoice'], twoPiece: ['swingJazz', 'moonlight', 'hormonePunk', 'astralVoice'] },
  soldier11: {
    fourPiece: ['woodpecker', 'dawnsBloom'],
    twoPiece: ['infernoMetal', 'woodpecker', 'branchAndBlade', 'dawnsBloom', 'pufferElectro', 'hormonePunk', 'astralVoice'],
  },
  lighter: {
    fourPiece: ['king', 'astralVoice', 'shockstar'], twoPiece: ['shockstar', 'king', 'swingJazz'],
  },
  lucy: {
    fourPiece: ['moonlight', 'astralVoice'], twoPiece: ['swingJazz', 'moonlight', 'hormonePunk', 'astralVoice'],
  },
  zhuYuan: {
    fourPiece: ['chaoticMetal', 'woodpecker'],
    twoPiece: ['chaoticMetal', 'woodpecker', 'branchAndBlade', 'dawnsBloom', 'pufferElectro', 'hormonePunk', 'astralVoice'],
  },
  nicole: {
    fourPiece: ['moonlight', 'astralVoice'],
    twoPiece: ['swingJazz', 'moonlight'],
  },
  orphie: {
    fourPiece: ['shadowHarmony', 'astralVoice'],
    twoPiece: ['shadowHarmony', 'infernoMetal', 'woodpecker', 'branchAndBlade', 'hormonePunk', 'astralVoice', 'swingJazz', 'moonlight'],
  },
  pulchra: {
    fourPiece: ['king', 'astralVoice', 'swingJazz'],
    twoPiece: ['shockstar', 'king', 'swingJazz'],
  },
  harumasa: {
    fourPiece: ['shadowHarmony', 'thunderMetal', 'woodpecker', 'hormonePunk'],
    twoPiece: ['shadowHarmony', 'thunderMetal', 'woodpecker', 'branchAndBlade', 'hormonePunk', 'astralVoice', 'pufferElectro'],
  },
  qingyi: {
    fourPiece: ['king', 'shockstar', 'swingJazz'],
    twoPiece: ['shockstar', 'king', 'swingJazz'],
  },
  nekomata: {
    fourPiece: ['woodpecker'],
    twoPiece: ['woodpecker', 'branchAndBlade', 'fangedMetal', 'pufferElectro', 'hormonePunk', 'astralVoice'],
  },
  billy: {
    fourPiece: ['woodpecker', 'shadowHarmony'],
    twoPiece: ['shadowHarmony', 'woodpecker', 'branchAndBlade', 'fangedMetal', 'pufferElectro', 'hormonePunk', 'astralVoice'],
  },
  ben: {
    fourPiece: ['woodpecker', 'astralVoice', 'bunnyInWonderland', 'swingJazz'],
    twoPiece: ['woodpecker', 'branchAndBlade', 'infernoMetal', 'pufferElectro', 'hormonePunk', 'astralVoice', 'swingJazz', 'moonlight'],
  },
  koleda: {
    fourPiece: ['king', 'astralVoice', 'shockstar', 'swingJazz'],
    twoPiece: ['shockstar', 'king', 'swingJazz'],
  },
  anby: {
    fourPiece: ['king', 'astralVoice', 'shockstar', 'swingJazz'],
    twoPiece: ['shockstar', 'king', 'swingJazz'],
  },
  caesar: {
    fourPiece: ['bunnyInWonderland'],
    twoPiece: ['swingJazz', 'shockstar', 'king'],
  },
  yeShunguang: {
    fourPiece: ['whiteWaterBallad', 'woodpecker', 'hormonePunk'],
    twoPiece: [
      'whiteWaterBallad', 'fangedMetal', 'woodpecker', 'branchAndBlade',
      'pufferElectro', 'hormonePunk', 'astralVoice',
    ],
  },
  zhao: {
    fourPiece: ['bunnyInWonderland', 'astralVoice'],
    twoPiece: ['bunnyInWonderland', 'yunkui', 'swingJazz', 'moonlight', 'astralVoice', 'hormonePunk'],
  },
  grace: {
    fourPiece: ['thunderMetal', 'chaosJazz', 'freedomBlues'],
    twoPiece: [
      'pufferElectro', 'phaethonsMelody', 'freedomBlues', 'chaosJazz',
      'hormonePunk', 'astralVoice',
    ],
  },
  piper: {
    fourPiece: ['fangedMetal', 'freedomBlues'],
    twoPiece: ['phaethonsMelody', 'freedomBlues', 'chaosJazz', 'fangedMetal', 'whiteWaterBallad', 'pufferElectro', 'hormonePunk', 'astralVoice'],
  },
}
