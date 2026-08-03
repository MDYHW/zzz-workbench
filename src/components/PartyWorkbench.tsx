import { useEffect, useRef, type KeyboardEvent, type ReactNode } from 'react'
import dialynPortrait from '../assets/agents/dialyn.webp'
import luciaPortrait from '../assets/agents/lucia.webp'
import yixuanPortrait from '../assets/agents/yixuan.png'
import auricInkMark from '../assets/identity/attribute-auric-ink.png'
import rankSMark from '../assets/identity/rank-s.png'
import ruptureMark from '../assets/identity/specialty-rupture.png'
import { PARTY_AGENTS, type AgentId } from '../workbench/content'

const PORTRAITS: Record<AgentId, string> = {
  yixuan: yixuanPortrait,
  dialyn: dialynPortrait,
  lucia: luciaPortrait,
}

interface PartyWorkbenchProps {
  viewedAgentId: AgentId
  onViewAgent: (agentId: AgentId) => void
  children: ReactNode
}

function RankMark() {
  return <span className="rank-mark" aria-label="S Rank"><img src={rankSMark} alt="" /></span>
}

function IdentityMarks({ agentId, attribute, specialty }: { agentId: AgentId; attribute: string; specialty: string }) {
  if (agentId === 'yixuan') {
    return (
      <span className="identity-pair identity-pair--symbols" aria-label={`${attribute}, ${specialty}`}>
        <img src={auricInkMark} alt="" />
        <img src={ruptureMark} alt="" />
      </span>
    )
  }

  return (
    <span className="identity-pair identity-pair--text" aria-label={`${attribute}, ${specialty}`}>
      <span>{attribute}</span>
      <span>{specialty}</span>
    </span>
  )
}

interface SlotControlProps {
  agentId: AgentId
  onSelect: () => void
  onKeyDown: (event: KeyboardEvent<HTMLButtonElement>) => void
}

function ExpandedIdentity({ agentId, onSelect, onKeyDown }: SlotControlProps) {
  const agent = PARTY_AGENTS.find((item) => item.id === agentId)!

  return (
    <button
      type="button"
      id={`party-tab-${agent.id}`}
      className="slot-identity slot-identity--expanded"
      role="tab"
      aria-selected="true"
      aria-controls="party-panel"
      aria-label={`View ${agent.name} setup and Result`}
      onClick={onSelect}
      onKeyDown={onKeyDown}
    >
      <span className="identity-art" aria-hidden="true">
        <img className={`agent-art agent-art--${agent.id}`} src={PORTRAITS[agent.id]} alt="" />
      </span>
      <span className="identity-shade" aria-hidden="true" />
      <span className="identity-copy">
        <span className="slot-number">0{agent.order}</span>
        <strong className={`focus-marker ${agent.id === 'yixuan' ? '' : 'focus-marker--reserved'}`} aria-hidden={agent.id !== 'yixuan'}>Focus</strong>
        <span className="slot-name-line"><strong className="identity-name">{agent.name}</strong></span>
        <span className="role-line">{agent.roles.join(' \u00B7 ')}</span>
        <span className="identity-band">
          <RankMark />
          <IdentityMarks agentId={agent.id} attribute={agent.attribute} specialty={agent.specialty} />
        </span>
      </span>
    </button>
  )
}

function CompactSlot({ agentId, onSelect, onKeyDown }: SlotControlProps) {
  const agent = PARTY_AGENTS.find((item) => item.id === agentId)!

  return (
    <button
      type="button"
      id={`party-tab-${agent.id}`}
      className="party-slot party-slot--compact"
      role="tab"
      tabIndex={-1}
      aria-selected="false"
      aria-controls="party-panel"
      aria-label={`View ${agent.name} setup and Result`}
      onClick={onSelect}
      onKeyDown={onKeyDown}
    >
      <span className="identity-art" aria-hidden="true"><img className={`agent-art agent-art--${agent.id}`} src={PORTRAITS[agent.id]} alt="" /></span>
      <span className="identity-shade" aria-hidden="true" />
      <span className="slot-number">0{agent.order}</span>
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

export function PartyWorkbench({ viewedAgentId, onViewAgent, children }: PartyWorkbenchProps) {
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
                  agentId={agent.id}
                  onSelect={() => onViewAgent(agent.id)}
                  onKeyDown={(event) => navigateSlots(agent.id, event)}
                />
              ) : (
                <CompactSlot
                  agentId={agent.id}
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
