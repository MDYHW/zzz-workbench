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
  pufferElectroFourPieceClauses,
  resolveDeliveredClauses,
  source,
  withApplicability,
  type CompleteSetup,
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

export interface Soldier11CalculationContext {
  agentId: 'soldier11'
  setup: CompleteSetup
  additionalActive: boolean
  initialAtk: number
}

const SOLDIER11_BASIC = actionTarget([canonicalAction('Basic Attack')])
const SOLDIER11_DASH = actionTarget([canonicalAction('Dash Attack')])
const SOLDIER11_DODGE_COUNTER = actionTarget([canonicalAction('Dodge Counter')])
const SOLDIER11_FIRE_SUPPRESSION_BASIC = actionTarget([
  sourceLocalAction('Fire Suppression Basic Attack', 'Basic Attack'),
])
const SOLDIER11_FIRE_SUPPRESSION_DASH = actionTarget([
  sourceLocalAction('Fire Suppression Dash Attack', 'Dash Attack'),
])
const SOLDIER11_CHAIN_ULTIMATE = actionTarget([
  canonicalAction('Chain Attack'),
  canonicalAction('Ultimate'),
])
const SOLDIER11_BASIC_ULTIMATE = actionTarget([
  canonicalAction('Basic Attack'),
  canonicalAction('Ultimate'),
])
const SOLDIER11_ULTIMATE = actionTarget([canonicalAction('Ultimate')])
const SOLDIER11_STUNNED = actionTarget([sourceLocalAction('Against Stunned enemies')])

const SOLDIER11_DAMAGE_SCOPES = [
  {
    id: 'soldier11Basic', target: SOLDIER11_BASIC,
    children: [{ id: 'soldier11FireSuppressionBasic', target: SOLDIER11_FIRE_SUPPRESSION_BASIC }],
  },
  {
    id: 'soldier11Dash', target: SOLDIER11_DASH,
    children: [{ id: 'soldier11FireSuppressionDash', target: SOLDIER11_FIRE_SUPPRESSION_DASH }],
  },
  { id: 'soldier11DodgeCounter', target: SOLDIER11_DODGE_COUNTER },
  { id: 'soldier11Ultimate', target: SOLDIER11_ULTIMATE },
  { id: 'soldier11AgainstStunnedEnemies', target: SOLDIER11_STUNNED },
] satisfies readonly ActionScopeNode[]
const SOLDIER11_RES_SCOPES = [
  { id: 'soldier11ChainUltimate', target: SOLDIER11_CHAIN_ULTIMATE },
  { id: 'soldier11FireSuppressionBasic', target: SOLDIER11_FIRE_SUPPRESSION_BASIC },
  { id: 'soldier11FireSuppressionDash', target: SOLDIER11_FIRE_SUPPRESSION_DASH },
] satisfies readonly ActionScopeNode[]
const SOLDIER11_DEF_SCOPES = [
  { id: 'soldier11BasicUltimate', target: SOLDIER11_BASIC_ULTIMATE },
] satisfies readonly ActionScopeNode[]

export function observeSoldier11(
  setup: CompleteSetup,
  additionalActive: boolean,
): Soldier11CalculationContext {
  const initialAtk = initialAtkFor('soldier11', setup)
  if (initialAtk === null) throw new Error('Complete Soldier 11 setup requires a W-Engine')
  return { agentId: 'soldier11', setup, additionalActive, initialAtk }
}

function dawnClauses(setup: CompleteSetup): SourceBoundCurrentClause[] {
  if (setup.fourPieceId !== 'dawnsBloom') return []
  const twoPiece = equipmentEffectBaseValue(DRIVE_DISC_FACTS.dawnsBloom.twoPiece.damage)
  const fourPiece = equipmentEffectBaseValue(DRIVE_DISC_FACTS.dawnsBloom.fourPiece.damage)
  const fully = equipmentEffectProgressionValue(DRIVE_DISC_FACTS.dawnsBloom.fourPiece.damage)
  return [
    additive('dmgBonus', 'initial', discSource('soldier11', 'dawnsBloom', '2-piece', '4-piece'), twoPiece, 'self', SOLDIER11_BASIC),
    additive('dmgBonus', 'combat', discSource('soldier11', 'dawnsBloom', '4-piece'), fourPiece, 'self', SOLDIER11_BASIC),
    additive('dmgBonus', 'fully', discSource('soldier11', 'dawnsBloom', '4-piece'), fully, 'self', SOLDIER11_BASIC),
  ]
}

export function resolveSoldier11ProviderClauses(
  context: Soldier11CalculationContext,
): SourceBoundCurrentClause[] {
  const { setup, additionalActive } = context
  const values = VERTICAL_VALUES.soldier11
  const engine = engineSource('soldier11', setup)
  const refinement = setup.refinement
  const soldier11Source = {
    core: source(SOURCE_LABELS.soldier11Core, 'soldier11', 'core'),
    additional: source(SOURCE_LABELS.soldier11Ability, 'soldier11', 'additional'),
    potential: source(SOURCE_LABELS.soldier11Potential, 'soldier11', 'special'),
  }

  return active([
    ...[SOLDIER11_FIRE_SUPPRESSION_BASIC, SOLDIER11_FIRE_SUPPRESSION_DASH].map((target) => (
      withApplicability(
        additive('dmgBonus', 'fully', soldier11Source.core, values.coreActionFireDmg,
          'self', target),
        { attributes: ['Fire'] },
      )
    )),
    withApplicability(
      additive('dmgBonus', 'fully', soldier11Source.additional,
        additionalActive ? values.additionalFireDmg : 0, 'self'),
      { attributes: ['Fire'] },
    ),
    withApplicability(
      additive('dmgBonus', 'fully', soldier11Source.additional,
        additionalActive ? values.additionalStunnedFireDmg : 0, 'self', SOLDIER11_STUNNED),
      { attributes: ['Fire'] },
    ),
    additive('critDmg', 'fully', soldier11Source.potential,
      additionalActive ? values.potentialCritDmg : 0, 'self'),
    ...[SOLDIER11_BASIC, SOLDIER11_DASH, SOLDIER11_DODGE_COUNTER].map((target) => (
      additive('dmgBonus', 'fully', mindscapeSource('soldier11', 2, 'Full stacks'),
        setup.mindscape >= 2 ? values.mindscapeActionDmg : 0, 'self', target)
    )),
    ...[SOLDIER11_FIRE_SUPPRESSION_BASIC, SOLDIER11_FIRE_SUPPRESSION_DASH].map((target) => (
      withApplicability(
        additive('resIgnore', 'fully', mindscapeSource('soldier11', 6, 'Fire Suppression after Charge'),
          setup.mindscape >= 6 ? values.mindscapeFireResIgnore : 0,
          'enemy-context', target, undefined, ['soldier11']),
        { attributes: ['Fire'] },
      )
    )),
    additive('critDmg', 'combat', engine,
      setup.engineId === 'heartstringNocturne'
        ? equipmentEffectBaseValue(W_ENGINE_FACTS.heartstringNocturne.effects.critDamage, refinement)
        : setup.engineId === 'myriadEclipse'
          ? equipmentEffectBaseValue(W_ENGINE_FACTS.myriadEclipse.effects.critDamage, refinement)
          : setup.engineId === 'severedInnocence'
            ? equipmentEffectBaseValue(W_ENGINE_FACTS.severedInnocence.effects.critDamage, refinement)
            : 0,
      'self'),
    additive('critDmg', 'fully', engine,
      setup.engineId === 'severedInnocence'
        ? equipmentEffectProgressionValue(W_ENGINE_FACTS.severedInnocence.effects.critDamage, refinement)
        : 0,
      'self'),
    withApplicability(
      additive('resIgnore', 'fully', engine,
        setup.engineId === 'heartstringNocturne'
          ? equipmentEffectMaximumValue(W_ENGINE_FACTS.heartstringNocturne.effects.fireResIgnore, refinement)
          : 0,
        'enemy-context', SOLDIER11_CHAIN_ULTIMATE, undefined, ['soldier11']),
      { attributes: ['Fire'] },
    ),
    additive('critRate', 'combat', engine,
      setup.engineId === 'cordisGermina'
        ? equipmentEffectBaseValue(W_ENGINE_FACTS.cordisGermina.effects.critRate, refinement)
        : 0,
      'self'),
    additive('defIgnore', 'fully', engine,
      setup.engineId === 'cordisGermina'
        ? equipmentEffectBaseValue(W_ENGINE_FACTS.cordisGermina.effects.defIgnore, refinement)
        : 0,
      'enemy-context', SOLDIER11_BASIC_ULTIMATE, undefined, ['soldier11']),
    percentage('atk', 'combat', engine,
      setup.engineId === 'brimstone'
        ? equipmentEffectMaximumValue(W_ENGINE_FACTS.brimstone.effects.atk, refinement)
        : setup.engineId === 'starlightEngine'
          ? equipmentEffectBaseValue(W_ENGINE_FACTS.starlightEngine.effects.atk, refinement)
          : 0,
      'self'),
    percentage('atk', 'combat', discSource('soldier11', 'woodpecker', '4-piece'),
      setup.fourPieceId === 'woodpecker'
        ? equipmentEffectBaseValue(DRIVE_DISC_FACTS.woodpecker.fourPiece.atk)
        : 0,
      'self'),
    ...dawnClauses(setup),
    ...pufferElectroFourPieceClauses('soldier11', setup, SOLDIER11_ULTIMATE),
  ])
}

export function calculateSoldier11(
  context: Soldier11CalculationContext,
  inbox: SourceBoundCurrentClause[],
  enemy: SourceBoundCurrentClause[],
): AgentResult {
  const { setup, initialAtk } = context
  const values = VERTICAL_VALUES.soldier11
  const baseAtk = values.atk + W_ENGINES[setup.engineId].baseAtk
  const effects = resolveDeliveredClauses([...inbox, ...enemy], { atk: initialAtk })
  const atkInputs = [
    engineAdvancedInput(setup, 'soldier11', 'atkPct'),
    mainStatInput(setup, 'soldier11', 'slot5', 'atkPct'),
    mainStatInput(setup, 'soldier11', 'slot6', 'atkPct'),
    discStatInput(setup, 'soldier11', 'twoPiece', 'astralVoice', equipmentEffectBaseValue(DRIVE_DISC_FACTS.astralVoice.twoPiece.atk)),
    discStatInput(setup, 'soldier11', 'twoPiece', 'hormonePunk', equipmentEffectBaseValue(DRIVE_DISC_FACTS.hormonePunk.twoPiece.atk)),
    effectiveSubstatInput(setup, 'soldier11', 'atkPct'),
  ].filter((input): input is NonNullable<typeof input> => input !== undefined)
  const atk = composeMetricEffects(
    surfaces(initialAtk, initialAtk, initialAtk),
    surfaces(atkInputs.map((input) => percentageContribution(input.source, baseAtk * input.rawValue / 100, input.rawValue)), [], []),
    effects,
    'atk',
  )
  const critRateInputs = [
    engineAdvancedInput(setup, 'soldier11', 'critRate'),
    mainStatInput(setup, 'soldier11', 'slot4', 'critRate'),
    discStatInput(setup, 'soldier11', 'fourPiece', 'woodpecker', equipmentEffectBaseValue(DRIVE_DISC_FACTS.woodpecker.twoPiece.critRate), 'twoPiece'),
    discStatInput(setup, 'soldier11', 'twoPiece', 'woodpecker', equipmentEffectBaseValue(DRIVE_DISC_FACTS.woodpecker.twoPiece.critRate)),
    effectiveSubstatInput(setup, 'soldier11', 'critRate'),
  ].filter((input): input is NonNullable<typeof input> => input !== undefined)
  const critRateBase = values.critRate + critRateInputs.reduce((sum, input) => sum + input.rawValue, 0)
  const critRate = composeMetricEffects(surfaces(critRateBase, critRateBase, critRateBase), surfaces(critRateInputs.map((input) => contribution(input.source, input.rawValue)), [], []), effects, 'critRate', { value: 100, source: source('CRIT Rate cap', 'soldier11', 'calculation') })
  const critDmgInputs = [
    engineAdvancedInput(setup, 'soldier11', 'critDmg'),
    mainStatInput(setup, 'soldier11', 'slot4', 'critDmg'),
    discStatInput(setup, 'soldier11', 'twoPiece', 'branchAndBlade', equipmentEffectBaseValue(DRIVE_DISC_FACTS.branchAndBlade.twoPiece.critDamage)),
    effectiveSubstatInput(setup, 'soldier11', 'critDmg'),
  ].filter((input): input is NonNullable<typeof input> => input !== undefined)
  const critDmgBase = values.critDmg + critDmgInputs.reduce((sum, input) => sum + input.rawValue, 0)
  const critDmg = composeMetricEffects(surfaces(critDmgBase, critDmgBase, critDmgBase), surfaces(critDmgInputs.map((input) => contribution(input.source, input.rawValue)), [], []), effects, 'critDmg')
  const dmgInputs = [
    mainStatInput(setup, 'soldier11', 'slot5', 'fireDmg'),
    discStatInput(setup, 'soldier11', 'twoPiece', 'infernoMetal', equipmentEffectBaseValue(DRIVE_DISC_FACTS.infernoMetal.twoPiece.damage)),
  ].filter((input): input is NonNullable<typeof input> => input !== undefined)
  const dmgBase = dmgInputs.reduce((sum, input) => sum + input.rawValue, 0)
  const dmg = composeMetricEffects(surfaces(dmgBase, dmgBase, dmgBase), surfaces(dmgInputs.map((input) => contribution(input.source, input.rawValue)), [], []), effects, 'dmgBonus')
  const penInputs = [
    mainStatInput(setup, 'soldier11', 'slot5', 'penRatio'),
    discStatInput(setup, 'soldier11', 'fourPiece', 'pufferElectro', equipmentEffectBaseValue(DRIVE_DISC_FACTS.pufferElectro.twoPiece.penRatio), 'twoPiece'),
    discStatInput(setup, 'soldier11', 'twoPiece', 'pufferElectro', equipmentEffectBaseValue(DRIVE_DISC_FACTS.pufferElectro.twoPiece.penRatio)),
  ].filter((input): input is NonNullable<typeof input> => input !== undefined)
  const penBase = penInputs.reduce((sum, input) => sum + input.rawValue, 0)
  const pen = composeMetricEffects(surfaces(penBase, penBase, penBase), surfaces(penInputs.map((input) => contribution(input.source, input.rawValue)), [], []), effects, 'penRatio')
  const defIgnore = composeMetricEffects(surfaces(0, 0, 0), surfaces([], [], []), effects, 'defIgnore')
  const resIgnore = composeMetricEffects(surfaces(0, 0, 0), surfaces([], [], []), effects, 'resIgnore')
  const resReduction = composeMetricEffects(surfaces(0, 0, 0), surfaces([], [], []), effects, 'resReduction')
  const actions = [
    ...composeActionHierarchy(dmg.values, effects, 'dmgBonus', SOLDIER11_DAMAGE_SCOPES),
    ...composeActionHierarchy(defIgnore.values, effects, 'defIgnore', SOLDIER11_DEF_SCOPES, 'DefIgnore'),
    ...composeActionHierarchy(resIgnore.values, effects, 'resIgnore', SOLDIER11_RES_SCOPES, 'ResIgnore'),
  ]
  return {
    agentId: 'soldier11',
    metrics: [
      { id: 'atk', label: 'ATK', unit: '', decimals: 0, ...atk },
      { id: 'critRate', label: 'CRIT Rate', unit: '%', decimals: 1, ...critRate },
      { id: 'critDmg', label: 'CRIT DMG', unit: '%', decimals: 1, ...critDmg },
      { id: 'dmgBonus', label: 'DMG Bonus', unit: '%', decimals: 1, ...dmg },
      { id: 'penRatio', label: 'PEN Ratio', unit: '%', decimals: 1, ...pen },
      ...(actions.some(({ metricId }) => metricId === 'defIgnore') ? [{ id: 'defIgnore' as const, label: 'DEF Ignore', unit: '%', decimals: 1, ...defIgnore }] : []),
      ...(actions.some(({ metricId }) => metricId === 'resIgnore') ? [{ id: 'resIgnore' as const, label: 'RES Ignore', unit: '%', decimals: 1, ...resIgnore }] : []),
      ...(resReduction.values.fully ? [{ id: 'resReduction' as const, label: 'RES Reduction', unit: '%', decimals: 1, ...resReduction }] : []),
    ],
    actionModifiers: actions,
    operations: [],
  }
}
