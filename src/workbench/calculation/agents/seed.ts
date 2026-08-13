import {
  DRIVE_DISC_FACTS,
  VERTICAL_VALUES,
  W_ENGINE_FACTS,
  W_ENGINES,
  equipmentEffectBaseValue,
  equipmentEffectMaximumValue,
  equipmentEffectProgressionValue,
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
  presentSetupInputs,
  pufferElectroFourPieceClauses,
  resolveDeliveredClauses,
  withApplicability,
  type CompleteSetup,
  type EffectMetric,
  type ResolvedSetupInput,
  type SourceBoundCurrentClause,
} from '../../effects'
import {
  actionForm,
  actionTarget,
  canonicalAction,
} from '../../actions'
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

const SEED_ACTIONS = actionTarget([
    actionForm('Basic Attack', 'Falling Petals - Slaughter'),
    actionForm('Basic Attack', 'Falling Petals - Downfall'),
    canonicalAction('Ultimate'),
])

const SEED_BASIC_ACTIONS = actionTarget([
    actionForm('Basic Attack', 'Falling Petals - Slaughter'),
    actionForm('Basic Attack', 'Falling Petals - Downfall'),
])

const SEED_SLAUGHTER = actionTarget([
  actionForm('Basic Attack', 'Falling Petals - Slaughter'),
])

const SEED_DOWNFALL = actionTarget([
  actionForm('Basic Attack', 'Falling Petals - Downfall'),
])

const SEED_ULTIMATE = actionTarget([canonicalAction('Ultimate')])

const SEED_ACTION_SCOPES = [{
  id: 'seedActions',
  target: SEED_ACTIONS,
  children: [
    {
      id: 'seedBasicActions',
      target: SEED_BASIC_ACTIONS,
      children: [
        { id: 'seedSlaughter', target: SEED_SLAUGHTER },
        { id: 'seedDownfall', target: SEED_DOWNFALL },
      ],
    },
    { id: 'seedUltimate', target: SEED_ULTIMATE },
  ],
}] satisfies readonly ActionScopeNode[]

function seedAtkInputs(setup: CompleteSetup): ResolvedSetupInput[] {
  return presentSetupInputs([
    engineAdvancedInput(setup, 'seed', 'atkPct'),
    mainStatInput(setup, 'seed', 'slot5', 'atkPct'),
    mainStatInput(setup, 'seed', 'slot6', 'atkPct'),
    discStatInput(setup, 'seed', 'twoPiece', 'hormonePunk', equipmentEffectBaseValue(DRIVE_DISC_FACTS.hormonePunk.twoPiece.atk)),
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
  const initial = equipmentEffectBaseValue(DRIVE_DISC_FACTS.dawnsBloom.twoPiece.damage)
  const combat = equipmentEffectBaseValue(DRIVE_DISC_FACTS.dawnsBloom.fourPiece.damage)
  const fully = equipmentEffectProgressionValue(DRIVE_DISC_FACTS.dawnsBloom.fourPiece.damage)
  const twoPiece = discSource('seed', 'dawnsBloom', '2-piece', '4-piece')
  const fourPiece = discSource('seed', 'dawnsBloom', '4-piece')
  return [
    additive('dmgBonus', 'initial', twoPiece, initial, 'self', SEED_BASIC_ACTIONS),
    additive('dmgBonus', 'combat', fourPiece, combat, 'self', SEED_BASIC_ACTIONS),
    additive('dmgBonus', 'fully', fourPiece, fully, 'self', SEED_BASIC_ACTIONS),
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
    ? equipmentEffectMaximumValue(W_ENGINE_FACTS.cordisGermina.effects.damage, refinement)
    : 0
  const cordisDefIgnore = setup.engineId === 'cordisGermina'
    ? equipmentEffectBaseValue(W_ENGINE_FACTS.cordisGermina.effects.defIgnore, refinement)
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
      hasVanguard ? 30 : 0, 'self', SEED_ACTIONS),
    electricGeneral(additive('resIgnore', 'combat', STATIC_SOURCES.seed.additional,
      hasVanguard ? 25 : 0, 'enemy-context', SEED_ACTIONS, undefined, ['seed'])),
    additive('critDmg', 'fully', mindscapeSource('seed', 1, 'Downfall'),
      setup.mindscape >= 1 ? 30 : 0, 'self', SEED_DOWNFALL),
    generalDamage(additive('defIgnore', 'combat', mindscapeSource('seed', 2, 'Besiege'),
      setup.mindscape >= 2 && hasVanguard ? 20 : 0,
      'enemy-context', undefined, undefined, coreRecipients)),
    additive('dmgBonus', 'fully', mindscapeSource('seed', 2, 'Slaughter'),
      setup.mindscape >= 2 ? 120 : 0, 'self', SEED_SLAUGHTER),
    additive('dmgBonus', 'fully', mindscapeSource('seed', 4, 'Ultimate'),
      setup.mindscape >= 4 ? 20 : 0, 'self', SEED_ULTIMATE),
    additive('critDmg', 'combat', mindscapeSource('seed', 6),
      setup.mindscape >= 6 ? 50 : 0, 'self'),
    additive('critDmg', 'combat', engine, setup.engineId === 'severedInnocence'
      ? equipmentEffectBaseValue(W_ENGINE_FACTS.severedInnocence.effects.critDamage, refinement)
      : setup.engineId === 'heartstringNocturne'
        ? equipmentEffectBaseValue(W_ENGINE_FACTS.heartstringNocturne.effects.critDamage, refinement)
        : 0, 'self'),
    additive('critDmg', 'fully', engine, setup.engineId === 'severedInnocence'
      ? equipmentEffectProgressionValue(W_ENGINE_FACTS.severedInnocence.effects.critDamage, refinement)
      : 0, 'self'),
    additive('critRate', 'combat', engine, setup.engineId === 'cordisGermina'
      ? equipmentEffectBaseValue(W_ENGINE_FACTS.cordisGermina.effects.critRate, refinement)
      : 0, 'self'),
    additive('dmgBonus', 'fully', engine, setup.engineId === 'severedInnocence'
      ? equipmentEffectBaseValue(W_ENGINE_FACTS.severedInnocence.effects.damage, refinement)
      : 0, 'self'),
    percentage('atk', 'fully', engine, setup.engineId === 'brimstone'
      ? equipmentEffectMaximumValue(W_ENGINE_FACTS.brimstone.effects.atk, refinement)
      : setup.engineId === 'marcatoDesire'
        ? equipmentEffectMaximumValue(W_ENGINE_FACTS.marcatoDesire.effects.atk, refinement)
        : 0, 'self'),
    percentage('atk', 'fully', discSource('seed', 'woodpecker', '4-piece'),
      setup.fourPieceId === 'woodpecker' ? equipmentEffectBaseValue(DRIVE_DISC_FACTS.woodpecker.fourPiece.atk) : 0,
      'self'),
    additive('dmgBonus', 'fully', engine, cordisDmg, 'self', SEED_ACTIONS),
    additive('defIgnore', 'fully', engine, cordisDefIgnore, 'enemy-context', SEED_ACTIONS, undefined, ['seed']),
    ...dawnClauses(setup),
    ...pufferElectroFourPieceClauses('seed', setup, SEED_ULTIMATE),
  ])
}

function optionalMetric(
  metric: EffectMetric,
  id: EffectMetric,
  label: string,
  effects: ReturnType<typeof resolveDeliveredClauses>,
  actions: AgentResult['actionModifiers'] = [],
): AgentResult['metrics'] {
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
  const critRateInputs = presentSetupInputs([
    engineAdvancedInput(setup, 'seed', 'critRate'),
    mainStatInput(setup, 'seed', 'slot4', 'critRate'),
    discStatInput(setup, 'seed', 'twoPiece', 'woodpecker', equipmentEffectBaseValue(DRIVE_DISC_FACTS.woodpecker.twoPiece.critRate)),
    discStatInput(setup, 'seed', 'fourPiece', 'woodpecker', equipmentEffectBaseValue(DRIVE_DISC_FACTS.woodpecker.twoPiece.critRate), 'twoPiece'),
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
  const critDmgInputs = presentSetupInputs([
    engineAdvancedInput(setup, 'seed', 'critDmg'),
    mainStatInput(setup, 'seed', 'slot4', 'critDmg'),
    discStatInput(setup, 'seed', 'twoPiece', 'branchAndBlade', equipmentEffectBaseValue(DRIVE_DISC_FACTS.branchAndBlade.twoPiece.critDamage)),
    effectiveSubstatInput(setup, 'seed', 'critDmg'),
  ])
  const initialCritDmg = VERTICAL_VALUES.seed.critDmg + critDmgInputs.reduce((total, input) => total + input.rawValue, 0)
  const critDmg = composeMetricEffects(
    surfaces(initialCritDmg, initialCritDmg, initialCritDmg),
    surfaces(critDmgInputs.map((input) => contribution(input.source, input.rawValue)), [], []),
    effects,
    'critDmg',
  )
  const electricDmgInputs = presentSetupInputs([
    mainStatInput(setup, 'seed', 'slot5', 'electricDmg'),
    discStatInput(setup, 'seed', 'twoPiece', 'thunderMetal', equipmentEffectBaseValue(DRIVE_DISC_FACTS.thunderMetal.twoPiece.damage)),
  ])
  const initialElectricDmg = electricDmgInputs.reduce((total, input) => total + input.rawValue, 0)
  const regular = composeMetricEffects(
    surfaces(initialElectricDmg, initialElectricDmg, initialElectricDmg),
    surfaces(electricDmgInputs.map((input) => contribution(input.source, input.rawValue)), [], []),
    effects,
    'dmgBonus',
  )
  const mainPen = mainStatInput(setup, 'seed', 'slot5', 'penRatio')
  const pufferTwoPiecePen = discStatInput(setup, 'seed', 'twoPiece', 'pufferElectro', equipmentEffectBaseValue(DRIVE_DISC_FACTS.pufferElectro.twoPiece.penRatio))
  const pufferFourPiecePen = discStatInput(
    setup,
    'seed',
    'fourPiece',
    'pufferElectro',
    equipmentEffectBaseValue(DRIVE_DISC_FACTS.pufferElectro.twoPiece.penRatio),
    'twoPiece',
  )
  const penInputs = presentSetupInputs([mainPen, pufferTwoPiecePen, pufferFourPiecePen])
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
      ...(penRatio.values.fully ? [{ id: 'penRatio' as const, label: 'PEN Ratio', unit: '%', decimals: 1, ...penRatio }] : []),
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
