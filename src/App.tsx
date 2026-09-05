import { useEffect, useReducer, useRef, useState } from 'react'
import { AgentSetup } from './components/AgentSetup'
import { PartyWorkbench } from './components/PartyWorkbench'
import { PartyEditor } from './components/PartyEditor'
import { ResultPanel } from './components/ResultPanel'
import type { SourceLink, SourceToneChannel } from './components/sourceInteraction'
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
import { ADMITTED_AGENTS, agentDisplayName, type AgentId, type MainSlot } from './workbench/content'
import { createPreparedState, workbenchReducer, type AppliedSlot } from './workbench/state'

const emptySourceLinks: Record<SourceToneChannel, SourceLink | null> = {
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
  const [viewedSlot, setViewedSlot] = useState<AppliedSlot>(0)
  const [sourceLinks, setSourceLinks] = useState(emptySourceLinks)
  const [targetStunDmgMultiplier, setTargetStunDmgMultiplier] = useState(150)
  const incompleteSelections = incompleteRequiredSelections(state)
  const incompleteKey = incompleteSelections
    .map(requiredSelectionKey)
    .join('|')
  const previousIncompleteKeys = useRef(new Set(incompleteKey ? incompleteKey.split('|') : []))
  const [candidateAnnouncement, setCandidateAnnouncement] = useState('')
  const activeSourceLink = sourceLinks.pointer ?? sourceLinks.focus
  const activeSourceTone = activeSourceLink?.tone ?? null
  const activeSourceTargetAgentId = activeSourceLink?.targetAgentId ?? null
  const result = calculateParty(state, { targetStunDmgMultiplier })
  const viewedSetup = state.slots[viewedSlot]
  const selectedSourceIdentityKey = JSON.stringify({
    viewedSlot,
    focusSlot: state.focusSlot,
    slots: state.slots.map(({ agentId, setup }) => ({
      agentId,
      pool: setup.pool,
      mindscape: setup.mindscape,
      engineId: setup.engineId,
      refinement: setup.refinement,
      fourPieceId: setup.fourPieceId,
      twoPieceId: setup.twoPieceId,
      mains: setup.mains,
      effectiveSubstats: Object.keys(setup.substats).sort(),
    })),
  })
  const agentResult = result?.agents[viewedSlot] ?? null
  const viewedMainStatCandidates = Object.fromEntries(
    (['slot4', 'slot5', 'slot6'] as MainSlot[]).map((mainSlot) => [
      mainSlot,
      effectiveMainStatIds(state, viewedSlot, mainSlot),
    ]),
  ) as Record<MainSlot, ReturnType<typeof effectiveMainStatIds>>
  const viewedDiscCandidates = {
    fourPiece: effectiveFourPieceIds(state, viewedSlot),
    twoPiece: effectiveTwoPieceIds(state, viewedSlot),
  }
  const changeSourceTone = (
    channel: SourceToneChannel,
    tone: string | null,
    targetAgentId?: AgentId,
  ) => setSourceLinks((current) => ({
    ...current,
    [channel]: tone === null ? null : { tone, targetAgentId: targetAgentId ?? null },
  }))

  useEffect(() => {
    setSourceLinks(emptySourceLinks)
  }, [selectedSourceIdentityKey])

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
      const agentName = agentDisplayName(ADMITTED_AGENTS.find(({ id }) => id === agentId)!)
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
        <h1>Setup Workbench</h1>
      </header>
      <main>
        <p className="sr-only" role="status" aria-atomic="true">{candidateAnnouncement}</p>
        {state.draft && <PartyEditor draft={state.draft} state={state} dispatch={dispatch} onClosed={() => requestAnimationFrame(() => document.querySelector<HTMLButtonElement>('.party-edit-trigger')?.focus())} />}
        <PartyWorkbench
          activeSourceTone={activeSourceTone}
          activeSourceTargetAgentId={activeSourceTargetAgentId}
          slots={state.slots}
          focusSlot={state.focusSlot}
          incompleteSelections={incompleteSelections}
          isPartyEditing={Boolean(state.draft)}
          viewedSlot={viewedSlot}
          onSourceToneChange={changeSourceTone}
          onViewSlot={setViewedSlot}
          onEditParty={() => dispatch({ type: 'openPartyEdit' })}
          setup={(
            <AgentSetup
              activeSourceTone={activeSourceTargetAgentId === null ? activeSourceTone : null}
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
          )}
          result={(
            <ResultPanel
              activeSourceTone={activeSourceTone}
              agentResult={agentResult}
              onSourceToneChange={changeSourceTone}
              onTargetStunDmgMultiplierChange={setTargetStunDmgMultiplier}
              partyAgentIds={state.slots.map(({ agentId }) => agentId)}
              targetStunDmgMultiplier={targetStunDmgMultiplier}
            />
          )}
        />
      </main>
    </div>
  )
}
