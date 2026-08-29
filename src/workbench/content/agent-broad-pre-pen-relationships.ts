import { DEF_DAMAGE_FORMULAS } from '../formula-policy'
import { anotherAgentHasSpecialty } from '../party-conditions'
import type {
  LinearGaugeRelationship,
  ProfileRelationship,
  ProviderRelationship,
} from '../calculation/relationships'
import type { AppliedSlot, WorkbenchState } from '../state'
import { SOURCE_LABELS, VERTICAL_VALUES } from './retained-values'
import { selectedAgentSource, selectedMindscapeSource } from './agent-sources/sources'
import { resolveSeedVanguardForState } from './agent-sources/seed-vanguard'

function provider(
  source: ReturnType<typeof selectedAgentSource>,
  effect: ProviderRelationship['effect'],
  delivery: ProviderRelationship['delivery'],
): ProviderRelationship {
  return { kind: 'provider', source, effect, delivery }
}

function cissiaGauge(
  state: WorkbenchState,
  slot: AppliedSlot,
): LinearGaugeRelationship {
  const setup = state.slots[slot].setup
  const source = selectedAgentSource('cissia', slot, 'core', SOURCE_LABELS.cissiaCore, 'core')
  const scale = setup.mindscape >= 1 ? VERTICAL_VALUES.cissia.mindscapeCoreMultiplier : 1
  const transform = {
    basisThreshold: VERTICAL_VALUES.cissia.coreEnergyThreshold,
    basisIncrement: VERTICAL_VALUES.cissia.coreEnergyIncrement,
    baseOutput: VERTICAL_VALUES.cissia.coreDefIgnore * scale,
    outputIncrement: scale,
    outputCap: VERTICAL_VALUES.cissia.coreDefIgnoreCap * scale,
  }
  return {
    kind: 'gauge',
    source,
    basis: { statId: 'energyRegen', surface: 'initial' },
    basisLabel: 'Initial Energy Regen',
    basisThreshold: VERTICAL_VALUES.cissia.coreEnergyThreshold,
    basisCap: 3.68,
    metricId: 'energyRegen',
    outputs: [{
      label: 'Electric DEF Ignore',
      unit: '%',
      cap: VERTICAL_VALUES.cissia.coreDefIgnoreCap * scale,
      decimals: 3,
      transform,
      emission: {
        kind: 'provider',
        delivery: {
          recipient: 'enemy-context', attributes: ['Electric'], formulas: DEF_DAMAGE_FORMULAS,
        },
        effect: {
          kind: 'modifier', metricId: 'defIgnore', earliestSurface: 'combat',
          sourceDetail: 'Corrosion',
        },
      },
    }],
  }
}

/** Exact Agent source relationships; formula topology, not Specialty, owns this join. */
export function agentBroadPrePenRelationships(
  state: WorkbenchState,
  slot: AppliedSlot,
): ProfileRelationship[] {
  const { agentId, setup } = state.slots[slot]
  if (agentId === 'seed' && setup.mindscape >= 2) {
    const vanguard = resolveSeedVanguardForState(state)
    if (vanguard) {
      const source = selectedMindscapeSource('seed', slot, setup.mindscape, 2)
      return [provider(source, {
        kind: 'modifier', metricId: 'defIgnore', earliestSurface: 'combat',
        value: VERTICAL_VALUES.seed.mindscapeBesiegeDefIgnore, sourceDetail: 'Besiege',
      }, {
        recipient: 'enemy-context', formulas: ['general_damage'],
        eligibleAgentIds: ['seed', vanguard],
      })]
    }
  }
  if (agentId === 'cissia') return [cissiaGauge(state, slot)]
  if (agentId === 'evelyn' && setup.mindscape >= 1) {
    return [{ kind: 'modifier', atom: {
      metricId: 'defIgnore', earliestSurface: 'combat',
      value: VERTICAL_VALUES.evelyn.mindscapeDefIgnore,
      source: selectedMindscapeSource('evelyn', slot, setup.mindscape, 1),
    } }]
  }
  if (agentId === 'yeShunguang' && setup.mindscape >= 1) {
    return [{ kind: 'modifier', atom: {
      metricId: 'defIgnore', earliestSurface: 'combat',
      value: VERTICAL_VALUES.yeShunguang.mindscapeDefIgnore,
      source: selectedMindscapeSource('yeShunguang', slot, setup.mindscape, 1),
    } }]
  }
  if (agentId === 'alice' && setup.mindscape >= 1) {
    return [provider(
      selectedMindscapeSource('alice', slot, setup.mindscape, 1),
      {
        kind: 'modifier', metricId: 'defReduction', earliestSurface: 'fully',
        value: VERTICAL_VALUES.alice.mindscape1DefReduction,
      },
      { recipient: 'enemy-context', formulas: DEF_DAMAGE_FORMULAS },
    )]
  }
  if (agentId === 'nicole') {
    return [provider(
      selectedAgentSource('nicole', slot, 'core', SOURCE_LABELS.nicoleCore, 'core'),
      {
        kind: 'modifier', metricId: 'defReduction', earliestSurface: 'fully',
        value: VERTICAL_VALUES.nicole.coreDefReduction,
      },
      { recipient: 'enemy-context', formulas: DEF_DAMAGE_FORMULAS },
    )]
  }
  if (
    agentId === 'sunna'
    && setup.mindscape >= 1
    && (
      setup.mindscape >= 6
      || anotherAgentHasSpecialty(
        state.slots.map(({ agentId: id }) => id), slot, ['Attack', 'Anomaly'],
      )
    )
  ) {
    return [provider(
      selectedMindscapeSource('sunna', slot, setup.mindscape, 1),
      {
        kind: 'modifier', metricId: 'defReduction', earliestSurface: 'fully',
        value: VERTICAL_VALUES.sunna.mindscape1DefReduction,
      },
      { recipient: 'enemy-context', formulas: DEF_DAMAGE_FORMULAS },
    )]
  }
  if (agentId === 'qingyi' && setup.mindscape >= 1) {
    return [provider(
      selectedMindscapeSource('qingyi', slot, setup.mindscape, 1),
      {
        kind: 'modifier', metricId: 'defReduction', earliestSurface: 'fully',
        value: VERTICAL_VALUES.qingyi.mindscapeDefReduction,
      },
      { recipient: 'enemy-context', formulas: DEF_DAMAGE_FORMULAS },
    )]
  }
  return []
}

/** Candidate preparation needs Cissia's retained guaranteed pressure floor. */
export function agentBroadPrePenPressureRelationships(
  state: WorkbenchState,
  slot: AppliedSlot,
): ProviderRelationship[] {
  if (state.slots[slot].agentId !== 'cissia') return []
  const relationship = cissiaGauge(state, slot)
  const output = relationship.outputs[0]
  const emission = output.emission
  if (emission.kind !== 'provider') return []
  const value = output.transform.baseOutput ?? 0
  return value > 0 ? [{
    kind: 'provider', source: relationship.source,
    delivery: emission.delivery,
    effect: { ...emission.effect, value },
  }] : []
}
