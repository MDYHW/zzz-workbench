import {
  DISC_IDS_BY_AGENT_AND_PIECE,
  MAIN_STAT_IDS_BY_AGENT_AND_SLOT,
  SUBSTAT_CHOICES_BY_AGENT,
  representativeSetupFor,
  type AgentId,
  type DiscId,
  type PoolId,
  type SetupSelection,
} from './content'
import { primaryFormulaUsesDefRegion } from './formula-policy'
import { anotherAgentHasSpecialty } from './party-conditions'

export interface PreparationContext {
  agentId: AgentId
  pool: PoolId
  mindscape: number
}

export interface EstablishedDiscHolder {
  agentId: AgentId
  fourPieceId: DiscId | null
}

export function hasRepeatedQuickAssistOpportunity(
  agentIds: readonly AgentId[],
): boolean {
  return agentIds.includes('astraYao') || agentIds.includes('panYinhu')
}

function withFocusedEngine(
  context: PreparationContext,
  focusAgentId: AgentId,
  representative: SetupSelection,
): SetupSelection {
  if (
    context.agentId === 'trigger'
    && context.pool === 'full'
    && !primaryFormulaUsesDefRegion(focusAgentId)
  ) {
    return { ...representative, engineId: 'iceJadeTeapot' }
  }
  return representative
}

function withCompetitiveKingAstralAllocation(
  context: PreparationContext,
  establishedHolders: readonly EstablishedDiscHolder[],
  selection: SetupSelection,
): SetupSelection {
  const canPrepareKing = DISC_IDS_BY_AGENT_AND_PIECE[context.agentId].fourPiece
    .includes('king')
  const canPrepareAstral = DISC_IDS_BY_AGENT_AND_PIECE[context.agentId].fourPiece
    .includes('astralVoice')
  const kingIsHeldByPriorityCritHolder = establishedHolders.some((holder) => (
    holder.agentId !== context.agentId
    && holder.fourPieceId === 'king'
    && hasPreparedKingPriority(holder.agentId)
  ))
  const targetHasPreparedKingPriority = hasPreparedKingPriority(context.agentId)
  return canPrepareKing && canPrepareAstral && kingIsHeldByPriorityCritHolder
    ? {
      ...selection,
      fourPieceId: 'astralVoice',
      twoPieceId: targetHasPreparedKingPriority
        ? selection.twoPieceId
        : selection.fourPieceId,
      mains: {
        ...selection.mains,
        slot4: targetHasPreparedKingPriority
          ? selection.mains.slot4
          : 'atkPct',
      },
    }
    : selection
}

function hasPreparedKingPriority(agentId: AgentId): boolean {
  return MAIN_STAT_IDS_BY_AGENT_AND_SLOT[agentId].slot4.includes('critRate')
    && SUBSTAT_CHOICES_BY_AGENT[agentId].some(({ id }) => id === 'critRate')
}

function withAstraAstralAllocation(
  context: PreparationContext,
  establishedHolders: readonly EstablishedDiscHolder[],
  selection: SetupSelection,
): SetupSelection {
  const anotherAstralHolder = establishedHolders.some(({ agentId, fourPieceId }) => (
    agentId !== context.agentId && fourPieceId === 'astralVoice'
  ))
  if (context.agentId !== 'astraYao' || !anotherAstralHolder) return selection
  return {
    ...selection,
    fourPieceId: 'moonlight',
    twoPieceId: 'astralVoice',
  }
}

function withPanYinhuAstralAlternative(
  context: PreparationContext,
  establishedHolders: readonly EstablishedDiscHolder[],
  selection: SetupSelection,
): SetupSelection {
  const anotherAstralHolder = establishedHolders.some(({ agentId, fourPieceId }) => (
    agentId !== context.agentId && fourPieceId === 'astralVoice'
  ))
  if (
    context.agentId !== 'panYinhu'
    || selection.fourPieceId !== 'astralVoice'
    || !anotherAstralHolder
  ) return selection
  return {
    ...selection,
    fourPieceId: 'bunnyInWonderland',
    twoPieceId: 'astralVoice',
  }
}

function withJuFufuKingAlternative(
  context: PreparationContext,
  establishedHolders: readonly EstablishedDiscHolder[],
  selection: SetupSelection,
): SetupSelection {
  const anotherKingHolder = establishedHolders.some(({ agentId, fourPieceId }) => (
    agentId !== context.agentId && fourPieceId === 'king'
  ))
  if (context.agentId !== 'juFufu' || selection.fourPieceId !== 'king' || !anotherKingHolder) {
    return selection
  }
  return {
    ...selection,
    fourPieceId: 'swingJazz',
    twoPieceId: 'king',
    mains: { ...selection.mains, slot4: 'atkPct' },
  }
}

function withCissiaAstralOpportunity(
  context: PreparationContext,
  partyAgentIds: readonly AgentId[],
  establishedHolders: readonly EstablishedDiscHolder[],
  selection: SetupSelection,
): SetupSelection {
  const heldByNonYieldingAgent = establishedHolders.some(({ agentId, fourPieceId }) => (
    agentId !== context.agentId
    && agentId !== 'astraYao'
    && agentId !== 'panYinhu'
    && fourPieceId === 'astralVoice'
  ))
  return context.agentId === 'cissia'
    && hasRepeatedQuickAssistOpportunity(partyAgentIds)
    && !heldByNonYieldingAgent
    ? { ...selection, fourPieceId: 'astralVoice' }
    : selection
}

function representativeFor(context: PreparationContext): SetupSelection {
  return representativeSetupFor(context.agentId, context.pool, context.mindscape)
}

function withQualifiedAnbyCritBalance(
  context: PreparationContext,
  partyAgentIds: readonly AgentId[],
  providerIndex: number,
  selection: SetupSelection,
): SetupSelection {
  if (
    context.agentId !== 'anbySoldier0'
    || context.mindscape < 2
    || !anotherAgentHasSpecialty(partyAgentIds, providerIndex, ['Stun', 'Support'])
  ) return selection

  return {
    ...selection,
    twoPieceId: 'branchAndBlade',
    mains: {
      ...selection.mains,
      slot4: context.pool === 'full' ? 'critRate' : 'critDmg',
    },
  }
}

export function prepareTargetSelection(
  context: PreparationContext,
  focusAgentId: AgentId,
  establishedHolders: readonly EstablishedDiscHolder[],
): SetupSelection {
  const partyAgentIds = [
    context.agentId,
    ...establishedHolders.map(({ agentId }) => agentId),
  ]
  const balanced = withQualifiedAnbyCritBalance(
    context,
    partyAgentIds,
    0,
    representativeFor(context),
  )
  const focused = withFocusedEngine(context, focusAgentId, balanced)
  const allocated = withCompetitiveKingAstralAllocation(context, establishedHolders, focused)
  const nonoverlapping = withJuFufuKingAlternative(context, establishedHolders, allocated)
  const contextual = withCissiaAstralOpportunity(
    context,
    partyAgentIds,
    establishedHolders,
    nonoverlapping,
  )
  const withAstraAllocation = withAstraAstralAllocation(
    context,
    establishedHolders,
    contextual,
  )
  return withPanYinhuAstralAlternative(
    context,
    establishedHolders,
    withAstraAllocation,
  )
}

export function preparePartySelections(
  contexts: readonly PreparationContext[],
  focusAgentId: AgentId,
): SetupSelection[] {
  const partyAgentIds = contexts.map(({ agentId }) => agentId)
  const balanced = contexts.map((context, index) => withQualifiedAnbyCritBalance(
    context,
    partyAgentIds,
    index,
    representativeFor(context),
  ))
  const focused = contexts.map((context, index) => withFocusedEngine(
    context,
    focusAgentId,
    balanced[index],
  ))
  const withKingAllocation = focused.map((selection, index) => withCompetitiveKingAstralAllocation(
    contexts[index],
    contexts.map((context, holderIndex) => ({
      agentId: context.agentId,
      fourPieceId: focused[holderIndex].fourPieceId,
    })),
    selection,
  ))
  const kingHolders = contexts.map((context, index) => ({
    agentId: context.agentId,
    fourPieceId: withKingAllocation[index].fourPieceId,
  }))
  const withJuFufuAlternative = withKingAllocation.map((selection, index) => (
    withJuFufuKingAlternative(contexts[index], kingHolders, selection)
  ))
  const withCissiaAstral = withJuFufuAlternative.map((selection, index) => (
    withCissiaAstralOpportunity(contexts[index], partyAgentIds, kingHolders, selection)
  ))
  const holders = contexts.map((context, index) => ({
    agentId: context.agentId,
    fourPieceId: withCissiaAstral[index].fourPieceId,
  }))
  const withAstraAllocation = withCissiaAstral.map((selection, index) => withAstraAstralAllocation(
    contexts[index],
    holders,
    selection,
  ))
  const astralHolders = contexts.map((context, index) => ({
    agentId: context.agentId,
    fourPieceId: withAstraAllocation[index].fourPieceId,
  }))
  return withAstraAllocation.map((selection, index) => withPanYinhuAstralAlternative(
    contexts[index],
    astralHolders,
    selection,
  ))
}
