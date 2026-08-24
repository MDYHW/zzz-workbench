import { ABLOOM_TARGET, AFTERSHOCK_TARGET, ATTRIBUTE_ANOMALY_TARGET, BASIC_AFTERSHOCK_TARGET, DISORDER_TARGET, actionForm, actionTarget, canonicalAction, sourceLocalAction } from '../../actions'
import { effectiveSubstatChoicesForSlot } from '../../candidates'
import type { ActionScopeNode } from '../../calculation/composition'
import { actionProjection, type ActionProjection, type AgentSourceProfile, type MetricProjection } from '../../calculation/profile-harness'
import type { ProfileRelationship } from '../../calculation/relationships'
import type { WorkbenchState } from '../../state'
import { CRIT_DAMAGE_FORMULAS, REGULAR_DAMAGE_FORMULAS } from '../../formula-policy'
import { anotherAgentSharesAttribute, anotherAgentSharesFaction, qingyiAdditionalIsActive, triggerAdditionalIsActive } from '../../party-conditions'
import { ADMITTED_AGENTS } from '../agents'
import { SOURCE_LABELS, VERTICAL_VALUES } from '../retained-values'
import { requireCompleteSelectedSetup, selectedEquipmentRelationships, selectedSetupRelationships, type CompleteSelectedSetup, type SelectedSetupObservation } from './equipment'
import {
  ETHER_VEIL_WELLSPRING_MAX_HP_EFFECT,
  selectedAgentSource,
  selectedCalculationSource,
  selectedMindscapeSource,
} from './sources'

type Agent = 'yixuan' | 'yidhari' | 'manato' | 'banyue' | 'starlightBilly' | 'dialyn' | 'trigger' | 'lycaon' | 'juFufu' | 'lighter' | 'pulchra' | 'qingyi' | 'koleda' | 'anby' | 'nangongYu'
type Slot = 0 | 1 | 2
type Locus = 'identity' | 'core' | 'additional' | 'special' | 'ex-special'
type ProfileSetup = CompleteSelectedSetup & {
  mindscape: 0 | 1 | 2 | 3 | 4 | 5 | 6
}
const DAMAGE = REGULAR_DAMAGE_FORMULAS

const BASE: Record<Agent, SelectedSetupObservation['baseStats']> = {
  yixuan: { maxHp: VERTICAL_VALUES.yixuan.hp, atk: VERTICAL_VALUES.yixuan.atk, critRate: VERTICAL_VALUES.yixuan.critRate, critDmg: VERTICAL_VALUES.yixuan.critDmg },
  yidhari: { maxHp: VERTICAL_VALUES.yidhari.hp, atk: VERTICAL_VALUES.yidhari.atk, critRate: VERTICAL_VALUES.yidhari.critRate, critDmg: VERTICAL_VALUES.yidhari.critDmg },
  manato: { maxHp: VERTICAL_VALUES.manato.hp, atk: VERTICAL_VALUES.manato.atk, critRate: VERTICAL_VALUES.manato.critRate, critDmg: VERTICAL_VALUES.manato.critDmg },
  banyue: { maxHp: VERTICAL_VALUES.banyue.hp, atk: VERTICAL_VALUES.banyue.atk, critRate: VERTICAL_VALUES.banyue.critRate, critDmg: VERTICAL_VALUES.banyue.critDmg },
  starlightBilly: { maxHp: VERTICAL_VALUES.starlightBilly.hp, atk: VERTICAL_VALUES.starlightBilly.atk, critRate: VERTICAL_VALUES.starlightBilly.critRate, critDmg: VERTICAL_VALUES.starlightBilly.critDmg },
  dialyn: { critRate: VERTICAL_VALUES.dialyn.critRate, impact: VERTICAL_VALUES.dialyn.impact, energyRegen: VERTICAL_VALUES.dialyn.baseEnergyRegen },
  trigger: { critRate: VERTICAL_VALUES.trigger.critRate, critDmg: VERTICAL_VALUES.trigger.critDmg, impact: VERTICAL_VALUES.trigger.impact },
  lycaon: { critRate: VERTICAL_VALUES.lycaon.critRate, impact: VERTICAL_VALUES.lycaon.impact, energyRegen: VERTICAL_VALUES.lycaon.baseEnergyRegen },
  juFufu: { atk: VERTICAL_VALUES.juFufu.atk, critRate: VERTICAL_VALUES.juFufu.critRate, impact: VERTICAL_VALUES.juFufu.impact, energyRegen: VERTICAL_VALUES.juFufu.baseEnergyRegen },
  lighter: { critRate: VERTICAL_VALUES.lighter.critRate, impact: VERTICAL_VALUES.lighter.impact, energyRegen: VERTICAL_VALUES.lighter.baseEnergyRegen },
  pulchra: { critRate: VERTICAL_VALUES.pulchra.critRate, impact: VERTICAL_VALUES.pulchra.impact, energyRegen: VERTICAL_VALUES.pulchra.baseEnergyRegen },
  qingyi: { atk: VERTICAL_VALUES.qingyi.atk, critRate: VERTICAL_VALUES.qingyi.critRate, critDmg: VERTICAL_VALUES.qingyi.critDmg, impact: VERTICAL_VALUES.qingyi.impact, energyRegen: VERTICAL_VALUES.qingyi.baseEnergyRegen },
  koleda: { critRate: VERTICAL_VALUES.koleda.critRate, impact: VERTICAL_VALUES.koleda.impact, energyRegen: VERTICAL_VALUES.koleda.baseEnergyRegen },
  anby: { critRate: VERTICAL_VALUES.anby.critRate, impact: VERTICAL_VALUES.anby.impact, energyRegen: VERTICAL_VALUES.anby.baseEnergyRegen },
  nangongYu: { atk: VERTICAL_VALUES.nangongYu.atk, anomalyProficiency: VERTICAL_VALUES.nangongYu.anomalyProficiency, anomalyMastery: VERTICAL_VALUES.nangongYu.anomalyMastery, impact: VERTICAL_VALUES.nangongYu.impact, energyRegen: VERTICAL_VALUES.nangongYu.baseEnergyRegen, penRatio: 0 },
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

const YIXUAN_CORE = actionTarget([canonicalAction('Basic Attack'), canonicalAction('EX Special Attack'), canonicalAction('Assist Follow-Up'), canonicalAction('Chain Attack'), canonicalAction('Ultimate')])
const YIXUAN_EX = actionTarget([canonicalAction('EX Special Attack')])
const YIXUAN_CLOUD = actionTarget([actionForm('EX Special Attack', 'Cloud-Shaper'), actionForm('EX Special Attack', 'Ashen Ink Becomes Shadows')])
const YIXUAN_SHEER = actionTarget([canonicalAction('EX Special Attack'), canonicalAction('Ultimate')])
const YIXUAN_ETHER = actionTarget([canonicalAction('EX Special Attack'), canonicalAction('Ultimate')])
const MANATO_BASIC_ASSIST = actionTarget([canonicalAction('Basic Attack'), canonicalAction('Assist Follow-Up')])
const MANATO_ASSIST = actionTarget([canonicalAction('Assist Follow-Up')])
const MANATO_EX = actionTarget([canonicalAction('EX Special Attack')])
const BANYUE_EX = actionTarget([canonicalAction('EX Special Attack')])
const BILLY_FULL_OUTCOME = sourceLocalAction('Basic Attack: Full-Throttle Starlight')
const BILLY_WHEELIE_OUTCOME = sourceLocalAction('EX Special Attack: Cool Wheelie')
const BILLY_ULT_OUTCOME = sourceLocalAction('Ultimate: Starlight Knight Flying Kick')
const BILLY_ADDITIONAL = actionTarget([BILLY_FULL_OUTCOME, canonicalAction('EX Special Attack'), canonicalAction('Chain Attack'), canonicalAction('Ultimate')])
const BILLY_FULL = actionTarget([BILLY_FULL_OUTCOME])
const BILLY_EX = actionTarget([canonicalAction('EX Special Attack')])
const BILLY_WHEELIE = actionTarget([BILLY_WHEELIE_OUTCOME])
const BILLY_ULT = actionTarget([BILLY_ULT_OUTCOME])
const BILLY_M6 = actionTarget([BILLY_FULL_OUTCOME, BILLY_ULT_OUTCOME])
const LYCAON_CHARGED = actionTarget([canonicalAction('Basic Attack'), canonicalAction('Dash Attack'), canonicalAction('Dodge Counter')])
const LYCAON_BASIC = actionTarget([canonicalAction('Basic Attack')])
const LYCAON_EX = actionTarget([canonicalAction('EX Special Attack')])
const LYCAON_GLACIAL = actionTarget([sourceLocalAction('Glacial Waltz')])
const EX_CHAIN_ULT = actionTarget([canonicalAction('EX Special Attack'), canonicalAction('Chain Attack'), canonicalAction('Ultimate')])
const LIGHTER_FIVE = actionTarget([sourceLocalAction('Empowered Basic Attack: 5th hit')])
const LIGHTER_BASIC_DASH_DODGE = actionTarget([canonicalAction('Basic Attack'), canonicalAction('Dash Attack'), canonicalAction('Dodge Counter')])
const LIGHTER_BASIC = actionTarget([canonicalAction('Basic Attack')])
const QINGYI_BASIC = actionTarget([canonicalAction('Basic Attack')])
const QINGYI_ENCHANTED = actionTarget([actionForm('Basic Attack', 'Enchanted Moonlit Blossoms')])
const QINGYI_CHAIN = actionTarget([canonicalAction('Chain Attack')])
const KOLEDA_ENHANCED = actionTarget([actionForm('Basic Attack', 'Enhanced Furnace Fire')])
const KOLEDA_BASIC_DASH_DODGE = actionTarget([canonicalAction('Basic Attack'), canonicalAction('Dash Attack'), canonicalAction('Dodge Counter')])
const KOLEDA_BASIC = actionTarget([canonicalAction('Basic Attack')])
const KOLEDA_SPECIAL = actionTarget([canonicalAction('Special Attack')])
const KOLEDA_EX = actionTarget([canonicalAction('EX Special Attack')])
const ANBY_BASIC = actionTarget([canonicalAction('Basic Attack')])
const ANBY_THUNDERBOLT = actionTarget([actionForm('Basic Attack', 'Thunderbolt')])
const ANBY_EX = actionTarget([canonicalAction('EX Special Attack')])
const ANBY_SPECIAL = actionTarget([canonicalAction('Special Attack')])
const ANBY_DASH_DODGE = actionTarget([canonicalAction('Dash Attack'), canonicalAction('Dodge Counter')])
const LYCAON_FULL_EX = actionTarget([actionForm('EX Special Attack', 'Fully charged')])
const LYCAON_ASSIST = actionTarget([canonicalAction('Assist Follow-Up')])
const NANGONG_CHAIN = actionTarget([canonicalAction('Chain Attack')])
const NANGONG_CHARGED_BASIC = actionTarget([actionForm('Basic Attack', 'Charged')])
const NANGONG_ANOMALY_SCOPES = [
  {
    id: 'nangongAttributeAnomaly', target: ATTRIBUTE_ANOMALY_TARGET,
    children: [{ id: 'nangongAbloom', target: ABLOOM_TARGET }],
  },
  { id: 'nangongDisorder', target: DISORDER_TARGET },
] satisfies readonly ActionScopeNode[]
const BANYUE_TREMOR = actionTarget([
  sourceLocalAction("EX Special Attack: Lion's Roar"),
  sourceLocalAction("EX Special Attack: Lion's Roar - Wrath"),
  sourceLocalAction('EX Special Attack: Mountain Tremor'),
  sourceLocalAction('EX Special Attack: Mountain Tremor - Wrath'),
  sourceLocalAction('Basic Attack: Toppling Mountain'),
  sourceLocalAction('Basic Attack: Crushing Peaks'),
])
const BANYUE_M4 = actionTarget([
  sourceLocalAction("EX Special Attack: Lion's Roar - Wrath"),
  sourceLocalAction('EX Special Attack: Mountain Tremor - Wrath'),
  sourceLocalAction('Basic Attack: Toppling Mountain'),
  sourceLocalAction('Basic Attack: Crushing Peaks'),
])
const PULCHRA_CORE_COMPLETE = actionTarget([canonicalAction('EX Special Attack'), canonicalAction('Assist Follow-Up'), canonicalAction('Chain Attack'), canonicalAction('Ultimate')])

function partyAgent(agentId: string) { return ADMITTED_AGENTS.find(({ id }) => id === agentId)! }
function another(ids: readonly string[], slot: Slot, predicate: (id: string) => boolean) {
  return ids.some((id, index) => index !== slot && predicate(id))
}
function sameFaction(ids: readonly string[], slot: Slot) {
  const faction = partyAgent(ids[slot]).faction
  return Boolean(faction) && another(ids, slot, (id) => partyAgent(id).faction === faction)
}
function hasStunOrSupport(ids: readonly string[], slot: Slot) {
  return another(ids, slot, (id) => ['Stun', 'Support'].includes(partyAgent(id).specialty))
}

function rupture(agent: Extract<Agent, 'yixuan' | 'yidhari' | 'manato' | 'banyue' | 'starlightBilly'>, state: WorkbenchState, slot: Slot, setup: ProfileSetup, relationships: ProfileRelationship[]): AgentSourceProfile {
  const selected = state.slots[slot].setup.mindscape
  const ids = state.slots.map(({ agentId }) => agentId)
  const core = source(agent, slot, 'core', SOURCE_LABELS[`${agent}Core`])
  const abilityLabel = SOURCE_LABELS[`${agent}Ability` as keyof typeof SOURCE_LABELS]
  const ability = abilityLabel ? source(agent, slot, 'additional', abilityLabel, 'additional') : core
  const metrics: MetricProjection[] = [m('maxHp', 'Max HP', '', 'maxHp'), m('atk', 'ATK', '', 'atk'), m('sheerForce', 'Sheer Force', ''), { ...m('critRate', 'CRIT Rate', '%', 'critRate'), cap: critCap(agent, slot) }, m('critDmg', 'CRIT DMG', '%', 'critDmg'), m('dmgBonus', 'DMG Bonus', '%'), m('sheerDmgBonus', 'Sheer DMG Bonus', '%'), m('resIgnore', 'RES Ignore', '%', undefined, 'nonzero-or-action'), m('resReduction', 'RES Reduction', '%', undefined, 'nonzero-or-action'), m('defReduction', 'DEF Reduction', '%', undefined, 'nonzero-or-action'), m('stunDmgMultiplier', 'Stun DMG Multiplier', '%', undefined, 'nonzero-or-action')]
  const actions: ActionProjection[] = []
  if (agent === 'yixuan') {
    relationships.push(mod('dmgBonus', VERTICAL_VALUES.yixuan.coreActionDmgBonus, core, YIXUAN_CORE, 'combat'), mod('critDmg', VERTICAL_VALUES.yixuan.additionalCritDmg, ability), mod('dmgBonus', VERTICAL_VALUES.yixuan.additionalExDmgBonus, ability, YIXUAN_EX))
    if (selected >= 1) relationships.push(mod('critRate', VERTICAL_VALUES.yixuan.mindscapeCritRate, mind(agent, slot, selected, 1)))
    if (selected >= 2) relationships.push(provider(mind(agent, slot, selected, 2), 'enemy-context', { kind: 'modifier', metricId: 'resIgnore', earliestSurface: 'fully', value: VERTICAL_VALUES.yixuan.mindscapeEtherResIgnore, action: YIXUAN_ETHER }, { eligibleAgentIds: ['yixuan'], attributes: ['Ether'], formulas: ['sheer_damage'] }), provider(mind(agent, slot, selected, 2), 'enemy-context', { kind: 'operation', label: 'Enemy Stun duration', earliestSurface: 'fully', value: VERTICAL_VALUES.yixuan.mindscapeStunExtension, unit: 's' }, { eligibleAgentIds: ['yixuan'] }))
    if (selected >= 4) relationships.push(mod('dmgBonus', VERTICAL_VALUES.yixuan.mindscapeActionDmgPerStack * 2, mind(agent, slot, selected, 4), YIXUAN_CLOUD))
    if (selected >= 6) relationships.push(mod('sheerDmgBonus', VERTICAL_VALUES.yixuan.mindscapeMeditationSheerDmg, mind(agent, slot, selected, 6)))
    actions.push({ metricId: 'dmgBonus', scopes: [{ id: 'yixuanCore', target: YIXUAN_CORE, children: [{ id: 'yixuanStunnedEx', target: YIXUAN_EX, children: [{ id: 'yixuanCloudShaper', target: YIXUAN_CLOUD }] }] }] })
    if (setup.engineId === 'qingming') actions.push(actionProjection('sheerDmgBonus', 'yixuanEngineSheer', YIXUAN_SHEER))
    if (selected >= 2) actions.push(actionProjection('resIgnore', 'yixuanEtherResIgnore', YIXUAN_ETHER))
  } else if (agent === 'yidhari') {
    relationships.push(provider(core, 'all-party', { kind: 'stat', statId: 'maxHp', region: 'percentage', earliestSurface: 'fully', value: VERTICAL_VALUES.party.wellspringHp, composition: { kind: 'highest-only', semanticEffect: ETHER_VEIL_WELLSPRING_MAX_HP_EFFECT } }), mod('dmgBonus', VERTICAL_VALUES.yidhari.lowHpDmg, core), ...(hasStunOrSupport(ids, slot) ? [mod('critDmg', VERTICAL_VALUES.yidhari.additionalCritDmg, ability)] : []))
    if (selected >= 1) relationships.push(provider(mind(agent, slot, selected, 1), 'enemy-context', { kind: 'modifier', metricId: 'resIgnore', earliestSurface: 'fully', value: VERTICAL_VALUES.yidhari.mindscapeIceResIgnore, action: actionTarget([canonicalAction('Basic Attack'), canonicalAction('EX Special Attack')]) }, { eligibleAgentIds: ['yidhari'], attributes: ['Ice'], formulas: ['sheer_damage'] }))
    if (selected >= 2) relationships.push(mod('critDmg', VERTICAL_VALUES.yidhari.mindscapeCritDmg, mind(agent, slot, selected, 2)))
    if (selected >= 4) relationships.push(stat('maxHp', 'percentage', VERTICAL_VALUES.yidhari.mindscapeMaxHp, mind(agent, slot, selected, 4)))
    if (selected >= 6) relationships.push(mod('sheerDmgBonus', VERTICAL_VALUES.yidhari.mindscapeSheerDmg, mind(agent, slot, selected, 6)))
    if (selected >= 1) actions.push(actionProjection('resIgnore', 'yidhariIceResIgnore', actionTarget([canonicalAction('Basic Attack'), canonicalAction('EX Special Attack')])))
    if (setup.engineId === 'puzzleSphere') actions.push(actionProjection('dmgBonus', 'yidhariExSpecial', actionTarget([canonicalAction('EX Special Attack')])))
  } else if (agent === 'manato') {
    relationships.push({ kind: 'stat', atom: { statId: 'maxHp', region: 'percentage', earliestSurface: 'initial', value: VERTICAL_VALUES.manato.coreHp, source: core, sourceDetail: 'Completed Core HP enhancements', display: { value: VERTICAL_VALUES.manato.coreHp, unit: '%', decimals: 0 } } }, mod('critRate', VERTICAL_VALUES.manato.moltenCritRate, core), mod('dmgBonus', VERTICAL_VALUES.manato.moltenFireDmg, core), mod('critDmg', VERTICAL_VALUES.manato.coreActionCritDmg, core, MANATO_BASIC_ASSIST))
    if (selected >= 1) relationships.push(mod('dmgBonus', VERTICAL_VALUES.manato.mindscapeActionFireDmg, mind(agent, slot, selected, 1), MANATO_BASIC_ASSIST))
    if (selected >= 2) relationships.push(provider(mind(agent, slot, selected, 2), 'enemy-context', { kind: 'modifier', metricId: 'resIgnore', earliestSurface: 'fully', value: VERTICAL_VALUES.manato.mindscapeFireResIgnore }, { eligibleAgentIds: ['manato'], attributes: ['Fire'], formulas: ['sheer_damage'] }))
    if (selected >= 4) relationships.push(stat('maxHp', 'percentage', VERTICAL_VALUES.manato.mindscapeHp, mind(agent, slot, selected, 4)))
    if (selected >= 6) relationships.push(mod('dmgBonus', VERTICAL_VALUES.manato.mindscapeAssistFireDmg, mind(agent, slot, selected, 6), MANATO_ASSIST))
    actions.push(actionProjection('critDmg', 'manatoBasicAssistCritDmg', MANATO_BASIC_ASSIST), actionProjection('dmgBonus', 'manatoBasicAssistFireDmg', MANATO_BASIC_ASSIST))
    if (setup.engineId === 'puzzleSphere') actions.push(actionProjection('dmgBonus', 'manatoExSpecial', MANATO_EX))
    if (setup.engineId === 'wrathfulVajra') actions.push(actionProjection('sheerDmgBonus', 'manatoExSpecialSheer', MANATO_EX))
  } else if (agent === 'banyue') {
    relationships.push(mod('sheerForce', VERTICAL_VALUES.banyue.coreSheerForce, core), mod('dmgBonus', VERTICAL_VALUES.banyue.coreFireDmg, core), mod('critDmg', VERTICAL_VALUES.banyue.coreCritDmg, core), ...((selected >= 6 || hasStunOrSupport(ids, slot)) ? [mod('dmgBonus', VERTICAL_VALUES.banyue.additionalFireDmgPerStack * VERTICAL_VALUES.banyue.additionalStacks, ability)] : []))
    if (selected >= 1) relationships.push(provider(mind(agent, slot, selected, 1), 'enemy-context', { kind: 'modifier', metricId: 'resReduction', earliestSurface: 'fully', value: VERTICAL_VALUES.banyue.mindscapeFireResReduction }, { attributes: ['Fire'], formulas: DAMAGE }), mod('sheerDmgBonus', VERTICAL_VALUES.banyue.mindscapeActionSheerDmg, mind(agent, slot, selected, 1), BANYUE_TREMOR), provider(mind(agent, slot, selected, 1), 'enemy-context', { kind: 'operation', label: 'Enemy Stun duration', earliestSurface: 'fully', value: VERTICAL_VALUES.banyue.mindscapeStunExtension, unit: 's' }, { eligibleAgentIds: ['banyue'] }))
    if (selected >= 2) { relationships.push(mod('critDmg', VERTICAL_VALUES.banyue.mindscapeCoreCritDmg, mind(agent, slot, selected, 2)), mod('dmgBonus', VERTICAL_VALUES.banyue.mindscapeCoreFireDmg, mind(agent, slot, selected, 2))) }
    if (selected >= 4) relationships.push(mod('dmgBonus', VERTICAL_VALUES.banyue.mindscapeActionDmg, mind(agent, slot, selected, 4), BANYUE_M4))
    if (selected >= 6) relationships.push(mod('dmgBonus', VERTICAL_VALUES.banyue.mindscapeVidyarajaPerStack * VERTICAL_VALUES.banyue.additionalStacks, mind(agent, slot, selected, 6)), { kind: 'operation', atom: { label: 'Basic Attack: Crushing Peaks added DMG Multiplier', earliestSurface: 'fully', value: VERTICAL_VALUES.banyue.mindscapeCrushingPeaksMultiplier, unit: '%', source: mind(agent, slot, selected, 6) } })
    if (setup.engineId === 'puzzleSphere' || selected >= 4) actions.push({ metricId: 'dmgBonus', scopes: [{ id: 'banyueEx', target: BANYUE_EX }, { id: 'banyueM4Actions', target: BANYUE_M4 }] })
    if (setup.engineId === 'wrathfulVajra' || selected >= 1) actions.push({ metricId: 'sheerDmgBonus', scopes: [{ id: 'banyueExSheer', target: BANYUE_EX }, { id: 'banyueTremorActions', target: BANYUE_TREMOR }] })
  } else {
    const additionalActive = another(ids, slot, (id) => ['Stun', 'Defense', 'Support'].includes(partyAgent(id).specialty))
    relationships.push(mod('critDmg', VERTICAL_VALUES.starlightBilly.coreCritDmg, core), ...(additionalActive ? [mod('dmgBonus', VERTICAL_VALUES.starlightBilly.additionalDmgPerStack * VERTICAL_VALUES.starlightBilly.additionalStacks, ability, BILLY_ADDITIONAL)] : []))
    if (selected >= 1) relationships.push(provider(mind(agent, slot, selected, 1), 'enemy-context', { kind: 'modifier', metricId: 'resIgnore', earliestSurface: 'fully', value: VERTICAL_VALUES.starlightBilly.mindscapePhysicalResIgnore }, { attributes: ['Physical'], formulas: DAMAGE }))
    if (selected >= 2) { for (const action of [BILLY_FULL, BILLY_WHEELIE, BILLY_ULT]) relationships.push(mod('dmgBonus', VERTICAL_VALUES.starlightBilly.mindscapeActionDmg, mind(agent, slot, selected, 2), action)); relationships.push(mod('critDmg', VERTICAL_VALUES.starlightBilly.mindscapeCoolWheelieCritDmg, mind(agent, slot, selected, 2), BILLY_WHEELIE)) }
    if (selected >= 4) relationships.push(mod('critDmg', VERTICAL_VALUES.starlightBilly.mindscapeCoreCritDmgPerStack * VERTICAL_VALUES.starlightBilly.mindscapeCoreCritDmgStacks, mind(agent, slot, selected, 4)))
    if (selected >= 6) relationships.push(mod('sheerDmgBonus', VERTICAL_VALUES.starlightBilly.mindscapeSheerDmg, mind(agent, slot, selected, 6), BILLY_M6), { kind: 'operation', atom: { label: 'Ultimate & Full-Throttle final-hit added Physical DMG', earliestSurface: 'fully', value: VERTICAL_VALUES.starlightBilly.mindscapeAddedPhysicalDmgPerStack * VERTICAL_VALUES.starlightBilly.mindscapeConsumedStacks, unit: '% Sheer Force', source: mind(agent, slot, selected, 6) } })
    if (additionalActive || selected >= 2 || setup.engineId === 'puzzleSphere') actions.push({ metricId: 'dmgBonus', scopes: [{ id: 'starlightBillyAdditionalActions', target: BILLY_ADDITIONAL, children: [{ id: 'starlightBillyExSpecial', target: BILLY_EX, children: [{ id: 'starlightBillyCoolWheelie', target: BILLY_WHEELIE }] }, { id: 'starlightBillyFullThrottle', target: BILLY_FULL }, { id: 'starlightBillyUltimate', target: BILLY_ULT }] }] })
    if (selected >= 2) actions.push(actionProjection('critDmg', 'starlightBillyWheelieCrit', BILLY_WHEELIE))
    if (selected >= 6) actions.push(actionProjection('sheerDmgBonus', 'starlightBillyM6Sheer', BILLY_M6))
  }
  relationships.push({
    kind: 'surface-stat-derived-metric',
    source: source(agent, slot, 'rupture-sheer-force', 'Rupture specialty', 'identity'),
    metricId: 'sheerForce',
    terms: [
      { statId: 'atk', multiplier: VERTICAL_VALUES.rupture.currentAtkToSheer },
      { statId: 'maxHp', multiplier: VERTICAL_VALUES.rupture.currentHpToSheer },
    ],
    sourceDetail: 'Current ATK × 0.3 + Current Max HP × 0.1',
  })
  return { agentId: agent, appliedPartySlot: slot, relationships, metrics, ...(actions.length ? { actions } : {}) }
}

function stun(agent: Exclude<Agent, 'yixuan' | 'yidhari' | 'manato' | 'banyue' | 'starlightBilly'>, state: WorkbenchState, slot: Slot, setup: ProfileSetup, relationships: ProfileRelationship[]): AgentSourceProfile {
  const selected = state.slots[slot].setup.mindscape
  const ids = state.slots.map(({ agentId }) => agentId)
  const core = source(agent, slot, 'core', SOURCE_LABELS[`${agent}Core`])
  const abilityKey = `${agent}Ability` as keyof typeof SOURCE_LABELS
  const ability = abilityKey in SOURCE_LABELS ? source(agent, slot, 'additional', SOURCE_LABELS[abilityKey], 'additional') : core
  const alwaysProjectsCrit = ['dialyn', 'trigger', 'juFufu', 'qingyi'].includes(agent)
  const projectsConditionalCrit = setup.fourPieceId === 'king' || ['koleda', 'anby'].includes(agent)
  const metrics: MetricProjection[] = [
    ...(BASE[agent].atk !== undefined ? [m('atk', 'ATK', '', 'atk')] : []),
    ...(alwaysProjectsCrit || projectsConditionalCrit
      ? [{ ...m('critRate', 'CRIT Rate', '%', 'critRate', alwaysProjectsCrit ? undefined : 'disclosed-or-action'), cap: critCap(agent, slot) }]
      : []),
    ...(agent === 'trigger'
      ? [m('critDmg', 'CRIT DMG', '%', 'critDmg', 'action')]
      : agent === 'qingyi'
        ? [m('critDmg', 'CRIT DMG', '%', 'critDmg')]
        : []),
    ...(agent === 'nangongYu' ? [
      m('anomalyProficiency', 'Anomaly Proficiency', '', 'anomalyProficiency'),
      m('anomalyMastery', 'Anomaly Mastery', '', 'anomalyMastery'),
      m('anomalyDmgBonus', 'Anomaly DMG Bonus', '%', undefined, 'nonzero-or-action'),
      m('penRatio', 'PEN Ratio', '%', 'penRatio', 'disclosed-or-action'),
      m('anomalyBuildupResReduction', 'Anomaly Buildup RES Reduction', '%', undefined, 'nonzero-or-action'),
    ] : []),
    m('impact', 'Impact', '', 'impact'),
    ...(BASE[agent].energyRegen !== undefined ? [m('energyRegen', 'Energy Regen', '/s', 'energyRegen', agent === 'dialyn' ? undefined : 'disclosed-or-action')] : []),
    ...(agent === 'nangongYu' ? [m('anomalyBuildupBonus', 'Anomaly Buildup Bonus', '%', undefined, 'nonzero-or-action')] : []),
    m('dazeBonus', 'Daze Bonus', '%', undefined, 'nonzero-or-action'), m('dmgBonus', 'DMG Bonus', '%', undefined, 'nonzero-or-action'), m('stunDmgMultiplier', 'Stun DMG Multiplier', '%', undefined, 'nonzero-or-action'), m('resReduction', 'RES Reduction', '%', undefined, 'nonzero-or-action'), m('resIgnore', 'RES Ignore', '%', undefined, 'nonzero-or-action'), m('defReduction', 'DEF Reduction', '%', undefined, 'nonzero-or-action'),
    ...(agent === 'trigger' ? [m('defIgnore', 'DEF Ignore', '%', undefined, 'nonzero-or-action')] : []),
  ]
  const actions: ActionProjection[] = []
  const add = (relationship: ProfileRelationship) => relationships.push(relationship)
  if (agent === 'dialyn') {
    relationships.push({ kind: 'gauge', source: core, basis: { statId: 'critRate', surface: 'initial' }, basisLabel: 'Initial CRIT Rate', basisThreshold: VERTICAL_VALUES.dialyn.critThreshold, basisCap: 100, metricId: 'critRate', outputs: [{ label: 'Combat Impact bonus', unit: '', transform: { basisThreshold: VERTICAL_VALUES.dialyn.critThreshold, basisIncrement: 1, outputIncrement: VERTICAL_VALUES.dialyn.impactPerCrit, outputCap: VERTICAL_VALUES.dialyn.impactBonusCap }, emission: { kind: 'stat', statId: 'impact', region: 'flat', earliestSurface: 'combat' } }] } as ProfileRelationship)
    relationships.push(provider(ability, 'all-party', { kind: 'modifier', metricId: 'dmgBonus', earliestSurface: 'fully', value: VERTICAL_VALUES.party.dialynDmg }, { formulas: DAMAGE }), provider(core, 'enemy-context', { kind: 'modifier', metricId: 'stunDmgMultiplier', earliestSurface: 'fully', value: VERTICAL_VALUES.party.dialynStunMultiplier }), { kind: 'operation', atom: { label: 'Enemy Stun duration', earliestSurface: 'fully', value: VERTICAL_VALUES.party.dialynStunExtension, unit: 's', source: core } })
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
        basisValueCap: 100,
        basisCap: 90,
        gaugeMetricId: 'critRate',
        modifierMetricId: 'dazeBonus',
        action: BASIC_AFTERSHOCK_TARGET,
        modifierSurface: 'fully',
        output: {
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
    actions.push(actionProjection('dazeBonus', 'triggerBasicAftershock', BASIC_AFTERSHOCK_TARGET), actionProjection('dmgBonus', 'triggerAftershockDmg', AFTERSHOCK_TARGET), actionProjection('critDmg', 'triggerAftershockCritDmg', AFTERSHOCK_TARGET), actionProjection('defIgnore', 'triggerAftershockDefIgnore', AFTERSHOCK_TARGET))
    return { agentId: agent, appliedPartySlot: slot, relationships, metrics, ...(actions.length ? { actions } : {}) }
  } else if (agent === 'lycaon') {
    const potential = source(agent, slot, 'potential', SOURCE_LABELS.lycaonPotential, 'special')
    relationships.push(
      mod('dazeBonus', VERTICAL_VALUES.lycaon.coreChargedDaze, core, LYCAON_CHARGED, 'combat'),
      provider(core, 'enemy-context', { kind: 'modifier', metricId: 'resReduction', earliestSurface: 'fully', value: VERTICAL_VALUES.lycaon.coreIceResReduction }, { attributes: ['Ice'] }),
      provider(core, 'enemy-context', { kind: 'modifier', metricId: 'dmgBonus', earliestSurface: 'fully', value: VERTICAL_VALUES.lycaon.coreOtherAttributeDmg }, { attributes: ['Physical', 'Fire', 'Electric', 'Ether'], formulas: ['general_damage', 'sheer_damage', 'anomaly_damage'] }),
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
    relationships.push({ kind: 'gauge', source: core, basis: { statId: 'atk', surface: 'initial' }, basisLabel: 'Initial ATK', basisThreshold: VERTICAL_VALUES.juFufu.coreCritDmgThreshold, basisCap: VERTICAL_VALUES.juFufu.coreCritDmgCapAtk, metricId: 'atk', outputs: [{ label: 'Squad CRIT DMG', unit: '%', cap: VERTICAL_VALUES.juFufu.coreCritDmg + VERTICAL_VALUES.juFufu.coreCritDmgBonusCap, transform: { basisThreshold: VERTICAL_VALUES.juFufu.coreCritDmgThreshold, basisIncrement: 100, baseOutput: VERTICAL_VALUES.juFufu.coreCritDmg, outputIncrement: VERTICAL_VALUES.juFufu.coreCritDmgPer100Atk, outputCap: VERTICAL_VALUES.juFufu.coreCritDmg + VERTICAL_VALUES.juFufu.coreCritDmgBonusCap }, emission: { kind: 'provider', delivery: { recipient: 'all-party', formulas: CRIT_DAMAGE_FORMULAS }, effect: { kind: 'stat', statId: 'critDmg', region: 'flat', earliestSurface: 'fully' } } }] }, provider(core, 'all-party', { kind: 'modifier', metricId: 'dmgBonus', earliestSurface: 'fully', value: VERTICAL_VALUES.juFufu.coreChainDmg, action: actionTarget([canonicalAction('Chain Attack')]) }, { formulas: DAMAGE }), provider(core, 'all-party', { kind: 'modifier', metricId: 'dmgBonus', earliestSurface: 'fully', value: VERTICAL_VALUES.juFufu.coreUltimateDmg, action: actionTarget([canonicalAction('Ultimate')]) }, { formulas: DAMAGE }), stat('impact', 'flat', VERTICAL_VALUES.juFufu.coreImpact, core, 'combat'))
    if (selected >= 1) relationships.push(mod('critRate', VERTICAL_VALUES.juFufu.mindscapeCritRate, mind(agent, slot, selected, 1), undefined, 'combat'), provider(mind(agent, slot, selected, 1), 'enemy-context', { kind: 'modifier', metricId: 'stunDmgMultiplier', earliestSurface: 'fully', value: VERTICAL_VALUES.juFufu.mindscapeStunMultiplier, action: actionTarget([canonicalAction('Chain Attack')]) }))
    if (selected >= 2) relationships.push(provider(mind(agent, slot, selected, 2), 'all-party', { kind: 'stat', statId: 'critDmg', region: 'flat', earliestSurface: 'fully', value: VERTICAL_VALUES.juFufu.mindscapeSquadCritDmg }, { formulas: CRIT_DAMAGE_FORMULAS }))
  } else if (agent === 'lighter') {
    const active = another(ids, slot, (id) => partyAgent(id).specialty === 'Attack') || sameFaction(ids, slot)
    relationships.push(provider(core, 'enemy-context', { kind: 'modifier', metricId: 'resReduction', earliestSurface: 'fully', value: VERTICAL_VALUES.lighter.coreFireIceResReduction }, { attributes: ['Fire', 'Ice'] }), { kind: 'operation', atom: { label: 'Enemy Stun duration', earliestSurface: 'fully', value: selected >= 1 ? VERTICAL_VALUES.lighter.mindscapeStunExtension : VERTICAL_VALUES.lighter.coreStunExtension, unit: 's', source: selected >= 1 ? mind(agent, slot, selected, 1) : core } })
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
        sourceDetail: 'Empowered Basic Attack: 5th hit',
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
        basisThreshold: VERTICAL_VALUES.lighter.elationBaseImpact,
        basisCap: 270,
        metricId: 'impact',
        outputs: [{
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
    if (qingyiAdditionalIsActive(ids, slot)) relationships.push({ kind: 'gauge', source: ability, basis: { statId: 'impact', surface: 'each' }, basisLabel: 'Fully Enabled Impact', basisThreshold: VERTICAL_VALUES.qingyi.additionalImpactThreshold, basisCap: VERTICAL_VALUES.qingyi.additionalImpactCap, metricId: 'impact', outputs: [{ label: 'Additional flat ATK', unit: '', cap: VERTICAL_VALUES.qingyi.additionalAtkCap, transform: { basisThreshold: VERTICAL_VALUES.qingyi.additionalImpactThreshold, basisIncrement: 1, outputIncrement: VERTICAL_VALUES.qingyi.additionalAtkPerImpact, outputCap: VERTICAL_VALUES.qingyi.additionalAtkCap }, emission: { kind: 'stat', statId: 'atk', region: 'flat', earliestSurface: 'initial' } }] })
    if (selected >= 1) relationships.push(provider(mind(agent, slot, selected, 1), 'enemy-context', { kind: 'modifier', metricId: 'defReduction', earliestSurface: 'fully', value: VERTICAL_VALUES.qingyi.mindscapeDefReduction }, { formulas: ['general_damage'] }), mod('critRate', VERTICAL_VALUES.qingyi.mindscapeCritRate, mind(agent, slot, selected, 1)))
    if (selected >= 2) relationships.push(provider(mind(agent, slot, selected, 2), 'enemy-context', { kind: 'modifier', metricId: 'stunDmgMultiplier', earliestSurface: 'fully', value: VERTICAL_VALUES.qingyi.mindscapeStunMultiplier - VERTICAL_VALUES.qingyi.coreStunMultiplier }), mod('dazeBonus', VERTICAL_VALUES.qingyi.mindscapeDaze, mind(agent, slot, selected, 2)))
    if (selected >= 6) relationships.push(mod('critDmg', VERTICAL_VALUES.qingyi.mindscapeEnchantedCritDmg, mind(agent, slot, selected, 6), QINGYI_ENCHANTED), provider(mind(agent, slot, selected, 6), 'enemy-context', { kind: 'modifier', metricId: 'resReduction', earliestSurface: 'fully', value: VERTICAL_VALUES.qingyi.mindscapeResReduction }, { formulas: DAMAGE }))
    actions.push({ metricId: 'dmgBonus', scopes: [{ id: 'qingyiBasicDmg', target: QINGYI_BASIC, children: [{ id: 'qingyiEnchantedBasicDmg', target: QINGYI_ENCHANTED }] }, { id: 'qingyiChainDmg', target: QINGYI_CHAIN }] }, { metricId: 'dazeBonus', scopes: [{ id: 'qingyiBasicDaze', target: QINGYI_BASIC, children: [{ id: 'qingyiEnchantedBasicDaze', target: QINGYI_ENCHANTED }] }] })
    if (selected >= 6) actions.push(actionProjection('critDmg', 'qingyiEnchantedCritDmg', QINGYI_ENCHANTED))
  } else if (agent === 'koleda') {
    relationships.push(mod('dazeBonus', VERTICAL_VALUES.koleda.coreDaze, core, KOLEDA_ENHANCED), mod('dazeBonus', VERTICAL_VALUES.koleda.coreDaze, core, KOLEDA_EX))
    if (anotherAgentSharesAttribute(ids, slot) || anotherAgentSharesFaction(ids, slot) || another(ids, slot, (id) => partyAgent(id).specialty === 'Rupture')) relationships.push(provider(ability, 'all-party', { kind: 'modifier', metricId: 'dmgBonus', earliestSurface: 'fully', value: VERTICAL_VALUES.koleda.additionalChainDmg, action: actionTarget([canonicalAction('Chain Attack')]) }, { formulas: DAMAGE }))
    if (selected >= 1) relationships.push(mod('dazeBonus', VERTICAL_VALUES.koleda.mindscapeDaze, mind(agent, slot, selected, 1), KOLEDA_SPECIAL))
    actions.push({ metricId: 'dazeBonus', scopes: [{ id: 'koledaBasicDashDodge', target: KOLEDA_BASIC_DASH_DODGE, children: [{ id: 'koledaBasic', target: KOLEDA_BASIC }, { id: 'koledaEnhancedBasic', target: KOLEDA_ENHANCED }] }, { id: 'koledaSpecial', target: KOLEDA_SPECIAL, children: [{ id: 'koledaExSpecial', target: KOLEDA_EX }] }] })
  } else if (agent === 'nangongYu') {
    const ultimate = source(agent, slot, 'ultimate', 'Ultimate', 'special')
    add({ kind: 'stat', atom: { statId: 'anomalyProficiency', region: 'flat', earliestSurface: 'initial', value: VERTICAL_VALUES.nangongYu.coreAnomalyProficiency, source: core } })
    add({
      kind: 'gauge', source: core,
      basis: { statId: 'anomalyMastery', surface: 'initial' },
      basisLabel: 'Initial Anomaly Mastery',
      basisThreshold: VERTICAL_VALUES.nangongYu.coreImpactThreshold,
      metricId: 'anomalyMastery',
      outputs: [{
        label: 'Impact', unit: '',
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
      add({ kind: 'operation', atom: { label: 'Enemy Stun duration', earliestSurface: 'fully', value: VERTICAL_VALUES.nangongYu.additionalStunDuration, unit: 's', source: ability } })
    }
    add({ kind: 'provider', source: ultimate, delivery: { recipient: 'all-party', formulas: DAMAGE }, effect: { kind: 'stat', statId: 'atk', region: 'flat', earliestSurface: 'fully', value: VERTICAL_VALUES.nangongYu.ultimateAtk } })
    add({ kind: 'operation', atom: { label: 'Added Abloom DMG Multiplier', earliestSurface: 'fully', value: setup.mindscape >= 2 ? VERTICAL_VALUES.nangongYu.mindscape2AddedAbloomMultiplier : VERTICAL_VALUES.nangongYu.addedAbloomMultiplier, unit: '%', source: setup.mindscape >= 2 ? mind(agent, slot, selected, 2) : core } })
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
    if (setup.engineId === 'roaringFurnace') actions.push(actionProjection('dazeBonus', 'nangongRoaringFurnaceDaze', EX_CHAIN_ULT))
    if (setup.mindscape >= 4) actions.push(actionProjection('anomalyBuildupBonus', 'nangongChargedBasicBuildup', NANGONG_CHARGED_BASIC))
  } else {
    relationships.push(mod('dazeBonus', VERTICAL_VALUES.anby.coreActionDaze, core, ANBY_THUNDERBOLT), mod('dazeBonus', VERTICAL_VALUES.anby.coreActionDaze, core, ANBY_SPECIAL), mod('dazeBonus', VERTICAL_VALUES.anby.coreActionDaze, core, ANBY_EX))
    if (selected >= 2) relationships.push(mod('dazeBonus', VERTICAL_VALUES.anby.mindscapeExNonStunnedDaze, mind(agent, slot, selected, 2), ANBY_EX))
    actions.push({ metricId: 'dazeBonus', scopes: [{ id: 'anbyBasic', target: ANBY_BASIC, children: [{ id: 'anbyThunderbolt', target: ANBY_THUNDERBOLT }] }, { id: 'anbySpecial', target: ANBY_SPECIAL }, { id: 'anbyExSpecial', target: ANBY_EX }, { id: 'anbyDashDodge', target: ANBY_DASH_DODGE }] })
  }
  return {
    agentId: agent,
    appliedPartySlot: slot,
    relationships,
    metrics,
    ...(actions.length ? { actions } : {}),
  }
}

export function ruptureStunProfileFor(
  agent: Agent,
  state: WorkbenchState,
  slot: Slot,
): AgentSourceProfile {
  const setup = { ...requireCompleteSelectedSetup(state.slots[slot].setup), mindscape: state.slots[slot].setup.mindscape }
  const observation: SelectedSetupObservation = {
    baseStats: BASE[agent],
    effectiveSubstats: effectiveSubstatChoicesForSlot(state, slot),
    modifierMetrics: ['dmgBonus', 'dazeBonus', 'anomalyDmgBonus', 'anomalyBuildupResReduction'],
  }
  const relationships = selectedSetupRelationships(agent, slot, setup, observation)
  relationships.push(...selectedEquipmentRelationships(agent, slot, setup, {
    observation,
    focusAgentId: state.slots[state.focusSlot].agentId,
    partyAgentIds: state.slots.map(({ agentId }) => agentId),
  }))
  return ['yixuan', 'yidhari', 'manato', 'banyue', 'starlightBilly'].includes(agent)
    ? rupture(agent as Extract<Agent, 'yixuan' | 'yidhari' | 'manato' | 'banyue' | 'starlightBilly'>, state, slot, setup, relationships)
    : stun(agent as Exclude<Agent, 'yixuan' | 'yidhari' | 'manato' | 'banyue' | 'starlightBilly'>, state, slot, setup, relationships)
}
