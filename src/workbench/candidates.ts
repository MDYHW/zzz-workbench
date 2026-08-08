import {
  MAIN_STAT_IDS_BY_AGENT_AND_SLOT,
  SETUP_FORMULA_PARTICIPATION_BY_AGENT,
  type AgentId,
  type MainSlot,
  type MainStatId,
} from './content'
import { activeCandidatePressures } from './provider-effects'
import type { AppliedSlot, WorkbenchState } from './state'

export interface IncompleteMainStatSelection {
  slot: AppliedSlot
  agentId: AgentId
  mainSlot: MainSlot
}

const MAIN_SLOTS: MainSlot[] = ['slot4', 'slot5', 'slot6']

function directionConsumesDefRegion(agentId: AgentId): boolean {
  const { primary, residual } = SETUP_FORMULA_PARTICIPATION_BY_AGENT[agentId]
  return [...primary, ...residual].some((formula) => (
    formula === 'general_damage' || formula === 'anomaly_damage'
  ))
}

function effectiveMainStatIdsForPressure(
  agentId: AgentId,
  mainSlot: MainSlot,
  hasMaterialBroadPrePenPressure: boolean,
): MainStatId[] {
  const base = MAIN_STAT_IDS_BY_AGENT_AND_SLOT[agentId][mainSlot]
  return mainSlot === 'slot5'
    && base.includes('penRatio')
    && directionConsumesDefRegion(agentId)
    && hasMaterialBroadPrePenPressure
    ? base.filter((candidateId) => candidateId !== 'penRatio')
    : base
}

export function effectiveMainStatIds(
  state: WorkbenchState,
  slot: AppliedSlot,
  mainSlot: MainSlot,
): MainStatId[] {
  const agentId = state.slots[slot].agentId
  return effectiveMainStatIdsForPressure(
    agentId,
    mainSlot,
    activeCandidatePressures(state).includes('materialBroadPrePenDefBypass'),
  )
}

export function invalidMainStatSelections(
  state: WorkbenchState,
): IncompleteMainStatSelection[] {
  const hasMaterialBroadPrePenPressure = activeCandidatePressures(state)
    .includes('materialBroadPrePenDefBypass')
  return state.slots.flatMap(({ agentId, setup }, slotIndex) => (
    MAIN_SLOTS.flatMap((mainSlot) => {
      const selected = setup.mains[mainSlot]
      return selected && !effectiveMainStatIdsForPressure(
        agentId,
        mainSlot,
        hasMaterialBroadPrePenPressure,
      )
        .includes(selected)
        ? [{ slot: slotIndex as AppliedSlot, agentId, mainSlot }]
        : []
    })
  ))
}

export function incompleteMainStatSelections(
  state: WorkbenchState,
): IncompleteMainStatSelection[] {
  return state.slots.flatMap(({ agentId, setup }, slotIndex) => (
    MAIN_SLOTS.flatMap((mainSlot) => setup.mains[mainSlot] === null
      ? [{ slot: slotIndex as AppliedSlot, agentId, mainSlot }]
      : [])
  ))
}
