import {
  DRIVE_DISCS,
  MAIN_STATS,
  SOURCE_LABELS,
  SUBSTAT_CHOICES_BY_AGENT,
  VERTICAL_VALUES,
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

function substatAmount(
  setup: CompleteSetup,
  agentId: AgentId,
  substatId: SubstatId,
): number {
  const choice = SUBSTAT_CHOICES_BY_AGENT[agentId].find(({ id }) => id === substatId)
  if (!choice) return 0
  return (setup.substats[substatId] ?? 0) * choice.perHit
}

function mainAmount(setup: CompleteSetup, slot: MainSlot, statId: string): number {
  return setup.mains[slot] === statId
    ? MAIN_STATS[setup.mains[slot]!].numericValue
    : 0
}

function engineAdvanced(setup: CompleteSetup, statId: string): number {
  const advanced = W_ENGINES[setup.engineId].advancedStat
  return advanced.id === statId ? advanced.value : 0
}

function yixuanEngineEffects(setup: CompleteSetup) {
  const refinement = setup.refinement
  return {
    combatCrit: setup.engineId === 'qingming' ? scaledEngineValue(20, refinement) : 0,
    combatDmg: setup.engineId === 'qingming' ? scaledEngineValue(16, refinement) : 0,
    fullyCrit: setup.engineId === 'cauldron' ? scaledEngineValue(6.5, refinement) : 0,
    fullyDmg: setup.engineId === 'cauldron' ? scaledEngineValue(12, refinement) : 0,
    fullyCritDmg: setup.engineId === 'puzzleSphere'
      ? scaledEngineValue(16, refinement)
      : 0,
    fullySheerForce: setup.engineId === 'radiowave'
      ? scaledEngineValue(240, refinement)
      : 0,
    actionSheerDmg: setup.engineId === 'qingming'
      ? scaledEngineValue(20, refinement)
      : 0,
    actionExDmg: setup.engineId === 'puzzleSphere'
      ? scaledEngineValue(20, refinement)
      : 0,
  }
}

function dialynEngineEffects(setup: CompleteSetup) {
  const refinement = setup.refinement
  return {
    energyPerSecond: setup.engineId === 'yesterdayCalls'
      ? scaledEngineValue(1.5, refinement)
      : setup.engineId === 'chiefSidekick'
        ? scaledEngineValue(0.4, refinement)
        : setup.engineId === 'hellfireGears'
          ? scaledEngineValue(0.6, refinement)
          : 0,
    combatFlatImpact: setup.engineId === 'chiefSidekick'
      ? scaledEngineValue(30, refinement)
      : 0,
    fullyImpactPct: setup.engineId === 'hellfireGears'
      ? scaledEngineValue(20, refinement)
      : setup.engineId === 'steamOven'
        ? scaledEngineValue(16, refinement)
        : 0,
    fullyDaze: setup.engineId === 'yesterdayCalls'
      ? scaledEngineValue(27, refinement)
      : 0,
    partyCritDmg: setup.engineId === 'yesterdayCalls'
      ? scaledEngineValue(30, refinement)
      : 0,
  }
}

function luciaEngineEffects(setup: CompleteSetup) {
  const refinement = setup.refinement
  return {
    energyPerSecond: setup.engineId === 'dreamlitHearth'
      ? scaledEngineValue(0.4, refinement)
      : setup.engineId === 'thoughtbop' || setup.engineId === 'weepingCradle'
        ? scaledEngineValue(0.6, refinement)
        : 0,
    fullyHpPct: setup.engineId === 'dreamlitHearth'
      ? scaledEngineValue(15, refinement)
      : 0,
    partyDmg: setup.engineId === 'dreamlitHearth'
      ? scaledEngineValue(25, refinement)
      : setup.engineId === 'weepingCradle'
        ? scaledEngineValue(20.2, refinement)
        : 0,
    partyAtkPct: setup.engineId === 'kaboom'
      ? scaledEngineValue(10, refinement)
      : 0,
    partyCritRate: setup.engineId === 'unfetteredGameBall'
      ? 10 + refinement * 2
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
  const selectedEngineSource = engineSource('lucia', setup)
  const selectedFourPieceSource = discSource('lucia', setup.fourPieceId, '4-piece')
  const selectedTwoPieceSource = discSource('lucia', setup.twoPieceId, '2-piece')
  const engineHpPct = engineAdvanced(setup, 'hpPct')
  const discHpPct = (setup.fourPieceId === 'yunkui' || setup.twoPieceId === 'yunkui') ? 10 : 0
  const mainHpPct = (['slot4', 'slot5', 'slot6'] as MainSlot[])
    .reduce((total, slot) => total + mainAmount(setup, slot, 'hpPct'), 0)
  const hpSubstatPct = substatAmount(setup, 'lucia', 'hpPct')
  const hpFlat = substatAmount(setup, 'lucia', 'hpFlat')
  const totalHpPct = engineHpPct + discHpPct + mainHpPct + hpSubstatPct
  const value = lucia.hp * (1 + totalHpPct / 100) + values.fixedDisc.hp + hpFlat
  const hpDiscSource = setup.fourPieceId === 'yunkui'
    ? selectedFourPieceSource
    : selectedTwoPieceSource

  return {
    value,
    breakdown: withoutZero([
      percentageContribution(selectedEngineSource, lucia.hp * engineHpPct / 100, engineHpPct),
      percentageContribution(hpDiscSource, lucia.hp * discHpPct / 100, discHpPct),
      ...(['slot4', 'slot5', 'slot6'] as MainSlot[]).map((slot) => {
        const amount = mainAmount(setup, slot, 'hpPct')
        return percentageContribution(mainSource('lucia', slot), lucia.hp * amount / 100, amount)
      }),
      percentageContribution(
        substatSource('lucia', 'hpPct'),
        lucia.hp * hpSubstatPct / 100,
        hpSubstatPct,
      ),
      contribution(substatSource('lucia', 'hpFlat'), hpFlat),
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
  const engineCrit = engineAdvanced(setup, 'critRate')
  const mainCrit = mainAmount(setup, 'slot4', 'critRate')
  const twoPieceCrit = setup.twoPieceId === 'woodpecker' ? 8 : 0
  const substatCrit = substatAmount(setup, 'dialyn', 'critRate')
  return Math.min(dialyn.critRate + engineCrit + mainCrit + twoPieceCrit + substatCrit, 100)
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
      luciaSetup.fourPieceId === 'moonlight' ? party.luciaDiscDmg : 0,
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
    ? VERTICAL_VALUES.party.dialynKingCritDmg
      + (dialynInitialCritRate >= VERTICAL_VALUES.dialyn.critThreshold
        ? VERTICAL_VALUES.party.dialynKingCritDmg
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

  const hpSubstatPct = substatAmount(setup, 'yixuan', 'hpPct')
  const critRateSubstat = substatAmount(setup, 'yixuan', 'critRate')
  const critDmgSubstat = substatAmount(setup, 'yixuan', 'critDmg')
  const engineHpPct = engineAdvanced(setup, 'hpPct')
  const engineAtkPct = engineAdvanced(setup, 'atkPct')
  const discHpPct = setup.fourPieceId === 'yunkui' ? 10 : 0
  const mainHpPct = mainAmount(setup, 'slot5', 'hpPct')
    + mainAmount(setup, 'slot6', 'hpPct')
  const hpPercent = engineHpPct + discHpPct + mainHpPct + hpSubstatPct
  const initialHp = yixuan.hp * (1 + hpPercent / 100) + values.fixedDisc.hp
  const combatHp = initialHp
  const luciaCoreHpAmount = initialHp * values.party.luciaCoreHp / 100
  const luciaEngineHpAmount = initialHp * luciaEffects.fullyHpPct / 100
  const fullyHp = initialHp + luciaCoreHpAmount + luciaEngineHpAmount

  const baseAtk = yixuan.atk + engine.baseAtk
  const initialAtk = baseAtk * (1 + engineAtkPct / 100) + values.fixedDisc.atk
  const fullyAtkBonus = luciaEffects.partyAtkPct
  const fullyAtk = baseAtk * (1 + (engineAtkPct + fullyAtkBonus) / 100) + values.fixedDisc.atk

  const convertRuptureStats = (atk: number, maxHp: number) =>
    atk * values.rupture.currentAtkToSheer + maxHp * values.rupture.currentHpToSheer
  const initialSheer = convertRuptureStats(initialAtk, initialHp)
  const combatSheer = convertRuptureStats(initialAtk, combatHp)
  const fullyRuptureSheer = convertRuptureStats(fullyAtk, fullyHp)
  const fullySheer = fullyRuptureSheer + luciaSquadSheer.value
    + engineEffects.fullySheerForce

  const mainCritRate = mainAmount(setup, 'slot4', 'critRate')
  const mainCritDmg = mainAmount(setup, 'slot4', 'critDmg')
  const twoPieceCritRate = setup.twoPieceId === 'woodpecker' ? 8 : 0
  const twoPieceCritDmg = setup.twoPieceId === 'branchAndBlade' ? 16 : 0
  const yunkuiCritRate = setup.fourPieceId === 'yunkui' ? 12 : 0
  const yunkuiSheerDmg = setup.fourPieceId === 'yunkui' ? 10 : 0
  const uncappedInitialCritRate = yixuan.critRate
    + mainCritRate
    + twoPieceCritRate
    + critRateSubstat
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
    + mainCritDmg
    + twoPieceCritDmg
    + critDmgSubstat
  const fullyCritDmg = initialCritDmg
    + yixuan.additionalCritDmg
    + partyCritDmg.total
    + engineEffects.fullyCritDmg

  const initialDmgBonus = mainAmount(setup, 'slot5', 'etherDmg')
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
    percentageContribution(selectedEngineSource, yixuan.hp * engineHpPct / 100, engineHpPct),
    percentageContribution(selectedFourPieceSource, yixuan.hp * discHpPct / 100, discHpPct),
    percentageContribution(
      mainSource('yixuan', 'slot5'),
      yixuan.hp * mainAmount(setup, 'slot5', 'hpPct') / 100,
      mainAmount(setup, 'slot5', 'hpPct'),
    ),
    percentageContribution(
      mainSource('yixuan', 'slot6'),
      yixuan.hp * mainAmount(setup, 'slot6', 'hpPct') / 100,
      mainAmount(setup, 'slot6', 'hpPct'),
    ),
    percentageContribution(
      substatSource('yixuan', 'hpPct'),
      yixuan.hp * hpSubstatPct / 100,
      hpSubstatPct,
    ),
  ])

  const rawCritInitialBreakdown = withoutZero([
    contribution(mainSource('yixuan', 'slot4'), mainCritRate),
    contribution(selectedTwoPieceSource, twoPieceCritRate),
    contribution(substatSource('yixuan', 'critRate'), critRateSubstat),
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
            percentageContribution(
              selectedEngineSource,
              baseAtk * engineAtkPct / 100,
              engineAtkPct,
            ),
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
            contribution(mainSource('yixuan', 'slot4'), mainCritDmg),
            contribution(selectedTwoPieceSource, twoPieceCritDmg),
            contribution(substatSource('yixuan', 'critDmg'), critDmgSubstat),
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
            contribution(mainSource('yixuan', 'slot5'), initialDmgBonus),
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

  const engineCrit = engineAdvanced(setup, 'critRate')
  const mainCrit = mainAmount(setup, 'slot4', 'critRate')
  const twoPieceCrit = setup.twoPieceId === 'woodpecker' ? 8 : 0
  const critRateSubstat = substatAmount(setup, 'dialyn', 'critRate')
  const uncappedInitialCritRate = dialyn.critRate
    + engineCrit
    + mainCrit
    + twoPieceCrit
    + critRateSubstat
  const initialCritRate = Math.min(uncappedInitialCritRate, 100)
  const fullyCritRate = Math.min(initialCritRate + luciaEffects.partyCritRate, 100)

  const impactBonus = Math.min(
    Math.max(initialCritRate - dialyn.critThreshold, 0) * dialyn.impactPerCrit,
    dialyn.impactBonusCap,
  )
  const advancedImpactPct = engineAdvanced(setup, 'impactPct')
  const initialImpact = dialyn.impact * (1 + advancedImpactPct / 100)
  const combatImpact = initialImpact + impactBonus + engineEffects.combatFlatImpact
  const fullyImpact = combatImpact + dialyn.impact * engineEffects.fullyImpactPct / 100

  const engineEnergyRegenPct = engineAdvanced(setup, 'energyRegenPct')
  const slotEnergyRegenPct = mainAmount(setup, 'slot6', 'energyRegenPct')
  const discEnergyRegenPct = setup.twoPieceId === 'swingJazz' ? 20 : 0
  const totalEnergyRegenPct = engineEnergyRegenPct
    + slotEnergyRegenPct
    + discEnergyRegenPct
  const initialEnergyRegen = dialyn.baseEnergyRegen * (1 + totalEnergyRegenPct / 100)
  const combatEnergyRecoveryPerSecond = initialEnergyRegen + engineEffects.energyPerSecond

  const kingDaze = setup.fourPieceId === 'king' ? 6 : 0
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
            contribution(selectedEngineSource, engineCrit),
            contribution(mainSource('dialyn', 'slot4'), mainCrit),
            contribution(selectedTwoPieceSource, twoPieceCrit),
            contribution(substatSource('dialyn', 'critRate'), critRateSubstat),
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
            percentageContribution(
              selectedEngineSource,
              initialImpact - dialyn.impact,
              advancedImpactPct,
            ),
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
        values: surfaces(
          initialEnergyRegen,
          combatEnergyRecoveryPerSecond,
          combatEnergyRecoveryPerSecond,
        ),
        breakdown: surfaces(
          withoutZero([
            percentageContribution(
              selectedEngineSource,
              dialyn.baseEnergyRegen * engineEnergyRegenPct / 100,
              engineEnergyRegenPct,
            ),
            percentageContribution(
              mainSource('dialyn', 'slot6'),
              dialyn.baseEnergyRegen * slotEnergyRegenPct / 100,
              slotEnergyRegenPct,
            ),
            percentageContribution(
              selectedTwoPieceSource,
              dialyn.baseEnergyRegen * discEnergyRegenPct / 100,
              discEnergyRegenPct,
            ),
          ]),
          withoutZero([
            perSecondEnergyContribution(
              selectedEngineSource,
              engineEffects.energyPerSecond,
            ),
          ]),
          [],
        ),
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

  const engineEnergyRegenPct = engineAdvanced(setup, 'energyRegenPct')
  const discEnergyRegenPct = setup.fourPieceId === 'moonlight' ? 20 : 0
  const initialEnergyRegen = lucia.baseEnergyRegen
    * (1 + (engineEnergyRegenPct + discEnergyRegenPct) / 100)
  const combatEnergyRecoveryPerSecond = initialEnergyRegen + engineEffects.energyPerSecond

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
        values: surfaces(
          initialEnergyRegen,
          combatEnergyRecoveryPerSecond,
          combatEnergyRecoveryPerSecond,
        ),
        breakdown: surfaces(
          withoutZero([
            percentageContribution(
              selectedEngineSource,
              lucia.baseEnergyRegen * engineEnergyRegenPct / 100,
              engineEnergyRegenPct,
            ),
            percentageContribution(
              selectedFourPieceSource,
              lucia.baseEnergyRegen * discEnergyRegenPct / 100,
              discEnergyRegenPct,
            ),
          ]),
          withoutZero([
            perSecondEnergyContribution(
              selectedEngineSource,
              engineEffects.energyPerSecond,
            ),
          ]),
          [],
        ),
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
