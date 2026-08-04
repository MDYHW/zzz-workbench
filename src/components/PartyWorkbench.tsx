import { useEffect, useRef, type CSSProperties, type KeyboardEvent, type ReactNode } from 'react'
import dialynPortrait from '../assets/agents/portraits/dialyn.webp'
import luciaPortrait from '../assets/agents/portraits/lucia.webp'
import yixuanPortrait from '../assets/agents/portraits/yixuan.webp'
import auricInkMark from '../assets/game/attributes/auric-ink.webp'
import etherMark from '../assets/game/attributes/ether.webp'
import physicalMark from '../assets/game/attributes/physical.webp'
import rankSMark from '../assets/game/ranks/s.webp'
import ruptureMark from '../assets/game/specialties/rupture.webp'
import stunMark from '../assets/game/specialties/stun.webp'
import supportMark from '../assets/game/specialties/support.webp'
import { PARTY_AGENTS, type AgentId } from '../workbench/content'

const PORTRAITS: Record<AgentId, string> = {
  yixuan: yixuanPortrait,
  dialyn: dialynPortrait,
  lucia: luciaPortrait,
}

const IDENTITY_MARKS: Record<AgentId, { attribute: string; specialty: string }> = {
  yixuan: { attribute: auricInkMark, specialty: ruptureMark },
  dialyn: { attribute: physicalMark, specialty: stunMark },
  lucia: { attribute: etherMark, specialty: supportMark },
}

type PortraitVariant = 'expanded' | 'compact'

interface PortraitPoint {
  x: number
  y: number
}

interface PortraitFrame {
  anchor: PortraitPoint
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
  anchor: { x: 38, y: 25.2 },
  width: 295,
}

const DESKTOP_COMPACT_PORTRAIT_FRAME: PortraitFrame = {
  anchor: { x: 50, y: 24 },
  width: 400,
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
      default: DESKTOP_COMPACT_PORTRAIT_FRAME,
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
      default: DESKTOP_COMPACT_PORTRAIT_FRAME,
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
      default: DESKTOP_COMPACT_PORTRAIT_FRAME,
      stacked: { anchor: { x: 49, y: 48 }, width: 100 },
      mobile: { anchor: { x: 48, y: 48 }, width: 200 },
    },
  },
}

function PortraitArt({ agentId, variant }: { agentId: AgentId; variant: PortraitVariant }) {
  const presentation = PORTRAIT_PRESENTATION[agentId]
  const target = presentation[variant]
  const defaultFrame = target.default
  const stackedFrame = target.stacked ?? defaultFrame
  const mobileFrame = target.mobile ?? stackedFrame
  const style: PortraitStyle = {
    '--portrait-landmark-x': `-${presentation.source.face.x}%`,
    '--portrait-landmark-y': `-${presentation.source.face.y}%`,
    '--portrait-target-x': `${defaultFrame.anchor.x}%`,
    '--portrait-target-y': `${defaultFrame.anchor.y}%`,
    '--portrait-width': `${defaultFrame.width}%`,
    '--portrait-stacked-target-x': `${stackedFrame.anchor.x}%`,
    '--portrait-stacked-target-y': `${stackedFrame.anchor.y}%`,
    '--portrait-stacked-width': `${stackedFrame.width}%`,
    '--portrait-mobile-target-x': `${mobileFrame.anchor.x}%`,
    '--portrait-mobile-target-y': `${mobileFrame.anchor.y}%`,
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

type SourceToneChannel = 'pointer' | 'focus'

interface PartyWorkbenchProps {
  activeSourceTone: string | null
  viewedAgentId: AgentId
  onSourceToneChange: (channel: SourceToneChannel, tone: string | null) => void
  onViewAgent: (agentId: AgentId) => void
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

interface SlotControlProps {
  activeSourceTone: string | null
  agentId: AgentId
  onSourceToneChange: (channel: SourceToneChannel, tone: string | null) => void
  onSelect: () => void
  onKeyDown: (event: KeyboardEvent<HTMLButtonElement>) => void
}

function ExpandedIdentity({ activeSourceTone, agentId, onSourceToneChange, onSelect, onKeyDown }: SlotControlProps) {
  const agent = PARTY_AGENTS.find((item) => item.id === agentId)!
  const identityTone = `agent-${agentId}`
  const identityTones = [identityTone, 'core', 'additional', 'ex-special']
  const matchingTone = identityTones.find((tone) => tone === activeSourceTone)
  const className = matchingTone
    ? `slot-identity slot-identity--expanded source-target source-tone--${matchingTone} is-source-active`
    : 'slot-identity slot-identity--expanded source-target'

  return (
    <button
      type="button"
      id={`party-tab-${agent.id}`}
      className={className}
      role="tab"
      aria-selected="true"
      aria-controls="party-panel"
      aria-label={`View ${agent.name} setup and Result`}
      onClick={onSelect}
      onKeyDown={onKeyDown}
      onMouseEnter={() => onSourceToneChange('pointer', identityTone)}
      onMouseLeave={() => onSourceToneChange('pointer', null)}
      onFocus={() => onSourceToneChange('focus', identityTone)}
      onBlur={() => onSourceToneChange('focus', null)}
    >
      <PortraitArt agentId={agent.id} variant="expanded" />
      <span className="identity-shade" aria-hidden="true" />
      <span className="source-tint" aria-hidden="true" />
      <span className="identity-copy">
        <strong className={`focus-marker ${agent.id === 'yixuan' ? '' : 'focus-marker--reserved'}`} aria-hidden={agent.id !== 'yixuan'}>Focus</strong>
        <span className="slot-name-line"><strong className="identity-name">{agent.name}</strong></span>
        <span className="identity-band">
          <RankMark />
          <IdentityMarks agentId={agent.id} attribute={agent.attribute} specialty={agent.specialty} />
        </span>
      </span>
    </button>
  )
}

function CompactSlot({ activeSourceTone, agentId, onSourceToneChange, onSelect, onKeyDown }: SlotControlProps) {
  const agent = PARTY_AGENTS.find((item) => item.id === agentId)!
  const tone = `agent-${agentId}`
  const className = `party-slot party-slot--compact source-target source-tone--${tone}${activeSourceTone === tone ? ' is-source-active' : ''}`

  return (
    <button
      type="button"
      id={`party-tab-${agent.id}`}
      className={className}
      role="tab"
      tabIndex={-1}
      aria-selected="false"
      aria-controls="party-panel"
      aria-label={`View ${agent.name} setup and Result`}
      onClick={onSelect}
      onKeyDown={onKeyDown}
      onMouseEnter={() => onSourceToneChange('pointer', tone)}
      onMouseLeave={() => onSourceToneChange('pointer', null)}
      onFocus={() => onSourceToneChange('focus', tone)}
      onBlur={() => onSourceToneChange('focus', null)}
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
      <strong className={`focus-marker ${agent.id === 'yixuan' ? '' : 'focus-marker--reserved'}`} aria-hidden={agent.id !== 'yixuan'}>Focus</strong>
    </button>
  )
}

export function PartyWorkbench({
  activeSourceTone,
  viewedAgentId,
  onSourceToneChange,
  onViewAgent,
  children,
}: PartyWorkbenchProps) {
  const previousViewedAgentId = useRef(viewedAgentId)

  useEffect(() => {
    if (previousViewedAgentId.current === viewedAgentId) return
    previousViewedAgentId.current = viewedAgentId
    document.getElementById(`party-tab-${viewedAgentId}`)?.focus()
  }, [viewedAgentId])

  const navigateSlots = (
    agentId: AgentId,
    event: KeyboardEvent<HTMLButtonElement>,
  ) => {
    const index = PARTY_AGENTS.findIndex((agent) => agent.id === agentId)
    let nextIndex: number | undefined

    if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
      nextIndex = (index + 1) % PARTY_AGENTS.length
    } else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
      nextIndex = (index - 1 + PARTY_AGENTS.length) % PARTY_AGENTS.length
    } else if (event.key === 'Home') {
      nextIndex = 0
    } else if (event.key === 'End') {
      nextIndex = PARTY_AGENTS.length - 1
    }

    if (nextIndex === undefined) return
    event.preventDefault()
    onViewAgent(PARTY_AGENTS[nextIndex].id)
  }
  return (
    <section className="party-section" aria-labelledby="party-heading">
      <div className="section-kicker">
        <h2 id="party-heading">Applied party</h2>
        <span>Focus {'\u00B7'} Yixuan</span>
      </div>
      <ol className={`party-rail party-rail--view-${viewedAgentId}`} role="tablist" aria-label="Applied party slots">
        {PARTY_AGENTS.map((agent) => {
          const selected = agent.id === viewedAgentId

          return (
            <li
              key={agent.id}
              role="presentation"
              className={selected ? 'party-slot party-slot--expanded' : undefined}
            >
              {selected ? (
                <ExpandedIdentity
                  activeSourceTone={activeSourceTone}
                  agentId={agent.id}
                  onSourceToneChange={onSourceToneChange}
                  onSelect={() => onViewAgent(agent.id)}
                  onKeyDown={(event) => navigateSlots(agent.id, event)}
                />
              ) : (
                <CompactSlot
                  activeSourceTone={activeSourceTone}
                  agentId={agent.id}
                  onSourceToneChange={onSourceToneChange}
                  onSelect={() => onViewAgent(agent.id)}
                  onKeyDown={(event) => navigateSlots(agent.id, event)}
                />
              )}
              {selected && (
                <div
                  id="party-panel"
                  className="expanded-slot__workbench"
                  role="tabpanel"
                  aria-labelledby={`party-tab-${agent.id}`}
                  data-agent={agent.id}
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
