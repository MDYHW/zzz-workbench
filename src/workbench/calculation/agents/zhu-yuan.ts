import {
  DRIVE_DISC_FACTS,
  SOURCE_LABELS,
  VERTICAL_VALUES,
  W_ENGINE_FACTS,
  W_ENGINES,
  equipmentEffectBaseValue,
  equipmentEffectMaximumValue,
} from '../../content'
import {
  active,
  additive,
  discSource,
  discStatInput,
  effectiveSubstatInput,
  engineAdvancedInput,
  engineSource,
  mainStatInput,
  mindscapeSource,
  percentage,
  pufferElectroFourPieceClauses,
  presentSetupInputs,
  resolveDeliveredClauses,
  source,
  withApplicability,
  type CompleteSetup,
  type EffectMetric,
  type SourceBoundCurrentClause,
} from '../../effects'
import { actionTarget, canonicalAction, sourceLocalAction } from '../../actions'
import {
  composeActionHierarchy,
  composeMetricEffects,
  contribution,
  percentageContribution,
  surfaces,
  type ActionScopeNode,
} from '../composition'
import { initialAtkFor } from '../initial-atk'
import type { AgentResult } from '../result'

export interface ZhuYuanCalculationContext {
  agentId: 'zhuYuan'
  setup: CompleteSetup
  additionalActive: boolean
  initialAtk: number
}

const BASIC = actionTarget([canonicalAction('Basic Attack')])
const DASH = actionTarget([canonicalAction('Dash Attack')])
const ULTIMATE = actionTarget([canonicalAction('Ultimate')])
const BASIC_ULTIMATE = actionTarget([
  canonicalAction('Basic Attack'), canonicalAction('Ultimate'),
])
const ENHANCED_BASIC = actionTarget([
  sourceLocalAction('Enhanced Shotshell Basic Attack', 'Basic Attack'),
])
const ENHANCED_DASH = actionTarget([
  sourceLocalAction('Enhanced Shotshell Dash Attack', 'Dash Attack'),
])
const STUNNED_ENHANCED_BASIC = actionTarget([
  sourceLocalAction('Enhanced Shotshell Basic Attack against Stunned enemies', 'Basic Attack'),
])
const STUNNED_ENHANCED_DASH = actionTarget([
  sourceLocalAction('Enhanced Shotshell Dash Attack against Stunned enemies', 'Dash Attack'),
])

const DAMAGE_SCOPES = [
  {
    id: 'zhuYuanBasic', target: BASIC,
    children: [{
      id: 'zhuYuanEnhancedBasic', target: ENHANCED_BASIC,
      children: [{ id: 'zhuYuanStunnedEnhancedBasic', target: STUNNED_ENHANCED_BASIC }],
    }],
  },
  {
    id: 'zhuYuanDash', target: DASH,
    children: [{
      id: 'zhuYuanEnhancedDash', target: ENHANCED_DASH,
      children: [{ id: 'zhuYuanStunnedEnhancedDash', target: STUNNED_ENHANCED_DASH }],
    }],
  },
  { id: 'zhuYuanUltimate', target: ULTIMATE },
] satisfies readonly ActionScopeNode[]

const DEF_SCOPES = [
  { id: 'zhuYuanBasicUltimate', target: BASIC_ULTIMATE },
] satisfies readonly ActionScopeNode[]
const RES_SCOPES = [
  { id: 'zhuYuanEnhancedBasic', target: ENHANCED_BASIC },
  { id: 'zhuYuanEnhancedDash', target: ENHANCED_DASH },
] satisfies readonly ActionScopeNode[]

export function observeZhuYuan(
  setup: CompleteSetup,
  additionalActive: boolean,
): ZhuYuanCalculationContext {
  const initialAtk = initialAtkFor('zhuYuan', setup)
  if (initialAtk === null) throw new Error('Complete Zhu Yuan setup requires a W-Engine')
  return { agentId: 'zhuYuan', setup, additionalActive, initialAtk }
}

export function resolveZhuYuanProviderClauses(
  context: ZhuYuanCalculationContext,
): SourceBoundCurrentClause[] {
  const { setup, additionalActive } = context
  const values = VERTICAL_VALUES.zhuYuan
  const engine = engineSource('zhuYuan', setup)
  const refinement = setup.refinement
  const core = source(SOURCE_LABELS.zhuYuanCore, 'zhuYuan', 'core')
  const additional = source(SOURCE_LABELS.zhuYuanAbility, 'zhuYuan', 'additional')

  return active([
    ...[ENHANCED_BASIC, ENHANCED_DASH].map((target) => withApplicability(
      additive('dmgBonus', 'fully', core, values.coreEnhancedDmg, 'self', target),
      { attributes: ['Ether'] },
    )),
    ...[STUNNED_ENHANCED_BASIC, STUNNED_ENHANCED_DASH].map((target) => withApplicability(
      additive('dmgBonus', 'fully', core, values.coreStunnedDmg, 'self', target),
      { attributes: ['Ether'] },
    )),
    additive('critRate', 'fully', additional,
      additionalActive ? values.additionalCritRate : 0, 'self'),
    ...[ENHANCED_BASIC, ENHANCED_DASH].map((target) => withApplicability(
      additive('dmgBonus', 'fully', mindscapeSource('zhuYuan', 2, '5 stacks'),
        setup.mindscape >= 2 ? values.mindscapeEnhancedDmg : 0, 'self', target),
      { attributes: ['Ether'] },
    )),
    ...[ENHANCED_BASIC, ENHANCED_DASH].map((target) => withApplicability(
      additive('resIgnore', 'fully', mindscapeSource('zhuYuan', 4),
        setup.mindscape >= 4 ? values.mindscapeEtherResIgnore : 0,
        'enemy-context', target, undefined, ['zhuYuan']),
      { attributes: ['Ether'] },
    )),
    additive('critRate', 'combat', engine,
      setup.engineId === 'cordisGermina'
        ? equipmentEffectBaseValue(W_ENGINE_FACTS.cordisGermina.effects.critRate, refinement)
        : setup.engineId === 'riotSuppressorMarkVI'
          ? equipmentEffectBaseValue(W_ENGINE_FACTS.riotSuppressorMarkVI.effects.critRate, refinement)
          : 0,
      'self'),
    additive('critDmg', 'combat', engine,
      setup.engineId === 'heartstringNocturne'
        ? equipmentEffectBaseValue(W_ENGINE_FACTS.heartstringNocturne.effects.critDamage, refinement)
        : 0,
      'self'),
    additive('defIgnore', 'fully', engine,
      setup.engineId === 'cordisGermina'
        ? equipmentEffectBaseValue(W_ENGINE_FACTS.cordisGermina.effects.defIgnore, refinement)
        : 0,
      'enemy-context', BASIC_ULTIMATE, undefined, ['zhuYuan']),
    ...[BASIC, DASH].map((target) => withApplicability(
      additive('dmgBonus', 'fully', engine,
        setup.engineId === 'riotSuppressorMarkVI'
          ? equipmentEffectBaseValue(W_ENGINE_FACTS.riotSuppressorMarkVI.effects.chargedEtherDamage, refinement)
          : 0,
        'self', target),
      { attributes: ['Ether'] },
    )),
    percentage('atk', 'fully', engine,
      setup.engineId === 'brimstone'
        ? equipmentEffectMaximumValue(W_ENGINE_FACTS.brimstone.effects.atk, refinement)
        : 0,
      'self'),
    percentage('atk', 'fully', engine,
      setup.engineId === 'marcatoDesire'
        ? equipmentEffectMaximumValue(W_ENGINE_FACTS.marcatoDesire.effects.atk, refinement)
        : setup.engineId === 'starlightEngine'
          ? equipmentEffectBaseValue(W_ENGINE_FACTS.starlightEngine.effects.atk, refinement)
          : 0,
      'self'),
    percentage('atk', 'fully', discSource('zhuYuan', 'woodpecker', '4-piece'),
      setup.fourPieceId === 'woodpecker'
        ? equipmentEffectBaseValue(DRIVE_DISC_FACTS.woodpecker.fourPiece.atk)
        : 0,
      'self'),
    additive('critDmg', 'fully', discSource('zhuYuan', 'chaoticMetal', '4-piece'),
      setup.fourPieceId === 'chaoticMetal'
        ? equipmentEffectMaximumValue(DRIVE_DISC_FACTS.chaoticMetal.fourPiece.critDamage)
        : 0,
      'self'),
    ...pufferElectroFourPieceClauses('zhuYuan', setup, ULTIMATE),
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

export function calculateZhuYuan(
  context: ZhuYuanCalculationContext,
  inbox: SourceBoundCurrentClause[],
  enemy: SourceBoundCurrentClause[],
): AgentResult {
  const { setup, initialAtk } = context
  const values = VERTICAL_VALUES.zhuYuan
  const baseAtk = values.atk + W_ENGINES[setup.engineId].baseAtk
  const effects = resolveDeliveredClauses([...inbox, ...enemy], { atk: initialAtk })
  const atkInputs = presentSetupInputs([
    engineAdvancedInput(setup, 'zhuYuan', 'atkPct'),
    mainStatInput(setup, 'zhuYuan', 'slot5', 'atkPct'),
    mainStatInput(setup, 'zhuYuan', 'slot6', 'atkPct'),
    discStatInput(setup, 'zhuYuan', 'twoPiece', 'astralVoice',
      equipmentEffectBaseValue(DRIVE_DISC_FACTS.astralVoice.twoPiece.atk)),
    discStatInput(setup, 'zhuYuan', 'twoPiece', 'hormonePunk',
      equipmentEffectBaseValue(DRIVE_DISC_FACTS.hormonePunk.twoPiece.atk)),
    effectiveSubstatInput(setup, 'zhuYuan', 'atkPct'),
  ])
  const atk = composeMetricEffects(
    surfaces(initialAtk, initialAtk, initialAtk),
    surfaces(atkInputs.map((input) => percentageContribution(
      input.source, baseAtk * input.rawValue / 100, input.rawValue,
    )), [], []),
    effects,
    'atk',
  )
  const critRateInputs = presentSetupInputs([
    engineAdvancedInput(setup, 'zhuYuan', 'critRate'),
    mainStatInput(setup, 'zhuYuan', 'slot4', 'critRate'),
    discStatInput(setup, 'zhuYuan', 'fourPiece', 'woodpecker',
      equipmentEffectBaseValue(DRIVE_DISC_FACTS.woodpecker.twoPiece.critRate), 'twoPiece'),
    discStatInput(setup, 'zhuYuan', 'twoPiece', 'woodpecker',
      equipmentEffectBaseValue(DRIVE_DISC_FACTS.woodpecker.twoPiece.critRate)),
    effectiveSubstatInput(setup, 'zhuYuan', 'critRate'),
  ])
  const initialCritRate = values.critRate
    + critRateInputs.reduce((sum, input) => sum + input.rawValue, 0)
  const critRate = composeMetricEffects(
    surfaces(initialCritRate, initialCritRate, initialCritRate),
    surfaces(critRateInputs.map((input) => contribution(input.source, input.rawValue)), [], []),
    effects,
    'critRate',
    { value: 100, source: source('CRIT Rate cap', 'zhuYuan', 'calculation') },
  )
  const critDmgInputs = presentSetupInputs([
    engineAdvancedInput(setup, 'zhuYuan', 'critDmg'),
    mainStatInput(setup, 'zhuYuan', 'slot4', 'critDmg'),
    discStatInput(setup, 'zhuYuan', 'twoPiece', 'branchAndBlade',
      equipmentEffectBaseValue(DRIVE_DISC_FACTS.branchAndBlade.twoPiece.critDamage)),
    effectiveSubstatInput(setup, 'zhuYuan', 'critDmg'),
  ])
  const initialCritDmg = values.critDmg
    + critDmgInputs.reduce((sum, input) => sum + input.rawValue, 0)
  const critDmg = composeMetricEffects(
    surfaces(initialCritDmg, initialCritDmg, initialCritDmg),
    surfaces(critDmgInputs.map((input) => contribution(input.source, input.rawValue)), [], []),
    effects,
    'critDmg',
  )
  const dmgInputs = presentSetupInputs([
    mainStatInput(setup, 'zhuYuan', 'slot5', 'etherDmg'),
    discStatInput(setup, 'zhuYuan', 'fourPiece', 'chaoticMetal',
      equipmentEffectBaseValue(DRIVE_DISC_FACTS.chaoticMetal.twoPiece.damage), 'twoPiece'),
    discStatInput(setup, 'zhuYuan', 'twoPiece', 'chaoticMetal',
      equipmentEffectBaseValue(DRIVE_DISC_FACTS.chaoticMetal.twoPiece.damage)),
  ])
  const initialDmg = dmgInputs.reduce((sum, input) => sum + input.rawValue, 0)
  const dmg = composeMetricEffects(
    surfaces(initialDmg, initialDmg, initialDmg),
    surfaces(dmgInputs.map((input) => contribution(input.source, input.rawValue)), [], []),
    effects,
    'dmgBonus',
  )
  const penInputs = presentSetupInputs([
    mainStatInput(setup, 'zhuYuan', 'slot5', 'penRatio'),
    discStatInput(setup, 'zhuYuan', 'fourPiece', 'pufferElectro',
      equipmentEffectBaseValue(DRIVE_DISC_FACTS.pufferElectro.twoPiece.penRatio), 'twoPiece'),
    discStatInput(setup, 'zhuYuan', 'twoPiece', 'pufferElectro',
      equipmentEffectBaseValue(DRIVE_DISC_FACTS.pufferElectro.twoPiece.penRatio)),
  ])
  const initialPen = penInputs.reduce((sum, input) => sum + input.rawValue, 0)
  const pen = composeMetricEffects(
    surfaces(initialPen, initialPen, initialPen),
    surfaces(penInputs.map((input) => contribution(input.source, input.rawValue)), [], []),
    effects,
    'penRatio',
  )
  const broadDef = composeMetricEffects(surfaces(0, 0, 0), surfaces([], [], []), effects, 'defIgnore')
  const broadRes = composeMetricEffects(surfaces(0, 0, 0), surfaces([], [], []), effects, 'resIgnore')
  const actionModifiers = [
    ...composeActionHierarchy(dmg.values, effects, 'dmgBonus', DAMAGE_SCOPES),
    ...composeActionHierarchy(broadDef.values, effects, 'defIgnore', DEF_SCOPES, 'DefIgnore'),
    ...composeActionHierarchy(broadRes.values, effects, 'resIgnore', RES_SCOPES, 'ResIgnore'),
  ]

  return {
    agentId: 'zhuYuan',
    metrics: [
      { id: 'atk', label: 'ATK', unit: '', decimals: 0, ...atk },
      { id: 'critRate', label: 'CRIT Rate', unit: '%', decimals: 1, ...critRate },
      { id: 'critDmg', label: 'CRIT DMG', unit: '%', decimals: 1, ...critDmg },
      { id: 'dmgBonus', label: 'DMG Bonus', unit: '%', decimals: 1, ...dmg },
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
    operations: [],
  }
}
