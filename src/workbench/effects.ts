import type { ActionTarget } from './actions'
import type { PresentationDetail } from '../presentation'
import type { HighestOnlyComposition } from './calculation/relationships'
import type { SelectedSourceInstance } from './calculation/source-instance'
import type { SourceDefinitionKey, SourceDefinitionLocus } from './content/source-definitions'
import {
  DRIVE_DISC_FACTS,
  DRIVE_DISCS,
  equipmentEffectBaseValue,
  type AgentId,
  type DiscId,
  type EquipmentEffectFact,
} from './content'
import { effectAttributeForAgent } from './formula-policy'

export type SurfaceKey = 'initial' | 'combat' | 'fully'

export type SourceLocus = SourceDefinitionLocus

export interface ResultSource {
  label: string
  detail?: string
  detailParts?: readonly PresentationDetail[]
  ownerAgentId: AgentId
  locus: SourceLocus
  sourceKey?: SourceDefinitionKey
}

export interface ResolvedSetupInput {
  rawValue: number
  unit: '%' | ''
  source: ResultSource
}

export type EffectMetric =
  | 'maxHp' | 'atk' | 'def' | 'sheerForce' | 'impact'
  | 'critRate' | 'critDmg' | 'dmgBonus' | 'sheerDmgBonus'
  | 'resIgnore' | 'dazeBonus' | 'stunDmgMultiplier' | 'energyRegen'
  | 'penRatio' | 'defIgnore' | 'resReduction' | 'defReduction'
  | 'anomalyProficiency' | 'anomalyMastery' | 'anomalyDmgBonus'
  | 'anomalyBuildupBonus' | 'anomalyBuildupResReduction'
  | 'luminizeMultiplier' | 'refringeFactor'

export type EffectAttribute = 'Physical' | 'Fire' | 'Ice' | 'Electric' | 'Ether' | 'Wind'

export interface ResolvedCurrentEffect {
  metric: EffectMetric
  earliestSurface: SurfaceKey
  amount: number
  source: ResultSource
  sourceInstance: SelectedSourceInstance
  action?: ActionTarget
  eligibleAgentIds?: AgentId[]
  composition?: HighestOnlyComposition
  display?: { value: number; unit: '%' | '/s'; decimals: number }
  disclose?: boolean
}

export const source = (
  label: string,
  ownerAgentId: AgentId,
  locus: SourceLocus,
  detail?: string,
  sourceKey?: SourceDefinitionKey,
  detailParts?: ResultSource['detailParts'],
): ResultSource => ({ label, detail, detailParts, ownerAgentId, locus, sourceKey })

type InitialDiscStatModifier =
  | 'maxHp' | 'atk' | 'impact' | 'critRate' | 'critDmg'
  | 'dazeBonus' | 'energyRegen' | 'penRatio'
  | 'anomalyProficiency' | 'anomalyMastery'

type InitialDiscInputQuery =
  | { modifier: InitialDiscStatModifier }
  | { modifier: 'dmgBonus' }

function matchesInitialDiscInput(
  effect: EquipmentEffectFact,
  query: InitialDiscInputQuery,
  attribute: EffectAttribute | null,
): boolean {
  if (effect.modifier !== query.modifier) return false
  const scope = effect.scope
  if (scope?.recipient || scope?.actions || scope?.tags || scope?.condition) return false
  return query.modifier === 'dmgBonus'
    ? attribute !== null && scope?.attributes?.includes(attribute) === true
    : !scope?.attributes
}

function discSource(
  agentId: AgentId,
  discId: DiscId,
  ownerPiece: '4-piece' | '2-piece',
): ResultSource {
  return source(
    DRIVE_DISCS[discId].name,
    agentId,
    ownerPiece === '4-piece' ? 'disc-4pc' : 'disc-2pc',
    '2-piece',
    { kind: 'drive-disc', discId, piece: ownerPiece },
    [{ presentationId: 'disc-piece-2', label: '2-piece' }],
  )
}

/**
 * Candidate preparation needs the exact Initial ATK contribution from each
 * selected set. The chosen 4-piece owns its set's 2-piece effect too; scoped,
 * conditional, and action effects are not Initial stat inputs.
 */
export function selectedDiscTwoPieceInputs(
  setup: {
    fourPieceId: DiscId | null
    twoPieceId: DiscId | null
  },
  agentId: AgentId,
  query: InitialDiscInputQuery,
): ResolvedSetupInput[] {
  const attribute = query.modifier === 'dmgBonus'
    ? effectAttributeForAgent(agentId)
    : null
  return ([
    { ownerPiece: '4-piece' as const, discId: setup.fourPieceId },
    { ownerPiece: '2-piece' as const, discId: setup.twoPieceId },
  ]).flatMap(({ ownerPiece, discId }) => {
    if (discId === null) return []
    return (Object.values(DRIVE_DISC_FACTS[discId].twoPiece) as EquipmentEffectFact[])
      .filter((effect) => matchesInitialDiscInput(effect, query, attribute))
      .map((effect) => {
        if (effect.unit === '/s') {
          throw new Error(`Per-second effect cannot be an Initial Disc stat input: ${discId}`)
        }
        return {
          rawValue: equipmentEffectBaseValue(effect),
          unit: effect.unit,
          source: discSource(agentId, discId, ownerPiece),
        }
      })
  })
}
