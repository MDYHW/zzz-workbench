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

function assertNever(value: never): never {
  throw new Error(`Unhandled Agent context: ${String(value)}`)
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
        if (receives) inboxes[recipientIndex].push(clause)
      }
    }
  }

  return {
    agents: contexts.map((context, index) => {
      switch (context.agentId) {
        case 'yixuan':
          return calculateYixuan(context.setup, inboxes[index], enemyContext)
        case 'dialyn':
          return calculateDialyn(
            context.setup,
            context.initialCrit,
            inboxes[index],
            enemyContext,
          )
        case 'lucia':
          return calculateLucia(
            context.setup,
            context.initialHp,
            context.squadSheer,
            inboxes[index],
          )
        default:
          return assertNever(context)
      }
    }),
  }
}
