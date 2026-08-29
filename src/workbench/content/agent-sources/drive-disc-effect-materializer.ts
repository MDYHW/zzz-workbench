import type { ProfileRelationship } from '../../calculation/relationships'
import type { SelectedSourceInstance } from '../../calculation/source-instance'
import {
  equipmentEffectBaseValue,
  equipmentEffectMaximumValue,
  type AgentId,
  type EquipmentEffectFact,
} from '../types'
import type { SelectedSetupObservation } from './equipment'
import { materializeEquipmentEffects } from './equipment-effect-materializer'

function effectAmounts(fact: EquipmentEffectFact) {
  const base = equipmentEffectBaseValue(fact)
  const maximum = equipmentEffectMaximumValue(fact)
  const progression = maximum - base
  const baseSurface = fact.earliestSurface
    ?? (fact.progression && !fact.activation ? 'combat' : 'fully')

  if (base && progression && baseSurface === 'fully') {
    return [{ amount: maximum, earliestSurface: 'fully' as const }]
  }
  return [
    ...(base ? [{ amount: base, earliestSurface: baseSurface }] : []),
    ...(progression ? [{ amount: progression, earliestSurface: 'fully' as const }] : []),
  ]
}

export interface SelectedDriveDiscEffectMaterializationContext {
  agentId: AgentId
  partyAgentIds: readonly AgentId[]
  focusAgentId: AgentId
  source: SelectedSourceInstance
  observation?: SelectedSetupObservation
  omitEffectKeys?: ReadonlySet<string>
  includeEffect?: (effectKey: string, fact: EquipmentEffectFact) => boolean
}

/** Materializes ordinary selected 4-piece clauses without Disc identity. */
export function materializeSelectedDriveDiscEffects(
  effects: Readonly<Record<string, EquipmentEffectFact>>,
  context: SelectedDriveDiscEffectMaterializationContext,
): ProfileRelationship[] {
  return materializeEquipmentEffects(effects, {
    ...context,
    amountsForEffect: (_effectKey, fact) => effectAmounts(fact),
  })
}
