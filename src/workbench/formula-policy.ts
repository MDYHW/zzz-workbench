import {
  SETUP_FORMULA_PARTICIPATION_BY_AGENT,
  type AgentId,
  type SetupFormulaFamily,
} from './content'

export function formulaUsesDefRegion(formula: SetupFormulaFamily): boolean {
  return formula === 'general_damage' || formula === 'anomaly_damage'
}

export function directionUsesDefRegion(agentId: AgentId): boolean {
  const { primary, residual } = SETUP_FORMULA_PARTICIPATION_BY_AGENT[agentId]
  return [...primary, ...residual].some(formulaUsesDefRegion)
}

export function primaryFormulaUsesDefRegion(agentId: AgentId): boolean {
  return SETUP_FORMULA_PARTICIPATION_BY_AGENT[agentId].primary
    .some(formulaUsesDefRegion)
}
