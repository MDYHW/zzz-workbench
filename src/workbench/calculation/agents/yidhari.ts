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
  presentSetupInputs,
  resolveDeliveredClauses,
  withApplicability,
  type CompleteSetup,
  type EffectMetric,
  type ResolvedCurrentEffect,
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

export interface YidhariCalculationContext {
  agentId: 'yidhari'
  setup: CompleteSetup
  additionalActive: boolean
}

const YIDHARI_EX_SPECIAL = actionTarget([
  canonicalAction('EX Special Attack'),
])
const YIDHARI_BASIC_EX = actionTarget([
  canonicalAction('Basic Attack'),
  canonicalAction('EX Special Attack'),
])
const YIDHARI_DMG_SCOPES = [
  { id: 'yidhariExSpecial', target: YIDHARI_EX_SPECIAL },
] satisfies readonly ActionScopeNode[]
const YIDHARI_RES_SCOPES = [
  { id: 'yidhariBasicExResIgnore', target: YIDHARI_BASIC_EX },
] satisfies readonly ActionScopeNode[]

export const observeYidhari = (
  setup: CompleteSetup,
  additionalActive: boolean,
): YidhariCalculationContext => ({
  agentId: 'yidhari',
  setup,
  additionalActive,
})

export function resolveYidhariProviderClauses(
  context: YidhariCalculationContext,
): SourceBoundCurrentClause[] {
  const { setup } = context
  const values = VERTICAL_VALUES.yidhari
  const engine = engineSource('yidhari', setup)
  const fourPiece = discSource('yidhari', setup.fourPieceId, '4-piece')
  const refinement = setup.refinement

  return active([
    percentage('maxHp', 'fully', STATIC_SOURCES.yidhari.core,
      VERTICAL_VALUES.party.wellspringHp, 'all-party', undefined, undefined,
      'etherVeilWellspring'),
    withApplicability(
      additive('dmgBonus', 'fully', STATIC_SOURCES.yidhari.core,
        values.lowHpDmg, 'self'),
      { attributes: ['Ice'], formulas: ['sheer_damage'] },
    ),
    additive('critDmg', 'fully', STATIC_SOURCES.yidhari.additional,
      context.additionalActive ? values.additionalCritDmg : 0, 'self'),
    withApplicability(
      additive('resIgnore', 'fully', mindscapeSource('yidhari', 1, 'Ice RES Ignore'),
        setup.mindscape >= 1 ? values.mindscapeIceResIgnore : 0,
        'enemy-context', YIDHARI_BASIC_EX, undefined, ['yidhari']),
      { attributes: ['Ice'], formulas: ['sheer_damage'] },
    ),
    additive('critDmg', 'fully', mindscapeSource('yidhari', 2),
      setup.mindscape >= 2 ? values.mindscapeCritDmg : 0, 'self'),
    percentage('maxHp', 'fully', mindscapeSource('yidhari', 4, 'during Ether Veil: Wellspring'),
      setup.mindscape >= 4 ? values.mindscapeMaxHp : 0, 'self'),
    additive('sheerDmgBonus', 'fully', mindscapeSource('yidhari', 6),
      setup.mindscape >= 6 ? values.mindscapeSheerDmg : 0, 'self'),

    additive('critRate', 'combat', engine,
      setup.engineId === 'qingming'
        ? equipmentEffectBaseValue(W_ENGINE_FACTS.qingming.effects.critRate, refinement)
        : 0, 'self'),
    additive('critRate', 'fully', engine,
      setup.engineId === 'krakensCradle'
        ? equipmentEffectBaseValue(W_ENGINE_FACTS.krakensCradle.effects.critRate, refinement)
        : setup.engineId === 'grillOWisp'
          ? equipmentEffectBaseValue(W_ENGINE_FACTS.grillOWisp.effects.critRate, refinement)
          : setup.engineId === 'cauldron'
            ? equipmentEffectBaseValue(W_ENGINE_FACTS.cauldron.effects.critRate, refinement)
            : 0, 'self'),
    additive('critDmg', 'fully', engine,
      setup.engineId === 'puzzleSphere'
        ? equipmentEffectBaseValue(W_ENGINE_FACTS.puzzleSphere.effects.critDamage, refinement)
        : 0, 'self'),
    additive('dmgBonus', 'fully', engine,
      setup.engineId === 'cauldron'
        ? equipmentEffectBaseValue(W_ENGINE_FACTS.cauldron.effects.damage, refinement)
        : 0, 'self'),
    additive('dmgBonus', 'fully', engine,
      setup.engineId === 'puzzleSphere'
        ? equipmentEffectBaseValue(W_ENGINE_FACTS.puzzleSphere.effects.damage, refinement)
        : 0, 'self', YIDHARI_EX_SPECIAL),
    additive('sheerForce', 'fully', engine,
      setup.engineId === 'radiowave'
        ? equipmentEffectBaseValue(W_ENGINE_FACTS.radiowave.effects.sheerForce, refinement)
        : 0, 'self'),
    withApplicability(
      additive('sheerDmgBonus', 'fully', engine,
        setup.engineId === 'krakensCradle'
          ? equipmentEffectMaximumValue(W_ENGINE_FACTS.krakensCradle.effects.iceSheerDamage, refinement)
          : 0, 'self'),
      { attributes: ['Ice'], formulas: ['sheer_damage'] },
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
  actions: AgentResult['actionModifiers'] = [],
): AgentResult['metrics'] {
  const metric = composeMetricEffects(
    surfaces(0, 0, 0),
    surfaces([], [], []),
    effects,
    metricId,
  )
  return metric.values.fully === 0 && !actions.some(({ metricId: id }) => id === metricId)
    ? []
    : [{ id: metricId, label, unit: '%', decimals: 1, ...metric }]
}

export function calculateYidhari(
  setup: CompleteSetup,
  inbox: SourceBoundCurrentClause[],
  enemy: SourceBoundCurrentClause[],
): AgentResult {
  const values = VERTICAL_VALUES.yidhari
  const engine = W_ENGINES[setup.engineId]
  const baseAtk = values.atk + engine.baseAtk
  const hpInputs = presentSetupInputs([
    engineAdvancedInput(setup, 'yidhari', 'hpPct'),
    discStatInput(setup, 'yidhari', 'fourPiece', 'yunkui',
      equipmentEffectBaseValue(DRIVE_DISC_FACTS.yunkui.twoPiece.maxHp), 'twoPiece'),
    mainStatInput(setup, 'yidhari', 'slot5', 'hpPct'),
    mainStatInput(setup, 'yidhari', 'slot6', 'hpPct'),
    effectiveSubstatInput(setup, 'yidhari', 'hpPct'),
  ])
  const initialHp = values.hp * (
    1 + hpInputs.reduce((total, input) => total + input.rawValue, 0) / 100
  ) + VERTICAL_VALUES.fixedDisc.hp
  const atkInputs = presentSetupInputs([
    engineAdvancedInput(setup, 'yidhari', 'atkPct'),
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
      input.source,
      values.hp * input.rawValue / 100,
      input.rawValue,
    )), [], []),
    effects,
    'maxHp',
  )
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
  const sheerForce = composeRuptureSheerForce(
    atk.values,
    maxHp.values,
    STATIC_SOURCES.yidhari.ruptureConversion,
    effects,
  )

  const critRateInputs = presentSetupInputs([
    mainStatInput(setup, 'yidhari', 'slot4', 'critRate'),
    discStatInput(setup, 'yidhari', 'twoPiece', 'woodpecker',
      equipmentEffectBaseValue(DRIVE_DISC_FACTS.woodpecker.twoPiece.critRate)),
    effectiveSubstatInput(setup, 'yidhari', 'critRate'),
  ])
  const initialCritRate = values.critRate
    + critRateInputs.reduce((total, input) => total + input.rawValue, 0)
  const critRate = composeMetricEffects(
    surfaces(initialCritRate, initialCritRate, initialCritRate),
    surfaces(critRateInputs.map((input) => contribution(input.source, input.rawValue)), [], []),
    effects,
    'critRate',
    { value: 100, source: STATIC_SOURCES.yidhari.critCap },
  )

  const critDmgInputs = presentSetupInputs([
    mainStatInput(setup, 'yidhari', 'slot4', 'critDmg'),
    discStatInput(setup, 'yidhari', 'twoPiece', 'branchAndBlade',
      equipmentEffectBaseValue(DRIVE_DISC_FACTS.branchAndBlade.twoPiece.critDamage)),
    effectiveSubstatInput(setup, 'yidhari', 'critDmg'),
  ])
  const initialCritDmg = values.critDmg
    + critDmgInputs.reduce((total, input) => total + input.rawValue, 0)
  const critDmg = composeMetricEffects(
    surfaces(initialCritDmg, initialCritDmg, initialCritDmg),
    surfaces(critDmgInputs.map((input) => contribution(input.source, input.rawValue)), [], []),
    effects,
    'critDmg',
  )

  const iceDmg = mainStatInput(setup, 'yidhari', 'slot5', 'iceDmg')
  const initialDmg = iceDmg?.rawValue ?? 0
  const dmgBonus = composeMetricEffects(
    surfaces(initialDmg, initialDmg, initialDmg),
    surfaces(iceDmg ? [contribution(iceDmg.source, iceDmg.rawValue)] : [], [], []),
    effects,
    'dmgBonus',
  )
  const sheerDmgBonus = composeMetricEffects(
    surfaces(0, 0, 0), surfaces([], [], []), effects, 'sheerDmgBonus',
  )
  const resIgnore = composeMetricEffects(
    surfaces(0, 0, 0), surfaces([], [], []), effects, 'resIgnore',
  )
  const actionModifiers = [
    ...composeActionHierarchy(dmgBonus.values, effects, 'dmgBonus', YIDHARI_DMG_SCOPES),
    ...composeActionHierarchy(resIgnore.values, effects, 'resIgnore', YIDHARI_RES_SCOPES),
  ]

  return {
    agentId: 'yidhari',
    metrics: [
      { id: 'maxHp', label: 'Max HP', unit: '', decimals: 0, ...maxHp },
      { id: 'atk', label: 'ATK', unit: '', decimals: 0, ...atk },
      { id: 'sheerForce', label: 'Sheer Force', unit: '', decimals: 1, ...sheerForce },
      { id: 'critRate', label: 'CRIT Rate', unit: '%', decimals: 1, ...critRate },
      { id: 'critDmg', label: 'CRIT DMG', unit: '%', decimals: 1, ...critDmg },
      { id: 'dmgBonus', label: 'DMG Bonus', unit: '%', decimals: 1, ...dmgBonus },
      { id: 'sheerDmgBonus', label: 'Sheer DMG Bonus', unit: '%', decimals: 1, ...sheerDmgBonus },
      ...optionalMetric('resIgnore', 'RES Ignore', effects, actionModifiers),
      ...optionalMetric('resReduction', 'RES Reduction', effects),
      ...optionalMetric('stunDmgMultiplier', 'Stun DMG Multiplier', effects),
    ],
    actionModifiers,
    operations: [],
  }
}
