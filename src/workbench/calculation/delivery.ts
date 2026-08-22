import type { AgentId, AgentSpecialty, SetupFormulaFamily } from '../content/types'
import type { EffectAttribute, EffectMetric } from '../effects'
import { formulaScopeAppliesToMetric } from '../formula-policy'
import type {
  ModifierAtom,
  NonstackIdentity,
  OperationAtom,
  ProfileStatAtom,
  ProviderEffect,
  ProviderRelationship,
} from './relationships'
import type { StatId } from './stat-composer'

export interface DeliveryRecipientContext {
  appliedPartySlot: 0 | 1 | 2
  agentId: AgentId
  specialty: AgentSpecialty
  attribute: EffectAttribute
  formulas: readonly SetupFormulaFamily[]
  statIds: readonly StatId[]
}

export interface DeliveredAtom<Atom> {
  atom: Atom
  provider: ProviderRelationship
  recipientSlot: 0 | 1 | 2
}

export interface DeliveredProfileEffects {
  statAtoms: DeliveredAtom<ProfileStatAtom>[]
  modifierAtoms: DeliveredAtom<ModifierAtom>[]
  operations: DeliveredAtom<OperationAtom>[]
}

export type DeliveredBySlot = [
  DeliveredProfileEffects,
  DeliveredProfileEffects,
  DeliveredProfileEffects,
]

const emptyDelivered = (): DeliveredProfileEffects => ({
  statAtoms: [], modifierAtoms: [], operations: [],
})

function effectMetric(effect: ProviderEffect): EffectMetric | undefined {
  switch (effect.kind) {
    case 'stat':
      return effect.statId
    case 'modifier':
      return effect.metricId
    case 'operation':
      return undefined
  }
}

function recipientMatches(
  provider: ProviderRelationship,
  recipient: DeliveryRecipientContext,
  focusSlot: 0 | 1 | 2,
): boolean {
  const { delivery } = provider
  const holderSlot = provider.source.appliedPartySlot
  const receives = delivery.recipient === 'all-party'
    || delivery.recipient === 'enemy-context'
    || (delivery.recipient === 'self' && recipient.appliedPartySlot === holderSlot)
    || (delivery.recipient === 'focus' && recipient.appliedPartySlot === focusSlot)
    || (delivery.recipient === 'other-party' && recipient.appliedPartySlot !== holderSlot)
  if (!receives) return false
  if (delivery.eligibleAgentIds && !delivery.eligibleAgentIds.includes(recipient.agentId)) {
    return false
  }
  if (delivery.specialties && !delivery.specialties.includes(recipient.specialty)) return false
  if (delivery.attributes && !delivery.attributes.includes(recipient.attribute)) return false
  if (!delivery.formulas) return true
  if (provider.effect.kind === 'stat' && recipient.statIds.includes(provider.effect.statId)) {
    return true
  }
  const metric = effectMetric(provider.effect)
  return metric
    ? formulaScopeAppliesToMetric(recipient.formulas, delivery.formulas, metric)
    : recipient.formulas.some((formula) => delivery.formulas!.includes(formula))
}

function deliverEffect(
  provider: ProviderRelationship,
  recipientSlot: 0 | 1 | 2,
  delivered: DeliveredProfileEffects,
): void {
  const { effect, source } = provider
  if (Math.abs(effect.value) <= 0.000_001) return
  switch (effect.kind) {
    case 'stat':
      delivered.statAtoms.push({
        atom: {
          statId: effect.statId,
          region: effect.region,
          earliestSurface: effect.earliestSurface,
          value: effect.value,
          source,
          ...(effect.nonstackId ? { nonstackId: effect.nonstackId } : {}),
          ...(effect.display ? { display: effect.display } : {}),
          ...(effect.sourceDetail ? { sourceDetail: effect.sourceDetail } : {}),
        },
        provider,
        recipientSlot,
      })
      return
    case 'modifier':
      delivered.modifierAtoms.push({
        atom: {
          metricId: effect.metricId,
          earliestSurface: effect.earliestSurface,
          value: effect.value,
          source,
          ...(effect.action ? { action: effect.action } : {}),
          ...(effect.nonstackId ? { nonstackId: effect.nonstackId } : {}),
          ...(effect.display ? { display: effect.display } : {}),
          ...(effect.sourceDetail ? { sourceDetail: effect.sourceDetail } : {}),
        },
        provider,
        recipientSlot,
      })
      return
    case 'operation':
      delivered.operations.push({
        atom: {
          operationId: effect.operationId,
          label: effect.label,
          earliestSurface: effect.earliestSurface,
          value: effect.value,
          unit: effect.unit,
          source,
          ...(effect.presentation ? { presentation: effect.presentation } : {}),
          ...(effect.sourceDetail ? { sourceDetail: effect.sourceDetail } : {}),
        },
        provider,
        recipientSlot,
      })
  }
}

/** Resolves source-stated reach and applicability before any non-stacking. */
export function deliverProviderRelationships(
  providers: readonly ProviderRelationship[],
  recipients: readonly DeliveryRecipientContext[],
  focusSlot: 0 | 1 | 2,
): DeliveredBySlot {
  const delivered: DeliveredBySlot = [emptyDelivered(), emptyDelivered(), emptyDelivered()]
  for (const provider of providers) {
    for (const recipient of recipients) {
      if (!recipientMatches(provider, recipient, focusSlot)) continue
      deliverEffect(provider, recipient.appliedPartySlot, delivered[recipient.appliedPartySlot])
    }
  }
  return delivered
}

export interface NonstackResolvable {
  value: number
  nonstackId?: NonstackIdentity
}

export interface NonstackResolution<Item extends NonstackResolvable> {
  item: Item
  contributes: boolean
  equalOrigin: boolean
}

/**
 * Applies one explicit highest-only identity after recipient and consumer
 * filtering. Equal winners retain every origin while contributing once.
 */
export function resolveHighestNonstack<Item extends NonstackResolvable>(
  items: readonly Item[],
): NonstackResolution<Item>[] {
  const resolved: NonstackResolution<Item>[] = []
  const identities = [...new Set(items.flatMap(
    (item) => item.nonstackId ? [item.nonstackId] : [],
  ))]
  const highest = new Map(identities.map((identity) => [
    identity,
    Math.max(...items.filter(({ nonstackId }) => nonstackId === identity)
      .map(({ value }) => value)),
  ]))
  const accepted = new Set<NonstackIdentity>()

  for (const item of items) {
    if (!item.nonstackId) {
      resolved.push({ item, contributes: true, equalOrigin: false })
      continue
    }
    if (Math.abs(item.value - highest.get(item.nonstackId)!) > 0.000_001) continue
    const equalOrigin = accepted.has(item.nonstackId)
    accepted.add(item.nonstackId)
    resolved.push({ item, contributes: !equalOrigin, equalOrigin })
  }
  return resolved
}
