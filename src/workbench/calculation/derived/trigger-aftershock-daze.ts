import { BASIC_AFTERSHOCK_TARGET } from '../../actions'
import type { EvaluatedGauge, ModifierAtom } from '../relationships'
import type { SelectedSourceInstance } from '../source-instance'
import type { ComposedStat } from '../stat-composer'

export interface TriggerAftershockDazeDerivation {
  gauge: EvaluatedGauge
  modifier: ModifierAtom
}

/**
 * Qualified Trigger-only recipient projection. It reads the completed delivered
 * Fully Enabled CRIT Rate once and emits no provider relationship.
 */
export function deriveTriggerAftershockDaze(
  source: SelectedSourceInstance,
  critRate: ComposedStat | undefined,
): TriggerAftershockDazeDerivation {
  if (!critRate) throw new Error('Trigger Aftershock Daze requires completed CRIT Rate')

  const current = Math.min(critRate.values.fully, 100)
  const value = Math.min(Math.max(current - 40, 0) * 1.5, 75)
  return {
    gauge: {
      gaugeId: 'triggerAftershockDaze',
      source,
      metricId: 'critRate',
      basisLabel: 'Fully Enabled CRIT Rate',
      current,
      threshold: 40,
      cap: 90,
      outputs: [{
        label: 'Aftershock Daze bonus',
        value,
        cap: 75,
        unit: '%',
      }],
    },
    modifier: {
      metricId: 'dazeBonus',
      earliestSurface: 'fully',
      value,
      source,
      action: BASIC_AFTERSHOCK_TARGET,
    },
  }
}
