import { describe, expect, it } from 'vitest'
import { calculateParty } from './calculate'
import { resolveProviderEffects, resolveSeedVanguard } from './provider-effects'
import { createPreparedState, workbenchReducer } from './state'
import {
  action,
  agent,
  metric,
  selectEngine,
  selectMain,
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
        actions: ['EX Special Attack', 'Ultimate'],
        metricId: 'resIgnore',
        values: { initial: 0, combat: 0, fully: 15 },
      })
      expect(action(m4, 'mindscapeCloudShaper').values.fully).toBeCloseTo(299)
      expect(metric(m6, 'sheerDmgBonus').values.fully).toBe(30)
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
        actions: ['Basic Attack', 'Ultimate'],
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
      expect(basic).toMatchObject({ tag: 'aftershock', actions: [] })
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
      expect(action(m2, 'cissiaSerpent').values.fully).toBe(172)
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
})
