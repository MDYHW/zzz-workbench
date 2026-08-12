import { useEffect, useRef, useState, type Dispatch } from 'react'
import anbyPortrait from '../assets/agents/portraits/soldier-0-anby.webp'
import astraPortrait from '../assets/agents/portraits/astra-yao.webp'
import cissiaPortrait from '../assets/agents/portraits/cissia.webp'
import dialynPortrait from '../assets/agents/portraits/dialyn.webp'
import evelynPortrait from '../assets/agents/portraits/evelyn.webp'
import luciaPortrait from '../assets/agents/portraits/lucia.webp'
import triggerPortrait from '../assets/agents/portraits/trigger.webp'
import seedPortrait from '../assets/agents/portraits/seed.webp'
import yixuanPortrait from '../assets/agents/portraits/yixuan.webp'
import corinPortrait from '../assets/agents/portraits/corin.webp'
import lycaonPortrait from '../assets/agents/portraits/lycaon.webp'
import { ADMITTED_AGENTS, type AgentId } from '../workbench/content'
import type { AppliedSlot, PartyDraft, WorkbenchAction, WorkbenchState } from '../workbench/state'

const portraits: Record<AgentId, string> = {
  yixuan: yixuanPortrait,
  dialyn: dialynPortrait,
  lucia: luciaPortrait,
  anbySoldier0: anbyPortrait,
  trigger: triggerPortrait,
  astraYao: astraPortrait,
  seed: seedPortrait,
  cissia: cissiaPortrait,
  evelyn: evelynPortrait,
  corin: corinPortrait,
  lycaon: lycaonPortrait,
}

interface PartyEditorProps {
  draft: PartyDraft
  state: WorkbenchState
  dispatch: Dispatch<WorkbenchAction>
  onClosed: () => void
}

export function PartyEditor({ draft, state, dispatch, onClosed }: PartyEditorProps) {
  const [target, setTarget] = useState<AppliedSlot | null>(null)
  const [attribute, setAttribute] = useState('all')
  const [specialty, setSpecialty] = useState('all')
  const draftSlots = useRef<Array<HTMLButtonElement | null>>([])
  const candidatePool = useRef<HTMLDivElement>(null)
  const changed = draft.focusSlot !== state.focusSlot
    || draft.agentIds.some((agentId, index) => agentId !== state.slots[index].agentId)
  const candidates = ADMITTED_AGENTS.filter((agent) => (
    (attribute === 'all' || agent.attribute === attribute)
    && (specialty === 'all' || agent.specialty === specialty)
  ))
  const availableCandidates = candidates.filter((agent) => !draft.agentIds.includes(agent.id))
  const distinctParty = new Set(draft.agentIds).size === 3
  const eligible = draft.agentIds.flatMap((agentId, slot) => (
    ADMITTED_AGENTS.find((agent) => agent.id === agentId)?.focusEligible ? [slot as AppliedSlot] : []
  ))
  const focusStatus = eligible.length === 1
    ? `${ADMITTED_AGENTS.find((agent) => agent.id === draft.agentIds[eligible[0]])!.name} is Focus automatically.`
    : eligible.length === 0 ? 'No eligible Focus Agent. Choose a different party.' : 'Choose a Focus Agent before applying.'

  useEffect(() => { draftSlots.current[0]?.focus() }, [])
  useEffect(() => {
    if (target === null) return
    const firstAvailable = candidatePool.current?.querySelector<HTMLButtonElement>('button:not(:disabled)')
    firstAvailable?.focus()
  }, [target, attribute, specialty])

  const close = () => {
    dispatch({ type: 'closePartyEdit' })
    onClosed()
  }
  const apply = () => {
    dispatch({ type: 'applyPartyEdit' })
    onClosed()
  }

  return (
    <section className="party-editor" aria-labelledby="party-editor-heading">
      <div className="party-editor__heading">
        <h2 id="party-editor-heading">Edit party</h2>
        <span aria-live="polite">{target === null ? focusStatus : `Replacing slot ${target + 1}. ${availableCandidates.length} available Agents.`}</span>
      </div>
      <div className="party-editor__slots" aria-label="Draft party slots">
        {draft.agentIds.map((agentId, slot) => {
          const agent = ADMITTED_AGENTS.find((item) => item.id === agentId)!
          const selected = target === slot
          return (
            <button
              key={slot}
              ref={(element) => { draftSlots.current[slot] = element }}
              type="button"
              className={`draft-slot${selected ? ' is-target' : ''}`}
              aria-pressed={selected}
              aria-label={`Replace slot ${slot + 1}, ${agent.name}`}
              onClick={() => setTarget(slot as AppliedSlot)}
            >
              <img src={portraits[agentId]} alt="" />
              <span><small>Slot {slot + 1}</small><strong>{agent.name}</strong><em>{agent.attribute} · {agent.specialty}</em></span>
            </button>
          )
        })}
      </div>
      <fieldset className="party-editor__focus">
        <legend>Focus</legend>
        {eligible.length === 1 ? <p>{focusStatus}</p> : eligible.length === 0 ? <p>{focusStatus}</p> : eligible.map((slot) => {
          const agent = ADMITTED_AGENTS.find((item) => item.id === draft.agentIds[slot])!
          return <label key={slot}><input type="radio" name="draft-focus" checked={draft.focusSlot === slot} onChange={() => dispatch({ type: 'setDraftFocus', slot })} /> {agent.name}</label>
        })}
      </fieldset>
      {target !== null && (
        <>
          <div className="party-editor__filters" aria-label="Agent filters">
            <label>Attribute<select value={attribute} onChange={(event) => setAttribute(event.target.value)}><option value="all">All Attributes</option>{[...new Set(ADMITTED_AGENTS.map((agent) => agent.attribute))].map((value) => <option key={value}>{value}</option>)}</select></label>
            <label>Specialty<select value={specialty} onChange={(event) => setSpecialty(event.target.value)}><option value="all">All Specialties</option>{[...new Set(ADMITTED_AGENTS.map((agent) => agent.specialty))].map((value) => <option key={value}>{value}</option>)}</select></label>
          </div>
          <div className="party-editor__pool" ref={candidatePool} aria-label="Agent candidate pool">
            <p aria-live="polite">{availableCandidates.length ? `${availableCandidates.length} available candidates` : 'No available candidates'}</p>
            <div>{candidates.map((agent) => {
              const occupied = draft.agentIds.includes(agent.id)
              return <button key={agent.id} type="button" disabled={occupied} aria-label={`${occupied ? 'Unavailable, ' : ''}${agent.name}, ${agent.attribute}, ${agent.specialty}`} onClick={() => {
                dispatch({ type: 'replaceDraftAgent', slot: target, agentId: agent.id })
                setTarget(null)
                setAttribute('all')
                setSpecialty('all')
                draftSlots.current[target]?.focus()
              }}><img src={portraits[agent.id]} alt="" /><span>{agent.name}<small>{occupied ? 'Occupied' : `${agent.attribute} · ${agent.specialty}`}</small></span></button>
            })}</div>
          </div>
        </>
      )}
      <div className="party-editor__actions"><button type="button" onClick={close}>Cancel</button><button type="button" disabled={!changed || !distinctParty || draft.focusSlot === null || eligible.length === 0} onClick={apply}>Apply party</button></div>
    </section>
  )
}
