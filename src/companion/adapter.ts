import {
  ADMITTED_AGENTS,
  DRIVE_DISCS,
  EFFECTIVE_SUBSTAT_VALUES,
  MAIN_STATS,
  SAME_EFFECT_TWO_PIECE_RELATIONSHIPS,
  W_ENGINES,
  setupPolicyFor,
  type AgentId,
  type DiscId,
  type EngineId,
  type MainSlot,
  type MainStatId,
  type Refinement,
  type SubstatId,
} from '../workbench/content'
import {
  effectiveFourPieceIds,
  effectiveMainStatIds,
  effectiveSubstatChoicesForSlot,
  effectiveTwoPieceIds,
  invalidRequiredSelections,
} from '../workbench/candidates'
import { createSetupShortcutUrl, readSetupShortcut } from '../workbench/setup-shortcut'
import type {
  AgentSetupState,
  AppliedAgentSlot,
  AppliedSlot,
  Mindscape,
  WorkbenchState,
} from '../workbench/state'
import { koAgentNames, koDiscNames, koEngineNames } from 'source-names'

const SITE = 'https://zzz-setup-workbench.github.io/'
const COLLECTION_FORMAT = 'zzz-party-gear-display-v1'
const MAIN_SLOTS = ['slot4', 'slot5', 'slot6'] as const

const normalize = (name: string): string => name
  .normalize('NFKC')
  .replace(/[「」『』]/g, '')
  .replace(/\s+/g, ' ')
  .trim()

export interface SupportedAgentTarget {
  workbenchId: AgentId
  names: string[]
  focusEligible: boolean
}

export interface PartySelection {
  targets: [SupportedAgentTarget, SupportedAgentTarget, SupportedAgentTarget]
  focusAgentId: AgentId
}

export interface VisibleStat {
  label: string
  value: string
}

export interface CollectedDisc {
  slot: number
  name: string
  rarity: string
  level: number
  main: VisibleStat
  substats: VisibleStat[]
}

export interface CollectedMember {
  agent: {
    id: number
    workbenchId?: string
    name: string
    level: number
    mindscape: number
  }
  weapon: {
    name: string
    rarity: string
    level: number
    refinement: number
  }
  discs: CollectedDisc[]
}

export interface GearCollection {
  format: typeof COLLECTION_FORMAT
  members: CollectedMember[]
}

export type ConversionEdit = Partial<{
  engineId: EngineId
  fourPieceId: DiscId
  twoPieceId: DiscId
  slot4: MainStatId
  slot5: MainStatId
  slot6: MainStatId
}>

export type ConversionEdits = Partial<Record<AgentId, ConversionEdit>>

export interface ConversionIssue {
  agentId: AgentId
  key: keyof ConversionEdit
  label: string
  options: Array<{ id: string; label: string }>
}

export interface ConversionResult {
  url: string | null
  errors: string[]
  notices: string[]
  summaries: string[]
  issues: ConversionIssue[]
}

export const supportedAgents: SupportedAgentTarget[] = ADMITTED_AGENTS.map((agent) => ({
  workbenchId: agent.id,
  names: [...new Set(
    [koAgentNames[agent.id], agent.name, agent.displayName]
      .filter((name): name is string => Boolean(name))
      .map(normalize),
  )],
  focusEligible: agent.focusEligible,
}))

function errorMessage(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isVisibleStat(value: unknown): value is VisibleStat {
  return isRecord(value) && typeof value.label === 'string' && typeof value.value === 'string'
}

function isCollectedDisc(value: unknown): value is CollectedDisc {
  return isRecord(value)
    && typeof value.slot === 'number'
    && typeof value.name === 'string'
    && typeof value.rarity === 'string'
    && typeof value.level === 'number'
    && isVisibleStat(value.main)
    && Array.isArray(value.substats)
    && value.substats.every(isVisibleStat)
}

function isCollectedMember(value: unknown): value is CollectedMember {
  if (!isRecord(value) || !isRecord(value.agent) || !isRecord(value.weapon)) return false
  return typeof value.agent.id === 'number'
    && (value.agent.workbenchId === undefined || typeof value.agent.workbenchId === 'string')
    && typeof value.agent.name === 'string'
    && typeof value.agent.level === 'number'
    && typeof value.agent.mindscape === 'number'
    && typeof value.weapon.name === 'string'
    && typeof value.weapon.rarity === 'string'
    && typeof value.weapon.level === 'number'
    && typeof value.weapon.refinement === 'number'
    && Array.isArray(value.discs)
    && value.discs.every(isCollectedDisc)
}

function isGearCollection(value: unknown): value is GearCollection {
  return isRecord(value)
    && value.format === COLLECTION_FORMAT
    && Array.isArray(value.members)
    && value.members.length === 3
    && value.members.every(isCollectedMember)
}

function isPartySelection(value: unknown): value is PartySelection {
  if (!isRecord(value) || !Array.isArray(value.targets) || value.targets.length !== 3) return false
  if (typeof value.focusAgentId !== 'string') return false
  const targets = value.targets
  if (!targets.every((target): target is SupportedAgentTarget => (
    isRecord(target)
      && typeof target.workbenchId === 'string'
      && Array.isArray(target.names)
      && target.names.length > 0
      && target.names.every((name) => typeof name === 'string' && name.length > 0)
      && typeof target.focusEligible === 'boolean'
  ))) return false
  if (new Set(targets.map(({ workbenchId }) => workbenchId)).size !== 3) return false
  const focus = targets.find(({ workbenchId }) => workbenchId === value.focusAgentId)
  return Boolean(focus?.focusEligible)
}

export function readParty(input: unknown): PartySelection {
  try {
    if (typeof input !== 'string' || input.length > 17_000) throw new Error()
    const url = new URL(input.trim())
    const site = new URL(SITE)
    if (url.origin !== site.origin
      || url.pathname !== '/'
      || url.search
      || url.username
      || url.password) throw new Error()
    const state = readSetupShortcut(url.hash)
    if (!state) throw new Error()
    const targets = state.slots.map((slot) => (
      supportedAgents.find(({ workbenchId }) => workbenchId === slot.agentId)
    ))
    if (targets.some((target) => target === undefined)) throw new Error()
    return {
      targets: targets as PartySelection['targets'],
      focusAgentId: state.slots[state.focusSlot].agentId,
    }
  } catch {
    throw new Error('사이트에서 파티와 주력을 적용한 뒤 Copy Setting URL을 붙여넣어 주세요.')
  }
}

function visibleNumber(value: unknown): number {
  if (typeof value !== 'string' || !/^\d+(?:\.\d+)?%?$/.test(value)) {
    throw new Error('옵션 수치 형식이 올바르지 않습니다.')
  }
  return Number(value.replace('%', ''))
}

const STAT_NAMES: Record<string, readonly string[]> = {
  critRate: ['치명타 확률', 'CRIT Rate'],
  critDmg: ['치명타 피해', 'CRIT DMG'],
  hp: ['HP'],
  atk: ['공격력', 'ATK'],
  def: ['방어력', 'DEF'],
  anomalyProficiency: ['이상 마스터리', 'Anomaly Proficiency'],
  anomalyMastery: ['이상 장악력', 'Anomaly Mastery'],
  impact: ['충격력', 'Impact'],
  energyRegenPct: ['에너지 자동 회복', 'Energy Regen'],
  penRatio: ['관통률', 'PEN Ratio'],
  penFlat: ['관통 수치', 'PEN'],
  etherDmg: ['에테르 피해 보너스', 'Ether DMG Bonus'],
  fireDmg: ['불 속성 피해 보너스', 'Fire DMG Bonus'],
  iceDmg: ['얼음 속성 피해 보너스', 'Ice DMG Bonus'],
  electricDmg: ['전기 속성 피해 보너스', 'Electric DMG Bonus'],
  physicalDmg: ['물리 피해 보너스', '물리 속성 피해 보너스', 'Physical DMG Bonus'],
  windDmg: ['바람 속성 피해 보너스', '바람 피해 보너스', 'Wind DMG Bonus'],
}

const FALLBACK_STAT_NAMES: Record<string, string> = {
  atkFlat: '고정 공격력',
  hpFlat: '고정 HP',
  hpPct: 'HP',
  atkPct: '공격력',
  defFlat: '고정 방어력',
  defPct: '방어력',
}

function visibleStatId(stat: VisibleStat): string {
  visibleNumber(stat.value)
  const id = Object.keys(STAT_NAMES)
    .find((candidate) => STAT_NAMES[candidate].includes(normalize(stat.label)))
  if (!id) throw new Error(`알 수 없는 옵션: ${stat.label.slice(0, 80)}`)
  const percentage = stat.value.endsWith('%')
  if (!['hp', 'atk', 'def'].includes(id)
    && percentage === ['anomalyProficiency', 'penFlat'].includes(id)) {
    throw new Error(`옵션 단위가 올바르지 않습니다: ${stat.label}`)
  }
  return ['hp', 'atk', 'def'].includes(id) ? `${id}${percentage ? 'Pct' : 'Flat'}` : id
}

function hasOwn<Key extends PropertyKey>(value: object, key: Key): boolean {
  return Object.prototype.hasOwnProperty.call(value, key)
}

function lookupId<Id extends string>(
  name: unknown,
  table: Record<Id, { name: string }>,
  korean: Record<Id, string>,
  kind: string,
): Id {
  if (typeof name !== 'string' || name.length > 160) {
    throw new Error(`${kind} 이름을 확인할 수 없습니다.`)
  }
  const matches = (Object.keys(table) as Id[]).filter((id) => (
    [table[id].name, korean[id]].some((candidate) => (
      candidate && normalize(candidate) === normalize(name)
    ))
  ))
  if (matches.length !== 1) throw new Error(`지원하지 않는 ${kind}: ${name}`)
  return matches[0]
}

function integer<T extends number>(
  value: unknown,
  minimum: number,
  maximum: number,
  label: string,
): T {
  if (!Number.isInteger(value) || (value as number) < minimum || (value as number) > maximum) {
    throw new Error(`${label} 범위를 확인할 수 없습니다.`)
  }
  return value as T
}

function completeMains(value: Partial<Record<MainSlot, MainStatId>>): value is Record<MainSlot, MainStatId> {
  return MAIN_SLOTS.every((slot) => value[slot] !== undefined)
}

function statDisplayName(id: string): string {
  return STAT_NAMES[id]?.[0] ?? FALLBACK_STAT_NAMES[id] ?? id
}

export function convertGear(
  partyValue: unknown,
  dataValue: unknown,
  edits: ConversionEdits = {},
): ConversionResult {
  const errors: string[] = []
  const notices: string[] = []
  const summaries: string[] = []
  const issues: ConversionIssue[] = []
  const fail = (message: string): ConversionResult => ({
    url: null,
    errors: [message],
    notices,
    summaries,
    issues,
  })

  if (!isPartySelection(partyValue)) return fail('파티 또는 주력이 올바르지 않습니다.')
  if (!isGearCollection(dataValue)) return fail('파티 장비 데이터가 완전하지 않습니다.')
  const party = partyValue
  const data = dataValue
  const used = new Set<CollectedMember>()
  const totals: Array<Record<string, number>> = []

  const convertedSlots = party.targets.map((target) => {
    const name = target.names[0]
    try {
      const matches = data.members.filter((member) => (
        member.agent.workbenchId === target.workbenchId
          || (!member.agent.workbenchId && target.names.includes(normalize(member.agent.name)))
      ))
      if (matches.length !== 1 || used.has(matches[0])) {
        throw new Error('수집한 에이전트가 파티와 일치하지 않습니다.')
      }
      const member = matches[0]
      used.add(member)
      if (!target.names.includes(normalize(member.agent.name))) {
        throw new Error('수집한 이름과 대상 ID가 일치하지 않습니다.')
      }
      integer(member.agent.id, 1, 999_999, '에이전트 ID')
      integer(member.agent.level, 1, 60, '에이전트 레벨')
      const mindscape = integer<Mindscape>(member.agent.mindscape, 0, 6, '돌파')

      const edit = edits[target.workbenchId] ?? {}
      const readEngineId = edit.engineId
        ? null
        : lookupId(member.weapon.name, W_ENGINES, koEngineNames, 'W-엔진')
      const engineId = edit.engineId ?? readEngineId!
      if (!edit.engineId && W_ENGINES[engineId].rank !== member.weapon.rarity) {
        throw new Error('엔진 등급이 일치하지 않습니다.')
      }
      const refinement = integer<Refinement>(member.weapon.refinement, 1, 5, '재련')
      integer(member.weapon.level, 1, 60, '엔진 레벨')
      const engineCandidates = setupPolicyFor(target.workbenchId).engineIdsByPool.full
      if (!engineCandidates.includes(engineId)) {
        issues.push({
          agentId: target.workbenchId,
          key: 'engineId',
          label: `${name} W-엔진`,
          options: engineCandidates.map((id) => ({ id, label: koEngineNames[id] })),
        })
        throw new Error(`${member.weapon.name}: 이 에이전트의 전체 후보에 없는 엔진입니다.`)
      }

      if (member.discs.length !== 6 || new Set(member.discs.map(({ slot }) => slot)).size !== 6) {
        throw new Error('디스크 1~6번이 모두 필요합니다.')
      }
      const setCounts: Partial<Record<DiscId, number>> = {}
      const mains: Partial<Record<MainSlot, MainStatId>> = {}
      const sum: Record<string, number> = {}
      for (const disc of member.discs) {
        integer(disc.slot, 1, 6, '디스크 슬롯')
        integer(disc.level, 0, 15, '디스크 레벨')
        if (disc.rarity !== 'S') throw new Error('S급 이외의 디스크는 아직 변환하지 않습니다.')
        const discId = lookupId(disc.name, DRIVE_DISCS, koDiscNames, '디스크')
        setCounts[discId] = (setCounts[discId] ?? 0) + 1
        const mainId = visibleStatId(disc.main)
        if (disc.slot < 4) {
          if (mainId !== ['hpFlat', 'atkFlat', 'defFlat'][disc.slot - 1]) {
            throw new Error('고정 주옵션이 슬롯과 맞지 않습니다.')
          }
        } else {
          if (!hasOwn(MAIN_STATS, mainId)) throw new Error('지원하지 않는 주옵션입니다.')
          mains[`slot${disc.slot}` as MainSlot] = mainId as MainStatId
        }
        if (disc.substats.length > 4) throw new Error('부옵션 구성이 올바르지 않습니다.')
        const distinct = new Set<string>()
        for (const stat of disc.substats) {
          const statId = visibleStatId(stat)
          if (distinct.has(statId) || statId === mainId) {
            throw new Error('부옵션이 중복되거나 주옵션과 같습니다.')
          }
          distinct.add(statId)
          sum[statId] = (sum[statId] ?? 0) + visibleNumber(stat.value)
        }
      }
      if (!completeMains(mains)) throw new Error('디스크 4~6번 주옵션이 모두 필요합니다.')

      const fourPieceIds = (Object.keys(setCounts) as DiscId[])
        .filter((id) => setCounts[id] === 4)
      const twoPieceIds = (Object.keys(setCounts) as DiscId[])
        .filter((id) => setCounts[id] === 2)
      if (fourPieceIds.length !== 1 || twoPieceIds.length !== 1) {
        throw new Error('현재 사이트의 4세트+2세트 구성으로 변환할 수 없습니다.')
      }
      let fourPieceId = fourPieceIds[0]
      let twoPieceId = twoPieceIds[0]

      for (const [key, value] of Object.entries(edit) as Array<[
        keyof ConversionEdit,
        NonNullable<ConversionEdit[keyof ConversionEdit]>,
      ]>) {
        if (key === 'engineId') {
          notices.push(`${name}: 읽은 엔진 ${member.weapon.name} 대신 ${koEngineNames[value as EngineId]}로 비교합니다. 재련 수치는 유지합니다.`)
        } else if (key === 'fourPieceId' || key === 'twoPieceId') {
          if (!hasOwn(DRIVE_DISCS, value)) throw new Error('알 수 없는 대체 디스크입니다.')
          const replacement = value as DiscId
          const original = key === 'fourPieceId' ? fourPieceId : twoPieceId
          notices.push(`${name}: ${koDiscNames[original]} ${key === 'fourPieceId' ? '4' : '2'}세트 → ${koDiscNames[replacement]}. 읽은 주옵션·부옵션은 유지합니다.`)
          if (key === 'fourPieceId') fourPieceId = replacement
          else twoPieceId = replacement
        } else if (MAIN_SLOTS.includes(key as MainSlot)) {
          if (!hasOwn(MAIN_STATS, value)) throw new Error('알 수 없는 대체 주옵션입니다.')
          notices.push(`${name}: ${key} 주옵션을 ${MAIN_STATS[value as MainStatId].label}로 바꿔 비교합니다.`)
          mains[key as MainSlot] = value as MainStatId
        } else {
          throw new Error('알 수 없는 변경 항목입니다.')
        }
      }

      if (member.agent.level < 60
        || member.weapon.level < 60
        || member.discs.some(({ level }) => level < 15)) {
        notices.push(`${name}: 에이전트·엔진 60, S급 디스크 15 기준으로 변환합니다. 추가 부옵션 강화는 예측하지 않습니다.`)
      }
      totals.push(sum)
      summaries.push(`${name} M${mindscape} · ${member.weapon.name} W${refinement} · ${koDiscNames[fourPieceId]} 4 + ${koDiscNames[twoPieceId]} 2`)
      const setup: AgentSetupState = {
        mindscape,
        pool: 'full',
        engineId,
        refinement,
        fourPieceId,
        twoPieceId,
        mains,
        substats: {},
      }
      return { agentId: target.workbenchId, setup }
    } catch (error) {
      errors.push(`${name}: ${errorMessage(error, '장비를 변환하지 못했습니다.')}`)
      totals.push({})
      return null
    }
  })

  if (errors.length || convertedSlots.some((slot) => slot === null)) {
    return { url: null, errors, notices, summaries, issues }
  }
  const slots = convertedSlots as [AppliedAgentSlot, AppliedAgentSlot, AppliedAgentSlot]
  const focusIndex = slots.findIndex(({ agentId }) => agentId === party.focusAgentId)
  if (focusIndex < 0) return fail('파티 또는 주력이 올바르지 않습니다.')
  const state: WorkbenchState = { focusSlot: focusIndex as AppliedSlot, slots }

  try {
    // Populate all visible supplies before asking shared contextual candidate consumers.
    slots.forEach((slot, index) => {
      for (const [id, value] of Object.entries(totals[index])) {
        if (!hasOwn(EFFECTIVE_SUBSTAT_VALUES, id)) continue
        const substatId = id as SubstatId
        const count = value / EFFECTIVE_SUBSTAT_VALUES[substatId].perHit
        if (Math.abs(count - Math.round(count)) > 0.001 || count > 36) {
          throw new Error(`${party.targets[index].names[0]}: ${id}를 정수 부옵션 횟수로 환산할 수 없습니다.`)
        }
        slot.setup.substats[substatId] = Math.round(count)
      }
    })

    slots.forEach((slot, index) => {
      const original = slot.setup.twoPieceId!
      const candidates = effectiveTwoPieceIds(state, index as AppliedSlot)
        .filter((id) => id !== slot.setup.fourPieceId)
      if (candidates.includes(original)) return
      const replacements = [...new Set(
        SAME_EFFECT_TWO_PIECE_RELATIONSHIPS
          .filter(({ members }) => members.some((member) => member === original))
          .flatMap(({ members }) => members)
          .filter((id) => id !== original && candidates.includes(id)),
      )]
      if (replacements.length !== 1) return
      slot.setup.twoPieceId = replacements[0]
      notices.push(`${party.targets[index].names[0]}: ${koDiscNames[original]} 2 → ${koDiscNames[replacements[0]]} 2 · 동일 효과로 반영. 4세트·주옵션·부옵션은 유지합니다.`)
    })

    const allowedSubstats = slots.map((_, index) => (
      effectiveSubstatChoicesForSlot(state, index as AppliedSlot).map(({ id }) => id)
    ))
    slots.forEach((slot, index) => {
      const excluded = Object.keys(totals[index]).filter((id) => !allowedSubstats[index].includes(id as SubstatId))
      if (excluded.length) {
        notices.push(`${party.targets[index].names[0]} 제외: ${excluded.map((id) => {
          const unit = hasOwn(EFFECTIVE_SUBSTAT_VALUES, id)
            ? EFFECTIVE_SUBSTAT_VALUES[id as SubstatId].unit
            : id.endsWith('Pct') ? '%' : ''
          return `${statDisplayName(id)} ${Number(totals[index][id].toFixed(3))}${unit}`
        }).join(', ')}`)
      }
      slot.setup.substats = Object.fromEntries(
        allowedSubstats[index].map((id) => [id, slot.setup.substats[id] ?? 0]),
      )
    })

    for (const invalid of invalidRequiredSelections(state)) {
      const label = `${koAgentNames[invalid.agentId]} ${invalid.kind === 'disc'
        ? invalid.piece === 'fourPiece' ? '4세트' : '2세트'
        : invalid.kind === 'mainStat' ? invalid.mainSlot : '부옵션'}`
      errors.push(`${label}: 읽은 항목은 현재 후보에 없습니다.`)
      if (invalid.kind === 'disc') {
        const otherPieceId = state.slots[invalid.slot].setup[
          invalid.piece === 'fourPiece' ? 'twoPieceId' : 'fourPieceId'
        ]
        const candidates = invalid.piece === 'fourPiece'
          ? effectiveFourPieceIds(state, invalid.slot)
          : effectiveTwoPieceIds(state, invalid.slot)
        issues.push({
          agentId: invalid.agentId,
          key: `${invalid.piece}Id`,
          label,
          options: candidates
            .filter((id) => id !== otherPieceId)
            .map((id) => ({ id, label: koDiscNames[id] })),
        })
      } else if (invalid.kind === 'mainStat') {
        issues.push({
          agentId: invalid.agentId,
          key: invalid.mainSlot,
          label,
          options: effectiveMainStatIds(state, invalid.slot, invalid.mainSlot)
            .map((id) => ({ id, label: MAIN_STATS[id].label })),
        })
      }
    }
    if (errors.length) return { url: null, errors, notices, summaries, issues }

    const url = createSetupShortcutUrl(state, SITE)
    if (!readSetupShortcut(new URL(url).hash)) {
      throw new Error('생성한 URL을 사이트 규칙으로 복원하지 못했습니다.')
    }
    notices.unshift('코어 등 육성은 사이트의 완료 기준을 사용합니다. 반영하지 않는 부옵션 때문에 게임 표시값과 다를 수 있습니다.')
    return { url, errors, notices, summaries, issues }
  } catch (error) {
    return {
      url: null,
      errors: [errorMessage(error, '장비를 변환하지 못했습니다.')],
      notices,
      summaries,
      issues,
    }
  }
}

// The companion shares the current shortcut parser and serializer with the site.
export { createSetupShortcutUrl, readSetupShortcut }
