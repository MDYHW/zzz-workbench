import { ADMITTED_AGENTS, FORMULA_PARTICIPATION_BY_AGENT } from './content'
import { providerAppliesToRecipient } from './calculation/delivery'
import { broadPrePenProviderFor, BROAD_PRE_PEN_PRESSURE } from './calculation/broad-pre-pen'
import type { ProfileRelationship } from './calculation/relationships'
import { attackBroadPrePenPressureRelationships, attackBroadPrePenRelationships } from './content/agent-sources/attack-broad-pre-pen'
import { anomalyBroadPrePenRelationships } from './content/agent-sources/anomaly-broad-pre-pen'
import { providerDefenseBroadPrePenRelationships } from './content/agent-sources/provider-defense-broad-pre-pen'
import { ruptureStunBroadPrePenRelationships } from './content/agent-sources/rupture-stun-broad-pre-pen'
import { selectedWEngineBroadPrePenRelationshipsForSlot } from './content/agent-sources/w-engine-relationships'
import { directionUsesDefRegion, effectAttributeForAgent } from './formula-policy'
import type { AgentId } from './content/types'
import type { AppliedSlot, WorkbenchState } from './state'

export type CandidatePressure = typeof BROAD_PRE_PEN_PRESSURE

function activeBroadPrePenRelationships(
  state: WorkbenchState,
  slot: AppliedSlot,
) {
  const relationships: ProfileRelationship[] = [
    ...attackBroadPrePenPressureRelationships(state, slot),
    ...attackBroadPrePenRelationships(state, slot),
    ...anomalyBroadPrePenRelationships(state, slot),
    ...providerDefenseBroadPrePenRelationships(state, slot),
    ...ruptureStunBroadPrePenRelationships(state, slot),
    ...selectedWEngineBroadPrePenRelationshipsForSlot(state, slot),
  ]
  return relationships.flatMap((relationship) => {
    const provider = broadPrePenProviderFor(relationship)
    return provider ? [provider] : []
  })
}

function recipientContext(state: WorkbenchState, recipientSlot: AppliedSlot) {
  const { agentId } = state.slots[recipientSlot]
  const summary = ADMITTED_AGENTS.find(({ id }) => id === agentId)
  const participation = FORMULA_PARTICIPATION_BY_AGENT[agentId].setup
  return {
    appliedPartySlot: recipientSlot,
    agentId,
    specialty: summary!.specialty,
    attribute: effectAttributeForAgent(agentId),
    formulas: [...participation.primary, ...participation.residual],
    statIds: [],
  } as const
}

/** Resolves only the pressure class consumed by candidate preparation. */
export function activeCandidatePressures(
  state: WorkbenchState,
  recipientSlot: AppliedSlot,
): CandidatePressure[] {
  if (!directionUsesDefRegion(state.slots[recipientSlot].agentId)) return []
  const recipient = recipientContext(state, recipientSlot)
  const pressure = state.slots.some((_, sourceSlot) => (
    activeBroadPrePenRelationships(state, sourceSlot as AppliedSlot)
      .some((provider) => providerAppliesToRecipient(provider, recipient, state.focusSlot))
  ))
  return pressure ? [BROAD_PRE_PEN_PRESSURE] : []
}

export function hasDialynUltimateOpportunity(
  state: WorkbenchState,
  recipientSlot: AppliedSlot,
): boolean {
  const recipientAgentId: AgentId = state.slots[recipientSlot].agentId
  return recipientAgentId !== 'dialyn'
    && FORMULA_PARTICIPATION_BY_AGENT[recipientAgentId].setup.primary
      .includes('general_damage')
    && state.slots.some(({ agentId }) => agentId === 'dialyn')
}
