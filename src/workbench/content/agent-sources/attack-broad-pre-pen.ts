import type {
  LinearGaugeRelationship,
  ProfileRelationship,
  ProviderRelationship,
} from '../../calculation/relationships'
import type { AppliedSlot, WorkbenchState } from '../../state'
import { SOURCE_LABELS, VERTICAL_VALUES } from '../retained-values'
import { selectedAgentSource, selectedMindscapeSource } from './sources'
import { resolveSeedVanguardForState } from './seed-vanguard'

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
  const relationship: LinearGaugeRelationship = {
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
        delivery: { recipient: 'enemy-context', attributes: ['Electric'], formulas: ['general_damage'] },
        effect: { kind: 'modifier', metricId: 'defIgnore', earliestSurface: 'combat', sourceDetail: 'Corrosion' },
      },
    }],
  }
  return relationship
}

export function attackBroadPrePenRelationships(
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
      }, { recipient: 'enemy-context', formulas: ['general_damage'], eligibleAgentIds: ['seed', vanguard] })]
    }
  }
  if (agentId === 'cissia') return [cissiaGauge(state, slot)]
  if (agentId === 'evelyn' && setup.mindscape >= 1) {
    const source = selectedMindscapeSource('evelyn', slot, setup.mindscape, 1)
    return [{ kind: 'modifier', atom: {
      metricId: 'defIgnore', earliestSurface: 'combat',
      value: VERTICAL_VALUES.evelyn.mindscapeDefIgnore, source,
    } }]
  }
  if (agentId === 'yeShunguang' && setup.mindscape >= 1) {
    const source = selectedMindscapeSource('yeShunguang', slot, setup.mindscape, 1)
    return [{ kind: 'modifier', atom: {
      metricId: 'defIgnore', earliestSurface: 'combat',
      value: VERTICAL_VALUES.yeShunguang.mindscapeDefIgnore, source,
    } }]
  }
  return []
}

export function attackBroadPrePenPressureRelationships(
  state: WorkbenchState,
  slot: AppliedSlot,
): ProviderRelationship[] {
  const { agentId } = state.slots[slot]
  if (agentId === 'cissia') {
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
  return []
}
