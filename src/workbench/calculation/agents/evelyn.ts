import {
  DRIVE_DISC_FACTS,
  VERTICAL_VALUES,
  W_ENGINE_FACTS,
  W_ENGINES,
  equipmentEffectBaseValue,
  equipmentEffectProgressionIncrementValue,
  equipmentEffectProgressionValue,
} from '../../content'
import {
  STATIC_SOURCES,
  active,
  additive,
  discSource,
  discStatInput,
  effectiveSubstatInput,
  engineAdvancedInput,
  engineSource,
  mainStatInput,
  mindscapeSource,
  presentSetupInputs,
  pufferElectroFourPieceClauses,
  resolveDeliveredClauses,
  withApplicability,
  type CompleteSetup,
  type EffectMetric,
  type ResolvedSetupInput,
  type SourceBoundCurrentClause,
  type SurfaceKey,
} from '../../effects'
import { actionTarget, canonicalAction } from '../../actions'
import {
  composeActionHierarchy,
  composeMetricEffects,
  contribution,
  percentageContribution,
  surfaces,
  type ActionScopeNode,
} from '../composition'
import { initialAtkFor } from '../initial-atk'
import type { AgentResult, GaugeResult, ResultOperation } from '../result'

export interface EvelynCalculationContext {
  agentId: 'evelyn'
  setup: CompleteSetup
  hasStunOrSupport: boolean
  initialAtk: number
}

const EVELYN_CHAIN_ULTIMATE = actionTarget([
  canonicalAction('Chain Attack'),
  canonicalAction('Ultimate'),
])

const EVELYN_ULTIMATE = actionTarget([canonicalAction('Ultimate')])

const EVELYN_BASIC_ULTIMATE = actionTarget([
  canonicalAction('Basic Attack'),
  canonicalAction('Ultimate'),
])

const EVELYN_ACTION_SCOPES = [{
  id: 'evelynChainUltimate',
  target: EVELYN_CHAIN_ULTIMATE,
  children: [{ id: 'evelynUltimate', target: EVELYN_ULTIMATE }],
}] satisfies readonly ActionScopeNode[]

const EVELYN_CORDIS_SCOPES = [{
  id: 'evelynBasicUltimate',
  target: EVELYN_BASIC_ULTIMATE,
}] satisfies readonly ActionScopeNode[]

function evelynAtkInputs(setup: CompleteSetup): ResolvedSetupInput[] {
  return presentSetupInputs([
    engineAdvancedInput(setup, 'evelyn', 'atkPct'),
    mainStatInput(setup, 'evelyn', 'slot5', 'atkPct'),
    mainStatInput(setup, 'evelyn', 'slot6', 'atkPct'),
    discStatInput(setup, 'evelyn', 'fourPiece', 'hormonePunk',
      equipmentEffectBaseValue(DRIVE_DISC_FACTS.hormonePunk.twoPiece.atk), 'twoPiece'),
    discStatInput(setup, 'evelyn', 'twoPiece', 'hormonePunk',
      equipmentEffectBaseValue(DRIVE_DISC_FACTS.hormonePunk.twoPiece.atk)),
    discStatInput(setup, 'evelyn', 'fourPiece', 'astralVoice',
      equipmentEffectBaseValue(DRIVE_DISC_FACTS.astralVoice.twoPiece.atk), 'twoPiece'),
    effectiveSubstatInput(setup, 'evelyn', 'atkPct'),
  ])
}

export function observeEvelyn(
  setup: CompleteSetup,
  hasStunOrSupport: boolean,
): EvelynCalculationContext {
  const initialAtk = initialAtkFor('evelyn', setup)
  if (initialAtk === null) throw new Error('Complete Evelyn setup requires a W-Engine')
  return { agentId: 'evelyn', setup, hasStunOrSupport, initialAtk }
}

export function resolveEvelynProviderClauses(
  context: EvelynCalculationContext,
): SourceBoundCurrentClause[] {
  const { setup, hasStunOrSupport } = context
  const engine = engineSource('evelyn', setup)
  const refinement = setup.refinement
  const baseAtk = VERTICAL_VALUES.evelyn.atk + W_ENGINES[setup.engineId].baseAtk
  const heartstringRes = setup.engineId === 'heartstringNocturne'
    ? equipmentEffectProgressionIncrementValue(
        W_ENGINE_FACTS.heartstringNocturne.effects.fireResIgnore,
        refinement,
      )
    : 0
  const cordisDefIgnore = setup.engineId === 'cordisGermina'
    ? equipmentEffectBaseValue(W_ENGINE_FACTS.cordisGermina.effects.defIgnore, refinement)
    : 0

  return active([
    additive('critRate', 'combat', STATIC_SOURCES.evelyn.core,
      VERTICAL_VALUES.evelyn.coreCritRate, 'self'),
    additive('dmgBonus', 'combat', STATIC_SOURCES.evelyn.additional,
      hasStunOrSupport ? VERTICAL_VALUES.evelyn.additionalChainUltimateDmg : 0,
      'self', EVELYN_CHAIN_ULTIMATE),
    additive('defIgnore', 'combat', mindscapeSource('evelyn', 1, 'Bound enemies'),
      setup.mindscape >= 1 ? VERTICAL_VALUES.evelyn.mindscapeDefIgnore : 0,
      'enemy-context', undefined, undefined, ['evelyn']),
    additive('atk', 'combat', mindscapeSource('evelyn', 2),
      setup.mindscape >= 2 ? baseAtk * VERTICAL_VALUES.evelyn.mindscapeAtk / 100 : 0,
      'self', undefined, setup.mindscape >= 2
        ? { value: VERTICAL_VALUES.evelyn.mindscapeAtk, unit: '%', decimals: 0 }
        : undefined),
    additive('critDmg', 'fully', mindscapeSource('evelyn', 4),
      setup.mindscape >= 4 ? VERTICAL_VALUES.evelyn.mindscapeCritDmg : 0, 'self'),

    additive('critDmg', 'combat', engine,
      setup.engineId === 'heartstringNocturne'
        ? equipmentEffectBaseValue(W_ENGINE_FACTS.heartstringNocturne.effects.critDamage, refinement)
        : setup.engineId === 'severedInnocence'
          ? equipmentEffectBaseValue(W_ENGINE_FACTS.severedInnocence.effects.critDamage, refinement)
          : 0,
      'self'),
    additive('critDmg', 'fully', engine,
      setup.engineId === 'severedInnocence'
        ? equipmentEffectProgressionValue(W_ENGINE_FACTS.severedInnocence.effects.critDamage, refinement)
        : 0,
      'self'),
    withApplicability(
      additive('resIgnore', 'combat', engine, heartstringRes,
        'enemy-context', EVELYN_CHAIN_ULTIMATE, undefined, ['evelyn']),
      { attributes: ['Fire'] },
    ),
    withApplicability(
      additive('resIgnore', 'fully', engine, heartstringRes,
        'enemy-context', EVELYN_CHAIN_ULTIMATE, undefined, ['evelyn']),
      { attributes: ['Fire'] },
    ),
    additive('critRate', 'combat', engine,
      setup.engineId === 'cordisGermina'
        ? equipmentEffectBaseValue(W_ENGINE_FACTS.cordisGermina.effects.critRate, refinement)
        : 0,
      'self'),
    additive('defIgnore', 'fully', engine, cordisDefIgnore,
      'enemy-context', EVELYN_BASIC_ULTIMATE, undefined, ['evelyn']),
    additive('atk', 'fully', engine,
      setup.engineId === 'starlightEngine'
        ? baseAtk * equipmentEffectBaseValue(W_ENGINE_FACTS.starlightEngine.effects.atk, refinement) / 100
        : 0,
      'self', undefined, setup.engineId === 'starlightEngine'
        ? {
          value: equipmentEffectBaseValue(W_ENGINE_FACTS.starlightEngine.effects.atk, refinement),
          unit: '%',
          decimals: 1,
        }
        : undefined),
    additive('dmgBonus', 'fully', engine,
      setup.engineId === 'steelCushion'
        ? equipmentEffectBaseValue(W_ENGINE_FACTS.steelCushion.effects.damage, refinement)
        : 0,
      'self'),

    additive('atk', 'combat', discSource('evelyn', 'hormonePunk', '4-piece'),
      setup.fourPieceId === 'hormonePunk'
        ? baseAtk * equipmentEffectBaseValue(DRIVE_DISC_FACTS.hormonePunk.fourPiece.atk) / 100
        : 0,
      'self', undefined, setup.fourPieceId === 'hormonePunk'
        ? {
          value: equipmentEffectBaseValue(DRIVE_DISC_FACTS.hormonePunk.fourPiece.atk),
          unit: '%',
          decimals: 0,
        }
        : undefined),
    additive('atk', 'fully', discSource('evelyn', 'woodpecker', '4-piece'),
      setup.fourPieceId === 'woodpecker'
        ? baseAtk * equipmentEffectBaseValue(DRIVE_DISC_FACTS.woodpecker.fourPiece.atk) / 100
        : 0,
      'self', undefined, setup.fourPieceId === 'woodpecker'
        ? {
          value: equipmentEffectBaseValue(DRIVE_DISC_FACTS.woodpecker.fourPiece.atk),
          unit: '%',
          decimals: 0,
        }
        : undefined),
    ...pufferElectroFourPieceClauses('evelyn', setup, EVELYN_ULTIMATE),
  ])
}

function optionalMetric(
  metric: EffectMetric,
  label: string,
  effects: ReturnType<typeof resolveDeliveredClauses>,
  actions: AgentResult['actionModifiers'] = [],
): AgentResult['metrics'] {
  const data = composeMetricEffects(surfaces(0, 0, 0), surfaces([], [], []), effects, metric)
  return data.values.fully === 0 && !actions.some(({ metricId }) => metricId === metric)
    ? []
    : [{ id: metric, label, unit: '%', decimals: 1, ...data }]
}

function additionalScale(
  hasStunOrSupport: boolean,
  critRate: Record<SurfaceKey, number>,
): { gauge?: GaugeResult; operation?: ResultOperation } {
  if (!hasStunOrSupport) return {}

  const threshold = VERTICAL_VALUES.evelyn.additionalCritThreshold
  const qualifyingSurface = critRate.combat >= threshold
    ? 'combat'
    : critRate.fully >= threshold
      ? 'fully'
      : null
  const basisSurface = qualifyingSurface ?? 'fully'
  const multiplier = qualifyingSurface
    ? VERTICAL_VALUES.evelyn.additionalMultiplier
    : 1
  const basisLabel = basisSurface === 'combat'
    ? 'Combat CRIT Rate'
    : 'Fully Enabled CRIT Rate'
  const label = 'Chain Attack & Ultimate DMG Multiplier'
  const gauge: GaugeResult = {
    source: STATIC_SOURCES.evelyn.additional,
    basisLabel,
    current: critRate[basisSurface],
    threshold,
    cap: threshold,
    outputLabel: label,
    outputValue: multiplier,
    outputUnit: '',
    presentation: 'scale',
    decimals: { current: 1, threshold: 0, cap: 0, output: 2 },
  }
  return qualifyingSurface
    ? {
      gauge,
      operation: {
        id: 'evelynChainUltimateDmgMultiplier',
        label,
        source: STATIC_SOURCES.evelyn.additional,
        surface: qualifyingSurface,
        value: multiplier,
        unit: '',
        presentation: 'scale',
      },
    }
    : { gauge }
}

export function calculateEvelyn(
  context: EvelynCalculationContext,
  inbox: SourceBoundCurrentClause[],
  enemy: SourceBoundCurrentClause[],
): AgentResult {
  const { setup, initialAtk } = context
  const values = VERTICAL_VALUES.evelyn
  const baseAtk = values.atk + W_ENGINES[setup.engineId].baseAtk
  const effects = resolveDeliveredClauses([...inbox, ...enemy], { atk: initialAtk })
  const atkInputs = evelynAtkInputs(setup)
  const atk = composeMetricEffects(
    surfaces(initialAtk, initialAtk, initialAtk),
    surfaces(atkInputs.map((input) => percentageContribution(
      input.source,
      baseAtk * input.rawValue / 100,
      input.rawValue,
    )), [], []),
    effects,
    'atk',
  )

  const critRateInputs = presentSetupInputs([
    engineAdvancedInput(setup, 'evelyn', 'critRate'),
    mainStatInput(setup, 'evelyn', 'slot4', 'critRate'),
    discStatInput(setup, 'evelyn', 'fourPiece', 'woodpecker',
      equipmentEffectBaseValue(DRIVE_DISC_FACTS.woodpecker.twoPiece.critRate), 'twoPiece'),
    discStatInput(setup, 'evelyn', 'twoPiece', 'woodpecker',
      equipmentEffectBaseValue(DRIVE_DISC_FACTS.woodpecker.twoPiece.critRate)),
    effectiveSubstatInput(setup, 'evelyn', 'critRate'),
  ])
  const initialCritRate = values.critRate
    + critRateInputs.reduce((total, input) => total + input.rawValue, 0)
  const critRate = composeMetricEffects(
    surfaces(initialCritRate, initialCritRate, initialCritRate),
    surfaces(critRateInputs.map((input) => contribution(input.source, input.rawValue)), [], []),
    effects,
    'critRate',
    { value: 100, source: STATIC_SOURCES.evelyn.critCap },
  )

  const critDmgInputs = presentSetupInputs([
    engineAdvancedInput(setup, 'evelyn', 'critDmg'),
    mainStatInput(setup, 'evelyn', 'slot4', 'critDmg'),
    discStatInput(setup, 'evelyn', 'twoPiece', 'branchAndBlade',
      equipmentEffectBaseValue(DRIVE_DISC_FACTS.branchAndBlade.twoPiece.critDamage)),
    effectiveSubstatInput(setup, 'evelyn', 'critDmg'),
  ])
  const initialCritDmg = values.critDmg
    + critDmgInputs.reduce((total, input) => total + input.rawValue, 0)
  const critDmg = composeMetricEffects(
    surfaces(initialCritDmg, initialCritDmg, initialCritDmg),
    surfaces(critDmgInputs.map((input) => contribution(input.source, input.rawValue)), [], []),
    effects,
    'critDmg',
  )

  const fireDmgInputs = presentSetupInputs([
    mainStatInput(setup, 'evelyn', 'slot5', 'fireDmg'),
    discStatInput(setup, 'evelyn', 'twoPiece', 'infernoMetal',
      equipmentEffectBaseValue(DRIVE_DISC_FACTS.infernoMetal.twoPiece.damage)),
  ])
  const initialDmg = fireDmgInputs.reduce((total, input) => total + input.rawValue, 0)
  const regular = composeMetricEffects(
    surfaces(initialDmg, initialDmg, initialDmg),
    surfaces(fireDmgInputs.map((input) => contribution(input.source, input.rawValue)), [], []),
    effects,
    'dmgBonus',
  )

  const penInputs = presentSetupInputs([
    mainStatInput(setup, 'evelyn', 'slot5', 'penRatio'),
    discStatInput(setup, 'evelyn', 'twoPiece', 'pufferElectro',
      equipmentEffectBaseValue(DRIVE_DISC_FACTS.pufferElectro.twoPiece.penRatio)),
    discStatInput(setup, 'evelyn', 'fourPiece', 'pufferElectro',
      equipmentEffectBaseValue(DRIVE_DISC_FACTS.pufferElectro.twoPiece.penRatio), 'twoPiece'),
  ])
  const initialPen = penInputs.reduce((total, input) => total + input.rawValue, 0)
  const pen = composeMetricEffects(
    surfaces(initialPen, initialPen, initialPen),
    surfaces(penInputs.map((input) => contribution(input.source, input.rawValue)), [], []),
    effects,
    'penRatio',
  )

  const broadDefIgnore = composeMetricEffects(surfaces(0, 0, 0), surfaces([], [], []), effects, 'defIgnore')
  const broadResIgnore = composeMetricEffects(surfaces(0, 0, 0), surfaces([], [], []), effects, 'resIgnore')
  const actionModifiers: AgentResult['actionModifiers'] = [
    ...composeActionHierarchy(regular.values, effects, 'dmgBonus', EVELYN_ACTION_SCOPES),
    ...composeActionHierarchy(broadResIgnore.values, effects, 'resIgnore', EVELYN_ACTION_SCOPES, 'ResIgnore'),
    ...composeActionHierarchy(broadDefIgnore.values, effects, 'defIgnore', EVELYN_CORDIS_SCOPES, 'DefIgnore'),
  ]
  const scale = additionalScale(context.hasStunOrSupport, critRate.values)

  return {
    agentId: 'evelyn',
    metrics: [
      { id: 'atk', label: 'ATK', unit: '', decimals: 0, ...atk },
      {
        id: 'critRate', label: 'CRIT Rate', unit: '%', decimals: 1, ...critRate,
        ...(scale.gauge ? { gauge: scale.gauge } : {}),
      },
      { id: 'critDmg', label: 'CRIT DMG', unit: '%', decimals: 1, ...critDmg },
      { id: 'dmgBonus', label: 'DMG Bonus', unit: '%', decimals: 1, ...regular },
      ...(pen.values.fully
        ? [{ id: 'penRatio' as const, label: 'PEN Ratio', unit: '%', decimals: 1, ...pen }]
        : []),
      ...optionalMetric('defIgnore', 'DEF Ignore', effects, actionModifiers),
      ...optionalMetric('defReduction', 'DEF Reduction', effects),
      ...optionalMetric('resIgnore', 'RES Ignore', effects, actionModifiers),
      ...optionalMetric('resReduction', 'RES Reduction', effects),
      ...optionalMetric('stunDmgMultiplier', 'Stun DMG Multiplier', effects),
    ],
    actionModifiers,
    operations: scale.operation ? [scale.operation] : [],
  }
}
