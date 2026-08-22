import {
  MAIN_STATS,
  FIXED_MAIN_STATS,
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

export interface InitialAtkSetup {
  engineId: EngineId | null
  fourPieceId: DiscId | null
  twoPieceId: DiscId | null
  mains: Record<MainSlot, MainStatId | null>
  substats: Partial<Record<SubstatId, number>>
}

/** Exact Initial ATK used only by Seed's current Vanguard comparison and ATK projectors. */
export function initialAtkFor(
  agentId: AgentId,
  setup: InitialAtkSetup,
): number | null {
  if (!setup.engineId) return null

  const engine = W_ENGINES[setup.engineId]
  const retained = VERTICAL_VALUES[agentId]
  if (!('atk' in retained) || typeof retained.atk !== 'number') return null
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
  const baseAtk = retained.atk + engine.baseAtk
  return baseAtk * (1 + atkPct / 100)
    + FIXED_MAIN_STATS.slot2.numericValue
    + flatAtkSubstatHits * (flatAtkSubstat?.perHit ?? 0)
}
