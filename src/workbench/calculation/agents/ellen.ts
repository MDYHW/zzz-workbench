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
  effectiveSubstatInput,
  engineAdvancedInput,
  engineSource,
  mainStatInput,
  mindscapeSource,
  percentage,
  pufferElectroFourPieceClauses,
  resolveDeliveredClauses,
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

export interface EllenCalculationContext {
  agentId: 'ellen'
  setup: CompleteSetup
  additionalActive: boolean
  initialAtk: number
}

const ELLEN_CORE_ACTIONS = actionTarget([
  sourceLocalAction('Charged Arctic Ambush', 'Dash Attack'),
  sourceLocalAction('Flash Freeze Basic', 'Basic Attack'),
  sourceLocalAction('Icy Blade', 'Basic Attack'),
  sourceLocalAction('Glacial Blade Wave', 'Basic Attack'),
  canonicalAction('Chain Attack'),
  canonicalAction('Ultimate'),
])
const ELLEN_EX = actionTarget([canonicalAction('EX Special Attack')])
const ELLEN_ULTIMATE = actionTarget([canonicalAction('Ultimate')])
const ELLEN_CHARGED = actionTarget([sourceLocalAction('Charged Arctic Ambush', 'Dash Attack')])
const ELLEN_BASIC_ULTIMATE = actionTarget([canonicalAction('Basic Attack'), canonicalAction('Ultimate')])
const ELLEN_BACK_ATTACK = actionTarget([sourceLocalAction('Back attacks')])
const ELLEN_DAMAGE_SCOPES = [
  { id: 'ellenCoreActions', target: ELLEN_CORE_ACTIONS },
  { id: 'ellenEx', target: ELLEN_EX },
  { id: 'ellenCharged', target: ELLEN_CHARGED },
  { id: 'ellenUltimate', target: ELLEN_ULTIMATE },
  { id: 'ellenBackAttack', target: ELLEN_BACK_ATTACK },
] satisfies readonly ActionScopeNode[]
const ELLEN_CRIT_DMG_SCOPES = [
  { id: 'ellenCoreCritDmg', target: ELLEN_CORE_ACTIONS },
  { id: 'ellenExCritDmg', target: ELLEN_EX },
] satisfies readonly ActionScopeNode[]
const ELLEN_DEF_SCOPES = [
  { id: 'ellenBasicUltimate', target: ELLEN_BASIC_ULTIMATE },
] satisfies readonly ActionScopeNode[]

export function observeEllen(setup: CompleteSetup, additionalActive: boolean): EllenCalculationContext {
  const initialAtk = initialAtkFor('ellen', setup)
  if (initialAtk === null) throw new Error('Complete Ellen setup requires a W-Engine')
  return { agentId: 'ellen', setup, additionalActive, initialAtk }
}

export function resolveEllenProviderClauses(context: EllenCalculationContext): SourceBoundCurrentClause[] {
  const { setup } = context
  const values = VERTICAL_VALUES.ellen
  const engine = engineSource('ellen', setup)
  const refinement = setup.refinement
  return active([
    additive('critDmg', 'fully', STATIC_SOURCES.ellen.core, values.coreCritDmg, 'self', ELLEN_CORE_ACTIONS),
    withApplicability(
      additive('dmgBonus', 'fully', STATIC_SOURCES.ellen.additional,
        context.additionalActive ? values.additionalIceDmg : 0, 'self'),
      { attributes: ['Ice'] },
    ),
    additive('critDmg', 'fully', STATIC_SOURCES.ellen.potential, values.potentialCritDmg, 'self', ELLEN_CORE_ACTIONS),
    withApplicability(
      additive('resIgnore', 'fully', STATIC_SOURCES.ellen.potential,
        values.potentialIceResIgnore, 'enemy-context', undefined, undefined, ['ellen']),
      { attributes: ['Ice'] },
    ),
    additive('critRate', 'combat', mindscapeSource('ellen', 1), setup.mindscape >= 1 ? values.mindscapeCritRate : 0, 'self'),
    additive('critDmg', 'fully', mindscapeSource('ellen', 2, 'EX Special Attack'), setup.mindscape >= 2 ? values.mindscapeExCritDmg : 0, 'self', ELLEN_EX),
    additive('penRatio', 'fully', mindscapeSource('ellen', 6), setup.mindscape >= 6 ? values.mindscapePenRatio : 0, 'self'),
    additive('dmgBonus', 'fully', mindscapeSource('ellen', 6, 'Full stacks'), setup.mindscape >= 6 ? values.mindscapeChargedDmg : 0, 'self', ELLEN_CHARGED),
    withApplicability(
      additive('dmgBonus', 'combat', engine,
        setup.engineId === 'deepSeaVisitor'
          ? equipmentEffectBaseValue(W_ENGINE_FACTS.deepSeaVisitor.effects.iceDamage, refinement) : 0,
        'self'),
      { attributes: ['Ice'] },
    ),
    additive('critRate', 'combat', engine,
      setup.engineId === 'deepSeaVisitor'
        ? equipmentEffectBaseValue(W_ENGINE_FACTS.deepSeaVisitor.effects.basicCritRate, refinement) : 0,
      'self',
    ),
    additive('critRate', 'combat', engine,
      setup.engineId === 'deepSeaVisitor'
        ? equipmentEffectBaseValue(W_ENGINE_FACTS.deepSeaVisitor.effects.dashCritRate, refinement) : 0,
      'self',
    ),
    additive('critDmg', 'combat', engine,
      setup.engineId === 'myriadEclipse' ? equipmentEffectBaseValue(W_ENGINE_FACTS.myriadEclipse.effects.critDamage, refinement) : 0, 'self'),
    additive('defIgnore', 'fully', engine,
      setup.engineId === 'myriadEclipse' ? equipmentEffectBaseValue(W_ENGINE_FACTS.myriadEclipse.effects.defIgnore, refinement) : 0,
      'enemy-context', undefined, undefined, ['ellen']),
    additive('critRate', 'combat', engine,
      setup.engineId === 'cordisGermina' ? equipmentEffectBaseValue(W_ENGINE_FACTS.cordisGermina.effects.critRate, refinement) : 0, 'self'),
    additive('defIgnore', 'fully', engine,
      setup.engineId === 'cordisGermina' ? equipmentEffectBaseValue(W_ENGINE_FACTS.cordisGermina.effects.defIgnore, refinement) : 0,
      'enemy-context', ELLEN_BASIC_ULTIMATE, undefined, ['ellen']),
    additive('dmgBonus', 'fully', engine,
      setup.engineId === 'steelCushion' ? equipmentEffectBaseValue(W_ENGINE_FACTS.steelCushion.effects.damage, refinement) : 0,
      'self', ELLEN_BACK_ATTACK),
    percentage('atk', 'fully', engine,
      setup.engineId === 'brimstone'
        ? equipmentEffectMaximumValue(W_ENGINE_FACTS.brimstone.effects.atk, refinement) : 0,
      'self'),
    percentage('atk', 'combat', engine,
      setup.engineId === 'starlightEngine'
        ? equipmentEffectBaseValue(W_ENGINE_FACTS.starlightEngine.effects.atk, refinement) : 0,
      'self'),
    percentage('atk', 'combat', discSource('ellen', 'woodpecker', '4-piece'),
      setup.fourPieceId === 'woodpecker'
        ? equipmentEffectBaseValue(DRIVE_DISC_FACTS.woodpecker.fourPiece.atk) : 0,
      'self'),
    ...pufferElectroFourPieceClauses('ellen', setup, ELLEN_ULTIMATE),
  ])
}

export function calculateEllen(context: EllenCalculationContext, inbox: SourceBoundCurrentClause[], enemy: SourceBoundCurrentClause[]): AgentResult {
  const { setup, initialAtk } = context
  const values = VERTICAL_VALUES.ellen
  const baseAtk = values.atk + W_ENGINES[setup.engineId].baseAtk
  const effects = resolveDeliveredClauses([...inbox, ...enemy], { atk: initialAtk })
  const atkInputs = [
    engineAdvancedInput(setup, 'ellen', 'atkPct'), mainStatInput(setup, 'ellen', 'slot5', 'atkPct'), mainStatInput(setup, 'ellen', 'slot6', 'atkPct'),
    discStatInput(setup, 'ellen', 'twoPiece', 'astralVoice', equipmentEffectBaseValue(DRIVE_DISC_FACTS.astralVoice.twoPiece.atk)),
    discStatInput(setup, 'ellen', 'twoPiece', 'hormonePunk', equipmentEffectBaseValue(DRIVE_DISC_FACTS.hormonePunk.twoPiece.atk)),
    effectiveSubstatInput(setup, 'ellen', 'atkPct'),
  ].filter((input): input is NonNullable<typeof input> => input !== undefined)
  const atk = composeMetricEffects(surfaces(initialAtk, initialAtk, initialAtk), surfaces(atkInputs.map((input) => percentageContribution(input.source, baseAtk * input.rawValue / 100, input.rawValue)), [], []), effects, 'atk')
  const critRateInputs = [
    engineAdvancedInput(setup, 'ellen', 'critRate'), mainStatInput(setup, 'ellen', 'slot4', 'critRate'),
    discStatInput(setup, 'ellen', 'fourPiece', 'woodpecker', equipmentEffectBaseValue(DRIVE_DISC_FACTS.woodpecker.twoPiece.critRate), 'twoPiece'),
    discStatInput(setup, 'ellen', 'twoPiece', 'woodpecker', equipmentEffectBaseValue(DRIVE_DISC_FACTS.woodpecker.twoPiece.critRate)), effectiveSubstatInput(setup, 'ellen', 'critRate'),
  ].filter((input): input is NonNullable<typeof input> => input !== undefined)
  const critRateBase = values.critRate + critRateInputs.reduce((sum, input) => sum + input.rawValue, 0)
  const critRate = composeMetricEffects(surfaces(critRateBase, critRateBase, critRateBase), surfaces(critRateInputs.map((input) => contribution(input.source, input.rawValue)), [], []), effects, 'critRate', { value: 100, source: STATIC_SOURCES.ellen.critCap })
  const critDmgInputs = [engineAdvancedInput(setup, 'ellen', 'critDmg'), mainStatInput(setup, 'ellen', 'slot4', 'critDmg'), discStatInput(setup, 'ellen', 'twoPiece', 'branchAndBlade', equipmentEffectBaseValue(DRIVE_DISC_FACTS.branchAndBlade.twoPiece.critDamage)), effectiveSubstatInput(setup, 'ellen', 'critDmg')].filter((input): input is NonNullable<typeof input> => input !== undefined)
  const critDmgBase = values.critDmg + critDmgInputs.reduce((sum, input) => sum + input.rawValue, 0)
  const critDmg = composeMetricEffects(surfaces(critDmgBase, critDmgBase, critDmgBase), surfaces(critDmgInputs.map((input) => contribution(input.source, input.rawValue)), [], []), effects, 'critDmg')
  const dmgInputs = [mainStatInput(setup, 'ellen', 'slot5', 'iceDmg'), discStatInput(setup, 'ellen', 'twoPiece', 'polarMetal', equipmentEffectBaseValue(DRIVE_DISC_FACTS.polarMetal.twoPiece.damage))].filter((input): input is NonNullable<typeof input> => input !== undefined)
  const dmg = composeMetricEffects(surfaces(dmgInputs.reduce((sum, input) => sum + input.rawValue, 0), dmgInputs.reduce((sum, input) => sum + input.rawValue, 0), dmgInputs.reduce((sum, input) => sum + input.rawValue, 0)), surfaces(dmgInputs.map((input) => contribution(input.source, input.rawValue)), [], []), effects, 'dmgBonus')
  const penInputs = [mainStatInput(setup, 'ellen', 'slot5', 'penRatio'), discStatInput(setup, 'ellen', 'twoPiece', 'pufferElectro', equipmentEffectBaseValue(DRIVE_DISC_FACTS.pufferElectro.twoPiece.penRatio))].filter((input): input is NonNullable<typeof input> => input !== undefined)
  const pen = composeMetricEffects(surfaces(penInputs.reduce((sum, input) => sum + input.rawValue, 0), penInputs.reduce((sum, input) => sum + input.rawValue, 0), penInputs.reduce((sum, input) => sum + input.rawValue, 0)), surfaces(penInputs.map((input) => contribution(input.source, input.rawValue)), [], []), effects, 'penRatio')
  const defIgnore = composeMetricEffects(surfaces(0, 0, 0), surfaces([], [], []), effects, 'defIgnore')
  const resIgnore = composeMetricEffects(surfaces(0, 0, 0), surfaces([], [], []), effects, 'resIgnore')
  const resReduction = composeMetricEffects(surfaces(0, 0, 0), surfaces([], [], []), effects, 'resReduction')
  const actionModifiers = [
    ...composeActionHierarchy(critDmg.values, effects, 'critDmg', ELLEN_CRIT_DMG_SCOPES),
    ...composeActionHierarchy(dmg.values, effects, 'dmgBonus', ELLEN_DAMAGE_SCOPES),
    ...composeActionHierarchy(defIgnore.values, effects, 'defIgnore', ELLEN_DEF_SCOPES, 'Def Ignore'),
  ]
  return { agentId: 'ellen', metrics: [
    { id: 'atk', label: 'ATK', unit: '', decimals: 0, ...atk }, { id: 'critRate', label: 'CRIT Rate', unit: '%', decimals: 1, ...critRate }, { id: 'critDmg', label: 'CRIT DMG', unit: '%', decimals: 1, ...critDmg }, { id: 'dmgBonus', label: 'DMG Bonus', unit: '%', decimals: 1, ...dmg }, { id: 'penRatio', label: 'PEN Ratio', unit: '%', decimals: 1, ...pen },
    ...(defIgnore.values.fully || actionModifiers.some(({ metricId }) => metricId === 'defIgnore')
      ? [{ id: 'defIgnore' as const, label: 'DEF Ignore', unit: '%', decimals: 1, ...defIgnore }]
      : []),
    ...(resIgnore.values.fully ? [{ id: 'resIgnore' as const, label: 'RES Ignore', unit: '%', decimals: 1, ...resIgnore }] : []),
    ...(resReduction.values.fully ? [{ id: 'resReduction' as const, label: 'RES Reduction', unit: '%', decimals: 1, ...resReduction }] : []),
  ], actionModifiers, operations: [] }
}
