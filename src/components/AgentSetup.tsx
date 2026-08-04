import { useEffect, useRef, useState, type Dispatch } from 'react'
import {
  DISC_SUMMARIES,
  ENGINE_IDS_BY_POOL,
  PARTNER_DISC_SUMMARIES,
  PARTNER_EFFECTIVE_SUBSTATS,
  PARTNER_ENGINE_PRESENTATION,
  PARTY_AGENTS,
  SUBSTAT_CHOICES,
  SUBSTAT_KEYS,
  W_ENGINES,
  type AgentId,
  type EngineId,
} from '../workbench/content'
import type { WorkbenchAction, WorkbenchState } from '../workbench/state'

type SourceToneChannel = 'pointer' | 'focus'

interface SourceInteractionProps {
  activeSourceTone: string | null
  onSourceToneChange: (channel: SourceToneChannel, tone: string | null) => void
}

interface AgentSetupProps extends SourceInteractionProps {
  agentId: AgentId
  state: WorkbenchState
  dispatch: Dispatch<WorkbenchAction>
}

function targetClass(base: string, tone: string, activeSourceTone: string | null): string {
  return `${base} source-target source-tone--${tone}${activeSourceTone === tone ? ' is-source-active' : ''}`
}

function targetEvents(
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

function EquipmentSummary({
  activeSourceTone,
  agentId,
  onSourceToneChange,
}: {
  agentId: AgentId
} & SourceInteractionProps) {
  const agent = PARTY_AGENTS.find((item) => item.id === agentId)!
  const discs = agentId === 'yixuan'
    ? [DISC_SUMMARIES.yunkui, DISC_SUMMARIES.woodpecker]
    : PARTNER_DISC_SUMMARIES[agentId]

  return (
    <section
      className="setup-group prepared-block"
      aria-labelledby={`${agentId}-disc-heading`}
    >
      <h3 id={`${agentId}-disc-heading`}><span>03</span> Drive Discs</h3>
      <div className="disc-grid">
        {discs.map((disc, index) => {
          const tone = index === 0 ? 'disc-4pc' : 'disc-2pc'
          return (
            <article
              className={targetClass('disc-summary', tone, activeSourceTone)}
              data-source-tone={tone}
              key={`${disc.name}-${index}`}
              tabIndex={0}
              {...targetEvents(tone, onSourceToneChange)}
            >
              <div>
                <small>{index === 0 ? '4-PIECE' : '2-PIECE'}</small>
                <strong>{disc.name}</strong>
                <ul className="disc-effect-list" aria-label={`${disc.name} effects`}>
                  {disc.effects.map((effect) => <li key={effect}>{effect}</li>)}
                </ul>
              </div>
            </article>
          )
        })}
      </div>
      <dl className="main-stat-grid" aria-label={`${agent.name} prepared main stats`}>
        {Object.entries(agent.equipment.mains).map(([slot, selection]) => {
          const tone = `disc-slot-${slot.replace('slot', '')}`
          return (
            <div
              className={targetClass('', tone, activeSourceTone)}
              data-source-tone={tone}
              key={slot}
              tabIndex={0}
              {...targetEvents(tone, onSourceToneChange)}
            >
              <dt>Disc {slot.replace('slot', '')}</dt>
              <dd><span>{selection.stat}</span><strong>{selection.value}</strong></dd>
            </div>
          )
        })}
      </dl>
    </section>
  )
}

function SubstatStepper({
  activeSourceTone,
  count,
  label,
  onDecrease,
  onIncrease,
  onSourceToneChange,
  perHit,
  tone,
  unit,
}: {
  count: number
  label: string
  onDecrease: () => void
  onIncrease: () => void
  perHit: number
  tone: string
  unit: string
} & SourceInteractionProps) {
  return (
    <div
      className={targetClass('substat-control', tone, activeSourceTone)}
      data-source-tone={tone}
      {...targetEvents(tone, onSourceToneChange)}
    >
      <div className="substat-copy">
        <strong>{label}</strong>
        <span>+{perHit}{unit} / hit</span>
      </div>
      <div className="stepper">
        <button type="button" aria-label={'Decrease ' + label + ' hits'} disabled={count === 0} onClick={onDecrease}>{'−'}</button>
        <output aria-live="polite" aria-label={label + ' hit count'}>{count}</output>
        <button type="button" aria-label={'Increase ' + label + ' hits'} disabled={count === 36} onClick={onIncrease}>+</button>
      </div>
    </div>
  )
}

function PartnerSetup({
  activeSourceTone,
  agentId,
  dispatch,
  onSourceToneChange,
  state,
}: {
  agentId: Exclude<AgentId, 'yixuan'>
  state: WorkbenchState
  dispatch: Dispatch<WorkbenchAction>
} & SourceInteractionProps) {
  const agent = PARTY_AGENTS.find((item) => item.id === agentId)!
  const engine = PARTNER_ENGINE_PRESENTATION[agentId]

  return (
    <section className="setup-panel" aria-labelledby={agentId + '-setup-heading'}>
      <SetupHeading agentId={agentId} editable />
      <fieldset className="setup-group pool-fieldset">
        <legend><span>01</span> Mindscape and W-Engine pool</legend>
        <div className="upstream-strip">
          <span><small>MINDSCAPE</small><strong>{agent.mindscape}</strong></span>
          <span><small>W-ENGINE POOL</small><strong>{agent.pool} pool</strong></span>
        </div>
      </fieldset>
      <fieldset
        className={targetClass('setup-group', 'w-engine', activeSourceTone)}
        data-source-tone="w-engine"
        tabIndex={0}
        {...targetEvents('w-engine', onSourceToneChange)}
      >
        <legend><span>02</span> W-Engine · Rank default</legend>
        <div className="engine-selection">
          <div className="engine-candidate engine-candidate--selected engine-candidate--fixed">
            <div className="engine-candidate__body">
              <div className="engine-name-line">
                <strong>{agent.engine.name}</strong>
                <span>{agent.engine.refinement}</span>
              </div>
              <div className="engine-stats">
                <span>{engine.advancedStat.label} <b>+{engine.advancedStat.value}{engine.advancedStat.unit}</b></span>
              </div>
              <ul>{engine.passiveLines.map((line) => <li key={line}>{line}</li>)}</ul>
            </div>
          </div>
        </div>
      </fieldset>
      <EquipmentSummary
        activeSourceTone={activeSourceTone}
        agentId={agentId}
        onSourceToneChange={onSourceToneChange}
      />
      <fieldset className="setup-group substat-fieldset">
        <legend><span>04</span> Effective substat hits</legend>
        <p className="field-note">Independent setup inputs · prepared at zero · range 0–36</p>
        <div className="substat-grid" aria-label={agent.name + ' prepared effective substats'}>
          {PARTNER_EFFECTIVE_SUBSTATS[agentId].map((choice, index) => {
            const count = state.partnerSubstats[choice.key]
            const tone = 'substat-' + (index + 1)
            return (
              <SubstatStepper
                activeSourceTone={activeSourceTone}
                count={count}
                key={choice.key}
                label={choice.label}
                onDecrease={() => dispatch({
                  type: 'adjustPartnerSubstat',
                  key: choice.key,
                  delta: -1,
                })}
                onIncrease={() => dispatch({
                  type: 'adjustPartnerSubstat',
                  key: choice.key,
                  delta: 1,
                })}
                onSourceToneChange={onSourceToneChange}
                perHit={choice.perHit}
                tone={tone}
                unit={choice.unit}
              />
            )
          })}
        </div>
      </fieldset>
    </section>
  )
}

function EngineSelection({
  activeSourceTone,
  dispatch,
  onSourceToneChange,
  state,
}: {
  state: WorkbenchState
  dispatch: Dispatch<WorkbenchAction>
} & SourceInteractionProps) {
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
    <fieldset
      className={targetClass('setup-group', 'w-engine', activeSourceTone)}
      data-source-tone="w-engine"
      {...targetEvents('w-engine', onSourceToneChange)}
    >
      <legend><span>02</span> W-Engine {'\u00B7'} Rank default</legend>
      <div className="engine-selection">
        <div className="engine-candidate engine-candidate--selected">
          <div className="engine-candidate__body">
            <div className="engine-name-line"><strong>{engine.name}</strong><span>{engine.refinement}</span></div>
            <div className="engine-stats"><span>{engine.advancedStat.label} <b>+{engine.advancedStat.value}%</b></span></div>
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
                    <div className="engine-stats"><span>{alternative.advancedStat.label} <b>+{alternative.advancedStat.value}%</b></span></div>
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

function YixuanSetup({
  activeSourceTone,
  dispatch,
  onSourceToneChange,
  state,
}: {
  state: WorkbenchState
  dispatch: Dispatch<WorkbenchAction>
} & SourceInteractionProps) {
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
      <EngineSelection
        activeSourceTone={activeSourceTone}
        key={state.pool}
        state={state}
        dispatch={dispatch}
        onSourceToneChange={onSourceToneChange}
      />
      <EquipmentSummary
        activeSourceTone={activeSourceTone}
        agentId="yixuan"
        onSourceToneChange={onSourceToneChange}
      />
      <fieldset className="setup-group substat-fieldset">
        <legend><span>04</span> Effective substat hits</legend>
        <p className="field-note">Independent setup inputs {'\u00B7'} prepared at zero {'\u00B7'} range 0{'\u2013'}36</p>
        <div className="substat-grid">
          {SUBSTAT_KEYS.map((key, index) => {
            const choice = SUBSTAT_CHOICES[key]
            const count = state.substats[key]
            const tone = `substat-${index + 1}`
            return (
              <SubstatStepper
                activeSourceTone={activeSourceTone}
                count={count}
                key={key}
                label={choice.label}
                onDecrease={() => dispatch({ type: 'adjustSubstat', key, delta: -1 })}
                onIncrease={() => dispatch({ type: 'adjustSubstat', key, delta: 1 })}
                onSourceToneChange={onSourceToneChange}
                perHit={choice.perHit}
                tone={tone}
                unit={choice.unit}
              />
            )
          })}
        </div>
      </fieldset>
    </section>
  )
}

export function AgentSetup({
  activeSourceTone,
  agentId,
  dispatch,
  onSourceToneChange,
  state,
}: AgentSetupProps) {
  return agentId === 'yixuan'
    ? (
        <YixuanSetup
          activeSourceTone={activeSourceTone}
          state={state}
          dispatch={dispatch}
          onSourceToneChange={onSourceToneChange}
        />
      )
    : (
        <PartnerSetup
          activeSourceTone={activeSourceTone}
          agentId={agentId}
          state={state}
          dispatch={dispatch}
          onSourceToneChange={onSourceToneChange}
        />
      )
}
