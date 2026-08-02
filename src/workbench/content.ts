export type PoolId = 'full' | 'nonLimited'
export type EngineId = 'qingming' | 'cauldron'
export type AgentId = 'yixuan' | 'dialyn' | 'lucia'
export type SubstatKey = 'critRate' | 'critDmg' | 'hpPct' | 'atkPct'

export interface WEngineChoice {
  id: EngineId
  name: string
  rank: 'S' | 'A'
  refinement: 'W1' | 'W5'
  baseAtk: number
  advancedStat: {
    label: 'HP'
    value: number
  }
  passiveLines: string[]
}

export interface PreparedEquipment {
  fourPiece: string
  twoPiece: string
  mains: {
    slot4: string
    slot5: string
    slot6: string
  }
}

export interface AgentSummary {
  id: AgentId
  order: number
  name: string
  attribute: string
  specialty: string
  roles: string[]
  mindscape: 'M0'
  pool: 'Full'
  engine: {
    name: string
    refinement: 'W1'
  }
  equipment: PreparedEquipment
  accent: string
  portraitMark: string
}

export const W_ENGINES: Record<EngineId, WEngineChoice> = {
  qingming: {
    id: 'qingming',
    name: 'Qingming Birdcage',
    rank: 'S',
    refinement: 'W1',
    baseAtk: 743,
    advancedStat: { label: 'HP', value: 30 },
    passiveLines: [
      'Entering combat \u00B7 CRIT Rate +20%',
      '2 Qingming Companion stacks \u00B7 Ether DMG +16%',
      'EX Special & Ultimate Ether Sheer DMG +20%',
    ],
  },
  cauldron: {
    id: 'cauldron',
    name: 'Cauldron of Clarity',
    rank: 'A',
    refinement: 'W5',
    baseAtk: 594,
    advancedStat: { label: 'HP', value: 25 },
    passiveLines: [
      '3 EX Special stacks \u00B7 DMG +19.2%',
      '3 EX Special stacks \u00B7 CRIT Rate +10.4%',
    ],
  },
}

export const ENGINE_IDS_BY_POOL: Record<PoolId, EngineId[]> = {
  full: ['qingming', 'cauldron'],
  nonLimited: ['cauldron'],
}

export const TARGET_EQUIPMENT: PreparedEquipment = {
  fourPiece: 'Yunkui Tales',
  twoPiece: 'Woodpecker Electro',
  mains: {
    slot4: 'CRIT Rate +24%',
    slot5: 'Ether DMG +30%',
    slot6: 'HP +30%',
  },
}

export const PREPARED_ENGINE_BY_POOL: Record<PoolId, EngineId> = {
  full: 'qingming',
  nonLimited: 'cauldron',
}

export const SUBSTAT_CHOICES: Record<SubstatKey, { label: string; perHit: number; unit: '%' }> = {
  critRate: { label: 'CRIT Rate', perHit: 2.4, unit: '%' },
  critDmg: { label: 'CRIT DMG', perHit: 4.8, unit: '%' },
  hpPct: { label: 'HP', perHit: 3, unit: '%' },
  atkPct: { label: 'ATK', perHit: 3, unit: '%' },
}

export const SUBSTAT_KEYS = Object.keys(SUBSTAT_CHOICES) as SubstatKey[]

export const PARTY_AGENTS: AgentSummary[] = [
  {
    id: 'yixuan',
    order: 1,
    name: 'Yixuan',
    attribute: 'Auric Ink',
    specialty: 'Rupture',
    roles: ['Damage contributor', 'Fixed focus'],
    mindscape: 'M0',
    pool: 'Full',
    engine: { name: 'Qingming Birdcage', refinement: 'W1' },
    equipment: TARGET_EQUIPMENT,
    accent: '#1c7f70',
    portraitMark: '\u6613',
  },
  {
    id: 'dialyn',
    order: 2,
    name: 'Dialyn',
    attribute: 'Physical',
    specialty: 'Stun',
    roles: ['Daze contributor', 'Buffer'],
    mindscape: 'M0',
    pool: 'Full',
    engine: { name: 'Yesterday Calls', refinement: 'W1' },
    equipment: {
      fourPiece: 'King of the Summit',
      twoPiece: 'Woodpecker Electro',
      mains: {
        slot4: 'CRIT Rate +24%',
        slot5: 'ATK +30%',
        slot6: 'Energy Regen +60%',
      },
    },
    accent: '#c3653b',
    portraitMark: '\u94C3',
  },
  {
    id: 'lucia',
    order: 3,
    name: 'Lucia',
    attribute: 'Ether',
    specialty: 'Support',
    roles: ['Buffer'],
    mindscape: 'M0',
    pool: 'Full',
    engine: { name: 'Dreamlit Hearth', refinement: 'W1' },
    equipment: {
      fourPiece: 'Moonlight Lullaby',
      twoPiece: 'Yunkui Tales',
      mains: {
        slot4: 'HP +30%',
        slot5: 'HP +30%',
        slot6: 'HP +30%',
      },
    },
    accent: '#7182bd',
    portraitMark: '\u68A6',
  },
]

export const DISC_SUMMARIES = {
  yunkui: {
    name: 'Yunkui Tales',
    effect: '2-piece \u00B7 HP +10% / 4-piece fully enabled \u00B7 CRIT Rate +12%, Sheer DMG +10%',
  },
  woodpecker: {
    name: 'Woodpecker Electro',
    effect: '2-piece \u00B7 CRIT Rate +8%',
  },
} as const

export const VERTICAL_VALUES = {
  fixedDisc: {
    hp: 2200,
    atk: 316,
  },
  yixuan: {
    hp: 8373,
    atk: 872,
    critRate: 19.4,
    critDmg: 50,
    slot4CritRate: 24,
    slot6Hp: 30,
    yunkuiHp: 10,
    woodpeckerCritRate: 8,
    yunkuiCritRate: 12,
    yunkuiSheerDmg: 10,
    hpToSheer: 0.1,
    atkToSheer: 0.3,
    coreActionDmg: 30,
  },
  dialyn: {
    critRate: 19.4,
    critDmg: 50,
    impact: 110,
    engineCritRate: 24,
    slot4CritRate: 24,
    woodpeckerCritRate: 8,
    critThreshold: 50,
    impactPerCrit: 2,
    impactBonusCap: 100,
    kingDaze: 6,
    engineDaze: 27,
  },
  lucia: {
    hp: 8477,
    critDmg: 50,
    engineHp: 30,
    yunkuiHp: 10,
    mainHp: 90,
    darkbreakerBase: 12,
    darkbreakerPer200Hp: 7.4,
    darkbreakerCap: 900,
  },
  party: {
    dialynDmg: 40,
    dialynEngineCritDmg: 30,
    dialynKingCritDmg: 30,
    dialynStunMultiplier: 30,
    dialynStunExtension: 2,
    luciaCoreDmg: 20,
    luciaDiscDmg: 18,
    luciaEngineDmg: 25,
    luciaCritDmg: 30,
    luciaCoreHp: 5,
    luciaEngineHp: 15,
  },
} as const

export const SOURCE_LABELS = {
  agent: 'Agent Lv.60 + max Core',
  disc1: 'Drive Disc \u00B7 Slot 1',
  disc2: 'Drive Disc \u00B7 Slot 2',
  slot4: 'Drive Disc \u00B7 Slot 4',
  slot5: 'Drive Disc \u00B7 Slot 5',
  slot6: 'Drive Disc \u00B7 Slot 6',
  yunkui2: 'Yunkui Tales \u00B7 2-piece',
  yunkui4: 'Yunkui Tales \u00B7 4-piece',
  woodpecker2: 'Woodpecker Electro \u00B7 2-piece',
  qingming: 'Qingming Birdcage \u00B7 W1',
  cauldron: 'Cauldron of Clarity \u00B7 W5',
  dialynCore: 'Dialyn \u00B7 Five-Star Service Hotline',
  dialynAbility: 'Dialyn \u00B7 External Line',
  yesterday: 'Dialyn \u00B7 Yesterday Calls W1',
  king: 'Dialyn \u00B7 King of the Summit',
  luciaCore: 'Lucia \u00B7 Lost Nocturne',
  luciaAbility: 'Lucia \u00B7 Additional Ability',
  dreamlit: 'Lucia \u00B7 Dreamlit Hearth W1',
  moonlight: 'Lucia \u00B7 Moonlight Lullaby',
  darkbreaker: 'Lucia \u00B7 Darkbreaker',
} as const
