import {
  DRIVE_DISC_FACTS,
  VERTICAL_VALUES,
  W_ENGINE_FACTS,
  W_ENGINES,
  equipmentEffectBaseValue,
  equipmentEffectMaximumValue,
  type SetupFormulaFamily,
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
  source,
  withApplicability,
  type CompleteSetup,
  type SourceBoundCurrentClause,
} from '../../effects'
import {
  contribution,
  composeMetricEffects,
  energyRegenProjection,
  percentageContribution,
  surfaces,
} from '../composition'
import type { AgentResult } from '../result'
import { TRIGGER_QUICK_ASSIST_TARGET } from './trigger'

const stunRecipients = ['dialyn', 'trigger'] as const
const damageFormulas: readonly SetupFormulaFamily[] = [
  'general_damage',
  'sheer_damage',
]

export interface AstraCalculationContext {
  agentId: 'astraYao'
  setup: CompleteSetup
  initialAtk: number
}

function cadenzaAt(mindscape: number): { dmg: number; critDmg: number; level: 12 | 14 | 16 } {
  if (mindscape >= 5) return { dmg: 24, critDmg: 31, level: 16 }
  if (mindscape >= 3) return { dmg: 22, critDmg: 28, level: 14 }
  return { dmg: 20, critDmg: 25, level: 12 }
}

function coreAt(initialAtk: number, mindscape: number): number {
  const ratio = mindscape >= 2 ? 0.54 : 0.35
  const cap = mindscape >= 2 ? 1600 : 1200
  return Math.min(initialAtk * ratio, cap)
}

export function observeAstra(setup: CompleteSetup): AstraCalculationContext {
  const engine = W_ENGINES[setup.engineId]
  const initialInputs = presentSetupInputs([
    engineAdvancedInput(setup, 'astraYao', 'atkPct'),
    discStatInput(setup, 'astraYao', 'fourPiece', 'astralVoice', equipmentEffectBaseValue(DRIVE_DISC_FACTS.astralVoice.twoPiece.atk), 'twoPiece'),
    discStatInput(setup, 'astraYao', 'twoPiece', 'astralVoice', equipmentEffectBaseValue(DRIVE_DISC_FACTS.astralVoice.twoPiece.atk)),
    discStatInput(setup, 'astraYao', 'twoPiece', 'hormonePunk', equipmentEffectBaseValue(DRIVE_DISC_FACTS.hormonePunk.twoPiece.atk)),
    mainStatInput(setup, 'astraYao', 'slot4', 'atkPct'),
    mainStatInput(setup, 'astraYao', 'slot5', 'atkPct'),
    mainStatInput(setup, 'astraYao', 'slot6', 'atkPct'),
    effectiveSubstatInput(setup, 'astraYao', 'atkPct'),
  ])
  const baseAtk = VERTICAL_VALUES.astraYao.atk + engine.baseAtk
  const initialAtk = baseAtk * (1 + initialInputs.reduce(
    (total, input) => total + input.rawValue,
    0,
  ) / 100) + 316 + (effectiveSubstatInput(setup, 'astraYao', 'atkFlat')?.rawValue ?? 0)

  return { agentId: 'astraYao', setup, initialAtk }
}

export function resolveAstraProviderClauses(
  context: AstraCalculationContext,
): SourceBoundCurrentClause[] {
  const { setup, initialAtk } = context
  const engine = engineSource('astraYao', setup)
  const cadenza = cadenzaAt(setup.mindscape)
  const cadenzaSource = source(
    STATIC_SOURCES.astraYao.cadenza.label,
    'astraYao',
    'special',
    `Idyllic Cadenza · level ${cadenza.level}`,
  )
  const refinement = setup.refinement

  return active([
    withApplicability(
      additive('atk', 'fully', STATIC_SOURCES.astraYao.core, coreAt(initialAtk, setup.mindscape), 'all-party'),
      { formulas: damageFormulas },
    ),
    withApplicability(
      additive('dmgBonus', 'fully', cadenzaSource, cadenza.dmg, 'all-party'),
      { formulas: damageFormulas },
    ),
    withApplicability(
      additive('critDmg', 'fully', cadenzaSource, cadenza.critDmg, 'all-party'),
      { formulas: damageFormulas },
    ),
    withApplicability(
      additive('resReduction', 'fully', mindscapeSource('astraYao', 1, '3 stacks'), setup.mindscape >= 1 ? 18 : 0, 'enemy-context'),
      { formulas: damageFormulas },
    ),
    additive('dazeBonus', 'fully', mindscapeSource('astraYao', 4, 'Next Quick Assist'), setup.mindscape >= 4 ? 50 : 0, 'all-party', TRIGGER_QUICK_ASSIST_TARGET, undefined, [...stunRecipients]),
    withApplicability(
      additive('dmgBonus', 'fully', engine, setup.engineId === 'elegantVanity' ? equipmentEffectMaximumValue(W_ENGINE_FACTS.elegantVanity.effects.damage, refinement) : 0, 'all-party'),
      { formulas: damageFormulas },
    ),
    withApplicability(
      additive('dmgBonus', 'fully', discSource('astraYao', 'moonlight', '4-piece'), setup.fourPieceId === 'moonlight' ? equipmentEffectBaseValue(DRIVE_DISC_FACTS.moonlight.fourPiece.damage) : 0, 'all-party', undefined, undefined, undefined, 'moonlightLullaby'),
      { formulas: damageFormulas },
    ),
    withApplicability(
      percentage('atk', 'fully', engine, setup.engineId === 'bashfulDemon'
        ? equipmentEffectMaximumValue(W_ENGINE_FACTS.bashfulDemon.effects.atk, refinement)
        : setup.engineId === 'kaboom'
          ? equipmentEffectBaseValue(W_ENGINE_FACTS.kaboom.effects.atk, refinement)
          : 0, 'all-party'),
      { formulas: damageFormulas },
    ),
  ])
}

export function calculateAstra(
  context: AstraCalculationContext,
  inbox: SourceBoundCurrentClause[],
): AgentResult {
  const { setup, initialAtk } = context
  const engine = W_ENGINES[setup.engineId]
  const baseAtk = VERTICAL_VALUES.astraYao.atk + engine.baseAtk
  const initialAtkInputs = presentSetupInputs([
    engineAdvancedInput(setup, 'astraYao', 'atkPct'),
    discStatInput(setup, 'astraYao', 'fourPiece', 'astralVoice', equipmentEffectBaseValue(DRIVE_DISC_FACTS.astralVoice.twoPiece.atk), 'twoPiece'),
    discStatInput(setup, 'astraYao', 'twoPiece', 'astralVoice', equipmentEffectBaseValue(DRIVE_DISC_FACTS.astralVoice.twoPiece.atk)),
    discStatInput(setup, 'astraYao', 'twoPiece', 'hormonePunk', equipmentEffectBaseValue(DRIVE_DISC_FACTS.hormonePunk.twoPiece.atk)),
    mainStatInput(setup, 'astraYao', 'slot4', 'atkPct'),
    mainStatInput(setup, 'astraYao', 'slot5', 'atkPct'),
    mainStatInput(setup, 'astraYao', 'slot6', 'atkPct'),
    effectiveSubstatInput(setup, 'astraYao', 'atkPct'),
  ])
  const flatAtkInput = effectiveSubstatInput(setup, 'astraYao', 'atkFlat')
  const effects = resolveDeliveredClauses(inbox, {})
  const energyInputs = presentSetupInputs([
    engineAdvancedInput(setup, 'astraYao', 'energyRegenPct'),
    mainStatInput(setup, 'astraYao', 'slot6', 'energyRegenPct'),
    discStatInput(setup, 'astraYao', 'fourPiece', 'moonlight', equipmentEffectBaseValue(DRIVE_DISC_FACTS.moonlight.twoPiece.energyRegen), 'twoPiece'),
    discStatInput(setup, 'astraYao', 'twoPiece', 'moonlight', equipmentEffectBaseValue(DRIVE_DISC_FACTS.moonlight.twoPiece.energyRegen)),
    discStatInput(setup, 'astraYao', 'twoPiece', 'swingJazz', equipmentEffectBaseValue(DRIVE_DISC_FACTS.swingJazz.twoPiece.energyRegen)),
  ])
  const energy = energyRegenProjection(VERTICAL_VALUES.astraYao.baseEnergyRegen, energyInputs, effects)
  // Astra's Core output is shown in the gauge and distributed to recipients; it
  // does not feed back into Astra's own displayed ATK surface.
  const atk = composeMetricEffects(
    surfaces(initialAtk, initialAtk, initialAtk),
    surfaces([
      ...initialAtkInputs.map((input) => percentageContribution(
        input.source,
        baseAtk * input.rawValue / 100,
        input.rawValue,
      )),
      ...(flatAtkInput ? [contribution(flatAtkInput.source, flatAtkInput.rawValue)] : []),
    ], [], []),
    effects,
    'atk',
  )
  const core = coreAt(initialAtk, setup.mindscape)
  const coreCap = setup.mindscape >= 2 ? 1600 : 1200

  return {
    agentId: 'astraYao',
    metrics: [
      {
        id: 'atk',
        label: 'ATK',
        unit: '',
        decimals: 0,
        ...atk,
        gauge: {
          source: STATIC_SOURCES.astraYao.core,
          basisLabel: 'Initial ATK',
          current: initialAtk,
          cap: coreCap / (setup.mindscape >= 2 ? 0.54 : 0.35),
          outputLabel: 'Core flat ATK',
          outputValue: core,
          outputCap: coreCap,
          outputUnit: '',
        },
      },
      { id: 'energyRegen', label: 'Energy Regen', unit: '', decimals: 2, values: energy.values, breakdown: energy.breakdown },
    ],
    actionModifiers: [],
    operations: [],
  }
}
