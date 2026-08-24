import {
  ADMITTED_AGENTS,
  FORMULA_PARTICIPATION_BY_AGENT,
  W_ENGINE_FACTS,
  equipmentEffectAppliesToAttribute,
  type AgentId,
  type EquipmentEffectCollection,
} from './content'
import { initialAtkFor } from './calculation/initial-atk'
import { directionUsesDefRegion, effectAttributeForAgent } from './formula-policy'
import type { AppliedSlot, WorkbenchState } from './state'

export type CandidatePressure = 'materialBroadPrePenDefBypass'


export interface SeedVanguardObservation {
  agentId: AgentId
  appliedSlot: AppliedSlot
  initialAtk: number
}

const BROAD_PRE_PEN_PRESSURE: CandidatePressure = 'materialBroadPrePenDefBypass'


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
    && equipmentEffectAppliesToAttribute(effect, attribute)
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

/**
 * Resolves only the pressure class consumed by candidate preparation. Source
 * provenance belongs to selected Agent/equipment relationships, not to a
 * parallel observation payload.
 */
export function activeCandidatePressures(
  state: WorkbenchState,
  recipientSlot: AppliedSlot,
): CandidatePressure[] {
  const recipientAgentId = state.slots[recipientSlot].agentId
  const slotFor = (agentId: AgentId) => (
    state.slots.find((slot) => slot.agentId === agentId)
  )

  if (slotFor('cissia') && isElectricCandidatePressureAgent(recipientAgentId)) {
    return [BROAD_PRE_PEN_PRESSURE]
  }
  if (slotFor('nicole') && isCandidatePressureAgent(recipientAgentId)) {
    return [BROAD_PRE_PEN_PRESSURE]
  }
  const trigger = slotFor('trigger')
  if (
    trigger?.setup.engineId === 'spectralGaze'
    && isCandidatePressureAgent(recipientAgentId)
  ) {
    return [BROAD_PRE_PEN_PRESSURE]
  }
  if (slotFor('seed') && hasSeedM2CandidatePressure(state, recipientSlot)) {
    return [BROAD_PRE_PEN_PRESSURE]
  }
  if (selectedEngineHasBroadPrePenPressure(state, recipientSlot)) {
    return [BROAD_PRE_PEN_PRESSURE]
  }
  const qingyi = slotFor('qingyi')
  if (
    qingyi
    && qingyi.setup.mindscape >= 1
    && isCandidatePressureAgent(recipientAgentId)
  ) {
    return [BROAD_PRE_PEN_PRESSURE]
  }
  return []
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
