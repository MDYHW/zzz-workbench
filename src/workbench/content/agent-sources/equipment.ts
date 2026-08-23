import {
  CRIT_DAMAGE_FORMULAS,
  effectAttributeForAgent,
  REGULAR_DAMAGE_FORMULAS,
} from '../../formula-policy'
import type { EffectMetric } from '../../effects'
import type { ProfileRelationship } from '../../calculation/relationships'
import { selectSource, type SelectedSourceInstance } from '../../calculation/source-instance'
import type { StatId, StatRegion } from '../../calculation/stat-composer'
import { ADMITTED_AGENTS } from '../agents'
import type { OperatingInterval } from '../setup-policies'
import {
  DRIVE_DISC_FACTS,
  DRIVE_DISCS,
} from '../discs'
import { W_ENGINE_FACTS, W_ENGINES } from '../engines'
import {
  EFFECTIVE_SUBSTAT_VALUES,
  FIXED_MAIN_STATS,
  MAIN_STATS,
  effectiveSubstatChoices,
} from '../setup-options'
import { SOURCE_LABELS } from '../retained-values'
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
  equipmentEffectMaximumValue,
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

/** Resolves only the operating-interval conditions retained by equipment facts. */
export function equipmentEffectAppliesInOperatingInterval(
  effect: EquipmentEffectFact,
  interval: OperatingInterval | null,
): boolean {
  if (effect.scope?.condition === 'offField') return interval === 'off-field'
  return !(
    effect.activation?.kind === 'trigger'
    && effect.activation.removedOffField
    && interval === 'off-field'
  )
}

const EQUIPPER_ATTACK_TRIGGER_UNAVAILABLE_IN_PREPARED_INTERVAL = new Set<AgentId>(['sunna'])

/** Resolves holder capability only after the selected equipment fact supplies the trigger meaning. */
export function equipmentEffectCanBeActivatedByHolder(
  agentId: AgentId,
  effect: EquipmentEffectFact,
): boolean {
  if (
    effect.activation?.kind === 'trigger'
    && effect.activation.performer === 'equipper'
    && effect.activation.attributes !== undefined
    && !effect.activation.attributes.includes(effectAttributeForAgent(agentId))
  ) return false
  return !(
    effect.activation?.kind === 'trigger'
    && effect.activation.performer === 'equipper'
    && EQUIPPER_ATTACK_TRIGGER_UNAVAILABLE_IN_PREPARED_INTERVAL.has(agentId)
  )
}

interface StatInputMeaning {
  statId: StatId
  region: Exclude<StatRegion, 'base'>
}

const mainStatMeanings: Partial<Record<MainStatId, StatInputMeaning>> = {
  critRate: { statId: 'critRate', region: 'flat' },
  critDmg: { statId: 'critDmg', region: 'flat' },
  hpPct: { statId: 'maxHp', region: 'percentage' },
  atkPct: { statId: 'atk', region: 'percentage' },
  penRatio: { statId: 'penRatio', region: 'flat' },
  impact: { statId: 'impact', region: 'percentage' },
  energyRegenPct: { statId: 'energyRegen', region: 'percentage' },
  defPct: { statId: 'def', region: 'percentage' },
  anomalyProficiency: { statId: 'anomalyProficiency', region: 'flat' },
  anomalyMastery: { statId: 'anomalyMastery', region: 'percentage' },
}

const advancedStatMeanings = {
  hpPct: { statId: 'maxHp', region: 'percentage' },
  atkPct: { statId: 'atk', region: 'percentage' },
  defPct: { statId: 'def', region: 'percentage' },
  critRate: { statId: 'critRate', region: 'flat' },
  critDmg: { statId: 'critDmg', region: 'flat' },
  impactPct: { statId: 'impact', region: 'percentage' },
  energyRegenPct: { statId: 'energyRegen', region: 'percentage' },
  penRatio: { statId: 'penRatio', region: 'flat' },
  anomalyProficiency: { statId: 'anomalyProficiency', region: 'flat' },
  anomalyMastery: { statId: 'anomalyMastery', region: 'percentage' },
} as const satisfies Record<string, StatInputMeaning>

const substatMeanings: Record<SubstatId, StatInputMeaning> = {
  critRate: { statId: 'critRate', region: 'flat' },
  critDmg: { statId: 'critDmg', region: 'flat' },
  hpPct: { statId: 'maxHp', region: 'percentage' },
  hpFlat: { statId: 'maxHp', region: 'flat' },
  atkPct: { statId: 'atk', region: 'percentage' },
  atkFlat: { statId: 'atk', region: 'flat' },
  anomalyProficiency: { statId: 'anomalyProficiency', region: 'flat' },
}

const discStatMeanings: Partial<Record<EquipmentEffectFact['modifier'], StatInputMeaning>> = {
  maxHp: { statId: 'maxHp', region: 'percentage' },
  atk: { statId: 'atk', region: 'percentage' },
  impact: { statId: 'impact', region: 'percentage' },
  critRate: { statId: 'critRate', region: 'flat' },
  critDmg: { statId: 'critDmg', region: 'flat' },
  energyRegen: { statId: 'energyRegen', region: 'percentage' },
  penRatio: { statId: 'penRatio', region: 'flat' },
  anomalyProficiency: { statId: 'anomalyProficiency', region: 'flat' },
  anomalyMastery: { statId: 'anomalyMastery', region: 'percentage' },
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

/** Exact party-facing passives shared unchanged across current profile families. */
export function sharedPartyEquipmentRelationships(
  agentId: AgentId,
  appliedPartySlot: 0 | 1 | 2,
  setup: CompleteSelectedSetup,
): ProfileRelationship[] {
  const relationships: ProfileRelationship[] = []
  const engine = selectedWEngineSource(agentId, appliedPartySlot, setup)
  const passiveEligible = isWEnginePassiveEligible(agentId, setup.engineId)
  if (passiveEligible) switch (setup.engineId) {
    case 'thoughtbop':
      relationships.push(
        {
          kind: 'provider', source: engine,
          delivery: { recipient: 'all-party', formulas: REGULAR_DAMAGE_FORMULAS },
          effect: {
            kind: 'modifier', metricId: 'dmgBonus', earliestSurface: 'fully',
            value: equipmentEffectMaximumValue(W_ENGINE_FACTS.thoughtbop.effects.damage, setup.refinement),
          },
        },
        {
          kind: 'provider', source: engine,
          delivery: { recipient: 'all-party', formulas: REGULAR_DAMAGE_FORMULAS },
          effect: {
            kind: 'stat', statId: 'atk', region: 'percentage', earliestSurface: 'fully',
            value: equipmentEffectBaseValue(W_ENGINE_FACTS.thoughtbop.effects.atk, setup.refinement),
          },
        },
        {
          kind: 'automatic-energy',
          atom: { earliestSurface: 'combat', value: equipmentEffectBaseValue(W_ENGINE_FACTS.thoughtbop.effects.energy, setup.refinement), source: engine },
        },
      )
      break
    case 'weepingCradle': {
      const damage = W_ENGINE_FACTS.weepingCradle.effects.damage
      relationships.push(
        ...(equipmentEffectCanBeActivatedByHolder(agentId, damage) ? [{
          kind: 'provider', source: engine,
          delivery: { recipient: 'all-party', formulas: REGULAR_DAMAGE_FORMULAS },
          effect: {
            kind: 'modifier', metricId: 'dmgBonus', earliestSurface: 'fully',
            value: equipmentEffectBaseValue(
              damage,
              setup.refinement,
            ),
          },
        } satisfies ProfileRelationship] : []),
        {
          kind: 'automatic-energy',
          atom: {
            earliestSurface: 'combat',
            value: equipmentEffectBaseValue(
              W_ENGINE_FACTS.weepingCradle.effects.energy,
              setup.refinement,
            ),
            source: engine,
          },
        },
      )
      break
    }
    case 'kaboom':
      relationships.push({
        kind: 'provider', source: engine,
        delivery: { recipient: 'all-party', formulas: REGULAR_DAMAGE_FORMULAS },
        effect: {
          kind: 'stat', statId: 'atk', region: 'percentage', earliestSurface: 'fully',
          value: equipmentEffectBaseValue(W_ENGINE_FACTS.kaboom.effects.atk, setup.refinement),
          nonstackId: 'kaboomTheCannon',
        },
      })
      break
    case 'unfetteredGameBall':
      relationships.push({
        kind: 'provider', source: engine,
        delivery: { recipient: 'all-party', formulas: CRIT_DAMAGE_FORMULAS },
        effect: {
          kind: 'stat', statId: 'critRate', region: 'flat', earliestSurface: 'fully',
          value: equipmentEffectBaseValue(
            W_ENGINE_FACTS.unfetteredGameBall.effects.critRate,
            setup.refinement,
          ),
        },
      })
      break
  }

  const disc = selectedDiscSource(
    agentId,
    appliedPartySlot,
    setup,
    setup.fourPieceId,
    '4-piece',
  )
  switch (setup.fourPieceId) {
    case 'swingJazz':
      relationships.push({
        kind: 'provider', source: disc,
        delivery: { recipient: 'all-party', formulas: REGULAR_DAMAGE_FORMULAS },
        effect: {
          kind: 'modifier', metricId: 'dmgBonus', earliestSurface: 'fully',
          value: equipmentEffectBaseValue(DRIVE_DISC_FACTS.swingJazz.fourPiece.damage),
          nonstackId: 'swingJazz',
        },
      })
      break
    case 'moonlight':
      relationships.push({
        kind: 'provider', source: disc,
        delivery: { recipient: 'all-party', formulas: REGULAR_DAMAGE_FORMULAS },
        effect: {
          kind: 'modifier', metricId: 'dmgBonus', earliestSurface: 'fully',
          value: equipmentEffectBaseValue(DRIVE_DISC_FACTS.moonlight.fourPiece.damage),
          nonstackId: 'moonlightLullaby',
        },
      })
      break
    case 'astralVoice':
      relationships.push({
        kind: 'provider', source: disc,
        delivery: { recipient: 'focus', formulas: REGULAR_DAMAGE_FORMULAS },
        effect: {
          kind: 'modifier', metricId: 'dmgBonus', earliestSurface: 'fully',
          value: equipmentEffectBaseValue(DRIVE_DISC_FACTS.astralVoice.fourPiece.damage),
          nonstackId: 'astralVoiceEntrant',
        },
      })
      break
  }
  return relationships
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
  if (!(advanced.id in advancedStatMeanings)) {
    throw new Error(`No current stat meaning for ${advanced.id} W-Engine advanced stat`)
  }
  const meaning = advancedStatMeanings[
    advanced.id as keyof typeof advancedStatMeanings
  ]
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
    const meaning = mainStatMeanings[statId]
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
    const meaning = substatMeanings[choice.id]
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
      if (!twoPieceEffectIsInitial(effect, agentId)) continue
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
      const meaning = discStatMeanings[effect.modifier]
      if (meaning && admittedStat(observation, meaning)) {
        relationships.push(statRelationship(source, meaning, equipmentEffectBaseValue(effect)))
      } else if (
        (effect.modifier === 'dmgBonus' || effect.modifier === 'dazeBonus')
        && observation.modifierMetrics?.includes(effect.modifier)
      ) {
        relationships.push({
          kind: 'modifier',
          atom: {
            metricId: effect.modifier,
            earliestSurface: 'initial',
            value: equipmentEffectBaseValue(effect),
            source,
          },
        })
      }
    }
  }
  return relationships
}

/**
 * Observes only setup inputs with an admitted stat or modifier consumer. W-Engine
 * and 4-piece passives remain explicit profile relationships because their
 * activation and operating interval are not generic equipment selection facts.
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
