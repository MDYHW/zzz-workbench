import type { AgentId, AgentSummary } from './types'

export const ADMITTED_AGENTS: AgentSummary[] = [
  {
    id: 'yixuan',
    name: 'Yixuan',
    attribute: 'Auric Ink',
    specialty: 'Rupture',
    focusEligible: true,
    rank: 'S',
  },
  {
    id: 'dialyn',
    name: 'Dialyn',
    attribute: 'Physical',
    specialty: 'Stun',
    focusEligible: false,
    rank: 'S',
  },
  {
    id: 'lucia',
    name: 'Lucia',
    attribute: 'Ether',
    specialty: 'Support',
    focusEligible: false,
    rank: 'S',
  },
  {
    id: 'anbySoldier0',
    name: 'Anby: Soldier 0',
    attribute: 'Electric',
    specialty: 'Attack',
    focusEligible: true,
    rank: 'S',
  },
  {
    id: 'trigger',
    name: 'Trigger',
    attribute: 'Electric',
    specialty: 'Stun',
    focusEligible: false,
    rank: 'S',
  },
  {
    id: 'astraYao',
    name: 'Astra Yao',
    attribute: 'Ether',
    specialty: 'Support',
    focusEligible: false,
    rank: 'S',
  },
  {
    id: 'seed',
    name: 'Seed',
    attribute: 'Electric',
    specialty: 'Attack',
    focusEligible: true,
    rank: 'S',
  },
  {
    id: 'cissia',
    name: 'Cissia',
    attribute: 'Electric',
    specialty: 'Attack',
    focusEligible: false,
    rank: 'S',
  },
  {
    id: 'evelyn',
    name: 'Evelyn',
    attribute: 'Fire',
    specialty: 'Attack',
    focusEligible: true,
    rank: 'S',
    faction: 'Victoria Housekeeping Co.',
  },
  {
    id: 'corin',
    name: 'Corin',
    attribute: 'Physical',
    specialty: 'Attack',
    focusEligible: true,
    rank: 'A',
    faction: 'Victoria Housekeeping Co.',
  },
  {
    id: 'lycaon',
    name: 'Lycaon',
    attribute: 'Ice',
    specialty: 'Stun',
    focusEligible: false,
    rank: 'S',
    faction: 'Victoria Housekeeping Co.',
  },
]

export const defaultMindscapeFor = (agentId: AgentId): 0 | 6 =>
  ADMITTED_AGENTS.find(({ id }) => id === agentId)?.rank === 'A' ? 6 : 0

export const isFocusEligible = (agentId: AgentId): boolean =>
  ADMITTED_AGENTS.find((agent) => agent.id === agentId)?.focusEligible ?? false

export const DEFAULT_APPLIED_AGENT_IDS: [AgentId, AgentId, AgentId] = [
  'yixuan',
  'dialyn',
  'lucia',
]
