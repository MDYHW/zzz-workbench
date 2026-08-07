import {
  DRIVE_DISCS,
  MAIN_STATS,
  SOURCE_LABELS,
  SUBSTAT_CHOICES_BY_AGENT,
  W_ENGINES,
  type AgentId,
  type DiscId,
  type EngineId,
  type MainSlot,
  type Refinement,
  type SubstatId,
} from './content'
import type { AgentSetupState, AppliedAgentSlot } from './state'

export type SurfaceKey = 'initial' | 'combat' | 'fully'
export type SourceLocus =
  | 'identity' | 'w-engine' | 'disc-4pc' | 'disc-2pc'
  | 'disc-slot-4' | 'disc-slot-5' | 'disc-slot-6'
  | 'substat-1' | 'substat-2' | 'substat-3'
  | 'core' | 'additional' | 'ex-special' | 'mindscape' | 'calculation'

export interface ResultSource {
  label: string
  detail?: string
  ownerAgentId: AgentId
  locus: SourceLocus
}

export type CompleteSetup = Omit<AgentSetupState,
  'engineId' | 'refinement' | 'fourPieceId' | 'twoPieceId'
> & {
  engineId: EngineId
  refinement: Refinement
  fourPieceId: DiscId
  twoPieceId: DiscId
}

export interface ResolvedSetupInput {
  rawValue: number
  unit: '%' | ''
  source: ResultSource
}

export type EffectMetric =
  | 'maxHp' | 'atk' | 'sheerForce' | 'impact' | 'critRate' | 'critDmg'
  | 'dmgBonus' | 'sheerDmgBonus' | 'resIgnore' | 'dazeBonus'
  | 'stunDmgMultiplier' | 'energyRegen' | 'stunDuration'

export type ActionEffectId =
  | 'coreActions' | 'exSpecialStunned' | 'mindscapeCloudShaper'
  | 'engineSheerActions' | 'mindscapeEtherResIgnore'
export type Recipient = 'self' | 'focus' | 'all-party' | 'other-party' | 'enemy-context'

export interface ResolvedCurrentEffect {
  metric: EffectMetric
  earliestSurface: SurfaceKey
  amount: number
  source: ResultSource
  action?: ActionEffectId
  display?: { value: number; unit: '%' | '/s'; decimals: number }
}

export interface SourceBoundCurrentClause {
  metric: EffectMetric
  earliestSurface: SurfaceKey
  source: ResultSource
  recipient: Recipient
  action?: ActionEffectId
  value: { kind: 'additive'; amount: number; display?: ResolvedCurrentEffect['display'] }
    | { kind: 'basis-percentage'; percentage: number }
}

export const source = (
  label: string,
  ownerAgentId: AgentId,
  locus: SourceLocus,
  detail?: string,
): ResultSource => ({ label, detail, ownerAgentId, locus })

export const STATIC_SOURCES = {
  yixuan: {
    ruptureConversion: source('Rupture specialty', 'yixuan', 'identity', 'Current ATK × 0.3 + Current Max HP × 0.1'),
    core: source(SOURCE_LABELS.yixuanCore, 'yixuan', 'core'),
    additional: source(SOURCE_LABELS.yixuanAbility, 'yixuan', 'additional'),
    critCap: source('Displayed CRIT Rate cap', 'yixuan', 'calculation'),
  },
  dialyn: {
    core: source(SOURCE_LABELS.dialynCore, 'dialyn', 'core'),
    additional: source(SOURCE_LABELS.dialynAbility, 'dialyn', 'additional'),
    critCap: source('Displayed CRIT Rate cap', 'dialyn', 'calculation'),
  },
  lucia: {
    core: source(SOURCE_LABELS.luciaCore, 'lucia', 'core'),
    additional: source(SOURCE_LABELS.luciaAbility, 'lucia', 'additional'),
    exSpecial: source(SOURCE_LABELS.luciaSheer, 'lucia', 'ex-special'),
  },
} as const

export const mindscapeSource = (
  agentId: AgentId,
  minimumMindscape: number,
  condition?: string,
): ResultSource => source(
  SOURCE_LABELS.mindscape,
  agentId,
  'mindscape',
  [`M${minimumMindscape}`, condition].filter(Boolean).join(' · '),
)

export const completeSetup = (
  slot: AppliedAgentSlot,
): CompleteSetup => slot.setup as CompleteSetup

export function engineSource(
  agentId: AgentId,
  setup: CompleteSetup,
): ResultSource {
  return source(
    W_ENGINES[setup.engineId].name,
    agentId,
    'w-engine',
    `W${setup.refinement}`,
  )
}

export function discSource(
  agentId: AgentId,
  discId: DiscId,
  piece: '4-piece' | '2-piece',
): ResultSource {
  const label = agentId === 'dialyn' && discId === 'swingJazz' && piece === '2-piece'
    ? 'Swing Jazz or Moonlight Lullaby'
    : DRIVE_DISCS[discId].name
  return source(
    label,
    agentId,
    piece === '4-piece' ? 'disc-4pc' : 'disc-2pc',
    piece,
  )
}

export const mainSource = (agentId: AgentId, slot: MainSlot): ResultSource =>
  source(
    SOURCE_LABELS[slot],
    agentId,
    `disc-${slot.replace('slot', 'slot-')}` as SourceLocus,
  )

export function substatSource(
  agentId: AgentId,
  substatId: SubstatId,
): ResultSource {
  const index = SUBSTAT_CHOICES_BY_AGENT[agentId]
    .findIndex(({ id }) => id === substatId)
  return source(
    'Effective substat hits',
    agentId,
    `substat-${index + 1}` as SourceLocus,
    SUBSTAT_CHOICES_BY_AGENT[agentId][index].label,
  )
}

export function effectiveSubstatInput(
  setup: CompleteSetup,
  agentId: AgentId,
  substatId: SubstatId,
): ResolvedSetupInput | undefined {
  const choice = SUBSTAT_CHOICES_BY_AGENT[agentId]
    .find(({ id }) => id === substatId)
  return choice && {
    rawValue: (setup.substats[substatId] ?? 0) * choice.perHit,
    unit: choice.unit,
    source: substatSource(agentId, substatId),
  }
}

export function mainStatInput(
  setup: CompleteSetup,
  agentId: AgentId,
  slot: MainSlot,
  statId: string,
): ResolvedSetupInput | undefined {
  const selectedStatId = setup.mains[slot]
  return selectedStatId === statId
    ? {
      rawValue: MAIN_STATS[selectedStatId].numericValue,
      unit: '%',
      source: mainSource(agentId, slot),
    }
    : undefined
}

export function engineAdvancedInput(
  setup: CompleteSetup,
  agentId: AgentId,
  statId: string,
): ResolvedSetupInput | undefined {
  const advanced = W_ENGINES[setup.engineId].advancedStat
  return advanced.id === statId
    ? {
      rawValue: advanced.value,
      unit: advanced.unit,
      source: engineSource(agentId, setup),
    }
    : undefined
}

export function discStatInput(
  setup: CompleteSetup,
  agentId: AgentId,
  piece: 'fourPiece' | 'twoPiece',
  discId: DiscId,
  rawValue: number,
): ResolvedSetupInput | undefined {
  const selected = piece === 'fourPiece' ? setup.fourPieceId : setup.twoPieceId
  return selected === discId
    ? {
      rawValue,
      unit: '%',
      source: discSource(
        agentId,
        discId,
        piece === 'fourPiece' ? '4-piece' : '2-piece',
      ),
    }
    : undefined
}

export const additive = (
  metric: EffectMetric,
  earliestSurface: SurfaceKey,
  sourceValue: ResultSource,
  amount: number,
  recipient: Recipient,
  action?: ActionEffectId,
  display?: ResolvedCurrentEffect['display'],
): SourceBoundCurrentClause => ({
  metric,
  earliestSurface,
  source: sourceValue,
  recipient,
  ...(action ? { action } : {}),
  value: { kind: 'additive', amount, ...(display ? { display } : {}) },
})

export const percentage = (
  metric: EffectMetric,
  earliestSurface: SurfaceKey,
  sourceValue: ResultSource,
  percentageValue: number,
  recipient: Recipient,
): SourceBoundCurrentClause => ({
  metric,
  earliestSurface,
  source: sourceValue,
  recipient,
  value: { kind: 'basis-percentage', percentage: percentageValue },
})

export const active = (
  clauses: SourceBoundCurrentClause[],
): SourceBoundCurrentClause[] => clauses.filter(({ value }) => Math.abs(
  value.kind === 'additive' ? value.amount : value.percentage,
) > 0.000_001)

export const perSecond = (
  sourceValue: ResultSource,
  amount: number,
  recipient: Recipient,
): SourceBoundCurrentClause => additive(
  'energyRegen',
  'combat',
  sourceValue,
  amount,
  recipient,
  undefined,
  {
    value: amount,
    unit: '/s',
    decimals: Number.isInteger(amount) ? 0 : 2,
  },
)

const decimals = (value: number) => Number.isInteger(value) ? 0 : 1

export function resolveDeliveredClauses(
  clauses: SourceBoundCurrentClause[],
  bases: Partial<Record<EffectMetric, number>>,
): ResolvedCurrentEffect[] {
  return clauses.map((clause) => {
    const amount = clause.value.kind === 'additive'
      ? clause.value.amount
      : (bases[clause.metric] ?? 0) * clause.value.percentage / 100
    const display = clause.value.kind === 'basis-percentage'
      ? {
        value: clause.value.percentage,
        unit: '%' as const,
        decimals: decimals(clause.value.percentage),
      }
      : clause.value.display
    return {
      metric: clause.metric,
      earliestSurface: clause.earliestSurface,
      source: clause.source,
      amount,
      ...(clause.action ? { action: clause.action } : {}),
      ...(display ? { display } : {}),
    }
  }).filter(({ amount }) => Math.abs(amount) > 0.000_001)
}
