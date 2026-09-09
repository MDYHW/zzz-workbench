import { MIYABI_FROSTBURN_BUILDUP_TARGET, MIYABI_FROSTBURN_REMOVED_BUILDUP_TARGET, actionForm, actionTarget, canonicalAction, sourceLocalAction } from '../../actions'
import { effectiveSubstatChoicesForSlot } from '../../candidates'
import { actionProjection, type AgentSourceProfile, type MetricProjection } from '../../calculation/profile-harness'
import type { ProfileRelationship } from '../../calculation/relationships'
import { selectSource } from '../../calculation/source-instance'
import type { WorkbenchState } from '../../state'
import { CRIT_DAMAGE_FORMULAS, DEF_DAMAGE_FORMULAS, REGULAR_DAMAGE_FORMULAS } from '../../formula-policy'
import { anotherAgentHasSpecialty, anotherAgentSharesAttribute, anotherAgentSharesFaction, caesarAdditionalIsActive, nangongAdditionalIsActive } from '../../party-conditions'
import { DRIVE_DISC_FACTS } from '../discs'
import { W_ENGINES } from '../engines'
import { SOURCE_LABELS, VERTICAL_VALUES } from '../retained-values'
import { defineAgentBaseSource } from '../source-definitions'
import { type AgentSpecialty } from '../types'
import { requireCompleteSelectedSetup, selectedEquipmentRelationships, selectedSetupRelationships, type SelectedSetupObservation } from '../agent-sources/equipment'
import {
  ETHER_VEIL_WELLSPRING_MAX_HP_EFFECT,
  selectedAgentSource,
  selectedCalculationSource,
  selectedMindscapeSource,
} from '../agent-sources/sources'
import { agentBroadPrePenRelationships } from '../agent-broad-pre-pen-relationships'

type Agent = 'lucia' | 'astraYao' | 'soukaku' | 'lucy' | 'nicole' | 'panYinhu' | 'ben' | 'caesar' | 'zhao' | 'seth' | 'sunna' | 'rina'
type Slot = 0 | 1 | 2
const DAMAGE = REGULAR_DAMAGE_FORMULAS
const STUN: readonly AgentSpecialty[] = ['Stun']
const CAESAR_M6 = actionTarget([actionForm('EX Special Attack', 'caesar-overpowered-shield-bash', 'Overpowered Shield Bash'), canonicalAction('Assist Follow-Up')])
const SHIELDED_ULT = actionTarget([actionForm('Ultimate', 'against-shielded-enemy', 'Against a shielded enemy')])
const ZHAO_M4 = actionTarget([canonicalAction('Ultimate'), canonicalAction('Chain Attack'), actionForm('Basic Attack', 'zhao-final-verdict', 'Final Verdict')])
const BEN_EX_ULT = actionTarget([canonicalAction('EX Special Attack'), canonicalAction('Ultimate')])
const BEN_COUNTER = actionTarget([sourceLocalAction('ben-special-ex-block-counter', 'Special/EX Block Counter')])
const BEN_BASIC_DASH_DODGE = actionTarget([canonicalAction('Basic Attack'), canonicalAction('Dash Attack'), canonicalAction('Dodge Counter')])
const BEN_ULT = actionTarget([canonicalAction('Ultimate')])
const SETH_ELECTRIFIED_BASIC = actionTarget([actionForm('Basic Attack', 'seth-electrified', 'Electrified')])
const SETH_DEFENSIVE_ASSIST = actionTarget([sourceLocalAction('seth-defensive-assist', 'Defensive Assist')])
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
  rina: { penRatio: VERTICAL_VALUES.rina.penRatio, energyRegen: VERTICAL_VALUES.rina.baseEnergyRegen },
}
const m = (id: MetricProjection['id'], label: string, unit: string, statId?: MetricProjection['statId'], admission?: MetricProjection['admission'], decimals?: number): MetricProjection => ({ id, label, unit, decimals: decimals ?? (unit === '/s' ? 2 : unit === '%' ? 1 : id === 'impact' ? 2 : 0), ...(statId ? { statId } : { baseValues: { initial: 0, combat: 0, fully: 0 } }), ...(admission ? { admission } : {}) })

function src(agent: Agent, slot: Slot, id: string, label: string, locus: 'core' | 'additional' | 'basic' | 'assist' | 'chain' | 'special' | 'ex-special' | 'ultimate' = 'core') { return selectedAgentSource(agent, slot, id, label, locus) }
function buildPartyOutcomeProfile(agent: Agent, state: WorkbenchState, slot: Slot): AgentSourceProfile {
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
    modifierMetrics: [
      'dmgBonus', 'dazeBonus',
      ...(agent === 'seth'
        ? ['anomalyBuildupBonus', 'anomalyBuildupResReduction'] as const
        : []),
    ],
  }
  const relationships = selectedSetupRelationships(agent, slot, setup, observation)
  relationships.push(...agentBroadPrePenRelationships(state, slot))
  const agentIds = state.slots.map(({ agentId }) => agentId)
  const add = (r: ProfileRelationship) => relationships.push(r)
  const own = (id: string, label: string, locus: 'core' | 'additional' | 'basic' | 'assist' | 'chain' | 'special' | 'ex-special' | 'ultimate' = 'core') => src(agent, slot, id, label, locus)
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
        sourceDetailPresentationId: 'shield-of-firm-resolve',
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
        sourceDetailPresentationId: 'shield-of-firm-resolve',
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
      m('anomalyMastery', 'Anomaly Mastery', '', 'anomalyMastery', undefined, 1),
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
    add({ kind: 'gauge', source: t === 'base' ? own('darkbreaker', SOURCE_LABELS.luciaSheer, 'ex-special') : mind(t === 'm3' ? 3 : 5), basis: { statId: 'maxHp', surface: 'initial' }, basisLabel: 'Initial Max HP', basisPresentationId: 'initial-max-hp', basisCap: VERTICAL_VALUES.lucia.darkbreakerHpCap, metricId: 'maxHp', outputs: [{ presentationId: 'squad-sheer-force', label: 'Squad Sheer Force', unit: '', cap, transform: { basisIncrement: 200, baseOutput: VERTICAL_VALUES.lucia.darkbreakerBase, outputIncrement: VERTICAL_VALUES.lucia.darkbreakerPer200Hp[t], outputCap: cap }, emission: { kind: 'provider', delivery: all, effect: { kind: 'modifier', metricId: 'sheerForce', earliestSurface: 'fully' } } }], sourceDetail: t === 'base' ? 'Darkbreaker' : `M${t === 'm3' ? 3 : 5} tier · Darkbreaker`, sourceDetailPresentationId: t === 'base' ? 'darkbreaker' : `mindscape-${t === 'm3' ? 3 : 5}-darkbreaker` })
    add({ kind: 'provider', source: own('core', SOURCE_LABELS.luciaCore), delivery: all, effect: { kind: 'stat', statId: 'maxHp', region: 'percentage', earliestSurface: 'fully', value: VERTICAL_VALUES.party.wellspringHp, composition: { kind: 'highest-only', semanticEffect: ETHER_VEIL_WELLSPRING_MAX_HP_EFFECT }, sourceDetail: 'Ether Veil: Wellspring', sourceDetailPresentationId: 'ether-veil-wellspring' } }); add({ kind: 'provider', source: own('core', SOURCE_LABELS.luciaCore), delivery: all, effect: { kind: 'modifier', metricId: 'dmgBonus', earliestSurface: 'fully', value: VERTICAL_VALUES.party.luciaCoreDmg, sourceDetail: 'Ether Veil: Wellspring', sourceDetailPresentationId: 'ether-veil-wellspring' } })
    if (anotherAgentHasSpecialty(agentIds, slot, ['Rupture', 'Stun'])) add({ kind: 'provider', source: own('additional', SOURCE_LABELS.luciaAbility, 'additional'), delivery: { ...all, formulas: CRIT_DAMAGE_FORMULAS }, effect: { kind: 'stat', statId: 'critDmg', region: 'flat', earliestSurface: 'fully', value: VERTICAL_VALUES.party.luciaCritDmg } })
    if (setup.mindscape >= 1) add({ kind: 'provider', source: mind(1), delivery: { recipient: 'enemy-context', formulas: DAMAGE }, effect: { kind: 'modifier', metricId: 'resIgnore', earliestSurface: 'fully', value: VERTICAL_VALUES.lucia.mindscapeResIgnore, sourceDetail: "Dreamer's Nursery Rhyme", sourceDetailPresentationId: 'dreamers-nursery-rhyme' } }); if (setup.mindscape >= 2) add({ kind: 'provider', source: mind(2), delivery: all, effect: { kind: 'modifier', metricId: 'sheerDmgBonus', earliestSurface: 'fully', value: VERTICAL_VALUES.lucia.mindscapeSheerDmg, sourceDetail: 'Darkbreaker + Wellspring', sourceDetailPresentationId: 'darkbreaker-and-wellspring' } })
    metrics = [m('maxHp', 'Max HP', '', 'maxHp'), m('energyRegen', 'Energy Regen', '/s', 'energyRegen')]
  } else if (agent === 'astraYao') {
    const coreTier = setup.mindscape >= 2 ? 1 : 0
    const cadenzaTier = setup.mindscape >= 5 ? 2 : setup.mindscape >= 3 ? 1 : 0
    const ratio = VERTICAL_VALUES.astraYao.coreAtkRatioByTier[coreTier]
    const cap = VERTICAL_VALUES.astraYao.coreAtkCapByTier[coreTier]
    const cadenzaLevel = VERTICAL_VALUES.astraYao.cadenzaLevelByTier[cadenzaTier]
    add({ kind: 'gauge', source: own('core', SOURCE_LABELS.astraCore), basis: { statId: 'atk', surface: 'initial' }, basisLabel: 'Initial ATK', basisPresentationId: 'initial-atk', basisCap: cap / (ratio / 100), metricId: 'atk', outputs: [{ presentationId: 'squad-flat-atk', label: 'Squad flat ATK', unit: '', cap, transform: { basisIncrement: 100, outputIncrement: ratio, outputCap: cap }, emission: { kind: 'provider', delivery: { recipient: 'all-party', formulas: DAMAGE }, effect: { kind: 'stat', statId: 'atk', region: 'flat', earliestSurface: 'fully' } } }], ...(coreTier ? { sourceDetail: 'M2 tier', sourceDetailPresentationId: 'mindscape-2-tier' } : {}) })
    const cadenza = own('cadenza', SOURCE_LABELS.astraCadenza, 'special'); add({ kind: 'provider', source: cadenza, delivery: { recipient: 'all-party', formulas: DAMAGE }, effect: { kind: 'modifier', metricId: 'dmgBonus', earliestSurface: 'fully', value: VERTICAL_VALUES.astraYao.cadenzaDmgByTier[cadenzaTier], sourceDetail: `Idyllic Cadenza · level ${cadenzaLevel}`, sourceDetailPresentationId: `idyllic-cadenza-level-${cadenzaLevel}` } }); add({ kind: 'provider', source: cadenza, delivery: { recipient: 'all-party', formulas: CRIT_DAMAGE_FORMULAS }, effect: { kind: 'stat', statId: 'critDmg', region: 'flat', earliestSurface: 'fully', value: VERTICAL_VALUES.astraYao.cadenzaCritDmgByTier[cadenzaTier], sourceDetail: `Idyllic Cadenza · level ${cadenzaLevel}`, sourceDetailPresentationId: `idyllic-cadenza-level-${cadenzaLevel}` } })
    if (setup.mindscape >= 1) add({ kind: 'provider', source: mind(1), delivery: { recipient: 'enemy-context', formulas: DAMAGE }, effect: { kind: 'modifier', metricId: 'resReduction', earliestSurface: 'fully', value: VERTICAL_VALUES.astraYao.mindscapeResReduction, sourceDetail: '3 stacks', sourceDetailPresentationId: '3-stacks' } }); if (setup.mindscape >= 4) add({ kind: 'provider', source: mind(4), delivery: { recipient: 'all-party', specialties: STUN }, effect: { kind: 'operation', presentationId: 'next-quick-assist-daze', label: 'Next Quick Assist Daze', value: VERTICAL_VALUES.astraYao.mindscapeQuickAssistDaze, unit: '%', sourceDetail: 'Next Quick Assist', sourceDetailPresentationId: 'next-quick-assist' } })
    metrics = [m('atk', 'ATK', '', 'atk'), m('energyRegen', 'Energy Regen', '/s', 'energyRegen')]
  } else if (agent === 'soukaku') {
    add({ kind: 'gauge', source: own('core', SOURCE_LABELS.soukakuCore), basis: { statId: 'atk', surface: 'initial' }, basisLabel: 'Initial ATK', basisPresentationId: 'initial-atk', basisCap: VERTICAL_VALUES.soukaku.coreAtkCap, metricId: 'atk', outputs: [{ presentationId: 'focus-flat-atk', label: 'Focus flat ATK', unit: '', cap: VERTICAL_VALUES.soukaku.coreOutputCap, transform: { basisIncrement: 100 / VERTICAL_VALUES.soukaku.coreAtkRatio, outputIncrement: 1, outputCap: VERTICAL_VALUES.soukaku.coreOutputCap }, emission: { kind: 'provider', delivery: { recipient: 'focus' }, effect: { kind: 'stat', statId: 'atk', region: 'flat', earliestSurface: 'fully' } } }] })
    if (anotherAgentSharesAttribute(agentIds, slot) || anotherAgentSharesFaction(agentIds, slot)) add({ kind: 'provider', source: own('additional', SOURCE_LABELS.soukakuAbility, 'additional'), delivery: { recipient: 'all-party', attributes: ['Ice'] }, effect: { kind: 'modifier', metricId: 'dmgBonus', earliestSurface: 'fully', value: VERTICAL_VALUES.soukaku.additionalIceDmg } }); if (setup.mindscape >= 4) add({ kind: 'provider', source: mind(4), delivery: { recipient: 'enemy-context', attributes: ['Ice'] }, effect: { kind: 'modifier', metricId: 'resReduction', earliestSurface: 'fully', value: VERTICAL_VALUES.soukaku.mindscapeIceResReduction } })
    metrics = [m('atk', 'ATK', '', 'atk'), m('energyRegen', 'Energy Regen', '/s', 'energyRegen')]
  } else if (agent === 'lucy') {
    const tier = setup.mindscape >= 5 ? 2 : setup.mindscape >= 3 ? 1 : 0; const ratio = VERTICAL_VALUES.lucy.coreAtkRatioByMindscapeTier[tier]; const base = VERTICAL_VALUES.lucy.coreAtkBaseByMindscapeTier[tier]
    add({ kind: 'gauge', source: tier === 0 ? own('core', SOURCE_LABELS.lucyCore) : mind(tier === 1 ? 3 : 5), basis: { statId: 'atk', surface: 'initial' }, basisLabel: 'Initial ATK', basisPresentationId: 'initial-atk', basisCap: (VERTICAL_VALUES.lucy.coreAtkOutputCap - base) / (ratio / 100), metricId: 'atk', outputs: [{ presentationId: 'squad-flat-atk', label: 'Squad flat ATK', unit: '', cap: VERTICAL_VALUES.lucy.coreAtkOutputCap, transform: { basisIncrement: 100, baseOutput: base, outputIncrement: ratio, outputCap: VERTICAL_VALUES.lucy.coreAtkOutputCap }, emission: { kind: 'provider', delivery: all, effect: { kind: 'stat', statId: 'atk', region: 'flat', earliestSurface: 'fully' } } }], ...(tier === 0 ? { sourceDetail: 'Rebellious Assault', sourceDetailPresentationId: 'rebellious-assault' } : {}) }); if (setup.mindscape >= 4) add({ kind: 'provider', source: mind(4), delivery: { ...all, formulas: CRIT_DAMAGE_FORMULAS }, effect: { kind: 'stat', statId: 'critDmg', region: 'flat', earliestSurface: 'fully', value: VERTICAL_VALUES.lucy.mindscapeSquadCritDmg } })
    metrics = [m('atk', 'ATK', '', 'atk'), m('energyRegen', 'Energy Regen', '/s', 'energyRegen')]
  } else if (agent === 'nicole') {
    if (anotherAgentSharesAttribute(agentIds, slot) || anotherAgentSharesFaction(agentIds, slot)) add({ kind: 'provider', source: own('additional', SOURCE_LABELS.nicoleAbility, 'additional'), delivery: { recipient: 'all-party', attributes: ['Ether'], formulas: DAMAGE }, effect: { kind: 'modifier', metricId: 'dmgBonus', earliestSurface: 'fully', value: VERTICAL_VALUES.nicole.additionalEtherDmg } }); if (setup.mindscape >= 6) add({ kind: 'provider', source: mind(6), delivery: { ...all, formulas: CRIT_DAMAGE_FORMULAS }, effect: { kind: 'stat', statId: 'critRate', region: 'flat', earliestSurface: 'fully', value: VERTICAL_VALUES.nicole.mindscapeSquadCritRate, sourceDetail: '10 stacks', sourceDetailPresentationId: '10-stacks' } })
    metrics = [m('energyRegen', 'Energy Regen', '/s', 'energyRegen')]
  } else if (agent === 'panYinhu') {
    const m6 = setup.mindscape >= 6; const ratio = m6 ? VERTICAL_VALUES.panYinhu.mindscapeCoreAtkRatio : VERTICAL_VALUES.panYinhu.coreAtkRatio; const cap = m6 ? VERTICAL_VALUES.panYinhu.mindscapeCoreSheerCap : VERTICAL_VALUES.panYinhu.coreSheerCap
    add({ kind: 'gauge', source: m6 ? mind(6) : own('core', SOURCE_LABELS.panYinhuCore), basis: { statId: 'atk', surface: 'initial' }, basisLabel: 'Initial ATK', basisPresentationId: 'initial-atk', basisCap: 3000, metricId: 'atk', outputs: [{ presentationId: 'focus-sheer-force', label: 'Focus Sheer Force', unit: '', cap, transform: { basisIncrement: 100, outputIncrement: ratio, outputCap: cap }, emission: { kind: 'provider', delivery: { recipient: 'focus', formulas: ['sheer_damage'] }, effect: { kind: 'modifier', metricId: 'sheerForce', earliestSurface: 'fully' } } }] })
    if (anotherAgentHasSpecialty(agentIds, slot, ['Rupture']) || anotherAgentSharesFaction(agentIds, slot)) { add({ kind: 'provider', source: own('additional', SOURCE_LABELS.panYinhuAbility, 'additional'), delivery: { recipient: 'enemy-context', formulas: DAMAGE }, effect: { kind: 'modifier', metricId: 'dmgBonus', earliestSurface: 'fully', value: VERTICAL_VALUES.panYinhu.additionalDmg } }); if (setup.mindscape >= 1) add({ kind: 'provider', source: mind(1), delivery: { recipient: 'enemy-context', formulas: DAMAGE }, effect: { kind: 'modifier', metricId: 'dmgBonus', earliestSurface: 'fully', value: VERTICAL_VALUES.panYinhu.mindscapeAdditionalDmg } }) }
    metrics = [m('atk', 'ATK', '', 'atk'), { ...m('impact', 'Impact', '', 'impact'), decimals: 1 }, m('energyRegen', 'Energy Regen', '/s', 'energyRegen'), m('dazeBonus', 'Daze Bonus', '%', undefined, 'nonzero-or-action')]
  } else if (agent === 'ben') {
    add({ kind: 'linear', source: own('core', SOURCE_LABELS.benCore), basis: { statId: 'def', surface: 'initial' }, outputs: [{ transform: { basisIncrement: 1, outputIncrement: VERTICAL_VALUES.ben.coreDefToAtk / 100 }, emission: { kind: 'stat', statId: 'atk', region: 'flat', earliestSurface: 'combat' } }] }); if (anotherAgentSharesAttribute(agentIds, slot) || anotherAgentSharesFaction(agentIds, slot)) add({ kind: 'provider', source: own('additional', SOURCE_LABELS.benAbility, 'additional'), delivery: { recipient: 'all-party', formulas: CRIT_DAMAGE_FORMULAS }, effect: { kind: 'stat', statId: 'critRate', region: 'flat', earliestSurface: 'fully', value: VERTICAL_VALUES.ben.additionalCritRate } }); if (setup.mindscape >= 4) add({ kind: 'modifier', atom: { metricId: 'dmgBonus', earliestSurface: 'fully', value: VERTICAL_VALUES.ben.mindscapeCounterDmg, source: mind(4), action: BEN_COUNTER, sourceDetail: 'Invulnerable block counter', sourceDetailPresentationId: 'invulnerable-block-counter' } }); if (setup.mindscape >= 6) add({ kind: 'modifier', atom: { metricId: 'dazeBonus', earliestSurface: 'fully', value: VERTICAL_VALUES.ben.mindscapeDaze, source: mind(6), action: BEN_BASIC_DASH_DODGE, sourceDetail: 'After EX Special or follow-up', sourceDetailPresentationId: 'after-ex-special-or-follow-up' } })
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
    const impact = VERTICAL_VALUES.caesar.coreImpactByTier; const daze = VERTICAL_VALUES.caesar.ultimateDazeByTier; add({ kind: 'stat', atom: { statId: 'impact', region: 'percentage', earliestSurface: 'fully', value: impact[0], source: own('special', 'Special Attack', 'special'), sourceDetail: 'After Perfect Block, Retaliation, or Defensive Assist', sourceDetailPresentationId: 'after-perfect-block-retaliation-or-defensive-assist' } }); if (setup.mindscape >= 3) add({ kind: 'stat', atom: { statId: 'impact', region: 'percentage', earliestSurface: 'fully', value: impact[1] - impact[0], source: mind(3), sourceDetail: 'Special Attack skill level +2', sourceDetailPresentationId: 'special-attack-skill-level-plus-2' } }); if (setup.mindscape >= 5) add({ kind: 'stat', atom: { statId: 'impact', region: 'percentage', earliestSurface: 'fully', value: impact[2] - impact[1], source: mind(5), sourceDetail: 'Special Attack skill level +2', sourceDetailPresentationId: 'special-attack-skill-level-plus-2' } })
    add({ kind: 'provider', source: setup.mindscape >= 2 ? mind(2) : own('core', SOURCE_LABELS.caesarCore), delivery: { recipient: 'focus' }, effect: { kind: 'stat', statId: 'atk', region: 'flat', earliestSurface: 'fully', value: setup.mindscape >= 2 ? VERTICAL_VALUES.caesar.mindscapeFocusAtk : VERTICAL_VALUES.caesar.coreFocusAtk, ...(setup.mindscape >= 2 ? { sourceDetail: 'Radiant Aegis ATK replacement', sourceDetailPresentationId: 'radiant-aegis-atk-replacement' } : {}) } }); if (caesarAdditionalIsActive(agentIds, slot)) add({ kind: 'provider', source: own('additional', SOURCE_LABELS.caesarAbility, 'additional'), delivery: { recipient: 'enemy-context' }, effect: { kind: 'modifier', metricId: 'dmgBonus', earliestSurface: 'fully', value: VERTICAL_VALUES.caesar.additionalDmgBonus } }); if (setup.mindscape >= 1) add({ kind: 'provider', source: mind(1), delivery: { recipient: 'enemy-context', formulas: DAMAGE }, effect: { kind: 'modifier', metricId: 'resReduction', earliestSurface: 'fully', value: VERTICAL_VALUES.caesar.mindscapeResReduction, sourceDetail: 'While Radiant Aegis is active', sourceDetailPresentationId: 'while-radiant-aegis-active' } })
    add({ kind: 'modifier', atom: { metricId: 'dazeBonus', earliestSurface: 'fully', value: daze[0], source: own('ultimate', 'Ultimate', 'ultimate'), action: SHIELDED_ULT, sourceDetail: 'Against a shielded enemy', sourceDetailPresentationId: 'against-shielded-enemy' } }); if (setup.mindscape >= 3) add({ kind: 'modifier', atom: { metricId: 'dazeBonus', earliestSurface: 'fully', value: daze[1] - daze[0], source: mind(3), action: SHIELDED_ULT, sourceDetail: 'Ultimate skill level +2', sourceDetailPresentationId: 'ultimate-skill-level-plus-2' } }); if (setup.mindscape >= 5) add({ kind: 'modifier', atom: { metricId: 'dazeBonus', earliestSurface: 'fully', value: daze[2] - daze[1], source: mind(5), action: SHIELDED_ULT, sourceDetail: 'Ultimate skill level +2', sourceDetailPresentationId: 'ultimate-skill-level-plus-2' } })
    if (setup.mindscape >= 6) { add({ kind: 'stat', atom: { statId: 'critRate', region: 'flat', earliestSurface: 'fully', value: VERTICAL_VALUES.caesar.mindscapeCritRate, source: mind(6) } }); add({ kind: 'stat', atom: { statId: 'critDmg', region: 'flat', earliestSurface: 'fully', value: VERTICAL_VALUES.caesar.mindscapeCritDmg, source: mind(6) } }); add({ kind: 'modifier', atom: { metricId: 'critRate', earliestSurface: 'fully', value: VERTICAL_VALUES.caesar.mindscapeActionCritRate, source: mind(6), action: CAESAR_M6, sourceDetail: 'Guaranteed CRIT', sourceDetailPresentationId: 'guaranteed-crit' } }); add({ kind: 'modifier', atom: { metricId: 'dmgBonus', earliestSurface: 'fully', value: VERTICAL_VALUES.caesar.mindscapeActionDmg, source: mind(6), action: CAESAR_M6 } }) }
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
    add({ kind: 'stat', atom: { statId: 'maxHp', region: 'percentage', earliestSurface: 'initial', value: VERTICAL_VALUES.zhao.coreHp, source: core } }); add({ kind: 'linear', source: core, basis: { statId: 'maxHp', surface: 'initial' }, outputs: [{ transform: { basisIncrement: 1000, outputIncrement: VERTICAL_VALUES.zhao.coreCritRatePer1000Hp }, emission: { kind: 'stat', statId: 'critRate', region: 'flat', earliestSurface: 'initial' } }] }); if (setup.mindscape >= 6) add({ kind: 'linear', source: mind(6), basis: { statId: 'maxHp', surface: 'initial' }, outputs: [{ transform: { basisIncrement: 1000, outputIncrement: VERTICAL_VALUES.zhao.coreCritRatePer1000Hp * (VERTICAL_VALUES.zhao.mindscapeCoreCritRateMultiplier - 1) }, emission: { kind: 'stat', statId: 'critRate', region: 'flat', earliestSurface: 'initial', sourceDetail: 'Core CRIT Rate increase', sourceDetailPresentationId: 'core-crit-rate-increase' } }] })
    add({ kind: 'provider', source: core, delivery: all, effect: { kind: 'stat', statId: 'maxHp', region: 'percentage', earliestSurface: 'fully', value: VERTICAL_VALUES.zhao.wellspringHp, composition: { kind: 'highest-only', semanticEffect: ETHER_VEIL_WELLSPRING_MAX_HP_EFFECT }, sourceDetail: 'Ether Veil: Wellspring', sourceDetailPresentationId: 'ether-veil-wellspring' } }); add({ kind: 'provider', source: core, delivery: all, effect: { kind: 'stat', statId: 'atk', region: 'flat', earliestSurface: 'fully', value: VERTICAL_VALUES.zhao.wellspringAtk, sourceDetail: 'Ether Veil: Wellspring', sourceDetailPresentationId: 'ether-veil-wellspring' } })
    if (anotherAgentHasSpecialty(agentIds, slot, ['Attack', 'Anomaly', 'Support'])) add({ kind: 'gauge', source: own('additional', SOURCE_LABELS.zhaoAbility, 'additional'), basis: { statId: 'maxHp', surface: 'initial' }, basisLabel: 'Initial Max HP', basisPresentationId: 'initial-max-hp', basisThreshold: VERTICAL_VALUES.zhao.additionalHpThreshold, basisCap: VERTICAL_VALUES.zhao.additionalHpCap, metricId: 'maxHp', outputs: [{ presentationId: 'squad-dmg-bonus', label: 'Squad DMG Bonus', unit: '%', cap: VERTICAL_VALUES.zhao.additionalDmgCap, transform: { basisThreshold: VERTICAL_VALUES.zhao.additionalHpThreshold, basisIncrement: VERTICAL_VALUES.zhao.additionalHpIncrement, baseOutput: VERTICAL_VALUES.zhao.additionalDmg, outputIncrement: VERTICAL_VALUES.zhao.additionalDmgPerIncrement, outputCap: VERTICAL_VALUES.zhao.additionalDmgCap }, emission: { kind: 'provider', delivery: { recipient: 'all-party', formulas: DAMAGE }, effect: { kind: 'modifier', metricId: 'dmgBonus', earliestSurface: 'fully' } } }] })
    if (setup.mindscape >= 1) add({ kind: 'provider', source: mind(1), delivery: { recipient: 'enemy-context', formulas: DAMAGE }, effect: { kind: 'modifier', metricId: 'resIgnore', earliestSurface: 'fully', value: VERTICAL_VALUES.zhao.mindscapeResIgnore, sourceDetail: 'All-Attribute RES Ignore', sourceDetailPresentationId: 'all-attribute-res-ignore' } }); if (setup.mindscape >= 2) add({ kind: 'provider', source: mind(2), delivery: { recipient: 'other-party' }, effect: { kind: 'stat', statId: 'atk', region: 'percentage', earliestSurface: 'fully', value: VERTICAL_VALUES.zhao.mindscapeOtherAtk, sourceDetail: 'Reachable healing condition', sourceDetailPresentationId: 'reachable-healing-condition' } }); if (setup.mindscape >= 4) add({ kind: 'modifier', atom: { metricId: 'critDmg', earliestSurface: 'fully', value: VERTICAL_VALUES.zhao.mindscapeActionCritDmg, source: mind(4), action: ZHAO_M4 } })
    add({ kind: 'operation', atom: { presentationId: 'final-verdict-max-hp', label: 'Basic Attack: Final Verdict maximum-charge Max HP', value: setup.mindscape >= 6 ? VERTICAL_VALUES.zhao.mindscapeFinalVerdictMaxHp : VERTICAL_VALUES.zhao.finalVerdictMaxHp, unit: '%', source: setup.mindscape >= 6 ? mind(6) : own('finalVerdict', SOURCE_LABELS.zhaoBasic, 'basic'), sourceDetail: 'Final Verdict · Maximum charge', sourceDetailPresentationId: 'final-verdict-maximum-charge' } })
    const critCap = { value: 100, source: calculation('crit-rate-cap', 'Displayed CRIT Rate cap') }
    metrics = [m('maxHp', 'Max HP', '', 'maxHp'), { ...m('critRate', 'CRIT Rate', '%', 'critRate'), cap: critCap }, ...(setup.mindscape >= 4 ? [m('critDmg', 'CRIT DMG', '%', 'critDmg')] : []), m('energyRegen', 'Energy Regen', '/s', 'energyRegen')]; actions = setup.mindscape >= 4 ? [actionProjection('critDmg', 'zhaoM4CritDmg', ZHAO_M4)] : undefined
  } else if (agent === 'sunna') {
    const core = own('core', SOURCE_LABELS.sunnaCore)
    const ability = own('additional', SOURCE_LABELS.sunnaAbility, 'additional')
    const exSpecial = own('ex-special', 'EX Special Attack', 'ex-special')
    add({ kind: 'stat', atom: { statId: 'atk', region: 'percentage', earliestSurface: 'initial', value: VERTICAL_VALUES.sunna.initialAtk, source: core } })
    add({
      kind: 'gauge', source: core,
      basis: { statId: 'atk', surface: 'initial' }, basisLabel: 'Initial ATK', basisPresentationId: 'initial-atk',
      basisCap: VERTICAL_VALUES.sunna.coreAtkCapBasis, metricId: 'atk',
      outputs: [{
        presentationId: 'squad-flat-atk', label: 'Squad flat ATK', unit: '', cap: VERTICAL_VALUES.sunna.coreAtkCap,
        transform: { basisIncrement: 1, outputIncrement: VERTICAL_VALUES.sunna.coreAtkRatio / 100, outputCap: VERTICAL_VALUES.sunna.coreAtkCap },
        emission: { kind: 'provider', delivery: { recipient: 'all-party', formulas: DAMAGE }, effect: { kind: 'stat', statId: 'atk', region: 'flat', earliestSurface: 'fully' } },
      }],
    })
    add({ kind: 'provider', source: exSpecial, delivery: { recipient: 'all-party', formulas: DAMAGE }, effect: { kind: 'stat', statId: 'atk', region: 'flat', earliestSurface: 'fully', value: VERTICAL_VALUES.sunna.exSpecialAtk } })
    const additionalActive = anotherAgentHasSpecialty(agentIds, slot, ['Attack']) || anotherAgentSharesFaction(agentIds, slot)
    if (additionalActive) add({ kind: 'provider', source: ability, delivery: { recipient: 'enemy-context', formulas: DAMAGE }, effect: { kind: 'modifier', metricId: 'stunDmgMultiplier', earliestSurface: 'fully', value: VERTICAL_VALUES.sunna.additionalStunMultiplier } })
    if (setup.mindscape >= 2) add({ kind: 'provider', source: mind(2), delivery: { recipient: 'all-party', formulas: DAMAGE }, effect: { kind: 'stat', statId: 'atk', region: 'percentage', earliestSurface: 'fully', value: VERTICAL_VALUES.sunna.mindscape2Atk } })
    if (setup.mindscape >= 4) add({ kind: 'provider', source: mind(4), delivery: { recipient: 'all-party', formulas: DAMAGE }, effect: { kind: 'modifier', metricId: 'dmgBonus', earliestSurface: 'fully', value: VERTICAL_VALUES.sunna.mindscape4Dmg } })
    metrics = [
      m('atk', 'ATK', '', 'atk'),
      m('energyRegen', 'Energy Regen', '/s', 'energyRegen'),
    ]
  } else {
    const values = VERTICAL_VALUES.rina
    const qualified = anotherAgentSharesAttribute(agentIds, slot) || anotherAgentSharesFaction(agentIds, slot)
    const m1 = setup.mindscape >= 1
    const coreRatio = m1 ? values.mindscapeCorePenRatio : values.corePenRatio
    const coreBase = m1 ? values.mindscapeCorePenBase : values.corePenBase
    const coreCap = m1 ? values.mindscapeCorePenCap : values.corePenCap
    const coreSource = m1 ? mind(1) : own('core', SOURCE_LABELS.rinaCore)
    const potential = selectedAgentSource(agent, slot, 'potential', 'Potential Awakening', 'identity')
    add({ kind: 'stat', atom: { statId: 'penRatio', region: 'flat', earliestSurface: 'initial', value: values.potentialPenRatio, source: potential } })
    add({ kind: 'gauge', source: coreSource, basis: { statId: 'penRatio', surface: 'initial' }, basisLabel: 'Initial PEN Ratio', basisPresentationId: 'initial-pen-ratio', basisCap: (coreCap - coreBase) / (coreRatio / 100), metricId: 'penRatio', outputs: [{ presentationId: 'other-party-pen-ratio', label: 'Other-party PEN Ratio', unit: '%', cap: coreCap, transform: { basisIncrement: 1, baseOutput: coreBase, outputIncrement: coreRatio / 100, outputCap: coreCap }, emission: { kind: 'provider', delivery: { recipient: 'other-party', formulas: DEF_DAMAGE_FORMULAS }, effect: { kind: 'stat', statId: 'penRatio', region: 'flat', earliestSurface: 'fully' } } }] })
    add({ kind: 'gauge', source: potential, basis: { statId: 'penRatio', surface: 'initial' }, basisLabel: 'Initial PEN Ratio', basisPresentationId: 'initial-pen-ratio', basisCap: values.potentialAtkCap / values.potentialAtkPerPen, metricId: 'penRatio', outputs: [{ presentationId: 'squad-flat-atk', label: 'Squad flat ATK', unit: '', cap: values.potentialAtkCap, transform: { basisIncrement: 1, outputIncrement: values.potentialAtkPerPen, outputCap: values.potentialAtkCap }, emission: { kind: 'provider', delivery: { recipient: 'all-party', formulas: DAMAGE }, effect: { kind: 'stat', statId: 'atk', region: 'flat', earliestSurface: 'fully' } } }] })
    if (qualified) {
      add({ kind: 'provider', source: own('additional', SOURCE_LABELS.rinaAbility, 'additional'), delivery: { recipient: 'all-party', attributes: ['Electric'], formulas: DAMAGE }, effect: { kind: 'modifier', metricId: 'dmgBonus', earliestSurface: 'fully', value: values.additionalElectricDmg, sourceDetail: 'Against Shocked enemies', sourceDetailPresentationId: 'against-shocked-enemies' } })
      add({ kind: 'operation', atom: { presentationId: 'shock-duration', label: 'Shock duration', value: values.additionalShockDuration, unit: 's', source: own('additional', SOURCE_LABELS.rinaAbility, 'additional') } })
    }
    if (setup.mindscape >= 4) add({ kind: 'automatic-energy', atom: { earliestSurface: 'combat', value: values.mindscapeEnergyRegen, source: mind(4) } })
    if (setup.mindscape >= 6) add({ kind: 'provider', source: mind(6), delivery: { recipient: 'all-party', attributes: ['Electric'], formulas: DAMAGE }, effect: { kind: 'modifier', metricId: 'dmgBonus', earliestSurface: 'fully', value: values.mindscapeElectricDmg } })
    metrics = [m('penRatio', 'PEN Ratio', '%', 'penRatio'), m('energyRegen', 'Energy Regen', '/s', 'energyRegen')]
  }
  const nangongSlot = agentIds.indexOf('nangongYu')
  if (
    agent === 'seth'
    && nangongSlot >= 0
    && nangongSlot !== slot
    && nangongAdditionalIsActive(agentIds, nangongSlot)
  ) {
    actions = [
      ...(actions ?? []),
      actionProjection('anomalyBuildupBonus', 'chainAttackAnomalyBuildup', NANGONG_CHAIN),
    ]
  }
  const miyabiSlot = agentIds.indexOf('miyabi')
  if (agent === 'seth' && miyabiSlot >= 0 && miyabiSlot !== slot) {
    actions = [
      ...(actions ?? []),
      actionProjection('anomalyBuildupBonus', 'miyabiFrostburnBuildup', MIYABI_FROSTBURN_BUILDUP_TARGET),
      ...(state.slots[miyabiSlot].setup.mindscape >= 1
        ? [actionProjection('anomalyBuildupBonus', 'miyabiFrostburnRemovedBuildup', MIYABI_FROSTBURN_REMOVED_BUILDUP_TARGET)]
        : []),
    ]
  }
  relationships.push(...selectedEquipmentRelationships(agent, slot, setup, {
    observation,
    focusAgentId: state.slots[state.focusSlot].agentId,
    partyAgentIds: agentIds,
  }))
  return { agentId: agent, appliedPartySlot: slot, relationships, metrics, ...(actions ? { actions } : {}) }
}

export function partyOutcomeProfileFor(
  agent: Agent,
  state: WorkbenchState,
  slot: Slot,
): AgentSourceProfile {
  return buildPartyOutcomeProfile(agent, state, slot)
}
