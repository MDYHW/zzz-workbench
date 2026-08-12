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
  presentSetupInputs,
  resolveDeliveredClauses,
  withApplicability,
  type CompleteSetup,
  type EffectMetric,
  type ResolvedCurrentEffect,
  type ResolvedSetupInput,
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
import type { AgentResult } from '../result'
import { composeRuptureSheerForce } from '../rupture'

export interface ManatoCalculationContext {
  agentId: 'manato'
  setup: CompleteSetup
}

const MANATO_EX_SPECIAL = actionTarget([canonicalAction('EX Special Attack')])
const MANATO_BASIC_ASSIST = actionTarget([
  canonicalAction('Basic Attack'),
  canonicalAction('Assist Follow-Up'),
])
const MANATO_ASSIST = actionTarget([canonicalAction('Assist Follow-Up')])
const MANATO_CRIT_SCOPES = [
  { id: 'manatoBasicAssistCritDmg', target: MANATO_BASIC_ASSIST },
] satisfies readonly ActionScopeNode[]
const MANATO_DMG_SCOPES = [{
  id: 'manatoBasicAssistFireDmg',
  target: MANATO_BASIC_ASSIST,
  children: [{ id: 'manatoAssistFireDmg', target: MANATO_ASSIST }],
}] satisfies readonly ActionScopeNode[]
const MANATO_EX_SCOPES = [
  { id: 'manatoExSpecial', target: MANATO_EX_SPECIAL },
] satisfies readonly ActionScopeNode[]

export const observeManato = (setup: CompleteSetup): ManatoCalculationContext => ({
  agentId: 'manato',
  setup,
})

export function resolveManatoProviderClauses(
  setup: CompleteSetup,
): SourceBoundCurrentClause[] {
  const values = VERTICAL_VALUES.manato
  const engine = engineSource('manato', setup)
  const fourPiece = discSource('manato', setup.fourPieceId, '4-piece')
  const refinement = setup.refinement

  return active([
    additive('critRate', 'fully', STATIC_SOURCES.manato.core,
      values.moltenCritRate, 'self'),
    withApplicability(
      additive('dmgBonus', 'fully', STATIC_SOURCES.manato.core,
        values.moltenFireDmg, 'self'),
      { attributes: ['Fire'], formulas: ['sheer_damage'] },
    ),
    additive('critDmg', 'fully', STATIC_SOURCES.manato.core,
      values.coreActionCritDmg, 'self', MANATO_BASIC_ASSIST),
    withApplicability(
      additive('dmgBonus', 'fully', mindscapeSource('manato', 1),
        setup.mindscape >= 1 ? values.mindscapeActionFireDmg : 0,
        'self', MANATO_BASIC_ASSIST),
      { attributes: ['Fire'], formulas: ['sheer_damage'] },
    ),
    withApplicability(
      additive('resIgnore', 'fully', mindscapeSource('manato', 2, 'Fire RES Ignore'),
        setup.mindscape >= 2 ? values.mindscapeFireResIgnore : 0,
        'enemy-context', undefined, undefined, ['manato']),
      { attributes: ['Fire'], formulas: ['sheer_damage'] },
    ),
    withApplicability(
      additive('dmgBonus', 'fully', mindscapeSource('manato', 6),
        setup.mindscape >= 6 ? values.mindscapeAssistFireDmg : 0,
        'self', MANATO_ASSIST),
      { attributes: ['Fire'], formulas: ['sheer_damage'] },
    ),

    additive('critRate', 'combat', engine,
      setup.engineId === 'qingming'
        ? equipmentEffectBaseValue(W_ENGINE_FACTS.qingming.effects.critRate, refinement)
        : setup.engineId === 'wrathfulVajra'
          ? equipmentEffectBaseValue(W_ENGINE_FACTS.wrathfulVajra.effects.critRate, refinement)
          : 0, 'self'),
    additive('critRate', 'fully', engine,
      setup.engineId === 'grillOWisp'
        ? equipmentEffectBaseValue(W_ENGINE_FACTS.grillOWisp.effects.critRate, refinement)
        : setup.engineId === 'cauldron'
          ? equipmentEffectBaseValue(W_ENGINE_FACTS.cauldron.effects.critRate, refinement)
          : 0, 'self'),
    additive('critDmg', 'fully', engine,
      setup.engineId === 'puzzleSphere'
        ? equipmentEffectBaseValue(W_ENGINE_FACTS.puzzleSphere.effects.critDamage, refinement)
        : 0, 'self'),
    withApplicability(
      additive('dmgBonus', 'fully', engine,
        setup.engineId === 'grillOWisp'
          ? equipmentEffectBaseValue(W_ENGINE_FACTS.grillOWisp.effects.fireDamage, refinement)
          : 0, 'self'),
      { attributes: ['Fire'], formulas: ['sheer_damage'] },
    ),
    additive('dmgBonus', 'fully', engine,
      setup.engineId === 'cauldron'
        ? equipmentEffectBaseValue(W_ENGINE_FACTS.cauldron.effects.damage, refinement)
        : 0, 'self'),
    additive('dmgBonus', 'fully', engine,
      setup.engineId === 'puzzleSphere'
        ? equipmentEffectBaseValue(W_ENGINE_FACTS.puzzleSphere.effects.damage, refinement)
        : 0, 'self', MANATO_EX_SPECIAL),
    additive('sheerForce', 'fully', engine,
      setup.engineId === 'radiowave'
        ? equipmentEffectBaseValue(W_ENGINE_FACTS.radiowave.effects.sheerForce, refinement)
        : 0, 'self'),
    withApplicability(
      additive('sheerDmgBonus', 'fully', engine,
        setup.engineId === 'wrathfulVajra'
          ? equipmentEffectMaximumValue(W_ENGINE_FACTS.wrathfulVajra.effects.fireSheerDamage, refinement)
          : 0, 'self', MANATO_EX_SPECIAL),
      { attributes: ['Fire'], formulas: ['sheer_damage'] },
    ),
    additive('critRate', 'fully', fourPiece,
      setup.fourPieceId === 'yunkui'
        ? equipmentEffectBaseValue(DRIVE_DISC_FACTS.yunkui.fourPiece.critRate)
        : 0, 'self'),
    additive('sheerDmgBonus', 'fully', fourPiece,
      setup.fourPieceId === 'yunkui'
        ? equipmentEffectBaseValue(DRIVE_DISC_FACTS.yunkui.fourPiece.sheerDamage)
        : 0, 'self'),
  ])
}

function optionalMetric(
  metricId: EffectMetric,
  label: string,
  effects: ResolvedCurrentEffect[],
): AgentResult['metrics'] {
  const metric = composeMetricEffects(
    surfaces(0, 0, 0), surfaces([], [], []), effects, metricId,
  )
  return metric.values.fully === 0
    ? []
    : [{ id: metricId, label, unit: '%', decimals: 1, ...metric }]
}

function manatoHpInputs(setup: CompleteSetup): ResolvedSetupInput[] {
  const values = VERTICAL_VALUES.manato
  return [
    {
      rawValue: values.coreHp,
      unit: '%',
      source: STATIC_SOURCES.manato.coreHp,
    },
    ...(setup.mindscape >= 4 ? [{
      rawValue: values.mindscapeHp,
      unit: '%' as const,
      source: mindscapeSource('manato', 4),
    }] : []),
    ...presentSetupInputs([
      engineAdvancedInput(setup, 'manato', 'hpPct'),
      discStatInput(setup, 'manato', 'fourPiece', 'yunkui',
        equipmentEffectBaseValue(DRIVE_DISC_FACTS.yunkui.twoPiece.maxHp), 'twoPiece'),
      mainStatInput(setup, 'manato', 'slot5', 'hpPct'),
      mainStatInput(setup, 'manato', 'slot6', 'hpPct'),
      effectiveSubstatInput(setup, 'manato', 'hpPct'),
    ]),
  ]
}

export function calculateManato(
  setup: CompleteSetup,
  inbox: SourceBoundCurrentClause[],
  enemy: SourceBoundCurrentClause[],
): AgentResult {
  const values = VERTICAL_VALUES.manato
  const engine = W_ENGINES[setup.engineId]
  const baseAtk = values.atk + engine.baseAtk
  const hpInputs = manatoHpInputs(setup)
  const initialHp = values.hp * (
    1 + hpInputs.reduce((total, input) => total + input.rawValue, 0) / 100
  ) + VERTICAL_VALUES.fixedDisc.hp
  const atkInputs = presentSetupInputs([
    engineAdvancedInput(setup, 'manato', 'atkPct'),
  ])
  const initialAtk = baseAtk * (
    1 + atkInputs.reduce((total, input) => total + input.rawValue, 0) / 100
  ) + VERTICAL_VALUES.fixedDisc.atk
  const effects = resolveDeliveredClauses([...inbox, ...enemy], {
    maxHp: initialHp,
    atk: initialAtk,
  })

  const maxHp = composeMetricEffects(
    surfaces(initialHp, initialHp, initialHp),
    surfaces(hpInputs.map((input) => percentageContribution(
      input.source, values.hp * input.rawValue / 100, input.rawValue,
    )), [], []),
    effects,
    'maxHp',
  )
  const atk = composeMetricEffects(
    surfaces(initialAtk, initialAtk, initialAtk),
    surfaces(atkInputs.map((input) => percentageContribution(
      input.source, baseAtk * input.rawValue / 100, input.rawValue,
    )), [], []),
    effects,
    'atk',
  )
  const sheerForce = composeRuptureSheerForce(
    atk.values, maxHp.values, STATIC_SOURCES.manato.ruptureConversion, effects,
  )

  const critRateInputs = presentSetupInputs([
    mainStatInput(setup, 'manato', 'slot4', 'critRate'),
    discStatInput(setup, 'manato', 'twoPiece', 'woodpecker',
      equipmentEffectBaseValue(DRIVE_DISC_FACTS.woodpecker.twoPiece.critRate)),
    effectiveSubstatInput(setup, 'manato', 'critRate'),
  ])
  const initialCritRate = values.critRate
    + critRateInputs.reduce((total, input) => total + input.rawValue, 0)
  const critRate = composeMetricEffects(
    surfaces(initialCritRate, initialCritRate, initialCritRate),
    surfaces(critRateInputs.map((input) => contribution(input.source, input.rawValue)), [], []),
    effects,
    'critRate',
    { value: 100, source: STATIC_SOURCES.manato.critCap },
  )
  const critDmgInputs = presentSetupInputs([
    mainStatInput(setup, 'manato', 'slot4', 'critDmg'),
    discStatInput(setup, 'manato', 'twoPiece', 'branchAndBlade',
      equipmentEffectBaseValue(DRIVE_DISC_FACTS.branchAndBlade.twoPiece.critDamage)),
    effectiveSubstatInput(setup, 'manato', 'critDmg'),
  ])
  const initialCritDmg = values.critDmg
    + critDmgInputs.reduce((total, input) => total + input.rawValue, 0)
  const critDmg = composeMetricEffects(
    surfaces(initialCritDmg, initialCritDmg, initialCritDmg),
    surfaces(critDmgInputs.map((input) => contribution(input.source, input.rawValue)), [], []),
    effects,
    'critDmg',
  )
  const dmgInputs = presentSetupInputs([
    mainStatInput(setup, 'manato', 'slot5', 'fireDmg'),
    discStatInput(setup, 'manato', 'twoPiece', 'infernoMetal',
      equipmentEffectBaseValue(DRIVE_DISC_FACTS.infernoMetal.twoPiece.damage)),
  ])
  const initialDmg = dmgInputs.reduce((total, input) => total + input.rawValue, 0)
  const dmgBonus = composeMetricEffects(
    surfaces(initialDmg, initialDmg, initialDmg),
    surfaces(dmgInputs.map((input) => contribution(input.source, input.rawValue)), [], []),
    effects,
    'dmgBonus',
  )
  const sheerDmgBonus = composeMetricEffects(
    surfaces(0, 0, 0), surfaces([], [], []), effects, 'sheerDmgBonus',
  )
  const actionModifiers = [
    ...composeActionHierarchy(critDmg.values, effects, 'critDmg', MANATO_CRIT_SCOPES),
    ...composeActionHierarchy(dmgBonus.values, effects, 'dmgBonus', MANATO_DMG_SCOPES),
    ...composeActionHierarchy(dmgBonus.values, effects, 'dmgBonus', MANATO_EX_SCOPES),
    ...composeActionHierarchy(
      sheerDmgBonus.values,
      effects,
      'sheerDmgBonus',
      MANATO_EX_SCOPES,
      'Sheer',
    ),
  ]

  return {
    agentId: 'manato',
    metrics: [
      { id: 'maxHp', label: 'Max HP', unit: '', decimals: 0, ...maxHp },
      { id: 'atk', label: 'ATK', unit: '', decimals: 0, ...atk },
      { id: 'sheerForce', label: 'Sheer Force', unit: '', decimals: 1, ...sheerForce },
      { id: 'critRate', label: 'CRIT Rate', unit: '%', decimals: 1, ...critRate },
      { id: 'critDmg', label: 'CRIT DMG', unit: '%', decimals: 1, ...critDmg },
      { id: 'dmgBonus', label: 'DMG Bonus', unit: '%', decimals: 1, ...dmgBonus },
      { id: 'sheerDmgBonus', label: 'Sheer DMG Bonus', unit: '%', decimals: 1, ...sheerDmgBonus },
      ...optionalMetric('resIgnore', 'RES Ignore', effects),
      ...optionalMetric('resReduction', 'RES Reduction', effects),
      ...optionalMetric('stunDmgMultiplier', 'Stun DMG Multiplier', effects),
    ],
    actionModifiers,
    operations: [],
  }
}
