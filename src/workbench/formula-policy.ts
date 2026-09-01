import {
  ADMITTED_AGENTS,
  FORMULA_PARTICIPATION_BY_AGENT,
  type AgentId,
  type FormulaFamily,
} from './content'
import type { EffectAttribute, EffectMetric } from './effects'
import { nextAppliedAgentId } from './party-conditions'

export const REGULAR_DAMAGE_FORMULAS = [
  'general_damage',
  'sheer_damage',
  'anomaly_damage',
] as const satisfies readonly FormulaFamily[]

export const CRIT_DAMAGE_FORMULAS = [
  'general_damage',
  'sheer_damage',
] as const satisfies readonly FormulaFamily[]

export const DEF_DAMAGE_FORMULAS = [
  'general_damage',
  'anomaly_damage',
] as const satisfies readonly FormulaFamily[]

const GENERAL_REGION_METRICS_SHARED_BY_ANOMALY: readonly EffectMetric[] = [
  'atk',
  'dmgBonus',
  'penRatio',
  'defIgnore',
  'defReduction',
  'resIgnore',
  'resReduction',
  'stunDmgMultiplier',
]

export function formulaUsesDefRegion(formula: FormulaFamily): boolean {
  return formula === 'general_damage' || formula === 'anomaly_damage'
}

export function formulaUsesCrit(formula: FormulaFamily): boolean {
  return formula === 'general_damage' || formula === 'sheer_damage'
}

export function directionUsesDefRegion(agentId: AgentId): boolean {
  const { primary, residual } = FORMULA_PARTICIPATION_BY_AGENT[agentId].setup
  return [...primary, ...residual].some(formulaUsesDefRegion)
}

export function primaryFormulaUsesDefRegion(agentId: AgentId): boolean {
  return FORMULA_PARTICIPATION_BY_AGENT[agentId].setup.primary
    .some(formulaUsesDefRegion)
}

export function primaryFormulaUsesCrit(agentId: AgentId): boolean {
  return FORMULA_PARTICIPATION_BY_AGENT[agentId].setup.primary
    .some(formulaUsesCrit)
}

export function directionUsesFormula(
  agentId: AgentId,
  formula: FormulaFamily,
): boolean {
  const { primary, residual } = FORMULA_PARTICIPATION_BY_AGENT[agentId].setup
  return primary.includes(formula) || residual.includes(formula)
}

export function effectAttributeForAgent(agentId: AgentId): EffectAttribute {
  const attribute = ADMITTED_AGENTS.find(({ id }) => id === agentId)?.attribute
  if (attribute === 'Auric Ink') return 'Ether'
  if (attribute === 'Honed Edge') return 'Physical'
  if (attribute === 'Frost') return 'Ice'
  if (attribute === 'Lumiflux') {
    throw new Error('Lumiflux calculation Attribute requires the applied party slot')
  }
  if (
    attribute === 'Physical'
    || attribute === 'Fire'
    || attribute === 'Ice'
    || attribute === 'Electric'
    || attribute === 'Ether'
    || attribute === 'Wind'
  ) return attribute
  throw new Error(`Unsupported Attribute for effect applicability: ${String(attribute)}`)
}

/** Resolves special display Attributes at their exact current calculation scope. */
export function effectAttributeForPartySlot(
  agentIds: readonly AgentId[],
  appliedPartySlot: 0 | 1 | 2,
): EffectAttribute {
  const agentId = agentIds[appliedPartySlot]
  const attribute = ADMITTED_AGENTS.find(({ id }) => id === agentId)?.attribute
  return attribute === 'Lumiflux'
    ? effectAttributeForAgent(nextAppliedAgentId(agentIds, appliedPartySlot))
    : effectAttributeForAgent(agentId)
}

/**
 * Resolves an explicitly authored source formula scope against one recipient.
 * Anomaly damage shares only the named general-damage regions it actually
 * consumes; this does not make the two formula families equivalent.
 */
export function formulaScopeAppliesToMetric(
  recipientFormulas: readonly FormulaFamily[],
  sourceFormulas: readonly FormulaFamily[],
  metric: EffectMetric,
): boolean {
  if (recipientFormulas.some((formula) => sourceFormulas.includes(formula))) return true
  return recipientFormulas.includes('anomaly_damage')
    && sourceFormulas.includes('general_damage')
    && GENERAL_REGION_METRICS_SHARED_BY_ANOMALY.includes(metric)
}
