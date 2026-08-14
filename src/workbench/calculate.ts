import {
  isCompleteWorkbench,
  type WorkbenchState,
} from './state'
import {
  additive,
  resolveDeliveredClauses,
  source,
  type ResultSource,
  type SourceBoundCurrentClause,
} from './effects'
import { actionTarget, canonicalAction, type CanonicalActionKind } from './actions'
import { calculateYixuan } from './calculation/agents/yixuan'
import { calculateDialyn } from './calculation/agents/dialyn'
import { calculateLucia } from './calculation/agents/lucia'
import { ANBY_AFTERSHOCK_TARGET, anbyFullyCrit, calculateAnby } from './calculation/agents/anby-soldier-0'
import { calculateTrigger } from './calculation/agents/trigger'
import { calculateAstra } from './calculation/agents/astra-yao'
import { calculateSeed } from './calculation/agents/seed'
import { calculateCissia } from './calculation/agents/cissia'
import { calculateEvelyn } from './calculation/agents/evelyn'
import { calculateCorin } from './calculation/agents/corin'
import { calculateLycaon } from './calculation/agents/lycaon'
import { calculateYidhari } from './calculation/agents/yidhari'
import { calculateManato } from './calculation/agents/manato'
import { calculateHugo } from './calculation/agents/hugo'
import { calculateJuFufu } from './calculation/agents/ju-fufu'
import { calculatePanYinhu } from './calculation/agents/pan-yinhu'
import { calculateBanyue } from './calculation/agents/banyue'
import { calculateStarlightBilly } from './calculation/agents/starlight-billy'
import { calculateEllen } from './calculation/agents/ellen'
import { calculateSoukaku } from './calculation/agents/soukaku'
import { calculateSoldier11 } from './calculation/agents/soldier11'
import { calculateLighter } from './calculation/agents/lighter'
import { calculateLucy } from './calculation/agents/lucy'
import { calculateZhuYuan } from './calculation/agents/zhu-yuan'
import { calculateNicole } from './calculation/agents/nicole'
import { calculateOrphie } from './calculation/agents/orphie'
import { calculatePulchra } from './calculation/agents/pulchra'
import { calculateHarumasa } from './calculation/agents/harumasa'
import { calculateQingyi } from './calculation/agents/qingyi'
import { composeMetricEffects, surfaces } from './calculation/composition'
import type { ActionModifier, AgentResult, Contribution, PartyResult } from './calculation/result'
import { resolveProviderEffects } from './provider-effects'
import { ADMITTED_AGENTS } from './content'

export type { ResultSource, SourceLocus, SurfaceKey } from './effects'
export type {
  ActionModifier,
  AgentResult,
  Contribution,
  GaugeResult,
  PartyResult,
  ResultMetric,
  ResultOperation,
} from './calculation/result'

function assertNever(value: never): never {
  throw new Error(`Unhandled Agent context: ${String(value)}`)
}

function orderedClauses(
  clauses: SourceBoundCurrentClause[],
): SourceBoundCurrentClause[] {
  const sourceOrder = ADMITTED_AGENTS.map(({ id }) => id)
  return [...clauses].sort((left, right) => (
    sourceOrder.indexOf(left.source.ownerAgentId)
    - sourceOrder.indexOf(right.source.ownerAgentId)
  ))
}

const SHARED_DAMAGE_ACTIONS = ['Chain Attack', 'Ultimate'] as const

function isExactCanonicalAction(
  action: SourceBoundCurrentClause['action'],
  canonical: CanonicalActionKind,
): boolean {
  return Boolean(
    action
      && action.tags.length === 0
      && action.outcomes.length === 1
      && action.outcomes[0].kind === 'canonical'
      && action.outcomes[0].action === canonical,
  )
}

function actionRowIncludes(
  row: ActionModifier,
  canonical: CanonicalActionKind,
): boolean {
  return row.metricId === 'dmgBonus' && row.outcomes.some((outcome) => (
    outcome.kind === 'canonical' && outcome.action === canonical
  ))
}

function sameSource(
  sourceValue: ResultSource,
  contribution: Contribution,
): boolean {
  return sourceValue.ownerAgentId === contribution.ownerAgentId
    && sourceValue.locus === contribution.locus
    && sourceValue.label === contribution.label
    && sourceValue.detail === contribution.detail
}

/**
 * Canonical squad action clauses are authored once at the provider. A recipient
 * reuses its closest current action row, or receives a bounded child row when
 * the current module only has a broader action family.
 */
function withSharedCanonicalDamageActions(
  result: AgentResult,
  inbox: SourceBoundCurrentClause[],
): AgentResult {
  const common = result.metrics.find(({ id }) => id === 'dmgBonus')
  if (!common) return result

  let actionModifiers = [...result.actionModifiers]
  for (const canonical of SHARED_DAMAGE_ACTIONS) {
    const clauses = inbox.filter((clause) => (
      clause.metric === 'dmgBonus' && isExactCanonicalAction(clause.action, canonical)
    ))
    if (clauses.length === 0) continue

    const exactIndex = actionModifiers.findIndex((row) => (
      row.outcomes.length === 1 && actionRowIncludes(row, canonical)
    ))
    const exact = exactIndex >= 0 ? actionModifiers[exactIndex] : undefined
    const parent = exact ?? actionModifiers.find((row) => actionRowIncludes(row, canonical))
    const missing = clauses.filter((clause) => !parent || !Object.values(parent.breakdown)
      .flat()
      .some((item) => sameSource(clause.source, item)))
    if (missing.length === 0) continue

    const effects = resolveDeliveredClauses(missing, {}).map(({ action: _action, ...effect }) => effect)
    const composed = composeMetricEffects(
      parent?.values ?? common.values,
      exact?.breakdown ?? surfaces([], [], []),
      effects,
      'dmgBonus',
    )
    if (exact) {
      actionModifiers[exactIndex] = { ...exact, ...composed }
      continue
    }

    const target = actionTarget([canonicalAction(canonical)])
    actionModifiers.push({
      id: `shared${canonical.replaceAll(' ', '')}Dmg`,
      outcomes: [...target.outcomes],
      tags: [...target.tags],
      metricId: 'dmgBonus',
      ...(parent ? { baseActionId: parent.id } : {}),
      ...composed,
    })
  }
  return { ...result, actionModifiers }
}

/**
 * Broad enemy-context modifiers are filtered by formula and Agent eligibility
 * before calculation. Project the resulting shared value for any current
 * general-damage consumer whose local module has no independent DEF row.
 */
function withSharedEnemyContextMetrics(
  result: AgentResult,
  enemy: SourceBoundCurrentClause[],
): AgentResult {
  if (result.metrics.some(({ id }) => id === 'defReduction')) return result
  const defReduction = composeMetricEffects(
    surfaces(0, 0, 0),
    surfaces([], [], []),
    resolveDeliveredClauses(enemy, {}),
    'defReduction',
  )
  return defReduction.values.fully
    ? {
        ...result,
        metrics: [
          ...result.metrics,
          { id: 'defReduction', label: 'DEF Reduction', unit: '%', decimals: 1, ...defReduction },
        ],
      }
    : result
}

export function calculateParty(state: WorkbenchState): PartyResult | null {
  if (!isCompleteWorkbench(state)) return null

  const { contexts, inboxes, enemyContext } = resolveProviderEffects(state)

  // Phase 2 has one deliberately acyclic consumer: Anby's delivered Fully CRIT DMG.
  for (const [index, context] of contexts.entries()) {
    if (context.agentId !== 'anbySoldier0') continue
    const critDmg = anbyFullyCrit(context.setup, orderedClauses(inboxes[index]), context.hasStunOrSupport)
    const derived = additive(
      'critDmg', 'fully', source('Core Passive', 'anbySoldier0', 'core', '35% of Fully Enabled CRIT DMG'),
      critDmg * .35, 'all-party', ANBY_AFTERSHOCK_TARGET, undefined, ['anbySoldier0', 'trigger'],
    )
    for (const [recipientIndex, slot] of state.slots.entries()) {
      if (derived.eligibleAgentIds!.includes(slot.agentId)) inboxes[recipientIndex].push(derived)
    }
  }

  return {
    agents: contexts.map((context, index) => {
      const enemyFor = enemyContext.filter((clause) => !clause.eligibleAgentIds || clause.eligibleAgentIds.includes(context.agentId))
      const inbox = orderedClauses(inboxes[index])
      const enemy = orderedClauses(enemyFor)
      let result: AgentResult
      switch (context.agentId) {
        case 'yixuan':
          result = calculateYixuan(context.setup, inbox, enemy)
          break
        case 'yidhari':
          result = calculateYidhari(context.setup, inbox, enemy)
          break
        case 'manato':
          result = calculateManato(context.setup, inbox, enemy)
          break
        case 'hugo':
          result = calculateHugo(context, inbox, enemy)
          break
        case 'juFufu':
          result = calculateJuFufu(context, inbox, enemy)
          break
        case 'panYinhu':
          result = calculatePanYinhu(context, inbox, enemy)
          break
        case 'banyue':
          result = calculateBanyue(context.setup, inbox, enemy)
          break
        case 'starlightBilly':
          result = calculateStarlightBilly(context.setup, inbox, enemy)
          break
        case 'dialyn':
          result = calculateDialyn(
            context.setup,
            context.initialCrit,
            inbox,
            enemy,
          )
          break
        case 'lucia':
          result = calculateLucia(
            context.setup,
            context.initialHp,
            context.squadSheer,
            inbox,
          )
          break
        case 'anbySoldier0':
          result = calculateAnby(context, inbox, enemy)
          break
        case 'trigger':
          result = calculateTrigger(context, inbox, enemy)
          break
        case 'astraYao':
          result = calculateAstra(context, inbox)
          break
        case 'seed':
          result = calculateSeed(context, inbox, enemy)
          break
        case 'cissia':
          result = calculateCissia(context, inbox, enemy)
          break
        case 'evelyn':
          result = calculateEvelyn(context, inbox, enemy)
          break
        case 'corin':
          result = calculateCorin(context, inbox, enemy)
          break
        case 'lycaon':
          result = calculateLycaon(context, inbox, enemy)
          break
        case 'ellen':
          result = calculateEllen(context, inbox, enemy)
          break
        case 'soukaku':
          result = calculateSoukaku(context, inbox)
          break
        case 'soldier11':
          result = calculateSoldier11(context, inbox, enemy)
          break
        case 'lighter':
          result = calculateLighter(context, inbox, enemy)
          break
        case 'lucy':
          result = calculateLucy(context, inbox)
          break
        case 'zhuYuan':
          result = calculateZhuYuan(context, inbox, enemy)
          break
        case 'nicole':
          result = calculateNicole(context, inbox)
          break
        case 'orphie':
          result = calculateOrphie(context, inbox, enemy)
          break
        case 'pulchra':
          result = calculatePulchra(context, inbox, enemy)
          break
        case 'harumasa':
          result = calculateHarumasa(context, inbox, enemy)
          break
        case 'qingyi':
          result = calculateQingyi(context, inbox, enemy)
          break
        default:
          return assertNever(context)
      }
      return withSharedCanonicalDamageActions(
        withSharedEnemyContextMetrics(result, enemy),
        inbox,
      )
    }),
  }
}
