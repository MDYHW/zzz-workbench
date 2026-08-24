import {
  AFTERSHOCK_TARGET,
  ATTRIBUTE_ANOMALY_TARGET,
  BASIC_AFTERSHOCK_TARGET,
  DISORDER_TARGET,
  actionTarget,
  canonicalAction,
  type ActionTarget,
} from '../../actions'
import type { ProfileRelationship, NonstackIdentity } from '../../calculation/relationships'
import type { SelectedSourceInstance } from '../../calculation/source-instance'
import type { StatId, StatRegion } from '../../calculation/stat-composer'
import type { EffectMetric, SurfaceKey } from '../../effects'
import {
  CRIT_DAMAGE_FORMULAS,
  effectAttributeForAgent,
  REGULAR_DAMAGE_FORMULAS,
} from '../../formula-policy'
import { DRIVE_DISC_FACTS } from '../discs'
import { W_ENGINES } from '../engines'
import { EFFECTIVE_SUBSTAT_VALUES, MAIN_STATS } from '../setup-options'
import { VERTICAL_VALUES } from '../retained-values'
import {
  equipmentEffectBaseValue,
  equipmentEffectMaximumValue,
  equipmentEffectProgressionIncrementValue,
  type AgentId,
  type DiscId,
} from '../types'
import type { CompleteSelectedSetup, SelectedSetupObservation } from './equipment'

type Slot = 0 | 1 | 2

export interface SelectedDriveDiscContext {
  agentId: AgentId
  appliedPartySlot: Slot
  setup: CompleteSelectedSetup & { mindscape?: number }
  observation: SelectedSetupObservation
  source: SelectedSourceInstance
  sourceFor: (discId: DiscId, piece: '2-piece' | '4-piece') => SelectedSourceInstance
}

const target = (...actions: Parameters<typeof canonicalAction>[0][]) => (
  actionTarget(actions.map(canonicalAction))
)
const BASIC = target('Basic Attack')
const DASH = target('Dash Attack')
const ULT = target('Ultimate')
const EX_ASSIST = target('EX Special Attack', 'Assist')
const BASIC_DASH_DODGE = target('Basic Attack', 'Dash Attack', 'Dodge Counter')

function stat(
  source: SelectedSourceInstance,
  statId: StatId,
  value: number,
  region: Exclude<StatRegion, 'base'>,
  earliestSurface: SurfaceKey = 'fully',
): ProfileRelationship {
  return { kind: 'stat', atom: { statId, region, earliestSurface, value, source } }
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
    atom: { metricId, earliestSurface, value, source, ...(action ? { action } : {}) },
  }
}

function provider(
  source: SelectedSourceInstance,
  recipient: 'self' | 'all-party' | 'focus' | 'enemy-context',
  effect: Extract<ProfileRelationship, { kind: 'provider' }>['effect'],
  delivery: Omit<Extract<ProfileRelationship, { kind: 'provider' }>['delivery'], 'recipient'> = {},
): ProfileRelationship {
  return { kind: 'provider', source, delivery: { recipient, ...delivery }, effect }
}

function initialCritRate({
  agentId: agent,
  setup,
  observation,
}: SelectedDriveDiscContext): number {
  const advanced = W_ENGINES[setup.engineId].advancedStat
  const discCrit = [setup.fourPieceId, setup.twoPieceId].reduce((total, id) => {
    const twoPiece = DRIVE_DISC_FACTS[id].twoPiece
    return total + ('critRate' in twoPiece ? equipmentEffectBaseValue(twoPiece.critRate) : 0)
  }, 0)
  const substatCrit = (observation.effectiveSubstats ?? []).reduce((total, choice) => (
    choice.id === 'critRate'
      ? total + (setup.substats.critRate ?? 0) * EFFECTIVE_SUBSTAT_VALUES.critRate.perHit
      : total
  ), 0)
  const combatMindscape = agent === 'juFufu' && (setup.mindscape ?? 0) >= 1
    ? VERTICAL_VALUES.juFufu.mindscapeCritRate
    : agent === 'pulchra' && (setup.mindscape ?? 0) >= 1
      ? VERTICAL_VALUES.pulchra.mindscapeCritRate
      : 0
  return Math.min(
    (observation.baseStats.critRate ?? 0)
      + (advanced.id === 'critRate' ? advanced.value : 0)
      + (setup.mains.slot4 === 'critRate' ? MAIN_STATS.critRate.numericValue : 0)
      + discCrit
      + substatCrit
      + combatMindscape,
    100,
  )
}

function squadDamage(
  source: SelectedSourceInstance,
  value: number,
  nonstackId?: NonstackIdentity,
): ProfileRelationship {
  return provider(source, 'all-party', {
    kind: 'modifier', metricId: 'dmgBonus', earliestSurface: 'fully', value,
    ...(nonstackId ? { nonstackId } : {}),
  }, { formulas: REGULAR_DAMAGE_FORMULAS })
}

/**
 * Materializes the selected four-piece and the action-scoped two-piece effects
 * that cannot be represented as ordinary Initial setup inputs.
 */
export function selectedDriveDiscRelationships(
  context: SelectedDriveDiscContext,
): ProfileRelationship[] {
  const { agentId: agent, setup, observation, source, sourceFor } = context
  const relationships: ProfileRelationship[] = []
  switch (setup.fourPieceId) {
    case 'swingJazz':
      relationships.push(squadDamage(source, equipmentEffectBaseValue(DRIVE_DISC_FACTS.swingJazz.fourPiece.damage), 'swingJazz'))
      break
    case 'moonlight':
      relationships.push(squadDamage(source, equipmentEffectBaseValue(DRIVE_DISC_FACTS.moonlight.fourPiece.damage), 'moonlightLullaby'))
      break
    case 'astralVoice':
      relationships.push(provider(source, 'focus', {
        kind: 'modifier', metricId: 'dmgBonus', earliestSurface: 'fully',
        value: equipmentEffectBaseValue(DRIVE_DISC_FACTS.astralVoice.fourPiece.damage),
        nonstackId: 'astralVoiceEntrant',
      }, { formulas: REGULAR_DAMAGE_FORMULAS }))
      break
    case 'bunnyInWonderland':
      relationships.push(squadDamage(source, equipmentEffectMaximumValue(DRIVE_DISC_FACTS.bunnyInWonderland.fourPiece.damage), 'bunnyInWonderland'))
      break
    case 'dawnsBloom':
      relationships.push(
        modifier(source, 'dmgBonus', equipmentEffectBaseValue(DRIVE_DISC_FACTS.dawnsBloom.fourPiece.damage), BASIC, 'combat'),
        modifier(source, 'dmgBonus', equipmentEffectProgressionIncrementValue(DRIVE_DISC_FACTS.dawnsBloom.fourPiece.damage), BASIC),
      )
      break
    case 'woodpecker':
      if (observation.baseStats.atk !== undefined) relationships.push(stat(
        source,
        'atk',
        agent === 'seed'
          ? equipmentEffectMaximumValue(DRIVE_DISC_FACTS.woodpecker.fourPiece.atk)
          : equipmentEffectBaseValue(DRIVE_DISC_FACTS.woodpecker.fourPiece.atk),
        'percentage',
        agent === 'ellen' ? 'combat' : 'fully',
      ))
      break
    case 'hormonePunk':
      relationships.push(stat(source, 'atk', equipmentEffectBaseValue(DRIVE_DISC_FACTS.hormonePunk.fourPiece.atk), 'percentage', 'combat'))
      break
    case 'thunderMetal':
      if (observation.baseStats.atk !== undefined) relationships.push(stat(source, 'atk', equipmentEffectBaseValue(DRIVE_DISC_FACTS.thunderMetal.fourPiece.atk), 'percentage'))
      break
    case 'pufferElectro':
      if (observation.baseStats.atk !== undefined) relationships.push(stat(source, 'atk', equipmentEffectBaseValue(DRIVE_DISC_FACTS.pufferElectro.fourPiece.atk), 'percentage'))
      relationships.push(modifier(source, 'dmgBonus', equipmentEffectBaseValue(DRIVE_DISC_FACTS.pufferElectro.fourPiece.damage), ULT, 'initial'))
      break
    case 'chaoticMetal':
      relationships.push(modifier(source, 'critDmg', equipmentEffectMaximumValue(DRIVE_DISC_FACTS.chaoticMetal.fourPiece.critDamage)))
      break
    case 'shadowHarmony':
      relationships.push(
        stat(source, 'atk', equipmentEffectBaseValue(DRIVE_DISC_FACTS.shadowHarmony.fourPiece.atk), 'percentage'),
        modifier(source, 'critRate', equipmentEffectBaseValue(DRIVE_DISC_FACTS.shadowHarmony.fourPiece.critRate)),
      )
      break
    case 'whiteWaterBallad':
      relationships.push(
        modifier(source, 'critRate', equipmentEffectBaseValue(DRIVE_DISC_FACTS.whiteWaterBallad.fourPiece.veilCritRate) + equipmentEffectBaseValue(DRIVE_DISC_FACTS.whiteWaterBallad.fourPiece.attackVeilCritRate)),
        stat(source, 'atk', equipmentEffectBaseValue(DRIVE_DISC_FACTS.whiteWaterBallad.fourPiece.attackVeilAtk), 'percentage'),
      )
      break
    case 'chaosJazz':
      relationships.push(modifier(source, 'dmgBonus', equipmentEffectBaseValue(DRIVE_DISC_FACTS.chaosJazz.fourPiece.electricFireDamage), undefined, 'combat'))
      if (agent === 'burnice') relationships.push(provider(source, 'self', {
        kind: 'modifier', metricId: 'dmgBonus', earliestSurface: 'fully',
        value: equipmentEffectBaseValue(DRIVE_DISC_FACTS.chaosJazz.fourPiece.offFieldActionDamage),
        action: EX_ASSIST,
      }, { formulas: ['general_damage'], attributes: ['Fire'] }))
      if (agent === 'yanagi') relationships.push(modifier(source, 'dmgBonus', equipmentEffectBaseValue(DRIVE_DISC_FACTS.chaosJazz.fourPiece.offFieldActionDamage), EX_ASSIST))
      break
    case 'freedomBlues':
      relationships.push(provider(source, 'enemy-context', {
        kind: 'modifier', metricId: 'anomalyBuildupResReduction', earliestSurface: 'fully',
        value: equipmentEffectBaseValue(DRIVE_DISC_FACTS.freedomBlues.fourPiece.buildupResReduction),
        nonstackId: 'freedomBlues',
      }, {
        attributes: [effectAttributeForAgent(agent)],
        formulas: ['anomaly_buildup'],
      }))
      break
    case 'fangedMetal':
      relationships.push(modifier(source, 'dmgBonus', equipmentEffectBaseValue(DRIVE_DISC_FACTS.fangedMetal.fourPiece.assaultDamage)))
      break
    case 'phaethonsMelody':
      relationships.push(stat(source, 'anomalyProficiency', equipmentEffectBaseValue(DRIVE_DISC_FACTS.phaethonsMelody.fourPiece.anomalyProficiency), 'flat'))
      if (effectAttributeForAgent(agent) === 'Ether') relationships.push(modifier(source, 'dmgBonus', equipmentEffectBaseValue(DRIVE_DISC_FACTS.phaethonsMelody.fourPiece.otherHolderEtherDamage)))
      break
    case 'shiningAria':
      relationships.push(
        stat(source, 'anomalyProficiency', equipmentEffectBaseValue(DRIVE_DISC_FACTS.shiningAria.fourPiece.anomalyProficiency), 'flat'),
        modifier(source, 'dmgBonus', equipmentEffectBaseValue(DRIVE_DISC_FACTS.shiningAria.fourPiece.stunnedTargetDamage)),
      )
      break
    case 'notesFromTheChained':
      relationships.push(
        stat(source, 'anomalyProficiency', equipmentEffectBaseValue(DRIVE_DISC_FACTS.notesFromTheChained.fourPiece.anomalyProficiency), 'flat'),
        provider(source, 'all-party', {
          kind: 'modifier', metricId: 'anomalyDmgBonus', earliestSurface: 'fully',
          value: equipmentEffectBaseValue(DRIVE_DISC_FACTS.notesFromTheChained.fourPiece.squadAnomalyDamage),
          action: ATTRIBUTE_ANOMALY_TARGET,
        }, { formulas: ['anomaly_damage'] }),
        provider(source, 'all-party', {
          kind: 'modifier', metricId: 'anomalyDmgBonus', earliestSurface: 'fully',
          value: equipmentEffectBaseValue(DRIVE_DISC_FACTS.notesFromTheChained.fourPiece.squadAnomalyDamage),
          action: DISORDER_TARGET,
        }, { formulas: ['anomaly_damage'] }),
      )
      break
    case 'yunkui':
      relationships.push(
        modifier(source, 'critRate', equipmentEffectBaseValue(DRIVE_DISC_FACTS.yunkui.fourPiece.critRate)),
        modifier(source, 'sheerDmgBonus', equipmentEffectBaseValue(DRIVE_DISC_FACTS.yunkui.fourPiece.sheerDamage)),
      )
      break
    case 'king': {
      const base = equipmentEffectBaseValue(DRIVE_DISC_FACTS.king.fourPiece.critDamage)
      const max = equipmentEffectMaximumValue(DRIVE_DISC_FACTS.king.fourPiece.critDamage)
      const output = initialCritRate(context) >= 50 ? max : base
      relationships.push({
        kind: 'gauge', gaugeId: 'kingOfTheSummit', source,
        basis: { statId: 'critRate', surface: 'initial' },
        basisLabel: 'Initial CRIT Rate', basisThreshold: 50, basisCap: 50,
        metricId: 'critRate',
        outputs: [{
          label: 'Squad CRIT DMG', unit: '%', cap: max,
          transform: { basisIncrement: 1, baseOutput: output, outputIncrement: 0 },
          emission: {
            kind: 'provider', delivery: { recipient: 'all-party', formulas: CRIT_DAMAGE_FORMULAS },
            effect: { kind: 'stat', statId: 'critDmg', region: 'flat', earliestSurface: 'fully', nonstackId: 'kingOfTheSummit' },
          },
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
      if (shockstarTarget) relationships.push(modifier(source, 'dazeBonus', equipmentEffectBaseValue(DRIVE_DISC_FACTS.shockstar.fourPiece.daze), shockstarTarget))
      if (agent === 'anby') relationships.push(modifier(source, 'dazeBonus', equipmentEffectBaseValue(DRIVE_DISC_FACTS.shockstar.fourPiece.daze), target('Dash Attack', 'Dodge Counter')))
      break
    }
  }

  if (setup.fourPieceId === 'shadowHarmony' || setup.twoPieceId === 'shadowHarmony') {
    const shadow = sourceFor('shadowHarmony', '2-piece')
    const amount = equipmentEffectBaseValue(DRIVE_DISC_FACTS.shadowHarmony.twoPiece.damage)
    relationships.push(
      modifier(shadow, 'dmgBonus', amount, DASH, 'initial'),
      modifier(shadow, 'dmgBonus', amount, AFTERSHOCK_TARGET, 'initial'),
    )
  }
  if (setup.fourPieceId === 'dawnsBloom' || setup.twoPieceId === 'dawnsBloom') {
    relationships.push(modifier(
      sourceFor('dawnsBloom', '2-piece'),
      'dmgBonus',
      equipmentEffectBaseValue(DRIVE_DISC_FACTS.dawnsBloom.twoPiece.damage),
      BASIC,
      'initial',
    ))
  }
  return relationships
}
