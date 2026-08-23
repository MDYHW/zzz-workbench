import { ATTRIBUTE_ANOMALY_TARGET, actionForm, actionTarget, canonicalAction, DISORDER_TARGET, sourceLocalAction, type ActionTarget } from '../../actions'
import { effectiveSubstatChoicesForSlot } from '../../candidates'
import type { ActionScopeNode } from '../../calculation/composition'
import { JANE_ASSAULT_TARGET, JANE_PASSION_TARGET } from '../../calculation/derived/jane-passion-assault'
import { actionProjection, type ActionProjection, type AgentSourceProfile, type MetricProjection } from '../../calculation/profile-harness'
import type { ProfileRelationship, ProviderEffect, ProviderRecipient } from '../../calculation/relationships'
import type { SelectedSourceInstance } from '../../calculation/source-instance'
import type { StatId, StatRegion } from '../../calculation/stat-composer'
import type { EffectAttribute, EffectMetric, SurfaceKey } from '../../effects'
import type { WorkbenchState } from '../../state'
import { DEF_DAMAGE_FORMULAS, effectAttributeForAgent, REGULAR_DAMAGE_FORMULAS } from '../../formula-policy'
import { anotherAgentHasSpecialty, anotherAgentSharesFaction, anotherAgentSharesAttribute, piperAdditionalIsActive } from '../../party-conditions'
import { DRIVE_DISC_FACTS } from '../discs'
import { ADMITTED_AGENTS } from '../agents'
import { W_ENGINE_FACTS, type WEngineEffectField } from '../engines'
import { SOURCE_LABELS, VERTICAL_VALUES } from '../retained-values'
import { equipmentEffectBaseValue, equipmentEffectMaximumValue, type AgentId, type EquipmentEffectFact, type SetupFormulaFamily } from '../types'
import { isWEnginePassiveEligible, requireCompleteSelectedSetup, selectedDiscSource, selectedSetupRelationships, selectedWEngineSource, sharedPartyEquipmentRelationships, type CompleteSelectedSetup, type SelectedSetupObservation } from './equipment'
import { selectedAgentSource, selectedMindscapeSource } from './sources'

type Agent = 'grace' | 'piper' | 'yuzuha' | 'burnice' | 'jane'
type Slot = 0 | 1 | 2
const DAMAGE = REGULAR_DAMAGE_FORMULAS

const BASE: Record<Agent, SelectedSetupObservation['baseStats']> = {
  grace: { atk: VERTICAL_VALUES.grace.atk, anomalyProficiency: VERTICAL_VALUES.grace.anomalyProficiency, anomalyMastery: VERTICAL_VALUES.grace.anomalyMastery, penRatio: 0 },
  piper: { atk: VERTICAL_VALUES.piper.atk, anomalyProficiency: VERTICAL_VALUES.piper.anomalyProficiency, anomalyMastery: VERTICAL_VALUES.piper.anomalyMastery, penRatio: 0 },
  yuzuha: { atk: VERTICAL_VALUES.yuzuha.atk, anomalyMastery: VERTICAL_VALUES.yuzuha.anomalyMastery, energyRegen: VERTICAL_VALUES.yuzuha.baseEnergyRegen },
  burnice: { atk: VERTICAL_VALUES.burnice.atk, anomalyProficiency: VERTICAL_VALUES.burnice.anomalyProficiency, anomalyMastery: VERTICAL_VALUES.burnice.anomalyMastery, critRate: VERTICAL_VALUES.burnice.critRate, energyRegen: VERTICAL_VALUES.burnice.baseEnergyRegen, penRatio: 0 },
  jane: { atk: VERTICAL_VALUES.jane.atk, anomalyProficiency: VERTICAL_VALUES.jane.anomalyProficiency, anomalyMastery: VERTICAL_VALUES.jane.anomalyMastery, penRatio: 0 },
}

const A = (action: Parameters<typeof canonicalAction>[0], form?: string) => form ? actionForm(action, form) : canonicalAction(action)
const GRACE_EX = actionTarget([A('Special Attack'), A('EX Special Attack')])
const GRACE_SHOCK = actionTarget([sourceLocalAction('Shock')])
const PIPER_DOWN = actionTarget([actionForm('Special Attack', 'Downward smash'), actionForm('EX Special Attack', 'Downward smash')])
const PIPER_ULT = actionTarget([A('Ultimate')])
const YUZUHA_ASSIST = actionTarget([canonicalAction('Assist Follow-Up')])
const BURNICE_AFTERBURN = actionTarget([sourceLocalAction('Afterburn')])
const BURNICE_BUILDUP = actionTarget([actionForm('Basic Attack', 'Mixed Flame'), A('EX Special Attack'), sourceLocalAction('Afterburn'), sourceLocalAction('Tossing')])
const BURNICE_EX_ASSIST = actionTarget([A('EX Special Attack'), A('Assist')])
const BURNICE_DOUBLE = actionTarget([sourceLocalAction('Double Shot'), sourceLocalAction('Special Afterburn')])
const BURNICE_BURN = actionTarget([sourceLocalAction('Burn')])

const GRACE_ANOMALY_SCOPES = [
  { id: 'graceAttributeAnomaly', target: ATTRIBUTE_ANOMALY_TARGET, children: [{ id: 'graceShock', target: GRACE_SHOCK }] },
  { id: 'graceDisorder', target: DISORDER_TARGET },
] satisfies readonly ActionScopeNode[]

const PIPER_ANOMALY_SCOPES = [
  { id: 'piperAttributeAnomaly', target: ATTRIBUTE_ANOMALY_TARGET },
  { id: 'piperDisorder', target: DISORDER_TARGET },
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

const src = (agent: Agent, slot: Slot, id: string, label: string, locus: 'identity' | 'core' | 'additional' | 'special' = 'core') => selectedAgentSource(agent, slot, id, label, locus)
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
const engineEffect = <Id extends keyof typeof W_ENGINE_FACTS>(
  id: Id,
  effect: WEngineEffectField<Id>,
): EquipmentEffectFact => {
  const effects: Readonly<Record<string, EquipmentEffectFact>> = W_ENGINE_FACTS[id].effects
  return effects[String(effect)]
}
const engineValue = <Id extends keyof typeof W_ENGINE_FACTS>(
  id: Id,
  effect: WEngineEffectField<Id>,
  setup: CompleteSelectedSetup,
) => equipmentEffectBaseValue(engineEffect(id, effect), setup.refinement)
const engineMax = <Id extends keyof typeof W_ENGINE_FACTS>(
  id: Id,
  effect: WEngineEffectField<Id>,
  setup: CompleteSelectedSetup,
) => equipmentEffectMaximumValue(engineEffect(id, effect), setup.refinement)
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
  formulas?: readonly SetupFormulaFamily[],
  attributes?: readonly EffectAttribute[],
): ProfileRelationship => ({ kind: 'provider', source, delivery: { recipient, ...(formulas ? { formulas } : {}), ...(attributes ? { attributes } : {}) }, effect })

function equipment(agent: Agent, slot: Slot, setup: CompleteSelectedSetup, relationships: ProfileRelationship[], base: SelectedSetupObservation['baseStats']): void {
  relationships.push(...sharedPartyEquipmentRelationships(agent, slot, setup))
  const engine = selectedWEngineSource(agent, slot, setup)
  const add = (metric: EffectMetric, value: number, action?: ActionTarget, surface: 'combat' | 'fully' = 'fully') => {
    if (!value) return
    if (metric === 'atk') relationships.push(stat(engine, 'atk', value, 'percentage', surface))
    else if (metric === 'anomalyProficiency') relationships.push(stat(engine, 'anomalyProficiency', value, 'flat', surface))
    else if (metric === 'anomalyMastery') relationships.push(stat(engine, 'anomalyMastery', value, 'flat', surface))
    else relationships.push(mod(engine, metric, value, action, surface))
  }
  if (isWEnginePassiveEligible(agent, setup.engineId)) {
    switch (setup.engineId) {
      case 'timeweaver': add('anomalyBuildupBonus', engineValue('timeweaver', 'electricBuildup', setup), undefined, 'combat'); add('anomalyProficiency', engineValue('timeweaver', 'anomalyProficiency', setup), undefined, 'fully'); break
      case 'practicedPerfection': add('anomalyMastery', engineValue('practicedPerfection', 'anomalyMastery', setup), undefined, 'combat'); if (agent === 'piper' || agent === 'jane') add('dmgBonus', engineMax('practicedPerfection', 'physicalDamage', setup), undefined, 'fully'); break
      case 'fusionCompiler': add('atk', engineValue('fusionCompiler', 'atk', setup), undefined, 'combat'); add('anomalyProficiency', engineMax('fusionCompiler', 'anomalyProficiency', setup), undefined, 'fully'); break
      case 'electroLipGloss': add('atk', engineValue('electroLipGloss', 'atk', setup)); add('dmgBonus', engineValue('electroLipGloss', 'damage', setup)); break
      case 'weepingGemini': add('anomalyProficiency', engineMax('weepingGemini', 'anomalyProficiency', setup)); break
      case 'sharpenedStinger': add('dmgBonus', engineMax('sharpenedStinger', 'physicalDamage', setup)); add('anomalyBuildupBonus', engineValue('sharpenedStinger', 'buildup', setup)); break
      case 'roaringRide': add('atk', engineValue('roaringRide', 'atk', setup)); add('anomalyProficiency', engineValue('roaringRide', 'anomalyProficiency', setup)); add('anomalyBuildupBonus', engineValue('roaringRide', 'buildup', setup)); break
      case 'metanukimorphosis': add('anomalyMastery', engineValue('metanukimorphosis', 'anomalyMastery', setup)); relationships.push(provider(engine, 'all-party', { kind: 'stat', statId: 'anomalyProficiency', region: 'flat', earliestSurface: 'fully', value: engineValue('metanukimorphosis', 'anomalyProficiency', setup) }, ['anomaly_damage'])); break
      case 'thoughtbop': relationships.push(provider(engine, 'all-party', { kind: 'stat', statId: 'atk', region: 'percentage', earliestSurface: 'fully', value: engineValue('thoughtbop', 'atk', setup) }, DAMAGE)); relationships.push(provider(engine, 'all-party', { kind: 'modifier', metricId: 'dmgBonus', earliestSurface: 'fully', value: engineMax('thoughtbop', 'damage', setup) }, DAMAGE)); relationships.push({ kind: 'automatic-energy', atom: { earliestSurface: 'combat', value: engineValue('thoughtbop', 'energy', setup), source: engine } }); break
      case 'flamemakerShaker': add('dmgBonus', engineMax('flamemakerShaker', 'damage', setup)); add('anomalyProficiency', engineValue('flamemakerShaker', 'anomalyProficiency', setup)); relationships.push({ kind: 'automatic-energy', atom: { earliestSurface: 'combat', value: engineValue('flamemakerShaker', 'offFieldEnergy', setup), source: engine } }); break
    }
  }
  const disc4 = selectedDiscSource(agent, slot, setup, setup.fourPieceId, '4-piece')
  switch (setup.fourPieceId) {
    case 'thunderMetal': if (base.atk !== undefined) relationships.push(stat(disc4, 'atk', equipmentEffectBaseValue(DRIVE_DISC_FACTS.thunderMetal.fourPiece.atk), 'percentage')); break
    case 'chaosJazz': relationships.push(mod(disc4, 'dmgBonus', equipmentEffectBaseValue(DRIVE_DISC_FACTS.chaosJazz.fourPiece.electricFireDamage), undefined, 'combat')); if (agent === 'burnice') relationships.push(provider(disc4, 'self', { kind: 'modifier', metricId: 'dmgBonus', earliestSurface: 'fully', value: equipmentEffectBaseValue(DRIVE_DISC_FACTS.chaosJazz.fourPiece.offFieldActionDamage), action: actionTarget([canonicalAction('EX Special Attack'), canonicalAction('Assist')]) }, ['general_damage'], ['Fire'])); break
    case 'freedomBlues': if (agent !== 'jane') relationships.push(mod(disc4, 'anomalyBuildupResReduction', equipmentEffectBaseValue(DRIVE_DISC_FACTS.freedomBlues.fourPiece.buildupResReduction))); break
    case 'fangedMetal': relationships.push(mod(disc4, 'dmgBonus', equipmentEffectBaseValue(DRIVE_DISC_FACTS.fangedMetal.fourPiece.assaultDamage))); break
  }
}

function profile(agent: Agent, state: WorkbenchState, slot: Slot): AgentSourceProfile {
  const setup = { ...requireCompleteSelectedSetup(state.slots[slot].setup), mindscape: state.slots[slot].setup.mindscape }
  const ids = state.slots.map(({ agentId }) => agentId)
  const core = src(agent, slot, 'core', SOURCE_LABELS[`${agent}Core` as keyof typeof SOURCE_LABELS])
  const ability = src(agent, slot, 'additional', SOURCE_LABELS[`${agent}Ability` as keyof typeof SOURCE_LABELS], 'additional')
  const mind = (tier: 1 | 2 | 4 | 6) => selectedMindscapeSource(agent, slot, setup.mindscape, tier)
  const observation: SelectedSetupObservation = { baseStats: BASE[agent], effectiveSubstats: effectiveSubstatChoicesForSlot(state, slot), modifierMetrics: ['dmgBonus', 'anomalyDmgBonus', 'anomalyBuildupBonus', 'anomalyBuildupResReduction', 'resReduction', 'resIgnore'] }
  const relationships = selectedSetupRelationships(agent, slot, setup, observation)
  const add = (r: ProfileRelationship) => relationships.push(r)
  const actions: ActionProjection[] = []
  if (agent === 'grace') {
    const qualified = anotherAgentHasSpecialty(ids, slot, ['Anomaly']) || anotherAgentSharesAttribute(ids, slot) || anotherAgentSharesFaction(ids, slot)
    add(mod(core, 'anomalyBuildupBonus', VERTICAL_VALUES.grace.coreAnomalyBuildup, GRACE_EX, 'fully'))
    if (qualified) add(mod(ability, 'anomalyDmgBonus', VERTICAL_VALUES.grace.additionalShockDmgPerStack * VERTICAL_VALUES.grace.additionalShockDmgStacks, GRACE_SHOCK))
    add(mod(src(agent, slot, 'potential', SOURCE_LABELS.gracePotential, 'identity'), 'dmgBonus', VERTICAL_VALUES.grace.potentialElectricDmg))
    if (setup.mindscape >= 2) { add(provider(mind(2), 'enemy-context', { kind: 'modifier', metricId: 'resReduction', earliestSurface: 'fully', value: VERTICAL_VALUES.grace.mindscapeElectricResReduction }, DAMAGE, ['Electric'])); add(provider(mind(2), 'enemy-context', { kind: 'modifier', metricId: 'anomalyBuildupResReduction', earliestSurface: 'fully', value: VERTICAL_VALUES.grace.mindscapeElectricBuildupResReduction }, ['anomaly_buildup'], ['Electric'])) }
    if (setup.mindscape >= 6) add({ kind: 'operation', atom: { operationId: 'graceGrenadeDmgMultiplier', label: 'Special/EX grenade DMG', earliestSurface: 'fully', value: VERTICAL_VALUES.grace.mindscapeGrenadeDmgMultiplier, unit: '', presentation: 'scale', source: mind(6) } })
    if (setup.engineId === 'timeweaver' && anotherAgentHasNonElectric(ids, slot)) add({ kind: 'post-delivery-stat-modifier-gauge', gaugeId: 'graceDisorder', source: selectedWEngineSource(agent, slot, setup), basis: { statId: 'anomalyProficiency', surface: 'fully' }, basisLabel: 'Fully Enabled Anomaly Proficiency', basisCap: 375, gaugeMetricId: 'anomalyProficiency', modifierMetricId: 'anomalyDmgBonus', action: DISORDER_TARGET, modifierSurface: 'fully', output: { label: 'Disorder DMG Bonus', value: { kind: 'activation', threshold: 375, inactiveValue: 0, activeValue: engineValue('timeweaver', 'disorderDamage', setup) }, unit: '%', cap: engineValue('timeweaver', 'disorderDamage', setup) }, decimals: { current: 0, threshold: 0, cap: 0, output: 1 } })
    actions.push(
      actionProjection('anomalyBuildupBonus', 'graceSpecialExBuildup', GRACE_EX),
      { metricId: 'anomalyDmgBonus', scopes: GRACE_ANOMALY_SCOPES },
    )
    equipment(agent, slot, setup, relationships, BASE[agent])
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
    if (setup.engineId === 'timeweaver' && anotherAgentHasNonElectric(ids, slot)) metrics.find(({ id }) => id === 'anomalyProficiency')!.gaugeId = 'graceDisorder'
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
    equipment(agent, slot, setup, relationships, BASE[agent])
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
    actions.push(
      actionProjection('critRate', 'janeAssaultCritRate', JANE_ASSAULT_TARGET),
      actionProjection('critDmg', 'janeAssaultCritDmg', JANE_ASSAULT_TARGET),
      actionProjection('defIgnore', 'janeAssaultDefIgnore', JANE_ASSAULT_TARGET),
      actionProjection('anomalyBuildupBonus', 'janePassionBuildup', JANE_PASSION_TARGET),
      actionProjection('dmgBonus', 'janePassionDmg', JANE_PASSION_TARGET),
      actionProjection('anomalyDmgBonus', 'janeAttributeAnomalyDmg', ATTRIBUTE_ANOMALY_TARGET),
    )
    equipment(agent, slot, setup, relationships, BASE[agent])
    return {
      agentId: agent,
      appliedPartySlot: slot,
      relationships,
      metrics: [
        m('atk', 'ATK', '', 'atk'),
        { ...m('anomalyProficiency', 'Anomaly Proficiency', '', 'anomalyProficiency'), gaugeId: 'janePassionAssault' },
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
      janePassionAssault: {
        coreSource: core,
        ...(setup.mindscape >= 1 ? { mindscape1Source: mind(1) } : {}),
      },
    }
  }
  if (agent === 'yuzuha') {
    const additionalActive = anotherAgentHasSpecialty(ids, slot, ['Anomaly']) || anotherAgentSharesFaction(ids, slot)
    const flavorAttribute = effectAttributeForAgent(ids[state.focusSlot])
    const flavor = actionTarget([sourceLocalAction(`${flavorAttribute} Anomaly Buildup · Flavor Match`)])
    const outputs = additionalActive ? { anomaly: (setup.mindscape >= 1 ? VERTICAL_VALUES.yuzuha.mindscape1AnomalyPerMastery : VERTICAL_VALUES.yuzuha.additionalAnomalyPerMastery), buildup: VERTICAL_VALUES.yuzuha.additionalBuildupPerMastery } : { anomaly: 0, buildup: 0 }
    add({ kind: 'gauge', gaugeId: 'yuzuhaTanuki', source: core, basis: { statId: 'atk', surface: 'initial' }, basisLabel: 'Initial ATK', basisCap: VERTICAL_VALUES.yuzuha.tanukiAtkCap / VERTICAL_VALUES.yuzuha.tanukiAtkRatio, metricId: 'atk', outputs: [{ label: 'Squad flat ATK', unit: '', cap: VERTICAL_VALUES.yuzuha.tanukiAtkCap, transform: { basisIncrement: 1, outputIncrement: VERTICAL_VALUES.yuzuha.tanukiAtkRatio, outputCap: VERTICAL_VALUES.yuzuha.tanukiAtkCap }, emission: { kind: 'provider', delivery: { recipient: 'all-party', formulas: DAMAGE }, effect: { kind: 'stat', statId: 'atk', region: 'flat', earliestSurface: 'fully' } } }] })
    add(provider(core, 'all-party', { kind: 'modifier', metricId: 'dmgBonus', earliestSurface: 'fully', value: VERTICAL_VALUES.yuzuha.tanukiDmgBonus }, DAMAGE))
    add(mod(src(agent, slot, 'sugarburst', 'Basic Attack · Sugarburst', 'special'), 'anomalyBuildupBonus', VERTICAL_VALUES.yuzuha.sugarburstBuildupByMindscapeTier[setup.mindscape >= 5 ? 2 : setup.mindscape >= 3 ? 1 : 0], flavor))
    if (additionalActive) add({ kind: 'gauge', gaugeId: 'yuzuhaAdditional', source: ability, basis: { statId: 'anomalyMastery', surface: 'fully' }, basisLabel: 'Fully Enabled Anomaly Mastery', basisThreshold: VERTICAL_VALUES.yuzuha.additionalMasteryThreshold, basisCap: VERTICAL_VALUES.yuzuha.additionalMasteryCap, metricId: 'anomalyMastery', outputs: [{ label: 'Anomaly Buildup Rate', unit: '%', cap: 20, transform: { basisThreshold: 100, basisIncrement: 1, outputIncrement: outputs.buildup, outputCap: 20 }, emission: { kind: 'provider', delivery: { recipient: 'all-party', formulas: ['anomaly_buildup'] }, effect: { kind: 'modifier', metricId: 'anomalyBuildupBonus', earliestSurface: 'fully' } } }, { label: 'Attribute Anomaly DMG', unit: '%', cap: setup.mindscape >= 1 ? 26 : 20, transform: { basisThreshold: 100, basisIncrement: 1, outputIncrement: outputs.anomaly, outputCap: setup.mindscape >= 1 ? 26 : 20 }, emission: { kind: 'provider', delivery: { recipient: 'all-party', formulas: ['anomaly_damage'] }, effect: { kind: 'modifier', metricId: 'anomalyDmgBonus', earliestSurface: 'fully', action: ATTRIBUTE_ANOMALY_TARGET } } }, { label: 'Disorder DMG', unit: '%', cap: setup.mindscape >= 1 ? 26 : 20, transform: { basisThreshold: 100, basisIncrement: 1, outputIncrement: outputs.anomaly, outputCap: setup.mindscape >= 1 ? 26 : 20 }, emission: { kind: 'provider', delivery: { recipient: 'all-party', formulas: ['anomaly_damage'] }, effect: { kind: 'modifier', metricId: 'anomalyDmgBonus', earliestSurface: 'fully', action: DISORDER_TARGET } } }] })
    if (setup.mindscape >= 1) add(provider(mind(1), 'enemy-context', { kind: 'modifier', metricId: 'resReduction', earliestSurface: 'fully', value: VERTICAL_VALUES.yuzuha.mindscape1ResReduction }, DAMAGE))
    if (setup.mindscape >= 2) { add(provider(mind(2), 'all-party', { kind: 'modifier', metricId: 'dmgBonus', earliestSurface: 'fully', value: VERTICAL_VALUES.yuzuha.mindscape2DmgBonus }, DAMAGE)); add(provider(mind(2), 'all-party', { kind: 'modifier', metricId: 'anomalyBuildupBonus', earliestSurface: 'fully', value: VERTICAL_VALUES.yuzuha.mindscape2BuildupBonus }, ['anomaly_buildup'])) }
    if (setup.mindscape >= 4) add(mod(mind(4), 'anomalyBuildupBonus', VERTICAL_VALUES.yuzuha.mindscape4AssistBuildup, YUZUHA_ASSIST))
    if (setup.mindscape >= 6) add(provider(mind(6), 'all-party', { kind: 'operation', operationId: 'yuzuhaDisorderDmgMultiplier', label: 'Disorder DMG Multiplier', earliestSurface: 'fully', value: VERTICAL_VALUES.yuzuha.mindscape6DisorderMultiplier, unit: '%' }, ['anomaly_damage']))
    actions.push(actionProjection('anomalyBuildupBonus', 'yuzuhaFlavorMatch', flavor), actionProjection('anomalyBuildupBonus', 'yuzuhaAssistFollowUp', YUZUHA_ASSIST))
    equipment(agent, slot, setup, relationships, BASE[agent])
    const metrics = [
      m('atk', 'ATK', '', 'atk'),
      m('anomalyMastery', 'Anomaly Mastery', '', 'anomalyMastery', undefined, 2),
      m('energyRegen', 'Energy Regen', '/s', 'energyRegen'),
      m('anomalyBuildupBonus', 'Anomaly Buildup Bonus', '%', undefined, 'nonzero-or-action'),
    ]
    metrics.find(({ id }) => id === 'atk')!.gaugeId = 'yuzuhaTanuki'
    if (additionalActive) metrics.find(({ id }) => id === 'anomalyMastery')!.gaugeId = 'yuzuhaAdditional'
    return { agentId: agent, appliedPartySlot: slot, relationships, metrics, actions }
  }
  const additionalActive = anotherAgentHasSpecialty(ids, slot, ['Anomaly']) || anotherAgentSharesFaction(ids, slot)
  add(provider(ability, 'self', { kind: 'modifier', metricId: 'anomalyBuildupBonus', earliestSurface: 'fully', value: additionalActive ? VERTICAL_VALUES.burnice.additionalBuildupRate : 0, action: BURNICE_BUILDUP }, ['anomaly_buildup'], ['Fire']))
  if (additionalActive) add({ kind: 'operation', atom: { operationId: 'burniceBurnDuration', label: 'Burn duration', earliestSurface: 'fully', value: VERTICAL_VALUES.burnice.burnDurationExtensionSeconds, unit: 's', source: ability } })
  const potential = src(agent, slot, 'potential', SOURCE_LABELS.burnicePotential, 'identity')
  add({ kind: 'post-delivery-stat-modifier-gauge', gaugeId: 'burniceAfterburnAp', source: core, basis: { statId: 'anomalyProficiency', surface: 'fully' }, basisLabel: 'Fully Enabled Anomaly Proficiency', basisCap: VERTICAL_VALUES.burnice.afterburnApCap, gaugeMetricId: 'anomalyProficiency', modifierMetricId: 'dmgBonus', action: BURNICE_AFTERBURN, modifierSurface: 'fully', output: { label: 'Afterburn DMG Bonus', value: { kind: 'linear', transform: { basisIncrement: 10, outputIncrement: VERTICAL_VALUES.burnice.afterburnDmgBonusPerThreshold, outputCap: VERTICAL_VALUES.burnice.afterburnDmgBonusCap } }, cap: VERTICAL_VALUES.burnice.afterburnDmgBonusCap, unit: '%' }, decimals: { current: 0, cap: 0, output: 1, outputCap: 0 } })
  add({ kind: 'gauge', gaugeId: 'burnicePotential', source: potential, basis: { statId: 'energyRegen', surface: 'initial' }, basisLabel: 'Initial Energy Regen', basisThreshold: VERTICAL_VALUES.burnice.potentialEnergyThreshold, basisCap: VERTICAL_VALUES.burnice.potentialEnergyThreshold + 1, metricId: 'energyRegen', outputs: [{ label: 'Anomaly Mastery', unit: '', cap: VERTICAL_VALUES.burnice.potentialMasteryCap, transform: { basisThreshold: VERTICAL_VALUES.burnice.potentialEnergyThreshold, basisIncrement: 0.1, outputIncrement: VERTICAL_VALUES.burnice.potentialMasteryPerIncrement, outputCap: VERTICAL_VALUES.burnice.potentialMasteryCap }, emission: { kind: 'stat', statId: 'anomalyMastery', region: 'flat', earliestSurface: 'fully' } }, { label: 'DMG Bonus', unit: '%', cap: VERTICAL_VALUES.burnice.potentialDmgCap, transform: { basisThreshold: VERTICAL_VALUES.burnice.potentialEnergyThreshold, basisIncrement: 0.1, outputIncrement: VERTICAL_VALUES.burnice.potentialDmgPerIncrement, outputCap: VERTICAL_VALUES.burnice.potentialDmgCap }, emission: { kind: 'modifier', metricId: 'dmgBonus', earliestSurface: 'fully' } }], decimals: { current: 3, threshold: 1, cap: 1, output: 1, outputCap: 0 } })
  if (setup.mindscape >= 1) { add(mod(mind(1), 'anomalyBuildupBonus', VERTICAL_VALUES.burnice.mindscape1BuildupRate, BURNICE_AFTERBURN)); add({ kind: 'operation', atom: { operationId: 'burniceAfterburnAddedMultiplier', label: 'Added Afterburn DMG Multiplier', earliestSurface: 'fully', value: VERTICAL_VALUES.burnice.mindscape1AddedAtkPercent, unit: '% ATK', source: mind(1) } }) }
  if (setup.mindscape >= 2) add(provider(mind(2), 'enemy-context', { kind: 'modifier', metricId: 'penRatio', earliestSurface: 'fully', value: VERTICAL_VALUES.burnice.mindscape2PenRatio }, DEF_DAMAGE_FORMULAS))
  if (setup.mindscape >= 4) add(provider(mind(4), 'self', { kind: 'modifier', metricId: 'critRate', earliestSurface: 'fully', value: VERTICAL_VALUES.burnice.mindscape4CritRate, action: BURNICE_EX_ASSIST }, ['general_damage'], ['Fire']))
  if (setup.mindscape >= 6) {
    add(provider(mind(6), 'self', { kind: 'modifier', metricId: 'resIgnore', earliestSurface: 'fully', value: VERTICAL_VALUES.burnice.mindscape6FireResIgnore, action: BURNICE_DOUBLE }, ['general_damage'], ['Fire']))
    add(provider(mind(6), 'self', { kind: 'modifier', metricId: 'resIgnore', earliestSurface: 'fully', value: VERTICAL_VALUES.burnice.mindscape6FireResIgnore, action: BURNICE_BURN }, ['anomaly_damage'], ['Fire']))
  }
  actions.push(
    { metricId: 'anomalyBuildupBonus', scopes: BURNICE_BUILDUP_SCOPES },
    actionProjection('dmgBonus', 'burniceExAssistDmg', BURNICE_EX_ASSIST),
    actionProjection('dmgBonus', 'burniceAfterburn', BURNICE_AFTERBURN),
    { metricId: 'anomalyDmgBonus', scopes: BURNICE_ANOMALY_SCOPES },
    actionProjection('critRate', 'burniceExAssistCrit', BURNICE_EX_ASSIST),
    { metricId: 'resIgnore', scopes: BURNICE_RES_SCOPES },
  )
  equipment(agent, slot, setup, relationships, BASE[agent])
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
  metrics.find(({ id }) => id === 'energyRegen')!.gaugeId = 'burnicePotential'
  metrics.find(({ id }) => id === 'anomalyProficiency')!.gaugeId = 'burniceAfterburnAp'
  return { agentId: agent, appliedPartySlot: slot, relationships, metrics, actions }
}

function anotherAgentHasNonElectric(ids: readonly AgentId[], slot: number): boolean {
  return ids.some((id, index) => index !== slot && ADMITTED_AGENTS.find(({ id: candidate }) => candidate === id)?.attribute !== 'Electric')
}

export function anomalyProfileFor(state: WorkbenchState, slot: Slot): AgentSourceProfile | null {
  const agent = state.slots[slot].agentId
  if (!(['grace', 'piper', 'yuzuha', 'burnice', 'jane'] as readonly string[]).includes(agent)) return null
  return profile(agent as Agent, state, slot)
}
