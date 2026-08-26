import {
  AFTERSHOCK_TARGET,
  ATTRIBUTE_ANOMALY_TARGET,
  BASIC_AFTERSHOCK_TARGET,
  DISORDER_TARGET,
  actionTarget,
  canonicalAction,
  sourceLocalAction,
  type ActionTarget,
} from '../../actions'
import type { DeliveryRule, ProfileRelationship } from '../../calculation/relationships'
import { selectSource, type SelectedSourceInstance } from '../../calculation/source-instance'
import type { SurfaceKey } from '../../effects'
import {
  CRIT_DAMAGE_FORMULAS,
  effectAttributeForAgent,
  REGULAR_DAMAGE_FORMULAS,
} from '../../formula-policy'
import { W_ENGINE_FACTS, W_ENGINES } from '../engines'
import { ADMITTED_AGENTS } from '../agents'
import { defineWEngineSource } from '../source-definitions'
import { operatingIntervalFor } from '../setup-policies'
import {
  equipmentEffectAppliesToAttribute,
  equipmentEffectBaseValue,
  equipmentEffectMaximumValue,
  equipmentEffectProgressionIncrementValue,
  equipmentEffectProgressionValue,
  type AgentId,
  type EquipmentEffectFact,
  type EngineId,
  type Refinement,
} from '../types'
import {
  type CompleteSelectedSetup, type SelectedSetupObservation,
} from './equipment'
import { projectEquipmentEffectRelationships } from './equipment-effect-relationships'
import {
  equipmentEffectAppliesInOperatingInterval,
  equipmentEffectCanBeActivatedByHolder,
} from './equipment-eligibility'

type Slot = 0 | 1 | 2

export interface SelectedWEngineContext {
  agentId: AgentId
  appliedPartySlot: Slot
  setup: CompleteSelectedSetup
  observation: SelectedSetupObservation
  focusAgentId: AgentId
  partyAgentIds: readonly AgentId[]
  source: SelectedSourceInstance
  passiveEligible: boolean
}

interface SelectedWEngineBroadPrePenContext {
  agentId: AgentId
  engineId: EngineId
  refinement: Refinement
  source: SelectedSourceInstance
  passiveEligible: boolean
}

/** Broad DEF relationships are shared by Result and candidate preparation. */
export function selectedWEngineBroadPrePenRelationships(
  context: SelectedWEngineBroadPrePenContext,
): ProfileRelationship[] {
  const { agentId: agent, engineId, refinement, source, passiveEligible } = context
  if (!passiveEligible) return []
  switch (engineId) {
    case 'myriadEclipse':
      return local(
        source,
        W_ENGINE_FACTS.myriadEclipse.effects.defIgnore,
        equipmentEffectBaseValue(W_ENGINE_FACTS.myriadEclipse.effects.defIgnore, refinement),
        undefined,
        'combat',
      )
    case 'serpentineSeeker':
      if (effectAttributeForAgent(agent) !== 'Electric') return []
      return local(
        source,
        W_ENGINE_FACTS.serpentineSeeker.effects.defIgnore,
        equipmentEffectBaseValue(W_ENGINE_FACTS.serpentineSeeker.effects.defIgnore, refinement),
        undefined,
        'combat',
      )
    case 'spectralGaze':
      if (agent !== 'trigger') return []
      return projectEquipmentEffectRelationships({
        source,
        fact: W_ENGINE_FACTS.spectralGaze.effects.defReduction,
        amount: equipmentEffectBaseValue(
          W_ENGINE_FACTS.spectralGaze.effects.defReduction,
          refinement,
        ),
        earliestSurface: 'fully',
        delivery: { formulas: ['general_damage'] },
      })
    default:
      return []
  }
}

export function selectedWEngineBroadPrePenRelationshipsForSlot(
  state: import('../../state').WorkbenchState,
  slot: Slot,
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
const BASIC_DASH = target('Basic Attack', 'Dash Attack')
const BASIC_ULT = target('Basic Attack', 'Ultimate')
const CHAIN_ULT = target('Chain Attack', 'Ultimate')
const EX_ASSIST_FOLLOW_UP = target('EX Special Attack', 'Assist Follow-Up')
const EX_CHAIN_ULT = target('EX Special Attack', 'Chain Attack', 'Ultimate')
const BACK_ATTACK = actionTarget([sourceLocalAction('Back attacks')])

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

function provider(
  source: SelectedSourceInstance,
  fact: EquipmentEffectFact,
  value: number,
  delivery: Omit<DeliveryRule, 'recipient'> = {},
): ProfileRelationship {
  const relationships = projectEquipmentEffectRelationships({
    source,
    fact,
    amount: value,
    earliestSurface: 'fully',
    delivery,
  })
  if (relationships.length !== 1 || relationships[0].kind !== 'provider') {
    throw new Error(`Expected one provider relationship for ${fact.modifier}`)
  }
  return relationships[0]
}

function push(
  relationships: ProfileRelationship[],
  ...candidates: Array<ProfileRelationship | null | false | undefined>
): void {
  for (const candidate of candidates) if (candidate) relationships.push(candidate)
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
  relationships.push(...selectedWEngineBroadPrePenRelationships({
    agentId: agent,
    engineId: setup.engineId,
    refinement: setup.refinement,
    source,
    passiveEligible,
  }))
  const add = (
    fact: EquipmentEffectFact,
    amount: number,
    action?: ActionTarget,
    surface: SurfaceKey = 'fully',
  ) => relationships.push(...local(source, fact, amount, action, surface))
  const allDamage = (fact: EquipmentEffectFact, amount: number) => (
    provider(source, fact, amount, { formulas: REGULAR_DAMAGE_FORMULAS })
  )

  switch (setup.engineId) {
    case 'thoughtbop':
      push(
        relationships,
        provider(source, W_ENGINE_FACTS.thoughtbop.effects.damage, maximum(W_ENGINE_FACTS.thoughtbop.effects.damage, setup), { formulas: REGULAR_DAMAGE_FORMULAS }),
        provider(source, W_ENGINE_FACTS.thoughtbop.effects.atk, value(W_ENGINE_FACTS.thoughtbop.effects.atk, setup), { formulas: REGULAR_DAMAGE_FORMULAS }),
        automaticEnergy(source, W_ENGINE_FACTS.thoughtbop.effects.energy, value(W_ENGINE_FACTS.thoughtbop.effects.energy, setup)),
      )
      break
    case 'weepingCradle':
      push(
        relationships,
        equipmentEffectCanBeActivatedByHolder(
          agent,
          W_ENGINE_FACTS.weepingCradle.effects.damage,
        ) && allDamage(W_ENGINE_FACTS.weepingCradle.effects.damage, value(W_ENGINE_FACTS.weepingCradle.effects.damage, setup)),
        automaticEnergy(source, W_ENGINE_FACTS.weepingCradle.effects.energy, value(W_ENGINE_FACTS.weepingCradle.effects.energy, setup)),
      )
      break
    case 'kaboom':
      relationships.push(provider(source, W_ENGINE_FACTS.kaboom.effects.atk, value(W_ENGINE_FACTS.kaboom.effects.atk, setup)))
      break
    case 'unfetteredGameBall':
      relationships.push(provider(source, W_ENGINE_FACTS.unfetteredGameBall.effects.critRate, value(W_ENGINE_FACTS.unfetteredGameBall.effects.critRate, setup), { formulas: CRIT_DAMAGE_FORMULAS }))
      break
    case 'peacekeeperSpecialized':
      push(
        relationships,
        automaticEnergy(source, W_ENGINE_FACTS.peacekeeperSpecialized.effects.energyRegen, value(W_ENGINE_FACTS.peacekeeperSpecialized.effects.energyRegen, setup), 'fully'),
        ...local(source, W_ENGINE_FACTS.peacekeeperSpecialized.effects.buildup, value(W_ENGINE_FACTS.peacekeeperSpecialized.effects.buildup, setup), EX_ASSIST_FOLLOW_UP),
      )
      break
    case 'dreamlitHearth':
      push(
        relationships,
        provider(source, W_ENGINE_FACTS.dreamlitHearth.effects.maxHp, value(W_ENGINE_FACTS.dreamlitHearth.effects.maxHp, setup)),
        allDamage(W_ENGINE_FACTS.dreamlitHearth.effects.damage, value(W_ENGINE_FACTS.dreamlitHearth.effects.damage, setup)),
        automaticEnergy(source, W_ENGINE_FACTS.dreamlitHearth.effects.energy, value(W_ENGINE_FACTS.dreamlitHearth.effects.energy, setup)),
      )
      break
    case 'elegantVanity':
      relationships.push(allDamage(W_ENGINE_FACTS.elegantVanity.effects.damage, maximum(W_ENGINE_FACTS.elegantVanity.effects.damage, setup)))
      break
    case 'theVault':
      relationships.push(allDamage(W_ENGINE_FACTS.theVault.effects.targetDamage, value(W_ENGINE_FACTS.theVault.effects.targetDamage, setup)))
      break
    case 'bashfulDemon':
      relationships.push(provider(source, W_ENGINE_FACTS.bashfulDemon.effects.atk, maximum(W_ENGINE_FACTS.bashfulDemon.effects.atk, setup), { formulas: REGULAR_DAMAGE_FORMULAS }))
      break
    case 'tusksOfFury':
      push(
        relationships,
        allDamage(W_ENGINE_FACTS.tusksOfFury.effects.damage, value(W_ENGINE_FACTS.tusksOfFury.effects.damage, setup)),
        provider(source, W_ENGINE_FACTS.tusksOfFury.effects.daze, value(W_ENGINE_FACTS.tusksOfFury.effects.daze, setup), { formulas: ['daze_buildup'] }),
      )
      break
    case 'tremorTrigramVessel':
      add(W_ENGINE_FACTS.tremorTrigramVessel.effects.damage, value(W_ENGINE_FACTS.tremorTrigramVessel.effects.damage, setup), target('EX Special Attack', 'Ultimate'))
      break
    case 'originalTransmorpher':
      if (observation.baseStats.maxHp !== undefined) add(W_ENGINE_FACTS.originalTransmorpher.effects.maxHp, value(W_ENGINE_FACTS.originalTransmorpher.effects.maxHp, setup), undefined, 'combat')
      break
    case 'halfSugarBunny':
      push(
        relationships,
        automaticEnergy(source, W_ENGINE_FACTS.halfSugarBunny.effects.automaticEnergy, value(W_ENGINE_FACTS.halfSugarBunny.effects.automaticEnergy, setup)),
        provider(source, W_ENGINE_FACTS.halfSugarBunny.effects.squadAtk, value(W_ENGINE_FACTS.halfSugarBunny.effects.squadAtk, setup)),
        provider(source, W_ENGINE_FACTS.halfSugarBunny.effects.squadMaxHp, value(W_ENGINE_FACTS.halfSugarBunny.effects.squadMaxHp, setup)),
        provider(source, W_ENGINE_FACTS.halfSugarBunny.effects.veilCritDamage, value(W_ENGINE_FACTS.halfSugarBunny.effects.veilCritDamage, setup), { formulas: CRIT_DAMAGE_FORMULAS }),
      )
      break
    case 'cordisGermina':
      add(W_ENGINE_FACTS.cordisGermina.effects.critRate, value(W_ENGINE_FACTS.cordisGermina.effects.critRate, setup), undefined, 'combat')
      if (effectAttributeForAgent(agent) === 'Electric') add(W_ENGINE_FACTS.cordisGermina.effects.damage, maximum(W_ENGINE_FACTS.cordisGermina.effects.damage, setup))
      add(W_ENGINE_FACTS.cordisGermina.effects.defIgnore, value(W_ENGINE_FACTS.cordisGermina.effects.defIgnore, setup), BASIC_ULT)
      break
    case 'severedInnocence':
      add(W_ENGINE_FACTS.severedInnocence.effects.critDamage, value(W_ENGINE_FACTS.severedInnocence.effects.critDamage, setup), undefined, 'combat')
      add(W_ENGINE_FACTS.severedInnocence.effects.critDamage, equipmentEffectProgressionValue(W_ENGINE_FACTS.severedInnocence.effects.critDamage, setup.refinement))
      if (effectAttributeForAgent(agent) === 'Electric') add(W_ENGINE_FACTS.severedInnocence.effects.damage, value(W_ENGINE_FACTS.severedInnocence.effects.damage, setup))
      break
    case 'heartstringNocturne':
      add(W_ENGINE_FACTS.heartstringNocturne.effects.critDamage, value(W_ENGINE_FACTS.heartstringNocturne.effects.critDamage, setup), undefined, 'combat')
      if (effectAttributeForAgent(agent) === 'Fire') {
        add(W_ENGINE_FACTS.heartstringNocturne.effects.fireResIgnore, equipmentEffectProgressionIncrementValue(W_ENGINE_FACTS.heartstringNocturne.effects.fireResIgnore, setup.refinement), CHAIN_ULT, 'combat')
        add(W_ENGINE_FACTS.heartstringNocturne.effects.fireResIgnore, equipmentEffectProgressionIncrementValue(W_ENGINE_FACTS.heartstringNocturne.effects.fireResIgnore, setup.refinement), CHAIN_ULT)
      }
      break
    case 'myriadEclipse':
      add(W_ENGINE_FACTS.myriadEclipse.effects.critDamage, value(W_ENGINE_FACTS.myriadEclipse.effects.critDamage, setup), undefined, 'combat')
      break
    case 'steelCushion':
      if (effectAttributeForAgent(agent) === 'Physical') add(W_ENGINE_FACTS.steelCushion.effects.physicalDamage, value(W_ENGINE_FACTS.steelCushion.effects.physicalDamage, setup), undefined, 'combat')
      add(W_ENGINE_FACTS.steelCushion.effects.damage, value(W_ENGINE_FACTS.steelCushion.effects.damage, setup), BACK_ATTACK)
      break
    case 'housekeeper':
      push(relationships, automaticEnergy(source, W_ENGINE_FACTS.housekeeper.effects.energy, value(W_ENGINE_FACTS.housekeeper.effects.energy, setup)))
      if (equipmentEffectAppliesToAttribute(
        W_ENGINE_FACTS.housekeeper.effects.damage,
        effectAttributeForAgent(agent),
      )) add(W_ENGINE_FACTS.housekeeper.effects.damage, maximum(W_ENGINE_FACTS.housekeeper.effects.damage, setup), EX)
      break
    case 'deepSeaVisitor':
      if (equipmentEffectAppliesToAttribute(
        W_ENGINE_FACTS.deepSeaVisitor.effects.iceDamage,
        effectAttributeForAgent(agent),
      )) {
        add(W_ENGINE_FACTS.deepSeaVisitor.effects.iceDamage, value(W_ENGINE_FACTS.deepSeaVisitor.effects.iceDamage, setup), undefined, 'combat')
      }
      add(W_ENGINE_FACTS.deepSeaVisitor.effects.basicCritRate, value(W_ENGINE_FACTS.deepSeaVisitor.effects.basicCritRate, setup), undefined, 'combat')
      add(W_ENGINE_FACTS.deepSeaVisitor.effects.dashCritRate, value(W_ENGINE_FACTS.deepSeaVisitor.effects.dashCritRate, setup), undefined, 'combat')
      break
    case 'riotSuppressorMarkVI':
      add(W_ENGINE_FACTS.riotSuppressorMarkVI.effects.critRate, value(W_ENGINE_FACTS.riotSuppressorMarkVI.effects.critRate, setup), undefined, 'combat')
      if (equipmentEffectAppliesToAttribute(
        W_ENGINE_FACTS.riotSuppressorMarkVI.effects.chargedEtherDamage,
        effectAttributeForAgent(agent),
      )) {
        add(W_ENGINE_FACTS.riotSuppressorMarkVI.effects.chargedEtherDamage, value(W_ENGINE_FACTS.riotSuppressorMarkVI.effects.chargedEtherDamage, setup), BASIC)
        add(W_ENGINE_FACTS.riotSuppressorMarkVI.effects.chargedEtherDamage, value(W_ENGINE_FACTS.riotSuppressorMarkVI.effects.chargedEtherDamage, setup), DASH)
      }
      break
    case 'zanshinHerbCase':
      add(W_ENGINE_FACTS.zanshinHerbCase.effects.critRate, value(W_ENGINE_FACTS.zanshinHerbCase.effects.critRate, setup), undefined, 'combat')
      if (equipmentEffectAppliesToAttribute(
        W_ENGINE_FACTS.zanshinHerbCase.effects.dashDamage,
        effectAttributeForAgent(agent),
      )) {
        add(W_ENGINE_FACTS.zanshinHerbCase.effects.dashDamage, value(W_ENGINE_FACTS.zanshinHerbCase.effects.dashDamage, setup), DASH)
      }
      add(W_ENGINE_FACTS.zanshinHerbCase.effects.anomalyStunCritRate, value(W_ENGINE_FACTS.zanshinHerbCase.effects.anomalyStunCritRate, setup))
      break
    case 'cloudcleaveRadiance':
      if (effectAttributeForAgent(agent) === 'Physical') add(W_ENGINE_FACTS.cloudcleaveRadiance.effects.physicalResIgnore, value(W_ENGINE_FACTS.cloudcleaveRadiance.effects.physicalResIgnore, setup), undefined, 'combat')
      if (agent === 'yeShunguang') {
        add(W_ENGINE_FACTS.cloudcleaveRadiance.effects.etherVeilDamage, value(W_ENGINE_FACTS.cloudcleaveRadiance.effects.etherVeilDamage, setup))
        add(W_ENGINE_FACTS.cloudcleaveRadiance.effects.etherVeilCritDamage, value(W_ENGINE_FACTS.cloudcleaveRadiance.effects.etherVeilCritDamage, setup))
      }
      break
    case 'starlightEngine':
      add(W_ENGINE_FACTS.starlightEngine.effects.atk, value(W_ENGINE_FACTS.starlightEngine.effects.atk, setup), undefined, agent === 'ellen' ? 'combat' : 'fully')
      break
    case 'brimstone':
      add(W_ENGINE_FACTS.brimstone.effects.atk, maximum(W_ENGINE_FACTS.brimstone.effects.atk, setup))
      break
    case 'marcatoDesire':
      add(W_ENGINE_FACTS.marcatoDesire.effects.atk, maximum(W_ENGINE_FACTS.marcatoDesire.effects.atk, setup))
      break
    case 'gildedBlossom':
      add(W_ENGINE_FACTS.gildedBlossom.effects.atk, value(W_ENGINE_FACTS.gildedBlossom.effects.atk, setup), undefined, agent === 'yeShunguang' ? 'combat' : 'fully')
      add(W_ENGINE_FACTS.gildedBlossom.effects.exDamage, value(W_ENGINE_FACTS.gildedBlossom.effects.exDamage, setup), EX)
      break
    case 'drillRigRedAxis':
      if (effectAttributeForAgent(agent) === 'Electric') add(W_ENGINE_FACTS.drillRigRedAxis.effects.damage, value(W_ENGINE_FACTS.drillRigRedAxis.effects.damage, setup), BASIC_DASH)
      break
    case 'bellicoseBlaze':
      add(W_ENGINE_FACTS.bellicoseBlaze.effects.critRate, value(W_ENGINE_FACTS.bellicoseBlaze.effects.critRate, setup), undefined, 'combat')
      if (agent === 'orphie') add(W_ENGINE_FACTS.bellicoseBlaze.effects.fireAftershockDefIgnore, maximum(W_ENGINE_FACTS.bellicoseBlaze.effects.fireAftershockDefIgnore, setup), AFTERSHOCK_TARGET)
      break
    case 'serpentineSeeker':
      if (effectAttributeForAgent(agent) === 'Electric') {
        add(W_ENGINE_FACTS.serpentineSeeker.effects.critRate, value(W_ENGINE_FACTS.serpentineSeeker.effects.critRate, setup), undefined, 'combat')
      }
      break
    case 'starlightEngineReplica':
      if (effectAttributeForAgent(agent) === 'Physical') add(W_ENGINE_FACTS.starlightEngineReplica.effects.physicalDamage, value(W_ENGINE_FACTS.starlightEngineReplica.effects.physicalDamage, setup))
      break
    case 'timeweaver':
      add(W_ENGINE_FACTS.timeweaver.effects.electricBuildup, value(W_ENGINE_FACTS.timeweaver.effects.electricBuildup, setup), undefined, 'combat')
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
    case 'practicedPerfection': {
      add(W_ENGINE_FACTS.practicedPerfection.effects.anomalyMastery, value(W_ENGINE_FACTS.practicedPerfection.effects.anomalyMastery, setup), undefined, 'combat')
      const physicalDamage = W_ENGINE_FACTS.practicedPerfection.effects.physicalDamage
      if (equipmentEffectAppliesToAttribute(physicalDamage, effectAttributeForAgent(agent))) add(physicalDamage, maximum(physicalDamage, setup))
      break
    }
    case 'fusionCompiler':
      add(W_ENGINE_FACTS.fusionCompiler.effects.atk, value(W_ENGINE_FACTS.fusionCompiler.effects.atk, setup), undefined, 'combat')
      add(W_ENGINE_FACTS.fusionCompiler.effects.anomalyProficiency, maximum(W_ENGINE_FACTS.fusionCompiler.effects.anomalyProficiency, setup))
      break
    case 'electroLipGloss':
      add(W_ENGINE_FACTS.electroLipGloss.effects.atk, value(W_ENGINE_FACTS.electroLipGloss.effects.atk, setup))
      add(W_ENGINE_FACTS.electroLipGloss.effects.damage, value(W_ENGINE_FACTS.electroLipGloss.effects.damage, setup))
      break
    case 'weepingGemini':
      add(W_ENGINE_FACTS.weepingGemini.effects.anomalyProficiency, maximum(W_ENGINE_FACTS.weepingGemini.effects.anomalyProficiency, setup))
      break
    case 'sharpenedStinger':
      add(W_ENGINE_FACTS.sharpenedStinger.effects.physicalDamage, maximum(W_ENGINE_FACTS.sharpenedStinger.effects.physicalDamage, setup))
      add(W_ENGINE_FACTS.sharpenedStinger.effects.buildup, value(W_ENGINE_FACTS.sharpenedStinger.effects.buildup, setup))
      break
    case 'roaringRide':
      add(W_ENGINE_FACTS.roaringRide.effects.atk, value(W_ENGINE_FACTS.roaringRide.effects.atk, setup))
      add(W_ENGINE_FACTS.roaringRide.effects.anomalyProficiency, value(W_ENGINE_FACTS.roaringRide.effects.anomalyProficiency, setup))
      add(W_ENGINE_FACTS.roaringRide.effects.buildup, value(W_ENGINE_FACTS.roaringRide.effects.buildup, setup))
      break
    case 'metanukimorphosis':
      add(W_ENGINE_FACTS.metanukimorphosis.effects.anomalyMastery, value(W_ENGINE_FACTS.metanukimorphosis.effects.anomalyMastery, setup))
      relationships.push(provider(source, W_ENGINE_FACTS.metanukimorphosis.effects.anomalyProficiency, value(W_ENGINE_FACTS.metanukimorphosis.effects.anomalyProficiency, setup), { formulas: ['anomaly_damage'] }))
      break
    case 'flamemakerShaker':
      add(W_ENGINE_FACTS.flamemakerShaker.effects.damage, maximum(W_ENGINE_FACTS.flamemakerShaker.effects.damage, setup))
      add(W_ENGINE_FACTS.flamemakerShaker.effects.anomalyProficiency, value(W_ENGINE_FACTS.flamemakerShaker.effects.anomalyProficiency, setup))
      if (equipmentEffectAppliesInOperatingInterval(
        W_ENGINE_FACTS.flamemakerShaker.effects.offFieldEnergy,
        operatingIntervalFor(agent, focusAgentId),
      )) {
        relationships.push(automaticEnergy(source, W_ENGINE_FACTS.flamemakerShaker.effects.offFieldEnergy, value(W_ENGINE_FACTS.flamemakerShaker.effects.offFieldEnergy, setup)))
      }
      break
    case 'flightOfFancy':
      add(W_ENGINE_FACTS.flightOfFancy.effects.anomalyProficiency, maximum(W_ENGINE_FACTS.flightOfFancy.effects.anomalyProficiency, setup))
      add(W_ENGINE_FACTS.flightOfFancy.effects.buildup, value(W_ENGINE_FACTS.flightOfFancy.effects.buildup, setup))
      break
    case 'angelInTheShell': {
      const interval = operatingIntervalFor(agent, focusAgentId)
      const proficiency = W_ENGINE_FACTS.angelInTheShell.effects.anomalyProficiency
      const damage = W_ENGINE_FACTS.angelInTheShell.effects.damage
      const anomalyDamage = W_ENGINE_FACTS.angelInTheShell.effects.anomalyDamage
      if (equipmentEffectAppliesInOperatingInterval(proficiency, interval)) {
        add(proficiency, value(proficiency, setup), undefined, 'combat')
      }
      if (
        equipmentEffectCanBeActivatedByHolder(agent, damage)
        && equipmentEffectAppliesInOperatingInterval(damage, interval)
      ) add(damage, value(damage, setup))
      if (
        equipmentEffectCanBeActivatedByHolder(agent, anomalyDamage)
        && equipmentEffectAppliesInOperatingInterval(anomalyDamage, interval)
      ) {
        add(anomalyDamage, value(anomalyDamage, setup), ATTRIBUTE_ANOMALY_TARGET)
        add(anomalyDamage, value(anomalyDamage, setup), DISORDER_TARGET)
      }
      break
    }
    case 'hailstormShrine':
      add(W_ENGINE_FACTS.hailstormShrine.effects.critDamage, value(W_ENGINE_FACTS.hailstormShrine.effects.critDamage, setup))
      add(W_ENGINE_FACTS.hailstormShrine.effects.iceDamage, value(W_ENGINE_FACTS.hailstormShrine.effects.iceDamage, setup))
      break
    case 'frostfallSickle':
      add(W_ENGINE_FACTS.frostfallSickle.effects.iceDamage, maximum(W_ENGINE_FACTS.frostfallSickle.effects.iceDamage, setup))
      add(W_ENGINE_FACTS.frostfallSickle.effects.abloomDamage, value(W_ENGINE_FACTS.frostfallSickle.effects.abloomDamage, setup), actionTarget([sourceLocalAction('Abloom')]))
      break
    case 'qingming':
      add(W_ENGINE_FACTS.qingming.effects.critRate, value(W_ENGINE_FACTS.qingming.effects.critRate, setup), undefined, 'combat')
      if (equipmentEffectAppliesToAttribute(
        W_ENGINE_FACTS.qingming.effects.damage,
        effectAttributeForAgent(agent),
      )) {
        add(W_ENGINE_FACTS.qingming.effects.damage, value(W_ENGINE_FACTS.qingming.effects.damage, setup), undefined, 'combat')
        add(W_ENGINE_FACTS.qingming.effects.sheerDamage, value(W_ENGINE_FACTS.qingming.effects.sheerDamage, setup), target('EX Special Attack', 'Ultimate'), 'combat')
      }
      break
    case 'cauldron':
      add(W_ENGINE_FACTS.cauldron.effects.critRate, value(W_ENGINE_FACTS.cauldron.effects.critRate, setup))
      add(W_ENGINE_FACTS.cauldron.effects.damage, value(W_ENGINE_FACTS.cauldron.effects.damage, setup))
      break
    case 'radiowave':
      add(W_ENGINE_FACTS.radiowave.effects.sheerForce, value(W_ENGINE_FACTS.radiowave.effects.sheerForce, setup))
      break
    case 'puzzleSphere':
      add(W_ENGINE_FACTS.puzzleSphere.effects.critDamage, value(W_ENGINE_FACTS.puzzleSphere.effects.critDamage, setup))
      add(W_ENGINE_FACTS.puzzleSphere.effects.damage, value(W_ENGINE_FACTS.puzzleSphere.effects.damage, setup), EX)
      break
    case 'krakensCradle':
      add(W_ENGINE_FACTS.krakensCradle.effects.critRate, value(W_ENGINE_FACTS.krakensCradle.effects.critRate, setup))
      if (equipmentEffectAppliesToAttribute(
        W_ENGINE_FACTS.krakensCradle.effects.iceSheerDamage,
        effectAttributeForAgent(agent),
      )) {
        add(W_ENGINE_FACTS.krakensCradle.effects.iceSheerDamage, maximum(W_ENGINE_FACTS.krakensCradle.effects.iceSheerDamage, setup))
      }
      break
    case 'grillOWisp':
      add(W_ENGINE_FACTS.grillOWisp.effects.critRate, value(W_ENGINE_FACTS.grillOWisp.effects.critRate, setup))
      if (equipmentEffectAppliesToAttribute(
        W_ENGINE_FACTS.grillOWisp.effects.fireDamage,
        effectAttributeForAgent(agent),
      )) {
        add(W_ENGINE_FACTS.grillOWisp.effects.fireDamage, value(W_ENGINE_FACTS.grillOWisp.effects.fireDamage, setup), undefined, 'combat')
      }
      break
    case 'wrathfulVajra':
      add(W_ENGINE_FACTS.wrathfulVajra.effects.critRate, value(W_ENGINE_FACTS.wrathfulVajra.effects.critRate, setup), undefined, 'combat')
      if (equipmentEffectAppliesToAttribute(
        W_ENGINE_FACTS.wrathfulVajra.effects.fireSheerDamage,
        effectAttributeForAgent(agent),
      )) {
        add(W_ENGINE_FACTS.wrathfulVajra.effects.fireSheerDamage, maximum(W_ENGINE_FACTS.wrathfulVajra.effects.fireSheerDamage, setup), EX)
      }
      break
    case 'starlightRiderFaceplate':
      add(W_ENGINE_FACTS.starlightRiderFaceplate.effects.critRate, value(W_ENGINE_FACTS.starlightRiderFaceplate.effects.critRate, setup), undefined, 'combat')
      if (equipmentEffectAppliesToAttribute(
        W_ENGINE_FACTS.starlightRiderFaceplate.effects.physicalSheerDamage,
        effectAttributeForAgent(agent),
      )) {
        add(W_ENGINE_FACTS.starlightRiderFaceplate.effects.physicalSheerDamage, maximum(W_ENGINE_FACTS.starlightRiderFaceplate.effects.physicalSheerDamage, setup))
      }
      break
    case 'yesterdayCalls':
      relationships.push(automaticEnergy(source, W_ENGINE_FACTS.yesterdayCalls.effects.energy, value(W_ENGINE_FACTS.yesterdayCalls.effects.energy, setup)))
      add(W_ENGINE_FACTS.yesterdayCalls.effects.daze, value(W_ENGINE_FACTS.yesterdayCalls.effects.daze, setup))
      relationships.push(provider(source, W_ENGINE_FACTS.yesterdayCalls.effects.critDamage, value(W_ENGINE_FACTS.yesterdayCalls.effects.critDamage, setup), { formulas: CRIT_DAMAGE_FORMULAS }))
      break
    case 'hellfireGears':
      add(W_ENGINE_FACTS.hellfireGears.effects.impact, ['trigger', 'koleda', 'anby'].includes(agent)
        ? maximum(W_ENGINE_FACTS.hellfireGears.effects.impact, setup)
        : value(W_ENGINE_FACTS.hellfireGears.effects.impact, setup))
      const energy = W_ENGINE_FACTS.hellfireGears.effects.energy
      if (
        observation.baseStats.energyRegen !== undefined
        && equipmentEffectAppliesInOperatingInterval(
          energy,
          operatingIntervalFor(agent, focusAgentId),
        )
      ) {
        relationships.push(automaticEnergy(source, energy, value(energy, setup)))
      }
      break
    case 'steamOven':
      if (['dialyn', 'trigger', 'lycaon', 'juFufu', 'pulchra', 'qingyi', 'koleda', 'anby'].includes(agent)) {
        add(W_ENGINE_FACTS.steamOven.effects.impact, ['lycaon', 'qingyi', 'koleda', 'anby'].includes(agent)
          ? maximum(W_ENGINE_FACTS.steamOven.effects.impact, setup)
          : value(W_ENGINE_FACTS.steamOven.effects.impact, setup))
      }
      break
    case 'spectralGaze':
      if (agent === 'trigger') {
        add(W_ENGINE_FACTS.spectralGaze.effects.impact, maximum(W_ENGINE_FACTS.spectralGaze.effects.impact, setup))
      }
      break
    case 'iceJadeTeapot':
      if (['trigger', 'lighter', 'qingyi'].includes(agent)) {
        add(W_ENGINE_FACTS.iceJadeTeapot.effects.impact, maximum(W_ENGINE_FACTS.iceJadeTeapot.effects.impact, setup))
        relationships.push(allDamage(W_ENGINE_FACTS.iceJadeTeapot.effects.damage, value(W_ENGINE_FACTS.iceJadeTeapot.effects.damage, setup)))
      }
      break
    case 'blazingLaurel':
      if (['trigger', 'lycaon', 'juFufu', 'lighter', 'pulchra', 'qingyi', 'koleda', 'anby'].includes(agent)) {
        add(W_ENGINE_FACTS.blazingLaurel.effects.impact, value(W_ENGINE_FACTS.blazingLaurel.effects.impact, setup))
        relationships.push(provider(source, W_ENGINE_FACTS.blazingLaurel.effects.critDamage, maximum(W_ENGINE_FACTS.blazingLaurel.effects.critDamage, setup), { formulas: CRIT_DAMAGE_FORMULAS }))
      }
      break
    case 'restrained':
      add(W_ENGINE_FACTS.restrained.effects.daze, maximum(W_ENGINE_FACTS.restrained.effects.daze, setup), agent === 'trigger'
        ? BASIC_AFTERSHOCK_TARGET
        : ['lighter', 'qingyi', 'koleda', 'anby'].includes(agent)
          ? BASIC
          : undefined)
      if (agent === 'qingyi') add(W_ENGINE_FACTS.restrained.effects.damage, maximum(W_ENGINE_FACTS.restrained.effects.damage, setup), BASIC)
      break
    case 'preciousFossilizedCore':
      add(W_ENGINE_FACTS.preciousFossilizedCore.effects.daze, maximum(W_ENGINE_FACTS.preciousFossilizedCore.effects.daze, setup))
      break
    case 'roaringFurnace':
      add(W_ENGINE_FACTS.roaringFurnace.effects.daze, value(W_ENGINE_FACTS.roaringFurnace.effects.daze, setup), EX_CHAIN_ULT)
      if (equipmentEffectCanBeActivatedByHolder(agent, W_ENGINE_FACTS.roaringFurnace.effects.damage)) {
        relationships.push(allDamage(W_ENGINE_FACTS.roaringFurnace.effects.damage, maximum(W_ENGINE_FACTS.roaringFurnace.effects.damage, setup)))
      }
      break
    case 'boxCutter':
      add(W_ENGINE_FACTS.boxCutter.effects.daze, value(W_ENGINE_FACTS.boxCutter.effects.daze, setup))
      break
    case 'simmeringPot':
      if (equipmentEffectCanBeActivatedByHolder(agent, W_ENGINE_FACTS.simmeringPot.effects.daze)) {
        add(W_ENGINE_FACTS.simmeringPot.effects.daze, value(W_ENGINE_FACTS.simmeringPot.effects.daze, setup))
      }
      if (equipmentEffectCanBeActivatedByHolder(agent, W_ENGINE_FACTS.simmeringPot.effects.damage)) {
        add(W_ENGINE_FACTS.simmeringPot.effects.damage, value(W_ENGINE_FACTS.simmeringPot.effects.damage, setup))
      }
      break
    case 'neonFantasies':
      relationships.push(...local(source, W_ENGINE_FACTS.neonFantasies.effects.anomalyProficiency, value(W_ENGINE_FACTS.neonFantasies.effects.anomalyProficiency, setup), undefined, 'initial'))
      relationships.push(...local(source, W_ENGINE_FACTS.neonFantasies.effects.maximumAnomalyProficiency, value(W_ENGINE_FACTS.neonFantasies.effects.maximumAnomalyProficiency, setup), undefined, 'fully', 'At maximum stacks'))
      if (equipmentEffectCanBeActivatedByHolder(agent, W_ENGINE_FACTS.neonFantasies.effects.damage)) {
        relationships.push(allDamage(W_ENGINE_FACTS.neonFantasies.effects.damage, maximum(W_ENGINE_FACTS.neonFantasies.effects.damage, setup)))
      }
      break
  }
  return relationships
}
