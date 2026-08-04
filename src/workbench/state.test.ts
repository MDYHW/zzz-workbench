import { describe, expect, it } from 'vitest'
import { ENGINE_IDS_BY_POOL, PARTY_AGENTS, SUBSTAT_CHOICES, W_ENGINES } from './content'
import { createPreparedState, workbenchReducer } from './state'

describe('workbench state lifecycle', () => {
  it('retains only the checkpoint party and visible competitive choices', () => {
    expect(PARTY_AGENTS.map((agent) => ({ id: agent.id, roles: agent.roles }))).toEqual([
      { id: 'yixuan', roles: ['Damage contributor', 'Fixed focus'] },
      { id: 'dialyn', roles: ['Daze contributor', 'Buffer'] },
      { id: 'lucia', roles: ['Buffer'] },
    ])
    expect(ENGINE_IDS_BY_POOL).toEqual({
      full: ['qingming', 'cauldron'],
      nonLimited: ['cauldron'],
    })
    expect(W_ENGINES.qingming.refinement).toBe('W1')
    expect(W_ENGINES.cauldron.refinement).toBe('W5')
    expect(Object.entries(SUBSTAT_CHOICES).map(([key, choice]) => [key, choice.perHit])).toEqual([
      ['critRate', 2.4],
      ['critDmg', 4.8],
      ['hpPct', 3],
    ])
  })
  it('starts with the authored full-pool setup', () => {
    const state = createPreparedState()

    expect(state.pool).toBe('full')
    expect(state.engineId).toBe('qingming')
    expect(state.refinement).toBe('W1')
    expect(state.equipment?.fourPiece).toBe('Yunkui Tales')
    expect(state.equipment?.twoPiece).toBe('Woodpecker Electro')
    expect(state.substats).toEqual({ critRate: 0, critDmg: 0, hpPct: 0 })
  })

  it('preserves downstream setup inputs on a direct W-Engine edit', () => {
    const tuned = workbenchReducer(createPreparedState(), {
      type: 'setSubstat',
      key: 'hpPct',
      value: 7,
    })
    const changed = workbenchReducer(tuned, {
      type: 'selectEngine',
      engineId: 'cauldron',
    })

    expect(changed.engineId).toBe('cauldron')
    expect(changed.refinement).toBe('W5')
    expect(changed.equipment).toBe(tuned.equipment)
    expect(changed.substats).toEqual(tuned.substats)
  })

  it('re-prepares only the target when switching pools', () => {
    let state = createPreparedState()
    state = workbenchReducer(state, { type: 'setSubstat', key: 'critRate', value: 5 })
    state = workbenchReducer(state, { type: 'setSubstat', key: 'critDmg', value: 4 })
    state = workbenchReducer(state, { type: 'switchPool', pool: 'nonLimited' })

    expect(state.pool).toBe('nonLimited')
    expect(state.engineId).toBe('cauldron')
    expect(state.refinement).toBe('W5')
    expect(state.substats).toEqual({ critRate: 0, critDmg: 0, hpPct: 0 })

    state = workbenchReducer(state, { type: 'setSubstat', key: 'hpPct', value: 2 })
    state = workbenchReducer(state, { type: 'switchPool', pool: 'full' })

    expect(state.engineId).toBe('qingming')
    expect(state.refinement).toBe('W1')
    expect(state.substats).toEqual({ critRate: 0, critDmg: 0, hpPct: 0 })
  })

  it('bounds each independent substat count from 0 through 36', () => {
    const prepared = createPreparedState()
    const below = workbenchReducer(prepared, {
      type: 'adjustSubstat',
      key: 'critRate',
      delta: -1,
    })
    const above = workbenchReducer(prepared, {
      type: 'setSubstat',
      key: 'critRate',
      value: 99,
    })

    expect(below.substats.critRate).toBe(0)
    expect(above.substats.critRate).toBe(36)
  })

  it('does not admit an engine outside the current pool', () => {
    const state = createPreparedState('nonLimited')
    expect(workbenchReducer(state, { type: 'selectEngine', engineId: 'qingming' })).toBe(state)
  })
})
