import {
  ADMITTED_AGENTS,
  type AgentId,
  type PartyQualificationGroup,
} from './content'

function summaryFor(agentId: AgentId) {
  return ADMITTED_AGENTS.find(({ id }) => id === agentId)!
}

export function anotherAgentHasSpecialty(
  agentIds: readonly AgentId[],
  providerIndex: number,
  specialties: readonly string[],
): boolean {
  return agentIds.some((agentId, index) => (
    index !== providerIndex && specialties.includes(summaryFor(agentId).specialty)
  ))
}

/**
 * Consult only an explicitly opted-in game-recognized qualification group.
 * This deliberately does not alter generic display-faction equality.
 */
export function anotherAgentHasQualificationGroup(
  agentIds: readonly AgentId[],
  providerIndex: number,
  group: PartyQualificationGroup,
): boolean {
  return agentIds.some((agentId, index) => (
    index !== providerIndex
      && summaryFor(agentId).partyQualificationGroup === group
  ))
}

/** Exact current party condition for Soldier 11's Additional Ability. */
export function soldier11AdditionalIsActive(
  agentIds: readonly AgentId[],
  soldier11Index: number,
): boolean {
  const soldier11Id = agentIds[soldier11Index]
  if (soldier11Id !== 'soldier11') return false
  return agentIds.some((agentId, index) => (
    index !== soldier11Index && summaryFor(agentId).attribute === 'Fire'
  )) || anotherAgentHasQualificationGroup(
    agentIds,
    soldier11Index,
    'New Eridu Defense Force',
  )
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

/** Exact current party condition for Zhu Yuan's Additional Ability. */
export function zhuYuanAdditionalIsActive(
  agentIds: readonly AgentId[],
  zhuYuanIndex: number,
): boolean {
  const zhuYuanId = agentIds[zhuYuanIndex]
  if (zhuYuanId !== 'zhuYuan') return false
  const zhuYuan = summaryFor(zhuYuanId)
  return agentIds.some((agentId, index) => {
    if (index === zhuYuanIndex) return false
    const other = summaryFor(agentId)
    return other.specialty === 'Support' || other.faction === zhuYuan.faction
  })
}
