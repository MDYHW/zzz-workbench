import { actionTarget, canonicalAction, sourceLocalAction, type ActionTarget } from '../../actions'
import { effectAttributeForAgent } from '../../formula-policy'
import { ADMITTED_AGENTS, agentCanPerformOperation } from '../agents'
import type { OperatingInterval } from '../setup-policies'
import type { AgentId, EquipmentEffectFact } from '../types'

/** Derives independent source-stated outcome and tag target groups. */
export function equipmentEffectActionTargets(
  effect: EquipmentEffectFact,
): ActionTarget[] {
  const scope = effect.scope
  const actions = (scope?.actions ?? []).map(canonicalAction)
  const anomalyResults = (scope?.anomalyResults ?? []).map((result) => (
    actionTarget([sourceLocalAction(result)])
  ))
  const conditions = scope?.condition === 'backAttack'
    ? [actionTarget([sourceLocalAction('Back attacks')])]
    : []
  const tags = [...(scope?.tags ?? [])]
  return [
    ...(actions.length ? [actionTarget(actions)] : []),
    ...anomalyResults,
    ...conditions,
    ...(tags.length ? [actionTarget([], tags)] : []),
  ]
}

/** Resolves only the operating-interval conditions retained by equipment facts. */
export function equipmentEffectAppliesInOperatingInterval(
  effect: EquipmentEffectFact,
  interval: OperatingInterval | null,
): boolean {
  if (effect.scope?.condition === 'offField') return interval === 'off-field'
  return !(
    effect.activation?.kind === 'trigger'
    && effect.activation.removedOffField
    && interval === 'off-field'
  )
}

/** Resolves holder, party, and operation capability after the effect supplies its trigger meaning. */
export function equipmentEffectCanBeActivated(
  agentId: AgentId,
  partyAgentIds: readonly AgentId[],
  effect: EquipmentEffectFact,
): boolean {
  const activation = effect.activation
  if (activation?.kind !== 'trigger') return true
  const holder = ADMITTED_AGENTS.find(({ id }) => id === agentId)
  if (
    activation.holderAttributes !== undefined
    && !activation.holderAttributes.includes(effectAttributeForAgent(agentId))
  ) return false
  if (
    activation.holderSpecialties !== undefined
    && (!holder || !activation.holderSpecialties.includes(holder.specialty))
  ) return false
  if (
    activation.performer === 'equipper'
    && activation.attributes !== undefined
    && !activation.attributes.includes(effectAttributeForAgent(agentId))
  ) return false
  if (activation.operation) {
    const operation = activation.operation
    const canPerform = (candidateId: AgentId) => (
      agentCanPerformOperation(candidateId, operation)
    )
    switch (activation.performer) {
      case 'equipper':
        return canPerform(agentId)
      case 'squad-member':
        return partyAgentIds.some(canPerform)
      case 'other-squad-member':
        return partyAgentIds.some((candidateId) => (
          candidateId !== agentId && canPerform(candidateId)
        ))
      default:
        return false
    }
  }
  return true
}
