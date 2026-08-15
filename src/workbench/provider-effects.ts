import {
  ADMITTED_AGENTS,
  SETUP_FORMULA_PARTICIPATION_BY_AGENT,
  W_ENGINE_FACTS,
  type AgentId,
  type EquipmentEffectCollection,
} from './content'
import type { AppliedSlot, WorkbenchState } from './state'
import {
  anotherAgentHasSpecialty,
  billyAdditionalIsActive,
  caesarAdditionalIsActive,
  harumasaAdditionalIsActive,
  nekomataAdditionalIsActive,
  qingyiAdditionalIsActive,
  soldier11AdditionalIsActive,
  triggerAdditionalIsActive,
  zhuYuanAdditionalIsActive,
} from './party-conditions'
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
  isSeedVanguardAtkAgent,
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
import { observeEllen, resolveEllenProviderClauses, type EllenCalculationContext } from './calculation/agents/ellen'
import { observeSoukaku, resolveSoukakuProviderClauses, type SoukakuCalculationContext } from './calculation/agents/soukaku'
import {
  observeSoldier11,
  resolveSoldier11ProviderClauses,
  type Soldier11CalculationContext,
} from './calculation/agents/soldier11'
import {
  observeLighter,
  resolveLighterProviderClauses,
  type LighterCalculationContext,
} from './calculation/agents/lighter'
import {
  observeLucy,
  resolveLucyProviderClauses,
  type LucyCalculationContext,
} from './calculation/agents/lucy'
import {
  observeZhuYuan,
  resolveZhuYuanProviderClauses,
  type ZhuYuanCalculationContext,
} from './calculation/agents/zhu-yuan'
import {
  observeNicole,
  resolveNicoleProviderClauses,
  type NicoleCalculationContext,
} from './calculation/agents/nicole'
import {
  observeOrphie,
  resolveOrphieProviderClauses,
  type OrphieCalculationContext,
} from './calculation/agents/orphie'
import {
  observePulchra,
  resolvePulchraProviderClauses,
  type PulchraCalculationContext,
} from './calculation/agents/pulchra'
import {
  observeHarumasa,
  resolveHarumasaProviderClauses,
  type HarumasaCalculationContext,
} from './calculation/agents/harumasa'
import {
  observeQingyi,
  resolveQingyiProviderClauses,
  type QingyiCalculationContext,
} from './calculation/agents/qingyi'
import {
  observeNekomata,
  resolveNekomataProviderClauses,
  type NekomataCalculationContext,
} from './calculation/agents/nekomata'
import {
  observeBilly,
  resolveBillyProviderClauses,
  type BillyCalculationContext,
} from './calculation/agents/billy'
import {
  observeBen,
  resolveBenProviderClauses,
  type BenCalculationContext,
} from './calculation/agents/ben'
import {
  observeKoleda,
  resolveKoledaProviderClauses,
  type KoledaCalculationContext,
} from './calculation/agents/koleda'
import {
  observeAnbyDemara,
  resolveAnbyDemaraProviderClauses,
  type AnbyDemaraCalculationContext,
} from './calculation/agents/anby'
import {
  observeCaesar,
  resolveCaesarProviderClauses,
  type CaesarCalculationContext,
} from './calculation/agents/caesar'
import {
  observeYeShunguang,
  resolveYeShunguangProviderClauses,
  type YeShunguangCalculationContext,
} from './calculation/agents/ye-shunguang'
import {
  observeZhao,
  resolveZhaoProviderClauses,
  type ZhaoCalculationContext,
} from './calculation/agents/zhao'
import {
  observeGrace,
  resolveGraceProviderClauses,
  type GraceCalculationContext,
} from './calculation/agents/grace'

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
  | EllenCalculationContext
  | SoukakuCalculationContext
  | Soldier11CalculationContext
  | LighterCalculationContext
  | LucyCalculationContext
  | ZhuYuanCalculationContext
  | NicoleCalculationContext
  | OrphieCalculationContext
  | PulchraCalculationContext
  | HarumasaCalculationContext
  | QingyiCalculationContext
  | NekomataCalculationContext
  | BillyCalculationContext
  | BenCalculationContext
  | KoledaCalculationContext
  | AnbyDemaraCalculationContext
  | CaesarCalculationContext
  | YeShunguangCalculationContext
  | ZhaoCalculationContext
  | GraceCalculationContext

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
      return observeCorin(slot.setup, anotherSharesAttribute || anotherSharesFaction)
    case 'lycaon':
      return observeLycaon(
        slot.setup,
        anotherHasSpecialty(['Anomaly']) || anotherSharesAttribute || anotherSharesFaction,
      )
    case 'ellen':
      return observeEllen(
        slot.setup,
        anotherHasSpecialty(['Stun']) || anotherSharesAttribute || anotherSharesFaction,
      )
    case 'soukaku':
      return observeSoukaku(slot.setup, anotherSharesAttribute || anotherSharesFaction)
    case 'soldier11':
      return observeSoldier11(
        slot.setup,
        soldier11AdditionalIsActive(partyAgentIds, providerIndex),
      )
    case 'lighter':
      return observeLighter(slot.setup, anotherHasSpecialty(['Attack']) || anotherSharesFaction)
    case 'lucy':
      return observeLucy(slot.setup)
    case 'zhuYuan':
      return observeZhuYuan(
        slot.setup,
        zhuYuanAdditionalIsActive(partyAgentIds, providerIndex),
      )
    case 'nicole':
      return observeNicole(slot.setup, anotherSharesAttribute || anotherSharesFaction)
    case 'orphie':
      return observeOrphie(slot.setup, hasStunOrSupport)
    case 'pulchra':
      return observePulchra(
        slot.setup,
        anotherHasSpecialty(['Attack', 'Rupture']) || anotherSharesFaction,
      )
    case 'harumasa':
      return observeHarumasa(
        slot.setup,
        harumasaAdditionalIsActive(partyAgentIds, providerIndex),
      )
    case 'qingyi':
      return observeQingyi(
        slot.setup,
        qingyiAdditionalIsActive(partyAgentIds, providerIndex),
      )
    case 'nekomata':
      return observeNekomata(
        slot.setup,
        nekomataAdditionalIsActive(partyAgentIds, providerIndex),
      )
    case 'billy':
      return observeBilly(
        slot.setup,
        billyAdditionalIsActive(partyAgentIds, providerIndex),
      )
    case 'ben':
      return observeBen(slot.setup, anotherSharesAttribute || anotherSharesFaction)
    case 'koleda':
      return observeKoleda(
        slot.setup,
        anotherSharesAttribute || anotherSharesFaction || anotherHasSpecialty(['Rupture']),
      )
    case 'anby':
      return observeAnbyDemara(slot.setup)
    case 'caesar':
      return observeCaesar(
        slot.setup,
        caesarAdditionalIsActive(partyAgentIds, providerIndex),
      )
    case 'yeShunguang':
      return observeYeShunguang(slot.setup)
    case 'zhao':
      return observeZhao(
        slot.setup,
        anotherHasSpecialty(['Attack', 'Anomaly', 'Support']),
      )
    case 'grace':
      return observeGrace(
        slot.setup,
        anotherSharesAttribute || anotherSharesFaction || anotherHasSpecialty(['Anomaly']),
        state.slots.some(({ agentId }, index) => (
          index !== providerIndex
          && ADMITTED_AGENTS.find(({ id }) => id === agentId)!.attribute !== 'Electric'
        )),
      )
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
    case 'ellen':
      return resolveEllenProviderClauses(context)
    case 'soukaku':
      return resolveSoukakuProviderClauses(context)
    case 'soldier11':
      return resolveSoldier11ProviderClauses(context)
    case 'lighter':
      return resolveLighterProviderClauses(context)
    case 'lucy':
      return resolveLucyProviderClauses(context)
    case 'zhuYuan':
      return resolveZhuYuanProviderClauses(context)
    case 'nicole':
      return resolveNicoleProviderClauses(context)
    case 'orphie':
      return resolveOrphieProviderClauses(context)
    case 'pulchra':
      return resolvePulchraProviderClauses(context)
    case 'harumasa':
      return resolveHarumasaProviderClauses(context)
    case 'qingyi':
      return resolveQingyiProviderClauses(context)
    case 'nekomata':
      return resolveNekomataProviderClauses(context)
    case 'billy':
      return resolveBillyProviderClauses(context)
    case 'ben':
      return resolveBenProviderClauses(context)
    case 'koleda':
      return resolveKoledaProviderClauses(context)
    case 'anby':
      return resolveAnbyDemaraProviderClauses(context)
    case 'caesar':
      return resolveCaesarProviderClauses(context)
    case 'yeShunguang':
      return resolveYeShunguangProviderClauses(context)
    case 'zhao':
      return resolveZhaoProviderClauses(context)
    case 'grace':
      return resolveGraceProviderClauses(context)
    default:
      return assertNever(context)
  }
}

function isAttackAgent(agentId: AgentId): boolean {
  return ADMITTED_AGENTS.find(({ id }) => id === agentId)?.specialty === 'Attack'
}

function isPrePenDamageAgent(agentId: AgentId): boolean {
  const participation = SETUP_FORMULA_PARTICIPATION_BY_AGENT[agentId]
  return [...participation.primary, ...participation.residual]
    .some((formula) => formula === 'general_damage' || formula === 'anomaly_damage')
}

function isElectricPrePenDamageAgent(agentId: AgentId): boolean {
  const agent = ADMITTED_AGENTS.find(({ id }) => id === agentId)
  return agent?.attribute === 'Electric' && isPrePenDamageAgent(agentId)
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
  const hasCissiaCore = isElectricPrePenDamageAgent(recipientAgentId)
    && state.slots.some(({ agentId }) => agentId === 'cissia')
  const hasNicoleCore = isPrePenDamageAgent(recipientAgentId)
    && state.slots.some(({ agentId }) => agentId === 'nicole')
  const hasSpectralGaze = isPrePenDamageAgent(recipientAgentId)
    && state.slots.some(({ agentId, setup }) => (
      agentId === 'trigger' && setup.engineId === 'spectralGaze'
    ))
  const hasSeedM2Besiege = hasSeedM2CandidatePressure(state, recipientSlot)
  const hasSelectedEnginePressure = selectedEngineHasBroadPrePenPressure(
    state,
    recipientSlot,
  )
  const hasQingyiM1 = isPrePenDamageAgent(recipientAgentId)
    && state.slots.some(({ agentId, setup }) => (
      agentId === 'qingyi' && setup.mindscape >= 1
    ))

  return hasCissiaCore || hasNicoleCore || hasSpectralGaze || hasSeedM2Besiege
    || hasSelectedEnginePressure || hasQingyiM1
    ? ['materialBroadPrePenDefBypass']
    : []
}

function selectedEngineHasBroadPrePenPressure(
  state: WorkbenchState,
  recipientSlot: AppliedSlot,
): boolean {
  const { agentId, setup } = state.slots[recipientSlot]
  if (!isPrePenDamageAgent(agentId) || !setup.engineId) return false
  const effects = W_ENGINE_FACTS[setup.engineId].effects as EquipmentEffectCollection
  const attribute = ADMITTED_AGENTS.find(({ id }) => id === agentId)!.attribute
  // Myriad's DEF Ignore requires Ice damage, independent of the holder identity.
  if (setup.engineId === 'myriadEclipse' && attribute !== 'Ice') return false
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
  return isPrePenDamageAgent(recipientAgentId) && Boolean(
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
