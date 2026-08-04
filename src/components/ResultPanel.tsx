import { Fragment, useMemo, useState } from 'react'
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

type SourceToneChannel = 'pointer' | 'focus'

interface SourceInteractionProps {
  activeSourceTone: string | null
  onSourceToneChange: (channel: SourceToneChannel, tone: string | null) => void
}

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

function formatContributionValue(
  amount: number,
  display: Contribution['display'],
  fallbackUnit: string,
): string {
  const value = display?.value ?? amount
  const unit = display?.unit ?? fallbackUnit
  const decimals = display?.decimals ?? 1
  return `${value < 0 ? '' : '+'}${formatNumber(value, decimals)}${unit}`
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

function sourceEvents(
  tone: string,
  onSourceToneChange: SourceInteractionProps['onSourceToneChange'],
) {
  return {
    onMouseEnter: () => onSourceToneChange('pointer', tone),
    onMouseLeave: () => onSourceToneChange('pointer', null),
    onFocus: () => onSourceToneChange('focus', tone),
    onBlur: () => onSourceToneChange('focus', null),
  }
}

interface GroupedSource {
  source: ResultSource
  amounts: Partial<Record<SurfaceKey, number>>
  displays: Partial<Record<SurfaceKey, NonNullable<Contribution['display']>>>
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
  unit: string
}

function SourceMatrix({
  activeSourceTone,
  agentId,
  breakdown,
  label,
  onSourceToneChange,
  shownSurfaces = allSurfaces,
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
        <thead>
          <tr>
            <th scope="col">Source</th>
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
                {...sourceEvents(tone, onSourceToneChange)}
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
                      : <b>{formatContributionValue(row.amounts[surface]!, row.displays[surface], unit)}</b>}
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
  const description = `${gauge.basisLabel}: current ${formatNumber(gauge.current, 1)}, cap ${formatNumber(gauge.cap, 0)}${thresholdDescription}; ${gauge.outputLabel}: +${formatNumber(gauge.outputValue, 1)}${gauge.outputUnit}`
  const tone = sourceTone(gauge.source, agentId)

  return (
    <div
      className={`gauge ${toneClass(tone, activeSourceTone)}`}
      data-source-tone={tone}
      role="group"
      aria-label={description}
      {...sourceEvents(tone, onSourceToneChange)}
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
        <strong>+{formatNumber(gauge.outputValue, 1)}{gauge.outputUnit}</strong>
      </div>
    </div>
  )
}

function ActionRows({
  actions,
  activeSourceTone,
  agentId,
  onSourceToneChange,
}: {
  actions: ActionModifier[]
  agentId: AgentResult['agentId']
} & SourceInteractionProps) {
  if (actions.length === 0) return null

  return (
    <section className="action-differences" aria-label="Action differences">
      <h5>Action aggregates</h5>
      <table className="action-aggregate-table">
        <thead>
          <tr><th>Action</th><th>Combat</th><th>Fully enabled</th></tr>
        </thead>
        <tbody>
          {actions.map((row) => (
            <Fragment key={row.id}>
              <tr className={row.baseActionId ? 'action-aggregate--variant' : undefined}>
                <th>{row.label}</th>
                <td>{formatValue(row.values.combat, '%', 1)}</td>
                <td>{formatValue(row.values.fully, '%', 1)}</td>
              </tr>
              {groupContributions(row.breakdown, ['combat', 'fully']).length > 0 && (
                <tr className="action-source-row">
                  <td colSpan={3}>
                    <SourceMatrix
                      activeSourceTone={activeSourceTone}
                      agentId={agentId}
                      breakdown={row.breakdown}
                      label={`${row.label} source contributions`}
                      onSourceToneChange={onSourceToneChange}
                      shownSurfaces={['combat', 'fully']}
                      unit="%"
                    />
                  </td>
                </tr>
              )}
            </Fragment>
          ))}
        </tbody>
      </table>
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
              {...sourceEvents(tone, onSourceToneChange)}
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
      <header className="panel-heading result-heading">
        <div><span className="eyebrow">RESULT // LIVE</span><h2 id="result-heading">{agentName} Result</h2></div>
      </header>
      <article className={`agent-result agent-result--${agentResult.agentId}`}>
        <div className="result-table-wrap">
          <table>
            <thead>
              <tr><th scope="col">Quantity</th><th scope="col">Initial</th><th scope="col">Combat</th><th scope="col">Fully enabled</th></tr>
            </thead>
            <tbody>
              {agentResult.metrics.map((metric) => {
                const isExpanded = expanded.has(metric.id)
                const actions = agentResult.actionModifiers.filter((row) => row.metricId === metric.id)
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
