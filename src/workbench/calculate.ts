import { evaluateProfileParty, type AgentSourceProfile } from './calculation/profile-harness'
import type { PartyResult } from './calculation/result'
import { anomalyProfileFor } from './content/agent-sources/anomaly'
import { attackProfileFor } from './content/agent-sources/attack'
import { providerDefenseProfileFor } from './content/agent-sources/provider-defense'
import { ruptureStunProfileFor } from './content/agent-sources/rupture-stun'
import { isCompleteWorkbench, type WorkbenchState } from './state'

export type { ResultSource, SourceLocus, SurfaceKey } from './effects'
export type {
  ActionModifier,
  AgentResult,
  Contribution,
  GaugeResult,
  PartyResult,
  ResultMetric,
  ResultOperation,
} from './calculation/result'

export interface PartyCalculationContext {
  targetStunDmgMultiplier: number
}

const DEFAULT_CALCULATION_CONTEXT: PartyCalculationContext = {
  targetStunDmgMultiplier: 150,
}

function profileForSlot(
  state: WorkbenchState,
  slot: 0 | 1 | 2,
  calculationContext: PartyCalculationContext,
): AgentSourceProfile {
  const profile = providerDefenseProfileFor(state, slot)
    ?? ruptureStunProfileFor(state, slot)
    ?? attackProfileFor(state, slot, calculationContext)
    ?? anomalyProfileFor(state, slot)
  if (!profile) {
    throw new Error(`No source profile exists for ${state.slots[slot].agentId}`)
  }
  return profile
}

export function calculateParty(
  state: WorkbenchState,
  calculationContext: PartyCalculationContext = DEFAULT_CALCULATION_CONTEXT,
): PartyResult | null {
  if (!isCompleteWorkbench(state)) return null
  const profiles = ([0, 1, 2] as const).map((slot) => (
    profileForSlot(state, slot, calculationContext)
  ))
  return evaluateProfileParty(state, profiles)
}
