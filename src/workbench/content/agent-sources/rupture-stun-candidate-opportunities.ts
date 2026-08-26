import type { AgentId, CandidateOperationOpportunity } from '../types'

/** Rupture/Stun source-owned operations used by contextual candidates. */
export function ruptureStunCandidateOpportunities(
  agentId: AgentId,
): CandidateOperationOpportunity[] {
  return agentId === 'dialyn'
    ? ['received-ultimate']
    : []
}
