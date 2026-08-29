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
import { projectMinimumStatEquipmentEffect } from './minimum-stat-effect-projector'

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
  const ordinary = materializeEquipmentEffects(effects, {
    ...context,
    amountsForEffect: (_effectKey, fact) => effectAmounts(fact),
    includeEffect: (effectKey, fact) => (
      fact.activation?.kind !== 'minimum-stat'
      && (context.includeEffect?.(effectKey, fact) ?? true)
    ),
  })
  const thresholds = materializeEquipmentEffects(effects, {
    ...context,
    amountsForEffect: (_effectKey, fact) => fact.activation?.kind === 'minimum-stat'
      ? [{ amount: equipmentEffectMaximumValue(fact), earliestSurface: 'fully' as const }]
      : effectAmounts(fact),
    includeEffect: (effectKey, fact) => (
      fact.activation?.kind === 'minimum-stat'
      && (context.includeEffect?.(effectKey, fact) ?? true)
    ),
    projectEffect: ({ fact }) => projectMinimumStatEquipmentEffect({
      source: context.source,
      fact,
      baseAmount: equipmentEffectBaseValue(fact),
      maximumAmount: equipmentEffectMaximumValue(fact),
    }),
  })
  return [...ordinary, ...thresholds]
}
