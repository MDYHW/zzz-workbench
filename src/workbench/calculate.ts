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

export interface AgentResult {
  agentId: AgentId
  metrics: ResultMetric[]
}

export interface ActionModifier {
  id: string
  label: string
  combat: number
  fully: number
  sources: {
    combat: Contribution[]
    fully: Contribution[]
  }
}

export interface PartyEffect {
  source: string
  label: string
  value: number
  unit: string
  recipient: string
}

export interface PartyResult {
  agents: AgentResult[]
  actionModifiers: ActionModifier[]
  partyEffects: PartyEffect[]
}

const surfaces = <T>(initial: T, combat: T, fully: T): Record<SurfaceKey, T> => ({
  initial,
  combat,
  fully,
})

const contribution = (source: string, amount: number): Contribution => ({ source, amount })

const withoutZero = (items: Contribution[]): Contribution[] =>
  items.filter((item) => Math.abs(item.amount) > 0.000_001)

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

function calculateLuciaDarkbreaker(initialHp: number): number {
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

function calculateLuciaInitialHp(): number {
  const lucia = VERTICAL_VALUES.lucia
  return lucia.hp * (1 + (lucia.engineHp + lucia.yunkuiHp + lucia.mainHp) / 100)
    + VERTICAL_VALUES.fixedDisc.hp
}

function calculateYixuan(
  state: WorkbenchState & { engineId: EngineId },
  luciaDarkbreaker: number,
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
    + luciaDarkbreaker

  const initialCritRate = yixuan.critRate
    + yixuan.slot4CritRate
    + yixuan.woodpeckerCritRate
    + critRateSubstat
  const combatEngineCrit = state.engineId === 'qingming' ? 20 : 0
  const fullyEngineCrit = state.engineId === 'cauldron' ? 10.4 : 0
  const combatCritRate = Math.min(initialCritRate + combatEngineCrit, 100)
  const uncappedFullyCritRate = initialCritRate
    + combatEngineCrit
    + fullyEngineCrit
    + yixuan.yunkuiCritRate
  const fullyCritRate = Math.min(uncappedFullyCritRate, 100)

  const initialCritDmg = yixuan.critDmg + critDmgSubstat
  const fullCritDmgBonus = partyCritDmgBonus()
  const fullyCritDmg = initialCritDmg + fullCritDmgBonus

  const hpInitialBreakdown = withoutZero([
    contribution(SOURCE_LABELS.agent, yixuan.hp),
    contribution(engineSource, yixuan.hp * engine.advancedStat.value / 100),
    contribution(SOURCE_LABELS.yunkui2, yixuan.hp * yixuan.yunkuiHp / 100),
    contribution(SOURCE_LABELS.slot6, yixuan.hp * yixuan.slot6Hp / 100),
    contribution('Effective substat hits \u00B7 HP', yixuan.hp * hpSubstatPct / 100),
    contribution(SOURCE_LABELS.disc1, values.fixedDisc.hp),
  ])

  const atkBreakdown = withoutZero([
    contribution(SOURCE_LABELS.agent, yixuan.atk),
    contribution(engineSource, engine.baseAtk),
    contribution('Effective substat hits \u00B7 ATK', atkSubstatAmount),
    contribution(SOURCE_LABELS.disc2, values.fixedDisc.atk),
  ])

  const critInitialBreakdown = withoutZero([
    contribution(SOURCE_LABELS.agent, yixuan.critRate),
    contribution(SOURCE_LABELS.slot4, yixuan.slot4CritRate),
    contribution(SOURCE_LABELS.woodpecker2, yixuan.woodpeckerCritRate),
    contribution('Effective substat hits \u00B7 CRIT Rate', critRateSubstat),
  ])

  const critDmgInitialBreakdown = withoutZero([
    contribution(SOURCE_LABELS.agent, yixuan.critDmg),
    contribution('Effective substat hits \u00B7 CRIT DMG', critDmgSubstat),
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
          hpInitialBreakdown,
          [
            ...hpInitialBreakdown,
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
        breakdown: surfaces(atkBreakdown, atkBreakdown, atkBreakdown),
      },
      {
        id: 'sheerForce',
        label: 'Sheer Force',
        unit: '',
        decimals: 1,
        values: surfaces(initialSheer, initialSheer, fullySheer),
        breakdown: surfaces(
          [
            contribution('Current Max HP \u00D7 0.1', initialHp * yixuan.hpToSheer),
            contribution('Current ATK \u00D7 0.3', initialAtk * yixuan.atkToSheer),
          ],
          [
            contribution('Current Max HP \u00D7 0.1', initialHp * yixuan.hpToSheer),
            contribution('Current ATK \u00D7 0.3', initialAtk * yixuan.atkToSheer),
          ],
          [
            contribution('Current Max HP \u00D7 0.1', fullyHp * yixuan.hpToSheer),
            contribution('Current ATK \u00D7 0.3', initialAtk * yixuan.atkToSheer),
            contribution(SOURCE_LABELS.darkbreaker, luciaDarkbreaker),
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
          withoutZero([
            ...critInitialBreakdown,
            contribution(engineSource, combatEngineCrit),
          ]),
          withoutZero([
            ...critInitialBreakdown,
            contribution(engineSource, combatEngineCrit + fullyEngineCrit),
            contribution(SOURCE_LABELS.yunkui4, yixuan.yunkuiCritRate),
          ]),
        ),
        gauge: {
          basisLabel: 'Fully Enabled CRIT Rate',
          current: Math.min(uncappedFullyCritRate, 100),
          cap: 100,
          outputLabel: 'Displayed CRIT Rate',
          outputValue: fullyCritRate,
          outputUnit: '%',
        },
      },
      {
        id: 'critDmg',
        label: 'CRIT DMG',
        unit: '%',
        decimals: 1,
        values: surfaces(initialCritDmg, initialCritDmg, fullyCritDmg),
        breakdown: surfaces(
          critDmgInitialBreakdown,
          critDmgInitialBreakdown,
          [
            ...critDmgInitialBreakdown,
            contribution(SOURCE_LABELS.yesterday, values.party.dialynEngineCritDmg),
            contribution(SOURCE_LABELS.king, values.party.dialynKingCritDmg),
            contribution(SOURCE_LABELS.luciaAbility, values.party.luciaCritDmg),
          ],
        ),
      },
    ],
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
  const fullCritDmg = dialyn.critDmg + partyCritDmgBonus()
  const fullDmg = partyDmgBonus()

  const critBreakdown = [
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
        breakdown: surfaces(critBreakdown, critBreakdown, critBreakdown),
        gauge: {
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
          [contribution(SOURCE_LABELS.agent, dialyn.impact)],
          [
            contribution(SOURCE_LABELS.agent, dialyn.impact),
            contribution(SOURCE_LABELS.dialynCore, impactBonus),
          ],
          [
            contribution(SOURCE_LABELS.agent, dialyn.impact),
            contribution(SOURCE_LABELS.dialynCore, impactBonus),
          ],
        ),
      },
      {
        id: 'dazeBonus',
        label: 'Daze Bonus',
        unit: '%',
        decimals: 1,
        values: surfaces(0, dialyn.kingDaze, dialyn.kingDaze + dialyn.engineDaze),
        breakdown: surfaces(
          [],
          [contribution(SOURCE_LABELS.king, dialyn.kingDaze)],
          [
            contribution(SOURCE_LABELS.king, dialyn.kingDaze),
            contribution(SOURCE_LABELS.yesterday, dialyn.engineDaze),
          ],
        ),
      },
      {
        id: 'critDmg',
        label: 'CRIT DMG',
        unit: '%',
        decimals: 1,
        values: surfaces(dialyn.critDmg, dialyn.critDmg, fullCritDmg),
        breakdown: surfaces(
          [contribution(SOURCE_LABELS.agent, dialyn.critDmg)],
          [contribution(SOURCE_LABELS.agent, dialyn.critDmg)],
          [
            contribution(SOURCE_LABELS.agent, dialyn.critDmg),
            contribution(SOURCE_LABELS.yesterday, values.party.dialynEngineCritDmg),
            contribution(SOURCE_LABELS.king, values.party.dialynKingCritDmg),
            contribution(SOURCE_LABELS.luciaAbility, values.party.luciaCritDmg),
          ],
        ),
      },
      {
        id: 'dmgBonus',
        label: 'DMG Bonus',
        unit: '%',
        decimals: 1,
        values: surfaces(0, 0, fullDmg),
        breakdown: surfaces([], [], partyDmgBreakdown()),
      },
    ],
  }
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

function calculateLucia(initialHp: number, darkbreaker: number): AgentResult {
  const values = VERTICAL_VALUES
  const lucia = values.lucia
  const luciaCoreHpAmount = initialHp * values.party.luciaCoreHp / 100
  const luciaEngineHpAmount = initialHp * values.party.luciaEngineHp / 100
  const fullyHp = initialHp + luciaCoreHpAmount + luciaEngineHpAmount
  const fullCritDmg = lucia.critDmg + partyCritDmgBonus()

  const hpBreakdown = [
    contribution(SOURCE_LABELS.agent, lucia.hp),
    contribution(SOURCE_LABELS.dreamlit, lucia.hp * lucia.engineHp / 100),
    contribution(SOURCE_LABELS.yunkui2, lucia.hp * lucia.yunkuiHp / 100),
    contribution('Drive Discs \u00B7 Slots 4/5/6', lucia.hp * lucia.mainHp / 100),
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
          hpBreakdown,
          hpBreakdown,
          [
            ...hpBreakdown,
            contribution(SOURCE_LABELS.luciaCore, luciaCoreHpAmount),
            contribution(SOURCE_LABELS.dreamlit, luciaEngineHpAmount),
          ],
        ),
        gauge: {
          basisLabel: 'Initial Max HP',
          current: initialHp,
          cap: 24000,
          outputLabel: 'Darkbreaker Sheer Force',
          outputValue: darkbreaker,
          outputUnit: '',
        },
      },
      {
        id: 'darkbreaker',
        label: 'Darkbreaker Sheer Force',
        unit: '',
        decimals: 1,
        values: surfaces(0, 0, darkbreaker),
        breakdown: surfaces(
          [],
          [],
          [
            contribution('Darkbreaker base', lucia.darkbreakerBase),
            contribution('Initial Max HP scaling', darkbreaker - lucia.darkbreakerBase),
          ],
        ),
      },
      {
        id: 'critDmg',
        label: 'CRIT DMG',
        unit: '%',
        decimals: 1,
        values: surfaces(lucia.critDmg, lucia.critDmg, fullCritDmg),
        breakdown: surfaces(
          [contribution(SOURCE_LABELS.agent, lucia.critDmg)],
          [contribution(SOURCE_LABELS.agent, lucia.critDmg)],
          [
            contribution(SOURCE_LABELS.agent, lucia.critDmg),
            contribution(SOURCE_LABELS.yesterday, values.party.dialynEngineCritDmg),
            contribution(SOURCE_LABELS.king, values.party.dialynKingCritDmg),
            contribution(SOURCE_LABELS.luciaAbility, values.party.luciaCritDmg),
          ],
        ),
      },
      {
        id: 'dmgBonus',
        label: 'DMG Bonus',
        unit: '%',
        decimals: 1,
        values: surfaces(0, 0, partyDmgBonus()),
        breakdown: surfaces([], [], partyDmgBreakdown()),
      },
    ],
  }
}

function buildActionModifiers(engineId: EngineId): ActionModifier[] {
  const yixuan = VERTICAL_VALUES.yixuan
  const fullParty = partyDmgBonus()
  const engineCombat = engineId === 'qingming' ? 16 : 0
  const engineFully = engineId === 'qingming' ? 16 : 19.2
  const engineSource = engineId === 'qingming' ? SOURCE_LABELS.qingming : SOURCE_LABELS.cauldron
  const baseCombat = engineCombat
  const baseFully = fullParty + yixuan.yunkuiSheerDmg + engineFully
  const commonFully = [
    ...partyDmgBreakdown(),
    contribution(SOURCE_LABELS.yunkui4, yixuan.yunkuiSheerDmg),
    contribution(engineSource, engineFully),
  ]
  const rows: ActionModifier[] = [
    {
      id: 'allSheer',
      label: 'All Sheer actions',
      combat: baseCombat,
      fully: baseFully,
      sources: {
        combat: withoutZero([contribution(engineSource, engineCombat)]),
        fully: commonFully,
      },
    },
    {
      id: 'coreActions',
      label: 'Core-supported actions',
      combat: baseCombat + yixuan.coreActionDmg,
      fully: baseFully + yixuan.coreActionDmg,
      sources: {
        combat: withoutZero([
          contribution(engineSource, engineCombat),
          contribution('Yixuan \u00B7 Grandmaster of Mysticism', yixuan.coreActionDmg),
        ]),
        fully: [
          ...commonFully,
          contribution('Yixuan \u00B7 Grandmaster of Mysticism', yixuan.coreActionDmg),
        ],
      },
    },
  ]

  if (engineId === 'qingming') {
    rows.push({
      id: 'exUltimate',
      label: 'EX Special & Ultimate',
      combat: baseCombat + yixuan.coreActionDmg + 20,
      fully: baseFully + yixuan.coreActionDmg + 20,
      sources: {
        combat: [
          contribution(SOURCE_LABELS.qingming, engineCombat),
          contribution('Qingming Birdcage \u00B7 EX/Ultimate', 20),
          contribution('Yixuan \u00B7 Grandmaster of Mysticism', yixuan.coreActionDmg),
        ],
        fully: [
          ...commonFully,
          contribution('Yixuan \u00B7 Grandmaster of Mysticism', yixuan.coreActionDmg),
          contribution('Qingming Birdcage \u00B7 EX/Ultimate', 20),
        ],
      },
    })
  }

  return rows
}

function buildPartyEffects(luciaDarkbreaker: number): PartyEffect[] {
  const party = VERTICAL_VALUES.party
  return [
    { source: SOURCE_LABELS.dialynAbility, label: 'DMG Bonus', value: party.dialynDmg, unit: '%', recipient: 'All Agents' },
    { source: SOURCE_LABELS.dialynCore, label: 'Stun DMG Multiplier', value: party.dialynStunMultiplier, unit: '%', recipient: 'Enemy' },
    { source: SOURCE_LABELS.dialynCore, label: 'Stun duration', value: party.dialynStunExtension, unit: 's', recipient: 'Enemy' },
    { source: SOURCE_LABELS.luciaCore, label: 'Max HP', value: party.luciaCoreHp, unit: '%', recipient: 'All Agents' },
    { source: SOURCE_LABELS.dreamlit, label: 'Max HP', value: party.luciaEngineHp, unit: '%', recipient: 'All Agents' },
    { source: SOURCE_LABELS.darkbreaker, label: 'Sheer Force', value: luciaDarkbreaker, unit: '', recipient: 'Rupture / Stun' },
  ]
}

export function calculateParty(state: WorkbenchState): PartyResult | null {
  if (!isComplete(state)) return null

  const luciaInitialHp = calculateLuciaInitialHp()
  const luciaDarkbreaker = calculateLuciaDarkbreaker(luciaInitialHp)

  return {
    agents: [
      calculateYixuan(state, luciaDarkbreaker),
      calculateDialyn(),
      calculateLucia(luciaInitialHp, luciaDarkbreaker),
    ],
    actionModifiers: buildActionModifiers(state.engineId),
    partyEffects: buildPartyEffects(luciaDarkbreaker),
  }
}
