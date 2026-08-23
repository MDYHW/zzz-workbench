import type {
  AgentId,
  DiscId,
  MainSlot,
  FixedMainSlot,
  MainStatChoice,
  MainStatId,
  SetupFormulaParticipation,
  SubstatChoice,
} from './types'

export const FIXED_MAIN_STATS: Record<FixedMainSlot, { slot: FixedMainSlot; stat: 'hpFlat' | 'atkFlat' | 'defFlat'; numericValue: number; unit: '' }> = {
  slot1: { slot: 'slot1', stat: 'hpFlat', numericValue: 2200, unit: '' },
  slot2: { slot: 'slot2', stat: 'atkFlat', numericValue: 316, unit: '' },
  slot3: { slot: 'slot3', stat: 'defFlat', numericValue: 184, unit: '' },
}

export const SETUP_FORMULA_PARTICIPATION_BY_AGENT: Record<
  AgentId,
  SetupFormulaParticipation
> = {
  yixuan: { primary: ['sheer_damage'], residual: [] },
  yidhari: { primary: ['sheer_damage'], residual: [] },
  manato: { primary: ['sheer_damage'], residual: [] },
  hugo: { primary: ['general_damage'], residual: [] },
  juFufu: { primary: ['daze_buildup'], residual: ['general_damage'] },
  panYinhu: { primary: [], residual: ['daze_buildup'] },
  banyue: { primary: ['sheer_damage'], residual: [] },
  starlightBilly: { primary: ['sheer_damage'], residual: [] },
  dialyn: { primary: ['daze_buildup'], residual: ['general_damage'] },
  lucia: { primary: [], residual: [] },
  anbySoldier0: { primary: ['general_damage'], residual: [] },
  trigger: { primary: ['daze_buildup'], residual: ['general_damage'] },
  astraYao: { primary: [], residual: [] },
  seed: { primary: ['general_damage'], residual: [] },
  cissia: { primary: ['general_damage', 'daze_buildup'], residual: [] },
  evelyn: { primary: ['general_damage'], residual: [] },
  corin: { primary: ['general_damage'], residual: [] },
  lycaon: { primary: ['daze_buildup'], residual: [] },
  ellen: { primary: ['general_damage'], residual: [] },
  soukaku: { primary: [], residual: [] },
  soldier11: { primary: ['general_damage'], residual: [] },
  lighter: { primary: ['daze_buildup'], residual: [] },
  lucy: { primary: [], residual: [] },
  zhuYuan: { primary: ['general_damage'], residual: [] },
  nicole: { primary: [], residual: [] },
  orphie: { primary: [], residual: ['general_damage'] },
  pulchra: { primary: ['daze_buildup'], residual: ['general_damage'] },
  harumasa: { primary: ['general_damage'], residual: [] },
  qingyi: { primary: ['daze_buildup'], residual: ['general_damage'] },
  nekomata: { primary: ['general_damage'], residual: [] },
  billy: { primary: ['general_damage'], residual: [] },
  ben: { primary: ['general_damage'], residual: ['daze_buildup'] },
  koleda: { primary: ['daze_buildup'], residual: ['general_damage'] },
  anby: { primary: ['daze_buildup'], residual: ['general_damage'] },
  caesar: { primary: [], residual: ['daze_buildup', 'general_damage'] },
  yeShunguang: { primary: ['general_damage'], residual: [] },
  zhao: { primary: [], residual: ['general_damage'] },
  grace: { primary: ['anomaly_damage', 'anomaly_buildup'], residual: [] },
  piper: { primary: ['anomaly_damage', 'anomaly_buildup'], residual: [] },
  yuzuha: { primary: ['anomaly_buildup'], residual: [] },
  burnice: { primary: ['anomaly_damage', 'anomaly_buildup'], residual: ['general_damage'] },
  jane: { primary: ['anomaly_damage', 'anomaly_buildup'], residual: [] },
  seth: { primary: [], residual: ['anomaly_buildup', 'daze_buildup'] },
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
  iceDmg: { id: 'iceDmg', label: 'Ice DMG', numericValue: 30 },
  defPct: { id: 'defPct', label: 'DEF%', numericValue: 48 },
  anomalyProficiency: {
    id: 'anomalyProficiency', label: 'Anomaly Proficiency', numericValue: 92, unit: '',
  },
  anomalyMastery: {
    id: 'anomalyMastery', label: 'Anomaly Mastery', numericValue: 30,
  },
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
  yidhari: {
    slot4: ['critRate', 'critDmg'],
    slot5: ['iceDmg', 'hpPct'],
    slot6: ['hpPct'],
  },
  manato: {
    slot4: ['critRate', 'critDmg'],
    slot5: ['fireDmg', 'hpPct'],
    slot6: ['hpPct'],
  },
  hugo: {
    slot4: ['critRate', 'critDmg'],
    slot5: ['iceDmg', 'atkPct', 'penRatio'],
    slot6: ['atkPct'],
  },
  juFufu: {
    slot4: ['atkPct'],
    slot5: ['atkPct', 'fireDmg'],
    slot6: ['atkPct', 'impact'],
  },
  panYinhu: {
    slot4: ['atkPct'],
    slot5: ['atkPct'],
    slot6: ['atkPct', 'energyRegenPct'],
  },
  banyue: {
    slot4: ['critRate', 'critDmg'],
    slot5: ['fireDmg', 'hpPct'],
    slot6: ['hpPct'],
  },
  starlightBilly: {
    slot4: ['critRate', 'critDmg', 'hpPct'],
    slot5: ['physicalDmg', 'hpPct'],
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
  corin: {
    slot4: ['critRate', 'critDmg'],
    slot5: ['penRatio', 'physicalDmg', 'atkPct'],
    slot6: ['atkPct'],
  },
  lycaon: {
    slot4: ['atkPct'],
    slot5: ['iceDmg', 'atkPct'],
    slot6: ['impact', 'energyRegenPct'],
  },
  ellen: {
    slot4: ['critRate', 'critDmg'], slot5: ['iceDmg', 'atkPct', 'penRatio'], slot6: ['atkPct'],
  },
  soukaku: {
    slot4: ['atkPct'], slot5: ['atkPct'], slot6: ['atkPct', 'energyRegenPct'],
  },
  soldier11: {
    slot4: ['critRate', 'critDmg'], slot5: ['fireDmg', 'penRatio'], slot6: ['atkPct'],
  },
  lighter: {
    slot4: ['atkPct'], slot5: ['fireDmg'], slot6: ['impact'],
  },
  lucy: {
    slot4: ['atkPct'], slot5: ['atkPct'], slot6: ['energyRegenPct'],
  },
  zhuYuan: {
    slot4: ['critRate', 'critDmg'], slot5: ['etherDmg', 'atkPct', 'penRatio'], slot6: ['atkPct'],
  },
  nicole: {
    slot4: ['atkPct'], slot5: ['etherDmg'], slot6: ['energyRegenPct'],
  },
  orphie: {
    slot4: ['critRate', 'critDmg'], slot5: ['fireDmg', 'atkPct'],
    slot6: ['energyRegenPct', 'atkPct'],
  },
  pulchra: {
    slot4: ['atkPct'], slot5: ['physicalDmg', 'atkPct'],
    slot6: ['impact', 'energyRegenPct'],
  },
  harumasa: {
    slot4: ['critRate', 'critDmg', 'atkPct'], slot5: ['electricDmg', 'atkPct', 'penRatio'], slot6: ['atkPct'],
  },
  qingyi: {
    slot4: ['critDmg', 'atkPct'], slot5: ['electricDmg', 'atkPct', 'penRatio'], slot6: ['impact', 'atkPct'],
  },
  nekomata: {
    slot4: ['critRate', 'critDmg', 'atkPct'], slot5: ['physicalDmg', 'atkPct', 'penRatio'], slot6: ['atkPct'],
  },
  billy: {
    slot4: ['critRate', 'critDmg', 'atkPct'], slot5: ['physicalDmg', 'atkPct', 'penRatio'], slot6: ['atkPct'],
  },
  ben: {
    slot4: ['critRate', 'critDmg', 'atkPct'],
    slot5: ['fireDmg', 'penRatio', 'atkPct'],
    slot6: ['atkPct'],
  },
  koleda: {
    slot4: ['atkPct'], slot5: ['fireDmg', 'atkPct'], slot6: ['impact'],
  },
  anby: {
    slot4: ['atkPct'], slot5: ['electricDmg', 'atkPct'],
    slot6: ['impact', 'energyRegenPct'],
  },
  caesar: {
    slot4: ['critRate', 'critDmg', 'atkPct'],
    slot5: ['physicalDmg', 'atkPct', 'penRatio'],
    slot6: ['impact'],
  },
  yeShunguang: {
    slot4: ['critRate', 'critDmg'],
    slot5: ['physicalDmg', 'atkPct', 'penRatio'],
    slot6: ['atkPct'],
  },
  zhao: {
    slot4: ['hpPct'],
    slot5: ['hpPct'],
    slot6: ['hpPct', 'energyRegenPct'],
  },
  grace: {
    slot4: ['anomalyProficiency', 'atkPct'],
    slot5: ['penRatio', 'electricDmg', 'atkPct'],
    slot6: ['anomalyMastery', 'atkPct'],
  },
  piper: {
    slot4: ['anomalyProficiency', 'atkPct'],
    slot5: ['physicalDmg', 'atkPct', 'penRatio'],
    slot6: ['anomalyMastery', 'atkPct'],
  },
  yuzuha: {
    slot4: ['atkPct', 'anomalyProficiency'],
    slot5: ['atkPct'],
    slot6: ['anomalyMastery'],
  },
  burnice: {
    slot4: ['anomalyProficiency'],
    slot5: ['penRatio', 'fireDmg'],
    slot6: ['energyRegenPct', 'anomalyMastery'],
  },
  jane: {
    slot4: ['anomalyProficiency', 'atkPct'], slot5: ['penRatio', 'physicalDmg', 'atkPct'], slot6: ['anomalyMastery', 'atkPct'],
  },
  seth: {
    slot4: ['anomalyProficiency', 'atkPct'], slot5: ['electricDmg', 'atkPct'], slot6: ['energyRegenPct'],
  },
}

export const EFFECTIVE_SUBSTAT_VALUES: Record<SubstatChoice['id'], SubstatChoice> = {
  critRate: { id: 'critRate', label: 'CRIT Rate', perHit: 2.4, unit: '%' },
  critDmg: { id: 'critDmg', label: 'CRIT DMG', perHit: 4.8, unit: '%' },
  hpPct: { id: 'hpPct', label: 'HP%', perHit: 3, unit: '%' },
  hpFlat: { id: 'hpFlat', label: 'HP', perHit: 112, unit: '' },
  atkPct: { id: 'atkPct', label: 'ATK%', perHit: 3, unit: '%' },
  atkFlat: { id: 'atkFlat', label: 'ATK', perHit: 19, unit: '' },
  anomalyProficiency: { id: 'anomalyProficiency', label: 'Anomaly Proficiency', perHit: 9, unit: '' },
}

const substats = (...ids: SubstatChoice['id'][]): SubstatChoice[] => ids.map((id) => EFFECTIVE_SUBSTAT_VALUES[id])

export const SUBSTAT_CHOICES_BY_AGENT: Record<AgentId, SubstatChoice[]> = {
  yixuan: substats('critRate', 'critDmg', 'hpPct'), yidhari: substats('critRate', 'critDmg', 'hpPct'), manato: substats('critRate', 'critDmg', 'hpPct'),
  hugo: substats('critRate', 'critDmg', 'atkPct'), juFufu: substats('atkPct', 'atkFlat'), panYinhu: substats('atkPct', 'atkFlat'),
  banyue: substats('critRate', 'critDmg', 'hpPct'), starlightBilly: substats('critRate', 'critDmg', 'hpPct'), dialyn: substats('critRate'), lucia: substats('hpPct', 'hpFlat'),
  anbySoldier0: substats('critRate', 'critDmg', 'atkPct'), trigger: substats('critRate'), astraYao: substats('atkPct', 'atkFlat'),
  seed: substats('critRate', 'critDmg', 'atkPct'), cissia: substats('critRate', 'critDmg', 'atkPct'), evelyn: substats('critRate', 'critDmg', 'atkPct'), corin: substats('critRate', 'critDmg', 'atkPct'),
  lycaon: substats('critRate'), ellen: substats('critRate', 'critDmg', 'atkPct'), soukaku: substats('atkPct', 'atkFlat'), soldier11: substats('critRate', 'critDmg', 'atkPct'),
  lighter: [], lucy: [], zhuYuan: substats('critRate', 'critDmg', 'atkPct'), nicole: [], orphie: substats('critRate', 'critDmg', 'atkPct'), pulchra: [],
  harumasa: substats('critRate', 'critDmg', 'atkPct'), qingyi: [], nekomata: substats('critRate', 'critDmg', 'atkPct'), billy: substats('critRate', 'critDmg', 'atkPct'), ben: substats('critRate', 'critDmg', 'atkPct'),
  koleda: [], anby: [], caesar: [], yeShunguang: substats('critRate', 'critDmg', 'atkPct'), zhao: substats('hpPct', 'hpFlat'), grace: substats('anomalyProficiency', 'atkPct'), piper: substats('anomalyProficiency', 'atkPct'), yuzuha: substats('atkPct', 'atkFlat'), burnice: substats('anomalyProficiency', 'atkPct'), jane: substats('anomalyProficiency', 'atkPct'), seth: [],
}

/**
 * Effective substat inputs are authored choices plus current selected-input
 * pressure. Consumers pass only Agent identity and the already-selected setup;
 * no Result value or preparation decision feeds this query.
 */
export function effectiveSubstatChoices(
  agentId: AgentId,
  setup: { fourPieceId: DiscId | null },
): SubstatChoice[] {
  if ((agentId === 'lycaon' || agentId === 'lighter' || agentId === 'pulchra' || agentId === 'qingyi' || agentId === 'koleda' || agentId === 'anby') && setup.fourPieceId !== 'king') return []
  if (agentId === 'pulchra' && setup.fourPieceId === 'king') {
    return [{ id: 'critRate', label: 'CRIT Rate', perHit: 2.4, unit: '%' }]
  }
  if (agentId === 'lighter' && setup.fourPieceId === 'king') {
    return [{ id: 'critRate', label: 'CRIT Rate', perHit: 2.4, unit: '%' }]
  }
  if (agentId === 'koleda' && setup.fourPieceId === 'king') {
    return [{ id: 'critRate', label: 'CRIT Rate', perHit: 2.4, unit: '%' }]
  }
  if (agentId === 'anby' && setup.fourPieceId === 'king') {
    return [{ id: 'critRate', label: 'CRIT Rate', perHit: 2.4, unit: '%' }]
  }
  if (agentId === 'qingyi' && setup.fourPieceId === 'king') {
    return [{ id: 'critRate', label: 'CRIT Rate', perHit: 2.4, unit: '%' }]
  }
  if (agentId === 'juFufu' && setup.fourPieceId === 'king') {
    return [
      { id: 'critRate', label: 'CRIT Rate', perHit: 2.4, unit: '%' },
      ...SUBSTAT_CHOICES_BY_AGENT.juFufu,
    ]
  }
  return SUBSTAT_CHOICES_BY_AGENT[agentId]
}
