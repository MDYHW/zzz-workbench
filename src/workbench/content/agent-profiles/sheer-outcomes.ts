import { actionForm, actionTarget, canonicalAction, sourceLocalAction } from '../../actions'
import { effectiveSubstatChoicesForSlot } from '../../candidates'
import { actionProjection, type ActionProjection, type AgentSourceProfile, type MetricProjection } from '../../calculation/profile-harness'
import type { ProfileRelationship } from '../../calculation/relationships'
import type { WorkbenchState } from '../../state'
import { REGULAR_DAMAGE_FORMULAS } from '../../formula-policy'
import { ADMITTED_AGENTS } from '../agents'
import { SOURCE_LABELS, VERTICAL_VALUES } from '../retained-values'
import { FORMULA_PARTICIPATION_BY_AGENT } from '../setup-options'
import { requireCompleteSelectedSetup, selectedEquipmentRelationships, selectedSetupRelationships, type SelectedSetupObservation } from '../agent-sources/equipment'
import {
  ETHER_VEIL_WELLSPRING_MAX_HP_EFFECT,
  selectedAgentSource,
  selectedCalculationSource,
  selectedMindscapeSource,
} from '../agent-sources/sources'
import { agentBroadPrePenRelationships } from '../agent-broad-pre-pen-relationships'

type Agent = 'yixuan' | 'yidhari' | 'manato' | 'banyue' | 'starlightBilly'
type Slot = 0 | 1 | 2
type Locus = 'identity' | 'core' | 'additional' | 'basic' | 'assist' | 'chain' | 'special' | 'ex-special' | 'ultimate'
const DAMAGE = REGULAR_DAMAGE_FORMULAS

const BASE: Record<Agent, SelectedSetupObservation['baseStats']> = {
  yixuan: { maxHp: VERTICAL_VALUES.yixuan.hp, atk: VERTICAL_VALUES.yixuan.atk, critRate: VERTICAL_VALUES.yixuan.critRate, critDmg: VERTICAL_VALUES.yixuan.critDmg },
  yidhari: { maxHp: VERTICAL_VALUES.yidhari.hp, atk: VERTICAL_VALUES.yidhari.atk, critRate: VERTICAL_VALUES.yidhari.critRate, critDmg: VERTICAL_VALUES.yidhari.critDmg },
  manato: { maxHp: VERTICAL_VALUES.manato.hp, atk: VERTICAL_VALUES.manato.atk, critRate: VERTICAL_VALUES.manato.critRate, critDmg: VERTICAL_VALUES.manato.critDmg },
  banyue: { maxHp: VERTICAL_VALUES.banyue.hp, atk: VERTICAL_VALUES.banyue.atk, critRate: VERTICAL_VALUES.banyue.critRate, critDmg: VERTICAL_VALUES.banyue.critDmg },
  starlightBilly: { maxHp: VERTICAL_VALUES.starlightBilly.hp, atk: VERTICAL_VALUES.starlightBilly.atk, critRate: VERTICAL_VALUES.starlightBilly.critRate, critDmg: VERTICAL_VALUES.starlightBilly.critDmg },
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
const YIXUAN_CLOUD = actionTarget([
  actionForm('EX Special Attack', 'yixuan-cloud-shaper', 'Cloud-Shaper'),
  actionForm('EX Special Attack', 'yixuan-ashen-ink-becomes-shadows', 'Ashen Ink Becomes Shadows'),
])
const YIXUAN_SHEER = actionTarget([canonicalAction('EX Special Attack'), canonicalAction('Ultimate')])
const YIXUAN_ETHER = actionTarget([canonicalAction('EX Special Attack'), canonicalAction('Ultimate')])
const MANATO_BASIC_ASSIST = actionTarget([canonicalAction('Basic Attack'), canonicalAction('Assist Follow-Up')])
const MANATO_ASSIST = actionTarget([canonicalAction('Assist Follow-Up')])
const MANATO_EX = actionTarget([canonicalAction('EX Special Attack')])
const BANYUE_EX = actionTarget([canonicalAction('EX Special Attack')])
const BILLY_FULL_OUTCOME = sourceLocalAction('starlight-billy-full-throttle-starlight', 'Basic Attack: Full-Throttle Starlight')
const BILLY_WHEELIE_OUTCOME = sourceLocalAction('starlight-billy-cool-wheelie', 'EX Special Attack: Cool Wheelie')
const BILLY_ULT_OUTCOME = sourceLocalAction('starlight-billy-flying-kick', 'Ultimate: Starlight Knight Flying Kick')
const BILLY_ADDITIONAL = actionTarget([BILLY_FULL_OUTCOME, canonicalAction('EX Special Attack'), canonicalAction('Chain Attack'), canonicalAction('Ultimate')])
const BILLY_FULL = actionTarget([BILLY_FULL_OUTCOME])
const BILLY_EX = actionTarget([canonicalAction('EX Special Attack')])
const BILLY_WHEELIE = actionTarget([BILLY_WHEELIE_OUTCOME])
const BILLY_ULT = actionTarget([BILLY_ULT_OUTCOME])
const BILLY_M6 = actionTarget([BILLY_FULL_OUTCOME, BILLY_ULT_OUTCOME])
const BANYUE_TREMOR = actionTarget([
  sourceLocalAction('banyue-lions-roar', "EX Special Attack: Lion's Roar"),
  sourceLocalAction('banyue-lions-roar-wrath', "EX Special Attack: Lion's Roar - Wrath"),
  sourceLocalAction('banyue-mountain-tremor', 'EX Special Attack: Mountain Tremor'),
  sourceLocalAction('banyue-mountain-tremor-wrath', 'EX Special Attack: Mountain Tremor - Wrath'),
  sourceLocalAction('banyue-toppling-mountain', 'Basic Attack: Toppling Mountain'),
  sourceLocalAction('banyue-crushing-peaks', 'Basic Attack: Crushing Peaks'),
])
const BANYUE_M4 = actionTarget([
  sourceLocalAction('banyue-lions-roar-wrath', "EX Special Attack: Lion's Roar - Wrath"),
  sourceLocalAction('banyue-mountain-tremor-wrath', 'EX Special Attack: Mountain Tremor - Wrath'),
  sourceLocalAction('banyue-toppling-mountain', 'Basic Attack: Toppling Mountain'),
  sourceLocalAction('banyue-crushing-peaks', 'Basic Attack: Crushing Peaks'),
])

function partyAgent(agentId: string) { return ADMITTED_AGENTS.find(({ id }) => id === agentId)! }
function another(ids: readonly string[], slot: Slot, predicate: (id: string) => boolean) {
  return ids.some((id, index) => index !== slot && predicate(id))
}
function hasStunOrSupport(ids: readonly string[], slot: Slot) {
  return another(ids, slot, (id) => ['Stun', 'Support'].includes(partyAgent(id).specialty))
}

function buildSheerOutcomeProfile(agent: Agent, state: WorkbenchState, slot: Slot, relationships: ProfileRelationship[]): AgentSourceProfile {
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
    if (selected >= 2) relationships.push(provider(mind(agent, slot, selected, 2), 'enemy-context', { kind: 'modifier', metricId: 'resIgnore', earliestSurface: 'fully', value: VERTICAL_VALUES.yixuan.mindscapeEtherResIgnore, action: YIXUAN_ETHER }, { eligibleAgentIds: ['yixuan'], attributes: ['Ether'], formulas: ['sheer_damage'] }), provider(mind(agent, slot, selected, 2), 'enemy-context', { kind: 'operation', presentationId: 'enemy-stun-duration', label: 'Enemy Stun duration', value: VERTICAL_VALUES.yixuan.mindscapeStunExtension, unit: 's' }, { eligibleAgentIds: ['yixuan'] }))
    if (selected >= 4) relationships.push(mod('dmgBonus', VERTICAL_VALUES.yixuan.mindscapeActionDmgPerStack * 2, mind(agent, slot, selected, 4), YIXUAN_CLOUD))
    if (selected >= 6) relationships.push(mod('sheerDmgBonus', VERTICAL_VALUES.yixuan.mindscapeMeditationSheerDmg, mind(agent, slot, selected, 6)))
    actions.push({ metricId: 'dmgBonus', scopes: [{ id: 'yixuanCore', target: YIXUAN_CORE, children: [{ id: 'yixuanStunnedEx', target: YIXUAN_EX, children: [{ id: 'yixuanCloudShaper', target: YIXUAN_CLOUD }] }] }] })
    actions.push(actionProjection('sheerDmgBonus', 'yixuanEngineSheer', YIXUAN_SHEER))
    if (selected >= 2) actions.push(actionProjection('resIgnore', 'yixuanEtherResIgnore', YIXUAN_ETHER))
  } else if (agent === 'yidhari') {
    relationships.push(provider(core, 'all-party', { kind: 'stat', statId: 'maxHp', region: 'percentage', earliestSurface: 'fully', value: VERTICAL_VALUES.party.wellspringHp, composition: { kind: 'highest-only', semanticEffect: ETHER_VEIL_WELLSPRING_MAX_HP_EFFECT } }), mod('dmgBonus', VERTICAL_VALUES.yidhari.lowHpDmg, core), ...(hasStunOrSupport(ids, slot) ? [mod('critDmg', VERTICAL_VALUES.yidhari.additionalCritDmg, ability)] : []))
    if (selected >= 1) relationships.push(provider(mind(agent, slot, selected, 1), 'enemy-context', { kind: 'modifier', metricId: 'resIgnore', earliestSurface: 'fully', value: VERTICAL_VALUES.yidhari.mindscapeIceResIgnore, action: actionTarget([canonicalAction('Basic Attack'), canonicalAction('EX Special Attack')]) }, { eligibleAgentIds: ['yidhari'], attributes: ['Ice'], formulas: ['sheer_damage'] }))
    if (selected >= 2) relationships.push(mod('critDmg', VERTICAL_VALUES.yidhari.mindscapeCritDmg, mind(agent, slot, selected, 2)))
    if (selected >= 4) relationships.push(stat('maxHp', 'percentage', VERTICAL_VALUES.yidhari.mindscapeMaxHp, mind(agent, slot, selected, 4)))
    if (selected >= 6) relationships.push(mod('sheerDmgBonus', VERTICAL_VALUES.yidhari.mindscapeSheerDmg, mind(agent, slot, selected, 6)))
    if (selected >= 1) actions.push(actionProjection('resIgnore', 'yidhariIceResIgnore', actionTarget([canonicalAction('Basic Attack'), canonicalAction('EX Special Attack')])))
    actions.push(actionProjection('dmgBonus', 'yidhariExSpecial', actionTarget([canonicalAction('EX Special Attack')])))
  } else if (agent === 'manato') {
    relationships.push({ kind: 'stat', atom: { statId: 'maxHp', region: 'percentage', earliestSurface: 'initial', value: VERTICAL_VALUES.manato.coreHp, source: core, display: { value: VERTICAL_VALUES.manato.coreHp, unit: '%', decimals: 0 } } }, mod('critRate', VERTICAL_VALUES.manato.moltenCritRate, core), mod('dmgBonus', VERTICAL_VALUES.manato.moltenFireDmg, core), mod('critDmg', VERTICAL_VALUES.manato.coreActionCritDmg, core, MANATO_BASIC_ASSIST))
    if (selected >= 1) relationships.push(mod('dmgBonus', VERTICAL_VALUES.manato.mindscapeActionFireDmg, mind(agent, slot, selected, 1), MANATO_BASIC_ASSIST))
    if (selected >= 2) relationships.push(provider(mind(agent, slot, selected, 2), 'enemy-context', { kind: 'modifier', metricId: 'resIgnore', earliestSurface: 'fully', value: VERTICAL_VALUES.manato.mindscapeFireResIgnore }, { eligibleAgentIds: ['manato'], attributes: ['Fire'], formulas: ['sheer_damage'] }))
    if (selected >= 4) relationships.push(stat('maxHp', 'percentage', VERTICAL_VALUES.manato.mindscapeHp, mind(agent, slot, selected, 4)))
    if (selected >= 6) relationships.push(mod('dmgBonus', VERTICAL_VALUES.manato.mindscapeAssistFireDmg, mind(agent, slot, selected, 6), MANATO_ASSIST))
    actions.push(actionProjection('critDmg', 'manatoBasicAssistCritDmg', MANATO_BASIC_ASSIST), actionProjection('dmgBonus', 'manatoBasicAssistFireDmg', MANATO_BASIC_ASSIST))
    actions.push(actionProjection('dmgBonus', 'manatoExSpecial', MANATO_EX))
    actions.push(actionProjection('sheerDmgBonus', 'manatoExSpecialSheer', MANATO_EX))
  } else if (agent === 'banyue') {
    relationships.push(mod('sheerForce', VERTICAL_VALUES.banyue.coreSheerForce, core), mod('dmgBonus', VERTICAL_VALUES.banyue.coreFireDmg, core), mod('critDmg', VERTICAL_VALUES.banyue.coreCritDmg, core), ...((selected >= 6 || hasStunOrSupport(ids, slot)) ? [mod('dmgBonus', VERTICAL_VALUES.banyue.additionalFireDmgPerStack * VERTICAL_VALUES.banyue.additionalStacks, ability)] : []))
    if (selected >= 1) relationships.push(provider(mind(agent, slot, selected, 1), 'enemy-context', { kind: 'modifier', metricId: 'resReduction', earliestSurface: 'fully', value: VERTICAL_VALUES.banyue.mindscapeFireResReduction }, { attributes: ['Fire'], formulas: DAMAGE }), mod('sheerDmgBonus', VERTICAL_VALUES.banyue.mindscapeActionSheerDmg, mind(agent, slot, selected, 1), BANYUE_TREMOR), provider(mind(agent, slot, selected, 1), 'enemy-context', { kind: 'operation', presentationId: 'enemy-stun-duration', label: 'Enemy Stun duration', value: VERTICAL_VALUES.banyue.mindscapeStunExtension, unit: 's' }, { eligibleAgentIds: ['banyue'] }))
    if (selected >= 2) { relationships.push(mod('critDmg', VERTICAL_VALUES.banyue.mindscapeCoreCritDmg, mind(agent, slot, selected, 2)), mod('dmgBonus', VERTICAL_VALUES.banyue.mindscapeCoreFireDmg, mind(agent, slot, selected, 2))) }
    if (selected >= 4) relationships.push(mod('dmgBonus', VERTICAL_VALUES.banyue.mindscapeActionDmg, mind(agent, slot, selected, 4), BANYUE_M4))
    if (selected >= 6) relationships.push(mod('dmgBonus', VERTICAL_VALUES.banyue.mindscapeVidyarajaPerStack * VERTICAL_VALUES.banyue.additionalStacks, mind(agent, slot, selected, 6)), { kind: 'operation', atom: { presentationId: 'crushing-peaks-added-dmg-multiplier', label: 'Basic Attack: Crushing Peaks added DMG Multiplier', value: VERTICAL_VALUES.banyue.mindscapeCrushingPeaksMultiplier, unit: '%', source: mind(agent, slot, selected, 6) } })
    actions.push({ metricId: 'dmgBonus', scopes: [{ id: 'banyueEx', target: BANYUE_EX }, { id: 'banyueM4Actions', target: BANYUE_M4 }] })
    actions.push({ metricId: 'sheerDmgBonus', scopes: [{ id: 'banyueExSheer', target: BANYUE_EX }, { id: 'banyueTremorActions', target: BANYUE_TREMOR }] })
  } else {
    const additionalActive = another(ids, slot, (id) => ['Stun', 'Defense', 'Support'].includes(partyAgent(id).specialty))
    relationships.push(mod('critDmg', VERTICAL_VALUES.starlightBilly.coreCritDmg, core), ...(additionalActive ? [mod('dmgBonus', VERTICAL_VALUES.starlightBilly.additionalDmgPerStack * VERTICAL_VALUES.starlightBilly.additionalStacks, ability, BILLY_ADDITIONAL)] : []))
    if (selected >= 1) relationships.push(provider(mind(agent, slot, selected, 1), 'enemy-context', { kind: 'modifier', metricId: 'resIgnore', earliestSurface: 'fully', value: VERTICAL_VALUES.starlightBilly.mindscapePhysicalResIgnore }, { attributes: ['Physical'], formulas: DAMAGE }))
    if (selected >= 2) { for (const action of [BILLY_FULL, BILLY_WHEELIE, BILLY_ULT]) relationships.push(mod('dmgBonus', VERTICAL_VALUES.starlightBilly.mindscapeActionDmg, mind(agent, slot, selected, 2), action)); relationships.push(mod('critDmg', VERTICAL_VALUES.starlightBilly.mindscapeCoolWheelieCritDmg, mind(agent, slot, selected, 2), BILLY_WHEELIE)) }
    if (selected >= 4) relationships.push(mod('critDmg', VERTICAL_VALUES.starlightBilly.mindscapeCoreCritDmgPerStack * VERTICAL_VALUES.starlightBilly.mindscapeCoreCritDmgStacks, mind(agent, slot, selected, 4)))
    if (selected >= 6) relationships.push(mod('sheerDmgBonus', VERTICAL_VALUES.starlightBilly.mindscapeSheerDmg, mind(agent, slot, selected, 6), BILLY_M6))
    actions.push({ metricId: 'dmgBonus', scopes: [{ id: 'starlightBillyAdditionalActions', target: BILLY_ADDITIONAL, children: [{ id: 'starlightBillyExSpecial', target: BILLY_EX, children: [{ id: 'starlightBillyCoolWheelie', target: BILLY_WHEELIE }] }, { id: 'starlightBillyFullThrottle', target: BILLY_FULL }, { id: 'starlightBillyUltimate', target: BILLY_ULT }] }] })
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
    sourceDetailPresentationId: 'current-atk-and-max-hp-sheer-formula',
  })
  return { agentId: agent, appliedPartySlot: slot, relationships, metrics, ...(actions.length ? { actions } : {}) }
}


export function sheerOutcomeProfileFor(
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
  return buildSheerOutcomeProfile(agent, state, slot, relationships)
}
