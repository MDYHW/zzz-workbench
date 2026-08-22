import { AFTERSHOCK_TARGET } from '../../actions'
import type { AgentId } from '../../content/types'
import type { SelectedSourceInstance } from '../source-instance'
import type { ComposedStat } from '../stat-composer'
import type { ProviderRelationship } from '../relationships'

export interface AnbySoldier0AftershockInput {
  agentId: AgentId
  appliedPartySlot: 0 | 1 | 2
  source?: SelectedSourceInstance
  critDmg?: ComposedStat
}

/**
 * The sole retained post-delivery provider derivation. It reads Anby's
 * completed independent-delivery snapshot once and emits one ordinary
 * provider without mutating that basis or registering another evaluation
 * phase.
 */
export function deriveAnbySoldier0Aftershock(
  inputs: readonly AnbySoldier0AftershockInput[],
): ProviderRelationship[] {
  const anby = inputs.find(({ agentId }) => agentId === 'anbySoldier0')
  if (!anby?.source || !anby.critDmg) return []
  if (anby.source.holderAgentId !== 'anbySoldier0') {
    throw new Error('Anby aftershock derivation requires an Anby: Soldier 0 source')
  }
  if (anby.source.appliedPartySlot !== anby.appliedPartySlot) {
    throw new Error('Anby aftershock source must use the current holder slot')
  }

  return [{
    kind: 'provider',
    source: anby.source,
    delivery: {
      recipient: 'all-party',
      eligibleAgentIds: ['anbySoldier0', 'trigger'],
    },
    effect: {
      kind: 'modifier',
      metricId: 'critDmg',
      earliestSurface: 'fully',
      value: anby.critDmg.values.fully * 0.35,
      action: AFTERSHOCK_TARGET,
      display: { value: 35, unit: '%', decimals: 0 },
      sourceDetail: '35% of Fully Enabled CRIT DMG',
    },
  }]
}
