import branchAndBladeImage from '../assets/equipment/drive-discs/branch-and-blade-song.webp'
import kingImage from '../assets/equipment/drive-discs/king-of-the-summit.webp'
import moonlightImage from '../assets/equipment/drive-discs/moonlight-lullaby.webp'
import swingJazzImage from '../assets/equipment/drive-discs/swing-jazz.webp'
import woodpeckerImage from '../assets/equipment/drive-discs/woodpecker-electro.webp'
import yunkuiImage from '../assets/equipment/drive-discs/yunkui-tales.webp'
import cauldronImage from '../assets/equipment/w-engines/cauldron-of-clarity.webp'
import chiefSidekickImage from '../assets/equipment/w-engines/chief-sidekick.webp'
import dreamlitImage from '../assets/equipment/w-engines/dreamlit-hearth.webp'
import hellfireImage from '../assets/equipment/w-engines/hellfire-gears.webp'
import kaboomImage from '../assets/equipment/w-engines/kaboom-the-cannon.webp'
import puzzleSphereImage from '../assets/equipment/w-engines/puzzle-sphere.webp'
import qingmingImage from '../assets/equipment/w-engines/qingming-birdcage.webp'
import radiowaveImage from '../assets/equipment/w-engines/radiowave-journey.webp'
import steamOvenImage from '../assets/equipment/w-engines/steam-oven.webp'
import thoughtbopImage from '../assets/equipment/w-engines/thoughtbop.webp'
import unfetteredImage from '../assets/equipment/w-engines/unfettered-game-ball.webp'
import weepingCradleImage from '../assets/equipment/w-engines/weeping-cradle.webp'
import yesterdayCallsImage from '../assets/equipment/w-engines/yesterday-calls.webp'

export type PoolId = 'full' | 'nonLimited'
export type AgentId = 'yixuan' | 'dialyn' | 'lucia'
export type Refinement = 1 | 2 | 3 | 4 | 5
export type EngineRank = 'S' | 'A'
export type EngineId =
  | 'qingming'
  | 'cauldron'
  | 'radiowave'
  | 'puzzleSphere'
  | 'yesterdayCalls'
  | 'chiefSidekick'
  | 'hellfireGears'
  | 'steamOven'
  | 'dreamlitHearth'
  | 'thoughtbop'
  | 'weepingCradle'
  | 'kaboom'
  | 'unfetteredGameBall'
export type DiscId =
  | 'yunkui'
  | 'woodpecker'
  | 'branchAndBlade'
  | 'king'
  | 'swingJazz'
  | 'moonlight'
export type MainSlot = 'slot4' | 'slot5' | 'slot6'
export type MainStatId =
  | 'critRate'
  | 'critDmg'
  | 'etherDmg'
  | 'hpPct'
  | 'atkPct'
  | 'energyRegenPct'
export type SubstatId = 'critRate' | 'critDmg' | 'hpPct' | 'hpFlat'

export interface AdvancedStat {
  id: 'hpPct' | 'atkPct' | 'critRate' | 'impactPct' | 'energyRegenPct' | 'penRatio'
  label: string
  value: number
  unit: '%'
}

export interface WEngineChoice {
  id: EngineId
  name: string
  rank: EngineRank
  defaultRefinement: Refinement
  baseAtk: number
  advancedStat: AdvancedStat
  image: string
  passiveLines: (refinement: Refinement) => string[]
}

export interface DriveDiscChoice {
  id: DiscId
  name: string
  image: string
  twoPieceEffect: string
  fourPieceEffects?: string[]
}

export interface MainStatChoice {
  id: MainStatId
  label: string
  value: string
  numericValue: number
}

export interface SubstatChoice {
  id: SubstatId
  label: string
  perHit: number
  unit: '%' | ''
}

export interface SetupSelection {
  engineId: EngineId
  fourPieceId: DiscId
  twoPieceId: DiscId
  mains: Record<MainSlot, MainStatId>
}

export interface AgentSummary {
  id: AgentId
  order: number
  name: string
  attribute: string
  specialty: string
  roles: string[]
  mindscape: 'M0'
}

const round = (value: number): number => Math.round(value * 100) / 100
const scaleAt = (refinement: Refinement): number => 1 + (refinement - 1) * 0.15
export const scaledEngineValue = (baseValue: number, refinement: Refinement): number =>
  round(baseValue * scaleAt(refinement))

const percent = (baseValue: number, refinement: Refinement): string =>
  `${scaledEngineValue(baseValue, refinement)}%`
const perSecond = (baseValue: number, refinement: Refinement): string =>
  `${scaledEngineValue(baseValue, refinement)}/s`

export const W_ENGINES: Record<EngineId, WEngineChoice> = {
  qingming: {
    id: 'qingming',
    name: 'Qingming Birdcage',
    rank: 'S',
    defaultRefinement: 1,
    baseAtk: 743,
    advancedStat: { id: 'hpPct', label: 'HP', value: 30, unit: '%' },
    image: qingmingImage,
    passiveLines: (refinement) => [
      `Combat \u00B7 CRIT Rate +${percent(20, refinement)}`,
      `Combat \u00B7 Ether DMG +${percent(16, refinement)}`,
      `EX Special & Ultimate \u00B7 Ether Sheer DMG +${percent(20, refinement)}`,
    ],
  },
  cauldron: {
    id: 'cauldron',
    name: 'Cauldron of Clarity',
    rank: 'A',
    defaultRefinement: 5,
    baseAtk: 594,
    advancedStat: { id: 'hpPct', label: 'HP', value: 25, unit: '%' },
    image: cauldronImage,
    passiveLines: (refinement) => [
      `Fully enabled \u00B7 DMG +${percent(12, refinement)}`,
      `Fully enabled \u00B7 CRIT Rate +${percent(6.5, refinement)}`,
    ],
  },
  radiowave: {
    id: 'radiowave',
    name: 'Radiowave Journey',
    rank: 'A',
    defaultRefinement: 5,
    baseAtk: 594,
    advancedStat: { id: 'hpPct', label: 'HP', value: 25, unit: '%' },
    image: radiowaveImage,
    passiveLines: (refinement) => [
      `Fully enabled \u00B7 Sheer Force +${scaledEngineValue(240, refinement)}`,
    ],
  },
  puzzleSphere: {
    id: 'puzzleSphere',
    name: 'Puzzle Sphere',
    rank: 'A',
    defaultRefinement: 5,
    baseAtk: 594,
    advancedStat: { id: 'atkPct', label: 'ATK', value: 25, unit: '%' },
    image: puzzleSphereImage,
    passiveLines: (refinement) => [
      `Fully enabled \u00B7 CRIT DMG +${percent(16, refinement)}`,
      `EX Special Attack \u00B7 DMG +${percent(20, refinement)}`,
    ],
  },
  yesterdayCalls: {
    id: 'yesterdayCalls',
    name: 'Yesterday Calls',
    rank: 'S',
    defaultRefinement: 1,
    baseAtk: 713,
    advancedStat: { id: 'critRate', label: 'CRIT Rate', value: 24, unit: '%' },
    image: yesterdayCallsImage,
    passiveLines: (refinement) => [
      `Combat \u00B7 Off-field Energy +${perSecond(1.5, refinement)}`,
      `Fully enabled \u00B7 Daze +${percent(27, refinement)}`,
      `Fully enabled \u00B7 Squad CRIT DMG +${percent(30, refinement)}`,
    ],
  },
  chiefSidekick: {
    id: 'chiefSidekick',
    name: 'Chief Sidekick',
    rank: 'S',
    defaultRefinement: 1,
    baseAtk: 713,
    advancedStat: { id: 'critRate', label: 'CRIT Rate', value: 24, unit: '%' },
    image: chiefSidekickImage,
    passiveLines: (refinement) => [
      `Combat \u00B7 Impact +${scaledEngineValue(30, refinement)}`,
      `Combat \u00B7 Off-field Energy +${perSecond(0.4, refinement)}`,
    ],
  },
  hellfireGears: {
    id: 'hellfireGears',
    name: 'Hellfire Gears',
    rank: 'S',
    defaultRefinement: 1,
    baseAtk: 684,
    advancedStat: { id: 'impactPct', label: 'Impact', value: 18, unit: '%' },
    image: hellfireImage,
    passiveLines: (refinement) => [
      `Combat \u00B7 Off-field Energy +${perSecond(0.6, refinement)}`,
      `Fully enabled \u00B7 Impact +${percent(20, refinement)}`,
    ],
  },
  steamOven: {
    id: 'steamOven',
    name: 'Steam Oven',
    rank: 'A',
    defaultRefinement: 5,
    baseAtk: 594,
    advancedStat: { id: 'energyRegenPct', label: 'Energy Regen', value: 50, unit: '%' },
    image: steamOvenImage,
    passiveLines: (refinement) => [
      `Fully enabled \u00B7 Impact +${percent(16, refinement)}`,
    ],
  },
  dreamlitHearth: {
    id: 'dreamlitHearth',
    name: 'Dreamlit Hearth',
    rank: 'S',
    defaultRefinement: 1,
    baseAtk: 713,
    advancedStat: { id: 'hpPct', label: 'HP', value: 30, unit: '%' },
    image: dreamlitImage,
    passiveLines: (refinement) => [
      `Combat \u00B7 Energy +${perSecond(0.4, refinement)}`,
      `Fully enabled \u00B7 Max HP +${percent(15, refinement)}`,
      `Fully enabled \u00B7 Squad DMG +${percent(25, refinement)}`,
    ],
  },
  thoughtbop: {
    id: 'thoughtbop',
    name: 'Thoughtbop',
    rank: 'S',
    defaultRefinement: 1,
    baseAtk: 713,
    advancedStat: { id: 'energyRegenPct', label: 'Energy Regen', value: 60, unit: '%' },
    image: thoughtbopImage,
    passiveLines: (refinement) => [
      `Combat \u00B7 Off-field Energy +${perSecond(0.6, refinement)}`,
    ],
  },
  weepingCradle: {
    id: 'weepingCradle',
    name: 'Weeping Cradle',
    rank: 'S',
    defaultRefinement: 1,
    baseAtk: 684,
    advancedStat: { id: 'penRatio', label: 'PEN Ratio', value: 24, unit: '%' },
    image: weepingCradleImage,
    passiveLines: (refinement) => [
      `Combat \u00B7 Off-field Energy +${perSecond(0.6, refinement)}`,
      `Fully enabled \u00B7 Squad DMG +${percent(20.2, refinement)}`,
    ],
  },
  kaboom: {
    id: 'kaboom',
    name: 'Kaboom the Cannon',
    rank: 'A',
    defaultRefinement: 5,
    baseAtk: 624,
    advancedStat: { id: 'energyRegenPct', label: 'Energy Regen', value: 50, unit: '%' },
    image: kaboomImage,
    passiveLines: (refinement) => [
      `Fully enabled \u00B7 Squad ATK +${percent(10, refinement)}`,
    ],
  },
  unfetteredGameBall: {
    id: 'unfetteredGameBall',
    name: 'Unfettered Game Ball',
    rank: 'A',
    defaultRefinement: 5,
    baseAtk: 594,
    advancedStat: { id: 'energyRegenPct', label: 'Energy Regen', value: 50, unit: '%' },
    image: unfetteredImage,
    passiveLines: (refinement) => [
      `Fully enabled \u00B7 Squad CRIT Rate +${10 + refinement * 2}%`,
    ],
  },
}

export const ENGINE_IDS_BY_AGENT_AND_POOL: Record<AgentId, Record<PoolId, EngineId[]>> = {
  yixuan: {
    full: ['qingming', 'cauldron', 'radiowave', 'puzzleSphere'],
    nonLimited: ['cauldron', 'radiowave', 'puzzleSphere'],
  },
  dialyn: {
    full: ['yesterdayCalls', 'chiefSidekick', 'hellfireGears', 'steamOven'],
    nonLimited: ['hellfireGears', 'steamOven'],
  },
  lucia: {
    full: ['dreamlitHearth', 'thoughtbop', 'weepingCradle', 'kaboom', 'unfetteredGameBall'],
    nonLimited: ['weepingCradle', 'kaboom', 'unfetteredGameBall'],
  },
}

export const DRIVE_DISCS: Record<DiscId, DriveDiscChoice> = {
  yunkui: {
    id: 'yunkui',
    name: 'Yunkui Tales',
    image: yunkuiImage,
    twoPieceEffect: 'HP +10%',
    fourPieceEffects: ['CRIT Rate +12%', 'Sheer DMG +10%'],
  },
  woodpecker: {
    id: 'woodpecker',
    name: 'Woodpecker Electro',
    image: woodpeckerImage,
    twoPieceEffect: 'CRIT Rate +8%',
  },
  branchAndBlade: {
    id: 'branchAndBlade',
    name: 'Branch & Blade Song',
    image: branchAndBladeImage,
    twoPieceEffect: 'CRIT DMG +16%',
  },
  king: {
    id: 'king',
    name: 'King of the Summit',
    image: kingImage,
    twoPieceEffect: 'Daze +6%',
    fourPieceEffects: ['Squad CRIT DMG +30%'],
  },
  swingJazz: {
    id: 'swingJazz',
    name: 'Swing Jazz',
    image: swingJazzImage,
    twoPieceEffect: 'Energy Regen +20%',
  },
  moonlight: {
    id: 'moonlight',
    name: 'Moonlight Lullaby',
    image: moonlightImage,
    twoPieceEffect: 'Energy Regen +20%',
    fourPieceEffects: ['Squad DMG +18%'],
  },
}

export const DISC_IDS_BY_AGENT_AND_PIECE: Record<
  AgentId,
  { fourPiece: DiscId[]; twoPiece: DiscId[] }
> = {
  yixuan: { fourPiece: ['yunkui'], twoPiece: ['woodpecker', 'branchAndBlade'] },
  dialyn: { fourPiece: ['king'], twoPiece: ['woodpecker', 'swingJazz'] },
  lucia: { fourPiece: ['moonlight'], twoPiece: ['yunkui'] },
}

export const MAIN_STATS: Record<MainStatId, MainStatChoice> = {
  critRate: { id: 'critRate', label: 'CRIT Rate', value: '+24%', numericValue: 24 },
  critDmg: { id: 'critDmg', label: 'CRIT DMG', value: '+48%', numericValue: 48 },
  etherDmg: { id: 'etherDmg', label: 'Ether DMG', value: '+30%', numericValue: 30 },
  hpPct: { id: 'hpPct', label: 'HP', value: '+30%', numericValue: 30 },
  atkPct: { id: 'atkPct', label: 'ATK', value: '+30%', numericValue: 30 },
  energyRegenPct: {
    id: 'energyRegenPct',
    label: 'Energy Regen',
    value: '+60%',
    numericValue: 60,
  },
}

export const MAIN_STAT_IDS_BY_AGENT_AND_SLOT: Record<
  AgentId,
  Record<MainSlot, MainStatId[]>
> = {
  yixuan: {
    slot4: ['critRate', 'critDmg'],
    slot5: ['etherDmg', 'hpPct'],
    slot6: ['hpPct'],
  },
  dialyn: {
    slot4: ['critRate'],
    slot5: ['atkPct'],
    slot6: ['energyRegenPct'],
  },
  lucia: {
    slot4: ['hpPct'],
    slot5: ['hpPct'],
    slot6: ['hpPct'],
  },
}

export const SUBSTAT_CHOICES_BY_AGENT: Record<AgentId, SubstatChoice[]> = {
  yixuan: [
    { id: 'critRate', label: 'CRIT Rate', perHit: 2.4, unit: '%' },
    { id: 'critDmg', label: 'CRIT DMG', perHit: 4.8, unit: '%' },
    { id: 'hpPct', label: 'HP', perHit: 3, unit: '%' },
  ],
  dialyn: [
    { id: 'critRate', label: 'CRIT Rate', perHit: 2.4, unit: '%' },
  ],
  lucia: [
    { id: 'hpPct', label: 'HP%', perHit: 3, unit: '%' },
    { id: 'hpFlat', label: 'HP', perHit: 112, unit: '' },
  ],
}

const yixuanPrepared: Omit<SetupSelection, 'engineId'> = {
  fourPieceId: 'yunkui',
  twoPieceId: 'woodpecker',
  mains: { slot4: 'critRate', slot5: 'etherDmg', slot6: 'hpPct' },
}
const dialynPrepared: Omit<SetupSelection, 'engineId'> = {
  fourPieceId: 'king',
  twoPieceId: 'woodpecker',
  mains: { slot4: 'critRate', slot5: 'atkPct', slot6: 'energyRegenPct' },
}
const luciaPrepared: Omit<SetupSelection, 'engineId'> = {
  fourPieceId: 'moonlight',
  twoPieceId: 'yunkui',
  mains: { slot4: 'hpPct', slot5: 'hpPct', slot6: 'hpPct' },
}

export const PREPARED_SETUP_BY_AGENT_AND_POOL: Record<
  AgentId,
  Record<PoolId, SetupSelection>
> = {
  yixuan: {
    full: { ...yixuanPrepared, engineId: 'qingming' },
    nonLimited: { ...yixuanPrepared, engineId: 'cauldron' },
  },
  dialyn: {
    full: { ...dialynPrepared, engineId: 'yesterdayCalls' },
    nonLimited: { ...dialynPrepared, engineId: 'hellfireGears' },
  },
  lucia: {
    full: { ...luciaPrepared, engineId: 'dreamlitHearth' },
    nonLimited: { ...luciaPrepared, engineId: 'weepingCradle' },
  },
}

export const PARTY_AGENTS: AgentSummary[] = [
  {
    id: 'yixuan',
    order: 1,
    name: 'Yixuan',
    attribute: 'Auric Ink',
    specialty: 'Rupture',
    roles: ['Damage contributor', 'Fixed focus'],
    mindscape: 'M0',
  },
  {
    id: 'dialyn',
    order: 2,
    name: 'Dialyn',
    attribute: 'Physical',
    specialty: 'Stun',
    roles: ['Daze contributor', 'Buffer'],
    mindscape: 'M0',
  },
  {
    id: 'lucia',
    order: 3,
    name: 'Lucia',
    attribute: 'Ether',
    specialty: 'Support',
    roles: ['Buffer'],
    mindscape: 'M0',
  },
]

export const VERTICAL_VALUES = {
  fixedDisc: {
    hp: 2200,
    atk: 316,
  },
  rupture: {
    currentAtkToSheer: 0.3,
    currentHpToSheer: 0.1,
  },
  yixuan: {
    hp: 8373,
    atk: 872,
    critRate: 19.4,
    critDmg: 50,
    coreActionDmgBonus: 60,
    additionalCritDmg: 40,
    additionalExDmgBonus: 30,
  },
  dialyn: {
    critRate: 19.4,
    critDmg: 50,
    impact: 110,
    baseEnergyRegen: 1.2,
    critThreshold: 50,
    impactPerCrit: 2,
    impactBonusCap: 100,
  },
  lucia: {
    hp: 8477,
    critDmg: 50,
    baseEnergyRegen: 1.3,
    darkbreakerBase: 12,
    darkbreakerPer200Hp: 7.4,
    darkbreakerCap: 900,
  },
  party: {
    dialynDmg: 40,
    dialynKingCritDmg: 15,
    dialynStunMultiplier: 30,
    dialynStunExtension: 2,
    luciaCoreDmg: 20,
    luciaDiscDmg: 18,
    luciaCritDmg: 30,
    luciaCoreHp: 5,
  },
} as const

export const SOURCE_LABELS = {
  slot4: 'Drive Disc \u00B7 Slot 4',
  slot5: 'Drive Disc \u00B7 Slot 5',
  slot6: 'Drive Disc \u00B7 Slot 6',
  yixuanCore: 'Core Passive',
  yixuanAbility: 'Additional Ability',
  dialynCore: 'Core Passive',
  dialynAbility: 'Additional Ability',
  luciaCore: 'Core Passive',
  luciaAbility: 'Additional Ability',
  luciaSheer: 'EX Special Attack',
} as const
