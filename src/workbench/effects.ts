import {
  ADMITTED_AGENTS,
  DRIVE_DISC_FACTS,
  DRIVE_DISCS,
  MAIN_STATS,
  SETUP_FORMULA_PARTICIPATION_BY_AGENT,
  SOURCE_LABELS,
  effectiveSubstatChoices,
  W_ENGINES,
  equipmentEffectBaseValue,
  type AgentId,
  type DiscId,
  type EngineId,
  type MainSlot,
  type Refinement,
  type SetupFormulaFamily,
  type SubstatId,
} from './content'
import type { ActionTarget } from './actions'
import type { AgentSetupState, AppliedAgentSlot } from './state'

export type SurfaceKey = 'initial' | 'combat' | 'fully'
export type SourceLocus =
  | 'identity' | 'w-engine' | 'disc-4pc' | 'disc-2pc'
  | 'disc-slot-4' | 'disc-slot-5' | 'disc-slot-6'
  | 'substat-1' | 'substat-2' | 'substat-3'
  | 'core' | 'additional' | 'special' | 'ex-special' | 'mindscape' | 'calculation'

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

export function presentSetupInputs(
  inputs: Array<ResolvedSetupInput | undefined>,
): ResolvedSetupInput[] {
  return inputs.filter((input): input is ResolvedSetupInput => input !== undefined)
}

export type EffectMetric =
  | 'maxHp' | 'atk' | 'def' | 'sheerForce' | 'impact' | 'critRate' | 'critDmg'
  | 'dmgBonus' | 'sheerDmgBonus' | 'resIgnore' | 'dazeBonus'
  | 'stunDmgMultiplier' | 'energyRegen' | 'stunDuration'
  | 'penRatio' | 'defIgnore' | 'resReduction' | 'defReduction' | 'shieldEffect'

export type Recipient = 'self' | 'focus' | 'all-party' | 'other-party' | 'enemy-context'
export type CandidatePressure = 'materialBroadPrePenDefBypass'
export type EffectAttribute = 'Physical' | 'Fire' | 'Ice' | 'Electric' | 'Ether'

export interface ClauseApplicability {
  attributes?: readonly EffectAttribute[]
  formulas?: readonly SetupFormulaFamily[]
}

export interface ClauseRecipientContext {
  agentId?: AgentId
  attribute: EffectAttribute
  formulas: readonly SetupFormulaFamily[]
}

export interface ResolvedCurrentEffect {
  metric: EffectMetric
  earliestSurface: SurfaceKey
  amount: number
  source: ResultSource
  action?: ActionTarget
  eligibleAgentIds?: AgentId[]
  nonstackKey?: SourceBoundCurrentClause['nonstackKey']
  display?: { value: number; unit: '%' | '/s'; decimals: number }
}

export interface SourceBoundCurrentClause {
  metric: EffectMetric
  earliestSurface: SurfaceKey
  source: ResultSource
  recipient: Recipient
  action?: ActionTarget
  eligibleAgentIds?: AgentId[]
  attributes?: readonly EffectAttribute[]
  formulas?: readonly SetupFormulaFamily[]
  nonstackKey?: 'kingOfTheSummit' | 'astralVoiceEntrant' | 'moonlightLullaby' | 'etherVeilWellspring' | 'swingJazz' | 'bunnyInWonderland' | 'kaboomTheCannon' | 'protoPunk' | 'iceJadeTeapot'
  candidatePressure?: CandidatePressure
  value: { kind: 'additive'; amount: number; display?: ResolvedCurrentEffect['display'] }
    | { kind: 'basis-percentage'; percentage: number }
}

export const withCandidatePressure = (
  clause: SourceBoundCurrentClause,
  candidatePressure: CandidatePressure,
): SourceBoundCurrentClause => ({ ...clause, candidatePressure })

export const withApplicability = (
  clause: SourceBoundCurrentClause,
  applicability: ClauseApplicability,
): SourceBoundCurrentClause => ({ ...clause, ...applicability })

/**
 * Astral's entrant effect is equipment-delivered. Its controllable recipient
 * is resolved by the party context, while formula applicability retains the
 * current legal damage consumers without naming individual recipients.
 */
export function astralVoiceEntrantClause(
  agentId: AgentId,
  setup: CompleteSetup,
): SourceBoundCurrentClause | null {
  if (setup.fourPieceId !== 'astralVoice') return null
  return withApplicability(
    additive(
      'dmgBonus',
      'fully',
      discSource(agentId, 'astralVoice', '4-piece'),
      equipmentEffectBaseValue(DRIVE_DISC_FACTS.astralVoice.fourPiece.damage),
      'focus',
      undefined,
      undefined,
      undefined,
      'astralVoiceEntrant',
    ),
    { formulas: ['general_damage', 'sheer_damage'] },
  )
}

function baseAttributeFor(agentId: AgentId): EffectAttribute {
  const attribute = ADMITTED_AGENTS.find(({ id }) => id === agentId)?.attribute
  if (attribute === 'Auric Ink') return 'Ether'
  if (attribute === 'Frost') return 'Ice'
  if (
    attribute === 'Physical'
    || attribute === 'Fire'
    || attribute === 'Ice'
    || attribute === 'Electric'
    || attribute === 'Ether'
  ) return attribute
  throw new Error(`Unsupported Attribute for effect applicability: ${String(attribute)}`)
}

export function clauseAppliesToContext(
  clause: SourceBoundCurrentClause,
  context: ClauseRecipientContext,
): boolean {
  if (
    clause.eligibleAgentIds
    && (!context.agentId || !clause.eligibleAgentIds.includes(context.agentId))
  ) return false
  if (clause.attributes && !clause.attributes.includes(context.attribute)) return false
  const formulas = clause.formulas
  if (formulas && !context.formulas.some((formula) => formulas.includes(formula))) return false
  return true
}

export function clauseAppliesToAgent(
  clause: SourceBoundCurrentClause,
  agentId: AgentId,
): boolean {
  const participation = SETUP_FORMULA_PARTICIPATION_BY_AGENT[agentId]
  return clauseAppliesToContext(clause, {
    agentId,
    attribute: baseAttributeFor(agentId),
    formulas: [...participation.primary, ...participation.residual],
  })
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
  yidhari: {
    ruptureConversion: source('Rupture specialty', 'yidhari', 'identity', 'Current ATK × 0.3 + Current Max HP × 0.1'),
    core: source(SOURCE_LABELS.yidhariCore, 'yidhari', 'core'),
    additional: source(SOURCE_LABELS.yidhariAbility, 'yidhari', 'additional'),
    critCap: source('Displayed CRIT Rate cap', 'yidhari', 'calculation'),
  },
  manato: {
    ruptureConversion: source('Rupture specialty', 'manato', 'identity', 'Current ATK × 0.3 + Current Max HP × 0.1'),
    core: source(SOURCE_LABELS.manatoCore, 'manato', 'core'),
    coreHp: source(SOURCE_LABELS.manatoCore, 'manato', 'core', 'Completed Core HP enhancements'),
    critCap: source('Displayed CRIT Rate cap', 'manato', 'calculation'),
  },
  hugo: {
    core: source(SOURCE_LABELS.hugoCore, 'hugo', 'core'),
    additional: source(SOURCE_LABELS.hugoAbility, 'hugo', 'additional'),
    critCap: source('Displayed CRIT Rate cap', 'hugo', 'calculation'),
  },
  juFufu: {
    core: source(SOURCE_LABELS.juFufuCore, 'juFufu', 'core'),
    critCap: source('Displayed CRIT Rate cap', 'juFufu', 'calculation'),
  },
  panYinhu: {
    core: source(SOURCE_LABELS.panYinhuCore, 'panYinhu', 'core'),
    additional: source(SOURCE_LABELS.panYinhuAbility, 'panYinhu', 'additional'),
  },
  banyue: {
    ruptureConversion: source('Rupture specialty', 'banyue', 'identity', 'Current ATK × 0.3 + Current Max HP × 0.1'),
    core: source(SOURCE_LABELS.banyueCore, 'banyue', 'core'),
    additional: source(SOURCE_LABELS.banyueAbility, 'banyue', 'additional'),
    critCap: source('Displayed CRIT Rate cap', 'banyue', 'calculation'),
  },
  starlightBilly: {
    ruptureConversion: source('Rupture specialty', 'starlightBilly', 'identity', 'Current ATK × 0.3 + Current Max HP × 0.1'),
    core: source(SOURCE_LABELS.starlightBillyCore, 'starlightBilly', 'core'),
    additional: source(SOURCE_LABELS.starlightBillyAbility, 'starlightBilly', 'additional'),
    critCap: source('Displayed CRIT Rate cap', 'starlightBilly', 'calculation'),
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
  anbySoldier0: {
    core: source(SOURCE_LABELS.anbyCore, 'anbySoldier0', 'core'),
    additional: source(SOURCE_LABELS.anbyAbility, 'anbySoldier0', 'additional'),
    critCap: source('Displayed CRIT Rate cap', 'anbySoldier0', 'calculation'),
  },
  trigger: {
    core: source(SOURCE_LABELS.triggerCore, 'trigger', 'core'),
    additional: source(SOURCE_LABELS.triggerAbility, 'trigger', 'additional'),
    critCap: source('Displayed CRIT Rate cap', 'trigger', 'calculation'),
  },
  astraYao: {
    core: source(SOURCE_LABELS.astraCore, 'astraYao', 'core'),
    cadenza: source(SOURCE_LABELS.astraCadenza, 'astraYao', 'special'),
  },
  seed: {
    core: source(SOURCE_LABELS.seedCore, 'seed', 'core'),
    additional: source(SOURCE_LABELS.seedAbility, 'seed', 'additional'),
    critCap: source('Displayed CRIT Rate cap', 'seed', 'calculation'),
  },
  cissia: {
    core: source(SOURCE_LABELS.cissiaCore, 'cissia', 'core'),
    additional: source(SOURCE_LABELS.cissiaAbility, 'cissia', 'additional'),
    basic: source(SOURCE_LABELS.cissiaBasic, 'cissia', 'special'),
    ultimate: source('Ultimate', 'cissia', 'special'),
    critCap: source('Displayed CRIT Rate cap', 'cissia', 'calculation'),
  },
  evelyn: {
    core: source(SOURCE_LABELS.evelynCore, 'evelyn', 'core'),
    additional: source(SOURCE_LABELS.evelynAbility, 'evelyn', 'additional'),
    critCap: source('Displayed CRIT Rate cap', 'evelyn', 'calculation'),
  },
  corin: {
    core: source(SOURCE_LABELS.corinCore, 'corin', 'core'),
    additional: source(SOURCE_LABELS.corinAbility, 'corin', 'additional'),
    critCap: source('Displayed CRIT Rate cap', 'corin', 'calculation'),
  },
  lycaon: {
    core: source(SOURCE_LABELS.lycaonCore, 'lycaon', 'core'),
    coreDebuff: source(
      SOURCE_LABELS.lycaonCore,
      'lycaon',
      'core',
      'After EX Special, Assist Follow-Up, or Glacial Waltz',
    ),
    additional: source(SOURCE_LABELS.lycaonAbility, 'lycaon', 'additional'),
    potential: source(
      SOURCE_LABELS.lycaonPotential,
      'lycaon',
      'identity',
      'Non-active during Encircle Prey',
    ),
    critCap: source('Displayed CRIT Rate cap', 'lycaon', 'calculation'),
  },
  ellen: {
    core: source(SOURCE_LABELS.ellenCore, 'ellen', 'core'),
    additional: source(SOURCE_LABELS.ellenAbility, 'ellen', 'additional'),
    potential: source(SOURCE_LABELS.ellenPotential, 'ellen', 'identity'),
    critCap: source('Displayed CRIT Rate cap', 'ellen', 'calculation'),
  },
  soukaku: {
    core: source(SOURCE_LABELS.soukakuCore, 'soukaku', 'core'),
    additional: source(SOURCE_LABELS.soukakuAbility, 'soukaku', 'additional'),
  },
  lucy: {
    core: source(SOURCE_LABELS.lucyCore, 'lucy', 'core'),
    additional: source(SOURCE_LABELS.lucyAbility, 'lucy', 'additional'),
  },
  ben: {
    core: source(SOURCE_LABELS.benCore, 'ben', 'core'),
    additional: source(SOURCE_LABELS.benAbility, 'ben', 'additional'),
    critCap: source('Displayed CRIT Rate cap', 'ben', 'calculation'),
  },
  koleda: {
    core: source(SOURCE_LABELS.koledaCore, 'koleda', 'core'),
    additional: source(SOURCE_LABELS.koledaAbility, 'koleda', 'additional'),
    critCap: source('Displayed CRIT Rate cap', 'koleda', 'calculation'),
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
  effectPiece: '4-piece' | '2-piece',
  ownerPiece: '4-piece' | '2-piece' = effectPiece,
): ResultSource {
  return source(
    DRIVE_DISCS[discId].name,
    agentId,
    ownerPiece === '4-piece' ? 'disc-4pc' : 'disc-2pc',
    effectPiece,
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
  setup: Pick<CompleteSetup, 'fourPieceId'>,
  substatId: SubstatId,
): ResultSource {
  const choices = effectiveSubstatChoices(agentId, setup)
  const index = choices.findIndex(({ id }) => id === substatId)
  const choice = choices[index]
  if (!choice) throw new Error(`Inactive substat input: ${agentId}:${substatId}`)
  return source(
    'Effective substat hits',
    agentId,
    `substat-${index + 1}` as SourceLocus,
    choice.label,
  )
}

export function effectiveSubstatInput(
  setup: CompleteSetup,
  agentId: AgentId,
  substatId: SubstatId,
): ResolvedSetupInput | undefined {
  const choice = effectiveSubstatChoices(agentId, setup)
    .find(({ id }) => id === substatId)
  const count = setup.substats[substatId]
  return choice && Number.isFinite(count) ? {
    rawValue: count! * choice.perHit,
    unit: choice.unit,
    source: substatSource(agentId, setup, substatId),
  } : undefined
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
  effectPiece: 'fourPiece' | 'twoPiece' = piece,
): ResolvedSetupInput | undefined {
  const selected = piece === 'fourPiece' ? setup.fourPieceId : setup.twoPieceId
  return selected === discId
    ? {
      rawValue,
      unit: '%',
      source: discSource(
        agentId,
        discId,
        effectPiece === 'fourPiece' ? '4-piece' : '2-piece',
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
  action?: ActionTarget,
  display?: ResolvedCurrentEffect['display'],
  eligibleAgentIds?: AgentId[],
  nonstackKey?: SourceBoundCurrentClause['nonstackKey'],
): SourceBoundCurrentClause => ({
  metric,
  earliestSurface,
  source: sourceValue,
  recipient,
  ...(action ? { action } : {}),
  ...(eligibleAgentIds ? { eligibleAgentIds } : {}),
  ...(nonstackKey ? { nonstackKey } : {}),
  value: { kind: 'additive', amount, ...(display ? { display } : {}) },
})

export const percentage = (
  metric: EffectMetric,
  earliestSurface: SurfaceKey,
  sourceValue: ResultSource,
  percentageValue: number,
  recipient: Recipient,
  action?: ActionTarget,
  eligibleAgentIds?: AgentId[],
  nonstackKey?: SourceBoundCurrentClause['nonstackKey'],
): SourceBoundCurrentClause => ({
  metric,
  earliestSurface,
  source: sourceValue,
  recipient,
  ...(action ? { action } : {}),
  ...(eligibleAgentIds ? { eligibleAgentIds } : {}),
  ...(nonstackKey ? { nonstackKey } : {}),
  value: { kind: 'basis-percentage', percentage: percentageValue },
})

export const active = (
  clauses: SourceBoundCurrentClause[],
): SourceBoundCurrentClause[] => clauses.filter(({ value }) => Math.abs(
  value.kind === 'additive' ? value.amount : value.percentage,
) > 0.000_001)

export function pufferElectroFourPieceClauses(
  agentId: AgentId,
  setup: CompleteSetup,
  ultimateAction: ActionTarget,
): SourceBoundCurrentClause[] {
  if (setup.fourPieceId !== 'pufferElectro') return []
  const fourPiece = discSource(agentId, 'pufferElectro', '4-piece')
  return [
    percentage(
      'atk',
      'fully',
      fourPiece,
      equipmentEffectBaseValue(DRIVE_DISC_FACTS.pufferElectro.fourPiece.atk),
      'self',
    ),
    additive(
      'dmgBonus',
      'initial',
      fourPiece,
      equipmentEffectBaseValue(DRIVE_DISC_FACTS.pufferElectro.fourPiece.damage),
      'self',
      ultimateAction,
    ),
  ]
}

export function additiveMetricBundle<TMetric extends EffectMetric>(
  metrics: Readonly<Record<TMetric, number>>,
  earliestSurface: SurfaceKey,
  sourceValue: ResultSource,
  recipient: Recipient,
  eligibleAgentIds?: readonly AgentId[],
): SourceBoundCurrentClause[] {
  return active((Object.entries(metrics) as [TMetric, number][]).map(
    ([metric, amount]) => additive(
      metric,
      earliestSurface,
      sourceValue,
      amount,
      recipient,
      undefined,
      undefined,
      eligibleAgentIds ? [...eligibleAgentIds] : undefined,
    ),
  ))
}

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
      ...(clause.eligibleAgentIds ? { eligibleAgentIds: clause.eligibleAgentIds } : {}),
      ...(clause.nonstackKey ? { nonstackKey: clause.nonstackKey } : {}),
      ...(display ? { display } : {}),
    }
  }).filter(({ amount }) => Math.abs(amount) > 0.000_001)

}
