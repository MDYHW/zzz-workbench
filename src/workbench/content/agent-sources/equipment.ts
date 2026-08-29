import { effectAttributeForAgent } from '../../formula-policy'
import type { EffectMetric } from '../../effects'
import type {
  ProfileRelationship,
} from '../../calculation/relationships'
import { selectSource, type SelectedSourceInstance } from '../../calculation/source-instance'
import type { StatId } from '../../calculation/stat-composer'
import { ADMITTED_AGENTS } from '../agents'
import {
  DRIVE_DISC_FACTS,
  DRIVE_DISCS,
} from '../discs'
import { W_ENGINES } from '../engines'
import {
  EFFECTIVE_SUBSTAT_VALUES,
  FIXED_MAIN_STATS,
  MAIN_STATS,
  effectiveSubstatChoices,
} from '../setup-options'
import { SOURCE_LABELS } from '../retained-values'
import {
  equipmentEffectStatMeaning,
  setupStatMeaning,
  type StatInputMeaning,
} from '../stat-meanings'
import {
  defineAgentBaseSource,
  defineDriveDiscSource,
  defineEditableMainSource,
  defineEffectiveSubstatSource,
  defineFixedMainSource,
  defineWEngineBaseSource,
  defineWEngineSource,
} from '../source-definitions'
import {
  equipmentEffectBaseValue,
  type AgentId,
  type DiscId,
  type EngineId,
  type EquipmentEffectFact,
  type MainSlot,
  type MainStatId,
  type Refinement,
  type SubstatChoice,
  type SubstatId,
} from '../types'
import { selectedDriveDiscRelationships } from './drive-disc-relationships'
import { projectEquipmentEffectRelationships } from './equipment-effect-relationships'
export {
  equipmentEffectActionTargets,
  equipmentEffectAppliesInOperatingInterval,
  equipmentEffectCanBeActivated,
} from './equipment-eligibility'
import { selectedWEngineRelationships } from './w-engine-relationships'
import { equipmentEffectActionTargets } from './equipment-eligibility'

export interface CompleteSelectedSetup {
  engineId: EngineId
  refinement: Refinement
  fourPieceId: DiscId
  twoPieceId: DiscId
  mains: Record<MainSlot, MainStatId>
  substats: Partial<Record<SubstatId, number>>
}

export interface SelectedSetupObservation {
  baseStats: Readonly<Partial<Record<StatId, number>>>
  modifierMetrics?: readonly EffectMetric[]
  effectiveSubstats?: readonly SubstatChoice[]
}

export interface SelectedEquipmentContext {
  observation: SelectedSetupObservation
  focusAgentId: AgentId
  partyAgentIds: readonly AgentId[]
}

const elementalMainStats: readonly MainStatId[] = [
  'etherDmg', 'physicalDmg', 'electricDmg', 'fireDmg', 'iceDmg',
]

export function requireCompleteSelectedSetup(
  setup: {
    engineId: EngineId | null
    refinement: Refinement | null
    fourPieceId: DiscId | null
    twoPieceId: DiscId | null
    mains: Record<MainSlot, MainStatId | null>
    substats: Partial<Record<SubstatId, number>>
  },
): CompleteSelectedSetup {
  if (
    !setup.engineId
    || !setup.refinement
    || !setup.fourPieceId
    || !setup.twoPieceId
    || !setup.mains.slot4
    || !setup.mains.slot5
    || !setup.mains.slot6
  ) throw new Error('Source profiles require a complete selected setup')
  return {
    engineId: setup.engineId,
    refinement: setup.refinement,
    fourPieceId: setup.fourPieceId,
    twoPieceId: setup.twoPieceId,
    mains: {
      slot4: setup.mains.slot4,
      slot5: setup.mains.slot5,
      slot6: setup.mains.slot6,
    },
    substats: setup.substats,
  }
}

export function selectedWEngineSource(
  agentId: AgentId,
  appliedPartySlot: 0 | 1 | 2,
  setup: CompleteSelectedSetup,
): SelectedSourceInstance {
  const engine = W_ENGINES[setup.engineId]
  return selectSource(
    defineWEngineSource(setup.engineId, engine.name),
    agentId,
    appliedPartySlot,
    { kind: 'refinement', refinement: setup.refinement },
  )
}

export function selectedDiscSource(
  agentId: AgentId,
  appliedPartySlot: 0 | 1 | 2,
  setup: CompleteSelectedSetup,
  discId: DiscId,
  effectPiece: '2-piece' | '4-piece',
): SelectedSourceInstance {
  const selectedRole = setup.fourPieceId === discId
    ? '4-piece'
    : setup.twoPieceId === discId
      ? '2-piece'
      : null
  if (!selectedRole) throw new Error(`${discId} is not selected by ${agentId}`)
  return selectSource(
    defineDriveDiscSource(discId, effectPiece, DRIVE_DISCS[discId].name),
    agentId,
    appliedPartySlot,
    { kind: 'drive-disc', selectedRole, effectPiece },
  )
}

export function isWEnginePassiveEligible(agentId: AgentId, engineId: EngineId): boolean {
  return W_ENGINES[engineId].passiveSpecialty
    === ADMITTED_AGENTS.find(({ id }) => id === agentId)?.specialty
}

function statRelationship(
  source: SelectedSourceInstance,
  meaning: StatInputMeaning,
  value: number,
  sourceDetail?: string,
): ProfileRelationship {
  return {
    kind: 'stat',
    atom: {
      statId: meaning.statId,
      region: meaning.region,
      earliestSurface: 'initial',
      value,
      source,
      ...(sourceDetail ? { sourceDetail } : {}),
    },
  }
}

function admittedStat(
  observation: SelectedSetupObservation,
  meaning: StatInputMeaning,
): boolean {
  return observation.baseStats[meaning.statId] !== undefined
}

function baseRelationships(
  agentId: AgentId,
  appliedPartySlot: 0 | 1 | 2,
  setup: CompleteSelectedSetup,
  observation: SelectedSetupObservation,
): ProfileRelationship[] {
  const agentName = ADMITTED_AGENTS.find(({ id }) => id === agentId)?.name ?? agentId
  const baseSource = selectSource(
    defineAgentBaseSource(agentId, `${agentName} base stats`),
    agentId,
    appliedPartySlot,
  )
  const relationships: ProfileRelationship[] = Object.entries(observation.baseStats).map(([statId, value]) => ({
    kind: 'stat' as const,
    atom: {
      statId: statId as StatId,
      region: 'base' as const,
      earliestSurface: 'initial' as const,
      value: value!,
      source: baseSource,
    },
  }))

  if (observation.baseStats.atk !== undefined) {
    relationships.push({
      kind: 'stat',
      atom: {
        statId: 'atk', region: 'base', earliestSurface: 'initial',
        value: W_ENGINES[setup.engineId].baseAtk,
        source: selectSource(
          defineWEngineBaseSource(setup.engineId, W_ENGINES[setup.engineId].name),
          agentId,
          appliedPartySlot,
          { kind: 'refinement', refinement: setup.refinement },
        ),
      },
    })
  }

  const fixed = [
    { statId: 'maxHp' as const, fixed: FIXED_MAIN_STATS.slot1 },
    { statId: 'atk' as const, fixed: FIXED_MAIN_STATS.slot2 },
    { statId: 'def' as const, fixed: FIXED_MAIN_STATS.slot3 },
  ]
  for (const { statId, fixed: input } of fixed) {
    if (observation.baseStats[statId] === undefined) continue
    relationships.push({
      kind: 'stat',
      atom: {
        statId, region: 'flat', earliestSurface: 'initial',
        value: input.numericValue,
        source: selectSource(
          defineFixedMainSource(input.slot, input.stat, `Drive Disc · ${input.slot}`),
          agentId,
          appliedPartySlot,
        ),
      },
    })
  }
  return relationships
}

function advancedRelationship(
  agentId: AgentId,
  appliedPartySlot: 0 | 1 | 2,
  setup: CompleteSelectedSetup,
  observation: SelectedSetupObservation,
): ProfileRelationship[] {
  const advanced = W_ENGINES[setup.engineId].advancedStat
  const meaning = setupStatMeaning(advanced.id)
  if (!meaning) {
    throw new Error(`No current stat meaning for ${advanced.id} W-Engine advanced stat`)
  }
  if (!admittedStat(observation, meaning)) return []
  return [statRelationship(
    selectedWEngineSource(agentId, appliedPartySlot, setup),
    meaning,
    advanced.value,
  )]
}

function mainRelationships(
  agentId: AgentId,
  appliedPartySlot: 0 | 1 | 2,
  setup: CompleteSelectedSetup,
  observation: SelectedSetupObservation,
): ProfileRelationship[] {
  return (['slot4', 'slot5', 'slot6'] as const).flatMap((slot) => {
    const statId = setup.mains[slot]
    const source = selectSource(
      defineEditableMainSource(slot, statId, SOURCE_LABELS[slot]),
      agentId,
      appliedPartySlot,
      { kind: 'main-stat', statId },
    )
    const meaning = setupStatMeaning(statId)
    if (meaning && admittedStat(observation, meaning)) {
      return [statRelationship(source, meaning, MAIN_STATS[statId].numericValue)]
    }
    if (
      elementalMainStats.includes(statId)
      && observation.modifierMetrics?.includes('dmgBonus')
    ) {
      return [{
        kind: 'modifier' as const,
        atom: {
          metricId: 'dmgBonus' as const,
          earliestSurface: 'initial' as const,
          value: MAIN_STATS[statId].numericValue,
          source,
        },
      }]
    }
    return []
  })
}

function substatRelationships(
  agentId: AgentId,
  appliedPartySlot: 0 | 1 | 2,
  setup: CompleteSelectedSetup,
  observation: SelectedSetupObservation,
): ProfileRelationship[] {
  return (observation.effectiveSubstats ?? effectiveSubstatChoices(agentId, setup))
    .flatMap((choice, index) => {
    const meaning = setupStatMeaning(choice.id)
    if (!meaning) throw new Error(`No current stat meaning for ${choice.id} substat`)
    if (!admittedStat(observation, meaning)) return []
    const count = setup.substats[choice.id]
    if (!Number.isFinite(count)) {
      throw new Error(`Missing effective substat count: ${agentId}:${choice.id}`)
    }
    return [statRelationship(
      selectSource(
        defineEffectiveSubstatSource(
          (index + 1) as 1 | 2 | 3,
          choice.id,
          'Effective substat hits',
        ),
        agentId,
        appliedPartySlot,
        {
          kind: 'effective-substat',
          position: (index + 1) as 1 | 2 | 3,
          statId: choice.id,
          count: count!,
        },
      ),
      meaning,
      count! * EFFECTIVE_SUBSTAT_VALUES[choice.id].perHit,
      choice.label,
    )]
    })
}

function twoPieceEffectIsInitial(
  effect: EquipmentEffectFact,
  agentId: AgentId,
): boolean {
  const scope = effect.scope
  if (
    scope?.recipient
    || scope?.actions
    || scope?.anomalyResults
    || scope?.tags
    || scope?.condition
  ) return false
  return effect.modifier === 'dmgBonus'
    ? scope?.attributes?.includes(effectAttributeForAgent(agentId)) === true
    : !scope?.attributes
}

function discTwoPieceRelationships(
  agentId: AgentId,
  appliedPartySlot: 0 | 1 | 2,
  setup: CompleteSelectedSetup,
  observation: SelectedSetupObservation,
): ProfileRelationship[] {
  const relationships: ProfileRelationship[] = []
  for (const discId of [setup.fourPieceId, setup.twoPieceId] as const) {
    for (const effect of Object.values(DRIVE_DISC_FACTS[discId].twoPiece) as EquipmentEffectFact[]) {
      if (!twoPieceEffectIsInitial(effect, agentId)) {
        const actions = equipmentEffectActionTargets(effect)
        if (
          actions.length
          && (effect.modifier === 'dmgBonus' || effect.modifier === 'dazeBonus')
          && observation.modifierMetrics?.includes(effect.modifier)
        ) {
          relationships.push(...projectEquipmentEffectRelationships({
            source: selectedDiscSource(
              agentId,
              appliedPartySlot,
              setup,
              discId,
              '2-piece',
            ),
            fact: effect,
            amount: equipmentEffectBaseValue(effect),
            earliestSurface: 'initial',
          }))
        }
        continue
      }
      if (effect.unit === '/s') {
        throw new Error(`Per-second Disc effect cannot be an Initial stat: ${discId}`)
      }
      const source = selectedDiscSource(
        agentId,
        appliedPartySlot,
        setup,
        discId,
        '2-piece',
      )
      const meaning = equipmentEffectStatMeaning(effect)
      if (meaning && admittedStat(observation, meaning)) {
        relationships.push(...projectEquipmentEffectRelationships({
          source,
          fact: effect,
          amount: equipmentEffectBaseValue(effect),
          earliestSurface: 'initial',
        }))
      } else if (
        (effect.modifier === 'dmgBonus' || effect.modifier === 'dazeBonus')
        && observation.modifierMetrics?.includes(effect.modifier)
      ) {
        relationships.push(...projectEquipmentEffectRelationships({
          source,
          fact: effect,
          amount: equipmentEffectBaseValue(effect),
          earliestSurface: 'initial',
        }))
      }
    }
  }
  return relationships
}

/**
 * Observes setup inputs with an admitted stat or modifier consumer. Shared
 * effect clauses use one stat/action vocabulary. Selected equipment
 * materializers resolve later activation, delivery, interval, and surfaces.
 */
export function selectedSetupRelationships(
  agentId: AgentId,
  appliedPartySlot: 0 | 1 | 2,
  setup: CompleteSelectedSetup,
  observation: SelectedSetupObservation,
): ProfileRelationship[] {
  return [
    ...baseRelationships(agentId, appliedPartySlot, setup, observation),
    ...advancedRelationship(agentId, appliedPartySlot, setup, observation),
    ...mainRelationships(agentId, appliedPartySlot, setup, observation),
    ...substatRelationships(agentId, appliedPartySlot, setup, observation),
    ...discTwoPieceRelationships(agentId, appliedPartySlot, setup, observation),
  ]
}

/**
 * Materializes the selected equipment package after common base, main-stat,
 * substat, advanced-stat, and ordinary 2-piece inputs have been observed.
 * Equipment IDs are interpreted only by their owning materializers.
 */
export function selectedEquipmentRelationships(
  agentId: AgentId,
  appliedPartySlot: 0 | 1 | 2,
  setup: CompleteSelectedSetup,
  { observation, focusAgentId, partyAgentIds }: SelectedEquipmentContext,
): ProfileRelationship[] {
  const engineSource = selectedWEngineSource(agentId, appliedPartySlot, setup)
  const discSource = selectedDiscSource(
    agentId,
    appliedPartySlot,
    setup,
    setup.fourPieceId,
    '4-piece',
  )
  return [
    ...selectedWEngineRelationships({
      agentId,
      appliedPartySlot,
      setup,
      observation,
      focusAgentId,
      partyAgentIds,
      source: engineSource,
      passiveEligible: isWEnginePassiveEligible(agentId, setup.engineId),
    }),
    ...selectedDriveDiscRelationships({
      agentId,
      appliedPartySlot,
      setup,
      observation,
      focusAgentId,
      partyAgentIds,
      source: discSource,
    }),
  ]
}
