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
  | 'physicalDmg'
  | 'penRatio'
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
  limited: boolean
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
}

const round = (value: number): number => Math.round(value * 100) / 100
const scaleAt = (refinement: Refinement): number => 1 + (refinement - 1) * 0.15
export const scaledEngineValue = (baseValue: number, refinement: Refinement): number =>
  round(baseValue * scaleAt(refinement))

const percent = (baseValue: number, refinement: Refinement): string =>
  `${scaledEngineValue(baseValue, refinement)}%`
const perSecond = (baseValue: number, refinement: Refinement): string =>
  `${scaledEngineValue(baseValue, refinement)}/s`

export const defaultRefinementFor = (rank: EngineRank): Refinement => rank === 'S' ? 1 : 5

export const mainStatDisplay = (numericValue: number): string => `+${numericValue}%`

export const W_ENGINE_FACTS = {
  qingming: {
    advancedStat: { id: 'hpPct', label: 'HP', value: 30, unit: '%' },
    critRate: 20,
    etherDmg: 16,
    actionSheerDmg: 20,
  },
  cauldron: {
    advancedStat: { id: 'hpPct', label: 'HP', value: 25, unit: '%' },
    dmg: 12,
    critRate: 6.5,
  },
  radiowave: {
    advancedStat: { id: 'hpPct', label: 'HP', value: 25, unit: '%' },
    sheerForce: 240,
  },
  puzzleSphere: {
    advancedStat: { id: 'atkPct', label: 'ATK', value: 25, unit: '%' },
    critDmg: 16,
    actionExDmg: 20,
  },
  yesterdayCalls: {
    advancedStat: { id: 'critRate', label: 'CRIT Rate', value: 24, unit: '%' },
    energyPerSecond: 1.5,
    daze: 27,
    squadCritDmg: 30,
  },
  chiefSidekick: {
    advancedStat: { id: 'critRate', label: 'CRIT Rate', value: 24, unit: '%' },
    flatImpact: 30,
    energyPerSecond: 0.4,
  },
  hellfireGears: {
    advancedStat: { id: 'impactPct', label: 'Impact', value: 18, unit: '%' },
    energyPerSecond: 0.6,
    impact: 20,
  },
  steamOven: {
    advancedStat: { id: 'energyRegenPct', label: 'Energy Regen', value: 50, unit: '%' },
    impact: 16,
  },
  dreamlitHearth: {
    advancedStat: { id: 'hpPct', label: 'HP', value: 30, unit: '%' },
    energyPerSecond: 0.4,
    hpPct: 15,
    squadDmg: 25,
  },
  thoughtbop: {
    advancedStat: { id: 'energyRegenPct', label: 'Energy Regen', value: 60, unit: '%' },
    energyPerSecond: 0.6,
  },
  weepingCradle: {
    advancedStat: { id: 'penRatio', label: 'PEN Ratio', value: 24, unit: '%' },
    energyPerSecond: 0.6,
    squadDmg: 20.2,
  },
  kaboom: {
    advancedStat: { id: 'energyRegenPct', label: 'Energy Regen', value: 50, unit: '%' },
    squadAtkPct: 10,
  },
  unfetteredGameBall: {
    advancedStat: { id: 'energyRegenPct', label: 'Energy Regen', value: 50, unit: '%' },
    squadCritRateBase: 10,
    squadCritRatePerRefinement: 2,
  },
} as const

export const W_ENGINES: Record<EngineId, WEngineChoice> = {
  qingming: {
    id: 'qingming',
    name: 'Qingming Birdcage',
    rank: 'S',
    limited: true,
    baseAtk: 743,
    advancedStat: W_ENGINE_FACTS.qingming.advancedStat,
    image: qingmingImage,
    passiveLines: (refinement) => [
      `CRIT Rate +${percent(W_ENGINE_FACTS.qingming.critRate, refinement)}`,
      `Ether DMG +${percent(W_ENGINE_FACTS.qingming.etherDmg, refinement)}`,
      `EX Special & Ultimate \u00B7 Ether Sheer DMG +${percent(W_ENGINE_FACTS.qingming.actionSheerDmg, refinement)}`,
    ],
  },
  cauldron: {
    id: 'cauldron',
    name: 'Cauldron of Clarity',
    rank: 'A',
    limited: false,
    baseAtk: 594,
    advancedStat: W_ENGINE_FACTS.cauldron.advancedStat,
    image: cauldronImage,
    passiveLines: (refinement) => [
      `DMG +${percent(W_ENGINE_FACTS.cauldron.dmg, refinement)}`,
      `CRIT Rate +${percent(W_ENGINE_FACTS.cauldron.critRate, refinement)}`,
    ],
  },
  radiowave: {
    id: 'radiowave',
    name: 'Radiowave Journey',
    rank: 'A',
    limited: false,
    baseAtk: 594,
    advancedStat: W_ENGINE_FACTS.radiowave.advancedStat,
    image: radiowaveImage,
    passiveLines: (refinement) => [
      `Sheer Force +${scaledEngineValue(W_ENGINE_FACTS.radiowave.sheerForce, refinement)}`,
    ],
  },
  puzzleSphere: {
    id: 'puzzleSphere',
    name: 'Puzzle Sphere',
    rank: 'A',
    limited: false,
    baseAtk: 594,
    advancedStat: W_ENGINE_FACTS.puzzleSphere.advancedStat,
    image: puzzleSphereImage,
    passiveLines: (refinement) => [
      `CRIT DMG +${percent(W_ENGINE_FACTS.puzzleSphere.critDmg, refinement)}`,
      `EX Special Attack \u00B7 DMG +${percent(W_ENGINE_FACTS.puzzleSphere.actionExDmg, refinement)}`,
    ],
  },
  yesterdayCalls: {
    id: 'yesterdayCalls',
    name: 'Yesterday Calls',
    rank: 'S',
    limited: true,
    baseAtk: 713,
    advancedStat: W_ENGINE_FACTS.yesterdayCalls.advancedStat,
    image: yesterdayCallsImage,
    passiveLines: (refinement) => [
      `Off-field Energy +${perSecond(W_ENGINE_FACTS.yesterdayCalls.energyPerSecond, refinement)}`,
      `Daze +${percent(W_ENGINE_FACTS.yesterdayCalls.daze, refinement)}`,
      `Squad CRIT DMG +${percent(W_ENGINE_FACTS.yesterdayCalls.squadCritDmg, refinement)}`,
    ],
  },
  chiefSidekick: {
    id: 'chiefSidekick',
    name: 'Chief Sidekick',
    rank: 'S',
    limited: true,
    baseAtk: 713,
    advancedStat: W_ENGINE_FACTS.chiefSidekick.advancedStat,
    image: chiefSidekickImage,
    passiveLines: (refinement) => [
      `Impact +${scaledEngineValue(W_ENGINE_FACTS.chiefSidekick.flatImpact, refinement)}`,
      `Off-field Energy +${perSecond(W_ENGINE_FACTS.chiefSidekick.energyPerSecond, refinement)}`,
    ],
  },
  hellfireGears: {
    id: 'hellfireGears',
    name: 'Hellfire Gears',
    rank: 'S',
    limited: false,
    baseAtk: 684,
    advancedStat: W_ENGINE_FACTS.hellfireGears.advancedStat,
    image: hellfireImage,
    passiveLines: (refinement) => [
      `Off-field Energy +${perSecond(W_ENGINE_FACTS.hellfireGears.energyPerSecond, refinement)}`,
      `Impact +${percent(W_ENGINE_FACTS.hellfireGears.impact, refinement)}`,
    ],
  },
  steamOven: {
    id: 'steamOven',
    name: 'Steam Oven',
    rank: 'A',
    limited: false,
    baseAtk: 594,
    advancedStat: W_ENGINE_FACTS.steamOven.advancedStat,
    image: steamOvenImage,
    passiveLines: (refinement) => [
      `Impact +${percent(W_ENGINE_FACTS.steamOven.impact, refinement)}`,
    ],
  },
  dreamlitHearth: {
    id: 'dreamlitHearth',
    name: 'Dreamlit Hearth',
    rank: 'S',
    limited: true,
    baseAtk: 713,
    advancedStat: W_ENGINE_FACTS.dreamlitHearth.advancedStat,
    image: dreamlitImage,
    passiveLines: (refinement) => [
      `Energy +${perSecond(W_ENGINE_FACTS.dreamlitHearth.energyPerSecond, refinement)}`,
      `Max HP +${percent(W_ENGINE_FACTS.dreamlitHearth.hpPct, refinement)}`,
      `Squad DMG +${percent(W_ENGINE_FACTS.dreamlitHearth.squadDmg, refinement)}`,
    ],
  },
  thoughtbop: {
    id: 'thoughtbop',
    name: 'Thoughtbop',
    rank: 'S',
    limited: true,
    baseAtk: 713,
    advancedStat: W_ENGINE_FACTS.thoughtbop.advancedStat,
    image: thoughtbopImage,
    passiveLines: (refinement) => [
      `Off-field Energy +${perSecond(W_ENGINE_FACTS.thoughtbop.energyPerSecond, refinement)}`,
    ],
  },
  weepingCradle: {
    id: 'weepingCradle',
    name: 'Weeping Cradle',
    rank: 'S',
    limited: false,
    baseAtk: 684,
    advancedStat: W_ENGINE_FACTS.weepingCradle.advancedStat,
    image: weepingCradleImage,
    passiveLines: (refinement) => [
      `Off-field Energy +${perSecond(W_ENGINE_FACTS.weepingCradle.energyPerSecond, refinement)}`,
      `Squad DMG +${percent(W_ENGINE_FACTS.weepingCradle.squadDmg, refinement)}`,
    ],
  },
  kaboom: {
    id: 'kaboom',
    name: 'Kaboom the Cannon',
    rank: 'A',
    limited: false,
    baseAtk: 624,
    advancedStat: W_ENGINE_FACTS.kaboom.advancedStat,
    image: kaboomImage,
    passiveLines: (refinement) => [
      `Squad ATK +${percent(W_ENGINE_FACTS.kaboom.squadAtkPct, refinement)}`,
    ],
  },
  unfetteredGameBall: {
    id: 'unfetteredGameBall',
    name: 'Unfettered Game Ball',
    rank: 'A',
    limited: false,
    baseAtk: 594,
    advancedStat: W_ENGINE_FACTS.unfetteredGameBall.advancedStat,
    image: unfetteredImage,
    passiveLines: (refinement) => [
      `Squad CRIT Rate +${W_ENGINE_FACTS.unfetteredGameBall.squadCritRateBase + refinement * W_ENGINE_FACTS.unfetteredGameBall.squadCritRatePerRefinement}%`,
    ],
  },
}

const enginePools = (full: EngineId[]): Record<PoolId, EngineId[]> => ({
  full,
  nonLimited: full.filter((engineId) => !W_ENGINES[engineId].limited),
})

export const ENGINE_IDS_BY_AGENT_AND_POOL: Record<AgentId, Record<PoolId, EngineId[]>> = {
  yixuan: enginePools(['qingming', 'cauldron', 'radiowave', 'puzzleSphere']),
  dialyn: enginePools(['yesterdayCalls', 'chiefSidekick', 'hellfireGears', 'steamOven']),
  lucia: enginePools([
    'dreamlitHearth',
    'thoughtbop',
    'weepingCradle',
    'kaboom',
    'unfetteredGameBall',
  ]),
}

export const DRIVE_DISC_FACTS = {
  yunkui: { hpPct: 10, critRate: 12, sheerDmg: 10 },
  woodpecker: { critRate: 8 },
  branchAndBlade: { critDmg: 16 },
  king: { daze: 6, squadCritDmg: { base: 15, atCritThreshold: 15 } },
  swingJazz: { energyRegenPct: 20 },
  moonlight: { energyRegenPct: 20, squadDmg: 18 },
} as const

export const DRIVE_DISCS: Record<DiscId, DriveDiscChoice> = {
  yunkui: {
    id: 'yunkui',
    name: 'Yunkui Tales',
    image: yunkuiImage,
    twoPieceEffect: `HP +${DRIVE_DISC_FACTS.yunkui.hpPct}%`,
    fourPieceEffects: [
      `CRIT Rate +${DRIVE_DISC_FACTS.yunkui.critRate}%`,
      `Sheer DMG +${DRIVE_DISC_FACTS.yunkui.sheerDmg}%`,
    ],
  },
  woodpecker: {
    id: 'woodpecker',
    name: 'Woodpecker Electro',
    image: woodpeckerImage,
    twoPieceEffect: `CRIT Rate +${DRIVE_DISC_FACTS.woodpecker.critRate}%`,
  },
  branchAndBlade: {
    id: 'branchAndBlade',
    name: 'Branch & Blade Song',
    image: branchAndBladeImage,
    twoPieceEffect: `CRIT DMG +${DRIVE_DISC_FACTS.branchAndBlade.critDmg}%`,
  },
  king: {
    id: 'king',
    name: 'King of the Summit',
    image: kingImage,
    twoPieceEffect: `Daze +${DRIVE_DISC_FACTS.king.daze}%`,
    fourPieceEffects: [
      `Squad CRIT DMG +${DRIVE_DISC_FACTS.king.squadCritDmg.base + DRIVE_DISC_FACTS.king.squadCritDmg.atCritThreshold}%`,
    ],
  },
  swingJazz: {
    id: 'swingJazz',
    name: 'Swing Jazz',
    image: swingJazzImage,
    twoPieceEffect: `Energy Regen +${DRIVE_DISC_FACTS.swingJazz.energyRegenPct}%`,
  },
  moonlight: {
    id: 'moonlight',
    name: 'Moonlight Lullaby',
    image: moonlightImage,
    twoPieceEffect: `Energy Regen +${DRIVE_DISC_FACTS.moonlight.energyRegenPct}%`,
    fourPieceEffects: [`Squad DMG +${DRIVE_DISC_FACTS.moonlight.squadDmg}%`],
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
  critRate: { id: 'critRate', label: 'CRIT Rate', numericValue: 24 },
  critDmg: { id: 'critDmg', label: 'CRIT DMG', numericValue: 48 },
  etherDmg: { id: 'etherDmg', label: 'Ether DMG', numericValue: 30 },
  hpPct: { id: 'hpPct', label: 'HP%', numericValue: 30 },
  atkPct: { id: 'atkPct', label: 'ATK%', numericValue: 30 },
  physicalDmg: { id: 'physicalDmg', label: 'Physical DMG', numericValue: 30 },
  penRatio: { id: 'penRatio', label: 'PEN Ratio', numericValue: 24 },
  energyRegenPct: {
    id: 'energyRegenPct',
    label: 'Energy Regen',
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
    slot5: ['atkPct', 'physicalDmg', 'penRatio'],
    slot6: ['energyRegenPct'],
  },
  lucia: {
    slot4: ['hpPct'],
    slot5: ['hpPct'],
    slot6: ['hpPct', 'energyRegenPct'],
  },
}

export const SUBSTAT_CHOICES_BY_AGENT: Record<AgentId, SubstatChoice[]> = {
  yixuan: [
    { id: 'critRate', label: 'CRIT Rate', perHit: 2.4, unit: '%' },
    { id: 'critDmg', label: 'CRIT DMG', perHit: 4.8, unit: '%' },
    { id: 'hpPct', label: 'HP%', perHit: 3, unit: '%' },
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

export function preparedSetupFor(
  agentId: AgentId,
  pool: PoolId,
  mindscape: number,
): SetupSelection {
  const prepared = PREPARED_SETUP_BY_AGENT_AND_POOL[agentId][pool]
  if (agentId === 'yixuan' && pool === 'full' && mindscape >= 1) {
    return { ...prepared, twoPieceId: 'branchAndBlade' }
  }
  return prepared
}

export const PARTY_AGENTS: AgentSummary[] = [
  {
    id: 'yixuan',
    order: 1,
    name: 'Yixuan',
    attribute: 'Auric Ink',
    specialty: 'Rupture',
  },
  {
    id: 'dialyn',
    order: 2,
    name: 'Dialyn',
    attribute: 'Physical',
    specialty: 'Stun',
  },
  {
    id: 'lucia',
    order: 3,
    name: 'Lucia',
    attribute: 'Ether',
    specialty: 'Support',
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
    mindscapeCritRate: 10,
    mindscapeEtherResIgnore: 15,
    mindscapeStunExtension: 3,
    mindscapeActionDmgPerStack: 30,
    mindscapeMeditationSheerDmg: 20,
  },
  dialyn: {
    critRate: 19.4,
    critDmg: 50,
    impact: 110,
    baseEnergyRegen: 1.2,
    critThreshold: 50,
    impactPerCrit: 2,
    impactBonusCap: 100,
    mindscapeDmg: 15,
    mindscapeStunMultiplier: 20,
    mindscapeResIgnore: 15,
  },
  lucia: {
    hp: 8477,
    critDmg: 50,
    baseEnergyRegen: 1.3,
    darkbreakerBase: 12,
    darkbreakerPer200Hp: { base: 7.4, m3: 7.8, m5: 8.2 },
    darkbreakerCap: { base: 900, m3: 948, m5: 996 },
    darkbreakerHpCap: 24000,
    mindscapeSheerDmg: 15,
    mindscapeResIgnore: 18,
  },
  party: {
    dialynDmg: 40,
    dialynStunMultiplier: 30,
    dialynStunExtension: 2,
    luciaCoreDmg: 20,
    luciaCritDmg: 30,
    luciaCoreHp: 5,
  },
} as const

const SOURCE_CATEGORY_LABELS = {
  corePassive: 'Core Passive',
  additionalAbility: 'Additional Ability',
  exSpecialAttack: 'EX Special Attack',
  mindscape: 'Mindscape',
} as const

export const SOURCE_LABELS = {
  slot4: 'Drive Disc \u00B7 Slot 4',
  slot5: 'Drive Disc \u00B7 Slot 5',
  slot6: 'Drive Disc \u00B7 Slot 6',
  yixuanCore: SOURCE_CATEGORY_LABELS.corePassive,
  yixuanAbility: SOURCE_CATEGORY_LABELS.additionalAbility,
  dialynCore: SOURCE_CATEGORY_LABELS.corePassive,
  dialynAbility: SOURCE_CATEGORY_LABELS.additionalAbility,
  luciaCore: SOURCE_CATEGORY_LABELS.corePassive,
  luciaAbility: SOURCE_CATEGORY_LABELS.additionalAbility,
  luciaSheer: SOURCE_CATEGORY_LABELS.exSpecialAttack,
  mindscape: SOURCE_CATEGORY_LABELS.mindscape,
} as const
