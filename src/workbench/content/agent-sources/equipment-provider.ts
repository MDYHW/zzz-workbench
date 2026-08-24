import type {
  DeliveryRule,
  LinearEmission,
  ProviderRelationship,
  ProviderEffect,
  ProviderEffectTemplate,
  ProviderRecipient,
} from '../../calculation/relationships'
import type { SelectedSourceInstance } from '../../calculation/source-instance'
import type { EquipmentEffectFact } from '../types'

type EquipmentDelivery = Omit<DeliveryRule, 'recipient'>
type EquipmentProviderEffect = ProviderEffect extends infer Effect
  ? Effect extends ProviderEffect ? Omit<Effect, 'composition'> : never
  : never
type EquipmentProviderEffectTemplate = ProviderEffectTemplate extends infer Effect
  ? Effect extends ProviderEffectTemplate ? Omit<Effect, 'composition'> : never
  : never

function equipmentRecipient(
  fact: EquipmentEffectFact,
): Exclude<ProviderRecipient, 'other-party'> {
  const recipient = fact.scope?.recipient
  switch (recipient) {
    case 'self':
      return 'self'
    case 'focus':
      return 'focus'
    case 'squad':
      return 'all-party'
    case 'enemy':
      return 'enemy-context'
    case undefined:
      throw new Error('Equipment provider effect requires an exact recipient')
    default:
      return recipient satisfies never
  }
}

function equipmentComposition(
  fact: EquipmentEffectFact,
) {
  return fact.composition === 'highest-only'
    ? { kind: 'highest-only' as const, semanticEffect: fact }
    : undefined
}

function providerEffect(
  fact: EquipmentEffectFact,
  effect: EquipmentProviderEffect,
): ProviderEffect {
  if (effect.kind === 'operation') return effect
  const composition = equipmentComposition(fact)
  return composition ? { ...effect, composition } : effect
}

export function equipmentProviderRelationship(
  source: SelectedSourceInstance,
  fact: EquipmentEffectFact,
  effect: EquipmentProviderEffect,
  delivery: EquipmentDelivery = {},
): ProviderRelationship {
  return {
    kind: 'provider',
    source,
    delivery: { recipient: equipmentRecipient(fact), ...delivery },
    effect: providerEffect(fact, effect),
  }
}

export function equipmentProviderEmission(
  fact: EquipmentEffectFact,
  effect: EquipmentProviderEffectTemplate,
  delivery: EquipmentDelivery = {},
): Extract<LinearEmission, { kind: 'provider' }> {
  if (effect.kind === 'operation') {
    return { kind: 'provider', delivery: { recipient: equipmentRecipient(fact), ...delivery }, effect }
  }
  const composition = equipmentComposition(fact)
  return {
    kind: 'provider',
    delivery: { recipient: equipmentRecipient(fact), ...delivery },
    effect: composition ? { ...effect, composition } : effect,
  }
}
