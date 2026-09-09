import {
  ADMITTED_AGENTS,
  DRIVE_DISCS,
  EFFECTIVE_SUBSTAT_VALUES,
  MAIN_STATS,
  W_ENGINES,
  isFocusEligible,
  setupPolicyFor,
  type AgentId,
  type DiscId,
  type EngineId,
  type MainSlot,
  type MainStatId,
  type PoolId,
  type Refinement,
} from './content'
import { effectiveSubstatChoicesForSlot } from './candidates'
import {
  isCompleteWorkbench,
  type AgentSetupState,
  type AppliedAgentSlot,
  type AppliedSlot,
  type Mindscape,
  type WorkbenchState,
} from './state'

const SHORTCUT_VERSION = 1
const SHORTCUT_KEY = 'setup'
const MAX_SHORTCUT_HASH_LENGTH = 16_384
const MAIN_SLOTS = ['slot4', 'slot5', 'slot6'] as const
const POOLS = ['full', 'nonLimited'] as const

type ShortcutSlot = {
  agentId: AgentId
  mindscape: Mindscape
  pool: PoolId
  engineId: EngineId
  refinement: Refinement
  fourPieceId: DiscId
  twoPieceId: DiscId
  mains: Record<MainSlot, MainStatId>
  substats: Record<string, number>
}

type SetupShortcutPayload = {
  v: typeof SHORTCUT_VERSION
  focusSlot: AppliedSlot
  slots: [ShortcutSlot, ShortcutSlot, ShortcutSlot]
}

const isRecord = (value: unknown): value is Record<string, unknown> => (
  typeof value === 'object' && value !== null && !Array.isArray(value)
)

const hasExactKeys = (value: Record<string, unknown>, keys: readonly string[]): boolean => {
  const actual = Object.keys(value).sort()
  const expected = [...keys].sort()
  return actual.length === expected.length
    && actual.every((key, index) => key === expected[index])
}

const hasOwn = <Key extends PropertyKey>(value: object, key: Key): boolean => (
  Object.prototype.hasOwnProperty.call(value, key)
)

const isWholeNumberInRange = (value: unknown, minimum: number, maximum: number): value is number => (
  typeof value === 'number'
  && Number.isInteger(value)
  && value >= minimum
  && value <= maximum
)

const isAgentId = (value: unknown): value is AgentId => (
  typeof value === 'string' && ADMITTED_AGENTS.some(({ id }) => id === value)
)

const isPoolId = (value: unknown): value is PoolId => (
  typeof value === 'string' && POOLS.some((pool) => pool === value)
)

const parseMains = (value: unknown): Record<MainSlot, MainStatId> | null => {
  if (!isRecord(value) || !hasExactKeys(value, MAIN_SLOTS)) return null
  if (!MAIN_SLOTS.every((slot) => (
    typeof value[slot] === 'string' && hasOwn(MAIN_STATS, value[slot])
  ))) return null
  return value as Record<MainSlot, MainStatId>
}

const parseSubstats = (value: unknown): Record<string, number> | null => {
  if (!isRecord(value)) return null
  for (const [id, count] of Object.entries(value)) {
    if (!hasOwn(EFFECTIVE_SUBSTAT_VALUES, id) || !isWholeNumberInRange(count, 0, 36)) {
      return null
    }
  }
  return value as Record<string, number>
}

const parseSlot = (value: unknown): ShortcutSlot | null => {
  if (!isRecord(value) || !hasExactKeys(value, [
    'agentId',
    'mindscape',
    'pool',
    'engineId',
    'refinement',
    'fourPieceId',
    'twoPieceId',
    'mains',
    'substats',
  ])) return null

  const mains = parseMains(value.mains)
  const substats = parseSubstats(value.substats)
  if (
    !isAgentId(value.agentId)
    || !isWholeNumberInRange(value.mindscape, 0, 6)
    || !isPoolId(value.pool)
    || typeof value.engineId !== 'string'
    || !hasOwn(W_ENGINES, value.engineId)
    || !isWholeNumberInRange(value.refinement, 1, 5)
    || typeof value.fourPieceId !== 'string'
    || !hasOwn(DRIVE_DISCS, value.fourPieceId)
    || typeof value.twoPieceId !== 'string'
    || !hasOwn(DRIVE_DISCS, value.twoPieceId)
    || mains === null
    || substats === null
  ) return null

  return {
    agentId: value.agentId,
    mindscape: value.mindscape as Mindscape,
    pool: value.pool,
    engineId: value.engineId as EngineId,
    refinement: value.refinement as Refinement,
    fourPieceId: value.fourPieceId as DiscId,
    twoPieceId: value.twoPieceId as DiscId,
    mains,
    substats,
  }
}

const encodeBase64Url = (value: string): string => {
  const bytes = new TextEncoder().encode(value)
  let binary = ''
  for (const byte of bytes) binary += String.fromCharCode(byte)
  return btoa(binary)
    .replaceAll('+', '-')
    .replaceAll('/', '_')
    .replace(/=+$/u, '')
}

const decodeBase64Url = (value: string): string => {
  if (!/^[A-Za-z0-9_-]+$/u.test(value)) throw new Error('Invalid shortcut encoding')
  const base64 = value.replaceAll('-', '+').replaceAll('_', '/')
  const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, '=')
  const binary = atob(padded)
  const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0))
  return new TextDecoder().decode(bytes)
}

function payloadFromState(state: WorkbenchState): SetupShortcutPayload {
  return {
    v: SHORTCUT_VERSION,
    focusSlot: state.focusSlot,
    slots: state.slots.map(({ agentId, setup }) => ({
      agentId,
      mindscape: setup.mindscape,
      pool: setup.pool,
      engineId: setup.engineId!,
      refinement: setup.refinement!,
      fourPieceId: setup.fourPieceId!,
      twoPieceId: setup.twoPieceId!,
      mains: setup.mains as Record<MainSlot, MainStatId>,
      substats: Object.fromEntries(Object.entries(setup.substats).sort(([left], [right]) => (
        left.localeCompare(right)
      ))),
    })) as SetupShortcutPayload['slots'],
  }
}

export function createSetupShortcutUrl(state: WorkbenchState, currentHref: string): string {
  const payload = payloadFromState(state)
  if (stateFromPayload(payload) === null) throw new Error('A valid complete Setup is required')
  const url = new URL(currentHref)
  url.search = ''
  url.hash = `${SHORTCUT_KEY}=${encodeBase64Url(JSON.stringify(payload))}`
  return url.href
}

function stateFromPayload(value: unknown): WorkbenchState | null {
  if (!isRecord(value) || !hasExactKeys(value, ['v', 'focusSlot', 'slots'])) return null
  if (value.v !== SHORTCUT_VERSION || !isWholeNumberInRange(value.focusSlot, 0, 2)) return null
  if (!Array.isArray(value.slots) || value.slots.length !== 3) return null

  const parsed = value.slots.map(parseSlot)
  if (parsed.some((slot) => slot === null)) return null
  const slots = parsed as [ShortcutSlot, ShortcutSlot, ShortcutSlot]
  if (new Set(slots.map(({ agentId }) => agentId)).size !== 3) return null
  if (!isFocusEligible(slots[value.focusSlot].agentId)) return null
  if (slots.some(({ agentId, pool, engineId }) => (
    !setupPolicyFor(agentId).engineIdsByPool[pool].includes(engineId)
  ))) return null

  const state: WorkbenchState = {
    focusSlot: value.focusSlot as AppliedSlot,
    slots: slots.map(({ agentId, substats, ...setup }) => ({
      agentId,
      setup: { ...setup, substats } as AgentSetupState,
    })) as [AppliedAgentSlot, AppliedAgentSlot, AppliedAgentSlot],
  }
  if (!isCompleteWorkbench(state)) return null

  const hasExactSubstats = state.slots.every(({ setup }, slotIndex) => {
    const expected = effectiveSubstatChoicesForSlot(state, slotIndex as AppliedSlot)
      .map(({ id }) => id)
      .sort()
    const actual = Object.keys(setup.substats).sort()
    return actual.length === expected.length
      && actual.every((id, index) => id === expected[index])
  })
  return hasExactSubstats ? state : null
}

export function readSetupShortcut(hash: string): WorkbenchState | null {
  if (hash.length > MAX_SHORTCUT_HASH_LENGTH) return null
  try {
    const raw = hash.startsWith('#') ? hash.slice(1) : hash
    const parameters = new URLSearchParams(raw)
    const entries = [...parameters.entries()]
    if (entries.length !== 1 || entries[0][0] !== SHORTCUT_KEY || !entries[0][1]) return null
    return stateFromPayload(JSON.parse(decodeBase64Url(entries[0][1])))
  } catch {
    return null
  }
}
