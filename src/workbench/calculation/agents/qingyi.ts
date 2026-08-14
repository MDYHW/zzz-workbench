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
  presentSetupInputs,
  resolveDeliveredClauses,
  source,
  withApplicability,
  type CompleteSetup,
  type EffectMetric,
  type SourceBoundCurrentClause,
} from '../../effects'
import { actionForm, actionTarget, canonicalAction } from '../../actions'
import {
  composeActionHierarchy,
  composeMetricEffects,
  contribution,
  energyRegenProjection,
  percentageContribution,
  surfaces,
  type ActionScopeNode,
} from '../composition'
import { initialAtkFor } from '../initial-atk'
import type { AgentResult } from '../result'

export interface QingyiCalculationContext {
  agentId: 'qingyi'
  setup: CompleteSetup
  additionalActive: boolean
  initialAtk: number
  initialImpact: number
  fullyImpact: number
}

const QINGYI_BASIC = actionTarget([canonicalAction('Basic Attack')])
const QINGYI_ENCHANTED_BASIC = actionTarget([
  actionForm('Basic Attack', 'Enchanted Moonlit Blossoms'),
])
const QINGYI_CHAIN = actionTarget([canonicalAction('Chain Attack')])
const QINGYI_DAMAGE_SCOPES = [
  {
    id: 'qingyiBasicDmg', target: QINGYI_BASIC,
    children: [{ id: 'qingyiEnchantedBasicDmg', target: QINGYI_ENCHANTED_BASIC }],
  },
  { id: 'qingyiChainDmg', target: QINGYI_CHAIN },
] satisfies readonly ActionScopeNode[]
const QINGYI_DAZE_SCOPES = [{
  id: 'qingyiBasicDaze', target: QINGYI_BASIC,
  children: [{ id: 'qingyiEnchantedBasicDaze', target: QINGYI_ENCHANTED_BASIC }],
}] satisfies readonly ActionScopeNode[]
const QINGYI_CRIT_DMG_SCOPES = [{
  id: 'qingyiEnchantedBasicCritDmg', target: QINGYI_ENCHANTED_BASIC,
}] satisfies readonly ActionScopeNode[]

function impactInputs(setup: CompleteSetup) {
  return presentSetupInputs([
    engineAdvancedInput(setup, 'qingyi', 'impactPct'),
    mainStatInput(setup, 'qingyi', 'slot6', 'impact'),
    discStatInput(setup, 'qingyi', 'fourPiece', 'shockstar',
      equipmentEffectBaseValue(DRIVE_DISC_FACTS.shockstar.twoPiece.impact), 'twoPiece'),
    discStatInput(setup, 'qingyi', 'twoPiece', 'shockstar',
      equipmentEffectBaseValue(DRIVE_DISC_FACTS.shockstar.twoPiece.impact)),
  ])
}

function initialImpact(setup: CompleteSetup): number {
  return VERTICAL_VALUES.qingyi.impact * (
    1 + impactInputs(setup).reduce((sum, input) => sum + input.rawValue, 0) / 100
  )
}

function engineImpact(setup: CompleteSetup): number {
  const refinement = setup.refinement
  switch (setup.engineId) {
    case 'iceJadeTeapot':
      return equipmentEffectMaximumValue(W_ENGINE_FACTS.iceJadeTeapot.effects.impact, refinement)
    case 'blazingLaurel':
      return equipmentEffectBaseValue(W_ENGINE_FACTS.blazingLaurel.effects.impact, refinement)
    case 'hellfireGears':
      return equipmentEffectBaseValue(W_ENGINE_FACTS.hellfireGears.effects.impact, refinement)
    case 'steamOven':
      return equipmentEffectMaximumValue(W_ENGINE_FACTS.steamOven.effects.impact, refinement)
    default:
      return 0
  }
}

export function qingyiImpactAtk(impact: number): number {
  const values = VERTICAL_VALUES.qingyi
  return Math.min(
    Math.max(impact - values.additionalImpactThreshold, 0) * values.additionalAtkPerImpact,
    values.additionalAtkCap,
  )
}

export function observeQingyi(
  setup: CompleteSetup,
  additionalActive: boolean,
): QingyiCalculationContext {
  const initialAtk = initialAtkFor('qingyi', setup)
  if (initialAtk === null) throw new Error('Complete Qingyi setup requires a W-Engine')
  const impact = initialImpact(setup)
  return {
    agentId: 'qingyi', setup, additionalActive, initialAtk,
    initialImpact: impact,
    fullyImpact: impact + VERTICAL_VALUES.qingyi.impact * engineImpact(setup) / 100,
  }
}

function localKingCritRate(setup: CompleteSetup): number {
  return VERTICAL_VALUES.qingyi.critRate
    + (mainStatInput(setup, 'qingyi', 'slot4', 'critRate')?.rawValue ?? 0)
    + (discStatInput(setup, 'qingyi', 'twoPiece', 'woodpecker',
      equipmentEffectBaseValue(DRIVE_DISC_FACTS.woodpecker.twoPiece.critRate))?.rawValue ?? 0)
    + (effectiveSubstatInput(setup, 'qingyi', 'critRate')?.rawValue ?? 0)
}

export function resolveQingyiProviderClauses(
  context: QingyiCalculationContext,
): SourceBoundCurrentClause[] {
  const { setup, additionalActive, initialImpact: initial, fullyImpact: fully } = context
  const values = VERTICAL_VALUES.qingyi
  const refinement = setup.refinement
  const engine = engineSource('qingyi', setup)
  const core = source(SOURCE_LABELS.qingyiCore, 'qingyi', 'core')
  const additional = source(SOURCE_LABELS.qingyiAbility, 'qingyi', 'additional')
  const initialAtkOutput = additionalActive ? qingyiImpactAtk(initial) : 0
  const fullyAtkOutput = additionalActive ? qingyiImpactAtk(fully) : 0
  const kingCritDmg = setup.fourPieceId === 'king'
    ? localKingCritRate(setup) >= values.kingCritThreshold
      ? equipmentEffectMaximumValue(DRIVE_DISC_FACTS.king.fourPiece.critDamage)
      : equipmentEffectBaseValue(DRIVE_DISC_FACTS.king.fourPiece.critDamage)
    : 0

  return active([
    additive('dmgBonus', 'fully', core, values.flashDmg, 'self', QINGYI_ENCHANTED_BASIC),
    additive('dazeBonus', 'fully', core, values.flashDaze, 'self', QINGYI_ENCHANTED_BASIC),
    additive('stunDmgMultiplier', 'fully', core, values.coreStunMultiplier, 'enemy-context'),
    additive('dmgBonus', 'fully', core, values.coreChainDmg, 'self', QINGYI_CHAIN),
    additive(
      'dazeBonus', 'fully', additional,
      additionalActive ? values.additionalBasicDaze : 0,
      'self', QINGYI_BASIC,
    ),
    additive('atk', 'initial', additional, initialAtkOutput, 'self'),
    additive('atk', 'fully', additional, fullyAtkOutput - initialAtkOutput, 'self'),

    withApplicability(
      additive(
        'defReduction', 'fully', mindscapeSource('qingyi', 1),
        setup.mindscape >= 1 ? values.mindscapeDefReduction : 0,
        'enemy-context',
      ),
      { formulas: ['general_damage'] },
    ),
    additive(
      'critRate', 'fully', mindscapeSource('qingyi', 1),
      setup.mindscape >= 1 ? values.mindscapeCritRate : 0,
      'self',
    ),
    additive(
      'stunDmgMultiplier', 'fully', mindscapeSource('qingyi', 2, '20 Subjugation stacks'),
      setup.mindscape >= 2
        ? values.mindscapeStunMultiplier - values.coreStunMultiplier
        : 0,
      'enemy-context',
    ),
    additive(
      'dazeBonus', 'fully', mindscapeSource('qingyi', 2, '20 Subjugation stacks'),
      setup.mindscape >= 2 ? values.mindscapeDaze : 0,
      'self',
    ),
    additive(
      'critDmg', 'fully', mindscapeSource('qingyi', 6),
      setup.mindscape >= 6 ? values.mindscapeEnchantedCritDmg : 0,
      'self', QINGYI_ENCHANTED_BASIC,
    ),
    additive(
      'resReduction', 'fully', mindscapeSource('qingyi', 6),
      setup.mindscape >= 6 ? values.mindscapeResReduction : 0,
      'enemy-context',
    ),

    percentage('impact', 'fully', engine, engineImpact(setup), 'self'),
    withApplicability(
      additive(
        'dmgBonus', 'fully', engine,
        setup.engineId === 'iceJadeTeapot'
          ? equipmentEffectBaseValue(W_ENGINE_FACTS.iceJadeTeapot.effects.damage, refinement)
          : 0,
        'all-party', undefined, undefined, undefined, 'iceJadeTeapot',
      ),
      { formulas: ['general_damage', 'sheer_damage'] },
    ),
    withApplicability(
      additive(
        'critDmg', 'fully', engine,
        setup.engineId === 'blazingLaurel'
          ? equipmentEffectMaximumValue(W_ENGINE_FACTS.blazingLaurel.effects.critDamage, refinement)
          : 0,
        'all-party',
      ),
      { attributes: ['Fire', 'Ice'], formulas: ['general_damage', 'sheer_damage'] },
    ),
    additive(
      'dmgBonus', 'fully', engine,
      setup.engineId === 'restrained'
        ? equipmentEffectMaximumValue(W_ENGINE_FACTS.restrained.effects.damage, refinement)
        : 0,
      'self', QINGYI_BASIC,
    ),
    additive(
      'dazeBonus', 'fully', engine,
      setup.engineId === 'restrained'
        ? equipmentEffectMaximumValue(W_ENGINE_FACTS.restrained.effects.daze, refinement)
        : 0,
      'self', QINGYI_BASIC,
    ),
    additive(
      'dazeBonus', 'fully', engine,
      setup.engineId === 'preciousFossilizedCore'
        ? equipmentEffectMaximumValue(W_ENGINE_FACTS.preciousFossilizedCore.effects.daze, refinement)
        : 0,
      'self',
    ),

    additive(
      'dazeBonus', 'initial',
      discSource('qingyi', 'king', '2-piece', setup.fourPieceId === 'king' ? '4-piece' : '2-piece'),
      setup.fourPieceId === 'king' || setup.twoPieceId === 'king'
        ? equipmentEffectBaseValue(DRIVE_DISC_FACTS.king.twoPiece.daze)
        : 0,
      'self',
    ),
    withApplicability(
      additive(
        'critDmg', 'fully', discSource('qingyi', 'king', '4-piece'),
        kingCritDmg, 'all-party', undefined, undefined, undefined, 'kingOfTheSummit',
      ),
      { formulas: ['general_damage', 'sheer_damage'] },
    ),
    additive(
      'dazeBonus', 'fully', discSource('qingyi', 'shockstar', '4-piece'),
      setup.fourPieceId === 'shockstar'
        ? equipmentEffectBaseValue(DRIVE_DISC_FACTS.shockstar.fourPiece.daze)
        : 0,
      'self', QINGYI_BASIC,
    ),
    withApplicability(
      additive(
        'dmgBonus', 'fully', discSource('qingyi', 'swingJazz', '4-piece'),
        setup.fourPieceId === 'swingJazz'
          ? equipmentEffectBaseValue(DRIVE_DISC_FACTS.swingJazz.fourPiece.damage)
          : 0,
        'all-party', undefined, undefined, undefined, 'swingJazz',
      ),
      { formulas: ['general_damage', 'sheer_damage'] },
    ),
    withApplicability(
      additive(
        'dmgBonus', 'fully', discSource('qingyi', 'protoPunk', '4-piece'),
        setup.fourPieceId === 'protoPunk'
          ? equipmentEffectBaseValue(DRIVE_DISC_FACTS.protoPunk.fourPiece.damage)
          : 0,
        'all-party', undefined, undefined, undefined, 'protoPunk',
      ),
      { formulas: ['general_damage', 'sheer_damage'] },
    ),
  ])
}

function optionalMetric(
  metricId: EffectMetric,
  label: string,
  effects: ReturnType<typeof resolveDeliveredClauses>,
): AgentResult['metrics'] {
  const data = composeMetricEffects(surfaces(0, 0, 0), surfaces([], [], []), effects, metricId)
  return data.values.fully
    ? [{ id: metricId, label, unit: '%', decimals: 1, ...data }]
    : []
}

export function calculateQingyi(
  context: QingyiCalculationContext,
  inbox: SourceBoundCurrentClause[],
  enemy: SourceBoundCurrentClause[],
): AgentResult {
  const { setup, initialAtk, additionalActive } = context
  const values = VERTICAL_VALUES.qingyi
  const baseAtk = values.atk + W_ENGINES[setup.engineId].baseAtk
  const effects = resolveDeliveredClauses([...inbox, ...enemy], {
    atk: initialAtk, impact: values.impact,
  })

  const atkInputs = presentSetupInputs([
    engineAdvancedInput(setup, 'qingyi', 'atkPct'),
    mainStatInput(setup, 'qingyi', 'slot4', 'atkPct'),
    mainStatInput(setup, 'qingyi', 'slot5', 'atkPct'),
    mainStatInput(setup, 'qingyi', 'slot6', 'atkPct'),
    discStatInput(setup, 'qingyi', 'fourPiece', 'astralVoice',
      equipmentEffectBaseValue(DRIVE_DISC_FACTS.astralVoice.twoPiece.atk), 'twoPiece'),
    effectiveSubstatInput(setup, 'qingyi', 'atkPct'),
  ])
  const atk = composeMetricEffects(
    surfaces(initialAtk, initialAtk, initialAtk),
    surfaces(atkInputs.map((input) => percentageContribution(
      input.source, baseAtk * input.rawValue / 100, input.rawValue,
    )), [], []),
    effects,
    'atk',
  )

  const currentImpactInputs = impactInputs(setup)
  const impact = composeMetricEffects(
    surfaces(context.initialImpact, context.initialImpact, context.initialImpact),
    surfaces(currentImpactInputs.map((input) => percentageContribution(
      input.source, values.impact * input.rawValue / 100, input.rawValue,
    )), [], []),
    effects,
    'impact',
  )

  const critRateInputs = presentSetupInputs([
    mainStatInput(setup, 'qingyi', 'slot4', 'critRate'),
    discStatInput(setup, 'qingyi', 'twoPiece', 'woodpecker',
      equipmentEffectBaseValue(DRIVE_DISC_FACTS.woodpecker.twoPiece.critRate)),
    effectiveSubstatInput(setup, 'qingyi', 'critRate'),
  ])
  const initialCritRate = values.critRate
    + critRateInputs.reduce((sum, input) => sum + input.rawValue, 0)
  const critRate = composeMetricEffects(
    surfaces(initialCritRate, initialCritRate, initialCritRate),
    surfaces(critRateInputs.map((input) => contribution(input.source, input.rawValue)), [], []),
    effects,
    'critRate',
    { value: 100, source: source('Displayed CRIT Rate cap', 'qingyi', 'calculation') },
  )

  const critDmgInputs = presentSetupInputs([
    mainStatInput(setup, 'qingyi', 'slot4', 'critDmg'),
    effectiveSubstatInput(setup, 'qingyi', 'critDmg'),
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
    mainStatInput(setup, 'qingyi', 'slot5', 'electricDmg'),
  ])
  const initialDmg = dmgInputs.reduce((sum, input) => sum + input.rawValue, 0)
  const dmg = composeMetricEffects(
    surfaces(initialDmg, initialDmg, initialDmg),
    surfaces(dmgInputs.map((input) => contribution(input.source, input.rawValue)), [], []),
    effects,
    'dmgBonus',
  )

  const penInputs = presentSetupInputs([
    mainStatInput(setup, 'qingyi', 'slot5', 'penRatio'),
  ])
  const initialPen = penInputs.reduce((sum, input) => sum + input.rawValue, 0)
  const pen = composeMetricEffects(
    surfaces(initialPen, initialPen, initialPen),
    surfaces(penInputs.map((input) => contribution(input.source, input.rawValue)), [], []),
    effects,
    'penRatio',
  )

  const energyInputs = presentSetupInputs([
    engineAdvancedInput(setup, 'qingyi', 'energyRegenPct'),
    discStatInput(setup, 'qingyi', 'fourPiece', 'swingJazz',
      equipmentEffectBaseValue(DRIVE_DISC_FACTS.swingJazz.twoPiece.energyRegen), 'twoPiece'),
    discStatInput(setup, 'qingyi', 'twoPiece', 'swingJazz',
      equipmentEffectBaseValue(DRIVE_DISC_FACTS.swingJazz.twoPiece.energyRegen)),
  ])
  const energy = energyRegenProjection(values.baseEnergyRegen, energyInputs, effects)
  const daze = composeMetricEffects(surfaces(0, 0, 0), surfaces([], [], []), effects, 'dazeBonus')
  const stun = composeMetricEffects(
    surfaces(0, 0, 0), surfaces([], [], []), effects, 'stunDmgMultiplier',
  )
  const actionModifiers = [
    ...composeActionHierarchy(dmg.values, effects, 'dmgBonus', QINGYI_DAMAGE_SCOPES),
    ...composeActionHierarchy(daze.values, effects, 'dazeBonus', QINGYI_DAZE_SCOPES),
    ...composeActionHierarchy(critDmg.values, effects, 'critDmg', QINGYI_CRIT_DMG_SCOPES),
  ]

  return {
    agentId: 'qingyi',
    metrics: [
      { id: 'atk', label: 'ATK', unit: '', decimals: 0, ...atk },
      {
        id: 'impact', label: 'Impact', unit: '', decimals: 2, ...impact,
        ...(additionalActive
          ? {
            gauge: {
              source: source(SOURCE_LABELS.qingyiAbility, 'qingyi', 'additional'),
              basisLabel: 'Fully Enabled Impact', current: impact.values.fully,
              threshold: values.additionalImpactThreshold,
              cap: values.additionalImpactCap,
              outputLabel: 'Self ATK', outputValue: qingyiImpactAtk(impact.values.fully),
              outputCap: values.additionalAtkCap, outputUnit: '',
            },
          }
          : {}),
      },
      {
        id: 'critRate', label: 'CRIT Rate', unit: '%', decimals: 1, ...critRate,
        ...(setup.fourPieceId === 'king'
          ? {
            gauge: {
              source: discSource('qingyi', 'king', '4-piece'),
              basisLabel: 'Initial CRIT Rate', current: localKingCritRate(setup),
              threshold: values.kingCritThreshold, cap: values.kingCritThreshold,
              outputLabel: 'Squad CRIT DMG', outputValue: localKingCritRate(setup) >= values.kingCritThreshold
                ? equipmentEffectMaximumValue(DRIVE_DISC_FACTS.king.fourPiece.critDamage)
                : equipmentEffectBaseValue(DRIVE_DISC_FACTS.king.fourPiece.critDamage),
              outputUnit: '%',
            },
          }
          : {}),
      },
      { id: 'critDmg', label: 'CRIT DMG', unit: '%', decimals: 1, ...critDmg },
      { id: 'dmgBonus', label: 'DMG Bonus', unit: '%', decimals: 1, ...dmg },
      ...(pen.values.fully
        ? [{ id: 'penRatio' as const, label: 'PEN Ratio', unit: '%', decimals: 1, ...pen }]
        : []),
      ...(energyInputs.length
        ? [{ id: 'energyRegen' as const, label: 'Energy Regen', unit: '/s', decimals: 2, ...energy }]
        : []),
      { id: 'dazeBonus', label: 'Daze Bonus', unit: '%', decimals: 1, ...daze },
      { id: 'stunDmgMultiplier', label: 'Stun DMG Multiplier', unit: '%', decimals: 1, ...stun },
      ...optionalMetric('defReduction', 'DEF Reduction', effects),
      ...optionalMetric('resReduction', 'RES Reduction', effects),
    ],
    actionModifiers,
    operations: [],
  }
}
