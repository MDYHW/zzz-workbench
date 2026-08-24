import type { AgentId, MainStatId, Refinement, SubstatId } from '../content/types'
import type {
  AppliedPartySlot,
  DriveDiscEffectPiece,
  EffectiveSubstatPosition,
  RetainedMindscapeTier,
  SourceDefinition,
  SourceDefinitionKey,
} from '../content/source-definitions'

export type RefinementSelection = { kind: 'refinement'; refinement: Refinement }
export type MindscapeSelection = { kind: 'mindscape'; selectedTier: RetainedMindscapeTier }
export type DriveDiscSelection = {
  kind: 'drive-disc'
  selectedRole: DriveDiscEffectPiece
  effectPiece: DriveDiscEffectPiece
}
export type MainStatSelection = { kind: 'main-stat'; statId: MainStatId }
export type EffectiveSubstatSelection = {
  kind: 'effective-substat'
  position: EffectiveSubstatPosition
  statId: SubstatId
  count: number
}
export type SourceSelection =
  | RefinementSelection
  | MindscapeSelection
  | DriveDiscSelection
  | MainStatSelection
  | EffectiveSubstatSelection

type DefinitionFor<Kind extends SourceDefinitionKey['kind']> =
  Kind extends SourceDefinitionKey['kind']
    ? SourceDefinition<Extract<SourceDefinitionKey, { kind: Kind }>>
    : never
type UnselectedDefinition = DefinitionFor<
  'agent-base' | 'agent-source' | 'fixed-main' | 'calculation'
>
type RefinementDefinition = DefinitionFor<'w-engine-base' | 'w-engine'>
type MindscapeDefinition = DefinitionFor<'mindscape'>
type DriveDiscDefinition = DefinitionFor<'drive-disc'>
type MainStatDefinition = DefinitionFor<'editable-main'>
type EffectiveSubstatDefinition = DefinitionFor<'effective-substat'>

export interface SelectedSourceInstance<
  Definition extends SourceDefinition = SourceDefinition,
  Selection extends SourceSelection | undefined = SourceSelection | undefined,
> {
  definition: Definition
  holderAgentId: AgentId
  appliedPartySlot: AppliedPartySlot
  selection: Selection
}

function samePrimitiveRecord(
  left: object,
  right: object,
): boolean {
  const leftRecord = left as Readonly<Record<string, unknown>>
  const rightRecord = right as Readonly<Record<string, unknown>>
  const leftEntries = Object.entries(leftRecord)
  return leftEntries.length === Object.keys(rightRecord).length
    && leftEntries.every(([key, value]) => rightRecord[key] === value)
}

export function sameSelectedSourceInstance(
  left: SelectedSourceInstance,
  right: SelectedSourceInstance,
): boolean {
  return left.holderAgentId === right.holderAgentId
    && left.appliedPartySlot === right.appliedPartySlot
    && samePrimitiveRecord(left.definition.key, right.definition.key)
    && (
      left.selection === undefined
        ? right.selection === undefined
        : right.selection !== undefined
          && samePrimitiveRecord(left.selection, right.selection)
    )
}

export function selectSource<Definition extends UnselectedDefinition>(
  definition: Definition,
  holderAgentId: AgentId,
  appliedPartySlot: AppliedPartySlot,
): SelectedSourceInstance<Definition, undefined>
export function selectSource<Definition extends RefinementDefinition>(
  definition: Definition,
  holderAgentId: AgentId,
  appliedPartySlot: AppliedPartySlot,
  selection: RefinementSelection,
): SelectedSourceInstance<Definition, RefinementSelection>
export function selectSource<Definition extends MindscapeDefinition>(
  definition: Definition,
  holderAgentId: AgentId,
  appliedPartySlot: AppliedPartySlot,
  selection: MindscapeSelection,
): SelectedSourceInstance<Definition, MindscapeSelection>
export function selectSource<Definition extends DriveDiscDefinition>(
  definition: Definition,
  holderAgentId: AgentId,
  appliedPartySlot: AppliedPartySlot,
  selection: DriveDiscSelection,
): SelectedSourceInstance<Definition, DriveDiscSelection>
export function selectSource<Definition extends MainStatDefinition>(
  definition: Definition,
  holderAgentId: AgentId,
  appliedPartySlot: AppliedPartySlot,
  selection: MainStatSelection,
): SelectedSourceInstance<Definition, MainStatSelection>
export function selectSource<Definition extends EffectiveSubstatDefinition>(
  definition: Definition,
  holderAgentId: AgentId,
  appliedPartySlot: AppliedPartySlot,
  selection: EffectiveSubstatSelection,
): SelectedSourceInstance<Definition, EffectiveSubstatSelection>
export function selectSource(
  definition: SourceDefinition,
  holderAgentId: AgentId,
  appliedPartySlot: AppliedPartySlot,
  selection?: SourceSelection,
): SelectedSourceInstance {
  validateSelection(definition, selection)
  return { definition, holderAgentId, appliedPartySlot, selection }
}

function validateSelection(
  definition: SourceDefinition,
  selection: SourceSelection | undefined,
): void {
  const key = definition.key
  switch (key.kind) {
    case 'w-engine-base':
    case 'w-engine':
      if (selection?.kind !== 'refinement') throw new Error('W-Engine sources require refinement')
      return
    case 'mindscape':
      if (selection?.kind !== 'mindscape' || selection.selectedTier < key.tier) {
        throw new Error('Mindscape sources require a selected tier at or above the retained tier')
      }
      return
    case 'drive-disc':
      if (selection?.kind !== 'drive-disc' || selection.effectPiece !== key.piece) {
        throw new Error('Drive Disc source selection must identify the retained effect piece')
      }
      return
    case 'editable-main':
      if (selection?.kind !== 'main-stat' || selection.statId !== key.statId) {
        throw new Error('Editable main source selection must match its stat definition')
      }
      return
    case 'effective-substat':
      if (
        selection?.kind !== 'effective-substat'
        || selection.position !== key.position
        || selection.statId !== key.statId
      ) {
        throw new Error('Effective substat source selection must match its position and stat')
      }
      return
    case 'agent-base':
    case 'agent-source':
    case 'fixed-main':
    case 'calculation':
      if (selection !== undefined) throw new Error(`${key.kind} sources do not have selection metadata`)
  }
}
