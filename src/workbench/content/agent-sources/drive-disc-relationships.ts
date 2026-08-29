import type { ProfileRelationship } from '../../calculation/relationships'
import type { SelectedSourceInstance } from '../../calculation/source-instance'
import {
  CRIT_DAMAGE_FORMULAS,
} from '../../formula-policy'
import { DRIVE_DISC_FACTS } from '../discs'
import {
  equipmentEffectBaseValue,
  equipmentEffectMaximumValue,
  type AgentId,
} from '../types'
import {
  type CompleteSelectedSetup, type SelectedSetupObservation,
} from './equipment'
import { materializeSelectedDriveDiscEffects } from './drive-disc-effect-materializer'
import { equipmentProviderEmission } from './equipment-provider'

type Slot = 0 | 1 | 2

export interface SelectedDriveDiscContext {
  agentId: AgentId
  appliedPartySlot: Slot
  setup: CompleteSelectedSetup & { mindscape?: number }
  observation: SelectedSetupObservation
  focusAgentId: AgentId
  partyAgentIds: readonly AgentId[]
  source: SelectedSourceInstance
}

/**
 * Materializes one selected four-piece. Ordinary clauses flow through the
 * shared effect materializer; only derived gauges remain below.
 */
export function selectedDriveDiscRelationships(
  context: SelectedDriveDiscContext,
): ProfileRelationship[] {
  const {
    agentId: agent,
    setup,
    observation,
    focusAgentId,
    partyAgentIds,
    source,
  } = context
  const relationships: ProfileRelationship[] = []
  const omittedEffectKeys = new Set<string>()
  switch (setup.fourPieceId) {
    case 'branchAndBlade': {
      // Minimum-stat input becomes a separately visible derived-output gauge.
      const { critDamage } = DRIVE_DISC_FACTS.branchAndBlade.fourPiece
      omittedEffectKeys.add('critDamage')
      if (critDamage.activation.kind === 'minimum-stat') {
        relationships.push({
          kind: 'gauge', source,
          basis: { statId: 'anomalyMastery', surface: 'initial' },
          basisLabel: 'Initial Anomaly Mastery', basisThreshold: critDamage.activation.threshold,
          basisCap: critDamage.activation.threshold, metricId: 'anomalyMastery',
          outputs: [{
            label: 'CRIT DMG', unit: '%', cap: equipmentEffectBaseValue(critDamage),
            activation: { inactiveValue: 0, activeValue: equipmentEffectBaseValue(critDamage) },
            emission: {
              kind: 'provider',
              delivery: { recipient: 'self', formulas: CRIT_DAMAGE_FORMULAS },
              effect: { kind: 'stat', statId: 'critDmg', region: 'flat', earliestSurface: 'fully' },
            },
          }],
        })
      }
      break
    }
    case 'king': {
      // Initial CRIT Rate selects the squad provider output shown by the gauge.
      const critDamage = DRIVE_DISC_FACTS.king.fourPiece.critDamage
      omittedEffectKeys.add('critDamage')
      const activation = critDamage.activation
      const base = equipmentEffectBaseValue(critDamage)
      const max = equipmentEffectMaximumValue(critDamage)
      relationships.push({
        kind: 'gauge', source,
        basis: { statId: activation.statId, surface: 'initial' },
        basisLabel: 'Initial CRIT Rate',
        basisThreshold: activation.threshold,
        basisCap: activation.threshold,
        metricId: 'critRate',
        outputs: [{
          label: 'Squad CRIT DMG', unit: '%', cap: max,
          activation: { inactiveValue: base, activeValue: max },
          emission: equipmentProviderEmission(
            critDamage,
            { kind: 'stat', statId: 'critDmg', region: 'flat', earliestSurface: 'fully' },
            { formulas: CRIT_DAMAGE_FORMULAS },
          ),
        }],
      })
      break
    }
  }

  return [
    ...materializeSelectedDriveDiscEffects(
      DRIVE_DISC_FACTS[setup.fourPieceId].fourPiece,
      {
        agentId: agent,
        focusAgentId,
        partyAgentIds,
        source,
        observation,
        omitEffectKeys: omittedEffectKeys,
      },
    ),
    ...relationships,
  ]
}
