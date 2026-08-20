import type { ActionTag, CanonicalActionKind } from '../actions'

export type PoolId = 'full' | 'nonLimited'

export type AgentId =
  | 'yixuan'
  | 'dialyn'
  | 'lucia'
  | 'anbySoldier0'
  | 'trigger'
  | 'astraYao'
  | 'seed'
  | 'cissia'
  | 'evelyn'
  | 'corin'
  | 'lycaon'
  | 'yidhari'
  | 'manato'
  | 'hugo'
  | 'juFufu'
  | 'panYinhu'
  | 'banyue'
  | 'starlightBilly'
  | 'ellen'
  | 'soukaku'
  | 'soldier11'
  | 'lighter'
  | 'lucy'
  | 'zhuYuan'
  | 'nicole'
  | 'orphie'
  | 'pulchra'
  | 'harumasa'
  | 'qingyi'
  | 'nekomata'
  | 'billy'
  | 'ben'
  | 'koleda'
  | 'anby'
  | 'caesar'
  | 'yeShunguang'
  | 'zhao'
  | 'grace'

export type AgentRank = 'S' | 'A'
export type AgentFaction =
  | 'Victoria Housekeeping Co.'
  | 'Yunkui Summit'
  | 'Section 6'
  | 'Defense Force - Silver Squad'
  | 'Obol Squad'
  | 'Sons of Calydon'
  | 'Criminal Investigation Special Response Team'
  | 'Cunning Hares'
  | 'Belobog Heavy Industries'
  | 'Krampus Compliance Authority'

/** Game-recognized teammate qualification that does not replace display faction. */
export type PartyQualificationGroup = 'New Eridu Defense Force'

export type Refinement = 1 | 2 | 3 | 4 | 5
export type EngineRank = 'S' | 'A'

export type EngineId =
  | 'qingming'
  | 'cauldron'
  | 'radiowave'
  | 'puzzleSphere'
  | 'yesterdayCalls'
  | 'hellfireGears'
  | 'steamOven'
  | 'dreamlitHearth'
  | 'thoughtbop'
  | 'weepingCradle'
  | 'kaboom'
  | 'unfetteredGameBall'
  | 'severedInnocence'
  | 'cordisGermina'
  | 'marcatoDesire'
  | 'starlightEngine'
  | 'spectralGaze'
  | 'iceJadeTeapot'
  | 'restrained'
  | 'preciousFossilizedCore'
  | 'elegantVanity'
  | 'bashfulDemon'
  | 'brimstone'
  | 'serpentineSeeker'
  | 'bellicoseBlaze'
  | 'drillRigRedAxis'
  | 'heartstringNocturne'
  | 'steelCushion'
  | 'housekeeper'
  | 'blazingLaurel'
  | 'simmeringPot'
  | 'krakensCradle'
  | 'grillOWisp'
  | 'wrathfulVajra'
  | 'myriadEclipse'
  | 'roaringFurnace'
  | 'tusksOfFury'
  | 'tremorTrigramVessel'
  | 'starlightRiderFaceplate'
  | 'deepSeaVisitor'
  | 'riotSuppressorMarkVI'
  | 'theVault'
  | 'gildedBlossom'
  | 'boxCutter'
  | 'zanshinHerbCase'
  | 'cloudcleaveRadiance'
  | 'starlightEngineReplica'
  | 'hailstormShrine'
  | 'bigCylinder'
  | 'springEmbrace'
  | 'demaraBatteryMarkII'
  | 'originalTransmorpher'
  | 'halfSugarBunny'
  | 'timeweaver'
  | 'practicedPerfection'
  | 'fusionCompiler'
  | 'electroLipGloss'
  | 'weepingGemini'

export type DiscId =
  | 'yunkui'
  | 'woodpecker'
  | 'branchAndBlade'
  | 'king'
  | 'swingJazz'
  | 'moonlight'
  | 'shadowHarmony'
  | 'shockstar'
  | 'astralVoice'
  | 'hormonePunk'
  | 'dawnsBloom'
  | 'pufferElectro'
  | 'bunnyInWonderland'
  | 'infernoMetal'
  | 'fangedMetal'
  | 'polarMetal'
  | 'thunderMetal'
  | 'chaoticMetal'
  | 'whiteWaterBallad'
  | 'chaosJazz'
  | 'freedomBlues'
  | 'phaethonsMelody'

export type MainSlot = 'slot4' | 'slot5' | 'slot6'

export type MainStatId =
  | 'critRate'
  | 'critDmg'
  | 'etherDmg'
  | 'hpPct'
  | 'atkPct'
  | 'physicalDmg'
  | 'penRatio'
  | 'impact'
  | 'energyRegenPct'
  | 'electricDmg'
  | 'fireDmg'
  | 'iceDmg'
  | 'defPct'
  | 'anomalyProficiency'
  | 'anomalyMastery'

export type SubstatId =
  | 'critRate'
  | 'critDmg'
  | 'hpPct'
  | 'hpFlat'
  | 'atkPct'
  | 'atkFlat'
  | 'defPct'
  | 'anomalyProficiency'

export interface AdvancedStat {
  id: 'hpPct' | 'atkPct' | 'defPct' | 'critRate' | 'critDmg' | 'impactPct' | 'energyRegenPct' | 'penRatio' | 'anomalyProficiency' | 'anomalyMastery'
  label: string
  value: number
  unit: '%' | ''
}

export type RefinementValues = readonly [number, number, number, number, number]

export type EquipmentEffectModifier =
  | 'maxHp' | 'atk' | 'sheerForce' | 'impact' | 'critRate' | 'critDmg'
  | 'dmgBonus' | 'sheerDmgBonus' | 'dazeBonus' | 'energy' | 'energyRegen'
  | 'penRatio' | 'defIgnore' | 'defReduction' | 'resIgnore' | 'shieldEffect'
  | 'damageTakenReduction' | 'energyGenerationRate' | 'guaranteedCrit' | 'defDamage'
  | 'anomalyProficiency' | 'anomalyMastery' | 'anomalyDmgBonus'
  | 'anomalyBuildupBonus' | 'anomalyBuildupResReduction'

export type EquipmentEffectAttribute = 'Electric' | 'Ether' | 'Fire' | 'Ice' | 'Physical'

export type EquipmentEffectAction =
  Extract<
  CanonicalActionKind,
  | 'Basic Attack'
  | 'Dash Attack'
  | 'Dodge Counter'
  | 'Special Attack'
  | 'EX Special Attack'
  | 'Assist'
  | 'Chain Attack'
  | 'Ultimate'
  | 'Assist Follow-Up'
  >

export type EquipmentEffectTag = Extract<ActionTag, 'aftershock'>
export type EquipmentEffectCondition = 'backAttack'

export type EquipmentEffectRecipient = 'self' | 'squad' | 'enemy'
export type EquipmentEffectValue = number | RefinementValues

export interface EquipmentEffectScope {
  recipient?: EquipmentEffectRecipient
  actions?: readonly EquipmentEffectAction[]
  tags?: readonly EquipmentEffectTag[]
  attributes?: readonly EquipmentEffectAttribute[]
  condition?: EquipmentEffectCondition
}

export type EquipmentEffectProgression =
  | {
    kind: 'stacks'
    perStack: EquipmentEffectValue
    maxStacks: number
    atMaximum?: EquipmentEffectValue
    /** Exact aggregate when rounding the final value differs from summing rounded increments. */
    maximum?: EquipmentEffectValue
  }
  | {
    kind: 'conditions'
    perCondition: EquipmentEffectValue
    maxConditions: number
  }
  | {
    kind: 'thresholds'
    perThreshold: EquipmentEffectValue
    thresholds: readonly number[]
  }

type EquipmentEffectMagnitude =
  | { value: EquipmentEffectValue; progression?: EquipmentEffectProgression }
  | { value?: never; progression: EquipmentEffectProgression }

export type EquipmentEffectFact = {
  modifier: EquipmentEffectModifier
  unit: '%' | '' | '/s'
  scope?: EquipmentEffectScope
} & EquipmentEffectMagnitude

// Setup-content facts only. Local collection keys are handles for explicit
// consumers; this shape does not decide activation or project effects into Result.
export type EquipmentEffectCollection = Readonly<Record<string, EquipmentEffectFact>>

export interface WEngineFacts {
  advancedStat: AdvancedStat
  effects: EquipmentEffectCollection
}

export interface DriveDiscFacts {
  twoPiece: EquipmentEffectCollection
  fourPiece?: EquipmentEffectCollection
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
  passiveSpecialty?: string
}

export interface DriveDiscChoice {
  id: DiscId
  name: string
  image: string
  twoPieceEffect: string
  fourPieceEffects?: string[]
  fourPieceEffectsForHolder?: (holderAttribute: string) => string[]
}

export interface MainStatChoice {
  id: MainStatId
  label: string
  numericValue: number
  unit?: '%' | ''
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
  name: string
  attribute: string
  specialty: string
  focusEligible: boolean
  rank: AgentRank
  faction?: AgentFaction
  partyQualificationGroup?: PartyQualificationGroup
}

export type SetupFormulaFamily =
  | 'general_damage'
  | 'sheer_damage'
  | 'anomaly_damage'
  | 'daze_buildup'
  | 'anomaly_buildup'

export interface SetupFormulaParticipation {
  primary: readonly SetupFormulaFamily[]
  residual: readonly SetupFormulaFamily[]
}

const round = (value: number): number => Math.round(value * 100) / 100
const scaleAt = (refinement: Refinement): number => 1 + (refinement - 1) * 0.15

export const scaledEngineValue = (baseValue: number, refinement: Refinement): number =>
  round(baseValue * scaleAt(refinement))

export const scaledRefinementValues = (baseValue: number): RefinementValues => [
  scaledEngineValue(baseValue, 1),
  scaledEngineValue(baseValue, 2),
  scaledEngineValue(baseValue, 3),
  scaledEngineValue(baseValue, 4),
  scaledEngineValue(baseValue, 5),
]

export const fixedRefinementValues = (value: number): RefinementValues =>
  [value, value, value, value, value]

const resolveEquipmentEffectValue = (
  value: EquipmentEffectValue,
  refinement?: Refinement,
): number => {
  if (typeof value === 'number') return value
  if (refinement === undefined) {
    throw new Error('A refinement is required for a W-Engine effect value')
  }
  return value[refinement - 1]
}

export const equipmentEffectBaseValue = (
  effect: EquipmentEffectFact,
  refinement?: Refinement,
): number => effect.value === undefined ? 0 : resolveEquipmentEffectValue(effect.value, refinement)

export const equipmentEffectProgressionValue = (
  effect: EquipmentEffectFact,
  refinement?: Refinement,
): number => {
  const progression = effect.progression
  if (!progression) return 0
  if (progression.kind === 'stacks') {
    return equipmentEffectProgressionIncrementValue(effect, refinement) * progression.maxStacks
      + (progression.atMaximum === undefined
        ? 0
        : resolveEquipmentEffectValue(progression.atMaximum, refinement))
  }
  if (progression.kind === 'conditions') {
    return equipmentEffectProgressionIncrementValue(effect, refinement) * progression.maxConditions
  }
  return equipmentEffectProgressionIncrementValue(effect, refinement) * progression.thresholds.length
}

export const equipmentEffectProgressionIncrementValue = (
  effect: EquipmentEffectFact,
  refinement?: Refinement,
): number => {
  const progression = effect.progression
  if (!progression) return 0
  return resolveEquipmentEffectValue(
    progression.kind === 'stacks'
      ? progression.perStack
      : progression.kind === 'conditions'
        ? progression.perCondition
        : progression.perThreshold,
    refinement,
  )
}

export const equipmentEffectMaximumValue = (
  effect: EquipmentEffectFact,
  refinement?: Refinement,
): number => effect.progression?.kind === 'stacks'
  && effect.progression.maximum !== undefined
  ? resolveEquipmentEffectValue(effect.progression.maximum, refinement)
  : equipmentEffectBaseValue(effect, refinement)
    + equipmentEffectProgressionValue(effect, refinement)

export const defaultRefinementFor = (rank: EngineRank): Refinement => rank === 'S' ? 1 : 5

export const mainStatDisplay = (numericValue: number, unit: '%' | '' = '%'): string =>
  `+${numericValue}${unit}`
