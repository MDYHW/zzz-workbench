import { evaluateProfileParty } from './calculation/profile-harness'
import type { PartyResult } from './calculation/result'
import { sourceProfileForSlot } from './content/agent-sources/agent-profile-registry'
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

export function calculateParty(
  state: WorkbenchState,
  calculationContext: PartyCalculationContext = DEFAULT_CALCULATION_CONTEXT,
): PartyResult | null {
  if (!isCompleteWorkbench(state)) return null
  const profiles = ([0, 1, 2] as const).map((slot) => (
    sourceProfileForSlot(state, slot, calculationContext)
  ))
  return evaluateProfileParty(state, profiles)
}
