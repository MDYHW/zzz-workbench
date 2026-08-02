import { Fragment, useState } from 'react'
import { PARTY_AGENTS } from '../workbench/content'
import type {
  AgentResult,
  Contribution,
  GaugeResult,
  PartyResult,
  ResultMetric,
  SurfaceKey,
} from '../workbench/calculate'

interface ResultPanelProps {
  result: PartyResult | null
}

const surfaceLabels: Record<SurfaceKey, string> = {
  initial: 'Initial',
  combat: 'Combat',
  fully: 'Fully enabled',
}

function formatNumber(value: number, decimals: number): string {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value)
}

function formatMetric(value: number, metric: ResultMetric): string {
  if (value === 0 && (metric.id === 'dmgBonus' || metric.id === 'darkbreaker')) return '\u2014'
  return `${formatNumber(value, metric.decimals)}${metric.unit}`
}

function formatContribution(item: Contribution, unit: string): string {
  return `+${formatNumber(item.amount, 1)}${unit}`
}

function formatActionValue(value: number): string {
  return value === 0 ? '\u2014' : `+${formatNumber(value, 1)}%`
}

function ActionSources({ items }: { items: Contribution[] }) {
  if (items.length === 0) return <span className="action-source-empty">No active contribution</span>

  return (
    <ul className="action-source-list">
      {items.map((item, index) => (
        <li key={`${item.source}-${index}`}>
          <span>{item.source}</span>
          <b>{formatContribution(item, '%')}</b>
        </li>
      ))}
    </ul>
  )
}

function Gauge({ gauge }: { gauge: GaugeResult }) {
  const progress = Math.min(gauge.current / gauge.cap * 100, 100)
  const threshold = gauge.threshold ? gauge.threshold / gauge.cap * 100 : undefined

  return (
    <div className="gauge">
      <div className="gauge__labels">
        <span>{gauge.basisLabel}</span>
        <strong>{formatNumber(gauge.current, 1)} / {formatNumber(gauge.cap, 0)}</strong>
      </div>
      <div className="gauge__track" aria-label={`${gauge.basisLabel} gauge`}>
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

function Breakdown({ metric }: { metric: ResultMetric }) {
  return (
    <div className="breakdown-grid">
      {(Object.keys(surfaceLabels) as SurfaceKey[]).map((surface) => (
        <section key={surface}>
          <h5>{surfaceLabels[surface]}</h5>
          {metric.breakdown[surface].length === 0 ? (
            <span className="no-contribution">No active contribution</span>
          ) : (
            <ul>
              {metric.breakdown[surface].map((item, index) => (
                <li key={`${item.source}-${index}`}>
                  <span>{item.source}</span>
                  <b>{formatContribution(item, metric.unit)}</b>
                </li>
              ))}
            </ul>
          )}
        </section>
      ))}
      {metric.gauge && <Gauge gauge={metric.gauge} />}
    </div>
  )
}

function AgentResultTable({
  agentResult,
  expanded,
  onToggle,
}: {
  agentResult: AgentResult
  expanded: Set<string>
  onToggle: (key: string) => void
}) {
  const identity = PARTY_AGENTS.find((agent) => agent.id === agentResult.agentId)!

  return (
    <article className={`agent-result agent-result--${agentResult.agentId}`}>
      <header>
        <div className="result-agent-index">0{identity.order}</div>
        <div>
          <span className="eyebrow">{identity.specialty} RESULT</span>
          <h3>{identity.name}</h3>
        </div>
        <span className="result-role">{identity.roles[0]}</span>
      </header>

      <div className="result-table-wrap">
        <table>
          <thead>
            <tr>
              <th scope="col">Quantity</th>
              <th scope="col">Initial</th>
              <th scope="col">Combat</th>
              <th scope="col">Fully enabled</th>
            </tr>
          </thead>
          <tbody>
            {agentResult.metrics.map((metric) => {
              const key = `${agentResult.agentId}-${metric.id}`
              const isExpanded = expanded.has(key)
              return (
                <Fragment key={key}>
                  <tr className={isExpanded ? 'is-expanded' : ''}>
                    <th scope="row">
                      <button
                        type="button"
                        className="metric-toggle"
                        aria-expanded={isExpanded}
                        onClick={() => onToggle(key)}
                      >
                        <span>{metric.label}</span>
                        <i aria-hidden="true">{isExpanded ? '\u2212' : '+'}</i>
                      </button>
                    </th>
                    {(Object.keys(surfaceLabels) as SurfaceKey[]).map((surface) => (
                      <td key={surface}>
                        <span className="result-value" key={`${surface}-${metric.values[surface]}`}>
                          {formatMetric(metric.values[surface], metric)}
                        </span>
                      </td>
                    ))}
                  </tr>
                  {isExpanded && (
                    <tr className="breakdown-row" key={`${key}-breakdown`}>
                      <td colSpan={4}><Breakdown metric={metric} /></td>
                    </tr>
                  )}
                </Fragment>
              )
            })}
          </tbody>
        </table>
      </div>
    </article>
  )
}

export function ResultPanel({ result }: ResultPanelProps) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set(['yixuan-sheerForce']))

  const toggle = (key: string) => {
    setExpanded((current) => {
      const next = new Set(current)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  if (!result) {
    return (
      <section className="result-panel result-panel--empty" aria-labelledby="result-heading">
        <h2 id="result-heading">Result</h2>
        <p>Complete every required setup selection to calculate Result.</p>
      </section>
    )
  }

  return (
    <section className="result-panel" aria-labelledby="result-heading">
      <header className="panel-heading result-heading">
        <div>
          <span className="eyebrow">RESULT // LIVE</span>
          <h2 id="result-heading">Party values</h2>
        </div>
        <div className="surface-legend" aria-label="Result surface legend">
          <span>Initial</span><span>Combat</span><span>Fully enabled</span>
        </div>
      </header>

      <div className="party-effects" aria-label="Fully enabled party contributions">
        {result.partyEffects.map((effect) => (
          <article key={`${effect.source}-${effect.label}`}>
            <span>{effect.source}</span>
            <strong>+{formatNumber(effect.value, effect.value % 1 === 0 ? 0 : 1)}{effect.unit}</strong>
            <small>{effect.label} {'\u00B7'} {effect.recipient}</small>
          </article>
        ))}
      </div>

      <AgentResultTable agentResult={result.agents[0]} expanded={expanded} onToggle={toggle} />

      <details className="action-differences" open>
        <summary>
          <span>Yixuan Sheer DMG Bonus by action</span>
          <small>Only materially distinct aggregates</small>
        </summary>
        <table>
          <thead><tr><th>Action</th><th>Combat</th><th>Fully enabled</th></tr></thead>
          <tbody>
            {result.actionModifiers.map((row) => (
              <tr key={row.id}>
                <th>{row.label}</th>
                <td>
                  <strong>{formatActionValue(row.combat)}</strong>
                  <ActionSources items={row.sources.combat} />
                </td>
                <td>
                  <strong>{formatActionValue(row.fully)}</strong>
                  <ActionSources items={row.sources.fully} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>

      <div className="partner-results">
        {result.agents.slice(1).map((agentResult) => (
          <AgentResultTable
            key={agentResult.agentId}
            agentResult={agentResult}
            expanded={expanded}
            onToggle={toggle}
          />
        ))}
      </div>
    </section>
  )
}
