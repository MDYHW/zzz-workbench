import {
  ATTRIBUTE_ANOMALY_TARGET,
  BASIC_AFTERSHOCK_TARGET,
  DISORDER_TARGET,
  actionTarget,
  canonicalAction,
  type ActionTarget,
} from '../../actions'
import type { ProfileRelationship } from '../../calculation/relationships'
import type { SelectedSourceInstance } from '../../calculation/source-instance'
import type { SurfaceKey } from '../../effects'
import {
  CRIT_DAMAGE_FORMULAS,
  effectAttributeForAgent,
  REGULAR_DAMAGE_FORMULAS,
} from '../../formula-policy'
import { DRIVE_DISC_FACTS } from '../discs'
import {
  equipmentEffectBaseValue,
  equipmentEffectMaximumValue,
  equipmentEffectProgressionIncrementValue,
  type AgentId,
  type EquipmentEffectFact,
} from '../types'
import {
  type CompleteSelectedSetup, type SelectedSetupObservation,
} from './equipment'
import { projectEquipmentEffectRelationships } from './equipment-effect-relationships'
import { equipmentProviderEmission } from './equipment-provider'

type Slot = 0 | 1 | 2

export interface SelectedDriveDiscContext {
  agentId: AgentId
  appliedPartySlot: Slot
  setup: CompleteSelectedSetup & { mindscape?: number }
  observation: SelectedSetupObservation
  source: SelectedSourceInstance
}

const target = (...actions: Parameters<typeof canonicalAction>[0][]) => (
  actionTarget(actions.map(canonicalAction))
)
const BASIC = target('Basic Attack')
const ULT = target('Ultimate')
const EX_ASSIST = target('EX Special Attack', 'Assist')
const BASIC_DASH_DODGE = target('Basic Attack', 'Dash Attack', 'Dodge Counter')

function stat(
  source: SelectedSourceInstance,
  fact: EquipmentEffectFact,
  value: number,
  earliestSurface: SurfaceKey = 'fully',
): ProfileRelationship {
  const relationships = projectEquipmentEffectRelationships({
    source, fact, amount: value, earliestSurface,
  })
  if (relationships.length !== 1 || relationships[0].kind !== 'stat') {
    throw new Error(`Expected one stat relationship for ${fact.modifier}`)
  }
  return relationships[0]
}

function modifier(
  source: SelectedSourceInstance,
  fact: EquipmentEffectFact,
  value: number,
  action?: ActionTarget,
  earliestSurface: SurfaceKey = 'fully',
): ProfileRelationship {
  const relationships = projectEquipmentEffectRelationships({
    source,
    fact,
    amount: value,
    earliestSurface,
    action: action ?? null,
    projection: 'modifier',
  })
  if (relationships.length !== 1 || relationships[0].kind !== 'modifier') {
    throw new Error(`Expected one modifier relationship for ${fact.modifier}`)
  }
  return relationships[0]
}

function providerDamage(
  source: SelectedSourceInstance,
  fact: EquipmentEffectFact,
  value: number,
): ProfileRelationship {
  const relationships = projectEquipmentEffectRelationships({
    source,
    fact,
    amount: value,
    earliestSurface: 'fully',
    delivery: { formulas: REGULAR_DAMAGE_FORMULAS },
  })
  if (relationships.length !== 1 || relationships[0].kind !== 'provider') {
    throw new Error(`Expected one provider relationship for ${fact.modifier}`)
  }
  return relationships[0]
}

/**
 * Materializes the selected four-piece and the action-scoped two-piece effects
 * that cannot be represented as ordinary Initial setup inputs.
 */
export function selectedDriveDiscRelationships(
  context: SelectedDriveDiscContext,
): ProfileRelationship[] {
  const { agentId: agent, setup, observation, source } = context
  const relationships: ProfileRelationship[] = []
  switch (setup.fourPieceId) {
    case 'branchAndBlade': {
      const { critDamage, critRate } = DRIVE_DISC_FACTS.branchAndBlade.fourPiece
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
      relationships.push(stat(source, critRate, equipmentEffectBaseValue(critRate)))
      break
    }
    case 'swingJazz':
      relationships.push(providerDamage(source, DRIVE_DISC_FACTS.swingJazz.fourPiece.damage, equipmentEffectBaseValue(DRIVE_DISC_FACTS.swingJazz.fourPiece.damage)))
      break
    case 'moonlight':
      relationships.push(providerDamage(source, DRIVE_DISC_FACTS.moonlight.fourPiece.damage, equipmentEffectBaseValue(DRIVE_DISC_FACTS.moonlight.fourPiece.damage)))
      break
    case 'astralVoice':
      relationships.push(providerDamage(source, DRIVE_DISC_FACTS.astralVoice.fourPiece.damage, equipmentEffectBaseValue(DRIVE_DISC_FACTS.astralVoice.fourPiece.damage)))
      break
    case 'bunnyInWonderland':
      relationships.push(providerDamage(source, DRIVE_DISC_FACTS.bunnyInWonderland.fourPiece.damage, equipmentEffectMaximumValue(DRIVE_DISC_FACTS.bunnyInWonderland.fourPiece.damage)))
      break
    case 'dawnsBloom':
      relationships.push(
        modifier(source, DRIVE_DISC_FACTS.dawnsBloom.fourPiece.damage, equipmentEffectBaseValue(DRIVE_DISC_FACTS.dawnsBloom.fourPiece.damage), BASIC, 'combat'),
        modifier(source, DRIVE_DISC_FACTS.dawnsBloom.fourPiece.damage, equipmentEffectProgressionIncrementValue(DRIVE_DISC_FACTS.dawnsBloom.fourPiece.damage), BASIC),
      )
      break
    case 'woodpecker':
      if (observation.baseStats.atk !== undefined) relationships.push(stat(
        source,
        DRIVE_DISC_FACTS.woodpecker.fourPiece.atk,
        agent === 'seed'
          ? equipmentEffectMaximumValue(DRIVE_DISC_FACTS.woodpecker.fourPiece.atk)
          : equipmentEffectBaseValue(DRIVE_DISC_FACTS.woodpecker.fourPiece.atk),
        agent === 'ellen' ? 'combat' : 'fully',
      ))
      break
    case 'hormonePunk':
      relationships.push(stat(source, DRIVE_DISC_FACTS.hormonePunk.fourPiece.atk, equipmentEffectBaseValue(DRIVE_DISC_FACTS.hormonePunk.fourPiece.atk), 'combat'))
      break
    case 'thunderMetal':
      if (observation.baseStats.atk !== undefined) relationships.push(stat(source, DRIVE_DISC_FACTS.thunderMetal.fourPiece.atk, equipmentEffectBaseValue(DRIVE_DISC_FACTS.thunderMetal.fourPiece.atk)))
      break
    case 'pufferElectro':
      if (observation.baseStats.atk !== undefined) relationships.push(stat(source, DRIVE_DISC_FACTS.pufferElectro.fourPiece.atk, equipmentEffectBaseValue(DRIVE_DISC_FACTS.pufferElectro.fourPiece.atk)))
      relationships.push(modifier(source, DRIVE_DISC_FACTS.pufferElectro.fourPiece.damage, equipmentEffectBaseValue(DRIVE_DISC_FACTS.pufferElectro.fourPiece.damage), ULT, 'initial'))
      break
    case 'chaoticMetal':
      relationships.push(modifier(source, DRIVE_DISC_FACTS.chaoticMetal.fourPiece.critDamage, equipmentEffectMaximumValue(DRIVE_DISC_FACTS.chaoticMetal.fourPiece.critDamage)))
      break
    case 'shadowHarmony':
      relationships.push(
        stat(source, DRIVE_DISC_FACTS.shadowHarmony.fourPiece.atk, equipmentEffectBaseValue(DRIVE_DISC_FACTS.shadowHarmony.fourPiece.atk)),
        modifier(source, DRIVE_DISC_FACTS.shadowHarmony.fourPiece.critRate, equipmentEffectBaseValue(DRIVE_DISC_FACTS.shadowHarmony.fourPiece.critRate)),
      )
      break
    case 'whiteWaterBallad':
      relationships.push(
        modifier(source, DRIVE_DISC_FACTS.whiteWaterBallad.fourPiece.veilCritRate, equipmentEffectBaseValue(DRIVE_DISC_FACTS.whiteWaterBallad.fourPiece.veilCritRate) + equipmentEffectBaseValue(DRIVE_DISC_FACTS.whiteWaterBallad.fourPiece.attackVeilCritRate)),
        stat(source, DRIVE_DISC_FACTS.whiteWaterBallad.fourPiece.attackVeilAtk, equipmentEffectBaseValue(DRIVE_DISC_FACTS.whiteWaterBallad.fourPiece.attackVeilAtk)),
      )
      break
    case 'chaosJazz':
      relationships.push(modifier(source, DRIVE_DISC_FACTS.chaosJazz.fourPiece.electricFireDamage, equipmentEffectBaseValue(DRIVE_DISC_FACTS.chaosJazz.fourPiece.electricFireDamage), undefined, 'combat'))
      if (agent === 'burnice') relationships.push(modifier(source, DRIVE_DISC_FACTS.chaosJazz.fourPiece.offFieldActionDamage, equipmentEffectBaseValue(DRIVE_DISC_FACTS.chaosJazz.fourPiece.offFieldActionDamage), EX_ASSIST))
      if (agent === 'yanagi') relationships.push(modifier(source, DRIVE_DISC_FACTS.chaosJazz.fourPiece.offFieldActionDamage, equipmentEffectBaseValue(DRIVE_DISC_FACTS.chaosJazz.fourPiece.offFieldActionDamage), EX_ASSIST))
      break
    case 'freedomBlues':
      relationships.push(...projectEquipmentEffectRelationships({
        source,
        fact: DRIVE_DISC_FACTS.freedomBlues.fourPiece.buildupResReduction,
        amount: equipmentEffectBaseValue(
          DRIVE_DISC_FACTS.freedomBlues.fourPiece.buildupResReduction,
        ),
        earliestSurface: 'fully',
        delivery: {
          attributes: [effectAttributeForAgent(agent)],
          formulas: ['anomaly_buildup'],
        },
      }))
      break
    case 'fangedMetal':
      relationships.push(modifier(source, DRIVE_DISC_FACTS.fangedMetal.fourPiece.assaultDamage, equipmentEffectBaseValue(DRIVE_DISC_FACTS.fangedMetal.fourPiece.assaultDamage)))
      break
    case 'phaethonsMelody':
      relationships.push(stat(source, DRIVE_DISC_FACTS.phaethonsMelody.fourPiece.anomalyProficiency, equipmentEffectBaseValue(DRIVE_DISC_FACTS.phaethonsMelody.fourPiece.anomalyProficiency)))
      if (effectAttributeForAgent(agent) === 'Ether') relationships.push(modifier(source, DRIVE_DISC_FACTS.phaethonsMelody.fourPiece.otherHolderEtherDamage, equipmentEffectBaseValue(DRIVE_DISC_FACTS.phaethonsMelody.fourPiece.otherHolderEtherDamage)))
      break
    case 'shiningAria':
      relationships.push(
        stat(source, DRIVE_DISC_FACTS.shiningAria.fourPiece.anomalyProficiency, equipmentEffectBaseValue(DRIVE_DISC_FACTS.shiningAria.fourPiece.anomalyProficiency)),
        modifier(source, DRIVE_DISC_FACTS.shiningAria.fourPiece.stunnedTargetDamage, equipmentEffectBaseValue(DRIVE_DISC_FACTS.shiningAria.fourPiece.stunnedTargetDamage)),
      )
      break
    case 'notesFromTheChained':
      relationships.push(
        stat(source, DRIVE_DISC_FACTS.notesFromTheChained.fourPiece.anomalyProficiency, equipmentEffectBaseValue(DRIVE_DISC_FACTS.notesFromTheChained.fourPiece.anomalyProficiency)),
        ...projectEquipmentEffectRelationships({
          source,
          fact: DRIVE_DISC_FACTS.notesFromTheChained.fourPiece.squadAnomalyDamage,
          amount: equipmentEffectBaseValue(
            DRIVE_DISC_FACTS.notesFromTheChained.fourPiece.squadAnomalyDamage,
          ),
          earliestSurface: 'fully',
          action: ATTRIBUTE_ANOMALY_TARGET,
          delivery: { formulas: ['anomaly_damage'] },
        }),
        ...projectEquipmentEffectRelationships({
          source,
          fact: DRIVE_DISC_FACTS.notesFromTheChained.fourPiece.squadAnomalyDamage,
          amount: equipmentEffectBaseValue(
            DRIVE_DISC_FACTS.notesFromTheChained.fourPiece.squadAnomalyDamage,
          ),
          earliestSurface: 'fully',
          action: DISORDER_TARGET,
          delivery: { formulas: ['anomaly_damage'] },
        }),
      )
      break
    case 'yunkui':
      relationships.push(
        modifier(source, DRIVE_DISC_FACTS.yunkui.fourPiece.critRate, equipmentEffectBaseValue(DRIVE_DISC_FACTS.yunkui.fourPiece.critRate)),
        modifier(source, DRIVE_DISC_FACTS.yunkui.fourPiece.sheerDamage, equipmentEffectBaseValue(DRIVE_DISC_FACTS.yunkui.fourPiece.sheerDamage)),
      )
      break
    case 'king': {
      const critDamage = DRIVE_DISC_FACTS.king.fourPiece.critDamage
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
    case 'shockstar': {
      const shockstarTarget = agent === 'trigger'
        ? BASIC_AFTERSHOCK_TARGET
        : ['lycaon', 'lighter', 'koleda'].includes(agent)
          ? BASIC_DASH_DODGE
          : ['qingyi', 'anby'].includes(agent)
            ? BASIC
            : undefined
      if (shockstarTarget) relationships.push(modifier(source, DRIVE_DISC_FACTS.shockstar.fourPiece.daze, equipmentEffectBaseValue(DRIVE_DISC_FACTS.shockstar.fourPiece.daze), shockstarTarget))
      if (agent === 'anby') relationships.push(modifier(source, DRIVE_DISC_FACTS.shockstar.fourPiece.daze, equipmentEffectBaseValue(DRIVE_DISC_FACTS.shockstar.fourPiece.daze), target('Dash Attack', 'Dodge Counter')))
      break
    }
  }

  return relationships
}
