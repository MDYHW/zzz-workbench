import { DRIVE_DISC_FACTS, VERTICAL_VALUES, W_ENGINE_FACTS, W_ENGINES, scaledEngineValue } from '../../content'
import { STATIC_SOURCES, active, additive, discSource, discStatInput, effectiveSubstatInput, engineAdvancedInput, engineSource, mainStatInput, mindscapeSource, percentage, resolveDeliveredClauses, type CompleteSetup, type EffectMetric, type ResolvedSetupInput, type SourceBoundCurrentClause } from '../../effects'
import { composeActionEffects, composeMetricEffects, contribution, percentageContribution, surfaces } from '../composition'
import type { AgentResult } from '../result'

export interface AnbyCalculationContext { agentId: 'anbySoldier0'; setup: CompleteSetup; hasStunOrSupport: boolean; isFocus: boolean; initialAtk: number }

function anbyAtkInputs(setup: CompleteSetup): ResolvedSetupInput[] {
  return presentInputs([engineAdvancedInput(setup, 'anbySoldier0', 'atkPct'), mainStatInput(setup, 'anbySoldier0', 'slot5', 'atkPct'), mainStatInput(setup, 'anbySoldier0', 'slot6', 'atkPct'), effectiveSubstatInput(setup, 'anbySoldier0', 'atkPct')])
}

export const observeAnby = (setup: CompleteSetup, hasStunOrSupport: boolean, isFocus: boolean): AnbyCalculationContext => {
  const baseAtk = VERTICAL_VALUES.anbySoldier0.atk + W_ENGINES[setup.engineId].baseAtk
  const initialAtk = baseAtk * (1 + anbyAtkInputs(setup).reduce((n, x) => n + x.rawValue, 0) / 100) + 316
  return { agentId: 'anbySoldier0', setup, hasStunOrSupport, isFocus, initialAtk }
}

export function resolveAnbyProviderClauses(context: AnbyCalculationContext): SourceBoundCurrentClause[] {
  const { setup, hasStunOrSupport, isFocus } = context
  const engine = engineSource('anbySoldier0', setup)
  const shadow = setup.fourPieceId === 'shadowHarmony'
  const refinement = setup.refinement
  const severedCombatCrit = setup.engineId === 'severedInnocence'
    ? scaledEngineValue(W_ENGINE_FACTS.severedInnocence.combatCritDmg, refinement)
    : 0
  const severedStackCrit = setup.engineId === 'severedInnocence'
    ? scaledEngineValue(W_ENGINE_FACTS.severedInnocence.stackCritDmg * 3, refinement)
    : 0
  return active([
    additive('critDmg', 'combat', engine, severedCombatCrit, 'self'),
    additive('critDmg', 'fully', engine, severedStackCrit, 'self'),
    additive('critRate', 'combat', engine, setup.engineId === 'cordisGermina' ? scaledEngineValue(W_ENGINE_FACTS.cordisGermina.critRate, refinement) : 0, 'self'),
    additive('critRate', 'fully', STATIC_SOURCES.anbySoldier0.additional, hasStunOrSupport ? 10 : 0, 'self'),
    additive('critRate', 'combat', mindscapeSource('anbySoldier0', 2), setup.mindscape >= 2 ? 12 : 0, 'self'),
    additive('critRate', 'fully', discSource('anbySoldier0', 'shadowHarmony', '4-piece'), shadow ? DRIVE_DISC_FACTS.shadowHarmony.critRate : 0, 'self'),
    percentage('atk', 'fully', discSource('anbySoldier0', 'shadowHarmony', '4-piece'), shadow ? DRIVE_DISC_FACTS.shadowHarmony.atkPct : 0, 'self'),
    percentage('atk', 'fully', engine, setup.engineId === 'marcatoDesire'
      ? scaledEngineValue(W_ENGINE_FACTS.marcatoDesire.atkPctPerClause, refinement) * 2
      : setup.engineId === 'starlightEngine'
        ? scaledEngineValue(W_ENGINE_FACTS.starlightEngine.atkPct, refinement)
        : 0, 'self'),
    additive('dmgBonus', 'fully', STATIC_SOURCES.anbySoldier0.core, 25, 'self'),
    additive('dmgBonus', 'fully', STATIC_SOURCES.anbySoldier0.additional, hasStunOrSupport && isFocus ? 50 : 0, 'all-party', 'anbyAftershock', undefined, ['anbySoldier0', 'trigger']),
    additive('dmgBonus', 'fully', engine, setup.engineId === 'severedInnocence' ? scaledEngineValue(W_ENGINE_FACTS.severedInnocence.electricDmg, refinement) : 0, 'self'),
    additive('dmgBonus', 'initial', discSource('anbySoldier0', 'shadowHarmony', '2-piece', '4-piece'), setup.fourPieceId === 'shadowHarmony' ? DRIVE_DISC_FACTS.shadowHarmony.aftershockDmg : 0, 'self', 'anbyAftershock'),
    additive('dmgBonus', 'initial', discSource('anbySoldier0', 'shadowHarmony', '2-piece', '4-piece'), setup.fourPieceId === 'shadowHarmony' ? DRIVE_DISC_FACTS.shadowHarmony.aftershockDmg : 0, 'self', 'anbyDash'),
    additive('dmgBonus', 'fully', engine, setup.engineId === 'cordisGermina' ? scaledEngineValue(W_ENGINE_FACTS.cordisGermina.electricDmgPerStack, refinement) * 2 : 0, 'self'),
    additive('defIgnore', 'fully', engine, setup.engineId === 'cordisGermina' ? scaledEngineValue(W_ENGINE_FACTS.cordisGermina.defIgnore, refinement) : 0, 'enemy-context', 'anbyBasicUltimate', undefined, ['anbySoldier0']),
    additive('resIgnore', 'fully', mindscapeSource('anbySoldier0', 4, 'Electric RES Ignore'), setup.mindscape >= 4 ? 12 : 0, 'enemy-context', undefined, undefined, ['anbySoldier0']),
  ])
}

export function anbyFullyCrit(setup: CompleteSetup, inbox: SourceBoundCurrentClause[], _hasStunOrSupport: boolean): number {
  const initial = VERTICAL_VALUES.anbySoldier0.critDmg
    + (engineAdvancedInput(setup, 'anbySoldier0', 'critDmg')?.rawValue ?? 0)
    + (mainStatInput(setup, 'anbySoldier0', 'slot4', 'critDmg')?.rawValue ?? 0)
    + (discStatInput(setup, 'anbySoldier0', 'twoPiece', 'branchAndBlade', DRIVE_DISC_FACTS.branchAndBlade.critDmg)?.rawValue ?? 0)
    + (effectiveSubstatInput(setup, 'anbySoldier0', 'critDmg')?.rawValue ?? 0)
  return composeMetricEffects(surfaces(initial, initial, initial), surfaces([], [], []), resolveDeliveredClauses(inbox, {}), 'critDmg').values.fully
}

function presentInputs(inputs: Array<ResolvedSetupInput | undefined>): ResolvedSetupInput[] {
  return inputs.filter((input): input is ResolvedSetupInput => input !== undefined)
}

function optionalMetric(
  metric: EffectMetric,
  id: string,
  label: string,
  effects: ReturnType<typeof resolveDeliveredClauses>,
) {
  const data = composeMetricEffects(surfaces(0, 0, 0), surfaces([], [], []), effects, metric)
  return data.values.fully === 0 ? [] : [{ id, label, unit: '%', decimals: 1, ...data }]
}

export function calculateAnby(context: AnbyCalculationContext, inbox: SourceBoundCurrentClause[], enemy: SourceBoundCurrentClause[]): AgentResult {
  const { setup, initialAtk } = context
  const values = VERTICAL_VALUES.anbySoldier0
  const engine = W_ENGINES[setup.engineId]
  const baseAtk = values.atk + engine.baseAtk
  const atkInputs = anbyAtkInputs(setup)
  const effects = resolveDeliveredClauses([...inbox, ...enemy], { atk: initialAtk })
  const atk = composeMetricEffects(surfaces(initialAtk, initialAtk, initialAtk), surfaces(atkInputs.map((x) => percentageContribution(x.source, baseAtk * x.rawValue / 100, x.rawValue)), [], []), effects, 'atk')
  const critRateInputs = presentInputs([engineAdvancedInput(setup, 'anbySoldier0', 'critRate'), mainStatInput(setup, 'anbySoldier0', 'slot4', 'critRate'), discStatInput(setup, 'anbySoldier0', 'twoPiece', 'woodpecker', DRIVE_DISC_FACTS.woodpecker.critRate), effectiveSubstatInput(setup, 'anbySoldier0', 'critRate')])
  const critRate = composeMetricEffects(surfaces(Math.min(values.critRate + critRateInputs.reduce((n, x) => n + x.rawValue, 0), 100), Math.min(values.critRate + critRateInputs.reduce((n, x) => n + x.rawValue, 0), 100), Math.min(values.critRate + critRateInputs.reduce((n, x) => n + x.rawValue, 0), 100)), surfaces(critRateInputs.map((x) => contribution(x.source, x.rawValue)), [], []), effects, 'critRate', { value: 100, source: STATIC_SOURCES.anbySoldier0.critCap })
  const critDmgInputs = presentInputs([engineAdvancedInput(setup, 'anbySoldier0', 'critDmg'), mainStatInput(setup, 'anbySoldier0', 'slot4', 'critDmg'), discStatInput(setup, 'anbySoldier0', 'twoPiece', 'branchAndBlade', DRIVE_DISC_FACTS.branchAndBlade.critDmg), effectiveSubstatInput(setup, 'anbySoldier0', 'critDmg')])
  const critDmg = composeMetricEffects(surfaces(values.critDmg + critDmgInputs.reduce((n, x) => n + x.rawValue, 0), values.critDmg + critDmgInputs.reduce((n, x) => n + x.rawValue, 0), values.critDmg + critDmgInputs.reduce((n, x) => n + x.rawValue, 0)), surfaces(critDmgInputs.map((x) => contribution(x.source, x.rawValue)), [], []), effects, 'critDmg')
  const electricDmgInput = mainStatInput(setup, 'anbySoldier0', 'slot5', 'electricDmg')
  const penRatioInput = mainStatInput(setup, 'anbySoldier0', 'slot5', 'penRatio')
  const regular = composeMetricEffects(
    surfaces(electricDmgInput?.rawValue ?? 0, electricDmgInput?.rawValue ?? 0, electricDmgInput?.rawValue ?? 0),
    surfaces(electricDmgInput ? [contribution(electricDmgInput.source, electricDmgInput.rawValue)] : [], [], []),
    effects,
    'dmgBonus',
  )
  const pen = composeMetricEffects(
    surfaces(penRatioInput?.rawValue ?? 0, penRatioInput?.rawValue ?? 0, penRatioInput?.rawValue ?? 0),
    surfaces(penRatioInput ? [contribution(penRatioInput.source, penRatioInput.rawValue)] : [], [], []),
    effects,
    'penRatio',
  )
  const action = composeActionEffects(regular.values, effects, 'dmgBonus', 'anbyAftershock')
  const dash = composeActionEffects(regular.values, effects, 'dmgBonus', 'anbyDash')
  const aftershockCrit = composeActionEffects(critDmg.values, effects, 'critDmg', 'anbyAftershock')
  const actionModifiers: AgentResult['actionModifiers'] = [
    { id: 'anbyAftershock', actions: [], tag: 'aftershock', metricId: 'dmgBonus', ...action },
    { id: 'anbyDash', actions: ['Dash Attack'], metricId: 'dmgBonus', ...dash },
    { id: 'anbyAftershockCritDmg', actions: [], tag: 'aftershock', metricId: 'critDmg', ...aftershockCrit },
  ]
  if (effects.some((effect) => effect.action === 'anbyBasicUltimate' && effect.metric === 'defIgnore')) {
    actionModifiers.push({ id: 'anbyBasicUltimate', actions: ['Basic Attack', 'Ultimate'], metricId: 'defIgnore', ...composeActionEffects(surfaces(0, 0, 0), effects, 'defIgnore', 'anbyBasicUltimate') })
  }
  return { agentId: 'anbySoldier0', metrics: [{ id: 'atk', label: 'ATK', unit: '', decimals: 0, ...atk }, { id: 'critRate', label: 'CRIT Rate', unit: '%', decimals: 1, ...critRate }, { id: 'critDmg', label: 'CRIT DMG', unit: '%', decimals: 1, ...critDmg }, { id: 'dmgBonus', label: 'DMG Bonus', unit: '%', decimals: 1, ...regular }, ...(pen.values.fully ? [{ id: 'penRatio', label: 'PEN Ratio', unit: '%', decimals: 1, ...pen }] : []), ...optionalMetric('defIgnore', 'defIgnore', 'DEF Ignore', effects), ...optionalMetric('resIgnore', 'resIgnore', 'RES Ignore', effects), ...optionalMetric('resReduction', 'resReduction', 'RES Reduction', effects), ...optionalMetric('defReduction', 'defReduction', 'DEF Reduction', effects), ...optionalMetric('stunDmgMultiplier', 'stunDmgMultiplier', 'Stun DMG Multiplier', effects)], actionModifiers, operations: [] }
}
