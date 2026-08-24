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

function requireProfile(
  agentId: AgentId,
  profile: AgentSourceProfile | null,
): AgentSourceProfile {
  if (!profile || profile.agentId !== agentId) {
    throw new Error(`Agent source owner did not build ${agentId}`)
  }
  return profile
}

const attack = (state: WorkbenchState, slot: Slot, context: PartyCalculationContext) => (
  requireProfile(state.slots[slot].agentId, attackProfileFor(state, slot, context))
)
const anomaly = (state: WorkbenchState, slot: Slot) => (
  requireProfile(state.slots[slot].agentId, anomalyProfileFor(state, slot))
)
const providerDefense = (state: WorkbenchState, slot: Slot) => (
  requireProfile(state.slots[slot].agentId, providerDefenseProfileFor(state, slot))
)
const ruptureStun = (state: WorkbenchState, slot: Slot) => (
  requireProfile(state.slots[slot].agentId, ruptureStunProfileFor(state, slot))
)

/**
 * Exact identity dispatch. Specialty remains an eligibility and party metadata
 * input; it never selects a calculator or supplies Agent kit meaning.
 */
const AGENT_PROFILE_BUILDERS = {
  yixuan: ruptureStun,
  dialyn: ruptureStun,
  lucia: providerDefense,
  anbySoldier0: attack,
  trigger: ruptureStun,
  astraYao: providerDefense,
  seed: attack,
  cissia: attack,
  evelyn: attack,
  corin: attack,
  lycaon: ruptureStun,
  yidhari: ruptureStun,
  manato: ruptureStun,
  hugo: attack,
  juFufu: ruptureStun,
  panYinhu: providerDefense,
  banyue: ruptureStun,
  starlightBilly: ruptureStun,
  ellen: attack,
  soukaku: providerDefense,
  soldier11: attack,
  lighter: ruptureStun,
  lucy: providerDefense,
  zhuYuan: attack,
  nicole: providerDefense,
  orphie: attack,
  pulchra: ruptureStun,
  harumasa: attack,
  qingyi: ruptureStun,
  nekomata: attack,
  billy: attack,
  ben: providerDefense,
  koleda: ruptureStun,
  anby: ruptureStun,
  caesar: providerDefense,
  yeShunguang: attack,
  zhao: providerDefense,
  grace: anomaly,
  piper: anomaly,
  yuzuha: anomaly,
  burnice: anomaly,
  jane: anomaly,
  seth: providerDefense,
  yanagi: anomaly,
  alice: anomaly,
  vivian: anomaly,
  aria: anomaly,
  promeia: anomaly,
  sunna: providerDefense,
  nangongYu: ruptureStun,
} satisfies Record<AgentId, AgentProfileBuilder>

export function sourceProfileForSlot(
  state: WorkbenchState,
  slot: Slot,
  calculationContext: PartyCalculationContext,
): AgentSourceProfile {
  const agentId = state.slots[slot].agentId
  return AGENT_PROFILE_BUILDERS[agentId](state, slot, calculationContext)
}
