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
  equipmentEffectMaximumValue,
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

  it('projects Pyrois Mirage once without neutral Ultimate-form rows', () => {
    const pyrois = calculateParty(createPreparedState(
      {}, ['pyrois', 'dialyn', 'lucia'], 0,
    ))!.agents.find(({ agentId }) => agentId === 'pyrois')!
    const ultimateRows = pyrois.actionModifiers.filter(({ id }) => id.startsWith('pyrois'))
    const [parent] = ultimateRows

    expect(ultimateRows).toHaveLength(1)
    expect(parent.id).toBe('pyroisUltimate')
    expect(parent.outcomes).toEqual([{ kind: 'canonical', action: 'Ultimate' }])
    expect(parent.breakdown.fully).toContainEqual(expect.objectContaining({
      ownerAgentId: 'pyrois',
      detail: 'Mirage · Against Stunned enemies',
    }))
    const eclipse = pyrois.metrics.find(({ id }) => id === 'resIgnore')!
    expect(eclipse.values.combat).toBe(
      equipmentEffectBaseValue(W_ENGINE_FACTS.solExuvia.effects.eclipseEtherResIgnore, 1),
    )
    expect(eclipse.values.fully).toBe(eclipse.values.combat)
  })

  it('projects Sigrid through broad, qualified, and exact action relationships', () => {
    const state = workbenchReducer(
      createPreparedState({}, ['sigrid', 'dialyn', 'lucia'], 0),
      { type: 'setMindscape', slot: 0, mindscape: 4 },
    )
    const sigrid = calculateParty(state)!.agents
      .find(({ agentId }) => agentId === 'sigrid')!
    const metric = (id: string) => sigrid.metrics.find((entry) => entry.id === id)!
    const action = (id: string) => sigrid.actionModifiers.find((entry) => entry.id === id)!
    const hasSource = (
      breakdown: { fully: readonly { label: string }[] },
      label: string,
    ) => breakdown.fully.some((source) => source.label === label)
    expect(metric('critRate').values.fully).toBe(
      VERTICAL_VALUES.sigrid.critRate + VERTICAL_VALUES.sigrid.coreCritRate,
    )
    expect(metric('critDmg').breakdown.initial).toEqual(expect.arrayContaining([
      expect.objectContaining({
        label: "Knight's Extolment",
        amount: W_ENGINES.knightsExtolment.advancedStat.value,
      }),
      expect.objectContaining({
        label: 'Drive Disc · Slot 4',
        amount: MAIN_STATS.critDmg.numericValue,
      }),
    ]))
    expect(metric('critDmg').breakdown.fully).toContainEqual(expect.objectContaining({
      label: "Knight's Extolment",
      amount: equipmentEffectMaximumValue(
        W_ENGINE_FACTS.knightsExtolment.effects.critDamage,
        1,
      ),
    }))
    expect(metric('resIgnore').values.fully).toBe(
      equipmentEffectBaseValue(W_ENGINE_FACTS.knightsExtolment.effects.iceResIgnore, 1),
    )
    expect(hasSource(metric('atk').breakdown, 'Additional Ability')).toBe(true)
    expect(metric('atk').breakdown.combat).toContainEqual(expect.objectContaining({
      label: 'Mindscape',
      display: expect.objectContaining({ value: VERTICAL_VALUES.sigrid.mindscape1Atk }),
    }))
    expect(hasSource(metric('dmgBonus').breakdown, 'Mindscape')).toBe(true)
    expect(metric('stunDmgMultiplier').breakdown.fully).toContainEqual(
      expect.objectContaining({
        label: 'Core Passive',
        amount: VERTICAL_VALUES.sigrid.coreStunDmgMultiplier,
      }),
    )
    expect(sigrid.metrics.some(({ id }) => id === 'dazeBonus')).toBe(false)
    expect(sigrid.actionModifiers.some(({ metricId }) => metricId === 'dazeBonus')).toBe(false)
    expect(sigrid.actionModifiers.some(
      ({ metricId }) => metricId === 'stunDmgMultiplier',
    )).toBe(false)
    expect(action('sigridConvergingSpearDmg')).toMatchObject({
      outcomes: [{ kind: 'form', action: 'Basic Attack', form: 'Converging Spear' }],
    })
    expect(hasSource(action('sigridConvergingSpearDmg').breakdown, 'Chain Attack')).toBe(true)
    expect(action('sigridUnbridledConvergingPen')).toMatchObject({
      outcomes: [
        { kind: 'source-local', label: 'Unbridled Spear attacks' },
        { kind: 'form', action: 'Basic Attack', form: 'Converging Spear' },
      ],
    })
    expect(hasSource(action('sigridUnbridledConvergingPen').breakdown, 'Mindscape')).toBe(true)
    const unqualified = calculateParty(createPreparedState(
      {}, ['sigrid', 'yixuan', 'manato'], 0,
    ))!.agents.find(({ agentId }) => agentId === 'sigrid')!
    expect(hasSource(
      unqualified.metrics.find(({ id }) => id === 'atk')!.breakdown,
      'Additional Ability',
    )).toBe(false)
  })

  it('keeps Velina Windswept inheritance, Vortex coefficient, and Focus Contamination distinct', () => {
    const state = workbenchReducer(
      createPreparedState({}, ['velina', 'promeia', 'aria'], 1),
      { type: 'setMindscape', slot: 0, mindscape: 2 },
    )
    const result = calculateParty(state)!
    const velina = result.agents.find(({ agentId }) => agentId === 'velina')!
    const promeia = result.agents.find(({ agentId }) => agentId === 'promeia')!
    const metric = (id: string) => velina.metrics.find((entry) => entry.id === id)!
    const action = (id: string) => velina.actionModifiers.find((entry) => entry.id === id)!
    const hasSource = (
      breakdown: { fully: readonly { label: string }[] },
      label: string,
    ) => breakdown.fully.some((source) => source.label === label)
    const hasOwner = (
      breakdown: { fully: readonly { ownerAgentId?: string }[] },
      ownerAgentId: string,
    ) => breakdown.fully.some((source) => source.ownerAgentId === ownerAgentId)

    expect(velina.operations).toContainEqual(expect.objectContaining({
      label: 'Added Vortex DMG Multiplier',
      source: expect.objectContaining({ label: 'Core Passive' }),
    }))
    expect(velina.operations.some(
      ({ label }) => label === 'Chromatic Tint buildup contribution to Anomaly DMG',
    )).toBe(false)

    const energyRegen = metric('energyRegen')
    const coreGauge = energyRegen.gauges.find(({ source }) => source.label === 'Core Passive')!
    expect(energyRegen.values.initial).toBeCloseTo(VERTICAL_VALUES.velina.coreEnergyCap, 10)
    expect(coreGauge.current).toBeCloseTo(VERTICAL_VALUES.velina.coreEnergyCap, 10)
    expect(coreGauge).toMatchObject({
      basisLabel: 'Initial Energy Regen',
      threshold: VERTICAL_VALUES.velina.coreEnergyThreshold,
      cap: VERTICAL_VALUES.velina.coreEnergyCap,
      outputLabel: 'DMG Bonus',
      outputValue: VERTICAL_VALUES.velina.coreDmgCap,
      outputCap: VERTICAL_VALUES.velina.coreDmgCap,
      additionalOutputs: [{
        label: 'Anomaly Mastery',
        value: VERTICAL_VALUES.velina.coreMasteryCap,
        cap: VERTICAL_VALUES.velina.coreMasteryCap,
      }],
    })
    expect(metric('dmgBonus').breakdown.fully).toContainEqual(expect.objectContaining({
      label: 'Core Passive',
      amount: VERTICAL_VALUES.velina.coreDmgCap,
    }))
    expect(metric('anomalyMastery').breakdown.fully).toContainEqual(expect.objectContaining({
      label: 'Core Passive',
      amount: VERTICAL_VALUES.velina.coreMasteryCap,
    }))

    const underCapState = createPreparedState(
      { velina: 'nonLimited' }, ['velina', 'promeia', 'aria'], 1,
    )
    expect(underCapState.slots[0].setup.engineId).toBe('weepingGemini')
    const underCapVelina = calculateParty(underCapState)!.agents
      .find(({ agentId }) => agentId === 'velina')!
    const underCapMetric = (id: string) => underCapVelina.metrics
      .find((entry) => entry.id === id)!
    const underCapEnergy = underCapMetric('energyRegen')
    const underCapGauge = underCapEnergy.gauges
      .find(({ source }) => source.label === 'Core Passive')!
    const eligibleEnergy = Math.max(
      underCapEnergy.values.initial - VERTICAL_VALUES.velina.coreEnergyThreshold,
      0,
    )
    const expectedDmg = eligibleEnergy / 0.01 * VERTICAL_VALUES.velina.coreDmgPerEnergy
    const expectedMastery = eligibleEnergy / 0.01
      * VERTICAL_VALUES.velina.coreMasteryPerEnergy
    expect(underCapEnergy.values.initial).toBeLessThan(VERTICAL_VALUES.velina.coreEnergyCap)
    expect(underCapGauge.current).toBeCloseTo(underCapEnergy.values.initial, 10)
    expect(underCapGauge.outputValue).toBeCloseTo(expectedDmg, 10)
    expect(underCapGauge.outputValue).toBeLessThan(VERTICAL_VALUES.velina.coreDmgCap)
    expect(underCapGauge.additionalOutputs?.[0]?.value).toBeCloseTo(expectedMastery, 10)
    expect(underCapGauge.additionalOutputs?.[0]?.value)
      .toBeLessThan(VERTICAL_VALUES.velina.coreMasteryCap)
    expect(underCapMetric('dmgBonus').breakdown.fully).toContainEqual(
      expect.objectContaining({ label: 'Core Passive', amount: expectedDmg }),
    )
    expect(underCapMetric('anomalyMastery').breakdown.fully).toContainEqual(
      expect.objectContaining({ label: 'Core Passive', amount: expectedMastery }),
    )

    expect(action('velinaWindswept').outcomes).toEqual([
      { kind: 'source-local', label: 'Windswept' },
    ])
    for (const [id, outcomes] of [
      ['velinaCondensedCycloneAbloom', [
        { kind: 'source-local', label: 'Condensed Cyclone' },
        { kind: 'source-local', label: 'Abloom' },
      ]],
      ['velinaSweepingCycloneAbloom', [
        { kind: 'source-local', label: 'Sweeping Cyclone' },
        { kind: 'source-local', label: 'Abloom' },
      ]],
      ['velinaUltimateAbloom', [
        { kind: 'canonical', action: 'Ultimate' },
        { kind: 'source-local', label: 'Abloom' },
      ]],
    ] as const) {
      expect(action(id)).toMatchObject({ outcomes, baseActionId: 'velinaWindswept' })
    }
    expect(action('velinaVortex').outcomes).toEqual([
      { kind: 'source-local', label: 'Vortex' },
    ])
    expect(action('velinaVortex').baseActionId).toBeUndefined()
    for (const [id, amount] of [
      ['velinaWindswept', VERTICAL_VALUES.velina.additionalAnomalyDmg],
      ['velinaVortex', VERTICAL_VALUES.velina.additionalAnomalyDmg],
      ['velinaSweepingCycloneBuildup', VERTICAL_VALUES.velina.additionalBuildup],
    ] as const) {
      expect(action(id).breakdown.fully).toContainEqual(expect.objectContaining({
        label: 'Additional Ability', amount,
      }))
    }
    expect(velina.metrics.some(({ id }) => id === 'dazeBonus')).toBe(false)
    expect(velina.actionModifiers.some(
      ({ id }) => id === 'velinaSweepingCycloneDaze',
    )).toBe(false)
    expect(velina.actionModifiers.some(({ outcomes }) => (
      outcomes.some((outcome) => outcome.kind === 'source-local' && outcome.label === 'Disorder')
    ))).toBe(false)
    for (const id of [
      'velinaCondensedCycloneAbloom',
      'velinaSweepingCycloneAbloom',
      'velinaUltimateAbloom',
    ]) expect(hasOwner(action(id).breakdown, 'promeia')).toBe(true)
    expect(hasOwner(action('velinaVortex').breakdown, 'promeia')).toBe(false)

    const ordinaryVelina = calculateParty(createPreparedState(
      {}, ['velina', 'yanagi', 'lucia'], 1,
    ))!.agents.find(({ agentId }) => agentId === 'velina')!
    for (const id of [
      'velinaCondensedCycloneAbloom',
      'velinaSweepingCycloneAbloom',
      'velinaUltimateAbloom',
    ]) expect(ordinaryVelina.actionModifiers.some((entry) => entry.id === id)).toBe(false)
    expect(ordinaryVelina.actionModifiers.some(
      ({ id }) => id === 'velinaWindswept',
    )).toBe(true)
    expect(ordinaryVelina.actionModifiers.some(
      ({ id }) => id === 'velinaVortex',
    )).toBe(true)

    const unqualifiedM0 = calculateParty(createPreparedState(
      { velina: 'nonLimited' }, ['velina', 'pyrois', 'lucia'], 1,
    ))!.agents.find(({ agentId }) => agentId === 'velina')!
    for (const id of [
      'velinaWindswept',
      'velinaVortex',
      'velinaCondensedCycloneAbloom',
      'velinaSweepingCycloneAbloom',
      'velinaUltimateAbloom',
    ]) expect(unqualifiedM0.actionModifiers.some((entry) => entry.id === id)).toBe(false)

    const contamination = promeia.metrics.find(
      ({ id }) => id === 'anomalyBuildupResReduction',
    )!
    expect(contamination.breakdown.fully).toEqual(expect.arrayContaining([
      expect.objectContaining({
        label: 'Additional Ability',
        amount: VERTICAL_VALUES.velina.additionalBuildupResReduction,
        ownerAgentId: 'velina',
        detail: 'Contamination Attribute · selected by Focus',
      }),
    ]))

    const windParty = calculateParty(createPreparedState(
      {}, ['velina', 'lycaon', 'aria'], 2,
    ))!
    const windRecipient = windParty.agents.find(({ agentId }) => agentId === 'velina')!
    expect(windRecipient.metrics.find(({ id }) => id === 'dmgBonus')!.breakdown.fully)
      .toContainEqual(expect.objectContaining({
        ownerAgentId: 'lycaon',
        amount: VERTICAL_VALUES.lycaon.coreOtherAttributeDmg,
      }))

    const iceParty = calculateParty(createPreparedState(
      {}, ['ellen', 'lycaon', 'soukaku'], 0,
    ))!
    const iceRecipient = iceParty.agents.find(({ agentId }) => agentId === 'ellen')!
    expect(iceRecipient.metrics.find(({ id }) => id === 'dmgBonus')!.breakdown.fully
      .some(({ ownerAgentId }) => ownerAgentId === 'lycaon')).toBe(false)
    expect(iceRecipient.metrics.find(({ id }) => id === 'resReduction')!.breakdown.fully
      .some(({ ownerAgentId }) => ownerAgentId === 'lycaon')).toBe(true)

    const unqualifiedState = workbenchReducer(
      createPreparedState({}, ['velina', 'pyrois', 'lucia'], 1),
      { type: 'setMindscape', slot: 0, mindscape: 6 },
    )
    const unqualifiedResult = calculateParty(unqualifiedState)!
    const unqualifiedVelina = unqualifiedResult.agents.find(({ agentId }) => agentId === 'velina')!
    const unqualifiedAction = (id: string) => unqualifiedVelina.actionModifiers
      .find((entry) => entry.id === id)!
    const unqualifiedMetric = (id: string) => unqualifiedVelina.metrics
      .find((entry) => entry.id === id)!

    for (const entry of [
      unqualifiedAction('velinaVortex'),
      unqualifiedAction('velinaWindswept'),
    ]) expect(hasSource(entry.breakdown, 'Additional Ability')).toBe(false)
    expect(unqualifiedVelina.metrics.some(({ id }) => id === 'dazeBonus')).toBe(false)
    expect(unqualifiedVelina.actionModifiers.some(
      ({ id }) => id === 'velinaSweepingCycloneDaze',
    )).toBe(false)
    expect(hasSource(unqualifiedMetric('atk').breakdown, 'Mindscape')).toBe(true)
    expect(hasSource(unqualifiedAction('velinaWindTargetBuildup').breakdown, 'Mindscape')).toBe(true)
    expect(hasSource(unqualifiedAction('velinaWindswept').breakdown, 'Mindscape')).toBe(true)
    expect(unqualifiedResult.agents.find(({ agentId }) => agentId === 'pyrois')!.metrics
      .some(({ id }) => id === 'anomalyBuildupResReduction')).toBe(false)
  })

  it('keeps Remielle Refringe, Luminize, ordinary anomaly bonuses, and Mindscape effects distinct', () => {
    const m0State = createPreparedState({}, ['remielle', 'promeia', 'velina'], 1)
    const m0Remielle = calculateParty(m0State)!.agents
      .find(({ agentId }) => agentId === 'remielle')!
    const m0Action = (id: string) => m0Remielle.actionModifiers
      .find((entry) => entry.id === id)
    const m0Ap = m0Remielle.metrics
      .find(({ id }) => id === 'anomalyProficiency')!.values.fully

    expect(m0Action('remielleRefringe')!.values.fully).toBeCloseTo(
      m0Ap * VERTICAL_VALUES.remielle.refringePerAnomalyProficiency
        + VERTICAL_VALUES.remielle.tripleAnomalyRefringe,
      10,
    )
    expect(m0Action('remielleRefringe')!.standaloneMetric?.parentMetricId)
      .toBe('anomalyProficiency')
    expect(m0Action('remielleLuminize')!.values.fully).toBeCloseTo(
      m0Ap * VERTICAL_VALUES.remielle.luminizePerAnomalyProficiency,
      10,
    )
    expect(m0Action('remielleLuminize')!.standaloneMetric?.parentMetricId)
      .toBe('anomalyProficiency')
    expect(m0Remielle.metrics.find(({ id }) => id === 'dmgBonus')!
      .breakdown.fully).toContainEqual(expect.objectContaining({
        label: 'Special Attack',
        detail: 'Phase Flow',
        amount: VERTICAL_VALUES.remielle.phaseFlowDmgBySkillTier[0],
      }))
    expect(m0Action('remielleLuminizeResIgnore')).toBeUndefined()
    expect(m0Remielle.operations.some(({ label }) => (
      label === 'Rainbow’s End / Fleeting Grace · Luminize triggers'
    ))).toBe(false)

    const state = workbenchReducer(
      m0State,
      { type: 'setMindscape', slot: 0, mindscape: 6 },
    )
    const result = calculateParty(state)!
    const remielle = result.agents.find(({ agentId }) => agentId === 'remielle')!
    const action = (id: string) => remielle.actionModifiers.find((entry) => entry.id === id)!
    const metric = (id: string) => remielle.metrics.find((entry) => entry.id === id)!
    const ap = metric('anomalyProficiency').values.fully
    const refringe = action('remielleRefringe')
    const luminize = action('remielleLuminize')
    const attributeAnomaly = action('remielleAttributeAnomaly')

    expect(refringe.metricId).toBe('refringeFactor')
    expect(refringe.values.fully).toBeCloseTo(
      ap * VERTICAL_VALUES.remielle.refringePerAnomalyProficiency
        + VERTICAL_VALUES.remielle.tripleAnomalyRefringe
        + VERTICAL_VALUES.remielle.mindscape2Refringe,
      10,
    )
    expect(refringe.breakdown.fully.map(({ label }) => label)).toEqual([
      'Core Passive',
      'Mindscape',
      'Core Passive',
    ])
    expect(luminize.metricId).toBe('luminizeMultiplier')
    expect(luminize.values.fully).toBeCloseTo(
      ap * VERTICAL_VALUES.remielle.luminizePerAnomalyProficiency
        + VERTICAL_VALUES.remielle.mindscape4LuminizeMultiplier,
      10,
    )
    expect(attributeAnomaly.metricId).toBe('anomalyDmgBonus')
    const attributeAnomalySources = attributeAnomaly.breakdown.fully
      .map(({ label }) => label)
    expect(attributeAnomalySources.filter((label) => (
      label === 'Ode of Resurrected Wings'
    ))).toHaveLength(1)
    expect(attributeAnomalySources.filter((label) => (
      label === 'Feathered Fate'
    ))).toHaveLength(1)
    expect(remielle.actionModifiers.some(({ id }) => (
      id === 'remielleLuminizeAnomaly'
    ))).toBe(false)
    expect(remielle.actionModifiers.filter(({ id }) => id === 'remielleRefringe'))
      .toHaveLength(1)
    expect(action('remielleLuminizeResIgnore').values.fully).toBe(
      VERTICAL_VALUES.remielle.mindscape1LuminizeResIgnore,
    )
    expect(remielle.metrics.some(({ id }) => id === 'anomalyMastery')).toBe(false)
    expect(remielle.metrics.some(({ id }) => id === 'energyRegen')).toBe(false)
    expect(remielle.metrics.some(({ id }) => id === 'dazeBonus')).toBe(false)
    expect(remielle.actionModifiers.some(
      ({ id }) => id === 'remiellePhaseFlowDaze',
    )).toBe(false)
    expect(metric('dmgBonus').breakdown.fully).toContainEqual(expect.objectContaining({
      label: 'Special Attack',
      detail: 'Phase Flow',
      amount: VERTICAL_VALUES.remielle.phaseFlowDmgBySkillTier[2],
    }))
    expect(metric('anomalyBuildupBonus').breakdown.fully).toContainEqual(
      expect.objectContaining({
        label: 'Additional Ability',
        detail: 'Prismatic target',
        amount: VERTICAL_VALUES.remielle.additionalBuildup,
      }),
    )
    const threeAnomalyAtkGauge = metric('atk').gauges.find(({ outputLabel }) => (
      outputLabel === 'Squad flat ATK'
    ))!
    expect(threeAnomalyAtkGauge).toEqual(expect.objectContaining({
      basisLabel: 'Initial ATK',
      current: metric('atk').values.initial,
      outputLabel: 'Squad flat ATK',
      outputValue: Math.min(
        metric('atk').values.initial
          * VERTICAL_VALUES.remielle.additionalAtkRatioByAnomalyCount[2] / 100,
        VERTICAL_VALUES.remielle.additionalAtkCap,
      ),
      outputCap: VERTICAL_VALUES.remielle.additionalAtkCap,
    }))
    const threeAnomalyRecipient = result.agents.find(({ agentId }) => (
      agentId === 'promeia'
    ))!
    expect(threeAnomalyRecipient.metrics.find(({ id }) => id === 'atk')!
      .breakdown.fully).toContainEqual(expect.objectContaining({
      label: 'Additional Ability',
      ownerAgentId: 'remielle',
      amount: threeAnomalyAtkGauge.outputValue,
    }))

    const twoAnomalyResult = calculateParty(createPreparedState(
      {}, ['remielle', 'promeia', 'lucia'], 1,
    ))!
    const twoAnomalyRemielle = twoAnomalyResult.agents.find(({ agentId }) => (
      agentId === 'remielle'
    ))!
    const twoAnomalyAtk = twoAnomalyRemielle.metrics.find(({ id }) => id === 'atk')!
    const twoAnomalyAtkGauge = twoAnomalyAtk.gauges.find(({ outputLabel }) => (
      outputLabel === 'Squad flat ATK'
    ))!
    expect(twoAnomalyAtkGauge).toEqual(expect.objectContaining({
      current: twoAnomalyAtk.values.initial,
      outputValue: Math.min(
        twoAnomalyAtk.values.initial
          * VERTICAL_VALUES.remielle.additionalAtkRatioByAnomalyCount[1] / 100,
        VERTICAL_VALUES.remielle.additionalAtkCap,
      ),
      outputCap: VERTICAL_VALUES.remielle.additionalAtkCap,
    }))
    expect(twoAnomalyAtkGauge.outputValue).toBeLessThan(threeAnomalyAtkGauge.outputValue)
    const twoAnomalyRecipient = twoAnomalyResult.agents.find(({ agentId }) => (
      agentId === 'promeia'
    ))!
    expect(twoAnomalyRecipient.metrics.find(({ id }) => id === 'atk')!
      .breakdown.fully).toContainEqual(expect.objectContaining({
        label: 'Additional Ability',
      ownerAgentId: 'remielle',
      amount: twoAnomalyAtkGauge.outputValue,
      }))

    const m3Remielle = calculateParty(workbenchReducer(
      m0State,
      { type: 'setMindscape', slot: 0, mindscape: 3 },
    ))!.agents.find(({ agentId }) => agentId === 'remielle')!
    expect(m3Remielle.metrics.find(({ id }) => id === 'dmgBonus')!
      .breakdown.fully).toContainEqual(expect.objectContaining({
        label: 'Special Attack',
        detail: 'Phase Flow',
        amount: VERTICAL_VALUES.remielle.phaseFlowDmgBySkillTier[1],
      }))

    const mindscapeRecipients = calculateParty(workbenchReducer(
      createPreparedState({}, ['remielle', 'promeia', 'lucia'], 1),
      { type: 'setMindscape', slot: 0, mindscape: 2 },
    ))!
    const mindscapePromeia = mindscapeRecipients.agents.find(({ agentId }) => (
      agentId === 'promeia'
    ))!
    const mindscapeLucia = mindscapeRecipients.agents.find(({ agentId }) => (
      agentId === 'lucia'
    ))!
    expect(mindscapePromeia.actionModifiers.find(({ id }) => (
      id === 'promeiaAttributeAnomaly'
    ))!.breakdown.fully).toContainEqual(expect.objectContaining({
      label: 'Mindscape',
      ownerAgentId: 'remielle',
      amount: VERTICAL_VALUES.remielle.mindscape1OtherAnomalyDmg,
    }))
    expect(mindscapePromeia.metrics.find(({ id }) => id === 'defIgnore')!
      .breakdown.fully).toContainEqual(expect.objectContaining({
        label: 'Mindscape',
        ownerAgentId: 'remielle',
        amount: VERTICAL_VALUES.remielle.mindscape2AnomalyDefIgnore,
      }))
    expect(mindscapeLucia.metrics.some(({ id, breakdown }) => (
      (id === 'anomalyDmgBonus' || id === 'defIgnore')
      && breakdown.fully.some(({ ownerAgentId }) => ownerAgentId === 'remielle')
    ))).toBe(false)

    const inactiveResult = calculateParty(createPreparedState(
      {}, ['remielle', 'sigrid', 'lucia'], 1,
    ))!
    const inactiveRemielle = inactiveResult.agents.find(({ agentId }) => (
      agentId === 'remielle'
    ))!
    expect(inactiveRemielle.metrics.find(({ id }) => id === 'atk')!.gauges
      .some(({ source }) => source.label === 'Additional Ability')).toBe(false)
    expect(inactiveRemielle.metrics.some(({ id }) => id === 'anomalyBuildupBonus'))
      .toBe(false)
    for (const recipient of inactiveResult.agents) {
      expect(recipient.metrics.find(({ id }) => id === 'atk')?.breakdown.fully
        .some(({ label, ownerAgentId }) => (
          label === 'Additional Ability' && ownerAgentId === 'remielle'
        )) ?? false).toBe(false)
    }

    const declaredAttributeParty = calculateParty(createPreparedState(
      {}, ['rina', 'remielle', 'anbySoldier0'], 2,
    ))!
    const declaredRemielle = declaredAttributeParty.agents.find(({ agentId }) => (
      agentId === 'remielle'
    ))!
    const electricContrast = declaredAttributeParty.agents.find(({ agentId }) => (
      agentId === 'anbySoldier0'
    ))!
    expect(declaredRemielle.metrics.find(({ id }) => id === 'dmgBonus')!
      .breakdown.fully.some(({ label, ownerAgentId }) => (
        label === 'Additional Ability' && ownerAgentId === 'rina'
      )))
      .toBe(false)
    expect(electricContrast.metrics.find(({ id }) => id === 'dmgBonus')!
      .breakdown.fully.some(({ label, ownerAgentId }) => (
        label === 'Additional Ability' && ownerAgentId === 'rina'
      )))
      .toBe(true)
    expect(remielle.operations).toEqual(expect.arrayContaining([
      expect.objectContaining({
        label: 'Stun duration extension · Flower & Feather Dance',
        value: VERTICAL_VALUES.remielle.assistStunExtension,
      }),
      expect.objectContaining({
        label: 'Rainbow’s End / Fleeting Grace · Luminize triggers',
        value: VERTICAL_VALUES.remielle.mindscape6LuminizeTriggers,
      }),
    ]))
  })

  it('uses Remielle next-Agent Attribute only after Party Apply and wraps slot 3 to slot 1', () => {
    const withTimeweaver = (
      agentIds: [AgentId, AgentId, AgentId],
      remielleSlot: AppliedSlot,
      focusSlot: AppliedSlot,
    ) => workbenchReducer(
      createPreparedState({}, agentIds, focusSlot),
      { type: 'selectEngine', slot: remielleSlot, engineId: 'timeweaver' },
    )
    const hasTimeweaverBuildup = (state: ReturnType<typeof createPreparedState>) => {
      const remielle = calculateParty(state)!.agents
        .find(({ agentId }) => agentId === 'remielle')!
      return remielle.metrics.find(({ id }) => id === 'anomalyBuildupBonus')!
        .breakdown.combat.some(({ label }) => label === 'Timeweaver')
    }

    let state = withTimeweaver(['remielle', 'grace', 'yixuan'], 0, 1)
    expect(hasTimeweaverBuildup(state)).toBe(true)
    state = workbenchReducer(state, { type: 'openPartyEdit' })
    state = workbenchReducer(state, {
      type: 'replaceDraftAgent', slot: 1, agentId: 'promeia',
    })
    expect(hasTimeweaverBuildup(state)).toBe(true)
    state = workbenchReducer(state, { type: 'setDraftFocus', slot: 1 })
    state = workbenchReducer(state, { type: 'applyPartyEdit' })
    expect(state.slots.map(({ agentId }) => agentId)).toEqual([
      'remielle', 'promeia', 'yixuan',
    ])
    state = workbenchReducer(state, {
      type: 'selectEngine', slot: 0, engineId: 'timeweaver',
    })
    expect(state.slots[0].setup.engineId).toBe('timeweaver')
    expect(hasTimeweaverBuildup(state)).toBe(false)

    const wrapped = withTimeweaver(['grace', 'promeia', 'remielle'], 2, 0)
    expect(hasTimeweaverBuildup(wrapped)).toBe(true)
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

  it('converts Lucia-delivered Sheer Force into Norma ATK only while the provider is present', () => {
    const withResult = calculateParty(createPreparedState(
      {}, ['norma', 'lucia', 'yixuan'], 2,
    ))!
    const withoutResult = calculateParty(createPreparedState(
      {}, ['norma', 'dialyn', 'yixuan'], 2,
    ))!
    const withLucia = withResult.agents.find(({ agentId }) => agentId === 'norma')!
    const withoutLucia = withoutResult.agents.find(({ agentId }) => agentId === 'norma')!
    const lucia = withResult.agents.find(({ agentId }) => agentId === 'lucia')!
    const deliveredSheer = lucia.metrics.find(({ id }) => id === 'maxHp')!.gauges
      .find(({ outputLabel }) => outputLabel === 'Squad Sheer Force')!.outputValue
    const withSheer = withLucia.metrics.find(({ id }) => id === 'sheerForce')!
    const withoutSheer = withoutLucia.metrics.find(({ id }) => id === 'sheerForce')!
    const withAtk = withLucia.metrics.find(({ id }) => id === 'atk')!
    const withoutAtk = withoutLucia.metrics.find(({ id }) => id === 'atk')!

    expect(withSheer.values.fully).toBe(deliveredSheer)
    expect(withSheer.gauges[0]).toEqual(expect.objectContaining({
      current: deliveredSheer,
      outputValue: Math.min(
        deliveredSheer * VERTICAL_VALUES.norma.sheerAtkPerPoint,
        VERTICAL_VALUES.norma.sheerAtkCap,
      ),
    }))
    expect(withAtk.values.fully - withoutAtk.values.fully).toBe(
      Math.min(
        deliveredSheer * VERTICAL_VALUES.norma.sheerAtkPerPoint,
        VERTICAL_VALUES.norma.sheerAtkCap,
      ),
    )
    expect(withoutSheer.values.fully).toBe(0)
    expect(withoutSheer.gauges[0]).toEqual(expect.objectContaining({
      current: 0, outputValue: 0,
    }))
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

  it('projects a selected multi-action equipment scope into its canonical Result row', () => {
    const withPolar = (agentIds: [AgentId, AgentId, AgentId]) => {
      const state = createPreparedState({}, agentIds, 0)
      return workbenchReducer(state, {
        type: 'selectDisc', slot: 0, piece: 'fourPiece', discId: 'polarMetal',
      })
    }
    const hasPolar = (
      actionModifiers: NonNullable<ReturnType<typeof calculateParty>>['agents'][number]['actionModifiers'],
      id: string,
    ) => Object.values(
      actionModifiers.find((modifier) => modifier.id === id)!.breakdown,
    ).flat().some(({ label }) => label === 'Polar Metal')

    const ellenActions = calculateParty(withPolar(['ellen', 'lycaon', 'soukaku']))!.agents
      .find(({ agentId }) => agentId === 'ellen')!.actionModifiers
    expect(hasPolar(ellenActions, 'ellenBasicDashDmg')).toBe(true)
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
      1 + equipmentEffectMaximumValue(W_ENGINE_FACTS.hellfireGears.effects.impact, 1) / 100
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

  it('projects ordinary Disc effects through source capability and exact action consumers', () => {
    let graceState = createPreparedState({}, ['grace', 'rina', 'nicole'], 0)
    graceState = workbenchReducer(graceState, {
      type: 'selectDisc', slot: 0, piece: 'fourPiece', discId: 'chaosJazz',
    })
    const grace = calculateParty(graceState)!.agents
      .find(({ agentId }) => agentId === 'grace')!
    expect(grace.actionModifiers
      .find(({ id }) => id === 'graceExAssistDmg')!.breakdown.fully)
      .toContainEqual(expect.objectContaining({ label: 'Chaos Jazz' }))

    let triggerState = createPreparedState({}, ['trigger', 'soldier11', 'lucy'], 1)
    triggerState = workbenchReducer(triggerState, {
      type: 'selectDisc', slot: 0, piece: 'fourPiece', discId: 'shockstar',
    })
    const trigger = calculateParty(triggerState)!.agents
      .find(({ agentId }) => agentId === 'trigger')!
    const harmonizing = trigger.actionModifiers
      .find(({ id }) => id === 'triggerHarmonizingShot')!
    expect(harmonizing.target?.outcomes).toEqual([
      { kind: 'source-local', label: 'Harmonizing Shot' },
    ])
    expect(harmonizing.breakdown.fully)
      .toContainEqual(expect.objectContaining({ label: 'Shockstar Disco' }))

    const ye = calculateParty(createPreparedState(
      {}, ['yeShunguang', 'zhao', 'sunna'], 0,
    ))!.agents.find(({ agentId }) => agentId === 'yeShunguang')!
    expect(ye.metrics.find(({ id }) => id === 'critRate')!.breakdown.fully)
      .toContainEqual(expect.objectContaining({ label: 'White Water Ballad' }))
    expect(ye.metrics.find(({ id }) => id === 'atk')!.breakdown.fully)
      .toContainEqual(expect.objectContaining({ label: 'White Water Ballad' }))
    expect(ye.metrics.find(({ id }) => id === 'dmgBonus')!.breakdown.fully)
      .toContainEqual(expect.objectContaining({ label: 'Cloudcleave Radiance' }))
  })

  it('keeps Woodpecker maximum ATK on Fully Enabled for every holder', () => {
    const woodpeckerAtk = (agentId: 'ellen' | 'seed') => {
      const companions = agentId === 'ellen'
        ? ['ellen', 'lycaon', 'soukaku'] as const
        : ['seed', 'trigger', 'lucy'] as const
      let state = createPreparedState({}, [...companions], 0)
      state = workbenchReducer(state, {
        type: 'selectDisc', slot: 0, piece: 'fourPiece', discId: 'woodpecker',
      })
      return calculateParty(state)!.agents
        .find(({ agentId: resultAgentId }) => resultAgentId === agentId)!
        .metrics.find(({ id }) => id === 'atk')!
    }

    for (const agentId of ['ellen', 'seed'] as const) {
      const atk = woodpeckerAtk(agentId)
      expect(atk.breakdown.combat.some(({ label }) => label === 'Woodpecker Electro'))
        .toBe(false)
      expect(atk.breakdown.fully)
        .toContainEqual(expect.objectContaining({
          label: 'Woodpecker Electro',
          display: expect.objectContaining({
            value: equipmentEffectBaseValue(DRIVE_DISC_FACTS.woodpecker.fourPiece.atk),
          }),
        }))
    }
  })

  it('filters selected partial-equipment clauses after candidate admission', () => {
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

    const pulchraParty = calculateParty(createPreparedState(
      {}, ['pulchra', 'lucy', 'soldier11'], 2,
    ))!
    const pulchra = pulchraParty.agents.find(({ agentId }) => agentId === 'pulchra')!
    const soldier11 = pulchraParty.agents.find(({ agentId }) => agentId === 'soldier11')!
    expect(hasMetricSource(pulchra, 'impact', 'Blazing Laurel')).toBe(true)
    expect(hasMetricSource(soldier11, 'critDmg', 'Blazing Laurel')).toBe(false)

    let boxCutterState = createPreparedState({}, ['pulchra', 'lucy', 'soldier11'], 2)
    boxCutterState = workbenchReducer(boxCutterState, {
      type: 'selectEngine', slot: 0, engineId: 'boxCutter',
    })
    const boxCutterPulchra = calculateParty(boxCutterState)!.agents
      .find(({ agentId }) => agentId === 'pulchra')!
    expect(hasMetricSource(boxCutterPulchra, 'dazeBonus', 'Box Cutter')).toBe(true)
    expect(hasMetricSource(boxCutterPulchra, 'dmgBonus', 'Box Cutter')).toBe(false)

    let simmeringState = createPreparedState({}, ['nangongYu', 'sunna', 'promeia'], 2)
    simmeringState = workbenchReducer(simmeringState, {
      type: 'selectEngine', slot: 0, engineId: 'simmeringPot',
    })
    const simmeringNangong = calculateParty(simmeringState)!.agents
      .find(({ agentId }) => agentId === 'nangongYu')!
    expect(hasMetricSource(simmeringNangong, 'dazeBonus', 'The Simmering Pot')).toBe(true)
    expect(hasMetricSource(simmeringNangong, 'dmgBonus', 'The Simmering Pot')).toBe(true)

    let juFufuState = createPreparedState({}, ['juFufu', 'soldier11', 'lucy'], 1)
    juFufuState = workbenchReducer(juFufuState, {
      type: 'selectEngine', slot: 0, engineId: 'blazingLaurel',
    })
    const juFufuParty = calculateParty(juFufuState)!
    const juFufu = juFufuParty.agents.find(({ agentId }) => agentId === 'juFufu')!
    const juFufuSoldier11 = juFufuParty.agents.find(({ agentId }) => agentId === 'soldier11')!
    expect(hasMetricSource(juFufu, 'impact', 'Blazing Laurel')).toBe(true)
    expect(hasMetricSource(juFufuSoldier11, 'critDmg', 'Blazing Laurel')).toBe(true)

    let triggerState = createPreparedState({}, ['trigger', 'soldier11', 'lucy'], 1)
    triggerState = workbenchReducer(triggerState, {
      type: 'selectEngine', slot: 0, engineId: 'yesterdayCalls',
    })
    const triggerParty = calculateParty(triggerState)!
    const trigger = triggerParty.agents.find(({ agentId }) => agentId === 'trigger')!
    const triggerSoldier11 = triggerParty.agents.find(({ agentId }) => agentId === 'soldier11')!
    expect(hasMetricSource(trigger, 'dazeBonus', 'Yesterday Calls')).toBe(false)
    expect(hasMetricSource(triggerSoldier11, 'critDmg', 'Yesterday Calls')).toBe(false)

    let restrainedState = createPreparedState({}, ['trigger', 'soldier11', 'lucy'], 1)
    restrainedState = workbenchReducer(restrainedState, {
      type: 'selectEngine', slot: 0, engineId: 'restrained',
    })
    const restrainedTrigger = calculateParty(restrainedState)!.agents
      .find(({ agentId }) => agentId === 'trigger')!
    const basicAftershockSources = Object.values(
      restrainedTrigger.actionModifiers
        .find(({ id }) => id === 'triggerHarmonizingShot')!.breakdown,
    ).flat()
    expect(basicAftershockSources.some(({ label }) => label === 'The Restrained')).toBe(true)
    expect(hasMetricSource(restrainedTrigger, 'dazeBonus', 'The Restrained')).toBe(false)

    const dialynParty = calculateParty(createPreparedState(
      {}, ['dialyn', 'soldier11', 'lucy'], 1,
    ))!
    const dialyn = dialynParty.agents.find(({ agentId }) => agentId === 'dialyn')!
    const dialynSoldier11 = dialynParty.agents.find(({ agentId }) => agentId === 'soldier11')!
    expect(hasMetricSource(dialyn, 'dazeBonus', 'Yesterday Calls')).toBe(true)
    expect(hasMetricSource(dialynSoldier11, 'critDmg', 'Yesterday Calls')).toBe(true)
  })

  it('projects Timeweaver Disorder only for an exact retained opportunity', () => {
    const timeweaverDisorderGauge = (agentIds: [AgentId, AgentId, AgentId]) => {
      const agent = calculateParty(createPreparedState({}, agentIds, 0))!.agents
        .find(({ agentId }) => agentId === agentIds[0])!
      return agent.metrics.find(({ id }) => id === 'anomalyProficiency')?.gauges
        .find(({ source, outputLabel }) => (
          source.label === 'Timeweaver' && outputLabel === 'Disorder DMG Bonus'
        ))
    }

    expect(timeweaverDisorderGauge(['grace', 'trigger', 'rina'])).toBeUndefined()
    expect(timeweaverDisorderGauge(['grace', 'remielle', 'anbySoldier0']))
      .toBeUndefined()
    expect(timeweaverDisorderGauge(['grace', 'rina', 'nicole']))
      .toEqual(expect.objectContaining({ basisLabel: 'Fully Enabled Anomaly Proficiency' }))
    expect(timeweaverDisorderGauge(['yanagi', 'trigger', 'rina']))
      .toEqual(expect.objectContaining({ basisLabel: 'Fully Enabled Anomaly Proficiency' }))
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
