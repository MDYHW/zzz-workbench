import type { DeliveryRule, ProfileRelationship } from '../../calculation/relationships'
import type { SelectedSourceInstance } from '../../calculation/source-instance'
import type { SurfaceKey } from '../../effects'
import { equipmentEffectStatMeaning } from '../stat-meanings'
import type { EquipmentEffectFact } from '../types'
import {
  equipmentEffectActionTargets,
} from './equipment-eligibility'
import { equipmentEffectModifierMeaning } from './equipment-effect-relationships'
import { equipmentProviderEmission } from './equipment-provider'
import type { StaticPresentationId } from '../../../presentation'

function minimumStatLabel(statId: Extract<EquipmentEffectFact['activation'], { kind: 'minimum-stat' }>['statId']): string {
  switch (statId) {
    case 'anomalyProficiency': return 'Anomaly Proficiency'
    case 'anomalyMastery': return 'Anomaly Mastery'
    case 'critRate': return 'CRIT Rate'
  }
}

function minimumStatPresentationId(
  surface: 'initial' | 'fully',
  statId: Extract<EquipmentEffectFact['activation'], { kind: 'minimum-stat' }>['statId'],
): StaticPresentationId {
  switch (`${surface}:${statId}`) {
    case 'initial:anomalyProficiency': return 'initial-anomaly-proficiency'
    case 'initial:anomalyMastery': return 'initial-anomaly-mastery'
    case 'initial:critRate': return 'initial-crit-rate'
    case 'fully:anomalyProficiency': return 'fully-anomaly-proficiency'
    case 'fully:anomalyMastery': return 'fully-anomaly-mastery'
    case 'fully:critRate': return 'fully-crit-rate'
    default: throw new Error(`Unsupported minimum-stat presentation: ${surface}:${statId}`)
  }
}

function minimumStatOutputPresentationId(fact: EquipmentEffectFact): StaticPresentationId {
  if (fact.modifier === 'anomalyDmgBonus' && fact.scope?.anomalyResults?.includes('Disorder')) {
    return 'disorder-dmg-bonus'
  }
  if (fact.modifier === 'critDmg') {
    return fact.scope?.recipient === 'squad' ? 'squad-crit-dmg' : 'crit-dmg'
  }
  throw new Error(`Unsupported minimum-stat output presentation: ${fact.modifier}`)
}

function statEffectLabel(fact: EquipmentEffectFact): string {
  switch (fact.modifier) {
    case 'maxHp': return 'Max HP'
    case 'atk': return 'ATK'
    case 'impact': return 'Impact'
    case 'critRate': return 'CRIT Rate'
    case 'critDmg': return 'CRIT DMG'
    case 'energyRegen': return 'Energy Regen'
    case 'penRatio': return 'PEN Ratio'
    case 'anomalyProficiency': return 'Anomaly Proficiency'
    case 'anomalyMastery': return 'Anomaly Mastery'
    default: throw new Error(`Unsupported minimum-stat stat output: ${fact.modifier}`)
  }
}

function targetLabel(fact: EquipmentEffectFact): string {
  return equipmentEffectActionTargets(fact).flatMap((target) => target.outcomes.map((outcome) => {
    switch (outcome.kind) {
      case 'canonical': return outcome.action
      case 'form': return `${outcome.action}: ${outcome.form}`
      case 'source-local': return outcome.label
    }
  })).join(' & ')
}

export function projectMinimumStatEquipmentEffect({
  source,
  fact,
  baseAmount,
  maximumAmount,
  earliestSurface,
  delivery,
}: {
  source: SelectedSourceInstance
  fact: EquipmentEffectFact
  baseAmount: number
  maximumAmount: number
  earliestSurface: SurfaceKey
  delivery: Omit<DeliveryRule, 'recipient'>
}): ProfileRelationship[] {
  const activation = fact.activation
  if (activation?.kind !== 'minimum-stat') return []
  const actions = equipmentEffectActionTargets(fact)

  // Action-local outputs cannot feed the stat graph, so they may safely read
  // the completed Fully Enabled basis after ordinary provider delivery.
  if (actions.length) {
    if (fact.scope?.recipient && fact.scope.recipient !== 'self') throw new Error('A delivered minimum-stat effect requires an explicit consumer')
    if (actions.length !== 1 || !targetLabel(fact)) throw new Error('A minimum-stat effect requires exactly one named affected outcome')
    const modifierMetricId = equipmentEffectModifierMeaning(fact)
    if (modifierMetricId !== 'anomalyDmgBonus') {
      throw new Error(`Unsupported minimum-stat action output: ${fact.modifier}`)
    }
    return [{
      kind: 'post-delivery-stat-modifier-gauge', source,
      basis: { statId: activation.statId, surface: 'fully' },
      basisLabel: `Fully Enabled ${minimumStatLabel(activation.statId)}`,
      basisPresentationId: minimumStatPresentationId('fully', activation.statId),
      basisCap: activation.threshold,
      gaugeMetricId: activation.statId,
      modifierMetricId,
      action: actions[0], modifierSurface: 'fully',
      output: {
        presentationId: minimumStatOutputPresentationId(fact),
        label: `${targetLabel(fact)} DMG Bonus`,
        value: {
          kind: 'activation', threshold: activation.threshold,
          inactiveValue: fact.progression ? baseAmount : 0,
          activeValue: maximumAmount,
        },
        unit: fact.unit, cap: maximumAmount,
      },
      decimals: { current: 0, threshold: 0, cap: 0, output: 1 },
    }]
  }

  // Stat outputs read Initial supply so the threshold cannot feed itself or
  // depend on later party delivery. The ordinary stat vocabulary supplies the
  // emitted stat; an unknown modifier remains an explicit extension stop.
  const stat = equipmentEffectStatMeaning(fact)
  if (!stat) throw new Error(`Unsupported minimum-stat stat output: ${fact.modifier}`)
  const effectLabel = statEffectLabel(fact)
  const label = fact.scope?.recipient === 'squad' ? `Squad ${effectLabel}` : effectLabel
  const providerEffect = {
    kind: 'stat' as const,
    statId: stat.statId,
    region: stat.region,
    earliestSurface,
  }
  const emission = fact.scope?.recipient
    ? equipmentProviderEmission(fact, providerEffect, delivery)
    : {
        kind: 'provider' as const,
        delivery: { recipient: 'self' as const, ...delivery },
        effect: providerEffect,
      }
  return [{
    kind: 'gauge', source,
    basis: { statId: activation.statId, surface: 'initial' },
    basisLabel: `Initial ${minimumStatLabel(activation.statId)}`,
    basisPresentationId: minimumStatPresentationId('initial', activation.statId),
    basisThreshold: activation.threshold, basisCap: activation.threshold,
    metricId: activation.statId,
    outputs: [{
      presentationId: minimumStatOutputPresentationId(fact),
      label, unit: fact.unit, cap: maximumAmount,
      activation: {
        inactiveValue: fact.progression ? baseAmount : 0,
        activeValue: maximumAmount,
      },
      emission,
    }],
  }]
}
