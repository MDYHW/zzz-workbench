import { describe, expect, it } from 'vitest'
import { calculateParty } from './calculate'
import {
  ADMITTED_AGENTS,
  DRIVE_DISC_FACTS,
  MAIN_STATS,
  VERTICAL_VALUES,
  W_ENGINE_FACTS,
  W_ENGINES,
  equipmentEffectBaseValue,
  isFocusEligible,
  type AgentId,
} from './content'
import { createPreparedState, workbenchReducer, type AppliedSlot } from './state'

const SAFE_COMPANIONS: readonly AgentId[] = ['yixuan', 'dialyn', 'lucia']

function profileStateFor(agentId: AgentId) {
  const agentIds = [
    agentId,
    ...SAFE_COMPANIONS.filter((candidate) => candidate !== agentId),
  ].slice(0, 3) as [AgentId, AgentId, AgentId]
  const focusSlot = agentIds.findIndex(isFocusEligible) as AppliedSlot
  if (focusSlot < 0) throw new Error(`Profile fixture requires a Focus: ${agentId}`)
  return createPreparedState({}, agentIds, focusSlot)
}

describe('shared calculation integration', () => {
  it('routes every admitted Agent through the same complete profile evaluator', () => {
    for (const { id } of ADMITTED_AGENTS) {
      const state = profileStateFor(id)
      const result = calculateParty(state)
      expect(result?.agents.map(({ agentId }) => agentId), id)
        .toEqual(state.slots.map(({ agentId }) => agentId))
      expect(result?.agents.find(({ agentId }) => agentId === id)?.metrics.length, id)
        .toBeGreaterThan(0)
    }
  })

  it('projects one composed cross-holder flow without exposing undeclared shared rows', () => {
    const result = calculateParty(createPreparedState())!
    expect(result.agents).toHaveLength(3)
    expect(result.agents.every(({ metrics }) => metrics.length > 0)).toBe(true)

    const hasExternalSource = result.agents.some((agent) => (
      agent.metrics.some(({ breakdown }) => (
        Object.values(breakdown).flat().some(({ ownerAgentId }) => (
          ownerAgentId !== undefined && ownerAgentId !== agent.agentId
        ))
      ))
    ))
    expect(hasExternalSource).toBe(true)
    expect(result.agents.flatMap(({ metrics }) => metrics.map(({ id }) => id)))
      .not.toContain('power')
  })

  it('projects compatible exact anomaly outcomes across current recipient profiles', () => {
    let state = createPreparedState({}, ['jane', 'alice', 'piper'], 0)
    state = workbenchReducer(state, { type: 'setMindscape', slot: 1, mindscape: 2 })
    state = workbenchReducer(state, { type: 'setMindscape', slot: 0, mindscape: 2 })
    const result = calculateParty(state)!
    const agent = (agentId: AgentId) => result.agents.find((entry) => entry.agentId === agentId)!
    const hasSource = (agentId: AgentId, actionId: string, ownerAgentId: AgentId) => (
      agent(agentId).actionModifiers.find(({ id }) => id === actionId)?.breakdown.fully
        .some((source) => source.ownerAgentId === ownerAgentId) ?? false
    )

    expect(hasSource('alice', 'aliceAssaultCritRate', 'jane')).toBe(true)
    expect(hasSource('alice', 'aliceAssaultCritDmg', 'jane')).toBe(true)
    expect(hasSource('alice', 'aliceAssaultDefIgnore', 'jane')).toBe(true)
    expect(hasSource('jane', 'janeAssaultAnomaly', 'alice')).toBe(true)
    expect(hasSource('jane', 'janeDisorderAnomaly', 'alice')).toBe(true)
    expect(hasSource('piper', 'piperAssaultAnomaly', 'alice')).toBe(true)
    expect(hasSource('piper', 'piperDisorder', 'alice')).toBe(true)
  })

  it('composes cross-profile provider predicates and canonical action scope', () => {
    const withMindscape = (
      agentIds: [AgentId, AgentId, AgentId],
      focusSlot: AppliedSlot,
      mindscape: 1 | 2 | 6,
    ) => workbenchReducer(
      createPreparedState({}, agentIds, focusSlot),
      { type: 'setMindscape', slot: 0, mindscape },
    )
    const hasSource = (
      state: ReturnType<typeof createPreparedState>,
      agentId: AgentId,
      metricId: string,
      ownerAgentId: AgentId,
    ) => calculateParty(state)!.agents
      .find((agent) => agent.agentId === agentId)?.metrics
      .find((metric) => metric.id === metricId)?.breakdown.fully
      .some((source) => source.ownerAgentId === ownerAgentId) ?? false

    const anomalyParty = withMindscape(['sunna', 'nangongYu', 'aria'], 2, 1)
    const anomalyResult = calculateParty(anomalyParty)!
    const aria = anomalyResult.agents.find(({ agentId }) => agentId === 'aria')!
    const broadBuildup = aria.metrics.find(({ id }) => id === 'anomalyBuildupBonus')!
    const chainBuildup = aria.actionModifiers
      .find(({ id }) => id === 'chainAttackAnomalyBuildup')!

    expect(chainBuildup.values.fully - broadBuildup.values.fully)
      .toBe(VERTICAL_VALUES.nangongYu.additionalChainBuildup)
    expect(hasSource(anomalyParty, 'aria', 'defReduction', 'sunna')).toBe(true)

    const attackParty = createPreparedState({}, ['miyabi', 'nangongYu', 'sunna'], 0)
    const miyabi = calculateParty(attackParty)!.agents
      .find(({ agentId }) => agentId === 'miyabi')!
    const miyabiBroadBuildup = miyabi.metrics
      .find(({ id }) => id === 'anomalyBuildupBonus')!
    const miyabiChainBuildup = miyabi.actionModifiers
      .find(({ id }) => id === 'chainAttackAnomalyBuildup')!
    expect(miyabiChainBuildup.values.fully - miyabiBroadBuildup.values.fully)
      .toBe(VERTICAL_VALUES.nangongYu.additionalChainBuildup)

    const nangong = anomalyResult.agents.find(({ agentId }) => agentId === 'nangongYu')!
    expect(nangong.metrics.find(({ id }) => id === 'anomalyProficiency')!.breakdown.fully)
      .toContainEqual(expect.objectContaining({
        label: "Phaethon's Melody",
        amount: equipmentEffectBaseValue(DRIVE_DISC_FACTS.phaethonsMelody.fourPiece.anomalyProficiency),
      }))
    expect(nangong.metrics.find(({ id }) => id === 'dmgBonus')!.breakdown.fully)
      .toContainEqual(expect.objectContaining({
        label: "Phaethon's Melody",
        amount: equipmentEffectBaseValue(DRIVE_DISC_FACTS.phaethonsMelody.fourPiece.otherHolderEtherDamage),
      }))

    const incomingAnomaly = calculateParty(createPreparedState({}, ['nangongYu', 'promeia', 'aria'], 2))!
      .agents.find(({ agentId }) => agentId === 'nangongYu')!
      .actionModifiers.find(({ id }) => id === 'nangongAbloom')!
    expect(incomingAnomaly.breakdown.fully)
      .toContainEqual(expect.objectContaining({ ownerAgentId: 'promeia' }))

    let editedNangong = createPreparedState({}, ['nangongYu', 'sunna', 'aria'], 2)
    editedNangong = workbenchReducer(editedNangong, {
      type: 'selectDisc', slot: 0, piece: 'twoPiece', discId: 'pufferElectro',
    })
    editedNangong = workbenchReducer(editedNangong, {
      type: 'selectDisc', slot: 0, piece: 'fourPiece', discId: 'freedomBlues',
    })
    editedNangong = workbenchReducer(editedNangong, {
      type: 'selectMainStat', slot: 0, mainSlot: 'slot5', mainStatId: 'penRatio',
    })
    const editedNangongResult = calculateParty(editedNangong)!.agents
      .find(({ agentId }) => agentId === 'nangongYu')!
    expect(editedNangongResult.metrics.find(({ id }) => id === 'penRatio')!.values.fully)
      .toBe(
        MAIN_STATS.penRatio.numericValue
        + equipmentEffectBaseValue(DRIVE_DISC_FACTS.pufferElectro.twoPiece.penRatio),
      )
    expect(editedNangongResult.metrics.find(({ id }) => id === 'anomalyBuildupResReduction')!.values.fully)
      .toBe(equipmentEffectBaseValue(DRIVE_DISC_FACTS.freedomBlues.fourPiece.buildupResReduction))

    const noTrigger = withMindscape(['sunna', 'nangongYu', 'yixuan'], 2, 1)
    expect(hasSource(noTrigger, 'yixuan', 'stunDmgMultiplier', 'sunna')).toBe(true)
    expect(hasSource(noTrigger, 'yixuan', 'defReduction', 'sunna')).toBe(false)
    expect(calculateParty(noTrigger)!.agents.find(({ agentId }) => agentId === 'yixuan')!
      .metrics.some(({ id }) => id === 'anomalyBuildupBonus')).toBe(false)

    const selfTrigger = withMindscape(['sunna', 'nangongYu', 'yixuan'], 2, 6)
    expect(hasSource(selfTrigger, 'nangongYu', 'defReduction', 'sunna')).toBe(true)
    expect(hasSource(selfTrigger, 'yixuan', 'defReduction', 'sunna')).toBe(false)

    const unqualifiedNangong = withMindscape(['nangongYu', 'yixuan', 'lycaon'], 1, 2)
    expect(hasSource(unqualifiedNangong, 'yixuan', 'stunDmgMultiplier', 'nangongYu'))
      .toBe(false)
  })

  it('preserves a completed stat basis above a lower derived-output cap', () => {
    let state = createPreparedState({}, ['miyabi', 'nangongYu', 'sunna'], 0)
    state = workbenchReducer(state, { type: 'setMindscape', slot: 0, mindscape: 2 })

    const miyabi = calculateParty(state)!.agents.find(({ agentId }) => agentId === 'miyabi')!
    const critRate = miyabi.metrics.find(({ id }) => id === 'critRate')!
    const gauge = critRate.gauges.find(({ basisLabel }) => (
      basisLabel === 'Fully Enabled CRIT Rate'
    ))!

    expect(critRate.values.fully).toBeGreaterThan(gauge.cap!)
    expect(gauge.current).toBe(critRate.values.fully)
    expect(gauge.outputValue).toBe(gauge.outputCap)
  })

  it('inherits canonical Basic effects into Miyabi Basic outcomes without affecting Dodge Counter', () => {
    let state = createPreparedState({}, ['miyabi', 'nangongYu', 'sunna'], 0)
    state = workbenchReducer(state, { type: 'setMindscape', slot: 0, mindscape: 2 })
    state = workbenchReducer(state, {
      type: 'selectDisc', slot: 0, piece: 'twoPiece', discId: 'dawnsBloom',
    })

    const actionModifiers = calculateParty(state)!.agents
      .find(({ agentId }) => agentId === 'miyabi')!.actionModifiers
    const dawnSource = expect.objectContaining({ label: "Dawn's Bloom" })

    const breakdown = (id: string) => Object.values(
      actionModifiers.find((modifier) => modifier.id === id)!.breakdown,
    ).flat()
    expect(breakdown('miyabiShimotsuki')).toContainEqual(dawnSource)
    expect(breakdown('miyabiKazahana')).toContainEqual(dawnSource)
    expect(breakdown('miyabiDodgeCounter')).not.toContainEqual(dawnSource)
  })

  it('composes Initial-AM-derived flat Impact once around shared equipment regions', () => {
    const impactFor = (pool: 'full' | 'nonLimited') => calculateParty(createPreparedState(
      { nangongYu: pool },
      ['nangongYu', 'sunna', 'aria'],
      2,
    ))!.agents.find(({ agentId }) => agentId === 'nangongYu')!
      .metrics.find(({ id }) => id === 'impact')!

    const slot6Am = MAIN_STATS.anomalyMastery.numericValue
    const phaethonAm = equipmentEffectBaseValue(
      DRIVE_DISC_FACTS.phaethonsMelody.twoPiece.anomalyMastery,
    )
    const neonInitialAm = VERTICAL_VALUES.nangongYu.anomalyMastery * (
      1 + (W_ENGINES.neonFantasies.advancedStat.value + slot6Am + phaethonAm) / 100
    )
    const neonExpected = VERTICAL_VALUES.nangongYu.impact
      + neonInitialAm - VERTICAL_VALUES.nangongYu.coreImpactThreshold
    expect(impactFor('full').values.fully).toBeCloseTo(neonExpected, 10)

    const hellfireInitialImpact = VERTICAL_VALUES.nangongYu.impact * (
      1 + W_ENGINES.hellfireGears.advancedStat.value / 100
    )
    const hellfireInitialAm = VERTICAL_VALUES.nangongYu.anomalyMastery * (
      1 + (slot6Am + phaethonAm) / 100
    )
    const hellfireExpected = hellfireInitialImpact * (
      1 + equipmentEffectBaseValue(W_ENGINE_FACTS.hellfireGears.effects.impact, 1) / 100
    ) + hellfireInitialAm - VERTICAL_VALUES.nangongYu.coreImpactThreshold
    expect(impactFor('nonLimited').values.fully).toBeCloseTo(hellfireExpected, 10)
  })

  it('applies equipment interval conditions through direction metadata and bounded holder overrides', () => {
    const lycaonEnergyWith = (focusAgentId: 'corin' | 'ellen') => {
      const companions = focusAgentId === 'corin'
        ? ['corin', 'lycaon', 'lucia'] as const
        : ['ellen', 'lycaon', 'soukaku'] as const
      let state = createPreparedState({}, [...companions], 0)
      state = workbenchReducer(state, {
        type: 'selectEngine', slot: 1, engineId: 'hellfireGears',
      })
      return calculateParty(state)!.agents.find(({ agentId }) => agentId === 'lycaon')!
        .metrics.find(({ id }) => id === 'energyRegen')
    }

    expect(lycaonEnergyWith('corin')).toBeUndefined()
    const offFieldEnergy = lycaonEnergyWith('ellen')!
    expect(offFieldEnergy.breakdown.combat)
      .toContainEqual(expect.objectContaining({ label: 'Hellfire Gears' }))

    const burnice = calculateParty(createPreparedState(
      {}, ['burnice', 'jane', 'seth'], 1,
    ))!.agents.find(({ agentId }) => agentId === 'burnice')!
    expect(burnice.metrics.find(({ id }) => id === 'energyRegen')!.breakdown.combat)
      .toContainEqual(expect.objectContaining({ label: 'Flamemaker Shaker' }))

  })

  it('projects Burnice Afterburn through its retained Assist equipment scope', () => {
    const burnice = calculateParty(createPreparedState(
      {}, ['burnice', 'jane', 'seth'], 1,
    ))!.agents.find(({ agentId }) => agentId === 'burnice')!

    const chaosActionIds = burnice.actionModifiers
      .filter(({ breakdown }) => breakdown.fully.some(({ label }) => label === 'Chaos Jazz'))
      .map(({ id }) => id)
      .sort()

    expect(chaosActionIds).toEqual(['burniceAfterburn', 'burniceExAssistDmg'])
  })

  it('filters selected partial-equipment clauses by holder capability after candidate admission', () => {
    const hasMetricSource = (
      agent: NonNullable<ReturnType<typeof calculateParty>>['agents'][number],
      metricId: string,
      label: string,
      surface: 'combat' | 'fully' = 'fully',
    ) => agent.metrics.find(({ id }) => id === metricId)?.breakdown[surface]
      .some((source) => source.label === label) ?? false
    const hasActionSource = (
      agent: NonNullable<ReturnType<typeof calculateParty>>['agents'][number],
      label: string,
    ) => agent.actionModifiers.some(({ breakdown }) => (
      breakdown.fully.some((source) => source.label === label)
    ))

    let promeiaState = createPreparedState({}, ['promeia', 'sunna', 'nangongYu'], 0)
    promeiaState = workbenchReducer(promeiaState, {
      type: 'selectEngine', slot: 0, engineId: 'angelInTheShell',
    })
    const promeia = calculateParty(promeiaState)!.agents
      .find(({ agentId }) => agentId === 'promeia')!
    expect(hasMetricSource(promeia, 'anomalyProficiency', 'Angel in the Shell', 'combat')).toBe(true)
    expect(hasMetricSource(promeia, 'dmgBonus', 'Angel in the Shell')).toBe(false)
    expect(hasActionSource(promeia, 'Angel in the Shell')).toBe(false)

    const aria = calculateParty(createPreparedState(
      {}, ['aria', 'sunna', 'nangongYu'], 0,
    ))!.agents.find(({ agentId }) => agentId === 'aria')!
    expect(hasMetricSource(aria, 'dmgBonus', 'Angel in the Shell')).toBe(true)
    expect(hasActionSource(aria, 'Angel in the Shell')).toBe(true)

    let vivianState = createPreparedState({}, ['vivian', 'aria', 'sunna'], 1)
    vivianState = workbenchReducer(vivianState, {
      type: 'selectEngine', slot: 0, engineId: 'angelInTheShell',
    })
    const vivian = calculateParty(vivianState)!.agents
      .find(({ agentId }) => agentId === 'vivian')!
    expect(hasMetricSource(vivian, 'anomalyProficiency', 'Angel in the Shell', 'combat')).toBe(true)
    expect(hasMetricSource(vivian, 'dmgBonus', 'Angel in the Shell')).toBe(false)
    expect(hasActionSource(vivian, 'Angel in the Shell')).toBe(false)

    let orphieState = createPreparedState({}, ['orphie', 'pulchra', 'lucy'], 0)
    orphieState = workbenchReducer(orphieState, {
      type: 'selectEngine', slot: 0, engineId: 'serpentineSeeker',
    })
    const orphie = calculateParty(orphieState)!.agents
      .find(({ agentId }) => agentId === 'orphie')!
    expect(hasMetricSource(orphie, 'critRate', 'Serpentine Seeker', 'combat')).toBe(true)
    expect(hasMetricSource(orphie, 'defIgnore', 'Serpentine Seeker', 'combat')).toBe(false)

    const cissia = calculateParty(createPreparedState(
      {}, ['cissia', 'anby', 'lucia'], 0,
    ))!.agents.find(({ agentId }) => agentId === 'cissia')!
    expect(hasMetricSource(cissia, 'critRate', 'Serpentine Seeker', 'combat')).toBe(true)
    expect(hasMetricSource(cissia, 'defIgnore', 'Serpentine Seeker', 'combat')).toBe(true)
  })

  it('returns no Result while any required Setup selection is incomplete', () => {
    const state = createPreparedState()
    const incomplete = {
      ...state,
      slots: [...state.slots] as typeof state.slots,
    }
    incomplete.slots[0] = {
      ...incomplete.slots[0],
      setup: { ...incomplete.slots[0].setup, engineId: null },
    }
    expect(calculateParty(incomplete)).toBeNull()
  })

})
