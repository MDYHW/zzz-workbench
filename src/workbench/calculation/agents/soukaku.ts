import {
  DRIVE_DISC_FACTS,
  VERTICAL_VALUES,
  W_ENGINE_FACTS,
  W_ENGINES,
  equipmentEffectBaseValue,
} from '../../content'
import {
  STATIC_SOURCES,
  active,
  additive,
  discSource,
  selectedDiscTwoPieceInputs,
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
import { energyRegenProjection, composeMetricEffects, contribution, percentageContribution, surfaces } from '../composition'
import { initialAtkFor } from '../initial-atk'
import type { AgentResult } from '../result'

export interface SoukakuCalculationContext {
  agentId: 'soukaku'
  setup: CompleteSetup
  additionalActive: boolean
  initialAtk: number
}

export function observeSoukaku(setup: CompleteSetup, additionalActive: boolean): SoukakuCalculationContext {
  const initialAtk = initialAtkFor('soukaku', setup)
  if (initialAtk === null) throw new Error('Complete Soukaku setup requires a W-Engine')
  return { agentId: 'soukaku', setup, additionalActive, initialAtk }
}

function coreAtk(context: SoukakuCalculationContext): number {
  const values = VERTICAL_VALUES.soukaku
  return Math.min(context.initialAtk * values.coreAtkRatio / 100, values.coreOutputCap)
}

export function resolveSoukakuProviderClauses(context: SoukakuCalculationContext): SourceBoundCurrentClause[] {
  const { setup } = context
  const values = VERTICAL_VALUES.soukaku
  const engine = engineSource('soukaku', setup)
  const refinement = setup.refinement
  return active([
    additive('atk', 'fully', STATIC_SOURCES.soukaku.core, coreAtk(context), 'focus'),
    withApplicability(
      additive('dmgBonus', 'fully', STATIC_SOURCES.soukaku.additional,
        context.additionalActive ? values.additionalIceDmg : 0, 'all-party'),
      { attributes: ['Ice'] },
    ),
    withApplicability(
      additive('resReduction', 'fully', mindscapeSource('soukaku', 4),
        setup.mindscape >= 4 ? values.mindscapeIceResReduction : 0, 'enemy-context'),
      { attributes: ['Ice'] },
    ),
    percentage('atk', 'fully', engine,
      setup.engineId === 'kaboom' ? equipmentEffectBaseValue(W_ENGINE_FACTS.kaboom.effects.atk, refinement) : 0,
      'all-party', undefined, undefined, 'kaboomTheCannon'),
    withApplicability(
      additive('dmgBonus', 'fully', engine,
        setup.engineId === 'weepingCradle' ? equipmentEffectBaseValue(W_ENGINE_FACTS.weepingCradle.effects.damage, refinement) : 0,
        'all-party'),
      { formulas: ['general_damage', 'sheer_damage'] },
    ),
    ...(setup.engineId === 'weepingCradle'
      ? [perSecond(engine, equipmentEffectBaseValue(W_ENGINE_FACTS.weepingCradle.effects.energy, refinement), 'self')]
      : []),
    withApplicability(
      additive('dmgBonus', 'fully', discSource('soukaku', 'moonlight', '4-piece'),
        setup.fourPieceId === 'moonlight' ? equipmentEffectBaseValue(DRIVE_DISC_FACTS.moonlight.fourPiece.damage) : 0,
        'all-party', undefined, undefined, undefined, 'moonlightLullaby'),
      { formulas: ['general_damage', 'sheer_damage'] },
    ),
  ])
}

function atkInputs(setup: CompleteSetup): { percentage: ResolvedSetupInput[]; flat?: ResolvedSetupInput } {
  return {
    percentage: presentSetupInputs([
      engineAdvancedInput(setup, 'soukaku', 'atkPct'), mainStatInput(setup, 'soukaku', 'slot4', 'atkPct'), mainStatInput(setup, 'soukaku', 'slot5', 'atkPct'), mainStatInput(setup, 'soukaku', 'slot6', 'atkPct'),
      ...selectedDiscTwoPieceInputs(setup, 'soukaku', { modifier: 'atk' }),
      effectiveSubstatInput(setup, 'soukaku', 'atkPct'),
    ]),
    flat: effectiveSubstatInput(setup, 'soukaku', 'atkFlat'),
  }
}

export function calculateSoukaku(context: SoukakuCalculationContext, inbox: SourceBoundCurrentClause[]): AgentResult {
  const { setup, initialAtk } = context
  const values = VERTICAL_VALUES.soukaku
  const baseAtk = values.atk + W_ENGINES[setup.engineId].baseAtk
  const effects = resolveDeliveredClauses(inbox, { atk: initialAtk })
  const inputs = atkInputs(setup)
  const atk = composeMetricEffects(
    surfaces(initialAtk, initialAtk, initialAtk),
    surfaces([
      ...inputs.percentage.map((input) => percentageContribution(input.source, baseAtk * input.rawValue / 100, input.rawValue)),
      ...(inputs.flat ? [contribution(inputs.flat.source, inputs.flat.rawValue)] : []),
    ], [], []), effects, 'atk',
  )
  const energyInputs = presentSetupInputs([
    engineAdvancedInput(setup, 'soukaku', 'energyRegenPct'), mainStatInput(setup, 'soukaku', 'slot6', 'energyRegenPct'),
    ...selectedDiscTwoPieceInputs(setup, 'soukaku', { modifier: 'energyRegen' }),
  ])
  const energy = energyRegenProjection(values.baseEnergyRegen, energyInputs, effects)
  return {
    agentId: 'soukaku',
    metrics: [
      { id: 'atk', label: 'ATK', unit: '', decimals: 0, ...atk, gauge: {
        source: STATIC_SOURCES.soukaku.core, basisLabel: 'Initial ATK', current: initialAtk,
        cap: values.coreAtkCap, outputLabel: 'Focus flat ATK', outputValue: coreAtk(context), outputCap: values.coreOutputCap, outputUnit: '',
      } },
      { id: 'energyRegen', label: 'Energy Regen', unit: '', decimals: 2, values: energy.values, breakdown: energy.breakdown },
    ], actionModifiers: [], operations: [],
  }
}
