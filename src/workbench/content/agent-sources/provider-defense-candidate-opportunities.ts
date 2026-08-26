import type { AgentId, CandidateOperationOpportunity } from '../types'

/** Provider/Defense source-owned operations used by contextual candidates. */
export function providerDefenseCandidateOpportunities(
  agentId: AgentId,
): CandidateOperationOpportunity[] {
  switch (agentId) {
    case 'astraYao':
    case 'panYinhu':
    case 'zhao':
      return [
        'repeated-quick-assist',
        'external-quick-assist',
      ]
    case 'seth':
      return ['repeated-quick-assist']
    case 'nicole':
      return ['external-quick-assist']
    default:
      return []
  }
}
