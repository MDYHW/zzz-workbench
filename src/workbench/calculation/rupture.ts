import type { ResolvedCurrentEffect, ResultSource, SurfaceKey } from '../effects'
import {
  composeMetricEffects,
  surfaceValueContribution,
  surfaces,
} from './composition'
import type { ResultMetric } from './result'
import { VERTICAL_VALUES } from '../content'

export function composeRuptureSheerForce(
  atk: Record<SurfaceKey, number>,
  maxHp: Record<SurfaceKey, number>,
  source: ResultSource,
  effects: ResolvedCurrentEffect[],
): Pick<ResultMetric, 'values' | 'breakdown'> {
  const converted = surfaces(
    atk.initial * VERTICAL_VALUES.rupture.currentAtkToSheer
      + maxHp.initial * VERTICAL_VALUES.rupture.currentHpToSheer,
    atk.combat * VERTICAL_VALUES.rupture.currentAtkToSheer
      + maxHp.combat * VERTICAL_VALUES.rupture.currentHpToSheer,
    atk.fully * VERTICAL_VALUES.rupture.currentAtkToSheer
      + maxHp.fully * VERTICAL_VALUES.rupture.currentHpToSheer,
  )

  return composeMetricEffects(
    converted,
    surfaces(
      [surfaceValueContribution(source, converted.initial)],
      [surfaceValueContribution(source, converted.combat)],
      [surfaceValueContribution(source, converted.fully)],
    ),
    effects,
    'sheerForce',
  )
}
