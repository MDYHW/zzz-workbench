import { triggerAdditionalIsActive } from '../../party-conditions'
import type { AgentId, CandidateInputAdditions } from '../types'

/** Source-local candidate additions that do not depend on a selected Disc. */
export function ruptureStunCandidateInputAdditionsForParty(
  agentIds: readonly AgentId[],
  slot: number,
): CandidateInputAdditions[] {
  return triggerAdditionalIsActive(agentIds, slot)
    ? [{ twoPiece: ['woodpecker'], substats: ['critRate'] }]
    : []
}
