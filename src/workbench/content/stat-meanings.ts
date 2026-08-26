import type { StatId, StatRegion } from '../calculation/stat-composer'
import type {
  AdvancedStat,
  EquipmentEffectFact,
  MainStatId,
  SubstatId,
} from './types'

export interface StatInputMeaning {
  statId: StatId
  region: Exclude<StatRegion, 'base'>
}

type SetupStatId = AdvancedStat['id'] | MainStatId | SubstatId

const SETUP_STAT_MEANINGS = {
  critRate: { statId: 'critRate', region: 'flat' },
  critDmg: { statId: 'critDmg', region: 'flat' },
  hpPct: { statId: 'maxHp', region: 'percentage' },
  hpFlat: { statId: 'maxHp', region: 'flat' },
  atkPct: { statId: 'atk', region: 'percentage' },
  atkFlat: { statId: 'atk', region: 'flat' },
  penRatio: { statId: 'penRatio', region: 'flat' },
  impact: { statId: 'impact', region: 'percentage' },
  impactPct: { statId: 'impact', region: 'percentage' },
  energyRegenPct: { statId: 'energyRegen', region: 'percentage' },
  defPct: { statId: 'def', region: 'percentage' },
  anomalyProficiency: { statId: 'anomalyProficiency', region: 'flat' },
  anomalyMastery: { statId: 'anomalyMastery', region: 'percentage' },
} as const satisfies Partial<Record<SetupStatId, StatInputMeaning>>

/** Resolves the shared calculation meaning behind authored setup stat IDs. */
export function setupStatMeaning(statId: SetupStatId): StatInputMeaning | undefined {
  return SETUP_STAT_MEANINGS[statId as keyof typeof SETUP_STAT_MEANINGS]
}

/** Resolves only equipment effect clauses that contribute an ordinary stat. */
export function equipmentEffectStatMeaning(
  fact: EquipmentEffectFact,
): StatInputMeaning | undefined {
  switch (fact.modifier) {
    case 'maxHp':
      return { statId: 'maxHp', region: fact.unit === '%' ? 'percentage' : 'flat' }
    case 'atk':
      return { statId: 'atk', region: fact.unit === '%' ? 'percentage' : 'flat' }
    case 'impact':
      return { statId: 'impact', region: fact.unit === '%' ? 'percentage' : 'flat' }
    case 'critRate':
      return { statId: 'critRate', region: 'flat' }
    case 'critDmg':
      return { statId: 'critDmg', region: 'flat' }
    case 'energyRegen':
      return fact.unit === '%'
        ? { statId: 'energyRegen', region: 'percentage' }
        : undefined
    case 'penRatio':
      return { statId: 'penRatio', region: 'flat' }
    case 'anomalyProficiency':
      return { statId: 'anomalyProficiency', region: 'flat' }
    case 'anomalyMastery':
      return {
        statId: 'anomalyMastery',
        region: fact.unit === '%' ? 'percentage' : 'flat',
      }
    default:
      return undefined
  }
}
