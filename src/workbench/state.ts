import {
  ENGINE_IDS_BY_POOL,
  PREPARED_ENGINE_BY_POOL,
  SUBSTAT_KEYS,
  TARGET_EQUIPMENT,
  W_ENGINES,
  type EngineId,
  type PoolId,
  type SubstatKey,
} from './content'

export type SubstatCounts = Record<SubstatKey, number>

export interface WorkbenchState {
  pool: PoolId
  engineId: EngineId | null
  refinement: 'W1' | 'W5' | null
  equipment: typeof TARGET_EQUIPMENT | null
  substats: SubstatCounts
}

export type WorkbenchAction =
  | { type: 'switchPool'; pool: PoolId }
  | { type: 'selectEngine'; engineId: EngineId }
  | { type: 'adjustSubstat'; key: SubstatKey; delta: number }
  | { type: 'setSubstat'; key: SubstatKey; value: number }

export function zeroSubstats(): SubstatCounts {
  return {
    critRate: 0,
    critDmg: 0,
    hpPct: 0,
    atkPct: 0,
  }
}

export function createPreparedState(pool: PoolId = 'full'): WorkbenchState {
  const engineId = PREPARED_ENGINE_BY_POOL[pool]

  return {
    pool,
    engineId,
    refinement: W_ENGINES[engineId].refinement,
    equipment: TARGET_EQUIPMENT,
    substats: zeroSubstats(),
  }
}

function clampCount(value: number): number {
  return Math.min(36, Math.max(0, Math.round(value)))
}

export function workbenchReducer(state: WorkbenchState, action: WorkbenchAction): WorkbenchState {
  switch (action.type) {
    case 'switchPool':
      if (action.pool === state.pool) return state
      return createPreparedState(action.pool)

    case 'selectEngine': {
      if (!ENGINE_IDS_BY_POOL[state.pool].includes(action.engineId)) return state
      const engine = W_ENGINES[action.engineId]
      return {
        ...state,
        engineId: action.engineId,
        refinement: engine.refinement,
      }
    }

    case 'adjustSubstat':
      return {
        ...state,
        substats: {
          ...state.substats,
          [action.key]: clampCount(state.substats[action.key] + action.delta),
        },
      }

    case 'setSubstat':
      return {
        ...state,
        substats: {
          ...state.substats,
          [action.key]: clampCount(action.value),
        },
      }

    default:
      return state
  }
}

export function hasCompleteSubstats(counts: Partial<SubstatCounts>): counts is SubstatCounts {
  return SUBSTAT_KEYS.every((key) => Number.isFinite(counts[key]))
}
