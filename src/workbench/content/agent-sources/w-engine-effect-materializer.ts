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
import { equipmentEffectActionTargets } from './equipment-eligibility'
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

function minimumStatLabel(
  statId: Extract<EquipmentEffectFact['activation'], { kind: 'minimum-stat' }>['statId'],
): string {
  switch (statId) {
    case 'anomalyProficiency': return 'Anomaly Proficiency'
    case 'anomalyMastery': return 'Anomaly Mastery'
    case 'critRate': return 'CRIT Rate'
  }
}

function targetLabel(target: ReturnType<typeof equipmentEffectActionTargets>[number]): string {
  return target.outcomes.map((outcome) => {
    switch (outcome.kind) {
      case 'canonical': return outcome.action
      case 'form': return `${outcome.action}: ${outcome.form}`
      case 'source-local': return outcome.label
    }
  }).join(' & ')
}

function materializeMinimumStatEffect(
  source: SelectedSourceInstance,
  fact: EquipmentEffectFact,
  amount: number,
): ProfileRelationship[] {
  const activation = fact.activation
  if (activation?.kind !== 'minimum-stat') return []
  if (fact.modifier !== 'anomalyDmgBonus') {
    throw new Error(`Unsupported minimum-stat W-Engine modifier: ${fact.modifier}`)
  }
  if (fact.scope?.recipient && fact.scope.recipient !== 'self') {
    throw new Error('A delivered minimum-stat W-Engine effect requires an explicit consumer')
  }
  const actions = equipmentEffectActionTargets(fact)
  if (actions.length !== 1) {
    throw new Error('A minimum-stat W-Engine effect requires exactly one affected outcome')
  }
  const action = actions[0]
  const label = targetLabel(action)
  if (!label) {
    throw new Error('A minimum-stat W-Engine effect requires a named affected outcome')
  }
  return [{
    kind: 'post-delivery-stat-modifier-gauge',
    source,
    basis: { statId: activation.statId, surface: 'fully' },
    basisLabel: `Fully Enabled ${minimumStatLabel(activation.statId)}`,
    basisCap: activation.threshold,
    gaugeMetricId: activation.statId,
    modifierMetricId: fact.modifier,
    action,
    modifierSurface: 'fully',
    output: {
      label: `${label} DMG Bonus`,
      value: {
        kind: 'activation',
        threshold: activation.threshold,
        inactiveValue: 0,
        activeValue: amount,
      },
      unit: fact.unit,
      cap: amount,
    },
    decimals: { current: 0, threshold: 0, cap: 0, output: 1 },
  }]
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
    amountsForEffect: (_effectKey, fact) => effectAmounts(fact, context.refinement),
    includeEffect: (effectKey, fact) => (
      fact.activation?.kind === 'minimum-stat'
      && (
        context.observation === undefined
        || context.observation.baseStats[fact.activation.statId] !== undefined
      )
      && (context.includeEffect?.(effectKey, fact) ?? true)
    ),
    projectEffect: ({ fact, amount }) => materializeMinimumStatEffect(
      context.source,
      fact,
      amount,
    ),
  })
  return [...ordinary, ...thresholds]
}
