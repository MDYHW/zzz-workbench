import {
  ADMITTED_AGENTS,
  SETUP_FORMULA_PARTICIPATION_BY_AGENT,
  type AgentId,
} from './content'
import type { AppliedSlot, WorkbenchState } from './state'
import {
  clauseAppliesToAgent,
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
import {
  observeSeed,
  resolveSeedProviderClauses,
  type SeedCalculationContext,
} from './calculation/agents/seed'
import {
  observeCissia,
  resolveCissiaProviderClauses,
  type CissiaCalculationContext,
} from './calculation/agents/cissia'

export type ProviderContext =
  | YixuanCalculationContext
  | DialynCalculationContext
  | LuciaCalculationContext
  | AnbyCalculationContext
  | TriggerCalculationContext
  | AstraCalculationContext
  | SeedCalculationContext
  | CissiaCalculationContext

export interface ProviderEffects {
  contexts: ProviderContext[]
  inboxes: [
    SourceBoundCurrentClause[],
    SourceBoundCurrentClause[],
    SourceBoundCurrentClause[],
  ]
  enemyContext: SourceBoundCurrentClause[]
}

export interface SeedVanguardObservation {
  agentId: AgentId
  appliedSlot: AppliedSlot
  initialAtk: number
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
    case 'seed':
      return observeSeed(slot.setup)
    case 'cissia':
      return observeCissia(slot.setup)
    default:
      return assertNever(slot.agentId)
  }
}

interface AppliedPartyFacts {
  electricAgentCount: number
  cissiaAdditionalActive: boolean
}

function providerClauses(
  context: ProviderContext,
  seedVanguardAgentId: AgentId | null,
  party: AppliedPartyFacts,
): SourceBoundCurrentClause[] {
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
    case 'seed':
      return resolveSeedProviderClauses(context, seedVanguardAgentId)
    case 'cissia':
      return resolveCissiaProviderClauses(context, {
        electricAgentCount: party.electricAgentCount,
        additionalActive: party.cissiaAdditionalActive,
      })
    default:
      return assertNever(context)
  }
}

function isAttackAgent(agentId: AgentId): boolean {
  return ADMITTED_AGENTS.find(({ id }) => id === agentId)?.specialty === 'Attack'
}

function isGeneralDamageAgent(agentId: AgentId): boolean {
  const participation = SETUP_FORMULA_PARTICIPATION_BY_AGENT[agentId]
  return [...participation.primary, ...participation.residual]
    .includes('general_damage')
}

function isElectricGeneralDamageAgent(agentId: AgentId): boolean {
  const agent = ADMITTED_AGENTS.find(({ id }) => id === agentId)
  return agent?.attribute === 'Electric' && isGeneralDamageAgent(agentId)
}

export function resolveSeedVanguard(
  observations: readonly SeedVanguardObservation[],
): AgentId | null {
  if (!observations.some(({ agentId }) => agentId === 'seed')) return null
  const candidates = observations.filter(({ agentId }) => (
    agentId !== 'seed' && isAttackAgent(agentId)
  ))
  if (candidates.length === 0) return null
  return candidates.reduce((selected, candidate) => (
    candidate.initialAtk > selected.initialAtk
    || (
      candidate.initialAtk === selected.initialAtk
      && candidate.appliedSlot < selected.appliedSlot
    )
      ? candidate
      : selected
  )).agentId
}

function initialAtkObservation(
  context: ProviderContext,
  appliedSlot: AppliedSlot,
): SeedVanguardObservation | null {
  if (!('initialAtk' in context)) return null
  return { agentId: context.agentId, appliedSlot, initialAtk: context.initialAtk }
}

function observeAllProviderContexts(state: WorkbenchState): ProviderContext[] {
  return state.slots.map((_, providerIndex) => {
    const context = observeProviderContext(state, providerIndex)
    if (!context) throw new Error('Provider effects require complete provider-local inputs')
    return context
  })
}

export function resolveProviderEffects(state: WorkbenchState): ProviderEffects {
  const contexts = observeAllProviderContexts(state)
  const inboxes: ProviderEffects['inboxes'] = [[], [], []]
  const enemyContext: SourceBoundCurrentClause[] = []
  const seedVanguardAgentId = resolveSeedVanguard(contexts.flatMap((context, index) => {
    const observation = initialAtkObservation(context, index as AppliedSlot)
    return observation ? [observation] : []
  }))
  const summaries = state.slots.map(({ agentId }) => (
    ADMITTED_AGENTS.find(({ id }) => id === agentId)!
  ))
  const party: AppliedPartyFacts = {
    electricAgentCount: summaries.filter(({ attribute }) => attribute === 'Electric').length,
    cissiaAdditionalActive: summaries.some(({ id, attribute, specialty }) => (
      id !== 'cissia' && (specialty === 'Stun' || attribute === 'Electric')
    )),
  }

  for (const [providerIndex, context] of contexts.entries()) {
    const clauses = providerClauses(context, seedVanguardAgentId, party)

    for (const clause of clauses) {
      if (clause.recipient === 'enemy-context') {
        enemyContext.push({
          ...clause,
          eligibleAgentIds: state.slots
            .filter(({ agentId }) => clauseAppliesToAgent(clause, agentId))
            .map(({ agentId }) => agentId),
        })
        continue
      }
      for (const [recipientIndex] of state.slots.entries()) {
        const receives = clause.recipient === 'all-party'
          || (clause.recipient === 'self' && recipientIndex === providerIndex)
          || (clause.recipient === 'focus' && recipientIndex === state.focusSlot)
          || (clause.recipient === 'other-party' && recipientIndex !== providerIndex)
        if (receives && clauseAppliesToAgent(
          clause,
          state.slots[recipientIndex].agentId,
        )) inboxes[recipientIndex].push(clause)
      }
    }
  }

  return { contexts, inboxes, enemyContext }
}

export function activeCandidatePressures(
  state: WorkbenchState,
  recipientSlot: AppliedSlot,
): NonNullable<SourceBoundCurrentClause['candidatePressure']>[] {
  const recipientAgentId = state.slots[recipientSlot].agentId
  const hasCissiaCore = isElectricGeneralDamageAgent(recipientAgentId)
    && state.slots.some(({ agentId }) => agentId === 'cissia')
  const hasSpectralGaze = isGeneralDamageAgent(recipientAgentId)
    && state.slots.some(({ agentId, setup }) => (
      agentId === 'trigger' && setup.engineId === 'spectralGaze'
    ))
  const seed = state.slots.find(({ agentId }) => agentId === 'seed')
  const incompleteSafeVanguard = state.slots.find(({ agentId }) => (
    agentId !== 'seed'
      && agentId !== 'cissia'
      && isAttackAgent(agentId)
  ))?.agentId ?? null
  const hasSeedM2Besiege = isElectricGeneralDamageAgent(recipientAgentId) && Boolean(
    seed
      && seed.setup.mindscape >= 2
      && incompleteSafeVanguard
      && (
        recipientAgentId === 'seed'
          || recipientAgentId === incompleteSafeVanguard
      ),
  )

  return hasCissiaCore || hasSpectralGaze || hasSeedM2Besiege
    ? ['materialBroadPrePenDefBypass']
    : []
}
