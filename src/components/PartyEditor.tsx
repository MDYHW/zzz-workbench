import { useEffect, useMemo, useRef, useState, type Dispatch } from 'react'
import {
  ADMITTED_AGENTS,
  type AgentAttribute,
  type AgentId,
  type AgentSpecialty,
} from '../workbench/content'
import {
  localizedAgentName,
  localizedAttribute,
  localizedSpecialty,
  useLocalization,
} from '../localization'
import {
  isInitialWorkbenchState,
  type AppliedSlot,
  type InitialPartyDraft,
  type PartyDraft,
  type WorkbenchAction,
  type WorkbenchSessionState,
} from '../workbench/state'
import { ATTRIBUTE_MARKS, RANK_MARKS, SPECIALTY_MARKS } from './agentIdentityMarks'
import { AGENT_SELECTOR_PORTRAITS } from './agentSelectorPortraits'

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

const ATTRIBUTE_FILTERS = [...new Set(ADMITTED_AGENTS.map((agent) => (
  PARTY_EDIT_ATTRIBUTE_GROUPS[agent.attribute]
)))]
const SPECIALTY_FILTERS = [...new Set(ADMITTED_AGENTS.map((agent) => agent.specialty))]

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
  draft: PartyDraft | InitialPartyDraft
  state: WorkbenchSessionState
  dispatch: Dispatch<WorkbenchAction>
  onClosed: () => void
}

export function PartyEditor({ draft, state, dispatch, onClosed }: PartyEditorProps) {
  const { locale, t } = useLocalization()
  const [target, setTarget] = useState<AppliedSlot | null>(null)
  const [focusOpen, setFocusOpen] = useState(false)
  const [attribute, setAttribute] = useState<'all' | PartyEditAttributeFilter>('all')
  const [specialty, setSpecialty] = useState<'all' | AgentSpecialty>('all')
  const draftSlots = useRef<Array<HTMLButtonElement | null>>([])
  const focusChange = useRef<HTMLButtonElement>(null)
  const focusOptions = useRef<HTMLDivElement>(null)
  const focusRequestedByApply = useRef(false)
  const candidatePool = useRef<HTMLDivElement>(null)
  const isInitialParty = isInitialWorkbenchState(state)
  const changed = isInitialParty
    || draft.focusSlot !== state.focusSlot
    || draft.agentIds.some((agentId, index) => agentId !== state.slots[index].agentId)
  const collator = useMemo(() => new Intl.Collator(locale === 'ko' ? 'ko-KR' : 'en-US', {
    numeric: true,
    sensitivity: 'base',
  }), [locale])
  const sortedAgents = useMemo(() => [...ADMITTED_AGENTS].sort((left, right) => (
    collator.compare(localizedAgentName(left.id, locale), localizedAgentName(right.id, locale))
  )), [collator, locale])
  const attributeFilters = useMemo(() => [...ATTRIBUTE_FILTERS].sort((left, right) => (
    collator.compare(localizedAttribute(left, locale), localizedAttribute(right, locale))
  )), [collator, locale])
  const specialtyFilters = useMemo(() => [...SPECIALTY_FILTERS].sort((left, right) => (
    collator.compare(localizedSpecialty(left, locale), localizedSpecialty(right, locale))
  )), [collator, locale])
  const candidates = sortedAgents.filter((agent) => (
    (attribute === 'all' || PARTY_EDIT_ATTRIBUTE_GROUPS[agent.attribute] === attribute)
    && (specialty === 'all' || agent.specialty === specialty)
  ))
  const availableCandidates = candidates.filter((agent) => !draft.agentIds.includes(agent.id))
  const completeParty = draft.agentIds.every((agentId) => agentId !== null)
    && new Set(draft.agentIds).size === 3
  const eligible = draft.agentIds.flatMap((agentId, slot) => (
    agentId !== null && ADMITTED_AGENTS.find((agent) => agent.id === agentId)?.focusEligible
      ? [slot as AppliedSlot]
      : []
  ))
  const canResolveFocus = changed
    && completeParty
    && eligible.length > 1
    && draft.focusSlot === null
  const canApply = changed
    && completeParty
    && eligible.length > 0
    && draft.focusSlot !== null
  const selectedFocusSlot = draft.focusSlot
  const selectedFocus = selectedFocusSlot === null
    ? null
    : ADMITTED_AGENTS.find((agent) => agent.id === draft.agentIds[selectedFocusSlot]) ?? null
  const selectedAgentCount = draft.agentIds.filter((agentId) => agentId !== null).length
  const focusStatus = !completeParty
    ? locale === 'ko' ? `에이전트 3명 중 ${selectedAgentCount}명을 선택했습니다.` : `${selectedAgentCount} of 3 Agents selected.`
    : eligible.length === 1
    ? locale === 'ko'
      ? `${localizedAgentName(draft.agentIds[eligible[0]]!, locale)}이(가) 자동으로 주력이 됩니다.`
      : `${localizedAgentName(draft.agentIds[eligible[0]]!, locale)} is Focus automatically.`
    : eligible.length === 0
      ? locale === 'ko' ? '주력으로 지정할 수 있는 에이전트가 없습니다. 적용하기 전에 파티원을 교체하세요.' : 'No eligible Focus Agent. Replace one draft member before applying.'
      : selectedFocus
        ? locale === 'ko' ? `${localizedAgentName(selectedFocus.id, locale)}이(가) 주력입니다.` : `${localizedAgentName(selectedFocus.id, locale)} is Focus.`
        : locale === 'ko' ? '적용하기 전에 주력 에이전트를 선택하세요.' : 'Choose a Focus Agent before applying.'

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
        <h2 id="party-editor-heading">{t('editingParty')}</h2>
        <span aria-live="polite">{target === null ? focusStatus : locale === 'ko' ? `${target + 1}번 슬롯 교체 중. 선택 가능한 에이전트 ${availableCandidates.length}명.` : `Replacing slot ${target + 1}. ${availableCandidates.length} available Agents.`}</span>
      </div>
      <div className="party-editor__formation">
        <div className="party-editor__draft-rail">
          <ol className="party-editor__slots" aria-label={locale === 'ko' ? '편집 중인 파티 슬롯' : 'Draft party slots'}>
            {draft.agentIds.map((agentId, slot) => {
              const selected = target === slot
              if (agentId === null) {
                return (
                  <li key={slot}>
                    <button
                      ref={(element) => { draftSlots.current[slot] = element }}
                      type="button"
                      className={`draft-slot draft-slot--empty${selected ? ' is-target' : ''}`}
                      aria-pressed={selected}
                      aria-label={locale === 'ko' ? `${slot + 1}번 슬롯 에이전트 선택` : `Select Agent for slot ${slot + 1}`}
                      onClick={() => {
                        setTarget(selected ? null : (slot as AppliedSlot))
                        setFocusOpen(false)
                      }}
                    >
                      <span className="draft-slot__empty-mark" aria-hidden="true">+</span>
                      <strong className="draft-slot__empty-label">{t('selectAgent')}</strong>
                      <span className="draft-slot__replace" aria-hidden="true">{t('select')}</span>
                    </button>
                  </li>
                )
              }
              const agent = ADMITTED_AGENTS.find((item) => item.id === agentId)!
              const agentName = localizedAgentName(agent.id, locale)
              const isFocus = draft.focusSlot === slot
              return (
                <li key={slot}>
                  <button
                    ref={(element) => { draftSlots.current[slot] = element }}
                    type="button"
                    className={`draft-slot${selected ? ' is-target' : ''}${isFocus ? ' is-focus' : ''}`}
                    aria-pressed={selected}
                    aria-label={locale === 'ko' ? `${slot + 1}번 슬롯 ${agentName} 교체` : `Replace slot ${slot + 1}, ${agentName}`}
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
                    <span className="draft-slot__replace" aria-hidden="true">{t('replace')}</span>
                    <span className="draft-slot__focus-marker" aria-hidden="true">{t('focus')}</span>
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
              aria-label={eligible.length > 1 ? (locale === 'ko' ? '주력 에이전트 변경' : 'Change Focus Agent') : focusStatus}
              disabled={eligible.length < 2}
              onClick={() => setFocusOpen((open) => !open)}
            >
              <span className="party-editor__focus-ring" aria-hidden="true" />
              <span>{t('focus')}<br />{locale === 'ko' ? '변경' : 'change'}</span>
            </button>
          </div>
        </div>
        {focusOpen && eligible.length > 1 && (
          <div
            id="party-editor-focus-popup"
            className={`party-editor__focus-popup party-editor__focus-popup--${eligible.length}`}
          >
            <div className="party-editor__focus-heading">
              <strong>{t('selectFocus')}</strong>
              <span>{t('treatedOnField')}</span>
            </div>
            <div ref={focusOptions} className="party-editor__focus-options" role="group" aria-label={locale === 'ko' ? '주력 지정 가능 에이전트' : 'Eligible Focus Agents'}>
              {eligible.map((slot) => {
                const agent = ADMITTED_AGENTS.find((item) => item.id === draft.agentIds[slot])!
                const agentName = localizedAgentName(agent.id, locale)
                return (
                  <button
                    key={slot}
                    type="button"
                    className={`party-editor__focus-option${draft.focusSlot === slot ? ' is-selected' : ''}`}
                    aria-pressed={draft.focusSlot === slot}
                    aria-label={locale === 'ko' ? `${agentName}을(를) 주력으로 지정` : `Set ${agentName} as Focus`}
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
                        <img src={RANK_MARKS[agent.rank]} alt="" />
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
        {completeParty && eligible.length === 0 && <p className="party-editor__focus-invalid" role="alert">{focusStatus}</p>}
      </div>
      {target !== null && (
        <>
          <div className="party-editor__filters" aria-label={locale === 'ko' ? '에이전트 필터' : 'Agent filters'}>
            <fieldset className="party-editor__filter-row">
              <legend>{t('attribute')}</legend>
              <div>
                <button type="button" className={attribute === 'all' ? 'is-selected' : ''} aria-pressed={attribute === 'all'} onClick={() => setAttribute('all')}>{t('all')}</button>
                {attributeFilters.map((value) => (
                  <button key={value} type="button" className={attribute === value ? 'is-selected' : ''} aria-pressed={attribute === value} aria-label={locale === 'ko' ? `${localizedAttribute(value, locale)} 속성 계열` : PARTY_EDIT_ATTRIBUTE_LABELS[value] ?? `${value} Attribute`} onClick={() => setAttribute(value)}>
                    <img src={ATTRIBUTE_MARKS[value]} alt="" />
                    <span>{localizedAttribute(value, locale)}</span>
                  </button>
                ))}
              </div>
            </fieldset>
            <fieldset className="party-editor__filter-row">
              <legend>{t('specialty')}</legend>
              <div>
                <button type="button" className={specialty === 'all' ? 'is-selected' : ''} aria-pressed={specialty === 'all'} onClick={() => setSpecialty('all')}>{t('all')}</button>
                {specialtyFilters.map((value) => (
                  <button key={value} type="button" className={specialty === value ? 'is-selected' : ''} aria-pressed={specialty === value} aria-label={locale === 'ko' ? `${localizedSpecialty(value, locale)} 특성` : `${value} Specialty`} onClick={() => setSpecialty(value)}>
                    <img src={SPECIALTY_MARKS[value]} alt="" />
                    <span>{localizedSpecialty(value, locale)}</span>
                  </button>
                ))}
              </div>
            </fieldset>
          </div>
          <div className="party-editor__pool" ref={candidatePool} role="region" aria-label={locale === 'ko' ? '에이전트 후보 목록' : 'Agent candidate pool'}>
            {candidates.length === 0 && <p className="party-editor__empty" role="status">{t('noMatchingAgents')}</p>}
            <div className="party-editor__pool-grid">{candidates.map((agent) => {
              const occupied = draft.agentIds.includes(agent.id)
              const occupiedSlot = draft.agentIds.indexOf(agent.id)
              const agentName = localizedAgentName(agent.id, locale)
              const identityLabel = `${agentName}, ${localizedAttribute(agent.attribute, locale)}, ${localizedSpecialty(agent.specialty, locale)}, ${locale === 'ko' ? `${agent.rank}급` : `${agent.rank} Rank`}`
              return <button key={agent.id} type="button" className={`agent-pool-card${occupied ? ' is-occupied' : ''}`} data-agent={agent.id} disabled={occupied} aria-label={locale === 'ko' ? `${occupied ? '선택 불가, ' : ''}${identityLabel}${occupied ? `, ${occupiedSlot + 1}번 슬롯` : ''}` : `${occupied ? 'Unavailable, ' : ''}${identityLabel}${occupied ? `, Slot ${occupiedSlot + 1}` : ''}`} onClick={() => {
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
                    {occupied && <small className="agent-pool-card__occupied">{locale === 'ko' ? `${occupiedSlot + 1}번 슬롯` : `Slot ${occupiedSlot + 1}`}</small>}
                  </span>
                </span>
              </button>
            })}</div>
          </div>
        </>
      )}
      <div className="party-editor__actions"><button type="button" disabled={isInitialParty} onClick={close}>{t('cancel')}</button><button type="button" disabled={!canApply && !canResolveFocus} onClick={apply}>{t('applyParty')}</button></div>
    </section>
  )
}
