import type {
  EffectMetric,
  ResolvedCurrentEffect,
  ResolvedSetupInput,
  ResultSource,
  SurfaceKey,
  ActionEffectId,
} from '../effects'
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
  items.filter((item) => Math.abs(item.amount) > 0.000_001)

const sumContributions = (items: Contribution[]): number =>
  items.reduce((total, item) => total + item.amount, 0)

const effectContribution = (effect: ResolvedCurrentEffect): Contribution =>
  contribution(effect.source, effect.amount, effect.display)

const surfaceOrder: SurfaceKey[] = ['initial', 'combat', 'fully']

function effectsForMetric(
  effects: ResolvedCurrentEffect[],
  metric: EffectMetric,
  action?: ActionEffectId,
): ResolvedCurrentEffect[] {
  return effects.filter((effect) => (
    effect.metric === metric && effect.action === action
  ))
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
  const metricEffects = effectsForMetric(effects, metric)
  const breakdown = surfaces(
    [...baseBreakdown.initial],
    [...baseBreakdown.combat],
    [...baseBreakdown.fully],
  )
  const values = surfaces(0, 0, 0)

  if (!cap) {
    for (const [surfaceIndex, surface] of surfaceOrder.entries()) {
      const cumulativeEffects = metricEffects.filter((effect) => (
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
    const currentEffects = metricEffects.filter(
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
  actionId: ActionEffectId,
): Pick<ActionModifier, 'values' | 'breakdown'> {
  const scopedEffects = effectsForMetric(effects, metric, actionId)
  return composeMetricEffects(
    baseValues,
    surfaces([], [], []),
    scopedEffects.map(({ action: _action, ...effect }) => effect),
    metric,
  )
}
