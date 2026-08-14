import type {
  EffectMetric,
  ResolvedCurrentEffect,
  ResolvedSetupInput,
  ResultSource,
  SurfaceKey,
} from '../effects'
import type { ActionTarget } from '../actions'
import type { ActionModifier, Contribution, ResultMetric } from './result'

export const surfaces = <T>(
  initial: T,
  combat: T,
  fully: T,
): Record<SurfaceKey, T> => ({ initial, combat, fully })

export const contribution = (
  resultSource: ResultSource,
  amount: number,
  display?: Contribution['display'],
): Contribution => ({ ...resultSource, amount, display })

export const surfaceValueContribution = (
  resultSource: ResultSource,
  amount: number,
): Contribution => ({ ...resultSource, amount, notation: 'surface-value' })

export const percentageContribution = (
  resultSource: ResultSource,
  amount: number,
  percentage: number,
): Contribution => contribution(resultSource, amount, {
  value: percentage,
  unit: '%',
  decimals: Number.isInteger(percentage) ? 0 : 1,
})

export const withoutZero = (items: Contribution[]): Contribution[] =>
  items.filter((item) => (
    item.notation === 'equal-nonstack-origin'
    || Math.abs(item.amount) > 0.000_001
  ))

const sumContributions = (items: Contribution[]): number =>
  items.reduce((total, item) => total + item.amount, 0)

type BreakdownEffect = ResolvedCurrentEffect & {
  breakdownNotation?: Contribution['notation']
}

const effectContribution = (effect: BreakdownEffect): Contribution => {
  const isEqualOrigin = effect.breakdownNotation === 'equal-nonstack-origin'
  return {
    ...contribution(effect.source, isEqualOrigin ? 0 : effect.amount, effect.display),
    notation: effect.breakdownNotation,
    referenceValue: isEqualOrigin ? effect.display?.value ?? effect.amount : undefined,
  }
}

const surfaceOrder: SurfaceKey[] = ['initial', 'combat', 'fully']

function effectsForMetric(
  effects: ResolvedCurrentEffect[],
  metric: EffectMetric,
  action?: ActionTarget,
): ResolvedCurrentEffect[] {
  return effects.filter((effect) => (
    effect.metric === metric && effect.action === action
  ))
}

function highestNonstackEffects(
  effects: ResolvedCurrentEffect[],
): BreakdownEffect[] {
  const keys = [...new Set(effects.flatMap((effect) => effect.nonstackKey ? [effect.nonstackKey] : []))]
  const highestByKey = new Map(keys.map((key) => {
    const matching = effects.filter((effect) => effect.nonstackKey === key)
    return [key, Math.max(...matching.map(({ amount }) => amount))]
  }))
  const equalOriginCounts = new Map(keys.map((key) => [
    key,
    effects.filter((effect) => (
      effect.nonstackKey === key
      && Math.abs(effect.amount - highestByKey.get(key)!) < 0.000_001
    )).length,
  ]))
  const acceptedEqualOrigins = new Set<NonNullable<ResolvedCurrentEffect['nonstackKey']>>()

  const accepted = effects.flatMap((effect) => {
    if (!effect.nonstackKey) return [effect]
    if (Math.abs(effect.amount - highestByKey.get(effect.nonstackKey)!) >= 0.000_001) {
      return []
    }
    if (equalOriginCounts.get(effect.nonstackKey) === 1) return [effect]
    const isContributingOrigin = !acceptedEqualOrigins.has(effect.nonstackKey)
    acceptedEqualOrigins.add(effect.nonstackKey)
    return [{
      ...effect,
      breakdownNotation: isContributingOrigin ? undefined : 'equal-nonstack-origin',
      source: {
        ...effect.source,
        detail: [effect.source.detail, 'equal non-stacking origin'].filter(Boolean).join(' · '),
      },
    }]
  })

  // King was already a deferred non-stacking source in the preserved first
  // vertical. New set groups retain their authored provider-local position.
  return [
    ...accepted.filter(({ nonstackKey }) => nonstackKey !== 'kingOfTheSummit'),
    ...accepted.filter(({ nonstackKey }) => nonstackKey === 'kingOfTheSummit'),
  ]
}

function valueEffectsForNonstack(
  effects: ResolvedCurrentEffect[],
): ResolvedCurrentEffect[] {
  const keys = [...new Set(effects.flatMap((effect) => effect.nonstackKey ? [effect.nonstackKey] : []))]
  const highestByKey = new Map(keys.map((key) => {
    const matching = effects.filter((effect) => effect.nonstackKey === key)
    return [key, Math.max(...matching.map(({ amount }) => amount))]
  }))
  const acceptedKeys = new Set<NonNullable<ResolvedCurrentEffect['nonstackKey']>>()
  return effects.filter((effect) => {
    if (!effect.nonstackKey) return true
    if (acceptedKeys.has(effect.nonstackKey)) return false
    if (Math.abs(effect.amount - highestByKey.get(effect.nonstackKey)!) >= 0.000_001) {
      return false
    }
    acceptedKeys.add(effect.nonstackKey)
    return true
  })
}

export function energyRegenProjection(
  baseEnergyRegen: number,
  initialPercentages: ResolvedSetupInput[],
  effects: ResolvedCurrentEffect[],
): Pick<ResultMetric, 'values' | 'breakdown'> {
  const perSecondOperations = effects.filter(
    ({ metric, action }) => metric === 'energyRegen' && !action,
  )
  const initial = baseEnergyRegen * (
    1 + initialPercentages.reduce((total, input) => total + input.rawValue, 0) / 100
  )
  const later = initial + perSecondOperations.reduce(
    (total, operation) => total + operation.amount,
    0,
  )

  return {
    values: surfaces(initial, later, later),
    breakdown: surfaces(
      withoutZero(initialPercentages.map((input) => percentageContribution(
        input.source,
        baseEnergyRegen * input.rawValue / 100,
        input.rawValue,
      ))),
      withoutZero(perSecondOperations.map(effectContribution)),
      [],
    ),
  }
}

export function composeMetricEffects(
  baseValues: Record<SurfaceKey, number>,
  baseBreakdown: Record<SurfaceKey, Contribution[]>,
  effects: ResolvedCurrentEffect[],
  metric: EffectMetric,
  cap?: { value: number; source: ResultSource },
): Pick<ResultMetric, 'values' | 'breakdown'> {
  const allMetricEffects = effectsForMetric(effects, metric)
  const metricEffects = highestNonstackEffects(allMetricEffects)
  const valueMetricEffects = valueEffectsForNonstack(allMetricEffects)
  const breakdown = surfaces(
    [...baseBreakdown.initial],
    [...baseBreakdown.combat],
    [...baseBreakdown.fully],
  )
  const values = surfaces(0, 0, 0)

  if (!cap) {
    for (const [surfaceIndex, surface] of surfaceOrder.entries()) {
      const cumulativeEffects = valueMetricEffects.filter((effect) => (
        surfaceOrder.indexOf(effect.earliestSurface) <= surfaceIndex
      ))
      values[surface] = baseValues[surface]
        + cumulativeEffects.reduce((total, effect) => total + effect.amount, 0)
      breakdown[surface].push(...metricEffects
        .filter((effect) => effect.earliestSurface === surface)
        .map(effectContribution))
      breakdown[surface] = withoutZero(breakdown[surface])
    }
    return { values, breakdown }
  }

  let priorValue = 0
  let priorBaseValue = 0
  for (const surface of surfaceOrder) {
    const currentEffects = valueMetricEffects.filter(
      (effect) => effect.earliestSurface === surface,
    )
    const additions = currentEffects.map(effectContribution)
    const baseChange = baseValues[surface] - priorBaseValue
    const rawValue = priorValue + baseChange + sumContributions(additions)
    const displayedValue = Math.min(rawValue, cap.value)
    values[surface] = displayedValue
    breakdown[surface].push(...additions)
    breakdown[surface].push(contribution(cap.source, displayedValue - rawValue))
    breakdown[surface] = withoutZero(breakdown[surface])
    priorValue = displayedValue
    priorBaseValue = baseValues[surface]
  }

  return { values, breakdown }
}

export function composeActionEffects(
  baseValues: Record<SurfaceKey, number>,
  effects: ResolvedCurrentEffect[],
  metric: EffectMetric,
  action: ActionTarget,
  cap?: { value: number; source: ResultSource },
): Pick<ActionModifier, 'values' | 'breakdown'> {
  const scopedEffects = effectsForMetric(effects, metric, action)
  return composeMetricEffects(
    baseValues,
    surfaces([], [], []),
    scopedEffects.map(({ action: _action, ...effect }) => effect),
    metric,
    cap,
  )
}

export interface ActionScopeNode {
  id: string
  target: ActionTarget
  children?: readonly ActionScopeNode[]
}

function surfaceValuesDiffer(
  left: Record<SurfaceKey, number>,
  right: Record<SurfaceKey, number>,
): boolean {
  return surfaceOrder.some((surface) => left[surface] !== right[surface])
}

export function composeActionHierarchy(
  baseValues: Record<SurfaceKey, number>,
  effects: ResolvedCurrentEffect[],
  metric: EffectMetric,
  roots: readonly ActionScopeNode[],
  idSuffix = '',
  cap?: { value: number; source: ResultSource },
): ActionModifier[] {
  const rows: ActionModifier[] = []

  const visit = (
    node: ActionScopeNode,
    parentValues: Record<SurfaceKey, number>,
    nearestVisibleParentId?: string,
  ) => {
    const composed = composeActionEffects(parentValues, effects, metric, node.target, cap)
    const id = `${node.id}${idSuffix}`
    const changed = surfaceValuesDiffer(composed.values, parentValues)
    if (changed) rows.push({
      id,
      outcomes: [...node.target.outcomes],
      tags: [...node.target.tags],
      metricId: metric,
      ...(nearestVisibleParentId ? { baseActionId: nearestVisibleParentId } : {}),
      ...composed,
    })

    const visibleParentId = changed ? id : nearestVisibleParentId
    for (const child of node.children ?? []) {
      visit(child, composed.values, visibleParentId)
    }
  }

  for (const root of roots) visit(root, baseValues)
  return rows
}
