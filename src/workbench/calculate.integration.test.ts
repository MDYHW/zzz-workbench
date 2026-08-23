import { describe, expect, it } from 'vitest'
import { calculateParty } from './calculate'
import { ADMITTED_AGENTS, isFocusEligible, type AgentId } from './content'
import { createPreparedState, workbenchReducer, type AppliedSlot } from './state'

const SAFE_COMPANIONS: readonly AgentId[] = ['yixuan', 'dialyn', 'lucia']

function profileStateFor(agentId: AgentId) {
  const agentIds = [
    agentId,
    ...SAFE_COMPANIONS.filter((candidate) => candidate !== agentId),
  ].slice(0, 3) as [AgentId, AgentId, AgentId]
  const focusSlot = agentIds.findIndex(isFocusEligible) as AppliedSlot
  if (focusSlot < 0) throw new Error(`Profile fixture requires a Focus: ${agentId}`)
  return createPreparedState({}, agentIds, focusSlot)
}

describe('shared calculation integration', () => {
  it('routes every admitted Agent through the same complete profile evaluator', () => {
    for (const { id } of ADMITTED_AGENTS) {
      const state = profileStateFor(id)
      const result = calculateParty(state)
      expect(result?.agents.map(({ agentId }) => agentId), id)
        .toEqual(state.slots.map(({ agentId }) => agentId))
      expect(result?.agents.find(({ agentId }) => agentId === id)?.metrics.length, id)
        .toBeGreaterThan(0)
    }
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

  it('projects compatible exact anomaly outcomes across current recipient profiles', () => {
    let state = createPreparedState({}, ['jane', 'alice', 'piper'], 0)
    state = workbenchReducer(state, { type: 'setMindscape', slot: 0, mindscape: 2 })
    state = workbenchReducer(state, { type: 'setMindscape', slot: 1, mindscape: 2 })
    const result = calculateParty(state)!
    const agent = (agentId: AgentId) => result.agents.find((entry) => entry.agentId === agentId)!
    const hasSource = (agentId: AgentId, actionId: string, ownerAgentId: AgentId) => (
      agent(agentId).actionModifiers.find(({ id }) => id === actionId)?.breakdown.fully
        .some((source) => source.ownerAgentId === ownerAgentId) ?? false
    )

    expect(hasSource('alice', 'aliceAssaultCritRate', 'jane')).toBe(true)
    expect(hasSource('alice', 'aliceAssaultCritDmg', 'jane')).toBe(true)
    expect(hasSource('alice', 'aliceAssaultDefIgnore', 'jane')).toBe(true)
    expect(hasSource('jane', 'janeAssaultAnomaly', 'alice')).toBe(true)
    expect(hasSource('jane', 'janeDisorderAnomaly', 'alice')).toBe(true)
    expect(hasSource('piper', 'piperAssaultAnomaly', 'alice')).toBe(true)
    expect(hasSource('piper', 'piperDisorder', 'alice')).toBe(true)
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
    expect(offFieldEnergy.breakdown.combat)
      .toContainEqual(expect.objectContaining({ label: 'Hellfire Gears' }))
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
