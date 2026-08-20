import { DRIVE_DISC_FACTS, VERTICAL_VALUES, W_ENGINE_FACTS, equipmentEffectBaseValue, equipmentEffectMaximumValue } from '../../content'
import { STATIC_SOURCES, active, additive, discSource, selectedDiscTwoPieceInputs, effectiveSubstatInput, engineAdvancedInput, engineSource, mainStatInput, mindscapeSource, percentage, presentSetupInputs, resolveDeliveredClauses, withApplicability, withCandidatePressure, type CompleteSetup, type SourceBoundCurrentClause } from '../../effects'
import { actionTarget, canonicalAction, sourceLocalAction } from '../../actions'
import { composeActionEffects, composeMetricEffects, contribution, percentageContribution, surfaces } from '../composition'
import type { AgentResult, ResultMetric } from '../result'
import { ANBY_AFTERSHOCK_TARGET } from './anby-soldier-0'

export interface TriggerCalculationContext { agentId: 'trigger'; setup: CompleteSetup; additionalActive: boolean }
export const observeTrigger = (setup: CompleteSetup, additionalActive: boolean): TriggerCalculationContext => ({ agentId: 'trigger', setup, additionalActive })

const TRIGGER_BASIC_AFTERSHOCK_TARGET = actionTarget(
  [canonicalAction('Basic Attack')],
  ['aftershock'],
)

export const TRIGGER_QUICK_ASSIST_TARGET = actionTarget(
  [sourceLocalAction('Quick Assist', 'Assist')],
)

export function resolveTriggerProviderClauses(setup: CompleteSetup): SourceBoundCurrentClause[] {
  const engine = engineSource('trigger', setup)
  const refinement = setup.refinement
  const kingCrit = setup.fourPieceId === 'king' && (
    VERTICAL_VALUES.trigger.critRate + (engineAdvancedInput(setup, 'trigger', 'critRate')?.rawValue ?? 0)
      + (mainStatInput(setup, 'trigger', 'slot4', 'critRate')?.rawValue ?? 0)
      + selectedDiscTwoPieceInputs(setup, 'trigger', { modifier: 'critRate' })
        .reduce((total, input) => total + input.rawValue, 0)
      + (effectiveSubstatInput(setup, 'trigger', 'critRate')?.rawValue ?? 0)
  ) >= 50
    ? equipmentEffectMaximumValue(DRIVE_DISC_FACTS.king.fourPiece.critDamage)
    : setup.fourPieceId === 'king'
      ? equipmentEffectBaseValue(DRIVE_DISC_FACTS.king.fourPiece.critDamage)
      : 0
  return active([
    withApplicability(
      additive(
        'stunDmgMultiplier', 'fully', STATIC_SOURCES.trigger.core,
        setup.mindscape >= 1 ? 55 : 35, 'enemy-context',
      ),
      { formulas: ['general_damage', 'sheer_damage'] },
    ),
    withApplicability(
      additive(
        'critDmg', 'fully', mindscapeSource('trigger', 2, '4 stacks'),
        setup.mindscape >= 2 ? 24 : 0, 'all-party',
      ),
      { formulas: ['general_damage', 'sheer_damage'] },
    ),
    withApplicability(
      additive('critDmg', 'fully', discSource('trigger', 'king', '4-piece'), kingCrit, 'all-party', undefined, undefined, undefined, 'kingOfTheSummit'),
      { formulas: ['general_damage', 'sheer_damage'] },
    ),
    withCandidatePressure(
      withApplicability(
        additive('defReduction', 'fully', engine, setup.engineId === 'spectralGaze' ? equipmentEffectBaseValue(W_ENGINE_FACTS.spectralGaze.effects.defReduction, refinement) : 0, 'enemy-context'),
        { formulas: ['general_damage'] },
      ),
      'materialBroadPrePenDefBypass',
    ),
    withApplicability(
      additive(
        'dmgBonus', 'fully', engine,
        setup.engineId === 'iceJadeTeapot'
          ? equipmentEffectBaseValue(W_ENGINE_FACTS.iceJadeTeapot.effects.damage, refinement)
          : 0,
        'all-party', undefined, undefined, undefined, 'iceJadeTeapot',
      ),
      { formulas: ['general_damage', 'sheer_damage'] },
    ),
    withApplicability(
      additive('critDmg', 'fully', engine, setup.engineId === 'blazingLaurel' ? equipmentEffectMaximumValue(W_ENGINE_FACTS.blazingLaurel.effects.critDamage, refinement) : 0, 'all-party'),
      { formulas: ['general_damage', 'sheer_damage'], attributes: ['Fire', 'Ice'] },
    ),
    additive('dazeBonus', 'fully', engine, setup.engineId === 'restrained' ? equipmentEffectMaximumValue(W_ENGINE_FACTS.restrained.effects.daze, refinement) : 0, 'self', TRIGGER_BASIC_AFTERSHOCK_TARGET),
    additive('dazeBonus', 'fully', engine, setup.engineId === 'preciousFossilizedCore' ? equipmentEffectMaximumValue(W_ENGINE_FACTS.preciousFossilizedCore.effects.daze, refinement) : 0, 'self'),
    additive('dazeBonus', 'fully', discSource('trigger', 'shockstar', '4-piece'), setup.fourPieceId === 'shockstar' ? equipmentEffectBaseValue(DRIVE_DISC_FACTS.shockstar.fourPiece.daze) : 0, 'self', TRIGGER_BASIC_AFTERSHOCK_TARGET),
    percentage('impact', 'fully', engine, setup.engineId === 'spectralGaze' ? equipmentEffectMaximumValue(W_ENGINE_FACTS.spectralGaze.effects.impact, refinement) : setup.engineId === 'blazingLaurel' ? equipmentEffectBaseValue(W_ENGINE_FACTS.blazingLaurel.effects.impact, refinement) : setup.engineId === 'iceJadeTeapot' ? equipmentEffectMaximumValue(W_ENGINE_FACTS.iceJadeTeapot.effects.impact, refinement) : setup.engineId === 'hellfireGears' ? equipmentEffectMaximumValue(W_ENGINE_FACTS.hellfireGears.effects.impact, refinement) : setup.engineId === 'steamOven' ? equipmentEffectBaseValue(W_ENGINE_FACTS.steamOven.effects.impact, refinement) : 0, 'self'),
  ])
}

export function calculateTrigger(context: TriggerCalculationContext, inbox: SourceBoundCurrentClause[], enemy: SourceBoundCurrentClause[]): AgentResult {
  const { setup } = context
  const values = VERTICAL_VALUES.trigger
  const critInputs = presentSetupInputs([engineAdvancedInput(setup, 'trigger', 'critRate'), mainStatInput(setup, 'trigger', 'slot4', 'critRate'), ...selectedDiscTwoPieceInputs(setup, 'trigger', { modifier: 'critRate' }), effectiveSubstatInput(setup, 'trigger', 'critRate')])
  const critBase = Math.min(values.critRate + critInputs.reduce((n, x) => n + x.rawValue, 0), 100)
  const impactInputs = presentSetupInputs([
    engineAdvancedInput(setup, 'trigger', 'impactPct'),
    mainStatInput(setup, 'trigger', 'slot6', 'impact'),
    ...selectedDiscTwoPieceInputs(setup, 'trigger', { modifier: 'impact' }),
  ])
  const impactBase = values.impact * (1 + impactInputs.reduce((n, x) => n + x.rawValue, 0) / 100)
  const effects = resolveDeliveredClauses([...inbox, ...enemy], { impact: impactBase })
  const crit = composeMetricEffects(surfaces(critBase, critBase, critBase), surfaces(critInputs.map((x) => contribution(x.source, x.rawValue)), [], []), effects, 'critRate', { value: 100, source: STATIC_SOURCES.trigger.critCap })
  const critDmg = composeMetricEffects(surfaces(values.critDmg, values.critDmg, values.critDmg), surfaces([], [], []), effects, 'critDmg')
  const impact = composeMetricEffects(surfaces(impactBase, impactBase, impactBase), surfaces(impactInputs.map((x) => percentageContribution(x.source, values.impact * x.rawValue / 100, x.rawValue)), [], []), effects, 'impact')
  const dazeInputs = selectedDiscTwoPieceInputs(setup, 'trigger', { modifier: 'dazeBonus' })
  const initialDaze = dazeInputs.reduce((total, input) => total + input.rawValue, 0)
  const daze = composeMetricEffects(surfaces(initialDaze, initialDaze, initialDaze), surfaces(dazeInputs.map((input) => contribution(input.source, input.rawValue)), [], []), effects, 'dazeBonus')
  const dazeGauge = context.additionalActive ? Math.min(Math.max(crit.values.fully - 40, 0) * 1.5, 75) : 0
  const quickAssist = effects.find((effect) => effect.action === TRIGGER_QUICK_ASSIST_TARGET && effect.metric === 'dazeBonus')
  const critMetric: ResultMetric = { id: 'critRate', label: 'CRIT Rate', unit: '%', decimals: 1, ...crit }
  if (context.additionalActive) critMetric.gauge = { source: STATIC_SOURCES.trigger.additional, basisLabel: 'Fully Enabled CRIT Rate', current: crit.values.fully, threshold: 40, cap: 90, outputLabel: 'Aftershock Daze bonus', outputValue: dazeGauge, outputCap: 75, outputUnit: '%' }
  const dazeMetric: ResultMetric = { id: 'dazeBonus', label: 'Daze Bonus', unit: '%', decimals: 1, ...daze }
  const aftershockDmg = composeActionEffects(surfaces(0, 0, 0), effects, 'dmgBonus', ANBY_AFTERSHOCK_TARGET)
  const aftershockCrit = composeActionEffects(critDmg.values, effects, 'critDmg', ANBY_AFTERSHOCK_TARGET)
  const aftershockDefIgnore = composeActionEffects(surfaces(0, 0, 0), effects, 'defIgnore', ANBY_AFTERSHOCK_TARGET)
  const actionEffects = [...effects, ...resolveDeliveredClauses([
    additive('dazeBonus', 'fully', STATIC_SOURCES.trigger.additional, dazeGauge, 'self', TRIGGER_BASIC_AFTERSHOCK_TARGET),
  ], {})]
  const basicDaze = composeActionEffects(daze.values, actionEffects, 'dazeBonus', TRIGGER_BASIC_AFTERSHOCK_TARGET)
  const actionModifiers: AgentResult['actionModifiers'] = [
    ...(aftershockDmg.breakdown.fully.length ? [{ id: 'triggerAftershock', outcomes: [...ANBY_AFTERSHOCK_TARGET.outcomes], tags: [...ANBY_AFTERSHOCK_TARGET.tags], metricId: 'dmgBonus' as const, ...aftershockDmg }] : []),
    ...(aftershockCrit.breakdown.fully.length ? [{ id: 'triggerAftershockCritDmg', outcomes: [...ANBY_AFTERSHOCK_TARGET.outcomes], tags: [...ANBY_AFTERSHOCK_TARGET.tags], metricId: 'critDmg' as const, ...aftershockCrit }] : []),
    ...(aftershockDefIgnore.breakdown.fully.length ? [{ id: 'triggerAftershockDefIgnore', outcomes: [...ANBY_AFTERSHOCK_TARGET.outcomes], tags: [...ANBY_AFTERSHOCK_TARGET.tags], metricId: 'defIgnore' as const, ...aftershockDefIgnore }] : []),
    ...(basicDaze.breakdown.fully.length ? [{ id: 'triggerBasic', outcomes: [...TRIGGER_BASIC_AFTERSHOCK_TARGET.outcomes], tags: [...TRIGGER_BASIC_AFTERSHOCK_TARGET.tags], metricId: 'dazeBonus' as const, ...basicDaze }] : []),
  ]
  const stunDmgMultiplier = composeMetricEffects(surfaces(0, 0, 0), surfaces([], [], []), effects, 'stunDmgMultiplier')
  const metrics: AgentResult['metrics'] = [
    critMetric,
    { id: 'impact', label: 'Impact', unit: '', decimals: 1, ...impact },
    dazeMetric,
    { id: 'stunDmgMultiplier', label: 'Stun DMG Multiplier', unit: '%', decimals: 1, ...stunDmgMultiplier },
    ...(aftershockCrit.breakdown.fully.length ? [{ id: 'critDmg' as const, label: 'CRIT DMG', unit: '%', decimals: 1, ...critDmg }] : []),
    ...(aftershockDmg.breakdown.fully.length ? [{ id: 'dmgBonus' as const, label: 'DMG Bonus', unit: '%', decimals: 1, ...composeMetricEffects(surfaces(0, 0, 0), surfaces([], [], []), [], 'dmgBonus') }] : []),
    ...(aftershockDefIgnore.breakdown.fully.length ? [{ id: 'defIgnore' as const, label: 'DEF Ignore', unit: '%', decimals: 1, ...composeMetricEffects(surfaces(0, 0, 0), surfaces([], [], []), [], 'defIgnore') }] : []),
  ]
  return { agentId: 'trigger', metrics, actionModifiers, operations: quickAssist ? [{ id: 'nextQuickAssistDaze', label: 'Next Quick Assist Daze', source: quickAssist.source, surface: 'fully', value: quickAssist.amount, unit: '%' }] : [] }
}
