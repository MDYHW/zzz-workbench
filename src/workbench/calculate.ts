import {
  isCompleteWorkbench,
  type WorkbenchState,
} from './state'
import { additive, source, type SourceBoundCurrentClause } from './effects'
import { calculateYixuan } from './calculation/agents/yixuan'
import { calculateDialyn } from './calculation/agents/dialyn'
import { calculateLucia } from './calculation/agents/lucia'
import { ANBY_AFTERSHOCK_TARGET, anbyFullyCrit, calculateAnby } from './calculation/agents/anby-soldier-0'
import { calculateTrigger } from './calculation/agents/trigger'
import { calculateAstra } from './calculation/agents/astra-yao'
import { calculateSeed } from './calculation/agents/seed'
import { calculateCissia } from './calculation/agents/cissia'
import { calculateEvelyn } from './calculation/agents/evelyn'
import type { PartyResult } from './calculation/result'
import { resolveProviderEffects } from './provider-effects'

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
  const sourceOrder = [
    'yixuan',
    'dialyn',
    'lucia',
    'anbySoldier0',
    'trigger',
    'astraYao',
    'seed',
    'cissia',
    'evelyn',
  ] as const
  return [...clauses].sort((left, right) => (
    sourceOrder.indexOf(left.source.ownerAgentId)
    - sourceOrder.indexOf(right.source.ownerAgentId)
  ))
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
        case 'seed':
          return calculateSeed(context, orderedClauses(inboxes[index]), orderedClauses(enemyFor))
        case 'cissia':
          return calculateCissia(context, orderedClauses(inboxes[index]), orderedClauses(enemyFor))
        case 'evelyn':
          return calculateEvelyn(context, orderedClauses(inboxes[index]), orderedClauses(enemyFor))
        default:
          return assertNever(context)
      }
    }),
  }
}
