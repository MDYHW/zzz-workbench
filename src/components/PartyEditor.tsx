import { useEffect, useRef, useState, type Dispatch } from 'react'
import {
  ADMITTED_AGENTS,
  agentDisplayName,
  type AgentAttribute,
  type AgentId,
  type AgentSpecialty,
} from '../workbench/content'
import type { AppliedSlot, PartyDraft, WorkbenchAction, WorkbenchState } from '../workbench/state'
import { ATTRIBUTE_MARKS, RANK_MARKS, SPECIALTY_MARKS } from './agentIdentityMarks'
import { AGENT_SELECTOR_PORTRAITS } from './agentSelectorPortraits'

const AGENT_NAME_COLLATOR = new Intl.Collator('en', { numeric: true, sensitivity: 'base' })
type PartyEditAttributeFilter = Exclude<AgentAttribute, 'Auric Ink' | 'Honed Edge' | 'Frost'>

const PARTY_EDIT_ATTRIBUTE_GROUPS: Record<AgentAttribute, PartyEditAttributeFilter> = {
  'Auric Ink': 'Ether',
  Electric: 'Electric',
  Ether: 'Ether',
  Fire: 'Fire',
  Frost: 'Ice',
  'Honed Edge': 'Physical',
  Ice: 'Ice',
  Lumiflux: 'Lumiflux',
  Physical: 'Physical',
  Wind: 'Wind',
}

const PARTY_EDIT_ATTRIBUTE_LABELS: Partial<Record<PartyEditAttributeFilter, string>> = {
  Ether: 'Ether Attribute family, including Auric Ink',
  Ice: 'Ice Attribute family, including Frost',
  Physical: 'Physical Attribute family, including Honed Edge',
}

const SORTED_AGENTS = [...ADMITTED_AGENTS].sort((left, right) => (
  AGENT_NAME_COLLATOR.compare(agentDisplayName(left), agentDisplayName(right))
))
const ATTRIBUTE_FILTERS = [...new Set(ADMITTED_AGENTS.map((agent) => (
  PARTY_EDIT_ATTRIBUTE_GROUPS[agent.attribute]
)))]
  .sort((left, right) => AGENT_NAME_COLLATOR.compare(left, right))
const SPECIALTY_FILTERS = [...new Set(ADMITTED_AGENTS.map((agent) => agent.specialty))]
  .sort((left, right) => AGENT_NAME_COLLATOR.compare(left, right))

function DraftPortrait({ agentId }: { agentId: AgentId }) {
  return (
    <span className="party-editor__portrait party-editor__portrait--draft" aria-hidden="true">
      <img src={AGENT_SELECTOR_PORTRAITS[agentId]} alt="" />
    </span>
  )
}

function PoolPortrait({ agentId }: { agentId: AgentId }) {
  return (
    <span className="party-editor__portrait party-editor__portrait--pool" aria-hidden="true">
      <img src={AGENT_SELECTOR_PORTRAITS[agentId]} alt="" />
    </span>
  )
}

interface PartyEditorProps {
  draft: PartyDraft
  state: WorkbenchState
  dispatch: Dispatch<WorkbenchAction>
  onClosed: () => void
}

export function PartyEditor({ draft, state, dispatch, onClosed }: PartyEditorProps) {
  const [target, setTarget] = useState<AppliedSlot | null>(null)
  const [focusOpen, setFocusOpen] = useState(false)
  const [attribute, setAttribute] = useState<'all' | PartyEditAttributeFilter>('all')
  const [specialty, setSpecialty] = useState<'all' | AgentSpecialty>('all')
  const draftSlots = useRef<Array<HTMLButtonElement | null>>([])
  const focusChange = useRef<HTMLButtonElement>(null)
  const focusOptions = useRef<HTMLDivElement>(null)
  const focusRequestedByApply = useRef(false)
  const candidatePool = useRef<HTMLDivElement>(null)
  const changed = draft.focusSlot !== state.focusSlot
    || draft.agentIds.some((agentId, index) => agentId !== state.slots[index].agentId)
  const candidates = SORTED_AGENTS.filter((agent) => (
    (attribute === 'all' || PARTY_EDIT_ATTRIBUTE_GROUPS[agent.attribute] === attribute)
    && (specialty === 'all' || agent.specialty === specialty)
  ))
  const availableCandidates = candidates.filter((agent) => !draft.agentIds.includes(agent.id))
  const distinctParty = new Set(draft.agentIds).size === 3
  const eligible = draft.agentIds.flatMap((agentId, slot) => (
    ADMITTED_AGENTS.find((agent) => agent.id === agentId)?.focusEligible ? [slot as AppliedSlot] : []
  ))
  const canResolveFocus = changed
    && distinctParty
    && eligible.length > 1
    && draft.focusSlot === null
  const canApply = changed
    && distinctParty
    && eligible.length > 0
    && draft.focusSlot !== null
  const selectedFocusSlot = draft.focusSlot
  const selectedFocus = selectedFocusSlot === null
    ? null
    : ADMITTED_AGENTS.find((agent) => agent.id === draft.agentIds[selectedFocusSlot])
  const focusStatus = eligible.length === 1
    ? `${agentDisplayName(ADMITTED_AGENTS.find((agent) => agent.id === draft.agentIds[eligible[0]])!)} is Focus automatically.`
    : eligible.length === 0
      ? 'No eligible Focus Agent. Replace one draft member before applying.'
      : selectedFocus
        ? `${agentDisplayName(selectedFocus)} is Focus.`
        : 'Choose a Focus Agent before applying.'

  useEffect(() => { draftSlots.current[0]?.focus() }, [])
  useEffect(() => {
    if (target === null) return
    const firstAvailable = candidatePool.current?.querySelector<HTMLButtonElement>('button:not(:disabled)')
    firstAvailable?.focus()
  }, [target])
  useEffect(() => {
    if (eligible.length < 2) setFocusOpen(false)
  }, [eligible.length])
  useEffect(() => {
    if (!focusOpen || !focusRequestedByApply.current) return
    focusRequestedByApply.current = false
    focusOptions.current?.querySelector<HTMLButtonElement>('button')?.focus()
  }, [focusOpen])

  const close = () => {
    dispatch({ type: 'closePartyEdit' })
    onClosed()
  }
  const apply = () => {
    if (canResolveFocus) {
      setTarget(null)
      if (focusOpen) {
        focusOptions.current?.querySelector<HTMLButtonElement>('button')?.focus()
        return
      }
      focusRequestedByApply.current = true
      setFocusOpen(true)
      return
    }
    dispatch({ type: 'applyPartyEdit' })
    onClosed()
  }

  return (
    <section className="party-editor" aria-labelledby="party-editor-heading">
      <div className="party-editor__heading">
        <h2 id="party-editor-heading">Editing party</h2>
        <span aria-live="polite">{target === null ? focusStatus : `Replacing slot ${target + 1}. ${availableCandidates.length} available Agents.`}</span>
      </div>
      <div className="party-editor__formation">
        <div className="party-editor__draft-rail">
          <ol className="party-editor__slots" aria-label="Draft party slots">
            {draft.agentIds.map((agentId, slot) => {
              const agent = ADMITTED_AGENTS.find((item) => item.id === agentId)!
              const agentName = agentDisplayName(agent)
              const selected = target === slot
              const isFocus = draft.focusSlot === slot
              return (
                <li key={slot}>
                  <button
                    ref={(element) => { draftSlots.current[slot] = element }}
                    type="button"
                    className={`draft-slot${selected ? ' is-target' : ''}${isFocus ? ' is-focus' : ''}`}
                    aria-pressed={selected}
                    aria-label={`Replace slot ${slot + 1}, ${agentName}`}
                    onClick={() => {
                      setTarget(selected ? null : (slot as AppliedSlot))
                      setFocusOpen(false)
                    }}
                  >
                    <DraftPortrait agentId={agentId} />
                    <span className="draft-slot__identity">
                      <strong>{agentName}</strong>
                      <span className="draft-slot__marks" aria-hidden="true">
                        <img src={RANK_MARKS[agent.rank]} alt="" />
                        <img src={ATTRIBUTE_MARKS[agent.attribute]} alt="" />
                        <img src={SPECIALTY_MARKS[agent.specialty]} alt="" />
                      </span>
                    </span>
                    <span className="draft-slot__replace" aria-hidden="true">Replace</span>
                    <span className="draft-slot__focus-marker" aria-hidden="true">Focus</span>
                  </button>
                </li>
              )
            })}
          </ol>
          <div className="party-editor__focus-dock">
            <button
              ref={focusChange}
              type="button"
              className="party-editor__focus-change"
              aria-expanded={eligible.length > 1 ? focusOpen : false}
              aria-controls={focusOpen && eligible.length > 1 ? 'party-editor-focus-popup' : undefined}
              aria-label={eligible.length > 1 ? 'Change Focus Agent' : focusStatus}
              disabled={eligible.length < 2}
              onClick={() => setFocusOpen((open) => !open)}
            >
              <span className="party-editor__focus-ring" aria-hidden="true" />
              <span>Focus<br />change</span>
            </button>
          </div>
        </div>
        {focusOpen && eligible.length > 1 && (
          <div
            id="party-editor-focus-popup"
            className={`party-editor__focus-popup party-editor__focus-popup--${eligible.length}`}
          >
            <div className="party-editor__focus-heading">
              <strong>Select Focus</strong>
              <span>Treated as on-field</span>
            </div>
            <div ref={focusOptions} className="party-editor__focus-options" role="group" aria-label="Eligible Focus Agents">
              {eligible.map((slot) => {
                const agent = ADMITTED_AGENTS.find((item) => item.id === draft.agentIds[slot])!
                const agentName = agentDisplayName(agent)
                return (
                  <button
                    key={slot}
                    type="button"
                    className={`party-editor__focus-option${draft.focusSlot === slot ? ' is-selected' : ''}`}
                    aria-pressed={draft.focusSlot === slot}
                    aria-label={`Set ${agentName} as Focus`}
                    onClick={() => {
                      dispatch({ type: 'setDraftFocus', slot })
                      setFocusOpen(false)
                      focusChange.current?.focus()
                    }}
                  >
                    <img className="party-editor__focus-portrait" src={AGENT_SELECTOR_PORTRAITS[agent.id]} alt="" />
                    <span className="party-editor__focus-copy">
                      <strong>{agentName}</strong>
                      <span aria-hidden="true">
                        <img src={ATTRIBUTE_MARKS[agent.attribute]} alt="" />
                        <img src={SPECIALTY_MARKS[agent.specialty]} alt="" />
                      </span>
                    </span>
                  </button>
                )
              })}
            </div>
          </div>
        )}
        {eligible.length === 0 && <p className="party-editor__focus-invalid" role="alert">{focusStatus}</p>}
      </div>
      {target !== null && (
        <>
          <div className="party-editor__filters" aria-label="Agent filters">
            <fieldset className="party-editor__filter-row">
              <legend>Attribute</legend>
              <div>
                <button type="button" className={attribute === 'all' ? 'is-selected' : ''} aria-pressed={attribute === 'all'} onClick={() => setAttribute('all')}>All</button>
                {ATTRIBUTE_FILTERS.map((value) => (
                  <button key={value} type="button" className={attribute === value ? 'is-selected' : ''} aria-pressed={attribute === value} aria-label={PARTY_EDIT_ATTRIBUTE_LABELS[value] ?? `${value} Attribute`} onClick={() => setAttribute(value)}>
                    <img src={ATTRIBUTE_MARKS[value]} alt="" />
                    <span>{value}</span>
                  </button>
                ))}
              </div>
            </fieldset>
            <fieldset className="party-editor__filter-row">
              <legend>Specialty</legend>
              <div>
                <button type="button" className={specialty === 'all' ? 'is-selected' : ''} aria-pressed={specialty === 'all'} onClick={() => setSpecialty('all')}>All</button>
                {SPECIALTY_FILTERS.map((value) => (
                  <button key={value} type="button" className={specialty === value ? 'is-selected' : ''} aria-pressed={specialty === value} aria-label={`${value} Specialty`} onClick={() => setSpecialty(value)}>
                    <img src={SPECIALTY_MARKS[value]} alt="" />
                    <span>{value}</span>
                  </button>
                ))}
              </div>
            </fieldset>
          </div>
          <div className="party-editor__pool" ref={candidatePool} role="region" aria-label="Agent candidate pool">
            {candidates.length === 0 && <p className="party-editor__empty" role="status">No Agents match these filters.</p>}
            <div className="party-editor__pool-grid">{candidates.map((agent) => {
              const occupied = draft.agentIds.includes(agent.id)
              const occupiedSlot = draft.agentIds.indexOf(agent.id)
              const agentName = agentDisplayName(agent)
              return <button key={agent.id} type="button" className={`agent-pool-card${occupied ? ' is-occupied' : ''}`} data-agent={agent.id} disabled={occupied} aria-label={`${occupied ? 'Unavailable, ' : ''}${agentName}, ${agent.attribute}, ${agent.specialty}, ${agent.rank} Rank${occupied ? `, Slot ${occupiedSlot + 1}` : ''}`} onClick={() => {
                dispatch({ type: 'replaceDraftAgent', slot: target, agentId: agent.id })
                setTarget(null)
                setFocusOpen(false)
                setAttribute('all')
                setSpecialty('all')
                draftSlots.current[target]?.focus()
              }}>
                <PoolPortrait agentId={agent.id} />
                <span className="agent-pool-card__info">
                  <strong className="agent-pool-card__name">{agentName}</strong>
                  <span className="agent-pool-card__identity" aria-hidden="true">
                    <span className="agent-pool-card__marks">
                      <img src={RANK_MARKS[agent.rank]} alt="" />
                      <img src={ATTRIBUTE_MARKS[agent.attribute]} alt="" />
                      <img src={SPECIALTY_MARKS[agent.specialty]} alt="" />
                    </span>
                    {occupied && <small className="agent-pool-card__occupied">Slot {occupiedSlot + 1}</small>}
                  </span>
                </span>
              </button>
            })}</div>
          </div>
        </>
      )}
      <div className="party-editor__actions"><button type="button" onClick={close}>Cancel</button><button type="button" disabled={!canApply && !canResolveFocus} onClick={apply}>Apply party</button></div>
    </section>
  )
}
