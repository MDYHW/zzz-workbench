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
import type { ProfileRelationship, ProviderEffect } from '../../calculation/relationships'
import type { SelectedSourceInstance } from '../../calculation/source-instance'
import type { StatId, StatRegion } from '../../calculation/stat-composer'
import type { EffectMetric, SurfaceKey } from '../../effects'
import {
  CRIT_DAMAGE_FORMULAS,
  effectAttributeForAgent,
  REGULAR_DAMAGE_FORMULAS,
} from '../../formula-policy'
import { W_ENGINE_FACTS } from '../engines'
import { operatingIntervalFor } from '../setup-policies'
import {
  equipmentEffectAppliesToAttribute,
  equipmentEffectBaseValue,
  equipmentEffectMaximumValue,
  equipmentEffectProgressionIncrementValue,
  equipmentEffectProgressionValue,
  type AgentId,
  type EquipmentEffectFact,
} from '../types'
import type { CompleteSelectedSetup, SelectedSetupObservation } from './equipment'
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

function stat(
  source: SelectedSourceInstance,
  statId: StatId,
  value: number,
  region: Exclude<StatRegion, 'base'>,
  earliestSurface: SurfaceKey = 'fully',
  sourceDetail?: string,
): ProfileRelationship {
  return {
    kind: 'stat',
    atom: {
      statId,
      region,
      earliestSurface,
      value,
      source,
      ...(sourceDetail ? { sourceDetail } : {}),
    },
  }
}

function modifier(
  source: SelectedSourceInstance,
  metricId: EffectMetric,
  value: number,
  action?: ActionTarget,
  earliestSurface: SurfaceKey = 'fully',
): ProfileRelationship {
  return {
    kind: 'modifier',
    atom: {
      metricId,
      earliestSurface,
      value,
      source,
      ...(action ? { action } : {}),
    },
  }
}

function local(
  source: SelectedSourceInstance,
  metricId: EffectMetric,
  value: number,
  action?: ActionTarget,
  earliestSurface: SurfaceKey = 'fully',
): ProfileRelationship | null {
  if (!value) return null
  if (!action) {
    const meaning: Partial<Record<EffectMetric, [StatId, Exclude<StatRegion, 'base'>]>> = {
      atk: ['atk', 'percentage'],
      maxHp: ['maxHp', 'percentage'],
      impact: ['impact', 'percentage'],
      critRate: ['critRate', 'flat'],
      critDmg: ['critDmg', 'flat'],
      anomalyProficiency: ['anomalyProficiency', 'flat'],
      anomalyMastery: ['anomalyMastery', 'flat'],
      penRatio: ['penRatio', 'flat'],
    }
    const found = meaning[metricId]
    if (found) return stat(source, found[0], value, found[1], earliestSurface)
  }
  return modifier(source, metricId, value, action, earliestSurface)
}

function provider(
  source: SelectedSourceInstance,
  recipient: 'all-party' | 'focus' | 'enemy-context',
  effect: ProviderEffect,
  delivery: Omit<Extract<ProfileRelationship, { kind: 'provider' }>['delivery'], 'recipient'> = {},
): ProfileRelationship {
  return { kind: 'provider', source, delivery: { recipient, ...delivery }, effect }
}

function automaticEnergy(
  source: SelectedSourceInstance,
  value: number,
  earliestSurface: 'combat' | 'fully' = 'combat',
): ProfileRelationship {
  return {
    kind: 'automatic-energy',
    atom: { earliestSurface, value, source },
  }
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
  const add = (
    metricId: EffectMetric,
    amount: number,
    action?: ActionTarget,
    surface: SurfaceKey = 'fully',
  ) => push(relationships, local(source, metricId, amount, action, surface))
  const allDamage = (amount: number, effectSource = source) => provider(
    effectSource,
    'all-party',
    { kind: 'modifier', metricId: 'dmgBonus', earliestSurface: 'fully', value: amount },
    { formulas: REGULAR_DAMAGE_FORMULAS },
  )

  switch (setup.engineId) {
    case 'thoughtbop':
      push(
        relationships,
        provider(source, 'all-party', {
          kind: 'modifier', metricId: 'dmgBonus', earliestSurface: 'fully',
          value: maximum(W_ENGINE_FACTS.thoughtbop.effects.damage, setup),
        }, { formulas: REGULAR_DAMAGE_FORMULAS }),
        provider(source, 'all-party', {
          kind: 'stat', statId: 'atk', region: 'percentage', earliestSurface: 'fully',
          value: value(W_ENGINE_FACTS.thoughtbop.effects.atk, setup),
        }, { formulas: REGULAR_DAMAGE_FORMULAS }),
        automaticEnergy(source, value(W_ENGINE_FACTS.thoughtbop.effects.energy, setup)),
      )
      break
    case 'weepingCradle':
      push(
        relationships,
        equipmentEffectCanBeActivatedByHolder(
          agent,
          W_ENGINE_FACTS.weepingCradle.effects.damage,
        ) && allDamage(value(W_ENGINE_FACTS.weepingCradle.effects.damage, setup)),
        automaticEnergy(source, value(W_ENGINE_FACTS.weepingCradle.effects.energy, setup)),
      )
      break
    case 'kaboom':
      relationships.push(provider(source, 'all-party', {
        kind: 'stat', statId: 'atk', region: 'percentage', earliestSurface: 'fully',
        value: value(W_ENGINE_FACTS.kaboom.effects.atk, setup), nonstackId: 'kaboomTheCannon',
      }))
      break
    case 'unfetteredGameBall':
      relationships.push(provider(source, 'all-party', {
        kind: 'stat', statId: 'critRate', region: 'flat', earliestSurface: 'fully',
        value: value(W_ENGINE_FACTS.unfetteredGameBall.effects.critRate, setup),
      }, { formulas: CRIT_DAMAGE_FORMULAS }))
      break
    case 'peacekeeperSpecialized':
      push(
        relationships,
        automaticEnergy(source, value(W_ENGINE_FACTS.peacekeeperSpecialized.effects.energyRegen, setup), 'fully'),
        modifier(source, 'anomalyBuildupBonus', value(W_ENGINE_FACTS.peacekeeperSpecialized.effects.buildup, setup), EX_ASSIST_FOLLOW_UP),
      )
      break
    case 'dreamlitHearth':
      push(
        relationships,
        provider(source, 'all-party', {
          kind: 'stat', statId: 'maxHp', region: 'percentage', earliestSurface: 'fully',
          value: value(W_ENGINE_FACTS.dreamlitHearth.effects.maxHp, setup),
        }),
        allDamage(value(W_ENGINE_FACTS.dreamlitHearth.effects.damage, setup)),
        automaticEnergy(source, value(W_ENGINE_FACTS.dreamlitHearth.effects.energy, setup)),
      )
      break
    case 'elegantVanity':
      relationships.push(allDamage(maximum(W_ENGINE_FACTS.elegantVanity.effects.damage, setup)))
      break
    case 'theVault':
      relationships.push(allDamage(value(W_ENGINE_FACTS.theVault.effects.targetDamage, setup)))
      break
    case 'bashfulDemon':
      relationships.push(provider(source, 'all-party', {
        kind: 'stat', statId: 'atk', region: 'percentage', earliestSurface: 'fully',
        value: maximum(W_ENGINE_FACTS.bashfulDemon.effects.atk, setup),
      }, { formulas: REGULAR_DAMAGE_FORMULAS }))
      break
    case 'tusksOfFury':
      push(
        relationships,
        allDamage(value(W_ENGINE_FACTS.tusksOfFury.effects.damage, setup)),
        provider(source, 'all-party', {
          kind: 'modifier', metricId: 'dazeBonus', earliestSurface: 'fully',
          value: value(W_ENGINE_FACTS.tusksOfFury.effects.daze, setup),
        }, { formulas: ['daze_buildup'] }),
      )
      break
    case 'tremorTrigramVessel':
      if (agent === 'ben') add('dmgBonus', value(W_ENGINE_FACTS.tremorTrigramVessel.effects.damage, setup), target('EX Special Attack', 'Ultimate'))
      break
    case 'originalTransmorpher':
      if (observation.baseStats.maxHp !== undefined) add('maxHp', value(W_ENGINE_FACTS.originalTransmorpher.effects.maxHp, setup), undefined, 'combat')
      break
    case 'halfSugarBunny':
      push(
        relationships,
        automaticEnergy(source, value(W_ENGINE_FACTS.halfSugarBunny.effects.automaticEnergy, setup)),
        provider(source, 'all-party', {
          kind: 'stat', statId: 'atk', region: 'percentage', earliestSurface: 'fully',
          value: value(W_ENGINE_FACTS.halfSugarBunny.effects.squadAtk, setup), nonstackId: 'halfSugarBunny',
        }),
        provider(source, 'all-party', {
          kind: 'stat', statId: 'maxHp', region: 'percentage', earliestSurface: 'fully',
          value: value(W_ENGINE_FACTS.halfSugarBunny.effects.squadMaxHp, setup), nonstackId: 'halfSugarBunny',
        }),
        provider(source, 'all-party', {
          kind: 'stat', statId: 'critDmg', region: 'flat', earliestSurface: 'fully',
          value: value(W_ENGINE_FACTS.halfSugarBunny.effects.veilCritDamage, setup),
        }, { formulas: CRIT_DAMAGE_FORMULAS }),
      )
      break
    case 'cordisGermina':
      add('critRate', value(W_ENGINE_FACTS.cordisGermina.effects.critRate, setup), undefined, 'combat')
      if (effectAttributeForAgent(agent) === 'Electric') add('dmgBonus', maximum(W_ENGINE_FACTS.cordisGermina.effects.damage, setup))
      add('defIgnore', value(W_ENGINE_FACTS.cordisGermina.effects.defIgnore, setup), BASIC_ULT)
      break
    case 'severedInnocence':
      add('critDmg', value(W_ENGINE_FACTS.severedInnocence.effects.critDamage, setup), undefined, 'combat')
      add('critDmg', equipmentEffectProgressionValue(W_ENGINE_FACTS.severedInnocence.effects.critDamage, setup.refinement))
      if (effectAttributeForAgent(agent) === 'Electric') add('dmgBonus', value(W_ENGINE_FACTS.severedInnocence.effects.damage, setup))
      break
    case 'heartstringNocturne':
      add('critDmg', value(W_ENGINE_FACTS.heartstringNocturne.effects.critDamage, setup), undefined, 'combat')
      if (effectAttributeForAgent(agent) === 'Fire') {
        add('resIgnore', equipmentEffectProgressionIncrementValue(W_ENGINE_FACTS.heartstringNocturne.effects.fireResIgnore, setup.refinement), CHAIN_ULT, 'combat')
        add('resIgnore', equipmentEffectProgressionIncrementValue(W_ENGINE_FACTS.heartstringNocturne.effects.fireResIgnore, setup.refinement), CHAIN_ULT)
      }
      break
    case 'myriadEclipse':
      add('critDmg', value(W_ENGINE_FACTS.myriadEclipse.effects.critDamage, setup), undefined, 'combat')
      add('defIgnore', value(W_ENGINE_FACTS.myriadEclipse.effects.defIgnore, setup), undefined, 'combat')
      break
    case 'steelCushion':
      if (effectAttributeForAgent(agent) === 'Physical') add('dmgBonus', value(W_ENGINE_FACTS.steelCushion.effects.physicalDamage, setup), undefined, 'combat')
      add('dmgBonus', value(W_ENGINE_FACTS.steelCushion.effects.damage, setup), BACK_ATTACK)
      break
    case 'housekeeper':
      if (agent === 'corin') {
        push(relationships, automaticEnergy(source, value(W_ENGINE_FACTS.housekeeper.effects.energy, setup)))
        add('dmgBonus', maximum(W_ENGINE_FACTS.housekeeper.effects.damage, setup), EX)
      }
      break
    case 'deepSeaVisitor':
      if (agent === 'ellen') {
        add('dmgBonus', value(W_ENGINE_FACTS.deepSeaVisitor.effects.iceDamage, setup), undefined, 'combat')
        add('critRate', value(W_ENGINE_FACTS.deepSeaVisitor.effects.basicCritRate, setup), undefined, 'combat')
        add('critRate', value(W_ENGINE_FACTS.deepSeaVisitor.effects.dashCritRate, setup), undefined, 'combat')
      }
      break
    case 'riotSuppressorMarkVI':
      if (agent === 'zhuYuan') {
        add('critRate', value(W_ENGINE_FACTS.riotSuppressorMarkVI.effects.critRate, setup), undefined, 'combat')
        add('dmgBonus', value(W_ENGINE_FACTS.riotSuppressorMarkVI.effects.chargedEtherDamage, setup), BASIC)
        add('dmgBonus', value(W_ENGINE_FACTS.riotSuppressorMarkVI.effects.chargedEtherDamage, setup), DASH)
      }
      break
    case 'zanshinHerbCase':
      if (agent === 'harumasa') {
        add('critRate', value(W_ENGINE_FACTS.zanshinHerbCase.effects.critRate, setup), undefined, 'combat')
        add('dmgBonus', value(W_ENGINE_FACTS.zanshinHerbCase.effects.dashDamage, setup), DASH)
        add('critRate', value(W_ENGINE_FACTS.zanshinHerbCase.effects.anomalyStunCritRate, setup))
      }
      break
    case 'cloudcleaveRadiance':
      if (effectAttributeForAgent(agent) === 'Physical') add('resIgnore', value(W_ENGINE_FACTS.cloudcleaveRadiance.effects.physicalResIgnore, setup), undefined, 'combat')
      if (agent === 'yeShunguang') {
        add('dmgBonus', value(W_ENGINE_FACTS.cloudcleaveRadiance.effects.etherVeilDamage, setup))
        add('critDmg', value(W_ENGINE_FACTS.cloudcleaveRadiance.effects.etherVeilCritDamage, setup))
      }
      break
    case 'starlightEngine':
      add('atk', value(W_ENGINE_FACTS.starlightEngine.effects.atk, setup), undefined, agent === 'ellen' ? 'combat' : 'fully')
      break
    case 'brimstone':
      add('atk', maximum(W_ENGINE_FACTS.brimstone.effects.atk, setup))
      break
    case 'marcatoDesire':
      add('atk', maximum(W_ENGINE_FACTS.marcatoDesire.effects.atk, setup))
      break
    case 'gildedBlossom':
      add('atk', value(W_ENGINE_FACTS.gildedBlossom.effects.atk, setup), undefined, agent === 'yeShunguang' ? 'combat' : 'fully')
      add('dmgBonus', value(W_ENGINE_FACTS.gildedBlossom.effects.exDamage, setup), EX)
      break
    case 'drillRigRedAxis':
      if (effectAttributeForAgent(agent) === 'Electric') add('dmgBonus', value(W_ENGINE_FACTS.drillRigRedAxis.effects.damage, setup), BASIC_DASH)
      break
    case 'bellicoseBlaze':
      add('critRate', value(W_ENGINE_FACTS.bellicoseBlaze.effects.critRate, setup), undefined, 'combat')
      if (agent === 'orphie') add('defIgnore', maximum(W_ENGINE_FACTS.bellicoseBlaze.effects.fireAftershockDefIgnore, setup), AFTERSHOCK_TARGET)
      break
    case 'serpentineSeeker':
      if (effectAttributeForAgent(agent) === 'Electric') {
        add('critRate', value(W_ENGINE_FACTS.serpentineSeeker.effects.critRate, setup), undefined, 'combat')
        add('defIgnore', value(W_ENGINE_FACTS.serpentineSeeker.effects.defIgnore, setup), undefined, 'combat')
      }
      break
    case 'starlightEngineReplica':
      if (effectAttributeForAgent(agent) === 'Physical') add('dmgBonus', value(W_ENGINE_FACTS.starlightEngineReplica.effects.physicalDamage, setup))
      break
    case 'timeweaver':
      add('anomalyBuildupBonus', value(W_ENGINE_FACTS.timeweaver.effects.electricBuildup, setup), undefined, 'combat')
      add('anomalyProficiency', value(W_ENGINE_FACTS.timeweaver.effects.anomalyProficiency, setup))
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
          gaugeId: 'timeweaverDisorder',
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
      add('anomalyMastery', value(W_ENGINE_FACTS.practicedPerfection.effects.anomalyMastery, setup), undefined, 'combat')
      const physicalDamage = W_ENGINE_FACTS.practicedPerfection.effects.physicalDamage
      if (equipmentEffectAppliesToAttribute(physicalDamage, effectAttributeForAgent(agent))) add('dmgBonus', maximum(physicalDamage, setup))
      break
    }
    case 'fusionCompiler':
      add('atk', value(W_ENGINE_FACTS.fusionCompiler.effects.atk, setup), undefined, 'combat')
      add('anomalyProficiency', maximum(W_ENGINE_FACTS.fusionCompiler.effects.anomalyProficiency, setup))
      break
    case 'electroLipGloss':
      add('atk', value(W_ENGINE_FACTS.electroLipGloss.effects.atk, setup))
      add('dmgBonus', value(W_ENGINE_FACTS.electroLipGloss.effects.damage, setup))
      break
    case 'weepingGemini':
      add('anomalyProficiency', maximum(W_ENGINE_FACTS.weepingGemini.effects.anomalyProficiency, setup))
      break
    case 'sharpenedStinger':
      add('dmgBonus', maximum(W_ENGINE_FACTS.sharpenedStinger.effects.physicalDamage, setup))
      add('anomalyBuildupBonus', value(W_ENGINE_FACTS.sharpenedStinger.effects.buildup, setup))
      break
    case 'roaringRide':
      add('atk', value(W_ENGINE_FACTS.roaringRide.effects.atk, setup))
      add('anomalyProficiency', value(W_ENGINE_FACTS.roaringRide.effects.anomalyProficiency, setup))
      add('anomalyBuildupBonus', value(W_ENGINE_FACTS.roaringRide.effects.buildup, setup))
      break
    case 'metanukimorphosis':
      add('anomalyMastery', value(W_ENGINE_FACTS.metanukimorphosis.effects.anomalyMastery, setup))
      relationships.push(provider(source, 'all-party', {
        kind: 'stat', statId: 'anomalyProficiency', region: 'flat', earliestSurface: 'fully',
        value: value(W_ENGINE_FACTS.metanukimorphosis.effects.anomalyProficiency, setup),
      }, { formulas: ['anomaly_damage'] }))
      break
    case 'flamemakerShaker':
      add('dmgBonus', maximum(W_ENGINE_FACTS.flamemakerShaker.effects.damage, setup))
      add('anomalyProficiency', value(W_ENGINE_FACTS.flamemakerShaker.effects.anomalyProficiency, setup))
      relationships.push(automaticEnergy(source, value(W_ENGINE_FACTS.flamemakerShaker.effects.offFieldEnergy, setup)))
      break
    case 'flightOfFancy':
      add('anomalyProficiency', maximum(W_ENGINE_FACTS.flightOfFancy.effects.anomalyProficiency, setup))
      add('anomalyBuildupBonus', value(W_ENGINE_FACTS.flightOfFancy.effects.etherBuildup, setup))
      break
    case 'angelInTheShell': {
      const interval = operatingIntervalFor(agent, focusAgentId)
      const proficiency = W_ENGINE_FACTS.angelInTheShell.effects.anomalyProficiency
      const damage = W_ENGINE_FACTS.angelInTheShell.effects.damage
      const anomalyDamage = W_ENGINE_FACTS.angelInTheShell.effects.anomalyDamage
      if (equipmentEffectAppliesInOperatingInterval(proficiency, interval)) add('anomalyProficiency', value(proficiency, setup))
      if (equipmentEffectAppliesInOperatingInterval(damage, interval)) add('dmgBonus', value(damage, setup))
      if (equipmentEffectAppliesInOperatingInterval(anomalyDamage, interval)) {
        add('anomalyDmgBonus', value(anomalyDamage, setup), ATTRIBUTE_ANOMALY_TARGET)
        add('anomalyDmgBonus', value(anomalyDamage, setup), DISORDER_TARGET)
      }
      break
    }
    case 'frostfallSickle':
      add('dmgBonus', maximum(W_ENGINE_FACTS.frostfallSickle.effects.iceDamage, setup))
      add('anomalyDmgBonus', value(W_ENGINE_FACTS.frostfallSickle.effects.abloomDamage, setup), actionTarget([sourceLocalAction('Abloom')]))
      break
    case 'qingming':
      add('critRate', value(W_ENGINE_FACTS.qingming.effects.critRate, setup), undefined, 'combat')
      if (agent === 'yixuan') {
        add('dmgBonus', value(W_ENGINE_FACTS.qingming.effects.damage, setup), undefined, 'combat')
        add('sheerDmgBonus', value(W_ENGINE_FACTS.qingming.effects.sheerDamage, setup), target('EX Special Attack', 'Ultimate'), 'combat')
      }
      break
    case 'cauldron':
      add('critRate', value(W_ENGINE_FACTS.cauldron.effects.critRate, setup))
      add('dmgBonus', value(W_ENGINE_FACTS.cauldron.effects.damage, setup))
      break
    case 'radiowave':
      add('sheerForce', value(W_ENGINE_FACTS.radiowave.effects.sheerForce, setup))
      break
    case 'puzzleSphere':
      add('critDmg', value(W_ENGINE_FACTS.puzzleSphere.effects.critDamage, setup))
      add('dmgBonus', value(W_ENGINE_FACTS.puzzleSphere.effects.damage, setup), EX)
      break
    case 'krakensCradle':
      if (agent === 'yidhari') {
        add('critRate', value(W_ENGINE_FACTS.krakensCradle.effects.critRate, setup))
        add('sheerDmgBonus', maximum(W_ENGINE_FACTS.krakensCradle.effects.iceSheerDamage, setup))
      }
      break
    case 'grillOWisp':
      if (agent === 'manato' || agent === 'banyue') {
        add('critRate', value(W_ENGINE_FACTS.grillOWisp.effects.critRate, setup))
        add('dmgBonus', value(W_ENGINE_FACTS.grillOWisp.effects.fireDamage, setup), undefined, 'combat')
      } else if (agent === 'starlightBilly') add('critRate', value(W_ENGINE_FACTS.grillOWisp.effects.critRate, setup))
      break
    case 'wrathfulVajra':
      if (agent === 'manato' || agent === 'banyue') {
        add('critRate', value(W_ENGINE_FACTS.wrathfulVajra.effects.critRate, setup), undefined, 'combat')
        add('sheerDmgBonus', maximum(W_ENGINE_FACTS.wrathfulVajra.effects.fireSheerDamage, setup), EX)
      }
      break
    case 'starlightRiderFaceplate':
      if (agent === 'starlightBilly') {
        add('critRate', value(W_ENGINE_FACTS.starlightRiderFaceplate.effects.critRate, setup), undefined, 'combat')
        add('sheerDmgBonus', maximum(W_ENGINE_FACTS.starlightRiderFaceplate.effects.physicalSheerDamage, setup))
      }
      break
    case 'yesterdayCalls':
      if (agent === 'dialyn') {
        relationships.push(automaticEnergy(source, value(W_ENGINE_FACTS.yesterdayCalls.effects.energy, setup)))
        add('dazeBonus', value(W_ENGINE_FACTS.yesterdayCalls.effects.daze, setup))
        relationships.push(provider(source, 'all-party', {
          kind: 'stat', statId: 'critDmg', region: 'flat', earliestSurface: 'fully',
          value: value(W_ENGINE_FACTS.yesterdayCalls.effects.critDamage, setup),
        }, { formulas: CRIT_DAMAGE_FORMULAS }))
      }
      break
    case 'hellfireGears':
      add('impact', ['trigger', 'koleda', 'anby'].includes(agent)
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
        relationships.push(automaticEnergy(source, value(energy, setup)))
      }
      break
    case 'steamOven':
      if (['dialyn', 'trigger', 'lycaon', 'juFufu', 'pulchra', 'qingyi', 'koleda', 'anby'].includes(agent)) {
        add('impact', ['lycaon', 'qingyi', 'koleda', 'anby'].includes(agent)
          ? maximum(W_ENGINE_FACTS.steamOven.effects.impact, setup)
          : value(W_ENGINE_FACTS.steamOven.effects.impact, setup))
      }
      break
    case 'spectralGaze':
      if (agent === 'trigger') {
        relationships.push(provider(source, 'enemy-context', {
          kind: 'modifier', metricId: 'defReduction', earliestSurface: 'fully',
          value: value(W_ENGINE_FACTS.spectralGaze.effects.defReduction, setup),
        }, { formulas: ['general_damage'] }))
        add('impact', maximum(W_ENGINE_FACTS.spectralGaze.effects.impact, setup))
      }
      break
    case 'iceJadeTeapot':
      if (['trigger', 'lighter', 'qingyi'].includes(agent)) {
        add('impact', maximum(W_ENGINE_FACTS.iceJadeTeapot.effects.impact, setup))
        relationships.push(allDamage(value(W_ENGINE_FACTS.iceJadeTeapot.effects.damage, setup)))
      }
      break
    case 'blazingLaurel':
      if (['trigger', 'lycaon', 'juFufu', 'lighter', 'pulchra', 'qingyi', 'koleda', 'anby'].includes(agent)) {
        add('impact', value(W_ENGINE_FACTS.blazingLaurel.effects.impact, setup))
        relationships.push(provider(source, 'all-party', {
          kind: 'stat', statId: 'critDmg', region: 'flat', earliestSurface: 'fully',
          value: maximum(W_ENGINE_FACTS.blazingLaurel.effects.critDamage, setup),
        }, { attributes: ['Fire', 'Ice'], formulas: CRIT_DAMAGE_FORMULAS }))
      }
      break
    case 'restrained':
      add('dazeBonus', maximum(W_ENGINE_FACTS.restrained.effects.daze, setup), agent === 'trigger'
        ? BASIC_AFTERSHOCK_TARGET
        : ['lycaon', 'lighter', 'qingyi', 'koleda', 'anby'].includes(agent)
          ? BASIC
          : undefined)
      if (agent === 'qingyi') add('dmgBonus', maximum(W_ENGINE_FACTS.restrained.effects.damage, setup), BASIC)
      break
    case 'preciousFossilizedCore':
      add('dazeBonus', maximum(W_ENGINE_FACTS.preciousFossilizedCore.effects.daze, setup))
      break
    case 'roaringFurnace':
      if (agent === 'juFufu' || agent === 'nangongYu') {
        add('dazeBonus', value(W_ENGINE_FACTS.roaringFurnace.effects.daze, setup), EX_CHAIN_ULT)
        if (equipmentEffectCanBeActivatedByHolder(agent, W_ENGINE_FACTS.roaringFurnace.effects.damage)) {
          relationships.push(allDamage(maximum(W_ENGINE_FACTS.roaringFurnace.effects.damage, setup)))
        }
      }
      break
    case 'boxCutter':
      if (agent === 'pulchra') add('dazeBonus', value(W_ENGINE_FACTS.boxCutter.effects.daze, setup))
      break
    case 'simmeringPot':
      if (agent === 'lycaon' || agent === 'nangongYu') {
        add('dazeBonus', value(W_ENGINE_FACTS.simmeringPot.effects.daze, setup))
        if (agent === 'nangongYu') add('dmgBonus', value(W_ENGINE_FACTS.simmeringPot.effects.damage, setup))
      }
      break
    case 'neonFantasies':
      if (agent === 'nangongYu') {
        relationships.push(stat(source, 'anomalyProficiency', value(W_ENGINE_FACTS.neonFantasies.effects.anomalyProficiency, setup), 'flat', 'initial'))
        relationships.push(stat(source, 'anomalyProficiency', value(W_ENGINE_FACTS.neonFantasies.effects.maximumAnomalyProficiency, setup), 'flat', 'fully', 'At maximum stacks'))
        relationships.push(allDamage(maximum(W_ENGINE_FACTS.neonFantasies.effects.damage, setup)))
      }
      break
  }
  return relationships
}
