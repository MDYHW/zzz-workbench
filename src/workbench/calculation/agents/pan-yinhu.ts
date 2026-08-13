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
import type { AgentResult } from '../result'

export interface PanYinhuCalculationContext {
  agentId: 'panYinhu'
  setup: CompleteSetup
  initialAtk: number
  additionalActive: boolean
}

const PAN_EX_ULTIMATE = actionTarget([
  canonicalAction('EX Special Attack'),
  canonicalAction('Ultimate'),
])
const PAN_DAMAGE_SCOPES = [
  { id: 'panExUltimate', target: PAN_EX_ULTIMATE },
] satisfies readonly ActionScopeNode[]

export function observePanYinhu(
  setup: CompleteSetup,
  additionalActive: boolean,
): PanYinhuCalculationContext {
  const initialAtk = initialAtkFor('panYinhu', setup)
  if (initialAtk === null) throw new Error('Complete Pan Yinhu setup requires a W-Engine')
  return { agentId: 'panYinhu', setup, initialAtk, additionalActive }
}

function coreSheerForce(context: PanYinhuCalculationContext): number {
  const { setup, initialAtk } = context
  const values = VERTICAL_VALUES.panYinhu
  const ratio = setup.mindscape >= 6
    ? values.mindscapeCoreAtkRatio
    : values.coreAtkRatio
  const cap = setup.mindscape >= 6
    ? values.mindscapeCoreSheerCap
    : values.coreSheerCap
  return Math.min(initialAtk * ratio / 100, cap)
}

export function resolvePanYinhuProviderClauses(
  context: PanYinhuCalculationContext,
): SourceBoundCurrentClause[] {
  const { setup } = context
  const values = VERTICAL_VALUES.panYinhu
  const engine = engineSource('panYinhu', setup)
  const refinement = setup.refinement
  return active([
    withApplicability(
      additive('sheerForce', 'fully', STATIC_SOURCES.panYinhu.core,
        coreSheerForce(context), 'focus'),
      { formulas: ['sheer_damage'] },
    ),
    withApplicability(
      additive('dmgBonus', 'fully', STATIC_SOURCES.panYinhu.additional,
        context.additionalActive
          ? values.additionalDmg + (setup.mindscape >= 1 ? values.mindscapeAdditionalDmg : 0)
          : 0,
        'enemy-context'),
      { formulas: ['general_damage', 'sheer_damage'] },
    ),
    withApplicability(
      additive('dmgBonus', 'fully', engine,
        setup.engineId === 'tusksOfFury'
          ? equipmentEffectBaseValue(W_ENGINE_FACTS.tusksOfFury.effects.damage, refinement)
          : 0,
        'all-party'),
      { formulas: ['general_damage', 'sheer_damage'] },
    ),
    withApplicability(
      additive('dazeBonus', 'fully', engine,
        setup.engineId === 'tusksOfFury'
          ? equipmentEffectBaseValue(W_ENGINE_FACTS.tusksOfFury.effects.daze, refinement)
          : 0,
        'all-party'),
      { formulas: ['daze_buildup'] },
    ),
    additive('dmgBonus', 'fully', engine,
      setup.engineId === 'tremorTrigramVessel'
        ? equipmentEffectBaseValue(W_ENGINE_FACTS.tremorTrigramVessel.effects.damage, refinement)
        : 0,
      'self', PAN_EX_ULTIMATE),
    withApplicability(
      additive('dmgBonus', 'fully', discSource('panYinhu', 'bunnyInWonderland', '4-piece'),
        setup.fourPieceId === 'bunnyInWonderland'
          ? equipmentEffectMaximumValue(DRIVE_DISC_FACTS.bunnyInWonderland.fourPiece.damage)
          : 0,
        'all-party', undefined, undefined, undefined, 'bunnyInWonderland'),
      { formulas: ['general_damage', 'sheer_damage'] },
    ),
    withApplicability(
      additive('dmgBonus', 'fully', discSource('panYinhu', 'swingJazz', '4-piece'),
        setup.fourPieceId === 'swingJazz'
          ? equipmentEffectBaseValue(DRIVE_DISC_FACTS.swingJazz.fourPiece.damage)
          : 0,
        'all-party', undefined, undefined, undefined, 'swingJazz'),
      { formulas: ['general_damage', 'sheer_damage'] },
    ),
  ])
}

function atkInputs(setup: CompleteSetup): {
  percentage: ResolvedSetupInput[]
  flat?: ResolvedSetupInput
} {
  return {
    percentage: presentSetupInputs([
      engineAdvancedInput(setup, 'panYinhu', 'atkPct'),
      mainStatInput(setup, 'panYinhu', 'slot4', 'atkPct'),
      mainStatInput(setup, 'panYinhu', 'slot5', 'atkPct'),
      mainStatInput(setup, 'panYinhu', 'slot6', 'atkPct'),
      discStatInput(setup, 'panYinhu', 'fourPiece', 'astralVoice',
        equipmentEffectBaseValue(DRIVE_DISC_FACTS.astralVoice.twoPiece.atk), 'twoPiece'),
      discStatInput(setup, 'panYinhu', 'twoPiece', 'astralVoice',
        equipmentEffectBaseValue(DRIVE_DISC_FACTS.astralVoice.twoPiece.atk)),
      discStatInput(setup, 'panYinhu', 'twoPiece', 'hormonePunk',
        equipmentEffectBaseValue(DRIVE_DISC_FACTS.hormonePunk.twoPiece.atk)),
      effectiveSubstatInput(setup, 'panYinhu', 'atkPct'),
    ]),
    flat: effectiveSubstatInput(setup, 'panYinhu', 'atkFlat'),
  }
}

export function calculatePanYinhu(
  context: PanYinhuCalculationContext,
  inbox: SourceBoundCurrentClause[],
  enemy: SourceBoundCurrentClause[],
): AgentResult {
  const { setup, initialAtk } = context
  const values = VERTICAL_VALUES.panYinhu
  const effects = resolveDeliveredClauses([...inbox, ...enemy], {
    atk: initialAtk,
    impact: values.impact,
  })
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

  const impactInputs = presentSetupInputs([
    engineAdvancedInput(setup, 'panYinhu', 'impactPct'),
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
    mainStatInput(setup, 'panYinhu', 'slot6', 'energyRegenPct'),
    discStatInput(setup, 'panYinhu', 'fourPiece', 'swingJazz',
      equipmentEffectBaseValue(DRIVE_DISC_FACTS.swingJazz.twoPiece.energyRegen), 'twoPiece'),
    discStatInput(setup, 'panYinhu', 'twoPiece', 'swingJazz',
      equipmentEffectBaseValue(DRIVE_DISC_FACTS.swingJazz.twoPiece.energyRegen)),
    discStatInput(setup, 'panYinhu', 'twoPiece', 'moonlight',
      equipmentEffectBaseValue(DRIVE_DISC_FACTS.moonlight.twoPiece.energyRegen)),
  ])
  const energy = energyRegenProjection(values.baseEnergyRegen, energyInputs, effects)
  const dmg = composeMetricEffects(surfaces(0, 0, 0), surfaces([], [], []), effects, 'dmgBonus')
  const daze = composeMetricEffects(surfaces(0, 0, 0), surfaces([], [], []), effects, 'dazeBonus')

  return {
    agentId: 'panYinhu',
    metrics: [
      {
        id: 'atk', label: 'ATK', unit: '', decimals: 0, ...atk,
        gauge: {
          source: STATIC_SOURCES.panYinhu.core,
          basisLabel: 'Initial ATK',
          current: initialAtk,
          cap: 3000,
          outputLabel: 'Focus Sheer Force',
          outputValue: coreSheerForce(context),
          outputCap: setup.mindscape >= 6
            ? values.mindscapeCoreSheerCap
            : values.coreSheerCap,
          outputUnit: '',
        },
      },
      { id: 'impact', label: 'Impact', unit: '', decimals: 1, ...impact },
      { id: 'energyRegen', label: 'Energy Regen', unit: '', decimals: 2,
        values: energy.values, breakdown: energy.breakdown },
      ...(dmg.values.fully
        ? [{ id: 'dmgBonus' as const, label: 'DMG Bonus', unit: '%', decimals: 1, ...dmg }]
        : []),
      ...(daze.values.fully
        ? [{ id: 'dazeBonus' as const, label: 'Daze Bonus', unit: '%', decimals: 1, ...daze }]
        : []),
    ],
    actionModifiers: composeActionHierarchy(
      dmg.values, effects, 'dmgBonus', PAN_DAMAGE_SCOPES,
    ),
    operations: [
      ...(setup.engineId === 'tremorTrigramVessel'
        ? [{
          id: 'tremorEnergyRestore',
          label: 'Energy restored when the squad takes DMG or heals',
          source: engineSource('panYinhu', setup),
          surface: 'combat' as const,
          value: equipmentEffectBaseValue(
            W_ENGINE_FACTS.tremorTrigramVessel.effects.energy,
            setup.refinement,
          ),
          unit: '',
        }]
        : []),
      ...(setup.mindscape >= 2
        ? [{
          id: 'panBreakForceEnergy',
          label: 'Energy restored per 6 Break Force consumed',
          source: mindscapeSource('panYinhu', 2),
          surface: 'combat' as const,
          value: values.mindscapeEnergyRestore,
          unit: '',
        }]
        : []),
    ],
  }
}
