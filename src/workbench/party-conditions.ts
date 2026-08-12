import { ADMITTED_AGENTS, type AgentId } from './content'

function summaryFor(agentId: AgentId) {
  return ADMITTED_AGENTS.find(({ id }) => id === agentId)!
}

/** Exact current party condition for Trigger's Additional Ability. */
export function triggerAdditionalIsActive(
  agentIds: readonly AgentId[],
  triggerIndex: number,
): boolean {
  const triggerId = agentIds[triggerIndex]
  if (triggerId !== 'trigger') return false
  const trigger = summaryFor(triggerId)
  return agentIds.some((agentId, index) => {
    if (index === triggerIndex) return false
    const other = summaryFor(agentId)
    return other.specialty === 'Attack' || other.attribute === trigger.attribute
  })
}
