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
  it('keeps Qingyi King against flexible Astral Stuns and allocates Dialyn/Qingyi locally', () => {
    for (const ordered of permutations([context('harumasa'), context('qingyi'), context('lycaon')])) {
      const prepared = preparePartySelections(ordered, 'harumasa')
      expect(prepared[ordered.findIndex(({ agentId }) => agentId === 'qingyi')].fourPieceId).toBe('king')
      expect(prepared[ordered.findIndex(({ agentId }) => agentId === 'lycaon')].fourPieceId).toBe('astralVoice')
    }
    for (const ordered of permutations([context('harumasa'), context('qingyi'), context('dialyn')])) {
      const prepared = preparePartySelections(ordered, 'harumasa')
      expect(prepared[ordered.findIndex(({ agentId }) => agentId === 'dialyn')].fourPieceId).toBe('king')
      expect(prepared[ordered.findIndex(({ agentId }) => agentId === 'qingyi')]).toMatchObject({ fourPieceId: 'shockstar', twoPieceId: 'king' })
    }
  })

  it('keeps Qingyi King against Ju Fufu and uses Ju Shockstar fallback', () => {
    for (const ordered of permutations([context('harumasa'), context('qingyi'), context('juFufu')])) {
      const prepared = preparePartySelections(ordered, 'harumasa')
      expect(prepared[ordered.findIndex(({ agentId }) => agentId === 'qingyi')])
        .toMatchObject({
          fourPieceId: 'king', mains: { slot4: 'critRate' },
        })
      expect(prepared[ordered.findIndex(({ agentId }) => agentId === 'juFufu')])
        .toMatchObject({ fourPieceId: 'shockstar', twoPieceId: 'king' })
    }
  })

  it('preserves target-only direct King duplicates while rebuilding the legal target', () => {
    const dialyn = context('dialyn')
    const qingyi = context('qingyi')
    expect(prepareTargetSelection(qingyi, 'harumasa', [{ agentId: 'dialyn', fourPieceId: 'king' }]))
      .toMatchObject({ fourPieceId: 'shockstar', twoPieceId: 'king' })
    expect(prepareTargetSelection(dialyn, 'harumasa', [{ agentId: 'qingyi', fourPieceId: 'king' }]))
      .toMatchObject({ fourPieceId: 'king' })
    expect(prepareTargetSelection(qingyi, 'harumasa', [{ agentId: 'juFufu', fourPieceId: 'king' }]))
      .toMatchObject({ fourPieceId: 'king' })
    expect(prepareTargetSelection(context('juFufu'), 'harumasa', [{ agentId: 'qingyi', fourPieceId: 'king' }]))
      .toMatchObject({ fourPieceId: 'shockstar', twoPieceId: 'king' })
  })

  it('prepares Orphie and Pulchra with independent pool representatives at zero supplied substats', () => {
    const full = createPreparedState({}, ['anbySoldier0', 'orphie', 'pulchra'], 0)
    expect(full.slots[1].setup).toMatchObject({
      mindscape: 0, engineId: 'bellicoseBlaze', refinement: 1,
      fourPieceId: 'shadowHarmony', twoPieceId: 'swingJazz',
      mains: { slot4: 'critDmg', slot5: 'fireDmg', slot6: 'energyRegenPct' },
      substats: { critRate: 0, critDmg: 0, atkPct: 0 },
    })
    expect(full.slots[2].setup).toMatchObject({
      mindscape: 6, engineId: 'blazingLaurel', refinement: 1,
      fourPieceId: 'king', twoPieceId: 'shockstar',
      mains: { slot4: 'critRate', slot5: 'physicalDmg', slot6: 'impact' },
      substats: { critRate: 0 },
    })

    const nonLimited = createPreparedState(
      { orphie: 'nonLimited', pulchra: 'nonLimited' },
      ['anbySoldier0', 'orphie', 'pulchra'],
      0,
    )
    expect(nonLimited.slots[1].setup).toMatchObject({
      engineId: 'gildedBlossom', refinement: 5,
      mains: { slot4: 'critRate', slot5: 'fireDmg', slot6: 'energyRegenPct' },
    })
    expect(nonLimited.slots[2].setup).toMatchObject({
      engineId: 'boxCutter', refinement: 5,
      fourPieceId: 'king', twoPieceId: 'shockstar',
    })
  })

  it.each(['dialyn', 'trigger'] as const)(
    'keeps King on established holder %s and prepares Pulchra on Astral regardless of slot order',
    (kingHolderId) => {
      const focus = kingHolderId === 'dialyn' ? context('corin') : context('anbySoldier0')
      const members = [focus, context(kingHolderId), context('pulchra', 'full', 6)] as const

      for (const ordered of permutations(members)) {
        const prepared = preparePartySelections(ordered, focus.agentId)
        const kingHolder = prepared[ordered.findIndex(({ agentId }) => agentId === kingHolderId)]
        const pulchra = prepared[ordered.findIndex(({ agentId }) => agentId === 'pulchra')]

        expect(kingHolder).toMatchObject({ fourPieceId: 'king' })
        expect(pulchra).toMatchObject({
          fourPieceId: 'astralVoice', twoPieceId: 'king',
          mains: { slot4: 'atkPct', slot5: 'physicalDmg', slot6: 'impact' },
        })
      }
    },
  )

  it('allocates current Hugo two-Stun packages by Astral flexibility and bounded King ties', () => {
    const pulchraKeepsKing = [context('hugo'), context('lycaon'), context('pulchra')] as const
    for (const ordered of permutations(pulchraKeepsKing)) {
      const prepared = preparePartySelections(ordered, 'hugo')
      expect(prepared[ordered.findIndex(({ agentId }) => agentId === 'pulchra')])
        .toMatchObject({ fourPieceId: 'king', twoPieceId: 'shockstar' })
      expect(prepared[ordered.findIndex(({ agentId }) => agentId === 'lycaon')])
        .toMatchObject({
          fourPieceId: 'astralVoice', twoPieceId: 'king',
          mains: { slot4: 'atkPct', slot5: 'iceDmg', slot6: 'impact' },
        })
    }

    const rigidJuKeepsKing = [context('hugo'), context('juFufu'), context('pulchra')] as const
    for (const ordered of permutations(rigidJuKeepsKing)) {
      const prepared = preparePartySelections(ordered, 'hugo')
      expect(prepared[ordered.findIndex(({ agentId }) => agentId === 'juFufu')])
        .toMatchObject({ fourPieceId: 'king' })
      expect(prepared[ordered.findIndex(({ agentId }) => agentId === 'pulchra')])
        .toMatchObject({
          fourPieceId: 'astralVoice', twoPieceId: 'king',
          mains: { slot4: 'atkPct', slot5: 'physicalDmg', slot6: 'impact' },
        })
    }

    const neitherCanUseAstral = [context('hugo'), context('dialyn'), context('juFufu')] as const
    for (const ordered of permutations(neitherCanUseAstral)) {
      const prepared = preparePartySelections(ordered, 'hugo')
      expect(prepared[ordered.findIndex(({ agentId }) => agentId === 'dialyn')])
        .toMatchObject({ fourPieceId: 'king' })
      expect(prepared[ordered.findIndex(({ agentId }) => agentId === 'juFufu')])
        .toMatchObject({
          fourPieceId: 'shockstar', twoPieceId: 'king',
          mains: { slot4: 'atkPct' },
        })
    }
  })

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

  it('prepares King on the Stun holder before Support allocation for a CRIT-capable Focus', () => {
    const members = [context('soldier11'), context('lighter'), context('lucy', 'full', 6)] as const

    for (const ordered of permutations(members)) {
      const prepared = preparePartySelections(ordered, 'soldier11')
      const lighter = prepared[ordered.findIndex(({ agentId }) => agentId === 'lighter')]
      const lucy = prepared[ordered.findIndex(({ agentId }) => agentId === 'lucy')]

      expect(lighter).toMatchObject({
        fourPieceId: 'king', twoPieceId: 'shockstar',
        mains: { slot4: 'critRate', slot5: 'fireDmg', slot6: 'impact' },
      })
      expect(lucy).toMatchObject({
        fourPieceId: 'moonlight', twoPieceId: 'astralVoice',
      })
    }
  })

  it('preserves the established independent-CRIT King holder over flexible Lighter', () => {
    const prepared = preparePartySelections([
      context('soldier11'), context('trigger'), context('lighter'),
    ], 'soldier11')

    expect(prepared[1]).toMatchObject({ fourPieceId: 'king' })
    expect(prepared[2]).toMatchObject({
      fourPieceId: 'astralVoice', twoPieceId: 'shockstar', mains: { slot4: 'atkPct' },
    })
  })

  it.each(['juFufu', 'lycaon'] as const)(
    'preserves the authored local King on %s instead of displacing it with flexible Lighter',
    (localKingHolderId) => {
      const members = [context('soldier11'), context(localKingHolderId), context('lighter')] as const

      for (const ordered of permutations(members)) {
        const prepared = preparePartySelections(ordered, 'soldier11')
        const localKingHolder = prepared[ordered.findIndex(({ agentId }) => (
          agentId === localKingHolderId
        ))]
        const lighter = prepared[ordered.findIndex(({ agentId }) => agentId === 'lighter')]

        expect(localKingHolder).toMatchObject({ fourPieceId: 'king' })
        expect(lighter).toMatchObject({
          fourPieceId: 'astralVoice', twoPieceId: 'shockstar', mains: { slot4: 'atkPct' },
        })
      }
    },
  )

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

  it('authors Ju Fufu pool packages and reuses non-overlapping two-Stun allocation', () => {
    expect(preparePartySelections([
      context('juFufu'), context('trigger'), context('yixuan'),
    ], 'yixuan')).toMatchObject([
      { fourPieceId: 'king' },
      { fourPieceId: 'astralVoice', twoPieceId: 'shockstar' },
      {},
    ])
    expect(preparePartySelections([
      context('juFufu'), context('dialyn'), context('yixuan'),
    ], 'yixuan')).toMatchObject([
      {
        fourPieceId: 'shockstar', twoPieceId: 'king',
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

  it('authors Nekomata and Billy independently for full and non-limited pools', () => {
    expect(prepareTargetSelection(context('nekomata'), 'nekomata', [])).toEqual({
      engineId: 'steelCushion', fourPieceId: 'woodpecker', twoPieceId: 'pufferElectro',
      mains: { slot4: 'critRate', slot5: 'penRatio', slot6: 'atkPct' },
    })
    expect(prepareTargetSelection(context('nekomata', 'nonLimited'), 'nekomata', []))
      .toEqual({
        engineId: 'steelCushion', fourPieceId: 'woodpecker', twoPieceId: 'pufferElectro',
        mains: { slot4: 'critRate', slot5: 'penRatio', slot6: 'atkPct' },
      })
    expect(prepareTargetSelection(context('billy'), 'billy', [])).toEqual({
      engineId: 'cloudcleaveRadiance', fourPieceId: 'woodpecker', twoPieceId: 'branchAndBlade',
      mains: { slot4: 'critRate', slot5: 'penRatio', slot6: 'atkPct' },
    })
    expect(prepareTargetSelection(context('billy', 'nonLimited'), 'billy', []))
      .toEqual({
        engineId: 'brimstone', fourPieceId: 'woodpecker', twoPieceId: 'branchAndBlade',
        mains: { slot4: 'critRate', slot5: 'penRatio', slot6: 'atkPct' },
      })

    const prepared = createPreparedState({}, ['nekomata', 'billy', 'lycaon'], 0)
    expect(prepared.slots[0].setup.substats).toEqual({ critRate: 0, critDmg: 0, atkPct: 0 })
    expect(prepared.slots[1].setup.substats).toEqual({ critRate: 0, critDmg: 0, atkPct: 0 })
  })

  it('keeps Nekomata and Billy candidate packages exact and Puffer contextual', () => {
    expect(ENGINE_IDS_BY_AGENT_AND_POOL.nekomata).toEqual({
      full: [
        'steelCushion', 'heartstringNocturne', 'cordisGermina',
        'cloudcleaveRadiance', 'severedInnocence', 'brimstone',
      ],
      nonLimited: ['steelCushion', 'brimstone'],
    })
    expect(ENGINE_IDS_BY_AGENT_AND_POOL.billy).toEqual({
      full: [
        'cloudcleaveRadiance', 'heartstringNocturne', 'cordisGermina',
        'brimstone', 'steelCushion', 'starlightEngineReplica',
      ],
      nonLimited: ['brimstone', 'steelCushion', 'starlightEngineReplica'],
    })
    expect(DISC_IDS_BY_AGENT_AND_PIECE.nekomata).toEqual({
      fourPiece: ['woodpecker'],
      twoPiece: [
        'woodpecker', 'branchAndBlade', 'fangedMetal',
        'pufferElectro', 'hormonePunk', 'astralVoice',
      ],
    })
    expect(DISC_IDS_BY_AGENT_AND_PIECE.billy).toEqual({
      fourPiece: ['woodpecker', 'shadowHarmony'],
      twoPiece: [
        'woodpecker', 'branchAndBlade', 'fangedMetal',
        'pufferElectro', 'hormonePunk', 'astralVoice',
      ],
    })

    const withoutDialyn = createPreparedState({}, ['nekomata', 'billy', 'qingyi'], 0)
    expect(effectiveFourPieceIds(withoutDialyn, 0)).toEqual(['woodpecker'])
    expect(effectiveFourPieceIds(withoutDialyn, 1)).toEqual(['woodpecker', 'shadowHarmony'])
    const withDialyn = createPreparedState({}, ['nekomata', 'billy', 'dialyn'], 0)
    expect(effectiveFourPieceIds(withDialyn, 0)).toEqual(['woodpecker', 'pufferElectro'])
    expect(effectiveFourPieceIds(withDialyn, 1))
      .toEqual(['woodpecker', 'shadowHarmony', 'pufferElectro'])
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

  it('prepares Zhu Yuan and existing general-damage recipients from applied Nicole context', () => {
    const zhuNicoleDialyn = preparePartySelections([
      context('zhuYuan'), context('nicole', 'full', 6), context('dialyn'),
    ], 'zhuYuan')
    expect(zhuNicoleDialyn[0]).toEqual({
      engineId: 'cordisGermina', fourPieceId: 'chaoticMetal', twoPieceId: 'branchAndBlade',
      mains: { slot4: 'critDmg', slot5: 'atkPct', slot6: 'atkPct' },
    })
    expect(zhuNicoleDialyn[1]).toEqual({
      engineId: 'theVault', fourPieceId: 'moonlight', twoPieceId: 'swingJazz',
      mains: { slot4: 'atkPct', slot5: 'etherDmg', slot6: 'energyRegenPct' },
    })

    const zhuWithoutAdditional = preparePartySelections([
      context('zhuYuan'), context('lycaon'), context('dialyn'),
    ], 'zhuYuan')
    expect(zhuWithoutAdditional[0].mains.slot4).toBe('critRate')

    const zhuNonLimited = preparePartySelections([
      context('zhuYuan', 'nonLimited'), context('nicole', 'full', 6), context('dialyn'),
    ], 'zhuYuan')
    expect(zhuNonLimited[0]).toMatchObject({
      engineId: 'brimstone', twoPieceId: 'woodpecker',
      mains: { slot4: 'critDmg', slot5: 'atkPct' },
    })

    const prepared = preparePartySelections([
      context('ellen'), context('nicole', 'full', 6), context('soldier11'),
    ], 'ellen')
    expect(prepared[0]).toMatchObject({
      twoPieceId: 'branchAndBlade', mains: { slot4: 'critDmg', slot5: 'iceDmg' },
    })
    expect(prepared[2]).toMatchObject({
      twoPieceId: 'infernoMetal', mains: { slot4: 'critDmg', slot5: 'fireDmg' },
    })

    const nonLimited = preparePartySelections([
      context('ellen', 'nonLimited'), context('nicole', 'full', 6), context('soldier11', 'nonLimited'),
    ], 'ellen')
    expect(nonLimited[0]).toMatchObject({ mains: { slot4: 'critRate', slot5: 'iceDmg' } })
    expect(nonLimited[2]).toMatchObject({ mains: { slot4: 'critRate', slot5: 'fireDmg' } })
  })

  it('allocates Moonlight to the least-flexible Support and preserves a distinct Astral package', () => {
    const cases = [
      {
        contexts: [context('zhuYuan'), context('nicole', 'full', 6), context('lucia')] as const,
        focus: 'zhuYuan' as const,
        moonlight: 'lucia' as const,
        astral: 'nicole' as const,
      },
      {
        contexts: [context('zhuYuan'), context('nicole', 'full', 6), context('lucy', 'full', 6)] as const,
        focus: 'zhuYuan' as const,
        moonlight: 'nicole' as const,
        astral: 'lucy' as const,
      },
      {
        contexts: [context('ellen'), context('soukaku'), context('lucy', 'full', 6)] as const,
        focus: 'ellen' as const,
        moonlight: 'lucy' as const,
        astral: 'soukaku' as const,
      },
    ]

    for (const current of cases) {
      for (const ordered of permutations(current.contexts)) {
        const prepared = preparePartySelections(ordered, current.focus)
        const moonlightIndex = ordered.findIndex(({ agentId }) => agentId === current.moonlight)
        const astralIndex = ordered.findIndex(({ agentId }) => agentId === current.astral)
        expect(prepared[moonlightIndex].fourPieceId).toBe('moonlight')
        expect(prepared[astralIndex]).toMatchObject({
          fourPieceId: 'astralVoice', twoPieceId: 'moonlight',
        })
      }
    }

    expect(prepareTargetSelection(
      context('soukaku'),
      'ellen',
      [{ agentId: 'lucy', fourPieceId: 'moonlight' }],
    )).toMatchObject({ fourPieceId: 'astralVoice', twoPieceId: 'moonlight' })
    expect(prepareTargetSelection(
      context('lucia'),
      'yixuan',
      [{ agentId: 'nicole', fourPieceId: 'moonlight' }],
    )).toMatchObject({ fourPieceId: 'moonlight', twoPieceId: 'yunkui' })

    const cissiaAstraNicole = [
      context('cissia'), context('astraYao'), context('nicole', 'full', 6),
    ] as const
    for (const ordered of permutations(cissiaAstraNicole)) {
      const prepared = preparePartySelections(ordered, 'cissia')
      const cissiaIndex = ordered.findIndex(({ agentId }) => agentId === 'cissia')
      const astraIndex = ordered.findIndex(({ agentId }) => agentId === 'astraYao')
      const nicoleIndex = ordered.findIndex(({ agentId }) => agentId === 'nicole')
      expect(prepared[cissiaIndex]).toMatchObject({
        fourPieceId: 'dawnsBloom', twoPieceId: 'swingJazz',
      })
      expect(prepared[astraIndex]).toMatchObject({
        fourPieceId: 'astralVoice', twoPieceId: 'moonlight',
      })
      expect(prepared[nicoleIndex]).toMatchObject({
        fourPieceId: 'moonlight', twoPieceId: 'swingJazz',
      })

      const rebuiltCissia = prepareTargetSelection(
        { ...ordered[cissiaIndex], pool: 'nonLimited' },
        'cissia',
        ordered.flatMap((current, index) => index === cissiaIndex ? [] : [{
          agentId: current.agentId,
          fourPieceId: prepared[index].fourPieceId,
          mindscape: current.mindscape,
        }]),
      )
      expect(rebuiltCissia).toMatchObject({
        engineId: 'drillRigRedAxis', fourPieceId: 'dawnsBloom', twoPieceId: 'swingJazz',
      })
    }
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
