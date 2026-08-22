import { describe, expect, it } from 'vitest'
import { AFTERSHOCK_TARGET, BASIC_AFTERSHOCK_TARGET, DISORDER_TARGET } from '../actions'
import {
  defineAgentBaseSource,
  defineAgentSource,
  defineCalculationSource,
  defineDriveDiscSource,
} from '../content/source-definitions'
import { createPreparedState, type WorkbenchState } from '../state'
import { providerDefenseProfileFor } from '../content/agent-sources/provider-defense'
import {
  actionProjection,
  evaluateProfileParty,
  type AgentSourceProfile,
  type MetricProjection,
} from './profile-harness'
import { evaluateRelationships, type ProfileRelationship } from './relationships'
import { selectSource, type SelectedSourceInstance } from './source-instance'
import type { StatId } from './stat-composer'

const atkMetric: MetricProjection = {
  id: 'atk', statId: 'atk', label: 'ATK', unit: '', decimals: 0,
}

const critDmgMetric: MetricProjection = {
  id: 'critDmg', statId: 'critDmg', label: 'CRIT DMG', unit: '%', decimals: 1,
}

const damageMetric: MetricProjection = {
  id: 'dmgBonus', label: 'DMG Bonus', unit: '%', decimals: 1,
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

function agentResult(
  result: NonNullable<ReturnType<typeof evaluateProfileParty>>,
  agentId: AgentSourceProfile['agentId'],
) {
  return result.agents.find((agent) => agent.agentId === agentId)!
}

describe('profile calculation harness', () => {
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

  it('resolves explicit non-stacking per reached action consumer and preserves equal origins', () => {
    const state = createPreparedState({}, ['astraYao', 'anbySoldier0', 'trigger'], 1)
    const firstKing = selectSource(
      defineDriveDiscSource('king', '4-piece', 'King of the Summit'),
      'astraYao', 0,
      { kind: 'drive-disc', selectedRole: '4-piece', effectPiece: '4-piece' },
    )
    const secondKing = selectSource(
      defineDriveDiscSource('king', '4-piece', 'King of the Summit'),
      'anbySoldier0', 1,
      { kind: 'drive-disc', selectedRole: '4-piece', effectPiece: '4-piece' },
    )
    const unrelated = selectSource(
      defineAgentSource('astraYao', 'unrelated-aftershock', 'Unrelated Aftershock bonus', 'core'),
      'astraYao', 0,
    )
    const provider = (
      source: SelectedSourceInstance,
      recipient: 'all-party' | 'focus',
      value: number,
      nonstackId?: 'kingOfTheSummit',
    ): ProfileRelationship => ({
      kind: 'provider', source,
      delivery: {
        recipient,
        eligibleAgentIds: ['anbySoldier0', 'trigger'],
      },
      effect: {
        kind: 'modifier', metricId: 'dmgBonus', earliestSurface: 'fully',
        value, action: AFTERSHOCK_TARGET,
        ...(nonstackId ? { nonstackId } : {}),
      },
    })
    const profiles: AgentSourceProfile[] = [
      {
        agentId: 'astraYao', appliedPartySlot: 0, metrics: [damageMetric],
        relationships: [
          provider(firstKing, 'all-party', 20, 'kingOfTheSummit'),
          provider(unrelated, 'all-party', 5),
        ],
      },
      {
        agentId: 'anbySoldier0', appliedPartySlot: 1, metrics: [damageMetric],
        actions: [actionProjection('dmgBonus', 'anbyAftershock', AFTERSHOCK_TARGET)],
        relationships: [provider(secondKing, 'focus', 20, 'kingOfTheSummit')],
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
    expect(anbyAction.values.fully).toBe(25)
    expect(anbyAction.breakdown.fully.filter(
      ({ notation }) => notation === 'equal-nonstack-origin',
    )).toHaveLength(1)
    expect(anbyAction.breakdown.fully.map(({ label }) => label)).toEqual([
      'King of the Summit',
      'Unrelated Aftershock bonus',
      'King of the Summit',
    ])
    expect(triggerAction.values.fully).toBe(25)
    expect(triggerAction.breakdown.fully.filter(
      ({ label }) => label === 'King of the Summit',
    )).toHaveLength(1)
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
            kind: 'operation', operationId: 'nextActionDaze',
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
      expect.objectContaining({ id: 'nextActionDaze', value: 50 }),
    ])
    expect(agentResult(result, 'trigger').operations[0].source.ownerAgentId).toBe('astraYao')
    expect(agentResult(result, 'astraYao').operations).toEqual([])
    expect(agentResult(result, 'zhao').operations).toEqual([])
  })

  it('admits an optional metric only for a nonzero aggregate or an action consumer', () => {
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
    expect(agentResult(result, 'astraYao').actionModifiers[0].values.fully).toBe(20)
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
      expect.objectContaining({ id: 'actionOnlyDamage', values: expect.objectContaining({ fully: 50 }) }),
    ])
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
      providerDefenseProfileFor(state, index as 0 | 1 | 2)!
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

    expect(beforeAstra.metrics.find(({ id }) => id === 'atk')?.gauge).toEqual(
      expect.objectContaining({ outputLabel: 'Core flat ATK' }),
    )
    expect(afterAstra.metrics.find(({ id }) => id === 'atk')?.gauge?.outputValue)
      .toBeGreaterThan(beforeAstra.metrics.find(({ id }) => id === 'atk')!.gauge!.outputValue)
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
        metrics: [atkMetric, { id: 'impact', statId: 'impact', label: 'Impact', unit: '', decimals: 1, gaugeId: 'surfaceLinear' }],
        relationships: [
          baseStat('astraYao', 0, 'atk', 1000),
          baseStat('astraYao', 0, 'impact', 100),
          { kind: 'stat', atom: { statId: 'impact', region: 'percentage', earliestSurface: 'initial', value: 30, source: impactInput } },
          { kind: 'stat', atom: { statId: 'impact', region: 'percentage', earliestSurface: 'combat', value: 20, source: impactInput } },
          { kind: 'stat', atom: { statId: 'impact', region: 'percentage', earliestSurface: 'fully', value: 20, source: impactInput } },
          {
            kind: 'gauge', gaugeId: 'surfaceLinear', source: derived,
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
    expect(result.metrics.find(({ id }) => id === 'impact')?.gauge)
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
          metrics: [{ ...critRateMetric, gaugeId: 'critActivation' }],
          relationships: [
            baseStat('evelyn', 0, 'critRate', 40),
            { kind: 'stat', atom: { statId: 'critRate', region: 'flat', earliestSurface: 'combat', value: combat, source: input } },
            { kind: 'stat', atom: { statId: 'critRate', region: 'flat', earliestSurface: 'fully', value: fully, source: input } },
            {
              kind: 'threshold-operation', gaugeId: 'critActivation', source,
              basis: { statId: 'critRate' },
              basisLabels: { combat: 'Combat CRIT Rate', fully: 'Fully Enabled CRIT Rate' },
              threshold: 80, metricId: 'critRate',
              outputLabel: 'Action DMG Multiplier', inactiveValue: 1, activeValue: 1.25,
              unit: '', operationId: 'actionDmgMultiplier', presentation: 'scale',
            },
          ],
        },
        { agentId: 'trigger', appliedPartySlot: 1, metrics: [], relationships: [] },
        { agentId: 'zhao', appliedPartySlot: 2, metrics: [], relationships: [] },
      ]
      return agentResult(evaluateProfileParty(state, profiles)!, 'evelyn')
    }

    const below = evaluate(20, 10)
    expect(below.metrics[0].gauge).toEqual(expect.objectContaining({
      basisLabel: 'Fully Enabled CRIT Rate', current: 70, outputValue: 1,
    }))
    expect(below.operations).toEqual([])

    const fully = evaluate(20, 25)
    expect(fully.metrics[0].gauge).toEqual(expect.objectContaining({
      basisLabel: 'Fully Enabled CRIT Rate', current: 85, outputValue: 1.25,
    }))
    expect(fully.operations).toEqual([
      expect.objectContaining({ id: 'actionDmgMultiplier', surface: 'fully', value: 1.25 }),
    ])

    const combat = evaluate(45, 10)
    expect(combat.metrics[0].gauge).toEqual(expect.objectContaining({
      basisLabel: 'Combat CRIT Rate', current: 85, outputValue: 1.25,
    }))
    expect(combat.operations[0]).toEqual(expect.objectContaining({ surface: 'combat' }))
  })

  it('projects a Result-only cap from target input plus compatible delivered modifiers', () => {
    const state = createPreparedState({}, ['yeShunguang', 'astraYao', 'zhao'], 1)
    const target = selectSource(
      defineCalculationSource('yeShunguang:target-stun', 'Target Stun DMG Multiplier', 'target'),
      'yeShunguang', 0,
    )
    const providerSource = selectSource(
      defineAgentSource('astraYao', 'stun-multiplier', 'Delivered Stun multiplier', 'core'),
      'astraYao', 1,
    )
    const profiles: AgentSourceProfile[] = [
      {
        agentId: 'yeShunguang', appliedPartySlot: 0,
        metrics: [{
          id: 'stunDmgMultiplier', label: 'Stun DMG Multiplier', unit: '%', decimals: 1,
          baseValues: { initial: 0, combat: 0, fully: 0 }, gaugeId: 'veilCap',
        }],
        relationships: [
          {
            kind: 'modifier', atom: {
              metricId: 'stunDmgMultiplier', earliestSurface: 'fully', value: 50,
              source: target, sourceDetail: 'Above 100%',
            },
          },
          {
            kind: 'projection-gauge', gaugeId: 'veilCap', source: target,
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
    expect(metric.values.fully).toBe(130)
    expect(metric.gauge).toEqual(expect.objectContaining({
      current: 130, outputValue: 110, outputCap: 110,
    }))
    expect(metric.breakdown.fully).toContainEqual(expect.objectContaining({
      locus: 'target', amount: 50,
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
            gaugeId: 'timeweaverDisorder',
          },
          { ...damageMetric, resultVisibility: 'action-only' },
        ],
        actions: [actionProjection('dmgBonus', 'graceDisorder', DISORDER_TARGET)],
        relationships: [
          baseStat('grace', 0, 'anomalyProficiency', 340),
          {
            kind: 'post-delivery-stat-modifier-gauge',
            gaugeId: 'timeweaverDisorder', source: timeweaver,
            basis: { statId: 'anomalyProficiency', surface: 'fully' },
            basisLabel: 'Fully Enabled Anomaly Proficiency',
            basisCap: 375,
            gaugeMetricId: 'anomalyProficiency', modifierMetricId: 'dmgBonus',
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
    expect(below.metrics[0].gauge).toEqual(expect.objectContaining({
      current: 374, threshold: 375, outputValue: 0,
    }))
    expect(below.actionModifiers).toEqual([])

    const at = agentResult(evaluateProfileParty(state, profilesFor(35))!, 'grace')
    expect(at.metrics[0].gauge).toEqual(expect.objectContaining({
      current: 375, threshold: 375, outputValue: 25,
    }))
    expect(at.actionModifiers[0].values.fully).toBe(25)

    const above = agentResult(evaluateProfileParty(state, profilesFor(40))!, 'grace')
    expect(above.metrics[0].values.fully).toBe(380)
    expect(above.metrics[0].gauge).toEqual(expect.objectContaining({
      current: 380, threshold: 375, outputValue: 25,
    }))
    expect(above.actionModifiers).toEqual([
      expect.objectContaining({ id: 'graceDisorder', values: expect.objectContaining({ fully: 25 }) }),
    ])
    expect(above.actionModifiers[0].breakdown.fully).toContainEqual(
      expect.objectContaining({ label: 'Timeweaver threshold', amount: 25 }),
    )
  })

  it('runs the named Anby post-delivery derivation once and without slot-order feedback', () => {
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
            anbyAftershockSource: core,
            relationships: [baseStat(agentId, slot, 'critDmg', 158)],
          }
        }
        const amount = agentId === 'trigger' ? 30 : 25
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
      expect(anby.metrics[0].values.fully).toBe(213)
      expect(anby.actionModifiers[0].values.fully).toBeCloseTo(287.55, 10)
      expect(trigger.actionModifiers[0].values.fully).toBeCloseTo(179.55, 10)
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
        gaugeId: 'lighterElation',
      }],
      lighterImpactElation: {
        coreImpactSource: lighterCore,
        additionalSource: lighterAdditional,
        active: true,
        outputMultiplier: 1,
      },
      relationships: [
        baseStat('lighter', 0, 'impact', 137),
        {
          kind: 'stat',
          atom: {
            statId: 'impact', region: 'percentage', earliestSurface: 'fully',
            value: 18, source: lighterEngine,
          },
        },
      ],
    }, {
      agentId: 'anbySoldier0', appliedPartySlot: 1,
      metrics: [critDmgMetric],
      actions: [actionProjection('critDmg', 'anbyAftershockCrit', AFTERSHOCK_TARGET)],
      anbyAftershockSource: anbyCore,
      relationships: [baseStat('anbySoldier0', 1, 'critDmg', 158)],
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

    expect(lighter.metrics[0].values.fully).toBeCloseTo(189.06, 10)
    expect(lighter.metrics[0].gauge?.outputValue).toBeCloseTo(34.53, 10)
    expect(soldier.metrics[0].values.fully).toBeCloseTo(34.53, 10)
    expect(anby.metrics[0].values.fully).toBe(188)
    expect(anby.actionModifiers[0].values.fully).toBeCloseTo(253.8, 10)
  })

  it('derives Rupture Sheer Force from each completed ATK and Max HP surface before direct additions', () => {
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
        ruptureSheerSource: ruptureSource,
        metrics: [
          atkMetric,
          { id: 'maxHp', statId: 'maxHp', label: 'Max HP', unit: '', decimals: 0 },
          { id: 'sheerForce', label: 'Sheer Force', unit: '', decimals: 1 },
        ],
        relationships: [
          baseStat('yixuan', 0, 'atk', 1000),
          baseStat('yixuan', 0, 'maxHp', 10_000),
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

  it('derives qualified Trigger Aftershock Daze from delivered Fully CRIT without emitting a provider', () => {
    const state = createPreparedState({}, ['trigger', 'astraYao', 'zhao'], 1)
    const profilesFor = (qualified: boolean): AgentSourceProfile[] => {
      const additional = selectSource(
        defineAgentSource('trigger', 'aftershock-daze', 'Additional Ability', 'additional'),
        'trigger', 0,
      )
      const ordinaryDaze = selectSource(
        defineAgentSource('trigger', 'ordinary-daze', 'Ordinary Daze', 'core'),
        'trigger', 0,
      )
      return [
        {
          agentId: 'trigger',
          appliedPartySlot: 0,
          ...(qualified ? { triggerAftershockDazeSource: additional } : {}),
          metrics: [
            { ...critRateMetric, gaugeId: 'triggerAftershockDaze' },
            { id: 'dazeBonus', label: 'Daze Bonus', unit: '%', decimals: 1 },
          ],
          actions: [actionProjection('dazeBonus', 'triggerBasicAftershock', BASIC_AFTERSHOCK_TARGET)],
          relationships: [
            baseStat('trigger', 0, 'critRate', 35),
            {
              kind: 'modifier',
              atom: {
                metricId: 'dazeBonus', earliestSurface: 'fully', value: 5,
                source: ordinaryDaze,
              },
            },
            {
              kind: 'modifier',
              atom: {
                metricId: 'dazeBonus', earliestSurface: 'fully', value: 20,
                source: ordinaryDaze, action: BASIC_AFTERSHOCK_TARGET,
              },
            },
          ],
        },
        {
          agentId: 'astraYao', appliedPartySlot: 1, metrics: [],
          relationships: [{
            kind: 'provider',
            source: selectSource(
              defineAgentSource('astraYao', 'crit-provider', 'Delivered CRIT', 'core'),
              'astraYao', 1,
            ),
            delivery: { recipient: 'all-party' },
            effect: {
              kind: 'stat', statId: 'critRate', region: 'flat',
              earliestSurface: 'fully', value: 18,
            },
          }],
        },
        { agentId: 'zhao', appliedPartySlot: 2, metrics: [], relationships: [] },
      ]
    }

    const qualified = agentResult(evaluateProfileParty(state, profilesFor(true))!, 'trigger')
    const unqualified = agentResult(evaluateProfileParty(state, profilesFor(false))!, 'trigger')
    const crit = qualified.metrics.find(({ id }) => id === 'critRate')!
    expect(crit.values.fully).toBe(53)
    expect(crit.gauge).toEqual(expect.objectContaining({
      current: 53,
      outputValue: 19.5,
      outputCap: 75,
    }))
    expect(qualified.actionModifiers[0].values.fully).toBe(44.5)
    expect(qualified.actionModifiers[0].breakdown.fully).toContainEqual(
      expect.objectContaining({ label: 'Additional Ability', amount: 19.5 }),
    )
    expect(unqualified.metrics.find(({ id }) => id === 'critRate')?.gauge).toBeUndefined()
    expect(unqualified.actionModifiers[0].values.fully).toBe(25)
    expect(agentResult(evaluateProfileParty(state, profilesFor(true))!, 'astraYao').metrics)
      .toEqual([])
  })

  it('rejects an unrecognized relationship variant', () => {
    expect(() => evaluateRelationships(
      [{ kind: 'callback' } as unknown as ProfileRelationship],
      {},
    )).toThrow('Unsupported relationship variant')
  })
})
