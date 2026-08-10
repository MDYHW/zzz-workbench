import type {
  AgentId,
  MainSlot,
  MainStatChoice,
  MainStatId,
  SetupFormulaParticipation,
  SubstatChoice,
} from './types'

export const SETUP_FORMULA_PARTICIPATION_BY_AGENT: Record<
  AgentId,
  SetupFormulaParticipation
> = {
  yixuan: { primary: ['sheer_damage'], residual: [] },
  dialyn: { primary: ['daze_buildup'], residual: ['general_damage'] },
  lucia: { primary: [], residual: [] },
  anbySoldier0: { primary: ['general_damage'], residual: [] },
  trigger: { primary: ['daze_buildup'], residual: ['general_damage'] },
  astraYao: { primary: [], residual: [] },
  seed: { primary: ['general_damage'], residual: [] },
  cissia: { primary: ['general_damage', 'daze_buildup'], residual: [] },
  evelyn: { primary: ['general_damage'], residual: [] },
}

export const MAIN_STATS: Record<MainStatId, MainStatChoice> = {
  critRate: { id: 'critRate', label: 'CRIT Rate', numericValue: 24 },
  critDmg: { id: 'critDmg', label: 'CRIT DMG', numericValue: 48 },
  etherDmg: { id: 'etherDmg', label: 'Ether DMG', numericValue: 30 },
  hpPct: { id: 'hpPct', label: 'HP%', numericValue: 30 },
  atkPct: { id: 'atkPct', label: 'ATK%', numericValue: 30 },
  physicalDmg: { id: 'physicalDmg', label: 'Physical DMG', numericValue: 30 },
  penRatio: { id: 'penRatio', label: 'PEN Ratio', numericValue: 24 },
  impact: { id: 'impact', label: 'Impact', numericValue: 18 },
  energyRegenPct: {
    id: 'energyRegenPct',
    label: 'Energy Regen',
    numericValue: 60,
  },
  electricDmg: { id: 'electricDmg', label: 'Electric DMG', numericValue: 30 },
  fireDmg: { id: 'fireDmg', label: 'Fire DMG', numericValue: 30 },
}

export const MAIN_STAT_IDS_BY_AGENT_AND_SLOT: Record<
  AgentId,
  Record<MainSlot, MainStatId[]>
> = {
  yixuan: {
    slot4: ['critRate', 'critDmg'],
    slot5: ['etherDmg', 'hpPct'],
    slot6: ['hpPct'],
  },
  dialyn: {
    slot4: ['critRate'],
    slot5: ['atkPct', 'physicalDmg', 'penRatio'],
    slot6: ['energyRegenPct', 'impact'],
  },
  lucia: {
    slot4: ['hpPct'],
    slot5: ['hpPct'],
    slot6: ['hpPct', 'energyRegenPct'],
  },
  anbySoldier0: {
    slot4: ['critRate', 'critDmg'],
    slot5: ['electricDmg', 'atkPct', 'penRatio'],
    slot6: ['atkPct'],
  },
  trigger: {
    slot4: ['critRate'],
    slot5: ['electricDmg', 'atkPct', 'penRatio'],
    slot6: ['impact'],
  },
  astraYao: {
    slot4: ['atkPct'],
    slot5: ['atkPct'],
    slot6: ['atkPct', 'energyRegenPct'],
  },
  seed: {
    slot4: ['critRate', 'critDmg'],
    slot5: ['electricDmg', 'atkPct', 'penRatio'],
    slot6: ['atkPct'],
  },
  cissia: {
    slot4: ['critRate', 'critDmg'],
    slot5: ['electricDmg', 'atkPct'],
    slot6: ['energyRegenPct', 'atkPct'],
  },
  evelyn: {
    slot4: ['critRate', 'critDmg'],
    slot5: ['penRatio', 'fireDmg', 'atkPct'],
    slot6: ['atkPct'],
  },
}

export const SUBSTAT_CHOICES_BY_AGENT: Record<AgentId, SubstatChoice[]> = {
  yixuan: [
    { id: 'critRate', label: 'CRIT Rate', perHit: 2.4, unit: '%' },
    { id: 'critDmg', label: 'CRIT DMG', perHit: 4.8, unit: '%' },
    { id: 'hpPct', label: 'HP%', perHit: 3, unit: '%' },
  ],
  dialyn: [{ id: 'critRate', label: 'CRIT Rate', perHit: 2.4, unit: '%' }],
  lucia: [
    { id: 'hpPct', label: 'HP%', perHit: 3, unit: '%' },
    { id: 'hpFlat', label: 'HP', perHit: 112, unit: '' },
  ],
  anbySoldier0: [
    { id: 'critRate', label: 'CRIT Rate', perHit: 2.4, unit: '%' },
    { id: 'critDmg', label: 'CRIT DMG', perHit: 4.8, unit: '%' },
    { id: 'atkPct', label: 'ATK%', perHit: 3, unit: '%' },
  ],
  trigger: [{ id: 'critRate', label: 'CRIT Rate', perHit: 2.4, unit: '%' }],
  astraYao: [
    { id: 'atkPct', label: 'ATK%', perHit: 3, unit: '%' },
    { id: 'atkFlat', label: 'ATK', perHit: 19, unit: '' },
  ],
  seed: [
    { id: 'critRate', label: 'CRIT Rate', perHit: 2.4, unit: '%' },
    { id: 'critDmg', label: 'CRIT DMG', perHit: 4.8, unit: '%' },
    { id: 'atkPct', label: 'ATK%', perHit: 3, unit: '%' },
  ],
  cissia: [
    { id: 'critRate', label: 'CRIT Rate', perHit: 2.4, unit: '%' },
    { id: 'critDmg', label: 'CRIT DMG', perHit: 4.8, unit: '%' },
    { id: 'atkPct', label: 'ATK%', perHit: 3, unit: '%' },
  ],
  evelyn: [
    { id: 'critRate', label: 'CRIT Rate', perHit: 2.4, unit: '%' },
    { id: 'critDmg', label: 'CRIT DMG', perHit: 4.8, unit: '%' },
    { id: 'atkPct', label: 'ATK%', perHit: 3, unit: '%' },
  ],
}
