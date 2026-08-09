import {
  DEFAULT_APPLIED_AGENT_IDS,
  isFocusEligible,
  defaultRefinementFor,
  DISC_IDS_BY_AGENT_AND_PIECE,
  ENGINE_IDS_BY_AGENT_AND_POOL,
  preparedSetupFor,
  SUBSTAT_CHOICES_BY_AGENT,
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
  effectiveMainStatIds,
  invalidMainStatSelections,
} from './candidates'

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

export function zeroSubstats(agentId: AgentId): SubstatCounts {
  return Object.fromEntries(
    SUBSTAT_CHOICES_BY_AGENT[agentId].map((choice) => [choice.id, 0]),
  )
}

export function createPreparedAgentSetup(
  agentId: AgentId,
  pool: PoolId = 'full',
  mindscape: Mindscape = 0,
): AgentSetupState {
  const prepared = preparedSetupFor(agentId, pool, mindscape)
  return {
    mindscape,
    pool,
    engineId: prepared.engineId,
    refinement: defaultRefinementFor(W_ENGINES[prepared.engineId].rank),
    fourPieceId: prepared.fourPieceId,
    twoPieceId: prepared.twoPieceId,
    mains: { ...prepared.mains },
    substats: zeroSubstats(agentId),
  }
}

export function createPreparedState(
  pools: Partial<Record<AgentId, PoolId>> = {},
  agentIds: [AgentId, AgentId, AgentId] = DEFAULT_APPLIED_AGENT_IDS,
  focusSlot: AppliedSlot = 0,
): WorkbenchState {
  return {
    slots: agentIds.map((agentId) => ({
      agentId,
      setup: createPreparedAgentSetup(agentId, pools[agentId] ?? 'full', 0),
    })) as WorkbenchState['slots'],
    focusSlot,
  }
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
      const slots = draft.agentIds.map((agentId) => {
        const existing = state.slots.find((slot) => slot.agentId === agentId)
        return {
          agentId,
          setup: createPreparedAgentSetup(agentId, existing?.setup.pool ?? 'full', existing?.setup.mindscape ?? 0),
        }
      }) as WorkbenchState['slots']
      return { slots, focusSlot: draft.focusSlot }
    }
    case 'setMindscape': {
      const currentSlot = state.slots[action.slot]
      const current = currentSlot.setup
      if (current.mindscape === action.mindscape) return state
      const slots = [...state.slots] as WorkbenchState['slots']
      slots[action.slot] = {
        ...currentSlot,
        setup: createPreparedAgentSetup(
          currentSlot.agentId,
          current.pool,
          action.mindscape,
        ),
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
        setup: createPreparedAgentSetup(
          currentSlot.agentId,
          action.pool,
          current.mindscape,
        ),
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
        const agentId = state.slots[action.slot].agentId
        const candidates = DISC_IDS_BY_AGENT_AND_PIECE[agentId][action.piece]
        if (!candidates.includes(action.discId)) return setup
        if (action.piece === 'twoPiece') {
          if (action.discId === setup.fourPieceId) return setup
          return { ...setup, twoPieceId: action.discId }
        }
        if (action.discId === setup.twoPieceId) {
          if (!setup.fourPieceId || !DISC_IDS_BY_AGENT_AND_PIECE[agentId].twoPiece.includes(setup.fourPieceId)) {
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
        if (!SUBSTAT_CHOICES_BY_AGENT[agentId].some(({ id }) => id === action.key)) {
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
        if (!SUBSTAT_CHOICES_BY_AGENT[agentId].some(({ id }) => id === action.key)) {
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

function reconcileEffectiveMainStats(state: WorkbenchState): WorkbenchState {
  const invalid = invalidMainStatSelections(state)
  if (!invalid.length) return state

  const slots = [...state.slots] as WorkbenchState['slots']
  for (const { slot, mainSlot } of invalid) {
    const current = slots[slot]
    slots[slot] = {
      ...current,
      setup: {
        ...current.setup,
        mains: {
          ...current.setup.mains,
          [mainSlot]: null,
        },
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
    : reconcileEffectiveMainStats(next)
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
      && SUBSTAT_CHOICES_BY_AGENT[agentId].every(
        ({ id }) => Number.isFinite(setup.substats[id]),
      ),
  )
}

export function isCompleteWorkbench(state: WorkbenchState): boolean {
  return !invalidMainStatSelections(state).length
    && state.slots.every(({ agentId, setup }) => isCompleteAgentSetup(agentId, setup))
}
