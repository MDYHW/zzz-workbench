import { REGULAR_DAMAGE_FORMULAS } from '../../formula-policy'
import { VERTICAL_VALUES } from '../../content'
import { surfaces } from '../composition'
import type { Contribution, ResultMetric } from '../result'
import { resultSourceFor } from '../result'
import {
  linearDerivedOutput,
  type EvaluatedGauge,
  type ProviderRelationship,
} from '../relationships'
import type { SelectedSourceInstance } from '../source-instance'
import type { ComposedStat, StatContribution } from '../stat-composer'

export interface LighterImpactElationInput {
  coreImpactSource: SelectedSourceInstance
  additionalSource: SelectedSourceInstance
  impact: ComposedStat
  active: boolean
  outputMultiplier: number
}

export interface LighterImpactElationDerivation {
  impact: Pick<ResultMetric, 'values' | 'breakdown'>
  gauge?: EvaluatedGauge
  provider?: ProviderRelationship
}

function resultContribution(contribution: StatContribution): Contribution {
  return {
    ...resultSourceFor(contribution.atom.source, contribution.atom.sourceDetail),
    amount: contribution.derivedValue,
    ...(contribution.atom.region === 'percentage'
      ? {
          display: {
            value: contribution.rawValue,
            unit: '%' as const,
            decimals: Number.isInteger(contribution.rawValue) ? 0 : 1,
          },
        }
      : {}),
  }
}

/**
 * Lighter's Core Impact belongs only to empowered Basic 5, but that action's
 * completed Impact is the basis for the current Elation provider. Keeping this
 * named derivation prevents the action-local Core percentage from becoming a
 * generic stat input for unrelated consumers.
 */
export function deriveLighterImpactElation({
  coreImpactSource,
  additionalSource,
  impact,
  active,
  outputMultiplier,
}: LighterImpactElationInput): LighterImpactElationDerivation {
  const baseImpact = impact.contributions.initial
    .filter(({ atom }) => atom.region === 'base')
    .reduce((total, { rawValue }) => total + rawValue, 0)
  const coreImpact = baseImpact * VERTICAL_VALUES.lighter.coreCombatImpact / 100
  const values = surfaces(
    impact.values.initial,
    impact.values.combat,
    impact.values.fully + coreImpact,
  )
  const breakdown = surfaces(
    impact.disclosedContributions.initial.map(resultContribution),
    impact.disclosedContributions.combat.map(resultContribution),
    [
      ...impact.disclosedContributions.fully.map(resultContribution),
      {
        ...resultSourceFor(coreImpactSource, 'Empowered Basic Attack: 5th hit'),
        amount: coreImpact,
        display: {
          value: VERTICAL_VALUES.lighter.coreCombatImpact,
          unit: '%' as const,
          decimals: 0,
        },
      },
    ],
  )
  if (!active) return { impact: { values, breakdown } }

  const output = linearDerivedOutput({
    basisValue: values.fully,
    basisThreshold: VERTICAL_VALUES.lighter.elationBaseImpact,
    basisIncrement: VERTICAL_VALUES.lighter.elationImpactIncrement,
    baseOutput: VERTICAL_VALUES.lighter.elationFireIceDmgAtTwentyStacks
      * outputMultiplier,
    outputIncrement: VERTICAL_VALUES.lighter.elationFireIceDmgPerIncrement
      * outputMultiplier,
    outputCap: VERTICAL_VALUES.lighter.elationFireIceDmgCap * outputMultiplier,
  })
  return {
    impact: { values, breakdown },
    gauge: {
      gaugeId: 'lighterElation',
      source: additionalSource,
      metricId: 'impact',
      basisLabel: 'Fully Enabled Impact',
      current: values.fully,
      threshold: VERTICAL_VALUES.lighter.elationBaseImpact,
      cap: 270,
      outputs: [{
        label: 'Fire/Ice DMG Bonus',
        value: output,
        cap: VERTICAL_VALUES.lighter.elationFireIceDmgCap * outputMultiplier,
        unit: '%',
      }],
    },
    provider: {
      kind: 'provider',
      source: additionalSource,
      delivery: {
        recipient: 'all-party',
        attributes: ['Fire', 'Ice'],
        formulas: REGULAR_DAMAGE_FORMULAS,
      },
      effect: {
        kind: 'modifier',
        metricId: 'dmgBonus',
        earliestSurface: 'fully',
        value: output,
      },
    },
  }
}
