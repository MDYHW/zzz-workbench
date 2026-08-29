import {
  DISORDER_TARGET,
  actionTarget,
  canonicalAction,
  type ActionTarget,
} from '../../actions'
import type { ProfileRelationship } from '../../calculation/relationships'
import { selectSource, type SelectedSourceInstance } from '../../calculation/source-instance'
import type { SurfaceKey } from '../../effects'
import { effectAttributeForAgent } from '../../formula-policy'
import {
  W_ENGINE_FACTS,
  W_ENGINES,
} from '../engines'
import { selectedWEngineEffectIsHolderApplicable } from '../agent-setup-candidates'
import { ADMITTED_AGENTS } from '../agents'
import { defineWEngineSource } from '../source-definitions'
import {
  equipmentEffectAppliesToAttribute,
  equipmentEffectBaseValue,
  equipmentEffectMaximumValue,
  equipmentEffectProgressionIncrementValue,
  type AgentId,
  type EquipmentEffectFact,
  type EngineId,
  type Refinement,
} from '../types'
import {
  type CompleteSelectedSetup, type SelectedSetupObservation,
} from './equipment'
import { projectEquipmentEffectRelationships } from './equipment-effect-relationships'
import { materializeSelectedWEngineEffects } from './w-engine-effect-materializer'
import { equipmentEffectActionTargets } from './equipment-eligibility'

export interface SelectedWEngineContext {
  agentId: AgentId
  appliedPartySlot: 0 | 1 | 2
  setup: CompleteSelectedSetup
  observation: SelectedSetupObservation
  focusAgentId: AgentId
  partyAgentIds: readonly AgentId[]
  source: SelectedSourceInstance
  passiveEligible: boolean
}

interface SelectedWEngineBroadPrePenContext {
  agentId: AgentId
  focusAgentId: AgentId
  engineId: EngineId
  refinement: Refinement
  source: SelectedSourceInstance
  passiveEligible: boolean
}

/** Broad DEF relationships are shared by Result and candidate preparation. */
export function selectedWEngineBroadPrePenRelationships(
  context: SelectedWEngineBroadPrePenContext,
): ProfileRelationship[] {
  const {
    agentId,
    focusAgentId,
    engineId,
    refinement,
    source,
    passiveEligible,
  } = context
  if (!passiveEligible) return []
  return materializeSelectedWEngineEffects(
    W_ENGINE_FACTS[engineId].effects,
    {
      agentId,
      focusAgentId,
      refinement,
      source,
      effectIsHolderApplicable: (effectKey) => selectedWEngineEffectIsHolderApplicable(
        agentId,
        engineId,
        effectKey,
      ),
      includeEffect: (_effectKey, fact) => (
        (fact.modifier === 'defIgnore' || fact.modifier === 'defReduction')
        && equipmentEffectActionTargets(fact).length === 0
      ),
    },
  )
}

export function selectedWEngineBroadPrePenRelationshipsForSlot(
  state: import('../../state').WorkbenchState,
  slot: 0 | 1 | 2,
): ProfileRelationship[] {
  const { agentId, setup } = state.slots[slot]
  if (!setup.engineId || !setup.refinement) return []
  const specialty = ADMITTED_AGENTS.find(({ id }) => id === agentId)?.specialty
  if (W_ENGINES[setup.engineId].passiveSpecialty !== specialty) return []
  const source = selectSource(
    defineWEngineSource(setup.engineId, W_ENGINES[setup.engineId].name),
    agentId,
    slot,
    { kind: 'refinement', refinement: setup.refinement },
  )
  return selectedWEngineBroadPrePenRelationships({
    agentId,
    focusAgentId: state.slots[state.focusSlot].agentId,
    engineId: setup.engineId,
    refinement: setup.refinement,
    source,
    passiveEligible: true,
  })
}

const target = (...actions: Parameters<typeof canonicalAction>[0][]) => (
  actionTarget(actions.map(canonicalAction))
)
const BASIC = target('Basic Attack')
const DASH = target('Dash Attack')
const EX = target('EX Special Attack')
const CHAIN_ULT = target('Chain Attack', 'Ultimate')

function omitEffects<Effects extends Readonly<Record<string, EquipmentEffectFact>>>(
  omittedEffectKeys: Set<string>,
  _effects: Effects,
  ...effectKeys: readonly (keyof Effects & string)[]
): void {
  effectKeys.forEach((key) => omittedEffectKeys.add(key))
}

function value(effect: EquipmentEffectFact, setup: CompleteSelectedSetup): number {
  return equipmentEffectBaseValue(effect, setup.refinement)
}

function maximum(effect: EquipmentEffectFact, setup: CompleteSelectedSetup): number {
  return equipmentEffectMaximumValue(effect, setup.refinement)
}

function local(
  source: SelectedSourceInstance,
  fact: EquipmentEffectFact,
  value: number,
  action?: ActionTarget,
  earliestSurface: SurfaceKey = 'fully',
  sourceDetail?: string,
): ProfileRelationship[] {
  return projectEquipmentEffectRelationships({
    source,
    fact,
    amount: value,
    earliestSurface,
    action: action ?? null,
    ...(sourceDetail ? { sourceDetail } : {}),
  })
}

function automaticEnergy(
  source: SelectedSourceInstance,
  fact: EquipmentEffectFact,
  value: number,
  earliestSurface: 'combat' | 'fully' = 'combat',
): ProfileRelationship {
  const relationships = projectEquipmentEffectRelationships({
    source, fact, amount: value, earliestSurface,
  })
  if (relationships.length !== 1 || relationships[0].kind !== 'automatic-energy') {
    throw new Error(`Expected one Automatic Energy relationship for ${fact.modifier}`)
  }
  return relationships[0]
}

/**
 * Materializes the selected W-Engine exactly once. Agent identity is consulted
 * only for holder capability, action applicability, and prepared interval; the
 * passive magnitude remains owned by W_ENGINE_FACTS.
 */
export function selectedWEngineRelationships({
  agentId: agent,
  setup,
  observation,
  focusAgentId,
  partyAgentIds,
  appliedPartySlot,
  source,
  passiveEligible,
}: SelectedWEngineContext): ProfileRelationship[] {
  if (!passiveEligible) return []
  const relationships: ProfileRelationship[] = []
  const omittedEffectKeys = new Set<string>()
  const add = (
    fact: EquipmentEffectFact,
    amount: number,
    action?: ActionTarget,
    surface: SurfaceKey = 'fully',
  ) => relationships.push(...local(source, fact, amount, action, surface))
  // Each remaining identity branch is either an exact relationship/surface
  // gap in the current source grammar or a genuinely distinct operation.
  // Ordinary clauses stay in materializeSelectedWEngineEffects below.
  switch (setup.engineId) {
    case 'theVault':
      omitEffects(omittedEffectKeys, W_ENGINE_FACTS.theVault.effects, 'holderEnergy')
      relationships.push(automaticEnergy(source, W_ENGINE_FACTS.theVault.effects.holderEnergy, value(W_ENGINE_FACTS.theVault.effects.holderEnergy, setup), 'fully'))
      break
    case 'heartstringNocturne':
      omitEffects(omittedEffectKeys, W_ENGINE_FACTS.heartstringNocturne.effects, 'fireResIgnore')
      if (effectAttributeForAgent(agent) === 'Fire') {
        add(W_ENGINE_FACTS.heartstringNocturne.effects.fireResIgnore, equipmentEffectProgressionIncrementValue(W_ENGINE_FACTS.heartstringNocturne.effects.fireResIgnore, setup.refinement), CHAIN_ULT, 'combat')
        add(W_ENGINE_FACTS.heartstringNocturne.effects.fireResIgnore, equipmentEffectProgressionIncrementValue(W_ENGINE_FACTS.heartstringNocturne.effects.fireResIgnore, setup.refinement), CHAIN_ULT)
      }
      break
    case 'riotSuppressorMarkVI':
      omitEffects(omittedEffectKeys, W_ENGINE_FACTS.riotSuppressorMarkVI.effects, 'chargedEtherDamage')
      if (equipmentEffectAppliesToAttribute(
        W_ENGINE_FACTS.riotSuppressorMarkVI.effects.chargedEtherDamage,
        effectAttributeForAgent(agent),
      )) {
        add(W_ENGINE_FACTS.riotSuppressorMarkVI.effects.chargedEtherDamage, value(W_ENGINE_FACTS.riotSuppressorMarkVI.effects.chargedEtherDamage, setup), BASIC)
        add(W_ENGINE_FACTS.riotSuppressorMarkVI.effects.chargedEtherDamage, value(W_ENGINE_FACTS.riotSuppressorMarkVI.effects.chargedEtherDamage, setup), DASH)
      }
      break
    case 'zanshinHerbCase':
      omitEffects(omittedEffectKeys, W_ENGINE_FACTS.zanshinHerbCase.effects, 'anomalyStunCritRate')
      add(W_ENGINE_FACTS.zanshinHerbCase.effects.anomalyStunCritRate, value(W_ENGINE_FACTS.zanshinHerbCase.effects.anomalyStunCritRate, setup))
      break
    case 'gildedBlossom':
      omitEffects(omittedEffectKeys, W_ENGINE_FACTS.gildedBlossom.effects, 'atk', 'exDamage')
      add(W_ENGINE_FACTS.gildedBlossom.effects.atk, value(W_ENGINE_FACTS.gildedBlossom.effects.atk, setup))
      add(W_ENGINE_FACTS.gildedBlossom.effects.exDamage, value(W_ENGINE_FACTS.gildedBlossom.effects.exDamage, setup), EX)
      break
    case 'starlightEngineReplica':
      omitEffects(omittedEffectKeys, W_ENGINE_FACTS.starlightEngineReplica.effects, 'physicalDamage')
      if (effectAttributeForAgent(agent) === 'Physical') add(W_ENGINE_FACTS.starlightEngineReplica.effects.physicalDamage, value(W_ENGINE_FACTS.starlightEngineReplica.effects.physicalDamage, setup))
      break
    case 'timeweaver':
      omitEffects(omittedEffectKeys, W_ENGINE_FACTS.timeweaver.effects, 'anomalyProficiency', 'disorderDamage')
      add(W_ENGINE_FACTS.timeweaver.effects.anomalyProficiency, value(W_ENGINE_FACTS.timeweaver.effects.anomalyProficiency, setup))
      // Yanagi supplies an independent Polarity Disorder outcome; other current
      // holders need a different-Attribute partner for a visible Disorder use.
      const hasCurrentDisorderConsumer = agent === 'yanagi' || partyAgentIds.some((id, index) => (
        index !== appliedPartySlot && effectAttributeForAgent(id) !== 'Electric'
      ))
      if (hasCurrentDisorderConsumer) {
        const disorder = W_ENGINE_FACTS.timeweaver.effects.disorderDamage
        const threshold = disorder.activation.threshold
        relationships.push({
          kind: 'post-delivery-stat-modifier-gauge',
          source,
          basis: { statId: 'anomalyProficiency', surface: 'fully' },
          basisLabel: 'Fully Enabled Anomaly Proficiency',
          basisCap: threshold,
          gaugeMetricId: 'anomalyProficiency',
          modifierMetricId: 'anomalyDmgBonus',
          action: DISORDER_TARGET,
          modifierSurface: 'fully',
          output: {
            label: 'Disorder DMG Bonus',
            value: {
              kind: 'activation',
              threshold,
              inactiveValue: 0,
              activeValue: value(disorder, setup),
            },
            unit: '%',
            cap: value(disorder, setup),
          },
          decimals: { current: 0, threshold: 0, cap: 0, output: 1 },
        })
      }
      break
    case 'electroLipGloss':
      omitEffects(omittedEffectKeys, W_ENGINE_FACTS.electroLipGloss.effects, 'atk', 'damage')
      add(W_ENGINE_FACTS.electroLipGloss.effects.atk, value(W_ENGINE_FACTS.electroLipGloss.effects.atk, setup))
      add(W_ENGINE_FACTS.electroLipGloss.effects.damage, value(W_ENGINE_FACTS.electroLipGloss.effects.damage, setup))
      break
    case 'sharpenedStinger':
      omitEffects(omittedEffectKeys, W_ENGINE_FACTS.sharpenedStinger.effects, 'buildup')
      add(W_ENGINE_FACTS.sharpenedStinger.effects.buildup, value(W_ENGINE_FACTS.sharpenedStinger.effects.buildup, setup))
      break
    case 'roaringRide':
      omitEffects(omittedEffectKeys, W_ENGINE_FACTS.roaringRide.effects, 'atk', 'anomalyProficiency', 'buildup')
      add(W_ENGINE_FACTS.roaringRide.effects.atk, value(W_ENGINE_FACTS.roaringRide.effects.atk, setup))
      add(W_ENGINE_FACTS.roaringRide.effects.anomalyProficiency, value(W_ENGINE_FACTS.roaringRide.effects.anomalyProficiency, setup))
      add(W_ENGINE_FACTS.roaringRide.effects.buildup, value(W_ENGINE_FACTS.roaringRide.effects.buildup, setup))
      break
    case 'metanukimorphosis':
      omitEffects(omittedEffectKeys, W_ENGINE_FACTS.metanukimorphosis.effects, 'anomalyMastery')
      add(W_ENGINE_FACTS.metanukimorphosis.effects.anomalyMastery, value(W_ENGINE_FACTS.metanukimorphosis.effects.anomalyMastery, setup))
      break
    case 'flamemakerShaker':
      omitEffects(omittedEffectKeys, W_ENGINE_FACTS.flamemakerShaker.effects, 'damage', 'anomalyProficiency')
      add(W_ENGINE_FACTS.flamemakerShaker.effects.damage, maximum(W_ENGINE_FACTS.flamemakerShaker.effects.damage, setup))
      add(W_ENGINE_FACTS.flamemakerShaker.effects.anomalyProficiency, value(W_ENGINE_FACTS.flamemakerShaker.effects.anomalyProficiency, setup))
      break
    case 'flightOfFancy':
      omitEffects(omittedEffectKeys, W_ENGINE_FACTS.flightOfFancy.effects, 'buildup')
      add(W_ENGINE_FACTS.flightOfFancy.effects.buildup, value(W_ENGINE_FACTS.flightOfFancy.effects.buildup, setup))
      break
    case 'hailstormShrine':
      omitEffects(omittedEffectKeys, W_ENGINE_FACTS.hailstormShrine.effects, 'critDamage', 'iceDamage')
      add(W_ENGINE_FACTS.hailstormShrine.effects.critDamage, value(W_ENGINE_FACTS.hailstormShrine.effects.critDamage, setup))
      add(W_ENGINE_FACTS.hailstormShrine.effects.iceDamage, value(W_ENGINE_FACTS.hailstormShrine.effects.iceDamage, setup))
      break
    case 'qingming':
      omitEffects(omittedEffectKeys, W_ENGINE_FACTS.qingming.effects, 'sheerDamage')
      if (equipmentEffectAppliesToAttribute(
        W_ENGINE_FACTS.qingming.effects.sheerDamage,
        effectAttributeForAgent(agent),
      )) {
        add(W_ENGINE_FACTS.qingming.effects.sheerDamage, value(W_ENGINE_FACTS.qingming.effects.sheerDamage, setup), target('EX Special Attack', 'Ultimate'), 'combat')
      }
      break
    case 'cauldron':
      omitEffects(omittedEffectKeys, W_ENGINE_FACTS.cauldron.effects, 'damage', 'critRate')
      add(W_ENGINE_FACTS.cauldron.effects.critRate, value(W_ENGINE_FACTS.cauldron.effects.critRate, setup))
      add(W_ENGINE_FACTS.cauldron.effects.damage, value(W_ENGINE_FACTS.cauldron.effects.damage, setup))
      break
    case 'radiowave':
      omitEffects(omittedEffectKeys, W_ENGINE_FACTS.radiowave.effects, 'sheerForce')
      add(W_ENGINE_FACTS.radiowave.effects.sheerForce, value(W_ENGINE_FACTS.radiowave.effects.sheerForce, setup))
      break
    case 'puzzleSphere':
      omitEffects(omittedEffectKeys, W_ENGINE_FACTS.puzzleSphere.effects, 'critDamage', 'damage')
      add(W_ENGINE_FACTS.puzzleSphere.effects.critDamage, value(W_ENGINE_FACTS.puzzleSphere.effects.critDamage, setup))
      add(W_ENGINE_FACTS.puzzleSphere.effects.damage, value(W_ENGINE_FACTS.puzzleSphere.effects.damage, setup), EX)
      break
    case 'krakensCradle':
      omitEffects(omittedEffectKeys, W_ENGINE_FACTS.krakensCradle.effects, 'critRate')
      add(W_ENGINE_FACTS.krakensCradle.effects.critRate, value(W_ENGINE_FACTS.krakensCradle.effects.critRate, setup))
      break
    case 'grillOWisp':
      omitEffects(omittedEffectKeys, W_ENGINE_FACTS.grillOWisp.effects, 'critRate')
      add(W_ENGINE_FACTS.grillOWisp.effects.critRate, value(W_ENGINE_FACTS.grillOWisp.effects.critRate, setup))
      break
    case 'hellfireGears':
      omitEffects(omittedEffectKeys, W_ENGINE_FACTS.hellfireGears.effects, 'impact')
      add(W_ENGINE_FACTS.hellfireGears.effects.impact, value(W_ENGINE_FACTS.hellfireGears.effects.impact, setup))
      break
    case 'steamOven':
      omitEffects(omittedEffectKeys, W_ENGINE_FACTS.steamOven.effects, 'impact')
      add(
        W_ENGINE_FACTS.steamOven.effects.impact,
        value(W_ENGINE_FACTS.steamOven.effects.impact, setup),
      )
      break
    case 'neonFantasies':
      omitEffects(omittedEffectKeys, W_ENGINE_FACTS.neonFantasies.effects, 'anomalyProficiency', 'maximumAnomalyProficiency')
      relationships.push(...local(source, W_ENGINE_FACTS.neonFantasies.effects.anomalyProficiency, value(W_ENGINE_FACTS.neonFantasies.effects.anomalyProficiency, setup), undefined, 'initial'))
      relationships.push(...local(source, W_ENGINE_FACTS.neonFantasies.effects.maximumAnomalyProficiency, value(W_ENGINE_FACTS.neonFantasies.effects.maximumAnomalyProficiency, setup), undefined, 'fully', 'At maximum stacks'))
      break
  }
  return [
    ...materializeSelectedWEngineEffects(
      W_ENGINE_FACTS[setup.engineId].effects,
      {
        agentId: agent,
        focusAgentId,
        refinement: setup.refinement,
        source,
        observation,
        effectIsHolderApplicable: (effectKey) => selectedWEngineEffectIsHolderApplicable(
          agent,
          setup.engineId,
          effectKey,
        ),
        omitEffectKeys: omittedEffectKeys,
      },
    ),
    ...relationships,
  ]
}
