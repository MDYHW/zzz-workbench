import {
  ADMITTED_AGENTS,
  FORMULA_PARTICIPATION_BY_AGENT,
  setupPolicyFor,
  type AgentId,
} from './content'
import { providerAppliesToRecipient } from './calculation/delivery'
import { broadPrePenProviderFor, BROAD_PRE_PEN_PRESSURE } from './calculation/broad-pre-pen'
import type { ProfileRelationship } from './calculation/relationships'
import { attackBroadPrePenPressureRelationships, attackBroadPrePenRelationships } from './content/agent-sources/attack-broad-pre-pen'
import { anomalyBroadPrePenRelationships } from './content/agent-sources/anomaly-broad-pre-pen'
import { providerDefenseBroadPrePenRelationships } from './content/agent-sources/provider-defense-broad-pre-pen'
import { ruptureStunBroadPrePenRelationships } from './content/agent-sources/rupture-stun-broad-pre-pen'
import { selectedWEngineBroadPrePenRelationshipsForSlot } from './content/agent-sources/w-engine-relationships'
import { providerDefenseCandidateOpportunities } from './content/agent-sources/provider-defense-candidate-opportunities'
import { ruptureStunCandidateOpportunities } from './content/agent-sources/rupture-stun-candidate-opportunities'
import { ruptureStunCandidateInputAdditionsForParty } from './content/agent-sources/rupture-stun-candidate-inputs'
import { directionUsesDefRegion, effectAttributeForAgent } from './formula-policy'
import type { CandidateOperationOpportunity } from './content/types'
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

/** Matches source-owned party operations to holder-authored contextual cases. */
export function partySuppliesCandidateOpportunity(
  agentIds: readonly AgentId[],
  recipientIndex: number,
  opportunity: CandidateOperationOpportunity,
): boolean {
  return agentIds.some((agentId, index) => (
    index !== recipientIndex
      && [
        ...providerDefenseCandidateOpportunities(agentId),
        ...ruptureStunCandidateOpportunities(agentId),
      ].includes(opportunity)
  ))
}

/** Source-local candidate additions resolved from the current party only. */
export function sourceCandidateInputAdditionsForParty(
  agentIds: readonly AgentId[],
  slot: number,
) {
  return ruptureStunCandidateInputAdditionsForParty(agentIds, slot)
}

/** Resolves activation only; candidate and prepared outcomes stay authored. */
export function activeContextualFourPieceCases(
  agentId: AgentId,
  mindscape: number,
  partyAgentIds: readonly AgentId[],
  recipientIndex: number,
) {
  return (setupPolicyFor(agentId).discIdsByPiece.contextualFourPiece ?? [])
    .filter((candidateCase) => (
      mindscape >= (candidateCase.minimumMindscape ?? 0)
        && partySuppliesCandidateOpportunity(
          partyAgentIds,
          recipientIndex,
          candidateCase.opportunity,
        )
    ))
}

/** Source-local candidate additions, separate from selected-equipment policy. */
export function activeSourceCandidateInputAdditions(
  state: WorkbenchState,
  slot: AppliedSlot,
) {
  return sourceCandidateInputAdditionsForParty(
    state.slots.map(({ agentId }) => agentId),
    slot,
  )
}
