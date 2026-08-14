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
  pufferElectroFourPieceClauses,
  resolveDeliveredClauses,
  source,
  withApplicability,
  type CompleteSetup,
  type EffectMetric,
  type SourceBoundCurrentClause,
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
import type { AgentResult } from '../result'

export interface BillyCalculationContext {
  agentId: 'billy'
  setup: CompleteSetup
  additionalActive: boolean
  initialAtk: number
}

const BASIC = actionTarget([canonicalAction('Basic Attack')])
const DASH = actionTarget([canonicalAction('Dash Attack')])
const DODGE_COUNTER = actionTarget([canonicalAction('Dodge Counter')])
const EX_SPECIAL = actionTarget([canonicalAction('EX Special Attack')])
const ULTIMATE = actionTarget([canonicalAction('Ultimate')])
const CROUCHING_ACTIONS = actionTarget([
  canonicalAction('Basic Attack'),
  canonicalAction('Dash Attack'),
  canonicalAction('Dodge Counter'),
  canonicalAction('Special Attack'),
  canonicalAction('EX Special Attack'),
  canonicalAction('Ultimate'),
])
const BASIC_ULTIMATE = actionTarget([
  canonicalAction('Basic Attack'),
  canonicalAction('Ultimate'),
])

const DAMAGE_SCOPES = [
  {
    id: 'billyCrouchingActions', target: CROUCHING_ACTIONS,
    children: [
      { id: 'billyBasic', target: BASIC },
      { id: 'billyDash', target: DASH },
      { id: 'billyDodgeCounter', target: DODGE_COUNTER },
      { id: 'billyExSpecial', target: EX_SPECIAL },
      { id: 'billyUltimate', target: ULTIMATE },
    ],
  },
] satisfies readonly ActionScopeNode[]
const CRIT_SCOPES = [
  { id: 'billyExSpecial', target: EX_SPECIAL },
] satisfies readonly ActionScopeNode[]
const DEF_SCOPES = [
  { id: 'billyBasicUltimate', target: BASIC_ULTIMATE },
] satisfies readonly ActionScopeNode[]

export function observeBilly(
  setup: CompleteSetup,
  additionalActive: boolean,
): BillyCalculationContext {
  const initialAtk = initialAtkFor('billy', setup)
  if (initialAtk === null) throw new Error('Complete Billy setup requires a W-Engine')
  return { agentId: 'billy', setup, additionalActive, initialAtk }
}

export function resolveBillyProviderClauses(
  context: BillyCalculationContext,
): SourceBoundCurrentClause[] {
  const { setup, additionalActive } = context
  const values = VERTICAL_VALUES.billy
  const refinement = setup.refinement
  const engine = engineSource('billy', setup)
  const core = source(SOURCE_LABELS.billyCore, 'billy', 'core')
  const additional = source(SOURCE_LABELS.billyAbility, 'billy', 'additional')

  return active([
    additive('dmgBonus', 'fully', core, values.coreActionDmg, 'self', CROUCHING_ACTIONS),
    additive(
      'dmgBonus', 'fully', additional,
      additionalActive ? values.additionalUltimateDmg : 0,
      'self', ULTIMATE,
    ),
    additive(
      'dmgBonus', 'fully', mindscapeSource('billy', 2),
      setup.mindscape >= 2 ? values.mindscapeDodgeDmg : 0,
      'self', DODGE_COUNTER,
    ),
    additive(
      'critRate', 'fully', mindscapeSource('billy', 4),
      setup.mindscape >= 4 ? values.mindscapeExCritRate : 0,
      'self', EX_SPECIAL,
    ),
    additive(
      'dmgBonus', 'fully', mindscapeSource('billy', 6, 'Five stacks'),
      setup.mindscape >= 6 ? values.mindscapeDmg : 0,
      'self',
    ),

    additive(
      'critRate', 'combat', engine,
      setup.engineId === 'cordisGermina'
        ? equipmentEffectBaseValue(W_ENGINE_FACTS.cordisGermina.effects.critRate, refinement)
        : 0,
      'self',
    ),
    additive(
      'critDmg', 'combat', engine,
      setup.engineId === 'heartstringNocturne'
        ? equipmentEffectBaseValue(W_ENGINE_FACTS.heartstringNocturne.effects.critDamage, refinement)
        : 0,
      'self',
    ),
    additive(
      'dmgBonus', 'combat', engine,
      setup.engineId === 'steelCushion'
        ? equipmentEffectBaseValue(W_ENGINE_FACTS.steelCushion.effects.physicalDamage, refinement)
        : 0,
      'self',
    ),
    additive(
      'dmgBonus', 'fully', engine,
      setup.engineId === 'steelCushion'
        ? equipmentEffectBaseValue(W_ENGINE_FACTS.steelCushion.effects.damage, refinement)
        : 0,
      'self',
    ),
    additive(
      'defIgnore', 'fully', engine,
      setup.engineId === 'cordisGermina'
        ? equipmentEffectBaseValue(W_ENGINE_FACTS.cordisGermina.effects.defIgnore, refinement)
        : 0,
      'enemy-context', BASIC_ULTIMATE, undefined, ['billy'],
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
        'enemy-context', undefined, undefined, ['billy'],
      ),
      { attributes: ['Physical'] },
    ),
    percentage(
      'atk', 'fully', engine,
      setup.engineId === 'brimstone'
        ? equipmentEffectMaximumValue(W_ENGINE_FACTS.brimstone.effects.atk, refinement)
        : 0,
      'self',
    ),
    additive(
      'dmgBonus', 'fully', engine,
      setup.engineId === 'starlightEngineReplica'
        ? equipmentEffectBaseValue(
          W_ENGINE_FACTS.starlightEngineReplica.effects.physicalDamage,
          refinement,
        )
        : 0,
      'self',
    ),

    percentage(
      'atk', 'fully', discSource('billy', 'woodpecker', '4-piece'),
      setup.fourPieceId === 'woodpecker'
        ? equipmentEffectBaseValue(DRIVE_DISC_FACTS.woodpecker.fourPiece.atk)
        : 0,
      'self',
    ),
    additive(
      'dmgBonus', 'initial', discSource('billy', 'shadowHarmony', '2-piece', '4-piece'),
      setup.fourPieceId === 'shadowHarmony'
        ? equipmentEffectBaseValue(DRIVE_DISC_FACTS.shadowHarmony.twoPiece.damage)
        : 0,
      'self', DASH,
    ),
    percentage(
      'atk', 'fully', discSource('billy', 'shadowHarmony', '4-piece'),
      setup.fourPieceId === 'shadowHarmony'
        ? equipmentEffectBaseValue(DRIVE_DISC_FACTS.shadowHarmony.fourPiece.atk)
        : 0,
      'self',
    ),
    additive(
      'critRate', 'fully', discSource('billy', 'shadowHarmony', '4-piece'),
      setup.fourPieceId === 'shadowHarmony'
        ? equipmentEffectBaseValue(DRIVE_DISC_FACTS.shadowHarmony.fourPiece.critRate)
        : 0,
      'self',
    ),
    ...pufferElectroFourPieceClauses('billy', setup, ULTIMATE),
  ])
}

function optionalMetric(
  metricId: EffectMetric,
  label: string,
  effects: ReturnType<typeof resolveDeliveredClauses>,
  actions: AgentResult['actionModifiers'] = [],
): AgentResult['metrics'] {
  const data = composeMetricEffects(surfaces(0, 0, 0), surfaces([], [], []), effects, metricId)
  return data.values.fully || actions.some(({ metricId: actionMetric }) => actionMetric === metricId)
    ? [{ id: metricId, label, unit: '%', decimals: 1, ...data }]
    : []
}

export function calculateBilly(
  context: BillyCalculationContext,
  inbox: SourceBoundCurrentClause[],
  enemy: SourceBoundCurrentClause[],
): AgentResult {
  const { setup, initialAtk } = context
  const values = VERTICAL_VALUES.billy
  const baseAtk = values.atk + W_ENGINES[setup.engineId].baseAtk
  const effects = resolveDeliveredClauses([...inbox, ...enemy], { atk: initialAtk })

  const atkInputs = presentSetupInputs([
    engineAdvancedInput(setup, 'billy', 'atkPct'),
    mainStatInput(setup, 'billy', 'slot4', 'atkPct'),
    mainStatInput(setup, 'billy', 'slot5', 'atkPct'),
    mainStatInput(setup, 'billy', 'slot6', 'atkPct'),
    discStatInput(setup, 'billy', 'fourPiece', 'hormonePunk',
      equipmentEffectBaseValue(DRIVE_DISC_FACTS.hormonePunk.twoPiece.atk), 'twoPiece'),
    discStatInput(setup, 'billy', 'twoPiece', 'hormonePunk',
      equipmentEffectBaseValue(DRIVE_DISC_FACTS.hormonePunk.twoPiece.atk)),
    discStatInput(setup, 'billy', 'fourPiece', 'astralVoice',
      equipmentEffectBaseValue(DRIVE_DISC_FACTS.astralVoice.twoPiece.atk), 'twoPiece'),
    discStatInput(setup, 'billy', 'twoPiece', 'astralVoice',
      equipmentEffectBaseValue(DRIVE_DISC_FACTS.astralVoice.twoPiece.atk)),
    effectiveSubstatInput(setup, 'billy', 'atkPct'),
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
    engineAdvancedInput(setup, 'billy', 'critRate'),
    mainStatInput(setup, 'billy', 'slot4', 'critRate'),
    discStatInput(setup, 'billy', 'fourPiece', 'woodpecker',
      equipmentEffectBaseValue(DRIVE_DISC_FACTS.woodpecker.twoPiece.critRate), 'twoPiece'),
    discStatInput(setup, 'billy', 'twoPiece', 'woodpecker',
      equipmentEffectBaseValue(DRIVE_DISC_FACTS.woodpecker.twoPiece.critRate)),
    effectiveSubstatInput(setup, 'billy', 'critRate'),
  ])
  const initialCritRate = values.critRate
    + critRateInputs.reduce((sum, input) => sum + input.rawValue, 0)
  const critRate = composeMetricEffects(
    surfaces(initialCritRate, initialCritRate, initialCritRate),
    surfaces(critRateInputs.map((input) => contribution(input.source, input.rawValue)), [], []),
    effects,
    'critRate',
    { value: 100, source: source('Displayed CRIT Rate cap', 'billy', 'calculation') },
  )

  const critDmgInputs = presentSetupInputs([
    engineAdvancedInput(setup, 'billy', 'critDmg'),
    mainStatInput(setup, 'billy', 'slot4', 'critDmg'),
    discStatInput(setup, 'billy', 'twoPiece', 'branchAndBlade',
      equipmentEffectBaseValue(DRIVE_DISC_FACTS.branchAndBlade.twoPiece.critDamage)),
    effectiveSubstatInput(setup, 'billy', 'critDmg'),
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
    mainStatInput(setup, 'billy', 'slot5', 'physicalDmg'),
    discStatInput(setup, 'billy', 'twoPiece', 'fangedMetal',
      equipmentEffectBaseValue(DRIVE_DISC_FACTS.fangedMetal.twoPiece.damage)),
  ])
  const initialDmg = dmgInputs.reduce((sum, input) => sum + input.rawValue, 0)
  const dmg = composeMetricEffects(
    surfaces(initialDmg, initialDmg, initialDmg),
    surfaces(dmgInputs.map((input) => contribution(input.source, input.rawValue)), [], []),
    effects,
    'dmgBonus',
  )

  const penInputs = presentSetupInputs([
    mainStatInput(setup, 'billy', 'slot5', 'penRatio'),
    discStatInput(setup, 'billy', 'fourPiece', 'pufferElectro',
      equipmentEffectBaseValue(DRIVE_DISC_FACTS.pufferElectro.twoPiece.penRatio), 'twoPiece'),
    discStatInput(setup, 'billy', 'twoPiece', 'pufferElectro',
      equipmentEffectBaseValue(DRIVE_DISC_FACTS.pufferElectro.twoPiece.penRatio)),
  ])
  const initialPen = penInputs.reduce((sum, input) => sum + input.rawValue, 0)
  const pen = composeMetricEffects(
    surfaces(initialPen, initialPen, initialPen),
    surfaces(penInputs.map((input) => contribution(input.source, input.rawValue)), [], []),
    effects,
    'penRatio',
  )

  const defIgnore = composeMetricEffects(surfaces(0, 0, 0), surfaces([], [], []), effects, 'defIgnore')
  const actionModifiers = [
    ...composeActionHierarchy(dmg.values, effects, 'dmgBonus', DAMAGE_SCOPES),
    ...composeActionHierarchy(
      critRate.values,
      effects,
      'critRate',
      CRIT_SCOPES,
      'CritRate',
      { value: 100, source: source('Displayed CRIT Rate cap', 'billy', 'calculation') },
    ),
    ...composeActionHierarchy(defIgnore.values, effects, 'defIgnore', DEF_SCOPES, 'DefIgnore'),
  ]

  return {
    agentId: 'billy',
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
