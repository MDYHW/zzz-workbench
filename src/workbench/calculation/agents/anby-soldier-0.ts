import { DRIVE_DISC_FACTS, VERTICAL_VALUES, W_ENGINE_FACTS, W_ENGINES, equipmentEffectBaseValue, equipmentEffectMaximumValue, equipmentEffectProgressionValue } from '../../content'
import { STATIC_SOURCES, active, additive, discSource, discStatInput, effectiveSubstatInput, engineAdvancedInput, engineSource, mainStatInput, mindscapeSource, percentage, presentSetupInputs, pufferElectroFourPieceClauses, resolveDeliveredClauses, type CompleteSetup, type EffectMetric, type ResolvedSetupInput, type SourceBoundCurrentClause } from '../../effects'
import { actionTarget, canonicalAction } from '../../actions'
import { composeActionEffects, composeMetricEffects, contribution, percentageContribution, surfaces } from '../composition'
import { initialAtkFor } from '../initial-atk'
import type { AgentResult } from '../result'

export interface AnbyCalculationContext { agentId: 'anbySoldier0'; setup: CompleteSetup; hasStunOrSupport: boolean; isFocus: boolean; initialAtk: number }

export const ANBY_AFTERSHOCK_TARGET = actionTarget(
  [],
  ['aftershock'],
)

const ANBY_DASH_TARGET = actionTarget([canonicalAction('Dash Attack')])

const ANBY_ULTIMATE_TARGET = actionTarget([canonicalAction('Ultimate')])

const ANBY_BASIC_ULTIMATE_TARGET = actionTarget([
    canonicalAction('Basic Attack'),
    canonicalAction('Ultimate'),
])

function anbyAtkInputs(setup: CompleteSetup): ResolvedSetupInput[] {
  return presentSetupInputs([engineAdvancedInput(setup, 'anbySoldier0', 'atkPct'), mainStatInput(setup, 'anbySoldier0', 'slot5', 'atkPct'), mainStatInput(setup, 'anbySoldier0', 'slot6', 'atkPct'), discStatInput(setup, 'anbySoldier0', 'twoPiece', 'hormonePunk', equipmentEffectBaseValue(DRIVE_DISC_FACTS.hormonePunk.twoPiece.atk)), effectiveSubstatInput(setup, 'anbySoldier0', 'atkPct')])
}

export const observeAnby = (setup: CompleteSetup, hasStunOrSupport: boolean, isFocus: boolean): AnbyCalculationContext => {
  const initialAtk = initialAtkFor('anbySoldier0', setup)
  if (initialAtk === null) throw new Error('Complete Anby setup requires a W-Engine')
  return { agentId: 'anbySoldier0', setup, hasStunOrSupport, isFocus, initialAtk }
}

export function resolveAnbyProviderClauses(context: AnbyCalculationContext): SourceBoundCurrentClause[] {
  const { setup, hasStunOrSupport, isFocus } = context
  const engine = engineSource('anbySoldier0', setup)
  const shadow = setup.fourPieceId === 'shadowHarmony'
  const refinement = setup.refinement
  const engineCombatCrit = setup.engineId === 'severedInnocence'
    ? equipmentEffectBaseValue(W_ENGINE_FACTS.severedInnocence.effects.critDamage, refinement)
    : setup.engineId === 'heartstringNocturne'
      ? equipmentEffectBaseValue(W_ENGINE_FACTS.heartstringNocturne.effects.critDamage, refinement)
      : 0
  const severedStackCrit = setup.engineId === 'severedInnocence'
    ? equipmentEffectProgressionValue(W_ENGINE_FACTS.severedInnocence.effects.critDamage, refinement)
    : 0
  return active([
    additive('critDmg', 'combat', engine, engineCombatCrit, 'self'),
    additive('critDmg', 'fully', engine, severedStackCrit, 'self'),
    additive('critRate', 'combat', engine, setup.engineId === 'cordisGermina' ? equipmentEffectBaseValue(W_ENGINE_FACTS.cordisGermina.effects.critRate, refinement) : 0, 'self'),
    additive('critRate', 'fully', STATIC_SOURCES.anbySoldier0.additional, hasStunOrSupport ? 10 : 0, 'self'),
    additive('critRate', 'combat', mindscapeSource('anbySoldier0', 2), setup.mindscape >= 2 ? 12 : 0, 'self'),
    additive('critRate', 'fully', discSource('anbySoldier0', 'shadowHarmony', '4-piece'), shadow ? equipmentEffectBaseValue(DRIVE_DISC_FACTS.shadowHarmony.fourPiece.critRate) : 0, 'self'),
    percentage('atk', 'fully', discSource('anbySoldier0', 'shadowHarmony', '4-piece'), shadow ? equipmentEffectBaseValue(DRIVE_DISC_FACTS.shadowHarmony.fourPiece.atk) : 0, 'self'),
    percentage('atk', 'fully', engine, setup.engineId === 'marcatoDesire'
      ? equipmentEffectMaximumValue(W_ENGINE_FACTS.marcatoDesire.effects.atk, refinement)
      : setup.engineId === 'starlightEngine'
        ? equipmentEffectBaseValue(W_ENGINE_FACTS.starlightEngine.effects.atk, refinement)
        : 0, 'self'),
    additive('dmgBonus', 'fully', STATIC_SOURCES.anbySoldier0.core, 25, 'self'),
    additive('dmgBonus', 'fully', STATIC_SOURCES.anbySoldier0.additional, hasStunOrSupport && isFocus ? 50 : 0, 'all-party', ANBY_AFTERSHOCK_TARGET, undefined, ['anbySoldier0', 'trigger']),
    additive('dmgBonus', 'fully', engine, setup.engineId === 'severedInnocence' ? equipmentEffectBaseValue(W_ENGINE_FACTS.severedInnocence.effects.damage, refinement) : 0, 'self'),
    additive('dmgBonus', 'initial', discSource('anbySoldier0', 'shadowHarmony', '2-piece', '4-piece'), setup.fourPieceId === 'shadowHarmony' ? equipmentEffectBaseValue(DRIVE_DISC_FACTS.shadowHarmony.twoPiece.damage) : 0, 'self', ANBY_AFTERSHOCK_TARGET),
    additive('dmgBonus', 'initial', discSource('anbySoldier0', 'shadowHarmony', '2-piece', '4-piece'), setup.fourPieceId === 'shadowHarmony' ? equipmentEffectBaseValue(DRIVE_DISC_FACTS.shadowHarmony.twoPiece.damage) : 0, 'self', ANBY_DASH_TARGET),
    additive('dmgBonus', 'fully', engine, setup.engineId === 'cordisGermina' ? equipmentEffectMaximumValue(W_ENGINE_FACTS.cordisGermina.effects.damage, refinement) : 0, 'self'),
    additive('defIgnore', 'fully', engine, setup.engineId === 'cordisGermina' ? equipmentEffectBaseValue(W_ENGINE_FACTS.cordisGermina.effects.defIgnore, refinement) : 0, 'enemy-context', ANBY_BASIC_ULTIMATE_TARGET, undefined, ['anbySoldier0']),
    additive('resIgnore', 'fully', mindscapeSource('anbySoldier0', 4, 'Electric RES Ignore'), setup.mindscape >= 4 ? 12 : 0, 'enemy-context', undefined, undefined, ['anbySoldier0']),
    ...pufferElectroFourPieceClauses('anbySoldier0', setup, ANBY_ULTIMATE_TARGET),
  ])
}

export function anbyFullyCrit(setup: CompleteSetup, inbox: SourceBoundCurrentClause[], _hasStunOrSupport: boolean): number {
  const initial = VERTICAL_VALUES.anbySoldier0.critDmg
    + (engineAdvancedInput(setup, 'anbySoldier0', 'critDmg')?.rawValue ?? 0)
    + (mainStatInput(setup, 'anbySoldier0', 'slot4', 'critDmg')?.rawValue ?? 0)
    + (discStatInput(setup, 'anbySoldier0', 'twoPiece', 'branchAndBlade', equipmentEffectBaseValue(DRIVE_DISC_FACTS.branchAndBlade.twoPiece.critDamage))?.rawValue ?? 0)
    + (effectiveSubstatInput(setup, 'anbySoldier0', 'critDmg')?.rawValue ?? 0)
  return composeMetricEffects(surfaces(initial, initial, initial), surfaces([], [], []), resolveDeliveredClauses(inbox, {}), 'critDmg').values.fully
}

function optionalMetric(
  metric: EffectMetric,
  id: EffectMetric,
  label: string,
  effects: ReturnType<typeof resolveDeliveredClauses>,
): AgentResult['metrics'] {
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
  const critRateInputs = presentSetupInputs([engineAdvancedInput(setup, 'anbySoldier0', 'critRate'), mainStatInput(setup, 'anbySoldier0', 'slot4', 'critRate'), discStatInput(setup, 'anbySoldier0', 'twoPiece', 'woodpecker', equipmentEffectBaseValue(DRIVE_DISC_FACTS.woodpecker.twoPiece.critRate)), effectiveSubstatInput(setup, 'anbySoldier0', 'critRate')])
  const critRate = composeMetricEffects(surfaces(Math.min(values.critRate + critRateInputs.reduce((n, x) => n + x.rawValue, 0), 100), Math.min(values.critRate + critRateInputs.reduce((n, x) => n + x.rawValue, 0), 100), Math.min(values.critRate + critRateInputs.reduce((n, x) => n + x.rawValue, 0), 100)), surfaces(critRateInputs.map((x) => contribution(x.source, x.rawValue)), [], []), effects, 'critRate', { value: 100, source: STATIC_SOURCES.anbySoldier0.critCap })
  const critDmgInputs = presentSetupInputs([engineAdvancedInput(setup, 'anbySoldier0', 'critDmg'), mainStatInput(setup, 'anbySoldier0', 'slot4', 'critDmg'), discStatInput(setup, 'anbySoldier0', 'twoPiece', 'branchAndBlade', equipmentEffectBaseValue(DRIVE_DISC_FACTS.branchAndBlade.twoPiece.critDamage)), effectiveSubstatInput(setup, 'anbySoldier0', 'critDmg')])
  const critDmg = composeMetricEffects(surfaces(values.critDmg + critDmgInputs.reduce((n, x) => n + x.rawValue, 0), values.critDmg + critDmgInputs.reduce((n, x) => n + x.rawValue, 0), values.critDmg + critDmgInputs.reduce((n, x) => n + x.rawValue, 0)), surfaces(critDmgInputs.map((x) => contribution(x.source, x.rawValue)), [], []), effects, 'critDmg')
  const electricDmgInputs = presentSetupInputs([
    mainStatInput(setup, 'anbySoldier0', 'slot5', 'electricDmg'),
    discStatInput(setup, 'anbySoldier0', 'twoPiece', 'thunderMetal', equipmentEffectBaseValue(DRIVE_DISC_FACTS.thunderMetal.twoPiece.damage)),
  ])
  const initialElectricDmg = electricDmgInputs.reduce((total, input) => total + input.rawValue, 0)
  const penInputs = presentSetupInputs([
    mainStatInput(setup, 'anbySoldier0', 'slot5', 'penRatio'),
    discStatInput(
      setup,
      'anbySoldier0',
      'fourPiece',
      'pufferElectro',
      equipmentEffectBaseValue(DRIVE_DISC_FACTS.pufferElectro.twoPiece.penRatio),
      'twoPiece',
    ),
  ])
  const initialPen = penInputs.reduce((total, input) => total + input.rawValue, 0)
  const regular = composeMetricEffects(
    surfaces(initialElectricDmg, initialElectricDmg, initialElectricDmg),
    surfaces(electricDmgInputs.map((input) => contribution(input.source, input.rawValue)), [], []),
    effects,
    'dmgBonus',
  )
  const pen = composeMetricEffects(
    surfaces(initialPen, initialPen, initialPen),
    surfaces(penInputs.map((input) => contribution(input.source, input.rawValue)), [], []),
    effects,
    'penRatio',
  )
  const action = composeActionEffects(regular.values, effects, 'dmgBonus', ANBY_AFTERSHOCK_TARGET)
  const ultimate = composeActionEffects(action.values, effects, 'dmgBonus', ANBY_ULTIMATE_TARGET)
  const dash = composeActionEffects(regular.values, effects, 'dmgBonus', ANBY_DASH_TARGET)
  const aftershockCrit = composeActionEffects(critDmg.values, effects, 'critDmg', ANBY_AFTERSHOCK_TARGET)
  const actionModifiers: AgentResult['actionModifiers'] = [
    { id: 'anbyAftershock', outcomes: [...ANBY_AFTERSHOCK_TARGET.outcomes], tags: [...ANBY_AFTERSHOCK_TARGET.tags], metricId: 'dmgBonus', ...action },
    { id: 'anbyDash', outcomes: [...ANBY_DASH_TARGET.outcomes], tags: [...ANBY_DASH_TARGET.tags], metricId: 'dmgBonus', ...dash },
    { id: 'anbyAftershockCritDmg', outcomes: [...ANBY_AFTERSHOCK_TARGET.outcomes], tags: [...ANBY_AFTERSHOCK_TARGET.tags], metricId: 'critDmg', ...aftershockCrit },
  ]
  if (effects.some((effect) => effect.action === ANBY_ULTIMATE_TARGET && effect.metric === 'dmgBonus')) {
    actionModifiers.push({
      id: 'anbyUltimate',
      outcomes: [...ANBY_ULTIMATE_TARGET.outcomes],
      tags: [...ANBY_ULTIMATE_TARGET.tags],
      metricId: 'dmgBonus',
      baseActionId: 'anbyAftershock',
      ...ultimate,
    })
  }
  if (effects.some((effect) => effect.action === ANBY_BASIC_ULTIMATE_TARGET && effect.metric === 'defIgnore')) {
    actionModifiers.push({ id: 'anbyBasicUltimate', outcomes: [...ANBY_BASIC_ULTIMATE_TARGET.outcomes], tags: [...ANBY_BASIC_ULTIMATE_TARGET.tags], metricId: 'defIgnore', ...composeActionEffects(surfaces(0, 0, 0), effects, 'defIgnore', ANBY_BASIC_ULTIMATE_TARGET) })
  }
  return { agentId: 'anbySoldier0', metrics: [{ id: 'atk', label: 'ATK', unit: '', decimals: 0, ...atk }, { id: 'critRate', label: 'CRIT Rate', unit: '%', decimals: 1, ...critRate }, { id: 'critDmg', label: 'CRIT DMG', unit: '%', decimals: 1, ...critDmg }, { id: 'dmgBonus', label: 'DMG Bonus', unit: '%', decimals: 1, ...regular }, ...(pen.values.fully ? [{ id: 'penRatio' as const, label: 'PEN Ratio', unit: '%', decimals: 1, ...pen }] : []), ...optionalMetric('defIgnore', 'defIgnore', 'DEF Ignore', effects), ...optionalMetric('resIgnore', 'resIgnore', 'RES Ignore', effects), ...optionalMetric('resReduction', 'resReduction', 'RES Reduction', effects), ...optionalMetric('defReduction', 'defReduction', 'DEF Reduction', effects), ...optionalMetric('stunDmgMultiplier', 'stunDmgMultiplier', 'Stun DMG Multiplier', effects)], actionModifiers, operations: [] }
}
