import {
  DRIVE_DISC_FACTS,
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
  pufferElectroFourPieceClauses,
  resolveDeliveredClauses,
  STATIC_SOURCES,
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
  energyRegenProjection,
  percentageContribution,
  surfaces,
  type ActionScopeNode,
} from '../composition'
import { initialAtkFor } from '../initial-atk'
import type { AgentResult } from '../result'

export interface BenCalculationContext {
  agentId: 'ben'
  setup: CompleteSetup
  additionalActive: boolean
  initialAtk: number
  initialDef: number
}

const EX_ULTIMATE = actionTarget([
  canonicalAction('EX Special Attack'), canonicalAction('Ultimate'),
])
const ULTIMATE = actionTarget([canonicalAction('Ultimate')])
const BLOCK_COUNTER = actionTarget([
  sourceLocalAction('Special/EX Block Counter'),
])
const BASIC_DASH_DODGE = actionTarget([
  canonicalAction('Basic Attack'), canonicalAction('Dash Attack'),
  canonicalAction('Dodge Counter'),
])
const DAMAGE_SCOPES = [
  { id: 'benExUltimate', target: EX_ULTIMATE, children: [{ id: 'benUltimate', target: ULTIMATE }] },
  { id: 'benBlockCounter', target: BLOCK_COUNTER },
] satisfies readonly ActionScopeNode[]
const DAZE_SCOPES = [
  { id: 'benBasicDashDodge', target: BASIC_DASH_DODGE },
] satisfies readonly ActionScopeNode[]

function defInputs(setup: CompleteSetup) {
  return presentSetupInputs([
    engineAdvancedInput(setup, 'ben', 'defPct'),
    mainStatInput(setup, 'ben', 'slot4', 'defPct'),
    mainStatInput(setup, 'ben', 'slot5', 'defPct'),
    mainStatInput(setup, 'ben', 'slot6', 'defPct'),
    effectiveSubstatInput(setup, 'ben', 'defPct'),
  ])
}

function initialDefFor(setup: CompleteSetup): number {
  const values = VERTICAL_VALUES.ben
  return values.def * (
    1 + defInputs(setup).reduce((sum, input) => sum + input.rawValue, 0) / 100
  ) + VERTICAL_VALUES.fixedDisc.def
}

export function observeBen(
  setup: CompleteSetup,
  additionalActive: boolean,
): BenCalculationContext {
  const initialAtk = initialAtkFor('ben', setup)
  if (initialAtk === null) throw new Error('Complete Ben setup requires a W-Engine')
  return {
    agentId: 'ben', setup, additionalActive, initialAtk,
    initialDef: initialDefFor(setup),
  }
}

export function resolveBenProviderClauses(
  context: BenCalculationContext,
): SourceBoundCurrentClause[] {
  const { setup, additionalActive, initialDef } = context
  const values = VERTICAL_VALUES.ben
  const engine = engineSource('ben', setup)
  const refinement = setup.refinement
  const core = STATIC_SOURCES.ben.core
  const additional = STATIC_SOURCES.ben.additional

  return active([
    additive('atk', 'combat', core, initialDef * values.coreDefToAtk / 100, 'self'),
    withApplicability(
      additive(
        'critRate', 'fully', additional,
        additionalActive ? values.additionalCritRate : 0,
        'all-party',
      ),
      { formulas: ['general_damage', 'sheer_damage'] },
    ),
    additive(
      'dmgBonus', 'fully', mindscapeSource('ben', 4, 'Invulnerable block counter'),
      setup.mindscape >= 4 ? values.mindscapeCounterDmg : 0,
      'self', BLOCK_COUNTER,
    ),
    additive(
      'dazeBonus', 'fully', mindscapeSource('ben', 6, 'After EX Special or follow-up'),
      setup.mindscape >= 6 ? values.mindscapeDaze : 0,
      'self', BASIC_DASH_DODGE,
    ),

    additive(
      'dmgBonus', 'fully', engine,
      setup.engineId === 'tremorTrigramVessel'
        ? equipmentEffectBaseValue(W_ENGINE_FACTS.tremorTrigramVessel.effects.damage, refinement)
        : 0,
      'self', EX_ULTIMATE,
    ),
    withApplicability(
      additive(
        'dmgBonus', 'fully', engine,
        setup.engineId === 'tusksOfFury'
          ? equipmentEffectBaseValue(W_ENGINE_FACTS.tusksOfFury.effects.damage, refinement)
          : 0,
        'all-party',
      ),
      { formulas: ['general_damage', 'sheer_damage'] },
    ),
    withApplicability(
      additive(
        'dazeBonus', 'fully', engine,
        setup.engineId === 'tusksOfFury'
          ? equipmentEffectBaseValue(W_ENGINE_FACTS.tusksOfFury.effects.daze, refinement)
          : 0,
        'all-party',
      ),
      { formulas: ['daze_buildup'] },
    ),

    percentage(
      'atk', 'fully', discSource('ben', 'woodpecker', '4-piece'),
      setup.fourPieceId === 'woodpecker'
        ? equipmentEffectBaseValue(DRIVE_DISC_FACTS.woodpecker.fourPiece.atk)
        : 0,
      'self',
    ),
    withApplicability(
      additive(
        'dmgBonus', 'fully', discSource('ben', 'bunnyInWonderland', '4-piece'),
        setup.fourPieceId === 'bunnyInWonderland'
          ? equipmentEffectMaximumValue(DRIVE_DISC_FACTS.bunnyInWonderland.fourPiece.damage)
          : 0,
        'all-party', undefined, undefined, undefined, 'bunnyInWonderland',
      ),
      { formulas: ['general_damage', 'sheer_damage'] },
    ),
    withApplicability(
      additive(
        'dmgBonus', 'fully', discSource('ben', 'swingJazz', '4-piece'),
        setup.fourPieceId === 'swingJazz'
          ? equipmentEffectBaseValue(DRIVE_DISC_FACTS.swingJazz.fourPiece.damage)
          : 0,
        'all-party', undefined, undefined, undefined, 'swingJazz',
      ),
      { formulas: ['general_damage', 'sheer_damage'] },
    ),
    withApplicability(
      additive(
        'dmgBonus', 'fully', discSource('ben', 'protoPunk', '4-piece'),
        setup.fourPieceId === 'protoPunk'
          ? equipmentEffectBaseValue(DRIVE_DISC_FACTS.protoPunk.fourPiece.damage)
          : 0,
        'all-party', undefined, undefined, undefined, 'protoPunk',
      ),
      { formulas: ['general_damage', 'sheer_damage'] },
    ),
    ...pufferElectroFourPieceClauses('ben', setup, ULTIMATE),
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

export function calculateBen(
  context: BenCalculationContext,
  inbox: SourceBoundCurrentClause[],
  enemy: SourceBoundCurrentClause[],
): AgentResult {
  const { setup, initialAtk, initialDef } = context
  const values = VERTICAL_VALUES.ben
  const baseAtk = values.atk + W_ENGINES[setup.engineId].baseAtk
  const effects = resolveDeliveredClauses([...inbox, ...enemy], {
    atk: initialAtk, def: initialDef, impact: values.impact,
  })

  const atkInputs = presentSetupInputs([
    engineAdvancedInput(setup, 'ben', 'atkPct'),
    mainStatInput(setup, 'ben', 'slot4', 'atkPct'),
    mainStatInput(setup, 'ben', 'slot5', 'atkPct'),
    mainStatInput(setup, 'ben', 'slot6', 'atkPct'),
    discStatInput(setup, 'ben', 'fourPiece', 'astralVoice',
      equipmentEffectBaseValue(DRIVE_DISC_FACTS.astralVoice.twoPiece.atk), 'twoPiece'),
    discStatInput(setup, 'ben', 'twoPiece', 'astralVoice',
      equipmentEffectBaseValue(DRIVE_DISC_FACTS.astralVoice.twoPiece.atk)),
    discStatInput(setup, 'ben', 'twoPiece', 'hormonePunk',
      equipmentEffectBaseValue(DRIVE_DISC_FACTS.hormonePunk.twoPiece.atk)),
    effectiveSubstatInput(setup, 'ben', 'atkPct'),
  ])
  const atk = composeMetricEffects(
    surfaces(initialAtk, initialAtk, initialAtk),
    surfaces(atkInputs.map((input) => percentageContribution(
      input.source, baseAtk * input.rawValue / 100, input.rawValue,
    )), [], []),
    effects,
    'atk',
  )

  const currentDefInputs = defInputs(setup)
  const def = composeMetricEffects(
    surfaces(initialDef, initialDef, initialDef),
    surfaces(currentDefInputs.map((input) => percentageContribution(
      input.source, values.def * input.rawValue / 100, input.rawValue,
    )), [], []),
    effects,
    'def',
  )

  const critRateInputs = presentSetupInputs([
    engineAdvancedInput(setup, 'ben', 'critRate'),
    mainStatInput(setup, 'ben', 'slot4', 'critRate'),
    discStatInput(setup, 'ben', 'fourPiece', 'woodpecker',
      equipmentEffectBaseValue(DRIVE_DISC_FACTS.woodpecker.twoPiece.critRate), 'twoPiece'),
    discStatInput(setup, 'ben', 'twoPiece', 'woodpecker',
      equipmentEffectBaseValue(DRIVE_DISC_FACTS.woodpecker.twoPiece.critRate)),
    effectiveSubstatInput(setup, 'ben', 'critRate'),
  ])
  const initialCritRate = values.critRate
    + critRateInputs.reduce((sum, input) => sum + input.rawValue, 0)
  const critRate = composeMetricEffects(
    surfaces(initialCritRate, initialCritRate, initialCritRate),
    surfaces(critRateInputs.map((input) => contribution(input.source, input.rawValue)), [], []),
    effects,
    'critRate',
    { value: 100, source: STATIC_SOURCES.ben.critCap },
  )

  const critDmgInputs = presentSetupInputs([
    engineAdvancedInput(setup, 'ben', 'critDmg'),
    mainStatInput(setup, 'ben', 'slot4', 'critDmg'),
    discStatInput(setup, 'ben', 'twoPiece', 'branchAndBlade',
      equipmentEffectBaseValue(DRIVE_DISC_FACTS.branchAndBlade.twoPiece.critDamage)),
    effectiveSubstatInput(setup, 'ben', 'critDmg'),
  ])
  const initialCritDmg = values.critDmg
    + critDmgInputs.reduce((sum, input) => sum + input.rawValue, 0)
  const critDmg = composeMetricEffects(
    surfaces(initialCritDmg, initialCritDmg, initialCritDmg),
    surfaces(critDmgInputs.map((input) => contribution(input.source, input.rawValue)), [], []),
    effects,
    'critDmg',
  )

  const impactInputs = presentSetupInputs([
    engineAdvancedInput(setup, 'ben', 'impactPct'),
  ])
  const initialImpact = values.impact * (
    1 + impactInputs.reduce((sum, input) => sum + input.rawValue, 0) / 100
  )
  const impact = composeMetricEffects(
    surfaces(initialImpact, initialImpact, initialImpact),
    surfaces(impactInputs.map((input) => percentageContribution(
      input.source, values.impact * input.rawValue / 100, input.rawValue,
    )), [], []),
    effects,
    'impact',
  )

  const dmgInputs = presentSetupInputs([
    mainStatInput(setup, 'ben', 'slot5', 'fireDmg'),
    discStatInput(setup, 'ben', 'twoPiece', 'infernoMetal',
      equipmentEffectBaseValue(DRIVE_DISC_FACTS.infernoMetal.twoPiece.damage)),
  ])
  const initialDmg = dmgInputs.reduce((sum, input) => sum + input.rawValue, 0)
  const dmg = composeMetricEffects(
    surfaces(initialDmg, initialDmg, initialDmg),
    surfaces(dmgInputs.map((input) => contribution(input.source, input.rawValue)), [], []),
    effects,
    'dmgBonus',
  )

  const penInputs = presentSetupInputs([
    mainStatInput(setup, 'ben', 'slot5', 'penRatio'),
    discStatInput(setup, 'ben', 'fourPiece', 'pufferElectro',
      equipmentEffectBaseValue(DRIVE_DISC_FACTS.pufferElectro.twoPiece.penRatio), 'twoPiece'),
    discStatInput(setup, 'ben', 'twoPiece', 'pufferElectro',
      equipmentEffectBaseValue(DRIVE_DISC_FACTS.pufferElectro.twoPiece.penRatio)),
  ])
  const initialPen = penInputs.reduce((sum, input) => sum + input.rawValue, 0)
  const pen = composeMetricEffects(
    surfaces(initialPen, initialPen, initialPen),
    surfaces(penInputs.map((input) => contribution(input.source, input.rawValue)), [], []),
    effects,
    'penRatio',
  )

  const energyInputs = presentSetupInputs([
    discStatInput(setup, 'ben', 'fourPiece', 'swingJazz',
      equipmentEffectBaseValue(DRIVE_DISC_FACTS.swingJazz.twoPiece.energyRegen), 'twoPiece'),
    discStatInput(setup, 'ben', 'twoPiece', 'swingJazz',
      equipmentEffectBaseValue(DRIVE_DISC_FACTS.swingJazz.twoPiece.energyRegen)),
    discStatInput(setup, 'ben', 'twoPiece', 'moonlight',
      equipmentEffectBaseValue(DRIVE_DISC_FACTS.moonlight.twoPiece.energyRegen)),
  ])
  const energy = energyRegenProjection(values.baseEnergyRegen, energyInputs, effects)

  const daze = composeMetricEffects(surfaces(0, 0, 0), surfaces([], [], []), effects, 'dazeBonus')
  const actionModifiers = [
    ...composeActionHierarchy(dmg.values, effects, 'dmgBonus', DAMAGE_SCOPES),
    ...composeActionHierarchy(daze.values, effects, 'dazeBonus', DAZE_SCOPES),
  ]
  return {
    agentId: 'ben',
    metrics: [
      { id: 'atk', label: 'ATK', unit: '', decimals: 0, ...atk },
      { id: 'def', label: 'DEF', unit: '', decimals: 0, ...def },
      { id: 'critRate', label: 'CRIT Rate', unit: '%', decimals: 1, ...critRate },
      { id: 'critDmg', label: 'CRIT DMG', unit: '%', decimals: 1, ...critDmg },
      { id: 'impact', label: 'Impact', unit: '', decimals: 2, ...impact },
      { id: 'energyRegen', label: 'Energy Regen', unit: '/s', decimals: 2, ...energy },
      { id: 'dmgBonus', label: 'DMG Bonus', unit: '%', decimals: 1, ...dmg },
      ...(pen.values.fully
        ? [{ id: 'penRatio' as const, label: 'PEN Ratio', unit: '%', decimals: 1, ...pen }]
        : []),
      { id: 'dazeBonus', label: 'Daze Bonus', unit: '%', decimals: 1, ...daze },
      ...optionalMetric('defIgnore', 'DEF Ignore', effects),
      ...optionalMetric('defReduction', 'DEF Reduction', effects),
      ...optionalMetric('resIgnore', 'RES Ignore', effects),
      ...optionalMetric('resReduction', 'RES Reduction', effects),
      ...optionalMetric('stunDmgMultiplier', 'Stun DMG Multiplier', effects),
    ],
    actionModifiers,
    operations: [
      ...(setup.mindscape >= 2
        ? [{
          id: 'benBlockCounterDefDamage',
          label: 'Special/EX Block Counter added DMG Multiplier',
          source: mindscapeSource('ben', 2),
          surface: 'fully' as const,
          value: values.mindscapeCounterDefDamage,
          unit: '% DEF',
        }]
        : []),
    ],
  }
}
