import {
  isCompleteWorkbench,
  type WorkbenchState,
} from './state'
import {
  completeSetup,
  type SourceBoundCurrentClause,
} from './effects'
import {
  calculateYixuan,
  observeYixuan,
  resolveYixuanProviderClauses,
  type YixuanCalculationContext,
} from './calculation/agents/yixuan'
import {
  calculateDialyn,
  observeDialyn,
  resolveDialynProviderClauses,
  type DialynCalculationContext,
} from './calculation/agents/dialyn'
import {
  calculateLucia,
  observeLucia,
  resolveLuciaProviderClauses,
  type LuciaCalculationContext,
} from './calculation/agents/lucia'
import { anbyFullyCrit, calculateAnby, observeAnby, resolveAnbyProviderClauses, type AnbyCalculationContext } from './calculation/agents/anby-soldier-0'
import { calculateTrigger, observeTrigger, resolveTriggerProviderClauses, type TriggerCalculationContext } from './calculation/agents/trigger'
import { calculateAstra, observeAstra, resolveAstraProviderClauses, type AstraCalculationContext } from './calculation/agents/astra-yao'
import { additive, source } from './effects'
import type { PartyResult } from './calculation/result'

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

type ProviderContext =
  | YixuanCalculationContext
  | DialynCalculationContext
  | LuciaCalculationContext
  | AnbyCalculationContext
  | TriggerCalculationContext
  | AstraCalculationContext

function assertNever(value: never): never {
  throw new Error(`Unhandled Agent context: ${String(value)}`)
}

function orderedClauses(
  clauses: SourceBoundCurrentClause[],
): SourceBoundCurrentClause[] {
  const sourceOrder = [
    'yixuan',
    'dialyn',
    'lucia',
    'anbySoldier0',
    'trigger',
    'astraYao',
  ] as const
  return [...clauses].sort((left, right) => (
    sourceOrder.indexOf(left.source.ownerAgentId)
    - sourceOrder.indexOf(right.source.ownerAgentId)
  ))
}

export function calculateParty(state: WorkbenchState): PartyResult | null {
  if (!isCompleteWorkbench(state)) return null

  const contexts: ProviderContext[] = []
  const inboxes: [
    SourceBoundCurrentClause[],
    SourceBoundCurrentClause[],
    SourceBoundCurrentClause[],
  ] = [[], [], []]
  const enemyContext: SourceBoundCurrentClause[] = []
  const hasStunOrSupport = state.slots.some(({ agentId }) => agentId !== 'anbySoldier0' && (agentId === 'dialyn' || agentId === 'trigger' || agentId === 'lucia' || agentId === 'astraYao'))
  const hasAnby = state.slots.some(({ agentId }) => agentId === 'anbySoldier0')

  for (const [providerIndex, slot] of state.slots.entries()) {
    const setup = completeSetup(slot)
    let context: ProviderContext
    switch (slot.agentId) {
      case 'yixuan':
        context = observeYixuan(setup)
        break
      case 'dialyn':
        context = observeDialyn(setup)
        break
      case 'lucia':
        context = observeLucia(setup)
        break
      case 'anbySoldier0':
        context = observeAnby(setup, hasStunOrSupport, providerIndex === state.focusSlot)
        break
      case 'trigger':
        context = observeTrigger(setup, hasAnby)
        break
      case 'astraYao':
        context = observeAstra(setup)
        break
      default:
        assertNever(slot.agentId)
    }
    contexts.push(context)

    let clauses: SourceBoundCurrentClause[]
    switch (context.agentId) {
      case 'yixuan':
        clauses = resolveYixuanProviderClauses(context.setup)
        break
      case 'dialyn':
        clauses = resolveDialynProviderClauses(
          context.setup,
          context.initialCrit.value,
        )
        break
      case 'lucia':
        clauses = resolveLuciaProviderClauses(
          context.setup,
          context.squadSheer,
        )
        break
      case 'anbySoldier0':
        clauses = resolveAnbyProviderClauses(context)
        break
      case 'trigger':
        clauses = resolveTriggerProviderClauses(context.setup)
        break
      case 'astraYao':
        clauses = resolveAstraProviderClauses(context)
        break
      default:
        assertNever(context)
    }

    for (const clause of clauses) {
      if (clause.recipient === 'enemy-context') {
        enemyContext.push(clause)
        continue
      }
      for (const [recipientIndex] of state.slots.entries()) {
        const receives = clause.recipient === 'all-party'
          || (clause.recipient === 'self' && recipientIndex === providerIndex)
          || (clause.recipient === 'focus' && recipientIndex === state.focusSlot)
          || (clause.recipient === 'other-party' && recipientIndex !== providerIndex)
        if (receives && (!clause.eligibleAgentIds || clause.eligibleAgentIds.includes(state.slots[recipientIndex].agentId))) inboxes[recipientIndex].push(clause)
      }
    }
  }

  // Phase 2 has one deliberately acyclic consumer: Anby's delivered Fully CRIT DMG.
  for (const [index, context] of contexts.entries()) {
    if (context.agentId !== 'anbySoldier0') continue
    const critDmg = anbyFullyCrit(context.setup, orderedClauses(inboxes[index]), context.hasStunOrSupport)
    const derived = additive(
      'critDmg', 'fully', source('Core Passive', 'anbySoldier0', 'core', '35% of Fully Enabled CRIT DMG'),
      critDmg * .35, 'all-party', 'anbyAftershock', undefined, ['anbySoldier0', 'trigger'],
    )
    for (const [recipientIndex, slot] of state.slots.entries()) {
      if (derived.eligibleAgentIds!.includes(slot.agentId)) inboxes[recipientIndex].push(derived)
    }
  }

  return {
    agents: contexts.map((context, index) => {
      const enemyFor = enemyContext.filter((clause) => !clause.eligibleAgentIds || clause.eligibleAgentIds.includes(context.agentId))
      switch (context.agentId) {
        case 'yixuan':
          return calculateYixuan(context.setup, orderedClauses(inboxes[index]), orderedClauses(enemyFor))
        case 'dialyn':
          return calculateDialyn(
            context.setup,
            context.initialCrit,
            orderedClauses(inboxes[index]),
            orderedClauses(enemyFor),
          )
        case 'lucia':
          return calculateLucia(
            context.setup,
            context.initialHp,
            context.squadSheer,
            orderedClauses(inboxes[index]),
          )
        case 'anbySoldier0':
          return calculateAnby(context, orderedClauses(inboxes[index]), orderedClauses(enemyFor))
        case 'trigger':
          return calculateTrigger(context, orderedClauses(inboxes[index]), orderedClauses(enemyFor))
        case 'astraYao':
          return calculateAstra(context, orderedClauses(inboxes[index]))
        default:
          return assertNever(context)
      }
    }),
  }
}
