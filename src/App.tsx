import { useEffect, useReducer, useState } from 'react'
import { AgentSetup } from './components/AgentSetup'
import { PartyWorkbench } from './components/PartyWorkbench'
import { ResultPanel } from './components/ResultPanel'
import type { SourceToneChannel } from './components/sourceInteraction'
import { calculateParty } from './workbench/calculate'
import { createPreparedState, workbenchReducer, type AppliedSlot } from './workbench/state'

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
  const agentResult = viewedSlot === null
    ? null
    : result?.agents[viewedSlot] ?? null
  const changeSourceTone = (channel: SourceToneChannel, tone: string | null) =>
    setSourceTones((current) => ({ ...current, [channel]: tone }))

  useEffect(() => {
    setSourceTones(emptySourceTones)
  }, [viewedSlot])

  return (
    <div className="app-shell">
      <header className="masthead">
        <div className="masthead__index" aria-hidden="true">SETUP // 01</div>
        <div className="masthead__title"><span className="eyebrow">YIXUAN STRIKE TEAM</span><h1>Setup Workbench</h1></div>
        <div className="masthead__status"><span className="status-light" /><span>PREPARED</span><strong>3 / 3</strong></div>
      </header>
      <main>
        <PartyWorkbench
          activeSourceTone={activeSourceTone}
          slots={state.slots}
          focusSlot={state.focusSlot}
          viewedSlot={viewedSlot}
          onSourceToneChange={changeSourceTone}
          onViewSlot={setViewedSlot}
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
