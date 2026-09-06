import type { ActionTarget } from '../actions'
import type { AgentId, AgentSpecialty, FormulaFamily } from '../content/types'
import type {
  EffectAttribute,
  EffectMetric,
  SurfaceKey,
} from '../effects'
import type { SelectedSourceInstance } from './source-instance'
import type {
  AutomaticEnergyRecoveryOperation,
  ComposedStat,
  StatAtom,
  StatId,
  StatRegion,
} from './stat-composer'

export function linearDerivedOutput({
  basisValue,
  basisThreshold = 0,
  basisIncrement,
  baseOutput = 0,
  outputIncrement,
  outputCap = Number.POSITIVE_INFINITY,
}: {
  basisValue: number
  basisThreshold?: number
  basisIncrement: number
  baseOutput?: number
  outputIncrement: number
  outputCap?: number
}): number {
  const eligibleBasis = Math.max(basisValue - basisThreshold, 0)
  return Math.min(
    baseOutput + eligibleBasis / basisIncrement * outputIncrement,
    outputCap,
  )
}

export interface HighestOnlyComposition {
  kind: 'highest-only'
  semanticEffect: object
}

export interface RelationshipDisplay {
  value: number
  unit: '%' | '/s'
  decimals: number
}

export type ProfileStatAtom = StatAtom & {
  composition?: HighestOnlyComposition
  display?: RelationshipDisplay
  sourceDetail?: string
}

export interface ModifierAtom {
  metricId: EffectMetric
  earliestSurface: SurfaceKey
  value: number
  source: SelectedSourceInstance
  action?: ActionTarget
  composition?: HighestOnlyComposition
  display?: RelationshipDisplay
  sourceDetail?: string
}

export interface OperationAtom {
  label: string
  value: number
  unit: string
  source: SelectedSourceInstance
  presentation?: 'scale'
  sourceDetail?: string
}

export type AutomaticEnergyAtom = AutomaticEnergyRecoveryOperation

export type ProviderRecipient =
  | 'self'
  | 'focus'
  | 'all-party'
  | 'other-party'
  | 'enemy-context'

export interface DeliveryRule {
  recipient: ProviderRecipient
  eligibleAgentIds?: readonly AgentId[]
  specialties?: readonly AgentSpecialty[]
  attributes?: readonly EffectAttribute[]
  formulas?: readonly FormulaFamily[]
}

export type ProviderEffect =
  | {
    kind: 'stat'
    statId: StatId
    region: Exclude<StatRegion, 'base'>
    earliestSurface: SurfaceKey
    value: number
    composition?: HighestOnlyComposition
    display?: RelationshipDisplay
    sourceDetail?: string
  }
  | {
    kind: 'modifier'
    metricId: EffectMetric
    earliestSurface: SurfaceKey
    value: number
    action?: ActionTarget
    composition?: HighestOnlyComposition
    display?: RelationshipDisplay
    sourceDetail?: string
  }
  | {
    kind: 'operation'
    label: string
    value: number
    unit: string
    presentation?: 'scale'
    sourceDetail?: string
  }

export type ProviderEffectTemplate =
  ProviderEffect extends infer Effect
    ? Effect extends ProviderEffect ? Omit<Effect, 'value'> : never
    : never

export interface ProviderRelationship {
  kind: 'provider'
  source: SelectedSourceInstance
  delivery: DeliveryRule
  effect: ProviderEffect
}

export interface LinearTransform {
  basisThreshold?: number
  basisIncrement: number
  baseOutput?: number
  outputIncrement: number
  outputCap?: number
}

export interface LinearBasis {
  statId: StatId
  surface: SurfaceKey | 'each'
}

export type LinearEmission =
  | {
    kind: 'stat'
    statId: StatId
    region: Exclude<StatRegion, 'base'>
    earliestSurface: SurfaceKey
    composition?: HighestOnlyComposition
    display?: RelationshipDisplay
    sourceDetail?: string
  }
  | {
    kind: 'modifier'
    metricId: EffectMetric
    earliestSurface: SurfaceKey
    action?: ActionTarget
    composition?: HighestOnlyComposition
    display?: RelationshipDisplay
    sourceDetail?: string
  }
  | {
    kind: 'operation'
    label: string
    unit: string
    presentation?: 'scale'
    sourceDetail?: string
  }
  | {
    kind: 'provider'
    delivery: DeliveryRule
    effect: ProviderEffectTemplate
  }

export interface LinearOutput {
  transform: LinearTransform
  emission: LinearEmission
}

export interface LinearRelationship {
  kind: 'linear'
  source: SelectedSourceInstance
  basis: LinearBasis
  outputs: readonly LinearOutput[]
}

export type PostDeliveryLinearRelationship = Omit<LinearRelationship, 'kind'> & {
  kind: 'post-delivery-linear'
}

interface GaugeOutputPresentation {
  label: string
  unit: string
  cap?: number
  decimals?: number
}

export type LinearGaugeOutput = GaugeOutputPresentation & LinearOutput

export type ThresholdActivationGaugeOutput = GaugeOutputPresentation & {
  activation: {
    inactiveValue: number
    activeValue: number
  }
  emission: Extract<LinearEmission, { kind: 'provider' }>
}

interface GaugeRelationshipBase {
  kind: 'gauge'
  source: SelectedSourceInstance
  basis: LinearBasis
  basisLabel: string
  metricId: EffectMetric
  presentation?: 'scale'
  sourceDetail?: string
  decimals?: {
    current?: number
    threshold?: number
    cap?: number
    output?: number
    outputCap?: number
  }
}

export type LinearGaugeRelationship = GaugeRelationshipBase & {
  outputs: readonly LinearGaugeOutput[]
} & (
  | { basisCap: number; basisThreshold?: number }
  | { basisCap?: never; basisThreshold: number }
)

export type ThresholdActivationGaugeRelationship =
  Omit<GaugeRelationshipBase, 'basis'> & {
    basis: { statId: StatId; surface: SurfaceKey }
    basisThreshold: number
    basisCap: number
    outputs: readonly [
      ThresholdActivationGaugeOutput,
      ...ThresholdActivationGaugeOutput[],
    ]
  }

export type GaugeRelationship =
  | LinearGaugeRelationship
  | ThresholdActivationGaugeRelationship

export type PostDeliveryGaugeRelationship = Omit<LinearGaugeRelationship, 'kind'> & {
  kind: 'post-delivery-gauge'
}

/**
 * A visible activation condition over the completed post-delivery stat.
 * The gauge remains visible below threshold; the operation exists once either
 * the Combat or Fully Enabled input reaches the threshold.
 */
export interface ThresholdOperationRelationship {
  kind: 'threshold-operation'
  source: SelectedSourceInstance
  basis: { statId: StatId }
  basisLabels: Record<Exclude<SurfaceKey, 'initial'>, string>
  threshold: number
  metricId: EffectMetric
  outputLabel: string
  inactiveValue: number
  activeValue: number
  unit: string
  presentation?: 'scale'
  sourceDetail?: string
  decimals?: EvaluatedGauge['decimals']
}

/** A Result-only gauge over the completed metric; it emits no calculation atom. */
export interface ProjectionGaugeRelationship {
  kind: 'projection-gauge'
  source: SelectedSourceInstance
  metricId: EffectMetric
  basisLabel: string
  basisCap: number
  output: {
    label: string
    transform: LinearTransform
    cap?: number
    unit: string
    decimals?: number
  }
  presentation?: 'scale'
  sourceDetail?: string
  decimals?: EvaluatedGauge['decimals']
}

/**
 * A one-pass post-delivery projection from a completed stat to one action-local
 * modifier and its visible gauge. It cannot emit stats, providers, operations,
 * or another derived relationship.
 */
export interface PostDeliveryStatModifierGaugeRelationship {
  kind: 'post-delivery-stat-modifier-gauge'
  source: SelectedSourceInstance
  basis: { statId: StatId; surface: Exclude<SurfaceKey, 'initial'> }
  basisLabel: string
  basisValueCap?: number
  basisCap: number
  gaugeMetricId: EffectMetric
  modifierMetricId: EffectMetric
  action: ActionTarget
  modifierSurface: Exclude<SurfaceKey, 'initial'>
  output: {
    label: string
    value:
      | { kind: 'linear'; transform: LinearTransform }
      | {
        kind: 'activation'
        threshold: number
        inactiveValue: number
        activeValue: number
      }
    cap?: number
    unit: string
    decimals?: number
  }
  presentation?: 'scale'
  sourceDetail?: string
  decimals?: EvaluatedGauge['decimals']
}

/**
 * A bounded one-way conversion from a completed delivered metric into one
 * holder stat and a visible gauge. It cannot emit a provider, modifier,
 * operation, or another derived relationship.
 */
export interface PostDeliveryMetricStatGaugeRelationship {
  kind: 'post-delivery-metric-stat-gauge'
  source: SelectedSourceInstance
  basis: {
    metricId: EffectMetric
    surface: Exclude<SurfaceKey, 'initial'>
  }
  basisLabel: string
  basisCap?: number
  output: {
    label: string
    statId: StatId
    region: Exclude<StatRegion, 'base'>
    transform: LinearTransform
    cap?: number
    unit: string
    decimals?: number
  }
  presentation?: 'scale'
  sourceDetail?: string
  decimals?: EvaluatedGauge['decimals']
}

/**
 * A Result metric derived independently on each visible surface from completed
 * recipient stats. It emits no stat or provider and cannot feed another pass.
 */
export interface SurfaceStatDerivedMetricRelationship {
  kind: 'surface-stat-derived-metric'
  source: SelectedSourceInstance
  metricId: EffectMetric
  terms: readonly {
    statId: StatId
    multiplier: number
  }[]
  sourceDetail?: string
}

export type ProfileRelationship =
  | { kind: 'stat'; atom: ProfileStatAtom }
  | { kind: 'modifier'; atom: ModifierAtom }
  | { kind: 'automatic-energy'; atom: AutomaticEnergyAtom }
  | LinearRelationship
  | GaugeRelationship
  | PostDeliveryLinearRelationship
  | PostDeliveryGaugeRelationship
  | ThresholdOperationRelationship
  | ProjectionGaugeRelationship
  | PostDeliveryStatModifierGaugeRelationship
  | PostDeliveryMetricStatGaugeRelationship
  | SurfaceStatDerivedMetricRelationship
  | { kind: 'operation'; atom: OperationAtom }
  | ProviderRelationship

export interface EvaluatedGauge {
  source: SelectedSourceInstance
  metricId: EffectMetric
  basisLabel: string
  current: number
  threshold?: number
  cap?: number
  outputs: Array<{
    label: string
    value: number
    cap?: number
    unit: string
    decimals?: number
  }>
  presentation?: 'scale'
  sourceDetail?: string
  decimals?: GaugeRelationshipBase['decimals']
}

export interface EvaluatedRelationships {
  statAtoms: ProfileStatAtom[]
  modifierAtoms: ModifierAtom[]
  operations: OperationAtom[]
  automaticEnergy: AutomaticEnergyAtom[]
  providers: ProviderRelationship[]
  gauges: EvaluatedGauge[]
  thresholdOperations: ThresholdOperationRelationship[]
  projectionGauges: ProjectionGaugeRelationship[]
  postDeliveryStatModifierGauges: PostDeliveryStatModifierGaugeRelationship[]
  postDeliveryMetricStatGauges: PostDeliveryMetricStatGaugeRelationship[]
  surfaceStatDerivedMetrics: SurfaceStatDerivedMetricRelationship[]
  postDeliveryLinear: PostDeliveryLinearRelationship[]
  postDeliveryGauges: PostDeliveryGaugeRelationship[]
}

const emptyEvaluation = (): EvaluatedRelationships => ({
  statAtoms: [],
  modifierAtoms: [],
  operations: [],
  automaticEnergy: [],
  providers: [],
  gauges: [],
  thresholdOperations: [],
  projectionGauges: [],
  postDeliveryStatModifierGauges: [],
  postDeliveryMetricStatGauges: [],
  surfaceStatDerivedMetrics: [],
  postDeliveryLinear: [],
  postDeliveryGauges: [],
})

const assertNever = (value: never): never => {
  throw new Error(`Unsupported relationship variant: ${JSON.stringify(value)}`)
}

function basisValue(
  basis: LinearBasis,
  stats: Readonly<Partial<Record<StatId, ComposedStat>>>,
): number {
  if (basis.surface === 'each') {
    throw new Error('Each-surface relationships require surface-wise evaluation')
  }
  const stat = stats[basis.statId]
  if (!stat) throw new Error(`Missing ${basis.statId} basis for a linear relationship`)
  return stat.values[basis.surface]
}

const surfaceOrder: readonly SurfaceKey[] = ['initial', 'combat', 'fully']

function evaluateEachSurfaceOutputs(
  relationship: LinearRelationship | LinearGaugeRelationship,
  stats: Readonly<Partial<Record<StatId, ComposedStat>>>,
  evaluated: EvaluatedRelationships,
): { current: number; values: number[] } {
  const stat = stats[relationship.basis.statId]
  if (!stat) {
    throw new Error(`Missing ${relationship.basis.statId} basis for a linear relationship`)
  }
  const valuesByOutput = relationship.outputs.map((output) => {
    const { transform, emission } = output
    if (emission.kind !== 'stat' || emission.earliestSurface !== 'initial') {
      throw new Error('Each-surface relationships require an Initial stat emission')
    }
    const values = surfaceOrder.map((surface) => linearDerivedOutput({
      basisValue: stat.values[surface],
      ...transform,
    }))
    values.forEach((value, index) => emitLinearValue(
      relationship.source,
      { ...emission, earliestSurface: surfaceOrder[index] },
      index === 0 ? value : value - values[index - 1],
      evaluated,
    ))
    return values
  })
  return {
    current: stat.values.fully,
    values: valuesByOutput.map((values) => values[values.length - 1]),
  }
}

function emitLinearValue(
  source: SelectedSourceInstance,
  emission: LinearEmission,
  value: number,
  evaluated: EvaluatedRelationships,
): void {
  switch (emission.kind) {
    case 'stat':
      evaluated.statAtoms.push({
        statId: emission.statId,
        region: emission.region,
        earliestSurface: emission.earliestSurface,
        value,
        source,
        ...(emission.composition ? { composition: emission.composition } : {}),
        ...(emission.display ? { display: emission.display } : {}),
        ...(emission.sourceDetail ? { sourceDetail: emission.sourceDetail } : {}),
      })
      return
    case 'modifier':
      evaluated.modifierAtoms.push({
        metricId: emission.metricId,
        earliestSurface: emission.earliestSurface,
        value,
        source,
        ...(emission.action ? { action: emission.action } : {}),
        ...(emission.composition ? { composition: emission.composition } : {}),
        ...(emission.display ? { display: emission.display } : {}),
        ...(emission.sourceDetail ? { sourceDetail: emission.sourceDetail } : {}),
      })
      return
    case 'operation':
      evaluated.operations.push({ ...emission, value, source })
      return
    case 'provider':
      evaluated.providers.push({
        kind: 'provider',
        source,
        delivery: emission.delivery,
        effect: providerEffectWithValue(emission.effect, value),
      })
      return
    default:
      return assertNever(emission)
  }
}

function providerEffectWithValue(
  effect: ProviderEffectTemplate,
  value: number,
): ProviderEffect {
  switch (effect.kind) {
    case 'stat':
      return { ...effect, value }
    case 'modifier':
      return { ...effect, value }
    case 'operation':
      return { ...effect, value }
  }
}

function evaluateOutputs(
  source: SelectedSourceInstance,
  basis: number,
  outputs: readonly LinearOutput[],
  evaluated: EvaluatedRelationships,
): number[] {
  return outputs.map(({ transform, emission }) => {
    const value = linearDerivedOutput({ basisValue: basis, ...transform })
    emitLinearValue(source, emission, value, evaluated)
    return value
  })
}

function evaluateThresholdActivationOutputs(
  source: SelectedSourceInstance,
  basis: number,
  threshold: number,
  outputs: readonly ThresholdActivationGaugeOutput[],
  evaluated: EvaluatedRelationships,
): number[] {
  return outputs.map((output) => {
    const value = basis >= threshold
      ? output.activation.activeValue
      : output.activation.inactiveValue
    emitLinearValue(source, output.emission, value, evaluated)
    return value
  })
}

function isThresholdActivationGauge(
  relationship: GaugeRelationship,
): relationship is ThresholdActivationGaugeRelationship {
  return relationship.outputs.length > 0
    && relationship.outputs.every((output) => 'activation' in output)
}
/**
 * Evaluates only the closed retained relationship vocabulary. Derived outputs
 * read the supplied pre-delivery stat snapshot once; they cannot enqueue a
 * second linear pass or an arbitrary callback.
 */
export function evaluateRelationships(
  relationships: readonly ProfileRelationship[],
  stats: Readonly<Partial<Record<StatId, ComposedStat>>>,
): EvaluatedRelationships {
  const evaluated = emptyEvaluation()
  for (const relationship of relationships) {
    switch (relationship.kind) {
      case 'stat':
        evaluated.statAtoms.push(relationship.atom)
        break
      case 'modifier':
        evaluated.modifierAtoms.push(relationship.atom)
        break
      case 'operation':
        evaluated.operations.push(relationship.atom)
        break
      case 'automatic-energy':
        evaluated.automaticEnergy.push(relationship.atom)
        break
      case 'provider':
        evaluated.providers.push(relationship)
        break
      case 'threshold-operation':
        evaluated.thresholdOperations.push(relationship)
        break
      case 'projection-gauge':
        evaluated.projectionGauges.push(relationship)
        break
      case 'post-delivery-stat-modifier-gauge':
        evaluated.postDeliveryStatModifierGauges.push(relationship)
        break
      case 'post-delivery-metric-stat-gauge':
        evaluated.postDeliveryMetricStatGauges.push(relationship)
        break
      case 'surface-stat-derived-metric':
        evaluated.surfaceStatDerivedMetrics.push(relationship)
        break
      case 'post-delivery-linear':
        evaluated.postDeliveryLinear.push(relationship)
        break
      case 'post-delivery-gauge':
        evaluated.postDeliveryGauges.push(relationship)
        break
      case 'linear': {
        if (relationship.basis.surface === 'each') {
          evaluateEachSurfaceOutputs(relationship, stats, evaluated)
        } else {
          const current = basisValue(relationship.basis, stats)
          evaluateOutputs(relationship.source, current, relationship.outputs, evaluated)
        }
        break
      }
      case 'gauge': {
        let current: number
        let values: number[]
        if (isThresholdActivationGauge(relationship)) {
          current = basisValue(relationship.basis, stats)
          values = evaluateThresholdActivationOutputs(
            relationship.source,
            current,
            relationship.basisThreshold,
            relationship.outputs,
            evaluated,
          )
        } else if (relationship.basis.surface === 'each') {
          const each = evaluateEachSurfaceOutputs(relationship, stats, evaluated)
          current = each.current
          values = each.values
        } else {
          current = basisValue(relationship.basis, stats)
          values = evaluateOutputs(
            relationship.source, current, relationship.outputs, evaluated,
          )
        }
        evaluated.gauges.push({
          source: relationship.source,
          metricId: relationship.metricId,
          basisLabel: relationship.basisLabel,
          current,
          ...(relationship.basisThreshold === undefined
            ? {}
            : { threshold: relationship.basisThreshold }),
          ...(relationship.basisCap === undefined ? {} : { cap: relationship.basisCap }),
          outputs: relationship.outputs.map((output, index) => ({
            label: output.label,
            value: values[index],
            ...(output.cap === undefined ? {} : { cap: output.cap }),
            unit: output.unit,
            ...(output.decimals === undefined ? {} : { decimals: output.decimals }),
          })),
          ...(relationship.presentation ? { presentation: relationship.presentation } : {}),
          ...(relationship.sourceDetail ? { sourceDetail: relationship.sourceDetail } : {}),
          ...(relationship.decimals ? { decimals: relationship.decimals } : {}),
        })
        break
      }
      default:
        assertNever(relationship)
    }
  }
  return evaluated
}

export function evaluatePostDeliveryMetricStatGauge(
  relationship: PostDeliveryMetricStatGaugeRelationship,
  current: number,
): { stat: ProfileStatAtom; gauge: EvaluatedGauge } {
  const value = linearDerivedOutput({
    basisValue: current,
    ...relationship.output.transform,
  })
  return {
    stat: {
      statId: relationship.output.statId,
      region: relationship.output.region,
      earliestSurface: relationship.basis.surface,
      value,
      source: relationship.source,
      ...(relationship.sourceDetail
        ? { sourceDetail: relationship.sourceDetail }
        : {}),
    },
    gauge: {
      source: relationship.source,
      metricId: relationship.basis.metricId,
      basisLabel: relationship.basisLabel,
      current,
      ...(relationship.basisCap === undefined
        ? {}
        : { cap: relationship.basisCap }),
      outputs: [{
        label: relationship.output.label,
        value,
        ...(relationship.output.cap === undefined
          ? {}
          : { cap: relationship.output.cap }),
        unit: relationship.output.unit,
        ...(relationship.output.decimals === undefined
          ? {}
          : { decimals: relationship.output.decimals }),
      }],
      ...(relationship.presentation
        ? { presentation: relationship.presentation }
        : {}),
      ...(relationship.sourceDetail
        ? { sourceDetail: relationship.sourceDetail }
        : {}),
      ...(relationship.decimals ? { decimals: relationship.decimals } : {}),
    },
  }
}

/**
 * Evaluates the bounded one-pass relationships that explicitly read the
 * completed ordinary-delivery stat snapshot. Their outputs are returned for
 * one derived-provider delivery pass and cannot enqueue another relationship.
 */
export function evaluatePostDeliveryRelationships(
  relationships: readonly (
    | PostDeliveryLinearRelationship
    | PostDeliveryGaugeRelationship
  )[],
  stats: Readonly<Partial<Record<StatId, ComposedStat>>>,
): EvaluatedRelationships {
  const evaluated = emptyEvaluation()
  for (const relationship of relationships) {
    if (relationship.basis.surface === 'each') {
      throw new Error('Post-delivery relationships require one explicit completed surface')
    }
    const current = basisValue(relationship.basis, stats)
    const values = evaluateOutputs(relationship.source, current, relationship.outputs, evaluated)
    if (relationship.kind === 'post-delivery-gauge') {
      evaluated.gauges.push({
        source: relationship.source,
        metricId: relationship.metricId,
        basisLabel: relationship.basisLabel,
        current,
        ...(relationship.basisThreshold === undefined ? {} : { threshold: relationship.basisThreshold }),
        ...(relationship.basisCap === undefined ? {} : { cap: relationship.basisCap }),
        outputs: relationship.outputs.map((output, index) => ({
          label: output.label,
          value: values[index],
          ...(output.cap === undefined ? {} : { cap: output.cap }),
          unit: output.unit,
          ...(output.decimals === undefined ? {} : { decimals: output.decimals }),
        })),
        ...(relationship.presentation ? { presentation: relationship.presentation } : {}),
        ...(relationship.sourceDetail ? { sourceDetail: relationship.sourceDetail } : {}),
        ...(relationship.decimals ? { decimals: relationship.decimals } : {}),
      })
    }
  }
  return evaluated
}

export function evaluateThresholdOperation(
  relationship: ThresholdOperationRelationship,
  stats: Readonly<Partial<Record<StatId, ComposedStat>>>,
): { gauge: EvaluatedGauge; operation?: OperationAtom } {
  const stat = stats[relationship.basis.statId]
  if (!stat) {
    throw new Error(`Missing ${relationship.basis.statId} basis for a threshold operation`)
  }
  const qualifyingSurface = stat.values.combat >= relationship.threshold
    ? 'combat'
    : stat.values.fully >= relationship.threshold
      ? 'fully'
      : undefined
  const basisSurface = qualifyingSurface ?? 'fully'
  const outputValue = qualifyingSurface
    ? relationship.activeValue
    : relationship.inactiveValue
  return {
    gauge: {
      source: relationship.source,
      metricId: relationship.metricId,
      basisLabel: relationship.basisLabels[basisSurface],
      current: stat.values[basisSurface],
      threshold: relationship.threshold,
      cap: relationship.threshold,
      outputs: [{
        label: relationship.outputLabel,
        value: outputValue,
        unit: relationship.unit,
      }],
      ...(relationship.presentation ? { presentation: relationship.presentation } : {}),
      ...(relationship.sourceDetail ? { sourceDetail: relationship.sourceDetail } : {}),
      ...(relationship.decimals ? { decimals: relationship.decimals } : {}),
    },
    ...(qualifyingSurface ? {
      operation: {
        label: relationship.outputLabel,
        value: relationship.activeValue,
        unit: relationship.unit,
        source: relationship.source,
        ...(relationship.presentation ? { presentation: relationship.presentation } : {}),
        ...(relationship.sourceDetail ? { sourceDetail: relationship.sourceDetail } : {}),
      },
    } : {}),
  }
}

export function evaluateProjectionGauge(
  relationship: ProjectionGaugeRelationship,
  current: number,
): EvaluatedGauge {
  return {
    source: relationship.source,
    metricId: relationship.metricId,
    basisLabel: relationship.basisLabel,
    current,
    cap: relationship.basisCap,
    outputs: [{
      label: relationship.output.label,
      value: linearDerivedOutput({
        basisValue: current,
        ...relationship.output.transform,
      }),
      ...(relationship.output.cap === undefined
        ? {}
        : { cap: relationship.output.cap }),
      unit: relationship.output.unit,
      ...(relationship.output.decimals === undefined
        ? {}
        : { decimals: relationship.output.decimals }),
    }],
    ...(relationship.presentation ? { presentation: relationship.presentation } : {}),
    ...(relationship.sourceDetail ? { sourceDetail: relationship.sourceDetail } : {}),
    ...(relationship.decimals ? { decimals: relationship.decimals } : {}),
  }
}

export function evaluatePostDeliveryStatModifierGauge(
  relationship: PostDeliveryStatModifierGaugeRelationship,
  stats: Readonly<Partial<Record<StatId, ComposedStat>>>,
): { modifier: ModifierAtom; gauge: EvaluatedGauge } {
  const stat = stats[relationship.basis.statId]
  if (!stat) {
    throw new Error(
      `Missing ${relationship.basis.statId} basis for a post-delivery modifier gauge`,
    )
  }
  const rawCurrent = stat.values[relationship.basis.surface]
  const current = relationship.basisValueCap === undefined
    ? rawCurrent
    : Math.min(rawCurrent, relationship.basisValueCap)
  const value = relationship.output.value.kind === 'linear'
    ? linearDerivedOutput({
        basisValue: current,
        ...relationship.output.value.transform,
      })
    : current >= relationship.output.value.threshold
      ? relationship.output.value.activeValue
      : relationship.output.value.inactiveValue
  const threshold = relationship.output.value.kind === 'linear'
    ? relationship.output.value.transform.basisThreshold
    : relationship.output.value.threshold
  return {
    modifier: {
      metricId: relationship.modifierMetricId,
      earliestSurface: relationship.modifierSurface,
      value,
      source: relationship.source,
      action: relationship.action,
      ...(relationship.sourceDetail ? { sourceDetail: relationship.sourceDetail } : {}),
    },
    gauge: {
      source: relationship.source,
      metricId: relationship.gaugeMetricId,
      basisLabel: relationship.basisLabel,
      current,
      ...(threshold === undefined ? {} : { threshold }),
      cap: relationship.basisCap,
      outputs: [{
        label: relationship.output.label,
        value,
        ...(relationship.output.cap === undefined
          ? {}
          : { cap: relationship.output.cap }),
        unit: relationship.output.unit,
        ...(relationship.output.decimals === undefined
          ? {}
          : { decimals: relationship.output.decimals }),
      }],
      ...(relationship.presentation ? { presentation: relationship.presentation } : {}),
      ...(relationship.sourceDetail ? { sourceDetail: relationship.sourceDetail } : {}),
      ...(relationship.decimals ? { decimals: relationship.decimals } : {}),
    },
  }
}
