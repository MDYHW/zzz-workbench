import { actionForm, actionTarget, canonicalAction, sourceLocalAction } from '../../actions'
import { effectiveSubstatChoicesForSlot } from '../../candidates'
import { actionProjection, type AgentSourceProfile, type MetricProjection } from '../../calculation/profile-harness'
import type { ProfileRelationship } from '../../calculation/relationships'
import { selectSource } from '../../calculation/source-instance'
import type { WorkbenchState } from '../../state'
import { CRIT_DAMAGE_FORMULAS, DEF_DAMAGE_FORMULAS, REGULAR_DAMAGE_FORMULAS } from '../../formula-policy'
import { anotherAgentHasSpecialty, anotherAgentSharesAttribute, anotherAgentSharesFaction, caesarAdditionalIsActive } from '../../party-conditions'
import { DRIVE_DISC_FACTS } from '../discs'
import { W_ENGINE_FACTS, W_ENGINES } from '../engines'
import { SOURCE_LABELS, VERTICAL_VALUES } from '../retained-values'
import { defineAgentBaseSource } from '../source-definitions'
import { equipmentEffectBaseValue, equipmentEffectMaximumValue, type AgentSpecialty, type EquipmentEffectFact } from '../types'
import { isWEnginePassiveEligible, requireCompleteSelectedSetup, selectedDiscSource, selectedSetupRelationships, selectedWEngineSource, sharedPartyEquipmentRelationships, type CompleteSelectedSetup, type SelectedSetupObservation } from './equipment'
import { selectedAgentSource, selectedCalculationSource, selectedMindscapeSource } from './sources'

type Agent = 'lucia' | 'astraYao' | 'soukaku' | 'lucy' | 'nicole' | 'panYinhu' | 'ben' | 'caesar' | 'zhao' | 'seth' | 'sunna'
type Slot = 0 | 1 | 2
const DAMAGE = REGULAR_DAMAGE_FORMULAS
const STUN: readonly AgentSpecialty[] = ['Stun']
const CAESAR_M6 = actionTarget([actionForm('EX Special Attack', 'Overpowered Shield Bash'), canonicalAction('Assist Follow-Up')])
const SHIELDED_ULT = actionTarget([actionForm('Ultimate', 'Against a shielded enemy')])
const ZHAO_M4 = actionTarget([canonicalAction('Ultimate'), canonicalAction('Chain Attack'), actionForm('Basic Attack', 'Final Verdict')])
const BEN_EX_ULT = actionTarget([canonicalAction('EX Special Attack'), canonicalAction('Ultimate')])
const BEN_COUNTER = actionTarget([sourceLocalAction('Special/EX Block Counter')])
const BEN_BASIC_DASH_DODGE = actionTarget([canonicalAction('Basic Attack'), canonicalAction('Dash Attack'), canonicalAction('Dodge Counter')])
const BEN_ULT = actionTarget([canonicalAction('Ultimate')])
const SETH_ELECTRIFIED_BASIC = actionTarget([actionForm('Basic Attack', 'Electrified')])
const SETH_DEFENSIVE_ASSIST = actionTarget([sourceLocalAction('Defensive Assist')])
const SETH_EX_ASSIST = actionTarget([canonicalAction('EX Special Attack'), canonicalAction('Assist Follow-Up')])
const NANGONG_CHAIN = actionTarget([canonicalAction('Chain Attack')])

const BASE: Record<Agent, SelectedSetupObservation['baseStats']> = {
  lucia: { maxHp: VERTICAL_VALUES.lucia.hp, energyRegen: VERTICAL_VALUES.lucia.baseEnergyRegen },
  astraYao: { atk: VERTICAL_VALUES.astraYao.atk, energyRegen: VERTICAL_VALUES.astraYao.baseEnergyRegen },
  soukaku: { atk: VERTICAL_VALUES.soukaku.atk, energyRegen: VERTICAL_VALUES.soukaku.baseEnergyRegen },
  lucy: { atk: VERTICAL_VALUES.lucy.atk, energyRegen: VERTICAL_VALUES.lucy.baseEnergyRegen },
  nicole: { energyRegen: VERTICAL_VALUES.nicole.baseEnergyRegen },
  panYinhu: { atk: VERTICAL_VALUES.panYinhu.atk, impact: VERTICAL_VALUES.panYinhu.impact, energyRegen: VERTICAL_VALUES.panYinhu.baseEnergyRegen },
  ben: { atk: VERTICAL_VALUES.ben.atk, def: VERTICAL_VALUES.ben.def, impact: VERTICAL_VALUES.ben.impact, critRate: VERTICAL_VALUES.ben.critRate, critDmg: VERTICAL_VALUES.ben.critDmg, penRatio: 0, energyRegen: VERTICAL_VALUES.ben.baseEnergyRegen },
  caesar: { impact: VERTICAL_VALUES.caesar.impact, energyRegen: VERTICAL_VALUES.caesar.baseEnergyRegen },
  zhao: { maxHp: VERTICAL_VALUES.zhao.hp, critRate: VERTICAL_VALUES.zhao.critRate, energyRegen: VERTICAL_VALUES.zhao.baseEnergyRegen },
  seth: { atk: VERTICAL_VALUES.seth.atk, anomalyProficiency: VERTICAL_VALUES.seth.anomalyProficiency, anomalyMastery: VERTICAL_VALUES.seth.anomalyMastery, impact: VERTICAL_VALUES.seth.impact, energyRegen: VERTICAL_VALUES.seth.baseEnergyRegen },
  sunna: { atk: VERTICAL_VALUES.sunna.atk, energyRegen: VERTICAL_VALUES.sunna.baseEnergyRegen },
}
const m = (id: MetricProjection['id'], label: string, unit: string, statId?: MetricProjection['statId'], admission?: MetricProjection['admission']): MetricProjection => ({ id, label, unit, decimals: unit === '/s' ? 2 : unit === '%' ? 1 : id === 'impact' ? 2 : 0, ...(statId ? { statId } : { baseValues: { initial: 0, combat: 0, fully: 0 } }), ...(admission ? { admission } : {}) })

function src(agent: Agent, slot: Slot, id: string, label: string, locus: 'core' | 'additional' | 'special' | 'ex-special' = 'core') { return selectedAgentSource(agent, slot, id, label, locus) }
function engineValue(effect: EquipmentEffectFact, setup: CompleteSelectedSetup) { return equipmentEffectBaseValue(effect, setup.refinement) }
function engineMax(effect: EquipmentEffectFact, setup: CompleteSelectedSetup) { return equipmentEffectMaximumValue(effect, setup.refinement) }

function selectedEquipment(agent: Agent, slot: Slot, setup: CompleteSelectedSetup, observation: SelectedSetupObservation): ProfileRelationship[] {
  const engine = selectedWEngineSource(agent, slot, setup)
  const disc = selectedDiscSource(agent, slot, setup, setup.fourPieceId, '4-piece')
  const allDamage = (value: number, source = engine, nonstackId?: 'moonlightLullaby' | 'swingJazz' | 'bunnyInWonderland') => ({ kind: 'provider' as const, source, delivery: { recipient: 'all-party' as const, formulas: DAMAGE }, effect: { kind: 'modifier' as const, metricId: 'dmgBonus' as const, earliestSurface: 'fully' as const, value, ...(nonstackId ? { nonstackId } : {}) } })
  const energy = (value: number) => ({ kind: 'automatic-energy' as const, atom: { earliestSurface: 'combat' as const, value, source: engine } })
  const relationships = sharedPartyEquipmentRelationships(agent, slot, setup)
  const passiveEligible = isWEnginePassiveEligible(agent, setup.engineId)
  if (passiveEligible) switch (setup.engineId) {
    case 'peacekeeperSpecialized': relationships.push(
      { kind: 'automatic-energy', atom: { earliestSurface: 'fully', value: engineValue(W_ENGINE_FACTS.peacekeeperSpecialized.effects.energyRegen, setup), source: engine } },
      {
        kind: 'modifier',
        atom: {
          metricId: 'anomalyBuildupBonus',
          earliestSurface: 'fully',
          value: engineValue(W_ENGINE_FACTS.peacekeeperSpecialized.effects.buildup, setup),
          source: engine,
          action: SETH_EX_ASSIST,
        },
      },
    ); break
    case 'dreamlitHearth': relationships.push({ kind: 'provider', source: engine, delivery: { recipient: 'all-party' }, effect: { kind: 'stat', statId: 'maxHp', region: 'percentage', earliestSurface: 'fully', value: engineValue(W_ENGINE_FACTS.dreamlitHearth.effects.maxHp, setup) } }, allDamage(engineValue(W_ENGINE_FACTS.dreamlitHearth.effects.damage, setup)), energy(engineValue(W_ENGINE_FACTS.dreamlitHearth.effects.energy, setup))); break
    case 'elegantVanity': relationships.push(allDamage(engineMax(W_ENGINE_FACTS.elegantVanity.effects.damage, setup))); break
    case 'theVault': relationships.push(allDamage(engineValue(W_ENGINE_FACTS.theVault.effects.targetDamage, setup))); break
    case 'bashfulDemon': relationships.push({ kind: 'provider', source: engine, delivery: { recipient: 'all-party', formulas: DAMAGE }, effect: { kind: 'stat', statId: 'atk', region: 'percentage', earliestSurface: 'fully', value: engineMax(W_ENGINE_FACTS.bashfulDemon.effects.atk, setup) } }); break
    case 'tusksOfFury': relationships.push(allDamage(engineValue(W_ENGINE_FACTS.tusksOfFury.effects.damage, setup)), { kind: 'provider', source: engine, delivery: { recipient: 'all-party', formulas: ['daze_buildup'] }, effect: { kind: 'modifier', metricId: 'dazeBonus', earliestSurface: 'fully', value: engineValue(W_ENGINE_FACTS.tusksOfFury.effects.daze, setup) } }); break
    case 'tremorTrigramVessel': if (agent === 'ben') relationships.push({ kind: 'modifier', atom: { metricId: 'dmgBonus', earliestSurface: 'fully', value: engineValue(W_ENGINE_FACTS.tremorTrigramVessel.effects.damage, setup), source: engine, action: BEN_EX_ULT } }); break
    case 'originalTransmorpher': if (observation.baseStats.maxHp !== undefined) relationships.push({ kind: 'stat', atom: { statId: 'maxHp', region: 'percentage', earliestSurface: 'combat', value: engineValue(W_ENGINE_FACTS.originalTransmorpher.effects.maxHp, setup), source: engine } }); break
    case 'halfSugarBunny': relationships.push(energy(engineValue(W_ENGINE_FACTS.halfSugarBunny.effects.automaticEnergy, setup)), { kind: 'provider', source: engine, delivery: { recipient: 'all-party' }, effect: { kind: 'stat', statId: 'atk', region: 'percentage', earliestSurface: 'fully', value: engineValue(W_ENGINE_FACTS.halfSugarBunny.effects.squadAtk, setup), nonstackId: 'halfSugarBunny' } }, { kind: 'provider', source: engine, delivery: { recipient: 'all-party' }, effect: { kind: 'stat', statId: 'maxHp', region: 'percentage', earliestSurface: 'fully', value: engineValue(W_ENGINE_FACTS.halfSugarBunny.effects.squadMaxHp, setup), nonstackId: 'halfSugarBunny' } }, { kind: 'provider', source: engine, delivery: { recipient: 'all-party', formulas: CRIT_DAMAGE_FORMULAS }, effect: { kind: 'stat', statId: 'critDmg', region: 'flat', earliestSurface: 'fully', value: engineValue(W_ENGINE_FACTS.halfSugarBunny.effects.veilCritDamage, setup) } }); break
  }
  switch (setup.fourPieceId) {
    case 'bunnyInWonderland': relationships.push(allDamage(equipmentEffectMaximumValue(DRIVE_DISC_FACTS.bunnyInWonderland.fourPiece.damage), disc, 'bunnyInWonderland')); break
    case 'woodpecker': if (observation.baseStats.atk !== undefined) relationships.push({ kind: 'stat', atom: { statId: 'atk', region: 'percentage', earliestSurface: 'fully', value: equipmentEffectBaseValue(DRIVE_DISC_FACTS.woodpecker.fourPiece.atk), source: disc } }); break
    case 'pufferElectro': if (agent === 'ben') relationships.push({ kind: 'stat', atom: { statId: 'atk', region: 'percentage', earliestSurface: 'fully', value: equipmentEffectBaseValue(DRIVE_DISC_FACTS.pufferElectro.fourPiece.atk), source: disc } }, { kind: 'modifier', atom: { metricId: 'dmgBonus', earliestSurface: 'initial', value: equipmentEffectBaseValue(DRIVE_DISC_FACTS.pufferElectro.fourPiece.damage), source: disc, action: BEN_ULT } }); break
  }
  return relationships
}

function profile(agent: Agent, state: WorkbenchState, slot: Slot): AgentSourceProfile {
  const setup = { ...requireCompleteSelectedSetup(state.slots[slot].setup), mindscape: state.slots[slot].setup.mindscape }
  const baseStats = {
    ...BASE[agent],
    ...(agent === 'caesar' && setup.mindscape >= 6
      ? { critRate: VERTICAL_VALUES.caesar.critRate, critDmg: VERTICAL_VALUES.caesar.critDmg }
      : {}),
    ...(agent === 'zhao' && setup.mindscape >= 4
      ? { critDmg: VERTICAL_VALUES.zhao.critDmg }
      : {}),
  }
  const observation: SelectedSetupObservation = {
    baseStats: agent === 'seth'
      ? {
          atk: baseStats.atk,
          anomalyMastery: baseStats.anomalyMastery,
          impact: baseStats.impact,
          energyRegen: baseStats.energyRegen,
        }
      : baseStats,
    effectiveSubstats: effectiveSubstatChoicesForSlot(state, slot),
    modifierMetrics: agent === 'ben' || agent === 'caesar'
      ? ['dmgBonus', 'dazeBonus']
      : agent === 'seth'
        ? ['anomalyBuildupBonus', 'anomalyBuildupResReduction', 'dazeBonus']
        : undefined,
  }
  const relationships = selectedSetupRelationships(agent, slot, setup, observation)
  const agentIds = state.slots.map(({ agentId }) => agentId)
  const add = (r: ProfileRelationship) => relationships.push(r)
  const own = (id: string, label: string, locus: 'core' | 'additional' | 'special' | 'ex-special' = 'core') => src(agent, slot, id, label, locus)
  const mind = (tier: 1 | 2 | 3 | 4 | 5 | 6) => selectedMindscapeSource(agent, slot, setup.mindscape, tier)
  const calculation = (id: string, label: string) => selectedCalculationSource(agent, slot, id, label)
  const all = { recipient: 'all-party' as const }
  let metrics: MetricProjection[]
  let actions: AgentSourceProfile['actions']
  if (agent === 'seth') {
    const core = own('core', SOURCE_LABELS.sethCore)
    add({
      kind: 'stat',
      atom: {
        statId: 'anomalyProficiency',
        region: 'base',
        earliestSurface: 'initial',
        value: VERTICAL_VALUES.seth.anomalyProficiency,
        source: selectSource(
          defineAgentBaseSource('seth', 'Seth Lowell base stats'),
          'seth',
          slot,
        ),
      },
    })
    add({
      kind: 'provider',
      source: core,
      delivery: { recipient: 'self' },
      effect: {
        kind: 'stat',
        statId: 'anomalyProficiency',
        region: 'flat',
        earliestSurface: 'fully',
        value: VERTICAL_VALUES.seth.coreAnomalyProficiency,
        sourceDetail: 'Shield of Firm Resolve',
      },
    })
    add({
      kind: 'provider',
      source: core,
      delivery: { recipient: 'focus' },
      effect: {
        kind: 'stat',
        statId: 'anomalyProficiency',
        region: 'flat',
        earliestSurface: 'fully',
        value: VERTICAL_VALUES.seth.coreAnomalyProficiency,
        sourceDetail: 'Shield of Firm Resolve',
      },
    })
    if (anotherAgentSharesAttribute(agentIds, slot) || anotherAgentSharesFaction(agentIds, slot)) {
      add({
        kind: 'provider',
        source: own('additional', SOURCE_LABELS.sethAbility, 'additional'),
        delivery: { recipient: 'enemy-context', formulas: ['anomaly_buildup'] },
        effect: {
          kind: 'modifier',
          metricId: 'anomalyBuildupResReduction',
          earliestSurface: 'fully',
          value: VERTICAL_VALUES.seth.additionalBuildupResReduction,
        },
      })
    }
    if (setup.mindscape >= 2) {
      add({
        kind: 'modifier',
        atom: {
          metricId: 'anomalyBuildupBonus',
          earliestSurface: 'fully',
          value: VERTICAL_VALUES.seth.mindscape2Buildup,
          source: mind(2),
          action: SETH_ELECTRIFIED_BASIC,
        },
      })
    }
    if (setup.mindscape >= 4) {
      add({
        kind: 'modifier',
        atom: {
          metricId: 'dazeBonus',
          earliestSurface: 'fully',
          value: VERTICAL_VALUES.seth.mindscape4Daze,
          source: mind(4),
          action: SETH_DEFENSIVE_ASSIST,
        },
      })
    }
    metrics = [
      m('anomalyProficiency', 'Anomaly Proficiency', '', 'anomalyProficiency'),
      m('energyRegen', 'Energy Regen', '/s', 'energyRegen'),
      m('anomalyBuildupBonus', 'Anomaly Buildup Bonus', '%', undefined, 'nonzero-or-action'),
      m('anomalyBuildupResReduction', 'Anomaly Buildup RES Reduction', '%', undefined, 'nonzero-or-action'),
      m('dazeBonus', 'Daze Bonus', '%', undefined, 'nonzero-or-action'),
    ]
    actions = [
      actionProjection('anomalyBuildupBonus', 'sethElectrifiedBasicBuildup', SETH_ELECTRIFIED_BASIC),
      actionProjection('anomalyBuildupBonus', 'sethExAssistBuildup', SETH_EX_ASSIST),
      actionProjection('dazeBonus', 'sethDefensiveAssistDaze', SETH_DEFENSIVE_ASSIST),
    ]
  } else if (agent === 'lucia') {
    const t = setup.mindscape >= 5 ? 'm5' : setup.mindscape >= 3 ? 'm3' : 'base'; const cap = VERTICAL_VALUES.lucia.darkbreakerCap[t]
    add({ kind: 'gauge', gaugeId: 'luciaDarkbreaker', source: t === 'base' ? own('darkbreaker', SOURCE_LABELS.luciaSheer, 'ex-special') : mind(t === 'm3' ? 3 : 5), basis: { statId: 'maxHp', surface: 'initial' }, basisLabel: 'Initial Max HP', basisCap: VERTICAL_VALUES.lucia.darkbreakerHpCap, metricId: 'maxHp', outputs: [{ label: 'Squad Sheer Force', unit: '', cap, transform: { basisIncrement: 200, baseOutput: VERTICAL_VALUES.lucia.darkbreakerBase, outputIncrement: VERTICAL_VALUES.lucia.darkbreakerPer200Hp[t], outputCap: cap }, emission: { kind: 'provider', delivery: all, effect: { kind: 'modifier', metricId: 'sheerForce', earliestSurface: 'fully' } } }], sourceDetail: t === 'base' ? 'Darkbreaker' : `M${t === 'm3' ? 3 : 5} tier · Darkbreaker` })
    add({ kind: 'provider', source: own('core', SOURCE_LABELS.luciaCore), delivery: all, effect: { kind: 'stat', statId: 'maxHp', region: 'percentage', earliestSurface: 'fully', value: VERTICAL_VALUES.party.wellspringHp, nonstackId: 'etherVeilWellspring', sourceDetail: 'Ether Veil: Wellspring' } }); add({ kind: 'provider', source: own('core', SOURCE_LABELS.luciaCore), delivery: all, effect: { kind: 'modifier', metricId: 'dmgBonus', earliestSurface: 'fully', value: VERTICAL_VALUES.party.luciaCoreDmg, sourceDetail: 'Ether Veil: Wellspring' } })
    if (anotherAgentHasSpecialty(agentIds, slot, ['Rupture', 'Stun'])) add({ kind: 'provider', source: own('additional', SOURCE_LABELS.luciaAbility, 'additional'), delivery: { ...all, formulas: CRIT_DAMAGE_FORMULAS }, effect: { kind: 'stat', statId: 'critDmg', region: 'flat', earliestSurface: 'fully', value: VERTICAL_VALUES.party.luciaCritDmg } })
    if (setup.mindscape >= 1) add({ kind: 'provider', source: mind(1), delivery: { recipient: 'enemy-context', formulas: DAMAGE }, effect: { kind: 'modifier', metricId: 'resIgnore', earliestSurface: 'fully', value: VERTICAL_VALUES.lucia.mindscapeResIgnore, sourceDetail: "Dreamer's Nursery Rhyme" } }); if (setup.mindscape >= 2) add({ kind: 'provider', source: mind(2), delivery: all, effect: { kind: 'modifier', metricId: 'sheerDmgBonus', earliestSurface: 'fully', value: VERTICAL_VALUES.lucia.mindscapeSheerDmg, sourceDetail: 'Darkbreaker + Wellspring' } })
    metrics = [{ ...m('maxHp', 'Max HP', '', 'maxHp'), gaugeId: 'luciaDarkbreaker' }, m('energyRegen', 'Energy Regen', '/s', 'energyRegen')]
  } else if (agent === 'astraYao') {
    const coreTier = setup.mindscape >= 2 ? 1 : 0
    const cadenzaTier = setup.mindscape >= 5 ? 2 : setup.mindscape >= 3 ? 1 : 0
    const ratio = VERTICAL_VALUES.astraYao.coreAtkRatioByTier[coreTier]
    const cap = VERTICAL_VALUES.astraYao.coreAtkCapByTier[coreTier]
    const cadenzaLevel = VERTICAL_VALUES.astraYao.cadenzaLevelByTier[cadenzaTier]
    add({ kind: 'gauge', gaugeId: 'astraCore', source: own('core', SOURCE_LABELS.astraCore), basis: { statId: 'atk', surface: 'initial' }, basisLabel: 'Initial ATK', basisCap: cap / (ratio / 100), metricId: 'atk', outputs: [{ label: 'Core flat ATK', unit: '', cap, transform: { basisIncrement: 100, outputIncrement: ratio, outputCap: cap }, emission: { kind: 'provider', delivery: { recipient: 'all-party', formulas: DAMAGE }, effect: { kind: 'stat', statId: 'atk', region: 'flat', earliestSurface: 'fully' } } }], ...(coreTier ? { sourceDetail: 'M2 tier' } : {}) })
    const cadenza = own('cadenza', SOURCE_LABELS.astraCadenza, 'special'); add({ kind: 'provider', source: cadenza, delivery: { recipient: 'all-party', formulas: DAMAGE }, effect: { kind: 'modifier', metricId: 'dmgBonus', earliestSurface: 'fully', value: VERTICAL_VALUES.astraYao.cadenzaDmgByTier[cadenzaTier], sourceDetail: `Idyllic Cadenza · level ${cadenzaLevel}` } }); add({ kind: 'provider', source: cadenza, delivery: { recipient: 'all-party', formulas: CRIT_DAMAGE_FORMULAS }, effect: { kind: 'stat', statId: 'critDmg', region: 'flat', earliestSurface: 'fully', value: VERTICAL_VALUES.astraYao.cadenzaCritDmgByTier[cadenzaTier], sourceDetail: `Idyllic Cadenza · level ${cadenzaLevel}` } })
    if (setup.mindscape >= 1) add({ kind: 'provider', source: mind(1), delivery: { recipient: 'enemy-context', formulas: DAMAGE }, effect: { kind: 'modifier', metricId: 'resReduction', earliestSurface: 'fully', value: VERTICAL_VALUES.astraYao.mindscapeResReduction, sourceDetail: '3 stacks' } }); if (setup.mindscape >= 4) add({ kind: 'provider', source: mind(4), delivery: { recipient: 'all-party', specialties: STUN }, effect: { kind: 'operation', operationId: 'nextQuickAssistDaze', label: 'Next Quick Assist Daze', earliestSurface: 'fully', value: VERTICAL_VALUES.astraYao.mindscapeQuickAssistDaze, unit: '%', sourceDetail: 'Next Quick Assist' } })
    metrics = [{ ...m('atk', 'ATK', '', 'atk'), gaugeId: 'astraCore' }, m('energyRegen', 'Energy Regen', '/s', 'energyRegen')]
  } else if (agent === 'soukaku') {
    add({ kind: 'gauge', gaugeId: 'soukakuCore', source: own('core', SOURCE_LABELS.soukakuCore), basis: { statId: 'atk', surface: 'initial' }, basisLabel: 'Initial ATK', basisCap: VERTICAL_VALUES.soukaku.coreAtkCap, metricId: 'atk', outputs: [{ label: 'Focus flat ATK', unit: '', cap: VERTICAL_VALUES.soukaku.coreOutputCap, transform: { basisIncrement: 100 / VERTICAL_VALUES.soukaku.coreAtkRatio, outputIncrement: 1, outputCap: VERTICAL_VALUES.soukaku.coreOutputCap }, emission: { kind: 'provider', delivery: { recipient: 'focus' }, effect: { kind: 'stat', statId: 'atk', region: 'flat', earliestSurface: 'fully' } } }] })
    if (anotherAgentSharesAttribute(agentIds, slot) || anotherAgentSharesFaction(agentIds, slot)) add({ kind: 'provider', source: own('additional', SOURCE_LABELS.soukakuAbility, 'additional'), delivery: { recipient: 'all-party', attributes: ['Ice'] }, effect: { kind: 'modifier', metricId: 'dmgBonus', earliestSurface: 'fully', value: VERTICAL_VALUES.soukaku.additionalIceDmg } }); if (setup.mindscape >= 4) add({ kind: 'provider', source: mind(4), delivery: { recipient: 'enemy-context', attributes: ['Ice'] }, effect: { kind: 'modifier', metricId: 'resReduction', earliestSurface: 'fully', value: VERTICAL_VALUES.soukaku.mindscapeIceResReduction } })
    metrics = [{ ...m('atk', 'ATK', '', 'atk'), gaugeId: 'soukakuCore' }, m('energyRegen', 'Energy Regen', '/s', 'energyRegen')]
  } else if (agent === 'lucy') {
    const tier = setup.mindscape >= 5 ? 2 : setup.mindscape >= 3 ? 1 : 0; const ratio = VERTICAL_VALUES.lucy.coreAtkRatioByMindscapeTier[tier]; const base = VERTICAL_VALUES.lucy.coreAtkBaseByMindscapeTier[tier]
    add({ kind: 'gauge', gaugeId: 'lucyCore', source: tier === 0 ? own('core', SOURCE_LABELS.lucyCore) : mind(tier === 1 ? 3 : 5), basis: { statId: 'atk', surface: 'initial' }, basisLabel: 'Initial ATK', basisCap: (VERTICAL_VALUES.lucy.coreAtkOutputCap - base) / (ratio / 100), metricId: 'atk', outputs: [{ label: 'Squad flat ATK', unit: '', cap: VERTICAL_VALUES.lucy.coreAtkOutputCap, transform: { basisIncrement: 100, baseOutput: base, outputIncrement: ratio, outputCap: VERTICAL_VALUES.lucy.coreAtkOutputCap }, emission: { kind: 'provider', delivery: all, effect: { kind: 'stat', statId: 'atk', region: 'flat', earliestSurface: 'fully' } } }], ...(tier === 0 ? { sourceDetail: 'Rebellious Assault' } : {}) }); if (setup.mindscape >= 4) add({ kind: 'provider', source: mind(4), delivery: { ...all, formulas: CRIT_DAMAGE_FORMULAS }, effect: { kind: 'stat', statId: 'critDmg', region: 'flat', earliestSurface: 'fully', value: VERTICAL_VALUES.lucy.mindscapeSquadCritDmg } })
    metrics = [{ ...m('atk', 'ATK', '', 'atk'), gaugeId: 'lucyCore' }, m('energyRegen', 'Energy Regen', '/s', 'energyRegen')]
  } else if (agent === 'nicole') {
    add({ kind: 'provider', source: own('core', SOURCE_LABELS.nicoleCore), delivery: { recipient: 'enemy-context', formulas: ['general_damage'] }, effect: { kind: 'modifier', metricId: 'defReduction', earliestSurface: 'fully', value: VERTICAL_VALUES.nicole.coreDefReduction } }); if (anotherAgentSharesAttribute(agentIds, slot) || anotherAgentSharesFaction(agentIds, slot)) add({ kind: 'provider', source: own('additional', SOURCE_LABELS.nicoleAbility, 'additional'), delivery: { recipient: 'all-party', attributes: ['Ether'], formulas: DAMAGE }, effect: { kind: 'modifier', metricId: 'dmgBonus', earliestSurface: 'fully', value: VERTICAL_VALUES.nicole.additionalEtherDmg } }); if (setup.mindscape >= 6) add({ kind: 'provider', source: mind(6), delivery: { ...all, formulas: CRIT_DAMAGE_FORMULAS }, effect: { kind: 'stat', statId: 'critRate', region: 'flat', earliestSurface: 'fully', value: VERTICAL_VALUES.nicole.mindscapeSquadCritRate, sourceDetail: '10 stacks' } })
    metrics = [m('energyRegen', 'Energy Regen', '/s', 'energyRegen')]
  } else if (agent === 'panYinhu') {
    const m6 = setup.mindscape >= 6; const ratio = m6 ? VERTICAL_VALUES.panYinhu.mindscapeCoreAtkRatio : VERTICAL_VALUES.panYinhu.coreAtkRatio; const cap = m6 ? VERTICAL_VALUES.panYinhu.mindscapeCoreSheerCap : VERTICAL_VALUES.panYinhu.coreSheerCap
    add({ kind: 'gauge', gaugeId: 'panYinhuCore', source: m6 ? mind(6) : own('core', SOURCE_LABELS.panYinhuCore), basis: { statId: 'atk', surface: 'initial' }, basisLabel: 'Initial ATK', basisCap: 3000, metricId: 'atk', outputs: [{ label: 'Focus Sheer Force', unit: '', cap, transform: { basisIncrement: 100, outputIncrement: ratio, outputCap: cap }, emission: { kind: 'provider', delivery: { recipient: 'focus', formulas: ['sheer_damage'] }, effect: { kind: 'modifier', metricId: 'sheerForce', earliestSurface: 'fully' } } }] })
    if (anotherAgentHasSpecialty(agentIds, slot, ['Rupture']) || anotherAgentSharesFaction(agentIds, slot)) { add({ kind: 'provider', source: own('additional', SOURCE_LABELS.panYinhuAbility, 'additional'), delivery: { recipient: 'enemy-context', formulas: DAMAGE }, effect: { kind: 'modifier', metricId: 'dmgBonus', earliestSurface: 'fully', value: VERTICAL_VALUES.panYinhu.additionalDmg } }); if (setup.mindscape >= 1) add({ kind: 'provider', source: mind(1), delivery: { recipient: 'enemy-context', formulas: DAMAGE }, effect: { kind: 'modifier', metricId: 'dmgBonus', earliestSurface: 'fully', value: VERTICAL_VALUES.panYinhu.mindscapeAdditionalDmg } }) }
    metrics = [{ ...m('atk', 'ATK', '', 'atk'), gaugeId: 'panYinhuCore' }, { ...m('impact', 'Impact', '', 'impact'), decimals: 1 }, m('energyRegen', 'Energy Regen', '/s', 'energyRegen'), m('dazeBonus', 'Daze Bonus', '%', undefined, 'nonzero-or-action')]
  } else if (agent === 'ben') {
    add({ kind: 'linear', source: own('core', SOURCE_LABELS.benCore), basis: { statId: 'def', surface: 'initial' }, outputs: [{ transform: { basisIncrement: 1, outputIncrement: VERTICAL_VALUES.ben.coreDefToAtk / 100 }, emission: { kind: 'stat', statId: 'atk', region: 'flat', earliestSurface: 'combat' } }] }); if (anotherAgentSharesAttribute(agentIds, slot) || anotherAgentSharesFaction(agentIds, slot)) add({ kind: 'provider', source: own('additional', SOURCE_LABELS.benAbility, 'additional'), delivery: { recipient: 'all-party', formulas: CRIT_DAMAGE_FORMULAS }, effect: { kind: 'stat', statId: 'critRate', region: 'flat', earliestSurface: 'fully', value: VERTICAL_VALUES.ben.additionalCritRate } }); if (setup.mindscape >= 2) add({ kind: 'operation', atom: { operationId: 'benBlockCounterDefDamage', label: 'Special/EX Block Counter added DMG Multiplier', earliestSurface: 'fully', value: VERTICAL_VALUES.ben.mindscapeCounterDefDamage, unit: '% DEF', source: mind(2) } }); if (setup.mindscape >= 4) add({ kind: 'modifier', atom: { metricId: 'dmgBonus', earliestSurface: 'fully', value: VERTICAL_VALUES.ben.mindscapeCounterDmg, source: mind(4), action: BEN_COUNTER, sourceDetail: 'Invulnerable block counter' } }); if (setup.mindscape >= 6) add({ kind: 'modifier', atom: { metricId: 'dazeBonus', earliestSurface: 'fully', value: VERTICAL_VALUES.ben.mindscapeDaze, source: mind(6), action: BEN_BASIC_DASH_DODGE, sourceDetail: 'After EX Special or follow-up' } })
    const critCap = { value: 100, source: calculation('crit-rate-cap', 'Displayed CRIT Rate cap') }
    metrics = [m('atk', 'ATK', '', 'atk'), m('def', 'DEF', '', 'def'), { ...m('critRate', 'CRIT Rate', '%', 'critRate'), cap: critCap }, m('critDmg', 'CRIT DMG', '%', 'critDmg'), m('impact', 'Impact', '', 'impact'), m('energyRegen', 'Energy Regen', '/s', 'energyRegen'), m('dmgBonus', 'DMG Bonus', '%'), m('penRatio', 'PEN Ratio', '%', 'penRatio', 'nonzero-or-action'), m('dazeBonus', 'Daze Bonus', '%'), m('defIgnore', 'DEF Ignore', '%', undefined, 'nonzero-or-action'), m('defReduction', 'DEF Reduction', '%', undefined, 'nonzero-or-action'), m('resIgnore', 'RES Ignore', '%', undefined, 'nonzero-or-action'), m('resReduction', 'RES Reduction', '%', undefined, 'nonzero-or-action'), m('stunDmgMultiplier', 'Stun DMG Multiplier', '%', undefined, 'nonzero-or-action')]
    actions = [
      {
        metricId: 'dmgBonus',
        scopes: [
          { id: 'benExUltimate', target: BEN_EX_ULT, children: [{ id: 'benUltimate', target: BEN_ULT }] },
          { id: 'benBlockCounter', target: BEN_COUNTER },
        ],
      },
      actionProjection('dazeBonus', 'benBasicDashDodge', BEN_BASIC_DASH_DODGE),
    ]
  } else if (agent === 'caesar') {
    const impact = VERTICAL_VALUES.caesar.coreImpactByTier; const daze = VERTICAL_VALUES.caesar.ultimateDazeByTier; add({ kind: 'stat', atom: { statId: 'impact', region: 'percentage', earliestSurface: 'fully', value: impact[0], source: own('special', 'Special Attack', 'special'), sourceDetail: 'After Perfect Block, Retaliation, or Defensive Assist' } }); if (setup.mindscape >= 3) add({ kind: 'stat', atom: { statId: 'impact', region: 'percentage', earliestSurface: 'fully', value: impact[1] - impact[0], source: mind(3), sourceDetail: 'Special Attack skill level +2' } }); if (setup.mindscape >= 5) add({ kind: 'stat', atom: { statId: 'impact', region: 'percentage', earliestSurface: 'fully', value: impact[2] - impact[1], source: mind(5), sourceDetail: 'Special Attack skill level +2' } })
    add({ kind: 'provider', source: setup.mindscape >= 2 ? mind(2) : own('core', SOURCE_LABELS.caesarCore), delivery: { recipient: 'focus' }, effect: { kind: 'stat', statId: 'atk', region: 'flat', earliestSurface: 'fully', value: setup.mindscape >= 2 ? VERTICAL_VALUES.caesar.mindscapeFocusAtk : VERTICAL_VALUES.caesar.coreFocusAtk, ...(setup.mindscape >= 2 ? { sourceDetail: 'Radiant Aegis ATK replacement' } : {}) } }); if (caesarAdditionalIsActive(agentIds, slot)) add({ kind: 'provider', source: own('additional', SOURCE_LABELS.caesarAbility, 'additional'), delivery: { recipient: 'enemy-context' }, effect: { kind: 'modifier', metricId: 'dmgBonus', earliestSurface: 'fully', value: VERTICAL_VALUES.caesar.additionalDmgBonus } }); if (setup.mindscape >= 1) add({ kind: 'provider', source: mind(1), delivery: { recipient: 'enemy-context', formulas: DAMAGE }, effect: { kind: 'modifier', metricId: 'resReduction', earliestSurface: 'fully', value: VERTICAL_VALUES.caesar.mindscapeResReduction, sourceDetail: 'While Radiant Aegis is active' } })
    add({ kind: 'modifier', atom: { metricId: 'dazeBonus', earliestSurface: 'fully', value: daze[0], source: own('ultimate', 'Ultimate', 'special'), action: SHIELDED_ULT, sourceDetail: 'Against a shielded enemy' } }); if (setup.mindscape >= 3) add({ kind: 'modifier', atom: { metricId: 'dazeBonus', earliestSurface: 'fully', value: daze[1] - daze[0], source: mind(3), action: SHIELDED_ULT, sourceDetail: 'Ultimate skill level +2' } }); if (setup.mindscape >= 5) add({ kind: 'modifier', atom: { metricId: 'dazeBonus', earliestSurface: 'fully', value: daze[2] - daze[1], source: mind(5), action: SHIELDED_ULT, sourceDetail: 'Ultimate skill level +2' } })
    if (setup.mindscape >= 6) { add({ kind: 'stat', atom: { statId: 'critRate', region: 'flat', earliestSurface: 'fully', value: VERTICAL_VALUES.caesar.mindscapeCritRate, source: mind(6) } }); add({ kind: 'stat', atom: { statId: 'critDmg', region: 'flat', earliestSurface: 'fully', value: VERTICAL_VALUES.caesar.mindscapeCritDmg, source: mind(6) } }); add({ kind: 'modifier', atom: { metricId: 'critRate', earliestSurface: 'fully', value: VERTICAL_VALUES.caesar.mindscapeActionCritRate, source: mind(6), action: CAESAR_M6, sourceDetail: 'Guaranteed CRIT' } }); add({ kind: 'modifier', atom: { metricId: 'dmgBonus', earliestSurface: 'fully', value: VERTICAL_VALUES.caesar.mindscapeActionDmg, source: mind(6), action: CAESAR_M6 } }); add({ kind: 'operation', atom: { operationId: 'caesarPrimaryTargetFollowup', label: 'Overpowered Shield Bash/Assist Follow-Up primary-target follow-up', earliestSurface: 'fully', value: VERTICAL_VALUES.caesar.mindscapePrimaryTargetFollowup, unit: '% original action DMG', source: mind(6) } }) }
    const hasEnergy = W_ENGINES[setup.engineId].advancedStat.id === 'energyRegenPct' || setup.mains.slot6 === 'energyRegenPct' || [setup.fourPieceId, setup.twoPieceId].some((id) => Object.values(DRIVE_DISC_FACTS[id].twoPiece).some((effect) => effect.modifier === 'energyRegen'))
    const critCap = { value: 100, source: calculation('crit-rate-cap', 'Displayed CRIT Rate cap') }
    metrics = [
      ...(setup.mindscape >= 6 ? [
        { ...m('critRate', 'CRIT Rate', '%', 'critRate'), cap: critCap },
        m('critDmg', 'CRIT DMG', '%', 'critDmg'),
        { ...m('dmgBonus', 'DMG Bonus', '%'), resultVisibility: 'action-only' as const },
      ] : []),
      m('impact', 'Impact', '', 'impact'),
      ...(hasEnergy ? [m('energyRegen', 'Energy Regen', '/s', 'energyRegen')] : []),
      m('dazeBonus', 'Daze Bonus', '%'),
    ]
    actions = [
      actionProjection('dazeBonus', 'caesarShieldedUltimate', SHIELDED_ULT),
      ...(setup.mindscape >= 6 ? [
        actionProjection('dmgBonus', 'caesarM6Actions', CAESAR_M6),
        { ...actionProjection('critRate', 'caesarM6Crit', CAESAR_M6), cap: critCap },
      ] : []),
    ]
  } else if (agent === 'zhao') {
    const core = own('core', SOURCE_LABELS.zhaoCore)
    add({ kind: 'stat', atom: { statId: 'maxHp', region: 'percentage', earliestSurface: 'initial', value: VERTICAL_VALUES.zhao.coreHp, source: core } }); add({ kind: 'linear', source: core, basis: { statId: 'maxHp', surface: 'initial' }, outputs: [{ transform: { basisIncrement: 1000, outputIncrement: VERTICAL_VALUES.zhao.coreCritRatePer1000Hp }, emission: { kind: 'stat', statId: 'critRate', region: 'flat', earliestSurface: 'initial' } }] }); if (setup.mindscape >= 6) add({ kind: 'linear', source: mind(6), basis: { statId: 'maxHp', surface: 'initial' }, outputs: [{ transform: { basisIncrement: 1000, outputIncrement: VERTICAL_VALUES.zhao.coreCritRatePer1000Hp * (VERTICAL_VALUES.zhao.mindscapeCoreCritRateMultiplier - 1) }, emission: { kind: 'stat', statId: 'critRate', region: 'flat', earliestSurface: 'initial', sourceDetail: 'Core CRIT Rate increase' } }] })
    add({ kind: 'provider', source: core, delivery: all, effect: { kind: 'stat', statId: 'maxHp', region: 'percentage', earliestSurface: 'fully', value: VERTICAL_VALUES.zhao.wellspringHp, nonstackId: 'etherVeilWellspring', sourceDetail: 'Ether Veil: Wellspring' } }); add({ kind: 'provider', source: core, delivery: all, effect: { kind: 'stat', statId: 'atk', region: 'flat', earliestSurface: 'fully', value: VERTICAL_VALUES.zhao.wellspringAtk, sourceDetail: 'Ether Veil: Wellspring' } })
    if (anotherAgentHasSpecialty(agentIds, slot, ['Attack', 'Anomaly', 'Support'])) add({ kind: 'gauge', gaugeId: 'zhaoAdditional', source: own('additional', SOURCE_LABELS.zhaoAbility, 'additional'), basis: { statId: 'maxHp', surface: 'initial' }, basisLabel: 'Initial Max HP', basisThreshold: VERTICAL_VALUES.zhao.additionalHpThreshold, basisCap: VERTICAL_VALUES.zhao.additionalHpCap, metricId: 'maxHp', outputs: [{ label: 'Squad DMG Bonus', unit: '%', cap: VERTICAL_VALUES.zhao.additionalDmgCap, transform: { basisThreshold: VERTICAL_VALUES.zhao.additionalHpThreshold, basisIncrement: VERTICAL_VALUES.zhao.additionalHpIncrement, baseOutput: VERTICAL_VALUES.zhao.additionalDmg, outputIncrement: VERTICAL_VALUES.zhao.additionalDmgPerIncrement, outputCap: VERTICAL_VALUES.zhao.additionalDmgCap }, emission: { kind: 'provider', delivery: { recipient: 'all-party', formulas: DAMAGE }, effect: { kind: 'modifier', metricId: 'dmgBonus', earliestSurface: 'fully' } } }] })
    if (setup.mindscape >= 1) add({ kind: 'provider', source: mind(1), delivery: { recipient: 'enemy-context', formulas: DAMAGE }, effect: { kind: 'modifier', metricId: 'resIgnore', earliestSurface: 'fully', value: VERTICAL_VALUES.zhao.mindscapeResIgnore, sourceDetail: 'All-Attribute RES Ignore' } }); if (setup.mindscape >= 2) add({ kind: 'provider', source: mind(2), delivery: { recipient: 'other-party' }, effect: { kind: 'stat', statId: 'atk', region: 'percentage', earliestSurface: 'fully', value: VERTICAL_VALUES.zhao.mindscapeOtherAtk, sourceDetail: 'Reachable healing condition' } }); if (setup.mindscape >= 4) add({ kind: 'modifier', atom: { metricId: 'critDmg', earliestSurface: 'fully', value: VERTICAL_VALUES.zhao.mindscapeActionCritDmg, source: mind(4), action: ZHAO_M4 } })
    add({ kind: 'operation', atom: { operationId: 'zhaoFinalVerdictMaxHp', label: 'Basic Attack: Final Verdict maximum-charge Max HP', earliestSurface: 'fully', value: setup.mindscape >= 6 ? VERTICAL_VALUES.zhao.mindscapeFinalVerdictMaxHp : VERTICAL_VALUES.zhao.finalVerdictMaxHp, unit: '%', source: setup.mindscape >= 6 ? mind(6) : own('finalVerdict', SOURCE_LABELS.zhaoBasic, 'special'), sourceDetail: 'Final Verdict · Maximum charge' } })
    const critCap = { value: 100, source: calculation('crit-rate-cap', 'Displayed CRIT Rate cap') }
    metrics = [{ ...m('maxHp', 'Max HP', '', 'maxHp'), gaugeId: 'zhaoAdditional' }, { ...m('critRate', 'CRIT Rate', '%', 'critRate'), cap: critCap }, ...(setup.mindscape >= 4 ? [m('critDmg', 'CRIT DMG', '%', 'critDmg')] : []), m('energyRegen', 'Energy Regen', '/s', 'energyRegen')]; actions = setup.mindscape >= 4 ? [actionProjection('critDmg', 'zhaoM4CritDmg', ZHAO_M4)] : undefined
  } else {
    const core = own('core', SOURCE_LABELS.sunnaCore)
    const ability = own('additional', SOURCE_LABELS.sunnaAbility, 'additional')
    const exSpecial = own('ex-special', 'EX Special Attack', 'ex-special')
    add({ kind: 'stat', atom: { statId: 'atk', region: 'percentage', earliestSurface: 'initial', value: VERTICAL_VALUES.sunna.initialAtk, source: core } })
    add({
      kind: 'gauge', gaugeId: 'sunnaCore', source: core,
      basis: { statId: 'atk', surface: 'initial' }, basisLabel: 'Initial ATK',
      basisCap: VERTICAL_VALUES.sunna.coreAtkCapBasis, metricId: 'atk',
      outputs: [{
        label: 'Squad flat ATK', unit: '', cap: VERTICAL_VALUES.sunna.coreAtkCap,
        transform: { basisIncrement: 1, outputIncrement: VERTICAL_VALUES.sunna.coreAtkRatio / 100, outputCap: VERTICAL_VALUES.sunna.coreAtkCap },
        emission: { kind: 'provider', delivery: { recipient: 'all-party', formulas: DAMAGE }, effect: { kind: 'stat', statId: 'atk', region: 'flat', earliestSurface: 'fully' } },
      }],
    })
    add({ kind: 'provider', source: exSpecial, delivery: { recipient: 'all-party', formulas: DAMAGE }, effect: { kind: 'stat', statId: 'atk', region: 'flat', earliestSurface: 'fully', value: VERTICAL_VALUES.sunna.exSpecialAtk } })
    const additionalActive = anotherAgentHasSpecialty(agentIds, slot, ['Attack']) || anotherAgentSharesFaction(agentIds, slot)
    if (additionalActive) add({ kind: 'provider', source: ability, delivery: { recipient: 'enemy-context', formulas: DAMAGE }, effect: { kind: 'modifier', metricId: 'stunDmgMultiplier', earliestSurface: 'fully', value: VERTICAL_VALUES.sunna.additionalStunMultiplier } })
    const triggerPerformer = setup.mindscape >= 6 || anotherAgentHasSpecialty(agentIds, slot, ['Attack', 'Anomaly'])
    if (setup.mindscape >= 1 && triggerPerformer) add({ kind: 'provider', source: mind(1), delivery: { recipient: 'enemy-context', formulas: DEF_DAMAGE_FORMULAS }, effect: { kind: 'modifier', metricId: 'defReduction', earliestSurface: 'fully', value: VERTICAL_VALUES.sunna.mindscape1DefReduction } })
    if (setup.mindscape >= 2) add({ kind: 'provider', source: mind(2), delivery: { recipient: 'all-party', formulas: DAMAGE }, effect: { kind: 'stat', statId: 'atk', region: 'percentage', earliestSurface: 'fully', value: VERTICAL_VALUES.sunna.mindscape2Atk } })
    if (setup.mindscape >= 4) add({ kind: 'provider', source: mind(4), delivery: { recipient: 'all-party', formulas: DAMAGE }, effect: { kind: 'modifier', metricId: 'dmgBonus', earliestSurface: 'fully', value: VERTICAL_VALUES.sunna.mindscape4Dmg } })
    metrics = [
      { ...m('atk', 'ATK', '', 'atk'), gaugeId: 'sunnaCore' },
      m('energyRegen', 'Energy Regen', '/s', 'energyRegen'),
    ]
  }
  const nangongSlot = agentIds.indexOf('nangongYu')
  if (
    agent === 'seth'
    && nangongSlot >= 0
    && nangongSlot !== slot
    && (
      anotherAgentHasSpecialty(agentIds, nangongSlot as Slot, ['Anomaly'])
      || anotherAgentSharesFaction(agentIds, nangongSlot as Slot)
    )
  ) {
    actions = [
      ...(actions ?? []),
      actionProjection('anomalyBuildupBonus', 'chainAttackAnomalyBuildup', NANGONG_CHAIN),
    ]
  }
  relationships.push(...selectedEquipment(agent, slot, setup, observation))
  return { agentId: agent, appliedPartySlot: slot, relationships, metrics, ...(actions ? { actions } : {}) }
}

export function providerDefenseProfileFor(state: WorkbenchState, slot: Slot): AgentSourceProfile | null {
  const agent = state.slots[slot].agentId
  return ['lucia', 'astraYao', 'soukaku', 'lucy', 'nicole', 'panYinhu', 'ben', 'caesar', 'zhao', 'seth', 'sunna'].includes(agent) ? profile(agent as Agent, state, slot) : null
}
