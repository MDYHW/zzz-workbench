import {
  DRIVE_DISC_FACTS,
  VERTICAL_VALUES,
  W_ENGINE_FACTS,
  equipmentEffectBaseValue,
  equipmentEffectMaximumValue,
  type MainSlot,
  type SetupFormulaFamily,
} from '../../content'
import { actionForm, actionTarget, canonicalAction } from '../../actions'
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
  perSecond,
  percentage,
  presentSetupInputs,
  resolveDeliveredClauses,
  withApplicability,
  type CompleteSetup,
  type ResolvedSetupInput,
  type SourceBoundCurrentClause,
} from '../../effects'
import {
  composeActionHierarchy,
  composeMetricEffects,
  contribution,
  energyRegenProjection,
  percentageContribution,
  surfaces,
  withoutZero,
  type ActionScopeNode,
} from '../composition'
import type { AgentResult, Contribution } from '../result'

const DAMAGE_FORMULAS: readonly SetupFormulaFamily[] = [
  'general_damage',
  'sheer_damage',
]

const ZHAO_M4_ACTIONS = actionTarget([
  canonicalAction('Ultimate'),
  canonicalAction('Chain Attack'),
  actionForm('Basic Attack', 'Final Verdict'),
])

const ZHAO_CRIT_SCOPES = [
  { id: 'zhaoM4CritDmg', target: ZHAO_M4_ACTIONS },
] satisfies readonly ActionScopeNode[]

export interface ZhaoInitialHpObservation {
  value: number
  breakdown: Contribution[]
}

export interface ZhaoCalculationContext {
  agentId: 'zhao'
  setup: CompleteSetup
  initialHp: ZhaoInitialHpObservation
  additionalActive: boolean
}

function calculateZhaoInitialHp(
  setup: CompleteSetup,
): ZhaoInitialHpObservation {
  const values = VERTICAL_VALUES.zhao
  const coreHp: ResolvedSetupInput = {
    rawValue: values.coreHp,
    unit: '%',
    source: STATIC_SOURCES.zhao.core,
  }
  const percentInputs = presentSetupInputs([
    coreHp,
    engineAdvancedInput(setup, 'zhao', 'hpPct'),
    discStatInput(
      setup,
      'zhao',
      'fourPiece',
      'bunnyInWonderland',
      equipmentEffectBaseValue(DRIVE_DISC_FACTS.bunnyInWonderland.twoPiece.maxHp),
      'twoPiece',
    ),
    discStatInput(
      setup,
      'zhao',
      'twoPiece',
      'bunnyInWonderland',
      equipmentEffectBaseValue(DRIVE_DISC_FACTS.bunnyInWonderland.twoPiece.maxHp),
    ),
    discStatInput(
      setup,
      'zhao',
      'twoPiece',
      'yunkui',
      equipmentEffectBaseValue(DRIVE_DISC_FACTS.yunkui.twoPiece.maxHp),
    ),
    ...(['slot4', 'slot5', 'slot6'] as MainSlot[]).map((slot) => (
      mainStatInput(setup, 'zhao', slot, 'hpPct')
    )),
    effectiveSubstatInput(setup, 'zhao', 'hpPct'),
  ])
  const flatHp = effectiveSubstatInput(setup, 'zhao', 'hpFlat')
  const value = values.hp * (
    1 + percentInputs.reduce((total, input) => total + input.rawValue, 0) / 100
  ) + VERTICAL_VALUES.fixedDisc.hp + (flatHp?.rawValue ?? 0)

  return {
    value,
    breakdown: withoutZero([
      ...percentInputs.map((input) => percentageContribution(
        input.source,
        values.hp * input.rawValue / 100,
        input.rawValue,
      )),
      ...(flatHp ? [contribution(flatHp.source, flatHp.rawValue)] : []),
    ]),
  }
}

function additionalDmg(initialHp: number): number {
  const values = VERTICAL_VALUES.zhao
  return Math.min(
    values.additionalDmg + Math.floor(
      Math.max(0, initialHp - values.additionalHpThreshold) / values.additionalHpStep,
    ) * values.additionalDmgPerStep,
    values.additionalDmgCap,
  )
}

export function observeZhao(
  setup: CompleteSetup,
  additionalActive: boolean,
): ZhaoCalculationContext {
  return {
    agentId: 'zhao',
    setup,
    initialHp: calculateZhaoInitialHp(setup),
    additionalActive,
  }
}

export function resolveZhaoProviderClauses(
  context: ZhaoCalculationContext,
): SourceBoundCurrentClause[] {
  const { setup, initialHp, additionalActive } = context
  const values = VERTICAL_VALUES.zhao
  const engine = engineSource('zhao', setup)
  const refinement = setup.refinement
  const halfSugar = setup.engineId === 'halfSugarBunny'
  const halfSugarSquad = halfSugar
    ? equipmentEffectBaseValue(W_ENGINE_FACTS.halfSugarBunny.effects.squadAtk, refinement)
    : 0

  return active([
    percentage(
      'maxHp', 'fully', STATIC_SOURCES.zhao.core,
      values.wellspringHp, 'all-party', undefined, undefined, 'etherVeilWellspring',
    ),
    additive(
      'atk', 'fully', STATIC_SOURCES.zhao.core,
      values.wellspringAtk, 'all-party',
    ),
    withApplicability(
      additive(
        'dmgBonus', 'fully', STATIC_SOURCES.zhao.additional,
        additionalActive ? additionalDmg(initialHp.value) : 0,
        'all-party',
      ),
      { formulas: DAMAGE_FORMULAS },
    ),
    withApplicability(
      additive(
        'resIgnore', 'fully', mindscapeSource('zhao', 1, 'All-Attribute RES Ignore'),
        setup.mindscape >= 1 ? values.mindscapeResIgnore : 0,
        'enemy-context',
      ),
      { formulas: DAMAGE_FORMULAS },
    ),
    percentage(
      'atk', 'fully', mindscapeSource('zhao', 2, 'Reachable healing condition'),
      setup.mindscape >= 2 ? values.mindscapeOtherAtk : 0, 'other-party',
    ),
    additive(
      'critDmg', 'fully', mindscapeSource('zhao', 4),
      setup.mindscape >= 4 ? values.mindscapeActionCritDmg : 0,
      'self', ZHAO_M4_ACTIONS,
    ),

    percentage(
      'maxHp', 'combat', engine,
      setup.engineId === 'originalTransmorpher'
        ? equipmentEffectBaseValue(W_ENGINE_FACTS.originalTransmorpher.effects.maxHp, refinement)
        : 0,
      'self',
    ),
    perSecond(
      engine,
      halfSugar
        ? equipmentEffectBaseValue(W_ENGINE_FACTS.halfSugarBunny.effects.automaticEnergy, refinement)
        : 0,
      'self',
    ),
    percentage(
      'atk', 'fully', engine, halfSugarSquad,
      'all-party', undefined, undefined, 'halfSugarBunny',
    ),
    percentage(
      'maxHp', 'fully', engine, halfSugarSquad,
      'all-party', undefined, undefined, 'halfSugarBunny',
    ),
    additive(
      'critDmg', 'fully', engine,
      halfSugar
        ? equipmentEffectBaseValue(W_ENGINE_FACTS.halfSugarBunny.effects.veilCritDamage, refinement)
        : 0,
      'all-party',
    ),

    withApplicability(
      additive(
        'dmgBonus', 'fully', discSource('zhao', 'bunnyInWonderland', '4-piece'),
        setup.fourPieceId === 'bunnyInWonderland'
          ? equipmentEffectMaximumValue(DRIVE_DISC_FACTS.bunnyInWonderland.fourPiece.damage)
          : 0,
        'all-party', undefined, undefined, undefined, 'bunnyInWonderland',
      ),
      { formulas: DAMAGE_FORMULAS },
    ),
  ])
}

export function calculateZhao(
  context: ZhaoCalculationContext,
  inbox: SourceBoundCurrentClause[],
  enemy: SourceBoundCurrentClause[],
): AgentResult {
  const { setup, initialHp, additionalActive } = context
  const values = VERTICAL_VALUES.zhao
  const effects = resolveDeliveredClauses([...inbox, ...enemy], {
    maxHp: initialHp.value,
  })

  const maxHp = composeMetricEffects(
    surfaces(initialHp.value, initialHp.value, initialHp.value),
    surfaces(initialHp.breakdown, [], []),
    effects,
    'maxHp',
  )

  const coreCritRate = Math.floor(initialHp.value / 1000)
    * values.coreCritRatePer1000Hp
    * (setup.mindscape >= 6 ? values.mindscapeCoreCritRateMultiplier : 1)
  const initialCritRate = values.critRate + coreCritRate
  const critRate = composeMetricEffects(
    surfaces(initialCritRate, initialCritRate, initialCritRate),
    surfaces([contribution(STATIC_SOURCES.zhao.core, coreCritRate)], [], []),
    effects,
    'critRate',
    { value: 100, source: STATIC_SOURCES.zhao.critCap },
  )

  const energyInputs = presentSetupInputs([
    engineAdvancedInput(setup, 'zhao', 'energyRegenPct'),
    mainStatInput(setup, 'zhao', 'slot6', 'energyRegenPct'),
    discStatInput(
      setup, 'zhao', 'fourPiece', 'swingJazz',
      equipmentEffectBaseValue(DRIVE_DISC_FACTS.swingJazz.twoPiece.energyRegen), 'twoPiece',
    ),
    discStatInput(
      setup, 'zhao', 'twoPiece', 'swingJazz',
      equipmentEffectBaseValue(DRIVE_DISC_FACTS.swingJazz.twoPiece.energyRegen),
    ),
    discStatInput(
      setup, 'zhao', 'twoPiece', 'moonlight',
      equipmentEffectBaseValue(DRIVE_DISC_FACTS.moonlight.twoPiece.energyRegen),
    ),
  ])
  const energyRegen = energyRegenProjection(values.baseEnergyRegen, energyInputs, effects)
  const critDmg = composeMetricEffects(
    surfaces(values.critDmg, values.critDmg, values.critDmg),
    surfaces([], [], []),
    effects,
    'critDmg',
  )
  const actionModifiers = composeActionHierarchy(
    critDmg.values,
    effects,
    'critDmg',
    ZHAO_CRIT_SCOPES,
  )

  return {
    agentId: 'zhao',
    metrics: [
      {
        id: 'maxHp',
        label: 'Max HP',
        unit: '',
        decimals: 0,
        ...maxHp,
        ...(additionalActive ? {
          gauge: {
            source: STATIC_SOURCES.zhao.additional,
            basisLabel: 'Initial Max HP',
            current: initialHp.value,
            threshold: values.additionalHpThreshold,
            cap: values.additionalHpCap,
            outputLabel: 'Squad DMG Bonus',
            outputValue: additionalDmg(initialHp.value),
            outputCap: values.additionalDmgCap,
            outputUnit: '%',
          },
        } : {}),
      },
      { id: 'critRate', label: 'CRIT Rate', unit: '%', decimals: 1, ...critRate },
      ...(actionModifiers.length > 0
        ? [{ id: 'critDmg' as const, label: 'CRIT DMG', unit: '%', decimals: 1, ...critDmg }]
        : []),
      {
        id: 'energyRegen', label: 'Energy Regen', unit: '', decimals: 2,
        values: energyRegen.values, breakdown: energyRegen.breakdown,
      },
    ],
    actionModifiers,
    operations: [{
      id: 'zhaoFinalVerdictMaxHp',
      label: 'Basic Attack: Final Verdict maximum-charge Max HP',
      source: setup.mindscape >= 6
        ? mindscapeSource('zhao', 6, 'Final Verdict')
        : STATIC_SOURCES.zhao.finalVerdict,
      surface: 'fully',
      value: setup.mindscape >= 6
        ? values.mindscapeFinalVerdictMaxHp
        : values.finalVerdictMaxHp,
      unit: '%',
    }],
  }
}
