import { describe, expect, it } from 'vitest'
import { calculateParty } from './calculate'
import {
  resolveProviderEffects,
  resolveSeedVanguard,
  resolveSeedVanguardForState,
} from './provider-effects'
import { createPreparedState, workbenchReducer } from './state'
import { actionForm, canonicalAction, sourceLocalAction } from './actions'
import { VERTICAL_VALUES } from './content'
import {
  action,
  agent,
  metric,
  selectEngine,
  selectDisc,
  selectMain,
  setRefinement,
  setSubstat,
  withMindscape,
} from './calculate.test-support'

describe('authored calculation policies', () => {
    it('selects only eligible non-Seed Attack teammates', () => {
      expect(resolveSeedVanguard([
        { agentId: 'seed', appliedSlot: 0, initialAtk: 3000 },
        { agentId: 'astraYao', appliedSlot: 1, initialAtk: 2500 },
        { agentId: 'trigger', appliedSlot: 2, initialAtk: 2500 },
      ])).toBeNull()
      expect(resolveSeedVanguard([
        { agentId: 'seed', appliedSlot: 0, initialAtk: 3000 },
        { agentId: 'cissia', appliedSlot: 1, initialAtk: 1967 },
        { agentId: 'astraYao', appliedSlot: 2, initialAtk: 2500 },
      ])).toBe('cissia')
    })

    it('resolves a sole eligible teammate before reading any Initial ATK', () => {
      const state = createPreparedState({}, ['seed', 'cissia', 'astraYao'], 0)
      const incompleteAstra = {
        ...state,
        slots: state.slots.map((slot) => (
          slot.agentId === 'astraYao'
            ? { ...slot, setup: { ...slot.setup, engineId: null } }
            : slot
        )) as typeof state.slots,
      }

      expect(resolveSeedVanguardForState(incompleteAstra)).toBe('cissia')
    })

    it('uses exact Initial ATK and applied slot only for an exact tie', () => {
      const tied = [
        { agentId: 'cissia', appliedSlot: 0, initialAtk: 2500 },
        { agentId: 'seed', appliedSlot: 1, initialAtk: 3000 },
        { agentId: 'anbySoldier0', appliedSlot: 2, initialAtk: 2500 },
      ] as const
      expect(resolveSeedVanguard(tied)).toBe('cissia')
      expect(resolveSeedVanguard([...tied].reverse())).toBe('cissia')

      const exact = [
        tied[1],
        { ...tied[0], initialAtk: 2450.61 },
        { ...tied[2], initialAtk: 2450.64 },
      ] as const
      expect(Math.round(exact[1].initialAtk)).toBe(Math.round(exact[2].initialAtk))
      expect(resolveSeedVanguard(exact)).toBe('anbySoldier0')
    })

    it('re-resolves from current Initial inputs after a direct setup change', () => {
      const beforeState = createPreparedState({}, ['seed', 'cissia', 'anbySoldier0'], 0)
      const beforeEffects = resolveProviderEffects(beforeState)
      const before = calculateParty(beforeState)!
      const beforeAnby = beforeEffects.contexts.find(
        ({ agentId }) => agentId === 'anbySoldier0',
      )
      if (beforeAnby?.agentId !== 'anbySoldier0') throw new Error('Missing Anby observation')
      expect(beforeAnby.initialAtk).toBeCloseTo(2450.6, 10)
      expect(metric(agent(before, 'anbySoldier0'), 'critDmg').breakdown.combat)
        .toContainEqual(expect.objectContaining({ ownerAgentId: 'seed', amount: 30 }))

      const afterState = selectMain(beforeState, 'cissia', 'slot5', 'atkPct')
      const afterEffects = resolveProviderEffects(afterState)
      const after = calculateParty(afterState)!
      const afterCissia = afterEffects.contexts.find(({ agentId }) => agentId === 'cissia')
      if (afterCissia?.agentId !== 'cissia') throw new Error('Missing Cissia observation')
      expect(afterCissia.initialAtk).toBeCloseTo(2462.3, 10)
      expect(metric(agent(after, 'cissia'), 'critDmg').breakdown.combat)
        .toContainEqual(expect.objectContaining({ ownerAgentId: 'seed', amount: 30 }))
      expect(metric(agent(after, 'anbySoldier0'), 'critDmg').breakdown.combat)
        .not.toContainEqual(expect.objectContaining({ ownerAgentId: 'seed', amount: 30 }))
    })

    it('uses the same exact Initial-ATK observation for Evelyn Vanguard ties', () => {
      let state = createPreparedState({}, ['seed', 'evelyn', 'anbySoldier0'], 1)
      state = selectDisc(state, 'evelyn', 'twoPiece', 'branchAndBlade')
      state = selectDisc(state, 'evelyn', 'fourPiece', 'woodpecker')
      const effects = resolveProviderEffects(state)
      const evelyn = effects.contexts.find(({ agentId }) => agentId === 'evelyn')
      const anby = effects.contexts.find(({ agentId }) => agentId === 'anbySoldier0')
      if (evelyn?.agentId !== 'evelyn' || anby?.agentId !== 'anbySoldier0') {
        throw new Error('Missing exact Initial-ATK observations')
      }

      expect(evelyn.initialAtk).toBeCloseTo(2450.6, 10)
      expect(anby.initialAtk).toBeCloseTo(2450.6, 10)
      expect(resolveSeedVanguardForState(state)).toBe('evelyn')
      expect(metric(agent(calculateParty(state)!, 'evelyn'), 'critDmg').breakdown.combat)
        .toContainEqual(expect.objectContaining({ ownerAgentId: 'seed', amount: 30 }))

      const reordered = createPreparedState({}, ['anbySoldier0', 'evelyn', 'seed'], 1)
      const tied = selectDisc(
        selectDisc(reordered, 'evelyn', 'twoPiece', 'branchAndBlade'),
        'evelyn',
        'fourPiece',
        'woodpecker',
      )
      expect(resolveSeedVanguardForState(tied)).toBe('anbySoldier0')
    })

    it('resolves Corin directly as sole Vanguard and compares only in an all-Attack party', () => {
      const sole = createPreparedState({}, ['seed', 'corin', 'astraYao'], 1)
      expect(resolveSeedVanguardForState(sole)).toBe('corin')

      let compared = createPreparedState({}, ['seed', 'corin', 'anbySoldier0'], 1)
      expect(resolveSeedVanguardForState(compared)).toBe('anbySoldier0')

      compared = selectMain(compared, 'corin', 'slot5', 'atkPct')
      expect(resolveSeedVanguardForState(compared)).toBe('corin')
      const corin = resolveProviderEffects(compared).contexts.find(
        ({ agentId }) => agentId === 'corin',
      )
      if (corin?.agentId !== 'corin') throw new Error('Missing Corin observation')
      expect(corin.initialAtk).toBeCloseTo(2900, 10)
    })

    it('includes Ellen in the exact Seed Vanguard comparison', () => {
      let state = createPreparedState({}, ['seed', 'ellen', 'anbySoldier0'], 1)
      expect(resolveSeedVanguardForState(state)).toBe('ellen')
      state = selectEngine(state, 'ellen', 'steelCushion')
      expect(resolveSeedVanguardForState(state)).toBe('anbySoldier0')
    })

    it('applies Yixuan cumulative Mindscapes only to their parent and action scopes', () => {
      const base = createPreparedState()
      const m0 = agent(calculateParty(base)!, 'yixuan')
      const m1 = agent(calculateParty(withMindscape(base, 'yixuan', 1))!, 'yixuan')
      const m2 = agent(calculateParty(withMindscape(base, 'yixuan', 2))!, 'yixuan')
      const m4 = agent(calculateParty(withMindscape(base, 'yixuan', 4))!, 'yixuan')
      const m6 = agent(calculateParty(withMindscape(base, 'yixuan', 6))!, 'yixuan')

      expect(metric(m1, 'critRate').values.combat - metric(m0, 'critRate').values.combat)
        .toBeCloseTo(10)
      expect(action(m2, 'mindscapeEtherResIgnore')).toMatchObject({
        outcomes: [
          canonicalAction('EX Special Attack'),
          canonicalAction('Ultimate'),
        ],
        metricId: 'resIgnore',
        values: { initial: 0, combat: 0, fully: 15 },
      })
      expect(action(m4, 'mindscapeCloudShaper').values.fully).toBeCloseTo(299)
      expect(metric(m6, 'sheerDmgBonus').values.fully).toBe(30)
    })

    it('applies Yidhari Mindscapes only to current stat, Sheer, and Basic/EX consumers', () => {
      const base = createPreparedState({}, ['yidhari', 'dialyn', 'lucia'], 0)
      const m0 = agent(calculateParty(base)!, 'yidhari')
      const m1 = agent(calculateParty(withMindscape(base, 'yidhari', 1))!, 'yidhari')
      const m2 = agent(calculateParty(withMindscape(base, 'yidhari', 2))!, 'yidhari')
      const m3 = agent(calculateParty(withMindscape(base, 'yidhari', 3))!, 'yidhari')
      const m4 = agent(calculateParty(withMindscape(base, 'yidhari', 4))!, 'yidhari')
      const m5 = agent(calculateParty(withMindscape(base, 'yidhari', 5))!, 'yidhari')
      const m6 = agent(calculateParty(withMindscape(base, 'yidhari', 6))!, 'yidhari')

      expect(metric(m1, 'resIgnore').values.fully).toBe(0)
      expect(action(m1, 'yidhariBasicExResIgnore')).toMatchObject({
        outcomes: [
          canonicalAction('Basic Attack'),
          canonicalAction('EX Special Attack'),
        ],
        metricId: 'resIgnore',
        values: { initial: 0, combat: 0, fully: 20 },
      })
      expect(metric(m2, 'critDmg').values.fully - metric(m1, 'critDmg').values.fully)
        .toBeCloseTo(40)
      expect(metric(m3, 'critDmg').values).toEqual(metric(m2, 'critDmg').values)
      expect(metric(m4, 'maxHp').values.fully - metric(m3, 'maxHp').values.fully)
        .toBeCloseTo(metric(m3, 'maxHp').values.initial * .05)
      expect(metric(m5, 'maxHp').values).toEqual(metric(m4, 'maxHp').values)
      expect(metric(m6, 'sheerDmgBonus').values.fully
        - metric(m5, 'sheerDmgBonus').values.fully).toBeCloseTo(25)
      expect(metric(m0, 'critDmg').breakdown.fully).toContainEqual(
        expect.objectContaining({ ownerAgentId: 'yidhari', locus: 'additional', amount: 50 }),
      )
    })

    it('projects Manato maximum-Core actions and cumulative Mindscapes exactly', () => {
      const base = createPreparedState({}, ['manato', 'dialyn', 'lucia'], 0)
      const m0 = agent(calculateParty(withMindscape(base, 'manato', 0))!, 'manato')
      const m1 = agent(calculateParty(withMindscape(base, 'manato', 1))!, 'manato')
      const m2 = agent(calculateParty(withMindscape(base, 'manato', 2))!, 'manato')
      const m3 = agent(calculateParty(withMindscape(base, 'manato', 3))!, 'manato')
      const m4 = agent(calculateParty(withMindscape(base, 'manato', 4))!, 'manato')
      const m5 = agent(calculateParty(withMindscape(base, 'manato', 5))!, 'manato')
      const m6 = agent(calculateParty(base)!, 'manato')

      expect(action(m0, 'manatoBasicAssistCritDmg')).toMatchObject({
        outcomes: [canonicalAction('Basic Attack'), canonicalAction('Assist Follow-Up')],
        metricId: 'critDmg',
      })
      expect(action(m0, 'manatoBasicAssistCritDmg').values.fully
        - metric(m0, 'critDmg').values.fully).toBeCloseTo(50)
      expect(action(m1, 'manatoBasicAssistFireDmg').values.fully
        - metric(m1, 'dmgBonus').values.fully).toBeCloseTo(20)
      expect(metric(m2, 'resIgnore').values.fully).toBe(8)
      expect(metric(m3, 'resIgnore').values).toEqual(metric(m2, 'resIgnore').values)
      expect(metric(m4, 'maxHp').values.initial - metric(m3, 'maxHp').values.initial)
        .toBeCloseTo(VERTICAL_VALUES.manato.hp * .08)
      expect(metric(m5, 'maxHp').values).toEqual(metric(m4, 'maxHp').values)
      expect(action(m6, 'manatoAssistFireDmg').values.fully
        - action(m6, 'manatoBasicAssistFireDmg').values.fully).toBeCloseTo(15)
    })

    it('projects only usable Manato clauses from direct Rupture engine edits', () => {
      const base = createPreparedState({}, ['manato', 'dialyn', 'lucia'], 0)
      const wrathful = agent(calculateParty(selectEngine(base, 'manato', 'wrathfulVajra'))!, 'manato')
      const qingming = agent(calculateParty(selectEngine(base, 'manato', 'qingming'))!, 'manato')

      expect(metric(wrathful, 'maxHp').breakdown.initial)
        .toContainEqual(expect.objectContaining({ label: 'Wrathful Vajra', display: { value: 30, unit: '%', decimals: 0 } }))
      expect(metric(wrathful, 'critRate').breakdown.combat)
        .toContainEqual(expect.objectContaining({ label: 'Wrathful Vajra', amount: 20 }))
      expect(Object.values(metric(wrathful, 'sheerDmgBonus').breakdown).flat())
        .not.toContainEqual(expect.objectContaining({ label: 'Wrathful Vajra' }))
      const wrathfulEx = action(wrathful, 'manatoExSpecialSheer')
      expect(wrathfulEx).toMatchObject({
        outcomes: [canonicalAction('EX Special Attack')],
        metricId: 'sheerDmgBonus',
      })
      expect(wrathfulEx.values.fully - metric(wrathful, 'sheerDmgBonus').values.fully)
        .toBeCloseTo(18)
      expect(wrathfulEx.breakdown.fully)
        .toContainEqual(expect.objectContaining({ label: 'Wrathful Vajra', amount: 18 }))
      expect(metric(qingming, 'maxHp').breakdown.initial)
        .toContainEqual(expect.objectContaining({ label: 'Qingming Birdcage' }))
      expect(metric(qingming, 'critRate').breakdown.combat)
        .toContainEqual(expect.objectContaining({ label: 'Qingming Birdcage', amount: 20 }))
      expect(Object.values(metric(qingming, 'dmgBonus').breakdown).flat())
        .not.toContainEqual(expect.objectContaining({ label: 'Qingming Birdcage' }))
      expect(Object.values(metric(qingming, 'sheerDmgBonus').breakdown).flat())
        .not.toContainEqual(expect.objectContaining({ label: 'Qingming Birdcage' }))
    })

    it('keeps Yidhari alternate engines on their exact current Result axes', () => {
      const base = createPreparedState({}, ['yidhari', 'dialyn', 'lucia'], 0)
      const grill = agent(calculateParty(selectEngine(base, 'yidhari', 'grillOWisp'))!, 'yidhari')
      const qingming = agent(calculateParty(selectEngine(base, 'yidhari', 'qingming'))!, 'yidhari')
      const cauldron = agent(calculateParty(selectEngine(base, 'yidhari', 'cauldron'))!, 'yidhari')
      const puzzle = agent(calculateParty(selectEngine(base, 'yidhari', 'puzzleSphere'))!, 'yidhari')
      const radiowave = agent(calculateParty(selectEngine(base, 'yidhari', 'radiowave'))!, 'yidhari')

      expect(metric(grill, 'critRate').breakdown.fully)
        .toContainEqual(expect.objectContaining({ label: "Grill O'Wisp", amount: 24 }))
      expect(Object.values(metric(grill, 'dmgBonus').breakdown).flat())
        .not.toContainEqual(expect.objectContaining({ label: "Grill O'Wisp" }))
      expect(metric(qingming, 'maxHp').breakdown.initial)
        .toContainEqual(expect.objectContaining({ label: 'Qingming Birdcage' }))
      expect(metric(qingming, 'critRate').breakdown.combat)
        .toContainEqual(expect.objectContaining({ label: 'Qingming Birdcage' }))
      expect(Object.values(metric(qingming, 'dmgBonus').breakdown).flat())
        .not.toContainEqual(expect.objectContaining({ label: 'Qingming Birdcage' }))
      expect(metric(cauldron, 'critRate').breakdown.fully)
        .toContainEqual(expect.objectContaining({ label: 'Cauldron of Clarity' }))
      expect(metric(cauldron, 'dmgBonus').breakdown.fully)
        .toContainEqual(expect.objectContaining({ label: 'Cauldron of Clarity' }))
      expect(metric(puzzle, 'critDmg').breakdown.fully)
        .toContainEqual(expect.objectContaining({ label: 'Puzzle Sphere' }))
      expect(action(puzzle, 'yidhariExSpecial').breakdown.fully)
        .toContainEqual(expect.objectContaining({ label: 'Puzzle Sphere' }))
      expect(metric(radiowave, 'sheerForce').breakdown.fully)
        .toContainEqual(expect.objectContaining({ label: 'Radiowave Journey' }))
    })

    it('qualifies Yidhari and Lucia Additional through another applied Specialty', () => {
      const yidhariQualified = agent(calculateParty(createPreparedState(
        {}, ['yidhari', 'dialyn', 'seed'], 0,
      ))!, 'yidhari')
      const yidhariUnqualified = agent(calculateParty(createPreparedState(
        {}, ['yidhari', 'seed', 'cissia'], 0,
      ))!, 'yidhari')
      expect(metric(yidhariQualified, 'critDmg').breakdown.fully)
        .toContainEqual(expect.objectContaining({ ownerAgentId: 'yidhari', locus: 'additional', amount: 50 }))
      expect(metric(yidhariUnqualified, 'critDmg').breakdown.fully)
        .not.toContainEqual(expect.objectContaining({ ownerAgentId: 'yidhari', locus: 'additional' }))
      expect(metric(yidhariQualified, 'dmgBonus').breakdown.fully)
        .toContainEqual(expect.objectContaining({ ownerAgentId: 'yidhari', locus: 'core', amount: 100 }))
      expect(metric(yidhariUnqualified, 'dmgBonus').breakdown.fully)
        .toContainEqual(expect.objectContaining({ ownerAgentId: 'yidhari', locus: 'core', amount: 100 }))

      const luciaQualified = agent(calculateParty(createPreparedState(
        {}, ['lucia', 'corin', 'dialyn'], 1,
      ))!, 'corin')
      const luciaRuptureQualified = agent(calculateParty(createPreparedState(
        {}, ['lucia', 'corin', 'manato'], 1,
      ))!, 'corin')
      const luciaCorinContrast = agent(calculateParty(createPreparedState(
        {}, ['lucia', 'corin', 'astraYao'], 1,
      ))!, 'corin')
      expect(metric(luciaQualified, 'critDmg').breakdown.fully)
        .toContainEqual(expect.objectContaining({ ownerAgentId: 'lucia', locus: 'additional', amount: 30 }))
      expect(metric(luciaRuptureQualified, 'critDmg').breakdown.fully)
        .toContainEqual(expect.objectContaining({ ownerAgentId: 'lucia', locus: 'additional', amount: 30 }))
      expect(metric(luciaCorinContrast, 'critDmg').breakdown.fully)
        .not.toContainEqual(expect.objectContaining({ ownerAgentId: 'lucia', locus: 'additional' }))
      expect(metric(luciaQualified, 'dmgBonus').breakdown.fully)
        .toContainEqual(expect.objectContaining({ ownerAgentId: 'lucia', locus: 'core', amount: 20 }))
      expect(metric(luciaCorinContrast, 'dmgBonus').breakdown.fully)
        .toContainEqual(expect.objectContaining({ ownerAgentId: 'lucia', locus: 'core', amount: 20 }))
    })

    it('projects Yixuan M2 Stun duration as a recipient state operation', () => {
      const base = createPreparedState()
      const m0Dialyn = agent(calculateParty(base)!, 'dialyn')
      const m2Dialyn = agent(calculateParty(withMindscape(base, 'yixuan', 2))!, 'dialyn')

      expect(m0Dialyn.operations).toHaveLength(1)
      expect(m2Dialyn.operations).toContainEqual(expect.objectContaining({
        id: 'stunDuration',
        value: 3,
        source: expect.objectContaining({
          label: 'Mindscape',
          detail: 'M2',
          ownerAgentId: 'yixuan',
        }),
      }))
    })

    it('uses capped Dialyn Initial CRIT for threshold output and delivers M2 to Focus', () => {
      let threshold = setSubstat(createPreparedState(), 'dialyn', 'critRate', 36)
      threshold = selectEngine(threshold, 'lucia', 'unfetteredGameBall')
      const result = calculateParty(threshold)!
      const dialynCrit = metric(agent(result, 'dialyn'), 'critRate')
      expect(dialynCrit.values).toEqual({ initial: 100, combat: 100, fully: 100 })
      expect(dialynCrit.gauge).toMatchObject({ current: 100, outputValue: 100 })
      expect(metric(agent(result, 'yixuan'), 'critDmg').breakdown.fully)
        .toContainEqual(expect.objectContaining({ label: 'King of the Summit', amount: 30 }))

      const focused = createPreparedState({}, ['dialyn', 'lucia', 'yixuan'], 2)
      const m1 = calculateParty(withMindscape(focused, 'dialyn', 1))!
      const m2 = calculateParty(withMindscape(focused, 'dialyn', 2))!
      expect(metric(agent(m2, 'yixuan'), 'dmgBonus').values.fully
        - metric(agent(m1, 'yixuan'), 'dmgBonus').values.fully).toBeCloseTo(15)
      expect(metric(agent(m2, 'yixuan'), 'stunDmgMultiplier').values.fully).toBe(50)
      expect(metric(agent(m2, 'lucia'), 'maxHp').values)
        .toEqual(metric(agent(m1, 'lucia'), 'maxHp').values)
    })

    it('composes Dialyn and Lucia M1 RES Ignore on the compatible recipient', () => {
      const base = createPreparedState()
      const neither = agent(calculateParty(base)!, 'yixuan')
      const dialyn = agent(calculateParty(withMindscape(base, 'dialyn', 1))!, 'yixuan')
      const lucia = agent(calculateParty(withMindscape(base, 'lucia', 1))!, 'yixuan')
      const both = agent(calculateParty(
        withMindscape(withMindscape(base, 'dialyn', 1), 'lucia', 1),
      )!, 'yixuan')

      expect(metric(neither, 'resIgnore').values.fully).toBe(0)
      expect(metric(dialyn, 'resIgnore').values.fully).toBe(15)
      expect(metric(lucia, 'resIgnore').values.fully).toBe(18)
      expect(metric(both, 'resIgnore').values.fully).toBe(33)
    })

    it('uses Lucia current Initial Max HP for cumulative Darkbreaker tiers and caps', () => {
      const base = createPreparedState()
      const m0 = calculateParty(base)!
      const m3 = calculateParty(withMindscape(base, 'lucia', 3))!
      const m5 = calculateParty(withMindscape(base, 'lucia', 5))!
      expect(metric(agent(m0, 'lucia'), 'maxHp').gauge).toMatchObject({
        basisLabel: 'Initial Max HP',
        current: 21697.1,
        cap: 24000,
        outputCap: 900,
        outputValue: expect.closeTo(814.7927),
      })
      expect(metric(agent(m3, 'lucia'), 'maxHp').gauge).toMatchObject({
        outputCap: 948,
        outputValue: expect.closeTo(858.1869),
      })
      expect(metric(agent(m5, 'lucia'), 'maxHp').gauge).toMatchObject({
        outputCap: 996,
        outputValue: expect.closeTo(901.5811),
      })

      const capped = setSubstat(base, 'lucia', 'hpPct', 12)
      for (const [mindscape, outputCap] of [[0, 900], [3, 948], [5, 996]] as const) {
        const gauge = metric(
          agent(calculateParty(withMindscape(capped, 'lucia', mindscape))!, 'lucia'),
          'maxHp',
        ).gauge!
        expect(gauge.current).toBeGreaterThanOrEqual(24000)
        expect(gauge.outputValue).toBe(outputCap)
      }
    })

    it('derives Anby Aftershock from delivered CRIT DMG exactly once', () => {
      const result = calculateParty(
        createPreparedState({}, ['anbySoldier0', 'trigger', 'astraYao'], 0),
      )!
      const anby = agent(result, 'anbySoldier0')
      const trigger = agent(result, 'trigger')
      expect(metric(anby, 'critDmg').values).toEqual({ initial: 98, combat: 128, fully: 213 })
      expect(action(anby, 'anbyAftershockCritDmg').values.fully).toBeCloseTo(287.55)
      expect(action(trigger, 'triggerAftershockCritDmg').values.fully).toBeCloseTo(179.55)
      expect(action(anby, 'anbyAftershockCritDmg').breakdown.fully
        .filter(({ detail }) => detail === '35% of Fully Enabled CRIT DMG'))
        .toHaveLength(1)
      expect(action(anby, 'anbyDash').values.initial).toBe(45)
      expect(action(anby, 'anbyDash').breakdown.fully)
        .not.toContainEqual(expect.objectContaining({
          label: 'Additional Ability', ownerAgentId: 'anbySoldier0', amount: 50,
        }))

      const offField = agent(calculateParty(
        createPreparedState({}, ['anbySoldier0', 'trigger', 'yixuan'], 2),
      )!, 'anbySoldier0')
      expect(action(anby, 'anbyAftershock').breakdown.fully)
        .toContainEqual(expect.objectContaining({
          label: 'Additional Ability', ownerAgentId: 'anbySoldier0', amount: 50,
        }))
      expect(action(offField, 'anbyAftershock').breakdown.fully)
        .not.toContainEqual(expect.objectContaining({
          label: 'Additional Ability', ownerAgentId: 'anbySoldier0', amount: 50,
        }))
    })

    it('keeps enemy modifiers in distinct parent and action scopes', () => {
      let state = createPreparedState({}, ['anbySoldier0', 'trigger', 'astraYao'], 0)
      state = workbenchReducer(state, { type: 'setMindscape', slot: 0, mindscape: 4 })
      state = workbenchReducer(state, {
        type: 'selectEngine', slot: 0, engineId: 'cordisGermina',
      })
      state = workbenchReducer(state, {
        type: 'selectEngine', slot: 1, engineId: 'iceJadeTeapot',
      })
      state = workbenchReducer(state, {
        type: 'selectMainStat', slot: 0, mainSlot: 'slot5', mainStatId: 'penRatio',
      })
      const result = calculateParty(state)!
      const anby = agent(result, 'anbySoldier0')

      expect(action(anby, 'anbyBasicUltimate')).toMatchObject({
        outcomes: [
          canonicalAction('Basic Attack'),
          canonicalAction('Ultimate'),
        ],
        metricId: 'defIgnore',
        values: { initial: 0, combat: 0, fully: 20 },
      })
      expect(metric(anby, 'resIgnore').values).toEqual({ initial: 0, combat: 0, fully: 12 })
      expect(metric(anby, 'penRatio').values).toEqual({ initial: 24, combat: 24, fully: 24 })
      expect(anby.metrics.find(({ id }) => id === 'defReduction')).toBeUndefined()
    })

    it('keeps Trigger action-only regions and Astra M4 operation on compatible recipients', () => {
      const withoutAnby = agent(calculateParty(
        createPreparedState({}, ['yixuan', 'trigger', 'astraYao'], 0),
      )!, 'trigger')
      expect(withoutAnby.metrics.find(({ id }) => id === 'critDmg')).toBeUndefined()
      expect(withoutAnby.metrics.find(({ id }) => id === 'dmgBonus')).toBeUndefined()

      const unqualified = agent(calculateParty(
        createPreparedState({}, ['yixuan', 'trigger', 'lucia'], 0),
      )!, 'trigger')
      expect(metric(unqualified, 'critRate').gauge).toBeUndefined()
      expect(unqualified.actionModifiers.map(({ id }) => id)).not.toContain('triggerBasic')

      let qualifiedWithoutAnby = createPreparedState({}, ['evelyn', 'trigger', 'lucia'], 0)
      qualifiedWithoutAnby = workbenchReducer(qualifiedWithoutAnby, {
        type: 'setSubstat', slot: 1, key: 'critRate', value: 8,
      })
      const qualifiedTrigger = agent(calculateParty(qualifiedWithoutAnby)!, 'trigger')
      expect(metric(qualifiedTrigger, 'critRate').gauge).toMatchObject({
        threshold: 40, cap: 90, outputLabel: 'Aftershock Daze bonus',
      })
      expect(qualifiedTrigger.actionModifiers.map(({ id }) => id)).toContain('triggerBasic')

      let state = createPreparedState({}, ['anbySoldier0', 'trigger', 'astraYao'], 0)
      state = workbenchReducer(state, { type: 'setMindscape', slot: 2, mindscape: 4 })
      const result = calculateParty(state)!
      const trigger = agent(result, 'trigger')
      expect(metric(trigger, 'critRate').gauge).toMatchObject({ current: 53, outputValue: 19.5 })
      expect(trigger.operations).toContainEqual(
        expect.objectContaining({ id: 'nextQuickAssistDaze', value: 50 }),
      )
      expect(agent(result, 'astraYao').operations).toEqual([])

      let nonLimited = createPreparedState(
        { trigger: 'nonLimited' },
        ['anbySoldier0', 'trigger', 'astraYao'],
        0,
      )
      nonLimited = setSubstat(nonLimited, 'trigger', 'critRate', 16)
      const basic = action(agent(calculateParty(nonLimited)!, 'trigger'), 'triggerBasic')
      expect(basic).toMatchObject({
        tags: ['aftershock'],
        outcomes: [canonicalAction('Basic Attack')],
      })
      expect(basic.breakdown.fully)
        .toContainEqual(expect.objectContaining({ label: 'The Restrained', amount: 30 }))
      expect(basic.breakdown.fully)
        .not.toContainEqual(expect.objectContaining({ label: 'Shockstar Disco', amount: 20 }))
    })

    it('applies Astra M2 cap delivery only through compatible recipient projectors', () => {
      let state = createPreparedState({}, ['anbySoldier0', 'trigger', 'astraYao'], 0)
      state = workbenchReducer(state, { type: 'setMindscape', slot: 2, mindscape: 2 })
      const result = calculateParty(state)!
      const astra = agent(result, 'astraYao')

      expect(metric(astra, 'atk').gauge).toMatchObject({ outputValue: 1600, outputCap: 1600 })
      expect(metric(agent(result, 'anbySoldier0'), 'atk').breakdown.fully)
        .toContainEqual(expect.objectContaining({
          label: 'Core Passive', ownerAgentId: 'astraYao', amount: 1600,
        }))
      expect(metric(agent(result, 'anbySoldier0'), 'resReduction').values.fully).toBe(18)
      expect(agent(result, 'trigger').metrics.map(({ id }) => id))
        .not.toContain('resReduction')
    })

    it('authors Astra Slot 6 after reserving the finite ATK substat opportunity by pool', () => {
      const full = createPreparedState({}, ['evelyn', 'dialyn', 'astraYao'], 0)
      expect(full.slots[2].setup.mains.slot6).toBe('energyRegenPct')
      let matureFull = setSubstat(full, 'astraYao', 'atkPct', 8)
      matureFull = setSubstat(matureFull, 'astraYao', 'atkFlat', 8)
      const fullAstra = agent(calculateParty(matureFull)!, 'astraYao')
      expect(metric(fullAstra, 'atk').values.initial).toBeCloseTo(3666.72, 10)
      expect(metric(fullAstra, 'atk').gauge).toMatchObject({
        outputValue: 1200, outputCap: 1200,
      })

      const nonLimited = createPreparedState(
        { astraYao: 'nonLimited' },
        ['evelyn', 'dialyn', 'astraYao'],
        0,
      )
      expect(nonLimited.slots[2].setup).toMatchObject({
        fourPieceId: 'astralVoice', twoPieceId: 'moonlight',
      })
      expect(nonLimited.slots[2].setup.mains.slot6).toBe('atkPct')
      let matureNonLimited = setSubstat(nonLimited, 'astraYao', 'atkPct', 8)
      matureNonLimited = setSubstat(matureNonLimited, 'astraYao', 'atkFlat', 8)
      expect(metric(agent(calculateParty(matureNonLimited)!, 'astraYao'), 'atk')
        .values.initial).toBeCloseTo(3467.36, 10)
      expect(metric(agent(calculateParty(nonLimited)!, 'astraYao'), 'energyRegen')
        .breakdown.initial).toContainEqual(expect.objectContaining({
          label: 'Moonlight Lullaby', locus: 'disc-2pc',
          display: { value: 20, unit: '%', decimals: 0 },
        }))

      const m2 = workbenchReducer(nonLimited, {
        type: 'setMindscape', slot: 2, mindscape: 2,
      })
      expect(m2.slots[2].setup.mains.slot6).toBe('energyRegenPct')
      let matureM2 = setSubstat(m2, 'astraYao', 'atkPct', 8)
      matureM2 = setSubstat(matureM2, 'astraYao', 'atkFlat', 8)
      const matureM2Astra = agent(calculateParty(matureM2)!, 'astraYao')
      expect(metric(matureM2Astra, 'atk').values.initial).toBeCloseTo(3065.66, 10)
      expect(metric(matureM2Astra, 'atk').gauge).toMatchObject({
        outputValue: 1600, outputCap: 1600,
      })
    })

    it('projects Seed M0 through the resolved Vanguard and omits it without one', () => {
      const result = calculateParty(
        createPreparedState({}, ['seed', 'cissia', 'astraYao'], 0),
      )!
      expect(metric(agent(result, 'seed'), 'atk').values.combat).toBeCloseTo(3450.6, 10)
      expect(metric(agent(result, 'cissia'), 'critDmg').values.combat).toBe(130)

      const none = agent(calculateParty(withMindscape(
        createPreparedState({}, ['seed', 'yixuan', 'astraYao'], 0),
        'seed',
        2,
      ))!, 'seed')
      expect(metric(none, 'atk').values.combat).toBe(metric(none, 'atk').values.initial)
      expect(metric(none, 'defIgnore').values).toEqual({ initial: 0, combat: 0, fully: 0 })
      expect(metric(none, 'critDmg').breakdown.combat)
        .not.toContainEqual(expect.objectContaining({ ownerAgentId: 'seed', amount: 30 }))
    })

    it('applies cumulative Seed Mindscapes only to approved parent and action regions', () => {
      const base = createPreparedState({}, ['seed', 'cissia', 'astraYao'], 0)
      const m1 = agent(calculateParty(withMindscape(base, 'seed', 1))!, 'seed')
      const m2 = agent(calculateParty(withMindscape(base, 'seed', 2))!, 'seed')
      const m4 = agent(calculateParty(withMindscape(base, 'seed', 4))!, 'seed')
      const m6 = agent(calculateParty(withMindscape(base, 'seed', 6))!, 'seed')

      expect(action(m1, 'seedDownfallCritDmg').values.fully)
        .toBeCloseTo(metric(m1, 'critDmg').values.fully + 30, 10)
      expect(m1.actionModifiers.map(({ id }) => id)).not.toContain('seedSlaughterCritDmg')
      expect(action(m2, 'seedSlaughter').values.fully).toBe(367)
      expect(action(m2, 'seedBasicActions').values.fully).toBe(247)
      expect(action(m2, 'seedActions').values.fully).toBe(192)
      expect(action(m4, 'seedUltimate').values.fully).toBe(212)
      expect(metric(m6, 'critDmg').values.combat - metric(m4, 'critDmg').values.combat)
        .toBe(50)
      expect(m6.operations).toEqual([])
    })

    it('keeps Seed M4 and Puffer as separate atoms on the existing Ultimate outcome', () => {
      let state = createPreparedState({}, ['seed', 'dialyn', 'astraYao'], 0)
      state = selectDisc(state, 'seed', 'fourPiece', 'pufferElectro')
      const seed = agent(calculateParty(withMindscape(state, 'seed', 4))!, 'seed')
      const ultimate = action(seed, 'seedUltimate')
      const atoms = Object.values(ultimate.breakdown).flat()

      expect(atoms).toContainEqual(expect.objectContaining({
        label: 'Puffer Electro',
        detail: '4-piece',
        ownerAgentId: 'seed',
        amount: 20,
      }))
      expect(atoms).toContainEqual(expect.objectContaining({
        label: 'Mindscape',
        detail: 'M4 · Ultimate',
        ownerAgentId: 'seed',
        amount: 20,
      }))
    })

    it('keeps Cissia Cordis and Puffer clauses separate on Ultimate only', () => {
      let state = createPreparedState({}, ['cissia', 'dialyn', 'yixuan'], 0)
      state = selectEngine(state, 'cissia', 'cordisGermina')
      state = selectDisc(state, 'cissia', 'fourPiece', 'pufferElectro')
      const cissia = agent(calculateParty(state)!, 'cissia')
      const ultimate = action(cissia, 'cissiaUltimate')
      const ultimateDefIgnore = action(cissia, 'cissiaUltimateDefIgnore')
      const atoms = Object.values(ultimate.breakdown).flat()

      expect(ultimate).not.toHaveProperty('baseActionId')
      expect(ultimate.values.fully).toBe(metric(cissia, 'dmgBonus').values.fully + 45)
      expect(atoms).toContainEqual(expect.objectContaining({
        label: 'Cordis Germina',
        ownerAgentId: 'cissia',
        amount: 25,
      }))
      expect(atoms).toContainEqual(expect.objectContaining({
        label: 'Puffer Electro',
        detail: '4-piece',
          ownerAgentId: 'cissia',
          amount: 20,
        }))
      expect(ultimateDefIgnore).not.toHaveProperty('baseActionId')
      expect(ultimateDefIgnore.values.fully).toBe(metric(cissia, 'defIgnore').values.fully + 20)
      expect(ultimateDefIgnore.breakdown.fully)
        .toContainEqual(expect.objectContaining({
          label: 'Cordis Germina',
          ownerAgentId: 'cissia',
          amount: 20,
        }))
      expect(Object.values(metric(cissia, 'dmgBonus').breakdown).flat())
        .not.toContainEqual(expect.objectContaining({ label: 'Cordis Germina' }))
      expect(Object.values(metric(cissia, 'dmgBonus').breakdown).flat())
        .not.toContainEqual(expect.objectContaining({ label: 'Puffer Electro' }))
    })

    it('keeps Anby Ultimate nested under Aftershock without widening Puffer scope', () => {
      let state = createPreparedState({}, ['anbySoldier0', 'dialyn', 'astraYao'], 0)
      state = selectDisc(state, 'anbySoldier0', 'fourPiece', 'pufferElectro')
      const anby = agent(calculateParty(state)!, 'anbySoldier0')
      const aftershock = action(anby, 'anbyAftershock')
      const ultimate = action(anby, 'anbyUltimate')

      expect(aftershock).toMatchObject({
        tags: ['aftershock'],
        outcomes: [],
      })
      expect(ultimate).toMatchObject({
        outcomes: [canonicalAction('Ultimate')],
        metricId: 'dmgBonus',
        baseActionId: 'anbyAftershock',
      })
      expect(Object.values(aftershock.breakdown).flat())
        .not.toContainEqual(expect.objectContaining({ label: 'Puffer Electro' }))
      expect(Object.values(action(anby, 'anbyDash').breakdown).flat())
        .not.toContainEqual(expect.objectContaining({ label: 'Puffer Electro' }))
      expect(ultimate.breakdown.initial).toContainEqual(expect.objectContaining({
        label: 'Puffer Electro',
        detail: '4-piece',
        ownerAgentId: 'anbySoldier0',
        amount: 20,
      }))
    })

    it('resolves Cissia Core from Initial Energy Regen, caps, then applies M1', () => {
      const full = agent(calculateParty(
        createPreparedState({}, ['seed', 'cissia', 'astraYao'], 0),
      )!, 'cissia')
      expect(metric(full, 'energyRegen').gauge).toMatchObject({
        current: expect.closeTo(3.744),
        threshold: 1.4,
        cap: 3.68,
        outputValue: 25,
        outputCap: 25,
      })

      const nonLimited = createPreparedState(
        { seed: 'nonLimited', cissia: 'nonLimited' },
        ['seed', 'cissia', 'astraYao'],
        0,
      )
      const m0 = agent(calculateParty(nonLimited)!, 'cissia')
      const m1 = agent(calculateParty(withMindscape(nonLimited, 'cissia', 1))!, 'cissia')
      expect(metric(m0, 'defIgnore').values.combat).toBeCloseTo(24.233333333333334, 10)
      expect(metric(m1, 'defIgnore').values.combat).toBeCloseTo(33.92666666666667, 10)
      expect(metric(m1, 'energyRegen').gauge?.outputCap).toBe(35)
    })

    it('bounds Cissia Mindscapes and activation by semantic party facts', () => {
      const base = createPreparedState({}, ['seed', 'cissia', 'astraYao'], 0)
      const m1 = agent(calculateParty(withMindscape(base, 'cissia', 1))!, 'cissia')
      const m2 = agent(calculateParty(withMindscape(base, 'cissia', 2))!, 'cissia')
      expect(metric(m1, 'defIgnore').values.combat).toBe(63)
      expect(action(m1, 'cissiaCorrodeResIgnore').values.fully).toBe(15)
      expect(action(m2, 'cissiaSerpent').values.fully).toBe(148)
      expect(m1.actionModifiers.map(({ id }) => id)).not.toContain('cissiaSerpentResIgnore')
      expect(m2.actionModifiers.map(({ id }) => id)).not.toContain('cissiaCorrode')

      const inactive = agent(calculateParty(
        createPreparedState({}, ['cissia', 'yixuan', 'astraYao'], 1),
      )!, 'cissia')
      const electric = agent(calculateParty(
        createPreparedState({}, ['cissia', 'anbySoldier0', 'yixuan'], 2),
      )!, 'cissia')
      const stun = agent(calculateParty(
        createPreparedState({}, ['cissia', 'dialyn', 'yixuan'], 2),
      )!, 'cissia')
      expect(metric(inactive, 'critDmg').values.combat).toBe(50)
      expect(metric(electric, 'critDmg').values.combat).toBe(100)
      expect(metric(stun, 'critDmg').values.combat).toBe(100)
      expect(action(electric, 'cissiaCorrodeDaze').values.fully).toBe(60)
      expect(action(stun, 'cissiaCorrodeDaze').values.fully).toBe(40)
    })

    it('applies Evelyn cumulative Mindscapes without admitting excluded outcomes', () => {
      const base = createPreparedState({}, ['evelyn', 'dialyn', 'astraYao'], 0)
      const m0 = agent(calculateParty(base)!, 'evelyn')
      const m1 = agent(calculateParty(withMindscape(base, 'evelyn', 1))!, 'evelyn')
      const m2 = agent(calculateParty(withMindscape(base, 'evelyn', 2))!, 'evelyn')
      const m4 = agent(calculateParty(withMindscape(base, 'evelyn', 4))!, 'evelyn')
      const m6 = agent(calculateParty(withMindscape(base, 'evelyn', 6))!, 'evelyn')

      expect(metric(m1, 'defIgnore').values)
        .toEqual({ initial: 0, combat: 12, fully: 12 })
      expect(metric(m2, 'atk').values.combat - metric(m1, 'atk').values.combat)
        .toBeCloseTo((929 + 713) * .15, 10)
      expect(metric(m4, 'critDmg').values.fully - metric(m2, 'critDmg').values.fully)
        .toBe(40)
      expect(m6.metrics).toEqual(m4.metrics)
      expect(m6.actionModifiers).toEqual(m4.actionModifiers)
      expect(m0.operations).toHaveLength(0)
      expect(m6.operations).toEqual(m4.operations)
      expect(JSON.stringify(m6)).not.toMatch(/shield|decibel|burning|tether|coefficient/i)
    })

    it('projects Hugo party qualification, Stun count, equipment scopes, and Totalize operations', () => {
      const qualified = agent(calculateParty(
        createPreparedState({}, ['hugo', 'lycaon', 'astraYao'], 0),
      )!, 'hugo')
      const sameAttribute = agent(calculateParty(
        createPreparedState({}, ['hugo', 'yidhari', 'astraYao'], 0),
      )!, 'hugo')
      const unqualified = agent(calculateParty(
        createPreparedState({}, ['hugo', 'cissia', 'astraYao'], 0),
      )!, 'hugo')
      const twoStun = agent(calculateParty(
        createPreparedState({}, ['hugo', 'lycaon', 'dialyn'], 0),
      )!, 'hugo')

      expect(action(qualified, 'hugoChain').values.fully - metric(qualified, 'dmgBonus').values.fully)
        .toBe(15)
      expect(action(qualified, 'hugoTotalize').values.fully - metric(qualified, 'dmgBonus').values.fully)
        .toBe(40)
      expect(action(sameAttribute, 'hugoTotalize').values.fully - metric(sameAttribute, 'dmgBonus').values.fully)
        .toBe(40)
      expect(unqualified.actionModifiers.map(({ id }) => id)).not.toContain('hugoChain')
      expect(metric(qualified, 'atk').values.fully - metric(unqualified, 'atk').values.fully)
        .toBe(300)
      expect(metric(qualified, 'atk').breakdown.fully)
        .toContainEqual(expect.objectContaining({ ownerAgentId: 'hugo', locus: 'core', amount: 300 }))
      expect(metric(twoStun, 'atk').breakdown.fully)
        .toContainEqual(expect.objectContaining({ ownerAgentId: 'hugo', locus: 'core', amount: 900 }))
      expect(metric(qualified, 'defIgnore').values.combat).toBe(25)
      expect(metric(qualified, 'critDmg').values.combat - metric(qualified, 'critDmg').values.initial)
        .toBe(70)
      expect(qualified.operations).toEqual(expect.arrayContaining([
        expect.objectContaining({ id: 'hugoTotalizeAddedDmgMultiplier', value: 3400, unit: '%' }),
        expect.objectContaining({ id: 'hugoTotalizeDazeReturn', value: 25, unit: '%' }),
        expect.objectContaining({ id: 'hugoExNonStunnedDaze', value: 1.2, presentation: 'scale' }),
      ]))

      const steel = agent(calculateParty(selectEngine(
        createPreparedState({ hugo: 'nonLimited' }, ['hugo', 'lycaon', 'astraYao'], 0),
        'hugo',
        'steelCushion',
      ))!, 'hugo')
      expect(steel.metrics.find(({ id }) => id === 'defIgnore')).toBeUndefined()
      expect(action(steel, 'hugoBackAttack').values.fully - metric(steel, 'dmgBonus').values.fully)
        .toBe(25)

      const cordis = agent(calculateParty(selectEngine(
        createPreparedState({}, ['hugo', 'lycaon', 'astraYao'], 0),
        'hugo',
        'cordisGermina',
      ))!, 'hugo')
      expect(metric(cordis, 'defIgnore').values).toEqual({ initial: 0, combat: 0, fully: 0 })
      expect(action(cordis, 'hugoBasicUltimateDefIgnore').values.fully).toBe(20)
      expect(action(cordis, 'hugoBasicUltimateDefIgnore').outcomes)
        .toEqual([
          { kind: 'canonical', action: 'Basic Attack' },
          { kind: 'canonical', action: 'Ultimate' },
        ])

      const puffer = agent(calculateParty(selectDisc(
        createPreparedState({}, ['hugo', 'dialyn', 'astraYao'], 0),
        'hugo',
        'fourPiece',
        'pufferElectro',
      ))!, 'hugo')
      expect(metric(puffer, 'penRatio').values.initial).toBe(8)
      expect(action(puffer, 'hugoUltimate').values.initial - metric(puffer, 'dmgBonus').values.initial)
        .toBe(20)
    })

    it('keeps Hugo scoped Mindscape DEF Ignore separate from broad candidate pressure', () => {
      const base = createPreparedState({ hugo: 'nonLimited' }, ['hugo', 'lycaon', 'astraYao'], 0)
      const m0 = agent(calculateParty(base)!, 'hugo')
      const m1 = agent(calculateParty(withMindscape(base, 'hugo', 1))!, 'hugo')
      const m2 = agent(calculateParty(withMindscape(base, 'hugo', 2))!, 'hugo')
      const m4 = agent(calculateParty(withMindscape(base, 'hugo', 4))!, 'hugo')
      const m6 = agent(calculateParty(withMindscape(base, 'hugo', 6))!, 'hugo')

      expect(metric(m1, 'critRate').values.combat - metric(m0, 'critRate').values.combat).toBeCloseTo(12)
      expect(metric(m1, 'critDmg').values.combat - metric(m0, 'critDmg').values.combat).toBe(30)
      expect(metric(m2, 'defIgnore').values).toEqual({ initial: 0, combat: 0, fully: 0 })
      expect(action(m2, 'hugoTotalizeDefIgnore').values.fully).toBe(15)
      expect(metric(m4, 'resIgnore').values.fully).toBe(12)
      expect(action(m6, 'hugoTotalize').values.fully - action(m4, 'hugoTotalize').values.fully)
        .toBe(60)
      expect(m6.operations).toContainEqual(expect.objectContaining({
        id: 'hugoExNonStunnedTotalizeAddedMultiplier', value: 1000,
      }))
    })

    it('projects Ju Fufu ATK and King thresholds through complete equipment packages', () => {
      const full = agent(calculateParty(
        createPreparedState({}, ['juFufu', 'yixuan', 'lucia'], 1),
      )!, 'juFufu')
      const nonLimited = agent(calculateParty(
        createPreparedState({ juFufu: 'nonLimited' }, ['juFufu', 'yixuan', 'lucia'], 1),
      )!, 'juFufu')

      expect(metric(full, 'atk').values.initial).toBeCloseTo(3124.2, 10)
      expect(metric(full, 'atk').gauge).toMatchObject({
        threshold: 2800, cap: 3400, outputValue: 35, outputCap: 50,
      })
      expect(metric(full, 'critRate').values.initial).toBeCloseTo(51.4, 10)
      expect(metric(full, 'critRate').gauge).toMatchObject({
        threshold: 50, outputValue: 30,
      })
      expect(metric(full, 'dmgBonus').breakdown.fully)
        .toContainEqual(expect.objectContaining({ ownerAgentId: 'juFufu', locus: 'w-engine', amount: 20 }))
      expect(action(full, 'juFufuExChainUltimateDaze').values.fully - metric(full, 'dazeBonus').values.fully)
        .toBeCloseTo(28)
      expect(action(full, 'juFufuChain').values.fully - metric(full, 'dmgBonus').values.fully)
        .toBeCloseTo(20)
      expect(action(full, 'juFufuUltimate').values.fully - metric(full, 'dmgBonus').values.fully)
        .toBeCloseTo(40)

      expect(metric(nonLimited, 'atk').values.initial).toBeCloseTo(2199.7, 10)
      expect(metric(nonLimited, 'atk').gauge).toMatchObject({ outputValue: 20 })
      expect(metric(nonLimited, 'impact').values.fully).toBeGreaterThan(
        metric(nonLimited, 'impact').values.combat,
      )
      expect(metric(nonLimited, 'energyRegen').values.fully).toBeCloseTo(1.8)

      const allocated = agent(calculateParty(
        createPreparedState({}, ['juFufu', 'trigger', 'yixuan'], 2),
      )!, 'juFufu')
      expect(metric(allocated, 'critRate').gauge).toMatchObject({
        threshold: 50, outputValue: 30,
      })
      expect(allocated.metrics.find(({ id }) => id === 'energyRegen')).toBeUndefined()
    })

    it('applies Ju Fufu cumulative Mindscapes without inventing Decibel state', () => {
      const base = createPreparedState({}, ['juFufu', 'yixuan', 'lucia'], 1)
      const m0 = agent(calculateParty(base)!, 'juFufu')
      const m1 = agent(calculateParty(withMindscape(base, 'juFufu', 1))!, 'juFufu')
      const m2 = agent(calculateParty(withMindscape(base, 'juFufu', 2))!, 'juFufu')
      const m4 = agent(calculateParty(withMindscape(base, 'juFufu', 4))!, 'juFufu')
      const m6 = agent(calculateParty(withMindscape(base, 'juFufu', 6))!, 'juFufu')

      expect(metric(m1, 'critRate').values.combat - metric(m0, 'critRate').values.combat).toBe(12)
      expect(metric(m1, 'stunDmgMultiplier').values.fully).toBe(35)
      expect(metric(m2, 'critDmg').values.fully - metric(m1, 'critDmg').values.fully).toBe(22)
      expect(metric(m4, 'critDmg').values.fully - metric(m2, 'critDmg').values.fully).toBe(35)
      expect(action(m6, 'juFufuChain').values.fully - action(m4, 'juFufuChain').values.fully)
        .toBe(30)
      expect(m6.operations).toContainEqual(expect.objectContaining({
        id: 'juFufuPopcornMultiplier', value: 480, unit: '%',
      }))
      expect(JSON.stringify(m6)).not.toMatch(/decibel|momentum|might/i)
    })

    it('projects canonical squad action clauses through existing and absent recipient rows', () => {
      const yixuan = agent(calculateParty(
        createPreparedState({}, ['yixuan', 'juFufu', 'lucia'], 0),
      )!, 'yixuan')
      const manato = agent(calculateParty(
        createPreparedState({}, ['manato', 'juFufu', 'lucia'], 0),
      )!, 'manato')
      const contrast = agent(calculateParty(
        createPreparedState({}, ['yixuan', 'dialyn', 'lucia'], 0),
      )!, 'yixuan')

      expect(action(yixuan, 'sharedChainAttackDmg')).toMatchObject({
        baseActionId: 'coreActions', values: { fully: expect.any(Number) },
      })
      expect(action(yixuan, 'sharedChainAttackDmg').values.fully
        - action(yixuan, 'coreActions').values.fully).toBe(20)
      expect(action(yixuan, 'sharedUltimateDmg').values.fully
        - action(yixuan, 'coreActions').values.fully).toBe(40)
      expect(action(manato, 'sharedChainAttackDmg').values.fully
        - metric(manato, 'dmgBonus').values.fully).toBe(20)
      expect(action(manato, 'sharedUltimateDmg').values.fully
        - metric(manato, 'dmgBonus').values.fully).toBe(40)
      expect(contrast.actionModifiers.map(({ id }) => id)).not.toContain('sharedChainAttackDmg')
      expect(contrast.actionModifiers.map(({ id }) => id)).not.toContain('sharedUltimateDmg')
    })

    it('projects Pan Yinhu pool packages, focus Sheer Force, and exact Mindscape consumers', () => {
      const fullState = createPreparedState({}, ['yixuan', 'panYinhu', 'juFufu'], 0)
      const full = agent(calculateParty(fullState)!, 'panYinhu')
      const yixuan = agent(calculateParty(fullState)!, 'yixuan')
      const juFufu = agent(calculateParty(fullState)!, 'juFufu')
      expect(metric(full, 'atk').values.initial).toBeCloseTo(2651.8, 10)
      expect(metric(full, 'atk').gauge).toMatchObject({
        cap: 3000, outputValue: 636.432, outputCap: 720,
      })
      let matureFullState = setSubstat(fullState, 'panYinhu', 'atkPct', 8)
      matureFullState = setSubstat(matureFullState, 'panYinhu', 'atkFlat', 8)
      const matureFull = agent(calculateParty(matureFullState)!, 'panYinhu')
      expect(metric(matureFull, 'atk').values.initial).toBeCloseTo(3133.56, 10)
      expect(metric(matureFull, 'atk').gauge).toMatchObject({
        outputValue: 720, outputCap: 720,
      })
      expect(metric(yixuan, 'sheerForce').breakdown.fully)
        .toContainEqual(expect.objectContaining({ ownerAgentId: 'panYinhu', amount: 636.432 }))
      expect(metric(yixuan, 'dmgBonus').breakdown.fully)
        .toContainEqual(expect.objectContaining({ ownerAgentId: 'panYinhu', locus: 'w-engine', amount: 18 }))
      expect(metric(juFufu, 'dazeBonus').breakdown.fully)
        .toContainEqual(expect.objectContaining({ ownerAgentId: 'panYinhu', locus: 'w-engine', amount: 12 }))

      const m0State = withMindscape(fullState, 'panYinhu', 0)
      const m0 = agent(calculateParty(m0State)!, 'panYinhu')
      const m0Focus = agent(calculateParty(m0State)!, 'yixuan')
      expect(metric(m0, 'atk').gauge).toMatchObject({ outputCap: 540 })
      expect(metric(m0, 'atk').gauge?.outputValue).toBeCloseTo(477.324, 10)
      expect(metric(m0Focus, 'sheerForce').breakdown.fully
        .find(({ ownerAgentId }) => ownerAgentId === 'panYinhu')?.amount)
        .toBeCloseTo(477.324, 10)

      const nonLimitedState = createPreparedState(
        { panYinhu: 'nonLimited' }, ['yixuan', 'panYinhu', 'juFufu'], 0,
      )
      const nonLimited = agent(calculateParty(nonLimitedState)!, 'panYinhu')
      expect(metric(nonLimited, 'atk').values.initial).toBeCloseTo(2821.75, 10)
      let matureNonLimitedState = setSubstat(nonLimitedState, 'panYinhu', 'atkPct', 8)
      matureNonLimitedState = setSubstat(matureNonLimitedState, 'panYinhu', 'atkFlat', 8)
      expect(metric(agent(calculateParty(matureNonLimitedState)!, 'panYinhu'), 'atk')
        .values.initial).toBeCloseTo(3282.15, 10)
      expect(action(nonLimited, 'panExUltimate').breakdown.fully)
        .toContainEqual(expect.objectContaining({
          ownerAgentId: 'panYinhu', locus: 'w-engine', amount: 40,
        }))
      expect(nonLimited.operations).toEqual([])

      const allocatedState = createPreparedState(
        {}, ['cissia', 'panYinhu', 'yixuan'], 2,
      )
      expect(allocatedState.slots[1].setup).toMatchObject({
        fourPieceId: 'bunnyInWonderland', twoPieceId: 'astralVoice',
      })
      const allocated = calculateParty(allocatedState)!
      for (const recipient of ['cissia', 'yixuan'] as const) {
        expect(metric(agent(allocated, recipient), 'dmgBonus').breakdown.fully)
          .toContainEqual(expect.objectContaining({
            ownerAgentId: 'panYinhu', locus: 'disc-4pc', amount: 18,
          }))
      }
      expect(metric(agent(allocated, 'panYinhu'), 'atk').values.initial)
        .toBeCloseTo(2651.8, 10)

      let swingState = createPreparedState({}, ['yixuan', 'panYinhu', 'juFufu'], 0)
      swingState = selectDisc(swingState, 'panYinhu', 'fourPiece', 'swingJazz')
      swingState = selectDisc(swingState, 'panYinhu', 'twoPiece', 'astralVoice')
      const swing = calculateParty(swingState)!
      expect(metric(agent(swing, 'yixuan'), 'dmgBonus').breakdown.fully)
        .toContainEqual(expect.objectContaining({
          ownerAgentId: 'panYinhu', locus: 'disc-4pc', amount: 15,
        }))
      expect(metric(agent(swing, 'panYinhu'), 'energyRegen').values.initial).toBeCloseTo(2.808)
    })

    it('qualifies Pan Yinhu Additional by Rupture or typed faction and clears it otherwise', () => {
      const rupture = agent(calculateParty(
        createPreparedState({}, ['hugo', 'panYinhu', 'yixuan'], 0),
      )!, 'hugo')
      const faction = agent(calculateParty(
        createPreparedState({}, ['hugo', 'panYinhu', 'juFufu'], 0),
      )!, 'hugo')
      const absent = agent(calculateParty(
        createPreparedState({}, ['hugo', 'panYinhu', 'corin'], 0),
      )!, 'hugo')
      expect(metric(rupture, 'dmgBonus').breakdown.fully)
        .toContainEqual(expect.objectContaining({ ownerAgentId: 'panYinhu', locus: 'additional', amount: 30 }))
      expect(metric(faction, 'dmgBonus').breakdown.fully)
        .toContainEqual(expect.objectContaining({ ownerAgentId: 'panYinhu', locus: 'additional', amount: 30 }))
      expect(metric(absent, 'dmgBonus').breakdown.fully)
        .not.toContainEqual(expect.objectContaining({ ownerAgentId: 'panYinhu', locus: 'additional' }))
    })

    it('projects Banyue through the shared Rupture formula and pool-specific packages', () => {
      const full = agent(calculateParty(
        createPreparedState({}, ['banyue', 'dialyn', 'lucia'], 0),
      )!, 'banyue')
      const nonLimited = agent(calculateParty(
        createPreparedState({ banyue: 'nonLimited' }, ['banyue', 'dialyn', 'lucia'], 0),
      )!, 'banyue')

      expect(metric(full, 'maxHp').values.initial).toBeCloseTo(16644.9, 10)
      expect(metric(full, 'atk').values.initial).toBeCloseTo(1888, 10)
      expect(metric(full, 'sheerForce').values.initial).toBeCloseTo(2230.89, 10)
      expect(metric(full, 'critRate').values).toMatchObject({ initial: 43.4, combat: 43.4 })
      expect(metric(full, 'critRate').breakdown.fully)
        .toContainEqual(expect.objectContaining({ ownerAgentId: 'banyue', locus: 'w-engine', amount: 20 }))
      expect(action(full, 'banyueExSpecialSheer').breakdown.fully)
        .toContainEqual(expect.objectContaining({ ownerAgentId: 'banyue', locus: 'w-engine', amount: 18 }))

      expect(metric(nonLimited, 'maxHp').values.initial).toBeCloseTo(16220.05, 10)
      expect(metric(nonLimited, 'atk').values.initial).toBeCloseTo(1769, 10)
      expect(metric(nonLimited, 'sheerForce').values.initial).toBeCloseTo(2152.705, 10)
      expect(metric(nonLimited, 'critRate').values.initial).toBeCloseTo(51.4, 10)
      expect(metric(nonLimited, 'critRate').breakdown.fully)
        .toContainEqual(expect.objectContaining({ ownerAgentId: 'banyue', locus: 'w-engine', amount: 10.4 }))
      expect(metric(nonLimited, 'dmgBonus').breakdown.fully)
        .toContainEqual(expect.objectContaining({ ownerAgentId: 'banyue', locus: 'w-engine', amount: 19.2 }))
    })

    it('keeps Banyue qualification and exact Mindscape action consumers local', () => {
      const qualifiedState = createPreparedState({}, ['banyue', 'dialyn', 'yixuan'], 0)
      const absent = agent(calculateParty(
        createPreparedState({}, ['banyue', 'yixuan', 'manato'], 0),
      )!, 'banyue')
      const m0 = agent(calculateParty(qualifiedState)!, 'banyue')
      const m1 = agent(calculateParty(withMindscape(qualifiedState, 'banyue', 1))!, 'banyue')
      const m2 = agent(calculateParty(withMindscape(qualifiedState, 'banyue', 2))!, 'banyue')
      const m4 = agent(calculateParty(withMindscape(qualifiedState, 'banyue', 4))!, 'banyue')
      const m6 = agent(calculateParty(withMindscape(qualifiedState, 'banyue', 6))!, 'banyue')

      expect(metric(m0, 'dmgBonus').breakdown.fully)
        .toContainEqual(expect.objectContaining({ ownerAgentId: 'banyue', locus: 'additional', amount: 15 }))
      expect(metric(absent, 'dmgBonus').breakdown.fully)
        .not.toContainEqual(expect.objectContaining({ ownerAgentId: 'banyue', locus: 'additional' }))
      expect(metric(m1, 'resReduction').values.fully).toBe(10)
      expect(action(m1, 'banyueTremorActions').values.fully
        - metric(m1, 'sheerDmgBonus').values.fully).toBe(10)
      expect(action(m1, 'banyueCrushingPeaksStun').values.fully
        - metric(m1, 'stunDuration').values.fully).toBe(2)
      expect(metric(m2, 'critDmg').values.fully - metric(m1, 'critDmg').values.fully).toBe(15)
      expect(metric(m2, 'dmgBonus').values.fully - metric(m1, 'dmgBonus').values.fully).toBe(15)
      expect(action(m4, 'banyueM4Actions').values.fully
        - metric(m4, 'dmgBonus').values.fully).toBe(30)
      expect(metric(m6, 'dmgBonus').values.fully - metric(m4, 'dmgBonus').values.fully).toBe(24)
      expect(m6.operations).toContainEqual(expect.objectContaining({
        id: 'banyueCrushingPeaksMultiplier', value: 600, unit: '%',
      }))
    })

    it('projects Starlight Billy through shared Rupture and exact pool packages', () => {
      const full = agent(calculateParty(
        createPreparedState({}, ['starlightBilly', 'dialyn', 'lucia'], 0),
      )!, 'starlightBilly')
      const nonLimited = agent(calculateParty(
        createPreparedState(
          { starlightBilly: 'nonLimited' }, ['starlightBilly', 'dialyn', 'lucia'], 0,
        ),
      )!, 'starlightBilly')

      expect(metric(full, 'maxHp').values.initial).toBeCloseTo(16644.9, 10)
      expect(metric(full, 'atk').values.initial).toBeCloseTo(1888, 10)
      expect(metric(full, 'sheerForce').values.initial).toBeCloseTo(2230.89, 10)
      expect(metric(full, 'critRate').values.initial).toBeCloseTo(43.4, 10)
      expect(metric(full, 'critRate').breakdown.fully)
        .toContainEqual(expect.objectContaining({ ownerAgentId: 'starlightBilly', locus: 'w-engine', amount: 20 }))
      expect(metric(full, 'sheerDmgBonus').breakdown.fully)
        .toContainEqual(expect.objectContaining({ ownerAgentId: 'starlightBilly', locus: 'w-engine', amount: 20 }))

      expect(metric(nonLimited, 'maxHp').values.initial).toBeCloseTo(16220.05, 10)
      expect(metric(nonLimited, 'atk').values.initial).toBeCloseTo(1769, 10)
      expect(metric(nonLimited, 'sheerForce').values.initial).toBeCloseTo(2152.705, 10)
      expect(metric(nonLimited, 'critRate').values.initial).toBeCloseTo(51.4, 10)
      expect(metric(nonLimited, 'critRate').breakdown.fully)
        .toContainEqual(expect.objectContaining({ ownerAgentId: 'starlightBilly', locus: 'w-engine', amount: 10.4 }))
      expect(metric(nonLimited, 'dmgBonus').breakdown.fully)
        .toContainEqual(expect.objectContaining({ ownerAgentId: 'starlightBilly', locus: 'w-engine', amount: 19.2 }))

      const steel = agent(calculateParty(selectEngine(
        createPreparedState({}, ['starlightBilly', 'dialyn', 'lucia'], 0),
        'starlightBilly',
        'steelCushion',
      ))!, 'starlightBilly')
      expect(metric(steel, 'critRate').breakdown.initial)
        .toContainEqual(expect.objectContaining({
          ownerAgentId: 'starlightBilly', locus: 'w-engine', amount: 24,
        }))
      expect(metric(steel, 'dmgBonus').breakdown.fully)
        .not.toContainEqual(expect.objectContaining({
          ownerAgentId: 'starlightBilly', locus: 'w-engine',
        }))
    })

    it('keeps Starlight Billy specialty qualification and Mindscape actions local', () => {
      const qualifiedState = createPreparedState({}, ['starlightBilly', 'dialyn', 'yidhari'], 0)
      const defenseQualified = agent(calculateParty(
        createPreparedState({}, ['starlightBilly', 'panYinhu', 'yidhari'], 0),
      )!, 'starlightBilly')
      const absent = agent(calculateParty(
        createPreparedState({}, ['starlightBilly', 'yixuan', 'manato'], 0),
      )!, 'starlightBilly')
      const m0 = agent(calculateParty(qualifiedState)!, 'starlightBilly')
      const m1 = agent(calculateParty(
        withMindscape(qualifiedState, 'starlightBilly', 1),
      )!, 'starlightBilly')
      const m2 = agent(calculateParty(
        withMindscape(qualifiedState, 'starlightBilly', 2),
      )!, 'starlightBilly')
      const m4 = agent(calculateParty(
        withMindscape(qualifiedState, 'starlightBilly', 4),
      )!, 'starlightBilly')
      const m6 = agent(calculateParty(
        withMindscape(qualifiedState, 'starlightBilly', 6),
      )!, 'starlightBilly')

      expect(action(m0, 'starlightBillyAdditionalActions').breakdown.fully)
        .toContainEqual(expect.objectContaining({ ownerAgentId: 'starlightBilly', locus: 'additional', amount: 40 }))
      expect(action(defenseQualified, 'starlightBillyAdditionalActions').breakdown.fully)
        .toContainEqual(expect.objectContaining({ ownerAgentId: 'starlightBilly', locus: 'additional', amount: 40 }))
      expect(absent.actionModifiers.find(({ id }) => id === 'starlightBillyAdditionalActions'))
        .toBeUndefined()
      expect(metric(m1, 'resIgnore').values.fully).toBe(18)
      expect(action(m2, 'starlightBillyM2CoolWheelie').breakdown.fully)
        .toContainEqual(expect.objectContaining({
          ownerAgentId: 'starlightBilly', locus: 'mindscape', amount: 50,
        }))
      expect(action(m2, 'starlightBillyM2CoolWheelie').values.fully
        - metric(m2, 'dmgBonus').values.fully).toBe(90)
      expect(action(m2, 'starlightBillyM2CoolWheelie').baseActionId)
        .toBe('starlightBillyAdditionalActions')
      expect(action(m2, 'starlightBillyM2CoolWheelieCrit').breakdown.fully)
        .toContainEqual(expect.objectContaining({
          ownerAgentId: 'starlightBilly', locus: 'mindscape', amount: 50,
        }))

      const puzzle = agent(calculateParty(withMindscape(selectEngine(
        qualifiedState, 'starlightBilly', 'puzzleSphere',
      ), 'starlightBilly', 2))!, 'starlightBilly')
      expect(action(puzzle, 'starlightBillyExSpecial').values.fully
        - metric(puzzle, 'dmgBonus').values.fully).toBe(72)
      expect(action(puzzle, 'starlightBillyM2CoolWheelie').values.fully
        - metric(puzzle, 'dmgBonus').values.fully).toBe(122)
      expect(action(puzzle, 'starlightBillyM2CoolWheelie').baseActionId)
        .toBe('starlightBillyExSpecial')
      expect(metric(m4, 'critDmg').values.fully - metric(m2, 'critDmg').values.fully).toBe(16)
      expect(action(m6, 'starlightBillyM6SheerActions').values.fully
        - metric(m6, 'sheerDmgBonus').values.fully).toBe(18)
      expect(m6.operations).toContainEqual(expect.objectContaining({
        id: 'starlightBillyFinalHitMultiplier', value: 200, unit: '% Sheer Force',
      }))
    })

    it('keeps Harumasa Core, Potential, Zanshin, Cordis, and Mindscapes on exact actions', () => {
      const base = createPreparedState({}, ['harumasa', 'qingyi', 'lucia'], 0)
      const m0 = agent(calculateParty(base)!, 'harumasa')
      const m2 = agent(calculateParty(withMindscape(base, 'harumasa', 2))!, 'harumasa')
      const m6 = agent(calculateParty(withMindscape(base, 'harumasa', 6))!, 'harumasa')

      expect(metric(m0, 'atk').breakdown.fully).toContainEqual(expect.objectContaining({
        ownerAgentId: 'harumasa', locus: 'identity',
        display: { value: 12, unit: '%', decimals: 0 },
      }))
      expect(action(m2, 'harumasaDashSlashDmg').values.fully
        - action(m2, 'harumasaDashDmg').values.fully).toBe(50)
      expect(m0.actionModifiers.find(({ id }) => id === 'harumasaDashSlashDmg'))
        .toBeUndefined()
      expect(metric(m6, 'resIgnore').values.fully).toBe(15)
      expect(action(m6, 'harumasaDashChasingResIgnore').values.fully).toBe(30)
      expect(action(m6, 'harumasaDashChasingResIgnore').breakdown.fully)
        .toContainEqual(expect.objectContaining({
          ownerAgentId: 'harumasa', locus: 'identity', amount: 15,
        }))
      expect(metric(m6, 'resIgnore').breakdown.fully)
        .toContainEqual(expect.objectContaining({
          ownerAgentId: 'harumasa', locus: 'mindscape', amount: 15,
        }))

      const cordis = agent(calculateParty(selectEngine(base, 'harumasa', 'cordisGermina'))!, 'harumasa')
      expect(metric(cordis, 'defIgnore').values.fully).toBe(0)
      expect(action(cordis, 'harumasaBasicUltimateDefIgnore').values.fully).toBe(20)
      expect(action(cordis, 'harumasaDashDmg').values.fully
        - metric(cordis, 'dmgBonus').values.fully).toBe(15)

      const heartstring = agent(calculateParty(
        selectEngine(base, 'harumasa', 'heartstringNocturne'),
      )!, 'harumasa')
      expect(metric(heartstring, 'resIgnore').values.fully).toBe(0)
      expect(action(heartstring, 'harumasaDashChasingResIgnore').breakdown.fully)
        .not.toContainEqual(expect.objectContaining({ locus: 'w-engine' }))
    })

    it('projects Qingyi current Impact conversion, exact actions, and cumulative Mindscapes', () => {
      const qualified = createPreparedState({}, ['harumasa', 'qingyi', 'lucia'], 0)
      const unqualified = createPreparedState({}, ['yixuan', 'qingyi', 'lucia'], 0)
      const q0 = agent(calculateParty(qualified)!, 'qingyi')
      const absent = agent(calculateParty(unqualified)!, 'qingyi')
      expect(metric(q0, 'atk').breakdown.initial).toContainEqual(expect.objectContaining({
        ownerAgentId: 'qingyi', locus: 'additional', amount: 438.72,
      }))
      expect(metric(absent, 'atk').breakdown.initial)
        .not.toContainEqual(expect.objectContaining({ ownerAgentId: 'qingyi', locus: 'additional' }))

      const m1Party = calculateParty(withMindscape(qualified, 'qingyi', 1))!
      const m1 = agent(m1Party, 'qingyi')
      expect(metric(m1, 'critRate').values.fully - metric(q0, 'critRate').values.fully).toBe(20)
      expect(metric(agent(m1Party, 'harumasa'), 'defReduction').values.fully).toBe(15)

      const m2 = agent(calculateParty(withMindscape(qualified, 'qingyi', 2))!, 'qingyi')
      expect(metric(m2, 'stunDmgMultiplier').values.fully).toBe(108)
      expect(metric(m2, 'dazeBonus').values.fully - metric(q0, 'dazeBonus').values.fully).toBe(15)

      const m6Party = calculateParty(withMindscape(qualified, 'qingyi', 6))!
      const m6 = agent(m6Party, 'qingyi')
      expect(action(m6, 'qingyiEnchantedBasicCritDmg').values.fully
        - metric(m6, 'critDmg').values.fully).toBe(100)
      expect(metric(agent(m6Party, 'harumasa'), 'resReduction').values.fully).toBe(20)
      expect(agent(m6Party, 'lucia').metrics.find(({ id }) => id === 'resReduction'))
        .toBeUndefined()

      const broadM6Party = calculateParty(withMindscape(
        createPreparedState({}, ['pulchra', 'qingyi', 'starlightBilly'], 2),
        'qingyi',
        6,
      ))!
      expect(metric(agent(broadM6Party, 'pulchra'), 'resReduction').values.fully).toBe(20)
      expect(metric(agent(broadM6Party, 'starlightBilly'), 'resReduction').values.fully).toBe(20)
    })

    it('keeps Qingyi M1 broad DEF pressure off Sheer recipients', () => {
      const state = withMindscape(
        createPreparedState({}, ['harumasa', 'qingyi', 'yixuan'], 0),
        'qingyi',
        1,
      )
      const result = calculateParty(state)!
      expect(metric(agent(result, 'harumasa'), 'defReduction').values.fully).toBe(15)
      expect(agent(result, 'yixuan').metrics.find(({ id }) => id === 'defReduction'))
        .toBeUndefined()
    })

    it('projects Harumasa broad-engine and selected Disc packages independently', () => {
      const base = createPreparedState({}, ['harumasa', 'qingyi', 'lucia'], 0)
      for (const engineId of ['brimstone', 'starlightEngine'] as const) {
        const result = agent(calculateParty(selectEngine(base, 'harumasa', engineId))!, 'harumasa')
        expect(metric(result, 'atk').breakdown.fully)
          .toContainEqual(expect.objectContaining({
            ownerAgentId: 'harumasa', locus: 'w-engine',
          }))
        if (engineId === 'starlightEngine') {
          expect(metric(result, 'atk').breakdown.combat)
            .not.toContainEqual(expect.objectContaining({ locus: 'w-engine' }))
        }
      }

      const thunder = agent(calculateParty(selectDisc(
        base, 'harumasa', 'fourPiece', 'thunderMetal',
      ))!, 'harumasa')
      expect(metric(thunder, 'atk').breakdown.fully)
        .toContainEqual(expect.objectContaining({
          ownerAgentId: 'harumasa', locus: 'disc-4pc',
          display: { value: 28, unit: '%', decimals: 0 },
        }))
      expect(metric(thunder, 'dmgBonus').breakdown.initial)
        .toContainEqual(expect.objectContaining({
          ownerAgentId: 'harumasa', locus: 'disc-4pc', detail: '2-piece', amount: 10,
        }))
    })

    it('keeps action-scoped CRIT Rate capped for both current hierarchy consumers', () => {
      let harumasaState = createPreparedState({}, ['harumasa', 'nekomata', 'billy'], 0)
      harumasaState = selectEngine(harumasaState, 'harumasa', 'cordisGermina')
      harumasaState = selectDisc(harumasaState, 'harumasa', 'fourPiece', 'thunderMetal')
      harumasaState = selectDisc(harumasaState, 'harumasa', 'twoPiece', 'woodpecker')
      harumasaState = selectMain(harumasaState, 'harumasa', 'slot4', 'critRate')
      const harumasa = agent(calculateParty(harumasaState)!, 'harumasa')
      expect(metric(harumasa, 'critRate').values.fully).toBe(90.4)
      expect(action(harumasa, 'harumasaCoreCritRate').values.fully).toBe(100)

      const billyState = selectEngine(
        withMindscape(
          createPreparedState({}, ['billy', 'nekomata', 'qingyi'], 0),
          'billy',
          4,
        ),
        'billy',
        'cordisGermina',
      )
      const billy = agent(calculateParty(billyState)!, 'billy')
      expect(metric(billy, 'critRate').values.fully).toBe(90.4)
      expect(action(billy, 'billyExSpecialCritRate').values.fully).toBe(100)
    })

    it('projects Qingyi alternate W-Engines through their complete usable clauses', () => {
      const base = createPreparedState({}, ['harumasa', 'qingyi', 'lucia'], 0)
      const restrained = agent(calculateParty(
        selectEngine(base, 'qingyi', 'restrained'),
      )!, 'qingyi')
      expect(action(restrained, 'qingyiBasicDmg').values.fully
        - metric(restrained, 'dmgBonus').values.fully).toBe(30)
      expect(action(restrained, 'qingyiBasicDaze').values.fully
        - metric(restrained, 'dazeBonus').values.fully).toBe(50)

      const hellfire = agent(calculateParty(
        selectEngine(base, 'qingyi', 'hellfireGears'),
      )!, 'qingyi')
      expect(metric(hellfire, 'impact').values.fully)
        .toBeGreaterThan(metric(hellfire, 'impact').values.initial)
      expect(hellfire.metrics.find(({ id }) => id === 'energyRegen')).toBeUndefined()

      const steam = agent(calculateParty(
        selectEngine(base, 'qingyi', 'steamOven'),
      )!, 'qingyi')
      expect(metric(steam, 'energyRegen').values.initial).toBeCloseTo(1.8)
      expect(metric(steam, 'impact').values.fully
        - metric(steam, 'impact').values.initial).toBeCloseTo(34.816)
      expect(metric(steam, 'impact').gauge).toMatchObject({
        current: 203.456, outputCap: 600,
      })
      expect(metric(steam, 'impact').gauge?.outputValue).toBeCloseTo(500.736)

      const precious = agent(calculateParty(
        selectEngine(base, 'qingyi', 'preciousFossilizedCore'),
      )!, 'qingyi')
      expect(metric(precious, 'dazeBonus').breakdown.fully)
        .toContainEqual(expect.objectContaining({
          ownerAgentId: 'qingyi', locus: 'w-engine', amount: 32,
        }))

      const blazingState = selectEngine(
        createPreparedState({}, ['harumasa', 'qingyi', 'hugo'], 0),
        'qingyi',
        'blazingLaurel',
      )
      const blazing = calculateParty(blazingState)!
      expect(metric(agent(blazing, 'hugo'), 'critDmg').breakdown.fully)
        .toContainEqual(expect.objectContaining({
          ownerAgentId: 'qingyi', locus: 'w-engine', amount: 30,
        }))
      expect(metric(agent(blazing, 'harumasa'), 'critDmg').breakdown.fully)
        .not.toContainEqual(expect.objectContaining({
          ownerAgentId: 'qingyi', locus: 'w-engine',
        }))
    })

    it('projects Nekomata Potential, qualification, Mindscapes, and exact engine clauses', () => {
      const qualifiedState = createPreparedState({}, ['nekomata', 'qingyi', 'lucia'], 0)
      const unqualifiedState = createPreparedState({}, ['nekomata', 'qingyi', 'lycaon'], 0)
      const m0 = agent(calculateParty(qualifiedState)!, 'nekomata')
      const absent = agent(calculateParty(unqualifiedState)!, 'nekomata')

      expect(metric(m0, 'dmgBonus').breakdown.fully).toContainEqual(expect.objectContaining({
        ownerAgentId: 'nekomata', locus: 'core', amount: 60,
      }))
      expect(metric(m0, 'dmgBonus').breakdown.combat).toContainEqual(expect.objectContaining({
        ownerAgentId: 'nekomata', locus: 'w-engine', amount: 20,
      }))
      expect(metric(m0, 'dmgBonus').breakdown.fully).toContainEqual(expect.objectContaining({
        ownerAgentId: 'nekomata', locus: 'w-engine', amount: 25,
      }))
      expect(metric(m0, 'atk').breakdown.fully).toContainEqual(expect.objectContaining({
        ownerAgentId: 'nekomata', locus: 'disc-4pc',
      }))
      expect(metric(m0, 'penRatio').breakdown.initial).toContainEqual(expect.objectContaining({
        ownerAgentId: 'nekomata', locus: 'disc-2pc', amount: 8,
      }))
      expect(metric(m0, 'critDmg').breakdown.fully).toContainEqual(expect.objectContaining({
        ownerAgentId: 'nekomata', locus: 'identity', amount: 60,
      }))
      expect(action(m0, 'nekomataAdditionalActions').breakdown.fully)
        .toContainEqual(expect.objectContaining({
          ownerAgentId: 'nekomata', locus: 'additional', amount: 70,
        }))
      expect(action(m0, 'nekomataAdditionalActions').outcomes).toHaveLength(2)
      expect(action(m0, 'nekomataAdditionalActions').outcomes)
        .toContainEqual(canonicalAction('Dodge Counter'))
      expect(action(m0, 'nekomataAdditionalActions').outcomes)
        .toContainEqual(canonicalAction('EX Special Attack'))
      expect(absent.actionModifiers.find(({ id }) => id === 'nekomataAdditionalActions'))
        .toBeUndefined()

      const m1 = agent(calculateParty(withMindscape(qualifiedState, 'nekomata', 1))!, 'nekomata')
      const m2 = agent(calculateParty(withMindscape(qualifiedState, 'nekomata', 2))!, 'nekomata')
      const m4 = agent(calculateParty(withMindscape(qualifiedState, 'nekomata', 4))!, 'nekomata')
      const m6 = agent(calculateParty(withMindscape(qualifiedState, 'nekomata', 6))!, 'nekomata')
      expect(metric(m1, 'resIgnore').values.fully).toBe(16)
      expect(metric(m2, 'energyRegen').values).toEqual({
        initial: 1.2, combat: 1.2, fully: 1.5,
      })
      expect(metric(m4, 'critRate').values.fully - metric(m2, 'critRate').values.fully).toBe(14)
      expect(metric(m6, 'critDmg').values.fully - metric(m4, 'critDmg').values.fully).toBe(54)

      const cordis = agent(calculateParty(selectEngine(
        qualifiedState, 'nekomata', 'cordisGermina',
      ))!, 'nekomata')
      expect(metric(cordis, 'defIgnore').values.fully).toBe(0)
      expect(action(cordis, 'nekomataBasicUltimateDefIgnore').values.fully).toBe(20)

      const cloud = agent(calculateParty(selectEngine(
        qualifiedState, 'nekomata', 'cloudcleaveRadiance',
      ))!, 'nekomata')
      expect(metric(cloud, 'resIgnore').values).toEqual({
        initial: 0, combat: 20, fully: 20,
      })
      expect(metric(cloud, 'critDmg').breakdown.initial).toContainEqual(expect.objectContaining({
        ownerAgentId: 'nekomata', locus: 'w-engine', amount: 48,
      }))
      expect(metric(cloud, 'critDmg').breakdown.fully)
        .not.toContainEqual(expect.objectContaining({ locus: 'w-engine' }))
      expect(metric(cloud, 'dmgBonus').breakdown.fully)
        .not.toContainEqual(expect.objectContaining({ ownerAgentId: 'nekomata', locus: 'w-engine' }))
    })

    it('projects Billy Crouching, qualification, Mindscapes, and engine activation separately', () => {
      const qualified = withMindscape(
        createPreparedState({}, ['billy', 'nekomata', 'qingyi'], 0),
        'billy',
        0,
      )
      const unqualified = withMindscape(
        createPreparedState({}, ['billy', 'qingyi', 'lycaon'], 0),
        'billy',
        0,
      )
      const m0 = agent(calculateParty(qualified)!, 'billy')
      const absent = agent(calculateParty(unqualified)!, 'billy')
      const crouching = action(m0, 'billyCrouchingActions')
      expect(crouching.breakdown.fully).toContainEqual(expect.objectContaining({
        ownerAgentId: 'billy', locus: 'core', amount: 50,
      }))
      expect(crouching.outcomes).not.toContainEqual(canonicalAction('Chain Attack'))
      expect(crouching.outcomes).not.toContainEqual(canonicalAction('Assist'))
      expect(crouching.outcomes).not.toContainEqual(canonicalAction('Assist Follow-Up'))
      expect(crouching.outcomes).toHaveLength(6)
      for (const outcome of [
        'Basic Attack', 'Dash Attack', 'Dodge Counter',
        'Special Attack', 'EX Special Attack', 'Ultimate',
      ] as const) {
        expect(crouching.outcomes).toContainEqual(canonicalAction(outcome))
      }
      expect(action(m0, 'billyUltimate').values.fully - crouching.values.fully).toBe(100)
      expect(absent.actionModifiers.find(({ id }) => id === 'billyUltimate')).toBeUndefined()

      const m2 = agent(calculateParty(withMindscape(qualified, 'billy', 2))!, 'billy')
      const m4 = agent(calculateParty(withMindscape(qualified, 'billy', 4))!, 'billy')
      const m6 = agent(calculateParty(withMindscape(qualified, 'billy', 6))!, 'billy')
      expect(action(m2, 'billyDodgeCounter').values.fully
        - action(m2, 'billyCrouchingActions').values.fully).toBe(25)
      expect(action(m4, 'billyExSpecialCritRate').values.fully
        - metric(m4, 'critRate').values.fully).toBeCloseTo(32)
      expect(metric(m6, 'dmgBonus').values.fully - metric(m4, 'dmgBonus').values.fully).toBe(30)

      expect(metric(m0, 'resIgnore').values).toEqual({
        initial: 0, combat: 20, fully: 20,
      })
      expect(metric(m0, 'dmgBonus').breakdown.fully)
        .not.toContainEqual(expect.objectContaining({ ownerAgentId: 'billy', locus: 'w-engine' }))
      expect(metric(m0, 'critDmg').breakdown.initial).toContainEqual(expect.objectContaining({
        ownerAgentId: 'billy', locus: 'w-engine', amount: 48,
      }))
      expect(metric(m0, 'critDmg').breakdown.fully)
        .not.toContainEqual(expect.objectContaining({ ownerAgentId: 'billy', locus: 'w-engine' }))
      const replica = agent(calculateParty(selectEngine(
        qualified, 'billy', 'starlightEngineReplica',
      ))!, 'billy')
      expect(metric(replica, 'dmgBonus').values.fully - metric(m0, 'dmgBonus').values.fully)
        .toBe(57.5)
      expect(action(replica, 'billyCrouchingActions').values.fully
        - metric(replica, 'dmgBonus').values.fully).toBe(50)
      expect(action(replica, 'billyUltimate').values.fully
        - action(replica, 'billyCrouchingActions').values.fully).toBe(100)
      expect(replica.actionModifiers.find(({ id }) => id === 'billyBasic')).toBeUndefined()
      expect(replica.metrics.find(({ id }) => id === 'resIgnore')).toBeUndefined()

      const cordis = agent(calculateParty(selectEngine(
        qualified, 'billy', 'cordisGermina',
      ))!, 'billy')
      expect(metric(cordis, 'defIgnore').values.fully).toBe(0)
      expect(action(cordis, 'billyBasicUltimateDefIgnore').values.fully).toBe(20)

    })

    it('projects Nekomata and Billy alternate whole packages through usable clauses only', () => {
      const nekomataBase = createPreparedState({}, ['nekomata', 'qingyi', 'lucia'], 0)
      const nekomataHeartstring = agent(calculateParty(selectEngine(
        nekomataBase, 'nekomata', 'heartstringNocturne',
      ))!, 'nekomata')
      expect(metric(nekomataHeartstring, 'critDmg').breakdown.combat)
        .toContainEqual(expect.objectContaining({
          ownerAgentId: 'nekomata', locus: 'w-engine', amount: 50,
        }))
      expect(nekomataHeartstring.metrics.find(({ id }) => id === 'resIgnore')).toBeUndefined()

      const nekomataSevered = agent(calculateParty(selectEngine(
        nekomataBase, 'nekomata', 'severedInnocence',
      ))!, 'nekomata')
      expect(metric(nekomataSevered, 'critDmg').breakdown.combat)
        .toContainEqual(expect.objectContaining({
          ownerAgentId: 'nekomata', locus: 'w-engine', amount: 30,
        }))
      expect(metric(nekomataSevered, 'critDmg').breakdown.fully)
        .toContainEqual(expect.objectContaining({
          ownerAgentId: 'nekomata', locus: 'w-engine', amount: 30,
        }))

      const nekomataBrimstone = agent(calculateParty(selectEngine(
        nekomataBase, 'nekomata', 'brimstone',
      ))!, 'nekomata')
      expect(metric(nekomataBrimstone, 'atk').breakdown.fully)
        .toContainEqual(expect.objectContaining({ ownerAgentId: 'nekomata', locus: 'w-engine' }))

      const billyBase = withMindscape(
        createPreparedState({}, ['billy', 'nekomata', 'qingyi'], 0),
        'billy',
        0,
      )
      const billyHeartstring = agent(calculateParty(selectEngine(
        billyBase, 'billy', 'heartstringNocturne',
      ))!, 'billy')
      expect(metric(billyHeartstring, 'critDmg').breakdown.combat)
        .toContainEqual(expect.objectContaining({
          ownerAgentId: 'billy', locus: 'w-engine', amount: 50,
        }))
      expect(billyHeartstring.metrics.find(({ id }) => id === 'resIgnore')).toBeUndefined()

      const billySteel = agent(calculateParty(selectEngine(
        billyBase, 'billy', 'steelCushion',
      ))!, 'billy')
      expect(metric(billySteel, 'dmgBonus').breakdown.combat)
        .toContainEqual(expect.objectContaining({
          ownerAgentId: 'billy', locus: 'w-engine', amount: 20,
        }))
      expect(metric(billySteel, 'dmgBonus').breakdown.fully)
        .toContainEqual(expect.objectContaining({
          ownerAgentId: 'billy', locus: 'w-engine', amount: 25,
        }))

      const billyBrimstone = agent(calculateParty(selectEngine(
        billyBase, 'billy', 'brimstone',
      ))!, 'billy')
      expect(metric(billyBrimstone, 'atk').breakdown.fully)
        .toContainEqual(expect.objectContaining({ ownerAgentId: 'billy', locus: 'w-engine' }))
      expect(metric(billyBrimstone, 'critDmg').breakdown.initial)
        .toContainEqual(expect.objectContaining({ ownerAgentId: 'billy', locus: 'disc-2pc' }))
    })

    it('keeps Billy selected Disc projection independent from candidate ordering', () => {
      const base = withMindscape(
        createPreparedState({}, ['billy', 'nekomata', 'qingyi'], 0),
        'billy',
        0,
      )
      const shadow = agent(calculateParty(selectDisc(
        base, 'billy', 'fourPiece', 'shadowHarmony',
      ))!, 'billy')
      expect(action(shadow, 'billyDash').values.initial
        - action(shadow, 'billyCrouchingActions').values.initial).toBe(15)
      expect(metric(shadow, 'atk').breakdown.fully).toContainEqual(expect.objectContaining({
        ownerAgentId: 'billy', locus: 'disc-4pc',
      }))
      expect(metric(shadow, 'critRate').breakdown.fully).toContainEqual(expect.objectContaining({
        ownerAgentId: 'billy', locus: 'disc-4pc',
      }))

      const pufferBase = withMindscape(
        createPreparedState({}, ['billy', 'nekomata', 'dialyn'], 0),
        'billy',
        0,
      )
      const pufferState = selectDisc(
        selectDisc(pufferBase, 'billy', 'twoPiece', 'woodpecker'),
        'billy', 'fourPiece', 'pufferElectro',
      )
      const puffer = agent(calculateParty(pufferState)!, 'billy')
      expect(action(puffer, 'billyUltimate').breakdown.initial)
        .toContainEqual(expect.objectContaining({
          ownerAgentId: 'billy', locus: 'disc-4pc', amount: 20,
        }))
      expect(metric(puffer, 'atk').breakdown.fully)
        .toContainEqual(expect.objectContaining({ ownerAgentId: 'billy', locus: 'disc-4pc' }))
    })

    it('projects Anby Core, Mindscapes, King, and W-Engines without resource proxies', () => {
      const base = createPreparedState({}, ['billy', 'anby', 'nekomata'], 0)
      const prepared = agent(calculateParty(base)!, 'anby')

      expect(metric(prepared, 'impact').values).toEqual({
        initial: 193.12, combat: 193.12, fully: 220.32,
      })
      expect(metric(prepared, 'energyRegen').values.initial).toBe(1.2)
      expect(metric(prepared, 'energyRegen').values.combat).toBeCloseTo(1.8)
      expect(metric(prepared, 'energyRegen').values.fully).toBeCloseTo(1.8)
      expect(metric(prepared, 'critRate').gauge).toMatchObject({
        current: 29, threshold: 50, outputValue: 15,
      })
      expect(action(prepared, 'anbyThunderboltDaze').values.fully).toBe(70)
      expect(action(prepared, 'anbySpecialDaze').values.fully).toBe(70)
      expect(action(prepared, 'anbyExSpecialDaze').values.fully).toBe(80)
      expect(action(prepared, 'anbyBasicDmg').values.fully).toBe(75)
      expect(action(prepared, 'anbyThunderboltDmg').values.fully).toBe(105)
      expect(action(prepared, 'anbyDashDmg').values.fully).toBe(75)
      expect(prepared.operations).toEqual([])

      const shockstar = agent(calculateParty(
        selectMain(
          selectDisc(
            selectDisc(base, 'anby', 'twoPiece', 'swingJazz'),
            'anby', 'fourPiece', 'shockstar',
          ),
          'anby', 'slot4', 'atkPct',
        ),
      )!, 'anby')
      expect(action(shockstar, 'anbyBasicDaze').breakdown.fully)
        .toContainEqual(expect.objectContaining({
          label: 'Shockstar Disco', ownerAgentId: 'anby', amount: 20,
        }))
      expect(action(shockstar, 'anbyThunderboltDaze').values.fully
        - metric(shockstar, 'dazeBonus').values.fully).toBe(84)
      expect(action(shockstar, 'anbyThunderboltDaze')).toMatchObject({
        baseActionId: 'anbyBasicDaze',
      })
      expect(action(shockstar, 'anbyDashDodgeDaze').breakdown.fully)
        .toContainEqual(expect.objectContaining({
          label: 'Shockstar Disco', ownerAgentId: 'anby', amount: 20,
        }))

      const invested = agent(calculateParty(
        setSubstat(base, 'anby', 'critRate', 9),
      )!, 'anby')
      expect(metric(invested, 'critRate').gauge).toMatchObject({
        threshold: 50, outputValue: 30,
      })
      expect(metric(invested, 'critRate').gauge?.current).toBeCloseTo(50.6)

      const demaraState = setRefinement(
        selectEngine(base, 'anby', 'demaraBatteryMarkII'),
        'anby',
        1,
      )
      const demara = agent(calculateParty(demaraState)!, 'anby')
      expect(metric(demara, 'dmgBonus').values).toEqual({
        initial: 30, combat: 45, fully: 45,
      })
      expect(metric(demara, 'dmgBonus').breakdown.combat)
        .toContainEqual(expect.objectContaining({
          label: 'Demara Battery Mark II', ownerAgentId: 'anby', amount: 15,
        }))
      expect(demara.metrics.find(({ id }) => id === 'energyRegen')).toBeUndefined()
      expect(demara.operations).toEqual([])

      const restrained = agent(calculateParty(
        selectEngine(base, 'anby', 'restrained'),
      )!, 'anby')
      expect(action(restrained, 'anbyBasicDmg').values.fully
        - metric(restrained, 'dmgBonus').values.fully).toBe(75)
      expect(action(restrained, 'anbyThunderboltDaze').values.fully
        - metric(restrained, 'dazeBonus').values.fully).toBe(94)

      const m2 = agent(calculateParty(withMindscape(base, 'anby', 2))!, 'anby')
      expect(action(m2, 'anbyThunderboltDmg').breakdown.fully)
        .toContainEqual(expect.objectContaining({
          label: 'Mindscape', detail: 'M2 · Against Stunned target', amount: 30,
        }))
      expect(action(m2, 'anbyExSpecialDaze').breakdown.fully)
        .toContainEqual(expect.objectContaining({
          label: 'Mindscape', detail: 'M2 · Against non-Stunned target', amount: 10,
        }))
      expect(m2.actionModifiers.map(({ id }) => id)).not.toContain('anbyBasicDmg')
      expect(m2.actionModifiers.map(({ id }) => id)).not.toContain('anbyDashDmg')

      const steam = agent(calculateParty(
        selectEngine(base, 'anby', 'steamOven'),
      )!, 'anby')
      expect(metric(steam, 'energyRegen').breakdown.initial)
        .toContainEqual(expect.objectContaining({
          label: 'Steam Oven', ownerAgentId: 'anby', locus: 'w-engine',
          display: { value: 50, unit: '%', decimals: 0 },
        }))
      expect(metric(steam, 'impact').values.fully)
        .toBeGreaterThan(metric(steam, 'impact').values.combat)

      const precious = agent(calculateParty(
        selectEngine(base, 'anby', 'preciousFossilizedCore'),
      )!, 'anby')
      expect(metric(precious, 'dazeBonus').breakdown.fully)
        .toContainEqual(expect.objectContaining({
          label: 'Precious Fossilized Core', ownerAgentId: 'anby', amount: 32,
        }))

      const m0 = agent(calculateParty(withMindscape(base, 'anby', 0))!, 'anby')
      expect(m0.actionModifiers.find(({ id }) => id === 'anbyBasicDmg')).toBeUndefined()
      expect(action(m0, 'anbyThunderboltDaze').values.fully).toBe(70)
      expect(m0.operations).toEqual([])
    })

    it('delivers Trigger Core/M2 and Astra M4 only through Anby compatible consumers', () => {
      const noTrigger = agent(calculateParty(
        createPreparedState({}, ['billy', 'anby', 'nekomata'], 0),
      )!, 'anby')
      expect(noTrigger.metrics.find(({ id }) => id === 'stunDmgMultiplier')).toBeUndefined()

      const triggerM0State = withMindscape(
        createPreparedState({}, ['billy', 'anby', 'trigger'], 0),
        'trigger',
        0,
      )
      const triggerM0 = agent(calculateParty(triggerM0State)!, 'anby')
      expect(metric(triggerM0, 'stunDmgMultiplier').breakdown.fully)
        .toContainEqual(expect.objectContaining({
          label: 'Core Passive', ownerAgentId: 'trigger', amount: 35,
        }))
      expect(metric(triggerM0, 'critDmg').breakdown.fully)
        .not.toContainEqual(expect.objectContaining({
          label: 'Mindscape', ownerAgentId: 'trigger',
        }))

      const triggerM2 = agent(calculateParty(
        withMindscape(triggerM0State, 'trigger', 2),
      )!, 'anby')
      expect(metric(triggerM2, 'stunDmgMultiplier').breakdown.fully)
        .toContainEqual(expect.objectContaining({
          label: 'Core Passive', ownerAgentId: 'trigger', amount: 55,
        }))
      expect(metric(triggerM2, 'critDmg').breakdown.fully)
        .toContainEqual(expect.objectContaining({
          label: 'Mindscape', detail: 'M2 · 4 stacks', ownerAgentId: 'trigger', amount: 24,
        }))

      const astraM0State = withMindscape(
        createPreparedState({}, ['billy', 'anby', 'astraYao'], 0),
        'astraYao',
        0,
      )
      expect(agent(calculateParty(astraM0State)!, 'anby').operations).toEqual([])
      const astraM4 = agent(calculateParty(
        withMindscape(astraM0State, 'astraYao', 4),
      )!, 'anby')
      expect(astraM4.operations).toContainEqual(expect.objectContaining({
        id: 'nextQuickAssistDaze', value: 50,
        source: expect.objectContaining({ ownerAgentId: 'astraYao' }),
      }))
    })

    it('applies duplicate Ice-Jade squad DMG once while retaining equal origins', () => {
      let state = createPreparedState({}, ['harumasa', 'qingyi', 'lighter'], 0)
      state = selectEngine(state, 'lighter', 'iceJadeTeapot')
      const result = metric(agent(calculateParty(state)!, 'harumasa'), 'dmgBonus')
      const iceJade = result.breakdown.fully.filter(({ label }) => label === 'Ice-Jade Teapot')
      expect(iceJade).toHaveLength(2)
      expect(iceJade.filter(({ notation }) => notation === 'equal-nonstack-origin'))
        .toHaveLength(1)
      expect(iceJade.reduce((sum, item) => sum + item.amount, 0)).toBe(20)

      const triggerHeld = metric(agent(calculateParty(selectEngine(
        createPreparedState({}, ['harumasa', 'trigger', 'lucia'], 0),
        'trigger',
        'iceJadeTeapot',
      ))!, 'harumasa'), 'dmgBonus')
      expect(triggerHeld.breakdown.fully).toContainEqual(expect.objectContaining({
        label: 'Ice-Jade Teapot', ownerAgentId: 'trigger', amount: 20,
      }))

      const blazingContrast = metric(agent(calculateParty(selectEngine(
        createPreparedState({}, ['harumasa', 'trigger', 'lucia'], 0),
        'trigger',
        'blazingLaurel',
      ))!, 'harumasa'), 'critDmg')
      expect(blazingContrast.breakdown.fully).not.toContainEqual(expect.objectContaining({
        label: 'Blazing Laurel', ownerAgentId: 'trigger',
      }))
    })

    it('projects Caesar through Focus, regular DMG Bonus, action, and equipment consumers without survival rows', () => {
      const base = createPreparedState({}, ['corin', 'caesar', 'astraYao'], 0)
      const baseResult = calculateParty(base)!
      const caesar = agent(baseResult, 'caesar')
      const corin = agent(baseResult, 'corin')

      expect(metric(caesar, 'impact').values).toMatchObject({
        initial: expect.closeTo(174.66),
        combat: expect.closeTo(174.66),
        fully: expect.closeTo(209.592),
      })
      expect(caesar.metrics.map(({ label }) => label)).not.toContain('Shield Effect')
      expect(caesar.operations.map(({ id }) => id)).not.toContain('caesarRadiantAegis')
      expect(metric(corin, 'atk').breakdown.fully).toContainEqual(expect.objectContaining({
        label: 'Core Passive', ownerAgentId: 'caesar', amount: 1000,
      }))
      expect(metric(corin, 'dmgBonus').breakdown.fully).toEqual(expect.arrayContaining([
        expect.objectContaining({
          label: 'Additional Ability', ownerAgentId: 'caesar', amount: 25,
        }),
        expect.objectContaining({
          label: 'Tusks of Fury', ownerAgentId: 'caesar', amount: 18,
        }),
        expect.objectContaining({
          label: 'Proto Punk', ownerAgentId: 'caesar', amount: 15,
        }),
      ]))
      expect(baseResult.agents.flatMap(({ metrics }) => metrics.map(({ id }) => id)))
        .not.toContain('dmgTaken')
      expect(action(caesar, 'caesarShieldedUltimate').values.fully).toBe(112)

      const sheerParty = calculateParty(createPreparedState(
        {}, ['yixuan', 'caesar', 'lycaon'], 0,
      ))!
      expect(metric(agent(sheerParty, 'yixuan'), 'dmgBonus').breakdown.fully)
        .toContainEqual(expect.objectContaining({
          label: 'Additional Ability', ownerAgentId: 'caesar', amount: 25,
        }))
      expect(agent(sheerParty, 'lycaon').metrics
        .flatMap(({ breakdown }) => breakdown.fully))
        .not.toContainEqual(expect.objectContaining({
          label: 'Additional Ability', ownerAgentId: 'caesar',
        }))

      const anomalyParty = calculateParty(createPreparedState(
        {}, ['grace', 'caesar', 'anby'], 0,
      ))!
      expect(metric(agent(anomalyParty, 'grace'), 'dmgBonus').breakdown.fully)
        .toContainEqual(expect.objectContaining({
          label: 'Additional Ability', ownerAgentId: 'caesar', amount: 25,
        }))
      expect(anomalyParty.agents.flatMap(({ metrics }) => metrics.map(({ id }) => id)))
        .not.toContain('dmgTaken')

      const m1 = calculateParty(withMindscape(base, 'caesar', 1))!
      expect(metric(agent(m1, 'corin'), 'resReduction').breakdown.fully)
        .toContainEqual(expect.objectContaining({
          label: 'Mindscape', detail: 'M1 · While Radiant Aegis is active',
          ownerAgentId: 'caesar', amount: 15,
        }))

      const m2 = calculateParty(withMindscape(base, 'caesar', 2))!
      const m2AtkSources = metric(agent(m2, 'corin'), 'atk').breakdown.fully
        .filter(({ ownerAgentId }) => ownerAgentId === 'caesar')
      expect(m2AtkSources).toContainEqual(expect.objectContaining({
        label: 'Mindscape', detail: 'M2 · Radiant Aegis ATK replacement', amount: 1500,
      }))
      expect(m2AtkSources).not.toContainEqual(expect.objectContaining({ amount: 1000 }))

      const m3 = agent(calculateParty(withMindscape(base, 'caesar', 3))!, 'caesar')
      expect(metric(m3, 'impact').values.fully).toBeCloseTo(213.0852)
      expect(action(m3, 'caesarShieldedUltimate').values.fully).toBe(122)
      const m5 = agent(calculateParty(withMindscape(base, 'caesar', 5))!, 'caesar')
      expect(metric(m5, 'impact').values.fully).toBeCloseTo(216.5784)
      expect(action(m5, 'caesarShieldedUltimate').values.fully).toBe(132)

      const m6 = agent(calculateParty(withMindscape(base, 'caesar', 6))!, 'caesar')
      expect(action(m6, 'caesarM6ActionsCritRate').values.fully).toBe(100)
      expect(action(m6, 'caesarM6Actions').outcomes).toContainEqual(
        actionForm('EX Special Attack', 'Overpowered Shield Bash'),
      )
      expect(action(m6, 'caesarM6Actions').values.fully
        - metric(m6, 'dmgBonus').values.fully).toBe(50)
      expect(m6.operations).toContainEqual(expect.objectContaining({
        id: 'caesarPrimaryTargetFollowup', value: 50,
        unit: '% original action DMG',
      }))

      const inactive = calculateParty(createPreparedState(
        {}, ['zhuYuan', 'caesar', 'billy'], 0,
      ))!
      expect(metric(agent(inactive, 'zhuYuan'), 'dmgBonus').breakdown.fully)
        .not.toContainEqual(expect.objectContaining({
          label: 'Additional Ability', ownerAgentId: 'caesar',
        }))
      expect(metric(agent(inactive, 'caesar'), 'dmgBonus').breakdown.fully)
        .not.toContainEqual(expect.objectContaining({
          label: 'Additional Ability', ownerAgentId: 'caesar',
        }))
      const defensiveAssist = calculateParty(createPreparedState(
        {}, ['zhuYuan', 'caesar', 'anby'], 0,
      ))!
      expect(metric(agent(defensiveAssist, 'zhuYuan'), 'dmgBonus').breakdown.fully)
        .toContainEqual(expect.objectContaining({
          label: 'Additional Ability', ownerAgentId: 'caesar', amount: 25,
        }))
      const sameFaction = calculateParty(createPreparedState(
        {}, ['corin', 'caesar', 'pulchra'], 0,
      ))!
      expect(metric(agent(sameFaction, 'corin'), 'dmgBonus').breakdown.fully)
        .toContainEqual(expect.objectContaining({
          label: 'Additional Ability', ownerAgentId: 'caesar', amount: 25,
        }))

      const originalW1 = agent(calculateParty(setRefinement(
        selectEngine(base, 'caesar', 'originalTransmorpher'),
        'caesar',
        1,
      ))!, 'caesar')
      expect(metric(originalW1, 'impact').values).toMatchObject({
        initial: expect.closeTo(152.52),
        combat: expect.closeTo(152.52),
        fully: expect.closeTo(198.276),
      })
      expect(originalW1.metrics.find(({ id }) => id === 'maxHp')).toBeUndefined()
      const originalW5 = agent(calculateParty(setRefinement(
        selectEngine(base, 'caesar', 'originalTransmorpher'),
        'caesar',
        5,
      ))!, 'caesar')
      expect(metric(originalW5, 'impact').values.fully).toBeCloseTo(207.4272)

      const hellfire = agent(calculateParty(selectEngine(
        base, 'caesar', 'hellfireGears',
      ))!, 'caesar')
      expect(hellfire.metrics.find(({ id }) => id === 'energyRegen')).toBeUndefined()
      expect(metric(hellfire, 'impact').breakdown.fully)
        .not.toContainEqual(expect.objectContaining({
          label: 'Hellfire Gears', detail: 'W1', amount: expect.closeTo(17.466),
        }))
      const demara = agent(calculateParty(selectEngine(
        base, 'caesar', 'demaraBatteryMarkII',
      ))!, 'caesar')
      expect(demara.metrics.find(({ id }) => id === 'energyRegen')).toBeUndefined()
      expect(metric(demara, 'dmgBonus').breakdown.fully)
        .not.toContainEqual(expect.objectContaining({
          label: 'Demara Battery Mark II', ownerAgentId: 'caesar',
        }))
    })

    it('keeps Ye target replacement raw, local, and separately clamped', () => {
      const base = createPreparedState({}, ['yeShunguang', 'billy', 'anby'], 0)
      const defaultYe = metric(agent(calculateParty(base)!, 'yeShunguang'), 'stunDmgMultiplier')
      expect(defaultYe.values).toEqual({ initial: 0, combat: 0, fully: 50 })
      expect(defaultYe.breakdown.fully).toContainEqual(expect.objectContaining({
        label: 'Target Stun DMG Multiplier', detail: 'Above 100%',
        locus: 'target', amount: 50,
      }))
      expect(defaultYe.gauge).toMatchObject({
        current: 50, cap: 110, outputLabel: 'Veil Vulnerability', outputValue: 50,
      })

      expect(metric(agent(calculateParty(
        base, { targetStunDmgMultiplier: 125 },
      )!, 'yeShunguang'), 'stunDmgMultiplier').gauge).toMatchObject({
        current: 25, outputValue: 25,
      })
      expect(metric(agent(calculateParty(
        base, { targetStunDmgMultiplier: 200 },
      )!, 'yeShunguang'), 'stunDmgMultiplier').gauge).toMatchObject({
        current: 100, outputValue: 100,
      })

      const triggerState = createPreparedState(
        {}, ['yeShunguang', 'trigger', 'anby'], 0,
      )
      const triggerResult = calculateParty(
        triggerState, { targetStunDmgMultiplier: 200 },
      )!
      expect(metric(agent(triggerResult, 'yeShunguang'), 'stunDmgMultiplier'))
        .toMatchObject({
          values: { initial: 0, combat: 0, fully: 135 },
          gauge: { current: 135, cap: 110, outputValue: 110 },
        })
      expect(metric(agent(triggerResult, 'trigger'), 'stunDmgMultiplier').values.fully)
        .toBe(35)
      expect(metric(agent(triggerResult, 'anby'), 'stunDmgMultiplier').values.fully)
        .toBe(35)

      const m4 = calculateParty(
        withMindscape(triggerState, 'yeShunguang', 4),
        { targetStunDmgMultiplier: 200 },
      )!
      expect(metric(agent(m4, 'yeShunguang'), 'stunDmgMultiplier').gauge)
        .toMatchObject({ current: 135, cap: 200, outputValue: 135 })

      const formulaScoped = calculateParty(withMindscape(
        createPreparedState({}, ['yeShunguang', 'trigger', 'astraYao'], 0),
        'trigger',
        2,
      ))!
      expect(metric(agent(formulaScoped, 'yeShunguang'), 'critDmg').breakdown.fully)
        .toContainEqual(expect.objectContaining({
          ownerAgentId: 'trigger', detail: 'M2 · 4 stacks', amount: 24,
        }))
      expect(agent(formulaScoped, 'astraYao').metrics.map(({ id }) => id))
        .not.toEqual(expect.arrayContaining(['critDmg', 'stunDmgMultiplier']))
    })

    it('projects Ye Unity, exact Mindscapes, and complete selected equipment clauses', () => {
      const base = createPreparedState({}, ['yeShunguang', 'billy', 'anby'], 0)
      const m0 = agent(calculateParty(base)!, 'yeShunguang')
      expect(metric(m0, 'critRate').values).toEqual({
        initial: 19.4, combat: 49.4, fully: 69.4,
      })
      expect(metric(m0, 'dmgBonus').breakdown.combat).toContainEqual(
        expect.objectContaining({ ownerAgentId: 'yeShunguang', locus: 'core', amount: 25 }),
      )
      expect(metric(m0, 'resIgnore').values).toEqual({
        initial: 0, combat: 20, fully: 20,
      })
      expect(metric(m0, 'dmgBonus').breakdown.fully).toContainEqual(
        expect.objectContaining({ label: 'Cloudcleave Radiance', amount: 25 }),
      )
      expect(metric(m0, 'critDmg').breakdown.fully).toContainEqual(
        expect.objectContaining({ label: 'Cloudcleave Radiance', amount: 25 }),
      )
      expect(metric(m0, 'critRate').breakdown.fully).toContainEqual(
        expect.objectContaining({ label: 'White Water Ballad', amount: 20 }),
      )

      const astralTwoState = selectDisc(selectDisc(
        base, 'yeShunguang', 'fourPiece', 'hormonePunk',
      ), 'yeShunguang', 'twoPiece', 'astralVoice')
      const astralTwoAtk = metric(
        agent(calculateParty(astralTwoState)!, 'yeShunguang'), 'atk',
      )
      expect(astralTwoAtk.values.initial).toBeCloseTo(2837.5)
      expect(astralTwoAtk.breakdown.initial.filter(
        ({ label, detail }) => label === 'Astral Voice' && detail === '2-piece',
      )).toEqual([expect.objectContaining({ amount: expect.closeTo(168.1) })])

      const pufferFourState = selectDisc(
        createPreparedState({}, ['yeShunguang', 'dialyn', 'anby'], 0),
        'yeShunguang', 'fourPiece', 'pufferElectro',
      )
      const pufferFourPen = metric(
        agent(calculateParty(pufferFourState)!, 'yeShunguang'), 'penRatio',
      )
      expect(pufferFourPen.values).toEqual({ initial: 8, combat: 8, fully: 8 })
      expect(pufferFourPen.breakdown.initial.filter(
        ({ label, detail }) => label === 'Puffer Electro' && detail === '2-piece',
      )).toEqual([expect.objectContaining({ amount: 8 })])

      const pufferTwoState = selectDisc(selectDisc(
        base, 'yeShunguang', 'fourPiece', 'woodpecker',
      ), 'yeShunguang', 'twoPiece', 'pufferElectro')
      expect(metric(
        agent(calculateParty(pufferTwoState)!, 'yeShunguang'), 'penRatio',
      ).values).toEqual({ initial: 8, combat: 8, fully: 8 })

      const m1 = agent(calculateParty(withMindscape(base, 'yeShunguang', 1))!, 'yeShunguang')
      expect(metric(m1, 'dmgBonus').values.combat - metric(m0, 'dmgBonus').values.combat)
        .toBe(10)
      expect(metric(m1, 'defIgnore').values).toEqual({
        initial: 0, combat: 20, fully: 20,
      })

      const m2 = agent(calculateParty(withMindscape(base, 'yeShunguang', 2))!, 'yeShunguang')
      const enlightened = action(m2, 'yeEnlightenedActionsDefIgnore')
      expect(enlightened.values.fully - metric(m2, 'defIgnore').values.fully).toBe(40)
      expect(enlightened.outcomes).toEqual([
        sourceLocalAction(
          'EX Special Attack: Enlightened Mind - Soaring Light',
          'EX Special Attack',
        ),
        sourceLocalAction('Ultimate: Cleaving Heavens', 'Ultimate'),
      ])

      const street = agent(calculateParty(selectEngine(
        base, 'yeShunguang', 'streetSuperstar',
      ))!, 'yeShunguang')
      expect(action(street, 'yeUltimateDmg').values.fully
        - metric(street, 'dmgBonus').values.fully).toBe(72)
      expect(street.operations).toEqual([])
      expect(agent(calculateParty(
        withMindscape(base, 'yeShunguang', 6),
      )!, 'yeShunguang').operations).toEqual([])
    })
})
