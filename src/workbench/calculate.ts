import {
  DRIVE_DISC_FACTS,
  SOURCE_LABELS,
  VERTICAL_VALUES,
  W_ENGINES,
  type AgentId,
  type MainSlot,
} from './content'
import {
  isCompleteWorkbench,
  type WorkbenchState,
} from './state'
import type {
  CompleteSetup,
  EffectMetric,
  ResolvedCurrentEffect,
  ResolvedSetupInput,
  ResultSource,
  SourceBoundCurrentClause,
  SurfaceKey,
  YixuanActionEffect,
} from './effects'
import {
  STATIC_SOURCES,
  completeSetup,
  discStatInput,
  effectiveSubstatInput,
  engineAdvancedInput,
  mainStatInput,
  resolveDialynEffects,
  resolveDialynStunDuration,
  resolveLuciaEffects,
  resolveLuciaProviderClauses,
  resolveYixuanEffects,
  source,
} from './effects'

export type { ResultSource, SourceLocus, SurfaceKey } from './effects'

export interface Contribution extends ResultSource {
  amount: number
  notation?: 'surface-value'
  display?: {
    value: number
    unit: string
    decimals: number
  }
}

export interface GaugeResult {
  source: ResultSource
  basisLabel: string
  current: number
  threshold?: number
  cap: number
  outputLabel: string
  outputValue: number
  outputCap?: number
  outputUnit: string
}

export interface ResultMetric {
  id: string
  label: string
  unit: string
  decimals: number
  values: Record<SurfaceKey, number>
  breakdown: Record<SurfaceKey, Contribution[]>
  gauge?: GaugeResult
}

export interface ActionModifier {
  id: string
  actions: string[]
  metricId: string
  baseActionId?: string
  values: Record<SurfaceKey, number>
  breakdown: Record<SurfaceKey, Contribution[]>
}

export interface ResultOperation {
  id: string
  label: string
  source: ResultSource
  surface: 'fully'
  value: number
  unit: string
}

export interface AgentResult {
  agentId: AgentId
  metrics: ResultMetric[]
  actionModifiers: ActionModifier[]
  operations: ResultOperation[]
}

export interface PartyResult {
  agents: AgentResult[]
}

const surfaces = <T>(initial: T, combat: T, fully: T): Record<SurfaceKey, T> => ({
  initial,
  combat,
  fully,
})

const contribution = (
  resultSource: ResultSource,
  amount: number,
  display?: Contribution['display'],
): Contribution => ({ ...resultSource, amount, display })

const surfaceValueContribution = (
  resultSource: ResultSource,
  amount: number,
): Contribution => ({ ...resultSource, amount, notation: 'surface-value' })

const percentageContribution = (
  resultSource: ResultSource,
  amount: number,
  percentage: number,
): Contribution => contribution(resultSource, amount, {
  value: percentage,
  unit: '%',
  decimals: Number.isInteger(percentage) ? 0 : 1,
})

function energyRegenProjection(
  baseEnergyRegen: number,
  initialPercentages: ResolvedSetupInput[],
  effects: ResolvedCurrentEffect[],
): Pick<ResultMetric, 'values' | 'breakdown'> {
  const perSecondOperations = effects.filter(
    ({ metric, action }) => metric === 'energyRegen' && !action,
  )
  const initial = baseEnergyRegen * (
    1 + initialPercentages.reduce((total, input) => total + input.rawValue, 0) / 100
  )
  const later = initial + perSecondOperations.reduce(
    (total, operation) => total + operation.amount,
    0,
  )

  return {
    values: surfaces(initial, later, later),
    breakdown: surfaces(
      withoutZero(initialPercentages.map((input) => percentageContribution(
        input.source,
        baseEnergyRegen * input.rawValue / 100,
        input.rawValue,
      ))),
      withoutZero(perSecondOperations.map(effectContribution)),
      [],
    ),
  }
}

const withoutZero = (items: Contribution[]): Contribution[] =>
  items.filter((item) => Math.abs(item.amount) > 0.000_001)

const sumContributions = (items: Contribution[]): number =>
  items.reduce((total, item) => total + item.amount, 0)

const effectContribution = (effect: ResolvedCurrentEffect): Contribution =>
  contribution(effect.source, effect.amount, effect.display)

const surfaceOrder: SurfaceKey[] = ['initial', 'combat', 'fully']

function effectsForMetric(
  effects: ResolvedCurrentEffect[],
  metric: EffectMetric,
  action?: YixuanActionEffect,
): ResolvedCurrentEffect[] {
  return effects.filter((effect) => (
    effect.metric === metric && effect.action === action
  ))
}

function composeMetricEffects(
  baseValues: Record<SurfaceKey, number>,
  baseBreakdown: Record<SurfaceKey, Contribution[]>,
  effects: ResolvedCurrentEffect[],
  metric: EffectMetric,
  cap?: { value: number; source: ResultSource },
): Pick<ResultMetric, 'values' | 'breakdown'> {
  const metricEffects = effectsForMetric(effects, metric)
  const breakdown = surfaces(
    [...baseBreakdown.initial],
    [...baseBreakdown.combat],
    [...baseBreakdown.fully],
  )
  const values = surfaces(0, 0, 0)

  if (!cap) {
    for (const [surfaceIndex, surface] of surfaceOrder.entries()) {
      const cumulativeEffects = metricEffects.filter((effect) => (
        surfaceOrder.indexOf(effect.earliestSurface) <= surfaceIndex
      ))
      values[surface] = baseValues[surface]
        + cumulativeEffects.reduce((total, effect) => total + effect.amount, 0)
      breakdown[surface].push(...metricEffects
        .filter((effect) => effect.earliestSurface === surface)
        .map(effectContribution))
      breakdown[surface] = withoutZero(breakdown[surface])
    }
    return { values, breakdown }
  }

  let priorValue = 0
  let priorBaseValue = 0
  for (const surface of surfaceOrder) {
    const currentEffects = metricEffects.filter(
      (effect) => effect.earliestSurface === surface,
    )
    const additions = currentEffects.map(effectContribution)
    const baseChange = baseValues[surface] - priorBaseValue
    const rawValue = priorValue + baseChange + sumContributions(additions)
    const displayedValue = Math.min(rawValue, cap.value)
    values[surface] = displayedValue
    breakdown[surface].push(...additions)
    breakdown[surface].push(contribution(cap.source, displayedValue - rawValue))
    breakdown[surface] = withoutZero(breakdown[surface])
    priorValue = displayedValue
    priorBaseValue = baseValues[surface]
  }

  return { values, breakdown }
}

function composeActionEffects(
  baseValues: Record<SurfaceKey, number>,
  effects: ResolvedCurrentEffect[],
  metric: EffectMetric,
  actionId: YixuanActionEffect,
): Pick<ActionModifier, 'values' | 'breakdown'> {
  const scopedEffects = effectsForMetric(effects, metric, actionId)
  return composeMetricEffects(
    baseValues,
    surfaces([], [], []),
    scopedEffects.map(({ action: _action, ...effect }) => effect),
    metric,
  )
}


function calculateLuciaInitialHp(
  setup: CompleteSetup,
): {
  value: number
  breakdown: Contribution[]
} {
  const values = VERTICAL_VALUES
  const lucia = values.lucia
  const engineHp = engineAdvancedInput(setup, 'lucia', 'hpPct')
  const discHp = discStatInput(
    setup,
    'lucia',
    'fourPiece',
    'yunkui',
    DRIVE_DISC_FACTS.yunkui.hpPct,
  ) ?? discStatInput(
    setup,
    'lucia',
    'twoPiece',
    'yunkui',
    DRIVE_DISC_FACTS.yunkui.hpPct,
  )
  const mainHpInputs = (['slot4', 'slot5', 'slot6'] as MainSlot[])
    .map((slot) => mainStatInput(setup, 'lucia', slot, 'hpPct'))
    .filter((input): input is ResolvedSetupInput => Boolean(input))
  const hpSubstat = effectiveSubstatInput(setup, 'lucia', 'hpPct')
  const hpFlat = effectiveSubstatInput(setup, 'lucia', 'hpFlat')
  const totalHpPct = (engineHp?.rawValue ?? 0)
    + (discHp?.rawValue ?? 0)
    + mainHpInputs.reduce((total, input) => total + input.rawValue, 0)
    + (hpSubstat?.rawValue ?? 0)
  const value = lucia.hp * (1 + totalHpPct / 100) + values.fixedDisc.hp + (hpFlat?.rawValue ?? 0)

  return {
    value,
    breakdown: withoutZero([
      ...(engineHp ? [
        percentageContribution(
          engineHp.source,
          lucia.hp * engineHp.rawValue / 100,
          engineHp.rawValue,
        ),
      ] : []),
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

function calculateLuciaSquadSheer(initialHp: number, setup: CompleteSetup) {
  const tier = luciaDarkbreakerTier(setup)
  return {
    value: Math.min(tier.base + (initialHp / 200) * tier.per200Hp, tier.cap),
    cap: tier.cap,
    source: tier.source,
  }
}

interface DialynInitialCritObservation {
  value: number
  uncappedValue: number
  inputs: ResolvedSetupInput[]
}

function resolveDialynInitialCritObservation(
  setup: CompleteSetup,
): DialynInitialCritObservation {
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
    value: Math.min(uncappedValue, 100),
    uncappedValue,
    inputs,
  }
}

function buildYixuanActionModifiers(
  effects: ResolvedCurrentEffect[],
  commonDmgBonus: Record<SurfaceKey, number>,
  commonSheerDmgBonus: Record<SurfaceKey, number>,
  commonResIgnore: Record<SurfaceKey, number>,
): ActionModifier[] {
  const coreActions = composeActionEffects(
    commonDmgBonus,
    effects,
    'dmgBonus',
    'coreActions',
  )
  const stunnedEx = composeActionEffects(
    coreActions.values,
    effects,
    'dmgBonus',
    'exSpecialStunned',
  )
  const actions: ActionModifier[] = [
    {
      id: 'coreActions',
      actions: ['Basic Attack', 'EX Special Attack', 'Assist Follow-Up', 'Chain Attack', 'Ultimate'],
      metricId: 'dmgBonus',
      ...coreActions,
    },
    {
      id: 'exSpecialStunned',
      actions: ['EX Special Attack'],
      metricId: 'dmgBonus',
      baseActionId: 'coreActions',
      ...stunnedEx,
    },
  ]

  if (effects.some(({ action }) => action === 'mindscapeCloudShaper')) {
    actions.push({
      id: 'mindscapeCloudShaper',
      actions: [
        'EX Special Attack: Cloud-Shaper',
        'EX Special Attack: Ashen Ink Becomes Shadows',
      ],
      metricId: 'dmgBonus',
      baseActionId: 'exSpecialStunned',
      ...composeActionEffects(
        stunnedEx.values,
        effects,
        'dmgBonus',
        'mindscapeCloudShaper',
      ),
    })
  }

  if (effects.some(({ action }) => action === 'engineSheerActions')) {
    actions.push({
      id: 'engineSheerActions',
      actions: ['EX Special Attack', 'Ultimate'],
      metricId: 'sheerDmgBonus',
      ...composeActionEffects(
        commonSheerDmgBonus,
        effects,
        'sheerDmgBonus',
        'engineSheerActions',
      ),
    })
  }

  if (effects.some(({ action }) => action === 'mindscapeEtherResIgnore')) {
    actions.push({
      id: 'mindscapeEtherResIgnore',
      actions: ['EX Special Attack', 'Ultimate'],
      metricId: 'resIgnore',
      ...composeActionEffects(
        commonResIgnore,
        effects,
        'resIgnore',
        'mindscapeEtherResIgnore',
      ),
    })
  }

  return actions
}

function calculateYixuan(
  state: WorkbenchState,
  luciaSquadSheer: ReturnType<typeof calculateLuciaSquadSheer>,
  dialynInitialCrit: DialynInitialCritObservation,
  luciaClauses: SourceBoundCurrentClause[],
): AgentResult {
  const values = VERTICAL_VALUES
  const setup = completeSetup(state, 'yixuan')
  const yixuan = values.yixuan
  const engine = W_ENGINES[setup.engineId]

  const hpSubstat = effectiveSubstatInput(setup, 'yixuan', 'hpPct')
  const critRateSubstat = effectiveSubstatInput(setup, 'yixuan', 'critRate')
  const critDmgSubstat = effectiveSubstatInput(setup, 'yixuan', 'critDmg')
  const engineHp = engineAdvancedInput(setup, 'yixuan', 'hpPct')
  const engineAtk = engineAdvancedInput(setup, 'yixuan', 'atkPct')
  const discHp = discStatInput(
    setup,
    'yixuan',
    'fourPiece',
    'yunkui',
    DRIVE_DISC_FACTS.yunkui.hpPct,
  )
  const slot5Hp = mainStatInput(setup, 'yixuan', 'slot5', 'hpPct')
  const slot6Hp = mainStatInput(setup, 'yixuan', 'slot6', 'hpPct')
  const hpPercent = (engineHp?.rawValue ?? 0)
    + (discHp?.rawValue ?? 0)
    + (slot5Hp?.rawValue ?? 0)
    + (slot6Hp?.rawValue ?? 0)
    + (hpSubstat?.rawValue ?? 0)
  const initialHp = yixuan.hp * (1 + hpPercent / 100) + values.fixedDisc.hp

  const baseAtk = yixuan.atk + engine.baseAtk
  const initialAtk = baseAtk * (1 + (engineAtk?.rawValue ?? 0) / 100) + values.fixedDisc.atk
  const effects = resolveYixuanEffects(state, {
    initialHp,
    baseAtk,
    dialynInitialCritRate: dialynInitialCrit.value,
    luciaSquadSheer,
  }, luciaClauses)

  const mainCritRate = mainStatInput(setup, 'yixuan', 'slot4', 'critRate')
  const mainCritDmg = mainStatInput(setup, 'yixuan', 'slot4', 'critDmg')
  const twoPieceCritRate = discStatInput(
    setup,
    'yixuan',
    'twoPiece',
    'woodpecker',
    DRIVE_DISC_FACTS.woodpecker.critRate,
  )
  const twoPieceCritDmg = discStatInput(
    setup,
    'yixuan',
    'twoPiece',
    'branchAndBlade',
    DRIVE_DISC_FACTS.branchAndBlade.critDmg,
  )
  const uncappedInitialCritRate = yixuan.critRate
    + (mainCritRate?.rawValue ?? 0)
    + (twoPieceCritRate?.rawValue ?? 0)
    + (critRateSubstat?.rawValue ?? 0)
  const initialCritRate = Math.min(uncappedInitialCritRate, 100)
  const initialCritDmg = yixuan.critDmg
    + (mainCritDmg?.rawValue ?? 0)
    + (twoPieceCritDmg?.rawValue ?? 0)
    + (critDmgSubstat?.rawValue ?? 0)

  const initialDmg = mainStatInput(setup, 'yixuan', 'slot5', 'etherDmg')
  const initialDmgBonus = initialDmg?.rawValue ?? 0
  const hpInitialBreakdown = withoutZero([
    ...(engineHp ? [percentageContribution(
      engineHp.source,
      yixuan.hp * engineHp.rawValue / 100,
      engineHp.rawValue,
    )] : []),
    ...(discHp ? [percentageContribution(
      discHp.source,
      yixuan.hp * discHp.rawValue / 100,
      discHp.rawValue,
    )] : []),
    ...(slot5Hp ? [percentageContribution(
      slot5Hp.source,
      yixuan.hp * slot5Hp.rawValue / 100,
      slot5Hp.rawValue,
    )] : []),
    ...(slot6Hp ? [percentageContribution(
      slot6Hp.source,
      yixuan.hp * slot6Hp.rawValue / 100,
      slot6Hp.rawValue,
    )] : []),
    ...(hpSubstat ? [percentageContribution(
      hpSubstat.source,
      yixuan.hp * hpSubstat.rawValue / 100,
      hpSubstat.rawValue,
    )] : []),
  ])

  const rawCritInitialBreakdown = withoutZero([
    ...(mainCritRate ? [contribution(mainCritRate.source, mainCritRate.rawValue)] : []),
    ...(twoPieceCritRate ? [contribution(
      twoPieceCritRate.source,
      twoPieceCritRate.rawValue,
    )] : []),
    ...(critRateSubstat ? [
      contribution(critRateSubstat.source, critRateSubstat.rawValue),
    ] : []),
  ])
  const critInitialBreakdown = withoutZero([
    ...rawCritInitialBreakdown,
    contribution(
      STATIC_SOURCES.yixuan.critCap,
      initialCritRate - uncappedInitialCritRate,
    ),
  ])

  const maxHp = composeMetricEffects(
    surfaces(initialHp, initialHp, initialHp),
    surfaces(hpInitialBreakdown, [], []),
    effects,
    'maxHp',
  )
  const atk = composeMetricEffects(
    surfaces(initialAtk, initialAtk, initialAtk),
    surfaces(
      withoutZero(engineAtk ? [percentageContribution(
        engineAtk.source,
        baseAtk * engineAtk.rawValue / 100,
        engineAtk.rawValue,
      )] : []),
      [],
      [],
    ),
    effects,
    'atk',
  )
  const convertRuptureStats = (atkValue: number, maxHpValue: number) =>
    atkValue * values.rupture.currentAtkToSheer
      + maxHpValue * values.rupture.currentHpToSheer
  const ruptureSheer = surfaces(
    convertRuptureStats(atk.values.initial, maxHp.values.initial),
    convertRuptureStats(atk.values.combat, maxHp.values.combat),
    convertRuptureStats(atk.values.fully, maxHp.values.fully),
  )
  const sheerForce = composeMetricEffects(
    ruptureSheer,
    surfaces(
      [surfaceValueContribution(STATIC_SOURCES.yixuan.ruptureConversion, ruptureSheer.initial)],
      [surfaceValueContribution(STATIC_SOURCES.yixuan.ruptureConversion, ruptureSheer.combat)],
      [surfaceValueContribution(STATIC_SOURCES.yixuan.ruptureConversion, ruptureSheer.fully)],
    ),
    effects,
    'sheerForce',
  )
  const critRate = composeMetricEffects(
    surfaces(initialCritRate, initialCritRate, initialCritRate),
    surfaces(critInitialBreakdown, [], []),
    effects,
    'critRate',
    { value: 100, source: STATIC_SOURCES.yixuan.critCap },
  )
  const critDmg = composeMetricEffects(
    surfaces(initialCritDmg, initialCritDmg, initialCritDmg),
    surfaces(
      withoutZero([
        ...(mainCritDmg ? [contribution(mainCritDmg.source, mainCritDmg.rawValue)] : []),
        ...(twoPieceCritDmg ? [contribution(
          twoPieceCritDmg.source,
          twoPieceCritDmg.rawValue,
        )] : []),
        ...(critDmgSubstat ? [
          contribution(critDmgSubstat.source, critDmgSubstat.rawValue),
        ] : []),
      ]),
      [],
      [],
    ),
    effects,
    'critDmg',
  )
  const dmgBonus = composeMetricEffects(
    surfaces(initialDmgBonus, initialDmgBonus, initialDmgBonus),
    surfaces(
      withoutZero(initialDmg
        ? [contribution(initialDmg.source, initialDmg.rawValue)]
        : []),
      [],
      [],
    ),
    effects,
    'dmgBonus',
  )
  const sheerDmgBonus = composeMetricEffects(
    surfaces(0, 0, 0),
    surfaces([], [], []),
    effects,
    'sheerDmgBonus',
  )
  const stunDmgMultiplier = composeMetricEffects(
    surfaces(0, 0, 0),
    surfaces([], [], []),
    effects,
    'stunDmgMultiplier',
  )
  const resIgnore = composeMetricEffects(
    surfaces(0, 0, 0),
    surfaces([], [], []),
    effects,
    'resIgnore',
  )

  return {
    agentId: 'yixuan',
    metrics: [
      {
        id: 'maxHp',
        label: 'Max HP',
        unit: '',
        decimals: 0,
        ...maxHp,
      },
      {
        id: 'atk',
        label: 'ATK',
        unit: '',
        decimals: 0,
        ...atk,
      },
      {
        id: 'sheerForce',
        label: 'Sheer Force',
        unit: '',
        decimals: 1,
        ...sheerForce,
      },
      {
        id: 'critRate',
        label: 'CRIT Rate',
        unit: '%',
        decimals: 1,
        ...critRate,
      },
      {
        id: 'critDmg',
        label: 'CRIT DMG',
        unit: '%',
        decimals: 1,
        ...critDmg,
      },
      {
        id: 'dmgBonus',
        label: 'DMG Bonus',
        unit: '%',
        decimals: 1,
        ...dmgBonus,
      },
      {
        id: 'sheerDmgBonus',
        label: 'Sheer DMG Bonus',
        unit: '%',
        decimals: 1,
        ...sheerDmgBonus,
      },
      {
        id: 'stunDmgMultiplier',
        label: 'Stun DMG Multiplier',
        unit: '%',
        decimals: 1,
        ...stunDmgMultiplier,
      },
      {
        id: 'resIgnore',
        label: 'RES Ignore',
        unit: '%',
        decimals: 1,
        ...resIgnore,
      },
    ],
    actionModifiers: buildYixuanActionModifiers(
      effects,
      dmgBonus.values,
      sheerDmgBonus.values,
      resIgnore.values,
    ),
    operations: [],
  }
}

function calculateDialyn(
  state: WorkbenchState,
  initialCrit: DialynInitialCritObservation,
  luciaClauses: SourceBoundCurrentClause[],
): AgentResult {
  const values = VERTICAL_VALUES
  const setup = completeSetup(state, 'dialyn')
  const dialyn = values.dialyn

  const resolved = resolveDialynEffects(state, initialCrit.value, luciaClauses)
  const advancedImpact = engineAdvancedInput(setup, 'dialyn', 'impactPct')
  const initialImpact = dialyn.impact * (1 + (advancedImpact?.rawValue ?? 0) / 100)

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
    resolved.effects,
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
        ...initialCrit.inputs.map((input) => contribution(
          input.source,
          input.rawValue,
        )),
        contribution(
          STATIC_SOURCES.dialyn.critCap,
          initialCrit.value - initialCrit.uncappedValue,
        ),
      ]),
      [],
      [],
    ),
    resolved.effects,
    'critRate',
    { value: 100, source: STATIC_SOURCES.dialyn.critCap },
  )
  const impact = composeMetricEffects(
    surfaces(initialImpact, initialImpact, initialImpact),
    surfaces(
      withoutZero(advancedImpact ? [percentageContribution(
        advancedImpact.source,
        initialImpact - dialyn.impact,
        advancedImpact.rawValue,
      )] : []),
      [],
      [],
    ),
    resolved.effects,
    'impact',
  )
  const dazeBonus = composeMetricEffects(
    surfaces(kingDaze?.rawValue ?? 0, kingDaze?.rawValue ?? 0, kingDaze?.rawValue ?? 0),
    surfaces(
      withoutZero(kingDaze
        ? [contribution(kingDaze.source, kingDaze.rawValue)]
        : []),
      [],
      [],
    ),
    resolved.effects,
    'dazeBonus',
  )
  const stunDuration = resolveDialynStunDuration(state)

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
          outputValue: resolved.impactFromCrit.amount,
          outputUnit: '',
        },
      },
      {
        id: 'impact',
        label: 'Impact',
        unit: '',
        decimals: 1,
        ...impact,
      },
      {
        id: 'energyRegen',
        label: 'Energy Regen',
        unit: '',
        decimals: 2,
        values: energyRegen.values,
        breakdown: energyRegen.breakdown,
      },
      {
        id: 'dazeBonus',
        label: 'Daze Bonus',
        unit: '%',
        decimals: 1,
        ...dazeBonus,
      },
    ],
    actionModifiers: [],
    operations: [
      {
        id: 'stunDuration',
        label: 'Enemy Stun duration',
        source: stunDuration.source,
        surface: 'fully',
        value: stunDuration.value,
        unit: 's',
      },
    ],
  }
}

function calculateLucia(
  state: WorkbenchState,
  initialHp: number,
  hpInitialBreakdown: Contribution[],
  squadSheer: ReturnType<typeof calculateLuciaSquadSheer>,
  luciaClauses: SourceBoundCurrentClause[],
): AgentResult {
  const values = VERTICAL_VALUES
  const setup = completeSetup(state, 'lucia')
  const lucia = values.lucia
  const effects = resolveLuciaEffects(luciaClauses, initialHp)
  const maxHp = composeMetricEffects(
    surfaces(initialHp, initialHp, initialHp),
    surfaces(hpInitialBreakdown, [], []),
    effects,
    'maxHp',
  )

  const engineEnergyRegen = engineAdvancedInput(setup, 'lucia', 'energyRegenPct')
  const slotEnergyRegen = mainStatInput(setup, 'lucia', 'slot6', 'energyRegenPct')
  const discEnergyRegen = discStatInput(
    setup,
    'lucia',
    'fourPiece',
    'moonlight',
    DRIVE_DISC_FACTS.moonlight.energyRegenPct,
  )
  const initialEnergyRegenInputs: ResolvedSetupInput[] = [
    ...(engineEnergyRegen ? [engineEnergyRegen] : []),
    ...(discEnergyRegen ? [discEnergyRegen] : []),
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
          current: initialHp,
          cap: values.lucia.darkbreakerHpCap,
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

export function calculateParty(state: WorkbenchState): PartyResult | null {
  if (!isCompleteWorkbench(state)) return null

  const luciaSetup = completeSetup(state, 'lucia')
  const luciaHp = calculateLuciaInitialHp(luciaSetup)
  const luciaSquadSheer = calculateLuciaSquadSheer(luciaHp.value, luciaSetup)
  const dialynInitialCrit = resolveDialynInitialCritObservation(
    completeSetup(state, 'dialyn'),
  )
  const luciaClauses = resolveLuciaProviderClauses(state)

  return {
    agents: [
      calculateYixuan(state, luciaSquadSheer, dialynInitialCrit, luciaClauses),
      calculateDialyn(state, dialynInitialCrit, luciaClauses),
      calculateLucia(
        state,
        luciaHp.value,
        luciaHp.breakdown,
        luciaSquadSheer,
        luciaClauses,
      ),
    ],
  }
}
