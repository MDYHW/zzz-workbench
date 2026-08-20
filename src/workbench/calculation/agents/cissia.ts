import {
  DRIVE_DISC_FACTS,
  VERTICAL_VALUES,
  W_ENGINE_FACTS,
  W_ENGINES,
  equipmentEffectBaseValue,
  equipmentEffectMaximumValue,
  equipmentEffectProgressionValue,
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
  pufferElectroFourPieceClauses,
  presentSetupInputs,
  resolveDeliveredClauses,
  withApplicability,
  type CompleteSetup,
  type EffectMetric,
  type ResolvedSetupInput,
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
  energyRegenProjection,
  percentageContribution,
  surfaces,
  type ActionScopeNode,
} from '../composition'
import type { AgentResult } from '../result'
import { initialAtkFor } from '../initial-atk'

export interface CissiaCalculationContext {
  agentId: 'cissia'
  setup: CompleteSetup
  initialAtk: number
  initialEnergyRegen: number
}

const CISSIA_CORRODE = actionTarget([
  sourceLocalAction('Corrode Bone', 'Basic Attack'),
])

const CISSIA_SERPENT = actionTarget([
  actionForm('Basic Attack', "Serpent's Kiss"),
])

const CISSIA_BASIC_ACTIONS = actionTarget([
  ...CISSIA_CORRODE.outcomes,
  ...CISSIA_SERPENT.outcomes,
])

const CISSIA_ULTIMATE = actionTarget([canonicalAction('Ultimate')])

const CISSIA_ACTION_SCOPES = [{
  id: 'cissiaBasicActions',
  target: CISSIA_BASIC_ACTIONS,
  children: [
    { id: 'cissiaCorrode', target: CISSIA_CORRODE },
    { id: 'cissiaSerpent', target: CISSIA_SERPENT },
  ],
}, {
  id: 'cissiaUltimate',
  target: CISSIA_ULTIMATE,
}] satisfies readonly ActionScopeNode[]

function cissiaAtkInputs(setup: CompleteSetup): ResolvedSetupInput[] {
  return presentSetupInputs([
    engineAdvancedInput(setup, 'cissia', 'atkPct'),
    mainStatInput(setup, 'cissia', 'slot5', 'atkPct'),
    mainStatInput(setup, 'cissia', 'slot6', 'atkPct'),
    ...selectedDiscTwoPieceInputs(setup, 'cissia', { modifier: 'atk' }),
    effectiveSubstatInput(setup, 'cissia', 'atkPct'),
  ])
}

function cissiaEnergyInputs(setup: CompleteSetup): ResolvedSetupInput[] {
  return presentSetupInputs([
    engineAdvancedInput(setup, 'cissia', 'energyRegenPct'),
    mainStatInput(setup, 'cissia', 'slot6', 'energyRegenPct'),
    ...selectedDiscTwoPieceInputs(setup, 'cissia', { modifier: 'energyRegen' }),
  ])
}

export function observeCissia(setup: CompleteSetup): CissiaCalculationContext {
  const initialAtk = initialAtkFor('cissia', setup)
  if (initialAtk === null) throw new Error('Complete Cissia setup requires a W-Engine')
  const initialEnergyRegen = VERTICAL_VALUES.cissia.baseEnergyRegen * (
    1 + cissiaEnergyInputs(setup).reduce((total, input) => total + input.rawValue, 0) / 100
  )
  return { agentId: 'cissia', setup, initialAtk, initialEnergyRegen }
}

function cissiaCoreDefIgnore(
  initialEnergyRegen: number,
  mindscape: CompleteSetup['mindscape'],
): number {
  const capped = Math.min(
    25,
    6 + Math.max(initialEnergyRegen - 1.4, 0) / 0.12,
  )
  return capped * (mindscape >= 1 ? 1.4 : 1)
}

function dawnClauses(setup: CompleteSetup): SourceBoundCurrentClause[] {
  if (setup.fourPieceId !== 'dawnsBloom') return []
  const initial = equipmentEffectBaseValue(DRIVE_DISC_FACTS.dawnsBloom.twoPiece.damage)
  const combat = equipmentEffectBaseValue(DRIVE_DISC_FACTS.dawnsBloom.fourPiece.damage)
  const fully = equipmentEffectProgressionValue(DRIVE_DISC_FACTS.dawnsBloom.fourPiece.damage)
  const twoPiece = discSource('cissia', 'dawnsBloom', '2-piece', '4-piece')
  const fourPiece = discSource('cissia', 'dawnsBloom', '4-piece')
  return [
    additive('dmgBonus', 'initial', twoPiece, initial, 'self', CISSIA_BASIC_ACTIONS),
    additive('dmgBonus', 'combat', fourPiece, combat, 'self', CISSIA_BASIC_ACTIONS),
    additive('dmgBonus', 'fully', fourPiece, fully, 'self', CISSIA_BASIC_ACTIONS),
  ]
}

export function resolveCissiaProviderClauses(
  context: CissiaCalculationContext,
  party: { electricAgentCount: number; additionalActive: boolean },
): SourceBoundCurrentClause[] {
  const { setup } = context
  const engine = engineSource('cissia', setup)
  const refinement = setup.refinement
  const cordisDmg = setup.engineId === 'cordisGermina'
    ? equipmentEffectMaximumValue(W_ENGINE_FACTS.cordisGermina.effects.damage, refinement)
    : 0
  const cordisDefIgnore = setup.engineId === 'cordisGermina'
    ? equipmentEffectBaseValue(W_ENGINE_FACTS.cordisGermina.effects.defIgnore, refinement)
    : 0
  const drillDmg = setup.engineId === 'drillRigRedAxis'
    ? equipmentEffectBaseValue(W_ENGINE_FACTS.drillRigRedAxis.effects.damage, refinement)
    : 0
  const coreDefIgnore = cissiaCoreDefIgnore(context.initialEnergyRegen, setup.mindscape)
  const electricGeneral = (clause: SourceBoundCurrentClause) => withApplicability(
    clause,
    { attributes: ['Electric'], formulas: ['general_damage'] },
  )
  const critRecipients = (clause: SourceBoundCurrentClause) => withApplicability(
    clause,
    { formulas: ['general_damage', 'sheer_damage'] },
  )
  return active([
    electricGeneral(additive('defIgnore', 'combat', STATIC_SOURCES.cissia.core,
      coreDefIgnore, 'enemy-context', undefined, {
        value: coreDefIgnore,
        unit: '%',
        decimals: 3,
      })),
    additive('critRate', 'fully', STATIC_SOURCES.cissia.basic, 18, 'self'),
    additive('dazeBonus', 'fully', STATIC_SOURCES.cissia.basic,
      party.electricAgentCount >= 2 ? 60 : 40, 'self', CISSIA_CORRODE),
    critRecipients(additive('critDmg', 'combat', STATIC_SOURCES.cissia.additional,
      party.additionalActive ? 40 : 0, 'all-party')),
    additive('critDmg', 'combat', STATIC_SOURCES.cissia.additional,
      party.additionalActive ? 10 : 0, 'self'),
    critRecipients(additive('critDmg', 'fully', STATIC_SOURCES.cissia.ultimate,
      5, 'all-party')),
    electricGeneral(additive('resIgnore', 'combat', mindscapeSource('cissia', 1),
      setup.mindscape >= 1 ? 5 : 0, 'enemy-context')),
    electricGeneral(additive('resIgnore', 'fully', mindscapeSource('cissia', 1, 'Corrode Bone'),
      setup.mindscape >= 1 ? 10 : 0, 'enemy-context', CISSIA_CORRODE, undefined, ['cissia'])),
    additive('dmgBonus', 'fully', mindscapeSource('cissia', 2, "Serpent's Kiss"),
      setup.mindscape >= 2 ? 35 : 0, 'self', CISSIA_SERPENT),
    additive('critRate', 'combat', engine, setup.engineId === 'serpentineSeeker'
      ? equipmentEffectBaseValue(W_ENGINE_FACTS.serpentineSeeker.effects.critRate, refinement)
      : setup.engineId === 'bellicoseBlaze'
        ? equipmentEffectBaseValue(W_ENGINE_FACTS.bellicoseBlaze.effects.critRate, refinement)
      : setup.engineId === 'cordisGermina'
        ? equipmentEffectBaseValue(W_ENGINE_FACTS.cordisGermina.effects.critRate, refinement)
        : 0, 'self'),
    additive('defIgnore', 'combat', engine, setup.engineId === 'serpentineSeeker'
      ? equipmentEffectBaseValue(W_ENGINE_FACTS.serpentineSeeker.effects.defIgnore, refinement)
      : 0, 'enemy-context', undefined, undefined, ['cissia']),
    additive('dmgBonus', 'fully', engine, drillDmg + cordisDmg, 'self', CISSIA_BASIC_ACTIONS),
    additive('defIgnore', 'fully', engine, cordisDefIgnore, 'enemy-context', CISSIA_BASIC_ACTIONS, undefined, ['cissia']),
    additive('dmgBonus', 'fully', engine, cordisDmg, 'self', CISSIA_ULTIMATE),
    additive('defIgnore', 'fully', engine, cordisDefIgnore, 'enemy-context', CISSIA_ULTIMATE, undefined, ['cissia']),
    ...dawnClauses(setup),
    ...pufferElectroFourPieceClauses('cissia', setup, CISSIA_ULTIMATE),
  ])
}

function optionalMetric(
  metric: EffectMetric,
  id: EffectMetric,
  label: string,
  effects: ReturnType<typeof resolveDeliveredClauses>,
  decimals = 1,
): AgentResult['metrics'] {
  const data = composeMetricEffects(surfaces(0, 0, 0), surfaces([], [], []), effects, metric)
  return data.values.fully === 0 ? [] : [{ id, label, unit: '%', decimals, ...data }]
}

export function calculateCissia(
  context: CissiaCalculationContext,
  inbox: SourceBoundCurrentClause[],
  enemy: SourceBoundCurrentClause[],
): AgentResult {
  const { setup, initialAtk } = context
  const baseAtk = VERTICAL_VALUES.cissia.atk + W_ENGINES[setup.engineId].baseAtk
  const atkInputs = cissiaAtkInputs(setup)
  const effects = resolveDeliveredClauses([...inbox, ...enemy], { atk: initialAtk })
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
    engineAdvancedInput(setup, 'cissia', 'critRate'),
    mainStatInput(setup, 'cissia', 'slot4', 'critRate'),
    ...selectedDiscTwoPieceInputs(setup, 'cissia', { modifier: 'critRate' }),
    effectiveSubstatInput(setup, 'cissia', 'critRate'),
  ])
  const initialCritRate = VERTICAL_VALUES.cissia.critRate + critRateInputs.reduce((total, input) => total + input.rawValue, 0)
  const critRate = composeMetricEffects(
    surfaces(Math.min(initialCritRate, 100), Math.min(initialCritRate, 100), Math.min(initialCritRate, 100)),
    surfaces(critRateInputs.map((input) => contribution(input.source, input.rawValue)), [], []),
    effects,
    'critRate',
    { value: 100, source: STATIC_SOURCES.cissia.critCap },
  )
  const critDmgInputs = presentSetupInputs([
    engineAdvancedInput(setup, 'cissia', 'critDmg'),
    mainStatInput(setup, 'cissia', 'slot4', 'critDmg'),
    ...selectedDiscTwoPieceInputs(setup, 'cissia', { modifier: 'critDmg' }),
    effectiveSubstatInput(setup, 'cissia', 'critDmg'),
  ])
  const initialCritDmg = VERTICAL_VALUES.cissia.critDmg + critDmgInputs.reduce((total, input) => total + input.rawValue, 0)
  const critDmg = composeMetricEffects(
    surfaces(initialCritDmg, initialCritDmg, initialCritDmg),
    surfaces(critDmgInputs.map((input) => contribution(input.source, input.rawValue)), [], []),
    effects,
    'critDmg',
  )
  const energy = energyRegenProjection(VERTICAL_VALUES.cissia.baseEnergyRegen, cissiaEnergyInputs(setup), effects)
  const electricDmgInputs = presentSetupInputs([
    mainStatInput(setup, 'cissia', 'slot5', 'electricDmg'),
    ...selectedDiscTwoPieceInputs(setup, 'cissia', { modifier: 'dmgBonus' }),
  ])
  const initialElectricDmg = electricDmgInputs.reduce((total, input) => total + input.rawValue, 0)
  const regular = composeMetricEffects(
    surfaces(initialElectricDmg, initialElectricDmg, initialElectricDmg),
    surfaces(electricDmgInputs.map((input) => contribution(input.source, input.rawValue)), [], []),
    effects,
    'dmgBonus',
  )
  const penInputs = selectedDiscTwoPieceInputs(setup, 'cissia', { modifier: 'penRatio' })
  const initialPen = penInputs.reduce((total, input) => total + input.rawValue, 0)
  const penRatio = composeMetricEffects(
    surfaces(initialPen, initialPen, initialPen),
    surfaces(penInputs.map((input) => contribution(input.source, input.rawValue)), [], []),
    effects,
    'penRatio',
  )
  const broadDefIgnore = composeMetricEffects(surfaces(0, 0, 0), surfaces([], [], []), effects, 'defIgnore')
  const broadResIgnore = composeMetricEffects(surfaces(0, 0, 0), surfaces([], [], []), effects, 'resIgnore')
  const dazeBonus = composeMetricEffects(surfaces(0, 0, 0), surfaces([], [], []), effects, 'dazeBonus')
  const actionModifiers: AgentResult['actionModifiers'] = [
    ...composeActionHierarchy(regular.values, effects, 'dmgBonus', CISSIA_ACTION_SCOPES),
    ...composeActionHierarchy(
      broadDefIgnore.values,
      effects,
      'defIgnore',
      CISSIA_ACTION_SCOPES,
      'DefIgnore',
    ),
    ...composeActionHierarchy(
      broadResIgnore.values,
      effects,
      'resIgnore',
      CISSIA_ACTION_SCOPES,
      'ResIgnore',
    ),
    ...composeActionHierarchy(
      dazeBonus.values,
      effects,
      'dazeBonus',
      CISSIA_ACTION_SCOPES,
      'Daze',
    ),
  ]

  return {
    agentId: 'cissia',
    metrics: [
      { id: 'atk', label: 'ATK', unit: '', decimals: 0, ...atk },
      { id: 'critRate', label: 'CRIT Rate', unit: '%', decimals: 1, ...critRate },
      { id: 'critDmg', label: 'CRIT DMG', unit: '%', decimals: 1, ...critDmg },
      {
        id: 'energyRegen',
        label: 'Energy Regen',
        unit: '',
        decimals: 3,
        ...energy,
        gauge: {
          source: STATIC_SOURCES.cissia.core,
          basisLabel: 'Initial Energy Regen',
          current: context.initialEnergyRegen,
          threshold: 1.4,
          cap: 3.68,
          outputLabel: 'Electric DEF Ignore',
          outputValue: cissiaCoreDefIgnore(context.initialEnergyRegen, setup.mindscape),
          outputCap: setup.mindscape >= 1 ? 35 : 25,
          outputUnit: '%',
          decimals: { current: 3, threshold: 1, cap: 2, output: 3, outputCap: 0 },
        },
      },
      { id: 'dmgBonus', label: 'DMG Bonus', unit: '%', decimals: 1, ...regular },
      ...(penRatio.values.fully ? [{ id: 'penRatio' as const, label: 'PEN Ratio', unit: '%', decimals: 1, ...penRatio }] : []),
      { id: 'dazeBonus', label: 'Daze Bonus', unit: '%', decimals: 1, ...dazeBonus },
      ...optionalMetric('defIgnore', 'defIgnore', 'DEF Ignore', effects, 3),
      ...optionalMetric('defReduction', 'defReduction', 'DEF Reduction', effects),
      ...optionalMetric('resIgnore', 'resIgnore', 'RES Ignore', effects),
      ...optionalMetric('resReduction', 'resReduction', 'RES Reduction', effects),
      ...optionalMetric('stunDmgMultiplier', 'stunDmgMultiplier', 'Stun DMG Multiplier', effects),
    ],
    actionModifiers,
    operations: [],
  }
}
