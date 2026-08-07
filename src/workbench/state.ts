import {
  DISC_IDS_BY_AGENT_AND_PIECE,
  DEFAULT_APPLIED_AGENT_IDS,
  defaultRefinementFor,
  ENGINE_IDS_BY_AGENT_AND_POOL,
  MAIN_STAT_IDS_BY_AGENT_AND_SLOT,
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
      setup: createPreparedAgentSetup(agentId, pools[agentId] ?? 'full'),
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

export function workbenchReducer(state: WorkbenchState, action: WorkbenchAction): WorkbenchState {
  switch (action.type) {
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
        if (
          (action.piece === 'fourPiece' && setup.twoPieceId === action.discId)
          || (action.piece === 'twoPiece' && setup.fourPieceId === action.discId)
        ) {
          return setup
        }
        return { ...setup, [`${action.piece}Id`]: action.discId }
      })

    case 'selectMainStat':
      return updateSetup(state, action.slot, (setup) => {
        const agentId = state.slots[action.slot].agentId
        if (!MAIN_STAT_IDS_BY_AGENT_AND_SLOT[agentId][action.mainSlot]
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
  return state.slots.every(({ agentId, setup }) => isCompleteAgentSetup(agentId, setup))
}
