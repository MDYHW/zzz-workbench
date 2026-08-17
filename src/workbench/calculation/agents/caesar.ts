import {
  DRIVE_DISC_FACTS,
  VERTICAL_VALUES,
  W_ENGINE_FACTS,
  W_ENGINES,
  equipmentEffectBaseValue,
  equipmentEffectMaximumValue,
} from '../../content'
import { actionForm, actionTarget, canonicalAction } from '../../actions'
import {
  STATIC_SOURCES,
  active,
  additive,
  discSource,
  discStatInput,
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

export interface CaesarCalculationContext {
  agentId: 'caesar'
  setup: CompleteSetup
  additionalActive: boolean
  initialAtk: number
}

const M6_ACTIONS = actionTarget([
  actionForm('EX Special Attack', 'Overpowered Shield Bash'),
  canonicalAction('Assist Follow-Up'),
])
const SHIELDED_ULTIMATE = actionTarget([
  actionForm('Ultimate', 'Against a shielded enemy'),
])
const M6_SCOPES = [
  { id: 'caesarM6Actions', target: M6_ACTIONS },
] satisfies readonly ActionScopeNode[]
const ULTIMATE_DAZE_SCOPES = [
  { id: 'caesarShieldedUltimate', target: SHIELDED_ULTIMATE },
] satisfies readonly ActionScopeNode[]

export function observeCaesar(
  setup: CompleteSetup,
  additionalActive: boolean,
): CaesarCalculationContext {
  const initialAtk = initialAtkFor('caesar', setup)
  if (initialAtk === null) throw new Error('Complete Caesar setup requires a W-Engine')
  return { agentId: 'caesar', setup, additionalActive, initialAtk }
}

function tierDelta(
  values: readonly [number, number, number],
  fromTier: 1 | 2,
): number {
  return values[fromTier] - values[fromTier - 1]
}

export function resolveCaesarProviderClauses(
  context: CaesarCalculationContext,
): SourceBoundCurrentClause[] {
  const { setup, additionalActive } = context
  const values = VERTICAL_VALUES.caesar
  const engine = engineSource('caesar', setup)
  const refinement = setup.refinement
  const specialImpact = source(
    'Special Attack',
    'caesar',
    'special',
    'After Perfect Block, Retaliation, or Defensive Assist',
  )
  const shieldedUltimate = source('Ultimate', 'caesar', 'special', 'Against a shielded enemy')
  const focusAtkSource = setup.mindscape >= 2
    ? mindscapeSource('caesar', 2, 'Radiant Aegis ATK replacement')
    : STATIC_SOURCES.caesar.core

  return active([
    percentage('impact', 'fully', specialImpact, values.coreImpactByTier[0], 'self'),
    percentage(
      'impact', 'fully', mindscapeSource('caesar', 3, 'Special Attack skill level +2'),
      setup.mindscape >= 3 ? tierDelta(values.coreImpactByTier, 1) : 0, 'self',
    ),
    percentage(
      'impact', 'fully', mindscapeSource('caesar', 5, 'Special Attack skill level +2'),
      setup.mindscape >= 5 ? tierDelta(values.coreImpactByTier, 2) : 0, 'self',
    ),
    additive(
      'atk', 'fully', focusAtkSource,
      setup.mindscape >= 2 ? values.mindscapeFocusAtk : values.coreFocusAtk,
      'focus',
    ),
    additive(
      'dmgBonus', 'fully', STATIC_SOURCES.caesar.additional,
      additionalActive ? values.additionalDmgBonus : 0,
      'enemy-context',
    ),
    withApplicability(
      additive(
        'resReduction', 'fully', mindscapeSource('caesar', 1, 'While Radiant Aegis is active'),
        setup.mindscape >= 1 ? values.mindscapeResReduction : 0,
        'enemy-context',
      ),
      { formulas: ['general_damage', 'sheer_damage'] },
    ),
    additive(
      'dazeBonus', 'fully', shieldedUltimate,
      values.ultimateDazeByTier[0], 'self', SHIELDED_ULTIMATE,
    ),
    additive(
      'dazeBonus', 'fully', mindscapeSource('caesar', 3, 'Ultimate skill level +2'),
      setup.mindscape >= 3 ? tierDelta(values.ultimateDazeByTier, 1) : 0,
      'self', SHIELDED_ULTIMATE,
    ),
    additive(
      'dazeBonus', 'fully', mindscapeSource('caesar', 5, 'Ultimate skill level +2'),
      setup.mindscape >= 5 ? tierDelta(values.ultimateDazeByTier, 2) : 0,
      'self', SHIELDED_ULTIMATE,
    ),
    additive(
      'critRate', 'fully', mindscapeSource('caesar', 6),
      setup.mindscape >= 6 ? values.mindscapeCritRate : 0, 'self',
    ),
    additive(
      'critDmg', 'fully', mindscapeSource('caesar', 6),
      setup.mindscape >= 6 ? values.mindscapeCritDmg : 0, 'self',
    ),
    additive(
      'critRate', 'fully', mindscapeSource('caesar', 6, 'Guaranteed CRIT'),
      setup.mindscape >= 6 ? values.mindscapeActionCritRate : 0,
      'self', M6_ACTIONS,
    ),
    additive(
      'dmgBonus', 'fully', mindscapeSource('caesar', 6),
      setup.mindscape >= 6 ? values.mindscapeActionDmg : 0,
      'self', M6_ACTIONS,
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

    additive(
      'dazeBonus', 'initial',
      discSource('caesar', 'king', '2-piece'),
      setup.twoPieceId === 'king'
        ? equipmentEffectBaseValue(DRIVE_DISC_FACTS.king.twoPiece.daze)
        : 0,
      'self',
    ),

    withApplicability(
      additive(
        'dmgBonus', 'fully', discSource('caesar', 'bunnyInWonderland', '4-piece'),
        setup.fourPieceId === 'bunnyInWonderland'
          ? equipmentEffectMaximumValue(DRIVE_DISC_FACTS.bunnyInWonderland.fourPiece.damage)
          : 0,
        'all-party', undefined, undefined, undefined, 'bunnyInWonderland',
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

export function calculateCaesar(
  context: CaesarCalculationContext,
  inbox: SourceBoundCurrentClause[],
  enemy: SourceBoundCurrentClause[],
): AgentResult {
  const { setup, initialAtk } = context
  const values = VERTICAL_VALUES.caesar
  const baseAtk = values.atk + W_ENGINES[setup.engineId].baseAtk

  const impactInputs = presentSetupInputs([
    engineAdvancedInput(setup, 'caesar', 'impactPct'),
    mainStatInput(setup, 'caesar', 'slot6', 'impact'),
    discStatInput(
      setup, 'caesar', 'twoPiece', 'shockstar',
      equipmentEffectBaseValue(DRIVE_DISC_FACTS.shockstar.twoPiece.impact),
    ),
  ])
  const initialImpact = values.impact * (
    1 + impactInputs.reduce((sum, input) => sum + input.rawValue, 0) / 100
  )
  const effects = resolveDeliveredClauses([...inbox, ...enemy], {
    atk: initialAtk,
    impact: initialImpact,
  })

  const atkInputs = presentSetupInputs([
    engineAdvancedInput(setup, 'caesar', 'atkPct'),
    mainStatInput(setup, 'caesar', 'slot4', 'atkPct'),
    mainStatInput(setup, 'caesar', 'slot5', 'atkPct'),
    discStatInput(
      setup, 'caesar', 'fourPiece', 'astralVoice',
      equipmentEffectBaseValue(DRIVE_DISC_FACTS.astralVoice.twoPiece.atk), 'twoPiece',
    ),
  ])
  const atk = composeMetricEffects(
    surfaces(initialAtk, initialAtk, initialAtk),
    surfaces(atkInputs.map((input) => percentageContribution(
      input.source, baseAtk * input.rawValue / 100, input.rawValue,
    )), [], []),
    effects,
    'atk',
  )
  const impact = composeMetricEffects(
    surfaces(initialImpact, initialImpact, initialImpact),
    surfaces(impactInputs.map((input) => percentageContribution(
      input.source, values.impact * input.rawValue / 100, input.rawValue,
    )), [], []),
    effects,
    'impact',
  )

  const critRateInputs = presentSetupInputs([
    mainStatInput(setup, 'caesar', 'slot4', 'critRate'),
  ])
  const initialCritRate = values.critRate
    + critRateInputs.reduce((sum, input) => sum + input.rawValue, 0)
  const critRate = composeMetricEffects(
    surfaces(initialCritRate, initialCritRate, initialCritRate),
    surfaces(critRateInputs.map((input) => contribution(input.source, input.rawValue)), [], []),
    effects,
    'critRate',
    { value: 100, source: STATIC_SOURCES.caesar.critCap },
  )

  const critDmgInputs = presentSetupInputs([
    mainStatInput(setup, 'caesar', 'slot4', 'critDmg'),
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
    mainStatInput(setup, 'caesar', 'slot5', 'physicalDmg'),
  ])
  const initialDmg = dmgInputs.reduce((sum, input) => sum + input.rawValue, 0)
  const dmg = composeMetricEffects(
    surfaces(initialDmg, initialDmg, initialDmg),
    surfaces(dmgInputs.map((input) => contribution(input.source, input.rawValue)), [], []),
    effects,
    'dmgBonus',
  )

  const penInputs = presentSetupInputs([
    mainStatInput(setup, 'caesar', 'slot5', 'penRatio'),
  ])
  const initialPen = penInputs.reduce((sum, input) => sum + input.rawValue, 0)
  const pen = composeMetricEffects(
    surfaces(initialPen, initialPen, initialPen),
    surfaces(penInputs.map((input) => contribution(input.source, input.rawValue)), [], []),
    effects,
    'penRatio',
  )
  const energyInputs = presentSetupInputs([
    discStatInput(
      setup, 'caesar', 'twoPiece', 'swingJazz',
      equipmentEffectBaseValue(DRIVE_DISC_FACTS.swingJazz.twoPiece.energyRegen),
    ),
  ])
  const energy = energyRegenProjection(values.baseEnergyRegen, energyInputs, effects)
  const daze = composeMetricEffects(
    surfaces(0, 0, 0), surfaces([], [], []), effects, 'dazeBonus',
  )
  const actionModifiers = [
    ...composeActionHierarchy(dmg.values, effects, 'dmgBonus', M6_SCOPES),
    ...composeActionHierarchy(
      critRate.values,
      effects,
      'critRate',
      M6_SCOPES,
      'CritRate',
      { value: 100, source: STATIC_SOURCES.caesar.critCap },
    ),
    ...composeActionHierarchy(daze.values, effects, 'dazeBonus', ULTIMATE_DAZE_SCOPES),
  ]
  return {
    agentId: 'caesar',
    metrics: [
      { id: 'atk', label: 'ATK', unit: '', decimals: 0, ...atk },
      { id: 'critRate', label: 'CRIT Rate', unit: '%', decimals: 1, ...critRate },
      { id: 'critDmg', label: 'CRIT DMG', unit: '%', decimals: 1, ...critDmg },
      { id: 'impact', label: 'Impact', unit: '', decimals: 2, ...impact },
      ...(energyInputs.length
        ? [{ id: 'energyRegen' as const, label: 'Energy Regen', unit: '/s', decimals: 2, ...energy }]
        : []),
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
      ...(setup.mindscape >= 6
        ? [{
          id: 'caesarPrimaryTargetFollowup',
          label: 'Overpowered Shield Bash/Assist Follow-Up primary-target follow-up',
          source: mindscapeSource('caesar', 6),
          surface: 'fully' as const,
          value: values.mindscapePrimaryTargetFollowup,
          unit: '% original action DMG',
        }]
        : []),
    ],
  }
}
