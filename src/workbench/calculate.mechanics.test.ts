import { describe, expect, it } from 'vitest'
import { calculateParty } from './calculate'
import { VERTICAL_VALUES, W_ENGINES, type AgentId } from './content'
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

    let panState = createPreparedState({}, ['yixuan', 'panYinhu', 'juFufu'], 0)
    panState = selectDisc(panState, 'panYinhu', 'fourPiece', 'swingJazz')
    panState = selectDisc(panState, 'panYinhu', 'twoPiece', 'moonlight')
    expect(metric(agent(calculateParty(panState)!, 'panYinhu'), 'energyRegen')
      .breakdown.initial).toContainEqual(expect.objectContaining({
        label: 'Moonlight Lullaby', locus: 'disc-2pc',
        display: { value: 20, unit: '%', decimals: 0 },
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
    expect(metric(manato, 'dmgBonus').breakdown.fully).toEqual(expect.arrayContaining([
      expect.objectContaining({ label: 'Core Passive', amount: 20 }),
      expect.objectContaining({ label: "Grill O'Wisp", amount: 24 }),
    ]))
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
    const selectedSetup = prepared.slots.find(({ agentId: id }) => id === agentId)?.setup
    if (!selectedSetup?.engineId) throw new Error(`Missing selected ${agentId} engine`)
    expect(pufferAtk[0].amount).toBeCloseTo(
      (VERTICAL_VALUES[agentId].atk + W_ENGINES[selectedSetup.engineId].baseAtk) * 0.15,
      10,
    )
    expect(pufferAtk[0].amount).not.toBeCloseTo(atk.values.initial * 0.15, 10)

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
})
