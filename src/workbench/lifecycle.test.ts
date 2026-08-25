import { describe, expect, it } from 'vitest'
import { calculateParty } from './calculate'
import {
  resolveSeedVanguard,
  resolveSeedVanguardForState,
} from './candidate-context'
import {
  effectiveFourPieceIds,
  effectiveFourPieceRoleSwapIds,
  effectiveMainStatIds,
  effectiveSubstatChoicesForSlot,
  effectiveTwoPieceIds,
  incompleteRequiredSelections,
} from './candidates'
import {
  ADMITTED_AGENTS,
  DRIVE_DISCS,
  EFFECTIVE_SUBSTAT_VALUES,
  MAIN_STATS,
  W_ENGINES,
  isFocusEligible,
  setupPolicyFor,
  type AgentId,
  type MainSlot,
  type PoolId,
} from './content'
import {
  createPreparedState,
  isCompleteWorkbench,
  workbenchReducer,
  type AppliedSlot,
  type WorkbenchState,
} from './state'

const POOLS: readonly PoolId[] = ['full', 'nonLimited']
const MAIN_SLOTS: readonly MainSlot[] = ['slot4', 'slot5', 'slot6']
const SAFE_COMPANIONS: readonly AgentId[] = ['yixuan', 'dialyn', 'lucia']

function candidateStateFor(agentId: AgentId, pool: PoolId): WorkbenchState {
  const agentIds = [
    agentId,
    ...SAFE_COMPANIONS.filter((candidate) => candidate !== agentId),
  ].slice(0, 3) as [AgentId, AgentId, AgentId]
  const focusSlot = agentIds.findIndex(isFocusEligible) as AppliedSlot
  if (focusSlot < 0) throw new Error(`Candidate fixture requires a Focus: ${agentId}`)
  return createPreparedState({ [agentId]: pool }, agentIds, focusSlot)
}

function repairCompleteState(state: WorkbenchState): WorkbenchState {
  let next = state
  for (let pass = 0; pass < 8 && !isCompleteWorkbench(next); pass += 1) {
    for (const slot of [0, 1, 2] as const) {
      let setup = next.slots[slot].setup
      if (!setup.engineId) {
        const engineId = setupPolicyFor(next.slots[slot].agentId)
          .engineIdsByPool[setup.pool][0]
        next = workbenchReducer(next, { type: 'selectEngine', slot, engineId })
        setup = next.slots[slot].setup
      }
      if (!setup.fourPieceId) {
        const discId = effectiveFourPieceIds(next, slot)
          .find((candidate) => candidate !== setup.twoPieceId)
        if (!discId) throw new Error(`No compatible 4-piece repair for slot ${slot}`)
        next = workbenchReducer(next, { type: 'selectDisc', slot, piece: 'fourPiece', discId })
        setup = next.slots[slot].setup
      }
      if (!setup.twoPieceId) {
        const discId = effectiveTwoPieceIds(next, slot)
          .find((candidate) => candidate !== setup.fourPieceId)
        if (!discId) throw new Error(`No compatible 2-piece repair for slot ${slot}`)
        next = workbenchReducer(next, { type: 'selectDisc', slot, piece: 'twoPiece', discId })
        setup = next.slots[slot].setup
      }
      for (const mainSlot of MAIN_SLOTS) {
        if (setup.mains[mainSlot]) continue
        const mainStatId = effectiveMainStatIds(next, slot, mainSlot)[0]
        if (!mainStatId) throw new Error(`No ${mainSlot} repair for slot ${slot}`)
        next = workbenchReducer(next, {
          type: 'selectMainStat', slot, mainSlot, mainStatId,
        })
        setup = next.slots[slot].setup
      }
      for (const { id } of effectiveSubstatChoicesForSlot(next, slot)) {
        if (Number.isFinite(setup.substats[id])) continue
        next = workbenchReducer(next, { type: 'setSubstat', slot, key: id, value: 0 })
        setup = next.slots[slot].setup
      }
    }
  }
  return next
}

function expectCalculable(state: WorkbenchState, context: string): WorkbenchState {
  const complete = repairCompleteState(state)
  expect(isCompleteWorkbench(complete), context).toBe(true)
  expect(calculateParty(complete), context).not.toBeNull()
  return complete
}

function expectPreparedCalculable(state: WorkbenchState, context: string): void {
  expect(incompleteRequiredSelections(state), context).toEqual([])
  expect(isCompleteWorkbench(state), context).toBe(true)
  expect(calculateParty(state), context).not.toBeNull()
}

function effectiveCandidateSignature(state: WorkbenchState, slot: AppliedSlot): string {
  const setup = state.slots[slot].setup
  return JSON.stringify({
    fourPieceIds: effectiveFourPieceIds(state, slot),
    twoPieceIds: effectiveTwoPieceIds(state, slot),
    selectedFourPieceId: setup.fourPieceId,
    selectedTwoPieceId: setup.twoPieceId,
    mains: MAIN_SLOTS.map((mainSlot) => effectiveMainStatIds(state, slot, mainSlot)),
    substats: effectiveSubstatChoicesForSlot(state, slot).map(({ id }) => id),
  })
}

function exerciseScalarCandidates(
  state: WorkbenchState,
  slot: AppliedSlot,
  context: string,
): void {
  for (const mainSlot of MAIN_SLOTS) {
    for (const mainStatId of effectiveMainStatIds(state, slot, mainSlot)) {
      const selected = workbenchReducer(state, {
        type: 'selectMainStat', slot, mainSlot, mainStatId,
      })
      expect(selected.slots[slot].setup.mains[mainSlot], context).toBe(mainStatId)
      expectCalculable(selected, `${context}:${mainSlot}:${mainStatId}`)
    }
  }
  for (const { id } of effectiveSubstatChoicesForSlot(state, slot)) {
    const selected = workbenchReducer(state, {
      type: 'setSubstat', slot, key: id, value: 1,
    })
    expect(selected.slots[slot].setup.substats[id], context).toBe(1)
    expectCalculable(selected, `${context}:substat:${id}`)
  }
}

function exerciseEffectiveCandidates(
  initial: WorkbenchState,
  slot: AppliedSlot,
  context: string,
): void {
  const state = expectCalculable(initial, context)
  exerciseScalarCandidates(state, slot, context)

  const setup = state.slots[slot].setup
  const roleSwaps = effectiveFourPieceRoleSwapIds(state, slot)
  const twoPieceCandidates = effectiveTwoPieceIds(state, slot)
  const visibleFourPieceIds = effectiveFourPieceIds(state, slot).filter((discId) => (
    discId === setup.fourPieceId
      || discId !== setup.twoPieceId
      || roleSwaps.includes(discId)
      || Boolean(setup.fourPieceId && twoPieceCandidates.includes(setup.fourPieceId))
  ))
  for (const discId of visibleFourPieceIds) {
    const selected = workbenchReducer(state, {
      type: 'selectDisc', slot, piece: 'fourPiece', discId,
    })
    expect(selected.slots[slot].setup.fourPieceId, context).toBe(discId)
    const complete = expectCalculable(selected, `${context}:4pc:${discId}`)
    exerciseScalarCandidates(complete, slot, `${context}:4pc:${discId}`)
    for (const twoPieceId of effectiveTwoPieceIds(complete, slot).filter((candidate) => (
      candidate !== complete.slots[slot].setup.fourPieceId
    ))) {
      const withTwoPiece = workbenchReducer(complete, {
        type: 'selectDisc', slot, piece: 'twoPiece', discId: twoPieceId,
      })
      expect(withTwoPiece.slots[slot].setup.twoPieceId, context).toBe(twoPieceId)
      expectCalculable(withTwoPiece, `${context}:4pc:${discId}:2pc:${twoPieceId}`)
    }
  }
  for (const discId of twoPieceCandidates.filter((candidate) => (
    candidate !== setup.fourPieceId
  ))) {
    const selected = workbenchReducer(state, {
      type: 'selectDisc', slot, piece: 'twoPiece', discId,
    })
    expect(selected.slots[slot].setup.twoPieceId, context).toBe(discId)
    expectCalculable(selected, `${context}:2pc:${discId}`)
  }
}

describe('shared preparation and edit lifecycle', () => {
  it('keeps authored setup references valid and every exposed candidate calculable', () => {
    for (const agent of ADMITTED_AGENTS) {
      const policy = setupPolicyFor(agent.id)
      const exercisedCandidateSets = new Set<string>()
      for (const pool of POOLS) {
        expect(policy.engineIdsByPool[pool].length, `${agent.id}:${pool}`).toBeGreaterThan(0)
        const state = candidateStateFor(agent.id, pool)
        for (const engineId of policy.engineIdsByPool[pool]) {
          expect(W_ENGINES, `${agent.id}:${engineId}`).toHaveProperty(engineId)
          const selected = workbenchReducer(state, {
            type: 'selectEngine', slot: 0, engineId,
          })
          expect(selected.slots[0].setup.engineId, `${agent.id}:${engineId}`).toBe(engineId)
          expectCalculable(selected, `${agent.id}:${pool}:${engineId}`)
        }
      }
      for (const discId of [
        ...policy.discIdsByPiece.fourPiece,
        ...policy.discIdsByPiece.twoPiece,
      ]) {
        expect(DRIVE_DISCS, `${agent.id}:${discId}`).toHaveProperty(discId)
      }
      const preparedDisc = policy.preparedDisc
      const patches = [
        preparedDisc?.astralCollisionAlternative?.patch,
        preparedDisc?.moonlightCollisionAlternative?.patch,
        preparedDisc?.kingCollisionAlternative?.patch,
      ].filter((patch): patch is NonNullable<typeof patch> => patch !== undefined)
      for (const patch of patches) {
        expect(policy.discIdsByPiece.fourPiece, `${agent.id}:prepared:${patch.fourPieceId}`)
          .toContain(patch.fourPieceId)
        if (patch.twoPieceId) {
          expect(policy.discIdsByPiece.twoPiece, `${agent.id}:prepared:${patch.twoPieceId}`)
            .toContain(patch.twoPieceId)
          expect(patch.twoPieceId, `${agent.id}:prepared:different-set`)
            .not.toBe(patch.fourPieceId)
        }
        for (const [mainSlot, mainStatId] of Object.entries(patch.mains ?? {})) {
          expect(policy.mainStatIdsBySlot[mainSlot as MainSlot], `${agent.id}:prepared:${mainSlot}`)
            .toContain(mainStatId)
        }
      }
      for (const mainSlot of MAIN_SLOTS) {
        for (const mainStatId of policy.mainStatIdsBySlot[mainSlot]) {
          expect(MAIN_STATS, `${agent.id}:${mainSlot}:${mainStatId}`)
            .toHaveProperty(mainStatId)
        }
      }
      for (const choice of policy.substatChoices) {
        expect(EFFECTIVE_SUBSTAT_VALUES[choice.id], `${agent.id}:${choice.id}`)
          .toBe(choice)
      }
      for (const pool of POOLS) {
        for (const mindscape of [0, 1, 2, 3, 4, 5, 6] as const) {
          const baseState = candidateStateFor(agent.id, pool)
          const representativeState = baseState.slots[0].setup.mindscape === mindscape
            ? baseState
            : workbenchReducer(baseState, { type: 'setMindscape', slot: 0, mindscape })
          const representative = representativeState.slots[0].setup
          expect(policy.engineIdsByPool[pool], `${agent.id}:${pool}:M${mindscape}`)
            .toContain(representative.engineId)
          expect(effectiveFourPieceIds(representativeState, 0), `${agent.id}:${pool}:M${mindscape}`)
            .toContain(representative.fourPieceId)
          expect(effectiveTwoPieceIds(representativeState, 0), `${agent.id}:${pool}:M${mindscape}`)
            .toContain(representative.twoPieceId)
          expect(representative.fourPieceId, `${agent.id}:${pool}:M${mindscape}`)
            .not.toBe(representative.twoPieceId)
          for (const mainSlot of MAIN_SLOTS) {
            expect(effectiveMainStatIds(representativeState, 0, mainSlot), `${agent.id}:${pool}:M${mindscape}`)
              .toContain(representative.mains[mainSlot])
          }
          for (const { id } of effectiveSubstatChoicesForSlot(representativeState, 0)) {
            expect(representative.substats[id], `${agent.id}:${pool}:M${mindscape}:${id}`)
              .toBe(0)
          }
          expectPreparedCalculable(representativeState, `${agent.id}:${pool}:M${mindscape}`)
          const signature = effectiveCandidateSignature(representativeState, 0)
          if (!exercisedCandidateSets.has(signature)) {
            exercisedCandidateSets.add(signature)
            exerciseEffectiveCandidates(representativeState, 0, `${agent.id}:${pool}:M${mindscape}`)
          }
        }
      }
    }

    const contextualParties: readonly [AgentId, AgentId, AgentId][] = [
      ['cissia', 'astraYao', 'yixuan'],
      ['evelyn', 'astraYao', 'yixuan'],
      ['caesar', 'astraYao', 'yixuan'],
      ['qingyi', 'nicole', 'yixuan'],
      ['trigger', 'anbySoldier0', 'yixuan'],
      ['corin', 'dialyn', 'lycaon'],
    ]
    for (const agentIds of contextualParties) {
      const focusSlot = agentIds.findIndex(isFocusEligible) as AppliedSlot
      exerciseEffectiveCandidates(
        createPreparedState({}, [...agentIds], focusSlot),
        0,
        `contextual:${agentIds.join('+')}`,
      )
    }
  }, 30_000)

  it('requires local whole-package admission for contextual received-Ultimate discs', () => {
    const admitted = createPreparedState({}, ['corin', 'dialyn', 'lycaon'], 0)
    expect(effectiveFourPieceIds(admitted, 0)).toContain('pufferElectro')

    const hugoM0 = createPreparedState({}, ['hugo', 'dialyn', 'lycaon'], 0)
    expect(effectiveFourPieceIds(hugoM0, 0)).not.toContain('pufferElectro')

    const hugoM2 = workbenchReducer(hugoM0, {
      type: 'setMindscape', slot: 0, mindscape: 2,
    })
    expect(effectiveFourPieceIds(hugoM2, 0)).toContain('pufferElectro')
    expect(hugoM2.slots[0].setup.fourPieceId).toBe('hormonePunk')

    const hugoM1 = workbenchReducer(hugoM2, {
      type: 'setMindscape', slot: 0, mindscape: 1,
    })
    expect(effectiveFourPieceIds(hugoM1, 0)).not.toContain('pufferElectro')
    expect(hugoM1.slots[0].setup.fourPieceId).toBe('hormonePunk')
  })

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

  it('offers only atomic 4-piece role swaps that reuse the prior 4-piece', () => {
    let sethState = createPreparedState({}, ['jane', 'seth', 'yuzuha'], 0)
    expect(sethState.slots[1].setup).toMatchObject({
      fourPieceId: 'astralVoice', twoPieceId: 'swingJazz',
    })
    expect(effectiveFourPieceRoleSwapIds(sethState, 1)).not.toContain('swingJazz')

    sethState = workbenchReducer(sethState, {
      type: 'selectDisc', slot: 1, piece: 'fourPiece', discId: 'swingJazz',
    })
    expect(sethState.slots[1].setup).toMatchObject({
      fourPieceId: 'astralVoice', twoPieceId: 'swingJazz',
    })

    let janeState = createPreparedState({}, ['jane', 'trigger', 'seth'], 0)
    expect(janeState.slots[0].setup).toMatchObject({
      fourPieceId: 'fangedMetal', twoPieceId: 'freedomBlues',
    })
    expect(effectiveFourPieceRoleSwapIds(janeState, 0)).toContain('freedomBlues')

    janeState = workbenchReducer(janeState, {
      type: 'selectDisc', slot: 0, piece: 'fourPiece', discId: 'freedomBlues',
    })
    expect(janeState.slots[0].setup).toMatchObject({
      fourPieceId: 'freedomBlues', twoPieceId: 'fangedMetal',
    })
    expectCalculable(janeState, 'atomic 4-piece role swap')
  })

  it('derives CRIT investment pressure from selected King instead of fixed personal supply', () => {
    let state = createPreparedState({}, ['qingyi', 'harumasa', 'nicole'], 1)

    expect(state.slots[0].setup.fourPieceId).toBe('king')
    expect(state.slots[2].setup.fourPieceId).toBe('moonlight')
    expect(effectiveMainStatIds(state, 0, 'slot4')).toContain('critRate')
    expect(effectiveSubstatChoicesForSlot(state, 0).map(({ id }) => id))
      .toEqual(['critRate'])
    expect(effectiveTwoPieceIds(state, 0)).toContain('woodpecker')

    state = workbenchReducer(state, {
      type: 'selectDisc', slot: 0, piece: 'fourPiece', discId: 'shockstar',
    })
    expect(state.slots[0].setup.mains.slot4).toBeNull()
    expect(state.slots[0].setup.substats).toEqual({})
    expect(effectiveMainStatIds(state, 0, 'slot4')).toEqual(['critDmg', 'atkPct'])
    expect(effectiveSubstatChoicesForSlot(state, 0)).toEqual([])
    expect(effectiveTwoPieceIds(state, 0)).not.toContain('woodpecker')
    expect(calculateParty(state)).toBeNull()

    state = workbenchReducer(state, {
      type: 'selectMainStat', slot: 0, mainSlot: 'slot4', mainStatId: 'atkPct',
    })
    state = workbenchReducer(state, { type: 'setMindscape', slot: 0, mindscape: 1 })
    state = workbenchReducer(state, {
      type: 'selectDisc', slot: 0, piece: 'fourPiece', discId: 'shockstar',
    })
    expect(effectiveMainStatIds(state, 0, 'slot4')).not.toContain('critRate')
    expect(effectiveSubstatChoicesForSlot(state, 0)).toEqual([])

    state = workbenchReducer(state, {
      type: 'selectDisc', slot: 0, piece: 'fourPiece', discId: 'king',
    })
    expect(state.slots[0].setup.mains.slot4).toBeNull()
    expect(state.slots[0].setup.substats).toEqual({ critRate: 0 })
    expect(effectiveMainStatIds(state, 0, 'slot4')).toContain('critRate')
    expect(calculateParty(state)).toBeNull()
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

  it('allocates a non-stacking prepared package through holder policy in party and target rebuilds', () => {
    let state = createPreparedState({}, ['nicole', 'lucy', 'zhuYuan'], 2)
    expect(state.slots.map(({ setup }) => setup.fourPieceId))
      .toEqual(['moonlight', 'astralVoice', 'chaoticMetal'])

    const establishedNicole = state.slots[0]
    state = workbenchReducer(state, { type: 'switchPool', slot: 1, pool: 'nonLimited' })
    expect(state.slots[0]).toBe(establishedNicole)
    expect(state.slots[1].setup).toMatchObject({
      fourPieceId: 'astralVoice', twoPieceId: 'moonlight',
    })

    const contrast = createPreparedState({}, ['nicole', 'zhuYuan', 'ben'], 1)
    expect(contrast.slots[0].setup.fourPieceId).toBe('moonlight')

    let contextualAstra = createPreparedState(
      {}, ['cissia', 'astraYao', 'nicole'], 0,
    )
    expect(Object.fromEntries(contextualAstra.slots.map(({ agentId, setup }) => (
      [agentId, setup.fourPieceId]
    )))).toMatchObject({ cissia: 'dawnsBloom', astraYao: 'astralVoice', nicole: 'moonlight' })
    expectCalculable(contextualAstra, 'contextual Astra Moonlight reversal')
    const establishedAroundAstra = [contextualAstra.slots[0], contextualAstra.slots[2]]
    contextualAstra = workbenchReducer(contextualAstra, {
      type: 'switchPool', slot: 1, pool: 'nonLimited',
    })
    expect(contextualAstra.slots[1].setup).toMatchObject({
      fourPieceId: 'astralVoice', twoPieceId: 'moonlight',
    })
    expect([contextualAstra.slots[0], contextualAstra.slots[2]])
      .toEqual(establishedAroundAstra)

    const moonlightRepresentatives = ADMITTED_AGENTS.map(({ id }) => id)
      .filter((agentId) => setupPolicyFor(agentId)
        .representativeSetupFor('full', 0).fourPieceId === 'moonlight')
    for (let left = 0; left < moonlightRepresentatives.length; left += 1) {
      for (let right = left + 1; right < moonlightRepresentatives.length; right += 1) {
        const pair = [moonlightRepresentatives[left], moonlightRepresentatives[right]] as const
        for (const orderedPair of [pair, [pair[1], pair[0]] as const]) {
          const prepared = createPreparedState({}, [...orderedPair, 'yixuan'], 2)
          const moonlightHolders = prepared.slots
            .filter(({ setup }) => setup.fourPieceId === 'moonlight')
          expect(moonlightHolders, `Moonlight allocation: ${orderedPair.join('+')}`)
            .toHaveLength(1)
          const rigidKeeper = orderedPair.find((agentId) => (
            !setupPolicyFor(agentId).preparedDisc?.moonlightCollisionAlternative
          ))
          const expectedKeeper = rigidKeeper ?? orderedPair.reduce((keeper, candidate) => {
            const keeperPrecedence = setupPolicyFor(keeper).preparedDisc
              ?.moonlightCollisionAlternative?.authoredKeeperPrecedence ?? -1
            const candidatePrecedence = setupPolicyFor(candidate).preparedDisc
              ?.moonlightCollisionAlternative?.authoredKeeperPrecedence ?? -1
            return candidatePrecedence > keeperPrecedence ? candidate : keeper
          })
          expect(moonlightHolders[0].agentId, `Moonlight keeper: ${orderedPair.join('+')}`)
            .toBe(expectedKeeper)
          expectCalculable(prepared, `Moonlight allocation: ${orderedPair.join('+')}`)
        }
      }
    }

    const collisionCases = [
      {
        label: 'authored Astral precedence',
        agentIds: ['astraYao', 'panYinhu', 'yixuan'], focusSlot: 2, targetSlot: 0,
        expected: { fourPieceId: 'moonlight', twoPieceId: 'astralVoice' },
      },
      {
        label: 'rigid King holder',
        agentIds: ['juFufu', 'dialyn', 'yixuan'], focusSlot: 2, targetSlot: 0,
        expected: {
          fourPieceId: 'swingJazz', twoPieceId: 'king', mains: { slot4: 'atkPct' },
        },
      },
      {
        label: 'exact King holder',
        agentIds: ['qingyi', 'dialyn', 'yixuan'], focusSlot: 2, targetSlot: 0,
        expected: {
          fourPieceId: 'shockstar', twoPieceId: 'king', mains: { slot4: 'atkPct' },
        },
      },
    ] as const
    for (const collision of collisionCases) {
      let prepared = createPreparedState(
        {}, [...collision.agentIds], collision.focusSlot,
      )
      expect(prepared.slots[collision.targetSlot].setup, collision.label)
        .toMatchObject(collision.expected)
      expect(prepared.slots.every(({ setup }) => (
        Object.values(setup.substats).every((value) => value === 0)
      )), collision.label).toBe(true)
      expectCalculable(prepared, collision.label)

      const established = prepared.slots.filter((_, index) => index !== collision.targetSlot)
      prepared = workbenchReducer(prepared, {
        type: 'switchPool', slot: collision.targetSlot, pool: 'nonLimited',
      })
      expect(prepared.slots[collision.targetSlot].setup, `${collision.label}:target rebuild`)
        .toMatchObject(collision.expected)
      expect(prepared.slots.filter((_, index) => index !== collision.targetSlot))
        .toEqual(established)
      expectCalculable(prepared, `${collision.label}:target rebuild`)
    }
  })

  it('preserves Party Apply allocation and selected-pressure lifecycle across later edits', () => {
    let allocated = createPreparedState({}, ['jane', 'seth', 'cissia'], 0)
    expect(allocated.slots[0].setup).toMatchObject({
      twoPieceId: 'pufferElectro',
      mains: { slot5: 'penRatio' },
    })
    expect(allocated.slots[1].setup).toMatchObject({
      fourPieceId: 'swingJazz', twoPieceId: 'moonlight',
    })
    expect(allocated.slots[2].setup.fourPieceId).toBe('astralVoice')
    expectPreparedCalculable(allocated, 'Jane pressure with Seth/Cissia allocation')

    const established = [allocated.slots[0], allocated.slots[2]]
    allocated = workbenchReducer(allocated, {
      type: 'switchPool', slot: 1, pool: 'nonLimited',
    })
    expect([allocated.slots[0], allocated.slots[2]]).toEqual(established)
    expect(allocated.slots[1].setup).toMatchObject({
      fourPieceId: 'swingJazz', twoPieceId: 'moonlight',
    })
    expectPreparedCalculable(allocated, 'Seth target rebuild around established holders')

    let pressure = createPreparedState({}, ['jane', 'trigger', 'seth'], 0)
    expect(pressure.slots[0].setup).toMatchObject({
      twoPieceId: 'freedomBlues',
      mains: { slot5: 'physicalDmg' },
    })

    pressure = workbenchReducer(pressure, {
      type: 'selectEngine', slot: 1, engineId: 'iceJadeTeapot',
    })
    expect(effectiveTwoPieceIds(pressure, 0)).toContain('pufferElectro')
    expect(effectiveMainStatIds(pressure, 0, 'slot5')).toContain('penRatio')
    expect(pressure.slots[0].setup).toMatchObject({
      twoPieceId: 'freedomBlues',
      mains: { slot5: 'physicalDmg' },
    })

    pressure = workbenchReducer(pressure, {
      type: 'selectDisc', slot: 0, piece: 'twoPiece', discId: 'pufferElectro',
    })
    pressure = workbenchReducer(pressure, {
      type: 'selectMainStat', slot: 0, mainSlot: 'slot5', mainStatId: 'penRatio',
    })
    expect(calculateParty(pressure)).not.toBeNull()

    pressure = workbenchReducer(pressure, {
      type: 'selectEngine', slot: 1, engineId: 'spectralGaze',
    })
    expect(pressure.slots[0].setup).toMatchObject({
      twoPieceId: null,
      mains: { slot5: null },
    })
    expect(calculateParty(pressure)).toBeNull()

    pressure = workbenchReducer(pressure, {
      type: 'selectEngine', slot: 1, engineId: 'iceJadeTeapot',
    })
    expect(effectiveTwoPieceIds(pressure, 0)).toContain('pufferElectro')
    expect(effectiveMainStatIds(pressure, 0, 'slot5')).toContain('penRatio')
    expect(pressure.slots[0].setup).toMatchObject({
      twoPieceId: null,
      mains: { slot5: null },
    })
  })

  it('does not prepare contextual Astral over an established target-only holder', () => {
    let state = createPreparedState({}, ['cissia', 'astraYao', 'yixuan'], 2)
    state = workbenchReducer(state, {
      type: 'selectDisc', slot: 1, piece: 'fourPiece', discId: 'astralVoice',
    })

    const establishedAstra = state.slots[1]
    state = workbenchReducer(state, {
      type: 'switchPool', slot: 0, pool: 'nonLimited',
    })

    expect(state.slots[1]).toBe(establishedAstra)
    expect(state.slots[1].setup.fourPieceId).toBe('astralVoice')
    expect(state.slots[0].setup.fourPieceId).toBe('dawnsBloom')
    expect(state.slots.filter(({ setup }) => setup.fourPieceId === 'astralVoice'))
      .toHaveLength(1)
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

describe('selected party relationship resolution', () => {
  it('selects the only other Attack without requiring an Initial ATK calculation', () => {
    const state = createPreparedState({}, ['seed', 'cissia', 'astraYao'], 0)
    state.slots[1].setup.engineId = null

    expect(resolveSeedVanguardForState(state)).toBe('cissia')
  })

  it('compares the exact Initial ATK of two other Attack teammates', () => {
    expect(resolveSeedVanguard([
      { agentId: 'seed', appliedSlot: 0, initialAtk: 9_999 },
      { agentId: 'cissia', appliedSlot: 1, initialAtk: 2_400 },
      { agentId: 'evelyn', appliedSlot: 2, initialAtk: 2_500 },
    ])).toBe('evelyn')
  })

  it('returns no Vanguard without another Attack teammate', () => {
    expect(resolveSeedVanguard([
      { agentId: 'seed', appliedSlot: 0, initialAtk: 9_999 },
      { agentId: 'astraYao', appliedSlot: 1, initialAtk: 9_999 },
    ])).toBeNull()
  })
})
