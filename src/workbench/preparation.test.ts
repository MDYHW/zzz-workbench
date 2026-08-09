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

const context = (
  agentId: PreparationContext['agentId'],
  pool: PreparationContext['pool'] = 'full',
  mindscape = 0,
): PreparationContext => ({ agentId, pool, mindscape })

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
