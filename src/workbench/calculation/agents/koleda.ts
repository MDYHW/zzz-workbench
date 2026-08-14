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

export interface KoledaCalculationContext {
  agentId: 'koleda'
  setup: CompleteSetup
  additionalActive: boolean
  initialAtk: number
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
const CHAIN_ULTIMATE = actionTarget([
  canonicalAction('Chain Attack'), canonicalAction('Ultimate'),
])
const CHAIN = actionTarget([canonicalAction('Chain Attack')])
const DAZE_SCOPES = [
  {
    id: 'koledaBasicDashDodge', target: BASIC_DASH_DODGE,
    children: [{ id: 'koledaEnhancedBasic', target: ENHANCED_BASIC }],
  },
  {
    id: 'koledaSpecial', target: SPECIAL,
    children: [{ id: 'koledaExSpecial', target: EX_SPECIAL }],
  },
] satisfies readonly ActionScopeNode[]
const DAMAGE_SCOPES = [
  { id: 'koledaBasic', target: BASIC },
  {
    id: 'koledaChainUltimate', target: CHAIN_ULTIMATE,
    children: [{ id: 'koledaChain', target: CHAIN }],
  },
] satisfies readonly ActionScopeNode[]

export function observeKoleda(
  setup: CompleteSetup,
  additionalActive: boolean,
): KoledaCalculationContext {
  const initialAtk = initialAtkFor('koleda', setup)
  if (initialAtk === null) throw new Error('Complete Koleda setup requires a W-Engine')
  return { agentId: 'koleda', setup, additionalActive, initialAtk }
}

function localKingCritRate(setup: CompleteSetup): number {
  return VERTICAL_VALUES.koleda.critRate
    + (mainStatInput(setup, 'koleda', 'slot4', 'critRate')?.rawValue ?? 0)
    + (effectiveSubstatInput(setup, 'koleda', 'critRate')?.rawValue ?? 0)
}

function engineImpact(setup: CompleteSetup): number {
  const refinement = setup.refinement
  switch (setup.engineId) {
    case 'iceJadeTeapot':
      return equipmentEffectMaximumValue(W_ENGINE_FACTS.iceJadeTeapot.effects.impact, refinement)
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
    additive(
      'dmgBonus', 'fully', mindscapeSource('koleda', 4, 'Two Charges consumed'),
      setup.mindscape >= 4 ? values.mindscapeDmgMax : 0,
      'self', CHAIN_ULTIMATE,
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
        ? equipmentEffectMaximumValue(W_ENGINE_FACTS.preciousFossilizedCore.effects.daze, refinement)
        : 0,
      'self',
    ),

    additive(
      'dazeBonus', 'initial',
      discSource('koleda', 'king', '2-piece', setup.fourPieceId === 'king' ? '4-piece' : '2-piece'),
      setup.fourPieceId === 'king' || setup.twoPieceId === 'king'
        ? equipmentEffectBaseValue(DRIVE_DISC_FACTS.king.twoPiece.daze)
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
    withApplicability(
      additive(
        'dmgBonus', 'fully', discSource('koleda', 'protoPunk', '4-piece'),
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
  const data = composeMetricEffects(surfaces(0, 0, 0), surfaces([], [], []), effects, metricId)
  return data.values.fully
    ? [{ id: metricId, label, unit: '%', decimals: 1, ...data }]
    : []
}

export function calculateKoleda(
  context: KoledaCalculationContext,
  inbox: SourceBoundCurrentClause[],
  enemy: SourceBoundCurrentClause[],
): AgentResult {
  const { setup, initialAtk } = context
  const values = VERTICAL_VALUES.koleda
  const effects = resolveDeliveredClauses([...inbox, ...enemy], {
    atk: initialAtk, impact: values.impact,
  })

  const atkInputs = presentSetupInputs([
    engineAdvancedInput(setup, 'koleda', 'atkPct'),
    mainStatInput(setup, 'koleda', 'slot4', 'atkPct'),
    mainStatInput(setup, 'koleda', 'slot5', 'atkPct'),
    discStatInput(setup, 'koleda', 'fourPiece', 'astralVoice',
      equipmentEffectBaseValue(DRIVE_DISC_FACTS.astralVoice.twoPiece.atk), 'twoPiece'),
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
    engineAdvancedInput(setup, 'koleda', 'impactPct'),
    mainStatInput(setup, 'koleda', 'slot6', 'impact'),
    discStatInput(setup, 'koleda', 'fourPiece', 'shockstar',
      equipmentEffectBaseValue(DRIVE_DISC_FACTS.shockstar.twoPiece.impact), 'twoPiece'),
    discStatInput(setup, 'koleda', 'twoPiece', 'shockstar',
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

  const critDmg = composeMetricEffects(
    surfaces(values.critDmg, values.critDmg, values.critDmg),
    surfaces([], [], []),
    effects,
    'critDmg',
  )
  const dmgInputs = presentSetupInputs([
    mainStatInput(setup, 'koleda', 'slot5', 'fireDmg'),
  ])
  const initialDmg = dmgInputs.reduce((sum, input) => sum + input.rawValue, 0)
  const dmg = composeMetricEffects(
    surfaces(initialDmg, initialDmg, initialDmg),
    surfaces(dmgInputs.map((input) => contribution(input.source, input.rawValue)), [], []),
    effects,
    'dmgBonus',
  )

  const energyInputs = presentSetupInputs([
    engineAdvancedInput(setup, 'koleda', 'energyRegenPct'),
    discStatInput(setup, 'koleda', 'fourPiece', 'swingJazz',
      equipmentEffectBaseValue(DRIVE_DISC_FACTS.swingJazz.twoPiece.energyRegen), 'twoPiece'),
    discStatInput(setup, 'koleda', 'twoPiece', 'swingJazz',
      equipmentEffectBaseValue(DRIVE_DISC_FACTS.swingJazz.twoPiece.energyRegen)),
  ])
  const energy = energyRegenProjection(values.baseEnergyRegen, energyInputs, effects)
  const daze = composeMetricEffects(surfaces(0, 0, 0), surfaces([], [], []), effects, 'dazeBonus')
  const actionModifiers = [
    ...composeActionHierarchy(dmg.values, effects, 'dmgBonus', DAMAGE_SCOPES),
    ...composeActionHierarchy(daze.values, effects, 'dazeBonus', DAZE_SCOPES),
  ]
  const kingSelected = setup.fourPieceId === 'king'

  return {
    agentId: 'koleda',
    metrics: [
      ...(setup.mindscape >= 6
        ? [{ id: 'atk' as const, label: 'ATK', unit: '', decimals: 0, ...atk }]
        : []),
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
      ...(critDmg.values.fully !== values.critDmg
        ? [{ id: 'critDmg' as const, label: 'CRIT DMG', unit: '%', decimals: 1, ...critDmg }]
        : []),
      { id: 'impact', label: 'Impact', unit: '', decimals: 2, ...impact },
      ...(energyInputs.length || setup.engineId === 'hellfireGears'
        ? [{ id: 'energyRegen' as const, label: 'Energy Regen', unit: '/s', decimals: 2, ...energy }]
        : []),
      { id: 'dmgBonus', label: 'DMG Bonus', unit: '%', decimals: 1, ...dmg },
      { id: 'dazeBonus', label: 'Daze Bonus', unit: '%', decimals: 1, ...daze },
      ...optionalMetric('defIgnore', 'DEF Ignore', effects),
      ...optionalMetric('defReduction', 'DEF Reduction', effects),
      ...optionalMetric('resIgnore', 'RES Ignore', effects),
      ...optionalMetric('resReduction', 'RES Reduction', effects),
      ...optionalMetric('stunDmgMultiplier', 'Stun DMG Multiplier', effects),
    ],
    actionModifiers,
    operations: setup.mindscape >= 6
      ? [{
        id: 'koledaExplosionAtkDamage',
        label: 'EX/Chain/Ultimate explosion added DMG Multiplier',
        source: mindscapeSource('koleda', 6),
        surface: 'fully',
        value: values.mindscapeExplosionAtk,
        unit: '% ATK',
      }]
      : [],
  }
}
