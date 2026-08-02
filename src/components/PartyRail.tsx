import { PARTY_AGENTS, W_ENGINES } from '../workbench/content'
import type { WorkbenchState } from '../workbench/state'

interface PartyRailProps {
  state: WorkbenchState
}

function AgentPortrait({ name, mark, accent }: { name: string; mark: string; accent: string }) {
  return (
    <svg className="agent-portrait" viewBox="0 0 100 100" role="img" aria-label={`${name} portrait`}>
      <rect width="100" height="100" fill={accent} />
      <path d="M-8 91 L67 16 L112 16 L35 100 Z" fill="#111715" opacity="0.88" />
      <circle cx="58" cy="36" r="18" fill="#ebe4d4" />
      <path d="M30 91 Q37 55 59 55 Q83 55 94 91 Z" fill="#ebe4d4" />
      <text x="12" y="26" fill="#fff" fontSize="18" fontWeight="800">{mark}</text>
      <path d="M7 80 H33" stroke="#fff" strokeWidth="3" />
    </svg>
  )
}

function RankMark() {
  return (
    <svg className="rank-mark" viewBox="0 0 32 32" role="img" aria-label="S Rank">
      <path d="M16 1 30 9v14l-14 8L2 23V9Z" fill="currentColor" />
      <path d="M22 9c-3-2-10-2-10 2 0 3 9 1 9 6 0 5-8 6-12 3" fill="none" stroke="#111715" strokeWidth="3" />
    </svg>
  )
}

function IdentityMark({ text }: { text: string }) {
  return (
    <svg className="identity-mark" viewBox="0 0 24 24" role="img" aria-label={text}>
      <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeWidth="2" />
      <path d="M6 12h12M12 6v12" stroke="currentColor" strokeWidth="1.4" opacity="0.7" />
    </svg>
  )
}

export function PartyRail({ state }: PartyRailProps) {
  return (
    <section className="party-section" aria-labelledby="party-heading">
      <div className="section-kicker">
        <h2 id="party-heading">Applied party</h2>
        <span>Focus · Yixuan</span>
      </div>

      <ol className="party-rail">
        {PARTY_AGENTS.map((agent) => {
          const isTarget = agent.id === 'yixuan'
          const engineName = isTarget && state.engineId
            ? W_ENGINES[state.engineId].name
            : agent.engine.name
          const refinement = isTarget ? state.refinement : agent.engine.refinement

          return (
            <li key={agent.id} className={`party-slot ${isTarget ? 'party-slot--active' : ''}`}>
              <div className="slot-cut" aria-hidden="true" />
              <span className="slot-number">0{agent.order}</span>
              <AgentPortrait name={agent.name} mark={agent.portraitMark} accent={agent.accent} />

              <div className="slot-identity">
                <div className="slot-name-line">
                  <h3>{agent.name}</h3>
                  <RankMark />
                </div>
                <div className="identity-pair">
                  <span><IdentityMark text={agent.attribute} />{agent.attribute}</span>
                  <span><IdentityMark text={agent.specialty} />{agent.specialty}</span>
                </div>
                <div className="role-line">{agent.roles.join(' · ')}</div>
              </div>

              <div className="slot-setup" aria-label={`${agent.name} prepared setup`}>
                <div className="setup-tag-row">
                  <span>{agent.mindscape}</span>
                  <span>{isTarget ? (state.pool === 'full' ? 'Full pool' : 'Non-limited') : agent.pool}</span>
                  {isTarget && <strong>FOCUS</strong>}
                </div>
                <p className="slot-engine">{engineName} <b>{refinement}</b></p>
                <p>{agent.equipment.fourPiece} 4 · {agent.equipment.twoPiece} 2</p>
                {!isTarget && (
                  <p className="slot-mains">
                    D4 {agent.equipment.mains.slot4.split(' +')[0]} · D5 {agent.equipment.mains.slot5.split(' +')[0]} · D6 {agent.equipment.mains.slot6.split(' +')[0]}
                  </p>
                )}
              </div>
            </li>
          )
        })}
      </ol>
    </section>
  )
}
