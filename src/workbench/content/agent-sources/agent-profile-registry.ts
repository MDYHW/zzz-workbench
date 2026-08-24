import type {
  AgentSourceProfile,
} from '../../calculation/profile-harness'
import type { PartyCalculationContext } from '../../calculate'
import type { WorkbenchState } from '../../state'
import type { AgentId } from '../types'
import { anomalyProfileFor } from './anomaly'
import { attackProfileFor } from './attack'
import { providerDefenseProfileFor } from './provider-defense'
import { ruptureStunProfileFor } from './rupture-stun'

type Slot = 0 | 1 | 2
type AgentProfileBuilder = (
  state: WorkbenchState,
  slot: Slot,
  calculationContext: PartyCalculationContext,
) => AgentSourceProfile

interface AgentProfileDefinition<A extends AgentId> {
  agentId: A
  build: AgentProfileBuilder
}

type ExactAgentProfileDefinitions = {
  [A in AgentId]: AgentProfileDefinition<A>
}

const attack = <A extends Parameters<typeof attackProfileFor>[0]>(
  agentId: A,
): AgentProfileDefinition<A> => ({
  agentId,
  build: (state, slot, context) => attackProfileFor(agentId, state, slot, context),
})
const anomaly = <A extends Parameters<typeof anomalyProfileFor>[0]>(
  agentId: A,
): AgentProfileDefinition<A> => ({
  agentId,
  build: (state, slot) => anomalyProfileFor(agentId, state, slot),
})
const providerDefense = <A extends Parameters<typeof providerDefenseProfileFor>[0]>(
  agentId: A,
): AgentProfileDefinition<A> => ({
  agentId,
  build: (state, slot) => providerDefenseProfileFor(agentId, state, slot),
})
const ruptureStun = <A extends Parameters<typeof ruptureStunProfileFor>[0]>(
  agentId: A,
): AgentProfileDefinition<A> => ({
  agentId,
  build: (state, slot) => ruptureStunProfileFor(agentId, state, slot),
})

/**
 * Exact identity dispatch. Specialty remains an eligibility and party metadata
 * input; it never selects a calculator or supplies Agent kit meaning.
 */
const AGENT_PROFILE_BUILDERS = {
  yixuan: ruptureStun('yixuan'),
  dialyn: ruptureStun('dialyn'),
  lucia: providerDefense('lucia'),
  anbySoldier0: attack('anbySoldier0'),
  trigger: ruptureStun('trigger'),
  astraYao: providerDefense('astraYao'),
  seed: attack('seed'),
  cissia: attack('cissia'),
  evelyn: attack('evelyn'),
  corin: attack('corin'),
  lycaon: ruptureStun('lycaon'),
  yidhari: ruptureStun('yidhari'),
  manato: ruptureStun('manato'),
  hugo: attack('hugo'),
  juFufu: ruptureStun('juFufu'),
  panYinhu: providerDefense('panYinhu'),
  banyue: ruptureStun('banyue'),
  starlightBilly: ruptureStun('starlightBilly'),
  ellen: attack('ellen'),
  soukaku: providerDefense('soukaku'),
  soldier11: attack('soldier11'),
  lighter: ruptureStun('lighter'),
  lucy: providerDefense('lucy'),
  zhuYuan: attack('zhuYuan'),
  nicole: providerDefense('nicole'),
  orphie: attack('orphie'),
  pulchra: ruptureStun('pulchra'),
  harumasa: attack('harumasa'),
  qingyi: ruptureStun('qingyi'),
  nekomata: attack('nekomata'),
  billy: attack('billy'),
  ben: providerDefense('ben'),
  koleda: ruptureStun('koleda'),
  anby: ruptureStun('anby'),
  caesar: providerDefense('caesar'),
  yeShunguang: attack('yeShunguang'),
  zhao: providerDefense('zhao'),
  grace: anomaly('grace'),
  piper: anomaly('piper'),
  yuzuha: anomaly('yuzuha'),
  burnice: anomaly('burnice'),
  jane: anomaly('jane'),
  seth: providerDefense('seth'),
  yanagi: anomaly('yanagi'),
  alice: anomaly('alice'),
  vivian: anomaly('vivian'),
  aria: anomaly('aria'),
  promeia: anomaly('promeia'),
  sunna: providerDefense('sunna'),
  nangongYu: ruptureStun('nangongYu'),
} satisfies ExactAgentProfileDefinitions

export function sourceProfileForSlot(
  state: WorkbenchState,
  slot: Slot,
  calculationContext: PartyCalculationContext,
): AgentSourceProfile {
  const agentId = state.slots[slot].agentId
  const definition = AGENT_PROFILE_BUILDERS[agentId]
  const profile = definition.build(state, slot, calculationContext)
  if (definition.agentId !== agentId || profile.agentId !== agentId) {
    throw new Error(`Agent profile registry did not build ${agentId}`)
  }
  return profile
}
