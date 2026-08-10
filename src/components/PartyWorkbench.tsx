import { useEffect, useRef, type CSSProperties, type KeyboardEvent, type ReactNode } from 'react'
import dialynPortrait from '../assets/agents/portraits/dialyn.webp'
import evelynPortrait from '../assets/agents/portraits/evelyn.webp'
import luciaPortrait from '../assets/agents/portraits/lucia.webp'
import anbySoldier0Portrait from '../assets/agents/portraits/soldier-0-anby.webp'
import astraYaoPortrait from '../assets/agents/portraits/astra-yao.webp'
import cissiaPortrait from '../assets/agents/portraits/cissia.webp'
import triggerPortrait from '../assets/agents/portraits/trigger.webp'
import seedPortrait from '../assets/agents/portraits/seed.webp'
import yixuanPortrait from '../assets/agents/portraits/yixuan.webp'
import auricInkMark from '../assets/game/attributes/auric-ink.webp'
import etherMark from '../assets/game/attributes/ether.webp'
import physicalMark from '../assets/game/attributes/physical.webp'
import electricMark from '../assets/game/attributes/electric.webp'
import fireMark from '../assets/game/attributes/fire.webp'
import rankSMark from '../assets/game/ranks/s.webp'
import ruptureMark from '../assets/game/specialties/rupture.webp'
import attackMark from '../assets/game/specialties/attack.webp'
import stunMark from '../assets/game/specialties/stun.webp'
import supportMark from '../assets/game/specialties/support.webp'
import { ADMITTED_AGENTS, type AgentId } from '../workbench/content'
import type { RequiredSetupSelection } from '../workbench/candidates'
import type { AppliedAgentSlot, AppliedSlot } from '../workbench/state'
import { sourceToneEvents, type SourceInteractionProps } from './sourceInteraction'

const PORTRAITS: Record<AgentId, string> = {
  yixuan: yixuanPortrait,
  dialyn: dialynPortrait,
  lucia: luciaPortrait,
  anbySoldier0: anbySoldier0Portrait,
  trigger: triggerPortrait,
  astraYao: astraYaoPortrait,
  seed: seedPortrait,
  cissia: cissiaPortrait,
  evelyn: evelynPortrait,
}

const IDENTITY_MARKS: Record<AgentId, { attribute: string; specialty: string }> = {
  yixuan: { attribute: auricInkMark, specialty: ruptureMark },
  dialyn: { attribute: physicalMark, specialty: stunMark },
  lucia: { attribute: etherMark, specialty: supportMark },
  anbySoldier0: { attribute: electricMark, specialty: attackMark },
  trigger: { attribute: electricMark, specialty: stunMark },
  astraYao: { attribute: etherMark, specialty: supportMark },
  seed: { attribute: electricMark, specialty: attackMark },
  cissia: { attribute: electricMark, specialty: attackMark },
  evelyn: { attribute: fireMark, specialty: attackMark },
}

type PortraitVariant = 'expanded' | 'compact'

interface PortraitPoint {
  x: number
  y: number
}

interface PortraitAnchor {
  x: number
  y: number | string
}

interface PortraitFrame {
  anchor: PortraitAnchor
  width: number
}

interface PortraitTarget {
  default: PortraitFrame
  stacked?: PortraitFrame
  mobile?: PortraitFrame
}

interface PortraitPresentation {
  source: {
    face: PortraitPoint
  }
  expanded: PortraitTarget
  compact: PortraitTarget
}

type PortraitStyle = CSSProperties & {
  '--portrait-landmark-x': string
  '--portrait-landmark-y': string
  '--portrait-target-x': string
  '--portrait-target-y': string
  '--portrait-width': string
  '--portrait-stacked-target-x': string
  '--portrait-stacked-target-y': string
  '--portrait-stacked-width': string
  '--portrait-mobile-target-x': string
  '--portrait-mobile-target-y': string
  '--portrait-mobile-width': string
}

// Each source owns only its face landmark. The desktop expanded slot owns one
// shared destination and scale so Agent changes preserve the same visual frame.
const DESKTOP_EXPANDED_PORTRAIT_FRAME: PortraitFrame = {
  anchor: { x: 38, y: '204.22px' },
  width: 295,
}

const DESKTOP_COMPACT_PORTRAIT_FRAME: PortraitFrame = {
  anchor: { x: 50, y: '192px' },
  width: 727,
}

// Compact desktop, stacked, and mobile destinations are calibrated separately.
const PORTRAIT_PRESENTATION: Record<AgentId, PortraitPresentation> = {
  yixuan: {
    source: { face: { x: 55.8, y: 12 } },
    expanded: {
      default: DESKTOP_EXPANDED_PORTRAIT_FRAME,
      mobile: { anchor: { x: 31.7, y: 46.1 }, width: 85 },
    },
    compact: {
      default: {
        ...DESKTOP_COMPACT_PORTRAIT_FRAME,
        anchor: { x: 50, y: '198.06px' },
      },
      stacked: { anchor: { x: 55.7, y: 42.9 }, width: 102 },
      mobile: { anchor: { x: 58.7, y: 40.6 }, width: 149 },
    },
  },
  dialyn: {
    source: { face: { x: 50, y: 15 } },
    expanded: {
      default: { ...DESKTOP_EXPANDED_PORTRAIT_FRAME, width: 288 },
      mobile: { anchor: { x: 25, y: 49.8 }, width: 108 },
    },
    compact: {
      default: {
        ...DESKTOP_COMPACT_PORTRAIT_FRAME,
        anchor: { x: 50, y: '191.56px' },
      },
      stacked: { anchor: { x: 50, y: 45.9 }, width: 104 },
      mobile: { anchor: { x: 50, y: 45.1 }, width: 144 },
    },
  },
  lucia: {
    source: { face: { x: 44, y: 14 } },
    expanded: {
      default: DESKTOP_EXPANDED_PORTRAIT_FRAME,
      mobile: { anchor: { x: 23.7, y: 52 }, width: 130 },
    },
    compact: {
      default: {
        ...DESKTOP_COMPACT_PORTRAIT_FRAME,
        anchor: { x: 50, y: '187.89px' },
      },
      stacked: { anchor: { x: 49, y: 48 }, width: 100 },
      mobile: { anchor: { x: 48, y: 48 }, width: 200 },
    },
  },
  anbySoldier0: { source: { face: { x: 50, y: 13 } }, expanded: { default: DESKTOP_EXPANDED_PORTRAIT_FRAME, mobile: { anchor: { x: 30, y: 48 }, width: 105 } }, compact: { default: DESKTOP_COMPACT_PORTRAIT_FRAME, stacked: { anchor: { x: 52, y: 43 }, width: 106 }, mobile: { anchor: { x: 52, y: 43 }, width: 150 } } },
  trigger: { source: { face: { x: 49, y: 14 } }, expanded: { default: { ...DESKTOP_EXPANDED_PORTRAIT_FRAME, width: 290 }, mobile: { anchor: { x: 28, y: 48 }, width: 112 } }, compact: { default: DESKTOP_COMPACT_PORTRAIT_FRAME, stacked: { anchor: { x: 50, y: 44 }, width: 104 }, mobile: { anchor: { x: 50, y: 44 }, width: 148 } } },
  astraYao: { source: { face: { x: 48, y: 13 } }, expanded: { default: DESKTOP_EXPANDED_PORTRAIT_FRAME, mobile: { anchor: { x: 29, y: 47 }, width: 111 } }, compact: { default: DESKTOP_COMPACT_PORTRAIT_FRAME, stacked: { anchor: { x: 50, y: 43 }, width: 105 }, mobile: { anchor: { x: 50, y: 43 }, width: 150 } } },
  seed: { source: { face: { x: 52, y: 14 } }, expanded: { default: DESKTOP_EXPANDED_PORTRAIT_FRAME, mobile: { anchor: { x: 29, y: 48 }, width: 112 } }, compact: { default: DESKTOP_COMPACT_PORTRAIT_FRAME, stacked: { anchor: { x: 51, y: 44 }, width: 105 }, mobile: { anchor: { x: 51, y: 44 }, width: 150 } } },
  cissia: { source: { face: { x: 55, y: 14 } }, expanded: { default: DESKTOP_EXPANDED_PORTRAIT_FRAME, mobile: { anchor: { x: 30, y: 48 }, width: 112 } }, compact: { default: DESKTOP_COMPACT_PORTRAIT_FRAME, stacked: { anchor: { x: 52, y: 44 }, width: 105 }, mobile: { anchor: { x: 52, y: 44 }, width: 150 } } },
  evelyn: { source: { face: { x: 50, y: 13 } }, expanded: { default: DESKTOP_EXPANDED_PORTRAIT_FRAME, mobile: { anchor: { x: 29, y: 48 }, width: 110 } }, compact: { default: DESKTOP_COMPACT_PORTRAIT_FRAME, stacked: { anchor: { x: 51, y: 44 }, width: 105 }, mobile: { anchor: { x: 51, y: 44 }, width: 150 } } },
}

function PortraitArt({ agentId, variant }: { agentId: AgentId; variant: PortraitVariant }) {
  const presentation = PORTRAIT_PRESENTATION[agentId]
  const target = presentation[variant]
  const defaultFrame = target.default
  const stackedFrame = target.stacked ?? defaultFrame
  const mobileFrame = target.mobile ?? stackedFrame
  const targetY = (value: PortraitAnchor['y']) => typeof value === 'number' ? `${value}%` : value
  const style: PortraitStyle = {
    '--portrait-landmark-x': `-${presentation.source.face.x}%`,
    '--portrait-landmark-y': `-${presentation.source.face.y}%`,
    '--portrait-target-x': `${defaultFrame.anchor.x}%`,
    '--portrait-target-y': targetY(defaultFrame.anchor.y),
    '--portrait-width': `${defaultFrame.width}%`,
    '--portrait-stacked-target-x': `${stackedFrame.anchor.x}%`,
    '--portrait-stacked-target-y': targetY(stackedFrame.anchor.y),
    '--portrait-stacked-width': `${stackedFrame.width}%`,
    '--portrait-mobile-target-x': `${mobileFrame.anchor.x}%`,
    '--portrait-mobile-target-y': targetY(mobileFrame.anchor.y),
    '--portrait-mobile-width': `${mobileFrame.width}%`,
  }

  return (
    <span className="identity-art" aria-hidden="true">
      <img
        className="agent-art"
        src={PORTRAITS[agentId]}
        alt=""
        style={style}
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

function RankMark() {
  return <span className="rank-mark" aria-label="S Rank"><img src={rankSMark} alt="" /></span>
}

function IdentityMarks({ agentId, attribute, specialty }: { agentId: AgentId; attribute: string; specialty: string }) {
  const marks = IDENTITY_MARKS[agentId]

  return (
    <span className="identity-pair identity-pair--symbols" aria-label={`${attribute}, ${specialty}`}>
      <img src={marks.attribute} alt="" />
      <img src={marks.specialty} alt="" />
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
  const identityTone = `agent-${agentId}`
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
      aria-label={`Close ${agent.name} setup and Result${isIncomplete ? ', setup incomplete' : ''}`}
      onClick={onSelect}
      onKeyDown={onKeyDown}
      {...sourceToneEvents(identityTone, onSourceToneChange)}
    >
      <PortraitArt agentId={agent.id} variant="expanded" />
      <span className="identity-shade" aria-hidden="true" />
      <span className="source-tint" aria-hidden="true" />
      <span className="identity-copy">
        {isIncomplete && <span className="slot-incomplete-marker">Setup incomplete</span>}
        <strong className={`focus-marker ${isFocus ? '' : 'focus-marker--reserved'}`} aria-hidden={!isFocus}>Focus</strong>
        <span className="slot-name-line"><strong className="identity-name">{agent.name}</strong></span>
        <span className="identity-band">
          <RankMark />
          <IdentityMarks agentId={agent.id} attribute={agent.attribute} specialty={agent.specialty} />
        </span>
      </span>
    </button>
  )
}

function CompactSlot({ activeSourceTone, agentId, isFocus, isIncomplete = false, isInactive = false, isOverview = false, onSourceToneChange, onSelect, onKeyDown, slot }: SlotControlProps & { isInactive?: boolean; isOverview?: boolean }) {
  const agent = ADMITTED_AGENTS.find((item) => item.id === agentId)!
  const tone = `agent-${agentId}`
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
        ? `${agent.name} applied slot, inactive while editing party${isIncomplete ? ', setup incomplete' : ''}`
        : `View ${agent.name} setup and Result${isIncomplete ? ', setup incomplete' : ''}`}
      onClick={isInactive ? undefined : onSelect}
      onKeyDown={isInactive ? undefined : onKeyDown}
      {...sourceToneEvents(tone, onSourceToneChange)}
    >
      <PortraitArt agentId={agent.id} variant="compact" />
      <span className="identity-shade" aria-hidden="true" />
      <span className="source-tint" aria-hidden="true" />
      <span className="slot-identity">
        <span className="slot-name-line"><strong>{agent.name}</strong></span>
        <span className="identity-band">
          <RankMark />
          <IdentityMarks agentId={agent.id} attribute={agent.attribute} specialty={agent.specialty} />
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
        <span>Focus {'\u00B7'} {ADMITTED_AGENTS.find(({ id }) => id === slots[focusSlot].agentId)!.name}</span>
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
