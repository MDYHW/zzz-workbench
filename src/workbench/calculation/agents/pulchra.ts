import {
  DRIVE_DISC_FACTS,
  SOURCE_LABELS,
  VERTICAL_VALUES,
  W_ENGINE_FACTS,
  equipmentEffectBaseValue,
  equipmentEffectMaximumValue,
} from '../../content'
import {
  active,
  additive,
  discSource,
  selectedDiscTwoPieceInputs,
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
import type { AgentResult } from '../result'

export interface PulchraCalculationContext {
  agentId: 'pulchra'
  setup: CompleteSetup
  additionalActive: boolean
}

const AFTERSHOCK = AFTERSHOCK_TARGET
const CORE_DAZE = actionTarget([
  canonicalAction('EX Special Attack'), canonicalAction('Assist Follow-Up'),
  canonicalAction('Chain Attack'), canonicalAction('Ultimate'),
])
const DAZE_SCOPES = [
  { id: 'pulchraExAssistChainUltimate', target: CORE_DAZE },
] satisfies readonly ActionScopeNode[]

export function observePulchra(
  setup: CompleteSetup,
  additionalActive: boolean,
): PulchraCalculationContext {
  return { agentId: 'pulchra', setup, additionalActive }
}

function localKingCritRate(setup: CompleteSetup): number {
  return VERTICAL_VALUES.pulchra.critRate
    + (setup.mindscape >= 1 ? VERTICAL_VALUES.pulchra.mindscapeCritRate : 0)
    + (mainStatInput(setup, 'pulchra', 'slot4', 'critRate')?.rawValue ?? 0)
    + selectedDiscTwoPieceInputs(setup, 'pulchra', { modifier: 'critRate' })
      .reduce((total, input) => total + input.rawValue, 0)
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
    additive('dazeBonus', 'fully', engine,
      setup.engineId === 'boxCutter'
        ? equipmentEffectBaseValue(W_ENGINE_FACTS.boxCutter.effects.daze, refinement)
        : setup.engineId === 'preciousFossilizedCore'
          ? equipmentEffectMaximumValue(W_ENGINE_FACTS.preciousFossilizedCore.effects.daze, refinement)
          : 0,
      'self'),

    withApplicability(
      additive('critDmg', 'fully', discSource('pulchra', 'king', '4-piece'),
        kingCritDmg, 'all-party', undefined, undefined, undefined, 'kingOfTheSummit'),
      { formulas: ['general_damage', 'sheer_damage'] },
    ),
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
  const { setup } = context
  const values = VERTICAL_VALUES.pulchra
  const effects = resolveDeliveredClauses([...inbox, ...enemy], {
    impact: values.impact,
  })

  const impactInputs = presentSetupInputs([
    engineAdvancedInput(setup, 'pulchra', 'impactPct'),
    mainStatInput(setup, 'pulchra', 'slot6', 'impact'),
    ...selectedDiscTwoPieceInputs(setup, 'pulchra', { modifier: 'impact' }),
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
    ...selectedDiscTwoPieceInputs(setup, 'pulchra', { modifier: 'critRate' }),
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

  const dazeInputs = selectedDiscTwoPieceInputs(setup, 'pulchra', { modifier: 'dazeBonus' })
  const initialDaze = dazeInputs.reduce((total, input) => total + input.rawValue, 0)
  const daze = composeMetricEffects(
    surfaces(initialDaze, initialDaze, initialDaze),
    surfaces(dazeInputs.map((input) => contribution(input.source, input.rawValue)), [], []),
    effects,
    'dazeBonus',
  )
  const energyInputs = presentSetupInputs([
    engineAdvancedInput(setup, 'pulchra', 'energyRegenPct'),
    mainStatInput(setup, 'pulchra', 'slot6', 'energyRegenPct'),
    ...selectedDiscTwoPieceInputs(setup, 'pulchra', { modifier: 'energyRegen' }),
  ])
  const energy = energyRegenProjection(values.baseEnergyRegen, energyInputs, effects)
  const actions = composeActionHierarchy(daze.values, effects, 'dazeBonus', DAZE_SCOPES)

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
      ...critMetric,
      { id: 'impact', label: 'Impact', unit: '', decimals: 2, ...impact },
      ...(energyInputs.length || setup.engineId === 'hellfireGears'
        ? [{ id: 'energyRegen' as const, label: 'Energy Regen', unit: '/s', decimals: 2, ...energy }]
        : []),
      { id: 'dazeBonus', label: 'Daze Bonus', unit: '%', decimals: 1, ...daze },
    ],
    actionModifiers: actions,
    operations: [],
  }
}
