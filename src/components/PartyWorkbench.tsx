import { useEffect, useRef, type KeyboardEvent, type ReactNode } from 'react'
import auricInkMark from '../assets/game/attributes/auric-ink.webp'
import etherMark from '../assets/game/attributes/ether.webp'
import physicalMark from '../assets/game/attributes/physical.webp'
import electricMark from '../assets/game/attributes/electric.webp'
import fireMark from '../assets/game/attributes/fire.webp'
import iceMark from '../assets/game/attributes/ice.webp'
import frostMark from '../assets/game/attributes/frost.webp'
import rankSMark from '../assets/game/ranks/s.webp'
import rankAMark from '../assets/game/ranks/a.webp'
import ruptureMark from '../assets/game/specialties/rupture.webp'
import attackMark from '../assets/game/specialties/attack.webp'
import stunMark from '../assets/game/specialties/stun.webp'
import supportMark from '../assets/game/specialties/support.webp'
import defenseMark from '../assets/game/specialties/defense.webp'
import anomalyMark from '../assets/game/specialties/anomaly.webp'
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
import { agentSlotTone, sourceToneEvents, type SourceInteractionProps } from './sourceInteraction'

const ATTRIBUTE_MARKS: Record<AgentAttribute, string> = {
  Physical: physicalMark,
  Fire: fireMark,
  Ice: iceMark,
  Electric: electricMark,
  Ether: etherMark,
  'Auric Ink': auricInkMark,
  'Honed Edge': physicalMark,
  Frost: frostMark,
}

const SPECIALTY_MARKS: Record<AgentSpecialty, string> = {
  Attack: attackMark,
  Stun: stunMark,
  Support: supportMark,
  Defense: defenseMark,
  Rupture: ruptureMark,
  Anomaly: anomalyMark,
}

function PortraitArt({ agentId }: { agentId: AgentId }) {
  return (
    <span className="identity-art" aria-hidden="true">
      <img
        className="agent-art"
        src={AGENT_PORTRAITS[agentId]}
        alt=""
        style={portraitSourceStyle(agentId)}
      />
    </span>
  )
}

interface PartyWorkbenchProps extends SourceInteractionProps {
  slots: [AppliedAgentSlot, AppliedAgentSlot, AppliedAgentSlot]
  focusSlot: AppliedSlot
  isPartyEditing?: boolean
  incompleteSelections?: readonly RequiredSetupSelection[]
  viewedSlot: AppliedSlot | null
  onViewSlot: (slot: AppliedSlot | null) => void
  onEditParty?: () => void
  children: ReactNode
}

const RANK_MARKS: Record<AgentRank, string> = {
  S: rankSMark,
  A: rankAMark,
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
  slot: AppliedSlot
  agentId: AgentId
  isFocus: boolean
  isIncomplete?: boolean
  onSelect: () => void
  onKeyDown: (event: KeyboardEvent<HTMLButtonElement>) => void
}

function ExpandedIdentity({ activeSourceTone, agentId, isFocus, isIncomplete = false, onSourceToneChange, onSelect, onKeyDown, slot }: SlotControlProps) {
  const agent = ADMITTED_AGENTS.find((item) => item.id === agentId)!
  const agentName = agentDisplayName(agent)
  const identityTone = agentSlotTone(slot)
  const identityTones = [identityTone, 'core', 'additional', 'special', 'ex-special']
  const matchingTone = identityTones.find((tone) => tone === activeSourceTone)
  const className = matchingTone
    ? `slot-identity slot-identity--expanded source-target source-tone--${matchingTone} is-source-active${isIncomplete ? ' is-setup-incomplete' : ''}`
    : `slot-identity slot-identity--expanded source-target${isIncomplete ? ' is-setup-incomplete' : ''}`

  return (
    <button
      type="button"
      id={`party-tab-${slot + 1}`}
      className={className}
      data-agent={agent.id}
      role="tab"
      tabIndex={0}
      aria-selected="true"
      aria-controls={`party-panel-${slot + 1}`}
      aria-label={`Close ${agentName} setup and Result${isIncomplete ? ', setup incomplete' : ''}`}
      onClick={onSelect}
      onKeyDown={onKeyDown}
      {...sourceToneEvents(identityTone, onSourceToneChange)}
    >
      <PortraitArt agentId={agent.id} />
      <span className="identity-shade" aria-hidden="true" />
      <span className="source-tint" aria-hidden="true" />
      <span className="identity-copy">
        {isIncomplete && <span className="slot-incomplete-marker">Setup incomplete</span>}
        <strong className={`focus-marker ${isFocus ? '' : 'focus-marker--reserved'}`} aria-hidden={!isFocus}>Focus</strong>
        <span className="slot-name-line"><strong className="identity-name">{agentName}</strong></span>
        <span className="identity-band">
          <RankMark rank={agent.rank} />
          <IdentityMarks attribute={agent.attribute} specialty={agent.specialty} />
        </span>
      </span>
    </button>
  )
}

function CompactSlot({ activeSourceTone, agentId, isFocus, isIncomplete = false, isInactive = false, isOverview = false, onSourceToneChange, onSelect, onKeyDown, slot }: SlotControlProps & { isInactive?: boolean; isOverview?: boolean }) {
  const agent = ADMITTED_AGENTS.find((item) => item.id === agentId)!
  const agentName = agentDisplayName(agent)
  const tone = agentSlotTone(slot)
  const className = `party-slot party-slot--compact source-target source-tone--${tone}${activeSourceTone === tone ? ' is-source-active' : ''}${isIncomplete ? ' is-setup-incomplete' : ''}`

  return (
    <button
      type="button"
      id={`party-tab-${slot + 1}`}
      className={className}
      role={isOverview ? undefined : 'tab'}
      tabIndex={isInactive ? undefined : isOverview ? 0 : -1}
      disabled={isInactive}
      aria-selected={isOverview ? undefined : 'false'}
      aria-controls={isOverview ? undefined : `party-panel-${slot + 1}`}
      aria-label={isInactive
        ? `${agentName} applied slot, inactive while editing party${isIncomplete ? ', setup incomplete' : ''}`
        : `View ${agentName} setup and Result${isIncomplete ? ', setup incomplete' : ''}`}
      onClick={isInactive ? undefined : onSelect}
      onKeyDown={isInactive ? undefined : onKeyDown}
      {...sourceToneEvents(tone, onSourceToneChange)}
    >
      <PortraitArt agentId={agent.id} />
      <span className="identity-shade" aria-hidden="true" />
      <span className="source-tint" aria-hidden="true" />
      <span className="slot-identity">
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

export function PartyWorkbench({
  activeSourceTone,
  slots,
  focusSlot,
  incompleteSelections = [],
  isPartyEditing = false,
  viewedSlot,
  onSourceToneChange,
  onViewSlot,
  onEditParty = () => {},
  children,
}: PartyWorkbenchProps) {
  const previousViewedSlot = useRef<AppliedSlot | null>(viewedSlot)

  useEffect(() => {
    if (previousViewedSlot.current === viewedSlot) return
    const focusSlot = viewedSlot ?? previousViewedSlot.current
    previousViewedSlot.current = viewedSlot
    if (focusSlot !== null) document.getElementById(`party-tab-${focusSlot + 1}`)?.focus()
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
      <div className="section-kicker">
        <h2 id="party-heading">Applied party</h2>
        <span>Focus {'\u00B7'} {agentDisplayName(ADMITTED_AGENTS.find(({ id }) => id === slots[focusSlot].agentId)!)}</span>
        <button type="button" className="party-edit-trigger" onClick={onEditParty}>Edit party</button>
      </div>
      <ol
        className={`party-rail ${!isPartyEditing && viewedSlot !== null ? `party-rail--view-${viewedSlot + 1}` : 'party-rail--overview'}`}
        role={!isPartyEditing && viewedSlot !== null ? 'tablist' : undefined}
        aria-label="Applied party slots"
      >
        {slots.map(({ agentId }, slot) => {
          const slotPosition = slot as AppliedSlot
          const selected = !isPartyEditing && slotPosition === viewedSlot
          const isIncomplete = incompleteSelections.some((selection) => selection.slot === slotPosition)

          return (
            <li
              key={slotPosition}
              role="presentation"
              className={selected ? `party-slot party-slot--expanded${isIncomplete ? ' is-setup-incomplete' : ''}` : undefined}
            >
              {selected ? (
                <ExpandedIdentity
                  activeSourceTone={activeSourceTone}
                  agentId={agentId}
                  isFocus={slotPosition === focusSlot}
                  isIncomplete={isIncomplete}
                  slot={slotPosition}
                  onSourceToneChange={onSourceToneChange}
                  onSelect={() => onViewSlot(null)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault()
                      onViewSlot(null)
                      return
                    }
                    navigateSlots(slotPosition, event)
                  }}
                />
              ) : (
                <CompactSlot
                  activeSourceTone={activeSourceTone}
                  agentId={agentId}
                  isFocus={slotPosition === focusSlot}
                  isIncomplete={isIncomplete}
                  isInactive={isPartyEditing}
                  isOverview={isPartyEditing || viewedSlot === null}
                  slot={slotPosition}
                  onSourceToneChange={onSourceToneChange}
                  onSelect={() => onViewSlot(slotPosition)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault()
                      onViewSlot(slotPosition)
                      return
                    }
                    navigateSlots(slotPosition, event)
                  }}
                />
              )}
              {selected && (
                <div
                  id={`party-panel-${slotPosition + 1}`}
                  className="expanded-slot__workbench"
                  role="tabpanel"
                  aria-labelledby={`party-tab-${slotPosition + 1}`}
                  data-agent={agentId}
                >
                  {children}
                </div>
              )}
            </li>
          )
        })}
      </ol>
    </section>
  )
}
