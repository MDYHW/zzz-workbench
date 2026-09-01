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
import shiningAriaImage from '../../assets/equipment/drive-discs/shining-aria.webp'
import notesFromTheChainedImage from '../../assets/equipment/drive-discs/notes-from-the-chained.webp'
import skyAblazeImage from '../../assets/equipment/drive-discs/the-sky-ablaze.webp'
import wutheringSalonImage from '../../assets/equipment/drive-discs/wuthering-salon.webp'
import {
  equipmentEffectBaseValue,
  equipmentEffectMaximumValue,
  type DiscId,
  type DriveDiscChoice,
  type DriveDiscFacts,
} from './types'

export const DRIVE_DISC_FACTS = {
  skyAblaze: {
    twoPiece: {
      etherDamage: { modifier: 'dmgBonus', unit: '%', value: 10, scope: { attributes: ['Ether'] } },
    },
    fourPiece: {
      critDamage: { modifier: 'critDmg', unit: '%', value: 30, scope: { attributes: ['Ether'] } },
      atk: {
        modifier: 'atk', unit: '%', value: 10,
        activation: { kind: 'trigger', actions: ['EX Special Attack', 'Ultimate'], durationSeconds: 30 },
      },
    },
  },
  wutheringSalon: {
    twoPiece: {
      windDamage: { modifier: 'dmgBonus', unit: '%', value: 10, scope: { attributes: ['Wind'] } },
    },
    fourPiece: {
      anomalyProficiency: {
        modifier: 'anomalyProficiency', unit: '',
        progression: { kind: 'stacks', perStack: 25, maxStacks: 2 },
        activation: { kind: 'trigger', performer: 'equipper', actions: ['EX Special Attack'], durationSeconds: 40 },
      },
      damage: {
        modifier: 'dmgBonus', unit: '%', value: 18,
        activation: { kind: 'trigger', performer: 'equipper', anomalyResult: 'Windswept', durationSeconds: 40 },
      },
    },
  },
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
    fourPiece: {
      critDamage: { modifier: 'critDmg', unit: '%', value: 30, activation: { kind: 'minimum-stat', statId: 'anomalyMastery', threshold: 115 } },
      critRate: { modifier: 'critRate', unit: '%', value: 12 },
    },
  },
  king: {
    twoPiece: {
      daze: { modifier: 'dazeBonus', unit: '%', value: 6 },
    },
    fourPiece: {
      critDamage: { modifier: 'critDmg', unit: '%', value: 15, progression: { kind: 'conditions', perCondition: 15, maxConditions: 1 }, scope: { recipient: 'squad' }, activation: { kind: 'minimum-stat', statId: 'critRate', threshold: 50 }, composition: 'highest-only' },
    },
  },
  swingJazz: {
    twoPiece: {
      energyRegen: { modifier: 'energyRegen', unit: '%', value: 20 },
    },
    fourPiece: {
      damage: { modifier: 'dmgBonus', unit: '%', value: 15, scope: { recipient: 'squad' }, composition: 'highest-only' },
    },
  },
  moonlight: {
    twoPiece: {
      energyRegen: { modifier: 'energyRegen', unit: '%', value: 20 },
    },
    fourPiece: {
      damage: { modifier: 'dmgBonus', unit: '%', value: 18, scope: { recipient: 'squad' }, composition: 'highest-only' },
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
      damage: { modifier: 'dmgBonus', unit: '%', value: 24, scope: { recipient: 'focus' }, composition: 'highest-only' },
    },
  },
  hormonePunk: {
    twoPiece: {
      atk: { modifier: 'atk', unit: '%', value: 10 },
    },
    fourPiece: {
      atk: { modifier: 'atk', unit: '%', value: 25, earliestSurface: 'combat' },
    },
  },
  infernoMetal: {
    twoPiece: {
      damage: { modifier: 'dmgBonus', unit: '%', value: 10, scope: { attributes: ['Fire'] } },
    },
    fourPiece: {
      critRate: { modifier: 'critRate', unit: '%', value: 28, activation: { kind: 'trigger', targetCondition: 'burningTarget' } },
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
    fourPiece: {
      damage: {
        modifier: 'dmgBonus', unit: '%', value: 20,
        earliestSurface: 'combat',
        progression: { kind: 'conditions', perCondition: 20, maxConditions: 1 },
        scope: { actions: ['Basic Attack', 'Dash Attack'] },
        activation: { kind: 'trigger', anomalyResult: 'Freeze' },
      },
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
        earliestSurface: 'fully',
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
      damage: { modifier: 'dmgBonus', unit: '%', value: 20, earliestSurface: 'initial', scope: { actions: ['Ultimate'] } },
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
        composition: 'highest-only',
      },
    },
  },
  whiteWaterBallad: {
    twoPiece: {
      physicalDamage: { modifier: 'dmgBonus', unit: '%', value: 10, scope: { attributes: ['Physical'] } },
    },
    fourPiece: {
      veilCritRate: {
        modifier: 'critRate', unit: '%', value: 10,
        activation: { kind: 'trigger', operation: 'etherVeil', performer: 'squad-member' },
      },
      attackVeilCritRate: {
        modifier: 'critRate', unit: '%', value: 10,
        activation: {
          kind: 'trigger', operation: 'etherVeil', performer: 'equipper',
          holderSpecialties: ['Attack'],
        },
      },
      attackVeilAtk: {
        modifier: 'atk', unit: '%', value: 10,
        activation: {
          kind: 'trigger', operation: 'etherVeil', performer: 'equipper',
          holderSpecialties: ['Attack'],
        },
      },
    },
  },
  chaosJazz: {
    twoPiece: {
      anomalyProficiency: { modifier: 'anomalyProficiency', unit: '', value: 30 },
    },
    fourPiece: {
      electricFireDamage: {
        modifier: 'dmgBonus', unit: '%', value: 15,
        earliestSurface: 'combat',
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
        scope: { recipient: 'enemy' },
        activation: { kind: 'trigger', actions: ['EX Special Attack'] },
        composition: 'highest-only',
      },
    },
  },
  phaethonsMelody: {
    twoPiece: {
      anomalyMastery: { modifier: 'anomalyMastery', unit: '%', value: 8 },
    },
    fourPiece: {
      anomalyProficiency: {
        modifier: 'anomalyProficiency', unit: '', value: 45,
        activation: { kind: 'trigger', actions: ['EX Special Attack'], performer: 'squad-member', durationSeconds: 8 },
      },
      otherHolderEtherDamage: {
        modifier: 'dmgBonus', unit: '%', value: 25,
        scope: { attributes: ['Ether'] },
        activation: { kind: 'trigger', actions: ['EX Special Attack'], performer: 'other-squad-member', durationSeconds: 8 },
      },
    },
  },
  shiningAria: {
    twoPiece: {
      damage: { modifier: 'dmgBonus', unit: '%', value: 10, scope: { attributes: ['Ether'] } },
    },
    fourPiece: {
      anomalyProficiency: {
        modifier: 'anomalyProficiency', unit: '', value: 36,
        activation: { kind: 'trigger', actions: ['Basic Attack'], durationSeconds: 8 },
      },
      stunnedTargetDamage: {
        modifier: 'dmgBonus', unit: '%', value: 25,
        scope: { condition: 'stunnedTarget' },
        activation: { kind: 'trigger', performer: 'squad-member', durationSeconds: 18 },
      },
    },
  },
  notesFromTheChained: {
    twoPiece: {
      damage: { modifier: 'dmgBonus', unit: '%', value: 10, scope: { attributes: ['Ice'] } },
    },
    fourPiece: {
      anomalyProficiency: {
        modifier: 'anomalyProficiency', unit: '', value: 48,
        activation: { kind: 'trigger', anomalyResult: 'Abloom', durationSeconds: 30 },
      },
      squadAnomalyDamage: {
        modifier: 'anomalyDmgBonus', unit: '%', value: 16,
        scope: { recipient: 'squad', anomalyResults: ['Attribute Anomaly', 'Disorder'] },
        activation: { kind: 'trigger', anomalyResult: 'Freeze', durationSeconds: 30 },
      },
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
  skyAblaze: {
    name: 'The Sky Ablaze', image: skyAblazeImage,
    twoPieceEffect: `Ether DMG +${equipmentEffectBaseValue(DRIVE_DISC_FACTS.skyAblaze.twoPiece.etherDamage)}%`,
    fourPieceEffects: [
      `CRIT DMG +${equipmentEffectBaseValue(DRIVE_DISC_FACTS.skyAblaze.fourPiece.critDamage)}%`,
      `ATK +${equipmentEffectBaseValue(DRIVE_DISC_FACTS.skyAblaze.fourPiece.atk)}%`,
    ],
  },
  wutheringSalon: {
    name: 'Wuthering Salon', image: wutheringSalonImage,
    twoPieceEffect: `Wind DMG +${equipmentEffectBaseValue(DRIVE_DISC_FACTS.wutheringSalon.twoPiece.windDamage)}%`,
    fourPieceEffects: [
      `Anomaly Proficiency +${equipmentEffectMaximumValue(DRIVE_DISC_FACTS.wutheringSalon.fourPiece.anomalyProficiency)}`,
      `DMG +${equipmentEffectBaseValue(DRIVE_DISC_FACTS.wutheringSalon.fourPiece.damage)}%`,
    ],
  },
  yunkui: {
    name: 'Yunkui Tales', image: yunkuiImage,
    twoPieceEffect: `HP +${equipmentEffectBaseValue(DRIVE_DISC_FACTS.yunkui.twoPiece.maxHp)}%`,
    fourPieceEffects: [
      `CRIT Rate +${equipmentEffectBaseValue(DRIVE_DISC_FACTS.yunkui.fourPiece.critRate)}%`,
      `Sheer DMG +${equipmentEffectBaseValue(DRIVE_DISC_FACTS.yunkui.fourPiece.sheerDamage)}%`,
    ],
  },
  woodpecker: {
    name: 'Woodpecker Electro', image: woodpeckerImage,
    twoPieceEffect: `CRIT Rate +${equipmentEffectBaseValue(DRIVE_DISC_FACTS.woodpecker.twoPiece.critRate)}%`,
    fourPieceEffects: [`ATK +${equipmentEffectBaseValue(DRIVE_DISC_FACTS.woodpecker.fourPiece.atk)}%`],
  },
  branchAndBlade: {
    name: 'Branch & Blade Song', image: branchAndBladeImage,
    twoPieceEffect: `CRIT DMG +${equipmentEffectBaseValue(DRIVE_DISC_FACTS.branchAndBlade.twoPiece.critDamage)}%`,
    fourPieceEffects: [
      `AM ≥ ${DRIVE_DISC_FACTS.branchAndBlade.fourPiece.critDamage.activation.threshold} · CRIT DMG +${equipmentEffectBaseValue(DRIVE_DISC_FACTS.branchAndBlade.fourPiece.critDamage)}%`,
      `CRIT Rate +${equipmentEffectBaseValue(DRIVE_DISC_FACTS.branchAndBlade.fourPiece.critRate)}%`,
    ],
  },
  king: {
    name: 'King of the Summit', image: kingImage,
    twoPieceEffect: `Daze +${equipmentEffectBaseValue(DRIVE_DISC_FACTS.king.twoPiece.daze)}%`,
    fourPieceEffects: [
      `Squad CRIT DMG +${equipmentEffectMaximumValue(DRIVE_DISC_FACTS.king.fourPiece.critDamage)}%`,
    ],
  },
  swingJazz: {
    name: 'Swing Jazz', image: swingJazzImage,
    twoPieceEffect: `Energy Regen +${equipmentEffectBaseValue(DRIVE_DISC_FACTS.swingJazz.twoPiece.energyRegen)}%`,
    fourPieceEffects: [`Squad DMG +${equipmentEffectBaseValue(DRIVE_DISC_FACTS.swingJazz.fourPiece.damage)}%`],
  },
  moonlight: {
    name: 'Moonlight Lullaby', image: moonlightImage,
    twoPieceEffect: `Energy Regen +${equipmentEffectBaseValue(DRIVE_DISC_FACTS.moonlight.twoPiece.energyRegen)}%`,
    fourPieceEffects: [`Squad DMG +${equipmentEffectBaseValue(DRIVE_DISC_FACTS.moonlight.fourPiece.damage)}%`],
  },
  shadowHarmony: {
    name: 'Shadow Harmony', image: shadowHarmonyImage,
    twoPieceEffect: `Aftershock & Dash Attack DMG +${equipmentEffectBaseValue(DRIVE_DISC_FACTS.shadowHarmony.twoPiece.damage)}%`,
    fourPieceEffects: [
      `ATK +${equipmentEffectBaseValue(DRIVE_DISC_FACTS.shadowHarmony.fourPiece.atk)}%`,
      `CRIT Rate +${equipmentEffectBaseValue(DRIVE_DISC_FACTS.shadowHarmony.fourPiece.critRate)}%`,
    ],
  },
  shockstar: {
    name: 'Shockstar Disco', image: shockstarImage,
    twoPieceEffect: `Impact +${equipmentEffectBaseValue(DRIVE_DISC_FACTS.shockstar.twoPiece.impact)}%`,
    fourPieceEffects: [`Basic Attack, Dash Attack & Dodge Counter Daze +${equipmentEffectBaseValue(DRIVE_DISC_FACTS.shockstar.fourPiece.daze)}%`],
  },
  astralVoice: {
    name: 'Astral Voice', image: astralVoiceImage,
    twoPieceEffect: `ATK +${equipmentEffectBaseValue(DRIVE_DISC_FACTS.astralVoice.twoPiece.atk)}%`,
    fourPieceEffects: [`Entrant DMG +${equipmentEffectBaseValue(DRIVE_DISC_FACTS.astralVoice.fourPiece.damage)}%`],
  },
  hormonePunk: {
    name: 'Hormone Punk', image: hormonePunkImage,
    twoPieceEffect: `ATK +${equipmentEffectBaseValue(DRIVE_DISC_FACTS.hormonePunk.twoPiece.atk)}%`,
    fourPieceEffects: [`ATK +${equipmentEffectBaseValue(DRIVE_DISC_FACTS.hormonePunk.fourPiece.atk)}%`],
  },
  infernoMetal: {
    name: 'Inferno Metal', image: infernoMetalImage,
    twoPieceEffect: `Fire DMG +${equipmentEffectBaseValue(DRIVE_DISC_FACTS.infernoMetal.twoPiece.damage)}%`,
    fourPieceEffects: [`Burning target · CRIT Rate +${equipmentEffectBaseValue(DRIVE_DISC_FACTS.infernoMetal.fourPiece.critRate)}%`],
  },
  fangedMetal: {
    name: 'Fanged Metal', image: fangedMetalImage,
    twoPieceEffect: `Physical DMG +${equipmentEffectBaseValue(DRIVE_DISC_FACTS.fangedMetal.twoPiece.damage)}%`,
    fourPieceEffects: [`Assaulted target · Holder DMG +${equipmentEffectBaseValue(DRIVE_DISC_FACTS.fangedMetal.fourPiece.assaultDamage)}%`],
  },
  polarMetal: {
    name: 'Polar Metal', image: polarMetalImage,
    twoPieceEffect: `Ice DMG +${equipmentEffectBaseValue(DRIVE_DISC_FACTS.polarMetal.twoPiece.damage)}%`,
    fourPieceEffects: [`Basic & Dash Attack DMG +${equipmentEffectMaximumValue(DRIVE_DISC_FACTS.polarMetal.fourPiece.damage)}%`],
  },
  thunderMetal: {
    name: 'Thunder Metal', image: thunderMetalImage,
    twoPieceEffect: `Electric DMG +${equipmentEffectBaseValue(DRIVE_DISC_FACTS.thunderMetal.twoPiece.damage)}%`,
    fourPieceEffects: [`ATK +${equipmentEffectBaseValue(DRIVE_DISC_FACTS.thunderMetal.fourPiece.atk)}%`],
  },
  chaoticMetal: {
    name: 'Chaotic Metal', image: chaoticMetalImage,
    twoPieceEffect: `Ether DMG +${equipmentEffectBaseValue(DRIVE_DISC_FACTS.chaoticMetal.twoPiece.damage)}%`,
    fourPieceEffects: [`CRIT DMG +${equipmentEffectMaximumValue(DRIVE_DISC_FACTS.chaoticMetal.fourPiece.critDamage)}%`],
  },
  dawnsBloom: {
    name: "Dawn's Bloom", image: dawnsBloomImage,
    twoPieceEffect: `Basic Attack DMG +${equipmentEffectBaseValue(DRIVE_DISC_FACTS.dawnsBloom.twoPiece.damage)}%`,
    fourPieceEffects: [
      `Basic Attack DMG +${equipmentEffectMaximumValue(DRIVE_DISC_FACTS.dawnsBloom.fourPiece.damage)}%`,
    ],
  },
  pufferElectro: {
    name: 'Puffer Electro', image: pufferElectroImage,
    twoPieceEffect: `PEN Ratio +${equipmentEffectBaseValue(DRIVE_DISC_FACTS.pufferElectro.twoPiece.penRatio)}%`,
    fourPieceEffects: [
      `Ultimate DMG +${equipmentEffectBaseValue(DRIVE_DISC_FACTS.pufferElectro.fourPiece.damage)}%`,
      `ATK +${equipmentEffectBaseValue(DRIVE_DISC_FACTS.pufferElectro.fourPiece.atk)}%`,
    ],
  },
  bunnyInWonderland: {
    name: 'Bunny in Wonderland', image: bunnyInWonderlandImage,
    twoPieceEffect: `HP +${equipmentEffectBaseValue(DRIVE_DISC_FACTS.bunnyInWonderland.twoPiece.maxHp)}%`,
    fourPieceEffects: [
      `Squad DMG +${equipmentEffectMaximumValue(DRIVE_DISC_FACTS.bunnyInWonderland.fourPiece.damage)}%`,
    ],
  },
  whiteWaterBallad: {
    name: 'White Water Ballad', image: whiteWaterBalladImage,
    twoPieceEffect: `Physical DMG +${equipmentEffectBaseValue(DRIVE_DISC_FACTS.whiteWaterBallad.twoPiece.physicalDamage)}%`,
    fourPieceEffects: [
      `CRIT Rate +${equipmentEffectBaseValue(DRIVE_DISC_FACTS.whiteWaterBallad.fourPiece.veilCritRate)
        + equipmentEffectBaseValue(DRIVE_DISC_FACTS.whiteWaterBallad.fourPiece.attackVeilCritRate)}%`,
      `ATK +${equipmentEffectBaseValue(DRIVE_DISC_FACTS.whiteWaterBallad.fourPiece.attackVeilAtk)}%`,
    ],
  },
  chaosJazz: {
    name: 'Chaos Jazz', image: chaosJazzImage,
    twoPieceEffect: `Anomaly Proficiency +${equipmentEffectBaseValue(DRIVE_DISC_FACTS.chaosJazz.twoPiece.anomalyProficiency)}`,
    fourPieceEffects: [
      `Fire & Electric DMG +${equipmentEffectBaseValue(DRIVE_DISC_FACTS.chaosJazz.fourPiece.electricFireDamage)}%`,
      `EX Special & Assist DMG +${equipmentEffectBaseValue(DRIVE_DISC_FACTS.chaosJazz.fourPiece.offFieldActionDamage)}%`,
    ],
  },
  freedomBlues: {
    name: 'Freedom Blues', image: freedomBluesImage,
    twoPieceEffect: `Anomaly Proficiency +${equipmentEffectBaseValue(DRIVE_DISC_FACTS.freedomBlues.twoPiece.anomalyProficiency)}`,
    fourPieceEffects: [
      `Matching-Attribute Anomaly Buildup RES -${equipmentEffectBaseValue(DRIVE_DISC_FACTS.freedomBlues.fourPiece.buildupResReduction)}% · Non-stacking by Attribute`,
    ],
    fourPieceEffectsForHolder: (holderAttribute) => [
      `${holderAttribute} Anomaly Buildup RES -${equipmentEffectBaseValue(DRIVE_DISC_FACTS.freedomBlues.fourPiece.buildupResReduction)}%`,
    ],
  },
  phaethonsMelody: {
    name: "Phaethon's Melody", image: phaethonsMelodyImage,
    twoPieceEffect: `Anomaly Mastery +${equipmentEffectBaseValue(DRIVE_DISC_FACTS.phaethonsMelody.twoPiece.anomalyMastery)}%`,
    fourPieceEffects: [
      `Anomaly Proficiency +${equipmentEffectBaseValue(DRIVE_DISC_FACTS.phaethonsMelody.fourPiece.anomalyProficiency)}`,
      `Ether DMG +${equipmentEffectBaseValue(DRIVE_DISC_FACTS.phaethonsMelody.fourPiece.otherHolderEtherDamage)}%`,
    ],
  },
  shiningAria: {
    name: 'Shining Aria', image: shiningAriaImage,
    twoPieceEffect: `Ether DMG +${equipmentEffectBaseValue(DRIVE_DISC_FACTS.shiningAria.twoPiece.damage)}%`,
    fourPieceEffects: [
      `Anomaly Proficiency +${equipmentEffectBaseValue(DRIVE_DISC_FACTS.shiningAria.fourPiece.anomalyProficiency)}`,
      `Stunned target DMG +${equipmentEffectBaseValue(DRIVE_DISC_FACTS.shiningAria.fourPiece.stunnedTargetDamage)}%`,
    ],
  },
  notesFromTheChained: {
    name: 'Notes From the Chained', image: notesFromTheChainedImage,
    twoPieceEffect: `Ice DMG +${equipmentEffectBaseValue(DRIVE_DISC_FACTS.notesFromTheChained.twoPiece.damage)}%`,
    fourPieceEffects: [
      `Anomaly Proficiency +${equipmentEffectBaseValue(DRIVE_DISC_FACTS.notesFromTheChained.fourPiece.anomalyProficiency)}`,
      `Squad Attribute Anomaly & Disorder DMG +${equipmentEffectBaseValue(DRIVE_DISC_FACTS.notesFromTheChained.fourPiece.squadAnomalyDamage)}%`,
    ],
  },
}

export const SAME_EFFECT_TWO_PIECE_RELATIONSHIPS = [
  { members: ['hormonePunk', 'astralVoice'], canonical: 'hormonePunk' },
  { members: ['swingJazz', 'moonlight'], canonical: 'swingJazz' },
  { members: ['whiteWaterBallad', 'fangedMetal'], canonical: 'whiteWaterBallad' },
  { members: ['bunnyInWonderland', 'yunkui'], canonical: 'bunnyInWonderland' },
  { members: ['freedomBlues', 'chaosJazz'], canonical: 'freedomBlues' },
  { members: ['chaoticMetal', 'shiningAria'], canonical: 'chaoticMetal' },
] as const satisfies readonly {
  members: readonly [DiscId, DiscId]
  canonical: DiscId
}[]
