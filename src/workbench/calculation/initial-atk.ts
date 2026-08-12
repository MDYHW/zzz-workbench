import {
  DRIVE_DISC_FACTS,
  MAIN_STATS,
  SUBSTAT_CHOICES_BY_AGENT,
  VERTICAL_VALUES,
  W_ENGINES,
  equipmentEffectBaseValue,
  type DiscId,
  type EngineId,
  type MainSlot,
  type MainStatId,
  type SubstatId,
} from '../content'

export type SeedVanguardAtkAgentId = 'anbySoldier0' | 'seed' | 'cissia' | 'evelyn' | 'corin' | 'hugo'
export type InitialAtkAgentId = SeedVanguardAtkAgentId | 'juFufu'

export interface InitialAtkSetup {
  engineId: EngineId | null
  fourPieceId: DiscId | null
  twoPieceId: DiscId | null
  mains: Record<MainSlot, MainStatId | null>
  substats: Partial<Record<SubstatId, number>>
}

function selectedAtkTwoPiece(
  setup: InitialAtkSetup,
  discId: 'astralVoice' | 'hormonePunk',
): number {
  return setup.fourPieceId === discId || setup.twoPieceId === discId
    ? equipmentEffectBaseValue(
      discId === 'astralVoice'
        ? DRIVE_DISC_FACTS.astralVoice.twoPiece.atk
        : DRIVE_DISC_FACTS.hormonePunk.twoPiece.atk,
    )
    : 0
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
    + selectedAtkTwoPiece(setup, 'astralVoice')
    + selectedAtkTwoPiece(setup, 'hormonePunk')
    + atkSubstatHits * (atkSubstat?.perHit ?? 0)
  )
  const baseAtk = VERTICAL_VALUES[agentId].atk + engine.baseAtk
  return baseAtk * (1 + atkPct / 100)
    + VERTICAL_VALUES.fixedDisc.atk
    + flatAtkSubstatHits * (flatAtkSubstat?.perHit ?? 0)
}
