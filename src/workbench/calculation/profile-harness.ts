import {
  BASIC_AFTERSHOCK_TARGET,
  actionTarget,
  canonicalAction,
  sameActionTarget,
  type ActionTarget,
  type CanonicalActionKind,
} from '../actions'
import {
  ADMITTED_AGENTS,
  SETUP_FORMULA_PARTICIPATION_BY_AGENT,
  type AgentId,
} from '../content'
import type { EffectMetric, SurfaceKey } from '../effects'
import { effectAttributeForAgent } from '../formula-policy'
import { isCompleteWorkbench, type WorkbenchState } from '../state'
import {
  composeActionHierarchy,
  composeMetricEffects,
  surfaces,
  type ActionScopeNode,
} from './composition'
import {
  deliverProviderRelationships,
  resolveHighestNonstack,
  type DeliveredProfileEffects,
  type DeliveryRecipientContext,
} from './delivery'
import { deriveAnbySoldier0Aftershock } from './derived/anby-soldier-0-aftershock'
import {
  deriveJanePassionAssault,
  JANE_ASSAULT_TARGET,
  JANE_PASSION_TARGET,
} from './derived/jane-passion-assault'
import { deriveLighterImpactElation } from './derived/lighter-impact-elation'
import { deriveRuptureSheerForce } from './derived/rupture-sheer-force'
import { deriveTriggerAftershockDaze } from './derived/trigger-aftershock-daze'
import {
  evaluateProjectionGauge,
  evaluatePostDeliveryStatModifierGauge,
  evaluateRelationships,
  evaluateThresholdOperation,
  type EvaluatedGauge,
  type EvaluatedRelationships,
  type ModifierAtom,
  type OperationAtom,
  type ProviderRelationship,
  type AutomaticEnergyAtom,
  type ProfileRelationship,
  type ProfileStatAtom,
} from './relationships'
import {
  resultSourceFor,
  type AgentResult,
  type Contribution,
  type GaugeResult,
  type PartyResult,
  type ResultMetric,
} from './result'
import type { SelectedSourceInstance } from './source-instance'
import {
  composeStat,
  composeAutomaticEnergyRecovery,
  type ComposedStat,
  type StatContribution,
  type StatId,
} from './stat-composer'

export interface MetricProjection {
  id: EffectMetric
  label: string
  unit: string
  decimals: number
  statId?: StatId
  baseValues?: Record<SurfaceKey, number>
  cap?: { value: number; source: SelectedSourceInstance }
  gaugeId?: string
  admission?:
    | 'nonzero-or-action'
    | 'action'
    | 'disclosed-or-action'
  resultVisibility?: 'visible' | 'action-only'
}

export interface ActionProjection {
  metricId: EffectMetric
  scopes: readonly ActionScopeNode[]
  cap?: { value: number; source: SelectedSourceInstance }
}

export interface AgentSourceProfile {
  agentId: AgentId
  appliedPartySlot: 0 | 1 | 2
  relationships: readonly ProfileRelationship[]
  metrics: readonly MetricProjection[]
  actions?: readonly ActionProjection[]
  /** Present only on Anby: Soldier 0's profile. */
  anbyAftershockSource?: SelectedSourceInstance
  /** Present only on Jane's one-pass Passion and Assault derivation. */
  janePassionAssault?: {
    coreSource: SelectedSourceInstance
    mindscape1Source?: SelectedSourceInstance
  }
  /** Present only on a Rupture profile with a visible Sheer Force metric. */
  ruptureSheerSource?: SelectedSourceInstance
  /** Present only while Trigger's exact Additional Ability predicate is active. */
  triggerAftershockDazeSource?: SelectedSourceInstance
  /** Present only on Lighter's action-local Impact and Elation consumer. */
  lighterImpactElation?: {
    coreImpactSource: SelectedSourceInstance
    additionalSource: SelectedSourceInstance
    active: boolean
    outputMultiplier: number
  }
}

type DerivedMetricBases = Partial<Record<
  EffectMetric,
  Pick<ResultMetric, 'values' | 'breakdown'>
>>

function stableProviderOrder(
  providers: readonly ProviderRelationship[],
): ProviderRelationship[] {
  const agentOrder = ADMITTED_AGENTS.map(({ id }) => id)
  return [...providers].sort((left, right) => {
    const holderOrder = agentOrder.indexOf(left.source.holderAgentId)
      - agentOrder.indexOf(right.source.holderAgentId)
    return holderOrder || JSON.stringify(left.source.definition.key)
      .localeCompare(JSON.stringify(right.source.definition.key))
  })
}

interface ResolvedStat {
  composed: ComposedStat
  equalOrigins: ProfileStatAtom[]
}

interface EvaluatedProfile {
  profile: AgentSourceProfile
  evaluated: EvaluatedRelationships
}

function assertProfilesMatchState(
  state: WorkbenchState,
  profiles: readonly AgentSourceProfile[],
): AgentSourceProfile[] {
  if (profiles.length !== 3) throw new Error('A complete profile party requires three profiles')
  const bySlot = new Map(profiles.map((profile) => [profile.appliedPartySlot, profile]))
  return state.slots.map(({ agentId }, slot) => {
    const profile = bySlot.get(slot as 0 | 1 | 2)
    if (!profile || profile.agentId !== agentId) {
      throw new Error(`Profile slot ${slot} must match the current Agent`)
    }
    for (const relationship of profile.relationships) {
      const source = relationshipSource(relationship)
      if (
        source.holderAgentId !== profile.agentId
        || source.appliedPartySlot !== profile.appliedPartySlot
      ) {
        throw new Error(`Profile slot ${slot} contains a source from another holder snapshot`)
      }
    }
    if (
      profile.anbyAftershockSource
      && (
        profile.agentId !== 'anbySoldier0'
        || profile.anbyAftershockSource.holderAgentId !== profile.agentId
        || profile.anbyAftershockSource.appliedPartySlot !== profile.appliedPartySlot
      )
    ) {
      throw new Error('The named Anby derivation requires Anby\'s current holder source')
    }
    if (profile.janePassionAssault) {
      const { coreSource, mindscape1Source } = profile.janePassionAssault
      if (
        profile.agentId !== 'jane'
        || coreSource.holderAgentId !== profile.agentId
        || coreSource.appliedPartySlot !== profile.appliedPartySlot
        || (mindscape1Source && (
          mindscape1Source.holderAgentId !== profile.agentId
          || mindscape1Source.appliedPartySlot !== profile.appliedPartySlot
        ))
      ) {
        throw new Error('Jane Passion and Assault derivation requires Jane\'s current holder sources')
      }
      const hasGauge = profile.metrics.some((metric) => (
        metric.id === 'anomalyProficiency'
        && metric.gaugeId === 'janePassionAssault'
      ))
      const hasAssaultCrit = ['critRate', 'critDmg'].every((metricId) => (
        profile.actions?.some((projection) => (
          projection.metricId === metricId
          && projection.scopes.some(({ target }) => (
            sameActionTarget(target, JANE_ASSAULT_TARGET)
          ))
        ))
      ))
      const hasPassionM1 = !mindscape1Source || ['anomalyBuildupBonus', 'dmgBonus'].every(
        (metricId) => profile.actions?.some((projection) => (
          projection.metricId === metricId
          && projection.scopes.some(({ target }) => (
            sameActionTarget(target, JANE_PASSION_TARGET)
          ))
        )),
      )
      if (!hasGauge || !hasAssaultCrit || !hasPassionM1) {
        throw new Error('Jane Passion and Assault derivation requires its gauge and action consumers')
      }
    }
    for (const [source, expectedAgent, label] of [
      [profile.ruptureSheerSource, profile.agentId, 'Rupture Sheer Force'],
      [profile.triggerAftershockDazeSource, 'trigger', 'Trigger Aftershock Daze'],
    ] as const) {
      if (source && (
        profile.agentId !== expectedAgent
        || source.holderAgentId !== profile.agentId
        || source.appliedPartySlot !== profile.appliedPartySlot
      )) {
        throw new Error(`${label} requires its current holder source`)
      }
    }
    if (
      profile.ruptureSheerSource
      && ADMITTED_AGENTS.find(({ id }) => id === profile.agentId)?.specialty !== 'Rupture'
    ) {
      throw new Error('Rupture Sheer Force requires a Rupture profile')
    }
    if (
      profile.ruptureSheerSource
      && !profile.metrics.some(({ id }) => id === 'sheerForce')
    ) {
      throw new Error('Rupture Sheer Force requires a visible Sheer Force metric')
    }
    if (profile.triggerAftershockDazeSource) {
      const hasGauge = profile.metrics.some((metric) => (
        metric.id === 'critRate' && metric.gaugeId === 'triggerAftershockDaze'
      ))
      const hasAction = profile.actions?.some((projection) => (
        projection.metricId === 'dazeBonus'
        && projection.scopes.some(({ target }) => (
          sameActionTarget(target, BASIC_AFTERSHOCK_TARGET)
        ))
      ))
      if (!hasGauge || !hasAction) {
        throw new Error('Trigger Aftershock Daze requires its CRIT gauge and action consumer')
      }
    }
    if (profile.lighterImpactElation) {
      if (profile.agentId !== 'lighter') {
        throw new Error('Lighter Impact and Elation requires Lighter\'s profile')
      }
      for (const source of [
        profile.lighterImpactElation.coreImpactSource,
        profile.lighterImpactElation.additionalSource,
      ]) {
        if (
          source.holderAgentId !== profile.agentId
          || source.appliedPartySlot !== profile.appliedPartySlot
        ) {
          throw new Error('Lighter Impact and Elation requires the current holder sources')
        }
      }
      const impact = profile.metrics.find(({ id }) => id === 'impact')
      if (!impact || (profile.lighterImpactElation.active && impact.gaugeId !== 'lighterElation')) {
        throw new Error('Lighter Impact and Elation requires its Impact consumer')
      }
    }
    return profile
  })
}

function relationshipSource(relationship: ProfileRelationship): SelectedSourceInstance {
  switch (relationship.kind) {
    case 'stat':
    case 'modifier':
    case 'automatic-energy':
    case 'operation':
      return relationship.atom.source
    case 'linear':
    case 'gauge':
    case 'threshold-operation':
    case 'projection-gauge':
    case 'post-delivery-stat-modifier-gauge':
    case 'provider':
      return relationship.source
  }
}

function resolvedStat(
  statId: StatId,
  atoms: readonly ProfileStatAtom[],
): ResolvedStat {
  const resolutions = resolveHighestNonstack(atoms.map((atom) => ({
    value: atom.value,
    nonstackId: atom.nonstackId,
    atom,
  })))
  return {
    composed: composeStat(
      statId,
      resolutions.filter(({ contributes }) => contributes).map(({ item }) => item.atom),
    ),
    equalOrigins: resolutions.filter(({ equalOrigin }) => equalOrigin)
      .map(({ item }) => item.atom),
  }
}

function composeStats(
  atoms: readonly ProfileStatAtom[],
): Partial<Record<StatId, ResolvedStat>> {
  const statIds = [...new Set(atoms.map(({ statId }) => statId))]
  return Object.fromEntries(statIds.map((statId) => [
    statId,
    resolvedStat(statId, atoms.filter((atom) => atom.statId === statId)),
  ]))
}

function composedOnly(
  stats: Partial<Record<StatId, ResolvedStat>>,
): Partial<Record<StatId, ComposedStat>> {
  return Object.fromEntries(Object.entries(stats).map(([statId, value]) => [
    statId,
    value.composed,
  ]))
}

function staticStatAtoms(relationships: readonly ProfileRelationship[]): ProfileStatAtom[] {
  return relationships.flatMap((relationship) => (
    relationship.kind === 'stat' ? [relationship.atom] : []
  ))
}

function recipientContexts(
  state: WorkbenchState,
  profiles: readonly AgentSourceProfile[],
): DeliveryRecipientContext[] {
  return state.slots.map(({ agentId }, appliedPartySlot) => {
    const formulas = SETUP_FORMULA_PARTICIPATION_BY_AGENT[agentId]
    return {
      agentId,
      appliedPartySlot: appliedPartySlot as 0 | 1 | 2,
      specialty: ADMITTED_AGENTS.find(({ id }) => id === agentId)!.specialty,
      attribute: effectAttributeForAgent(agentId),
      formulas: [...formulas.primary, ...formulas.residual],
      statIds: profiles[appliedPartySlot].metrics.flatMap(({ statId }) => (
        statId ? [statId] : []
      )),
    }
  })
}

function statContributionResult(contribution: StatContribution): Contribution {
  const { atom, rawValue, derivedValue } = contribution
  return {
    ...resultSourceFor(atom.source, atom.sourceDetail),
    amount: derivedValue,
    ...(atom.region === 'percentage'
      ? { display: { value: rawValue, unit: '%', decimals: Number.isInteger(rawValue) ? 0 : 1 } }
      : {}),
  }
}

function statBreakdown(stat: ResolvedStat): ResultMetric['breakdown'] {
  const breakdown = surfaces(
    stat.composed.disclosedContributions.initial
      .filter(({ derivedValue }) => Math.abs(derivedValue) > 0.000_001)
      .map(statContributionResult),
    stat.composed.disclosedContributions.combat
      .filter(({ derivedValue }) => Math.abs(derivedValue) > 0.000_001)
      .map(statContributionResult),
    stat.composed.disclosedContributions.fully
      .filter(({ derivedValue }) => Math.abs(derivedValue) > 0.000_001)
      .map(statContributionResult),
  )
  for (const atom of stat.equalOrigins) {
    if (atom.source.definition.visibility !== 'visible') continue
    breakdown[atom.earliestSurface].push({
      ...resultSourceFor(
        atom.source,
        [atom.sourceDetail, 'equal non-stacking origin'].filter(Boolean).join(' · '),
      ),
      amount: 0,
      notation: 'equal-nonstack-origin',
      referenceValue: atom.value,
      ...(atom.display ? { display: atom.display } : {}),
    })
  }
  return breakdown
}

function modifierEffect(atom: ModifierAtom) {
  return {
    metric: atom.metricId,
    earliestSurface: atom.earliestSurface,
    amount: atom.value,
    source: resultSourceFor(atom.source, atom.sourceDetail),
    ...(atom.action ? { action: atom.action } : {}),
    ...(atom.nonstackId ? { nonstackKey: atom.nonstackId } : {}),
    ...(atom.display ? { display: atom.display } : {}),
    disclose: atom.source.definition.visibility === 'visible',
  }
}

function gaugeResult(gauge: EvaluatedGauge): GaugeResult {
  const [first, ...rest] = gauge.outputs
  if (!first) throw new Error(`Gauge ${gauge.gaugeId} requires an admitted output`)
  return {
    source: resultSourceFor(gauge.source, gauge.sourceDetail),
    basisLabel: gauge.basisLabel,
    current: gauge.current,
    ...(gauge.threshold === undefined ? {} : { threshold: gauge.threshold }),
    cap: gauge.cap,
    outputLabel: first.label,
    outputValue: first.value,
    ...(first.cap === undefined ? {} : { outputCap: first.cap }),
    outputUnit: first.unit,
    ...(rest.length === 0 ? {} : {
      additionalOutputs: rest.map((output) => ({
        label: output.label,
        value: output.value,
        ...(output.cap === undefined ? {} : { cap: output.cap }),
        unit: output.unit,
      })),
    }),
    ...(gauge.presentation ? { presentation: gauge.presentation } : {}),
    ...(gauge.decimals ? { decimals: gauge.decimals } : {}),
  }
}

function projectMetrics(
  profile: AgentSourceProfile,
  stats: Partial<Record<StatId, ResolvedStat>>,
  modifiers: readonly ModifierAtom[],
  gauges: readonly EvaluatedGauge[],
  automaticEnergy: readonly AutomaticEnergyAtom[],
  derivedBases: DerivedMetricBases,
  projectionGauges: EvaluatedRelationships['projectionGauges'],
): ResultMetric[] {
  const effects = modifiers.map(modifierEffect)
  return profile.metrics.map((projection) => {
    const stat = projection.statId ? stats[projection.statId] : undefined
    if (projection.statId && !stat) {
      throw new Error(`Missing admitted ${projection.statId} stat for ${profile.agentId}`)
    }
    const energy = projection.statId === 'energyRegen' && stat
      ? composeAutomaticEnergyRecovery(stat.composed, automaticEnergy)
      : undefined
    const derivedBase = derivedBases[projection.id]
    const baseValues = energy?.values
      ?? derivedBase?.values
      ?? stat?.composed.values
      ?? projection.baseValues
      ?? surfaces(0, 0, 0)
    const sourceBreakdown = derivedBase?.breakdown
      ?? (stat ? statBreakdown(stat) : surfaces([], [], []))
    const baseBreakdown = surfaces(
      [...sourceBreakdown.initial],
      [...sourceBreakdown.combat],
      [...sourceBreakdown.fully],
    )
    if (energy) {
      for (const surface of ['initial', 'combat', 'fully'] as const) {
        baseBreakdown[surface].push(...energy.disclosedOperations[surface].map((operation) => ({
          ...resultSourceFor(operation.source, operation.sourceDetail),
          amount: operation.value,
        })))
      }
    }
    const composed = composeMetricEffects(
      baseValues,
      baseBreakdown,
      effects,
      projection.id,
      projection.cap && {
        value: projection.cap.value,
        source: resultSourceFor(projection.cap.source),
      },
    )
    const projectionGauge = projection.gaugeId
      ? projectionGauges.find(({ gaugeId }) => gaugeId === projection.gaugeId)
      : undefined
    const evaluatedGauge = projection.gaugeId
      ? gauges.find(({ gaugeId }) => gaugeId === projection.gaugeId)
      : undefined
    for (const candidate of [projectionGauge, evaluatedGauge]) {
      if (candidate && candidate.metricId !== projection.id) {
        throw new Error(`Gauge ${candidate.gaugeId} does not project ${projection.id}`)
      }
    }
    const gauge = projectionGauge
      ? evaluateProjectionGauge(projectionGauge, composed.values.fully)
      : evaluatedGauge
    return {
      id: projection.id,
      label: projection.label,
      unit: projection.unit,
      decimals: projection.decimals,
      ...composed,
      ...(gauge ? { gauge: gaugeResult(gauge) } : {}),
    }
  })
}

function projectOperations(operations: readonly OperationAtom[]): AgentResult['operations'] {
  return operations.map((operation) => ({
    id: operation.operationId,
    label: operation.label,
    source: resultSourceFor(operation.source, operation.sourceDetail),
    surface: operation.earliestSurface,
    value: operation.value,
    unit: operation.unit,
    ...(operation.presentation ? { presentation: operation.presentation } : {}),
  }))
}

const SHARED_CANONICAL_DAMAGE_ACTIONS = ['Chain Attack', 'Ultimate'] as const

function exactCanonicalAction(
  target: ActionTarget | undefined,
  canonical: CanonicalActionKind,
): boolean {
  return Boolean(
    target
      && target.tags.length === 0
      && target.outcomes.length === 1
      && target.outcomes[0].kind === 'canonical'
      && target.outcomes[0].action === canonical,
  )
}

function targetIncludesCanonical(
  target: ActionTarget | undefined,
  canonical: CanonicalActionKind,
): boolean {
  return Boolean(target?.outcomes.some((outcome) => (
    outcome.kind === 'canonical' && outcome.action === canonical
  )))
}

function withSharedCanonicalDamageActions(
  commonValues: ResultMetric['values'],
  modifiers: readonly ModifierAtom[],
  rows: AgentResult['actionModifiers'],
): AgentResult['actionModifiers'] {
  const next = [...rows]
  const effects = modifiers.map(modifierEffect)
  for (const canonical of SHARED_CANONICAL_DAMAGE_ACTIONS) {
    if (!modifiers.some(({ metricId, action }) => (
      metricId === 'dmgBonus' && exactCanonicalAction(action, canonical)
    ))) continue
    if (next.some(({ metricId, target }) => (
      metricId === 'dmgBonus' && exactCanonicalAction(target, canonical)
    ))) continue

    const parent = next
      .filter(({ metricId, target }) => (
        metricId === 'dmgBonus' && targetIncludesCanonical(target, canonical)
      ))
      .sort((left, right) => (
        (left.target?.outcomes.length ?? Number.POSITIVE_INFINITY)
        - (right.target?.outcomes.length ?? Number.POSITIVE_INFINITY)
      ))[0]
    const target = actionTarget([canonicalAction(canonical)])
    const [row] = composeActionHierarchy(
      parent?.values ?? commonValues,
      effects,
      'dmgBonus',
      [{ id: `shared${canonical.replaceAll(' ', '')}Dmg`, target }],
    )
    if (row) next.push({ ...row, ...(parent ? { baseActionId: parent.id } : {}) })
  }
  return next
}

function projectAgent(
  evaluated: EvaluatedProfile,
  stats: Partial<Record<StatId, ResolvedStat>>,
  delivered: DeliveredProfileEffects,
  derivedBases: DerivedMetricBases = {},
  derivedModifiers: readonly ModifierAtom[] = [],
  derivedGauges: readonly EvaluatedGauge[] = [],
): AgentResult {
  const postDelivery = evaluated.evaluated.postDeliveryStatModifierGauges.map(
    (relationship) => evaluatePostDeliveryStatModifierGauge(
      relationship,
      composedOnly(stats),
    ),
  )
  const modifiers = [
    ...evaluated.evaluated.modifierAtoms,
    ...delivered.modifierAtoms.map(({ atom }) => atom),
    ...derivedModifiers,
    ...postDelivery.map(({ modifier }) => modifier),
  ]
  const thresholdResults = evaluated.evaluated.thresholdOperations.map((relationship) => (
    evaluateThresholdOperation(relationship, composedOnly(stats))
  ))
  const projectedMetrics = projectMetrics(
    evaluated.profile,
    stats,
    modifiers,
    [
      ...evaluated.evaluated.gauges,
      ...derivedGauges,
      ...postDelivery.map(({ gauge }) => gauge),
      ...thresholdResults.map(({ gauge }) => gauge),
    ],
    evaluated.evaluated.automaticEnergy,
    derivedBases,
    evaluated.evaluated.projectionGauges,
  )
  const effects = modifiers.map(modifierEffect)
  const authoredActionModifiers = (evaluated.profile.actions ?? []).flatMap((projection) => {
    const base = projectedMetrics.find(({ id }) => id === projection.metricId)
    if (!base) throw new Error(`Action projection requires admitted ${projection.metricId}`)
    return composeActionHierarchy(
      base.values,
      effects,
      projection.metricId,
      projection.scopes,
      '',
      projection.cap && {
        value: projection.cap.value,
        source: resultSourceFor(projection.cap.source),
      },
    )
  })
  const dmgBonus = projectedMetrics.find(({ id }) => id === 'dmgBonus')
  const actionModifiers = dmgBonus
    ? withSharedCanonicalDamageActions(dmgBonus.values, modifiers, authoredActionModifiers)
    : authoredActionModifiers
  const metrics = projectedMetrics.filter((metric, index) => {
    const projection = evaluated.profile.metrics[index]
    if (projection.resultVisibility === 'action-only') return false
    const admission = projection.admission
    if (!admission) return true
    if (admission === 'action') {
      return actionModifiers.some(({ metricId }) => metricId === metric.id)
    }
    if (admission === 'disclosed-or-action') {
      return metric.breakdown.initial.length > 0
        || metric.breakdown.combat.length > 0
        || metric.breakdown.fully.length > 0
        || metric.gauge !== undefined
        || actionModifiers.some(({ metricId }) => metricId === metric.id)
    }
    return metric.values.fully !== 0
      || metric.breakdown.initial.length > 0
      || metric.breakdown.combat.length > 0
      || metric.breakdown.fully.length > 0
      || actionModifiers.some(({ metricId }) => metricId === metric.id)
  })
  const visibleMetricIds = new Set(metrics.map(({ id }) => id))
  const projectedActionModifiers = actionModifiers.map((action) => {
    if (visibleMetricIds.has(action.metricId)) return action
    const metric = projectedMetrics.find(({ id }) => id === action.metricId)
    if (!metric) throw new Error(`Scoped Result requires projected ${action.metricId}`)
    return {
      ...action,
      standaloneMetric: {
        label: metric.label,
        unit: metric.unit,
        decimals: metric.decimals,
        values: metric.values,
      },
    }
  })
  return {
    agentId: evaluated.profile.agentId,
    metrics,
    actionModifiers: projectedActionModifiers,
    operations: projectOperations([
      ...evaluated.evaluated.operations,
      ...delivered.operations.map(({ atom }) => atom),
      ...thresholdResults.flatMap(({ operation }) => operation ? [operation] : []),
    ]),
  }
}

/** Production evaluator for every admitted source profile. */
export function evaluateProfileParty(
  state: WorkbenchState,
  suppliedProfiles: readonly AgentSourceProfile[],
): PartyResult | null {
  if (!isCompleteWorkbench(state)) return null
  const profiles = assertProfilesMatchState(state, suppliedProfiles)

  const evaluatedProfiles: EvaluatedProfile[] = profiles.map((profile) => {
    const preliminaryStats = composeStats(staticStatAtoms(profile.relationships))
    const evaluated = evaluateRelationships(
      profile.relationships,
      composedOnly(preliminaryStats),
    )
    return {
      profile,
      evaluated,
    }
  })

  const recipients = recipientContexts(state, profiles)
  const localStats = evaluatedProfiles.map(({ evaluated }) => composeStats(
    evaluated.statAtoms,
  ))
  const lighterDerivations = evaluatedProfiles.map(({ profile }, slot) => (
    profile.lighterImpactElation
      ? deriveLighterImpactElation({
          ...profile.lighterImpactElation,
          impact: localStats[slot].impact?.composed
            ?? (() => { throw new Error('Lighter Impact and Elation requires completed Impact') })(),
        })
      : undefined
  ))
  const ordinary = deliverProviderRelationships(
    stableProviderOrder([
      ...evaluatedProfiles.flatMap(({ evaluated }) => evaluated.providers),
      ...lighterDerivations.flatMap((derived) => derived?.provider ? [derived.provider] : []),
    ]),
    recipients,
    state.focusSlot,
  )
  const afterOrdinaryStats = evaluatedProfiles.map(({ evaluated }, slot) => composeStats([
    ...evaluated.statAtoms,
    ...ordinary[slot].statAtoms.map(({ atom }) => atom),
  ]))

  const janeDerivations = evaluatedProfiles.map(({ profile }, slot) => (
    profile.janePassionAssault
      ? deriveJanePassionAssault(
          profile.janePassionAssault.coreSource,
          profile.janePassionAssault.mindscape1Source,
          afterOrdinaryStats[slot].anomalyProficiency?.composed,
        )
      : undefined
  ))
  const derivedProviders = [
    ...deriveAnbySoldier0Aftershock(evaluatedProfiles.map(
      ({ profile }, slot) => ({
        agentId: profile.agentId,
        appliedPartySlot: profile.appliedPartySlot,
        source: profile.anbyAftershockSource,
        critDmg: afterOrdinaryStats[slot].critDmg?.composed,
      }),
    )),
    ...janeDerivations.flatMap((derivation) => derivation?.providers ?? []),
  ]
  const derived = deliverProviderRelationships(
    stableProviderOrder(derivedProviders),
    recipients,
    state.focusSlot,
  )

  return {
    agents: evaluatedProfiles.map((evaluated, slot) => {
      const delivered: DeliveredProfileEffects = {
        statAtoms: [...ordinary[slot].statAtoms, ...derived[slot].statAtoms],
        modifierAtoms: [...ordinary[slot].modifierAtoms, ...derived[slot].modifierAtoms],
        operations: [...ordinary[slot].operations, ...derived[slot].operations],
      }
      const stats = composeStats([
        ...evaluated.evaluated.statAtoms,
        ...delivered.statAtoms.map(({ atom }) => atom),
        ...(janeDerivations[slot] ? [janeDerivations[slot].localStat] : []),
      ])
      const rupture = evaluated.profile.ruptureSheerSource
        ? deriveRuptureSheerForce(
          evaluated.profile.ruptureSheerSource,
          stats.atk?.composed,
          stats.maxHp?.composed,
        )
        : undefined
      const trigger = evaluated.profile.triggerAftershockDazeSource
        ? deriveTriggerAftershockDaze(
          evaluated.profile.triggerAftershockDazeSource,
          stats.critRate?.composed,
        )
        : undefined
      return projectAgent(
        evaluated,
        stats,
        delivered,
        {
          ...(rupture ? { sheerForce: rupture } : {}),
          ...(lighterDerivations[slot] ? { impact: lighterDerivations[slot].impact } : {}),
        },
        [
          ...(trigger ? [trigger.modifier] : []),
          ...(janeDerivations[slot]?.modifiers ?? []),
        ],
        [
          ...(trigger ? [trigger.gauge] : []),
          ...(lighterDerivations[slot]?.gauge ? [lighterDerivations[slot].gauge] : []),
          ...(janeDerivations[slot] ? [janeDerivations[slot].gauge] : []),
        ],
      )
    }),
  }
}

export function actionProjection(
  metricId: EffectMetric,
  id: string,
  target: ActionTarget,
): ActionProjection {
  return { metricId, scopes: [{ id, target }] }
}
