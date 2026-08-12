import { describe, expect, it } from 'vitest'
import {
  preparePartySelections,
  prepareTargetSelection,
  type PreparationContext,
} from './preparation'
import {
  DISC_IDS_BY_AGENT_AND_PIECE,
  ENGINE_IDS_BY_AGENT_AND_POOL,
} from './content'
import { effectiveFourPieceIds } from './candidates'
import { createPreparedState } from './state'

const context = (
  agentId: PreparationContext['agentId'],
  pool: PreparationContext['pool'] = 'full',
  mindscape = 0,
): PreparationContext => ({ agentId, pool, mindscape })

const permutations = <T,>(items: readonly [T, T, T]): [T, T, T][] => [
  [items[0], items[1], items[2]],
  [items[0], items[2], items[1]],
  [items[1], items[0], items[2]],
  [items[1], items[2], items[0]],
  [items[2], items[0], items[1]],
  [items[2], items[1], items[0]],
]

describe('party-directed preparation', () => {
  it('chooses the Trigger full-pool engine from the focused formula without changing her representative Disc package', () => {
    const yixuanFocus = preparePartySelections([
      context('yixuan'), context('trigger'), context('astraYao'),
    ], 'yixuan')
    const anbyFocus = preparePartySelections([
      context('anbySoldier0'), context('trigger'), context('astraYao'),
    ], 'anbySoldier0')

    expect(yixuanFocus[1]).toMatchObject({
      engineId: 'iceJadeTeapot', fourPieceId: 'king', twoPieceId: 'shockstar',
    })
    expect(anbyFocus[1]).toMatchObject({
      engineId: 'spectralGaze', fourPieceId: 'king', twoPieceId: 'shockstar',
    })
  })

  it('keeps the Trigger non-limited representative engine for either focus formula', () => {
    for (const focusAgentId of ['yixuan', 'anbySoldier0'] as const) {
      const prepared = preparePartySelections([
        context(focusAgentId), context('trigger', 'nonLimited'), context('astraYao'),
      ], focusAgentId)
      expect(prepared[1]).toMatchObject({
        engineId: 'restrained', fourPieceId: 'king', twoPieceId: 'shockstar',
      })
    }
  })

  it('allocates King to Dialyn and the Trigger authored Astral package independently of slot order', () => {
    const contexts = [context('yixuan'), context('trigger'), context('dialyn')] as const
    const expected = new Map([
      ['trigger', { engineId: 'iceJadeTeapot', fourPieceId: 'astralVoice', twoPieceId: 'shockstar' }],
      ['dialyn', { fourPieceId: 'king', twoPieceId: 'woodpecker' }],
    ])

    for (const ordered of [contexts, [contexts[2], contexts[0], contexts[1]] as const]) {
      const prepared = preparePartySelections(ordered, 'yixuan')
      for (const [index, input] of ordered.entries()) {
        const expectedSelection = expected.get(input.agentId)
        if (expectedSelection) expect(prepared[index]).toMatchObject(expectedSelection)
      }
    }
  })

  it.each([
    ['dialyn', { fourPieceId: 'king', twoPieceId: 'woodpecker' }],
    ['trigger', { fourPieceId: 'king', twoPieceId: 'shockstar' }],
  ] as const)(
    'keeps King on the independent-CRIT %s holder and prepares flexible Lycaon on Astral',
    (kingHolderId, expectedKing) => {
      const members = [context('corin'), context(kingHolderId), context('lycaon')] as const

      for (const ordered of permutations(members)) {
        const prepared = preparePartySelections(ordered, 'corin')
        const kingHolder = prepared[ordered.findIndex(({ agentId }) => agentId === kingHolderId)]
        const lycaon = prepared[ordered.findIndex(({ agentId }) => agentId === 'lycaon')]

        expect(kingHolder).toMatchObject(expectedKing)
        expect(lycaon).toMatchObject({
          fourPieceId: 'astralVoice',
          twoPieceId: 'king',
          mains: { slot4: 'atkPct', slot5: 'iceDmg', slot6: 'impact' },
        })
      }
    },
  )

  it('keeps Lycaon on local King when no competing independent-CRIT holder exists', () => {
    const prepared = preparePartySelections([
      context('corin'), context('lycaon'), context('astraYao'),
    ], 'corin')

    expect(prepared[1]).toMatchObject({
      fourPieceId: 'king',
      twoPieceId: 'shockstar',
      mains: { slot4: 'critRate', slot5: 'iceDmg', slot6: 'impact' },
    })
    expect(prepared[2]).toMatchObject({ fourPieceId: 'astralVoice' })
  })

  it('does not move Trigger from King when no established King holder is rigid', () => {
    const prepared = prepareTargetSelection(
      context('trigger'),
      'anbySoldier0',
      [{ agentId: 'trigger', fourPieceId: 'king' }],
    )

    expect(prepared).toMatchObject({ fourPieceId: 'king', twoPieceId: 'shockstar' })
  })

  it('prepares the Astra legal Moonlight packages only against an established Astral holder', () => {
    const full = prepareTargetSelection(
      context('astraYao'),
      'anbySoldier0',
      [{ agentId: 'trigger', fourPieceId: 'astralVoice' }],
    )
    const nonLimited = prepareTargetSelection(
      context('astraYao', 'nonLimited'),
      'anbySoldier0',
      [{ agentId: 'trigger', fourPieceId: 'astralVoice' }],
    )
    const local = prepareTargetSelection(context('astraYao'), 'anbySoldier0', [])

    expect(full).toMatchObject({ fourPieceId: 'moonlight', twoPieceId: 'astralVoice' })
    expect(nonLimited).toMatchObject({ fourPieceId: 'moonlight', twoPieceId: 'hormonePunk' })
    expect(local).toMatchObject({ fourPieceId: 'astralVoice', twoPieceId: 'moonlight' })
  })

  it('keeps Cissia local on Dawn and adds Astral only for the bounded repeated Quick Assist opportunity', () => {
    const local = prepareTargetSelection(
      context('cissia'),
      'seed',
      [{ agentId: 'seed', fourPieceId: 'dawnsBloom' }],
    )
    const contextual = prepareTargetSelection(
      context('cissia'),
      'seed',
      [{ agentId: 'astraYao', fourPieceId: 'astralVoice' }],
    )
    const contextualNonLimited = prepareTargetSelection(
      context('cissia', 'nonLimited'),
      'seed',
      [{ agentId: 'astraYao', fourPieceId: 'astralVoice' }],
    )

    expect(local).toMatchObject({
      engineId: 'serpentineSeeker', fourPieceId: 'dawnsBloom', twoPieceId: 'swingJazz',
      mains: { slot4: 'critRate', slot5: 'electricDmg', slot6: 'energyRegenPct' },
    })
    expect(contextual).toMatchObject({
      engineId: 'serpentineSeeker', fourPieceId: 'astralVoice', twoPieceId: 'swingJazz',
      mains: local.mains,
    })
    expect(contextualNonLimited).toMatchObject({
      engineId: 'drillRigRedAxis', fourPieceId: 'astralVoice', twoPieceId: 'swingJazz',
      mains: local.mains,
    })

    const withoutOpportunity = createPreparedState({}, ['seed', 'cissia', 'anbySoldier0'], 0)
    const withOpportunity = createPreparedState({}, ['seed', 'cissia', 'astraYao'], 0)
    expect(effectiveFourPieceIds(withoutOpportunity, 1)).toEqual(['dawnsBloom'])
    expect(effectiveFourPieceIds(withOpportunity, 1)).toEqual(['dawnsBloom', 'astralVoice'])
    expect(effectiveFourPieceIds(withOpportunity, 0)).toEqual(['dawnsBloom', 'woodpecker'])
    expect(effectiveFourPieceIds(withOpportunity, 2)).toEqual(['astralVoice', 'moonlight'])
  })

  it('prepares Cissia Astral then Astra Moonlight for every approved party permutation', () => {
    const parties = [
      { members: [context('seed'), context('cissia'), context('astraYao')] as const, focus: 'seed' as const },
      { members: [context('cissia'), context('anbySoldier0'), context('astraYao')] as const, focus: 'anbySoldier0' as const },
      { members: [context('cissia'), context('yixuan'), context('astraYao')] as const, focus: 'yixuan' as const },
    ]

    for (const { members, focus } of parties) {
      for (const ordered of permutations(members)) {
        const prepared = preparePartySelections(ordered, focus)
        const cissiaIndex = ordered.findIndex(({ agentId }) => agentId === 'cissia')
        const astraIndex = ordered.findIndex(({ agentId }) => agentId === 'astraYao')
        expect(prepared[cissiaIndex]).toMatchObject({
          fourPieceId: 'astralVoice', twoPieceId: 'swingJazz',
        })
        expect(prepared[astraIndex]).toMatchObject({
          fourPieceId: 'moonlight', twoPieceId: 'astralVoice',
        })
      }
    }

    const nonLimited = preparePartySelections([
      context('astraYao', 'nonLimited'),
      context('seed', 'nonLimited'),
      context('cissia', 'nonLimited'),
    ], 'seed')
    expect(nonLimited.map((selection) => [
      selection.engineId,
      selection.fourPieceId,
      selection.twoPieceId,
    ])).toEqual([
      ['kaboom', 'moonlight', 'hormonePunk'],
      ['marcatoDesire', 'dawnsBloom', 'woodpecker'],
      ['drillRigRedAxis', 'astralVoice', 'swingJazz'],
    ])
  })

  it('leaves first-vertical representative packages unchanged when no adjustment applies', () => {
    const prepared = preparePartySelections([
      context('yixuan'), context('dialyn'), context('lucia'),
    ], 'yixuan')
    expect(prepared).toMatchObject([
      { engineId: 'qingming', fourPieceId: 'yunkui', twoPieceId: 'woodpecker' },
      { engineId: 'yesterdayCalls', fourPieceId: 'king', twoPieceId: 'woodpecker' },
      { engineId: 'dreamlitHearth', fourPieceId: 'moonlight', twoPieceId: 'yunkui' },
    ])
  })

  it('keeps every authored adjustment inside the target candidate pools', () => {
    const contexts = [
      context('yixuan'), context('trigger'), context('dialyn'),
    ] as const
    const selections = preparePartySelections(contexts, 'yixuan')

    for (const [index, selection] of selections.entries()) {
      const input = contexts[index]
      expect(ENGINE_IDS_BY_AGENT_AND_POOL[input.agentId][input.pool]).toContain(selection.engineId)
      expect(DISC_IDS_BY_AGENT_AND_PIECE[input.agentId].fourPiece).toContain(selection.fourPieceId)
      expect(DISC_IDS_BY_AGENT_AND_PIECE[input.agentId].twoPiece).toContain(selection.twoPieceId)
      expect(selection.fourPieceId).not.toBe(selection.twoPieceId)
    }
  })
})
