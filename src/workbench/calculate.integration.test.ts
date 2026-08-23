import { describe, expect, it } from 'vitest'
import { calculateParty } from './calculate'
import { ADMITTED_AGENTS, type AgentId } from './content'
import { createPreparedState, workbenchReducer } from './state'

const profileGroups: readonly (readonly [AgentId, AgentId, AgentId])[] = [
  ['yixuan', 'dialyn', 'lucia'],
  ['anbySoldier0', 'trigger', 'astraYao'],
  ['seed', 'cissia', 'evelyn'],
  ['corin', 'lycaon', 'juFufu'],
  ['yidhari', 'manato', 'hugo'],
  ['panYinhu', 'banyue', 'starlightBilly'],
  ['ellen', 'soukaku', 'soldier11'],
  ['lighter', 'lucy', 'zhuYuan'],
  ['nicole', 'orphie', 'pulchra'],
  ['harumasa', 'qingyi', 'nekomata'],
  ['billy', 'ben', 'koleda'],
  ['anby', 'caesar', 'yeShunguang'],
  ['zhao', 'grace', 'piper'],
  ['yuzuha', 'burnice', 'yixuan'],
  ['jane', 'seth', 'yixuan'],
  ['yanagi', 'alice', 'yixuan'],
]

describe('shared calculation integration', () => {
  it('routes every admitted Agent through the same complete profile evaluator', () => {
    const reached = new Set<AgentId>()

    for (const group of profileGroups) {
      const result = calculateParty(createPreparedState({}, [...group], 0))
      expect(result?.agents.map(({ agentId }) => agentId)).toEqual(group)
      group.forEach((agentId) => reached.add(agentId))
    }

    expect([...reached].sort()).toEqual(ADMITTED_AGENTS.map(({ id }) => id).sort())
  })

  it('projects one composed cross-holder flow without exposing undeclared shared rows', () => {
    const result = calculateParty(createPreparedState())!
    expect(result.agents).toHaveLength(3)
    expect(result.agents.every(({ metrics }) => metrics.length > 0)).toBe(true)

    const hasExternalSource = result.agents.some((agent) => (
      agent.metrics.some(({ breakdown }) => (
        Object.values(breakdown).flat().some(({ ownerAgentId }) => (
          ownerAgentId !== undefined && ownerAgentId !== agent.agentId
        ))
      ))
    ))
    expect(hasExternalSource).toBe(true)
    expect(result.agents.flatMap(({ metrics }) => metrics.map(({ id }) => id)))
      .not.toContain('power')
  })

  it('projects an overlapping entrant buff to every current recipient instead of Focus only', () => {
    const result = calculateParty(createPreparedState(
      {}, ['astraYao', 'seed', 'cissia'], 1,
    ))!

    for (const agentId of ['astraYao', 'seed', 'cissia'] as const) {
      const atk = result.agents.find((agent) => agent.agentId === agentId)!
        .metrics.find(({ id }) => id === 'atk')!
      expect(atk.breakdown.fully).toContainEqual(expect.objectContaining({
        label: 'Core Passive',
        ownerAgentId: 'astraYao',
      }))
    }
  })

  it('applies an equipment interval condition through direction metadata and a bounded holder override', () => {
    const lycaonEnergyWith = (focusAgentId: 'corin' | 'ellen') => {
      const companions = focusAgentId === 'corin'
        ? ['corin', 'lycaon', 'lucia'] as const
        : ['ellen', 'lycaon', 'soukaku'] as const
      let state = createPreparedState({}, [...companions], 0)
      state = workbenchReducer(state, {
        type: 'selectEngine', slot: 1, engineId: 'hellfireGears',
      })
      return calculateParty(state)!.agents.find(({ agentId }) => agentId === 'lycaon')!
        .metrics.find(({ id }) => id === 'energyRegen')
    }

    expect(lycaonEnergyWith('corin')).toBeUndefined()
    const offFieldEnergy = lycaonEnergyWith('ellen')!
    expect(offFieldEnergy.values.fully).toBeCloseTo(1.8)
    expect(offFieldEnergy.breakdown.combat).toEqual([
      expect.objectContaining({ label: 'Hellfire Gears', amount: 0.6 }),
    ])
  })

  it('projects canonical equipment scopes through retained Agent-local action identities', () => {
    const hasActionSource = (
      state: ReturnType<typeof createPreparedState>,
      agentId: AgentId,
      metricId: 'dmgBonus' | 'defIgnore',
      label: string,
    ) => calculateParty(state)!.agents.find((agent) => agent.agentId === agentId)!
      .actionModifiers.some((modifier) => (
        modifier.metricId === metricId
        && Object.values(modifier.breakdown).flat().some((source) => source.label === label)
      ))

    let state = createPreparedState({}, ['seed', 'cissia', 'evelyn'], 0)
    expect(hasActionSource(state, 'seed', 'defIgnore', 'Cordis Germina')).toBe(true)
    expect(hasActionSource(state, 'seed', 'dmgBonus', "Dawn's Bloom")).toBe(true)

    state = workbenchReducer(state, { type: 'switchPool', slot: 1, pool: 'nonLimited' })
    expect(state.slots[1].setup.engineId).toBe('drillRigRedAxis')
    expect(hasActionSource(state, 'cissia', 'dmgBonus', 'Drill Rig - Red Axis')).toBe(true)
    expect(calculateParty(state)!.agents.find(({ agentId }) => agentId === 'cissia')!.actionModifiers)
      .toEqual(expect.arrayContaining([expect.objectContaining({ id: 'cissiaCorrodeDaze' })]))
  })

  it('returns no Result while any required Setup selection is incomplete', () => {
    const state = createPreparedState()
    const incomplete = {
      ...state,
      slots: [...state.slots] as typeof state.slots,
    }
    incomplete.slots[0] = {
      ...incomplete.slots[0],
      setup: { ...incomplete.slots[0].setup, engineId: null },
    }
    expect(calculateParty(incomplete)).toBeNull()
  })

  it('composes one-way local stats before provider delivery and preserves action-scoped anomaly recipients', () => {
    let state = createPreparedState({}, ['yanagi', 'alice', 'yixuan'], 1)
    state = workbenchReducer(state, { type: 'setMindscape', slot: 1, mindscape: 2 })
    const result = calculateParty(state)!
    const yanagi = result.agents.find(({ agentId }) => agentId === 'yanagi')!
    const alice = result.agents.find(({ agentId }) => agentId === 'alice')!
    const contrast = result.agents.find(({ agentId }) => agentId === 'yixuan')!

    expect(alice.metrics.find(({ id }) => id === 'anomalyMastery')?.values.fully)
      .toBeCloseTo(255.96)
    expect(alice.metrics.find(({ id }) => id === 'anomalyProficiency')?.values.fully)
      .toBeCloseTo(395.536)
    expect(alice.operations.map(({ id }) => id)).toEqual(expect.arrayContaining([
      'aliceDisorderDmgMultiplier',
      'yanagiDisorderDmgMultiplier',
    ]))
    expect(contrast.operations.some(({ id }) => id === 'yanagiDisorderDmgMultiplier'))
      .toBe(false)

    expect(alice.actionModifiers.find(({ id }) => id === 'aliceAssault')?.values.fully)
      .toBe(15)
    expect(alice.actionModifiers.find(({ id }) => id === 'aliceDisorder')?.values.fully)
      .toBe(15)
    expect(yanagi.actionModifiers.find(({ id }) => id === 'yanagiDisorder')?.breakdown.fully)
      .toContainEqual(expect.objectContaining({
        label: 'Mindscape',
        detail: 'M2 · Against an enemy suffering Physical Anomaly',
      }))
    expect(yanagi.actionModifiers.filter(({ breakdown }) => (
      breakdown.fully.some(({ label, ownerAgentId }) => (
        label === 'Mindscape' && ownerAgentId === 'alice'
      ))
    )).map(({ id }) => id)).toEqual(['yanagiDisorder'])
    expect(contrast.actionModifiers.some(({ breakdown }) => (
      breakdown.fully.some(({ label, ownerAgentId }) => (
        label === 'Mindscape' && ownerAgentId === 'alice'
      ))
    ))).toBe(false)

    const unqualified = calculateParty(createPreparedState({}, ['alice', 'yixuan', 'ben'], 0))!
      .agents.find(({ agentId }) => agentId === 'alice')!
    expect(unqualified.metrics.find(({ id }) => id === 'anomalyProficiency')?.values.fully)
      .toBe(210)
  })

  it('keeps a selected-input threshold finite across counts and a target-only Mindscape rebuild', () => {
    const ap = (state: ReturnType<typeof createPreparedState>) => (
      calculateParty(state)!.agents.find(({ agentId }) => agentId === 'yanagi')!
        .metrics.find(({ id }) => id === 'anomalyProficiency')!
    )
    let state = createPreparedState({}, ['yanagi', 'alice', 'piper'], 0)

    expect(ap(state).values.fully).toBe(341)
    expect(ap(state).gauge).toEqual(expect.objectContaining({ current: 341, threshold: 375, outputValue: 0 }))

    state = workbenchReducer(state, { type: 'setSubstat', slot: 0, key: 'anomalyProficiency', value: 4 })
    expect(ap(state).values.fully).toBe(377)
    expect(ap(state).gauge?.outputValue).toBe(25)

    state = workbenchReducer(state, { type: 'setSubstat', slot: 0, key: 'anomalyProficiency', value: 8 })
    expect(ap(state).values.fully).toBe(413)

    state = workbenchReducer(state, { type: 'setMindscape', slot: 0, mindscape: 1 })
    expect(state.slots[0].setup.substats.anomalyProficiency).toBe(0)
    expect(ap(state).values.fully).toBe(421)
    expect(ap(state).gauge?.outputValue).toBe(25)
  })

  it('keeps Seth Core delivery and Peacekeeper action effects while gating Additional buildup RES', () => {
    const active = calculateParty(createPreparedState({}, ['seth', 'piper', 'grace'], 1))!
    const inactive = calculateParty(createPreparedState({}, ['seth', 'piper', 'burnice'], 1))!
    const agent = (result: NonNullable<ReturnType<typeof calculateParty>>, id: AgentId) => (
      result.agents.find(({ agentId }) => agentId === id)!
    )
    const activeSeth = agent(active, 'seth')
    const inactiveSeth = agent(inactive, 'seth')
    const activeAp = activeSeth.metrics.find(({ id }) => id === 'anomalyProficiency')!
    const inactiveAp = inactiveSeth.metrics.find(({ id }) => id === 'anomalyProficiency')!

    expect(activeAp.values.fully).toBe(190)
    expect(inactiveAp.values.fully).toBe(190)
    expect(agent(active, 'piper').metrics.find(({ id }) => id === 'anomalyBuildupResReduction')?.values.fully)
      .toBe(20)
    expect(agent(inactive, 'piper').metrics.find(({ id }) => id === 'anomalyBuildupResReduction')).toBeUndefined()
    expect(activeSeth.metrics.find(({ id }) => id === 'anomalyBuildupResReduction')?.values.fully)
      .toBe(20)
    expect(inactiveSeth.metrics.find(({ id }) => id === 'anomalyBuildupResReduction')).toBeUndefined()

    const energy = activeSeth.metrics.find(({ id }) => id === 'energyRegen')!
    expect(energy.values.combat).toBe(energy.values.initial)
    expect(energy.values.fully).toBeGreaterThan(energy.values.combat)
    expect(activeSeth.metrics.find(({ id }) => id === 'anomalyBuildupBonus')?.values.fully)
      .toBe(0)
    expect(activeSeth.metrics.find(({ id }) => id === 'dazeBonus')?.values.fully)
      .toBe(0)
    const exAssistBuildup = activeSeth.actionModifiers
      .find(({ id }) => id === 'sethExAssistBuildup')!
    expect(exAssistBuildup.values.fully).toBeGreaterThan(0)
    expect(exAssistBuildup.standaloneMetric).toBeUndefined()
    expect(activeSeth.actionModifiers.find(({ id }) => id === 'sethDefensiveAssistDaze')?.standaloneMetric)
      .toBeUndefined()

    let tusksState = createPreparedState({}, ['seth', 'piper', 'grace'], 1)
    tusksState = workbenchReducer(tusksState, {
      type: 'selectEngine', slot: 0, engineId: 'tusksOfFury',
    })
    const tusksSeth = agent(calculateParty(tusksState)!, 'seth')
    expect(tusksSeth.metrics.find(({ id }) => id === 'dazeBonus')?.values.fully)
      .toBeGreaterThan(0)
  })

  it('derives prepared Jane Passion from Seth AP and scopes Assault CRIT providers', () => {
    const withSeth = calculateParty(createPreparedState({}, ['jane', 'piper', 'seth'], 0))!
    const withoutSeth = calculateParty(createPreparedState({}, ['jane', 'piper', 'burnice'], 0))!
    const agent = (result: NonNullable<ReturnType<typeof calculateParty>>, id: AgentId) => (
      result.agents.find(({ agentId }) => agentId === id)!
    )
    const jane = agent(withSeth, 'jane')
    const piper = agent(withSeth, 'piper')
    const seth = agent(withSeth, 'seth')
    const janeAp = jane.metrics.find(({ id }) => id === 'anomalyProficiency')!
    const janeApWithoutSeth = agent(withoutSeth, 'jane').metrics
      .find(({ id }) => id === 'anomalyProficiency')!

    expect(janeAp.values.fully - janeApWithoutSeth.values.fully).toBe(100)
    expect(janeAp.gauge?.additionalOutputs).toContainEqual(expect.objectContaining({
      label: 'Passion flat ATK',
      value: Math.min(Math.max(janeAp.values.fully - 120, 0) * 2, 600),
    }))

    const modifier = (result: ReturnType<typeof agent>, id: string) => (
      result.actionModifiers.find(({ id: modifierId }) => modifierId === id)
    )
    expect(modifier(jane, 'janeAssaultCritRate')?.breakdown.fully.flat())
      .toContainEqual(expect.objectContaining({ label: 'Core Passive' }))
    expect(modifier(jane, 'janeAssaultCritRate')?.standaloneMetric?.label).toBe('CRIT Rate')
    expect(jane.metrics.some(({ id }) => id === 'critRate' || id === 'critDmg')).toBe(false)
    expect(piper.metrics.some(({ id }) => id === 'critRate' || id === 'critDmg')).toBe(false)
    expect(modifier(piper, 'piperAssaultCritRate')?.breakdown.fully.flat())
      .toContainEqual(expect.objectContaining({ label: 'Core Passive' }))
    expect(modifier(jane, 'janeAssaultCritDmg')?.breakdown.fully.flat())
      .toContainEqual(expect.objectContaining({ label: 'Potential Awakening' }))
    expect(modifier(piper, 'piperAssaultCritDmg')?.breakdown.fully.flat())
      .not.toContainEqual(expect.objectContaining({ label: 'Potential Awakening' }))
    expect(seth.actionModifiers.some(({ id }) => id === 'janeAssaultCritRate' || id === 'janeAssaultCritDmg'))
      .toBe(false)

    let m2State = createPreparedState({}, ['jane', 'piper', 'seth'], 0)
    m2State = workbenchReducer(m2State, { type: 'setMindscape', slot: 0, mindscape: 2 })
    const m2 = calculateParty(m2State)!
    const m2Jane = agent(m2, 'jane')
    const m2Piper = agent(m2, 'piper')
    const m2Seth = agent(m2, 'seth')
    const piperM2Crit = modifier(m2Piper, 'piperAssaultCritDmg')!
    const piperM2Defense = modifier(m2Piper, 'piperAssaultDefIgnore')!

    expect(piperM2Crit.values.fully).toBeGreaterThan(modifier(piper, 'piperAssaultCritDmg')!.values.fully)
    expect(piperM2Crit.breakdown.fully.flat())
      .toContainEqual(expect.objectContaining({ label: 'Mindscape', detail: 'M2' }))
    expect(piperM2Defense.breakdown.fully.flat())
      .toContainEqual(expect.objectContaining({ label: 'Mindscape', detail: 'M2' }))
    expect(modifier(m2Jane, 'janeAssaultCritDmg')?.breakdown.fully.flat())
      .toContainEqual(expect.objectContaining({ label: 'Mindscape', detail: 'M2' }))
    expect(m2Seth.actionModifiers.some(({ id }) => id.includes('Assault'))).toBe(false)
  })

  it('keeps action-admitted CRIT hidden until Anby creates Trigger\'s scoped outcome', () => {
    const withoutAnby = calculateParty(
      createPreparedState({}, ['trigger', 'harumasa', 'nicole'], 1),
    )!
    const withAnby = calculateParty(
      createPreparedState({}, ['trigger', 'anbySoldier0', 'nicole'], 1),
    )!
    const trigger = (result: NonNullable<ReturnType<typeof calculateParty>>) => (
      result.agents.find(({ agentId }) => agentId === 'trigger')!
    )

    expect(trigger(withoutAnby).metrics.some(({ id }) => id === 'critDmg')).toBe(false)
    expect(trigger(withoutAnby).actionModifiers.some(({ id }) => id === 'triggerAftershockCritDmg'))
      .toBe(false)
    expect(trigger(withAnby).metrics.some(({ id }) => id === 'critDmg')).toBe(true)
    expect(trigger(withAnby).actionModifiers.some(({ id }) => id === 'triggerAftershockCritDmg'))
      .toBe(true)
  })
})
