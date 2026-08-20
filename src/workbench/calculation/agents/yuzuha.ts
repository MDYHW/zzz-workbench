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
  effectiveSubstatInput,
  engineAdvancedInput,
  engineSource,
  mainStatInput,
  mindscapeSource,
  perSecond,
  percentage,
  presentSetupInputs,
  resolveDeliveredClauses,
  selectedDiscTwoPieceInputs,
  source,
  withApplicability,
  type CompleteSetup,
  type SourceBoundCurrentClause,
} from '../../effects'
import {
  actionTarget,
  canonicalAction,
  DISORDER_TARGET,
  sourceLocalAction,
  type ActionTarget,
} from '../../actions'
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

export interface YuzuhaCalculationContext {
  agentId: 'yuzuha'
  setup: CompleteSetup
  additionalActive: boolean
  focusAttribute: string
  flavorMatchTarget: ActionTarget
  initialAtk: number
  fullyEnabledMastery: number
}

const DAMAGE_FORMULAS = [
  'general_damage',
  'sheer_damage',
  'anomaly_damage',
] as const

const YUZUHA_ASSIST_FOLLOW_UP = actionTarget([
  canonicalAction('Assist Follow-Up'),
])

export const YUZUHA_ATTRIBUTE_ANOMALY_TARGET = actionTarget([
  sourceLocalAction('Attribute Anomaly'),
])

function fixedMastery(setup: CompleteSetup): number {
  const inputs = presentSetupInputs([
    mainStatInput(setup, 'yuzuha', 'slot6', 'anomalyMastery'),
    ...selectedDiscTwoPieceInputs(
      setup,
      'yuzuha',
      { modifier: 'anomalyMastery' },
    ),
  ])
  return VERTICAL_VALUES.yuzuha.anomalyMastery * (
    1 + inputs.reduce((total, input) => total + input.rawValue, 0) / 100
  )
}

function engineMastery(setup: CompleteSetup): number {
  return setup.engineId === 'metanukimorphosis'
    ? equipmentEffectBaseValue(
      W_ENGINE_FACTS.metanukimorphosis.effects.anomalyMastery,
      setup.refinement,
    )
    : 0
}

function sugarburstBuildup(mindscape: number): number {
  const tier = mindscape >= 5 ? 2 : mindscape >= 3 ? 1 : 0
  return VERTICAL_VALUES.yuzuha.sugarburstBuildupByMindscapeTier[tier]
}

function additionalOutputs(context: YuzuhaCalculationContext): {
  buildup: number
  anomaly: number
} {
  const values = VERTICAL_VALUES.yuzuha
  const invested = Math.max(
    0,
    Math.min(context.fullyEnabledMastery, values.additionalMasteryCap)
      - values.additionalMasteryThreshold,
  )
  return {
    buildup: invested * values.additionalBuildupPerMastery,
    anomaly: invested * (
      context.setup.mindscape >= 1
        ? values.mindscape1AnomalyPerMastery
        : values.additionalAnomalyPerMastery
    ),
  }
}

export function observeYuzuha(
  setup: CompleteSetup,
  additionalActive: boolean,
  focusAttribute: string,
): YuzuhaCalculationContext {
  const initialAtk = initialAtkFor('yuzuha', setup)
  if (initialAtk === null) throw new Error('Complete Yuzuha setup requires a W-Engine')
  return {
    agentId: 'yuzuha',
    setup,
    additionalActive,
    focusAttribute,
    flavorMatchTarget: actionTarget([
      sourceLocalAction(
        `${focusAttribute} Anomaly Buildup · Flavor Match`,
        'Basic Attack',
      ),
    ]),
    initialAtk,
    fullyEnabledMastery: fixedMastery(setup) + engineMastery(setup),
  }
}

export function resolveYuzuhaProviderClauses(
  context: YuzuhaCalculationContext,
): SourceBoundCurrentClause[] {
  const { additionalActive, flavorMatchTarget, initialAtk, setup } = context
  const values = VERTICAL_VALUES.yuzuha
  const engine = engineSource('yuzuha', setup)
  const refinement = setup.refinement
  const outputs = additionalOutputs(context)
  const flavorSource = source(
    'Basic Attack: Sugarburst',
    'yuzuha',
    'special',
    'Flavor Match',
  )

  const engineEnergy = setup.engineId === 'thoughtbop'
    ? equipmentEffectBaseValue(W_ENGINE_FACTS.thoughtbop.effects.energy, refinement)
    : setup.engineId === 'weepingCradle'
      ? equipmentEffectBaseValue(W_ENGINE_FACTS.weepingCradle.effects.energy, refinement)
      : 0
  const engineDamage = setup.engineId === 'thoughtbop'
    ? equipmentEffectMaximumValue(W_ENGINE_FACTS.thoughtbop.effects.damage, refinement)
    : setup.engineId === 'weepingCradle'
      ? equipmentEffectBaseValue(W_ENGINE_FACTS.weepingCradle.effects.damage, refinement)
      : 0
  const engineAtk = setup.engineId === 'thoughtbop'
    ? equipmentEffectBaseValue(W_ENGINE_FACTS.thoughtbop.effects.atk, refinement)
    : setup.engineId === 'kaboom'
      ? equipmentEffectBaseValue(W_ENGINE_FACTS.kaboom.effects.atk, refinement)
      : 0
  const engineCrit = setup.engineId === 'unfetteredGameBall'
    ? equipmentEffectBaseValue(W_ENGINE_FACTS.unfetteredGameBall.effects.critRate, refinement)
    : 0

  return active([
    withApplicability(
      additive(
        'atk',
        'fully',
        STATIC_SOURCES.yuzuha.core,
        Math.min(initialAtk * values.tanukiAtkRatio, values.tanukiAtkCap),
        'all-party',
      ),
      { formulas: DAMAGE_FORMULAS },
    ),
    withApplicability(
      additive(
        'dmgBonus', 'fully', STATIC_SOURCES.yuzuha.core,
        values.tanukiDmgBonus, 'all-party',
      ),
      { formulas: DAMAGE_FORMULAS },
    ),
    withApplicability(
      additive(
        'anomalyBuildupBonus', 'fully', flavorSource,
        sugarburstBuildup(setup.mindscape), 'self', flavorMatchTarget,
      ),
      { formulas: ['anomaly_buildup'] },
    ),
    withApplicability(
      additive(
        'anomalyBuildupBonus', 'fully', STATIC_SOURCES.yuzuha.additional,
        additionalActive ? outputs.buildup : 0, 'all-party',
      ),
      { formulas: ['anomaly_buildup'] },
    ),
    withApplicability(
      additive(
        'anomalyDmgBonus', 'fully', STATIC_SOURCES.yuzuha.additional,
        additionalActive ? outputs.anomaly : 0, 'all-party',
        YUZUHA_ATTRIBUTE_ANOMALY_TARGET,
      ),
      { formulas: ['anomaly_damage'] },
    ),
    withApplicability(
      additive(
        'anomalyDmgBonus', 'fully', STATIC_SOURCES.yuzuha.additional,
        additionalActive ? outputs.anomaly : 0, 'all-party',
        DISORDER_TARGET,
      ),
      { formulas: ['anomaly_damage'] },
    ),
    withApplicability(
      additive(
        'resReduction', 'fully', mindscapeSource('yuzuha', 1),
        setup.mindscape >= 1 ? values.mindscape1ResReduction : 0,
        'enemy-context',
      ),
      { formulas: DAMAGE_FORMULAS },
    ),
    withApplicability(
      additive(
        'dmgBonus', 'fully', mindscapeSource('yuzuha', 2),
        setup.mindscape >= 2 ? values.mindscape2DmgBonus : 0,
        'all-party',
      ),
      { formulas: DAMAGE_FORMULAS },
    ),
    withApplicability(
      additive(
        'anomalyBuildupBonus', 'fully', mindscapeSource('yuzuha', 2),
        setup.mindscape >= 2 ? values.mindscape2BuildupBonus : 0,
        'all-party',
      ),
      { formulas: ['anomaly_buildup'] },
    ),
    withApplicability(
      additive(
        'anomalyBuildupBonus', 'fully', mindscapeSource('yuzuha', 4),
        setup.mindscape >= 4 ? values.mindscape4AssistBuildup : 0,
        'self', YUZUHA_ASSIST_FOLLOW_UP,
      ),
      { formulas: ['anomaly_buildup'] },
    ),
    withApplicability(
      additive(
        'disorderDmgMultiplier', 'fully',
        mindscapeSource('yuzuha', 6, '3 qualifying shells'),
        setup.mindscape >= 6 ? values.mindscape6DisorderMultiplier : 0,
        'all-party',
      ),
      { formulas: ['anomaly_damage'] },
    ),
    additive(
      'anomalyMastery', 'fully', engine,
      engineMastery(setup), 'self',
    ),
    withApplicability(
      additive(
        'anomalyProficiency', 'fully', engine,
        setup.engineId === 'metanukimorphosis'
          ? equipmentEffectBaseValue(
            W_ENGINE_FACTS.metanukimorphosis.effects.anomalyProficiency,
            refinement,
          )
          : 0,
        'all-party',
      ),
      { formulas: ['anomaly_damage'] },
    ),
    withApplicability(
      additive('dmgBonus', 'fully', engine, engineDamage, 'all-party'),
      { formulas: DAMAGE_FORMULAS },
    ),
    withApplicability(
      percentage(
        'atk', 'fully', engine, engineAtk, 'all-party',
        undefined, undefined,
        setup.engineId === 'kaboom' ? 'kaboomTheCannon' : undefined,
      ),
      { formulas: DAMAGE_FORMULAS },
    ),
    additive('critRate', 'fully', engine, engineCrit, 'all-party'),
    ...(engineEnergy ? [perSecond(engine, engineEnergy, 'self')] : []),
    withApplicability(
      additive(
        'dmgBonus', 'fully', discSource('yuzuha', 'moonlight', '4-piece'),
        setup.fourPieceId === 'moonlight'
          ? equipmentEffectBaseValue(DRIVE_DISC_FACTS.moonlight.fourPiece.damage)
          : 0,
        'all-party', undefined, undefined, undefined, 'moonlightLullaby',
      ),
      { formulas: DAMAGE_FORMULAS },
    ),
  ])
}

export function calculateYuzuha(
  context: YuzuhaCalculationContext,
  inbox: SourceBoundCurrentClause[],
): AgentResult {
  const { additionalActive, flavorMatchTarget, initialAtk, setup } = context
  const values = VERTICAL_VALUES.yuzuha
  const effects = resolveDeliveredClauses(inbox, {})
  const baseAtk = values.atk + W_ENGINES[setup.engineId].baseAtk
  const atkInputs = presentSetupInputs([
    mainStatInput(setup, 'yuzuha', 'slot4', 'atkPct'),
    mainStatInput(setup, 'yuzuha', 'slot5', 'atkPct'),
    ...selectedDiscTwoPieceInputs(setup, 'yuzuha', { modifier: 'atk' }),
    effectiveSubstatInput(setup, 'yuzuha', 'atkPct'),
  ])
  const flatAtk = effectiveSubstatInput(setup, 'yuzuha', 'atkFlat')
  const atk = composeMetricEffects(
    surfaces(initialAtk, initialAtk, initialAtk),
    surfaces([
      ...atkInputs.map((input) => percentageContribution(
        input.source,
        baseAtk * input.rawValue / 100,
        input.rawValue,
      )),
      ...(flatAtk ? [contribution(flatAtk.source, flatAtk.rawValue)] : []),
    ], [], []),
    effects,
    'atk',
  )

  const masteryInputs = presentSetupInputs([
    mainStatInput(setup, 'yuzuha', 'slot6', 'anomalyMastery'),
    ...selectedDiscTwoPieceInputs(setup, 'yuzuha', { modifier: 'anomalyMastery' }),
  ])
  const initialMastery = fixedMastery(setup)
  const mastery = composeMetricEffects(
    surfaces(initialMastery, initialMastery, initialMastery),
    surfaces(masteryInputs.map((input) => percentageContribution(
      input.source,
      values.anomalyMastery * input.rawValue / 100,
      input.rawValue,
    )), [], []),
    effects,
    'anomalyMastery',
  )
  const energyInputs = presentSetupInputs([
    engineAdvancedInput(setup, 'yuzuha', 'energyRegenPct'),
    ...selectedDiscTwoPieceInputs(setup, 'yuzuha', { modifier: 'energyRegen' }),
  ])
  const energy = energyRegenProjection(values.baseEnergyRegen, energyInputs, effects)
  const buildup = composeMetricEffects(
    surfaces(0, 0, 0), surfaces([], [], []), effects, 'anomalyBuildupBonus',
  )
  const actionScopes = [
    { id: 'yuzuhaFlavorMatchBuildup', target: flavorMatchTarget },
    { id: 'yuzuhaAssistFollowUpBuildup', target: YUZUHA_ASSIST_FOLLOW_UP },
  ] satisfies readonly ActionScopeNode[]
  const output = additionalOutputs(context)

  return {
    agentId: 'yuzuha',
    metrics: [
      {
        id: 'atk', label: 'ATK', unit: '', decimals: 0, ...atk,
        gauge: {
          source: STATIC_SOURCES.yuzuha.core,
          basisLabel: 'Initial ATK',
          current: initialAtk,
          cap: values.tanukiAtkCap / values.tanukiAtkRatio,
          outputLabel: 'Squad flat ATK',
          outputValue: Math.min(initialAtk * values.tanukiAtkRatio, values.tanukiAtkCap),
          outputCap: values.tanukiAtkCap,
          outputUnit: '',
          decimals: { current: 1, cap: 0, output: 1, outputCap: 0 },
        },
      },
      {
        id: 'anomalyMastery', label: 'Anomaly Mastery', unit: '', decimals: 2,
        ...mastery,
        ...(additionalActive
          ? {
            gauge: {
              source: STATIC_SOURCES.yuzuha.additional,
              basisLabel: 'Fully Enabled Anomaly Mastery',
              current: mastery.values.fully,
              threshold: values.additionalMasteryThreshold,
              cap: values.additionalMasteryCap,
              outputLabel: 'Squad Anomaly Buildup Rate',
              outputValue: output.buildup,
              outputCap: 20,
              outputUnit: '%',
              additionalOutputs: [
                {
                  label: 'Squad Attribute Anomaly DMG',
                  value: output.anomaly,
                  cap: setup.mindscape >= 1 ? 26 : 20,
                  unit: '%',
                },
                {
                  label: 'Squad Disorder DMG',
                  value: output.anomaly,
                  cap: setup.mindscape >= 1 ? 26 : 20,
                  unit: '%',
                },
              ],
              decimals: {
                current: 2, threshold: 0, cap: 0, output: 2, outputCap: 0,
              },
            },
          }
          : {}),
      },
      {
        id: 'energyRegen', label: 'Energy Regen', unit: '/s', decimals: 2,
        ...energy,
      },
      {
        id: 'anomalyBuildupBonus', label: 'Anomaly Buildup Bonus',
        unit: '%', decimals: 1, ...buildup,
      },
    ],
    actionModifiers: composeActionHierarchy(
      buildup.values,
      effects,
      'anomalyBuildupBonus',
      actionScopes,
    ),
    operations: setup.mindscape >= 4
      ? [{
        id: 'yuzuhaQuickAssist',
        label: 'Quick Assist',
        source: mindscapeSource('yuzuha', 4),
        surface: 'fully',
        value: 1,
        unit: '',
      }]
      : [],
  }
}
