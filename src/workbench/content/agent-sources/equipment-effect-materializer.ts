import type { DeliveryRule, ProfileRelationship } from '../../calculation/relationships'
import type { SelectedSourceInstance } from '../../calculation/source-instance'
import type { EffectMetric, SurfaceKey } from '../../effects'
import {
  CRIT_DAMAGE_FORMULAS,
  DEF_DAMAGE_FORMULAS,
  effectAttributeForAgent,
  effectAttributeForPartySlot,
  REGULAR_DAMAGE_FORMULAS,
} from '../../formula-policy'
import { operatingIntervalFor } from '../setup-policies'
import { equipmentEffectStatMeaning } from '../stat-meanings'
import {
  equipmentEffectAppliesToAttribute,
  equipmentEffectBaseValue,
  equipmentEffectMaximumValue,
  type AgentId,
  type EquipmentEffectFact,
  type Refinement,
} from '../types'
import type { SelectedSetupObservation } from './equipment'
import { projectEquipmentEffectRelationships } from './equipment-effect-relationships'
import { projectMinimumStatEquipmentEffect } from './minimum-stat-effect-projector'
import {
  equipmentEffectAppliesInOperatingInterval,
  equipmentEffectCanBeActivated,
} from './equipment-eligibility'

type EquipmentDelivery = Omit<DeliveryRule, 'recipient'>
type ObservedEquipmentModifier = Extract<EffectMetric, EquipmentEffectFact['modifier']>

const EXPLICIT_CONSUMER_MODIFIERS = new Set<EquipmentEffectFact['modifier']>([
  'shieldEffect',
  'damageTakenReduction',
  'energyGenerationRate',
  'guaranteedCrit',
  'defDamage',
])

function requiresExplicitConsumer(fact: EquipmentEffectFact): boolean {
  return EXPLICIT_CONSUMER_MODIFIERS.has(fact.modifier)
    || (fact.modifier === 'energy' && fact.unit !== '/s')
}

function isObservedModifier(
  modifier: EquipmentEffectFact['modifier'],
): modifier is ObservedEquipmentModifier {
  switch (modifier) {
    case 'maxHp':
    case 'atk':
    case 'sheerForce':
    case 'impact':
    case 'critRate':
    case 'critDmg':
    case 'dmgBonus':
    case 'sheerDmgBonus':
    case 'resIgnore':
    case 'dazeBonus':
    case 'energyRegen':
    case 'penRatio':
    case 'defIgnore':
    case 'defReduction':
    case 'anomalyProficiency':
    case 'anomalyMastery':
    case 'anomalyDmgBonus':
    case 'anomalyBuildupBonus':
    case 'anomalyBuildupResReduction':
      return true
    default:
      return false
  }
}

function providerDelivery(
  fact: EquipmentEffectFact,
  holderAttribute: ReturnType<typeof effectAttributeForPartySlot>,
): EquipmentDelivery {
  switch (fact.modifier) {
    case 'dmgBonus':
    case 'resIgnore':
      return { formulas: REGULAR_DAMAGE_FORMULAS }
    case 'critRate':
    case 'critDmg':
      return { formulas: CRIT_DAMAGE_FORMULAS }
    case 'defIgnore':
    case 'defReduction':
      return { formulas: DEF_DAMAGE_FORMULAS }
    case 'dazeBonus':
      return { formulas: ['daze_buildup'] }
    case 'anomalyProficiency':
    case 'anomalyDmgBonus':
      return { formulas: ['anomaly_damage'] }
    case 'anomalyBuildupBonus':
      return { formulas: ['anomaly_buildup'] }
    case 'anomalyBuildupResReduction':
      return { attributes: [holderAttribute], formulas: ['anomaly_buildup'] }
    default:
      return {}
  }
}

function hasLocalConsumer(
  fact: EquipmentEffectFact,
  observation: SelectedSetupObservation | undefined,
): boolean {
  if (!observation) return true
  if (
    (fact.modifier === 'energy' || fact.modifier === 'energyRegen')
    && fact.unit === '/s'
  ) return true
  const stat = equipmentEffectStatMeaning(fact)
  if (stat) return observation.baseStats[stat.statId] !== undefined
  if (
    fact.modifier === 'energy'
    || EXPLICIT_CONSUMER_MODIFIERS.has(fact.modifier)
  ) return false
  return isObservedModifier(fact.modifier)
    && observation.modifierMetrics?.includes(fact.modifier) === true
}

export interface MaterializedEquipmentEffectAmount {
  amount: number
  earliestSurface: SurfaceKey
}

export interface EquipmentEffectMaterializationContext {
  agentId: AgentId
  partyAgentIds: readonly AgentId[]
  focusAgentId: AgentId
  source: SelectedSourceInstance
  refinement?: Refinement
  observation?: SelectedSetupObservation
  amountsForEffect: (
    effectKey: string,
    fact: EquipmentEffectFact,
  ) => readonly MaterializedEquipmentEffectAmount[]
  effectIsHolderApplicable?: (effectKey: string) => boolean
  omitEffectKeys?: ReadonlySet<string>
  includeEffect?: (effectKey: string, fact: EquipmentEffectFact) => boolean
}

/**
 * Applies the common holder, interval, Attribute, recipient, formula, action,
 * and current-consumer joins after one equipment kind resolves its surfaces.
 */
export function materializeEquipmentEffects(
  effects: Readonly<Record<string, EquipmentEffectFact>>,
  context: EquipmentEffectMaterializationContext,
): ProfileRelationship[] {
  const {
    agentId,
    partyAgentIds,
    focusAgentId,
    source,
    refinement,
    observation,
    amountsForEffect,
    effectIsHolderApplicable = () => true,
    omitEffectKeys = new Set<string>(),
    includeEffect = () => true,
  } = context
  const interval = operatingIntervalFor(agentId, focusAgentId)
  const holderAttribute = partyAgentIds.length === 3
    ? effectAttributeForPartySlot(partyAgentIds, source.appliedPartySlot)
    : effectAttributeForAgent(agentId)

  return Object.entries(effects).flatMap(([effectKey, fact]) => {
    if (
      omitEffectKeys.has(effectKey)
      || !includeEffect(effectKey, fact)
      || !effectIsHolderApplicable(effectKey)
      || !equipmentEffectCanBeActivated(
        agentId,
        partyAgentIds,
        fact,
        source.appliedPartySlot,
      )
      || !equipmentEffectAppliesInOperatingInterval(fact, interval)
      || requiresExplicitConsumer(fact)
    ) return []

    const recipient = fact.scope?.recipient
    if (
      (recipient === undefined || recipient === 'self')
      && !equipmentEffectAppliesToAttribute(fact, holderAttribute)
    ) return []
    if (!recipient && !hasLocalConsumer(fact, observation)) return []

    const delivery = providerDelivery(fact, holderAttribute)
    if (fact.activation?.kind === 'minimum-stat') {
      return projectMinimumStatEquipmentEffect({
        source,
        fact,
        baseAmount: equipmentEffectBaseValue(fact, refinement),
        maximumAmount: equipmentEffectMaximumValue(fact, refinement),
        earliestSurface: fact.earliestSurface ?? 'fully',
        delivery,
      })
    }
    return amountsForEffect(effectKey, fact).flatMap(({ amount, earliestSurface }) => (
      projectEquipmentEffectRelationships({
        source,
        fact,
        amount,
        earliestSurface,
        ...(recipient ? { delivery } : {}),
      })
    ))
  })
}
