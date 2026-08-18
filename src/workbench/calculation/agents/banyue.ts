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
import type { AgentResult } from '../result'
import { composeRuptureSheerForce } from '../rupture'

export interface BanyueCalculationContext {
  agentId: 'banyue'
  setup: CompleteSetup
  additionalActive: boolean
}

const BANYUE_EX = actionTarget([canonicalAction('EX Special Attack')])
const BANYUE_TREMOR_SHEER = actionTarget([
  sourceLocalAction("EX Special Attack: Lion's Roar", 'EX Special Attack'),
  sourceLocalAction("EX Special Attack: Lion's Roar - Wrath", 'EX Special Attack'),
  sourceLocalAction('EX Special Attack: Mountain Tremor', 'EX Special Attack'),
  sourceLocalAction('EX Special Attack: Mountain Tremor - Wrath', 'EX Special Attack'),
  sourceLocalAction('Basic Attack: Toppling Mountain', 'Basic Attack'),
  sourceLocalAction('Basic Attack: Crushing Peaks', 'Basic Attack'),
])
const BANYUE_M4_ACTIONS = actionTarget([
  sourceLocalAction("EX Special Attack: Lion's Roar - Wrath", 'EX Special Attack'),
  sourceLocalAction('EX Special Attack: Mountain Tremor - Wrath', 'EX Special Attack'),
  sourceLocalAction('Basic Attack: Toppling Mountain', 'Basic Attack'),
  sourceLocalAction('Basic Attack: Crushing Peaks', 'Basic Attack'),
])
const BANYUE_CRUSHING_PEAKS = actionTarget([
  sourceLocalAction('Basic Attack: Crushing Peaks', 'Basic Attack'),
])
const BANYUE_DMG_SCOPES = [
  { id: 'banyueExSpecial', target: BANYUE_EX },
  { id: 'banyueM4Actions', target: BANYUE_M4_ACTIONS },
] satisfies readonly ActionScopeNode[]
const BANYUE_SHEER_SCOPES = [
  { id: 'banyueExSpecialSheer', target: BANYUE_EX },
  { id: 'banyueTremorActions', target: BANYUE_TREMOR_SHEER },
] satisfies readonly ActionScopeNode[]
const BANYUE_STUN_SCOPES = [
  { id: 'banyueCrushingPeaksStun', target: BANYUE_CRUSHING_PEAKS },
] satisfies readonly ActionScopeNode[]

export const observeBanyue = (
  setup: CompleteSetup,
  additionalActive: boolean,
): BanyueCalculationContext => ({ agentId: 'banyue', setup, additionalActive })

export function resolveBanyueProviderClauses(
  context: BanyueCalculationContext,
): SourceBoundCurrentClause[] {
  const { setup } = context
  const values = VERTICAL_VALUES.banyue
  const engine = engineSource('banyue', setup)
  const fourPiece = discSource('banyue', setup.fourPieceId, '4-piece')
  const refinement = setup.refinement
  const vidyarajaActive = setup.mindscape >= 6 || context.additionalActive

  return active([
    additive('sheerForce', 'fully', STATIC_SOURCES.banyue.core,
      values.coreSheerForce, 'self'),
    withApplicability(
      additive('dmgBonus', 'fully', STATIC_SOURCES.banyue.core,
        values.coreFireDmg + (setup.mindscape >= 2 ? values.mindscapeCoreFireDmg : 0),
        'self'),
      { attributes: ['Fire'], formulas: ['sheer_damage'] },
    ),
    additive('critDmg', 'fully', STATIC_SOURCES.banyue.core,
      values.coreCritDmg + (setup.mindscape >= 2 ? values.mindscapeCoreCritDmg : 0),
      'self'),
    withApplicability(
      additive('dmgBonus', 'fully', STATIC_SOURCES.banyue.additional,
        vidyarajaActive ? values.additionalFireDmgPerStack * values.additionalStacks : 0,
        'self'),
      { attributes: ['Fire'], formulas: ['sheer_damage'] },
    ),
    withApplicability(
      additive('dmgBonus', 'fully', mindscapeSource('banyue', 6, 'Vidyaraja'),
        setup.mindscape >= 6 ? values.mindscapeVidyarajaPerStack * values.additionalStacks : 0,
        'self'),
      { attributes: ['Fire'], formulas: ['sheer_damage'] },
    ),
    withApplicability(
      additive('resReduction', 'fully', mindscapeSource('banyue', 1, 'Tremor'),
        setup.mindscape >= 1 ? values.mindscapeFireResReduction : 0,
        'enemy-context'),
      { attributes: ['Fire'], formulas: ['general_damage', 'sheer_damage'] },
    ),
    additive('sheerDmgBonus', 'fully', mindscapeSource('banyue', 1, 'Tremor actions'),
      setup.mindscape >= 1 ? values.mindscapeActionSheerDmg : 0,
      'self', BANYUE_TREMOR_SHEER),
    additive('stunDuration', 'fully', mindscapeSource('banyue', 1, 'Stunned enemy'),
      setup.mindscape >= 1 ? values.mindscapeStunExtension : 0,
      'enemy-context', BANYUE_CRUSHING_PEAKS, undefined, ['banyue']),
    additive('dmgBonus', 'fully', mindscapeSource('banyue', 4),
      setup.mindscape >= 4 ? values.mindscapeActionDmg : 0,
      'self', BANYUE_M4_ACTIONS),

    additive('critRate', 'combat', engine,
      setup.engineId === 'wrathfulVajra'
        ? equipmentEffectBaseValue(W_ENGINE_FACTS.wrathfulVajra.effects.critRate, refinement)
        : setup.engineId === 'qingming'
          ? equipmentEffectBaseValue(W_ENGINE_FACTS.qingming.effects.critRate, refinement)
          : 0,
      'self'),
    additive('critRate', 'fully', engine,
      setup.engineId === 'cauldron'
        ? equipmentEffectBaseValue(W_ENGINE_FACTS.cauldron.effects.critRate, refinement)
        : 0,
      'self'),
    additive('critDmg', 'fully', engine,
      setup.engineId === 'puzzleSphere'
        ? equipmentEffectBaseValue(W_ENGINE_FACTS.puzzleSphere.effects.critDamage, refinement)
        : 0,
      'self'),
    withApplicability(
      additive('dmgBonus', 'combat', engine,
        setup.engineId === 'grillOWisp'
          ? equipmentEffectBaseValue(W_ENGINE_FACTS.grillOWisp.effects.fireDamage, refinement)
          : 0,
        'self'),
      { attributes: ['Fire'], formulas: ['sheer_damage'] },
    ),
    withApplicability(
      additive('dmgBonus', 'fully', engine,
        setup.engineId === 'cauldron'
          ? equipmentEffectBaseValue(W_ENGINE_FACTS.cauldron.effects.damage, refinement)
          : 0,
        'self'),
      { attributes: ['Fire'], formulas: ['sheer_damage'] },
    ),
    additive('dmgBonus', 'fully', engine,
      setup.engineId === 'puzzleSphere'
        ? equipmentEffectBaseValue(W_ENGINE_FACTS.puzzleSphere.effects.damage, refinement)
        : 0,
      'self', BANYUE_EX),
    withApplicability(
      additive('sheerDmgBonus', 'fully', engine,
        setup.engineId === 'wrathfulVajra'
          ? equipmentEffectMaximumValue(W_ENGINE_FACTS.wrathfulVajra.effects.fireSheerDamage, refinement)
          : 0,
        'self', BANYUE_EX),
      { attributes: ['Fire'], formulas: ['sheer_damage'] },
    ),
    additive('critRate', 'fully', fourPiece,
      setup.fourPieceId === 'yunkui'
        ? equipmentEffectBaseValue(DRIVE_DISC_FACTS.yunkui.fourPiece.critRate)
        : 0,
      'self'),
    additive('sheerDmgBonus', 'fully', fourPiece,
      setup.fourPieceId === 'yunkui'
        ? equipmentEffectBaseValue(DRIVE_DISC_FACTS.yunkui.fourPiece.sheerDamage)
        : 0,
      'self'),
  ])
}

function optionalMetric(
  metricId: EffectMetric,
  label: string,
  effects: ResolvedCurrentEffect[],
  actions: AgentResult['actionModifiers'] = [],
): AgentResult['metrics'] {
  const metric = composeMetricEffects(
    surfaces(0, 0, 0), surfaces([], [], []), effects, metricId,
  )
  return metric.values.fully === 0 && !actions.some(({ metricId: id }) => id === metricId)
    ? []
    : [{ id: metricId, label, unit: '%', decimals: 1, ...metric }]
}

export function calculateBanyue(
  setup: CompleteSetup,
  inbox: SourceBoundCurrentClause[],
  enemy: SourceBoundCurrentClause[],
): AgentResult {
  const values = VERTICAL_VALUES.banyue
  const engine = W_ENGINES[setup.engineId]
  const baseAtk = values.atk + engine.baseAtk
  const hpInputs = presentSetupInputs([
    engineAdvancedInput(setup, 'banyue', 'hpPct'),
    discStatInput(setup, 'banyue', 'fourPiece', 'yunkui',
      equipmentEffectBaseValue(DRIVE_DISC_FACTS.yunkui.twoPiece.maxHp), 'twoPiece'),
    mainStatInput(setup, 'banyue', 'slot5', 'hpPct'),
    mainStatInput(setup, 'banyue', 'slot6', 'hpPct'),
    effectiveSubstatInput(setup, 'banyue', 'hpPct'),
  ])
  const initialHp = values.hp * (
    1 + hpInputs.reduce((total, input) => total + input.rawValue, 0) / 100
  ) + VERTICAL_VALUES.fixedDisc.hp
  const atkInputs = presentSetupInputs([
    engineAdvancedInput(setup, 'banyue', 'atkPct'),
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
    atk.values, maxHp.values, STATIC_SOURCES.banyue.ruptureConversion, effects,
  )

  const critRateInputs = presentSetupInputs([
    mainStatInput(setup, 'banyue', 'slot4', 'critRate'),
    discStatInput(setup, 'banyue', 'twoPiece', 'woodpecker',
      equipmentEffectBaseValue(DRIVE_DISC_FACTS.woodpecker.twoPiece.critRate)),
    effectiveSubstatInput(setup, 'banyue', 'critRate'),
  ])
  const initialCritRate = values.critRate
    + critRateInputs.reduce((total, input) => total + input.rawValue, 0)
  const critRate = composeMetricEffects(
    surfaces(initialCritRate, initialCritRate, initialCritRate),
    surfaces(critRateInputs.map((input) => contribution(input.source, input.rawValue)), [], []),
    effects,
    'critRate',
    { value: 100, source: STATIC_SOURCES.banyue.critCap },
  )

  const critDmgInputs = presentSetupInputs([
    mainStatInput(setup, 'banyue', 'slot4', 'critDmg'),
    discStatInput(setup, 'banyue', 'twoPiece', 'branchAndBlade',
      equipmentEffectBaseValue(DRIVE_DISC_FACTS.branchAndBlade.twoPiece.critDamage)),
    effectiveSubstatInput(setup, 'banyue', 'critDmg'),
  ])
  const initialCritDmg = values.critDmg
    + critDmgInputs.reduce((total, input) => total + input.rawValue, 0)
  const critDmg = composeMetricEffects(
    surfaces(initialCritDmg, initialCritDmg, initialCritDmg),
    surfaces(critDmgInputs.map((input) => contribution(input.source, input.rawValue)), [], []),
    effects,
    'critDmg',
  )

  const fireDmg = mainStatInput(setup, 'banyue', 'slot5', 'fireDmg')
  const initialDmg = fireDmg?.rawValue ?? 0
  const dmgBonus = composeMetricEffects(
    surfaces(initialDmg, initialDmg, initialDmg),
    surfaces(fireDmg ? [contribution(fireDmg.source, fireDmg.rawValue)] : [], [], []),
    effects,
    'dmgBonus',
  )
  const sheerDmgBonus = composeMetricEffects(
    surfaces(0, 0, 0), surfaces([], [], []), effects, 'sheerDmgBonus',
  )
  const stunDuration = composeMetricEffects(
    surfaces(0, 0, 0), surfaces([], [], []), effects, 'stunDuration',
  )
  const actionModifiers = [
    ...composeActionHierarchy(dmgBonus.values, effects, 'dmgBonus', BANYUE_DMG_SCOPES),
    ...composeActionHierarchy(sheerDmgBonus.values, effects, 'sheerDmgBonus', BANYUE_SHEER_SCOPES),
    ...composeActionHierarchy(stunDuration.values, effects, 'stunDuration', BANYUE_STUN_SCOPES),
  ]

  return {
    agentId: 'banyue',
    metrics: [
      { id: 'maxHp', label: 'Max HP', unit: '', decimals: 0, ...maxHp },
      { id: 'atk', label: 'ATK', unit: '', decimals: 0, ...atk },
      { id: 'sheerForce', label: 'Sheer Force', unit: '', decimals: 1, ...sheerForce },
      { id: 'critRate', label: 'CRIT Rate', unit: '%', decimals: 1, ...critRate },
      { id: 'critDmg', label: 'CRIT DMG', unit: '%', decimals: 1, ...critDmg },
      { id: 'dmgBonus', label: 'DMG Bonus', unit: '%', decimals: 1, ...dmgBonus },
      { id: 'sheerDmgBonus', label: 'Sheer DMG Bonus', unit: '%', decimals: 1, ...sheerDmgBonus },
      ...optionalMetric('resReduction', 'RES Reduction', effects),
      ...optionalMetric('stunDuration', 'Stun Duration', effects, actionModifiers),
      ...optionalMetric('stunDmgMultiplier', 'Stun DMG Multiplier', effects),
    ],
    actionModifiers,
    operations: setup.mindscape >= 6
      ? [{
        id: 'banyueCrushingPeaksMultiplier',
        label: 'Basic Attack: Crushing Peaks added DMG Multiplier',
        source: mindscapeSource('banyue', 6),
        surface: 'fully',
        value: values.mindscapeCrushingPeaksMultiplier,
        unit: '%',
      }]
      : [],
  }
}
