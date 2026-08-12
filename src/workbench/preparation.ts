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
  return agentIds.includes('astraYao')
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
  const kingIsHeldByIndependentCritConsumer = establishedHolders.some((holder) => (
    holder.agentId !== context.agentId
    && holder.fourPieceId === 'king'
    && hasIndependentCritConsumer(holder.agentId)
  ))
  const targetHasIndependentCritConsumer = hasIndependentCritConsumer(context.agentId)
  return canPrepareKing && canPrepareAstral && kingIsHeldByIndependentCritConsumer
    ? {
      ...selection,
      fourPieceId: 'astralVoice',
      twoPieceId: targetHasIndependentCritConsumer
        ? selection.twoPieceId
        : selection.fourPieceId,
      mains: {
        ...selection.mains,
        slot4: targetHasIndependentCritConsumer
          ? selection.mains.slot4
          : 'atkPct',
      },
    }
    : selection
}

function hasIndependentCritConsumer(agentId: AgentId): boolean {
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
    twoPieceId: context.pool === 'full' ? 'astralVoice' : 'hormonePunk',
  }
}

function withCissiaAstralOpportunity(
  context: PreparationContext,
  partyAgentIds: readonly AgentId[],
  selection: SetupSelection,
): SetupSelection {
  return context.agentId === 'cissia'
    && hasRepeatedQuickAssistOpportunity(partyAgentIds)
    ? { ...selection, fourPieceId: 'astralVoice' }
    : selection
}

function representativeFor(context: PreparationContext): SetupSelection {
  return representativeSetupFor(context.agentId, context.pool, context.mindscape)
}

export function prepareTargetSelection(
  context: PreparationContext,
  focusAgentId: AgentId,
  establishedHolders: readonly EstablishedDiscHolder[],
): SetupSelection {
  const focused = withFocusedEngine(context, focusAgentId, representativeFor(context))
  const allocated = withCompetitiveKingAstralAllocation(context, establishedHolders, focused)
  const contextual = withCissiaAstralOpportunity(
    context,
    [context.agentId, ...establishedHolders.map(({ agentId }) => agentId)],
    allocated,
  )
  return withAstraAstralAllocation(context, establishedHolders, contextual)
}

export function preparePartySelections(
  contexts: readonly PreparationContext[],
  focusAgentId: AgentId,
): SetupSelection[] {
  const focused = contexts.map((context) => withFocusedEngine(
    context,
    focusAgentId,
    representativeFor(context),
  ))
  const withKingAllocation = focused.map((selection, index) => withCompetitiveKingAstralAllocation(
    contexts[index],
    contexts.map((context, holderIndex) => ({
      agentId: context.agentId,
      fourPieceId: focused[holderIndex].fourPieceId,
    })),
    selection,
  ))
  const partyAgentIds = contexts.map(({ agentId }) => agentId)
  const withCissiaAstral = withKingAllocation.map((selection, index) => (
    withCissiaAstralOpportunity(contexts[index], partyAgentIds, selection)
  ))
  const holders = contexts.map((context, index) => ({
    agentId: context.agentId,
    fourPieceId: withCissiaAstral[index].fourPieceId,
  }))
  return withCissiaAstral.map((selection, index) => withAstraAstralAllocation(
    contexts[index],
    holders,
    selection,
  ))
}
