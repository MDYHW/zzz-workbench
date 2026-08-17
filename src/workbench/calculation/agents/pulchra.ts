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
  perSecond,
  percentage,
  presentSetupInputs,
  resolveDeliveredClauses,
  source,
  withApplicability,
  type CompleteSetup,
  type SourceBoundCurrentClause,
} from '../../effects'
import { AFTERSHOCK_TARGET, actionTarget, canonicalAction } from '../../actions'
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

export interface PulchraCalculationContext {
  agentId: 'pulchra'
  setup: CompleteSetup
  additionalActive: boolean
  initialAtk: number
}

const AFTERSHOCK = AFTERSHOCK_TARGET
const CORE_DAZE = actionTarget([
  canonicalAction('EX Special Attack'), canonicalAction('Assist Follow-Up'),
  canonicalAction('Chain Attack'), canonicalAction('Ultimate'),
])
const BASIC_DASH_DODGE = actionTarget([
  canonicalAction('Basic Attack'), canonicalAction('Dash Attack'),
  canonicalAction('Dodge Counter'),
])
const DAZE_SCOPES = [
  { id: 'pulchraExAssistChainUltimate', target: CORE_DAZE },
  { id: 'pulchraBasicDashDodge', target: BASIC_DASH_DODGE },
] satisfies readonly ActionScopeNode[]
const DAMAGE_SCOPES = [
  { id: 'pulchraAftershock', target: AFTERSHOCK },
] satisfies readonly ActionScopeNode[]
const DEF_SCOPES = [
  { id: 'pulchraAftershock', target: AFTERSHOCK },
] satisfies readonly ActionScopeNode[]

export function observePulchra(
  setup: CompleteSetup,
  additionalActive: boolean,
): PulchraCalculationContext {
  const initialAtk = initialAtkFor('pulchra', setup)
  if (initialAtk === null) throw new Error('Complete Pulchra setup requires a W-Engine')
  return { agentId: 'pulchra', setup, additionalActive, initialAtk }
}

function localKingCritRate(setup: CompleteSetup): number {
  return VERTICAL_VALUES.pulchra.critRate
    + (setup.mindscape >= 1 ? VERTICAL_VALUES.pulchra.mindscapeCritRate : 0)
    + (mainStatInput(setup, 'pulchra', 'slot4', 'critRate')?.rawValue ?? 0)
    + (discStatInput(setup, 'pulchra', 'twoPiece', 'woodpecker',
      equipmentEffectBaseValue(DRIVE_DISC_FACTS.woodpecker.twoPiece.critRate))?.rawValue ?? 0)
    + (effectiveSubstatInput(setup, 'pulchra', 'critRate')?.rawValue ?? 0)
}

export function resolvePulchraProviderClauses(
  context: PulchraCalculationContext,
): SourceBoundCurrentClause[] {
  const { setup, additionalActive } = context
  const values = VERTICAL_VALUES.pulchra
  const engine = engineSource('pulchra', setup)
  const refinement = setup.refinement
  const core = source(SOURCE_LABELS.pulchraCore, 'pulchra', 'core')
  const additional = source(SOURCE_LABELS.pulchraAbility, 'pulchra', 'additional')
  const kingCritDmg = setup.fourPieceId === 'king'
    ? localKingCritRate(setup) >= values.kingCritThreshold
      ? equipmentEffectMaximumValue(DRIVE_DISC_FACTS.king.fourPiece.critDamage)
      : equipmentEffectBaseValue(DRIVE_DISC_FACTS.king.fourPiece.critDamage)
    : 0

  return active([
    additive('dazeBonus', 'fully', core, values.coreDaze, 'self', CORE_DAZE),
    withApplicability(
      additive('dmgBonus', 'fully', additional,
        additionalActive ? values.additionalDmg : 0,
        'all-party', setup.mindscape >= 6 ? undefined : AFTERSHOCK),
      { formulas: ['general_damage', 'sheer_damage'] },
    ),
    additive('critRate', 'fully', mindscapeSource('pulchra', 1, 'Against Binding Trap'),
      setup.mindscape >= 1 ? values.mindscapeCritRate : 0, 'self'),
    percentage('atk', 'fully', mindscapeSource('pulchra', 2, "Hunter's Gait"),
      setup.mindscape >= 2 ? values.mindscapeAtk : 0, 'self'),

    percentage('impact', 'fully', engine,
      setup.engineId === 'blazingLaurel'
        ? equipmentEffectBaseValue(W_ENGINE_FACTS.blazingLaurel.effects.impact, refinement)
        : setup.engineId === 'hellfireGears'
          ? equipmentEffectBaseValue(W_ENGINE_FACTS.hellfireGears.effects.impact, refinement)
          : setup.engineId === 'steamOven'
            ? equipmentEffectBaseValue(W_ENGINE_FACTS.steamOven.effects.impact, refinement)
            : 0,
      'self'),
    withApplicability(
      additive('critDmg', 'fully', engine,
        setup.engineId === 'blazingLaurel'
          ? equipmentEffectMaximumValue(W_ENGINE_FACTS.blazingLaurel.effects.critDamage, refinement)
          : 0,
        'all-party'),
      { formulas: ['general_damage', 'sheer_damage'], attributes: ['Fire', 'Ice'] },
    ),
    ...(setup.engineId === 'hellfireGears'
      ? [perSecond(engine,
        equipmentEffectBaseValue(W_ENGINE_FACTS.hellfireGears.effects.energy, refinement),
        'self')]
      : []),
    withApplicability(
      additive('dmgBonus', 'fully', engine,
        setup.engineId === 'boxCutter'
          ? equipmentEffectBaseValue(W_ENGINE_FACTS.boxCutter.effects.physicalDamage, refinement)
          : 0,
        'self'),
      { attributes: ['Physical'] },
    ),
    additive('dazeBonus', 'fully', engine,
      setup.engineId === 'boxCutter'
        ? equipmentEffectBaseValue(W_ENGINE_FACTS.boxCutter.effects.daze, refinement)
        : setup.engineId === 'preciousFossilizedCore'
          ? equipmentEffectMaximumValue(W_ENGINE_FACTS.preciousFossilizedCore.effects.daze, refinement)
          : 0,
      'self'),

    additive('dazeBonus', 'initial',
      discSource('pulchra', 'king', '2-piece', setup.fourPieceId === 'king' ? '4-piece' : '2-piece'),
      setup.fourPieceId === 'king' || setup.twoPieceId === 'king'
        ? equipmentEffectBaseValue(DRIVE_DISC_FACTS.king.twoPiece.daze)
        : 0,
      'self'),
    withApplicability(
      additive('critDmg', 'fully', discSource('pulchra', 'king', '4-piece'),
        kingCritDmg, 'all-party', undefined, undefined, undefined, 'kingOfTheSummit'),
      { formulas: ['general_damage', 'sheer_damage'] },
    ),
    additive('dazeBonus', 'fully', discSource('pulchra', 'shockstar', '4-piece'),
      setup.fourPieceId === 'shockstar'
        ? equipmentEffectBaseValue(DRIVE_DISC_FACTS.shockstar.fourPiece.daze)
        : 0,
      'self', BASIC_DASH_DODGE),
    withApplicability(
      additive('dmgBonus', 'fully', discSource('pulchra', 'swingJazz', '4-piece'),
        setup.fourPieceId === 'swingJazz'
          ? equipmentEffectBaseValue(DRIVE_DISC_FACTS.swingJazz.fourPiece.damage)
          : 0,
        'all-party', undefined, undefined, undefined, 'swingJazz'),
      { formulas: ['general_damage', 'sheer_damage'] },
    ),
  ])
}

export function calculatePulchra(
  context: PulchraCalculationContext,
  inbox: SourceBoundCurrentClause[],
  enemy: SourceBoundCurrentClause[],
): AgentResult {
  const { setup, initialAtk } = context
  const values = VERTICAL_VALUES.pulchra
  const baseAtk = values.atk + W_ENGINES[setup.engineId].baseAtk
  const effects = resolveDeliveredClauses([...inbox, ...enemy], {
    atk: initialAtk, impact: values.impact,
  })

  const atkInputs = presentSetupInputs([
    engineAdvancedInput(setup, 'pulchra', 'atkPct'),
    mainStatInput(setup, 'pulchra', 'slot4', 'atkPct'),
    mainStatInput(setup, 'pulchra', 'slot5', 'atkPct'),
    discStatInput(setup, 'pulchra', 'fourPiece', 'astralVoice',
      equipmentEffectBaseValue(DRIVE_DISC_FACTS.astralVoice.twoPiece.atk), 'twoPiece'),
    discStatInput(setup, 'pulchra', 'twoPiece', 'astralVoice',
      equipmentEffectBaseValue(DRIVE_DISC_FACTS.astralVoice.twoPiece.atk)),
  ])
  const atk = composeMetricEffects(
    surfaces(initialAtk, initialAtk, initialAtk),
    surfaces(atkInputs.map((input) => percentageContribution(
      input.source, baseAtk * input.rawValue / 100, input.rawValue,
    )), [], []),
    effects,
    'atk',
  )

  const impactInputs = presentSetupInputs([
    engineAdvancedInput(setup, 'pulchra', 'impactPct'),
    mainStatInput(setup, 'pulchra', 'slot6', 'impact'),
    discStatInput(setup, 'pulchra', 'fourPiece', 'shockstar',
      equipmentEffectBaseValue(DRIVE_DISC_FACTS.shockstar.twoPiece.impact), 'twoPiece'),
    discStatInput(setup, 'pulchra', 'twoPiece', 'shockstar',
      equipmentEffectBaseValue(DRIVE_DISC_FACTS.shockstar.twoPiece.impact)),
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

  const critInputs = presentSetupInputs([
    mainStatInput(setup, 'pulchra', 'slot4', 'critRate'),
    discStatInput(setup, 'pulchra', 'twoPiece', 'woodpecker',
      equipmentEffectBaseValue(DRIVE_DISC_FACTS.woodpecker.twoPiece.critRate)),
    effectiveSubstatInput(setup, 'pulchra', 'critRate'),
  ])
  const initialCrit = values.critRate + critInputs.reduce((sum, input) => sum + input.rawValue, 0)
  const crit = composeMetricEffects(
    surfaces(initialCrit, initialCrit, initialCrit),
    surfaces(critInputs.map((input) => contribution(input.source, input.rawValue)), [], []),
    effects,
    'critRate',
    { value: 100, source: source('Displayed CRIT Rate cap', 'pulchra', 'calculation') },
  )

  const dmgInputs = presentSetupInputs([
    mainStatInput(setup, 'pulchra', 'slot5', 'physicalDmg'),
  ])
  const initialDmg = dmgInputs.reduce((sum, input) => sum + input.rawValue, 0)
  const dmg = composeMetricEffects(
    surfaces(initialDmg, initialDmg, initialDmg),
    surfaces(dmgInputs.map((input) => contribution(input.source, input.rawValue)), [], []),
    effects,
    'dmgBonus',
  )
  const defIgnore = composeMetricEffects(
    surfaces(0, 0, 0), surfaces([], [], []), effects, 'defIgnore',
  )
  const critDmg = composeMetricEffects(
    surfaces(values.critDmg, values.critDmg, values.critDmg),
    surfaces([], [], []), effects, 'critDmg',
  )
  const daze = composeMetricEffects(
    surfaces(0, 0, 0), surfaces([], [], []), effects, 'dazeBonus',
  )
  const resReduction = composeMetricEffects(
    surfaces(0, 0, 0), surfaces([], [], []), effects, 'resReduction',
  )
  const energyInputs = presentSetupInputs([
    engineAdvancedInput(setup, 'pulchra', 'energyRegenPct'),
    mainStatInput(setup, 'pulchra', 'slot6', 'energyRegenPct'),
    discStatInput(setup, 'pulchra', 'fourPiece', 'swingJazz',
      equipmentEffectBaseValue(DRIVE_DISC_FACTS.swingJazz.twoPiece.energyRegen), 'twoPiece'),
    discStatInput(setup, 'pulchra', 'twoPiece', 'swingJazz',
      equipmentEffectBaseValue(DRIVE_DISC_FACTS.swingJazz.twoPiece.energyRegen)),
  ])
  const energy = energyRegenProjection(values.baseEnergyRegen, energyInputs, effects)
  const actions = [
    ...composeActionHierarchy(daze.values, effects, 'dazeBonus', DAZE_SCOPES),
    ...composeActionHierarchy(dmg.values, effects, 'dmgBonus', DAMAGE_SCOPES),
    ...composeActionHierarchy(defIgnore.values, effects, 'defIgnore', DEF_SCOPES, 'DefIgnore'),
  ]

  const critMetric = setup.fourPieceId === 'king'
    ? [{
      id: 'critRate' as const, label: 'CRIT Rate', unit: '%', decimals: 1, ...crit,
      gauge: {
        source: discSource('pulchra', 'king', '4-piece'),
        basisLabel: 'Local CRIT Rate', current: localKingCritRate(setup),
        threshold: values.kingCritThreshold, cap: values.kingCritThreshold,
        outputLabel: 'Squad CRIT DMG',
        outputValue: localKingCritRate(setup) >= values.kingCritThreshold
          ? equipmentEffectMaximumValue(DRIVE_DISC_FACTS.king.fourPiece.critDamage)
          : equipmentEffectBaseValue(DRIVE_DISC_FACTS.king.fourPiece.critDamage),
        outputUnit: '%',
      },
    }]
    : []

  return {
    agentId: 'pulchra',
    metrics: [
      { id: 'atk', label: 'ATK', unit: '', decimals: 0, ...atk },
      ...critMetric,
      ...(critDmg.values.fully !== values.critDmg
        ? [{ id: 'critDmg' as const, label: 'CRIT DMG', unit: '%', decimals: 1, ...critDmg }]
        : []),
      { id: 'impact', label: 'Impact', unit: '', decimals: 2, ...impact },
      ...(energyInputs.length || setup.engineId === 'hellfireGears'
        ? [{ id: 'energyRegen' as const, label: 'Energy Regen', unit: '/s', decimals: 2, ...energy }]
        : []),
      { id: 'dmgBonus', label: 'DMG Bonus', unit: '%', decimals: 1, ...dmg },
      ...(defIgnore.values.fully || actions.some(({ metricId }) => metricId === 'defIgnore')
        ? [{ id: 'defIgnore' as const, label: 'DEF Ignore', unit: '%', decimals: 1, ...defIgnore }]
        : []),
      ...(resReduction.values.fully
        ? [{ id: 'resReduction' as const, label: 'RES Reduction', unit: '%', decimals: 1, ...resReduction }]
        : []),
      { id: 'dazeBonus', label: 'Daze Bonus', unit: '%', decimals: 1, ...daze },
    ],
    actionModifiers: actions,
    operations: [],
  }
}
