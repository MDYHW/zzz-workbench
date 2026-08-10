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
  | 'drillRigRedAxis'

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

export type SubstatId =
  | 'critRate'
  | 'critDmg'
  | 'hpPct'
  | 'hpFlat'
  | 'atkPct'
  | 'atkFlat'

export interface AdvancedStat {
  id: 'hpPct' | 'atkPct' | 'critRate' | 'critDmg' | 'impactPct' | 'energyRegenPct' | 'penRatio'
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
  name: string
  attribute: string
  specialty: string
  focusEligible: boolean
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

export const defaultRefinementFor = (rank: EngineRank): Refinement => rank === 'S' ? 1 : 5

export const mainStatDisplay = (numericValue: number): string => `+${numericValue}%`
