import { describe, expect, it } from 'vitest'
import { calculateParty } from './calculate'
import {
  effectiveMainStatIds,
  effectiveTwoPieceIds,
  incompleteRequiredSelections,
} from './candidates'
import {
  createPreparedState,
  isCompleteWorkbench,
  workbenchReducer,
} from './state'

describe('shared preparation and edit lifecycle', () => {
  it('rebuilds every holder on Party Apply but only the target on pool or Mindscape changes', () => {
    let state = createPreparedState()
    const original = state.slots

    state = workbenchReducer(state, { type: 'setMindscape', slot: 0, mindscape: 3 })
    expect(state.slots[0]).not.toBe(original[0])
    expect(state.slots[1]).toBe(original[1])
    expect(state.slots[2]).toBe(original[2])

    const beforePool = state.slots
    state = workbenchReducer(state, { type: 'switchPool', slot: 1, pool: 'nonLimited' })
    expect(state.slots[0]).toBe(beforePool[0])
    expect(state.slots[1]).not.toBe(beforePool[1])
    expect(state.slots[2]).toBe(beforePool[2])

    const beforeApply = state.slots
    state = workbenchReducer(state, { type: 'openPartyEdit' })
    state = workbenchReducer(state, {
      type: 'replaceDraftAgent', slot: 0, agentId: 'anbySoldier0',
    })
    state = workbenchReducer(state, { type: 'applyPartyEdit' })

    expect(state.slots.map(({ agentId }) => agentId)).toEqual([
      'anbySoldier0', 'dialyn', 'lucia',
    ])
    expect(state.slots.every((slot, index) => slot !== beforeApply[index])).toBe(true)
    expect(isCompleteWorkbench(state)).toBe(true)
  })

  it('keeps direct edits local and never re-prepares unrelated inputs', () => {
    let state = createPreparedState()
    state = workbenchReducer(state, {
      type: 'setSubstat', slot: 0, key: 'hpPct', value: 7,
    })
    state = workbenchReducer(state, {
      type: 'selectMainStat', slot: 0, mainSlot: 'slot4', mainStatId: 'critDmg',
    })
    const before = state.slots[0].setup
    const otherHolders = state.slots.slice(1)

    state = workbenchReducer(state, {
      type: 'selectEngine', slot: 0, engineId: 'cauldron',
    })

    expect(state.slots[0].setup).toMatchObject({
      engineId: 'cauldron',
      mains: before.mains,
      substats: before.substats,
      fourPieceId: before.fourPieceId,
      twoPieceId: before.twoPieceId,
    })
    expect(state.slots.slice(1)).toEqual(otherHolders)
  })

  it('clears an invalid same-effect selection without fallback or edit-history restoration', () => {
    let state = createPreparedState({}, ['yixuan', 'panYinhu', 'juFufu'], 0)
    state = workbenchReducer(state, {
      type: 'selectDisc', slot: 1, piece: 'twoPiece', discId: 'hormonePunk',
    })
    state = workbenchReducer(state, {
      type: 'selectDisc', slot: 1, piece: 'fourPiece', discId: 'bunnyInWonderland',
    })

    expect(state.slots[1].setup.twoPieceId).toBeNull()
    expect(calculateParty(state)).toBeNull()
    expect(effectiveTwoPieceIds(state, 1)).toEqual(['swingJazz', 'astralVoice'])

    state = workbenchReducer(state, {
      type: 'selectDisc', slot: 1, piece: 'fourPiece', discId: 'astralVoice',
    })
    expect(state.slots[1].setup.twoPieceId).toBeNull()
    expect(effectiveTwoPieceIds(state, 1)).toEqual(['swingJazz', 'hormonePunk'])

    state = workbenchReducer(state, {
      type: 'selectDisc', slot: 1, piece: 'twoPiece', discId: 'hormonePunk',
    })
    expect(calculateParty(state)).not.toBeNull()
  })

  it('reconciles pressure after the edited source, preserves empty Result, and requires reselection', () => {
    let state = createPreparedState({}, ['anbySoldier0', 'trigger', 'dialyn'], 0)
    state = workbenchReducer(state, {
      type: 'selectEngine', slot: 1, engineId: 'iceJadeTeapot',
    })
    for (const slot of [0, 1, 2] as const) {
      state = workbenchReducer(state, {
        type: 'selectMainStat', slot, mainSlot: 'slot5', mainStatId: 'penRatio',
      })
    }

    state = workbenchReducer(state, {
      type: 'selectEngine', slot: 1, engineId: 'spectralGaze',
    })
    expect(incompleteRequiredSelections(state)).toHaveLength(3)
    expect(state.slots.map(({ setup }) => setup.mains.slot5)).toEqual([null, null, null])
    expect(calculateParty(state)).toBeNull()

    state = workbenchReducer(state, {
      type: 'selectEngine', slot: 1, engineId: 'iceJadeTeapot',
    })
    expect(state.slots.map(({ setup }) => setup.mains.slot5)).toEqual([null, null, null])
    expect(effectiveMainStatIds(state, 0, 'slot5')).toContain('penRatio')

    const replacements = ['electricDmg', 'electricDmg', 'atkPct'] as const
    replacements.forEach((mainStatId, slot) => {
      state = workbenchReducer(state, {
        type: 'selectMainStat', slot: slot as 0 | 1 | 2, mainSlot: 'slot5', mainStatId,
      })
    })
    expect(incompleteRequiredSelections(state)).toEqual([])
    expect(calculateParty(state)).not.toBeNull()

    let sheerContrast = createPreparedState({}, ['yixuan', 'trigger', 'dialyn'], 0)
    const before = effectiveMainStatIds(sheerContrast, 0, 'slot5')
    sheerContrast = workbenchReducer(sheerContrast, {
      type: 'selectEngine', slot: 1, engineId: 'spectralGaze',
    })
    expect(effectiveMainStatIds(sheerContrast, 0, 'slot5')).toEqual(before)
  })

  it('initializes finite substat opportunities at zero and clamps only offered inputs', () => {
    const prepared = createPreparedState()
    expect(Object.values(prepared.slots[0].setup.substats).every((value) => value === 0))
      .toBe(true)

    const capped = workbenchReducer(prepared, {
      type: 'setSubstat', slot: 2, key: 'hpFlat', value: 99,
    })
    expect(capped.slots[2].setup.substats.hpFlat).toBe(36)

    const rejected = workbenchReducer(prepared, {
      type: 'setSubstat', slot: 1, key: 'hpPct', value: 1,
    })
    expect(rejected).toBe(prepared)
  })

  it('keeps draft changes isolated and requires an explicit Focus before Apply', () => {
    let state = createPreparedState()
    const applied = state.slots
    state = workbenchReducer(state, { type: 'openPartyEdit' })
    state = workbenchReducer(state, {
      type: 'replaceDraftAgent', slot: 1, agentId: 'seed',
    })
    state = workbenchReducer(state, {
      type: 'replaceDraftAgent', slot: 2, agentId: 'evelyn',
    })

    expect(state.slots).toBe(applied)
    expect(state.draft?.focusSlot).toBeNull()
    expect(workbenchReducer(state, { type: 'applyPartyEdit' })).toBe(state)

    state = workbenchReducer(state, { type: 'setDraftFocus', slot: 1 })
    state = workbenchReducer(state, { type: 'applyPartyEdit' })
    expect(state.slots.map(({ agentId }) => agentId)).toEqual(['yixuan', 'seed', 'evelyn'])
    expect(state.focusSlot).toBe(1)
  })
})
