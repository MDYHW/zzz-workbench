import type { AgentId, DiscId, MainStatId, PoolId, SetupSelection } from './types'
import { DISC_IDS_BY_AGENT_AND_PIECE } from './discs'
import { ENGINE_IDS_BY_AGENT_AND_POOL } from './engines'
import { representativeSetupFor } from './representatives'
import { MAIN_STAT_IDS_BY_AGENT_AND_SLOT, SUBSTAT_CHOICES_BY_AGENT } from './setup-options'

/** Authored representative adjustment when broad pre-PEN pressure invalidates Slot 5 PEN. */
export const PREPARED_SLOT5_MAIN_BY_BROAD_PRE_PEN_PRESSURE: Partial<
  Record<AgentId, Exclude<MainStatId, 'penRatio'>>
> = {
  evelyn: 'fireDmg',
  corin: 'physicalDmg',
  hugo: 'iceDmg',
  zhuYuan: 'atkPct',
  nekomata: 'atkPct',
  billy: 'atkPct',
  grace: 'electricDmg',
  burnice: 'fireDmg',
}

/** Authored whole-package replacement when the selected 2-piece loses its distinct axis. */
export const PREPARED_TWO_PIECE_BY_BROAD_PRE_PEN_PRESSURE: Partial<
  Record<AgentId, DiscId>
> = {
  nekomata: 'branchAndBlade',
  grace: 'freedomBlues',
}

export type SetupPolicy = {
  engineIdsByPool: (typeof ENGINE_IDS_BY_AGENT_AND_POOL)[AgentId]
  discIdsByPiece: (typeof DISC_IDS_BY_AGENT_AND_PIECE)[AgentId]
  mainStatIdsBySlot: (typeof MAIN_STAT_IDS_BY_AGENT_AND_SLOT)[AgentId]
  substatChoices: (typeof SUBSTAT_CHOICES_BY_AGENT)[AgentId]
  representativeSetupFor: (pool: PoolId, mindscape: number) => SetupSelection
}

/** Returns the authored setup policy references for one Agent. */
export function setupPolicyFor(agentId: AgentId): SetupPolicy {
  return {
    engineIdsByPool: ENGINE_IDS_BY_AGENT_AND_POOL[agentId],
    discIdsByPiece: DISC_IDS_BY_AGENT_AND_PIECE[agentId],
    mainStatIdsBySlot: MAIN_STAT_IDS_BY_AGENT_AND_SLOT[agentId],
    substatChoices: SUBSTAT_CHOICES_BY_AGENT[agentId],
    representativeSetupFor: (pool, mindscape) => representativeSetupFor(agentId, pool, mindscape),
  }
}
