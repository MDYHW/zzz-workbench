import type { AgentId, AgentSummary } from './types'

export const ADMITTED_AGENTS: AgentSummary[] = [
  {
    id: 'yixuan',
    name: 'Yixuan',
    attribute: 'Auric Ink',
    specialty: 'Rupture',
    focusEligible: true,
  },
  {
    id: 'dialyn',
    name: 'Dialyn',
    attribute: 'Physical',
    specialty: 'Stun',
    focusEligible: false,
  },
  {
    id: 'lucia',
    name: 'Lucia',
    attribute: 'Ether',
    specialty: 'Support',
    focusEligible: false,
  },
  {
    id: 'anbySoldier0',
    name: 'Anby: Soldier 0',
    attribute: 'Electric',
    specialty: 'Attack',
    focusEligible: true,
  },
  {
    id: 'trigger',
    name: 'Trigger',
    attribute: 'Electric',
    specialty: 'Stun',
    focusEligible: false,
  },
  {
    id: 'astraYao',
    name: 'Astra Yao',
    attribute: 'Ether',
    specialty: 'Support',
    focusEligible: false,
  },
  {
    id: 'seed',
    name: 'Seed',
    attribute: 'Electric',
    specialty: 'Attack',
    focusEligible: true,
  },
  {
    id: 'cissia',
    name: 'Cissia',
    attribute: 'Electric',
    specialty: 'Attack',
    focusEligible: false,
  },
]

export const isFocusEligible = (agentId: AgentId): boolean =>
  ADMITTED_AGENTS.find((agent) => agent.id === agentId)?.focusEligible ?? false

export const DEFAULT_APPLIED_AGENT_IDS: [AgentId, AgentId, AgentId] = [
  'yixuan',
  'dialyn',
  'lucia',
]
