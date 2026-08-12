import {
  ADMITTED_AGENTS,
  SETUP_FORMULA_PARTICIPATION_BY_AGENT,
  W_ENGINE_FACTS,
  type AgentId,
  type EquipmentEffectCollection,
} from './content'
import type { AppliedSlot, WorkbenchState } from './state'
import { anotherAgentHasSpecialty, triggerAdditionalIsActive } from './party-conditions'
import {
  astralVoiceEntrantClause,
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
import {
  observeEvelyn,
  resolveEvelynProviderClauses,
  type EvelynCalculationContext,
} from './calculation/agents/evelyn'
import {
  initialAtkFor,
  type SeedVanguardAtkAgentId,
} from './calculation/initial-atk'
import { observeCorin, resolveCorinProviderClauses, type CorinCalculationContext } from './calculation/agents/corin'
import { observeLycaon, resolveLycaonProviderClauses, type LycaonCalculationContext } from './calculation/agents/lycaon'
import {
  observeYidhari,
  resolveYidhariProviderClauses,
  type YidhariCalculationContext,
} from './calculation/agents/yidhari'
import {
  observeManato,
  resolveManatoProviderClauses,
  type ManatoCalculationContext,
} from './calculation/agents/manato'
import {
  observeHugo,
  resolveHugoProviderClauses,
  type HugoCalculationContext,
} from './calculation/agents/hugo'
import {
  observeJuFufu,
  resolveJuFufuProviderClauses,
  type JuFufuCalculationContext,
} from './calculation/agents/ju-fufu'
import {
  observePanYinhu,
  resolvePanYinhuProviderClauses,
  type PanYinhuCalculationContext,
} from './calculation/agents/pan-yinhu'
import {
  observeBanyue,
  resolveBanyueProviderClauses,
  type BanyueCalculationContext,
} from './calculation/agents/banyue'
import {
  observeStarlightBilly,
  resolveStarlightBillyProviderClauses,
  type StarlightBillyCalculationContext,
} from './calculation/agents/starlight-billy'

export type ProviderContext =
  | YixuanCalculationContext
  | DialynCalculationContext
  | LuciaCalculationContext
  | AnbyCalculationContext
  | TriggerCalculationContext
  | AstraCalculationContext
  | SeedCalculationContext
  | CissiaCalculationContext
  | EvelynCalculationContext
  | CorinCalculationContext
  | LycaonCalculationContext
  | YidhariCalculationContext
  | ManatoCalculationContext
  | HugoCalculationContext
  | JuFufuCalculationContext
  | PanYinhuCalculationContext
  | BanyueCalculationContext
  | StarlightBillyCalculationContext

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

  const anotherHasSpecialty = (
    specialties: readonly (typeof ADMITTED_AGENTS)[number]['specialty'][],
  ) => anotherAgentHasSpecialty(
    state.slots.map(({ agentId }) => agentId),
    providerIndex,
    specialties,
  )
  const hasStunOrSupport = anotherHasSpecialty(['Stun', 'Support'])
  const partyAgentIds = state.slots.map(({ agentId }) => agentId)
  const summary = ADMITTED_AGENTS.find(({ id }) => id === slot.agentId)!
  const anotherSharesAttribute = state.slots.some(({ agentId }, index) => (
    index !== providerIndex
    && ADMITTED_AGENTS.find(({ id }) => id === agentId)!.attribute === summary.attribute
  ))
  const anotherSharesFaction = Boolean(summary.faction) && state.slots.some(({ agentId }, index) => (
    index !== providerIndex
    && ADMITTED_AGENTS.find(({ id }) => id === agentId)!.faction === summary.faction
  ))
  const stunAgentCount = state.slots.filter(({ agentId }) => (
    ADMITTED_AGENTS.find(({ id }) => id === agentId)!.specialty === 'Stun'
  )).length
  const additionalByParty = state.slots.some(({ agentId }, index) => {
    if (index === providerIndex) return false
    const other = ADMITTED_AGENTS.find(({ id }) => id === agentId)!
    if (slot.agentId === 'corin') return other.attribute === 'Physical' || other.faction === summary.faction
    if (slot.agentId === 'lycaon') return other.specialty === 'Anomaly' || other.attribute === 'Ice' || other.faction === summary.faction
    return false
  })

  switch (slot.agentId) {
    case 'yixuan':
      return observeYixuan(slot.setup)
    case 'yidhari':
      return observeYidhari(slot.setup, hasStunOrSupport)
    case 'manato':
      return observeManato(slot.setup)
    case 'hugo':
      return observeHugo(
        slot.setup,
        anotherHasSpecialty(['Stun']) || anotherSharesAttribute,
        stunAgentCount,
      )
    case 'juFufu':
      return observeJuFufu(slot.setup)
    case 'panYinhu':
      return observePanYinhu(
        slot.setup,
        anotherHasSpecialty(['Rupture']) || anotherSharesFaction,
      )
    case 'banyue':
      return observeBanyue(slot.setup, hasStunOrSupport)
    case 'starlightBilly':
      return observeStarlightBilly(
        slot.setup,
        anotherHasSpecialty(['Stun', 'Defense', 'Support']),
      )
    case 'dialyn':
      return observeDialyn(slot.setup)
    case 'lucia':
      return observeLucia(slot.setup, anotherHasSpecialty(['Rupture', 'Stun']))
    case 'anbySoldier0':
      return observeAnby(slot.setup, hasStunOrSupport, providerIndex === state.focusSlot)
    case 'trigger':
      return observeTrigger(
        slot.setup,
        triggerAdditionalIsActive(partyAgentIds, providerIndex),
      )
    case 'astraYao':
      return observeAstra(slot.setup)
    case 'seed':
      return observeSeed(slot.setup)
    case 'cissia':
      return observeCissia(slot.setup)
    case 'evelyn':
      return observeEvelyn(slot.setup, hasStunOrSupport)
    case 'corin':
      return observeCorin(slot.setup, additionalByParty)
    case 'lycaon':
      return observeLycaon(slot.setup, additionalByParty)
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
    case 'yidhari':
      return resolveYidhariProviderClauses(context)
    case 'manato':
      return resolveManatoProviderClauses(context.setup)
    case 'hugo':
      return resolveHugoProviderClauses(context)
    case 'juFufu':
      return resolveJuFufuProviderClauses(context)
    case 'panYinhu':
      return resolvePanYinhuProviderClauses(context)
    case 'banyue':
      return resolveBanyueProviderClauses(context)
    case 'starlightBilly':
      return resolveStarlightBillyProviderClauses(context)
    case 'dialyn':
      return resolveDialynProviderClauses(context.setup, context.initialCrit.value)
    case 'lucia':
      return resolveLuciaProviderClauses(context)
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
    case 'evelyn':
      return resolveEvelynProviderClauses(context)
    case 'corin':
      return resolveCorinProviderClauses(context)
    case 'lycaon':
      return resolveLycaonProviderClauses(context)
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

function isSeedVanguardAtkAgent(agentId: AgentId): agentId is SeedVanguardAtkAgentId {
  return agentId === 'anbySoldier0'
    || agentId === 'seed'
    || agentId === 'cissia'
    || agentId === 'evelyn'
    || agentId === 'corin'
    || agentId === 'hugo'
}

export function resolveSeedVanguard(
  observations: readonly SeedVanguardObservation[],
): AgentId | null {
  if (!observations.some(({ agentId }) => agentId === 'seed')) return null
  const candidates = observations.filter(({ agentId }) => (
    agentId !== 'seed' && isAttackAgent(agentId)
  ))
  return selectSeedVanguardCandidate(candidates)
}

function selectSeedVanguardCandidate(
  candidates: readonly SeedVanguardObservation[],
): AgentId | null {
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

export function resolveSeedVanguardForState(state: WorkbenchState): AgentId | null {
  if (!state.slots.some(({ agentId }) => agentId === 'seed')) return null
  const eligible = state.slots.filter(({ agentId }) => (
    agentId !== 'seed' && isAttackAgent(agentId)
  ))
  if (eligible.length === 0) return null
  if (eligible.length === 1) return eligible[0].agentId

  const observations: SeedVanguardObservation[] = []
  for (const slot of eligible) {
    if (!isSeedVanguardAtkAgent(slot.agentId)) return null
    const initialAtk = initialAtkFor(slot.agentId, slot.setup)
    if (initialAtk === null) return null
    observations.push({
      agentId: slot.agentId,
      appliedSlot: state.slots.indexOf(slot) as AppliedSlot,
      initialAtk,
    })
  }
  return selectSeedVanguardCandidate(observations)
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
  const seedVanguardAgentId = resolveSeedVanguardForState(state)
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
    const astralEntrant = astralVoiceEntrantClause(context.agentId, context.setup)
    const clauses = [
      ...providerClauses(context, seedVanguardAgentId, party),
      ...(astralEntrant ? [astralEntrant] : []),
    ]

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
  const hasSeedM2Besiege = hasSeedM2CandidatePressure(state, recipientSlot)
  const hasSelectedEnginePressure = selectedEngineHasBroadPrePenPressure(
    state,
    recipientSlot,
  )

  return hasCissiaCore || hasSpectralGaze || hasSeedM2Besiege || hasSelectedEnginePressure
    ? ['materialBroadPrePenDefBypass']
    : []
}

function selectedEngineHasBroadPrePenPressure(
  state: WorkbenchState,
  recipientSlot: AppliedSlot,
): boolean {
  const { agentId, setup } = state.slots[recipientSlot]
  if (!isGeneralDamageAgent(agentId) || !setup.engineId) return false
  const effects = W_ENGINE_FACTS[setup.engineId].effects as EquipmentEffectCollection
  const attribute = ADMITTED_AGENTS.find(({ id }) => id === agentId)!.attribute
  return Object.values(effects).some((effect) => (
    (effect.modifier === 'defIgnore' || effect.modifier === 'defReduction')
    && !effect.scope?.actions?.length
    && (!effect.scope?.attributes?.length || effect.scope.attributes.includes(
      attribute === 'Auric Ink' ? 'Ether' : attribute as 'Physical' | 'Fire' | 'Ice' | 'Electric' | 'Ether',
    ))
  ))
}

export function hasSeedM2CandidatePressure(
  state: WorkbenchState,
  recipientSlot: AppliedSlot,
): boolean {
  const recipientAgentId = state.slots[recipientSlot].agentId
  const seed = state.slots.find(({ agentId }) => agentId === 'seed')
  const seedVanguard = resolveSeedVanguardForState(state)
  return isGeneralDamageAgent(recipientAgentId) && Boolean(
    seed
      && seed.setup.mindscape >= 2
      && seedVanguard
      && (recipientAgentId === 'seed' || recipientAgentId === seedVanguard),
  )
}

export function hasDialynUltimateOpportunity(
  state: WorkbenchState,
  recipientSlot: AppliedSlot,
): boolean {
  const recipientAgentId = state.slots[recipientSlot].agentId
  return recipientAgentId !== 'dialyn'
    && SETUP_FORMULA_PARTICIPATION_BY_AGENT[recipientAgentId].primary
      .includes('general_damage')
    && state.slots.some(({ agentId }) => agentId === 'dialyn')
}
