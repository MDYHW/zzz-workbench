import { useEffect, useRef, type KeyboardEvent, type ReactNode } from 'react'
import {
  ADMITTED_AGENTS,
  agentDisplayName,
  type AgentAttribute,
  type AgentId,
  type AgentRank,
  type AgentSpecialty,
} from '../workbench/content'
import type { RequiredSetupSelection } from '../workbench/candidates'
import type { AppliedAgentSlot, AppliedSlot } from '../workbench/state'
import { AGENT_PORTRAITS, portraitSourceStyle } from './agentPortraits'
import { ATTRIBUTE_MARKS, RANK_MARKS, SPECIALTY_MARKS } from './agentIdentityMarks'
import { AGENT_SELECTOR_PORTRAITS } from './agentSelectorPortraits'
import { agentSlotTone, sourceToneEvents, type SourceInteractionProps } from './sourceInteraction'

function PortraitArt({ agentId, className = '' }: { agentId: AgentId; className?: string }) {
  return (
    <span className={`identity-art ${className}`.trim()} aria-hidden="true">
      <img
        className="agent-art"
        src={AGENT_PORTRAITS[agentId]}
        alt=""
        style={portraitSourceStyle(agentId)}
      />
    </span>
  )
}

function SelectorPortraitArt({ agentId }: { agentId: AgentId }) {
  return (
    <span className="identity-art party-selector__portrait" aria-hidden="true">
      <img className="agent-art selector-agent-art" src={AGENT_SELECTOR_PORTRAITS[agentId]} alt="" />
    </span>
  )
}

interface PartyWorkbenchProps extends SourceInteractionProps {
  activeSourceTargetAgentId: AgentId | null
  slots: [AppliedAgentSlot, AppliedAgentSlot, AppliedAgentSlot]
  focusSlot: AppliedSlot
  isPartyEditing?: boolean
  incompleteSelections?: readonly RequiredSetupSelection[]
  viewedSlot: AppliedSlot
  onViewSlot: (slot: AppliedSlot) => void
  onEditParty?: () => void
  setup: ReactNode
  result: ReactNode
}

function RankMark({ rank }: { rank: AgentRank }) {
  return <span className="rank-mark" aria-label={`${rank} Rank`}><img src={RANK_MARKS[rank]} alt="" /></span>
}

function IdentityMarks({ attribute, specialty }: { attribute: AgentAttribute; specialty: AgentSpecialty }) {
  return (
    <span className="identity-pair identity-pair--symbols" aria-label={`${attribute}, ${specialty}`}>
      <img src={ATTRIBUTE_MARKS[attribute]} alt="" />
      <img src={SPECIALTY_MARKS[specialty]} alt="" />
    </span>
  )
}

interface SlotControlProps extends SourceInteractionProps {
  activeSourceTargetAgentId: AgentId | null
  slot: AppliedSlot
  agentId: AgentId
  isFocus: boolean
  isIncomplete?: boolean
  onSelect: () => void
  onKeyDown: (event: KeyboardEvent<HTMLButtonElement>) => void
}

function PartySelector({ activeSourceTargetAgentId, activeSourceTone, agentId, isFocus, isIncomplete = false, isInactive = false, isSelected, onSourceToneChange, onSelect, onKeyDown, slot }: SlotControlProps & { isInactive?: boolean; isSelected: boolean }) {
  const agent = ADMITTED_AGENTS.find((item) => item.id === agentId)!
  const agentName = agentDisplayName(agent)
  const slotTone = agentSlotTone(slot)
  const isTargetedSource = activeSourceTargetAgentId === agentId
  const tone = isTargetedSource && activeSourceTone ? activeSourceTone : slotTone
  const isSourceActive = isTargetedSource
    || (activeSourceTargetAgentId === null && activeSourceTone === slotTone)
  const className = `party-selector source-target source-tone--${tone}${isSelected ? ' is-viewed' : ''}${isFocus ? ' is-focus' : ''}${isSourceActive ? ' is-source-active' : ''}${isIncomplete ? ' is-setup-incomplete' : ''}`

  return (
    <button
      type="button"
      id={`party-tab-${slot + 1}`}
      className={className}
      data-agent={agent.id}
      role={isInactive ? undefined : 'tab'}
      tabIndex={isInactive ? undefined : isSelected ? 0 : -1}
      disabled={isInactive}
      aria-selected={isInactive ? undefined : isSelected}
      aria-controls={isInactive ? undefined : `party-panel-${slot + 1}`}
      aria-label={isInactive
        ? `${agentName} applied slot, inactive while editing party${isIncomplete ? ', setup incomplete' : ''}`
        : `View ${agentName} setup and Result${isIncomplete ? ', setup incomplete' : ''}`}
      onClick={isInactive ? undefined : onSelect}
      onKeyDown={isInactive ? undefined : onKeyDown}
      {...sourceToneEvents(slotTone, onSourceToneChange)}
    >
      <SelectorPortraitArt agentId={agent.id} />
      <span className="source-tint" aria-hidden="true" />
      <span className="party-selector__number" aria-hidden="true">0{slot + 1}</span>
      <span className="party-selector__identity">
        <span className="slot-name-line"><strong className="identity-name">{agentName}</strong></span>
        <span className="identity-band">
          <RankMark rank={agent.rank} />
          <IdentityMarks attribute={agent.attribute} specialty={agent.specialty} />
        </span>
      </span>
      <strong className={`focus-marker ${isFocus ? '' : 'focus-marker--reserved'}`} aria-hidden={!isFocus}>Focus</strong>
      {isIncomplete && <span className="slot-incomplete-marker">Setup incomplete</span>}
    </button>
  )
}

function WorkspaceIdentity({ agentId, isFocus, isIncomplete = false }: Pick<SlotControlProps, 'agentId' | 'isFocus' | 'isIncomplete'>) {
  const agent = ADMITTED_AGENTS.find((item) => item.id === agentId)!
  const agentName = agentDisplayName(agent)
  const className = `workspace-identity${isIncomplete ? ' is-setup-incomplete' : ''}`

  return (
    <section
      className={className}
      aria-label={`${agentName} identity`}
      data-agent={agent.id}
    >
      <PortraitArt agentId={agent.id} className="workspace-identity__portrait" />
      <span className="identity-copy">
        <span className="slot-name-line"><strong className="identity-name">{agentName}</strong></span>
        <span className="identity-band">
          <RankMark rank={agent.rank} />
          <IdentityMarks attribute={agent.attribute} specialty={agent.specialty} />
        </span>
        <strong className={`focus-marker ${isFocus ? '' : 'focus-marker--reserved'}`} aria-hidden={!isFocus}>Focus</strong>
        {isIncomplete && <span className="slot-incomplete-marker">Setup incomplete</span>}
      </span>
    </section>
  )
}

export function PartyWorkbench({
  activeSourceTargetAgentId,
  activeSourceTone,
  slots,
  focusSlot,
  incompleteSelections = [],
  isPartyEditing = false,
  viewedSlot,
  onSourceToneChange,
  onViewSlot,
  onEditParty = () => {},
  setup,
  result,
}: PartyWorkbenchProps) {
  const previousViewedSlot = useRef<AppliedSlot>(viewedSlot)

  useEffect(() => {
    if (previousViewedSlot.current === viewedSlot) return
    previousViewedSlot.current = viewedSlot
    document.getElementById(`party-tab-${viewedSlot + 1}`)?.focus()
  }, [viewedSlot])

  const navigateSlots = (
    slot: AppliedSlot,
    event: KeyboardEvent<HTMLButtonElement>,
  ) => {
    const index = slot
    let nextIndex: number | undefined

    if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
      nextIndex = (index + 1) % slots.length
    } else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
      nextIndex = (index - 1 + slots.length) % slots.length
    } else if (event.key === 'Home') {
      nextIndex = 0
    } else if (event.key === 'End') {
      nextIndex = slots.length - 1
    }

    if (nextIndex === undefined) return
    event.preventDefault()
    onViewSlot(nextIndex as AppliedSlot)
  }
  return (
    <section className="party-section" aria-labelledby="party-heading">
      <h2
        id="party-heading"
        className={isPartyEditing ? 'party-section__current-label' : 'sr-only'}
      >
        {isPartyEditing ? 'Current party' : 'Applied party'}
      </h2>
      <div className="party-rail">
        <ol
          className="party-tabs"
          role={isPartyEditing ? undefined : 'tablist'}
          aria-label="Applied party slots"
        >
          {slots.map(({ agentId }, slot) => {
            const slotPosition = slot as AppliedSlot
            const selected = slotPosition === viewedSlot
            const isIncomplete = incompleteSelections.some((selection) => selection.slot === slotPosition)

            return (
              <li key={slotPosition} role="presentation">
                <PartySelector
                  activeSourceTargetAgentId={activeSourceTargetAgentId}
                  activeSourceTone={activeSourceTone}
                  agentId={agentId}
                  isFocus={slotPosition === focusSlot}
                  isIncomplete={isIncomplete}
                  isInactive={isPartyEditing}
                  isSelected={selected}
                  slot={slotPosition}
                  onSourceToneChange={onSourceToneChange}
                  onSelect={() => onViewSlot(slotPosition)}
                  onKeyDown={(event) => navigateSlots(slotPosition, event)}
                />
              </li>
            )
          })}
        </ol>
        <div className="party-edit-cell">
          <button
            type="button"
            className="party-edit-trigger"
            disabled={isPartyEditing}
            aria-label="Edit party"
            onClick={isPartyEditing ? undefined : onEditParty}
          >
            <span className="party-edit-trigger__content">
              <span className="party-edit-trigger__mark" aria-hidden="true">+</span>
              <span>
                <strong>Edit party</strong>
                <small>Change formation</small>
              </span>
            </span>
          </button>
        </div>
      </div>
      {!isPartyEditing && (
        <div
          key={viewedSlot}
          id={`party-panel-${viewedSlot + 1}`}
          className="party-workspace"
          role="tabpanel"
          aria-labelledby={`party-tab-${viewedSlot + 1}`}
          data-agent={slots[viewedSlot].agentId}
        >
          <div className="workspace-reference">
            <WorkspaceIdentity
              agentId={slots[viewedSlot].agentId}
              isFocus={viewedSlot === focusSlot}
              isIncomplete={incompleteSelections.some((selection) => selection.slot === viewedSlot)}
            />
            {setup}
          </div>
          {result}
        </div>
      )}
    </section>
  )
}
