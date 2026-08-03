import { useReducer, useState } from 'react'
import { AgentSetup } from './components/AgentSetup'
import { PartyWorkbench } from './components/PartyWorkbench'
import { ResultPanel } from './components/ResultPanel'
import { calculateParty } from './workbench/calculate'
import type { AgentId } from './workbench/content'
import { createPreparedState, workbenchReducer } from './workbench/state'

export function App() {
  const [state, dispatch] = useReducer(workbenchReducer, undefined, () => createPreparedState())
  const [viewedAgentId, setViewedAgentId] = useState<AgentId>('yixuan')
  const result = calculateParty(state)
  const agentResult = result?.agents.find((agent) => agent.agentId === viewedAgentId) ?? null

  return (
    <div className="app-shell">
      <header className="masthead">
        <div className="masthead__index" aria-hidden="true">SETUP // 01</div>
        <div className="masthead__title"><span className="eyebrow">YIXUAN STRIKE TEAM</span><h1>Setup Workbench</h1></div>
        <div className="masthead__status"><span className="status-light" /><span>PREPARED</span><strong>3 / 3</strong></div>
      </header>
      <main>
        <PartyWorkbench viewedAgentId={viewedAgentId} onViewAgent={setViewedAgentId}>
          <AgentSetup agentId={viewedAgentId} state={state} dispatch={dispatch} />
          <ResultPanel agentResult={agentResult} />
        </PartyWorkbench>
      </main>
      <footer className="workbench-footer"><span>Lv.60 {'\u00B7'} max Core {'\u00B7'} M0 {'\u00B7'} fully enabled compatible window</span><span>No final damage or rotation simulation</span></footer>
    </div>
  )
}
