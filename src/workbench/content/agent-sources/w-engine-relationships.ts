import type { ProfileRelationship } from '../../calculation/relationships'
import { selectSource, type SelectedSourceInstance } from '../../calculation/source-instance'
import {
  W_ENGINE_FACTS,
  W_ENGINES,
} from '../engines'
import { selectedWEngineEffectIsHolderApplicable } from '../agent-setup-candidates'
import { ADMITTED_AGENTS } from '../agents'
import { defineWEngineSource } from '../source-definitions'
import {
  type AgentId,
  type EngineId,
  type Refinement,
} from '../types'
import {
  type CompleteSelectedSetup, type SelectedSetupObservation,
} from './equipment'
import { materializeSelectedWEngineEffects } from './w-engine-effect-materializer'
import { equipmentEffectActionTargets } from './equipment-eligibility'

export interface SelectedWEngineContext {
  agentId: AgentId
  setup: CompleteSelectedSetup
  observation: SelectedSetupObservation
  focusAgentId: AgentId
  partyAgentIds: readonly AgentId[]
  source: SelectedSourceInstance
  passiveEligible: boolean
}

interface SelectedWEngineBroadPrePenContext {
  agentId: AgentId
  focusAgentId: AgentId
  engineId: EngineId
  refinement: Refinement
  source: SelectedSourceInstance
  passiveEligible: boolean
}

/** Broad DEF relationships are shared by Result and candidate preparation. */
export function selectedWEngineBroadPrePenRelationships(
  context: SelectedWEngineBroadPrePenContext,
): ProfileRelationship[] {
  const {
    agentId,
    focusAgentId,
    engineId,
    refinement,
    source,
    passiveEligible,
  } = context
  if (!passiveEligible) return []
  return materializeSelectedWEngineEffects(
    W_ENGINE_FACTS[engineId].effects,
    {
      agentId,
      partyAgentIds: [agentId],
      focusAgentId,
      refinement,
      source,
      effectIsHolderApplicable: (effectKey) => selectedWEngineEffectIsHolderApplicable(
        agentId,
        engineId,
        effectKey,
      ),
      includeEffect: (_effectKey, fact) => (
        (fact.modifier === 'defIgnore' || fact.modifier === 'defReduction')
        && equipmentEffectActionTargets(fact).length === 0
      ),
    },
  )
}

export function selectedWEngineBroadPrePenRelationshipsForSlot(
  state: import('../../state').WorkbenchState,
  slot: 0 | 1 | 2,
): ProfileRelationship[] {
  const { agentId, setup } = state.slots[slot]
  if (!setup.engineId || !setup.refinement) return []
  const specialty = ADMITTED_AGENTS.find(({ id }) => id === agentId)?.specialty
  if (W_ENGINES[setup.engineId].passiveSpecialty !== specialty) return []
  const source = selectSource(
    defineWEngineSource(setup.engineId, W_ENGINES[setup.engineId].name),
    agentId,
    slot,
    { kind: 'refinement', refinement: setup.refinement },
  )
  return selectedWEngineBroadPrePenRelationships({
    agentId,
    focusAgentId: state.slots[state.focusSlot].agentId,
    engineId: setup.engineId,
    refinement: setup.refinement,
    source,
    passiveEligible: true,
  })
}

/**
 * Materializes the selected W-Engine exactly once. Agent identity is consulted
 * only for holder capability, action applicability, and prepared interval; the
 * passive magnitude remains owned by W_ENGINE_FACTS.
 */
export function selectedWEngineRelationships({
  agentId: agent,
  setup,
  observation,
  focusAgentId,
  partyAgentIds,
  source,
  passiveEligible,
}: SelectedWEngineContext): ProfileRelationship[] {
  if (!passiveEligible) return []
  return materializeSelectedWEngineEffects(
    W_ENGINE_FACTS[setup.engineId].effects,
    {
      agentId: agent,
      partyAgentIds,
      focusAgentId,
      refinement: setup.refinement,
      source,
      observation,
      effectIsHolderApplicable: (effectKey) => selectedWEngineEffectIsHolderApplicable(
        agent,
        setup.engineId,
        effectKey,
      ),
    },
  )
}
