import { ABLOOM_TARGET, ATTRIBUTE_ANOMALY_TARGET, actionForm, actionTarget, canonicalAction, CORRUPTION_TARGET, DISORDER_TARGET, LUMINIZE_TARGET, MIYABI_FROSTBURN_BUILDUP_TARGET, MIYABI_FROSTBURN_REMOVED_BUILDUP_TARGET, REFRINGE_TARGET, sourceLocalAction, VORTEX_TARGET, WINDSWEPT_TARGET, type ActionTarget } from '../../actions'
import { effectiveSubstatChoicesForSlot } from '../../candidates'
import type { ActionScopeNode } from '../../calculation/composition'
import { actionProjection, type ActionProjection, type AgentSourceProfile, type MetricProjection } from '../../calculation/profile-harness'
import type { ProfileRelationship, ProviderEffect, ProviderRecipient } from '../../calculation/relationships'
import type { SelectedSourceInstance } from '../../calculation/source-instance'
import type { StatId, StatRegion } from '../../calculation/stat-composer'
import type { EffectAttribute, EffectMetric, SurfaceKey } from '../../effects'
import type { WorkbenchState } from '../../state'
import { DEF_DAMAGE_FORMULAS, effectAttributeForAgent, REGULAR_DAMAGE_FORMULAS } from '../../formula-policy'
import { anotherAgentHasSpecialty, anotherAgentSharesFaction, anotherAgentSharesAttribute, nangongAdditionalIsActive, piperAdditionalIsActive } from '../../party-conditions'
import { SOURCE_LABELS, VERTICAL_VALUES } from '../retained-values'
import { type AgentId, type FormulaFamily } from '../types'
import { requireCompleteSelectedSetup, selectedEquipmentRelationships, selectedSetupRelationships, type SelectedSetupObservation } from '../agent-sources/equipment'
import { selectedAgentSource, selectedCalculationSource, selectedMindscapeSource } from '../agent-sources/sources'
import { agentBroadPrePenRelationships } from '../agent-broad-pre-pen-relationships'
import { ADMITTED_AGENTS } from '../agents'

const ANOMALY_AGENTS = ['remielle', 'grace', 'piper', 'yuzuha', 'burnice', 'jane', 'yanagi', 'alice', 'vivian', 'aria', 'promeia', 'velina'] as const satisfies readonly AgentId[]
type Agent = (typeof ANOMALY_AGENTS)[number]
type Slot = 0 | 1 | 2
const DAMAGE = REGULAR_DAMAGE_FORMULAS

const BASE: Record<Agent, SelectedSetupObservation['baseStats']> = {
  remielle: { atk: VERTICAL_VALUES.remielle.atk, anomalyProficiency: VERTICAL_VALUES.remielle.anomalyProficiency, penRatio: 0 },
  grace: { atk: VERTICAL_VALUES.grace.atk, anomalyProficiency: VERTICAL_VALUES.grace.anomalyProficiency, anomalyMastery: VERTICAL_VALUES.grace.anomalyMastery, penRatio: 0 },
  piper: { atk: VERTICAL_VALUES.piper.atk, anomalyProficiency: VERTICAL_VALUES.piper.anomalyProficiency, anomalyMastery: VERTICAL_VALUES.piper.anomalyMastery, penRatio: 0 },
  yuzuha: { atk: VERTICAL_VALUES.yuzuha.atk, anomalyMastery: VERTICAL_VALUES.yuzuha.anomalyMastery, energyRegen: VERTICAL_VALUES.yuzuha.baseEnergyRegen },
  burnice: { atk: VERTICAL_VALUES.burnice.atk, anomalyProficiency: VERTICAL_VALUES.burnice.anomalyProficiency, anomalyMastery: VERTICAL_VALUES.burnice.anomalyMastery, critRate: VERTICAL_VALUES.burnice.critRate, energyRegen: VERTICAL_VALUES.burnice.baseEnergyRegen, penRatio: 0 },
  jane: { atk: VERTICAL_VALUES.jane.atk, anomalyProficiency: VERTICAL_VALUES.jane.anomalyProficiency, anomalyMastery: VERTICAL_VALUES.jane.anomalyMastery, penRatio: 0 },
  yanagi: { atk: VERTICAL_VALUES.yanagi.atk, anomalyProficiency: VERTICAL_VALUES.yanagi.anomalyProficiency, anomalyMastery: VERTICAL_VALUES.yanagi.anomalyMastery, energyRegen: VERTICAL_VALUES.yanagi.baseEnergyRegen, penRatio: 0 },
  alice: { atk: VERTICAL_VALUES.alice.atk, anomalyProficiency: VERTICAL_VALUES.alice.anomalyProficiency, anomalyMastery: VERTICAL_VALUES.alice.anomalyMastery, penRatio: 0 },
  vivian: { atk: VERTICAL_VALUES.vivian.atk, anomalyProficiency: VERTICAL_VALUES.vivian.anomalyProficiency, anomalyMastery: VERTICAL_VALUES.vivian.anomalyMastery, energyRegen: VERTICAL_VALUES.vivian.baseEnergyRegen, penRatio: 0 },
  aria: { atk: VERTICAL_VALUES.aria.atk, anomalyProficiency: VERTICAL_VALUES.aria.anomalyProficiency, anomalyMastery: VERTICAL_VALUES.aria.anomalyMastery, penRatio: 0 },
  promeia: { atk: VERTICAL_VALUES.promeia.atk, anomalyProficiency: VERTICAL_VALUES.promeia.anomalyProficiency, anomalyMastery: VERTICAL_VALUES.promeia.anomalyMastery, penRatio: 0 },
  velina: { atk: VERTICAL_VALUES.velina.atk, anomalyProficiency: VERTICAL_VALUES.velina.anomalyProficiency, anomalyMastery: VERTICAL_VALUES.velina.anomalyMastery, energyRegen: VERTICAL_VALUES.velina.baseEnergyRegen, penRatio: 0 },
}

const A = (action: Parameters<typeof canonicalAction>[0]) => canonicalAction(action)
const GRACE_EX = actionTarget([A('Special Attack'), A('EX Special Attack')])
const GRACE_SHOCK = actionTarget([sourceLocalAction('shock', 'Shock')])
const PIPER_DOWN = actionTarget([
  actionForm('Special Attack', 'piper-downward-smash', 'Downward smash'),
  actionForm('EX Special Attack', 'piper-downward-smash', 'Downward smash'),
])
const PIPER_ULT = actionTarget([A('Ultimate')])
const JANE_ASSAULT_TARGET = actionTarget([sourceLocalAction('assault', 'Assault')])
const JANE_PASSION_TARGET = actionTarget([sourceLocalAction('jane-passion-state', 'Passion State')])
const YUZUHA_ASSIST = actionTarget([canonicalAction('Assist Follow-Up')])
const EX_ASSIST = actionTarget([A('EX Special Attack'), A('Assist')])
const BURNICE_AFTERBURN = actionTarget([sourceLocalAction('burnice-afterburn', 'Afterburn')])
const BURNICE_BUILDUP = actionTarget([
  actionForm('Basic Attack', 'burnice-mixed-flame', 'Mixed Flame'),
  A('EX Special Attack'),
  sourceLocalAction('burnice-afterburn', 'Afterburn'),
  sourceLocalAction('burnice-tossing', 'Tossing'),
])
const BURNICE_EX_ASSIST = EX_ASSIST
const BURNICE_DOUBLE = actionTarget([
  sourceLocalAction('burnice-double-shot', 'Double Shot'),
  sourceLocalAction('burnice-special-afterburn', 'Special Afterburn'),
])
const BURNICE_BURN = actionTarget([sourceLocalAction('burn', 'Burn')])
const YANAGI_EX_RAPID_THRUST = actionTarget([actionForm('EX Special Attack', 'yanagi-rapid-thrust', 'Rapid thrust')])
const YANAGI_EX_ASSIST = EX_ASSIST
const YANAGI_EX = actionTarget([A('EX Special Attack')])
const ALICE_ENHANCED_BASIC = actionTarget([actionForm('Basic Attack', 'alice-celestial-overture', 'Celestial Overture')])
const ARIA_BUILDUP = actionTarget([A('Basic Attack'), A('Special Attack'), A('EX Special Attack')])
const ARIA_ATTACKS = actionTarget([
  A('Basic Attack'),
  A('Dash Attack'),
  A('Dodge Counter'),
  A('Special Attack'),
  A('EX Special Attack'),
  A('Assist'),
  A('Assist Follow-Up'),
  A('Chain Attack'),
  A('Ultimate'),
])
const ARIA_M6_DAMAGE = actionTarget([actionForm('Basic Attack', 'aria-enhanced', 'Enhanced'), A('Ultimate')])
const ANOMALY_RECIPIENT_CHAIN = actionTarget([A('Chain Attack')])
const VELINA_SWEEPING_CYCLONE = actionTarget([sourceLocalAction('velina-sweeping-cyclone', 'Sweeping Cyclone')])
const VELINA_WIND_TARGET_BUILDUP = actionTarget([
  sourceLocalAction('wind-anomaly-buildup-wind-anomaly-target', 'Wind Anomaly Buildup · Wind Anomaly target'),
])
const VELINA_CONDENSED_CYCLONE_ABLOOM = actionTarget([
  sourceLocalAction('velina-condensed-cyclone', 'Condensed Cyclone'),
  sourceLocalAction('abloom', 'Abloom'),
])
const VELINA_SWEEPING_CYCLONE_ABLOOM = actionTarget([
  sourceLocalAction('velina-sweeping-cyclone', 'Sweeping Cyclone'),
  sourceLocalAction('abloom', 'Abloom'),
])
const VELINA_ULTIMATE_ABLOOM = actionTarget([
  A('Ultimate'),
  sourceLocalAction('abloom', 'Abloom'),
])

const GRACE_ANOMALY_SCOPES = [
  { id: 'graceAttributeAnomaly', target: ATTRIBUTE_ANOMALY_TARGET, children: [{ id: 'graceShock', target: GRACE_SHOCK }] },
  { id: 'graceDisorder', target: DISORDER_TARGET },
] satisfies readonly ActionScopeNode[]

const PIPER_ANOMALY_SCOPES = [
  {
    id: 'piperAttributeAnomaly', target: ATTRIBUTE_ANOMALY_TARGET,
    children: [{ id: 'piperAssaultAnomaly', target: JANE_ASSAULT_TARGET }],
  },
  { id: 'piperDisorder', target: DISORDER_TARGET },
] satisfies readonly ActionScopeNode[]

const JANE_ANOMALY_SCOPES = [
  {
    id: 'janeAttributeAnomaly', target: ATTRIBUTE_ANOMALY_TARGET,
    children: [{ id: 'janeAssaultAnomaly', target: JANE_ASSAULT_TARGET }],
  },
  { id: 'janeDisorderAnomaly', target: DISORDER_TARGET },
] satisfies readonly ActionScopeNode[]

const BURNICE_BUILDUP_SCOPES = [{
  id: 'burniceBuildup',
  target: BURNICE_BUILDUP,
  children: [{ id: 'burniceAfterburnBuildup', target: BURNICE_AFTERBURN }],
}] satisfies readonly ActionScopeNode[]

const BURNICE_ANOMALY_SCOPES = [
  { id: 'burniceAttributeAnomaly', target: ATTRIBUTE_ANOMALY_TARGET, children: [{ id: 'burniceBurnAnomaly', target: BURNICE_BURN }] },
  { id: 'burniceDisorder', target: DISORDER_TARGET },
] satisfies readonly ActionScopeNode[]

const BURNICE_RES_SCOPES = [
  { id: 'burniceDoubleRes', target: BURNICE_DOUBLE },
  { id: 'burniceAttributeAnomalyRes', target: ATTRIBUTE_ANOMALY_TARGET, children: [{ id: 'burniceBurnRes', target: BURNICE_BURN }] },
] satisfies readonly ActionScopeNode[]

const YANAGI_ANOMALY_SCOPES = [
  { id: 'yanagiAttributeAnomaly', target: ATTRIBUTE_ANOMALY_TARGET },
  { id: 'yanagiDisorder', target: DISORDER_TARGET },
] satisfies readonly ActionScopeNode[]

const YANAGI_DAMAGE_SCOPES = [{
  id: 'yanagiExAssistDmg',
  target: YANAGI_EX_ASSIST,
  children: [{ id: 'yanagiExDmg', target: YANAGI_EX }],
}] satisfies readonly ActionScopeNode[]

const ALICE_ANOMALY_SCOPES = [
  { id: 'aliceAttributeAnomaly', target: ATTRIBUTE_ANOMALY_TARGET, children: [{ id: 'aliceAssault', target: JANE_ASSAULT_TARGET }] },
  { id: 'aliceDisorder', target: DISORDER_TARGET },
] satisfies readonly ActionScopeNode[]

const VIVIAN_ANOMALY_SCOPES = [
  {
    id: 'vivianAttributeAnomaly', target: ATTRIBUTE_ANOMALY_TARGET,
    children: [
      { id: 'vivianCorruption', target: CORRUPTION_TARGET },
      { id: 'vivianAbloom', target: ABLOOM_TARGET },
    ],
  },
  { id: 'vivianDisorder', target: DISORDER_TARGET },
] satisfies readonly ActionScopeNode[]

const ARIA_ANOMALY_SCOPES = [
  {
    id: 'ariaAttributeAnomaly', target: ATTRIBUTE_ANOMALY_TARGET,
    children: [
      { id: 'ariaCorruption', target: CORRUPTION_TARGET },
      { id: 'ariaAbloom', target: ABLOOM_TARGET },
    ],
  },
  { id: 'ariaDisorder', target: DISORDER_TARGET },
] satisfies readonly ActionScopeNode[]

const PROMEIA_ANOMALY_SCOPES = [
  {
    id: 'promeiaAttributeAnomaly', target: ATTRIBUTE_ANOMALY_TARGET,
    children: [{ id: 'promeiaAbloom', target: ABLOOM_TARGET }],
  },
  { id: 'promeiaDisorder', target: DISORDER_TARGET },
] satisfies readonly ActionScopeNode[]

const velinaAnomalyScopes = (includeUltimateAbloom: boolean) => [
  {
    id: 'velinaAttributeAnomaly', target: ATTRIBUTE_ANOMALY_TARGET,
    children: [{
      id: 'velinaWindswept', target: WINDSWEPT_TARGET,
      children: [
        {
          id: 'velinaCondensedCycloneAbloom', target: VELINA_CONDENSED_CYCLONE_ABLOOM,
          inheritedEffectTargets: [ABLOOM_TARGET],
        },
        {
          id: 'velinaSweepingCycloneAbloom', target: VELINA_SWEEPING_CYCLONE_ABLOOM,
          inheritedEffectTargets: [ABLOOM_TARGET],
        },
        ...(includeUltimateAbloom ? [{
          id: 'velinaUltimateAbloom', target: VELINA_ULTIMATE_ABLOOM,
          inheritedEffectTargets: [ABLOOM_TARGET],
        }] : []),
      ],
    }],
  },
  { id: 'velinaVortex', target: VORTEX_TARGET },
] satisfies readonly ActionScopeNode[]

const src = (agent: Agent, slot: Slot, id: string, label: string, locus: 'identity' | 'core' | 'additional' | 'basic' | 'assist' | 'chain' | 'special' | 'ultimate' = 'core') => selectedAgentSource(agent, slot, id, label, locus)
const m = (
  id: MetricProjection['id'],
  label: string,
  unit = '',
  statId?: MetricProjection['statId'],
  admission?: MetricProjection['admission'],
  decimals = unit === '/s' ? 2 : unit === '%' ? 1 : 0,
): MetricProjection => ({
  id,
  label,
  unit,
  decimals,
  ...(statId ? { statId } : { baseValues: { initial: 0, combat: 0, fully: 0 } }),
  ...(admission ? { admission } : {}),
})
const anomalyDealerMetrics = (): MetricProjection[] => [
  m('atk', 'ATK', '', 'atk'),
  m('anomalyProficiency', 'Anomaly Proficiency', '', 'anomalyProficiency'),
  m('anomalyMastery', 'Anomaly Mastery', '', 'anomalyMastery', undefined, 2),
  m('dmgBonus', 'DMG Bonus', '%', undefined, 'nonzero-or-action'),
  m('anomalyDmgBonus', 'Anomaly DMG Bonus', '%', undefined, 'nonzero-or-action'),
  m('anomalyBuildupBonus', 'Anomaly Buildup Bonus', '%', undefined, 'nonzero-or-action'),
  m('penRatio', 'PEN Ratio', '%', 'penRatio', 'disclosed-or-action'),
  m('anomalyBuildupResReduction', 'Anomaly Buildup RES Reduction', '%', undefined, 'nonzero-or-action'),
  m('defIgnore', 'DEF Ignore', '%', undefined, 'nonzero-or-action'),
  m('defReduction', 'DEF Reduction', '%', undefined, 'nonzero-or-action'),
  m('resIgnore', 'RES Ignore', '%', undefined, 'nonzero-or-action'),
  m('resReduction', 'RES Reduction', '%', undefined, 'nonzero-or-action'),
  m('stunDmgMultiplier', 'Stun DMG Multiplier', '%', undefined, 'nonzero-or-action'),
]
const stat = (
  source: SelectedSourceInstance,
  statId: StatId,
  value: number,
  region: Exclude<StatRegion, 'base'>,
  surface: SurfaceKey = 'fully',
): ProfileRelationship => ({ kind: 'stat', atom: { statId, region, value, earliestSurface: surface, source } })
const mod = (
  source: SelectedSourceInstance,
  metricId: EffectMetric,
  value: number,
  action?: ActionTarget,
  surface: SurfaceKey = 'fully',
): ProfileRelationship => ({ kind: 'modifier', atom: { metricId, value, earliestSurface: surface, source, ...(action ? { action } : {}) } })
const provider = (
  source: SelectedSourceInstance,
  recipient: ProviderRecipient,
  effect: ProviderEffect,
  formulas?: readonly FormulaFamily[],
  attributes?: readonly EffectAttribute[],
): ProfileRelationship => ({ kind: 'provider', source, delivery: { recipient, ...(formulas ? { formulas } : {}), ...(attributes ? { attributes } : {}) }, effect })

function buildAnomalyOutcomeProfile(agent: Agent, state: WorkbenchState, slot: Slot): AgentSourceProfile {
  const setup = { ...requireCompleteSelectedSetup(state.slots[slot].setup), mindscape: state.slots[slot].setup.mindscape }
  const ids = state.slots.map(({ agentId }) => agentId)
  const focusAgentId = ids[state.focusSlot]
  const coreKey = `${agent}Core` as const
  const abilityKey = `${agent}Ability` as const
  const core = src(agent, slot, 'core', SOURCE_LABELS[coreKey])
  const ability = src(agent, slot, 'additional', SOURCE_LABELS[abilityKey], 'additional')
  const mind = (tier: 1 | 2 | 3 | 4 | 5 | 6) => selectedMindscapeSource(agent, slot, setup.mindscape, tier)
  const observation: SelectedSetupObservation = { baseStats: BASE[agent], effectiveSubstats: effectiveSubstatChoicesForSlot(state, slot), modifierMetrics: ['dmgBonus', 'dazeBonus', 'anomalyDmgBonus', 'anomalyBuildupBonus', 'anomalyBuildupResReduction', 'resReduction', 'resIgnore'] }
  const relationships = selectedSetupRelationships(agent, slot, setup, observation)
  relationships.push(...agentBroadPrePenRelationships(state, slot))
  const add = (r: ProfileRelationship) => relationships.push(r)
  const actions: ActionProjection[] = []
  const nangongSlot = ids.indexOf('nangongYu')
  if (
    nangongSlot >= 0
    && nangongSlot !== slot
    && nangongAdditionalIsActive(ids, nangongSlot)
  ) {
    actions.push(actionProjection('anomalyBuildupBonus', 'chainAttackAnomalyBuildup', ANOMALY_RECIPIENT_CHAIN))
  }
  const miyabiSlot = ids.indexOf('miyabi')
  if (miyabiSlot >= 0 && miyabiSlot !== slot) {
    actions.push(actionProjection(
      'anomalyBuildupBonus',
      'miyabiFrostburnBuildup',
      MIYABI_FROSTBURN_BUILDUP_TARGET,
    ))
    if (state.slots[miyabiSlot].setup.mindscape >= 1) actions.push(actionProjection(
      'anomalyBuildupBonus',
      'miyabiFrostburnRemovedBuildup',
      MIYABI_FROSTBURN_REMOVED_BUILDUP_TARGET,
    ))
  }
  if (agent === 'remielle') {
    const anomalyCount = ids.filter((agentId) => (
      ADMITTED_AGENTS.find(({ id }) => id === agentId)?.specialty === 'Anomaly'
    )).length
    const additionalActive = anotherAgentHasSpecialty(ids, slot, ['Anomaly'])
      || anotherAgentSharesFaction(ids, slot)
    const phaseFlow = src(
      agent,
      slot,
      'phaseFlow',
      SOURCE_LABELS.remiellePhaseFlow,
      'special',
    )
    const assist = src(
      agent,
      slot,
      'flowerFeatherDance',
      SOURCE_LABELS.remielleAssist,
      'assist',
    )
    const skillTier = setup.mindscape >= 5 ? 2 : setup.mindscape >= 3 ? 1 : 0

    add({
      kind: 'post-delivery-linear',
      source: core,
      basis: { statId: 'anomalyProficiency', surface: 'fully' },
      outputs: [{
        transform: {
          basisIncrement: 1,
          outputIncrement: VERTICAL_VALUES.remielle.refringePerAnomalyProficiency,
        },
        emission: {
          kind: 'modifier',
          metricId: 'refringeFactor',
          earliestSurface: 'fully',
          action: REFRINGE_TARGET,
          sourceDetail: { label: 'Distinct Refringe formula factor', presentationId: 'distinct-refringe-formula-factor' },
        },
      }],
    })
    add({
      kind: 'post-delivery-linear',
      source: core,
      basis: { statId: 'anomalyProficiency', surface: 'fully' },
      outputs: [{
        transform: {
          basisIncrement: 1,
          outputIncrement: VERTICAL_VALUES.remielle.luminizePerAnomalyProficiency,
        },
        emission: {
          kind: 'modifier',
          metricId: 'luminizeMultiplier',
          earliestSurface: 'fully',
          action: LUMINIZE_TARGET,
          sourceDetail: { label: 'Added Luminize DMG multiplier', presentationId: 'added-luminize-dmg-multiplier' },
        },
      }],
    })
    if (anomalyCount === 3) add(mod(
      core,
      'refringeFactor',
      VERTICAL_VALUES.remielle.tripleAnomalyRefringe,
      REFRINGE_TARGET,
    ))
    add(provider(
      phaseFlow,
      'all-party',
      {
        kind: 'modifier',
        metricId: 'dmgBonus',
        earliestSurface: 'fully',
        value: VERTICAL_VALUES.remielle.phaseFlowDmgBySkillTier[skillTier],
        sourceDetail: { label: 'Phase Flow', presentationId: 'phase-flow' },
      },
      DAMAGE,
    ))
    add({
      kind: 'operation',
      atom: {
        presentationId: 'stun-duration-extension',
        label: 'Stun duration extension',
        value: VERTICAL_VALUES.remielle.assistStunExtension,
        unit: 's',
        source: assist,
        sourceDetail: { label: 'Flower & Feather Dance', presentationId: 'flower-feather-dance' },
      },
    })

    if (additionalActive) {
      const atkRatio = VERTICAL_VALUES.remielle.additionalAtkRatioByAnomalyCount[
        Math.max(1, anomalyCount) - 1
      ]
      add({
        kind: 'gauge',
        source: ability,
        basis: { statId: 'atk', surface: 'initial' },
        basisLabel: 'Initial ATK',
        basisPresentationId: 'initial-atk',
        basisCap: VERTICAL_VALUES.remielle.additionalAtkCap / (atkRatio / 100),
        metricId: 'atk',
        outputs: [{
          presentationId: 'squad-flat-atk',
          label: 'Squad flat ATK',
          unit: '',
          cap: VERTICAL_VALUES.remielle.additionalAtkCap,
          transform: {
            basisIncrement: 100,
            outputIncrement: atkRatio,
            outputCap: VERTICAL_VALUES.remielle.additionalAtkCap,
          },
          emission: {
            kind: 'provider',
            delivery: { recipient: 'all-party', formulas: DAMAGE },
            effect: {
              kind: 'stat',
              statId: 'atk',
              region: 'flat',
              earliestSurface: 'fully',
            },
          },
        }],
        decimals: { current: 0, cap: 0, output: 0, outputCap: 0 },
      })
      add(provider(
        ability,
        'enemy-context',
        {
          kind: 'modifier',
          metricId: 'anomalyBuildupBonus',
          earliestSurface: 'fully',
          value: VERTICAL_VALUES.remielle.additionalBuildup,
          sourceDetail: { label: 'Prismatic target', presentationId: 'prismatic-target' },
        },
        ['anomaly_buildup'],
      ))
    }

    if (setup.mindscape >= 1) {
      add(mod(
        mind(1),
        'resIgnore',
        VERTICAL_VALUES.remielle.mindscape1LuminizeResIgnore,
        LUMINIZE_TARGET,
      ))
      add(provider(
        mind(1),
        'other-party',
        {
          kind: 'modifier',
          metricId: 'anomalyDmgBonus',
          earliestSurface: 'fully',
          value: VERTICAL_VALUES.remielle.mindscape1OtherAnomalyDmg,
          action: ATTRIBUTE_ANOMALY_TARGET,
          sourceDetail: { label: 'Phase Flow', presentationId: 'phase-flow' },
        },
        ['anomaly_damage'],
      ))
    }
    if (setup.mindscape >= 2) {
      add(mod(
        mind(2),
        'refringeFactor',
        VERTICAL_VALUES.remielle.mindscape2Refringe,
        REFRINGE_TARGET,
      ))
      add({
        kind: 'provider',
        source: mind(2),
        delivery: {
          recipient: 'all-party',
          specialties: ['Anomaly'],
          formulas: ['anomaly_damage'],
        },
        effect: {
          kind: 'modifier',
          metricId: 'defIgnore',
          earliestSurface: 'fully',
          value: VERTICAL_VALUES.remielle.mindscape2AnomalyDefIgnore,
          sourceDetail: { label: 'Prismatic target', presentationId: 'prismatic-target' },
        },
      })
    }
    if (setup.mindscape >= 4) add(mod(
      mind(4),
      'luminizeMultiplier',
      VERTICAL_VALUES.remielle.mindscape4LuminizeMultiplier,
      LUMINIZE_TARGET,
    ))
    if (setup.mindscape >= 6) add({
      kind: 'operation',
      atom: {
        presentationId: 'luminize-trigger-count',
        label: 'Rainbow’s End / Fleeting Grace · Luminize triggers',
        value: VERTICAL_VALUES.remielle.mindscape6LuminizeTriggers,
        unit: '×',
        presentation: 'scale',
        source: mind(6),
      },
    })

    actions.push(
      actionProjection('refringeFactor', 'remielleRefringe', REFRINGE_TARGET),
      actionProjection('luminizeMultiplier', 'remielleLuminize', LUMINIZE_TARGET),
      {
        metricId: 'anomalyDmgBonus',
        scopes: [{
          id: 'remielleAttributeAnomaly',
          target: ATTRIBUTE_ANOMALY_TARGET,
          children: [{
            id: 'remielleLuminizeAnomaly',
            target: LUMINIZE_TARGET,
          }],
        }],
      },
      actionProjection('resIgnore', 'remielleLuminizeResIgnore', LUMINIZE_TARGET),
    )
    relationships.push(...selectedEquipmentRelationships(
      agent,
      slot,
      setup,
      { observation, focusAgentId, partyAgentIds: ids },
    ))
    const metrics: MetricProjection[] = [
      m('atk', 'ATK', '', 'atk'),
      m('anomalyProficiency', 'Anomaly Proficiency', '', 'anomalyProficiency'),
      m('dmgBonus', 'DMG Bonus', '%', undefined, 'nonzero-or-action'),
      m('anomalyDmgBonus', 'Anomaly DMG Bonus', '%', undefined, 'nonzero-or-action'),
      m('anomalyBuildupBonus', 'Anomaly Buildup Bonus', '%', undefined, 'nonzero-or-action'),
      m('penRatio', 'PEN Ratio', '%', 'penRatio', 'disclosed-or-action'),
      m('defIgnore', 'DEF Ignore', '%', undefined, 'nonzero-or-action'),
      m('defReduction', 'DEF Reduction', '%', undefined, 'nonzero-or-action'),
      m('resIgnore', 'RES Ignore', '%', undefined, 'nonzero-or-action'),
      m('resReduction', 'RES Reduction', '%', undefined, 'nonzero-or-action'),
      {
        ...m('refringeFactor', 'Refringe Factor', '%', undefined, 'action'),
        resultVisibility: 'action-only',
        resultParentMetricId: 'anomalyProficiency',
      },
      {
        ...m('luminizeMultiplier', 'Added Luminize DMG Multiplier', '%', undefined, 'action'),
        resultVisibility: 'action-only',
        resultParentMetricId: 'anomalyProficiency',
      },
    ]
    return { agentId: agent, appliedPartySlot: slot, relationships, metrics, actions }
  }
  if (agent === 'grace') {
    const qualified = anotherAgentHasSpecialty(ids, slot, ['Anomaly']) || anotherAgentSharesAttribute(ids, slot) || anotherAgentSharesFaction(ids, slot)
    add(mod(core, 'anomalyBuildupBonus', VERTICAL_VALUES.grace.coreAnomalyBuildup, GRACE_EX, 'fully'))
    if (qualified) add(mod(ability, 'anomalyDmgBonus', VERTICAL_VALUES.grace.additionalShockDmgPerStack * VERTICAL_VALUES.grace.additionalShockDmgStacks, GRACE_SHOCK))
    add(mod(src(agent, slot, 'potential', SOURCE_LABELS.gracePotential, 'identity'), 'dmgBonus', VERTICAL_VALUES.grace.potentialElectricDmg))
    if (setup.mindscape >= 2) { add(provider(mind(2), 'enemy-context', { kind: 'modifier', metricId: 'resReduction', earliestSurface: 'fully', value: VERTICAL_VALUES.grace.mindscapeElectricResReduction }, DAMAGE, ['Electric'])); add(provider(mind(2), 'enemy-context', { kind: 'modifier', metricId: 'anomalyBuildupResReduction', earliestSurface: 'fully', value: VERTICAL_VALUES.grace.mindscapeElectricBuildupResReduction }, ['anomaly_buildup'], ['Electric'])) }
    actions.push(
      actionProjection('anomalyBuildupBonus', 'graceSpecialExBuildup', GRACE_EX),
      actionProjection('dmgBonus', 'graceExAssistDmg', EX_ASSIST),
      { metricId: 'anomalyDmgBonus', scopes: GRACE_ANOMALY_SCOPES },
    )
    relationships.push(...selectedEquipmentRelationships(agent, slot, setup, { observation, focusAgentId, partyAgentIds: ids }))
    const metrics = [
      m('atk', 'ATK', '', 'atk'),
      m('anomalyProficiency', 'Anomaly Proficiency', '', 'anomalyProficiency'),
      m('anomalyMastery', 'Anomaly Mastery', '', 'anomalyMastery', undefined, 1),
      m('dmgBonus', 'DMG Bonus', '%', undefined, 'nonzero-or-action'),
      m('anomalyDmgBonus', 'Anomaly DMG Bonus', '%', undefined, 'nonzero-or-action'),
      m('anomalyBuildupBonus', 'Anomaly Buildup Bonus', '%', undefined, 'nonzero-or-action'),
      m('penRatio', 'PEN Ratio', '%', 'penRatio', 'disclosed-or-action'),
      m('anomalyBuildupResReduction', 'Anomaly Buildup RES Reduction', '%', undefined, 'nonzero-or-action'),
      m('defIgnore', 'DEF Ignore', '%', undefined, 'nonzero-or-action'),
      m('defReduction', 'DEF Reduction', '%', undefined, 'nonzero-or-action'),
      m('resIgnore', 'RES Ignore', '%', undefined, 'nonzero-or-action'),
      m('resReduction', 'RES Reduction', '%', undefined, 'nonzero-or-action'),
      m('stunDmgMultiplier', 'Stun DMG Multiplier', '%', undefined, 'nonzero-or-action'),
    ]
    return { agentId: agent, appliedPartySlot: slot, relationships, metrics, actions }
  }
  if (agent === 'piper') {
    const powerCap = setup.mindscape >= 1 ? VERTICAL_VALUES.piper.mindscapePowerCap : VERTICAL_VALUES.piper.basePowerCap
    add(mod(core, 'anomalyBuildupBonus', VERTICAL_VALUES.piper.powerBuildupPerStack * powerCap))
    if (piperAdditionalIsActive(ids, slot)) add(provider(ability, 'all-party', { kind: 'modifier', metricId: 'dmgBonus', earliestSurface: 'fully', value: VERTICAL_VALUES.piper.additionalDmgBonus }, DAMAGE))
    if (setup.mindscape >= 2) { const value = VERTICAL_VALUES.piper.mindscapeActionDmgBase + VERTICAL_VALUES.piper.mindscapeActionDmgPerPower * powerCap; add(mod(mind(2), 'dmgBonus', value, PIPER_DOWN)); add(mod(mind(2), 'dmgBonus', value, PIPER_ULT)) }
    actions.push(
      actionProjection('dmgBonus', 'piperDownwardSpecialEx', PIPER_DOWN),
      actionProjection('dmgBonus', 'piperUltimate', PIPER_ULT),
      { metricId: 'anomalyDmgBonus', scopes: PIPER_ANOMALY_SCOPES },
      actionProjection('critRate', 'piperAssaultCritRate', JANE_ASSAULT_TARGET),
      actionProjection('critDmg', 'piperAssaultCritDmg', JANE_ASSAULT_TARGET),
      actionProjection('defIgnore', 'piperAssaultDefIgnore', JANE_ASSAULT_TARGET),
    )
    relationships.push(...selectedEquipmentRelationships(agent, slot, setup, { observation, focusAgentId, partyAgentIds: ids }))
    return {
      agentId: agent,
      appliedPartySlot: slot,
      relationships,
      metrics: [
        m('atk', 'ATK', '', 'atk'),
        m('anomalyProficiency', 'Anomaly Proficiency', '', 'anomalyProficiency'),
        m('anomalyMastery', 'Anomaly Mastery', '', 'anomalyMastery', undefined, 1),
        m('dmgBonus', 'DMG Bonus', '%', undefined, 'nonzero-or-action'),
        m('anomalyDmgBonus', 'Anomaly DMG Bonus', '%', undefined, 'nonzero-or-action'),
        m('anomalyBuildupBonus', 'Anomaly Buildup Bonus', '%', undefined, 'nonzero-or-action'),
        { ...m('critRate', 'CRIT Rate', '%', undefined, 'action'), resultVisibility: 'action-only' },
        { ...m('critDmg', 'CRIT DMG', '%', undefined, 'action'), resultVisibility: 'action-only' },
        m('penRatio', 'PEN Ratio', '%', 'penRatio', 'disclosed-or-action'),
        m('anomalyBuildupResReduction', 'Anomaly Buildup RES Reduction', '%', undefined, 'nonzero-or-action'),
        m('defIgnore', 'DEF Ignore', '%', undefined, 'nonzero-or-action'),
        m('defReduction', 'DEF Reduction', '%', undefined, 'nonzero-or-action'),
        m('resIgnore', 'RES Ignore', '%', undefined, 'nonzero-or-action'),
        m('resReduction', 'RES Reduction', '%', undefined, 'nonzero-or-action'),
        m('stunDmgMultiplier', 'Stun DMG Multiplier', '%', undefined, 'nonzero-or-action'),
      ],
      actions,
    }
  }
  if (agent === 'jane') {
    const additionalActive = anotherAgentHasSpecialty(ids, slot, ['Anomaly']) || anotherAgentSharesFaction(ids, slot)
    const potential = src(agent, slot, 'potential', SOURCE_LABELS.janePotential, 'identity')
    add(mod(potential, 'critDmg', VERTICAL_VALUES.jane.potentialAssaultCritDmg, JANE_ASSAULT_TARGET))
    if (additionalActive) {
      add(provider(
        ability,
        'self',
        {
          kind: 'modifier',
          metricId: 'anomalyBuildupBonus',
          earliestSurface: 'fully',
          value: VERTICAL_VALUES.jane.additionalBuildup,
        },
        ['anomaly_buildup'],
        ['Physical'],
      ))
    }
    if (setup.mindscape >= 2) {
      add(provider(
        mind(2),
        'all-party',
        {
          kind: 'modifier',
          metricId: 'defIgnore',
          earliestSurface: 'fully',
          value: VERTICAL_VALUES.jane.mindscape2DefIgnore,
          action: JANE_ASSAULT_TARGET,
        },
        ['anomaly_damage'],
        ['Physical'],
      ))
      add(provider(
        mind(2),
        'all-party',
        {
          kind: 'modifier',
          metricId: 'critDmg',
          earliestSurface: 'fully',
          value: VERTICAL_VALUES.jane.mindscape2CritDmg,
          action: JANE_ASSAULT_TARGET,
        },
        ['anomaly_damage'],
        ['Physical'],
      ))
    }
    if (setup.mindscape >= 4) {
      add(provider(
        mind(4),
        'all-party',
        {
          kind: 'modifier',
          metricId: 'anomalyDmgBonus',
          earliestSurface: 'fully',
          value: VERTICAL_VALUES.jane.mindscape4AnomalyDmg,
          action: ATTRIBUTE_ANOMALY_TARGET,
        },
        ['anomaly_damage'],
      ))
    }
    add({
      kind: 'post-delivery-gauge',
      source: core,
      basis: { statId: 'anomalyProficiency', surface: 'fully' },
      basisLabel: 'Fully Enabled Anomaly Proficiency',
      basisPresentationId: 'fully-anomaly-proficiency',
      basisThreshold: (
        VERTICAL_VALUES.jane.assaultCritRateCap
          - VERTICAL_VALUES.jane.assaultCritRateBase
      ) / VERTICAL_VALUES.jane.assaultCritRatePerAp,
      basisCap: VERTICAL_VALUES.jane.passionApThreshold
        + VERTICAL_VALUES.jane.passionAtkCap / VERTICAL_VALUES.jane.passionAtkPerAp,
      metricId: 'anomalyProficiency',
      outputs: [
        {
          presentationId: 'assault-crit-rate',
          label: 'Assault CRIT Rate',
          unit: '%',
          cap: VERTICAL_VALUES.jane.assaultCritRateCap,
          transform: {
            basisIncrement: 1,
            baseOutput: VERTICAL_VALUES.jane.assaultCritRateBase,
            outputIncrement: VERTICAL_VALUES.jane.assaultCritRatePerAp,
            outputCap: VERTICAL_VALUES.jane.assaultCritRateCap,
          },
          emission: {
            kind: 'provider',
            delivery: {
              recipient: 'all-party',
              attributes: ['Physical'],
              formulas: ['anomaly_damage'],
            },
            effect: {
              kind: 'modifier', metricId: 'critRate', earliestSurface: 'fully',
              action: JANE_ASSAULT_TARGET,
            },
          },
        },
        {
          presentationId: 'at-passion-flat-atk',
          label: 'At Passion · flat ATK',
          unit: '',
          cap: VERTICAL_VALUES.jane.passionAtkCap,
          transform: {
            basisThreshold: VERTICAL_VALUES.jane.passionApThreshold,
            basisIncrement: 1,
            outputIncrement: VERTICAL_VALUES.jane.passionAtkPerAp,
            outputCap: VERTICAL_VALUES.jane.passionAtkCap,
          },
          emission: {
            kind: 'stat', statId: 'atk', region: 'flat', earliestSurface: 'fully',
          },
        },
      ],
      decimals: {
        current: 0, threshold: 0, cap: 0, output: 2, outputCap: 0,
      },
    })
    add({
      kind: 'post-delivery-linear',
      source: core,
      basis: { statId: 'anomalyProficiency', surface: 'fully' },
      outputs: [{
        transform: {
          basisIncrement: 1,
          baseOutput: VERTICAL_VALUES.jane.assaultCritDmg,
          outputIncrement: 0,
          outputCap: VERTICAL_VALUES.jane.assaultCritDmg,
        },
        emission: {
          kind: 'provider',
          delivery: {
            recipient: 'all-party', attributes: ['Physical'], formulas: ['anomaly_damage'],
          },
          effect: {
            kind: 'modifier', metricId: 'critDmg', earliestSurface: 'fully',
            action: JANE_ASSAULT_TARGET,
          },
        },
      }],
    })
    if (setup.mindscape >= 1) {
      add({
        kind: 'post-delivery-linear',
        source: mind(1),
        basis: { statId: 'anomalyProficiency', surface: 'fully' },
        outputs: [
          {
            transform: {
              basisIncrement: 1,
              baseOutput: VERTICAL_VALUES.jane.mindscape1Buildup,
              outputIncrement: 0,
              outputCap: VERTICAL_VALUES.jane.mindscape1Buildup,
            },
            emission: {
              kind: 'modifier', metricId: 'anomalyBuildupBonus', earliestSurface: 'fully',
              action: JANE_PASSION_TARGET,
            },
          },
          {
            transform: {
              basisIncrement: 1,
              outputIncrement: VERTICAL_VALUES.jane.mindscape1DmgPerAp,
              outputCap: VERTICAL_VALUES.jane.mindscape1DmgCap,
            },
            emission: {
              kind: 'modifier', metricId: 'dmgBonus', earliestSurface: 'fully',
              action: JANE_PASSION_TARGET,
            },
          },
        ],
      })
    }
    actions.push(
      actionProjection('critRate', 'janeAssaultCritRate', JANE_ASSAULT_TARGET),
      actionProjection('critDmg', 'janeAssaultCritDmg', JANE_ASSAULT_TARGET),
      actionProjection('defIgnore', 'janeAssaultDefIgnore', JANE_ASSAULT_TARGET),
      actionProjection('anomalyBuildupBonus', 'janePassionBuildup', JANE_PASSION_TARGET),
      actionProjection('dmgBonus', 'janePassionDmg', JANE_PASSION_TARGET),
      { metricId: 'anomalyDmgBonus', scopes: JANE_ANOMALY_SCOPES },
    )
    relationships.push(...selectedEquipmentRelationships(agent, slot, setup, { observation, focusAgentId, partyAgentIds: ids }))
    return {
      agentId: agent,
      appliedPartySlot: slot,
      relationships,
      metrics: [
        m('atk', 'ATK', '', 'atk'),
        m('anomalyProficiency', 'Anomaly Proficiency', '', 'anomalyProficiency'),
        m('anomalyMastery', 'Anomaly Mastery', '', 'anomalyMastery', undefined, 1),
        { ...m('critRate', 'CRIT Rate', '%', undefined, 'action'), resultVisibility: 'action-only' },
        { ...m('critDmg', 'CRIT DMG', '%', undefined, 'action'), resultVisibility: 'action-only' },
        m('dmgBonus', 'DMG Bonus', '%', undefined, 'nonzero-or-action'),
        m('anomalyDmgBonus', 'Anomaly DMG Bonus', '%', undefined, 'nonzero-or-action'),
        m('anomalyBuildupBonus', 'Anomaly Buildup Bonus', '%', undefined, 'nonzero-or-action'),
        m('penRatio', 'PEN Ratio', '%', 'penRatio', 'disclosed-or-action'),
        m('defIgnore', 'DEF Ignore', '%', undefined, 'nonzero-or-action'),
        m('defReduction', 'DEF Reduction', '%', undefined, 'nonzero-or-action'),
        m('resIgnore', 'RES Ignore', '%', undefined, 'nonzero-or-action'),
        m('resReduction', 'RES Reduction', '%', undefined, 'nonzero-or-action'),
        m('anomalyBuildupResReduction', 'Anomaly Buildup RES Reduction', '%', undefined, 'nonzero-or-action'),
        m('stunDmgMultiplier', 'Stun DMG Multiplier', '%', undefined, 'nonzero-or-action'),
      ],
      actions,
    }
  }
  if (agent === 'yanagi') {
    const additionalActive = anotherAgentHasSpecialty(ids, slot, ['Anomaly']) || anotherAgentSharesAttribute(ids, slot)
    const stances = src(agent, slot, 'stances', SOURCE_LABELS.yanagiStances, 'special')
    add(mod(stances, 'dmgBonus', VERTICAL_VALUES.yanagi.stanceElectricDmg))
    add(stat(stances, 'penRatio', VERTICAL_VALUES.yanagi.stancePenRatio, 'flat'))
    add({
      kind: 'modifier',
      atom: {
        metricId: 'dmgBonus', earliestSurface: 'fully', value: VERTICAL_VALUES.yanagi.coreElectricDmg,
        source: core, sourceDetail: { label: 'Against an EX-hit target', presentationId: 'against-ex-hit-target' },
      },
    })
    if (additionalActive) add(mod(ability, 'anomalyBuildupBonus', VERTICAL_VALUES.yanagi.additionalElectricBuildup))
    add(provider(
      core,
      'all-party',
      {
        kind: 'operation', presentationId: 'disorder-dmg-multiplier', label: 'Disorder DMG Multiplier',
        value: VERTICAL_VALUES.yanagi.coreDisorderMultiplier, unit: '%',
      },
      ['anomaly_damage'],
    ))
    if (setup.mindscape >= 1) add(stat(mind(1), 'anomalyProficiency', VERTICAL_VALUES.yanagi.mindscape1AnomalyProficiency, 'flat'))
    if (setup.mindscape >= 2) add(mod(mind(2), 'anomalyBuildupBonus', VERTICAL_VALUES.yanagi.mindscape2ElectricBuildup, YANAGI_EX_RAPID_THRUST))
    if (setup.mindscape >= 4) add(provider(
      mind(4),
      'enemy-context',
      {
        kind: 'modifier', metricId: 'penRatio', earliestSurface: 'fully',
        value: VERTICAL_VALUES.yanagi.mindscape4PenRatio, sourceDetail: { label: 'Against an Exposed target', presentationId: 'against-exposed-target' },
      },
      DEF_DAMAGE_FORMULAS,
    ))
    if (setup.mindscape >= 6) add(mod(mind(6), 'dmgBonus', VERTICAL_VALUES.yanagi.mindscape6ExDmg, YANAGI_EX))
    relationships.push(...selectedEquipmentRelationships(agent, slot, setup, { observation, focusAgentId, partyAgentIds: ids }))
    actions.push(
      actionProjection('anomalyBuildupBonus', 'yanagiExRapidThrustBuildup', YANAGI_EX_RAPID_THRUST),
      { metricId: 'dmgBonus', scopes: YANAGI_DAMAGE_SCOPES },
      { metricId: 'anomalyDmgBonus', scopes: YANAGI_ANOMALY_SCOPES },
    )
    const metrics = anomalyDealerMetrics()
    metrics.splice(3, 0, m('energyRegen', 'Energy Regen', '/s', 'energyRegen', 'disclosed-or-action', 2))
    return { agentId: agent, appliedPartySlot: slot, relationships, metrics, actions }
  }
  if (agent === 'alice') {
    const additionalActive = anotherAgentHasSpecialty(ids, slot, ['Anomaly', 'Support'])
    add(mod(core, 'anomalyBuildupBonus', VERTICAL_VALUES.alice.corePhysicalBuildup))
    add({
      kind: 'operation',
      atom: {
        presentationId: 'maximum-disorder-dmg-multiplier',
        label: 'Maximum Disorder DMG Multiplier',
        value: VERTICAL_VALUES.alice.coreDisorderMultiplier, unit: '%', source: core,
      },
    })
    if (additionalActive) add({
      kind: 'linear',
      source: ability,
      basis: { statId: 'anomalyMastery', surface: 'fully' },
      outputs: [{
        transform: {
          basisThreshold: VERTICAL_VALUES.alice.additionalMasteryThreshold,
          basisIncrement: 1,
          outputIncrement: VERTICAL_VALUES.alice.additionalApPerMastery,
        },
        emission: { kind: 'stat', statId: 'anomalyProficiency', region: 'flat', earliestSurface: 'fully' },
      }],
    })
    if (setup.mindscape >= 2) {
      add(provider(
        mind(2),
        'all-party',
        {
          kind: 'modifier', metricId: 'anomalyDmgBonus', earliestSurface: 'fully',
          value: VERTICAL_VALUES.alice.mindscape2AssaultDmg, action: JANE_ASSAULT_TARGET,
        },
        ['anomaly_damage'],
      ))
      add(provider(
        mind(2),
        'all-party',
        {
          kind: 'modifier', metricId: 'anomalyDmgBonus', earliestSurface: 'fully',
          value: VERTICAL_VALUES.alice.mindscape2DisorderDmg, action: DISORDER_TARGET,
          sourceDetail: { label: 'Against an enemy suffering Physical Anomaly', presentationId: 'against-physical-anomaly-enemy' },
        },
        ['anomaly_damage'],
      ))
    }
    if (setup.mindscape >= 4) {
      add(mod(mind(4), 'resIgnore', VERTICAL_VALUES.alice.mindscape4PhysicalResIgnore))
      add(mod(mind(4), 'anomalyBuildupBonus', VERTICAL_VALUES.alice.mindscape4PhysicalBuildup, ALICE_ENHANCED_BASIC))
    }
    relationships.push(...selectedEquipmentRelationships(agent, slot, setup, { observation, focusAgentId, partyAgentIds: ids }))
    actions.push(
      actionProjection('anomalyBuildupBonus', 'aliceEnhancedBasicBuildup', ALICE_ENHANCED_BASIC),
      { metricId: 'anomalyDmgBonus', scopes: ALICE_ANOMALY_SCOPES },
      actionProjection('critRate', 'aliceAssaultCritRate', JANE_ASSAULT_TARGET),
      actionProjection('critDmg', 'aliceAssaultCritDmg', JANE_ASSAULT_TARGET),
      actionProjection('defIgnore', 'aliceAssaultDefIgnore', JANE_ASSAULT_TARGET),
    )
    return {
      agentId: agent,
      appliedPartySlot: slot,
      relationships,
      metrics: [
        ...anomalyDealerMetrics(),
        { ...m('critRate', 'CRIT Rate', '%', undefined, 'action'), resultVisibility: 'action-only' },
        { ...m('critDmg', 'CRIT DMG', '%', undefined, 'action'), resultVisibility: 'action-only' },
      ],
      actions,
    }
  }
  if (agent === 'vivian') {
    const additionalActive = anotherAgentHasSpecialty(ids, slot, ['Anomaly']) || anotherAgentSharesAttribute(ids, slot)
    if (additionalActive) {
      add(provider(
        ability,
        'all-party',
        {
          kind: 'modifier', metricId: 'anomalyDmgBonus', earliestSurface: 'fully',
          value: VERTICAL_VALUES.vivian.additionalCorruptionDmg, action: CORRUPTION_TARGET,
        },
        ['anomaly_damage'],
      ))
      add(provider(
        ability,
        'all-party',
        {
          kind: 'modifier', metricId: 'anomalyDmgBonus', earliestSurface: 'fully',
          value: VERTICAL_VALUES.vivian.additionalDisorderDmg, action: DISORDER_TARGET,
          sourceDetail: { label: 'Against an enemy suffering Corruption', presentationId: 'against-corrupted-enemy' },
        },
        ['anomaly_damage'],
      ))
    }
    if (setup.mindscape >= 1) {
      for (const action of [ATTRIBUTE_ANOMALY_TARGET, DISORDER_TARGET]) add(provider(
        mind(1),
        'all-party',
        {
          kind: 'modifier', metricId: 'anomalyDmgBonus', earliestSurface: 'fully',
          value: VERTICAL_VALUES.vivian.mindscape1AnomalyDmg, action,
          sourceDetail: { label: 'Against a target under Prophecy', presentationId: 'against-prophecy-target' },
        },
        ['anomaly_damage'],
      ))
    }
    if (setup.mindscape >= 2) {
      add(mod(mind(2), 'anomalyBuildupBonus', VERTICAL_VALUES.vivian.mindscape2EtherBuildup))
      add({
        kind: 'operation',
        atom: {
          presentationId: 'added-abloom-dmg-multiplier',
          label: 'Added Abloom DMG Multiplier',
          value: VERTICAL_VALUES.vivian.mindscape2AbloomCoefficient,
          unit: '%', source: mind(2),
        },
      })
      add(mod(mind(2), 'resIgnore', VERTICAL_VALUES.vivian.mindscape2AbloomResIgnore, ABLOOM_TARGET))
    }
    if (setup.mindscape >= 4) add(stat(mind(4), 'atk', VERTICAL_VALUES.vivian.mindscape4Atk, 'percentage'))
    if (setup.mindscape >= 6) add(mod(mind(6), 'dmgBonus', VERTICAL_VALUES.vivian.mindscape6EtherDmg))
    relationships.push(...selectedEquipmentRelationships(agent, slot, setup, { observation, focusAgentId, partyAgentIds: ids }))
    actions.push(
      { metricId: 'anomalyDmgBonus', scopes: VIVIAN_ANOMALY_SCOPES },
      actionProjection('defIgnore', 'vivianAbloomDefIgnore', ABLOOM_TARGET),
      actionProjection('resIgnore', 'vivianAbloomResIgnore', ABLOOM_TARGET),
    )
    const metrics = anomalyDealerMetrics()
    metrics.splice(3, 0, m('energyRegen', 'Energy Regen', '/s', 'energyRegen', 'disclosed-or-action', 2))
    return { agentId: agent, appliedPartySlot: slot, relationships, metrics, actions }
  }
  if (agent === 'aria') {
    add(stat(core, 'anomalyProficiency', VERTICAL_VALUES.aria.coreAnomalyProficiency, 'flat', 'initial'))
    if (setup.mindscape >= 1) {
      add(mod(mind(1), 'critRate', VERTICAL_VALUES.aria.mindscape1AbloomCritRate, ABLOOM_TARGET))
      add(mod(mind(1), 'critDmg', VERTICAL_VALUES.aria.mindscape1AbloomCritDmg, ABLOOM_TARGET))
      add({
        kind: 'linear', source: mind(1),
        basis: { statId: 'anomalyMastery', surface: 'initial' },
        outputs: [{
          transform: {
            basisThreshold: 100, basisIncrement: 1,
            outputIncrement: VERTICAL_VALUES.aria.mindscape1CritRatePerInitialMastery,
            outputCap: VERTICAL_VALUES.aria.mindscape1CritRateCap - VERTICAL_VALUES.aria.mindscape1AbloomCritRate,
          },
          emission: { kind: 'modifier', metricId: 'critRate', earliestSurface: 'fully', action: ABLOOM_TARGET },
        }],
      })
      add({
        kind: 'modifier',
        atom: {
          metricId: 'anomalyBuildupResReduction', earliestSurface: 'fully',
          value: VERTICAL_VALUES.aria.mindscape1EtherBuildupResIgnore,
          action: ARIA_BUILDUP, source: mind(1), sourceDetail: { label: 'Ignores Ether Anomaly Buildup RES', presentationId: 'ignores-ether-anomaly-buildup-res' },
        },
      })
    }
    if (setup.mindscape >= 2) {
      add(mod(mind(2), 'defIgnore', VERTICAL_VALUES.aria.mindscape2DefIgnore, ARIA_ATTACKS))
      add(mod(mind(2), 'defIgnore', VERTICAL_VALUES.aria.mindscape2DefIgnore, ABLOOM_TARGET))
    }
    if (setup.mindscape >= 6) add(mod(mind(6), 'dmgBonus', VERTICAL_VALUES.aria.mindscape6EtherDmg, ARIA_M6_DAMAGE))
    relationships.push(...selectedEquipmentRelationships(agent, slot, setup, { observation, focusAgentId, partyAgentIds: ids }))
    const critCap = { value: 100, source: selectedCalculationSource(agent, slot, 'crit-rate-cap', 'Displayed CRIT Rate cap') }
    actions.push(
      { metricId: 'anomalyDmgBonus', scopes: ARIA_ANOMALY_SCOPES },
      {
        metricId: 'defIgnore',
        scopes: [
          { id: 'ariaAttacksDefIgnore', target: ARIA_ATTACKS },
          { id: 'ariaAbloomDefIgnore', target: ABLOOM_TARGET },
        ],
      },
      { ...actionProjection('critRate', 'ariaAbloomCritRate', ABLOOM_TARGET), cap: critCap },
      actionProjection('critDmg', 'ariaAbloomCritDmg', ABLOOM_TARGET),
      actionProjection('anomalyBuildupResReduction', 'ariaBasicSpecialBuildupRes', ARIA_BUILDUP),
      actionProjection('dmgBonus', 'ariaEnhancedBasicUltimateDmg', ARIA_M6_DAMAGE),
    )
    const metrics = anomalyDealerMetrics()
    metrics.splice(
      3,
      0,
      { ...m('critRate', 'CRIT Rate', '%', undefined, 'action'), resultVisibility: 'action-only' },
      { ...m('critDmg', 'CRIT DMG', '%', undefined, 'action'), resultVisibility: 'action-only' },
    )
    return { agentId: agent, appliedPartySlot: slot, relationships, metrics, actions }
  }
  if (agent === 'promeia') {
    add({
      kind: 'linear', source: core,
      basis: { statId: 'anomalyMastery', surface: 'initial' },
      outputs: [
        {
          transform: {
            basisThreshold: VERTICAL_VALUES.promeia.coreMasteryThreshold,
            basisIncrement: 1,
            outputIncrement: VERTICAL_VALUES.promeia.coreAnomalyProficiencyPerMastery,
          },
          emission: {
            kind: 'stat', statId: 'anomalyProficiency', region: 'flat', earliestSurface: 'fully',
            sourceDetail: { label: 'From Initial Anomaly Mastery above 150', presentationId: 'from-initial-anomaly-mastery-above-150' },
          },
        },
        {
          transform: {
            basisThreshold: VERTICAL_VALUES.promeia.coreMasteryThreshold,
            basisIncrement: 1,
            outputIncrement: VERTICAL_VALUES.promeia.coreSquadAbloomDmgPerMastery,
          },
          emission: {
            kind: 'provider', delivery: { recipient: 'all-party', formulas: ['anomaly_damage'] },
            effect: {
              kind: 'modifier', metricId: 'anomalyDmgBonus', earliestSurface: 'fully',
              action: ABLOOM_TARGET,
              sourceDetail: { label: 'From Promeia Initial Anomaly Mastery above 150', presentationId: 'from-promeia-initial-anomaly-mastery-above-150' },
            },
          },
        },
      ],
    })
    const additionalActive = anotherAgentHasSpecialty(ids, slot, ['Anomaly', 'Support'])
    if (additionalActive) {
      add(mod(ability, 'anomalyBuildupBonus', VERTICAL_VALUES.promeia.additionalIceBuildup))
      add({
        kind: 'operation',
        atom: {
          presentationId: 'frostbite-duration',
          label: 'Frostbite duration',
          value: VERTICAL_VALUES.promeia.additionalFrostbiteDuration,
          unit: 's', source: ability,
        },
      })
      add(provider(
        ability,
        'all-party',
        {
          kind: 'modifier', metricId: 'defIgnore', earliestSurface: 'fully',
          value: VERTICAL_VALUES.promeia.additionalAbloomDefIgnore, action: ABLOOM_TARGET,
          sourceDetail: { label: 'Against a target under Presumption', presentationId: 'against-presumption-target' },
        },
        ['anomaly_damage'],
      ))
      if (setup.mindscape >= 1) add(provider(
        mind(1),
        'all-party',
        {
          kind: 'modifier', metricId: 'defIgnore', earliestSurface: 'fully',
          value: VERTICAL_VALUES.promeia.mindscape1AbloomDefIgnore - VERTICAL_VALUES.promeia.additionalAbloomDefIgnore,
          action: ABLOOM_TARGET, sourceDetail: { label: 'Against a target under Presumption', presentationId: 'against-presumption-target' },
        },
        ['anomaly_damage'],
      ))
    }
    if (setup.mindscape >= 2) {
      add(stat(mind(2), 'anomalyProficiency', VERTICAL_VALUES.promeia.mindscape2AnomalyProficiency, 'flat'))
      add({
        kind: 'operation',
        atom: {
          presentationId: 'added-abloom-dmg-multiplier',
          label: 'Added Abloom DMG Multiplier',
          value: VERTICAL_VALUES.promeia.mindscape2AbloomCoefficient,
          unit: '%', source: mind(2),
        },
      })
    }
    if (setup.mindscape >= 6) {
      add(mod(mind(6), 'resIgnore', VERTICAL_VALUES.promeia.mindscape6AnomalyResIgnore, ATTRIBUTE_ANOMALY_TARGET))
      add(mod(mind(6), 'resIgnore', VERTICAL_VALUES.promeia.mindscape6AnomalyResIgnore, DISORDER_TARGET))
    }
    relationships.push(...selectedEquipmentRelationships(agent, slot, setup, { observation, focusAgentId, partyAgentIds: ids }))
    actions.push(
      { metricId: 'anomalyDmgBonus', scopes: PROMEIA_ANOMALY_SCOPES },
      actionProjection('defIgnore', 'promeiaAbloomDefIgnore', ABLOOM_TARGET),
      { metricId: 'resIgnore', scopes: PROMEIA_ANOMALY_SCOPES },
    )
    return { agentId: agent, appliedPartySlot: slot, relationships, metrics: anomalyDealerMetrics(), actions }
  }
  if (agent === 'velina') {
    const contaminationAttribute = effectAttributeForAgent(focusAgentId)
    add({
      kind: 'gauge',
      source: core,
      basis: { statId: 'energyRegen', surface: 'initial' },
      basisLabel: 'Initial Energy Regen',
      basisPresentationId: 'initial-energy-regen',
      basisThreshold: VERTICAL_VALUES.velina.coreEnergyThreshold,
      basisCap: VERTICAL_VALUES.velina.coreEnergyCap,
      metricId: 'energyRegen',
      outputs: [
        {
          presentationId: 'dmg-bonus', label: 'DMG Bonus', unit: '%', cap: VERTICAL_VALUES.velina.coreDmgCap,
          transform: {
            basisThreshold: VERTICAL_VALUES.velina.coreEnergyThreshold,
            basisIncrement: 0.01,
            outputIncrement: VERTICAL_VALUES.velina.coreDmgPerEnergy,
            outputCap: VERTICAL_VALUES.velina.coreDmgCap,
          },
          emission: {
            kind: 'modifier', metricId: 'dmgBonus', earliestSurface: 'fully',
          },
        },
        {
          presentationId: 'anomaly-mastery', label: 'Anomaly Mastery', unit: '', cap: VERTICAL_VALUES.velina.coreMasteryCap,
          transform: {
            basisThreshold: VERTICAL_VALUES.velina.coreEnergyThreshold,
            basisIncrement: 0.01,
            outputIncrement: VERTICAL_VALUES.velina.coreMasteryPerEnergy,
            outputCap: VERTICAL_VALUES.velina.coreMasteryCap,
          },
          emission: {
            kind: 'stat', statId: 'anomalyMastery', region: 'flat', earliestSurface: 'fully',
          },
        },
      ],
      decimals: { current: 2, threshold: 2, cap: 2, output: 2, outputCap: 0 },
    })
    add({
      kind: 'operation',
      atom: {
        presentationId: 'added-vortex-dmg-multiplier',
        label: 'Added Vortex DMG Multiplier',
        value: VERTICAL_VALUES.velina.coreVortexMultiplier,
        unit: '%', source: core,
      },
    })
    add(provider(
      core,
      'enemy-context',
      {
        kind: 'modifier', metricId: 'anomalyBuildupResReduction', earliestSurface: 'fully',
        value: VERTICAL_VALUES.velina.coreBuildupResReduction,
        sourceDetail: { label: 'Sweeping Cyclone · Wind Anomaly Buildup RES', presentationId: 'sweeping-cyclone-wind-anomaly-buildup-res' },
      },
      ['anomaly_buildup'],
      ['Wind'],
    ))
    add(provider(
      core,
      'enemy-context',
      {
        kind: 'modifier', metricId: 'anomalyBuildupResReduction', earliestSurface: 'fully',
        value: VERTICAL_VALUES.velina.coreBuildupResReduction,
        sourceDetail: { label: 'Contamination Attribute · selected by Focus', presentationId: 'contamination-attribute-selected-by-focus' },
      },
      ['anomaly_buildup'],
      [contaminationAttribute],
    ))

    const additionalActive = anotherAgentHasSpecialty(ids, slot, ['Anomaly'])
      || anotherAgentSharesAttribute(ids, slot)
    if (additionalActive) {
      for (const action of [WINDSWEPT_TARGET, VORTEX_TARGET]) {
        add(mod(
          ability,
          'anomalyDmgBonus',
          VERTICAL_VALUES.velina.additionalAnomalyDmg,
          action,
        ))
      }
      add(provider(
        ability,
        'enemy-context',
        {
          kind: 'modifier', metricId: 'anomalyBuildupResReduction', earliestSurface: 'fully',
          value: VERTICAL_VALUES.velina.additionalBuildupResReduction,
          sourceDetail: { label: 'Sweeping Cyclone · Wind Anomaly Buildup RES', presentationId: 'sweeping-cyclone-wind-anomaly-buildup-res' },
        },
        ['anomaly_buildup'],
        ['Wind'],
      ))
      add(provider(
        ability,
        'enemy-context',
        {
          kind: 'modifier', metricId: 'anomalyBuildupResReduction', earliestSurface: 'fully',
          value: VERTICAL_VALUES.velina.additionalBuildupResReduction,
          sourceDetail: { label: 'Contamination Attribute · selected by Focus', presentationId: 'contamination-attribute-selected-by-focus' },
        },
        ['anomaly_buildup'],
        [contaminationAttribute],
      ))
      add(mod(
        ability,
        'anomalyBuildupBonus',
        VERTICAL_VALUES.velina.additionalBuildup,
        VELINA_SWEEPING_CYCLONE,
      ))
    }

    if (setup.mindscape >= 1) {
      add(mod(
        mind(1),
        'resIgnore',
        VERTICAL_VALUES.velina.mindscape1VortexResIgnore,
        VORTEX_TARGET,
      ))
      add(provider(
        mind(1),
        'all-party',
        {
          kind: 'modifier', metricId: 'resIgnore', earliestSurface: 'fully',
          value: VERTICAL_VALUES.velina.mindscape1WindsweptResIgnore,
          action: WINDSWEPT_TARGET,
        },
        ['anomaly_damage'],
      ))
    }
    if (setup.mindscape >= 2) {
      if (additionalActive) {
        for (const action of [WINDSWEPT_TARGET, VORTEX_TARGET]) {
          add(mod(
            mind(2),
            'anomalyDmgBonus',
            VERTICAL_VALUES.velina.mindscape2AnomalyDmg,
            action,
          ))
        }
      }
    }
    if (setup.mindscape >= 4) {
      add(stat(mind(4), 'atk', VERTICAL_VALUES.velina.mindscape4Atk, 'percentage'))
    }
    if (setup.mindscape >= 6) {
      add(mod(
        mind(6),
        'anomalyBuildupBonus',
        VERTICAL_VALUES.velina.mindscape6WindBuildup,
        VELINA_WIND_TARGET_BUILDUP,
      ))
      add(mod(
        mind(6),
        'anomalyDmgBonus',
        VERTICAL_VALUES.velina.mindscape6WindsweptDmg,
        WINDSWEPT_TARGET,
      ))
    }

    relationships.push(...selectedEquipmentRelationships(
      agent,
      slot,
      setup,
      { observation, focusAgentId, partyAgentIds: ids },
    ))
    actions.push(
      { metricId: 'anomalyDmgBonus', scopes: velinaAnomalyScopes(additionalActive) },
      {
        metricId: 'anomalyBuildupBonus',
        scopes: [
          { id: 'velinaSweepingCycloneBuildup', target: VELINA_SWEEPING_CYCLONE },
          { id: 'velinaWindTargetBuildup', target: VELINA_WIND_TARGET_BUILDUP },
        ],
      },
      {
        metricId: 'resIgnore',
        scopes: [
          { id: 'velinaWindsweptResIgnore', target: WINDSWEPT_TARGET },
          { id: 'velinaVortexResIgnore', target: VORTEX_TARGET },
        ],
      },
    )
    const metrics = [
      m('atk', 'ATK', '', 'atk'),
      m('anomalyProficiency', 'Anomaly Proficiency', '', 'anomalyProficiency'),
      m('anomalyMastery', 'Anomaly Mastery', '', 'anomalyMastery', undefined, 2),
      m('energyRegen', 'Energy Regen', '/s', 'energyRegen', undefined, 2),
      m('dmgBonus', 'DMG Bonus', '%', undefined, 'nonzero-or-action'),
      m('anomalyDmgBonus', 'Anomaly DMG Bonus', '%', undefined, 'nonzero-or-action'),
      m('anomalyBuildupBonus', 'Anomaly Buildup Bonus', '%', undefined, 'nonzero-or-action'),
      m('penRatio', 'PEN Ratio', '%', 'penRatio', 'disclosed-or-action'),
      m('anomalyBuildupResReduction', 'Anomaly Buildup RES Reduction', '%', undefined, 'nonzero-or-action'),
      m('defIgnore', 'DEF Ignore', '%', undefined, 'nonzero-or-action'),
      m('defReduction', 'DEF Reduction', '%', undefined, 'nonzero-or-action'),
      m('resIgnore', 'RES Ignore', '%', undefined, 'nonzero-or-action'),
      m('resReduction', 'RES Reduction', '%', undefined, 'nonzero-or-action'),
      m('stunDmgMultiplier', 'Stun DMG Multiplier', '%', undefined, 'nonzero-or-action'),
    ]
    return { agentId: agent, appliedPartySlot: slot, relationships, metrics, actions }
  }
  if (agent === 'yuzuha') {
    const additionalActive = anotherAgentHasSpecialty(ids, slot, ['Anomaly']) || anotherAgentSharesFaction(ids, slot)
    const flavorAttribute = effectAttributeForAgent(ids[state.focusSlot])
    const flavor = actionTarget([sourceLocalAction(
      'flavor-match',
      `${flavorAttribute} Anomaly Buildup · Flavor Match`,
      flavorAttribute,
    )])
    const outputs = additionalActive ? { anomaly: (setup.mindscape >= 1 ? VERTICAL_VALUES.yuzuha.mindscape1AnomalyPerMastery : VERTICAL_VALUES.yuzuha.additionalAnomalyPerMastery), buildup: VERTICAL_VALUES.yuzuha.additionalBuildupPerMastery } : { anomaly: 0, buildup: 0 }
    add({ kind: 'gauge', source: core, basis: { statId: 'atk', surface: 'initial' }, basisLabel: 'Initial ATK', basisPresentationId: 'initial-atk', basisCap: VERTICAL_VALUES.yuzuha.tanukiAtkCap / VERTICAL_VALUES.yuzuha.tanukiAtkRatio, metricId: 'atk', outputs: [{ presentationId: 'squad-flat-atk', label: 'Squad flat ATK', unit: '', cap: VERTICAL_VALUES.yuzuha.tanukiAtkCap, transform: { basisIncrement: 1, outputIncrement: VERTICAL_VALUES.yuzuha.tanukiAtkRatio, outputCap: VERTICAL_VALUES.yuzuha.tanukiAtkCap }, emission: { kind: 'provider', delivery: { recipient: 'all-party', formulas: DAMAGE }, effect: { kind: 'stat', statId: 'atk', region: 'flat', earliestSurface: 'fully' } } }] })
    add(provider(core, 'all-party', { kind: 'modifier', metricId: 'dmgBonus', earliestSurface: 'fully', value: VERTICAL_VALUES.yuzuha.tanukiDmgBonus }, DAMAGE))
    add(mod(src(agent, slot, 'sugarburst', 'Basic Attack · Sugarburst', 'basic'), 'anomalyBuildupBonus', VERTICAL_VALUES.yuzuha.sugarburstBuildupByMindscapeTier[setup.mindscape >= 5 ? 2 : setup.mindscape >= 3 ? 1 : 0], flavor))
    if (additionalActive) add({ kind: 'gauge', source: ability, basis: { statId: 'anomalyMastery', surface: 'fully' }, basisLabel: 'Fully Enabled Anomaly Mastery', basisPresentationId: 'fully-anomaly-mastery', basisThreshold: VERTICAL_VALUES.yuzuha.additionalMasteryThreshold, basisCap: VERTICAL_VALUES.yuzuha.additionalMasteryCap, metricId: 'anomalyMastery', outputs: [{ presentationId: 'anomaly-buildup-rate', label: 'Anomaly Buildup Rate', unit: '%', cap: 20, transform: { basisThreshold: 100, basisIncrement: 1, outputIncrement: outputs.buildup, outputCap: 20 }, emission: { kind: 'provider', delivery: { recipient: 'all-party', formulas: ['anomaly_buildup'] }, effect: { kind: 'modifier', metricId: 'anomalyBuildupBonus', earliestSurface: 'fully' } } }, { presentationId: 'attribute-anomaly-dmg', label: 'Attribute Anomaly DMG', unit: '%', cap: setup.mindscape >= 1 ? 26 : 20, transform: { basisThreshold: 100, basisIncrement: 1, outputIncrement: outputs.anomaly, outputCap: setup.mindscape >= 1 ? 26 : 20 }, emission: { kind: 'provider', delivery: { recipient: 'all-party', formulas: ['anomaly_damage'] }, effect: { kind: 'modifier', metricId: 'anomalyDmgBonus', earliestSurface: 'fully', action: ATTRIBUTE_ANOMALY_TARGET } } }, { presentationId: 'disorder-dmg', label: 'Disorder DMG', unit: '%', cap: setup.mindscape >= 1 ? 26 : 20, transform: { basisThreshold: 100, basisIncrement: 1, outputIncrement: outputs.anomaly, outputCap: setup.mindscape >= 1 ? 26 : 20 }, emission: { kind: 'provider', delivery: { recipient: 'all-party', formulas: ['anomaly_damage'] }, effect: { kind: 'modifier', metricId: 'anomalyDmgBonus', earliestSurface: 'fully', action: DISORDER_TARGET } } }] })
    if (setup.mindscape >= 1) add(provider(mind(1), 'enemy-context', { kind: 'modifier', metricId: 'resReduction', earliestSurface: 'fully', value: VERTICAL_VALUES.yuzuha.mindscape1ResReduction }, DAMAGE))
    if (setup.mindscape >= 2) { add(provider(mind(2), 'all-party', { kind: 'modifier', metricId: 'dmgBonus', earliestSurface: 'fully', value: VERTICAL_VALUES.yuzuha.mindscape2DmgBonus }, DAMAGE)); add(provider(mind(2), 'all-party', { kind: 'modifier', metricId: 'anomalyBuildupBonus', earliestSurface: 'fully', value: VERTICAL_VALUES.yuzuha.mindscape2BuildupBonus }, ['anomaly_buildup'])) }
    if (setup.mindscape >= 4) add(mod(mind(4), 'anomalyBuildupBonus', VERTICAL_VALUES.yuzuha.mindscape4AssistBuildup, YUZUHA_ASSIST))
    if (setup.mindscape >= 6) add(provider(mind(6), 'all-party', { kind: 'operation', presentationId: 'disorder-dmg-multiplier', label: 'Disorder DMG Multiplier', value: VERTICAL_VALUES.yuzuha.mindscape6DisorderMultiplier, unit: '%' }, ['anomaly_damage']))
    actions.push(actionProjection('anomalyBuildupBonus', 'yuzuhaFlavorMatch', flavor), actionProjection('anomalyBuildupBonus', 'yuzuhaAssistFollowUp', YUZUHA_ASSIST))
    relationships.push(...selectedEquipmentRelationships(agent, slot, setup, { observation, focusAgentId, partyAgentIds: ids }))
    const metrics = [
      m('atk', 'ATK', '', 'atk'),
      m('anomalyMastery', 'Anomaly Mastery', '', 'anomalyMastery', undefined, 2),
      m('energyRegen', 'Energy Regen', '/s', 'energyRegen'),
      m('anomalyBuildupBonus', 'Anomaly Buildup Bonus', '%', undefined, 'nonzero-or-action'),
    ]
    return { agentId: agent, appliedPartySlot: slot, relationships, metrics, actions }
  }
  const additionalActive = anotherAgentHasSpecialty(ids, slot, ['Anomaly']) || anotherAgentSharesFaction(ids, slot)
  add(provider(ability, 'self', { kind: 'modifier', metricId: 'anomalyBuildupBonus', earliestSurface: 'fully', value: additionalActive ? VERTICAL_VALUES.burnice.additionalBuildupRate : 0, action: BURNICE_BUILDUP }, ['anomaly_buildup'], ['Fire']))
  if (additionalActive) add({ kind: 'operation', atom: { presentationId: 'burn-duration', label: 'Burn duration', value: VERTICAL_VALUES.burnice.burnDurationExtensionSeconds, unit: 's', source: ability } })
  const potential = src(agent, slot, 'potential', SOURCE_LABELS.burnicePotential, 'identity')
  add({ kind: 'post-delivery-stat-modifier-gauge', source: core, basis: { statId: 'anomalyProficiency', surface: 'fully' }, basisLabel: 'Fully Enabled Anomaly Proficiency', basisPresentationId: 'fully-anomaly-proficiency', basisCap: VERTICAL_VALUES.burnice.afterburnApCap, gaugeMetricId: 'anomalyProficiency', modifierMetricId: 'dmgBonus', action: BURNICE_AFTERBURN, modifierSurface: 'fully', output: { presentationId: 'afterburn-dmg-bonus', label: 'Afterburn DMG Bonus', value: { kind: 'linear', transform: { basisIncrement: 10, outputIncrement: VERTICAL_VALUES.burnice.afterburnDmgBonusPerThreshold, outputCap: VERTICAL_VALUES.burnice.afterburnDmgBonusCap } }, cap: VERTICAL_VALUES.burnice.afterburnDmgBonusCap, unit: '%' }, decimals: { current: 0, cap: 0, output: 1, outputCap: 0 } })
  add({ kind: 'gauge', source: potential, basis: { statId: 'energyRegen', surface: 'initial' }, basisLabel: 'Initial Energy Regen', basisPresentationId: 'initial-energy-regen', basisThreshold: VERTICAL_VALUES.burnice.potentialEnergyThreshold, basisCap: VERTICAL_VALUES.burnice.potentialEnergyThreshold + 1, metricId: 'energyRegen', outputs: [{ presentationId: 'anomaly-mastery', label: 'Anomaly Mastery', unit: '', cap: VERTICAL_VALUES.burnice.potentialMasteryCap, transform: { basisThreshold: VERTICAL_VALUES.burnice.potentialEnergyThreshold, basisIncrement: 0.1, outputIncrement: VERTICAL_VALUES.burnice.potentialMasteryPerIncrement, outputCap: VERTICAL_VALUES.burnice.potentialMasteryCap }, emission: { kind: 'stat', statId: 'anomalyMastery', region: 'flat', earliestSurface: 'fully' } }, { presentationId: 'dmg-bonus', label: 'DMG Bonus', unit: '%', cap: VERTICAL_VALUES.burnice.potentialDmgCap, transform: { basisThreshold: VERTICAL_VALUES.burnice.potentialEnergyThreshold, basisIncrement: 0.1, outputIncrement: VERTICAL_VALUES.burnice.potentialDmgPerIncrement, outputCap: VERTICAL_VALUES.burnice.potentialDmgCap }, emission: { kind: 'modifier', metricId: 'dmgBonus', earliestSurface: 'fully' } }], decimals: { current: 3, threshold: 1, cap: 1, output: 1, outputCap: 0 } })
  if (setup.mindscape >= 1) { add(mod(mind(1), 'anomalyBuildupBonus', VERTICAL_VALUES.burnice.mindscape1BuildupRate, BURNICE_AFTERBURN)); add({ kind: 'operation', atom: { presentationId: 'added-afterburn-dmg-multiplier', label: 'Added Afterburn DMG Multiplier', value: VERTICAL_VALUES.burnice.mindscape1AddedAtkPercent, unit: '% ATK', source: mind(1) } }) }
  if (setup.mindscape >= 2) add(provider(mind(2), 'enemy-context', { kind: 'modifier', metricId: 'penRatio', earliestSurface: 'fully', value: VERTICAL_VALUES.burnice.mindscape2PenRatio }, DEF_DAMAGE_FORMULAS))
  if (setup.mindscape >= 4) add(provider(mind(4), 'self', { kind: 'modifier', metricId: 'critRate', earliestSurface: 'fully', value: VERTICAL_VALUES.burnice.mindscape4CritRate, action: BURNICE_EX_ASSIST }, ['general_damage'], ['Fire']))
  if (setup.mindscape >= 6) {
    add(provider(mind(6), 'self', { kind: 'modifier', metricId: 'resIgnore', earliestSurface: 'fully', value: VERTICAL_VALUES.burnice.mindscape6FireResIgnore, action: BURNICE_DOUBLE }, ['general_damage'], ['Fire']))
    add(provider(mind(6), 'self', { kind: 'modifier', metricId: 'resIgnore', earliestSurface: 'fully', value: VERTICAL_VALUES.burnice.mindscape6FireResIgnore, action: BURNICE_BURN }, ['anomaly_damage'], ['Fire']))
  }
  actions.push(
    { metricId: 'anomalyBuildupBonus', scopes: BURNICE_BUILDUP_SCOPES },
    actionProjection('dmgBonus', 'burniceExAssistDmg', BURNICE_EX_ASSIST),
    { metricId: 'dmgBonus', scopes: [{
      id: 'burniceAfterburn', target: BURNICE_AFTERBURN,
      inheritedEffectTargets: [BURNICE_EX_ASSIST],
    }] },
    { metricId: 'anomalyDmgBonus', scopes: BURNICE_ANOMALY_SCOPES },
    actionProjection('critRate', 'burniceExAssistCrit', BURNICE_EX_ASSIST),
    { metricId: 'resIgnore', scopes: BURNICE_RES_SCOPES },
  )
  relationships.push(...selectedEquipmentRelationships(agent, slot, setup, { observation, focusAgentId, partyAgentIds: ids }))
  const metrics = [
    m('atk', 'ATK', '', 'atk'),
    m('anomalyProficiency', 'Anomaly Proficiency', '', 'anomalyProficiency'),
    m('anomalyMastery', 'Anomaly Mastery', '', 'anomalyMastery', undefined, 1),
    m('energyRegen', 'Energy Regen', '/s', 'energyRegen', undefined, 3),
    m('critRate', 'CRIT Rate', '%', 'critRate', 'disclosed-or-action'),
    m('critDmg', 'CRIT DMG', '%', undefined, 'nonzero-or-action'),
    m('dmgBonus', 'DMG Bonus', '%', undefined, 'nonzero-or-action'),
    m('anomalyDmgBonus', 'Anomaly DMG Bonus', '%', undefined, 'nonzero-or-action'),
    m('anomalyBuildupBonus', 'Anomaly Buildup Bonus', '%', undefined, 'nonzero-or-action'),
    m('penRatio', 'PEN Ratio', '%', 'penRatio', 'disclosed-or-action'),
    m('anomalyBuildupResReduction', 'Anomaly Buildup RES Reduction', '%', undefined, 'nonzero-or-action'),
    m('defIgnore', 'DEF Ignore', '%', undefined, 'nonzero-or-action'),
    m('defReduction', 'DEF Reduction', '%', undefined, 'nonzero-or-action'),
    m('resIgnore', 'RES Ignore', '%', undefined, 'nonzero-or-action'),
    m('resReduction', 'RES Reduction', '%', undefined, 'nonzero-or-action'),
    m('stunDmgMultiplier', 'Stun DMG Multiplier', '%', undefined, 'nonzero-or-action'),
  ]
  return { agentId: agent, appliedPartySlot: slot, relationships, metrics, actions }
}

export function anomalyOutcomeProfileFor(
  agent: Agent,
  state: WorkbenchState,
  slot: Slot,
): AgentSourceProfile {
  return buildAnomalyOutcomeProfile(agent, state, slot)
}
