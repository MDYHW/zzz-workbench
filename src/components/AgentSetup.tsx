import { useEffect, useRef, useState, type Dispatch, type ReactNode, type Ref } from 'react'
import {
  DISC_IDS_BY_AGENT_AND_PIECE,
  defaultRefinementFor,
  DRIVE_DISCS,
  ENGINE_IDS_BY_AGENT_AND_POOL,
  MAIN_STATS,
  mainStatDisplay,
  ADMITTED_AGENTS,
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
import type { AgentSetupState, AppliedSlot, Mindscape, WorkbenchAction } from '../workbench/state'
import {
  sourceToneEvents,
  useSelectionFocusReturn,
  type SourceInteractionProps,
} from './sourceInteraction'

interface AgentSetupProps extends SourceInteractionProps {
  slot: AppliedSlot
  agentId: AgentId
  setup: AgentSetupState
  mainStatCandidates: Record<MainSlot, readonly MainStatId[]>
  dispatch: Dispatch<WorkbenchAction>
}

function targetClass(base: string, tone: string, activeSourceTone: string | null): string {
  return `${base} source-target source-tone--${tone}${activeSourceTone === tone ? ' is-source-active' : ''}`
}

function PoolSelection({
  activeSourceTone,
  agentId,
  slot,
  dispatch,
  mindscape,
  onSourceToneChange,
  pool,
}: {
  agentId: AgentId
  slot: AppliedSlot
  dispatch: Dispatch<WorkbenchAction>
  mindscape: Mindscape
  pool: PoolId
} & SourceInteractionProps) {
  return (
    <section className="setup-group pool-fieldset" aria-labelledby={agentId + '-loadout-heading'}>
      <h3 id={agentId + '-loadout-heading'}><span>01</span> Loadout control</h3>
      <div className="loadout-control-grid">
        <div
          className={targetClass('mindscape-control', 'mindscape', activeSourceTone)}
          data-source-tone="mindscape"
          {...sourceToneEvents('mindscape', onSourceToneChange)}
        >
          <h4 className="loadout-control__group-heading">Mindscape</h4>
          <div className="mindscape-rail" role="group" aria-label="Mindscape">
            {([0, 1, 2, 3, 4, 5, 6] as Mindscape[]).map((level) => (
              <button
                type="button"
                key={level}
                aria-label={`M${level}`}
                aria-pressed={mindscape === level}
                onClick={() => dispatch({ type: 'setMindscape', slot, mindscape: level })}
              >
                M{level}
              </button>
            ))}
          </div>
        </div>
        <div className="pool-control">
          <h4 className="loadout-control__group-heading">W-Engine Pool</h4>
          <div className="segmented-control">
            <button
              type="button"
              className={pool === 'full' ? 'is-selected' : ''}
              aria-label="Full pool"
              aria-pressed={pool === 'full'}
              onClick={() => dispatch({ type: 'switchPool', slot, pool: 'full' })}
            >
              Full
            </button>
            <button
              type="button"
              className={pool === 'nonLimited' ? 'is-selected' : ''}
              aria-pressed={pool === 'nonLimited'}
              onClick={() => dispatch({ type: 'switchPool', slot, pool: 'nonLimited' })}
            >
              Non-limited
            </button>
          </div>
        </div>
      </div>
    </section>
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
      <span className="selection-surface__change" aria-hidden="true">&#9660;</span>
    </button>
  ) : (
    <div className="selection-surface selection-surface--fixed" aria-label={ariaLabel}>
      {children}
      <span className="selection-surface__fixed" role="img" aria-label="Fixed selection" />
    </div>
  )
}

function EngineCard({
  engineId,
  refinement,
  compact = false,
  candidate = false,
}: {
  engineId: EngineId
  refinement: Refinement
  compact?: boolean
  candidate?: boolean
}) {
  const engine = W_ENGINES[engineId]
  return (
    <>
      <span className={`equipment-art equipment-art--engine engine-art--${engineId}`}>
        <img src={engine.image} alt="" />
      </span>
      <span className="equipment-copy">
        <span className="equipment-name-line">
          <strong>{engine.name}</strong>
          <span className="equipment-rank">
            {candidate ? engine.rank + ' / W' + refinement : engine.rank}
          </span>
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
  slot,
  dispatch,
  onSourceToneChange,
  openSelector,
  setOpenSelector,
  setup,
}: {
  agentId: AgentId
  slot: AppliedSlot
  setup: AgentSetupState
  dispatch: Dispatch<WorkbenchAction>
  openSelector: string | null
  setOpenSelector: (value: string | null) => void
} & SourceInteractionProps) {
  const engineId = setup.engineId
  const refinement = setup.refinement
  if (!engineId || !refinement) return null

  const selectorId = `${agentId}-engine`
  const candidates = ENGINE_IDS_BY_AGENT_AND_POOL[agentId][setup.pool]
  const alternatives = candidates.filter((id) => id !== engineId)
  const isOpen = openSelector === selectorId
  const { openerRef, requestFocusReturn } = useSelectionFocusReturn()

  return (
    <section
      className={targetClass('setup-group equipment-fieldset', 'w-engine', activeSourceTone)}
      data-source-tone="w-engine"
      aria-labelledby={agentId + '-engine-heading'}
      {...sourceToneEvents('w-engine', onSourceToneChange)}
    >
      <h3 id={agentId + '-engine-heading'}><span>02</span> Engine bay</h3>
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
                  aria-label={`Select ${candidate.name} W${defaultRefinementFor(candidate.rank)}`}
                  onClick={() => {
                    dispatch({ type: 'selectEngine', slot, engineId: candidateId })
                    setOpenSelector(null)
                    requestFocusReturn()
                  }}
                >
                  <EngineCard
                    candidate
                    engineId={candidateId}
                    refinement={defaultRefinementFor(candidate.rank)}
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
        <div>
          {([1, 2, 3, 4, 5] as Refinement[]).map((rank) => (
            <button
              type="button"
              key={rank}
              aria-pressed={refinement === rank}
              className={refinement === rank ? 'is-selected' : ''}
              onClick={() => dispatch({
                type: 'setRefinement',
                slot,
                refinement: rank,
              })}
            >
              W{rank}
            </button>
          ))}
        </div>
      </div>
    </section>
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
  if (piece === 'twoPiece') {
    return (
      <span className="disc-effect-rows disc-effect-rows--two-piece">
        <span>
          <small>2PC</small>
          <b>{disc.twoPieceEffect}</b>
        </span>
      </span>
    )
  }

  return (
    <span className="disc-effect-rows disc-effect-rows--four-piece">
      {(disc.fourPieceEffects ?? []).map((effect, index) => (
        <span key={effect}>
          <small>{index === 0 ? '4PC' : ''}</small>
          <b>{effect}</b>
        </span>
      ))}
      <span className="disc-effect-row--two-piece">
        <small>2PC</small>
        <b>{disc.twoPieceEffect}</b>
      </span>
    </span>
  )
}

function DiscCard({
  discId,
  piece,
  showHead = false,
}: {
  discId: DiscId
  piece: 'fourPiece' | 'twoPiece'
  showHead?: boolean
}) {
  const disc = DRIVE_DISCS[discId]
  return (
    <>
      {showHead && (
        <small className="disc-card__head">{piece === 'fourPiece' ? '4PC' : '2PC'}</small>
      )}
      <span className="equipment-art equipment-art--disc">
        <img src={disc.image} alt="" />
      </span>
      <span className="equipment-copy">
        <DiscEffectRows discId={discId} piece={piece} />
      </span>
    </>
  )
}

function DiscSelection({
  activeSourceTone,
  agentId,
  slot,
  dispatch,
  onSourceToneChange,
  openSelector,
  piece,
  selectedId,
  otherPieceId,
  setOpenSelector,
}: {
  agentId: AgentId
  slot: AppliedSlot
  dispatch: Dispatch<WorkbenchAction>
  openSelector: string | null
  piece: 'fourPiece' | 'twoPiece'
  selectedId: DiscId
  otherPieceId: DiscId
  setOpenSelector: (value: string | null) => void
} & SourceInteractionProps) {
  const tone = piece === 'fourPiece' ? 'disc-4pc' : 'disc-2pc'
  const selectorId = `${agentId}-${piece}`
  const candidates = DISC_IDS_BY_AGENT_AND_PIECE[agentId]
  const alternatives = piece === 'twoPiece'
    ? candidates.twoPiece.filter((id) => id !== selectedId && id !== otherPieceId)
    : candidates.fourPiece.filter((id) => id !== selectedId && (
      id !== otherPieceId || candidates.twoPiece.includes(selectedId)
    ))
  const isOpen = openSelector === selectorId
  const disc = DRIVE_DISCS[selectedId]
  const selectedName = disc.name

  const { openerRef, requestFocusReturn } = useSelectionFocusReturn()
  return (
    <div
      className={targetClass('disc-selection', tone, activeSourceTone)}
      data-source-tone={tone}
      {...sourceToneEvents(tone, onSourceToneChange)}
    >
      <SelectionSurface
        ariaLabel={
          alternatives.length
            ? `Change ${piece === 'fourPiece' ? '4-piece' : '2-piece'} Drive Disc from ${selectedName}`
            : `${selectedName} selected as ${piece === 'fourPiece' ? '4-piece' : '2-piece'}`
        }
        editable={alternatives.length > 0}
        expanded={isOpen}
        onClick={() => setOpenSelector(isOpen ? null : selectorId)}
        buttonRef={openerRef}
      >
        <DiscCard
          discId={selectedId}
          piece={piece}
          showHead
        />
      </SelectionSurface>
      {isOpen && (
        <div
          className="selector-region selector-region--disc"
          aria-label={piece + ' Drive Disc candidates'}
        >
          {alternatives.map((candidateId) => {
            const candidateName = DRIVE_DISCS[candidateId].name
            return (
              <button
                type="button"
                className="selector-candidate selector-candidate--disc"
                key={candidateId}
                aria-label={`Select ${candidateName} as ${piece}`}
                onClick={() => {
                  dispatch({ type: 'selectDisc', slot, piece, discId: candidateId })
                  setOpenSelector(null)
                  requestFocusReturn()
                }}
              >
                <DiscCard
                  discId={candidateId}
                  piece={piece}
                />
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

function MainStatSelection({
  activeSourceTone,
  agentId,
  appliedSlot,
  dispatch,
  candidates,
  mainStatId,
  onSourceToneChange,
  openSelector,
  setOpenSelector,
  mainSlot,
}: {
  agentId: AgentId
  appliedSlot: AppliedSlot
  dispatch: Dispatch<WorkbenchAction>
  candidates: readonly MainStatId[]
  mainStatId: MainStatId | null
  openSelector: string | null
  setOpenSelector: (value: string | null) => void
  mainSlot: MainSlot
} & SourceInteractionProps) {
  const tone = `disc-slot-${mainSlot.replace('slot', '')}`
  const selectorId = `${agentId}-${mainSlot}`
  const alternatives = mainStatId === null
    ? candidates
    : candidates.filter((id) => id !== mainStatId)
  const isOpen = openSelector === selectorId
  const selected = mainStatId === null ? null : MAIN_STATS[mainStatId]
  const focusTargetRef = useRef<HTMLElement | null>(null)
  const [shouldReturnFocus, setShouldReturnFocus] = useState(false)

  useEffect(() => {
    if (!shouldReturnFocus) return
    focusTargetRef.current?.focus()
    setShouldReturnFocus(false)
  }, [shouldReturnFocus])

  const selectedContent = selected && (
    <>
      <small className="main-stat-block__slot">DISC {mainSlot.replace('slot', '')}</small>
      <span className="main-stat-block__details">
        <span>{selected.label}</span>
        <strong>{mainStatDisplay(selected.numericValue)}</strong>
      </span>
    </>
  )

  const requiredContent = (
    <>
      <small className="main-stat-block__slot">DISC {mainSlot.replace('slot', '')}</small>
      <span className="main-stat-block__details main-stat-block__details--required">
        <span>Main stat required</span>
        <strong>Select</strong>
      </span>
    </>
  )

  return (
    <div
      className={targetClass('main-stat-selection', tone, activeSourceTone)}
      data-source-tone={tone}
      {...sourceToneEvents(tone, onSourceToneChange)}
    >
      {mainStatId === null || alternatives.length > 0 ? (
        <button
          type="button"
          className={`main-stat-block main-stat-block--editable${mainStatId === null ? ' main-stat-block--required' : ''}`}
          aria-label={mainStatId === null
            ? `Disc ${mainSlot.replace('slot', '')} main stat required`
            : `Change Disc ${mainSlot.replace('slot', '')} main stat from ${selected!.label}`}
          aria-expanded={isOpen}
          ref={(node) => { focusTargetRef.current = node }}
          onClick={() => setOpenSelector(isOpen ? null : selectorId)}
        >
          {mainStatId === null ? requiredContent : selectedContent}
          <span className="main-stat-block__change" aria-hidden="true">&#9660;</span>
        </button>
      ) : (
        <div
          className="main-stat-block main-stat-block--fixed"
          aria-label={`Disc ${mainSlot.replace('slot', '')} ${selected!.label} selected`}
          ref={(node) => { focusTargetRef.current = node }}
          tabIndex={-1}
        >
          {selectedContent}
          <span className="main-stat-block__fixed" role="img" aria-label="Fixed selection" />
        </div>
      )}
      {isOpen && (
        <div
          className="selector-region selector-region--main"
          aria-label={'Disc ' + mainSlot.replace('slot', '') + ' main-stat candidates'}
        >
          {alternatives.map((candidateId) => {
            const candidate = MAIN_STATS[candidateId]
            return (
              <button
                type="button"
                key={candidateId}
                aria-label={`Select ${candidate.label} for Disc ${mainSlot.replace('slot', '')}`}
                onClick={() => {
                  dispatch({
                    type: 'selectMainStat',
                    slot: appliedSlot,
                    mainSlot,
                    mainStatId: candidateId,
                  })
                  setOpenSelector(null)
                  setShouldReturnFocus(true)
                }}
              >
                <span>{candidate.label}</span>
                <strong>{mainStatDisplay(candidate.numericValue)}</strong>
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
  slot,
  dispatch,
  onSourceToneChange,
  openSelector,
  setOpenSelector,
  setup,
}: {
  agentId: AgentId
  slot: AppliedSlot
  setup: AgentSetupState
  dispatch: Dispatch<WorkbenchAction>
  openSelector: string | null
  setOpenSelector: (value: string | null) => void
} & SourceInteractionProps) {
  if (!setup.fourPieceId || !setup.twoPieceId) return null

  return (
    <section
      className="setup-group prepared-block"
      aria-labelledby={agentId + '-disc-heading'}
    >
      <h3 id={agentId + '-disc-heading'}><span>03</span> Disc deck</h3>
      <div className="disc-grid">
        <DiscSelection
          activeSourceTone={activeSourceTone}
          agentId={agentId}
          slot={slot}
          dispatch={dispatch}
          onSourceToneChange={onSourceToneChange}
          openSelector={openSelector}
          piece="fourPiece"
          selectedId={setup.fourPieceId}
          otherPieceId={setup.twoPieceId}
          setOpenSelector={setOpenSelector}
        />
        <DiscSelection
          activeSourceTone={activeSourceTone}
          agentId={agentId}
          slot={slot}
          dispatch={dispatch}
          onSourceToneChange={onSourceToneChange}
          openSelector={openSelector}
          piece="twoPiece"
          selectedId={setup.twoPieceId}
          otherPieceId={setup.fourPieceId}
          setOpenSelector={setOpenSelector}
        />
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
  onSetCount,
  onSourceToneChange,
  perHit,
  tone,
  unit,
}: {
  count: number
  label: string
  onDecrease: () => void
  onIncrease: () => void
  onSetCount: (value: number) => void
  perHit: number
  tone: string
  unit: string
} & SourceInteractionProps) {
  const [draft, setDraft] = useState(String(count))

  useEffect(() => {
    setDraft(String(count))
  }, [count])

  const commitDraft = () => {
    if (draft === '') {
      setDraft(String(count))
      return
    }

    const requested = Number(draft)
    if (!Number.isInteger(requested)) {
      setDraft(String(count))
      return
    }

    const next = Math.min(36, Math.max(0, requested))

    if (next !== count) onSetCount(next)
    setDraft(String(next))
  }

  return (
    <div
      className={targetClass('substat-control', tone, activeSourceTone)}
      data-source-tone={tone}
      {...sourceToneEvents(tone, onSourceToneChange)}
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
        <input
          aria-label={`${label} hit count`}
          inputMode="numeric"
          max={36}
          min={0}
          onBlur={commitDraft}
          onChange={(event) => {
            const next = event.target.value
            if (/^\d*$/.test(next)) {
              setDraft(next)
            }
          }}
          onFocus={(event) => event.currentTarget.select()}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault()
              event.currentTarget.blur()
            }
          }}
          type="text"
          value={draft}
        />
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

function StatBank({
  activeSourceTone,
  agentId,
  slot,
  dispatch,
  onSourceToneChange,
  openSelector,
  setOpenSelector,
  setup,
  mainStatCandidates,
}: {
  agentId: AgentId
  slot: AppliedSlot
  setup: AgentSetupState
  mainStatCandidates: Record<MainSlot, readonly MainStatId[]>
  dispatch: Dispatch<WorkbenchAction>
  openSelector: string | null
  setOpenSelector: (value: string | null) => void
} & SourceInteractionProps) {
  const agent = ADMITTED_AGENTS.find(({ id }) => id === agentId)!

  return (
    <section className="setup-group stat-bank" aria-labelledby={agentId + '-stat-bank-heading'}>
      <h3 id={agentId + '-stat-bank-heading'}><span>04</span> Stat bank</h3>
      <h4 className="stat-bank__group-heading">Main stats</h4>
      <div className="main-stat-grid" aria-label={agent.name + ' prepared main stats'}>
        {(['slot4', 'slot5', 'slot6'] as MainSlot[]).map((mainSlot) => (
          <MainStatSelection
            activeSourceTone={activeSourceTone}
            agentId={agentId}
            appliedSlot={slot}
            candidates={mainStatCandidates[mainSlot]}
            dispatch={dispatch}
            key={mainSlot}
            mainStatId={setup.mains[mainSlot]!}
            onSourceToneChange={onSourceToneChange}
            openSelector={openSelector}
            setOpenSelector={setOpenSelector}
            mainSlot={mainSlot}
          />
        ))}
      </div>
      <h4 className="stat-bank__group-heading">Sub stats</h4>
      <div className="substat-grid" aria-label={agent.name + ' prepared effective substats'}>
        {SUBSTAT_CHOICES_BY_AGENT[agentId].map((choice, index) => (
          <SubstatStepper
            activeSourceTone={activeSourceTone}
            count={setup.substats[choice.id] ?? 0}
            key={choice.id}
            label={choice.label}
            onDecrease={() => dispatch({
              type: 'adjustSubstat',
              slot,
              key: choice.id,
              delta: -1,
            })}
            onIncrease={() => dispatch({
              type: 'adjustSubstat',
              slot,
              key: choice.id,
              delta: 1,
            })}
            onSetCount={(value) => dispatch({
              type: 'setSubstat',
              slot,
              key: choice.id,
              value,
            })}
            onSourceToneChange={onSourceToneChange}
            perHit={choice.perHit}
            tone={`substat-${index + 1}`}
            unit={choice.unit}
          />
        ))}
      </div>
    </section>
  )
}

export function AgentSetup({
  activeSourceTone,
  agentId,
  slot,
  dispatch,
  mainStatCandidates,
  onSourceToneChange,
  setup,
}: AgentSetupProps) {
  const [openSelector, setOpenSelector] = useState<string | null>(null)
  const agent = ADMITTED_AGENTS.find(({ id }) => id === agentId)!

  useEffect(() => {
    setOpenSelector(null)
  }, [agentId, setup.mindscape, setup.pool])

  return (
    <section className="setup-panel" aria-label={agent.name + ' setup'}>
      <div className="setup-chassis">
        <PoolSelection
          activeSourceTone={activeSourceTone}
          agentId={agentId}
          slot={slot}
          dispatch={dispatch}
          mindscape={setup.mindscape}
          onSourceToneChange={onSourceToneChange}
          pool={setup.pool}
        />
        <EngineSelection
          activeSourceTone={activeSourceTone}
          agentId={agentId}
          slot={slot}
          dispatch={dispatch}
          onSourceToneChange={onSourceToneChange}
          openSelector={openSelector}
          setOpenSelector={setOpenSelector}
          setup={setup}
        />
        <EquipmentSelection
          activeSourceTone={activeSourceTone}
          agentId={agentId}
          slot={slot}
          dispatch={dispatch}
          onSourceToneChange={onSourceToneChange}
          openSelector={openSelector}
          setOpenSelector={setOpenSelector}
          setup={setup}
        />
        <StatBank
          activeSourceTone={activeSourceTone}
          agentId={agentId}
          slot={slot}
          dispatch={dispatch}
          mainStatCandidates={mainStatCandidates}
          onSourceToneChange={onSourceToneChange}
          openSelector={openSelector}
          setOpenSelector={setOpenSelector}
          setup={setup}
        />
      </div>
    </section>
  )
}
