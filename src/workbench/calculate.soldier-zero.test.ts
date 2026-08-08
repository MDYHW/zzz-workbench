import { describe, expect, it } from 'vitest'
import { calculateParty } from './calculate'
import { createPreparedState, workbenchReducer } from './state'
import { W_ENGINES } from './content'
import { ENGINE_IDS_BY_AGENT_AND_POOL, MAIN_STAT_IDS_BY_AGENT_AND_SLOT, SUBSTAT_CHOICES_BY_AGENT } from './content'

const resultAgent = (result: NonNullable<ReturnType<typeof calculateParty>>, id: string) =>
  result.agents.find((agent) => agent.agentId === id)!
const resultMetric = (agent: ReturnType<typeof resultAgent>, id: string) =>
  agent.metrics.find((metric) => metric.id === id)!

describe('soldier zero vertical', () => {
  it('prepares the authored second trio and derives Anby Aftershock only after delivered CRIT DMG', () => {
    const state = createPreparedState({}, ['anbySoldier0', 'trigger', 'astraYao'], 0)
    expect(state.slots.map(({ setup }) => setup.engineId)).toEqual(['severedInnocence', 'spectralGaze', 'elegantVanity'])
    const result = calculateParty(state)!
    const anby = resultAgent(result, 'anbySoldier0')
    const aftershock = anby.actionModifiers.find(({ id }) => id === 'anbyAftershock')!
    expect(resultMetric(anby, 'dmgBonus').values.fully).toBe(139)
    expect(resultMetric(anby, 'dmgBonus').breakdown.initial)
      .toContainEqual(expect.objectContaining({ label: 'Drive Disc · Slot 5', amount: 30 }))
    expect(resultMetric(anby, 'critDmg').values).toEqual({ initial: 98, combat: 128, fully: 213 })
    expect(resultMetric(anby, 'critRate').values).toEqual({ initial: 51.4, combat: 51.4, fully: 73.4 })
    expect(aftershock).toMatchObject({
      tag: 'aftershock', actions: [], values: { initial: 45, combat: 45, fully: 204 },
    })
    const aftershockCrit = anby.actionModifiers.find(({ id }) => id === 'anbyAftershockCritDmg')!
    expect(aftershockCrit.values.fully).toBeCloseTo(287.55)
    expect(aftershockCrit.breakdown.fully).toContainEqual(expect.objectContaining({ label: 'Core Passive', detail: '35% of Fully Enabled CRIT DMG', amount: 74.55 }))
    const trigger = resultAgent(result, 'trigger')
    expect(resultMetric(trigger, 'critDmg').values.fully).toBe(105)
    expect(trigger.actionModifiers.find(({ id }) => id === 'triggerAftershockCritDmg')).toMatchObject({
      tag: 'aftershock', actions: [], values: { fully: 179.55 },
    })
    expect(trigger.actionModifiers.find(({ id }) => id === 'triggerAftershockCritDmg')?.breakdown.fully)
      .toContainEqual(expect.objectContaining({ label: 'Core Passive', detail: '35% of Fully Enabled CRIT DMG', amount: 74.55 }))
  })

  it('uses cumulative Mindscapes and target-only preparation for Astra M2', () => {
    let state = createPreparedState({}, ['anbySoldier0', 'trigger', 'astraYao'], 0)
    state = workbenchReducer(state, { type: 'setMindscape', slot: 2, mindscape: 2 })
    expect(state.slots[2].setup.mains.slot6).toBe('energyRegenPct')
    const result = calculateParty(state)!
    const astra = resultAgent(result, 'astraYao')
    expect(resultMetric(astra, 'atk').gauge).toMatchObject({ outputValue: 1600, outputCap: 1600 })
    expect(resultMetric(resultAgent(result, 'anbySoldier0'), 'atk').breakdown.fully)
      .toContainEqual(expect.objectContaining({ label: 'Core Passive', ownerAgentId: 'astraYao', amount: 1600 }))
    expect(resultMetric(resultAgent(result, 'anbySoldier0'), 'resReduction').values.fully).toBe(18)
    expect(resultMetric(resultAgent(result, 'trigger'), 'critDmg').values.fully).toBeCloseTo(105)
  })

  it('admits Trigger action-only damage and CRIT regions only from Anby Aftershock clauses', () => {
    const withoutAnby = resultAgent(calculateParty(createPreparedState({}, ['yixuan', 'trigger', 'astraYao'], 0))!, 'trigger')
    expect(withoutAnby.metrics.find(({ id }) => id === 'critDmg')).toBeUndefined()
    expect(withoutAnby.metrics.find(({ id }) => id === 'dmgBonus')).toBeUndefined()
    expect(withoutAnby.metrics.find(({ id }) => id === 'atk' || id === 'energyRegen')).toBeUndefined()

    let iceJade = createPreparedState({}, ['yixuan', 'trigger', 'astraYao'], 0)
    iceJade = workbenchReducer(iceJade, { type: 'selectEngine', slot: 1, engineId: 'iceJadeTeapot' })
    expect(resultAgent(calculateParty(iceJade)!, 'trigger').metrics.find(({ id }) => id === 'dmgBonus')).toBeUndefined()

    const offField = resultAgent(calculateParty(createPreparedState({}, ['anbySoldier0', 'trigger', 'yixuan'], 2))!, 'trigger')
    expect(offField.metrics.find(({ id }) => id === 'critDmg')).toBeDefined()
    expect(offField.metrics.find(({ id }) => id === 'dmgBonus')).toBeUndefined()
  })

  it('keeps provider filtering recipient-specific and reports only applicable gauges and operations', () => {
    let state = createPreparedState({}, ['anbySoldier0', 'trigger', 'astraYao'], 0)
    state = workbenchReducer(state, { type: 'setMindscape', slot: 2, mindscape: 4 })
    const result = calculateParty(state)!
    const anby = resultAgent(result, 'anbySoldier0')
    const trigger = resultAgent(result, 'trigger')
    const astra = resultAgent(result, 'astraYao')

    expect(resultMetric(anby, 'resReduction').values.fully).toBe(18)
    expect(trigger.metrics.find(({ id }) => id === 'resReduction')).toBeUndefined()
    expect(astra.metrics.find(({ id }) => id === 'resReduction')).toBeUndefined()
    expect(trigger.operations).toContainEqual(expect.objectContaining({ id: 'nextQuickAssistDaze', value: 50 }))

    const withoutAnby = calculateParty(createPreparedState({}, ['yixuan', 'trigger', 'astraYao'], 0))!
    expect(resultMetric(resultAgent(withoutAnby, 'trigger'), 'dazeBonus').gauge).toBeUndefined()

    let mixed = createPreparedState({}, ['yixuan', 'trigger', 'astraYao'], 0)
    mixed = workbenchReducer(mixed, { type: 'setMindscape', slot: 2, mindscape: 1 })
    expect(resultMetric(resultAgent(calculateParty(mixed)!, 'yixuan'), 'resReduction').values.fully).toBe(18)
  })

  it('scales passive display values while leaving advanced stats fixed', () => {
    const secondVerticalEngines = ['anbySoldier0', 'trigger', 'astraYao'] as const
    const engineIds = new Set(secondVerticalEngines.flatMap((agentId) => ENGINE_IDS_BY_AGENT_AND_POOL[agentId].full))
    for (const engineId of engineIds) for (const refinement of [1, 5] as const) {
      expect(W_ENGINES[engineId].passiveLines(refinement).join(' ')).not.toMatch(/per stack|\\bstacks?\\b|at maximum/i)
    }
    expect(W_ENGINES.severedInnocence.passiveLines(1)).toEqual(['Combat CRIT DMG +30%', 'CRIT DMG +30%', 'Electric DMG +20%'])
    expect(W_ENGINES.severedInnocence.passiveLines(5)).toEqual(['Combat CRIT DMG +48%', 'CRIT DMG +48%', 'Electric DMG +32%'])
    expect(W_ENGINES.cordisGermina.passiveLines(1)).toContain('Electric DMG +25%')
    expect(W_ENGINES.cordisGermina.passiveLines(5)).toContain('Electric DMG +40%')
    expect(W_ENGINES.spectralGaze.passiveLines(1)).toContain('Off-field Impact +20%')
    expect(W_ENGINES.spectralGaze.passiveLines(5)).toContain('Off-field Impact +32%')
    expect(W_ENGINES.iceJadeTeapot.passiveLines(1)).toContain('Impact +21%')
    expect(W_ENGINES.iceJadeTeapot.passiveLines(5)).toContain('Impact +33.6%')
    expect(W_ENGINES.iceJadeTeapot.passiveLines(1)).toContain('Squad DMG +20%')
    expect(W_ENGINES.restrained.passiveLines(1)).toEqual(['Basic Attack DMG +30%', 'Basic Attack Daze +30%'])
    expect(W_ENGINES.restrained.passiveLines(5)).toEqual(['Basic Attack DMG +48%', 'Basic Attack Daze +48%'])
    expect(W_ENGINES.elegantVanity.passiveLines(1)).toContain('Squad DMG +20%')
    expect(W_ENGINES.bashfulDemon.passiveLines(1)).toContain('Squad ATK +8%')
    expect(W_ENGINES.bashfulDemon.passiveLines(5)).toContain('Squad ATK +12.8%')
    expect(W_ENGINES.bashfulDemon.advancedStat.value).toBe(25)
    expect(ENGINE_IDS_BY_AGENT_AND_POOL.anbySoldier0.nonLimited).not.toContain('cordisGermina')
  })

  it('keeps enemy modifiers in their distinct action, recipient, and metric regions', () => {
    let state = createPreparedState({}, ['anbySoldier0', 'trigger', 'astraYao'], 0)
    state = workbenchReducer(state, { type: 'setMindscape', slot: 0, mindscape: 4 })
    state = workbenchReducer(state, { type: 'selectEngine', slot: 0, engineId: 'cordisGermina' })
    state = workbenchReducer(state, { type: 'selectMainStat', slot: 0, mainSlot: 'slot5', mainStatId: 'penRatio' })

    const m0 = calculateParty(state)!
    const anby = resultAgent(m0, 'anbySoldier0')
    const trigger = resultAgent(m0, 'trigger')
    expect(anby.actionModifiers.find(({ id }) => id === 'anbyBasicUltimate')).toMatchObject({
      actions: ['Basic Attack', 'Ultimate'],
      metricId: 'defIgnore',
      values: { initial: 0, combat: 0, fully: 20 },
    })
    expect(anby.actionModifiers.find(({ id }) => id === 'anbyBasicUltimate')?.breakdown.fully)
      .toContainEqual(expect.objectContaining({ ownerAgentId: 'anbySoldier0', amount: 20 }))
    expect(resultMetric(anby, 'resIgnore').values).toEqual({ initial: 0, combat: 0, fully: 12 })
    expect(trigger.metrics.find(({ id }) => id === 'resIgnore')).toBeUndefined()
    expect(resultMetric(anby, 'penRatio')).toMatchObject({
      values: { initial: 24, combat: 24, fully: 24 },
    })
    expect(resultMetric(anby, 'penRatio').breakdown.initial)
      .toContainEqual(expect.objectContaining({ label: 'Drive Disc · Slot 5', amount: 24 }))

    expect(resultMetric(anby, 'defReduction').values.fully).toBe(25)
    expect(trigger.actionModifiers.find(({ id }) => id === 'triggerAftershockDefReduction')).toBeUndefined()
    const yixuanWithTrigger = resultAgent(calculateParty(createPreparedState({}, ['yixuan', 'trigger', 'astraYao'], 0))!, 'yixuan')
    expect(yixuanWithTrigger.metrics.find(({ id }) => id === 'defReduction')).toBeUndefined()
    expect(resultMetric(trigger, 'stunDmgMultiplier').values.fully).toBe(35)

    state = workbenchReducer(state, { type: 'setMindscape', slot: 1, mindscape: 1 })
    const m1 = calculateParty(state)!
    expect(resultMetric(resultAgent(m1, 'trigger'), 'stunDmgMultiplier').values.fully).toBe(55)
  })

  it('keeps Trigger gauge boundaries, Astra tiers, and Stun operations scoped to current recipients', () => {
    const full = calculateParty(createPreparedState({}, ['anbySoldier0', 'trigger', 'astraYao'], 0))!
    const trigger = resultAgent(full, 'trigger')
    expect(resultMetric(trigger, 'dazeBonus').gauge).toMatchObject({ current: 53, outputValue: 19.5 })
    expect(trigger.actionModifiers.find(({ id }) => id === 'triggerBasic')).toMatchObject({
      tag: 'aftershock', actions: [], values: { fully: 25.5 },
    })
    expect(trigger.actionModifiers.find(({ id }) => id === 'triggerBasic')?.breakdown.fully)
      .toContainEqual(expect.objectContaining({ label: 'Additional Ability', amount: 19.5 }))

    let basicDaze = createPreparedState({ trigger: 'nonLimited' }, ['anbySoldier0', 'trigger', 'astraYao'], 0)
    basicDaze = workbenchReducer(basicDaze, { type: 'setSubstat', slot: 1, key: 'critRate', value: 16 })
    const basicOutcome = resultAgent(calculateParty(basicDaze)!, 'trigger').actionModifiers.find(({ id }) => id === 'triggerBasic')!
    expect(basicOutcome).toMatchObject({ tag: 'aftershock', actions: [] })
    expect(basicOutcome.breakdown.fully).toContainEqual(expect.objectContaining({ label: 'The Restrained', amount: 30 }))
    expect(basicOutcome.breakdown.fully).toContainEqual(expect.objectContaining({ label: 'Shockstar Disco', amount: 20 }))
    expect(basicOutcome.breakdown.fully).toContainEqual(expect.objectContaining({ label: 'Additional Ability' }))

    const nonLimited = calculateParty(createPreparedState({ trigger: 'nonLimited' }, ['anbySoldier0', 'trigger', 'astraYao'], 0))!
    expect(resultMetric(resultAgent(nonLimited, 'trigger'), 'dazeBonus').gauge).toMatchObject({ current: 29, outputValue: 0 })

    let boundaries = createPreparedState({}, ['anbySoldier0', 'trigger', 'astraYao'], 0)
    boundaries = workbenchReducer(boundaries, { type: 'setSubstat', slot: 1, key: 'critRate', value: 16 })
    expect(resultMetric(resultAgent(calculateParty(boundaries)!, 'trigger'), 'dazeBonus').gauge).toMatchObject({ current: 91.4, outputValue: 75 })

    let astra = createPreparedState({}, ['anbySoldier0', 'trigger', 'astraYao'], 0)
    astra = workbenchReducer(astra, { type: 'setMindscape', slot: 2, mindscape: 3 })
    expect(resultMetric(resultAgent(calculateParty(astra)!, 'anbySoldier0'), 'critDmg').values.fully).toBe(216)
    astra = workbenchReducer(astra, { type: 'setMindscape', slot: 2, mindscape: 5 })
    expect(resultMetric(resultAgent(calculateParty(astra)!, 'anbySoldier0'), 'critDmg').values.fully).toBe(219)

    astra = workbenchReducer(astra, { type: 'setMindscape', slot: 2, mindscape: 4 })
    expect(resultAgent(calculateParty(astra)!, 'trigger').operations).toContainEqual(expect.objectContaining({ id: 'nextQuickAssistDaze', value: 50 }))
    const firstTrio = calculateParty(createPreparedState())!
    expect(resultAgent(firstTrio, 'dialyn').operations).not.toContainEqual(expect.objectContaining({ id: 'nextQuickAssistDaze' }))

    const astraResult = resultMetric(resultAgent(calculateParty(astra)!, 'astraYao'), 'atk')
    expect(astraResult.values.initial).toBe(astraResult.values.combat)
    expect(astraResult.values.combat).toBe(astraResult.values.fully)

    let dialynParty = createPreparedState({}, ['astraYao', 'dialyn', 'yixuan'], 2)
    dialynParty = workbenchReducer(dialynParty, { type: 'setMindscape', slot: 0, mindscape: 4 })
    expect(resultAgent(calculateParty(dialynParty)!, 'dialyn').operations)
      .toContainEqual(expect.objectContaining({ id: 'nextQuickAssistDaze', value: 50 }))

    let triggerParty = createPreparedState({}, ['astraYao', 'trigger', 'anbySoldier0'], 2)
    triggerParty = workbenchReducer(triggerParty, { type: 'setMindscape', slot: 0, mindscape: 4 })
    expect(resultAgent(calculateParty(triggerParty)!, 'trigger').operations)
      .toContainEqual(expect.objectContaining({ id: 'nextQuickAssistDaze', value: 50 }))
  })

  it('normalizes provider and slot order without feeding the derived Aftershock clause back into Anby', () => {
    const forward = calculateParty(createPreparedState({}, ['anbySoldier0', 'trigger', 'astraYao'], 0))!
    const permuted = calculateParty(createPreparedState({}, ['astraYao', 'anbySoldier0', 'trigger'], 1))!
    const normalized = (result: typeof forward) => result.agents
      .map((agent) => agent)
      .sort((left, right) => left.agentId.localeCompare(right.agentId))

    expect(normalized(permuted)).toEqual(normalized(forward))
    const anby = resultAgent(forward, 'anbySoldier0')
    expect(resultMetric(anby, 'critDmg').breakdown.fully).not.toContainEqual(
      expect.objectContaining({ detail: '35% of Fully Enabled CRIT DMG' }),
    )
    const derived = anby.actionModifiers.find(({ id }) => id === 'anbyAftershockCritDmg')!
    expect(derived.breakdown.fully.filter(({ amount }) => amount === 74.55)).toHaveLength(1)

    const firstTrio = calculateParty(createPreparedState())!
    expect(resultMetric(resultAgent(firstTrio, 'yixuan'), 'maxHp').values.initial).toBe(16434.1)
    expect(resultMetric(resultAgent(firstTrio, 'dialyn'), 'impact').values.initial).toBe(110)
  })

  it('keeps completed Potential on its underlying source and gates allied Aftershock by Anby Focus', () => {
    const focused = calculateParty(createPreparedState({}, ['anbySoldier0', 'trigger', 'astraYao'], 0))!
    const focusedAftershock = resultAgent(focused, 'anbySoldier0').actionModifiers
      .find(({ id }) => id === 'anbyAftershock')!
    expect(focusedAftershock.breakdown.fully).toContainEqual(expect.objectContaining({
      label: 'Additional Ability', ownerAgentId: 'anbySoldier0', amount: 50,
    }))

    const offField = calculateParty(createPreparedState({}, ['anbySoldier0', 'trigger', 'yixuan'], 2))!
    const offFieldAftershock = resultAgent(offField, 'anbySoldier0').actionModifiers
      .find(({ id }) => id === 'anbyAftershock')!
    expect(offFieldAftershock.breakdown.fully).not.toContainEqual(expect.objectContaining({ amount: 50 }))
    expect(offFieldAftershock.breakdown.fully).not.toContainEqual(expect.objectContaining({ label: /max Potential/ }))
  })

  it('keeps Shadow Harmony Dash separate from Anby Aftershock-only clauses', () => {
    const anby = resultAgent(calculateParty(createPreparedState({}, ['anbySoldier0', 'trigger', 'astraYao'], 0))!, 'anbySoldier0')
    const aftershock = anby.actionModifiers.find(({ id }) => id === 'anbyAftershock')!
    const dash = anby.actionModifiers.find(({ id }) => id === 'anbyDash')!
    expect(dash.values.initial).toBe(45)
    expect(dash.breakdown.fully).not.toContainEqual(expect.objectContaining({ label: 'Additional Ability', amount: 50 }))
    expect(dash.breakdown.fully).not.toContainEqual(expect.objectContaining({ detail: '35% of Fully Enabled CRIT DMG' }))
    expect(aftershock.values.fully).toBe(204)
  })

  it('projects every Trigger Disc 2-piece once, including one supplied by a selected 4-piece', () => {
    let state = createPreparedState({}, ['anbySoldier0', 'trigger', 'astraYao'], 0)
    let trigger = resultAgent(calculateParty(state)!, 'trigger')
    expect(resultMetric(trigger, 'dazeBonus').breakdown.initial).toContainEqual(expect.objectContaining({
      label: 'King of the Summit', detail: '2-piece', locus: 'disc-4pc', amount: 6,
    }))

    state = workbenchReducer(state, { type: 'selectDisc', slot: 1, piece: 'fourPiece', discId: 'shockstar' })
    trigger = resultAgent(calculateParty(state)!, 'trigger')
    expect(resultMetric(trigger, 'impact').breakdown.initial).toContainEqual(expect.objectContaining({
      label: 'Shockstar Disco', detail: '2-piece', locus: 'disc-4pc',
    }))

    expect(workbenchReducer(state, { type: 'selectDisc', slot: 1, piece: 'fourPiece', discId: 'shadowHarmony' })).toBe(state)
  })

  it('keeps Trigger authored setup choices without admitting personal damage Result rows', () => {
    const secondTrio = calculateParty(createPreparedState({}, ['anbySoldier0', 'trigger', 'astraYao'], 0))!
    const trigger = resultAgent(secondTrio, 'trigger')
    expect(trigger.metrics.map(({ id }) => id)).toEqual(['critRate', 'impact', 'dazeBonus', 'stunDmgMultiplier', 'critDmg', 'dmgBonus'])
    expect(trigger.metrics.find(({ id }) => id === 'atk')).toBeUndefined()
    expect(trigger.metrics.find(({ id }) => id === 'energyRegen')).toBeUndefined()

    const triggerSetup = createPreparedState({}, ['anbySoldier0', 'trigger', 'dialyn'], 0).slots[1].setup
    expect(triggerSetup).toMatchObject({ fourPieceId: 'king', twoPieceId: 'shockstar' })
    expect(MAIN_STAT_IDS_BY_AGENT_AND_SLOT.trigger.slot5).toEqual(['electricDmg'])
    expect(SUBSTAT_CHOICES_BY_AGENT.trigger.map(({ id }) => id)).toEqual(['critRate'])
  })

  it('consolidates Precious Fossilized Core thresholds into one W-Engine contributor', () => {
    let state = createPreparedState({}, ['anbySoldier0', 'trigger', 'astraYao'], 0)
    state = workbenchReducer(state, { type: 'selectEngine', slot: 1, engineId: 'preciousFossilizedCore' })
    const dazeRows = resultMetric(resultAgent(calculateParty(state)!, 'trigger'), 'dazeBonus').breakdown.fully
      .filter(({ label }) => label === 'Precious Fossilized Core')
    expect(dazeRows).toHaveLength(1)
    expect(dazeRows[0].amount).toBe(32)
  })

  it('does not stack duplicate King effects while retaining truthful equal and unequal origins', () => {
    const state = createPreparedState({}, ['dialyn', 'trigger', 'anbySoldier0'], 2)
    const slots = [...state.slots] as typeof state.slots
    slots[1] = { ...slots[1], setup: { ...slots[1].setup, fourPieceId: 'king', twoPieceId: 'shockstar' } }
    const result = calculateParty({ ...state, slots })!
    const kingRows = resultMetric(resultAgent(result, 'anbySoldier0'), 'critDmg').breakdown.fully
      .filter(({ label }) => label === 'King of the Summit')
    expect(kingRows).toHaveLength(2)
    expect(kingRows.map(({ ownerAgentId }) => ownerAgentId).sort()).toEqual(['dialyn', 'trigger'])
    expect(kingRows.map(({ amount }) => amount)).toEqual([30, 30])
    expect(kingRows.every(({ detail }) => detail?.endsWith('equal non-stacking origin'))).toBe(true)
    const singleKingSlots = [...slots] as typeof slots
    singleKingSlots[1] = {
      ...singleKingSlots[1],
      setup: { ...singleKingSlots[1].setup, fourPieceId: 'shadowHarmony' },
    }
    const singleKing = calculateParty({ ...state, slots: singleKingSlots })!
    expect(resultMetric(resultAgent(result, 'anbySoldier0'), 'critDmg').values.fully)
      .toBe(resultMetric(resultAgent(singleKing, 'anbySoldier0'), 'critDmg').values.fully)

    const unequalSlots = [...slots] as typeof slots
    unequalSlots[1] = {
      ...unequalSlots[1],
      setup: { ...unequalSlots[1].setup, engineId: 'steamOven', refinement: 5 },
    }
    const unequal = calculateParty({ ...state, slots: unequalSlots })!
    const unequalRows = resultMetric(resultAgent(unequal, 'anbySoldier0'), 'critDmg').breakdown.fully
      .filter(({ label }) => label === 'King of the Summit')
    expect(unequalRows).toEqual([expect.objectContaining({ ownerAgentId: 'dialyn', amount: 30 })])

    const reversed = createPreparedState({}, ['anbySoldier0', 'trigger', 'dialyn'], 0)
    const reversedSlots = [...reversed.slots] as typeof reversed.slots
    reversedSlots[1] = { ...reversedSlots[1], setup: { ...reversedSlots[1].setup, fourPieceId: 'king', twoPieceId: 'shockstar' } }
    expect(resultMetric(resultAgent(calculateParty({ ...reversed, slots: reversedSlots })!, 'anbySoldier0'), 'critDmg').values.fully)
      .toBe(resultMetric(resultAgent(result, 'anbySoldier0'), 'critDmg').values.fully)
  })

  it('makes Astra initial ATK and Special Attack source disclosure auditable', () => {
    let state = createPreparedState({}, ['anbySoldier0', 'trigger', 'astraYao'], 0)
    const result = calculateParty(state)!
    const astra = resultAgent(result, 'astraYao')
    expect(resultMetric(astra, 'atk').breakdown.initial).toContainEqual(expect.objectContaining({
      label: 'Astral Voice', detail: '2-piece', locus: 'disc-4pc',
    }))
    expect(resultMetric(resultAgent(result, 'anbySoldier0'), 'critDmg').breakdown.fully)
      .toContainEqual(expect.objectContaining({ label: 'Special Attack', detail: 'Idyllic Cadenza · level 12', locus: 'special' }))

    state = workbenchReducer(state, { type: 'setMindscape', slot: 2, mindscape: 3 })
    expect(resultMetric(resultAgent(calculateParty(state)!, 'anbySoldier0'), 'critDmg').breakdown.fully)
      .toContainEqual(expect.objectContaining({ label: 'Special Attack', detail: 'Idyllic Cadenza · level 14', locus: 'special' }))
    state = workbenchReducer(state, { type: 'setMindscape', slot: 2, mindscape: 5 })
    expect(resultMetric(resultAgent(calculateParty(state)!, 'anbySoldier0'), 'critDmg').breakdown.fully)
      .toContainEqual(expect.objectContaining({ label: 'Special Attack', detail: 'Idyllic Cadenza · level 16', locus: 'special' }))
  })

  it('resolves Fully percentage clauses from authoritative Initial stats', () => {
    const full = calculateParty(createPreparedState({}, ['anbySoldier0', 'trigger', 'astraYao'], 0))!
    const anbyAtk = resultMetric(resultAgent(full, 'anbySoldier0'), 'atk')
    expect(anbyAtk.values.initial).toBeCloseTo(2450.6)
    expect(anbyAtk.values.fully - anbyAtk.values.initial).toBeCloseTo(1494.072)

    const triggerImpact = resultMetric(resultAgent(full, 'trigger'), 'impact')
    expect(triggerImpact.values.initial).toBeCloseTo(162.44)
    expect(triggerImpact.values.fully).toBeCloseTo(194.928)

    const nonLimited = calculateParty(createPreparedState(
      { trigger: 'nonLimited', astraYao: 'nonLimited' },
      ['anbySoldier0', 'trigger', 'astraYao'],
      0,
    ))!
    const trigger = resultAgent(nonLimited, 'trigger')
    expect(trigger.metrics.find(({ id }) => id === 'atk')).toBeUndefined()
    expect(resultMetric(trigger, 'dmgBonus').values.fully).toBe(0)
    expect(trigger.actionModifiers.find(({ id }) => id === 'triggerAftershock')?.values.fully).toBe(50)

    const mixed = calculateParty(createPreparedState(
      { astraYao: 'nonLimited' },
      ['yixuan', 'trigger', 'astraYao'],
      0,
    ))!
    const yixuan = resultAgent(mixed, 'yixuan')
    expect(resultMetric(yixuan, 'atk').values).toEqual({
      initial: 1931,
      combat: 1931,
      fully: 3378.168,
    })
    expect(resultMetric(yixuan, 'sheerForce').values.fully).toBeCloseTo(2656.8604)

    const firstTrio = resultAgent(calculateParty(createPreparedState())!, 'yixuan')
    expect(resultMetric(firstTrio, 'atk').values.fully).toBe(1931)
    expect(resultMetric(firstTrio, 'sheerForce').values.fully).toBeCloseTo(3366.1847)
  })
})
