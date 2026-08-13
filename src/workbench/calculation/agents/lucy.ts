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
  engineAdvancedInput,
  engineSource,
  mainStatInput,
  mindscapeSource,
  perSecond,
  percentage,
  presentSetupInputs,
  resolveDeliveredClauses,
  withApplicability,
  type CompleteSetup,
  type ResolvedSetupInput,
  type SourceBoundCurrentClause,
} from '../../effects'
import { composeMetricEffects, energyRegenProjection, percentageContribution, surfaces } from '../composition'
import { initialAtkFor } from '../initial-atk'
import type { AgentResult } from '../result'

export interface LucyCalculationContext {
  agentId: 'lucy'
  setup: CompleteSetup
  initialAtk: number
}

function coreTier(mindscape: number) {
  const values = VERTICAL_VALUES.lucy
  const index = mindscape >= 5 ? 2 : mindscape >= 3 ? 1 : 0
  return {
    ratio: values.coreAtkRatioByMindscapeTier[index],
    base: values.coreAtkBaseByMindscapeTier[index],
  }
}

function coreAtk(context: LucyCalculationContext): number {
  const tier = coreTier(context.setup.mindscape)
  return Math.min(context.initialAtk * tier.ratio / 100 + tier.base, VERTICAL_VALUES.lucy.coreAtkOutputCap)
}

export function observeLucy(setup: CompleteSetup): LucyCalculationContext {
  const initialAtk = initialAtkFor('lucy', setup)
  if (initialAtk === null) throw new Error('Complete Lucy setup requires a W-Engine')
  return { agentId: 'lucy', setup, initialAtk }
}

export function resolveLucyProviderClauses(context: LucyCalculationContext): SourceBoundCurrentClause[] {
  const { setup } = context
  const engine = engineSource('lucy', setup)
  const refinement = setup.refinement
  return active([
    additive('atk', 'fully', STATIC_SOURCES.lucy.core, coreAtk(context), 'all-party'),
    additive('critDmg', 'fully', mindscapeSource('lucy', 4),
      setup.mindscape >= 4 ? VERTICAL_VALUES.lucy.mindscapeSquadCritDmg : 0, 'all-party'),
    percentage('atk', 'fully', engine,
      setup.engineId === 'kaboom'
        ? equipmentEffectBaseValue(W_ENGINE_FACTS.kaboom.effects.atk, refinement)
        : 0,
      'all-party', undefined, undefined, 'kaboomTheCannon'),
    withApplicability(
      additive('dmgBonus', 'fully', engine,
        setup.engineId === 'elegantVanity'
          ? equipmentEffectMaximumValue(W_ENGINE_FACTS.elegantVanity.effects.damage, refinement)
          : setup.engineId === 'weepingCradle'
            ? equipmentEffectBaseValue(W_ENGINE_FACTS.weepingCradle.effects.damage, refinement)
            : 0,
        'all-party'),
      { formulas: ['general_damage', 'sheer_damage'] },
    ),
    ...(setup.engineId === 'weepingCradle'
      ? [perSecond(engine, equipmentEffectBaseValue(W_ENGINE_FACTS.weepingCradle.effects.energy, refinement), 'self')]
      : []),
    withApplicability(
      additive('dmgBonus', 'fully', discSource('lucy', 'moonlight', '4-piece'),
        setup.fourPieceId === 'moonlight'
          ? equipmentEffectBaseValue(DRIVE_DISC_FACTS.moonlight.fourPiece.damage)
          : 0,
        'all-party', undefined, undefined, undefined, 'moonlightLullaby'),
      { formulas: ['general_damage', 'sheer_damage'] },
    ),
  ])
}

function atkInputs(setup: CompleteSetup): { percentage: ResolvedSetupInput[] } {
  return {
    percentage: presentSetupInputs([
      engineAdvancedInput(setup, 'lucy', 'atkPct'),
      mainStatInput(setup, 'lucy', 'slot4', 'atkPct'),
      mainStatInput(setup, 'lucy', 'slot5', 'atkPct'),
      mainStatInput(setup, 'lucy', 'slot6', 'atkPct'),
      discStatInput(setup, 'lucy', 'fourPiece', 'astralVoice', equipmentEffectBaseValue(DRIVE_DISC_FACTS.astralVoice.twoPiece.atk), 'twoPiece'),
      discStatInput(setup, 'lucy', 'twoPiece', 'astralVoice', equipmentEffectBaseValue(DRIVE_DISC_FACTS.astralVoice.twoPiece.atk)),
      discStatInput(setup, 'lucy', 'twoPiece', 'hormonePunk', equipmentEffectBaseValue(DRIVE_DISC_FACTS.hormonePunk.twoPiece.atk)),
    ]),
  }
}

export function calculateLucy(context: LucyCalculationContext, inbox: SourceBoundCurrentClause[]): AgentResult {
  const { setup, initialAtk } = context
  const values = VERTICAL_VALUES.lucy
  const baseAtk = values.atk + W_ENGINES[setup.engineId].baseAtk
  const effects = resolveDeliveredClauses(inbox, { atk: initialAtk })
  const inputs = atkInputs(setup)
  const atk = composeMetricEffects(
    surfaces(initialAtk, initialAtk, initialAtk),
    surfaces(inputs.percentage.map((input) => percentageContribution(
      input.source, baseAtk * input.rawValue / 100, input.rawValue,
    )), [], []),
    effects,
    'atk',
  )
  const energyInputs = presentSetupInputs([
    engineAdvancedInput(setup, 'lucy', 'energyRegenPct'),
    mainStatInput(setup, 'lucy', 'slot6', 'energyRegenPct'),
    discStatInput(setup, 'lucy', 'fourPiece', 'moonlight', equipmentEffectBaseValue(DRIVE_DISC_FACTS.moonlight.twoPiece.energyRegen), 'twoPiece'),
    discStatInput(setup, 'lucy', 'twoPiece', 'moonlight', equipmentEffectBaseValue(DRIVE_DISC_FACTS.moonlight.twoPiece.energyRegen)),
    discStatInput(setup, 'lucy', 'twoPiece', 'swingJazz', equipmentEffectBaseValue(DRIVE_DISC_FACTS.swingJazz.twoPiece.energyRegen)),
  ])
  const energy = energyRegenProjection(values.baseEnergyRegen, energyInputs, effects)
  const dmg = composeMetricEffects(surfaces(0, 0, 0), surfaces([], [], []), effects, 'dmgBonus')
  const core = coreAtk(context)
  const tier = coreTier(setup.mindscape)
  return {
    agentId: 'lucy',
    metrics: [
      {
        id: 'atk', label: 'ATK', unit: '', decimals: 0, ...atk,
        gauge: {
          source: STATIC_SOURCES.lucy.core,
          basisLabel: 'Initial ATK', current: initialAtk,
          cap: (values.coreAtkOutputCap - tier.base) / (tier.ratio / 100),
          outputLabel: 'Squad flat ATK', outputValue: core,
          outputCap: values.coreAtkOutputCap, outputUnit: '',
        },
      },
      { id: 'energyRegen', label: 'Energy Regen', unit: '/s', decimals: 2, values: energy.values, breakdown: energy.breakdown },
      ...(dmg.values.fully
        ? [{ id: 'dmgBonus' as const, label: 'DMG Bonus', unit: '%', decimals: 1, ...dmg }]
        : []),
    ],
    actionModifiers: [],
    operations: [],
  }
}
