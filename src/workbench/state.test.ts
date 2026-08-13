import { describe, expect, it } from 'vitest'
import { MAIN_STAT_IDS_BY_AGENT_AND_SLOT } from './content'
import {
  effectiveFourPieceIds,
  effectiveMainStatIds,
  effectiveSubstatChoices,
  effectiveSubstatChoicesForSlot,
  effectiveTwoPieceIds,
  incompleteRequiredSelections,
  invalidRequiredSelections,
} from './candidates'
import { calculateParty } from './calculate'
import { agent, metric } from './calculate.test-support'
import { activeCandidatePressures, resolveSeedVanguardForState } from './provider-effects'
import {
  createPreparedAgentSetup,
  createPreparedState,
  isCompleteWorkbench,
  workbenchReducer,
} from './state'

describe('workbench state lifecycle', () => {
  it('adds Ellen’s Puffer candidate only with Dialyn and reprepares after party replacement', () => {
    let state = createPreparedState({}, ['ellen', 'dialyn', 'soukaku'], 0)
    expect(effectiveFourPieceIds(state, 0)).toContain('pufferElectro')
    state = workbenchReducer(state, { type: 'selectDisc', slot: 0, piece: 'fourPiece', discId: 'pufferElectro' })
    expect(state.slots[0].setup.fourPieceId).toBe('pufferElectro')
    state = workbenchReducer(state, { type: 'openPartyEdit' })
    state = workbenchReducer(state, { type: 'replaceDraftAgent', slot: 1, agentId: 'lycaon' })
    state = workbenchReducer(state, { type: 'applyPartyEdit' })
    expect(effectiveFourPieceIds(state, 0)).not.toContain('pufferElectro')
    expect(state.slots[0].setup.fourPieceId).toBe('woodpecker')
    state = workbenchReducer(state, { type: 'openPartyEdit' })
    state = workbenchReducer(state, { type: 'replaceDraftAgent', slot: 1, agentId: 'dialyn' })
    state = workbenchReducer(state, { type: 'applyPartyEdit' })
    expect(effectiveFourPieceIds(state, 0)).toContain('pufferElectro')
    expect(state.slots[0].setup.fourPieceId).toBe('woodpecker')
  })

  it('keeps the prepared Ellen and Soukaku party complete', () => {
    const state = createPreparedState({}, ['ellen', 'soukaku', 'lycaon'], 0)
    expect(incompleteRequiredSelections(state)).toEqual([])
    expect(invalidRequiredSelections(state)).toEqual([])
  })

  it('rebuilds pressure-safe packages on Nicole party changes without repairing direct edits', () => {
    let state = createPreparedState({}, ['zhuYuan', 'nicole', 'dialyn'], 0)
    expect(state.slots[0].setup).toMatchObject({
      mains: { slot4: 'critDmg', slot5: 'atkPct' },
    })
    expect(effectiveTwoPieceIds(state, 0)).not.toContain('pufferElectro')
    const zhuBeforeNicoleMindscape = state.slots[0]
    state = workbenchReducer(state, { type: 'setMindscape', slot: 1, mindscape: 0 })
    expect(state.slots[0]).toBe(zhuBeforeNicoleMindscape)

    state = workbenchReducer(state, { type: 'openPartyEdit' })
    state = workbenchReducer(state, { type: 'replaceDraftAgent', slot: 1, agentId: 'lucy' })
    state = workbenchReducer(state, { type: 'applyPartyEdit' })
    expect(state.slots[0].setup.mains.slot5).toBe('atkPct')
    expect(effectiveMainStatIds(state, 0, 'slot5')).toContain('penRatio')
    state = workbenchReducer(state, {
      type: 'selectMainStat', slot: 0, mainSlot: 'slot5', mainStatId: 'penRatio',
    })

    state = workbenchReducer(state, { type: 'openPartyEdit' })
    state = workbenchReducer(state, { type: 'replaceDraftAgent', slot: 1, agentId: 'nicole' })
    state = workbenchReducer(state, { type: 'applyPartyEdit' })
    expect(state.slots[0].setup).toMatchObject({
      mindscape: 0, mains: { slot5: 'atkPct' },
      twoPieceId: 'branchAndBlade',
    })
    expect(isCompleteWorkbench(state)).toBe(true)
  })

  it('keeps the exported Trigger helper at the local representative baseline', () => {
    expect(createPreparedAgentSetup('trigger')).toMatchObject({
      engineId: 'spectralGaze', fourPieceId: 'king', twoPieceId: 'shockstar',
    })
  })

  it('prepares the exact three initial slots as a complete workbench', () => {
    const state = createPreparedState()
    expect(state.focusSlot).toBe(0)
    expect(state.slots.map(({ agentId }) => agentId)).toEqual(['yixuan', 'dialyn', 'lucia'])
    expect(state.slots[0].setup).toMatchObject({
      mindscape: 0, pool: 'full', engineId: 'qingming', refinement: 1,
      fourPieceId: 'yunkui', twoPieceId: 'branchAndBlade',
      mains: { slot4: 'critRate', slot5: 'etherDmg', slot6: 'hpPct' },
      substats: { critRate: 0, critDmg: 0, hpPct: 0 },
    })
    expect(state.slots[1].setup.engineId).toBe('yesterdayCalls')
    expect(state.slots[2].setup).toMatchObject({
      engineId: 'dreamlitHearth', fourPieceId: 'moonlight', twoPieceId: 'yunkui',
      mains: { slot4: 'hpPct', slot5: 'hpPct', slot6: 'hpPct' },
      substats: { hpPct: 0, hpFlat: 0 },
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
      twoPieceId: 'branchAndBlade',
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
      twoPieceId: 'woodpecker',
      mains: { slot4: 'critDmg', slot5: 'etherDmg', slot6: 'hpPct' },
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

  it("keeps Lucia's prepared Moonlight/Yunkui package while allowing a local Swing Jazz 2-piece edit", () => {
    const prepared = createPreparedState()
    const before = prepared.slots[2].setup
    const state = workbenchReducer(prepared, {
      type: 'selectDisc', slot: 2, piece: 'twoPiece', discId: 'swingJazz',
    })

    expect(state.slots[2].setup).toEqual({ ...before, twoPieceId: 'swingJazz' })
  })

  it('rebalances Yixuan across pool and Mindscape preparation boundaries', () => {
    let state = createPreparedState()
    const m0 = state.slots[0].setup

    state = workbenchReducer(state, { type: 'setMindscape', slot: 0, mindscape: 1 })
    expect(m0).toMatchObject({
      twoPieceId: 'branchAndBlade', mains: { slot4: 'critRate' },
    })
    expect(state.slots[0].setup).toMatchObject({
      twoPieceId: 'woodpecker', mains: { slot4: 'critDmg' },
    })

    state = workbenchReducer(state, { type: 'setMindscape', slot: 0, mindscape: 6 })
    expect(state.slots[0].setup).toMatchObject({
      twoPieceId: 'woodpecker', mains: { slot4: 'critDmg' },
    })

    state = workbenchReducer(state, { type: 'setMindscape', slot: 0, mindscape: 0 })
    expect(state.slots[0].setup).toMatchObject({
      twoPieceId: 'branchAndBlade', mains: { slot4: 'critRate' },
    })
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

  it('rebuilds qualified, unqualified, and requalified Lucia parties without restoring edits', () => {
    let state = createPreparedState({}, ['lucia', 'corin', 'dialyn'], 1)
    state = workbenchReducer(state, { type: 'setRefinement', slot: 1, refinement: 3 })
    expect(metric(agent(calculateParty(state)!, 'corin'), 'critDmg').breakdown.fully)
      .toContainEqual(expect.objectContaining({ ownerAgentId: 'lucia', locus: 'additional' }))

    state = workbenchReducer(state, { type: 'openPartyEdit' })
    state = workbenchReducer(state, { type: 'replaceDraftAgent', slot: 2, agentId: 'astraYao' })
    state = workbenchReducer(state, { type: 'applyPartyEdit' })
    expect(metric(agent(calculateParty(state)!, 'corin'), 'critDmg').breakdown.fully)
      .not.toContainEqual(expect.objectContaining({ ownerAgentId: 'lucia', locus: 'additional' }))
    expect(state.slots[1].setup.refinement).toBe(1)

    state = workbenchReducer(state, { type: 'openPartyEdit' })
    state = workbenchReducer(state, { type: 'replaceDraftAgent', slot: 2, agentId: 'lycaon' })
    state = workbenchReducer(state, { type: 'applyPartyEdit' })
    expect(metric(agent(calculateParty(state)!, 'corin'), 'critDmg').breakdown.fully)
      .toContainEqual(expect.objectContaining({ ownerAgentId: 'lucia', locus: 'additional' }))
    expect(state.slots[1].setup.refinement).toBe(1)
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
    let state = createPreparedState({}, ['yixuan', 'anbySoldier0', 'trigger'], 0)
    expect(state.slots[2].setup).toMatchObject({
      engineId: 'iceJadeTeapot', fourPieceId: 'king', twoPieceId: 'shockstar',
    })
    state = workbenchReducer(state, { type: 'setRefinement', slot: 0, refinement: 3 })
    state = workbenchReducer(state, { type: 'setRefinement', slot: 1, refinement: 3 })
    state = workbenchReducer(state, { type: 'setRefinement', slot: 2, refinement: 3 })

    state = workbenchReducer(state, { type: 'openPartyEdit' })
    state = workbenchReducer(state, { type: 'setDraftFocus', slot: 1 })
    state = workbenchReducer(state, { type: 'applyPartyEdit' })

    expect(state.focusSlot).toBe(1)
    expect(state.slots.map(({ setup }) => setup.refinement)).toEqual([1, 1, 1])
    expect(state.slots.map(({ agentId }) => agentId)).toEqual(['yixuan', 'anbySoldier0', 'trigger'])
    expect(state.slots[2].setup).toMatchObject({
      engineId: 'spectralGaze', fourPieceId: 'king', twoPieceId: 'shockstar',
    })
  })

  it('preserves an explicit draft focus only when replacing an ineligible member', () => {
    let state = createPreparedState({}, ['yixuan', 'anbySoldier0', 'lucia'], 1)
    state = workbenchReducer(state, { type: 'openPartyEdit' })
    state = workbenchReducer(state, { type: 'replaceDraftAgent', slot: 2, agentId: 'trigger' })
    expect(state.draft).toMatchObject({ agentIds: ['yixuan', 'anbySoldier0', 'trigger'], focusSlot: 1 })

    state = workbenchReducer(state, { type: 'replaceDraftAgent', slot: 0, agentId: 'astraYao' })
    expect(state.draft?.focusSlot).toBe(1)
  })

  it('swaps overlapping Trigger Disc roles only from a valid four-piece selection', () => {
    let state = createPreparedState({}, ['anbySoldier0', 'trigger', 'astraYao'], 0)
    state = workbenchReducer(state, {
      type: 'selectDisc', slot: 1, piece: 'fourPiece', discId: 'shockstar',
    })
    expect(state.slots[1].setup).toMatchObject({ fourPieceId: 'shockstar', twoPieceId: 'king' })

    const unchanged = workbenchReducer(state, {
      type: 'selectDisc', slot: 1, piece: 'twoPiece', discId: 'shockstar',
    })
    expect(unchanged).toBe(state)

    state = workbenchReducer(state, {
      type: 'selectDisc', slot: 1, piece: 'fourPiece', discId: 'king',
    })
    expect(state.slots[1].setup).toMatchObject({ fourPieceId: 'king', twoPieceId: 'shockstar' })

    const withDialyn = createPreparedState({}, ['anbySoldier0', 'trigger', 'dialyn'], 0)
    expect(workbenchReducer(withDialyn, {
      type: 'selectDisc', slot: 1, piece: 'twoPiece', discId: 'astralVoice',
    })).toBe(withDialyn)
  })

  it('prepares Trigger from focus and King-holder context without rewriting direct edits', () => {
    const yixuanFocused = createPreparedState({}, ['yixuan', 'trigger', 'dialyn'], 0)
    const anbyFocused = createPreparedState({}, ['anbySoldier0', 'trigger', 'dialyn'], 0)
    expect(yixuanFocused.slots[1].setup).toMatchObject({
      engineId: 'iceJadeTeapot', fourPieceId: 'astralVoice', twoPieceId: 'shockstar',
    })
    expect(anbyFocused.slots[1].setup).toMatchObject({
      engineId: 'spectralGaze', fourPieceId: 'astralVoice', twoPieceId: 'shockstar',
    })

    const edited = workbenchReducer(anbyFocused, {
      type: 'selectEngine', slot: 1, engineId: 'iceJadeTeapot',
    })
    expect(edited.slots[1].setup).toMatchObject({
      engineId: 'iceJadeTeapot', fourPieceId: 'astralVoice', twoPieceId: 'shockstar',
    })
  })

  it('prepares only target Astra from an established direct Astral holder', () => {
    let state = createPreparedState({}, ['anbySoldier0', 'trigger', 'astraYao'], 0)
    const anby = state.slots[0]
    state = workbenchReducer(state, {
      type: 'selectDisc', slot: 1, piece: 'fourPiece', discId: 'astralVoice',
    })
    const editedTrigger = state.slots[1]
    expect(state.slots[2].setup).toMatchObject({ fourPieceId: 'astralVoice', twoPieceId: 'moonlight' })

    state = workbenchReducer(state, { type: 'setMindscape', slot: 2, mindscape: 2 })
    expect(state.slots[0]).toBe(anby)
    expect(state.slots[1]).toBe(editedTrigger)
    expect(state.slots[2].setup).toMatchObject({
      mindscape: 2, fourPieceId: 'moonlight', twoPieceId: 'astralVoice',
    })

    state = workbenchReducer(state, { type: 'switchPool', slot: 2, pool: 'nonLimited' })
    expect(state.slots[0]).toBe(anby)
    expect(state.slots[1]).toBe(editedTrigger)
    expect(state.slots[2].setup).toMatchObject({
      pool: 'nonLimited', fourPieceId: 'moonlight', twoPieceId: 'astralVoice',
    })
  })

  it('compresses same-effect identities from current four-piece roles without manufacturing partners', () => {
    const dialyn = createPreparedState({}, ['dialyn', 'yixuan', 'lucia'], 1)
    expect(effectiveTwoPieceIds(dialyn, 0)).toEqual(['woodpecker', 'swingJazz'])

    let pan = createPreparedState({}, ['yixuan', 'panYinhu', 'juFufu'], 0)
    expect(effectiveTwoPieceIds(pan, 1)).toEqual(['swingJazz', 'hormonePunk'])
    pan = workbenchReducer(pan, {
      type: 'selectDisc', slot: 1, piece: 'fourPiece', discId: 'swingJazz',
    })
    expect(pan.slots[1].setup).toMatchObject({
      fourPieceId: 'swingJazz', twoPieceId: 'astralVoice',
    })
    expect(effectiveTwoPieceIds(pan, 1)).toEqual(['moonlight', 'astralVoice'])

    let juFufu = createPreparedState({}, ['juFufu', 'yixuan', 'lucia'], 1)
    expect(effectiveTwoPieceIds(juFufu, 0)).toEqual(expect.arrayContaining([
      'hormonePunk', 'swingJazz',
    ]))
    expect(effectiveTwoPieceIds(juFufu, 0)).not.toEqual(expect.arrayContaining([
      'astralVoice', 'moonlight',
    ]))
    juFufu = workbenchReducer(juFufu, {
      type: 'selectDisc', slot: 0, piece: 'fourPiece', discId: 'swingJazz',
    })
    expect(effectiveTwoPieceIds(juFufu, 0)).toEqual(expect.arrayContaining([
      'hormonePunk', 'moonlight',
    ]))

    const anby = createPreparedState({}, ['anbySoldier0', 'yixuan', 'lucia'], 1)
    expect(effectiveTwoPieceIds(anby, 0)).toContain('hormonePunk')
    expect(effectiveTwoPieceIds(anby, 0)).not.toContain('astralVoice')
  })

  it('routes matching Attribute and canonical ATK candidates through current formulas', () => {
    const rupture = createPreparedState({}, ['yixuan', 'yidhari', 'manato'], 0)
    expect(effectiveTwoPieceIds(rupture, 0)).toEqual([
      'woodpecker', 'branchAndBlade', 'chaoticMetal',
    ])
    expect(effectiveTwoPieceIds(rupture, 0)).not.toContain('yunkui')
    expect(effectiveTwoPieceIds(rupture, 0)).not.toContain('pufferElectro')
    expect(effectiveTwoPieceIds(rupture, 1)).toEqual([
      'woodpecker', 'branchAndBlade', 'polarMetal',
    ])
    expect(effectiveTwoPieceIds(rupture, 2)).toEqual([
      'woodpecker', 'branchAndBlade', 'infernoMetal',
    ])

    const attack = createPreparedState({}, ['anbySoldier0', 'seed', 'cissia'], 0)
    expect(effectiveTwoPieceIds(attack, 0)).toEqual([
      'woodpecker', 'branchAndBlade', 'thunderMetal', 'hormonePunk',
    ])
    expect(effectiveTwoPieceIds(attack, 1)).toEqual(expect.arrayContaining([
      'woodpecker', 'branchAndBlade', 'thunderMetal', 'hormonePunk',
    ]))
    expect(effectiveTwoPieceIds(attack, 2)).toEqual(expect.arrayContaining([
      'swingJazz', 'woodpecker', 'branchAndBlade', 'thunderMetal', 'hormonePunk',
    ]))
    expect(effectiveTwoPieceIds(attack, 2)).not.toContain('astralVoice')
  })

  it('derives Cissia same-effect exposure from contextual four-piece reachability', () => {
    const local = createPreparedState({}, ['seed', 'cissia', 'anbySoldier0'], 0)
    expect(effectiveTwoPieceIds(local, 1)).toContain('hormonePunk')
    expect(effectiveTwoPieceIds(local, 1)).not.toContain('astralVoice')

    let contextual = createPreparedState({}, ['seed', 'cissia', 'astraYao'], 0)
    contextual = workbenchReducer(contextual, {
      type: 'selectDisc', slot: 1, piece: 'fourPiece', discId: 'dawnsBloom',
    })
    expect(effectiveTwoPieceIds(contextual, 1)).toContain('astralVoice')
    expect(effectiveTwoPieceIds(contextual, 1)).not.toContain('hormonePunk')

    contextual = workbenchReducer(contextual, {
      type: 'selectDisc', slot: 1, piece: 'fourPiece', discId: 'astralVoice',
    })
    expect(effectiveTwoPieceIds(contextual, 1)).toContain('hormonePunk')
    expect(effectiveTwoPieceIds(contextual, 1)).not.toContain('astralVoice')
  })

  it('clears a same-effect selection after direct invalidation without fallback or restoration', () => {
    let state = createPreparedState({}, ['yixuan', 'panYinhu', 'juFufu'], 0)
    state = workbenchReducer(state, {
      type: 'selectDisc', slot: 1, piece: 'twoPiece', discId: 'hormonePunk',
    })
    expect(state.slots[1].setup.twoPieceId).toBe('hormonePunk')

    state = workbenchReducer(state, {
      type: 'selectDisc', slot: 1, piece: 'fourPiece', discId: 'bunnyInWonderland',
    })
    expect(state.slots[1].setup.twoPieceId).toBeNull()
    expect(calculateParty(state)).toBeNull()
    expect(effectiveTwoPieceIds(state, 1)).toEqual(['swingJazz', 'astralVoice'])

    state = workbenchReducer(state, {
      type: 'selectDisc', slot: 1, piece: 'fourPiece', discId: 'astralVoice',
    })
    expect(effectiveTwoPieceIds(state, 1)).toEqual(['swingJazz', 'hormonePunk'])
    expect(state.slots[1].setup.twoPieceId).toBeNull()
    expect(calculateParty(state)).toBeNull()

    state = workbenchReducer(state, {
      type: 'selectDisc', slot: 1, piece: 'twoPiece', discId: 'hormonePunk',
    })
    expect(isCompleteWorkbench(state)).toBe(true)
    expect(calculateParty(state)).not.toBeNull()
  })

  it('re-prepares only Trigger for a pool transition while a rigid King holder remains established', () => {
    let state = createPreparedState({}, ['anbySoldier0', 'trigger', 'dialyn'], 0)
    const anby = state.slots[0]
    const dialyn = state.slots[2]

    state = workbenchReducer(state, { type: 'switchPool', slot: 1, pool: 'nonLimited' })

    expect(state.slots[0]).toBe(anby)
    expect(state.slots[2]).toBe(dialyn)
    expect(state.slots[1].setup).toMatchObject({
      pool: 'nonLimited', engineId: 'restrained', fourPieceId: 'astralVoice', twoPieceId: 'shockstar',
    })
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
    expect(incompleteRequiredSelections(state)).toEqual([
      { kind: 'mainStat', slot: 0, agentId: 'anbySoldier0', mainSlot: 'slot5' },
      { kind: 'mainStat', slot: 1, agentId: 'trigger', mainSlot: 'slot5' },
      { kind: 'mainStat', slot: 2, agentId: 'dialyn', mainSlot: 'slot5' },
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
    expect(incompleteRequiredSelections(partyPrepared)).toEqual([])
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
    expect(incompleteRequiredSelections(pressureRemoved)).toHaveLength(3)
    expect(pressureRemoved.slots[0].setup.mains.slot5).toBeNull()
    expect(pressureRemoved.slots[1].setup.mains.slot5).toBeNull()
    expect(pressureRemoved.slots[2].setup.mains.slot5).toBeNull()
    expect(calculateParty(pressureRemoved)).toBeNull()

    state = workbenchReducer(state, {
      type: 'selectMainStat', slot: 0, mainSlot: 'slot5', mainStatId: 'electricDmg',
    })
    expect(incompleteRequiredSelections(state)).toEqual([
      { kind: 'mainStat', slot: 1, agentId: 'trigger', mainSlot: 'slot5' },
      { kind: 'mainStat', slot: 2, agentId: 'dialyn', mainSlot: 'slot5' },
    ])
    expect(calculateParty(state)).toBeNull()

    state = workbenchReducer(state, {
      type: 'selectMainStat', slot: 2, mainSlot: 'slot5', mainStatId: 'atkPct',
    })
    expect(incompleteRequiredSelections(state)).toEqual([
      { kind: 'mainStat', slot: 1, agentId: 'trigger', mainSlot: 'slot5' },
    ])
    expect(calculateParty(state)).toBeNull()

    state = workbenchReducer(state, {
      type: 'selectMainStat', slot: 1, mainSlot: 'slot5', mainStatId: 'electricDmg',
    })
    expect(incompleteRequiredSelections(state)).toEqual([])
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
    expect(incompleteRequiredSelections(state)).toEqual([])
    expect(isCompleteWorkbench(state)).toBe(true)
  })

  it('scopes Cissia Core pressure by Electric general-damage recipient', () => {
    const seedParty = createPreparedState({}, ['seed', 'cissia', 'anbySoldier0'], 0)
    expect(effectiveTwoPieceIds(seedParty, 0)).not.toContain('pufferElectro')
    expect(effectiveMainStatIds(seedParty, 0, 'slot5')).not.toContain('penRatio')
    expect(effectiveMainStatIds(seedParty, 2, 'slot5')).not.toContain('penRatio')

    const incomplete = {
      ...seedParty,
      slots: [...seedParty.slots] as typeof seedParty.slots,
    }
    incomplete.slots[0] = {
      ...incomplete.slots[0],
      setup: {
        ...incomplete.slots[0].setup,
        mains: { ...incomplete.slots[0].setup.mains, slot5: null },
      },
    }
    incomplete.slots[1] = {
      ...incomplete.slots[1],
      setup: { ...incomplete.slots[1].setup, fourPieceId: null },
    }
    expect(effectiveTwoPieceIds(incomplete, 0)).not.toContain('pufferElectro')
    expect(effectiveMainStatIds(incomplete, 0, 'slot5')).not.toContain('penRatio')

    const mixedParty = createPreparedState({}, ['cissia', 'trigger', 'dialyn'], 2)
    expect(effectiveMainStatIds(mixedParty, 1, 'slot5')).not.toContain('penRatio')
    expect(effectiveMainStatIds(mixedParty, 2, 'slot5')).toContain('penRatio')

    const sheerParty = createPreparedState({}, ['cissia', 'yixuan', 'astraYao'], 1)
    expect(effectiveMainStatIds(sheerParty, 1, 'slot5')).toEqual(
      MAIN_STAT_IDS_BY_AGENT_AND_SLOT.yixuan.slot5,
    )

    const fireParty = createPreparedState({}, ['cissia', 'evelyn', 'astraYao'], 1)
    expect(effectiveMainStatIds(fireParty, 1, 'slot5')).toContain('penRatio')
  })

  it('keeps Seed M2 pressure bounded to an actual Vanguard and its recipients', () => {
    let withoutVanguard = createPreparedState({}, ['seed', 'yixuan', 'astraYao'], 0)
    withoutVanguard = workbenchReducer(withoutVanguard, {
      type: 'setMindscape', slot: 0, mindscape: 2,
    })
    expect(effectiveTwoPieceIds(withoutVanguard, 0)).toContain('pufferElectro')
    expect(effectiveMainStatIds(withoutVanguard, 0, 'slot5')).toContain('penRatio')

    let withVanguard = createPreparedState({}, ['seed', 'anbySoldier0', 'astraYao'], 0)
    withVanguard = workbenchReducer(withVanguard, {
      type: 'setMindscape', slot: 0, mindscape: 2,
    })
    expect(effectiveTwoPieceIds(withVanguard, 0)).not.toContain('pufferElectro')
    expect(effectiveMainStatIds(withVanguard, 0, 'slot5')).not.toContain('penRatio')
    expect(effectiveMainStatIds(withVanguard, 1, 'slot5')).not.toContain('penRatio')
  })

  it('uses exact current Initial ATK and applied-slot ties for incomplete-safe Seed pressure', () => {
    let earlierEvelyn = createPreparedState({}, ['evelyn', 'seed', 'anbySoldier0'], 0)
    expect(resolveSeedVanguardForState(earlierEvelyn)).toBe('evelyn')
    earlierEvelyn = workbenchReducer(earlierEvelyn, {
      type: 'selectDisc', slot: 0, piece: 'fourPiece', discId: 'woodpecker',
    })
    expect(resolveSeedVanguardForState(earlierEvelyn)).toBe('evelyn')
    earlierEvelyn = workbenchReducer(earlierEvelyn, {
      type: 'selectDisc', slot: 0, piece: 'twoPiece', discId: 'pufferElectro',
    })
    earlierEvelyn = workbenchReducer(earlierEvelyn, {
      type: 'setMindscape', slot: 1, mindscape: 2,
    })
    expect(earlierEvelyn.slots[0].setup).toMatchObject({
      fourPieceId: 'woodpecker', twoPieceId: null, mains: { slot5: null },
    })
    expect(resolveSeedVanguardForState(earlierEvelyn)).toBe('evelyn')
    expect(effectiveMainStatIds(earlierEvelyn, 0, 'slot5')).not.toContain('penRatio')
    expect(effectiveMainStatIds(earlierEvelyn, 2, 'slot5')).toContain('penRatio')

    let earlierAnby = createPreparedState({}, ['anbySoldier0', 'seed', 'evelyn'], 0)
    earlierAnby = workbenchReducer(earlierAnby, {
      type: 'selectDisc', slot: 2, piece: 'twoPiece', discId: 'branchAndBlade',
    })
    earlierAnby = workbenchReducer(earlierAnby, {
      type: 'selectDisc', slot: 2, piece: 'fourPiece', discId: 'woodpecker',
    })
    expect(resolveSeedVanguardForState(earlierAnby)).toBe('anbySoldier0')
    const unresolved = {
      ...earlierAnby,
      slots: [...earlierAnby.slots] as typeof earlierAnby.slots,
    }
    unresolved.slots[2] = {
      ...unresolved.slots[2],
      setup: { ...unresolved.slots[2].setup, engineId: null },
    }
    expect(resolveSeedVanguardForState(unresolved)).toBeNull()
    const atkEdited = workbenchReducer(earlierAnby, {
      type: 'selectMainStat', slot: 2, mainSlot: 'slot5', mainStatId: 'atkPct',
    })
    expect(resolveSeedVanguardForState(atkEdited)).toBe('evelyn')
    earlierAnby = workbenchReducer(earlierAnby, {
      type: 'setMindscape', slot: 1, mindscape: 2,
    })
    expect(earlierAnby.slots[2].setup.mains.slot5).toBe('penRatio')
    expect(effectiveMainStatIds(earlierAnby, 2, 'slot5')).toContain('penRatio')
    expect(effectiveMainStatIds(earlierAnby, 0, 'slot5')).not.toContain('penRatio')
  })

  it('prepares Evelyn Fire only at authorized Seed M2 preparation boundaries', () => {
    let state = createPreparedState({}, ['seed', 'evelyn', 'anbySoldier0'], 1)
    const evelynBefore = state.slots[1].setup
    state = workbenchReducer(state, { type: 'setMindscape', slot: 0, mindscape: 2 })
    expect(state.slots[1].setup).toEqual({
      ...evelynBefore,
      mains: { ...evelynBefore.mains, slot5: null },
    })

    const seedAfter = state.slots[0]
    const anbyAfter = state.slots[2]
    state = workbenchReducer(state, { type: 'setMindscape', slot: 1, mindscape: 1 })
    expect(state.slots[0]).toBe(seedAfter)
    expect(state.slots[2]).toBe(anbyAfter)
    expect(state.slots[1].setup.mains.slot5).toBe('fireDmg')

    state = workbenchReducer(state, { type: 'openPartyEdit' })
    state = workbenchReducer(state, { type: 'setDraftFocus', slot: 0 })
    state = workbenchReducer(state, { type: 'applyPartyEdit' })
    expect(state.focusSlot).toBe(0)
    expect(state.slots[1].setup.mains.slot5).toBe('fireDmg')
  })

  it('admits Evelyn contextual opportunities without ranking or pressure-removing Puffer 4-piece', () => {
    const opportunities = createPreparedState({}, ['evelyn', 'astraYao', 'dialyn'], 0)
    expect(effectiveFourPieceIds(opportunities, 0)).toEqual([
      'hormonePunk', 'woodpecker', 'astralVoice', 'pufferElectro',
    ])
    expect(opportunities.slots[0].setup.fourPieceId).toBe('hormonePunk')

    const astraOnly = createPreparedState({}, ['evelyn', 'astraYao', 'seed'], 0)
    expect(effectiveFourPieceIds(astraOnly, 0)).toContain('astralVoice')
    expect(effectiveFourPieceIds(astraOnly, 0)).not.toContain('pufferElectro')

    const dialynOnly = createPreparedState({}, ['evelyn', 'dialyn', 'seed'], 0)
    expect(effectiveFourPieceIds(dialynOnly, 0)).toContain('pufferElectro')
    expect(effectiveFourPieceIds(dialynOnly, 0)).not.toContain('astralVoice')

    let pressured = createPreparedState({}, ['seed', 'evelyn', 'dialyn'], 0)
    pressured = workbenchReducer(pressured, {
      type: 'setMindscape', slot: 0, mindscape: 2,
    })
    expect(effectiveFourPieceIds(pressured, 1)).toContain('pufferElectro')
    expect(effectiveTwoPieceIds(pressured, 1)).not.toContain('pufferElectro')
    expect(effectiveMainStatIds(pressured, 1, 'slot5')).not.toContain('penRatio')
  })

  it('clears Puffer and Slot 5 PEN atomically while pressure remains stable under incompleteness', () => {
    let state = createPreparedState({}, ['evelyn', 'seed', 'astraYao'], 0)
    state = workbenchReducer(state, { type: 'setMindscape', slot: 1, mindscape: 1 })
    state = workbenchReducer(state, {
      type: 'selectDisc', slot: 0, piece: 'twoPiece', discId: 'pufferElectro',
    })
    state = workbenchReducer(state, {
      type: 'selectMainStat', slot: 0, mainSlot: 'slot5', mainStatId: 'penRatio',
    })
    const evelynBefore = state.slots[0].setup
    const astraBefore = state.slots[2]

    state = workbenchReducer(state, { type: 'setMindscape', slot: 1, mindscape: 2 })

    expect(state.slots[0].setup).toEqual({
      ...evelynBefore,
      twoPieceId: null,
      mains: { ...evelynBefore.mains, slot5: null },
    })
    expect(state.slots[0].setup.fourPieceId).toBe('hormonePunk')
    expect(state.slots[2]).toBe(astraBefore)
    expect(incompleteRequiredSelections(state)).toEqual([
      { kind: 'disc', slot: 0, agentId: 'evelyn', piece: 'twoPiece' },
      { kind: 'mainStat', slot: 0, agentId: 'evelyn', mainSlot: 'slot5' },
    ])
    expect(effectiveTwoPieceIds(state, 0)).not.toContain('pufferElectro')
    expect(effectiveMainStatIds(state, 0, 'slot5')).not.toContain('penRatio')
    expect(calculateParty(state)).toBeNull()

    const missingProviderDisc = {
      ...state,
      slots: [...state.slots] as typeof state.slots,
    }
    missingProviderDisc.slots[1] = {
      ...missingProviderDisc.slots[1],
      setup: { ...missingProviderDisc.slots[1].setup, fourPieceId: null },
    }
    expect(effectiveTwoPieceIds(missingProviderDisc, 0)).not.toContain('pufferElectro')
    expect(effectiveMainStatIds(missingProviderDisc, 0, 'slot5')).not.toContain('penRatio')

    const pressureRemoved = workbenchReducer(state, {
      type: 'setMindscape', slot: 1, mindscape: 1,
    })
    expect(effectiveTwoPieceIds(pressureRemoved, 0)).toContain('pufferElectro')
    expect(effectiveMainStatIds(pressureRemoved, 0, 'slot5')).toContain('penRatio')
    expect(pressureRemoved.slots[0].setup.twoPieceId).toBeNull()
    expect(pressureRemoved.slots[0].setup.mains.slot5).toBeNull()
    expect(calculateParty(pressureRemoved)).toBeNull()

    state = workbenchReducer(state, {
      type: 'selectDisc', slot: 0, piece: 'twoPiece', discId: 'branchAndBlade',
    })
    expect(incompleteRequiredSelections(state)).toEqual([
      { kind: 'mainStat', slot: 0, agentId: 'evelyn', mainSlot: 'slot5' },
    ])
    expect(effectiveMainStatIds(state, 0, 'slot5')).not.toContain('penRatio')
    expect(calculateParty(state)).toBeNull()

    state = workbenchReducer(state, {
      type: 'selectMainStat', slot: 0, mainSlot: 'slot5', mainStatId: 'fireDmg',
    })
    expect(isCompleteWorkbench(state)).toBe(true)
  })

  it('derives Spectral Gaze pressure from broad pre-PEN meaning and formula participation', () => {
    const established = createPreparedState({}, ['anbySoldier0', 'trigger', 'dialyn'], 0)
    expect(effectiveMainStatIds(established, 0, 'slot5')).not.toContain('penRatio')
    expect(effectiveMainStatIds(established, 1, 'slot5')).not.toContain('penRatio')
    expect(effectiveMainStatIds(established, 2, 'slot5')).not.toContain('penRatio')

    const generalDamage = createPreparedState({}, ['seed', 'trigger', 'evelyn'], 2)
    expect(generalDamage.slots[1].setup.engineId).toBe('spectralGaze')
    expect(activeCandidatePressures(generalDamage, 0)).toContain('materialBroadPrePenDefBypass')
    expect(activeCandidatePressures(generalDamage, 2)).toContain('materialBroadPrePenDefBypass')
    expect(effectiveMainStatIds(generalDamage, 0, 'slot5')).not.toContain('penRatio')
    expect(effectiveMainStatIds(generalDamage, 2, 'slot5')).not.toContain('penRatio')
    expect(generalDamage.slots[2].setup.mains.slot5).toBe('fireDmg')
    expect(isCompleteWorkbench(generalDamage)).toBe(true)

    const sheer = workbenchReducer(
      createPreparedState({}, ['yixuan', 'trigger', 'astraYao'], 0),
      { type: 'selectEngine', slot: 1, engineId: 'spectralGaze' },
    )
    expect(sheer.slots[1].setup.engineId).toBe('spectralGaze')
    expect(activeCandidatePressures(sheer, 0)).toEqual([])

    let direct = createPreparedState({}, ['evelyn', 'trigger', 'astraYao'], 0)
    direct = workbenchReducer(direct, {
      type: 'selectEngine', slot: 1, engineId: 'iceJadeTeapot',
    })
    direct = workbenchReducer(direct, {
      type: 'selectMainStat', slot: 0, mainSlot: 'slot5', mainStatId: 'penRatio',
    })
    direct = workbenchReducer(direct, {
      type: 'selectEngine', slot: 1, engineId: 'spectralGaze',
    })
    expect(direct.slots[0].setup.mains.slot5).toBeNull()
    expect(calculateParty(direct)).toBeNull()
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
      fourPieceId: 'astralVoice',
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
    expect(state.slots[0].setup).toMatchObject({
      mindscape: 2,
      pool: 'full',
      twoPieceId: 'branchAndBlade',
      mains: { slot4: 'critRate', slot5: 'electricDmg', slot6: 'atkPct' },
      substats: { critDmg: 0 },
    })
    expect(state.slots[2].setup.mains.slot5).toBeNull()
    expect(state.slots[2].setup.substats.critRate).toBe(5)
    expect(isCompleteWorkbench(state)).toBe(false)

    const triggerAtAnbyM2 = state.slots[1]
    const dialynAtAnbyM2 = state.slots[2]
    state = workbenchReducer(state, {
      type: 'switchPool', slot: 0, pool: 'nonLimited',
    })
    expect(state.slots[0].setup).toMatchObject({
      mindscape: 2,
      pool: 'nonLimited',
      twoPieceId: 'branchAndBlade',
      mains: { slot4: 'critDmg', slot5: 'electricDmg', slot6: 'atkPct' },
      substats: { critDmg: 0 },
    })
    expect(state.slots[1]).toBe(triggerAtAnbyM2)
    expect(state.slots[2]).toBe(dialynAtAnbyM2)
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
      { engineId: 'elegantVanity', fourPieceId: 'astralVoice', twoPieceId: 'moonlight', mains: { slot4: 'atkPct', slot5: 'atkPct', slot6: 'energyRegenPct' }, substats: { atkPct: 0, atkFlat: 0 } },
    ])

    const nonLimited = createPreparedState({ anbySoldier0: 'nonLimited', trigger: 'nonLimited', astraYao: 'nonLimited' }, ['anbySoldier0', 'trigger', 'astraYao'], 0)
    expect(nonLimited.slots.map(({ setup }) => [setup.engineId, setup.fourPieceId, setup.twoPieceId])).toEqual([
      ['marcatoDesire', 'shadowHarmony', 'woodpecker'],
      ['restrained', 'king', 'shockstar'],
      ['kaboom', 'astralVoice', 'moonlight'],
    ])
    expect(nonLimited.slots[2].setup.mains.slot6).toBe('atkPct')

    const astraM1 = workbenchReducer(nonLimited, {
      type: 'setMindscape', slot: 2, mindscape: 1,
    })
    expect(astraM1.slots[2].setup).toMatchObject({
      engineId: 'kaboom',
      mains: { slot6: 'atkPct' },
    })
    const astraM2 = workbenchReducer(astraM1, {
      type: 'setMindscape', slot: 2, mindscape: 2,
    })
    expect(astraM2.slots[2].setup.engineId).toBe('kaboom')
    expect(astraM2.slots[2].setup.mains.slot6).toBe('energyRegenPct')

    const evelynFull = createPreparedState({}, ['evelyn', 'seed', 'astraYao'], 0)
    const evelynNonLimited = createPreparedState(
      { evelyn: 'nonLimited' },
      ['evelyn', 'seed', 'astraYao'],
      0,
    )
    expect(evelynFull.slots[0].setup).toEqual({
      mindscape: 0,
      pool: 'full',
      engineId: 'heartstringNocturne',
      refinement: 1,
      fourPieceId: 'hormonePunk',
      twoPieceId: 'woodpecker',
      mains: { slot4: 'critDmg', slot5: 'penRatio', slot6: 'atkPct' },
      substats: { critRate: 0, critDmg: 0, atkPct: 0 },
    })
    expect(evelynNonLimited.slots[0].setup).toEqual({
      ...evelynFull.slots[0].setup,
      pool: 'nonLimited',
      engineId: 'starlightEngine',
      refinement: 5,
      twoPieceId: 'branchAndBlade',
      mains: { slot4: 'critRate', slot5: 'penRatio', slot6: 'atkPct' },
    })
    expect(calculateParty(evelynFull)).not.toBeNull()
    expect(calculateParty(evelynNonLimited)).not.toBeNull()
  })

  it('authors complete Corin and Lycaon representatives from generic Rank defaults', () => {
    const full = createPreparedState({}, ['corin', 'lycaon', 'astraYao'], 0)
    const nonLimited = createPreparedState(
      { corin: 'nonLimited', lycaon: 'nonLimited' },
      ['corin', 'lycaon', 'astraYao'],
      0,
    )

    expect(full.slots[0].setup).toEqual({
      mindscape: 6,
      pool: 'full',
      engineId: 'cordisGermina',
      refinement: 1,
      fourPieceId: 'hormonePunk',
      twoPieceId: 'branchAndBlade',
      mains: { slot4: 'critRate', slot5: 'penRatio', slot6: 'atkPct' },
      substats: { critRate: 0, critDmg: 0, atkPct: 0 },
    })
    expect(full.slots[1].setup).toEqual({
      mindscape: 0,
      pool: 'full',
      engineId: 'blazingLaurel',
      refinement: 1,
      fourPieceId: 'king',
      twoPieceId: 'shockstar',
      mains: { slot4: 'critRate', slot5: 'iceDmg', slot6: 'impact' },
      substats: { critRate: 0 },
    })
    expect(nonLimited.slots[0].setup).toMatchObject({
      mindscape: 6,
      pool: 'nonLimited',
      engineId: 'steelCushion',
      refinement: 1,
      mains: { slot4: 'critRate', slot5: 'penRatio', slot6: 'atkPct' },
    })
    expect(nonLimited.slots[1].setup).toMatchObject({
      mindscape: 0,
      pool: 'nonLimited',
      engineId: 'steamOven',
      refinement: 5,
    })
    expect(isCompleteWorkbench(full)).toBe(true)
    expect(isCompleteWorkbench(nonLimited)).toBe(true)
  })

  it('prepares Yidhari and Manato from generic Rank defaults with zero supplied hits', () => {
    const full = createPreparedState({}, ['yidhari', 'manato', 'astraYao'], 0)
    const nonLimited = createPreparedState(
      { yidhari: 'nonLimited', manato: 'nonLimited' },
      ['yidhari', 'manato', 'astraYao'],
      0,
    )

    expect(full.slots[0].setup).toEqual({
      mindscape: 0, pool: 'full', engineId: 'krakensCradle', refinement: 1,
      fourPieceId: 'yunkui', twoPieceId: 'branchAndBlade',
      mains: { slot4: 'critRate', slot5: 'iceDmg', slot6: 'hpPct' },
      substats: { critRate: 0, critDmg: 0, hpPct: 0 },
    })
    expect(full.slots[1].setup).toEqual({
      mindscape: 6, pool: 'full', engineId: 'grillOWisp', refinement: 5,
      fourPieceId: 'yunkui', twoPieceId: 'woodpecker',
      mains: { slot4: 'critDmg', slot5: 'fireDmg', slot6: 'hpPct' },
      substats: { critRate: 0, critDmg: 0, hpPct: 0 },
    })
    expect(nonLimited.slots[0].setup).toMatchObject({
      pool: 'nonLimited', engineId: 'grillOWisp', refinement: 5,
    })
    expect(nonLimited.slots[1].setup).toMatchObject({
      pool: 'nonLimited', engineId: 'grillOWisp', refinement: 5,
    })
    expect(isCompleteWorkbench(full)).toBe(true)
    expect(isCompleteWorkbench(nonLimited)).toBe(true)
  })

  it('clears Myriad-derived PEN inputs without restoring them after direct reselection', () => {
    let state = createPreparedState({}, ['hugo', 'lycaon', 'astraYao'], 0)
    expect(state.slots[0].setup).toMatchObject({
      mindscape: 0, engineId: 'myriadEclipse', refinement: 1,
      fourPieceId: 'hormonePunk', twoPieceId: 'branchAndBlade',
      mains: { slot4: 'critRate', slot5: 'iceDmg', slot6: 'atkPct' },
      substats: { critRate: 0, critDmg: 0, atkPct: 0 },
    })
    state = workbenchReducer(state, {
      type: 'selectEngine', slot: 0, engineId: 'steelCushion',
    })
    expect(effectiveMainStatIds(state, 0, 'slot5')).toContain('penRatio')
    expect(effectiveTwoPieceIds(state, 0)).toContain('pufferElectro')
    state = workbenchReducer(state, {
      type: 'selectDisc', slot: 0, piece: 'twoPiece', discId: 'pufferElectro',
    })
    state = workbenchReducer(state, {
      type: 'selectMainStat', slot: 0, mainSlot: 'slot5', mainStatId: 'penRatio',
    })
    state = workbenchReducer(state, {
      type: 'selectEngine', slot: 0, engineId: 'myriadEclipse',
    })
    expect(activeCandidatePressures(state, 0)).toEqual(['materialBroadPrePenDefBypass'])
    expect(effectiveMainStatIds(state, 0, 'slot5')).not.toContain('penRatio')
    expect(effectiveTwoPieceIds(state, 0)).not.toContain('pufferElectro')
    expect(state.slots[0].setup.twoPieceId).toBeNull()
    expect(state.slots[0].setup.mains.slot5).toBeNull()
    expect(calculateParty(state)).toBeNull()

    state = workbenchReducer(state, {
      type: 'selectEngine', slot: 0, engineId: 'steelCushion',
    })
    expect(effectiveMainStatIds(state, 0, 'slot5')).toContain('penRatio')
    expect(effectiveTwoPieceIds(state, 0)).toContain('pufferElectro')
    expect(state.slots[0].setup.twoPieceId).toBeNull()
    expect(state.slots[0].setup.mains.slot5).toBeNull()

    const m2 = workbenchReducer(
      createPreparedState({ hugo: 'nonLimited' }, ['hugo', 'lycaon', 'astraYao'], 0),
      { type: 'setMindscape', slot: 0, mindscape: 2 },
    )
    expect(activeCandidatePressures(m2, 0)).toEqual([])
    expect(effectiveMainStatIds(m2, 0, 'slot5')).toContain('penRatio')
    expect(effectiveTwoPieceIds(m2, 0)).toContain('pufferElectro')
  })

  it('rebuilds only Ju Fufu when Mindscape changes her zero-substat King package', () => {
    let state = createPreparedState({}, ['juFufu', 'yixuan', 'lucia'], 1)
    const beforeYixuan = state.slots[1].setup
    const beforeLucia = state.slots[2].setup
    expect(state.slots[0].setup).toEqual({
      mindscape: 0, pool: 'full', engineId: 'roaringFurnace', refinement: 1,
      fourPieceId: 'king', twoPieceId: 'woodpecker',
      mains: { slot4: 'critRate', slot5: 'atkPct', slot6: 'atkPct' },
      substats: { critRate: 0, atkPct: 0, atkFlat: 0 },
    })

    state = workbenchReducer(state, { type: 'setMindscape', slot: 0, mindscape: 1 })
    expect(state.slots[0].setup).toMatchObject({
      mindscape: 1, fourPieceId: 'king', twoPieceId: 'shockstar',
    })
    expect(state.slots[0].setup.substats).toEqual({
      critRate: 0, atkPct: 0, atkFlat: 0,
    })
    expect(state.slots[1].setup).toBe(beforeYixuan)
    expect(state.slots[2].setup).toBe(beforeLucia)
    expect(isCompleteWorkbench(state)).toBe(true)
  })

  it('clears Ju Fufu King CRIT inputs and reinitializes the substat first at zero', () => {
    let state = createPreparedState({}, ['juFufu', 'yixuan', 'lucia'], 1)
    expect(effectiveSubstatChoices('juFufu', state.slots[0].setup)
      .map(({ id }) => id)).toEqual(['critRate', 'atkPct', 'atkFlat'])
    expect(effectiveMainStatIds(state, 0, 'slot4')).toContain('critRate')
    expect(effectiveTwoPieceIds(state, 0)).toContain('woodpecker')

    state = workbenchReducer(state, {
      type: 'setSubstat', slot: 0, key: 'critRate', value: 7,
    })
    state = workbenchReducer(state, {
      type: 'selectDisc', slot: 0, piece: 'fourPiece', discId: 'swingJazz',
    })
    expect(state.slots[0].setup).toMatchObject({
      fourPieceId: 'swingJazz',
      twoPieceId: null,
      mains: { slot4: null },
      substats: { atkPct: 0, atkFlat: 0 },
    })
    expect(effectiveSubstatChoices('juFufu', state.slots[0].setup)
      .map(({ id }) => id)).toEqual(['atkPct', 'atkFlat'])
    expect(effectiveMainStatIds(state, 0, 'slot4')).toEqual(['atkPct'])
    expect(effectiveTwoPieceIds(state, 0)).not.toContain('woodpecker')
    expect(calculateParty(state)).toBeNull()

    state = workbenchReducer(state, {
      type: 'selectDisc', slot: 0, piece: 'fourPiece', discId: 'king',
    })
    expect(effectiveSubstatChoices('juFufu', state.slots[0].setup)
      .map(({ id }) => id)).toEqual(['critRate', 'atkPct', 'atkFlat'])
    expect(state.slots[0].setup).toMatchObject({
      fourPieceId: 'king', twoPieceId: null, mains: { slot4: null },
      substats: { critRate: 0, atkPct: 0, atkFlat: 0 },
    })
    expect(Object.keys(state.slots[0].setup.substats))
      .toEqual(['critRate', 'atkPct', 'atkFlat'])
    expect(incompleteRequiredSelections(state)).toEqual(expect.arrayContaining([
      { kind: 'disc', slot: 0, agentId: 'juFufu', piece: 'twoPiece' },
      { kind: 'mainStat', slot: 0, agentId: 'juFufu', mainSlot: 'slot4' },
    ]))
    expect(incompleteRequiredSelections(state)).not.toContainEqual(
      { kind: 'substat', slot: 0, agentId: 'juFufu', substatId: 'critRate' },
    )
    expect(calculateParty(state)).toBeNull()

    state = workbenchReducer(state, {
      type: 'selectDisc', slot: 0, piece: 'twoPiece', discId: 'shockstar',
    })
    state = workbenchReducer(state, {
      type: 'selectMainStat', slot: 0, mainSlot: 'slot4', mainStatId: 'critRate',
    })
    expect(isCompleteWorkbench(state)).toBe(true)
    expect(calculateParty(state)).not.toBeNull()
  })

  it('clears Lycaon King inputs and reinitializes the substat at zero', () => {
    let state = createPreparedState({}, ['corin', 'lycaon', 'astraYao'], 0)
    state = workbenchReducer(state, {
      type: 'selectDisc', slot: 1, piece: 'twoPiece', discId: 'woodpecker',
    })
    state = workbenchReducer(state, {
      type: 'setSubstat', slot: 1, key: 'critRate', value: 7,
    })

    state = workbenchReducer(state, {
      type: 'selectDisc', slot: 1, piece: 'fourPiece', discId: 'astralVoice',
    })
    expect(state.slots[1].setup).toMatchObject({
      fourPieceId: 'astralVoice',
      twoPieceId: null,
      mains: { slot4: null },
      substats: {},
    })
    expect(effectiveMainStatIds(state, 1, 'slot4')).toEqual(['atkPct'])
    expect(effectiveTwoPieceIds(state, 1)).not.toContain('woodpecker')
    expect(effectiveSubstatChoices('lycaon', state.slots[1].setup)).toEqual([])
    expect(calculateParty(state)).toBeNull()

    state = workbenchReducer(state, {
      type: 'selectDisc', slot: 1, piece: 'fourPiece', discId: 'king',
    })
    expect(effectiveMainStatIds(state, 1, 'slot4')).toContain('critRate')
    expect(effectiveTwoPieceIds(state, 1)).toContain('woodpecker')
    expect(effectiveSubstatChoices('lycaon', state.slots[1].setup)
      .map(({ id }) => id)).toEqual(['critRate'])
    expect(state.slots[1].setup).toMatchObject({
      fourPieceId: 'king',
      twoPieceId: null,
      mains: { slot4: null },
      substats: { critRate: 0 },
    })
    expect(incompleteRequiredSelections(state)).toEqual(expect.arrayContaining([
      { kind: 'disc', slot: 1, agentId: 'lycaon', piece: 'twoPiece' },
      { kind: 'mainStat', slot: 1, agentId: 'lycaon', mainSlot: 'slot4' },
    ]))
    expect(incompleteRequiredSelections(state)).not.toContainEqual(
      { kind: 'substat', slot: 1, agentId: 'lycaon', substatId: 'critRate' },
    )
    expect(calculateParty(state)).toBeNull()

    state = workbenchReducer(state, {
      type: 'selectDisc', slot: 1, piece: 'twoPiece', discId: 'shockstar',
    })
    state = workbenchReducer(state, {
      type: 'selectMainStat', slot: 1, mainSlot: 'slot4', mainStatId: 'critRate',
    })
    expect(calculateParty(state)).not.toBeNull()

    let qualifiedTrigger = createPreparedState({}, ['corin', 'trigger', 'astraYao'], 0)
    qualifiedTrigger = workbenchReducer(qualifiedTrigger, {
      type: 'setSubstat', slot: 1, key: 'critRate', value: 7,
    })
    qualifiedTrigger = workbenchReducer(qualifiedTrigger, {
      type: 'selectDisc', slot: 1, piece: 'fourPiece', discId: 'astralVoice',
    })
    expect(effectiveMainStatIds(qualifiedTrigger, 1, 'slot4')).toContain('critRate')
    expect(effectiveSubstatChoicesForSlot(qualifiedTrigger, 1)
      .map(({ id }) => id)).toEqual(['critRate'])
    expect(qualifiedTrigger.slots[1].setup).toMatchObject({
      mains: { slot4: 'critRate' },
      substats: { critRate: 7 },
    })
  })

  it('gates Trigger CRIT substats by exact Additional qualification or selected King pressure', () => {
    let state = createPreparedState({}, ['yixuan', 'trigger', 'lucia'], 0)
    expect(state.slots[1].setup.fourPieceId).toBe('king')
    expect(effectiveSubstatChoicesForSlot(state, 1).map(({ id }) => id))
      .toEqual(['critRate'])

    state = workbenchReducer(state, {
      type: 'setSubstat', slot: 1, key: 'critRate', value: 7,
    })
    state = workbenchReducer(state, {
      type: 'selectDisc', slot: 1, piece: 'fourPiece', discId: 'astralVoice',
    })
    expect(effectiveSubstatChoicesForSlot(state, 1)).toEqual([])
    expect(state.slots[1].setup.substats).toEqual({})
    expect(effectiveTwoPieceIds(state, 1)).not.toContain('woodpecker')

    state = workbenchReducer(state, {
      type: 'setSubstat', slot: 1, key: 'critRate', value: 5,
    })
    expect(state.slots[1].setup.substats).toEqual({})

    state = workbenchReducer(state, {
      type: 'selectDisc', slot: 1, piece: 'fourPiece', discId: 'king',
    })
    expect(effectiveSubstatChoicesForSlot(state, 1).map(({ id }) => id))
      .toEqual(['critRate'])
    expect(state.slots[1].setup.substats).toEqual({ critRate: 0 })
    expect(effectiveTwoPieceIds(state, 1)).toContain('woodpecker')
  })

  it('extends contextual Puffer and broad pre-PEN policy to Corin with an Electric contrast', () => {
    const dialyn = createPreparedState({}, ['corin', 'dialyn', 'astraYao'], 0)
    expect(dialyn.slots[0].setup.fourPieceId).toBe('hormonePunk')
    expect(effectiveFourPieceIds(dialyn, 0)).toContain('pufferElectro')

    const spectral = createPreparedState({}, ['corin', 'trigger', 'astraYao'], 0)
    expect(spectral.slots[0].setup.mains.slot5).toBe('physicalDmg')
    expect(effectiveMainStatIds(spectral, 0, 'slot5')).not.toContain('penRatio')
    expect(activeCandidatePressures(spectral, 0))
      .toContain('materialBroadPrePenDefBypass')

    const electricOnly = createPreparedState({}, ['corin', 'cissia', 'astraYao'], 0)
    expect(electricOnly.slots[0].setup.mains.slot5).toBe('penRatio')
    expect(effectiveMainStatIds(electricOnly, 0, 'slot5')).toContain('penRatio')
    expect(activeCandidatePressures(electricOnly, 0)).toEqual([])
  })

  it('prepares exact Seed and Cissia pool representatives', () => {
    const full = createPreparedState({}, ['seed', 'cissia', 'anbySoldier0'], 0)
    expect(full.slots.slice(0, 2).map(({ setup }) => ({
      engineId: setup.engineId,
      refinement: setup.refinement,
      fourPieceId: setup.fourPieceId,
      twoPieceId: setup.twoPieceId,
      mains: setup.mains,
      substats: setup.substats,
    }))).toEqual([
      { engineId: 'cordisGermina', refinement: 1, fourPieceId: 'dawnsBloom', twoPieceId: 'woodpecker', mains: { slot4: 'critRate', slot5: 'electricDmg', slot6: 'atkPct' }, substats: { critRate: 0, critDmg: 0, atkPct: 0 } },
      { engineId: 'serpentineSeeker', refinement: 1, fourPieceId: 'dawnsBloom', twoPieceId: 'swingJazz', mains: { slot4: 'critRate', slot5: 'electricDmg', slot6: 'energyRegenPct' }, substats: { critRate: 0, critDmg: 0, atkPct: 0 } },
    ])

    const nonLimited = createPreparedState(
      { seed: 'nonLimited', cissia: 'nonLimited' },
      ['seed', 'cissia', 'anbySoldier0'],
      0,
    )
    expect(nonLimited.slots.slice(0, 2).map(({ setup }) => [
      setup.engineId,
      setup.refinement,
      setup.fourPieceId,
      setup.twoPieceId,
      setup.mains,
    ])).toEqual([
      ['marcatoDesire', 5, 'dawnsBloom', 'woodpecker', { slot4: 'critRate', slot5: 'electricDmg', slot6: 'atkPct' }],
      ['drillRigRedAxis', 5, 'dawnsBloom', 'swingJazz', { slot4: 'critRate', slot5: 'electricDmg', slot6: 'energyRegenPct' }],
    ])
  })

  it('owns contextual Cissia and Astra allocation by all-party versus target-only preparation', () => {
    let state = createPreparedState({}, ['seed', 'cissia', 'astraYao'], 0)
    expect(state.slots[1].setup).toMatchObject({
      engineId: 'serpentineSeeker', fourPieceId: 'astralVoice', twoPieceId: 'swingJazz',
    })
    expect(state.slots[2].setup).toMatchObject({
      engineId: 'elegantVanity', fourPieceId: 'moonlight', twoPieceId: 'astralVoice',
    })
    expect(effectiveFourPieceIds(state, 1)).toEqual(['dawnsBloom', 'astralVoice'])

    const seedBefore = state.slots[0]
    const astraBefore = state.slots[2]
    state = workbenchReducer(state, { type: 'setSubstat', slot: 1, key: 'critRate', value: 7 })
    state = workbenchReducer(state, { type: 'setMindscape', slot: 1, mindscape: 2 })
    expect(state.slots[0]).toBe(seedBefore)
    expect(state.slots[2]).toBe(astraBefore)
    expect(state.slots[1].setup).toMatchObject({
      mindscape: 2,
      engineId: 'serpentineSeeker',
      fourPieceId: 'astralVoice',
      twoPieceId: 'swingJazz',
      substats: { critRate: 0, critDmg: 0, atkPct: 0 },
    })

    const seedBeforePool = state.slots[0]
    const astraBeforePool = state.slots[2]
    state = workbenchReducer(state, { type: 'switchPool', slot: 1, pool: 'nonLimited' })
    expect(state.slots[0]).toBe(seedBeforePool)
    expect(state.slots[2]).toBe(astraBeforePool)
    expect(state.slots[1].setup).toMatchObject({
      pool: 'nonLimited', engineId: 'drillRigRedAxis', refinement: 5,
      fourPieceId: 'astralVoice', twoPieceId: 'swingJazz',
    })
  })

  it('keeps direct Disc edits local and allows target-only preparation to leave duplicate Astral holders', () => {
    let state = createPreparedState({}, ['seed', 'cissia', 'astraYao'], 0)
    const astraMoonlight = state.slots[2]
    state = workbenchReducer(state, {
      type: 'selectDisc', slot: 1, piece: 'fourPiece', discId: 'dawnsBloom',
    })
    expect(state.slots[1].setup.fourPieceId).toBe('dawnsBloom')
    expect(state.slots[2]).toBe(astraMoonlight)

    state = workbenchReducer(state, { type: 'setMindscape', slot: 2, mindscape: 1 })
    expect(state.slots[2].setup).toMatchObject({
      mindscape: 1, fourPieceId: 'astralVoice', twoPieceId: 'moonlight',
    })
    const astraLocalAstral = state.slots[2]
    state = workbenchReducer(state, { type: 'setMindscape', slot: 1, mindscape: 1 })
    expect(state.slots[1].setup).toMatchObject({
      mindscape: 1, fourPieceId: 'astralVoice', twoPieceId: 'swingJazz',
    })
    expect(state.slots[2]).toBe(astraLocalAstral)
    expect(state.slots[2].setup.fourPieceId).toBe('astralVoice')
  })

  it('admits contextual Astral as a direct Cissia edit only while the opportunity exists', () => {
    let contextual = createPreparedState({}, ['seed', 'cissia', 'astraYao'], 0)
    contextual = workbenchReducer(contextual, {
      type: 'selectDisc', slot: 1, piece: 'fourPiece', discId: 'dawnsBloom',
    })
    contextual = workbenchReducer(contextual, {
      type: 'selectDisc', slot: 1, piece: 'fourPiece', discId: 'astralVoice',
    })
    expect(contextual.slots[1].setup.fourPieceId).toBe('astralVoice')

    let local = createPreparedState({}, ['seed', 'cissia', 'anbySoldier0'], 0)
    local = workbenchReducer(local, {
      type: 'selectDisc', slot: 1, piece: 'fourPiece', discId: 'astralVoice',
    })
    expect(local.slots[1].setup.fourPieceId).toBe('dawnsBloom')
  })

  it('adds Dialyn-contextual Puffer 4-piece only to primary general-damage recipients', () => {
    const seedDialynAstra = createPreparedState({}, ['seed', 'dialyn', 'astraYao'], 0)
    expect(effectiveFourPieceIds(seedDialynAstra, 0)).toEqual([
      'dawnsBloom', 'woodpecker', 'pufferElectro',
    ])
    expect(effectiveFourPieceIds(seedDialynAstra, 1)).toEqual(['king'])
    expect(seedDialynAstra.slots[0].setup.fourPieceId).toBe('dawnsBloom')

    const seedCissiaDialyn = createPreparedState({}, ['seed', 'cissia', 'dialyn'], 0)
    expect(effectiveFourPieceIds(seedCissiaDialyn, 0)).toContain('pufferElectro')
    expect(effectiveFourPieceIds(seedCissiaDialyn, 1)).toContain('pufferElectro')
    expect(effectiveFourPieceIds(seedCissiaDialyn, 2)).not.toContain('pufferElectro')
    expect(effectiveTwoPieceIds(seedCissiaDialyn, 0)).not.toContain('pufferElectro')
    expect(effectiveMainStatIds(seedCissiaDialyn, 0, 'slot5')).not.toContain('penRatio')
    expect(effectiveMainStatIds(seedCissiaDialyn, 2, 'slot5')).toContain('penRatio')

    const anbySeedDialynOrders: Array<{
      agentIds: ['anbySoldier0', 'seed', 'dialyn'] | ['dialyn', 'seed', 'anbySoldier0']
      focusSlot: 0 | 2
    }> = [
      { agentIds: ['anbySoldier0', 'seed', 'dialyn'], focusSlot: 0 },
      { agentIds: ['dialyn', 'seed', 'anbySoldier0'], focusSlot: 2 },
    ]
    for (const { agentIds, focusSlot } of anbySeedDialynOrders) {
      const state = createPreparedState({}, agentIds, focusSlot)
      for (const [slot, { agentId }] of state.slots.entries()) {
        const candidates = effectiveFourPieceIds(state, slot as 0 | 1 | 2)
        if (agentId === 'dialyn') expect(candidates).not.toContain('pufferElectro')
        else expect(candidates).toContain('pufferElectro')
      }
    }

    const noRecipient = createPreparedState({}, ['yixuan', 'dialyn', 'lucia'], 0)
    expect(noRecipient.slots
      .flatMap((_, slot) => effectiveFourPieceIds(noRecipient, slot as 0 | 1 | 2)))
      .not.toContain('pufferElectro')
    const cissiaOnly = createPreparedState({}, ['yixuan', 'dialyn', 'cissia'], 0)
    expect(effectiveFourPieceIds(cissiaOnly, 0)).not.toContain('pufferElectro')
    expect(effectiveFourPieceIds(cissiaOnly, 2)).toContain('pufferElectro')

    const incomplete = {
      ...seedDialynAstra,
      slots: [...seedDialynAstra.slots] as typeof seedDialynAstra.slots,
    }
    incomplete.slots[0] = {
      ...incomplete.slots[0],
      setup: { ...incomplete.slots[0].setup, mains: { ...incomplete.slots[0].setup.mains, slot5: null } },
    }
    expect(effectiveFourPieceIds(incomplete, 0)).toContain('pufferElectro')
    expect(calculateParty(incomplete)).toBeNull()
  })

  it('keeps Puffer selection local through same-set recovery and target preparation', () => {
    let state = createPreparedState({}, ['seed', 'dialyn', 'astraYao'], 0)
    state = workbenchReducer(state, {
      type: 'selectDisc', slot: 0, piece: 'twoPiece', discId: 'pufferElectro',
    })
    const blocked = workbenchReducer(state, {
      type: 'selectDisc', slot: 0, piece: 'fourPiece', discId: 'pufferElectro',
    })
    expect(blocked).toBe(state)

    state = workbenchReducer(state, {
      type: 'selectDisc', slot: 0, piece: 'twoPiece', discId: 'woodpecker',
    })
    state = workbenchReducer(state, {
      type: 'selectDisc', slot: 0, piece: 'fourPiece', discId: 'pufferElectro',
    })
    expect(state.slots[0].setup).toMatchObject({
      fourPieceId: 'pufferElectro', twoPieceId: 'woodpecker',
    })

    const selectedSeed = state.slots[0]
    state = workbenchReducer(state, { type: 'setMindscape', slot: 1, mindscape: 1 })
    expect(state.slots[0]).toBe(selectedSeed)

    state = workbenchReducer(state, { type: 'setMindscape', slot: 0, mindscape: 1 })
    expect(state.slots[0].setup.fourPieceId).toBe('dawnsBloom')
    expect(state.slots[1].setup.mindscape).toBe(1)
  })

  it('preserves multiple direct Puffer selections through Dialyn preparation', () => {
    let state = createPreparedState({}, ['seed', 'cissia', 'dialyn'], 0)
    state = workbenchReducer(state, {
      type: 'selectDisc', slot: 0, piece: 'fourPiece', discId: 'pufferElectro',
    })
    state = workbenchReducer(state, {
      type: 'selectDisc', slot: 1, piece: 'fourPiece', discId: 'pufferElectro',
    })
    const seed = state.slots[0]
    const cissia = state.slots[1]

    state = workbenchReducer(state, { type: 'setMindscape', slot: 2, mindscape: 1 })
    state = workbenchReducer(state, { type: 'switchPool', slot: 2, pool: 'nonLimited' })
    expect(state.slots[0]).toBe(seed)
    expect(state.slots[1]).toBe(cissia)

    state = workbenchReducer(state, { type: 'setMindscape', slot: 1, mindscape: 1 })
    expect(state.slots[0]).toBe(seed)
    expect(state.slots[1].setup.fourPieceId).toBe('dawnsBloom')
    expect(state.slots[2].setup).toMatchObject({ mindscape: 1, pool: 'nonLimited' })
  })
})
