import {
  DRIVE_DISC_FACTS,
  VERTICAL_VALUES,
  W_ENGINE_FACTS,
  W_ENGINES,
  scaledEngineValue,
  type AgentId,
} from '../../content'
import {
  STATIC_SOURCES,
  active,
  additive,
  additiveMetricBundle,
  discSource,
  discStatInput,
  effectiveSubstatInput,
  engineAdvancedInput,
  engineSource,
  mainStatInput,
  mindscapeSource,
  percentage,
  resolveDeliveredClauses,
  withApplicability,
  type CompleteSetup,
  type EffectMetric,
  type ResolvedSetupInput,
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
import type { AgentResult } from '../result'

export interface SeedCalculationContext {
  agentId: 'seed'
  setup: CompleteSetup
  initialAtk: number
}

const SEED_ACTION_SCOPES = [{
  id: 'seedActions',
  actions: [
    'Basic Attack: Falling Petals - Slaughter',
    'Basic Attack: Falling Petals - Downfall',
    'Ultimate',
  ],
  children: [
    {
      id: 'seedBasicActions',
      actions: [
        'Basic Attack: Falling Petals - Slaughter',
        'Basic Attack: Falling Petals - Downfall',
      ],
      children: [
        { id: 'seedSlaughter', actions: ['Basic Attack: Falling Petals - Slaughter'] },
        { id: 'seedDownfall', actions: ['Basic Attack: Falling Petals - Downfall'] },
      ],
    },
    { id: 'seedUltimate', actions: ['Ultimate'] },
  ],
}] satisfies readonly ActionScopeNode[]

function presentInputs(inputs: Array<ResolvedSetupInput | undefined>): ResolvedSetupInput[] {
  return inputs.filter((input): input is ResolvedSetupInput => input !== undefined)
}

function seedAtkInputs(setup: CompleteSetup): ResolvedSetupInput[] {
  return presentInputs([
    engineAdvancedInput(setup, 'seed', 'atkPct'),
    mainStatInput(setup, 'seed', 'slot5', 'atkPct'),
    mainStatInput(setup, 'seed', 'slot6', 'atkPct'),
    effectiveSubstatInput(setup, 'seed', 'atkPct'),
  ])
}

export function observeSeed(setup: CompleteSetup): SeedCalculationContext {
  const baseAtk = VERTICAL_VALUES.seed.atk + W_ENGINES[setup.engineId].baseAtk
  const initialAtk = baseAtk * (1 + seedAtkInputs(setup).reduce(
    (total, input) => total + input.rawValue,
    0,
  ) / 100) + VERTICAL_VALUES.fixedDisc.atk
  return { agentId: 'seed', setup, initialAtk }
}

function dawnClauses(setup: CompleteSetup): SourceBoundCurrentClause[] {
  if (setup.fourPieceId !== 'dawnsBloom') return []
  const initial = DRIVE_DISC_FACTS.dawnsBloom.basicDmg.initial
  const combat = DRIVE_DISC_FACTS.dawnsBloom.basicDmg.combat
  const fully = DRIVE_DISC_FACTS.dawnsBloom.basicDmg.fully
  const twoPiece = discSource('seed', 'dawnsBloom', '2-piece', '4-piece')
  const fourPiece = discSource('seed', 'dawnsBloom', '4-piece')
  return [
    additive('dmgBonus', 'initial', twoPiece, initial, 'self', 'seedBasicActions'),
    additive('dmgBonus', 'combat', fourPiece, combat, 'self', 'seedBasicActions'),
    additive('dmgBonus', 'fully', fourPiece, fully, 'self', 'seedBasicActions'),
  ]
}

export function resolveSeedProviderClauses(
  context: SeedCalculationContext,
  vanguardAgentId: AgentId | null,
): SourceBoundCurrentClause[] {
  const { setup } = context
  const engine = engineSource('seed', setup)
  const refinement = setup.refinement
  const cordisDmg = setup.engineId === 'cordisGermina'
    ? scaledEngineValue(W_ENGINE_FACTS.cordisGermina.electricDmgPerStack * 2, refinement)
    : 0
  const cordisDefIgnore = setup.engineId === 'cordisGermina'
    ? scaledEngineValue(W_ENGINE_FACTS.cordisGermina.defIgnore, refinement)
    : 0
  const hasVanguard = vanguardAgentId !== null
  const coreRecipients: AgentId[] = hasVanguard ? ['seed', vanguardAgentId] : []
  const generalDamage = (clause: SourceBoundCurrentClause) => withApplicability(
    clause,
    { formulas: ['general_damage'] },
  )
  const electricGeneral = (clause: SourceBoundCurrentClause) => withApplicability(
    clause,
    { attributes: ['Electric'], formulas: ['general_damage'] },
  )
  const coreStatus = hasVanguard
    ? additiveMetricBundle(
        VERTICAL_VALUES.seed.coreStatus,
        'combat',
        STATIC_SOURCES.seed.core,
        'all-party',
        coreRecipients,
      )
    : []
  return active([
    ...coreStatus,
    generalDamage(additive('dmgBonus', 'combat', STATIC_SOURCES.seed.core,
      hasVanguard ? 25 : 0, 'all-party', undefined, undefined, coreRecipients)),
    additive('dmgBonus', 'combat', STATIC_SOURCES.seed.additional,
      hasVanguard ? 30 : 0, 'self', 'seedActions'),
    electricGeneral(additive('resIgnore', 'combat', STATIC_SOURCES.seed.additional,
      hasVanguard ? 25 : 0, 'enemy-context', 'seedActions', undefined, ['seed'])),
    additive('critDmg', 'fully', mindscapeSource('seed', 1, 'Downfall'),
      setup.mindscape >= 1 ? 30 : 0, 'self', 'seedDownfall'),
    generalDamage(additive('defIgnore', 'combat', mindscapeSource('seed', 2, 'Besiege'),
      setup.mindscape >= 2 && hasVanguard ? 20 : 0,
      'enemy-context', undefined, undefined, coreRecipients)),
    additive('dmgBonus', 'fully', mindscapeSource('seed', 2, 'Slaughter'),
      setup.mindscape >= 2 ? 120 : 0, 'self', 'seedSlaughter'),
    additive('dmgBonus', 'fully', mindscapeSource('seed', 4, 'Ultimate'),
      setup.mindscape >= 4 ? 20 : 0, 'self', 'seedUltimate'),
    additive('critDmg', 'combat', mindscapeSource('seed', 6),
      setup.mindscape >= 6 ? 50 : 0, 'self'),
    additive('critDmg', 'combat', engine, setup.engineId === 'severedInnocence'
      ? scaledEngineValue(W_ENGINE_FACTS.severedInnocence.combatCritDmg, refinement)
      : 0, 'self'),
    additive('critDmg', 'fully', engine, setup.engineId === 'severedInnocence'
      ? scaledEngineValue(W_ENGINE_FACTS.severedInnocence.stackCritDmg * 3, refinement)
      : 0, 'self'),
    additive('critRate', 'combat', engine, setup.engineId === 'cordisGermina'
      ? scaledEngineValue(W_ENGINE_FACTS.cordisGermina.critRate, refinement)
      : 0, 'self'),
    additive('dmgBonus', 'fully', engine, setup.engineId === 'severedInnocence'
      ? scaledEngineValue(W_ENGINE_FACTS.severedInnocence.electricDmg, refinement)
      : 0, 'self'),
    percentage('atk', 'fully', engine, setup.engineId === 'brimstone'
      ? W_ENGINE_FACTS.brimstone.atkAtMax[refinement - 1]
      : setup.engineId === 'marcatoDesire'
        ? scaledEngineValue(W_ENGINE_FACTS.marcatoDesire.atkPctPerClause, refinement) * 2
        : 0, 'self'),
    percentage('atk', 'fully', discSource('seed', 'woodpecker', '4-piece'),
      setup.fourPieceId === 'woodpecker' ? DRIVE_DISC_FACTS.woodpecker.atkPctAtMax : 0,
      'self'),
    additive('dmgBonus', 'fully', engine, cordisDmg, 'self', 'seedActions'),
    additive('defIgnore', 'fully', engine, cordisDefIgnore, 'enemy-context', 'seedActions', undefined, ['seed']),
    ...dawnClauses(setup),
  ])
}

function optionalMetric(
  metric: EffectMetric,
  id: string,
  label: string,
  effects: ReturnType<typeof resolveDeliveredClauses>,
  actions: AgentResult['actionModifiers'] = [],
) {
  const data = composeMetricEffects(surfaces(0, 0, 0), surfaces([], [], []), effects, metric)
  return data.values.fully === 0 && !actions.some(({ metricId }) => metricId === id)
    ? []
    : [{ id, label, unit: '%', decimals: 1, ...data }]
}

export function calculateSeed(
  context: SeedCalculationContext,
  inbox: SourceBoundCurrentClause[],
  enemy: SourceBoundCurrentClause[],
): AgentResult {
  const { setup, initialAtk } = context
  const baseAtk = VERTICAL_VALUES.seed.atk + W_ENGINES[setup.engineId].baseAtk
  const atkInputs = seedAtkInputs(setup)
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
    engineAdvancedInput(setup, 'seed', 'critRate'),
    mainStatInput(setup, 'seed', 'slot4', 'critRate'),
    discStatInput(setup, 'seed', 'twoPiece', 'woodpecker', DRIVE_DISC_FACTS.woodpecker.critRate),
    discStatInput(setup, 'seed', 'fourPiece', 'woodpecker', DRIVE_DISC_FACTS.woodpecker.critRate, 'twoPiece'),
    effectiveSubstatInput(setup, 'seed', 'critRate'),
  ])
  const initialCritRate = VERTICAL_VALUES.seed.critRate + critRateInputs.reduce((total, input) => total + input.rawValue, 0)
  const critRate = composeMetricEffects(
    surfaces(Math.min(initialCritRate, 100), Math.min(initialCritRate, 100), Math.min(initialCritRate, 100)),
    surfaces(critRateInputs.map((input) => contribution(input.source, input.rawValue)), [], []),
    effects,
    'critRate',
    { value: 100, source: STATIC_SOURCES.seed.critCap },
  )
  const critDmgInputs = presentInputs([
    engineAdvancedInput(setup, 'seed', 'critDmg'),
    mainStatInput(setup, 'seed', 'slot4', 'critDmg'),
    discStatInput(setup, 'seed', 'twoPiece', 'branchAndBlade', DRIVE_DISC_FACTS.branchAndBlade.critDmg),
    effectiveSubstatInput(setup, 'seed', 'critDmg'),
  ])
  const initialCritDmg = VERTICAL_VALUES.seed.critDmg + critDmgInputs.reduce((total, input) => total + input.rawValue, 0)
  const critDmg = composeMetricEffects(
    surfaces(initialCritDmg, initialCritDmg, initialCritDmg),
    surfaces(critDmgInputs.map((input) => contribution(input.source, input.rawValue)), [], []),
    effects,
    'critDmg',
  )
  const electricDmg = mainStatInput(setup, 'seed', 'slot5', 'electricDmg')
  const regular = composeMetricEffects(
    surfaces(electricDmg?.rawValue ?? 0, electricDmg?.rawValue ?? 0, electricDmg?.rawValue ?? 0),
    surfaces(electricDmg ? [contribution(electricDmg.source, electricDmg.rawValue)] : [], [], []),
    effects,
    'dmgBonus',
  )
  const mainPen = mainStatInput(setup, 'seed', 'slot5', 'penRatio')
  const pufferPen = discStatInput(setup, 'seed', 'twoPiece', 'pufferElectro', DRIVE_DISC_FACTS.pufferElectro.penRatio)
  const penInputs = presentInputs([mainPen, pufferPen])
  const initialPen = penInputs.reduce((total, input) => total + input.rawValue, 0)
  const penRatio = composeMetricEffects(
    surfaces(initialPen, initialPen, initialPen),
    surfaces(penInputs.map((input) => contribution(input.source, input.rawValue)), [], []),
    effects,
    'penRatio',
  )
  const broadDefIgnore = composeMetricEffects(surfaces(0, 0, 0), surfaces([], [], []), effects, 'defIgnore')
  const broadResIgnore = composeMetricEffects(surfaces(0, 0, 0), surfaces([], [], []), effects, 'resIgnore')
  const actionModifiers: AgentResult['actionModifiers'] = [
    ...composeActionHierarchy(regular.values, effects, 'dmgBonus', SEED_ACTION_SCOPES),
    ...composeActionHierarchy(
      broadDefIgnore.values,
      effects,
      'defIgnore',
      SEED_ACTION_SCOPES,
      'DefIgnore',
    ),
    ...composeActionHierarchy(
      broadResIgnore.values,
      effects,
      'resIgnore',
      SEED_ACTION_SCOPES,
      'ResIgnore',
    ),
    ...composeActionHierarchy(
      critDmg.values,
      effects,
      'critDmg',
      SEED_ACTION_SCOPES,
      'CritDmg',
    ),
  ]

  return {
    agentId: 'seed',
    metrics: [
      { id: 'atk', label: 'ATK', unit: '', decimals: 0, ...atk },
      { id: 'critRate', label: 'CRIT Rate', unit: '%', decimals: 1, ...critRate },
      { id: 'critDmg', label: 'CRIT DMG', unit: '%', decimals: 1, ...critDmg },
      { id: 'dmgBonus', label: 'DMG Bonus', unit: '%', decimals: 1, ...regular },
      ...(penRatio.values.fully ? [{ id: 'penRatio', label: 'PEN Ratio', unit: '%', decimals: 1, ...penRatio }] : []),
      ...optionalMetric('defIgnore', 'defIgnore', 'DEF Ignore', effects, actionModifiers),
      ...optionalMetric('defReduction', 'defReduction', 'DEF Reduction', effects),
      ...optionalMetric('resIgnore', 'resIgnore', 'RES Ignore', effects, actionModifiers),
      ...optionalMetric('resReduction', 'resReduction', 'RES Reduction', effects),
      ...optionalMetric('stunDmgMultiplier', 'stunDmgMultiplier', 'Stun DMG Multiplier', effects),
    ],
    actionModifiers,
    operations: [],
  }
}
