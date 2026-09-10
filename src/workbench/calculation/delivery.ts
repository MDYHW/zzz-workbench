import type { AgentId, AgentSpecialty, FormulaFamily } from '../content/types'
import type { EffectAttribute, EffectMetric, SurfaceKey } from '../effects'
import { formulaScopeAppliesToMetric } from '../formula-policy'
import type {
  HighestOnlyComposition,
  ModifierAtom,
  OperationAtom,
  ProfileStatAtom,
  ProviderEffect,
  ProviderRelationship,
} from './relationships'
import {
  sameSelectedSourceInstance,
  type SelectedSourceInstance,
} from './source-instance'
import type { StatId } from './stat-composer'

export interface DeliveryRecipientContext {
  appliedPartySlot: 0 | 1 | 2
  agentId: AgentId
  specialty: AgentSpecialty
  attribute: EffectAttribute
  formulas: readonly FormulaFamily[]
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

export function providerAppliesToRecipient(
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
          ...(effect.composition ? { composition: effect.composition } : {}),
          ...(effect.display ? { display: effect.display } : {}),
          ...(effect.sourceDetail ? { sourceDetail: effect.sourceDetail } : {}),
          ...(effect.sourceDetailPresentationId
            ? { sourceDetailPresentationId: effect.sourceDetailPresentationId }
            : {}),
          ...(effect.sourceDetailPresentationValues
            ? { sourceDetailPresentationValues: effect.sourceDetailPresentationValues }
            : {}),
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
          ...(effect.composition ? { composition: effect.composition } : {}),
          ...(effect.display ? { display: effect.display } : {}),
          ...(effect.sourceDetail ? { sourceDetail: effect.sourceDetail } : {}),
          ...(effect.sourceDetailPresentationId
            ? { sourceDetailPresentationId: effect.sourceDetailPresentationId }
            : {}),
          ...(effect.sourceDetailPresentationValues
            ? { sourceDetailPresentationValues: effect.sourceDetailPresentationValues }
            : {}),
        },
        provider,
        recipientSlot,
      })
      return
    case 'operation':
      delivered.operations.push({
        atom: {
          ...(effect.presentationId ? { presentationId: effect.presentationId } : {}),
          label: effect.label,
          value: effect.value,
          unit: effect.unit,
          source,
          ...(effect.presentation ? { presentation: effect.presentation } : {}),
          ...(effect.sourceDetail ? { sourceDetail: effect.sourceDetail } : {}),
          ...(effect.sourceDetailPresentationId
            ? { sourceDetailPresentationId: effect.sourceDetailPresentationId }
            : {}),
          ...(effect.sourceDetailPresentationValues
            ? { sourceDetailPresentationValues: effect.sourceDetailPresentationValues }
            : {}),
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
      if (!providerAppliesToRecipient(provider, recipient, focusSlot)) continue
      deliverEffect(provider, recipient.appliedPartySlot, delivered[recipient.appliedPartySlot])
    }
  }
  return delivered
}

export interface HighestOnlyResolvable {
  value: number
  earliestSurface: SurfaceKey
  sourceInstance: SelectedSourceInstance
  composition?: HighestOnlyComposition
}

export interface HighestOnlyResolution<Item extends HighestOnlyResolvable> {
  item: Item
  contributes: boolean
  equalOrigin: boolean
}

/**
 * Applies highest-only composition after recipient and consumer filtering.
 * Equal winners retain every distinct selected origin while contributing once;
 * a duplicate relationship for one selected source instance fails fast.
 */
export function resolveHighestOnly<Item extends HighestOnlyResolvable>(
  items: readonly Item[],
): HighestOnlyResolution<Item>[] {
  const resolved: HighestOnlyResolution<Item>[] = []
  const groups: Array<{
    semanticEffect: object
    earliestSurface: SurfaceKey
    items: Item[]
  }> = []
  for (const item of items) {
    const semanticEffect = item.composition?.semanticEffect
    if (!semanticEffect) continue
    const group = groups.find((candidate) => (
      candidate.semanticEffect === semanticEffect
      && candidate.earliestSurface === item.earliestSurface
    ))
    if (group) group.items.push(item)
    else groups.push({
      semanticEffect,
      earliestSurface: item.earliestSurface,
      items: [item],
    })
  }
  for (const group of groups) {
    group.items.forEach((item, index) => {
      if (group.items.slice(0, index).some((prior) => (
        sameSelectedSourceInstance(prior.sourceInstance, item.sourceInstance)
      ))) {
        throw new Error(
          'Duplicate highest-only relationship for one selected source instance',
        )
      }
    })
  }
  const highest = new Map(groups.map((group) => [
    group,
    Math.max(...group.items.map(({ value }) => value)),
  ]))
  const accepted = new Set<(typeof groups)[number]>()

  for (const item of items) {
    const semanticEffect = item.composition?.semanticEffect
    if (!semanticEffect) {
      resolved.push({ item, contributes: true, equalOrigin: false })
      continue
    }
    const group = groups.find((candidate) => (
      candidate.semanticEffect === semanticEffect
      && candidate.earliestSurface === item.earliestSurface
    ))!
    if (Math.abs(item.value - highest.get(group)!) > 0.000_001) continue
    const equalOrigin = accepted.has(group)
    accepted.add(group)
    resolved.push({ item, contributes: !equalOrigin, equalOrigin })
  }
  return resolved
}
