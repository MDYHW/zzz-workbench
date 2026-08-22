import type {
  EffectMetric,
  ResolvedCurrentEffect,
  ResultSource,
  SurfaceKey,
} from '../effects'
import { sameActionTarget, type ActionTarget } from '../actions'
import type { ActionModifier, Contribution, ResultMetric } from './result'
import { resolveHighestNonstack } from './delivery'

export const surfaces = <T>(
  initial: T,
  combat: T,
  fully: T,
): Record<SurfaceKey, T> => ({ initial, combat, fully })

const contribution = (
  resultSource: ResultSource,
  amount: number,
  display?: Contribution['display'],
): Contribution => ({ ...resultSource, amount, display })

const withoutZero = (items: Contribution[]): Contribution[] =>
  items.filter((item) => (
    item.notation === 'equal-nonstack-origin'
    || Math.abs(item.amount) > 0.000_001
  ))

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
  inheritedEffectTargets: readonly ActionTarget[] = [],
): ResolvedCurrentEffect[] {
  const applicableTargets = action
    ? [action, ...inheritedEffectTargets]
    : [undefined]
  return effects.filter((effect) => (
    effect.metric === metric
    && applicableTargets.some((target) => sameActionTarget(effect.action, target))
  ))
}

function highestNonstackEffects(
  effects: ResolvedCurrentEffect[],
): BreakdownEffect[] {
  const accepted = resolveHighestNonstack(effects.map((effect) => ({
    value: effect.amount,
    nonstackId: effect.nonstackKey,
    effect,
  }))).map(({ item, equalOrigin }) => equalOrigin
    ? {
      ...item.effect,
      breakdownNotation: 'equal-nonstack-origin' as const,
      source: {
        ...item.effect.source,
        detail: [item.effect.source.detail, 'equal non-stacking origin']
          .filter(Boolean).join(' · '),
      },
    }
    : item.effect)

  return accepted
}

function valueEffectsForNonstack(
  effects: ResolvedCurrentEffect[],
): ResolvedCurrentEffect[] {
  return resolveHighestNonstack(effects.map((effect) => ({
    value: effect.amount,
    nonstackId: effect.nonstackKey,
    effect,
  }))).filter(({ contributes }) => contributes).map(({ item }) => item.effect)
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
        .filter((effect) => (
          effect.earliestSurface === surface && effect.disclose !== false
        ))
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
    const additions = currentEffects
      .filter(({ disclose }) => disclose !== false)
      .map(effectContribution)
    const baseChange = baseValues[surface] - priorBaseValue
    const rawValue = priorValue + baseChange + currentEffects.reduce(
      (total, effect) => total + effect.amount,
      0,
    )
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
  inheritedEffectTargets: readonly ActionTarget[] = [],
  cap?: { value: number; source: ResultSource },
): Pick<ActionModifier, 'values' | 'breakdown'> {
  const scopedEffects = effectsForMetric(
    effects,
    metric,
    action,
    inheritedEffectTargets,
  )
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
  /** Broader canonical scopes whose effects apply without replacing this visible identity. */
  inheritedEffectTargets?: readonly ActionTarget[]
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
    const composed = composeActionEffects(
      parentValues,
      effects,
      metric,
      node.target,
      node.inheritedEffectTargets,
      cap,
    )
    const id = `${node.id}${idSuffix}`
    const changed = surfaceValuesDiffer(composed.values, parentValues)
    if (changed) rows.push({
      id,
      target: node.target,
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
