import { describe, expect, it } from 'vitest'
import { AFTERSHOCK_TARGET, DISORDER_TARGET } from '../actions'
import { DRIVE_DISC_FACTS } from '../content/discs'
import {
  defineAgentBaseSource,
  defineAgentSource,
  defineCalculationSource,
  defineDriveDiscSource,
} from '../content/source-definitions'
import {
  equipmentEffectBaseValue,
  type AgentId,
  type DiscId,
} from '../content/types'
import { createPreparedState, workbenchReducer, type WorkbenchState } from '../state'
import { activeCandidatePressures } from '../candidate-context'
import { selectedDriveDiscRelationships } from '../content/agent-sources/drive-disc-relationships'
import {
  requireCompleteSelectedSetup,
  selectedDiscSource,
} from '../content/agent-sources/equipment'
import { equipmentProviderRelationship } from '../content/agent-sources/equipment-provider'
import { partyOutcomeProfileFor } from '../content/agent-profiles/party-outcomes'
import {
  actionProjection,
  evaluateProfileParty,
  type AgentSourceProfile,
  type MetricProjection,
} from './profile-harness'
import { evaluateRelationships, type ProfileRelationship } from './relationships'
import { deliverProviderRelationships } from './delivery'
import { broadPrePenProviderFor } from './broad-pre-pen'
import { selectSource, type SelectedSourceInstance } from './source-instance'
import { type StatId } from './stat-composer'

const atkMetric: MetricProjection = {
  id: 'atk', statId: 'atk', label: 'ATK', unit: '', decimals: 0,
}

const critDmgMetric: MetricProjection = {
  id: 'critDmg', statId: 'critDmg', label: 'CRIT DMG', unit: '%', decimals: 1,
}

const damageMetric: MetricProjection = {
  id: 'dmgBonus', label: 'DMG Bonus', unit: '%', decimals: 1,
}

const anomalyDamageMetric: MetricProjection = {
  id: 'anomalyDmgBonus', label: 'Anomaly DMG Bonus', unit: '%', decimals: 1,
}

const critRateMetric: MetricProjection = {
  id: 'critRate', statId: 'critRate', label: 'CRIT Rate', unit: '%', decimals: 1,
}

function baseStat(
  agentId: AgentSourceProfile['agentId'],
  slot: 0 | 1 | 2,
  statId: StatId,
  value: number,
): ProfileRelationship {
  return {
    kind: 'stat',
    atom: {
      statId,
      region: 'base',
      earliestSurface: 'initial',
      value,
      source: selectSource(
        defineAgentBaseSource(agentId, `${agentId} base stats`),
        agentId,
        slot,
      ),
    },
  }
}

describe('shared broad pre-PEN applicability', () => {
  it('keeps self and party delivery formula-aware while rejecting action-scoped pressure', () => {
    const source = selectSource(
      defineAgentSource('alice', 'broad-fixture', 'Broad fixture', 'core'),
      'alice',
      0,
    )
    const provider: ProfileRelationship = {
      kind: 'provider',
      source,
      delivery: { recipient: 'all-party', formulas: ['general_damage'] },
      effect: {
        kind: 'modifier',
        metricId: 'defReduction',
        earliestSurface: 'fully',
        value: 20,
      },
    }
    const selfProvider: ProfileRelationship = {
      ...provider,
      delivery: { recipient: 'self', formulas: ['anomaly_damage'] },
    }
    const delivered = deliverProviderRelationships(
      [provider, selfProvider],
      [
        { appliedPartySlot: 0, agentId: 'alice', specialty: 'Anomaly', attribute: 'Physical', formulas: ['anomaly_damage'], statIds: [] },
        { appliedPartySlot: 1, agentId: 'trigger', specialty: 'Rupture', attribute: 'Physical', formulas: ['sheer_damage'], statIds: [] },
        { appliedPartySlot: 2, agentId: 'rina', specialty: 'Support', attribute: 'Electric', formulas: ['general_damage'], statIds: [] },
      ],
      0,
    )
    expect(delivered[0].modifierAtoms).toHaveLength(2)
    expect(delivered[1].modifierAtoms).toHaveLength(0)
    expect(delivered[2].modifierAtoms).toHaveLength(1)
    expect(broadPrePenProviderFor({
      kind: 'modifier',
      atom: {
        metricId: 'defIgnore', earliestSurface: 'combat', value: 25, source,
        action: AFTERSHOCK_TARGET,
      },
    })).toBeNull()

    let aliceState = createPreparedState({ trigger: 'nonLimited' }, ['alice', 'trigger', 'yixuan'], 0)
    aliceState = workbenchReducer(aliceState, {
      type: 'setMindscape', slot: 0, mindscape: 1,
    })
    expect(activeCandidatePressures(aliceState, 0)).toContain('materialBroadPrePenDefBypass')

    const cissiaPhysical = createPreparedState({}, ['cissia', 'jane', 'yixuan'], 1)
    expect(activeCandidatePressures(cissiaPhysical, 1)).not.toContain('materialBroadPrePenDefBypass')
    const cissiaElectric = createPreparedState({}, ['cissia', 'yanagi', 'yixuan'], 1)
    expect(activeCandidatePressures(cissiaElectric, 1)).toContain('materialBroadPrePenDefBypass')

    const remielleElectric = createPreparedState(
      {}, ['cissia', 'remielle', 'anbySoldier0'], 2,
    )
    expect(activeCandidatePressures(remielleElectric, 1))
      .toContain('materialBroadPrePenDefBypass')
    const remielleIce = createPreparedState(
      {}, ['cissia', 'remielle', 'promeia'], 2,
    )
    expect(activeCandidatePressures(remielleIce, 1))
      .not.toContain('materialBroadPrePenDefBypass')
  })
})

function selectedFourPieceRelationships(
  state: WorkbenchState,
  agentId: AgentId,
  appliedPartySlot: 0 | 1 | 2,
  fourPieceId: DiscId,
): ProfileRelationship[] {
  const setup = {
    ...requireCompleteSelectedSetup(state.slots[appliedPartySlot].setup),
    fourPieceId,
    twoPieceId: 'woodpecker' as const,
  }
  return selectedDriveDiscRelationships({
    agentId,
    appliedPartySlot,
    setup,
    observation: {
      baseStats: { critRate: 0 },
      modifierMetrics: ['dmgBonus'],
    },
    focusAgentId: state.slots[state.focusSlot].agentId,
    partyAgentIds: state.slots.map(({ agentId: partyAgentId }) => partyAgentId),
    source: selectedDiscSource(
      agentId, appliedPartySlot, setup, fourPieceId, '4-piece',
    ),
  })
}

function postDeliveryAftershockProvider(
  source: SelectedSourceInstance,
): ProfileRelationship {
  return {
    kind: 'post-delivery-linear',
    source,
    basis: { statId: 'critDmg', surface: 'fully' },
    outputs: [{
      transform: { basisIncrement: 1, outputIncrement: 0.35 },
      emission: {
        kind: 'provider',
        delivery: {
          recipient: 'all-party',
          eligibleAgentIds: ['anbySoldier0', 'trigger'],
        },
        effect: {
          kind: 'modifier', metricId: 'critDmg', earliestSurface: 'fully',
          action: AFTERSHOCK_TARGET,
        },
      },
    }],
  }
}

function agentResult(
  result: NonNullable<ReturnType<typeof evaluateProfileParty>>,
  agentId: AgentSourceProfile['agentId'],
) {
  return result.agents.find((agent) => agent.agentId === agentId)!
}

describe('profile calculation harness', () => {
  it('converts one completed delivered metric into a holder stat without feeding another recipient', () => {
    const state = createPreparedState({}, ['norma', 'lucia', 'yixuan'], 2)
    const normaCore = selectSource(
      defineAgentSource('norma', 'received-metric', 'Received metric conversion', 'core'),
      'norma', 0,
    )
    const luciaCore = selectSource(
      defineAgentSource('lucia', 'metric-provider', 'Delivered metric', 'core'),
      'lucia', 1,
    )
    const profiles: AgentSourceProfile[] = [
      {
        agentId: 'norma', appliedPartySlot: 0,
        metrics: [
          atkMetric,
          {
            id: 'sheerForce', label: 'Sheer Force', unit: '', decimals: 1,
            baseValues: { initial: 0, combat: 0, fully: 0 },
          },
        ],
        relationships: [
          baseStat('norma', 0, 'atk', 1_000),
          {
            kind: 'post-delivery-metric-stat-gauge',
            source: normaCore,
            basis: { metricId: 'sheerForce', surface: 'fully' },
            basisLabel: 'Fully Enabled Sheer Force',
            basisCap: 960,
            output: {
              label: 'Additional flat ATK', statId: 'atk', region: 'flat',
              transform: { basisIncrement: 1, outputIncrement: 1.25, outputCap: 1_200 },
              cap: 1_200, unit: '',
            },
          },
        ],
      },
      {
        agentId: 'lucia', appliedPartySlot: 1, metrics: [],
        relationships: [{
          kind: 'provider', source: luciaCore,
          delivery: { recipient: 'all-party', eligibleAgentIds: ['norma'] },
          effect: {
            kind: 'modifier', metricId: 'sheerForce', earliestSurface: 'fully', value: 400,
          },
        }],
      },
      {
        agentId: 'yixuan', appliedPartySlot: 2, metrics: [atkMetric],
        relationships: [baseStat('yixuan', 2, 'atk', 1_000)],
      },
    ]

    const result = evaluateProfileParty(state, profiles)!
    const norma = agentResult(result, 'norma')
    expect(norma.metrics.find(({ id }) => id === 'sheerForce')!.values.fully).toBe(400)
    expect(norma.metrics.find(({ id }) => id === 'sheerForce')!.gauges[0])
      .toEqual(expect.objectContaining({ current: 400, outputValue: 500 }))
    expect(norma.metrics.find(({ id }) => id === 'atk')!.values.fully).toBe(1_500)
    expect(agentResult(result, 'yixuan').metrics[0].values.fully).toBe(1_000)
  })

  it('runs one post-delivery gauge after ordinary stat delivery and delivers its provider once', () => {
    const state = createPreparedState({}, ['jane', 'piper', 'seth'], 0)
    const janeCore = selectSource(
      defineAgentSource('jane', 'post-delivery', 'Post-delivery relation', 'core'), 'jane', 0,
    )
    const janePotential = selectSource(
      defineAgentSource('jane', 'potential', 'Potential Awakening', 'identity'), 'jane', 0,
    )
    const sethCore = selectSource(
      defineAgentSource('seth', 'core', 'Core Passive', 'core'), 'seth', 2,
    )
    const profiles: AgentSourceProfile[] = [
      {
        agentId: 'jane', appliedPartySlot: 0,
        metrics: [
          atkMetric,
          { id: 'anomalyProficiency', statId: 'anomalyProficiency', label: 'AP', unit: '', decimals: 0 },
          { id: 'critRate', label: 'CRIT Rate', unit: '%', decimals: 1, baseValues: { initial: 0, combat: 0, fully: 0 }, admission: 'action' },
          { id: 'critDmg', label: 'CRIT DMG', unit: '%', decimals: 1, baseValues: { initial: 0, combat: 0, fully: 0 }, admission: 'action' },
        ],
        actions: [
          actionProjection('critRate', 'janeAssaultCritRate', AFTERSHOCK_TARGET),
          actionProjection('critDmg', 'janeAssaultCritDmg', AFTERSHOCK_TARGET),
        ],
        relationships: [
          baseStat('jane', 0, 'atk', 880),
          baseStat('jane', 0, 'anomalyProficiency', 114),
          { kind: 'modifier', atom: {
            metricId: 'critDmg', earliestSurface: 'fully', value: 30,
            source: janePotential, action: AFTERSHOCK_TARGET,
          } },
          {
            kind: 'post-delivery-gauge',
            source: janeCore,
            basis: { statId: 'anomalyProficiency', surface: 'fully' },
            basisLabel: 'Fully Enabled Anomaly Proficiency',
            basisThreshold: 200,
            basisCap: 420,
            metricId: 'anomalyProficiency',
            outputs: [
              {
                label: 'Scoped CRIT Rate', unit: '%', cap: 100,
                transform: { basisIncrement: 1, outputIncrement: 0.5, outputCap: 100 },
                emission: {
                  kind: 'provider',
                  delivery: { recipient: 'all-party', formulas: ['anomaly_damage'] },
                  effect: {
                    kind: 'modifier', metricId: 'critRate', earliestSurface: 'fully',
                    action: AFTERSHOCK_TARGET,
                  },
                },
              },
              {
                label: 'Derived flat ATK', unit: '', cap: 600,
                transform: {
                  basisThreshold: 120, basisIncrement: 1,
                  outputIncrement: 2, outputCap: 600,
                },
                emission: {
                  kind: 'stat', statId: 'atk', region: 'flat', earliestSurface: 'fully',
                },
              },
            ],
          },
          {
            kind: 'post-delivery-linear',
            source: janeCore,
            basis: { statId: 'anomalyProficiency', surface: 'fully' },
            outputs: [{
              transform: { basisIncrement: 1, baseOutput: 50, outputIncrement: 0, outputCap: 50 },
              emission: {
                kind: 'provider',
                delivery: { recipient: 'all-party', formulas: ['anomaly_damage'] },
                effect: {
                  kind: 'modifier', metricId: 'critDmg', earliestSurface: 'fully',
                  action: AFTERSHOCK_TARGET,
                },
              },
            }],
          },
        ],
      },
      {
        agentId: 'piper', appliedPartySlot: 1,
        metrics: [
          { id: 'critRate', label: 'CRIT Rate', unit: '%', decimals: 1, baseValues: { initial: 0, combat: 0, fully: 0 }, admission: 'action' },
          { id: 'critDmg', label: 'CRIT DMG', unit: '%', decimals: 1, baseValues: { initial: 0, combat: 0, fully: 0 }, admission: 'action' },
        ],
        actions: [
          actionProjection('critRate', 'piperAssaultCritRate', AFTERSHOCK_TARGET),
          actionProjection('critDmg', 'piperAssaultCritDmg', AFTERSHOCK_TARGET),
        ],
        relationships: [],
      },
      {
        agentId: 'seth', appliedPartySlot: 2,
        metrics: [{ id: 'anomalyProficiency', statId: 'anomalyProficiency', label: 'AP', unit: '', decimals: 0 }],
        relationships: [
          baseStat('seth', 2, 'anomalyProficiency', 90),
          {
            kind: 'provider', source: sethCore,
            delivery: { recipient: 'focus' },
            effect: { kind: 'stat', statId: 'anomalyProficiency', region: 'flat', earliestSurface: 'fully', value: 100 },
          },
        ],
      },
    ]

    const result = evaluateProfileParty(state, profiles)!
    const jane = agentResult(result, 'jane')
    const piper = agentResult(result, 'piper')
    const seth = agentResult(result, 'seth')
    const janeAp = jane.metrics.find(({ id }) => id === 'anomalyProficiency')!
    expect(janeAp.values.fully).toBe(214)
    expect(jane.metrics.find(({ id }) => id === 'atk')!.values.fully).toBe(1068)
    expect(janeAp.gauges[0]).toEqual(expect.objectContaining({
      current: 214,
      outputLabel: 'Scoped CRIT Rate',
      additionalOutputs: [expect.objectContaining({ label: 'Derived flat ATK', value: 188 })],
    }))
    expect(janeAp.gauges[0]!.outputValue).toBe(100)
    expect(jane.actionModifiers.find(({ id }) => id === 'janeAssaultCritRate')!.values.fully)
      .toBe(100)
    expect(jane.actionModifiers.find(({ id }) => id === 'janeAssaultCritDmg')!.values.fully).toBe(80)
    expect(piper.actionModifiers.find(({ id }) => id === 'piperAssaultCritRate')!.values.fully)
      .toBe(100)
    expect(piper.actionModifiers.find(({ id }) => id === 'piperAssaultCritDmg')!.values.fully).toBe(50)
    expect(seth.actionModifiers).toEqual([])
  })

  it('delivers fact-owned focus and squad relationships to different Results', () => {
    const state = createPreparedState(
      {},
      ['seed', 'anbySoldier0', 'trigger'],
      1,
    )
    const focusRelationships = selectedFourPieceRelationships(
      state, 'seed', 0, 'astralVoice',
    )
    const squadRelationships = selectedFourPieceRelationships(
      state, 'trigger', 2, 'swingJazz',
    )
    const focusAmount = equipmentEffectBaseValue(
      DRIVE_DISC_FACTS.astralVoice.fourPiece.damage,
    )
    const squadAmount = equipmentEffectBaseValue(
      DRIVE_DISC_FACTS.swingJazz.fourPiece.damage,
    )
    const profiles: AgentSourceProfile[] = [
      {
        agentId: 'seed', appliedPartySlot: 0,
        metrics: [damageMetric], relationships: focusRelationships,
      },
      {
        agentId: 'anbySoldier0', appliedPartySlot: 1,
        metrics: [damageMetric], relationships: [],
      },
      {
        agentId: 'trigger', appliedPartySlot: 2,
        metrics: [damageMetric], relationships: squadRelationships,
      },
    ]

    const result = evaluateProfileParty(state, profiles)!
    expect(agentResult(result, 'seed').metrics[0].values.fully)
      .toBe(squadAmount)
    expect(agentResult(result, 'anbySoldier0').metrics[0].values.fully)
      .toBe(focusAmount + squadAmount)
    expect(agentResult(result, 'trigger').metrics[0].values.fully)
      .toBe(squadAmount)
  })

  it('keeps independent gauges and evaluates each threshold from its owned surface', () => {
    const state = createPreparedState({}, ['jane', 'piper', 'seth'], 0)
    const [thresholdGauge] = selectedFourPieceRelationships(
      state, 'jane', 0, 'king',
    )
    if (thresholdGauge?.kind !== 'gauge') {
      throw new Error('King must materialize its current threshold gauge')
    }
    const thresholdOutput = thresholdGauge.outputs[0]
    if (!thresholdOutput || !('activation' in thresholdOutput)) {
      throw new Error('King must own the current threshold activation output')
    }
    const secondSource = selectSource(
      defineAgentSource('jane', 'parallel-gauge', 'Parallel gauge', 'additional'),
      'jane', 0,
    )
    const profiles: AgentSourceProfile[] = [{
      agentId: 'jane',
      appliedPartySlot: 0,
      metrics: [critRateMetric, damageMetric, critDmgMetric],
      relationships: [
        baseStat('jane', 0, 'critRate', 45),
        {
          kind: 'stat',
          atom: {
            statId: 'critRate', region: 'flat', earliestSurface: 'combat',
            value: 20, source: thresholdGauge.source,
          },
        },
        thresholdGauge,
        {
          kind: 'gauge',
          source: secondSource,
          basis: { statId: 'critRate', surface: 'initial' },
          basisLabel: 'Initial CRIT Rate',
          basisCap: 100,
          metricId: 'critRate',
          outputs: [{
            label: 'Parallel output', unit: '%',
            transform: { basisIncrement: 1, outputIncrement: 0.1 },
            emission: {
              kind: 'modifier', metricId: 'dmgBonus', earliestSurface: 'fully',
            },
          }],
        },
      ],
    }, {
      agentId: 'piper', appliedPartySlot: 1,
      metrics: [damageMetric, critDmgMetric], relationships: [],
    }, {
      agentId: 'seth', appliedPartySlot: 2,
      metrics: [damageMetric, critDmgMetric], relationships: [],
    }]

    const metric = agentResult(evaluateProfileParty(state, profiles)!, 'jane')
      .metrics.find(({ id }) => id === 'critRate')!
    expect(metric.values).toEqual({ initial: 45, combat: 65, fully: 65 })
    expect(metric.gauges.map(({ outputLabel, outputValue }) => (
      [outputLabel, outputValue]
    ))).toEqual([
      [thresholdOutput.label, thresholdOutput.activation.inactiveValue],
      ['Parallel output', 4.5],
    ])
  })

  it('admits an optional zero-value metric when a gauge is its visible consumer', () => {
    const state = createPreparedState({}, ['jane', 'piper', 'seth'], 0)
    const [thresholdGauge] = selectedFourPieceRelationships(
      state, 'jane', 0, 'king',
    )
    if (thresholdGauge?.kind !== 'gauge') {
      throw new Error('King must materialize its current threshold gauge')
    }
    const thresholdOutput = thresholdGauge.outputs[0]
    if (!thresholdOutput || !('activation' in thresholdOutput)) {
      throw new Error('King must own the current threshold activation output')
    }
    const profiles: AgentSourceProfile[] = [{
      agentId: 'jane',
      appliedPartySlot: 0,
      metrics: [{ ...critRateMetric, admission: 'nonzero-or-action' }],
      relationships: [baseStat('jane', 0, 'critRate', 0), thresholdGauge],
    }, {
      agentId: 'piper', appliedPartySlot: 1, metrics: [], relationships: [],
    }, {
      agentId: 'seth', appliedPartySlot: 2, metrics: [], relationships: [],
    }]

    const metrics = agentResult(evaluateProfileParty(state, profiles)!, 'jane').metrics
    expect(metrics).toHaveLength(1)
    expect(metrics[0]).toMatchObject({
      id: 'critRate',
      values: { initial: 0, combat: 0, fully: 0 },
    })
    expect(metrics[0]!.gauges).toHaveLength(1)
    expect(metrics[0]!.gauges[0]).toMatchObject({
      basisLabel: 'Initial CRIT Rate',
      current: 0,
      outputLabel: thresholdOutput.label,
      outputValue: thresholdOutput.activation.inactiveValue,
    })
  })

  it('recalculates a holder-derived provider from the live setup without preparation', () => {
    const initial = createPreparedState({}, ['astraYao', 'corin', 'anby'], 1)
    const profilesFor = (state: WorkbenchState): AgentSourceProfile[] => {
      const holderValue = 1000 + (state.slots[0].setup.substats.atkFlat ?? 0) * 10
      const astraCore = selectSource(
        defineAgentSource('astraYao', 'live-atk-provider', 'Live ATK provider', 'core'),
        'astraYao',
        0,
      )
      return [
        {
          agentId: 'astraYao', appliedPartySlot: 0, metrics: [atkMetric],
          relationships: [
            baseStat('astraYao', 0, 'atk', holderValue),
            {
              kind: 'linear',
              source: astraCore,
              basis: { statId: 'atk', surface: 'initial' },
              outputs: [{
                transform: { basisIncrement: 100, outputIncrement: 10 },
                emission: {
                  kind: 'provider',
                  delivery: { recipient: 'focus' },
                  effect: {
                    kind: 'stat', statId: 'atk', region: 'flat', earliestSurface: 'fully',
                  },
                },
              }],
            },
          ],
        },
        {
          agentId: 'corin', appliedPartySlot: 1, metrics: [atkMetric],
          relationships: [baseStat('corin', 1, 'atk', 500)],
        },
        {
          agentId: 'anby', appliedPartySlot: 2, metrics: [atkMetric],
          relationships: [baseStat('anby', 2, 'atk', 700)],
        },
      ]
    }
    const edited: WorkbenchState = {
      ...initial,
      slots: initial.slots.map((slot, index) => index === 0
        ? {
          ...slot,
          setup: {
            ...slot.setup,
            substats: { ...slot.setup.substats, atkFlat: 5 },
          },
        }
        : slot) as WorkbenchState['slots'],
    }

    const before = evaluateProfileParty(initial, profilesFor(initial))!
    const after = evaluateProfileParty(edited, profilesFor(edited))!
    expect(agentResult(before, 'corin').metrics[0].values.fully).toBe(600)
    expect(agentResult(after, 'corin').metrics[0].values.fully).toBe(605)
    expect(agentResult(after, 'corin').metrics[0].breakdown.fully)
      .toContainEqual(expect.objectContaining({ ownerAgentId: 'astraYao', amount: 105 }))
    expect(agentResult(after, 'anby').metrics[0].values.fully).toBe(700)
    expect(edited.slots[0].setup.engineId).toBe(initial.slots[0].setup.engineId)
  })

  it('derives an action-local percentage from the selected Initial stat', () => {
    const state = createPreparedState({}, ['lycaon', 'corin', 'anby'], 0)
    const initialSupply = selectSource(
      defineAgentSource('lycaon', 'initial-supply', 'Initial supply', 'special'),
      'lycaon', 0,
    )
    const actionPercentage = selectSource(
      defineAgentSource('lycaon', 'action-percentage', 'Action percentage', 'special'),
      'lycaon', 0,
    )
    const profiles: AgentSourceProfile[] = [{
      agentId: 'lycaon',
      appliedPartySlot: 0,
      metrics: [{
        id: 'impact', statId: 'impact', label: 'Impact', unit: '', decimals: 1,
      }],
      actions: [actionProjection('impact', 'initialBasedAction', AFTERSHOCK_TARGET)],
      relationships: [
        baseStat('lycaon', 0, 'impact', 100),
        {
          kind: 'stat',
          atom: {
            statId: 'impact', region: 'percentage', earliestSurface: 'initial',
            value: 20, source: initialSupply,
          },
        },
        {
          kind: 'linear',
          source: actionPercentage,
          basis: { statId: 'impact', surface: 'initial' },
          outputs: [{
            transform: { basisIncrement: 1, outputIncrement: 0.15 },
            emission: {
              kind: 'modifier', metricId: 'impact', earliestSurface: 'fully',
              action: AFTERSHOCK_TARGET,
              display: { value: 15, unit: '%', decimals: 0 },
            },
          }],
        },
      ],
    }, {
      agentId: 'corin', appliedPartySlot: 1, metrics: [], relationships: [],
    }, {
      agentId: 'anby', appliedPartySlot: 2, metrics: [], relationships: [],
    }]

    const result = agentResult(evaluateProfileParty(state, profiles)!, 'lycaon')
    expect(result.metrics[0].values).toEqual({ initial: 120, combat: 120, fully: 120 })
    expect(result.actionModifiers[0].values.fully).toBe(138)
    expect(result.actionModifiers[0].breakdown.fully)
      .toContainEqual(expect.objectContaining({
        label: 'Action percentage',
        amount: 18,
        display: { value: 15, unit: '%', decimals: 0 },
      }))
  })

  it('reconciles distinct highest-only origins but fails on one duplicated selected relationship', () => {
    const state = createPreparedState({}, ['astraYao', 'anbySoldier0', 'trigger'], 1)
    const semanticEffect = {}
    const firstOrigin = selectSource(
      defineAgentSource('astraYao', 'first-origin', 'First highest-only origin', 'core'),
      'astraYao',
      0,
    )
    const secondOrigin = selectSource(
      defineAgentSource('anbySoldier0', 'second-origin', 'Second highest-only origin', 'core'),
      'anbySoldier0',
      1,
    )
    const unrelated = selectSource(
      defineAgentSource('astraYao', 'unrelated-aftershock', 'Unrelated Aftershock bonus', 'core'),
      'astraYao', 0,
    )
    const provider = (
      source: SelectedSourceInstance,
      recipient: 'all-party' | 'focus',
      value: number,
      highestOnly = false,
      earliestSurface: 'combat' | 'fully' = 'fully',
    ): ProfileRelationship => ({
      kind: 'provider', source,
      delivery: {
        recipient,
        eligibleAgentIds: ['anbySoldier0', 'trigger'],
      },
      effect: {
        kind: 'modifier', metricId: 'dmgBonus', earliestSurface,
        value, action: AFTERSHOCK_TARGET,
        ...(highestOnly
          ? {
              composition: {
                kind: 'highest-only',
                semanticEffect,
              },
            }
          : {}),
      },
    })
    const profiles: AgentSourceProfile[] = [
      {
        agentId: 'astraYao', appliedPartySlot: 0, metrics: [damageMetric],
        relationships: [
          provider(firstOrigin, 'all-party', 20, true, 'combat'),
          provider(firstOrigin, 'all-party', 20, true),
          provider(unrelated, 'all-party', 5),
        ],
      },
      {
        agentId: 'anbySoldier0', appliedPartySlot: 1, metrics: [damageMetric],
        actions: [actionProjection('dmgBonus', 'anbyAftershock', AFTERSHOCK_TARGET)],
        relationships: [provider(secondOrigin, 'focus', 20, true)],
      },
      {
        agentId: 'trigger', appliedPartySlot: 2, metrics: [damageMetric],
        actions: [actionProjection('dmgBonus', 'triggerAftershock', AFTERSHOCK_TARGET)],
        relationships: [],
      },
    ]

    const result = evaluateProfileParty(state, profiles)!
    const anbyAction = agentResult(result, 'anbySoldier0').actionModifiers[0]
    const triggerAction = agentResult(result, 'trigger').actionModifiers[0]
    expect(anbyAction.values.fully).toBe(45)
    expect(anbyAction.breakdown.fully.filter(
      ({ notation }) => notation === 'equal-nonstack-origin',
    )).toHaveLength(1)
    expect(new Set(anbyAction.breakdown.fully.map(({ label }) => label)))
      .toEqual(new Set([
        'First highest-only origin',
        'Second highest-only origin',
        'Unrelated Aftershock bonus',
      ]))
    expect(triggerAction.values.fully).toBe(45)
    expect(Object.values(triggerAction.breakdown).flat().filter(
      ({ label }) => label === 'First highest-only origin',
    )).toHaveLength(2)

    const duplicateRelationship = provider(firstOrigin, 'focus', 20, true)
    const duplicateProfiles: AgentSourceProfile[] = profiles.map((profile) => ({
      ...profile,
      relationships: profile.appliedPartySlot === 0
        ? [duplicateRelationship, duplicateRelationship]
        : [],
    }))
    expect(() => evaluateProfileParty(state, duplicateProfiles))
      .toThrowError(
        'Duplicate highest-only relationship for one selected source instance',
      )
  })

  it('filters an enemy-context provider before highest-only composition', () => {
    const state = createPreparedState({}, ['grace', 'yanagi', 'piper'], 0)
    const semanticEffect = DRIVE_DISC_FACTS.freedomBlues.fourPiece.buildupResReduction
    const discSource = (holder: 'grace' | 'yanagi', slot: 0 | 1) => selectSource(
      defineDriveDiscSource('freedomBlues', '4-piece', 'Freedom Blues'),
      holder,
      slot,
      { kind: 'drive-disc', selectedRole: '4-piece', effectPiece: '4-piece' },
    )
    const provider = (
      holder: 'grace' | 'yanagi',
      slot: 0 | 1,
    ): ProfileRelationship => equipmentProviderRelationship(
      discSource(holder, slot),
      semanticEffect,
      {
        kind: 'modifier',
        metricId: 'anomalyBuildupResReduction',
        earliestSurface: 'fully',
        value: equipmentEffectBaseValue(semanticEffect),
      },
      {
        attributes: ['Electric'],
        formulas: ['anomaly_buildup'],
      },
    )
    const buildupResMetric: MetricProjection = {
      id: 'anomalyBuildupResReduction',
      label: 'Anomaly Buildup RES Reduction',
      unit: '%',
      decimals: 1,
    }
    const profiles: AgentSourceProfile[] = [
      {
        agentId: 'grace', appliedPartySlot: 0,
        metrics: [buildupResMetric], relationships: [provider('grace', 0)],
      },
      {
        agentId: 'yanagi', appliedPartySlot: 1,
        metrics: [buildupResMetric], relationships: [provider('yanagi', 1)],
      },
      {
        agentId: 'piper', appliedPartySlot: 2,
        metrics: [buildupResMetric], relationships: [],
      },
    ]

    const result = evaluateProfileParty(state, profiles)!
    for (const agentId of ['grace', 'yanagi'] as const) {
      const metric = agentResult(result, agentId).metrics[0]
      expect(metric.values.fully).toBe(equipmentEffectBaseValue(semanticEffect))
      expect(metric.breakdown.fully.filter(
        ({ notation }) => notation === 'equal-nonstack-origin',
      )).toHaveLength(1)
    }
    expect(agentResult(result, 'piper').metrics[0].values.fully).toBe(0)
  })

  it('uses a Lumiflux recipient next-slot Attribute for shared provider delivery', () => {
    const evaluateRemielle = (agentIds: readonly [AgentId, AgentId, AgentId]) => {
      const state = createPreparedState({}, [...agentIds], 2)
      const source = selectSource(
        defineAgentSource(
          'rina',
          'lumiflux-attribute-provider',
          'Lumiflux Attribute provider',
          'additional',
        ),
        'rina',
        0,
      )
      const provider: ProfileRelationship = {
        kind: 'provider',
        source,
        delivery: {
          recipient: 'all-party',
          attributes: ['Electric'],
          formulas: ['general_damage'],
        },
        effect: {
          kind: 'modifier',
          metricId: 'dmgBonus',
          earliestSurface: 'fully',
          value: 20,
        },
      }
      const profiles: AgentSourceProfile[] = agentIds.map((agentId, slot) => ({
        agentId,
        appliedPartySlot: slot as 0 | 1 | 2,
        metrics: [damageMetric],
        relationships: slot === 0 ? [provider] : [],
      }))
      return agentResult(evaluateProfileParty(state, profiles)!, 'remielle')
        .metrics[0]
    }

    expect(evaluateRemielle(['rina', 'remielle', 'anbySoldier0']).values.fully)
      .toBe(20)
    expect(evaluateRemielle(['rina', 'remielle', 'promeia']).values.fully)
      .toBe(0)
  })

  it('delivers a source-stated operation by recipient Specialty without an Agent roster', () => {
    const state = createPreparedState({}, ['astraYao', 'trigger', 'zhao'], 1)
    const source = selectSource(
      defineAgentSource('astraYao', 'stun-operation', 'Source-stated operation', 'special'),
      'astraYao', 0,
    )
    const profiles: AgentSourceProfile[] = [
      {
        agentId: 'astraYao', appliedPartySlot: 0, metrics: [],
        relationships: [{
          kind: 'provider', source,
          delivery: {
            recipient: 'all-party', specialties: ['Stun'], formulas: ['daze_buildup'],
          },
          effect: {
            kind: 'operation',
            label: 'Next action Daze',
            earliestSurface: 'fully', value: 50, unit: '%',
          },
        }],
      },
      { agentId: 'trigger', appliedPartySlot: 1, metrics: [], relationships: [] },
      { agentId: 'zhao', appliedPartySlot: 2, metrics: [], relationships: [] },
    ]

    const result = evaluateProfileParty(state, profiles)!
    expect(agentResult(result, 'trigger').operations).toEqual([
      expect.objectContaining({ label: 'Next action Daze', value: 50 }),
    ])
    expect(agentResult(result, 'trigger').operations[0].source.ownerAgentId).toBe('astraYao')
    expect(agentResult(result, 'astraYao').operations).toEqual([])
    expect(agentResult(result, 'zhao').operations).toEqual([])
  })

  it('delivers shared ordinary regions to general and anomaly Result participants only', () => {
    const state = createPreparedState({}, ['astraYao', 'harumasa', 'grace'], 1)
    const operationSource = selectSource(
      defineAgentSource('astraYao', 'scoped-operation', 'Scoped operation', 'special'),
      'astraYao', 0,
    )
    const atkSource = selectSource(
      defineAgentSource('astraYao', 'scoped-atk', 'Scoped ATK', 'core'),
      'astraYao', 0,
    )
    const profiles: AgentSourceProfile[] = [
      {
        agentId: 'astraYao', appliedPartySlot: 0, metrics: [atkMetric], relationships: [
          baseStat('astraYao', 0, 'atk', 100),
          {
            kind: 'provider', source: operationSource,
            delivery: { recipient: 'all-party', formulas: ['daze_buildup'] },
            effect: {
              kind: 'operation',
              label: 'Daze operation', earliestSurface: 'fully', value: 50, unit: '%',
            },
          },
          {
            kind: 'provider', source: operationSource,
            delivery: { recipient: 'all-party', formulas: ['general_damage'] },
            effect: {
              kind: 'operation',
              label: 'General operation', earliestSurface: 'fully', value: 25, unit: '%',
            },
          },
          {
            kind: 'provider', source: operationSource,
            delivery: { recipient: 'all-party', formulas: ['general_damage'] },
            effect: {
              kind: 'modifier', metricId: 'dmgBonus', earliestSurface: 'fully', value: 25,
            },
          },
          {
            kind: 'provider', source: atkSource,
            delivery: { recipient: 'all-party', formulas: ['general_damage'] },
            effect: {
              kind: 'stat', statId: 'atk', region: 'flat',
              earliestSurface: 'fully', value: 25,
            },
          },
        ],
      },
      { agentId: 'harumasa', appliedPartySlot: 1, metrics: [damageMetric], relationships: [] },
      { agentId: 'grace', appliedPartySlot: 2, metrics: [damageMetric], relationships: [] },
    ]

    const result = evaluateProfileParty(state, profiles)!
    expect(agentResult(result, 'harumasa').operations).toEqual([
      expect.objectContaining({ label: 'General operation', value: 25 }),
    ])
    expect(agentResult(result, 'astraYao').operations).toEqual([])
    expect(agentResult(result, 'grace').operations).toEqual([])
    expect(agentResult(result, 'harumasa').metrics[0].values.fully).toBe(25)
    expect(agentResult(result, 'grace').metrics[0].values.fully).toBe(25)
    expect(agentResult(result, 'astraYao').metrics[0].values.fully).toBe(125)
  })

  it('admits an optional parent metric when one action aggregate differs', () => {
    const state = createPreparedState({}, ['astraYao', 'trigger', 'zhao'], 1)
    const actionSource = selectSource(
      defineAgentSource('astraYao', 'scoped-damage', 'Scoped damage', 'core'),
      'astraYao', 0,
    )
    const optionalDamage: MetricProjection = {
      ...damageMetric, admission: 'nonzero-or-action',
    }
    const profiles: AgentSourceProfile[] = [
      {
        agentId: 'astraYao', appliedPartySlot: 0,
        metrics: [optionalDamage],
        actions: [actionProjection('dmgBonus', 'scopedDamage', AFTERSHOCK_TARGET)],
        relationships: [{
          kind: 'modifier',
          atom: {
            metricId: 'dmgBonus', earliestSurface: 'fully', value: 20,
            source: actionSource, action: AFTERSHOCK_TARGET,
          },
        }],
      },
      {
        agentId: 'trigger', appliedPartySlot: 1,
        metrics: [optionalDamage], relationships: [],
      },
      { agentId: 'zhao', appliedPartySlot: 2, metrics: [], relationships: [] },
    ]

    const result = evaluateProfileParty(state, profiles)!
    expect(agentResult(result, 'astraYao').metrics.map(({ id }) => id)).toEqual(['dmgBonus'])
    expect(agentResult(result, 'astraYao').actionModifiers[0]).toEqual(expect.objectContaining({
      values: expect.objectContaining({ fully: 20 }),
    }))
    expect(agentResult(result, 'astraYao').actionModifiers[0].standaloneMetric).toBeUndefined()
    expect(agentResult(result, 'trigger').metrics).toEqual([])
  })

  it('does not expose a nonzero base stat until a modifier or action consumes it', () => {
    const state = createPreparedState({}, ['burnice', 'trigger', 'zhao'], 1)
    const source = selectSource(
      defineAgentSource('burnice', 'conditional-crit', 'Conditional CRIT', 'core'),
      'burnice', 0,
    )
    const metric: MetricProjection = {
      ...critRateMetric, admission: 'disclosed-or-action',
    }
    const profilesFor = (
      relationships: ProfileRelationship[],
      withAction = false,
    ): AgentSourceProfile[] => [{
      agentId: 'burnice', appliedPartySlot: 0,
      metrics: [metric],
      relationships: [baseStat('burnice', 0, 'critRate', 5), ...relationships],
      ...(withAction
        ? { actions: [actionProjection('critRate', 'conditionalCrit', AFTERSHOCK_TARGET)] }
        : {}),
    }, {
      agentId: 'trigger', appliedPartySlot: 1, metrics: [], relationships: [],
    }, {
      agentId: 'zhao', appliedPartySlot: 2, metrics: [], relationships: [],
    }]

    expect(agentResult(evaluateProfileParty(state, profilesFor([]))!, 'burnice').metrics)
      .toEqual([])

    const broad = agentResult(evaluateProfileParty(state, profilesFor([{
      kind: 'modifier',
      atom: {
        metricId: 'critRate', earliestSurface: 'fully', value: 10, source,
      },
    }]))!, 'burnice')
    expect(broad.metrics[0].values.fully).toBe(15)

    const action = agentResult(evaluateProfileParty(state, profilesFor([{
      kind: 'modifier',
      atom: {
        metricId: 'critRate', earliestSurface: 'fully', value: 30,
        source, action: AFTERSHOCK_TARGET,
      },
    }], true))!, 'burnice')
    expect(action.metrics[0].values.fully).toBe(5)
    expect(action.actionModifiers[0].values.fully).toBe(35)
  })

  it('projects an action-only metric without inventing a generic Result row', () => {
    const state = createPreparedState({}, ['astraYao', 'trigger', 'zhao'], 1)
    const source = selectSource(
      defineAgentSource('astraYao', 'action-only-damage', 'Action-only damage', 'core'),
      'astraYao', 0,
    )
    const profiles: AgentSourceProfile[] = [
      {
        agentId: 'astraYao', appliedPartySlot: 0,
        metrics: [{ ...damageMetric, resultVisibility: 'action-only' }],
        actions: [actionProjection('dmgBonus', 'actionOnlyDamage', AFTERSHOCK_TARGET)],
        relationships: [{
          kind: 'modifier',
          atom: {
            metricId: 'dmgBonus', earliestSurface: 'fully', value: 50,
            source, action: AFTERSHOCK_TARGET,
          },
        }],
      },
      { agentId: 'trigger', appliedPartySlot: 1, metrics: [], relationships: [] },
      { agentId: 'zhao', appliedPartySlot: 2, metrics: [], relationships: [] },
    ]

    const result = agentResult(evaluateProfileParty(state, profiles)!, 'astraYao')
    expect(result.metrics).toEqual([])
    expect(result.actionModifiers).toEqual([
      expect.objectContaining({
        id: 'actionOnlyDamage',
        values: expect.objectContaining({ fully: 50 }),
        standaloneMetric: {
          label: 'DMG Bonus',
          unit: '%',
          decimals: 1,
          values: { initial: 0, combat: 0, fully: 0 },
        },
      }),
    ])
  })

  it('preserves a visible parent for a derived action-only metric', () => {
    const state = createPreparedState({}, ['astraYao', 'trigger', 'zhao'], 1)
    const source = selectSource(
      defineAgentSource('astraYao', 'derived-factor', 'Derived factor', 'core'),
      'astraYao', 0,
    )
    const profiles: AgentSourceProfile[] = [
      {
        agentId: 'astraYao', appliedPartySlot: 0,
        metrics: [
          {
            id: 'anomalyProficiency', label: 'Anomaly Proficiency', unit: '',
            decimals: 0, baseValues: { initial: 300, combat: 300, fully: 470 },
          },
          {
            ...damageMetric,
            resultVisibility: 'action-only',
            resultParentMetricId: 'anomalyProficiency',
          },
        ],
        actions: [actionProjection('dmgBonus', 'derivedFactor', AFTERSHOCK_TARGET)],
        relationships: [{
          kind: 'modifier',
          atom: {
            metricId: 'dmgBonus', earliestSurface: 'fully', value: 50,
            source, action: AFTERSHOCK_TARGET,
          },
        }],
      },
      { agentId: 'trigger', appliedPartySlot: 1, metrics: [], relationships: [] },
      { agentId: 'zhao', appliedPartySlot: 2, metrics: [], relationships: [] },
    ]

    const result = agentResult(evaluateProfileParty(state, profiles)!, 'astraYao')
    expect(result.metrics.map(({ id }) => id)).toEqual(['anomalyProficiency'])
    expect(result.actionModifiers[0].standaloneMetric).toEqual(expect.objectContaining({
      parentMetricId: 'anomalyProficiency',
      label: 'DMG Bonus',
      unit: '%',
    }))
  })

  it('adds automatic Energy after percentage composition inside the Energy Result row', () => {
    const state = createPreparedState({}, ['astraYao', 'trigger', 'zhao'], 1)
    const baseSource = selectSource(
      defineAgentBaseSource('astraYao', 'Base Energy Regen'), 'astraYao', 0,
    )
    const percentSource = selectSource(
      defineAgentSource('astraYao', 'energy-percent', 'Energy percentage', 'core'),
      'astraYao', 0,
    )
    const automaticSource = selectSource(
      defineAgentSource('astraYao', 'automatic-energy', 'Automatic Energy', 'special'),
      'astraYao', 0,
    )
    const profiles: AgentSourceProfile[] = [
      {
        agentId: 'astraYao', appliedPartySlot: 0,
        metrics: [{
          id: 'energyRegen', statId: 'energyRegen',
          label: 'Energy Regen', unit: '/s', decimals: 2,
        }],
        relationships: [
          {
            kind: 'stat', atom: {
              statId: 'energyRegen', region: 'base', earliestSurface: 'initial',
              value: 1.2, source: baseSource,
            },
          },
          {
            kind: 'stat', atom: {
              statId: 'energyRegen', region: 'percentage', earliestSurface: 'initial',
              value: 50, source: percentSource,
            },
          },
          {
            kind: 'automatic-energy', atom: {
              earliestSurface: 'fully', value: 0.6, source: automaticSource,
            },
          },
        ],
      },
      { agentId: 'trigger', appliedPartySlot: 1, metrics: [], relationships: [] },
      { agentId: 'zhao', appliedPartySlot: 2, metrics: [], relationships: [] },
    ]

    const energy = agentResult(evaluateProfileParty(state, profiles)!, 'astraYao').metrics[0]
    expect(energy.values.initial).toBeCloseTo(1.8, 10)
    expect(energy.values.combat).toBeCloseTo(1.8, 10)
    expect(energy.values.fully).toBeCloseTo(2.4, 10)
    expect(energy.breakdown.fully).toEqual([
      expect.objectContaining({ label: 'Automatic Energy', amount: 0.6 }),
    ])
  })

  it('composes a capped provider, recipient regions, operations, and live edits', () => {
    const initial = createPreparedState({}, ['astraYao', 'ben', 'nicole'], 1)
    const profilesFor = (state: WorkbenchState) => state.slots.map((_, index) => (
      partyOutcomeProfileFor(
        state.slots[index].agentId as Parameters<typeof partyOutcomeProfileFor>[0],
        state,
        index as 0 | 1 | 2,
      )
    ))
    const edited: WorkbenchState = {
      ...initial,
      slots: initial.slots.map((slot, index) => index === 0
        ? {
          ...slot,
          setup: {
            ...slot.setup,
            substats: { ...slot.setup.substats, atkPct: 1 },
          },
        }
        : slot) as WorkbenchState['slots'],
    }

    const before = evaluateProfileParty(initial, profilesFor(initial))!
    const after = evaluateProfileParty(edited, profilesFor(edited))!
    const beforeAstra = agentResult(before, 'astraYao')
    const afterAstra = agentResult(after, 'astraYao')
    const beforeBen = agentResult(before, 'ben')
    const afterBen = agentResult(after, 'ben')

    expect(beforeAstra.metrics.find(({ id }) => id === 'atk')?.gauges[0]).toEqual(
      expect.objectContaining({ outputLabel: 'Core flat ATK' }),
    )
    expect(afterAstra.metrics.find(({ id }) => id === 'atk')?.gauges[0]?.outputValue)
      .toBeGreaterThan(beforeAstra.metrics.find(({ id }) => id === 'atk')!.gauges[0]!.outputValue)
    expect(afterBen.metrics.find(({ id }) => id === 'atk')!.values.fully)
      .toBeGreaterThan(beforeBen.metrics.find(({ id }) => id === 'atk')!.values.fully)
    expect(afterBen.metrics.find(({ id }) => id === 'atk')!.breakdown.fully)
      .toContainEqual(expect.objectContaining({ ownerAgentId: 'astraYao' }))
    expect(afterAstra.metrics.find(({ id }) => id === 'atk')!.breakdown.fully)
      .toContainEqual(expect.objectContaining({ label: 'Core Passive' }))
    expect(afterBen.metrics.map(({ id }) => id)).toContain('defReduction')
    expect(edited.slots[0].setup.engineId).toBe(initial.slots[0].setup.engineId)
  })

  it('recomposes one continuous derived stat independently at every Result surface', () => {
    const state = createPreparedState({}, ['astraYao', 'trigger', 'zhao'], 1)
    const derived = selectSource(
      defineAgentSource('astraYao', 'surface-linear', 'Surface linear output', 'core'),
      'astraYao', 0,
    )
    const impactInput = selectSource(
      defineAgentSource('astraYao', 'impact-input', 'Impact input', 'core'),
      'astraYao', 0,
    )
    const profiles: AgentSourceProfile[] = [
      {
        agentId: 'astraYao', appliedPartySlot: 0,
        metrics: [atkMetric, { id: 'impact', statId: 'impact', label: 'Impact', unit: '', decimals: 1 }],
        relationships: [
          baseStat('astraYao', 0, 'atk', 1000),
          baseStat('astraYao', 0, 'impact', 100),
          { kind: 'stat', atom: { statId: 'impact', region: 'percentage', earliestSurface: 'initial', value: 30, source: impactInput } },
          { kind: 'stat', atom: { statId: 'impact', region: 'percentage', earliestSurface: 'combat', value: 20, source: impactInput } },
          { kind: 'stat', atom: { statId: 'impact', region: 'percentage', earliestSurface: 'fully', value: 20, source: impactInput } },
          {
            kind: 'gauge', source: derived,
            basis: { statId: 'impact', surface: 'each' },
            basisLabel: 'Fully Enabled Impact', basisThreshold: 120, basisCap: 220,
            metricId: 'impact',
            outputs: [{
              label: 'Derived flat ATK', unit: '', cap: 600,
              transform: { basisThreshold: 120, basisIncrement: 1, outputIncrement: 6, outputCap: 600 },
              emission: { kind: 'stat', statId: 'atk', region: 'flat', earliestSurface: 'initial' },
            }],
          },
        ],
      },
      { agentId: 'trigger', appliedPartySlot: 1, metrics: [], relationships: [] },
      { agentId: 'zhao', appliedPartySlot: 2, metrics: [], relationships: [] },
    ]

    const result = agentResult(evaluateProfileParty(state, profiles)!, 'astraYao')
    expect(result.metrics.find(({ id }) => id === 'impact')?.values)
      .toEqual({ initial: 130, combat: 156, fully: 182 })
    expect(result.metrics.find(({ id }) => id === 'atk')?.values)
      .toEqual({ initial: 1060, combat: 1216, fully: 1372 })
    expect(result.metrics.find(({ id }) => id === 'impact')?.gauges[0])
      .toEqual(expect.objectContaining({ current: 182, outputValue: 372 }))
  })

  it('keeps a completed-stat activation gauge below threshold and emits only at the earliest qualifying surface', () => {
    const state = createPreparedState({}, ['evelyn', 'trigger', 'zhao'], 1)
    const source = selectSource(
      defineAgentSource('evelyn', 'threshold-activation', 'Threshold activation', 'additional'),
      'evelyn', 0,
    )
    const input = selectSource(
      defineAgentSource('evelyn', 'crit-input', 'CRIT input', 'core'),
      'evelyn', 0,
    )
    const evaluate = (combat: number, fully: number) => {
      const profiles: AgentSourceProfile[] = [
        {
          agentId: 'evelyn', appliedPartySlot: 0,
          metrics: [critRateMetric],
          relationships: [
            baseStat('evelyn', 0, 'critRate', 40),
            { kind: 'stat', atom: { statId: 'critRate', region: 'flat', earliestSurface: 'combat', value: combat, source: input } },
            { kind: 'stat', atom: { statId: 'critRate', region: 'flat', earliestSurface: 'fully', value: fully, source: input } },
            {
              kind: 'threshold-operation', source,
              basis: { statId: 'critRate' },
              basisLabels: { combat: 'Combat CRIT Rate', fully: 'Fully Enabled CRIT Rate' },
              threshold: 80, metricId: 'critRate',
              outputLabel: 'Action DMG Multiplier', inactiveValue: 1, activeValue: 1.25,
              unit: '', presentation: 'scale',
            },
          ],
        },
        { agentId: 'trigger', appliedPartySlot: 1, metrics: [], relationships: [] },
        { agentId: 'zhao', appliedPartySlot: 2, metrics: [], relationships: [] },
      ]
      return agentResult(evaluateProfileParty(state, profiles)!, 'evelyn')
    }

    const below = evaluate(20, 10)
    expect(below.metrics[0].gauges[0]).toEqual(expect.objectContaining({
      basisLabel: 'Fully Enabled CRIT Rate', current: 70, outputValue: 1,
    }))
    expect(below.operations).toEqual([])

    const fully = evaluate(20, 25)
    expect(fully.metrics[0].gauges[0]).toEqual(expect.objectContaining({
      basisLabel: 'Fully Enabled CRIT Rate', current: 85, outputValue: 1.25,
    }))
    expect(fully.operations).toEqual([
      expect.objectContaining({ label: 'Action DMG Multiplier', surface: 'fully', value: 1.25 }),
    ])

    const combat = evaluate(45, 10)
    expect(combat.metrics[0].gauges[0]).toEqual(expect.objectContaining({
      basisLabel: 'Combat CRIT Rate', current: 85, outputValue: 1.25,
    }))
    expect(combat.operations[0]).toEqual(expect.objectContaining({ surface: 'combat' }))
  })

  it('preserves an open-ended gauge threshold and output without synthesizing caps', () => {
    const state = createPreparedState({}, ['astraYao', 'trigger', 'zhao'], 1)
    const source = selectSource(
      defineAgentSource('astraYao', 'open-threshold', 'Open threshold', 'core'),
      'astraYao', 0,
    )
    const profiles: AgentSourceProfile[] = [
      {
        agentId: 'astraYao', appliedPartySlot: 0,
        metrics: [atkMetric, damageMetric],
        relationships: [
          baseStat('astraYao', 0, 'atk', 125),
          {
            kind: 'gauge', source,
            basis: { statId: 'atk', surface: 'initial' }, basisLabel: 'Initial ATK',
            basisThreshold: 100, metricId: 'atk',
            outputs: [{
              label: 'Squad flat ATK', unit: '',
              transform: { basisThreshold: 100, basisIncrement: 1, outputIncrement: 1 },
              emission: { kind: 'modifier', metricId: 'dmgBonus', earliestSurface: 'fully' },
            }],
          },
        ],
      },
      { agentId: 'trigger', appliedPartySlot: 1, metrics: [], relationships: [] },
      { agentId: 'zhao', appliedPartySlot: 2, metrics: [], relationships: [] },
    ]

    const gauge = agentResult(evaluateProfileParty(state, profiles)!, 'astraYao').metrics[0].gauges[0]!
    expect(gauge).toEqual(expect.objectContaining({
      basisLabel: 'Initial ATK', current: 125, threshold: 100, outputValue: 25,
    }))
    expect(gauge).not.toHaveProperty('cap')
    expect(gauge).not.toHaveProperty('outputCap')
  })

  it('projects an applied cap while retaining the pre-cap gauge basis', () => {
    const state = createPreparedState({}, ['yeShunguang', 'astraYao', 'zhao'], 1)
    const target = selectSource(
      defineCalculationSource('yeShunguang:target-stun', 'Target Stun DMG Multiplier', 'target'),
      'yeShunguang', 0,
    )
    const providerSource = selectSource(
      defineAgentSource('astraYao', 'stun-multiplier', 'Delivered Stun multiplier', 'core'),
      'astraYao', 1,
    )
    const capSource = selectSource(
      defineCalculationSource('yeShunguang:veil-cap', 'Veil Vulnerability cap'),
      'yeShunguang', 0,
    )
    const profiles: AgentSourceProfile[] = [
      {
        agentId: 'yeShunguang', appliedPartySlot: 0,
        metrics: [{
          id: 'stunDmgMultiplier', label: 'Stun DMG Multiplier', unit: '%', decimals: 1,
          baseValues: { initial: 0, combat: 0, fully: 0 },
          cap: { value: 110, source: capSource },
        }],
        relationships: [
          {
            kind: 'modifier', atom: {
              metricId: 'stunDmgMultiplier', earliestSurface: 'fully', value: 50,
              source: target, sourceDetail: 'Above 100%',
            },
          },
          {
            kind: 'projection-gauge', source: target,
            metricId: 'stunDmgMultiplier', basisLabel: 'Raw Stun DMG Multiplier bonus',
            basisCap: 110,
            output: {
              label: 'Veil Vulnerability',
              transform: { basisIncrement: 1, outputIncrement: 1, outputCap: 110 },
              cap: 110, unit: '%',
            },
          },
        ],
      },
      {
        agentId: 'astraYao', appliedPartySlot: 1, metrics: [],
        relationships: [{
          kind: 'provider', source: providerSource,
          delivery: { recipient: 'all-party' },
          effect: {
            kind: 'modifier', metricId: 'stunDmgMultiplier',
            earliestSurface: 'fully', value: 80,
          },
        }],
      },
      { agentId: 'zhao', appliedPartySlot: 2, metrics: [], relationships: [] },
    ]

    const metric = agentResult(evaluateProfileParty(state, profiles)!, 'yeShunguang').metrics[0]
    expect(metric.values.fully).toBe(110)
    expect(metric.gauges[0]).toEqual(expect.objectContaining({
      current: 130, cap: 110, outputValue: 110, outputCap: 110,
    }))
    expect(metric.breakdown.fully).toContainEqual(expect.objectContaining({
      locus: 'target', amount: 50,
    }))
    expect(metric.breakdown.fully).toContainEqual(expect.objectContaining({
      locus: 'calculation', amount: -20,
    }))
  })

  it('derives one action modifier and gauge from the completed post-delivery stat', () => {
    const state = createPreparedState({}, ['grace', 'yuzuha', 'zhao'], 0)
    const timeweaver = selectSource(
      defineAgentSource('grace', 'timeweaver-threshold', 'Timeweaver threshold', 'special'),
      'grace', 0,
    )
    const profilesFor = (providerAmount: number): AgentSourceProfile[] => [
      {
        agentId: 'grace', appliedPartySlot: 0,
        metrics: [
          {
            id: 'anomalyProficiency', statId: 'anomalyProficiency',
            label: 'Anomaly Proficiency', unit: '', decimals: 0,
          },
          { ...anomalyDamageMetric, resultVisibility: 'action-only' },
        ],
        actions: [actionProjection('anomalyDmgBonus', 'graceDisorder', DISORDER_TARGET)],
        relationships: [
          baseStat('grace', 0, 'anomalyProficiency', 340),
          {
            kind: 'post-delivery-stat-modifier-gauge',
            source: timeweaver,
            basis: { statId: 'anomalyProficiency', surface: 'fully' },
            basisLabel: 'Fully Enabled Anomaly Proficiency',
            basisCap: 375,
            gaugeMetricId: 'anomalyProficiency', modifierMetricId: 'anomalyDmgBonus',
            action: DISORDER_TARGET, modifierSurface: 'fully',
            output: {
              label: 'Disorder DMG Bonus',
              value: {
                kind: 'activation', threshold: 375,
                inactiveValue: 0, activeValue: 25,
              },
              cap: 25, unit: '%',
            },
          },
        ],
      },
      {
        agentId: 'yuzuha', appliedPartySlot: 1, metrics: [],
        relationships: [{
          kind: 'provider',
          source: selectSource(
            defineAgentSource('yuzuha', 'ap-provider', 'Delivered Anomaly Proficiency', 'special'),
            'yuzuha', 1,
          ),
          delivery: { recipient: 'all-party', specialties: ['Anomaly'] },
          effect: {
            kind: 'stat', statId: 'anomalyProficiency', region: 'flat',
            earliestSurface: 'fully', value: providerAmount,
          },
        }],
      },
      { agentId: 'zhao', appliedPartySlot: 2, metrics: [], relationships: [] },
    ]

    const below = agentResult(evaluateProfileParty(state, profilesFor(34))!, 'grace')
    expect(below.metrics[0].values.fully).toBe(374)
    expect(below.metrics[0].gauges[0]).toEqual(expect.objectContaining({
      current: 374, threshold: 375, outputValue: 0,
    }))
    expect(below.actionModifiers).toEqual([])

    const at = agentResult(evaluateProfileParty(state, profilesFor(35))!, 'grace')
    expect(at.metrics[0].gauges[0]).toEqual(expect.objectContaining({
      current: 375, threshold: 375, outputValue: 25,
    }))
    expect(at.actionModifiers[0].values.fully).toBe(25)

    const above = agentResult(evaluateProfileParty(state, profilesFor(40))!, 'grace')
    expect(above.metrics[0].values.fully).toBe(380)
    expect(above.metrics[0].gauges[0]).toEqual(expect.objectContaining({
      current: 380, threshold: 375, outputValue: 25,
    }))
    expect(above.actionModifiers).toEqual([
      expect.objectContaining({ id: 'graceDisorder', values: expect.objectContaining({ fully: 25 }) }),
    ])
    expect(above.actionModifiers[0].breakdown.fully).toContainEqual(
      expect.objectContaining({ label: 'Timeweaver threshold', amount: 25 }),
    )
  })

  it('caps one completed linear gauge basis and preserves its threshold', () => {
    const state = createPreparedState({}, ['grace', 'yuzuha', 'zhao'], 0)
    const source = selectSource(
      defineAgentSource('grace', 'capped-linear-gauge', 'Capped linear gauge', 'special'),
      'grace', 0,
    )
    const profiles: AgentSourceProfile[] = [
      {
        agentId: 'grace', appliedPartySlot: 0,
        metrics: [
          { ...critRateMetric, cap: { value: 100, source } },
          {
            id: 'dazeBonus', label: 'Daze Bonus', unit: '%', decimals: 1,
            baseValues: { initial: 0, combat: 0, fully: 0 },
            admission: 'action', resultVisibility: 'action-only',
          },
        ],
        actions: [actionProjection('dazeBonus', 'cappedLinearGauge', AFTERSHOCK_TARGET)],
        relationships: [
          baseStat('grace', 0, 'critRate', 115.4),
          {
            kind: 'post-delivery-stat-modifier-gauge',
            source,
            basis: { statId: 'critRate', surface: 'fully' },
            basisLabel: 'Fully Enabled CRIT Rate',
            basisValueCap: 100,
            basisCap: 90,
            gaugeMetricId: 'critRate',
            modifierMetricId: 'dazeBonus',
            action: AFTERSHOCK_TARGET,
            modifierSurface: 'fully',
            output: {
              label: 'Action Daze bonus',
              value: {
                kind: 'linear',
                transform: {
                  basisThreshold: 40,
                  basisIncrement: 1,
                  outputIncrement: 0.5,
                  outputCap: 75,
                },
              },
              cap: 75,
              unit: '%',
            },
          },
        ],
      },
      { agentId: 'yuzuha', appliedPartySlot: 1, metrics: [], relationships: [] },
      { agentId: 'zhao', appliedPartySlot: 2, metrics: [], relationships: [] },
    ]

    const result = agentResult(evaluateProfileParty(state, profiles)!, 'grace')
    expect(result.metrics[0].values.fully).toBe(100)
    expect(result.metrics[0].gauges[0]).toEqual(expect.objectContaining({
      current: 100,
      threshold: 40,
      cap: 90,
      outputValue: 30,
      outputCap: 75,
    }))
    expect(result.actionModifiers[0].values.fully).toBe(30)
  })

  it('delivers one post-delivery linear provider without slot-order feedback', () => {
    const profilesFor = (state: WorkbenchState): AgentSourceProfile[] => state.slots.map(
      ({ agentId }, slotIndex) => {
        const slot = slotIndex as 0 | 1 | 2
        if (agentId === 'anbySoldier0') {
          const core = selectSource(
            defineAgentSource('anbySoldier0', 'aftershock-crit', 'Core Passive', 'core'),
            agentId, slot,
          )
          return {
            agentId, appliedPartySlot: slot, metrics: [critDmgMetric],
            actions: [actionProjection('critDmg', 'anbyAftershockCrit', AFTERSHOCK_TARGET)],
            relationships: [
              baseStat(agentId, slot, 'critDmg', 100),
              postDeliveryAftershockProvider(core),
            ],
          }
        }
        const amount = agentId === 'trigger' ? 20 : 10
        const source = selectSource(
          defineAgentSource(agentId, 'crit-provider', `${agentId} CRIT provider`, 'core'),
          agentId, slot,
        )
        const relationship: ProfileRelationship = {
          kind: 'provider', source,
          delivery: { recipient: 'all-party' },
          effect: {
            kind: 'stat', statId: 'critDmg', region: 'flat',
            earliestSurface: 'fully', value: amount,
          },
        }
        return agentId === 'trigger'
          ? {
            agentId, appliedPartySlot: slot, metrics: [critDmgMetric],
            actions: [actionProjection('critDmg', 'triggerAftershockCrit', AFTERSHOCK_TARGET)],
            relationships: [baseStat(agentId, slot, 'critDmg', 50), relationship],
          }
          : { agentId, appliedPartySlot: slot, metrics: [], relationships: [relationship] }
      },
    )
    const firstState = createPreparedState(
      {}, ['astraYao', 'anbySoldier0', 'trigger'], 1,
    )
    const reorderedState = createPreparedState(
      {}, ['trigger', 'anbySoldier0', 'astraYao'], 1,
    )

    for (const state of [firstState, reorderedState]) {
      const result = evaluateProfileParty(state, [...profilesFor(state)].reverse())!
      const anby = agentResult(result, 'anbySoldier0')
      const trigger = agentResult(result, 'trigger')
      expect(anby.metrics[0].values.fully).toBe(130)
      expect(anby.actionModifiers[0].values.fully).toBeCloseTo(175.5, 10)
      expect(trigger.actionModifiers[0].values.fully).toBeCloseTo(125.5, 10)
      expect(anby.actionModifiers[0].breakdown.fully.filter(
        ({ label }) => label === 'Core Passive',
      )).toHaveLength(1)
    }
  })

  it('uses holder-local stats for ordinary derived providers and delivered stats only for Anby', () => {
    const state = createPreparedState(
      {}, ['lighter', 'anbySoldier0', 'soldier11'], 2,
    )
    const lighterCore = selectSource(
      defineAgentSource('lighter', 'core-impact', 'Core Passive', 'core'),
      'lighter', 0,
    )
    const lighterAdditional = selectSource(
      defineAgentSource('lighter', 'elation', 'Additional Ability', 'additional'),
      'lighter', 0,
    )
    const lighterEngine = selectSource(
      defineAgentSource('lighter', 'local-impact', 'Local Impact', 'special'),
      'lighter', 0,
    )
    const anbyCore = selectSource(
      defineAgentSource('anbySoldier0', 'aftershock-crit', 'Core Passive', 'core'),
      'anbySoldier0', 1,
    )
    const external = selectSource(
      defineAgentSource('soldier11', 'ordinary-provider', 'Ordinary provider', 'core'),
      'soldier11', 2,
    )
    const profiles: AgentSourceProfile[] = [{
      agentId: 'lighter', appliedPartySlot: 0,
      metrics: [{
        id: 'impact', statId: 'impact', label: 'Impact', unit: '', decimals: 1,
      }],
      relationships: [
        baseStat('lighter', 0, 'impact', 137),
        {
          kind: 'stat',
          atom: {
            statId: 'impact', region: 'percentage', earliestSurface: 'initial',
            value: 18, source: lighterEngine,
          },
        },
        {
          kind: 'stat',
          atom: {
            statId: 'impact', region: 'percentage', earliestSurface: 'fully',
            value: 20, source: lighterCore,
          },
        },
        {
          kind: 'gauge',
          source: lighterAdditional,
          basis: { statId: 'impact', surface: 'fully' },
          basisLabel: 'Fully Enabled Impact',
          basisThreshold: 170,
          basisCap: 270,
          metricId: 'impact',
          outputs: [{
            label: 'Elemental DMG Bonus', unit: '%', cap: 75,
            transform: {
              basisThreshold: 170, basisIncrement: 10,
              baseOutput: 25, outputIncrement: 5, outputCap: 75,
            },
            emission: {
              kind: 'provider',
              delivery: { recipient: 'all-party', formulas: ['general_damage'] },
              effect: {
                kind: 'modifier', metricId: 'dmgBonus', earliestSurface: 'fully',
              },
            },
          }],
        },
      ],
    }, {
      agentId: 'anbySoldier0', appliedPartySlot: 1,
      metrics: [critDmgMetric],
      actions: [actionProjection('critDmg', 'anbyAftershockCrit', AFTERSHOCK_TARGET)],
      relationships: [
        baseStat('anbySoldier0', 1, 'critDmg', 100),
        postDeliveryAftershockProvider(anbyCore),
      ],
    }, {
      agentId: 'soldier11', appliedPartySlot: 2,
      metrics: [damageMetric],
      relationships: [{
        kind: 'provider', source: external,
        delivery: { recipient: 'all-party', eligibleAgentIds: ['lighter'] },
        effect: {
          kind: 'stat', statId: 'impact', region: 'flat',
          earliestSurface: 'fully', value: 100,
        },
      }, {
        kind: 'provider', source: external,
        delivery: { recipient: 'all-party', eligibleAgentIds: ['anbySoldier0'] },
        effect: {
          kind: 'stat', statId: 'critDmg', region: 'flat',
          earliestSurface: 'fully', value: 30,
        },
      }],
    }]

    const result = evaluateProfileParty(state, profiles)!
    const lighter = agentResult(result, 'lighter')
    const anby = agentResult(result, 'anbySoldier0')
    const soldier = agentResult(result, 'soldier11')

    expect(lighter.metrics[0].values.fully).toBeCloseTo(293.992, 10)
    expect(lighter.metrics[0].gauges[0]?.outputValue).toBeCloseTo(36.996, 10)
    expect(lighter.metrics[0].breakdown.fully.find(
      ({ label }) => label === 'Core Passive',
    )?.display).toEqual({ value: 20, unit: '%', decimals: 0 })
    expect(soldier.metrics[0].values.fully).toBeCloseTo(36.996, 10)
    expect(anby.metrics[0].values.fully).toBe(130)
    expect(anby.actionModifiers[0].values.fully).toBeCloseTo(175.5, 10)
  })

  it('derives a visible metric from each completed stat surface before direct additions', () => {
    const state = createPreparedState({}, ['yixuan', 'astraYao', 'zhao'], 0)
    const ruptureSource = selectSource(
      defineAgentSource('yixuan', 'rupture-specialty', 'Rupture specialty', 'identity'),
      'yixuan', 0,
    )
    const directSource = selectSource(
      defineAgentSource('yixuan', 'direct-sheer', 'Direct Sheer Force', 'core'),
      'yixuan', 0,
    )
    const provider = (
      agentId: 'astraYao' | 'zhao',
      slot: 1 | 2,
      statId: 'atk' | 'maxHp',
      region: 'flat' | 'percentage',
      earliestSurface: 'combat' | 'fully',
      value: number,
    ): AgentSourceProfile => ({
      agentId,
      appliedPartySlot: slot,
      metrics: [],
      relationships: [{
        kind: 'provider',
        source: selectSource(
          defineAgentSource(agentId, `${statId}-provider`, `${statId} provider`, 'core'),
          agentId, slot,
        ),
        delivery: { recipient: 'all-party' },
        effect: { kind: 'stat', statId, region, earliestSurface, value },
      }],
    })
    const profiles: AgentSourceProfile[] = [
      {
        agentId: 'yixuan',
        appliedPartySlot: 0,
        metrics: [
          atkMetric,
          { id: 'maxHp', statId: 'maxHp', label: 'Max HP', unit: '', decimals: 0 },
          { id: 'sheerForce', label: 'Sheer Force', unit: '', decimals: 1 },
        ],
        relationships: [
          baseStat('yixuan', 0, 'atk', 1000),
          baseStat('yixuan', 0, 'maxHp', 10_000),
          {
            kind: 'surface-stat-derived-metric',
            source: ruptureSource,
            metricId: 'sheerForce',
            terms: [
              { statId: 'atk', multiplier: 0.3 },
              { statId: 'maxHp', multiplier: 0.1 },
            ],
            sourceDetail: 'Current ATK × 0.3 + Current Max HP × 0.1',
          },
          {
            kind: 'modifier',
            atom: {
              metricId: 'sheerForce', earliestSurface: 'fully', value: 200,
              source: directSource,
            },
          },
        ],
      },
      provider('astraYao', 1, 'atk', 'flat', 'fully', 100),
      provider('zhao', 2, 'maxHp', 'percentage', 'combat', 10),
    ]

    const result = agentResult(evaluateProfileParty(state, [...profiles].reverse())!, 'yixuan')
    const sheer = result.metrics.find(({ id }) => id === 'sheerForce')!
    expect(sheer.values).toEqual({ initial: 1300, combat: 1400, fully: 1630 })
    expect(sheer.breakdown.initial).toEqual([
      expect.objectContaining({ label: 'Rupture specialty', amount: 1300 }),
    ])
    expect(sheer.breakdown.fully).toEqual([
      expect.objectContaining({ label: 'Rupture specialty', amount: 1430 }),
      expect.objectContaining({ label: 'Direct Sheer Force', amount: 200 }),
    ])
  })

  it('rejects an unrecognized relationship variant', () => {
    expect(() => evaluateRelationships(
      [{ kind: 'callback' } as unknown as ProfileRelationship],
      {},
    )).toThrow('Unsupported relationship variant')
  })
})
