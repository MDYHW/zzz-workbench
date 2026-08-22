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
})
