import type { ProfileRelationship } from '../../calculation/relationships'
import type { SelectedSourceInstance } from '../../calculation/source-instance'
import { DRIVE_DISC_FACTS } from '../discs'
import type { AgentId } from '../types'
import {
  type CompleteSelectedSetup, type SelectedSetupObservation,
} from './equipment'
import { materializeSelectedDriveDiscEffects } from './drive-disc-effect-materializer'

type Slot = 0 | 1 | 2

export interface SelectedDriveDiscContext {
  agentId: AgentId
  appliedPartySlot: Slot
  setup: CompleteSelectedSetup & { mindscape?: number }
  observation: SelectedSetupObservation
  focusAgentId: AgentId
  partyAgentIds: readonly AgentId[]
  source: SelectedSourceInstance
}

/**
 * Materializes one selected four-piece. Ordinary clauses flow through the
 * shared effect materializer; only derived gauges remain below.
 */
export function selectedDriveDiscRelationships(
  context: SelectedDriveDiscContext,
): ProfileRelationship[] {
  const {
    agentId: agent,
    setup,
    observation,
    focusAgentId,
    partyAgentIds,
    source,
  } = context
  return [
    ...materializeSelectedDriveDiscEffects(
      DRIVE_DISC_FACTS[setup.fourPieceId].fourPiece,
      {
        agentId: agent,
        focusAgentId,
        partyAgentIds,
        source,
        observation,
      },
    ),
  ]
}
