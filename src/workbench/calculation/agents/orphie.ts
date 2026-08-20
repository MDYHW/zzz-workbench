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
  selectedDiscTwoPieceInputs,
  effectiveSubstatInput,
  engineAdvancedInput,
  engineSource,
  mainStatInput,
  mindscapeSource,
  percentage,
  presentSetupInputs,
  resolveDeliveredClauses,
  source,
  withApplicability,
  type CompleteSetup,
  type EffectMetric,
  type SourceBoundCurrentClause,
} from '../../effects'
import { AFTERSHOCK_TARGET, actionTarget, canonicalAction, sourceLocalAction } from '../../actions'
import {
  composeActionHierarchy,
  composeMetricEffects,
  contribution,
  energyRegenProjection,
  percentageContribution,
  surfaces,
  type ActionScopeNode,
} from '../composition'
import { initialAtkFor } from '../initial-atk'
import type { AgentResult } from '../result'

export interface OrphieCalculationContext {
  agentId: 'orphie'
  setup: CompleteSetup
  additionalActive: boolean
  initialAtk: number
  initialEnergyRegen: number
}

const AFTERSHOCK = AFTERSHOCK_TARGET
const DASH = actionTarget([canonicalAction('Dash Attack')])
const EX_SPECIAL = actionTarget([canonicalAction('EX Special Attack')])
const BASIC_ULTIMATE = actionTarget([
  canonicalAction('Basic Attack'), canonicalAction('Ultimate'),
])
const CHAIN_ULTIMATE = actionTarget([
  canonicalAction('Chain Attack'), canonicalAction('Ultimate'),
])
const SPECIAL_EX_CHAIN_ULTIMATE = actionTarget([
  canonicalAction('Special Attack'), canonicalAction('EX Special Attack'),
  canonicalAction('Chain Attack'), canonicalAction('Ultimate'),
])
const HEAT_CHARGE_ULTIMATE = actionTarget([
  sourceLocalAction('Heat Charge'), canonicalAction('Ultimate'),
])

const DAMAGE_SCOPES = [
  { id: 'orphieAftershock', target: AFTERSHOCK },
  { id: 'orphieDash', target: DASH },
  { id: 'orphieExSpecial', target: EX_SPECIAL },
  { id: 'orphieHeatChargeUltimate', target: HEAT_CHARGE_ULTIMATE },
] satisfies readonly ActionScopeNode[]
const DEF_SCOPES = [
  { id: 'orphieAftershock', target: AFTERSHOCK },
  { id: 'orphieBasicUltimate', target: BASIC_ULTIMATE },
] satisfies readonly ActionScopeNode[]
const RES_SCOPES = [{
  id: 'orphieSpecialExChainUltimate', target: SPECIAL_EX_CHAIN_ULTIMATE,
  children: [{ id: 'orphieChainUltimate', target: CHAIN_ULTIMATE }],
}] satisfies readonly ActionScopeNode[]

function energyInputs(setup: CompleteSetup) {
  return presentSetupInputs([
    engineAdvancedInput(setup, 'orphie', 'energyRegenPct'),
    mainStatInput(setup, 'orphie', 'slot6', 'energyRegenPct'),
    ...selectedDiscTwoPieceInputs(setup, 'orphie', { modifier: 'energyRegen' }),
  ])
}

function initialEnergyRegen(setup: CompleteSetup): number {
  return VERTICAL_VALUES.orphie.baseEnergyRegen * (
    1 + energyInputs(setup).reduce((sum, input) => sum + input.rawValue, 0) / 100
  )
}

export function orphieCoreSquadAtk(initialEnergy: number): number {
  const values = VERTICAL_VALUES.orphie
  const completeSteps = initialEnergy <= values.coreEnergyThreshold
    ? 0
    : Math.floor(
      (initialEnergy - values.coreEnergyThreshold + Number.EPSILON * 16)
      / values.coreEnergyStep,
    )
  return Math.min(
    values.coreSquadAtkBase + completeSteps * values.coreSquadAtkStep,
    values.coreSquadAtkCap,
  )
}

export function observeOrphie(
  setup: CompleteSetup,
  additionalActive: boolean,
): OrphieCalculationContext {
  const initialAtk = initialAtkFor('orphie', setup)
  if (initialAtk === null) throw new Error('Complete Orphie & Magus setup requires a W-Engine')
  return {
    agentId: 'orphie', setup, additionalActive, initialAtk,
    initialEnergyRegen: initialEnergyRegen(setup),
  }
}

function selectedShadowSource(setup: CompleteSetup) {
  return setup.fourPieceId === 'shadowHarmony'
    ? discSource('orphie', 'shadowHarmony', '2-piece', '4-piece')
    : discSource('orphie', 'shadowHarmony', '2-piece')
}

export function resolveOrphieProviderClauses(
  context: OrphieCalculationContext,
): SourceBoundCurrentClause[] {
  const { setup, additionalActive, initialEnergyRegen: energy } = context
  const values = VERTICAL_VALUES.orphie
  const engine = engineSource('orphie', setup)
  const refinement = setup.refinement
  const core = source(SOURCE_LABELS.orphieCore, 'orphie', 'core')
  const additional = source(SOURCE_LABELS.orphieAbility, 'orphie', 'additional')
  const shadowSelected = setup.fourPieceId === 'shadowHarmony'
    || setup.twoPieceId === 'shadowHarmony'

  return active([
    additive('critRate', 'combat', core, values.coreCritRate, 'self'),
    additive('dmgBonus', 'fully', core, values.coreAftershockDmg, 'self', AFTERSHOCK),
    additive('atk', 'fully', core, orphieCoreSquadAtk(energy), 'all-party'),
    withApplicability(
      additive('defIgnore', 'fully', additional,
        additionalActive ? values.additionalAftershockDefIgnore : 0,
        'enemy-context', AFTERSHOCK),
      { formulas: ['general_damage'] },
    ),
    withApplicability(
      additive('resIgnore', 'fully', mindscapeSource('orphie', 1),
        setup.mindscape >= 1 ? values.mindscapeFireResIgnore : 0,
        'enemy-context', SPECIAL_EX_CHAIN_ULTIMATE, undefined, ['orphie']),
      { attributes: ['Fire'] },
    ),
    withApplicability(
      additive('dmgBonus', 'fully', mindscapeSource('orphie', 1, 'Zeroed In'),
        setup.mindscape >= 1 ? values.mindscapeSquadDmg : 0, 'all-party'),
      { formulas: ['general_damage', 'sheer_damage'] },
    ),
    percentage('atk', 'fully', mindscapeSource('orphie', 2, 'After Ultimate'),
      setup.mindscape >= 2 ? values.mindscapeAtk : 0, 'self'),
    additive('dmgBonus', 'fully', mindscapeSource('orphie', 4),
      setup.mindscape >= 4 ? values.mindscapeActionDmg : 0,
      'self', HEAT_CHARGE_ULTIMATE),

    additive('critRate', 'combat', engine,
      setup.engineId === 'bellicoseBlaze'
        ? equipmentEffectBaseValue(W_ENGINE_FACTS.bellicoseBlaze.effects.critRate, refinement)
        : setup.engineId === 'cordisGermina'
          ? equipmentEffectBaseValue(W_ENGINE_FACTS.cordisGermina.effects.critRate, refinement)
          : 0,
      'self'),
    additive('critDmg', 'combat', engine,
      setup.engineId === 'heartstringNocturne'
        ? equipmentEffectBaseValue(W_ENGINE_FACTS.heartstringNocturne.effects.critDamage, refinement)
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
      additive('defIgnore', 'fully', engine,
        setup.engineId === 'bellicoseBlaze'
          ? equipmentEffectMaximumValue(W_ENGINE_FACTS.bellicoseBlaze.effects.fireAftershockDefIgnore, refinement)
          : 0,
        'enemy-context', AFTERSHOCK, undefined, ['orphie']),
      { attributes: ['Fire'] },
    ),
    additive('defIgnore', 'fully', engine,
      setup.engineId === 'cordisGermina'
        ? equipmentEffectBaseValue(W_ENGINE_FACTS.cordisGermina.effects.defIgnore, refinement)
        : 0,
      'enemy-context', BASIC_ULTIMATE, undefined, ['orphie']),
    withApplicability(
      additive('resIgnore', 'fully', engine,
        setup.engineId === 'heartstringNocturne'
          ? equipmentEffectMaximumValue(W_ENGINE_FACTS.heartstringNocturne.effects.fireResIgnore, refinement)
          : 0,
        'enemy-context', CHAIN_ULTIMATE, undefined, ['orphie']),
      { attributes: ['Fire'] },
    ),
    percentage('atk', 'fully', engine,
      setup.engineId === 'gildedBlossom'
        ? equipmentEffectBaseValue(W_ENGINE_FACTS.gildedBlossom.effects.atk, refinement)
        : setup.engineId === 'marcatoDesire'
          ? equipmentEffectMaximumValue(W_ENGINE_FACTS.marcatoDesire.effects.atk, refinement)
          : 0,
      'self'),
    additive('dmgBonus', 'fully', engine,
      setup.engineId === 'gildedBlossom'
        ? equipmentEffectBaseValue(W_ENGINE_FACTS.gildedBlossom.effects.exDamage, refinement)
        : 0,
      'self', EX_SPECIAL),

    ...(shadowSelected
      ? [
        additive('dmgBonus', 'initial', selectedShadowSource(setup),
          equipmentEffectBaseValue(DRIVE_DISC_FACTS.shadowHarmony.twoPiece.damage),
          'self', AFTERSHOCK),
        additive('dmgBonus', 'initial', selectedShadowSource(setup),
          equipmentEffectBaseValue(DRIVE_DISC_FACTS.shadowHarmony.twoPiece.damage),
          'self', DASH),
      ]
      : []),
    percentage('atk', 'fully', discSource('orphie', 'shadowHarmony', '4-piece'),
      setup.fourPieceId === 'shadowHarmony'
        ? equipmentEffectBaseValue(DRIVE_DISC_FACTS.shadowHarmony.fourPiece.atk)
        : 0,
      'self'),
    additive('critRate', 'fully', discSource('orphie', 'shadowHarmony', '4-piece'),
      setup.fourPieceId === 'shadowHarmony'
        ? equipmentEffectBaseValue(DRIVE_DISC_FACTS.shadowHarmony.fourPiece.critRate)
        : 0,
      'self'),
  ])
}

function optionalMetric(
  metric: EffectMetric,
  label: string,
  effects: ReturnType<typeof resolveDeliveredClauses>,
  actions: AgentResult['actionModifiers'] = [],
): AgentResult['metrics'] {
  const data = composeMetricEffects(surfaces(0, 0, 0), surfaces([], [], []), effects, metric)
  return data.values.fully === 0 && !actions.some(({ metricId }) => metricId === metric)
    ? []
    : [{ id: metric, label, unit: '%', decimals: 1, ...data }]
}

export function calculateOrphie(
  context: OrphieCalculationContext,
  inbox: SourceBoundCurrentClause[],
  enemy: SourceBoundCurrentClause[],
): AgentResult {
  const { setup, initialAtk, initialEnergyRegen: initialEnergy } = context
  const values = VERTICAL_VALUES.orphie
  const baseAtk = values.atk + W_ENGINES[setup.engineId].baseAtk
  const effects = resolveDeliveredClauses([...inbox, ...enemy], { atk: initialAtk })

  const atkInputs = presentSetupInputs([
    engineAdvancedInput(setup, 'orphie', 'atkPct'),
    mainStatInput(setup, 'orphie', 'slot5', 'atkPct'),
    mainStatInput(setup, 'orphie', 'slot6', 'atkPct'),
    ...selectedDiscTwoPieceInputs(setup, 'orphie', { modifier: 'atk' }),
    effectiveSubstatInput(setup, 'orphie', 'atkPct'),
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
    engineAdvancedInput(setup, 'orphie', 'critRate'),
    mainStatInput(setup, 'orphie', 'slot4', 'critRate'),
    ...selectedDiscTwoPieceInputs(setup, 'orphie', { modifier: 'critRate' }),
    effectiveSubstatInput(setup, 'orphie', 'critRate'),
  ])
  const initialCritRate = values.critRate
    + critRateInputs.reduce((sum, input) => sum + input.rawValue, 0)
  const critRate = composeMetricEffects(
    surfaces(initialCritRate, initialCritRate, initialCritRate),
    surfaces(critRateInputs.map((input) => contribution(input.source, input.rawValue)), [], []),
    effects,
    'critRate',
    { value: 100, source: source('Displayed CRIT Rate cap', 'orphie', 'calculation') },
  )

  const critDmgInputs = presentSetupInputs([
    engineAdvancedInput(setup, 'orphie', 'critDmg'),
    mainStatInput(setup, 'orphie', 'slot4', 'critDmg'),
    ...selectedDiscTwoPieceInputs(setup, 'orphie', { modifier: 'critDmg' }),
    effectiveSubstatInput(setup, 'orphie', 'critDmg'),
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
    mainStatInput(setup, 'orphie', 'slot5', 'fireDmg'),
    ...selectedDiscTwoPieceInputs(setup, 'orphie', { modifier: 'dmgBonus' }),
  ])
  const initialDmg = dmgInputs.reduce((sum, input) => sum + input.rawValue, 0)
  const dmg = composeMetricEffects(
    surfaces(initialDmg, initialDmg, initialDmg),
    surfaces(dmgInputs.map((input) => contribution(input.source, input.rawValue)), [], []),
    effects,
    'dmgBonus',
  )
  const defIgnore = composeMetricEffects(
    surfaces(0, 0, 0), surfaces([], [], []), effects, 'defIgnore',
  )
  const resIgnore = composeMetricEffects(
    surfaces(0, 0, 0), surfaces([], [], []), effects, 'resIgnore',
  )
  const energy = energyRegenProjection(values.baseEnergyRegen, energyInputs(setup), effects)
  const actions = [
    ...composeActionHierarchy(dmg.values, effects, 'dmgBonus', DAMAGE_SCOPES),
    ...composeActionHierarchy(defIgnore.values, effects, 'defIgnore', DEF_SCOPES, 'DefIgnore'),
    ...composeActionHierarchy(resIgnore.values, effects, 'resIgnore', RES_SCOPES, 'ResIgnore'),
  ]

  return {
    agentId: 'orphie',
    metrics: [
      { id: 'atk', label: 'ATK', unit: '', decimals: 0, ...atk },
      { id: 'critRate', label: 'CRIT Rate', unit: '%', decimals: 1, ...critRate },
      { id: 'critDmg', label: 'CRIT DMG', unit: '%', decimals: 1, ...critDmg },
      { id: 'dmgBonus', label: 'DMG Bonus', unit: '%', decimals: 1, ...dmg },
      {
        id: 'energyRegen', label: 'Energy Regen', unit: '/s', decimals: 3, ...energy,
        gauge: {
          source: source(SOURCE_LABELS.orphieCore, 'orphie', 'core'),
          basisLabel: 'Initial Energy Regen', current: initialEnergy,
          threshold: values.coreEnergyThreshold,
          cap: 3.7,
          outputLabel: 'Squad flat ATK', outputValue: orphieCoreSquadAtk(initialEnergy),
          outputCap: values.coreSquadAtkCap, outputUnit: '',
          decimals: { current: 3, threshold: 1, cap: 1, output: 0, outputCap: 0 },
        },
      },
      ...optionalMetric('defIgnore', 'DEF Ignore', effects, actions),
      ...optionalMetric('defReduction', 'DEF Reduction', effects),
      ...optionalMetric('resIgnore', 'RES Ignore', effects, actions),
      ...optionalMetric('resReduction', 'RES Reduction', effects),
      ...optionalMetric('stunDmgMultiplier', 'Stun DMG Multiplier', effects),
    ],
    actionModifiers: actions,
    operations: [],
  }
}
