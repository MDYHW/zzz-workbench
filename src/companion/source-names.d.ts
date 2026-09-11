declare module 'source-names' {
  import type { AgentId, DiscId, EngineId } from '../workbench/content'

  export const koAgentNames: Record<AgentId, string>
  export const koEngineNames: Record<EngineId, string>
  export const koDiscNames: Record<DiscId, string>
}
