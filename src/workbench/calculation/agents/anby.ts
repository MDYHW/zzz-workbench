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
  perSecond,
  percentage,
  presentSetupInputs,
  resolveDeliveredClauses,
  STATIC_SOURCES,
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
import { TRIGGER_QUICK_ASSIST_TARGET } from './trigger'

export interface AnbyDemaraCalculationContext {
  agentId: 'anby'
  setup: CompleteSetup
  initialAtk: number
}

const BASIC = actionTarget([canonicalAction('Basic Attack')])
const THUNDERBOLT = actionTarget([actionForm('Basic Attack', 'Thunderbolt')])
const DASH = actionTarget([canonicalAction('Dash Attack')])
const SPECIAL = actionTarget([canonicalAction('Special Attack')])
const EX_SPECIAL = actionTarget([canonicalAction('EX Special Attack')])
const DASH_DODGE = actionTarget([
  canonicalAction('Dash Attack'), canonicalAction('Dodge Counter'),
])

const DAMAGE_SCOPES = [
  {
    id: 'anbyBasicDmg', target: BASIC,
    children: [{ id: 'anbyThunderboltDmg', target: THUNDERBOLT }],
  },
  { id: 'anbyDashDmg', target: DASH },
] satisfies readonly ActionScopeNode[]

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
  const initialAtk = initialAtkFor('anby', setup)
  if (initialAtk === null) throw new Error('Complete Anby setup requires a W-Engine')
  return { agentId: 'anby', setup, initialAtk }
}

function localKingCritRate(setup: CompleteSetup): number {
  return VERTICAL_VALUES.anby.critRate
    + (mainStatInput(setup, 'anby', 'slot4', 'critRate')?.rawValue ?? 0)
    + (effectiveSubstatInput(setup, 'anby', 'critRate')?.rawValue ?? 0)
}

function engineImpact(setup: CompleteSetup): number {
  const refinement = setup.refinement
  switch (setup.engineId) {
    case 'iceJadeTeapot':
      return equipmentEffectMaximumValue(
        W_ENGINE_FACTS.iceJadeTeapot.effects.impact,
        refinement,
      )
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
      'dmgBonus', 'fully', mindscapeSource('anby', 2, 'Against Stunned target'),
      setup.mindscape >= 2 ? values.mindscapeThunderboltStunnedDmg : 0,
      'self', THUNDERBOLT,
    ),
    additive(
      'dazeBonus', 'fully', mindscapeSource('anby', 2, 'Against non-Stunned target'),
      setup.mindscape >= 2 ? values.mindscapeExNonStunnedDaze : 0,
      'self', EX_SPECIAL,
    ),
    additive('dmgBonus', 'fully', mindscapeSource('anby', 6, 'After EX Special Attack'),
      setup.mindscape >= 6 ? values.mindscapeBasicDashDmg : 0, 'self', BASIC),
    additive('dmgBonus', 'fully', mindscapeSource('anby', 6, 'After EX Special Attack'),
      setup.mindscape >= 6 ? values.mindscapeBasicDashDmg : 0, 'self', DASH),

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
      'self', BASIC,
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
        'dmgBonus', 'combat', engine,
        setup.engineId === 'demaraBatteryMarkII'
          ? equipmentEffectBaseValue(
            W_ENGINE_FACTS.demaraBatteryMarkII.effects.electricDamage,
            refinement,
          )
          : 0,
        'self',
      ),
      { attributes: ['Electric'] },
    ),

    additive(
      'dazeBonus', 'initial',
      discSource('anby', 'king', '2-piece', setup.fourPieceId === 'king' ? '4-piece' : '2-piece'),
      setup.fourPieceId === 'king' || setup.twoPieceId === 'king'
        ? equipmentEffectBaseValue(DRIVE_DISC_FACTS.king.twoPiece.daze)
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
    withApplicability(
      additive(
        'dmgBonus', 'fully', discSource('anby', 'protoPunk', '4-piece'),
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
  const data = composeMetricEffects(
    surfaces(0, 0, 0), surfaces([], [], []), effects, metricId,
  )
  return data.values.fully
    ? [{ id: metricId, label, unit: '%', decimals: 1, ...data }]
    : []
}

export function calculateAnbyDemara(
  context: AnbyDemaraCalculationContext,
  inbox: SourceBoundCurrentClause[],
  enemy: SourceBoundCurrentClause[],
): AgentResult {
  const { setup, initialAtk } = context
  const values = VERTICAL_VALUES.anby
  const effects = resolveDeliveredClauses([...inbox, ...enemy], {
    atk: initialAtk, impact: values.impact,
  })

  const atkInputs = presentSetupInputs([
    engineAdvancedInput(setup, 'anby', 'atkPct'),
    mainStatInput(setup, 'anby', 'slot4', 'atkPct'),
    mainStatInput(setup, 'anby', 'slot5', 'atkPct'),
    discStatInput(
      setup, 'anby', 'fourPiece', 'astralVoice',
      equipmentEffectBaseValue(DRIVE_DISC_FACTS.astralVoice.twoPiece.atk),
      'twoPiece',
    ),
  ])
  const baseAtk = values.atk + W_ENGINES[setup.engineId].baseAtk
  const atk = composeMetricEffects(
    surfaces(initialAtk, initialAtk, initialAtk),
    surfaces(atkInputs.map((input) => percentageContribution(
      input.source, baseAtk * input.rawValue / 100, input.rawValue,
    )), [], []),
    effects,
    'atk',
  )

  const impactInputs = presentSetupInputs([
    engineAdvancedInput(setup, 'anby', 'impactPct'),
    mainStatInput(setup, 'anby', 'slot6', 'impact'),
    discStatInput(
      setup, 'anby', 'fourPiece', 'shockstar',
      equipmentEffectBaseValue(DRIVE_DISC_FACTS.shockstar.twoPiece.impact),
      'twoPiece',
    ),
    discStatInput(
      setup, 'anby', 'twoPiece', 'shockstar',
      equipmentEffectBaseValue(DRIVE_DISC_FACTS.shockstar.twoPiece.impact),
    ),
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

  const critDmg = composeMetricEffects(
    surfaces(values.critDmg, values.critDmg, values.critDmg),
    surfaces([], [], []),
    effects,
    'critDmg',
  )
  const dmgInputs = presentSetupInputs([
    mainStatInput(setup, 'anby', 'slot5', 'electricDmg'),
  ])
  const initialDmg = dmgInputs.reduce((sum, input) => sum + input.rawValue, 0)
  const dmg = composeMetricEffects(
    surfaces(initialDmg, initialDmg, initialDmg),
    surfaces(dmgInputs.map((input) => contribution(input.source, input.rawValue)), [], []),
    effects,
    'dmgBonus',
  )

  const energyInputs = presentSetupInputs([
    engineAdvancedInput(setup, 'anby', 'energyRegenPct'),
    mainStatInput(setup, 'anby', 'slot6', 'energyRegenPct'),
    discStatInput(
      setup, 'anby', 'fourPiece', 'swingJazz',
      equipmentEffectBaseValue(DRIVE_DISC_FACTS.swingJazz.twoPiece.energyRegen),
      'twoPiece',
    ),
    discStatInput(
      setup, 'anby', 'twoPiece', 'swingJazz',
      equipmentEffectBaseValue(DRIVE_DISC_FACTS.swingJazz.twoPiece.energyRegen),
    ),
  ])
  const energy = energyRegenProjection(values.baseEnergyRegen, energyInputs, effects)
  const daze = composeMetricEffects(
    surfaces(0, 0, 0), surfaces([], [], []), effects, 'dazeBonus',
  )
  const quickAssist = effects.find(
    (effect) => effect.action === TRIGGER_QUICK_ASSIST_TARGET
      && effect.metric === 'dazeBonus',
  )
  const kingSelected = setup.fourPieceId === 'king'

  return {
    agentId: 'anby',
    metrics: [
      { id: 'atk', label: 'ATK', unit: '', decimals: 0, ...atk },
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
      ...(critDmg.values.fully !== values.critDmg
        ? [{
          id: 'critDmg' as const, label: 'CRIT DMG', unit: '%' as const,
          decimals: 1, ...critDmg,
        }]
        : []),
      { id: 'impact', label: 'Impact', unit: '', decimals: 2, ...impact },
      ...(energyInputs.length || setup.engineId === 'hellfireGears'
        ? [{
          id: 'energyRegen' as const, label: 'Energy Regen', unit: '/s' as const,
          decimals: 2, ...energy,
        }]
        : []),
      { id: 'dmgBonus', label: 'DMG Bonus', unit: '%', decimals: 1, ...dmg },
      { id: 'dazeBonus', label: 'Daze Bonus', unit: '%', decimals: 1, ...daze },
      ...optionalMetric('defIgnore', 'DEF Ignore', effects),
      ...optionalMetric('defReduction', 'DEF Reduction', effects),
      ...optionalMetric('resIgnore', 'RES Ignore', effects),
      ...optionalMetric('resReduction', 'RES Reduction', effects),
      ...optionalMetric('stunDmgMultiplier', 'Stun DMG Multiplier', effects),
    ],
    actionModifiers: [
      ...composeActionHierarchy(dmg.values, effects, 'dmgBonus', DAMAGE_SCOPES),
      ...composeActionHierarchy(daze.values, effects, 'dazeBonus', DAZE_SCOPES),
    ],
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
