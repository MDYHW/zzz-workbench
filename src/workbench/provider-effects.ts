import type { WorkbenchState } from './state'
import {
  type CompleteSetup,
  type SourceBoundCurrentClause,
} from './effects'
import {
  observeYixuan,
  resolveYixuanProviderClauses,
  type YixuanCalculationContext,
} from './calculation/agents/yixuan'
import {
  observeDialyn,
  resolveDialynProviderClauses,
  type DialynCalculationContext,
} from './calculation/agents/dialyn'
import {
  observeLucia,
  resolveLuciaProviderClauses,
  type LuciaCalculationContext,
} from './calculation/agents/lucia'
import {
  observeAnby,
  resolveAnbyProviderClauses,
  type AnbyCalculationContext,
} from './calculation/agents/anby-soldier-0'
import {
  observeTrigger,
  resolveTriggerProviderClauses,
  type TriggerCalculationContext,
} from './calculation/agents/trigger'
import {
  observeAstra,
  resolveAstraProviderClauses,
  type AstraCalculationContext,
} from './calculation/agents/astra-yao'

export type ProviderContext =
  | YixuanCalculationContext
  | DialynCalculationContext
  | LuciaCalculationContext
  | AnbyCalculationContext
  | TriggerCalculationContext
  | AstraCalculationContext

export interface ProviderEffects {
  contexts: ProviderContext[]
  inboxes: [
    SourceBoundCurrentClause[],
    SourceBoundCurrentClause[],
    SourceBoundCurrentClause[],
  ]
  enemyContext: SourceBoundCurrentClause[]
}

function assertNever(value: never): never {
  throw new Error(`Unhandled Agent context: ${String(value)}`)
}

function hasProviderInputs(
  setup: WorkbenchState['slots'][number]['setup'],
): setup is CompleteSetup {
  return Boolean(
    setup.engineId
      && setup.refinement
      && setup.fourPieceId
      && setup.twoPieceId,
  )
}

function observeProviderContext(
  state: WorkbenchState,
  providerIndex: number,
): ProviderContext | null {
  const slot = state.slots[providerIndex]
  if (!hasProviderInputs(slot.setup)) return null

  const hasStunOrSupport = state.slots.some(({ agentId }) => (
    agentId !== 'anbySoldier0'
      && (agentId === 'dialyn' || agentId === 'trigger' || agentId === 'lucia' || agentId === 'astraYao')
  ))
  const hasAnby = state.slots.some(({ agentId }) => agentId === 'anbySoldier0')

  switch (slot.agentId) {
    case 'yixuan':
      return observeYixuan(slot.setup)
    case 'dialyn':
      return observeDialyn(slot.setup)
    case 'lucia':
      return observeLucia(slot.setup)
    case 'anbySoldier0':
      return observeAnby(slot.setup, hasStunOrSupport, providerIndex === state.focusSlot)
    case 'trigger':
      return observeTrigger(slot.setup, hasAnby)
    case 'astraYao':
      return observeAstra(slot.setup)
    default:
      return assertNever(slot.agentId)
  }
}

function providerClauses(context: ProviderContext): SourceBoundCurrentClause[] {
  switch (context.agentId) {
    case 'yixuan':
      return resolveYixuanProviderClauses(context.setup)
    case 'dialyn':
      return resolveDialynProviderClauses(context.setup, context.initialCrit.value)
    case 'lucia':
      return resolveLuciaProviderClauses(context.setup, context.squadSheer)
    case 'anbySoldier0':
      return resolveAnbyProviderClauses(context)
    case 'trigger':
      return resolveTriggerProviderClauses(context.setup)
    case 'astraYao':
      return resolveAstraProviderClauses(context)
    default:
      return assertNever(context)
  }
}

export function resolveProviderEffects(state: WorkbenchState): ProviderEffects {
  const contexts: ProviderContext[] = []
  const inboxes: ProviderEffects['inboxes'] = [[], [], []]
  const enemyContext: SourceBoundCurrentClause[] = []

  for (const [providerIndex] of state.slots.entries()) {
    const context = observeProviderContext(state, providerIndex)
    if (!context) throw new Error('Provider effects require complete provider-local inputs')
    contexts.push(context)
    const clauses = providerClauses(context)

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
        if (receives && (
          !clause.eligibleAgentIds
            || clause.eligibleAgentIds.includes(state.slots[recipientIndex].agentId)
        )) inboxes[recipientIndex].push(clause)
      }
    }
  }

  return { contexts, inboxes, enemyContext }
}

export function activeCandidatePressures(
  state: WorkbenchState,
): NonNullable<SourceBoundCurrentClause['candidatePressure']>[] {
  return state.slots.flatMap((_, providerIndex) => {
    const context = observeProviderContext(state, providerIndex)
    return context
      ? providerClauses(context)
        .flatMap(({ candidatePressure }) => candidatePressure ? [candidatePressure] : [])
      : []
  })
}
