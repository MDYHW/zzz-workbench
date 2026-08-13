import { useEffect, useReducer, useRef, useState } from 'react'
import { AgentSetup } from './components/AgentSetup'
import { PartyWorkbench } from './components/PartyWorkbench'
import { PartyEditor } from './components/PartyEditor'
import { ResultPanel } from './components/ResultPanel'
import type { SourceToneChannel } from './components/sourceInteraction'
import { calculateParty } from './workbench/calculate'
import {
  effectiveFourPieceIds,
  effectiveFourPieceRoleSwapIds,
  effectiveMainStatIds,
  effectiveSubstatChoicesForSlot,
  effectiveTwoPieceIds,
  incompleteRequiredSelections,
  type RequiredSetupSelection,
} from './workbench/candidates'
import { ADMITTED_AGENTS, type MainSlot } from './workbench/content'
import { createPreparedState, isCompleteWorkbench, workbenchReducer, type AppliedSlot } from './workbench/state'

const emptySourceTones: Record<SourceToneChannel, string | null> = {
  pointer: null,
  focus: null,
}

const requiredSelectionKey = (selection: RequiredSetupSelection) => selection.kind === 'disc'
  ? `${selection.slot}:disc:${selection.piece}`
  : selection.kind === 'mainStat'
    ? `${selection.slot}:main:${selection.mainSlot}`
    : `${selection.slot}:substat:${selection.substatId}`

export function App() {
  const [state, dispatch] = useReducer(workbenchReducer, undefined, () => createPreparedState())
  const [viewedSlot, setViewedSlot] = useState<AppliedSlot | null>(0)
  const [sourceTones, setSourceTones] = useState(emptySourceTones)
  const incompleteSelections = incompleteRequiredSelections(state)
  const incompleteKey = incompleteSelections
    .map(requiredSelectionKey)
    .join('|')
  const previousIncompleteKeys = useRef(new Set(incompleteKey ? incompleteKey.split('|') : []))
  const [candidateAnnouncement, setCandidateAnnouncement] = useState('')
  const activeSourceTone = sourceTones.pointer ?? sourceTones.focus
  const result = calculateParty(state)
  const viewedSetup = viewedSlot === null ? null : state.slots[viewedSlot]
  const focusedAgent = state.slots[state.focusSlot].agentId
  const appliedParty = state.slots.map(({ agentId }) => agentId).join(',')
  const preparationContextKey = `${state.focusSlot}:${state.slots.map(({ agentId, setup }) => (
    `${agentId}:${setup.pool}:${setup.mindscape}`
  )).join('|')}`
  const firstTrio = appliedParty === 'yixuan,dialyn,lucia'
  const secondTrio = appliedParty === 'anbySoldier0,trigger,astraYao'
  const setupIndex = firstTrio ? '01' : secondTrio ? '02' : 'MIX'
  const partyTitle = secondTrio ? 'ANBY: SOLDIER 0 STRIKE TEAM' : focusedAgent === 'yixuan' ? 'YIXUAN STRIKE TEAM' : `${ADMITTED_AGENTS.find(({ id }) => id === focusedAgent)!.name.toUpperCase()} STRIKE TEAM`
  const agentResult = viewedSlot === null
    ? null
    : result?.agents[viewedSlot] ?? null
  const viewedMainStatCandidates = viewedSlot === null ? null : Object.fromEntries(
    (['slot4', 'slot5', 'slot6'] as MainSlot[]).map((mainSlot) => [
      mainSlot,
      effectiveMainStatIds(state, viewedSlot, mainSlot),
    ]),
  ) as Record<MainSlot, ReturnType<typeof effectiveMainStatIds>>
  const viewedDiscCandidates = viewedSlot === null ? null : {
    fourPiece: effectiveFourPieceIds(state, viewedSlot),
    twoPiece: effectiveTwoPieceIds(state, viewedSlot),
  }
  const changeSourceTone = (channel: SourceToneChannel, tone: string | null) =>
    setSourceTones((current) => ({ ...current, [channel]: tone }))

  useEffect(() => {
    setSourceTones(emptySourceTones)
  }, [viewedSlot, viewedSetup?.agentId])

  useEffect(() => {
    setSourceTones(emptySourceTones)
  }, [preparationContextKey])

  useEffect(() => {
    const currentKeys = new Set(incompleteKey ? incompleteKey.split('|') : [])
    const newlyInvalidated = incompleteSelections.filter((selection) => (
      !previousIncompleteKeys.current.has(requiredSelectionKey(selection))
    ))
    previousIncompleteKeys.current = currentKeys

    if (newlyInvalidated.length === 0) {
      setCandidateAnnouncement('')
      return
    }

    const selections = incompleteSelections.map((selection) => {
      const { agentId } = selection
      const agentName = ADMITTED_AGENTS.find(({ id }) => id === agentId)!.name
      return selection.kind === 'disc'
        ? `${agentName} ${selection.piece === 'fourPiece' ? '4-piece' : '2-piece'} Drive Disc`
        : selection.kind === 'mainStat'
          ? `${agentName} Disc ${selection.mainSlot.replace('slot', '')} main stat`
          : `${agentName} ${selection.substatId === 'critRate' ? 'CRIT Rate' : selection.substatId} hit count`
    })
    setCandidateAnnouncement(
      `${incompleteSelections.length} setup selections now require a choice: ${selections.join(' and ')}.`,
    )
  }, [incompleteKey])

  return (
    <div className="app-shell">
      <header className="masthead">
        <div className="masthead__index" aria-hidden="true">SETUP // {setupIndex}</div>
        <div className="masthead__title"><span className="eyebrow">{partyTitle}</span><h1>Setup Workbench</h1></div>
        <div className="masthead__status"><span className="status-light" /><span>{isCompleteWorkbench(state) ? 'PREPARED' : 'INCOMPLETE'}</span><strong>{isCompleteWorkbench(state) ? '3 / 3' : '—'}</strong></div>
      </header>
      <main>
        <p className="sr-only" role="status" aria-atomic="true">{candidateAnnouncement}</p>
        {state.draft && <PartyEditor draft={state.draft} state={state} dispatch={dispatch} onClosed={() => requestAnimationFrame(() => document.querySelector<HTMLButtonElement>('.party-edit-trigger')?.focus())} />}
        <PartyWorkbench
          activeSourceTone={activeSourceTone}
          slots={state.slots}
          focusSlot={state.focusSlot}
          incompleteSelections={incompleteSelections}
          isPartyEditing={Boolean(state.draft)}
          viewedSlot={viewedSlot}
          onSourceToneChange={changeSourceTone}
          onViewSlot={setViewedSlot}
          onEditParty={() => dispatch({ type: 'openPartyEdit' })}
        >
          {viewedSetup && viewedSlot !== null && viewedMainStatCandidates && viewedDiscCandidates && (
            <>
              <AgentSetup
                activeSourceTone={activeSourceTone}
                slot={viewedSlot}
                agentId={viewedSetup.agentId}
                discCandidates={viewedDiscCandidates}
                fourPieceRoleSwapIds={effectiveFourPieceRoleSwapIds(state, viewedSlot)}
                mainStatCandidates={viewedMainStatCandidates}
                substatChoices={effectiveSubstatChoicesForSlot(state, viewedSlot)}
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
