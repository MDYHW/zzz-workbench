import {
  DISC_IDS_BY_AGENT_AND_PIECE,
  defaultRefinementFor,
  ENGINE_IDS_BY_AGENT_AND_POOL,
  MAIN_STAT_IDS_BY_AGENT_AND_SLOT,
  PARTY_AGENTS,
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

export interface WorkbenchState {
  setups: Record<AgentId, AgentSetupState>
}

export type WorkbenchAction =
  | { type: 'setMindscape'; agentId: AgentId; mindscape: Mindscape }
  | { type: 'switchPool'; agentId: AgentId; pool: PoolId }
  | { type: 'selectEngine'; agentId: AgentId; engineId: EngineId }
  | { type: 'setRefinement'; agentId: AgentId; refinement: Refinement }
  | {
      type: 'selectDisc'
      agentId: AgentId
      piece: 'fourPiece' | 'twoPiece'
      discId: DiscId
    }
  | {
      type: 'selectMainStat'
      agentId: AgentId
      slot: MainSlot
      mainStatId: MainStatId
    }
  | { type: 'adjustSubstat'; agentId: AgentId; key: SubstatId; delta: number }
  | { type: 'setSubstat'; agentId: AgentId; key: SubstatId; value: number }

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
): WorkbenchState {
  return {
    setups: Object.fromEntries(
      PARTY_AGENTS.map((agent) => [
        agent.id,
        createPreparedAgentSetup(agent.id, pools[agent.id] ?? 'full'),
      ]),
    ) as Record<AgentId, AgentSetupState>,
  }
}

function clampCount(value: number): number {
  return Math.min(36, Math.max(0, Math.round(value)))
}

function updateSetup(
  state: WorkbenchState,
  agentId: AgentId,
  update: (setup: AgentSetupState) => AgentSetupState,
): WorkbenchState {
  const current = state.setups[agentId]
  const next = update(current)
  if (next === current) return state
  return {
    ...state,
    setups: {
      ...state.setups,
      [agentId]: next,
    },
  }
}

export function workbenchReducer(state: WorkbenchState, action: WorkbenchAction): WorkbenchState {
  switch (action.type) {
    case 'setMindscape': {
      const current = state.setups[action.agentId]
      if (current.mindscape === action.mindscape) return state
      return {
        ...state,
        setups: {
          ...state.setups,
          [action.agentId]: createPreparedAgentSetup(
            action.agentId,
            current.pool,
            action.mindscape,
          ),
        },
      }
    }

    case 'switchPool': {
      const current = state.setups[action.agentId]
      if (current.pool === action.pool) return state
      return {
        ...state,
        setups: {
          ...state.setups,
          [action.agentId]: createPreparedAgentSetup(
            action.agentId,
            action.pool,
            current.mindscape,
          ),
        },
      }
    }

    case 'selectEngine':
      return updateSetup(state, action.agentId, (setup) => {
        if (!ENGINE_IDS_BY_AGENT_AND_POOL[action.agentId][setup.pool].includes(action.engineId)) {
          return setup
        }
        return {
          ...setup,
          engineId: action.engineId,
          refinement: defaultRefinementFor(W_ENGINES[action.engineId].rank),
        }
      })

    case 'setRefinement':
      return updateSetup(state, action.agentId, (setup) => (
        setup.engineId
          ? { ...setup, refinement: action.refinement }
          : setup
      ))

    case 'selectDisc':
      return updateSetup(state, action.agentId, (setup) => {
        const candidates = DISC_IDS_BY_AGENT_AND_PIECE[action.agentId][action.piece]
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
      return updateSetup(state, action.agentId, (setup) => {
        if (!MAIN_STAT_IDS_BY_AGENT_AND_SLOT[action.agentId][action.slot]
          .includes(action.mainStatId)) {
          return setup
        }
        return {
          ...setup,
          mains: {
            ...setup.mains,
            [action.slot]: action.mainStatId,
          },
        }
      })

    case 'adjustSubstat':
      return updateSetup(state, action.agentId, (setup) => {
        if (!SUBSTAT_CHOICES_BY_AGENT[action.agentId].some(({ id }) => id === action.key)) {
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
      return updateSetup(state, action.agentId, (setup) => {
        if (!SUBSTAT_CHOICES_BY_AGENT[action.agentId].some(({ id }) => id === action.key)) {
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
  return PARTY_AGENTS.every((agent) => isCompleteAgentSetup(agent.id, state.setups[agent.id]))
}
