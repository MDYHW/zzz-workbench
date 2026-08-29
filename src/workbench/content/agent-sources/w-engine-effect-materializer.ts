import type { ProfileRelationship } from '../../calculation/relationships'
import type { SelectedSourceInstance } from '../../calculation/source-instance'
import type { SurfaceKey } from '../../effects'
import {
  equipmentEffectBaseValue,
  equipmentEffectMaximumValue,
  equipmentEffectProgressionIncrementValue,
  type AgentId,
  type EquipmentEffectFact,
  type Refinement,
} from '../types'
import type { SelectedSetupObservation } from './equipment'
import { projectMinimumStatEquipmentEffect } from './minimum-stat-effect-projector'
import { materializeEquipmentEffects } from './equipment-effect-materializer'

function baseSurface(fact: EquipmentEffectFact): SurfaceKey {
  if (fact.earliestSurface) return fact.earliestSurface
  if (
    (fact.modifier === 'energy' || fact.modifier === 'energyRegen')
    && fact.unit === '/s'
    && fact.scope?.condition === 'offField'
  ) return 'combat'
  if (
    fact.activation
    || fact.scope?.condition
  ) return 'fully'
  return 'combat'
}

function effectAmounts(
  fact: EquipmentEffectFact,
  refinement: Refinement,
): readonly { amount: number; earliestSurface: SurfaceKey }[] {
  const base = equipmentEffectBaseValue(fact, refinement)
  const maximum = equipmentEffectMaximumValue(fact, refinement)
  if (
    !base
    && fact.progression?.kind === 'stacks'
    && fact.activation?.kind === 'trigger'
    && fact.activation.fieldEntry
  ) {
    const entryStack = equipmentEffectProgressionIncrementValue(fact, refinement)
    const postEntryStacks = maximum - entryStack
    return [
      ...(entryStack ? [{ amount: entryStack, earliestSurface: 'combat' as const }] : []),
      ...(postEntryStacks ? [{ amount: postEntryStacks, earliestSurface: 'fully' as const }] : []),
    ]
  }
  const progression = maximum - base
  return [
    ...(base ? [{ amount: base, earliestSurface: baseSurface(fact) }] : []),
    ...(progression ? [{ amount: progression, earliestSurface: 'fully' as const }] : []),
  ]
}

function minimumStatEffectAmounts(
  fact: EquipmentEffectFact,
  refinement: Refinement,
): readonly { amount: number; earliestSurface: SurfaceKey }[] {
  const amount = equipmentEffectMaximumValue(fact, refinement)
  return amount ? [{ amount, earliestSurface: 'fully' }] : []
}

export interface SelectedWEngineEffectMaterializationContext {
  agentId: AgentId
  partyAgentIds: readonly AgentId[]
  focusAgentId: AgentId
  refinement: Refinement
  source: SelectedSourceInstance
  observation?: SelectedSetupObservation
  effectIsHolderApplicable: (effectKey: string) => boolean
  omitEffectKeys?: ReadonlySet<string>
  includeEffect?: (effectKey: string, fact: EquipmentEffectFact) => boolean
}

/**
 * Materializes ordinary source-owned W-Engine clauses without consulting the
 * W-Engine identity. Item-specific code is reserved for clauses whose current
 * consumer is a genuinely distinct operation or whose source relationship is
 * not yet expressible by the shared fact grammar.
 */
export function materializeSelectedWEngineEffects(
  effects: Readonly<Record<string, EquipmentEffectFact>>,
  context: SelectedWEngineEffectMaterializationContext,
): ProfileRelationship[] {
  const ordinary = materializeEquipmentEffects(effects, {
    ...context,
    amountsForEffect: (_effectKey, fact) => effectAmounts(fact, context.refinement),
    includeEffect: (effectKey, fact) => (
      fact.activation?.kind !== 'minimum-stat'
      && (context.includeEffect?.(effectKey, fact) ?? true)
    ),
  })
  const thresholds = materializeEquipmentEffects(effects, {
    ...context,
    amountsForEffect: (_effectKey, fact) => minimumStatEffectAmounts(fact, context.refinement),
    includeEffect: (effectKey, fact) => (
      fact.activation?.kind === 'minimum-stat'
      && (
        context.observation === undefined
        || context.observation.baseStats[fact.activation.statId] !== undefined
      )
      && (context.includeEffect?.(effectKey, fact) ?? true)
    ),
    projectEffect: ({ fact }) => projectMinimumStatEquipmentEffect({
      source: context.source,
      fact,
      baseAmount: equipmentEffectBaseValue(fact, context.refinement),
      maximumAmount: equipmentEffectMaximumValue(fact, context.refinement),
    }),
  })
  return [...ordinary, ...thresholds]
}
