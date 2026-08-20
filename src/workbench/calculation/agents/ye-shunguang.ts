import {
  DRIVE_DISC_FACTS,
  VERTICAL_VALUES,
  W_ENGINE_FACTS,
  W_ENGINES,
  equipmentEffectBaseValue,
  equipmentEffectMaximumValue,
} from '../../content'
import {
  STATIC_SOURCES,
  active,
  additive,
  discSource,
  selectedDiscTwoPieceInputs,
  effectiveSubstatInput,
  engineAdvancedInput,
  engineSource,
  mainStatInput,
  mindscapeSource,
  percentage,
  presentSetupInputs,
  pufferElectroFourPieceClauses,
  resolveDeliveredClauses,
  withApplicability,
  type CompleteSetup,
  type EffectMetric,
  type SourceBoundCurrentClause,
} from '../../effects'
import { actionTarget, sourceLocalAction } from '../../actions'
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

export interface YeShunguangCalculationContext {
  agentId: 'yeShunguang'
  setup: CompleteSetup
  initialAtk: number
}

const YE_EX_SPECIAL = actionTarget([
  sourceLocalAction(
    'EX Special Attack: Enlightened Mind - Soaring Light',
    'EX Special Attack',
  ),
])
const YE_ULTIMATE = actionTarget([
  sourceLocalAction('Ultimate: Cleaving Heavens', 'Ultimate'),
])
const YE_BACK_ATTACK = actionTarget([sourceLocalAction('Back attacks')])
const YE_M2_ACTIONS = actionTarget([
  sourceLocalAction(
    'EX Special Attack: Enlightened Mind - Soaring Light',
    'EX Special Attack',
  ),
  sourceLocalAction('Ultimate: Cleaving Heavens', 'Ultimate'),
])

const DAMAGE_SCOPES = [
  { id: 'yeExSpecialDmg', target: YE_EX_SPECIAL },
  { id: 'yeUltimateDmg', target: YE_ULTIMATE },
  { id: 'yeBackAttackDmg', target: YE_BACK_ATTACK },
] satisfies readonly ActionScopeNode[]

const DEF_IGNORE_SCOPES = [
  { id: 'yeEnlightenedActions', target: YE_M2_ACTIONS },
] satisfies readonly ActionScopeNode[]

export function observeYeShunguang(
  setup: CompleteSetup,
): YeShunguangCalculationContext {
  const initialAtk = initialAtkFor('yeShunguang', setup)
  if (initialAtk === null) {
    throw new Error('Complete Ye Shunguang setup requires a W-Engine')
  }
  return { agentId: 'yeShunguang', setup, initialAtk }
}

export function resolveYeShunguangProviderClauses(
  context: YeShunguangCalculationContext,
): SourceBoundCurrentClause[] {
  const { setup } = context
  const values = VERTICAL_VALUES.yeShunguang
  const refinement = setup.refinement
  const engine = engineSource('yeShunguang', setup)
  return active([
    additive(
      'critRate', 'combat', STATIC_SOURCES.yeShunguang.core,
      values.unityCritRate, 'self',
    ),
    additive(
      'dmgBonus', 'combat', STATIC_SOURCES.yeShunguang.core,
      values.unityDmg, 'self',
    ),
    additive(
      'dmgBonus', 'combat', mindscapeSource('yeShunguang', 1, 'Unity'),
      setup.mindscape >= 1 ? values.mindscapeUnityDmg : 0, 'self',
    ),
    additive(
      'defIgnore', 'combat', mindscapeSource('yeShunguang', 1),
      setup.mindscape >= 1 ? values.mindscapeDefIgnore : 0,
      'enemy-context', undefined, undefined, ['yeShunguang'],
    ),
    additive(
      'defIgnore', 'fully', mindscapeSource('yeShunguang', 2, 'Enlightened Mind'),
      setup.mindscape >= 2 ? values.mindscapeActionDefIgnore : 0,
      'enemy-context', YE_M2_ACTIONS, undefined, ['yeShunguang'],
    ),

    withApplicability(
      additive(
        'resIgnore', 'combat', engine,
        setup.engineId === 'cloudcleaveRadiance'
          ? equipmentEffectBaseValue(
            W_ENGINE_FACTS.cloudcleaveRadiance.effects.physicalResIgnore,
            refinement,
          )
          : 0,
        'enemy-context', undefined, undefined, ['yeShunguang'],
      ),
      { attributes: ['Physical'] },
    ),
    additive(
      'dmgBonus', 'fully', engine,
      setup.engineId === 'cloudcleaveRadiance'
        ? equipmentEffectBaseValue(
          W_ENGINE_FACTS.cloudcleaveRadiance.effects.etherVeilDamage,
          refinement,
        )
        : 0,
      'self',
    ),
    additive(
      'critDmg', 'fully', engine,
      setup.engineId === 'cloudcleaveRadiance'
        ? equipmentEffectBaseValue(
          W_ENGINE_FACTS.cloudcleaveRadiance.effects.etherVeilCritDamage,
          refinement,
        )
        : 0,
      'self',
    ),
    percentage(
      'atk', 'fully', engine,
      setup.engineId === 'brimstone'
        ? equipmentEffectMaximumValue(W_ENGINE_FACTS.brimstone.effects.atk, refinement)
        : setup.engineId === 'marcatoDesire'
          ? equipmentEffectMaximumValue(W_ENGINE_FACTS.marcatoDesire.effects.atk, refinement)
          : 0,
      'self',
    ),
    withApplicability(
      additive(
        'dmgBonus', 'combat', engine,
        setup.engineId === 'steelCushion'
          ? equipmentEffectBaseValue(W_ENGINE_FACTS.steelCushion.effects.physicalDamage, refinement)
          : 0,
        'self',
      ),
      { attributes: ['Physical'] },
    ),
    additive(
      'dmgBonus', 'fully', engine,
      setup.engineId === 'steelCushion'
        ? equipmentEffectBaseValue(W_ENGINE_FACTS.steelCushion.effects.damage, refinement)
        : 0,
      'self', YE_BACK_ATTACK,
    ),
    percentage(
      'atk', 'combat', engine,
      setup.engineId === 'gildedBlossom'
        ? equipmentEffectBaseValue(W_ENGINE_FACTS.gildedBlossom.effects.atk, refinement)
        : 0,
      'self',
    ),
    percentage(
      'atk', 'fully', engine,
      setup.engineId === 'starlightEngine'
        ? equipmentEffectBaseValue(W_ENGINE_FACTS.starlightEngine.effects.atk, refinement)
        : 0,
      'self',
    ),
    additive(
      'dmgBonus', 'fully', engine,
      setup.engineId === 'gildedBlossom'
        ? equipmentEffectBaseValue(W_ENGINE_FACTS.gildedBlossom.effects.exDamage, refinement)
        : 0,
      'self', YE_EX_SPECIAL,
    ),
    additive(
      'critRate', 'fully', discSource('yeShunguang', 'whiteWaterBallad', '4-piece'),
      setup.fourPieceId === 'whiteWaterBallad'
        ? equipmentEffectBaseValue(DRIVE_DISC_FACTS.whiteWaterBallad.fourPiece.veilCritRate)
          + equipmentEffectBaseValue(DRIVE_DISC_FACTS.whiteWaterBallad.fourPiece.attackVeilCritRate)
        : 0,
      'self',
    ),
    percentage(
      'atk', 'fully', discSource('yeShunguang', 'whiteWaterBallad', '4-piece'),
      setup.fourPieceId === 'whiteWaterBallad'
        ? equipmentEffectBaseValue(DRIVE_DISC_FACTS.whiteWaterBallad.fourPiece.attackVeilAtk)
        : 0,
      'self',
    ),
    percentage(
      'atk', 'fully', discSource('yeShunguang', 'woodpecker', '4-piece'),
      setup.fourPieceId === 'woodpecker'
        ? equipmentEffectBaseValue(DRIVE_DISC_FACTS.woodpecker.fourPiece.atk)
        : 0,
      'self',
    ),
    percentage(
      'atk', 'combat', discSource('yeShunguang', 'hormonePunk', '4-piece'),
      setup.fourPieceId === 'hormonePunk'
        ? equipmentEffectBaseValue(DRIVE_DISC_FACTS.hormonePunk.fourPiece.atk)
        : 0,
      'self',
    ),
    ...pufferElectroFourPieceClauses('yeShunguang', setup, YE_ULTIMATE),
  ])
}

function optionalMetric(
  metricId: EffectMetric,
  label: string,
  effects: ReturnType<typeof resolveDeliveredClauses>,
  actions: AgentResult['actionModifiers'] = [],
): AgentResult['metrics'] {
  const data = composeMetricEffects(
    surfaces(0, 0, 0), surfaces([], [], []), effects, metricId,
  )
  return data.values.fully
    || actions.some(({ metricId: actionMetric }) => actionMetric === metricId)
    ? [{ id: metricId, label, unit: '%', decimals: 1, ...data }]
    : []
}

export function calculateYeShunguang(
  context: YeShunguangCalculationContext,
  inbox: SourceBoundCurrentClause[],
  enemy: SourceBoundCurrentClause[],
  targetStunDmgMultiplier: number,
): AgentResult {
  const { setup, initialAtk } = context
  const values = VERTICAL_VALUES.yeShunguang
  const baseAtk = values.atk + W_ENGINES[setup.engineId].baseAtk
  const effects = resolveDeliveredClauses([...inbox, ...enemy], { atk: initialAtk })

  const atkInputs = presentSetupInputs([
    engineAdvancedInput(setup, 'yeShunguang', 'atkPct'),
    mainStatInput(setup, 'yeShunguang', 'slot5', 'atkPct'),
    mainStatInput(setup, 'yeShunguang', 'slot6', 'atkPct'),
    ...selectedDiscTwoPieceInputs(setup, 'yeShunguang', { modifier: 'atk' }),
    effectiveSubstatInput(setup, 'yeShunguang', 'atkPct'),
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
    engineAdvancedInput(setup, 'yeShunguang', 'critRate'),
    mainStatInput(setup, 'yeShunguang', 'slot4', 'critRate'),
    ...selectedDiscTwoPieceInputs(setup, 'yeShunguang', { modifier: 'critRate' }),
    effectiveSubstatInput(setup, 'yeShunguang', 'critRate'),
  ])
  const initialCritRate = values.critRate
    + critRateInputs.reduce((sum, input) => sum + input.rawValue, 0)
  const critRate = composeMetricEffects(
    surfaces(initialCritRate, initialCritRate, initialCritRate),
    surfaces(critRateInputs.map((input) => contribution(input.source, input.rawValue)), [], []),
    effects,
    'critRate',
    { value: 100, source: STATIC_SOURCES.yeShunguang.critCap },
  )

  const critDmgInputs = presentSetupInputs([
    engineAdvancedInput(setup, 'yeShunguang', 'critDmg'),
    mainStatInput(setup, 'yeShunguang', 'slot4', 'critDmg'),
    ...selectedDiscTwoPieceInputs(setup, 'yeShunguang', { modifier: 'critDmg' }),
    effectiveSubstatInput(setup, 'yeShunguang', 'critDmg'),
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
    mainStatInput(setup, 'yeShunguang', 'slot5', 'physicalDmg'),
    ...selectedDiscTwoPieceInputs(setup, 'yeShunguang', { modifier: 'dmgBonus' }),
  ])
  const initialDmg = dmgInputs.reduce((sum, input) => sum + input.rawValue, 0)
  const dmg = composeMetricEffects(
    surfaces(initialDmg, initialDmg, initialDmg),
    surfaces(dmgInputs.map((input) => contribution(input.source, input.rawValue)), [], []),
    effects,
    'dmgBonus',
  )

  const penInputs = presentSetupInputs([
    mainStatInput(setup, 'yeShunguang', 'slot5', 'penRatio'),
    ...selectedDiscTwoPieceInputs(setup, 'yeShunguang', { modifier: 'penRatio' }),
  ])
  const initialPen = penInputs.reduce((sum, input) => sum + input.rawValue, 0)
  const pen = composeMetricEffects(
    surfaces(initialPen, initialPen, initialPen),
    surfaces(penInputs.map((input) => contribution(input.source, input.rawValue)), [], []),
    effects,
    'penRatio',
  )

  const defIgnore = composeMetricEffects(
    surfaces(0, 0, 0), surfaces([], [], []), effects, 'defIgnore',
  )
  const actionModifiers = [
    ...composeActionHierarchy(dmg.values, effects, 'dmgBonus', DAMAGE_SCOPES),
    ...composeActionHierarchy(
      defIgnore.values, effects, 'defIgnore', DEF_IGNORE_SCOPES, 'DefIgnore',
    ),
  ]

  const targetClause = additive(
    'stunDmgMultiplier', 'fully', STATIC_SOURCES.yeShunguang.targetStun,
    targetStunDmgMultiplier - 100, 'self',
  )
  const stunEffects = [
    ...resolveDeliveredClauses([targetClause], {}),
    ...effects.filter(({ metric, action }) => metric === 'stunDmgMultiplier' && !action),
  ].map((effect) => ({ ...effect, earliestSurface: 'fully' as const }))
  const stunDmgMultiplier = composeMetricEffects(
    surfaces(0, 0, 0), surfaces([], [], []), stunEffects, 'stunDmgMultiplier',
  )
  const veilCap = setup.mindscape >= 4
    ? values.mindscapeVeilVulnerabilityCap
    : values.veilVulnerabilityCap

  return {
    agentId: 'yeShunguang',
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
      {
        id: 'stunDmgMultiplier',
        label: 'Stun DMG Multiplier',
        unit: '%',
        decimals: 1,
        ...stunDmgMultiplier,
        gauge: {
          source: STATIC_SOURCES.yeShunguang.targetStun,
          basisLabel: 'Raw Stun DMG Multiplier bonus',
          current: stunDmgMultiplier.values.fully,
          cap: veilCap,
          outputLabel: 'Veil Vulnerability',
          outputValue: Math.min(stunDmgMultiplier.values.fully, veilCap),
          outputCap: veilCap,
          outputUnit: '%',
        },
      },
    ],
    actionModifiers,
    operations: [],
  }
}
