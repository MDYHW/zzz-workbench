import {
  DEFAULT_APPLIED_AGENT_IDS,
  defaultMindscapeFor,
  isFocusEligible,
  defaultRefinementFor,
  ENGINE_IDS_BY_AGENT_AND_POOL,
  representativeSetupFor,
  PREPARED_SLOT5_MAIN_BY_BROAD_PRE_PEN_PRESSURE,
  W_ENGINES,
  type AgentId,
  type DiscId,
  type EngineId,
  type MainSlot,
  type MainStatId,
  type PoolId,
  type Refinement,
  type SubstatId,
} from './content'
import {
  preparePartySelections,
  prepareTargetSelection,
  type EstablishedDiscHolder,
  type PreparationContext,
} from './preparation'
import {
  effectiveFourPieceIds,
  effectiveMainStatIds,
  effectiveTwoPieceIds,
  effectiveSubstatChoices,
  invalidRequiredSelections,
} from './candidates'
import { activeCandidatePressures } from './provider-effects'

export type Mindscape = 0 | 1 | 2 | 3 | 4 | 5 | 6
export type SubstatCounts = Partial<Record<SubstatId, number>>

export interface AgentSetupState {
  mindscape: Mindscape
  pool: PoolId
  engineId: EngineId | null
  refinement: Refinement | null
  fourPieceId: DiscId | null
  twoPieceId: DiscId | null
  mains: Record<MainSlot, MainStatId | null>
  substats: SubstatCounts
}

export type AppliedSlot = 0 | 1 | 2

export interface AppliedAgentSlot {
  agentId: AgentId
  setup: AgentSetupState
}

export interface WorkbenchState {
  slots: [AppliedAgentSlot, AppliedAgentSlot, AppliedAgentSlot]
  focusSlot: AppliedSlot
  draft?: PartyDraft
}

export interface PartyDraft {
  agentIds: [AgentId, AgentId, AgentId]
  focusSlot: AppliedSlot | null
}

export type WorkbenchAction =
  | { type: 'setMindscape'; slot: AppliedSlot; mindscape: Mindscape }
  | { type: 'switchPool'; slot: AppliedSlot; pool: PoolId }
  | { type: 'selectEngine'; slot: AppliedSlot; engineId: EngineId }
  | { type: 'setRefinement'; slot: AppliedSlot; refinement: Refinement }
  | {
      type: 'selectDisc'
      slot: AppliedSlot
      piece: 'fourPiece' | 'twoPiece'
      discId: DiscId
    }
  | {
      type: 'selectMainStat'
      slot: AppliedSlot
      mainSlot: MainSlot
      mainStatId: MainStatId
    }
  | { type: 'adjustSubstat'; slot: AppliedSlot; key: SubstatId; delta: number }
  | { type: 'setSubstat'; slot: AppliedSlot; key: SubstatId; value: number }
  | { type: 'openPartyEdit' }
  | { type: 'closePartyEdit' }
  | { type: 'replaceDraftAgent'; slot: AppliedSlot; agentId: AgentId }
  | { type: 'setDraftFocus'; slot: AppliedSlot }
  | { type: 'applyPartyEdit' }

function resolvedDraftFocus(agentIds: PartyDraft['agentIds']): AppliedSlot | null {
  const eligible = agentIds.map((agentId, index) => isFocusEligible(agentId) ? index as AppliedSlot : null)
    .filter((slot): slot is AppliedSlot => slot !== null)
  return eligible.length === 1 ? eligible[0] : null
}

function sameEligibleAgents(
  before: PartyDraft['agentIds'],
  after: PartyDraft['agentIds'],
): boolean {
  return before.filter(isFocusEligible).join(',') === after.filter(isFocusEligible).join(',')
}

export function zeroSubstats(
  agentId: AgentId,
  setup: Pick<AgentSetupState, 'fourPieceId'>,
): SubstatCounts {
  return Object.fromEntries(
    effectiveSubstatChoices(agentId, setup).map((choice) => [choice.id, 0]),
  )
}

export function createPreparedAgentSetup(
  agentId: AgentId,
  pool: PoolId = 'full',
  mindscape: Mindscape = defaultMindscapeFor(agentId),
): AgentSetupState {
  return setupStateFromSelection(
    agentId,
    pool,
    mindscape,
    representativeSetupFor(agentId, pool, mindscape),
  )
}

function setupStateFromSelection(
  agentId: AgentId,
  pool: PoolId,
  mindscape: Mindscape,
  selection: { engineId: EngineId; fourPieceId: DiscId; twoPieceId: DiscId; mains: Record<MainSlot, MainStatId> },
): AgentSetupState {
  return {
    mindscape,
    pool,
    engineId: selection.engineId,
    refinement: defaultRefinementFor(W_ENGINES[selection.engineId].rank),
    fourPieceId: selection.fourPieceId,
    twoPieceId: selection.twoPieceId,
    mains: { ...selection.mains },
    substats: zeroSubstats(agentId, selection),
  }
}

function preparationContext(
  agentId: AgentId,
  pool: PoolId,
  mindscape: Mindscape,
): PreparationContext {
  return { agentId, pool, mindscape }
}

function establishedDiscHolders(
  slots: readonly AppliedAgentSlot[],
  targetSlot: AppliedSlot,
): EstablishedDiscHolder[] {
  return slots.flatMap(({ agentId, setup }, index) => index === targetSlot
    ? []
    : [{ agentId, fourPieceId: setup.fourPieceId }])
}

function withPreparedBroadPrePenMain(
  state: WorkbenchState,
  slot: AppliedSlot,
  setup: AgentSetupState,
): AgentSetupState {
  const replacement = PREPARED_SLOT5_MAIN_BY_BROAD_PRE_PEN_PRESSURE[
    state.slots[slot].agentId
  ]
  if (!replacement || setup.mains.slot5 !== 'penRatio') {
    return setup
  }
  const slots = [...state.slots] as WorkbenchState['slots']
  slots[slot] = { ...slots[slot], setup }
  const provisional = { ...state, slots }
  const hasBroadPrePenPressure = activeCandidatePressures(provisional, slot)
    .includes('materialBroadPrePenDefBypass')
  return hasBroadPrePenPressure
    ? { ...setup, mains: { ...setup.mains, slot5: replacement } }
    : setup
}

function withPreparedPartyPressureMains(state: WorkbenchState): WorkbenchState {
  const slots = state.slots.map((current, slotIndex) => ({
    ...current,
    setup: withPreparedBroadPrePenMain(
      state,
      slotIndex as AppliedSlot,
      current.setup,
    ),
  })) as WorkbenchState['slots']
  return { ...state, slots }
}

function createTargetPreparedSetup(
  state: WorkbenchState,
  slot: AppliedSlot,
  pool: PoolId,
  mindscape: Mindscape,
): AgentSetupState {
  const agentId = state.slots[slot].agentId
  const selection = prepareTargetSelection(
    preparationContext(agentId, pool, mindscape),
    state.slots[state.focusSlot].agentId,
    establishedDiscHolders(state.slots, slot),
  )
  return withPreparedBroadPrePenMain(
    state,
    slot,
    setupStateFromSelection(agentId, pool, mindscape, selection),
  )
}

export function createPreparedState(
  pools: Partial<Record<AgentId, PoolId>> = {},
  agentIds: [AgentId, AgentId, AgentId] = DEFAULT_APPLIED_AGENT_IDS,
  focusSlot: AppliedSlot = 0,
): WorkbenchState {
  const contexts = agentIds.map((agentId) => preparationContext(
    agentId,
    pools[agentId] ?? 'full',
    defaultMindscapeFor(agentId),
  )) as [PreparationContext, PreparationContext, PreparationContext]
  const selections = preparePartySelections(contexts, agentIds[focusSlot])
  return withPreparedPartyPressureMains({
    slots: agentIds.map((agentId, index) => ({
      agentId,
      setup: setupStateFromSelection(
        agentId,
        contexts[index].pool,
        contexts[index].mindscape as Mindscape,
        selections[index],
      ),
    })) as WorkbenchState['slots'],
    focusSlot,
  })
}

function clampCount(value: number): number {
  return Math.min(36, Math.max(0, Math.round(value)))
}

function updateSetup(
  state: WorkbenchState,
  slot: AppliedSlot,
  update: (setup: AgentSetupState) => AgentSetupState,
): WorkbenchState {
  const current = state.slots[slot].setup
  const next = update(current)
  if (next === current) return state
  const slots = [...state.slots] as WorkbenchState['slots']
  slots[slot] = { ...slots[slot], setup: next }
  return {
    ...state,
    slots,
  }
}

function reduceWorkbenchState(state: WorkbenchState, action: WorkbenchAction): WorkbenchState {
  switch (action.type) {
    case 'openPartyEdit':
      return state.draft ? state : {
        ...state,
        draft: {
          agentIds: state.slots.map(({ agentId }) => agentId) as PartyDraft['agentIds'],
          focusSlot: state.focusSlot,
        },
      }

    case 'closePartyEdit':
      return state.draft ? { ...state, draft: undefined } : state

    case 'replaceDraftAgent': {
      const draft = state.draft
      if (!draft || draft.agentIds.includes(action.agentId)) return state
      const agentIds = [...draft.agentIds] as PartyDraft['agentIds']
      agentIds[action.slot] = action.agentId
      return {
        ...state,
        draft: {
          ...draft,
          agentIds,
          focusSlot: sameEligibleAgents(draft.agentIds, agentIds)
            ? draft.focusSlot
            : resolvedDraftFocus(agentIds),
        },
      }
    }

    case 'setDraftFocus': {
      const draft = state.draft
      return draft && isFocusEligible(draft.agentIds[action.slot])
        ? { ...state, draft: { ...draft, focusSlot: action.slot } }
        : state
    }

    case 'applyPartyEdit': {
      const draft = state.draft
      if (!draft || draft.focusSlot === null || new Set(draft.agentIds).size !== 3) return state
      const changed = draft.focusSlot !== state.focusSlot
        || draft.agentIds.some((agentId, index) => agentId !== state.slots[index].agentId)
      if (!changed) return state
      const contexts = draft.agentIds.map((agentId) => {
        const existing = state.slots.find((slot) => slot.agentId === agentId)
        return preparationContext(
          agentId,
          existing?.setup.pool ?? 'full',
          existing?.setup.mindscape ?? defaultMindscapeFor(agentId),
        )
      }) as [PreparationContext, PreparationContext, PreparationContext]
      const selections = preparePartySelections(contexts, draft.agentIds[draft.focusSlot])
      const slots = draft.agentIds.map((agentId, index) => ({
        agentId,
        setup: setupStateFromSelection(
          agentId,
          contexts[index].pool,
          contexts[index].mindscape as Mindscape,
          selections[index],
        ),
      })) as WorkbenchState['slots']
      return withPreparedPartyPressureMains({ slots, focusSlot: draft.focusSlot })
    }
    case 'setMindscape': {
      const currentSlot = state.slots[action.slot]
      const current = currentSlot.setup
      if (current.mindscape === action.mindscape) return state
      const slots = [...state.slots] as WorkbenchState['slots']
      slots[action.slot] = {
        ...currentSlot,
        setup: createTargetPreparedSetup(state, action.slot, current.pool, action.mindscape),
      }
      return {
        ...state,
        slots,
      }
    }

    case 'switchPool': {
      const currentSlot = state.slots[action.slot]
      const current = currentSlot.setup
      if (current.pool === action.pool) return state
      const slots = [...state.slots] as WorkbenchState['slots']
      slots[action.slot] = {
        ...currentSlot,
        setup: createTargetPreparedSetup(state, action.slot, action.pool, current.mindscape),
      }
      return {
        ...state,
        slots,
      }
    }

    case 'selectEngine':
      return updateSetup(state, action.slot, (setup) => {
        const agentId = state.slots[action.slot].agentId
        if (!ENGINE_IDS_BY_AGENT_AND_POOL[agentId][setup.pool].includes(action.engineId)) {
          return setup
        }
        return {
          ...setup,
          engineId: action.engineId,
          refinement: defaultRefinementFor(W_ENGINES[action.engineId].rank),
        }
      })

    case 'setRefinement':
      return updateSetup(state, action.slot, (setup) => (
        setup.engineId
          ? { ...setup, refinement: action.refinement }
          : setup
      ))

    case 'selectDisc':
      return updateSetup(state, action.slot, (setup) => {
        const candidates = action.piece === 'fourPiece'
          ? effectiveFourPieceIds(state, action.slot)
          : effectiveTwoPieceIds(state, action.slot)
        if (!candidates.includes(action.discId)) return setup
        if (action.piece === 'twoPiece') {
          if (action.discId === setup.fourPieceId) return setup
          return { ...setup, twoPieceId: action.discId }
        }
        if (action.discId === setup.twoPieceId) {
          if (!setup.fourPieceId || !effectiveTwoPieceIds(state, action.slot).includes(setup.fourPieceId)) {
            return setup
          }
          return { ...setup, fourPieceId: action.discId, twoPieceId: setup.fourPieceId }
        }
        return { ...setup, fourPieceId: action.discId }
      })

    case 'selectMainStat':
      return updateSetup(state, action.slot, (setup) => {
        if (!effectiveMainStatIds(state, action.slot, action.mainSlot)
          .includes(action.mainStatId)) {
          return setup
        }
        return {
          ...setup,
          mains: {
            ...setup.mains,
            [action.mainSlot]: action.mainStatId,
          },
        }
      })

    case 'adjustSubstat':
      return updateSetup(state, action.slot, (setup) => {
        const agentId = state.slots[action.slot].agentId
        if (!effectiveSubstatChoices(agentId, setup).some(({ id }) => id === action.key)) {
          return setup
        }
        return {
          ...setup,
          substats: {
            ...setup.substats,
            [action.key]: clampCount((setup.substats[action.key] ?? 0) + action.delta),
          },
        }
      })

    case 'setSubstat':
      return updateSetup(state, action.slot, (setup) => {
        const agentId = state.slots[action.slot].agentId
        if (!effectiveSubstatChoices(agentId, setup).some(({ id }) => id === action.key)) {
          return setup
        }
        return {
          ...setup,
          substats: {
            ...setup.substats,
            [action.key]: clampCount(action.value),
          },
        }
      })

    default:
      return state
  }
}

function isDraftOnlyAction(action: WorkbenchAction): boolean {
  return action.type === 'openPartyEdit'
    || action.type === 'closePartyEdit'
    || action.type === 'replaceDraftAgent'
    || action.type === 'setDraftFocus'
}

function reconcileEffectiveSelections(state: WorkbenchState): WorkbenchState {
  const invalid = invalidRequiredSelections(state)
  if (!invalid.length) return state

  const slots = [...state.slots] as WorkbenchState['slots']
  for (const slot of [0, 1, 2] as AppliedSlot[]) {
    const slotInvalid = invalid.filter((selection) => selection.slot === slot)
    if (!slotInvalid.length) continue
    const current = state.slots[slot]
    const invalidMainSlots = slotInvalid.flatMap((selection) => (
      selection.kind === 'mainStat' ? [selection.mainSlot] : []
    ))
    const mains = invalidMainSlots.length
      ? {
        ...current.setup.mains,
        ...Object.fromEntries(invalidMainSlots.map((mainSlot) => [mainSlot, null])),
      }
      : current.setup.mains
    const invalidSubstats = slotInvalid.flatMap((selection) => (
      selection.kind === 'substat' ? [selection.substatId] : []
    ))
    const substats = invalidSubstats.length
      ? Object.fromEntries(Object.entries(current.setup.substats)
        .filter(([id]) => !invalidSubstats.includes(id as SubstatId)))
      : current.setup.substats
    slots[slot] = {
      ...current,
      setup: {
        ...current.setup,
        fourPieceId: slotInvalid.some((selection) => (
          selection.kind === 'disc' && selection.piece === 'fourPiece'
        )) ? null : current.setup.fourPieceId,
        twoPieceId: slotInvalid.some((selection) => (
          selection.kind === 'disc' && selection.piece === 'twoPiece'
        )) ? null : current.setup.twoPieceId,
        mains,
        substats,
      },
    }
  }
  return { ...state, slots }
}

export function workbenchReducer(
  state: WorkbenchState,
  action: WorkbenchAction,
): WorkbenchState {
  const next = reduceWorkbenchState(state, action)
  return next === state || isDraftOnlyAction(action)
    ? next
    : reconcileEffectiveSelections(next)
}

export function isCompleteAgentSetup(
  agentId: AgentId,
  setup: AgentSetupState,
): boolean {
  return Boolean(
    setup.engineId
      && setup.refinement
      && setup.fourPieceId
      && setup.twoPieceId
      && setup.fourPieceId !== setup.twoPieceId
      && Object.values(setup.mains).every(Boolean)
      && effectiveSubstatChoices(agentId, setup).every(
        ({ id }) => Number.isFinite(setup.substats[id]),
      ),
  )
}

export function isCompleteWorkbench(state: WorkbenchState): boolean {
  return !invalidRequiredSelections(state).length
    && state.slots.every(({ agentId, setup }) => isCompleteAgentSetup(agentId, setup))
}
