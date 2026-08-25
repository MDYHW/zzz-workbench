import {
  ADMITTED_AGENTS,
  type AgentId,
  type AgentSpecialty,
  type PartyQualificationGroup,
} from './content'

function summaryFor(agentId: AgentId) {
  return ADMITTED_AGENTS.find(({ id }) => id === agentId)!
}

export function hasRepeatedQuickAssistOpportunity(
  agentIds: readonly AgentId[],
): boolean {
  return agentIds.includes('astraYao')
    || agentIds.includes('panYinhu')
    || agentIds.includes('zhao')
    || agentIds.includes('seth')
}

export function anotherAgentHasSpecialty(
  agentIds: readonly AgentId[],
  providerIndex: number,
  specialties: readonly AgentSpecialty[],
): boolean {
  return agentIds.some((agentId, index) => (
    index !== providerIndex && specialties.includes(summaryFor(agentId).specialty)
  ))
}

export function anotherAgentSharesAttribute(
  agentIds: readonly AgentId[],
  providerIndex: number,
): boolean {
  const provider = summaryFor(agentIds[providerIndex])
  return agentIds.some((agentId, index) => (
    index !== providerIndex && summaryFor(agentId).attribute === provider.attribute
  ))
}

export function anotherAgentSharesFaction(
  agentIds: readonly AgentId[],
  providerIndex: number,
): boolean {
  const provider = summaryFor(agentIds[providerIndex])
  return Boolean(provider.faction) && agentIds.some((agentId, index) => (
    index !== providerIndex && summaryFor(agentId).faction === provider.faction
  ))
}

/** Nangong Yu's Additional Ability: another Anomaly Agent or matching faction. */
export function nangongAdditionalIsActive(
  agentIds: readonly AgentId[],
  nangongIndex: number,
): boolean {
  if (agentIds[nangongIndex] !== 'nangongYu') return false
  return anotherAgentHasSpecialty(agentIds, nangongIndex, ['Anomaly'])
    || anotherAgentSharesFaction(agentIds, nangongIndex)
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

/** Harumasa's Additional Ability: another applied Stun or Anomaly Agent. */
export function harumasaAdditionalIsActive(
  agentIds: readonly AgentId[],
  harumasaIndex: number,
): boolean {
  if (agentIds[harumasaIndex] !== 'harumasa') return false
  return anotherAgentHasSpecialty(agentIds, harumasaIndex, ['Stun', 'Anomaly'])
}

/** Qingyi's Additional Ability: another Attack Agent or matching faction. */
export function qingyiAdditionalIsActive(
  agentIds: readonly AgentId[],
  qingyiIndex: number,
): boolean {
  if (agentIds[qingyiIndex] !== 'qingyi') return false
  const qingyi = summaryFor('qingyi')
  return agentIds.some((agentId, index) => {
    if (index === qingyiIndex) return false
    const other = summaryFor(agentId)
    return other.specialty === 'Attack' || other.faction === qingyi.faction
  })
}

/** Nekomata's Additional Ability: another Support or matching Attribute/faction. */
export function nekomataAdditionalIsActive(
  agentIds: readonly AgentId[],
  nekomataIndex: number,
): boolean {
  if (agentIds[nekomataIndex] !== 'nekomata') return false
  const nekomata = summaryFor('nekomata')
  return agentIds.some((agentId, index) => {
    if (index === nekomataIndex) return false
    const other = summaryFor(agentId)
    return other.specialty === 'Support'
      || other.attribute === nekomata.attribute
      || other.faction === nekomata.faction
  })
}

/** Billy's Additional Ability: another matching Attribute or faction. */
export function billyAdditionalIsActive(
  agentIds: readonly AgentId[],
  billyIndex: number,
): boolean {
  if (agentIds[billyIndex] !== 'billy') return false
  const billy = summaryFor('billy')
  return agentIds.some((agentId, index) => {
    if (index === billyIndex) return false
    const other = summaryFor(agentId)
    return other.attribute === billy.attribute || other.faction === billy.faction
  })
}

/** Piper's Additional Ability: another matching Attribute or faction. */
export function piperAdditionalIsActive(
  agentIds: readonly AgentId[],
  piperIndex: number,
): boolean {
  if (agentIds[piperIndex] !== 'piper') return false
  const piper = summaryFor('piper')
  return agentIds.some((agentId, index) => {
    if (index === piperIndex) return false
    const other = summaryFor(agentId)
    return other.attribute === piper.attribute || other.faction === piper.faction
  })
}

const CAESAR_EVASIVE_ASSIST_AGENTS: readonly AgentId[] = [
  'astraYao', 'billy', 'pulchra', 'zhuYuan',
]

/** Caesar's current Additional Ability: another Defensive Assist or matching faction. */
export function caesarAdditionalIsActive(
  agentIds: readonly AgentId[],
  caesarIndex: number,
): boolean {
  if (agentIds[caesarIndex] !== 'caesar') return false
  const caesar = summaryFor('caesar')
  return agentIds.some((agentId, index) => (
    index !== caesarIndex
      && (
        summaryFor(agentId).faction === caesar.faction
          || !CAESAR_EVASIVE_ASSIST_AGENTS.includes(agentId)
      )
  ))
}

/** Local Qingyi buffer-role opportunity; this does not broaden focused-damage helpers. */
export function qingyiAstralOpportunity(
  agentIds: readonly AgentId[],
  qingyiIndex: number,
): boolean {
  if (agentIds[qingyiIndex] !== 'qingyi') return false
  return agentIds.some((agentId, index) => (
    index !== qingyiIndex && ['nicole', 'astraYao', 'panYinhu', 'zhao'].includes(agentId)
  ))
}
