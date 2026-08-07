import {
  DRIVE_DISC_FACTS,
  DRIVE_DISCS,
  MAIN_STATS,
  SOURCE_LABELS,
  SUBSTAT_CHOICES_BY_AGENT,
  VERTICAL_VALUES,
  W_ENGINE_FACTS,
  W_ENGINES,
  scaledEngineValue,
  type AgentId,
  type DiscId,
  type EngineId,
  type MainSlot,
  type Refinement,
  type SubstatId,
} from './content'
import type { AgentSetupState, WorkbenchState } from './state'

export type SurfaceKey = 'initial' | 'combat' | 'fully'

export type SourceLocus =
  | 'identity'
  | 'w-engine'
  | 'disc-4pc'
  | 'disc-2pc'
  | 'disc-slot-4'
  | 'disc-slot-5'
  | 'disc-slot-6'
  | 'substat-1'
  | 'substat-2'
  | 'substat-3'
  | 'core'
  | 'additional'
  | 'ex-special'
  | 'mindscape'
  | 'calculation'

export interface ResultSource {
  label: string
  detail?: string
  ownerAgentId: AgentId
  locus: SourceLocus
}

export type CompleteSetup = Omit<
  AgentSetupState,
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
  | 'maxHp'
  | 'atk'
  | 'sheerForce'
  | 'impact'
  | 'critRate'
  | 'critDmg'
  | 'dmgBonus'
  | 'sheerDmgBonus'
  | 'resIgnore'
  | 'dazeBonus'
  | 'stunDmgMultiplier'
  | 'energyRegen'

export type YixuanActionEffect =
  | 'coreActions'
  | 'exSpecialStunned'
  | 'mindscapeCloudShaper'
  | 'engineSheerActions'
  | 'mindscapeEtherResIgnore'

export interface ResolvedCurrentEffect {
  metric: EffectMetric
  earliestSurface: SurfaceKey
  amount: number
  source: ResultSource
  action?: YixuanActionEffect
  display?: {
    value: number
    unit: '%' | '/s'
    decimals: number
  }
}

export interface SourceBoundCurrentClause {
  metric: EffectMetric
  earliestSurface: SurfaceKey
  source: ResultSource
  value:
    | {
        kind: 'additive'
        amount: number
        display?: ResolvedCurrentEffect['display']
      }
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
    ruptureConversion: source(
      'Rupture specialty',
      'yixuan',
      'identity',
      'Current ATK × 0.3 + Current Max HP × 0.1',
    ),
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

export function mindscapeSource(
  agentId: AgentId,
  minimumMindscape: number,
  condition?: string,
): ResultSource {
  return source(
    SOURCE_LABELS.mindscape,
    agentId,
    'mindscape',
    [`M${minimumMindscape}`, condition].filter(Boolean).join(' · '),
  )
}

export const completeSetup = (
  state: WorkbenchState,
  agentId: AgentId,
): CompleteSetup => state.setups[agentId] as CompleteSetup

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

export const mainSource = (
  agentId: AgentId,
  slot: MainSlot,
): ResultSource => source(
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
  return choice
    ? {
        rawValue: (setup.substats[substatId] ?? 0) * choice.perHit,
        unit: choice.unit,
        source: substatSource(agentId, substatId),
      }
    : undefined
}

export function mainStatInput(
  setup: CompleteSetup,
  agentId: AgentId,
  slot: MainSlot,
  statId: string,
): ResolvedSetupInput | undefined {
  const selectedStatId = setup.mains[slot]
  if (selectedStatId !== statId) return undefined
  return {
    rawValue: MAIN_STATS[selectedStatId].numericValue,
    unit: '%',
    source: mainSource(agentId, slot),
  }
}

export function engineAdvancedInput(
  setup: CompleteSetup,
  agentId: AgentId,
  statId: string,
): ResolvedSetupInput | undefined {
  const advanced = W_ENGINES[setup.engineId].advancedStat
  return advanced.id === statId
    ? { rawValue: advanced.value, unit: advanced.unit, source: engineSource(agentId, setup) }
    : undefined
}

export function discStatInput(
  setup: CompleteSetup,
  agentId: AgentId,
  piece: 'fourPiece' | 'twoPiece',
  discId: DiscId,
  rawValue: number,
): ResolvedSetupInput | undefined {
  const selectedDiscId = piece === 'fourPiece'
    ? setup.fourPieceId
    : setup.twoPieceId
  return selectedDiscId === discId
    ? {
        rawValue,
        unit: '%',
        source: discSource(agentId, discId, piece === 'fourPiece' ? '4-piece' : '2-piece'),
      }
    : undefined
}

const decimals = (value: number): number => Number.isInteger(value) ? 0 : 1

const effect = (
  metric: EffectMetric,
  earliestSurface: SurfaceKey,
  sourceValue: ResultSource,
  amount: number,
  action?: YixuanActionEffect,
): ResolvedCurrentEffect => ({
  metric,
  earliestSurface,
  source: sourceValue,
  amount,
  ...(action ? { action } : {}),
})

const percentageEffect = (
  metric: EffectMetric,
  earliestSurface: SurfaceKey,
  sourceValue: ResultSource,
  basis: number,
  percentage: number,
): ResolvedCurrentEffect => ({
  ...effect(metric, earliestSurface, sourceValue, basis * percentage / 100),
  display: { value: percentage, unit: '%', decimals: decimals(percentage) },
})

const perSecondEffect = (
  sourceValue: ResultSource,
  amount: number,
): ResolvedCurrentEffect => ({
  ...effect('energyRegen', 'combat', sourceValue, amount),
  display: { value: amount, unit: '/s', decimals: Number.isInteger(amount) ? 0 : 2 },
})

const active = (effects: ResolvedCurrentEffect[]): ResolvedCurrentEffect[] =>
  effects.filter(({ amount }) => Math.abs(amount) > 0.000_001)

const additiveClause = (
  metric: EffectMetric,
  earliestSurface: SurfaceKey,
  sourceValue: ResultSource,
  amount: number,
  display?: ResolvedCurrentEffect['display'],
): SourceBoundCurrentClause => ({
  metric,
  earliestSurface,
  source: sourceValue,
  value: { kind: 'additive', amount, display },
})

const percentageClause = (
  metric: EffectMetric,
  earliestSurface: SurfaceKey,
  sourceValue: ResultSource,
  percentage: number,
): SourceBoundCurrentClause => ({
  metric,
  earliestSurface,
  source: sourceValue,
  value: { kind: 'basis-percentage', percentage },
})

const activeClauses = (
  clauses: SourceBoundCurrentClause[],
): SourceBoundCurrentClause[] => clauses.filter(({ value }) => (
  Math.abs(value.kind === 'additive' ? value.amount : value.percentage) > 0.000_001
))

function routeAdditiveClauses(
  clauses: SourceBoundCurrentClause[],
  metric: EffectMetric,
): ResolvedCurrentEffect[] {
  const routed: ResolvedCurrentEffect[] = []
  for (const clause of clauses) {
    if (clause.metric !== metric || clause.value.kind !== 'additive') continue
    routed.push({
      ...effect(metric, clause.earliestSurface, clause.source, clause.value.amount),
      ...(clause.value.display ? { display: clause.value.display } : {}),
    })
  }
  return routed
}

function routePercentageClauses(
  clauses: SourceBoundCurrentClause[],
  metric: EffectMetric,
  basis: number,
): ResolvedCurrentEffect[] {
  const routed: ResolvedCurrentEffect[] = []
  for (const clause of clauses) {
    if (clause.metric !== metric || clause.value.kind !== 'basis-percentage') continue
    routed.push(percentageEffect(
      metric,
      clause.earliestSurface,
      clause.source,
      basis,
      clause.value.percentage,
    ))
  }
  return routed
}

export interface YixuanEffectContext {
  initialHp: number
  baseAtk: number
  dialynInitialCritRate: number
  luciaSquadSheer: { value: number; source: ResultSource }
}

export function resolveYixuanEffects(
  state: WorkbenchState,
  context: YixuanEffectContext,
  luciaClauses: SourceBoundCurrentClause[],
): ResolvedCurrentEffect[] {
  const values = VERTICAL_VALUES
  const yixuan = values.yixuan
  const setup = completeSetup(state, 'yixuan')
  const dialynSetup = completeSetup(state, 'dialyn')
  const yixuanEngineSource = engineSource('yixuan', setup)
  const dialynEngineSource = engineSource('dialyn', dialynSetup)
  const yixuanFourPieceSource = discSource('yixuan', setup.fourPieceId, '4-piece')
  const dialynFourPieceSource = discSource('dialyn', dialynSetup.fourPieceId, '4-piece')
  const yixuanRefinement = setup.refinement
  const dialynRefinement = dialynSetup.refinement

  const kingCritDmg = dialynSetup.fourPieceId === 'king'
    ? DRIVE_DISC_FACTS.king.squadCritDmg.base
      + (context.dialynInitialCritRate >= values.dialyn.critThreshold
        ? DRIVE_DISC_FACTS.king.squadCritDmg.atCritThreshold
        : 0)
    : 0
  return active([
    ...routePercentageClauses(luciaClauses, 'maxHp', context.initialHp),
    ...routePercentageClauses(luciaClauses, 'atk', context.baseAtk),
    effect('sheerForce', 'fully', context.luciaSquadSheer.source, context.luciaSquadSheer.value),
    effect(
      'sheerForce',
      'fully',
      yixuanEngineSource,
      setup.engineId === 'radiowave'
        ? scaledEngineValue(W_ENGINE_FACTS.radiowave.sheerForce, yixuanRefinement)
        : 0,
    ),
    effect(
      'critRate',
      'combat',
      yixuanEngineSource,
      setup.engineId === 'qingming'
        ? scaledEngineValue(W_ENGINE_FACTS.qingming.critRate, yixuanRefinement)
        : 0,
    ),
    effect('critRate', 'combat', mindscapeSource('yixuan', 1), setup.mindscape >= 1 ? yixuan.mindscapeCritRate : 0),
    effect(
      'critRate',
      'fully',
      yixuanEngineSource,
      setup.engineId === 'cauldron'
        ? scaledEngineValue(W_ENGINE_FACTS.cauldron.critRate, yixuanRefinement)
        : 0,
    ),
    effect(
      'critRate',
      'fully',
      yixuanFourPieceSource,
      setup.fourPieceId === 'yunkui' ? DRIVE_DISC_FACTS.yunkui.critRate : 0,
    ),
    ...routeAdditiveClauses(luciaClauses, 'critRate'),
    effect('critDmg', 'fully', STATIC_SOURCES.yixuan.additional, yixuan.additionalCritDmg),
    effect(
      'critDmg',
      'fully',
      dialynEngineSource,
      dialynSetup.engineId === 'yesterdayCalls'
        ? scaledEngineValue(W_ENGINE_FACTS.yesterdayCalls.squadCritDmg, dialynRefinement)
        : 0,
    ),
    effect('critDmg', 'fully', dialynFourPieceSource, kingCritDmg),
    ...routeAdditiveClauses(luciaClauses, 'critDmg'),
    effect(
      'critDmg',
      'fully',
      yixuanEngineSource,
      setup.engineId === 'puzzleSphere'
        ? scaledEngineValue(W_ENGINE_FACTS.puzzleSphere.critDmg, yixuanRefinement)
        : 0,
    ),
    effect(
      'dmgBonus',
      'combat',
      yixuanEngineSource,
      setup.engineId === 'qingming'
        ? scaledEngineValue(W_ENGINE_FACTS.qingming.etherDmg, yixuanRefinement)
        : 0,
    ),
    effect('dmgBonus', 'fully', STATIC_SOURCES.dialyn.additional, values.party.dialynDmg),
    effect(
      'dmgBonus',
      'fully',
      mindscapeSource('dialyn', 2, 'against Malicious Complaint'),
      dialynSetup.mindscape >= 2 ? values.dialyn.mindscapeDmg : 0,
    ),
    ...routeAdditiveClauses(luciaClauses, 'dmgBonus'),
    effect(
      'dmgBonus',
      'fully',
      yixuanEngineSource,
      setup.engineId === 'cauldron'
        ? scaledEngineValue(W_ENGINE_FACTS.cauldron.dmg, yixuanRefinement)
        : 0,
    ),
    effect(
      'sheerDmgBonus',
      'fully',
      yixuanFourPieceSource,
      setup.fourPieceId === 'yunkui' ? DRIVE_DISC_FACTS.yunkui.sheerDmg : 0,
    ),
    effect(
      'sheerDmgBonus',
      'fully',
      mindscapeSource('yixuan', 6, 'during Meditation'),
      setup.mindscape >= 6 ? yixuan.mindscapeMeditationSheerDmg : 0,
    ),
    ...routeAdditiveClauses(luciaClauses, 'sheerDmgBonus'),
    effect('stunDmgMultiplier', 'fully', STATIC_SOURCES.dialyn.core, values.party.dialynStunMultiplier),
    effect(
      'stunDmgMultiplier',
      'fully',
      mindscapeSource('dialyn', 2),
      dialynSetup.mindscape >= 2 ? values.dialyn.mindscapeStunMultiplier : 0,
    ),
    effect(
      'resIgnore',
      'fully',
      mindscapeSource('dialyn', 1, 'Overwhelmingly Positive'),
      dialynSetup.mindscape >= 1 ? values.dialyn.mindscapeResIgnore : 0,
    ),
    ...routeAdditiveClauses(luciaClauses, 'resIgnore'),
    effect('dmgBonus', 'combat', STATIC_SOURCES.yixuan.core, yixuan.coreActionDmgBonus, 'coreActions'),
    effect('dmgBonus', 'fully', STATIC_SOURCES.yixuan.additional, yixuan.additionalExDmgBonus, 'exSpecialStunned'),
    effect(
      'dmgBonus',
      'fully',
      yixuanEngineSource,
      setup.engineId === 'puzzleSphere'
        ? scaledEngineValue(W_ENGINE_FACTS.puzzleSphere.actionExDmg, yixuanRefinement)
        : 0,
      'exSpecialStunned',
    ),
    effect(
      'dmgBonus',
      'fully',
      mindscapeSource('yixuan', 4, '30% x 2 stacks'),
      setup.mindscape >= 4 ? yixuan.mindscapeActionDmgPerStack * 2 : 0,
      'mindscapeCloudShaper',
    ),
    effect(
      'sheerDmgBonus',
      'combat',
      yixuanEngineSource,
      setup.engineId === 'qingming'
        ? scaledEngineValue(W_ENGINE_FACTS.qingming.actionSheerDmg, yixuanRefinement)
        : 0,
      'engineSheerActions',
    ),
    effect(
      'resIgnore',
      'fully',
      mindscapeSource('yixuan', 2, 'Ether RES Ignore'),
      setup.mindscape >= 2 ? yixuan.mindscapeEtherResIgnore : 0,
      'mindscapeEtherResIgnore',
    ),
  ])
}

export function resolveDialynEffects(
  state: WorkbenchState,
  initialCritRate: number,
  luciaClauses: SourceBoundCurrentClause[],
): { effects: ResolvedCurrentEffect[]; impactFromCrit: ResolvedCurrentEffect } {
  const values = VERTICAL_VALUES
  const dialyn = values.dialyn
  const setup = completeSetup(state, 'dialyn')
  const selectedEngineSource = engineSource('dialyn', setup)
  const refinement = setup.refinement
  const impactBonus = Math.min(
    Math.max(initialCritRate - dialyn.critThreshold, 0) * dialyn.impactPerCrit,
    dialyn.impactBonusCap,
  )
  const impactFromCrit = effect('impact', 'combat', STATIC_SOURCES.dialyn.core, impactBonus)
  const laterImpactPercentage = setup.engineId === 'hellfireGears'
    ? scaledEngineValue(W_ENGINE_FACTS.hellfireGears.impact, refinement)
    : setup.engineId === 'steamOven'
      ? scaledEngineValue(W_ENGINE_FACTS.steamOven.impact, refinement)
      : 0
  const energyPerSecond = setup.engineId === 'yesterdayCalls'
    ? scaledEngineValue(W_ENGINE_FACTS.yesterdayCalls.energyPerSecond, refinement)
    : setup.engineId === 'chiefSidekick'
      ? scaledEngineValue(W_ENGINE_FACTS.chiefSidekick.energyPerSecond, refinement)
      : setup.engineId === 'hellfireGears'
        ? scaledEngineValue(W_ENGINE_FACTS.hellfireGears.energyPerSecond, refinement)
        : 0

  return {
    impactFromCrit,
    effects: active([
      ...routeAdditiveClauses(luciaClauses, 'critRate'),
      impactFromCrit,
      effect(
        'impact',
        'combat',
        selectedEngineSource,
        setup.engineId === 'chiefSidekick'
          ? scaledEngineValue(W_ENGINE_FACTS.chiefSidekick.flatImpact, refinement)
          : 0,
      ),
      percentageEffect('impact', 'fully', selectedEngineSource, dialyn.impact, laterImpactPercentage),
      effect(
        'dazeBonus',
        'fully',
        selectedEngineSource,
        setup.engineId === 'yesterdayCalls'
          ? scaledEngineValue(W_ENGINE_FACTS.yesterdayCalls.daze, refinement)
          : 0,
      ),
      perSecondEffect(selectedEngineSource, energyPerSecond),
    ]),
  }
}

export function resolveLuciaProviderClauses(
  state: WorkbenchState,
): SourceBoundCurrentClause[] {
  const setup = completeSetup(state, 'lucia')
  const selectedEngineSource = engineSource('lucia', setup)
  const selectedFourPieceSource = discSource('lucia', setup.fourPieceId, '4-piece')
  const refinement = setup.refinement
  const engineHp = setup.engineId === 'dreamlitHearth'
    ? scaledEngineValue(W_ENGINE_FACTS.dreamlitHearth.hpPct, refinement)
    : 0
  const energyPerSecond = setup.engineId === 'dreamlitHearth'
    ? scaledEngineValue(W_ENGINE_FACTS.dreamlitHearth.energyPerSecond, refinement)
    : setup.engineId === 'thoughtbop'
      ? scaledEngineValue(W_ENGINE_FACTS.thoughtbop.energyPerSecond, refinement)
      : setup.engineId === 'weepingCradle'
      ? scaledEngineValue(W_ENGINE_FACTS.weepingCradle.energyPerSecond, refinement)
      : 0
  const engineAtk = setup.engineId === 'kaboom'
    ? scaledEngineValue(W_ENGINE_FACTS.kaboom.squadAtkPct, refinement)
    : 0
  const critRate = setup.engineId === 'unfetteredGameBall'
    ? W_ENGINE_FACTS.unfetteredGameBall.squadCritRateBase
      + refinement * W_ENGINE_FACTS.unfetteredGameBall.squadCritRatePerRefinement
    : 0
  const engineDmg = setup.engineId === 'dreamlitHearth'
    ? scaledEngineValue(W_ENGINE_FACTS.dreamlitHearth.squadDmg, refinement)
    : setup.engineId === 'weepingCradle'
      ? scaledEngineValue(W_ENGINE_FACTS.weepingCradle.squadDmg, refinement)
      : 0

  return activeClauses([
    percentageClause('maxHp', 'fully', STATIC_SOURCES.lucia.core, VERTICAL_VALUES.party.luciaCoreHp),
    percentageClause('maxHp', 'fully', selectedEngineSource, engineHp),
    percentageClause('atk', 'fully', selectedEngineSource, engineAtk),
    additiveClause('critRate', 'fully', selectedEngineSource, critRate),
    additiveClause('critDmg', 'fully', STATIC_SOURCES.lucia.additional, VERTICAL_VALUES.party.luciaCritDmg),
    additiveClause('dmgBonus', 'fully', STATIC_SOURCES.lucia.core, VERTICAL_VALUES.party.luciaCoreDmg),
    additiveClause(
      'dmgBonus',
      'fully',
      selectedFourPieceSource,
      setup.fourPieceId === 'moonlight' ? DRIVE_DISC_FACTS.moonlight.squadDmg : 0,
    ),
    additiveClause('dmgBonus', 'fully', selectedEngineSource, engineDmg),
    additiveClause(
      'sheerDmgBonus',
      'fully',
      mindscapeSource('lucia', 2, 'Darkbreaker + Wellspring'),
      setup.mindscape >= 2 ? VERTICAL_VALUES.lucia.mindscapeSheerDmg : 0,
    ),
    additiveClause(
      'resIgnore',
      'fully',
      mindscapeSource('lucia', 1, "Dreamer's Nursery Rhyme"),
      setup.mindscape >= 1 ? VERTICAL_VALUES.lucia.mindscapeResIgnore : 0,
    ),
    additiveClause(
      'energyRegen',
      'combat',
      selectedEngineSource,
      energyPerSecond,
      {
        value: energyPerSecond,
        unit: '/s',
        decimals: Number.isInteger(energyPerSecond) ? 0 : 2,
      },
    ),
  ])
}

export function resolveLuciaEffects(
  luciaClauses: SourceBoundCurrentClause[],
  initialHp: number,
): ResolvedCurrentEffect[] {
  return active([
    ...routePercentageClauses(luciaClauses, 'maxHp', initialHp),
    ...routeAdditiveClauses(luciaClauses, 'energyRegen'),
  ])
}

export function resolveDialynStunDuration(
  state: WorkbenchState,
): { source: ResultSource; value: number } {
  const yixuanSetup = completeSetup(state, 'yixuan')
  return yixuanSetup.mindscape >= 2
    ? {
        source: mindscapeSource('yixuan', 2),
        value: VERTICAL_VALUES.yixuan.mindscapeStunExtension,
      }
    : {
        source: STATIC_SOURCES.dialyn.core,
        value: VERTICAL_VALUES.party.dialynStunExtension,
      }
}
