import { describe, expect, it } from 'vitest'
import {
  DISC_IDS_BY_AGENT_AND_PIECE,
  ENGINE_IDS_BY_AGENT_AND_POOL,
  MAIN_STAT_IDS_BY_AGENT_AND_SLOT,
} from './content'
import {
  effectiveMainStatIds,
  incompleteMainStatSelections,
} from './candidates'
import { calculateParty } from './calculate'
import { createPreparedState, isCompleteWorkbench, workbenchReducer } from './state'

describe('workbench state lifecycle', () => {
  it('keeps the admitted candidates distinct from the exact three prepared slots', () => {
    expect(ENGINE_IDS_BY_AGENT_AND_POOL.yixuan.full).toEqual([
      'qingming', 'cauldron', 'radiowave', 'puzzleSphere',
    ])
    expect(DISC_IDS_BY_AGENT_AND_PIECE.yixuan).toEqual({
      fourPiece: ['yunkui'], twoPiece: ['woodpecker', 'branchAndBlade'],
    })
    expect(DISC_IDS_BY_AGENT_AND_PIECE.trigger).toEqual({
      fourPiece: ['king', 'astralVoice', 'shockstar'], twoPiece: ['shockstar', 'king', 'woodpecker', 'swingJazz', 'moonlight'],
    })
    expect(ENGINE_IDS_BY_AGENT_AND_POOL.dialyn).toEqual({
      full: ['yesterdayCalls', 'hellfireGears', 'steamOven', 'preciousFossilizedCore'],
      nonLimited: ['hellfireGears', 'steamOven', 'preciousFossilizedCore'],
    })
    expect(DISC_IDS_BY_AGENT_AND_PIECE.dialyn).toEqual({
      fourPiece: ['king'], twoPiece: ['woodpecker', 'swingJazz', 'moonlight'],
    })
    expect(ENGINE_IDS_BY_AGENT_AND_POOL.trigger).toEqual({
      full: ['spectralGaze', 'iceJadeTeapot', 'restrained', 'preciousFossilizedCore', 'steamOven'],
      nonLimited: ['restrained', 'preciousFossilizedCore', 'steamOven'],
    })
    expect(DISC_IDS_BY_AGENT_AND_PIECE.astraYao).toEqual({
      fourPiece: ['astralVoice', 'moonlight'],
      twoPiece: ['moonlight', 'swingJazz', 'hormonePunk', 'astralVoice'],
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

  it('owns an isolated draft lifecycle and prepares all slots only when it applies', () => {
    let state = createPreparedState()
    state = workbenchReducer(state, { type: 'setMindscape', slot: 0, mindscape: 3 })
    state = workbenchReducer(state, { type: 'switchPool', slot: 1, pool: 'nonLimited' })
    const applied = state.slots
    state = workbenchReducer(state, { type: 'openPartyEdit' })
    expect(state.draft?.agentIds).toEqual(['yixuan', 'dialyn', 'lucia'])
    state = workbenchReducer(state, { type: 'replaceDraftAgent', slot: 0, agentId: 'anbySoldier0' })
    expect(state.slots).toBe(applied)
    expect(state.draft).toMatchObject({ agentIds: ['anbySoldier0', 'dialyn', 'lucia'], focusSlot: 0 })
    state = workbenchReducer(state, { type: 'closePartyEdit' })
    expect(state.slots).toBe(applied)

    state = workbenchReducer(state, { type: 'openPartyEdit' })
    state = workbenchReducer(state, { type: 'replaceDraftAgent', slot: 0, agentId: 'anbySoldier0' })
    state = workbenchReducer(state, { type: 'applyPartyEdit' })
    expect(state.slots.map(({ agentId }) => agentId)).toEqual(['anbySoldier0', 'dialyn', 'lucia'])
    expect(state.slots[0].setup).toMatchObject({ mindscape: 0, pool: 'full', engineId: 'severedInnocence' })
    expect(state.slots[1].setup).toMatchObject({ mindscape: 0, pool: 'nonLimited', engineId: 'hellfireGears' })
    expect(state.draft).toBeUndefined()
  })

  it('requires an explicit focus after the eligible draft set changes and rejects unresolved drafts', () => {
    let state = createPreparedState()
    state = workbenchReducer(state, { type: 'openPartyEdit' })
    state = workbenchReducer(state, { type: 'replaceDraftAgent', slot: 1, agentId: 'anbySoldier0' })
    expect(state.draft?.focusSlot).toBeNull()
    expect(workbenchReducer(state, { type: 'applyPartyEdit' })).toBe(state)

    state = workbenchReducer(state, { type: 'setDraftFocus', slot: 1 })
    state = workbenchReducer(state, { type: 'applyPartyEdit' })
    expect(state.focusSlot).toBe(1)
    expect(state.slots.map(({ agentId }) => agentId)).toEqual(['yixuan', 'anbySoldier0', 'lucia'])

    state = workbenchReducer(state, { type: 'openPartyEdit' })
    state = workbenchReducer(state, { type: 'replaceDraftAgent', slot: 0, agentId: 'astraYao' })
    expect(state.draft?.focusSlot).toBe(1)
    expect(workbenchReducer(state, { type: 'setDraftFocus', slot: 0 })).toBe(state)
  })

  it('applies a focus-only draft and re-prepares every applied setup', () => {
    let state = createPreparedState({}, ['yixuan', 'anbySoldier0', 'lucia'], 0)
    state = workbenchReducer(state, { type: 'setRefinement', slot: 0, refinement: 3 })
    state = workbenchReducer(state, { type: 'setRefinement', slot: 1, refinement: 3 })
    state = workbenchReducer(state, { type: 'setRefinement', slot: 2, refinement: 3 })

    state = workbenchReducer(state, { type: 'openPartyEdit' })
    state = workbenchReducer(state, { type: 'setDraftFocus', slot: 1 })
    state = workbenchReducer(state, { type: 'applyPartyEdit' })

    expect(state.focusSlot).toBe(1)
    expect(state.slots.map(({ setup }) => setup.refinement)).toEqual([1, 1, 1])
    expect(state.slots.map(({ agentId }) => agentId)).toEqual(['yixuan', 'anbySoldier0', 'lucia'])
  })

  it('preserves an explicit draft focus only when replacing an ineligible member', () => {
    let state = createPreparedState({}, ['yixuan', 'anbySoldier0', 'lucia'], 1)
    state = workbenchReducer(state, { type: 'openPartyEdit' })
    state = workbenchReducer(state, { type: 'replaceDraftAgent', slot: 2, agentId: 'trigger' })
    expect(state.draft).toMatchObject({ agentIds: ['yixuan', 'anbySoldier0', 'trigger'], focusSlot: 1 })

    state = workbenchReducer(state, { type: 'replaceDraftAgent', slot: 0, agentId: 'astraYao' })
    expect(state.draft?.focusSlot).toBe(1)
  })

  it('swaps overlapping Trigger Disc roles only when both resulting roles admit the pair', () => {
    let state = createPreparedState({}, ['anbySoldier0', 'trigger', 'astraYao'], 0)
    state = workbenchReducer(state, {
      type: 'selectDisc', slot: 1, piece: 'fourPiece', discId: 'shockstar',
    })
    expect(state.slots[1].setup).toMatchObject({ fourPieceId: 'shockstar', twoPieceId: 'king' })

    state = workbenchReducer(state, {
      type: 'selectDisc', slot: 1, piece: 'twoPiece', discId: 'shockstar',
    })
    expect(state.slots[1].setup).toMatchObject({ fourPieceId: 'king', twoPieceId: 'shockstar' })

    const withDialyn = createPreparedState({}, ['anbySoldier0', 'trigger', 'dialyn'], 0)
    expect(workbenchReducer(withDialyn, {
      type: 'selectDisc', slot: 1, piece: 'twoPiece', discId: 'astralVoice',
    })).toBe(withDialyn)
  })

  it('prepares Trigger identically across applied parties without rewriting direct engine edits', () => {
    let state = createPreparedState({}, ['anbySoldier0', 'trigger', 'dialyn'], 0)
    expect(state.slots[1].setup).toMatchObject({ fourPieceId: 'king', twoPieceId: 'shockstar' })

    state = workbenchReducer(state, { type: 'selectEngine', slot: 1, engineId: 'iceJadeTeapot' })
    expect(state.slots[1].setup).toMatchObject({ engineId: 'iceJadeTeapot', fourPieceId: 'king', twoPieceId: 'shockstar' })

    const withAstra = createPreparedState({}, ['dialyn', 'trigger', 'astraYao'], 0)
    expect(withAstra.slots[1].setup).toMatchObject({ fourPieceId: 'king', twoPieceId: 'shockstar' })
  })

  it('invalidates every selected DEF-region PEN main atomically when broad pre-PEN pressure activates', () => {
    let state = createPreparedState({}, ['anbySoldier0', 'trigger', 'dialyn'], 0)
    state = workbenchReducer(state, {
      type: 'selectEngine', slot: 1, engineId: 'iceJadeTeapot',
    })
    state = workbenchReducer(state, {
      type: 'selectMainStat', slot: 0, mainSlot: 'slot5', mainStatId: 'penRatio',
    })
    state = workbenchReducer(state, {
      type: 'selectMainStat', slot: 2, mainSlot: 'slot5', mainStatId: 'penRatio',
    })
    state = workbenchReducer(state, {
      type: 'selectDisc', slot: 1, piece: 'fourPiece', discId: 'shockstar',
    })
    state = workbenchReducer(state, {
      type: 'selectMainStat', slot: 1, mainSlot: 'slot5', mainStatId: 'penRatio',
    })
    state = workbenchReducer(state, {
      type: 'setSubstat', slot: 1, key: 'critRate', value: 7,
    })
    state = workbenchReducer(state, {
      type: 'setRefinement', slot: 1, refinement: 3,
    })

    expect(effectiveMainStatIds(state, 0, 'slot5')).toContain('penRatio')
    expect(effectiveMainStatIds(state, 1, 'slot5')).toContain('penRatio')
    expect(effectiveMainStatIds(state, 2, 'slot5')).toContain('penRatio')
    const anbyBefore = state.slots[0].setup
    const triggerBefore = state.slots[1].setup
    const dialynBefore = state.slots[2].setup

    state = workbenchReducer(state, {
      type: 'selectEngine', slot: 1, engineId: 'spectralGaze',
    })

    expect(state.slots[1].setup).toEqual({
      ...triggerBefore,
      engineId: 'spectralGaze',
      refinement: 1,
      mains: { ...triggerBefore.mains, slot5: null },
    })
    expect(state.slots[0].setup).toEqual({
      ...anbyBefore,
      mains: { ...anbyBefore.mains, slot5: null },
    })
    expect(state.slots[2].setup).toEqual({
      ...dialynBefore,
      mains: { ...dialynBefore.mains, slot5: null },
    })
    expect(incompleteMainStatSelections(state)).toEqual([
      { slot: 0, agentId: 'anbySoldier0', mainSlot: 'slot5' },
      { slot: 1, agentId: 'trigger', mainSlot: 'slot5' },
      { slot: 2, agentId: 'dialyn', mainSlot: 'slot5' },
    ])
    expect(effectiveMainStatIds(state, 0, 'slot5')).not.toContain('penRatio')
    expect(effectiveMainStatIds(state, 1, 'slot5')).not.toContain('penRatio')
    expect(effectiveMainStatIds(state, 2, 'slot5')).not.toContain('penRatio')
    expect(isCompleteWorkbench(state)).toBe(false)
    expect(calculateParty(state)).toBeNull()

    const rejectedPen = workbenchReducer(state, {
      type: 'selectMainStat', slot: 0, mainSlot: 'slot5', mainStatId: 'penRatio',
    })
    expect(rejectedPen).toBe(state)
    expect(rejectedPen.slots[0].setup.mains.slot5).toBeNull()
    expect(calculateParty(rejectedPen)).toBeNull()

    let partyPrepared = workbenchReducer(state, { type: 'openPartyEdit' })
    partyPrepared = workbenchReducer(partyPrepared, {
      type: 'replaceDraftAgent', slot: 2, agentId: 'astraYao',
    })
    partyPrepared = workbenchReducer(partyPrepared, { type: 'applyPartyEdit' })
    expect(incompleteMainStatSelections(partyPrepared)).toEqual([])
    expect(partyPrepared.slots[0].setup.mains.slot5).toBe('electricDmg')
    expect(partyPrepared.slots[2]).toMatchObject({
      agentId: 'astraYao',
      setup: { mains: { slot5: 'atkPct' } },
    })
    expect(isCompleteWorkbench(partyPrepared)).toBe(true)
    expect(calculateParty(partyPrepared)).not.toBeNull()

    const pressureRemoved = workbenchReducer(state, {
      type: 'selectEngine', slot: 1, engineId: 'iceJadeTeapot',
    })
    expect(effectiveMainStatIds(pressureRemoved, 0, 'slot5')).toContain('penRatio')
    expect(effectiveMainStatIds(pressureRemoved, 1, 'slot5')).toContain('penRatio')
    expect(effectiveMainStatIds(pressureRemoved, 2, 'slot5')).toContain('penRatio')
    expect(incompleteMainStatSelections(pressureRemoved)).toHaveLength(3)
    expect(pressureRemoved.slots[0].setup.mains.slot5).toBeNull()
    expect(pressureRemoved.slots[1].setup.mains.slot5).toBeNull()
    expect(pressureRemoved.slots[2].setup.mains.slot5).toBeNull()
    expect(calculateParty(pressureRemoved)).toBeNull()

    state = workbenchReducer(state, {
      type: 'selectMainStat', slot: 0, mainSlot: 'slot5', mainStatId: 'electricDmg',
    })
    expect(incompleteMainStatSelections(state)).toEqual([
      { slot: 1, agentId: 'trigger', mainSlot: 'slot5' },
      { slot: 2, agentId: 'dialyn', mainSlot: 'slot5' },
    ])
    expect(calculateParty(state)).toBeNull()

    state = workbenchReducer(state, {
      type: 'selectMainStat', slot: 2, mainSlot: 'slot5', mainStatId: 'atkPct',
    })
    expect(incompleteMainStatSelections(state)).toEqual([
      { slot: 1, agentId: 'trigger', mainSlot: 'slot5' },
    ])
    expect(calculateParty(state)).toBeNull()

    state = workbenchReducer(state, {
      type: 'selectMainStat', slot: 1, mainSlot: 'slot5', mainStatId: 'electricDmg',
    })
    expect(incompleteMainStatSelections(state)).toEqual([])
    expect(isCompleteWorkbench(state)).toBe(true)
    expect(calculateParty(state)).not.toBeNull()
  })

  it('keeps Cordis action scope from excluding PEN and composes provider order independently', () => {
    let cordisOnly = createPreparedState({}, ['anbySoldier0', 'trigger', 'dialyn'], 0)
    cordisOnly = workbenchReducer(cordisOnly, {
      type: 'selectEngine', slot: 0, engineId: 'cordisGermina',
    })
    cordisOnly = workbenchReducer(cordisOnly, {
      type: 'selectEngine', slot: 1, engineId: 'iceJadeTeapot',
    })
    expect(effectiveMainStatIds(cordisOnly, 0, 'slot5')).toContain('penRatio')
    expect(effectiveMainStatIds(cordisOnly, 1, 'slot5')).toContain('penRatio')
    expect(effectiveMainStatIds(cordisOnly, 2, 'slot5')).toContain('penRatio')

    const withSpectral = workbenchReducer(cordisOnly, {
      type: 'selectEngine', slot: 1, engineId: 'spectralGaze',
    })
    expect(effectiveMainStatIds(withSpectral, 0, 'slot5')).not.toContain('penRatio')
    expect(effectiveMainStatIds(withSpectral, 1, 'slot5')).not.toContain('penRatio')
    expect(effectiveMainStatIds(withSpectral, 2, 'slot5')).not.toContain('penRatio')

    let reversed = createPreparedState({}, ['dialyn', 'trigger', 'anbySoldier0'], 2)
    reversed = workbenchReducer(reversed, {
      type: 'selectEngine', slot: 2, engineId: 'cordisGermina',
    })
    expect(effectiveMainStatIds(reversed, 0, 'slot5')).not.toContain('penRatio')
    expect(effectiveMainStatIds(reversed, 1, 'slot5')).not.toContain('penRatio')
    expect(effectiveMainStatIds(reversed, 2, 'slot5')).not.toContain('penRatio')
  })

  it('leaves sheer-damage setup candidates unchanged under broad pre-PEN pressure', () => {
    const state = createPreparedState({}, ['yixuan', 'trigger', 'astraYao'], 0)

    expect(effectiveMainStatIds(state, 0, 'slot5')).toEqual(
      MAIN_STAT_IDS_BY_AGENT_AND_SLOT.yixuan.slot5,
    )
    expect(incompleteMainStatSelections(state)).toEqual([])
    expect(isCompleteWorkbench(state)).toBe(true)
  })

  it('re-prepares only the Mindscape target before reconciling its outgoing pressure', () => {
    let state = createPreparedState({}, ['anbySoldier0', 'trigger', 'dialyn'], 0)
    state = workbenchReducer(state, {
      type: 'selectEngine', slot: 1, engineId: 'iceJadeTeapot',
    })
    state = workbenchReducer(state, {
      type: 'selectMainStat', slot: 0, mainSlot: 'slot5', mainStatId: 'penRatio',
    })
    state = workbenchReducer(state, {
      type: 'selectMainStat', slot: 2, mainSlot: 'slot5', mainStatId: 'penRatio',
    })
    state = workbenchReducer(state, {
      type: 'setSubstat', slot: 0, key: 'critDmg', value: 4,
    })
    state = workbenchReducer(state, {
      type: 'setSubstat', slot: 2, key: 'critRate', value: 5,
    })

    state = workbenchReducer(state, {
      type: 'setMindscape', slot: 1, mindscape: 1,
    })

    expect(state.slots[1].setup).toMatchObject({
      mindscape: 1,
      engineId: 'spectralGaze',
      refinement: 1,
      fourPieceId: 'king',
      twoPieceId: 'shockstar',
      substats: { critRate: 0 },
    })
    expect(state.slots[0].setup).toMatchObject({
      mindscape: 0,
      mains: { slot5: null },
      substats: { critDmg: 4 },
    })
    expect(state.slots[2].setup).toMatchObject({
      mindscape: 0,
      mains: { slot5: null },
      substats: { critRate: 5 },
    })

    state = workbenchReducer(state, {
      type: 'setMindscape', slot: 0, mindscape: 2,
    })
    expect(state.slots[0].setup.mains.slot5).toBe('electricDmg')
    expect(state.slots[2].setup.mains.slot5).toBeNull()
    expect(isCompleteWorkbench(state)).toBe(false)

    state = workbenchReducer(state, {
      type: 'switchPool', slot: 2, pool: 'nonLimited',
    })
    expect(state.slots[2].setup.mains.slot5).toBe('atkPct')
    expect(isCompleteWorkbench(state)).toBe(true)
  })

  it('authors complete full and non-limited second-vertical packages', () => {
    const full = createPreparedState({}, ['anbySoldier0', 'trigger', 'astraYao'], 0)
    expect(full.slots.map(({ setup }) => ({
      engineId: setup.engineId,
      fourPieceId: setup.fourPieceId,
      twoPieceId: setup.twoPieceId,
      mains: setup.mains,
      substats: setup.substats,
    }))).toEqual([
      { engineId: 'severedInnocence', fourPieceId: 'shadowHarmony', twoPieceId: 'woodpecker', mains: { slot4: 'critRate', slot5: 'electricDmg', slot6: 'atkPct' }, substats: { critRate: 0, critDmg: 0, atkPct: 0 } },
      { engineId: 'spectralGaze', fourPieceId: 'king', twoPieceId: 'shockstar', mains: { slot4: 'critRate', slot5: 'electricDmg', slot6: 'impact' }, substats: { critRate: 0 } },
      { engineId: 'elegantVanity', fourPieceId: 'astralVoice', twoPieceId: 'moonlight', mains: { slot4: 'atkPct', slot5: 'atkPct', slot6: 'atkPct' }, substats: { atkPct: 0, atkFlat: 0 } },
    ])

    const nonLimited = createPreparedState({ anbySoldier0: 'nonLimited', trigger: 'nonLimited', astraYao: 'nonLimited' }, ['anbySoldier0', 'trigger', 'astraYao'], 0)
    expect(nonLimited.slots.map(({ setup }) => [setup.engineId, setup.fourPieceId, setup.twoPieceId])).toEqual([
      ['marcatoDesire', 'shadowHarmony', 'branchAndBlade'],
      ['restrained', 'king', 'shockstar'],
      ['bashfulDemon', 'astralVoice', 'hormonePunk'],
    ])

    const astraM2 = workbenchReducer(full, { type: 'setMindscape', slot: 2, mindscape: 2 })
    expect(astraM2.slots[2].setup.mains.slot6).toBe('energyRegenPct')
  })
})
