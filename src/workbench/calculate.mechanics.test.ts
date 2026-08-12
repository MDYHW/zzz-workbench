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
    ]

    for (const state of incomplete) expect(calculateParty(state)).toBeNull()
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
    const state = setSubstat(createPreparedState(), 'yixuan', 'critRate', 10)
    const critRate = metric(agent(calculateParty(state)!, 'yixuan'), 'critRate')

    expect(critRate.values).toEqual({ initial: 75.4, combat: 95.4, fully: 100 })
    expect(critRate.breakdown.fully).not.toContainEqual(
      expect.objectContaining({ label: 'Qingming Birdcage' }),
    )
    const adjustment = critRate.breakdown.fully.find(
      ({ label }) => label === 'Displayed CRIT Rate cap',
    )!
    expect(adjustment).toMatchObject({ locus: 'calculation', amount: expect.closeTo(-7.4) })
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
    expect(anbyAtk.values.fully - anbyAtk.values.initial).toBeCloseTo(1494.072)
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
    let state = createPreparedState({}, ['yixuan', 'trigger', 'astraYao'], 0)
    state = withSetup(state, 'trigger', (setup) => ({ ...setup, fourPieceId: 'astralVoice' }))
    state = withSetup(state, 'astraYao', (setup) => ({ ...setup, fourPieceId: 'astralVoice' }))
    const rows = metric(agent(calculateParty(state)!, 'yixuan'), 'dmgBonus')
      .breakdown.fully.filter(({ label }) => label === 'Astral Voice')

    expect(rows).toHaveLength(2)
    expect(rows.map(({ amount }) => amount)).toEqual([24, 0])
    expect(rows.map(({ notation }) => notation))
      .toEqual([undefined, 'equal-nonstack-origin'])
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
    const prepared = createPreparedState({}, ['evelyn', 'dialyn', 'astraYao'], 0)
    const result = agent(calculateParty(prepared)!, 'evelyn')
    const critRate = metric(result, 'critRate')
    const parent = action(result, 'evelynChainUltimate')
    const resIgnore = action(result, 'evelynChainUltimateResIgnore')

    expect(metric(result, 'atk').values.initial).toBeCloseTo(2614.8, 10)
    expect(critRate.values).toEqual({ initial: 67.4, combat: 92.4, fully: 92.4 })
    expect(critRate.gauge).toMatchObject({
      basisLabel: 'Combat CRIT Rate', current: 92.4, threshold: 80, cap: 80,
      outputValue: 1.25, presentation: 'scale',
    })
    expect(result.operations).toEqual([expect.objectContaining({
      id: 'evelynChainUltimateDmgMultiplier', surface: 'combat', value: 1.25,
      presentation: 'scale',
    })])
    expect(parent.values.combat - metric(result, 'dmgBonus').values.combat).toBe(30)
    expect(resIgnore.values).toEqual({ initial: 0, combat: 12.5, fully: 25 })
    expect(metric(result, 'critDmg').values).toMatchObject({ initial: 66, combat: 116 })
    expect(metric(result, 'critDmg').breakdown.combat)
      .toContainEqual(expect.objectContaining({
        label: 'Heartstring Nocturne', ownerAgentId: 'evelyn', amount: 50,
      }))

    const w5 = agent(calculateParty(setRefinement(prepared, 'evelyn', 5))!, 'evelyn')
    expect(metric(w5, 'critDmg').values.combat).toBe(146)
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
