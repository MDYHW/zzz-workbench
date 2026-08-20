import {
  DRIVE_DISC_FACTS,
  VERTICAL_VALUES,
  W_ENGINE_FACTS,
  equipmentEffectBaseValue,
  equipmentEffectMaximumValue,
} from '../../content'
import { actionForm, actionTarget, canonicalAction } from '../../actions'
import {
  STATIC_SOURCES,
  active,
  additive,
  discSource,
  selectedDiscTwoPieceInputs,
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

export function calculateCaesar(
  context: CaesarCalculationContext,
  inbox: SourceBoundCurrentClause[],
  enemy: SourceBoundCurrentClause[],
): AgentResult {
  const { setup, initialAtk } = context
  const values = VERTICAL_VALUES.caesar

  const impactInputs = presentSetupInputs([
    engineAdvancedInput(setup, 'caesar', 'impactPct'),
    mainStatInput(setup, 'caesar', 'slot6', 'impact'),
    ...selectedDiscTwoPieceInputs(setup, 'caesar', { modifier: 'impact' }),
  ])
  const initialImpact = values.impact * (
    1 + impactInputs.reduce((sum, input) => sum + input.rawValue, 0) / 100
  )
  const effects = resolveDeliveredClauses([...inbox, ...enemy], {
    atk: initialAtk,
    impact: initialImpact,
  })

  const impact = composeMetricEffects(
    surfaces(initialImpact, initialImpact, initialImpact),
    surfaces(impactInputs.map((input) => percentageContribution(
      input.source, values.impact * input.rawValue / 100, input.rawValue,
    )), [], []),
    effects,
    'impact',
  )

  const critRateInputs = setup.mindscape >= 6 ? presentSetupInputs([
    mainStatInput(setup, 'caesar', 'slot4', 'critRate'),
  ]) : []
  const initialCritRate = values.critRate
    + critRateInputs.reduce((sum, input) => sum + input.rawValue, 0)
  const critRate = composeMetricEffects(
    surfaces(initialCritRate, initialCritRate, initialCritRate),
    surfaces(critRateInputs.map((input) => contribution(input.source, input.rawValue)), [], []),
    effects,
    'critRate',
    { value: 100, source: STATIC_SOURCES.caesar.critCap },
  )

  const critDmgInputs = setup.mindscape >= 6 ? presentSetupInputs([
    mainStatInput(setup, 'caesar', 'slot4', 'critDmg'),
  ]) : []
  const initialCritDmg = values.critDmg
    + critDmgInputs.reduce((sum, input) => sum + input.rawValue, 0)
  const critDmg = composeMetricEffects(
    surfaces(initialCritDmg, initialCritDmg, initialCritDmg),
    surfaces(critDmgInputs.map((input) => contribution(input.source, input.rawValue)), [], []),
    effects,
    'critDmg',
  )

  const dmgInputs = setup.mindscape >= 6 ? presentSetupInputs([
    mainStatInput(setup, 'caesar', 'slot5', 'physicalDmg'),
  ]) : []
  const initialDmg = dmgInputs.reduce((sum, input) => sum + input.rawValue, 0)
  const dmg = composeMetricEffects(
    surfaces(initialDmg, initialDmg, initialDmg),
    surfaces(dmgInputs.map((input) => contribution(input.source, input.rawValue)), [], []),
    effects,
    'dmgBonus',
  )
  const energyInputs = presentSetupInputs([
    ...selectedDiscTwoPieceInputs(setup, 'caesar', { modifier: 'energyRegen' }),
  ])
  const energy = energyRegenProjection(values.baseEnergyRegen, energyInputs, effects)
  const dazeInputs = selectedDiscTwoPieceInputs(setup, 'caesar', { modifier: 'dazeBonus' })
  const initialDaze = dazeInputs.reduce((total, input) => total + input.rawValue, 0)
  const daze = composeMetricEffects(
    surfaces(initialDaze, initialDaze, initialDaze),
    surfaces(dazeInputs.map((input) => contribution(input.source, input.rawValue)), [], []),
    effects,
    'dazeBonus',
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
      ...(setup.mindscape >= 6 ? [
        { id: 'critRate' as const, label: 'CRIT Rate', unit: '%', decimals: 1, ...critRate },
        { id: 'critDmg' as const, label: 'CRIT DMG', unit: '%', decimals: 1, ...critDmg },
      ] : []),
      { id: 'impact', label: 'Impact', unit: '', decimals: 2, ...impact },
      ...(energyInputs.length
        ? [{ id: 'energyRegen' as const, label: 'Energy Regen', unit: '/s', decimals: 2, ...energy }]
        : []),
      { id: 'dazeBonus', label: 'Daze Bonus', unit: '%', decimals: 1, ...daze },
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
