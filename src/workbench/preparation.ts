import {
  ADMITTED_AGENTS,
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
  const policy = setupPolicyFor(agentId)
  return policy.mainStatIdsBySlot.slot4.includes('critRate')
    && policy.substatChoices.some(({ id }) => id === 'critRate')
}

function canPrepareAstral(agentId: AgentId): boolean {
  return setupPolicyFor(agentId).discIdsByPiece.fourPiece.includes('astralVoice')
}

const CURRENT_KING_TIE_ORDER = ['trigger', 'pulchra', 'koleda', 'lycaon', 'anby'] as const

function winsCurrentKingTie(holderId: AgentId, targetId: AgentId): boolean {
  const holderIndex = CURRENT_KING_TIE_ORDER.indexOf(holderId as (typeof CURRENT_KING_TIE_ORDER)[number])
  const targetIndex = CURRENT_KING_TIE_ORDER.indexOf(targetId as (typeof CURRENT_KING_TIE_ORDER)[number])
  return holderIndex >= 0 && targetIndex >= 0 && holderIndex < targetIndex
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

function canExchangeMoonlightForAstral(agentId: AgentId): boolean {
  const candidates = setupPolicyFor(agentId).discIdsByPiece
  return candidates.fourPiece.includes('astralVoice')
    && candidates.twoPiece.includes('moonlight')
}

function hasStableAuthoredStatDirection(agentId: AgentId): boolean {
  const policy = setupPolicyFor(agentId)
  return policy.substatChoices.length === 0
    && Object.values(policy.mainStatIdsBySlot)
      .every((candidates) => candidates.length === 1)
}

function exchangeMoonlightForAstral(selection: SetupSelection): SetupSelection {
  return { ...selection, fourPieceId: 'astralVoice', twoPieceId: 'moonlight' }
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
    contexts[index].agentId === 'cissia' && selection.fourPieceId === 'astralVoice'
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
  return context.agentId === 'cissia'
    && selection.fourPieceId === 'astralVoice'
    && occupiedEffects.has('astralVoice')
    && occupiedEffects.has('moonlight')
      ? representativeFor(context)
      : selection
}

/**
 * Keep the Support-only package with the least-flexible current holder, then
 * move every legal flexible holder to the non-overlapping Astral package.
 * Exact 2-piece preservation precedes authored stat-direction stability; this
 * is structural preparation policy, not a runtime equipment score.
 */
function withNonoverlappingMoonlightAllocation(
  contexts: readonly PreparationContext[],
  selections: readonly SetupSelection[],
): SetupSelection[] {
  const moonlightHolders = selections.flatMap((selection, index) => (
    selection.fourPieceId === 'moonlight' ? [index] : []
  ))
  if (moonlightHolders.length <= 1) return [...selections]

  const rigid = moonlightHolders.filter((index) => (
    !canExchangeMoonlightForAstral(contexts[index].agentId)
  ))
  const packageSensitive = moonlightHolders.filter((index) => (
    canExchangeMoonlightForAstral(contexts[index].agentId)
    && selections[index].twoPieceId !== 'astralVoice'
  ))
  const stable = moonlightHolders.filter((index) => (
    canExchangeMoonlightForAstral(contexts[index].agentId)
    && selections[index].twoPieceId === 'astralVoice'
    && hasStableAuthoredStatDirection(contexts[index].agentId)
  ))
  const keeper = rigid.length === 1
    ? rigid[0]
    : packageSensitive.length === 1
      ? packageSensitive[0]
      : stable.length === 1
        ? stable[0]
        : null
  if (keeper === null) return [...selections]

  return selections.map((selection, index) => (
    index !== keeper
    && selection.fourPieceId === 'moonlight'
    && canExchangeMoonlightForAstral(contexts[index].agentId)
      ? exchangeMoonlightForAstral(selection)
      : selection
  ))
}

function withEstablishedMoonlightAllocation(
  context: PreparationContext,
  establishedHolders: readonly EstablishedDiscHolder[],
  selection: SetupSelection,
): SetupSelection {
  const anotherMoonlightHolder = establishedHolders.some(({ agentId, fourPieceId }) => (
    agentId !== context.agentId && fourPieceId === 'moonlight'
  ))
  return selection.fourPieceId === 'moonlight'
    && anotherMoonlightHolder
    && canExchangeMoonlightForAstral(context.agentId)
    ? exchangeMoonlightForAstral(selection)
    : selection
}

function withJuFufuSwingFallback(
  context: PreparationContext,
  establishedHolders: readonly EstablishedDiscHolder[],
  selection: SetupSelection,
): SetupSelection {
  const rigidKingHolder = establishedHolders.some(({ agentId, fourPieceId }) => (
    agentId !== context.agentId
    && fourPieceId === 'king'
    && !canPrepareAstral(agentId)
  ))
  if (context.agentId !== 'juFufu' || selection.fourPieceId !== 'king' || !rigidKingHolder) {
    return selection
  }
  return {
    ...selection,
    fourPieceId: 'swingJazz',
    twoPieceId: 'king',
    mains: { ...selection.mains, slot4: 'atkPct' },
  }
}

/** Qingyi's bounded no-Astral fallback beside Dialyn's rigid King package. */
function withQingyiDialynShockstarFallback(
  context: PreparationContext,
  establishedHolders: readonly EstablishedDiscHolder[],
  selection: SetupSelection,
): SetupSelection {
  const dialynKeepsKing = establishedHolders.some(({ agentId, fourPieceId }) => (
    agentId === 'dialyn' && fourPieceId === 'king'
  ))
  if (context.agentId !== 'qingyi' || selection.fourPieceId !== 'king' || !dialynKeepsKing) {
    return selection
  }
  return {
    ...selection,
    fourPieceId: 'shockstar',
    twoPieceId: 'king',
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
  const nonoverlapping = withJuFufuSwingFallback(
    context,
    establishedHolders,
    allocated,
  )
  const qingyiFallback = withQingyiDialynShockstarFallback(
    context,
    establishedHolders,
    nonoverlapping,
  )
  const contextual = withCissiaAstralOpportunity(
    context,
    partyAgentIds,
    establishedHolders,
    qingyiFallback,
  )
  const withoutContextualCollision = withEstablishedContextualCissiaCollisionResolved(
    context,
    establishedHolders,
    contextual,
  )
  const withAstraAllocation = withAstraAstralAllocation(
    context,
    establishedHolders,
    withoutContextualCollision,
  )
  const panAllocated = withPanYinhuAstralAlternative(
    context,
    establishedHolders,
    withAstraAllocation,
  )
  return withEstablishedMoonlightAllocation(context, establishedHolders, panAllocated)
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
  const withJuFufuFallback = withKingAllocation.map((selection, index) => (
    withJuFufuSwingFallback(contexts[index], kingHolders, selection)
  ))
  const withQingyiFallback = withJuFufuFallback.map((selection, index) => (
    withQingyiDialynShockstarFallback(contexts[index], kingHolders, selection)
  ))
  const withCissiaAstral = withQingyiFallback.map((selection, index) => (
    withCissiaAstralOpportunity(contexts[index], partyAgentIds, kingHolders, selection)
  ))
  const holders = holderSnapshots(contexts, withCissiaAstral)
  const withAstraAllocation = withCissiaAstral.map((selection, index) => withAstraAstralAllocation(
    contexts[index],
    holders,
    selection,
  ))
  const astralHolders = holderSnapshots(contexts, withAstraAllocation)
  const withPanAllocation = withAstraAllocation.map((selection, index) => withPanYinhuAstralAlternative(
    contexts[index],
    astralHolders,
    selection,
  ))
  const withoutContextualCollision = withContextualCissiaCollisionResolved(
    contexts,
    withPanAllocation,
  )
  return withNonoverlappingMoonlightAllocation(contexts, withoutContextualCollision)
}
