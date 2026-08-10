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
  resolveDeliveredClauses,
  withApplicability,
  type CompleteSetup,
  type EffectMetric,
  type ResolvedSetupInput,
  type SourceBoundCurrentClause,
} from '../../effects'
import {
  composeActionEffects,
  composeMetricEffects,
  contribution,
  energyRegenProjection,
  percentageContribution,
  surfaces,
} from '../composition'
import type { AgentResult } from '../result'

export interface CissiaCalculationContext {
  agentId: 'cissia'
  setup: CompleteSetup
  initialAtk: number
  initialEnergyRegen: number
}

function presentInputs(inputs: Array<ResolvedSetupInput | undefined>): ResolvedSetupInput[] {
  return inputs.filter((input): input is ResolvedSetupInput => input !== undefined)
}

function cissiaAtkInputs(setup: CompleteSetup): ResolvedSetupInput[] {
  return presentInputs([
    engineAdvancedInput(setup, 'cissia', 'atkPct'),
    mainStatInput(setup, 'cissia', 'slot5', 'atkPct'),
    mainStatInput(setup, 'cissia', 'slot6', 'atkPct'),
    discStatInput(setup, 'cissia', 'fourPiece', 'astralVoice', DRIVE_DISC_FACTS.astralVoice.atkPct, 'twoPiece'),
    discStatInput(setup, 'cissia', 'twoPiece', 'astralVoice', DRIVE_DISC_FACTS.astralVoice.atkPct),
    effectiveSubstatInput(setup, 'cissia', 'atkPct'),
  ])
}

function cissiaEnergyInputs(setup: CompleteSetup): ResolvedSetupInput[] {
  return presentInputs([
    engineAdvancedInput(setup, 'cissia', 'energyRegenPct'),
    mainStatInput(setup, 'cissia', 'slot6', 'energyRegenPct'),
    discStatInput(setup, 'cissia', 'twoPiece', 'swingJazz', DRIVE_DISC_FACTS.swingJazz.energyRegenPct),
  ])
}

export function observeCissia(setup: CompleteSetup): CissiaCalculationContext {
  const baseAtk = VERTICAL_VALUES.cissia.atk + W_ENGINES[setup.engineId].baseAtk
  const initialAtk = baseAtk * (1 + cissiaAtkInputs(setup).reduce(
    (total, input) => total + input.rawValue,
    0,
  ) / 100) + VERTICAL_VALUES.fixedDisc.atk
  const initialEnergyRegen = VERTICAL_VALUES.cissia.baseEnergyRegen * (
    1 + cissiaEnergyInputs(setup).reduce((total, input) => total + input.rawValue, 0) / 100
  )
  return { agentId: 'cissia', setup, initialAtk, initialEnergyRegen }
}

function cissiaCoreDefIgnore(
  initialEnergyRegen: number,
  mindscape: CompleteSetup['mindscape'],
): number {
  const capped = Math.min(
    25,
    6 + Math.max(initialEnergyRegen - 1.4, 0) / 0.12,
  )
  return capped * (mindscape >= 1 ? 1.4 : 1)
}

function dawnClauses(setup: CompleteSetup): SourceBoundCurrentClause[] {
  if (setup.fourPieceId !== 'dawnsBloom') return []
  const initial = DRIVE_DISC_FACTS.dawnsBloom.basicDmg.initial
  const combat = DRIVE_DISC_FACTS.dawnsBloom.basicDmg.combat
  const fully = DRIVE_DISC_FACTS.dawnsBloom.basicDmg.fully
  const twoPiece = discSource('cissia', 'dawnsBloom', '2-piece', '4-piece')
  const fourPiece = discSource('cissia', 'dawnsBloom', '4-piece')
  return [
    additive('dmgBonus', 'initial', twoPiece, initial, 'self', 'cissiaCorrode'),
    additive('dmgBonus', 'initial', twoPiece, initial, 'self', 'cissiaSerpent'),
    additive('dmgBonus', 'combat', fourPiece, combat, 'self', 'cissiaCorrode'),
    additive('dmgBonus', 'combat', fourPiece, combat, 'self', 'cissiaSerpent'),
    additive('dmgBonus', 'fully', fourPiece, fully, 'self', 'cissiaCorrode'),
    additive('dmgBonus', 'fully', fourPiece, fully, 'self', 'cissiaSerpent'),
  ]
}

export function resolveCissiaProviderClauses(
  context: CissiaCalculationContext,
  party: { electricAgentCount: number; additionalActive: boolean },
): SourceBoundCurrentClause[] {
  const { setup } = context
  const engine = engineSource('cissia', setup)
  const refinement = setup.refinement
  const cordisDmg = setup.engineId === 'cordisGermina'
    ? scaledEngineValue(W_ENGINE_FACTS.cordisGermina.electricDmgPerStack * 2, refinement)
    : 0
  const cordisDefIgnore = setup.engineId === 'cordisGermina'
    ? scaledEngineValue(W_ENGINE_FACTS.cordisGermina.defIgnore, refinement)
    : 0
  const drillDmg = setup.engineId === 'drillRigRedAxis'
    ? W_ENGINE_FACTS.drillRigRedAxis.basicDashElectricDmg[refinement - 1]
    : 0
  const coreDefIgnore = cissiaCoreDefIgnore(context.initialEnergyRegen, setup.mindscape)
  const electricGeneral = (clause: SourceBoundCurrentClause) => withApplicability(
    clause,
    { attributes: ['Electric'], formulas: ['general_damage'] },
  )
  const critRecipients = (clause: SourceBoundCurrentClause) => withApplicability(
    clause,
    { formulas: ['general_damage', 'sheer_damage'] },
  )
  return active([
    electricGeneral(additive('defIgnore', 'combat', STATIC_SOURCES.cissia.core,
      coreDefIgnore, 'enemy-context', undefined, {
        value: coreDefIgnore,
        unit: '%',
        decimals: 3,
      })),
    additive('critRate', 'fully', STATIC_SOURCES.cissia.basic, 18, 'self'),
    additive('dazeBonus', 'fully', STATIC_SOURCES.cissia.basic,
      party.electricAgentCount >= 2 ? 60 : 40, 'self', 'cissiaCorrode'),
    critRecipients(additive('critDmg', 'combat', STATIC_SOURCES.cissia.additional,
      party.additionalActive ? 40 : 0, 'all-party')),
    additive('critDmg', 'combat', STATIC_SOURCES.cissia.additional,
      party.additionalActive ? 10 : 0, 'self'),
    critRecipients(additive('critDmg', 'fully', STATIC_SOURCES.cissia.ultimate,
      5, 'all-party')),
    electricGeneral(additive('resIgnore', 'combat', mindscapeSource('cissia', 1),
      setup.mindscape >= 1 ? 5 : 0, 'enemy-context')),
    electricGeneral(additive('resIgnore', 'fully', mindscapeSource('cissia', 1, 'Corrode Bone'),
      setup.mindscape >= 1 ? 10 : 0, 'enemy-context', 'cissiaCorrode', undefined, ['cissia'])),
    additive('dmgBonus', 'fully', mindscapeSource('cissia', 2, "Serpent's Kiss"),
      setup.mindscape >= 2 ? 35 : 0, 'self', 'cissiaSerpent'),
    additive('critRate', 'combat', engine, setup.engineId === 'serpentineSeeker'
      ? W_ENGINE_FACTS.serpentineSeeker.critRate[refinement - 1]
      : setup.engineId === 'cordisGermina'
        ? scaledEngineValue(W_ENGINE_FACTS.cordisGermina.critRate, refinement)
        : 0, 'self'),
    additive('defIgnore', 'combat', engine, setup.engineId === 'serpentineSeeker'
      ? W_ENGINE_FACTS.serpentineSeeker.electricDefIgnore[refinement - 1]
      : 0, 'enemy-context', undefined, undefined, ['cissia']),
    additive('dmgBonus', 'fully', engine, drillDmg + cordisDmg, 'self', 'cissiaCorrode'),
    additive('dmgBonus', 'fully', engine, drillDmg + cordisDmg, 'self', 'cissiaSerpent'),
    additive('defIgnore', 'fully', engine, cordisDefIgnore, 'enemy-context', 'cissiaCorrode', undefined, ['cissia']),
    additive('defIgnore', 'fully', engine, cordisDefIgnore, 'enemy-context', 'cissiaSerpent', undefined, ['cissia']),
    critRecipients(additive('dmgBonus', 'fully', discSource('cissia', 'astralVoice', '4-piece'),
      setup.fourPieceId === 'astralVoice' ? DRIVE_DISC_FACTS.astralVoice.entrantDmg : 0,
      'all-party', undefined, undefined, undefined, 'astralVoiceEntrant')),
    ...dawnClauses(setup),
  ])
}

function optionalMetric(
  metric: EffectMetric,
  id: string,
  label: string,
  effects: ReturnType<typeof resolveDeliveredClauses>,
  decimals = 1,
) {
  const data = composeMetricEffects(surfaces(0, 0, 0), surfaces([], [], []), effects, metric)
  return data.values.fully === 0 ? [] : [{ id, label, unit: '%', decimals, ...data }]
}

export function calculateCissia(
  context: CissiaCalculationContext,
  inbox: SourceBoundCurrentClause[],
  enemy: SourceBoundCurrentClause[],
): AgentResult {
  const { setup, initialAtk } = context
  const baseAtk = VERTICAL_VALUES.cissia.atk + W_ENGINES[setup.engineId].baseAtk
  const atkInputs = cissiaAtkInputs(setup)
  const effects = resolveDeliveredClauses([...inbox, ...enemy], { atk: initialAtk })
  const atk = composeMetricEffects(
    surfaces(initialAtk, initialAtk, initialAtk),
    surfaces(atkInputs.map((input) => percentageContribution(
      input.source,
      baseAtk * input.rawValue / 100,
      input.rawValue,
    )), [], []),
    effects,
    'atk',
  )
  const critRateInputs = presentInputs([
    engineAdvancedInput(setup, 'cissia', 'critRate'),
    mainStatInput(setup, 'cissia', 'slot4', 'critRate'),
    discStatInput(setup, 'cissia', 'twoPiece', 'woodpecker', DRIVE_DISC_FACTS.woodpecker.critRate),
    effectiveSubstatInput(setup, 'cissia', 'critRate'),
  ])
  const initialCritRate = VERTICAL_VALUES.cissia.critRate + critRateInputs.reduce((total, input) => total + input.rawValue, 0)
  const critRate = composeMetricEffects(
    surfaces(Math.min(initialCritRate, 100), Math.min(initialCritRate, 100), Math.min(initialCritRate, 100)),
    surfaces(critRateInputs.map((input) => contribution(input.source, input.rawValue)), [], []),
    effects,
    'critRate',
    { value: 100, source: STATIC_SOURCES.cissia.critCap },
  )
  const critDmgInputs = presentInputs([
    engineAdvancedInput(setup, 'cissia', 'critDmg'),
    mainStatInput(setup, 'cissia', 'slot4', 'critDmg'),
    discStatInput(setup, 'cissia', 'twoPiece', 'branchAndBlade', DRIVE_DISC_FACTS.branchAndBlade.critDmg),
    effectiveSubstatInput(setup, 'cissia', 'critDmg'),
  ])
  const initialCritDmg = VERTICAL_VALUES.cissia.critDmg + critDmgInputs.reduce((total, input) => total + input.rawValue, 0)
  const critDmg = composeMetricEffects(
    surfaces(initialCritDmg, initialCritDmg, initialCritDmg),
    surfaces(critDmgInputs.map((input) => contribution(input.source, input.rawValue)), [], []),
    effects,
    'critDmg',
  )
  const energy = energyRegenProjection(VERTICAL_VALUES.cissia.baseEnergyRegen, cissiaEnergyInputs(setup), effects)
  const electricDmg = mainStatInput(setup, 'cissia', 'slot5', 'electricDmg')
  const regular = composeMetricEffects(
    surfaces(electricDmg?.rawValue ?? 0, electricDmg?.rawValue ?? 0, electricDmg?.rawValue ?? 0),
    surfaces(electricDmg ? [contribution(electricDmg.source, electricDmg.rawValue)] : [], [], []),
    effects,
    'dmgBonus',
  )
  const actionNames = [
    ['cissiaCorrode', 'Corrode Bone'],
    ['cissiaSerpent', "Serpent's Kiss"],
  ] as const
  const differsFromParent = (values: typeof regular.values) => (
    values.initial !== regular.values.initial
    || values.combat !== regular.values.combat
    || values.fully !== regular.values.fully
  )
  const broadDefIgnore = composeMetricEffects(surfaces(0, 0, 0), surfaces([], [], []), effects, 'defIgnore')
  const broadResIgnore = composeMetricEffects(surfaces(0, 0, 0), surfaces([], [], []), effects, 'resIgnore')
  const dazeBonus = composeMetricEffects(surfaces(0, 0, 0), surfaces([], [], []), effects, 'dazeBonus')
  const actionModifiers: AgentResult['actionModifiers'] = actionNames.flatMap(([actionId, label]) => {
    const damage = composeActionEffects(regular.values, effects, 'dmgBonus', actionId)
    const defIgnore = composeActionEffects(broadDefIgnore.values, effects, 'defIgnore', actionId)
    const resIgnore = composeActionEffects(broadResIgnore.values, effects, 'resIgnore', actionId)
    const dazeBonus = composeActionEffects(surfaces(0, 0, 0), effects, 'dazeBonus', actionId)
    return [
      ...(differsFromParent(damage.values) ? [{ id: actionId, actions: [label], metricId: 'dmgBonus', ...damage }] : []),
      ...(defIgnore.values.fully !== broadDefIgnore.values.fully ? [{ id: `${actionId}DefIgnore`, actions: [label], metricId: 'defIgnore', ...defIgnore }] : []),
      ...(resIgnore.values.fully !== broadResIgnore.values.fully ? [{ id: `${actionId}ResIgnore`, actions: [label], metricId: 'resIgnore', ...resIgnore }] : []),
      ...(dazeBonus.values.fully ? [{ id: `${actionId}Daze`, actions: [label], metricId: 'dazeBonus', ...dazeBonus }] : []),
    ]
  })

  return {
    agentId: 'cissia',
    metrics: [
      { id: 'atk', label: 'ATK', unit: '', decimals: 0, ...atk },
      { id: 'critRate', label: 'CRIT Rate', unit: '%', decimals: 1, ...critRate },
      { id: 'critDmg', label: 'CRIT DMG', unit: '%', decimals: 1, ...critDmg },
      {
        id: 'energyRegen',
        label: 'Energy Regen',
        unit: '',
        decimals: 3,
        ...energy,
        gauge: {
          source: STATIC_SOURCES.cissia.core,
          basisLabel: 'Initial Energy Regen',
          current: context.initialEnergyRegen,
          threshold: 1.4,
          cap: 3.68,
          outputLabel: 'Electric DEF Ignore',
          outputValue: cissiaCoreDefIgnore(context.initialEnergyRegen, setup.mindscape),
          outputCap: setup.mindscape >= 1 ? 35 : 25,
          outputUnit: '%',
          decimals: { current: 3, threshold: 1, cap: 2, output: 3, outputCap: 0 },
        },
      },
      { id: 'dmgBonus', label: 'DMG Bonus', unit: '%', decimals: 1, ...regular },
      { id: 'dazeBonus', label: 'Daze Bonus', unit: '%', decimals: 1, ...dazeBonus },
      ...optionalMetric('defIgnore', 'defIgnore', 'DEF Ignore', effects, 3),
      ...optionalMetric('defReduction', 'defReduction', 'DEF Reduction', effects),
      ...optionalMetric('resIgnore', 'resIgnore', 'RES Ignore', effects),
      ...optionalMetric('resReduction', 'resReduction', 'RES Reduction', effects),
      ...optionalMetric('stunDmgMultiplier', 'stunDmgMultiplier', 'Stun DMG Multiplier', effects),
    ],
    actionModifiers,
    operations: [],
  }
}
