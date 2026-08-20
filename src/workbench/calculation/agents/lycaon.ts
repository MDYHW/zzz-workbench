import {
  DRIVE_DISC_FACTS,
  VERTICAL_VALUES,
  W_ENGINE_FACTS,
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
  percentage,
  presentSetupInputs,
  resolveDeliveredClauses,
  withApplicability,
  type CompleteSetup,
  type SourceBoundCurrentClause,
} from '../../effects'
import {
  actionForm,
  actionTarget,
  canonicalAction,
  sourceLocalAction,
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

export interface LycaonCalculationContext {
  agentId: 'lycaon'
  setup: CompleteSetup
  additionalActive: boolean
}

export const observeLycaon = (
  setup: CompleteSetup,
  additionalActive: boolean,
): LycaonCalculationContext => ({ agentId: 'lycaon', setup, additionalActive })

const CHARGED = actionTarget([
  canonicalAction('Basic Attack'),
  canonicalAction('Dash Attack'),
  canonicalAction('Dodge Counter'),
])
const BASIC = actionTarget([canonicalAction('Basic Attack')])
const EX = actionTarget([canonicalAction('EX Special Attack')])
const FULL_CHARGE_EX = actionTarget([actionForm('EX Special Attack', 'Fully charged')])
const ASSIST = actionTarget([canonicalAction('Assist Follow-Up')])
const GLACIAL_WALTZ = actionTarget([sourceLocalAction('Glacial Waltz')])

const DAZE_SCOPES = [
  {
    id: 'lycaonCharged', target: CHARGED,
    children: [{ id: 'lycaonBasic', target: BASIC }],
  },
  {
    id: 'lycaonEx',
    target: EX,
    children: [{ id: 'lycaonFullChargeEx', target: FULL_CHARGE_EX }],
  },
  { id: 'lycaonAssist', target: ASSIST },
  { id: 'lycaonGlacialWaltz', target: GLACIAL_WALTZ },
] satisfies readonly ActionScopeNode[]
const POTENTIAL_SCOPES = [
  { id: 'lycaonPotential', target: CHARGED },
] satisfies readonly ActionScopeNode[]

export function resolveLycaonProviderClauses(
  context: LycaonCalculationContext,
): SourceBoundCurrentClause[] {
  const { setup } = context
  const engine = engineSource('lycaon', setup)
  const refinement = setup.refinement
  const kingBase = equipmentEffectBaseValue(DRIVE_DISC_FACTS.king.fourPiece.critDamage)
  const kingMax = equipmentEffectMaximumValue(DRIVE_DISC_FACTS.king.fourPiece.critDamage)
  const kingCrit = VERTICAL_VALUES.lycaon.critRate
    + (mainStatInput(setup, 'lycaon', 'slot4', 'critRate')?.rawValue ?? 0)
    + selectedDiscTwoPieceInputs(setup, 'lycaon', { modifier: 'critRate' })
      .reduce((total, input) => total + input.rawValue, 0)
    + (effectiveSubstatInput(setup, 'lycaon', 'critRate')?.rawValue ?? 0)
  const kingCritDmg = setup.fourPieceId === 'king'
    ? (kingCrit >= VERTICAL_VALUES.lycaon.kingCritThreshold ? kingMax : kingBase)
    : 0

  return active([
    additive(
      'dazeBonus',
      'combat',
      STATIC_SOURCES.lycaon.core,
      VERTICAL_VALUES.lycaon.coreChargedDaze,
      'self',
      CHARGED,
    ),
    withApplicability(
      additive(
        'resReduction',
        'fully',
        STATIC_SOURCES.lycaon.coreDebuff,
        VERTICAL_VALUES.lycaon.coreIceResReduction,
        'enemy-context',
      ),
      { attributes: ['Ice'] },
    ),
    withApplicability(
      additive(
        'dmgBonus',
        'fully',
        STATIC_SOURCES.lycaon.coreDebuff,
        VERTICAL_VALUES.lycaon.coreOtherAttributeDmg,
        'enemy-context',
      ),
      {
        formulas: ['general_damage', 'sheer_damage', 'anomaly_damage'],
        attributes: ['Physical', 'Fire', 'Electric', 'Ether'],
      },
    ),
    additive(
      'stunDmgMultiplier',
      'fully',
      STATIC_SOURCES.lycaon.additional,
      context.additionalActive ? VERTICAL_VALUES.lycaon.additionalStunMultiplier : 0,
      'enemy-context',
    ),
    percentage(
      'impact',
      'fully',
      STATIC_SOURCES.lycaon.potential,
      VERTICAL_VALUES.lycaon.potentialImpact,
      'self',
      CHARGED,
    ),
    additive(
      'dazeBonus',
      'fully',
      STATIC_SOURCES.lycaon.core,
      VERTICAL_VALUES.lycaon.glacialWaltzDaze,
      'self',
      GLACIAL_WALTZ,
    ),
    additive(
      'dazeBonus',
      'fully',
      mindscapeSource('lycaon', 1, 'EX Special Attack'),
      setup.mindscape >= 1 ? VERTICAL_VALUES.lycaon.mindscapeExDaze : 0,
      'self',
      EX,
    ),
    additive(
      'dazeBonus',
      'fully',
      mindscapeSource('lycaon', 1, 'Fully charged EX Special Attack'),
      setup.mindscape >= 1 ? VERTICAL_VALUES.lycaon.mindscapeFullChargeDaze : 0,
      'self',
      FULL_CHARGE_EX,
    ),
    percentage(
      'impact',
      'fully',
      engine,
      setup.engineId === 'blazingLaurel'
        ? equipmentEffectBaseValue(W_ENGINE_FACTS.blazingLaurel.effects.impact, refinement)
        : setup.engineId === 'hellfireGears'
          ? equipmentEffectBaseValue(W_ENGINE_FACTS.hellfireGears.effects.impact, refinement)
          : setup.engineId === 'steamOven'
            ? equipmentEffectMaximumValue(W_ENGINE_FACTS.steamOven.effects.impact, refinement)
            : 0,
      'self',
    ),
    withApplicability(
      additive(
        'critDmg',
        'fully',
        engine,
        setup.engineId === 'blazingLaurel'
          ? equipmentEffectMaximumValue(W_ENGINE_FACTS.blazingLaurel.effects.critDamage, refinement)
          : 0,
        'all-party',
      ),
      { formulas: ['general_damage', 'sheer_damage'], attributes: ['Fire', 'Ice'] },
    ),
    additive(
      'dazeBonus',
      'fully',
      engine,
      setup.engineId === 'restrained'
        ? equipmentEffectMaximumValue(W_ENGINE_FACTS.restrained.effects.daze, refinement)
        : 0,
      'self',
      BASIC,
    ),
    additive(
      'dazeBonus',
      'fully',
      engine,
      setup.engineId === 'preciousFossilizedCore'
        ? equipmentEffectMaximumValue(W_ENGINE_FACTS.preciousFossilizedCore.effects.daze, refinement)
        : 0,
      'self',
    ),
    additive(
      'dazeBonus',
      'fully',
      engine,
      setup.engineId === 'simmeringPot'
        ? equipmentEffectBaseValue(W_ENGINE_FACTS.simmeringPot.effects.daze, refinement)
        : 0,
      'self',
      ASSIST,
    ),
    withApplicability(
      additive(
        'critDmg',
        'fully',
        discSource('lycaon', 'king', '4-piece'),
        kingCritDmg,
        'all-party',
        undefined,
        undefined,
        undefined,
        'kingOfTheSummit',
      ),
      { formulas: ['general_damage', 'sheer_damage'] },
    ),
    additive(
      'dazeBonus',
      'fully',
      discSource('lycaon', 'shockstar', '4-piece'),
      setup.fourPieceId === 'shockstar'
        ? equipmentEffectBaseValue(DRIVE_DISC_FACTS.shockstar.fourPiece.daze)
        : 0,
      'self',
      CHARGED,
    ),
  ])
}

export function calculateLycaon(
  context: LycaonCalculationContext,
  inbox: SourceBoundCurrentClause[],
  enemy: SourceBoundCurrentClause[],
): AgentResult {
  const { setup } = context
  const impactInputs = presentSetupInputs([
    engineAdvancedInput(setup, 'lycaon', 'impactPct'),
    mainStatInput(setup, 'lycaon', 'slot6', 'impact'),
    ...selectedDiscTwoPieceInputs(setup, 'lycaon', { modifier: 'impact' }),
  ])
  const impactBase = VERTICAL_VALUES.lycaon.impact * (
    1 + impactInputs.reduce((total, input) => total + input.rawValue, 0) / 100
  )
  const effects = resolveDeliveredClauses(
    [...inbox, ...enemy],
    { impact: VERTICAL_VALUES.lycaon.impact },
  )
  const impact = composeMetricEffects(
    surfaces(impactBase, impactBase, impactBase),
    surfaces(impactInputs.map((input) => percentageContribution(
      input.source,
      VERTICAL_VALUES.lycaon.impact * input.rawValue / 100,
      input.rawValue,
    )), [], []),
    effects,
    'impact',
  )

  const energyInputs = presentSetupInputs([
    engineAdvancedInput(setup, 'lycaon', 'energyRegenPct'),
    mainStatInput(setup, 'lycaon', 'slot6', 'energyRegenPct'),
    ...selectedDiscTwoPieceInputs(setup, 'lycaon', { modifier: 'energyRegen' }),
  ])
  const energyBase = VERTICAL_VALUES.lycaon.baseEnergyRegen * (
    1 + energyInputs.reduce((total, input) => total + input.rawValue, 0) / 100
  )
  const energy = composeMetricEffects(
    surfaces(energyBase, energyBase, energyBase),
    surfaces(energyInputs.map((input) => percentageContribution(
      input.source,
      VERTICAL_VALUES.lycaon.baseEnergyRegen * input.rawValue / 100,
      input.rawValue,
    )), [], []),
    effects,
    'energyRegen',
  )

  const dazeInputs = selectedDiscTwoPieceInputs(setup, 'lycaon', { modifier: 'dazeBonus' })
  const initialDaze = dazeInputs.reduce((total, input) => total + input.rawValue, 0)
  const daze = composeMetricEffects(
    surfaces(initialDaze, initialDaze, initialDaze),
    surfaces(dazeInputs.map((input) => contribution(input.source, input.rawValue)), [], []),
    effects,
    'dazeBonus',
  )
  const stun = composeMetricEffects(
    surfaces(0, 0, 0),
    surfaces([], [], []),
    effects,
    'stunDmgMultiplier',
  )
  const res = composeMetricEffects(
    surfaces(0, 0, 0),
    surfaces([], [], []),
    effects,
    'resReduction',
  )

  const critInputs = presentSetupInputs([
    mainStatInput(setup, 'lycaon', 'slot4', 'critRate'),
    ...selectedDiscTwoPieceInputs(setup, 'lycaon', { modifier: 'critRate' }),
    effectiveSubstatInput(setup, 'lycaon', 'critRate'),
  ])
  const critBase = VERTICAL_VALUES.lycaon.critRate
    + critInputs.reduce((total, input) => total + input.rawValue, 0)
  const crit = composeMetricEffects(
    surfaces(critBase, critBase, critBase),
    surfaces(critInputs.map((input) => contribution(input.source, input.rawValue)), [], []),
    effects,
    'critRate',
    { value: 100, source: STATIC_SOURCES.lycaon.critCap },
  )

  const actionModifiers = [
    ...composeActionHierarchy(impact.values, effects, 'impact', POTENTIAL_SCOPES),
    ...composeActionHierarchy(daze.values, effects, 'dazeBonus', DAZE_SCOPES),
  ]
  const critMetric = setup.fourPieceId === 'king'
    ? [{
      id: 'critRate' as const,
      label: 'CRIT Rate',
      unit: '%',
      decimals: 1,
      ...crit,
      gauge: {
        source: discSource('lycaon', 'king', '4-piece'),
        basisLabel: 'Initial CRIT Rate',
        current: crit.values.initial,
        threshold: VERTICAL_VALUES.lycaon.kingCritThreshold,
        cap: VERTICAL_VALUES.lycaon.kingCritThreshold,
        outputLabel: 'Squad CRIT DMG',
        outputValue: crit.values.initial >= VERTICAL_VALUES.lycaon.kingCritThreshold
          ? equipmentEffectMaximumValue(DRIVE_DISC_FACTS.king.fourPiece.critDamage)
          : equipmentEffectBaseValue(DRIVE_DISC_FACTS.king.fourPiece.critDamage),
        outputUnit: '%',
      },
    }]
    : []

  return {
    agentId: 'lycaon',
    metrics: [
      ...critMetric,
      { id: 'impact', label: 'Impact', unit: '', decimals: 2, ...impact },
      ...(energyInputs.length
        ? [{ id: 'energyRegen' as const, label: 'Energy Regen', unit: '/s', decimals: 2, ...energy }]
        : []),
      { id: 'dazeBonus', label: 'Daze Bonus', unit: '%', decimals: 1, ...daze },
      ...(stun.values.fully
        ? [{
          id: 'stunDmgMultiplier' as const,
          label: 'Stun DMG Multiplier',
          unit: '%',
          decimals: 1,
          ...stun,
        }]
        : []),
      ...(res.values.fully
        ? [{ id: 'resReduction' as const, label: 'RES Reduction', unit: '%', decimals: 1, ...res }]
        : []),
    ],
    actionModifiers,
    operations: [],
  }
}
