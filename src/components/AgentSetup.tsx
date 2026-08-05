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
import type { Mindscape, WorkbenchAction, WorkbenchState } from '../workbench/state'

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
      <span className="edit-state">
        {agentId === 'yixuan' ? 'FOCUS / YIXUAN' : 'EDITABLE'}
      </span>
    </header>
  )
}

function PoolSelection({
  activeSourceTone,
  agentId,
  dispatch,
  mindscape,
  onSourceToneChange,
  pool,
}: {
  agentId: AgentId
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
          {...targetEvents('mindscape', onSourceToneChange)}
        >
          <small>MINDSCAPE</small>
          <div className="mindscape-rail" role="group" aria-label="Mindscape">
            {([0, 1, 2, 3, 4, 5, 6] as Mindscape[]).map((level) => (
              <button
                type="button"
                key={level}
                aria-label={`M${level}`}
                aria-pressed={mindscape === level}
                onClick={() => dispatch({ type: 'setMindscape', agentId, mindscape: level })}
              >
                M{level}
              </button>
            ))}
          </div>
        </div>
        <div className="pool-control">
          <small>W-ENGINE POOL</small>
          <div className="segmented-control">
            <button
              type="button"
              className={pool === 'full' ? 'is-selected' : ''}
              aria-label="Full pool"
              aria-pressed={pool === 'full'}
              onClick={() => dispatch({ type: 'switchPool', agentId, pool: 'full' })}
            >
              Full
            </button>
            <button
              type="button"
              className={pool === 'nonLimited' ? 'is-selected' : ''}
              aria-pressed={pool === 'nonLimited'}
              onClick={() => dispatch({ type: 'switchPool', agentId, pool: 'nonLimited' })}
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
      <span className="equipment-art equipment-art--engine">
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
    <section
      className={targetClass('setup-group equipment-fieldset', 'w-engine', activeSourceTone)}
      data-source-tone="w-engine"
      aria-labelledby={agentId + '-engine-heading'}
      {...targetEvents('w-engine', onSourceToneChange)}
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
                  aria-label={`Select ${candidate.name} W${candidate.defaultRefinement}`}
                  onClick={() => {
                    dispatch({ type: 'selectEngine', agentId, engineId: candidateId })
                    setOpenSelector(null)
                    setRestoreFocus(true)
                  }}
                >
                  <EngineCard
                    candidate
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
  isDialynEnergyRegenChoice = false,
  piece,
}: {
  discId: DiscId
  isDialynEnergyRegenChoice?: boolean
  piece: 'fourPiece' | 'twoPiece'
}) {
  const disc = DRIVE_DISCS[discId]
  return (
    <>
      <span className="equipment-art equipment-art--disc">
        {isDialynEnergyRegenChoice ? (
          <span className="disc-composite-art" aria-hidden="true">
            <img className="disc-composite-art__a" src={DRIVE_DISCS.swingJazz.image} alt="" />
            <img className="disc-composite-art__b" src={DRIVE_DISCS.moonlight.image} alt="" />
            <svg viewBox="0 0 100 100" preserveAspectRatio="none">
              <line className="disc-composite-art__seam" x1="62" y1="0" x2="42" y2="100" />
              <line className="disc-composite-art__accent" x1="62" y1="0" x2="42" y2="100" />
            </svg>
            <i className="disc-composite-art__or">OR</i>
          </span>
        ) : <img src={disc.image} alt="" />}
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
  const isDialynEnergyRegenChoice = agentId === 'dialyn'
    && piece === 'twoPiece'
    && selectedId === 'swingJazz'
  const selectedName = isDialynEnergyRegenChoice
    ? 'Swing Jazz or Moonlight Lullaby'
    : disc.name

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
          isDialynEnergyRegenChoice={isDialynEnergyRegenChoice}
          piece={piece}
        />
      </SelectionSurface>
      {isOpen && (
        <div
          className="selector-region selector-region--disc"
          aria-label={piece + ' Drive Disc candidates'}
        >
          {alternatives.map((candidateId) => {
            const isEnergyRegenAlternative = agentId === 'dialyn'
              && piece === 'twoPiece'
              && candidateId === 'swingJazz'
            const candidateName = isEnergyRegenAlternative
              ? 'Swing Jazz or Moonlight Lullaby'
              : DRIVE_DISCS[candidateId].name
            return (
              <button
                type="button"
                className="selector-candidate selector-candidate--disc"
                key={candidateId}
                aria-label={`Select ${candidateName} as ${piece}`}
                onClick={() => {
                  dispatch({ type: 'selectDisc', agentId, piece, discId: candidateId })
                  setOpenSelector(null)
                  setRestoreFocus(true)
                }}
              >
                <DiscCard
                  discId={candidateId}
                  isDialynEnergyRegenChoice={isEnergyRegenAlternative}
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
      <small className="main-stat-block__slot">DISC {slot.replace('slot', '')}</small>
      <span className="main-stat-block__details">
        <span>{selected.label}</span>
        <strong>{selected.value}</strong>
      </span>
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
          <span className="main-stat-block__change" aria-hidden="true">&#9660;</span>
        </button>
      ) : (
        <div
          className="main-stat-block main-stat-block--fixed"
          aria-label={`Disc ${slot.replace('slot', '')} ${selected.label} selected`}
        >
          {content}
          <span className="main-stat-block__fixed" role="img" aria-label="Fixed selection" />
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

function StatBank({
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
  if (!Object.values(setup.mains).every(Boolean)) return null
  const agent = PARTY_AGENTS.find(({ id }) => id === agentId)!

  return (
    <section className="setup-group stat-bank" aria-labelledby={agentId + '-stat-bank-heading'}>
      <h3 id={agentId + '-stat-bank-heading'}><span>04</span> Stat bank</h3>
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
      <p className="field-note">Effective substat hits / prepared at zero / range 0-36</p>
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
  const [openSelector, setOpenSelector] = useState<string | null>(null)
  const setup = state.setups[agentId]

  useEffect(() => {
    setOpenSelector(null)
  }, [agentId, setup.mindscape, setup.pool])

  return (
    <section className="setup-panel" aria-labelledby={agentId + '-setup-heading'}>
      <SetupHeading agentId={agentId} />
      <div className="setup-chassis">
        <PoolSelection
          activeSourceTone={activeSourceTone}
          agentId={agentId}
          dispatch={dispatch}
          mindscape={setup.mindscape}
          onSourceToneChange={onSourceToneChange}
          pool={setup.pool}
        />
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
        <StatBank
          activeSourceTone={activeSourceTone}
          agentId={agentId}
          dispatch={dispatch}
          onSourceToneChange={onSourceToneChange}
          openSelector={openSelector}
          setOpenSelector={setOpenSelector}
          state={state}
        />
      </div>
    </section>
  )
}
