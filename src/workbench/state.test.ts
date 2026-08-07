import { describe, expect, it } from 'vitest'
import {
  DISC_IDS_BY_AGENT_AND_PIECE,
  ENGINE_IDS_BY_AGENT_AND_POOL,
  MAIN_STAT_IDS_BY_AGENT_AND_SLOT,
} from './content'
import { createPreparedState, isCompleteWorkbench, workbenchReducer } from './state'

describe('workbench state lifecycle', () => {
  it('keeps the admitted candidates distinct from the exact three prepared slots', () => {
    expect(ENGINE_IDS_BY_AGENT_AND_POOL.yixuan.full).toEqual([
      'qingming', 'cauldron', 'radiowave', 'puzzleSphere',
    ])
    expect(DISC_IDS_BY_AGENT_AND_PIECE.yixuan).toEqual({
      fourPiece: ['yunkui'], twoPiece: ['woodpecker', 'branchAndBlade'],
    })
    expect(MAIN_STAT_IDS_BY_AGENT_AND_SLOT.yixuan.slot5).toEqual(['etherDmg', 'hpPct'])

    const state = createPreparedState()
    expect(state.focusSlot).toBe(0)
    expect(state.slots.map(({ agentId }) => agentId)).toEqual(['yixuan', 'dialyn', 'lucia'])
    expect(state.slots[0].setup).toMatchObject({
      mindscape: 0, pool: 'full', engineId: 'qingming', refinement: 1,
      fourPieceId: 'yunkui', twoPieceId: 'woodpecker',
      mains: { slot4: 'critRate', slot5: 'etherDmg', slot6: 'hpPct' },
      substats: { critRate: 0, critDmg: 0, hpPct: 0 },
    })
    expect(state.slots[1].setup.engineId).toBe('yesterdayCalls')
    expect(state.slots[2].setup).toMatchObject({
      engineId: 'dreamlitHearth', substats: { hpPct: 0, hpFlat: 0 },
    })
    expect(isCompleteWorkbench(state)).toBe(true)
  })

  it('owns focus and preparation by position, not Agent identity', () => {
    const state = createPreparedState({}, ['lucia', 'yixuan', 'dialyn'], 2)
    expect(state.focusSlot).toBe(2)
    expect(state.slots.map(({ agentId }) => agentId)).toEqual(['lucia', 'yixuan', 'dialyn'])
    expect(state.slots.map(({ setup }) => setup.engineId)).toEqual([
      'dreamlitHearth', 'qingming', 'yesterdayCalls',
    ])
  })

  it('re-prepares only the targeted slot for Mindscape and pool changes', () => {
    let state = createPreparedState({ yixuan: 'nonLimited' })
    state = workbenchReducer(state, { type: 'setSubstat', slot: 0, key: 'critRate', value: 5 })
    const second = state.slots[1]
    const third = state.slots[2]

    state = workbenchReducer(state, { type: 'setMindscape', slot: 0, mindscape: 3 })
    expect(state.slots[1]).toBe(second)
    expect(state.slots[2]).toBe(third)
    expect(state.slots[0].setup).toMatchObject({
      mindscape: 3,
      pool: 'nonLimited',
      engineId: 'cauldron',
      refinement: 5,
      fourPieceId: 'yunkui',
      twoPieceId: 'woodpecker',
      mains: { slot4: 'critRate', slot5: 'etherDmg', slot6: 'hpPct' },
      substats: { critRate: 0, critDmg: 0, hpPct: 0 },
    })

    state = workbenchReducer(state, { type: 'switchPool', slot: 0, pool: 'full' })
    expect(state.slots[1]).toBe(second)
    expect(state.slots[2]).toBe(third)
    expect(state.slots[0].setup).toMatchObject({
      mindscape: 3,
      pool: 'full',
      engineId: 'qingming',
      refinement: 1,
      fourPieceId: 'yunkui',
      twoPieceId: 'branchAndBlade',
      mains: { slot4: 'critRate', slot5: 'etherDmg', slot6: 'hpPct' },
      substats: { critRate: 0, critDmg: 0, hpPct: 0 },
    })
  })

  it('edits one slot without resetting downstream setup inputs', () => {
    let state = createPreparedState()
    state = workbenchReducer(state, { type: 'setSubstat', slot: 0, key: 'hpPct', value: 7 })
    state = workbenchReducer(state, { type: 'selectMainStat', slot: 0, mainSlot: 'slot4', mainStatId: 'critDmg' })
    const before = state.slots[0].setup
    state = workbenchReducer(state, { type: 'selectEngine', slot: 0, engineId: 'cauldron' })
    expect(state.slots[0].setup).toMatchObject({
      engineId: 'cauldron', refinement: 5, fourPieceId: before.fourPieceId,
      twoPieceId: before.twoPieceId, mains: before.mains, substats: before.substats,
    })
  })

  it('edits refinement, Disc, and main stat without resetting unrelated slot inputs', () => {
    let state = createPreparedState()
    state = workbenchReducer(state, { type: 'setSubstat', slot: 0, key: 'critDmg', value: 4 })
    state = workbenchReducer(state, { type: 'setRefinement', slot: 0, refinement: 3 })
    state = workbenchReducer(state, {
      type: 'selectDisc', slot: 0, piece: 'twoPiece', discId: 'branchAndBlade',
    })
    state = workbenchReducer(state, {
      type: 'selectMainStat', slot: 0, mainSlot: 'slot5', mainStatId: 'hpPct',
    })

    expect(state.slots[0].setup).toMatchObject({
      refinement: 3,
      twoPieceId: 'branchAndBlade',
      mains: { slot4: 'critRate', slot5: 'hpPct', slot6: 'hpPct' },
      substats: { critRate: 0, critDmg: 4, hpPct: 0 },
    })
  })

  it('re-prepares authored Yixuan M1+ with Branch & Blade and returns to Woodpecker at M0', () => {
    let state = createPreparedState()
    const m0 = state.slots[0].setup

    state = workbenchReducer(state, { type: 'setMindscape', slot: 0, mindscape: 1 })
    expect(m0.twoPieceId).toBe('woodpecker')
    expect(state.slots[0].setup.twoPieceId).toBe('branchAndBlade')

    state = workbenchReducer(state, { type: 'setMindscape', slot: 0, mindscape: 6 })
    expect(state.slots[0].setup.twoPieceId).toBe('branchAndBlade')

    state = workbenchReducer(state, { type: 'setMindscape', slot: 0, mindscape: 0 })
    expect(state.slots[0].setup.twoPieceId).toBe('woodpecker')
    expect(workbenchReducer(state, { type: 'setMindscape', slot: 0, mindscape: 0 })).toBe(state)
  })

  it('clamps each offered effective substat independently and rejects unavailable ones', () => {
    const prepared = createPreparedState()
    const below = workbenchReducer(prepared, {
      type: 'adjustSubstat', slot: 2, key: 'hpFlat', delta: -1,
    })
    const above = workbenchReducer(prepared, {
      type: 'setSubstat', slot: 2, key: 'hpFlat', value: 99,
    })
    const invalid = workbenchReducer(prepared, {
      type: 'setSubstat', slot: 1, key: 'hpPct', value: 1,
    })

    expect(below.slots[2].setup.substats.hpFlat).toBe(0)
    expect(above.slots[2].setup.substats.hpFlat).toBe(36)
    expect(invalid).toBe(prepared)
  })

  it('checks exactly the applied setups and rejects invalid targeted choices', () => {
    const prepared = createPreparedState({ yixuan: 'nonLimited' })
    const incomplete = {
      ...prepared,
      slots: [...prepared.slots] as typeof prepared.slots,
    }
    incomplete.slots[2] = {
      ...incomplete.slots[2],
      setup: { ...incomplete.slots[2].setup, engineId: null },
    }
    expect(isCompleteWorkbench(incomplete)).toBe(false)

    expect(workbenchReducer(prepared, { type: 'selectEngine', slot: 0, engineId: 'qingming' })).toBe(prepared)
    expect(workbenchReducer(prepared, {
      type: 'selectDisc', slot: 2, piece: 'twoPiece', discId: 'woodpecker',
    })).toBe(prepared)
    expect(workbenchReducer(prepared, {
      type: 'selectMainStat', slot: 1, mainSlot: 'slot6', mainStatId: 'hpPct',
    })).toBe(prepared)
    expect(workbenchReducer(prepared, {
      type: 'setSubstat', slot: 1, key: 'hpPct', value: 1,
    })).toBe(prepared)
  })
})
