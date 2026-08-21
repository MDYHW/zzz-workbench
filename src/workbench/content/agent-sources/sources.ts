import { selectSource, type SelectedSourceInstance } from '../../calculation/source-instance'
import {
  defineAgentSource,
  defineCalculationSource,
  defineMindscapeSource,
  type AppliedPartySlot,
  type SourceDefinitionLocus,
} from '../source-definitions'
import { SOURCE_LABELS } from '../retained-values'
import type { AgentId, MindscapeRank } from '../types'

type AgentSourceLocus = Extract<
  SourceDefinitionLocus,
  'identity' | 'core' | 'additional' | 'special' | 'ex-special'
>

export function selectedAgentSource(
  agentId: AgentId,
  appliedPartySlot: AppliedPartySlot,
  sourceId: string,
  label: string,
  locus: AgentSourceLocus,
): SelectedSourceInstance {
  return selectSource(
    defineAgentSource(agentId, sourceId, label, locus),
    agentId,
    appliedPartySlot,
  )
}

export function selectedMindscapeSource(
  agentId: AgentId,
  appliedPartySlot: AppliedPartySlot,
  selectedTier: MindscapeRank,
  tier: Exclude<MindscapeRank, 0>,
): SelectedSourceInstance {
  if (selectedTier < tier) {
    throw new Error(`${agentId} M${tier} requires selected Mindscape M${tier} or above`)
  }
  return selectSource(
    defineMindscapeSource(agentId, tier, SOURCE_LABELS.mindscape),
    agentId,
    appliedPartySlot,
    { kind: 'mindscape', selectedTier: selectedTier as Exclude<MindscapeRank, 0> },
  )
}

export function selectedCalculationSource(
  agentId: AgentId,
  appliedPartySlot: AppliedPartySlot,
  calculationId: string,
  label: string,
  locus: 'calculation' | 'target' = 'calculation',
): SelectedSourceInstance {
  return selectSource(
    defineCalculationSource(`${agentId}:${calculationId}`, label, locus),
    agentId,
    appliedPartySlot,
  )
}
