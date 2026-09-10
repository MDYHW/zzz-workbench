import { useEffect, useRef, useState, type Dispatch, type ReactNode, type Ref } from 'react'
import {
  defaultRefinementFor,
  DRIVE_DISCS,
  ENGINE_IDS_BY_AGENT_AND_POOL,
  MAIN_STATS,
  mainStatDisplay,
  ADMITTED_AGENTS,
  SEED_SETUP_PASSIVE_LINES,
  W_ENGINES,
  type AgentAttribute,
  type AgentId,
  type DiscId,
  type EngineId,
  type MainSlot,
  type MainStatId,
  type PoolId,
  type Refinement,
  type SubstatChoice,
} from '../workbench/content'
import {
  localizedAgentName,
  localizedDiscName,
  localizedDiscEffectLine,
  localizedEngineName,
  localizedEnginePassiveLine,
  localizedPresentation,
  localizedStat,
  useLocalization,
} from '../localization'
import { effectiveSubstatChoices } from '../workbench/candidates'
import type { AgentSetupState, AppliedSlot, Mindscape, WorkbenchAction } from '../workbench/state'
import type { EquipmentCopyLine } from '../workbench/content/equipment-copy'
import {
  sourceToneEvents,
  useSelectionFocusReturn,
  type SourceInteractionProps,
} from './sourceInteraction'

interface AgentSetupProps extends SourceInteractionProps {
  slot: AppliedSlot
  agentId: AgentId
  setup: AgentSetupState
  discCandidates: Record<'fourPiece' | 'twoPiece', readonly DiscId[]>
  fourPieceRoleSwapIds?: readonly DiscId[]
  mainStatCandidates: Record<MainSlot, readonly MainStatId[]>
  substatChoices?: readonly SubstatChoice[]
  dispatch: Dispatch<WorkbenchAction>
}

function targetClass(base: string, tone: string, activeSourceTone: string | null): string {
  return `${base} source-target source-tone--${tone}${activeSourceTone === tone ? ' is-source-active' : ''}`
}

function PoolSelection({
  activeSourceTone,
  agentId,
  slot,
  dispatch,
  mindscape,
  onSourceToneChange,
  pool,
}: {
  agentId: AgentId
  slot: AppliedSlot
  dispatch: Dispatch<WorkbenchAction>
  mindscape: Mindscape
  pool: PoolId
} & SourceInteractionProps) {
  const { locale, t } = useLocalization()
  return (
    <section className="setup-group pool-fieldset" aria-labelledby={agentId + '-loadout-heading'}>
      <h3 id={agentId + '-loadout-heading'}><span>01</span> {t('loadout')}</h3>
      <div className="loadout-control-grid">
        <div
          className={targetClass('mindscape-control', 'mindscape', activeSourceTone)}
          data-source-tone="mindscape"
          {...sourceToneEvents('mindscape', onSourceToneChange)}
        >
          <h4 className="loadout-control__group-heading">{t('mindscape')}</h4>
          <div className="mindscape-rail" role="group" aria-label={t('mindscape')}>
            {([0, 1, 2, 3, 4, 5, 6] as Mindscape[]).map((level) => (
              <button
                type="button"
                key={level}
                aria-label={`M${level}`}
                aria-pressed={mindscape === level}
                onClick={() => dispatch({ type: 'setMindscape', slot, mindscape: level })}
              >
                M{level}
              </button>
            ))}
          </div>
        </div>
        <div className="pool-control">
          <h4 className="loadout-control__group-heading">{t('enginePool')}</h4>
          <div className="segmented-control">
            <button
              type="button"
              className={pool === 'full' ? 'is-selected' : ''}
              aria-label={locale === 'ko' ? '전체 W-엔진 범위' : 'Full pool'}
              aria-pressed={pool === 'full'}
              onClick={() => dispatch({ type: 'switchPool', slot, pool: 'full' })}
            >
              {t('full')}
            </button>
            <button
              type="button"
              className={pool === 'nonLimited' ? 'is-selected' : ''}
              aria-pressed={pool === 'nonLimited'}
              aria-label={locale === 'ko' ? '상시 범위: 한정 S급 W-엔진을 제외하고 등록된 상시 S급과 A급 W-엔진 포함' : 'Non-limited pool: excludes limited S-Rank W-Engines and includes admitted non-limited S-Rank and A-Rank W-Engines'}
              onClick={() => dispatch({ type: 'switchPool', slot, pool: 'nonLimited' })}
            >
              {t('nonLimited')}
            </button>
          </div>
        </div>
      </div>
      {agentId === 'seed' && (
        <div className="equipment-effects" aria-label={locale === 'ko' ? '시드 추가 능력' : 'Seed Additional Ability'}>
          {SEED_SETUP_PASSIVE_LINES.map((line) => (
            <span key={line}>{locale === 'ko' ? '추가 능력' : 'Additional Ability'} · {localizedPresentation('seed-additional-setup', line, locale)}</span>
          ))}
        </div>
      )}
    </section>
  )
}

function SelectionSurface({
  ariaLabel,
  ariaDescribedBy,
  children,
  editable,
  expanded,
  onClick,
  buttonRef,
  fixedRef,
  fixedTabIndex,
}: {
  ariaLabel: string
  ariaDescribedBy?: string
  children: ReactNode
  editable: boolean
  expanded: boolean
  onClick: () => void
  buttonRef?: Ref<HTMLButtonElement>
  fixedRef?: Ref<HTMLDivElement>
  fixedTabIndex?: number
}) {
  const { t } = useLocalization()
  return editable ? (
    <button
      type="button"
      className="selection-surface selection-surface--editable"
      aria-label={ariaLabel}
      aria-describedby={ariaDescribedBy}
      aria-expanded={expanded}
      onClick={onClick}
      ref={buttonRef}
    >
      {children}
      <span className="selection-surface__change" aria-hidden="true">&#9660;</span>
    </button>
  ) : (
    <div
      className="selection-surface selection-surface--fixed"
      aria-label={ariaLabel}
      aria-describedby={ariaDescribedBy}
      ref={fixedRef}
      tabIndex={fixedTabIndex}
    >
      {children}
      <span className="selection-surface__fixed" role="img" aria-label={t('fixedSelection')} />
    </div>
  )
}

function EngineCard({
  descriptionId,
  engineId,
  refinement,
  compact = false,
  candidate = false,
}: {
  descriptionId?: string
  engineId: EngineId
  refinement: Refinement
  compact?: boolean
  candidate?: boolean
}) {
  const { locale } = useLocalization()
  const engine = W_ENGINES[engineId]
  const passiveLines = engine.passiveLines(refinement).map((line, index) => (
    localizedEnginePassiveLine(engineId, index, line, locale)
  ))
  const engineName = localizedEngineName(engineId, locale)
  const advancedStatLabel = localizedStat(engine.advancedStat.id, engine.advancedStat.label, locale)
  const accessibleDescription = [
    `${advancedStatLabel} +${engine.advancedStat.value}${engine.advancedStat.unit}`,
    ...passiveLines,
  ].join('. ')
  return (
    <>
      <span className={`equipment-art equipment-art--engine engine-art--${engineId}`}>
        <img src={engine.image} alt="" />
      </span>
      <span className="equipment-copy">
        <span className="equipment-name-line">
          <strong>{engineName}</strong>
          <span className="equipment-rank">
            {candidate ? engine.rank + ' / W' + refinement : engine.rank}
          </span>
        </span>
        <span className="equipment-advanced">
          {advancedStatLabel}
          <b>+{engine.advancedStat.value}{engine.advancedStat.unit}</b>
        </span>
        {!compact && (
          <span className="equipment-effects">
            {passiveLines.map((line) => <span key={line}>{line}</span>)}
          </span>
        )}
      </span>
      {descriptionId && <span className="sr-only" id={descriptionId}>{accessibleDescription}</span>}
    </>
  )
}

function EngineSelection({
  activeSourceTone,
  agentId,
  slot,
  dispatch,
  onSourceToneChange,
  openSelector,
  setOpenSelector,
  setup,
}: {
  agentId: AgentId
  slot: AppliedSlot
  setup: AgentSetupState
  dispatch: Dispatch<WorkbenchAction>
  openSelector: string | null
  setOpenSelector: (value: string | null) => void
} & SourceInteractionProps) {
  const { locale, t } = useLocalization()
  const engineId = setup.engineId
  const refinement = setup.refinement
  if (!engineId || !refinement) return null

  const selectorId = `${agentId}-engine`
  const candidates = ENGINE_IDS_BY_AGENT_AND_POOL[agentId][setup.pool]
  const alternatives = candidates.filter((id) => id !== engineId)
  const isOpen = openSelector === selectorId
  const selectedDescriptionId = `${agentId}-engine-details`
  const { openerRef, requestFocusReturn } = useSelectionFocusReturn()

  return (
    <section
      className={targetClass('setup-group equipment-fieldset', 'w-engine', activeSourceTone)}
      data-source-tone="w-engine"
      aria-labelledby={agentId + '-engine-heading'}
      {...sourceToneEvents('w-engine', onSourceToneChange)}
    >
      <h3 id={agentId + '-engine-heading'}><span>02</span> {t('engine')}</h3>
      <div className="selection-stack">
        <SelectionSurface
          ariaLabel={
            alternatives.length
              ? locale === 'ko' ? `${localizedEngineName(engineId, locale)}에서 W-엔진 변경` : `Change W-Engine from ${localizedEngineName(engineId, locale)}`
              : locale === 'ko' ? `${localizedEngineName(engineId, locale)} 선택됨` : `${localizedEngineName(engineId, locale)} selected`
          }
          editable={alternatives.length > 0}
          expanded={isOpen}
          ariaDescribedBy={selectedDescriptionId}
          onClick={() => setOpenSelector(isOpen ? null : selectorId)}
          buttonRef={openerRef}
        >
          <EngineCard
            descriptionId={selectedDescriptionId}
            engineId={engineId}
            refinement={refinement}
          />
        </SelectionSurface>
        {isOpen && (
          <div className="selector-region selector-region--engine" aria-label={locale === 'ko' ? 'W-엔진 후보' : 'W-Engine candidates'}>
            {alternatives.map((candidateId) => {
              const candidate = W_ENGINES[candidateId]
              const candidateDescriptionId = `${agentId}-${candidateId}-engine-candidate-details`
              return (
                <button
                  type="button"
                  className="selector-candidate selector-candidate--engine"
                  key={candidateId}
                  aria-label={locale === 'ko' ? `${localizedEngineName(candidateId, locale)} W${defaultRefinementFor(candidate.rank)} 선택` : `Select ${candidate.name} W${defaultRefinementFor(candidate.rank)}`}
                  aria-describedby={candidateDescriptionId}
                  onClick={() => {
                    dispatch({ type: 'selectEngine', slot, engineId: candidateId })
                    setOpenSelector(null)
                    requestFocusReturn()
                  }}
                >
                  <EngineCard
                    candidate
                    descriptionId={candidateDescriptionId}
                    engineId={candidateId}
                    refinement={defaultRefinementFor(candidate.rank)}
                  />
                </button>
              )
            })}
          </div>
        )}
      </div>
      <div
        className="refinement-control"
        role="group"
        aria-label={locale === 'ko' ? `${localizedEngineName(engineId, locale)} 개조 단계` : W_ENGINES[engineId].name + ' refinement'}
      >
        <div>
          {([1, 2, 3, 4, 5] as Refinement[]).map((rank) => (
            <button
              type="button"
              key={rank}
              aria-pressed={refinement === rank}
              className={refinement === rank ? 'is-selected' : ''}
              onClick={() => dispatch({
                type: 'setRefinement',
                slot,
                refinement: rank,
              })}
            >
              W{rank}
            </button>
          ))}
        </div>
      </div>
    </section>
  )
}

function DiscEffectRows({
  discId,
  fourPieceEffects,
  holderAttribute,
  piece,
}: {
  discId: DiscId
  fourPieceEffects: readonly EquipmentCopyLine[]
  holderAttribute: AgentAttribute
  piece: 'fourPiece' | 'twoPiece'
}) {
  const { locale } = useLocalization()
  const disc = DRIVE_DISCS[discId]
  if (piece === 'twoPiece') {
    return (
      <span className="disc-effect-rows disc-effect-rows--two-piece">
        <span>
          <small>{locale === 'ko' ? '2세트' : '2PC'}</small>
          <b>{localizedDiscEffectLine(discId, 'twoPiece', 0, disc.twoPieceEffect, locale, holderAttribute)}</b>
        </span>
      </span>
    )
  }

  return (
    <span className="disc-effect-rows disc-effect-rows--four-piece">
      {fourPieceEffects.map((effect, index) => (
        <span key={effect.text}>
          <small>{index === 0 ? (locale === 'ko' ? '4세트' : '4PC') : ''}</small>
          <b>{localizedDiscEffectLine(discId, 'fourPiece', index, effect, locale, holderAttribute)}</b>
        </span>
      ))}
      <span className="disc-effect-row--two-piece">
        <small>{locale === 'ko' ? '2세트' : '2PC'}</small>
        <b>{localizedDiscEffectLine(discId, 'twoPiece', 0, disc.twoPieceEffect, locale, holderAttribute)}</b>
      </span>
    </span>
  )
}

function DiscCard({
  descriptionId,
  discId,
  holderAttribute,
  piece,
  showHead = false,
}: {
  descriptionId?: string
  discId: DiscId
  holderAttribute: AgentAttribute
  piece: 'fourPiece' | 'twoPiece'
  showHead?: boolean
}) {
  const { locale } = useLocalization()
  const disc = DRIVE_DISCS[discId]
  const fourPieceEffects = disc.fourPieceEffectsForHolder?.(holderAttribute)
    ?? disc.fourPieceEffects
    ?? []
  const accessibleDescription = piece === 'fourPiece'
    ? [
        ...fourPieceEffects.map((effect, index) => localizedDiscEffectLine(discId, 'fourPiece', index, effect, locale, holderAttribute)),
        localizedDiscEffectLine(discId, 'twoPiece', 0, disc.twoPieceEffect, locale, holderAttribute),
      ].join('. ')
    : localizedDiscEffectLine(discId, 'twoPiece', 0, disc.twoPieceEffect, locale, holderAttribute)
  return (
    <>
      {showHead && (
        <small className="disc-card__head">{
          locale === 'ko'
            ? piece === 'fourPiece' ? '4세트' : '2세트'
            : piece === 'fourPiece' ? '4PC' : '2PC'
        }</small>
      )}
      <span className="equipment-art equipment-art--disc">
        <img src={disc.image} alt="" />
      </span>
      <span className="equipment-copy">
        <DiscEffectRows
          discId={discId}
          fourPieceEffects={fourPieceEffects}
          holderAttribute={holderAttribute}
          piece={piece}
        />
      </span>
      {descriptionId && <span className="sr-only" id={descriptionId}>{accessibleDescription}</span>}
    </>
  )
}

function DiscSelection({
  activeSourceTone,
  agentId,
  slot,
  dispatch,
  onSourceToneChange,
  openSelector,
  piece,
  candidates,
  fourPieceRoleSwapIds,
  twoPieceCandidates,
  selectedId,
  otherPieceId,
  setOpenSelector,
}: {
  agentId: AgentId
  slot: AppliedSlot
  dispatch: Dispatch<WorkbenchAction>
  openSelector: string | null
  piece: 'fourPiece' | 'twoPiece'
  candidates: readonly DiscId[]
  fourPieceRoleSwapIds: readonly DiscId[]
  twoPieceCandidates: readonly DiscId[]
  selectedId: DiscId | null
  otherPieceId: DiscId | null
  setOpenSelector: (value: string | null) => void
} & SourceInteractionProps) {
  const { locale, t } = useLocalization()
  const tone = piece === 'fourPiece' ? 'disc-4pc' : 'disc-2pc'
  const selectorId = `${agentId}-${piece}`
  const alternatives = piece === 'twoPiece'
    ? candidates.filter((id) => id !== selectedId && id !== otherPieceId)
    : candidates.filter((id) => id !== selectedId && (
      id !== otherPieceId
      || fourPieceRoleSwapIds.includes(id)
      || Boolean(selectedId && twoPieceCandidates.includes(selectedId))
    ))
  const isOpen = openSelector === selectorId
  const selectedName = selectedId ? localizedDiscName(selectedId, locale) : null
  const holderAttribute = ADMITTED_AGENTS.find(({ id }) => id === agentId)!.attribute
  const selectedDescriptionId = selectedId ? `${selectorId}-details` : undefined
  const pieceLabel = piece === 'fourPiece' ? (locale === 'ko' ? '4세트' : '4-piece') : (locale === 'ko' ? '2세트' : '2-piece')
  const focusTargetRef = useRef<HTMLElement | null>(null)
  const [shouldReturnFocus, setShouldReturnFocus] = useState(false)

  useEffect(() => {
    if (!shouldReturnFocus) return
    focusTargetRef.current?.focus()
    setShouldReturnFocus(false)
  }, [shouldReturnFocus])

  return (
    <div
      className={targetClass('disc-selection', tone, activeSourceTone)}
      data-source-tone={tone}
      {...sourceToneEvents(tone, onSourceToneChange)}
    >
      <SelectionSurface
        ariaLabel={
          selectedId === null
            ? locale === 'ko' ? `${pieceLabel} 디스크 선택 필요` : `${pieceLabel} Drive Disc required`
            : alternatives.length
              ? locale === 'ko' ? `${selectedName}에서 ${pieceLabel} 디스크 변경` : `Change ${pieceLabel} Drive Disc from ${selectedName}`
              : locale === 'ko' ? `${selectedName}, ${pieceLabel}로 선택됨` : `${selectedName} selected as ${pieceLabel}`
        }
        editable={selectedId === null || alternatives.length > 0}
        expanded={isOpen}
        ariaDescribedBy={selectedDescriptionId}
        onClick={() => setOpenSelector(isOpen ? null : selectorId)}
        buttonRef={(node) => { focusTargetRef.current = node }}
        fixedRef={(node) => { focusTargetRef.current = node }}
        fixedTabIndex={-1}
      >
        {selectedId ? (
          <DiscCard
            descriptionId={selectedDescriptionId}
            discId={selectedId}
            holderAttribute={holderAttribute}
            piece={piece}
            showHead
          />
        ) : (
          <span className="disc-required">
            <small className="disc-card__head">{piece === 'fourPiece' ? '4PC' : '2PC'}</small>
            <strong>{locale === 'ko' ? '디스크 선택 필요' : 'Drive Disc required'}</strong>
            <span>{t('select')}</span>
          </span>
        )}
      </SelectionSurface>
      {isOpen && (
        <div
          className="selector-region selector-region--disc"
          aria-label={locale === 'ko' ? `${pieceLabel} 디스크 후보` : piece + ' Drive Disc candidates'}
        >
          {alternatives.map((candidateId) => {
            const candidateName = localizedDiscName(candidateId, locale)
            const candidateDescriptionId = `${selectorId}-${candidateId}-candidate-details`
            return (
              <button
                type="button"
                className="selector-candidate selector-candidate--disc"
                key={candidateId}
                aria-label={locale === 'ko' ? `${candidateName}을(를) ${pieceLabel}로 선택` : `Select ${candidateName} as ${piece}`}
                aria-describedby={candidateDescriptionId}
                onClick={() => {
                  dispatch({ type: 'selectDisc', slot, piece, discId: candidateId })
                  setOpenSelector(null)
                  setShouldReturnFocus(true)
                }}
              >
                <DiscCard
                  descriptionId={candidateDescriptionId}
                  discId={candidateId}
                  holderAttribute={holderAttribute}
                  piece={piece}
                />
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

function MainStatSelection({
  activeSourceTone,
  agentId,
  appliedSlot,
  dispatch,
  candidates,
  mainStatId,
  onSourceToneChange,
  openSelector,
  setOpenSelector,
  mainSlot,
}: {
  agentId: AgentId
  appliedSlot: AppliedSlot
  dispatch: Dispatch<WorkbenchAction>
  candidates: readonly MainStatId[]
  mainStatId: MainStatId | null
  openSelector: string | null
  setOpenSelector: (value: string | null) => void
  mainSlot: MainSlot
} & SourceInteractionProps) {
  const { locale, t } = useLocalization()
  const tone = `disc-slot-${mainSlot.replace('slot', '')}`
  const selectorId = `${agentId}-${mainSlot}`
  const alternatives = mainStatId === null
    ? candidates
    : candidates.filter((id) => id !== mainStatId)
  const isOpen = openSelector === selectorId
  const selected = mainStatId === null ? null : MAIN_STATS[mainStatId]
  const focusTargetRef = useRef<HTMLElement | null>(null)
  const [shouldReturnFocus, setShouldReturnFocus] = useState(false)

  useEffect(() => {
    if (!shouldReturnFocus) return
    focusTargetRef.current?.focus()
    setShouldReturnFocus(false)
  }, [shouldReturnFocus])

  const selectedContent = selected && (
    <>
      <small className="main-stat-block__slot">{locale === 'ko' ? '디스크' : 'DISC'} {mainSlot.replace('slot', '')}</small>
      <span className="main-stat-block__details">
        <span>{localizedStat(mainStatId!, selected.label, locale)}</span>
        <strong>{mainStatDisplay(selected.numericValue, selected.unit)}</strong>
      </span>
    </>
  )

  const requiredContent = (
    <>
      <small className="main-stat-block__slot">{locale === 'ko' ? '디스크' : 'DISC'} {mainSlot.replace('slot', '')}</small>
      <span className="main-stat-block__details main-stat-block__details--required">
        <span>{locale === 'ko' ? '주옵션 선택 필요' : 'Main stat required'}</span>
        <strong>{t('select')}</strong>
      </span>
    </>
  )

  return (
    <div
      className={targetClass('main-stat-selection', tone, activeSourceTone)}
      data-source-tone={tone}
      {...sourceToneEvents(tone, onSourceToneChange)}
    >
      {mainStatId === null || alternatives.length > 0 ? (
        <button
          type="button"
          className={`main-stat-block main-stat-block--editable${mainStatId === null ? ' main-stat-block--required' : ''}`}
          aria-label={mainStatId === null
            ? locale === 'ko' ? `디스크 ${mainSlot.replace('slot', '')}번 주옵션 선택 필요` : `Disc ${mainSlot.replace('slot', '')} main stat required`
            : locale === 'ko' ? `디스크 ${mainSlot.replace('slot', '')}번 주옵션 ${localizedStat(mainStatId!, selected!.label, locale)}에서 변경` : `Change Disc ${mainSlot.replace('slot', '')} main stat from ${selected!.label}`}
          aria-expanded={isOpen}
          ref={(node) => { focusTargetRef.current = node }}
          onClick={() => setOpenSelector(isOpen ? null : selectorId)}
        >
          {mainStatId === null ? requiredContent : selectedContent}
          <span className="main-stat-block__change" aria-hidden="true">&#9660;</span>
        </button>
      ) : (
        <div
          className="main-stat-block main-stat-block--fixed"
          aria-label={locale === 'ko' ? `디스크 ${mainSlot.replace('slot', '')}번 ${localizedStat(mainStatId!, selected!.label, locale)} 선택됨` : `Disc ${mainSlot.replace('slot', '')} ${selected!.label} selected`}
          ref={(node) => { focusTargetRef.current = node }}
          tabIndex={-1}
        >
          {selectedContent}
          <span className="main-stat-block__fixed" role="img" aria-label={t('fixedSelection')} />
        </div>
      )}
      {isOpen && (
        <div
          className="selector-region selector-region--main"
          aria-label={locale === 'ko' ? `디스크 ${mainSlot.replace('slot', '')}번 주옵션 후보` : 'Disc ' + mainSlot.replace('slot', '') + ' main-stat candidates'}
        >
          {alternatives.map((candidateId) => {
            const candidate = MAIN_STATS[candidateId]
            return (
              <button
                type="button"
                key={candidateId}
                aria-label={locale === 'ko' ? `디스크 ${mainSlot.replace('slot', '')}번에 ${localizedStat(candidateId, candidate.label, locale)} 선택` : `Select ${candidate.label} for Disc ${mainSlot.replace('slot', '')}`}
                onClick={() => {
                  dispatch({
                    type: 'selectMainStat',
                    slot: appliedSlot,
                    mainSlot,
                    mainStatId: candidateId,
                  })
                  setOpenSelector(null)
                  setShouldReturnFocus(true)
                }}
              >
                <span>{localizedStat(candidateId, candidate.label, locale)}</span>
                <strong>{mainStatDisplay(candidate.numericValue, candidate.unit)}</strong>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

function EquipmentSelection({
  activeSourceTone,
  agentId,
  slot,
  dispatch,
  onSourceToneChange,
  openSelector,
  setOpenSelector,
  setup,
  discCandidates,
  fourPieceRoleSwapIds,
}: {
  agentId: AgentId
  slot: AppliedSlot
  setup: AgentSetupState
  discCandidates: Record<'fourPiece' | 'twoPiece', readonly DiscId[]>
  fourPieceRoleSwapIds: readonly DiscId[]
  dispatch: Dispatch<WorkbenchAction>
  openSelector: string | null
  setOpenSelector: (value: string | null) => void
} & SourceInteractionProps) {
  const { t } = useLocalization()
  return (
    <section
      className="setup-group prepared-block"
      aria-labelledby={agentId + '-disc-heading'}
    >
      <h3 id={agentId + '-disc-heading'}><span>03</span> {t('driveDiscs')}</h3>
      <div className="disc-grid">
        <DiscSelection
          activeSourceTone={activeSourceTone}
          agentId={agentId}
          slot={slot}
          dispatch={dispatch}
          onSourceToneChange={onSourceToneChange}
          openSelector={openSelector}
          piece="fourPiece"
          candidates={discCandidates.fourPiece}
          fourPieceRoleSwapIds={fourPieceRoleSwapIds}
          twoPieceCandidates={discCandidates.twoPiece}
          selectedId={setup.fourPieceId}
          otherPieceId={setup.twoPieceId}
          setOpenSelector={setOpenSelector}
        />
        <DiscSelection
          activeSourceTone={activeSourceTone}
          agentId={agentId}
          slot={slot}
          dispatch={dispatch}
          onSourceToneChange={onSourceToneChange}
          openSelector={openSelector}
          piece="twoPiece"
          candidates={discCandidates.twoPiece}
          fourPieceRoleSwapIds={[]}
          twoPieceCandidates={discCandidates.twoPiece}
          selectedId={setup.twoPieceId}
          otherPieceId={setup.fourPieceId}
          setOpenSelector={setOpenSelector}
        />
      </div>

    </section>
  )
}

function SubstatStepper({
  activeSourceTone,
  count,
  label,
  onDecrease,
  onIncrease,
  onSetCount,
  onSourceToneChange,
  perHit,
  requiredDescriptionId,
  statId,
  tone,
  unit,
}: {
  count: number | undefined
  label: string
  onDecrease: () => void
  onIncrease: () => void
  onSetCount: (value: number) => void
  perHit: number
  requiredDescriptionId: string
  statId: string
  tone: string
  unit: string
} & SourceInteractionProps) {
  const { locale } = useLocalization()
  const [draft, setDraft] = useState(count === undefined ? '' : String(count))
  const translatedLabel = localizedStat(statId, label, locale)
  const displayLabel = label === 'Anomaly Proficiency' ? (locale === 'ko' ? '이상 마스터리' : 'AP') : translatedLabel

  useEffect(() => {
    setDraft(count === undefined ? '' : String(count))
  }, [count])

  const commitDraft = () => {
    if (draft === '') {
      setDraft(count === undefined ? '' : String(count))
      return
    }

    const requested = Number(draft)
    if (!Number.isInteger(requested)) {
      setDraft(count === undefined ? '' : String(count))
      return
    }

    const next = Math.min(36, Math.max(0, requested))

    if (next !== count) onSetCount(next)
    setDraft(String(next))
  }

  return (
    <div
      className={targetClass('substat-control', tone, activeSourceTone)}
      data-source-tone={tone}
      {...sourceToneEvents(tone, onSourceToneChange)}
    >
      <div className="substat-copy">
        <strong>{displayLabel}</strong>
        <span>+{perHit}{unit}/{locale === 'ko' ? '회' : 'hit'}</span>
      </div>
      <div className="stepper">
        <button
          type="button"
          aria-label={locale === 'ko' ? `${translatedLabel} 유효 횟수 감소` : `Decrease ${label} hits`}
          disabled={count === undefined || count === 0}
          onClick={onDecrease}
        >{'\u2212'}</button>
        <input
          aria-label={locale === 'ko' ? `${translatedLabel} 유효 횟수` : `${label} hit count`}
          aria-invalid={count === undefined}
          aria-describedby={count === undefined ? requiredDescriptionId : undefined}
          inputMode="numeric"
          max={36}
          min={0}
          onBlur={commitDraft}
          onChange={(event) => {
            const next = event.target.value
            if (/^\d*$/.test(next)) {
              setDraft(next)
            }
          }}
          onFocus={(event) => event.currentTarget.select()}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault()
              event.currentTarget.blur()
            }
          }}
          type="text"
          value={draft}
        />
        <button
          type="button"
          aria-label={locale === 'ko' ? `${translatedLabel} 유효 횟수 증가` : `Increase ${label} hits`}
          disabled={count === 36}
          onClick={onIncrease}
        >+</button>
      </div>
      {count === undefined && <span id={requiredDescriptionId} className="substat-required">{locale === 'ko' ? '유효 횟수 선택 필요' : 'Hit count required'}</span>}
    </div>
  )
}

function StatBank({
  activeSourceTone,
  agentId,
  slot,
  dispatch,
  onSourceToneChange,
  openSelector,
  setOpenSelector,
  setup,
  mainStatCandidates,
  substatChoices,
}: {
  agentId: AgentId
  slot: AppliedSlot
  setup: AgentSetupState
  mainStatCandidates: Record<MainSlot, readonly MainStatId[]>
  substatChoices?: readonly SubstatChoice[]
  dispatch: Dispatch<WorkbenchAction>
  openSelector: string | null
  setOpenSelector: (value: string | null) => void
} & SourceInteractionProps) {
  const { locale, t } = useLocalization()
  const agent = ADMITTED_AGENTS.find(({ id }) => id === agentId)!
  const agentName = localizedAgentName(agent.id, locale)

  return (
    <section className="setup-group stat-bank" aria-labelledby={agentId + '-stat-bank-heading'}>
      <h3 id={agentId + '-stat-bank-heading'}><span>04</span> {t('statBank')}</h3>
      <h4 className="stat-bank__group-heading stat-bank__group-heading--main">{t('mainStats')}</h4>
      <div className="main-stat-grid" aria-label={locale === 'ko' ? `${agentName} 준비된 주옵션` : agentName + ' prepared main stats'}>
        {(['slot4', 'slot5', 'slot6'] as MainSlot[]).map((mainSlot) => (
          <MainStatSelection
            activeSourceTone={activeSourceTone}
            agentId={agentId}
            appliedSlot={slot}
            candidates={mainStatCandidates[mainSlot]}
            dispatch={dispatch}
            key={mainSlot}
            mainStatId={setup.mains[mainSlot]!}
            onSourceToneChange={onSourceToneChange}
            openSelector={openSelector}
            setOpenSelector={setOpenSelector}
            mainSlot={mainSlot}
          />
        ))}
      </div>
      <h4 className="stat-bank__group-heading stat-bank__group-heading--substats">{t('effectiveSubstats')}</h4>
      <div className="substat-grid" aria-label={locale === 'ko' ? `${agentName} 준비된 유효 부옵션` : agentName + ' prepared effective substats'}>
        {(substatChoices ?? effectiveSubstatChoices(agentId, setup)).map((choice, index) => (
          <SubstatStepper
            activeSourceTone={activeSourceTone}
            count={setup.substats[choice.id]}
            key={choice.id}
            label={choice.label}
            onDecrease={() => dispatch({
              type: 'adjustSubstat',
              slot,
              key: choice.id,
              delta: -1,
            })}
            onIncrease={() => dispatch({
              type: 'adjustSubstat',
              slot,
              key: choice.id,
              delta: 1,
            })}
            onSetCount={(value) => dispatch({
              type: 'setSubstat',
              slot,
              key: choice.id,
              value,
            })}
            onSourceToneChange={onSourceToneChange}
            perHit={choice.perHit}
            requiredDescriptionId={`${agentId}-${choice.id}-hit-count-required`}
            statId={choice.id}
            tone={`substat-${index + 1}`}
            unit={choice.unit}
          />
        ))}
      </div>
    </section>
  )
}

export function AgentSetup({
  activeSourceTone,
  agentId,
  slot,
  dispatch,
  discCandidates,
  fourPieceRoleSwapIds = [],
  mainStatCandidates,
  onSourceToneChange,
  setup,
  substatChoices,
}: AgentSetupProps) {
  const { locale } = useLocalization()
  const [openSelector, setOpenSelector] = useState<string | null>(null)
  const agent = ADMITTED_AGENTS.find(({ id }) => id === agentId)!
  const agentName = localizedAgentName(agent.id, locale)

  useEffect(() => {
    setOpenSelector(null)
  }, [agentId, setup.mindscape, setup.pool])

  return (
    <section className="setup-panel" aria-label={locale === 'ko' ? `${agentName} 세팅` : agentName + ' setup'}>
      <div className="setup-chassis">
        <PoolSelection
          activeSourceTone={activeSourceTone}
          agentId={agentId}
          slot={slot}
          dispatch={dispatch}
          mindscape={setup.mindscape}
          onSourceToneChange={onSourceToneChange}
          pool={setup.pool}
        />
        <EngineSelection
          activeSourceTone={activeSourceTone}
          agentId={agentId}
          slot={slot}
          dispatch={dispatch}
          onSourceToneChange={onSourceToneChange}
          openSelector={openSelector}
          setOpenSelector={setOpenSelector}
          setup={setup}
        />
        <EquipmentSelection
          activeSourceTone={activeSourceTone}
          agentId={agentId}
          slot={slot}
          dispatch={dispatch}
          discCandidates={discCandidates}
          fourPieceRoleSwapIds={fourPieceRoleSwapIds}
          onSourceToneChange={onSourceToneChange}
          openSelector={openSelector}
          setOpenSelector={setOpenSelector}
          setup={setup}
        />
        <StatBank
          activeSourceTone={activeSourceTone}
          agentId={agentId}
          slot={slot}
          dispatch={dispatch}
          mainStatCandidates={mainStatCandidates}
          onSourceToneChange={onSourceToneChange}
          openSelector={openSelector}
          setOpenSelector={setOpenSelector}
          setup={setup}
          substatChoices={substatChoices}
        />
      </div>
    </section>
  )
}
