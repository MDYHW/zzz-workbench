import {
  DRIVE_DISC_FACTS,
  VERTICAL_VALUES,
  W_ENGINE_FACTS,
  W_ENGINES,
  scaledEngineValue,
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
  resolveDeliveredClauses,
  source,
  type CompleteSetup,
  type ResolvedSetupInput,
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

const damageRecipients = ['yixuan', 'anbySoldier0', 'trigger'] as const
const atkRecipients = ['yixuan', 'anbySoldier0', 'trigger'] as const
const stunRecipients = ['dialyn', 'trigger'] as const

export interface AstraCalculationContext {
  agentId: 'astraYao'
  setup: CompleteSetup
  initialAtk: number
}

function presentInputs(inputs: Array<ResolvedSetupInput | undefined>): ResolvedSetupInput[] {
  return inputs.filter((input): input is ResolvedSetupInput => input !== undefined)
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
  const initialInputs = presentInputs([
    engineAdvancedInput(setup, 'astraYao', 'atkPct'),
    discStatInput(setup, 'astraYao', 'fourPiece', 'astralVoice', DRIVE_DISC_FACTS.astralVoice.atkPct, 'twoPiece'),
    discStatInput(setup, 'astraYao', 'twoPiece', 'hormonePunk', DRIVE_DISC_FACTS.hormonePunk.atkPct),
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
    additive('atk', 'fully', STATIC_SOURCES.astraYao.core, coreAt(initialAtk, setup.mindscape), 'all-party', undefined, undefined, [...atkRecipients]),
    additive('dmgBonus', 'fully', cadenzaSource, cadenza.dmg, 'all-party', undefined, undefined, [...damageRecipients]),
    additive('critDmg', 'fully', cadenzaSource, cadenza.critDmg, 'all-party', undefined, undefined, [...damageRecipients]),
    additive('resReduction', 'fully', mindscapeSource('astraYao', 1, '3 stacks'), setup.mindscape >= 1 ? 18 : 0, 'enemy-context', undefined, undefined, [...damageRecipients]),
    additive('dazeBonus', 'fully', mindscapeSource('astraYao', 4, 'Next Quick Assist'), setup.mindscape >= 4 ? 50 : 0, 'all-party', 'triggerQuickAssist', undefined, [...stunRecipients]),
    additive('dmgBonus', 'fully', engine, setup.engineId === 'elegantVanity' ? scaledEngineValue(W_ENGINE_FACTS.elegantVanity.dmgPerStack, refinement) * 2 : 0, 'all-party', undefined, undefined, [...damageRecipients]),
    additive('dmgBonus', 'fully', discSource('astraYao', 'astralVoice', '4-piece'), setup.fourPieceId === 'astralVoice' ? DRIVE_DISC_FACTS.astralVoice.entrantDmg : 0, 'all-party', undefined, undefined, [...damageRecipients]),
    percentage('atk', 'fully', engine, setup.engineId === 'bashfulDemon'
      ? scaledEngineValue(W_ENGINE_FACTS.bashfulDemon.atkPctPerStack, refinement) * 4
      : setup.engineId === 'kaboom'
        ? scaledEngineValue(W_ENGINE_FACTS.kaboom.squadAtkPct, refinement)
        : 0, 'all-party', [...damageRecipients]),
  ])
}

export function calculateAstra(
  context: AstraCalculationContext,
  inbox: SourceBoundCurrentClause[],
): AgentResult {
  const { setup, initialAtk } = context
  const engine = W_ENGINES[setup.engineId]
  const baseAtk = VERTICAL_VALUES.astraYao.atk + engine.baseAtk
  const initialAtkInputs = presentInputs([
    engineAdvancedInput(setup, 'astraYao', 'atkPct'),
    discStatInput(setup, 'astraYao', 'fourPiece', 'astralVoice', DRIVE_DISC_FACTS.astralVoice.atkPct, 'twoPiece'),
    discStatInput(setup, 'astraYao', 'twoPiece', 'hormonePunk', DRIVE_DISC_FACTS.hormonePunk.atkPct),
    mainStatInput(setup, 'astraYao', 'slot4', 'atkPct'),
    mainStatInput(setup, 'astraYao', 'slot5', 'atkPct'),
    mainStatInput(setup, 'astraYao', 'slot6', 'atkPct'),
    effectiveSubstatInput(setup, 'astraYao', 'atkPct'),
  ])
  const flatAtkInput = effectiveSubstatInput(setup, 'astraYao', 'atkFlat')
  const effects = resolveDeliveredClauses(inbox, {})
  const energyInputs = presentInputs([
    engineAdvancedInput(setup, 'astraYao', 'energyRegenPct'),
    mainStatInput(setup, 'astraYao', 'slot6', 'energyRegenPct'),
    discStatInput(setup, 'astraYao', 'twoPiece', 'moonlight', DRIVE_DISC_FACTS.moonlight.energyRegenPct),
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
    operations: setup.engineId === 'elegantVanity'
      ? [{ id: 'elegantVanityEnergy', label: 'Energy', source: engineSource('astraYao', setup), surface: 'fully', value: 5, unit: '' }]
      : [],
  }
}
