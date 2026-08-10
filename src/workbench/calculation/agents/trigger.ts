import { DRIVE_DISC_FACTS, VERTICAL_VALUES, W_ENGINE_FACTS, equipmentEffectBaseValue, equipmentEffectMaximumValue } from '../../content'
import { STATIC_SOURCES, active, additive, discSource, discStatInput, effectiveSubstatInput, engineAdvancedInput, engineSource, mainStatInput, mindscapeSource, percentage, resolveDeliveredClauses, withCandidatePressure, type CompleteSetup, type ResolvedSetupInput, type SourceBoundCurrentClause } from '../../effects'
import { composeActionEffects, composeMetricEffects, contribution, percentageContribution, surfaces } from '../composition'
import type { AgentResult, ResultMetric } from '../result'

export interface TriggerCalculationContext { agentId: 'trigger'; setup: CompleteSetup; hasAnby: boolean }
export const observeTrigger = (setup: CompleteSetup, hasAnby: boolean): TriggerCalculationContext => ({ agentId: 'trigger', setup, hasAnby })

export function resolveTriggerProviderClauses(setup: CompleteSetup): SourceBoundCurrentClause[] {
  const engine = engineSource('trigger', setup)
  const refinement = setup.refinement
  const kingCrit = setup.fourPieceId === 'king' && (
    VERTICAL_VALUES.trigger.critRate + (engineAdvancedInput(setup, 'trigger', 'critRate')?.rawValue ?? 0)
      + (mainStatInput(setup, 'trigger', 'slot4', 'critRate')?.rawValue ?? 0)
      + (discStatInput(setup, 'trigger', 'twoPiece', 'woodpecker', equipmentEffectBaseValue(DRIVE_DISC_FACTS.woodpecker.twoPiece.critRate))?.rawValue ?? 0)
      + (effectiveSubstatInput(setup, 'trigger', 'critRate')?.rawValue ?? 0)
  ) >= 50
    ? equipmentEffectMaximumValue(DRIVE_DISC_FACTS.king.fourPiece.critDamage)
    : setup.fourPieceId === 'king'
      ? equipmentEffectBaseValue(DRIVE_DISC_FACTS.king.fourPiece.critDamage)
      : 0
  return active([
    additive('dazeBonus', 'initial', discSource('trigger', 'king', '2-piece', setup.fourPieceId === 'king' ? '4-piece' : '2-piece'), setup.fourPieceId === 'king' || setup.twoPieceId === 'king' ? equipmentEffectBaseValue(DRIVE_DISC_FACTS.king.twoPiece.daze) : 0, 'self'),
    additive('stunDmgMultiplier', 'fully', STATIC_SOURCES.trigger.core, setup.mindscape >= 1 ? 55 : 35, 'enemy-context', undefined, undefined, ['yixuan', 'anbySoldier0', 'trigger']),
    additive('critDmg', 'fully', mindscapeSource('trigger', 2, '4 stacks'), setup.mindscape >= 2 ? 24 : 0, 'all-party', undefined, undefined, ['yixuan', 'anbySoldier0', 'trigger']),
    additive('critDmg', 'fully', discSource('trigger', 'king', '4-piece'), kingCrit, 'all-party', undefined, undefined, ['yixuan', 'anbySoldier0', 'trigger'], 'kingOfTheSummit'),
    additive('dmgBonus', 'fully', discSource('trigger', 'astralVoice', '4-piece'), setup.fourPieceId === 'astralVoice' ? equipmentEffectBaseValue(DRIVE_DISC_FACTS.astralVoice.fourPiece.damage) : 0, 'all-party', undefined, undefined, ['yixuan', 'anbySoldier0'], 'astralVoiceEntrant'),
    withCandidatePressure(
      additive('defReduction', 'fully', engine, setup.engineId === 'spectralGaze' ? equipmentEffectBaseValue(W_ENGINE_FACTS.spectralGaze.effects.defReduction, refinement) : 0, 'enemy-context', undefined, undefined, ['anbySoldier0']),
      'materialBroadPrePenDefBypass',
    ),
    additive('dmgBonus', 'fully', engine, setup.engineId === 'iceJadeTeapot' ? equipmentEffectBaseValue(W_ENGINE_FACTS.iceJadeTeapot.effects.damage, refinement) : 0, 'all-party', undefined, undefined, ['yixuan', 'anbySoldier0', 'trigger']),
    additive('dazeBonus', 'fully', engine, setup.engineId === 'restrained' ? equipmentEffectMaximumValue(W_ENGINE_FACTS.restrained.effects.daze, refinement) : 0, 'self', 'triggerBasic'),
    additive('dazeBonus', 'fully', engine, setup.engineId === 'preciousFossilizedCore' ? equipmentEffectMaximumValue(W_ENGINE_FACTS.preciousFossilizedCore.effects.daze, refinement) : 0, 'self'),
    additive('dazeBonus', 'fully', discStatInput(setup, 'trigger', 'fourPiece', 'shockstar', equipmentEffectBaseValue(DRIVE_DISC_FACTS.shockstar.fourPiece.daze))?.source ?? engine, setup.fourPieceId === 'shockstar' ? equipmentEffectBaseValue(DRIVE_DISC_FACTS.shockstar.fourPiece.daze) : 0, 'self', 'triggerBasic'),
    percentage('impact', 'fully', engine, setup.engineId === 'spectralGaze' ? equipmentEffectMaximumValue(W_ENGINE_FACTS.spectralGaze.effects.impact, refinement) : setup.engineId === 'iceJadeTeapot' ? equipmentEffectMaximumValue(W_ENGINE_FACTS.iceJadeTeapot.effects.impact, refinement) : setup.engineId === 'steamOven' ? equipmentEffectBaseValue(W_ENGINE_FACTS.steamOven.effects.impact, refinement) : 0, 'self'),
  ])
}

function presentInputs(inputs: Array<ResolvedSetupInput | undefined>): ResolvedSetupInput[] {
  return inputs.filter((input): input is ResolvedSetupInput => input !== undefined)
}

export function calculateTrigger(context: TriggerCalculationContext, inbox: SourceBoundCurrentClause[], enemy: SourceBoundCurrentClause[]): AgentResult {
  const { setup } = context
  const values = VERTICAL_VALUES.trigger
  const critInputs = presentInputs([engineAdvancedInput(setup, 'trigger', 'critRate'), mainStatInput(setup, 'trigger', 'slot4', 'critRate'), discStatInput(setup, 'trigger', 'twoPiece', 'woodpecker', equipmentEffectBaseValue(DRIVE_DISC_FACTS.woodpecker.twoPiece.critRate)), effectiveSubstatInput(setup, 'trigger', 'critRate')])
  const critBase = Math.min(values.critRate + critInputs.reduce((n, x) => n + x.rawValue, 0), 100)
  const impactInputs = presentInputs([
    engineAdvancedInput(setup, 'trigger', 'impactPct'),
    mainStatInput(setup, 'trigger', 'slot6', 'impact'),
    discStatInput(setup, 'trigger', 'twoPiece', 'shockstar', equipmentEffectBaseValue(DRIVE_DISC_FACTS.shockstar.twoPiece.impact)),
    discStatInput(setup, 'trigger', 'fourPiece', 'shockstar', equipmentEffectBaseValue(DRIVE_DISC_FACTS.shockstar.twoPiece.impact), 'twoPiece'),
  ])
  const impactBase = values.impact * (1 + impactInputs.reduce((n, x) => n + x.rawValue, 0) / 100)
  const effects = resolveDeliveredClauses([...inbox, ...enemy], { impact: impactBase })
  const crit = composeMetricEffects(surfaces(critBase, critBase, critBase), surfaces(critInputs.map((x) => contribution(x.source, x.rawValue)), [], []), effects, 'critRate', { value: 100, source: STATIC_SOURCES.trigger.critCap })
  const critDmg = composeMetricEffects(surfaces(values.critDmg, values.critDmg, values.critDmg), surfaces([], [], []), effects, 'critDmg')
  const impact = composeMetricEffects(surfaces(impactBase, impactBase, impactBase), surfaces(impactInputs.map((x) => percentageContribution(x.source, values.impact * x.rawValue / 100, x.rawValue)), [], []), effects, 'impact')
  const daze = composeMetricEffects(surfaces(0, 0, 0), surfaces([], [], []), effects, 'dazeBonus')
  const dazeGauge = context.hasAnby ? Math.min(Math.max(crit.values.fully - 40, 0) * 1.5, 75) : 0
  const quickAssist = effects.find((effect) => effect.action === 'triggerQuickAssist' && effect.metric === 'dazeBonus')
  const critMetric: ResultMetric = { id: 'critRate', label: 'CRIT Rate', unit: '%', decimals: 1, ...crit }
  if (context.hasAnby) critMetric.gauge = { source: STATIC_SOURCES.trigger.additional, basisLabel: 'Fully Enabled CRIT Rate', current: crit.values.fully, threshold: 40, cap: 90, outputLabel: 'Aftershock Daze bonus', outputValue: dazeGauge, outputCap: 75, outputUnit: '%' }
  const dazeMetric: ResultMetric = { id: 'dazeBonus', label: 'Daze Bonus', unit: '%', decimals: 1, ...daze }
  const aftershockDmg = composeActionEffects(surfaces(0, 0, 0), effects, 'dmgBonus', 'anbyAftershock')
  const aftershockCrit = composeActionEffects(critDmg.values, effects, 'critDmg', 'anbyAftershock')
  const actionEffects = [...effects, ...resolveDeliveredClauses([
    additive('dazeBonus', 'fully', STATIC_SOURCES.trigger.additional, dazeGauge, 'self', 'triggerBasic'),
  ], {})]
  const basicDaze = composeActionEffects(daze.values, actionEffects, 'dazeBonus', 'triggerBasic')
  const actionModifiers = [
    ...(aftershockDmg.breakdown.fully.length ? [{ id: 'triggerAftershock', actions: [], tag: 'aftershock' as const, metricId: 'dmgBonus', ...aftershockDmg }] : []),
    ...(aftershockCrit.breakdown.fully.length ? [{ id: 'triggerAftershockCritDmg', actions: [], tag: 'aftershock' as const, metricId: 'critDmg', ...aftershockCrit }] : []),
    ...(basicDaze.breakdown.fully.length ? [{ id: 'triggerBasic', actions: [], tag: 'aftershock' as const, metricId: 'dazeBonus', ...basicDaze }] : []),
  ]
  const stunDmgMultiplier = composeMetricEffects(surfaces(0, 0, 0), surfaces([], [], []), effects, 'stunDmgMultiplier')
  return { agentId: 'trigger', metrics: [critMetric, { id: 'impact', label: 'Impact', unit: '', decimals: 1, ...impact }, dazeMetric, { id: 'stunDmgMultiplier', label: 'Stun DMG Multiplier', unit: '%', decimals: 1, ...stunDmgMultiplier }, ...(aftershockCrit.breakdown.fully.length ? [{ id: 'critDmg', label: 'CRIT DMG', unit: '%', decimals: 1, ...critDmg }] : []), ...(aftershockDmg.breakdown.fully.length ? [{ id: 'dmgBonus', label: 'DMG Bonus', unit: '%', decimals: 1, ...composeMetricEffects(surfaces(0, 0, 0), surfaces([], [], []), [], 'dmgBonus') }] : [])], actionModifiers, operations: quickAssist ? [{ id: 'nextQuickAssistDaze', label: 'Next Quick Assist Daze', source: quickAssist.source, surface: 'fully', value: quickAssist.amount, unit: '%' }] : [] }
}
