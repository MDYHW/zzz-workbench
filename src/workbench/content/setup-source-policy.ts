import { triggerAdditionalIsActive } from '../party-conditions'
import type {
  AgentId,
  CandidateInputAdditions,
  CandidateOperationOpportunity,
} from './types'

const CANDIDATE_OPPORTUNITIES_BY_AGENT: Partial<Record<
  AgentId,
  readonly CandidateOperationOpportunity[]
>> = {
  astraYao: ['repeated-quick-assist', 'external-quick-assist'],
  panYinhu: ['repeated-quick-assist', 'external-quick-assist'],
  zhao: ['repeated-quick-assist', 'external-quick-assist'],
  seth: ['repeated-quick-assist'],
  nicole: ['external-quick-assist'],
  dialyn: ['received-ultimate'],
}

/** Exact source-owned operations used by contextual setup policy. */
export function candidateOpportunitiesForAgent(
  agentId: AgentId,
): readonly CandidateOperationOpportunity[] {
  return CANDIDATE_OPPORTUNITIES_BY_AGENT[agentId] ?? []
}

/** Source-local candidate additions that do not depend on selected equipment. */
export function sourceCandidateInputAdditionsForParty(
  agentIds: readonly AgentId[],
  slot: number,
): CandidateInputAdditions[] {
  return triggerAdditionalIsActive(agentIds, slot)
    ? [{ twoPiece: ['woodpecker'], substats: ['critRate'] }]
    : []
}
