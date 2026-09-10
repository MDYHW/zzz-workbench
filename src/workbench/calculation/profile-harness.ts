import {
  actionTarget,
  canonicalAction,
  type ActionTarget,
  type CanonicalActionKind,
} from '../actions'
import {
  ADMITTED_AGENTS,
  FORMULA_PARTICIPATION_BY_AGENT,
  type AgentId,
} from '../content'
import type { EffectMetric, SurfaceKey } from '../effects'
import { effectAttributeForPartySlot } from '../formula-policy'
import { isCompleteWorkbench, type WorkbenchState } from '../state'
import {
  composeActionHierarchy,
  composeMetricEffects,
  surfaces,
  type ActionScopeNode,
} from './composition'
import {
  deliverProviderRelationships,
  resolveHighestOnly,
  type DeliveredProfileEffects,
  type DeliveryRecipientContext,
} from './delivery'
import {
  evaluateProjectionGauge,
  evaluatePostDeliveryMetricStatGauge,
  evaluatePostDeliveryStatModifierGauge,
  evaluatePostDeliveryRelationships,
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
  type SurfaceStatDerivedMetricRelationship,
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
  admission?:
    | 'nonzero-or-action'
    | 'action'
    | 'disclosed-or-action'
  resultVisibility?: 'visible' | 'action-only'
  resultParentMetricId?: EffectMetric
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
    case 'post-delivery-metric-stat-gauge':
    case 'surface-stat-derived-metric':
    case 'post-delivery-linear':
    case 'post-delivery-gauge':
    case 'provider':
      return relationship.source
  }
}

function deriveSurfaceStatMetric(
  relationship: SurfaceStatDerivedMetricRelationship,
  stats: Partial<Record<StatId, ResolvedStat>>,
): Pick<ResultMetric, 'values' | 'breakdown'> {
  const amount = (surface: SurfaceKey) => relationship.terms.reduce((total, term) => {
    const stat = stats[term.statId]
    if (!stat) throw new Error(`Missing ${term.statId} basis for ${relationship.metricId}`)
    return total + stat.composed.values[surface] * term.multiplier
  }, 0)
  const values = surfaces(amount('initial'), amount('combat'), amount('fully'))
  const contribution = (value: number): Contribution => ({
    ...resultSourceFor(
      relationship.source,
      relationship.sourceDetail,
    ),
    amount: value,
    notation: 'surface-value',
  })
  return {
    values,
    breakdown: surfaces(
      [contribution(values.initial)],
      [contribution(values.combat)],
      [contribution(values.fully)],
    ),
  }
}

function resolvedStat(
  statId: StatId,
  atoms: readonly ProfileStatAtom[],
): ResolvedStat {
  const resolutions = resolveHighestOnly(atoms.map((atom) => ({
    value: atom.value,
    earliestSurface: atom.earliestSurface,
    sourceInstance: atom.source,
    ...(atom.composition ? { composition: atom.composition } : {}),
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
  const agentIds = state.slots.map(({ agentId }) => agentId)
  return state.slots.map(({ agentId }, appliedPartySlot) => {
    const formulas = FORMULA_PARTICIPATION_BY_AGENT[agentId]
    return {
      agentId,
      appliedPartySlot: appliedPartySlot as 0 | 1 | 2,
      specialty: ADMITTED_AGENTS.find(({ id }) => id === agentId)!.specialty,
      attribute: effectAttributeForPartySlot(
        agentIds,
        appliedPartySlot as 0 | 1 | 2,
      ),
      formulas: formulas.result,
      statIds: profiles[appliedPartySlot].metrics.flatMap(({ statId }) => (
        statId ? [statId] : []
      )),
    }
  })
}

function statContributionResult(contribution: StatContribution): Contribution {
  const { atom, rawValue, derivedValue } = contribution
  return {
    ...resultSourceFor(
      atom.source,
      atom.sourceDetail,
    ),
    amount: derivedValue,
    ...(atom.region === 'percentage'
      ? { display: { value: rawValue, unit: '%' as const, decimals: Number.isInteger(rawValue) ? 0 : 1 } }
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
    const origin = resultSourceFor(
      atom.source,
      atom.sourceDetail,
    )
    breakdown[atom.earliestSurface].push({
      ...origin,
      detail: [origin.detail, 'equal non-stacking origin'].filter(Boolean).join(' · '),
      detailParts: [
        ...(origin.detailParts ?? []),
        { presentationId: 'equal-non-stacking-origin', label: 'equal non-stacking origin' },
      ],
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
    source: resultSourceFor(
      atom.source,
      atom.sourceDetail,
    ),
    sourceInstance: atom.source,
    ...(atom.action ? { action: atom.action } : {}),
    ...(atom.composition ? { composition: atom.composition } : {}),
    ...(atom.display ? { display: atom.display } : {}),
    disclose: atom.source.definition.visibility === 'visible',
  }
}

function gaugeResult(gauge: EvaluatedGauge): GaugeResult {
  const [first, ...rest] = gauge.outputs
  if (!first) throw new Error('A Result gauge requires an admitted output')
  return {
    source: resultSourceFor(
      gauge.source,
      gauge.sourceDetail,
    ),
    basisLabel: gauge.basisLabel,
    basisPresentationId: gauge.basisPresentationId,
    current: gauge.current,
    ...(gauge.threshold === undefined ? {} : { threshold: gauge.threshold }),
    ...(gauge.cap === undefined ? {} : { cap: gauge.cap }),
    outputLabel: first.label,
    outputPresentationId: first.presentationId,
    outputValue: first.value,
    ...(first.cap === undefined ? {} : { outputCap: first.cap }),
    outputUnit: first.unit,
    ...(rest.length === 0 ? {} : {
      additionalOutputs: rest.map((output) => ({
        presentationId: output.presentationId,
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
          ...resultSourceFor(
            operation.source,
            operation.sourceDetail,
          ),
          amount: operation.value,
        })))
      }
    }
    const preCapComposed = composeMetricEffects(
      baseValues,
      baseBreakdown,
      effects,
      projection.id,
    )
    const composed = projection.cap
      ? composeMetricEffects(
        baseValues,
        baseBreakdown,
        effects,
        projection.id,
        {
          value: projection.cap.value,
          source: resultSourceFor(projection.cap.source),
        },
      )
      : preCapComposed
    const metricGauges = [
      ...projectionGauges
        .filter(({ metricId }) => metricId === projection.id)
        .map((gauge) => evaluateProjectionGauge(gauge, preCapComposed.values.fully)),
      ...gauges.filter(({ metricId }) => metricId === projection.id),
    ]
    return {
      id: projection.id,
      label: projection.label,
      unit: projection.unit,
      decimals: projection.decimals,
      ...composed,
      gauges: metricGauges.map(gaugeResult),
    }
  })
}

function projectOperations(operations: readonly OperationAtom[]): AgentResult['operations'] {
  return operations.map((operation) => ({
    presentationId: operation.presentationId,
    label: operation.label,
    source: resultSourceFor(
      operation.source,
      operation.sourceDetail,
    ),
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
        || metric.gauges.length > 0
        || actionModifiers.some(({ metricId }) => metricId === metric.id)
    }
    return metric.values.fully !== 0
      || metric.breakdown.initial.length > 0
      || metric.breakdown.combat.length > 0
      || metric.breakdown.fully.length > 0
      || metric.gauges.length > 0
      || actionModifiers.some(({ metricId }) => metricId === metric.id)
  })
  const visibleMetricIds = new Set(metrics.map(({ id }) => id))
  const projectedActionModifiers = actionModifiers.map((action) => {
    if (visibleMetricIds.has(action.metricId)) return action
    const metric = projectedMetrics.find(({ id }) => id === action.metricId)
    if (!metric) throw new Error(`Scoped Result requires projected ${action.metricId}`)
    const projection = evaluated.profile.metrics.find(({ id }) => id === action.metricId)
    return {
      ...action,
      standaloneMetric: {
        ...(projection?.resultParentMetricId
          ? { parentMetricId: projection.resultParentMetricId }
          : {}),
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
  const ordinary = deliverProviderRelationships(
    stableProviderOrder(evaluatedProfiles.flatMap(({ evaluated }) => evaluated.providers)),
    recipients,
    state.focusSlot,
  )
  const afterOrdinaryStats = evaluatedProfiles.map(({ evaluated }, slot) => composeStats([
    ...evaluated.statAtoms,
    ...ordinary[slot].statAtoms.map(({ atom }) => atom),
  ]))

  const postDelivery = evaluatedProfiles.map(({ evaluated }, slot) => (
    evaluatePostDeliveryRelationships(
      [...evaluated.postDeliveryLinear, ...evaluated.postDeliveryGauges],
      composedOnly(afterOrdinaryStats[slot]),
    )
  ))
  const derivedProviders = postDelivery.flatMap(({ providers }) => providers)
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
      const completedModifierAtoms = [
        ...evaluated.evaluated.modifierAtoms,
        ...delivered.modifierAtoms.map(({ atom }) => atom),
        ...postDelivery[slot].modifierAtoms,
      ]
      const metricStatGauges = evaluated.evaluated.postDeliveryMetricStatGauges.map(
        (relationship) => {
          const completedMetric = composeMetricEffects(
            surfaces(0, 0, 0),
            surfaces([], [], []),
            completedModifierAtoms.map(modifierEffect),
            relationship.basis.metricId,
          )
          return evaluatePostDeliveryMetricStatGauge(
            relationship,
            completedMetric.values[relationship.basis.surface],
          )
        },
      )
      const stats = composeStats([
        ...evaluated.evaluated.statAtoms,
        ...delivered.statAtoms.map(({ atom }) => atom),
        ...postDelivery[slot].statAtoms,
        ...metricStatGauges.map(({ stat }) => stat),
      ])
      const relationshipDerivedBases = Object.fromEntries(
        evaluated.evaluated.surfaceStatDerivedMetrics.map((relationship) => [
          relationship.metricId,
          deriveSurfaceStatMetric(relationship, stats),
        ]),
      ) as DerivedMetricBases
      return projectAgent(
        evaluated,
        stats,
        delivered,
        relationshipDerivedBases,
        postDelivery[slot].modifierAtoms,
        [
          ...postDelivery[slot].gauges,
          ...metricStatGauges.map(({ gauge }) => gauge),
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
