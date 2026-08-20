import {
  DRIVE_DISC_FACTS,
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
  STATIC_SOURCES,
  withApplicability,
  type CompleteSetup,
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
import type { AgentResult } from '../result'

export interface KoledaCalculationContext {
  agentId: 'koleda'
  setup: CompleteSetup
  additionalActive: boolean
}

const BASIC_DASH_DODGE = actionTarget([
  canonicalAction('Basic Attack'), canonicalAction('Dash Attack'),
  canonicalAction('Dodge Counter'),
])
const ENHANCED_BASIC = actionTarget([
  actionForm('Basic Attack', 'Enhanced Furnace Fire'),
])
const SPECIAL = actionTarget([canonicalAction('Special Attack')])
const EX_SPECIAL = actionTarget([canonicalAction('EX Special Attack')])
const BASIC = actionTarget([canonicalAction('Basic Attack')])
const CHAIN = actionTarget([canonicalAction('Chain Attack')])
const DAZE_SCOPES = [
  {
    id: 'koledaBasicDashDodge', target: BASIC_DASH_DODGE,
    children: [
      { id: 'koledaBasic', target: BASIC },
      { id: 'koledaEnhancedBasic', target: ENHANCED_BASIC },
    ],
  },
  {
    id: 'koledaSpecial', target: SPECIAL,
    children: [{ id: 'koledaExSpecial', target: EX_SPECIAL }],
  },
] satisfies readonly ActionScopeNode[]

export function observeKoleda(
  setup: CompleteSetup,
  additionalActive: boolean,
): KoledaCalculationContext {
  return { agentId: 'koleda', setup, additionalActive }
}

function localKingCritRate(setup: CompleteSetup): number {
  return VERTICAL_VALUES.koleda.critRate
    + (mainStatInput(setup, 'koleda', 'slot4', 'critRate')?.rawValue ?? 0)
    + (effectiveSubstatInput(setup, 'koleda', 'critRate')?.rawValue ?? 0)
}

function engineImpact(setup: CompleteSetup): number {
  const refinement = setup.refinement
  switch (setup.engineId) {
    case 'blazingLaurel':
      return equipmentEffectBaseValue(W_ENGINE_FACTS.blazingLaurel.effects.impact, refinement)
    case 'hellfireGears':
      return equipmentEffectMaximumValue(W_ENGINE_FACTS.hellfireGears.effects.impact, refinement)
    case 'steamOven':
      return equipmentEffectMaximumValue(W_ENGINE_FACTS.steamOven.effects.impact, refinement)
    default:
      return 0
  }
}

export function resolveKoledaProviderClauses(
  context: KoledaCalculationContext,
): SourceBoundCurrentClause[] {
  const { setup, additionalActive } = context
  const values = VERTICAL_VALUES.koleda
  const engine = engineSource('koleda', setup)
  const refinement = setup.refinement
  const core = STATIC_SOURCES.koleda.core
  const additional = STATIC_SOURCES.koleda.additional
  const kingCritDmg = setup.fourPieceId === 'king'
    ? localKingCritRate(setup) >= values.kingCritThreshold
      ? equipmentEffectMaximumValue(DRIVE_DISC_FACTS.king.fourPiece.critDamage)
      : equipmentEffectBaseValue(DRIVE_DISC_FACTS.king.fourPiece.critDamage)
    : 0

  return active([
    additive('dazeBonus', 'fully', core, values.coreDaze, 'self', ENHANCED_BASIC),
    additive('dazeBonus', 'fully', core, values.coreDaze, 'self', EX_SPECIAL),
    withApplicability(
      additive(
        'dmgBonus', 'fully', additional,
        additionalActive ? values.additionalChainDmg : 0,
        'all-party', CHAIN,
      ),
      { formulas: ['general_damage', 'sheer_damage'] },
    ),
    additive(
      'dazeBonus', 'fully', mindscapeSource('koleda', 1, 'After Basic hit 2 or 4'),
      setup.mindscape >= 1 ? values.mindscapeDaze : 0,
      'self', SPECIAL,
    ),
    percentage('impact', 'fully', engine, engineImpact(setup), 'self'),
    ...(setup.engineId === 'hellfireGears'
      ? [perSecond(
        engine,
        equipmentEffectBaseValue(W_ENGINE_FACTS.hellfireGears.effects.energy, refinement),
        'self',
      )]
      : []),
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
      'dazeBonus', 'fully', engine,
      setup.engineId === 'restrained'
        ? equipmentEffectMaximumValue(W_ENGINE_FACTS.restrained.effects.daze, refinement)
        : 0,
      'self', BASIC,
    ),
    additive(
      'dazeBonus', 'fully', engine,
      setup.engineId === 'preciousFossilizedCore'
        ? equipmentEffectMaximumValue(W_ENGINE_FACTS.preciousFossilizedCore.effects.daze, refinement)
        : 0,
      'self',
    ),

    withApplicability(
      additive(
        'critDmg', 'fully', discSource('koleda', 'king', '4-piece'),
        kingCritDmg, 'all-party', undefined, undefined, undefined, 'kingOfTheSummit',
      ),
      { formulas: ['general_damage', 'sheer_damage'] },
    ),
    additive(
      'dazeBonus', 'fully', discSource('koleda', 'shockstar', '4-piece'),
      setup.fourPieceId === 'shockstar'
        ? equipmentEffectBaseValue(DRIVE_DISC_FACTS.shockstar.fourPiece.daze)
        : 0,
      'self', BASIC_DASH_DODGE,
    ),
    withApplicability(
      additive(
        'dmgBonus', 'fully', discSource('koleda', 'swingJazz', '4-piece'),
        setup.fourPieceId === 'swingJazz'
          ? equipmentEffectBaseValue(DRIVE_DISC_FACTS.swingJazz.fourPiece.damage)
          : 0,
        'all-party', undefined, undefined, undefined, 'swingJazz',
      ),
      { formulas: ['general_damage', 'sheer_damage'] },
    ),
  ])
}

export function calculateKoleda(
  context: KoledaCalculationContext,
  inbox: SourceBoundCurrentClause[],
  enemy: SourceBoundCurrentClause[],
): AgentResult {
  const { setup } = context
  const values = VERTICAL_VALUES.koleda
  const effects = resolveDeliveredClauses([...inbox, ...enemy], {
    impact: values.impact,
  })

  const impactInputs = presentSetupInputs([
    engineAdvancedInput(setup, 'koleda', 'impactPct'),
    mainStatInput(setup, 'koleda', 'slot6', 'impact'),
    ...selectedDiscTwoPieceInputs(setup, 'koleda', { modifier: 'impact' }),
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
    mainStatInput(setup, 'koleda', 'slot4', 'critRate'),
    effectiveSubstatInput(setup, 'koleda', 'critRate'),
  ])
  const initialCrit = values.critRate + critInputs.reduce((sum, input) => sum + input.rawValue, 0)
  const critRate = composeMetricEffects(
    surfaces(initialCrit, initialCrit, initialCrit),
    surfaces(critInputs.map((input) => contribution(input.source, input.rawValue)), [], []),
    effects,
    'critRate',
    { value: 100, source: STATIC_SOURCES.koleda.critCap },
  )

  const energyInputs = presentSetupInputs([
    engineAdvancedInput(setup, 'koleda', 'energyRegenPct'),
    ...selectedDiscTwoPieceInputs(setup, 'koleda', { modifier: 'energyRegen' }),
  ])
  const energy = energyRegenProjection(values.baseEnergyRegen, energyInputs, effects)
  const dazeInputs = selectedDiscTwoPieceInputs(setup, 'koleda', { modifier: 'dazeBonus' })
  const initialDaze = dazeInputs.reduce((total, input) => total + input.rawValue, 0)
  const daze = composeMetricEffects(
    surfaces(initialDaze, initialDaze, initialDaze),
    surfaces(dazeInputs.map((input) => contribution(input.source, input.rawValue)), [], []),
    effects,
    'dazeBonus',
  )
  const actionModifiers = composeActionHierarchy(
    daze.values, effects, 'dazeBonus', DAZE_SCOPES,
  )
  const kingSelected = setup.fourPieceId === 'king'

  return {
    agentId: 'koleda',
    metrics: [
      ...(kingSelected || critInputs.length || critRate.values.fully !== values.critRate
        ? [{
          id: 'critRate' as const, label: 'CRIT Rate', unit: '%', decimals: 1, ...critRate,
          ...(kingSelected
            ? {
              gauge: {
                source: discSource('koleda', 'king', '4-piece'),
                basisLabel: 'Initial CRIT Rate', current: localKingCritRate(setup),
                threshold: values.kingCritThreshold, cap: values.kingCritThreshold,
                outputLabel: 'Squad CRIT DMG',
                outputValue: localKingCritRate(setup) >= values.kingCritThreshold
                  ? equipmentEffectMaximumValue(DRIVE_DISC_FACTS.king.fourPiece.critDamage)
                  : equipmentEffectBaseValue(DRIVE_DISC_FACTS.king.fourPiece.critDamage),
                outputUnit: '%',
              },
            }
            : {}),
        }]
        : []),
      { id: 'impact', label: 'Impact', unit: '', decimals: 2, ...impact },
      ...(energyInputs.length || setup.engineId === 'hellfireGears'
        ? [{ id: 'energyRegen' as const, label: 'Energy Regen', unit: '/s', decimals: 2, ...energy }]
        : []),
      { id: 'dazeBonus', label: 'Daze Bonus', unit: '%', decimals: 1, ...daze },
    ],
    actionModifiers,
    operations: [],
  }
}
