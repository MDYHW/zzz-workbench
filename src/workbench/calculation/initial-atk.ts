import {
  MAIN_STATS,
  SUBSTAT_CHOICES_BY_AGENT,
  VERTICAL_VALUES,
  W_ENGINES,
  type AgentId,
  type DiscId,
  type EngineId,
  type MainSlot,
  type MainStatId,
  type SubstatId,
} from '../content'
import { selectedDiscTwoPieceInputs } from '../effects'

export const SEED_VANGUARD_ATK_AGENT_IDS = [
  'anbySoldier0', 'seed', 'cissia', 'evelyn', 'corin', 'hugo', 'ellen', 'soldier11', 'zhuYuan', 'orphie', 'nekomata', 'billy', 'yeShunguang',
] as const

export type SeedVanguardAtkAgentId = (typeof SEED_VANGUARD_ATK_AGENT_IDS)[number]
export type InitialAtkAgentId = SeedVanguardAtkAgentId
  | 'juFufu' | 'panYinhu' | 'soukaku' | 'lucy' | 'pulchra' | 'harumasa' | 'qingyi'
  | 'ben' | 'koleda' | 'anby' | 'caesar'
  | 'zhao'
  | 'grace' | 'piper' | 'yuzuha'

export function isSeedVanguardAtkAgent(agentId: AgentId): agentId is SeedVanguardAtkAgentId {
  return SEED_VANGUARD_ATK_AGENT_IDS.some((candidate) => candidate === agentId)
}

export interface InitialAtkSetup {
  engineId: EngineId | null
  fourPieceId: DiscId | null
  twoPieceId: DiscId | null
  mains: Record<MainSlot, MainStatId | null>
  substats: Partial<Record<SubstatId, number>>
}

/** Exact Initial ATK used only by Seed's current Vanguard comparison and ATK projectors. */
export function initialAtkFor(
  agentId: InitialAtkAgentId,
  setup: InitialAtkSetup,
): number | null {
  if (!setup.engineId) return null

  const engine = W_ENGINES[setup.engineId]
  const atkSubstat = SUBSTAT_CHOICES_BY_AGENT[agentId]
    .find(({ id }) => id === 'atkPct')
  const flatAtkSubstat = SUBSTAT_CHOICES_BY_AGENT[agentId]
    .find(({ id }) => id === 'atkFlat')
  const atkSubstatHits = setup.substats.atkPct ?? 0
  const flatAtkSubstatHits = setup.substats.atkFlat ?? 0
  if (!Number.isFinite(atkSubstatHits) || !Number.isFinite(flatAtkSubstatHits)) return null
  const atkPct = (
    (engine.advancedStat.id === 'atkPct' ? engine.advancedStat.value : 0)
    + (setup.mains.slot4 === 'atkPct' ? MAIN_STATS.atkPct.numericValue : 0)
    + (setup.mains.slot5 === 'atkPct' ? MAIN_STATS.atkPct.numericValue : 0)
    + (setup.mains.slot6 === 'atkPct' ? MAIN_STATS.atkPct.numericValue : 0)
    + selectedDiscTwoPieceInputs({
      fourPieceId: setup.fourPieceId,
      twoPieceId: setup.twoPieceId,
    }, agentId, { modifier: 'atk' })
      .reduce((total, input) => total + input.rawValue, 0)
    + atkSubstatHits * (atkSubstat?.perHit ?? 0)
  )
  const baseAtk = VERTICAL_VALUES[agentId].atk + engine.baseAtk
  return baseAtk * (1 + atkPct / 100)
    + VERTICAL_VALUES.fixedDisc.atk
    + flatAtkSubstatHits * (flatAtkSubstat?.perHit ?? 0)
}
