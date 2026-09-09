import { useEffect, useMemo, useReducer, useRef, useState, type Dispatch } from 'react'
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
import { type AgentId, type MainSlot } from './workbench/content'
import {
  createInitialWorkbenchState,
  isCompleteWorkbench,
  isInitialWorkbenchState,
  workbenchSessionReducer,
  type AppliedSlot,
  type WorkbenchAction,
  type WorkbenchSessionState,
  type WorkbenchState,
} from './workbench/state'
import { createSetupShortcutUrl, readSetupShortcut } from './workbench/setup-shortcut'
import {
  LocalizationProvider,
  localizedAgentName,
  localizedStat,
  useLocalization,
  type Locale,
} from './localization'

const emptySourceLinks: Record<SourceToneChannel, SourceLink | null> = {
  pointer: null,
  focus: null,
}

const focusPartyEditTrigger = () => requestAnimationFrame(() => (
  document.querySelector<HTMLButtonElement>('.party-edit-trigger')?.focus()
))

type AppAction = WorkbenchAction | {
  type: 'followShortcutNavigation'
  state: WorkbenchSessionState
}

const appReducer = (state: WorkbenchSessionState, action: AppAction): WorkbenchSessionState => (
  action.type === 'followShortcutNavigation'
    ? action.state
    : workbenchSessionReducer(state, action)
)

function CopySetupButton({ state }: { state: WorkbenchState | null }) {
  const { t } = useLocalization()
  const [status, setStatus] = useState<'idle' | 'copying' | 'copied' | 'failed'>('idle')
  const copyInFlight = useRef(false)
  const isMounted = useRef(true)
  const resetTimer = useRef<number | null>(null)
  const shortcutUrl = useMemo(() => (
    state !== null && isCompleteWorkbench(state)
      ? createSetupShortcutUrl(state, window.location.href)
      : null
  ), [state])
  const currentShortcutUrl = useRef(shortcutUrl)
  currentShortcutUrl.current = shortcutUrl
  const isAvailable = shortcutUrl !== null

  useEffect(() => {
    isMounted.current = true
    return () => {
      isMounted.current = false
      if (resetTimer.current !== null) window.clearTimeout(resetTimer.current)
    }
  }, [])

  useEffect(() => {
    if (copyInFlight.current) return
    if (resetTimer.current !== null) {
      window.clearTimeout(resetTimer.current)
      resetTimer.current = null
    }
    setStatus('idle')
  }, [shortcutUrl])

  const showTemporaryStatus = (next: 'copied' | 'failed') => {
    setStatus(next)
    if (resetTimer.current !== null) window.clearTimeout(resetTimer.current)
    resetTimer.current = window.setTimeout(() => {
      setStatus('idle')
      resetTimer.current = null
    }, 1800)
  }

  const copySetup = async () => {
    if (!shortcutUrl || copyInFlight.current) return
    const copiedUrl = shortcutUrl
    const copiedFromHash = window.location.hash
    copyInFlight.current = true
    if (resetTimer.current !== null) {
      window.clearTimeout(resetTimer.current)
      resetTimer.current = null
    }
    setStatus('copying')
    try {
      if (!navigator.clipboard?.writeText) throw new Error('Clipboard unavailable')
      await navigator.clipboard.writeText(copiedUrl)
      if (isMounted.current) {
        if (window.location.hash === copiedFromHash && currentShortcutUrl.current === copiedUrl) {
          showTemporaryStatus('copied')
        }
        else setStatus('idle')
      }
    } catch {
      if (isMounted.current) {
        if (window.location.hash === copiedFromHash && currentShortcutUrl.current === copiedUrl) {
          showTemporaryStatus('failed')
        }
        else setStatus('idle')
      }
    } finally {
      copyInFlight.current = false
    }
  }

  const label = status === 'copying'
    ? t('copying')
    : status === 'copied'
      ? t('copied')
      : status === 'failed'
        ? t('copyFailed')
        : t('copySetup')
  const announcement = status === 'copying'
    ? t('copyingAnnouncement')
    : status === 'copied'
      ? t('copiedAnnouncement')
      : status === 'failed'
        ? t('failedAnnouncement')
        : ''

  return (
    <div className="copy-action">
      <button
        className={`masthead-action masthead-action--${status}`}
        type="button"
        disabled={!isAvailable}
        aria-disabled={!isAvailable || status === 'copying'}
        aria-label={t('copyAria')}
        onClick={copySetup}
      >
        {label}
      </button>
      <span className="sr-only" role="status" aria-live="polite">{announcement}</span>
    </div>
  )
}

function LanguageToggle() {
  const { locale, setLocale } = useLocalization()
  const options: ReadonlyArray<{ locale: Locale; label: string; aria: string }> = [
    { locale: 'ko', label: '한국어', aria: '한국어로 표시' },
    { locale: 'en', label: 'EN', aria: 'Display in English' },
  ]
  return (
    <div className="language-toggle" role="group" aria-label={locale === 'ko' ? '표시 언어' : 'Display language'}>
      {options.map((option) => (
        <button
          type="button"
          key={option.locale}
          lang={option.locale}
          className={locale === option.locale ? 'is-selected' : ''}
          aria-label={option.aria}
          aria-pressed={locale === option.locale}
          onClick={() => setLocale(option.locale)}
        >
          {option.label}
        </button>
      ))}
    </div>
  )
}

const requiredSelectionKey = (selection: RequiredSetupSelection) => selection.kind === 'disc'
  ? `${selection.slot}:disc:${selection.piece}`
  : selection.kind === 'mainStat'
    ? `${selection.slot}:main:${selection.mainSlot}`
    : `${selection.slot}:substat:${selection.substatId}`

function AppliedWorkbench({
  state,
  dispatch,
  initialViewedSlot,
}: {
  state: WorkbenchState
  dispatch: Dispatch<WorkbenchAction>
  initialViewedSlot: AppliedSlot
}) {
  const { locale } = useLocalization()
  const [viewedSlot, setViewedSlot] = useState<AppliedSlot>(initialViewedSlot)
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
      const agentName = localizedAgentName(agentId, locale)
      return selection.kind === 'disc'
        ? locale === 'ko'
          ? `${agentName} ${selection.piece === 'fourPiece' ? '4세트' : '2세트'} 디스크`
          : `${agentName} ${selection.piece === 'fourPiece' ? '4-piece' : '2-piece'} Drive Disc`
        : selection.kind === 'mainStat'
          ? locale === 'ko'
            ? `${agentName} 디스크 ${selection.mainSlot.replace('slot', '')}번 주옵션`
            : `${agentName} Disc ${selection.mainSlot.replace('slot', '')} main stat`
          : locale === 'ko'
            ? `${agentName} ${localizedStat(selection.substatId, selection.substatId, locale)} 유효 횟수`
            : `${agentName} ${selection.substatId === 'critRate' ? 'CRIT Rate' : selection.substatId} hit count`
    })
    setCandidateAnnouncement(
      locale === 'ko'
        ? `${incompleteSelections.length}개 세팅 항목을 다시 선택해야 합니다: ${selections.join(', ')}.`
        : `${incompleteSelections.length} setup selections now require a choice: ${selections.join(' and ')}.`,
    )
  }, [incompleteKey, locale])

  return (
    <>
      <p className="sr-only" role="status" aria-atomic="true">{candidateAnnouncement}</p>
      {state.draft && <PartyEditor draft={state.draft} state={state} dispatch={dispatch} onClosed={focusPartyEditTrigger} />}
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
    </>
  )
}

function WorkbenchApp() {
  const { setLocale } = useLocalization()
  const [initialState] = useState<WorkbenchSessionState>(() => (
    readSetupShortcut(window.location.hash) ?? createInitialWorkbenchState()
  ))
  const [state, dispatch] = useReducer(
    appReducer,
    initialState,
  )
  const appliedState = isInitialWorkbenchState(state) ? null : state
  const currentShortcutState = readSetupShortcut(window.location.hash)

  useEffect(() => {
    const followShortcutNavigation = () => {
      const shortcutState = readSetupShortcut(window.location.hash)
      setLocale('ko')
      dispatch({
        type: 'followShortcutNavigation',
        state: shortcutState ?? createInitialWorkbenchState(),
      })
    }
    window.addEventListener('hashchange', followShortcutNavigation)
    return () => window.removeEventListener('hashchange', followShortcutNavigation)
  }, [setLocale])

  return (
    <div className="app-shell">
      <header className="masthead">
        <h1 lang="en">ZZZ Setup Workbench</h1>
        <div className="masthead-actions">
          <CopySetupButton state={appliedState} />
          <LanguageToggle />
        </div>
      </header>
      <main>
        {isInitialWorkbenchState(state) ? (
          <PartyEditor
            draft={state.draft}
            state={state}
            dispatch={dispatch}
            onClosed={focusPartyEditTrigger}
          />
        ) : (
          <AppliedWorkbench
            key={window.location.hash || 'ordinary-entry'}
            state={state}
            dispatch={dispatch}
            initialViewedSlot={currentShortcutState?.focusSlot ?? 0}
          />
        )}
      </main>
      <footer className="legal-footer">
        <p lang="en">
          This is an unofficial, non-commercial fan-made website. It is not sponsored,
          endorsed, or approved by HoYoverse. © All rights reserved by miHoYo. Other
          properties and any right, title, and interest thereof and therein (intellectual
          property rights included) not derived from Zenless Zone Zero belong to their
          respective owners.
        </p>
        <p lang="ko">
          이 프로젝트는 비공식·비상업적 팬메이드 웹사이트이며 HoYoverse의 후원·보증·승인을
          받지 않았습니다. Zenless Zone Zero 관련 이미지와 에셋의 권리는 HoYoverse 및 관련
          권리자에게 귀속되며, 그 밖의 자산과 권리는 각 소유자에게 귀속됩니다.
        </p>
      </footer>
    </div>
  )
}

export function App() {
  return <LocalizationProvider><WorkbenchApp /></LocalizationProvider>
}
