import { actionTarget, sourceLocalAction } from '../../actions'
import { VERTICAL_VALUES } from '../../content/retained-values'
import type {
  EvaluatedGauge,
  ModifierAtom,
  ProfileStatAtom,
  ProviderRelationship,
} from '../relationships'
import type { SelectedSourceInstance } from '../source-instance'
import type { ComposedStat } from '../stat-composer'

export const JANE_ASSAULT_TARGET = actionTarget([sourceLocalAction('Assault')])
export const JANE_PASSION_TARGET = actionTarget([sourceLocalAction('Passion State')])

export interface JanePassionAssaultDerivation {
  localStat: ProfileStatAtom
  providers: ProviderRelationship[]
  modifiers: ModifierAtom[]
  gauge: EvaluatedGauge
}

/**
 * Jane's one acyclic post-ordinary-delivery derivation. It reads her completed
 * Fully Enabled AP once, emits local Passion ATK plus the Assault-only provider,
 * and never feeds either result back into AP.
 */
export function deriveJanePassionAssault(
  coreSource: SelectedSourceInstance,
  mindscape1Source: SelectedSourceInstance | undefined,
  anomalyProficiency: ComposedStat | undefined,
): JanePassionAssaultDerivation {
  if (coreSource.holderAgentId !== 'jane') {
    throw new Error('Jane Passion and Assault derivation requires Jane\'s Core source')
  }
  if (mindscape1Source && (
    mindscape1Source.holderAgentId !== 'jane'
    || mindscape1Source.appliedPartySlot !== coreSource.appliedPartySlot
  )) {
    throw new Error('Jane M1 derivation requires Jane\'s current holder source')
  }
  if (!anomalyProficiency) {
    throw new Error('Jane Passion and Assault derivation requires completed Anomaly Proficiency')
  }

  const ap = anomalyProficiency.values.fully
  const passionAtk = Math.min(
    Math.max(ap - VERTICAL_VALUES.jane.passionApThreshold, 0)
      * VERTICAL_VALUES.jane.passionAtkPerAp,
    VERTICAL_VALUES.jane.passionAtkCap,
  )
  const assaultCritRate = Math.min(
    VERTICAL_VALUES.jane.assaultCritRateBase
      + VERTICAL_VALUES.jane.assaultCritRatePerAp * ap,
    VERTICAL_VALUES.jane.assaultCritRateCap,
  )
  const sourceDetail = 'Completed Fully Enabled Anomaly Proficiency'

  return {
    localStat: {
      statId: 'atk',
      region: 'flat',
      earliestSurface: 'fully',
      value: passionAtk,
      source: coreSource,
      sourceDetail: 'Passion · completed Fully Enabled AP',
    },
    providers: [
      {
        kind: 'provider',
        source: coreSource,
        delivery: {
          recipient: 'all-party',
          attributes: ['Physical'],
          formulas: ['anomaly_damage'],
        },
        effect: {
          kind: 'modifier',
          metricId: 'critRate',
          earliestSurface: 'fully',
          value: assaultCritRate,
          action: JANE_ASSAULT_TARGET,
          sourceDetail,
        },
      },
      {
        kind: 'provider',
        source: coreSource,
        delivery: {
          recipient: 'all-party',
          attributes: ['Physical'],
          formulas: ['anomaly_damage'],
        },
        effect: {
          kind: 'modifier',
          metricId: 'critDmg',
          earliestSurface: 'fully',
          value: VERTICAL_VALUES.jane.assaultCritDmg,
          action: JANE_ASSAULT_TARGET,
        },
      },
    ],
    modifiers: mindscape1Source ? [
      {
        metricId: 'anomalyBuildupBonus',
        earliestSurface: 'fully',
        value: VERTICAL_VALUES.jane.mindscape1Buildup,
        source: mindscape1Source,
        action: JANE_PASSION_TARGET,
      },
      {
        metricId: 'dmgBonus',
        earliestSurface: 'fully',
        value: Math.min(
          VERTICAL_VALUES.jane.mindscape1DmgPerAp * ap,
          VERTICAL_VALUES.jane.mindscape1DmgCap,
        ),
        source: mindscape1Source,
        action: JANE_PASSION_TARGET,
        sourceDetail,
      },
    ] : [],
    gauge: {
      gaugeId: 'janePassionAssault',
      source: coreSource,
      metricId: 'anomalyProficiency',
      basisLabel: 'Fully Enabled Anomaly Proficiency',
      current: ap,
      threshold: (
        VERTICAL_VALUES.jane.assaultCritRateCap
          - VERTICAL_VALUES.jane.assaultCritRateBase
      ) / VERTICAL_VALUES.jane.assaultCritRatePerAp,
      cap: VERTICAL_VALUES.jane.passionApThreshold
        + VERTICAL_VALUES.jane.passionAtkCap / VERTICAL_VALUES.jane.passionAtkPerAp,
      outputs: [
        {
          label: 'Assault CRIT Rate',
          value: assaultCritRate,
          cap: VERTICAL_VALUES.jane.assaultCritRateCap,
          unit: '%',
        },
        {
          label: 'Passion flat ATK',
          value: passionAtk,
          cap: VERTICAL_VALUES.jane.passionAtkCap,
          unit: '',
        },
      ],
      decimals: {
        current: 0,
        threshold: 0,
        cap: 0,
        output: 2,
        outputCap: 0,
      },
    },
  }
}
