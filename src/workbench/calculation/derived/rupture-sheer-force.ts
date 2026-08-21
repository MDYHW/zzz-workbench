import { surfaces } from '../composition'
import type { Contribution, ResultMetric } from '../result'
import { resultSourceFor } from '../result'
import type { SelectedSourceInstance } from '../source-instance'
import type { ComposedStat } from '../stat-composer'
import { VERTICAL_VALUES } from '../../content'

export type RuptureSheerForceDerivation = Pick<ResultMetric, 'values' | 'breakdown'>

/**
 * Recipient-local Rupture conversion. Each surface reads the completed ATK and
 * Max HP values on that same surface once; direct Sheer Force additions remain
 * ordinary modifier atoms composed afterward.
 */
export function deriveRuptureSheerForce(
  source: SelectedSourceInstance,
  atk: ComposedStat | undefined,
  maxHp: ComposedStat | undefined,
): RuptureSheerForceDerivation {
  if (!atk || !maxHp) {
    throw new Error('Rupture Sheer Force requires completed ATK and Max HP stats')
  }

  const values = surfaces(
    atk.values.initial * VERTICAL_VALUES.rupture.currentAtkToSheer
      + maxHp.values.initial * VERTICAL_VALUES.rupture.currentHpToSheer,
    atk.values.combat * VERTICAL_VALUES.rupture.currentAtkToSheer
      + maxHp.values.combat * VERTICAL_VALUES.rupture.currentHpToSheer,
    atk.values.fully * VERTICAL_VALUES.rupture.currentAtkToSheer
      + maxHp.values.fully * VERTICAL_VALUES.rupture.currentHpToSheer,
  )
  const contribution = (amount: number): Contribution => ({
    ...resultSourceFor(source, 'Current ATK × 0.3 + Current Max HP × 0.1'),
    amount,
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
