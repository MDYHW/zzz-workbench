import type { ActionTarget } from '../../actions'
import type {
  DeliveryRule,
  ProfileRelationship,
  ProviderEffect,
} from '../../calculation/relationships'
import type { SelectedSourceInstance } from '../../calculation/source-instance'
import type { EffectMetric, SurfaceKey } from '../../effects'
import { equipmentEffectStatMeaning } from '../stat-meanings'
import type { EquipmentEffectFact } from '../types'
import { equipmentEffectActionTargets } from './equipment-eligibility'
import { equipmentProviderRelationship } from './equipment-provider'

type EquipmentDelivery = Omit<DeliveryRule, 'recipient'>
type ProjectableEffect = Exclude<ProviderEffect, { kind: 'operation' }>

export function equipmentEffectModifierMeaning(fact: EquipmentEffectFact): EffectMetric {
  switch (fact.modifier) {
    case 'energy':
    case 'shieldEffect':
    case 'damageTakenReduction':
    case 'energyGenerationRate':
    case 'guaranteedCrit':
    case 'defDamage':
      throw new Error(`Equipment effect ${fact.modifier} requires an explicit relationship consumer`)
    default:
      return fact.modifier
  }
}

function directRelationship(
  source: SelectedSourceInstance,
  effect: ProjectableEffect,
): ProfileRelationship {
  switch (effect.kind) {
    case 'stat':
      return { kind: 'stat', atom: { ...effect, source } }
    case 'modifier':
      return { kind: 'modifier', atom: { ...effect, source } }
  }
}

export interface EquipmentEffectProjection {
  source: SelectedSourceInstance
  fact: EquipmentEffectFact
  amount: number
  earliestSurface: SurfaceKey
  delivery?: EquipmentDelivery
  /** Overrides source-owned affected actions; null preserves an established broad consumer. */
  action?: ActionTarget | null
  /** Keeps an established Result metric surface instead of composing an ordinary stat. */
  projection?: 'modifier'
  sourceDetail?: string
}

/**
 * Projects one already-applicable equipment effect clause into the common
 * calculation relationship vocabulary. Activation, holder capability, and
 * operating interval remain separate decisions made before this projector.
 */
export function projectEquipmentEffectRelationships({
  source,
  fact,
  amount,
  earliestSurface,
  delivery,
  action,
  projection,
  sourceDetail,
}: EquipmentEffectProjection): ProfileRelationship[] {
  if (!amount) return []

  if (
    (fact.modifier === 'energy' || fact.modifier === 'energyRegen')
    && fact.unit === '/s'
  ) {
    if (fact.scope?.recipient) {
      throw new Error('Automatic Energy equipment effects cannot be delivered as providers')
    }
    if (action) {
      throw new Error('Automatic Energy equipment effects cannot be action-scoped')
    }
    if (earliestSurface === 'initial') {
      throw new Error('Automatic Energy equipment effects require Combat or Fully Enabled')
    }
    return [{
      kind: 'automatic-energy',
      atom: { earliestSurface, value: amount, source },
    }]
  }

  const sourceActions = equipmentEffectActionTargets(fact)
  const actions = action === null
    ? [undefined]
    : action
      ? [action]
      : sourceActions.length
        ? sourceActions
        : [undefined]
  const statMeaning = projection !== 'modifier'
    && actions.length === 1
    && actions[0] === undefined
    ? equipmentEffectStatMeaning(fact)
    : undefined
  const effects: ProjectableEffect[] = statMeaning
    ? [{
        kind: 'stat',
        statId: statMeaning.statId,
        region: statMeaning.region,
        earliestSurface,
        value: amount,
        ...(sourceDetail ? { sourceDetail } : {}),
      }]
    : actions.map((target) => ({
        kind: 'modifier' as const,
        metricId: equipmentEffectModifierMeaning(fact),
        earliestSurface,
        value: amount,
        ...(target ? { action: target } : {}),
        ...(sourceDetail ? { sourceDetail } : {}),
      }))

  return effects.map((effect) => delivery
    ? equipmentProviderRelationship(source, fact, effect, delivery)
    : directRelationship(source, effect))
}
