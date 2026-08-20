import { describe, expect, it } from 'vitest'
import {
  effectiveFourPieceIds,
  effectiveMainStatIds,
  effectiveSubstatChoicesForSlot,
  effectiveTwoPieceIds,
} from './candidates'
import { createPreparedState, isCompleteWorkbench, workbenchReducer } from './state'
import { activeCandidatePressures } from './provider-effects'

describe('selected King pressure', () => {
  it('keeps Woodpecker membership independent from Qingyi King pressure', () => {
    let state = createPreparedState({}, ['qingyi', 'harumasa', 'lucia'], 0)
    expect(effectiveTwoPieceIds(state, 0)).toContain('woodpecker')
    state = workbenchReducer(state, {
      type: 'selectDisc', slot: 0, piece: 'fourPiece', discId: 'swingJazz',
    })
    expect(effectiveTwoPieceIds(state, 0)).not.toContain('woodpecker')
    expect(effectiveSubstatChoicesForSlot(state, 0).map(({ id }) => id))
      .toEqual(['critRate', 'critDmg', 'atkPct'])
  })

  it('keeps Trigger CRIT qualification independent from King selection', () => {
    let state = createPreparedState({}, ['corin', 'trigger', 'astraYao'], 0)
    state = workbenchReducer(state, {
      type: 'selectDisc', slot: 1, piece: 'fourPiece', discId: 'astralVoice',
    })
    expect(effectiveMainStatIds(state, 1, 'slot4')).toContain('critRate')
    expect(effectiveSubstatChoicesForSlot(state, 1).map(({ id }) => id)).toEqual(['critRate'])
  })
})

describe('contextual Disc candidates', () => {
  it('adds Qingyi Astral only for the local buffer-provider set', () => {
    for (const provider of ['nicole', 'astraYao', 'panYinhu', 'zhao'] as const) {
      expect(effectiveFourPieceIds(
        createPreparedState({}, ['qingyi', provider, 'lucia'], 0),
        0,
      )).toContain('astralVoice')
    }
    expect(effectiveFourPieceIds(createPreparedState({}, ['qingyi', 'cissia', 'lucia'], 0), 0)).not.toContain('astralVoice')
  })

  it('routes the new exact 2-piece identities from the selected 4-piece role', () => {
    let ye = createPreparedState({}, ['yeShunguang', 'zhao', 'anby'], 0)
    expect(effectiveTwoPieceIds(ye, 0)).toContain('fangedMetal')
    expect(effectiveTwoPieceIds(ye, 0)).not.toContain('whiteWaterBallad')
    ye = workbenchReducer(ye, {
      type: 'selectDisc', slot: 0, piece: 'fourPiece', discId: 'woodpecker',
    })
    expect(effectiveTwoPieceIds(ye, 0)).toContain('whiteWaterBallad')
    expect(effectiveTwoPieceIds(ye, 0)).not.toContain('fangedMetal')

    let zhao = createPreparedState({}, ['yeShunguang', 'zhao', 'anby'], 0)
    expect(effectiveTwoPieceIds(zhao, 1)).toContain('yunkui')
    expect(effectiveTwoPieceIds(zhao, 1)).not.toContain('bunnyInWonderland')
    zhao = workbenchReducer(zhao, {
      type: 'selectDisc', slot: 1, piece: 'fourPiece', discId: 'astralVoice',
    })
    expect(effectiveTwoPieceIds(zhao, 1)).toContain('bunnyInWonderland')
    expect(effectiveTwoPieceIds(zhao, 1)).not.toContain('yunkui')
  })

  it('clears Qingyi selected-King Woodpecker without deleting independent substats', () => {
    let state = createPreparedState({}, ['qingyi', 'harumasa', 'lucia'], 0)
    expect(effectiveTwoPieceIds(state, 0)).toContain('woodpecker')
    expect(effectiveSubstatChoicesForSlot(state, 0).map(({ id }) => id)).toEqual(['critRate', 'critDmg', 'atkPct'])
    state = workbenchReducer(state, {
      type: 'selectDisc', slot: 0, piece: 'twoPiece', discId: 'woodpecker',
    })
    state = workbenchReducer(state, {
      type: 'setSubstat', slot: 0, key: 'critRate', value: 5,
    })
    state = workbenchReducer(state, {
      type: 'setSubstat', slot: 0, key: 'critDmg', value: 2,
    })
    state = workbenchReducer(state, {
      type: 'setSubstat', slot: 0, key: 'atkPct', value: 3,
    })
    state = workbenchReducer(state, { type: 'selectDisc', slot: 0, piece: 'fourPiece', discId: 'swingJazz' })
    expect(effectiveTwoPieceIds(state, 0)).not.toContain('woodpecker')
    expect(effectiveSubstatChoicesForSlot(state, 0).map(({ id }) => id))
      .toEqual(['critRate', 'critDmg', 'atkPct'])
    expect(state.slots[0].setup).toMatchObject({
      fourPieceId: 'swingJazz', twoPieceId: null,
      substats: { critRate: 5, critDmg: 2, atkPct: 3 },
    })
    expect(isCompleteWorkbench(state)).toBe(false)

    state = workbenchReducer(state, {
      type: 'selectDisc', slot: 0, piece: 'fourPiece', discId: 'king',
    })
    expect(effectiveTwoPieceIds(state, 0)).toContain('woodpecker')
    expect(effectiveSubstatChoicesForSlot(state, 0).map(({ id }) => id))
      .toEqual(['critRate', 'critDmg', 'atkPct'])
    expect(state.slots[0].setup).toMatchObject({
      fourPieceId: 'king', twoPieceId: null,
      substats: { critRate: 5, critDmg: 2, atkPct: 3 },
    })
  })

  it('admits Soldier 11 Puffer only with Dialyn Ultimate opportunity', () => {
    const withDialyn = createPreparedState({}, ['soldier11', 'dialyn', 'lucy'], 0)
    const withoutDialyn = createPreparedState({}, ['soldier11', 'lighter', 'lucy'], 0)

    expect(effectiveFourPieceIds(withDialyn, 0)).toContain('pufferElectro')
    expect(effectiveFourPieceIds(withoutDialyn, 0)).not.toContain('pufferElectro')
  })

  it('applies Nicole broad pressure to DEF-region directions while preserving Puffer 4-piece', () => {
    const generalDamage = createPreparedState({}, ['zhuYuan', 'nicole', 'dialyn'], 0)
    const anomalyDamage = createPreparedState({}, ['piper', 'nicole', 'anby'], 0)
    const ruptureContrast = createPreparedState({}, ['yixuan', 'nicole', 'dialyn'], 0)

    expect(effectiveFourPieceIds(generalDamage, 0)).toContain('pufferElectro')
    expect(effectiveTwoPieceIds(generalDamage, 0)).not.toContain('pufferElectro')
    expect(effectiveMainStatIds(generalDamage, 0, 'slot5')).toEqual(['etherDmg', 'atkPct'])
    expect(activeCandidatePressures(anomalyDamage, 0))
      .toEqual(['materialBroadPrePenDefBypass'])
    expect(effectiveTwoPieceIds(anomalyDamage, 0)).not.toContain('pufferElectro')
    expect(effectiveMainStatIds(anomalyDamage, 0, 'slot5')).toEqual(['physicalDmg', 'atkPct'])
    expect(effectiveMainStatIds(ruptureContrast, 0, 'slot5')).toEqual(['etherDmg', 'hpPct'])
  })

  it('keeps Grace same-effect AP identity and broad pressure lifecycles independent', () => {
    let state = createPreparedState({}, ['grace', 'astraYao', 'anby'], 0)
    expect(effectiveTwoPieceIds(state, 0)).toContain('freedomBlues')
    expect(effectiveTwoPieceIds(state, 0)).not.toContain('chaosJazz')
    expect(effectiveTwoPieceIds(state, 0)).not.toContain('thunderMetal')

    state = workbenchReducer(state, {
      type: 'selectDisc', slot: 0, piece: 'fourPiece', discId: 'freedomBlues',
    })
    expect(effectiveTwoPieceIds(state, 0)).toContain('chaosJazz')
    expect(effectiveTwoPieceIds(state, 0)).not.toContain('freedomBlues')
    state = workbenchReducer(state, {
      type: 'selectDisc', slot: 0, piece: 'twoPiece', discId: 'chaosJazz',
    })
    state = workbenchReducer(state, {
      type: 'selectDisc', slot: 0, piece: 'fourPiece', discId: 'thunderMetal',
    })
    expect(state.slots[0].setup.twoPieceId).toBeNull()
    expect(effectiveTwoPieceIds(state, 0)).toContain('freedomBlues')
    state = workbenchReducer(state, {
      type: 'selectDisc', slot: 0, piece: 'fourPiece', discId: 'freedomBlues',
    })
    expect(effectiveTwoPieceIds(state, 0)).toContain('chaosJazz')
    expect(state.slots[0].setup.twoPieceId).toBeNull()

    const pressured = createPreparedState({}, ['grace', 'nicole', 'anby'], 0)
    expect(effectiveTwoPieceIds(pressured, 0)).not.toContain('pufferElectro')
    expect(effectiveMainStatIds(pressured, 0, 'slot5')).toEqual(['electricDmg', 'atkPct'])
    expect(effectiveSubstatChoicesForSlot(pressured, 0).map(({ id }) => id))
      .toEqual(['anomalyProficiency', 'atkPct'])
  })
})
