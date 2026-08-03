import { Fragment, useState } from 'react'
import { PARTY_AGENTS } from '../workbench/content'
import type {
  ActionModifier,
  AgentResult,
  Contribution,
  GaugeResult,
  ResultMetric,
  ResultOperation,
  SurfaceKey,
} from '../workbench/calculate'

interface ResultPanelProps {
  agentResult: AgentResult | null
}

const surfaceLabels: Record<SurfaceKey, string> = {
  initial: 'Initial',
  combat: 'Combat',
  fully: 'Fully enabled',
}

function formatNumber(value: number, decimals: number): string {
  return new Intl.NumberFormat('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals }).format(value)
}

function formatValue(value: number, unit: string, decimals: number): string {
  return `${formatNumber(value, decimals)}${unit}`
}

function SourceList({ items, unit }: { items: Contribution[]; unit: string }) {
  if (items.length === 0) return <span className="no-contribution">No new contribution</span>
  return <ul>{items.map((item, index) => <li key={`${item.source}-${index}`}><span>{item.source}</span><b>{item.amount < 0 ? '' : '+'}{formatNumber(item.amount, 1)}{unit}</b></li>)}</ul>
}

function Gauge({ gauge }: { gauge: GaugeResult }) {
  const progress = Math.min(gauge.current / gauge.cap * 100, 100)
  const threshold = gauge.threshold === undefined ? undefined : gauge.threshold / gauge.cap * 100
  const thresholdDescription = gauge.threshold === undefined
    ? ''
    : `, threshold ${formatNumber(gauge.threshold, 1)}`
  const description = `${gauge.basisLabel}: current ${formatNumber(gauge.current, 1)}, cap ${formatNumber(gauge.cap, 0)}${thresholdDescription}; ${gauge.outputLabel}: +${formatNumber(gauge.outputValue, 1)}${gauge.outputUnit}`

  return (
    <div className="gauge" role="group" aria-label={description}>
      <small className="gauge__source">{gauge.source}</small>
      <div className="gauge__labels"><span>{gauge.basisLabel}</span><strong>{formatNumber(gauge.current, 1)} / {formatNumber(gauge.cap, 0)}</strong></div>
      {gauge.threshold !== undefined && <small className="gauge__threshold-copy">Threshold {formatNumber(gauge.threshold, 1)}</small>}
      <div className="gauge__track" aria-hidden="true"><span className="gauge__fill" style={{ width: `${progress}%` }} />{threshold !== undefined && <i className="gauge__threshold" style={{ left: `${threshold}%` }} />}</div>
      <div className="gauge__output"><span>{gauge.outputLabel}</span><strong>+{formatNumber(gauge.outputValue, 1)}{gauge.outputUnit}</strong></div>
    </div>
  )
}

function ActionRows({ rows }: { rows: ActionModifier[] }) {
  if (rows.length === 0) return null
  return (
    <section className="action-differences" aria-label="Action differences">
      <h5>Action differences</h5>
      <table>
        <thead><tr><th>Action</th><th>Combat</th><th>Fully enabled</th></tr></thead>
        <tbody>{rows.map((row) => <tr key={row.id}><th>{row.label}</th><td>{formatValue(row.values.combat, '%', 1)}<SourceList items={row.breakdown.combat} unit="%" /></td><td>{formatValue(row.values.fully, '%', 1)}<SourceList items={row.breakdown.fully} unit="%" /></td></tr>)}</tbody>
      </table>
    </section>
  )
}

function Operations({ operations }: { operations: ResultOperation[] }) {
  if (operations.length === 0) return null
  return (
    <section className="action-differences" aria-label="Agent operations">
      <h5>Operations</h5>
      <ul className="action-source-list">{operations.map((operation) => <li key={operation.id}><span><small>{surfaceLabels[operation.surface]}</small>{operation.label} {'\u00B7'} {operation.source}</span><b>+{formatNumber(operation.value, 1)}{operation.unit}</b></li>)}</ul>
    </section>
  )
}

function MetricDetail({ metric, actions }: { metric: ResultMetric; actions: ActionModifier[] }) {
  return (
    <div className="breakdown-grid">
      {(Object.keys(surfaceLabels) as SurfaceKey[]).map((surface) => <section key={surface}><h5>{surfaceLabels[surface]}</h5><SourceList items={metric.breakdown[surface]} unit={metric.unit} /></section>)}
      {metric.gauge && <Gauge gauge={metric.gauge} />}
      <ActionRows rows={actions} />
    </div>
  )
}

export function ResultPanel({ agentResult }: ResultPanelProps) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set())
  if (!agentResult) {
    return <section className="result-panel result-panel--empty" aria-label="Empty Result"><h2>Result</h2><p>Complete every required setup selection to calculate Result.</p></section>
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
      <header className="panel-heading result-heading"><div><span className="eyebrow">RESULT // LIVE</span><h2 id="result-heading">{agentName} Result</h2></div><div className="surface-legend" aria-label="Result surfaces"><span>Initial</span><span>Combat</span><span>Fully enabled</span></div></header>
      <article className={`agent-result agent-result--${agentResult.agentId}`}>
        <div className="result-table-wrap"><table><thead><tr><th scope="col">Quantity</th><th scope="col">Initial</th><th scope="col">Combat</th><th scope="col">Fully enabled</th></tr></thead><tbody>
          {agentResult.metrics.map((metric) => {
            const isExpanded = expanded.has(metric.id)
            const actions = agentResult.actionModifiers.filter((row) => row.metricId === metric.id)
            return <Fragment key={metric.id}><tr className={isExpanded ? 'is-expanded' : ''}><th scope="row"><button type="button" className="metric-toggle" aria-expanded={isExpanded} onClick={() => toggle(metric.id)}><span>{metric.label}</span><i aria-hidden="true">{isExpanded ? '\u2212' : '+'}</i></button></th>{(Object.keys(surfaceLabels) as SurfaceKey[]).map((surface) => <td key={surface}><span className="result-value">{formatValue(metric.values[surface], metric.unit, metric.decimals)}</span></td>)}</tr>{isExpanded && <tr className="breakdown-row"><td colSpan={4}><MetricDetail metric={metric} actions={actions} /></td></tr>}</Fragment>
          })}
        </tbody></table></div>
      </article>
      <Operations operations={agentResult.operations} />
    </section>
  )
}
