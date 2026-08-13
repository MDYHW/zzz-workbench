import { describe, expect, it } from 'vitest'
import {
  effectiveFourPieceIds,
  effectiveMainStatIds,
  effectiveSubstatChoicesForSlot,
  effectiveTwoPieceIds,
} from './candidates'
import { createPreparedState, isCompleteWorkbench, workbenchReducer } from './state'

describe('selected King pressure', () => {
  it('adds and then clears Lighter CRIT pressure without restoring prior investment', () => {
    let state = createPreparedState({}, ['soldier11', 'lighter', 'lucy'], 0)
    expect(state.slots.map(({ setup }) => setup)).toMatchObject([
      { engineId: 'heartstringNocturne', fourPieceId: 'woodpecker', twoPieceId: 'pufferElectro' },
      { engineId: 'blazingLaurel', fourPieceId: 'astralVoice', twoPieceId: 'shockstar' },
      { engineId: 'kaboom', refinement: 5, fourPieceId: 'moonlight', twoPieceId: 'astralVoice' },
    ])
    expect(effectiveSubstatChoicesForSlot(state, 1)).toEqual([])

    state = workbenchReducer(state, {
      type: 'selectDisc', slot: 1, piece: 'fourPiece', discId: 'king',
    })
    expect(effectiveTwoPieceIds(state, 1)).toContain('woodpecker')
    expect(effectiveMainStatIds(state, 1, 'slot4')).toContain('critRate')
    expect(effectiveSubstatChoicesForSlot(state, 1).map(({ id }) => id)).toEqual(['critRate'])

    state = workbenchReducer(state, {
      type: 'selectDisc', slot: 1, piece: 'twoPiece', discId: 'woodpecker',
    })
    state = workbenchReducer(state, {
      type: 'selectMainStat', slot: 1, mainSlot: 'slot4', mainStatId: 'critRate',
    })
    state = workbenchReducer(state, { type: 'setSubstat', slot: 1, key: 'critRate', value: 7 })

    state = workbenchReducer(state, {
      type: 'selectDisc', slot: 1, piece: 'fourPiece', discId: 'astralVoice',
    })
    expect(state.slots[1].setup).toMatchObject({
      fourPieceId: 'astralVoice', twoPieceId: null,
      mains: { slot4: null }, substats: {},
    })
    expect(isCompleteWorkbench(state)).toBe(false)

    state = workbenchReducer(state, {
      type: 'selectDisc', slot: 1, piece: 'fourPiece', discId: 'king',
    })
    expect(effectiveSubstatChoicesForSlot(state, 1).map(({ id }) => id)).toEqual(['critRate'])
    expect(state.slots[1].setup.substats.critRate).toBe(0)
  })
})

describe('contextual Disc candidates', () => {
  it('admits Soldier 11 Puffer only with Dialyn Ultimate opportunity', () => {
    const withDialyn = createPreparedState({}, ['soldier11', 'dialyn', 'lucy'], 0)
    const withoutDialyn = createPreparedState({}, ['soldier11', 'lighter', 'lucy'], 0)

    expect(effectiveFourPieceIds(withDialyn, 0)).toContain('pufferElectro')
    expect(effectiveFourPieceIds(withoutDialyn, 0)).not.toContain('pufferElectro')
  })
})
