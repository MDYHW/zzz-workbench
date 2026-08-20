import { describe, expect, it } from 'vitest'
import { calculateParty } from './calculate'
import { resolveProviderEffects, resolveSeedVanguardForState } from './provider-effects'
import { VERTICAL_VALUES, type AgentId } from './content'
import { createPreparedState, isCompleteWorkbench } from './state'
import {
  action,
  agent,
  metric,
  selectDisc,
  selectEngine,
  selectMain,
  setRefinement,
  setSubstat,
  sourceLabels,
  withMindscape,
  withSetup,
} from './calculate.test-support'

describe('calculateParty mechanisms', () => {
  it('projects Soukaku’s capped Core ATK once to Focus and retains exact Ice party consumers', () => {
    const prepared = createPreparedState({}, ['ellen', 'soukaku', 'lycaon'], 0)
    expect(isCompleteWorkbench(prepared)).toBe(true)
    const party = calculateParty(prepared)!
    const ellen = agent(party, 'ellen')
    const soukaku = agent(party, 'soukaku')
    expect(metric(ellen, 'atk').breakdown.fully).toContainEqual(expect.objectContaining({
      ownerAgentId: 'soukaku', locus: 'core', amount: 1000,
    }))
    expect(metric(soukaku, 'atk').breakdown.fully).not.toContainEqual(expect.objectContaining({
      ownerAgentId: 'soukaku', locus: 'core', amount: 1000,
    }))
    expect(metric(soukaku, 'atk').gauge).toMatchObject({ outputValue: 1000, outputCap: 1000 })
    expect(metric(soukaku, 'atk').gauge?.current).toBeCloseTo(2507.3)
    expect(metric(ellen, 'dmgBonus').values.fully).toBeGreaterThanOrEqual(50)
    expect(metric(ellen, 'resReduction').values.fully).toBe(35)
    expect(agent(party, 'lycaon').metrics.find(({ id }) => id === 'resIgnore')).toBeUndefined()
  })

  it('keeps Ellen’s Deep Sea CRIT balance below cap until finite investment and M1', () => {
    const prepared = createPreparedState({}, ['ellen', 'soukaku', 'lycaon'], 0)
    expect(prepared.slots[0].setup.mains.slot4).toBe('critDmg')
    const party = calculateParty(prepared)!
    const ellen = metric(agent(party, 'ellen'), 'critRate')
    expect(ellen.values.initial).toBe(51.4)
    expect(ellen.values.combat).toBe(71.4)
    const invested = calculateParty(setSubstat(prepared, 'ellen', 'critRate', 8))!
    expect(metric(agent(invested, 'ellen'), 'critRate').values.combat).toBeCloseTo(90.6)
    const mindscapeOne = calculateParty(withMindscape(
      setSubstat(prepared, 'ellen', 'critRate', 8), 'ellen', 1,
    ))!
    expect(metric(agent(mindscapeOne, 'ellen'), 'critRate').values.combat).toBe(100)
  })

  it('delivers Lucy’s capped Core once to every recipient and preserves Kaboom origins without a personal CRIT direction', () => {
    const state = createPreparedState({}, ['soldier11', 'soukaku', 'lucy'], 0)
    const result = calculateParty(state)!
    const lucy = agent(result, 'lucy')

    expect(metric(lucy, 'atk').gauge).toMatchObject({
      basisLabel: 'Initial ATK', current: 2495.4, outputValue: 600, outputCap: 600,
    })
    for (const agentId of ['soldier11', 'soukaku', 'lucy'] as const) {
      expect(metric(agent(result, agentId), 'atk').breakdown.fully)
        .toContainEqual(expect.objectContaining({ ownerAgentId: 'lucy', locus: 'core', amount: 600 }))
    }
    expect(lucy.metrics.map(({ id }) => id)).not.toContain('critDmg')

    const kaboom = metric(agent(result, 'soldier11'), 'atk').breakdown.fully
      .filter(({ label }) => label === 'Kaboom the Cannon')
    expect(kaboom).toHaveLength(2)
    expect(kaboom.filter(({ notation }) => notation === 'equal-nonstack-origin')).toHaveLength(1)
    expect(kaboom.reduce((total, { amount }) => total + amount, 0))
      .toBeCloseTo(metric(agent(result, 'soldier11'), 'atk').values.initial * .16)
  })

  it('keeps Lucy’s Initial-ATK Core capped across every Mindscape tier and adds M4 CRIT DMG only to current recipients', () => {
    const base = createPreparedState({}, ['soldier11', 'lighter', 'lucy'], 0)
    for (const mindscape of [0, 1, 2, 3, 4, 5, 6] as const) {
      const result = calculateParty(withMindscape(base, 'lucy', mindscape))!
      expect(metric(agent(result, 'lucy'), 'atk').gauge).toMatchObject({ outputValue: 600, outputCap: 600 })
    }
    const m0 = agent(calculateParty(withMindscape(base, 'lucy', 0))!, 'soldier11')
    const m4 = agent(calculateParty(withMindscape(base, 'lucy', 4))!, 'soldier11')
    expect(metric(m4, 'critDmg').values.fully - metric(m0, 'critDmg').values.fully).toBe(10)
    expect(agent(calculateParty(withMindscape(base, 'lucy', 4))!, 'lucy').metrics.map(({ id }) => id))
      .not.toContain('critDmg')
  })

  it('composes Ellen’s combat and fully enabled ATK percentages from current Initial ATK', () => {
    const full = agent(calculateParty(createPreparedState({}, ['ellen', 'soukaku', 'lycaon'], 0))!, 'ellen')
    const fullAtk = metric(full, 'atk')
    expect(fullAtk.values.combat - fullAtk.values.initial).toBeCloseTo(fullAtk.values.initial * .27)

    const nonLimited = createPreparedState({ ellen: 'nonLimited' }, ['ellen', 'soukaku', 'lycaon'], 0)
    const nonLimitedAtk = metric(agent(calculateParty(nonLimited)!, 'ellen'), 'atk')
    const brimstone = nonLimitedAtk.breakdown.fully.find(({ locus }) => locus === 'w-engine')
    const woodpecker = nonLimitedAtk.breakdown.combat.find(({ locus }) => locus === 'disc-4pc')
    expect(brimstone?.amount).toBeCloseTo(nonLimitedAtk.values.initial * .28)
    expect(nonLimitedAtk.breakdown.combat)
      .not.toContainEqual(expect.objectContaining({ label: 'The Brimstone' }))
    expect(woodpecker?.amount).toBeCloseTo(nonLimitedAtk.values.initial * .27)

    let contextual = createPreparedState({}, ['ellen', 'dialyn', 'soukaku'], 0)
    contextual = selectDisc(contextual, 'ellen', 'fourPiece', 'pufferElectro')
    const contextualAtk = metric(agent(calculateParty(contextual)!, 'ellen'), 'atk')
    expect(contextualAtk.breakdown.fully).toContainEqual(expect.objectContaining({
      ownerAgentId: 'ellen', locus: 'disc-4pc', amount: contextualAtk.values.initial * .15,
    }))
  })

  it('qualifies Ellen through a Stun and keeps Deep Sea and Myriad scopes broad after their triggers', () => {
    const withStun = calculateParty(createPreparedState({}, ['ellen', 'dialyn', 'panYinhu'], 0))!
    expect(metric(agent(withStun, 'ellen'), 'dmgBonus').breakdown.fully)
      .toContainEqual(expect.objectContaining({ ownerAgentId: 'ellen', locus: 'additional', amount: 30 }))
    const unqualified = calculateParty(createPreparedState({}, ['ellen', 'panYinhu', 'astraYao'], 0))!
    expect(metric(agent(unqualified, 'ellen'), 'dmgBonus').breakdown.fully)
      .not.toContainEqual(expect.objectContaining({ ownerAgentId: 'ellen', locus: 'additional' }))
    let myriad = selectEngine(createPreparedState({}, ['ellen', 'soukaku', 'lycaon'], 0), 'ellen', 'myriadEclipse')
    myriad = selectMain(myriad, 'ellen', 'slot5', 'iceDmg')
    myriad = selectDisc(myriad, 'ellen', 'twoPiece', 'polarMetal')
    expect(metric(agent(calculateParty(myriad)!, 'ellen'), 'defIgnore').values.fully).toBe(25)
  })

  it('projects Ellen’s action CRIT DMG and Steel back-attack scope without widening common values', () => {
    const base = createPreparedState({}, ['ellen', 'soukaku', 'lycaon'], 0)
    const m0 = agent(calculateParty(base)!, 'ellen')
    expect(action(m0, 'ellenCoreCritDmg').values.fully - metric(m0, 'critDmg').values.fully)
      .toBe(148)
    const m2 = agent(calculateParty(withMindscape(base, 'ellen', 2))!, 'ellen')
    expect(action(m2, 'ellenExCritDmg').values.fully - metric(m2, 'critDmg').values.fully)
      .toBe(60)
    const steel = agent(calculateParty(selectEngine(base, 'ellen', 'steelCushion'))!, 'ellen')
    expect(action(steel, 'ellenBackAttack').values.fully
      - metric(steel, 'dmgBonus').values.fully).toBe(25)
    const cordis = agent(calculateParty(selectEngine(base, 'ellen', 'cordisGermina'))!, 'ellen')
    expect(metric(cordis, 'defIgnore').values.fully).toBe(0)
    expect(action(cordis, 'ellenBasicUltimateDef Ignore').values.fully).toBe(20)
  })

  it('projects Weeping’s automatic Energy only to Soukaku and attributes her M4 RES reduction to Mindscape', () => {
    let state = createPreparedState({}, ['ellen', 'soukaku', 'lycaon'], 0)
    state = selectEngine(state, 'soukaku', 'weepingCradle')
    const weeping = calculateParty(state)!
    expect(metric(agent(weeping, 'soukaku'), 'energyRegen').values.combat).toBeCloseTo(1.56 * 1.8 + .6)
    const mindscape = calculateParty(withMindscape(state, 'soukaku', 4))!
    expect(metric(agent(mindscape, 'ellen'), 'resReduction').breakdown.fully)
      .toContainEqual(expect.objectContaining({ ownerAgentId: 'soukaku', locus: 'mindscape', amount: 10 }))
  })

  it('scales Soukaku’s Core below cap and keeps party qualification routes exact', () => {
    let belowCap = createPreparedState({}, ['ellen', 'soukaku', 'lycaon'], 0)
    belowCap = selectDisc(belowCap, 'soukaku', 'twoPiece', 'swingJazz')
    const belowCapResult = calculateParty(belowCap)!
    const soukaku = agent(belowCapResult, 'soukaku')
    const expected = metric(soukaku, 'atk').gauge!.current * .4
    expect(metric(soukaku, 'atk').gauge!.outputValue).toBeCloseTo(expected)
    const delivered = metric(agent(belowCapResult, 'ellen'), 'atk').breakdown.fully
      .find(({ ownerAgentId, locus }) => ownerAgentId === 'soukaku' && locus === 'core')
    expect(delivered?.amount).toBeCloseTo(expected)

    const additional = (party: Parameters<typeof createPreparedState>[1], id: 'ellen' | 'soukaku') => {
      const context = resolveProviderEffects(createPreparedState({}, party, 0)).contexts
        .find(({ agentId }) => agentId === id)
      if (context?.agentId !== id) throw new Error(`Missing ${id} context`)
      return context.additionalActive
    }
    expect(additional(['ellen', 'dialyn', 'panYinhu'], 'ellen')).toBe(true)
    expect(additional(['ellen', 'soukaku', 'panYinhu'], 'ellen')).toBe(true)
    expect(additional(['ellen', 'corin', 'panYinhu'], 'ellen')).toBe(true)
    expect(additional(['ellen', 'astraYao', 'panYinhu'], 'ellen')).toBe(false)
    expect(additional(['ellen', 'soukaku', 'panYinhu'], 'soukaku')).toBe(true)
    expect(additional(['manato', 'soukaku', 'panYinhu'], 'soukaku')).toBe(false)
  })

  it('keeps duplicate Kaboom squad ATK at one exact-identity contribution', () => {
    let state = createPreparedState({}, ['ellen', 'astraYao', 'soukaku'], 0)
    state = selectEngine(state, 'astraYao', 'kaboom')
    state = setRefinement(state, 'astraYao', 5)
    const atk = metric(agent(calculateParty(state)!, 'ellen'), 'atk')
    const kaboom = atk.breakdown.fully.filter(({ label }) => label === 'Kaboom the Cannon')
    expect(kaboom.reduce((total, { amount }) => total + amount, 0))
      .toBeCloseTo(atk.values.initial * .16)
  })

  it('gates Result on every required setup selection', () => {
    const prepared = createPreparedState()
    const incomplete = [
      withSetup(prepared, 'yixuan', (setup) => ({ ...setup, engineId: null })),
      withSetup(prepared, 'yixuan', (setup) => ({ ...setup, refinement: null })),
      withSetup(prepared, 'dialyn', (setup) => ({ ...setup, fourPieceId: null })),
      withSetup(prepared, 'lucia', (setup) => ({ ...setup, twoPieceId: null })),
      withSetup(prepared, 'dialyn', (setup) => ({
        ...setup,
        mains: { ...setup.mains, slot6: null },
      })),
      withSetup(prepared, 'lucia', (setup) => ({
        ...setup,
        substats: { ...setup.substats, hpFlat: Number.NaN },
      })),
      withSetup(
        createPreparedState({}, ['yidhari', 'dialyn', 'lucia'], 0),
        'yidhari',
        (setup) => ({ ...setup, engineId: null }),
      ),
    ]

    for (const state of incomplete) expect(calculateParty(state)).toBeNull()
  })

  it('projects matching Attribute 2-piece sources through Attack and Rupture formulas', () => {
    const anbyState = selectDisc(
      createPreparedState({}, ['anbySoldier0', 'dialyn', 'lucia'], 0),
      'anbySoldier0',
      'twoPiece',
      'thunderMetal',
    )
    expect(metric(agent(calculateParty(anbyState)!, 'anbySoldier0'), 'dmgBonus')
      .breakdown.initial).toContainEqual(expect.objectContaining({
        label: 'Thunder Metal', locus: 'disc-2pc', amount: 10,
      }))

    const seedState = selectDisc(
      createPreparedState({}, ['seed', 'dialyn', 'lucia'], 0),
      'seed',
      'twoPiece',
      'thunderMetal',
    )
    expect(metric(agent(calculateParty(seedState)!, 'seed'), 'dmgBonus')
      .breakdown.initial).toContainEqual(expect.objectContaining({
        label: 'Thunder Metal', locus: 'disc-2pc', amount: 10,
      }))

    const cissiaState = selectDisc(
      createPreparedState({}, ['seed', 'cissia', 'anbySoldier0'], 0),
      'cissia',
      'twoPiece',
      'thunderMetal',
    )
    expect(metric(agent(calculateParty(cissiaState)!, 'cissia'), 'dmgBonus')
      .breakdown.initial).toContainEqual(expect.objectContaining({
        label: 'Thunder Metal', locus: 'disc-2pc', amount: 10,
      }))

    const yixuanState = selectDisc(
      createPreparedState({}, ['yixuan', 'dialyn', 'lucia'], 0),
      'yixuan',
      'twoPiece',
      'chaoticMetal',
    )
    expect(metric(agent(calculateParty(yixuanState)!, 'yixuan'), 'dmgBonus')
      .breakdown.initial).toContainEqual(expect.objectContaining({
        label: 'Chaotic Metal', locus: 'disc-2pc', amount: 10,
      }))

    const yidhariState = selectDisc(
      createPreparedState({}, ['yidhari', 'dialyn', 'lucia'], 0),
      'yidhari',
      'twoPiece',
      'polarMetal',
    )
    expect(metric(agent(calculateParty(yidhariState)!, 'yidhari'), 'dmgBonus')
      .breakdown.initial).toContainEqual(expect.objectContaining({
        label: 'Polar Metal', locus: 'disc-2pc', amount: 10,
      }))
  })

  it('projects the exact selected member of each same-effect relationship', () => {
    const anbyState = selectDisc(
      createPreparedState({}, ['anbySoldier0', 'dialyn', 'lucia'], 0),
      'anbySoldier0',
      'twoPiece',
      'hormonePunk',
    )
    expect(metric(agent(calculateParty(anbyState)!, 'anbySoldier0'), 'atk')
      .breakdown.initial).toContainEqual(expect.objectContaining({
        label: 'Hormone Punk', locus: 'disc-2pc',
        display: { value: 10, unit: '%', decimals: 0 },
      }))

    const seedState = selectDisc(
      createPreparedState({}, ['seed', 'dialyn', 'lucia'], 0),
      'seed',
      'twoPiece',
      'hormonePunk',
    )
    expect(metric(agent(calculateParty(seedState)!, 'seed'), 'atk')
      .breakdown.initial).toContainEqual(expect.objectContaining({
        label: 'Hormone Punk', locus: 'disc-2pc',
        display: { value: 10, unit: '%', decimals: 0 },
      }))

    const cissiaState = selectDisc(
      createPreparedState({}, ['seed', 'cissia', 'anbySoldier0'], 0),
      'cissia',
      'twoPiece',
      'hormonePunk',
    )
    expect(metric(agent(calculateParty(cissiaState)!, 'cissia'), 'atk')
      .breakdown.initial).toContainEqual(expect.objectContaining({
        label: 'Hormone Punk', locus: 'disc-2pc',
        display: { value: 10, unit: '%', decimals: 0 },
      }))

    const evelynState = selectDisc(
      createPreparedState({}, ['evelyn', 'dialyn', 'lucia'], 0),
      'evelyn',
      'twoPiece',
      'astralVoice',
    )
    expect(metric(agent(calculateParty(evelynState)!, 'evelyn'), 'atk')
      .breakdown.initial).toContainEqual(expect.objectContaining({
        label: 'Astral Voice', locus: 'disc-2pc', display: { value: 10, unit: '%', decimals: 0 },
      }))

    let juFufuState = createPreparedState({}, ['yixuan', 'panYinhu', 'juFufu'], 0)
    juFufuState = selectDisc(juFufuState, 'juFufu', 'fourPiece', 'swingJazz')
    juFufuState = selectDisc(juFufuState, 'juFufu', 'twoPiece', 'moonlight')
    juFufuState = selectMain(juFufuState, 'juFufu', 'slot4', 'atkPct')
    expect(metric(agent(calculateParty(juFufuState)!, 'juFufu'), 'energyRegen')
      .breakdown.initial).toContainEqual(expect.objectContaining({
        label: 'Moonlight Lullaby', locus: 'disc-2pc',
        display: { value: 20, unit: '%', decimals: 0 },
      }))
  })

  it('uses applied slot order only for output and keeps provider composition order-independent', () => {
    const baseline = calculateParty(createPreparedState())!
    const reordered = calculateParty(
      createPreparedState({}, ['lucia', 'dialyn', 'yixuan'], 2),
    )!

    expect(reordered.agents.map(({ agentId }) => agentId))
      .toEqual(['lucia', 'dialyn', 'yixuan'])
    for (const agentId of ['yixuan', 'dialyn', 'lucia'] as AgentId[]) {
      expect(agent(reordered, agentId)).toEqual(agent(baseline, agentId))
    }
  })

  it('places advanced stats in Initial and active passives on their earliest later surface', () => {
    const result = calculateParty(createPreparedState())!
    const yixuan = agent(result, 'yixuan')
    const dialyn = agent(result, 'dialyn')

    expect(sourceLabels(metric(yixuan, 'maxHp').breakdown.initial))
      .toContain('Qingming Birdcage · W1')
    expect(sourceLabels(metric(yixuan, 'critRate').breakdown.initial))
      .not.toContain('Qingming Birdcage · W1')
    expect(metric(yixuan, 'critRate').breakdown.combat).toContainEqual(
      expect.objectContaining({ label: 'Qingming Birdcage', detail: 'W1', amount: 20 }),
    )
    expect(sourceLabels(metric(dialyn, 'critRate').breakdown.initial))
      .toContain('Yesterday Calls · W1')
    expect(sourceLabels(metric(dialyn, 'energyRegen').breakdown.initial))
      .not.toContain('Yesterday Calls · W1')
    expect(metric(dialyn, 'energyRegen').breakdown.combat).toContainEqual(
      expect.objectContaining({ label: 'Yesterday Calls', detail: 'W1', amount: 1.5 }),
    )
  })

  it('preserves Yixuan Rupture conversion across all three current-stat surfaces', () => {
    const yixuan = agent(calculateParty(createPreparedState())!, 'yixuan')
    const atk = metric(yixuan, 'atk')
    const maxHp = metric(yixuan, 'maxHp')
    const sheerForce = metric(yixuan, 'sheerForce')

    for (const surface of ['initial', 'combat', 'fully'] as const) {
      const conversion = atk.values[surface] * VERTICAL_VALUES.rupture.currentAtkToSheer
        + maxHp.values[surface] * VERTICAL_VALUES.rupture.currentHpToSheer
      expect(sheerForce.breakdown[surface]).toContainEqual(expect.objectContaining({
        label: 'Rupture specialty',
        notation: 'surface-value',
        amount: expect.closeTo(conversion),
      }))
    }
  })

  it('recomposes all three Rupture consumers from each recipient current stats', () => {
    const withoutProvider = calculateParty(createPreparedState(
      {},
      ['yixuan', 'yidhari', 'manato'],
      0,
    ))!
    const withProvider = calculateParty(createPreparedState(
      {},
      ['yixuan', 'manato', 'lucia'],
      0,
    ))!

    const compared = [
      [agent(withoutProvider, 'yixuan'), agent(withProvider, 'yixuan')],
      [
        agent(calculateParty(createPreparedState({}, ['yidhari', 'manato', 'astraYao'], 0))!, 'yidhari'),
        agent(calculateParty(createPreparedState({}, ['yidhari', 'manato', 'lucia'], 0))!, 'yidhari'),
      ],
      [agent(withoutProvider, 'manato'), agent(withProvider, 'manato')],
    ] as const
    for (const [before, after] of compared) {
      const beforeHp = metric(before, 'maxHp').values.fully
      const afterHp = metric(after, 'maxHp').values.fully
      const beforeAtk = metric(before, 'atk').values.fully
      const afterAtk = metric(after, 'atk').values.fully
      const conversion = (result: typeof before) => metric(result, 'sheerForce')
        .breakdown.fully.find(({ label }) => label === 'Rupture specialty')!.amount

      expect(conversion(after) - conversion(before))
        .toBeCloseTo(
          (afterHp - beforeHp) * VERTICAL_VALUES.rupture.currentHpToSheer
          + (afterAtk - beforeAtk) * VERTICAL_VALUES.rupture.currentAtkToSheer,
        )
    }
  })

  it('projects Manato Core, prepared equipment, and Sheer formula exclusions', () => {
    const manato = agent(calculateParty(createPreparedState(
      {}, ['manato', 'lucia', 'trigger'], 0,
    ))!, 'manato')

    expect(metric(manato, 'maxHp').breakdown.initial).toEqual(expect.arrayContaining([
      expect.objectContaining({ label: 'Core Passive', detail: 'Completed Core HP enhancements', display: { value: 18, unit: '%', decimals: 0 } }),
      expect.objectContaining({ label: "Grill O'Wisp", detail: 'W5', display: { value: 25, unit: '%', decimals: 0 } }),
      expect.objectContaining({ label: 'Yunkui Tales', detail: '2-piece' }),
    ]))
    expect(metric(manato, 'critRate').breakdown.fully).toEqual(expect.arrayContaining([
      expect.objectContaining({ label: 'Core Passive', amount: 10 }),
      expect.objectContaining({ label: "Grill O'Wisp", amount: 24 }),
      expect.objectContaining({ label: 'Yunkui Tales', amount: 12 }),
    ]))
    expect(metric(manato, 'dmgBonus').breakdown.combat).toEqual(expect.arrayContaining([
      expect.objectContaining({ label: "Grill O'Wisp", amount: 24 }),
    ]))
    expect(metric(manato, 'dmgBonus').breakdown.fully)
      .toContainEqual(expect.objectContaining({ label: 'Core Passive', amount: 20 }))
    expect(manato.metrics.find(({ id }) => id === 'defReduction')).toBeUndefined()
    expect(manato.metrics.find(({ id }) => id === 'defIgnore')).toBeUndefined()
    expect(manato.metrics.find(({ id }) => id === 'penRatio')).toBeUndefined()
  })

  it('projects Yidhari local and applicable provider clauses without DEF/PEN rows', () => {
    const state = createPreparedState({}, ['yidhari', 'lucia', 'trigger'], 0)
    const yidhari = agent(calculateParty(state)!, 'yidhari')

    expect(metric(yidhari, 'maxHp').breakdown.initial).toEqual(expect.arrayContaining([
      expect.objectContaining({ label: "Kraken's Cradle", detail: 'W1' }),
      expect.objectContaining({ label: 'Yunkui Tales', detail: '2-piece' }),
    ]))
    expect(metric(yidhari, 'dmgBonus').breakdown.initial)
      .toContainEqual(expect.objectContaining({ label: 'Drive Disc · Slot 5' }))
    expect(metric(yidhari, 'dmgBonus').breakdown.fully).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ label: 'Core Passive', amount: 100 }),
        expect.objectContaining({ ownerAgentId: 'lucia', amount: 20 }),
      ]),
    )
    expect(metric(yidhari, 'sheerDmgBonus').breakdown.fully)
      .toEqual(expect.arrayContaining([
        expect.objectContaining({ label: "Kraken's Cradle", amount: 18 }),
        expect.objectContaining({ label: 'Yunkui Tales', amount: 10 }),
      ]))
    expect(yidhari.metrics.find(({ id }) => id === 'defReduction')).toBeUndefined()
    expect(yidhari.metrics.find(({ id }) => id === 'defIgnore')).toBeUndefined()
    expect(yidhari.metrics.find(({ id }) => id === 'penRatio')).toBeUndefined()
  })

  it('replaces source identity after an engine and refinement edit', () => {
    let state = selectEngine(createPreparedState(), 'dialyn', 'hellfireGears')
    state = setRefinement(state, 'dialyn', 3)
    const dialyn = agent(calculateParty(state)!, 'dialyn')
    const serialized = JSON.stringify(dialyn)

    expect(serialized).toContain('Hellfire Gears')
    expect(serialized).toContain('W3')
    expect(serialized).not.toContain('Yesterday Calls')
  })

  it('projects offered substats through the same Initial-input mechanism', () => {
    let state = createPreparedState()
    state = setSubstat(state, 'yixuan', 'hpPct', 1)
    state = setSubstat(state, 'dialyn', 'critRate', 1)
    state = setSubstat(state, 'lucia', 'hpPct', 1)
    state = setSubstat(state, 'lucia', 'hpFlat', 1)
    const result = calculateParty(state)!

    expect(metric(agent(result, 'yixuan'), 'maxHp').values.initial).toBeCloseTo(16685.29)
    expect(metric(agent(result, 'dialyn'), 'critRate').values.initial).toBeCloseTo(77.8)
    expect(metric(agent(result, 'lucia'), 'maxHp').values.initial).toBeCloseTo(22063.41)
  })

  it('projects an applicable main stat but permits complete inputs with no current projector', () => {
    const prepared = createPreparedState()
    const impactState = selectMain(prepared, 'dialyn', 'slot6', 'impact')
    const impact = metric(agent(calculateParty(impactState)!, 'dialyn'), 'impact')
    expect(impact.values.initial).toBeCloseTo(129.8)
    expect(impact.breakdown.initial).toContainEqual(expect.objectContaining({
      label: 'Drive Disc · Slot 6',
      display: { value: 18, unit: '%', decimals: 0 },
    }))

    const penState = selectMain(prepared, 'dialyn', 'slot5', 'penRatio')
    expect(isCompleteWorkbench(penState)).toBe(true)
    expect(calculateParty(penState)).toEqual(calculateParty(prepared))
  })

  it('caps a displayed stat once and reconciles its phase breakdown', () => {
    const state = setSubstat(createPreparedState(), 'yixuan', 'critRate', 11)
    const critRate = metric(agent(calculateParty(state)!, 'yixuan'), 'critRate')

    expect(critRate.values).toEqual({ initial: 69.8, combat: 89.8, fully: 100 })
    expect(critRate.breakdown.fully).not.toContainEqual(
      expect.objectContaining({ label: 'Qingming Birdcage' }),
    )
    const adjustment = critRate.breakdown.fully.find(
      ({ label }) => label === 'Displayed CRIT Rate cap',
    )!
    expect(adjustment).toMatchObject({ locus: 'calculation', amount: expect.closeTo(-1.8) })
    expect(critRate.breakdown.fully.reduce((total, item) => total + item.amount, 0))
      .toBeCloseTo(critRate.values.fully - critRate.values.combat)
  })

  it('keeps percentage Energy Regen and automatic per-second recovery as distinct atoms', () => {
    const dialyn = agent(calculateParty(selectDisc(
      createPreparedState(),
      'dialyn',
      'twoPiece',
      'swingJazz',
    ))!, 'dialyn')
    const energy = metric(dialyn, 'energyRegen')

    expect(energy.values).toEqual({ initial: 2.16, combat: 3.66, fully: 3.66 })
    expect(energy.breakdown.initial).toContainEqual(expect.objectContaining({
      label: 'Swing Jazz',
      display: { value: 20, unit: '%', decimals: 0 },
    }))
    expect(energy.breakdown.combat).toContainEqual(expect.objectContaining({
      label: 'Yesterday Calls',
      display: { value: 1.5, unit: '/s', decimals: 2 },
    }))
  })

  it('projects only the usable clauses of bounded partial W-Engine packages', () => {
    const triggerState = selectEngine(
      createPreparedState({}, ['evelyn', 'trigger', 'corin'], 0),
      'trigger',
      'blazingLaurel',
    )
    const triggerParty = calculateParty(triggerState)!
    const trigger = agent(triggerParty, 'trigger')
    const evelyn = agent(triggerParty, 'evelyn')
    const corin = agent(triggerParty, 'corin')

    expect(metric(trigger, 'impact').breakdown.fully).toContainEqual(
      expect.objectContaining({
        label: 'Blazing Laurel',
        display: { value: 25, unit: '%', decimals: 0 },
      }),
    )
    expect(metric(evelyn, 'critDmg').breakdown.fully).toContainEqual(
      expect.objectContaining({ label: 'Blazing Laurel', amount: 30 }),
    )
    expect(metric(corin, 'critDmg').breakdown.fully).not.toContainEqual(
      expect.objectContaining({ label: 'Blazing Laurel' }),
    )

    const cissiaState = selectEngine(
      createPreparedState({}, ['seed', 'cissia', 'astraYao'], 0),
      'cissia',
      'bellicoseBlaze',
    )
    const cissia = agent(calculateParty(cissiaState)!, 'cissia')
    expect(metric(cissia, 'energyRegen').breakdown.initial).toContainEqual(
      expect.objectContaining({
        label: 'Bellicose Blaze',
        display: { value: 60, unit: '%', decimals: 0 },
      }),
    )
    expect(metric(cissia, 'critRate').breakdown.combat).toContainEqual(
      expect.objectContaining({ label: 'Bellicose Blaze', amount: 20 }),
    )
    expect(metric(cissia, 'defIgnore').breakdown.combat).not.toContainEqual(
      expect.objectContaining({ label: 'Bellicose Blaze' }),
    )

    const serpentine = agent(calculateParty(selectEngine(
      cissiaState,
      'cissia',
      'serpentineSeeker',
    ))!, 'cissia')
    expect(metric(serpentine, 'defIgnore').breakdown.combat).toContainEqual(
      expect.objectContaining({ label: 'Serpentine Seeker', amount: 28 }),
    )
  })

  it('resolves Fully percentage clauses from authoritative Initial values', () => {
    const result = calculateParty(
      createPreparedState({}, ['anbySoldier0', 'trigger', 'astraYao'], 0),
    )!
    const anbyAtk = metric(agent(result, 'anbySoldier0'), 'atk')
    const triggerImpact = metric(agent(result, 'trigger'), 'impact')

    expect(anbyAtk.values.initial).toBeCloseTo(2450.6)
    expect(anbyAtk.values.fully - anbyAtk.values.initial).toBeCloseTo(1404.272)
    expect(triggerImpact.values.initial).toBeCloseTo(162.44)
    expect(triggerImpact.values.fully).toBeCloseTo(194.928)
  })

  it('runs one derived phase after delivery without feeding it back into its provider', () => {
    const forward = calculateParty(
      createPreparedState({}, ['anbySoldier0', 'trigger', 'astraYao'], 0),
    )!
    const permuted = calculateParty(
      createPreparedState({}, ['astraYao', 'anbySoldier0', 'trigger'], 1),
    )!
    const normalized = (result: typeof forward) => [...result.agents]
      .sort((left, right) => left.agentId.localeCompare(right.agentId))

    expect(normalized(permuted)).toEqual(normalized(forward))
    const anby = agent(forward, 'anbySoldier0')
    expect(metric(anby, 'critDmg').breakdown.fully).not.toContainEqual(
      expect.objectContaining({ detail: '35% of Fully Enabled CRIT DMG' }),
    )
    expect(action(anby, 'anbyAftershockCritDmg').breakdown.fully
      .filter(({ detail }) => detail === '35% of Fully Enabled CRIT DMG'))
      .toHaveLength(1)
  })

  it('keeps equal non-stacking origins visible while applying one category value', () => {
    let state = createPreparedState({}, ['corin', 'trigger', 'astraYao'], 0)
    state = withSetup(state, 'trigger', (setup) => ({ ...setup, fourPieceId: 'astralVoice' }))
    state = withSetup(state, 'astraYao', (setup) => ({ ...setup, fourPieceId: 'astralVoice' }))
    const rows = metric(agent(calculateParty(state)!, 'corin'), 'dmgBonus')
      .breakdown.fully.filter(({ label }) => label === 'Astral Voice')

    expect(rows).toHaveLength(2)
    expect(rows.map(({ amount }) => amount)).toEqual([24, 0])
    expect(rows.map(({ notation }) => notation))
      .toEqual([undefined, 'equal-nonstack-origin'])
  })

  it('projects one Moonlight and one Astral after stable Support allocation', () => {
    const state = createPreparedState({}, ['ellen', 'soukaku', 'lucy'], 0)
    expect(state.slots[1].setup).toMatchObject({
      fourPieceId: 'astralVoice', twoPieceId: 'moonlight',
    })
    expect(state.slots[2].setup).toMatchObject({
      fourPieceId: 'moonlight', twoPieceId: 'astralVoice',
    })

    const ellen = agent(calculateParty(state)!, 'ellen')
    const rows = metric(ellen, 'dmgBonus').breakdown.fully
    expect(rows).toContainEqual(expect.objectContaining({
      label: 'Moonlight Lullaby', ownerAgentId: 'lucy', amount: 18,
    }))
    expect(rows).toContainEqual(expect.objectContaining({
      label: 'Astral Voice', ownerAgentId: 'soukaku', amount: 24,
    }))
  })

  it('composes Wellspring once while preserving equal legal origins and distinct HP effects', () => {
    const yidhariOnly = agent(calculateParty(createPreparedState(
      {}, ['yidhari', 'dialyn', 'astraYao'], 0,
    ))!, 'yidhari')
    const luciaOnly = agent(calculateParty(createPreparedState(
      {}, ['manato', 'lucia', 'astraYao'], 0,
    ))!, 'manato')
    const together = agent(calculateParty(withMindscape(createPreparedState(
      {}, ['yidhari', 'lucia', 'dialyn'], 0,
    ), 'yidhari', 4))!, 'yidhari')

    for (const single of [yidhariOnly, luciaOnly]) {
      const rows = metric(single, 'maxHp').breakdown.fully.filter(
        ({ ownerAgentId, locus }) => locus === 'core'
          && (ownerAgentId === 'yidhari' || ownerAgentId === 'lucia'),
      )
      expect(rows).toHaveLength(1)
      expect(rows[0]).toMatchObject({ display: { value: 5, unit: '%', decimals: 0 } })
      expect(rows[0].notation).toBeUndefined()
    }

    const wellspring = metric(together, 'maxHp').breakdown.fully.filter(
      ({ ownerAgentId, locus }) => locus === 'core'
        && (ownerAgentId === 'yidhari' || ownerAgentId === 'lucia'),
    )
    expect(wellspring).toHaveLength(2)
    expect(wellspring.map(({ amount }) => amount)).toEqual([expect.any(Number), 0])
    expect(wellspring.map(({ notation }) => notation))
      .toEqual([undefined, 'equal-nonstack-origin'])
    expect(wellspring.map(({ ownerAgentId }) => ownerAgentId).sort())
      .toEqual(['lucia', 'yidhari'])

    expect(metric(together, 'maxHp').breakdown.fully).toEqual(expect.arrayContaining([
      expect.objectContaining({ label: 'Mindscape', ownerAgentId: 'yidhari', display: { value: 5, unit: '%', decimals: 0 } }),
      expect.objectContaining({ label: 'Dreamlit Hearth', ownerAgentId: 'lucia', display: { value: 15, unit: '%', decimals: 0 } }),
    ]))
  })

  it('routes broad enemy DEF pressure by formula participation instead of Agent identity', () => {
    const generalDamage = agent(calculateParty(createPreparedState(
      {},
      ['evelyn', 'trigger', 'astraYao'],
      0,
    ))!, 'evelyn')
    expect(metric(generalDamage, 'defReduction')).toMatchObject({
      values: { initial: 0, combat: 0, fully: 25 },
    })
    expect(metric(generalDamage, 'defReduction').breakdown.fully)
      .toContainEqual(expect.objectContaining({
        label: 'Spectral Gaze',
        ownerAgentId: 'trigger',
        amount: 25,
      }))

    const sheerState = selectEngine(createPreparedState(
      {},
      ['yixuan', 'trigger', 'astraYao'],
      0,
    ), 'trigger', 'spectralGaze')
    const sheer = agent(calculateParty(sheerState)!, 'yixuan')
    expect(sheer.metrics.find(({ id }) => id === 'defReduction')).toBeUndefined()
  })

  it('projects a selected four-piece set own two-piece effect exactly once', () => {
    const baseline = agent(calculateParty(
      createPreparedState({}, ['anbySoldier0', 'trigger', 'astraYao'], 0),
    )!, 'trigger')
    expect(metric(baseline, 'dazeBonus').breakdown.initial
      .filter(({ label, detail }) => label === 'King of the Summit' && detail === '2-piece'))
      .toHaveLength(1)

    const changed = selectDisc(
      createPreparedState({}, ['anbySoldier0', 'trigger', 'astraYao'], 0),
      'trigger',
      'fourPiece',
      'shockstar',
    )
    expect(metric(agent(calculateParty(changed)!, 'trigger'), 'impact').breakdown.initial
      .filter(({ label, detail }) => label === 'Shockstar Disco' && detail === '2-piece'))
      .toHaveLength(1)
  })

  it.each([
    {
      agentId: 'anbySoldier0',
      party: ['anbySoldier0', 'dialyn', 'astraYao'],
      ultimateId: 'anbyUltimate',
      pen: 8,
    },
    {
      agentId: 'seed',
      party: ['seed', 'dialyn', 'astraYao'],
      ultimateId: 'seedUltimate',
      pen: 8,
    },
    {
      agentId: 'cissia',
      party: ['cissia', 'dialyn', 'yixuan'],
      ultimateId: 'cissiaUltimate',
      pen: 8,
    },
    {
      agentId: 'evelyn',
      party: ['evelyn', 'dialyn', 'astraYao'],
      ultimateId: 'evelynUltimate',
      pen: 32,
    },
  ] as const)('projects the complete selected Puffer package for $agentId', ({
    agentId,
    party,
    ultimateId,
    pen: expectedPen,
  }) => {
    const prepared = createPreparedState({}, [...party], 0)
    const baseline = agent(calculateParty(prepared)!, agentId)
    const selected = agent(calculateParty(
      selectDisc(prepared, agentId, 'fourPiece', 'pufferElectro'),
    )!, agentId)
    const pufferSource = {
      label: 'Puffer Electro',
      ownerAgentId: agentId,
      locus: 'disc-4pc',
    }

    const pen = metric(selected, 'penRatio')
    expect(pen.values).toEqual({
      initial: expectedPen, combat: expectedPen, fully: expectedPen,
    })
    expect(pen.breakdown.initial.filter(({ label }) => label === 'Puffer Electro'))
      .toEqual([expect.objectContaining({
        ...pufferSource,
        detail: '2-piece',
        amount: 8,
      })])

    const atk = metric(selected, 'atk')
    expect(atk.breakdown.initial).not.toContainEqual(expect.objectContaining(pufferSource))
    expect(atk.breakdown.combat).not.toContainEqual(expect.objectContaining(pufferSource))
    const pufferAtk = atk.breakdown.fully.filter(
      ({ label }) => label === 'Puffer Electro',
    )
    expect(pufferAtk).toEqual([expect.objectContaining({
        ...pufferSource,
        detail: '4-piece',
        display: { value: 15, unit: '%', decimals: 0 },
      })])
    expect(pufferAtk[0].amount).toBeCloseTo(atk.values.initial * 0.15, 10)

    expect(metric(selected, 'dmgBonus').values)
      .toEqual(metric(baseline, 'dmgBonus').values)
    const ultimate = action(selected, ultimateId)
    const parentValues = ultimate.baseActionId
      ? action(selected, ultimate.baseActionId).values
      : metric(selected, 'dmgBonus').values
    for (const surface of ['initial', 'combat', 'fully'] as const) {
      expect(ultimate.values[surface] - parentValues[surface]).toBe(20)
    }
    expect(ultimate.breakdown.initial).toContainEqual(expect.objectContaining({
      ...pufferSource,
      detail: '4-piece',
      amount: 20,
    }))
    for (const modifier of selected.actionModifiers) {
      if (modifier.id !== ultimateId) {
        expect(Object.values(modifier.breakdown).flat())
          .not.toContainEqual(expect.objectContaining(pufferSource))
      }
    }
  })

  it('projects Evelyn equipment through the shared surfaces and action hierarchy', () => {
    const prepared = setSubstat(
      createPreparedState({}, ['evelyn', 'dialyn', 'astraYao'], 0),
      'evelyn',
      'critRate',
      2,
    )
    const result = agent(calculateParty(prepared)!, 'evelyn')
    const critRate = metric(result, 'critRate')
    const parent = action(result, 'evelynChainUltimate')
    const resIgnore = action(result, 'evelynChainUltimateResIgnore')

    expect(metric(result, 'atk').values.initial).toBeCloseTo(2614.8, 10)
    expect(critRate.values).toEqual({
      initial: expect.closeTo(56.2),
      combat: expect.closeTo(81.2),
      fully: expect.closeTo(81.2),
    })
    expect(critRate.gauge).toMatchObject({
      basisLabel: 'Combat CRIT Rate', current: expect.closeTo(81.2), threshold: 80, cap: 80,
      outputValue: 1.25, presentation: 'scale',
    })
    expect(result.operations).toEqual([expect.objectContaining({
      id: 'evelynChainUltimateDmgMultiplier', surface: 'combat', value: 1.25,
      presentation: 'scale',
    })])
    expect(parent.values.combat - metric(result, 'dmgBonus').values.combat).toBe(30)
    expect(resIgnore.values).toEqual({ initial: 0, combat: 12.5, fully: 25 })
    expect(metric(result, 'critDmg').values).toMatchObject({ initial: 98, combat: 148 })
    expect(metric(result, 'critDmg').breakdown.combat)
      .toContainEqual(expect.objectContaining({
        label: 'Heartstring Nocturne', ownerAgentId: 'evelyn', amount: 50,
      }))

    const w5 = agent(calculateParty(setRefinement(prepared, 'evelyn', 5))!, 'evelyn')
    expect(metric(w5, 'critDmg').values.combat).toBe(178)
    expect(action(w5, 'evelynChainUltimateResIgnore').values)
      .toEqual({ initial: 0, combat: 20, fully: 40 })

    const nonLimited = agent(calculateParty(createPreparedState(
      { evelyn: 'nonLimited' },
      ['evelyn', 'dialyn', 'astraYao'],
      0,
    ))!, 'evelyn')
    expect(metric(nonLimited, 'critRate')).toMatchObject({
      values: { initial: 43.4, combat: 68.4, fully: 68.4 },
      gauge: {
        basisLabel: 'Fully Enabled CRIT Rate', current: 68.4,
        outputValue: 1, presentation: 'scale',
      },
    })
    expect(nonLimited.operations).toEqual([])

    const withoutActivation = agent(calculateParty(createPreparedState(
      {},
      ['evelyn', 'seed', 'cissia'],
      0,
    ))!, 'evelyn')
    expect(metric(withoutActivation, 'critRate').gauge).toBeUndefined()
    expect(withoutActivation.operations).toEqual([])
  })

  it('keeps partial Evelyn W-Engine packages on only their applicable consumers', () => {
    const base = createPreparedState({}, ['evelyn', 'dialyn', 'astraYao'], 0)

    const cordis = agent(calculateParty(selectEngine(base, 'evelyn', 'cordisGermina'))!, 'evelyn')
    expect(action(cordis, 'evelynBasicUltimateDefIgnore')).toMatchObject({
      outcomes: [
        { kind: 'canonical', action: 'Basic Attack' },
        { kind: 'canonical', action: 'Ultimate' },
      ],
      metricId: 'defIgnore',
      values: { initial: 0, combat: 0, fully: 20 },
    })
    expect(Object.values(metric(cordis, 'dmgBonus').breakdown).flat())
      .not.toContainEqual(expect.objectContaining({ label: 'Cordis Germina' }))

    const severed = agent(calculateParty(selectEngine(base, 'evelyn', 'severedInnocence'))!, 'evelyn')
    expect(metric(severed, 'critDmg').breakdown.combat)
      .toContainEqual(expect.objectContaining({ label: 'Severed Innocence', amount: 30 }))
    expect(metric(severed, 'critDmg').breakdown.fully)
      .toContainEqual(expect.objectContaining({ label: 'Severed Innocence', amount: 30 }))
    expect(Object.values(metric(severed, 'dmgBonus').breakdown).flat())
      .not.toContainEqual(expect.objectContaining({ label: 'Severed Innocence' }))

    const steel = agent(calculateParty(selectEngine(base, 'evelyn', 'steelCushion'))!, 'evelyn')
    expect(Object.values(metric(steel, 'dmgBonus').breakdown).flat()
      .filter(({ label }) => label === 'Steel Cushion'))
      .toEqual([expect.objectContaining({ amount: 25 })])

    const starlight = agent(calculateParty(createPreparedState(
      { evelyn: 'nonLimited' }, ['evelyn', 'dialyn', 'astraYao'], 0,
    ))!, 'evelyn')
    expect(metric(starlight, 'atk').breakdown.fully)
      .toContainEqual(expect.objectContaining({
        label: 'Starlight Engine', detail: 'W5',
        display: { value: 19.2, unit: '%', decimals: 1 },
      }))
  })

  it('projects Corin equipment and retained actions without excluded resource or raw outcomes', () => {
    const prepared = createPreparedState({}, ['corin', 'lycaon', 'astraYao'], 0)
    const base = agent(calculateParty(prepared)!, 'corin')

    expect(metric(base, 'dmgBonus').breakdown.fully)
      .toContainEqual(expect.objectContaining({
        label: 'Additional Ability', ownerAgentId: 'corin',
      }))
    const unqualified = agent(calculateParty(
      createPreparedState({}, ['corin', 'trigger', 'astraYao'], 0),
    )!, 'corin')
    expect(Object.values(metric(unqualified, 'dmgBonus').breakdown).flat())
      .not.toContainEqual(expect.objectContaining({
        label: 'Additional Ability', ownerAgentId: 'corin',
      }))
    const differentFaction = agent(calculateParty(
      createPreparedState({}, ['corin', 'evelyn', 'astraYao'], 0),
    )!, 'corin')
    expect(Object.values(metric(differentFaction, 'dmgBonus').breakdown).flat())
      .not.toContainEqual(expect.objectContaining({
        label: 'Additional Ability', ownerAgentId: 'corin',
      }))

    expect(action(base, 'corinChainsaw').values.combat
      - metric(base, 'dmgBonus').values.combat).toBeCloseTo(37.5, 10)
    expect(action(base, 'corinBasicUltimateDefIgnore').values.fully).toBe(20)
    expect(metric(base, 'resReduction').values.fully).toBe(10)
    expect(base.operations).toEqual([])
    expect(JSON.stringify(base)).not.toMatch(/M4|M6|raw damage|Charge coefficient/i)

    const housekeeper = agent(calculateParty(setRefinement(
      selectEngine(prepared, 'corin', 'housekeeper'),
      'corin',
      5,
    ))!, 'corin')
    expect(metric(housekeeper, 'energyRegen')).toMatchObject({
      unit: '/s',
      values: { initial: 0, combat: 0.72, fully: 0.72 },
    })
    expect(action(housekeeper, 'corinEx').values.fully
      - metric(housekeeper, 'dmgBonus').values.fully).toBe(72)

    const heartstring = agent(calculateParty(
      selectEngine(prepared, 'corin', 'heartstringNocturne'),
    )!, 'corin')
    expect(metric(heartstring, 'critDmg').breakdown.combat)
      .toContainEqual(expect.objectContaining({
        label: 'Heartstring Nocturne',
        amount: 50,
      }))
    expect(heartstring.metrics.find(({ id }) => id === 'resIgnore')).toBeUndefined()
  })

  it('projects Heartstring only through each compatible current CRIT consumer', () => {
    const anbyParty = createPreparedState(
      {}, ['anbySoldier0', 'lycaon', 'astraYao'], 0,
    )
    const anbyBaselineState = selectEngine(anbyParty, 'anbySoldier0', 'cordisGermina')
    const anbyBaseline = agent(calculateParty(anbyBaselineState)!, 'anbySoldier0')
    const anbyState = selectEngine(
      anbyParty,
      'anbySoldier0',
      'heartstringNocturne',
    )
    const anby = agent(calculateParty(anbyState)!, 'anbySoldier0')
    expect(metric(anby, 'critRate').breakdown.initial)
      .toContainEqual(expect.objectContaining({
        label: 'Heartstring Nocturne', amount: 24,
      }))
    expect(metric(anby, 'critDmg').breakdown.combat)
      .toContainEqual(expect.objectContaining({
        label: 'Heartstring Nocturne', amount: 50,
      }))
    const derivedAmount = (result: typeof anby) => (
      action(result, 'anbyAftershockCritDmg').breakdown.fully
        .find(({ detail }) => detail === '35% of Fully Enabled CRIT DMG')?.amount
    )
    expect(derivedAmount(anby)! - derivedAmount(anbyBaseline)!).toBeCloseTo(17.5, 10)
    expect(anby.metrics.find(({ id }) => id === 'resIgnore')).toBeUndefined()

    const seedState = selectEngine(
      createPreparedState({}, ['seed', 'lycaon', 'astraYao'], 0),
      'seed',
      'heartstringNocturne',
    )
    const seed = agent(calculateParty(seedState)!, 'seed')
    expect(metric(seed, 'critRate').breakdown.initial)
      .toContainEqual(expect.objectContaining({
        label: 'Heartstring Nocturne', amount: 24,
      }))
    expect(metric(seed, 'critDmg').breakdown.combat)
      .toContainEqual(expect.objectContaining({
        label: 'Heartstring Nocturne', amount: 50,
      }))
    expect(seed.metrics.find(({ id }) => id === 'resIgnore')).toBeUndefined()
  })

  it('projects Lycaon threshold, action, recipient, and multi-recipient mechanisms separately', () => {
    const local = createPreparedState({}, ['corin', 'lycaon', 'astraYao'], 0)
    const base = agent(calculateParty(local)!, 'lycaon')
    expect(metric(base, 'stunDmgMultiplier').breakdown.fully)
      .toContainEqual(expect.objectContaining({
        label: 'Additional Ability', ownerAgentId: 'lycaon',
      }))
    const unqualified = agent(calculateParty(
      createPreparedState({}, ['seed', 'lycaon', 'astraYao'], 0),
    )!, 'lycaon')
    expect(unqualified.metrics.find(({ id }) => id === 'stunDmgMultiplier')).toBeUndefined()
    const differentFaction = agent(calculateParty(
      createPreparedState({}, ['evelyn', 'lycaon', 'astraYao'], 0),
    )!, 'lycaon')
    expect(differentFaction.metrics.find(({ id }) => id === 'stunDmgMultiplier')).toBeUndefined()

    expect(metric(base, 'critRate').gauge).toMatchObject({
      basisLabel: 'Initial CRIT Rate',
      current: 29,
      threshold: 50,
      outputValue: 15,
    })
    expect(action(base, 'lycaonCharged').values)
      .toEqual({ initial: 6, combat: 86, fully: 86 })
    expect(action(base, 'lycaonGlacialWaltz').values.fully).toBe(54)
    expect(action(base, 'lycaonPotential').values.fully).toBeCloseTo(249.34, 10)

    const threshold = agent(calculateParty(
      setSubstat(local, 'lycaon', 'critRate', 9),
    )!, 'lycaon')
    expect(metric(threshold, 'critRate').gauge).toEqual(
      expect.objectContaining({
        current: expect.closeTo(50.6),
        outputValue: 30,
      }),
    )

    let fullyOnlyBuffState = createPreparedState({}, ['corin', 'lycaon', 'lucia'], 0)
    fullyOnlyBuffState = selectEngine(fullyOnlyBuffState, 'lucia', 'unfetteredGameBall')
    fullyOnlyBuffState = setRefinement(fullyOnlyBuffState, 'lucia', 5)
    fullyOnlyBuffState = setSubstat(fullyOnlyBuffState, 'lycaon', 'critRate', 1)
    const fullyOnlyBuff = calculateParty(fullyOnlyBuffState)!
    const buffedLycaonCrit = metric(agent(fullyOnlyBuff, 'lycaon'), 'critRate')
    expect(buffedLycaonCrit.values).toMatchObject({
      initial: expect.closeTo(31.4),
      fully: expect.closeTo(51.4),
    })
    expect(buffedLycaonCrit.gauge).toMatchObject({
      basisLabel: 'Initial CRIT Rate',
      current: expect.closeTo(31.4),
      outputValue: 15,
    })
    expect(metric(agent(fullyOnlyBuff, 'corin'), 'critDmg').breakdown.fully)
      .toContainEqual(expect.objectContaining({
        label: 'King of the Summit', ownerAgentId: 'lycaon', amount: 15,
      }))

    const m1State = withSetup(local, 'lycaon', (setup) => ({ ...setup, mindscape: 1 }))
    const m1 = agent(calculateParty(m1State)!, 'lycaon')
    expect(action(m1, 'lycaonEx').values.fully).toBe(18)
    expect(action(m1, 'lycaonFullChargeEx').values.fully).toBe(28)
    expect(m1.operations).toEqual([])

    const simmering = agent(calculateParty(
      selectEngine(local, 'lycaon', 'simmeringPot'),
    )!, 'lycaon')
    expect(action(simmering, 'lycaonAssist').values.fully
      - metric(simmering, 'dazeBonus').values.fully).toBe(11.5)
    expect(simmering.metrics.find(({ id }) => id === 'dmgBonus')).toBeUndefined()

    const hellfire = agent(calculateParty(
      selectEngine(local, 'lycaon', 'hellfireGears'),
    )!, 'lycaon')
    expect(metric(hellfire, 'impact').values).toMatchObject({
      initial: expect.closeTo(194.54),
      fully: expect.closeTo(221.94),
    })
    expect(metric(hellfire, 'impact').breakdown.fully)
      .toContainEqual(expect.objectContaining({
        label: 'Hellfire Gears', detail: 'W1',
        display: { value: 20, unit: '%', decimals: 0 },
      }))
    expect(hellfire.metrics.find(({ id }) => id === 'energyRegen')).toBeUndefined()

    const steam = agent(calculateParty(
      selectEngine(local, 'lycaon', 'steamOven'),
    )!, 'lycaon')
    expect(metric(steam, 'impact').values).toMatchObject({
      initial: expect.closeTo(169.88),
      fully: expect.closeTo(204.952),
    })
    expect(metric(steam, 'energyRegen').values.initial).toBeCloseTo(1.8, 10)

    const allocated = calculateParty(
      createPreparedState({}, ['corin', 'trigger', 'lycaon'], 0),
    )!
    const allocatedCorin = agent(allocated, 'corin')
    const allocatedLycaon = agent(allocated, 'lycaon')
    expect(allocatedLycaon.metrics.find(({ id }) => id === 'critRate')).toBeUndefined()
    expect(metric(allocatedCorin, 'dmgBonus').breakdown.fully)
      .toEqual(expect.arrayContaining([
        expect.objectContaining({ label: 'Astral Voice', ownerAgentId: 'lycaon', amount: 24 }),
        expect.objectContaining({ label: 'Core Passive', ownerAgentId: 'lycaon', amount: 30 }),
      ]))

    const attributeParty = calculateParty(
      createPreparedState({}, ['evelyn', 'lycaon', 'corin'], 0),
    )!
    expect(metric(agent(attributeParty, 'evelyn'), 'critDmg').breakdown.fully)
      .toContainEqual(expect.objectContaining({
        label: 'Blazing Laurel',
        ownerAgentId: 'lycaon',
        amount: 30,
      }))
    expect(metric(agent(attributeParty, 'corin'), 'critDmg').breakdown.fully)
      .not.toContainEqual(expect.objectContaining({ label: 'Blazing Laurel' }))
  })

  it('omits fixed base values from source disclosure', () => {
    const result = calculateParty(createPreparedState())!
    const serialized = JSON.stringify(result)

    expect(metric(agent(result, 'yixuan'), 'atk').breakdown.initial).toEqual([])
    expect(serialized).not.toMatch(/Agent base|Drive Disc · Slot [123]|Base ATK/i)
  })

  it('keeps Soldier 11 relationship, action, and partial-engine consumers exact', () => {
    const fire = agent(calculateParty(
      createPreparedState({}, ['soldier11', 'evelyn', 'corin'], 0),
    )!, 'soldier11')
    const nedf = agent(calculateParty(
      createPreparedState({}, ['soldier11', 'anbySoldier0', 'corin'], 0),
    )!, 'soldier11')
    const absent = agent(calculateParty(
      createPreparedState({}, ['soldier11', 'corin', 'lycaon'], 0),
    )!, 'soldier11')

    expect(metric(fire, 'critDmg').breakdown.fully)
      .toContainEqual(expect.objectContaining({ ownerAgentId: 'soldier11', locus: 'special', amount: 48 }))
    expect(metric(nedf, 'critDmg').breakdown.fully)
      .toContainEqual(expect.objectContaining({ ownerAgentId: 'soldier11', locus: 'special', amount: 48 }))
    expect(metric(absent, 'critDmg').breakdown.fully)
      .not.toContainEqual(expect.objectContaining({ ownerAgentId: 'soldier11', locus: 'special' }))
    expect(metric(fire, 'dmgBonus').breakdown.fully)
      .toEqual(expect.arrayContaining([
        expect.objectContaining({ ownerAgentId: 'soldier11', locus: 'additional', amount: 10 }),
      ]))
    expect(metric(fire, 'dmgBonus').values.fully).toBe(10)
    expect(action(fire, 'soldier11AgainstStunnedEnemies').values.fully).toBe(32.5)
    expect(metric(absent, 'dmgBonus').breakdown.fully)
      .not.toContainEqual(expect.objectContaining({ ownerAgentId: 'soldier11', locus: 'additional' }))
    expect(absent.actionModifiers.find(({ id }) => id === 'soldier11AgainstStunnedEnemies'))
      .toBeUndefined()
    expect(action(fire, 'soldier11FireSuppressionBasic').breakdown.fully)
      .toContainEqual(expect.objectContaining({ ownerAgentId: 'soldier11', locus: 'core', amount: 70 }))
    expect(action(fire, 'soldier11ChainUltimateResIgnore').breakdown.fully)
      .toContainEqual(expect.objectContaining({ label: 'Heartstring Nocturne', amount: 25 }))

    const m2 = agent(calculateParty(withMindscape(
      createPreparedState({}, ['soldier11', 'evelyn', 'corin'], 0), 'soldier11', 2,
    ))!, 'soldier11')
    expect(action(m2, 'soldier11Basic').breakdown.fully)
      .toContainEqual(expect.objectContaining({ ownerAgentId: 'soldier11', locus: 'mindscape', amount: 36 }))
    expect(action(m2, 'soldier11FireSuppressionBasic').values.fully).toBe(116)
    expect(action(m2, 'soldier11FireSuppressionBasic').baseActionId).toBe('soldier11Basic')
    expect(action(m2, 'soldier11FireSuppressionBasic').breakdown.fully)
      .toContainEqual(expect.objectContaining({ ownerAgentId: 'soldier11', locus: 'core', amount: 70 }))

    const cordis = agent(calculateParty(selectEngine(
      createPreparedState({}, ['soldier11', 'evelyn', 'corin'], 0), 'soldier11', 'cordisGermina',
    ))!, 'soldier11')
    expect(metric(cordis, 'critRate').breakdown.combat)
      .toContainEqual(expect.objectContaining({ label: 'Cordis Germina', amount: 15 }))
    expect(action(cordis, 'soldier11BasicUltimateDefIgnore').breakdown.fully)
      .toContainEqual(expect.objectContaining({ label: 'Cordis Germina', amount: 20 }))

    const seedParty = createPreparedState({}, ['seed', 'soldier11', 'trigger'], 0)
    expect(resolveSeedVanguardForState(seedParty)).toBe('soldier11')
    expect(resolveProviderEffects(seedParty).contexts.find(({ agentId }) => agentId === 'seed'))
      .toBeDefined()

    const nonLimitedState = createPreparedState(
      { soldier11: 'nonLimited' }, ['soldier11', 'evelyn', 'corin'], 0,
    )
    expect(nonLimitedState.slots[0].setup).toMatchObject({ engineId: 'brimstone', refinement: 1 })
    const nonLimitedAtk = metric(agent(calculateParty(nonLimitedState)!, 'soldier11'), 'atk')
    expect(nonLimitedAtk.breakdown.combat)
      .not.toContainEqual(expect.objectContaining({ label: 'The Brimstone' }))
    expect(nonLimitedAtk.breakdown.fully)
      .toContainEqual(expect.objectContaining({ label: 'The Brimstone', ownerAgentId: 'soldier11' }))
    expect(calculateParty(withSetup(nonLimitedState, 'soldier11', (setup) => ({
      ...setup,
      engineId: null,
      refinement: null,
    })))).toBeNull()
  })

  it('projects Lighter through Impact, Elation, and exact Fire/Ice party consumers', () => {
    const prepared = createPreparedState({}, ['soldier11', 'lighter', 'soukaku'], 0)
    const lighter = agent(calculateParty(prepared)!, 'lighter')
    const soldier11 = agent(calculateParty(prepared)!, 'soldier11')
    expect(prepared.slots[1].setup).toMatchObject({
      engineId: 'blazingLaurel', fourPieceId: 'king', twoPieceId: 'shockstar',
      mains: { slot4: 'critRate' }, substats: { critRate: 0 },
    })
    expect(metric(lighter, 'impact').values).toMatchObject({
      initial: expect.closeTo(194.54), fully: expect.closeTo(256.19),
    })
    expect(metric(lighter, 'impact').gauge).toMatchObject({
      basisLabel: 'Fully Enabled Impact', outputValue: 65, outputCap: 75,
    })
    expect(lighter.operations).toContainEqual(expect.objectContaining({
      id: 'lighterQuickAssist', value: 1,
    }))
    expect(metric(lighter, 'stunDuration').values.fully).toBe(3)
    expect(metric(soldier11, 'critDmg').breakdown.fully)
      .toContainEqual(expect.objectContaining({ label: 'Blazing Laurel', ownerAgentId: 'lighter', amount: 30 }))
    expect(metric(soldier11, 'resReduction').breakdown.fully)
      .toContainEqual(expect.objectContaining({ ownerAgentId: 'lighter', amount: 15 }))

    const m1 = agent(calculateParty(withMindscape(prepared, 'lighter', 1))!, 'lighter')
    const m2 = agent(calculateParty(withMindscape(prepared, 'lighter', 2))!, 'lighter')
    expect(metric(m1, 'stunDuration').values.fully).toBe(5)
    expect(metric(m1, 'resReduction').values.fully).toBe(25)
    expect(metric(m2, 'stunDmgMultiplier').values.fully).toBe(25)
    expect(metric(m2, 'impact').gauge).toMatchObject({ outputValue: 78, outputCap: 90 })

    const nonLimited = agent(calculateParty(createPreparedState(
      { lighter: 'nonLimited' }, ['soldier11', 'lighter', 'soukaku'], 0,
    ))!, 'lighter')
    expect(metric(nonLimited, 'impact').values.fully).toBeCloseTo(249.34, 3)
    expect(metric(nonLimited, 'impact').gauge?.outputValue).toBe(60)

    const inactive = agent(calculateParty(
      createPreparedState({}, ['lighter', 'lycaon', 'astraYao'], 1),
    )!, 'lighter')
    expect(metric(inactive, 'impact').gauge?.outputValue).toBe(0)
    expect(metric(inactive, 'stunDuration').values.fully).toBe(3)
    expect(metric(inactive, 'resReduction').values.fully).toBe(15)

    const mixed = calculateParty(createPreparedState(
      {}, ['lighter', 'evelyn', 'corin'], 1,
    ))!
    const fireRecipient = agent(mixed, 'evelyn')
    const physicalContrast = agent(mixed, 'corin')
    expect(metric(fireRecipient, 'critDmg').breakdown.fully)
      .toContainEqual(expect.objectContaining({ label: 'Blazing Laurel', ownerAgentId: 'lighter', amount: 30 }))
    expect(metric(fireRecipient, 'dmgBonus').breakdown.fully)
      .toContainEqual(expect.objectContaining({ ownerAgentId: 'lighter', locus: 'additional', amount: 65 }))
    expect(metric(fireRecipient, 'resReduction').breakdown.fully)
      .toContainEqual(expect.objectContaining({ ownerAgentId: 'lighter', amount: 15 }))
    expect(metric(physicalContrast, 'critDmg').breakdown.fully)
      .not.toContainEqual(expect.objectContaining({ label: 'Blazing Laurel', ownerAgentId: 'lighter' }))
    expect(metric(physicalContrast, 'dmgBonus').breakdown.fully)
      .not.toContainEqual(expect.objectContaining({ ownerAgentId: 'lighter', locus: 'additional' }))
    expect(metric(physicalContrast, 'resReduction').breakdown.fully)
      .not.toContainEqual(expect.objectContaining({ ownerAgentId: 'lighter' }))
    expect(metric(physicalContrast, 'critDmg').breakdown.fully)
      .toContainEqual(expect.objectContaining({ label: 'King of the Summit', ownerAgentId: 'lighter', amount: 15 }))
  })

  it('composes Zhu Yuan Core, Mindscape, and equipment on exact Basic and Dash descendants', () => {
    let state = createPreparedState({}, ['zhuYuan', 'lycaon', 'dialyn'], 0)
    state = selectEngine(state, 'zhuYuan', 'riotSuppressorMarkVI')
    const m0 = agent(calculateParty(state)!, 'zhuYuan')
    const basic = action(m0, 'zhuYuanBasic')
    const enhancedBasic = action(m0, 'zhuYuanEnhancedBasic')
    const stunnedEnhancedBasic = action(m0, 'zhuYuanStunnedEnhancedBasic')
    const dash = action(m0, 'zhuYuanDash')
    const enhancedDash = action(m0, 'zhuYuanEnhancedDash')
    const stunnedEnhancedDash = action(m0, 'zhuYuanStunnedEnhancedDash')

    expect(basic.breakdown.fully)
      .toContainEqual(expect.objectContaining({ label: 'Riot Suppressor Mark VI', amount: 35 }))
    expect(dash.breakdown.fully)
      .toContainEqual(expect.objectContaining({ label: 'Riot Suppressor Mark VI', amount: 35 }))
    expect(enhancedBasic.baseActionId).toBe('zhuYuanBasic')
    expect(enhancedBasic.values.fully - basic.values.fully).toBe(40)
    expect(stunnedEnhancedBasic.baseActionId).toBe('zhuYuanEnhancedBasic')
    expect(stunnedEnhancedBasic.values.fully - enhancedBasic.values.fully).toBe(40)
    expect(enhancedDash.baseActionId).toBe('zhuYuanDash')
    expect(enhancedDash.values.fully - dash.values.fully).toBe(40)
    expect(stunnedEnhancedDash.baseActionId).toBe('zhuYuanEnhancedDash')
    expect(stunnedEnhancedDash.values.fully - enhancedDash.values.fully).toBe(40)

    const m4 = agent(calculateParty(withMindscape(state, 'zhuYuan', 4))!, 'zhuYuan')
    expect(action(m4, 'zhuYuanEnhancedBasic').values.fully
      - action(m4, 'zhuYuanBasic').values.fully).toBe(90)
    expect(action(m4, 'zhuYuanStunnedEnhancedBasic').values.fully
      - action(m4, 'zhuYuanEnhancedBasic').values.fully).toBe(40)
    expect(action(m4, 'zhuYuanEnhancedDashResIgnore').values.fully).toBe(25)

    const cordis = agent(calculateParty(selectEngine(state, 'zhuYuan', 'cordisGermina'))!, 'zhuYuan')
    expect(action(cordis, 'zhuYuanBasicUltimateDefIgnore').breakdown.fully)
      .toContainEqual(expect.objectContaining({ label: 'Cordis Germina', amount: 20 }))
    expect(metric(cordis, 'critRate').breakdown.combat)
      .toContainEqual(expect.objectContaining({ label: 'Cordis Germina', amount: 15 }))

    const nonLimited = agent(calculateParty(createPreparedState(
      { zhuYuan: 'nonLimited' }, ['zhuYuan', 'lycaon', 'dialyn'], 0,
    ))!, 'zhuYuan')
    const nonLimitedAtk = metric(nonLimited, 'atk')
    expect(nonLimitedAtk.breakdown.combat)
      .not.toContainEqual(expect.objectContaining({ label: 'The Brimstone' }))
    expect(nonLimitedAtk.breakdown.fully)
      .toContainEqual(expect.objectContaining({ label: 'The Brimstone', ownerAgentId: 'zhuYuan' }))
  })

  it('projects Nicole through formula, Attribute, Energy, operation, and pressure boundaries', () => {
    const mixed = calculateParty(createPreparedState(
      {}, ['zhuYuan', 'nicole', 'soldier11'], 0,
    ))!
    const zhuYuan = agent(mixed, 'zhuYuan')
    const soldier11 = agent(mixed, 'soldier11')
    const nicole = agent(mixed, 'nicole')

    expect(metric(zhuYuan, 'defReduction').breakdown.fully)
      .toContainEqual(expect.objectContaining({ ownerAgentId: 'nicole', locus: 'core', amount: 40 }))
    expect(metric(zhuYuan, 'dmgBonus').breakdown.fully)
      .toContainEqual(expect.objectContaining({ ownerAgentId: 'nicole', locus: 'additional', amount: 25 }))
    expect(metric(zhuYuan, 'dmgBonus').breakdown.fully)
      .toContainEqual(expect.objectContaining({ ownerAgentId: 'nicole', locus: 'w-engine', amount: 24 }))
    expect(metric(zhuYuan, 'critRate').breakdown.fully)
      .toContainEqual(expect.objectContaining({ ownerAgentId: 'nicole', locus: 'mindscape', amount: 15 }))
    expect(metric(zhuYuan, 'critRate').breakdown.combat)
      .not.toContainEqual(expect.objectContaining({ ownerAgentId: 'zhuYuan', locus: 'additional' }))
    expect(metric(zhuYuan, 'critRate').breakdown.fully)
      .toContainEqual(expect.objectContaining({ ownerAgentId: 'zhuYuan', locus: 'additional', amount: 30 }))
    expect(metric(soldier11, 'defReduction').values.fully).toBe(40)
    expect(metric(soldier11, 'critRate').breakdown.fully)
      .toContainEqual(expect.objectContaining({ ownerAgentId: 'nicole', locus: 'mindscape', amount: 15 }))
    expect(metric(soldier11, 'dmgBonus').breakdown.fully)
      .not.toContainEqual(expect.objectContaining({ ownerAgentId: 'nicole', locus: 'additional' }))
    expect(nicole.metrics.map(({ id }) => id)).toEqual(['energyRegen'])
    expect(metric(nicole, 'energyRegen').values.combat - metric(nicole, 'energyRegen').values.initial)
      .toBe(0)
    expect(nicole.operations).toHaveLength(3)
    expect(nicole.operations.map(({ value }) => value)).toEqual([1, 1, 1])

    const elegant = agent(calculateParty(selectEngine(
      createPreparedState({}, ['zhuYuan', 'nicole', 'soldier11'], 0),
      'nicole',
      'elegantVanity',
    ))!, 'nicole')
    expect(elegant.metrics.map(({ id }) => id)).toEqual(['energyRegen'])

    const nicoleM0 = agent(calculateParty(withMindscape(
      createPreparedState({}, ['zhuYuan', 'nicole', 'soldier11'], 0), 'nicole', 0,
    ))!, 'zhuYuan')
    expect(metric(nicoleM0, 'critRate').breakdown.fully)
      .not.toContainEqual(expect.objectContaining({ ownerAgentId: 'nicole', locus: 'mindscape' }))

    const establishedGeneralConsumers = calculateParty(createPreparedState(
      {}, ['ellen', 'nicole', 'trigger'], 0,
    ))!
    for (const agentId of ['ellen', 'trigger'] as const) {
      expect(metric(agent(establishedGeneralConsumers, agentId), 'defReduction').breakdown.fully)
        .toContainEqual(expect.objectContaining({ ownerAgentId: 'nicole', locus: 'core', amount: 40 }))
    }

    const rupture = calculateParty(createPreparedState(
      {}, ['yixuan', 'nicole', 'zhuYuan'], 0,
    ))!
    const yixuan = agent(rupture, 'yixuan')
    expect(metric(yixuan, 'dmgBonus').breakdown.fully)
      .toContainEqual(expect.objectContaining({ ownerAgentId: 'nicole', locus: 'additional', amount: 25 }))
    expect(metric(yixuan, 'critRate').breakdown.fully)
      .toContainEqual(expect.objectContaining({ ownerAgentId: 'nicole', locus: 'mindscape', amount: 15 }))
    expect(yixuan.metrics.find(({ id }) => id === 'defReduction')).toBeUndefined()

    const kingRecipient = agent(calculateParty(createPreparedState(
      {}, ['lycaon', 'nicole', 'zhuYuan'], 0,
    ))!, 'lycaon')
    expect(metric(kingRecipient, 'critRate').breakdown.fully)
      .toContainEqual(expect.objectContaining({ ownerAgentId: 'nicole', locus: 'mindscape', amount: 15 }))

    const unqualified = agent(calculateParty(createPreparedState(
      {}, ['nicole', 'soldier11', 'lycaon'], 1,
    ))!, 'soldier11')
    expect(metric(unqualified, 'dmgBonus').breakdown.fully)
      .not.toContainEqual(expect.objectContaining({ ownerAgentId: 'nicole', locus: 'additional' }))
  })

  it('routes broad pre-PEN damage clauses to Anomaly without admitting CRIT-only effects', () => {
    const state = withMindscape(
      createPreparedState({}, ['grace', 'trigger', 'anbySoldier0'], 2),
      'trigger',
      2,
    )
    const effects = resolveProviderEffects(state)
    const graceInbox = effects.inboxes[0]
    const anbyInbox = effects.inboxes[2]

    expect(effects.enemyContext).toContainEqual(expect.objectContaining({
      metric: 'stunDmgMultiplier',
      source: expect.objectContaining({ ownerAgentId: 'trigger' }),
      eligibleAgentIds: expect.arrayContaining(['grace', 'anbySoldier0']),
    }))
    expect(graceInbox).not.toContainEqual(expect.objectContaining({
      metric: 'critDmg',
      source: expect.objectContaining({ ownerAgentId: 'trigger' }),
    }))
    expect(anbyInbox).toContainEqual(expect.objectContaining({
      metric: 'critDmg',
      source: expect.objectContaining({ ownerAgentId: 'trigger' }),
    }))

    const result = calculateParty(state)!
    expect(metric(agent(result, 'grace'), 'stunDmgMultiplier').values.fully)
      .toBeGreaterThan(0)
    expect(agent(result, 'grace').metrics.find(({ id }) => id === 'critDmg'))
      .toBeUndefined()
    expect(metric(agent(result, 'anbySoldier0'), 'critDmg').breakdown.fully)
      .toContainEqual(expect.objectContaining({ ownerAgentId: 'trigger' }))

    const anomalyOnly = agent(calculateParty(createPreparedState(
      {}, ['grace', 'juFufu', 'billy'], 0,
    ))!, 'grace')
    expect(anomalyOnly.actionModifiers.flatMap(({ outcomes }) => outcomes))
      .not.toContainEqual(expect.objectContaining({
        kind: 'canonical', action: 'Chain Attack',
      }))
    expect(anomalyOnly.actionModifiers.flatMap(({ outcomes }) => outcomes))
      .not.toContainEqual(expect.objectContaining({
        kind: 'canonical', action: 'Ultimate',
      }))
  })

  it('observes Piper qualification once and delivers its all-party clause without leaking self clauses', () => {
    const qualified = resolveProviderEffects(createPreparedState(
      {}, ['piper', 'billy', 'soldier11'], 0,
    ))
    expect(qualified.contexts[0]).toMatchObject({
      agentId: 'piper', additionalActive: true,
    })
    for (const inbox of qualified.inboxes) {
      expect(inbox).toContainEqual(expect.objectContaining({
        metric: 'dmgBonus', recipient: 'all-party',
        source: expect.objectContaining({
          ownerAgentId: 'piper', locus: 'additional',
        }),
        value: { kind: 'additive', amount: 18 },
      }))
    }
    expect(qualified.inboxes[0]).toContainEqual(expect.objectContaining({
      metric: 'power', recipient: 'self',
      source: expect.objectContaining({ ownerAgentId: 'piper', locus: 'core' }),
    }))
    expect(qualified.inboxes[1]).not.toContainEqual(expect.objectContaining({
      metric: 'power', source: expect.objectContaining({ ownerAgentId: 'piper' }),
    }))

    const unrelated = resolveProviderEffects(createPreparedState(
      {}, ['piper', 'anby', 'lycaon'], 0,
    ))
    expect(unrelated.contexts[0]).toMatchObject({
      agentId: 'piper', additionalActive: false,
    })
    for (const inbox of unrelated.inboxes) {
      expect(inbox).not.toContainEqual(expect.objectContaining({
        source: expect.objectContaining({
          ownerAgentId: 'piper', locus: 'additional',
        }),
      }))
    }
  })
})
