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
import { actionTarget, canonicalAction, sourceLocalAction } from '../../actions'
import {
  composeActionHierarchy,
  composeMetricEffects,
  energyRegenProjection,
  percentageContribution,
  surfaces,
  type ActionScopeNode,
} from '../composition'
import type { AgentResult, GaugeResult } from '../result'

export interface LighterCalculationContext {
  agentId: 'lighter'
  setup: CompleteSetup
  additionalActive: boolean
  fullyImpact: number
}

const BASIC_FIVE = actionTarget([sourceLocalAction('Empowered Basic Attack: 5th hit', 'Basic Attack')])
const BASIC_DASH_DODGE = actionTarget([
  canonicalAction('Basic Attack'), canonicalAction('Dash Attack'), canonicalAction('Dodge Counter'),
])
const BASIC = actionTarget([canonicalAction('Basic Attack')])
const LIGHTER_DAZE_SCOPES = [
  { id: 'lighterEmpoweredBasicFive', target: BASIC_FIVE },
  { id: 'lighterBasicDashDodge', target: BASIC_DASH_DODGE },
  { id: 'lighterBasic', target: BASIC },
] satisfies readonly ActionScopeNode[]

function impactInputs(setup: CompleteSetup) {
  return presentSetupInputs([
    engineAdvancedInput(setup, 'lighter', 'impactPct'),
    mainStatInput(setup, 'lighter', 'slot6', 'impact'),
    discStatInput(setup, 'lighter', 'fourPiece', 'shockstar', equipmentEffectBaseValue(DRIVE_DISC_FACTS.shockstar.twoPiece.impact), 'twoPiece'),
    discStatInput(setup, 'lighter', 'twoPiece', 'shockstar', equipmentEffectBaseValue(DRIVE_DISC_FACTS.shockstar.twoPiece.impact)),
  ])
}

function initialImpact(setup: CompleteSetup): number {
  const values = VERTICAL_VALUES.lighter
  return values.impact * (1 + impactInputs(setup).reduce((total, input) => total + input.rawValue, 0) / 100)
}

function engineImpact(setup: CompleteSetup): number {
  const refinement = setup.refinement
  if (setup.engineId === 'blazingLaurel') return equipmentEffectBaseValue(W_ENGINE_FACTS.blazingLaurel.effects.impact, refinement)
  if (setup.engineId === 'iceJadeTeapot') return equipmentEffectMaximumValue(W_ENGINE_FACTS.iceJadeTeapot.effects.impact, refinement)
  if (setup.engineId === 'hellfireGears') return equipmentEffectBaseValue(W_ENGINE_FACTS.hellfireGears.effects.impact, refinement)
  if (setup.engineId === 'steamOven') return equipmentEffectBaseValue(W_ENGINE_FACTS.steamOven.effects.impact, refinement)
  return 0
}

function elationOutput(impact: number, setup: CompleteSetup, active: boolean): number {
  if (!active) return 0
  const values = VERTICAL_VALUES.lighter
  const base = impact < values.elationBaseImpact
    ? 0
    : Math.min(
      values.elationFireIceDmgAtTwentyStacks
        + Math.floor((impact - values.elationBaseImpact) / values.elationStepImpact) * values.elationFireIceDmgPerStep,
      values.elationFireIceDmgCap,
    )
  return base * (setup.mindscape >= 2 ? values.mindscapeElationMultiplier : 1)
}

function localKingCritRate(setup: CompleteSetup): number {
  return VERTICAL_VALUES.lighter.critRate
    + (mainStatInput(setup, 'lighter', 'slot4', 'critRate')?.rawValue ?? 0)
    + (discStatInput(
      setup,
      'lighter',
      'twoPiece',
      'woodpecker',
      equipmentEffectBaseValue(DRIVE_DISC_FACTS.woodpecker.twoPiece.critRate),
    )?.rawValue ?? 0)
    + (effectiveSubstatInput(setup, 'lighter', 'critRate')?.rawValue ?? 0)
}

export function observeLighter(setup: CompleteSetup, additionalActive: boolean): LighterCalculationContext {
  const impact = initialImpact(setup)
  const fullyImpact = impact + VERTICAL_VALUES.lighter.impact
    * (VERTICAL_VALUES.lighter.coreCombatImpact + engineImpact(setup)) / 100
  return { agentId: 'lighter', setup, additionalActive, fullyImpact }
}

export function resolveLighterProviderClauses(context: LighterCalculationContext): SourceBoundCurrentClause[] {
  const { setup, additionalActive, fullyImpact } = context
  const values = VERTICAL_VALUES.lighter
  const engine = engineSource('lighter', setup)
  const refinement = setup.refinement
  const core = source(SOURCE_LABELS.lighterCore, 'lighter', 'core')
  const coreImpact = source(
    SOURCE_LABELS.lighterCore,
    'lighter',
    'core',
    'Empowered Basic Attack: 5th hit',
  )
  const additional = source(SOURCE_LABELS.lighterAbility, 'lighter', 'additional')
  const elation = elationOutput(fullyImpact, setup, additionalActive)
  const kingCritDmg = setup.fourPieceId === 'king'
    ? localKingCritRate(setup) >= values.kingCritThreshold
      ? equipmentEffectMaximumValue(DRIVE_DISC_FACTS.king.fourPiece.critDamage)
      : equipmentEffectBaseValue(DRIVE_DISC_FACTS.king.fourPiece.critDamage)
    : 0
  const fireIceDamage = (clause: SourceBoundCurrentClause) => withApplicability(
    clause,
    { attributes: ['Fire', 'Ice'], formulas: ['general_damage', 'sheer_damage'] },
  )
  const fireIceEnemy = (clause: SourceBoundCurrentClause) => withApplicability(
    clause,
    { attributes: ['Fire', 'Ice'] },
  )

  return active([
    percentage('impact', 'fully', coreImpact, values.coreCombatImpact, 'self'),
    fireIceEnemy(additive('resReduction', 'fully', core, values.coreFireIceResReduction, 'enemy-context')),
    additive('stunDuration', 'fully', core, values.coreStunExtension, 'enemy-context'),
    additive('stunDuration', 'fully', mindscapeSource('lighter', 1),
      setup.mindscape >= 1 ? values.mindscapeStunExtension - values.coreStunExtension : 0,
      'enemy-context'),
    fireIceEnemy(additive('resReduction', 'fully', mindscapeSource('lighter', 1),
      setup.mindscape >= 1 ? values.mindscapeFireIceResReduction : 0, 'enemy-context')),
    additive('stunDmgMultiplier', 'fully', mindscapeSource('lighter', 2),
      setup.mindscape >= 2 ? values.mindscapeStunMultiplier : 0, 'enemy-context'),
    fireIceDamage(additive('dmgBonus', 'fully', additional, elation, 'all-party')),
    additive('dazeBonus', 'initial',
      discSource('lighter', 'king', '2-piece', setup.fourPieceId === 'king' ? '4-piece' : '2-piece'),
      setup.fourPieceId === 'king' || setup.twoPieceId === 'king'
        ? equipmentEffectBaseValue(DRIVE_DISC_FACTS.king.twoPiece.daze)
        : 0,
      'self'),
    withApplicability(
      additive('critDmg', 'fully', discSource('lighter', 'king', '4-piece'),
        kingCritDmg, 'all-party', undefined, undefined, undefined, 'kingOfTheSummit'),
      { formulas: ['general_damage', 'sheer_damage'] },
    ),
    percentage('impact', 'fully', engine, engineImpact(setup), 'self'),
    ...(setup.engineId === 'hellfireGears'
      ? [perSecond(engine, equipmentEffectBaseValue(W_ENGINE_FACTS.hellfireGears.effects.energy, refinement), 'self')]
      : []),
    fireIceDamage(additive('critDmg', 'fully', engine,
      setup.engineId === 'blazingLaurel'
        ? equipmentEffectMaximumValue(W_ENGINE_FACTS.blazingLaurel.effects.critDamage, refinement)
        : 0,
      'all-party')),
    withApplicability(additive('dmgBonus', 'fully', engine,
      setup.engineId === 'iceJadeTeapot'
        ? equipmentEffectBaseValue(W_ENGINE_FACTS.iceJadeTeapot.effects.damage, refinement)
        : 0,
      'all-party', undefined, undefined, undefined, 'iceJadeTeapot'),
    { formulas: ['general_damage', 'sheer_damage'] }),
    additive('dazeBonus', 'fully', engine,
      setup.engineId === 'restrained'
        ? equipmentEffectMaximumValue(W_ENGINE_FACTS.restrained.effects.daze, refinement)
        : 0,
      'self', BASIC),
    additive('dazeBonus', 'fully', engine,
      setup.engineId === 'preciousFossilizedCore'
        ? equipmentEffectMaximumValue(W_ENGINE_FACTS.preciousFossilizedCore.effects.daze, refinement)
        : 0,
      'self'),
    additive('dazeBonus', 'fully', discSource('lighter', 'shockstar', '4-piece'),
      setup.fourPieceId === 'shockstar'
        ? equipmentEffectBaseValue(DRIVE_DISC_FACTS.shockstar.fourPiece.daze)
        : 0,
      'self', BASIC_DASH_DODGE),
  ])
}

export function calculateLighter(
  context: LighterCalculationContext,
  inbox: SourceBoundCurrentClause[],
  enemy: SourceBoundCurrentClause[],
): AgentResult {
  const { setup } = context
  const values = VERTICAL_VALUES.lighter
  const inputs = impactInputs(setup)
  const initial = initialImpact(setup)
  const effects = resolveDeliveredClauses([...inbox, ...enemy], { impact: values.impact })
  const impact = composeMetricEffects(
    surfaces(initial, initial, initial),
    surfaces(inputs.map((input) => percentageContribution(input.source, values.impact * input.rawValue / 100, input.rawValue)), [], []),
    effects,
    'impact',
  )
  const energyInputs = presentSetupInputs([
    engineAdvancedInput(setup, 'lighter', 'energyRegenPct'),
    mainStatInput(setup, 'lighter', 'slot6', 'energyRegenPct'),
    discStatInput(setup, 'lighter', 'twoPiece', 'swingJazz', equipmentEffectBaseValue(DRIVE_DISC_FACTS.swingJazz.twoPiece.energyRegen)),
  ])
  const energy = energyRegenProjection(values.baseEnergyRegen, energyInputs, effects)
  const critInputs = presentSetupInputs([
    mainStatInput(setup, 'lighter', 'slot4', 'critRate'),
    discStatInput(setup, 'lighter', 'twoPiece', 'woodpecker',
      equipmentEffectBaseValue(DRIVE_DISC_FACTS.woodpecker.twoPiece.critRate)),
    effectiveSubstatInput(setup, 'lighter', 'critRate'),
  ])
  const crit = composeMetricEffects(
    surfaces(
      values.critRate + critInputs.reduce((total, input) => total + input.rawValue, 0),
      values.critRate + critInputs.reduce((total, input) => total + input.rawValue, 0),
      values.critRate + critInputs.reduce((total, input) => total + input.rawValue, 0),
    ),
    surfaces(critInputs.map((input) => ({ ...input.source, amount: input.rawValue })), [], []),
    effects,
    'critRate',
    { value: 100, source: source('Displayed CRIT Rate cap', 'lighter', 'calculation') },
  )
  const daze = composeMetricEffects(surfaces(0, 0, 0), surfaces([], [], []), effects, 'dazeBonus')
  const res = composeMetricEffects(surfaces(0, 0, 0), surfaces([], [], []), effects, 'resReduction')
  const stunDuration = composeMetricEffects(surfaces(0, 0, 0), surfaces([], [], []), effects, 'stunDuration')
  const stunMultiplier = composeMetricEffects(surfaces(0, 0, 0), surfaces([], [], []), effects, 'stunDmgMultiplier')
  const elation = elationOutput(impact.values.fully, setup, context.additionalActive)
  const gauge: GaugeResult = {
    source: source(SOURCE_LABELS.lighterAbility, 'lighter', 'additional'),
    basisLabel: 'Fully Enabled Impact', current: impact.values.fully,
    threshold: values.elationBaseImpact, cap: 270,
    outputLabel: 'Fire & Ice DMG', outputValue: elation,
    outputCap: setup.mindscape >= 2 ? 90 : values.elationFireIceDmgCap,
    outputUnit: '%',
  }
  return {
    agentId: 'lighter',
    metrics: [
      { id: 'impact', label: 'Impact', unit: '', decimals: 3, ...impact, gauge },
      ...(setup.fourPieceId === 'king'
        ? [{
          id: 'critRate' as const,
          label: 'CRIT Rate',
          unit: '%',
          decimals: 1,
          ...crit,
          gauge: {
            source: discSource('lighter', 'king', '4-piece'),
            basisLabel: 'Initial CRIT Rate',
            current: crit.values.initial,
            threshold: values.kingCritThreshold,
            cap: values.kingCritThreshold,
            outputLabel: 'Squad CRIT DMG',
            outputValue: localKingCritRate(setup) >= values.kingCritThreshold
              ? equipmentEffectMaximumValue(DRIVE_DISC_FACTS.king.fourPiece.critDamage)
              : equipmentEffectBaseValue(DRIVE_DISC_FACTS.king.fourPiece.critDamage),
            outputUnit: '%',
          },
        }]
        : []),
      ...(energyInputs.length || setup.engineId === 'hellfireGears'
        ? [{ id: 'energyRegen' as const, label: 'Energy Regen', unit: '/s', decimals: 2, ...energy }]
        : []),
      { id: 'dazeBonus', label: 'Daze Bonus', unit: '%', decimals: 1, ...daze },
      { id: 'stunDuration', label: 'Stun Duration', unit: 's', decimals: 0, ...stunDuration },
      ...(stunMultiplier.values.fully
        ? [{ id: 'stunDmgMultiplier' as const, label: 'Stun DMG Multiplier', unit: '%', decimals: 1, ...stunMultiplier }]
        : []),
      { id: 'resReduction', label: 'RES Reduction', unit: '%', decimals: 1, ...res },
    ],
    actionModifiers: composeActionHierarchy(daze.values, effects, 'dazeBonus', LIGHTER_DAZE_SCOPES),
    operations: [{
      id: 'lighterQuickAssist', label: 'Quick Assist', source: source(SOURCE_LABELS.lighterCore, 'lighter', 'core'),
      surface: 'fully', value: 1, unit: '',
    }],
  }
}
