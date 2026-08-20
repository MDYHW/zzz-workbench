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
  presentSetupInputs,
  resolveDeliveredClauses,
  withApplicability,
  type CompleteSetup,
  type EffectMetric,
  type ResolvedCurrentEffect,
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
import type { AgentResult } from '../result'
import { composeRuptureSheerForce } from '../rupture'

export interface StarlightBillyCalculationContext {
  agentId: 'starlightBilly'
  setup: CompleteSetup
  additionalActive: boolean
}

const FULL_THROTTLE = sourceLocalAction(
  'Basic Attack: Full-Throttle Starlight', 'Basic Attack',
)
const COOL_WHEELIE = sourceLocalAction(
  'EX Special Attack: Cool Wheelie', 'EX Special Attack',
)
const ULTIMATE = sourceLocalAction(
  'Ultimate: Starlight Knight Flying Kick', 'Ultimate',
)
const ADDITIONAL_ACTIONS = actionTarget([
  FULL_THROTTLE,
  canonicalAction('EX Special Attack'),
  canonicalAction('Chain Attack'),
  canonicalAction('Ultimate'),
])
const FULL_THROTTLE_ACTION = actionTarget([FULL_THROTTLE])
const COOL_WHEELIE_ACTION = actionTarget([COOL_WHEELIE])
const ULTIMATE_ACTION = actionTarget([ULTIMATE])
const M6_SHEER_ACTIONS = actionTarget([FULL_THROTTLE, ULTIMATE])
const EX_SPECIAL = actionTarget([canonicalAction('EX Special Attack')])

const DMG_SCOPES = [
  {
    id: 'starlightBillyAdditionalActions',
    target: ADDITIONAL_ACTIONS,
    children: [
      {
        id: 'starlightBillyExSpecial',
        target: EX_SPECIAL,
        children: [{ id: 'starlightBillyM2CoolWheelie', target: COOL_WHEELIE_ACTION }],
      },
      { id: 'starlightBillyM2FullThrottle', target: FULL_THROTTLE_ACTION },
      { id: 'starlightBillyM2Ultimate', target: ULTIMATE_ACTION },
    ],
  },
] satisfies readonly ActionScopeNode[]
const CRIT_DMG_SCOPES = [
  { id: 'starlightBillyM2CoolWheelieCrit', target: COOL_WHEELIE_ACTION },
] satisfies readonly ActionScopeNode[]
const SHEER_SCOPES = [
  { id: 'starlightBillyM6SheerActions', target: M6_SHEER_ACTIONS },
] satisfies readonly ActionScopeNode[]

export const observeStarlightBilly = (
  setup: CompleteSetup,
  additionalActive: boolean,
): StarlightBillyCalculationContext => ({ agentId: 'starlightBilly', setup, additionalActive })

export function resolveStarlightBillyProviderClauses(
  context: StarlightBillyCalculationContext,
): SourceBoundCurrentClause[] {
  const { setup } = context
  const values = VERTICAL_VALUES.starlightBilly
  const engine = engineSource('starlightBilly', setup)
  const fourPiece = discSource('starlightBilly', setup.fourPieceId, '4-piece')
  const refinement = setup.refinement

  return active([
    additive('critDmg', 'fully', STATIC_SOURCES.starlightBilly.core,
      values.coreCritDmg, 'self'),
    additive('critDmg', 'fully', mindscapeSource('starlightBilly', 4),
      setup.mindscape >= 4
        ? values.mindscapeCoreCritDmgPerStack * values.mindscapeCoreCritDmgStacks
        : 0,
      'self'),
    additive('dmgBonus', 'fully', STATIC_SOURCES.starlightBilly.additional,
      context.additionalActive
        ? values.additionalDmgPerStack * values.additionalStacks
        : 0,
      'self', ADDITIONAL_ACTIONS),
    withApplicability(
      additive('resIgnore', 'fully', mindscapeSource('starlightBilly', 1, 'Physical RES Ignore'),
        setup.mindscape >= 1 ? values.mindscapePhysicalResIgnore : 0,
        'enemy-context'),
      { attributes: ['Physical'], formulas: ['general_damage', 'sheer_damage'] },
    ),
    ...[FULL_THROTTLE_ACTION, COOL_WHEELIE_ACTION, ULTIMATE_ACTION].map((target) => (
      additive('dmgBonus', 'fully', mindscapeSource('starlightBilly', 2),
        setup.mindscape >= 2 ? values.mindscapeActionDmg : 0,
        'self', target)
    )),
    additive('critDmg', 'fully', mindscapeSource('starlightBilly', 2, 'Turbocharged'),
      setup.mindscape >= 2 ? values.mindscapeCoolWheelieCritDmg : 0,
      'self', COOL_WHEELIE_ACTION),
    additive('sheerDmgBonus', 'fully', mindscapeSource('starlightBilly', 6),
      setup.mindscape >= 6 ? values.mindscapeSheerDmg : 0,
      'self', M6_SHEER_ACTIONS),

    additive('critRate', 'combat', engine,
      setup.engineId === 'starlightRiderFaceplate'
        ? equipmentEffectBaseValue(W_ENGINE_FACTS.starlightRiderFaceplate.effects.critRate, refinement)
        : setup.engineId === 'qingming'
          ? equipmentEffectBaseValue(W_ENGINE_FACTS.qingming.effects.critRate, refinement)
          : 0,
      'self'),
    additive('critRate', 'fully', engine,
      setup.engineId === 'cauldron'
        ? equipmentEffectBaseValue(W_ENGINE_FACTS.cauldron.effects.critRate, refinement)
        : setup.engineId === 'grillOWisp'
          ? equipmentEffectBaseValue(W_ENGINE_FACTS.grillOWisp.effects.critRate, refinement)
          : 0,
      'self'),
    additive('critDmg', 'fully', engine,
      setup.engineId === 'puzzleSphere'
        ? equipmentEffectBaseValue(W_ENGINE_FACTS.puzzleSphere.effects.critDamage, refinement)
        : 0,
      'self'),
    withApplicability(
      additive('dmgBonus', 'fully', engine,
        setup.engineId === 'cauldron'
          ? equipmentEffectBaseValue(W_ENGINE_FACTS.cauldron.effects.damage, refinement)
          : 0,
        'self'),
      { attributes: ['Physical'], formulas: ['sheer_damage'] },
    ),
    additive('dmgBonus', 'fully', engine,
      setup.engineId === 'puzzleSphere'
        ? equipmentEffectBaseValue(W_ENGINE_FACTS.puzzleSphere.effects.damage, refinement)
        : 0,
      'self', EX_SPECIAL),
    withApplicability(
      additive('sheerDmgBonus', 'fully', engine,
        setup.engineId === 'starlightRiderFaceplate'
          ? equipmentEffectMaximumValue(
            W_ENGINE_FACTS.starlightRiderFaceplate.effects.physicalSheerDamage,
            refinement,
          )
          : 0,
        'self'),
      { attributes: ['Physical'], formulas: ['sheer_damage'] },
    ),
    additive('critRate', 'fully', fourPiece,
      setup.fourPieceId === 'yunkui'
        ? equipmentEffectBaseValue(DRIVE_DISC_FACTS.yunkui.fourPiece.critRate)
        : 0,
      'self'),
    additive('sheerDmgBonus', 'fully', fourPiece,
      setup.fourPieceId === 'yunkui'
        ? equipmentEffectBaseValue(DRIVE_DISC_FACTS.yunkui.fourPiece.sheerDamage)
        : 0,
      'self'),
  ])
}

function optionalMetric(
  metricId: EffectMetric,
  label: string,
  effects: ResolvedCurrentEffect[],
): AgentResult['metrics'] {
  const metric = composeMetricEffects(
    surfaces(0, 0, 0), surfaces([], [], []), effects, metricId,
  )
  return metric.values.fully === 0
    ? []
    : [{ id: metricId, label, unit: '%', decimals: 1, ...metric }]
}

export function calculateStarlightBilly(
  setup: CompleteSetup,
  inbox: SourceBoundCurrentClause[],
  enemy: SourceBoundCurrentClause[],
): AgentResult {
  const values = VERTICAL_VALUES.starlightBilly
  const engine = W_ENGINES[setup.engineId]
  const baseAtk = values.atk + engine.baseAtk
  const hpInputs = presentSetupInputs([
    engineAdvancedInput(setup, 'starlightBilly', 'hpPct'),
    ...selectedDiscTwoPieceInputs(setup, 'starlightBilly', { modifier: 'maxHp' }),
    mainStatInput(setup, 'starlightBilly', 'slot4', 'hpPct'),
    mainStatInput(setup, 'starlightBilly', 'slot5', 'hpPct'),
    mainStatInput(setup, 'starlightBilly', 'slot6', 'hpPct'),
    effectiveSubstatInput(setup, 'starlightBilly', 'hpPct'),
  ])
  const initialHp = values.hp * (
    1 + hpInputs.reduce((total, input) => total + input.rawValue, 0) / 100
  ) + VERTICAL_VALUES.fixedDisc.hp
  const atkInputs = presentSetupInputs([
    engineAdvancedInput(setup, 'starlightBilly', 'atkPct'),
  ])
  const initialAtk = baseAtk * (
    1 + atkInputs.reduce((total, input) => total + input.rawValue, 0) / 100
  ) + VERTICAL_VALUES.fixedDisc.atk
  const effects = resolveDeliveredClauses([...inbox, ...enemy], {
    maxHp: initialHp,
    atk: initialAtk,
  })

  const maxHp = composeMetricEffects(
    surfaces(initialHp, initialHp, initialHp),
    surfaces(hpInputs.map((input) => percentageContribution(
      input.source, values.hp * input.rawValue / 100, input.rawValue,
    )), [], []),
    effects,
    'maxHp',
  )
  const atk = composeMetricEffects(
    surfaces(initialAtk, initialAtk, initialAtk),
    surfaces(atkInputs.map((input) => percentageContribution(
      input.source, baseAtk * input.rawValue / 100, input.rawValue,
    )), [], []),
    effects,
    'atk',
  )
  const sheerForce = composeRuptureSheerForce(
    atk.values, maxHp.values, STATIC_SOURCES.starlightBilly.ruptureConversion, effects,
  )

  const critRateInputs = presentSetupInputs([
    engineAdvancedInput(setup, 'starlightBilly', 'critRate'),
    mainStatInput(setup, 'starlightBilly', 'slot4', 'critRate'),
    ...selectedDiscTwoPieceInputs(setup, 'starlightBilly', { modifier: 'critRate' }),
    effectiveSubstatInput(setup, 'starlightBilly', 'critRate'),
  ])
  const initialCritRate = values.critRate
    + critRateInputs.reduce((total, input) => total + input.rawValue, 0)
  const critRate = composeMetricEffects(
    surfaces(initialCritRate, initialCritRate, initialCritRate),
    surfaces(critRateInputs.map((input) => contribution(input.source, input.rawValue)), [], []),
    effects,
    'critRate',
    { value: 100, source: STATIC_SOURCES.starlightBilly.critCap },
  )

  const critDmgInputs = presentSetupInputs([
    engineAdvancedInput(setup, 'starlightBilly', 'critDmg'),
    mainStatInput(setup, 'starlightBilly', 'slot4', 'critDmg'),
    ...selectedDiscTwoPieceInputs(setup, 'starlightBilly', { modifier: 'critDmg' }),
    effectiveSubstatInput(setup, 'starlightBilly', 'critDmg'),
  ])
  const initialCritDmg = values.critDmg
    + critDmgInputs.reduce((total, input) => total + input.rawValue, 0)
  const critDmg = composeMetricEffects(
    surfaces(initialCritDmg, initialCritDmg, initialCritDmg),
    surfaces(critDmgInputs.map((input) => contribution(input.source, input.rawValue)), [], []),
    effects,
    'critDmg',
  )

  const dmgInputs = presentSetupInputs([
    mainStatInput(setup, 'starlightBilly', 'slot5', 'physicalDmg'),
    ...selectedDiscTwoPieceInputs(setup, 'starlightBilly', { modifier: 'dmgBonus' }),
  ])
  const initialDmg = dmgInputs.reduce((total, input) => total + input.rawValue, 0)
  const dmgBonus = composeMetricEffects(
    surfaces(initialDmg, initialDmg, initialDmg),
    surfaces(dmgInputs.map((input) => contribution(input.source, input.rawValue)), [], []),
    effects,
    'dmgBonus',
  )
  const sheerDmgBonus = composeMetricEffects(
    surfaces(0, 0, 0), surfaces([], [], []), effects, 'sheerDmgBonus',
  )
  const actionModifiers = [
    ...composeActionHierarchy(dmgBonus.values, effects, 'dmgBonus', DMG_SCOPES),
    ...composeActionHierarchy(critDmg.values, effects, 'critDmg', CRIT_DMG_SCOPES),
    ...composeActionHierarchy(sheerDmgBonus.values, effects, 'sheerDmgBonus', SHEER_SCOPES),
  ]

  return {
    agentId: 'starlightBilly',
    metrics: [
      { id: 'maxHp', label: 'Max HP', unit: '', decimals: 0, ...maxHp },
      { id: 'atk', label: 'ATK', unit: '', decimals: 0, ...atk },
      { id: 'sheerForce', label: 'Sheer Force', unit: '', decimals: 1, ...sheerForce },
      { id: 'critRate', label: 'CRIT Rate', unit: '%', decimals: 1, ...critRate },
      { id: 'critDmg', label: 'CRIT DMG', unit: '%', decimals: 1, ...critDmg },
      { id: 'dmgBonus', label: 'DMG Bonus', unit: '%', decimals: 1, ...dmgBonus },
      { id: 'sheerDmgBonus', label: 'Sheer DMG Bonus', unit: '%', decimals: 1, ...sheerDmgBonus },
      ...optionalMetric('resIgnore', 'RES Ignore', effects),
      ...optionalMetric('resReduction', 'RES Reduction', effects),
      ...optionalMetric('stunDmgMultiplier', 'Stun DMG Multiplier', effects),
    ],
    actionModifiers,
    operations: setup.mindscape >= 6
      ? [{
        id: 'starlightBillyFinalHitMultiplier',
        label: 'Ultimate & Full-Throttle final-hit added Physical DMG',
        source: mindscapeSource('starlightBilly', 6, '2 Brilliant Starlight'),
        surface: 'fully',
        value: values.mindscapeAddedPhysicalDmgPerStack * values.mindscapeConsumedStacks,
        unit: '% Sheer Force',
      }]
      : [],
  }
}
