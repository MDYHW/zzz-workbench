import {
  SOURCE_LABELS,
  SUBSTAT_CHOICES,
  VERTICAL_VALUES,
  W_ENGINES,
  type AgentId,
  type EngineId,
} from './content'
import { hasCompleteSubstats, type WorkbenchState } from './state'

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
  | 'calculation'

export interface ResultSource {
  label: string
  detail?: string
  ownerAgentId: AgentId
  locus: SourceLocus
}

export interface Contribution extends ResultSource {
  amount: number
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
  label: string
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

const percentageContribution = (
  resultSource: ResultSource,
  amount: number,
  percentage: number,
): Contribution => contribution(resultSource, amount, {
  value: percentage,
  unit: '%',
  decimals: Number.isInteger(percentage) ? 0 : 1,
})

const SOURCES = {
  yixuan: {
    qingming: source(SOURCE_LABELS.qingming, 'yixuan', 'w-engine'),
    cauldron: source(SOURCE_LABELS.cauldron, 'yixuan', 'w-engine'),
    yunkui2: source(SOURCE_LABELS.yunkui2, 'yixuan', 'disc-4pc'),
    yunkui4: source(SOURCE_LABELS.yunkui4, 'yixuan', 'disc-4pc'),
    woodpecker2: source(SOURCE_LABELS.woodpecker2, 'yixuan', 'disc-2pc'),
    slot4: source(SOURCE_LABELS.slot4, 'yixuan', 'disc-slot-4'),
    slot5: source(SOURCE_LABELS.slot5, 'yixuan', 'disc-slot-5'),
    slot6: source(SOURCE_LABELS.slot6, 'yixuan', 'disc-slot-6'),
    critRateSubstat: source('Effective substat hits \u00B7 CRIT Rate', 'yixuan', 'substat-1'),
    critDmgSubstat: source('Effective substat hits \u00B7 CRIT DMG', 'yixuan', 'substat-2'),
    hpSubstat: source('Effective substat hits \u00B7 HP', 'yixuan', 'substat-3'),
    hpToSheer: source(SOURCE_LABELS.yixuanCore, 'yixuan', 'core', 'Max HP \u00D7 0.1'),
    atkToSheer: source('Rupture specialty', 'yixuan', 'identity', 'ATK \u00D7 0.3'),
    core: source(SOURCE_LABELS.yixuanCore, 'yixuan', 'core'),
    additional: source(SOURCE_LABELS.yixuanAbility, 'yixuan', 'additional'),
    critCap: source('Displayed CRIT Rate cap', 'yixuan', 'calculation'),
  },
  dialyn: {
    core: source(SOURCE_LABELS.dialynCore, 'dialyn', 'core'),
    additional: source(SOURCE_LABELS.dialynAbility, 'dialyn', 'additional'),
    engine: source(SOURCE_LABELS.yesterday, 'dialyn', 'w-engine'),
    king2: source(SOURCE_LABELS.king2, 'dialyn', 'disc-4pc'),
    king4: source(SOURCE_LABELS.king4, 'dialyn', 'disc-4pc'),
    twoPiece: source(SOURCE_LABELS.woodpecker2, 'dialyn', 'disc-2pc'),
    slot4: source(SOURCE_LABELS.slot4, 'dialyn', 'disc-slot-4'),
  },
  lucia: {
    core: source(SOURCE_LABELS.luciaCore, 'lucia', 'core'),
    additional: source(SOURCE_LABELS.luciaAbility, 'lucia', 'additional'),
    engine: source(SOURCE_LABELS.dreamlit, 'lucia', 'w-engine'),
    fourPiece: source(SOURCE_LABELS.moonlight, 'lucia', 'disc-4pc'),
    twoPiece: source(SOURCE_LABELS.yunkui2, 'lucia', 'disc-2pc'),
    slot4: source(SOURCE_LABELS.slot4, 'lucia', 'disc-slot-4'),
    slot5: source(SOURCE_LABELS.slot5, 'lucia', 'disc-slot-5'),
    slot6: source(SOURCE_LABELS.slot6, 'lucia', 'disc-slot-6'),
    exSpecial: source(SOURCE_LABELS.luciaSheer, 'lucia', 'ex-special'),
  },
} as const

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

  return withoutZero([
    ...additions,
    contribution(capSource, capAdjustment),
  ])
}

function isComplete(state: WorkbenchState): state is WorkbenchState & {
  engineId: EngineId
  refinement: 'W1' | 'W5'
  equipment: NonNullable<WorkbenchState['equipment']>
} {
  const equipment = state.equipment
  return Boolean(
    state.engineId
      && state.refinement
      && equipment?.fourPiece
      && equipment.twoPiece
      && Object.values(equipment.mains).every(({ stat, value }) => Boolean(stat && value))
      && hasCompleteSubstats(state.substats),
  )
}

function calculateLuciaSquadSheer(initialHp: number): number {
  const { darkbreakerBase, darkbreakerPer200Hp, darkbreakerCap } = VERTICAL_VALUES.lucia
  return Math.min(
    darkbreakerBase + (initialHp / 200) * darkbreakerPer200Hp,
    darkbreakerCap,
  )
}

function partyDmgBonus(): number {
  const party = VERTICAL_VALUES.party
  return party.dialynDmg + party.luciaCoreDmg + party.luciaDiscDmg + party.luciaEngineDmg
}

function partyCritDmgBonus(): number {
  const party = VERTICAL_VALUES.party
  return party.dialynEngineCritDmg + party.dialynKingCritDmg + party.luciaCritDmg
}

function partyDmgBreakdown(): Contribution[] {
  const party = VERTICAL_VALUES.party
  return [
    contribution(SOURCES.dialyn.additional, party.dialynDmg),
    contribution(SOURCES.lucia.core, party.luciaCoreDmg),
    contribution(SOURCES.lucia.fourPiece, party.luciaDiscDmg),
    contribution(SOURCES.lucia.engine, party.luciaEngineDmg),
  ]
}

function partyCritDmgBreakdown(): Contribution[] {
  const party = VERTICAL_VALUES.party
  return [
    contribution(SOURCES.dialyn.engine, party.dialynEngineCritDmg),
    contribution(SOURCES.dialyn.king4, party.dialynKingCritDmg),
    contribution(SOURCES.lucia.additional, party.luciaCritDmg),
  ]
}

function calculateLuciaInitialHp(): number {
  const lucia = VERTICAL_VALUES.lucia
  return lucia.hp * (1 + (lucia.engineHp + lucia.yunkuiHp + lucia.mainHp) / 100)
    + VERTICAL_VALUES.fixedDisc.hp
}

function buildYixuanActionModifiers(
  engineId: EngineId,
  commonDmgBonus: Record<SurfaceKey, number>,
  commonSheerDmgBonus: Record<SurfaceKey, number>,
): ActionModifier[] {
  const yixuan = VERTICAL_VALUES.yixuan
  const coreBonus = yixuan.coreActionDmgBonus
  const actions: ActionModifier[] = [
    {
      id: 'coreActions',
      label: 'Basic Attack / EX Special Attack / Assist Follow-Up / Chain Attack / Ultimate',
      metricId: 'dmgBonus',
      values: surfaces(
        commonDmgBonus.initial,
        commonDmgBonus.combat + coreBonus,
        commonDmgBonus.fully + coreBonus,
      ),
      breakdown: surfaces(
        [],
        [contribution(SOURCES.yixuan.core, coreBonus)],
        [],
      ),
    },
    {
      id: 'exSpecialStunned',
      label: 'EX Special Attack \u00B7 qualifying forms \u00B7 vs Stunned',
      metricId: 'dmgBonus',
      baseActionId: 'coreActions',
      values: surfaces(
        commonDmgBonus.initial,
        commonDmgBonus.combat + coreBonus,
        commonDmgBonus.fully + coreBonus + yixuan.additionalExDmgBonus,
      ),
      breakdown: surfaces(
        [],
        [],
        [contribution(SOURCES.yixuan.additional, yixuan.additionalExDmgBonus)],
      ),
    },
  ]

  if (engineId === 'qingming') {
    const qingmingSheerBonus = 20
    actions.push({
      id: 'qingmingSheerActions',
      label: 'EX Special Attack / Ultimate',
      metricId: 'sheerDmgBonus',
      values: surfaces(
        commonSheerDmgBonus.initial,
        commonSheerDmgBonus.combat + qingmingSheerBonus,
        commonSheerDmgBonus.fully + qingmingSheerBonus,
      ),
      breakdown: surfaces(
        [],
        [contribution(SOURCES.yixuan.qingming, qingmingSheerBonus)],
        [],
      ),
    })
  }

  return actions
}

function calculateYixuan(
  state: WorkbenchState & { engineId: EngineId },
  luciaSquadSheer: number,
): AgentResult {
  const values = VERTICAL_VALUES
  const yixuan = values.yixuan
  const engine = W_ENGINES[state.engineId]
  const engineSource = state.engineId === 'qingming'
    ? SOURCES.yixuan.qingming
    : SOURCES.yixuan.cauldron
  const hpSubstatPct = state.substats.hpPct * SUBSTAT_CHOICES.hpPct.perHit
  const critRateSubstat = state.substats.critRate * SUBSTAT_CHOICES.critRate.perHit
  const critDmgSubstat = state.substats.critDmg * SUBSTAT_CHOICES.critDmg.perHit

  const hpPercent = engine.advancedStat.value + yixuan.yunkuiHp + yixuan.slot6Hp + hpSubstatPct
  const initialHp = yixuan.hp * (1 + hpPercent / 100) + values.fixedDisc.hp
  const luciaCoreHpAmount = initialHp * values.party.luciaCoreHp / 100
  const luciaEngineHpAmount = initialHp * values.party.luciaEngineHp / 100
  const fullyHp = initialHp + luciaCoreHpAmount + luciaEngineHpAmount

  const initialAtk = yixuan.atk + engine.baseAtk + values.fixedDisc.atk

  const initialSheer = initialHp * yixuan.hpToSheer + initialAtk * yixuan.atkToSheer
  const fullySheer = fullyHp * yixuan.hpToSheer
    + initialAtk * yixuan.atkToSheer
    + luciaSquadSheer

  const uncappedInitialCritRate = yixuan.critRate
    + yixuan.slot4CritRate
    + yixuan.woodpeckerCritRate
    + critRateSubstat
  const initialCritRate = Math.min(uncappedInitialCritRate, 100)
  const combatEngineCrit = state.engineId === 'qingming' ? 20 : 0
  const fullyEngineCrit = state.engineId === 'cauldron' ? 10.4 : 0
  const combatCritRate = Math.min(initialCritRate + combatEngineCrit, 100)
  const fullyCritRate = Math.min(
    combatCritRate + fullyEngineCrit + yixuan.yunkuiCritRate,
    100,
  )

  const initialCritDmg = yixuan.critDmg + critDmgSubstat
  const fullyCritDmg = initialCritDmg
    + yixuan.additionalCritDmg + partyCritDmgBonus()

  const initialDmgBonus = yixuan.slot5EtherDmg
  const combatDmgBonus = initialDmgBonus + (state.engineId === 'qingming' ? 16 : 0)
  const fullyDmgBonus = combatDmgBonus
    + partyDmgBonus()
    + (state.engineId === 'cauldron' ? 19.2 : 0)
  const commonDmgBonus = surfaces(initialDmgBonus, combatDmgBonus, fullyDmgBonus)
  const commonSheerDmgBonus = surfaces(0, 0, yixuan.yunkuiSheerDmg)

  const hpInitialBreakdown = withoutZero([
    percentageContribution(
      engineSource,
      yixuan.hp * engine.advancedStat.value / 100,
      engine.advancedStat.value,
    ),
    percentageContribution(
      SOURCES.yixuan.yunkui2,
      yixuan.hp * yixuan.yunkuiHp / 100,
      yixuan.yunkuiHp,
    ),
    percentageContribution(
      SOURCES.yixuan.slot6,
      yixuan.hp * yixuan.slot6Hp / 100,
      yixuan.slot6Hp,
    ),
    percentageContribution(
      SOURCES.yixuan.hpSubstat,
      yixuan.hp * hpSubstatPct / 100,
      hpSubstatPct,
    ),
  ])

  const rawCritInitialBreakdown = withoutZero([
    contribution(SOURCES.yixuan.slot4, yixuan.slot4CritRate),
    contribution(SOURCES.yixuan.woodpecker2, yixuan.woodpeckerCritRate),
    contribution(SOURCES.yixuan.critRateSubstat, critRateSubstat),
  ])
  const critInitialBreakdown = withoutZero([
    ...rawCritInitialBreakdown,
    contribution(
      SOURCES.yixuan.critCap,
      initialCritRate - uncappedInitialCritRate,
    ),
  ])

  const critDmgInitialBreakdown = withoutZero([
    contribution(SOURCES.yixuan.critDmgSubstat, critDmgSubstat),
  ])

  const metrics: ResultMetric[] = [
    {
      id: 'maxHp',
      label: 'Max HP',
      unit: '',
      decimals: 0,
      values: surfaces(initialHp, initialHp, fullyHp),
      breakdown: surfaces(
        hpInitialBreakdown,
        [],
        [
          percentageContribution(
            SOURCES.lucia.core,
            luciaCoreHpAmount,
            values.party.luciaCoreHp,
          ),
          percentageContribution(
            SOURCES.lucia.engine,
            luciaEngineHpAmount,
            values.party.luciaEngineHp,
          ),
        ],
      ),
    },
    {
      id: 'atk',
      label: 'ATK',
      unit: '',
      decimals: 0,
      values: surfaces(initialAtk, initialAtk, initialAtk),
      breakdown: surfaces([], [], []),
    },
    {
      id: 'sheerForce',
      label: 'Sheer Force',
      unit: '',
      decimals: 1,
      values: surfaces(initialSheer, initialSheer, fullySheer),
      breakdown: surfaces(
        [
          contribution(SOURCES.yixuan.hpToSheer, initialHp * yixuan.hpToSheer),
          contribution(SOURCES.yixuan.atkToSheer, initialAtk * yixuan.atkToSheer),
        ],
        [],
        [
          contribution(SOURCES.lucia.core, luciaCoreHpAmount * yixuan.hpToSheer),
          contribution(SOURCES.lucia.engine, luciaEngineHpAmount * yixuan.hpToSheer),
          contribution(SOURCES.lucia.exSpecial, luciaSquadSheer),
        ],
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
          [contribution(engineSource, combatEngineCrit)],
          SOURCES.yixuan.critCap,
        ),
        cappedAdditions(
          combatCritRate,
          100,
          [
            contribution(engineSource, fullyEngineCrit),
            contribution(SOURCES.yixuan.yunkui4, yixuan.yunkuiCritRate),
          ],
          SOURCES.yixuan.critCap,
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
        critDmgInitialBreakdown,
        [],
        [
          contribution(SOURCES.yixuan.additional, yixuan.additionalCritDmg),
          ...partyCritDmgBreakdown(),
        ],
      ),
    },
    {
      id: 'dmgBonus',
      label: 'DMG Bonus',
      unit: '%',
      decimals: 1,
      values: commonDmgBonus,
      breakdown: surfaces(
        [contribution(SOURCES.yixuan.slot5, initialDmgBonus)],
        withoutZero([
          contribution(SOURCES.yixuan.qingming, combatDmgBonus - initialDmgBonus),
        ]),
        withoutZero([
          ...partyDmgBreakdown(),
          contribution(SOURCES.yixuan.cauldron, state.engineId === 'cauldron' ? 19.2 : 0),
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
        [contribution(SOURCES.yixuan.yunkui4, yixuan.yunkuiSheerDmg)],
      ),
    },
    {
      id: 'stunDmgMultiplier',
      label: 'Stun DMG Multiplier',
      unit: '%',
      decimals: 1,
      values: surfaces(0, 0, values.party.dialynStunMultiplier),
      breakdown: surfaces(
        [],
        [],
        [contribution(SOURCES.dialyn.core, values.party.dialynStunMultiplier)],
      ),
    },
  ]

  return {
    agentId: 'yixuan',
    metrics,
    actionModifiers: buildYixuanActionModifiers(
      state.engineId,
      commonDmgBonus,
      commonSheerDmgBonus,
    ),
    operations: [],
  }
}

function calculateDialyn(): AgentResult {
  const values = VERTICAL_VALUES
  const dialyn = values.dialyn
  const initialCritRate = dialyn.critRate
    + dialyn.engineCritRate
    + dialyn.slot4CritRate
    + dialyn.woodpeckerCritRate
  const impactBonus = Math.min(
    Math.max(initialCritRate - dialyn.critThreshold, 0) * dialyn.impactPerCrit,
    dialyn.impactBonusCap,
  )
  const combatImpact = dialyn.impact + impactBonus

  const critInitialBreakdown = [
    contribution(SOURCES.dialyn.engine, dialyn.engineCritRate),
    contribution(SOURCES.dialyn.slot4, dialyn.slot4CritRate),
    contribution(SOURCES.dialyn.twoPiece, dialyn.woodpeckerCritRate),
  ]

  return {
    agentId: 'dialyn',
    metrics: [
      {
        id: 'critRate',
        label: 'CRIT Rate',
        unit: '%',
        decimals: 1,
        values: surfaces(initialCritRate, initialCritRate, initialCritRate),
        breakdown: surfaces(critInitialBreakdown, [], []),
        gauge: {
          source: SOURCES.dialyn.core,
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
        values: surfaces(dialyn.impact, combatImpact, combatImpact),
        breakdown: surfaces(
        [],
          [contribution(SOURCES.dialyn.core, impactBonus)],
          [],
        ),
      },
      {
        id: 'dazeBonus',
        label: 'Daze Bonus',
        unit: '%',
        decimals: 1,
        values: surfaces(dialyn.kingDaze, dialyn.kingDaze, dialyn.kingDaze + dialyn.engineDaze),
        breakdown: surfaces(
          [contribution(SOURCES.dialyn.king2, dialyn.kingDaze)],
          [],
          [contribution(SOURCES.dialyn.engine, dialyn.engineDaze)],
        ),
      },
    ],
    actionModifiers: [],
    operations: [
      {
        id: 'stunDuration',
        label: 'Enemy Stun duration',
        source: SOURCES.dialyn.core,
        surface: 'fully',
        value: values.party.dialynStunExtension,
        unit: 's',
      },
    ],
  }
}

function calculateLucia(initialHp: number, squadSheer: number): AgentResult {
  const values = VERTICAL_VALUES
  const lucia = values.lucia
  const luciaCoreHpAmount = initialHp * values.party.luciaCoreHp / 100
  const luciaEngineHpAmount = initialHp * values.party.luciaEngineHp / 100
  const fullyHp = initialHp + luciaCoreHpAmount + luciaEngineHpAmount
  const mainStatHpAmount = lucia.hp * (lucia.mainHp / 3) / 100

  const hpInitialBreakdown = [
    percentageContribution(
      SOURCES.lucia.engine,
      lucia.hp * lucia.engineHp / 100,
      lucia.engineHp,
    ),
    percentageContribution(
      SOURCES.lucia.twoPiece,
      lucia.hp * lucia.yunkuiHp / 100,
      lucia.yunkuiHp,
    ),
    percentageContribution(SOURCES.lucia.slot4, mainStatHpAmount, lucia.mainHp / 3),
    percentageContribution(SOURCES.lucia.slot5, mainStatHpAmount, lucia.mainHp / 3),
    percentageContribution(SOURCES.lucia.slot6, mainStatHpAmount, lucia.mainHp / 3),
  ]

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
          [
          percentageContribution(
            SOURCES.lucia.core,
            luciaCoreHpAmount,
            values.party.luciaCoreHp,
          ),
          percentageContribution(
            SOURCES.lucia.engine,
            luciaEngineHpAmount,
            values.party.luciaEngineHp,
          ),
          ],
        ),
        gauge: {
          source: SOURCES.lucia.exSpecial,
          basisLabel: 'Initial Max HP',
          current: initialHp,
          cap: 24000,
          outputLabel: 'Squad Sheer Force',
          outputValue: squadSheer,
          outputUnit: '',
        },
      },
    ],
    actionModifiers: [],
    operations: [],
  }
}

export function calculateParty(state: WorkbenchState): PartyResult | null {
  if (!isComplete(state)) return null

  const luciaInitialHp = calculateLuciaInitialHp()
  const luciaSquadSheer = calculateLuciaSquadSheer(luciaInitialHp)

  return {
    agents: [
      calculateYixuan(state, luciaSquadSheer),
      calculateDialyn(),
      calculateLucia(luciaInitialHp, luciaSquadSheer),
    ],
  }
}
