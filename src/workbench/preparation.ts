import {
  ADMITTED_AGENTS,
  applyPreparedDiscPatch,
  setupPolicyFor,
  type AgentId,
  type DiscId,
  type PoolId,
  type SetupSelection,
} from './content'
import { primaryFormulaUsesCrit, primaryFormulaUsesDefRegion } from './formula-policy'
import {
  anotherAgentHasSpecialty,
  hasRepeatedQuickAssistOpportunity,
  triggerAdditionalIsActive,
  zhuYuanAdditionalIsActive,
} from './party-conditions'

export interface PreparationContext {
  agentId: AgentId
  pool: PoolId
  mindscape: number
}

export interface EstablishedDiscHolder {
  agentId: AgentId
  fourPieceId: DiscId | null
  mindscape?: number
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
  partyAgentIds: readonly AgentId[],
  establishedHolders: readonly EstablishedDiscHolder[],
  selection: SetupSelection,
): SetupSelection {
  const canPrepareKing = setupPolicyFor(context.agentId).discIdsByPiece.fourPiece
    .includes('king')
  const canPrepareAstral = setupPolicyFor(context.agentId).discIdsByPiece.fourPiece
    .includes('astralVoice')
  const anotherHolderKeepsKing = establishedHolders.some((holder) => (
    holder.agentId !== context.agentId
    && holder.fourPieceId === 'king'
    && kingHolderPrecedes(context.agentId, holder.agentId, partyAgentIds)
  ))
  const targetRetainsAuthoredCrit = retainsAuthoredCritAfterKingAllocation(
    context.agentId,
  )
  return selection.fourPieceId === 'king'
    && canPrepareKing && canPrepareAstral && anotherHolderKeepsKing
    ? {
      ...selection,
      fourPieceId: 'astralVoice',
      twoPieceId: targetRetainsAuthoredCrit
        ? selection.twoPieceId
        : selection.fourPieceId,
      mains: {
        ...selection.mains,
        slot4: targetRetainsAuthoredCrit
          ? selection.mains.slot4
          : 'atkPct',
      },
    }
    : selection
}

function canPrepareFocusCritKing(
  context: PreparationContext,
  selection: SetupSelection,
): boolean {
  return ADMITTED_AGENTS.find(({ id }) => id === context.agentId)?.specialty === 'Stun'
    && setupPolicyFor(context.agentId).discIdsByPiece.fourPiece.includes('king')
    && selection.fourPieceId !== 'king'
    && selection.twoPieceId !== 'king'
}

function prepareFocusCritKing(
  selection: SetupSelection,
): SetupSelection {
  return {
    ...selection,
    fourPieceId: 'king',
    mains: { ...selection.mains, slot4: 'critRate' },
  }
}

/**
 * A CRIT-capable Focus makes one legal King package the first party-facing
 * Stun choice. An already-prepared legal King representative is preserved
 * before flexible Support allocation; preparation does not displace it with a
 * newly eligible holder that has no stronger current consumer.
 */
function withFocusCritKingPriority(
  contexts: readonly PreparationContext[],
  focusAgentId: AgentId,
  selections: readonly SetupSelection[],
): SetupSelection[] {
  if (!primaryFormulaUsesCrit(focusAgentId)
    || selections.some(({ fourPieceId }) => fourPieceId === 'king')) {
    return [...selections]
  }
  const eligible = contexts.flatMap((context, index) => (
    canPrepareFocusCritKing(context, selections[index]) ? [index] : []
  ))
  if (eligible.length !== 1) return [...selections]

  return selections.map((selection, index) => (
    index === eligible[0] ? prepareFocusCritKing(selection) : selection
  ))
}

function withEstablishedFocusCritKingPriority(
  context: PreparationContext,
  focusAgentId: AgentId,
  establishedHolders: readonly EstablishedDiscHolder[],
  selection: SetupSelection,
): SetupSelection {
  return primaryFormulaUsesCrit(focusAgentId)
    && !establishedHolders.some(({ fourPieceId }) => fourPieceId === 'king')
    && canPrepareFocusCritKing(context, selection)
      ? prepareFocusCritKing(selection)
      : selection
}

function hasIndependentKingCrit(
  agentId: AgentId,
  partyAgentIds: readonly AgentId[],
): boolean {
  if (agentId === 'trigger') {
    return triggerAdditionalIsActive(partyAgentIds, partyAgentIds.indexOf(agentId))
  }
  return retainsAuthoredCritAfterKingAllocation(agentId)
}

function retainsAuthoredCritAfterKingAllocation(agentId: AgentId): boolean {
  return setupPolicyFor(agentId).preparedDisc
    ?.kingAstralAlternative?.preservesCritInvestment ?? false
}

function canPrepareAstral(agentId: AgentId): boolean {
  return setupPolicyFor(agentId).discIdsByPiece.fourPiece.includes('astralVoice')
}

function winsCurrentKingTie(holderId: AgentId, targetId: AgentId): boolean {
  const holderPriority = setupPolicyFor(holderId).preparedDisc
    ?.kingAstralAlternative?.authoredTiePrecedence
  const targetPriority = setupPolicyFor(targetId).preparedDisc
    ?.kingAstralAlternative?.authoredTiePrecedence
  return holderPriority !== undefined
    && targetPriority !== undefined
    && holderPriority > targetPriority
}

/**
 * Preserve the less-flexible King holder first. When both holders can take
 * Astral, an independent CRIT consumer wins; the remaining current ties use
 * their bounded authored representative rather than a runtime holder score.
 */
function kingHolderPrecedes(
  targetId: AgentId,
  holderId: AgentId,
  partyAgentIds: readonly AgentId[],
): boolean {
  if (!canPrepareAstral(holderId)) return true
  const holderHasIndependentCrit = hasIndependentKingCrit(holderId, partyAgentIds)
  const targetHasIndependentCrit = hasIndependentKingCrit(targetId, partyAgentIds)
  if (holderHasIndependentCrit !== targetHasIndependentCrit) {
    return holderHasIndependentCrit
  }
  return winsCurrentKingTie(holderId, targetId)
}

type PreparedExclusiveDiscAllocation =
  | {
    fourPieceId: 'astralVoice'
    alternativeKey: 'astralCollisionAlternative'
  }
  | {
    fourPieceId: 'moonlight'
    alternativeKey: 'moonlightCollisionAlternative'
  }

const ASTRAL_ALLOCATION: PreparedExclusiveDiscAllocation = {
  fourPieceId: 'astralVoice',
  alternativeKey: 'astralCollisionAlternative',
}

const MOONLIGHT_ALLOCATION: PreparedExclusiveDiscAllocation = {
  fourPieceId: 'moonlight',
  alternativeKey: 'moonlightCollisionAlternative',
}

function exclusiveCollisionAlternative(
  agentId: AgentId,
  { alternativeKey }: PreparedExclusiveDiscAllocation,
) {
  return setupPolicyFor(agentId).preparedDisc?.[alternativeKey]
}

function withEstablishedExclusiveDiscAllocation(
  context: PreparationContext,
  establishedHolders: readonly EstablishedDiscHolder[],
  selection: SetupSelection,
  allocation: PreparedExclusiveDiscAllocation,
): SetupSelection {
  const { fourPieceId } = allocation
  const alternative = exclusiveCollisionAlternative(context.agentId, allocation)
  const anotherHolder = establishedHolders.some(({ agentId, fourPieceId: heldEffect }) => (
    agentId !== context.agentId && heldEffect === fourPieceId
  ))
  return alternative
    && selection.fourPieceId === fourPieceId
    && anotherHolder
      ? applyPreparedDiscPatch(selection, alternative.patch)
      : selection
}

function withNonoverlappingExclusiveDiscAllocation(
  contexts: readonly PreparationContext[],
  selections: readonly SetupSelection[],
  allocation: PreparedExclusiveDiscAllocation,
): SetupSelection[] {
  const { fourPieceId } = allocation
  const holders = selections.flatMap((selection, index) => (
    selection.fourPieceId === fourPieceId ? [index] : []
  ))
  if (holders.length <= 1) return [...selections]

  const rigid = holders.filter((index) => (
    !exclusiveCollisionAlternative(contexts[index].agentId, allocation)
  ))
  const priorities = holders.map((index) => ({
    index,
    priority: exclusiveCollisionAlternative(contexts[index].agentId, allocation)
      ?.authoredKeeperPrecedence,
  })).filter((entry): entry is { index: number; priority: number } => (
    entry.priority !== undefined
  ))
  const maximumPriority = Math.max(...priorities.map(({ priority }) => priority))
  const priorityKeepers = priorities.filter(({ priority }) => priority === maximumPriority)
  const keeper = rigid.length === 1
    ? rigid[0]
    : rigid.length === 0 && priorityKeepers.length === 1
      ? priorityKeepers[0].index
      : null
  if (keeper === null) return [...selections]

  return selections.map((selection, index) => {
    const alternative = exclusiveCollisionAlternative(
      contexts[index].agentId,
      allocation,
    )
    return index !== keeper && selection.fourPieceId === fourPieceId && alternative
      ? applyPreparedDiscPatch(selection, alternative.patch)
      : selection
  })
}

/**
 * Cissia's Astral package is contextual rather than her authored base. When
 * two direct Moonlight holders need the Moonlight/Astral pair, keep Cissia's
 * independent Dawn package so the later allocation can preserve both effects.
 */
function withContextualCissiaCollisionResolved(
  contexts: readonly PreparationContext[],
  selections: readonly SetupSelection[],
): SetupSelection[] {
  const moonlightHolderCount = selections.filter(({ fourPieceId }) => (
    fourPieceId === 'moonlight'
  )).length
  if (moonlightHolderCount <= 1) return [...selections]

  return selections.map((selection, index) => (
    setupPolicyFor(contexts[index].agentId).preparedDisc
      ?.restoreRepresentativeOnAstralMoonlightCollision
    && selection.fourPieceId === 'astralVoice'
      ? representativeFor(contexts[index])
      : selection
  ))
}

function withEstablishedContextualCissiaCollisionResolved(
  context: PreparationContext,
  establishedHolders: readonly EstablishedDiscHolder[],
  selection: SetupSelection,
): SetupSelection {
  const occupiedEffects = new Set(establishedHolders.map(({ fourPieceId }) => fourPieceId))
  return setupPolicyFor(context.agentId).preparedDisc
    ?.restoreRepresentativeOnAstralMoonlightCollision
    && selection.fourPieceId === 'astralVoice'
    && occupiedEffects.has('astralVoice')
    && occupiedEffects.has('moonlight')
      ? representativeFor(context)
      : selection
}

function withKingCollisionAlternative(
  context: PreparationContext,
  establishedHolders: readonly EstablishedDiscHolder[],
  selection: SetupSelection,
): SetupSelection {
  const alternative = setupPolicyFor(context.agentId).preparedDisc
    ?.kingCollisionAlternative
  if (!alternative || selection.fourPieceId !== 'king') return selection

  const hasConflictingHolder = establishedHolders.some(({ agentId, fourPieceId }) => {
    if (agentId === context.agentId || fourPieceId !== 'king') return false
    return alternative.kind === 'exact-holder'
      ? agentId === alternative.holderAgentId
      : !canPrepareAstral(agentId)
  })
  return hasConflictingHolder
    ? applyPreparedDiscPatch(selection, alternative.patch)
    : selection
}

function withCissiaAstralOpportunity(
  context: PreparationContext,
  partyAgentIds: readonly AgentId[],
  establishedHolders: readonly EstablishedDiscHolder[],
  selection: SetupSelection,
  canReallocateFlexibleHolders: boolean,
): SetupSelection {
  const heldByNonYieldingAgent = establishedHolders.some(({ agentId, fourPieceId }) => (
    agentId !== context.agentId
    && fourPieceId === 'astralVoice'
    && (
      !canReallocateFlexibleHolders
      || !exclusiveCollisionAlternative(agentId, ASTRAL_ALLOCATION)
    )
  ))
  return context.agentId === 'cissia'
    && hasRepeatedQuickAssistOpportunity(partyAgentIds)
    && !heldByNonYieldingAgent
    ? { ...selection, fourPieceId: 'astralVoice' }
    : selection
}

function representativeFor(context: PreparationContext): SetupSelection {
  return setupPolicyFor(context.agentId)
    .representativeSetupFor(context.pool, context.mindscape)
}

function holderSnapshots(
  contexts: readonly PreparationContext[],
  selections: readonly SetupSelection[],
): EstablishedDiscHolder[] {
  return contexts.map((context, index) => ({
    agentId: context.agentId,
    fourPieceId: selections[index].fourPieceId,
    mindscape: context.mindscape,
  }))
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

function withZhuYuanCritBalance(
  context: PreparationContext,
  partyAgentIds: readonly AgentId[],
  partyMindscapes: readonly number[],
  providerIndex: number,
  selection: SetupSelection,
): SetupSelection {
  if (context.agentId !== 'zhuYuan' || !zhuYuanAdditionalIsActive(partyAgentIds, providerIndex)) {
    return selection
  }
  const nicoleIndex = partyAgentIds.indexOf('nicole')
  const hasNicoleM6 = nicoleIndex >= 0 && partyMindscapes[nicoleIndex] >= 6
  const hasPreparedCritBalance = context.pool === 'full' || hasNicoleM6
  return hasPreparedCritBalance
    ? { ...selection, mains: { ...selection.mains, slot4: 'critDmg' } }
    : selection
}

function withNicolePressureSafePackage(
  context: PreparationContext,
  partyAgentIds: readonly AgentId[],
  partyMindscapes: readonly number[],
  selection: SetupSelection,
): SetupSelection {
  const nicoleIndex = partyAgentIds.indexOf('nicole')
  if (nicoleIndex < 0) return selection
  if (context.agentId === 'ellen') {
    return {
      ...selection,
      twoPieceId: 'branchAndBlade',
      mains: {
        ...selection.mains,
        slot4: context.pool === 'full' && partyMindscapes[nicoleIndex] >= 6 ? 'critDmg' : 'critRate',
        slot5: 'iceDmg',
      },
    }
  }
  if (context.agentId === 'soldier11') {
    return {
      ...selection,
      twoPieceId: 'infernoMetal',
      mains: {
        ...selection.mains,
        slot4: context.pool === 'full' && partyMindscapes[nicoleIndex] >= 6 ? 'critDmg' : 'critRate',
        slot5: 'fireDmg',
      },
    }
  }
  return selection
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
  const partyMindscapes = [context.mindscape, ...establishedHolders.map(({ mindscape }) => mindscape ?? 0)]
  const balanced = withQualifiedAnbyCritBalance(
    context,
    partyAgentIds,
    0,
    representativeFor(context),
  )
  const zhuBalanced = withZhuYuanCritBalance(context, partyAgentIds, partyMindscapes, 0, balanced)
  const pressureSafe = withNicolePressureSafePackage(context, partyAgentIds, partyMindscapes, zhuBalanced)
  const focused = withFocusedEngine(context, focusAgentId, pressureSafe)
  const kingDirected = withEstablishedFocusCritKingPriority(
    context,
    focusAgentId,
    establishedHolders,
    focused,
  )
  const allocated = withCompetitiveKingAstralAllocation(
    context,
    partyAgentIds,
    establishedHolders,
    kingDirected,
  )
  const nonoverlapping = withKingCollisionAlternative(
    context,
    establishedHolders,
    allocated,
  )
  const contextual = withCissiaAstralOpportunity(
    context,
    partyAgentIds,
    establishedHolders,
    nonoverlapping,
    false,
  )
  const withoutContextualCollision = withEstablishedContextualCissiaCollisionResolved(
    context,
    establishedHolders,
    contextual,
  )
  const withAstralAllocation = withEstablishedExclusiveDiscAllocation(
    context,
    establishedHolders,
    withoutContextualCollision,
    ASTRAL_ALLOCATION,
  )
  return withEstablishedExclusiveDiscAllocation(
    context,
    establishedHolders,
    withAstralAllocation,
    MOONLIGHT_ALLOCATION,
  )
}

export function preparePartySelections(
  contexts: readonly PreparationContext[],
  focusAgentId: AgentId,
): SetupSelection[] {
  const partyAgentIds = contexts.map(({ agentId }) => agentId)
  const partyMindscapes = contexts.map(({ mindscape }) => mindscape)
  const balanced = contexts.map((context, index) => withNicolePressureSafePackage(
    context,
    partyAgentIds,
    partyMindscapes,
    withZhuYuanCritBalance(
      context,
      partyAgentIds,
      partyMindscapes,
      index,
      withQualifiedAnbyCritBalance(context, partyAgentIds, index, representativeFor(context)),
    ),
  ))
  const focused = contexts.map((context, index) => withFocusedEngine(
    context,
    focusAgentId,
    balanced[index],
  ))
  const focusKingDirected = withFocusCritKingPriority(contexts, focusAgentId, focused)
  const withKingAllocation = focusKingDirected.map((selection, index) => withCompetitiveKingAstralAllocation(
    contexts[index],
    partyAgentIds,
    holderSnapshots(contexts, focusKingDirected),
    selection,
  ))
  const kingHolders = holderSnapshots(contexts, withKingAllocation)
  const withKingAlternatives = withKingAllocation.map((selection, index) => (
    withKingCollisionAlternative(contexts[index], kingHolders, selection)
  ))
  const withCissiaAstral = withKingAlternatives.map((selection, index) => (
    withCissiaAstralOpportunity(
      contexts[index],
      partyAgentIds,
      kingHolders,
      selection,
      true,
    )
  ))
  const withAstralAllocation = withNonoverlappingExclusiveDiscAllocation(
    contexts,
    withCissiaAstral,
    ASTRAL_ALLOCATION,
  )
  const withoutContextualCollision = withContextualCissiaCollisionResolved(
    contexts,
    withAstralAllocation,
  )
  return withNonoverlappingExclusiveDiscAllocation(
    contexts,
    withoutContextualCollision,
    MOONLIGHT_ALLOCATION,
  )
}
