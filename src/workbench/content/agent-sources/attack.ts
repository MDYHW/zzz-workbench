import { AFTERSHOCK_TARGET, actionForm, actionTarget, canonicalAction, sourceLocalAction, type ActionTarget, type CanonicalActionKind } from '../../actions'
import { effectiveSubstatChoicesForSlot } from '../../candidates'
import { actionProjection, type ActionProjection, type AgentSourceProfile, type MetricProjection } from '../../calculation/profile-harness'
import type { ActionScopeNode } from '../../calculation/composition'
import { CRIT_DAMAGE_FORMULAS, REGULAR_DAMAGE_FORMULAS } from '../../formula-policy'
import type { ProfileRelationship } from '../../calculation/relationships'
import type { WorkbenchState } from '../../state'
import { anotherAgentHasSpecialty, anotherAgentSharesAttribute, anotherAgentSharesFaction, soldier11AdditionalIsActive, zhuYuanAdditionalIsActive, harumasaAdditionalIsActive, nekomataAdditionalIsActive, billyAdditionalIsActive } from '../../party-conditions'
import { resolveSeedVanguardForState } from '../../candidate-context'
import { ADMITTED_AGENTS } from '../agents'
import { SOURCE_LABELS, VERTICAL_VALUES } from '../retained-values'
import { type AgentId } from '../types'
import type { EffectMetric, SurfaceKey } from '../../effects'
import type { StatId, StatRegion } from '../../calculation/stat-composer'
import { requireCompleteSelectedSetup, selectedEquipmentRelationships, selectedSetupRelationships, type SelectedSetupObservation } from './equipment'
import { selectedAgentSource, selectedCalculationSource, selectedMindscapeSource } from './sources'

type Agent = 'anbySoldier0' | 'seed' | 'cissia' | 'evelyn' | 'corin' | 'hugo' | 'ellen' | 'soldier11' | 'zhuYuan' | 'orphie' | 'harumasa' | 'nekomata' | 'billy' | 'yeShunguang'
type Slot = 0 | 1 | 2
type CalculationContext = { targetStunDmgMultiplier?: number }
const BASE: Record<Agent, SelectedSetupObservation['baseStats']> = {
  anbySoldier0: { atk: VERTICAL_VALUES.anbySoldier0.atk, critRate: VERTICAL_VALUES.anbySoldier0.critRate, critDmg: VERTICAL_VALUES.anbySoldier0.critDmg }, seed: { atk: VERTICAL_VALUES.seed.atk, critRate: VERTICAL_VALUES.seed.critRate, critDmg: VERTICAL_VALUES.seed.critDmg },
  cissia: { atk: VERTICAL_VALUES.cissia.atk, critRate: VERTICAL_VALUES.cissia.critRate, critDmg: VERTICAL_VALUES.cissia.critDmg, energyRegen: VERTICAL_VALUES.cissia.baseEnergyRegen },
  evelyn: { atk: VERTICAL_VALUES.evelyn.atk, critRate: VERTICAL_VALUES.evelyn.critRate, critDmg: VERTICAL_VALUES.evelyn.critDmg }, corin: { atk: VERTICAL_VALUES.corin.atk, critRate: VERTICAL_VALUES.corin.critRate, critDmg: VERTICAL_VALUES.corin.critDmg, energyRegen: VERTICAL_VALUES.corin.baseEnergyRegen },
  hugo: { atk: VERTICAL_VALUES.hugo.atk, critRate: VERTICAL_VALUES.hugo.critRate, critDmg: VERTICAL_VALUES.hugo.critDmg }, ellen: { atk: VERTICAL_VALUES.ellen.atk, critRate: VERTICAL_VALUES.ellen.critRate, critDmg: VERTICAL_VALUES.ellen.critDmg },
  soldier11: { atk: VERTICAL_VALUES.soldier11.atk, critRate: VERTICAL_VALUES.soldier11.critRate, critDmg: VERTICAL_VALUES.soldier11.critDmg }, zhuYuan: { atk: VERTICAL_VALUES.zhuYuan.atk, critRate: VERTICAL_VALUES.zhuYuan.critRate, critDmg: VERTICAL_VALUES.zhuYuan.critDmg }, orphie: { atk: VERTICAL_VALUES.orphie.atk, critRate: VERTICAL_VALUES.orphie.critRate, critDmg: VERTICAL_VALUES.orphie.critDmg, energyRegen: VERTICAL_VALUES.orphie.baseEnergyRegen },
  harumasa: { atk: VERTICAL_VALUES.harumasa.atk, critRate: VERTICAL_VALUES.harumasa.critRate, critDmg: VERTICAL_VALUES.harumasa.critDmg }, nekomata: { atk: VERTICAL_VALUES.nekomata.atk, critRate: VERTICAL_VALUES.nekomata.critRate, critDmg: VERTICAL_VALUES.nekomata.critDmg, energyRegen: VERTICAL_VALUES.nekomata.baseEnergyRegen },
  billy: { atk: VERTICAL_VALUES.billy.atk, critRate: VERTICAL_VALUES.billy.critRate, critDmg: VERTICAL_VALUES.billy.critDmg }, yeShunguang: { atk: VERTICAL_VALUES.yeShunguang.atk, critRate: VERTICAL_VALUES.yeShunguang.critRate, critDmg: VERTICAL_VALUES.yeShunguang.critDmg },
}
const A = (name: CanonicalActionKind, form?: string) => form ? actionForm(name, form) : canonicalAction(name)
const BASIC_ULT = actionTarget([A('Basic Attack'), A('Ultimate')])
const BASIC_DASH = actionTarget([A('Basic Attack'), A('Dash Attack')])
const ELLEN_CORE = actionTarget([
  sourceLocalAction('Charged Arctic Ambush'),
  sourceLocalAction('Flash Freeze Basic'),
  sourceLocalAction('Icy Blade'),
  sourceLocalAction('Glacial Blade Wave'),
  A('Chain Attack'), A('Ultimate'),
])
const BASIC = actionTarget([A('Basic Attack')])
const DASH = actionTarget([A('Dash Attack')])
const DODGE = actionTarget([A('Dodge Counter')])
const EX = actionTarget([A('EX Special Attack')])
const CHAIN = actionTarget([A('Chain Attack')])
const ULT = actionTarget([A('Ultimate')])
const CHAIN_ULT = actionTarget([A('Chain Attack'), A('Ultimate')])
const BACK = actionTarget([sourceLocalAction('Back attacks')])
const SEED_SLAUGHTER = actionTarget([actionForm('Basic Attack', 'Falling Petals - Slaughter')])
const SEED_DOWNFALL = actionTarget([actionForm('Basic Attack', 'Falling Petals - Downfall')])
const SEED_BASIC = actionTarget([...SEED_SLAUGHTER.outcomes, ...SEED_DOWNFALL.outcomes])
const SEED_ACTIONS = actionTarget([...SEED_BASIC.outcomes, ...ULT.outcomes])
const CISSIA_CORRODE = actionTarget([sourceLocalAction('Corrode Bone')])
const CISSIA_SERPENT = actionTarget([actionForm('Basic Attack', "Serpent's Kiss")])
const CISSIA_BASIC = actionTarget([...CISSIA_CORRODE.outcomes, ...CISSIA_SERPENT.outcomes])
const CORIN_CHAINSAW = actionTarget([sourceLocalAction('Extended chainsaw actions')])
const CORIN_BASIC_ULT = actionTarget([A('Basic Attack'), A('Ultimate')])
const HUGO_TOTALIZE = actionTarget([sourceLocalAction('Totalize')])
const FIRE_SUPPRESSION_BASIC = actionTarget([sourceLocalAction('Fire Suppression Basic Attack')])
const FIRE_SUPPRESSION_DASH = actionTarget([sourceLocalAction('Fire Suppression Dash Attack')])
const STUNNED = actionTarget([sourceLocalAction('Against Stunned enemies')])
const ZHU_ENHANCED_BASIC = actionTarget([sourceLocalAction('Enhanced Shotshell Basic Attack')])
const ZHU_ENHANCED_DASH = actionTarget([sourceLocalAction('Enhanced Shotshell Dash Attack')])
const ZHU_STUNNED_BASIC = actionTarget([sourceLocalAction('Enhanced Shotshell Basic Attack against Stunned enemies')])
const ZHU_STUNNED_DASH = actionTarget([sourceLocalAction('Enhanced Shotshell Dash Attack against Stunned enemies')])
const ORPHIE_SPECIAL_EX_CHAIN_ULT = actionTarget([A('Special Attack'), A('EX Special Attack'), A('Chain Attack'), A('Ultimate')])
const ORPHIE_HEAT_ULT = actionTarget([sourceLocalAction('Heat Charge'), A('Ultimate')])
const HARUMASA_SLASH_OUTCOME = sourceLocalAction('Dash Attack: Hiten no Tsuru - Slash')
const HARUMASA_CHASING_OUTCOME = sourceLocalAction('Chasing Thunder')
const HARUMASA_SLASH = actionTarget([HARUMASA_SLASH_OUTCOME])
const HARUMASA_CORE = actionTarget([HARUMASA_SLASH_OUTCOME, HARUMASA_CHASING_OUTCOME, A('Ultimate')])
const HARUMASA_DASH_CHASING = actionTarget([HARUMASA_SLASH_OUTCOME, HARUMASA_CHASING_OUTCOME])
const NEKOMATA_EX_DODGE = actionTarget([A('EX Special Attack'), A('Dodge Counter')])
const BILLY_CROUCHING = actionTarget([A('Basic Attack'), A('Dash Attack'), A('Dodge Counter'), A('Special Attack'), A('EX Special Attack'), A('Ultimate')])
const YE_EX = actionTarget([sourceLocalAction('EX Special Attack: Enlightened Mind - Soaring Light')])
const YE_ULT = actionTarget([sourceLocalAction('Ultimate: Cleaving Heavens')])
const YE_M2 = actionTarget([...YE_EX.outcomes, ...YE_ULT.outcomes])
const src = (agent: Agent, slot: Slot, id: string, label: string, locus: 'identity' | 'core' | 'additional' | 'special' | 'ex-special' = 'core') => selectedAgentSource(agent, slot, id, label, locus)
const m = (id: EffectMetric, label: string, unit = '', statId?: MetricProjection['statId'], admission?: MetricProjection['admission']): MetricProjection => ({ id, label, unit, decimals: unit === '/s' ? 2 : unit === '%' ? 1 : 0, ...(statId ? { statId } : { baseValues: { initial: 0, combat: 0, fully: 0 } }), ...(admission ? { admission } : {}) })
function stat(source: ReturnType<typeof selectedAgentSource>, statId: StatId, value: number, region: Exclude<StatRegion, 'base'> = 'flat', earliestSurface: SurfaceKey = 'fully', detail?: string): ProfileRelationship { return { kind: 'stat', atom: { statId, region, value, earliestSurface, source, ...(detail ? { sourceDetail: detail } : {}) } } }
function mod(source: ReturnType<typeof selectedAgentSource>, metricId: EffectMetric, value: number, action?: ActionTarget, earliestSurface: SurfaceKey = 'fully', detail?: string): ProfileRelationship { return { kind: 'modifier', atom: { metricId, value, earliestSurface, source, ...(action ? { action } : {}), ...(detail ? { sourceDetail: detail } : {}) } } }
function operation(source: ReturnType<typeof selectedAgentSource>, label: string, value: number, unit = '%', earliestSurface: 'combat' | 'fully' = 'fully', presentation?: 'scale'): ProfileRelationship { return { kind: 'operation', atom: { label, earliestSurface, value, unit, source, ...(presentation ? { presentation } : {}) } } }

function partyQualification(agent: Agent, ids: readonly AgentId[], slot: Slot): boolean {
  switch (agent) {
    case 'anbySoldier0': return anotherAgentHasSpecialty(ids, slot, ['Stun', 'Support'])
    case 'seed': return false
    case 'cissia': return anotherAgentHasSpecialty(ids, slot, ['Stun']) || anotherAgentSharesAttribute(ids, slot)
    case 'evelyn': return anotherAgentHasSpecialty(ids, slot, ['Stun', 'Support'])
    case 'corin': return anotherAgentSharesAttribute(ids, slot) || anotherAgentSharesFaction(ids, slot)
    case 'hugo': return anotherAgentHasSpecialty(ids, slot, ['Stun']) || anotherAgentSharesAttribute(ids, slot)
    case 'ellen': return anotherAgentHasSpecialty(ids, slot, ['Stun']) || anotherAgentSharesAttribute(ids, slot) || anotherAgentSharesFaction(ids, slot)
    case 'soldier11': return soldier11AdditionalIsActive(ids, slot)
    case 'zhuYuan': return zhuYuanAdditionalIsActive(ids, slot)
    case 'orphie': return anotherAgentHasSpecialty(ids, slot, ['Stun', 'Support'])
    case 'harumasa': return harumasaAdditionalIsActive(ids, slot)
    case 'nekomata': return nekomataAdditionalIsActive(ids, slot)
    case 'billy': return billyAdditionalIsActive(ids, slot)
    case 'yeShunguang': return anotherAgentHasSpecialty(ids, slot, ['Support', 'Stun'])
  }
}

function profile(agent: Agent, state: WorkbenchState, slot: Slot, calculationContext: CalculationContext): AgentSourceProfile {
  const setup = { ...requireCompleteSelectedSetup(state.slots[slot].setup), mindscape: state.slots[slot].setup.mindscape }
  const ids = state.slots.map(({ agentId }) => agentId); const qualified = agent === 'seed' ? resolveSeedVanguardForState(state) !== null : partyQualification(agent, ids, slot)
  const baseStats = { ...BASE[agent], penRatio: 0 }; const observation: SelectedSetupObservation = { baseStats, effectiveSubstats: effectiveSubstatChoicesForSlot(state, slot), modifierMetrics: ['dmgBonus', 'defIgnore', 'defReduction', 'resIgnore', 'resReduction', 'stunDmgMultiplier', 'dazeBonus'] }
  const relationships = selectedSetupRelationships(agent, slot, setup, observation); const add = (r: ProfileRelationship) => relationships.push(r); const core = src(agent, slot, 'core', SOURCE_LABELS[`${agent}Core` as keyof typeof SOURCE_LABELS] ?? 'Core Passive'); const ability = src(agent, slot, 'ability', SOURCE_LABELS[`${agent}Ability` as keyof typeof SOURCE_LABELS] ?? 'Additional Ability', 'additional'); const mind = (tier: 1|2|3|4|5|6) => selectedMindscapeSource(agent, slot, setup.mindscape, tier); const all = { recipient: 'all-party' as const }; const enemy = { recipient: 'enemy-context' as const }
  const actions: ActionProjection[] = []; const basicUlt = BASIC_ULT
  const addMetric = (metric: EffectMetric, value: number, source = core, action?: ActionTarget, surface: 'combat'|'fully' = 'fully') => {
    if (!value) return
    add(
      !action && (metric === 'critRate' || metric === 'critDmg' || metric === 'penRatio')
        ? stat(source, metric, value, 'flat', surface)
        : mod(source, metric, value, action, surface),
    )
  }
  const addAtk = (value: number, source = core, surface: 'initial'|'combat'|'fully' = 'fully') => { if (value) add(stat(source, 'atk', value, 'percentage', surface)) }
  switch (agent) {
    case 'anbySoldier0':
      addMetric('dmgBonus', VERTICAL_VALUES.anbySoldier0.coreDmg, core)
      addMetric('critRate', qualified ? VERTICAL_VALUES.anbySoldier0.additionalCritRate : 0, ability)
      if (setup.mindscape >= 2) addMetric('critRate', VERTICAL_VALUES.anbySoldier0.mindscapeCritRate, mind(2), undefined, 'combat')
      if (qualified && state.focusSlot === slot) add({ kind: 'provider', source: ability, delivery: { recipient: 'all-party', formulas: REGULAR_DAMAGE_FORMULAS, eligibleAgentIds: ['anbySoldier0', 'trigger'] }, effect: { kind: 'modifier', metricId: 'dmgBonus', earliestSurface: 'fully', value: VERTICAL_VALUES.anbySoldier0.additionalAftershockDmg, action: AFTERSHOCK_TARGET } })
      if (setup.mindscape >= 4) add({ kind: 'provider', source: mind(4), delivery: { ...enemy, attributes: ['Electric'], eligibleAgentIds: ['anbySoldier0'] }, effect: { kind: 'modifier', metricId: 'resIgnore', earliestSurface: 'fully', value: VERTICAL_VALUES.anbySoldier0.mindscapeElectricResIgnore } })
      actions.push(
        { metricId: 'dmgBonus', scopes: [{ id: 'anbyAftershock', target: AFTERSHOCK_TARGET }, { id: 'anbyDash', target: DASH }, { id: 'anbyUltimate', target: ULT }] },
        actionProjection('critDmg', 'anbyAftershockCritDmg', AFTERSHOCK_TARGET),
        actionProjection('defIgnore', 'anbyAftershockDefIgnore', AFTERSHOCK_TARGET),
        actionProjection('defIgnore', 'anbyBasicUltimate', basicUlt),
      )
      break
    case 'seed': {
      const vanguard = resolveSeedVanguardForState(state)
      const recipients = vanguard ? ['seed', vanguard] as const : []
      if (vanguard) {
        add({ kind: 'provider', source: core, delivery: { recipient: 'all-party', eligibleAgentIds: recipients, formulas: REGULAR_DAMAGE_FORMULAS }, effect: { kind: 'stat', statId: 'atk', region: 'flat', earliestSurface: 'combat', value: VERTICAL_VALUES.seed.coreStatus.atk } })
        add({ kind: 'provider', source: core, delivery: { recipient: 'all-party', eligibleAgentIds: recipients, formulas: CRIT_DAMAGE_FORMULAS }, effect: { kind: 'stat', statId: 'critDmg', region: 'flat', earliestSurface: 'combat', value: VERTICAL_VALUES.seed.coreStatus.critDmg } })
        addMetric('dmgBonus', VERTICAL_VALUES.seed.coreDmg, core, undefined, 'combat')
        addMetric('dmgBonus', VERTICAL_VALUES.seed.additionalActionDmg, ability, SEED_ACTIONS, 'combat')
        add({ kind: 'provider', source: ability, delivery: { recipient: 'enemy-context', attributes: ['Electric'], formulas: ['general_damage'], eligibleAgentIds: ['seed'] }, effect: { kind: 'modifier', metricId: 'resIgnore', earliestSurface: 'combat', value: VERTICAL_VALUES.seed.additionalElectricResIgnore, action: SEED_ACTIONS } })
      }
      if (setup.mindscape >= 1) addMetric('critDmg', VERTICAL_VALUES.seed.mindscapeDownfallCritDmg, mind(1), SEED_DOWNFALL)
      if (setup.mindscape >= 2) {
        if (vanguard) add({ kind: 'provider', source: mind(2), delivery: { recipient: 'enemy-context', formulas: ['general_damage'], eligibleAgentIds: recipients }, effect: { kind: 'modifier', metricId: 'defIgnore', earliestSurface: 'combat', value: VERTICAL_VALUES.seed.mindscapeBesiegeDefIgnore, sourceDetail: 'Besiege' } })
        addMetric('dmgBonus', VERTICAL_VALUES.seed.mindscapeSlaughterDmg, mind(2), SEED_SLAUGHTER)
      }
      if (setup.mindscape >= 4) addMetric('dmgBonus', VERTICAL_VALUES.seed.mindscapeUltimateDmg, mind(4), ULT)
      if (setup.mindscape >= 6) addMetric('critDmg', VERTICAL_VALUES.seed.mindscapeCritDmg, mind(6), undefined, 'combat')
      const scopes = [{
        id: 'seedActions', target: SEED_ACTIONS,
        inheritedEffectTargets: [BASIC_ULT],
        children: [{
          id: 'seedBasicActions', target: SEED_BASIC,
          inheritedEffectTargets: [BASIC],
          children: [{ id: 'seedSlaughter', target: SEED_SLAUGHTER }, { id: 'seedDownfall', target: SEED_DOWNFALL }],
        }, { id: 'seedUltimate', target: ULT }],
      }] satisfies readonly ActionScopeNode[]
      actions.push(
        { metricId: 'dmgBonus', scopes },
        actionProjection('critDmg', 'seedDownfallCritDmg', SEED_DOWNFALL),
        { metricId: 'defIgnore', scopes },
        actionProjection('resIgnore', 'seedActionsResIgnore', SEED_ACTIONS),
      )
      break
    }
    case 'cissia': {
      const electricCount = ids.filter((id) => ADMITTED_AGENTS.find((summary) => summary.id === id)?.attribute === 'Electric').length
      const basic = src(agent, slot, 'basic', SOURCE_LABELS.cissiaBasic, 'special')
      const ultimate = src(agent, slot, 'ultimate', 'Ultimate', 'special')
      const m1Scale = setup.mindscape >= 1 ? VERTICAL_VALUES.cissia.mindscapeCoreMultiplier : 1
      addMetric('critRate', VERTICAL_VALUES.cissia.coreCritRate, basic)
      addMetric('dazeBonus', electricCount >= 2 ? VERTICAL_VALUES.cissia.coreCorrodeDaze.twoElectric : VERTICAL_VALUES.cissia.coreCorrodeDaze.oneElectric, basic, CISSIA_CORRODE)
      if (qualified) {
        add({ kind: 'provider', source: ability, delivery: { recipient: 'all-party', formulas: CRIT_DAMAGE_FORMULAS }, effect: { kind: 'stat', statId: 'critDmg', region: 'flat', earliestSurface: 'combat', value: VERTICAL_VALUES.cissia.additionalSquadCritDmg } })
        addMetric('critDmg', VERTICAL_VALUES.cissia.additionalSelfCritDmg, ability, undefined, 'combat')
      }
      add({ kind: 'provider', source: ultimate, delivery: { recipient: 'all-party', formulas: CRIT_DAMAGE_FORMULAS }, effect: { kind: 'stat', statId: 'critDmg', region: 'flat', earliestSurface: 'fully', value: VERTICAL_VALUES.cissia.ultimateSquadCritDmg } })
      add({ kind: 'gauge', source: core, basis: { statId: 'energyRegen', surface: 'initial' }, basisLabel: 'Initial Energy Regen', basisThreshold: VERTICAL_VALUES.cissia.coreEnergyThreshold, basisCap: 3.68, metricId: 'energyRegen', outputs: [{ label: 'Electric DEF Ignore', unit: '%', cap: VERTICAL_VALUES.cissia.coreDefIgnoreCap * m1Scale, decimals: 3, transform: { basisThreshold: VERTICAL_VALUES.cissia.coreEnergyThreshold, basisIncrement: VERTICAL_VALUES.cissia.coreEnergyIncrement, baseOutput: VERTICAL_VALUES.cissia.coreDefIgnore * m1Scale, outputIncrement: m1Scale, outputCap: VERTICAL_VALUES.cissia.coreDefIgnoreCap * m1Scale }, emission: { kind: 'provider', delivery: { recipient: 'enemy-context', attributes: ['Electric'], formulas: ['general_damage'] }, effect: { kind: 'modifier', metricId: 'defIgnore', earliestSurface: 'combat', sourceDetail: 'Corrosion' } } }] })
      if (setup.mindscape >= 1) {
        add({ kind: 'provider', source: mind(1), delivery: { recipient: 'enemy-context', attributes: ['Electric'], formulas: ['general_damage'] }, effect: { kind: 'modifier', metricId: 'resIgnore', earliestSurface: 'combat', value: VERTICAL_VALUES.cissia.mindscapeBroadElectricResIgnore } })
        add({ kind: 'provider', source: mind(1), delivery: { recipient: 'enemy-context', attributes: ['Electric'], formulas: ['general_damage'], eligibleAgentIds: ['cissia'] }, effect: { kind: 'modifier', metricId: 'resIgnore', earliestSurface: 'fully', value: VERTICAL_VALUES.cissia.mindscapeCorrodeElectricResIgnore, action: CISSIA_CORRODE, sourceDetail: 'Corrode Bone' } })
      }
      if (setup.mindscape >= 2) addMetric('dmgBonus', VERTICAL_VALUES.cissia.mindscapeSerpentDmg, mind(2), CISSIA_SERPENT)
      const basicScopes = [{
        id: 'cissiaBasicActions', target: CISSIA_BASIC,
        inheritedEffectTargets: [BASIC, BASIC_DASH],
        children: [{ id: 'cissiaCorrode', target: CISSIA_CORRODE }, { id: 'cissiaSerpent', target: CISSIA_SERPENT }],
      }] satisfies readonly ActionScopeNode[]
      actions.push(
        { metricId: 'dmgBonus', scopes: basicScopes },
        { metricId: 'defIgnore', scopes: [{
          ...basicScopes[0], inheritedEffectTargets: [BASIC_ULT],
        }, {
          id: 'cissiaUltimateDefIgnore', target: ULT,
          inheritedEffectTargets: [BASIC_ULT],
        }] },
        { metricId: 'resIgnore', scopes: [{ id: 'cissiaBasicActionsResIgnore', target: CISSIA_BASIC, children: [{ id: 'cissiaCorrodeResIgnore', target: CISSIA_CORRODE }] }] },
        actionProjection('dazeBonus', 'cissiaCorrodeDaze', CISSIA_CORRODE),
      )
      break
    }
    case 'evelyn': {
      addMetric('critRate', VERTICAL_VALUES.evelyn.coreCritRate, core, undefined, 'combat')
      if (qualified) {
        addMetric('dmgBonus', VERTICAL_VALUES.evelyn.additionalChainUltimateDmg, ability, CHAIN_ULT, 'combat')
        add({ kind: 'threshold-operation', source: ability, basis: { statId: 'critRate' }, basisLabels: { combat: 'Combat CRIT Rate', fully: 'Fully Enabled CRIT Rate' }, threshold: VERTICAL_VALUES.evelyn.additionalCritThreshold, metricId: 'critRate', outputLabel: 'Chain Attack & Ultimate DMG Multiplier', inactiveValue: 1, activeValue: VERTICAL_VALUES.evelyn.additionalMultiplier, unit: '', presentation: 'scale' })
      }
      if (setup.mindscape >= 1) addMetric('defIgnore', VERTICAL_VALUES.evelyn.mindscapeDefIgnore, mind(1), undefined, 'combat')
      if (setup.mindscape >= 2) addAtk(VERTICAL_VALUES.evelyn.mindscapeAtk, mind(2), 'combat')
      if (setup.mindscape >= 4) addMetric('critDmg', VERTICAL_VALUES.evelyn.mindscapeCritDmg, mind(4))
      const chainScopes = [{ id: 'evelynChainUltimate', target: CHAIN_ULT, children: [{ id: 'evelynUltimate', target: ULT }] }] satisfies readonly ActionScopeNode[]
      actions.push({ metricId: 'dmgBonus', scopes: chainScopes }, { metricId: 'resIgnore', scopes: [{ id: 'evelynChainUltimateResIgnore', target: CHAIN_ULT, children: [{ id: 'evelynUltimateResIgnore', target: ULT }] }] }, actionProjection('defIgnore', 'evelynBasicUltimateDefIgnore', BASIC_ULT))
      break
    }
    case 'corin': {
      addMetric('dmgBonus', VERTICAL_VALUES.corin.coreChainsawDmg, core, CORIN_CHAINSAW, 'combat')
      if (qualified) addMetric('dmgBonus', VERTICAL_VALUES.corin.additionalStunnedDmg, ability)
      if (setup.mindscape >= 1) addMetric('dmgBonus', VERTICAL_VALUES.corin.mindscapeDmg, mind(1))
      if (setup.mindscape >= 2) addMetric('resReduction', VERTICAL_VALUES.corin.mindscapePhysicalResReduction, mind(2))
      actions.push(
        { metricId: 'dmgBonus', scopes: [{ id: 'corinChainsaw', target: CORIN_CHAINSAW }, { id: 'corinEx', target: EX }, { id: 'corinUltimate', target: ULT }] },
        actionProjection('defIgnore', 'corinBasicUltimateDefIgnore', CORIN_BASIC_ULT),
      )
      break
    }
    case 'hugo': {
      const values = VERTICAL_VALUES.hugo
      addMetric('critRate', values.coreCritRate, core, undefined, 'combat')
      addMetric('critDmg', values.coreCritDmg, core, undefined, 'combat')
      const stuns = ids.filter((id, index) => index !== slot && ADMITTED_AGENTS.find((summary) => summary.id === id)?.specialty === 'Stun').length
      const stunAtk = stuns >= 2 ? values.coreAtkTwoStun : stuns === 1 ? values.coreAtkOneStun : 0
      if (stunAtk) add(stat(core, 'atk', stunAtk))
      add(operation(core, 'Totalize added DMG Multiplier', values.coreTotalizeMultiplier))
      add(operation(core, 'Totalize maximum Daze return', values.coreDazeReturn))
      add(operation(core, 'EX Special Daze against non-Stunned enemies', 1 + values.exNonStunnedDaze / 100, '', 'combat', 'scale'))
      if (qualified) { addMetric('dmgBonus', values.additionalChainDmg, ability, CHAIN); addMetric('dmgBonus', values.additionalTotalizeDmg, ability, HUGO_TOTALIZE) }
      if (setup.mindscape >= 1) { addMetric('critRate', values.mindscapeCritRate, mind(1), undefined, 'combat'); addMetric('critDmg', values.mindscapeCritDmg, mind(1), undefined, 'combat') }
      if (setup.mindscape >= 2) addMetric('defIgnore', values.mindscapeTotalizeDefIgnore, mind(2), HUGO_TOTALIZE)
      if (setup.mindscape >= 4) addMetric('resIgnore', values.mindscapeIceResIgnore, mind(4))
      if (setup.mindscape >= 6) { addMetric('dmgBonus', values.mindscapeTotalizeDmg, mind(6), HUGO_TOTALIZE); add(operation(mind(6), 'EX Special non-Stunned Totalize added DMG Multiplier', values.mindscapeExTotalizeMultiplier)) }
      const damageScopes = [{ id: 'hugoChain', target: CHAIN }, { id: 'hugoUltimate', target: ULT }, { id: 'hugoTotalize', target: HUGO_TOTALIZE }, { id: 'hugoBackAttack', target: BACK }] satisfies readonly ActionScopeNode[]
      actions.push({ metricId: 'dmgBonus', scopes: damageScopes }, { metricId: 'defIgnore', scopes: [{ id: 'hugoBasicUltimateDefIgnore', target: BASIC_ULT }, { id: 'hugoTotalizeDefIgnore', target: HUGO_TOTALIZE }] })
      break
    }
    case 'ellen': {
      const values = VERTICAL_VALUES.ellen
      addMetric('critDmg', values.coreCritDmg, core, ELLEN_CORE)
      if (qualified) addMetric('dmgBonus', values.additionalIceDmg, ability)
      const potential = src(agent, slot, 'potential', 'Potential Awakening', 'identity')
      addMetric('critDmg', values.potentialCritDmg, potential, ELLEN_CORE)
      addMetric('resIgnore', values.potentialIceResIgnore, potential)
      if (setup.mindscape >= 1) addMetric('critRate', values.mindscapeCritRate, mind(1), undefined, 'combat')
      if (setup.mindscape >= 2) addMetric('critDmg', values.mindscapeExCritDmg, mind(2), EX)
      if (setup.mindscape >= 6) { addMetric('penRatio', values.mindscapePenRatio, mind(6)); addMetric('dmgBonus', values.mindscapeChargedDmg, mind(6), actionTarget([sourceLocalAction('Charged Arctic Ambush')])) }
      actions.push(
        { metricId: 'dmgBonus', scopes: [{ id: 'ellenCoreActions', target: ELLEN_CORE }, { id: 'ellenEx', target: EX }, { id: 'ellenCharged', target: actionTarget([sourceLocalAction('Charged Arctic Ambush')]) }, { id: 'ellenUltimate', target: ULT }, { id: 'ellenBackAttack', target: BACK }] },
        { metricId: 'critDmg', scopes: [{ id: 'ellenCoreCritDmg', target: ELLEN_CORE }, { id: 'ellenExCritDmg', target: EX }] },
        actionProjection('defIgnore', 'ellenBasicUltimateDefIgnore', BASIC_ULT),
      )
      break
    }
    case 'soldier11': {
      const values = VERTICAL_VALUES.soldier11
      const active = soldier11AdditionalIsActive(ids, slot)
      addMetric('dmgBonus', values.coreActionFireDmg, core, FIRE_SUPPRESSION_BASIC)
      addMetric('dmgBonus', values.coreActionFireDmg, core, FIRE_SUPPRESSION_DASH)
      if (active) {
        addMetric('dmgBonus', values.additionalFireDmg, ability)
        addMetric('dmgBonus', values.additionalStunnedFireDmg, ability, STUNNED)
        addMetric('critDmg', values.potentialCritDmg, src(agent, slot, 'potential', 'Potential Awakening', 'special'), undefined, 'combat')
      }
      if (setup.mindscape >= 2) for (const target of [BASIC, DASH, DODGE] as const) addMetric('dmgBonus', values.mindscapeActionDmg, mind(2), target)
      if (setup.mindscape >= 6) { addMetric('resIgnore', values.mindscapeFireResIgnore, mind(6), FIRE_SUPPRESSION_BASIC); addMetric('resIgnore', values.mindscapeFireResIgnore, mind(6), FIRE_SUPPRESSION_DASH) }
      const damageScopes = [
        { id: 'soldier11Basic', target: BASIC, children: [{ id: 'soldier11FireSuppressionBasic', target: FIRE_SUPPRESSION_BASIC }] },
        { id: 'soldier11Dash', target: DASH, children: [{ id: 'soldier11FireSuppressionDash', target: FIRE_SUPPRESSION_DASH }] },
        { id: 'soldier11DodgeCounter', target: DODGE },
        { id: 'soldier11AgainstStunnedEnemies', target: STUNNED },
        { id: 'soldier11Ultimate', target: ULT },
      ] satisfies readonly ActionScopeNode[]
      actions.push(
        { metricId: 'dmgBonus', scopes: damageScopes },
        { metricId: 'resIgnore', scopes: [{ id: 'soldier11ChainUltimateResIgnore', target: CHAIN_ULT }, { id: 'soldier11FireSuppressionBasicResIgnore', target: FIRE_SUPPRESSION_BASIC }, { id: 'soldier11FireSuppressionDashResIgnore', target: FIRE_SUPPRESSION_DASH }] },
        actionProjection('defIgnore', 'soldier11BasicUltimateDefIgnore', BASIC_ULT),
      )
      break
    }
    case 'zhuYuan': {
      const values = VERTICAL_VALUES.zhuYuan
      for (const target of [ZHU_ENHANCED_BASIC, ZHU_ENHANCED_DASH] as const) addMetric('dmgBonus', values.coreEnhancedDmg, core, target)
      for (const target of [ZHU_STUNNED_BASIC, ZHU_STUNNED_DASH] as const) addMetric('dmgBonus', values.coreStunnedDmg, core, target)
      if (zhuYuanAdditionalIsActive(ids, slot)) addMetric('critRate', values.additionalCritRate, ability)
      if (setup.mindscape >= 2) for (const target of [ZHU_ENHANCED_BASIC, ZHU_ENHANCED_DASH] as const) addMetric('dmgBonus', values.mindscapeEnhancedDmg, mind(2), target)
      if (setup.mindscape >= 4) for (const target of [ZHU_ENHANCED_BASIC, ZHU_ENHANCED_DASH] as const) addMetric('resIgnore', values.mindscapeEtherResIgnore, mind(4), target)
      const scopes = [
        { id: 'zhuYuanBasic', target: BASIC, children: [{ id: 'zhuYuanEnhancedBasic', target: ZHU_ENHANCED_BASIC, children: [{ id: 'zhuYuanStunnedEnhancedBasic', target: ZHU_STUNNED_BASIC }] }] },
        { id: 'zhuYuanDash', target: DASH, children: [{ id: 'zhuYuanEnhancedDash', target: ZHU_ENHANCED_DASH, children: [{ id: 'zhuYuanStunnedEnhancedDash', target: ZHU_STUNNED_DASH }] }] },
        { id: 'zhuYuanUltimate', target: ULT },
      ] satisfies readonly ActionScopeNode[]
      actions.push({ metricId: 'dmgBonus', scopes }, { metricId: 'resIgnore', scopes: [{ id: 'zhuYuanEnhancedBasicResIgnore', target: ZHU_ENHANCED_BASIC }, { id: 'zhuYuanEnhancedDashResIgnore', target: ZHU_ENHANCED_DASH }] }, actionProjection('defIgnore', 'zhuYuanBasicUltimateDefIgnore', BASIC_ULT))
      break
    }
    case 'orphie':
      addMetric('critRate', VERTICAL_VALUES.orphie.coreCritRate, core, undefined, 'combat')
      addMetric('dmgBonus', VERTICAL_VALUES.orphie.coreAftershockDmg, core, AFTERSHOCK_TARGET)
      if (qualified) add({ kind: 'provider', source: ability, delivery: { recipient: 'enemy-context', formulas: ['general_damage'] }, effect: { kind: 'modifier', metricId: 'defIgnore', earliestSurface: 'fully', value: VERTICAL_VALUES.orphie.additionalAftershockDefIgnore, action: AFTERSHOCK_TARGET } })
      if (setup.mindscape >= 1) {
        addMetric('resIgnore', VERTICAL_VALUES.orphie.mindscapeFireResIgnore, mind(1), ORPHIE_SPECIAL_EX_CHAIN_ULT)
        add({ kind: 'provider', source: mind(1), delivery: { recipient: 'all-party', formulas: REGULAR_DAMAGE_FORMULAS }, effect: { kind: 'modifier', metricId: 'dmgBonus', earliestSurface: 'fully', value: VERTICAL_VALUES.orphie.mindscapeSquadDmg } })
      }
      if (setup.mindscape >= 2) addAtk(VERTICAL_VALUES.orphie.mindscapeAtk, mind(2), 'combat')
      if (setup.mindscape >= 4) addMetric('dmgBonus', VERTICAL_VALUES.orphie.mindscapeActionDmg, mind(4), ORPHIE_HEAT_ULT)
      add({
        kind: 'gauge', source: core,
        basis: { statId: 'energyRegen', surface: 'initial' }, basisLabel: 'Initial Energy Regen',
        basisThreshold: VERTICAL_VALUES.orphie.coreEnergyThreshold, basisCap: 3.7, metricId: 'energyRegen',
        outputs: [{ label: 'Squad ATK', unit: '', cap: VERTICAL_VALUES.orphie.coreSquadAtkCap, transform: { basisThreshold: VERTICAL_VALUES.orphie.coreEnergyThreshold, basisIncrement: VERTICAL_VALUES.orphie.coreEnergyIncrement, baseOutput: VERTICAL_VALUES.orphie.coreSquadAtkBase, outputIncrement: VERTICAL_VALUES.orphie.coreSquadAtkPerIncrement, outputCap: VERTICAL_VALUES.orphie.coreSquadAtkCap }, emission: { kind: 'provider', delivery: all, effect: { kind: 'stat', statId: 'atk', region: 'flat', earliestSurface: 'fully' } } }],
        decimals: { current: 3, threshold: 1, cap: 1, output: 0, outputCap: 0 },
      })
      actions.push(
        { metricId: 'dmgBonus', scopes: [{ id: 'orphieAftershock', target: AFTERSHOCK_TARGET }, { id: 'orphieDash', target: DASH }, { id: 'orphieExSpecial', target: EX }, { id: 'orphieUltimate', target: ULT, children: [{ id: 'orphieHeatChargeUltimate', target: ORPHIE_HEAT_ULT }] }] },
        { metricId: 'defIgnore', scopes: [{ id: 'orphieAftershockDefIgnore', target: AFTERSHOCK_TARGET }, { id: 'orphieBasicUltimateDefIgnore', target: BASIC_ULT }] },
        { metricId: 'resIgnore', scopes: [{ id: 'orphieSpecialExChainUltimateResIgnore', target: ORPHIE_SPECIAL_EX_CHAIN_ULT, children: [{ id: 'orphieChainUltimateResIgnore', target: CHAIN_ULT }] }] },
      )
      break
    case 'harumasa': {
      const values = VERTICAL_VALUES.harumasa
      addMetric('critRate', values.coreCritRate, core, HARUMASA_CORE)
      addMetric('critDmg', values.coreCritDmg, core, HARUMASA_CORE)
      const potential = src(agent, slot, 'potential', SOURCE_LABELS.harumasaPotential, 'identity')
      add(stat(potential, 'atk', values.potentialAtk, 'percentage'))
      addMetric('resIgnore', values.potentialElectricResIgnore, potential, HARUMASA_DASH_CHASING)
      if (qualified) addMetric('dmgBonus', values.additionalDmg, ability)
      if (setup.mindscape >= 2) addMetric('dmgBonus', values.mindscapeDashDmg, mind(2), HARUMASA_SLASH)
      if (setup.mindscape >= 6) addMetric('resIgnore', values.mindscapeElectricResIgnore, mind(6))
      actions.push(
        { metricId: 'dmgBonus', scopes: [{ id: 'harumasaDashDmg', target: DASH, children: [{ id: 'harumasaDashSlashDmg', target: HARUMASA_SLASH }] }] },
        { ...actionProjection('critRate', 'harumasaCoreCritRate', HARUMASA_CORE), cap: { value: 100, source: selectedCalculationSource(agent, slot, 'crit-rate-cap', 'Displayed CRIT Rate cap') } },
        actionProjection('critDmg', 'harumasaCoreCritDmg', HARUMASA_CORE),
        actionProjection('defIgnore', 'harumasaBasicUltimateDefIgnore', BASIC_ULT),
        actionProjection('resIgnore', 'harumasaDashChasingResIgnore', HARUMASA_DASH_CHASING),
      )
      break
    }
    case 'nekomata': {
      const values = VERTICAL_VALUES.nekomata
      addMetric('dmgBonus', values.coreDmg, core)
      addMetric('critDmg', values.potentialCritDmg, src(agent, slot, 'potential', SOURCE_LABELS.nekomataPotential, 'identity'))
      if (qualified) addMetric('dmgBonus', values.additionalActionDmg, ability, NEKOMATA_EX_DODGE)
      if (setup.mindscape >= 1) addMetric('resIgnore', values.mindscapePhysicalResIgnore, mind(1))
      if (setup.mindscape >= 2) relationships.push({ kind: 'automatic-energy', atom: { earliestSurface: 'combat', value: values.mindscapeEnergyRegen, source: mind(2) } })
      if (setup.mindscape >= 4) addMetric('critRate', values.mindscapeCritRate, mind(4))
      if (setup.mindscape >= 6) addMetric('critDmg', values.mindscapeCritDmg, mind(6))
      actions.push(
        { metricId: 'dmgBonus', scopes: [{ id: 'nekomataAdditionalActions', target: NEKOMATA_EX_DODGE, children: [{ id: 'nekomataDodgeCounter', target: DODGE }, { id: 'nekomataExSpecial', target: EX }] }, { id: 'nekomataUltimate', target: ULT }, { id: 'nekomataBackAttack', target: BACK }] },
        actionProjection('defIgnore', 'nekomataBasicUltimateDefIgnore', BASIC_ULT),
      )
      break
    }
    case 'billy': {
      const values = VERTICAL_VALUES.billy
      addMetric('dmgBonus', values.coreActionDmg, core, BILLY_CROUCHING)
      if (qualified) addMetric('dmgBonus', values.additionalUltimateDmg, ability, ULT)
      if (setup.mindscape >= 2) addMetric('dmgBonus', values.mindscapeDodgeDmg, mind(2), DODGE)
      if (setup.mindscape >= 4) addMetric('critRate', values.mindscapeExCritRate, mind(4), EX)
      if (setup.mindscape >= 6) addMetric('dmgBonus', values.mindscapeDmg, mind(6))
      const damageScopes = [{ id: 'billyCrouchingActions', target: BILLY_CROUCHING, children: [{ id: 'billyBasic', target: BASIC }, { id: 'billyDash', target: DASH }, { id: 'billyDodgeCounter', target: DODGE }, { id: 'billyExSpecial', target: EX }, { id: 'billyUltimate', target: ULT }] }] satisfies readonly ActionScopeNode[]
      actions.push({ metricId: 'dmgBonus', scopes: damageScopes }, { ...actionProjection('critRate', 'billyExSpecialCritRate', EX), cap: { value: 100, source: selectedCalculationSource(agent, slot, 'crit-rate-cap', 'Displayed CRIT Rate cap') } }, actionProjection('defIgnore', 'billyBasicUltimateDefIgnore', BASIC_ULT))
      break
    }
    case 'yeShunguang': {
      const values = VERTICAL_VALUES.yeShunguang
      addMetric('critRate', values.unityCritRate, core, undefined, 'combat')
      addMetric('dmgBonus', values.unityDmg, core, undefined, 'combat')
      if (setup.mindscape >= 1) { addMetric('dmgBonus', values.mindscapeUnityDmg, mind(1), undefined, 'combat'); addMetric('defIgnore', values.mindscapeDefIgnore, mind(1), undefined, 'combat') }
      if (setup.mindscape >= 2) addMetric('defIgnore', values.mindscapeActionDefIgnore, mind(2), YE_M2)
      const veilCap = setup.mindscape >= 4 ? values.mindscapeVeilVulnerabilityCap : values.veilVulnerabilityCap
      const targetStun = calculationContext.targetStunDmgMultiplier ?? 150
      const targetSource = selectedCalculationSource(agent, slot, 'target-stun', 'Target Stun DMG', 'target')
      add(mod(targetSource, 'stunDmgMultiplier', targetStun - 100, undefined, 'fully', 'Above 100%'))
      add({ kind: 'projection-gauge', source: targetSource, metricId: 'stunDmgMultiplier', basisLabel: 'Raw Stun DMG Multiplier bonus', basisCap: veilCap, output: { label: 'Veil Vulnerability', unit: '%', transform: { basisIncrement: 1, outputIncrement: 1, outputCap: veilCap }, cap: veilCap } })
      actions.push(
        { metricId: 'dmgBonus', scopes: [{ id: 'yeExSpecialDmg', target: YE_EX }, { id: 'yeUltimateDmg', target: YE_ULT }, { id: 'yeBackAttackDmg', target: BACK }] },
        actionProjection('defIgnore', 'yeEnlightenedActionsDefIgnore', YE_M2),
      )
      break
    }
  }
  relationships.push(...selectedEquipmentRelationships(agent, slot, setup, {
    observation,
    focusAgentId: state.slots[state.focusSlot].agentId,
    partyAgentIds: ids,
  }))
  if (agent === 'anbySoldier0' && qualified) {
    relationships.push({
      kind: 'post-delivery-linear',
      source: core,
      basis: { statId: 'critDmg', surface: 'fully' },
      outputs: [{
        transform: { basisIncrement: 1, outputIncrement: 0.35 },
        emission: {
          kind: 'provider',
          delivery: {
            recipient: 'all-party',
            eligibleAgentIds: ['anbySoldier0', 'trigger'],
          },
          effect: {
            kind: 'modifier',
            metricId: 'critDmg',
            earliestSurface: 'fully',
            action: AFTERSHOCK_TARGET,
            display: { value: 35, unit: '%', decimals: 0 },
            sourceDetail: '35% of Fully Enabled CRIT DMG',
          },
        },
      }],
    })
  }
  const critCap = { value: 100, source: selectedCalculationSource(agent, slot, 'crit-rate-cap', 'Displayed CRIT Rate cap') }
  const metrics: MetricProjection[] = [
    m('atk', 'ATK', '', 'atk'),
    { ...m('critRate', 'CRIT Rate', '%', 'critRate'), cap: critCap },
    m('critDmg', 'CRIT DMG', '%', 'critDmg'),
    m('dmgBonus', 'DMG Bonus', '%'),
    m('penRatio', 'PEN Ratio', '%', 'penRatio', 'disclosed-or-action'),
    ...(baseStats.energyRegen !== undefined ? [{ ...m('energyRegen', 'Energy Regen', '/s', 'energyRegen', agent === 'cissia' || agent === 'orphie' ? undefined : 'disclosed-or-action'), ...(agent === 'cissia' || agent === 'orphie' ? { decimals: 3 } : {}) }] : []),
    m('defIgnore', 'DEF Ignore', '%', undefined, 'nonzero-or-action'),
    m('defReduction', 'DEF Reduction', '%', undefined, 'nonzero-or-action'),
    m('resIgnore', 'RES Ignore', '%', undefined, 'nonzero-or-action'),
    m('resReduction', 'RES Reduction', '%', undefined, 'nonzero-or-action'),
    m('stunDmgMultiplier', 'Stun DMG Multiplier', '%', undefined, 'nonzero-or-action'),
    m('dazeBonus', 'Daze Bonus', '%', undefined, 'nonzero-or-action'),
  ]
  return {
    agentId: agent,
    appliedPartySlot: slot,
    relationships,
    metrics,
    ...(actions.length ? { actions } : {}),
  }
}

export function attackProfileFor(
  agent: Agent,
  state: WorkbenchState,
  slot: Slot,
  calculationContext: CalculationContext = {},
): AgentSourceProfile {
  return profile(agent, state, slot, calculationContext)
}
