import type { AgentId, AgentOperation, AgentSummary } from './types'

export const ADMITTED_AGENTS: AgentSummary[] = [
  {
    id: 'pyrois',
    name: 'Pyrois',
    attribute: 'Ether',
    specialty: 'Attack',
    focusEligible: true,
    rank: 'S',
    faction: 'Phaethon',
  },
  {
    id: 'sigrid',
    name: "Sigrid de L'Azur",
    displayName: 'Sigrid',
    attribute: 'Ice',
    specialty: 'Attack',
    focusEligible: true,
    rank: 'S',
  },
  {
    id: 'yixuan',
    name: 'Yixuan',
    attribute: 'Auric Ink',
    specialty: 'Rupture',
    focusEligible: true,
    rank: 'S',
    faction: 'Yunkui Summit',
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
    operations: ['etherVeil'],
  },
  {
    id: 'anbySoldier0',
    name: 'Anby: Soldier 0',
    attribute: 'Electric',
    specialty: 'Attack',
    focusEligible: true,
    rank: 'S',
    faction: 'Defense Force - Silver Squad',
    partyQualificationGroup: 'New Eridu Defense Force',
  },
  {
    id: 'trigger',
    name: 'Trigger',
    attribute: 'Electric',
    specialty: 'Stun',
    focusEligible: false,
    rank: 'S',
    faction: 'Obol Squad',
    partyQualificationGroup: 'New Eridu Defense Force',
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
    faction: 'Obol Squad',
    partyQualificationGroup: 'New Eridu Defense Force',
  },
  {
    id: 'cissia',
    name: 'Cissia',
    attribute: 'Electric',
    specialty: 'Attack',
    focusEligible: false,
    rank: 'S',
    operations: ['etherVeil'],
  },
  {
    id: 'evelyn',
    name: 'Evelyn',
    attribute: 'Fire',
    specialty: 'Attack',
    focusEligible: true,
    rank: 'S',
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
  {
    id: 'yidhari',
    name: 'Yidhari',
    attribute: 'Ice',
    specialty: 'Rupture',
    focusEligible: true,
    rank: 'S',
    operations: ['etherVeil', 'hpDecrease'],
  },
  {
    id: 'manato',
    name: 'Manato',
    attribute: 'Fire',
    specialty: 'Rupture',
    focusEligible: true,
    rank: 'A',
    operations: ['hpDecrease'],
  },
  {
    id: 'hugo',
    name: 'Hugo',
    attribute: 'Ice',
    specialty: 'Attack',
    focusEligible: true,
    rank: 'S',
  },
  {
    id: 'juFufu',
    name: 'Ju Fufu',
    attribute: 'Fire',
    specialty: 'Stun',
    focusEligible: false,
    rank: 'S',
    faction: 'Yunkui Summit',
  },
  {
    id: 'panYinhu',
    name: 'Pan Yinhu',
    attribute: 'Physical',
    specialty: 'Defense',
    focusEligible: false,
    rank: 'A',
    faction: 'Yunkui Summit',
  },
  {
    id: 'banyue',
    name: 'Banyue',
    attribute: 'Fire',
    specialty: 'Rupture',
    focusEligible: true,
    rank: 'S',
    operations: ['hpDecrease'],
  },
  {
    id: 'starlightBilly',
    name: 'Starlight Billy',
    attribute: 'Physical',
    specialty: 'Rupture',
    focusEligible: true,
    rank: 'S',
    operations: ['hpDecrease'],
  },
  {
    id: 'ellen', name: 'Ellen', attribute: 'Ice', specialty: 'Attack',
    focusEligible: true, rank: 'S', faction: 'Victoria Housekeeping Co.',
  },
  {
    id: 'soukaku', name: 'Soukaku', attribute: 'Ice', specialty: 'Support',
    focusEligible: false, rank: 'A', faction: 'Section 6',
  },
  {
    id: 'soldier11', name: 'Soldier 11', attribute: 'Fire', specialty: 'Attack',
    focusEligible: true, rank: 'S', faction: 'Obol Squad',
    partyQualificationGroup: 'New Eridu Defense Force',
  },
  {
    id: 'lighter', name: 'Lighter', attribute: 'Fire', specialty: 'Stun',
    focusEligible: false, rank: 'S', faction: 'Sons of Calydon',
  },
  {
    id: 'lucy', name: 'Lucy', attribute: 'Fire', specialty: 'Support',
    focusEligible: false, rank: 'A', faction: 'Sons of Calydon',
  },
  {
    id: 'zhuYuan', name: 'Zhu Yuan', attribute: 'Ether', specialty: 'Attack',
    focusEligible: true, rank: 'S', faction: 'Criminal Investigation Special Response Team',
  },
  {
    id: 'nicole', name: 'Nicole', attribute: 'Ether', specialty: 'Support',
    focusEligible: false, rank: 'A', faction: 'Cunning Hares',
  },
  {
    id: 'orphie', name: 'Orphie & Magus', attribute: 'Fire', specialty: 'Attack',
    focusEligible: false, rank: 'S', faction: 'Obol Squad',
    partyQualificationGroup: 'New Eridu Defense Force',
  },
  {
    id: 'pulchra', name: 'Pulchra', attribute: 'Physical', specialty: 'Stun',
    focusEligible: false, rank: 'A', faction: 'Sons of Calydon',
  },
  {
    id: 'harumasa', name: 'Asaba Harumasa', displayName: 'Harumasa', attribute: 'Electric', specialty: 'Attack',
    focusEligible: true, rank: 'S', faction: 'Section 6',
  },
  {
    id: 'qingyi', name: 'Qingyi', attribute: 'Electric', specialty: 'Stun',
    focusEligible: false, rank: 'S', faction: 'Criminal Investigation Special Response Team',
  },
  {
    id: 'nekomata', name: 'Nekomata', attribute: 'Physical', specialty: 'Attack',
    focusEligible: true, rank: 'S', faction: 'Cunning Hares',
  },
  {
    id: 'billy', name: 'Billy Kid', displayName: 'Billy', attribute: 'Physical', specialty: 'Attack',
    focusEligible: true, rank: 'A', faction: 'Cunning Hares',
  },
  {
    id: 'ben', name: 'Ben Bigger', displayName: 'Ben', attribute: 'Fire', specialty: 'Defense',
    focusEligible: true, rank: 'A', faction: 'Belobog Heavy Industries',
  },
  {
    id: 'koleda', name: 'Koleda Belobog', displayName: 'Koleda', attribute: 'Fire', specialty: 'Stun',
    focusEligible: false, rank: 'S', faction: 'Belobog Heavy Industries',
  },
  {
    id: 'anby', name: 'Anby Demara', displayName: 'Anby', attribute: 'Electric', specialty: 'Stun',
    focusEligible: false, rank: 'A', faction: 'Cunning Hares',
  },
  {
    id: 'caesar', name: 'Caesar King', displayName: 'Caesar', attribute: 'Physical', specialty: 'Defense',
    focusEligible: false, rank: 'S', faction: 'Sons of Calydon',
  },
  {
    id: 'yeShunguang', name: 'Ye Shunguang', attribute: 'Honed Edge', specialty: 'Attack',
    focusEligible: true, rank: 'S', faction: 'Yunkui Summit', operations: ['etherVeil'],
  },
  {
    id: 'zhao', name: 'Zhao', attribute: 'Ice', specialty: 'Defense',
    focusEligible: false, rank: 'S', faction: 'Krampus Compliance Authority', operations: ['etherVeil'],
  },
  {
    id: 'grace', name: 'Grace Howard', attribute: 'Electric', specialty: 'Anomaly',
    focusEligible: true, rank: 'S', faction: 'Belobog Heavy Industries',
  },
  {
    id: 'piper', name: 'Piper Wheel', displayName: 'Piper', attribute: 'Physical', specialty: 'Anomaly',
    focusEligible: true, rank: 'A', faction: 'Sons of Calydon',
  },
  {
    id: 'yuzuha', name: 'Ukinami Yuzuha', displayName: 'Yuzuha', attribute: 'Physical', specialty: 'Support',
    focusEligible: false, rank: 'S', faction: 'Spook Shack',
  },
  {
    id: 'burnice', name: 'Burnice White', displayName: 'Burnice', attribute: 'Fire', specialty: 'Anomaly',
    focusEligible: false, rank: 'S', faction: 'Sons of Calydon',
  },
  {
    id: 'jane', name: 'Jane Doe', displayName: 'Jane', attribute: 'Physical', specialty: 'Anomaly',
    focusEligible: true, rank: 'S', faction: 'Criminal Investigation Special Response Team',
  },
  {
    id: 'seth', name: 'Seth Lowell', displayName: 'Seth', attribute: 'Electric', specialty: 'Defense',
    focusEligible: false, rank: 'A', faction: 'Criminal Investigation Special Response Team',
  },
  {
    id: 'yanagi', name: 'Tsukishiro Yanagi', displayName: 'Yanagi', attribute: 'Electric', specialty: 'Anomaly',
    focusEligible: true, rank: 'S', faction: 'Section 6',
  },
  {
    id: 'alice', name: 'Alice Thymefield', displayName: 'Alice', attribute: 'Physical', specialty: 'Anomaly',
    focusEligible: true, rank: 'S', faction: 'Spook Shack',
  },
  {
    id: 'vivian', name: 'Vivian', attribute: 'Ether', specialty: 'Anomaly',
    focusEligible: false, rank: 'S', faction: 'Mockingbird',
  },
  {
    id: 'aria', name: 'Aria', attribute: 'Ether', specialty: 'Anomaly',
    focusEligible: true, rank: 'S', faction: 'Angels of Delusion',
  },
  {
    id: 'promeia', name: 'Promeia', attribute: 'Ice', specialty: 'Anomaly',
    focusEligible: true, rank: 'S', faction: 'Krampus Compliance Authority',
  },
  {
    id: 'sunna', name: 'Sunna', attribute: 'Physical', specialty: 'Support',
    focusEligible: false, rank: 'S', faction: 'Angels of Delusion', operations: ['etherVeil'],
  },
  {
    id: 'nangongYu', name: 'Nangong Yu', attribute: 'Ether', specialty: 'Stun',
    focusEligible: false, rank: 'S', faction: 'Angels of Delusion',
  },
  {
    id: 'miyabi', name: 'Hoshimi Miyabi', displayName: 'Miyabi', attribute: 'Frost', specialty: 'Anomaly',
    focusEligible: true, rank: 'S', faction: 'Section 6',
  },
  {
    id: 'anton', name: 'Anton Ivanov', displayName: 'Anton', attribute: 'Electric', specialty: 'Attack',
    focusEligible: true, rank: 'A', faction: 'Belobog Heavy Industries',
  },
  {
    id: 'rina', name: 'Alexandrina Sebastiane', displayName: 'Rina', attribute: 'Electric', specialty: 'Support',
    focusEligible: false, rank: 'S', faction: 'Victoria Housekeeping Co.',
  },
  {
    id: 'norma', name: 'Norma Hollowell', attribute: 'Fire', specialty: 'Stun',
    focusEligible: false, rank: 'S', faction: 'External Strategy Department',
  },
]

export const agentDisplayName = ({ displayName, name }: AgentSummary): string => displayName ?? name

/** Source-owned capability used only when a retained consumer names the operation. */
export const agentCanPerformOperation = (
  agentId: AgentId,
  operation: AgentOperation,
): boolean => ADMITTED_AGENTS.find(({ id }) => id === agentId)
  ?.operations?.includes(operation) === true

export const defaultMindscapeFor = (agentId: AgentId): 0 | 6 =>
  ADMITTED_AGENTS.find(({ id }) => id === agentId)?.rank === 'A' ? 6 : 0

export const isFocusEligible = (agentId: AgentId): boolean =>
  ADMITTED_AGENTS.find((agent) => agent.id === agentId)?.focusEligible ?? false

export const DEFAULT_APPLIED_AGENT_IDS: [AgentId, AgentId, AgentId] = [
  'yixuan',
  'dialyn',
  'lucia',
]
