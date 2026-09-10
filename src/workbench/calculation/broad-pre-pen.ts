import type { ProfileRelationship, ProviderRelationship } from './relationships'

export const BROAD_PRE_PEN_PRESSURE = 'materialBroadPrePenDefBypass' as const

/** A no-action DEF relationship can change a recipient's usable PEN axes. */
function isBroadPrePenProvider(
  relationship: ProfileRelationship,
): relationship is ProviderRelationship {
  return relationship.kind === 'provider'
    && relationship.effect.kind === 'modifier'
    && (relationship.effect.metricId === 'defIgnore'
      || relationship.effect.metricId === 'defReduction')
    && !relationship.effect.action
    && Math.abs(relationship.effect.value) > 0.000_001
}

/** Converts a local no-action modifier into its equivalent self delivery. */
function localModifierAsSelfProvider(relationship: Extract<ProfileRelationship, { kind: 'modifier' }>): ProviderRelationship {
  const { atom } = relationship
  return {
    kind: 'provider',
    source: atom.source,
    delivery: { recipient: 'self' },
    ...(relationship.setupPolicy ? { setupPolicy: relationship.setupPolicy } : {}),
    effect: {
      kind: 'modifier',
      metricId: atom.metricId,
      earliestSurface: atom.earliestSurface,
      value: atom.value,
      ...(atom.composition ? { composition: atom.composition } : {}),
      ...(atom.display ? { display: atom.display } : {}),
      ...(atom.sourceDetail ? { sourceDetail: atom.sourceDetail } : {}),
    },
  }
}

export function broadPrePenProviderFor(
  relationship: ProfileRelationship,
): ProviderRelationship | null {
  if (isBroadPrePenProvider(relationship)) return relationship
  if (relationship.kind === 'modifier' && !relationship.atom.action
    && (relationship.atom.metricId === 'defIgnore' || relationship.atom.metricId === 'defReduction')
    && Math.abs(relationship.atom.value) > 0.000_001) {
    return localModifierAsSelfProvider(relationship)
  }
  return null
}
