export type PoolId = 'full' | 'nonLimited'
export type EngineId = 'qingming' | 'cauldron'
export type AgentId = 'yixuan' | 'dialyn' | 'lucia'
export type SubstatKey = 'critRate' | 'critDmg' | 'hpPct'
export type PartnerSubstatKey = 'dialynCritRate' | 'luciaHpPct' | 'luciaHpFlat'

export interface WEngineChoice {
  id: EngineId
  name: string
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
    slot4: { stat: string; value: string }
    slot5: { stat: string; value: string }
    slot6: { stat: string; value: string }
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
}

export const W_ENGINES: Record<EngineId, WEngineChoice> = {
  qingming: {
    id: 'qingming',
    name: 'Qingming Birdcage',
    refinement: 'W1',
    baseAtk: 743,
    advancedStat: { label: 'HP', value: 30 },
    passiveLines: [
      'Combat \u00B7 CRIT Rate +20%',
      'Combat entry \u00B7 Ether DMG +16%',
      'EX Special & Ultimate Ether Sheer DMG +20%',
    ],
  },
  cauldron: {
    id: 'cauldron',
    name: 'Cauldron of Clarity',
    refinement: 'W5',
    baseAtk: 594,
    advancedStat: { label: 'HP', value: 25 },
    passiveLines: [
      'Fully enabled \u00B7 DMG +19.2%',
      'Fully enabled \u00B7 CRIT Rate +10.4%',
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
    slot4: { stat: 'CRIT Rate', value: '+24%' },
    slot5: { stat: 'Ether DMG', value: '+30%' },
    slot6: { stat: 'HP', value: '+30%' },
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
}

export const SUBSTAT_KEYS = Object.keys(SUBSTAT_CHOICES) as SubstatKey[]

export const PARTNER_EFFECTIVE_SUBSTATS: Record<Exclude<AgentId, 'yixuan'>, Array<{
  key: PartnerSubstatKey
  label: string
  perHit: number
  unit: '%' | ''
}>> = {
  dialyn: [{ key: 'dialynCritRate', label: 'CRIT Rate', perHit: 2.4, unit: '%' }],
  lucia: [
    { key: 'luciaHpPct', label: 'HP%', perHit: 3, unit: '%' },
    { key: 'luciaHpFlat', label: 'HP', perHit: 112, unit: '' },
  ],
}

export const PARTNER_SUBSTAT_KEYS: PartnerSubstatKey[] = [
  'dialynCritRate',
  'luciaHpPct',
  'luciaHpFlat',
]

export const PARTNER_ENGINE_PRESENTATION: Record<Exclude<AgentId, 'yixuan'>, {
  advancedStat: { label: string; value: number; unit: '%' }
  passiveLines: string[]
}> = {
  dialyn: {
    advancedStat: { label: 'CRIT Rate', value: 24, unit: '%' },
    passiveLines: [
      'Combat · Off-field Energy recovery +1.5/s',
      'Fully enabled · Daze +27%',
      'Fully enabled · Squad CRIT DMG +30%',
    ],
  },
  lucia: {
    advancedStat: { label: 'HP', value: 30, unit: '%' },
    passiveLines: [
      'Combat · Energy recovery +0.4/s',
      'Fully enabled · Max HP +15%',
      'Fully enabled · Squad DMG +25%',
    ],
  },
}

export const PARTNER_DISC_SUMMARIES: Record<Exclude<AgentId, 'yixuan'>, Array<{
  name: string
  effects: string[]
}>> = {
  dialyn: [
    {
      name: 'King of the Summit',
      effects: ['Fully enabled · Squad CRIT DMG +30%', '2-piece · Daze +6%'],
    },
    {
      name: 'Woodpecker Electro',
      effects: ['2-piece · CRIT Rate +8%'],
    },
  ],
  lucia: [
    {
      name: 'Moonlight Lullaby',
      effects: ['Fully enabled · Squad DMG +18%'],
    },
    {
      name: 'Yunkui Tales',
      effects: ['2-piece · HP +10%'],
    },
  ],
}

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
        slot4: { stat: 'CRIT Rate', value: '+24%' },
        slot5: { stat: 'ATK', value: '+30%' },
        slot6: { stat: 'Energy Regen', value: '+60%' },
      },
    },
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
        slot4: { stat: 'HP', value: '+30%' },
        slot5: { stat: 'HP', value: '+30%' },
        slot6: { stat: 'HP', value: '+30%' },
      },
    },
  },
]

export const DISC_SUMMARIES = {
  yunkui: {
    name: 'Yunkui Tales',
    effects: [
      'Fully enabled \u00B7 CRIT Rate +12%',
      'Fully enabled \u00B7 Sheer DMG +10%',
      '2-piece \u00B7 HP +10%',
    ],
  },
  woodpecker: {
    name: 'Woodpecker Electro',
    effects: ['2-piece \u00B7 CRIT Rate +8%'],
  },
} as const

export const VERTICAL_VALUES = {
  fixedDisc: {
    hp: 2200,
    atk: 316,
  },
  rupture: {
    currentAtkToSheer: 0.3,
    currentHpToSheer: 0.1,
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
    slot5EtherDmg: 30,
    coreActionDmgBonus: 60,
    additionalCritDmg: 40,
    additionalExDmgBonus: 30,
  },
  dialyn: {
    critRate: 19.4,
    critDmg: 50,
    impact: 110,
    baseEnergyRegen: 1.2,
    energyRegenPct: 60,
    engineEnergyPerSecond: 1.5,
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
    baseEnergyRegen: 1.56,
    engineEnergyPerSecond: 0.4,
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
  slot4: 'Drive Disc \u00B7 Slot 4',
  slot5: 'Drive Disc \u00B7 Slot 5',
  slot6: 'Drive Disc \u00B7 Slot 6',
  yunkui2: 'Yunkui Tales \u00B7 2-piece',
  yunkui4: 'Yunkui Tales \u00B7 4-piece',
  woodpecker2: 'Woodpecker Electro \u00B7 2-piece',
  qingming: 'Qingming Birdcage \u00B7 W1',
  cauldron: 'Cauldron of Clarity \u00B7 W5',
  yixuanCore: 'Core Passive',
  yixuanAbility: 'Additional Ability',
  dialynCore: 'Core Passive',
  dialynAbility: 'Additional Ability',
  yesterday: 'Yesterday Calls \u00B7 W1',
  king2: 'King of the Summit \u00B7 2-piece',
  king4: 'King of the Summit \u00B7 4-piece',
  luciaCore: 'Core Passive',
  luciaAbility: 'Additional Ability',
  dreamlit: 'Dreamlit Hearth \u00B7 W1',
  moonlight: 'Moonlight Lullaby \u00B7 4-piece',
  luciaSheer: 'EX Special Attack',
} as const
