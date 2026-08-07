import { Fragment, useEffect, useMemo, useState } from 'react'
import { PARTY_AGENTS } from '../workbench/content'
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
import { sourceToneEvents, type SourceInteractionProps } from './sourceInteraction'

interface ResultPanelProps extends SourceInteractionProps {
  agentResult: AgentResult | null
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

function hasCurrentConsumer(metric: ResultMetric, actions: ActionModifier[]): boolean {
  const hasValue = allSurfaces.some(
    (surface) => Math.abs(metric.values[surface]) > 0.000_001,
  )
  const hasBreakdown = allSurfaces.some(
    (surface) => metric.breakdown[surface].length > 0,
  )

  return hasValue || hasBreakdown || metric.gauge !== undefined || actions.length > 0
}

function currentMetricRows(result: AgentResult) {
  return result.metrics
    .map((metric) => ({
      metric,
      actions: result.actionModifiers.filter((row) => row.metricId === metric.id),
    }))
    .filter(({ metric, actions }) => hasCurrentConsumer(metric, actions))
}

function formatContributionValue(
  amount: number,
  display: Contribution['display'],
  fallbackUnit: string,
  notation: Contribution['notation'],
): string {
  const value = display?.value ?? amount
  const unit = display?.unit ?? fallbackUnit
  const decimals = display?.decimals ?? 1
  const positivePrefix = notation === 'surface-value' || value < 0 ? '' : '+'
  return `${positivePrefix}${formatNumber(value, decimals)}${unit}`
}

function sourceLabel(
  source: ResultSource,
  currentAgentId: AgentResult['agentId'],
): string {
  if (source.ownerAgentId === currentAgentId) return source.label
  const provider = PARTY_AGENTS.find((agent) => agent.id === source.ownerAgentId)!
  return [provider.name, source.label].join(' \u00B7 ')
}

function sourceTone(source: ResultSource, currentAgentId: AgentResult['agentId']): string {
  if (source.locus === 'identity' || source.ownerAgentId !== currentAgentId) {
    return `agent-${source.ownerAgentId}`
  }
  return source.locus
}

function toneClass(tone: string, activeSourceTone: string | null): string {
  return `source-link source-tone--${tone}${activeSourceTone === tone ? ' is-source-active' : ''}`
}

interface GroupedSource {
  source: ResultSource
  amounts: Partial<Record<SurfaceKey, number>>
  displays: Partial<Record<SurfaceKey, NonNullable<Contribution['display']>>>
  notations: Partial<Record<SurfaceKey, NonNullable<Contribution['notation']>>>
}

function groupContributions(
  breakdown: Record<SurfaceKey, Contribution[]>,
  shownSurfaces: SurfaceKey[],
): GroupedSource[] {
  const grouped = new Map<string, GroupedSource>()

  for (const surface of shownSurfaces) {
    for (const item of breakdown[surface]) {
      const key = [item.ownerAgentId, item.locus, item.label, item.detail ?? ''].join('|')
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
      grouped.set(key, row)
    }
  }

  return [...grouped.values()]
}

interface SourceMatrixProps extends SourceInteractionProps {
  agentId: AgentResult['agentId']
  breakdown: Record<SurfaceKey, Contribution[]>
  label: string
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
            const tone = sourceTone(row.source, agentId)
            return (
              <tr
                key={`${row.source.ownerAgentId}-${row.source.locus}-${row.source.label}`}
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
                      : <b>{formatContributionValue(row.amounts[surface]!, row.displays[surface], unit, row.notations[surface])}</b>}
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
}: {
  agentId: AgentResult['agentId']
  gauge: GaugeResult
} & SourceInteractionProps) {
  const progress = Math.min(gauge.current / gauge.cap * 100, 100)
  const threshold = gauge.threshold === undefined ? undefined : gauge.threshold / gauge.cap * 100
  const thresholdDescription = gauge.threshold === undefined
    ? ''
    : `, threshold ${formatNumber(gauge.threshold, 1)}`
  const outputCapDescription = gauge.outputCap === undefined
    ? ''
    : `, cap ${formatNumber(gauge.outputCap, 0)}${gauge.outputUnit}`
  const description = `${gauge.basisLabel}: current ${formatNumber(gauge.current, 1)}, cap ${formatNumber(gauge.cap, 0)}${thresholdDescription}; ${gauge.outputLabel}: +${formatNumber(gauge.outputValue, 1)}${gauge.outputUnit}${outputCapDescription}`
  const tone = sourceTone(gauge.source, agentId)

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
        <strong>{formatNumber(gauge.current, 1)} / {formatNumber(gauge.cap, 0)}</strong>
      </div>
      {gauge.threshold !== undefined && (
        <small className="gauge__threshold-copy">Threshold {formatNumber(gauge.threshold, 1)}</small>
      )}
      <div className="gauge__track" aria-hidden="true">
        <span className="gauge__fill" style={{ width: `${progress}%` }} />
        {threshold !== undefined && <i className="gauge__threshold" style={{ left: `${threshold}%` }} />}
      </div>
      <div className="gauge__output">
        <span>{gauge.outputLabel}</span>
        <strong>
          +{formatNumber(gauge.outputValue, 1)}{gauge.outputUnit}
          {gauge.outputCap === undefined ? '' : ` / ${formatNumber(gauge.outputCap, 0)}${gauge.outputUnit}`}
        </strong>
      </div>
    </div>
  )
}

function ActionRows({
  actions,
  activeSourceTone,
  agentId,
  metric,
  onSourceToneChange,
}: {
  actions: ActionModifier[]
  agentId: AgentResult['agentId']
  metric: ResultMetric
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
    <section className="action-differences" aria-label={`${metric.label} action outcomes`}>
      <h5 className="hierarchy-caption">Action outcomes</h5>
      <div className="action-matrix-wrap">
        <table className="source-matrix action-matrix" aria-label={`${metric.label} action outcome values`}>
          <colgroup>
            <col className="action-hierarchy-track" />
            <col className="action-label-track" />
            <col className="result-surface-track" span={3} />
          </colgroup>
          <thead>
            <tr>
              <th className="action-hierarchy-cell" aria-hidden="true" />
              <th scope="col">Action outcome</th>
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
            const actionName = action.actions.join(', ')

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
                          <span className="action-lines">
                            {action.actions.map((label) => <span key={label}>{label}</span>)}
                          </span>
                          <i aria-hidden="true">{isExpanded ? '\u2212' : '+'}</i>
                        </button>
                      ) : (
                        <span className="action-lines">
                          {action.actions.map((label) => <span key={label}>{label}</span>)}
                        </span>
                      )}
                    </th>
                    {allSurfaces.map((surface) => (
                      <td key={surface}>
                        {Math.abs(action.values[surface] - parentValues[surface]) < 0.0001
                          ? <span className="action-result--empty">{'—'}</span>
                          : <b className="action-result-value">{formatValue(action.values[surface], '%', 1)}</b>}
                      </td>
                    ))}
                  </tr>
                </tbody>
                {sourceRows.length > 0 && (
                  <tbody className="action-source-detail" id={sourceRegionId} hidden={!isExpanded}>
                    {sourceRows.map((row) => {
                      const tone = sourceTone(row.source, agentId)
                      return (
                        <tr
                          key={`${row.source.ownerAgentId}-${row.source.locus}-${row.source.label}-${row.source.detail ?? ''}`}
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
                                : <b>{formatContributionValue(row.amounts[surface]!, row.displays[surface], metric.unit, row.notations[surface])}</b>}
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
}: {
  agentId: AgentResult['agentId']
  operations: ResultOperation[]
} & SourceInteractionProps) {
  if (operations.length === 0) return null

  return (
    <section className="action-differences" aria-label="Agent operations">
      <h5>Operations</h5>
      <ul className="action-source-list">
        {operations.map((operation) => {
          const tone = sourceTone(operation.source, agentId)
          return (
            <li
              className={toneClass(tone, activeSourceTone)}
              data-source-tone={tone}
              key={operation.id}
              tabIndex={0}
              {...sourceToneEvents(tone, onSourceToneChange)}
            >
              <span>
                <small>{surfaceLabels[operation.surface]}</small>
                {operation.label} {'\u00B7'} {sourceLabel(operation.source, agentId)}
                {operation.source.detail && <em>{operation.source.detail}</em>}
              </span>
              <b>+{formatNumber(operation.value, 1)}{operation.unit}</b>
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
}: {
  actions: ActionModifier[]
  agentId: AgentResult['agentId']
  metric: ResultMetric
} & SourceInteractionProps) {
  return (
    <div className="breakdown-grid">
      <SourceMatrix
        activeSourceTone={activeSourceTone}
        agentId={agentId}
        breakdown={metric.breakdown}
        label={`${metric.label} source contributions`}
        onSourceToneChange={onSourceToneChange}
        sourceHeading={actions.length > 0 ? 'Common source' : 'Source'}
        unit={metric.unit}
      />
      {metric.gauge && (
        <Gauge
          activeSourceTone={activeSourceTone}
          agentId={agentId}
          gauge={metric.gauge}
          onSourceToneChange={onSourceToneChange}
        />
      )}
      <ActionRows
        actions={actions}
        activeSourceTone={activeSourceTone}
        agentId={agentId}
        metric={metric}
        onSourceToneChange={onSourceToneChange}
      />
    </div>
  )
}

export function ResultPanel({
  activeSourceTone,
  agentResult,
  onSourceToneChange,
}: ResultPanelProps) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set())
  const metricRows = useMemo(
    () => agentResult ? currentMetricRows(agentResult) : [],
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

  const toggle = (metricId: string) => setExpanded((current) => {
    const next = new Set(current)
    if (next.has(metricId)) next.delete(metricId)
    else next.add(metricId)
    return next
  })
  const agentName = PARTY_AGENTS.find((agent) => agent.id === agentResult.agentId)!.name

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
                  metric.gauge
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
      </article>
      <Operations
        activeSourceTone={activeSourceTone}
        agentId={agentResult.agentId}
        onSourceToneChange={onSourceToneChange}
        operations={agentResult.operations}
      />
    </section>
  )
}
