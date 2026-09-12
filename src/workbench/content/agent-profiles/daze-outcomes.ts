import { ABLOOM_TARGET, AFTERSHOCK_TARGET, ATTRIBUTE_ANOMALY_TARGET, DISORDER_TARGET, MIYABI_FROSTBURN_BUILDUP_TARGET, MIYABI_FROSTBURN_REMOVED_BUILDUP_TARGET, actionForm, actionTarget, canonicalAction, sourceLocalAction } from '../../actions'
import { effectiveSubstatChoicesForSlot } from '../../candidates'
import type { ActionScopeNode } from '../../calculation/composition'
import { actionProjection, type ActionProjection, type AgentSourceProfile, type MetricProjection } from '../../calculation/profile-harness'
import type { ProfileRelationship } from '../../calculation/relationships'
import type { WorkbenchState } from '../../state'
import { CRIT_DAMAGE_FORMULAS, REGULAR_DAMAGE_FORMULAS } from '../../formula-policy'
import { anotherAgentSharesAttribute, anotherAgentSharesFaction, nangongAdditionalIsActive, qingyiAdditionalIsActive, triggerAdditionalIsActive } from '../../party-conditions'
import { ADMITTED_AGENTS } from '../agents'
import { SOURCE_LABELS, VERTICAL_VALUES } from '../retained-values'
import { FORMULA_PARTICIPATION_BY_AGENT } from '../setup-options'
import { requireCompleteSelectedSetup, selectedEquipmentRelationships, selectedSetupRelationships, type CompleteSelectedSetup, type SelectedSetupObservation } from '../agent-sources/equipment'
import {
  selectedAgentSource,
  selectedCalculationSource,
  selectedMindscapeSource,
} from '../agent-sources/sources'
import { agentBroadPrePenRelationships } from '../agent-broad-pre-pen-relationships'

type Agent = 'dialyn' | 'trigger' | 'lycaon' | 'juFufu' | 'lighter' | 'pulchra' | 'qingyi' | 'koleda' | 'anby' | 'nangongYu' | 'norma'
type Slot = 0 | 1 | 2
type Locus = 'identity' | 'core' | 'additional' | 'basic' | 'assist' | 'chain' | 'special' | 'ex-special' | 'ultimate'
type ProfileSetup = CompleteSelectedSetup & {
  mindscape: 0 | 1 | 2 | 3 | 4 | 5 | 6
}
const DAMAGE = REGULAR_DAMAGE_FORMULAS

const BASE: Record<Agent, SelectedSetupObservation['baseStats']> = {
  dialyn: { critRate: VERTICAL_VALUES.dialyn.critRate, impact: VERTICAL_VALUES.dialyn.impact, energyRegen: VERTICAL_VALUES.dialyn.baseEnergyRegen },
  trigger: { critRate: VERTICAL_VALUES.trigger.critRate, critDmg: VERTICAL_VALUES.trigger.critDmg, impact: VERTICAL_VALUES.trigger.impact },
  lycaon: { critRate: VERTICAL_VALUES.lycaon.critRate, impact: VERTICAL_VALUES.lycaon.impact, energyRegen: VERTICAL_VALUES.lycaon.baseEnergyRegen, anomalyMastery: VERTICAL_VALUES.lycaon.anomalyMastery },
  juFufu: { atk: VERTICAL_VALUES.juFufu.atk, critRate: VERTICAL_VALUES.juFufu.critRate, impact: VERTICAL_VALUES.juFufu.impact, energyRegen: VERTICAL_VALUES.juFufu.baseEnergyRegen },
  lighter: { critRate: VERTICAL_VALUES.lighter.critRate, impact: VERTICAL_VALUES.lighter.impact, energyRegen: VERTICAL_VALUES.lighter.baseEnergyRegen },
  pulchra: { critRate: VERTICAL_VALUES.pulchra.critRate, impact: VERTICAL_VALUES.pulchra.impact, energyRegen: VERTICAL_VALUES.pulchra.baseEnergyRegen },
  qingyi: { atk: VERTICAL_VALUES.qingyi.atk, critRate: VERTICAL_VALUES.qingyi.critRate, critDmg: VERTICAL_VALUES.qingyi.critDmg, impact: VERTICAL_VALUES.qingyi.impact, energyRegen: VERTICAL_VALUES.qingyi.baseEnergyRegen },
  koleda: { critRate: VERTICAL_VALUES.koleda.critRate, impact: VERTICAL_VALUES.koleda.impact, energyRegen: VERTICAL_VALUES.koleda.baseEnergyRegen },
  anby: { critRate: VERTICAL_VALUES.anby.critRate, impact: VERTICAL_VALUES.anby.impact, energyRegen: VERTICAL_VALUES.anby.baseEnergyRegen },
  nangongYu: { atk: VERTICAL_VALUES.nangongYu.atk, anomalyProficiency: VERTICAL_VALUES.nangongYu.anomalyProficiency, anomalyMastery: VERTICAL_VALUES.nangongYu.anomalyMastery, impact: VERTICAL_VALUES.nangongYu.impact, energyRegen: VERTICAL_VALUES.nangongYu.baseEnergyRegen, penRatio: 0 },
  norma: { atk: VERTICAL_VALUES.norma.atk, critRate: VERTICAL_VALUES.norma.critRate, critDmg: VERTICAL_VALUES.norma.critDmg, impact: VERTICAL_VALUES.norma.impact, energyRegen: VERTICAL_VALUES.norma.baseEnergyRegen, penRatio: 0 },
}

const m = (id: MetricProjection['id'], label: string, unit: string, statId?: MetricProjection['statId'], admission?: MetricProjection['admission']): MetricProjection => ({
  id, label, unit, decimals: unit === '/s' ? 2 : unit === '%' || id === 'sheerForce' ? 1 : id === 'impact' ? 2 : 0,
  ...(statId ? { statId } : { baseValues: { initial: 0, combat: 0, fully: 0 } }),
  ...(admission ? { admission } : {}),
})

const source = (agent: Agent, slot: Slot, id: string, label: string, locus: Locus = 'core') => selectedAgentSource(agent, slot, id, label, locus)
const critCap = (agent: Agent, slot: Slot) => ({ value: 100, source: selectedCalculationSource(agent, slot, 'crit-rate-cap', 'Displayed CRIT Rate cap') })
const mind = (agent: Agent, slot: Slot, selected: 0 | 1 | 2 | 3 | 4 | 5 | 6, tier: 1 | 2 | 3 | 4 | 5 | 6) => selectedMindscapeSource(agent, slot, selected, tier)
const stat = (statId: 'maxHp' | 'atk' | 'impact' | 'critRate' | 'critDmg', region: 'percentage' | 'flat', value: number, src: ReturnType<typeof source>, earliestSurface: 'initial' | 'combat' | 'fully' = 'fully'): ProfileRelationship => ({ kind: 'stat', atom: { statId, region, earliestSurface, value, source: src } })
const mod = (metricId: 'dmgBonus' | 'sheerDmgBonus' | 'sheerForce' | 'critRate' | 'critDmg' | 'dazeBonus' | 'stunDmgMultiplier' | 'resIgnore' | 'resReduction' | 'defReduction' | 'anomalyBuildupBonus', value: number, src: ReturnType<typeof source>, action?: ReturnType<typeof actionTarget>, earliestSurface: 'combat' | 'fully' = 'fully'): ProfileRelationship => (
  !action && (metricId === 'critRate' || metricId === 'critDmg')
    ? stat(metricId, 'flat', value, src, earliestSurface)
    : { kind: 'modifier', atom: { metricId, earliestSurface, value, source: src, ...(action ? { action } : {}) } }
)
const provider = (src: ReturnType<typeof source>, recipient: 'all-party' | 'focus' | 'enemy-context', effect: Extract<ProfileRelationship, { kind: 'provider' }>['effect'], extras: Partial<Extract<ProfileRelationship, { kind: 'provider' }>['delivery']> = {}): ProfileRelationship => ({ kind: 'provider', source: src, delivery: { recipient, ...extras }, effect })

const BASIC_DASH_DODGE = actionTarget([canonicalAction('Basic Attack'), canonicalAction('Dash Attack'), canonicalAction('Dodge Counter')])
const LYCAON_CHARGED = BASIC_DASH_DODGE
const BASIC = actionTarget([canonicalAction('Basic Attack')])
const TRIGGER_HARMONIZING_SHOT = actionTarget([sourceLocalAction('trigger-harmonizing-shot', 'Harmonizing Shot')])
const LYCAON_BASIC = actionTarget([canonicalAction('Basic Attack')])
const LYCAON_EX = actionTarget([canonicalAction('EX Special Attack')])
const LYCAON_GLACIAL = actionTarget([sourceLocalAction('lycaon-glacial-waltz', 'Glacial Waltz')])
const EX_CHAIN_ULT = actionTarget([canonicalAction('EX Special Attack'), canonicalAction('Chain Attack'), canonicalAction('Ultimate')])
const LIGHTER_FIVE = actionTarget([sourceLocalAction('lighter-empowered-basic-fifth-hit', 'Empowered Basic Attack: 5th hit')])
const LIGHTER_BASIC_DASH_DODGE = BASIC_DASH_DODGE
const LIGHTER_BASIC = actionTarget([canonicalAction('Basic Attack')])
const QINGYI_BASIC = actionTarget([canonicalAction('Basic Attack')])
const QINGYI_ENCHANTED = actionTarget([actionForm('Basic Attack', 'qingyi-enchanted-moonlit-blossoms', 'Enchanted Moonlit Blossoms')])
const QINGYI_CHAIN = actionTarget([canonicalAction('Chain Attack')])
const KOLEDA_ENHANCED = actionTarget([actionForm('Basic Attack', 'koleda-enhanced-furnace-fire', 'Enhanced Furnace Fire')])
const KOLEDA_BASIC_DASH_DODGE = BASIC_DASH_DODGE
const KOLEDA_BASIC = actionTarget([canonicalAction('Basic Attack')])
const KOLEDA_SPECIAL = actionTarget([canonicalAction('Special Attack')])
const KOLEDA_EX = actionTarget([canonicalAction('EX Special Attack')])
const ANBY_BASIC = actionTarget([canonicalAction('Basic Attack')])
const ANBY_THUNDERBOLT = actionTarget([actionForm('Basic Attack', 'anby-thunderbolt', 'Thunderbolt')])
const ANBY_EX = actionTarget([canonicalAction('EX Special Attack')])
const ANBY_SPECIAL = actionTarget([canonicalAction('Special Attack')])
const ANBY_DASH_DODGE = actionTarget([canonicalAction('Dash Attack'), canonicalAction('Dodge Counter')])
const LYCAON_FULL_EX = actionTarget([actionForm('EX Special Attack', 'lycaon-fully-charged', 'Fully charged')])
const LYCAON_ASSIST = actionTarget([canonicalAction('Assist Follow-Up')])
const NANGONG_CHAIN = actionTarget([canonicalAction('Chain Attack')])
const NANGONG_CHARGED_BASIC = actionTarget([actionForm('Basic Attack', 'nangong-charged', 'Charged')])
const NANGONG_ANOMALY_SCOPES = [
  {
    id: 'nangongAttributeAnomaly', target: ATTRIBUTE_ANOMALY_TARGET,
    children: [{ id: 'nangongAbloom', target: ABLOOM_TARGET }],
  },
  { id: 'nangongDisorder', target: DISORDER_TARGET },
] satisfies readonly ActionScopeNode[]
const PULCHRA_CORE_COMPLETE = actionTarget([canonicalAction('EX Special Attack'), canonicalAction('Assist Follow-Up'), canonicalAction('Chain Attack'), canonicalAction('Ultimate')])
const NORMA_CORE_DAZE = actionTarget([canonicalAction('Special Attack'), canonicalAction('EX Special Attack'), canonicalAction('Ultimate')])
const NORMA_ARMOR_PIERCING = actionTarget([sourceLocalAction('norma-armor-piercing-warhead', 'Armor-Piercing Warhead')])
const NORMA_HIGH_EXPLOSIVE = actionTarget([sourceLocalAction('norma-high-explosive-warhead', 'High-Explosive Warhead')])

function partyAgent(agentId: string) { return ADMITTED_AGENTS.find(({ id }) => id === agentId)! }
function another(ids: readonly string[], slot: Slot, predicate: (id: string) => boolean) {
  return ids.some((id, index) => index !== slot && predicate(id))
}
function sameFaction(ids: readonly string[], slot: Slot) {
  const faction = partyAgent(ids[slot]).faction
  return Boolean(faction) && another(ids, slot, (id) => partyAgent(id).faction === faction)
}

function buildDazeOutcomeProfile(agent: Agent, state: WorkbenchState, slot: Slot, setup: ProfileSetup, relationships: ProfileRelationship[]): AgentSourceProfile {
  const selected = state.slots[slot].setup.mindscape
  const ids = state.slots.map(({ agentId }) => agentId)
  const core = source(agent, slot, 'core', SOURCE_LABELS[`${agent}Core`])
  const abilityKey = `${agent}Ability` as keyof typeof SOURCE_LABELS
  const ability = abilityKey in SOURCE_LABELS ? source(agent, slot, 'additional', SOURCE_LABELS[abilityKey], 'additional') : core
  const alwaysProjectsCrit = ['dialyn', 'trigger', 'juFufu', 'qingyi', 'norma'].includes(agent)
  const projectsConditionalCrit = setup.fourPieceId === 'king' || ['koleda', 'anby'].includes(agent)
  const projectsBuildup = FORMULA_PARTICIPATION_BY_AGENT[agent].result.includes('anomaly_buildup')
  const metrics: MetricProjection[] = [
    ...(BASE[agent].atk !== undefined ? [m('atk', 'ATK', '', 'atk')] : []),
    ...(alwaysProjectsCrit || projectsConditionalCrit
      ? [{ ...m('critRate', 'CRIT Rate', '%', 'critRate', alwaysProjectsCrit ? undefined : 'disclosed-or-action'), cap: critCap(agent, slot) }]
      : []),
    ...(agent === 'trigger'
      ? [m('critDmg', 'CRIT DMG', '%', 'critDmg', 'action')]
      : agent === 'qingyi' || agent === 'norma'
        ? [m('critDmg', 'CRIT DMG', '%', 'critDmg')]
        : []),
    ...(agent === 'nangongYu' ? [
      m('anomalyProficiency', 'Anomaly Proficiency', '', 'anomalyProficiency'),
      m('anomalyMastery', 'Anomaly Mastery', '', 'anomalyMastery'),
      m('anomalyDmgBonus', 'Anomaly DMG Bonus', '%', undefined, 'nonzero-or-action'),
      m('penRatio', 'PEN Ratio', '%', 'penRatio', 'disclosed-or-action'),
      m('anomalyBuildupResReduction', 'Anomaly Buildup RES Reduction', '%', undefined, 'nonzero-or-action'),
    ] : []),
    ...(agent === 'lycaon' ? [
      { ...m('anomalyMastery', 'Anomaly Mastery', '', 'anomalyMastery', 'disclosed-or-action'), decimals: 1 },
      m('anomalyBuildupResReduction', 'Anomaly Buildup RES Reduction', '%', undefined, 'nonzero-or-action'),
    ] : []),
    m('impact', 'Impact', '', 'impact'),
    ...(BASE[agent].energyRegen !== undefined ? [m('energyRegen', 'Energy Regen', '/s', 'energyRegen', agent === 'dialyn' ? undefined : 'disclosed-or-action')] : []),
    ...(agent === 'norma' ? [m('sheerForce', 'Sheer Force', '', undefined, 'nonzero-or-action')] : []),
    ...(agent === 'norma' ? [m('penRatio', 'PEN Ratio', '%', 'penRatio', 'disclosed-or-action')] : []),
    ...(projectsBuildup ? [m('anomalyBuildupBonus', 'Anomaly Buildup Bonus', '%', undefined, 'nonzero-or-action')] : []),
    m('dazeBonus', 'Daze Bonus', '%', undefined, 'nonzero-or-action'), m('dmgBonus', 'DMG Bonus', '%', undefined, 'nonzero-or-action'), m('stunDmgMultiplier', 'Stun DMG Multiplier', '%', undefined, 'nonzero-or-action'), m('resReduction', 'RES Reduction', '%', undefined, 'nonzero-or-action'), m('resIgnore', 'RES Ignore', '%', undefined, 'nonzero-or-action'), m('defReduction', 'DEF Reduction', '%', undefined, 'nonzero-or-action'),
    ...(agent === 'trigger' ? [m('defIgnore', 'DEF Ignore', '%', undefined, 'nonzero-or-action')] : []),
  ]
  const actions: ActionProjection[] = []
  const miyabiSlot = ids.indexOf('miyabi')
  if (projectsBuildup && miyabiSlot >= 0 && miyabiSlot !== slot) {
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
  const nangongSlot = ids.indexOf('nangongYu')
  if (projectsBuildup && nangongSlot >= 0 && nangongSlot !== slot && nangongAdditionalIsActive(ids, nangongSlot)) {
    actions.push(actionProjection('anomalyBuildupBonus', 'chainAttackAnomalyBuildup', actionTarget([canonicalAction('Chain Attack')])))
  }
  const add = (relationship: ProfileRelationship) => relationships.push(relationship)
  if (agent === 'norma') {
    relationships.push({
      kind: 'gauge',
      source: core,
      basis: { statId: 'critRate', surface: 'initial' },
      basisLabel: 'Initial CRIT Rate',
      basisPresentationId: 'initial-crit-rate',
      basisThreshold: VERTICAL_VALUES.norma.coreCritThreshold,
      basisCap: 100,
      metricId: 'critRate',
      outputs: [
        {
          presentationId: 'combat-crit-dmg-bonus', label: 'Combat CRIT DMG bonus', unit: '%',
          cap: VERTICAL_VALUES.norma.coreCritDmgCap,
          transform: {
            basisThreshold: VERTICAL_VALUES.norma.coreCritThreshold,
            basisIncrement: 1,
            outputIncrement: VERTICAL_VALUES.norma.coreCritDmgPerCrit,
            outputCap: VERTICAL_VALUES.norma.coreCritDmgCap,
          },
          emission: { kind: 'stat', statId: 'critDmg', region: 'flat', earliestSurface: 'combat' },
        },
        {
          presentationId: 'special-ex-ultimate-daze-bonus', label: 'Special/EX/Ultimate Daze bonus', unit: '%',
          cap: VERTICAL_VALUES.norma.coreDazeCap,
          transform: {
            basisThreshold: VERTICAL_VALUES.norma.coreCritThreshold,
            basisIncrement: 1,
            outputIncrement: VERTICAL_VALUES.norma.coreDazePerCrit,
            outputCap: VERTICAL_VALUES.norma.coreDazeCap,
          },
          emission: { kind: 'modifier', metricId: 'dazeBonus', earliestSurface: 'combat', action: NORMA_CORE_DAZE },
        },
      ],
    })
    relationships.push({
      kind: 'post-delivery-metric-stat-gauge',
      source: core,
      basis: { metricId: 'sheerForce', surface: 'fully' },
      basisLabel: 'Fully Enabled Sheer Force',
      basisPresentationId: 'fully-sheer-force',
      basisCap: VERTICAL_VALUES.norma.sheerAtkCap / VERTICAL_VALUES.norma.sheerAtkPerPoint,
      output: {
        presentationId: 'flat-atk',
        label: 'flat ATK',
        statId: 'atk',
        region: 'flat',
        transform: {
          basisIncrement: 1,
          outputIncrement: VERTICAL_VALUES.norma.sheerAtkPerPoint,
          outputCap: VERTICAL_VALUES.norma.sheerAtkCap,
        },
        cap: VERTICAL_VALUES.norma.sheerAtkCap,
        unit: '',
      },
    })
    const additionalActive = another(ids, slot, (id) => (
      ['Attack', 'Rupture'].includes(partyAgent(id).specialty)
    )) || sameFaction(ids, slot)
    if (additionalActive) {
      relationships.push(
        provider(ability, 'enemy-context', {
          kind: 'modifier', metricId: 'stunDmgMultiplier', earliestSurface: 'fully',
          value: VERTICAL_VALUES.norma.additionalTechDivide
            * VERTICAL_VALUES.norma.additionalStacks,
        }),
        { kind: 'operation', atom: { presentationId: 'enemy-stun-duration', label: 'Enemy Stun duration', value: VERTICAL_VALUES.norma.additionalStunDuration, unit: 's', source: ability } },
        stat('atk', 'flat', VERTICAL_VALUES.norma.additionalAtk, ability),
        provider(ability, 'all-party', { kind: 'modifier', metricId: 'dmgBonus', earliestSurface: 'fully', value: VERTICAL_VALUES.norma.additionalDmg }, { formulas: DAMAGE }),
      )
      if (selected >= 2) relationships.push(provider(
        mind(agent, slot, selected, 2),
        'enemy-context',
        {
          kind: 'modifier', metricId: 'stunDmgMultiplier', earliestSurface: 'fully',
          value: (VERTICAL_VALUES.norma.additionalTechDivideM2
            - VERTICAL_VALUES.norma.additionalTechDivide)
            * VERTICAL_VALUES.norma.additionalStacks,
        },
      ))
    }
    if (selected >= 1) relationships.push(provider(
      mind(agent, slot, selected, 1),
      'enemy-context',
      { kind: 'modifier', metricId: 'resReduction', earliestSurface: 'fully', value: VERTICAL_VALUES.norma.mindscape1ResReduction, sourceDetail: { label: 'Armor-Piercing or High-Explosive Warhead hit', presentationId: 'armor-piercing-or-high-explosive-warhead-hit' } },
      { formulas: DAMAGE },
    ))
    if (selected >= 6) relationships.push(
      mod('dazeBonus', VERTICAL_VALUES.norma.mindscape6Daze, mind(agent, slot, selected, 6), NORMA_ARMOR_PIERCING),
      mod('dmgBonus', VERTICAL_VALUES.norma.mindscape6Dmg, mind(agent, slot, selected, 6), NORMA_HIGH_EXPLOSIVE),
    )
    actions.push(
      actionProjection('dazeBonus', 'normaCoreDaze', NORMA_CORE_DAZE),
      actionProjection('dazeBonus', 'normaArmorPiercingDaze', NORMA_ARMOR_PIERCING),
      actionProjection('dmgBonus', 'normaHighExplosiveDmg', NORMA_HIGH_EXPLOSIVE),
    )
  } else if (agent === 'dialyn') {
    relationships.push({ kind: 'gauge', source: core, basis: { statId: 'critRate', surface: 'initial' }, basisLabel: 'Initial CRIT Rate', basisPresentationId: 'initial-crit-rate', basisThreshold: VERTICAL_VALUES.dialyn.critThreshold, basisCap: 100, metricId: 'critRate', outputs: [{ presentationId: 'combat-impact-bonus', label: 'Combat Impact bonus', unit: '', transform: { basisThreshold: VERTICAL_VALUES.dialyn.critThreshold, basisIncrement: 1, outputIncrement: VERTICAL_VALUES.dialyn.impactPerCrit, outputCap: VERTICAL_VALUES.dialyn.impactBonusCap }, emission: { kind: 'stat', statId: 'impact', region: 'flat', earliestSurface: 'combat' } }] } as ProfileRelationship)
    relationships.push(provider(ability, 'all-party', { kind: 'modifier', metricId: 'dmgBonus', earliestSurface: 'fully', value: VERTICAL_VALUES.party.dialynDmg }, { formulas: DAMAGE }), provider(core, 'enemy-context', { kind: 'modifier', metricId: 'stunDmgMultiplier', earliestSurface: 'fully', value: VERTICAL_VALUES.party.dialynStunMultiplier }), { kind: 'operation', atom: { presentationId: 'enemy-stun-duration', label: 'Enemy Stun duration', value: VERTICAL_VALUES.party.dialynStunExtension, unit: 's', source: core } })
    if (selected >= 1) relationships.push(provider(mind(agent, slot, selected, 1), 'enemy-context', { kind: 'modifier', metricId: 'resIgnore', earliestSurface: 'fully', value: VERTICAL_VALUES.dialyn.mindscapeResIgnore }))
    if (selected >= 2) relationships.push(provider(mind(agent, slot, selected, 2), 'focus', { kind: 'modifier', metricId: 'dmgBonus', earliestSurface: 'fully', value: VERTICAL_VALUES.dialyn.mindscapeDmg }), provider(mind(agent, slot, selected, 2), 'enemy-context', { kind: 'modifier', metricId: 'stunDmgMultiplier', earliestSurface: 'fully', value: VERTICAL_VALUES.dialyn.mindscapeStunMultiplier }))
  } else if (agent === 'trigger') {
    relationships.push(provider(core, 'enemy-context', { kind: 'modifier', metricId: 'stunDmgMultiplier', earliestSurface: 'fully', value: 35 }, { formulas: DAMAGE }))
    if (selected >= 1) relationships.push(provider(mind(agent, slot, selected, 1), 'enemy-context', { kind: 'modifier', metricId: 'stunDmgMultiplier', earliestSurface: 'fully', value: 20 }, { formulas: DAMAGE }))
    if (selected >= 2) relationships.push(provider(mind(agent, slot, selected, 2), 'all-party', { kind: 'stat', statId: 'critDmg', region: 'flat', earliestSurface: 'fully', value: 24 }, { formulas: CRIT_DAMAGE_FORMULAS }))
    if (triggerAdditionalIsActive(ids, slot)) {
      relationships.push({
        kind: 'post-delivery-stat-modifier-gauge',
        source: ability,
        basis: { statId: 'critRate', surface: 'fully' },
        basisLabel: 'Fully Enabled CRIT Rate',
        basisPresentationId: 'fully-crit-rate',
        basisValueCap: 100,
        basisCap: 90,
        gaugeMetricId: 'critRate',
        modifierMetricId: 'dazeBonus',
        action: TRIGGER_HARMONIZING_SHOT,
        modifierSurface: 'fully',
        output: {
          presentationId: 'aftershock-daze-bonus',
          label: 'Aftershock Daze bonus',
          value: {
            kind: 'linear',
            transform: {
              basisThreshold: 40,
              basisIncrement: 1,
              outputIncrement: 1.5,
              outputCap: 75,
            },
          },
          cap: 75,
          unit: '%',
        },
      })
    }
    actions.push(
      {
        metricId: 'dazeBonus',
        scopes: [{
          id: 'triggerHarmonizingShot',
          target: TRIGGER_HARMONIZING_SHOT,
          inheritedEffectTargets: [BASIC, AFTERSHOCK_TARGET, BASIC_DASH_DODGE],
        }],
      },
      actionProjection('dmgBonus', 'triggerAftershockDmg', AFTERSHOCK_TARGET),
      actionProjection('critDmg', 'triggerAftershockCritDmg', AFTERSHOCK_TARGET),
      actionProjection('defIgnore', 'triggerAftershockDefIgnore', AFTERSHOCK_TARGET),
    )
    return { agentId: agent, appliedPartySlot: slot, relationships, metrics, ...(actions.length ? { actions } : {}) }
  } else if (agent === 'lycaon') {
    const potential = source(agent, slot, 'potential', SOURCE_LABELS.lycaonPotential, 'special')
    relationships.push(
      mod('dazeBonus', VERTICAL_VALUES.lycaon.coreChargedDaze, core, LYCAON_CHARGED, 'combat'),
      provider(core, 'enemy-context', { kind: 'modifier', metricId: 'resReduction', earliestSurface: 'fully', value: VERTICAL_VALUES.lycaon.coreIceResReduction }, { attributes: ['Ice'] }),
      provider(core, 'enemy-context', { kind: 'modifier', metricId: 'dmgBonus', earliestSurface: 'fully', value: VERTICAL_VALUES.lycaon.coreOtherAttributeDmg }, { attributes: ['Physical', 'Fire', 'Electric', 'Ether', 'Wind'], formulas: ['general_damage', 'sheer_damage', 'anomaly_damage'] }),
      {
        kind: 'linear',
        source: potential,
        basis: { statId: 'impact', surface: 'initial' },
        outputs: [{
          transform: {
            basisIncrement: 1,
            outputIncrement: VERTICAL_VALUES.lycaon.potentialImpact / 100,
          },
          emission: {
            kind: 'modifier',
            metricId: 'impact',
            earliestSurface: 'fully',
            action: LYCAON_CHARGED,
            display: { value: VERTICAL_VALUES.lycaon.potentialImpact, unit: '%', decimals: 0 },
          },
        }],
      },
      mod('dazeBonus', VERTICAL_VALUES.lycaon.glacialWaltzDaze, core, LYCAON_GLACIAL),
    )
    if (another(ids, slot, (id) => partyAgent(id).specialty === 'Anomaly') || anotherAgentSharesAttribute(ids, slot) || anotherAgentSharesFaction(ids, slot)) relationships.push(provider(ability, 'enemy-context', { kind: 'modifier', metricId: 'stunDmgMultiplier', earliestSurface: 'fully', value: VERTICAL_VALUES.lycaon.additionalStunMultiplier }))
    if (selected >= 1) relationships.push(mod('dazeBonus', VERTICAL_VALUES.lycaon.mindscapeExDaze, mind(agent, slot, selected, 1), LYCAON_EX), mod('dazeBonus', VERTICAL_VALUES.lycaon.mindscapeFullChargeDaze, mind(agent, slot, selected, 1), LYCAON_FULL_EX))
    actions.push({ metricId: 'dazeBonus', scopes: [{ id: 'lycaonCharged', target: LYCAON_CHARGED, children: [{ id: 'lycaonBasic', target: LYCAON_BASIC }] }, { id: 'lycaonEx', target: LYCAON_EX, children: [{ id: 'lycaonFullChargeEx', target: LYCAON_FULL_EX }] }, { id: 'lycaonAssist', target: LYCAON_ASSIST }, { id: 'lycaonGlacialWaltz', target: LYCAON_GLACIAL }] }, actionProjection('impact', 'lycaonPotential', LYCAON_CHARGED))
  } else if (agent === 'juFufu') {
    relationships.push({ kind: 'gauge', source: core, basis: { statId: 'atk', surface: 'initial' }, basisLabel: 'Initial ATK', basisPresentationId: 'initial-atk', basisThreshold: VERTICAL_VALUES.juFufu.coreCritDmgThreshold, basisCap: VERTICAL_VALUES.juFufu.coreCritDmgCapAtk, metricId: 'atk', outputs: [{ presentationId: 'squad-crit-dmg', label: 'Squad CRIT DMG', unit: '%', cap: VERTICAL_VALUES.juFufu.coreCritDmg + VERTICAL_VALUES.juFufu.coreCritDmgBonusCap, transform: { basisThreshold: VERTICAL_VALUES.juFufu.coreCritDmgThreshold, basisIncrement: 100, baseOutput: VERTICAL_VALUES.juFufu.coreCritDmg, outputIncrement: VERTICAL_VALUES.juFufu.coreCritDmgPer100Atk, outputCap: VERTICAL_VALUES.juFufu.coreCritDmg + VERTICAL_VALUES.juFufu.coreCritDmgBonusCap }, emission: { kind: 'provider', delivery: { recipient: 'all-party', formulas: CRIT_DAMAGE_FORMULAS }, effect: { kind: 'stat', statId: 'critDmg', region: 'flat', earliestSurface: 'fully' } } }] }, provider(core, 'all-party', { kind: 'modifier', metricId: 'dmgBonus', earliestSurface: 'fully', value: VERTICAL_VALUES.juFufu.coreChainDmg, action: actionTarget([canonicalAction('Chain Attack')]) }, { formulas: DAMAGE }), provider(core, 'all-party', { kind: 'modifier', metricId: 'dmgBonus', earliestSurface: 'fully', value: VERTICAL_VALUES.juFufu.coreUltimateDmg, action: actionTarget([canonicalAction('Ultimate')]) }, { formulas: DAMAGE }), stat('impact', 'flat', VERTICAL_VALUES.juFufu.coreImpact, core, 'combat'))
    if (selected >= 1) relationships.push(mod('critRate', VERTICAL_VALUES.juFufu.mindscapeCritRate, mind(agent, slot, selected, 1), undefined, 'combat'), provider(mind(agent, slot, selected, 1), 'enemy-context', { kind: 'modifier', metricId: 'stunDmgMultiplier', earliestSurface: 'fully', value: VERTICAL_VALUES.juFufu.mindscapeStunMultiplier, action: actionTarget([canonicalAction('Chain Attack')]) }))
    if (selected >= 2) relationships.push(provider(mind(agent, slot, selected, 2), 'all-party', { kind: 'stat', statId: 'critDmg', region: 'flat', earliestSurface: 'fully', value: VERTICAL_VALUES.juFufu.mindscapeSquadCritDmg }, { formulas: CRIT_DAMAGE_FORMULAS }))
  } else if (agent === 'lighter') {
    const active = another(ids, slot, (id) => partyAgent(id).specialty === 'Attack') || sameFaction(ids, slot)
    relationships.push(provider(core, 'enemy-context', { kind: 'modifier', metricId: 'resReduction', earliestSurface: 'fully', value: VERTICAL_VALUES.lighter.coreFireIceResReduction }, { attributes: ['Fire', 'Ice'] }), { kind: 'operation', atom: { presentationId: 'enemy-stun-duration', label: 'Enemy Stun duration', value: selected >= 1 ? VERTICAL_VALUES.lighter.mindscapeStunExtension : VERTICAL_VALUES.lighter.coreStunExtension, unit: 's', source: selected >= 1 ? mind(agent, slot, selected, 1) : core } })
    if (selected >= 1) relationships.push(provider(mind(agent, slot, selected, 1), 'enemy-context', { kind: 'modifier', metricId: 'resReduction', earliestSurface: 'fully', value: VERTICAL_VALUES.lighter.mindscapeFireIceResReduction }, { attributes: ['Fire', 'Ice'] }))
    if (selected >= 2) relationships.push(provider(mind(agent, slot, selected, 2), 'enemy-context', { kind: 'modifier', metricId: 'stunDmgMultiplier', earliestSurface: 'fully', value: VERTICAL_VALUES.lighter.mindscapeStunMultiplier }))
    relationships.push({
      kind: 'stat',
      atom: {
        statId: 'impact',
        region: 'percentage',
        earliestSurface: 'fully',
        value: VERTICAL_VALUES.lighter.coreCombatImpact,
        source: core,
        sourceDetail: { label: 'Empowered Basic Attack: 5th hit', presentationId: 'empowered-basic-fifth-hit' },
      },
    })
    if (active) {
      const outputMultiplier = selected >= 2
        ? VERTICAL_VALUES.lighter.mindscapeElationMultiplier
        : 1
      relationships.push({
        kind: 'gauge',
        source: ability,
        basis: { statId: 'impact', surface: 'fully' },
        basisLabel: 'Fully Enabled Impact',
        basisPresentationId: 'fully-impact',
        basisThreshold: VERTICAL_VALUES.lighter.elationBaseImpact,
        basisCap: 270,
        metricId: 'impact',
        outputs: [{
          presentationId: 'fire-ice-dmg-bonus',
          label: 'Fire/Ice DMG Bonus',
          unit: '%',
          cap: VERTICAL_VALUES.lighter.elationFireIceDmgCap * outputMultiplier,
          transform: {
            basisThreshold: VERTICAL_VALUES.lighter.elationBaseImpact,
            basisIncrement: VERTICAL_VALUES.lighter.elationImpactIncrement,
            baseOutput: VERTICAL_VALUES.lighter.elationFireIceDmgAtTwentyStacks
              * outputMultiplier,
            outputIncrement: VERTICAL_VALUES.lighter.elationFireIceDmgPerIncrement
              * outputMultiplier,
            outputCap: VERTICAL_VALUES.lighter.elationFireIceDmgCap
              * outputMultiplier,
          },
          emission: {
            kind: 'provider',
            delivery: {
              recipient: 'all-party',
              attributes: ['Fire', 'Ice'],
              formulas: REGULAR_DAMAGE_FORMULAS,
            },
            effect: {
              kind: 'modifier',
              metricId: 'dmgBonus',
              earliestSurface: 'fully',
            },
          },
        }],
      })
    }
    actions.push({ metricId: 'dazeBonus', scopes: [{ id: 'lighterEmpoweredFive', target: LIGHTER_FIVE }, { id: 'lighterBasicDashDodge', target: LIGHTER_BASIC_DASH_DODGE }, { id: 'lighterBasic', target: LIGHTER_BASIC }] })
  } else if (agent === 'pulchra') {
    relationships.push(mod('dazeBonus', VERTICAL_VALUES.pulchra.coreDaze, core, PULCHRA_CORE_COMPLETE))
    if (another(ids, slot, (id) => ['Attack', 'Rupture'].includes(partyAgent(id).specialty)) || sameFaction(ids, slot)) relationships.push(provider(ability, 'all-party', { kind: 'modifier', metricId: 'dmgBonus', earliestSurface: 'fully', value: VERTICAL_VALUES.pulchra.additionalDmg, ...(selected >= 6 ? {} : { action: AFTERSHOCK_TARGET }) }, { formulas: DAMAGE }))
    if (selected >= 1) relationships.push(mod('critRate', VERTICAL_VALUES.pulchra.mindscapeCritRate, mind(agent, slot, selected, 1)))
    actions.push(actionProjection('dazeBonus', 'pulchraCore', PULCHRA_CORE_COMPLETE))
  } else if (agent === 'qingyi') {
    relationships.push(mod('dmgBonus', VERTICAL_VALUES.qingyi.flashDmg, core, QINGYI_ENCHANTED), mod('dazeBonus', VERTICAL_VALUES.qingyi.flashDaze, core, QINGYI_ENCHANTED), provider(core, 'enemy-context', { kind: 'modifier', metricId: 'stunDmgMultiplier', earliestSurface: 'fully', value: VERTICAL_VALUES.qingyi.coreStunMultiplier }), mod('dmgBonus', VERTICAL_VALUES.qingyi.coreChainDmg, core, QINGYI_CHAIN))
    if (qingyiAdditionalIsActive(ids, slot)) relationships.push(mod('dazeBonus', VERTICAL_VALUES.qingyi.additionalBasicDaze, ability, QINGYI_BASIC))
    if (qingyiAdditionalIsActive(ids, slot)) relationships.push({ kind: 'gauge', source: ability, basis: { statId: 'impact', surface: 'each' }, basisLabel: 'Fully Enabled Impact', basisPresentationId: 'fully-impact', basisThreshold: VERTICAL_VALUES.qingyi.additionalImpactThreshold, basisCap: VERTICAL_VALUES.qingyi.additionalImpactCap, metricId: 'impact', outputs: [{ presentationId: 'flat-atk', label: 'flat ATK', unit: '', cap: VERTICAL_VALUES.qingyi.additionalAtkCap, transform: { basisThreshold: VERTICAL_VALUES.qingyi.additionalImpactThreshold, basisIncrement: 1, outputIncrement: VERTICAL_VALUES.qingyi.additionalAtkPerImpact, outputCap: VERTICAL_VALUES.qingyi.additionalAtkCap }, emission: { kind: 'stat', statId: 'atk', region: 'flat', earliestSurface: 'initial' } }] })
    if (selected >= 1) relationships.push(mod('critRate', VERTICAL_VALUES.qingyi.mindscapeCritRate, mind(agent, slot, selected, 1)))
    if (selected >= 2) relationships.push(provider(mind(agent, slot, selected, 2), 'enemy-context', { kind: 'modifier', metricId: 'stunDmgMultiplier', earliestSurface: 'fully', value: VERTICAL_VALUES.qingyi.mindscapeStunMultiplier - VERTICAL_VALUES.qingyi.coreStunMultiplier }), mod('dazeBonus', VERTICAL_VALUES.qingyi.mindscapeDaze, mind(agent, slot, selected, 2)))
    if (selected >= 6) relationships.push(mod('critDmg', VERTICAL_VALUES.qingyi.mindscapeEnchantedCritDmg, mind(agent, slot, selected, 6), QINGYI_ENCHANTED), provider(mind(agent, slot, selected, 6), 'enemy-context', { kind: 'modifier', metricId: 'resReduction', earliestSurface: 'fully', value: VERTICAL_VALUES.qingyi.mindscapeResReduction }, { formulas: DAMAGE }))
    actions.push({ metricId: 'dmgBonus', scopes: [{ id: 'qingyiBasicDmg', target: QINGYI_BASIC, children: [{ id: 'qingyiEnchantedBasicDmg', target: QINGYI_ENCHANTED }] }, { id: 'qingyiChainDmg', target: QINGYI_CHAIN }] }, { metricId: 'dazeBonus', scopes: [{ id: 'qingyiBasicDashDodgeDaze', target: BASIC_DASH_DODGE }, { id: 'qingyiBasicDaze', target: QINGYI_BASIC, children: [{ id: 'qingyiEnchantedBasicDaze', target: QINGYI_ENCHANTED }] }] })
    if (selected >= 6) actions.push(actionProjection('critDmg', 'qingyiEnchantedCritDmg', QINGYI_ENCHANTED))
  } else if (agent === 'koleda') {
    relationships.push(mod('dazeBonus', VERTICAL_VALUES.koleda.coreDaze, core, KOLEDA_ENHANCED), mod('dazeBonus', VERTICAL_VALUES.koleda.coreDaze, core, KOLEDA_EX))
    if (anotherAgentSharesAttribute(ids, slot) || anotherAgentSharesFaction(ids, slot) || another(ids, slot, (id) => partyAgent(id).specialty === 'Rupture')) relationships.push(provider(ability, 'all-party', { kind: 'modifier', metricId: 'dmgBonus', earliestSurface: 'fully', value: VERTICAL_VALUES.koleda.additionalChainDmg, action: actionTarget([canonicalAction('Chain Attack')]) }, { formulas: DAMAGE }))
    if (selected >= 1) relationships.push(mod('dazeBonus', VERTICAL_VALUES.koleda.mindscapeDaze, mind(agent, slot, selected, 1), KOLEDA_SPECIAL))
    actions.push({ metricId: 'dazeBonus', scopes: [{ id: 'koledaBasicDashDodge', target: KOLEDA_BASIC_DASH_DODGE, children: [{ id: 'koledaBasic', target: KOLEDA_BASIC }, { id: 'koledaEnhancedBasic', target: KOLEDA_ENHANCED }] }, { id: 'koledaSpecial', target: KOLEDA_SPECIAL, children: [{ id: 'koledaExSpecial', target: KOLEDA_EX }] }] })
  } else if (agent === 'nangongYu') {
    const ultimate = source(agent, slot, 'ultimate', 'Ultimate', 'ultimate')
    add({ kind: 'stat', atom: { statId: 'anomalyProficiency', region: 'flat', earliestSurface: 'initial', value: VERTICAL_VALUES.nangongYu.coreAnomalyProficiency, source: core } })
    add({
      kind: 'gauge', source: core,
      basis: { statId: 'anomalyMastery', surface: 'initial' },
      basisLabel: 'Initial Anomaly Mastery',
      basisPresentationId: 'initial-anomaly-mastery',
      basisThreshold: VERTICAL_VALUES.nangongYu.coreImpactThreshold,
      metricId: 'anomalyMastery',
      outputs: [{
        presentationId: 'impact', label: 'Impact', unit: '',
        transform: { basisThreshold: VERTICAL_VALUES.nangongYu.coreImpactThreshold, basisIncrement: 1, outputIncrement: VERTICAL_VALUES.nangongYu.coreImpactPerMastery },
        emission: { kind: 'stat', statId: 'impact', region: 'flat', earliestSurface: 'combat' },
      }],
      decimals: { current: 2, threshold: 0, output: 2 },
    })
    add({ kind: 'modifier', atom: { metricId: 'anomalyBuildupBonus', earliestSurface: 'fully', value: VERTICAL_VALUES.nangongYu.coreBuildup, source: core } })
    add({ kind: 'modifier', atom: { metricId: 'dazeBonus', earliestSurface: 'fully', value: VERTICAL_VALUES.nangongYu.coreDaze, source: core } })
    add(provider(core, 'all-party', { kind: 'modifier', metricId: 'dmgBonus', earliestSurface: 'fully', value: VERTICAL_VALUES.nangongYu.coreDmg }, { formulas: DAMAGE }))
    const additionalActive = another(ids, slot, (id) => partyAgent(id).specialty === 'Anomaly' || partyAgent(id).faction === 'Angels of Delusion')
    if (additionalActive) {
      add(provider(ability, 'all-party', { kind: 'modifier', metricId: 'anomalyBuildupBonus', earliestSurface: 'fully', value: VERTICAL_VALUES.nangongYu.additionalAnomalyBuildup }, { formulas: ['anomaly_buildup'] }))
      add(provider(ability, 'all-party', { kind: 'modifier', metricId: 'anomalyBuildupBonus', earliestSurface: 'fully', value: VERTICAL_VALUES.nangongYu.additionalChainBuildup, action: NANGONG_CHAIN }, { formulas: ['anomaly_buildup'] }))
      add(provider(ability, 'enemy-context', { kind: 'modifier', metricId: 'stunDmgMultiplier', earliestSurface: 'fully', value: VERTICAL_VALUES.nangongYu.additionalStunMultiplier }, { formulas: DAMAGE }))
      if (setup.mindscape >= 2) add(provider(mind(agent, slot, selected, 2), 'enemy-context', { kind: 'modifier', metricId: 'stunDmgMultiplier', earliestSurface: 'fully', value: VERTICAL_VALUES.nangongYu.mindscape2StunMultiplier - VERTICAL_VALUES.nangongYu.additionalStunMultiplier }, { formulas: DAMAGE }))
      add({ kind: 'operation', atom: { presentationId: 'enemy-stun-duration', label: 'Enemy Stun duration', value: VERTICAL_VALUES.nangongYu.additionalStunDuration, unit: 's', source: ability } })
    }
    add({ kind: 'provider', source: ultimate, delivery: { recipient: 'all-party', formulas: DAMAGE }, effect: { kind: 'stat', statId: 'atk', region: 'flat', earliestSurface: 'fully', value: VERTICAL_VALUES.nangongYu.ultimateAtk } })
    add({ kind: 'operation', atom: { presentationId: 'added-abloom-dmg-multiplier', label: 'Added Abloom DMG Multiplier', value: setup.mindscape >= 2 ? VERTICAL_VALUES.nangongYu.mindscape2AddedAbloomMultiplier : VERTICAL_VALUES.nangongYu.addedAbloomMultiplier, unit: '%', source: setup.mindscape >= 2 ? mind(agent, slot, selected, 2) : core } })
    if (setup.mindscape >= 1) add(provider(mind(agent, slot, selected, 1), 'enemy-context', { kind: 'modifier', metricId: 'resReduction', earliestSurface: 'fully', value: VERTICAL_VALUES.nangongYu.mindscape1ResReduction }, { formulas: DAMAGE }))
    if (setup.mindscape >= 4) {
      add({ kind: 'stat', atom: { statId: 'anomalyProficiency', region: 'flat', earliestSurface: 'fully', value: VERTICAL_VALUES.nangongYu.mindscape4Ap, source: mind(agent, slot, selected, 4) } })
      add({ kind: 'modifier', atom: { metricId: 'anomalyBuildupBonus', earliestSurface: 'fully', value: VERTICAL_VALUES.nangongYu.mindscape4Buildup, source: mind(agent, slot, selected, 4), action: NANGONG_CHARGED_BASIC } })
    }
    if (setup.mindscape >= 6) add({ kind: 'modifier', atom: { metricId: 'dazeBonus', earliestSurface: 'fully', value: VERTICAL_VALUES.nangongYu.mindscape6Daze, source: mind(agent, slot, selected, 6) } })
    actions.push(
      { metricId: 'anomalyDmgBonus', scopes: NANGONG_ANOMALY_SCOPES },
      actionProjection('anomalyBuildupBonus', 'nangongChainBuildup', NANGONG_CHAIN),
    )
    actions.push(actionProjection('dazeBonus', 'nangongRoaringFurnaceDaze', EX_CHAIN_ULT))
    if (setup.mindscape >= 4) actions.push(actionProjection('anomalyBuildupBonus', 'nangongChargedBasicBuildup', NANGONG_CHARGED_BASIC))
  } else {
    relationships.push(mod('dazeBonus', VERTICAL_VALUES.anby.coreActionDaze, core, ANBY_THUNDERBOLT), mod('dazeBonus', VERTICAL_VALUES.anby.coreActionDaze, core, ANBY_SPECIAL), mod('dazeBonus', VERTICAL_VALUES.anby.coreActionDaze, core, ANBY_EX))
    if (selected >= 2) relationships.push(mod('dazeBonus', VERTICAL_VALUES.anby.mindscapeExNonStunnedDaze, mind(agent, slot, selected, 2), ANBY_EX))
    actions.push({ metricId: 'dazeBonus', scopes: [{ id: 'anbyBasicDashDodge', target: BASIC_DASH_DODGE }, { id: 'anbyBasic', target: ANBY_BASIC, children: [{ id: 'anbyThunderbolt', target: ANBY_THUNDERBOLT }] }, { id: 'anbySpecial', target: ANBY_SPECIAL }, { id: 'anbyExSpecial', target: ANBY_EX }, { id: 'anbyDashDodge', target: ANBY_DASH_DODGE }] })
  }
  return {
    agentId: agent,
    appliedPartySlot: slot,
    relationships,
    metrics,
    ...(actions.length ? { actions } : {}),
  }
}


export function dazeOutcomeProfileFor(
  agent: Agent,
  state: WorkbenchState,
  slot: Slot,
): AgentSourceProfile {
  const setup = { ...requireCompleteSelectedSetup(state.slots[slot].setup), mindscape: state.slots[slot].setup.mindscape }
  const projectsDamageResult = FORMULA_PARTICIPATION_BY_AGENT[agent].result
    .some((formula) => DAMAGE.some((damageFormula) => damageFormula === formula))
  const observation: SelectedSetupObservation = {
    baseStats: BASE[agent],
    effectiveSubstats: effectiveSubstatChoicesForSlot(state, slot),
    modifierMetrics: [
      ...(projectsDamageResult ? ['dmgBonus'] as const : []),
      'dazeBonus', 'sheerDmgBonus', 'sheerForce',
      'anomalyDmgBonus', 'anomalyBuildupBonus', 'anomalyBuildupResReduction',
      'defIgnore', 'defReduction', 'resIgnore', 'resReduction',
    ],
  }
  const relationships = selectedSetupRelationships(agent, slot, setup, observation)
  relationships.push(...agentBroadPrePenRelationships(state, slot))
  relationships.push(...selectedEquipmentRelationships(agent, slot, setup, {
    observation,
    focusAgentId: state.slots[state.focusSlot].agentId,
    partyAgentIds: state.slots.map(({ agentId }) => agentId),
  }))
  return buildDazeOutcomeProfile(agent, state, slot, setup, relationships)
}
