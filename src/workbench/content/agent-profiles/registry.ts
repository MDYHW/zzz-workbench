import type {
  AgentSourceProfile,
} from '../../calculation/profile-harness'
import type { PartyCalculationContext } from '../../calculate'
import type { WorkbenchState } from '../../state'
import type { AgentId } from '../types'
import { anomalyOutcomeProfileFor } from './anomaly-outcomes'
import { dazeOutcomeProfileFor } from './daze-outcomes'
import { generalDamageOutcomeProfileFor } from './general-damage-outcomes'
import { partyOutcomeProfileFor } from './party-outcomes'
import { sheerOutcomeProfileFor } from './sheer-outcomes'

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

const generalDamageOutcome = <A extends Parameters<typeof generalDamageOutcomeProfileFor>[0]>(
  agentId: A,
): AgentProfileDefinition<A> => ({
  agentId,
  build: (state, slot, context) => generalDamageOutcomeProfileFor(agentId, state, slot, context),
})
const anomalyOutcome = <A extends Parameters<typeof anomalyOutcomeProfileFor>[0]>(
  agentId: A,
): AgentProfileDefinition<A> => ({
  agentId,
  build: (state, slot) => anomalyOutcomeProfileFor(agentId, state, slot),
})
const partyOutcome = <A extends Parameters<typeof partyOutcomeProfileFor>[0]>(
  agentId: A,
): AgentProfileDefinition<A> => ({
  agentId,
  build: (state, slot) => partyOutcomeProfileFor(agentId, state, slot),
})
const dazeOutcome = <A extends Parameters<typeof dazeOutcomeProfileFor>[0]>(
  agentId: A,
): AgentProfileDefinition<A> => ({
  agentId,
  build: (state, slot) => dazeOutcomeProfileFor(agentId, state, slot),
})
const sheerOutcome = <A extends Parameters<typeof sheerOutcomeProfileFor>[0]>(
  agentId: A,
): AgentProfileDefinition<A> => ({
  agentId,
  build: (state, slot) => sheerOutcomeProfileFor(agentId, state, slot),
})

/**
 * Exact identity dispatch. Specialty remains an eligibility and party metadata
 * input; it never selects a calculator or supplies Agent kit meaning.
 */
const AGENT_PROFILE_BUILDERS = {
  pyrois: generalDamageOutcome('pyrois'),
  sigrid: generalDamageOutcome('sigrid'),
  yixuan: sheerOutcome('yixuan'),
  dialyn: dazeOutcome('dialyn'),
  lucia: partyOutcome('lucia'),
  anbySoldier0: generalDamageOutcome('anbySoldier0'),
  trigger: dazeOutcome('trigger'),
  astraYao: partyOutcome('astraYao'),
  seed: generalDamageOutcome('seed'),
  cissia: generalDamageOutcome('cissia'),
  evelyn: generalDamageOutcome('evelyn'),
  corin: generalDamageOutcome('corin'),
  lycaon: dazeOutcome('lycaon'),
  yidhari: sheerOutcome('yidhari'),
  manato: sheerOutcome('manato'),
  hugo: generalDamageOutcome('hugo'),
  juFufu: dazeOutcome('juFufu'),
  panYinhu: partyOutcome('panYinhu'),
  banyue: sheerOutcome('banyue'),
  starlightBilly: sheerOutcome('starlightBilly'),
  ellen: generalDamageOutcome('ellen'),
  soukaku: partyOutcome('soukaku'),
  soldier11: generalDamageOutcome('soldier11'),
  lighter: dazeOutcome('lighter'),
  lucy: partyOutcome('lucy'),
  zhuYuan: generalDamageOutcome('zhuYuan'),
  nicole: partyOutcome('nicole'),
  orphie: generalDamageOutcome('orphie'),
  pulchra: dazeOutcome('pulchra'),
  harumasa: generalDamageOutcome('harumasa'),
  qingyi: dazeOutcome('qingyi'),
  nekomata: generalDamageOutcome('nekomata'),
  billy: generalDamageOutcome('billy'),
  ben: partyOutcome('ben'),
  koleda: dazeOutcome('koleda'),
  anby: dazeOutcome('anby'),
  caesar: partyOutcome('caesar'),
  yeShunguang: generalDamageOutcome('yeShunguang'),
  zhao: partyOutcome('zhao'),
  grace: anomalyOutcome('grace'),
  piper: anomalyOutcome('piper'),
  yuzuha: anomalyOutcome('yuzuha'),
  burnice: anomalyOutcome('burnice'),
  jane: anomalyOutcome('jane'),
  seth: partyOutcome('seth'),
  yanagi: anomalyOutcome('yanagi'),
  alice: anomalyOutcome('alice'),
  vivian: anomalyOutcome('vivian'),
  aria: anomalyOutcome('aria'),
  promeia: anomalyOutcome('promeia'),
  sunna: partyOutcome('sunna'),
  nangongYu: dazeOutcome('nangongYu'),
  miyabi: generalDamageOutcome('miyabi'),
  anton: generalDamageOutcome('anton'),
  rina: partyOutcome('rina'),
  norma: dazeOutcome('norma'),
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
