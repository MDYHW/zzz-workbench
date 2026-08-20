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
  percentage,
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

export interface HugoCalculationContext {
  agentId: 'hugo'
  setup: CompleteSetup
  additionalActive: boolean
  stunAgentCount: number
  initialAtk: number
}

export const HUGO_TOTALIZE = actionTarget([sourceLocalAction('Totalize')])
const HUGO_CHAIN = actionTarget([canonicalAction('Chain Attack')])
const HUGO_ULTIMATE = actionTarget([canonicalAction('Ultimate')])
const HUGO_BASIC_ULTIMATE = actionTarget([
  canonicalAction('Basic Attack'),
  canonicalAction('Ultimate'),
])
const HUGO_BACK_ATTACK = actionTarget([sourceLocalAction('Back attacks')])
const HUGO_DAMAGE_SCOPES = [
  { id: 'hugoChain', target: HUGO_CHAIN },
  { id: 'hugoUltimate', target: HUGO_ULTIMATE },
  { id: 'hugoTotalize', target: HUGO_TOTALIZE },
  { id: 'hugoBackAttack', target: HUGO_BACK_ATTACK },
] satisfies readonly ActionScopeNode[]
const HUGO_DEF_SCOPES = [
  { id: 'hugoBasicUltimate', target: HUGO_BASIC_ULTIMATE },
  { id: 'hugoTotalize', target: HUGO_TOTALIZE },
] satisfies readonly ActionScopeNode[]

export function observeHugo(
  setup: CompleteSetup,
  additionalActive: boolean,
  stunAgentCount: number,
): HugoCalculationContext {
  const initialAtk = initialAtkFor('hugo', setup)
  if (initialAtk === null) throw new Error('Complete Hugo setup requires a W-Engine')
  return { agentId: 'hugo', setup, additionalActive, stunAgentCount, initialAtk }
}

export function resolveHugoProviderClauses(
  context: HugoCalculationContext,
): SourceBoundCurrentClause[] {
  const { setup } = context
  const values = VERTICAL_VALUES.hugo
  const engine = engineSource('hugo', setup)
  const refinement = setup.refinement
  const baseAtk = values.atk + W_ENGINES[setup.engineId].baseAtk
  const stunAtk = context.stunAgentCount >= 2
    ? values.coreAtkTwoStun
    : context.stunAgentCount === 1
      ? values.coreAtkOneStun
      : 0

  return active([
    additive('atk', 'fully', STATIC_SOURCES.hugo.core, stunAtk, 'self'),
    additive('critRate', 'combat', STATIC_SOURCES.hugo.core, values.coreCritRate, 'self'),
    additive('critDmg', 'combat', STATIC_SOURCES.hugo.core, values.coreCritDmg, 'self'),
    additive(
      'dmgBonus', 'fully', STATIC_SOURCES.hugo.additional,
      context.additionalActive ? values.additionalChainDmg : 0, 'self', HUGO_CHAIN,
    ),
    additive(
      'dmgBonus', 'fully', STATIC_SOURCES.hugo.additional,
      context.additionalActive ? values.additionalTotalizeDmg : 0, 'self', HUGO_TOTALIZE,
    ),
    additive(
      'critRate', 'combat', mindscapeSource('hugo', 1, 'Dark Abyss Reverb'),
      setup.mindscape >= 1 ? values.mindscapeCritRate : 0, 'self',
    ),
    additive(
      'critDmg', 'combat', mindscapeSource('hugo', 1, 'Dark Abyss Reverb'),
      setup.mindscape >= 1 ? values.mindscapeCritDmg : 0, 'self',
    ),
    additive(
      'defIgnore', 'fully', mindscapeSource('hugo', 2),
      setup.mindscape >= 2 ? values.mindscapeTotalizeDefIgnore : 0,
      'enemy-context', HUGO_TOTALIZE, undefined, ['hugo'],
    ),
    withApplicability(
      additive(
        'resIgnore', 'fully', mindscapeSource('hugo', 4, 'After a charged shot'),
        setup.mindscape >= 4 ? values.mindscapeIceResIgnore : 0,
        'enemy-context', undefined, undefined, ['hugo'],
      ),
      { attributes: ['Ice'] },
    ),
    additive(
      'dmgBonus', 'fully', mindscapeSource('hugo', 6),
      setup.mindscape >= 6 ? values.mindscapeTotalizeDmg : 0, 'self', HUGO_TOTALIZE,
    ),
    additive(
      'critDmg', 'combat', engine,
      setup.engineId === 'myriadEclipse'
        ? equipmentEffectBaseValue(W_ENGINE_FACTS.myriadEclipse.effects.critDamage, refinement)
        : setup.engineId === 'heartstringNocturne'
          ? equipmentEffectBaseValue(W_ENGINE_FACTS.heartstringNocturne.effects.critDamage, refinement)
          : 0,
      'self',
    ),
    additive(
      'critRate', 'combat', engine,
      setup.engineId === 'cordisGermina'
        ? equipmentEffectBaseValue(W_ENGINE_FACTS.cordisGermina.effects.critRate, refinement)
        : 0,
      'self',
    ),
    additive(
      'defIgnore', 'combat', engine,
      setup.engineId === 'myriadEclipse'
        ? equipmentEffectBaseValue(W_ENGINE_FACTS.myriadEclipse.effects.defIgnore, refinement)
        : 0,
      'enemy-context', undefined, undefined, ['hugo'],
    ),
    additive(
      'defIgnore', 'fully', engine,
      setup.engineId === 'cordisGermina'
        ? equipmentEffectBaseValue(W_ENGINE_FACTS.cordisGermina.effects.defIgnore, refinement)
        : 0,
      'enemy-context', HUGO_BASIC_ULTIMATE, undefined, ['hugo'],
    ),
    additive(
      'dmgBonus', 'fully', engine,
      setup.engineId === 'steelCushion'
        ? equipmentEffectBaseValue(W_ENGINE_FACTS.steelCushion.effects.damage, refinement)
        : 0,
      'self', HUGO_BACK_ATTACK,
    ),
    percentage(
      'atk', 'fully', engine,
      setup.engineId === 'marcatoDesire'
        ? equipmentEffectMaximumValue(W_ENGINE_FACTS.marcatoDesire.effects.atk, refinement)
        : 0,
      'self',
    ),
    additive(
      'atk', 'combat', discSource('hugo', 'hormonePunk', '4-piece'),
      setup.fourPieceId === 'hormonePunk'
        ? baseAtk * equipmentEffectBaseValue(DRIVE_DISC_FACTS.hormonePunk.fourPiece.atk) / 100
        : 0,
      'self', undefined,
      setup.fourPieceId === 'hormonePunk'
        ? { value: equipmentEffectBaseValue(DRIVE_DISC_FACTS.hormonePunk.fourPiece.atk), unit: '%', decimals: 0 }
        : undefined,
    ),
    ...pufferElectroFourPieceClauses('hugo', setup, HUGO_ULTIMATE),
  ])
}

function optionalMetric(
  metric: EffectMetric,
  label: string,
  effects: ReturnType<typeof resolveDeliveredClauses>,
  actions: AgentResult['actionModifiers'] = [],
): AgentResult['metrics'] {
  const data = composeMetricEffects(surfaces(0, 0, 0), surfaces([], [], []), effects, metric)
  return data.values.fully || actions.some(({ metricId }) => metricId === metric)
    ? [{ id: metric, label, unit: '%', decimals: 1, ...data }]
    : []
}

export function calculateHugo(
  context: HugoCalculationContext,
  inbox: SourceBoundCurrentClause[],
  enemy: SourceBoundCurrentClause[],
): AgentResult {
  const { setup, initialAtk } = context
  const values = VERTICAL_VALUES.hugo
  const baseAtk = values.atk + W_ENGINES[setup.engineId].baseAtk
  const effects = resolveDeliveredClauses([...inbox, ...enemy], { atk: initialAtk })

  const atkInputs = presentSetupInputs([
    engineAdvancedInput(setup, 'hugo', 'atkPct'),
    mainStatInput(setup, 'hugo', 'slot5', 'atkPct'),
    mainStatInput(setup, 'hugo', 'slot6', 'atkPct'),
    ...selectedDiscTwoPieceInputs(setup, 'hugo', { modifier: 'atk' }),
    effectiveSubstatInput(setup, 'hugo', 'atkPct'),
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
    engineAdvancedInput(setup, 'hugo', 'critRate'),
    mainStatInput(setup, 'hugo', 'slot4', 'critRate'),
    ...selectedDiscTwoPieceInputs(setup, 'hugo', { modifier: 'critRate' }),
    effectiveSubstatInput(setup, 'hugo', 'critRate'),
  ])
  const initialCritRate = values.critRate
    + critRateInputs.reduce((total, input) => total + input.rawValue, 0)
  const critRate = composeMetricEffects(
    surfaces(initialCritRate, initialCritRate, initialCritRate),
    surfaces(critRateInputs.map((input) => contribution(input.source, input.rawValue)), [], []),
    effects,
    'critRate',
    { value: 100, source: STATIC_SOURCES.hugo.critCap },
  )

  const critDmgInputs = presentSetupInputs([
    engineAdvancedInput(setup, 'hugo', 'critDmg'),
    mainStatInput(setup, 'hugo', 'slot4', 'critDmg'),
    ...selectedDiscTwoPieceInputs(setup, 'hugo', { modifier: 'critDmg' }),
    effectiveSubstatInput(setup, 'hugo', 'critDmg'),
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
    mainStatInput(setup, 'hugo', 'slot5', 'iceDmg'),
    ...selectedDiscTwoPieceInputs(setup, 'hugo', { modifier: 'dmgBonus' }),
  ])
  const initialDmg = dmgInputs.reduce((total, input) => total + input.rawValue, 0)
  const dmg = composeMetricEffects(
    surfaces(initialDmg, initialDmg, initialDmg),
    surfaces(dmgInputs.map((input) => contribution(input.source, input.rawValue)), [], []),
    effects,
    'dmgBonus',
  )

  const penInputs = presentSetupInputs([
    mainStatInput(setup, 'hugo', 'slot5', 'penRatio'),
    ...selectedDiscTwoPieceInputs(setup, 'hugo', { modifier: 'penRatio' }),
  ])
  const initialPen = penInputs.reduce((total, input) => total + input.rawValue, 0)
  const pen = composeMetricEffects(
    surfaces(initialPen, initialPen, initialPen),
    surfaces(penInputs.map((input) => contribution(input.source, input.rawValue)), [], []),
    effects,
    'penRatio',
  )

  const defIgnore = composeMetricEffects(surfaces(0, 0, 0), surfaces([], [], []), effects, 'defIgnore')
  const actionModifiers = [
    ...composeActionHierarchy(dmg.values, effects, 'dmgBonus', HUGO_DAMAGE_SCOPES),
    ...composeActionHierarchy(defIgnore.values, effects, 'defIgnore', HUGO_DEF_SCOPES, 'DefIgnore'),
  ]

  return {
    agentId: 'hugo',
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
    ],
    actionModifiers,
    operations: [
      {
        id: 'hugoTotalizeAddedDmgMultiplier',
        label: 'Totalize added DMG Multiplier',
        source: STATIC_SOURCES.hugo.core,
        surface: 'fully',
        value: values.coreTotalizeMultiplier,
        unit: '%',
      },
      {
        id: 'hugoTotalizeDazeReturn',
        label: 'Totalize maximum Daze return',
        source: STATIC_SOURCES.hugo.core,
        surface: 'fully',
        value: values.coreDazeReturn,
        unit: '%',
      },
      {
        id: 'hugoExNonStunnedDaze',
        label: 'EX Special Daze against non-Stunned enemies',
        source: STATIC_SOURCES.hugo.core,
        surface: 'combat',
        value: 1 + values.exNonStunnedDaze / 100,
        unit: '',
        presentation: 'scale',
      },
      ...(setup.mindscape >= 6
        ? [{
          id: 'hugoExNonStunnedTotalizeAddedMultiplier',
          label: 'EX Special non-Stunned Totalize added DMG Multiplier',
          source: mindscapeSource('hugo', 6),
          surface: 'fully' as const,
          value: values.mindscapeExTotalizeMultiplier,
          unit: '%',
        }]
        : []),
    ],
  }
}
