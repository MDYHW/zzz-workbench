import type { DeliveryRule, ProfileRelationship } from '../../calculation/relationships'
import type { SelectedSourceInstance } from '../../calculation/source-instance'
import type { EffectMetric, SurfaceKey } from '../../effects'
import {
  CRIT_DAMAGE_FORMULAS,
  DEF_DAMAGE_FORMULAS,
  effectAttributeForAgent,
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
import {
  equipmentEffectAppliesInOperatingInterval,
  equipmentEffectCanBeActivatedByHolder,
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

function providerDelivery(fact: EquipmentEffectFact): EquipmentDelivery {
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
    default:
      return {}
  }
}

function baseSurface(fact: EquipmentEffectFact): SurfaceKey {
  if (
    (fact.modifier === 'energy' || fact.modifier === 'energyRegen')
    && fact.unit === '/s'
    && fact.scope?.condition === 'offField'
  ) return 'combat'
  if (
    fact.activation
    || fact.scope?.recipient
    || fact.scope?.actions?.length
    || fact.scope?.anomalyResults?.length
    || fact.scope?.tags?.length
    || fact.scope?.condition
  ) return 'fully'
  return 'combat'
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

function effectAmounts(
  fact: EquipmentEffectFact,
  refinement: Refinement,
): readonly { amount: number; earliestSurface: SurfaceKey }[] {
  const base = equipmentEffectBaseValue(fact, refinement)
  const maximum = equipmentEffectMaximumValue(fact, refinement)
  const progression = maximum - base
  return [
    ...(base ? [{ amount: base, earliestSurface: baseSurface(fact) }] : []),
    ...(progression ? [{ amount: progression, earliestSurface: 'fully' as const }] : []),
  ]
}

export interface SelectedWEngineEffectMaterializationContext {
  agentId: AgentId
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
  const {
    agentId,
    focusAgentId,
    refinement,
    source,
    observation,
    effectIsHolderApplicable,
    omitEffectKeys = new Set<string>(),
    includeEffect = () => true,
  } = context
  const interval = operatingIntervalFor(agentId, focusAgentId)
  const holderAttribute = effectAttributeForAgent(agentId)

  return Object.entries(effects).flatMap(([effectKey, fact]) => {
    if (
      omitEffectKeys.has(effectKey)
      || !includeEffect(effectKey, fact)
      || !effectIsHolderApplicable(effectKey)
      || !equipmentEffectCanBeActivatedByHolder(agentId, fact)
      || !equipmentEffectAppliesInOperatingInterval(fact, interval)
      || requiresExplicitConsumer(fact)
    ) return []

    const recipient = fact.scope?.recipient
    if (
      (recipient === undefined || recipient === 'self')
      && !equipmentEffectAppliesToAttribute(fact, holderAttribute)
    ) return []
    if (!recipient && !hasLocalConsumer(fact, observation)) return []

    return effectAmounts(fact, refinement).flatMap(({ amount, earliestSurface }) => (
      projectEquipmentEffectRelationships({
        source,
        fact,
        amount,
        earliestSurface,
        ...(recipient ? { delivery: providerDelivery(fact) } : {}),
      })
    ))
  })
}
