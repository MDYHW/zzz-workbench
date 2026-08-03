import { describe, expect, it } from 'vitest'
import {
  calculateParty,
  type AgentResult,
  type Contribution,
  type SurfaceKey,
} from './calculate'
import { createPreparedState, workbenchReducer, type WorkbenchState } from './state'

const SURFACES: SurfaceKey[] = ['initial', 'combat', 'fully']

function agent(result: NonNullable<ReturnType<typeof calculateParty>>, id: AgentResult['agentId']) {
  const found = result.agents.find((item) => item.agentId === id)
  if (!found) throw new Error(`Missing ${id} Result`)
  return found
}

function metric(result: AgentResult, id: string) {
  const found = result.metrics.find((item) => item.id === id)
  if (!found) throw new Error(`Missing ${id} metric`)
  return found
}

function contributionTotal(items: Contribution[]) {
  return items.reduce((sum, item) => sum + item.amount, 0)
}

describe('calculateParty', () => {
  it('calculates the authored Qingming prepared baseline and Agent-owned projection', () => {
    const result = calculateParty(createPreparedState())
    expect(result).not.toBeNull()
    expect(Object.keys(result!)).toEqual(['agents'])

    const yixuan = agent(result!, 'yixuan')
    expect(metric(yixuan, 'maxHp').values.initial).toBeCloseTo(16434.1)
    expect(metric(yixuan, 'atk').values.initial).toBeCloseTo(1931)
    expect(metric(yixuan, 'sheerForce').values.initial).toBeCloseTo(2222.71)
    expect(metric(yixuan, 'critRate').values.combat).toBeCloseTo(71.4)
    expect(metric(yixuan, 'critRate').values.fully).toBeCloseTo(83.4)
    expect(metric(yixuan, 'sheerForce').values.fully).toBeCloseTo(3366.1847)
    expect(metric(yixuan, 'dmgBonus').values).toEqual({
      initial: 30,
      combat: 46,
      fully: 149,
    })
    expect(metric(yixuan, 'sheerDmgBonus').values).toEqual({
      initial: 0,
      combat: 60,
      fully: 70,
    })
    expect(yixuan.actionModifiers.map((row) => row.label)).toEqual([
      'Basic Attack / Assist Follow-Up / Chain Attack',
      'EX Special Attack',
      'Ultimate',
    ])
  })

  it('maps max-Core, Additional Ability, and W-Engine action scopes independently', () => {
    const yixuan = agent(calculateParty(createPreparedState())!, 'yixuan')
    const basic = yixuan.actionModifiers.find((row) => row.id === 'basicAssistChain')!
    const exSpecial = yixuan.actionModifiers.find((row) => row.id === 'exSpecial')!
    const ultimate = yixuan.actionModifiers.find((row) => row.id === 'ultimate')!

    expect(basic.values).toEqual({ initial: 0, combat: 60, fully: 70 })
    expect(exSpecial.values).toEqual({ initial: 0, combat: 80, fully: 120 })
    expect(ultimate.values).toEqual({ initial: 0, combat: 80, fully: 90 })

    expect(exSpecial.breakdown.combat).toContainEqual({
      source: 'Yixuan · Core Passive',
      amount: 60,
    })
    expect(exSpecial.breakdown.combat).toContainEqual({
      source: 'Qingming Birdcage · W1',
      amount: 20,
    })
    expect(exSpecial.breakdown.combat.some((item) => item.source.includes('Additional Ability'))).toBe(false)
    expect(exSpecial.breakdown.fully).toContainEqual({
      source: 'Yixuan · Additional Ability',
      amount: 30,
    })
    expect(ultimate.breakdown.fully.some((item) => item.source === 'Yixuan \u00B7 Additional Ability')).toBe(false)
    const regularDmg = metric(yixuan, 'dmgBonus')
    const sheerDmg = metric(yixuan, 'sheerDmgBonus')
    expect(regularDmg.breakdown.fully.some((item) => (
      item.source.includes('Yixuan') || item.source.includes('Yunkui')
    ))).toBe(false)
    expect(sheerDmg.breakdown.fully[1].source).toContain('Yunkui Tales')
    expect(sheerDmg.breakdown.fully[1].amount).toBe(10)
    for (const row of yixuan.actionModifiers) {
      expect(row.metricId).toBe('sheerDmgBonus')
      expect(JSON.stringify(row.breakdown)).not.toMatch(/Dialyn|Lucia|Cauldron/)
    }


    const publicLabels = JSON.stringify(yixuan)
    expect(publicLabels).not.toMatch(/Grandmaster|Core-supported|All Sheer|Cloud-Shaper|Ashen Ink|Companion|stack/i)
  })

  it('calculates the Cauldron package with EX as trigger rather than affected action', () => {
    const state = workbenchReducer(createPreparedState(), {
      type: 'selectEngine',
      engineId: 'cauldron',
    })
    const result = calculateParty(state)!
    const yixuan = agent(result, 'yixuan')

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

    const basic = yixuan.actionModifiers.find((row) => row.id === 'basicAssistChain')!
    const exSpecial = yixuan.actionModifiers.find((row) => row.id === 'exSpecial')!
    const ultimate = yixuan.actionModifiers.find((row) => row.id === 'ultimate')!
    expect(basic.values).toEqual({ initial: 0, combat: 60, fully: 70 })
    expect(exSpecial.values).toEqual({ initial: 0, combat: 60, fully: 100 })
    expect(ultimate.values).toEqual({ initial: 0, combat: 60, fully: 70 })
    for (const row of yixuan.actionModifiers) {
      expect(row.breakdown.combat.some((item) => item.source.includes('Cauldron'))).toBe(false)
      expect(row.breakdown.fully.some((item) => item.source.includes('Cauldron'))).toBe(false)
    }
    expect(metric(yixuan, 'dmgBonus').breakdown.fully).toContainEqual({
      source: 'Cauldron of Clarity · W5',
      amount: 19.2,
    })
  })

  it('keeps every metric and action aggregate reproducible while disclosing only new later sources', () => {
    const result = calculateParty(createPreparedState())!

    for (const agentResult of result.agents) {
      for (const resultMetric of agentResult.metrics) {
        for (const surface of SURFACES) {
        expect(resultMetric.breakdown.combat[0]).toEqual({
          source: 'Initial subtotal',
          amount: resultMetric.values.initial,
        })
        expect(resultMetric.breakdown.fully[0]).toEqual({
          source: 'Combat subtotal',
          amount: resultMetric.values.combat,
        })
          expect(contributionTotal(resultMetric.breakdown[surface]))
            .toBeCloseTo(resultMetric.values[surface])
        }
      }
      for (const action of agentResult.actionModifiers) {
        for (const surface of SURFACES) {
          expect(contributionTotal(action.breakdown[surface]))
            .toBeCloseTo(action.values[surface])
        expect(action.breakdown.combat[0]).toEqual({
          source: 'Initial subtotal',
          amount: action.values.initial,
        })
        expect(action.breakdown.fully[0]).toEqual({
          source: 'Combat subtotal',
          amount: action.values.combat,
        })
        }
      }
    }

    const maxHp = metric(agent(result, 'yixuan'), 'maxHp')
    expect(maxHp.breakdown.combat).toEqual([
      { source: 'Initial subtotal', amount: maxHp.values.initial },
    ])
    expect(maxHp.breakdown.fully[0]).toEqual({
      source: 'Combat subtotal',
      amount: maxHp.values.combat,
    })
    expect(maxHp.breakdown.fully.some((item) => item.source === 'Agent Lv.60 + max Core')).toBe(false)

    const critDmg = metric(agent(result, 'yixuan'), 'critDmg')
    expect(critDmg.breakdown.fully.some((item) => item.source === 'Agent Lv.60 + max Core')).toBe(false)
    expect(critDmg.breakdown.fully[0].source).toBe('Combat subtotal')
  })

  it('keeps shared effects out of Initial and assigns current consumers and operations', () => {
    const result = calculateParty(createPreparedState())!
    const yixuan = agent(result, 'yixuan')
    const dialyn = agent(result, 'dialyn')
    const lucia = agent(result, 'lucia')

    for (const resultMetric of yixuan.metrics) {
      expect(resultMetric.breakdown.initial.some((item) => /Dialyn|Lucia/.test(item.source))).toBe(false)
    }
    for (const resultMetric of dialyn.metrics) {
      expect(resultMetric.breakdown.initial.some((item) => /Yixuan|Lucia/.test(item.source))).toBe(false)
    }
    for (const resultMetric of lucia.metrics) {
      expect(resultMetric.breakdown.initial.some((item) => /Yixuan|Dialyn/.test(item.source))).toBe(false)
    }

    expect(metric(yixuan, 'dmgBonus').values).toEqual({
      initial: 30,
      combat: 46,
      fully: 149,
    })
    for (const currentAgent of [dialyn, lucia]) {
      expect(metric(currentAgent, 'dmgBonus').values).toEqual({
        initial: 0,
        combat: 0,
        fully: 103,
      })
    }

    expect(metric(yixuan, 'stunDmgMultiplier').values).toEqual({
      initial: 0,
      combat: 0,
      fully: 30,
    })
    expect(dialyn.metrics.some((item) => item.id === 'stunDmgMultiplier')).toBe(false)
    expect(lucia.metrics.some((item) => item.id === 'stunDmgMultiplier')).toBe(false)
    expect(dialyn.operations).toEqual([
      {
        id: 'stunMultiplier',
        label: 'Enemy Stun DMG Multiplier',
        source: 'Dialyn · Core Passive',
        surface: 'fully',
        value: 30,
        unit: '%',
      },
      {
        id: 'stunDuration',
        label: 'Enemy Stun duration',
        source: 'Dialyn · Core Passive',
        surface: 'fully',
        value: 2,
        unit: 's',
      },
    ])

    expect(metric(yixuan, 'sheerForce').breakdown.fully).toContainEqual({
      source: 'Lucia · EX Special Attack',
      amount: expect.closeTo(814.7927),
    })
    expect(dialyn.metrics.some((item) => item.id === 'squadSheerForce')).toBe(false)
    expect(metric(lucia, 'squadSheerForce').values.fully).toBeCloseTo(814.7927)
  })

  it('recalculates each retained Yixuan effective substat on its consumed axes', () => {
    const prepared = createPreparedState()
    const baselineYixuan = agent(calculateParty(prepared)!, 'yixuan')

    const critRate = agent(
      calculateParty(workbenchReducer(prepared, {
        type: 'setSubstat',
        key: 'critRate',
        value: 1,
      }))!,
      'yixuan',
    )
    expect(metric(critRate, 'critRate').values.fully
      - metric(baselineYixuan, 'critRate').values.fully).toBeCloseTo(2.4)
    expect(metric(critRate, 'maxHp').values.initial).toBe(metric(baselineYixuan, 'maxHp').values.initial)

    const critDmg = agent(
      calculateParty(workbenchReducer(prepared, {
        type: 'setSubstat',
        key: 'critDmg',
        value: 1,
      }))!,
      'yixuan',
    )
    expect(metric(critDmg, 'critDmg').values.fully
      - metric(baselineYixuan, 'critDmg').values.fully).toBeCloseTo(4.8)
    expect(metric(critDmg, 'critRate').values.fully).toBe(metric(baselineYixuan, 'critRate').values.fully)

    const hp = agent(
      calculateParty(workbenchReducer(prepared, {
        type: 'setSubstat',
        key: 'hpPct',
        value: 1,
      }))!,
      'yixuan',
    )
    expect(metric(hp, 'maxHp').values.initial
      - metric(baselineYixuan, 'maxHp').values.initial).toBeCloseTo(251.19)
    expect(metric(hp, 'sheerForce').values.fully
      - metric(baselineYixuan, 'sheerForce').values.fully).toBeCloseTo(30.1428)
    expect(metric(hp, 'atk').values.initial).toBe(metric(baselineYixuan, 'atk').values.initial)

    const atk = agent(
      calculateParty(workbenchReducer(prepared, {
        type: 'setSubstat',
        key: 'atkPct',
        value: 1,
      }))!,
      'yixuan',
    )
    expect(metric(atk, 'atk').values.initial
      - metric(baselineYixuan, 'atk').values.initial).toBeCloseTo(48.45)
    expect(metric(atk, 'sheerForce').values.fully
      - metric(baselineYixuan, 'sheerForce').values.fully).toBeCloseTo(14.535)
    expect(metric(atk, 'maxHp').values.initial).toBe(metric(baselineYixuan, 'maxHp').values.initial)
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
    for (const surface of SURFACES) {
      expect(contributionTotal(critRate.breakdown[surface])).toBeCloseTo(100)
    }
  })

  it('exposes only source-defined Dialyn and Lucia gauges', () => {
    const result = calculateParty(createPreparedState())!
    const yixuan = agent(result, 'yixuan')
    const dialynImpact = metric(agent(result, 'dialyn'), 'impact')
    const luciaSheer = metric(agent(result, 'lucia'), 'squadSheerForce')

    expect(yixuan.metrics.every((item) => item.gauge === undefined)).toBe(true)
    expect(dialynImpact.values.combat).toBeCloseTo(160.8)
    expect(dialynImpact.gauge).toMatchObject({
      source: 'Dialyn · Core Passive',
      current: 75.4,
      threshold: 50,
      cap: 100,
      outputValue: expect.closeTo(50.8),
    })
    expect(luciaSheer.gauge).toMatchObject({
      source: 'Lucia · EX Special Attack',
      current: 21697.1,
      cap: 24000,
      outputValue: expect.closeTo(814.7927),
    })
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
