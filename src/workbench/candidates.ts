import {
  SAME_EFFECT_TWO_PIECE_RELATIONSHIPS,
  setupPolicyFor,
  type AgentId,
  type DiscId,
  EFFECTIVE_SUBSTAT_VALUES,
  type MainSlot,
  type MainStatId,
  effectiveSubstatChoices,
  type SubstatChoice,
} from './content'
import {
  activeContextualFourPieceCases,
  activeCandidatePressures,
  activeSourceCandidateInputAdditions,
} from './candidate-context'
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
  purpose: 'slot5' | 'twoPiece',
): boolean {
  return activeCandidatePressures(state, slot, purpose)
    .includes('materialBroadPrePenDefBypass')
}

const MAIN_SLOTS: MainSlot[] = ['slot4', 'slot5', 'slot6']

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
  const discPolicy = setupPolicyFor(agentId).discIdsByPiece
  const base = discPolicy.fourPiece
  const partyAgentIds = state.slots.map(({ agentId: id }) => id)
  const contextual = activeContextualFourPieceCases(
    agentId,
    state.slots[slot].setup.mindscape,
    partyAgentIds,
    slot,
  ).map(({ discId }) => discId)
  return contextual.length ? [...new Set([...base, ...contextual])] : base
}

export function effectiveTwoPieceIds(
  state: WorkbenchState,
  slot: AppliedSlot,
): DiscId[] {
  const agentId = state.slots[slot].agentId
  const authored = setupPolicyFor(agentId).discIdsByPiece.twoPiece
  const base = authored
  const selectedFourPieceId = state.slots[slot].setup.fourPieceId
  const selectedDerived = selectedFourPieceId
    ? setupPolicyFor(agentId).discIdsByPiece.selectedFourPiece
      ?.[selectedFourPieceId]?.twoPiece ?? []
    : []
  const sourceDerived = activeSourceCandidateInputAdditions(state, slot)
    .flatMap(({ twoPiece }) => twoPiece ?? [])
  const candidates = [...new Set([...base, ...selectedDerived, ...sourceDerived])]
  const pressureFiltered = recipientHasMaterialBroadPrePenPressure(state, slot, 'twoPiece')
    ? candidates.filter((candidateId) => candidateId !== 'pufferElectro')
    : candidates
  return compressSameEffectTwoPieceIds(
    pressureFiltered,
    setupPolicyFor(agentId).discIdsByPiece.fourPiece,
    effectiveFourPieceIds(state, slot),
    state.slots[slot].setup.fourPieceId,
  )
}

export function effectiveFourPieceRoleSwapTwoPieceId(
  state: WorkbenchState,
  slot: AppliedSlot,
): DiscId | null {
  const setup = state.slots[slot].setup
  const targetFourPieceId = setup.twoPieceId
  if (!setup.fourPieceId || !targetFourPieceId) return null
  if (!effectiveFourPieceIds(state, slot).includes(targetFourPieceId)) return null

  const acceptsComplement = (twoPieceId: DiscId) => {
    const slots = [...state.slots] as WorkbenchState['slots']
    slots[slot] = {
      ...slots[slot],
      setup: { ...setup, fourPieceId: targetFourPieceId, twoPieceId },
    }
    return effectiveTwoPieceIds({ ...state, slots }, slot).includes(twoPieceId)
  }

  if (acceptsComplement(setup.fourPieceId)) return setup.fourPieceId
  return null
}

export function effectiveFourPieceRoleSwapIds(
  state: WorkbenchState,
  slot: AppliedSlot,
): DiscId[] {
  const targetFourPieceId = state.slots[slot].setup.twoPieceId
  return targetFourPieceId && effectiveFourPieceRoleSwapTwoPieceId(state, slot)
    ? [targetFourPieceId]
    : []
}

function effectiveMainStatIdsForPressure(
  agentId: AgentId,
  mainSlot: MainSlot,
  hasMaterialBroadPrePenPressure: boolean,
  selectedFourPieceId: DiscId | null,
  sourceDerived: readonly MainStatId[],
): MainStatId[] {
  const base = setupPolicyFor(agentId).mainStatIdsBySlot[mainSlot]
  const selectedDerived = selectedFourPieceId
    ? setupPolicyFor(agentId).discIdsByPiece.selectedFourPiece
      ?.[selectedFourPieceId]?.mainStats?.[mainSlot] ?? []
    : []
  const candidates = [...new Set([...base, ...selectedDerived, ...sourceDerived])]
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
  const base = effectiveSubstatChoices(current.agentId, current.setup)
  const sourceDerived = activeSourceCandidateInputAdditions(state, slot)
    .flatMap(({ substats }) => substats ?? [])
  const baseIds = new Set(base.map(({ id }) => id))
  return [
    ...base,
    ...sourceDerived
      .filter((id) => !baseIds.has(id))
      .map((id) => EFFECTIVE_SUBSTAT_VALUES[id]),
  ]
}

export { effectiveSubstatChoices }

export function effectiveMainStatIds(
  state: WorkbenchState,
  slot: AppliedSlot,
  mainSlot: MainSlot,
): MainStatId[] {
  const agentId = state.slots[slot].agentId
  const sourceDerived = activeSourceCandidateInputAdditions(state, slot)
    .flatMap(({ mainStats }) => mainStats?.[mainSlot] ?? [])
  return effectiveMainStatIdsForPressure(
    agentId,
    mainSlot,
    recipientHasMaterialBroadPrePenPressure(state, slot, 'slot5'),
    state.slots[slot].setup.fourPieceId,
    sourceDerived,
  )
}

export function invalidRequiredSelections(
  state: WorkbenchState,
): RequiredSetupSelection[] {
  return state.slots.flatMap(({ agentId, setup }, slotIndex) => {
    const slot = slotIndex as AppliedSlot
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
      return selected && !effectiveMainStatIds(state, slot, mainSlot)
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
