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
> & { engineId: EngineId; refinement: Refinement; fourPieceId: DiscId; twoPieceId: DiscId }

export interface ResolvedSetupInput {
  rawValue: number
  unit: '%' | ''
  source: ResultSource
}

export type EffectMetric =
  | 'maxHp' | 'atk' | 'sheerForce' | 'impact' | 'critRate' | 'critDmg'
  | 'dmgBonus' | 'sheerDmgBonus' | 'resIgnore' | 'dazeBonus'
  | 'stunDmgMultiplier' | 'energyRegen' | 'stunDuration'

export type YixuanActionEffect =
  | 'coreActions' | 'exSpecialStunned' | 'mindscapeCloudShaper'
  | 'engineSheerActions' | 'mindscapeEtherResIgnore'
export type Recipient = 'self' | 'focus' | 'all-party' | 'other-party' | 'enemy-context'

export interface ResolvedCurrentEffect {
  metric: EffectMetric
  earliestSurface: SurfaceKey
  amount: number
  source: ResultSource
  action?: YixuanActionEffect
  display?: { value: number; unit: '%' | '/s'; decimals: number }
}

export interface SourceBoundCurrentClause {
  metric: EffectMetric
  earliestSurface: SurfaceKey
  source: ResultSource
  recipient: Recipient
  action?: YixuanActionEffect
  value: { kind: 'additive'; amount: number; display?: ResolvedCurrentEffect['display'] }
    | { kind: 'basis-percentage'; percentage: number }
}

export interface ProviderObservation {
  initialCritRate?: number
  squadSheer?: { value: number; source: ResultSource }
}

export const source = (label: string, ownerAgentId: AgentId, locus: SourceLocus, detail?: string): ResultSource =>
  ({ label, detail, ownerAgentId, locus })

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

export const mindscapeSource = (agentId: AgentId, minimumMindscape: number, condition?: string): ResultSource =>
  source(SOURCE_LABELS.mindscape, agentId, 'mindscape', [`M${minimumMindscape}`, condition].filter(Boolean).join(' · '))

export const completeSetup = (slot: AppliedAgentSlot): CompleteSetup => slot.setup as CompleteSetup

export function engineSource(agentId: AgentId, setup: CompleteSetup): ResultSource {
  return source(W_ENGINES[setup.engineId].name, agentId, 'w-engine', `W${setup.refinement}`)
}

export function discSource(agentId: AgentId, discId: DiscId, piece: '4-piece' | '2-piece'): ResultSource {
  const label = agentId === 'dialyn' && discId === 'swingJazz' && piece === '2-piece'
    ? 'Swing Jazz or Moonlight Lullaby' : DRIVE_DISCS[discId].name
  return source(label, agentId, piece === '4-piece' ? 'disc-4pc' : 'disc-2pc', piece)
}

export const mainSource = (agentId: AgentId, slot: MainSlot): ResultSource =>
  source(SOURCE_LABELS[slot], agentId, `disc-${slot.replace('slot', 'slot-')}` as SourceLocus)

export function substatSource(agentId: AgentId, substatId: SubstatId): ResultSource {
  const index = SUBSTAT_CHOICES_BY_AGENT[agentId].findIndex(({ id }) => id === substatId)
  return source('Effective substat hits', agentId, `substat-${index + 1}` as SourceLocus,
    SUBSTAT_CHOICES_BY_AGENT[agentId][index].label)
}

export function effectiveSubstatInput(setup: CompleteSetup, agentId: AgentId, substatId: SubstatId): ResolvedSetupInput | undefined {
  const choice = SUBSTAT_CHOICES_BY_AGENT[agentId].find(({ id }) => id === substatId)
  return choice && { rawValue: (setup.substats[substatId] ?? 0) * choice.perHit, unit: choice.unit, source: substatSource(agentId, substatId) }
}

export function mainStatInput(setup: CompleteSetup, agentId: AgentId, slot: MainSlot, statId: string): ResolvedSetupInput | undefined {
  const selectedStatId = setup.mains[slot]
  return selectedStatId === statId ? { rawValue: MAIN_STATS[selectedStatId].numericValue, unit: '%', source: mainSource(agentId, slot) } : undefined
}

export function engineAdvancedInput(setup: CompleteSetup, agentId: AgentId, statId: string): ResolvedSetupInput | undefined {
  const advanced = W_ENGINES[setup.engineId].advancedStat
  return advanced.id === statId ? { rawValue: advanced.value, unit: advanced.unit, source: engineSource(agentId, setup) } : undefined
}

export function discStatInput(setup: CompleteSetup, agentId: AgentId, piece: 'fourPiece' | 'twoPiece', discId: DiscId, rawValue: number): ResolvedSetupInput | undefined {
  const selected = piece === 'fourPiece' ? setup.fourPieceId : setup.twoPieceId
  return selected === discId ? { rawValue, unit: '%', source: discSource(agentId, discId, piece === 'fourPiece' ? '4-piece' : '2-piece') } : undefined
}

const decimals = (value: number) => Number.isInteger(value) ? 0 : 1
const additive = (metric: EffectMetric, earliestSurface: SurfaceKey, sourceValue: ResultSource, amount: number, recipient: Recipient, action?: YixuanActionEffect, display?: ResolvedCurrentEffect['display']): SourceBoundCurrentClause =>
  ({ metric, earliestSurface, source: sourceValue, recipient, ...(action ? { action } : {}), value: { kind: 'additive', amount, ...(display ? { display } : {}) } })
const percentage = (metric: EffectMetric, earliestSurface: SurfaceKey, sourceValue: ResultSource, percentageValue: number, recipient: Recipient): SourceBoundCurrentClause =>
  ({ metric, earliestSurface, source: sourceValue, recipient, value: { kind: 'basis-percentage', percentage: percentageValue } })
const active = (clauses: SourceBoundCurrentClause[]) => clauses.filter(({ value }) => Math.abs(value.kind === 'additive' ? value.amount : value.percentage) > 0.000_001)
const perSecond = (sourceValue: ResultSource, amount: number, recipient: Recipient): SourceBoundCurrentClause =>
  additive('energyRegen', 'combat', sourceValue, amount, recipient, undefined, { value: amount, unit: '/s', decimals: Number.isInteger(amount) ? 0 : 2 })

export function resolveProviderClauses(slot: AppliedAgentSlot, observation: ProviderObservation = {}): SourceBoundCurrentClause[] {
  const setup = completeSetup(slot)
  const agentId = slot.agentId
  const engine = engineSource(agentId, setup)
  const fourPiece = discSource(agentId, setup.fourPieceId, '4-piece')
  const refinement = setup.refinement
  const v = VERTICAL_VALUES

  if (agentId === 'yixuan') return active([
    additive('critRate', 'combat', engine, setup.engineId === 'qingming' ? scaledEngineValue(W_ENGINE_FACTS.qingming.critRate, refinement) : 0, 'self'),
    additive('critRate', 'combat', mindscapeSource('yixuan', 1), setup.mindscape >= 1 ? v.yixuan.mindscapeCritRate : 0, 'self'),
    additive('critRate', 'fully', engine, setup.engineId === 'cauldron' ? scaledEngineValue(W_ENGINE_FACTS.cauldron.critRate, refinement) : 0, 'self'),
    additive('critRate', 'fully', fourPiece, setup.fourPieceId === 'yunkui' ? DRIVE_DISC_FACTS.yunkui.critRate : 0, 'self'),
    additive('critDmg', 'fully', STATIC_SOURCES.yixuan.additional, v.yixuan.additionalCritDmg, 'self'),
    additive('critDmg', 'fully', engine, setup.engineId === 'puzzleSphere' ? scaledEngineValue(W_ENGINE_FACTS.puzzleSphere.critDmg, refinement) : 0, 'self'),
    additive('dmgBonus', 'combat', engine, setup.engineId === 'qingming' ? scaledEngineValue(W_ENGINE_FACTS.qingming.etherDmg, refinement) : 0, 'self'),
    additive('dmgBonus', 'fully', engine, setup.engineId === 'cauldron' ? scaledEngineValue(W_ENGINE_FACTS.cauldron.dmg, refinement) : 0, 'self'),
    additive('sheerForce', 'fully', engine, setup.engineId === 'radiowave' ? scaledEngineValue(W_ENGINE_FACTS.radiowave.sheerForce, refinement) : 0, 'self'),
    additive('sheerDmgBonus', 'fully', fourPiece, setup.fourPieceId === 'yunkui' ? DRIVE_DISC_FACTS.yunkui.sheerDmg : 0, 'self'),
    additive('sheerDmgBonus', 'fully', mindscapeSource('yixuan', 6, 'during Meditation'), setup.mindscape >= 6 ? v.yixuan.mindscapeMeditationSheerDmg : 0, 'self'),
    additive('dmgBonus', 'combat', STATIC_SOURCES.yixuan.core, v.yixuan.coreActionDmgBonus, 'self', 'coreActions'),
    additive('dmgBonus', 'fully', STATIC_SOURCES.yixuan.additional, v.yixuan.additionalExDmgBonus, 'self', 'exSpecialStunned'),
    additive('dmgBonus', 'fully', engine, setup.engineId === 'puzzleSphere' ? scaledEngineValue(W_ENGINE_FACTS.puzzleSphere.actionExDmg, refinement) : 0, 'self', 'exSpecialStunned'),
    additive('dmgBonus', 'fully', mindscapeSource('yixuan', 4, '30% x 2 stacks'), setup.mindscape >= 4 ? v.yixuan.mindscapeActionDmgPerStack * 2 : 0, 'self', 'mindscapeCloudShaper'),
    additive('sheerDmgBonus', 'combat', engine, setup.engineId === 'qingming' ? scaledEngineValue(W_ENGINE_FACTS.qingming.actionSheerDmg, refinement) : 0, 'self', 'engineSheerActions'),
    additive('resIgnore', 'fully', mindscapeSource('yixuan', 2, 'Ether RES Ignore'), setup.mindscape >= 2 ? v.yixuan.mindscapeEtherResIgnore : 0, 'enemy-context', 'mindscapeEtherResIgnore'),
    additive('stunDuration', 'fully', mindscapeSource('yixuan', 2), setup.mindscape >= 2 ? v.yixuan.mindscapeStunExtension : 0, 'enemy-context'),
  ])

  if (agentId === 'dialyn') {
    const initialCrit = observation.initialCritRate ?? 0
    const impact = Math.min(Math.max(initialCrit - v.dialyn.critThreshold, 0) * v.dialyn.impactPerCrit, v.dialyn.impactBonusCap)
    const kingCrit = setup.fourPieceId === 'king'
      ? DRIVE_DISC_FACTS.king.squadCritDmg.base + (initialCrit >= v.dialyn.critThreshold ? DRIVE_DISC_FACTS.king.squadCritDmg.atCritThreshold : 0) : 0
    const laterImpact = setup.engineId === 'hellfireGears' ? scaledEngineValue(W_ENGINE_FACTS.hellfireGears.impact, refinement)
      : setup.engineId === 'steamOven' ? scaledEngineValue(W_ENGINE_FACTS.steamOven.impact, refinement) : 0
    const energy = setup.engineId === 'yesterdayCalls' ? scaledEngineValue(W_ENGINE_FACTS.yesterdayCalls.energyPerSecond, refinement)
      : setup.engineId === 'chiefSidekick' ? scaledEngineValue(W_ENGINE_FACTS.chiefSidekick.energyPerSecond, refinement)
      : setup.engineId === 'hellfireGears' ? scaledEngineValue(W_ENGINE_FACTS.hellfireGears.energyPerSecond, refinement) : 0
    return active([
      additive('impact', 'combat', STATIC_SOURCES.dialyn.core, impact, 'self'),
      additive('impact', 'combat', engine, setup.engineId === 'chiefSidekick' ? scaledEngineValue(W_ENGINE_FACTS.chiefSidekick.flatImpact, refinement) : 0, 'self'),
      percentage('impact', 'fully', engine, laterImpact, 'self'),
      additive('dazeBonus', 'fully', engine, setup.engineId === 'yesterdayCalls' ? scaledEngineValue(W_ENGINE_FACTS.yesterdayCalls.daze, refinement) : 0, 'self'),
      perSecond(engine, energy, 'self'),
      additive('dmgBonus', 'fully', STATIC_SOURCES.dialyn.additional, v.party.dialynDmg, 'all-party'),
      additive('critDmg', 'fully', engine, setup.engineId === 'yesterdayCalls' ? scaledEngineValue(W_ENGINE_FACTS.yesterdayCalls.squadCritDmg, refinement) : 0, 'all-party'),
      additive('critDmg', 'fully', fourPiece, kingCrit, 'all-party'),
      additive('dmgBonus', 'fully', mindscapeSource('dialyn', 2, 'against Malicious Complaint'), setup.mindscape >= 2 ? v.dialyn.mindscapeDmg : 0, 'focus'),
      additive('stunDmgMultiplier', 'fully', STATIC_SOURCES.dialyn.core, v.party.dialynStunMultiplier, 'enemy-context'),
      additive('stunDmgMultiplier', 'fully', mindscapeSource('dialyn', 2), setup.mindscape >= 2 ? v.dialyn.mindscapeStunMultiplier : 0, 'enemy-context'),
      additive('stunDuration', 'fully', STATIC_SOURCES.dialyn.core, v.party.dialynStunExtension, 'enemy-context'),
      additive('resIgnore', 'fully', mindscapeSource('dialyn', 1, 'Overwhelmingly Positive'), setup.mindscape >= 1 ? v.dialyn.mindscapeResIgnore : 0, 'enemy-context'),
    ])
  }

  const engineHp = setup.engineId === 'dreamlitHearth' ? scaledEngineValue(W_ENGINE_FACTS.dreamlitHearth.hpPct, refinement) : 0
  const engineEnergy = setup.engineId === 'dreamlitHearth' ? scaledEngineValue(W_ENGINE_FACTS.dreamlitHearth.energyPerSecond, refinement)
    : setup.engineId === 'thoughtbop' ? scaledEngineValue(W_ENGINE_FACTS.thoughtbop.energyPerSecond, refinement)
    : setup.engineId === 'weepingCradle' ? scaledEngineValue(W_ENGINE_FACTS.weepingCradle.energyPerSecond, refinement) : 0
  const engineAtk = setup.engineId === 'kaboom' ? scaledEngineValue(W_ENGINE_FACTS.kaboom.squadAtkPct, refinement) : 0
  const critRate = setup.engineId === 'unfetteredGameBall' ? W_ENGINE_FACTS.unfetteredGameBall.squadCritRateBase + refinement * W_ENGINE_FACTS.unfetteredGameBall.squadCritRatePerRefinement : 0
  const engineDmg = setup.engineId === 'dreamlitHearth' ? scaledEngineValue(W_ENGINE_FACTS.dreamlitHearth.squadDmg, refinement)
    : setup.engineId === 'weepingCradle' ? scaledEngineValue(W_ENGINE_FACTS.weepingCradle.squadDmg, refinement) : 0
  return active([
    percentage('maxHp', 'fully', STATIC_SOURCES.lucia.core, v.party.luciaCoreHp, 'all-party'),
    percentage('maxHp', 'fully', engine, engineHp, 'all-party'),
    percentage('atk', 'fully', engine, engineAtk, 'all-party'),
    additive('critRate', 'fully', engine, critRate, 'all-party'),
    additive('critDmg', 'fully', STATIC_SOURCES.lucia.additional, v.party.luciaCritDmg, 'all-party'),
    additive('dmgBonus', 'fully', STATIC_SOURCES.lucia.core, v.party.luciaCoreDmg, 'all-party'),
    additive('dmgBonus', 'fully', fourPiece, setup.fourPieceId === 'moonlight' ? DRIVE_DISC_FACTS.moonlight.squadDmg : 0, 'all-party'),
    additive('dmgBonus', 'fully', engine, engineDmg, 'all-party'),
    additive('sheerForce', 'fully', observation.squadSheer?.source ?? STATIC_SOURCES.lucia.exSpecial, observation.squadSheer?.value ?? 0, 'all-party'),
    additive('sheerDmgBonus', 'fully', mindscapeSource('lucia', 2, 'Darkbreaker + Wellspring'), setup.mindscape >= 2 ? v.lucia.mindscapeSheerDmg : 0, 'all-party'),
    additive('resIgnore', 'fully', mindscapeSource('lucia', 1, "Dreamer's Nursery Rhyme"), setup.mindscape >= 1 ? v.lucia.mindscapeResIgnore : 0, 'enemy-context'),
    perSecond(engine, engineEnergy, 'self'),
  ])
}

export function resolveDeliveredClauses(clauses: SourceBoundCurrentClause[], bases: Partial<Record<EffectMetric, number>>): ResolvedCurrentEffect[] {
  return clauses.map((clause) => {
    const amount = clause.value.kind === 'additive'
      ? clause.value.amount
      : (bases[clause.metric] ?? 0) * clause.value.percentage / 100
    const display = clause.value.kind === 'basis-percentage'
      ? { value: clause.value.percentage, unit: '%' as const, decimals: decimals(clause.value.percentage) }
      : clause.value.display
    return { metric: clause.metric, earliestSurface: clause.earliestSurface, source: clause.source, amount, ...(clause.action ? { action: clause.action } : {}), ...(display ? { display } : {}) }
  }).filter(({ amount }) => Math.abs(amount) > 0.000_001)
}
