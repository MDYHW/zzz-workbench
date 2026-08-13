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
  discStatInput,
  effectiveSubstatInput,
  engineAdvancedInput,
  engineSource,
  mainStatInput,
  mindscapeSource,
  percentage,
  perSecond,
  presentSetupInputs,
  resolveDeliveredClauses,
  withApplicability,
  type CompleteSetup,
  type ResolvedSetupInput,
  type SourceBoundCurrentClause,
} from '../../effects'
import { actionTarget, canonicalAction } from '../../actions'
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
import type { AgentResult, ResultMetric } from '../result'

export interface JuFufuCalculationContext {
  agentId: 'juFufu'
  setup: CompleteSetup
  initialAtk: number
}

const JU_FUFU_BASIC_DASH_DODGE = actionTarget([
  canonicalAction('Basic Attack'),
  canonicalAction('Dash Attack'),
  canonicalAction('Dodge Counter'),
])
const JU_FUFU_CHAIN = actionTarget([canonicalAction('Chain Attack')])
const JU_FUFU_ULTIMATE = actionTarget([canonicalAction('Ultimate')])
const JU_FUFU_EX_CHAIN_ULTIMATE = actionTarget([
  canonicalAction('EX Special Attack'),
  canonicalAction('Chain Attack'),
  canonicalAction('Ultimate'),
])
const JU_FUFU_DAZE_SCOPES = [
  { id: 'juFufuBasicDashDodge', target: JU_FUFU_BASIC_DASH_DODGE },
  { id: 'juFufuExChainUltimateDaze', target: JU_FUFU_EX_CHAIN_ULTIMATE },
] satisfies readonly ActionScopeNode[]
const JU_FUFU_DAMAGE_SCOPES = [
  { id: 'juFufuChain', target: JU_FUFU_CHAIN },
  { id: 'juFufuUltimate', target: JU_FUFU_ULTIMATE },
] satisfies readonly ActionScopeNode[]

export function observeJuFufu(setup: CompleteSetup): JuFufuCalculationContext {
  const initialAtk = initialAtkFor('juFufu', setup)
  if (initialAtk === null) throw new Error('Complete Ju Fufu setup requires a W-Engine')
  return { agentId: 'juFufu', setup, initialAtk }
}

function coreCritDmgBonus(initialAtk: number): number {
  const values = VERTICAL_VALUES.juFufu
  const increments = initialAtk < values.coreCritDmgThreshold
    ? 0
    : Math.floor((initialAtk - values.coreCritDmgThreshold) / 100)
      * values.coreCritDmgPer100Atk
  return values.coreCritDmg + Math.min(increments, values.coreCritDmgBonusCap)
}

function localKingCritRate(setup: CompleteSetup): number {
  return VERTICAL_VALUES.juFufu.critRate
    + (mainStatInput(setup, 'juFufu', 'slot4', 'critRate')?.rawValue ?? 0)
    + (discStatInput(
      setup,
      'juFufu',
      'twoPiece',
      'woodpecker',
      equipmentEffectBaseValue(DRIVE_DISC_FACTS.woodpecker.twoPiece.critRate),
    )?.rawValue ?? 0)
    + (effectiveSubstatInput(setup, 'juFufu', 'critRate')?.rawValue ?? 0)
    + (setup.mindscape >= 1 ? VERTICAL_VALUES.juFufu.mindscapeCritRate : 0)
}

export function resolveJuFufuProviderClauses(
  context: JuFufuCalculationContext,
): SourceBoundCurrentClause[] {
  const { setup, initialAtk } = context
  const values = VERTICAL_VALUES.juFufu
  const engine = engineSource('juFufu', setup)
  const refinement = setup.refinement
  const kingCritDmg = setup.fourPieceId === 'king'
    ? localKingCritRate(setup) >= values.kingCritThreshold
      ? equipmentEffectMaximumValue(DRIVE_DISC_FACTS.king.fourPiece.critDamage)
      : equipmentEffectBaseValue(DRIVE_DISC_FACTS.king.fourPiece.critDamage)
    : 0

  return active([
    additive('critDmg', 'fully', STATIC_SOURCES.juFufu.core,
      coreCritDmgBonus(initialAtk), 'all-party'),
    additive('dmgBonus', 'fully', STATIC_SOURCES.juFufu.core,
      values.coreChainDmg, 'all-party', JU_FUFU_CHAIN),
    additive('dmgBonus', 'fully', STATIC_SOURCES.juFufu.core,
      values.coreUltimateDmg, 'all-party', JU_FUFU_ULTIMATE),
    additive('impact', 'combat', STATIC_SOURCES.juFufu.core,
      values.coreImpact, 'self'),
    additive('critRate', 'combat', mindscapeSource('juFufu', 1),
      setup.mindscape >= 1 ? values.mindscapeCritRate : 0, 'self'),
    additive('stunDmgMultiplier', 'fully', mindscapeSource('juFufu', 1, 'After Chain Attack hits'),
      setup.mindscape >= 1 ? values.mindscapeStunMultiplier : 0, 'enemy-context'),
    additive('critDmg', 'fully', mindscapeSource('juFufu', 2, "Tiger's Roar"),
      setup.mindscape >= 2 ? values.mindscapeSquadCritDmg : 0, 'all-party'),
    additive('critDmg', 'fully', mindscapeSource('juFufu', 4, "Tiger's Roar"),
      setup.mindscape >= 4 ? values.mindscapeSelfCritDmg : 0, 'self'),
    additive('dmgBonus', 'fully', mindscapeSource('juFufu', 6),
      setup.mindscape >= 6 ? values.mindscapeChainDmg : 0, 'self', JU_FUFU_CHAIN),
    additive('dazeBonus', 'fully', engine,
      setup.engineId === 'roaringFurnace'
        ? equipmentEffectBaseValue(W_ENGINE_FACTS.roaringFurnace.effects.daze, refinement)
        : setup.engineId === 'preciousFossilizedCore'
          ? equipmentEffectMaximumValue(W_ENGINE_FACTS.preciousFossilizedCore.effects.daze, refinement)
          : 0,
      'self', setup.engineId === 'roaringFurnace' ? JU_FUFU_EX_CHAIN_ULTIMATE : undefined),
    additive('dmgBonus', 'fully', engine,
      setup.engineId === 'roaringFurnace'
        ? equipmentEffectMaximumValue(W_ENGINE_FACTS.roaringFurnace.effects.damage, refinement)
        : 0,
      'all-party'),
    percentage('impact', 'fully', engine,
      setup.engineId === 'blazingLaurel'
        ? equipmentEffectBaseValue(W_ENGINE_FACTS.blazingLaurel.effects.impact, refinement)
        : setup.engineId === 'hellfireGears'
          ? equipmentEffectBaseValue(W_ENGINE_FACTS.hellfireGears.effects.impact, refinement)
          : setup.engineId === 'steamOven'
            ? equipmentEffectBaseValue(W_ENGINE_FACTS.steamOven.effects.impact, refinement)
            : 0,
      'self'),
    perSecond(engine,
      setup.engineId === 'hellfireGears'
        ? equipmentEffectBaseValue(W_ENGINE_FACTS.hellfireGears.effects.energy, refinement)
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
    additive('dazeBonus', 'initial',
      discSource('juFufu', 'king', '2-piece', setup.fourPieceId === 'king' ? '4-piece' : '2-piece'),
      setup.fourPieceId === 'king' || setup.twoPieceId === 'king'
        ? equipmentEffectBaseValue(DRIVE_DISC_FACTS.king.twoPiece.daze)
        : 0,
      'self'),
    withApplicability(
      additive('critDmg', 'fully', discSource('juFufu', 'king', '4-piece'),
        kingCritDmg, 'all-party', undefined, undefined, undefined, 'kingOfTheSummit'),
      { formulas: ['general_damage', 'sheer_damage'] },
    ),
    withApplicability(
      additive('dmgBonus', 'fully', discSource('juFufu', 'swingJazz', '4-piece'),
        setup.fourPieceId === 'swingJazz'
          ? equipmentEffectBaseValue(DRIVE_DISC_FACTS.swingJazz.fourPiece.damage)
          : 0,
        'all-party', undefined, undefined, undefined, 'swingJazz'),
      { formulas: ['general_damage', 'sheer_damage'] },
    ),
    additive('dazeBonus', 'fully', discSource('juFufu', 'shockstar', '4-piece'),
      setup.fourPieceId === 'shockstar'
        ? equipmentEffectBaseValue(DRIVE_DISC_FACTS.shockstar.fourPiece.daze)
        : 0,
      'self', JU_FUFU_BASIC_DASH_DODGE),
  ])
}

function atkInputs(setup: CompleteSetup): {
  percentage: ResolvedSetupInput[]
  flat?: ResolvedSetupInput
} {
  return {
    percentage: presentSetupInputs([
    engineAdvancedInput(setup, 'juFufu', 'atkPct'),
    mainStatInput(setup, 'juFufu', 'slot4', 'atkPct'),
    mainStatInput(setup, 'juFufu', 'slot5', 'atkPct'),
    mainStatInput(setup, 'juFufu', 'slot6', 'atkPct'),
    discStatInput(setup, 'juFufu', 'fourPiece', 'hormonePunk',
      equipmentEffectBaseValue(DRIVE_DISC_FACTS.hormonePunk.twoPiece.atk), 'twoPiece'),
    discStatInput(setup, 'juFufu', 'twoPiece', 'hormonePunk',
      equipmentEffectBaseValue(DRIVE_DISC_FACTS.hormonePunk.twoPiece.atk)),
    discStatInput(setup, 'juFufu', 'twoPiece', 'astralVoice',
      equipmentEffectBaseValue(DRIVE_DISC_FACTS.astralVoice.twoPiece.atk)),
    effectiveSubstatInput(setup, 'juFufu', 'atkPct'),
    ]),
    flat: effectiveSubstatInput(setup, 'juFufu', 'atkFlat'),
  }
}

export function calculateJuFufu(
  context: JuFufuCalculationContext,
  inbox: SourceBoundCurrentClause[],
  enemy: SourceBoundCurrentClause[],
): AgentResult {
  const { setup, initialAtk } = context
  const values = VERTICAL_VALUES.juFufu
  const effects = resolveDeliveredClauses([...inbox, ...enemy], { atk: initialAtk, impact: values.impact })
  const baseAtk = values.atk + W_ENGINES[setup.engineId].baseAtk
  const atkInputValues = atkInputs(setup)
  const atk = composeMetricEffects(
    surfaces(initialAtk, initialAtk, initialAtk),
    surfaces([
      ...atkInputValues.percentage.map((input) => percentageContribution(
        input.source, baseAtk * input.rawValue / 100, input.rawValue,
      )),
      ...(atkInputValues.flat
        ? [contribution(atkInputValues.flat.source, atkInputValues.flat.rawValue)]
        : []),
    ], [], []),
    effects,
    'atk',
  )

  const critInputs = presentSetupInputs([
    mainStatInput(setup, 'juFufu', 'slot4', 'critRate'),
    discStatInput(setup, 'juFufu', 'twoPiece', 'woodpecker',
      equipmentEffectBaseValue(DRIVE_DISC_FACTS.woodpecker.twoPiece.critRate)),
    effectiveSubstatInput(setup, 'juFufu', 'critRate'),
  ])
  const initialCrit = values.critRate + critInputs.reduce((sum, input) => sum + input.rawValue, 0)
  const critRate = composeMetricEffects(
    surfaces(initialCrit, initialCrit, initialCrit),
    surfaces(critInputs.map((input) => contribution(input.source, input.rawValue)), [], []),
    effects,
    'critRate',
    { value: 100, source: STATIC_SOURCES.juFufu.critCap },
  )
  const critDmg = composeMetricEffects(
    surfaces(values.critDmg, values.critDmg, values.critDmg),
    surfaces([], [], []),
    effects,
    'critDmg',
  )

  const impactInputs = presentSetupInputs([
    engineAdvancedInput(setup, 'juFufu', 'impactPct'),
    mainStatInput(setup, 'juFufu', 'slot6', 'impact'),
    discStatInput(setup, 'juFufu', 'fourPiece', 'shockstar',
      equipmentEffectBaseValue(DRIVE_DISC_FACTS.shockstar.twoPiece.impact), 'twoPiece'),
    discStatInput(setup, 'juFufu', 'twoPiece', 'shockstar',
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

  const energyInputs = presentSetupInputs([
    engineAdvancedInput(setup, 'juFufu', 'energyRegenPct'),
    discStatInput(setup, 'juFufu', 'fourPiece', 'swingJazz',
      equipmentEffectBaseValue(DRIVE_DISC_FACTS.swingJazz.twoPiece.energyRegen), 'twoPiece'),
    discStatInput(setup, 'juFufu', 'twoPiece', 'swingJazz',
      equipmentEffectBaseValue(DRIVE_DISC_FACTS.swingJazz.twoPiece.energyRegen)),
    discStatInput(setup, 'juFufu', 'twoPiece', 'moonlight',
      equipmentEffectBaseValue(DRIVE_DISC_FACTS.moonlight.twoPiece.energyRegen)),
  ])
  const energy = energyRegenProjection(values.baseEnergyRegen, energyInputs, effects)
  const daze = composeMetricEffects(surfaces(0, 0, 0), surfaces([], [], []), effects, 'dazeBonus')
  const dmg = composeMetricEffects(surfaces(0, 0, 0), surfaces([], [], []), effects, 'dmgBonus')
  const stun = composeMetricEffects(
    surfaces(0, 0, 0), surfaces([], [], []), effects, 'stunDmgMultiplier',
  )
  const actionModifiers = [
    ...composeActionHierarchy(dmg.values, effects, 'dmgBonus', JU_FUFU_DAMAGE_SCOPES),
    ...composeActionHierarchy(daze.values, effects, 'dazeBonus', JU_FUFU_DAZE_SCOPES),
  ]

  const critMetric: ResultMetric = {
    id: 'critRate',
    label: 'CRIT Rate',
    unit: '%',
    decimals: 1,
    ...critRate,
  }
  if (setup.fourPieceId === 'king') {
    critMetric.gauge = {
      source: discSource('juFufu', 'king', '4-piece'),
      basisLabel: 'Combat CRIT Rate',
      current: critRate.values.combat,
      threshold: values.kingCritThreshold,
      cap: values.kingCritThreshold,
      outputLabel: 'Squad CRIT DMG',
      outputValue: localKingCritRate(setup) >= values.kingCritThreshold
        ? equipmentEffectMaximumValue(DRIVE_DISC_FACTS.king.fourPiece.critDamage)
        : equipmentEffectBaseValue(DRIVE_DISC_FACTS.king.fourPiece.critDamage),
      outputUnit: '%',
    }
  }

  return {
    agentId: 'juFufu',
    metrics: [
      {
        id: 'atk', label: 'ATK', unit: '', decimals: 0, ...atk,
        gauge: {
          source: STATIC_SOURCES.juFufu.core,
          basisLabel: 'Initial ATK',
          current: initialAtk,
          threshold: values.coreCritDmgThreshold,
          cap: values.coreCritDmgCapAtk,
          outputLabel: 'Squad CRIT DMG',
          outputValue: coreCritDmgBonus(initialAtk),
          outputCap: values.coreCritDmg + values.coreCritDmgBonusCap,
          outputUnit: '%',
        },
      },
      critMetric,
      { id: 'critDmg', label: 'CRIT DMG', unit: '%', decimals: 1, ...critDmg },
      { id: 'impact', label: 'Impact', unit: '', decimals: 1, ...impact },
      ...(energyInputs.length || setup.engineId === 'hellfireGears'
        ? [{ id: 'energyRegen' as const, label: 'Energy Regen', unit: '', decimals: 2,
          values: energy.values, breakdown: energy.breakdown }]
        : []),
      { id: 'dazeBonus', label: 'Daze Bonus', unit: '%', decimals: 1, ...daze },
      ...(dmg.values.fully
        ? [{ id: 'dmgBonus' as const, label: 'DMG Bonus', unit: '%', decimals: 1, ...dmg }]
        : []),
      ...(stun.values.fully
        ? [{ id: 'stunDmgMultiplier' as const, label: 'Stun DMG Multiplier', unit: '%', decimals: 1, ...stun }]
        : []),
    ],
    actionModifiers,
    operations: setup.mindscape >= 6
      ? [{
        id: 'juFufuPopcornMultiplier',
        label: 'Chain Attack popcorn added DMG Multiplier',
        source: mindscapeSource('juFufu', 6),
        surface: 'fully',
        value: values.mindscapePopcornMultiplier,
        unit: '%',
      }]
      : [],
  }
}
