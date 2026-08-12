import {
  DRIVE_DISC_FACTS,
  SOURCE_LABELS,
  VERTICAL_VALUES,
  W_ENGINE_FACTS,
  equipmentEffectBaseValue,
  type MainSlot,
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
  presentSetupInputs,
  resolveDeliveredClauses,
  source,
  type CompleteSetup,
  type ResolvedSetupInput,
  type ResultSource,
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
import type { AgentResult, Contribution } from '../result'

export interface LuciaInitialHpObservation {
  value: number
  breakdown: Contribution[]
}

export interface LuciaSquadSheerObservation {
  value: number
  cap: number
  source: ResultSource
}

export interface LuciaCalculationContext {
  agentId: 'lucia'
  setup: CompleteSetup
  initialHp: LuciaInitialHpObservation
  squadSheer: LuciaSquadSheerObservation
  additionalActive: boolean
}

function calculateLuciaInitialHp(
  setup: CompleteSetup,
): LuciaInitialHpObservation {
  const values = VERTICAL_VALUES
  const lucia = values.lucia
  const engineHp = engineAdvancedInput(setup, 'lucia', 'hpPct')
  const discHp = discStatInput(
    setup,
    'lucia',
    'fourPiece',
    'yunkui',
    equipmentEffectBaseValue(DRIVE_DISC_FACTS.yunkui.twoPiece.maxHp),
  ) ?? discStatInput(
    setup,
    'lucia',
    'twoPiece',
    'yunkui',
    equipmentEffectBaseValue(DRIVE_DISC_FACTS.yunkui.twoPiece.maxHp),
  )
  const mainHpInputs = presentSetupInputs(
    (['slot4', 'slot5', 'slot6'] as MainSlot[])
      .map((slot) => mainStatInput(setup, 'lucia', slot, 'hpPct')),
  )
  const hpSubstat = effectiveSubstatInput(setup, 'lucia', 'hpPct')
  const hpFlat = effectiveSubstatInput(setup, 'lucia', 'hpFlat')
  const totalHpPct = (engineHp?.rawValue ?? 0)
    + (discHp?.rawValue ?? 0)
    + mainHpInputs.reduce((total, input) => total + input.rawValue, 0)
    + (hpSubstat?.rawValue ?? 0)
  const value = lucia.hp * (1 + totalHpPct / 100)
    + values.fixedDisc.hp
    + (hpFlat?.rawValue ?? 0)

  return {
    value,
    breakdown: withoutZero([
      ...(engineHp ? [percentageContribution(
        engineHp.source,
        lucia.hp * engineHp.rawValue / 100,
        engineHp.rawValue,
      )] : []),
      ...(discHp ? [percentageContribution(
        discHp.source,
        lucia.hp * discHp.rawValue / 100,
        discHp.rawValue,
      )] : []),
      ...mainHpInputs.map((input) => percentageContribution(
        input.source,
        lucia.hp * input.rawValue / 100,
        input.rawValue,
      )),
      ...(hpSubstat ? [percentageContribution(
        hpSubstat.source,
        lucia.hp * hpSubstat.rawValue / 100,
        hpSubstat.rawValue,
      )] : []),
      ...(hpFlat ? [contribution(hpFlat.source, hpFlat.rawValue)] : []),
    ]),
  }
}

function luciaDarkbreakerTier(setup: CompleteSetup) {
  const { darkbreakerBase, darkbreakerPer200Hp, darkbreakerCap } = VERTICAL_VALUES.lucia
  if (setup.mindscape >= 5) {
    return {
      base: darkbreakerBase,
      per200Hp: darkbreakerPer200Hp.m5,
      cap: darkbreakerCap.m5,
      source: source(SOURCE_LABELS.luciaSheer, 'lucia', 'mindscape', 'M5 tier'),
    }
  }
  if (setup.mindscape >= 3) {
    return {
      base: darkbreakerBase,
      per200Hp: darkbreakerPer200Hp.m3,
      cap: darkbreakerCap.m3,
      source: source(SOURCE_LABELS.luciaSheer, 'lucia', 'mindscape', 'M3 tier'),
    }
  }
  return {
    base: darkbreakerBase,
    per200Hp: darkbreakerPer200Hp.base,
    cap: darkbreakerCap.base,
    source: STATIC_SOURCES.lucia.exSpecial,
  }
}

function calculateLuciaSquadSheer(
  initialHp: number,
  setup: CompleteSetup,
): LuciaSquadSheerObservation {
  const tier = luciaDarkbreakerTier(setup)
  return {
    value: Math.min(tier.base + (initialHp / 200) * tier.per200Hp, tier.cap),
    cap: tier.cap,
    source: tier.source,
  }
}

export function observeLucia(
  setup: CompleteSetup,
  additionalActive: boolean,
): LuciaCalculationContext {
  const initialHp = calculateLuciaInitialHp(setup)
  return {
    agentId: 'lucia',
    setup,
    initialHp,
    squadSheer: calculateLuciaSquadSheer(initialHp.value, setup),
    additionalActive,
  }
}

export function resolveLuciaProviderClauses(
  context: LuciaCalculationContext,
): SourceBoundCurrentClause[] {
  const { setup, squadSheer } = context
  const engine = engineSource('lucia', setup)
  const fourPiece = discSource('lucia', setup.fourPieceId, '4-piece')
  const refinement = setup.refinement
  const values = VERTICAL_VALUES
  const engineHp = setup.engineId === 'dreamlitHearth'
    ? equipmentEffectBaseValue(W_ENGINE_FACTS.dreamlitHearth.effects.maxHp, refinement)
    : 0
  const engineEnergy = setup.engineId === 'dreamlitHearth'
    ? equipmentEffectBaseValue(W_ENGINE_FACTS.dreamlitHearth.effects.energy, refinement)
    : setup.engineId === 'thoughtbop'
      ? equipmentEffectBaseValue(W_ENGINE_FACTS.thoughtbop.effects.energy, refinement)
      : setup.engineId === 'weepingCradle'
        ? equipmentEffectBaseValue(W_ENGINE_FACTS.weepingCradle.effects.energy, refinement)
        : 0
  const engineAtk = setup.engineId === 'kaboom'
    ? equipmentEffectBaseValue(W_ENGINE_FACTS.kaboom.effects.atk, refinement)
    : 0
  const critRate = setup.engineId === 'unfetteredGameBall'
    ? equipmentEffectBaseValue(W_ENGINE_FACTS.unfetteredGameBall.effects.critRate, refinement)
    : 0
  const engineDmg = setup.engineId === 'dreamlitHearth'
    ? equipmentEffectBaseValue(W_ENGINE_FACTS.dreamlitHearth.effects.damage, refinement)
    : setup.engineId === 'weepingCradle'
      ? equipmentEffectBaseValue(W_ENGINE_FACTS.weepingCradle.effects.damage, refinement)
      : 0

  return active([
    percentage('maxHp', 'fully', STATIC_SOURCES.lucia.core, values.party.wellspringHp,
      'all-party', undefined, undefined, 'etherVeilWellspring'),
    percentage('maxHp', 'fully', engine, engineHp, 'all-party'),
    percentage('atk', 'fully', engine, engineAtk, 'all-party'),
    additive('critRate', 'fully', engine, critRate, 'all-party'),
    additive('critDmg', 'fully', STATIC_SOURCES.lucia.additional,
      context.additionalActive ? values.party.luciaCritDmg : 0, 'all-party'),
    additive('dmgBonus', 'fully', STATIC_SOURCES.lucia.core, values.party.luciaCoreDmg, 'all-party'),
    additive('dmgBonus', 'fully', fourPiece, setup.fourPieceId === 'moonlight' ? equipmentEffectBaseValue(DRIVE_DISC_FACTS.moonlight.fourPiece.damage) : 0, 'all-party', undefined, undefined, undefined, 'moonlightLullaby'),
    additive('dmgBonus', 'fully', engine, engineDmg, 'all-party'),
    additive('sheerForce', 'fully', squadSheer.source, squadSheer.value, 'all-party'),
    additive('sheerDmgBonus', 'fully', mindscapeSource('lucia', 2, 'Darkbreaker + Wellspring'), setup.mindscape >= 2 ? values.lucia.mindscapeSheerDmg : 0, 'all-party'),
    additive('resIgnore', 'fully', mindscapeSource('lucia', 1, "Dreamer's Nursery Rhyme"), setup.mindscape >= 1 ? values.lucia.mindscapeResIgnore : 0, 'enemy-context'),
    perSecond(engine, engineEnergy, 'self'),
  ])
}

export function calculateLucia(
  setup: CompleteSetup,
  initialHp: LuciaInitialHpObservation,
  squadSheer: LuciaSquadSheerObservation,
  inbox: SourceBoundCurrentClause[],
): AgentResult {
  const lucia = VERTICAL_VALUES.lucia
  const effects = resolveDeliveredClauses(inbox, { maxHp: initialHp.value })
  const maxHp = composeMetricEffects(
    surfaces(initialHp.value, initialHp.value, initialHp.value),
    surfaces(initialHp.breakdown, [], []),
    effects,
    'maxHp',
  )

  const engineEnergyRegen = engineAdvancedInput(setup, 'lucia', 'energyRegenPct')
  const slotEnergyRegen = mainStatInput(setup, 'lucia', 'slot6', 'energyRegenPct')
  const discEnergyRegen = presentSetupInputs([
    discStatInput(
      setup,
      'lucia',
      'fourPiece',
      'moonlight',
      equipmentEffectBaseValue(DRIVE_DISC_FACTS.moonlight.twoPiece.energyRegen),
      'twoPiece',
    ),
    discStatInput(
      setup,
      'lucia',
      'twoPiece',
      'swingJazz',
      equipmentEffectBaseValue(DRIVE_DISC_FACTS.swingJazz.twoPiece.energyRegen),
    ),
  ])
  const initialEnergyRegenInputs: ResolvedSetupInput[] = [
    ...(engineEnergyRegen ? [engineEnergyRegen] : []),
    ...discEnergyRegen,
    ...(slotEnergyRegen ? [slotEnergyRegen] : []),
  ]
  const energyRegen = energyRegenProjection(
    lucia.baseEnergyRegen,
    initialEnergyRegenInputs,
    effects,
  )

  return {
    agentId: 'lucia',
    metrics: [
      {
        id: 'maxHp',
        label: 'Max HP',
        unit: '',
        decimals: 0,
        ...maxHp,
        gauge: {
          source: squadSheer.source,
          basisLabel: 'Initial Max HP',
          current: initialHp.value,
          cap: lucia.darkbreakerHpCap,
          outputLabel: 'Squad Sheer Force',
          outputValue: squadSheer.value,
          outputCap: squadSheer.cap,
          outputUnit: '',
        },
      },
      {
        id: 'energyRegen',
        label: 'Energy Regen',
        unit: '',
        decimals: 2,
        values: energyRegen.values,
        breakdown: energyRegen.breakdown,
      },
    ],
    actionModifiers: [],
    operations: [],
  }
}
