import {
  type AgentResult,
  type Contribution,
  type PartyResult,
} from './calculate'
import {
  workbenchReducer,
  type Mindscape,
  type WorkbenchState,
} from './state'
import type {
  AgentId,
  DiscId,
  EngineId,
  MainSlot,
  MainStatId,
  Refinement,
  SubstatId,
} from './content'

export function agent(result: PartyResult, id: AgentId): AgentResult {
  const found = result.agents.find((item) => item.agentId === id)
  if (!found) throw new Error(`Missing ${id} Result`)
  return found
}

export function metric(result: AgentResult, id: string) {
  const found = result.metrics.find((item) => item.id === id)
  if (!found) throw new Error(`Missing ${id} metric`)
  return found
}

export function action(result: AgentResult, id: string) {
  const found = result.actionModifiers.find((item) => item.id === id)
  if (!found) throw new Error(`Missing ${id} action`)
  return found
}

export function sourceLabels(items: Contribution[]): string[] {
  return items.map((item) => [item.label, item.detail].filter(Boolean).join(' · '))
}

export function slotOf(
  state: WorkbenchState,
  agentId: AgentId,
): 0 | 1 | 2 {
  const index = state.slots.findIndex((slot) => slot.agentId === agentId)
  if (index < 0) throw new Error(`Missing ${agentId} slot`)
  return index as 0 | 1 | 2
}

export function selectEngine(
  state: WorkbenchState,
  agentId: AgentId,
  engineId: EngineId,
): WorkbenchState {
  return workbenchReducer(state, {
    type: 'selectEngine',
    slot: slotOf(state, agentId),
    engineId,
  })
}

export function setRefinement(
  state: WorkbenchState,
  agentId: AgentId,
  refinement: Refinement,
): WorkbenchState {
  return workbenchReducer(state, {
    type: 'setRefinement',
    slot: slotOf(state, agentId),
    refinement,
  })
}

export function selectDisc(
  state: WorkbenchState,
  agentId: AgentId,
  piece: 'fourPiece' | 'twoPiece',
  discId: DiscId,
): WorkbenchState {
  return workbenchReducer(state, {
    type: 'selectDisc',
    slot: slotOf(state, agentId),
    piece,
    discId,
  })
}

export function selectMain(
  state: WorkbenchState,
  agentId: AgentId,
  slot: MainSlot,
  mainStatId: MainStatId,
): WorkbenchState {
  return workbenchReducer(state, {
    type: 'selectMainStat',
    slot: slotOf(state, agentId),
    mainSlot: slot,
    mainStatId,
  })
}

export function setSubstat(
  state: WorkbenchState,
  agentId: AgentId,
  key: SubstatId,
  value: number,
): WorkbenchState {
  return workbenchReducer(state, {
    type: 'setSubstat',
    slot: slotOf(state, agentId),
    key,
    value,
  })
}

export function withMindscape(
  state: WorkbenchState,
  agentId: AgentId,
  mindscape: Mindscape,
): WorkbenchState {
  const slot = slotOf(state, agentId)
  const slots = [...state.slots] as WorkbenchState['slots']
  slots[slot] = {
    ...slots[slot],
    setup: { ...slots[slot].setup, mindscape },
  }
  return { ...state, slots }
}

export function withSetup(
  state: WorkbenchState,
  agentId: AgentId,
  update: (
    setup: WorkbenchState['slots'][number]['setup'],
  ) => WorkbenchState['slots'][number]['setup'],
): WorkbenchState {
  const slot = slotOf(state, agentId)
  const slots = [...state.slots] as WorkbenchState['slots']
  slots[slot] = { ...slots[slot], setup: update(slots[slot].setup) }
  return { ...state, slots }
}
