import {
  DRIVE_DISC_FACTS,
  DRIVE_DISCS,
  MAIN_STATS,
  SOURCE_LABELS,
  SUBSTAT_CHOICES_BY_AGENT,
  VERTICAL_VALUES,
  W_ENGINE_FACTS,
  W_ENGINES,
  scaledEngineValue,
  type AgentId,
  type DiscId,
  type EngineId,
  type MainSlot,
  type Refinement,
  type SubstatId,
} from './content'
import {
  isCompleteWorkbench,
  type AgentSetupState,
  type WorkbenchState,
} from './state'

export type SurfaceKey = 'initial' | 'combat' | 'fully'

export type SourceLocus =
  | 'identity'
  | 'w-engine'
  | 'disc-4pc'
  | 'disc-2pc'
  | 'disc-slot-4'
  | 'disc-slot-5'
  | 'disc-slot-6'
  | 'substat-1'
  | 'substat-2'
  | 'substat-3'
  | 'core'
  | 'additional'
  | 'ex-special'
  | 'mindscape'
  | 'calculation'

export interface ResultSource {
  label: string
  detail?: string
  ownerAgentId: AgentId
  locus: SourceLocus
}

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

type CompleteSetup = Omit<
  AgentSetupState,
  'engineId' | 'refinement' | 'fourPieceId' | 'twoPieceId'
> & {
  engineId: EngineId
  refinement: Refinement
  fourPieceId: DiscId
  twoPieceId: DiscId
}

interface ResolvedSetupInput {
  rawValue: number
  unit: '%' | ''
  source: ResultSource
}

interface EnergyRegenPerSecondOperation {
  rawValue: number
  source: ResultSource
}

const surfaces = <T>(initial: T, combat: T, fully: T): Record<SurfaceKey, T> => ({
  initial,
  combat,
  fully,
})

const source = (
  label: string,
  ownerAgentId: AgentId,
  locus: SourceLocus,
  detail?: string,
): ResultSource => ({ label, detail, ownerAgentId, locus })

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

const perSecondEnergyContribution = (
  resultSource: ResultSource,
  amount: number,
): Contribution => contribution(resultSource, amount, {
  value: amount,
  unit: '/s',
  decimals: Number.isInteger(amount) ? 0 : 2,
})

function energyRegenProjection(
  baseEnergyRegen: number,
  initialPercentages: ResolvedSetupInput[],
  perSecondOperations: EnergyRegenPerSecondOperation[],
): Pick<ResultMetric, 'values' | 'breakdown'> {
  const initial = baseEnergyRegen * (
    1 + initialPercentages.reduce((total, input) => total + input.rawValue, 0) / 100
  )
  const later = initial + perSecondOperations.reduce(
    (total, operation) => total + operation.rawValue,
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
      withoutZero(perSecondOperations.map((operation) => perSecondEnergyContribution(
        operation.source,
        operation.rawValue,
      ))),
      [],
    ),
  }
}

const withoutZero = (items: Contribution[]): Contribution[] =>
  items.filter((item) => Math.abs(item.amount) > 0.000_001)

const sumContributions = (items: Contribution[]): number =>
  items.reduce((total, item) => total + item.amount, 0)

function cappedAdditions(
  priorValue: number,
  cap: number,
  additions: Contribution[],
  capSource: ResultSource,
): Contribution[] {
  const rawAddition = sumContributions(additions)
  const displayedAddition = Math.min(priorValue + rawAddition, cap) - priorValue
  const capAdjustment = displayedAddition - rawAddition
  return withoutZero([...additions, contribution(capSource, capAdjustment)])
}

const STATIC_SOURCES = {
  yixuan: {
    ruptureConversion: source(
      'Rupture specialty',
      'yixuan',
      'identity',
      'Current ATK \u00D7 0.3 + Current Max HP \u00D7 0.1',
    ),
    core: source(SOURCE_LABELS.yixuanCore, 'yixuan', 'core'),
    additional: source(SOURCE_LABELS.yixuanAbility, 'yixuan', 'additional'),
    critCap: source('Displayed CRIT Rate cap', 'yixuan', 'calculation'),
  },
  dialyn: {
    core: source(SOURCE_LABELS.dialynCore, 'dialyn', 'core'),
    additional: source(SOURCE_LABELS.dialynAbility, 'dialyn', 'additional'),
    critCap: source('Displayed CRIT Rate cap', 'dialyn', 'calculation'),
  },
  lucia: {
    core: source(SOURCE_LABELS.luciaCore, 'lucia', 'core'),
    additional: source(SOURCE_LABELS.luciaAbility, 'lucia', 'additional'),
    exSpecial: source(SOURCE_LABELS.luciaSheer, 'lucia', 'ex-special'),
  },
} as const

function mindscapeSource(
  agentId: AgentId,
  minimumMindscape: number,
  condition?: string,
): ResultSource {
  const detail = [`M${minimumMindscape}`, condition].filter(Boolean).join(' \u00B7 ')
  return source(SOURCE_LABELS.mindscape, agentId, 'mindscape', detail)
}

function completeSetup(state: WorkbenchState, agentId: AgentId): CompleteSetup {
  return state.setups[agentId] as CompleteSetup
}

function engineSource(agentId: AgentId, setup: CompleteSetup): ResultSource {
  const engine = W_ENGINES[setup.engineId]
  return source(
    engine.name,
    agentId,
    'w-engine',
    `W${setup.refinement}`,
  )
}

function discSource(
  agentId: AgentId,
  discId: DiscId,
  piece: '4-piece' | '2-piece',
): ResultSource {
  const label = agentId === 'dialyn' && discId === 'swingJazz' && piece === '2-piece'
    ? 'Swing Jazz or Moonlight Lullaby'
    : DRIVE_DISCS[discId].name
  return source(
    label,
    agentId,
    piece === '4-piece' ? 'disc-4pc' : 'disc-2pc',
    piece,
  )
}

function mainSource(agentId: AgentId, slot: MainSlot): ResultSource {
  const locus = `disc-${slot.replace('slot', 'slot-')}` as SourceLocus
  return source(SOURCE_LABELS[slot], agentId, locus)
}

function substatSource(
  agentId: AgentId,
  substatId: SubstatId,
): ResultSource {
  const choices = SUBSTAT_CHOICES_BY_AGENT[agentId]
  const index = choices.findIndex(({ id }) => id === substatId)
  const choice = choices[index]
  return source(
    'Effective substat hits',
    agentId,
    `substat-${index + 1}` as SourceLocus,
    choice.label,
  )
}

function effectiveSubstatInput(
  setup: CompleteSetup,
  agentId: AgentId,
  substatId: SubstatId,
): ResolvedSetupInput | undefined {
  const choices = SUBSTAT_CHOICES_BY_AGENT[agentId]
  const index = choices.findIndex(({ id }) => id === substatId)
  if (index === -1) return undefined
  const choice = choices[index]
  return {
    rawValue: (setup.substats[substatId] ?? 0) * choice.perHit,
    unit: choice.unit,
    source: substatSource(agentId, substatId),
  }
}

function mainStatInput(
  setup: CompleteSetup,
  agentId: AgentId,
  slot: MainSlot,
  statId: string,
): ResolvedSetupInput | undefined {
  const selectedStatId = setup.mains[slot]
  if (selectedStatId !== statId) return undefined
  const selected = MAIN_STATS[selectedStatId]
  return {
    rawValue: selected.numericValue,
    unit: '%',
    source: mainSource(agentId, slot),
  }
}

function engineAdvancedInput(
  setup: CompleteSetup,
  agentId: AgentId,
  statId: string,
): ResolvedSetupInput | undefined {
  const advanced = W_ENGINES[setup.engineId].advancedStat
  if (advanced.id !== statId) return undefined
  return {
    rawValue: advanced.value,
    unit: advanced.unit,
    source: engineSource(agentId, setup),
  }
}

function yixuanEngineEffects(setup: CompleteSetup) {
  const refinement = setup.refinement
  return {
    combatCrit: setup.engineId === 'qingming'
      ? scaledEngineValue(W_ENGINE_FACTS.qingming.critRate, refinement)
      : 0,
    combatDmg: setup.engineId === 'qingming'
      ? scaledEngineValue(W_ENGINE_FACTS.qingming.etherDmg, refinement)
      : 0,
    fullyCrit: setup.engineId === 'cauldron'
      ? scaledEngineValue(W_ENGINE_FACTS.cauldron.critRate, refinement)
      : 0,
    fullyDmg: setup.engineId === 'cauldron'
      ? scaledEngineValue(W_ENGINE_FACTS.cauldron.dmg, refinement)
      : 0,
    fullyCritDmg: setup.engineId === 'puzzleSphere'
      ? scaledEngineValue(W_ENGINE_FACTS.puzzleSphere.critDmg, refinement)
      : 0,
    fullySheerForce: setup.engineId === 'radiowave'
      ? scaledEngineValue(W_ENGINE_FACTS.radiowave.sheerForce, refinement)
      : 0,
    actionSheerDmg: setup.engineId === 'qingming'
      ? scaledEngineValue(W_ENGINE_FACTS.qingming.actionSheerDmg, refinement)
      : 0,
    actionExDmg: setup.engineId === 'puzzleSphere'
      ? scaledEngineValue(W_ENGINE_FACTS.puzzleSphere.actionExDmg, refinement)
      : 0,
  }
}

function dialynEngineEffects(setup: CompleteSetup) {
  const refinement = setup.refinement
  return {
    energyPerSecond: setup.engineId === 'yesterdayCalls'
      ? scaledEngineValue(W_ENGINE_FACTS.yesterdayCalls.energyPerSecond, refinement)
      : setup.engineId === 'chiefSidekick'
        ? scaledEngineValue(W_ENGINE_FACTS.chiefSidekick.energyPerSecond, refinement)
        : setup.engineId === 'hellfireGears'
          ? scaledEngineValue(W_ENGINE_FACTS.hellfireGears.energyPerSecond, refinement)
          : 0,
    combatFlatImpact: setup.engineId === 'chiefSidekick'
      ? scaledEngineValue(W_ENGINE_FACTS.chiefSidekick.flatImpact, refinement)
      : 0,
    fullyImpactPct: setup.engineId === 'hellfireGears'
      ? scaledEngineValue(W_ENGINE_FACTS.hellfireGears.impact, refinement)
      : setup.engineId === 'steamOven'
        ? scaledEngineValue(W_ENGINE_FACTS.steamOven.impact, refinement)
        : 0,
    fullyDaze: setup.engineId === 'yesterdayCalls'
      ? scaledEngineValue(W_ENGINE_FACTS.yesterdayCalls.daze, refinement)
      : 0,
    partyCritDmg: setup.engineId === 'yesterdayCalls'
      ? scaledEngineValue(W_ENGINE_FACTS.yesterdayCalls.squadCritDmg, refinement)
      : 0,
  }
}

function luciaEngineEffects(setup: CompleteSetup) {
  const refinement = setup.refinement
  return {
    energyPerSecond: setup.engineId === 'dreamlitHearth'
      ? scaledEngineValue(W_ENGINE_FACTS.dreamlitHearth.energyPerSecond, refinement)
      : setup.engineId === 'thoughtbop' || setup.engineId === 'weepingCradle'
        ? scaledEngineValue(
            setup.engineId === 'thoughtbop'
              ? W_ENGINE_FACTS.thoughtbop.energyPerSecond
              : W_ENGINE_FACTS.weepingCradle.energyPerSecond,
            refinement,
          )
        : 0,
    fullyHpPct: setup.engineId === 'dreamlitHearth'
      ? scaledEngineValue(W_ENGINE_FACTS.dreamlitHearth.hpPct, refinement)
      : 0,
    partyDmg: setup.engineId === 'dreamlitHearth'
      ? scaledEngineValue(W_ENGINE_FACTS.dreamlitHearth.squadDmg, refinement)
      : setup.engineId === 'weepingCradle'
        ? scaledEngineValue(W_ENGINE_FACTS.weepingCradle.squadDmg, refinement)
        : 0,
    partyAtkPct: setup.engineId === 'kaboom'
      ? scaledEngineValue(W_ENGINE_FACTS.kaboom.squadAtkPct, refinement)
      : 0,
    partyCritRate: setup.engineId === 'unfetteredGameBall'
      ? W_ENGINE_FACTS.unfetteredGameBall.squadCritRateBase
        + refinement * W_ENGINE_FACTS.unfetteredGameBall.squadCritRatePerRefinement
      : 0,
  }
}

function calculateLuciaInitialHp(
  setup: CompleteSetup,
): {
  value: number
  breakdown: Contribution[]
} {
  const values = VERTICAL_VALUES
  const lucia = values.lucia
  const selectedFourPieceSource = discSource('lucia', setup.fourPieceId, '4-piece')
  const selectedTwoPieceSource = discSource('lucia', setup.twoPieceId, '2-piece')
  const engineHp = engineAdvancedInput(setup, 'lucia', 'hpPct')
  const discHpPct = (setup.fourPieceId === 'yunkui' || setup.twoPieceId === 'yunkui')
    ? DRIVE_DISC_FACTS.yunkui.hpPct
    : 0
  const mainHpInputs = (['slot4', 'slot5', 'slot6'] as MainSlot[])
    .map((slot) => mainStatInput(setup, 'lucia', slot, 'hpPct'))
    .filter((input): input is ResolvedSetupInput => Boolean(input))
  const hpSubstat = effectiveSubstatInput(setup, 'lucia', 'hpPct')
  const hpFlat = effectiveSubstatInput(setup, 'lucia', 'hpFlat')
  const totalHpPct = (engineHp?.rawValue ?? 0)
    + discHpPct
    + mainHpInputs.reduce((total, input) => total + input.rawValue, 0)
    + (hpSubstat?.rawValue ?? 0)
  const value = lucia.hp * (1 + totalHpPct / 100) + values.fixedDisc.hp + (hpFlat?.rawValue ?? 0)
  const hpDiscSource = setup.fourPieceId === 'yunkui'
    ? selectedFourPieceSource
    : selectedTwoPieceSource

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
      percentageContribution(hpDiscSource, lucia.hp * discHpPct / 100, discHpPct),
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

function calculateDialynInitialCritRate(setup: CompleteSetup): number {
  const dialyn = VERTICAL_VALUES.dialyn
  const engineCrit = engineAdvancedInput(setup, 'dialyn', 'critRate')
  const mainCrit = mainStatInput(setup, 'dialyn', 'slot4', 'critRate')
  const twoPieceCrit = setup.twoPieceId === 'woodpecker'
    ? DRIVE_DISC_FACTS.woodpecker.critRate
    : 0
  const substatCrit = effectiveSubstatInput(setup, 'dialyn', 'critRate')
  return Math.min(
    dialyn.critRate
      + (engineCrit?.rawValue ?? 0)
      + (mainCrit?.rawValue ?? 0)
      + twoPieceCrit
      + (substatCrit?.rawValue ?? 0),
    100,
  )
}

function partyDmgParts(
  state: WorkbenchState,
): { total: number; breakdown: Contribution[] } {
  const dialynSetup = completeSetup(state, 'dialyn')
  const luciaSetup = completeSetup(state, 'lucia')
  const luciaEngine = luciaEngineEffects(luciaSetup)
  const party = VERTICAL_VALUES.party
  const breakdown = withoutZero([
    contribution(STATIC_SOURCES.dialyn.additional, party.dialynDmg),
    contribution(
      mindscapeSource('dialyn', 2, 'against Malicious Complaint'),
      dialynSetup.mindscape >= 2 ? VERTICAL_VALUES.dialyn.mindscapeDmg : 0,
    ),
    contribution(STATIC_SOURCES.lucia.core, party.luciaCoreDmg),
    contribution(
      discSource('lucia', luciaSetup.fourPieceId, '4-piece'),
      luciaSetup.fourPieceId === 'moonlight' ? DRIVE_DISC_FACTS.moonlight.squadDmg : 0,
    ),
    contribution(engineSource('lucia', luciaSetup), luciaEngine.partyDmg),
  ])
  return { total: sumContributions(breakdown), breakdown }
}

function partyCritDmgParts(
  state: WorkbenchState,
  dialynInitialCritRate: number,
): { total: number; breakdown: Contribution[] } {
  const dialynSetup = completeSetup(state, 'dialyn')
  const dialynEngine = dialynEngineEffects(dialynSetup)
  const kingBonus = dialynSetup.fourPieceId === 'king'
    ? DRIVE_DISC_FACTS.king.squadCritDmg.base
      + (dialynInitialCritRate >= VERTICAL_VALUES.dialyn.critThreshold
        ? DRIVE_DISC_FACTS.king.squadCritDmg.atCritThreshold
        : 0)
    : 0
  const breakdown = withoutZero([
    contribution(engineSource('dialyn', dialynSetup), dialynEngine.partyCritDmg),
    contribution(discSource('dialyn', dialynSetup.fourPieceId, '4-piece'), kingBonus),
    contribution(STATIC_SOURCES.lucia.additional, VERTICAL_VALUES.party.luciaCritDmg),
  ])
  return { total: sumContributions(breakdown), breakdown }
}

function buildYixuanActionModifiers(
  setup: CompleteSetup,
  commonDmgBonus: Record<SurfaceKey, number>,
  commonSheerDmgBonus: Record<SurfaceKey, number>,
  commonResIgnore: Record<SurfaceKey, number>,
): ActionModifier[] {
  const yixuan = VERTICAL_VALUES.yixuan
  const engineEffects = yixuanEngineEffects(setup)
  const selectedEngineSource = engineSource('yixuan', setup)
  const actions: ActionModifier[] = [
    {
      id: 'coreActions',
      actions: ['Basic Attack', 'EX Special Attack', 'Assist Follow-Up', 'Chain Attack', 'Ultimate'],
      metricId: 'dmgBonus',
      values: surfaces(
        commonDmgBonus.initial,
        commonDmgBonus.combat + yixuan.coreActionDmgBonus,
        commonDmgBonus.fully + yixuan.coreActionDmgBonus,
      ),
      breakdown: surfaces(
        [],
        [contribution(STATIC_SOURCES.yixuan.core, yixuan.coreActionDmgBonus)],
        [],
      ),
    },
    {
      id: 'exSpecialStunned',
      actions: ['EX Special Attack'],
      metricId: 'dmgBonus',
      baseActionId: 'coreActions',
      values: surfaces(
        commonDmgBonus.initial,
        commonDmgBonus.combat + yixuan.coreActionDmgBonus,
        commonDmgBonus.fully
          + yixuan.coreActionDmgBonus
          + yixuan.additionalExDmgBonus
          + engineEffects.actionExDmg,
      ),
      breakdown: surfaces(
        [],
        [],
        withoutZero([
          contribution(STATIC_SOURCES.yixuan.additional, yixuan.additionalExDmgBonus),
          contribution(selectedEngineSource, engineEffects.actionExDmg),
        ]),
      ),
    },
  ]

  if (setup.mindscape >= 4) {
    const bonus = yixuan.mindscapeActionDmgPerStack * 2
    const stunnedEx = actions.find(({ id }) => id === 'exSpecialStunned')!
    actions.push({
      id: 'mindscapeCloudShaper',
      actions: [
        'EX Special Attack: Cloud-Shaper',
        'EX Special Attack: Ashen Ink Becomes Shadows',
      ],
      metricId: 'dmgBonus',
      baseActionId: 'exSpecialStunned',
      values: surfaces(
        stunnedEx.values.initial,
        stunnedEx.values.combat,
        stunnedEx.values.fully + bonus,
      ),
      breakdown: surfaces(
        [],
        [],
        [contribution(mindscapeSource('yixuan', 4, '30% x 2 stacks'), bonus)],
      ),
    })
  }

  if (engineEffects.actionSheerDmg > 0) {
    actions.push({
      id: 'engineSheerActions',
      actions: ['EX Special Attack', 'Ultimate'],
      metricId: 'sheerDmgBonus',
      values: surfaces(
        commonSheerDmgBonus.initial,
        commonSheerDmgBonus.combat + engineEffects.actionSheerDmg,
        commonSheerDmgBonus.fully + engineEffects.actionSheerDmg,
      ),
      breakdown: surfaces(
        [],
        [contribution(selectedEngineSource, engineEffects.actionSheerDmg)],
        [],
      ),
    })
  }

  if (setup.mindscape >= 2) {
    actions.push({
      id: 'mindscapeEtherResIgnore',
      actions: ['EX Special Attack', 'Ultimate'],
      metricId: 'resIgnore',
      values: surfaces(
        commonResIgnore.initial,
        commonResIgnore.combat,
        commonResIgnore.fully + yixuan.mindscapeEtherResIgnore,
      ),
      breakdown: surfaces(
        [],
        [],
        [contribution(mindscapeSource('yixuan', 2, 'Ether RES Ignore'), yixuan.mindscapeEtherResIgnore)],
      ),
    })
  }

  return actions
}

function calculateYixuan(
  state: WorkbenchState,
  luciaSquadSheer: ReturnType<typeof calculateLuciaSquadSheer>,
  dialynInitialCritRate: number,
): AgentResult {
  const values = VERTICAL_VALUES
  const setup = completeSetup(state, 'yixuan')
  const dialynSetup = completeSetup(state, 'dialyn')
  const luciaSetup = completeSetup(state, 'lucia')
  const yixuan = values.yixuan
  const engine = W_ENGINES[setup.engineId]
  const selectedEngineSource = engineSource('yixuan', setup)
  const selectedFourPieceSource = discSource('yixuan', setup.fourPieceId, '4-piece')
  const selectedTwoPieceSource = discSource('yixuan', setup.twoPieceId, '2-piece')
  const engineEffects = yixuanEngineEffects(setup)
  const luciaEffects = luciaEngineEffects(luciaSetup)
  const partyDmg = partyDmgParts(state)
  const partyCritDmg = partyCritDmgParts(state, dialynInitialCritRate)

  const hpSubstat = effectiveSubstatInput(setup, 'yixuan', 'hpPct')
  const critRateSubstat = effectiveSubstatInput(setup, 'yixuan', 'critRate')
  const critDmgSubstat = effectiveSubstatInput(setup, 'yixuan', 'critDmg')
  const engineHp = engineAdvancedInput(setup, 'yixuan', 'hpPct')
  const engineAtk = engineAdvancedInput(setup, 'yixuan', 'atkPct')
  const discHpPct = setup.fourPieceId === 'yunkui' ? DRIVE_DISC_FACTS.yunkui.hpPct : 0
  const slot5Hp = mainStatInput(setup, 'yixuan', 'slot5', 'hpPct')
  const slot6Hp = mainStatInput(setup, 'yixuan', 'slot6', 'hpPct')
  const hpPercent = (engineHp?.rawValue ?? 0)
    + discHpPct
    + (slot5Hp?.rawValue ?? 0)
    + (slot6Hp?.rawValue ?? 0)
    + (hpSubstat?.rawValue ?? 0)
  const initialHp = yixuan.hp * (1 + hpPercent / 100) + values.fixedDisc.hp
  const combatHp = initialHp
  const luciaCoreHpAmount = initialHp * values.party.luciaCoreHp / 100
  const luciaEngineHpAmount = initialHp * luciaEffects.fullyHpPct / 100
  const fullyHp = initialHp + luciaCoreHpAmount + luciaEngineHpAmount

  const baseAtk = yixuan.atk + engine.baseAtk
  const initialAtk = baseAtk * (1 + (engineAtk?.rawValue ?? 0) / 100) + values.fixedDisc.atk
  const fullyAtkBonus = luciaEffects.partyAtkPct
  const fullyAtk = baseAtk * (1 + ((engineAtk?.rawValue ?? 0) + fullyAtkBonus) / 100)
    + values.fixedDisc.atk

  const convertRuptureStats = (atk: number, maxHp: number) =>
    atk * values.rupture.currentAtkToSheer + maxHp * values.rupture.currentHpToSheer
  const initialSheer = convertRuptureStats(initialAtk, initialHp)
  const combatSheer = convertRuptureStats(initialAtk, combatHp)
  const fullyRuptureSheer = convertRuptureStats(fullyAtk, fullyHp)
  const fullySheer = fullyRuptureSheer + luciaSquadSheer.value
    + engineEffects.fullySheerForce

  const mainCritRate = mainStatInput(setup, 'yixuan', 'slot4', 'critRate')
  const mainCritDmg = mainStatInput(setup, 'yixuan', 'slot4', 'critDmg')
  const twoPieceCritRate = setup.twoPieceId === 'woodpecker'
    ? DRIVE_DISC_FACTS.woodpecker.critRate
    : 0
  const twoPieceCritDmg = setup.twoPieceId === 'branchAndBlade'
    ? DRIVE_DISC_FACTS.branchAndBlade.critDmg
    : 0
  const yunkuiCritRate = setup.fourPieceId === 'yunkui'
    ? DRIVE_DISC_FACTS.yunkui.critRate
    : 0
  const yunkuiSheerDmg = setup.fourPieceId === 'yunkui'
    ? DRIVE_DISC_FACTS.yunkui.sheerDmg
    : 0
  const uncappedInitialCritRate = yixuan.critRate
    + (mainCritRate?.rawValue ?? 0)
    + twoPieceCritRate
    + (critRateSubstat?.rawValue ?? 0)
  const initialCritRate = Math.min(uncappedInitialCritRate, 100)
  const mindscapeCritRate = setup.mindscape >= 1 ? yixuan.mindscapeCritRate : 0
  const combatCritRate = Math.min(
    initialCritRate + engineEffects.combatCrit + mindscapeCritRate,
    100,
  )
  const fullyCritRate = Math.min(
    combatCritRate
      + engineEffects.fullyCrit
      + yunkuiCritRate
      + luciaEffects.partyCritRate,
    100,
  )

  const initialCritDmg = yixuan.critDmg
    + (mainCritDmg?.rawValue ?? 0)
    + twoPieceCritDmg
    + (critDmgSubstat?.rawValue ?? 0)
  const fullyCritDmg = initialCritDmg
    + yixuan.additionalCritDmg
    + partyCritDmg.total
    + engineEffects.fullyCritDmg

  const initialDmg = mainStatInput(setup, 'yixuan', 'slot5', 'etherDmg')
  const initialDmgBonus = initialDmg?.rawValue ?? 0
  const combatDmgBonus = initialDmgBonus + engineEffects.combatDmg
  const fullyDmgBonus = combatDmgBonus + partyDmg.total + engineEffects.fullyDmg
  const commonDmgBonus = surfaces(initialDmgBonus, combatDmgBonus, fullyDmgBonus)
  const yixuanMindscapeSheerDmg = setup.mindscape >= 6
    ? yixuan.mindscapeMeditationSheerDmg
    : 0
  const luciaMindscapeSheerDmg = luciaSetup.mindscape >= 2
    ? values.lucia.mindscapeSheerDmg
    : 0
  const commonSheerDmgBonus = surfaces(
    0,
    0,
    yunkuiSheerDmg + yixuanMindscapeSheerDmg + luciaMindscapeSheerDmg,
  )
  const dialynMindscapeStun = dialynSetup.mindscape >= 2
    ? values.dialyn.mindscapeStunMultiplier
    : 0

  const dialynMindscapeResIgnore = dialynSetup.mindscape >= 1
    ? values.dialyn.mindscapeResIgnore
    : 0
  const luciaMindscapeResIgnore = luciaSetup.mindscape >= 1
    ? values.lucia.mindscapeResIgnore
    : 0
  const commonResIgnore = surfaces(0, 0, dialynMindscapeResIgnore + luciaMindscapeResIgnore)
  const hpInitialBreakdown = withoutZero([
    ...(engineHp ? [percentageContribution(
      engineHp.source,
      yixuan.hp * engineHp.rawValue / 100,
      engineHp.rawValue,
    )] : []),
    percentageContribution(selectedFourPieceSource, yixuan.hp * discHpPct / 100, discHpPct),
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
    contribution(selectedTwoPieceSource, twoPieceCritRate),
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

  return {
    agentId: 'yixuan',
    metrics: [
      {
        id: 'maxHp',
        label: 'Max HP',
        unit: '',
        decimals: 0,
        values: surfaces(initialHp, combatHp, fullyHp),
        breakdown: surfaces(
          hpInitialBreakdown,
          [],
          withoutZero([
            percentageContribution(
              STATIC_SOURCES.lucia.core,
              luciaCoreHpAmount,
              values.party.luciaCoreHp,
            ),
            percentageContribution(
              engineSource('lucia', luciaSetup),
              luciaEngineHpAmount,
              luciaEffects.fullyHpPct,
            ),
          ]),
        ),
      },
      {
        id: 'atk',
        label: 'ATK',
        unit: '',
        decimals: 0,
        values: surfaces(initialAtk, initialAtk, fullyAtk),
        breakdown: surfaces(
          withoutZero([
            ...(engineAtk ? [percentageContribution(
              engineAtk.source,
              baseAtk * engineAtk.rawValue / 100,
              engineAtk.rawValue,
            )] : []),
          ]),
          [],
          withoutZero([
            percentageContribution(
              engineSource('lucia', luciaSetup),
              baseAtk * fullyAtkBonus / 100,
              fullyAtkBonus,
            ),
          ]),
        ),
      },
      {
        id: 'sheerForce',
        label: 'Sheer Force',
        unit: '',
        decimals: 1,
        values: surfaces(initialSheer, combatSheer, fullySheer),
        breakdown: surfaces(
          [surfaceValueContribution(STATIC_SOURCES.yixuan.ruptureConversion, initialSheer)],
          [surfaceValueContribution(STATIC_SOURCES.yixuan.ruptureConversion, combatSheer)],
          withoutZero([
            surfaceValueContribution(
              STATIC_SOURCES.yixuan.ruptureConversion,
              fullyRuptureSheer,
            ),
            contribution(luciaSquadSheer.source, luciaSquadSheer.value),
            contribution(selectedEngineSource, engineEffects.fullySheerForce),
          ]),
        ),
      },
      {
        id: 'critRate',
        label: 'CRIT Rate',
        unit: '%',
        decimals: 1,
        values: surfaces(initialCritRate, combatCritRate, fullyCritRate),
        breakdown: surfaces(
          critInitialBreakdown,
          cappedAdditions(
            initialCritRate,
            100,
            [
              contribution(selectedEngineSource, engineEffects.combatCrit),
              contribution(mindscapeSource('yixuan', 1), mindscapeCritRate),
            ],
            STATIC_SOURCES.yixuan.critCap,
          ),
          cappedAdditions(
            combatCritRate,
            100,
            [
              contribution(selectedEngineSource, engineEffects.fullyCrit),
              contribution(selectedFourPieceSource, yunkuiCritRate),
              contribution(engineSource('lucia', luciaSetup), luciaEffects.partyCritRate),
            ],
            STATIC_SOURCES.yixuan.critCap,
          ),
        ),
      },
      {
        id: 'critDmg',
        label: 'CRIT DMG',
        unit: '%',
        decimals: 1,
        values: surfaces(initialCritDmg, initialCritDmg, fullyCritDmg),
        breakdown: surfaces(
          withoutZero([
            ...(mainCritDmg ? [contribution(mainCritDmg.source, mainCritDmg.rawValue)] : []),
            contribution(selectedTwoPieceSource, twoPieceCritDmg),
            ...(critDmgSubstat ? [
              contribution(critDmgSubstat.source, critDmgSubstat.rawValue),
            ] : []),
          ]),
          [],
          withoutZero([
            contribution(STATIC_SOURCES.yixuan.additional, yixuan.additionalCritDmg),
            ...partyCritDmg.breakdown,
            contribution(selectedEngineSource, engineEffects.fullyCritDmg),
          ]),
        ),
      },
      {
        id: 'dmgBonus',
        label: 'DMG Bonus',
        unit: '%',
        decimals: 1,
        values: commonDmgBonus,
        breakdown: surfaces(
          withoutZero([
            ...(initialDmg ? [contribution(initialDmg.source, initialDmg.rawValue)] : []),
          ]),
          withoutZero([
            contribution(selectedEngineSource, engineEffects.combatDmg),
          ]),
          withoutZero([
            ...partyDmg.breakdown,
            contribution(selectedEngineSource, engineEffects.fullyDmg),
          ]),
        ),
      },
      {
        id: 'sheerDmgBonus',
        label: 'Sheer DMG Bonus',
        unit: '%',
        decimals: 1,
        values: commonSheerDmgBonus,
        breakdown: surfaces(
          [],
          [],
          withoutZero([
            contribution(selectedFourPieceSource, yunkuiSheerDmg),
            contribution(
              mindscapeSource('yixuan', 6, 'during Meditation'),
              yixuanMindscapeSheerDmg,
            ),
            contribution(
              mindscapeSource('lucia', 2, 'Darkbreaker + Wellspring'),
              luciaMindscapeSheerDmg,
            ),
          ]),
        ),
      },
      {
        id: 'stunDmgMultiplier',
        label: 'Stun DMG Multiplier',
        unit: '%',
        decimals: 1,
        values: surfaces(
          0,
          0,
          values.party.dialynStunMultiplier + dialynMindscapeStun,
        ),
        breakdown: surfaces(
          [],
          [],
          withoutZero([
            contribution(STATIC_SOURCES.dialyn.core, values.party.dialynStunMultiplier),
            contribution(mindscapeSource('dialyn', 2), dialynMindscapeStun),
          ]),
        ),
      },
      {
        id: 'resIgnore',
        label: 'RES Ignore',
        unit: '%',
        decimals: 1,
        values: commonResIgnore,
        breakdown: surfaces(
          [],
          [],
          withoutZero([
            contribution(
              mindscapeSource('dialyn', 1, 'Overwhelmingly Positive'),
              dialynMindscapeResIgnore,
            ),
            contribution(
              mindscapeSource('lucia', 1, "Dreamer's Nursery Rhyme"),
              luciaMindscapeResIgnore,
            ),
          ]),
        ),
      },
    ],
    actionModifiers: buildYixuanActionModifiers(
      setup,
      commonDmgBonus,
      commonSheerDmgBonus,
      commonResIgnore,
    ),
    operations: [],
  }
}

function calculateDialyn(state: WorkbenchState): AgentResult {
  const values = VERTICAL_VALUES
  const setup = completeSetup(state, 'dialyn')
  const yixuanSetup = completeSetup(state, 'yixuan')
  const luciaSetup = completeSetup(state, 'lucia')
  const dialyn = values.dialyn
  const selectedEngineSource = engineSource('dialyn', setup)
  const selectedFourPieceSource = discSource('dialyn', setup.fourPieceId, '4-piece')
  const selectedTwoPieceSource = discSource('dialyn', setup.twoPieceId, '2-piece')
  const engineEffects = dialynEngineEffects(setup)
  const luciaEffects = luciaEngineEffects(luciaSetup)

  const engineCrit = engineAdvancedInput(setup, 'dialyn', 'critRate')
  const mainCrit = mainStatInput(setup, 'dialyn', 'slot4', 'critRate')
  const twoPieceCrit = setup.twoPieceId === 'woodpecker'
    ? DRIVE_DISC_FACTS.woodpecker.critRate
    : 0
  const critRateSubstat = effectiveSubstatInput(setup, 'dialyn', 'critRate')
  const uncappedInitialCritRate = dialyn.critRate
    + (engineCrit?.rawValue ?? 0)
    + (mainCrit?.rawValue ?? 0)
    + twoPieceCrit
    + (critRateSubstat?.rawValue ?? 0)
  const initialCritRate = Math.min(uncappedInitialCritRate, 100)
  const fullyCritRate = Math.min(initialCritRate + luciaEffects.partyCritRate, 100)

  const impactBonus = Math.min(
    Math.max(initialCritRate - dialyn.critThreshold, 0) * dialyn.impactPerCrit,
    dialyn.impactBonusCap,
  )
  const advancedImpact = engineAdvancedInput(setup, 'dialyn', 'impactPct')
  const initialImpact = dialyn.impact * (1 + (advancedImpact?.rawValue ?? 0) / 100)
  const combatImpact = initialImpact + impactBonus + engineEffects.combatFlatImpact
  const fullyImpact = combatImpact + dialyn.impact * engineEffects.fullyImpactPct / 100

  const engineEnergyRegen = engineAdvancedInput(setup, 'dialyn', 'energyRegenPct')
  const slotEnergyRegen = mainStatInput(setup, 'dialyn', 'slot6', 'energyRegenPct')
  const initialEnergyRegenInputs: ResolvedSetupInput[] = [
    ...(engineEnergyRegen ? [engineEnergyRegen] : []),
    ...(slotEnergyRegen ? [slotEnergyRegen] : []),
    ...(setup.twoPieceId === 'swingJazz' ? [{
      rawValue: DRIVE_DISC_FACTS.swingJazz.energyRegenPct,
      unit: '%' as const,
      source: selectedTwoPieceSource,
    }] : []),
  ]
  const energyRegen = energyRegenProjection(
    dialyn.baseEnergyRegen,
    initialEnergyRegenInputs,
    engineEffects.energyPerSecond > 0
      ? [{ rawValue: engineEffects.energyPerSecond, source: selectedEngineSource }]
      : [],
  )

  const kingDaze = setup.fourPieceId === 'king' ? DRIVE_DISC_FACTS.king.daze : 0
  const fullyDaze = kingDaze + engineEffects.fullyDaze

  return {
    agentId: 'dialyn',
    metrics: [
      {
        id: 'critRate',
        label: 'CRIT Rate',
        unit: '%',
        decimals: 1,
        values: surfaces(initialCritRate, initialCritRate, fullyCritRate),
        breakdown: surfaces(
          withoutZero([
            ...(engineCrit ? [contribution(engineCrit.source, engineCrit.rawValue)] : []),
            ...(mainCrit ? [contribution(mainCrit.source, mainCrit.rawValue)] : []),
            contribution(selectedTwoPieceSource, twoPieceCrit),
            ...(critRateSubstat ? [
              contribution(critRateSubstat.source, critRateSubstat.rawValue),
            ] : []),
            contribution(
              STATIC_SOURCES.dialyn.critCap,
              initialCritRate - uncappedInitialCritRate,
            ),
          ]),
          [],
          cappedAdditions(
            initialCritRate,
            100,
            [contribution(engineSource('lucia', luciaSetup), luciaEffects.partyCritRate)],
            STATIC_SOURCES.dialyn.critCap,
          ),
        ),
        gauge: {
          source: STATIC_SOURCES.dialyn.core,
          basisLabel: 'Initial CRIT Rate',
          current: initialCritRate,
          threshold: dialyn.critThreshold,
          cap: 100,
          outputLabel: 'Combat Impact bonus',
          outputValue: impactBonus,
          outputUnit: '',
        },
      },
      {
        id: 'impact',
        label: 'Impact',
        unit: '',
        decimals: 1,
        values: surfaces(initialImpact, combatImpact, fullyImpact),
        breakdown: surfaces(
          withoutZero([
            ...(advancedImpact ? [percentageContribution(
              advancedImpact.source,
              initialImpact - dialyn.impact,
              advancedImpact.rawValue,
            )] : []),
          ]),
          withoutZero([
            contribution(STATIC_SOURCES.dialyn.core, impactBonus),
            contribution(selectedEngineSource, engineEffects.combatFlatImpact),
          ]),
          withoutZero([
            percentageContribution(
              selectedEngineSource,
              fullyImpact - combatImpact,
              engineEffects.fullyImpactPct,
            ),
          ]),
        ),
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
        values: surfaces(kingDaze, kingDaze, fullyDaze),
        breakdown: surfaces(
          withoutZero([contribution(selectedFourPieceSource, kingDaze)]),
          [],
          withoutZero([contribution(selectedEngineSource, engineEffects.fullyDaze)]),
        ),
      },
    ],
    actionModifiers: [],
    operations: [
      {
        id: 'stunDuration',
        label: 'Enemy Stun duration',
        source: yixuanSetup.mindscape >= 2
          ? mindscapeSource('yixuan', 2)
          : STATIC_SOURCES.dialyn.core,
        surface: 'fully',
        value: yixuanSetup.mindscape >= 2
          ? values.yixuan.mindscapeStunExtension
          : values.party.dialynStunExtension,
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
): AgentResult {
  const values = VERTICAL_VALUES
  const setup = completeSetup(state, 'lucia')
  const lucia = values.lucia
  const selectedEngineSource = engineSource('lucia', setup)
  const selectedFourPieceSource = discSource('lucia', setup.fourPieceId, '4-piece')
  const engineEffects = luciaEngineEffects(setup)

  const luciaCoreHpAmount = initialHp * values.party.luciaCoreHp / 100
  const luciaEngineHpAmount = initialHp * engineEffects.fullyHpPct / 100
  const fullyHp = initialHp + luciaCoreHpAmount + luciaEngineHpAmount

  const engineEnergyRegen = engineAdvancedInput(setup, 'lucia', 'energyRegenPct')
  const slotEnergyRegen = mainStatInput(setup, 'lucia', 'slot6', 'energyRegenPct')
  const initialEnergyRegenInputs: ResolvedSetupInput[] = [
    ...(engineEnergyRegen ? [engineEnergyRegen] : []),
    ...(setup.fourPieceId === 'moonlight' ? [{
      rawValue: DRIVE_DISC_FACTS.moonlight.energyRegenPct,
      unit: '%' as const,
      source: selectedFourPieceSource,
    }] : []),
    ...(slotEnergyRegen ? [slotEnergyRegen] : []),
  ]
  const energyRegen = energyRegenProjection(
    lucia.baseEnergyRegen,
    initialEnergyRegenInputs,
    engineEffects.energyPerSecond > 0
      ? [{ rawValue: engineEffects.energyPerSecond, source: selectedEngineSource }]
      : [],
  )

  return {
    agentId: 'lucia',
    metrics: [
      {
        id: 'maxHp',
        label: 'Max HP',
        unit: '',
        decimals: 0,
        values: surfaces(initialHp, initialHp, fullyHp),
        breakdown: surfaces(
          hpInitialBreakdown,
          [],
          withoutZero([
            percentageContribution(
              STATIC_SOURCES.lucia.core,
              luciaCoreHpAmount,
              values.party.luciaCoreHp,
            ),
            percentageContribution(
              selectedEngineSource,
              luciaEngineHpAmount,
              engineEffects.fullyHpPct,
            ),
          ]),
        ),
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
  const dialynInitialCritRate = calculateDialynInitialCritRate(
    completeSetup(state, 'dialyn'),
  )

  return {
    agents: [
      calculateYixuan(state, luciaSquadSheer, dialynInitialCritRate),
      calculateDialyn(state),
      calculateLucia(state, luciaHp.value, luciaHp.breakdown, luciaSquadSheer),
    ],
  }
}
