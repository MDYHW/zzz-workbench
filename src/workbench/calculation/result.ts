import type { AgentId } from '../content'
import type { EffectMetric, ResultSource, SurfaceKey } from '../effects'
import type { ActionOutcome, ActionTag, ActionTarget } from '../actions'
import type { SelectedSourceInstance } from './source-instance'

function selectedSourceDetail(
  source: SelectedSourceInstance,
): { presentationId: string; label: string } | undefined {
  const { key } = source.definition
  switch (key.kind) {
    case 'w-engine-base':
    case 'w-engine':
      return source.selection?.kind === 'refinement'
        ? { presentationId: 'w-engine-refinement', label: `W${source.selection.refinement}` }
        : undefined
    case 'mindscape':
      return { presentationId: 'mindscape-tier', label: `M${key.tier}` }
    case 'drive-disc':
      return {
        presentationId: key.piece === '4-piece' ? 'disc-piece-4' : 'disc-piece-2',
        label: key.piece,
      }
    default:
      return undefined
  }
}

export function resultSourceFor(
  source: SelectedSourceInstance,
  detail?: string,
  detailPresentationId?: string,
): ResultSource {
  const selectedDetail = selectedSourceDetail(source)
  const detailParts = [
    selectedDetail,
    detail && detailPresentationId
      ? { presentationId: detailPresentationId, label: detail }
      : undefined,
  ].filter((part): part is { presentationId: string; label: string } => Boolean(part))
  const selectedRole = source.selection?.kind === 'drive-disc'
    ? source.selection.selectedRole
    : undefined
  const locus = selectedRole
    ? selectedRole === '4-piece' ? 'disc-4pc' : 'disc-2pc'
    : source.definition.presentation.locus
  return {
    label: source.definition.presentation.label,
    ownerAgentId: source.holderAgentId,
    locus,
    sourceKey: source.definition.key,
    detail: [selectedDetail?.label, detail].filter(Boolean).join(' · ') || undefined,
    detailParts: detailParts.length > 0 ? detailParts : undefined,
  }
}

export interface Contribution extends ResultSource {
  amount: number
  notation?: 'surface-value' | 'equal-nonstack-origin'
  referenceValue?: number
  display?: {
    value: number
    unit: string
    decimals: number
  }
}

export interface GaugeResult {
  source: ResultSource
  basisLabel: string
  basisPresentationId?: string
  current: number
  threshold?: number
  cap?: number
  outputLabel: string
  outputPresentationId?: string
  outputValue: number
  outputCap?: number
  outputUnit: string
  additionalOutputs?: Array<{
    presentationId?: string
    label: string
    value: number
    cap?: number
    unit: string
  }>
  presentation?: 'scale'
  decimals?: {
    current?: number
    threshold?: number
    cap?: number
    output?: number
    outputCap?: number
  }
}

export interface ResultMetric {
  id: EffectMetric
  label: string
  unit: string
  decimals: number
  values: Record<SurfaceKey, number>
  breakdown: Record<SurfaceKey, Contribution[]>
  gauges: GaugeResult[]
}

export interface ActionModifier {
  id: string
  /** Internal identity used when a later shared consumer extends this action row. */
  target?: ActionTarget
  outcomes: ActionOutcome[]
  tags: ActionTag[]
  metricId: EffectMetric
  baseActionId?: string
  values: Record<SurfaceKey, number>
  breakdown: Record<SurfaceKey, Contribution[]>
  standaloneMetric?: Pick<ResultMetric, 'label' | 'unit' | 'decimals' | 'values'> & {
    parentMetricId?: EffectMetric
  }
}

export interface ResultOperation {
  presentationId?: string
  label: string
  source: ResultSource
  value: number
  unit: string
  presentation?: 'scale'
}

export interface AgentResult {
  agentId: AgentId
  metrics: ResultMetric[]
  actionModifiers: ActionModifier[]
  operations: ResultOperation[]
}

export interface PartyResult {
  agents: AgentResult[]
}
