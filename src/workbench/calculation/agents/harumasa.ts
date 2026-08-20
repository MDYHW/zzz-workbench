import {
  DRIVE_DISC_FACTS,
  SOURCE_LABELS,
  VERTICAL_VALUES,
  W_ENGINE_FACTS,
  W_ENGINES,
  equipmentEffectBaseValue,
  equipmentEffectMaximumValue,
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

export interface HarumasaCalculationContext {
  agentId: 'harumasa'
  setup: CompleteSetup
  additionalActive: boolean
  initialAtk: number
}

const DASH_SLASH_OUTCOME = sourceLocalAction(
  'Dash Attack: Hiten no Tsuru - Slash',
  'Dash Attack',
)
const CHASING_THUNDER_OUTCOME = sourceLocalAction('Chasing Thunder')
const HARUMASA_DASH = actionTarget([canonicalAction('Dash Attack')])
const HARUMASA_DASH_SLASH = actionTarget([DASH_SLASH_OUTCOME])
const HARUMASA_CORE_ACTIONS = actionTarget([
  DASH_SLASH_OUTCOME,
  CHASING_THUNDER_OUTCOME,
  canonicalAction('Ultimate'),
])
const HARUMASA_DASH_CHASING = actionTarget([
  DASH_SLASH_OUTCOME,
  CHASING_THUNDER_OUTCOME,
])
const HARUMASA_BASIC_ULTIMATE = actionTarget([
  canonicalAction('Basic Attack'),
  canonicalAction('Ultimate'),
])

const HARUMASA_DAMAGE_SCOPES = [{
  id: 'harumasaDashDmg',
  target: HARUMASA_DASH,
  children: [{ id: 'harumasaDashSlashDmg', target: HARUMASA_DASH_SLASH }],
}] satisfies readonly ActionScopeNode[]
const HARUMASA_CRIT_RATE_SCOPES = [{
  id: 'harumasaCoreCritRate', target: HARUMASA_CORE_ACTIONS,
}] satisfies readonly ActionScopeNode[]
const HARUMASA_CRIT_DMG_SCOPES = [{
  id: 'harumasaCoreCritDmg', target: HARUMASA_CORE_ACTIONS,
}] satisfies readonly ActionScopeNode[]
const HARUMASA_DEF_SCOPES = [{
  id: 'harumasaBasicUltimate', target: HARUMASA_BASIC_ULTIMATE,
}] satisfies readonly ActionScopeNode[]
const HARUMASA_RES_SCOPES = [{
  id: 'harumasaDashChasing', target: HARUMASA_DASH_CHASING,
}] satisfies readonly ActionScopeNode[]

export function observeHarumasa(
  setup: CompleteSetup,
  additionalActive: boolean,
): HarumasaCalculationContext {
  const initialAtk = initialAtkFor('harumasa', setup)
  if (initialAtk === null) throw new Error('Complete Harumasa setup requires a W-Engine')
  return { agentId: 'harumasa', setup, additionalActive, initialAtk }
}

function selectedTwoPieceSource(
  setup: CompleteSetup,
  discId: 'shadowHarmony' | 'thunderMetal',
) {
  return setup.fourPieceId === discId
    ? discSource('harumasa', discId, '2-piece', '4-piece')
    : discSource('harumasa', discId, '2-piece')
}

export function resolveHarumasaProviderClauses(
  context: HarumasaCalculationContext,
): SourceBoundCurrentClause[] {
  const { setup, additionalActive } = context
  const values = VERTICAL_VALUES.harumasa
  const refinement = setup.refinement
  const engine = engineSource('harumasa', setup)
  const core = source(SOURCE_LABELS.harumasaCore, 'harumasa', 'core')
  const additional = source(SOURCE_LABELS.harumasaAbility, 'harumasa', 'additional')
  const potential = source(SOURCE_LABELS.harumasaPotential, 'harumasa', 'identity')
  const shadowSelected = setup.fourPieceId === 'shadowHarmony'
    || setup.twoPieceId === 'shadowHarmony'

  return active([
    additive('critRate', 'fully', core, values.coreCritRate, 'self', HARUMASA_CORE_ACTIONS),
    additive('critDmg', 'fully', core, values.coreCritDmg, 'self', HARUMASA_CORE_ACTIONS),
    percentage('atk', 'fully', potential, values.potentialAtk, 'self'),
    withApplicability(
      additive(
        'resIgnore', 'fully', potential, values.potentialElectricResIgnore,
        'enemy-context', HARUMASA_DASH_CHASING, undefined, ['harumasa'],
      ),
      { attributes: ['Electric'] },
    ),
    additive(
      'dmgBonus', 'fully', additional,
      additionalActive ? values.additionalDmg : 0,
      'self',
    ),
    additive(
      'dmgBonus', 'fully', mindscapeSource('harumasa', 2, 'Electro Blitz'),
      setup.mindscape >= 2 ? values.mindscapeDashDmg : 0,
      'self', HARUMASA_DASH_SLASH,
    ),
    withApplicability(
      additive(
        'resIgnore', 'fully', mindscapeSource('harumasa', 6, 'After Ha-Oto no Ya'),
        setup.mindscape >= 6 ? values.mindscapeElectricResIgnore : 0,
        'enemy-context', undefined, undefined, ['harumasa'],
      ),
      { attributes: ['Electric'] },
    ),

    additive(
      'critRate', 'combat', engine,
      setup.engineId === 'zanshinHerbCase'
        ? equipmentEffectBaseValue(W_ENGINE_FACTS.zanshinHerbCase.effects.critRate, refinement)
        : setup.engineId === 'cordisGermina'
          ? equipmentEffectBaseValue(W_ENGINE_FACTS.cordisGermina.effects.critRate, refinement)
          : 0,
      'self',
    ),
    additive(
      'critRate', 'fully', engine,
      setup.engineId === 'zanshinHerbCase'
        ? equipmentEffectBaseValue(
          W_ENGINE_FACTS.zanshinHerbCase.effects.anomalyStunCritRate,
          refinement,
        )
        : 0,
      'self',
    ),
    withApplicability(
      additive(
        'dmgBonus', 'fully', engine,
        setup.engineId === 'zanshinHerbCase'
          ? equipmentEffectBaseValue(W_ENGINE_FACTS.zanshinHerbCase.effects.dashDamage, refinement)
          : 0,
        'self', HARUMASA_DASH,
      ),
      { attributes: ['Electric'] },
    ),
    withApplicability(
      additive(
        'dmgBonus', 'fully', engine,
        setup.engineId === 'cordisGermina'
          ? equipmentEffectMaximumValue(W_ENGINE_FACTS.cordisGermina.effects.damage, refinement)
          : 0,
        'self',
      ),
      { attributes: ['Electric'] },
    ),
    additive(
      'defIgnore', 'fully', engine,
      setup.engineId === 'cordisGermina'
        ? equipmentEffectBaseValue(W_ENGINE_FACTS.cordisGermina.effects.defIgnore, refinement)
        : 0,
      'enemy-context', HARUMASA_BASIC_ULTIMATE, undefined, ['harumasa'],
    ),
    percentage(
      'atk', 'fully', engine,
      setup.engineId === 'brimstone'
        ? equipmentEffectMaximumValue(W_ENGINE_FACTS.brimstone.effects.atk, refinement)
        : 0,
      'self',
    ),
    additive(
      'critDmg', 'combat', engine,
      setup.engineId === 'heartstringNocturne'
        ? equipmentEffectBaseValue(W_ENGINE_FACTS.heartstringNocturne.effects.critDamage, refinement)
        : 0,
      'self',
    ),
    percentage(
      'atk', 'fully', engine,
      setup.engineId === 'starlightEngine'
        ? equipmentEffectBaseValue(W_ENGINE_FACTS.starlightEngine.effects.atk, refinement)
        : 0,
      'self',
    ),

    ...(shadowSelected
      ? [additive(
        'dmgBonus', 'initial', selectedTwoPieceSource(setup, 'shadowHarmony'),
        equipmentEffectBaseValue(DRIVE_DISC_FACTS.shadowHarmony.twoPiece.damage),
        'self', HARUMASA_DASH,
      )]
      : []),
    percentage(
      'atk', 'fully', discSource('harumasa', 'shadowHarmony', '4-piece'),
      setup.fourPieceId === 'shadowHarmony'
        ? equipmentEffectBaseValue(DRIVE_DISC_FACTS.shadowHarmony.fourPiece.atk)
        : 0,
      'self',
    ),
    additive(
      'critRate', 'fully', discSource('harumasa', 'shadowHarmony', '4-piece'),
      setup.fourPieceId === 'shadowHarmony'
        ? equipmentEffectBaseValue(DRIVE_DISC_FACTS.shadowHarmony.fourPiece.critRate)
        : 0,
      'self',
    ),
    percentage(
      'atk', 'fully', discSource('harumasa', 'thunderMetal', '4-piece'),
      setup.fourPieceId === 'thunderMetal'
        ? equipmentEffectBaseValue(DRIVE_DISC_FACTS.thunderMetal.fourPiece.atk)
        : 0,
      'self',
    ),
    percentage(
      'atk', 'fully', discSource('harumasa', 'woodpecker', '4-piece'),
      setup.fourPieceId === 'woodpecker'
        ? equipmentEffectBaseValue(DRIVE_DISC_FACTS.woodpecker.fourPiece.atk)
        : 0,
      'self',
    ),
    percentage(
      'atk', 'combat', discSource('harumasa', 'hormonePunk', '4-piece'),
      setup.fourPieceId === 'hormonePunk'
        ? equipmentEffectBaseValue(DRIVE_DISC_FACTS.hormonePunk.fourPiece.atk)
        : 0,
      'self',
    ),
  ])
}

function optionalMetric(
  metricId: EffectMetric,
  label: string,
  effects: ReturnType<typeof resolveDeliveredClauses>,
  actions: AgentResult['actionModifiers'] = [],
): AgentResult['metrics'] {
  const data = composeMetricEffects(surfaces(0, 0, 0), surfaces([], [], []), effects, metricId)
  return data.values.fully || actions.some(({ metricId: actionMetric }) => actionMetric === metricId)
    ? [{ id: metricId, label, unit: '%', decimals: 1, ...data }]
    : []
}

export function calculateHarumasa(
  context: HarumasaCalculationContext,
  inbox: SourceBoundCurrentClause[],
  enemy: SourceBoundCurrentClause[],
): AgentResult {
  const { setup, initialAtk } = context
  const values = VERTICAL_VALUES.harumasa
  const baseAtk = values.atk + W_ENGINES[setup.engineId].baseAtk
  const effects = resolveDeliveredClauses([...inbox, ...enemy], { atk: initialAtk })

  const atkInputs = presentSetupInputs([
    engineAdvancedInput(setup, 'harumasa', 'atkPct'),
    mainStatInput(setup, 'harumasa', 'slot4', 'atkPct'),
    mainStatInput(setup, 'harumasa', 'slot5', 'atkPct'),
    mainStatInput(setup, 'harumasa', 'slot6', 'atkPct'),
    ...selectedDiscTwoPieceInputs(setup, 'harumasa', { modifier: 'atk' }),
    effectiveSubstatInput(setup, 'harumasa', 'atkPct'),
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
    engineAdvancedInput(setup, 'harumasa', 'critRate'),
    mainStatInput(setup, 'harumasa', 'slot4', 'critRate'),
    ...selectedDiscTwoPieceInputs(setup, 'harumasa', { modifier: 'critRate' }),
    effectiveSubstatInput(setup, 'harumasa', 'critRate'),
  ])
  const initialCritRate = values.critRate
    + critRateInputs.reduce((sum, input) => sum + input.rawValue, 0)
  const critRate = composeMetricEffects(
    surfaces(initialCritRate, initialCritRate, initialCritRate),
    surfaces(critRateInputs.map((input) => contribution(input.source, input.rawValue)), [], []),
    effects,
    'critRate',
    { value: 100, source: source('Displayed CRIT Rate cap', 'harumasa', 'calculation') },
  )

  const critDmgInputs = presentSetupInputs([
    engineAdvancedInput(setup, 'harumasa', 'critDmg'),
    mainStatInput(setup, 'harumasa', 'slot4', 'critDmg'),
    ...selectedDiscTwoPieceInputs(setup, 'harumasa', { modifier: 'critDmg' }),
    effectiveSubstatInput(setup, 'harumasa', 'critDmg'),
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
    mainStatInput(setup, 'harumasa', 'slot5', 'electricDmg'),
    ...selectedDiscTwoPieceInputs(setup, 'harumasa', { modifier: 'dmgBonus' }),
  ])
  const initialDmg = dmgInputs.reduce((sum, input) => sum + input.rawValue, 0)
  const dmg = composeMetricEffects(
    surfaces(initialDmg, initialDmg, initialDmg),
    surfaces(dmgInputs.map((input) => contribution(input.source, input.rawValue)), [], []),
    effects,
    'dmgBonus',
  )

  const penInputs = presentSetupInputs([
    mainStatInput(setup, 'harumasa', 'slot5', 'penRatio'),
    ...selectedDiscTwoPieceInputs(setup, 'harumasa', { modifier: 'penRatio' }),
  ])
  const initialPen = penInputs.reduce((sum, input) => sum + input.rawValue, 0)
  const pen = composeMetricEffects(
    surfaces(initialPen, initialPen, initialPen),
    surfaces(penInputs.map((input) => contribution(input.source, input.rawValue)), [], []),
    effects,
    'penRatio',
  )

  const defIgnore = composeMetricEffects(surfaces(0, 0, 0), surfaces([], [], []), effects, 'defIgnore')
  const resIgnore = composeMetricEffects(surfaces(0, 0, 0), surfaces([], [], []), effects, 'resIgnore')
  const actionModifiers = [
    ...composeActionHierarchy(
      critRate.values,
      effects,
      'critRate',
      HARUMASA_CRIT_RATE_SCOPES,
      '',
      { value: 100, source: source('Displayed CRIT Rate cap', 'harumasa', 'calculation') },
    ),
    ...composeActionHierarchy(critDmg.values, effects, 'critDmg', HARUMASA_CRIT_DMG_SCOPES),
    ...composeActionHierarchy(dmg.values, effects, 'dmgBonus', HARUMASA_DAMAGE_SCOPES),
    ...composeActionHierarchy(defIgnore.values, effects, 'defIgnore', HARUMASA_DEF_SCOPES, 'DefIgnore'),
    ...composeActionHierarchy(resIgnore.values, effects, 'resIgnore', HARUMASA_RES_SCOPES, 'ResIgnore'),
  ]

  return {
    agentId: 'harumasa',
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
      ...optionalMetric('resIgnore', 'RES Ignore', effects, actionModifiers),
      ...optionalMetric('resReduction', 'RES Reduction', effects),
      ...optionalMetric('stunDmgMultiplier', 'Stun DMG Multiplier', effects),
    ],
    actionModifiers,
    operations: [],
  }
}
