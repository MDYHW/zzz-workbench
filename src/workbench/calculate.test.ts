import { describe, expect, it } from 'vitest'
import {
  calculateParty,
  type ActionModifier,
  type AgentResult,
  type Contribution,
  type ResultMetric,
  type SurfaceKey,
} from './calculate'
import { createPreparedState, workbenchReducer, type WorkbenchState } from './state'

const SURFACES: SurfaceKey[] = ['initial', 'combat', 'fully']

function agent(result: NonNullable<ReturnType<typeof calculateParty>>, id: AgentResult['agentId']) {
  const found = result.agents.find((item) => item.agentId === id)
  if (!found) throw new Error(`Missing ${id} Result`)
  return found
}

function metric(result: AgentResult, id: string): ResultMetric {
  const found = result.metrics.find((item) => item.id === id)
  if (!found) throw new Error(`Missing ${id} metric`)
  return found
}

function action(result: AgentResult, id: string): ActionModifier {
  const found = result.actionModifiers.find((item) => item.id === id)
  if (!found) throw new Error(`Missing ${id} action aggregate`)
  return found
}

function contributionTotal(items: Contribution[]) {
  return items.reduce((sum, item) => sum + item.amount, 0)
}

function sourceLabels(items: Contribution[]) {
  return items.map((item) => item.label)
}

describe('calculateParty', () => {
  it('calculates the authored Qingming baseline and corrected modifier regions', () => {
    const result = calculateParty(createPreparedState())
    expect(result).not.toBeNull()
    expect(Object.keys(result!)).toEqual(['agents'])

    const yixuan = agent(result!, 'yixuan')
    expect(metric(yixuan, 'maxHp').values.initial).toBeCloseTo(16434.1)
    expect(metric(yixuan, 'atk').values.initial).toBeCloseTo(1931)
    expect(metric(yixuan, 'sheerForce').values.initial).toBeCloseTo(2222.71)
    expect(metric(yixuan, 'critRate').values).toEqual({
      initial: 51.4,
      combat: 71.4,
      fully: 83.4,
    })
    expect(metric(yixuan, 'critDmg').values).toEqual({
      initial: 50,
      combat: 50,
      fully: 180,
    })
    expect(metric(yixuan, 'sheerForce').values.fully).toBeCloseTo(3366.1847)
    expect(metric(yixuan, 'dmgBonus').values).toEqual({
      initial: 30,
      combat: 46,
      fully: 149,
    })
    expect(metric(yixuan, 'sheerDmgBonus').values).toEqual({
      initial: 0,
      combat: 0,
      fully: 10,
    })
  })

  it('keeps W-Engine advanced stats in Initial and passives out of Initial', () => {
    const yixuan = agent(calculateParty(createPreparedState())!, 'yixuan')
    const hp = metric(yixuan, 'maxHp')
    const critRate = metric(yixuan, 'critRate')
    const dmgBonus = metric(yixuan, 'dmgBonus')

    expect(sourceLabels(hp.breakdown.initial)).toContain('Qingming Birdcage \u00B7 W1')
    expect(sourceLabels(critRate.breakdown.initial)).not.toContain('Qingming Birdcage \u00B7 W1')
    expect(critRate.breakdown.combat).toContainEqual(expect.objectContaining({
      label: 'Qingming Birdcage \u00B7 W1',
      amount: 20,
      ownerAgentId: 'yixuan',
      locus: 'w-engine',
    }))
    expect(dmgBonus.breakdown.combat).toContainEqual(expect.objectContaining({
      label: 'Qingming Birdcage \u00B7 W1',
      amount: 16,
      locus: 'w-engine',
    }))
  })

  it('maps Core, Additional Ability, W-Engine, and Disc bonuses to separate action regions', () => {
    const yixuan = agent(calculateParty(createPreparedState())!, 'yixuan')
    const shared = action(yixuan, 'coreActions')
    const exStunned = action(yixuan, 'exSpecialStunned')
    const qingmingSheer = action(yixuan, 'qingmingSheerActions')

    expect(shared.metricId).toBe('dmgBonus')
    expect(shared.actions).toEqual(['Basic Attack', 'EX Special Attack', 'Assist Follow-Up', 'Chain Attack', 'Ultimate'])
    expect(shared.values).toEqual({ initial: 30, combat: 106, fully: 209 })
    expect(shared.breakdown.combat).toEqual([
      expect.objectContaining({ label: 'Core Passive', amount: 60, locus: 'core' }),
    ])

    expect(exStunned.metricId).toBe('dmgBonus')
    expect(exStunned.baseActionId).toBe('coreActions')
    expect(exStunned.actions).toEqual(['EX Special Attack'])
    expect(exStunned.values).toEqual({ initial: 30, combat: 106, fully: 239 })
    expect(exStunned.breakdown.fully).toEqual([
      expect.objectContaining({ label: 'Additional Ability', amount: 30, locus: 'additional' }),
    ])

    expect(qingmingSheer.metricId).toBe('sheerDmgBonus')
    expect(qingmingSheer.actions).toEqual(['EX Special Attack', 'Ultimate'])
    expect(qingmingSheer.values).toEqual({ initial: 0, combat: 20, fully: 30 })
    expect(qingmingSheer.breakdown.combat).toEqual([
      expect.objectContaining({ label: 'Qingming Birdcage \u00B7 W1', amount: 20, locus: 'w-engine' }),
    ])
    expect(metric(yixuan, 'sheerDmgBonus').breakdown.fully).toEqual([
      expect.objectContaining({ label: 'Yunkui Tales \u00B7 4-piece', amount: 10, locus: 'disc-4pc' }),
    ])

    const coreOccurrences = yixuan.actionModifiers
      .flatMap((item) => SURFACES.flatMap((surface) => item.breakdown[surface]))
      .filter((item) => item.label === 'Core Passive')
    expect(coreOccurrences).toHaveLength(1)

    const publicLabels = JSON.stringify(yixuan)
    expect(publicLabels).not.toMatch(/Grandmaster|Core-supported|All Sheer|Cloud-Shaper|Ashen Ink|Companion|stack|qualifying forms|vs Stunned/i)
  })

  it('calculates Cauldron without inventing a downstream action dependency', () => {
    const state = workbenchReducer(createPreparedState(), {
      type: 'selectEngine',
      engineId: 'cauldron',
    })
    const yixuan = agent(calculateParty(state)!, 'yixuan')

    expect(metric(yixuan, 'maxHp').values.initial).toBeCloseTo(16015.45)
    expect(metric(yixuan, 'atk').values.initial).toBeCloseTo(1782)
    expect(metric(yixuan, 'sheerForce').values.initial).toBeCloseTo(2136.145)
    expect(metric(yixuan, 'critRate').values.fully).toBeCloseTo(73.8)
    expect(metric(yixuan, 'sheerForce').values.fully).toBeCloseTo(3271.2467)
    expect(metric(yixuan, 'dmgBonus').values).toEqual({
      initial: 30,
      combat: 30,
      fully: 152.2,
    })
    expect(metric(yixuan, 'sheerDmgBonus').values).toEqual({
      initial: 0,
      combat: 0,
      fully: 10,
    })

    expect(action(yixuan, 'coreActions').values).toEqual({
      initial: 30,
      combat: 90,
      fully: 212.2,
    })
    expect(action(yixuan, 'exSpecialStunned').values).toEqual({
      initial: 30,
      combat: 90,
      fully: 242.2,
    })
    expect(yixuan.actionModifiers.some((item) => item.metricId === 'sheerDmgBonus')).toBe(false)
    expect(metric(yixuan, 'dmgBonus').breakdown.fully).toContainEqual(
      expect.objectContaining({ label: 'Cauldron of Clarity \u00B7 W5', amount: 19.2 }),
    )
    expect(JSON.stringify(yixuan.actionModifiers)).not.toMatch(/Cauldron/)
  })

  it('keeps later-surface deltas reproducible while omitting fixed Initial terms', () => {
    const result = calculateParty(createPreparedState())!

    for (const agentResult of result.agents) {
      for (const resultMetric of agentResult.metrics) {
        expect(contributionTotal(resultMetric.breakdown.combat)).toBeCloseTo(
          resultMetric.values.combat - resultMetric.values.initial,
        )
        expect(contributionTotal(resultMetric.breakdown.fully)).toBeCloseTo(
          resultMetric.values.fully - resultMetric.values.combat,
        )
      }

      for (const currentAction of agentResult.actionModifiers) {
        const parentValues = currentAction.baseActionId
          ? action(agentResult, currentAction.baseActionId).values
          : metric(agentResult, currentAction.metricId).values
        let actionDelta = 0
        for (const surface of SURFACES) {
          actionDelta += contributionTotal(currentAction.breakdown[surface])
          expect(parentValues[surface] + actionDelta).toBeCloseTo(currentAction.values[surface])
        }
      }
    }

    expect(JSON.stringify(result)).not.toMatch(/subtotal|No new contribution/i)

    const yixuan = agent(result, 'yixuan')
    const maxHp = metric(yixuan, 'maxHp')
    expect(maxHp.breakdown.initial).toContainEqual(expect.objectContaining({
      label: 'Qingming Birdcage \u00B7 W1',
      amount: expect.closeTo(2511.9),
      display: { value: 30, unit: '%', decimals: 0 },
    }))
    expect(metric(yixuan, 'atk').breakdown.initial).toEqual([])
    expect(JSON.stringify(yixuan.metrics)).not.toMatch(
      /Agent base|Drive Disc \u00B7 Slot [123]|Base ATK/i,
    )
  })

  it('keeps shared effects out of Initial and identifies their provider Agent', () => {
    const result = calculateParty(createPreparedState())!
    const yixuan = agent(result, 'yixuan')
    const dialyn = agent(result, 'dialyn')
    const lucia = agent(result, 'lucia')

    for (const resultMetric of result.agents.flatMap((item) => item.metrics)) {
      for (const item of resultMetric.breakdown.initial) {
        expect(item.ownerAgentId).toBe(result.agents.find((candidate) =>
          candidate.metrics.includes(resultMetric))!.agentId)
      }
    }

    expect(metric(yixuan, 'dmgBonus').breakdown.fully.map((item) => item.ownerAgentId))
      .toEqual(['dialyn', 'lucia', 'lucia', 'lucia'])
    expect(dialyn.metrics.map((item) => item.id)).toEqual([
      'critRate',
      'impact',
      'dazeBonus',
    ])
    expect(lucia.metrics.map((item) => item.id)).toEqual(['maxHp'])

    expect(metric(yixuan, 'stunDmgMultiplier').values.fully).toBe(30)
    expect(dialyn.operations).toHaveLength(1)
    expect(dialyn.operations[0]).toMatchObject({
      id: 'stunDuration',
      label: 'Enemy Stun duration',
      source: {
        label: 'Core Passive',
        ownerAgentId: 'dialyn',
        locus: 'core',
      },
    })
    expect(metric(yixuan, 'sheerForce').breakdown.fully).toContainEqual(
      expect.objectContaining({
        label: 'EX Special Attack',
        ownerAgentId: 'lucia',
        amount: expect.closeTo(814.7927),
      }),
    )
  })

  it('retains only CRIT Rate, CRIT DMG, and HP as Yixuan effective substats', () => {
    const prepared = createPreparedState()
    const baseline = agent(calculateParty(prepared)!, 'yixuan')

    const critRate = agent(calculateParty(workbenchReducer(prepared, {
      type: 'setSubstat',
      key: 'critRate',
      value: 1,
    }))!, 'yixuan')
    expect(metric(critRate, 'critRate').values.fully - metric(baseline, 'critRate').values.fully)
      .toBeCloseTo(2.4)

    const critDmg = agent(calculateParty(workbenchReducer(prepared, {
      type: 'setSubstat',
      key: 'critDmg',
      value: 1,
    }))!, 'yixuan')
    expect(metric(critDmg, 'critDmg').values.fully - metric(baseline, 'critDmg').values.fully)
      .toBeCloseTo(4.8)

    const hp = agent(calculateParty(workbenchReducer(prepared, {
      type: 'setSubstat',
      key: 'hpPct',
      value: 1,
    }))!, 'yixuan')
    expect(metric(hp, 'maxHp').values.initial - metric(baseline, 'maxHp').values.initial)
      .toBeCloseTo(251.19)
    expect(metric(hp, 'sheerForce').values.fully - metric(baseline, 'sheerForce').values.fully)
      .toBeCloseTo(30.1428)
    expect(metric(hp, 'atk').values.initial).toBe(metric(baseline, 'atk').values.initial)
  })

  it('caps displayed CRIT Rate without creating a generic gauge', () => {
    const state = workbenchReducer(createPreparedState(), {
      type: 'setSubstat',
      key: 'critRate',
      value: 36,
    })
    const critRate = metric(agent(calculateParty(state)!, 'yixuan'), 'critRate')

    expect(critRate.values).toEqual({ initial: 100, combat: 100, fully: 100 })
    expect(critRate.gauge).toBeUndefined()
    expect(critRate.breakdown.initial).toContainEqual(expect.objectContaining({
      label: 'Displayed CRIT Rate cap',
      amount: expect.closeTo(-37.8),
    }))
    expect(contributionTotal(critRate.breakdown.combat)).toBeCloseTo(0)
    expect(contributionTotal(critRate.breakdown.fully)).toBeCloseTo(0)
  })

  it('exposes only source-defined Dialyn and Lucia gauges', () => {
    const result = calculateParty(createPreparedState())!
    const yixuan = agent(result, 'yixuan')
    const dialyn = agent(result, 'dialyn')
    const lucia = agent(result, 'lucia')
    const dialynCritRate = metric(dialyn, 'critRate')
    const dialynImpact = metric(dialyn, 'impact')
    const dialynDaze = metric(dialyn, 'dazeBonus')
    const luciaMaxHp = metric(lucia, 'maxHp')

    expect(yixuan.metrics.every((item) => item.gauge === undefined)).toBe(true)
    expect(dialynImpact.values.combat).toBeCloseTo(160.8)
    expect(dialynImpact.gauge).toBeUndefined()
    expect(dialynCritRate.gauge).toMatchObject({
      source: { label: 'Core Passive', ownerAgentId: 'dialyn', locus: 'core' },
      current: 75.4,
      threshold: 50,
      cap: 100,
      outputValue: expect.closeTo(50.8),
    })
    expect(dialynDaze.values).toEqual({ initial: 6, combat: 6, fully: 33 })
    expect(dialynDaze.breakdown.initial).toContainEqual(expect.objectContaining({
      label: 'King of the Summit \u00B7 2-piece',
      amount: 6,
    }))
    expect(luciaMaxHp.gauge).toMatchObject({
      source: { label: 'EX Special Attack', ownerAgentId: 'lucia', locus: 'ex-special' },
      current: 21697.1,
      cap: 24000,
      outputValue: expect.closeTo(814.7927),
    })
    expect(lucia.metrics.some((item) => item.id === 'squadSheerForce')).toBe(false)
  })

  it('returns no Result when a required target selection is incomplete', () => {
    const prepared = createPreparedState()
    const missingEngine: WorkbenchState = { ...prepared, engineId: null }
    if (!prepared.equipment) throw new Error('Prepared state must include equipment')
    const missingMainStat: WorkbenchState = {
      ...prepared,
      equipment: {
        ...prepared.equipment,
        mains: {
          ...prepared.equipment.mains,
          slot5: { ...prepared.equipment.mains.slot5, stat: '' },
        },
      },
    }
    const missingEquipment: WorkbenchState = { ...prepared, equipment: null }
    const missingCount: WorkbenchState = {
      ...prepared,
      substats: { ...prepared.substats, hpPct: Number.NaN },
    }

    expect(calculateParty(missingEngine)).toBeNull()
    expect(calculateParty(missingEquipment)).toBeNull()
    expect(calculateParty(missingCount)).toBeNull()
    expect(calculateParty(missingMainStat)).toBeNull()
  })
})
