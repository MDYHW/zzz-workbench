import { useEffect, useRef, useState, type Dispatch, type ReactNode, type Ref } from 'react'
import {
  DISC_IDS_BY_AGENT_AND_PIECE,
  DRIVE_DISCS,
  ENGINE_IDS_BY_AGENT_AND_POOL,
  MAIN_STATS,
  MAIN_STAT_IDS_BY_AGENT_AND_SLOT,
  PARTY_AGENTS,
  SUBSTAT_CHOICES_BY_AGENT,
  W_ENGINES,
  type AgentId,
  type DiscId,
  type EngineId,
  type MainSlot,
  type MainStatId,
  type PoolId,
  type Refinement,
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

function SetupHeading({ agentId }: { agentId: AgentId }) {
  const agent = PARTY_AGENTS.find((item) => item.id === agentId)!
  return (
    <header className="panel-heading">
      <div>
        <span className="eyebrow">SETUP // 0{agent.order}</span>
        <h2 id={`${agentId}-setup-heading`}>{agent.name} setup</h2>
      </div>
      <span className="edit-state">EDITABLE</span>
    </header>
  )
}

function PoolSelection({
  agentId,
  dispatch,
  pool,
}: {
  agentId: AgentId
  dispatch: Dispatch<WorkbenchAction>
  pool: PoolId
}) {
  return (
    <fieldset className="setup-group pool-fieldset">
      <legend><span>01</span> Mindscape and W-Engine pool</legend>
      <div className="upstream-strip">
        <span><small>MINDSCAPE</small><strong>M0</strong></span>
        {agentId === 'yixuan' && <span><small>FOCUS</small><strong>Yixuan</strong></span>}
      </div>
      <div className="segmented-control">
        <button
          type="button"
          className={pool === 'full' ? 'is-selected' : ''}
          aria-pressed={pool === 'full'}
          onClick={() => dispatch({ type: 'switchPool', agentId, pool: 'full' })}
        >
          Full pool
          <small>Limited + standard</small>
        </button>
        <button
          type="button"
          className={pool === 'nonLimited' ? 'is-selected' : ''}
          aria-pressed={pool === 'nonLimited'}
          onClick={() => dispatch({ type: 'switchPool', agentId, pool: 'nonLimited' })}
        >
          Non-limited
          <small>Standard + A-Rank</small>
        </button>
      </div>
    </fieldset>
  )
}

function SelectionSurface({
  ariaLabel,
  children,
  editable,
  expanded,
  onClick,
  buttonRef,
}: {
  ariaLabel: string
  children: ReactNode
  editable: boolean
  expanded: boolean
  onClick: () => void
  buttonRef?: Ref<HTMLButtonElement>
}) {
  return editable ? (
    <button
      type="button"
      className="selection-surface selection-surface--editable"
      aria-label={ariaLabel}
      aria-expanded={expanded}
      onClick={onClick}
      ref={buttonRef}
    >
      {children}
      <span className="selection-surface__change">CHANGE</span>
    </button>
  ) : (
    <div className="selection-surface selection-surface--fixed" aria-label={ariaLabel}>
      {children}
    </div>
  )
}

function EngineCard({
  engineId,
  refinement,
  compact = false,
}: {
  engineId: EngineId
  refinement: Refinement
  compact?: boolean
}) {
  const engine = W_ENGINES[engineId]
  return (
    <>
      <span className="equipment-art equipment-art--engine">
        <img src={engine.image} alt="" />
      </span>
      <span className="equipment-copy">
        <span className="equipment-name-line">
          <strong>{engine.name}</strong>
          <span>{engine.rank}-Rank</span>
        </span>
        <span className="equipment-advanced">
          {engine.advancedStat.label}
          <b>+{engine.advancedStat.value}{engine.advancedStat.unit}</b>
        </span>
        {!compact && (
          <span className="equipment-effects">
            {engine.passiveLines(refinement).map((line) => <span key={line}>{line}</span>)}
          </span>
        )}
      </span>
    </>
  )
}

function EngineSelection({
  activeSourceTone,
  agentId,
  dispatch,
  onSourceToneChange,
  openSelector,
  setOpenSelector,
  state,
}: {
  agentId: AgentId
  state: WorkbenchState
  dispatch: Dispatch<WorkbenchAction>
  openSelector: string | null
  setOpenSelector: (value: string | null) => void
} & SourceInteractionProps) {
  const setup = state.setups[agentId]
  const engineId = setup.engineId
  const refinement = setup.refinement
  if (!engineId || !refinement) return null

  const selectorId = `${agentId}-engine`
  const candidates = ENGINE_IDS_BY_AGENT_AND_POOL[agentId][setup.pool]
  const alternatives = candidates.filter((id) => id !== engineId)
  const isOpen = openSelector === selectorId
  const openerRef = useRef<HTMLButtonElement>(null)
  const [restoreFocus, setRestoreFocus] = useState(false)

  useEffect(() => {
    if (!restoreFocus) return
    openerRef.current?.focus()
    setRestoreFocus(false)
  }, [restoreFocus])

  return (
    <fieldset
      className={targetClass('setup-group equipment-fieldset', 'w-engine', activeSourceTone)}
      data-source-tone="w-engine"
      {...targetEvents('w-engine', onSourceToneChange)}
    >
      <legend><span>02</span> W-Engine and refinement</legend>
      <div className="selection-stack">
        <SelectionSurface
          ariaLabel={
            alternatives.length
              ? `Change W-Engine from ${W_ENGINES[engineId].name}`
              : `${W_ENGINES[engineId].name} selected`
          }
          editable={alternatives.length > 0}
          expanded={isOpen}
          onClick={() => setOpenSelector(isOpen ? null : selectorId)}
          buttonRef={openerRef}
        >
          <EngineCard engineId={engineId} refinement={refinement} />
        </SelectionSurface>
        {isOpen && (
          <div className="selector-region selector-region--engine" aria-label="W-Engine candidates">
            {alternatives.map((candidateId) => {
              const candidate = W_ENGINES[candidateId]
              return (
                <button
                  type="button"
                  className="selector-candidate selector-candidate--engine"
                  key={candidateId}
                  aria-label={`Select ${candidate.name} W${candidate.defaultRefinement}`}
                  onClick={() => {
                    dispatch({ type: 'selectEngine', agentId, engineId: candidateId })
                    setOpenSelector(null)
                    setRestoreFocus(true)
                  }}
                >
                  <EngineCard
                    engineId={candidateId}
                    refinement={candidate.defaultRefinement}
                  />
                </button>
              )
            })}
          </div>
        )}
      </div>
      <div
        className="refinement-control"
        role="group"
        aria-label={W_ENGINES[engineId].name + ' refinement'}
      >
        <span>REFINEMENT</span>
        <div>
          {([1, 2, 3, 4, 5] as Refinement[]).map((rank) => (
            <button
              type="button"
              key={rank}
              aria-pressed={refinement === rank}
              className={refinement === rank ? 'is-selected' : ''}
              onClick={() => dispatch({
                type: 'setRefinement',
                agentId,
                refinement: rank,
              })}
            >
              W{rank}
            </button>
          ))}
        </div>
      </div>
    </fieldset>
  )
}

function DiscEffectRows({
  discId,
  piece,
}: {
  discId: DiscId
  piece: 'fourPiece' | 'twoPiece'
}) {
  const disc = DRIVE_DISCS[discId]
  const rows = piece === 'fourPiece'
    ? [...(disc.fourPieceEffects ?? []), disc.twoPieceEffect]
    : [disc.twoPieceEffect]
  return (
    <span className="disc-effect-rows">
      {rows.map((effect, index) => (
        <span key={effect}>
          <small>
            {piece === 'fourPiece'
              ? index === 0
                ? '4PC'
                : index === rows.length - 1
                  ? '2PC'
                  : ''
              : '2PC'}
          </small>
          <b>{effect}</b>
        </span>
      ))}
    </span>
  )
}

function DiscCard({
  discId,
  piece,
}: {
  discId: DiscId
  piece: 'fourPiece' | 'twoPiece'
}) {
  const disc = DRIVE_DISCS[discId]
  return (
    <>
      <span className="equipment-art equipment-art--disc">
        <img src={disc.image} alt="" />
      </span>
      <span className="equipment-copy">
        <strong className="disc-name">{disc.name}</strong>
        <DiscEffectRows discId={discId} piece={piece} />
      </span>
    </>
  )
}

function DiscSelection({
  activeSourceTone,
  agentId,
  dispatch,
  onSourceToneChange,
  openSelector,
  piece,
  selectedId,
  setOpenSelector,
}: {
  agentId: AgentId
  dispatch: Dispatch<WorkbenchAction>
  openSelector: string | null
  piece: 'fourPiece' | 'twoPiece'
  selectedId: DiscId
  setOpenSelector: (value: string | null) => void
} & SourceInteractionProps) {
  const tone = piece === 'fourPiece' ? 'disc-4pc' : 'disc-2pc'
  const selectorId = `${agentId}-${piece}`
  const candidates = DISC_IDS_BY_AGENT_AND_PIECE[agentId][piece]
  const alternatives = candidates.filter((id) => id !== selectedId)
  const isOpen = openSelector === selectorId
  const disc = DRIVE_DISCS[selectedId]

  const openerRef = useRef<HTMLButtonElement>(null)
  const [restoreFocus, setRestoreFocus] = useState(false)

  useEffect(() => {
    if (!restoreFocus) return
    openerRef.current?.focus()
    setRestoreFocus(false)
  }, [restoreFocus])
  return (
    <div
      className={targetClass('disc-selection', tone, activeSourceTone)}
      data-source-tone={tone}
      {...targetEvents(tone, onSourceToneChange)}
    >
      <SelectionSurface
        ariaLabel={
          alternatives.length
            ? `Change ${piece === 'fourPiece' ? '4-piece' : '2-piece'} Drive Disc from ${disc.name}`
            : `${disc.name} selected as ${piece === 'fourPiece' ? '4-piece' : '2-piece'}`
        }
        editable={alternatives.length > 0}
        expanded={isOpen}
        onClick={() => setOpenSelector(isOpen ? null : selectorId)}
        buttonRef={openerRef}
      >
        <DiscCard discId={selectedId} piece={piece} />
      </SelectionSurface>
      {isOpen && (
        <div
          className="selector-region selector-region--disc"
          aria-label={piece + ' Drive Disc candidates'}
        >
          {alternatives.map((candidateId) => (
            <button
              type="button"
              className="selector-candidate selector-candidate--disc"
              key={candidateId}
              aria-label={`Select ${DRIVE_DISCS[candidateId].name} as ${piece}`}
              onClick={() => {
                dispatch({ type: 'selectDisc', agentId, piece, discId: candidateId })
                setOpenSelector(null)
                setRestoreFocus(true)
              }}
            >
              <DiscCard discId={candidateId} piece={piece} />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function MainStatSelection({
  activeSourceTone,
  agentId,
  dispatch,
  mainStatId,
  onSourceToneChange,
  openSelector,
  setOpenSelector,
  slot,
}: {
  agentId: AgentId
  dispatch: Dispatch<WorkbenchAction>
  mainStatId: MainStatId
  openSelector: string | null
  setOpenSelector: (value: string | null) => void
  slot: MainSlot
} & SourceInteractionProps) {
  const tone = `disc-slot-${slot.replace('slot', '')}`
  const selectorId = `${agentId}-${slot}`
  const candidates = MAIN_STAT_IDS_BY_AGENT_AND_SLOT[agentId][slot]
  const alternatives = candidates.filter((id) => id !== mainStatId)
  const isOpen = openSelector === selectorId
  const selected = MAIN_STATS[mainStatId]
  const openerRef = useRef<HTMLButtonElement>(null)
  const [restoreFocus, setRestoreFocus] = useState(false)

  useEffect(() => {
    if (!restoreFocus) return
    openerRef.current?.focus()
    setRestoreFocus(false)
  }, [restoreFocus])

  const content = (
    <>
      <small>DISC {slot.replace('slot', '')}</small>
      <span>{selected.label}</span>
      <strong>{selected.value}</strong>
    </>
  )

  return (
    <div
      className={targetClass('main-stat-selection', tone, activeSourceTone)}
      data-source-tone={tone}
      {...targetEvents(tone, onSourceToneChange)}
    >
      {alternatives.length > 0 ? (
        <button
          type="button"
          className="main-stat-block main-stat-block--editable"
          aria-label={`Change Disc ${slot.replace('slot', '')} main stat from ${selected.label}`}
          aria-expanded={isOpen}
          ref={openerRef}
          onClick={() => setOpenSelector(isOpen ? null : selectorId)}
        >
          {content}
        </button>
      ) : (
        <div
          className="main-stat-block main-stat-block--fixed"
          aria-label={`Disc ${slot.replace('slot', '')} ${selected.label} selected`}
        >
          {content}
        </div>
      )}
      {isOpen && (
        <div
          className="selector-region selector-region--main"
          aria-label={'Disc ' + slot.replace('slot', '') + ' main-stat candidates'}
        >
          {alternatives.map((candidateId) => {
            const candidate = MAIN_STATS[candidateId]
            return (
              <button
                type="button"
                key={candidateId}
                aria-label={`Select ${candidate.label} for Disc ${slot.replace('slot', '')}`}
                onClick={() => {
                  dispatch({
                    type: 'selectMainStat',
                    agentId,
                    slot,
                    mainStatId: candidateId,
                  })
                  setOpenSelector(null)
                  setRestoreFocus(true)
                }}
              >
                <span>{candidate.label}</span>
                <strong>{candidate.value}</strong>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

function EquipmentSelection({
  activeSourceTone,
  agentId,
  dispatch,
  onSourceToneChange,
  openSelector,
  setOpenSelector,
  state,
}: {
  agentId: AgentId
  state: WorkbenchState
  dispatch: Dispatch<WorkbenchAction>
  openSelector: string | null
  setOpenSelector: (value: string | null) => void
} & SourceInteractionProps) {
  const setup = state.setups[agentId]
  if (!setup.fourPieceId || !setup.twoPieceId) return null
  if (!Object.values(setup.mains).every(Boolean)) return null
  const agent = PARTY_AGENTS.find(({ id }) => id === agentId)!

  return (
    <section
      className="setup-group prepared-block"
      aria-labelledby={agentId + '-disc-heading'}
    >
      <h3 id={agentId + '-disc-heading'}><span>03</span> Drive Discs</h3>
      <div className="disc-grid">
        <DiscSelection
          activeSourceTone={activeSourceTone}
          agentId={agentId}
          dispatch={dispatch}
          onSourceToneChange={onSourceToneChange}
          openSelector={openSelector}
          piece="fourPiece"
          selectedId={setup.fourPieceId}
          setOpenSelector={setOpenSelector}
        />
        <DiscSelection
          activeSourceTone={activeSourceTone}
          agentId={agentId}
          dispatch={dispatch}
          onSourceToneChange={onSourceToneChange}
          openSelector={openSelector}
          piece="twoPiece"
          selectedId={setup.twoPieceId}
          setOpenSelector={setOpenSelector}
        />
      </div>
      <div className="main-stat-grid" aria-label={agent.name + ' prepared main stats'}>
        {(['slot4', 'slot5', 'slot6'] as MainSlot[]).map((slot) => (
          <MainStatSelection
            activeSourceTone={activeSourceTone}
            agentId={agentId}
            dispatch={dispatch}
            key={slot}
            mainStatId={setup.mains[slot]!}
            onSourceToneChange={onSourceToneChange}
            openSelector={openSelector}
            setOpenSelector={setOpenSelector}
            slot={slot}
          />
        ))}
      </div>
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
        <button
          type="button"
          aria-label={`Decrease ${label} hits`}
          disabled={count === 0}
          onClick={onDecrease}
        >{'\u2212'}</button>
        <output aria-live="polite" aria-label={`${label} hit count`}>{count}</output>
        <button
          type="button"
          aria-label={`Increase ${label} hits`}
          disabled={count === 36}
          onClick={onIncrease}
        >+</button>
      </div>
    </div>
  )
}

export function AgentSetup({
  activeSourceTone,
  agentId,
  dispatch,
  onSourceToneChange,
  state,
}: AgentSetupProps) {
  const [openSelector, setOpenSelector] = useState<string | null>(null)
  const setup = state.setups[agentId]
  const agent = PARTY_AGENTS.find((item) => item.id === agentId)!

  useEffect(() => {
    setOpenSelector(null)
  }, [agentId, setup.pool])

  return (
    <section className="setup-panel" aria-labelledby={agentId + '-setup-heading'}>
      <SetupHeading agentId={agentId} />
      <PoolSelection agentId={agentId} dispatch={dispatch} pool={setup.pool} />
      <EngineSelection
        activeSourceTone={activeSourceTone}
        agentId={agentId}
        dispatch={dispatch}
        onSourceToneChange={onSourceToneChange}
        openSelector={openSelector}
        setOpenSelector={setOpenSelector}
        state={state}
      />
      <EquipmentSelection
        activeSourceTone={activeSourceTone}
        agentId={agentId}
        dispatch={dispatch}
        onSourceToneChange={onSourceToneChange}
        openSelector={openSelector}
        setOpenSelector={setOpenSelector}
        state={state}
      />
      <fieldset className="setup-group substat-fieldset">
        <legend><span>04</span> Effective substat hits</legend>
        <p className="field-note">Independent setup inputs {'\u00B7'} prepared at zero {'\u00B7'} range 0{'\u2013'}36</p>
        <div className="substat-grid" aria-label={agent.name + ' prepared effective substats'}>
          {SUBSTAT_CHOICES_BY_AGENT[agentId].map((choice, index) => (
            <SubstatStepper
              activeSourceTone={activeSourceTone}
              count={setup.substats[choice.id] ?? 0}
              key={choice.id}
              label={choice.label}
              onDecrease={() => dispatch({
                type: 'adjustSubstat',
                agentId,
                key: choice.id,
                delta: -1,
              })}
              onIncrease={() => dispatch({
                type: 'adjustSubstat',
                agentId,
                key: choice.id,
                delta: 1,
              })}
              onSourceToneChange={onSourceToneChange}
              perHit={choice.perHit}
              tone={`substat-${index + 1}`}
              unit={choice.unit}
            />
          ))}
        </div>
      </fieldset>
    </section>
  )
}
