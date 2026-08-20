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
  selectedDiscTwoPieceInputs,
  effectiveSubstatInput,
  engineAdvancedInput,
  engineSource,
  mainStatInput,
  mindscapeSource,
  perSecond,
  presentSetupInputs,
  pufferElectroFourPieceClauses,
  resolveDeliveredClauses,
  withApplicability,
  type CompleteSetup,
  type EffectMetric,
  type SourceBoundCurrentClause,
} from '../../effects'
import { actionTarget, canonicalAction, sourceLocalAction } from '../../actions'
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

export interface CorinCalculationContext {
  agentId: 'corin'
  setup: CompleteSetup
  additionalActive: boolean
  initialAtk: number
}

export const CORIN_ULTIMATE = actionTarget([canonicalAction('Ultimate')])
const CORIN_BASIC_ULTIMATE = actionTarget([
  canonicalAction('Basic Attack'),
  canonicalAction('Ultimate'),
])
const CORIN_CHAINSAW = actionTarget([
  sourceLocalAction('Extended chainsaw actions', 'Basic Attack'),
])
const CORIN_EX = actionTarget([canonicalAction('EX Special Attack')])
const CORIN_DAMAGE_SCOPES = [
  { id: 'corinChainsaw', target: CORIN_CHAINSAW },
  { id: 'corinEx', target: CORIN_EX },
  { id: 'corinUltimate', target: CORIN_ULTIMATE },
] satisfies readonly ActionScopeNode[]
const CORIN_DEF_SCOPES = [
  { id: 'corinBasicUltimate', target: CORIN_BASIC_ULTIMATE },
] satisfies readonly ActionScopeNode[]

export function observeCorin(
  setup: CompleteSetup,
  additionalActive: boolean,
): CorinCalculationContext {
  const initialAtk = initialAtkFor('corin', setup)
  if (initialAtk === null) throw new Error('Complete Corin setup requires a W-Engine')
  return { agentId: 'corin', setup, additionalActive, initialAtk }
}

export function resolveCorinProviderClauses(
  context: CorinCalculationContext,
): SourceBoundCurrentClause[] {
  const { setup } = context
  const engine = engineSource('corin', setup)
  const refinement = setup.refinement
  const baseAtk = VERTICAL_VALUES.corin.atk + W_ENGINES[setup.engineId].baseAtk
  const hormoneAtk = equipmentEffectBaseValue(DRIVE_DISC_FACTS.hormonePunk.fourPiece.atk)

  return active([
    additive(
      'dmgBonus',
      'combat',
      STATIC_SOURCES.corin.core,
      VERTICAL_VALUES.corin.coreChainsawDmg,
      'self',
      CORIN_CHAINSAW,
    ),
    additive(
      'dmgBonus',
      'fully',
      STATIC_SOURCES.corin.additional,
      context.additionalActive ? VERTICAL_VALUES.corin.additionalStunnedDmg : 0,
      'self',
    ),
    additive(
      'dmgBonus',
      'fully',
      mindscapeSource('corin', 1, 'After Chain Attack or Ultimate'),
      setup.mindscape >= 1 ? VERTICAL_VALUES.corin.mindscapeDmg : 0,
      'self',
    ),
    withApplicability(
      additive(
        'resReduction',
        'fully',
        mindscapeSource('corin', 2, '20 stacks'),
        setup.mindscape >= 2 ? VERTICAL_VALUES.corin.mindscapePhysicalResReduction : 0,
        'enemy-context',
      ),
      { attributes: ['Physical'] },
    ),
    additive(
      'critRate',
      'combat',
      engine,
      setup.engineId === 'cordisGermina'
        ? equipmentEffectBaseValue(W_ENGINE_FACTS.cordisGermina.effects.critRate, refinement)
        : 0,
      'self',
    ),
    additive(
      'defIgnore',
      'fully',
      engine,
      setup.engineId === 'cordisGermina'
        ? equipmentEffectBaseValue(W_ENGINE_FACTS.cordisGermina.effects.defIgnore, refinement)
        : 0,
      'enemy-context',
      CORIN_BASIC_ULTIMATE,
      undefined,
      ['corin'],
    ),
    additive(
      'critDmg',
      'combat',
      engine,
      setup.engineId === 'heartstringNocturne'
        ? equipmentEffectBaseValue(W_ENGINE_FACTS.heartstringNocturne.effects.critDamage, refinement)
        : 0,
      'self',
    ),
    additive(
      'dmgBonus',
      'combat',
      engine,
      setup.engineId === 'steelCushion'
        ? equipmentEffectBaseValue(W_ENGINE_FACTS.steelCushion.effects.physicalDamage, refinement)
        : 0,
      'self',
    ),
    additive(
      'dmgBonus',
      'fully',
      engine,
      setup.engineId === 'steelCushion'
        ? equipmentEffectBaseValue(W_ENGINE_FACTS.steelCushion.effects.damage, refinement)
        : 0,
      'self',
    ),
    additive(
      'dmgBonus',
      'fully',
      engine,
      setup.engineId === 'housekeeper'
        ? equipmentEffectMaximumValue(W_ENGINE_FACTS.housekeeper.effects.damage, refinement)
        : 0,
      'self',
      CORIN_EX,
    ),
    ...(setup.engineId === 'housekeeper'
      ? [perSecond(
        engine,
        equipmentEffectBaseValue(W_ENGINE_FACTS.housekeeper.effects.energy, refinement),
        'self',
      )]
      : []),
    additive(
      'atk',
      'combat',
      discSource('corin', 'hormonePunk', '4-piece'),
      setup.fourPieceId === 'hormonePunk' ? baseAtk * hormoneAtk / 100 : 0,
      'self',
      undefined,
      setup.fourPieceId === 'hormonePunk'
        ? { value: hormoneAtk, unit: '%', decimals: 0 }
        : undefined,
    ),
    ...pufferElectroFourPieceClauses('corin', setup, CORIN_ULTIMATE),
  ])
}

function optionalMetric(
  metric: EffectMetric,
  label: string,
  effects: ReturnType<typeof resolveDeliveredClauses>,
  actions: AgentResult['actionModifiers'] = [],
  unit = '%',
  decimals = 1,
): AgentResult['metrics'] {
  const data = composeMetricEffects(surfaces(0, 0, 0), surfaces([], [], []), effects, metric)
  return data.values.fully || actions.some(({ metricId }) => metricId === metric)
    ? [{ id: metric, label, unit, decimals, ...data }]
    : []
}

export function calculateCorin(
  context: CorinCalculationContext,
  inbox: SourceBoundCurrentClause[],
  enemy: SourceBoundCurrentClause[],
): AgentResult {
  const { setup, initialAtk } = context
  const baseAtk = VERTICAL_VALUES.corin.atk + W_ENGINES[setup.engineId].baseAtk
  const effects = resolveDeliveredClauses([...inbox, ...enemy], { atk: initialAtk })
  const atkInputs = presentSetupInputs([
    engineAdvancedInput(setup, 'corin', 'atkPct'),
    mainStatInput(setup, 'corin', 'slot5', 'atkPct'),
    mainStatInput(setup, 'corin', 'slot6', 'atkPct'),
    ...selectedDiscTwoPieceInputs(setup, 'corin', { modifier: 'atk' }),
    effectiveSubstatInput(setup, 'corin', 'atkPct'),
  ])
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
    engineAdvancedInput(setup, 'corin', 'critRate'),
    mainStatInput(setup, 'corin', 'slot4', 'critRate'),
    ...selectedDiscTwoPieceInputs(setup, 'corin', { modifier: 'critRate' }),
    effectiveSubstatInput(setup, 'corin', 'critRate'),
  ])
  const critRateBase = VERTICAL_VALUES.corin.critRate
    + critRateInputs.reduce((total, input) => total + input.rawValue, 0)
  const critRate = composeMetricEffects(
    surfaces(critRateBase, critRateBase, critRateBase),
    surfaces(critRateInputs.map((input) => contribution(input.source, input.rawValue)), [], []),
    effects,
    'critRate',
    { value: 100, source: STATIC_SOURCES.corin.critCap },
  )

  const critDmgInputs = presentSetupInputs([
    engineAdvancedInput(setup, 'corin', 'critDmg'),
    mainStatInput(setup, 'corin', 'slot4', 'critDmg'),
    ...selectedDiscTwoPieceInputs(setup, 'corin', { modifier: 'critDmg' }),
    effectiveSubstatInput(setup, 'corin', 'critDmg'),
  ])
  const critDmgBase = VERTICAL_VALUES.corin.critDmg
    + critDmgInputs.reduce((total, input) => total + input.rawValue, 0)
  const critDmg = composeMetricEffects(
    surfaces(critDmgBase, critDmgBase, critDmgBase),
    surfaces(critDmgInputs.map((input) => contribution(input.source, input.rawValue)), [], []),
    effects,
    'critDmg',
  )

  const dmgInputs = presentSetupInputs([
    mainStatInput(setup, 'corin', 'slot5', 'physicalDmg'),
    ...selectedDiscTwoPieceInputs(setup, 'corin', { modifier: 'dmgBonus' }),
  ])
  const dmgBase = dmgInputs.reduce((total, input) => total + input.rawValue, 0)
  const dmg = composeMetricEffects(
    surfaces(dmgBase, dmgBase, dmgBase),
    surfaces(dmgInputs.map((input) => contribution(input.source, input.rawValue)), [], []),
    effects,
    'dmgBonus',
  )

  const penInputs = presentSetupInputs([
    mainStatInput(setup, 'corin', 'slot5', 'penRatio'),
    ...selectedDiscTwoPieceInputs(setup, 'corin', { modifier: 'penRatio' }),
  ])
  const penBase = penInputs.reduce((total, input) => total + input.rawValue, 0)
  const pen = composeMetricEffects(
    surfaces(penBase, penBase, penBase),
    surfaces(penInputs.map((input) => contribution(input.source, input.rawValue)), [], []),
    effects,
    'penRatio',
  )

  const defIgnore = composeMetricEffects(
    surfaces(0, 0, 0),
    surfaces([], [], []),
    effects,
    'defIgnore',
  )
  const actionModifiers = [
    ...composeActionHierarchy(dmg.values, effects, 'dmgBonus', CORIN_DAMAGE_SCOPES),
    ...composeActionHierarchy(
      defIgnore.values,
      effects,
      'defIgnore',
      CORIN_DEF_SCOPES,
      'DefIgnore',
    ),
  ]

  return {
    agentId: 'corin',
    metrics: [
      { id: 'atk', label: 'ATK', unit: '', decimals: 0, ...atk },
      { id: 'critRate', label: 'CRIT Rate', unit: '%', decimals: 1, ...critRate },
      { id: 'critDmg', label: 'CRIT DMG', unit: '%', decimals: 1, ...critDmg },
      { id: 'dmgBonus', label: 'DMG Bonus', unit: '%', decimals: 1, ...dmg },
      ...(pen.values.fully
        ? [{ id: 'penRatio' as const, label: 'PEN Ratio', unit: '%', decimals: 1, ...pen }]
        : []),
      ...optionalMetric('defIgnore', 'DEF Ignore', effects, actionModifiers),
      ...optionalMetric('defReduction', 'DEF Reduction', effects),
      ...optionalMetric('resIgnore', 'RES Ignore', effects),
      ...optionalMetric('resReduction', 'RES Reduction', effects),
      ...optionalMetric('stunDmgMultiplier', 'Stun DMG Multiplier', effects),
      ...optionalMetric('energyRegen', 'Energy Regen', effects, [], '/s', 2),
    ],
    actionModifiers,
    operations: [],
  }
}
