import type {
  AgentId,
  DiscId,
  EngineId,
  FixedMainSlot,
  MainSlot,
  MainStatId,
  MindscapeRank,
  SubstatId,
} from './types'

export type AppliedPartySlot = 0 | 1 | 2
export type DriveDiscEffectPiece = '2-piece' | '4-piece'
export type EffectiveSubstatPosition = 1 | 2 | 3
export type RetainedMindscapeTier = Exclude<MindscapeRank, 0>

export type SourceDefinitionLocus =
  | 'identity'
  | 'w-engine'
  | 'disc-4pc'
  | 'disc-2pc'
  | 'disc-slot-4'
  | 'disc-slot-5'
  | 'disc-slot-6'
  | 'substat-1'
  | 'substat-2'
  | 'substat-3'
  | 'core'
  | 'additional'
  | 'special'
  | 'ex-special'
  | 'mindscape'
  | 'calculation'
  | 'target'

export type SourceDefinitionKey =
  | { kind: 'agent-base'; agentId: AgentId }
  | { kind: 'agent-source'; agentId: AgentId; sourceId: string }
  | { kind: 'mindscape'; agentId: AgentId; tier: RetainedMindscapeTier }
  | { kind: 'w-engine-base'; engineId: EngineId }
  | { kind: 'w-engine'; engineId: EngineId }
  | { kind: 'drive-disc'; discId: DiscId; piece: DriveDiscEffectPiece }
  | { kind: 'fixed-main'; slot: FixedMainSlot; statId: 'hpFlat' | 'atkFlat' | 'defFlat' }
  | { kind: 'editable-main'; slot: MainSlot; statId: MainStatId }
  | { kind: 'effective-substat'; position: EffectiveSubstatPosition; statId: SubstatId }
  | { kind: 'calculation'; calculationId: string }

export interface SourcePresentation {
  label: string
  locus: SourceDefinitionLocus
}

export interface SourceDefinition<Key extends SourceDefinitionKey = SourceDefinitionKey> {
  key: Key
  presentation: SourcePresentation
  visibility: 'calculation-only' | 'visible'
}

const defineSource = <Key extends SourceDefinitionKey>(
  key: Key,
  label: string,
  locus: SourceDefinitionLocus,
  visibility: SourceDefinition<Key>['visibility'],
): SourceDefinition<Key> => ({ key, presentation: { label, locus }, visibility })

export const defineAgentBaseSource = (
  agentId: AgentId,
  label: string,
): SourceDefinition<Extract<SourceDefinitionKey, { kind: 'agent-base' }>> =>
  defineSource({ kind: 'agent-base', agentId }, label, 'identity', 'calculation-only')

export const defineAgentSource = (
  agentId: AgentId,
  sourceId: string,
  label: string,
  locus: Extract<SourceDefinitionLocus, 'identity' | 'core' | 'additional' | 'special' | 'ex-special'>,
): SourceDefinition<Extract<SourceDefinitionKey, { kind: 'agent-source' }>> =>
  defineSource({ kind: 'agent-source', agentId, sourceId }, label, locus, 'visible')

export const defineMindscapeSource = (
  agentId: AgentId,
  tier: RetainedMindscapeTier,
  label: string,
): SourceDefinition<Extract<SourceDefinitionKey, { kind: 'mindscape' }>> =>
  defineSource({ kind: 'mindscape', agentId, tier }, label, 'mindscape', 'visible')

export const defineWEngineBaseSource = (
  engineId: EngineId,
  label: string,
): SourceDefinition<Extract<SourceDefinitionKey, { kind: 'w-engine-base' }>> =>
  defineSource({ kind: 'w-engine-base', engineId }, label, 'w-engine', 'calculation-only')

export const defineWEngineSource = (
  engineId: EngineId,
  label: string,
): SourceDefinition<Extract<SourceDefinitionKey, { kind: 'w-engine' }>> =>
  defineSource({ kind: 'w-engine', engineId }, label, 'w-engine', 'visible')

export const defineDriveDiscSource = (
  discId: DiscId,
  piece: DriveDiscEffectPiece,
  label: string,
): SourceDefinition<Extract<SourceDefinitionKey, { kind: 'drive-disc' }>> =>
  defineSource(
    { kind: 'drive-disc', discId, piece },
    label,
    piece === '4-piece' ? 'disc-4pc' : 'disc-2pc',
    'visible',
  )

export const defineFixedMainSource = (
  slot: FixedMainSlot,
  statId: 'hpFlat' | 'atkFlat' | 'defFlat',
  label: string,
): SourceDefinition<Extract<SourceDefinitionKey, { kind: 'fixed-main' }>> =>
  defineSource({ kind: 'fixed-main', slot, statId }, label, 'calculation', 'calculation-only')

export const defineEditableMainSource = (
  slot: MainSlot,
  statId: MainStatId,
  label: string,
): SourceDefinition<Extract<SourceDefinitionKey, { kind: 'editable-main' }>> =>
  defineSource(
    { kind: 'editable-main', slot, statId },
    label,
    slot === 'slot4' ? 'disc-slot-4' : slot === 'slot5' ? 'disc-slot-5' : 'disc-slot-6',
    'visible',
  )

export const defineEffectiveSubstatSource = (
  position: EffectiveSubstatPosition,
  statId: SubstatId,
  label: string,
): SourceDefinition<Extract<SourceDefinitionKey, { kind: 'effective-substat' }>> =>
  defineSource({ kind: 'effective-substat', position, statId }, label, `substat-${position}` as const, 'visible')

export const defineCalculationSource = (
  calculationId: string,
  label: string,
  locus: Extract<SourceDefinitionLocus, 'calculation' | 'target'> = 'calculation',
): SourceDefinition<Extract<SourceDefinitionKey, { kind: 'calculation' }>> =>
  defineSource({ kind: 'calculation', calculationId }, label, locus, 'visible')
