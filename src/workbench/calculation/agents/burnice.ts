import {
  DRIVE_DISC_FACTS,
  VERTICAL_VALUES,
  W_ENGINE_FACTS,
  W_ENGINES,
  equipmentEffectBaseValue,
  equipmentEffectMaximumValue,
} from '../../content'
import {
  actionForm,
  actionTarget,
  canonicalAction,
  sourceLocalAction,
} from '../../actions'
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
  withApplicability,
  type CompleteSetup,
  type EffectMetric,
  type SourceBoundCurrentClause,
} from '../../effects'
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
import type { AgentResult, GaugeResult, ResultMetric } from '../result'
import { YUZUHA_ATTRIBUTE_ANOMALY_TARGET } from './yuzuha'

export interface BurniceCalculationContext {
  agentId: 'burnice'
  setup: CompleteSetup
  additionalActive: boolean
  initialAtk: number
  initialEnergyRegen: number
  potentialMastery: number
  potentialDmgBonus: number
}

const DAMAGE_FORMULAS = ['general_damage', 'anomaly_damage'] as const

const BURNICE_AFTERBURN = actionTarget([
  sourceLocalAction('Afterburn'),
])
const BURNICE_ADDITIONAL_BUILDUP = actionTarget([
  actionForm('Basic Attack', 'Mixed Flame'),
  canonicalAction('EX Special Attack'),
  sourceLocalAction('Afterburn'),
  sourceLocalAction('Tossing'),
])
const BURNICE_EX_ASSIST = actionTarget([
  canonicalAction('EX Special Attack'),
  canonicalAction('Assist'),
])
const BURNICE_M6_DOUBLE_SHOT = actionTarget([
  sourceLocalAction('Double Shot'),
  sourceLocalAction('Special Afterburn'),
])
const BURNICE_BURN = actionTarget([
  sourceLocalAction('Burn'),
])

const BUILDUP_SCOPES = [{
  id: 'burniceAdditionalBuildup',
  target: BURNICE_ADDITIONAL_BUILDUP,
  children: [{ id: 'burniceAfterburnBuildup', target: BURNICE_AFTERBURN }],
}] satisfies readonly ActionScopeNode[]

const DAMAGE_SCOPES = [
  { id: 'burniceExAssistDmg', target: BURNICE_EX_ASSIST },
  { id: 'burniceAfterburnDmg', target: BURNICE_AFTERBURN },
] satisfies readonly ActionScopeNode[]

const CRIT_SCOPES = [
  { id: 'burniceExAssistCrit', target: BURNICE_EX_ASSIST },
] satisfies readonly ActionScopeNode[]

const RES_IGNORE_SCOPES = [
  { id: 'burniceM6DoubleShotResIgnore', target: BURNICE_M6_DOUBLE_SHOT },
  {
    id: 'burniceAttributeAnomalyResIgnore',
    target: YUZUHA_ATTRIBUTE_ANOMALY_TARGET,
    children: [{ id: 'burniceBurnResIgnore', target: BURNICE_BURN }],
  },
] satisfies readonly ActionScopeNode[]

function energyInputs(setup: CompleteSetup) {
  return presentSetupInputs([
    engineAdvancedInput(setup, 'burnice', 'energyRegenPct'),
    mainStatInput(setup, 'burnice', 'slot6', 'energyRegenPct'),
    ...selectedDiscTwoPieceInputs(setup, 'burnice', { modifier: 'energyRegen' }),
  ])
}

function initialEnergyRegen(setup: CompleteSetup): number {
  const values = VERTICAL_VALUES.burnice
  return values.baseEnergyRegen * (
    1 + energyInputs(setup).reduce((total, input) => total + input.rawValue, 0) / 100
  )
}

function potentialOutputs(initialEnergy: number): {
  mastery: number
  damage: number
} {
  const values = VERTICAL_VALUES.burnice
  const eligibleEnergy = Math.max(initialEnergy - values.potentialEnergyThreshold, 0)
  return {
    mastery: Math.min(
      eligibleEnergy / 0.1 * values.potentialMasteryPerStep,
      values.potentialMasteryCap,
    ),
    damage: Math.min(
      eligibleEnergy / 0.1 * values.potentialDmgPerStep,
      values.potentialDmgCap,
    ),
  }
}

export function observeBurnice(
  setup: CompleteSetup,
  additionalActive: boolean,
): BurniceCalculationContext {
  const initialAtk = initialAtkFor('burnice', setup)
  if (initialAtk === null) throw new Error('Complete Burnice setup requires a W-Engine')
  const energy = initialEnergyRegen(setup)
  const potential = potentialOutputs(energy)
  return {
    agentId: 'burnice',
    setup,
    additionalActive,
    initialAtk,
    initialEnergyRegen: energy,
    potentialMastery: potential.mastery,
    potentialDmgBonus: potential.damage,
  }
}

export function resolveBurniceProviderClauses(
  context: BurniceCalculationContext,
): SourceBoundCurrentClause[] {
  const {
    additionalActive,
    potentialDmgBonus,
    potentialMastery,
    setup,
  } = context
  const values = VERTICAL_VALUES.burnice
  const engine = engineSource('burnice', setup)
  const refinement = setup.refinement

  return active([
    withApplicability(
      additive(
        'anomalyBuildupBonus', 'fully', STATIC_SOURCES.burnice.additional,
        additionalActive ? values.additionalBuildupRate : 0,
        'self', BURNICE_ADDITIONAL_BUILDUP,
      ),
      { attributes: ['Fire'], formulas: ['anomaly_buildup'] },
    ),
    additive(
      'anomalyMastery', 'fully', STATIC_SOURCES.burnice.potential,
      potentialMastery, 'self',
    ),
    withApplicability(
      additive(
        'dmgBonus', 'fully', STATIC_SOURCES.burnice.potential,
        potentialDmgBonus, 'self',
      ),
      { attributes: ['Fire'], formulas: DAMAGE_FORMULAS },
    ),
    withApplicability(
      additive(
        'anomalyBuildupBonus', 'fully', mindscapeSource('burnice', 1),
        setup.mindscape >= 1 ? values.mindscape1BuildupRate : 0,
        'self', BURNICE_AFTERBURN,
      ),
      { attributes: ['Fire'], formulas: ['anomaly_buildup'] },
    ),
    withApplicability(
      additive(
        'penRatio', 'fully', mindscapeSource('burnice', 2, 'Thermal Penetration'),
        setup.mindscape >= 2 ? values.mindscape2PenRatio : 0,
        'enemy-context',
      ),
      { formulas: DAMAGE_FORMULAS },
    ),
    withApplicability(
      additive(
        'critRate', 'fully', mindscapeSource('burnice', 4),
        setup.mindscape >= 4 ? values.mindscape4CritRate : 0,
        'self', BURNICE_EX_ASSIST,
      ),
      { attributes: ['Fire'], formulas: ['general_damage'] },
    ),
    withApplicability(
      additive(
        'resIgnore', 'fully', mindscapeSource('burnice', 6),
        setup.mindscape >= 6 ? values.mindscape6FireResIgnore : 0,
        'self', BURNICE_M6_DOUBLE_SHOT,
      ),
      { attributes: ['Fire'], formulas: ['general_damage'] },
    ),
    withApplicability(
      additive(
        'resIgnore', 'fully', mindscapeSource('burnice', 6),
        setup.mindscape >= 6 ? values.mindscape6FireResIgnore : 0,
        'self', BURNICE_BURN,
      ),
      { attributes: ['Fire'], formulas: ['anomaly_damage'] },
    ),
    additive(
      'anomalyMastery', 'combat', engine,
      setup.engineId === 'practicedPerfection'
        ? equipmentEffectBaseValue(
          W_ENGINE_FACTS.practicedPerfection.effects.anomalyMastery,
          refinement,
        )
        : 0,
      'self',
    ),
    percentage(
      'atk', 'fully', engine,
      setup.engineId === 'electroLipGloss'
        ? equipmentEffectBaseValue(W_ENGINE_FACTS.electroLipGloss.effects.atk, refinement)
        : 0,
      'self',
    ),
    additive(
      'anomalyProficiency', 'fully', engine,
      setup.engineId === 'flamemakerShaker'
        ? equipmentEffectBaseValue(
          W_ENGINE_FACTS.flamemakerShaker.effects.anomalyProficiency,
          refinement,
        )
        : setup.engineId === 'weepingGemini'
          ? equipmentEffectMaximumValue(
            W_ENGINE_FACTS.weepingGemini.effects.anomalyProficiency,
            refinement,
          )
          : 0,
      'self',
    ),
    additive(
      'dmgBonus', 'fully', engine,
      setup.engineId === 'flamemakerShaker'
        ? equipmentEffectMaximumValue(W_ENGINE_FACTS.flamemakerShaker.effects.damage, refinement)
        : setup.engineId === 'electroLipGloss'
          ? equipmentEffectBaseValue(W_ENGINE_FACTS.electroLipGloss.effects.damage, refinement)
          : 0,
      'self',
    ),
    ...(setup.engineId === 'flamemakerShaker'
      ? [perSecond(
        engine,
        equipmentEffectBaseValue(
          W_ENGINE_FACTS.flamemakerShaker.effects.offFieldEnergy,
          refinement,
        ),
        'self',
      )]
      : []),
    withApplicability(
      additive(
        'dmgBonus', 'combat', discSource('burnice', 'chaosJazz', '4-piece'),
        setup.fourPieceId === 'chaosJazz'
          ? equipmentEffectBaseValue(
            DRIVE_DISC_FACTS.chaosJazz.fourPiece.electricFireDamage,
          )
          : 0,
        'self',
      ),
      { attributes: ['Fire'], formulas: DAMAGE_FORMULAS },
    ),
    withApplicability(
      additive(
        'dmgBonus', 'fully', discSource('burnice', 'chaosJazz', '4-piece'),
        setup.fourPieceId === 'chaosJazz'
          ? equipmentEffectBaseValue(
            DRIVE_DISC_FACTS.chaosJazz.fourPiece.offFieldActionDamage,
          )
          : 0,
        'self', BURNICE_EX_ASSIST,
      ),
      { attributes: ['Fire'], formulas: ['general_damage'] },
    ),
    withApplicability(
      additive(
        'anomalyBuildupResReduction', 'fully',
        discSource('burnice', 'freedomBlues', '4-piece'),
        setup.fourPieceId === 'freedomBlues'
          ? equipmentEffectBaseValue(
            DRIVE_DISC_FACTS.freedomBlues.fourPiece.buildupResReduction,
          )
          : 0,
        'self',
      ),
      { attributes: ['Fire'], formulas: ['anomaly_buildup'] },
    ),
  ])
}

function optionalMetric(
  metric: EffectMetric,
  label: string,
  effects: ReturnType<typeof resolveDeliveredClauses>,
  actions: AgentResult['actionModifiers'] = [],
): ResultMetric[] {
  const data = composeMetricEffects(
    surfaces(0, 0, 0), surfaces([], [], []), effects, metric,
  )
  return data.values.fully || actions.some(({ metricId }) => metricId === metric)
    ? [{ id: metric, label, unit: '%', decimals: 1, ...data }]
    : []
}

export function calculateBurnice(
  context: BurniceCalculationContext,
  inbox: SourceBoundCurrentClause[],
  enemy: SourceBoundCurrentClause[],
): AgentResult {
  const {
    additionalActive,
    initialAtk,
    initialEnergyRegen: initialEnergy,
    potentialDmgBonus,
    potentialMastery,
    setup,
  } = context
  const values = VERTICAL_VALUES.burnice
  const baseAtk = values.atk + W_ENGINES[setup.engineId].baseAtk
  const baseEffects = resolveDeliveredClauses([...inbox, ...enemy], { atk: initialAtk })

  const atkInputs = presentSetupInputs([
    engineAdvancedInput(setup, 'burnice', 'atkPct'),
    mainStatInput(setup, 'burnice', 'slot4', 'atkPct'),
    mainStatInput(setup, 'burnice', 'slot5', 'atkPct'),
    mainStatInput(setup, 'burnice', 'slot6', 'atkPct'),
    ...selectedDiscTwoPieceInputs(setup, 'burnice', { modifier: 'atk' }),
    effectiveSubstatInput(setup, 'burnice', 'atkPct'),
  ])
  const atk = composeMetricEffects(
    surfaces(initialAtk, initialAtk, initialAtk),
    surfaces(atkInputs.map((input) => percentageContribution(
      input.source, baseAtk * input.rawValue / 100, input.rawValue,
    )), [], []),
    baseEffects,
    'atk',
  )

  const proficiencyInputs = presentSetupInputs([
    engineAdvancedInput(setup, 'burnice', 'anomalyProficiency'),
    mainStatInput(setup, 'burnice', 'slot4', 'anomalyProficiency'),
    ...selectedDiscTwoPieceInputs(
      setup, 'burnice', { modifier: 'anomalyProficiency' },
    ),
    effectiveSubstatInput(setup, 'burnice', 'anomalyProficiency'),
  ])
  const initialProficiency = values.anomalyProficiency
    + proficiencyInputs.reduce((total, input) => total + input.rawValue, 0)
  const anomalyProficiency = composeMetricEffects(
    surfaces(initialProficiency, initialProficiency, initialProficiency),
    surfaces(
      proficiencyInputs.map((input) => contribution(input.source, input.rawValue)),
      [],
      [],
    ),
    baseEffects,
    'anomalyProficiency',
  )

  const afterburnDmgBonus = Math.min(
    anomalyProficiency.values.fully / 10 * values.afterburnDmgBonusPerThreshold,
    values.afterburnDmgBonusCap,
  )
  const effects = [
    ...baseEffects,
    ...resolveDeliveredClauses(active([
      additive(
        'dmgBonus', 'fully', STATIC_SOURCES.burnice.core,
        afterburnDmgBonus, 'self', BURNICE_AFTERBURN,
      ),
    ]), {}),
  ]

  const masteryInputs = presentSetupInputs([
    engineAdvancedInput(setup, 'burnice', 'anomalyMastery'),
    mainStatInput(setup, 'burnice', 'slot6', 'anomalyMastery'),
    ...selectedDiscTwoPieceInputs(setup, 'burnice', { modifier: 'anomalyMastery' }),
  ])
  const initialMastery = values.anomalyMastery * (
    1 + masteryInputs.reduce((total, input) => total + input.rawValue, 0) / 100
  )
  const anomalyMastery = composeMetricEffects(
    surfaces(initialMastery, initialMastery, initialMastery),
    surfaces(masteryInputs.map((input) => percentageContribution(
      input.source,
      values.anomalyMastery * input.rawValue / 100,
      input.rawValue,
    )), [], []),
    effects,
    'anomalyMastery',
  )

  const energyRegen = energyRegenProjection(
    values.baseEnergyRegen,
    energyInputs(setup),
    effects,
  )
  const dmgInputs = presentSetupInputs([
    mainStatInput(setup, 'burnice', 'slot5', 'fireDmg'),
    ...selectedDiscTwoPieceInputs(setup, 'burnice', { modifier: 'dmgBonus' }),
  ])
  const initialDmg = dmgInputs.reduce((total, input) => total + input.rawValue, 0)
  const dmg = composeMetricEffects(
    surfaces(initialDmg, initialDmg, initialDmg),
    surfaces(dmgInputs.map((input) => contribution(input.source, input.rawValue)), [], []),
    effects,
    'dmgBonus',
  )
  const penInputs = presentSetupInputs([
    engineAdvancedInput(setup, 'burnice', 'penRatio'),
    mainStatInput(setup, 'burnice', 'slot5', 'penRatio'),
    ...selectedDiscTwoPieceInputs(setup, 'burnice', { modifier: 'penRatio' }),
  ])
  const initialPen = penInputs.reduce((total, input) => total + input.rawValue, 0)
  const penRatio = composeMetricEffects(
    surfaces(initialPen, initialPen, initialPen),
    surfaces(penInputs.map((input) => contribution(input.source, input.rawValue)), [], []),
    effects,
    'penRatio',
  )
  const critRate = composeMetricEffects(
    surfaces(values.critRate, values.critRate, values.critRate),
    surfaces([], [], []),
    effects,
    'critRate',
  )
  const anomalyDmgBonus = composeMetricEffects(
    surfaces(0, 0, 0), surfaces([], [], []), effects, 'anomalyDmgBonus',
  )
  const anomalyBuildupBonus = composeMetricEffects(
    surfaces(0, 0, 0), surfaces([], [], []), effects, 'anomalyBuildupBonus',
  )
  const resIgnore = composeMetricEffects(
    surfaces(0, 0, 0), surfaces([], [], []), effects, 'resIgnore',
  )
  const actionModifiers: AgentResult['actionModifiers'] = [
    ...composeActionHierarchy(dmg.values, effects, 'dmgBonus', DAMAGE_SCOPES),
    ...composeActionHierarchy(
      anomalyBuildupBonus.values,
      effects,
      'anomalyBuildupBonus',
      BUILDUP_SCOPES,
    ),
    ...composeActionHierarchy(critRate.values, effects, 'critRate', CRIT_SCOPES),
    ...composeActionHierarchy(
      resIgnore.values,
      effects,
      'resIgnore',
      RES_IGNORE_SCOPES,
    ),
  ]

  const proficiencyGauge: GaugeResult = {
    source: STATIC_SOURCES.burnice.core,
    basisLabel: 'Fully Enabled Anomaly Proficiency',
    current: anomalyProficiency.values.fully,
    cap: values.afterburnApCap,
    outputLabel: 'Afterburn DMG Bonus',
    outputValue: afterburnDmgBonus,
    outputCap: values.afterburnDmgBonusCap,
    outputUnit: '%',
    decimals: { current: 0, cap: 0, output: 1, outputCap: 0 },
  }
  const energyGauge: GaugeResult = {
    source: STATIC_SOURCES.burnice.potential,
    basisLabel: 'Initial Energy Regen',
    current: initialEnergy,
    threshold: values.potentialEnergyThreshold,
    cap: values.potentialEnergyThreshold + 1,
    outputLabel: 'Anomaly Mastery',
    outputValue: potentialMastery,
    outputCap: values.potentialMasteryCap,
    outputUnit: '',
    additionalOutputs: [{
      label: 'DMG Bonus',
      value: potentialDmgBonus,
      cap: values.potentialDmgCap,
      unit: '%',
    }],
    decimals: { current: 3, threshold: 1, cap: 1, output: 1, outputCap: 0 },
  }

  return {
    agentId: 'burnice',
    metrics: [
      { id: 'atk', label: 'ATK', unit: '', decimals: 0, ...atk },
      {
        id: 'anomalyProficiency', label: 'Anomaly Proficiency', unit: '', decimals: 0,
        ...anomalyProficiency,
        gauge: proficiencyGauge,
      },
      {
        id: 'anomalyMastery', label: 'Anomaly Mastery', unit: '', decimals: 1,
        ...anomalyMastery,
      },
      {
        id: 'energyRegen', label: 'Energy Regen', unit: '/s', decimals: 3,
        ...energyRegen,
        gauge: energyGauge,
      },
      { id: 'dmgBonus', label: 'DMG Bonus', unit: '%', decimals: 1, ...dmg },
      {
        id: 'anomalyDmgBonus', label: 'Anomaly DMG Bonus', unit: '%', decimals: 1,
        ...anomalyDmgBonus,
      },
      {
        id: 'anomalyBuildupBonus', label: 'Anomaly Buildup Bonus', unit: '%',
        decimals: 1, ...anomalyBuildupBonus,
      },
      ...(actionModifiers.some(({ metricId }) => metricId === 'critRate')
        ? [{ id: 'critRate' as const, label: 'CRIT Rate', unit: '%', decimals: 1, ...critRate }]
        : []),
      ...(penRatio.values.fully
        ? [{ id: 'penRatio' as const, label: 'PEN Ratio', unit: '%', decimals: 1, ...penRatio }]
        : []),
      ...optionalMetric(
        'anomalyBuildupResReduction',
        'Anomaly Buildup RES Reduction',
        effects,
      ),
      ...optionalMetric('defIgnore', 'DEF Ignore', effects),
      ...optionalMetric('defReduction', 'DEF Reduction', effects),
      ...optionalMetric('resIgnore', 'RES Ignore', effects, actionModifiers),
      ...optionalMetric('resReduction', 'RES Reduction', effects),
      ...optionalMetric('stunDmgMultiplier', 'Stun DMG Multiplier', effects),
    ],
    actionModifiers,
    operations: [
      ...(additionalActive
        ? [{
          id: 'burniceBurnDuration',
          label: 'Burn duration',
          source: STATIC_SOURCES.burnice.additional,
          surface: 'fully' as const,
          value: values.burnDurationExtensionSeconds,
          unit: 's',
        }]
        : []),
      ...(setup.mindscape >= 1
        ? [{
          id: 'burniceAfterburnAddedMultiplier',
          label: 'Added Afterburn DMG Multiplier',
          source: mindscapeSource('burnice', 1),
          surface: 'fully' as const,
          value: values.mindscape1AddedAtkPercent,
          unit: '% ATK',
        }]
        : []),
    ],
  }
}
