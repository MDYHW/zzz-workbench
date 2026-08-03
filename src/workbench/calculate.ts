import {
  SOURCE_LABELS,
  VERTICAL_VALUES,
  W_ENGINES,
  type AgentId,
  type EngineId,
} from './content'
import { hasCompleteSubstats, type WorkbenchState } from './state'

export type SurfaceKey = 'initial' | 'combat' | 'fully'

export interface Contribution {
  source: string
  amount: number
}

export interface GaugeResult {
  source: string
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
  values: Record<SurfaceKey, number>
  breakdown: Record<SurfaceKey, Contribution[]>
}

export interface ResultOperation {
  id: string
  label: string
  source: string
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

const contribution = (source: string, amount: number): Contribution => ({ source, amount })
const subtotal = (surface: 'Initial' | 'Combat', amount: number): Contribution =>
  contribution(`${surface} subtotal`, amount)

const withoutZero = (items: Contribution[]): Contribution[] =>
  items.filter((item) => Math.abs(item.amount) > 0.000_001)

const sumContributions = (items: Contribution[]): number =>
  items.reduce((total, item) => total + item.amount, 0)

function cappedAdditions(
  priorValue: number,
  cap: number,
  additions: Contribution[],
): Contribution[] {
  const rawAddition = sumContributions(additions)
  const displayedAddition = Math.min(priorValue + rawAddition, cap) - priorValue
  const capAdjustment = displayedAddition - rawAddition

  return withoutZero([
    ...additions,
    contribution('Displayed CRIT Rate cap', capAdjustment),
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
      && equipment.mains.slot4
      && equipment.mains.slot5
      && equipment.mains.slot6
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
    contribution(SOURCE_LABELS.dialynAbility, party.dialynDmg),
    contribution(SOURCE_LABELS.luciaCore, party.luciaCoreDmg),
    contribution(SOURCE_LABELS.moonlight, party.luciaDiscDmg),
    contribution(SOURCE_LABELS.dreamlit, party.luciaEngineDmg),
  ]
}

function partyCritDmgBreakdown(): Contribution[] {
  const party = VERTICAL_VALUES.party
  return [
    contribution(SOURCE_LABELS.yesterday, party.dialynEngineCritDmg),
    contribution(SOURCE_LABELS.king, party.dialynKingCritDmg),
    contribution(SOURCE_LABELS.luciaAbility, party.luciaCritDmg),
  ]
}

function calculateLuciaInitialHp(): number {
  const lucia = VERTICAL_VALUES.lucia
  return lucia.hp * (1 + (lucia.engineHp + lucia.yunkuiHp + lucia.mainHp) / 100)
    + VERTICAL_VALUES.fixedDisc.hp
}

function buildYixuanActionModifiers(
  engineId: EngineId,
): ActionModifier[] {
  const yixuan = VERTICAL_VALUES.yixuan
  const qingmingActionBonus = engineId === 'qingming' ? 20 : 0
  const combatCommon = yixuan.coreActionDmg
  const fullyCommon = combatCommon + yixuan.yunkuiSheerDmg

  const buildRow = (
    id: string,
    label: string,
    actionBonus: number,
    fullyOnlyActionBonus = 0,
  ): ActionModifier => {
    const combat = combatCommon + actionBonus
    const fully = fullyCommon + actionBonus + fullyOnlyActionBonus
    const combatSources = [
      subtotal('Initial', 0),
      contribution(SOURCE_LABELS.yixuanCore, combatCommon),
      ...withoutZero([
        contribution(
        'Qingming Birdcage · EX Special / Ultimate',
        actionBonus,
      ),
      ]),
    ]

    return {
      id,
      label,
      metricId: 'sheerDmgBonus',
      values: surfaces(0, combat, fully),
      breakdown: surfaces(
        [],
        combatSources,
        [
          subtotal('Combat', combat),
          contribution(SOURCE_LABELS.yunkui4, yixuan.yunkuiSheerDmg),
          ...withoutZero([
            contribution(SOURCE_LABELS.yixuanAbility, fullyOnlyActionBonus),
          ]),
        ],
      ),
    }
  }

  return [
    buildRow(
      'basicAssistChain',
      'Basic Attack / Assist Follow-Up / Chain Attack',
      0,
    ),
    buildRow(
      'exSpecial',
      'EX Special Attack',
      qingmingActionBonus,
      yixuan.additionalExDmg,
    ),
    buildRow(
      'ultimate',
      'Ultimate',
      qingmingActionBonus,
    ),
  ]
}

function calculateYixuan(
  state: WorkbenchState & { engineId: EngineId },
  luciaSquadSheer: number,
): AgentResult {
  const values = VERTICAL_VALUES
  const yixuan = values.yixuan
  const engine = W_ENGINES[state.engineId]
  const engineSource = state.engineId === 'qingming' ? SOURCE_LABELS.qingming : SOURCE_LABELS.cauldron
  const hpSubstatPct = state.substats.hpPct * 3
  const atkSubstatPct = state.substats.atkPct * 3
  const critRateSubstat = state.substats.critRate * 2.4
  const critDmgSubstat = state.substats.critDmg * 4.8

  const hpPercent = engine.advancedStat.value + yixuan.yunkuiHp + yixuan.slot6Hp + hpSubstatPct
  const initialHp = yixuan.hp * (1 + hpPercent / 100) + values.fixedDisc.hp
  const luciaCoreHpAmount = initialHp * values.party.luciaCoreHp / 100
  const luciaEngineHpAmount = initialHp * values.party.luciaEngineHp / 100
  const fullyHp = initialHp + luciaCoreHpAmount + luciaEngineHpAmount

  const baseAtk = yixuan.atk + engine.baseAtk
  const atkSubstatAmount = baseAtk * atkSubstatPct / 100
  const initialAtk = baseAtk + atkSubstatAmount + values.fixedDisc.atk

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
  const fullyCritDmg = initialCritDmg + partyCritDmgBonus()

  const initialDmgBonus = yixuan.slot5EtherDmg
  const combatDmgBonus = initialDmgBonus + (state.engineId === 'qingming' ? 16 : 0)
  const fullyDmgBonus = combatDmgBonus
    + partyDmgBonus()
    + (state.engineId === 'cauldron' ? 19.2 : 0)
  const commonDmgBonus = surfaces(initialDmgBonus, combatDmgBonus, fullyDmgBonus)

  const hpInitialBreakdown = withoutZero([
    contribution(SOURCE_LABELS.agent, yixuan.hp),
    contribution(engineSource, yixuan.hp * engine.advancedStat.value / 100),
    contribution(SOURCE_LABELS.yunkui2, yixuan.hp * yixuan.yunkuiHp / 100),
    contribution(SOURCE_LABELS.slot6, yixuan.hp * yixuan.slot6Hp / 100),
    contribution('Effective substat hits · HP', yixuan.hp * hpSubstatPct / 100),
    contribution(SOURCE_LABELS.disc1, values.fixedDisc.hp),
  ])

  const atkInitialBreakdown = withoutZero([
    contribution(SOURCE_LABELS.agent, yixuan.atk),
    contribution(engineSource, engine.baseAtk),
    contribution('Effective substat hits · ATK', atkSubstatAmount),
    contribution(SOURCE_LABELS.disc2, values.fixedDisc.atk),
  ])

  const rawCritInitialBreakdown = withoutZero([
    contribution(SOURCE_LABELS.agent, yixuan.critRate),
    contribution(SOURCE_LABELS.slot4, yixuan.slot4CritRate),
    contribution(SOURCE_LABELS.woodpecker2, yixuan.woodpeckerCritRate),
    contribution('Effective substat hits · CRIT Rate', critRateSubstat),
  ])
  const critInitialBreakdown = withoutZero([
    ...rawCritInitialBreakdown,
    contribution(
      'Displayed CRIT Rate cap',
      initialCritRate - sumContributions(rawCritInitialBreakdown),
    ),
  ])

  const critDmgInitialBreakdown = withoutZero([
    contribution(SOURCE_LABELS.agent, yixuan.critDmg),
    contribution('Effective substat hits · CRIT DMG', critDmgSubstat),
  ])

  return {
    agentId: 'yixuan',
    metrics: [
      {
        id: 'maxHp',
        label: 'Max HP',
        unit: '',
        decimals: 0,
        values: surfaces(initialHp, initialHp, fullyHp),
        breakdown: surfaces(
          hpInitialBreakdown,
          [subtotal('Initial', initialHp)],
          [
            subtotal('Combat', initialHp),
            contribution(SOURCE_LABELS.luciaCore, luciaCoreHpAmount),
            contribution(SOURCE_LABELS.dreamlit, luciaEngineHpAmount),
          ],
        ),
      },
      {
        id: 'atk',
        label: 'ATK',
        unit: '',
        decimals: 0,
        values: surfaces(initialAtk, initialAtk, initialAtk),
        breakdown: surfaces(
          atkInitialBreakdown,
          [subtotal('Initial', initialAtk)],
          [subtotal('Combat', initialAtk)],
        ),
      },
      {
        id: 'sheerForce',
        label: 'Sheer Force',
        unit: '',
        decimals: 1,
        values: surfaces(initialSheer, initialSheer, fullySheer),
        breakdown: surfaces(
          [
            contribution('Current Max HP × 0.1', initialHp * yixuan.hpToSheer),
            contribution('Current ATK × 0.3', initialAtk * yixuan.atkToSheer),
          ],
          [subtotal('Initial', initialSheer)],
          [
            subtotal('Combat', initialSheer),
            contribution(
              SOURCE_LABELS.luciaCore,
              luciaCoreHpAmount * yixuan.hpToSheer,
            ),
            contribution(
              SOURCE_LABELS.dreamlit,
              luciaEngineHpAmount * yixuan.hpToSheer,
            ),
            contribution(SOURCE_LABELS.luciaSheer, luciaSquadSheer),
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
          [
            subtotal('Initial', initialCritRate),
            ...cappedAdditions(
              initialCritRate,
              100,
              [contribution(engineSource, combatEngineCrit)],
            ),
          ],
          [
            subtotal('Combat', combatCritRate),
            ...cappedAdditions(
              combatCritRate,
              100,
              [
                contribution(engineSource, fullyEngineCrit),
                contribution(SOURCE_LABELS.yunkui4, yixuan.yunkuiCritRate),
              ],
            ),
          ],
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
          [subtotal('Initial', initialCritDmg)],
          [
            subtotal('Combat', initialCritDmg),
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
          [contribution(SOURCE_LABELS.slot5, initialDmgBonus)],
          withoutZero([
            subtotal('Initial', initialDmgBonus),
            contribution(SOURCE_LABELS.qingming, combatDmgBonus - initialDmgBonus),
          ]),
          withoutZero([
            subtotal('Combat', combatDmgBonus),
            ...partyDmgBreakdown(),
            contribution(SOURCE_LABELS.cauldron, state.engineId === 'cauldron' ? 19.2 : 0),
          ]),
        ),
      },
      {
        id: 'sheerDmgBonus',
        label: 'Sheer DMG Bonus',
        unit: '%',
        decimals: 1,
        values: surfaces(
          0,
          yixuan.coreActionDmg,
          yixuan.coreActionDmg + yixuan.yunkuiSheerDmg,
        ),
        breakdown: surfaces(
          [],
          [
            subtotal('Initial', 0),
            contribution(SOURCE_LABELS.yixuanCore, yixuan.coreActionDmg),
          ],
          [
            subtotal('Combat', yixuan.coreActionDmg),
            contribution(SOURCE_LABELS.yunkui4, yixuan.yunkuiSheerDmg),
          ],
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
          [subtotal('Initial', 0)],
          [
            subtotal('Combat', 0),
            contribution(SOURCE_LABELS.dialynCore, values.party.dialynStunMultiplier),
          ],
        ),
      },
    ],
    actionModifiers: buildYixuanActionModifiers(state.engineId),
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
  const fullyCritDmg = dialyn.critDmg + partyCritDmgBonus()

  const critInitialBreakdown = [
    contribution(SOURCE_LABELS.agent, dialyn.critRate),
    contribution(SOURCE_LABELS.yesterday, dialyn.engineCritRate),
    contribution(SOURCE_LABELS.slot4, dialyn.slot4CritRate),
    contribution(SOURCE_LABELS.woodpecker2, dialyn.woodpeckerCritRate),
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
        breakdown: surfaces(
          critInitialBreakdown,
          [subtotal('Initial', initialCritRate)],
          [subtotal('Combat', initialCritRate)],
        ),
      },
      {
        id: 'impact',
        label: 'Impact',
        unit: '',
        decimals: 1,
        values: surfaces(dialyn.impact, combatImpact, combatImpact),
        breakdown: surfaces(
          [contribution(SOURCE_LABELS.agent, dialyn.impact)],
          [
            subtotal('Initial', dialyn.impact),
            contribution(SOURCE_LABELS.dialynCore, impactBonus),
          ],
          [subtotal('Combat', combatImpact)],
        ),
        gauge: {
          source: SOURCE_LABELS.dialynCore,
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
        id: 'dazeBonus',
        label: 'Daze Bonus',
        unit: '%',
        decimals: 1,
        values: surfaces(0, dialyn.kingDaze, dialyn.kingDaze + dialyn.engineDaze),
        breakdown: surfaces(
          [],
          [
            subtotal('Initial', 0),
            contribution(SOURCE_LABELS.king, dialyn.kingDaze),
          ],
          [
            subtotal('Combat', dialyn.kingDaze),
            contribution(SOURCE_LABELS.yesterday, dialyn.engineDaze),
          ],
        ),
      },
      {
        id: 'critDmg',
        label: 'CRIT DMG',
        unit: '%',
        decimals: 1,
        values: surfaces(dialyn.critDmg, dialyn.critDmg, fullyCritDmg),
        breakdown: surfaces(
          [contribution(SOURCE_LABELS.agent, dialyn.critDmg)],
          [subtotal('Initial', dialyn.critDmg)],
          [
            subtotal('Combat', dialyn.critDmg),
            ...partyCritDmgBreakdown(),
          ],
        ),
      },
      {
        id: 'dmgBonus',
        label: 'DMG Bonus',
        unit: '%',
        decimals: 1,
        values: surfaces(0, 0, partyDmgBonus()),
        breakdown: surfaces(
          [],
          [subtotal('Initial', 0)],
          [subtotal('Combat', 0), ...partyDmgBreakdown()],
        ),
      },
    ],
    actionModifiers: [],
    operations: [
      {
        id: 'stunMultiplier',
        label: 'Enemy Stun DMG Multiplier',
        source: SOURCE_LABELS.dialynCore,
        surface: 'fully',
        value: values.party.dialynStunMultiplier,
        unit: '%',
      },
      {
        id: 'stunDuration',
        label: 'Enemy Stun duration',
        source: SOURCE_LABELS.dialynCore,
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
  const fullyCritDmg = lucia.critDmg + partyCritDmgBonus()

  const hpInitialBreakdown = [
    contribution(SOURCE_LABELS.agent, lucia.hp),
    contribution(SOURCE_LABELS.dreamlit, lucia.hp * lucia.engineHp / 100),
    contribution(SOURCE_LABELS.yunkui2, lucia.hp * lucia.yunkuiHp / 100),
    contribution('Drive Discs · Slots 4/5/6', lucia.hp * lucia.mainHp / 100),
    contribution(SOURCE_LABELS.disc1, values.fixedDisc.hp),
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
          [subtotal('Initial', initialHp)],
          [
            subtotal('Combat', initialHp),
            contribution(SOURCE_LABELS.luciaCore, luciaCoreHpAmount),
            contribution(SOURCE_LABELS.dreamlit, luciaEngineHpAmount),
          ],
        ),
      },
      {
        id: 'squadSheerForce',
        label: 'Squad Sheer Force',
        unit: '',
        decimals: 1,
        values: surfaces(0, 0, squadSheer),
        breakdown: surfaces(
          [],
          [subtotal('Initial', 0)],
          [
            subtotal('Combat', 0),
            contribution('EX Special Attack · base', lucia.darkbreakerBase),
            contribution(
              'EX Special Attack · Initial Max HP scaling',
              squadSheer - lucia.darkbreakerBase,
            ),
          ],
        ),
        gauge: {
          source: SOURCE_LABELS.luciaSheer,
          basisLabel: 'Initial Max HP',
          current: initialHp,
          cap: 24000,
          outputLabel: 'Squad Sheer Force',
          outputValue: squadSheer,
          outputUnit: '',
        },
      },
      {
        id: 'critDmg',
        label: 'CRIT DMG',
        unit: '%',
        decimals: 1,
        values: surfaces(lucia.critDmg, lucia.critDmg, fullyCritDmg),
        breakdown: surfaces(
          [contribution(SOURCE_LABELS.agent, lucia.critDmg)],
          [subtotal('Initial', lucia.critDmg)],
          [
            subtotal('Combat', lucia.critDmg),
            ...partyCritDmgBreakdown(),
          ],
        ),
      },
      {
        id: 'dmgBonus',
        label: 'DMG Bonus',
        unit: '%',
        decimals: 1,
        values: surfaces(0, 0, partyDmgBonus()),
        breakdown: surfaces(
          [],
          [subtotal('Initial', 0)],
          [subtotal('Combat', 0), ...partyDmgBreakdown()],
        ),
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
