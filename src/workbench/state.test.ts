import { describe, expect, it } from 'vitest'
import {
  DISC_IDS_BY_AGENT_AND_PIECE,
  ENGINE_IDS_BY_AGENT_AND_POOL,
  MAIN_STAT_IDS_BY_AGENT_AND_SLOT,
  PREPARED_SETUP_BY_AGENT_AND_POOL,
  W_ENGINES,
} from './content'
import {
  createPreparedState,
  isCompleteWorkbench,
  workbenchReducer,
} from './state'

describe('workbench state lifecycle', () => {
  it('retains only the authored candidates for the current party', () => {
    expect(ENGINE_IDS_BY_AGENT_AND_POOL).toEqual({
      yixuan: {
        full: ['qingming', 'cauldron', 'radiowave', 'puzzleSphere'],
        nonLimited: ['cauldron', 'radiowave', 'puzzleSphere'],
      },
      dialyn: {
        full: ['yesterdayCalls', 'chiefSidekick', 'hellfireGears', 'steamOven'],
        nonLimited: ['hellfireGears', 'steamOven'],
      },
      lucia: {
        full: [
          'dreamlitHearth',
          'thoughtbop',
          'weepingCradle',
          'kaboom',
          'unfetteredGameBall',
        ],
        nonLimited: ['weepingCradle', 'kaboom', 'unfetteredGameBall'],
      },
    })
    expect(DISC_IDS_BY_AGENT_AND_PIECE.yixuan).toEqual({
      fourPiece: ['yunkui'],
      twoPiece: ['woodpecker', 'branchAndBlade'],
    })
    expect(MAIN_STAT_IDS_BY_AGENT_AND_SLOT.yixuan).toEqual({
      slot4: ['critRate', 'critDmg'],
      slot5: ['etherDmg', 'hpPct'],
      slot6: ['hpPct'],
    })
  })

  it('starts all three Agents from their authored full-pool setup', () => {
    const state = createPreparedState()

    expect(state.setups.yixuan).toMatchObject({
      mindscape: 0,
      pool: 'full',
      engineId: 'qingming',
      refinement: 1,
      fourPieceId: 'yunkui',
      twoPieceId: 'woodpecker',
      mains: { slot4: 'critRate', slot5: 'etherDmg', slot6: 'hpPct' },
      substats: { critRate: 0, critDmg: 0, hpPct: 0 },
    })
    expect(state.setups.dialyn).toMatchObject({
      engineId: 'yesterdayCalls',
      refinement: 1,
      substats: { critRate: 0 },
    })
    expect(state.setups.lucia).toMatchObject({
      engineId: 'dreamlitHearth',
      refinement: 1,
      substats: { hpPct: 0, hpFlat: 0 },
    })
    expect(isCompleteWorkbench(state)).toBe(true)
  })

  it('applies Rank defaults on direct W-Engine edits and preserves downstream inputs', () => {
    let state = createPreparedState()
    state = workbenchReducer(state, {
      type: 'setSubstat',
      agentId: 'yixuan',
      key: 'hpPct',
      value: 7,
    })
    state = workbenchReducer(state, {
      type: 'selectMainStat',
      agentId: 'yixuan',
      slot: 'slot4',
      mainStatId: 'critDmg',
    })
    const before = state.setups.yixuan
    state = workbenchReducer(state, {
      type: 'selectEngine',
      agentId: 'yixuan',
      engineId: 'cauldron',
    })

    expect(state.setups.yixuan).toMatchObject({
      engineId: 'cauldron',
      refinement: W_ENGINES.cauldron.defaultRefinement,
      fourPieceId: before.fourPieceId,
      twoPieceId: before.twoPieceId,
      mains: before.mains,
      substats: before.substats,
    })
  })

  it('edits refinement, Disc, and main stat without resetting unrelated inputs', () => {
    let state = createPreparedState()
    state = workbenchReducer(state, {
      type: 'setSubstat',
      agentId: 'yixuan',
      key: 'critDmg',
      value: 4,
    })
    state = workbenchReducer(state, {
      type: 'setRefinement',
      agentId: 'yixuan',
      refinement: 3,
    })
    state = workbenchReducer(state, {
      type: 'selectDisc',
      agentId: 'yixuan',
      piece: 'twoPiece',
      discId: 'branchAndBlade',
    })
    state = workbenchReducer(state, {
      type: 'selectMainStat',
      agentId: 'yixuan',
      slot: 'slot5',
      mainStatId: 'hpPct',
    })

    expect(state.setups.yixuan).toMatchObject({
      refinement: 3,
      twoPieceId: 'branchAndBlade',
      mains: { slot4: 'critRate', slot5: 'hpPct', slot6: 'hpPct' },
      substats: { critRate: 0, critDmg: 4, hpPct: 0 },
    })
  })

  it('re-prepares only the Agent whose Mindscape changes and preserves its pool', () => {
    let state = createPreparedState({ yixuan: 'nonLimited' })
    state = workbenchReducer(state, {
      type: 'setSubstat',
      agentId: 'yixuan',
      key: 'critRate',
      value: 5,
    })
    state = workbenchReducer(state, {
      type: 'selectDisc',
      agentId: 'yixuan',
      piece: 'twoPiece',
      discId: 'branchAndBlade',
    })
    const dialynBefore = state.setups.dialyn
    const luciaBefore = state.setups.lucia

    state = workbenchReducer(state, {
      type: 'setMindscape',
      agentId: 'yixuan',
      mindscape: 3,
    })

    expect(state.setups.dialyn).toBe(dialynBefore)
    expect(state.setups.lucia).toBe(luciaBefore)
    expect(state.setups.yixuan).toMatchObject({
      mindscape: 3,
      pool: 'nonLimited',
      engineId: PREPARED_SETUP_BY_AGENT_AND_POOL.yixuan.nonLimited.engineId,
      refinement: W_ENGINES.cauldron.defaultRefinement,
      fourPieceId: 'yunkui',
      twoPieceId: 'woodpecker',
      mains: { slot4: 'critRate', slot5: 'etherDmg', slot6: 'hpPct' },
      substats: { critRate: 0, critDmg: 0, hpPct: 0 },
    })

    state = workbenchReducer(state, {
      type: 'switchPool',
      agentId: 'yixuan',
      pool: 'full',
    })
    expect(state.setups.yixuan.mindscape).toBe(3)
    expect(state.setups.yixuan.pool).toBe('full')
  })

  it('re-prepares only the Agent whose pool changes', () => {
    let state = createPreparedState()
    state = workbenchReducer(state, {
      type: 'setSubstat',
      agentId: 'yixuan',
      key: 'critRate',
      value: 5,
    })
    state = workbenchReducer(state, {
      type: 'setSubstat',
      agentId: 'dialyn',
      key: 'critRate',
      value: 3,
    })
    state = workbenchReducer(state, {
      type: 'selectDisc',
      agentId: 'dialyn',
      piece: 'twoPiece',
      discId: 'swingJazz',
    })
    const yixuanBefore = state.setups.yixuan
    const luciaBefore = state.setups.lucia

    state = workbenchReducer(state, {
      type: 'switchPool',
      agentId: 'dialyn',
      pool: 'nonLimited',
    })

    expect(state.setups.yixuan).toBe(yixuanBefore)
    expect(state.setups.lucia).toBe(luciaBefore)
    expect(state.setups.dialyn).toEqual({
      mindscape: 0,
      pool: 'nonLimited',
      engineId: PREPARED_SETUP_BY_AGENT_AND_POOL.dialyn.nonLimited.engineId,
      refinement: 1,
      fourPieceId: 'king',
      twoPieceId: 'woodpecker',
      mains: { slot4: 'critRate', slot5: 'atkPct', slot6: 'energyRegenPct' },
      substats: { critRate: 0 },
    })
  })

  it('rejects choices outside the current Agent, pool, piece, or slot', () => {
    const prepared = createPreparedState({ yixuan: 'nonLimited' })
    expect(workbenchReducer(prepared, {
      type: 'selectEngine',
      agentId: 'yixuan',
      engineId: 'qingming',
    })).toBe(prepared)
    expect(workbenchReducer(prepared, {
      type: 'selectDisc',
      agentId: 'lucia',
      piece: 'twoPiece',
      discId: 'woodpecker',
    })).toBe(prepared)
    expect(workbenchReducer(prepared, {
      type: 'selectMainStat',
      agentId: 'dialyn',
      slot: 'slot6',
      mainStatId: 'hpPct',
    })).toBe(prepared)
  })

  it('bounds only the effective substats offered to each Agent', () => {
    const prepared = createPreparedState()
    const below = workbenchReducer(prepared, {
      type: 'adjustSubstat',
      agentId: 'lucia',
      key: 'hpFlat',
      delta: -1,
    })
    const above = workbenchReducer(prepared, {
      type: 'setSubstat',
      agentId: 'lucia',
      key: 'hpFlat',
      value: 99,
    })
    const invalid = workbenchReducer(prepared, {
      type: 'setSubstat',
      agentId: 'dialyn',
      key: 'hpPct',
      value: 1,
    })

    expect(below.setups.lucia.substats.hpFlat).toBe(0)
    expect(above.setups.lucia.substats.hpFlat).toBe(36)
    expect(invalid).toBe(prepared)
  })
})
