import type { ProviderRelationship } from '../../calculation/relationships'
import type { AppliedSlot, WorkbenchState } from '../../state'
import { DEF_DAMAGE_FORMULAS } from '../../formula-policy'
import { anotherAgentHasSpecialty } from '../../party-conditions'
import { SOURCE_LABELS, VERTICAL_VALUES } from '../retained-values'
import { selectedAgentSource, selectedMindscapeSource } from './sources'

export function providerDefenseBroadPrePenRelationships(
  state: WorkbenchState,
  slot: AppliedSlot,
): ProviderRelationship[] {
  const { agentId, setup } = state.slots[slot]
  const agentIds = state.slots.map(({ agentId: id }) => id)
  if (agentId === 'nicole') {
    return [{
      kind: 'provider',
      source: selectedAgentSource('nicole', slot, 'core', SOURCE_LABELS.nicoleCore, 'core'),
      delivery: { recipient: 'enemy-context', formulas: ['general_damage'] },
      effect: {
        kind: 'modifier', metricId: 'defReduction', earliestSurface: 'fully',
        value: VERTICAL_VALUES.nicole.coreDefReduction,
      },
    }]
  }
  if (
    agentId === 'sunna'
    && setup.mindscape >= 1
    && (setup.mindscape >= 6 || anotherAgentHasSpecialty(agentIds, slot, ['Attack', 'Anomaly']))
  ) {
    return [{
      kind: 'provider',
      source: selectedMindscapeSource('sunna', slot, setup.mindscape, 1),
      delivery: { recipient: 'enemy-context', formulas: DEF_DAMAGE_FORMULAS },
      effect: {
        kind: 'modifier', metricId: 'defReduction', earliestSurface: 'fully',
        value: VERTICAL_VALUES.sunna.mindscape1DefReduction,
      },
    }]
  }
  return []
}
