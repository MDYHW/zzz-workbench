import {
  ADMITTED_AGENTS,
  FORMULA_PARTICIPATION_BY_AGENT,
  W_ENGINE_FACTS,
  type AgentId,
  type EquipmentEffectCollection,
} from './content'
import type { SourceDefinitionKey } from './content/source-definitions'
import { initialAtkFor } from './calculation/initial-atk'
import { directionUsesDefRegion, effectAttributeForAgent } from './formula-policy'
import type { AppliedSlot, WorkbenchState } from './state'

export type CandidatePressure = 'materialBroadPrePenDefBypass'

type CandidatePressureSourceKey = Extract<SourceDefinitionKey, {
  kind: 'agent-source' | 'mindscape' | 'w-engine'
}>

export interface CandidatePressureObservation {
  pressure: CandidatePressure
  sourceKey: CandidatePressureSourceKey
  holderAgentId: AgentId
  holderSlot: AppliedSlot
  recipientSlot: AppliedSlot
}

export interface SeedVanguardObservation {
  agentId: AgentId
  appliedSlot: AppliedSlot
  initialAtk: number
}

const BROAD_PRE_PEN_PRESSURE: CandidatePressure = 'materialBroadPrePenDefBypass'

const pressureSourceKeys = {
  cissiaCore: {
    kind: 'agent-source', agentId: 'cissia', sourceId: 'core',
  },
  nicoleCore: {
    kind: 'agent-source', agentId: 'nicole', sourceId: 'core',
  },
  spectralGaze: {
    kind: 'w-engine', engineId: 'spectralGaze',
  },
  seedMindscape2: {
    kind: 'mindscape', agentId: 'seed', tier: 2,
  },
  qingyiMindscape1: {
    kind: 'mindscape', agentId: 'qingyi', tier: 1,
  },
} as const satisfies Record<string, CandidatePressureSourceKey>

function isAttackAgent(agentId: AgentId): boolean {
  return ADMITTED_AGENTS.find(({ id }) => id === agentId)?.specialty === 'Attack'
}

function isCandidatePressureAgent(agentId: AgentId): boolean {
  return directionUsesDefRegion(agentId)
}

function isElectricCandidatePressureAgent(agentId: AgentId): boolean {
  return effectAttributeForAgent(agentId) === 'Electric'
    && isCandidatePressureAgent(agentId)
}

function selectSeedVanguardCandidate(
  candidates: readonly SeedVanguardObservation[],
): AgentId | null {
  if (candidates.length === 0) return null
  return candidates.reduce((selected, candidate) => (
    candidate.initialAtk > selected.initialAtk
    || (
      candidate.initialAtk === selected.initialAtk
      && candidate.appliedSlot < selected.appliedSlot
    )
      ? candidate
      : selected
  )).agentId
}

export function resolveSeedVanguard(
  observations: readonly SeedVanguardObservation[],
): AgentId | null {
  if (!observations.some(({ agentId }) => agentId === 'seed')) return null
  return selectSeedVanguardCandidate(observations.filter(({ agentId }) => (
    agentId !== 'seed' && isAttackAgent(agentId)
  )))
}

export function resolveSeedVanguardForState(state: WorkbenchState): AgentId | null {
  if (!state.slots.some(({ agentId }) => agentId === 'seed')) return null
  const eligible = state.slots.filter(({ agentId }) => (
    agentId !== 'seed' && isAttackAgent(agentId)
  ))
  if (eligible.length === 0) return null
  if (eligible.length === 1) return eligible[0].agentId

  const observations: SeedVanguardObservation[] = []
  for (const slot of eligible) {
    const initialAtk = initialAtkFor(slot.agentId, slot.setup)
    if (initialAtk === null) return null
    observations.push({
      agentId: slot.agentId,
      appliedSlot: state.slots.indexOf(slot) as AppliedSlot,
      initialAtk,
    })
  }
  return selectSeedVanguardCandidate(observations)
}

function selectedEngineHasBroadPrePenPressure(
  state: WorkbenchState,
  recipientSlot: AppliedSlot,
): boolean {
  const { agentId, setup } = state.slots[recipientSlot]
  if (!isCandidatePressureAgent(agentId) || !setup.engineId) return false
  const effects = W_ENGINE_FACTS[setup.engineId].effects as EquipmentEffectCollection
  const attribute = effectAttributeForAgent(agentId)
  // Myriad's DEF Ignore requires Ice damage, independent of holder identity.
  if (setup.engineId === 'myriadEclipse' && attribute !== 'Ice') return false
  return Object.values(effects).some((effect) => (
    (effect.modifier === 'defIgnore' || effect.modifier === 'defReduction')
    && !effect.scope?.actions?.length
    && (!effect.scope?.attributes?.length || effect.scope.attributes.includes(attribute))
  ))
}

export function hasSeedM2CandidatePressure(
  state: WorkbenchState,
  recipientSlot: AppliedSlot,
): boolean {
  const recipientAgentId = state.slots[recipientSlot].agentId
  const seed = state.slots.find(({ agentId }) => agentId === 'seed')
  const seedVanguard = resolveSeedVanguardForState(state)
  return isCandidatePressureAgent(recipientAgentId) && Boolean(
    seed
      && seed.setup.mindscape >= 2
      && seedVanguard
      && (recipientAgentId === 'seed' || recipientAgentId === seedVanguard),
  )
}

function observation(
  state: WorkbenchState,
  recipientSlot: AppliedSlot,
  holderSlot: AppliedSlot,
  sourceKey: CandidatePressureSourceKey,
): CandidatePressureObservation {
  return {
    pressure: BROAD_PRE_PEN_PRESSURE,
    sourceKey,
    holderAgentId: state.slots[holderSlot].agentId,
    holderSlot,
    recipientSlot,
  }
}

/**
 * Observes the complete current selected-input and party pressure set without
 * invoking provider calculation or delivery.
 */
export function activeCandidatePressureObservations(
  state: WorkbenchState,
  recipientSlot: AppliedSlot,
): CandidatePressureObservation[] {
  const recipientAgentId = state.slots[recipientSlot].agentId
  const observations: CandidatePressureObservation[] = []
  const slotFor = (agentId: AgentId): AppliedSlot | null => {
    const index = state.slots.findIndex((slot) => slot.agentId === agentId)
    return index < 0 ? null : index as AppliedSlot
  }
  const add = (
    holderSlot: AppliedSlot | null,
    sourceKey: CandidatePressureSourceKey,
  ) => {
    if (holderSlot !== null) {
      observations.push(observation(state, recipientSlot, holderSlot, sourceKey))
    }
  }

  const cissiaSlot = slotFor('cissia')
  if (cissiaSlot !== null && isElectricCandidatePressureAgent(recipientAgentId)) {
    add(cissiaSlot, pressureSourceKeys.cissiaCore)
  }
  const nicoleSlot = slotFor('nicole')
  if (nicoleSlot !== null && isCandidatePressureAgent(recipientAgentId)) {
    add(nicoleSlot, pressureSourceKeys.nicoleCore)
  }
  const triggerSlot = slotFor('trigger')
  if (
    triggerSlot !== null
    && state.slots[triggerSlot].setup.engineId === 'spectralGaze'
    && isCandidatePressureAgent(recipientAgentId)
  ) {
    add(triggerSlot, pressureSourceKeys.spectralGaze)
  }
  const seedSlot = slotFor('seed')
  if (seedSlot !== null && hasSeedM2CandidatePressure(state, recipientSlot)) {
    add(seedSlot, pressureSourceKeys.seedMindscape2)
  }
  if (selectedEngineHasBroadPrePenPressure(state, recipientSlot)) {
    const engineId = state.slots[recipientSlot].setup.engineId!
    add(recipientSlot, { kind: 'w-engine', engineId })
  }
  const qingyiSlot = slotFor('qingyi')
  if (
    qingyiSlot !== null
    && state.slots[qingyiSlot].setup.mindscape >= 1
    && isCandidatePressureAgent(recipientAgentId)
  ) {
    add(qingyiSlot, pressureSourceKeys.qingyiMindscape1)
  }
  return observations
}

export function activeCandidatePressures(
  state: WorkbenchState,
  recipientSlot: AppliedSlot,
): CandidatePressure[] {
  return [...new Set(activeCandidatePressureObservations(
    state,
    recipientSlot,
  ).map(({ pressure }) => pressure))]
}

export function hasDialynUltimateOpportunity(
  state: WorkbenchState,
  recipientSlot: AppliedSlot,
): boolean {
  const recipientAgentId = state.slots[recipientSlot].agentId
  return recipientAgentId !== 'dialyn'
    && FORMULA_PARTICIPATION_BY_AGENT[recipientAgentId].setup.primary
      .includes('general_damage')
    && state.slots.some(({ agentId }) => agentId === 'dialyn')
}
