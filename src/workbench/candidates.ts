import {
  DISC_IDS_BY_AGENT_AND_PIECE,
  MAIN_STAT_IDS_BY_AGENT_AND_SLOT,
  type AgentId,
  type DiscId,
  type MainSlot,
  type MainStatId,
} from './content'
import { activeCandidatePressures } from './provider-effects'
import { hasRepeatedQuickAssistOpportunity } from './preparation'
import type { AppliedSlot, WorkbenchState } from './state'

export type RequiredSetupSelection =
  | {
    kind: 'disc'
    slot: AppliedSlot
    agentId: AgentId
    piece: 'fourPiece' | 'twoPiece'
  }
  | {
    kind: 'mainStat'
    slot: AppliedSlot
    agentId: AgentId
    mainSlot: MainSlot
  }

function recipientHasMaterialBroadPrePenPressure(
  state: WorkbenchState,
  slot: AppliedSlot,
): boolean {
  return activeCandidatePressures(state, slot)
    .includes('materialBroadPrePenDefBypass')
}

const MAIN_SLOTS: MainSlot[] = ['slot4', 'slot5', 'slot6']

export function effectiveFourPieceIds(
  state: WorkbenchState,
  slot: AppliedSlot,
): DiscId[] {
  const agentId = state.slots[slot].agentId
  const base = DISC_IDS_BY_AGENT_AND_PIECE[agentId].fourPiece
  return agentId === 'cissia'
    && hasRepeatedQuickAssistOpportunity(state.slots.map(({ agentId: id }) => id))
    ? [...base, 'astralVoice']
    : base
}

export function effectiveTwoPieceIds(
  state: WorkbenchState,
  slot: AppliedSlot,
): DiscId[] {
  const agentId = state.slots[slot].agentId
  const base = DISC_IDS_BY_AGENT_AND_PIECE[agentId].twoPiece
  return recipientHasMaterialBroadPrePenPressure(state, slot)
    ? base.filter((candidateId) => candidateId !== 'pufferElectro')
    : base
}

function effectiveMainStatIdsForPressure(
  agentId: AgentId,
  mainSlot: MainSlot,
  hasMaterialBroadPrePenPressure: boolean,
): MainStatId[] {
  const base = MAIN_STAT_IDS_BY_AGENT_AND_SLOT[agentId][mainSlot]
  return mainSlot === 'slot5'
    && base.includes('penRatio')
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
    recipientHasMaterialBroadPrePenPressure(state, slot),
  )
}

export function invalidRequiredSelections(
  state: WorkbenchState,
): RequiredSetupSelection[] {
  return state.slots.flatMap(({ agentId, setup }, slotIndex) => {
    const slot = slotIndex as AppliedSlot
    const hasMaterialBroadPrePenPressure = recipientHasMaterialBroadPrePenPressure(state, slot)
    const invalidDiscs: RequiredSetupSelection[] = [
      ...(setup.fourPieceId && !effectiveFourPieceIds(state, slot)
        .includes(setup.fourPieceId)
        ? [{ kind: 'disc' as const, slot, agentId, piece: 'fourPiece' as const }]
        : []),
      ...(setup.twoPieceId && !effectiveTwoPieceIds(state, slot)
        .includes(setup.twoPieceId)
        ? [{ kind: 'disc' as const, slot, agentId, piece: 'twoPiece' as const }]
        : []),
    ]
    const invalidMains: RequiredSetupSelection[] = MAIN_SLOTS.flatMap((mainSlot) => {
      const selected = setup.mains[mainSlot]
      return selected && !effectiveMainStatIdsForPressure(
        agentId,
        mainSlot,
        hasMaterialBroadPrePenPressure,
      )
        .includes(selected)
        ? [{ kind: 'mainStat' as const, slot, agentId, mainSlot }]
        : []
    })
    return [...invalidDiscs, ...invalidMains]
  })
}

export function incompleteRequiredSelections(
  state: WorkbenchState,
): RequiredSetupSelection[] {
  return state.slots.flatMap(({ agentId, setup }, slotIndex) => {
    const slot = slotIndex as AppliedSlot
    const missingDiscs: RequiredSetupSelection[] = [
      ...(setup.fourPieceId === null
        ? [{ kind: 'disc' as const, slot, agentId, piece: 'fourPiece' as const }]
        : []),
      ...(setup.twoPieceId === null
        ? [{ kind: 'disc' as const, slot, agentId, piece: 'twoPiece' as const }]
        : []),
    ]
    const missingMains: RequiredSetupSelection[] = MAIN_SLOTS.flatMap((mainSlot) => (
      setup.mains[mainSlot] === null
        ? [{ kind: 'mainStat' as const, slot, agentId, mainSlot }]
        : []
    ))
    return [...missingDiscs, ...missingMains]
  })
}
