import {
  ADMITTED_AGENTS,
  SETUP_FORMULA_PARTICIPATION_BY_AGENT,
  type AgentId,
  type SetupFormulaFamily,
} from './content'
import type { EffectAttribute, EffectMetric } from './effects'

export const REGULAR_DAMAGE_FORMULAS = [
  'general_damage',
  'sheer_damage',
  'anomaly_damage',
] as const satisfies readonly SetupFormulaFamily[]

export const CRIT_DAMAGE_FORMULAS = [
  'general_damage',
  'sheer_damage',
] as const satisfies readonly SetupFormulaFamily[]

export const DEF_DAMAGE_FORMULAS = [
  'general_damage',
  'anomaly_damage',
] as const satisfies readonly SetupFormulaFamily[]

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

export function formulaUsesDefRegion(formula: SetupFormulaFamily): boolean {
  return formula === 'general_damage' || formula === 'anomaly_damage'
}

export function formulaUsesCrit(formula: SetupFormulaFamily): boolean {
  return formula === 'general_damage' || formula === 'sheer_damage'
}

export function directionUsesDefRegion(agentId: AgentId): boolean {
  const { primary, residual } = SETUP_FORMULA_PARTICIPATION_BY_AGENT[agentId]
  return [...primary, ...residual].some(formulaUsesDefRegion)
}

export function primaryFormulaUsesDefRegion(agentId: AgentId): boolean {
  return SETUP_FORMULA_PARTICIPATION_BY_AGENT[agentId].primary
    .some(formulaUsesDefRegion)
}

export function primaryFormulaUsesCrit(agentId: AgentId): boolean {
  return SETUP_FORMULA_PARTICIPATION_BY_AGENT[agentId].primary
    .some(formulaUsesCrit)
}

export function effectAttributeForAgent(agentId: AgentId): EffectAttribute {
  const attribute = ADMITTED_AGENTS.find(({ id }) => id === agentId)?.attribute
  if (attribute === 'Auric Ink') return 'Ether'
  if (attribute === 'Honed Edge') return 'Physical'
  if (
    attribute === 'Physical'
    || attribute === 'Fire'
    || attribute === 'Ice'
    || attribute === 'Electric'
    || attribute === 'Ether'
  ) return attribute
  throw new Error(`Unsupported Attribute for effect applicability: ${String(attribute)}`)
}

/**
 * Resolves an explicitly authored source formula scope against one recipient.
 * Anomaly damage shares only the named general-damage regions it actually
 * consumes; this does not make the two formula families equivalent.
 */
export function formulaScopeAppliesToMetric(
  recipientFormulas: readonly SetupFormulaFamily[],
  sourceFormulas: readonly SetupFormulaFamily[],
  metric: EffectMetric,
): boolean {
  if (recipientFormulas.some((formula) => sourceFormulas.includes(formula))) return true
  return recipientFormulas.includes('anomaly_damage')
    && sourceFormulas.includes('general_damage')
    && GENERAL_REGION_METRICS_SHARED_BY_ANOMALY.includes(metric)
}
