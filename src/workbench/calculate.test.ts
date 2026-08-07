import { describe, expect, it } from 'vitest'
import { calculateParty, type AgentResult, type Contribution, type PartyResult } from './calculate'
import {
  createPreparedState,
  isCompleteWorkbench,
  workbenchReducer,
  type Mindscape,
  type WorkbenchState,
} from './state'
import type {
  AgentId,
  DiscId,
  EngineId,
  MainSlot,
  MainStatId,
  Refinement,
  SubstatId,
} from './content'

function agent(result: PartyResult, id: AgentId): AgentResult {
  const found = result.agents.find((item) => item.agentId === id)
  if (!found) throw new Error(`Missing ${id} Result`)
  return found
}

function metric(result: AgentResult, id: string) {
  const found = result.metrics.find((item) => item.id === id)
  if (!found) throw new Error(`Missing ${id} metric`)
  return found
}

function action(result: AgentResult, id: string) {
  const found = result.actionModifiers.find((item) => item.id === id)
  if (!found) throw new Error(`Missing ${id} action`)
  return found
}

function sourceLabels(items: Contribution[]): string[] {
  return items.map((item) => [item.label, item.detail].filter(Boolean).join(' \u00B7 '))
}

function selectEngine(
  state: WorkbenchState,
  agentId: AgentId,
  engineId: EngineId,
): WorkbenchState {
  return workbenchReducer(state, { type: 'selectEngine', agentId, engineId })
}

function setRefinement(
  state: WorkbenchState,
  agentId: AgentId,
  refinement: Refinement,
): WorkbenchState {
  return workbenchReducer(state, { type: 'setRefinement', agentId, refinement })
}

function selectDisc(
  state: WorkbenchState,
  agentId: AgentId,
  piece: 'fourPiece' | 'twoPiece',
  discId: DiscId,
): WorkbenchState {
  return workbenchReducer(state, { type: 'selectDisc', agentId, piece, discId })
}

function selectMain(
  state: WorkbenchState,
  agentId: AgentId,
  slot: MainSlot,
  mainStatId: MainStatId,
): WorkbenchState {
  return workbenchReducer(state, {
    type: 'selectMainStat',
    agentId,
    slot,
    mainStatId,
  })
}

function setSubstat(
  state: WorkbenchState,
  agentId: AgentId,
  key: SubstatId,
  value: number,
): WorkbenchState {
  return workbenchReducer(state, { type: 'setSubstat', agentId, key, value })
}

function withMindscape(
  state: WorkbenchState,
  agentId: AgentId,
  mindscape: Mindscape,
): WorkbenchState {
  return {
    ...state,
    setups: {
      ...state.setups,
      [agentId]: {
        ...state.setups[agentId],
        mindscape,
      },
    },
  }
}

describe('calculateParty', () => {
  it('preserves the authored full-pool baseline and surface meanings', () => {
    const result = calculateParty(createPreparedState())!
    const yixuan = agent(result, 'yixuan')
    const dialyn = agent(result, 'dialyn')
    const lucia = agent(result, 'lucia')

    expect(metric(yixuan, 'maxHp').values).toEqual({
      initial: 16434.1,
      combat: 16434.1,
      fully: 19720.92,
    })
    expect(metric(yixuan, 'atk').values).toEqual({
      initial: 1931,
      combat: 1931,
      fully: 1931,
    })
    expect(metric(yixuan, 'sheerForce').values.initial).toBeCloseTo(2222.71)
    expect(metric(yixuan, 'sheerForce').values.fully).toBeCloseTo(3366.1847)
    expect(metric(yixuan, 'critRate').values).toEqual({
      initial: 51.4,
      combat: 71.4,
      fully: 83.4,
    })
    expect(metric(yixuan, 'critDmg').values).toEqual({
      initial: 50,
      combat: 50,
      fully: 180,
    })
    expect(metric(yixuan, 'dmgBonus').values).toEqual({
      initial: 30,
      combat: 46,
      fully: 149,
    })
    expect(metric(yixuan, 'sheerDmgBonus').values).toEqual({
      initial: 0,
      combat: 0,
      fully: 10,
    })

    expect(metric(dialyn, 'critRate').values.initial).toBeCloseTo(75.4)
    expect(metric(dialyn, 'impact').values).toEqual({
      initial: 110,
      combat: 160.8,
      fully: 160.8,
    })
    expect(metric(dialyn, 'energyRegen').values).toEqual({
      initial: 1.92,
      combat: 3.42,
      fully: 3.42,
    })
    expect(metric(dialyn, 'dazeBonus').values).toEqual({
      initial: 6,
      combat: 6,
      fully: 33,
    })

    expect(metric(lucia, 'maxHp').values.initial).toBeCloseTo(21697.1)
    expect(metric(lucia, 'energyRegen').values).toEqual({
      initial: 1.56,
      combat: 1.96,
      fully: 1.96,
    })
  })

  it('recalculates Lucia Slot 6 Energy Regen and downstream Sheer Force', () => {
    const result = calculateParty(selectMain(
      createPreparedState(),
      'lucia',
      'slot6',
      'energyRegenPct',
    ))!
    const lucia = agent(result, 'lucia')
    const yixuan = agent(result, 'yixuan')

    expect(metric(lucia, 'maxHp').values.initial).toBeCloseTo(19154)
    const energyRegen = metric(lucia, 'energyRegen')
    expect(energyRegen.values.initial).toBeCloseTo(2.34)
    expect(energyRegen.values.combat).toBeCloseTo(2.74)
    expect(energyRegen.values.fully).toBeCloseTo(2.74)
    expect(metric(lucia, 'energyRegen').breakdown.initial).toContainEqual(
      expect.objectContaining({
        label: 'Drive Disc \u00B7 Slot 6',
        amount: 0.78,
        display: { value: 60, unit: '%', decimals: 0 },
      }),
    )
    expect(metric(lucia, 'maxHp').gauge).toMatchObject({
      current: 19154,
      outputValue: 720.698,
    })
    expect(metric(yixuan, 'sheerForce').values.fully).toBeCloseTo(3272.09)
  })

  it('keeps advanced stats in Initial and W-Engine passives after Initial', () => {
    const result = calculateParty(createPreparedState())!
    const yixuan = agent(result, 'yixuan')
    const dialyn = agent(result, 'dialyn')
    const lucia = agent(result, 'lucia')

    expect(sourceLabels(metric(yixuan, 'maxHp').breakdown.initial))
      .toContain('Qingming Birdcage \u00B7 W1')
    expect(sourceLabels(metric(yixuan, 'critRate').breakdown.initial))
      .not.toContain('Qingming Birdcage \u00B7 W1')
    expect(metric(yixuan, 'critRate').breakdown.combat).toContainEqual(
      expect.objectContaining({ label: 'Qingming Birdcage', detail: 'W1', amount: 20 }),
    )

    expect(sourceLabels(metric(dialyn, 'critRate').breakdown.initial))
      .toContain('Yesterday Calls \u00B7 W1')
    expect(sourceLabels(metric(dialyn, 'energyRegen').breakdown.initial))
      .not.toContain('Yesterday Calls \u00B7 W1')
    expect(metric(dialyn, 'energyRegen').breakdown.combat).toContainEqual(
      expect.objectContaining({ label: 'Yesterday Calls', detail: 'W1', amount: 1.5 }),
    )

    expect(sourceLabels(metric(lucia, 'maxHp').breakdown.initial))
      .toContain('Dreamlit Hearth \u00B7 W1')
    expect(sourceLabels(metric(lucia, 'energyRegen').breakdown.initial))
      .not.toContain('Dreamlit Hearth \u00B7 W1')
  })

  it('keeps a capped Combat CRIT source at its earliest surface without duplicating it', () => {
    const state = setSubstat(createPreparedState(), 'yixuan', 'critRate', 10)
    const yixuan = agent(calculateParty(state)!, 'yixuan')
    const critRate = metric(yixuan, 'critRate')

    expect(critRate.values.initial).toBeCloseTo(75.4)
    expect(critRate.values.combat).toBeCloseTo(95.4)
    expect(critRate.values.fully).toBe(100)
    expect(critRate.breakdown.combat).toContainEqual(expect.objectContaining({
      label: 'Qingming Birdcage',
      detail: 'W1',
      amount: 20,
      ownerAgentId: 'yixuan',
      locus: 'w-engine',
    }))
    const fullyCapAdjustment = critRate.breakdown.fully.find(
      ({ label }) => label === 'Displayed CRIT Rate cap',
    )!
    expect(fullyCapAdjustment).toMatchObject({
      ownerAgentId: 'yixuan',
      locus: 'calculation',
    })
    expect(fullyCapAdjustment.amount).toBeCloseTo(-7.4)
    expect(critRate.breakdown.fully).not.toContainEqual(expect.objectContaining({
      label: 'Qingming Birdcage',
    }))
    expect(critRate.breakdown.fully).toContainEqual(expect.objectContaining({
      label: 'Yunkui Tales',
      amount: 12,
    }))
    expect(critRate.breakdown.fully.reduce((total, item) => total + item.amount, 0))
      .toBeCloseTo(critRate.values.fully - critRate.values.combat)
  })

  it('recalculates every retained Yixuan W-Engine package without changing downstream candidates', () => {
    const prepared = createPreparedState()

    const cauldron = agent(calculateParty(selectEngine(
      prepared,
      'yixuan',
      'cauldron',
    ))!, 'yixuan')
    expect(metric(cauldron, 'maxHp').values.initial).toBeCloseTo(16015.45)
    expect(metric(cauldron, 'critRate').values.fully).toBeCloseTo(73.8)
    expect(metric(cauldron, 'dmgBonus').values.fully).toBeCloseTo(152.2)

    const radiowave = agent(calculateParty(selectEngine(
      prepared,
      'yixuan',
      'radiowave',
    ))!, 'yixuan')
    expect(metric(radiowave, 'sheerForce').values.fully).toBeCloseTo(3655.2467)
    expect(metric(radiowave, 'sheerForce').breakdown.fully).toContainEqual(
      expect.objectContaining({
        label: 'Radiowave Journey',
        detail: 'W5',
        amount: 384,
        locus: 'w-engine',
      }),
    )

    const puzzle = agent(calculateParty(selectEngine(
      prepared,
      'yixuan',
      'puzzleSphere',
    ))!, 'yixuan')
    expect(metric(puzzle, 'atk').values.initial).toBeCloseTo(2148.5)
    expect(metric(puzzle, 'atk').breakdown.initial).toContainEqual(
      expect.objectContaining({
        label: 'Puzzle Sphere',
        detail: 'W5',
        display: { value: 25, unit: '%', decimals: 0 },
      }),
    )
    expect(metric(puzzle, 'critDmg').values.fully).toBeCloseTo(205.6)
    expect(action(puzzle, 'exSpecialStunned').values.fully).toBeCloseTo(255)
  })

  it('uses editable refinement values and current refinement source identity', () => {
    const changed = setRefinement(createPreparedState(), 'yixuan', 2)
    const yixuan = agent(calculateParty(changed)!, 'yixuan')

    expect(metric(yixuan, 'critRate').values.combat).toBeCloseTo(74.4)
    expect(metric(yixuan, 'dmgBonus').values.combat).toBeCloseTo(48.4)
    expect(metric(yixuan, 'critRate').breakdown.combat).toContainEqual(
      expect.objectContaining({ label: 'Qingming Birdcage', detail: 'W2', amount: 23 }),
    )
    expect(action(yixuan, 'engineSheerActions').values.combat).toBeCloseTo(23)
  })

  it('recalculates Yixuan Disc and main-stat alternatives as direct setup edits', () => {
    let state = createPreparedState()
    state = selectDisc(state, 'yixuan', 'twoPiece', 'branchAndBlade')
    state = selectMain(state, 'yixuan', 'slot4', 'critDmg')
    state = selectMain(state, 'yixuan', 'slot5', 'hpPct')
    const yixuan = agent(calculateParty(state)!, 'yixuan')

    expect(metric(yixuan, 'critRate').values.initial).toBeCloseTo(19.4)
    expect(metric(yixuan, 'critDmg').values.initial).toBeCloseTo(114)
    expect(metric(yixuan, 'maxHp').values.initial).toBeCloseTo(18946)
    expect(metric(yixuan, 'dmgBonus').values.initial).toBe(0)
    expect(sourceLabels(metric(yixuan, 'critDmg').breakdown.initial))
      .toContain('Branch & Blade Song \u00B7 2-piece')
    expect(sourceLabels(metric(yixuan, 'dmgBonus').breakdown.initial))
      .not.toContain('Drive Disc \u00B7 Slot 5')
  })

  it('keeps Dialyn Slot 5 complete without creating a Party Result consequence', () => {
    const prepared = createPreparedState()
    const penRatio = selectMain(prepared, 'dialyn', 'slot5', 'penRatio')

    expect(isCompleteWorkbench(penRatio)).toBe(true)
    expect(calculateParty(penRatio)).toEqual(calculateParty(prepared))
  })

  it('distinguishes all Dialyn W-Engine operations and the two-piece tradeoff', () => {
    const prepared = createPreparedState()

    const chief = agent(calculateParty(selectEngine(
      prepared,
      'dialyn',
      'chiefSidekick',
    ))!, 'dialyn')
    expect(metric(chief, 'impact').values).toEqual({
      initial: 110,
      combat: 190.8,
      fully: 190.8,
    })
    expect(metric(chief, 'energyRegen').values.combat).toBeCloseTo(2.32)
    expect(metric(chief, 'dazeBonus').values.fully).toBe(6)

    const hellfire = agent(calculateParty(selectEngine(
      prepared,
      'dialyn',
      'hellfireGears',
    ))!, 'dialyn')
    expect(metric(hellfire, 'critRate').values.initial).toBeCloseTo(51.4)
    expect(metric(hellfire, 'impact').values.initial).toBeCloseTo(129.8)
    expect(metric(hellfire, 'impact').values.combat).toBeCloseTo(132.6)
    expect(metric(hellfire, 'impact').values.fully).toBeCloseTo(154.6)
    expect(metric(hellfire, 'impact').breakdown.fully).toContainEqual(
      expect.objectContaining({
        label: 'Hellfire Gears',
        detail: 'W1',
        amount: 22,
        display: { value: 20, unit: '%', decimals: 0 },
      }),
    )

    const steam = agent(calculateParty(selectEngine(
      prepared,
      'dialyn',
      'steamOven',
    ))!, 'dialyn')
    expect(metric(steam, 'energyRegen').values.initial).toBeCloseTo(2.52)
    expect(metric(steam, 'impact').values.fully).toBeCloseTo(140.96)
    const steamImpactContribution = metric(steam, 'impact').breakdown.fully[0]
    expect(steamImpactContribution).toMatchObject({
      label: 'Steam Oven',
      detail: 'W5',
      display: { value: 25.6, unit: '%', decimals: 1 },
    })
    expect(steamImpactContribution.amount).toBeCloseTo(28.16)

    const swing = agent(calculateParty(selectDisc(
      prepared,
      'dialyn',
      'twoPiece',
      'swingJazz',
    ))!, 'dialyn')
    expect(metric(swing, 'critRate').values.initial).toBeCloseTo(67.4)
    expect(metric(swing, 'impact').values.combat).toBeCloseTo(144.8)
    expect(metric(swing, 'energyRegen').values.combat).toBeCloseTo(3.66)
  })

  it('keeps Energy Regen percentage sources separate from later per-second operations', () => {
    const dialyn = agent(calculateParty(selectDisc(
      createPreparedState(),
      'dialyn',
      'twoPiece',
      'swingJazz',
    ))!, 'dialyn')
    const dialynEnergy = metric(dialyn, 'energyRegen')

    expect(dialynEnergy.values).toEqual({ initial: 2.16, combat: 3.66, fully: 3.66 })
    expect(dialynEnergy.breakdown.initial).toContainEqual(expect.objectContaining({
      label: 'Swing Jazz or Moonlight Lullaby',
      detail: '2-piece',
      display: { value: 20, unit: '%', decimals: 0 },
    }))
    expect(dialynEnergy.breakdown.combat).toContainEqual(expect.objectContaining({
      label: 'Yesterday Calls',
      detail: 'W1',
      display: { value: 1.5, unit: '/s', decimals: 2 },
    }))
    expect(dialynEnergy.breakdown.fully).toEqual([])

    const lucia = agent(calculateParty(selectEngine(
      createPreparedState(),
      'lucia',
      'thoughtbop',
    ))!, 'lucia')
    const luciaEnergy = metric(lucia, 'energyRegen')
    expect(luciaEnergy.values.initial).toBeCloseTo(2.34)
    expect(luciaEnergy.values.combat).toBeCloseTo(2.94)
    expect(luciaEnergy.values.fully).toBeCloseTo(2.94)
    expect(luciaEnergy.breakdown.initial).toContainEqual(expect.objectContaining({
      label: 'Thoughtbop',
      detail: 'W1',
      display: { value: 60, unit: '%', decimals: 0 },
    }))
    expect(luciaEnergy.breakdown.combat).toContainEqual(expect.objectContaining({
      label: 'Thoughtbop',
      detail: 'W1',
      display: { value: 0.6, unit: '/s', decimals: 2 },
    }))
  })

  it('keeps King of the Summit conditional CRIT DMG separate from its Setup total', () => {
    let belowThreshold = selectEngine(createPreparedState(), 'dialyn', 'hellfireGears')
    belowThreshold = selectDisc(belowThreshold, 'dialyn', 'twoPiece', 'swingJazz')
    const below = agent(calculateParty(belowThreshold)!, 'yixuan')

    expect(metric(below, 'critDmg').breakdown.fully).toContainEqual(
      expect.objectContaining({
        label: 'King of the Summit',
        detail: '4-piece',
        amount: 15,
        ownerAgentId: 'dialyn',
      }),
    )

    const atThreshold = setSubstat(belowThreshold, 'dialyn', 'critRate', 3)
    const at = agent(calculateParty(atThreshold)!, 'yixuan')
    expect(metric(at, 'critDmg').breakdown.fully).toContainEqual(
      expect.objectContaining({
        label: 'King of the Summit',
        detail: '4-piece',
        amount: 30,
        ownerAgentId: 'dialyn',
      }),
    )
  })

  it('uses capped Dialyn Initial CRIT for Impact, King, and later party CRIT', () => {
    let state = setSubstat(createPreparedState(), 'dialyn', 'critRate', 36)
    state = selectEngine(state, 'lucia', 'unfetteredGameBall')
    const result = calculateParty(state)!
    const dialynCritRate = metric(agent(result, 'dialyn'), 'critRate')

    expect(dialynCritRate.values).toEqual({ initial: 100, combat: 100, fully: 100 })
    expect(dialynCritRate.gauge).toMatchObject({
      current: 100,
      outputValue: 100,
    })
    const initialCapAdjustment = dialynCritRate.breakdown.initial.find(
      ({ label }) => label === 'Displayed CRIT Rate cap',
    )!
    expect(initialCapAdjustment).toMatchObject({
      ownerAgentId: 'dialyn',
      locus: 'calculation',
    })
    expect(initialCapAdjustment.amount).toBeCloseTo(-61.8)
    expect(dialynCritRate.breakdown.fully).toEqual([
      expect.objectContaining({
        label: 'Unfettered Game Ball',
        detail: 'W5',
        ownerAgentId: 'lucia',
        amount: 20,
      }),
      expect.objectContaining({
        label: 'Displayed CRIT Rate cap',
        ownerAgentId: 'dialyn',
        locus: 'calculation',
        amount: -20,
      }),
    ])
    expect(metric(agent(result, 'yixuan'), 'critDmg').breakdown.fully)
      .toContainEqual(expect.objectContaining({
        label: 'King of the Summit',
        amount: 30,
        ownerAgentId: 'dialyn',
      }))
  })

  it('retains partial and non-limited Lucia packages for distinct visible operations', () => {
    const prepared = createPreparedState()

    const thought = calculateParty(selectEngine(
      prepared,
      'lucia',
      'thoughtbop',
    ))!
    expect(metric(agent(thought, 'lucia'), 'maxHp').values.initial).toBeCloseTo(19154)
    expect(metric(agent(thought, 'lucia'), 'energyRegen').values.initial).toBeCloseTo(2.34)
    expect(metric(agent(thought, 'lucia'), 'energyRegen').values.combat).toBeCloseTo(2.94)
    expect(metric(agent(thought, 'lucia'), 'energyRegen').values.fully).toBeCloseTo(2.94)
    expect(metric(agent(thought, 'yixuan'), 'dmgBonus').values.fully).toBeCloseTo(124)

    const weeping = calculateParty(selectEngine(
      prepared,
      'lucia',
      'weepingCradle',
    ))!
    expect(metric(agent(weeping, 'lucia'), 'energyRegen').values).toEqual({
      initial: 1.56,
      combat: 2.16,
      fully: 2.16,
    })
    expect(metric(agent(weeping, 'yixuan'), 'dmgBonus').values.fully).toBeCloseTo(144.2)
    expect(metric(agent(weeping, 'yixuan'), 'dmgBonus').breakdown.fully)
      .toContainEqual(expect.objectContaining({
        label: 'Weeping Cradle',
        detail: 'W1',
        amount: 20.2,
        ownerAgentId: 'lucia',
      }))

    const kaboom = calculateParty(selectEngine(
      prepared,
      'lucia',
      'kaboom',
    ))!
    expect(metric(agent(kaboom, 'yixuan'), 'atk').values.fully).toBeCloseTo(2189.4)
    expect(metric(agent(kaboom, 'yixuan'), 'atk').breakdown.fully).toContainEqual(
      expect.objectContaining({
        label: 'Kaboom the Cannon',
        detail: 'W5',
        amount: 258.4,
        display: { value: 16, unit: '%', decimals: 0 },
      }),
    )
    expect(metric(agent(kaboom, 'lucia'), 'energyRegen').values.initial).toBeCloseTo(2.21)

    const gameBall = calculateParty(selectEngine(
      prepared,
      'lucia',
      'unfetteredGameBall',
    ))!
    expect(metric(agent(gameBall, 'yixuan'), 'critRate').values.fully).toBe(100)
    expect(metric(agent(gameBall, 'dialyn'), 'critRate').values.fully).toBeCloseTo(95.4)
    expect(agent(gameBall, 'lucia').metrics.some(({ id }) => id === 'critRate')).toBe(false)
  })

  it('keeps later Max HP percentages source-stated and outside Darkbreaker basis', () => {
    const result = calculateParty(createPreparedState())!
    const yixuanHp = metric(agent(result, 'yixuan'), 'maxHp')
    const luciaHp = metric(agent(result, 'lucia'), 'maxHp')

    expect(yixuanHp.breakdown.fully).toEqual([
      expect.objectContaining({
        label: 'Core Passive',
        ownerAgentId: 'lucia',
        locus: 'core',
        amount: 821.705,
        display: { value: 5, unit: '%', decimals: 0 },
      }),
      expect.objectContaining({
        label: 'Dreamlit Hearth',
        detail: 'W1',
        ownerAgentId: 'lucia',
        amount: 2465.115,
        display: { value: 15, unit: '%', decimals: 0 },
      }),
    ])
    expect(luciaHp.breakdown.fully).toEqual([
      expect.objectContaining({
        label: 'Core Passive',
        ownerAgentId: 'lucia',
        locus: 'core',
        amount: 1084.855,
        display: { value: 5, unit: '%', decimals: 0 },
      }),
      expect.objectContaining({
        label: 'Dreamlit Hearth',
        detail: 'W1',
        ownerAgentId: 'lucia',
        amount: 3254.565,
        display: { value: 15, unit: '%', decimals: 0 },
      }),
    ])
    expect(luciaHp.gauge).toMatchObject({
      basisLabel: 'Initial Max HP',
      current: 21697.1,
      outputValue: 814.7927,
    })
  })

  it('keeps fixed Base ATK and fixed Disc values out of displayed source rows', () => {
    const result = calculateParty(createPreparedState())!
    const serialized = JSON.stringify(result)

    expect(metric(agent(result, 'yixuan'), 'atk').breakdown.initial).toEqual([])
    expect(serialized).not.toMatch(/Agent base|Drive Disc \u00B7 Slot [123]|Base ATK/i)
    expect(metric(agent(result, 'lucia'), 'energyRegen').breakdown.initial)
      .toContainEqual(expect.objectContaining({
        label: 'Moonlight Lullaby',
        detail: '4-piece',
        display: { value: 20, unit: '%', decimals: 0 },
      }))
  })

  it('updates current source identity after equipment and refinement edits', () => {
    let state = selectEngine(createPreparedState(), 'dialyn', 'hellfireGears')
    state = setRefinement(state, 'dialyn', 3)
    const dialyn = agent(calculateParty(state)!, 'dialyn')
    const serialized = JSON.stringify(dialyn)

    expect(serialized).toContain('Hellfire Gears')
    expect(serialized).toContain('W3')
    expect(serialized).not.toContain('Yesterday Calls')
    expect(metric(dialyn, 'impact').breakdown.initial).toContainEqual(
      expect.objectContaining({
        label: 'Hellfire Gears',
        detail: 'W3',
        locus: 'w-engine',
      }),
    )
  })

  it("recalculates each Agent's offered substat inputs", () => {
    let state = createPreparedState()
    state = setSubstat(state, 'yixuan', 'hpPct', 1)
    state = setSubstat(state, 'dialyn', 'critRate', 1)
    state = setSubstat(state, 'lucia', 'hpPct', 1)
    state = setSubstat(state, 'lucia', 'hpFlat', 1)
    const result = calculateParty(state)!

    expect(metric(agent(result, 'yixuan'), 'maxHp').values.initial).toBeCloseTo(16685.29)
    expect(metric(agent(result, 'dialyn'), 'critRate').values.initial).toBeCloseTo(77.8)
    expect(metric(agent(result, 'lucia'), 'maxHp').values.initial).toBeCloseTo(22063.41)
    expect(sourceLabels(metric(agent(result, 'lucia'), 'maxHp').breakdown.initial))
      .toEqual(expect.arrayContaining([
        'Effective substat hits \u00B7 HP%',
        'Effective substat hits \u00B7 HP',
      ]))
  })

  it('applies Yixuan Mindscapes cumulatively to exact current Result consumers', () => {
    const prepared = createPreparedState()
    const at = (mindscape: Mindscape) => calculateParty(
      withMindscape(prepared, 'yixuan', mindscape),
    )!
    const m0 = agent(at(0), 'yixuan')
    const m1 = agent(at(1), 'yixuan')
    const m2Result = at(2)
    const m3 = agent(at(3), 'yixuan')
    const m4 = agent(at(4), 'yixuan')
    const m5 = agent(at(5), 'yixuan')
    const m6 = agent(at(6), 'yixuan')

    expect(metric(m1, 'critRate').values.initial)
      .toBe(metric(m0, 'critRate').values.initial)
    expect(metric(m1, 'critRate').values.combat
      - metric(m0, 'critRate').values.combat).toBeCloseTo(10)
    expect(metric(m1, 'critRate').values.fully
      - metric(m0, 'critRate').values.fully).toBeCloseTo(10)
    expect(sourceLabels(metric(m1, 'critRate').breakdown.combat))
      .toContain('Mindscape \u00B7 M1')

    const m2Operation = agent(m2Result, 'dialyn').operations[0]
    expect(agent(at(0), 'dialyn').operations).toHaveLength(1)
    expect(agent(m2Result, 'dialyn').operations).toHaveLength(1)
    expect(m2Operation).toMatchObject({
      id: 'stunDuration',
      value: 3,
      source: {
        label: 'Mindscape',
        detail: 'M2',
        ownerAgentId: 'yixuan',
        locus: 'mindscape',
      },
    })
    expect(m3.actionModifiers.find(({ id }) => id === 'mindscapeCloudShaper'))
      .toBeUndefined()
    expect(action(m4, 'mindscapeCloudShaper').values.fully).toBeCloseTo(299)
    expect(action(m4, 'mindscapeCloudShaper').breakdown.fully)
      .toContainEqual(expect.objectContaining({
        label: 'Mindscape',
        detail: 'M4 \u00B7 30% x 2 stacks',
        amount: 60,
      }))
    expect(action(m5, 'mindscapeCloudShaper').values)
      .toEqual(action(m4, 'mindscapeCloudShaper').values)
    expect(action(m4, 'coreActions').values)
      .toEqual(action(m3, 'coreActions').values)
    expect(action(m4, 'exSpecialStunned').values)
      .toEqual(action(m3, 'exSpecialStunned').values)
    expect(metric(m6, 'sheerDmgBonus').values.fully).toBe(30)
    expect(metric(m6, 'sheerDmgBonus').breakdown.fully)
      .toContainEqual(expect.objectContaining({
        label: 'Mindscape',
        detail: 'M6 \u00B7 during Meditation',
        amount: 20,
      }))
  })

  it('applies Dialyn M2 only to the current Yixuan recipient', () => {
    const prepared = createPreparedState()
    const m1 = calculateParty(withMindscape(prepared, 'dialyn', 1))!
    const m2 = calculateParty(withMindscape(prepared, 'dialyn', 2))!
    const yixuanM1 = agent(m1, 'yixuan')
    const yixuanM2 = agent(m2, 'yixuan')

    expect(metric(yixuanM2, 'dmgBonus').values.fully
      - metric(yixuanM1, 'dmgBonus').values.fully).toBeCloseTo(15)
    expect(metric(yixuanM2, 'stunDmgMultiplier').values.fully).toBe(50)
    expect(metric(yixuanM2, 'dmgBonus').breakdown.fully)
      .toContainEqual(expect.objectContaining({
        label: 'Mindscape',
        detail: 'M2 \u00B7 against Malicious Complaint',
        amount: 15,
        ownerAgentId: 'dialyn',
      }))
    expect(metric(yixuanM2, 'stunDmgMultiplier').breakdown.fully)
      .toContainEqual(expect.objectContaining({
        label: 'Mindscape',
        detail: 'M2',
        amount: 20,
        ownerAgentId: 'dialyn',
      }))
    expect(agent(m2, 'dialyn').metrics).toEqual(agent(m1, 'dialyn').metrics)

    for (const mindscape of [3, 4, 5, 6] as Mindscape[]) {
      const current = agent(calculateParty(
        withMindscape(prepared, 'dialyn', mindscape),
      )!, 'yixuan')
      expect(metric(current, 'dmgBonus').values.fully)
        .toBe(metric(yixuanM2, 'dmgBonus').values.fully)
    }
  })

  it('uses Lucia level 12, 14, and 16 Darkbreaker tiers cumulatively', () => {
    const prepared = createPreparedState()
    const at = (mindscape: Mindscape) => calculateParty(
      withMindscape(prepared, 'lucia', mindscape),
    )!
    const m0 = at(0)
    const m1 = at(1)
    const m2 = at(2)
    const m3 = at(3)
    const m4 = at(4)
    const m5 = at(5)
    const m6 = at(6)

    const yixuanM0 = agent(m0, 'yixuan')
    expect(metric(yixuanM0, 'sheerForce').values.fully).toBeCloseTo(3366.1847)
    expect(metric(agent(m1, 'yixuan'), 'sheerForce').values)
      .toEqual(metric(yixuanM0, 'sheerForce').values)
    expect(metric(agent(m2, 'yixuan'), 'sheerDmgBonus').values.fully).toBe(25)

    const yixuanM3 = agent(m3, 'yixuan')
    const yixuanM5 = agent(m5, 'yixuan')
    expect(metric(yixuanM3, 'sheerForce').values.initial)
      .toBe(metric(yixuanM0, 'sheerForce').values.initial)
    expect(metric(yixuanM3, 'sheerForce').values.combat)
      .toBe(metric(yixuanM0, 'sheerForce').values.combat)
    expect(metric(yixuanM3, 'sheerForce').values.fully).toBeCloseTo(3409.5789)
    expect(metric(yixuanM5, 'sheerForce').values.fully).toBeCloseTo(3452.9731)
    expect(metric(agent(m4, 'yixuan'), 'sheerForce').values)
      .toEqual(metric(yixuanM3, 'sheerForce').values)
    expect(metric(agent(m6, 'yixuan'), 'sheerForce').values)
      .toEqual(metric(yixuanM5, 'sheerForce').values)

    const gauge0 = metric(agent(m0, 'lucia'), 'maxHp').gauge!
    const gauge3 = metric(agent(m3, 'lucia'), 'maxHp').gauge!
    const gauge5 = metric(agent(m5, 'lucia'), 'maxHp').gauge!
    expect(gauge0).toMatchObject({
      current: 21697.1,
      cap: 24000,
      outputCap: 900,
      source: { label: 'EX Special Attack', locus: 'ex-special' },
    })
    expect(gauge0.outputValue).toBeCloseTo(814.7927)
    expect(gauge3).toMatchObject({
      cap: 24000,
      outputCap: 948,
      source: {
        label: 'EX Special Attack',
        detail: 'M3 tier',
        locus: 'mindscape',
      },
    })
    expect(gauge3.outputValue).toBeCloseTo(858.1869)
    expect(gauge5).toMatchObject({
      cap: 24000,
      outputCap: 996,
      source: {
        label: 'EX Special Attack',
        detail: 'M5 tier',
        locus: 'mindscape',
      },
    })
    expect(gauge5.outputValue).toBeCloseTo(901.5811)
    expect(metric(yixuanM5, 'sheerDmgBonus').breakdown.fully)
      .toContainEqual(expect.objectContaining({
        label: 'Mindscape',
        detail: 'M2 \u00B7 Darkbreaker + Wellspring',
        amount: 15,
        ownerAgentId: 'lucia',
      }))
  })

  it('clamps Lucia Darkbreaker output to completed skill-tier caps', () => {
    const prepared = setSubstat(createPreparedState(), 'lucia', 'hpPct', 12)

    for (const [mindscape, outputCap] of [
      [0, 900],
      [3, 948],
      [5, 996],
    ] as const) {
      const result = calculateParty(withMindscape(prepared, 'lucia', mindscape))!
      const gauge = metric(agent(result, 'lucia'), 'maxHp').gauge!
      expect(gauge.current).toBeGreaterThanOrEqual(24000)
      expect(gauge.outputValue).toBe(outputCap)
      expect(gauge.outputCap).toBe(outputCap)
    }
  })

  it('applies Dialyn and Lucia M1 RES Ignore cumulatively to Yixuan', () => {
    const prepared = createPreparedState()
    const dialynM1 = agent(calculateParty(withMindscape(prepared, 'dialyn', 1))!, 'yixuan')
    const luciaM1 = agent(calculateParty(withMindscape(prepared, 'lucia', 1))!, 'yixuan')
    const bothM1 = agent(calculateParty(
      withMindscape(withMindscape(prepared, 'dialyn', 1), 'lucia', 1),
    )!, 'yixuan')

    expect(metric(agent(calculateParty(prepared)!, 'yixuan'), 'resIgnore').values)
      .toEqual({ initial: 0, combat: 0, fully: 0 })
    expect(metric(dialynM1, 'resIgnore').values.fully).toBe(15)
    expect(metric(luciaM1, 'resIgnore').values.fully).toBe(18)
    expect(metric(bothM1, 'resIgnore').values.fully).toBe(33)
    expect(metric(bothM1, 'resIgnore').breakdown.fully).toEqual(expect.arrayContaining([
      expect.objectContaining({
        detail: 'M1 \u00b7 Overwhelmingly Positive', amount: 15, ownerAgentId: 'dialyn',
      }),
      expect.objectContaining({
        detail: "M1 \u00b7 Dreamer's Nursery Rhyme", amount: 18, ownerAgentId: 'lucia',
      }),
    ]))
    expect(metric(agent(calculateParty(withMindscape(
      withMindscape(prepared, 'dialyn', 1), 'dialyn', 0,
    ))!, 'yixuan'), 'resIgnore').values.fully).toBe(0)
  })

  it('adds Yixuan M2 Ether RES Ignore only to EX Special Attack and Ultimate', () => {
    const prepared = withMindscape(withMindscape(createPreparedState(), 'dialyn', 1), 'lucia', 1)
    const m1 = agent(calculateParty(withMindscape(prepared, 'yixuan', 1))!, 'yixuan')
    const m2 = agent(calculateParty(withMindscape(prepared, 'yixuan', 2))!, 'yixuan')

    expect(m1.actionModifiers.find(({ id }) => id === 'mindscapeEtherResIgnore')).toBeUndefined()
    expect(action(m2, 'mindscapeEtherResIgnore')).toMatchObject({
      actions: ['EX Special Attack', 'Ultimate'],
      metricId: 'resIgnore',
      values: { initial: 0, combat: 0, fully: 48 },
    })
    expect(action(m2, 'mindscapeEtherResIgnore').breakdown.fully).toContainEqual(
      expect.objectContaining({
        detail: 'M2 \u00b7 Ether RES Ignore', amount: 15, ownerAgentId: 'yixuan',
      }),
    )
  })

  it('returns no Result when any required setup selection is incomplete', () => {
    const prepared = createPreparedState()
    const missingEngine: WorkbenchState = {
      ...prepared,
      setups: {
        ...prepared.setups,
        yixuan: { ...prepared.setups.yixuan, engineId: null },
      },
    }
    const missingMain: WorkbenchState = {
      ...prepared,
      setups: {
        ...prepared.setups,
        dialyn: {
          ...prepared.setups.dialyn,
          mains: { ...prepared.setups.dialyn.mains, slot6: null },
        },
      },
    }
    const missingRefinement: WorkbenchState = {
      ...prepared,
      setups: {
        ...prepared.setups,
        yixuan: { ...prepared.setups.yixuan, refinement: null },
      },
    }
    const missingFourPiece: WorkbenchState = {
      ...prepared,
      setups: {
        ...prepared.setups,
        dialyn: { ...prepared.setups.dialyn, fourPieceId: null },
      },
    }
    const missingTwoPiece: WorkbenchState = {
      ...prepared,
      setups: {
        ...prepared.setups,
        lucia: { ...prepared.setups.lucia, twoPieceId: null },
      },
    }
    const missingCount: WorkbenchState = {
      ...prepared,
      setups: {
        ...prepared.setups,
        lucia: {
          ...prepared.setups.lucia,
          substats: { ...prepared.setups.lucia.substats, hpFlat: Number.NaN },
        },
      },
    }

    expect(calculateParty(missingEngine)).toBeNull()
    expect(calculateParty(missingRefinement)).toBeNull()
    expect(calculateParty(missingFourPiece)).toBeNull()
    expect(calculateParty(missingTwoPiece)).toBeNull()
    expect(calculateParty(missingMain)).toBeNull()
    expect(calculateParty(missingCount)).toBeNull()
  })
})
