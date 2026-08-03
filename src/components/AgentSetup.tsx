import { useEffect, useRef, useState, type Dispatch } from 'react'
import {
  DISC_SUMMARIES,
  ENGINE_IDS_BY_POOL,
  PARTNER_EFFECTIVE_SUBSTATS,
  PARTY_AGENTS,
  SUBSTAT_CHOICES,
  SUBSTAT_KEYS,
  W_ENGINES,
  type AgentId,
  type EngineId,
} from '../workbench/content'
import type { WorkbenchAction, WorkbenchState } from '../workbench/state'

interface AgentSetupProps {
  agentId: AgentId
  state: WorkbenchState
  dispatch: Dispatch<WorkbenchAction>
}

function SetupHeading({ agentId, editable }: { agentId: AgentId; editable: boolean }) {
  const agent = PARTY_AGENTS.find((item) => item.id === agentId)!
  return (
    <header className="panel-heading">
      <div>
        <span className="eyebrow">SETUP // 0{agent.order}</span>
        <h2 id={`${agentId}-setup-heading`}>{agent.name} setup</h2>
      </div>
      <span className="edit-state">{editable ? 'EDITABLE' : 'PREPARED'}</span>
    </header>
  )
}

function EquipmentSummary({ agentId }: { agentId: AgentId }) {
  const agent = PARTY_AGENTS.find((item) => item.id === agentId)!
  const discs = agentId === 'yixuan'
    ? [DISC_SUMMARIES.yunkui, DISC_SUMMARIES.woodpecker]
    : [
        { name: agent.equipment.fourPiece, effect: 'Prepared 4-piece selection' },
        { name: agent.equipment.twoPiece, effect: 'Prepared 2-piece selection' },
      ]

  return (
    <section className="setup-group prepared-block" aria-labelledby={`${agentId}-disc-heading`}>
      <h3 id={`${agentId}-disc-heading`}><span>03</span> Drive Discs</h3>
      <div className="disc-grid">
        {discs.map((disc, index) => (
          <article className="disc-summary" key={`${disc.name}-${index}`}>
            <div>
              <small>{index === 0 ? '4-PIECE' : '2-PIECE'}</small>
              <strong>{disc.name}</strong>
              <p>{disc.effect}</p>
            </div>
          </article>
        ))}
      </div>
      <dl className="main-stat-grid" aria-label={`${agent.name} prepared main stats`}>
        {Object.entries(agent.equipment.mains).map(([slot, value]) => (
          <div key={slot}>
            <dt>Disc {slot.replace('slot', '')}</dt>
            <dd>{value}</dd>
          </div>
        ))}
      </dl>
    </section>
  )
}

function PartnerSetup({ agentId }: { agentId: Exclude<AgentId, 'yixuan'> }) {
  const agent = PARTY_AGENTS.find((item) => item.id === agentId)!
  return (
    <section className="setup-panel" aria-labelledby={`${agentId}-setup-heading`}>
      <SetupHeading agentId={agentId} editable={false} />
      <dl className="upstream-strip" aria-label={`${agent.name} setup context`}>
        <div><dt>MINDSCAPE</dt><dd>{agent.mindscape}</dd></div>
        <div><dt>POOL</dt><dd>{agent.pool}</dd></div>
        <div><dt>W-ENGINE</dt><dd>{agent.engine.name} {'\u00B7'} {agent.engine.refinement}</dd></div>
      </dl>
      <EquipmentSummary agentId={agentId} />
      <section className="setup-group" aria-labelledby={`${agentId}-substats-heading`}>
        <h3 id={`${agentId}-substats-heading`}><span>04</span> Effective substat hits</h3>
        <dl className="substat-grid" aria-label={`${agent.name} prepared effective substats`}>
          {PARTNER_EFFECTIVE_SUBSTATS[agentId].map((choice) => (
            <div className="substat-control" key={`${choice.label}-${choice.unit}`}>
              <dt>{choice.label}</dt>
              <dd>0 <small>+{choice.perHit}{choice.unit} / hit</small></dd>
            </div>
          ))}
        </dl>
      </section>
    </section>
  )
}

function EngineSelection({ state, dispatch }: { state: WorkbenchState; dispatch: Dispatch<WorkbenchAction> }) {
  const [isOpen, setIsOpen] = useState(false)
  const changeButtonRef = useRef<HTMLButtonElement>(null)
  const restoreFocusAfterSelection = useRef(false)

  useEffect(() => {
    if (isOpen || !restoreFocusAfterSelection.current) return
    restoreFocusAfterSelection.current = false
    changeButtonRef.current?.focus()
  }, [isOpen, state.engineId])

  const engineIds = ENGINE_IDS_BY_POOL[state.pool]
  const engine = state.engineId ? W_ENGINES[state.engineId] : null
  const alternatives = engineIds.filter((engineId) => engineId !== state.engineId)

  if (!engine) return null

  return (
    <fieldset className="setup-group">
      <legend><span>02</span> W-Engine {'\u00B7'} Rank default</legend>
      <div className="engine-selection">
        <div className="engine-candidate engine-candidate--selected">
          <div className="engine-candidate__body">
            <div className="engine-name-line"><strong>{engine.name}</strong><span>{engine.refinement}</span></div>
            <div className="engine-stats"><span>Base ATK <b>{engine.baseAtk}</b></span><span>{engine.advancedStat.label} <b>+{engine.advancedStat.value}%</b></span></div>
            <ul>{engine.passiveLines.map((line) => <li key={line}>{line}</li>)}</ul>
          </div>
          {alternatives.length > 0 && (
            <button
              type="button"
              ref={changeButtonRef}
              className="selected-tab"
              aria-expanded={isOpen}
              aria-label={`Change W-Engine from ${engine.name}`}
              onClick={() => setIsOpen((open) => !open)}
            >CHANGE</button>
          )}
        </div>
        {isOpen && (
          <div className="engine-grid" aria-label="Alternative W-Engines">
            {alternatives.map((engineId) => {
              const alternative = W_ENGINES[engineId]
              return (
                <button
                  type="button"
                  className="engine-candidate"
                  key={engineId}
                  aria-label={`Select ${alternative.name} ${alternative.refinement}`}
                  onClick={() => {
                    restoreFocusAfterSelection.current = true
                    dispatch({ type: 'selectEngine', engineId: engineId as EngineId })
                    setIsOpen(false)
                  }}
                >
                  <div className="engine-candidate__body">
                    <div className="engine-name-line"><strong>{alternative.name}</strong><span>{alternative.refinement}</span></div>
                    <div className="engine-stats"><span>Base ATK <b>{alternative.baseAtk}</b></span><span>{alternative.advancedStat.label} <b>+{alternative.advancedStat.value}%</b></span></div>
                    <ul>{alternative.passiveLines.map((line) => <li key={line}>{line}</li>)}</ul>
                  </div>
                </button>
              )
            })}
          </div>
        )}
      </div>
    </fieldset>
  )
}

function YixuanSetup({ state, dispatch }: { state: WorkbenchState; dispatch: Dispatch<WorkbenchAction> }) {
  return (
    <section className="setup-panel" aria-labelledby="yixuan-setup-heading">
      <SetupHeading agentId="yixuan" editable />
      <fieldset className="setup-group pool-fieldset">
        <legend><span>01</span> Mindscape and W-Engine pool</legend>
        <div className="upstream-strip"><span><small>MINDSCAPE</small><strong>M0</strong></span><span><small>FOCUS</small><strong>Yixuan</strong></span></div>
        <div className="segmented-control">
          <button type="button" className={state.pool === 'full' ? 'is-selected' : ''} aria-pressed={state.pool === 'full'} onClick={() => dispatch({ type: 'switchPool', pool: 'full' })}>Full pool<small>Limited + standard</small></button>
          <button type="button" className={state.pool === 'nonLimited' ? 'is-selected' : ''} aria-pressed={state.pool === 'nonLimited'} onClick={() => dispatch({ type: 'switchPool', pool: 'nonLimited' })}>Non-limited<small>Standard + A-Rank</small></button>
        </div>
      </fieldset>
      <EngineSelection key={state.pool} state={state} dispatch={dispatch} />
      <EquipmentSummary agentId="yixuan" />
      <fieldset className="setup-group substat-fieldset">
        <legend><span>04</span> Effective substat hits</legend>
        <p className="field-note">Independent setup inputs {'\u00B7'} prepared at zero {'\u00B7'} range 0{'\u2013'}36</p>
        <div className="substat-grid">
          {SUBSTAT_KEYS.map((key) => {
            const choice = SUBSTAT_CHOICES[key]
            const count = state.substats[key]
            return <div className="substat-control" key={key}><div className="substat-copy"><strong>{choice.label}</strong><span>+{choice.perHit}{choice.unit} / hit</span></div><div className="stepper"><button type="button" aria-label={`Decrease ${choice.label} hits`} disabled={count === 0} onClick={() => dispatch({ type: 'adjustSubstat', key, delta: -1 })}>{'\u2212'}</button><output aria-live="polite" aria-label={`${choice.label} hit count`}>{count}</output><button type="button" aria-label={`Increase ${choice.label} hits`} disabled={count === 36} onClick={() => dispatch({ type: 'adjustSubstat', key, delta: 1 })}>+</button></div></div>
          })}
        </div>
      </fieldset>
    </section>
  )
}

export function AgentSetup({ agentId, state, dispatch }: AgentSetupProps) {
  return agentId === 'yixuan'
    ? <YixuanSetup state={state} dispatch={dispatch} />
    : <PartnerSetup agentId={agentId} />
}
