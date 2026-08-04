import { useEffect, useReducer, useState } from 'react'
import { AgentSetup } from './components/AgentSetup'
import { PartyWorkbench } from './components/PartyWorkbench'
import { ResultPanel } from './components/ResultPanel'
import { calculateParty } from './workbench/calculate'
import type { AgentId } from './workbench/content'
import { createPreparedState, workbenchReducer } from './workbench/state'

type SourceToneChannel = 'pointer' | 'focus'

const emptySourceTones: Record<SourceToneChannel, string | null> = {
  pointer: null,
  focus: null,
}

export function App() {
  const [state, dispatch] = useReducer(workbenchReducer, undefined, () => createPreparedState())
  const [viewedAgentId, setViewedAgentId] = useState<AgentId>('yixuan')
  const [sourceTones, setSourceTones] = useState(emptySourceTones)
  const activeSourceTone = sourceTones.pointer ?? sourceTones.focus
  const result = calculateParty(state)
  const agentResult = result?.agents.find((agent) => agent.agentId === viewedAgentId) ?? null
  const changeSourceTone = (channel: SourceToneChannel, tone: string | null) =>
    setSourceTones((current) => ({ ...current, [channel]: tone }))

  useEffect(() => {
    setSourceTones(emptySourceTones)
  }, [viewedAgentId])

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
          viewedAgentId={viewedAgentId}
          onSourceToneChange={changeSourceTone}
          onViewAgent={setViewedAgentId}
        >
          <AgentSetup
            activeSourceTone={activeSourceTone}
            agentId={viewedAgentId}
            state={state}
            dispatch={dispatch}
            onSourceToneChange={changeSourceTone}
          />
          <ResultPanel
            activeSourceTone={activeSourceTone}
            agentResult={agentResult}
            onSourceToneChange={changeSourceTone}
          />
        </PartyWorkbench>
      </main>
      <footer className="workbench-footer"><span>Lv.60 {'\u00B7'} max Core {'\u00B7'} M0 {'\u00B7'} fully enabled compatible window</span><span>No final damage or rotation simulation</span></footer>
    </div>
  )
}
