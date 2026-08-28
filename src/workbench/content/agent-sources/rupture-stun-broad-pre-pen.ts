import type { ProviderRelationship } from '../../calculation/relationships'
import type { AppliedSlot, WorkbenchState } from '../../state'
import { DEF_DAMAGE_FORMULAS } from '../../formula-policy'
import { VERTICAL_VALUES } from '../retained-values'
import { selectedMindscapeSource } from './sources'

export function ruptureStunBroadPrePenRelationships(
  state: WorkbenchState,
  slot: AppliedSlot,
): ProviderRelationship[] {
  const { agentId, setup } = state.slots[slot]
  if (agentId !== 'qingyi' || setup.mindscape < 1) return []
  return [{
    kind: 'provider',
    source: selectedMindscapeSource('qingyi', slot, setup.mindscape, 1),
    delivery: { recipient: 'enemy-context', formulas: DEF_DAMAGE_FORMULAS },
    effect: {
      kind: 'modifier', metricId: 'defReduction', earliestSurface: 'fully',
      value: VERTICAL_VALUES.qingyi.mindscapeDefReduction,
    },
  }]
}
