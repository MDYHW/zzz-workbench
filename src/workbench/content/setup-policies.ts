import type {
  AgentId,
  DiscId,
  EngineId,
  MainSlot,
  MainStatId,
  PoolId,
  SetupSelection,
} from './types'
import {
  DISC_IDS_BY_AGENT_AND_PIECE,
  ENGINE_IDS_BY_AGENT_AND_POOL,
} from './agent-setup-candidates'
import { representativeSetupFor } from './representatives'
import { MAIN_STAT_IDS_BY_AGENT_AND_SLOT, SUBSTAT_CHOICES_BY_AGENT } from './setup-options'

export type OperatingInterval = 'on-field' | 'off-field'
export type FocusOperationProfile = 'stun-led-burst'

export type OperatingIntervalPolicy = {
  default: OperatingInterval
  byFocusOperation?: Partial<Record<FocusOperationProfile, OperatingInterval>>
}

export type PreparedDiscPatch = {
  fourPieceId: DiscId
  twoPieceId?: DiscId
  mains?: Partial<Record<MainSlot, MainStatId>>
}

export type PreparedKingCollisionAlternative =
  | { kind: 'rigid-holder'; patch: PreparedDiscPatch }
  | { kind: 'exact-holder'; holderAgentId: AgentId; patch: PreparedDiscPatch }

export type PreparedDiscHolderPolicy = {
  kingAstralAlternative?: {
    preservesCritInvestment: boolean
    authoredTiePrecedence?: number
  }
  astralCollisionAlternative?: {
    patch: PreparedDiscPatch
    authoredKeeperPrecedence: number
  }
  moonlightCollisionAlternative?: {
    patch: PreparedDiscPatch
    authoredKeeperPrecedence: number
  }
  kingCollisionAlternative?: PreparedKingCollisionAlternative
  restoreRepresentativeOnAstralMoonlightCollision?: true
}

export type PreparedEngineHolderPolicy = {
  focusWithoutDefRegionAlternative?: {
    pool: PoolId
    engineId: EngineId
  }
}

/**
 * Current operation metadata used only by condition-bearing equipment effects.
 * Every admitted consumer is explicit; non-Focus does not imply off-field.
 */
const FOCUS_OPERATION_PROFILE_BY_AGENT: Partial<Record<AgentId, FocusOperationProfile>> = {
  corin: 'stun-led-burst',
  hugo: 'stun-led-burst',
  zhuYuan: 'stun-led-burst',
}

const OPERATING_INTERVAL_BY_AGENT: Partial<Record<AgentId, OperatingIntervalPolicy>> = {
  norma: { default: 'off-field' },
  dialyn: { default: 'off-field' },
  trigger: { default: 'off-field' },
  lycaon: {
    default: 'off-field',
    byFocusOperation: { 'stun-led-burst': 'on-field' },
  },
  juFufu: { default: 'off-field' },
  lighter: { default: 'off-field' },
  pulchra: { default: 'off-field' },
  qingyi: { default: 'on-field' },
  koleda: { default: 'off-field' },
  anby: { default: 'off-field' },
  jane: { default: 'on-field' },
  seth: { default: 'off-field' },
  burnice: { default: 'off-field' },
  yanagi: { default: 'on-field' },
  alice: { default: 'on-field' },
  vivian: { default: 'off-field' },
  aria: { default: 'on-field' },
  promeia: { default: 'on-field' },
  sunna: { default: 'off-field' },
  lucia: { default: 'off-field' },
  soukaku: { default: 'off-field' },
  lucy: { default: 'off-field' },
  nicole: { default: 'off-field' },
  yuzuha: { default: 'off-field' },
  rina: { default: 'off-field' },
  nangongYu: { default: 'off-field' },
  miyabi: { default: 'on-field' },
}

/**
 * Holder-local complete alternatives consumed by shared prepared allocation.
 * Candidate admission remains in the candidate layer; these patches can only
 * choose among already-authored legal packages during preparation.
 */
const PREPARED_DISC_HOLDER_POLICY_BY_AGENT: Partial<Record<AgentId, PreparedDiscHolderPolicy>> = {
  trigger: {
    kingAstralAlternative: {
      preservesCritInvestment: true,
      authoredTiePrecedence: 5,
    },
  },
  pulchra: {
    kingAstralAlternative: { preservesCritInvestment: false, authoredTiePrecedence: 4 },
  },
  koleda: {
    kingAstralAlternative: { preservesCritInvestment: false, authoredTiePrecedence: 3 },
  },
  lycaon: {
    kingAstralAlternative: { preservesCritInvestment: false, authoredTiePrecedence: 2 },
  },
  anby: {
    kingAstralAlternative: { preservesCritInvestment: false, authoredTiePrecedence: 1 },
  },
  lighter: {
    kingAstralAlternative: { preservesCritInvestment: false },
  },
  astraYao: {
    astralCollisionAlternative: {
      patch: { fourPieceId: 'moonlight', twoPieceId: 'astralVoice' },
      authoredKeeperPrecedence: 1,
    },
    moonlightCollisionAlternative: {
      patch: { fourPieceId: 'astralVoice', twoPieceId: 'moonlight' },
      authoredKeeperPrecedence: 0,
    },
  },
  panYinhu: {
    astralCollisionAlternative: {
      patch: { fourPieceId: 'bunnyInWonderland', twoPieceId: 'astralVoice' },
      authoredKeeperPrecedence: 2,
    },
  },
  juFufu: {
    kingCollisionAlternative: {
      kind: 'rigid-holder',
      patch: { fourPieceId: 'swingJazz', twoPieceId: 'king', mains: { slot4: 'atkPct' } },
    },
  },
  qingyi: {
    kingCollisionAlternative: {
      kind: 'exact-holder', holderAgentId: 'dialyn',
      patch: { fourPieceId: 'shockstar', twoPieceId: 'king', mains: { slot4: 'atkPct' } },
    },
  },
  cissia: { restoreRepresentativeOnAstralMoonlightCollision: true },
  soukaku: {
    moonlightCollisionAlternative: {
      patch: { fourPieceId: 'astralVoice', twoPieceId: 'moonlight' },
      authoredKeeperPrecedence: 1,
    },
  },
  lucy: {
    moonlightCollisionAlternative: {
      patch: { fourPieceId: 'astralVoice', twoPieceId: 'moonlight' },
      authoredKeeperPrecedence: 2,
    },
  },
  nicole: {
    moonlightCollisionAlternative: {
      patch: { fourPieceId: 'astralVoice', twoPieceId: 'moonlight' },
      authoredKeeperPrecedence: 3,
    },
  },
  yuzuha: {
    moonlightCollisionAlternative: {
      patch: { fourPieceId: 'astralVoice', twoPieceId: 'phaethonsMelody' },
      authoredKeeperPrecedence: 4,
    },
  },
  seth: {
    astralCollisionAlternative: {
      patch: { fourPieceId: 'swingJazz', twoPieceId: 'moonlight' },
      authoredKeeperPrecedence: 5,
    },
  },
  sunna: {
    moonlightCollisionAlternative: {
      patch: { fourPieceId: 'astralVoice', twoPieceId: 'moonlight' },
      authoredKeeperPrecedence: 0.5,
    },
  },
  rina: {
    moonlightCollisionAlternative: {
      patch: { fourPieceId: 'astralVoice', twoPieceId: 'pufferElectro' },
      authoredKeeperPrecedence: 5,
    },
  },
}

const PREPARED_ENGINE_HOLDER_POLICY_BY_AGENT: Partial<Record<AgentId, PreparedEngineHolderPolicy>> = {
  trigger: {
    focusWithoutDefRegionAlternative: { pool: 'full', engineId: 'iceJadeTeapot' },
  },
}

export type SetupPolicy = {
  engineIdsByPool: (typeof ENGINE_IDS_BY_AGENT_AND_POOL)[AgentId]
  discIdsByPiece: (typeof DISC_IDS_BY_AGENT_AND_PIECE)[AgentId]
  mainStatIdsBySlot: (typeof MAIN_STAT_IDS_BY_AGENT_AND_SLOT)[AgentId]
  substatChoices: (typeof SUBSTAT_CHOICES_BY_AGENT)[AgentId]
  representativeSetupFor: (pool: PoolId, mindscape: number) => SetupSelection
  focusOperationProfile?: FocusOperationProfile
  operatingInterval?: OperatingIntervalPolicy
  preparedDisc?: PreparedDiscHolderPolicy
  preparedEngine?: PreparedEngineHolderPolicy
}

/** Returns the authored setup policy references for one Agent. */
export function setupPolicyFor(agentId: AgentId): SetupPolicy {
  return {
    engineIdsByPool: ENGINE_IDS_BY_AGENT_AND_POOL[agentId],
    discIdsByPiece: DISC_IDS_BY_AGENT_AND_PIECE[agentId],
    mainStatIdsBySlot: MAIN_STAT_IDS_BY_AGENT_AND_SLOT[agentId],
    substatChoices: SUBSTAT_CHOICES_BY_AGENT[agentId],
    representativeSetupFor: (pool, mindscape) => representativeSetupFor(agentId, pool, mindscape),
    focusOperationProfile: FOCUS_OPERATION_PROFILE_BY_AGENT[agentId],
    operatingInterval: OPERATING_INTERVAL_BY_AGENT[agentId],
    preparedDisc: PREPARED_DISC_HOLDER_POLICY_BY_AGENT[agentId],
    preparedEngine: PREPARED_ENGINE_HOLDER_POLICY_BY_AGENT[agentId],
  }
}

/** Applies one holder-authored complete prepared-package patch. */
export function applyPreparedDiscPatch(
  selection: SetupSelection,
  patch: PreparedDiscPatch,
): SetupSelection {
  return {
    ...selection,
    fourPieceId: patch.fourPieceId,
    ...(patch.twoPieceId ? { twoPieceId: patch.twoPieceId } : {}),
    ...(patch.mains ? { mains: { ...selection.mains, ...patch.mains } } : {}),
  }
}

/** Resolves one holder's authored operating interval in the current Focus direction. */
export function operatingIntervalFor(
  holderAgentId: AgentId,
  focusAgentId: AgentId,
): OperatingInterval | null {
  const holderPolicy = setupPolicyFor(holderAgentId).operatingInterval
  if (!holderPolicy) return null
  const focusOperation = setupPolicyFor(focusAgentId).focusOperationProfile
  return focusOperation
    ? holderPolicy.byFocusOperation?.[focusOperation] ?? holderPolicy.default
    : holderPolicy.default
}
