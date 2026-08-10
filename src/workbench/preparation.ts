import {
  DISC_IDS_BY_AGENT_AND_PIECE,
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

function withTriggerKingAllocation(
  context: PreparationContext,
  establishedHolders: readonly EstablishedDiscHolder[],
  selection: SetupSelection,
): SetupSelection {
  const kingIsAllocatedToRigidHolder = establishedHolders.some(({ agentId, fourPieceId }) => (
    fourPieceId === 'king'
    && DISC_IDS_BY_AGENT_AND_PIECE[agentId].fourPiece.length === 1
  ))
  return context.agentId === 'trigger' && kingIsAllocatedToRigidHolder
    ? { ...selection, fourPieceId: 'astralVoice', twoPieceId: 'shockstar' }
    : selection
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
  const allocated = withTriggerKingAllocation(context, establishedHolders, focused)
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
  const withKingAllocation = focused.map((selection, index) => withTriggerKingAllocation(
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
