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
  presentSetupInputs,
  resolveDeliveredClauses,
  withApplicability,
  type CompleteSetup,
  type EffectMetric,
  type SourceBoundCurrentClause,
} from '../../effects'
import { actionTarget, canonicalAction, sourceLocalAction } from '../../actions'
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

export interface GraceCalculationContext {
  agentId: 'grace'
  setup: CompleteSetup
  additionalActive: boolean
  disorderOpportunity: boolean
  initialAtk: number
}

export function observeGrace(
  setup: CompleteSetup,
  additionalActive: boolean,
  disorderOpportunity: boolean,
): GraceCalculationContext {
  const initialAtk = initialAtkFor('grace', setup)
  if (initialAtk === null) throw new Error('Complete Grace setup requires a W-Engine')
  return { agentId: 'grace', setup, additionalActive, disorderOpportunity, initialAtk }
}

const GRACE_SPECIAL_EX = actionTarget([
  canonicalAction('Special Attack'),
  canonicalAction('EX Special Attack'),
])
const GRACE_SHOCK = actionTarget([sourceLocalAction('Shock')])
const GRACE_DISORDER = actionTarget([sourceLocalAction('Disorder')])

const GRACE_ANOMALY_DAMAGE_SCOPES = [
  { id: 'graceShock', target: GRACE_SHOCK },
  { id: 'graceDisorder', target: GRACE_DISORDER },
] satisfies readonly ActionScopeNode[]

const GRACE_BUILDUP_SCOPES = [
  { id: 'graceSpecialExBuildup', target: GRACE_SPECIAL_EX },
] satisfies readonly ActionScopeNode[]

export function resolveGraceProviderClauses(
  context: GraceCalculationContext,
): SourceBoundCurrentClause[] {
  const { additionalActive, setup } = context
  const values = VERTICAL_VALUES.grace
  const engine = engineSource('grace', setup)
  const refinement = setup.refinement

  return active([
    withApplicability(
      additive(
        'anomalyBuildupBonus', 'fully', STATIC_SOURCES.grace.core,
        values.coreAnomalyBuildup, 'self', GRACE_SPECIAL_EX,
      ),
      { attributes: ['Electric'], formulas: ['anomaly_buildup'] },
    ),
    withApplicability(
      additive(
        'anomalyDmgBonus', 'fully', STATIC_SOURCES.grace.additional,
        additionalActive
          ? values.additionalShockDmgPerStack * values.additionalShockDmgStacks
          : 0,
        'self', GRACE_SHOCK,
      ),
      { attributes: ['Electric'], formulas: ['anomaly_damage'] },
    ),
    withApplicability(
      additive(
        'dmgBonus', 'fully', STATIC_SOURCES.grace.potential,
        values.potentialElectricDmg, 'self',
      ),
      { attributes: ['Electric'], formulas: ['anomaly_damage'] },
    ),
    withApplicability(
      additive(
        'resReduction', 'fully', mindscapeSource('grace', 2, 'After grenade hit'),
        setup.mindscape >= 2 ? values.mindscapeElectricResReduction : 0,
        'enemy-context',
      ),
      { attributes: ['Electric'], formulas: ['general_damage', 'anomaly_damage'] },
    ),
    withApplicability(
      additive(
        'anomalyBuildupResReduction', 'fully',
        mindscapeSource('grace', 2, 'After grenade hit'),
        setup.mindscape >= 2 ? values.mindscapeElectricBuildupResReduction : 0,
        'enemy-context',
      ),
      { attributes: ['Electric'], formulas: ['anomaly_buildup'] },
    ),
    withApplicability(
      additive(
        'anomalyBuildupBonus', 'combat', engine,
        setup.engineId === 'timeweaver'
          ? equipmentEffectBaseValue(
            W_ENGINE_FACTS.timeweaver.effects.electricBuildup,
            refinement,
          )
          : 0,
        'self',
      ),
      { attributes: ['Electric'], formulas: ['anomaly_buildup'] },
    ),
    additive(
      'anomalyProficiency', 'fully', engine,
      setup.engineId === 'timeweaver'
        ? equipmentEffectBaseValue(
          W_ENGINE_FACTS.timeweaver.effects.anomalyProficiency,
          refinement,
        )
        : setup.engineId === 'fusionCompiler'
          ? equipmentEffectMaximumValue(
            W_ENGINE_FACTS.fusionCompiler.effects.anomalyProficiency,
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
      'atk', 'combat', engine,
      setup.engineId === 'fusionCompiler'
        ? equipmentEffectBaseValue(W_ENGINE_FACTS.fusionCompiler.effects.atk, refinement)
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
      'dmgBonus', 'fully', engine,
      setup.engineId === 'electroLipGloss'
        ? equipmentEffectBaseValue(W_ENGINE_FACTS.electroLipGloss.effects.damage, refinement)
        : 0,
      'self',
    ),
    percentage(
      'atk', 'fully', discSource('grace', 'thunderMetal', '4-piece'),
      setup.fourPieceId === 'thunderMetal'
        ? equipmentEffectBaseValue(DRIVE_DISC_FACTS.thunderMetal.fourPiece.atk)
        : 0,
      'self',
    ),
    withApplicability(
      additive(
        'dmgBonus', 'combat', discSource('grace', 'chaosJazz', '4-piece'),
        setup.fourPieceId === 'chaosJazz'
          ? equipmentEffectBaseValue(DRIVE_DISC_FACTS.chaosJazz.fourPiece.electricFireDamage)
          : 0,
        'self',
      ),
      { attributes: ['Electric'], formulas: ['anomaly_damage'] },
    ),
    withApplicability(
      additive(
        'anomalyBuildupResReduction', 'fully',
        discSource('grace', 'freedomBlues', '4-piece'),
        setup.fourPieceId === 'freedomBlues'
          ? equipmentEffectBaseValue(
            DRIVE_DISC_FACTS.freedomBlues.fourPiece.buildupResReduction,
          )
          : 0,
        'self',
      ),
      { attributes: ['Electric'], formulas: ['anomaly_buildup'] },
    ),
  ])
}

function optionalMetric(
  metric: EffectMetric,
  label: string,
  effects: ReturnType<typeof resolveDeliveredClauses>,
  actionModifiers: AgentResult['actionModifiers'] = [],
): ResultMetric[] {
  const data = composeMetricEffects(
    surfaces(0, 0, 0), surfaces([], [], []), effects, metric,
  )
  return data.values.fully || actionModifiers.some(({ metricId }) => metricId === metric)
    ? [{ id: metric, label, unit: '%', decimals: 1, ...data }]
    : []
}

export function calculateGrace(
  context: GraceCalculationContext,
  inbox: SourceBoundCurrentClause[],
  enemy: SourceBoundCurrentClause[],
): AgentResult {
  const { disorderOpportunity, initialAtk, setup } = context
  const values = VERTICAL_VALUES.grace
  const baseAtk = values.atk + W_ENGINES[setup.engineId].baseAtk
  const baseEffects = resolveDeliveredClauses([...inbox, ...enemy], { atk: initialAtk })

  const atkInputs = presentSetupInputs([
    engineAdvancedInput(setup, 'grace', 'atkPct'),
    mainStatInput(setup, 'grace', 'slot4', 'atkPct'),
    mainStatInput(setup, 'grace', 'slot5', 'atkPct'),
    mainStatInput(setup, 'grace', 'slot6', 'atkPct'),
    discStatInput(
      setup, 'grace', 'fourPiece', 'hormonePunk',
      equipmentEffectBaseValue(DRIVE_DISC_FACTS.hormonePunk.twoPiece.atk), 'twoPiece',
    ),
    discStatInput(
      setup, 'grace', 'fourPiece', 'astralVoice',
      equipmentEffectBaseValue(DRIVE_DISC_FACTS.astralVoice.twoPiece.atk), 'twoPiece',
    ),
    discStatInput(
      setup, 'grace', 'twoPiece', 'hormonePunk',
      equipmentEffectBaseValue(DRIVE_DISC_FACTS.hormonePunk.twoPiece.atk),
    ),
    discStatInput(
      setup, 'grace', 'twoPiece', 'astralVoice',
      equipmentEffectBaseValue(DRIVE_DISC_FACTS.astralVoice.twoPiece.atk),
    ),
    effectiveSubstatInput(setup, 'grace', 'atkPct'),
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
    engineAdvancedInput(setup, 'grace', 'anomalyProficiency'),
    mainStatInput(setup, 'grace', 'slot4', 'anomalyProficiency'),
    discStatInput(
      setup, 'grace', 'fourPiece', 'chaosJazz',
      equipmentEffectBaseValue(DRIVE_DISC_FACTS.chaosJazz.twoPiece.anomalyProficiency),
      'twoPiece',
    ),
    discStatInput(
      setup, 'grace', 'fourPiece', 'freedomBlues',
      equipmentEffectBaseValue(DRIVE_DISC_FACTS.freedomBlues.twoPiece.anomalyProficiency),
      'twoPiece',
    ),
    discStatInput(
      setup, 'grace', 'twoPiece', 'chaosJazz',
      equipmentEffectBaseValue(DRIVE_DISC_FACTS.chaosJazz.twoPiece.anomalyProficiency),
    ),
    discStatInput(
      setup, 'grace', 'twoPiece', 'freedomBlues',
      equipmentEffectBaseValue(DRIVE_DISC_FACTS.freedomBlues.twoPiece.anomalyProficiency),
    ),
    effectiveSubstatInput(setup, 'grace', 'anomalyProficiency'),
  ])
  const initialProficiency = values.anomalyProficiency
    + proficiencyInputs.reduce((total, input) => total + input.rawValue, 0)
  const anomalyProficiency = composeMetricEffects(
    surfaces(initialProficiency, initialProficiency, initialProficiency),
    surfaces(proficiencyInputs.map((input) => contribution(input.source, input.rawValue)), [], []),
    baseEffects,
    'anomalyProficiency',
  )

  const masteryInputs = presentSetupInputs([
    engineAdvancedInput(setup, 'grace', 'anomalyMastery'),
    mainStatInput(setup, 'grace', 'slot6', 'anomalyMastery'),
    discStatInput(
      setup, 'grace', 'fourPiece', 'phaethonsMelody',
      equipmentEffectBaseValue(DRIVE_DISC_FACTS.phaethonsMelody.twoPiece.anomalyMastery),
      'twoPiece',
    ),
    discStatInput(
      setup, 'grace', 'twoPiece', 'phaethonsMelody',
      equipmentEffectBaseValue(DRIVE_DISC_FACTS.phaethonsMelody.twoPiece.anomalyMastery),
    ),
  ])
  const initialMastery = values.anomalyMastery * (
    1 + masteryInputs.reduce((total, input) => total + input.rawValue, 0) / 100
  )
  const anomalyMastery = composeMetricEffects(
    surfaces(initialMastery, initialMastery, initialMastery),
    surfaces(masteryInputs.map((input) => percentageContribution(
      input.source, values.anomalyMastery * input.rawValue / 100, input.rawValue,
    )), [], []),
    baseEffects,
    'anomalyMastery',
  )

  const disorderActive = setup.engineId === 'timeweaver'
    && disorderOpportunity
    && anomalyProficiency.values.fully >= 375
  const disorderEffects = resolveDeliveredClauses(active([
    additive(
      'anomalyDmgBonus', 'fully', engineSource('grace', setup),
      disorderActive
        ? equipmentEffectBaseValue(
          W_ENGINE_FACTS.timeweaver.effects.disorderDamage,
          setup.refinement,
        )
        : 0,
      'self', GRACE_DISORDER,
    ),
  ]), {})
  const effects = [...baseEffects, ...disorderEffects]

  const energyRegen = energyRegenProjection(values.baseEnergyRegen, [], effects)
  const dmgInputs = presentSetupInputs([
    mainStatInput(setup, 'grace', 'slot5', 'electricDmg'),
    discStatInput(
      setup, 'grace', 'fourPiece', 'thunderMetal',
      equipmentEffectBaseValue(DRIVE_DISC_FACTS.thunderMetal.twoPiece.damage), 'twoPiece',
    ),
  ])
  const initialDmg = dmgInputs.reduce((total, input) => total + input.rawValue, 0)
  const dmg = composeMetricEffects(
    surfaces(initialDmg, initialDmg, initialDmg),
    surfaces(dmgInputs.map((input) => contribution(input.source, input.rawValue)), [], []),
    effects,
    'dmgBonus',
  )

  const penInputs = presentSetupInputs([
    engineAdvancedInput(setup, 'grace', 'penRatio'),
    mainStatInput(setup, 'grace', 'slot5', 'penRatio'),
    discStatInput(
      setup, 'grace', 'twoPiece', 'pufferElectro',
      equipmentEffectBaseValue(DRIVE_DISC_FACTS.pufferElectro.twoPiece.penRatio),
    ),
  ])
  const initialPen = penInputs.reduce((total, input) => total + input.rawValue, 0)
  const penRatio = composeMetricEffects(
    surfaces(initialPen, initialPen, initialPen),
    surfaces(penInputs.map((input) => contribution(input.source, input.rawValue)), [], []),
    effects,
    'penRatio',
  )

  const anomalyDmgBonus = composeMetricEffects(
    surfaces(0, 0, 0), surfaces([], [], []), effects, 'anomalyDmgBonus',
  )
  const anomalyBuildupBonus = composeMetricEffects(
    surfaces(0, 0, 0), surfaces([], [], []), effects, 'anomalyBuildupBonus',
  )
  const actionModifiers: AgentResult['actionModifiers'] = [
    ...composeActionHierarchy(
      anomalyDmgBonus.values,
      effects,
      'anomalyDmgBonus',
      GRACE_ANOMALY_DAMAGE_SCOPES,
    ),
    ...composeActionHierarchy(
      anomalyBuildupBonus.values,
      effects,
      'anomalyBuildupBonus',
      GRACE_BUILDUP_SCOPES,
    ),
  ]

  const proficiencyGauge: GaugeResult | undefined = setup.engineId === 'timeweaver'
    && disorderOpportunity
    ? {
      source: engineSource('grace', setup),
      basisLabel: 'Fully Enabled Anomaly Proficiency',
      current: anomalyProficiency.values.fully,
      threshold: 375,
      cap: 375,
      outputLabel: 'Disorder DMG Bonus',
      outputValue: disorderActive
        ? equipmentEffectBaseValue(
          W_ENGINE_FACTS.timeweaver.effects.disorderDamage,
          setup.refinement,
        )
        : 0,
      outputUnit: '%',
      decimals: { current: 0, threshold: 0, cap: 0, output: 1 },
    }
    : undefined

  return {
    agentId: 'grace',
    metrics: [
      { id: 'atk', label: 'ATK', unit: '', decimals: 0, ...atk },
      {
        id: 'anomalyProficiency', label: 'Anomaly Proficiency', unit: '', decimals: 0,
        ...anomalyProficiency,
        ...(proficiencyGauge ? { gauge: proficiencyGauge } : {}),
      },
      {
        id: 'anomalyMastery', label: 'Anomaly Mastery', unit: '', decimals: 1,
        ...anomalyMastery,
      },
      {
        id: 'energyRegen', label: 'Energy Regen', unit: '', decimals: 2,
        ...energyRegen,
      },
      { id: 'dmgBonus', label: 'DMG Bonus', unit: '%', decimals: 1, ...dmg },
      {
        id: 'anomalyDmgBonus', label: 'Anomaly DMG Bonus', unit: '%', decimals: 1,
        ...anomalyDmgBonus,
      },
      {
        id: 'anomalyBuildupBonus', label: 'Anomaly Buildup Bonus', unit: '%', decimals: 1,
        ...anomalyBuildupBonus,
      },
      ...optionalMetric(
        'anomalyBuildupResReduction', 'Anomaly Buildup RES Reduction', effects,
      ),
      ...(penRatio.values.fully
        ? [{ id: 'penRatio' as const, label: 'PEN Ratio', unit: '%', decimals: 1, ...penRatio }]
        : []),
      ...optionalMetric('defIgnore', 'DEF Ignore', effects),
      ...optionalMetric('defReduction', 'DEF Reduction', effects),
      ...optionalMetric('resIgnore', 'RES Ignore', effects),
      ...optionalMetric('resReduction', 'RES Reduction', effects),
      ...optionalMetric('stunDmgMultiplier', 'Stun DMG Multiplier', effects),
    ],
    actionModifiers,
    operations: setup.mindscape >= 6
      ? [{
        id: 'graceGrenadeDmgMultiplier',
        label: 'Special/EX grenade DMG',
        source: mindscapeSource('grace', 6),
        surface: 'fully',
        value: values.mindscapeGrenadeDmgMultiplier,
        unit: '',
        presentation: 'scale',
      }]
      : [],
  }
}
