import {
  DRIVE_DISC_FACTS,
  VERTICAL_VALUES,
  W_ENGINE_FACTS,
  W_ENGINES,
  equipmentEffectBaseValue,
  equipmentEffectMaximumValue,
} from '../../content'
import { actionForm, actionTarget, canonicalAction } from '../../actions'
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
  percentage,
  presentSetupInputs,
  resolveDeliveredClauses,
  selectedDiscTwoPieceInputs,
  source,
  withApplicability,
  type CompleteSetup,
  type EffectMetric,
  type SourceBoundCurrentClause,
} from '../../effects'
import {
  composeActionHierarchy,
  composeMetricEffects,
  contribution,
  percentageContribution,
  surfaces,
  type ActionScopeNode,
} from '../composition'
import { initialAtkFor } from '../initial-atk'
import type { AgentResult, ResultMetric } from '../result'

export interface PiperCalculationContext {
  agentId: 'piper'
  setup: CompleteSetup
  additionalActive: boolean
  initialAtk: number
}

const PIPER_SPECIAL_EX = actionTarget([
  canonicalAction('Special Attack'),
  canonicalAction('EX Special Attack'),
])
const PIPER_DOWNWARD_SPECIAL_EX = actionTarget([
  actionForm('Special Attack', 'Downward smash'),
  actionForm('EX Special Attack', 'Downward smash'),
])
const PIPER_ULTIMATE = actionTarget([canonicalAction('Ultimate')])
const PIPER_M2_SCOPES = [{
  id: 'piperSpecialEx',
  target: PIPER_SPECIAL_EX,
  children: [{ id: 'piperDownwardSpecialEx', target: PIPER_DOWNWARD_SPECIAL_EX }],
}, {
  id: 'piperUltimate',
  target: PIPER_ULTIMATE,
}] satisfies readonly ActionScopeNode[]

export function observePiper(
  setup: CompleteSetup,
  additionalActive: boolean,
): PiperCalculationContext {
  const initialAtk = initialAtkFor('piper', setup)
  if (initialAtk === null) throw new Error('Complete Piper setup requires a W-Engine')
  return { agentId: 'piper', setup, additionalActive, initialAtk }
}

export function resolvePiperProviderClauses(
  context: PiperCalculationContext,
): SourceBoundCurrentClause[] {
  const { additionalActive, setup } = context
  const values = VERTICAL_VALUES.piper
  const engine = engineSource('piper', setup)
  const refinement = setup.refinement
  const powerCap = setup.mindscape >= 1
    ? values.mindscapePowerCap
    : values.basePowerCap
  const m2ActionBonus = values.mindscapeActionDmgBase
    + values.mindscapeActionDmgPerPower * powerCap

  return active([
    withApplicability(
      additive(
        'anomalyBuildupBonus', 'fully', STATIC_SOURCES.piper.core,
        values.powerBuildupPerStack * powerCap, 'self',
      ),
      { attributes: ['Physical'], formulas: ['anomaly_buildup'] },
    ),
    withApplicability(
      additive(
        'dmgBonus', 'fully', STATIC_SOURCES.piper.additional,
        additionalActive ? values.additionalDmgBonus : 0, 'all-party',
      ),
      { formulas: ['general_damage', 'sheer_damage', 'anomaly_damage'] },
    ),
    withApplicability(
      additive(
        'dmgBonus', 'fully', mindscapeSource('piper', 2, 'Downward smash'),
        setup.mindscape >= 2 ? m2ActionBonus : 0,
        'self', PIPER_DOWNWARD_SPECIAL_EX,
      ),
      { attributes: ['Physical'], formulas: ['general_damage'] },
    ),
    withApplicability(
      additive(
        'dmgBonus', 'fully', mindscapeSource('piper', 2),
        setup.mindscape >= 2 ? m2ActionBonus : 0,
        'self', PIPER_ULTIMATE,
      ),
      { attributes: ['Physical'], formulas: ['general_damage'] },
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
    withApplicability(
      additive(
        'dmgBonus', 'fully', engine,
        setup.engineId === 'practicedPerfection'
          ? equipmentEffectMaximumValue(
            W_ENGINE_FACTS.practicedPerfection.effects.physicalDamage,
            refinement,
          )
          : setup.engineId === 'sharpenedStinger'
            ? equipmentEffectMaximumValue(
              W_ENGINE_FACTS.sharpenedStinger.effects.physicalDamage,
              refinement,
            )
            : 0,
        'self',
      ),
      { attributes: ['Physical'], formulas: ['anomaly_damage'] },
    ),
    withApplicability(
      additive(
        'anomalyBuildupBonus', 'fully', engine,
        setup.engineId === 'sharpenedStinger'
          ? equipmentEffectBaseValue(
            W_ENGINE_FACTS.sharpenedStinger.effects.buildup,
            refinement,
          )
          : setup.engineId === 'roaringRide'
            ? equipmentEffectBaseValue(
              W_ENGINE_FACTS.roaringRide.effects.buildup,
              refinement,
            )
            : 0,
        'self',
      ),
      { attributes: ['Physical'], formulas: ['anomaly_buildup'] },
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
        : setup.engineId === 'roaringRide'
          ? equipmentEffectBaseValue(W_ENGINE_FACTS.roaringRide.effects.atk, refinement)
          : 0,
      'self',
    ),
    additive(
      'anomalyProficiency', 'fully', engine,
      setup.engineId === 'fusionCompiler'
        ? equipmentEffectMaximumValue(
          W_ENGINE_FACTS.fusionCompiler.effects.anomalyProficiency,
          refinement,
        )
        : setup.engineId === 'weepingGemini'
          ? equipmentEffectMaximumValue(
            W_ENGINE_FACTS.weepingGemini.effects.anomalyProficiency,
            refinement,
          )
          : setup.engineId === 'roaringRide'
            ? equipmentEffectBaseValue(
              W_ENGINE_FACTS.roaringRide.effects.anomalyProficiency,
              refinement,
            )
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
    additive(
      'dmgBonus', 'fully', source(
        'Fanged Metal', 'piper', 'disc-4pc', '4-piece · After Assault · vs target',
      ),
      setup.fourPieceId === 'fangedMetal'
        ? equipmentEffectBaseValue(DRIVE_DISC_FACTS.fangedMetal.fourPiece.assaultDamage)
        : 0,
      'self',
    ),
    withApplicability(
      additive(
        'anomalyBuildupResReduction', 'fully',
        discSource('piper', 'freedomBlues', '4-piece'),
        setup.fourPieceId === 'freedomBlues'
          ? equipmentEffectBaseValue(
            DRIVE_DISC_FACTS.freedomBlues.fourPiece.buildupResReduction,
          )
          : 0,
        'self',
      ),
      { attributes: ['Physical'], formulas: ['anomaly_buildup'] },
    ),
  ])
}

function optionalMetric(
  metricId: EffectMetric,
  label: string,
  effects: ReturnType<typeof resolveDeliveredClauses>,
): ResultMetric[] {
  const data = composeMetricEffects(
    surfaces(0, 0, 0), surfaces([], [], []), effects, metricId,
  )
  return data.values.fully
    ? [{ id: metricId, label, unit: '%', decimals: 1, ...data }]
    : []
}

export function calculatePiper(
  context: PiperCalculationContext,
  inbox: SourceBoundCurrentClause[],
  enemy: SourceBoundCurrentClause[],
): AgentResult {
  const { initialAtk, setup } = context
  const values = VERTICAL_VALUES.piper
  const baseAtk = values.atk + W_ENGINES[setup.engineId].baseAtk
  const effects = resolveDeliveredClauses([...inbox, ...enemy], { atk: initialAtk })

  const atkInputs = presentSetupInputs([
    engineAdvancedInput(setup, 'piper', 'atkPct'),
    mainStatInput(setup, 'piper', 'slot4', 'atkPct'),
    mainStatInput(setup, 'piper', 'slot5', 'atkPct'),
    mainStatInput(setup, 'piper', 'slot6', 'atkPct'),
    ...selectedDiscTwoPieceInputs(setup, 'piper', { modifier: 'atk' }),
    effectiveSubstatInput(setup, 'piper', 'atkPct'),
  ])
  const atk = composeMetricEffects(
    surfaces(initialAtk, initialAtk, initialAtk),
    surfaces(atkInputs.map((input) => percentageContribution(
      input.source, baseAtk * input.rawValue / 100, input.rawValue,
    )), [], []),
    effects,
    'atk',
  )

  const proficiencyInputs = presentSetupInputs([
    engineAdvancedInput(setup, 'piper', 'anomalyProficiency'),
    mainStatInput(setup, 'piper', 'slot4', 'anomalyProficiency'),
    ...selectedDiscTwoPieceInputs(
      setup, 'piper', { modifier: 'anomalyProficiency' },
    ),
    effectiveSubstatInput(setup, 'piper', 'anomalyProficiency'),
  ])
  const initialProficiency = values.anomalyProficiency
    + proficiencyInputs.reduce((total, input) => total + input.rawValue, 0)
  const anomalyProficiency = composeMetricEffects(
    surfaces(initialProficiency, initialProficiency, initialProficiency),
    surfaces(proficiencyInputs.map((input) => contribution(input.source, input.rawValue)), [], []),
    effects,
    'anomalyProficiency',
  )

  const masteryInputs = presentSetupInputs([
    engineAdvancedInput(setup, 'piper', 'anomalyMastery'),
    mainStatInput(setup, 'piper', 'slot6', 'anomalyMastery'),
    ...selectedDiscTwoPieceInputs(setup, 'piper', { modifier: 'anomalyMastery' }),
  ])
  const initialMastery = values.anomalyMastery * (
    1 + masteryInputs.reduce((total, input) => total + input.rawValue, 0) / 100
  )
  const anomalyMastery = composeMetricEffects(
    surfaces(initialMastery, initialMastery, initialMastery),
    surfaces(masteryInputs.map((input) => percentageContribution(
      input.source, values.anomalyMastery * input.rawValue / 100, input.rawValue,
    )), [], []),
    effects,
    'anomalyMastery',
  )

  const dmgInputs = presentSetupInputs([
    mainStatInput(setup, 'piper', 'slot5', 'physicalDmg'),
    ...selectedDiscTwoPieceInputs(
      setup, 'piper', { modifier: 'dmgBonus' },
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
    engineAdvancedInput(setup, 'piper', 'penRatio'),
    mainStatInput(setup, 'piper', 'slot5', 'penRatio'),
    ...selectedDiscTwoPieceInputs(setup, 'piper', { modifier: 'penRatio' }),
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
  const actionModifiers = composeActionHierarchy(
    dmg.values, effects, 'dmgBonus', PIPER_M2_SCOPES,
  )

  return {
    agentId: 'piper',
    metrics: [
      { id: 'atk', label: 'ATK', unit: '', decimals: 0, ...atk },
      {
        id: 'anomalyProficiency', label: 'Anomaly Proficiency', unit: '', decimals: 0,
        ...anomalyProficiency,
      },
      {
        id: 'anomalyMastery', label: 'Anomaly Mastery', unit: '', decimals: 1,
        ...anomalyMastery,
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
      ...(penRatio.values.fully
        ? [{ id: 'penRatio' as const, label: 'PEN Ratio', unit: '%', decimals: 1, ...penRatio }]
        : []),
      ...optionalMetric(
        'anomalyBuildupResReduction', 'Anomaly Buildup RES Reduction', effects,
      ),
      ...optionalMetric('defIgnore', 'DEF Ignore', effects),
      ...optionalMetric('defReduction', 'DEF Reduction', effects),
      ...optionalMetric('resIgnore', 'RES Ignore', effects),
      ...optionalMetric('resReduction', 'RES Reduction', effects),
      ...optionalMetric('stunDmgMultiplier', 'Stun DMG Multiplier', effects),
    ],
    actionModifiers,
    operations: [],
  }
}
