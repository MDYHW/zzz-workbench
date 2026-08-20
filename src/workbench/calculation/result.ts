import type { AgentId } from '../content'
import type { EffectMetric, ResultSource, SurfaceKey } from '../effects'
import type { ActionOutcome, ActionTag, ActionTarget } from '../actions'

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
  current: number
  threshold?: number
  cap: number
  outputLabel: string
  outputValue: number
  outputCap?: number
  outputUnit: string
  additionalOutputs?: Array<{
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
  gauge?: GaugeResult
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
}

export interface ResultOperation {
  id: string
  label: string
  source: ResultSource
  surface: 'combat' | 'fully'
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
