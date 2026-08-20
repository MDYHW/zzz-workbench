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
import { TRIGGER_QUICK_ASSIST_TARGET } from './trigger'

export interface AnbyDemaraCalculationContext {
  agentId: 'anby'
  setup: CompleteSetup
}

const BASIC = actionTarget([canonicalAction('Basic Attack')])
const THUNDERBOLT = actionTarget([actionForm('Basic Attack', 'Thunderbolt')])
const SPECIAL = actionTarget([canonicalAction('Special Attack')])
const EX_SPECIAL = actionTarget([canonicalAction('EX Special Attack')])
const DASH_DODGE = actionTarget([
  canonicalAction('Dash Attack'), canonicalAction('Dodge Counter'),
])

const DAZE_SCOPES = [
  {
    id: 'anbyBasicDaze', target: BASIC,
    children: [{ id: 'anbyThunderboltDaze', target: THUNDERBOLT }],
  },
  { id: 'anbySpecialDaze', target: SPECIAL },
  { id: 'anbyExSpecialDaze', target: EX_SPECIAL },
  { id: 'anbyDashDodgeDaze', target: DASH_DODGE },
] satisfies readonly ActionScopeNode[]

export function observeAnbyDemara(
  setup: CompleteSetup,
): AnbyDemaraCalculationContext {
  return { agentId: 'anby', setup }
}

function localKingCritRate(setup: CompleteSetup): number {
  return VERTICAL_VALUES.anby.critRate
    + (mainStatInput(setup, 'anby', 'slot4', 'critRate')?.rawValue ?? 0)
    + (effectiveSubstatInput(setup, 'anby', 'critRate')?.rawValue ?? 0)
}

function engineImpact(setup: CompleteSetup): number {
  const refinement = setup.refinement
  switch (setup.engineId) {
    case 'blazingLaurel':
      return equipmentEffectBaseValue(
        W_ENGINE_FACTS.blazingLaurel.effects.impact,
        refinement,
      )
    case 'hellfireGears':
      return equipmentEffectMaximumValue(
        W_ENGINE_FACTS.hellfireGears.effects.impact,
        refinement,
      )
    case 'steamOven':
      return equipmentEffectMaximumValue(
        W_ENGINE_FACTS.steamOven.effects.impact,
        refinement,
      )
    default:
      return 0
  }
}

export function resolveAnbyDemaraProviderClauses(
  context: AnbyDemaraCalculationContext,
): SourceBoundCurrentClause[] {
  const { setup } = context
  const values = VERTICAL_VALUES.anby
  const engine = engineSource('anby', setup)
  const refinement = setup.refinement
  const kingCritDmg = setup.fourPieceId === 'king'
    ? localKingCritRate(setup) >= values.kingCritThreshold
      ? equipmentEffectMaximumValue(DRIVE_DISC_FACTS.king.fourPiece.critDamage)
      : equipmentEffectBaseValue(DRIVE_DISC_FACTS.king.fourPiece.critDamage)
    : 0

  return active([
    additive('dazeBonus', 'fully', STATIC_SOURCES.anby.core,
      values.coreActionDaze, 'self', THUNDERBOLT),
    additive('dazeBonus', 'fully', STATIC_SOURCES.anby.core,
      values.coreActionDaze, 'self', SPECIAL),
    additive('dazeBonus', 'fully', STATIC_SOURCES.anby.core,
      values.coreActionDaze, 'self', EX_SPECIAL),
    additive(
      'dazeBonus', 'fully', mindscapeSource('anby', 2, 'Against non-Stunned target'),
      setup.mindscape >= 2 ? values.mindscapeExNonStunnedDaze : 0,
      'self', EX_SPECIAL,
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
        ? equipmentEffectMaximumValue(
          W_ENGINE_FACTS.preciousFossilizedCore.effects.daze,
          refinement,
        )
        : 0,
      'self',
    ),
    withApplicability(
      additive(
        'critDmg', 'fully', discSource('anby', 'king', '4-piece'),
        kingCritDmg, 'all-party', undefined, undefined, undefined,
        'kingOfTheSummit',
      ),
      { formulas: ['general_damage', 'sheer_damage'] },
    ),
    additive(
      'dazeBonus', 'fully', discSource('anby', 'shockstar', '4-piece'),
      setup.fourPieceId === 'shockstar'
        ? equipmentEffectBaseValue(DRIVE_DISC_FACTS.shockstar.fourPiece.daze)
        : 0,
      'self', BASIC,
    ),
    additive(
      'dazeBonus', 'fully', discSource('anby', 'shockstar', '4-piece'),
      setup.fourPieceId === 'shockstar'
        ? equipmentEffectBaseValue(DRIVE_DISC_FACTS.shockstar.fourPiece.daze)
        : 0,
      'self', DASH_DODGE,
    ),
    withApplicability(
      additive(
        'dmgBonus', 'fully', discSource('anby', 'swingJazz', '4-piece'),
        setup.fourPieceId === 'swingJazz'
          ? equipmentEffectBaseValue(DRIVE_DISC_FACTS.swingJazz.fourPiece.damage)
          : 0,
        'all-party', undefined, undefined, undefined, 'swingJazz',
      ),
      { formulas: ['general_damage', 'sheer_damage'] },
    ),
  ])
}

export function calculateAnbyDemara(
  context: AnbyDemaraCalculationContext,
  inbox: SourceBoundCurrentClause[],
  enemy: SourceBoundCurrentClause[],
): AgentResult {
  const { setup } = context
  const values = VERTICAL_VALUES.anby
  const effects = resolveDeliveredClauses([...inbox, ...enemy], {
    impact: values.impact,
  })

  const impactInputs = presentSetupInputs([
    engineAdvancedInput(setup, 'anby', 'impactPct'),
    mainStatInput(setup, 'anby', 'slot6', 'impact'),
    ...selectedDiscTwoPieceInputs(setup, 'anby', { modifier: 'impact' }),
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
    mainStatInput(setup, 'anby', 'slot4', 'critRate'),
    effectiveSubstatInput(setup, 'anby', 'critRate'),
  ])
  const initialCrit = values.critRate
    + critInputs.reduce((sum, input) => sum + input.rawValue, 0)
  const critRate = composeMetricEffects(
    surfaces(initialCrit, initialCrit, initialCrit),
    surfaces(critInputs.map((input) => contribution(input.source, input.rawValue)), [], []),
    effects,
    'critRate',
    { value: 100, source: STATIC_SOURCES.anby.critCap },
  )

  const energyInputs = presentSetupInputs([
    engineAdvancedInput(setup, 'anby', 'energyRegenPct'),
    mainStatInput(setup, 'anby', 'slot6', 'energyRegenPct'),
    ...selectedDiscTwoPieceInputs(setup, 'anby', { modifier: 'energyRegen' }),
  ])
  const energy = energyRegenProjection(values.baseEnergyRegen, energyInputs, effects)
  const dazeInputs = selectedDiscTwoPieceInputs(setup, 'anby', { modifier: 'dazeBonus' })
  const initialDaze = dazeInputs.reduce((total, input) => total + input.rawValue, 0)
  const daze = composeMetricEffects(
    surfaces(initialDaze, initialDaze, initialDaze),
    surfaces(dazeInputs.map((input) => contribution(input.source, input.rawValue)), [], []),
    effects,
    'dazeBonus',
  )
  const quickAssist = effects.find(
    (effect) => effect.action === TRIGGER_QUICK_ASSIST_TARGET
      && effect.metric === 'dazeBonus',
  )
  const kingSelected = setup.fourPieceId === 'king'

  return {
    agentId: 'anby',
    metrics: [
      ...(kingSelected || critInputs.length || critRate.values.fully !== values.critRate
        ? [{
          id: 'critRate' as const, label: 'CRIT Rate', unit: '%' as const,
          decimals: 1, ...critRate,
          ...(kingSelected
            ? {
              gauge: {
                source: discSource('anby', 'king', '4-piece'),
                basisLabel: 'Initial CRIT Rate', current: localKingCritRate(setup),
                threshold: values.kingCritThreshold, cap: values.kingCritThreshold,
                outputLabel: 'Squad CRIT DMG',
                outputValue: localKingCritRate(setup) >= values.kingCritThreshold
                  ? equipmentEffectMaximumValue(DRIVE_DISC_FACTS.king.fourPiece.critDamage)
                  : equipmentEffectBaseValue(DRIVE_DISC_FACTS.king.fourPiece.critDamage),
                outputUnit: '%' as const,
              },
            }
            : {}),
        }]
        : []),
      { id: 'impact', label: 'Impact', unit: '', decimals: 2, ...impact },
      ...(energyInputs.length || setup.engineId === 'hellfireGears'
        ? [{
          id: 'energyRegen' as const, label: 'Energy Regen', unit: '/s' as const,
          decimals: 2, ...energy,
        }]
        : []),
      { id: 'dazeBonus', label: 'Daze Bonus', unit: '%', decimals: 1, ...daze },
    ],
    actionModifiers: composeActionHierarchy(daze.values, effects, 'dazeBonus', DAZE_SCOPES),
    operations: quickAssist
      ? [{
        id: 'nextQuickAssistDaze',
        label: 'Next Quick Assist Daze',
        source: quickAssist.source,
        surface: 'fully',
        value: quickAssist.amount,
        unit: '%',
      }]
      : [],
  }
}
