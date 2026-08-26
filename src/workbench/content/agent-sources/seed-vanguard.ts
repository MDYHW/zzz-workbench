import { ADMITTED_AGENTS } from '../agents'
import { initialAtkFor } from '../../calculation/initial-atk'
import type { AgentId } from '../types'
import type { AppliedSlot, WorkbenchState } from '../../state'

export interface SeedVanguardObservation {
  agentId: AgentId
  appliedSlot: AppliedSlot
  initialAtk: number
}

function isAttackAgent(agentId: AgentId): boolean {
  return ADMITTED_AGENTS.find(({ id }) => id === agentId)?.specialty === 'Attack'
}

function selectSeedVanguardCandidate(
  candidates: readonly SeedVanguardObservation[],
): AgentId | null {
  if (candidates.length === 0) return null
  return candidates.reduce((selected, candidate) => (
    candidate.initialAtk > selected.initialAtk
    || (
      candidate.initialAtk === selected.initialAtk
      && candidate.appliedSlot < selected.appliedSlot
    )
      ? candidate
      : selected
  )).agentId
}

export function resolveSeedVanguard(
  observations: readonly SeedVanguardObservation[],
): AgentId | null {
  if (!observations.some(({ agentId }) => agentId === 'seed')) return null
  return selectSeedVanguardCandidate(observations.filter(({ agentId }) => (
    agentId !== 'seed' && isAttackAgent(agentId)
  )))
}

export function resolveSeedVanguardForState(state: WorkbenchState): AgentId | null {
  if (!state.slots.some(({ agentId }) => agentId === 'seed')) return null
  const eligible = state.slots.filter(({ agentId }) => (
    agentId !== 'seed' && isAttackAgent(agentId)
  ))
  if (eligible.length === 0) return null
  if (eligible.length === 1) return eligible[0].agentId

  const observations: SeedVanguardObservation[] = []
  for (const slot of eligible) {
    const initialAtk = initialAtkFor(slot.agentId, slot.setup)
    if (initialAtk === null) return null
    observations.push({
      agentId: slot.agentId,
      appliedSlot: state.slots.indexOf(slot) as AppliedSlot,
      initialAtk,
    })
  }
  return selectSeedVanguardCandidate(observations)
}
