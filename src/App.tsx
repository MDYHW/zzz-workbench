import { useReducer } from 'react'
import { PartyRail } from './components/PartyRail'
import { ResultPanel } from './components/ResultPanel'
import { TargetSetup } from './components/TargetSetup'
import { calculateParty } from './workbench/calculate'
import { createPreparedState, workbenchReducer } from './workbench/state'

export function App() {
  const [state, dispatch] = useReducer(workbenchReducer, undefined, () => createPreparedState())
  const result = calculateParty(state)

  return (
    <div className="app-shell">
      <header className="masthead">
        <div className="masthead__index" aria-hidden="true">SETUP // 01</div>
        <div className="masthead__title">
          <span className="eyebrow">YIXUAN STRIKE TEAM</span>
          <h1>Setup Workbench</h1>
        </div>
        <div className="masthead__status">
          <span className="status-light" />
          <span>PREPARED</span>
          <strong>3 / 3</strong>
        </div>
      </header>

      <main>
        <PartyRail state={state} />

        <div className="workbench-layout">
          <TargetSetup state={state} dispatch={dispatch} />
          <ResultPanel result={result} />
        </div>
      </main>

      <footer className="workbench-footer">
        <span>Lv.60 · max Core · M0 · fully enabled compatible window</span>
        <span>No final damage or rotation simulation</span>
      </footer>
    </div>
  )
}
