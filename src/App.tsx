import { useEffect, useReducer, useState } from 'react'
import { AgentSetup } from './components/AgentSetup'
import { PartyWorkbench } from './components/PartyWorkbench'
import { PartyEditor } from './components/PartyEditor'
import { ResultPanel } from './components/ResultPanel'
import type { SourceToneChannel } from './components/sourceInteraction'
import { calculateParty } from './workbench/calculate'
import { ADMITTED_AGENTS } from './workbench/content'
import { createPreparedState, isCompleteWorkbench, workbenchReducer, type AppliedSlot } from './workbench/state'

const emptySourceTones: Record<SourceToneChannel, string | null> = {
  pointer: null,
  focus: null,
}

export function App() {
  const [state, dispatch] = useReducer(workbenchReducer, undefined, () => createPreparedState())
  const [viewedSlot, setViewedSlot] = useState<AppliedSlot | null>(0)
  const [sourceTones, setSourceTones] = useState(emptySourceTones)
  const activeSourceTone = sourceTones.pointer ?? sourceTones.focus
  const result = calculateParty(state)
  const viewedSetup = viewedSlot === null ? null : state.slots[viewedSlot]
  const focusedAgent = state.slots[state.focusSlot].agentId
  const appliedParty = state.slots.map(({ agentId }) => agentId).join(',')
  const firstTrio = appliedParty === 'yixuan,dialyn,lucia'
  const secondTrio = appliedParty === 'anbySoldier0,trigger,astraYao'
  const setupIndex = firstTrio ? '01' : secondTrio ? '02' : 'MIX'
  const partyTitle = secondTrio ? 'ANBY: SOLDIER 0 STRIKE TEAM' : focusedAgent === 'yixuan' ? 'YIXUAN STRIKE TEAM' : `${ADMITTED_AGENTS.find(({ id }) => id === focusedAgent)!.name.toUpperCase()} STRIKE TEAM`
  const agentResult = viewedSlot === null
    ? null
    : result?.agents[viewedSlot] ?? null
  const changeSourceTone = (channel: SourceToneChannel, tone: string | null) =>
    setSourceTones((current) => ({ ...current, [channel]: tone }))

  useEffect(() => {
    setSourceTones(emptySourceTones)
  }, [viewedSlot, viewedSetup?.agentId])

  return (
    <div className="app-shell">
      <header className="masthead">
        <div className="masthead__index" aria-hidden="true">SETUP // {setupIndex}</div>
        <div className="masthead__title"><span className="eyebrow">{partyTitle}</span><h1>Setup Workbench</h1></div>
        <div className="masthead__status"><span className="status-light" /><span>{isCompleteWorkbench(state) ? 'PREPARED' : 'INCOMPLETE'}</span><strong>{isCompleteWorkbench(state) ? '3 / 3' : '—'}</strong></div>
      </header>
      <main>
        {state.draft && <PartyEditor draft={state.draft} state={state} dispatch={dispatch} onClosed={() => requestAnimationFrame(() => document.querySelector<HTMLButtonElement>('.party-edit-trigger')?.focus())} />}
        <PartyWorkbench
          activeSourceTone={activeSourceTone}
          slots={state.slots}
          focusSlot={state.focusSlot}
          isPartyEditing={Boolean(state.draft)}
          viewedSlot={viewedSlot}
          onSourceToneChange={changeSourceTone}
          onViewSlot={setViewedSlot}
          onEditParty={() => dispatch({ type: 'openPartyEdit' })}
        >
          {viewedSetup && viewedSlot !== null && (
            <>
              <AgentSetup
                activeSourceTone={activeSourceTone}
                slot={viewedSlot}
                agentId={viewedSetup.agentId}
                setup={viewedSetup.setup}
                dispatch={dispatch}
                onSourceToneChange={changeSourceTone}
              />
              <ResultPanel
                activeSourceTone={activeSourceTone}
                agentResult={agentResult}
                onSourceToneChange={changeSourceTone}
              />
            </>
          )}
        </PartyWorkbench>
      </main>
      <footer className="workbench-footer"><span>Lv.60 {'\u00B7'} max Core {'\u00B7'} fully enabled compatible window</span><span>No final damage or rotation simulation</span></footer>
    </div>
  )
}
