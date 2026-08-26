import { actionTarget, canonicalAction, sourceLocalAction, type ActionTarget } from '../../actions'
import { effectAttributeForAgent } from '../../formula-policy'
import type { OperatingInterval } from '../setup-policies'
import type { AgentId, EquipmentEffectFact } from '../types'

/** Derives independent source-stated outcome and tag target groups. */
export function equipmentEffectActionTargets(
  effect: EquipmentEffectFact,
): ActionTarget[] {
  const scope = effect.scope
  const outcomes = [
    ...(scope?.actions ?? []).map(canonicalAction),
    ...(scope?.anomalyResults ?? []).map(sourceLocalAction),
  ]
  const tags = [...(scope?.tags ?? [])]
  return [
    ...(outcomes.length ? [actionTarget(outcomes)] : []),
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

const EQUIPPER_ATTACK_TRIGGER_UNAVAILABLE_IN_PREPARED_INTERVAL = new Set<AgentId>(['sunna'])

/** Resolves holder capability only after the selected equipment fact supplies the trigger meaning. */
export function equipmentEffectCanBeActivatedByHolder(
  agentId: AgentId,
  effect: EquipmentEffectFact,
): boolean {
  if (
    effect.activation?.kind === 'trigger'
    && effect.activation.holderAttributes !== undefined
    && !effect.activation.holderAttributes.includes(effectAttributeForAgent(agentId))
  ) return false
  if (
    effect.activation?.kind === 'trigger'
    && effect.activation.performer === 'equipper'
    && effect.activation.attributes !== undefined
    && !effect.activation.attributes.includes(effectAttributeForAgent(agentId))
  ) return false
  return !(
    effect.activation?.kind === 'trigger'
    && effect.activation.performer === 'equipper'
    && EQUIPPER_ATTACK_TRIGGER_UNAVAILABLE_IN_PREPARED_INTERVAL.has(agentId)
  )
}
