import type { AgentId, EngineId } from './types'
import type { W_ENGINE_FACTS } from './engines'

type EngineEffectKey<Engine extends EngineId> = keyof (typeof W_ENGINE_FACTS)[Engine]['effects'] & string
type AgentEngineEffectOverrides = Partial<{
  [Engine in EngineId]: readonly EngineEffectKey<Engine>[]
}>

/** Sparse Agent-local applicability exceptions for source clauses not derivable from shared facts. */
export const AGENT_W_ENGINE_EFFECT_OVERRIDES: Partial<Record<AgentId, AgentEngineEffectOverrides>> = {
  trigger: { restrained: ['daze'] },
  pulchra: { blazingLaurel: ['impact'] },
}

/** Candidate membership is deliberately not consulted: absent override means generic gates decide. */
export function selectedWEngineEffectIsHolderApplicable(
  agentId: AgentId,
  engineId: EngineId,
  effectKey: string,
): boolean {
  const override = AGENT_W_ENGINE_EFFECT_OVERRIDES[agentId]?.[engineId]
  return override === undefined || override.includes(effectKey as never)
}
