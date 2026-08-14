import {
  DRIVE_DISC_FACTS,
  SOURCE_LABELS,
  VERTICAL_VALUES,
  W_ENGINE_FACTS,
  W_ENGINES,
  equipmentEffectBaseValue,
  equipmentEffectMaximumValue,
  equipmentEffectProgressionValue,
} from '../../content'
import {
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
  pufferElectroFourPieceClauses,
  resolveDeliveredClauses,
  source,
  withApplicability,
  type CompleteSetup,
  type EffectMetric,
  type SourceBoundCurrentClause,
} from '../../effects'
import { actionTarget, canonicalAction } from '../../actions'
import {
  composeActionHierarchy,
  composeMetricEffects,
  contribution,
  percentageContribution,
  surfaces,
  type ActionScopeNode,
} from '../composition'
import { initialAtkFor } from '../initial-atk'
import type { AgentResult } from '../result'

export interface NekomataCalculationContext {
  agentId: 'nekomata'
  setup: CompleteSetup
  additionalActive: boolean
  initialAtk: number
}

const BASIC = actionTarget([canonicalAction('Basic Attack')])
const DODGE_COUNTER = actionTarget([canonicalAction('Dodge Counter')])
const EX_SPECIAL = actionTarget([canonicalAction('EX Special Attack')])
const ULTIMATE = actionTarget([canonicalAction('Ultimate')])
const EX_AND_DODGE = actionTarget([
  canonicalAction('EX Special Attack'),
  canonicalAction('Dodge Counter'),
])
const BASIC_ULTIMATE = actionTarget([
  canonicalAction('Basic Attack'),
  canonicalAction('Ultimate'),
])

const DAMAGE_SCOPES = [
  {
    id: 'nekomataAdditionalActions', target: EX_AND_DODGE,
    children: [
      { id: 'nekomataDodgeCounter', target: DODGE_COUNTER },
      { id: 'nekomataExSpecial', target: EX_SPECIAL },
    ],
  },
  { id: 'nekomataUltimate', target: ULTIMATE },
] satisfies readonly ActionScopeNode[]
const DEF_SCOPES = [
  { id: 'nekomataBasicUltimate', target: BASIC_ULTIMATE },
] satisfies readonly ActionScopeNode[]

export function observeNekomata(
  setup: CompleteSetup,
  additionalActive: boolean,
): NekomataCalculationContext {
  const initialAtk = initialAtkFor('nekomata', setup)
  if (initialAtk === null) throw new Error('Complete Nekomata setup requires a W-Engine')
  return { agentId: 'nekomata', setup, additionalActive, initialAtk }
}

export function resolveNekomataProviderClauses(
  context: NekomataCalculationContext,
): SourceBoundCurrentClause[] {
  const { setup, additionalActive } = context
  const values = VERTICAL_VALUES.nekomata
  const refinement = setup.refinement
  const engine = engineSource('nekomata', setup)
  const core = source(SOURCE_LABELS.nekomataCore, 'nekomata', 'core')
  const additional = source(SOURCE_LABELS.nekomataAbility, 'nekomata', 'additional')
  const potential = source(SOURCE_LABELS.nekomataPotential, 'nekomata', 'identity')

  return active([
    additive('dmgBonus', 'fully', core, values.coreDmg, 'self'),
    additive('critDmg', 'fully', potential, values.potentialCritDmg, 'self'),
    additive(
      'dmgBonus', 'fully', additional,
      additionalActive ? values.additionalActionDmg : 0,
      'self', EX_AND_DODGE,
    ),
    withApplicability(
      additive(
        'resIgnore', 'fully', mindscapeSource('nekomata', 1, 'Back attack'),
        setup.mindscape >= 1 ? values.mindscapePhysicalResIgnore : 0,
        'enemy-context', undefined, undefined, ['nekomata'],
      ),
      { attributes: ['Physical'] },
    ),
    additive(
      'energyRegen', 'fully', mindscapeSource('nekomata', 2, 'Single enemy'),
      setup.mindscape >= 2 ? values.mindscapeEnergyRegen : 0,
      'self', undefined,
      { value: values.mindscapeEnergyRegen, unit: '/s', decimals: 1 },
    ),
    additive(
      'critRate', 'fully', mindscapeSource('nekomata', 4, 'After two EX Special Attacks'),
      setup.mindscape >= 4 ? values.mindscapeCritRate : 0,
      'self',
    ),
    additive(
      'critDmg', 'fully', mindscapeSource('nekomata', 6, 'Three stacks'),
      setup.mindscape >= 6 ? values.mindscapeCritDmg : 0,
      'self',
    ),

    additive(
      'critRate', 'combat', engine,
      setup.engineId === 'cordisGermina'
        ? equipmentEffectBaseValue(W_ENGINE_FACTS.cordisGermina.effects.critRate, refinement)
        : 0,
      'self',
    ),
    additive(
      'critDmg', 'combat', engine,
      setup.engineId === 'heartstringNocturne'
        ? equipmentEffectBaseValue(W_ENGINE_FACTS.heartstringNocturne.effects.critDamage, refinement)
        : setup.engineId === 'severedInnocence'
          ? equipmentEffectBaseValue(W_ENGINE_FACTS.severedInnocence.effects.critDamage, refinement)
          : 0,
      'self',
    ),
    additive(
      'critDmg', 'fully', engine,
      setup.engineId === 'severedInnocence'
        ? equipmentEffectProgressionValue(W_ENGINE_FACTS.severedInnocence.effects.critDamage, refinement)
        : 0,
      'self',
    ),
    additive(
      'dmgBonus', 'combat', engine,
      setup.engineId === 'steelCushion'
        ? equipmentEffectBaseValue(W_ENGINE_FACTS.steelCushion.effects.physicalDamage, refinement)
        : 0,
      'self',
    ),
    additive(
      'dmgBonus', 'fully', engine,
      setup.engineId === 'steelCushion'
        ? equipmentEffectBaseValue(W_ENGINE_FACTS.steelCushion.effects.damage, refinement)
        : 0,
      'self',
    ),
    additive(
      'defIgnore', 'fully', engine,
      setup.engineId === 'cordisGermina'
        ? equipmentEffectBaseValue(W_ENGINE_FACTS.cordisGermina.effects.defIgnore, refinement)
        : 0,
      'enemy-context', BASIC_ULTIMATE, undefined, ['nekomata'],
    ),
    withApplicability(
      additive(
        'resIgnore', 'fully', engine,
        setup.engineId === 'cloudcleaveRadiance'
          ? equipmentEffectBaseValue(
            W_ENGINE_FACTS.cloudcleaveRadiance.effects.physicalResIgnore,
            refinement,
          )
          : 0,
        'enemy-context', undefined, undefined, ['nekomata'],
      ),
      { attributes: ['Physical'] },
    ),
    percentage(
      'atk', 'fully', engine,
      setup.engineId === 'brimstone'
        ? equipmentEffectMaximumValue(W_ENGINE_FACTS.brimstone.effects.atk, refinement)
        : 0,
      'self',
    ),

    percentage(
      'atk', 'fully', discSource('nekomata', 'woodpecker', '4-piece'),
      setup.fourPieceId === 'woodpecker'
        ? equipmentEffectBaseValue(DRIVE_DISC_FACTS.woodpecker.fourPiece.atk)
        : 0,
      'self',
    ),
    ...pufferElectroFourPieceClauses('nekomata', setup, ULTIMATE),
  ])
}

function optionalMetric(
  metricId: EffectMetric,
  label: string,
  effects: ReturnType<typeof resolveDeliveredClauses>,
  actions: AgentResult['actionModifiers'] = [],
  unit = '%',
  decimals = 1,
): AgentResult['metrics'] {
  const data = composeMetricEffects(surfaces(0, 0, 0), surfaces([], [], []), effects, metricId)
  return data.values.fully || actions.some(({ metricId: actionMetric }) => actionMetric === metricId)
    ? [{ id: metricId, label, unit, decimals, ...data }]
    : []
}

export function calculateNekomata(
  context: NekomataCalculationContext,
  inbox: SourceBoundCurrentClause[],
  enemy: SourceBoundCurrentClause[],
): AgentResult {
  const { setup, initialAtk } = context
  const values = VERTICAL_VALUES.nekomata
  const baseAtk = values.atk + W_ENGINES[setup.engineId].baseAtk
  const effects = resolveDeliveredClauses([...inbox, ...enemy], { atk: initialAtk })

  const atkInputs = presentSetupInputs([
    engineAdvancedInput(setup, 'nekomata', 'atkPct'),
    mainStatInput(setup, 'nekomata', 'slot4', 'atkPct'),
    mainStatInput(setup, 'nekomata', 'slot5', 'atkPct'),
    mainStatInput(setup, 'nekomata', 'slot6', 'atkPct'),
    discStatInput(setup, 'nekomata', 'fourPiece', 'hormonePunk',
      equipmentEffectBaseValue(DRIVE_DISC_FACTS.hormonePunk.twoPiece.atk), 'twoPiece'),
    discStatInput(setup, 'nekomata', 'twoPiece', 'hormonePunk',
      equipmentEffectBaseValue(DRIVE_DISC_FACTS.hormonePunk.twoPiece.atk)),
    discStatInput(setup, 'nekomata', 'fourPiece', 'astralVoice',
      equipmentEffectBaseValue(DRIVE_DISC_FACTS.astralVoice.twoPiece.atk), 'twoPiece'),
    discStatInput(setup, 'nekomata', 'twoPiece', 'astralVoice',
      equipmentEffectBaseValue(DRIVE_DISC_FACTS.astralVoice.twoPiece.atk)),
    effectiveSubstatInput(setup, 'nekomata', 'atkPct'),
  ])
  const atk = composeMetricEffects(
    surfaces(initialAtk, initialAtk, initialAtk),
    surfaces(atkInputs.map((input) => percentageContribution(
      input.source, baseAtk * input.rawValue / 100, input.rawValue,
    )), [], []),
    effects,
    'atk',
  )

  const critRateInputs = presentSetupInputs([
    engineAdvancedInput(setup, 'nekomata', 'critRate'),
    mainStatInput(setup, 'nekomata', 'slot4', 'critRate'),
    discStatInput(setup, 'nekomata', 'fourPiece', 'woodpecker',
      equipmentEffectBaseValue(DRIVE_DISC_FACTS.woodpecker.twoPiece.critRate), 'twoPiece'),
    discStatInput(setup, 'nekomata', 'twoPiece', 'woodpecker',
      equipmentEffectBaseValue(DRIVE_DISC_FACTS.woodpecker.twoPiece.critRate)),
    effectiveSubstatInput(setup, 'nekomata', 'critRate'),
  ])
  const initialCritRate = values.critRate
    + critRateInputs.reduce((sum, input) => sum + input.rawValue, 0)
  const critRate = composeMetricEffects(
    surfaces(initialCritRate, initialCritRate, initialCritRate),
    surfaces(critRateInputs.map((input) => contribution(input.source, input.rawValue)), [], []),
    effects,
    'critRate',
    { value: 100, source: source('Displayed CRIT Rate cap', 'nekomata', 'calculation') },
  )

  const critDmgInputs = presentSetupInputs([
    engineAdvancedInput(setup, 'nekomata', 'critDmg'),
    mainStatInput(setup, 'nekomata', 'slot4', 'critDmg'),
    discStatInput(setup, 'nekomata', 'twoPiece', 'branchAndBlade',
      equipmentEffectBaseValue(DRIVE_DISC_FACTS.branchAndBlade.twoPiece.critDamage)),
    effectiveSubstatInput(setup, 'nekomata', 'critDmg'),
  ])
  const initialCritDmg = values.critDmg
    + critDmgInputs.reduce((sum, input) => sum + input.rawValue, 0)
  const critDmg = composeMetricEffects(
    surfaces(initialCritDmg, initialCritDmg, initialCritDmg),
    surfaces(critDmgInputs.map((input) => contribution(input.source, input.rawValue)), [], []),
    effects,
    'critDmg',
  )

  const dmgInputs = presentSetupInputs([
    mainStatInput(setup, 'nekomata', 'slot5', 'physicalDmg'),
    discStatInput(setup, 'nekomata', 'twoPiece', 'fangedMetal',
      equipmentEffectBaseValue(DRIVE_DISC_FACTS.fangedMetal.twoPiece.damage)),
  ])
  const initialDmg = dmgInputs.reduce((sum, input) => sum + input.rawValue, 0)
  const dmg = composeMetricEffects(
    surfaces(initialDmg, initialDmg, initialDmg),
    surfaces(dmgInputs.map((input) => contribution(input.source, input.rawValue)), [], []),
    effects,
    'dmgBonus',
  )

  const penInputs = presentSetupInputs([
    mainStatInput(setup, 'nekomata', 'slot5', 'penRatio'),
    discStatInput(setup, 'nekomata', 'fourPiece', 'pufferElectro',
      equipmentEffectBaseValue(DRIVE_DISC_FACTS.pufferElectro.twoPiece.penRatio), 'twoPiece'),
    discStatInput(setup, 'nekomata', 'twoPiece', 'pufferElectro',
      equipmentEffectBaseValue(DRIVE_DISC_FACTS.pufferElectro.twoPiece.penRatio)),
  ])
  const initialPen = penInputs.reduce((sum, input) => sum + input.rawValue, 0)
  const pen = composeMetricEffects(
    surfaces(initialPen, initialPen, initialPen),
    surfaces(penInputs.map((input) => contribution(input.source, input.rawValue)), [], []),
    effects,
    'penRatio',
  )

  const energy = composeMetricEffects(
    surfaces(values.baseEnergyRegen, values.baseEnergyRegen, values.baseEnergyRegen),
    surfaces([], [], []),
    effects,
    'energyRegen',
  )
  const defIgnore = composeMetricEffects(surfaces(0, 0, 0), surfaces([], [], []), effects, 'defIgnore')
  const actionModifiers = [
    ...composeActionHierarchy(dmg.values, effects, 'dmgBonus', DAMAGE_SCOPES),
    ...composeActionHierarchy(defIgnore.values, effects, 'defIgnore', DEF_SCOPES, 'DefIgnore'),
  ]

  return {
    agentId: 'nekomata',
    metrics: [
      { id: 'atk', label: 'ATK', unit: '', decimals: 0, ...atk },
      { id: 'critRate', label: 'CRIT Rate', unit: '%', decimals: 1, ...critRate },
      { id: 'critDmg', label: 'CRIT DMG', unit: '%', decimals: 1, ...critDmg },
      { id: 'dmgBonus', label: 'DMG Bonus', unit: '%', decimals: 1, ...dmg },
      ...(pen.values.fully
        ? [{ id: 'penRatio' as const, label: 'PEN Ratio', unit: '%', decimals: 1, ...pen }]
        : []),
      { id: 'energyRegen', label: 'Energy Regen', unit: '/s', decimals: 2, ...energy },
      ...optionalMetric('defIgnore', 'DEF Ignore', effects, actionModifiers),
      ...optionalMetric('defReduction', 'DEF Reduction', effects),
      ...optionalMetric('resIgnore', 'RES Ignore', effects, actionModifiers),
      ...optionalMetric('resReduction', 'RES Reduction', effects),
      ...optionalMetric('stunDmgMultiplier', 'Stun DMG Multiplier', effects),
    ],
    actionModifiers,
    operations: [],
  }
}
