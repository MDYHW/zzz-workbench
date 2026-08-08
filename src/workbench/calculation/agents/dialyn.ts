import {
  DRIVE_DISC_FACTS,
  VERTICAL_VALUES,
  W_ENGINE_FACTS,
  scaledEngineValue,
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
  perSecond,
  percentage,
  resolveDeliveredClauses,
  type CompleteSetup,
  type ResolvedSetupInput,
  type SourceBoundCurrentClause,
} from '../../effects'
import {
  composeMetricEffects,
  contribution,
  energyRegenProjection,
  percentageContribution,
  surfaces,
  withoutZero,
} from '../composition'
import type { AgentResult } from '../result'

export interface DialynInitialCritObservation {
  value: number
  uncappedValue: number
  inputs: ResolvedSetupInput[]
}

export interface DialynCalculationContext {
  agentId: 'dialyn'
  setup: CompleteSetup
  initialCrit: DialynInitialCritObservation
}

export function observeDialyn(
  setup: CompleteSetup,
): DialynCalculationContext {
  const dialyn = VERTICAL_VALUES.dialyn
  const engineCrit = engineAdvancedInput(setup, 'dialyn', 'critRate')
  const mainCrit = mainStatInput(setup, 'dialyn', 'slot4', 'critRate')
  const twoPieceCrit = discStatInput(
    setup,
    'dialyn',
    'twoPiece',
    'woodpecker',
    DRIVE_DISC_FACTS.woodpecker.critRate,
  )
  const substatCrit = effectiveSubstatInput(setup, 'dialyn', 'critRate')
  const inputs = [engineCrit, mainCrit, twoPieceCrit, substatCrit]
    .filter((input): input is ResolvedSetupInput => Boolean(input))
  const uncappedValue = dialyn.critRate
    + inputs.reduce((total, input) => total + input.rawValue, 0)

  return {
    agentId: 'dialyn',
    setup,
    initialCrit: {
      value: Math.min(uncappedValue, 100),
      uncappedValue,
      inputs,
    },
  }
}

export function resolveDialynProviderClauses(
  setup: CompleteSetup,
  initialCritRate: number,
): SourceBoundCurrentClause[] {
  const engine = engineSource('dialyn', setup)
  const fourPiece = discSource('dialyn', setup.fourPieceId, '4-piece')
  const refinement = setup.refinement
  const values = VERTICAL_VALUES
  const impact = Math.min(
    Math.max(initialCritRate - values.dialyn.critThreshold, 0)
      * values.dialyn.impactPerCrit,
    values.dialyn.impactBonusCap,
  )
  const kingCrit = setup.fourPieceId === 'king'
    ? DRIVE_DISC_FACTS.king.squadCritDmg.base
      + (initialCritRate >= values.dialyn.critThreshold
        ? DRIVE_DISC_FACTS.king.squadCritDmg.atCritThreshold
        : 0)
    : 0
  const laterImpact = setup.engineId === 'hellfireGears'
    ? scaledEngineValue(W_ENGINE_FACTS.hellfireGears.impact, refinement)
    : setup.engineId === 'steamOven'
      ? scaledEngineValue(W_ENGINE_FACTS.steamOven.impact, refinement)
      : 0
  const energy = setup.engineId === 'yesterdayCalls'
    ? scaledEngineValue(W_ENGINE_FACTS.yesterdayCalls.energyPerSecond, refinement)
    : setup.engineId === 'hellfireGears'
      ? scaledEngineValue(W_ENGINE_FACTS.hellfireGears.energyPerSecond, refinement)
      : 0

  return active([
    additive('impact', 'combat', STATIC_SOURCES.dialyn.core, impact, 'self'),
    percentage('impact', 'fully', engine, laterImpact, 'self'),
    additive('dazeBonus', 'fully', engine, setup.engineId === 'yesterdayCalls' ? scaledEngineValue(W_ENGINE_FACTS.yesterdayCalls.daze, refinement) : 0, 'self'),
    perSecond(engine, energy, 'self'),
    additive('dmgBonus', 'fully', STATIC_SOURCES.dialyn.additional, values.party.dialynDmg, 'all-party'),
    additive('critDmg', 'fully', engine, setup.engineId === 'yesterdayCalls' ? scaledEngineValue(W_ENGINE_FACTS.yesterdayCalls.squadCritDmg, refinement) : 0, 'all-party'),
    additive('critDmg', 'fully', fourPiece, kingCrit, 'all-party', undefined, undefined, undefined, 'kingOfTheSummit'),
    additive('dmgBonus', 'fully', mindscapeSource('dialyn', 2, 'against Malicious Complaint'), setup.mindscape >= 2 ? values.dialyn.mindscapeDmg : 0, 'focus'),
    additive('stunDmgMultiplier', 'fully', STATIC_SOURCES.dialyn.core, values.party.dialynStunMultiplier, 'enemy-context'),
    additive('stunDmgMultiplier', 'fully', mindscapeSource('dialyn', 2), setup.mindscape >= 2 ? values.dialyn.mindscapeStunMultiplier : 0, 'enemy-context'),
    additive('stunDuration', 'fully', STATIC_SOURCES.dialyn.core, values.party.dialynStunExtension, 'enemy-context'),
    additive('resIgnore', 'fully', mindscapeSource('dialyn', 1, 'Overwhelmingly Positive'), setup.mindscape >= 1 ? values.dialyn.mindscapeResIgnore : 0, 'enemy-context'),
  ])
}

export function calculateDialyn(
  setup: CompleteSetup,
  initialCrit: DialynInitialCritObservation,
  inbox: SourceBoundCurrentClause[],
  enemyContext: SourceBoundCurrentClause[],
): AgentResult {
  const dialyn = VERTICAL_VALUES.dialyn
  const impactFromCrit = Math.min(
    Math.max(initialCrit.value - dialyn.critThreshold, 0) * dialyn.impactPerCrit,
    dialyn.impactBonusCap,
  )
  const advancedImpact = engineAdvancedInput(setup, 'dialyn', 'impactPct')
  const slotImpact = mainStatInput(setup, 'dialyn', 'slot6', 'impact')
  const initialImpactInputs = [advancedImpact, slotImpact].filter(
    (input): input is ResolvedSetupInput => Boolean(input),
  )
  const initialImpact = dialyn.impact * (
    1 + initialImpactInputs.reduce((total, input) => total + input.rawValue, 0) / 100
  )
  const effects = resolveDeliveredClauses(inbox, { impact: initialImpact })

  const engineEnergyRegen = engineAdvancedInput(setup, 'dialyn', 'energyRegenPct')
  const slotEnergyRegen = mainStatInput(setup, 'dialyn', 'slot6', 'energyRegenPct')
  const discEnergyRegen = discStatInput(
    setup,
    'dialyn',
    'twoPiece',
    'swingJazz',
    DRIVE_DISC_FACTS.swingJazz.energyRegenPct,
  )
  const initialEnergyRegenInputs: ResolvedSetupInput[] = [
    ...(engineEnergyRegen ? [engineEnergyRegen] : []),
    ...(slotEnergyRegen ? [slotEnergyRegen] : []),
    ...(discEnergyRegen ? [discEnergyRegen] : []),
  ]
  const energyRegen = energyRegenProjection(
    dialyn.baseEnergyRegen,
    initialEnergyRegenInputs,
    effects,
  )

  const kingDaze = discStatInput(
    setup,
    'dialyn',
    'fourPiece',
    'king',
    DRIVE_DISC_FACTS.king.daze,
  )
  const critRate = composeMetricEffects(
    surfaces(initialCrit.value, initialCrit.value, initialCrit.value),
    surfaces(
      withoutZero([
        ...initialCrit.inputs.map((input) => contribution(input.source, input.rawValue)),
        contribution(
          STATIC_SOURCES.dialyn.critCap,
          initialCrit.value - initialCrit.uncappedValue,
        ),
      ]),
      [],
      [],
    ),
    effects,
    'critRate',
    { value: 100, source: STATIC_SOURCES.dialyn.critCap },
  )
  const impact = composeMetricEffects(
    surfaces(initialImpact, initialImpact, initialImpact),
    surfaces(
      withoutZero(initialImpactInputs.map((input) => percentageContribution(
        input.source,
        dialyn.impact * input.rawValue / 100,
        input.rawValue,
      ))),
      [],
      [],
    ),
    effects,
    'impact',
  )
  const dazeBonus = composeMetricEffects(
    surfaces(kingDaze?.rawValue ?? 0, kingDaze?.rawValue ?? 0, kingDaze?.rawValue ?? 0),
    surfaces(
      withoutZero(kingDaze ? [contribution(kingDaze.source, kingDaze.rawValue)] : []),
      [],
      [],
    ),
    effects,
    'dazeBonus',
  )
  const enemyEffects = resolveDeliveredClauses(enemyContext, {})
  const quickAssist = resolveDeliveredClauses(inbox, {}).find((effect) => (
    effect.action === 'triggerQuickAssist' && effect.metric === 'dazeBonus'
  ))
  const stunDuration = enemyEffects.find((effect) => (
    effect.metric === 'stunDuration' && effect.source.ownerAgentId === 'yixuan'
  )) ?? enemyEffects.find((effect) => effect.metric === 'stunDuration')!

  return {
    agentId: 'dialyn',
    metrics: [
      {
        id: 'critRate',
        label: 'CRIT Rate',
        unit: '%',
        decimals: 1,
        ...critRate,
        gauge: {
          source: STATIC_SOURCES.dialyn.core,
          basisLabel: 'Initial CRIT Rate',
          current: initialCrit.value,
          threshold: dialyn.critThreshold,
          cap: 100,
          outputLabel: 'Combat Impact bonus',
          outputValue: impactFromCrit,
          outputUnit: '',
        },
      },
      { id: 'impact', label: 'Impact', unit: '', decimals: 1, ...impact },
      {
        id: 'energyRegen',
        label: 'Energy Regen',
        unit: '',
        decimals: 2,
        values: energyRegen.values,
        breakdown: energyRegen.breakdown,
      },
      { id: 'dazeBonus', label: 'Daze Bonus', unit: '%', decimals: 1, ...dazeBonus },
    ],
    actionModifiers: [],
    operations: [
      {
        id: 'stunDuration',
        label: 'Enemy Stun duration',
        source: stunDuration.source,
        surface: 'fully',
        value: stunDuration.amount,
        unit: 's',
      },
      ...(quickAssist ? [{
        id: 'nextQuickAssistDaze',
        label: 'Next Quick Assist Daze',
        source: quickAssist.source,
        surface: 'fully' as const,
        value: quickAssist.amount,
        unit: '%',
      }] : []),
    ],
  }
}
