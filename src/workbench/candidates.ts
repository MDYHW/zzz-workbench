import {
  DISC_IDS_BY_AGENT_AND_PIECE,
  MAIN_STAT_IDS_BY_AGENT_AND_SLOT,
  SAME_EFFECT_TWO_PIECE_RELATIONSHIPS,
  type AgentId,
  type DiscId,
  type MainSlot,
  type MainStatId,
  effectiveSubstatChoices,
  type SubstatChoice,
} from './content'
import {
  activeCandidatePressures,
  hasDialynUltimateOpportunity,
} from './provider-effects'
import { hasRepeatedQuickAssistOpportunity } from './preparation'
import { qingyiAstralOpportunity, triggerAdditionalIsActive } from './party-conditions'
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
  | { kind: 'substat'; slot: AppliedSlot; agentId: AgentId; substatId: SubstatChoice['id'] }

function recipientHasMaterialBroadPrePenPressure(
  state: WorkbenchState,
  slot: AppliedSlot,
): boolean {
  return activeCandidatePressures(state, slot)
    .includes('materialBroadPrePenDefBypass')
}

const MAIN_SLOTS: MainSlot[] = ['slot4', 'slot5', 'slot6']

function triggerCritPressureIsActive(
  state: WorkbenchState,
  slot: AppliedSlot,
): boolean {
  const current = state.slots[slot]
  return current.agentId === 'trigger'
    && (current.setup.fourPieceId === 'king'
      || triggerAdditionalIsActive(
        state.slots.map(({ agentId }) => agentId),
        slot,
      ))
}

function compressSameEffectTwoPieceIds(
  authored: readonly DiscId[],
  baseFourPieceIds: readonly DiscId[],
  effectiveFourPieceIds: readonly DiscId[],
  selectedFourPieceId: DiscId | null,
): DiscId[] {
  return SAME_EFFECT_TWO_PIECE_RELATIONSHIPS.reduce<DiscId[]>((current, relationship) => {
    const [first, second] = relationship.members
    if (!authored.includes(first) || !authored.includes(second)) return current

    const selectedComplement = selectedFourPieceId === first
      ? second
      : selectedFourPieceId === second
        ? first
        : null
    const baseRoles = relationship.members.filter((id) => baseFourPieceIds.includes(id))
    const contextualRoles = relationship.members.filter((id) => effectiveFourPieceIds.includes(id))
    const exposed = selectedComplement
      ?? (baseRoles.length === 1 ? baseRoles[0] : null)
      ?? (contextualRoles.length === 1 ? contextualRoles[0] : null)
      ?? relationship.canonical

    return current.filter((id) => (
      !relationship.members.some((member) => member === id) || id === exposed
    ))
  }, [...authored])
}

export function effectiveFourPieceIds(
  state: WorkbenchState,
  slot: AppliedSlot,
): DiscId[] {
  const agentId = state.slots[slot].agentId
  const base = DISC_IDS_BY_AGENT_AND_PIECE[agentId].fourPiece
  const contextual = [
    ...((agentId === 'cissia' || agentId === 'evelyn')
      && hasRepeatedQuickAssistOpportunity(state.slots.map(({ agentId: id }) => id))
      ? ['astralVoice' as const]
      : []),
    ...(agentId === 'qingyi'
      && qingyiAstralOpportunity(state.slots.map(({ agentId: id }) => id), slot)
      ? ['astralVoice' as const]
      : []),
    ...(hasDialynUltimateOpportunity(state, slot) ? ['pufferElectro' as const] : []),
  ]
  return contextual.length ? [...base, ...contextual] : base
}

export function effectiveTwoPieceIds(
  state: WorkbenchState,
  slot: AppliedSlot,
): DiscId[] {
  const agentId = state.slots[slot].agentId
  const authored = DISC_IDS_BY_AGENT_AND_PIECE[agentId].twoPiece
  const base = agentId === 'trigger' && !triggerCritPressureIsActive(state, slot)
    ? authored.filter((candidateId) => candidateId !== 'woodpecker')
    : authored
  const selectedDerived = (agentId === 'lycaon' || agentId === 'juFufu' || agentId === 'lighter' || agentId === 'pulchra' || agentId === 'qingyi')
    && state.slots[slot].setup.fourPieceId === 'king'
    ? ['woodpecker' as const]
    : []
  const candidates = selectedDerived.length ? [...base, ...selectedDerived] : base
  const pressureFiltered = recipientHasMaterialBroadPrePenPressure(state, slot)
    ? candidates.filter((candidateId) => candidateId !== 'pufferElectro')
    : candidates
  return compressSameEffectTwoPieceIds(
    pressureFiltered,
    DISC_IDS_BY_AGENT_AND_PIECE[agentId].fourPiece,
    effectiveFourPieceIds(state, slot),
    state.slots[slot].setup.fourPieceId,
  )
}

export function effectiveFourPieceRoleSwapIds(
  state: WorkbenchState,
  slot: AppliedSlot,
): DiscId[] {
  const setup = state.slots[slot].setup
  if (!setup.fourPieceId || !setup.twoPieceId) return []
  if (!effectiveFourPieceIds(state, slot).includes(setup.twoPieceId)) return []

  const slots = [...state.slots] as WorkbenchState['slots']
  slots[slot] = {
    ...slots[slot],
    setup: {
      ...setup,
      fourPieceId: setup.twoPieceId,
      twoPieceId: setup.fourPieceId,
    },
  }
  return effectiveTwoPieceIds({ ...state, slots }, slot).includes(setup.fourPieceId)
    ? [setup.twoPieceId]
    : []
}

function effectiveMainStatIdsForPressure(
  agentId: AgentId,
  mainSlot: MainSlot,
  hasMaterialBroadPrePenPressure: boolean,
  selectedFourPieceId: DiscId | null,
): MainStatId[] {
  const base = MAIN_STAT_IDS_BY_AGENT_AND_SLOT[agentId][mainSlot]
  const candidates = (agentId === 'lycaon' || agentId === 'juFufu' || agentId === 'lighter' || agentId === 'pulchra')
    && mainSlot === 'slot4'
    && selectedFourPieceId === 'king'
    ? [...base, 'critRate' as const]
    : base
  return mainSlot === 'slot5'
    && candidates.includes('penRatio')
    && hasMaterialBroadPrePenPressure
    ? candidates.filter((candidateId) => candidateId !== 'penRatio')
    : candidates
}

export function effectiveSubstatChoicesForSlot(
  state: WorkbenchState,
  slot: AppliedSlot,
): SubstatChoice[] {
  const current = state.slots[slot]
  if (current.agentId === 'trigger' && !triggerCritPressureIsActive(state, slot)) {
    return []
  }
  return effectiveSubstatChoices(current.agentId, current.setup)
}

export { effectiveSubstatChoices }

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
    state.slots[slot].setup.fourPieceId,
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
        setup.fourPieceId,
      )
        .includes(selected)
        ? [{ kind: 'mainStat' as const, slot, agentId, mainSlot }]
        : []
    })
    const effectiveSubstats = effectiveSubstatChoicesForSlot(state, slot)
    const invalidSubstats: RequiredSetupSelection[] = Object.keys(setup.substats)
      .filter((id) => !effectiveSubstats.some((choice) => choice.id === id))
      .map((id) => ({ kind: 'substat' as const, slot, agentId, substatId: id as SubstatChoice['id'] }))
    return [...invalidDiscs, ...invalidMains, ...invalidSubstats]
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
    const missingSubstats: RequiredSetupSelection[] = effectiveSubstatChoicesForSlot(state, slot)
      .filter(({ id }) => !Number.isFinite(setup.substats[id]))
      .map(({ id }) => ({ kind: 'substat' as const, slot, agentId, substatId: id }))
    return [...missingDiscs, ...missingMains, ...missingSubstats]
  })
}
