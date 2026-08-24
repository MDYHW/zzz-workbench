import { Fragment, useEffect, useMemo, useState } from 'react'
import { ADMITTED_AGENTS, type AgentId } from '../workbench/content'
import { actionOutcomeLabel, actionTagLabel } from '../workbench/actions'
import type {
  ActionModifier,
  AgentResult,
  Contribution,
  GaugeResult,
  ResultMetric,
  ResultOperation,
  ResultSource,
  SurfaceKey,
} from '../workbench/calculate'
import {
  agentToneForParty,
  sourceToneEvents,
  type SourceInteractionProps,
} from './sourceInteraction'

interface ResultPanelProps extends SourceInteractionProps {
  agentResult: AgentResult | null
  onTargetStunDmgMultiplierChange?: (value: number) => void
  partyAgentIds: readonly AgentId[]
  targetStunDmgMultiplier?: number
}

const surfaceLabels: Record<SurfaceKey, string> = {
  initial: 'Initial',
  combat: 'Combat',
  fully: 'Fully enabled',
}

const allSurfaces: SurfaceKey[] = ['initial', 'combat', 'fully']

function formatNumber(value: number, decimals: number): string {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value)
}

function formatValue(value: number, unit: string, decimals: number): string {
  return `${formatNumber(value, decimals)}${unit}`
}

function formatOperationValue(
  value: number,
  unit: string,
  decimals: number,
  presentation?: 'scale',
): string {
  return presentation === 'scale'
    ? `\u00D7${formatNumber(value, decimals)}`
    : `+${formatNumber(value, decimals)}${unit}`
}

function hasCurrentConsumer(metric: ResultMetric, actions: ActionModifier[]): boolean {
  const hasValue = allSurfaces.some(
    (surface) => Math.abs(metric.values[surface]) > 0.000_001,
  )
  const hasBreakdown = allSurfaces.some(
    (surface) => metric.breakdown[surface].length > 0,
  )

  return hasValue || hasBreakdown || metric.gauges.length > 0 || actions.length > 0
}

function currentMetricRows(result: AgentResult) {
  return result.metrics
    .map((metric) => ({
      metric,
      actions: result.actionModifiers.filter((row) => row.metricId === metric.id),
    }))
    .filter(({ metric, actions }) => hasCurrentConsumer(metric, actions))
}

function currentStandaloneActionRows(result: AgentResult) {
  const visibleMetricIds = new Set(result.metrics.map(({ id }) => id))
  const grouped = new Map<ResultMetric['id'], {
    metric: ResultMetric
    actions: ActionModifier[]
  }>()

  for (const action of result.actionModifiers) {
    if (visibleMetricIds.has(action.metricId) || !action.standaloneMetric) continue
    const current = grouped.get(action.metricId) ?? {
      metric: {
        id: action.metricId,
        ...action.standaloneMetric,
        breakdown: { initial: [], combat: [], fully: [] },
        gauges: [],
      },
      actions: [],
    }
    current.actions.push(action)
    grouped.set(action.metricId, current)
  }

  return [...grouped.values()]
}

function formatContributionValue(
  amount: number,
  display: Contribution['display'],
  fallbackUnit: string,
  notation: Contribution['notation'],
  referenceValue: Contribution['referenceValue'],
): string {
  const value = referenceValue ?? display?.value ?? amount
  const unit = display?.unit ?? fallbackUnit
  const decimals = display?.decimals ?? 1
  if (notation === 'equal-nonstack-origin') {
    return `same ${formatNumber(value, decimals)}${unit}`
  }
  const positivePrefix = notation === 'surface-value' || value < 0 ? '' : '+'
  return `${positivePrefix}${formatNumber(value, decimals)}${unit}`
}

function sourceLabel(
  source: ResultSource,
  currentAgentId: AgentResult['agentId'],
): string {
  if (source.ownerAgentId === currentAgentId) return source.label
  const provider = ADMITTED_AGENTS.find((agent) => agent.id === source.ownerAgentId)!
  return [provider.name, source.label].join(' \u00B7 ')
}

function sourceTone(
  source: ResultSource,
  currentAgentId: AgentResult['agentId'],
  partyAgentIds: readonly AgentId[],
): string {
  if (source.locus === 'target') return 'target'
  if (source.locus === 'identity' || source.ownerAgentId !== currentAgentId) {
    return agentToneForParty(source.ownerAgentId, partyAgentIds)
  }
  return source.locus
}

function sourceIdentity(source: ResultSource): string {
  return [source.ownerAgentId, source.locus, source.label, source.detail ?? ''].join('|')
}

function toneClass(tone: string, activeSourceTone: string | null): string {
  return `source-link source-tone--${tone}${activeSourceTone === tone ? ' is-source-active' : ''}`
}

interface GroupedSource {
  source: ResultSource
  amounts: Partial<Record<SurfaceKey, number>>
  displays: Partial<Record<SurfaceKey, NonNullable<Contribution['display']>>>
  notations: Partial<Record<SurfaceKey, NonNullable<Contribution['notation']>>>
  referenceValues: Partial<Record<SurfaceKey, number>>
}

function groupContributions(
  breakdown: Record<SurfaceKey, Contribution[]>,
  shownSurfaces: SurfaceKey[],
): GroupedSource[] {
  const grouped = new Map<string, GroupedSource>()

  for (const surface of shownSurfaces) {
    for (const item of breakdown[surface]) {
      const key = sourceIdentity(item)
      const row = grouped.get(key) ?? {
        source: {
          label: item.label,
          detail: item.detail,
          ownerAgentId: item.ownerAgentId,
          locus: item.locus,
        },
        amounts: {},
        displays: {},
        notations: {},
        referenceValues: {},
      }
      row.amounts[surface] = (row.amounts[surface] ?? 0) + item.amount
      if (item.display) {
        const current = row.displays[surface]
        row.displays[surface] = current
          ? {
              value: current.value + item.display.value,
              unit: item.display.unit,
              decimals: Math.max(current.decimals, item.display.decimals),
            }
          : item.display
      }
      if (item.notation) row.notations[surface] = item.notation
      if (item.referenceValue !== undefined) row.referenceValues[surface] = item.referenceValue
      grouped.set(key, row)
    }
  }

  return [...grouped.values()]
}

interface SourceMatrixProps extends SourceInteractionProps {
  agentId: AgentResult['agentId']
  breakdown: Record<SurfaceKey, Contribution[]>
  label: string
  partyAgentIds: readonly AgentId[]
  shownSurfaces?: SurfaceKey[]
  sourceHeading?: string
  unit: string
}

function SourceMatrix({
  activeSourceTone,
  agentId,
  breakdown,
  label,
  onSourceToneChange,
  partyAgentIds,
  shownSurfaces = allSurfaces,
  sourceHeading = 'Source',
  unit,
}: SourceMatrixProps) {
  const rows = useMemo(
    () => groupContributions(breakdown, shownSurfaces),
    [breakdown, shownSurfaces],
  )

  if (rows.length === 0) return null

  return (
    <div className="source-matrix-wrap">
      <table className="source-matrix" aria-label={label}>
        <colgroup>
          <col className="result-label-track" />
          <col className="result-surface-track" span={3} />
        </colgroup>
        <thead>
          <tr>
            <th scope="col">{sourceHeading}</th>
            {shownSurfaces.map((surface) => (
              <th scope="col" key={surface}>{surfaceLabels[surface]}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const tone = sourceTone(row.source, agentId, partyAgentIds)
            return (
              <tr
                key={sourceIdentity(row.source)}
                className={toneClass(tone, activeSourceTone)}
                data-source-tone={tone}
                {...sourceToneEvents(tone, onSourceToneChange)}
              >
                <th scope="row" tabIndex={0}>
                  <i aria-hidden="true" />
                  <span className="source-copy">
                    <span>{sourceLabel(row.source, agentId)}</span>
                    {row.source.detail && (
                      <small>{row.source.detail}</small>
                    )}
                  </span>
                </th>
                {shownSurfaces.map((surface) => (
                  <td key={surface}>
                    {row.amounts[surface] === undefined
                      ? null
                      : <b>{formatContributionValue(row.amounts[surface]!, row.displays[surface], unit, row.notations[surface], row.referenceValues[surface])}</b>}
                  </td>
                ))}
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

function Gauge({
  activeSourceTone,
  agentId,
  gauge,
  onSourceToneChange,
  partyAgentIds,
}: {
  agentId: AgentResult['agentId']
  gauge: GaugeResult
  partyAgentIds: readonly AgentId[]
} & SourceInteractionProps) {
  const boundary = gauge.cap ?? gauge.threshold
  if (boundary === undefined) throw new Error('A gauge requires a cap or threshold boundary')
  const progress = Math.min(gauge.current / boundary * 100, 100)
  const threshold = gauge.threshold === undefined ? undefined : gauge.threshold / boundary * 100
  const currentDecimals = gauge.decimals?.current ?? 1
  const thresholdDecimals = gauge.decimals?.threshold ?? 1
  const capDecimals = gauge.decimals?.cap ?? 0
  const outputDecimals = gauge.decimals?.output ?? (gauge.presentation === 'scale' ? 2 : 1)
  const outputCapDecimals = gauge.decimals?.outputCap ?? 0
  const outputs = [{
    label: gauge.outputLabel,
    value: gauge.outputValue,
    cap: gauge.outputCap,
    unit: gauge.outputUnit,
  }, ...(gauge.additionalOutputs ?? [])]
  const isThresholdOnlyActive = gauge.threshold !== undefined
    && (gauge.cap === undefined || gauge.cap === gauge.threshold)
    && gauge.current >= gauge.threshold
  const thresholdDescription = gauge.threshold === undefined
    ? ''
    : `, threshold ${formatNumber(gauge.threshold, thresholdDecimals)}${isThresholdOnlyActive ? ', Active' : ''}`
  const outputDescription = outputs.map((output) => {
    const value = formatOperationValue(
      output.value,
      output.unit,
      outputDecimals,
      gauge.presentation,
    )
    const cap = output.cap === undefined
      ? ''
      : `, cap ${formatNumber(output.cap, outputCapDecimals)}${output.unit}`
    return `${output.label}: ${value}${cap}`
  }).join('; ')
  const capDescription = gauge.cap === undefined
    ? ''
    : `, cap ${formatNumber(gauge.cap, capDecimals)}`
  const description = `${gauge.basisLabel}: current ${formatNumber(gauge.current, currentDecimals)}${capDescription}${thresholdDescription}; ${outputDescription}`
  const tone = sourceTone(gauge.source, agentId, partyAgentIds)

  return (
    <div
      className={`gauge ${toneClass(tone, activeSourceTone)}`}
      data-source-tone={tone}
      role="group"
      aria-label={description}
      {...sourceToneEvents(tone, onSourceToneChange)}
    >
      <small className="gauge__source" tabIndex={0}>
        <span>{sourceLabel(gauge.source, agentId)}</span>
        {gauge.source.detail && <em>{gauge.source.detail}</em>}
      </small>
      <div className="gauge__labels">
        <span>{gauge.basisLabel}</span>
        <strong>
          {formatNumber(gauge.current, currentDecimals)}
          {gauge.cap === undefined ? '' : ` / ${formatNumber(gauge.cap, capDecimals)}`}
        </strong>
      </div>
      {gauge.threshold !== undefined && !isThresholdOnlyActive && (
        <small className="gauge__threshold-copy">Threshold {formatNumber(gauge.threshold, thresholdDecimals)}</small>
      )}
      <div className="gauge__track" aria-hidden="true">
        <span className="gauge__fill" style={{ width: `${isThresholdOnlyActive ? 100 : progress}%` }}>
          {isThresholdOnlyActive ? 'Active' : null}
        </span>
        {threshold !== undefined && !isThresholdOnlyActive && <i className="gauge__threshold" style={{ left: `${threshold}%` }} />}
      </div>
      {outputs.map((output) => (
        <div className="gauge__output" key={output.label}>
          <span>{output.label}</span>
          <strong>
            {formatOperationValue(
              output.value,
              output.unit,
              outputDecimals,
              gauge.presentation,
            )}
            {output.cap === undefined ? '' : ` / ${formatNumber(output.cap, outputCapDecimals)}${output.unit}`}
          </strong>
        </div>
      ))}
    </div>
  )
}

function TargetStunDmgEditor({
  activeSourceTone,
  agentId,
  gauge,
  onSourceToneChange,
  onTargetStunDmgMultiplierChange,
  partyAgentIds,
  targetStunDmgMultiplier,
}: {
  agentId: AgentResult['agentId']
  gauge: GaugeResult
  onTargetStunDmgMultiplierChange: (value: number) => void
  partyAgentIds: readonly AgentId[]
  targetStunDmgMultiplier: number
} & SourceInteractionProps) {
  const [draft, setDraft] = useState(String(targetStunDmgMultiplier))
  const constraintId = 'target-stun-dmg-multiplier-constraint'
  const validDraft = /^\d+$/.test(draft)
    && Number.isSafeInteger(Number(draft))
    && Number(draft) >= 100

  useEffect(() => {
    setDraft(String(targetStunDmgMultiplier))
  }, [targetStunDmgMultiplier])

  const restoreCommittedValue = () => setDraft(String(targetStunDmgMultiplier))

  return (
    <section className="target-stun-context" aria-label="Target Stun DMG Multiplier context">
      <div
        className={`target-stun-editor ${toneClass('target', activeSourceTone)}`}
        data-source-tone="target"
        {...sourceToneEvents('target', onSourceToneChange)}
      >
        <label htmlFor="target-stun-dmg-multiplier">
          <span>Target Stun DMG Multiplier</span>
          <small>Result context</small>
        </label>
        <span className="target-stun-editor__control">
          <input
            aria-label="Target Stun DMG Multiplier"
            aria-describedby={constraintId}
            aria-invalid={validDraft ? undefined : true}
            id="target-stun-dmg-multiplier"
            inputMode="numeric"
            onBlur={restoreCommittedValue}
            onChange={(event) => {
              const nextDraft = event.currentTarget.value
              setDraft(nextDraft)
              if (/^\d+$/.test(nextDraft)) {
                const nextValue = Number(nextDraft)
                if (Number.isSafeInteger(nextValue) && nextValue >= 100) {
                  onTargetStunDmgMultiplierChange(nextValue)
                }
              }
            }}
            onKeyDown={(event) => {
              if (event.key !== 'Enter') return
              event.preventDefault()
              restoreCommittedValue()
            }}
            pattern="[0-9]*"
            type="text"
            value={draft}
          />
          <span aria-hidden="true">%</span>
        </span>
        <small id={constraintId}>Whole percentage, 100 or higher</small>
      </div>
      <Gauge
        activeSourceTone={activeSourceTone}
        agentId={agentId}
        gauge={gauge}
        onSourceToneChange={onSourceToneChange}
        partyAgentIds={partyAgentIds}
      />
    </section>
  )
}

function ActionRows({
  actions,
  activeSourceTone,
  agentId,
  metric,
  onSourceToneChange,
  partyAgentIds,
  standalone = false,
}: {
  actions: ActionModifier[]
  agentId: AgentResult['agentId']
  metric: ResultMetric
  partyAgentIds: readonly AgentId[]
  standalone?: boolean
} & SourceInteractionProps) {
  const [expandedActions, setExpandedActions] = useState<Set<string>>(new Set())

  if (actions.length === 0) return null

  const actionById = new Map(actions.map((action) => [action.id, action]))
  const toggleAction = (actionId: string) => setExpandedActions((current) => {
    const next = new Set(current)
    if (next.has(actionId)) next.delete(actionId)
    else next.add(actionId)
    return next
  })

  return (
    <section className="action-differences" aria-label={`${metric.label} outcomes`}>
      <h5 className="hierarchy-caption">{standalone ? `${metric.label} outcomes` : 'Action outcomes'}</h5>
      <div className="action-matrix-wrap">
        <table className="source-matrix action-matrix" aria-label={`${metric.label} outcome values`}>
          <colgroup>
            <col className="action-hierarchy-track" />
            <col className="action-label-track" />
            <col className="result-surface-track" span={3} />
          </colgroup>
          <thead>
            <tr>
              <th className="action-hierarchy-cell" aria-hidden="true" />
              <th scope="col">Outcome</th>
              {allSurfaces.map((surface) => <th scope="col" key={surface}>{surfaceLabels[surface]}</th>)}
            </tr>
          </thead>
          {actions.map((action) => {
            const actionKey = `${metric.id}-${action.id}`
            const isExpanded = expandedActions.has(actionKey)
            const sourceRows = groupContributions(action.breakdown, allSurfaces)
            const sourceRegionId = `action-sources-${agentId}-${metric.id}-${action.id}`
            const parentValues = action.baseActionId
              ? actionById.get(action.baseActionId)?.values ?? metric.values
              : metric.values
            const actionLabels = action.outcomes.map(actionOutcomeLabel)
            const actionName = action.tags.length
              ? action.tags.map(actionTagLabel).join(', ')
              : actionLabels.join(', ')

            return (
              <Fragment key={action.id}>
                <tbody className="action-outcome-group">
                  <tr className={action.baseActionId ? 'action-outcome--variant' : undefined}>
                    <td className="action-hierarchy-cell" aria-hidden="true" />
                    <th scope="row">
                      {sourceRows.length > 0 ? (
                        <button
                          type="button"
                          className="action-row-toggle"
                          aria-controls={sourceRegionId}
                          aria-expanded={isExpanded}
                          aria-label={`${isExpanded ? 'Hide' : 'Show'} sources for ${actionName}`}
                          onClick={() => toggleAction(actionKey)}
                        >
                          {action.tags.includes('aftershock')
                            ? <span className="action-tag" aria-label="Aftershock">AFTERSHOCK</span>
                            : <span className="action-lines">{actionLabels.map((label) => <span key={label}>{label}</span>)}</span>}
                          <i aria-hidden="true">{isExpanded ? '\u2212' : '+'}</i>
                        </button>
                      ) : (
                        action.tags.includes('aftershock')
                          ? <span className="action-tag" aria-label="Aftershock">AFTERSHOCK</span>
                          : <span className="action-lines">{actionLabels.map((label) => <span key={label}>{label}</span>)}</span>
                      )}
                    </th>
                    {allSurfaces.map((surface) => (
                      <td key={surface}>
                        {Math.abs(action.values[surface] - parentValues[surface]) < 0.0001
                          ? <span className="action-result--empty">{'—'}</span>
                          : <b className="action-result-value">{formatValue(
                            action.values[surface],
                            metric.unit,
                            metric.decimals,
                          )}</b>}
                      </td>
                    ))}
                  </tr>
                </tbody>
                {sourceRows.length > 0 && (
                  <tbody className="action-source-detail" id={sourceRegionId} hidden={!isExpanded}>
                    {sourceRows.map((row) => {
                      const tone = sourceTone(row.source, agentId, partyAgentIds)
                      return (
                        <tr
                          key={sourceIdentity(row.source)}
                          className={toneClass(tone, activeSourceTone)}
                          data-source-tone={tone}
                          {...sourceToneEvents(tone, onSourceToneChange)}
                        >
                          <td className="action-hierarchy-cell" aria-hidden="true" />
                          <th scope="row" tabIndex={0}>
                            <span className="action-source-arrow" aria-hidden="true">{'↳'}</span>
                            <i aria-hidden="true" />
                            <span className="source-copy">
                              <span>{sourceLabel(row.source, agentId)}</span>
                              {row.source.detail && <small>{row.source.detail}</small>}
                            </span>
                          </th>
                          {allSurfaces.map((surface) => (
                            <td key={surface}>
                              {row.amounts[surface] === undefined
                                ? null
                                : <b>{formatContributionValue(row.amounts[surface]!, row.displays[surface], metric.unit, row.notations[surface], row.referenceValues[surface])}</b>}
                            </td>
                          ))}
                        </tr>
                      )
                    })}
                  </tbody>
                )}
              </Fragment>
            )
          })}
        </table>
      </div>
    </section>
  )
}
function Operations({
  activeSourceTone,
  agentId,
  onSourceToneChange,
  operations,
  partyAgentIds,
}: {
  agentId: AgentResult['agentId']
  operations: ResultOperation[]
  partyAgentIds: readonly AgentId[]
} & SourceInteractionProps) {
  if (operations.length === 0) return null

  return (
    <section className="action-differences" aria-label="Agent operations">
      <h5>Operations</h5>
      <ul className="action-source-list">
        {operations.map((operation, operationIndex) => {
          const tone = sourceTone(operation.source, agentId, partyAgentIds)
          const value = formatOperationValue(
            operation.value,
            operation.unit,
            operation.presentation === 'scale' ? 2 : 1,
            operation.presentation,
          )
          const operationName = [
            surfaceLabels[operation.surface],
            `${operation.label} \u00B7 ${sourceLabel(operation.source, agentId)}`,
            operation.source.detail,
            value,
          ].filter(Boolean).join(' ')
          return (
            <li
              aria-label={operationName}
              className={toneClass(tone, activeSourceTone)}
              data-source-tone={tone}
              key={`${operation.source.ownerAgentId}:${operation.source.locus}:${operation.label}:${operation.surface}:${operationIndex}`}
              tabIndex={0}
              {...sourceToneEvents(tone, onSourceToneChange)}
            >
              <span>
                <small>{surfaceLabels[operation.surface]}</small>
                {operation.label} {'\u00B7'} {sourceLabel(operation.source, agentId)}
                {operation.source.detail && <em>{operation.source.detail}</em>}
              </span>
              <b>{value}</b>
            </li>
          )
        })}
      </ul>
    </section>
  )
}

function MetricDetail({
  actions,
  activeSourceTone,
  agentId,
  metric,
  onSourceToneChange,
  onTargetStunDmgMultiplierChange,
  partyAgentIds,
  targetStunDmgMultiplier,
}: {
  actions: ActionModifier[]
  agentId: AgentResult['agentId']
  metric: ResultMetric
  onTargetStunDmgMultiplierChange?: (value: number) => void
  partyAgentIds: readonly AgentId[]
  targetStunDmgMultiplier?: number
} & SourceInteractionProps) {
  const [targetStunGauge] = metric.gauges
  const editsTargetStun = agentId === 'yeShunguang'
    && metric.id === 'stunDmgMultiplier'
    && metric.gauges.length === 1
    && targetStunGauge
    && targetStunDmgMultiplier !== undefined
    && onTargetStunDmgMultiplierChange

  return (
    <div className="breakdown-grid">
      <SourceMatrix
        activeSourceTone={activeSourceTone}
        agentId={agentId}
        breakdown={metric.breakdown}
        label={`${metric.label} source contributions`}
        onSourceToneChange={onSourceToneChange}
        partyAgentIds={partyAgentIds}
        sourceHeading={actions.length > 0 ? 'Common source' : 'Source'}
        unit={metric.unit}
      />
      {editsTargetStun ? (
        <TargetStunDmgEditor
          activeSourceTone={activeSourceTone}
          agentId={agentId}
          gauge={targetStunGauge}
          onSourceToneChange={onSourceToneChange}
          onTargetStunDmgMultiplierChange={onTargetStunDmgMultiplierChange!}
          partyAgentIds={partyAgentIds}
          targetStunDmgMultiplier={targetStunDmgMultiplier!}
        />
      ) : metric.gauges.map((gauge, index) => (
        <Gauge
          activeSourceTone={activeSourceTone}
          agentId={agentId}
          gauge={gauge}
          key={`${gauge.source.label}-${gauge.source.detail ?? ''}-${index}`}
          onSourceToneChange={onSourceToneChange}
          partyAgentIds={partyAgentIds}
        />
      ))}
      <ActionRows
        actions={actions}
        activeSourceTone={activeSourceTone}
        agentId={agentId}
        metric={metric}
        onSourceToneChange={onSourceToneChange}
        partyAgentIds={partyAgentIds}
      />
    </div>
  )
}

export function ResultPanel({
  activeSourceTone,
  agentResult,
  onSourceToneChange,
  onTargetStunDmgMultiplierChange,
  partyAgentIds,
  targetStunDmgMultiplier,
}: ResultPanelProps) {
  const [expanded, setExpanded] = useState<Set<ResultMetric['id']>>(new Set())
  const metricRows = useMemo(
    () => agentResult ? currentMetricRows(agentResult) : [],
    [agentResult],
  )
  const standaloneActionRows = useMemo(
    () => agentResult ? currentStandaloneActionRows(agentResult) : [],
    [agentResult],
  )

  useEffect(() => {
    const visibleIds = new Set(metricRows.map(({ metric }) => metric.id))
    setExpanded((current) => {
      const next = new Set([...current].filter((id) => visibleIds.has(id)))
      return next.size === current.size ? current : next
    })
  }, [metricRows])

  if (!agentResult) {
    return (
      <section className="result-panel result-panel--empty" aria-label="Empty Result">
        <h2>Result</h2>
        <p>Complete every required setup selection to calculate Result.</p>
      </section>
    )
  }

  const toggle = (metricId: ResultMetric['id']) => setExpanded((current) => {
    const next = new Set(current)
    if (next.has(metricId)) next.delete(metricId)
    else next.add(metricId)
    return next
  })
  const agentName = ADMITTED_AGENTS.find((agent) => agent.id === agentResult.agentId)!.name

  return (
    <section className="result-panel" aria-labelledby="result-heading">
      <header className="result-heading">
        <span className="eyebrow">RESULT</span>
        <h2 className="sr-only" id="result-heading">{agentName} Result</h2>
      </header>
      <article className={`agent-result agent-result--${agentResult.agentId}`}>
        <div className="result-table-wrap">
          <table>
            <colgroup>
              <col className="result-label-track" />
              <col className="result-surface-track" span={3} />
            </colgroup>
            <thead>
              <tr><th scope="col">Quantity</th><th scope="col">Initial</th><th scope="col">Combat</th><th scope="col">Fully enabled</th></tr>
            </thead>
            <tbody>
              {metricRows.map(({ metric, actions }) => {
                const isExpanded = expanded.has(metric.id)
                const hasDetail = Boolean(
                  metric.gauges.length > 0
                    || actions.length
                    || allSurfaces.some((surface) => metric.breakdown[surface].length > 0),
                )

                return (
                  <Fragment key={metric.id}>
                    <tr className={isExpanded ? 'is-expanded' : ''}>
                      <th scope="row">
                        {hasDetail
                          ? (
                              <button
                                type="button"
                                className="metric-toggle"
                                aria-expanded={isExpanded}
                                onClick={() => toggle(metric.id)}
                              >
                                <span>{metric.label}</span><i aria-hidden="true">{isExpanded ? '\u2212' : '+'}</i>
                              </button>
                            )
                          : <span className="metric-label">{metric.label}</span>}
                      </th>
                      {allSurfaces.map((surface) => (
                        <td key={surface}>
                          <span className="result-value">
                            {formatValue(metric.values[surface], metric.unit, metric.decimals)}
                          </span>
                        </td>
                      ))}
                    </tr>
                    {hasDetail && isExpanded && (
                      <tr className="breakdown-row">
                        <td colSpan={4}>
                          <MetricDetail
                            actions={actions}
                            activeSourceTone={activeSourceTone}
                            agentId={agentResult.agentId}
                            metric={metric}
                            onSourceToneChange={onSourceToneChange}
                            onTargetStunDmgMultiplierChange={onTargetStunDmgMultiplierChange}
                            partyAgentIds={partyAgentIds}
                            targetStunDmgMultiplier={targetStunDmgMultiplier}
                          />
                        </td>
                      </tr>
                    )}
                  </Fragment>
                )
              })}
            </tbody>
          </table>
        </div>
        {standaloneActionRows.map(({ metric, actions }) => (
          <ActionRows
            actions={actions}
            activeSourceTone={activeSourceTone}
            agentId={agentResult.agentId}
            key={metric.id}
            metric={metric}
            onSourceToneChange={onSourceToneChange}
            partyAgentIds={partyAgentIds}
            standalone
          />
        ))}
      </article>
      <Operations
        activeSourceTone={activeSourceTone}
        agentId={agentResult.agentId}
        onSourceToneChange={onSourceToneChange}
        operations={agentResult.operations}
        partyAgentIds={partyAgentIds}
      />
    </section>
  )
}
