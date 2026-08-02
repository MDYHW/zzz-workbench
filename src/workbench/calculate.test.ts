import { describe, expect, it } from 'vitest'
import { calculateParty, type AgentResult } from './calculate'
import { createPreparedState, workbenchReducer, type WorkbenchState } from './state'

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

describe('calculateParty', () => {
  it('calculates the authored Qingming prepared baseline', () => {
    const result = calculateParty(createPreparedState())
    expect(result).not.toBeNull()
    const yixuan = agent(result!, 'yixuan')

    expect(metric(yixuan, 'maxHp').values.initial).toBeCloseTo(16434.1)
    expect(metric(yixuan, 'atk').values.initial).toBeCloseTo(1931)
    expect(metric(yixuan, 'sheerForce').values.initial).toBeCloseTo(2222.71)
    expect(metric(yixuan, 'critRate').values.combat).toBeCloseTo(71.4)
    expect(metric(yixuan, 'critRate').values.fully).toBeCloseTo(83.4)
    expect(metric(yixuan, 'sheerForce').values.fully).toBeCloseTo(3366.1847)
    expect(result!.actionModifiers.map((row) => row.label)).toEqual([
      'All Sheer actions',
      'Core-supported actions',
      'EX Special & Ultimate',
    ])
  })

  it('calculates the Cauldron package without inventing an EX-only action row', () => {
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
    expect(result.actionModifiers).toHaveLength(2)
  })

  it('keeps action aggregates reproducible from atomic source amounts', () => {
    const full = calculateParty(createPreparedState())!
    const cauldronState = workbenchReducer(createPreparedState(), {
      type: 'selectEngine',
      engineId: 'cauldron',
    })
    const cauldron = calculateParty(cauldronState)!

    for (const result of [full, cauldron]) {
      for (const row of result.actionModifiers) {
        expect(row.sources.combat.reduce((sum, item) => sum + item.amount, 0)).toBeCloseTo(row.combat)
        expect(row.sources.fully.reduce((sum, item) => sum + item.amount, 0)).toBeCloseTo(row.fully)
      }
    }

    const exUltimate = full.actionModifiers.find((row) => row.id === 'exUltimate')!
    expect(exUltimate.sources.combat.map((item) => item.amount)).toEqual([16, 20, 30])
    expect(exUltimate.sources.combat.some((item) => item.source.includes('EX/Ultimate'))).toBe(true)
  })
  it('recalculates each retained effective substat on its consumed axes', () => {
    const prepared = createPreparedState()
    const baseline = calculateParty(prepared)!
    const baselineYixuan = agent(baseline, 'yixuan')

    const critRate = calculateParty(workbenchReducer(prepared, { type: 'setSubstat', key: 'critRate', value: 1 }))!
    const critRateYixuan = agent(critRate, 'yixuan')
    expect(metric(critRateYixuan, 'critRate').values.fully
      - metric(baselineYixuan, 'critRate').values.fully).toBeCloseTo(2.4)
    expect(metric(critRateYixuan, 'maxHp').values.initial).toBe(metric(baselineYixuan, 'maxHp').values.initial)
    expect(metric(critRateYixuan, 'critDmg').values.fully).toBe(metric(baselineYixuan, 'critDmg').values.fully)

    const critDmg = calculateParty(workbenchReducer(prepared, { type: 'setSubstat', key: 'critDmg', value: 1 }))!
    const critDmgYixuan = agent(critDmg, 'yixuan')
    expect(metric(critDmgYixuan, 'critDmg').values.fully
      - metric(baselineYixuan, 'critDmg').values.fully).toBeCloseTo(4.8)
    expect(metric(critDmgYixuan, 'critRate').values.fully).toBe(metric(baselineYixuan, 'critRate').values.fully)

    const hp = calculateParty(workbenchReducer(prepared, { type: 'setSubstat', key: 'hpPct', value: 1 }))!
    expect(metric(agent(hp, 'yixuan'), 'maxHp').values.initial
      - metric(baselineYixuan, 'maxHp').values.initial).toBeCloseTo(251.19)
    const hpYixuan = agent(hp, 'yixuan')
    expect(metric(hpYixuan, 'sheerForce').values.fully
      - metric(baselineYixuan, 'sheerForce').values.fully).toBeCloseTo(30.1428)
    expect(metric(hpYixuan, 'atk').values.initial).toBe(metric(baselineYixuan, 'atk').values.initial)

    const atk = calculateParty(workbenchReducer(prepared, { type: 'setSubstat', key: 'atkPct', value: 1 }))!
    expect(metric(agent(atk, 'yixuan'), 'atk').values.initial
      - metric(baselineYixuan, 'atk').values.initial).toBeCloseTo(48.45)
    const atkYixuan = agent(atk, 'yixuan')
    expect(metric(atkYixuan, 'sheerForce').values.fully
      - metric(baselineYixuan, 'sheerForce').values.fully).toBeCloseTo(14.535)
    expect(metric(atkYixuan, 'maxHp').values.initial).toBe(metric(baselineYixuan, 'maxHp').values.initial)
  })

  it('caps displayed CRIT Rate at 100%', () => {
    const state = workbenchReducer(createPreparedState(), {
      type: 'setSubstat',
      key: 'critRate',
      value: 36,
    })
    expect(metric(agent(calculateParty(state)!, 'yixuan'), 'critRate').values.fully).toBe(100)
  })

  it('exposes the current Lucia cap and Dialyn threshold consequences', () => {
    const result = calculateParty(createPreparedState())!
    const luciaHp = metric(agent(result, 'lucia'), 'maxHp')
    const dialynCrit = metric(agent(result, 'dialyn'), 'critRate')
    const dialynImpact = metric(agent(result, 'dialyn'), 'impact')

    expect(luciaHp.values.initial).toBeCloseTo(21697.1)
    expect(luciaHp.gauge?.outputValue).toBeCloseTo(814.7927)
    expect(luciaHp.gauge?.cap).toBe(24000)
    expect(dialynCrit.values.initial).toBeCloseTo(75.4)
    expect(dialynCrit.gauge?.outputValue).toBeCloseTo(50.8)
    expect(dialynImpact.values.combat).toBeCloseTo(160.8)
  })

  it('returns no Result when a required target selection is incomplete', () => {
    const prepared = createPreparedState()
    const missingEngine: WorkbenchState = { ...prepared, engineId: null }
    const missingEquipment: WorkbenchState = { ...prepared, equipment: null }
    const missingCount: WorkbenchState = {
      ...prepared,
      substats: { ...prepared.substats, hpPct: Number.NaN },
    }

    expect(calculateParty(missingEngine)).toBeNull()
    expect(calculateParty(missingEquipment)).toBeNull()
    expect(calculateParty(missingCount)).toBeNull()
  })
})
