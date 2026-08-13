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
  it('prepares Ellen and Soukaku with their authored pool representatives and zero supplied substats', () => {
    const full = createPreparedState({}, ['ellen', 'soukaku', 'lycaon'], 0)
    expect(full.slots[0].setup).toMatchObject({
      mindscape: 0, engineId: 'deepSeaVisitor', fourPieceId: 'woodpecker', twoPieceId: 'pufferElectro',
      mains: { slot4: 'critRate', slot5: 'penRatio', slot6: 'atkPct' },
      substats: { critRate: 0, critDmg: 0, atkPct: 0 },
    })
    expect(full.slots[1].setup).toMatchObject({
      mindscape: 6, engineId: 'kaboom', refinement: 5, fourPieceId: 'moonlight', twoPieceId: 'astralVoice',
      mains: { slot4: 'atkPct', slot5: 'atkPct', slot6: 'energyRegenPct' },
      substats: { atkPct: 0, atkFlat: 0 },
    })
    const nonLimited = createPreparedState({ ellen: 'nonLimited', soukaku: 'nonLimited' }, ['ellen', 'soukaku', 'lycaon'], 0)
    expect(nonLimited.slots[0].setup.engineId).toBe('brimstone')
    expect(nonLimited.slots[1].setup).toMatchObject({
      ...full.slots[1].setup, pool: 'nonLimited',
    })
  })

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

  it('preserves Trigger King priority over Lycaon when Trigger Additional is unqualified', () => {
    const prepared = preparePartySelections([
      context('yixuan'), context('trigger'), context('lycaon'),
    ], 'yixuan')
    expect(prepared[1]).toMatchObject({
      fourPieceId: 'king', twoPieceId: 'shockstar',
    })
    expect(prepared[2]).toMatchObject({
      fourPieceId: 'astralVoice', twoPieceId: 'king',
    })
  })

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
    const localNonLimited = prepareTargetSelection(
      context('astraYao', 'nonLimited'),
      'anbySoldier0',
      [],
    )

    expect(full).toMatchObject({ fourPieceId: 'moonlight', twoPieceId: 'astralVoice' })
    expect(nonLimited).toMatchObject({ fourPieceId: 'moonlight', twoPieceId: 'astralVoice' })
    expect(local).toMatchObject({ fourPieceId: 'astralVoice', twoPieceId: 'moonlight' })
    expect(localNonLimited).toMatchObject({
      fourPieceId: 'astralVoice', twoPieceId: 'moonlight',
    })
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
      ['kaboom', 'moonlight', 'astralVoice'],
      ['marcatoDesire', 'dawnsBloom', 'woodpecker'],
      ['drillRigRedAxis', 'astralVoice', 'swingJazz'],
    ])
  })

  it('keeps first-vertical representatives complete when no party adjustment applies', () => {
    const prepared = preparePartySelections([
      context('yixuan'), context('dialyn'), context('lucia'),
    ], 'yixuan')
    expect(prepared).toMatchObject([
      { engineId: 'qingming', fourPieceId: 'yunkui', twoPieceId: 'branchAndBlade' },
      { engineId: 'yesterdayCalls', fourPieceId: 'king', twoPieceId: 'woodpecker' },
      { engineId: 'dreamlitHearth', fourPieceId: 'moonlight', twoPieceId: 'yunkui' },
    ])
  })

  it('prepares Yidhari and Manato from their authored pool representatives', () => {
    const selections = preparePartySelections([
      context('yidhari'), context('manato'), context('astraYao'),
    ], 'yidhari')
    expect(selections.slice(0, 2)).toMatchObject([
      { engineId: 'krakensCradle', fourPieceId: 'yunkui', twoPieceId: 'branchAndBlade' },
      { engineId: 'grillOWisp', fourPieceId: 'yunkui', twoPieceId: 'woodpecker' },
    ])
  })

  it('authors Hugo from a complete usable package for each pool', () => {
    const full = preparePartySelections([
      context('hugo'), context('lycaon'), context('astraYao'),
    ], 'hugo')[0]
    const nonLimited = preparePartySelections([
      context('hugo', 'nonLimited'), context('lycaon'), context('astraYao'),
    ], 'hugo')[0]
    expect(full).toEqual({
      engineId: 'myriadEclipse', fourPieceId: 'hormonePunk', twoPieceId: 'branchAndBlade',
      mains: { slot4: 'critRate', slot5: 'iceDmg', slot6: 'atkPct' },
    })
    expect(nonLimited).toEqual({
      engineId: 'steelCushion', fourPieceId: 'hormonePunk', twoPieceId: 'woodpecker',
      mains: { slot4: 'critDmg', slot5: 'iceDmg', slot6: 'atkPct' },
    })
  })

  it('authors Ju Fufu pool packages and reuses non-overlapping King holder allocation', () => {
    expect(preparePartySelections([
      context('juFufu'), context('trigger'), context('yixuan'),
    ], 'yixuan')).toMatchObject([
      { fourPieceId: 'swingJazz', twoPieceId: 'king' },
      { fourPieceId: 'king' },
      {},
    ])
    expect(preparePartySelections([
      context('juFufu'), context('dialyn'), context('yixuan'),
    ], 'yixuan')).toMatchObject([
      {
        fourPieceId: 'swingJazz', twoPieceId: 'king',
        mains: { slot4: 'atkPct', slot5: 'atkPct', slot6: 'atkPct' },
      },
      { fourPieceId: 'king' },
      {},
    ])

    expect(prepareTargetSelection(context('juFufu'), 'yixuan', [])).toEqual({
      engineId: 'roaringFurnace', fourPieceId: 'king', twoPieceId: 'woodpecker',
      mains: { slot4: 'critRate', slot5: 'atkPct', slot6: 'atkPct' },
    })
    expect(prepareTargetSelection(context('juFufu', 'nonLimited', 1), 'yixuan', [])).toEqual({
      engineId: 'hellfireGears', fourPieceId: 'king', twoPieceId: 'shockstar',
      mains: { slot4: 'critRate', slot5: 'atkPct', slot6: 'impact' },
    })
  })

  it('authors Pan Yinhu by pool and uses Bunny when Cissia can hold Astral', () => {
    expect(prepareTargetSelection(context('panYinhu'), 'yixuan', [])).toEqual({
      engineId: 'tusksOfFury', fourPieceId: 'astralVoice', twoPieceId: 'swingJazz',
      mains: { slot4: 'atkPct', slot5: 'atkPct', slot6: 'energyRegenPct' },
    })
    expect(prepareTargetSelection(context('panYinhu', 'nonLimited'), 'yixuan', [])).toEqual({
      engineId: 'tremorTrigramVessel', fourPieceId: 'astralVoice', twoPieceId: 'swingJazz',
      mains: { slot4: 'atkPct', slot5: 'atkPct', slot6: 'energyRegenPct' },
    })

    for (const pan of [context('panYinhu'), context('panYinhu', 'nonLimited')]) {
      const cissiaFirst = preparePartySelections([
        context('cissia'), pan, context('yixuan'),
      ], 'yixuan')
      expect(cissiaFirst[0]).toMatchObject({ fourPieceId: 'astralVoice' })
      expect(cissiaFirst[1]).toMatchObject({
        fourPieceId: 'bunnyInWonderland', twoPieceId: 'astralVoice',
      })

      const panFirst = preparePartySelections([
        pan, context('cissia'), context('yixuan'),
      ], 'yixuan')
      expect(panFirst[0]).toMatchObject({
        fourPieceId: 'bunnyInWonderland', twoPieceId: 'astralVoice',
      })
      expect(panFirst[1]).toMatchObject({ fourPieceId: 'astralVoice' })
    }
    const existingYield = preparePartySelections([
      context('cissia'), context('astraYao'), context('yixuan'),
    ], 'yixuan')
    expect(existingYield).toMatchObject([
      { fourPieceId: 'astralVoice' },
      { fourPieceId: 'moonlight' },
      {},
    ])

    expect(prepareTargetSelection(context('panYinhu'), 'yixuan', [
      { agentId: 'cissia', fourPieceId: 'astralVoice' },
    ])).toEqual({
      engineId: 'tusksOfFury', fourPieceId: 'bunnyInWonderland', twoPieceId: 'astralVoice',
      mains: { slot4: 'atkPct', slot5: 'atkPct', slot6: 'energyRegenPct' },
    })
  })

  it('authors Banyue from distinct full and non-limited whole packages', () => {
    expect(prepareTargetSelection(context('banyue'), 'banyue', [])).toEqual({
      engineId: 'wrathfulVajra', fourPieceId: 'yunkui', twoPieceId: 'branchAndBlade',
      mains: { slot4: 'critRate', slot5: 'fireDmg', slot6: 'hpPct' },
    })
    expect(prepareTargetSelection(context('banyue', 'nonLimited'), 'banyue', [])).toEqual({
      engineId: 'cauldron', fourPieceId: 'yunkui', twoPieceId: 'woodpecker',
      mains: { slot4: 'critRate', slot5: 'fireDmg', slot6: 'hpPct' },
    })
  })

  it('authors Starlight Billy from whole packages including a partial-passive full-pool entrant', () => {
    expect(prepareTargetSelection(context('starlightBilly'), 'starlightBilly', [])).toEqual({
      engineId: 'starlightRiderFaceplate', fourPieceId: 'yunkui', twoPieceId: 'branchAndBlade',
      mains: { slot4: 'critRate', slot5: 'physicalDmg', slot6: 'hpPct' },
    })
    expect(prepareTargetSelection(
      context('starlightBilly', 'nonLimited'), 'starlightBilly', [],
    )).toEqual({
      engineId: 'cauldron', fourPieceId: 'yunkui', twoPieceId: 'woodpecker',
      mains: { slot4: 'critRate', slot5: 'physicalDmg', slot6: 'hpPct' },
    })
  })

  it('balances Anby M2+ only when her Additional Ability is party-qualified', () => {
    const qualifiedHolders = [
      { agentId: 'trigger', fourPieceId: 'king' },
      { agentId: 'astraYao', fourPieceId: 'astralVoice' },
    ] as const
    const unqualifiedHolders = [
      { agentId: 'seed', fourPieceId: 'woodpecker' },
      { agentId: 'corin', fourPieceId: 'hormonePunk' },
    ] as const

    expect(prepareTargetSelection(context('anbySoldier0', 'full', 0), 'anbySoldier0', qualifiedHolders))
      .toMatchObject({ twoPieceId: 'woodpecker', mains: { slot4: 'critRate' } })
    expect(prepareTargetSelection(context('anbySoldier0', 'full', 2), 'anbySoldier0', unqualifiedHolders))
      .toMatchObject({ twoPieceId: 'woodpecker', mains: { slot4: 'critRate' } })
    expect(prepareTargetSelection(context('anbySoldier0', 'full', 2), 'anbySoldier0', qualifiedHolders))
      .toMatchObject({ twoPieceId: 'branchAndBlade', mains: { slot4: 'critRate' } })
    expect(prepareTargetSelection(context('anbySoldier0', 'nonLimited', 2), 'anbySoldier0', qualifiedHolders))
      .toMatchObject({ twoPieceId: 'branchAndBlade', mains: { slot4: 'critDmg' } })
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

  it('admits bounded limited alternatives without changing prepared first choices', () => {
    expect(ENGINE_IDS_BY_AGENT_AND_POOL.trigger.full).toContain('blazingLaurel')
    expect(ENGINE_IDS_BY_AGENT_AND_POOL.trigger.nonLimited).not.toContain('blazingLaurel')
    expect(ENGINE_IDS_BY_AGENT_AND_POOL.cissia.full).toContain('bellicoseBlaze')
    expect(ENGINE_IDS_BY_AGENT_AND_POOL.cissia.nonLimited).not.toContain('bellicoseBlaze')

    expect(createPreparedState(
      {}, ['anbySoldier0', 'trigger', 'astraYao'], 0,
    ).slots[1].setup).toMatchObject({
      engineId: 'spectralGaze',
    })
    expect(createPreparedState(
      {}, ['seed', 'cissia', 'astraYao'], 0,
    ).slots[1].setup).toMatchObject({
      engineId: 'serpentineSeeker',
    })
  })
})
